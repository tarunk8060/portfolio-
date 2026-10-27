from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.seed import seed_database
from app.routers import (
    public,
    admin_auth,
    admin_projects,
    admin_skills,
    admin_stats,
    admin_upload
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables exist and seed default admin & initial content
    print(f"[*] Starting {settings.APP_NAME}...", flush=True)
    try:
        seed_database()
    except Exception as e:
        print(f"[!] Warning during DB startup seed: {e}", flush=True)
    yield
    print("[*] Shutting down CMS backend...", flush=True)

app = FastAPI(
    title=settings.APP_NAME,
    description="Production-grade CMS API for Tarun.K Developer Portfolio. Manages dynamic projects, technical skills, media assets, and dashboard telemetry.",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount local uploads directory for persistent image serving
uploads_path = settings.UPLOAD_DIR
uploads_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_path)), name="uploads")

# Include API Routers under /api/v1
API_PREFIX = "/api/v1"
app.include_router(public.router, prefix=API_PREFIX)
app.include_router(admin_auth.router, prefix=API_PREFIX)
app.include_router(admin_projects.router, prefix=API_PREFIX)
app.include_router(admin_skills.router, prefix=API_PREFIX)
app.include_router(admin_stats.router, prefix=API_PREFIX)
app.include_router(admin_upload.router, prefix=API_PREFIX)

# Also mount admin portal static build/files at /admin if present
admin_portal_dir = Path(__file__).resolve().parent.parent.parent / "admin-portal"
if admin_portal_dir.exists():
    app.mount("/admin", StaticFiles(directory=str(admin_portal_dir), html=True), name="admin-portal")

@app.get("/")
def root():
    return {
        "message": "Tarun.K Portfolio CMS API is running.",
        "documentation": "/docs",
        "admin_portal": "/admin/",
        "api_v1": {
            "health": f"{API_PREFIX}/health",
            "projects": f"{API_PREFIX}/projects",
            "skills": f"{API_PREFIX}/skills"
        }
    }
