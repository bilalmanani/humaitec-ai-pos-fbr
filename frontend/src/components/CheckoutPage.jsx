import { useEffect, useMemo, useRef, useState } from "react";
import "./CheckoutPage.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function CheckoutPage() {
  const [products, setProducts] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState([]);
  const [heldOrders, setHeldOrders] = useState([]);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [cashTendered, setCashTendered] = useState("");
  const [message, setMessage] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");

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
        product.sku.toLowerCase().includes(search) ||
        product.category.toLowerCase().includes(search)
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
      setCashTendered("");
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
      setCashTendered("");
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
  const categories = useMemo(() => {
    return [
      "All",
      ...new Set(
        products
          .map((product) => product.category || "General")
          .filter(Boolean)
      ),
    ];
  }, [products]);

  const visibleProducts = useMemo(() => {
    if (activeCategory === "All") {
      return filteredProducts;
    }

    return filteredProducts.filter(
      (product) => (product.category || "General") === activeCategory
    );
  }, [filteredProducts, activeCategory]);

  return (
    <section className="odoo-pos-page">
      <header className="odoo-pos-header">
        <div>
          <p className="eyebrow">POINT OF SALE</p>
          <h3>New Order</h3>
          <p>Search products, create an order, then collect payment.</p>
        </div>

        <div className="odoo-shortcuts">
          <button type="button" onClick={() => barcodeInputRef.current?.focus()}>
            F1 Search
          </button>

          <button type="button" onClick={() => quantityInputRef.current?.focus()}>
            F2 Qty
          </button>

          <button type="button" onClick={() => discountInputRef.current?.focus()}>
            F3 Discount
          </button>

          <button type="button" onClick={() => checkoutButtonRef.current?.focus()}>
            F4 Pay
          </button>

          <button type="button" onClick={clearBasket}>
            ESC Clear
          </button>
        </div>
      </header>

      <div className="odoo-pos-workspace">
        <section className="odoo-products-workspace">
          <div className="odoo-search-area">
            <div className="odoo-search-box">
              <span>⌕</span>
              <input
                ref={barcodeInputRef}
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                onKeyDown={handleBarcodeKeyDown}
                placeholder="Scan barcode, SKU, or search product"
              />
            </div>

            <label className="odoo-qty-field">
              <span>Quantity</span>
              <input
                ref={quantityInputRef}
                type="number"
                min="1"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </label>
          </div>

          <div className="odoo-category-bar">
            {categories.map((category) => (
              <button
                type="button"
                key={category}
                className={
                  activeCategory === category
                    ? "odoo-category active"
                    : "odoo-category"
                }
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="odoo-products-title">
            <h4>Products</h4>
            <span>{visibleProducts.length} products</span>
          </div>

          <div className="odoo-product-grid">
            {visibleProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                className="odoo-product-card"
                disabled={product.stock_quantity <= 0}
                onClick={() => addProductToCart(product)}
              >
                <span className="odoo-product-category">
                  {product.category || "General"}
                </span>

                <strong>{product.name}</strong>
                <small>{product.sku}</small>

                <footer>
                  <b>PKR {Number(product.price).toLocaleString()}</b>
                  <span>Stock {product.stock_quantity}</span>
                </footer>
              </button>
            ))}

            {visibleProducts.length === 0 && (
              <p className="odoo-empty-products">
                No product found. Try another search or category.
              </p>
            )}
          </div>
        </section>

        <aside className="odoo-order-panel">
          <div className="odoo-order-header">
            <div>
              <h4>Current Order</h4>
              <span>{cart.length} item(s)</span>
            </div>

            {cart.length > 0 && (
              <button
                type="button"
                className="odoo-clear-order"
                onClick={clearBasket}
              >
                Clear
              </button>
            )}
          </div>

          <div className="odoo-order-lines">
            {cart.length === 0 ? (
              <div className="odoo-empty-order">
                <span>⌁</span>
                <strong>No items in this order</strong>
                <small>Select a product from the left side.</small>
              </div>
            ) : (
              cart.map((item) => (
                <article className="odoo-order-line" key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <small>PKR {Number(item.price).toLocaleString()} each</small>
                  </div>

                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(event) =>
                      updateCartQuantity(item.id, event.target.value)
                    }
                  />

                  <b>
                    PKR {(Number(item.price) * item.quantity).toLocaleString()}
                  </b>

                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    title={`Remove ${item.name}`}
                  >
                    ×
                  </button>
                </article>
              ))
            )}
          </div>

          <div className="odoo-order-summary">
            <div className="odoo-summary-row">
              <span>Subtotal</span>
              <strong>PKR {subtotal.toLocaleString()}</strong>
            </div>

            <label className="odoo-payment-field">
              Discount percentage
              <input
                ref={discountInputRef}
                type="number"
                min="0"
                max="100"
                value={discountPercentage}
                onChange={(event) => setDiscountPercentage(event.target.value)}
              />
            </label>

            <div className="odoo-summary-row discount">
              <span>Discount ({safeDiscountPercentage}%)</span>
              <strong>- PKR {discountAmount.toLocaleString()}</strong>
            </div>

            <div className="odoo-grand-total">
              <span>Total</span>
              <strong>PKR {totalAmount.toLocaleString()}</strong>
            </div>

            <label className="odoo-payment-field">
              Payment method
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
                <label className="odoo-payment-field">
                  Cash received
                  <input
                    type="number"
                    min="0"
                    value={cashTendered}
                    onChange={(event) => setCashTendered(event.target.value)}
                    placeholder="Enter amount received"
                  />
                </label>

                <div className="odoo-change-row">
                  <span>Change due</span>
                  <strong>PKR {changeDue.toLocaleString()}</strong>
                </div>
              </>
            )}
          </div>

          <form className="odoo-order-actions" onSubmit={completeSale}>
            <button
              ref={checkoutButtonRef}
              className="odoo-pay-button"
              type="submit"
            >
              Pay · PKR {totalAmount.toLocaleString()}
            </button>

            <button
              className="odoo-hold-button"
              type="button"
              onClick={holdCurrentOrder}
            >
              Hold Order
            </button>
          </form>
        </aside>
      </div>

      <section className="odoo-held-orders">
        <div className="odoo-held-header">
          <div>
            <h4>Held Orders</h4>
            <p>Saved orders waiting for the next customer or payment.</p>
          </div>
          <span>{heldOrders.length}</span>
        </div>

        {heldOrders.length === 0 ? (
          <p className="empty-basket">No held orders available.</p>
        ) : (
          <div className="odoo-held-list">
            {heldOrders.map((order) => {
              const orderTotal = order.items.reduce(
                (total, item) => total + Number(item.price) * item.quantity,
                0
              );

              return (
                <article className="odoo-held-ticket" key={order.id}>
                  <div>
                    <strong>{order.hold_number}</strong>
                    <small>
                      {order.items.length} item(s) · PKR{" "}
                      {orderTotal.toLocaleString()}
                    </small>
                  </div>

                  <div>
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
                </article>
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
                    <td>PKR {Number(item.unit_price).toLocaleString()}</td>
                    <td>{item.quantity}</td>
                    <td>PKR {Number(item.line_total).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="receipt-totals">
            <p>
              <span>Subtotal</span>
              <strong>PKR {Number(receipt.subtotal).toLocaleString()}</strong>
            </p>
            <p>
              <span>Discount</span>
              <strong>PKR {Number(receipt.discount).toLocaleString()}</strong>
            </p>
            <p className="receipt-grand-total">
              <span>Total Amount</span>
              <strong>
                PKR {Number(receipt.total_amount).toLocaleString()}
              </strong>
            </p>
          </div>
        </section>
      )}
    </section>
  );
}

export default CheckoutPage;