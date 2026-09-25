from datetime import datetime

from sqlalchemy import DateTime, Float, JSON, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.database import Base


class HeldOrder(Base):
    __tablename__ = "held_orders"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    hold_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
    )

    items: Mapped[list] = mapped_column(JSON)

    discount_percentage: Mapped[float] = mapped_column(
        Float,
        default=0,
    )

    payment_method: Mapped[str] = mapped_column(
        String(30),
        default="cash",
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="held",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )