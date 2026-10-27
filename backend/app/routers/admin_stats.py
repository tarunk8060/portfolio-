from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import Project, Skill, AdminUser
from app.schemas import DashboardStatsResponse, RecentItem
from app.auth import get_current_admin

router = APIRouter(prefix="/admin/stats", tags=["Admin Dashboard Analytics"])

@router.get("", response_model=DashboardStatsResponse)
def get_dashboard_metrics(
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """
    Computes key summary counts and recent activity for the Admin Dashboard.
    Protected: Requires valid admin JWT.
    """
    total_projects = db.query(func.count(Project.id)).scalar() or 0
    published_projects = db.query(func.count(Project.id)).filter(Project.status == "published").scalar() or 0
    draft_projects = db.query(func.count(Project.id)).filter(Project.status == "draft").scalar() or 0

    total_skills = db.query(func.count(Skill.id)).scalar() or 0
    published_skills = db.query(func.count(Skill.id)).filter(Skill.status == "published").scalar() or 0
    draft_skills = db.query(func.count(Skill.id)).filter(Skill.status == "draft").scalar() or 0

    recent_projects = db.query(Project).order_by(Project.updated_at.desc()).limit(5).all()
    recent_skills = db.query(Skill).order_by(Skill.updated_at.desc()).limit(5).all()

    combined_activity = []
    for p in recent_projects:
        combined_activity.append(RecentItem(
            id=p.id,
            type="project",
            title=p.title,
            status=p.status,
            updated_at=p.updated_at
        ))

    for s in recent_skills:
        combined_activity.append(RecentItem(
            id=s.id,
            type="skill",
            title=f"{s.name} ({s.category})",
            status=s.status,
            updated_at=s.updated_at
        ))

    combined_activity.sort(key=lambda x: x.updated_at, reverse=True)
    recent_activity = combined_activity[:8]

    return DashboardStatsResponse(
        total_projects=total_projects,
        published_projects=published_projects,
        draft_projects=draft_projects,
        total_skills=total_skills,
        published_skills=published_skills,
        draft_skills=draft_skills,
        recent_activity=recent_activity
    )
