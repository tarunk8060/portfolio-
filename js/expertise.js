/**
 * Tarun.K Portfolio - My Expertise Dynamic CMS Integration
 * Fetches published technical domains and skills from FastAPI + PostgreSQL
 */

function initExpertiseBehaviors() {
  const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? (window.location.port === '8000' ? '' : 'http://localhost:8000')
    : '';

  const groupsContainer = document.querySelector('.expertise-groups-section .container');
  if (!groupsContainer) return;

  // Attempt to fetch dynamic published skills from CMS backend
  fetch(`${API_URL}/api/v1/skills`)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(skills => {
      if (!Array.isArray(skills) || skills.length === 0) return;

      // Group skills by category
      const categories = {};
      skills.forEach(s => {
        if (!categories[s.category]) categories[s.category] = [];
        categories[s.category].push(s);
      });

      const categoryDescriptions = {
        'Programming Languages': 'Core algorithmic problem solving & logic',
        'Web Development': 'Modern semantic markup, styling systems & client logic',
        'Cloud & Infrastructure Concepts': 'Deployment workflows, operating systems & containerization'
      };

      // Check if callout exists
      const callout = groupsContainer.querySelector('.learning-callout');

      // Clear existing group blocks while preserving callout
      const existingBlocks = groupsContainer.querySelectorAll('.tech-group-block');
      existingBlocks.forEach(b => b.remove());

      let groupNum = 1;
      const fragment = document.createDocumentFragment();

      Object.keys(categories).forEach(catName => {
        const catSkills = categories[catName];
        const numFormatted = String(groupNum).padStart(2, '0');
        const descText = categoryDescriptions[catName] || 'Specialized capabilities and system engineering';

        const block = document.createElement('div');
        block.className = 'tech-group-block';

        const cardsHtml = catSkills.map(skill => {
          let iconHtml = escapeHtml(skill.icon_url || skill.name.substring(0, 3));
          if (skill.icon_url && (skill.icon_url.startsWith('http') || skill.icon_url.startsWith('/uploads'))) {
            const resolvedIcon = skill.icon_url.startsWith('/uploads') ? `${API_URL}${skill.icon_url}` : skill.icon_url;
            iconHtml = `<img src="${resolvedIcon}" alt="${escapeHtml(skill.name)}" style="width:22px; height:22px; object-fit:contain;">`;
          }

          const badgeHtml = skill.badge_label
            ? `<span class="tech-tag-pill">${escapeHtml(skill.badge_label)}</span>`
            : '';

          return `
            <div class="tech-card">
              <div class="tech-icon-wrap" aria-hidden="true">${iconHtml}</div>
              <h3 class="tech-name">${escapeHtml(skill.name)}</h3>
              <p class="tech-context">${escapeHtml(skill.description)}</p>
              ${badgeHtml}
            </div>
          `;
        }).join('');

        block.innerHTML = `
          <div class="tech-group-header">
            <h2 class="tech-group-title">
              <span class="group-number">${numFormatted}</span>
              <span>${escapeHtml(catName)}</span>
            </h2>
            <span class="tech-group-desc">${escapeHtml(descText)}</span>
          </div>
          <div class="tech-cards-grid">
            ${cardsHtml}
          </div>
        `;

        fragment.appendChild(block);
        groupNum++;
      });

      if (callout) {
        groupsContainer.insertBefore(fragment, callout);
      } else {
        groupsContainer.appendChild(fragment);
      }
    })
    .catch(err => {
      // Backend unavailable; seamlessly keep static HTML without any glitch
      console.info('[Portfolio CMS] Using baseline static skills cache (backend API offline or unreachable).');
    });
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

window.initExpertiseBehaviors = initExpertiseBehaviors;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initExpertiseBehaviors);
} else {
  initExpertiseBehaviors();
}
