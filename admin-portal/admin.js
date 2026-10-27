/**
 * Tarun.K Developer Portfolio — Admin Portal Controller
 * Full-featured SPA for managing portfolio content, media, and telemetry.
 */

// -----------------------------------------------------------------------------
// 1. CONFIGURATION & STATE
// -----------------------------------------------------------------------------
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? (window.location.port === '8000' ? '' : 'http://localhost:8000')
  : '';

const state = {
  token: localStorage.getItem('tarun_admin_token') || null,
  user: JSON.parse(localStorage.getItem('tarun_admin_user') || 'null'),
  currentView: 'dashboard',
  projects: [],
  skills: [],
  stats: null,
  activeProjectFilter: 'all',
  activeSkillCategory: 'all',
  projectSearchTerm: '',
  skillSearchTerm: '',
  tags: [],
  pendingDeleteAction: null
};

// -----------------------------------------------------------------------------
// 2. HTTP CLIENT HELPERS
// -----------------------------------------------------------------------------
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = options.headers || {};

  if (state.token) {
    headers['Authorization'] = `Bearer ${state.token}`;
  }

  // Set JSON Content-Type unless FormData is passed
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    // Token expired or invalid
    logout();
    throw new Error('Your session has expired. Please sign in again.');
  }

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.detail || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

// -----------------------------------------------------------------------------
// 3. TOAST NOTIFICATIONS
// -----------------------------------------------------------------------------
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const iconSvg = type === 'success'
    ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>'
    : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';

  toast.innerHTML = `${iconSvg}<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// -----------------------------------------------------------------------------
// 4. AUTHENTICATION CONTROLLER
// -----------------------------------------------------------------------------
async function checkAuthSession() {
  if (!state.token) {
    showLoginView();
    return;
  }

  try {
    const user = await apiRequest('/api/v1/auth/me');
    state.user = user;
    localStorage.setItem('tarun_admin_user', JSON.stringify(user));
    showAppLayout();
    loadDashboardData();
  } catch (err) {
    console.warn('Session verification failed:', err);
    logout();
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const emailInput = document.getElementById('loginEmail');
  const passwordInput = document.getElementById('loginPassword');
  const errorBanner = document.getElementById('loginError');
  const loginBtn = document.getElementById('loginBtn');

  errorBanner.style.display = 'none';
  loginBtn.disabled = true;
  loginBtn.innerHTML = '<span>Signing In...</span>';

  try {
    const result = await apiRequest('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: emailInput.value.trim(),
        password: passwordInput.value
      })
    });

    state.token = result.access_token;
    state.user = result.user;
    localStorage.setItem('tarun_admin_token', result.access_token);
    localStorage.setItem('tarun_admin_user', JSON.stringify(result.user));

    showAppLayout();
    showToast(`Welcome back, ${result.user.full_name || 'Admin'}!`);
    loadDashboardData();
  } catch (err) {
    errorBanner.textContent = err.message || 'Login failed. Please check your credentials.';
    errorBanner.style.display = 'block';
  } finally {
    loginBtn.disabled = false;
    loginBtn.innerHTML = '<span>Sign In to Dashboard</span>';
  }
}

function logout() {
  state.token = null;
  state.user = null;
  localStorage.removeItem('tarun_admin_token');
  localStorage.removeItem('tarun_admin_user');
  showLoginView();
  showToast('You have been signed out.', 'success');
}

function showLoginView() {
  document.getElementById('loginView').style.display = 'flex';
  document.getElementById('appLayout').style.display = 'none';
}

function showAppLayout() {
  document.getElementById('loginView').style.display = 'none';
  document.getElementById('appLayout').style.display = 'flex';

  if (state.user) {
    document.getElementById('userNameDisplay').textContent = state.user.full_name || 'Tarun K';
    document.getElementById('userEmailDisplay').textContent = state.user.email || 'admin@tarunk.dev';
  }
}

// -----------------------------------------------------------------------------
// 5. NAVIGATION & VIEW SWITCHING
// -----------------------------------------------------------------------------
function switchView(viewName) {
  state.currentView = viewName;

  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-view') === viewName);
  });

  const views = {
    dashboard: document.getElementById('viewDashboard'),
    projects: document.getElementById('viewProjects'),
    skills: document.getElementById('viewSkills'),
    media: document.getElementById('viewMedia')
  };

  const titles = {
    dashboard: 'Executive Dashboard',
    projects: 'Project Management',
    skills: 'Technical Skills Management',
    media: 'Persistent Media Object Storage'
  };

  Object.keys(views).forEach(k => {
    if (views[k]) {
      views[k].style.display = k === viewName ? 'block' : 'none';
    }
  });

  document.getElementById('topBarTitle').textContent = titles[viewName] || 'Dashboard';

  if (viewName === 'dashboard') loadDashboardData();
  if (viewName === 'projects') loadProjects();
  if (viewName === 'skills') loadSkills();
}

// -----------------------------------------------------------------------------
// 6. DASHBOARD METRICS & RECENT ACTIVITY
// -----------------------------------------------------------------------------
async function loadDashboardData() {
  try {
    const stats = await apiRequest('/api/v1/admin/stats');
    state.stats = stats;

    document.getElementById('statTotalProjects').textContent = stats.total_projects;
    document.getElementById('statPubProjects').textContent = stats.published_projects;
    document.getElementById('statDraftProjects').textContent = stats.draft_projects;
    document.getElementById('statTotalSkills').textContent = stats.total_skills;

    renderRecentActivity(stats.recent_activity || []);
  } catch (err) {
    console.error('Failed to load dashboard metrics:', err);
  }
}

function renderRecentActivity(items) {
  const tbody = document.getElementById('recentActivityTableBody');
  if (!items || items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:30px;">No recent activity recorded.</td></tr>';
    return;
  }

  tbody.innerHTML = items.map(item => {
    const isPub = item.status === 'published';
    const badgeClass = isPub ? 'badge-published' : 'badge-draft';
    const updatedDate = new Date(item.updated_at).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    return `
      <tr>
        <td style="font-weight:600;">${escapeHtml(item.title)}</td>
        <td><span style="font-size:0.78rem; text-transform:uppercase; color:var(--text-muted); font-family:var(--font-mono);">${item.type}</span></td>
        <td><span class="badge-status ${badgeClass}">${item.status}</span></td>
        <td style="color:var(--text-secondary); font-size:0.82rem;">${updatedDate}</td>
      </tr>
    `;
  }).join('');
}

// -----------------------------------------------------------------------------
// 7. PROJECTS MANAGEMENT
// -----------------------------------------------------------------------------
async function loadProjects() {
  const tbody = document.getElementById('projectsTableBody');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:30px;">Loading projects...</td></tr>';

  try {
    let endpoint = '/api/v1/admin/projects?';
    if (state.activeProjectFilter !== 'all') {
      endpoint += `status=${encodeURIComponent(state.activeProjectFilter)}&`;
    }
    if (state.projectSearchTerm.trim()) {
      endpoint += `search=${encodeURIComponent(state.projectSearchTerm.trim())}&`;
    }

    const projects = await apiRequest(endpoint);
    state.projects = projects;
    renderProjectsTable(projects);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--accent-rose); padding:30px;">Error: ${err.message}</td></tr>`;
  }
}

function renderProjectsTable(projects) {
  const tbody = document.getElementById('projectsTableBody');
  if (!projects || projects.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:40px;">No projects found matching current criteria.</td></tr>';
    return;
  }

  tbody.innerHTML = projects.map(p => {
    const isPub = p.status === 'published';
    const statusBadge = isPub
      ? '<span class="badge-status badge-published">Published</span>'
      : '<span class="badge-status badge-draft">Draft</span>';

    const techChips = (p.technologies || []).slice(0, 4).map(t => `<span class="tech-tag-chip">${escapeHtml(t)}</span>`).join('');
    const techMore = (p.technologies || []).length > 4 ? `<span style="font-size:0.7rem; color:var(--text-muted);">+${(p.technologies.length - 4)}</span>` : '';

    const thumbSrc = resolveMediaUrl(p.thumbnail_url);

    return `
      <tr>
        <td>
          <div class="proj-title-cell">
            <img src="${thumbSrc}" alt="Thumbnail" class="proj-thumb" onerror="this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 24 24\\' fill=\\'%2364748b\\'><rect width=\\'24\\' height=\\'24\\'/></svg>'">
            <div class="proj-info-wrap">
              <div class="proj-title">${escapeHtml(p.title)} ${p.is_featured ? '<span style="color:var(--accent-purple); font-size:0.75rem;" title="Featured">★</span>' : ''}</div>
              <div class="proj-slug">/${escapeHtml(p.slug)}</div>
            </div>
          </div>
        </td>
        <td style="color:var(--text-secondary); text-transform:capitalize;">${escapeHtml(p.category)}</td>
        <td><div>${techChips} ${techMore}</div></td>
        <td><strong style="font-family:var(--font-mono); font-size:0.85rem;">#${p.display_order}</strong></td>
        <td>
          <button type="button" class="btn-status-toggle" onclick="toggleProjectStatus('${p.id}', '${isPub ? 'draft' : 'published'}')" title="Click to toggle status" style="background:none; border:none; cursor:pointer;">
            ${statusBadge}
          </button>
        </td>
        <td style="text-align:right;">
          <div class="action-btns-cell" style="justify-content:flex-end;">
            <button class="btn-icon-action" onclick="openEditProjectModal('${p.id}')" title="Edit Project">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="btn-icon-action delete" onclick="confirmDeleteProject('${p.id}', '${escapeJs(p.title)}')" title="Delete Project">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function toggleProjectStatus(projectId, newStatus) {
  try {
    await apiRequest(`/api/v1/admin/projects/${projectId}/status?status=${newStatus}`, {
      method: 'PATCH'
    });
    showToast(`Project status updated to ${newStatus}.`);
    loadProjects();
    loadDashboardData();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// -----------------------------------------------------------------------------
// 8. PROJECT MODAL (CREATE / EDIT)
// -----------------------------------------------------------------------------
function openNewProjectModal() {
  document.getElementById('projectForm').reset();
  document.getElementById('projFormId').value = '';
  document.getElementById('projectModalTitle').textContent = 'Create New Project';
  document.getElementById('projThumbnailPreview').style.display = 'none';
  document.getElementById('projDisplayOrder').value = (state.projects.length + 1);

  const pubRadio = document.querySelector('input[name="projStatus"][value="published"]');
  if (pubRadio) pubRadio.checked = true;

  state.tags = [];
  renderTechTags();

  openModal('projectModal');
}

function openEditProjectModal(projectId) {
  const p = state.projects.find(item => item.id === projectId);
  if (!p) return;

  document.getElementById('projFormId').value = p.id;
  document.getElementById('projectModalTitle').textContent = `Edit Project: ${p.title}`;
  document.getElementById('projTitle').value = p.title;
  document.getElementById('projSlug').value = p.slug;
  document.getElementById('projCategory').value = p.category;
  document.getElementById('projDisplayOrder').value = p.display_order;
  document.getElementById('projShortDesc').value = p.short_description;
  document.getElementById('projFullDesc').value = p.full_description;
  document.getElementById('projHighlights').value = (p.highlights || []).join('\n');
  document.getElementById('projThumbnailUrl').value = p.thumbnail_url;
  document.getElementById('projGithubUrl').value = p.github_url || '';
  document.getElementById('projLiveDemoUrl').value = p.live_demo_url || '';
  document.getElementById('projIsFeatured').checked = !!p.is_featured;

  const statusRadio = document.querySelector(`input[name="projStatus"][value="${p.status}"]`);
  if (statusRadio) statusRadio.checked = true;

  // Thumbnail preview
  const preview = document.getElementById('projThumbnailPreview');
  if (p.thumbnail_url) {
    preview.src = resolveMediaUrl(p.thumbnail_url);
    preview.style.display = 'block';
  } else {
    preview.style.display = 'none';
  }

  // Tags
  state.tags = [...(p.technologies || [])];
  renderTechTags();

  openModal('projectModal');
}

async function handleProjectFormSubmit(e) {
  e.preventDefault();
  const saveBtn = document.getElementById('saveProjectBtn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  const projId = document.getElementById('projFormId').value;
  const isEditing = !!projId;

  const highlightsRaw = document.getElementById('projHighlights').value;
  const highlights = highlightsRaw.split('\n').map(h => h.trim()).filter(Boolean);

  const statusValue = document.querySelector('input[name="projStatus"]:checked')?.value || 'draft';

  const payload = {
    title: document.getElementById('projTitle').value.trim(),
    slug: document.getElementById('projSlug').value.trim() || undefined,
    category: document.getElementById('projCategory').value,
    display_order: parseInt(document.getElementById('projDisplayOrder').value) || 0,
    short_description: document.getElementById('projShortDesc').value.trim(),
    full_description: document.getElementById('projFullDesc').value.trim(),
    technologies: state.tags,
    highlights: highlights,
    thumbnail_url: document.getElementById('projThumbnailUrl').value.trim(),
    github_url: document.getElementById('projGithubUrl').value.trim() || null,
    live_demo_url: document.getElementById('projLiveDemoUrl').value.trim() || null,
    is_featured: document.getElementById('projIsFeatured').checked,
    status: statusValue
  };

  try {
    if (isEditing) {
      await apiRequest(`/api/v1/admin/projects/${projId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      showToast('Project updated successfully!');
    } else {
      await apiRequest('/api/v1/admin/projects', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      showToast('New project created successfully!');
    }

    closeModal('projectModal');
    loadProjects();
    loadDashboardData();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Project';
  }
}

function confirmDeleteProject(projectId, projectTitle) {
  state.pendingDeleteAction = async () => {
    try {
      await apiRequest(`/api/v1/admin/projects/${projectId}`, { method: 'DELETE' });
      showToast(`Project '${projectTitle}' deleted.`);
      loadProjects();
      loadDashboardData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  document.getElementById('deleteConfirmMessage').textContent =
    `Are you sure you want to permanently delete '${projectTitle}'? This will remove it from PostgreSQL.`;
  openModal('deleteConfirmModal');
}

// -----------------------------------------------------------------------------
// 9. TAG INPUT COMPONENT
// -----------------------------------------------------------------------------
function renderTechTags() {
  const container = document.getElementById('techTagsContainer');
  const input = document.getElementById('techTagRawInput');

  container.querySelectorAll('.tag-pill').forEach(pill => pill.remove());

  state.tags.forEach((tag, index) => {
    const pill = document.createElement('span');
    pill.className = 'tag-pill';
    pill.innerHTML = `
      <span>${escapeHtml(tag)}</span>
      <span class="tag-pill-remove" onclick="removeTechTag(${index})">&times;</span>
    `;
    container.insertBefore(pill, input);
  });
}

function addTechTag(tag) {
  const clean = tag.trim().replace(/^,+|,+$/g, '');
  if (clean && !state.tags.includes(clean)) {
    state.tags.push(clean);
    renderTechTags();
  }
}

function removeTechTag(index) {
  state.tags.splice(index, 1);
  renderTechTags();
}

// -----------------------------------------------------------------------------
// 10. SKILLS MANAGEMENT
// -----------------------------------------------------------------------------
async function loadSkills() {
  const container = document.getElementById('skillsContainer');
  container.innerHTML = '<div style="text-align:center; color:var(--text-muted); padding:40px;">Loading skills...</div>';

  try {
    let endpoint = '/api/v1/admin/skills?';
    if (state.activeSkillCategory !== 'all') {
      endpoint += `category=${encodeURIComponent(state.activeSkillCategory)}&`;
    }
    if (state.skillSearchTerm.trim()) {
      endpoint += `search=${encodeURIComponent(state.skillSearchTerm.trim())}&`;
    }

    const skills = await apiRequest(endpoint);
    state.skills = skills;
    renderSkillsGrid(skills);
  } catch (err) {
    container.innerHTML = `<div style="text-align:center; color:var(--accent-rose); padding:40px;">Error: ${err.message}</div>`;
  }
}

function renderSkillsGrid(skills) {
  const container = document.getElementById('skillsContainer');
  if (!skills || skills.length === 0) {
    container.innerHTML = '<div style="text-align:center; color:var(--text-muted); padding:40px;">No skills found.</div>';
    return;
  }

  // Group by category
  const groups = {};
  skills.forEach(s => {
    if (!groups[s.category]) groups[s.category] = [];
    groups[s.category].push(s);
  });

  container.innerHTML = Object.keys(groups).map(categoryName => {
    const groupSkills = groups[categoryName];

    const cardsHtml = groupSkills.map(s => {
      const isPub = s.status === 'published';
      const badgeClass = isPub ? 'badge-published' : 'badge-draft';

      return `
        <div class="skill-card">
          <div class="skill-card-top">
            <div class="skill-icon-box">${escapeHtml(s.icon_url || s.name.substring(0, 3))}</div>
            <span class="badge-status ${badgeClass}" style="font-size:0.7rem;">${s.status}</span>
          </div>
          <div>
            <div class="skill-name">${escapeHtml(s.name)}</div>
            ${s.badge_label ? `<span style="font-size:0.72rem; color:var(--accent-purple); font-weight:600;">${escapeHtml(s.badge_label)}</span>` : ''}
          </div>
          <p class="skill-desc">${escapeHtml(s.description)}</p>
          <div class="skill-card-bottom">
            <span style="font-size:0.72rem; color:var(--text-muted); font-family:var(--font-mono);">Order #${s.display_order}</span>
            <div style="display:flex; gap:6px;">
              <button class="btn-icon-action" onclick="openEditSkillModal('${s.id}')" title="Edit">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              </button>
              <button class="btn-icon-action delete" onclick="confirmDeleteSkill('${s.id}', '${escapeJs(s.name)}')" title="Delete">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="skills-category-group">
        <div class="category-header">
          <div class="category-name">${escapeHtml(categoryName)}</div>
          <span style="font-size:0.8rem; color:var(--text-muted);">${groupSkills.length} skills</span>
        </div>
        <div class="skills-grid">
          ${cardsHtml}
        </div>
      </div>
    `;
  }).join('');
}

function openNewSkillModal() {
  document.getElementById('skillForm').reset();
  document.getElementById('skillFormId').value = '';
  document.getElementById('skillModalTitle').textContent = 'Create Technical Skill';
  document.getElementById('skillDisplayOrder').value = (state.skills.length + 1);

  const pubRadio = document.querySelector('input[name="skillStatus"][value="published"]');
  if (pubRadio) pubRadio.checked = true;

  openModal('skillModal');
}

function openEditSkillModal(skillId) {
  const s = state.skills.find(item => item.id === skillId);
  if (!s) return;

  document.getElementById('skillFormId').value = s.id;
  document.getElementById('skillModalTitle').textContent = `Edit Skill: ${s.name}`;
  document.getElementById('skillName').value = s.name;
  document.getElementById('skillCategory').value = s.category;
  document.getElementById('skillDescription').value = s.description;
  document.getElementById('skillBadgeLabel').value = s.badge_label || '';
  document.getElementById('skillIcon').value = s.icon_url || '';
  document.getElementById('skillDisplayOrder').value = s.display_order;

  const statusRadio = document.querySelector(`input[name="skillStatus"][value="${s.status}"]`);
  if (statusRadio) statusRadio.checked = true;

  openModal('skillModal');
}

async function handleSkillFormSubmit(e) {
  e.preventDefault();
  const saveBtn = document.getElementById('saveSkillBtn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  const skillId = document.getElementById('skillFormId').value;
  const isEditing = !!skillId;

  const statusValue = document.querySelector('input[name="skillStatus"]:checked')?.value || 'published';

  const payload = {
    name: document.getElementById('skillName').value.trim(),
    category: document.getElementById('skillCategory').value,
    description: document.getElementById('skillDescription').value.trim(),
    badge_label: document.getElementById('skillBadgeLabel').value.trim() || null,
    icon_url: document.getElementById('skillIcon').value.trim() || null,
    display_order: parseInt(document.getElementById('skillDisplayOrder').value) || 0,
    status: statusValue
  };

  try {
    if (isEditing) {
      await apiRequest(`/api/v1/admin/skills/${skillId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      showToast('Skill updated successfully!');
    } else {
      await apiRequest('/api/v1/admin/skills', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      showToast('New skill created successfully!');
    }

    closeModal('skillModal');
    loadSkills();
    loadDashboardData();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Skill';
  }
}

function confirmDeleteSkill(skillId, skillName) {
  state.pendingDeleteAction = async () => {
    try {
      await apiRequest(`/api/v1/admin/skills/${skillId}`, { method: 'DELETE' });
      showToast(`Skill '${skillName}' deleted.`);
      loadSkills();
      loadDashboardData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  document.getElementById('deleteConfirmMessage').textContent =
    `Are you sure you want to delete '${skillName}'?`;
  openModal('deleteConfirmModal');
}

// -----------------------------------------------------------------------------
// 11. MEDIA OBJECT STORAGE UPLOADS
// -----------------------------------------------------------------------------
async function handleMediaUpload(file, onSuccess) {
  // Client validation
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    showToast('Invalid file format. Please upload PNG, JPEG, WebP, or SVG.', 'error');
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showToast('File size exceeds 5MB limit.', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    showToast('Uploading to persistent storage...', 'success');
    const result = await apiRequest('/api/v1/admin/upload', {
      method: 'POST',
      body: formData
    });

    showToast('Image uploaded successfully!');
    if (onSuccess) onSuccess(result);
  } catch (err) {
    showToast(`Upload failed: ${err.message}`, 'error');
  }
}

// -----------------------------------------------------------------------------
// 12. MODAL CONTROLS & UTILITIES
// -----------------------------------------------------------------------------
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('open');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('open');
}

function resolveMediaUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/uploads/')) return `${API_BASE}${url}`;
  return url;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeJs(str) {
  if (!str) return '';
  return String(str).replace(/'/g, "\\'");
}

// -----------------------------------------------------------------------------
// 13. DOM EVENT LISTENERS INITIALIZATION
// -----------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // Login Form
  document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
  document.getElementById('logoutBtn')?.addEventListener('click', logout);

  // Auto-fill test credentials button
  document.getElementById('fillDemoCredsBtn')?.addEventListener('click', () => {
    document.getElementById('loginEmail').value = 'admin@tarunk.dev';
    document.getElementById('loginPassword').value = 'Admin@TarunK2026!';
    showToast('Test credentials filled. Click Sign In.');
  });

  // Navigation items
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.getAttribute('data-view');
      if (view) switchView(view);
    });
  });

  // Quick Action Buttons
  document.getElementById('quickAddProjectBtn')?.addEventListener('click', () => {
    switchView('projects');
    openNewProjectModal();
  });
  document.getElementById('quickAddSkillBtn')?.addEventListener('click', () => {
    switchView('skills');
    openNewSkillModal();
  });
  document.getElementById('openNewProjectModalBtn')?.addEventListener('click', openNewProjectModal);
  document.getElementById('openNewSkillModalBtn')?.addEventListener('click', openNewSkillModal);

  // Project form submit
  document.getElementById('projectForm')?.addEventListener('submit', handleProjectFormSubmit);

  // Skill form submit
  document.getElementById('skillForm')?.addEventListener('submit', handleSkillFormSubmit);

  // Delete modal confirm button
  document.getElementById('confirmDeleteBtn')?.addEventListener('click', async () => {
    if (state.pendingDeleteAction) {
      await state.pendingDeleteAction();
      state.pendingDeleteAction = null;
    }
    closeModal('deleteConfirmModal');
  });

  // Modal close buttons (via data-close-modal)
  document.querySelectorAll('[data-close-modal]').forEach(el => {
    el.addEventListener('click', () => {
      const modalId = el.getAttribute('data-close-modal');
      closeModal(modalId);
    });
  });

  // Filter Pills: Projects Status
  document.querySelectorAll('#projectStatusFilters .pill-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#projectStatusFilters .pill-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeProjectFilter = btn.getAttribute('data-status');
      loadProjects();
    });
  });

  // Filter Pills: Skills Category
  document.querySelectorAll('#skillCategoryFilters .pill-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#skillCategoryFilters .pill-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeSkillCategory = btn.getAttribute('data-cat');
      loadSkills();
    });
  });

  // Search Inputs with Debounce
  let projectSearchTimer;
  document.getElementById('projectSearchInput')?.addEventListener('input', (e) => {
    clearTimeout(projectSearchTimer);
    projectSearchTimer = setTimeout(() => {
      state.projectSearchTerm = e.target.value;
      loadProjects();
    }, 250);
  });

  let skillSearchTimer;
  document.getElementById('skillSearchInput')?.addEventListener('input', (e) => {
    clearTimeout(skillSearchTimer);
    skillSearchTimer = setTimeout(() => {
      state.skillSearchTerm = e.target.value;
      loadSkills();
    }, 250);
  });

  // Tag Input Keydown
  const tagInput = document.getElementById('techTagRawInput');
  if (tagInput) {
    tagInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        addTechTag(tagInput.value);
        tagInput.value = '';
      } else if (e.key === 'Backspace' && !tagInput.value && state.tags.length > 0) {
        removeTechTag(state.tags.length - 1);
      }
    });
  }

  // Project Modal Image Upload Trigger
  const projImgTrigger = document.getElementById('uploadProjImgTrigger');
  const projImgFile = document.getElementById('projImgFileInput');
  if (projImgTrigger && projImgFile) {
    projImgTrigger.addEventListener('click', () => projImgFile.click());
    projImgFile.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleMediaUpload(e.target.files[0], (res) => {
          document.getElementById('projThumbnailUrl').value = res.url;
          const preview = document.getElementById('projThumbnailPreview');
          preview.src = resolveMediaUrl(res.url);
          preview.style.display = 'block';
        });
      }
    });
  }

  // Media Tab Dropzone
  const mediaDropzone = document.getElementById('mediaDropzone');
  const mediaFileInput = document.getElementById('mediaFileInput');
  if (mediaDropzone && mediaFileInput) {
    mediaDropzone.addEventListener('click', () => mediaFileInput.click());
    mediaDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      mediaDropzone.style.borderColor = 'var(--accent-purple)';
    });
    mediaDropzone.addEventListener('dragleave', () => {
      mediaDropzone.style.borderColor = 'var(--border-subtle)';
    });
    mediaDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      mediaDropzone.style.borderColor = 'var(--border-subtle)';
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        uploadToMediaTab(e.dataTransfer.files[0]);
      }
    });
    mediaFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        uploadToMediaTab(e.target.files[0]);
      }
    });
  }

  function uploadToMediaTab(file) {
    handleMediaUpload(file, (res) => {
      const resultBox = document.getElementById('mediaUploadResult');
      resultBox.style.display = 'block';
      document.getElementById('mediaUploadedImg').src = resolveMediaUrl(res.url);
      document.getElementById('mediaFileName').textContent = res.filename;
      document.getElementById('mediaFileSize').textContent = `${(res.size_bytes / 1024).toFixed(1)} KB`;
      document.getElementById('mediaUrlInput').value = res.url;
    });
  }

  document.getElementById('copyMediaUrlBtn')?.addEventListener('click', () => {
    const input = document.getElementById('mediaUrlInput');
    input.select();
    navigator.clipboard.writeText(input.value);
    showToast('URL copied to clipboard!');
  });

  // Check auth session on startup
  checkAuthSession();
});
