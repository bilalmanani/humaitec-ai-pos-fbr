from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.fbr_invoice import FBRInvoiceResponse
from app.services.fbr_service import submit_mock_fbr_invoice
from app.models.fbr_invoice import FBRInvoiceLog

router = APIRouter(
    prefix="/fbr",
    tags=["FBR Mock Integration"],
)


@router.post(
    "/invoices/{sale_id}/submit",
    response_model=FBRInvoiceResponse,
    status_code=status.HTTP_201_CREATED,
)
def submit_invoice(sale_id: int, db: Session = Depends(get_db)):
    invoice = submit_mock_fbr_invoice(sale_id, db)

    if not invoice:
        raise HTTPException(status_code=404, detail="Sale not found.")

    return invoice

@router.get("/invoices", response_model=list[FBRInvoiceResponse])
def list_fbr_invoices(db: Session = Depends(get_db)):
    return (
        db.query(FBRInvoiceLog)
        .order_by(FBRInvoiceLog.id.desc())
        .all()
    )