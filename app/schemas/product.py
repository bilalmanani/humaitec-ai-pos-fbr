from pydantic import BaseModel,Field

class ProductCreate(BaseModel):
    name:str=Field(min_length=2,max_length=150)
    sku:str=Field(min_length=2,max_length=50)
    category: str = "General"
    price: float = Field(gt=0)
    stock_quantity: int = Field(ge=0)



class ProductResponse(ProductCreate):
    id: int
    is_active: bool

    model_config = {"from_attributes": True}