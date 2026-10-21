/**
 * Resilient Vendor Loader
 * Attempts to load local vendored modules first; falls back to pinned CDN URLs if missing.
 */

const CDN_FALLBACKS = {
  marked: 'https://cdn.jsdelivr.net/npm/marked@12.0.1/lib/marked.esm.js',
  jsYaml: 'https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.mjs',
  dompurify: 'https://cdn.jsdelivr.net/npm/dompurify@3.1.0/dist/purify.es.mjs',
  docx: 'https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.mjs',
  idbKeyval: 'https://cdn.jsdelivr.net/npm/idb-keyval@6.2.1/dist/index.js',
  pagedjs: 'https://cdn.jsdelivr.net/npm/pagedjs@0.4.3/dist/paged.polyfill.js'
};

async function safeImport(localPath, cdnUrl) {
  try {
    return await import(localPath);
  } catch (err) {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn(`Local vendor module failed (${localPath}), falling back to CDN: ${cdnUrl}`, err);
    }
    return await import(cdnUrl);
  }
}

let markedModule = null;
export async function getMarked() {
  if (!markedModule) {
    markedModule = await safeImport('../../vendor/marked.esm.js', CDN_FALLBACKS.marked);
  }
  return markedModule;
}

let yamlModule = null;
export async function getJsYaml() {
  if (!yamlModule) {
    yamlModule = await safeImport('../../vendor/js-yaml.esm.js', CDN_FALLBACKS.jsYaml);
  }
  return yamlModule.default || yamlModule;
}

let purifyModule = null;
export async function getPurify() {
  if (!purifyModule) {
    const mod = await safeImport('../../vendor/purify.es.js', CDN_FALLBACKS.dompurify);
    purifyModule = mod.default || mod;
  }
  return purifyModule;
}

let docxModule = null;
export async function getDocx() {
  if (!docxModule) {
    docxModule = await safeImport('../../vendor/docx.esm.js', CDN_FALLBACKS.docx);
  }
  return docxModule;
}

let idbModule = null;
export async function getIdbKeyval() {
  if (!idbModule) {
    idbModule = await safeImport('../../vendor/idb-keyval.js', CDN_FALLBACKS.idbKeyval);
  }
  return idbModule;
}

let pagedLoaded = null;
export async function ensurePagedJs() {
  if (typeof window !== 'undefined' && window.Paged) {
    return window.Paged;
  }
  if (!pagedLoaded) {
    pagedLoaded = new Promise((resolve, reject) => {
      // First try local polyfill
      const script = document.createElement('script');
      script.src = new URL('../../vendor/paged.polyfill.js', import.meta.url).href;
      script.onload = () => resolve(window.Paged);
      script.onerror = () => {
        console.warn('Local pagedjs failed, falling back to CDN');
        const cdnScript = document.createElement('script');
        cdnScript.src = CDN_FALLBACKS.pagedjs;
        cdnScript.onload = () => resolve(window.Paged);
        cdnScript.onerror = (e) => reject(new Error('Failed to load Paged.js polyfill from both local and CDN'));
        document.head.appendChild(cdnScript);
      };
      document.head.appendChild(script);
    });
  }
  return pagedLoaded;
}
