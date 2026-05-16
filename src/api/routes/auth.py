from typing import Annotated

import structlog
from fastapi import APIRouter, Depends, HTTPException

from src.api.deps import get_user_repo
from src.core.exceptions import AppError
from src.schemas.auth import (
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
    TokenResponse,
)
from src.services import auth as auth_service

router = APIRouter(prefix="/api/auth", tags=["auth"])
logger = structlog.get_logger(__name__)


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register_user(
    body: UserRegisterRequest,
    user_repo=Depends(get_user_repo),
):
    try:
        result = await auth_service.register_user(
            user_repo=user_repo,
            email=body.email,
            display_name=body.display_name,
            password=body.password,
        )
        return result
    except AppError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)


@router.post("/login", response_model=TokenResponse)
async def login_user(
    body: UserLoginRequest,
    user_repo=Depends(get_user_repo),
):
    try:
        result = await auth_service.login_user(
            user_repo=user_repo,
            email=body.email,
            password=body.password,
        )
        return result
    except AppError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)