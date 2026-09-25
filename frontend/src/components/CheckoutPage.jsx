import { useEffect, useMemo, useRef, useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function CheckoutPage() {
  const [products, setProducts] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState([]);
  const [heldOrders, setHeldOrders] = useState([]);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [cashTendered, setCashTendered] = useState("");
  const [message, setMessage] = useState("");
  const [receipt, setReceipt] = useState(null);

  const barcodeInputRef = useRef(null);
  const quantityInputRef = useRef(null);
  const discountInputRef = useRef(null);
  const checkoutButtonRef = useRef(null);

  async function loadProducts() {
    try {
      const response = await fetch(`${API_URL}/products/`);

      if (!response.ok) {
        throw new Error("Could not load products.");
      }

      const data = await response.json();
      const activeProducts = data.filter((product) => product.is_active);

      setProducts(activeProducts);

      if (activeProducts.length > 0) {
        setSelectedProductId((currentId) =>
          currentId ? currentId : String(activeProducts[0].id)
        );
      }
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function loadHeldOrders() {
    try {
      const response = await fetch(`${API_URL}/held-orders/`);

      if (!response.ok) {
        throw new Error("Could not load held orders.");
      }

      const data = await response.json();
      setHeldOrders(data);
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    loadProducts();
    loadHeldOrders();
  }, []);

  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyboardShortcuts(event) {
      if (event.key === "F1") {
        event.preventDefault();
        barcodeInputRef.current?.focus();
      }

      if (event.key === "F2") {
        event.preventDefault();
        quantityInputRef.current?.focus();
      }

      if (event.key === "F3") {
        event.preventDefault();
        discountInputRef.current?.focus();
      }

      if (event.key === "F4") {
        event.preventDefault();
        checkoutButtonRef.current?.focus();
      }

      if (event.key === "Escape") {
        event.preventDefault();
        clearBasket();
      }
    }

    window.addEventListener("keydown", handleKeyboardShortcuts);

    return () => {
      window.removeEventListener("keydown", handleKeyboardShortcuts);
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const search = searchValue.trim().toLowerCase();

    if (!search) {
      return products;
    }

    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(search) ||
        product.sku.toLowerCase().includes(search)
    );
  }, [products, searchValue]);

  const subtotal = useMemo(() => {
    return cart.reduce(
      (total, item) => total + Number(item.price) * item.quantity,
      0
    );
  }, [cart]);

  const safeDiscountPercentage = Math.min(
    Math.max(Number(discountPercentage) || 0, 0),
    100
  );

  const discountAmount = (subtotal * safeDiscountPercentage) / 100;
  const totalAmount = subtotal - discountAmount;
  const cashReceived = Number(cashTendered) || 0;

  const changeDue =
    paymentMethod === "cash" && cashReceived > totalAmount
      ? cashReceived - totalAmount
      : 0;

  function addProductToCart(product, selectedQuantity = quantity) {
    const requestedQuantity = Number(selectedQuantity);

    if (!requestedQuantity || requestedQuantity < 1) {
      setMessage("Quantity must be at least 1.");
      return;
    }

    if (requestedQuantity > product.stock_quantity) {
      setMessage(`Only ${product.stock_quantity} unit(s) available.`);
      return;
    }

    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.id === product.id);

      if (existingItem) {
        const newQuantity = existingItem.quantity + requestedQuantity;

        if (newQuantity > product.stock_quantity) {
          setMessage(`Only ${product.stock_quantity} unit(s) available.`);
          return currentCart;
        }

        return currentCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: newQuantity }
            : item
        );
      }

      return [
        ...currentCart,
        {
          ...product,
          quantity: requestedQuantity,
        },
      ];
    });

    setMessage("");
    setSearchValue("");
    setQuantity(1);
    barcodeInputRef.current?.focus();
  }

  function addSelectedProduct() {
    const product = products.find(
      (item) => item.id === Number(selectedProductId)
    );

    if (!product) {
      setMessage("Please select a product.");
      return;
    }

    addProductToCart(product);
  }

  function handleBarcodeKeyDown(event) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    const code = searchValue.trim().toLowerCase();

    if (!code) {
      return;
    }

    const matchedProduct = products.find(
      (product) =>
        product.sku.toLowerCase() === code ||
        product.name.toLowerCase() === code
    );

    if (!matchedProduct) {
      setMessage("No product found for this barcode or search value.");
      return;
    }

    addProductToCart(matchedProduct);
  }

  function updateCartQuantity(productId, newQuantity) {
    const numericQuantity = Number(newQuantity);

    if (!numericQuantity || numericQuantity < 1) {
      return;
    }

    const product = products.find((item) => item.id === productId);

    if (product && numericQuantity > product.stock_quantity) {
      setMessage(`Only ${product.stock_quantity} unit(s) available.`);
      return;
    }

    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === productId
          ? { ...item, quantity: numericQuantity }
          : item
      )
    );
  }

  function removeFromCart(productId) {
    setCart((currentCart) =>
      currentCart.filter((item) => item.id !== productId)
    );
  }

  function clearBasket() {

    setCart([]);
    setDiscountPercentage(0);
    setCashTendered("");
    setReceipt(null);
    setMessage("Basket cleared.");
    barcodeInputRef.current?.focus();

  }

  async function holdCurrentOrder() {
    if (cart.length === 0) {
      setMessage("Add at least one product before holding an order.");
      return;
    }

    try {
      setMessage("");
      setReceipt(null);

      const response = await fetch(`${API_URL}/held-orders/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: cart,
          discount_percentage: safeDiscountPercentage,
          payment_method: paymentMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not hold the order.");
      }

      setCart([]);
      setDiscountPercentage(0);
      setSearchValue("");
      setMessage(`${data.hold_number} saved successfully.`);
      await loadHeldOrders();
      barcodeInputRef.current?.focus();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function deleteHeldOrder(heldOrderId) {
    const response = await fetch(
      `${API_URL}/held-orders/${heldOrderId}`,
      {
        method: "DELETE",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Could not delete held order.");
    }

    await loadHeldOrders();
  }

  async function resumeHeldOrder(heldOrder) {
    const unavailableItem = heldOrder.items.find((item) => {
      const currentProduct = products.find(
        (product) => product.id === item.id
      );

      return (
        !currentProduct ||
        currentProduct.stock_quantity < item.quantity
      );
    });

    if (unavailableItem) {
      setMessage(
        `Cannot resume order: ${unavailableItem.name} does not have enough stock.`
      );
      return;
    }

    try {
      await deleteHeldOrder(heldOrder.id);

      setCart(
        heldOrder.items.map((item) => ({
          ...item,
          price: Number(item.price),
        }))
      );

      setDiscountPercentage(heldOrder.discount_percentage);
      setPaymentMethod(heldOrder.payment_method);
      setReceipt(null);
      setSearchValue("");
      setMessage(`${heldOrder.hold_number} resumed successfully.`);
      barcodeInputRef.current?.focus();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleDeleteHeldOrder(heldOrderId) {
    const shouldDelete = window.confirm(
      "Do you want to permanently delete this held order?"
    );

    if (!shouldDelete) {
      return;
    }

    try {
      await deleteHeldOrder(heldOrderId);
      setMessage("Held order deleted successfully.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function completeSale(event) {
    event.preventDefault();

    if (cart.length === 0) {
      setMessage("Add at least one product to the basket.");
      return;
    }
    if (paymentMethod === "cash" && cashReceived < totalAmount) {
      setMessage(
        `Cash received must be at least PKR ${totalAmount.toLocaleString()}.`
      );
      return;
    }

    try {
      setMessage("");

      const response = await fetch(`${API_URL}/sales/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: cart.map((item) => ({
            product_id: item.id,
            quantity: item.quantity,
          })),
          payment_method: paymentMethod,
          discount: discountAmount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not complete sale.");
      }
      setReceipt(data);

      // setReceipt({
      //   ...data,
      //   cash_received: paymentMethod === "cash" ? cashReceived : null,
      //   change_due: paymentMethod === "cash" ? changeDue : null,
      // });
      setCart([]);
      setDiscountPercentage(0);
      setCashTendered("");
      setSearchValue("");
      setMessage("Sale completed successfully.");
      await loadProducts();
      barcodeInputRef.current?.focus();
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <section className="welcome-card">
      <h3>POS Checkout</h3>

      <p className="checkout-help">
        F1: Product search | F2: Quantity | F3: Discount % | F4:
        Checkout | ESC: Clear basket
      </p>

      <div className="checkout-grid">
        <div>
          <label className="checkout-label">
            Barcode / Product Search
            <input
              ref={barcodeInputRef}
              className="barcode-input"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              onKeyDown={handleBarcodeKeyDown}
              placeholder="Scan barcode, SKU, or type product name"
            />
          </label>

          <label className="checkout-label">
            Product
            <select
              value={selectedProductId}
              onChange={(event) => setSelectedProductId(event.target.value)}
            >
              {filteredProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} — PKR {product.price} — Stock:{" "}
                  {product.stock_quantity}
                </option>
              ))}
            </select>
          </label>

          <label className="checkout-label">
            Quantity
            <input
              ref={quantityInputRef}
              type="number"
              min="1"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
          </label>

          <button
            type="button"
            className="primary-button"
            onClick={addSelectedProduct}
          >
            Add to Basket
          </button>
        </div>

        <div className="basket-panel">
          <h4>Current Basket</h4>

          {cart.length === 0 ? (
            <p className="empty-basket">No items added yet.</p>
          ) : (
            <div className="basket-list">
              {cart.map((item) => (
                <div className="basket-item" key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <small>
                      PKR {Number(item.price).toLocaleString()} each
                    </small>
                  </div>

                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(event) =>
                      updateCartQuantity(item.id, event.target.value)
                    }
                  />

                  <strong>
                    PKR{" "}
                    {(Number(item.price) * item.quantity).toLocaleString()}
                  </strong>

                  <button
                    type="button"
                    className="delete-button"
                    onClick={() => removeFromCart(item.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="checkout-summary">
            <p>
              <span>Subtotal</span>
              <strong>PKR {subtotal.toLocaleString()}</strong>
            </p>

            <label className="checkout-label">
              Discount Percentage
              <input
                ref={discountInputRef}
                type="number"
                min="0"
                max="100"
                value={discountPercentage}
                onChange={(event) =>
                  setDiscountPercentage(event.target.value)
                }
                placeholder="Example: 10 means 10% discount"
              />
            </label>

            <p>
              <span>Discount</span>
              <strong>PKR {discountAmount.toLocaleString()}</strong>
            </p>

            <p className="grand-total">
              <span>Total Amount</span>
              <strong>PKR {totalAmount.toLocaleString()}</strong>
            </p>

            <label className="checkout-label">
              Payment Method
              <select
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="easypaisa">EasyPaisa</option>
                <option value="jazzcash">JazzCash</option>
              </select>
            </label>
            {paymentMethod === "cash" && (
              <>
                <label className="checkout-label">
                  Cash Received
                  <input
                    type="number"
                    min="0"
                    value={cashTendered}
                    onChange={(event) => setCashTendered(event.target.value)}
                    placeholder="Enter cash received from customer"
                  />
                </label>

                <p className="change-due">
                  <span>Change Due</span>
                  <strong>PKR {changeDue.toLocaleString()}</strong>
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <form className="checkout-form" onSubmit={completeSale}>
        <div className="action-buttons">
          <button
            ref={checkoutButtonRef}
            className="primary-button"
            type="submit"
          >
            Complete Sale
          </button>

          <button
            className="secondary-button"
            type="button"
            onClick={holdCurrentOrder}
          >
            Hold Current Order
          </button>

          <button
            className="delete-button"
            type="button"
            onClick={clearBasket}
          >
            Clear Basket
          </button>
        </div>
      </form>

      <section className="held-orders-panel">
        <div className="held-orders-heading">
          <h4>Held Orders</h4>
          <span>{heldOrders.length}</span>
        </div>

        {heldOrders.length === 0 ? (
          <p className="empty-basket">No held orders available.</p>
        ) : (
          <div className="held-orders-list">
            {heldOrders.map((order) => {
              const orderTotal = order.items.reduce(
                (total, item) =>
                  total + Number(item.price) * item.quantity,
                0
              );

              return (
                <div className="held-order-item" key={order.id}>
                  <div>
                    <strong>{order.hold_number}</strong>
                    <small>
                      {order.items.length} item(s) · PKR{" "}
                      {orderTotal.toLocaleString()}
                    </small>
                  </div>

                  <div className="held-order-actions">
                    <button
                      className="primary-button"
                      type="button"
                      onClick={() => resumeHeldOrder(order)}
                    >
                      Resume
                    </button>

                    <button
                      className="delete-button"
                      type="button"
                      onClick={() => handleDeleteHeldOrder(order.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {message && <p className="checkout-message">{message}</p>}

      {receipt && (
        <section className="receipt-card">
          <h3>Sale Receipt</h3>

          <div className="receipt-details">
            <p>
              <strong>Sale Number:</strong> {receipt.sale_number}
            </p>

            <p>
              <strong>Payment:</strong> {receipt.payment_method}
            </p>
          </div>

          <div className="receipt-table-wrapper">
            <table className="receipt-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Unit Price</th>
                  <th>Quantity</th>
                  <th>Line Total</th>
                </tr>
              </thead>

              <tbody>
                {receipt.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.product_name}</td>
                    <td>
                      PKR {Number(item.unit_price).toLocaleString()}
                    </td>
                    <td>{item.quantity}</td>
                    <td>
                      PKR {Number(item.line_total).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="receipt-totals">
            <p>
              <span>Subtotal</span>
              <strong>
                PKR {Number(receipt.subtotal).toLocaleString()}
              </strong>
            </p>

            <p>
              <span>Discount</span>
              <strong>
                PKR {Number(receipt.discount).toLocaleString()}
              </strong>
            </p>

            <p className="receipt-grand-total">
              <span>Total Amount</span>
              <strong>
                PKR {Number(receipt.total_amount).toLocaleString()}
              </strong>
            </p>
            {receipt.payment_method === "cash" && (
              <>
                {/* <p>
                  <span>Cash Received</span>
                  <strong>
                    PKR {Number(receipt.cash_received).toLocaleString()}
                  </strong>
                </p>

                <p className="receipt-grand-total">
                  <span>Change Due</span>
                  <strong>
                    PKR {Number(receipt.change_due).toLocaleString()}
                  </strong>
                </p> */}
              </>
            )}
          </div>
        </section>
      )}
    </section>
  );
}

export default CheckoutPage;