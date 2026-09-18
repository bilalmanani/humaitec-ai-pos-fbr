from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.forecast import ProductForecastResponse
from app.services.forecast_service import forecast_product_demand


router = APIRouter(
    prefix="/forecast",
    tags=["AI Sales Forecasting"],
)


@router.get("/products", response_model=list[ProductForecastResponse])
def get_product_forecasts(db: Session = Depends(get_db)):
    forecasts = forecast_product_demand(db)

    if not forecasts:
        raise HTTPException(
            status_code=404,
            detail="No sales data available for forecasting.",
        )

    return forecasts


@router.get("/products/{product_id}", response_model=list[ProductForecastResponse])
def get_single_product_forecast(
    product_id: int,
    db: Session = Depends(get_db),
):
    forecasts = forecast_product_demand(db, product_id)

    if not forecasts:
        raise HTTPException(
            status_code=404,
            detail="No sales data found for this product.",
        )

    return forecasts