import { useEffect, useState } from "react";
import "./ProductsPage.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [showProductForm, setShowProductForm] = useState(false);

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

  function resetForm() {
    setFormData({
      name: "",
      sku: "",
      category: "General",
      price: "",
      stock_quantity: "",
    });

    setEditingId(null);
    setShowProductForm(false);
  }

  function startEdit(product) {
    setError("");
    setMessage("");
    setEditingId(product.id);
    setShowProductForm(true);

    setFormData({
      name: product.name,
      sku: product.sku,
      category: product.category,
      price: product.price,
      stock_quantity: product.stock_quantity,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setError("");

    const productPayload = {
      name: formData.name,
      sku: formData.sku,
      category: formData.category,
      price: Number(formData.price),
      stock_quantity: Number(formData.stock_quantity),
    };

    try {
      const url = editingId
        ? `${API_URL}/products/${editingId}`
        : `${API_URL}/products/`;

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productPayload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not save product.");
      }

      setMessage(
        editingId
          ? `${data.name} was updated successfully.`
          : `${data.name} was added successfully.`
      );

      resetForm();
      await loadProducts();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(product) {
    const shouldDelete = window.confirm(
      `Delete "${product.name}" from inventory?`
    );

    if (!shouldDelete) {
      return;
    }

    setMessage("");
    setError("");

    try {
      const response = await fetch(`${API_URL}/products/${product.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Could not delete product.");
      }

      setMessage(`${product.name} was deleted successfully.`);

      if (editingId === product.id) {
        resetForm();
      }

      await loadProducts();
    } catch (err) {
      setError(err.message);
    }
  }

  const lowStockCount = products.filter(
    (product) => product.stock_quantity <= 5
  ).length;

  const totalInventoryValue = products.reduce(
    (total, product) =>
      total + Number(product.price || 0) * Number(product.stock_quantity || 0),
    0
  );

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStock =
      stockFilter === "all" ||
      (stockFilter === "low" && product.stock_quantity <= 5) ||
      (stockFilter === "available" && product.stock_quantity > 5);

    return matchesSearch && matchesStock;
  });

  return (
    <section className="products-page">
      <div className="products-page-header">
        <div>
          <p className="eyebrow">INVENTORY MANAGEMENT</p>
          <h3>Products</h3>
          <p>Manage product prices, SKUs, categories, and available stock.</p>
        </div>

        <button
          className="primary-button"
          type="button"
          onClick={() => {
            resetForm();
            setShowProductForm(true);
          }}
        >
          + Add Product
        </button>
      </div>

      <section className="inventory-summary">
        <article>
          <span className="inventory-summary-icon blue">□</span>
          <div>
            <small>Total Products</small>
            <strong>{products.length}</strong>
          </div>
        </article>

        <article>
          <span className="inventory-summary-icon orange">!</span>
          <div>
            <small>Low Stock</small>
            <strong>{lowStockCount}</strong>
          </div>
        </article>

        <article>
          <span className="inventory-summary-icon green">₨</span>
          <div>
            <small>Inventory Value</small>
            <strong>PKR {totalInventoryValue.toLocaleString()}</strong>
          </div>
        </article>
      </section>

      {showProductForm && (
        <section className="product-form-card">
          <div className="product-form-heading">
            <div>
              <h4>{editingId ? "Edit Product" : "Add New Product"}</h4>
              <p>
                {editingId
                  ? "Update the selected inventory item."
                  : "Enter the product details below."}
              </p>
            </div>

            <button
              className="form-close-button"
              type="button"
              onClick={resetForm}
            >
              ×
            </button>
          </div>

          <form className="product-form" onSubmit={handleSubmit}>
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
              SKU / Barcode
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
                placeholder="Example: Electronics"
                required
              />
            </label>

            <label>
              Unit Price (PKR)
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

            <div className="product-form-actions">
              <button className="primary-button" type="submit">
                {editingId ? "Save Changes" : "Create Product"}
              </button>

              <button
                className="outline-button"
                type="button"
                onClick={resetForm}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {message && <p className="checkout-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}

      <section className="products-table-card">
        <div className="products-toolbar">
          <div className="product-search-box">
            <span>⌕</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by product, SKU, or category"
            />
          </div>

          <select
            value={stockFilter}
            onChange={(event) => setStockFilter(event.target.value)}
          >
            <option value="all">All Stock</option>
            <option value="available">In Stock</option>
            <option value="low">Low Stock</option>
          </select>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Unit Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    <strong className="product-name-cell">{product.name}</strong>
                  </td>
                  <td>
                    <span className="sku-badge">{product.sku}</span>
                  </td>
                  <td>{product.category}</td>
                  <td>PKR {Number(product.price).toLocaleString()}</td>
                  <td>{product.stock_quantity}</td>
                  <td>
                    <span
                      className={
                        product.stock_quantity <= 5
                          ? "stock-status low"
                          : "stock-status available"
                      }
                    >
                      {product.stock_quantity <= 5 ? "Low stock" : "In stock"}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="edit-button"
                        type="button"
                        onClick={() => startEdit(product)}
                      >
                        Edit
                      </button>

                      <button
                        className="delete-button"
                        type="button"
                        onClick={() => handleDelete(product)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && filteredProducts.length === 0 && (
                <tr>
                  <td className="empty-table-cell" colSpan="7">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {loading && <p className="table-loading">Loading products...</p>}
      </section>
    </section>
  );
}

export default ProductsPage;