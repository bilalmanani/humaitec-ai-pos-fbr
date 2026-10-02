from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.customer import Customer
from app.schemas.customer import (
    CustomerLogin,
    CustomerResponse,
    CustomerSignup,
    TokenResponse,
)
from app.security import (
    create_access_token,
    hash_password,
    verify_password,
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post(
    "/signup",
    response_model=CustomerResponse,
    status_code=status.HTTP_201_CREATED,
)
def signup(
    data: CustomerSignup,
    db: Session = Depends(get_db),
):
    email = data.email.lower().strip()

    existing_customer = (
        db.query(Customer)
        .filter(Customer.email == email)
        .first()
    )

    if existing_customer:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account already exists with this email.",
        )

    customer = Customer(
        full_name=data.full_name.strip(),
        email=email,
        password_hash=hash_password(data.password),
        role="cashier",
    )

    db.add(customer)
    db.commit()
    db.refresh(customer)

    return customer


@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    data: CustomerLogin,
    db: Session = Depends(get_db),
):
    email = data.email.lower().strip()

    customer = (
        db.query(Customer)
        .filter(Customer.email == email)
        .first()
    )

    if not customer or not verify_password(
        data.password,
        customer.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    if not customer.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is inactive.",
        )

    access_token = create_access_token(
        {
            "sub": str(customer.id),
            "email": customer.email,
            "role": customer.role,
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": customer,
    }