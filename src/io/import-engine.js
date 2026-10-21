/**
 * Multi-Format Import Engine & Overwrite Confirmation Guard
 */
import { convertRawTextToMarkdown } from './heuristic-splitter.js';
import { jsonResumeToMarkdown } from './json-resume.js';
import { createInitialDocument, generateId } from '../state/schema.js';
import * as db from '../state/db.js';

export function initImportEngine(store, showModalCallback) {
  // Setup drag-and-drop overlay
  let dragCounter = 0;
  const overlay = document.getElementById('drag-drop-overlay');

  window.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragCounter++;
    if (overlay) overlay.classList.add('is-active');
  });

  window.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter <= 0 && overlay) {
      overlay.classList.remove('is-active');
      dragCounter = 0;
    }
  });

  window.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  window.addEventListener('drop', async (e) => {
    e.preventDefault();
    dragCounter = 0;
    if (overlay) overlay.classList.remove('is-active');

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      await handleFileImport(files[0], store, showModalCallback);
    }
  });
}

export async function handleFileImport(file, store, showModalCallback) {
  const fileName = file.name;
  const text = await file.text();

  let convertedMarkdown = '';
  let docTitle = fileName.replace(/\.[^/.]+$/, '');

  if (fileName.endsWith('.json')) {
    try {
      convertedMarkdown = jsonResumeToMarkdown(text);
    } catch (e) {
      alert('Failed to parse JSON Resume file: ' + e.message);
      return;
    }
  } else if (fileName.endsWith('.txt')) {
    convertedMarkdown = convertRawTextToMarkdown(text);
  } else {
    // .md or other text
    if (!text.trim().startsWith('---')) {
      convertedMarkdown = convertRawTextToMarkdown(text);
    } else {
      convertedMarkdown = text;
    }
  }

  await promptImportAction(convertedMarkdown, docTitle, store, showModalCallback);
}

export async function promptImportAction(markdownContent, proposedTitle, store, showModalCallback) {
  const currentDoc = store.getDocument();

  // If current document has substantial content, prompt overwrite guard
  const hasContent = currentDoc && currentDoc.rawMarkdown && currentDoc.rawMarkdown.length > 100;

  if (!hasContent) {
    // Direct load into current doc
    loadIntoCurrent(currentDoc, markdownContent, proposedTitle, store);
    return;
  }

  showModalCallback({
    title: 'Import Resume Content',
    message: `You are importing "${proposedTitle}". How would you like to proceed?`,
    options: [
      {
        label: 'Create New Resume in Workspace (Recommended)',
        primary: true,
        action: async () => {
          const newDoc = createInitialDocument({
            id: generateId(),
            title: proposedTitle || 'Imported Resume',
            rawMarkdown: markdownContent
          });
          await db.saveDocument(newDoc, true, 'pre-import', 'Initial import');
          await db.setActiveDocumentId(newDoc.id);
          store.setDocument(newDoc);
        }
      },
      {
        label: 'Overwrite Current Document (Saves snapshot first)',
        danger: true,
        action: async () => {
          // Pre-import snapshot
          await store.manualSnapshot('Pre-import snapshot before overwriting');
          currentDoc.rawMarkdown = markdownContent;
          if (proposedTitle) currentDoc.title = proposedTitle;
          store.setDocument(currentDoc);
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

function loadIntoCurrent(currentDoc, markdownContent, proposedTitle, store) {
  if (currentDoc) {
    currentDoc.rawMarkdown = markdownContent;
    if (proposedTitle) currentDoc.title = proposedTitle;
    store.setDocument(currentDoc);
  }
}
