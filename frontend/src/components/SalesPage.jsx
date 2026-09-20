import { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:8000";

function SalesPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSales() {
      try {
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

    loadSales();
  }, []);

  if (loading) {
    return <p>Loading sales...</p>;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  return (
    <section className="welcome-card">
      <h3>Completed Sales</h3>
      <p>All sales are loaded from the FastAPI and PostgreSQL backend.</p>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Sale Number</th>
              <th>Payment Method</th>
              <th>Total Amount</th>
              <th>Created At</th>
            </tr>
          </thead>

          <tbody>
            {sales.map((sale) => (
              <tr key={sale.id}>
                <td>{sale.sale_number}</td>
                <td>{sale.payment_method}</td>
                <td>PKR {sale.total_amount}</td>
                <td>
                  {sale.created_at
                    ? new Date(sale.created_at).toLocaleString()
                    : "Not available"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default SalesPage;