/**
 * Interactive HTML Website Exporter
 * Compiles a resume into a standalone, single-file interactive web portfolio
 * featuring dynamic skill filtering, keyword search, web/paper view modes,
 * theme switching, quantitative metric highlights, and vCard generation.
 */

export function compileInteractiveHtml(ast = {}, metadata = {}, config = {}, rawHtml = '') {
  const meta = ast.metadata || metadata || {};
  const cfg = ast.config || config || {};
  const sections = ast.sections || [];
  const contact = meta.contact || {};

  const name = meta.name || 'Resume Portfolio';
  const title = meta.title || 'Professional Resume';
  const summary = meta.summary || '';
  const accent = cfg.accentColor || '#1e3a8a';
  const template = cfg.template || 'modern-minimal';
  const primaryFont = cfg.primaryFont || 'Inter';
  const headerFont = cfg.headerFont || 'Inter';
  const monoFont = cfg.monoFont || 'JetBrains Mono';

  // Gather unique skill tags for the interactive filter
  const allSkills = new Set();
  sections.forEach(s => {
    s.items.forEach(item => {
      if (item.type === 'skills' && Array.isArray(item.tags)) {
        item.tags.forEach(t => allSkills.add(t.trim()));
      }
    });
  });

  // Safe JSON-LD schema
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: name,
    jobTitle: title,
    description: summary,
    email: contact.email || undefined,
    telephone: contact.phone || undefined,
    url: contact.website || undefined,
    sameAs: [contact.linkedin, contact.github].filter(Boolean)
  }, null, 2);

  // Build interactive timeline HTML from sections
  const sectionsHtml = sections.map((sec, secIdx) => {
    const slug = sec.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const itemsHtml = sec.items.map((item, itemIdx) => {
      if (item.type === 'entry') {
        const itemSkills = Array.isArray(item.bullets)
          ? item.bullets.join(' ').toLowerCase()
          : '';
        const bulletsHtml = item.bullets && item.bullets.length > 0 ? `
          <ul class="entry-bullets">
            ${item.bullets.map(b => `<li>${highlightMetrics(escapeHtml(b))}</li>`).join('\n')}
          </ul>
        ` : '';

        const paragraphsHtml = item.paragraphs && item.paragraphs.length > 0 ? `
          <div class="entry-paragraphs">
            ${item.paragraphs.map(p => `<p>${highlightMetrics(escapeHtml(p))}</p>`).join('\n')}
          </div>
        ` : '';

        return `
          <article class="timeline-card" data-keywords="${escapeHtml(itemSkills)}" data-entry-id="e-${secIdx}-${itemIdx}">
            <div class="card-timeline-node" aria-hidden="true"></div>
            <div class="card-header">
              <div class="card-title-group">
                <h3 class="entry-title">${escapeHtml(item.title)}</h3>
                ${item.org ? `<span class="entry-org">${escapeHtml(item.org)}</span>` : ''}
              </div>
              <div class="card-meta">
                ${item.location ? `<span class="entry-loc">${escapeHtml(item.location)}</span>` : ''}
                ${item.date ? `<span class="entry-badge date-badge">${escapeHtml(item.date)}</span>` : ''}
              </div>
            </div>
            <div class="card-body">
              ${paragraphsHtml}
              ${bulletsHtml}
            </div>
          </article>
        `;
      } else if (item.type === 'skills') {
        return `
          <div class="skill-category-block">
            ${item.category ? `<h4 class="skill-category-title">${escapeHtml(item.category)}</h4>` : ''}
            <div class="skill-chips-row">
              ${(item.tags || []).map(tag => `
                <button class="skill-chip" data-skill="${escapeHtml(tag)}" title="Click to filter experience matching ${escapeHtml(tag)}">
                  ${escapeHtml(tag)}
                </button>
              `).join('')}
            </div>
          </div>
        `;
      } else if (item.type === 'list') {
        return `
          <ul class="standalone-list">
            ${item.items.map(b => `<li>${highlightMetrics(escapeHtml(b))}</li>`).join('')}
          </ul>
        `;
      } else if (item.type === 'paragraph') {
        return `<p class="standalone-para">${highlightMetrics(escapeHtml(item.text))}</p>`;
      }
      return '';
    }).join('\n');

    return `
      <section id="${slug}" class="resume-web-section" data-section-name="${escapeHtml(sec.title)}">
        <div class="section-heading-row">
          <h2 class="section-title">${escapeHtml(sec.title)}</h2>
          <span class="section-rule" aria-hidden="true"></span>
        </div>
        <div class="section-content">
          ${itemsHtml}
        </div>
      </section>
    `;
  }).join('\n');

  // Contact items for hero header
  const contactLinks = [];
  if (contact.email) {
    contactLinks.push(`<a class="contact-pill" href="mailto:${escapeHtml(contact.email)}"><span class="icon">✉</span> ${escapeHtml(contact.email)}</a>`);
  }
  if (contact.phone) {
    contactLinks.push(`<a class="contact-pill" href="tel:${escapeHtml(contact.phone.replace(/[^\d+]/g, ''))}"><span class="icon">☎</span> ${escapeHtml(contact.phone)}</a>`);
  }
  if (contact.location) {
    contactLinks.push(`<span class="contact-pill"><span class="icon">📍</span> ${escapeHtml(contact.location)}</span>`);
  }
  if (contact.website) {
    const href = contact.website.startsWith('http') ? contact.website : `https://${contact.website}`;
    contactLinks.push(`<a class="contact-pill" href="${href}" target="_blank" rel="noopener"><span class="icon">🔗</span> ${escapeHtml(contact.website.replace(/^https?:\/\//, ''))}</a>`);
  }
  if (contact.linkedin) {
    const href = contact.linkedin.startsWith('http') ? contact.linkedin : `https://${contact.linkedin}`;
    contactLinks.push(`<a class="contact-pill" href="${href}" target="_blank" rel="noopener"><span class="icon">in</span> LinkedIn</a>`);
  }
  if (contact.github) {
    const href = contact.github.startsWith('http') ? contact.github : `https://${contact.github}`;
    contactLinks.push(`<a class="contact-pill" href="${href}" target="_blank" rel="noopener"><span class="icon">gh</span> GitHub</a>`);
  }

  // Generate complete standalone HTML
  return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(name)} — ${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(summary || `${name} - ${title}`)}">
  <meta property="og:title" content="${escapeHtml(name)} — ${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(summary)}">
  <meta property="og:type" content="profile">
  
  <!-- Google Fonts Progressive Enhancement -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Merriweather:ital,wght@0,300;0,400;0,700;1,300&family=JetBrains+Mono:wght@400;500;600&family=EB+Garamond:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">

  <script type="application/ld+json">
${jsonLd}
  </script>

  <style>
    :root {
      --color-brand: ${accent};
      --color-brand-glow: ${accent}22;
      --font-body: '${primaryFont}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --font-head: '${headerFont}', Georgia, serif;
      --font-mono: '${monoFont}', monospace;
      
      /* Light theme */
      --bg-base: #f8fafc;
      --bg-card: #ffffff;
      --bg-surface-elevated: #f1f5f9;
      --border-subtle: #e2e8f0;
      --border-strong: #cbd5e1;
      --text-main: #0f172a;
      --text-sub: #475569;
      --text-faint: #64748b;
      --card-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.08);
      --card-shadow-hover: 0 12px 28px -4px rgba(15, 23, 42, 0.12);
      --radius-sm: 6px;
      --radius-md: 10px;
      --radius-lg: 16px;
      --nav-height: 60px;
    }

    [data-theme="dark"] {
      --bg-base: #090d16;
      --bg-card: #111827;
      --bg-surface-elevated: #1e293b;
      --border-subtle: #1e293b;
      --border-strong: #334155;
      --text-main: #f8fafc;
      --text-sub: #cbd5e1;
      --text-faint: #94a3b8;
      --card-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.4);
      --card-shadow-hover: 0 12px 28px -4px rgba(0, 0, 0, 0.6);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body {
      font-family: var(--font-body);
      background-color: var(--bg-base);
      color: var(--text-main);
      line-height: 1.6;
      transition: background-color 0.2s ease, color 0.2s ease;
      min-height: 100vh;
    }

    /* Top Progress Bar */
    #reading-progress {
      position: fixed;
      top: 0;
      left: 0;
      height: 3px;
      background: var(--color-brand);
      width: 0%;
      z-index: 1000;
      transition: width 0.1s linear;
    }

    /* Sticky Navigation */
    .web-navbar {
      position: sticky;
      top: 0;
      height: var(--nav-height);
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border-subtle);
      z-index: 900;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      transition: background 0.2s ease, border-color 0.2s ease;
    }
    [data-theme="dark"] .web-navbar {
      background: rgba(17, 24, 39, 0.85);
    }

    .nav-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 700;
      color: var(--text-main);
      text-decoration: none;
      font-size: 15px;
    }
    .brand-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--color-brand);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 800;
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 6px;
      list-style: none;
    }
    @media (max-width: 768px) {
      .nav-links { display: none; }
    }
    .nav-link-btn {
      color: var(--text-sub);
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
      padding: 6px 12px;
      border-radius: var(--radius-sm);
      transition: all 0.15s ease;
    }
    .nav-link-btn:hover, .nav-link-btn.is-active {
      color: var(--color-brand);
      background: var(--color-brand-glow);
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .nav-btn {
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      color: var(--text-main);
      font-size: 12px;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
      text-decoration: none;
    }
    .nav-btn:hover {
      background: var(--border-strong);
      color: var(--text-main);
    }
    .nav-btn-primary {
      background: var(--color-brand);
      color: #fff;
      border-color: var(--color-brand);
    }
    .nav-btn-primary:hover {
      opacity: 0.92;
      color: #fff;
    }

    /* Container */
    .web-container {
      max-width: 960px;
      margin: 0 auto;
      padding: 40px 24px 80px 24px;
    }

    /* Hero Card */
    .hero-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 40px;
      box-shadow: var(--card-shadow);
      margin-bottom: 32px;
      position: relative;
      overflow: hidden;
    }
    .hero-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: var(--color-brand);
    }
    .hero-name {
      font-family: var(--font-head);
      font-size: 2.6rem;
      font-weight: 800;
      line-height: 1.15;
      color: var(--text-main);
      letter-spacing: -0.02em;
    }
    .hero-headline {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--color-brand);
      margin-top: 6px;
    }
    .hero-summary {
      font-size: 1.05rem;
      color: var(--text-sub);
      line-height: 1.65;
      margin-top: 16px;
      max-width: 780px;
    }
    .hero-contact-row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 24px;
    }
    .contact-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 500;
      padding: 6px 14px;
      border-radius: 9999px;
      background: var(--bg-surface-elevated);
      color: var(--text-sub);
      text-decoration: none;
      border: 1px solid var(--border-subtle);
      transition: all 0.15s ease;
    }
    .contact-pill:hover {
      border-color: var(--color-brand);
      color: var(--color-brand);
      background: var(--color-brand-glow);
    }
    .hero-actions-row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid var(--border-subtle);
    }

    /* Filter & Search Bar */
    .filter-bar {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 12px 18px;
      margin-bottom: 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.03);
    }
    .search-input-wrap {
      flex: 1;
      position: relative;
      display: flex;
      align-items: center;
    }
    .search-input {
      width: 100%;
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      padding: 8px 12px 8px 36px;
      border-radius: var(--radius-sm);
      color: var(--text-main);
      font-size: 13px;
      outline: none;
      transition: border-color 0.15s ease;
    }
    .search-input:focus {
      border-color: var(--color-brand);
    }
    .search-icon {
      position: absolute;
      left: 12px;
      font-size: 14px;
      color: var(--text-faint);
      pointer-events: none;
    }
    .filter-status-banner {
      font-size: 12px;
      color: var(--color-brand);
      font-weight: 600;
      display: none;
      align-items: center;
      gap: 8px;
    }
    .btn-clear-filter {
      background: transparent;
      border: none;
      color: var(--text-faint);
      cursor: pointer;
      text-decoration: underline;
      font-size: 11px;
    }

    /* Section Styles */
    .resume-web-section {
      margin-bottom: 40px;
      scroll-margin-top: 80px;
    }
    .section-heading-row {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;
    }
    .section-title {
      font-family: var(--font-head);
      font-size: 1.4rem;
      font-weight: 700;
      letter-spacing: -0.01em;
      color: var(--text-main);
      white-space: nowrap;
    }
    .section-rule {
      flex: 1;
      height: 1.5px;
      background: var(--border-subtle);
    }

    /* Timeline & Cards */
    .section-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
      position: relative;
    }
    .timeline-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 22px;
      box-shadow: var(--card-shadow);
      transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
      position: relative;
    }
    .timeline-card:hover {
      box-shadow: var(--card-shadow-hover);
      border-color: var(--border-strong);
    }
    .timeline-card.is-filtered-out {
      opacity: 0.15;
      filter: grayscale(1);
      pointer-events: none;
    }
    .timeline-card.is-highlighted {
      border-color: var(--color-brand);
      box-shadow: 0 0 0 2px var(--color-brand-glow);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 12px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }
    .entry-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text-main);
    }
    .entry-org {
      font-weight: 600;
      color: var(--color-brand);
      font-size: 1rem;
      margin-left: 8px;
    }
    .card-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: var(--text-sub);
    }
    .date-badge {
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 600;
      background: var(--bg-surface-elevated);
      padding: 3px 8px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-subtle);
    }

    .entry-bullets {
      padding-left: 20px;
      font-size: 0.95rem;
      color: var(--text-sub);
    }
    .entry-bullets li {
      margin-bottom: 6px;
      line-height: 1.55;
    }
    .entry-paragraphs p {
      font-size: 0.95rem;
      color: var(--text-sub);
      margin-bottom: 8px;
    }

    /* Metric Highlight */
    .metric-highlight {
      background-color: var(--color-brand-glow);
      color: var(--color-brand);
      font-weight: 700;
      padding: 0 4px;
      border-radius: 3px;
    }

    /* Skills Chips */
    .skill-category-block {
      margin-bottom: 14px;
    }
    .skill-category-title {
      font-size: 13px;
      font-weight: 700;
      color: var(--text-faint);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
    }
    .skill-chips-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .skill-chip {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      color: var(--text-sub);
      font-size: 13px;
      font-weight: 500;
      padding: 6px 14px;
      border-radius: 9999px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .skill-chip:hover, .skill-chip.is-active {
      background: var(--color-brand);
      border-color: var(--color-brand);
      color: #ffffff;
      transform: translateY(-1px);
    }

    /* Paper View Sheet */
    #paper-view-container {
      display: none;
      justify-content: center;
      padding: 40px 0;
    }
    .paper-sheet-frame {
      width: 8.5in;
      min-height: 11in;
      background: #ffffff;
      color: #111827;
      padding: 0.5in;
      box-shadow: 0 10px 30px rgba(0,0,0,0.15);
      font-size: 10pt;
      line-height: 1.35;
    }

    /* Toast */
    .web-toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: var(--bg-card);
      border: 1px solid var(--border-strong);
      color: var(--text-main);
      padding: 10px 18px;
      border-radius: var(--radius-sm);
      box-shadow: var(--card-shadow-hover);
      font-size: 13px;
      font-weight: 600;
      display: none;
      z-index: 2000;
      animation: popIn 0.2s ease-out;
    }
    @keyframes popIn {
      from { transform: translateY(12px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    /* Print media */
    @media print {
      #reading-progress, .web-navbar, .filter-bar, .hero-actions-row, .web-toast {
        display: none !important;
      }
      body {
        background: #ffffff !important;
        color: #000000 !important;
      }
      .web-container {
        max-width: 100% !important;
        padding: 0 !important;
      }
      .hero-card, .timeline-card {
        border: none !important;
        box-shadow: none !important;
        padding: 0 0 16px 0 !important;
        break-inside: avoid;
        page-break-inside: avoid;
      }
      .metric-highlight {
        background: transparent !important;
        color: inherit !important;
        font-weight: bold !important;
      }
    }
  </style>
</head>
<body class="template-${escapeHtml(template)}">
  <div id="reading-progress" aria-hidden="true"></div>

  <!-- Sticky Top Navigation -->
  <header class="web-navbar">
    <a href="#" class="nav-brand">
      <div class="brand-avatar">${escapeHtml(name.split(' ').map(n => n[0]).join('').slice(0, 2))}</div>
      <span>${escapeHtml(name)}</span>
    </a>

    <nav aria-label="Sections">
      <ul class="nav-links">
        ${sections.map(s => `
          <li>
            <a class="nav-link-btn" href="#${escapeHtml(s.title.toLowerCase().replace(/[^a-z0-9]/g, '-'))}">
              ${escapeHtml(s.title)}
            </a>
          </li>
        `).join('')}
      </ul>
    </nav>

    <div class="nav-actions">
      <!-- Toggle Web / Paper Mode -->
      <button id="btn-toggle-view" class="nav-btn" title="Toggle between interactive web layout and 1:1 paper resume">
        📄 <span id="view-mode-label">Paper View</span>
      </button>

      <!-- Theme Switcher -->
      <button id="btn-theme-toggle" class="nav-btn" title="Toggle dark/light theme" aria-label="Toggle theme">
        🌙
      </button>

      <!-- Print Button -->
      <button onclick="window.print()" class="nav-btn nav-btn-primary" title="Print or save as PDF">
        🖨️ Print PDF
      </button>
    </div>
  </header>

  <!-- Interactive Web Layout Container -->
  <main id="web-view-container" class="web-container">
    <!-- Hero Profile Card -->
    <header class="hero-card">
      <h1 class="hero-name">${escapeHtml(name)}</h1>
      <div class="hero-headline">${escapeHtml(title)}</div>
      ${summary ? `<p class="hero-summary">${escapeHtml(summary)}</p>` : ''}

      <div class="hero-contact-row">
        ${contactLinks.join('\n')}
      </div>

      <div class="hero-actions-row">
        ${contact.email ? `
          <button id="btn-copy-email" class="nav-btn" data-email="${escapeHtml(contact.email)}">
            📋 Copy Email
          </button>
        ` : ''}
        <button id="btn-download-vcard" class="nav-btn">
          📇 Save Contact (vCard)
        </button>
      </div>
    </header>

    <!-- Search & Skill Filter Bar -->
    <div class="filter-bar">
      <div class="search-input-wrap">
        <span class="search-icon">🔍</span>
        <input type="text" id="keyword-filter-input" class="search-input" placeholder="Search roles, technologies, or keywords..." aria-label="Search resume content">
      </div>
      <div id="filter-status-banner" class="filter-status-banner">
        <span id="filter-status-text"></span>
        <button id="btn-clear-filter" class="btn-clear-filter">Clear</button>
      </div>
    </div>

    <!-- Sections -->
    <div id="interactive-sections-root">
      ${sectionsHtml}
    </div>
  </main>

  <!-- 1:1 Paper Sheet View (Hidden by default) -->
  <div id="paper-view-container">
    <article class="paper-sheet-frame">
      ${rawHtml || sectionsHtml}
    </article>
  </div>

  <div id="web-toast" class="web-toast" aria-live="polite"></div>

  <script>
    (function() {
      // 1. Reading Progress
      const progressBar = document.getElementById('reading-progress');
      window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        if (progressBar) progressBar.style.width = pct + '%';
      }, { passive: true });

      // 2. Dark / Light Theme Toggle
      const themeBtn = document.getElementById('btn-theme-toggle');
      let currentTheme = 'light';
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        currentTheme = 'dark';
        document.documentElement.setAttribute('data-theme', 'dark');
        if (themeBtn) themeBtn.textContent = '☀️';
      }
      themeBtn?.addEventListener('click', () => {
        currentTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', currentTheme);
        themeBtn.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
      });

      // 3. Web View vs Paper View Switcher
      const toggleViewBtn = document.getElementById('btn-toggle-view');
      const webView = document.getElementById('web-view-container');
      const paperView = document.getElementById('paper-view-container');
      const viewLabel = document.getElementById('view-mode-label');
      let isPaperMode = false;

      toggleViewBtn?.addEventListener('click', () => {
        isPaperMode = !isPaperMode;
        if (isPaperMode) {
          webView.style.display = 'none';
          paperView.style.display = 'flex';
          if (viewLabel) viewLabel.textContent = 'Web Portfolio';
        } else {
          webView.style.display = 'block';
          paperView.style.display = 'none';
          if (viewLabel) viewLabel.textContent = 'Paper View';
        }
      });

      // 4. Toast helper
      const toast = document.getElementById('web-toast');
      function showToast(msg) {
        if (!toast) return;
        toast.textContent = msg;
        toast.style.display = 'block';
        setTimeout(() => { toast.style.display = 'none'; }, 2500);
      }

      // 5. Copy Email
      const copyEmailBtn = document.getElementById('btn-copy-email');
      copyEmailBtn?.addEventListener('click', () => {
        const email = copyEmailBtn.getAttribute('data-email');
        if (email) {
          navigator.clipboard.writeText(email).then(() => {
            showToast('Email copied to clipboard: ' + email);
          });
        }
      });

      // 6. Generate and Download vCard (.vcf)
      const vcardBtn = document.getElementById('btn-download-vcard');
      vcardBtn?.addEventListener('click', () => {
        const vcardData = [
          'BEGIN:VCARD',
          'VERSION:3.0',
          'FN:' + ${JSON.stringify(name)},
          'TITLE:' + ${JSON.stringify(title)},
          ${JSON.stringify(contact.email ? `EMAIL;TYPE=INTERNET:${contact.email}` : '')},
          ${JSON.stringify(contact.phone ? `TEL;TYPE=CELL:${contact.phone}` : '')},
          ${JSON.stringify(contact.website ? `URL:${contact.website}` : '')},
          ${JSON.stringify(contact.location ? `ADR;TYPE=HOME:;;${contact.location};;;;` : '')},
          'END:VCARD'
        ].filter(Boolean).join('\\r\\n');

        const blob = new Blob([vcardData], { type: 'text/vcard' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = ${JSON.stringify((name || 'resume').replace(/\s+/g, '_') + '.vcf')};
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        showToast('Downloaded vCard contact file!');
      });

      // 7. Interactive Skill Chip Filtering & Search
      const searchInput = document.getElementById('keyword-filter-input');
      const banner = document.getElementById('filter-status-banner');
      const bannerText = document.getElementById('filter-status-text');
      const clearBtn = document.getElementById('btn-clear-filter');
      const cards = document.querySelectorAll('.timeline-card');
      const skillChips = document.querySelectorAll('.skill-chip');
      let activeSkillFilter = '';

      function applyFilter(query = '') {
        const term = query.toLowerCase().trim();
        let matchCount = 0;

        cards.forEach(card => {
          const text = (card.innerText || '').toLowerCase();
          const keywords = (card.getAttribute('data-keywords') || '').toLowerCase();
          const matches = !term || text.includes(term) || keywords.includes(term);

          if (matches) {
            card.classList.remove('is-filtered-out');
            if (term) {
              card.classList.add('is-highlighted');
              matchCount++;
            } else {
              card.classList.remove('is-highlighted');
            }
          } else {
            card.classList.add('is-filtered-out');
            card.classList.remove('is-highlighted');
          }
        });

        if (term) {
          banner.style.display = 'flex';
          bannerText.textContent = matchCount + ' role(s) matching "' + term + '"';
        } else {
          banner.style.display = 'none';
        }
      }

      searchInput?.addEventListener('input', (e) => {
        activeSkillFilter = '';
        skillChips.forEach(c => c.classList.remove('is-active'));
        applyFilter(e.target.value);
      });

      skillChips.forEach(chip => {
        chip.addEventListener('click', () => {
          const skill = chip.getAttribute('data-skill');
          if (activeSkillFilter === skill) {
            activeSkillFilter = '';
            chip.classList.remove('is-active');
            if (searchInput) searchInput.value = '';
            applyFilter('');
          } else {
            activeSkillFilter = skill;
            skillChips.forEach(c => c.classList.remove('is-active'));
            chip.classList.add('is-active');
            if (searchInput) searchInput.value = skill;
            applyFilter(skill);
          }
        });
      });

      clearBtn?.addEventListener('click', () => {
        activeSkillFilter = '';
        skillChips.forEach(c => c.classList.remove('is-active'));
        if (searchInput) searchInput.value = '';
        applyFilter('');
      });
    })();
  </script>
</body>
</html>`;
}

/**
 * Highlights quantitative metrics and achievements ($140M+, 35%, 65ms, 12,000+)
 */
function highlightMetrics(text = '') {
  // Regex finds percentages, currency figures, and numerical metrics with units
  return text.replace(/(\$\d+[\d,.]*(?:[MKmkBb]|M\+|B\+)?|\b\d+[\d,.]*%\b|\b\d+[\d,.]*\s*(?:ms|sec|x|GB|TB|users|clients|engineers)\b)/g,
    '<mark class="metric-highlight">$1</mark>'
  );
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

/**
 * Compiles and triggers immediate download of the interactive HTML resume
 */
export function exportInteractiveHtml(ast, metadata, config, rawHtml, filename = 'resume.html') {
  const htmlContent = compileInteractiveHtml(ast, metadata, config, rawHtml);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Opens the interactive HTML resume portfolio in a new browser tab for instant preview
 */
export function previewInteractiveHtml(ast, metadata, config, rawHtml) {
  const htmlContent = compileInteractiveHtml(ast, metadata, config, rawHtml);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
