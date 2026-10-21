/**
 * Deterministic "Fit-to-Page" Auto-Scaler
 * Solves spacing, margins, line-height, and font-size to fit exactly into N pages.
 */
import { PAPER_DIMENSIONS } from '../state/schema.js';
import { calculatePageMetrics } from './pagination.js';

let previousConfigBackup = null;

export function fitToPage(targetPages = 1, currentConfig, sheetElement, applyStylesCallback) {
  if (!sheetElement || !currentConfig) return null;

  // Save backup for undo
  previousConfigBackup = { ...currentConfig };

  const paperKey = currentConfig.paper === 'a4' ? 'a4' : 'letter';
  const pageHeightPx = PAPER_DIMENSIONS[paperKey].heightPx;
  const targetMaxHeightPx = targetPages * pageHeightPx;

  // Working copy of config
  const working = {
    ...currentConfig,
    targetPages
  };

  function testFit() {
    applyStylesCallback(working);
    return sheetElement.scrollHeight <= targetMaxHeightPx;
  }

  // Check if already fits
  if (testFit()) {
    return {
      success: true,
      alreadyFit: true,
      config: working,
      summary: `Already fits within ${targetPages} page(s).`
    };
  }

  // Iterative multi-pass optimization
  let iterations = 0;
  const maxIterations = 20;

  while (iterations < maxIterations && !testFit()) {
    iterations++;

    // Priority 1: Micro-gaps (sectionSpacing, itemSpacing, bulletSpacing)
    let reducedGaps = false;
    if (working.sectionSpacing > 8) {
      working.sectionSpacing = Math.max(8, working.sectionSpacing - 2);
      reducedGaps = true;
    }
    if (working.itemSpacing > 3) {
      working.itemSpacing = Math.max(3, working.itemSpacing - 1);
      reducedGaps = true;
    }
    if (working.bulletSpacing > 1) {
      working.bulletSpacing = Math.max(1, working.bulletSpacing - 1);
      reducedGaps = true;
    }
    if (reducedGaps && testFit()) break;

    // Priority 2: Line height (down to 1.16)
    if (working.lineHeight > 1.16) {
      working.lineHeight = Number(Math.max(1.16, working.lineHeight - 0.03).toFixed(2));
      if (testFit()) break;
    }

    // Priority 3: Margins (down to 0.38in)
    if (working.margins > 0.38) {
      working.margins = Number(Math.max(0.38, working.margins - 0.05).toFixed(2));
      if (testFit()) break;
    }

    // Priority 4: Font size (down to 9.0pt)
    if (working.fontSize > 9.0) {
      working.fontSize = Number(Math.max(9.0, working.fontSize - 0.25).toFixed(2));
      if (testFit()) break;
    }
  }

  const success = testFit();
  const summary = success
    ? `Fitted to ${targetPages} Page(s): Margins ${working.margins}in, Font ${working.fontSize}pt, Line-height ${working.lineHeight}, Section gap ${working.sectionSpacing}px.`
    : `Could not fully fit to ${targetPages} Page(s) without dropping below ATS legibility floor (9.0pt). Adjusted as close as possible.`;

  return {
    success,
    alreadyFit: false,
    config: working,
    summary,
    previousConfig: previousConfigBackup
  };
}

export function undoFitToPage() {
  const backup = previousConfigBackup;
  previousConfigBackup = null;
  return backup;
}
