class AppError(Exception):
    def __init__(self, message: str, status_code: int = 500, detail: dict | None = None):
        self.message = message
        self.status_code = status_code
        self.detail = detail or {}
        super().__init__(message)


class NotFoundError(AppError):
    def __init__(self, entity: str, identifier: str):
        super().__init__(
            message=f"{entity} not found: {identifier}",
            status_code=404,
            detail={"entity": entity, "identifier": identifier},
        )


class UnauthorizedError(AppError):
    def __init__(self, message: str = "Authentication required"):
        super().__init__(message=message, status_code=401)


class ForbiddenError(AppError):
    def __init__(self, message: str = "Access denied"):
        super().__init__(message=message, status_code=403)


class ConflictError(AppError):
    def __init__(self, message: str):
        super().__init__(message=message, status_code=409)


class ValidationError(AppError):
    def __init__(self, message: str):
        super().__init__(message=message, status_code=422)


class AgentError(AppError):
    def __init__(self, message: str = "Agent processing failed"):
        super().__init__(message=message, status_code=500)


class MemoryError(AppError):
    def __init__(self, message: str = "Memory operation failed"):
        super().__init__(message=message, status_code=500)