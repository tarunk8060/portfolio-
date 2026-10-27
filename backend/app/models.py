import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Boolean, Integer, DateTime, JSON
from app.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class AdminUser(Base):
    __tablename__ = "admin_users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False, default="Tarun K")
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now)

class Project(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    short_description = Column(String(500), nullable=False)
    full_description = Column(Text, nullable=False)
    technologies = Column(JSON, nullable=False, default=list)
    highlights = Column(JSON, nullable=False, default=list)
    thumbnail_url = Column(String(1024), nullable=False)
    github_url = Column(String(1024), nullable=True)
    live_demo_url = Column(String(1024), nullable=True)
    category = Column(String(100), nullable=False, default="fullstack", index=True)
    is_featured = Column(Boolean, nullable=False, default=False, index=True)
    status = Column(String(20), nullable=False, default="draft", index=True)  # 'draft' | 'published'
    display_order = Column(Integer, nullable=False, default=0, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now)

class Skill(Base):
    __tablename__ = "skills"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    category = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=False)
    icon_url = Column(String(1024), nullable=True)
    badge_label = Column(String(100), nullable=True)
    status = Column(String(20), nullable=False, default="published", index=True)  # 'draft' | 'published'
    display_order = Column(Integer, nullable=False, default=0, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now)
