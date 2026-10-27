import re
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models import Project, AdminUser
from app.schemas import ProjectCreate, ProjectUpdate, ProjectResponse
from app.auth import get_current_admin

router = APIRouter(prefix="/admin/projects", tags=["Admin Project Management"])

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text.strip("-")

@router.get("", response_model=List[ProjectResponse])
def list_admin_projects(
    search: Optional[str] = None,
    status: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """
    List all projects (including drafts) with full filtering and search.
    Protected: Requires valid admin JWT.
    """
    query = db.query(Project)

    if status and isinstance(status, str) and status.lower() != "all":
        query = query.filter(Project.status == status.lower())

    if category and isinstance(category, str) and category.lower() != "all":
        query = query.filter(Project.category == category.lower())

    if search and isinstance(search, str) and search.strip():
        term = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                Project.title.ilike(term),
                Project.short_description.ilike(term),
                Project.full_description.ilike(term)
            )
        )

    projects = query.order_by(Project.display_order.asc(), Project.created_at.desc()).all()
    return projects

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    project_in: ProjectCreate,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """
    Create a new project. Auto-generates unique slug if omitted.
    Protected: Requires valid admin JWT.
    """
    target_slug = project_in.slug or slugify(project_in.title)

    # Ensure unique slug
    base_slug = target_slug
    counter = 1
    while True:
        existing = db.query(Project).filter(Project.slug == target_slug).first()
        if not existing:
            break
        target_slug = f"{base_slug}-{counter}"
        counter += 1

    project = Project(
        title=project_in.title,
        slug=target_slug,
        short_description=project_in.short_description,
        full_description=project_in.full_description,
        technologies=project_in.technologies,
        highlights=project_in.highlights,
        thumbnail_url=project_in.thumbnail_url,
        github_url=project_in.github_url,
        live_demo_url=project_in.live_demo_url,
        category=project_in.category or "fullstack",
        is_featured=project_in.is_featured,
        status=project_in.status,
        display_order=project_in.display_order
    )

    db.add(project)
    db.commit()
    db.refresh(project)
    return project

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """
    Retrieve project details by ID for editing.
    Protected: Requires valid admin JWT.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
    return project

@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: str,
    project_update: ProjectUpdate,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """
    Update an existing project's attributes.
    Protected: Requires valid admin JWT.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

    update_data = project_update.model_dump(exclude_unset=True)

    if "slug" in update_data and update_data["slug"]:
        new_slug = slugify(update_data["slug"])
        slug_check = db.query(Project).filter(Project.slug == new_slug, Project.id != project_id).first()
        if slug_check:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Slug '{new_slug}' is already taken by another project."
            )
        update_data["slug"] = new_slug

    for field, value in update_data.items():
        setattr(project, field, value)

    db.commit()
    db.refresh(project)
    return project

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """
    Delete a project permanently.
    Protected: Requires valid admin JWT.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

    db.delete(project)
    db.commit()
    return None

@router.patch("/{project_id}/status", response_model=ProjectResponse)
def toggle_project_status(
    project_id: str,
    status: str,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """
    Quick status toggle (Draft <-> Published).
    Protected: Requires valid admin JWT.
    """
    if status not in ("draft", "published"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Status must be 'draft' or 'published'.")

    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

    project.status = status
    db.commit()
    db.refresh(project)
    return project
