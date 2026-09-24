from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.database.database import get_db
from app.models.product import Product
from app.models.sale import Sale, SaleItem
from app.schemas.sale import CheckoutRequest, SaleReceipt


router = APIRouter(
    prefix="/sales",
    tags=["Sales and Checkout"],
)


@router.post(
    "/checkout",
    response_model=SaleReceipt,
    status_code=status.HTTP_201_CREATED,
)
def checkout(data: CheckoutRequest, db: Session = Depends(get_db)):
    subtotal = 0.0
    sale_items_data = []

    for item in data.items:
        product = (
            db.query(Product)
            .filter(Product.id == item.product_id)
            .first()
        )

        if not product or not product.is_active:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {item.product_id} was not found.",
            )

        if product.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for {product.name}.",
            )

        line_total = product.price * item.quantity
        subtotal += line_total

        sale_items_data.append(
            {
                "product": product,
                "quantity": item.quantity,
                "line_total": line_total,
            }
        )

    # This must be after the loop.
    # Now subtotal contains the amount for all items in the basket.
    if data.discount > subtotal:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Discount cannot be greater than the subtotal.",
        )

    total_amount = subtotal - data.discount

    sale_number = (
        f"POS-{datetime.now():%Y%m%d}-{uuid4().hex[:6].upper()}"
    )

    sale = Sale(
        sale_number=sale_number,
        payment_method=data.payment_method,
        subtotal=subtotal,
        discount=data.discount,
        total_amount=total_amount,
    )

    db.add(sale)
    db.flush()

    for item_data in sale_items_data:
        product = item_data["product"]
        quantity = item_data["quantity"]
        line_total = item_data["line_total"]

        product.stock_quantity -= quantity

        db.add(
            SaleItem(
                sale_id=sale.id,
                product_id=product.id,
                product_name=product.name,
                unit_price=product.price,
                quantity=quantity,
                line_total=line_total,
            )
        )

    db.commit()

    sale = (
        db.query(Sale)
        .options(selectinload(Sale.items))
        .filter(Sale.id == sale.id)
        .first()
    )

    return sale


@router.get("/", response_model=list[SaleReceipt])
def list_sales(db: Session = Depends(get_db)):
    return (
        db.query(Sale)
        .options(selectinload(Sale.items))
        .order_by(Sale.id.desc())
        .all()
    )