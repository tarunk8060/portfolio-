from app.database import engine, Base, SessionLocal
from app.models import AdminUser, Project, Skill
from app.auth import hash_password
from app.config import settings

INITIAL_PROJECTS = [
    {
        "title": "APEX Cinemas — Movie Booking",
        "slug": "apex-cinemas",
        "category": "fullstack",
        "short_description": "A full-stack movie ticket booking platform with interactive seating, real-time booking management, and individual seat cancellations.",
        "full_description": "A self-developed movie booking platform with its own frontend, backend API, and database integration. Features an interactive seating interface allowing users to selectively cancel specific seats within an existing booking without having to cancel the whole ticket.",
        "technologies": ["HTML5", "CSS3", "JavaScript", "Python", "FastAPI", "PostgreSQL", "REST API"],
        "highlights": [
            "Self-Contained Platform: Frontend, FastAPI backend, and PostgreSQL with zero 3rd-party dependencies.",
            "Selective Seat Cancellation: Interactive seating interface allowing users to cancel specific seats."
        ],
        "thumbnail_url": "assets/images/apex-cinemas-preview.png",
        "github_url": "https://github.com/tarunk8060/APEX-cinemas",
        "live_demo_url": "https://apex-cinemas.vercel.app/",
        "is_featured": True,
        "status": "published",
        "display_order": 1
    },
    {
        "title": "Quantiva Dashboard UI",
        "slug": "quantiva-dashboard",
        "category": "analytics",
        "short_description": "A powerful analytics dashboard designed for startup CEOs to easily track post-launch metrics, product performance, and company statistics.",
        "full_description": "Quantiva Dashboard UI delivers post-launch founder telemetry with real-time MRR and customer acquisition graphs. Built with custom SVG data visualizations without heavy charting dependencies and responsive modular CSS Grid layout with zero framework overhead.",
        "technologies": ["HTML5", "CSS3", "Vanilla JavaScript"],
        "highlights": [
            "Post-launch founder telemetry with real-time MRR and customer acquisition graphs",
            "Custom SVG data visualization without heavy charting dependencies",
            "Intuitive dark-mode interface optimized for executive decision-making"
        ],
        "thumbnail_url": "assets/images/quantiva-preview.jpg",
        "github_url": "https://github.com/tarunk8060/Project-CRM-protype-",
        "live_demo_url": None,
        "is_featured": True,
        "status": "published",
        "display_order": 2
    },
    {
        "title": "Fundora Landing Page",
        "slug": "fundora-landing-page",
        "category": "marketplace",
        "short_description": "A dedicated launchpad platform and marketplace where exciting new startup products are introduced to the world.",
        "full_description": "A dedicated startup discovery directory with live community upvoting and interactive sliding drawer for cart and item management. Features bespoke fluid typography with custom glow accents and micro-states using lightweight Vanilla JavaScript event delegation.",
        "technologies": ["Custom CSS", "JavaScript"],
        "highlights": [
            "Curated startup discovery directory with live community upvoting",
            "Interactive sliding drawer for cart and item management",
            "Bespoke fluid typography with custom glow accents and micro-states"
        ],
        "thumbnail_url": "assets/images/fundora-preview.jpg",
        "github_url": "https://github.com/tarunk8060/project-d-start-Up-",
        "live_demo_url": None,
        "is_featured": True,
        "status": "published",
        "display_order": 3
    }
]

INITIAL_SKILLS = [
    # 01 Programming Languages
    {
        "name": "Python",
        "category": "Programming Languages",
        "description": "Scripting, automation, data manipulation, and backend prototyping with readable syntax.",
        "icon_url": "Py",
        "badge_label": "Backend & Scripting",
        "status": "published",
        "display_order": 1
    },
    {
        "name": "Java",
        "category": "Programming Languages",
        "description": "Object-oriented architecture, strong typing, data structures, and enterprise programming fundamentals.",
        "icon_url": "Jv",
        "badge_label": "OOP Architecture",
        "status": "published",
        "display_order": 2
    },
    {
        "name": "C++",
        "category": "Programming Languages",
        "description": "Memory management, algorithmic optimization, performance-critical problem solving.",
        "icon_url": "C++",
        "badge_label": "Systems & Algorithms",
        "status": "published",
        "display_order": 3
    },
    {
        "name": "SQL",
        "category": "Programming Languages",
        "description": "Relational database querying, schema design, join operations, and data aggregation.",
        "icon_url": "SQL",
        "badge_label": "Relational Data",
        "status": "published",
        "display_order": 4
    },

    # 02 Web Development
    {
        "name": "HTML5",
        "category": "Web Development",
        "description": "Accessible landmark structures, semantic tags, SEO optimization, and standards compliance.",
        "icon_url": "H5",
        "badge_label": "Semantic Foundations",
        "status": "published",
        "display_order": 5
    },
    {
        "name": "CSS3 & Layouts",
        "category": "Web Development",
        "description": "CSS Grid, Flexbox, custom properties, responsive breakpoints, and performant animations.",
        "icon_url": "C3",
        "badge_label": "Modern Styling",
        "status": "published",
        "display_order": 6
    },
    {
        "name": "Vanilla JavaScript",
        "category": "Web Development",
        "description": "ES6+ syntax, asynchronous DOM updates, event delegation, and zero-framework client applications.",
        "icon_url": "JS",
        "badge_label": "Client Scripting",
        "status": "published",
        "display_order": 7
    },

    # 03 Cloud & Infrastructure Concepts
    {
        "name": "AWS Cloud",
        "category": "Cloud & Infrastructure Concepts",
        "description": "Exploration of core cloud services: EC2 hosting, S3 static assets, and basic VPC architectures.",
        "icon_url": "AWS",
        "badge_label": "Cloud Infrastructure",
        "status": "published",
        "display_order": 8
    },
    {
        "name": "Linux & Shell",
        "category": "Cloud & Infrastructure Concepts",
        "description": "Command-line navigation, Bash scripting, system permissions, and environment management.",
        "icon_url": "Lx",
        "badge_label": "Operating Systems",
        "status": "published",
        "display_order": 9
    },
    {
        "name": "Git & Version Control",
        "category": "Cloud & Infrastructure Concepts",
        "description": "Branching workflows, atomic commits, collaborative pull requests, and GitHub management.",
        "icon_url": "Git",
        "badge_label": "Version Control",
        "status": "published",
        "display_order": 10
    },
    {
        "name": "Docker",
        "category": "Cloud & Infrastructure Concepts",
        "description": "Containerization fundamentals, Dockerfile creation, reproducible development environments.",
        "icon_url": "Dk",
        "badge_label": "Containers",
        "status": "published",
        "display_order": 11
    },
    {
        "name": "Networking Concepts",
        "category": "Cloud & Infrastructure Concepts",
        "description": "HTTP/HTTPS protocols, RESTful APIs, DNS routing, and client-server request lifecycles.",
        "icon_url": "Net",
        "badge_label": "Protocols & Architecture",
        "status": "published",
        "display_order": 12
    }
]

def seed_database():
    """Initializes tables and seeds initial admin and portfolio data synchronously."""
    Base.metadata.create_all(bind=engine)

    session = SessionLocal()
    try:
        # 1. Seed Admin User
        admin_email = settings.ADMIN_EMAIL.lower().strip()
        existing_admin = session.query(AdminUser).filter(AdminUser.email == admin_email).first()

        if not existing_admin:
            print(f"[Seed] Creating default admin account: {admin_email}", flush=True)
            admin = AdminUser(
                email=admin_email,
                hashed_password=hash_password(settings.ADMIN_PASSWORD),
                full_name=settings.ADMIN_NAME,
                is_active=True
            )
            session.add(admin)
        else:
            print(f"[Seed] Admin account already exists: {admin_email}", flush=True)

        # 2. Seed Initial Projects
        for proj_data in INITIAL_PROJECTS:
            existing_proj = session.query(Project).filter(Project.slug == proj_data["slug"]).first()
            if not existing_proj:
                print(f"[Seed] Seeding project: {proj_data['title']}", flush=True)
                proj = Project(**proj_data)
                session.add(proj)

        # 3. Seed Initial Skills
        for skill_data in INITIAL_SKILLS:
            existing_skill = session.query(Skill).filter(Skill.name == skill_data["name"]).first()
            if not existing_skill:
                print(f"[Seed] Seeding skill: {skill_data['name']}", flush=True)
                sk = Skill(**skill_data)
                session.add(sk)

        session.commit()
        print("[Seed] Database initialization and seeding complete!", flush=True)
    finally:
        session.close()

if __name__ == "__main__":
    seed_database()
