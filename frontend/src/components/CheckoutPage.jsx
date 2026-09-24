import { useEffect, useMemo, useRef, useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function CheckoutPage() {
  const [products, setProducts] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState([]);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
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
      setProducts(data);

      if (data.length > 0) {
        setSelectedProductId(String(data[0].id));
      }
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleHotkeys(event) {
      if (event.key === "F1") {
        event.preventDefault();
        barcodeInputRef.current?.focus();
      }

      if (event.key === "F2") {
        event.preventDefault();
        quantityInputRef.current?.focus();
        quantityInputRef.current?.select();
      }

      if (event.key === "F3") {
        event.preventDefault();
        discountInputRef.current?.focus();
        discountInputRef.current?.select();
      }

      if (event.key === "F4") {
        event.preventDefault();
        checkoutButtonRef.current?.click();
      }

      if (event.key === "Escape") {
        event.preventDefault();
        clearBasket();
      }
    }

    window.addEventListener("keydown", handleHotkeys);

    return () => {
      window.removeEventListener("keydown", handleHotkeys);
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    if (!query) {
      return products;
    }

    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query)
    );
  }, [products, searchValue]);

  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const safeDiscountPercentage = Math.min(
    Math.max(Number(discountPercentage) || 0, 0),
    100
  );

  const discountAmount = Number(
    ((subtotal * safeDiscountPercentage) / 100).toFixed(2)
  );

  const totalAmount = Math.max(subtotal - discountAmount, 0);

  function addProductToCart(product) {
    if (!product) {
      setMessage("Please select a product.");
      return;
    }

    const requestedQuantity = Number(quantity);

    if (requestedQuantity < 1) {
      setMessage("Quantity must be at least 1.");
      return;
    }

    const existingItem = cart.find((item) => item.id === product.id);
    const currentQuantity = existingItem ? existingItem.quantity : 0;

    if (currentQuantity + requestedQuantity > product.stock_quantity) {
      setMessage(
        `Only ${product.stock_quantity} unit(s) of ${product.name} are available.`
      );
      return;
    }

    setCart((currentCart) => {
      const itemExists = currentCart.find((item) => item.id === product.id);

      if (itemExists) {
        return currentCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + requestedQuantity }
            : item
        );
      }

      return [
        ...currentCart,
        {
          id: product.id,
          name: product.name,
          sku: product.sku,
          price: Number(product.price),
          stock_quantity: product.stock_quantity,
          quantity: requestedQuantity,
        },
      ];
    });

    setMessage(`${product.name} added to basket.`);
    setQuantity(1);
    setSearchValue("");
    barcodeInputRef.current?.focus();
  }

  function handleBarcodeEnter(event) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    const scannedSku = searchValue.trim().toLowerCase();

    const product = products.find(
      (item) => item.sku.toLowerCase() === scannedSku
    );

    if (!product) {
      setMessage("SKU was not found. Press F1 and search by product name.");
      return;
    }

    addProductToCart(product);
  }

  function updateCartQuantity(productId, newQuantity) {
    const product = products.find((item) => item.id === productId);
    const numericQuantity = Number(newQuantity);

    if (!product || numericQuantity < 1) {
      return;
    }

    if (numericQuantity > product.stock_quantity) {
      setMessage(`Only ${product.stock_quantity} unit(s) are available.`);
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

  function removeCartItem(productId) {
    setCart((currentCart) =>
      currentCart.filter((item) => item.id !== productId)
    );
  }

  function clearBasket() {
    setCart([]);
    setDiscountPercentage(0);
    setReceipt(null);
    setMessage("Basket cleared.");
    barcodeInputRef.current?.focus();
  }

  async function handleCheckout(event) {
    event.preventDefault();

    if (cart.length === 0) {
      setMessage("Add at least one product before checkout.");
      barcodeInputRef.current?.focus();
      return;
    }

    setMessage("");
    setReceipt(null);

    try {
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
        throw new Error(data.detail || "Checkout failed.");
      }

      setReceipt(data);
      setMessage("Sale completed successfully.");
      setCart([]);
      setDiscountPercentage(0);
      setSearchValue("");

      await loadProducts();
      barcodeInputRef.current?.focus();
    } catch (error) {
      setMessage(error.message);
    }
  }

  const selectedProduct = products.find(
    (product) => product.id === Number(selectedProductId)
  );

  return (
    <section className="welcome-card">
      <h3>Fast POS Checkout</h3>

      <p className="checkout-help">
        Scanner ready: scan an SKU and press Enter. Hotkeys: F1 Lookup, F2
        Quantity, F3 Discount, F4 Checkout, ESC Clear Basket.
      </p>

      <div className="checkout-grid">
        <div>
          <label className="checkout-label">
            Barcode / SKU / Product Search
            <input
              ref={barcodeInputRef}
              className="barcode-input"
              type="text"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              onKeyDown={handleBarcodeEnter}
              placeholder="Scan barcode or type product name"
            />
          </label>

          <label className="checkout-label">
            Product Lookup
            <select
              value={selectedProductId}
              onChange={(event) => setSelectedProductId(event.target.value)}
            >
              {filteredProducts.length === 0 ? (
                <option value="">No product found</option>
              ) : (
                filteredProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} — {product.sku} — PKR {product.price} —
                    Stock: {product.stock_quantity}
                  </option>
                ))
              )}
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
            className="secondary-button"
            type="button"
            onClick={() => addProductToCart(selectedProduct)}
          >
            Add Item to Basket
          </button>
        </div>

        <div className="basket-panel">
          <h4>Active Basket</h4>

          {cart.length === 0 ? (
            <p className="empty-basket">No items added yet.</p>
          ) : (
            <div className="basket-list">
              {cart.map((item) => (
                <div className="basket-item" key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <small>
                      {item.sku} · PKR {item.price.toLocaleString()}
                    </small>
                  </div>

                  <input
                    type="number"
                    min="1"
                    max={item.stock_quantity}
                    value={item.quantity}
                    onChange={(event) =>
                      updateCartQuantity(item.id, event.target.value)
                    }
                  />

                  <strong>
                    PKR {(item.price * item.quantity).toLocaleString()}
                  </strong>

                  <button
                    className="delete-button"
                    type="button"
                    onClick={() => removeCartItem(item.id)}
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
              Basket Discount % (F3)
              <input
                ref={discountInputRef}
                type="number"
                min="0"
                max="100"
                value={discountPercentage}
                onChange={(event) =>
                  setDiscountPercentage(event.target.value)
                }
                placeholder="Example: 10 means 10%"
              />
            </label>

            <p className="discount-readout">
              Discount: {safeDiscountPercentage}% — PKR{" "}
              {discountAmount.toLocaleString()}
            </p>

            <p className="grand-total">
              <span>Total</span>
              <strong>PKR {totalAmount.toLocaleString()}</strong>
            </p>
          </div>
        </div>
      </div>

      <form className="checkout-form" onSubmit={handleCheckout}>
        <label>
          Payment Method
          <select
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value)}
          >
            <option value="cash">Cash</option>
            <option value="card">Credit / Debit Card</option>
            <option value="online">Online Payment</option>
          </select>
        </label>

        <div className="action-buttons">
          <button
            ref={checkoutButtonRef}
            className="primary-button"
            type="submit"
          >
            Complete Sale (F4)
          </button>

          <button
            className="delete-button"
            type="button"
            onClick={clearBasket}
          >
            Clear Basket (ESC)
          </button>
        </div>
      </form>

      {message && <p className="checkout-message">{message}</p>}

      {receipt && (
        <div className="receipt-card">
          <h4>Sale Receipt</h4>
          <p>
            <strong>Sale Number:</strong> {receipt.sale_number}
          </p>
          <p>
            <strong>Payment:</strong> {receipt.payment_method}
          </p>
          <p>
            <strong>Total Amount:</strong> PKR {receipt.total_amount}
          </p>
        </div>
      )}
    </section>
  );
}

export default CheckoutPage;