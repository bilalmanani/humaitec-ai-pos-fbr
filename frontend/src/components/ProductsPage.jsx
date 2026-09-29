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
  const [selectedProductId, setSelectedProductId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "General",
    image_url: "",
    price: "",
    stock_quantity: "",
  });

  const [variantForm, setVariantForm] = useState({
    sku: "",
    size: "",
    color: "",
    flavor: "",
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
      image_url: "",
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
      image_url: product.image_url || "",
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
      image_url: formData.image_url.trim() || null,
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
      const response = await fetch(
        `${API_URL}/products/${product.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Could not delete product.");
      }

      setMessage(`${product.name} was deleted successfully.`);

      if (editingId === product.id) {
        resetForm();
      }

      if (selectedProductId === product.id) {
        closeVariants();
      }

      await loadProducts();
    } catch (err) {
      setError(err.message);
    }
  }

  const selectedProduct = products.find(
    (product) => product.id === selectedProductId
  );

  function openVariants(product) {
    setSelectedProductId(product.id);
    setMessage("");
    setError("");

    setVariantForm({
      sku: `${product.sku}-`,
      size: "",
      color: "",
      flavor: "",
      price: product.price,
      stock_quantity: "",
    });

    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth",
    });
  }

  function closeVariants() {
    setSelectedProductId(null);

    setVariantForm({
      sku: "",
      size: "",
      color: "",
      flavor: "",
      price: "",
      stock_quantity: "",
    });
  }

  function handleVariantChange(event) {
    setVariantForm({
      ...variantForm,
      [event.target.name]: event.target.value,
    });
  }

  async function createVariant(event) {
    event.preventDefault();

    if (!selectedProduct) {
      return;
    }

    setMessage("");
    setError("");

    const payload = {
      sku: variantForm.sku,
      size: variantForm.size || null,
      color: variantForm.color || null,
      flavor: variantForm.flavor || null,
      price: Number(variantForm.price),
      stock_quantity: Number(variantForm.stock_quantity),
    };

    try {
      const response = await fetch(
        `${API_URL}/products/${selectedProduct.id}/variants`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not create variant.");
      }

      setMessage(`${data.sku} variant was added successfully.`);

      setVariantForm({
        sku: `${selectedProduct.sku}-`,
        size: "",
        color: "",
        flavor: "",
        price: selectedProduct.price,
        stock_quantity: "",
      });

      await loadProducts();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteVariant(variant) {
    if (!selectedProduct) {
      return;
    }

    const shouldDelete = window.confirm(
      `Delete variant "${variant.sku}"?`
    );

    if (!shouldDelete) {
      return;
    }

    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/products/${selectedProduct.id}/variants/${variant.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Could not delete variant.");
      }

      setMessage(`${variant.sku} variant was deleted.`);
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
      total +
      Number(product.price || 0) *
      Number(product.stock_quantity || 0),
    0
  );

  const totalVariants = products.reduce(
    (total, product) => total + (product.variants?.length || 0),
    0
  );

  const filteredProducts = products.filter((product) => {
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      product.name.toLowerCase().includes(search) ||
      product.sku.toLowerCase().includes(search) ||
      product.category.toLowerCase().includes(search);

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
          <p>
            Manage parent products, images, variants, prices, and stock.
          </p>
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
          <span className="inventory-summary-icon purple">◇</span>
          <div>
            <small>Product Variants</small>
            <strong>{totalVariants}</strong>
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
                  ? "Update the selected parent product."
                  : "Create a parent product before adding variants."}
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
                placeholder="Example: T-Shirt"
                required
              />
            </label>

            <label>
              Parent SKU / Barcode
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                placeholder="Example: TSHIRT-001"
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
                placeholder="Example: Clothing"
                required
              />
            </label>

            <label>
              Product Image URL
              <input
                type="url"
                name="image_url"
                value={formData.image_url}
                onChange={handleChange}
                placeholder="https://example.com/product.jpg"
              />
            </label>

            <label>
              Default Unit Price (PKR)
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
              Parent Stock Quantity
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
                <th>Parent SKU</th>
                <th>Category</th>
                <th>Unit Price</th>
                <th>Stock</th>
                <th>Variants</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="product-name-with-image">
                      {product.image_url ? (
                        <img
                          className="product-table-image"
                          src={product.image_url}
                          alt={product.name}
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src =
                              `https://placehold.co/120x120/e8f1ff/2469d8?text=${encodeURIComponent(
                                product.name.charAt(0).toUpperCase()
                              )}`;
                          }}
                        />
                      ) : (
                        <div className="product-image-placeholder">
                          {product.name.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <strong className="product-name-cell">
                        {product.name}
                      </strong>
                    </div>
                  </td>

                  <td>
                    <span className="sku-badge">{product.sku}</span>
                  </td>

                  <td>{product.category}</td>

                  <td>
                    PKR {Number(product.price).toLocaleString()}
                  </td>

                  <td>{product.stock_quantity}</td>

                  <td>
                    <span className="variant-count-badge">
                      {product.variants?.length || 0} variants
                    </span>
                  </td>

                  <td>
                    <span
                      className={
                        product.stock_quantity <= 5
                          ? "stock-status low"
                          : "stock-status available"
                      }
                    >
                      {product.stock_quantity <= 5
                        ? "Low stock"
                        : "In stock"}
                    </span>
                  </td>

                  <td>
                    <div className="action-buttons">
                      <button
                        className="variant-button"
                        type="button"
                        onClick={() => openVariants(product)}
                      >
                        Variants
                      </button>

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
                  <td className="empty-table-cell" colSpan="8">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {loading && <p className="table-loading">Loading products...</p>}
      </section>

      {selectedProduct && (
        <section className="variants-manager-card">
          <div className="variants-manager-heading">
            <div>
              <p className="eyebrow">PRODUCT VARIANT MATRIX</p>
              <h4>{selectedProduct.name}</h4>
              <p>
                Parent SKU: <strong>{selectedProduct.sku}</strong>
              </p>
            </div>

            <button
              className="form-close-button"
              type="button"
              onClick={closeVariants}
            >
              ×
            </button>
          </div>

          <form className="variant-form" onSubmit={createVariant}>
            <label>
              Variant SKU
              <input
                type="text"
                name="sku"
                value={variantForm.sku}
                onChange={handleVariantChange}
                placeholder="Example: TSHIRT-BLACK-M"
                required
              />
            </label>

            <label>
              Size
              <input
                type="text"
                name="size"
                value={variantForm.size}
                onChange={handleVariantChange}
                placeholder="Example: Medium"
              />
            </label>

            <label>
              Color
              <input
                type="text"
                name="color"
                value={variantForm.color}
                onChange={handleVariantChange}
                placeholder="Example: Black"
              />
            </label>

            <label>
              Flavor
              <input
                type="text"
                name="flavor"
                value={variantForm.flavor}
                onChange={handleVariantChange}
                placeholder="Example: Vanilla"
              />
            </label>

            <label>
              Variant Price (PKR)
              <input
                type="number"
                name="price"
                value={variantForm.price}
                onChange={handleVariantChange}
                min="1"
                step="0.01"
                required
              />
            </label>

            <label>
              Variant Stock
              <input
                type="number"
                name="stock_quantity"
                value={variantForm.stock_quantity}
                onChange={handleVariantChange}
                min="0"
                required
              />
            </label>

            <button className="primary-button" type="submit">
              + Add Variant
            </button>
          </form>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Variant SKU</th>
                  <th>Size</th>
                  <th>Color</th>
                  <th>Flavor</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {selectedProduct.variants?.map((variant) => (
                  <tr key={variant.id}>
                    <td>
                      <span className="sku-badge">{variant.sku}</span>
                    </td>
                    <td>{variant.size || "—"}</td>
                    <td>{variant.color || "—"}</td>
                    <td>{variant.flavor || "—"}</td>
                    <td>
                      PKR {Number(variant.price).toLocaleString()}
                    </td>
                    <td>{variant.stock_quantity}</td>
                    <td>
                      <button
                        className="delete-button"
                        type="button"
                        onClick={() => deleteVariant(variant)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}

                {selectedProduct.variants?.length === 0 && (
                  <tr>
                    <td className="empty-table-cell" colSpan="7">
                      No variants added for this product yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </section>
  );
}

export default ProductsPage;