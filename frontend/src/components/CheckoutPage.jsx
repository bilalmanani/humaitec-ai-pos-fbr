import { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:8000";

function CheckoutPage() {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [message, setMessage] = useState("");
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    async function loadProducts() {
      const response = await fetch(`${API_URL}/products/`);
      const data = await response.json();

      setProducts(data);

      if (data.length > 0) {
        setSelectedProductId(data[0].id);
      }
    }

    loadProducts();
  }, []);

  async function handleCheckout(event) {
    event.preventDefault();

    setMessage("");
    setReceipt(null);

    try {
      const response = await fetch(`${API_URL}/sales/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [
            {
              product_id: Number(selectedProductId),
              quantity: Number(quantity),
            },
          ],
          payment_method: paymentMethod,
          discount: 0,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Checkout failed.");
      }

      setReceipt(data);
      setMessage("Sale completed successfully.");

      const productsResponse = await fetch(`${API_URL}/products/`);
      const updatedProducts = await productsResponse.json();
      setProducts(updatedProducts);
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <section className="welcome-card">
      <h3>POS Checkout</h3>
      <p>Create a real sale. The product stock will reduce in PostgreSQL.</p>

      <form className="checkout-form" onSubmit={handleCheckout}>
        <label>
          Product
          <select
            value={selectedProductId}
            onChange={(event) => setSelectedProductId(event.target.value)}
            required
          >
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} — PKR {product.price} — Stock:{" "}
                {product.stock_quantity}
              </option>
            ))}
          </select>
        </label>

        <label>
          Quantity
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            required
          />
        </label>

        <label>
          Payment Method
          <select
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value)}
          >
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="online">Online Payment</option>
          </select>
        </label>

        <button className="primary-button" type="submit">
          Complete Sale
        </button>
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