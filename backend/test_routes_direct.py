from app.database import SessionLocal
from app.routers import public, admin_auth, admin_projects, admin_skills, admin_stats
from app.schemas import LoginRequest, ProjectCreate, ProjectUpdate, SkillCreate, SkillUpdate
from app.auth import get_current_admin
from app.config import settings
from fastapi.security import HTTPAuthorizationCredentials

def run_tests():
    db = SessionLocal()
    try:
        print("--- 1. Testing Health Endpoint ---", flush=True)
        h = public.health_check()
        assert h["status"] == "healthy"
        print("✓ Health check OK:", h, flush=True)

        print("\n--- 2. Testing Public Read-Only Projects ---", flush=True)
        projects = public.get_published_projects(db=db)
        print(f"✓ Public projects retrieved: {len(projects)} projects.", flush=True)
        assert len(projects) >= 3
        for p in projects:
            assert p.status == "published"
            print(f"  • [{p.category}] {p.title} (Order: {p.display_order})", flush=True)

        print("\n--- 3. Testing Public Read-Only Skills ---", flush=True)
        skills = public.get_published_skills(db=db)
        print(f"✓ Public skills retrieved: {len(skills)} skills.", flush=True)
        assert len(skills) >= 12
        for s in skills[:3]:
            print(f"  • [{s.category}] {s.name} ({s.badge_label})", flush=True)

        print("\n--- 4. Testing Admin Authentication ---", flush=True)
        # Test valid login
        token_obj = admin_auth.login_for_access_token(
            LoginRequest(email=settings.ADMIN_EMAIL, password=settings.ADMIN_PASSWORD),
            db=db
        )
        assert token_obj.access_token
        print("✓ Login successful! Token type:", token_obj.token_type, flush=True)

        # Test auth dependency
        creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token_obj.access_token)
        admin = get_current_admin(credentials=creds, db=db)
        assert admin.email == settings.ADMIN_EMAIL
        print("✓ Auth dependency verified admin user:", admin.email, flush=True)

        print("\n--- 5. Testing Dashboard Metrics ---", flush=True)
        stats = admin_stats.get_dashboard_metrics(db=db, current_admin=admin)
        print(f"✓ Stats: {stats.total_projects} projects ({stats.published_projects} pub, {stats.draft_projects} draft), {stats.total_skills} skills", flush=True)
        assert stats.total_projects >= 3
        assert stats.total_skills >= 12

        print("\n--- 6. Testing Project Management (Draft -> Public Isolation) ---", flush=True)
        # Create draft project
        new_proj = ProjectCreate(
            title="NextGen AI Workflow Automator",
            slug="nextgen-ai-workflow",
            short_description="Autonomous workflow execution engine.",
            full_description="Distributed task execution system with FastAPI and Celery.",
            technologies=["Python", "FastAPI", "PostgreSQL", "Docker"],
            highlights=["Autonomous graph execution", "Real-time state telemetry"],
            thumbnail_url="/uploads/nextgen-ai.png",
            github_url="https://github.com/tarunk8060/nextgen-ai",
            live_demo_url="https://nextgen.dev",
            category="fullstack",
            is_featured=False,
            status="draft",
            display_order=50
        )
        created = admin_projects.create_project(project_in=new_proj, db=db, current_admin=admin)
        print(f"✓ Created draft project ID: {created.id}, Slug: {created.slug}, Status: {created.status}", flush=True)

        # Verify NOT in public projects
        pub_after = public.get_published_projects(db=db)
        assert created.id not in [p.id for p in pub_after]
        print("✓ Confirmed: Draft project is hidden from public API.", flush=True)

        print("\n--- 7. Testing Publishing Draft Project ---", flush=True)
        published = admin_projects.toggle_project_status(
            project_id=created.id,
            status="published",
            db=db,
            current_admin=admin
        )
        assert published.status == "published"
        print("✓ Project status switched to 'published'.", flush=True)

        # Verify IS in public projects
        pub_after_publish = public.get_published_projects(db=db)
        assert created.id in [p.id for p in pub_after_publish]
        print("✓ Confirmed: Published project is dynamically visible in public API!", flush=True)

        print("\n--- 8. Testing Project Deletion ---", flush=True)
        admin_projects.delete_project(project_id=created.id, db=db, current_admin=admin)
        pub_after_del = public.get_published_projects(db=db)
        assert created.id not in [p.id for p in pub_after_del]
        print("✓ Project cleanly deleted from database.", flush=True)

        print("\n--- 9. Testing Skill Management CRUD ---", flush=True)
        new_skill = SkillCreate(
            name="GraphQL",
            category="Web Development",
            description="Declarative data fetching with typed schemas.",
            icon_url="GQL",
            badge_label="API Query Language",
            status="published",
            display_order=15
        )
        created_skill = admin_skills.create_skill(skill_in=new_skill, db=db, current_admin=admin)
        print(f"✓ Created skill: {created_skill.name} in category '{created_skill.category}'", flush=True)

        updated_skill = admin_skills.update_skill(
            skill_id=created_skill.id,
            skill_update=SkillUpdate(badge_label="Modern API Layer"),
            db=db,
            current_admin=admin
        )
        assert updated_skill.badge_label == "Modern API Layer"
        print("✓ Updated skill badge label:", updated_skill.badge_label, flush=True)

        admin_skills.delete_skill(skill_id=created_skill.id, db=db, current_admin=admin)
        print("✓ Deleted test skill successfully.", flush=True)

        print("\n=======================================================", flush=True)
        print("🎉 ALL BACKEND BUSINESS LOGIC & DATA TESTS PASSED!", flush=True)
        print("=======================================================", flush=True)
    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
