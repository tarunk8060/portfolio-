import io
import asyncio
import httpx
from app.main import app
from app.config import settings

async def run_api_tests():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        print("--- 1. Testing Health Endpoint ---", flush=True)
        resp = await client.get("/api/v1/health")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        print("✓ Health check OK:", resp.json(), flush=True)

        print("\n--- 2. Testing Public Read-Only Projects ---", flush=True)
        resp = await client.get("/api/v1/projects")
        assert resp.status_code == 200
        projects = resp.json()
        assert len(projects) >= 3
        print(f"✓ Public projects retrieved: {len(projects)} published projects.", flush=True)
        assert all(p["status"] == "published" for p in projects), "Draft projects found in public endpoint!"

        print("\n--- 3. Testing Public Read-Only Skills ---", flush=True)
        resp = await client.get("/api/v1/skills")
        assert resp.status_code == 200
        skills = resp.json()
        assert len(skills) >= 12
        print(f"✓ Public skills retrieved: {len(skills)} skills across categories.", flush=True)

        print("\n--- 4. Testing Admin Authentication ---", flush=True)
        bad_login = await client.post("/api/v1/auth/login", json={"email": "bad@tarunk.dev", "password": "wrong"})
        assert bad_login.status_code == 401
        print("✓ Invalid login rejected with 401 Unauthorized.", flush=True)

        login_resp = await client.post("/api/v1/auth/login", json={
            "email": settings.ADMIN_EMAIL,
            "password": settings.ADMIN_PASSWORD
        })
        assert login_resp.status_code == 200
        token_data = login_resp.json()
        token = token_data["access_token"]
        print("✓ Valid login successful! Received JWT access token.", flush=True)
        headers = {"Authorization": f"Bearer {token}"}

        me_resp = await client.get("/api/v1/auth/me", headers=headers)
        assert me_resp.status_code == 200
        print("✓ /auth/me profile verified:", me_resp.json()["email"], flush=True)

        print("\n--- 5. Testing Admin Dashboard Metrics ---", flush=True)
        stats_resp = await client.get("/api/v1/admin/stats", headers=headers)
        assert stats_resp.status_code == 200
        stats = stats_resp.json()
        print(f"✓ Dashboard Stats: Projects: {stats['total_projects']} (Pub: {stats['published_projects']}, Draft: {stats['draft_projects']}) | Skills: {stats['total_skills']}", flush=True)
        assert stats["total_projects"] >= 3
        assert stats["total_skills"] >= 12

        print("\n--- 6. Testing Project Creation (Draft Status) ---", flush=True)
        new_proj_payload = {
            "title": "Quantum Cloud Telemetry Engine",
            "slug": "quantum-cloud-telemetry",
            "category": "fullstack",
            "short_description": "High throughput cloud telemetry monitor.",
            "full_description": "Architected with FastAPI, WebSockets, and Redis.",
            "technologies": ["Python", "FastAPI", "WebSockets", "Docker"],
            "highlights": ["Sub-millisecond packet processing", "Real-time SSE metrics"],
            "thumbnail_url": "/uploads/test-preview.png",
            "github_url": "https://github.com/tarunk8060/telemetry",
            "live_demo_url": "https://telemetry.tarunk.dev",
            "is_featured": False,
            "status": "draft",
            "display_order": 99
        }
        create_resp = await client.post("/api/v1/admin/projects", json=new_proj_payload, headers=headers)
        assert create_resp.status_code == 201, create_resp.text
        created_proj = create_resp.json()
        proj_id = created_proj["id"]
        print(f"✓ Created draft project '{created_proj['title']}' with ID: {proj_id}", flush=True)

        pub_check = await client.get("/api/v1/projects")
        pub_ids = [p["id"] for p in pub_check.json()]
        assert proj_id not in pub_ids, "ERROR: Draft project is visible in public endpoint!"
        print("✓ Verified: Draft project is hidden from public API.", flush=True)

        print("\n--- 7. Testing Project Status Publishing ---", flush=True)
        publish_resp = await client.patch(f"/api/v1/admin/projects/{proj_id}/status?status=published", headers=headers)
        assert publish_resp.status_code == 200
        assert publish_resp.json()["status"] == "published"
        print("✓ Project status updated to 'published'.", flush=True)

        pub_check2 = await client.get("/api/v1/projects")
        pub_ids2 = [p["id"] for p in pub_check2.json()]
        assert proj_id in pub_ids2, "ERROR: Published project not visible in public endpoint!"
        print("✓ Verified: Published project is now dynamically visible in public API.", flush=True)

        print("\n--- 8. Testing Project Deletion ---", flush=True)
        del_resp = await client.delete(f"/api/v1/admin/projects/{proj_id}", headers=headers)
        assert del_resp.status_code == 204
        print("✓ Project deleted successfully.", flush=True)

        print("\n--- 9. Testing Media Upload Endpoint ---", flush=True)
        fake_png = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
        files = {"file": ("test_upload.png", fake_png, "image/png")}
        upload_resp = await client.post("/api/v1/admin/upload", files=files, headers=headers)
        assert upload_resp.status_code == 201, upload_resp.text
        upload_data = upload_resp.json()
        print("✓ Image upload OK! Persistent URL:", upload_data["url"], flush=True)

        print("\n=======================================================", flush=True)
        print("🎉 ALL 9 API TEST SUITES PASSED FLAWLESSLY!", flush=True)
        print("=======================================================", flush=True)

if __name__ == "__main__":
    asyncio.run(run_api_tests())
