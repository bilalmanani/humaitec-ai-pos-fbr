from datetime import datetime

from pydantic import BaseModel, Field


class CheckoutItem(BaseModel):
    product_id: int = Field(gt=0)
    quantity: int = Field(gt=0)


class CheckoutRequest(BaseModel):
    items: list[CheckoutItem] = Field(min_length=1)
    payment_method: str = Field(
        min_length=2,
        max_length=50,
    )
    discount: float = Field(
        default=0.0,
        ge=0,
    )


class SaleItemReceipt(BaseModel):
    id: int
    product_id: int
    product_name: str
    unit_price: float
    quantity: int
    line_total: float

    model_config = {
        "from_attributes": True,
    }


class SaleReceipt(BaseModel):
    id: int
    sale_number: str
    payment_method: str
    subtotal: float
    discount: float
    tax_rate: float
    tax_amount: float
    total_amount: float
    created_at: datetime
    items: list[SaleItemReceipt]

    model_config = {
        "from_attributes": True,
    }