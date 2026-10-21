# Resume Builder SPA — Master Implementation Plan & Agent Execution Prompt

> **Target Environment:** 100% Client-Side Single Page Application (SPA), Zero-Build ES Modules, Offline-First PWA, GitHub Pages Ready  
> **Document Purpose:** This document contains both the **Master Agent Prompt** (Section 1) and the **Comprehensive Technical Implementation Plan** (Sections 2–10) required to build, verify, and ship the application from scratch.

---

## 1. Master Prompt for Autonomous Coding Agent

Copy and pass the following prompt block directly to the executing coding agent (or instruct the agent: *"Execute `implementation-plan-1.md` end-to-end"*):

```markdown
# ROLE & OBJECTIVE
You are a Staff Frontend Architect and Principal Document Systems Engineer. Your objective is to build a production-grade, 100% client-side, offline-capable Resume Builder Single Page Application (SPA) in this repository following every specification, user story (US-1.1 through US-6.1), and architectural constraint defined in `implementation-plan-1.md`.

# CORE ARCHITECTURAL MANDATES
1. **Zero-Build Static SPA (GitHub Pages Ready):**
   - The application MUST run directly from static files (`index.html`, `sw.js`, `manifest.json`, and modular ES6 JavaScript in `/src/` and styles in `/styles/`) without requiring a Node.js build step to serve.
   - Use native ES Modules (`<script type="module" src="./src/app.js"></script>`).
   - Vendor dependencies (`marked`, `js-yaml`, `DOMPurify`, `docx`, `idb-keyval`, `pagedjs`) must be loaded via a resilient vendor loader (`src/vendor/loader.js`) that prefers local `/vendor/` bundles and falls back to pinned CDN URLs, with Service Worker caching for 100% offline operation.
   - Include a helper script or pre-populated `/vendor/` directory so that all dependencies and core WOFF2 font files work completely offline.

2. **Completeness & Zero Placeholders:**
   - Do NOT leave `TODO`, `FIXME`, mock stubs, or truncated templates.
   - Every template (all 5 core themes + 3 bonus variations to satisfy "8+ Templates" in the feature matrix), every starter resume (Student/Entry-Level, Mid-Career Software Engineer, Senior Management, Academic CV), every parser rule, the `docx.js` OpenXML compiler, the Fit-to-One-Page solver, and the ATS/WCAG linters must be fully implemented and functional.

3. **Bi-Directional Synchronization (YAML Frontmatter <-> UI Controls):**
   - Editing `settings:` in the YAML frontmatter must immediately reflect in the visual design/spacing controls.
   - Adjusting a slider, font dropdown, template selector, or color picker in the UI must cleanly update both the active config state and the YAML frontmatter block in the editor (without clobbering user comments or body content) and trigger a debounced preview update within <100ms.

4. **True WYSIWYG Pagination & Print Fidelity:**
   - The live preview must calibrate strictly to physical paper dimensions (`letter`: 8.5in × 11in, `a4`: 210mm × 297mm) at 96 DPI equivalency with visible page break boundaries, page counters, and overflow indicators.
   - `@media print` and `Paged.js` orchestration must strip all UI chrome, enforce `@page { margin: 0; }` (since page margins are controlled precisely via the inner `.resume-page` padding/margin box), preserve clickable vector hyperlinks, and enforce `break-inside: avoid` on experience/education items and `break-after: avoid` on headings.

5. **Execution Workflow:**
   - Execute the build sequentially across Phases 1 through 4 as detailed in `implementation-plan-1.md`.
   - After completing all modules, start a local static HTTP server, verify zero console/network errors, and run automated or headless verification checks against every Acceptance Criterion in Epics 1–6.
```

---

## 2. System Architecture & Directory Structure

### 2.1 High-Level Data Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              Browser Client SPA                              │
│                                                                              │
│  ┌──────────────────────────┐                ┌────────────────────────────┐  │
│  │    Authoring Surface     │                │     Live Preview Canvas    │  │
│  │  - Split / Tri-Mode UI   │   Debounced    │  - Scoped CSS Variables    │  │
│  │  - Syntax Highlighted    │ ──(<= 60ms)──► │  - 1:1 Letter / A4 Pages   │  │
│  │    Editor + Shortcuts    │                │  - Page-Break & Overflow   │  │
│  │  - Dropzone (.md/.json)  │ ◄─Bi-Di Sync── │  - Fit-to-Page Auto-Scaler │  │
│  └────────────┬─────────────┘                └──────────────▲─────────────┘  │
│               │                                             │                │
│               ▼                                             │                │
│  ┌──────────────────────────────────────────────────────────┴─────────────┐  │
│  │                  Core Reactive Store & AST Pipeline                    │  │
│  │  1. YAML Frontmatter Extractor (js-yaml) -> Normalized DocumentConfig  │  │
│  │  2. Extended Resume Pre-Processor (::: columns, ::skills, | headers)   │  │
│  │  3. CommonMark Parser (marked) + Sanitizer (DOMPurify) + AST Builder   │  │
│  │  4. Real-Time Auditors: ATS Compliance Linter + WCAG 2.1 AA Contrast   │  │
│  └────────────┬─────────────────────────────────────────────┬─────────────┘  │
│               │ (500ms Debounce)                            │ (On Export)    │
│               ▼                                             ▼                │
│  ┌────────────────────────────────────┐      ┌────────────────────────────┐  │
│  │   Local-First Persistence Layer    │      │  Exact-Fidelity Exporters  │  │
│  │  - IndexedDB Store (idb-keyval)    │      │  - PDF: Paged.js + @page   │  │
│  │  - Multi-Document Drawer           │      │  - DOCX: AST -> docx.js    │  │
│  │  - 50-Snapshot Ring Buffer History │      │  - JSON Resume (Bi-Di)     │  │
│  │  - Service Worker (Cache-First)    │      │  - Raw .md Source Export   │  │
│  └────────────────────────────────────┘      └────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Target Repository File Tree

```text
/
├── index.html                        # Semantic HTML5 App Shell, Toolbar, Drawers, Split Pane
├── manifest.json                     # PWA Web App Manifest (icons, standalone display, theme)
├── sw.js                             # Service Worker (Cache-First for vendor/fonts, Stale-While-Revalidate for app)
├── implementation-plan-1.md          # This specification document
├── scripts/
│   └── fetch-vendors.sh              # Optional utility to refresh local /vendor/ UMD/ESM bundles & WOFF2 fonts
├── vendor/                           # Pre-mirrored local offline fallbacks
│   ├── marked.esm.js                 # Marked.js (CommonMark parser)
│   ├── js-yaml.esm.js                # js-yaml (YAML frontmatter parse/dump)
│   ├── purify.es.js                  # DOMPurify (XSS sanitization)
│   ├── docx.esm.js                   # docx.js (OpenXML AST compiler)
│   ├── paged.polyfill.js             # Paged.js (CSS Paged Media polyfill)
│   ├── idb-keyval.js                 # Lightweight IndexedDB wrapper
│   └── fonts/                        # Self-hosted WOFF2 subsets + @font-face declarations
│       ├── fonts.css
│       └── *.woff2
├── styles/
│   ├── main.css                      # App shell layout, split pane, drawers, toolbar, dark/light chrome
│   ├── preview-engine.css            # Paper sizing (Letter/A4), CSS variables, page-break indicators
│   ├── print.css                     # Strict @media print & @page rules isolating the resume canvas
│   └── templates/
│       ├── modern-minimal.css        # Template 1: Clean sans, thin rules, high scannability
│       ├── classic-ivy.css           # Template 2: Single-column EB Garamond, centered header
│       ├── executive-compact.css     # Template 3: Dense 15+ yr layout, metric callouts, two-tone header
│       ├── split-sidebar.css         # Template 4: 30/70 asymmetric grid with shaded sidebar
│       ├── tech-mono.css             # Template 5: Monospace dates & badge capsules, crisp sans headers
│       ├── swiss-grid.css            # Template 6: Structured typographic grid layout
│       ├── academic-cv.css           # Template 7: Multi-page scholarly publication/grant layout
│       └── creative-accent.css       # Template 8: Bold top banner with modern pill tags
└── src/
    ├── app.js                        # Main entry point, initialization, keyboard shortcuts, SW registration
    ├── state/
    │   ├── store.js                  # Reactive pub/sub state store with 50ms UI & 500ms IDB debounce
    │   ├── schema.js                 # Default config, validation, normalization, migration helpers
    │   └── db.js                     # IndexedDB workspace manager & 50-snapshot version ring buffer
    ├── parser/
    │   ├── pipeline.js               # Orchestrates Frontmatter -> Directives -> Marked -> DOMPurify + AST
    │   ├── frontmatter.js            # Extracts & serializes YAML frontmatter <-> DocumentConfig
    │   ├── directives.js             # Custom extensions: `### A | B | C | D`, `::: columns`, `::skills [...]`
    │   └── ast-builder.js            # Builds normalized ResumeAST for both HTML preview and docx.js export
    ├── layout/
    │   ├── pagination.js             # Calculates exact page heights, places visual page-break markers, Paged.js hook
    │   ├── fit-to-page.js            # Iterative solver adjusting line-height, gaps, and margins to fit N pages
    │   └── splitter.js               # Draggable split-pane divider + Tri-Mode switcher (Split / Editor / Preview)
    ├── audit/
    │   ├── ats-linter.js             # Real-time ATS compliance engine (headers, contact tokens, font size, SVGs)
    │   └── contrast.js               # WCAG 2.1 AA relative luminance & 4.5:1 / 3.0:1 contrast calculator
    ├── io/
    │   ├── import-engine.js          # Drag-and-drop (.md, .txt, .json), overwrite guard modal
    │   ├── heuristic-splitter.js     # Converts raw unformatted pasted text into structured Resume Markdown
    │   ├── json-resume.js            # Bidirectional JSON Resume (jsonresume.org) importer & exporter
    │   ├── pdf-export.js             # Print isolation & Paged.js vector PDF export orchestrator
    │   └── docx-export.js            # Full ResumeAST -> OpenXML (.docx) compiler with twip geometry & tables
    ├── templates/
    │   ├── registry.js               # Metadata, default pairings, and CSS variable mappings for 8 templates
    │   └── starters.js               # 4 full-length starter resumes (Student, Mid-SWE, Senior Mgmt, Academic CV)
    └── ui/
        ├── editor.js                 # Syntax-highlighted markdown/YAML editor, line operations, shortcuts
        ├── toolbar.js                # Top bar: document title, tri-mode toggle, template selector, export menu
        ├── design-panel.js           # Typography, color pickers + WCAG badge, spacing sliders, Fit-to-Page button
        ├── workspace-drawer.js       # Multi-resume drawer (create, clone, rename, delete) + 50-snapshot history UI
        └── ats-panel.js              # Interactive ATS score & actionable lint warnings drawer
```

---

## 3. Data Schema & State Management Architecture

### 3.1 Normalized Document Schema (`src/state/schema.js`)

Every resume document in memory and persisted to IndexedDB MUST adhere to the following normalized schema:

```javascript
/**
 * @typedef {Object} ResumeDocument
 * @property {string} id - Unique identifier (e.g., "res_8f92a10b")
 * @property {string} title - Workspace-visible document title
 * @property {number} createdAt - Epoch timestamp (ms)
 * @property {number} updatedAt - Epoch timestamp (ms)
 * @property {DocumentConfig} config - Synchronized styling and layout parameters
 * @property {DocumentMetadata} metadata - Contact & identity metadata synced with YAML frontmatter
 * @property {string} rawMarkdown - Complete raw source string (including `---` YAML frontmatter + Markdown body)
 */

export const DEFAULT_DOCUMENT_CONFIG = {
  template: "modern-minimal",     // modern-minimal | classic-ivy | executive-compact | split-sidebar | tech-mono | swiss-grid | academic-cv | creative-accent
  paper: "letter",                // "letter" (8.5in x 11in) | "a4" (210mm x 297mm)
  targetPages: 1,                 // 1 | 2 (used by Fit-to-Page & overflow indicators)
  margins: 0.5,                   // inches: [0.35 .. 1.0], step 0.05, default 0.5
  fontSize: 10,                   // points: [9.0 .. 12.0], step 0.25, default 10
  lineHeight: 1.30,               // unitless: [1.15 .. 1.55], step 0.01, default 1.30
  sectionSpacing: 14,             // px: [6 .. 28], step 1, default 14
  itemSpacing: 6,                 // px: [2 .. 16], step 1, default 6
  bulletSpacing: 3,               // px: [1 .. 8], step 1, default 3
  primaryFont: "Inter",           // Body font family
  headerFont: "Merriweather",     // Heading font family
  monoFont: "JetBrains Mono",     // Metadata/badge monospace font
  inkColor: "#111827",            // Primary body text color
  mutedColor: "#4b5563",          // Secondary metadata/date color
  accentColor: "#1e3a8a",         // Brand/heading/rule accent color
  canvasColor: "#ffffff",         // Paper background color
  spacingPreset: "comfortable",   // compact | comfortable | spacious | custom
  dateFormat: "MM/YYYY - Present"
};
```

### 3.2 Snapshot History Schema (`src/state/db.js`)

To satisfy **US-4.2** (up to 50 local snapshots with timestamps and one-click rollbacks):
- IndexedDB stores two primary logical collections using `idb-keyval` custom store (`resume-builder-db`):
  1. `documents:index` → Array of `{ id, title, updatedAt, template }`
  2. `document:{id}` → Full `ResumeDocument` object
  3. `history:{id}` → Ring buffer array (max length `50`) of `SnapshotEntry`:
     ```javascript
     {
       snapshotId: "snap_1792497600123",
       timestamp: 1792497600123,
       trigger: "auto" | "manual" | "pre-import" | "pre-rollback",
       summary: "Edited Experience (1,420 words)",
       config: { ... },
       rawMarkdown: "..."
     }
     ```
- **Auto-Save vs. Snapshot Cadence:**
  - `document:{id}` is saved automatically **500ms** after the last keystroke or config change (`US-4.2 AC-1`).
  - A new `SnapshotEntry` is pushed to `history:{id}` whenever:
    1. User presses `Ctrl/Cmd + S` ("Manual Snapshot"),
    2. Prior to any file import or rollback (`pre-import`, `pre-rollback`),
    3. Automatically during editing when at least 60 seconds have elapsed or >120 characters have changed since the last auto-snapshot, capping the array at 50 items (`snapshots.slice(0, 50)`).

---

## 4. Markup Parsing & Custom Directive Specification (Epic 1)

The parsing pipeline (`src/parser/pipeline.js`) must execute in **under 15ms** on a typical 2-page resume so that debounced typing updates the preview well within the **100ms** budget (`US-1.1 AC-4`).

### 4.1 Step 1: YAML Frontmatter Extraction & Two-Way Sync (`src/parser/frontmatter.js`)
- Match leading `^---\r?\n([\s\S]*?)\r?\n---\r?\n?` at the top of `rawMarkdown`.
- Parse YAML safely via `js-yaml.load()`. If YAML is malformed while the user is mid-keystroke:
  - Do **not** crash or blank the preview; retain the last valid `config`/`metadata` state and display a subtle non-blocking syntax badge in the editor status bar with the line number.
- Map YAML `settings:` keys (`template`, `paper`, `margins`, `fontPrimary`, `fontHeader`, `accentColor`, `spacingPreset`, etc.) to `DocumentConfig`.
- Generate the semantic `<header class="resume-header">` block automatically from YAML `name`, `title`, `summary`, and `contact` (`phone`, `email`, `location`, `linkedin`, `github`, `website`, `portfolio`), formatting contact links with clickable `mailto:`, `tel:`, and `https://` `<a>` tags so ATS parsers and PDF exports preserve live links (`US-5.1 AC-3`).

### 4.2 Step 2: Extended Resume Shorthands & Directives (`src/parser/directives.js`)

Before or during CommonMark tokenization, transform the following domain-specific syntax constructs into both semantic HTML and structured `ResumeAST` nodes:

1. **Pipe-Delimited Role / Entry Header (`US-1.2 AC-1, AC-2`):**
   - **Syntax:** `### Role or Degree | Organization | Location | Date Range` (supports 2, 3, or 4 pipe-separated segments):
     - **4 segments:** `Title | Organization | Location | Dates` *(supports flexible ordering: if segment 3 looks like a date range and segment 4 looks like a location, detect or preserve consistent left/right alignment)*
     - **3 segments:** `Title | Organization | Dates`
     - **2 segments:** `Title | Dates`
   - **Rendered Semantic HTML:**
     ```html
     <div class="resume-entry-header" role="group" aria-label="Senior Software Engineer at Acme Corp, 2021–Present, Remote">
       <div class="entry-header-primary">
         <h3 class="entry-title">Senior Software Engineer</h3>
         <span class="entry-sep" aria-hidden="true">•</span>
         <span class="entry-org">Acme Corp</span>
       </div>
       <div class="entry-header-meta">
         <span class="entry-location">Remote</span>
         <span class="entry-date">2021–Present</span>
       </div>
     </div>
     ```
   - **Experience Item Grouping (`US-3.2 AC-1`):**
     - Automatically wrap each `### ...` entry and its immediately following paragraphs/bullet list into `<article class="resume-item" style="break-inside: avoid;">...</article>` so neither `Paged.js` nor browser print ever splits a single role mid-header, and headings have `break-after: avoid`.

2. **Skill Capsules & Bracketed Tag Lists (`US-1.2 AC-3`):**
   - **Syntax A (Directive):** `::skills [React, TypeScript, GraphQL, Rust]` or `::skills Category: [Python, Go, Kubernetes]`
   - **Syntax B (Standalone Bracketed Tag Line):** `[Python, Rust, Docker, AWS]`
   - **Rendered Semantic HTML:**
     ```html
     <div class="resume-skills-group">
       <span class="skills-category">Category:</span>
       <ul class="resume-skill-tags" aria-label="Skills">
         <li class="skill-tag">Python</li>
         <li class="skill-tag">Go</li>
         <li class="skill-tag">Kubernetes</li>
       </ul>
     </div>
     ```

3. **Container Directives (`US-1.1 AC-3`):**
   - **Multi-Column Block:**
     ```markdown
     ::: columns 2
     #### Core Technical Skills
     - Distributed Systems
     - Consensus Protocols
     |||
     #### Certifications
     - AWS Solutions Architect Professional
     - CKA (Certified Kubernetes Administrator)
     :::
     ```
     *(Also supports `::: layout-columns 2` ... `::: end` or automatic child splitting when `|||` column break is omitted).*
     Renders as `<div class="resume-columns resume-columns-2" style="--col-count: 2">...</div>`.
   - **Right-Aligned Date Line (`::: date-right`):**
     `::: date-right Left Content | Right Date :::` or block form.
   - **Sidebar Marker (for Split-Sidebar Template):**
     Sections matching `Skills`, `Education`, `Certifications`, `Languages`, `Interests`, or explicitly wrapped in `::: sidebar` are routed to the sidebar slot when the `split-sidebar` template is active, while staying in standard single-column reading order for single-column templates and ATS DOM order.

---

## 5. Template Design, Typography & Color Engine (Epic 2)

### 5.1 Scoped CSS Variable Architecture (`styles/preview-engine.css`)

All styling customizations are applied as scoped CSS custom properties on `#resume-preview-root` so switching templates or adjusting sliders updates rendering at 60fps with zero DOM re-parsing required:

```css
#resume-preview-root {
  --resume-paper-width: 8.5in;
  --resume-paper-height: 11in;
  --resume-margin: 0.5in;
  --resume-font-size: 10pt;
  --resume-line-height: 1.30;
  --resume-section-gap: 14px;
  --resume-item-gap: 6px;
  --resume-bullet-gap: 3px;
  --resume-font-primary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --resume-font-header: 'Merriweather', Georgia, serif;
  --resume-font-mono: 'JetBrains Mono', monospace;
  --resume-color-ink: #111827;
  --resume-color-muted: #4b5563;
  --resume-color-accent: #1e3a8a;
  --resume-color-accent-tint: rgba(30, 58, 138, 0.08);
  --resume-color-canvas: #ffffff;
}
```

### 5.2 Template Specifications (`styles/templates/*.css`)

1. **`modern-minimal` (Modern Minimalist):** Left-aligned bold header, horizontal contact flex bar with subtle dot separators, uppercase tracked `h2` section headers with a 1px bottom border in `--resume-color-accent`, pill-shaped skill capsules.
2. **`classic-ivy` (Traditional Ivy League):** Centered serif header, full-width black/accent horizontal rule under section titles, italic organization/location sub-lines, inline comma-separated skills for classic academic/finance scannability.
3. **`executive-compact` (Executive Compact):** Two-tone top accent bar, dense multi-item spacing, bold metric highlights (`$`, `%`, `x` numbers styled with subtle emphasis), right-aligned tabular dates.
4. **`split-sidebar` (Split Left Sidebar):** CSS Grid `30% 70%` layout where `.resume-page` places contact details, skills, education, and languages in a tinted left column (`background: var(--resume-color-accent-tint)`) and summary/experience/projects in the right 70% column. Crucially, DOM order remains logical for screen readers and ATS parsers.
5. **`tech-mono` (Tech Mono Accent):** Dates, locations, and skill tags rendered in `--resume-font-mono` with subtle border capsules; section headers prefixed with subtle `//` or `01.` technical markers (hidden from screen readers via `aria-hidden="true"`).
6. **`swiss-grid` (Swiss International Grid):** Asymmetric left-hand section labels (`22%` label column, `78%` content column) separated by crisp hairline rules.
7. **`academic-cv` (Academic Curriculum Vitae):** Optimized for multi-page publications, grants, and teaching experience with hanging indents and page number headers on pages 2+.
8. **`creative-accent` (Modern Banner Accent):** Full-bleed header tint block with high-contrast typography and two-column grid highlights.

### 5.3 WCAG 2.1 AA Real-Time Contrast Checker (`src/audit/contrast.js`)

Implement standard WCAG 2.1 relative luminance calculation (`US-2.2 AC-3`):
$$L = 0.2126 \times R_{lin} + 0.7152 \times G_{lin} + 0.0722 \times B_{lin}$$
$$CR = \frac{\max(L_1, L_2) + 0.05}{\min(L_1, L_2) + 0.05}$$
- Compute contrast ratios continuously for:
  1. `inkColor` vs. `canvasColor` (Required: $\ge 4.5:1$)
  2. `mutedColor` vs. `canvasColor` (Required: $\ge 4.5:1$)
  3. `accentColor` vs. `canvasColor` (Required: $\ge 4.5:1$ for normal text, $\ge 3.0:1$ for large headings)
- If any pair drops below `4.5:1`, display a real-time warning badge in the Color Customizer with a one-click **"Auto-Fix Accessible Contrast"** button that darkens/lightens the offending hex color to meet `4.6:1`.

---

## 6. Layout, Spacing, Fit-to-Page & ATS Optimization (Epic 3)

### 6.1 Exact 1:1 Paper Calibration & Visual Page Boundary Tracker (`src/layout/pagination.js`)

- **Paper Dimensions at 96 CSS px/inch:**
  - `letter`: Width `8.5in` (`816px`), Height `11in` (`1056px`)
  - `a4`: Width `210mm` (`793.7px`), Height `297mm` (`1122.5px`)
- **Live Page-Fit & Overflow Indicator (`US-3.1 AC-3`):**
  - Measure total rendered content height inside `.resume-sheet` and simulate exact page breaks respecting `break-inside: avoid` on `.resume-item` and `break-after: avoid` on `h2, h3`.
  - Render explicit visual page-break dashed divider lines across the preview canvas at each page boundary (`Page 1 Ends — 11.0in` / `Page 2 Starts`), plus a status pill in the top toolbar:
    - Green: `1.0 / 1 Page (92% full)`
    - Amber/Red Overflow Warning: `1.14 Pages — Overflow by 1.3in (Use "Fit to 1 Page")`.

### 6.2 Deterministic "Fit-to-Page" Auto-Scaler (`src/layout/fit-to-page.js`)

When the user clicks **"Fit to 1 Page"** (or **"Fit to 2 Pages"**) (`US-3.1 AC-2`):
1. Read target height $H_{\text{target}} = N \times H_{\text{page}} - 2 \times \text{marginPx}$.
2. If current content height $H_{\text{current}} > H_{\text{target}}$, run a bounded, proportional multi-parameter optimization loop (up to 12 iterations within a single `requestAnimationFrame` batch using synchronous layout reads):
   - **Priority 1 (Micro-gaps):** Reduce `sectionSpacing` (down to safe floor `8px`), `itemSpacing` (down to `3px`), and `bulletSpacing` (down to `1px`).
   - **Priority 2 (Vertical Rhythm):** Reduce `lineHeight` in `0.02` increments down to safe floor `1.16`.
   - **Priority 3 (Margins):** Reduce `margins` in `0.05in` increments down to safe floor `0.38in`.
   - **Priority 4 (Base Font Scale):** Reduce `fontSize` in `0.25pt` increments down to the ATS legibility floor of `9.0pt`.
3. Update both the UI sliders and YAML frontmatter, and show a toast summary (e.g., *"Fitted to 1 Page: margins 0.45in, line-height 1.22, section gap 10px"*).
4. Provide an immediate **"Undo Fit"** button to restore previous spacing settings.

### 6.3 ATS Compliance Validation Linter (`src/audit/ats-linter.js`)

Run a real-time audit after every AST update and calculate an **ATS Readiness Score (0–100%)** with categorized findings:
1. **Contact Information Checks:**
   - Missing or unlinked email address (`/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/`).
   - Missing phone number.
   - Missing location or LinkedIn/GitHub profile link.
2. **Standard Section Header Recognition:**
   - Check `h2` headings against standard ATS taxonomy (`Experience` / `Work Experience` / `Employment`, `Education`, `Skills` / `Technical Skills`, `Projects`, `Certifications`, `Summary` / `Professional Summary`).
   - Flag non-standard creative headers (e.g., *"Where I've Been"*, *"My Superpowers"*) and offer a one-click rename to the standard ATS equivalent.
3. **Typography & Density Guardrails:**
   - Warn if `fontSize < 9pt` (illegibility threshold).
   - Warn if `margins < 0.35in` (printer clipping risk).
   - Warn if any bullet point exceeds 300 characters or lacks action-oriented structure.
4. **Structural & DOM Checks:**
   - Flag raw `<svg>`, `<img>` without `alt`, or complex nested tables that degrade older ATS parsers.

---

## 7. Data Import, Heuristics & Local-First Persistence (Epic 4)

### 7.1 Multi-Format Import & Overwrite Protection (`src/io/import-engine.js`)
- Support both a toolbar **"Import"** button and full-window drag-and-drop overlay accepting `.md`, `.txt`, and `.json`, plus a **"Paste Raw Resume Text"** modal (`US-4.1 AC-1`).
- **Overwrite Confirmation Guard (`US-4.1 AC-3`):**
  - If the active document has unsaved/non-default edits, always prompt the user with a modal offering:
    1. **Import as New Document in Workspace** *(Recommended default)*
    2. **Overwrite Current Document (Auto-saves a snapshot first)**
    3. **Cancel**

### 7.2 Raw Text Heuristic Splitter (`src/io/heuristic-splitter.js`)
When a user drops a `.txt` file or pastes unformatted text from an old PDF/Word resume (`US-4.1 AC-2`):
1. **Header & Contact Extraction:** Inspect the first 1–6 non-empty lines for name, email, phone, location, LinkedIn, and GitHub URLs; populate the YAML frontmatter block automatically.
2. **Section Header Detection:** Identify standalone lines matching known section patterns (case-insensitive, ALL CAPS, or trailing colon) such as `EXPERIENCE`, `WORK HISTORY`, `EDUCATION`, `SKILLS`, `TECHNICAL SKILLS`, `PROJECTS`, `CERTIFICATIONS`, `SUMMARY`, and convert them to `## Standard Heading`.
3. **Role & Date Line Detection:** Identify lines containing date ranges (e.g., `(Jan|Feb|...|20\d{2})\s*[-–—to]+\s*(Present|Current|20\d{2})`) paired with job titles/organizations and rewrite them into the pipe-delimited shorthand `### Role | Company | Location | Date Range`.
4. **Bullet Normalization:** Convert lines starting with `•`, `·`, `▪`, `*`, `-`, or `>` into clean `- ` Markdown bullets, and convert comma-separated skill blocks into `::skills [...]`.

### 7.3 JSON Resume Bidirectional Adapter (`src/io/json-resume.js`)
- **Import (`jsonResumeToMarkdown(json)`):** Maps official `jsonresume.org` schema keys (`basics`, `work`, `education`, `skills`, `projects`, `awards`, `certificates`, `publications`, `volunteer`, `languages`) into our YAML frontmatter + extended Markdown shorthand.
- **Export (`astToJsonResume(ast, metadata)`):** Exports the current document back into a valid, schema-compliant `resume.json` file.

---

## 8. Exact-Fidelity Export Pipeline: PDF & DOCX (Epic 5)

### 8.1 Vector-Identical PDF Engine (`src/io/pdf-export.js` & `styles/print.css`)

To satisfy **US-5.1**:
1. **Dynamic `@page` Injection:**
   - Dynamically maintain a `<style id="dynamic-page-style">` element in `<head>` synchronized with `config.paper`:
     ```css
     @page {
       size: letter portrait; /* or A4 portrait */
       margin: 0mm;
     }
     ```
2. **Print Isolation (`styles/print.css`):**
   - Under `@media print`, hide `#app-toolbar`, `#editor-pane`, `#side-drawers`, `.page-break-indicator`, and `.ui-chrome` (`display: none !important`).
   - Reset `html, body` to `margin: 0; padding: 0; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact;`.
   - Render each `.resume-page` container at exact physical dimensions with `page-break-after: always; break-after: page;` (except `:last-child`).
3. **Paged.js Orchestration:**
   - Provide a **"Preview Print Pagination (Paged.js)"** toggle and automatic pre-print pass using `Paged.Previewer` so multi-page documents calculate exact CSS `@page` boxes, footnotes/running headers (for Academic CV), and orphan/widow rules (`orphans: 2; widows: 2; break-inside: avoid;`) before invoking `window.print()`.

### 8.2 Native Structured `.docx` Compiler (`src/io/docx-export.js`)

To satisfy **US-5.2**, build a deterministic compiler translating `ResumeAST` + `DocumentConfig` into a genuine Word OpenXML `.docx` binary using `docx.js`:
1. **Exact Unit Conversions (Twips & Half-Points):**
   - `1 inch = 1440 twips` → `marginTwips = Math.round(config.margins * 1440)`
   - `1 pt = 2 half-points` → `fontSizeHalfPt = Math.round(config.fontSize * 2)`
   - `1 px = 15 twips` (at 96 DPI) → `sectionGapTwips = Math.round(config.sectionSpacing * 15)`, `itemGapTwips = Math.round(config.itemSpacing * 15)`
   - Line spacing: `Math.round(config.lineHeight * 240)` (`lineRule: LineRuleType.AUTO`).
2. **Native Word Styles & Outline Hierarchy (`US-5.2 AC-1`):**
   - Configure `styles.paragraphStyles` for `Title`, `Heading1` (`HeadingLevel.HEADING_1`), `Heading2` (`HeadingLevel.HEADING_2`), `Normal`, and `ListBullet` using the user's chosen `headerFont`, `primaryFont`, `inkColor`, and `accentColor` (stripped of `#`).
3. **Borderless Table Layouts for Right-Aligned Dates & Multi-Column Blocks (`US-5.2 AC-3`):**
   - For every `resume-entry-header` (`### Title | Company | Location | Dates`), generate either a right-aligned tab stop at the exact printable width (`pageWidthTwips - 2 * marginTwips`) OR a 2-column borderless `Table` (`width: 100%`, explicit `columnWidths` in DXA/twips, `Borders.NONE`) with left-aligned `Title — Company` and right-aligned `Location | Dates` so Microsoft Word, Google Docs, and enterprise ATS parsers never wrap or overlap text.
   - For `::: columns 2` or the `split-sidebar` template, generate a native borderless `Table` with explicit DXA column widths matching the template proportions (e.g., `50% / 50%` or `30% / 70%`).
   - Preserve clickable hyperlinks using `ExternalHyperlink` nodes.

---

## 9. Offline PWA & Zero-Build Vendor Strategy (Epic 6)

### 9.1 Local Vendor Bundle & Fallback Loader (`src/vendor/loader.js`)
- All third-party libraries (`marked`, `js-yaml`, `DOMPurify`, `docx`, `pagedjs`, `idb-keyval`) MUST be placed in `/vendor/` during workspace setup so the app works immediately offline with zero external network dependency (`US-6.1 AC-2, AC-3`).
- If a user deploys to an environment where a vendor file is missing, `loader.js` gracefully falls back to pinned CDN ESM URLs (`cdn.jsdelivr.net`) and caches the response in the Service Worker.

### 9.2 Service Worker (`sw.js`) & `manifest.json`
- **Precache Manifest (`CACHE_NAME = 'resume-builder-v1'`):**
  - Pre-caches `index.html`, `manifest.json`, all `/styles/*.css`, all `/src/**/*.js`, all `/vendor/*`, and `/vendor/fonts/*` on the `install` event (`US-6.1 AC-1`).
- **Fetch Strategy:**
  - **Vendor & Font Assets:** *Cache-First* for instant sub-millisecond load times and guaranteed offline availability.
  - **App Shell (`.html`, `.js`, `.css`):** *Stale-While-Revalidate* (or *Cache-First* with background update notification) so offline refreshes always succeed immediately.

---

## 10. Phased Execution Plan & Verification Checklist

The executing agent MUST implement and verify the project in the following four sequential phases:

### Phase 1: Foundation, Vendor Mirroring & Core Parsing Engine
1. Create directory structure (`/src`, `/styles`, `/styles/templates`, `/vendor`, `/vendor/fonts`).
2. Populate `/vendor/` with real, working standalone ES/UMD modules for `marked`, `js-yaml`, `DOMPurify`, `docx`, `paged.polyfill.js`, `idb-keyval`, and local font CSS/WOFF2 assets.
3. Implement `src/state/schema.js` and `src/state/store.js`.
4. Implement `src/parser/frontmatter.js`, `src/parser/directives.js`, `src/parser/ast-builder.js`, and `src/parser/pipeline.js`.
5. Build `index.html` and `styles/main.css` with the Tri-Mode split screen (`Editor | Draggable Divider | Live Preview`) and keyboard shortcuts (`Ctrl/Cmd+S`, `Ctrl/Cmd+P`, `Ctrl/Cmd+B`, `Ctrl/Cmd+I`, `Alt+Up/Down`).

### Phase 2: Templates, Typography, Color Contrast & Pagination Engine
1. Implement `styles/preview-engine.css` and all 8 template stylesheets in `styles/templates/*.css` (`modern-minimal`, `classic-ivy`, `executive-compact`, `split-sidebar`, `tech-mono`, `swiss-grid`, `academic-cv`, `creative-accent`).
2. Build `src/ui/design-panel.js` with font pairing presets, color pickers, and micro-spacing sliders (`Page Margin`, `Section Gap`, `Item Gap`, `Bullet Gap`, `Base Font Size`, `Line Height`).
3. Implement `src/audit/contrast.js` (real-time WCAG 2.1 AA 4.5:1 contrast badge + one-click auto-fix).
4. Implement `src/layout/pagination.js` (Letter/A4 1:1 canvas, page-break indicator lines, overflow tracker) and `src/layout/fit-to-page.js` ("Fit to 1 Page" / "Fit to 2 Pages" auto-scaler).

### Phase 3: ATS Linter, Multi-Format Import & High-Fidelity Export (PDF & DOCX)
1. Implement `src/audit/ats-linter.js` and `src/ui/ats-panel.js` with real-time scoring and actionable fixes.
2. Implement `src/io/heuristic-splitter.js`, `src/io/json-resume.js`, and `src/io/import-engine.js` (drag-and-drop `.md`, `.txt`, `.json` + overwrite confirmation dialog).
3. Implement `src/templates/starters.js` with 4 rich, realistic starter templates (Entry-Level/Student, Mid-Career SWE, Senior Engineering Manager/Executive, Academic CV).
4. Implement `styles/print.css` and `src/io/pdf-export.js` (`@page` injection + `Paged.js` integration).
5. Implement `src/io/docx-export.js` (`docx.js` AST compiler with exact twip spacing, Heading styles, borderless tables, and clickable links).

### Phase 4: IndexedDB Persistence, Version History, PWA & End-to-End Verification
1. Implement `src/state/db.js` and `src/ui/workspace-drawer.js` (500ms auto-save, multi-resume management, clone/rename/delete, and 50-snapshot version history with 1-click rollback).
2. Implement `manifest.json` and `sw.js` and register the Service Worker in `src/app.js`.
3. **Mandatory Verification Gate:**
   - Serve the root directory over local HTTP (e.g., `python3 -m http.server 8080`).
   - Verify all 6 Epics and 12 User Stories (`US-1.1` through `US-6.1`):
     - [ ] Typing updates preview in <100ms; YAML frontmatter and UI controls sync bi-directionally.
     - [ ] `### Title | Company | Location | Dates`, `::skills [...]`, and `::: columns` render semantic HTML with `break-inside: avoid`.
     - [ ] Switching across all templates preserves user content and custom colors/fonts.
     - [ ] Low-contrast color selection triggers the `< 4.5:1` WCAG alert and one-click fix.
     - [ ] "Fit to Page" eliminates overflow onto page 2 within safe typography bounds.
     - [ ] Dropping `.md`, `.txt`, and `.json` files parses accurately after confirmation prompt.
     - [ ] IndexedDB auto-saves after 500ms and records up to 50 snapshots with rollback.
     - [ ] PDF print/export isolates the paper canvas cleanly with selectable text and live links.
     - [ ] `.docx` export generates a valid Word file with Heading styles, twip margins, and borderless tables.
     - [ ] Offline mode (Service Worker active) loads all scripts, templates, and fonts with zero failed requests.
