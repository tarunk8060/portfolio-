from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models import Skill, AdminUser
from app.schemas import SkillCreate, SkillUpdate, SkillResponse
from app.auth import get_current_admin

router = APIRouter(prefix="/admin/skills", tags=["Admin Skill Management"])

@router.get("", response_model=List[SkillResponse])
def list_admin_skills(
    category: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """
    List all skills (including drafts) with category and search filters.
    Protected: Requires valid admin JWT.
    """
    query = db.query(Skill)

    if category and isinstance(category, str) and category.lower() != "all":
        query = query.filter(Skill.category == category)

    if status and isinstance(status, str) and status.lower() != "all":
        query = query.filter(Skill.status == status.lower())

    if search and isinstance(search, str) and search.strip():
        term = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                Skill.name.ilike(term),
                Skill.description.ilike(term),
                Skill.category.ilike(term)
            )
        )

    skills = query.order_by(Skill.category.asc(), Skill.display_order.asc(), Skill.created_at.desc()).all()
    return skills

@router.post("", response_model=SkillResponse, status_code=status.HTTP_201_CREATED)
def create_skill(
    skill_in: SkillCreate,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """
    Create a new skill.
    Protected: Requires valid admin JWT.
    """
    skill = Skill(
        name=skill_in.name,
        category=skill_in.category,
        description=skill_in.description,
        icon_url=skill_in.icon_url,
        badge_label=skill_in.badge_label,
        status=skill_in.status,
        display_order=skill_in.display_order
    )
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return skill

@router.get("/{skill_id}", response_model=SkillResponse)
def get_skill(
    skill_id: str,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """
    Get skill by ID.
    Protected: Requires valid admin JWT.
    """
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found.")
    return skill

@router.put("/{skill_id}", response_model=SkillResponse)
def update_skill(
    skill_id: str,
    skill_update: SkillUpdate,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """
    Update a skill.
    Protected: Requires valid admin JWT.
    """
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found.")

    update_data = skill_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(skill, field, value)

    db.commit()
    db.refresh(skill)
    return skill

@router.delete("/{skill_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_skill(
    skill_id: str,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """
    Delete a skill.
    Protected: Requires valid admin JWT.
    """
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found.")

    db.delete(skill)
    db.commit()
    return None

@router.patch("/{skill_id}/status", response_model=SkillResponse)
def toggle_skill_status(
    skill_id: str,
    status: str,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """
    Quick status toggle for a skill.
    Protected: Requires valid admin JWT.
    """
    if status not in ("draft", "published"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Status must be 'draft' or 'published'.")

    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found.")

    skill.status = status
    db.commit()
    db.refresh(skill)
    return skill
