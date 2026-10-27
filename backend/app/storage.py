import os
import uuid
from pathlib import Path
from typing import Tuple
import httpx
from fastapi import UploadFile, HTTPException, status
from app.config import settings

class StorageService:
    def __init__(self):
        self.upload_dir = settings.UPLOAD_DIR
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    def validate_file(self, file: UploadFile, content: bytes) -> None:
        """Validate content type and file size."""
        # 1. Validate MIME type
        if file.content_type not in settings.ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type '{file.content_type}'. Allowed types: {', '.join(settings.ALLOWED_IMAGE_TYPES)}"
            )

        # 2. Validate file size
        if len(content) > settings.MAX_UPLOAD_SIZE_BYTES:
            max_mb = settings.MAX_UPLOAD_SIZE_BYTES / (1024 * 1024)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File exceeds maximum allowed size of {max_mb:.1f} MB."
            )

    async def upload_image(self, file: UploadFile) -> Tuple[str, str, int]:
        """
        Uploads an image file to Supabase Storage if configured,
        or persists locally in the backend/uploads directory.
        Returns: (public_url, filename, size_bytes)
        """
        content = await file.read()
        self.validate_file(file, content)

        # Determine extension and unique filename
        original_ext = Path(file.filename or "upload.png").suffix.lower()
        if not original_ext:
            ext_map = {
                "image/jpeg": ".jpg",
                "image/png": ".png",
                "image/webp": ".webp",
                "image/svg+xml": ".svg",
                "image/gif": ".gif"
            }
            original_ext = ext_map.get(file.content_type, ".png")

        unique_filename = f"{uuid.uuid4().hex}{original_ext}"
        size_bytes = len(content)

        # 1. Supabase Storage Upload (if configured)
        if settings.SUPABASE_URL and settings.SUPABASE_KEY and settings.SUPABASE_BUCKET:
            try:
                upload_url = f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1/object/{settings.SUPABASE_BUCKET}/{unique_filename}"
                headers = {
                    "Authorization": f"Bearer {settings.SUPABASE_KEY}",
                    "apikey": settings.SUPABASE_KEY,
                    "Content-Type": file.content_type or "application/octet-stream",
                    "x-upsert": "true"
                }

                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.post(upload_url, content=content, headers=headers)
                    if resp.status_code in [200, 201]:
                        public_url = f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1/object/public/{settings.SUPABASE_BUCKET}/{unique_filename}"
                        return public_url, unique_filename, size_bytes
                    else:
                        print(f"[Supabase Storage Error] Status {resp.status_code}: {resp.text}")
                        # Fallback to local storage if Supabase returned an error
            except Exception as e:
                print(f"[Supabase Storage Exception]: {e}")
                # Fallback to local storage

        # 2. Persistent Local Storage Fallback
        dest_path = self.upload_dir / unique_filename
        with open(dest_path, "wb") as f:
            f.write(content)

        local_url = f"/uploads/{unique_filename}"
        return local_url, unique_filename, size_bytes

storage_service = StorageService()
