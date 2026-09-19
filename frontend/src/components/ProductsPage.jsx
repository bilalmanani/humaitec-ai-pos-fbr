import { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:8000";

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProducts() {
      try {
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

    loadProducts();
  }, []);

  if (loading) {
    return <p>Loading products...</p>;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  return (
    <section className="welcome-card">
      <h3>Product Inventory</h3>
      <p>Products are loaded from the FastAPI and PostgreSQL backend.</p>

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
                    product.stock_quantity <= 5 ? "stock-low" : "stock-ok"
                  }
                >
                  {product.stock_quantity}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default ProductsPage;