from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models import Project, Skill
from app.schemas import ProjectResponse, SkillResponse

router = APIRouter(tags=["Public API"])

@router.get("/health")
def health_check():
    """Health check endpoint for monitoring."""
    return {"status": "healthy", "service": "portfolio-api", "version": "1.0.0"}

@router.get("/projects", response_model=List[ProjectResponse])
def get_published_projects(
    category: Optional[str] = None,
    featured_only: bool = False,
    db: Session = Depends(get_db)
):
    """
    Public endpoint: Returns all published projects ordered by display order.
    Draft projects are strictly filtered out.
    """
    query = db.query(Project).filter(Project.status == "published")

    if category and isinstance(category, str) and category.lower() != "all":
        query = query.filter(Project.category == category.lower())

    if featured_only:
        query = query.filter(Project.is_featured == True)

    projects = query.order_by(Project.display_order.asc(), Project.created_at.desc()).all()
    return projects

@router.get("/projects/{slug_or_id}", response_model=ProjectResponse)
def get_published_project_by_slug_or_id(
    slug_or_id: str,
    db: Session = Depends(get_db)
):
    """
    Public endpoint: Get a single published project by its URL-friendly slug or UUID.
    Draft projects return 404 Not Found.
    """
    project = db.query(Project).filter(
        Project.status == "published",
        or_(Project.slug == slug_or_id, Project.id == slug_or_id)
    ).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project '{slug_or_id}' was not found or is not currently published."
        )

    return project

@router.get("/skills", response_model=List[SkillResponse])
def get_published_skills(
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Public endpoint: Returns all published skills ordered by display order.
    Draft skills are strictly filtered out.
    """
    query = db.query(Skill).filter(Skill.status == "published")

    if category and isinstance(category, str):
        query = query.filter(Skill.category == category)

    skills = query.order_by(Skill.category.asc(), Skill.display_order.asc(), Skill.name.asc()).all()
    return skills
