from collections import defaultdict

from sklearn.linear_model import LinearRegression
from sqlalchemy.orm import Session

from app.models.sale import Sale, SaleItem


def forecast_product_demand(db: Session, product_id: int | None = None):
    query = (
        db.query(SaleItem, Sale.created_at)
        .join(Sale, SaleItem.sale_id == Sale.id)
        .order_by(Sale.created_at)
    )

    if product_id is not None:
        query = query.filter(SaleItem.product_id == product_id)

    rows = query.all()

    products = defaultdict(list)

    for item, created_at in rows:
        products[item.product_id].append(
            {
                "product_name": item.product_name,
                "date": created_at.date(),
                "quantity": item.quantity,
            }
        )

    forecasts = []

    for current_product_id, sales in products.items():
        daily_quantities = defaultdict(int)

        for sale in sales:
            daily_quantities[sale["date"]] += sale["quantity"]

        dates = sorted(daily_quantities.keys())
        quantities = [daily_quantities[current_date] for current_date in dates]

        if len(quantities) >= 2:
            x_values = [[index] for index in range(len(quantities))]
            model = LinearRegression()
            model.fit(x_values, quantities)

            prediction = model.predict([[len(quantities)]])[0]
            predicted_quantity = max(0, round(float(prediction), 2))
            model_used = "Linear Regression"
        else:
            predicted_quantity = round(float(quantities[0]), 2)
            model_used = "Average fallback - more sales history needed"

        forecasts.append(
            {
                "product_id": current_product_id,
                "product_name": sales[0]["product_name"],
                "historical_days": len(quantities),
                "predicted_next_day_quantity": predicted_quantity,
                "model_used": model_used,
            }
        )

    return forecasts