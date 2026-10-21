/**
 * Master Application Entry Point
 * Orchestrates Store, Parsers, Layout, UI Components, Theme, and PWA Service Worker.
 */
import { store } from './state/store.js';
import * as db from './state/db.js';
import { createInitialDocument, generateId, PAPER_DIMENSIONS, FONT_CATALOG } from './state/schema.js';
import { STARTER_RESUMES } from './templates/starters.js';
import { parseResumePipeline } from './parser/pipeline.js';
import { syncConfigToMarkdown } from './parser/frontmatter.js';
import { calculatePageMetrics, renderPageBreakOverlays, paginatePreviewSheet } from './layout/pagination.js';
import { initSplitter } from './layout/splitter.js';
import { initEditor } from './ui/editor.js';
import { initToolbar } from './ui/toolbar.js';
import { initDesignPanel } from './ui/design-panel.js';
import { initWorkspaceDrawer, openNewResumeModal } from './ui/workspace-drawer.js';
import { initAtsPanel } from './ui/ats-panel.js';
import { initImportEngine, handleFileImport } from './io/import-engine.js';
import { syncDynamicPageStyle } from './io/pdf-export.js';

let toolbarManager = null;

// DOM Element References
export const elements = {
  // Top Header / Toolbar
  titleInput: document.getElementById('doc-title-input'),
  quickSaveBtn: document.getElementById('quick-save-btn'),
  saveStatusIndicator: document.getElementById('save-status-indicator'),
  newResumeWizardBtn: document.getElementById('new-resume-wizard-btn'),
  workspaceToggleBtn: document.getElementById('workspace-toggle-btn'),
  modeSplitBtn: document.getElementById('mode-split-btn'),
  modeEditorBtn: document.getElementById('mode-editor-btn'),
  modePreviewBtn: document.getElementById('mode-preview-btn'),
  templateSelect: document.getElementById('template-select'),
  designToggleBtn: document.getElementById('design-toggle-btn'),
  atsScorePill: document.getElementById('ats-score-pill'),
  themeToggleBtn: document.getElementById('theme-toggle-btn'),
  fileImportInput: document.getElementById('file-import-input'),

  // Export Hub
  exportPdfBtn: document.getElementById('export-pdf-btn'),
  exportMenuToggleBtn: document.getElementById('export-menu-toggle-btn'),
  exportDropdownMenu: document.getElementById('export-dropdown-menu'),
  exportPdfMenuBtn: document.getElementById('export-pdf-menu-btn'),
  exportHtmlBtn: document.getElementById('export-html-btn'),
  previewHtmlBtn: document.getElementById('preview-html-btn'),
  exportDocxBtn: document.getElementById('export-docx-btn'),
  exportJsonBtn: document.getElementById('export-json-btn'),
  exportMdBtn: document.getElementById('export-md-btn'),

  // Split layout
  container: document.getElementById('main-split-container'),
  editorPane: document.getElementById('editor-pane'),
  previewPane: document.getElementById('preview-pane'),
  splitDivider: document.getElementById('split-divider'),
  textarea: document.getElementById('markdown-editor-input'),
  lineNumbers: document.getElementById('editor-line-numbers'),
  statusBar: document.getElementById('editor-status-bar'),

  // Editor Toolbar
  editorToolbar: document.getElementById('editor-toolbar'),
  btnEditProfile: document.getElementById('btn-edit-profile'),
  editorSectionJump: document.getElementById('editor-section-jump'),

  // Preview Sub-Toolbar
  paperSelect: document.getElementById('paper-select'),
  targetPagesSelect: document.getElementById('target-pages-select'),
  fitPageBtn: document.getElementById('fit-page-btn'),
  undoFitBtn: document.getElementById('undo-fit-btn'),
  pageStatusPill: document.getElementById('page-status-pill'),
  pageNavGroup: document.getElementById('page-nav-group'),
  pagePrevBtn: document.getElementById('page-prev-btn'),
  pageNextBtn: document.getElementById('page-next-btn'),
  pageIndicatorText: document.getElementById('page-indicator-text'),
  zoomInBtn: document.getElementById('zoom-in-btn'),
  zoomOutBtn: document.getElementById('zoom-out-btn'),
  zoomResetBtn: document.getElementById('zoom-reset-btn'),
  zoomFitBtn: document.getElementById('zoom-fit-btn'),
  zoomLevelSpan: document.getElementById('zoom-level-span'),

  // Canvas
  previewRoot: document.getElementById('resume-preview-root'),
  canvasWrapper: document.getElementById('preview-canvas-wrapper'),
  sheet: document.getElementById('resume-sheet'),
  previewScrollViewport: document.getElementById('preview-scroll-viewport'),

  // Drawers & Modals
  workspaceDrawer: document.getElementById('workspace-drawer'),
  designDrawer: document.getElementById('design-drawer'),
  atsDrawer: document.getElementById('ats-drawer'),
  drawerBackdrop: document.getElementById('drawer-backdrop'),
  modalContainer: document.getElementById('modal-container'),
  toastContainer: document.getElementById('toast-container')
};

// Toast Notifications Helper
export function showToast(message, type = 'info') {
  if (!elements.toastContainer) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'toast-error' : ''}`;
  toast.textContent = message;
  elements.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 200);
  }, 3200);
}

// Accessible Modal Prompt Helper with Focus Trapping & Restoration
let lastActiveElementBeforeModal = null;

export function showModal({ title, message, options = [] }) {
  if (!elements.modalContainer) return;
  lastActiveElementBeforeModal = document.activeElement;

  elements.modalContainer.style.display = 'flex';
  elements.modalContainer.className = 'modal-backdrop';

  elements.modalContainer.innerHTML = `
    <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="modal-title-heading">
      <h3 id="modal-title-heading" class="modal-title">${title}</h3>
      <div class="modal-message">${message}</div>
      <div class="modal-buttons">
        ${options.map((opt, i) => `
          <button class="btn ${opt.primary ? 'btn-primary' : (opt.danger ? 'btn-outline-warning' : '')}" data-idx="${i}">
            ${opt.label}
          </button>
        `).join('')}
      </div>
    </div>
  `;

  const close = () => {
    elements.modalContainer.style.display = 'none';
    elements.modalContainer.innerHTML = '';
    if (lastActiveElementBeforeModal && typeof lastActiveElementBeforeModal.focus === 'function') {
      lastActiveElementBeforeModal.focus();
    }
  };

  elements.modalContainer.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-idx'), 10);
      const chosen = options[idx];
      close();
      if (chosen && chosen.action) {
        chosen.action();
      }
    });
  });

  // Auto-focus first input or button in modal
  const focusables = elements.modalContainer.querySelectorAll('input, select, textarea, button:not([disabled])');
  if (focusables.length > 0) {
    focusables[0].focus();
  }

  // Keyboard navigation & trap inside modal
  const handleKeydown = (e) => {
    if (e.key === 'Escape') {
      const cancelOpt = options.find(o => o.cancel);
      close();
      elements.modalContainer.removeEventListener('keydown', handleKeydown);
      if (cancelOpt && cancelOpt.action) cancelOpt.action();
      return;
    }

    if (e.key === 'Tab') {
      const currentFocusables = Array.from(elements.modalContainer.querySelectorAll('input, select, textarea, button:not([disabled])'));
      if (currentFocusables.length === 0) return;
      const firstEl = currentFocusables[0];
      const lastEl = currentFocusables[currentFocusables.length - 1];

      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    }
  };

  elements.modalContainer.addEventListener('keydown', handleKeydown);

  // Click outside dialog to close if cancel option exists
  elements.modalContainer.addEventListener('click', (e) => {
    if (e.target === elements.modalContainer) {
      const cancelOpt = options.find(o => o.cancel);
      close();
      elements.modalContainer.removeEventListener('keydown', handleKeydown);
      if (cancelOpt && cancelOpt.action) cancelOpt.action();
    }
  });
}

// Apply Scoped CSS Variables & Template Class
function applyStylesToPreview(config) {
  if (!elements.previewRoot) return;

  const paperKey = config.paper === 'a4' ? 'a4' : 'letter';
  const paperDim = PAPER_DIMENSIONS[paperKey];

  elements.previewRoot.style.setProperty('--resume-paper-width', `${paperDim.widthPx}px`);
  elements.previewRoot.style.setProperty('--resume-paper-height', `${paperDim.heightPx}px`);
  elements.previewRoot.style.setProperty('--resume-margin', `${config.margins}in`);
  elements.previewRoot.style.setProperty('--resume-font-size', `${config.fontSize}pt`);
  elements.previewRoot.style.setProperty('--resume-line-height', `${config.lineHeight}`);
  elements.previewRoot.style.setProperty('--resume-section-gap', `${config.sectionSpacing}px`);
  elements.previewRoot.style.setProperty('--resume-item-gap', `${config.itemSpacing}px`);
  elements.previewRoot.style.setProperty('--resume-bullet-gap', `${config.bulletSpacing}px`);

  // Fonts
  const primaryDef = FONT_CATALOG[config.primaryFont] || FONT_CATALOG['Inter'];
  const headerDef = FONT_CATALOG[config.headerFont] || FONT_CATALOG['Cinzel'] || primaryDef;
  const monoDef = FONT_CATALOG[config.monoFont] || FONT_CATALOG['JetBrains Mono'];

  elements.previewRoot.style.setProperty('--resume-font-primary', primaryDef?.stack || `'${config.primaryFont}', sans-serif`);
  elements.previewRoot.style.setProperty('--resume-font-header', headerDef?.stack || `'${config.headerFont}', serif`);
  elements.previewRoot.style.setProperty('--resume-font-mono', monoDef?.stack || `'${config.monoFont || 'JetBrains Mono'}', monospace`);

  // Modular Layout Style Attributes
  elements.previewRoot.setAttribute('data-header-align', config.headerAlign || 'left');
  elements.previewRoot.setAttribute('data-section-style', config.sectionStyle || 'line');
  elements.previewRoot.setAttribute('data-skill-style', config.skillStyle || 'tag');
  elements.previewRoot.setAttribute('data-bullet-style', config.bulletStyle || 'disc');

  // Colors
  elements.previewRoot.style.setProperty('--resume-color-ink', config.inkColor);
  elements.previewRoot.style.setProperty('--resume-color-muted', config.mutedColor);
  elements.previewRoot.style.setProperty('--resume-color-accent', config.accentColor);
  elements.previewRoot.style.setProperty('--resume-color-accent-tint', `${config.accentColor}15`);
  elements.previewRoot.style.setProperty('--resume-color-canvas', config.canvasColor);

  // Template Class
  elements.previewRoot.className = `template-${config.template || 'modern-minimal'}`;

  // Sync Dynamic @page print CSS with configured margins
  syncDynamicPageStyle(config.paper, config.margins);
}

// Full Render Pipeline Trigger
async function renderCurrentDocument(options = {}) {
  const doc = store.getDocument();
  if (!doc) return;

  let config = doc.config;
  const forcedConfig = options.fromEditor ? null : config;

  // Run pipeline
  const result = await parseResumePipeline(doc.rawMarkdown, { forcedConfig });

  // Bi-directional sync: If user typed in YAML settings in editor, sync into doc.config!
  if (options.fromEditor && result.config) {
    let changed = false;
    for (const k of Object.keys(result.config)) {
      if (result.config[k] !== doc.config[k]) {
        changed = true;
        break;
      }
    }
    if (changed) {
      doc.config = result.config;
      config = doc.config;
      store.notify('config:change', {
        config: doc.config,
        prevConfig: doc.config,
        syncToFrontmatter: false
      });
    }
  }

  store.setParsedResult(result);
  applyStylesToPreview(config);

  // Update HTML inside resume sheet
  if (elements.sheet) {
    elements.sheet.innerHTML = result.html;
  }

  // Multi-page margin parity spacer pagination
  paginatePreviewSheet(elements.sheet, elements.canvasWrapper, config);

  // Update visual pagination boundaries and page metrics
  const metrics = calculatePageMetrics(elements.sheet, config);
  renderPageBreakOverlays(elements.canvasWrapper, elements.sheet, config);

  if (metrics && elements.pageStatusPill) {
    elements.pageStatusPill.textContent = metrics.statusText;
    elements.pageStatusPill.className = `status-pill page-pill-${metrics.statusType}`;
  }

  // Update multi-page navigation indicators
  if (toolbarManager && metrics) {
    toolbarManager.updatePageNav(1, metrics.renderedPages || Math.ceil(metrics.exactPages) || 1);
  }
}

// Drawer Management
function closeAllDrawers() {
  elements.workspaceDrawer?.classList.remove('is-open');
  elements.designDrawer?.classList.remove('is-open');
  elements.atsDrawer?.classList.remove('is-open');
  elements.drawerBackdrop?.classList.remove('is-active');
  elements.workspaceToggleBtn?.setAttribute('aria-expanded', 'false');
  elements.designToggleBtn?.setAttribute('aria-expanded', 'false');
  elements.atsScorePill?.setAttribute('aria-expanded', 'false');
}

function openDrawer(drawerEl, toggleBtnEl) {
  const willOpen = !drawerEl?.classList.contains('is-open');
  closeAllDrawers();
  if (willOpen && drawerEl) {
    drawerEl.classList.add('is-open');
    elements.drawerBackdrop?.classList.add('is-active');
    toggleBtnEl?.setAttribute('aria-expanded', 'true');
  }
}

// Initialize Application
async function initApp() {
  // 1. Studio Theme Initialization
  const savedTheme = localStorage.getItem('resume_builder_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  if (elements.themeToggleBtn) {
    elements.themeToggleBtn.textContent = savedTheme === 'dark' ? '🌙' : '☀️';
    elements.themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('resume_builder_theme', next);
      elements.themeToggleBtn.textContent = next === 'dark' ? '🌙' : '☀️';
      showToast(`Switched to ${next === 'dark' ? 'Dark Studio' : 'Light Studio'} theme`);
    });
  }

  // 2. Initialize Sub-Systems
  initSplitter(elements.container, elements.editorPane, elements.splitDivider, elements.previewPane, store);
  const editor = initEditor(elements.textarea, elements.lineNumbers, elements.statusBar, store, showModal, showToast);
  toolbarManager = initToolbar(elements, store, showToast);
  initDesignPanel(elements.designDrawer, store, showToast);
  const workspaceDrawerManager = initWorkspaceDrawer(elements.workspaceDrawer, store, showToast);
  const atsPanelManager = initAtsPanel(elements.atsDrawer, store, showToast);
  initImportEngine(store, showModal);

  // Drawer Toggle Handlers
  elements.workspaceToggleBtn?.addEventListener('click', () => {
    openDrawer(elements.workspaceDrawer, elements.workspaceToggleBtn);
    if (elements.workspaceDrawer?.classList.contains('is-open')) {
      workspaceDrawerManager.refresh();
    }
  });

  elements.designToggleBtn?.addEventListener('click', () => {
    openDrawer(elements.designDrawer, elements.designToggleBtn);
  });

  elements.atsScorePill?.addEventListener('click', () => {
    openDrawer(elements.atsDrawer, elements.atsScorePill);
    if (elements.atsDrawer?.classList.contains('is-open')) {
      atsPanelManager.open();
    }
  });

  // Drawer Backdrop Click Dismisses Drawers
  elements.drawerBackdrop?.addEventListener('click', () => {
    closeAllDrawers();
  });

  // New Resume Wizard Button in Header
  elements.newResumeWizardBtn?.addEventListener('click', () => {
    openNewResumeModal(store, showToast);
  });

  // File Import input handler
  elements.fileImportInput?.addEventListener('change', async (e) => {
    if (e.target.files?.[0]) {
      await handleFileImport(e.target.files[0], store, showModal);
      e.target.value = '';
    }
  });

  // 3. Global Keyboard Shortcuts
  window.addEventListener('keydown', async (e) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

    if (e.key === 'Escape') {
      closeAllDrawers();
      if (elements.exportDropdownMenu) elements.exportDropdownMenu.style.display = 'none';
      if (elements.modalContainer) elements.modalContainer.style.display = 'none';
    } else if (isCmdOrCtrl && e.key.toLowerCase() === 's') {
      e.preventDefault();
      await store.manualSnapshot('Manual Checkpoint (Ctrl+S)');
      showToast('Version snapshot saved! (Ctrl+S)');
    } else if (isCmdOrCtrl && e.key.toLowerCase() === 'p') {
      e.preventDefault();
      elements.exportPdfBtn?.click();
    } else if (isCmdOrCtrl && e.key === '1') {
      e.preventDefault();
      store.setViewMode('split');
    } else if (isCmdOrCtrl && e.key === '2') {
      e.preventDefault();
      store.setViewMode('editor');
    } else if (isCmdOrCtrl && e.key === '3') {
      e.preventDefault();
      store.setViewMode('preview');
    } else if (e.altKey && e.key.toLowerCase() === 'n') {
      e.preventDefault();
      openNewResumeModal(store, showToast);
    }
  });

  // 4. Store Listeners
  store.subscribe('document:loaded', async () => {
    await renderCurrentDocument();
    if (elements.saveStatusIndicator) {
      elements.saveStatusIndicator.textContent = 'Saved';
      elements.saveStatusIndicator.classList.remove('is-saving');
    }
  });

  store.subscribe('markdown:change', async ({ rawMarkdown, source }) => {
    if (elements.saveStatusIndicator) {
      elements.saveStatusIndicator.textContent = 'Saving...';
      elements.saveStatusIndicator.classList.add('is-saving');
    }
    await renderCurrentDocument({ fromEditor: source === 'editor' });
  });

  store.subscribe('saved', () => {
    if (elements.saveStatusIndicator) {
      const now = new Date();
      elements.saveStatusIndicator.textContent = `Saved • ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      elements.saveStatusIndicator.classList.remove('is-saving');
    }
  });

  store.subscribe('config:change', async ({ config, syncToFrontmatter }) => {
    if (syncToFrontmatter) {
      const currentDoc = store.getDocument();
      if (currentDoc) {
        const syncedMarkdown = await syncConfigToMarkdown(currentDoc.rawMarkdown, config);
        if (syncedMarkdown !== currentDoc.rawMarkdown) {
          currentDoc.rawMarkdown = syncedMarkdown;
          editor.setValue(syncedMarkdown);
        }
      }
    }
    await renderCurrentDocument();
  });

  // 5. Load or Seed Active Resume
  try {
    const docIndex = await db.getDocumentIndex();
    const activeId = await db.getActiveDocumentId();

    let targetDoc = null;
    if (activeId) {
      targetDoc = await db.getDocument(activeId);
    }

    if (!targetDoc && docIndex.length > 0) {
      targetDoc = await db.getDocument(docIndex[0].id);
    }

    if (!targetDoc) {
      // Seed initial default document with Mid-Career SWE starter
      const initial = createInitialDocument({
        id: generateId(),
        title: 'Software Engineer Resume',
        rawMarkdown: STARTER_RESUMES['mid-swe'].rawMarkdown
      });
      await db.saveDocument(initial, true, 'manual', 'Initial Default Workspace Seed');
      await db.setActiveDocumentId(initial.id);
      targetDoc = initial;
    }

    store.setDocument(targetDoc);
  } catch (err) {
    console.error('Error initializing workspace DB:', err);
    const fallback = createInitialDocument({
      title: 'Software Engineer Resume',
      rawMarkdown: STARTER_RESUMES['mid-swe'].rawMarkdown
    });
    store.setDocument(fallback);
  }

  // 6. Register Service Worker for Offline PWA
  if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('./sw.js').then((reg) => {
      console.log('ResumeBuilder Service Worker active (scope:', reg.scope, ')');
    }).catch((err) => {
      console.warn('Service Worker registration skipped or failed:', err);
    });
  }
}

// Launch on DOM Ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
