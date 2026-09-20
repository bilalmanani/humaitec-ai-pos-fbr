import { useEffect, useState } from "react";

import ProductsPage from "./components/ProductsPage";
import CheckoutPage from "./components/CheckoutPage";
import SalesPage from "./components/SalesPage";
import FBRInvoicesPage from "./components/FBRInvoicesPage";

import "./index.css";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [page, setPage] = useState("Dashboard");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [forecastData, setForecastData] = useState([]);

  const [dashboardData, setDashboardData] = useState({
    totalProducts: 0,
    lowStock: 0,
    totalSales: 0,
    fbrStatus: "Loading...",
    backendStatus: "Loading...",
  });

  const menuItems = [
    "Dashboard",
    "Products",
    "Checkout",
    "Sales",
    "FBR Invoices",
    "AI Forecast",
  ];

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [
          productsResponse,
          salesResponse,
          fbrResponse,
          forecastResponse,
        ] = await Promise.all([
          fetch(`${API_URL}/products/`),
          fetch(`${API_URL}/sales/`),
          fetch(`${API_URL}/fbr/invoices`),
          fetch(`${API_URL}/forecast/products`),
        ]);

        if (
          !productsResponse.ok ||
          !salesResponse.ok ||
          !fbrResponse.ok ||
          !forecastResponse.ok
        ) {
          throw new Error("Could not load data from FastAPI.");
        }

        const products = await productsResponse.json();
        const sales = await salesResponse.json();
        const fbrInvoices = await fbrResponse.json();
        const forecasts = await forecastResponse.json();

        const totalSales = sales.reduce(
          (total, sale) => total + Number(sale.total_amount || 0),
          0
        );

        const lowStock = products.filter(
          (product) => product.stock_quantity <= 5
        ).length;

        const latestFbrStatus =
          fbrInvoices.length > 0
            ? fbrInvoices[0].status
            : "No FBR invoice submitted";

        setDashboardData({
          totalProducts: products.length,
          lowStock: lowStock,
          totalSales: totalSales,
          fbrStatus: latestFbrStatus,
          backendStatus: "FastAPI Connected",
        });

        setForecastData(forecasts);
      } catch (err) {
        setError(err.message);

        setDashboardData((currentData) => ({
          ...currentData,
          backendStatus: "Backend Connection Failed",
        }));
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>HUMAITEC POS</h1>
        <p className="sidebar-subtitle">AI + FBR Integration</p>

        <nav>
          {menuItems.map((item) => (
            <button
              key={item}
              className={page === item ? "nav-item active" : "nav-item"}
              onClick={() => setPage(item)}
            >
              {item}
            </button>
          ))}
        </nav>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="small-label">HUMAITEC</p>
            <h2>{page}</h2>
          </div>

          <span className="status-badge">
            {dashboardData.backendStatus}
          </span>
        </header>

        {error && <p className="error-message">{error}</p>}

        <section className="metrics-grid">
          <article className="metric-card">
            <p>Total Products</p>
            <h3>{loading ? "..." : dashboardData.totalProducts}</h3>
          </article>

          <article className="metric-card">
            <p>Low Stock Products</p>
            <h3>{loading ? "..." : dashboardData.lowStock}</h3>
          </article>

          <article className="metric-card">
            <p>Total Sales</p>
            <h3>
              {loading
                ? "..."
                : `PKR ${dashboardData.totalSales.toLocaleString()}`}
            </h3>
          </article>

          <article className="metric-card">
            <p>FBR Status</p>
            <h3 className="fbr-text">
              {loading ? "..." : dashboardData.fbrStatus}
            </h3>
          </article>
        </section>

        {page === "Products" ? (
          <ProductsPage />
        ) : page === "Checkout" ? (
          <CheckoutPage />
        ) : page === "Sales" ? (
          <SalesPage />
        ) : page === "FBR Invoices" ? (
          <FBRInvoicesPage />
        ) : page === "AI Forecast" ? (
          <section className="welcome-card">
            <h3>AI Product Demand Forecast</h3>

            <p>
              This prediction is calculated from your stored POS sales history.
            </p>

            {forecastData.length === 0 ? (
              <p>No sales data is available for forecasting yet.</p>
            ) : (
              <div className="forecast-list">
                {forecastData.map((forecast) => (
                  <div className="forecast-item" key={forecast.product_id}>
                    <strong>{forecast.product_name}</strong>

                    <span>
                      Next-day demand:{" "}
                      {forecast.predicted_next_day_quantity} units
                    </span>

                    <small>{forecast.model_used}</small>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : (
          <section className="welcome-card">
            <h3>AI-Powered Point of Sale System</h3>

            <p>
              Manage inventory, create customer bills, submit Mock FBR invoices,
              and forecast product demand from sales history.
            </p>

            <div className="feature-list">
              <span>Inventory Management</span>
              <span>POS Checkout</span>
              <span>FBR Invoice Queue</span>
              <span>AI Sales Forecasting</span>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;