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
    tags=["Customer Authentication"],
)


@router.post(
    "/signup",
    response_model=CustomerResponse,
    status_code=status.HTTP_201_CREATED,
)
def signup(
    customer_data: CustomerSignup,
    db: Session = Depends(get_db),
):
    email = customer_data.email.strip().lower()

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
        full_name=customer_data.full_name.strip(),
        email=email,
        password_hash=hash_password(customer_data.password),
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
    login_data: CustomerLogin,
    db: Session = Depends(get_db),
):
    email = login_data.email.strip().lower()

    customer = (
        db.query(Customer)
        .filter(Customer.email == email)
        .first()
    )

    if (
        not customer
        or not customer.is_active
        or not verify_password(
            login_data.password,
            customer.password_hash,
        )
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    token = create_access_token(customer.id)

    return {
        "access_token": token,
        "token_type": "bearer",
        "customer": customer,
    }