import { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:8000";

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "General",
    price: "",
    stock_quantity: "",
  });

  async function loadProducts() {
    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/products/`);

      if (!response.ok) {
        throw new Error("Could not load products.");
      }

      const data = await response.json();
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function handleChange(event) {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setError("");

    try {
      const response = await fetch(`${API_URL}/products/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          sku: formData.sku,
          category: formData.category,
          price: Number(formData.price),
          stock_quantity: Number(formData.stock_quantity),
          is_active: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not add product.");
      }

      setMessage(`${data.name} was added successfully.`);

      setFormData({
        name: "",
        sku: "",
        category: "General",
        price: "",
        stock_quantity: "",
      });

      await loadProducts();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="welcome-card">
      <h3>Product Inventory</h3>
      <p>Add products and manage inventory through the React frontend.</p>

      <form className="checkout-form" onSubmit={handleSubmit}>
        <label>
          Product Name
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Example: Wireless Mouse"
            required
          />
        </label>

        <label>
          SKU
          <input
            type="text"
            name="sku"
            value={formData.sku}
            onChange={handleChange}
            placeholder="Example: WM-001"
            required
          />
        </label>

        <label>
          Category
          <input
            type="text"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Price (PKR)
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            min="1"
            step="0.01"
            required
          />
        </label>

        <label>
          Stock Quantity
          <input
            type="number"
            name="stock_quantity"
            value={formData.stock_quantity}
            onChange={handleChange}
            min="0"
            required
          />
        </label>

        <button className="primary-button" type="submit">
          Add Product
        </button>
      </form>

      {message && <p className="checkout-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Product</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
            </tr>
          </thead>

          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.id}</td>
                <td>{product.name}</td>
                <td>{product.sku}</td>
                <td>{product.category}</td>
                <td>PKR {product.price}</td>
                <td
                  className={
                    product.stock_quantity <= 5
                      ? "stock-low"
                      : "stock-ok"
                  }
                >
                  {product.stock_quantity}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {loading && <p>Loading products...</p>}
    </section>
  );
}

export default ProductsPage;