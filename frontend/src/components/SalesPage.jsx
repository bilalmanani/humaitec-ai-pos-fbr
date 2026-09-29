import { useEffect, useMemo, useState } from "react";
import "./SalesPage.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function SalesPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("All");

  async function loadSales() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/sales/`);

      if (!response.ok) {
        throw new Error("Could not load sales.");
      }

      const data = await response.json();
      setSales(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSales();
  }, []);

  const filteredSales = useMemo(() => {
    const search = searchValue.trim().toLowerCase();

    return sales.filter((sale) => {
      const matchesSearch =
        !search ||
        sale.sale_number?.toLowerCase().includes(search) ||
        sale.payment_method?.toLowerCase().includes(search);

      const matchesPayment =
        paymentFilter === "All" ||
        sale.payment_method?.toLowerCase() === paymentFilter.toLowerCase();

      return matchesSearch && matchesPayment;
    });
  }, [sales, searchValue, paymentFilter]);

  const totalRevenue = useMemo(() => {
    return sales.reduce(
      (total, sale) => total + Number(sale.total_amount || 0),
      0
    );
  }, [sales]);

  const todaySales = useMemo(() => {
    const today = new Date().toDateString();

    return sales.filter((sale) => {
      if (!sale.created_at) {
        return false;
      }

      return new Date(sale.created_at).toDateString() === today;
    });
  }, [sales]);

  const todayRevenue = useMemo(() => {
    return todaySales.reduce(
      (total, sale) => total + Number(sale.total_amount || 0),
      0
    );
  }, [todaySales]);

  function formatCurrency(amount) {
    return `PKR ${Number(amount || 0).toLocaleString(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;
  }

  function formatDate(dateValue) {
    if (!dateValue) {
      return "Not available";
    }

    return new Date(dateValue).toLocaleString();
  }

  if (loading) {
    return <p className="sales-loading">Loading sales history...</p>;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  return (
    <section className="sales-page">
      <header className="sales-page-header">
        <div>
          <p className="eyebrow">POINT OF SALE</p>
          <h3>Sales History</h3>
          <p>Review completed customer orders and payment records.</p>
        </div>

        <button className="sales-refresh-button" type="button" onClick={loadSales}>
          ↻ Refresh
        </button>
      </header>

      <section className="sales-metrics">
        <article className="sales-metric-card">
          <span className="sales-metric-icon blue">▤</span>
          <div>
            <p>Total Orders</p>
            <strong>{sales.length}</strong>
          </div>
        </article>

        <article className="sales-metric-card">
          <span className="sales-metric-icon green">Rs</span>
          <div>
            <p>Total Revenue</p>
            <strong>{formatCurrency(totalRevenue)}</strong>
          </div>
        </article>

        <article className="sales-metric-card">
          <span className="sales-metric-icon orange">◷</span>
          <div>
            <p>Today's Sales</p>
            <strong>{todaySales.length}</strong>
          </div>
        </article>

        <article className="sales-metric-card">
          <span className="sales-metric-icon purple">₨</span>
          <div>
            <p>Today's Revenue</p>
            <strong>{formatCurrency(todayRevenue)}</strong>
          </div>
        </article>
      </section>

      <section className="sales-table-card">
        <div className="sales-table-toolbar">
          <div className="sales-search-box">
            <span>⌕</span>
            <input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search by sale number or payment method"
            />
          </div>

          <select
            value={paymentFilter}
            onChange={(event) => setPaymentFilter(event.target.value)}
          >
            <option value="All">All Payments</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="easypaisa">EasyPaisa</option>
            <option value="jazzcash">JazzCash</option>
          </select>
        </div>

        <div className="sales-table-heading">
          <div>
            <h4>Completed Orders</h4>
            <p>{filteredSales.length} order(s) shown</p>
          </div>
        </div>

        <div className="sales-table-wrap">
          <table className="sales-table">
            <thead>
              <tr>
                <th>Sale Number</th>
                <th>Payment</th>
                <th>Items</th>
                <th>Total Amount</th>
                <th>Date & Time</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredSales.map((sale) => (
                <tr key={sale.id}>
                  <td>
                    <strong className="sale-number">{sale.sale_number}</strong>
                  </td>

                  <td>
                    <span className="payment-badge">
                      {sale.payment_method || "Not set"}
                    </span>
                  </td>

                  <td>{sale.items?.length ?? "—"}</td>

                  <td className="sale-amount">
                    {formatCurrency(sale.total_amount)}
                  </td>

                  <td className="sale-date">{formatDate(sale.created_at)}</td>

                  <td>
                    <span className="completed-badge">Completed</span>
                  </td>
                </tr>
              ))}

              {filteredSales.length === 0 && (
                <tr>
                  <td className="sales-empty-row" colSpan="6">
                    No sales match your search or payment filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

export default SalesPage;