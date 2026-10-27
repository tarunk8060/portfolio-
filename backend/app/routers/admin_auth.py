from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import AdminUser
from app.schemas import LoginRequest, Token, AdminUserResponse
from app.auth import verify_password, create_access_token, get_current_admin
from app.config import settings

router = APIRouter(prefix="/auth", tags=["Admin Authentication"])

@router.post("/login", response_model=Token)
def login_for_access_token(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Authenticate admin credentials and return a signed JWT bearer token.
    """
    normalized_email = login_data.email.strip().lower()
    admin = db.query(AdminUser).filter(AdminUser.email == normalized_email).first()

    if not admin or not verify_password(login_data.password, admin.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This admin account is disabled."
        )

    access_token = create_access_token(data={"sub": admin.id, "email": admin.email})

    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user={
            "id": admin.id,
            "email": admin.email,
            "full_name": admin.full_name
        }
    )

@router.get("/me", response_model=AdminUserResponse)
def get_current_authenticated_admin(
    admin: AdminUser = Depends(get_current_admin)
):
    """
    Verify the active JWT session and return current admin user details.
    """
    return admin
