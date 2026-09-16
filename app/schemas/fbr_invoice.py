from datetime import datetime
from pydantic import BaseModel,Field



class FBRInvoiceResponse(BaseModel):
    sale_id:int
    status:str
    fbr_invoice_number:str|None
    qr_code_data:str|None
    response_message:str|None
    retry_count: int
    created_at: datetime

    model_config={"from_attributes":True}