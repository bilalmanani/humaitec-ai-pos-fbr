from datetime import datetime
from sqlalchemy import DateTime,Integer,Float,ForeignKey,String,Text,func
from sqlalchemy.orm import Mapped,mapped_column
from app.database.database import Base


class FBRInvoiceLog(Base):
    __tablename__="fbr_invoice_logs"

    id:Mapped[int]=mapped_column(primary_key=True)
    sale_id:Mapped[int]=mapped_column(ForeignKey("sales.id"),unique=True)
    status:Mapped[str]=mapped_column(String(50),default="PENDING")
    fbr_invoice_number:Mapped[str|None]=mapped_column(String(100),nullable=True)
    qr_code_data:Mapped[str|None]=mapped_column(Text,nullable=True)
    request_payload:Mapped[str]=mapped_column(Text)
    response_message:Mapped[str]=mapped_column(Text,nullable=True)
    retry_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at:Mapped[datetime]=mapped_column(DateTime(timezone=True),server_default=func.now())
