/**
 * Dual-Layer Local Persistence Engine (IndexedDB + Synchronous localStorage Mirror)
 * 50-Snapshot Version Ring Buffer & Portable Workspace Bundle Exporter/Importer
 */
import { getIdbKeyval } from '../vendor/loader.js';
import { createInitialDocument, generateId } from './schema.js';

let dbStorePromise = null;

async function getStore() {
  if (!dbStorePromise) {
    dbStorePromise = (async () => {
      try {
        const idb = await getIdbKeyval();
        if (idb && typeof idb.createStore === 'function') {
          return idb.createStore('resume-builder-db', 'keyval');
        }
      } catch (err) {
        console.warn('IndexedDB unavailable, falling back to localStorage:', err);
      }
      return null;
    })();
  }
  return dbStorePromise;
}

const INDEX_KEY = 'documents:index';
const ACTIVE_DOC_KEY = 'workspace:active_id';
const MAX_SNAPSHOTS = 50;

// LocalStorage Mirror Helpers
const LS_PREFIX = 'rb_fallback_';

function lsGet(key) {
  try {
    if (typeof localStorage === 'undefined') return null;
    const item = localStorage.getItem(LS_PREFIX + key);
    return item ? JSON.parse(item) : null;
  } catch (e) {
    return null;
  }
}

function lsSet(key, value) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.warn('localStorage write failed:', e);
  }
}

function lsDel(key) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(LS_PREFIX + key);
  } catch (e) {}
}

export async function getDocumentIndex() {
  try {
    const idb = await getIdbKeyval();
    const store = await getStore();
    if (store && idb) {
      const list = await idb.get(INDEX_KEY, store);
      if (Array.isArray(list) && list.length > 0) {
        lsSet(INDEX_KEY, list);
        return list;
      }
    }
  } catch (e) {
    console.warn('IDB getDocumentIndex failed, using localStorage:', e);
  }
  const fallback = lsGet(INDEX_KEY);
  return Array.isArray(fallback) ? fallback : [];
}

export async function saveDocumentIndex(indexList) {
  lsSet(INDEX_KEY, indexList);
  try {
    const idb = await getIdbKeyval();
    const store = await getStore();
    if (store && idb) {
      await idb.set(INDEX_KEY, indexList, store);
    }
  } catch (e) {
    console.warn('IDB saveDocumentIndex failed:', e);
  }
}

export async function getActiveDocumentId() {
  try {
    const idb = await getIdbKeyval();
    const store = await getStore();
    if (store && idb) {
      const activeId = await idb.get(ACTIVE_DOC_KEY, store);
      if (activeId) {
        lsSet(ACTIVE_DOC_KEY, activeId);
        return activeId;
      }
    }
  } catch (e) {
    console.warn('IDB getActiveDocumentId failed, using localStorage:', e);
  }
  return lsGet(ACTIVE_DOC_KEY) || null;
}

export async function setActiveDocumentId(id) {
  lsSet(ACTIVE_DOC_KEY, id);
  try {
    const idb = await getIdbKeyval();
    const store = await getStore();
    if (store && idb) {
      await idb.set(ACTIVE_DOC_KEY, id, store);
    }
  } catch (e) {
    console.warn('IDB setActiveDocumentId failed:', e);
  }
}

export async function getDocument(id) {
  if (!id) return null;
  try {
    const idb = await getIdbKeyval();
    const store = await getStore();
    if (store && idb) {
      const doc = await idb.get(`document:${id}`, store);
      if (doc) {
        lsSet(`document:${id}`, doc);
        return doc;
      }
    }
  } catch (e) {
    console.warn(`IDB getDocument(${id}) failed, checking localStorage:`, e);
  }
  return lsGet(`document:${id}`) || null;
}

/**
 * Synchronous emergency save for pagehide, visibilitychange, and beforeunload events
 */
export function saveDocumentSync(document) {
  if (!document || !document.id) return;
  document.updatedAt = Date.now();
  lsSet(`document:${document.id}`, document);

  const index = lsGet(INDEX_KEY) || [];
  const existingIdx = index.findIndex(item => item.id === document.id);
  const entry = {
    id: document.id,
    title: document.title || 'Untitled Resume',
    updatedAt: document.updatedAt,
    template: document.config?.template || 'modern-minimal'
  };

  if (existingIdx >= 0) {
    index[existingIdx] = entry;
  } else {
    index.unshift(entry);
  }
  lsSet(INDEX_KEY, index);
  lsSet(ACTIVE_DOC_KEY, document.id);
}

export async function saveDocument(document, createSnap = false, snapTrigger = 'auto', snapSummary = 'Auto-save') {
  if (!document || !document.id) return;
  document.updatedAt = Date.now();

  // 1. Immediate synchronous mirror in localStorage
  saveDocumentSync(document);

  // 2. Persistent storage in IndexedDB
  try {
    const idb = await getIdbKeyval();
    const store = await getStore();
    if (store && idb) {
      await idb.set(`document:${document.id}`, document, store);
      const index = lsGet(INDEX_KEY) || [];
      await idb.set(INDEX_KEY, index, store);
    }
  } catch (e) {
    console.warn('IDB saveDocument failed, preserved in localStorage:', e);
  }

  if (createSnap) {
    await addSnapshot(document.id, snapTrigger, snapSummary, document.config, document.rawMarkdown);
  }
}

export async function deleteDocument(id) {
  lsDel(`document:${id}`);
  lsDel(`history:${id}`);

  const index = (await getDocumentIndex()).filter(item => item.id !== id);
  await saveDocumentIndex(index);

  try {
    const idb = await getIdbKeyval();
    const store = await getStore();
    if (store && idb) {
      await idb.del(`document:${id}`, store);
      await idb.del(`history:${id}`, store);
    }
  } catch (e) {
    console.warn('IDB deleteDocument failed:', e);
  }

  return index;
}

export async function duplicateDocument(sourceId, newTitle) {
  const source = await getDocument(sourceId);
  if (!source) throw new Error('Source document not found');

  const cloned = {
    ...JSON.parse(JSON.stringify(source)),
    id: generateId(),
    title: newTitle || `${source.title} (Copy)`,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  await saveDocument(cloned, true, 'manual', 'Cloned from ' + source.title);
  return cloned;
}

export async function getSnapshots(documentId) {
  if (!documentId) return [];
  try {
    const idb = await getIdbKeyval();
    const store = await getStore();
    if (store && idb) {
      const history = await idb.get(`history:${documentId}`, store);
      if (Array.isArray(history)) {
        lsSet(`history:${documentId}`, history);
        return history;
      }
    }
  } catch (e) {
    console.warn(`IDB getSnapshots(${documentId}) failed:`, e);
  }
  const fallback = lsGet(`history:${documentId}`);
  return Array.isArray(fallback) ? fallback : [];
}

export async function addSnapshot(documentId, trigger = 'auto', summary = 'Snapshot', config = null, rawMarkdown = '') {
  if (!documentId) return;

  const history = await getSnapshots(documentId);
  const newEntry = {
    snapshotId: `snap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: Date.now(),
    trigger, // 'auto' | 'manual' | 'pre-import' | 'pre-rollback'
    summary,
    config: config ? JSON.parse(JSON.stringify(config)) : null,
    rawMarkdown
  };

  history.unshift(newEntry);
  if (history.length > MAX_SNAPSHOTS) {
    history.length = MAX_SNAPSHOTS;
  }

  lsSet(`history:${documentId}`, history);

  try {
    const idb = await getIdbKeyval();
    const store = await getStore();
    if (store && idb) {
      await idb.set(`history:${documentId}`, history, store);
    }
  } catch (e) {
    console.warn('IDB addSnapshot failed:', e);
  }

  return newEntry;
}

export async function rollbackSnapshot(documentId, snapshotId) {
  const history = await getSnapshots(documentId);
  const target = history.find(s => s.snapshotId === snapshotId);
  if (!target) throw new Error('Snapshot not found: ' + snapshotId);

  const current = await getDocument(documentId);
  if (current) {
    // Record pre-rollback snapshot so user can revert rollback
    await addSnapshot(documentId, 'pre-rollback', `Before reverting to ${new Date(target.timestamp).toLocaleTimeString()}`, current.config, current.rawMarkdown);
  }

  if (target.config) current.config = target.config;
  current.rawMarkdown = target.rawMarkdown;
  current.updatedAt = Date.now();

  await saveDocument(current, false);
  return current;
}

/**
 * Portable Workspace Bundle Export & Import
 * Bundles all saved documents, active document ID, and history snapshots into a single JSON object.
 */
export async function exportWorkspaceBundle() {
  const index = await getDocumentIndex();
  const activeId = await getActiveDocumentId();
  const documents = [];
  const histories = {};

  for (const item of index) {
    const doc = await getDocument(item.id);
    if (doc) {
      documents.push(doc);
      const snaps = await getSnapshots(item.id);
      if (snaps.length > 0) {
        histories[item.id] = snaps;
      }
    }
  }

  return {
    version: 1,
    exportedAt: Date.now(),
    activeId,
    index,
    documents,
    histories
  };
}

export async function importWorkspaceBundle(bundleData, { merge = true } = {}) {
  if (!bundleData || !Array.isArray(bundleData.documents)) {
    throw new Error('Invalid workspace backup format');
  }

  if (!merge) {
    const currentIndex = await getDocumentIndex();
    for (const item of currentIndex) {
      await deleteDocument(item.id);
    }
  }

  for (const doc of bundleData.documents) {
    await saveDocument(doc, false);
    if (bundleData.histories && bundleData.histories[doc.id]) {
      const snaps = bundleData.histories[doc.id];
      lsSet(`history:${doc.id}`, snaps);
      try {
        const idb = await getIdbKeyval();
        const store = await getStore();
        if (store && idb) {
          await idb.set(`history:${doc.id}`, snaps, store);
        }
      } catch (e) {}
    }
  }

  if (bundleData.activeId) {
    await setActiveDocumentId(bundleData.activeId);
  }

  return await getDocumentIndex();
}
