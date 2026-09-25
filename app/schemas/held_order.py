from datetime import datetime

from pydantic import BaseModel, Field


class HeldOrderItem(BaseModel):
    id: int
    name: str
    sku: str
    price: float
    stock_quantity: int
    quantity: int = Field(gt=0)


class HeldOrderCreate(BaseModel):
    items: list[HeldOrderItem] = Field(min_length=1)
    discount_percentage: float = Field(default=0, ge=0, le=100)
    payment_method: str = "cash"


class HeldOrderResponse(BaseModel):
    id: int
    hold_number: str
    items: list[HeldOrderItem]
    discount_percentage: float
    payment_method: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}