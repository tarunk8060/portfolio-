/**
 * Tarun.K Portfolio - Projects Page Interactivity & Dynamic CMS Integration
 * Dynamic PostgreSQL/FastAPI integration with graceful static fallback
 */

function initProjectBehaviors() {
  const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? (window.location.port === '8000' ? '' : 'http://localhost:8000')
    : '';

  // Baseline static projects dictionary for instant load
  let projectsData = {
    'apex-cinemas': {
      title: 'APEX Cinemas — Movie Ticket Booking System',
      category: 'Full-Stack Platform',
      status: 'Live Demo',
      tech: ['HTML5', 'CSS3', 'JavaScript', 'Python', 'FastAPI', 'PostgreSQL', 'REST API'],
      description: 'A full-stack movie ticket booking platform that enables users to explore movies, book seats through an interactive seating interface, manage their bookings, and cancel individual seats within an existing booking.',
      image: 'assets/images/apex-cinemas-preview.png',
      repoUrl: 'https://github.com/tarunk8060/APEX-cinemas',
      demoUrl: 'https://apex-cinemas.vercel.app/',
      highlights: [
        'No Third-Party App Dependency: A self-developed booking platform with its own frontend, backend API, and database integration.',
        'Interactive User Portal & Selective Seat Cancellation: Allows users to cancel specific seats without cancelling the entire booking.'
      ]
    },
    'quantiva-dashboard': {
      title: 'Quantiva Dashboard UI',
      category: 'Analytics & Dashboards',
      status: 'Live Prototype',
      tech: ['HTML5', 'CSS3', 'Vanilla JavaScript'],
      description: 'A powerful analytics dashboard designed for startup CEOs to easily track post-launch metrics, product performance, and company statistics.',
      image: 'assets/images/quantiva-preview.jpg',
      repoUrl: 'https://github.com/tarunk8060/Project-CRM-protype-',
      demoUrl: null,
      highlights: [
        'Post-launch founder telemetry with real-time MRR and customer acquisition graphs',
        'Custom SVG data visualization without heavy charting dependencies',
        'Intuitive dark-mode interface optimized for executive decision-making',
        'Responsive modular CSS Grid layout with zero framework overhead'
      ]
    },
    'fundora-landing-page': {
      title: 'Fundora Landing Page',
      category: 'Marketplace & Launchpad',
      status: 'Live Prototype',
      tech: ['Custom CSS', 'JavaScript'],
      description: 'A dedicated launchpad platform and marketplace where exciting new startup products are introduced to the world.',
      image: 'assets/images/fundora-preview.jpg',
      repoUrl: 'https://github.com/tarunk8060/project-d-start-Up-',
      demoUrl: null,
      highlights: [
        'Curated startup discovery directory with live community upvoting',
        'Interactive sliding drawer for cart and item management',
        'Bespoke fluid typography with custom glow accents and micro-states',
        'Lightweight Vanilla JavaScript event delegation'
      ]
    }
  };

  // Aliases for legacy static IDs
  projectsData['apex'] = projectsData['apex-cinemas'];
  projectsData['quantiva'] = projectsData['quantiva-dashboard'];
  projectsData['fundora'] = projectsData['fundora-landing-page'];

  // Wire up modal dialog references
  const modalOverlay = document.getElementById('projectModal');
  const modalClose = document.getElementById('modalCloseBtn');
  const modalImg = document.getElementById('modalImg');
  const modalTitle = document.getElementById('modalTitle');
  const modalDesc = document.getElementById('modalDesc');
  const modalCategory = document.getElementById('modalCategory');
  const modalStatus = document.getElementById('modalStatus');
  const modalTech = document.getElementById('modalTechStack');
  const modalHighlights = document.getElementById('modalHighlights');
  const modalRepoBtn = document.getElementById('modalRepoBtn');
  const modalDemoBtn = document.getElementById('modalDemoBtn');

  let previousActive = null;

  function openModal(key) {
    const data = projectsData[key];
    if (!data || !modalOverlay) return;

    previousActive = document.activeElement;

    if (modalTitle) modalTitle.textContent = data.title;
    if (modalDesc) modalDesc.textContent = data.description;
    if (modalImg) {
      modalImg.src = resolveImageUrl(data.image);
      modalImg.alt = `${data.title} preview screenshot`;
    }
    if (modalCategory) modalCategory.textContent = data.category;
    if (modalStatus) modalStatus.textContent = data.status || 'Live Demo';

    if (modalRepoBtn) {
      if (data.repoUrl) {
        modalRepoBtn.href = data.repoUrl;
        modalRepoBtn.style.display = 'inline-flex';
      } else {
        modalRepoBtn.style.display = 'none';
      }
    }

    if (modalDemoBtn) {
      if (data.demoUrl) {
        modalDemoBtn.href = data.demoUrl;
        modalDemoBtn.style.display = 'inline-flex';
      } else {
        modalDemoBtn.style.display = 'none';
      }
    }

    if (modalTech) {
      modalTech.innerHTML = '';
      (data.tech || []).forEach(t => {
        const span = document.createElement('span');
        span.className = 'tech-tag';
        span.textContent = t;
        modalTech.appendChild(span);
      });
    }

    if (modalHighlights) {
      modalHighlights.innerHTML = '';
      (data.highlights || []).forEach(h => {
        const li = document.createElement('li');
        li.className = 'card-spec-item';
        li.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>${h}</span>
        `;
        modalHighlights.appendChild(li);
      });
    }

    modalOverlay.classList.add('active');
    modalOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
      if (modalClose) modalClose.focus();
    }, 50);
  }

  function closeModal() {
    if (!modalOverlay || !modalOverlay.classList.contains('active')) return;
    modalOverlay.classList.remove('active');
    modalOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (previousActive) previousActive.focus();
  }

  if (modalClose) modalClose.onclick = closeModal;
  if (modalOverlay) {
    modalOverlay.onclick = (e) => {
      if (e.target === modalOverlay) closeModal();
    };
  }

  document.onkeydown = (e) => {
    if (e.key === 'Escape' && modalOverlay && modalOverlay.classList.contains('active')) {
      closeModal();
    }
  };

  // Wire up filter controls
  function bindFilters() {
    const allFilterBtns = document.querySelectorAll('.filter-btn, .project-tab-btn');
    const projectCards = document.querySelectorAll('.project-card');
    const desktopFilterCount = document.getElementById('filterCount');
    const mobileFilterCount = document.getElementById('filterCountMobile');
    const mobileCountContainer = document.querySelector('.project-tabs-count');
    const tabIndicator = document.querySelector('.project-tab-indicator');

    function updateMobileIndicator(btn) {
      if (!tabIndicator || !btn) return;
      const width = btn.offsetWidth;
      const left = btn.offsetLeft;
      tabIndicator.style.width = `${width}px`;
      tabIndicator.style.transform = `translateX(${left}px)`;
    }

    function applyFilter(filterKey, triggerBtn) {
      allFilterBtns.forEach(b => {
        const match = b.getAttribute('data-filter') === filterKey;
        if (match) {
          b.classList.add('active');
          b.setAttribute('aria-selected', 'true');
        } else {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        }
      });

      const activeMobileTab = document.querySelector('.mobile-project-tabs .project-tab-btn.active');
      if (activeMobileTab) {
        updateMobileIndicator(activeMobileTab);
        if (triggerBtn && triggerBtn.classList.contains('project-tab-btn')) {
          triggerBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        }
      }

      let visible = 0;
      projectCards.forEach(card => {
        const cat = card.getAttribute('data-category');
        if (filterKey === 'all' || cat === filterKey) {
          card.style.display = 'flex';
          visible++;
        } else {
          card.style.display = 'none';
        }
      });

      if (desktopFilterCount) desktopFilterCount.textContent = visible;
      if (mobileCountContainer) {
        mobileCountContainer.innerHTML = `Showing <span id="filterCountMobile">${visible}</span> ${visible === 1 ? 'project' : 'projects'}`;
      } else if (mobileFilterCount) {
        mobileFilterCount.textContent = visible;
      }
    }

    allFilterBtns.forEach(btn => {
      btn.onclick = () => {
        const filter = btn.getAttribute('data-filter') || 'all';
        applyFilter(filter, btn);
      };
    });

    // Re-bind modal triggers
    document.querySelectorAll('[data-modal]').forEach(btn => {
      btn.onclick = () => {
        const key = btn.getAttribute('data-modal');
        openModal(key);
      };
    });
  }

  // Initial filter bind
  bindFilters();

  // ---------------------------------------------------------------------------
  // DYNAMIC FETCH: Connect to FastAPI + PostgreSQL backend
  // ---------------------------------------------------------------------------
  const projectsGrid = document.querySelector('.projects-grid');
  if (projectsGrid) {
    fetch(`${API_URL}/api/v1/projects`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(apiProjects => {
        if (!Array.isArray(apiProjects) || apiProjects.length === 0) return;

        // Reset projectsData dictionary with published DB records
        projectsData = {};

        // Generate dynamic HTML cards
        const dynamicCardsHtml = apiProjects.map(p => {
          const key = p.slug || p.id;
          const imageSrc = resolveImageUrl(p.thumbnail_url);

          // Map category for label display
          const categoryLabels = {
            'fullstack': 'Full-Stack Platform',
            'analytics': 'Analytics & Dashboards',
            'marketplace': 'Marketplace & Launchpad'
          };
          const categoryDisplay = categoryLabels[p.category] || p.category;

          // Highlights panel
          const highlightsHtml = (p.highlights || []).map(h => {
            const parts = h.split(':');
            const boldPart = parts.length > 1 ? `<strong>${escapeHtml(parts[0])}:</strong>` : '';
            const restPart = parts.length > 1 ? escapeHtml(parts.slice(1).join(':')) : escapeHtml(h);

            return `
              <div class="highlight-item">
                <div class="highlight-icon" aria-hidden="true">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <div class="highlight-text">
                  ${boldPart} ${restPart}
                </div>
              </div>
            `;
          }).join('');

          // Tech tags
          const tagsHtml = (p.technologies || []).map(t => `<span class="tech-tag">${escapeHtml(t)}</span>`).join('');

          // Action buttons
          const sourceBtn = p.github_url ? `
            <a href="${escapeHtml(p.github_url)}" target="_blank" rel="noopener noreferrer" class="btn-source-purple" aria-label="View source code on GitHub">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span>View Source</span>
            </a>
          ` : '';

          const demoBtn = p.live_demo_url ? `
            <a href="${escapeHtml(p.live_demo_url)}" target="_blank" rel="noopener noreferrer" class="btn-demo-outline" aria-label="Visit live demo">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
              <span>Live Demo</span>
            </a>
          ` : '';

          // Register in modal dictionary
          projectsData[key] = {
            title: p.title,
            category: categoryDisplay,
            status: p.live_demo_url ? 'Live Demo' : 'Live Prototype',
            tech: p.technologies || [],
            description: p.full_description || p.short_description,
            image: imageSrc,
            repoUrl: p.github_url,
            demoUrl: p.live_demo_url,
            highlights: p.highlights || []
          };

          return `
            <article class="project-card" data-category="${escapeHtml(p.category)}">
              <div class="card-media-wrap" data-modal="${escapeHtml(key)}" style="cursor:pointer;" title="Click to view details">
                <img src="${imageSrc}" alt="${escapeHtml(p.title)} preview" class="card-media-img" loading="lazy">
                <div class="media-badge-bar">
                  <span class="badge-category">${escapeHtml(categoryDisplay)}</span>
                  <span class="badge-live-dot">${p.live_demo_url ? 'Live Demo' : 'Live Prototype'}</span>
                </div>
              </div>

              <div class="card-body">
                <div class="tech-tags-row">
                  ${tagsHtml}
                </div>

                <h2 class="card-title">${escapeHtml(p.title)}</h2>
                <p class="card-description">
                  ${escapeHtml(p.short_description)}
                </p>

                <div class="card-highlights-panel">
                  ${highlightsHtml}
                </div>

                <div class="card-actions-row">
                  ${sourceBtn}
                  ${demoBtn}
                </div>
              </div>
            </article>
          `;
        }).join('');

        projectsGrid.innerHTML = dynamicCardsHtml;

        // Re-bind filtering and modal events to the freshly rendered dynamic cards
        bindFilters();

        const countDesktop = document.getElementById('filterCount');
        const countMobile = document.getElementById('filterCountMobile');
        if (countDesktop) countDesktop.textContent = apiProjects.length;
        if (countMobile) countMobile.textContent = apiProjects.length;
      })
      .catch(err => {
        console.info('[Portfolio CMS] Using baseline static projects cache (backend API offline or unreachable).');
      });
  }

  function resolveImageUrl(url) {
    if (!url) return 'assets/images/apex-cinemas-preview.png';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/uploads/')) return `${API_URL}${url}`;
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
}

window.initProjectBehaviors = initProjectBehaviors;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProjectBehaviors);
} else {
  initProjectBehaviors();
}
