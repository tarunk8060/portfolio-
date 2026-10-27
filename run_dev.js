/**
 * Tarun.K Portfolio Development Orchestrator
 * Launches Backend API (port 8000), Admin Portal (port 3001), and Portfolio (port 3000)
 */

const { spawn } = require('child_process');
const path = require('path');

const ROOT_DIR = __dirname;
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');
const VENV_PYTHON = path.join(BACKEND_DIR, 'venv', 'Scripts', 'python.exe');

console.log('===============================================================');
console.log('🚀 Starting Tarun.K Full-Stack Portfolio CMS Development Suite');
console.log('===============================================================');

// 1. Start FastAPI Backend (Port 8000)
const backend = spawn(VENV_PYTHON, [
  '-m', 'uvicorn', 'app.main:app',
  '--host', '127.0.0.1',
  '--port', '8000'
], {
  cwd: BACKEND_DIR,
  env: { ...process.env, PYTHONPATH: BACKEND_DIR, PYTHONIOENCODING: 'utf-8' },
  stdio: 'inherit'
});
backend.on('error', (err) => console.error('[Backend Process Error]:', err));

// 2. Start Admin Portal (Port 3001)
const adminPortal = spawn('node', [path.join(ROOT_DIR, 'admin-portal', 'serve_admin.js')], {
  cwd: ROOT_DIR,
  stdio: 'inherit'
});
adminPortal.on('error', (err) => console.error('[Admin Portal Error]:', err));

// 3. Start Public Portfolio (Port 3000)
const portfolio = spawn('node', [path.join(ROOT_DIR, 'serve.js')], {
  cwd: ROOT_DIR,
  stdio: 'inherit'
});
portfolio.on('error', (err) => console.error('[Portfolio Error]:', err));

console.log('\n🌟 All 3 Services Are Now Live:');
console.log('  1. 🌐 Public Portfolio:  http://localhost:3000/');
console.log('  2. 🔐 Admin Portal:      http://localhost:3001/');
console.log('  3. ⚡ FastAPI Backend:   http://localhost:8000/');
console.log('  4. 📚 Swagger API Docs:  http://localhost:8000/docs\n');

process.on('SIGINT', () => {
  console.log('\nShutting down all development services...');
  backend.kill();
  adminPortal.kill();
  portfolio.kill();
  process.exit(0);
});
