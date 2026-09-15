from datetime import datetime

from pydantic import BaseModel, Field


class CheckoutItem(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)


class CheckoutRequest(BaseModel):
    items: list[CheckoutItem] = Field(min_length=1)
    payment_method: str = "cash"
    discount: float = Field(default=0, ge=0)


class ReceiptItem(BaseModel):
    product_name: str
    unit_price: float
    quantity: int
    line_total: float

    model_config = {"from_attributes": True}


class SaleReceipt(BaseModel):
    id: int
    sale_number: str
    payment_method: str
    subtotal: float
    discount: float
    total_amount: float
    created_at: datetime
    items: list[ReceiptItem]

    model_config = {"from_attributes": True}