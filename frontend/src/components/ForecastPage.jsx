import { useMemo } from "react";
import "./ForecastPage.css";

function ForecastPage({ forecastData }) {
  const highestForecast = useMemo(() => {
    if (forecastData.length === 0) {
      return null;
    }

    return forecastData.reduce((highest, forecast) => {
      return Number(forecast.predicted_next_day_quantity) >
        Number(highest.predicted_next_day_quantity)
        ? forecast
        : highest;
    });
  }, [forecastData]);

  const totalForecastDemand = useMemo(() => {
    return forecastData.reduce(
      (total, forecast) =>
        total + Number(forecast.predicted_next_day_quantity || 0),
      0
    );
  }, [forecastData]);

  function getRecommendation(quantity) {
    const demand = Number(quantity || 0);

    if (demand === 0) {
      return {
        label: "No stock action needed",
        className: "forecast-recommendation neutral",
      };
    }

    if (demand <= 5) {
      return {
        label: "Monitor demand",
        className: "forecast-recommendation watch",
      };
    }

    return {
      label: "Prepare stock",
      className: "forecast-recommendation prepare",
    };
  }

  return (
    <section className="forecast-page">
      <header className="forecast-page-header">
        <div>
          <p className="eyebrow">SALES INTELLIGENCE</p>
          <h3>Product Demand Forecast</h3>
          <p>Estimated next-day demand using available POS sales history.</p>
        </div>

        <span className="forecast-model-badge">AI Forecast</span>
      </header>

      <section className="forecast-notice">
        <span>i</span>
        <p>
          Forecasts are estimates. Use them to plan stock, not as guaranteed
          sales quantities.
        </p>
      </section>

      <section className="forecast-summary-grid">
        <article className="forecast-summary-card">
          <span className="forecast-summary-icon blue">◈</span>
          <div>
            <p>Products Analysed</p>
            <strong>{forecastData.length}</strong>
          </div>
        </article>

        <article className="forecast-summary-card">
          <span className="forecast-summary-icon green">▤</span>
          <div>
            <p>Expected Units Tomorrow</p>
            <strong>{totalForecastDemand}</strong>
          </div>
        </article>

        <article className="forecast-summary-card">
          <span className="forecast-summary-icon orange">↑</span>
          <div>
            <p>Highest Demand Product</p>
            <strong>{highestForecast?.product_name || "No data"}</strong>
          </div>
        </article>
      </section>

      <section className="forecast-table-card">
        <div className="forecast-table-heading">
          <div>
            <h4>Demand Recommendations</h4>
            <p>Product-level estimate for the next business day.</p>
          </div>
          <span>{forecastData.length} products</span>
        </div>

        {forecastData.length === 0 ? (
          <div className="forecast-empty-state">
            <strong>No sales data available yet</strong>
            <p>Create more completed sales to generate product forecasts.</p>
          </div>
        ) : (
          <div className="forecast-table-wrap">
            <table className="forecast-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Next-Day Demand</th>
                  <th>Stock Recommendation</th>
                  <th>Forecast Source</th>
                </tr>
              </thead>

              <tbody>
                {forecastData.map((forecast) => {
                  const recommendation = getRecommendation(
                    forecast.predicted_next_day_quantity
                  );

                  return (
                    <tr key={forecast.product_id}>
                      <td>
                        <strong className="forecast-product-name">
                          {forecast.product_name}
                        </strong>
                      </td>

                      <td>
                        <span className="forecast-demand-badge">
                          {forecast.predicted_next_day_quantity} units
                        </span>
                      </td>

                      <td>
                        <span className={recommendation.className}>
                          {recommendation.label}
                        </span>
                      </td>

                      <td className="forecast-source">
                        Available sales history
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}

export default ForecastPage;