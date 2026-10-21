/**
 * Interactive ATS Readiness Auditor Panel with One-Click Fixes
 */

export function initAtsPanel(containerEl, store, showToastCallback) {
  if (!containerEl) return;

  function render(atsReport) {
    if (!atsReport) {
      containerEl.innerHTML = `
        <div class="panel-header">
          <h3>ATS Auditor</h3>
          <button class="btn-close-drawer" id="close-ats-btn" aria-label="Close ATS Panel">&times;</button>
        </div>
        <div class="panel-section text-muted">Auditing document...</div>
      `;
      return;
    }

    const { score, grade, issues, stats } = atsReport;

    containerEl.innerHTML = `
      <div class="panel-header">
        <h3>ATS Readiness Auditor</h3>
        <button class="btn-close-drawer" id="close-ats-btn" aria-label="Close ATS Panel">&times;</button>
      </div>

      <div class="ats-score-card" style="border-left: 4px solid ${grade.color}">
        <div class="score-display">
          <span class="score-number" style="color: ${grade.color}">${score}%</span>
          <div class="score-badge" style="background-color: ${grade.color}20; color: ${grade.color}">
            ${grade.label}
          </div>
        </div>
        <div class="ats-stats mt-2 text-xs text-muted">
          <span>Sections: ${stats.sectionCount}</span> •
          <span>Bullets: ${stats.totalBullets}</span> •
          <span>Action Verbs: ${stats.actionVerbRatio}%</span>
        </div>
      </div>

      <div class="panel-section">
        <h4 class="section-label">Findings & Recommendations (${issues.length})</h4>
        
        ${issues.length === 0 ? `
          <div class="ats-clean-state">
            🎉 All ATS compliance checks passed! Your resume follows standard recruiter parsing taxonomies.
          </div>
        ` : ''}

        <div class="ats-issues-list">
          ${issues.map((issue, idx) => `
            <div class="ats-issue-card severity-${issue.severity}">
              <div class="issue-header">
                <span class="issue-tag tag-${issue.severity}">${issue.severity.toUpperCase()}</span>
                <span class="issue-cat">${issue.category}</span>
              </div>
              <div class="issue-msg">${escapeHtml(issue.message)}</div>
              <div class="issue-rec text-xs text-muted">${escapeHtml(issue.recommendation)}</div>
              
              ${issue.suggestedTitle ? `
                <button class="btn-sm btn-outline-primary mt-2 btn-fix-header" data-orig="${escapeHtml(issue.originalTitle)}" data-sugg="${escapeHtml(issue.suggestedTitle)}">
                  Rename to "## ${escapeHtml(issue.suggestedTitle)}"
                </button>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;

    attachListeners();
  }

  function attachListeners() {
    const closeBtn = containerEl.querySelector('#close-ats-btn');
    if (closeBtn) closeBtn.addEventListener('click', () => containerEl.classList.remove('is-open'));

    // Fix header button
    containerEl.querySelectorAll('.btn-fix-header').forEach(btn => {
      btn.addEventListener('click', () => {
        const orig = btn.getAttribute('data-orig');
        const sugg = btn.getAttribute('data-sugg');
        const doc = store.getDocument();
        if (doc && doc.rawMarkdown) {
          // Replace ## orig with ## sugg
          const regex = new RegExp(`^##\\s+${escapeRegex(orig)}\\s*$`, 'm');
          if (regex.test(doc.rawMarkdown)) {
            doc.rawMarkdown = doc.rawMarkdown.replace(regex, `## ${sugg}`);
            store.setDocument(doc);
            showToastCallback(`Updated section header to "## ${sugg}"`);
          }
        }
      });
    });
  }

  store.subscribe('parsed:update', (result) => {
    if (result && containerEl.classList.contains('is-open')) {
      render(result.atsReport);
    }
  });

  return {
    open: () => {
      containerEl.classList.add('is-open');
      render(store.parsedResult?.atsReport);
    },
    close: () => containerEl.classList.remove('is-open'),
    toggle: () => {
      containerEl.classList.toggle('is-open');
      if (containerEl.classList.contains('is-open')) {
        render(store.parsedResult?.atsReport);
      }
    }
  };
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
