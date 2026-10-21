/**
 * Markdown & YAML Editor with Authoring Toolbar, Snippets, Line Operations,
 * Section Outline Jumper, and Profile Metadata Form Modal.
 */
import { syncMetadataToMarkdown } from '../parser/frontmatter.js';

const SNIPPETS = {
  role: `\n### Role Title | Company Name | City, ST | 2023 - Present\n- Spearheaded key initiative resulting in measurable impact (e.g., +25% efficiency).\n- Architected and deployed scalable solution using modern technologies.\n`,
  education: `\n### B.S. in Field of Study | University Name | City, ST | 2020 - 2024\n- GPA: 3.8 / 4.0. Relevant coursework & leadership honors.\n`,
  skills: `\n::skills Category Name: [Skill 1, Skill 2, Skill 3, Skill 4]\n`,
  project: `\n### Project Title | Tech Stack / Role | 2024\n- Built and launched project solving specific problem with measurable results.\n`,
  columns: `\n::: columns 2\nLeft column content\n|||\nRight column content\n:::\n`,
  pagebreak: `\n::: page-break\n`
};

export function initEditor(textareaEl, lineNumbersEl, statusEl, store, showModalCallback, showToastCallback) {
  if (!textareaEl) return;

  function updateLineNumbers() {
    if (!lineNumbersEl) return;
    const lines = textareaEl.value.split('\n').length;
    let html = '';
    for (let i = 1; i <= lines; i++) {
      html += `<div>${i}</div>`;
    }
    lineNumbersEl.innerHTML = html;
  }

  function updateStatus(frontmatterError = null) {
    if (!statusEl) return;
    const text = textareaEl.value;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    const lines = text.split('\n').length;
    const readingTimeMin = Math.max(1, Math.ceil(words / 200));

    let errorBadge = '';
    if (frontmatterError) {
      errorBadge = `<span class="editor-syntax-error" title="${frontmatterError.message}">⚠️ YAML Error: Line ${frontmatterError.line || '?'}</span>`;
    }

    statusEl.innerHTML = `
      <div class="editor-stats">
        <span>${lines} Lines</span>
        <span>•</span>
        <span>${words} Words</span>
        <span>•</span>
        <span>${chars} Chars</span>
        <span>•</span>
        <span>~${readingTimeMin} min read</span>
        ${errorBadge}
      </div>
    `;
  }

  function insertTextAtCursor(snippet) {
    const start = textareaEl.selectionStart;
    const end = textareaEl.selectionEnd;
    const val = textareaEl.value;
    textareaEl.value = val.substring(0, start) + snippet + val.substring(end);
    textareaEl.selectionStart = textareaEl.selectionEnd = start + snippet.length;
    textareaEl.focus();
    updateLineNumbers();
    updateStatus();
    store.updateMarkdown(textareaEl.value, { source: 'editor' });
  }

  // Sync editor on typing
  textareaEl.addEventListener('input', () => {
    updateLineNumbers();
    updateStatus();
    const doc = store.getDocument();
    if (doc?.id) {
      store.saveEditorState(doc.id, {
        scrollTop: textareaEl.scrollTop,
        selectionStart: textareaEl.selectionStart,
        selectionEnd: textareaEl.selectionEnd
      });
    }
    store.updateMarkdown(textareaEl.value, { source: 'editor' });
  });

  // Sync scroll between textarea and line numbers
  textareaEl.addEventListener('scroll', () => {
    if (lineNumbersEl) {
      lineNumbersEl.scrollTop = textareaEl.scrollTop;
    }
    const doc = store.getDocument();
    if (doc?.id) {
      store.saveEditorState(doc.id, {
        scrollTop: textareaEl.scrollTop,
        selectionStart: textareaEl.selectionStart,
        selectionEnd: textareaEl.selectionEnd
      });
    }
  });

  // Editor Authoring Bar Buttons
  const editProfileBtn = document.getElementById('btn-edit-profile');
  editProfileBtn?.addEventListener('click', () => {
    openProfileEditorModal(store, textareaEl, updateLineNumbers, updateStatus, showModalCallback, showToastCallback);
  });

  document.querySelectorAll('[data-snippet]').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-snippet');
      if (SNIPPETS[type]) {
        insertTextAtCursor(SNIPPETS[type]);
      }
    });
  });

  // Format buttons
  document.getElementById('btn-fmt-bold')?.addEventListener('click', () => {
    wrapSelection(textareaEl, '**', '**');
    store.updateMarkdown(textareaEl.value, { source: 'editor' });
  });

  document.getElementById('btn-fmt-italic')?.addEventListener('click', () => {
    wrapSelection(textareaEl, '*', '*');
    store.updateMarkdown(textareaEl.value, { source: 'editor' });
  });

  document.getElementById('btn-fmt-link')?.addEventListener('click', () => {
    const sel = textareaEl.value.substring(textareaEl.selectionStart, textareaEl.selectionEnd) || 'link text';
    insertTextAtCursor(`[${sel}](https://example.com)`);
  });

  document.getElementById('btn-fmt-bullet')?.addEventListener('click', () => {
    insertTextAtCursor('\n- ');
  });

  // Section Outline Jumper
  const sectionJumpSelect = document.getElementById('editor-section-jump');
  if (sectionJumpSelect) {
    sectionJumpSelect.addEventListener('change', () => {
      const slug = sectionJumpSelect.value;
      if (!slug) return;

      // 1. Scroll editor to section line
      const lines = textareaEl.value.split('\n');
      let targetLine = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(`## ${slug.replace(/-/g, ' ')}`) || lines[i].toLowerCase().includes(slug)) {
          targetLine = i;
          break;
        }
      }
      const lineHeightPx = 20;
      textareaEl.scrollTop = Math.max(0, targetLine * lineHeightPx - 40);

      // 2. Scroll preview pane to section
      const previewSection = document.querySelector(`.resume-sheet [data-section="${slug}"]`);
      if (previewSection) {
        previewSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      sectionJumpSelect.value = '';
    });
  }

  // Keyboard Shortcuts
  textareaEl.addEventListener('keydown', (e) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

    // Tab key indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textareaEl.selectionStart;
      const end = textareaEl.selectionEnd;
      const value = textareaEl.value;

      if (e.shiftKey) {
        // Outdent
        if (value.substring(start - 2, start) === '  ') {
          textareaEl.value = value.substring(0, start - 2) + value.substring(start);
          textareaEl.selectionStart = textareaEl.selectionEnd = start - 2;
        }
      } else {
        // Indent 2 spaces
        textareaEl.value = value.substring(0, start) + '  ' + value.substring(end);
        textareaEl.selectionStart = textareaEl.selectionEnd = start + 2;
      }
      updateLineNumbers();
      store.updateMarkdown(textareaEl.value, { source: 'editor' });
      return;
    }

    // Alt + Up / Alt + Down (Move line up or down)
    if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      moveLine(textareaEl, e.key === 'ArrowUp' ? -1 : 1);
      updateLineNumbers();
      store.updateMarkdown(textareaEl.value, { source: 'editor' });
      return;
    }

    // Ctrl/Cmd + B (Bold)
    if (isCmdOrCtrl && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      wrapSelection(textareaEl, '**', '**');
      store.updateMarkdown(textareaEl.value, { source: 'editor' });
      return;
    }

    // Ctrl/Cmd + I (Italic)
    if (isCmdOrCtrl && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      wrapSelection(textareaEl, '*', '*');
      store.updateMarkdown(textareaEl.value, { source: 'editor' });
      return;
    }
  });

  // Subscribe to store updates
  store.subscribe('document:loaded', (doc) => {
    if (doc) {
      textareaEl.value = doc.rawMarkdown || '';
      updateLineNumbers();
      updateStatus();

      const savedState = store.getEditorState(doc.id);
      if (savedState) {
        setTimeout(() => {
          if (typeof savedState.scrollTop === 'number') textareaEl.scrollTop = savedState.scrollTop;
          if (typeof savedState.selectionStart === 'number') {
            textareaEl.selectionStart = savedState.selectionStart;
            textareaEl.selectionEnd = savedState.selectionEnd;
          }
        }, 10);
      }
    }
  });

  store.subscribe('parsed:update', (result) => {
    if (result) {
      updateStatus(result.frontmatterError);

      // Populate Section Outline Jumper
      if (sectionJumpSelect && result.ast && result.ast.sections) {
        sectionJumpSelect.innerHTML = '<option value="">Jump to Section...</option>' +
          result.ast.sections.map(s => {
            const slug = s.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
            return `<option value="${slug}">## ${escapeHtml(s.title)}</option>`;
          }).join('');
      }
    }
  });

  return {
    setValue: (val) => {
      textareaEl.value = val;
      updateLineNumbers();
      updateStatus();
    },
    getValue: () => textareaEl.value
  };
}

/**
 * Visual Profile & Contact Metadata Form Modal
 */
function openProfileEditorModal(store, textareaEl, updateLineNumbers, updateStatus, showModal, showToast) {
  const currentDoc = store.getDocument();
  const meta = store.parsedResult?.metadata || currentDoc?.metadata || {};
  const contact = meta.contact || {};

  const formHtml = `
    <div class="profile-form-grid">
      <div class="form-group full-width">
        <label for="pf-name">Full Name</label>
        <input type="text" id="pf-name" class="form-input" value="${escapeHtml(meta.name || '')}" placeholder="Alex Chen">
      </div>

      <div class="form-group full-width">
        <label for="pf-title">Target Title / Headline</label>
        <input type="text" id="pf-title" class="form-input" value="${escapeHtml(meta.title || '')}" placeholder="Senior Software Engineer">
      </div>

      <div class="form-group full-width">
        <label for="pf-summary">Professional Summary</label>
        <textarea id="pf-summary" class="form-input" rows="3" placeholder="2-3 sentence career summary...">${escapeHtml(meta.summary || '')}</textarea>
      </div>

      <div class="form-group">
        <label for="pf-email">Email Address</label>
        <input type="email" id="pf-email" class="form-input" value="${escapeHtml(contact.email || '')}" placeholder="alex@example.com">
      </div>

      <div class="form-group">
        <label for="pf-phone">Phone Number</label>
        <input type="tel" id="pf-phone" class="form-input" value="${escapeHtml(contact.phone || '')}" placeholder="+1 (555) 123-4567">
      </div>

      <div class="form-group">
        <label for="pf-location">Location (City, ST)</label>
        <input type="text" id="pf-location" class="form-input" value="${escapeHtml(contact.location || '')}" placeholder="San Francisco, CA">
      </div>

      <div class="form-group">
        <label for="pf-website">Personal Website / Portfolio</label>
        <input type="text" id="pf-website" class="form-input" value="${escapeHtml(contact.website || '')}" placeholder="alexchen.dev">
      </div>

      <div class="form-group">
        <label for="pf-linkedin">LinkedIn Handle / URL</label>
        <input type="text" id="pf-linkedin" class="form-input" value="${escapeHtml(contact.linkedin || '')}" placeholder="linkedin.com/in/alexchen">
      </div>

      <div class="form-group">
        <label for="pf-github">GitHub Handle / URL</label>
        <input type="text" id="pf-github" class="form-input" value="${escapeHtml(contact.github || '')}" placeholder="github.com/alexchen">
      </div>
    </div>
  `;

  showModal({
    title: 'Edit Contact & Header Details',
    message: formHtml,
    options: [
      {
        label: 'Save Profile Changes',
        primary: true,
        action: async () => {
          const newMeta = {
            name: document.getElementById('pf-name')?.value.trim() || '',
            title: document.getElementById('pf-title')?.value.trim() || '',
            summary: document.getElementById('pf-summary')?.value.trim() || '',
            contact: {
              email: document.getElementById('pf-email')?.value.trim() || '',
              phone: document.getElementById('pf-phone')?.value.trim() || '',
              location: document.getElementById('pf-location')?.value.trim() || '',
              website: document.getElementById('pf-website')?.value.trim() || '',
              linkedin: document.getElementById('pf-linkedin')?.value.trim() || '',
              github: document.getElementById('pf-github')?.value.trim() || ''
            }
          };

          const syncedMd = await syncMetadataToMarkdown(currentDoc.rawMarkdown, newMeta);
          currentDoc.rawMarkdown = syncedMd;
          textareaEl.value = syncedMd;
          updateLineNumbers();
          updateStatus();
          store.updateMarkdown(syncedMd, { source: 'editor' });
          showToast('Updated profile & contact details!');
        }
      },
      {
        label: 'Cancel',
        cancel: true,
        action: () => {}
      }
    ]
  });
}

function wrapSelection(textarea, before, after) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const value = textarea.value;
  const selected = value.substring(start, end);

  textarea.value = value.substring(0, start) + before + selected + after + value.substring(end);
  textarea.selectionStart = start + before.length;
  textarea.selectionEnd = end + before.length;
  textarea.focus();
}

function moveLine(textarea, direction) {
  const val = textarea.value;
  const selStart = textarea.selectionStart;
  const lines = val.split('\n');

  let currentPos = 0;
  let lineIdx = 0;
  for (let i = 0; i < lines.length; i++) {
    const nextPos = currentPos + lines[i].length + 1;
    if (selStart >= currentPos && selStart <= nextPos) {
      lineIdx = i;
      break;
    }
    currentPos = nextPos;
  }

  const targetIdx = lineIdx + direction;
  if (targetIdx < 0 || targetIdx >= lines.length) return;

  const temp = lines[lineIdx];
  lines[lineIdx] = lines[targetIdx];
  lines[targetIdx] = temp;

  textarea.value = lines.join('\n');
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
