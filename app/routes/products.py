from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.database.database import get_db
from app.models.product import Product, ProductVariant
from app.models.sale import SaleItem
from app.schemas.product import (
    ProductCreate,
    ProductResponse,
    ProductVariantCreate,
    ProductVariantResponse,
)

router = APIRouter(
    prefix="/products",
    tags=["Products"],
)


def get_product_or_404(product_id: int, db: Session) -> Product:
    product = (
        db.query(Product)
        .options(selectinload(Product.variants))
        .filter(Product.id == product_id)
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found.",
        )

    return product


@router.post(
    "/",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    existing_product = (
        db.query(Product)
        .filter(Product.sku == product.sku)
        .first()
    )

    if existing_product:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A product with this SKU already exists.",
        )

    new_product = Product(**product.model_dump())

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return new_product


@router.get("/", response_model=list[ProductResponse])
def list_products(db: Session = Depends(get_db)):
    return (
        db.query(Product)
        .options(selectinload(Product.variants))
        .order_by(Product.id.desc())
        .all()
    )


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    return get_product_or_404(product_id, db)


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_data: ProductCreate,
    db: Session = Depends(get_db),
):
    product = get_product_or_404(product_id, db)

    duplicate_sku = (
        db.query(Product)
        .filter(
            Product.sku == product_data.sku,
            Product.id != product_id,
        )
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
    product.image_url = product_data.image_url
    product.price = product_data.price
    product.stock_quantity = product_data.stock_quantity

    db.commit()
    db.refresh(product)

    return product


@router.delete(
    "/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = get_product_or_404(product_id, db)

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


@router.post(
    "/{product_id}/variants",
    response_model=ProductVariantResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_product_variant(
    product_id: int,
    variant: ProductVariantCreate,
    db: Session = Depends(get_db),
):
    get_product_or_404(product_id, db)

    existing_variant = (
        db.query(ProductVariant)
        .filter(ProductVariant.sku == variant.sku)
        .first()
    )

    if existing_variant:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A variant with this SKU already exists.",
        )

    new_variant = ProductVariant(
        product_id=product_id,
        **variant.model_dump(),
    )

    db.add(new_variant)
    db.commit()
    db.refresh(new_variant)

    return new_variant


@router.put(
    "/{product_id}/variants/{variant_id}",
    response_model=ProductVariantResponse,
)
def update_product_variant(
    product_id: int,
    variant_id: int,
    variant_data: ProductVariantCreate,
    db: Session = Depends(get_db),
):
    variant = (
        db.query(ProductVariant)
        .filter(
            ProductVariant.id == variant_id,
            ProductVariant.product_id == product_id,
        )
        .first()
    )

    if not variant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product variant not found.",
        )

    duplicate_sku = (
        db.query(ProductVariant)
        .filter(
            ProductVariant.sku == variant_data.sku,
            ProductVariant.id != variant_id,
        )
        .first()
    )

    if duplicate_sku:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Another variant already uses this SKU.",
        )

    variant.sku = variant_data.sku
    variant.size = variant_data.size
    variant.color = variant_data.color
    variant.flavor = variant_data.flavor
    variant.price = variant_data.price
    variant.stock_quantity = variant_data.stock_quantity

    db.commit()
    db.refresh(variant)

    return variant


@router.delete(
    "/{product_id}/variants/{variant_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_product_variant(
    product_id: int,
    variant_id: int,
    db: Session = Depends(get_db),
):
    variant = (
        db.query(ProductVariant)
        .filter(
            ProductVariant.id == variant_id,
            ProductVariant.product_id == product_id,
        )
        .first()
    )

    if not variant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product variant not found.",
        )

    db.delete(variant)
    db.commit()