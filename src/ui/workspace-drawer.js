/**
 * Workspace Drawer & New Resume Creation Wizard
 * Multi-Document Management, 50-Snapshot Version History, and Guided Creation Modal.
 */
import * as db from '../state/db.js';
import { createInitialDocument, generateId } from '../state/schema.js';
import { STARTER_RESUMES } from '../templates/starters.js';
import { TEMPLATES } from '../templates/registry.js';
import { showModal } from '../app.js';

export function initWorkspaceDrawer(containerEl, store, showToastCallback) {
  if (!containerEl) return;

  let activeTab = 'resumes'; // 'resumes' | 'history'
  let resumeSearchTerm = '';

  async function refresh() {
    const doc = store.getDocument();
    const docId = doc?.id;
    const docIndex = await db.getDocumentIndex();
    const snapshots = docId ? await db.getSnapshots(docId) : [];

    containerEl.innerHTML = `
      <div class="panel-header">
        <div class="panel-header-title">
          <span class="panel-icon">📂</span>
          <h3>Resumes & History</h3>
        </div>
        <button class="btn-close-drawer" id="close-workspace-btn" aria-label="Close Workspace">&times;</button>
      </div>

      <div class="workspace-tabs">
        <button class="ws-tab-btn ${activeTab === 'resumes' ? 'is-active' : ''}" data-tab="resumes">
          Documents (${docIndex.length})
        </button>
        <button class="ws-tab-btn ${activeTab === 'history' ? 'is-active' : ''}" data-tab="history">
          Version History (${snapshots.length})
        </button>
      </div>

      <div class="drawer-scroll-body">
        ${activeTab === 'resumes' ? renderResumesTab(docIndex, docId) : renderHistoryTab(snapshots)}
      </div>
    `;

    attachListeners(docIndex, snapshots);
  }

  function renderResumesTab(docIndex, currentId) {
    const filtered = resumeSearchTerm
      ? docIndex.filter(d => (d.title || '').toLowerCase().includes(resumeSearchTerm.toLowerCase()))
      : docIndex;

    return `
      <div class="workspace-actions">
        <button id="btn-open-wizard" class="btn btn-primary btn-block">
          ✨ Create New Resume Wizard...
        </button>
        <div class="dropdown-starters mt-3">
          <label class="text-xs text-muted">Quick Starters:</label>
          <div class="starter-chips">
            <button class="btn-chip" data-starter="mid-swe">Mid-Career SWE</button>
            <button class="btn-chip" data-starter="entry-level">Student / Entry</button>
            <button class="btn-chip" data-starter="senior-mgmt">Executive / VP</button>
            <button class="btn-chip" data-starter="academic-cv">Academic CV</button>
            <button class="btn-chip" data-starter="blank-guided">Blank Skeleton</button>
          </div>
        </div>

        <div class="search-input-wrap mt-3">
          <input type="text" id="ws-resume-search" class="form-input search-input-sm" placeholder="Filter saved resumes..." value="${escapeHtml(resumeSearchTerm)}">
        </div>
      </div>

      <div class="document-list mt-3">
        <h4 class="section-label">Your Saved Resumes (${filtered.length})</h4>
        ${filtered.length === 0 ? '<div class="empty-state text-sm text-muted">No matching resumes found.</div>' : ''}
        ${filtered.map(item => `
          <div class="doc-card ${item.id === currentId ? 'is-active' : ''}" data-doc-id="${item.id}">
            <div class="doc-card-info">
              <span class="doc-title">${escapeHtml(item.title)}</span>
              <span class="doc-meta">Template: ${item.template} • ${formatDate(item.updatedAt)}</span>
            </div>
            <div class="doc-card-actions">
              <button class="btn-icon doc-rename-btn" data-doc-id="${item.id}" title="Rename Resume">✏️</button>
              <button class="btn-icon doc-clone-btn" data-doc-id="${item.id}" title="Duplicate Resume">📋</button>
              ${docIndex.length > 1 ? `
                <button class="btn-icon doc-delete-btn" data-doc-id="${item.id}" title="Delete Resume">🗑️</button>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>

      <div class="workspace-backup-section mt-4 pt-3 border-top">
        <h4 class="section-label">Browser Storage & Backup</h4>
        <p class="text-xs text-muted mb-2">All documents, edits, and checkpoints are stored locally in this browser. Export a JSON backup anytime for safekeeping.</p>
        <div class="btn-group-row">
          <button id="btn-export-workspace" class="btn btn-sm btn-outline-primary flex-1" title="Export all resumes and history as JSON">
            ⬇️ Export Workspace (.json)
          </button>
          <button id="btn-import-workspace" class="btn btn-sm btn-outline-secondary flex-1" title="Restore resumes from JSON backup">
            ⬆️ Restore Workspace
          </button>
        </div>
        <input type="file" id="workspace-import-file-input" accept=".json" style="display: none;">
      </div>
    `;
  }

  function renderHistoryTab(snapshots) {
    return `
      <div class="history-actions">
        <button id="btn-take-snapshot" class="btn btn-sm btn-outline-primary btn-block">
          📸 Save Snapshot Now
        </button>
        <span class="text-xs text-muted mt-1 display-block">Keystrokes auto-save checkpoints up to 50 versions</span>
      </div>

      <div class="snapshot-list mt-3">
        ${snapshots.length === 0 ? '<div class="empty-state text-sm text-muted">No snapshots yet. Keystrokes auto-save checkpoints as you edit.</div>' : ''}
        ${snapshots.map((s, idx) => {
          const words = s.rawMarkdown.trim().split(/\s+/).length;
          const prevWords = snapshots[idx + 1] ? snapshots[idx + 1].rawMarkdown.trim().split(/\s+/).length : words;
          const wordDiff = words - prevWords;
          const diffBadge = wordDiff !== 0
            ? `<span class="word-diff ${wordDiff > 0 ? 'diff-pos' : 'diff-neg'}">${wordDiff > 0 ? '+' : ''}${wordDiff} words</span>`
            : '';

          return `
            <div class="snapshot-card" data-snap-id="${s.snapshotId}">
              <div class="snap-info">
                <div class="snap-header">
                  <span class="snap-trigger badge-${s.trigger}">${s.trigger.toUpperCase()}</span>
                  <span class="snap-time">${formatDate(s.timestamp)}</span>
                </div>
                <div class="snap-summary">${escapeHtml(s.summary || 'Snapshot')}</div>
                <div class="snap-details text-xs text-muted">
                  ${s.rawMarkdown.length} chars • ${words} words ${diffBadge}
                </div>
              </div>
              <div class="snap-actions">
                <button class="btn-sm btn-outline-secondary btn-rollback" data-snap-id="${s.snapshotId}">Revert</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function attachListeners(docIndex, snapshots) {
    const closeBtn = containerEl.querySelector('#close-workspace-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        containerEl.classList.remove('is-open');
        document.getElementById('drawer-backdrop')?.classList.remove('is-active');
      });
    }

    // Tab buttons
    containerEl.querySelectorAll('.ws-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeTab = btn.getAttribute('data-tab');
        refresh();
      });
    });

    // Search filter
    const searchInput = containerEl.querySelector('#ws-resume-search');
    searchInput?.addEventListener('input', (e) => {
      resumeSearchTerm = e.target.value;
      refresh();
      const updatedInput = containerEl.querySelector('#ws-resume-search');
      if (updatedInput) {
        updatedInput.focus();
        updatedInput.selectionStart = updatedInput.selectionEnd = updatedInput.value.length;
      }
    });

    // Open Wizard
    const wizardBtn = containerEl.querySelector('#btn-open-wizard');
    if (wizardBtn) {
      wizardBtn.addEventListener('click', () => {
        openNewResumeModal(store, showToastCallback);
      });
    }

    // Load Starter Chip
    containerEl.querySelectorAll('.btn-chip').forEach(chip => {
      chip.addEventListener('click', async () => {
        const key = chip.getAttribute('data-starter');
        const starter = STARTER_RESUMES[key];
        if (starter) {
          const newDoc = createInitialDocument({
            id: generateId(),
            title: starter.title,
            rawMarkdown: starter.rawMarkdown
          });
          await db.saveDocument(newDoc, true, 'manual', 'Created from ' + starter.title);
          await db.setActiveDocumentId(newDoc.id);
          store.setDocument(newDoc);
          showToastCallback(`Loaded starter: ${starter.title}`);
          refresh();
        }
      });
    });

    // Select Document
    containerEl.querySelectorAll('.doc-card').forEach(card => {
      card.addEventListener('click', async (e) => {
        if (e.target.closest('button')) return;
        const id = card.getAttribute('data-doc-id');
        const doc = await db.getDocument(id);
        if (doc) {
          await db.setActiveDocumentId(id);
          store.setDocument(doc);
          refresh();
        }
      });
    });

    // Rename Resume
    containerEl.querySelectorAll('.doc-rename-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-doc-id');
        const target = docIndex.find(d => d.id === id);
        if (!target) return;

        showModal({
          title: 'Rename Resume',
          message: `
            <div class="form-group mb-2">
              <label for="rename-doc-input" class="form-label text-sm">Resume Title</label>
              <input type="text" id="rename-doc-input" class="form-input" value="${escapeHtml(target.title)}" autofocus>
            </div>
          `,
          options: [
            {
              label: 'Save Title',
              primary: true,
              action: async () => {
                const inputVal = document.getElementById('rename-doc-input')?.value.trim();
                if (inputVal && inputVal !== target.title) {
                  if (id === currentId) {
                    store.updateTitle(inputVal);
                  } else {
                    const docToRename = await db.getDocument(id);
                    if (docToRename) {
                      docToRename.title = inputVal;
                      await db.saveDocument(docToRename, true, 'manual', 'Renamed document');
                    }
                  }
                  showToastCallback(`Renamed to "${inputVal}"`);
                  refresh();
                }
              }
            },
            {
              label: 'Cancel',
              cancel: true,
              action: () => {}
            }
          ]
        });
      });
    });

    // Clone Resume
    containerEl.querySelectorAll('.doc-clone-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-doc-id');
        try {
          const cloned = await db.duplicateDocument(id);
          await db.setActiveDocumentId(cloned.id);
          store.setDocument(cloned);
          showToastCallback(`Duplicated resume as "${cloned.title}"`);
          refresh();
        } catch (err) {
          showModal({
            title: 'Clone Failed',
            message: err.message,
            options: [{ label: 'OK', primary: true }]
          });
        }
      });
    });

    // Delete Resume with accessible showModal
    containerEl.querySelectorAll('.doc-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-doc-id');
        const target = docIndex.find(d => d.id === id);

        showModal({
          title: 'Delete Resume?',
          message: `Are you sure you want to permanently delete "${target?.title || 'this resume'}"? This action cannot be undone.`,
          options: [
            {
              label: 'Delete Permanently',
              danger: true,
              action: async () => {
                const remaining = await db.deleteDocument(id);
                if (remaining.length > 0) {
                  const next = await db.getDocument(remaining[0].id);
                  await db.setActiveDocumentId(next.id);
                  store.setDocument(next);
                }
                showToastCallback('Resume deleted');
                refresh();
              }
            },
            {
              label: 'Cancel',
              cancel: true,
              action: () => {}
            }
          ]
        });
      });
    });

    // Take snapshot
    const takeSnapBtn = containerEl.querySelector('#btn-take-snapshot');
    if (takeSnapBtn) {
      takeSnapBtn.addEventListener('click', async () => {
        await store.manualSnapshot('Manual checkpoint');
        showToastCallback('Saved version snapshot!');
        refresh();
      });
    }

    // Rollback snapshot with accessible showModal
    containerEl.querySelectorAll('.btn-rollback').forEach(btn => {
      btn.addEventListener('click', () => {
        const snapId = btn.getAttribute('data-snap-id');
        const targetSnap = snapshots.find(s => s.snapshotId === snapId);
        const doc = store.getDocument();

        showModal({
          title: 'Revert to Snapshot?',
          message: `Revert resume to version from ${formatDate(targetSnap?.timestamp)}? A safety snapshot of your current version will be saved automatically first.`,
          options: [
            {
              label: 'Revert to This Version',
              primary: true,
              action: async () => {
                try {
                  const reverted = await db.rollbackSnapshot(doc.id, snapId);
                  store.setDocument(reverted);
                  showToastCallback('Rolled back to selected version!');
                  refresh();
                } catch (err) {
                  showToastCallback('Rollback failed: ' + err.message, 'error');
                }
              }
            },
            {
              label: 'Cancel',
              cancel: true,
              action: () => {}
            }
          ]
        });
      });
    });
    // Export Workspace Bundle
    const exportWsBtn = containerEl.querySelector('#btn-export-workspace');
    if (exportWsBtn) {
      exportWsBtn.addEventListener('click', async () => {
        try {
          const bundle = await db.exportWorkspaceBundle();
          const dateStr = new Date().toISOString().slice(0, 10);
          const filename = `resume-builder-workspace-${dateStr}.json`;
          const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          showToastCallback('Workspace backup downloaded successfully!');
        } catch (err) {
          showToastCallback('Export failed: ' + err.message, 'error');
        }
      });
    }

    // Import / Restore Workspace Bundle
    const importWsBtn = containerEl.querySelector('#btn-import-workspace');
    const importWsInput = containerEl.querySelector('#workspace-import-file-input');
    if (importWsBtn && importWsInput) {
      importWsBtn.addEventListener('click', () => {
        importWsInput.click();
      });

      importWsInput.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        showModal({
          title: 'Restore Workspace Backup?',
          message: `Restoring "${escapeHtml(file.name)}" will import and merge saved resumes and version snapshots into your local browser database. Continue?`,
          options: [
            {
              label: 'Restore Backup',
              primary: true,
              action: async () => {
                try {
                  const text = await file.text();
                  const bundle = JSON.parse(text);
                  const restoredCount = await db.importWorkspaceBundle(bundle);
                  const activeDoc = await db.getDocument(bundle.activeDocumentId) || await db.getDocument(bundle.documents?.[0]?.id);
                  if (activeDoc) {
                    await db.setActiveDocumentId(activeDoc.id);
                    store.setDocument(activeDoc);
                  }
                  showToastCallback(`Restored ${restoredCount} resume(s) from backup!`);
                  refresh();
                } catch (err) {
                  showToastCallback('Restore failed: ' + err.message, 'error');
                }
              }
            },
            {
              label: 'Cancel',
              cancel: true,
              action: () => {}
            }
          ]
        });
        e.target.value = '';
      });
    }
  }

  // Subscriptions
  store.subscribe('snapshots:update', () => {
    if (containerEl.classList.contains('is-open')) refresh();
  });

  store.subscribe('document:loaded', () => {
    if (containerEl.classList.contains('is-open')) refresh();
  });

  store.subscribe('title:change', () => {
    if (containerEl.classList.contains('is-open')) refresh();
  });

  store.subscribe('config:change', () => {
    if (containerEl.classList.contains('is-open')) refresh();
  });

  return {
    open: () => {
      containerEl.classList.add('is-open');
      refresh();
    },
    close: () => containerEl.classList.remove('is-open'),
    refresh: () => refresh(),
    toggle: () => {
      containerEl.classList.toggle('is-open');
      if (containerEl.classList.contains('is-open')) refresh();
    }
  };
}

/**
 * Inspiring New Resume Creation Wizard Modal
 */
export function openNewResumeModal(store, showToast) {
  let selectedPersona = 'mid-swe';
  let selectedTemplate = 'modern-minimal';

  const modalHtml = `
    <div class="new-resume-wizard">
      <div class="form-group mb-3">
        <label for="new-doc-title">Resume Title</label>
        <input type="text" id="new-doc-title" class="form-input" value="My New Resume" placeholder="e.g. Senior Frontend Engineer — Stripe">
      </div>

      <div class="wizard-step mb-3">
        <label class="wizard-step-label">1. Choose Content Starting Point</label>
        <div class="wizard-personas-grid">
          <div class="persona-card is-selected" data-starter="mid-swe">
            <span class="persona-icon">💻</span>
            <div class="persona-title">Software Engineer</div>
            <div class="persona-desc">6+ yrs systems, distributed platforms, metrics</div>
          </div>
          <div class="persona-card" data-starter="entry-level">
            <span class="persona-icon">🎓</span>
            <div class="persona-title">Student / Entry</div>
            <div class="persona-desc">Education-first, projects, internships, hackathons</div>
          </div>
          <div class="persona-card" data-starter="senior-mgmt">
            <span class="persona-icon">👔</span>
            <div class="persona-title">Director / VP</div>
            <div class="persona-desc">Executive leadership, org scaling, 2-page target</div>
          </div>
          <div class="persona-card" data-starter="academic-cv">
            <span class="persona-icon">📚</span>
            <div class="persona-title">Academic CV</div>
            <div class="persona-desc">Publications, grants, research, teaching (A4)</div>
          </div>
          <div class="persona-card" data-starter="blank-guided">
            <span class="persona-icon">📄</span>
            <div class="persona-title">Blank Skeleton</div>
            <div class="persona-desc">Clean minimal placeholders ready for your content</div>
          </div>
        </div>
      </div>

      <div class="wizard-step">
        <label class="wizard-step-label">2. Pick Visual Template Aesthetic</label>
        <div class="wizard-templates-grid">
          ${TEMPLATES.map(t => `
            <div class="wizard-template-card ${t.id === selectedTemplate ? 'is-selected' : ''}" data-template="${t.id}">
              <div class="template-wireframe wireframe-${t.id}">
                <div class="wire-header"></div>
                <div class="wire-body"><div class="wire-col-1"></div></div>
              </div>
              <span class="wt-name">${t.name}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  showModal({
    title: 'Create New Resume',
    message: modalHtml,
    options: [
      {
        label: 'Create Resume',
        primary: true,
        action: async () => {
          const title = document.getElementById('new-doc-title')?.value.trim() || 'Untitled Resume';
          const starter = STARTER_RESUMES[selectedPersona] || STARTER_RESUMES['blank-guided'];

          const newDoc = createInitialDocument({
            id: generateId(),
            title: title,
            rawMarkdown: starter.rawMarkdown
          });

          newDoc.config.template = selectedTemplate;
          const chosenTmpl = TEMPLATES.find(t => t.id === selectedTemplate);
          if (chosenTmpl && chosenTmpl.defaultPairing) {
            Object.assign(newDoc.config, chosenTmpl.defaultPairing);
          }

          await db.saveDocument(newDoc, true, 'manual', 'Created with wizard');
          await db.setActiveDocumentId(newDoc.id);
          store.setDocument(newDoc);
          showToast(`Created "${title}" using ${chosenTmpl?.name || selectedTemplate} template!`);
        }
      },
      {
        label: 'Cancel',
        cancel: true,
        action: () => {}
      }
    ]
  });

  // Attach dynamic selection listeners within modal dialog
  setTimeout(() => {
    const dialog = document.querySelector('.modal-dialog');
    if (!dialog) return;

    dialog.querySelectorAll('.persona-card').forEach(card => {
      card.addEventListener('click', () => {
        dialog.querySelectorAll('.persona-card').forEach(c => c.classList.remove('is-selected'));
        card.classList.add('is-selected');
        selectedPersona = card.getAttribute('data-starter');
      });
    });

    dialog.querySelectorAll('.wizard-template-card').forEach(card => {
      card.addEventListener('click', () => {
        dialog.querySelectorAll('.wizard-template-card').forEach(c => c.classList.remove('is-selected'));
        card.classList.add('is-selected');
        selectedTemplate = card.getAttribute('data-template');
      });
    });
  }, 50);
}

function formatDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
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
