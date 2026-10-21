/**
 * Top Application Toolbar & Preview Sub-Toolbar Manager
 * Manages Title, View Modes, Paper/Pagination Controls, Fit-to-Page with 1-click Undo,
 * Zoom Controls, and the Unified Export Hub (PDF, Interactive HTML Website, DOCX, JSON, MD).
 */
import { TEMPLATES } from '../templates/registry.js';
import { triggerPrintPdf } from '../io/pdf-export.js';
import { exportToDocx } from '../io/docx-export.js';
import { astToJsonResume } from '../io/json-resume.js';
import { fitToPage, undoFitToPage } from '../layout/fit-to-page.js';
import { exportInteractiveHtml, previewInteractiveHtml } from '../io/html-export.js';
import { PAPER_DIMENSIONS } from '../state/schema.js';

export function initToolbar(elements, store, showToastCallback) {
  const {
    titleInput,
    modeSplitBtn,
    modeEditorBtn,
    modePreviewBtn,
    templateSelect,
    paperSelect,
    targetPagesSelect,
    fitPageBtn,
    undoFitBtn,
    exportPdfBtn,
    exportMenuToggleBtn,
    exportDropdownMenu,
    exportPdfMenuBtn,
    exportHtmlBtn,
    previewHtmlBtn,
    exportDocxBtn,
    exportJsonBtn,
    exportMdBtn,
    atsScorePill,
    zoomInBtn,
    zoomOutBtn,
    zoomResetBtn,
    zoomFitBtn,
    zoomLevelSpan,
    previewScrollViewport,
    quickSaveBtn,
    pageNavGroup,
    pagePrevBtn,
    pageNextBtn,
    pageIndicatorText
  } = elements;

  // 1. Populate templates in dropdown
  if (templateSelect) {
    templateSelect.innerHTML = TEMPLATES.map(
      t => `<option value="${t.id}">${t.name} (${t.category})</option>`
    ).join('');

    templateSelect.addEventListener('change', () => {
      store.updateConfig({ template: templateSelect.value });
      showToastCallback(`Switched template to ${templateSelect.options[templateSelect.selectedIndex].text}`);
    });
  }

  // 2. Paper selection (Letter / A4)
  if (paperSelect) {
    paperSelect.addEventListener('change', () => {
      store.updateConfig({ paper: paperSelect.value });
      showToastCallback(`Paper size set to ${paperSelect.value.toUpperCase()}`);
    });
  }

  // 3. Target pages (1 / 2)
  if (targetPagesSelect) {
    targetPagesSelect.addEventListener('change', () => {
      store.updateConfig({ targetPages: parseInt(targetPagesSelect.value, 10) || 1 });
    });
  }

  // 4. Title input
  if (titleInput) {
    titleInput.addEventListener('input', () => {
      store.updateTitle(titleInput.value);
    });
  }

  // Quick Save Button
  if (quickSaveBtn) {
    quickSaveBtn.addEventListener('click', async () => {
      await store.flushPendingSave();
      await store.manualSnapshot('Manual Checkpoint (Saved)');
      showToastCallback('Saved changes to browser storage! 💾');
    });
  }

  // Multi-page navigation state
  let currentPageIndex = 1;
  let totalPageCount = 1;

  function scrollToPage(pageIdx) {
    if (!previewScrollViewport) return;
    const paperKey = store.getConfig().paper === 'a4' ? 'a4' : 'letter';
    const pageHeight = PAPER_DIMENSIONS[paperKey].heightPx;
    const targetScrollTop = (pageIdx - 1) * (pageHeight + 28);
    previewScrollViewport.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
  }

  function updatePageNav(current, total) {
    currentPageIndex = Math.max(1, Math.min(current, total));
    totalPageCount = Math.max(1, total);
    if (pageNavGroup) {
      pageNavGroup.style.display = totalPageCount > 1 ? 'inline-flex' : 'none';
    }
    if (pageIndicatorText) {
      pageIndicatorText.textContent = `${currentPageIndex} / ${totalPageCount}`;
    }
    if (pagePrevBtn) pagePrevBtn.disabled = currentPageIndex <= 1;
    if (pageNextBtn) pageNextBtn.disabled = currentPageIndex >= totalPageCount;
  }

  if (pagePrevBtn) {
    pagePrevBtn.addEventListener('click', () => {
      if (currentPageIndex > 1) {
        scrollToPage(currentPageIndex - 1);
      }
    });
  }

  if (pageNextBtn) {
    pageNextBtn.addEventListener('click', () => {
      if (currentPageIndex < totalPageCount) {
        scrollToPage(currentPageIndex + 1);
      }
    });
  }

  if (previewScrollViewport) {
    previewScrollViewport.addEventListener('scroll', () => {
      if (totalPageCount <= 1) return;
      const paperKey = store.getConfig().paper === 'a4' ? 'a4' : 'letter';
      const pageTotalHeight = PAPER_DIMENSIONS[paperKey].heightPx + 28;
      const visiblePage = Math.min(
        totalPageCount,
        Math.max(1, Math.floor((previewScrollViewport.scrollTop + pageTotalHeight * 0.35) / pageTotalHeight) + 1)
      );
      if (visiblePage !== currentPageIndex) {
        currentPageIndex = visiblePage;
        if (pageIndicatorText) {
          pageIndicatorText.textContent = `${currentPageIndex} / ${totalPageCount}`;
        }
        if (pagePrevBtn) pagePrevBtn.disabled = currentPageIndex <= 1;
        if (pageNextBtn) pageNextBtn.disabled = currentPageIndex >= totalPageCount;
      }
    }, { passive: true });
  }

  // 5. Tri-Mode buttons
  function updateModeButtons(mode) {
    [modeSplitBtn, modeEditorBtn, modePreviewBtn].forEach(btn => {
      if (btn) {
        btn.classList.remove('is-active');
        btn.setAttribute('aria-pressed', 'false');
      }
    });
    if (mode === 'split' && modeSplitBtn) {
      modeSplitBtn.classList.add('is-active');
      modeSplitBtn.setAttribute('aria-pressed', 'true');
    }
    if (mode === 'editor' && modeEditorBtn) {
      modeEditorBtn.classList.add('is-active');
      modeEditorBtn.setAttribute('aria-pressed', 'true');
    }
    if (mode === 'preview' && modePreviewBtn) {
      modePreviewBtn.classList.add('is-active');
      modePreviewBtn.setAttribute('aria-pressed', 'true');
    }
  }

  if (modeSplitBtn) modeSplitBtn.addEventListener('click', () => store.setViewMode('split'));
  if (modeEditorBtn) modeEditorBtn.addEventListener('click', () => store.setViewMode('editor'));
  if (modePreviewBtn) modePreviewBtn.addEventListener('click', () => store.setViewMode('preview'));

  // 6. Fit to Page & 1-Click Undo
  if (fitPageBtn) {
    fitPageBtn.addEventListener('click', () => {
      const sheet = document.getElementById('resume-sheet');
      const cfg = store.getConfig();
      const targetP = cfg.targetPages || 1;
      const res = fitToPage(targetP, cfg, sheet, (newCfg) => {
        const root = document.getElementById('resume-preview-root');
        if (root) {
          root.style.setProperty('--resume-margin', `${newCfg.margins}in`);
          root.style.setProperty('--resume-font-size', `${newCfg.fontSize}pt`);
          root.style.setProperty('--resume-line-height', `${newCfg.lineHeight}`);
          root.style.setProperty('--resume-section-gap', `${newCfg.sectionSpacing}px`);
          root.style.setProperty('--resume-item-gap', `${newCfg.itemSpacing}px`);
          root.style.setProperty('--resume-bullet-gap', `${newCfg.bulletSpacing}px`);
        }
      });

      if (res) {
        store.updateConfig(res.config);
        showToastCallback(res.summary);
        if (undoFitBtn) {
          undoFitBtn.style.display = 'inline-flex';
        }
      }
    });
  }

  if (undoFitBtn) {
    undoFitBtn.addEventListener('click', () => {
      const restored = undoFitToPage();
      if (restored) {
        store.updateConfig(restored);
        undoFitBtn.style.display = 'none';
        showToastCallback('Reverted Fit-to-Page adjustments');
      }
    });
  }

  // 7. Zoom controls
  let currentZoom = 1.0;
  function applyZoom(z) {
    currentZoom = Math.max(0.4, Math.min(1.8, Number(z.toFixed(2))));
    const root = document.getElementById('resume-preview-root');
    if (root) {
      root.style.transform = `scale(${currentZoom})`;
    }
    if (zoomLevelSpan) {
      zoomLevelSpan.textContent = `${Math.round(currentZoom * 100)}%`;
    }
  }

  if (zoomInBtn) zoomInBtn.addEventListener('click', () => applyZoom(currentZoom + 0.1));
  if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => applyZoom(currentZoom - 0.1));
  if (zoomResetBtn) zoomResetBtn.addEventListener('click', () => applyZoom(1.0));

  if (zoomFitBtn) {
    zoomFitBtn.addEventListener('click', () => {
      const viewportWidth = previewScrollViewport ? previewScrollViewport.clientWidth - 48 : 800;
      const paperKey = store.getConfig().paper === 'a4' ? 'a4' : 'letter';
      const paperWidth = PAPER_DIMENSIONS[paperKey].widthPx;
      const fitScale = Math.min(1.25, Math.max(0.45, viewportWidth / paperWidth));
      applyZoom(fitScale);
    });
  }

  // 8. Export Dropdown Menu Toggle
  function closeExportMenu() {
    if (exportDropdownMenu) {
      exportDropdownMenu.style.display = 'none';
      exportMenuToggleBtn?.setAttribute('aria-expanded', 'false');
    }
  }

  if (exportMenuToggleBtn) {
    exportMenuToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = exportDropdownMenu.style.display === 'block';
      if (isOpen) {
        closeExportMenu();
      } else {
        exportDropdownMenu.style.display = 'block';
        exportMenuToggleBtn.setAttribute('aria-expanded', 'true');
      }
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.export-menu-container')) {
        closeExportMenu();
      }
    });
  }

  // Export PDF (Primary Button & Menu Item)
  const triggerPdf = () => {
    closeExportMenu();
    triggerPrintPdf(store.getConfig());
  };
  if (exportPdfBtn) exportPdfBtn.addEventListener('click', triggerPdf);
  if (exportPdfMenuBtn) exportPdfMenuBtn.addEventListener('click', triggerPdf);

  // Export Interactive HTML Website
  if (exportHtmlBtn) {
    exportHtmlBtn.addEventListener('click', () => {
      closeExportMenu();
      const doc = store.getDocument();
      const ast = store.parsedResult?.ast;
      const meta = store.parsedResult?.metadata;
      const cfg = store.getConfig();
      const rawHtml = store.parsedResult?.html || '';

      if (!ast) {
        showToastCallback('Document parsing not complete', 'error');
        return;
      }

      const filename = `${(doc?.title || 'resume').replace(/[^a-zA-Z0-9_-]/g, '_')}_website.html`;
      exportInteractiveHtml(ast, meta, cfg, rawHtml, filename);
      showToastCallback('Exported Interactive HTML Portfolio file!');
    });
  }

  // Preview Interactive HTML Website in New Tab
  if (previewHtmlBtn) {
    previewHtmlBtn.addEventListener('click', () => {
      closeExportMenu();
      const ast = store.parsedResult?.ast;
      const meta = store.parsedResult?.metadata;
      const cfg = store.getConfig();
      const rawHtml = store.parsedResult?.html || '';

      if (!ast) {
        showToastCallback('Document parsing not complete', 'error');
        return;
      }

      previewInteractiveHtml(ast, meta, cfg, rawHtml);
      showToastCallback('Opened Interactive Portfolio preview in new tab!');
    });
  }

  // Export DOCX
  if (exportDocxBtn) {
    exportDocxBtn.addEventListener('click', async () => {
      closeExportMenu();
      const doc = store.getDocument();
      const ast = store.parsedResult?.ast;
      const cfg = store.getConfig();
      if (!ast) {
        showToastCallback('Document AST not ready for export', 'error');
        return;
      }
      showToastCallback('Compiling Word document (.docx)...');
      try {
        const filename = `${doc.title.replace(/[^a-zA-Z0-9_-]/g, '_') || 'resume'}.docx`;
        await exportToDocx(ast, cfg, filename);
        showToastCallback('Word document exported successfully!');
      } catch (e) {
        console.error(e);
        showToastCallback('Export error: ' + e.message, 'error');
      }
    });
  }

  // Export JSON Resume
  if (exportJsonBtn) {
    exportJsonBtn.addEventListener('click', () => {
      closeExportMenu();
      const ast = store.parsedResult?.ast;
      const meta = store.parsedResult?.metadata;
      if (!ast) return;
      const jsonRes = astToJsonResume(ast, meta);
      const blob = new Blob([JSON.stringify(jsonRes, null, 2)], { type: 'application/json' });
      downloadBlob(blob, `${(store.getDocument()?.title || 'resume').replace(/\s+/g, '_')}.json`);
      showToastCallback('JSON Resume exported!');
    });
  }

  // Export Markdown
  if (exportMdBtn) {
    exportMdBtn.addEventListener('click', () => {
      closeExportMenu();
      const raw = store.getDocument()?.rawMarkdown || '';
      const blob = new Blob([raw], { type: 'text/markdown' });
      downloadBlob(blob, `${(store.getDocument()?.title || 'resume').replace(/\s+/g, '_')}.md`);
      showToastCallback('Markdown file exported!');
    });
  }

  // Subscriptions to store
  store.subscribe('document:loaded', (doc) => {
    if (doc) {
      if (titleInput) titleInput.value = doc.title || '';
      if (templateSelect) templateSelect.value = doc.config?.template || 'modern-minimal';
      if (paperSelect) paperSelect.value = doc.config?.paper || 'letter';
      if (targetPagesSelect) targetPagesSelect.value = String(doc.config?.targetPages || 1);
    }
  });

  store.subscribe('config:change', ({ config }) => {
    if (templateSelect) templateSelect.value = config.template;
    if (paperSelect) paperSelect.value = config.paper;
    if (targetPagesSelect) targetPagesSelect.value = String(config.targetPages || 1);
  });

  store.subscribe('viewMode:change', (mode) => {
    updateModeButtons(mode);
  });

  store.subscribe('parsed:update', (result) => {
    if (result && result.atsReport && atsScorePill) {
      const score = result.atsReport.score;
      atsScorePill.textContent = `ATS: ${score}%`;
      atsScorePill.className = `status-pill pill-${result.atsReport.grade.label.toLowerCase().replace(/\s+/g, '-')}`;
    }
  });

  return {
    updatePageNav,
    applyZoom
  };
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
