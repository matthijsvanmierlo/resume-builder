/**
 * PDF Export & Paged.js Print Engine Orchestrator
 */
import { ensurePagedJs } from '../vendor/loader.js';

let dynamicStyleElement = null;

export function syncDynamicPageStyle(paper = 'letter', margins = 0.5) {
  if (typeof document === 'undefined') return;

  if (!dynamicStyleElement) {
    dynamicStyleElement = document.getElementById('dynamic-page-style');
    if (!dynamicStyleElement) {
      dynamicStyleElement = document.createElement('style');
      dynamicStyleElement.id = 'dynamic-page-style';
      document.head.appendChild(dynamicStyleElement);
    }
  }

  const paperSize = paper === 'a4' ? 'A4 portrait' : 'letter portrait';
  const safeMargin = Math.max(0.25, Math.min(1.2, parseFloat(margins) || 0.5));
  dynamicStyleElement.textContent = `
    @page {
      size: ${paperSize};
      margin: ${safeMargin}in;
    }
  `;
}

export function triggerPrintPdf(config) {
  syncDynamicPageStyle(config.paper, config.margins);
  // Give style 60ms to settle in layout engine before triggering system print dialog
  setTimeout(() => {
    window.print();
  }, 60);
}

export async function runPagedJsPolyfill(contentHtml, containerEl) {
  try {
    const Paged = await ensurePagedJs();
    if (!Paged) {
      throw new Error('Paged.js polyfill unavailable');
    }
    const previewer = new Paged.Previewer();
    containerEl.innerHTML = '';
    await previewer.preview(contentHtml, [], containerEl);
    return true;
  } catch (e) {
    console.error('Paged.js preview failed:', e);
    return false;
  }
}
