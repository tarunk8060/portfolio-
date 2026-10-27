import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    APP_NAME: str = "Tarun.K Portfolio CMS Backend"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database configuration
    # Supports PostgreSQL / Supabase (e.g. postgresql://postgres:password@db.supabase.co:5432/postgres)
    # or SQLite fallback for zero-configuration local development.
    DATABASE_URL: str = ""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.DATABASE_URL or "./portfolio.db" in self.DATABASE_URL:
            db_path = (BASE_DIR / "portfolio.db").as_posix()
            self.DATABASE_URL = f"sqlite:///{db_path}"

    # JWT Authentication
    JWT_SECRET: str = "tarunk_portfolio_admin_jwt_secret_dev_2026_super_secure"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Default Seed Admin Credentials
    ADMIN_EMAIL: str = "admin@tarunk.dev"
    ADMIN_PASSWORD: str = "Admin@TarunK2026!"
    ADMIN_NAME: str = "Tarun K"

    # Supabase Object Storage (Optional, falls back to persistent local storage)
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_BUCKET: str = "portfolio-media"

    # Persistent Local Storage fallback directory
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    MAX_UPLOAD_SIZE_BYTES: int = 5 * 1024 * 1024  # 5 MB
    ALLOWED_IMAGE_TYPES: List[str] = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/svg+xml",
        "image/gif"
    ]

    # CORS Allowed Origins
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]

    class Config:
        env_file = str(BASE_DIR / ".env")
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()

# Ensure uploads directory exists
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
