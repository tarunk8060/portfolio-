from fastapi import APIRouter, Depends, UploadFile, File, status
from app.models import AdminUser
from app.schemas import UploadResponse
from app.auth import get_current_admin
from app.storage import storage_service

router = APIRouter(prefix="/admin/upload", tags=["Admin Media Storage"])

@router.post("", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_media_image(
    file: UploadFile = File(...),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """
    Upload an image thumbnail or screenshot to persistent object storage.
    Validates file format (PNG, JPEG, WebP, SVG, GIF) and max size (5MB).
    Protected: Requires valid admin JWT.
    """
    public_url, filename, size_bytes = await storage_service.upload_image(file)

    return UploadResponse(
        url=public_url,
        filename=filename,
        content_type=file.content_type or "application/octet-stream",
        size_bytes=size_bytes
    )
