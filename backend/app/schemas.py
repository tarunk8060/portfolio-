from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, HttpUrl, field_validator
import re

# ---------------------------------------------------------
# AUTH SCHEMAS
# ---------------------------------------------------------
class LoginRequest(BaseModel):
    email: str = Field(..., example="admin@tarunk.dev")
    password: str = Field(..., example="Admin@TarunK2026!")

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: Dict[str, Any]

class TokenPayload(BaseModel):
    sub: str  # user id or email
    exp: int

class AdminUserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# ---------------------------------------------------------
# PROJECT SCHEMAS
# ---------------------------------------------------------
class ProjectBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=255, example="APEX Cinemas — Movie Booking")
    slug: Optional[str] = Field(None, max_length=255, example="apex-cinemas")
    short_description: str = Field(..., max_length=500, example="A full-stack movie ticket booking platform.")
    full_description: str = Field(..., example="A detailed description of the architecture and features...")
    technologies: List[str] = Field(default_factory=list, example=["HTML5", "FastAPI", "PostgreSQL"])
    highlights: List[str] = Field(default_factory=list, example=["Self-contained platform", "Selective seat cancellation"])
    thumbnail_url: str = Field(..., max_length=1024, example="assets/images/apex-cinemas-preview.png")
    github_url: Optional[str] = Field(None, max_length=1024, example="https://github.com/tarunk8060/APEX-cinemas")
    live_demo_url: Optional[str] = Field(None, max_length=1024, example="https://apex-cinemas.vercel.app/")
    category: str = Field("fullstack", max_length=100, example="fullstack")
    is_featured: bool = Field(False)
    status: str = Field("draft", pattern="^(draft|published)$")
    display_order: int = Field(0, ge=0)

    @field_validator("slug", mode="before")
    def generate_slug_if_missing(cls, v, values):
        if v and v.strip():
            slug_clean = re.sub(r"[^a-zA-Z0-9\-_]", "-", v.lower().strip())
            return re.sub(r"-+", "-", slug_clean).strip("-")
        return v

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=255)
    slug: Optional[str] = Field(None, max_length=255)
    short_description: Optional[str] = Field(None, max_length=500)
    full_description: Optional[str] = None
    technologies: Optional[List[str]] = None
    highlights: Optional[List[str]] = None
    thumbnail_url: Optional[str] = Field(None, max_length=1024)
    github_url: Optional[str] = Field(None, max_length=1024)
    live_demo_url: Optional[str] = Field(None, max_length=1024)
    category: Optional[str] = Field(None, max_length=100)
    is_featured: Optional[bool] = None
    status: Optional[str] = Field(None, pattern="^(draft|published)$")
    display_order: Optional[int] = Field(None, ge=0)

class ProjectResponse(ProjectBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ---------------------------------------------------------
# SKILL SCHEMAS
# ---------------------------------------------------------
class SkillBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, example="Python")
    category: str = Field(..., min_length=1, max_length=100, example="Programming Languages")
    description: str = Field(..., example="Scripting, automation, data manipulation, and backend prototyping.")
    icon_url: Optional[str] = Field(None, max_length=1024, example="Py")
    badge_label: Optional[str] = Field(None, max_length=100, example="Backend & Scripting")
    status: str = Field("published", pattern="^(draft|published)$")
    display_order: int = Field(0, ge=0)

class SkillCreate(SkillBase):
    pass

class SkillUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    icon_url: Optional[str] = Field(None, max_length=1024)
    badge_label: Optional[str] = Field(None, max_length=100)
    status: Optional[str] = Field(None, pattern="^(draft|published)$")
    display_order: Optional[int] = Field(None, ge=0)

class SkillResponse(SkillBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ---------------------------------------------------------
# DASHBOARD STATS SCHEMA
# ---------------------------------------------------------
class RecentItem(BaseModel):
    id: str
    type: str  # 'project' or 'skill'
    title: str
    status: str
    updated_at: datetime

class DashboardStatsResponse(BaseModel):
    total_projects: int
    published_projects: int
    draft_projects: int
    total_skills: int
    published_skills: int
    draft_skills: int
    recent_activity: List[RecentItem]

# ---------------------------------------------------------
# MEDIA UPLOAD SCHEMA
# ---------------------------------------------------------
class UploadResponse(BaseModel):
    url: str
    filename: str
    content_type: str
    size_bytes: int
