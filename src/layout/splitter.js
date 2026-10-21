/**
 * Draggable Split-Pane Divider and Tri-Mode Layout Manager
 */

export function initSplitter(containerEl, editorEl, dividerEl, previewEl, store) {
  if (!containerEl || !editorEl || !dividerEl || !previewEl) return;

  const STORAGE_KEY = 'resume_builder_split_pct';
  let isDragging = false;

  // Restore saved width percentage
  const savedPct = localStorage.getItem(STORAGE_KEY);
  if (savedPct) {
    const pct = parseFloat(savedPct);
    if (!isNaN(pct) && pct >= 20 && pct <= 80) {
      applySplit(pct);
    }
  }

  function applySplit(pct) {
    editorEl.style.width = `${pct}%`;
    previewEl.style.width = `${100 - pct}%`;
  }

  dividerEl.addEventListener('mousedown', (e) => {
    isDragging = true;
    document.body.classList.add('is-resizing');
    e.preventDefault();
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const rect = containerEl.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const pct = (offsetX / rect.width) * 100;
    const clamped = Math.max(20, Math.min(80, pct));
    applySplit(clamped);
    localStorage.setItem(STORAGE_KEY, clamped.toFixed(1));
  });

  window.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      document.body.classList.remove('is-resizing');
    }
  });

  // Handle touch for tablets / touch screens
  dividerEl.addEventListener('touchstart', (e) => {
    isDragging = true;
    document.body.classList.add('is-resizing');
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!isDragging || !e.touches[0]) return;
    const rect = containerEl.getBoundingClientRect();
    const offsetX = e.touches[0].clientX - rect.left;
    const pct = (offsetX / rect.width) * 100;
    const clamped = Math.max(20, Math.min(80, pct));
    applySplit(clamped);
  }, { passive: true });

  window.addEventListener('touchend', () => {
    if (isDragging) {
      isDragging = false;
      document.body.classList.remove('is-resizing');
    }
  });

  // Listen to Tri-Mode changes from store
  store.subscribe('viewMode:change', (mode) => {
    containerEl.classList.remove('mode-split', 'mode-editor', 'mode-preview');
    containerEl.classList.add(`mode-${mode}`);

    if (mode === 'split') {
      const pct = parseFloat(localStorage.getItem(STORAGE_KEY)) || 50;
      applySplit(pct);
      dividerEl.style.display = 'block';
      editorEl.style.display = 'flex';
      previewEl.style.display = 'flex';
    } else if (mode === 'editor') {
      editorEl.style.width = '100%';
      previewEl.style.display = 'none';
      dividerEl.style.display = 'none';
      editorEl.style.display = 'flex';
    } else if (mode === 'preview') {
      previewEl.style.width = '100%';
      editorEl.style.display = 'none';
      dividerEl.style.display = 'none';
      previewEl.style.display = 'flex';
    }
  });
}
