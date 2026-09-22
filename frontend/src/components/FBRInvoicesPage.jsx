import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function FBRInvoicesPage() {
  const [sales, setSales] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      const [salesResponse, invoicesResponse] = await Promise.all([
        fetch(`${API_URL}/sales/`),
        fetch(`${API_URL}/fbr/invoices`),
      ]);

      if (!salesResponse.ok || !invoicesResponse.ok) {
        throw new Error("Could not load FBR invoice data.");
      }

      setSales(await salesResponse.json());
      setInvoices(await invoicesResponse.json());
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function submitInvoice(saleId) {
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/fbr/invoices/${saleId}/submit`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Mock FBR submission failed.");
      }

      setMessage(
        `Sale ${saleId} submitted successfully. Status: ${data.status}`
      );

      await loadData();
    } catch (error) {
      setMessage(error.message);
    }
  }

  const invoiceBySaleId = Object.fromEntries(
    invoices.map((invoice) => [invoice.sale_id, invoice])
  );

  if (loading) {
    return <p>Loading FBR invoice data...</p>;
  }

  return (
    <section className="welcome-card">
      <h3>Mock FBR Invoice Submission</h3>
      <p>
        This is a safe FBR mock/sandbox prototype. 
      </p>

      {message && <p className="checkout-message">{message}</p>}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Sale Number</th>
              <th>Total Amount</th>
              <th>FBR Status</th>
              <th>Mock Invoice Number</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {sales.map((sale) => {
              const invoice = invoiceBySaleId[sale.id];

              return (
                <tr key={sale.id}>
                  <td>{sale.sale_number}</td>
                  <td>PKR {sale.total_amount}</td>
                  <td>{invoice ? invoice.status : "Not submitted"}</td>
                  <td>
                    {invoice?.fbr_invoice_number || "Not generated"}
                  </td>
                  <td>
                    {invoice ? (
                      <span className="submitted-label">Submitted</span>
                    ) : (
                      <button
                        className="primary-button"
                        onClick={() => submitInvoice(sale.id)}
                      >
                        Submit Mock FBR
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default FBRInvoicesPage;