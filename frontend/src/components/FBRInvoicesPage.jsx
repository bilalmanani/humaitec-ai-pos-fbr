import { useEffect, useMemo, useState } from "react";
import "./FBRInvoicesPage.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function FBRInvoicesPage() {
  const [sales, setSales] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [submittingSaleId, setSubmittingSaleId] = useState(null);

  async function loadData(showLoading = true) {
    try {
      if (showLoading) {
        setLoading(true);
      }

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
      if (showLoading) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function submitInvoice(saleId) {
    try {
      setMessage("");
      setSubmittingSaleId(saleId);

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

      setMessage(`Invoice submitted successfully. Status: ${data.status}`);
      await loadData(false);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmittingSaleId(null);
    }
  }

  const invoiceBySaleId = useMemo(() => {
    return Object.fromEntries(
      invoices.map((invoice) => [invoice.sale_id, invoice])
    );
  }, [invoices]);

  const invoiceRows = useMemo(() => {
    return sales.map((sale) => {
      const invoice = invoiceBySaleId[sale.id];

      return {
        sale,
        invoice,
        status: invoice?.status || "Not submitted",
      };
    });
  }, [sales, invoiceBySaleId]);

  const filteredRows = useMemo(() => {
    const search = searchValue.trim().toLowerCase();

    return invoiceRows.filter(({ sale, invoice, status }) => {
      const matchesSearch =
        !search ||
        sale.sale_number?.toLowerCase().includes(search) ||
        invoice?.fbr_invoice_number?.toLowerCase().includes(search) ||
        status.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "All" || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [invoiceRows, searchValue, statusFilter]);

  const submittedCount = invoices.length;
  const pendingCount = Math.max(sales.length - submittedCount, 0);

  const totalSubmittedAmount = useMemo(() => {
    return invoiceRows.reduce((total, { sale, invoice }) => {
      return invoice ? total + Number(sale.total_amount || 0) : total;
    }, 0);
  }, [invoiceRows]);

  function formatCurrency(amount) {
    return `PKR ${Number(amount || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  if (loading) {
    return <p className="fbr-loading">Loading FBR invoice data...</p>;
  }

  return (
    <section className="fbr-page">
      <header className="fbr-page-header">
        <div>
          <p className="eyebrow">FBR INTEGRATION</p>
          <h3>FBR Invoice Queue</h3>
          <p>Submit completed sales to the safe mock FBR sandbox.</p>
        </div>

        <button
          className="fbr-refresh-button"
          type="button"
          onClick={() => loadData()}
        >
          ↻ Refresh
        </button>
      </header>

      <section className="fbr-notice">
        <span>i</span>
        <p>
          Sandbox mode only. No real FBR invoice is created or sent to FBR.
        </p>
      </section>

      <section className="fbr-metrics">
        <article className="fbr-metric-card">
          <span className="fbr-metric-icon blue">▤</span>
          <div>
            <p>Total Sales</p>
            <strong>{sales.length}</strong>
          </div>
        </article>

        <article className="fbr-metric-card">
          <span className="fbr-metric-icon green">✓</span>
          <div>
            <p>Submitted</p>
            <strong>{submittedCount}</strong>
          </div>
        </article>

        <article className="fbr-metric-card">
          <span className="fbr-metric-icon orange">!</span>
          <div>
            <p>Pending Submission</p>
            <strong>{pendingCount}</strong>
          </div>
        </article>

        <article className="fbr-metric-card">
          <span className="fbr-metric-icon purple">Rs</span>
          <div>
            <p>Submitted Amount</p>
            <strong>{formatCurrency(totalSubmittedAmount)}</strong>
          </div>
        </article>
      </section>

      {message && <p className="fbr-message">{message}</p>}

      <section className="fbr-table-card">
        <div className="fbr-table-toolbar">
          <div className="fbr-search-box">
            <span>⌕</span>
            <input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search sale number, FBR number, or status"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Not submitted">Not Submitted</option>
            <option value="ACCEPTED_MOCK">Accepted Mock</option>
          </select>
        </div>

        <div className="fbr-table-heading">
          <div>
            <h4>Invoice Records</h4>
            <p>{filteredRows.length} record(s) shown</p>
          </div>
        </div>

        <div className="fbr-table-wrap">
          <table className="fbr-table">
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
              {filteredRows.map(({ sale, invoice, status }) => (
                <tr key={sale.id}>
                  <td>
                    <strong className="fbr-sale-number">
                      {sale.sale_number}
                    </strong>
                  </td>

                  <td className="fbr-amount">
                    {formatCurrency(sale.total_amount)}
                  </td>

                  <td>
                    {invoice ? (
                      <span className="fbr-status submitted">
                        {status.replace("_", " ")}
                      </span>
                    ) : (
                      <span className="fbr-status pending">Not Submitted</span>
                    )}
                  </td>

                  <td className="fbr-invoice-number">
                    {invoice?.fbr_invoice_number || "Not generated"}
                  </td>

                  <td>
                    {invoice ? (
                      <span className="fbr-submitted-label">Submitted</span>
                    ) : (
                      <button
                        className="fbr-submit-button"
                        type="button"
                        disabled={submittingSaleId === sale.id}
                        onClick={() => submitInvoice(sale.id)}
                      >
                        {submittingSaleId === sale.id
                          ? "Submitting..."
                          : "Submit Mock FBR"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {filteredRows.length === 0 && (
                <tr>
                  <td className="fbr-empty-row" colSpan="5">
                    No invoice records match your search or status filter.
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

export default FBRInvoicesPage;