from pydantic import BaseModel, Field


class ProductVariantCreate(BaseModel):
    sku: str = Field(min_length=2, max_length=80)
    size: str | None = Field(default=None, max_length=50)
    color: str | None = Field(default=None, max_length=50)
    flavor: str | None = Field(default=None, max_length=50)
    price: float = Field(gt=0)
    stock_quantity: int = Field(ge=0)


class ProductVariantResponse(ProductVariantCreate):
    id: int
    product_id: int
    is_active: bool

    model_config = {"from_attributes": True}


class ProductCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    sku: str = Field(min_length=2, max_length=50)
    category: str = "General"
    image_url: str | None = Field(
    default=None,
    max_length=500,
)
    price: float = Field(gt=0)
    stock_quantity: int = Field(ge=0)


class ProductResponse(ProductCreate):
    id: int
    is_active: bool
    variants: list[ProductVariantResponse] = Field(default_factory=list)

    model_config = {"from_attributes": True}