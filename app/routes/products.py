from app.database.database import get_db
from fastapi import APIRouter,Depends,HTTPException,status
from app.models.product import Product
from app.schemas.product import ProductCreate,ProductResponse
from sqlalchemy.orm import Session


router=APIRouter(
    prefix="/products",
    tags=["Products"]
)

@router.post("/",
    response_model=ProductResponse,status_code=status.HTTP_201_CREATED
)
def create_product(product:ProductCreate,db:Session=Depends(get_db)):
    existing_product=(db.query(Product).filter(Product.sku==product.sku).first())

    if existing_product:
        raise HTTPException(status_code=404,detail="the sku product alrady exit")

    new_product=Product(**product.model_dump())
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

@router.get("/", response_model=list[ProductResponse])
def list_products(db: Session = Depends(get_db)):
    return db.query(Product).order_by(Product.id.desc()).all()


    
@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    return product


