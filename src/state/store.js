/**
 * Reactive Store with Pub/Sub, UI Debounce (40ms), IDB Debounce (500ms),
 * Synchronous Session Persistence, and Emergency beforeunload Flush.
 */
import { normalizeConfig } from './schema.js';
import * as db from './db.js';

const SESSION_KEY = 'resume_builder_ui_session';

function loadSession() {
  try {
    if (typeof localStorage === 'undefined') return {};
    const item = localStorage.getItem(SESSION_KEY);
    return item ? JSON.parse(item) : {};
  } catch (e) {
    return {};
  }
}

function saveSession(partial) {
  try {
    if (typeof localStorage === 'undefined') return;
    const current = loadSession();
    localStorage.setItem(SESSION_KEY, JSON.stringify({ ...current, ...partial }));
  } catch (e) {}
}

class StateStore {
  constructor() {
    this.currentDocument = null;
    this.parsedResult = null; // { html, ast, metadata, config, atsReport, frontmatterError }

    const session = loadSession();
    this.viewMode = session.viewMode || 'split'; // 'split' | 'editor' | 'preview'
    this.zoomLevel = typeof session.zoomLevel === 'number' ? session.zoomLevel : 1.0;
    this.autoPairFonts = session.autoPairFonts !== false; // default true
    this.editorStateByDoc = session.editorStateByDoc || {};

    this.listeners = new Map();

    this.uiDebounceTimer = null;
    this.idbDebounceTimer = null;
    this.lastSnapshotTimestamp = Date.now();
    this.lastSnapshotChars = 0;

    // Bind emergency flush on visibilitychange and beforeunload/pagehide
    if (typeof window !== 'undefined') {
      const handleFlush = () => this.flushPendingSave();
      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') handleFlush();
      });
      window.addEventListener('pagehide', handleFlush);
      window.addEventListener('beforeunload', handleFlush);
    }
  }

  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.listeners.get(event).delete(callback);
  }

  notify(event, payload) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => {
        try {
          cb(payload);
        } catch (e) {
          console.error(`Error in subscriber for event "${event}":`, e);
        }
      });
    }
  }

  getDocument() {
    return this.currentDocument;
  }

  getConfig() {
    return this.currentDocument?.config || {};
  }

  getViewMode() {
    return this.viewMode;
  }

  setViewMode(mode) {
    if (['split', 'editor', 'preview'].includes(mode)) {
      this.viewMode = mode;
      saveSession({ viewMode: mode });
      this.notify('viewMode:change', mode);
    }
  }

  getZoom() {
    return this.zoomLevel;
  }

  setZoom(zoom) {
    this.zoomLevel = Math.max(0.4, Math.min(2.0, zoom));
    saveSession({ zoomLevel: this.zoomLevel });
    this.notify('zoom:change', this.zoomLevel);
  }

  setAutoPairFonts(enabled) {
    this.autoPairFonts = !!enabled;
    saveSession({ autoPairFonts: this.autoPairFonts });
  }

  getAutoPairFonts() {
    return this.autoPairFonts;
  }

  saveEditorState(docId, state) {
    if (!docId) return;
    this.editorStateByDoc[docId] = state;
    saveSession({ editorStateByDoc: this.editorStateByDoc });
  }

  getEditorState(docId) {
    return (docId && this.editorStateByDoc[docId]) || null;
  }

  setDocument(doc, options = { emitImmediate: true, saveDb: true }) {
    this.currentDocument = doc;
    if (doc) {
      this.lastSnapshotChars = doc.rawMarkdown ? doc.rawMarkdown.length : 0;
      this.lastSnapshotTimestamp = Date.now();
    }
    if (options.emitImmediate) {
      this.notify('document:loaded', this.currentDocument);
    }
    if (options.saveDb && doc) {
      this.scheduleIdbSave(false);
    }
  }

  updateTitle(newTitle) {
    if (!this.currentDocument) return;
    this.currentDocument.title = newTitle;
    this.currentDocument.updatedAt = Date.now();
    this.notify('title:change', newTitle);
    this.scheduleIdbSave(false);
  }

  /**
   * Update raw markdown text (from editor typing)
   */
  updateMarkdown(rawMarkdown, options = { source: 'editor' }) {
    if (!this.currentDocument) return;
    this.currentDocument.rawMarkdown = rawMarkdown;
    this.currentDocument.updatedAt = Date.now();

    // Check auto-snapshot criteria: 60s elapsed OR >120 chars changed
    const now = Date.now();
    const charDiff = Math.abs((rawMarkdown?.length || 0) - this.lastSnapshotChars);
    const timeDiff = now - this.lastSnapshotTimestamp;
    const shouldSnapshot = (timeDiff >= 60000 && charDiff > 20) || charDiff >= 120;

    // Fast UI notification debounced <= 40ms
    clearTimeout(this.uiDebounceTimer);
    this.uiDebounceTimer = setTimeout(() => {
      this.notify('markdown:change', { rawMarkdown, source: options.source });
    }, 40);

    // Persistence debounced 500ms
    this.scheduleIdbSave(shouldSnapshot);
  }

  /**
   * Update config properties (from UI design controls)
   */
  updateConfig(partialConfig, options = { syncToFrontmatter: true }) {
    if (!this.currentDocument) return;
    const prevConfig = { ...this.currentDocument.config };
    this.currentDocument.config = normalizeConfig({
      ...this.currentDocument.config,
      ...partialConfig
    });
    this.currentDocument.updatedAt = Date.now();

    this.notify('config:change', {
      config: this.currentDocument.config,
      prevConfig,
      syncToFrontmatter: options.syncToFrontmatter
    });

    this.scheduleIdbSave(false);
  }

  setParsedResult(result) {
    this.parsedResult = result;
    this.notify('parsed:update', result);
  }

  scheduleIdbSave(shouldSnapshot = false) {
    clearTimeout(this.idbDebounceTimer);
    this.idbDebounceTimer = setTimeout(async () => {
      if (!this.currentDocument) return;
      try {
        await db.saveDocument(
          this.currentDocument,
          shouldSnapshot,
          'auto',
          'Auto-saved edits'
        );
        if (shouldSnapshot) {
          this.lastSnapshotTimestamp = Date.now();
          this.lastSnapshotChars = this.currentDocument.rawMarkdown?.length || 0;
          this.notify('snapshots:update', await db.getSnapshots(this.currentDocument.id));
        }
        this.notify('saved', { timestamp: Date.now() });
      } catch (e) {
        console.error('Failed to auto-save document to IndexedDB:', e);
      }
    }, 500);
  }

  /**
   * Emergency flush for tab closure / navigation / manual Save Now
   */
  flushPendingSave() {
    clearTimeout(this.idbDebounceTimer);
    if (!this.currentDocument) return;
    try {
      db.saveDocumentSync(this.currentDocument);
      db.saveDocument(this.currentDocument, false, 'auto', 'Flushed pending save');
      this.notify('saved', { timestamp: Date.now() });
    } catch (e) {
      console.warn('flushPendingSave failed:', e);
    }
  }

  async manualSnapshot(summary = 'Manual Snapshot') {
    if (!this.currentDocument) return null;
    this.flushPendingSave();
    const snap = await db.addSnapshot(
      this.currentDocument.id,
      'manual',
      summary,
      this.currentDocument.config,
      this.currentDocument.rawMarkdown
    );
    this.lastSnapshotTimestamp = Date.now();
    this.lastSnapshotChars = this.currentDocument.rawMarkdown?.length || 0;
    this.notify('snapshots:update', await db.getSnapshots(this.currentDocument.id));
    return snap;
  }
}

export const store = new StateStore();
