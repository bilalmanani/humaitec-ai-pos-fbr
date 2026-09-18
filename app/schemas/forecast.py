from pydantic import BaseModel


class ProductForecastResponse(BaseModel):
    product_id: int
    product_name: str
    historical_days: int
    predicted_next_day_quantity: float
    model_used: str