from sqlalchemy import Boolean, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.database import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)

    # Parent SKU, for example: TSHIRT
    sku: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
    )

    category: Mapped[str] = mapped_column(
        String(100),
        default="General",
    )
    image_url: Mapped[str | None] = mapped_column(
    String(500),
    nullable=True,
)

    price: Mapped[float] = mapped_column(Float, nullable=False)
    stock_quantity: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    variants: Mapped[list["ProductVariant"]] = relationship(
        back_populates="product",
        cascade="all, delete-orphan",
    )


class ProductVariant(Base):
    __tablename__ = "product_variants"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id"),
        nullable=False,
        index=True,
    )

    # Variant SKU, for example: TSHIRT-BLACK-M
    sku: Mapped[str] = mapped_column(
        String(80),
        unique=True,
        nullable=False,
    )

    size: Mapped[str | None] = mapped_column(String(50), nullable=True)
    color: Mapped[str | None] = mapped_column(String(50), nullable=True)
    flavor: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Allows a variant price different from its parent product.
    price: Mapped[float] = mapped_column(Float, nullable=False)
    stock_quantity: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    product: Mapped["Product"] = relationship(back_populates="variants")