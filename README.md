# Markdown Resume Builder SPA

> **Production-grade, 100% client-side, zero-build offline Single Page Application (SPA).**  
> GitHub Pages ready, local-first with IndexedDB persistence, 1:1 physical paper preview, ATS compliance linter, and vector PDF & Word (.docx) exporters.

---

## Features

- **Zero-Build & GitHub Pages Ready:** Runs directly from static files (`index.html`, native ES6 modules in `/src/`, and `/styles/`) without any Node.js compilation required.
- **Offline-First PWA:** Resilient Service Worker caching (`sw.js`) and self-hosted fonts in `/vendor/fonts/` for 100% offline functionality.
- **Bi-Directional Synchronization:** Changes made in UI sliders, fonts, and color pickers immediately sync into YAML frontmatter in the editor without clobbering text, and vice versa.
- **1:1 WYSIWYG Print Calibration:** Exact physical dimensions for `letter` (8.5 × 11 in) and `a4` (210 × 297 mm) with visual dashed page-break dividers and live overflow tracker.
- **Deterministic Fit-to-Page Solver:** One-click algorithm that adjusts micro-spacing, line-height, margins, and font size to fit content onto exactly 1 or 2 pages with 1-click Undo.
- **8 Core Professional Templates:** Modern Minimal, Classic Ivy, Executive Compact, Split Sidebar (30/70 grid), Tech Mono, Swiss Grid, Academic CV, and Creative Accent.
- **4 Rich Starter Resumes:** Entry-Level / Student, Mid-Career Software Engineer, Engineering Director / Executive, and Academic CV.
- **Real-Time ATS Compliance Auditor:** Evaluates headings against standard recruitment taxonomy, checks contact info and bullet structures, and offers one-click renames for creative headers.
- **WCAG 2.1 AA Contrast Checker:** Computes relative luminance and contrast ratios with a one-click auto-fix button.
- **Multi-Format Import & Heuristic Splitter:** Drag-and-drop `.md`, `.txt`, and `.json` (JSON Resume format) with overwrite protection guards and automatic contact/section extraction.
- **High-Fidelity Exporters:** Vector-identical PDF via `@media print` and dynamic `@page` injection, and structured Word (`.docx`) compiler with twip geometry and borderless tables.
- **50-Snapshot Version Ring Buffer:** Rolling snapshot history with timestamps, triggers (`auto`, `manual`, `pre-import`, `pre-rollback`), word counts, and instant rollback.

---

## Quick Start

Serve the repository with any static web server:

```bash
# Using Python 3
python3 -m http.server 8080
```

Then open `http://localhost:8080` in your web browser.

---

## Running Verification Tests

Run the automated test suite using the built-in macOS JavaScriptCore runtime:

```bash
/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc -m tests/test-suite.js
```
