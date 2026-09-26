import { useEffect, useState } from "react";

import ProductsPage from "./components/ProductsPage";
import CheckoutPage from "./components/CheckoutPage";
import SalesPage from "./components/SalesPage";
import FBRInvoicesPage from "./components/FBRInvoicesPage";
import "./index.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

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
    { name: "Dashboard", icon: "▦" },
    { name: "Products", icon: "□" },
    { name: "Checkout", icon: "⌁" },
    { name: "Sales", icon: "↗" },
    { name: "FBR Invoices", icon: "▤" },
    { name: "AI Forecast", icon: "◈" },
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
          lowStock,
          totalSales,
          fbrStatus: latestFbrStatus,
          backendStatus: "System Online",
        });

        setForecastData(forecasts);
      } catch (err) {
        setError(err.message);
        setDashboardData((currentData) => ({
          ...currentData,
          backendStatus: "Connection Failed",
        }));
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  function renderPageContent() {
    if (page === "Products") {
      return <ProductsPage />;
    }

    if (page === "Checkout") {
      return <CheckoutPage />;
    }

    if (page === "Sales") {
      return <SalesPage />;
    }

    if (page === "FBR Invoices") {
      return <FBRInvoicesPage />;
    }

    if (page === "AI Forecast") {
      return (
        <section className="content-card forecast-page">
          <div className="section-heading">
            <div>
              <p className="eyebrow">SALES INTELLIGENCE</p>
              <h3>Product Demand Forecast</h3>
              <p>
                Estimated next-day demand based on available POS sales history.
              </p>
            </div>
          </div>

          {forecastData.length === 0 ? (
            <p className="empty-state">
              No sales data is available for forecasting yet.
            </p>
          ) : (
            <div className="forecast-list">
              {forecastData.map((forecast) => (
                <article className="forecast-item" key={forecast.product_id}>
                  <div>
                    <strong>{forecast.product_name}</strong>
                    <small>Forecast based on available sales history</small>
                  </div>

                  <div className="forecast-demand">
                    <span>Next-day demand</span>
                    <b>{forecast.predicted_next_day_quantity} units</b>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      );
    }

    return (
      <>
        <section className="dashboard-hero">
          <div>
            <p className="eyebrow">POINT OF SALE OVERVIEW</p>
            <h3>Welcome back to HUMAITEC POS</h3>
            <p>
              Manage products, process quick sales, review invoices, and monitor
              stock from one workspace.
            </p>
          </div>

          <button
            className="primary-button hero-action"
            onClick={() => setPage("Checkout")}
          >
            Start New Sale
          </button>
        </section>

        <section className="dashboard-actions">
          <button onClick={() => setPage("Products")}>
            <span>□</span>
            <div>
              <strong>Products</strong>
              <small>Manage inventory</small>
            </div>
          </button>

          <button onClick={() => setPage("Checkout")}>
            <span>⌁</span>
            <div>
              <strong>POS Checkout</strong>
              <small>Create a sale</small>
            </div>
          </button>

          <button onClick={() => setPage("FBR Invoices")}>
            <span>▤</span>
            <div>
              <strong>FBR Invoices</strong>
              <small>Review submissions</small>
            </div>
          </button>

          <button onClick={() => setPage("AI Forecast")}>
            <span>◈</span>
            <div>
              <strong>AI Forecast</strong>
              <small>View demand estimate</small>
            </div>
          </button>
        </section>
      </>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">H</div>
          <div>
            <h1>HUMAITEC</h1>
            <p>POS & FBR SYSTEM</p>
          </div>
        </div>

        <p className="sidebar-section-label">MAIN MENU</p>

        <nav>
          {menuItems.map((item) => (
            <button
              key={item.name}
              className={
                page === item.name ? "nav-item active" : "nav-item"
              }
              onClick={() => setPage(item.name)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className="online-dot" />
          FastAPI connected
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="small-label">HUMAITEC / OPERATIONS</p>
            <h2>{page}</h2>
          </div>

          <div className="topbar-status">
            <span
              className={
                dashboardData.backendStatus === "System Online"
                  ? "online-dot"
                  : "offline-dot"
              }
            />
            {dashboardData.backendStatus}
          </div>
        </header>

        {error && <p className="error-message">{error}</p>}

        {page === "Dashboard" && (
          <section className="metrics-grid">
            <article className="metric-card">
              <div className="metric-icon blue">□</div>
              <p>Total Products</p>
              <h3>{loading ? "..." : dashboardData.totalProducts}</h3>
              <small>Available in inventory</small>
            </article>

            <article className="metric-card">
              <div className="metric-icon orange">!</div>
              <p>Low Stock Items</p>
              <h3>{loading ? "..." : dashboardData.lowStock}</h3>
              <small>Need stock attention</small>
            </article>

            <article className="metric-card">
              <div className="metric-icon green">₨</div>
              <p>Total Sales</p>
              <h3>
                {loading
                  ? "..."
                  : `PKR ${dashboardData.totalSales.toLocaleString()}`}
              </h3>
              <small>All recorded sales</small>
            </article>

            <article className="metric-card">
              <div className="metric-icon purple">✓</div>
              <p>FBR Status</p>
              <h3 className="fbr-text">
                {loading ? "..." : dashboardData.fbrStatus}
              </h3>
              <small>Latest invoice status</small>
            </article>
          </section>
        )}

        {renderPageContent()}
      </main>
    </div>
  );
}

export default App;