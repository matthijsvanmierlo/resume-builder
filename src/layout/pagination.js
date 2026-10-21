/**
 * Exact 1:1 Paper Calibration, Visual Page Boundary Tracker & Multi-Page Margin Parity Engine
 */
import { PAPER_DIMENSIONS } from '../state/schema.js';

export const PAGE_GAP_PX = 28; // Visual gap between pages in preview viewport

export function calculatePageMetrics(sheetElement, config) {
  if (!sheetElement) return null;

  const paperKey = config.paper === 'a4' ? 'a4' : 'letter';
  const paperDim = PAPER_DIMENSIONS[paperKey];
  const pageHeightPx = paperDim.heightPx;
  const targetPages = Number(config.targetPages) || 1;
  const marginPx = (Number(config.margins) || 0.5) * 96;
  const usableHeightPerPage = pageHeightPx - (2 * marginPx);

  // Check if sheet has multi-page spacers already rendered
  const spacers = typeof sheetElement.querySelectorAll === 'function'
    ? sheetElement.querySelectorAll('.page-break-spacer')
    : [];
  const renderedPages = spacers.length + 1;

  // Total rendered scroll height of sheet
  const totalHeightPx = sheetElement.scrollHeight || pageHeightPx;

  // Usable content calculation:
  // If spacers exist, sheet height includes (renderedPages - 1) * PAGE_GAP_PX
  const effectiveContentHeight = spacers.length > 0
    ? totalHeightPx - (spacers.length * PAGE_GAP_PX)
    : totalHeightPx;

  // Compute exact pages
  let exactPages = renderedPages > 1
    ? renderedPages
    : Number((totalHeightPx / pageHeightPx).toFixed(2));

  // Determine capacity and overflow
  const targetCapacityPx = targetPages * pageHeightPx;
  const isOverflowing = spacers.length > 0
    ? renderedPages > targetPages
    : totalHeightPx > (targetCapacityPx + 1);

  const overflowPx = Math.max(0, totalHeightPx - targetCapacityPx);
  const overflowInches = Number((overflowPx / 96).toFixed(2));

  // Percentage filled of current target
  const percentFull = Math.min(100, Math.round((totalHeightPx / targetCapacityPx) * 100));

  let statusText = '';
  let statusType = 'normal'; // 'good' | 'warning' | 'danger'

  if (isOverflowing) {
    statusType = exactPages > targetPages + 0.25 ? 'danger' : 'warning';
    statusText = `${exactPages} Pages — Overflow by ${overflowInches}in (${exactPages > 1 ? 'Exceeds ' + targetPages + ' Page' + (targetPages > 1 ? 's' : '') : 'Overflow'})`;
  } else {
    statusType = 'good';
    statusText = `${targetPages === 1 ? '1.0' : exactPages} / ${targetPages} Page${targetPages > 1 ? 's' : ''} (${percentFull}% full)`;
  }

  return {
    paperKey,
    pageHeightPx,
    totalHeightPx,
    targetPages,
    renderedPages,
    exactPages: Number(exactPages),
    isOverflowing,
    overflowPx,
    overflowInches,
    percentFull,
    statusText,
    statusType
  };
}

/**
 * Paginates the live preview sheet so that every page has uniform top, bottom, left, and right margins.
 * Inserts margin-aware .page-break-spacer elements to bridge content cleanly across page boundaries.
 */
export function paginatePreviewSheet(sheetElement, wrapperElement, config) {
  if (!sheetElement || typeof document === 'undefined') return;

  // 1. Remove previous page-break spacers
  const existingSpacers = sheetElement.querySelectorAll('.page-break-spacer');
  existingSpacers.forEach(el => el.remove());

  // Reset any previous minHeight override to read natural layout
  sheetElement.style.minHeight = '';

  const paperKey = config.paper === 'a4' ? 'a4' : 'letter';
  const pageHeightPx = PAPER_DIMENSIONS[paperKey].heightPx;
  const marginPx = (Number(config.margins) || 0.5) * 96;

  // Helper to get element top relative to sheetElement
  function getRelativeTop(el) {
    const elRect = el.getBoundingClientRect();
    const sheetRect = sheetElement.getBoundingClientRect();
    return elRect.top - sheetRect.top;
  }

  // Find paginatable containers (standard body or split columns)
  const splitMain = sheetElement.querySelector('.resume-split-main');
  const splitSidebar = sheetElement.querySelector('.resume-split-sidebar');

  const containers = splitMain && splitSidebar
    ? [splitSidebar, splitMain]
    : [sheetElement.querySelector('.resume-body') || sheetElement];

  let maxPageReached = 1;

  containers.forEach(container => {
    let currentPage = 1;
    const blocks = Array.from(container.children);

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];

      // Skip non-element or spacers
      if (block.nodeType !== 1 || block.classList.contains('page-break-spacer')) continue;

      const blockTop = getRelativeTop(block);
      const blockHeight = block.offsetHeight;
      const blockBottom = blockTop + blockHeight;

      // Page boundary definitions for currentPage:
      // Page 1 starts at 0, Usable Content Top = marginPx, Content Bottom = pageHeightPx - marginPx
      // Page k starts at (k - 1) * (pageHeightPx + PAGE_GAP_PX)
      const pageTop = (currentPage - 1) * (pageHeightPx + PAGE_GAP_PX);
      const usableContentBottom = pageTop + pageHeightPx - marginPx;
      const nextPageContentTop = currentPage * (pageHeightPx + PAGE_GAP_PX) + marginPx;

      const isManualBreak = block.classList.contains('resume-manual-page-break');
      const isOversized = blockBottom > usableContentBottom + 1;

      if (isManualBreak || (isOversized && blockHeight < (pageHeightPx - 2 * marginPx))) {
        // Determine break target element
        let breakTarget = block;

        // If block is an item and preceding element is a section title near the bottom,
        // push section title with the item to avoid orphaned headings (break-after: avoid)
        const prev = block.previousElementSibling;
        if (
          prev &&
          prev.classList.contains('resume-section-title') &&
          getRelativeTop(prev) > (usableContentBottom - 60)
        ) {
          breakTarget = prev;
        }

        const targetTop = getRelativeTop(breakTarget);
        const spacerHeight = Math.max(1, Math.round(nextPageContentTop - targetTop));

        const spacer = document.createElement('div');
        spacer.className = 'page-break-spacer';
        spacer.style.height = `${spacerHeight}px`;
        spacer.setAttribute('data-from-page', String(currentPage));
        spacer.setAttribute('data-to-page', String(currentPage + 1));
        spacer.setAttribute('aria-hidden', 'true');

        breakTarget.parentNode.insertBefore(spacer, breakTarget);

        currentPage++;
        if (currentPage > maxPageReached) {
          maxPageReached = currentPage;
        }
      }
    }
  });

  // Ensure total sheet height covers all rendered pages completely
  const totalSheetHeight = (maxPageReached * pageHeightPx) + ((maxPageReached - 1) * PAGE_GAP_PX);
  sheetElement.style.minHeight = `${totalSheetHeight}px`;

  // Render visual page boundary lines & badges
  renderPageBreakOverlays(wrapperElement, sheetElement, config, maxPageReached);
}

/**
 * Updates or renders visual divider bands at each physical page boundary
 */
export function renderPageBreakOverlays(wrapperElement, sheetElement, config, pageCount = null) {
  if (!wrapperElement || !sheetElement || typeof document === 'undefined') return;

  // Remove existing overlays
  const existing = wrapperElement.querySelectorAll('.page-break-overlay');
  existing.forEach(el => el.remove());

  const paperKey = config.paper === 'a4' ? 'a4' : 'letter';
  const pageHeightPx = PAPER_DIMENSIONS[paperKey].heightPx;
  const numPages = pageCount || Math.max(1, Math.ceil(sheetElement.scrollHeight / pageHeightPx));

  if (numPages <= 1) return;

  for (let i = 1; i < numPages; i++) {
    const topPx = (i * pageHeightPx) + ((i - 1) * PAGE_GAP_PX);
    const divider = document.createElement('div');
    divider.className = 'page-break-overlay';
    divider.style.top = `${topPx}px`;
    divider.style.height = `${PAGE_GAP_PX}px`;

    const label = `Page ${i} Ends • Page ${i + 1} Starts (${config.paper.toUpperCase()} — ${config.margins}in Margins)`;
    divider.setAttribute('data-label', label);
    wrapperElement.appendChild(divider);
  }
}
