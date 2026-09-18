from fastapi import FastAPI

from app.database.database import Base, engine
from app.models.product import Product
from app.models.sale import Sale, SaleItem
from app.routes.products import router as products_router
from app.routes.sales import router as sales_router
from app.models.fbr_invoice import FBRInvoiceLog
from app.routes.fbr_invoices import router as fbr_router
from app.routes.forecast import router as forecast_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="HUMAITEC AI POS with FBR Integration",
    version="0.1.0",
)

app.include_router(products_router)
app.include_router(sales_router)
app.include_router(fbr_router)
app.include_router(forecast_router)


@app.get("/")
def home():
    return {"message": "HUMAITEC AI POS API is running"}


@app.get("/health")
def health():
    return {"status": "healthy"}