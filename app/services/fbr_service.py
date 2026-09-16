import base64
import json
from io import BytesIO
from uuid import uuid4

import qrcode
from sqlalchemy.orm import Session

from app.models.fbr_invoice import FBRInvoiceLog
from app.models.sale import Sale


def submit_mock_fbr_invoice(sale_id: int, db: Session):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()

    if not sale:
        return None

    existing_invoice = (
        db.query(FBRInvoiceLog)
        .filter(FBRInvoiceLog.sale_id == sale_id)
        .first()
    )

    if existing_invoice:
        return existing_invoice

    payload = {
        "sale_number": sale.sale_number,
        "total_amount": sale.total_amount,
        "payment_method": sale.payment_method,
        "items": [
            {
                "name": item.product_name,
                "quantity": item.quantity,
                "price": item.unit_price,
            }
            for item in sale.items
        ],
    }

    fbr_invoice_number = f"FBR-MOCK-{uuid4().hex[:10].upper()}"

    qr_content = json.dumps(
        {
            "invoice_number": fbr_invoice_number,
            "sale_number": sale.sale_number,
            "total": sale.total_amount,
        }
    )

    qr_image = qrcode.make(qr_content)
    buffer = BytesIO()
    qr_image.save(buffer, format="PNG")

    qr_code_data = base64.b64encode(buffer.getvalue()).decode("utf-8")

    invoice_log = FBRInvoiceLog(
        sale_id=sale.id,
        status="ACCEPTED_MOCK",
        fbr_invoice_number=fbr_invoice_number,
        qr_code_data=qr_code_data,
        request_payload=json.dumps(payload),
        response_message="Mock FBR sandbox invoice accepted successfully.",
    )

    db.add(invoice_log)
    db.commit()
    db.refresh(invoice_log)

    return invoice_log