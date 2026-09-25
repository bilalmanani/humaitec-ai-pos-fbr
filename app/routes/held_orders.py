from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.held_order import HeldOrder
from app.schemas.held_order import HeldOrderCreate, HeldOrderResponse


router = APIRouter(
    prefix="/held-orders",
    tags=["Held Orders"],
)


@router.post(
    "/",
    response_model=HeldOrderResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_held_order(
    data: HeldOrderCreate,
    db: Session = Depends(get_db),
):
    hold_number = (
        f"HOLD-{datetime.now():%Y%m%d}-{uuid4().hex[:6].upper()}"
    )

    held_order = HeldOrder(
        hold_number=hold_number,
        items=[item.model_dump() for item in data.items],
        discount_percentage=data.discount_percentage,
        payment_method=data.payment_method,
        status="held",
    )

    db.add(held_order)
    db.commit()
    db.refresh(held_order)

    return held_order


@router.get("/", response_model=list[HeldOrderResponse])
def list_held_orders(db: Session = Depends(get_db)):
    return (
        db.query(HeldOrder)
        .filter(HeldOrder.status == "held")
        .order_by(HeldOrder.id.desc())
        .all()
    )


@router.get("/{held_order_id}", response_model=HeldOrderResponse)
def get_held_order(
    held_order_id: int,
    db: Session = Depends(get_db),
):
    held_order = (
        db.query(HeldOrder)
        .filter(
            HeldOrder.id == held_order_id,
            HeldOrder.status == "held",
        )
        .first()
    )

    if not held_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Held order was not found.",
        )

    return held_order


@router.delete("/{held_order_id}")
def delete_held_order(
    held_order_id: int,
    db: Session = Depends(get_db),
):
    held_order = (
        db.query(HeldOrder)
        .filter(HeldOrder.id == held_order_id)
        .first()
    )

    if not held_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Held order was not found.",
        )

    db.delete(held_order)
    db.commit()

    return {
        "message": "Held order deleted successfully.",
    }