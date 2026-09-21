from app.database.database import get_db
from fastapi import APIRouter,Depends,HTTPException,status
from app.models.product import Product
from app.schemas.product import ProductCreate,ProductResponse
from sqlalchemy.orm import Session
from app.models.sale import SaleItem

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


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_data: ProductCreate,
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == product_id).first()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found.",
        )

    duplicate_sku = (
        db.query(Product)
        .filter(Product.sku == product_data.sku, Product.id != product_id)
        .first()
    )

    if duplicate_sku:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Another product already uses this SKU.",
        )

    product.name = product_data.name
    product.sku = product_data.sku
    product.category = product_data.category
    product.price = product_data.price
    product.stock_quantity = product_data.stock_quantity

    db.commit()
    db.refresh(product)

    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found.",
        )

    used_in_sale = (
        db.query(SaleItem)
        .filter(SaleItem.product_id == product_id)
        .first()
    )

    if used_in_sale:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This product cannot be deleted because it is used in a sale.",
        )

    db.delete(product)
    db.commit()

