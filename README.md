# Tarun.K — Cinematic Portfolio & Content Management System (CMS)

A production-ready full-stack developer portfolio architecture featuring:
1. **Public Portfolio Website:** Cinematic, ultra-fast vanilla HTML5/CSS3/JS website.
2. **CMS Admin Portal:** A modern, executive dark-themed single-page application dashboard for dynamic project, skill, and media management.
3. **Backend & Database:** High-performance Python FastAPI service connected to PostgreSQL (Supabase / local fallback) with Alembic migrations, JWT authentication, and persistent object storage.

---

## 🏗️ System Architecture

```mermaid
flowchart LR
    subgraph Public["1. Public Portfolio (Port 3000)"]
        Site["Tarun.K Portfolio<br/>(index.html, project.html, expertise.html)"]
    end

    subgraph Admin["2. Admin Portal (Port 3001)"]
        Dashboard["Executive Admin SPA<br/>(Dashboard, Projects, Skills, Media)"]
    end

    subgraph Backend["3. FastAPI Backend (Port 8000)"]
        API["FastAPI REST API (/api/v1)"]
        Auth["JWT & Bcrypt Auth"]
        Uploads["Persistent Storage Service<br/>(Supabase / Local)"]
    end

    subgraph Database["4. PostgreSQL / Supabase"]
        Tables[("projects, skills, admin_users")]
    end

    Site -- "GET /api/v1/projects<br/>GET /api/v1/skills<br/>(Published Only)" --> API
    Dashboard -- "Bearer JWT<br/>Admin CRUD & Uploads" --> API
    API --> Auth
    API --> Uploads
    API -- "SQLAlchemy / Alembic" --> Tables
```

---

## 📁 Repository Structure

```
portfolio-/
├── index.html                 # Page 1: Home (Monochrome Minimalist)
├── project.html               # Page 2: Projects (Electric Purple)
├── expertise.html             # Page 3: My Expertise (Dark Obsidian & Orange)
├── contact.html               # Page 4: Contact (Deep Midnight Abyss Blue)
├── css/                       # Stylesheets for public portfolio
├── js/
│   ├── transitions.js         # SPA top-to-bottom transitions & link interceptor
│   ├── projects.js            # Dynamic projects fetching + modal architecture
│   ├── expertise.js           # Dynamic skills & technical domains fetching
│   └── contact.js             # Formspree contact handler
├── assets/                    # Static preview images & resume
├── serve.js                   # Public portfolio server (Port 3000)
│
├── admin-portal/              # Component 2: Dedicated Admin Website
│   ├── index.html             # Admin Dashboard SPA UI
│   ├── admin.css              # Executive dark theme stylesheet
│   ├── admin.js               # Reactive CRUD controller & JWT manager
│   └── serve_admin.js         # Admin portal static server (Port 3001)
│
├── backend/                   # Component 3: FastAPI Backend
│   ├── app/
│   │   ├── main.py            # FastAPI entry point & CORS configuration
│   │   ├── config.py          # Environment settings loader
│   │   ├── database.py        # SQLAlchemy engine & session manager
│   │   ├── models.py          # Project, Skill & AdminUser models
│   │   ├── schemas.py         # Pydantic v2 validation schemas
│   │   ├── auth.py            # JWT token & Bcrypt hashing security
│   │   ├── storage.py         # Supabase & persistent local image storage
│   │   ├── seed.py            # Database initializer & initial data seed
│   │   └── routers/
│   │       ├── public.py      # Read-only published endpoints
│   │       ├── admin_auth.py  # Admin login & profile endpoints
│   │       ├── admin_projects.py # Project CRUD & publishing
│   │       ├── admin_skills.py   # Skill CRUD & categories
│   │       ├── admin_stats.py    # Dashboard telemetry metrics
│   │       └── admin_upload.py   # Persistent media file uploads
│   ├── alembic/               # Alembic database migrations
│   ├── schema.sql             # Raw PostgreSQL DDL with RLS policies
│   ├── test_routes_direct.py  # Backend verification test suite
│   ├── requirements.txt       # Python dependencies
│   ├── .env.example           # Template for environment variables
│   └── .env                   # Active environment configuration
│
├── package.json               # Root scripts & dev orchestrator
└── run_dev.js                 # Single command dev runner (all 3 services)
```

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Python 3.10+** (Python 3.13 tested)
- **Node.js 18+**

### 2. Backend Setup
From the repository root, initialize the Python virtual environment and dependencies:

```powershell
# Navigate to backend
cd backend

# Create virtual environment (if not already created)
python -m venv venv

# Activate virtual environment
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run initial database seed (creates admin user and initial data)
$env:PYTHONPATH="."
python -m app.seed
```

### 3. Run Development Servers

You can launch all 3 connected components with a single command from the project root:

```bash
node run_dev.js
```

Or run each service individually in separate terminals:

| Service | Command | URL |
| :--- | :--- | :--- |
| **🌐 Public Portfolio** | `node serve.js` | [http://localhost:3000](http://localhost:3000) |
| **🔐 Admin Portal** | `node admin-portal/serve_admin.js` | [http://localhost:3001](http://localhost:3001) |
| **⚡ FastAPI Backend** | `cd backend && uvicorn app.main:app --port 8000 --reload` | [http://localhost:8000](http://localhost:8000) |
| **📚 Interactive Swagger Docs**| *(Included with FastAPI)* | [http://localhost:8000/docs](http://localhost:8000/docs) |

---

## 🔑 Default Admin Credentials

When the backend runs for the first time, it seeds a pre-configured administrator account:

- **Email:** `admin@tarunk.dev`
- **Password:** `Admin@TarunK2026!`

*(You can also click the **"Auto-Fill Admin Credentials"** button on the Admin Portal login page).*

---

## 🗄️ PostgreSQL & Supabase Integration Guide

The backend supports both **Supabase PostgreSQL** and zero-config local development out of the box.

### Step 1: Create a Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and create a free project.
2. Note your project database password and project reference URL.

### Step 2: Initialize Database Schema in Supabase
1. In your Supabase dashboard, open the **SQL Editor**.
2. Open [`backend/schema.sql`](file:///C:/Users/LENOVO/.gemini/antigravity/scratch/portfolio-/backend/schema.sql).
3. Paste the contents into the Supabase SQL Editor and click **Run**.
   - This creates `admin_users`, `projects`, and `skills` tables with UUID keys, indexes, and Row-Level Security (RLS) policies.

### Step 3: Configure Storage Bucket
1. In Supabase, go to **Storage** → **New bucket**.
2. Name the bucket: `portfolio-media`.
3. Check **"Public bucket"** so uploaded thumbnails and images have public read access.

### Step 4: Configure `backend/.env`
Update your `backend/.env` file with your Supabase credentials:

```ini
# Supabase PostgreSQL Connection String (Session / Transaction pooler)
DATABASE_URL=postgresql://postgres.YOUR_PROJECT_REF:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# Supabase Storage Configuration
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_KEY=YOUR_SUPABASE_SERVICE_ROLE_OR_ANON_KEY
SUPABASE_BUCKET=portfolio-media
```

Run database migrations and seed:

```powershell
$env:PYTHONPATH="."
python -m app.seed
```

---

## 🛡️ Security Architecture

- **Protected Admin Endpoints:** All mutation operations (`POST`, `PUT`, `DELETE`, `PATCH`, `/admin/upload`) require a valid `Authorization: Bearer <JWT>` token.
- **Password Protection:** Cryptographic one-way hashing with salt rounds via `bcrypt`.
- **Public Isolation:** Public read endpoints (`/api/v1/projects` and `/api/v1/skills`) strictly query `WHERE status = 'published'`. Draft items are never transmitted to visitors.
- **Fail-Safe Fallback:** If the backend is restarting or offline, the public portfolio seamlessly displays cached static content without throwing errors or showing blank cards.
- **Input & File Validation:** Enforced Pydantic schemas, MIME type whitelisting (`image/jpeg`, `image/png`, `image/webp`, `image/svg+xml`), and 5MB size limits.

---

## 🚢 Production Deployment Instructions

### 1. Backend Deployment (Render / Railway / Fly.io / VPS)
1. Set the root directory to `backend/`.
2. Set build command: `pip install -r requirements.txt`.
3. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
4. Add environment variables:
   - `DATABASE_URL`: Your Supabase connection string.
   - `JWT_SECRET`: A secure 64-character hex string (`openssl rand -hex 32`).
   - `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_BUCKET`.
   - `CORS_ORIGINS`: Your live portfolio and admin portal domains.

### 2. Admin Portal Deployment (Vercel / Netlify / Cloudflare Pages)
1. Deploy `admin-portal/` as a static site.
2. In `admin-portal/admin.js`, set `API_BASE` to your live backend URL (e.g., `https://api.tarunk.dev`).

### 3. Public Portfolio Deployment (Vercel / GitHub Pages / Netlify)
1. Deploy the root static files (`index.html`, `project.html`, etc.).
2. In `js/projects.js` and `js/expertise.js`, ensure `API_URL` points to your live backend API URL.

---

© 2026 Tarun.K. Engineering with purposeful architecture and zero bloat.
