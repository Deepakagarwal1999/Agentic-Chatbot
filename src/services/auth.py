from datetime import datetime, timezone, timedelta

import structlog
from jose import JWTError, jwt
from passlib.context import CryptContext

from src.core.config import get_settings
from src.core.exceptions import ConflictError, UnauthorizedError, ValidationError

logger = structlog.get_logger(__name__)
settings = get_settings()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# bcrypt silently truncates passwords >72 bytes. We reject them server-side
# so the frontend can surface a clear validation error.
MAX_PASSWORD_BYTES = 72


def _validate_password_length(password: str) -> None:
    if len(password.encode("utf-8")) > MAX_PASSWORD_BYTES:
        raise ValidationError(
            message=f"Password cannot be longer than {MAX_PASSWORD_BYTES} bytes."
        )


async def hash_password(password: str) -> str:
    _validate_password_length(password)
    import asyncio

    return await asyncio.to_thread(pwd_context.hash, password)


async def verify_password(plain: str, hashed: str) -> bool:
    _validate_password_length(plain)
    import asyncio

    return await asyncio.to_thread(pwd_context.verify, plain, hashed)


def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    claims = {"sub": user_id, "exp": expire, "iat": datetime.now(timezone.utc)}
    return jwt.encode(claims, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> str:
    try:
        payload = jwt.decode(
            token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm]
        )
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise UnauthorizedError("Invalid token payload")
        return user_id
    except JWTError:
        raise UnauthorizedError("Invalid or expired token")


async def register_user(
    user_repo,
    email: str,
    display_name: str,
    password: str,
) -> dict:
    existing = await user_repo.get_by_email(email)
    if existing:
        raise ConflictError("A user with this email already exists")

    hashed = await hash_password(password)
    user = await user_repo.create(email=email, display_name=display_name, hashed_password=hashed)
    logger.info("user_registered", user_id=str(user.id))

    token = create_access_token(str(user.id))
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": str(user.id), "email": user.email, "display_name": user.display_name},
    }


async def login_user(user_repo, email: str, password: str) -> dict:
    user = await user_repo.get_by_email(email)
    if not user:
        raise UnauthorizedError("Invalid email or password")

    if not await verify_password(password, user.hashed_password):
        raise UnauthorizedError("Invalid email or password")

    token = create_access_token(str(user.id))
    logger.info("user_logged_in", user_id=str(user.id))

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": str(user.id), "email": user.email, "display_name": user.display_name},
    }
