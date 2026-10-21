/**
 * Offline-First Service Worker for Resume Builder SPA
 * Cache-First for /vendor/ and fonts; Stale-While-Revalidate for app assets.
 */

const CACHE_NAME = 'resume-builder-v3';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './styles/main.css',
  './styles/preview-engine.css',
  './styles/print.css',
  './styles/templates/modern-minimal.css',
  './styles/templates/classic-ivy.css',
  './styles/templates/executive-compact.css',
  './styles/templates/split-sidebar.css',
  './styles/templates/tech-mono.css',
  './styles/templates/swiss-grid.css',
  './styles/templates/academic-cv.css',
  './styles/templates/creative-accent.css',
  './styles/templates/nordic-clean.css',
  './styles/templates/modern-timeline.css',
  './styles/templates/bold-editorial.css',
  './styles/templates/ats-standard.css',
  './vendor/fonts/fonts.css',
  './vendor/marked.esm.js',
  './vendor/js-yaml.esm.js',
  './vendor/purify.es.js',
  './vendor/docx.esm.js',
  './vendor/paged.polyfill.js',
  './vendor/idb-keyval.js',
  './src/app.js',
  './src/vendor/loader.js',
  './src/state/schema.js',
  './src/state/db.js',
  './src/state/store.js',
  './src/parser/frontmatter.js',
  './src/parser/directives.js',
  './src/parser/ast-builder.js',
  './src/parser/pipeline.js',
  './src/layout/pagination.js',
  './src/layout/fit-to-page.js',
  './src/layout/splitter.js',
  './src/audit/contrast.js',
  './src/audit/ats-linter.js',
  './src/io/heuristic-splitter.js',
  './src/io/json-resume.js',
  './src/io/import-engine.js',
  './src/io/pdf-export.js',
  './src/io/docx-export.js',
  './src/io/html-export.js',
  './src/templates/registry.js',
  './src/templates/starters.js',
  './src/ui/editor.js',
  './src/ui/toolbar.js',
  './src/ui/design-panel.js',
  './src/ui/workspace-drawer.js',
  './src/ui/ats-panel.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch(err => {
        console.warn('Precache partial miss, continuing...', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Vendor & fonts: Cache-first
  if (url.pathname.includes('/vendor/') || url.pathname.includes('/fonts/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // App shell: Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return networkResponse;
      }).catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
