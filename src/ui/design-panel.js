/**
 * Design & Typography Customization Panel
 * Features 12 visual templates with category filters, accessible & readable fonts,
 * modular style customizers (header, section rules, skill tags, bullets),
 * curated color palettes, micro-spacing sliders, and real-time WCAG 2.1 AA contrast checker.
 */
import { SPACING_PRESETS, FONT_CATALOG } from '../state/schema.js';
import { fixContrast } from '../audit/contrast.js';
import { TEMPLATES } from '../templates/registry.js';

const CURATED_PALETTES = [
  { name: 'Oxford Navy', accent: '#1e3a8a', ink: '#111827', muted: '#4b5563', canvas: '#ffffff' },
  { name: 'Nordic Teal', accent: '#0d9488', ink: '#0f172a', muted: '#475569', canvas: '#ffffff' },
  { name: 'Warm Terracotta', accent: '#b45309', ink: '#1c1917', muted: '#57534e', canvas: '#fefefe' },
  { name: 'Emerald Slate', accent: '#0f766e', ink: '#0f172a', muted: '#475569', canvas: '#ffffff' },
  { name: 'Forest Sage', accent: '#15803d', ink: '#14532d', muted: '#3f6212', canvas: '#ffffff' },
  { name: 'Swiss Crimson', accent: '#b91c1c', ink: '#111827', muted: '#4b5563', canvas: '#ffffff' },
  { name: 'Cyber Cobalt', accent: '#2563eb', ink: '#0f172a', muted: '#64748b', canvas: '#ffffff' },
  { name: 'Royal Violet', accent: '#7c3aed', ink: '#111827', muted: '#4b5563', canvas: '#ffffff' },
  { name: 'High-Contrast Ink', accent: '#000000', ink: '#000000', muted: '#374151', canvas: '#ffffff' },
  { name: 'Ivy Charcoal', accent: '#1f2937', ink: '#111827', muted: '#4b5563', canvas: '#ffffff' }
];

const TYPOGRAPHY_PRESETS = {
  'accessible': {
    label: '👁️ High Readability',
    primaryFont: 'Lexend',
    headerFont: 'Atkinson Hyperlegible',
    monoFont: 'IBM Plex Mono',
    lineHeight: 1.36
  },
  'modern': {
    label: '✨ Modern Geometric',
    primaryFont: 'Plus Jakarta Sans',
    headerFont: 'Plus Jakarta Sans',
    monoFont: 'JetBrains Mono',
    lineHeight: 1.30
  },
  'editorial': {
    label: '📖 Classic Editorial',
    primaryFont: 'Source Sans 3',
    headerFont: 'Lora',
    monoFont: 'JetBrains Mono',
    lineHeight: 1.32
  },
  'technical': {
    label: '💻 Tech Minimalist',
    primaryFont: 'Inter',
    headerFont: 'Inter',
    monoFont: 'Fira Code',
    lineHeight: 1.28
  }
};

export function initDesignPanel(containerEl, store, showToastCallback) {
  if (!containerEl) return;

  let activeCategory = 'all';

  // Build static DOM structure ONCE
  containerEl.innerHTML = `
    <div class="panel-header">
      <div class="panel-header-title">
        <span class="panel-icon">🎨</span>
        <h3>Design & Typography Studio</h3>
      </div>
      <button class="btn-close-drawer" id="close-design-btn" aria-label="Close Design Panel">&times;</button>
    </div>

    <div class="drawer-scroll-body">
      <!-- 1. Visual Template Gallery with Categories -->
      <div class="panel-section">
        <div class="section-label-row">
          <h4 class="section-label">Resume Template (${TEMPLATES.length})</h4>
          <label class="auto-apply-label" title="Automatically apply font and color pairings when changing templates">
            <input type="checkbox" id="chk-auto-fonts" ${store.getAutoPairFonts() ? 'checked' : ''}> Auto-Pair Fonts
          </label>
        </div>

        <div class="template-filter-bar">
          <button class="filter-chip is-active" data-category="all">All (${TEMPLATES.length})</button>
          <button class="filter-chip" data-category="accessible">Accessible</button>
          <button class="filter-chip" data-category="modern">Modern</button>
          <button class="filter-chip" data-category="traditional">Traditional</button>
          <button class="filter-chip" data-category="creative">Creative</button>
        </div>

        <div class="template-gallery-grid" id="template-gallery-root">
          ${TEMPLATES.map(t => `
            <div class="template-card" data-template-id="${t.id}" data-template-cat="${t.category}" title="${t.name} — ${t.description}">
              <div class="template-wireframe wireframe-${t.id}">
                <div class="wire-header"></div>
                <div class="wire-body">
                  <div class="wire-col-1"></div>
                  <div class="wire-col-2"></div>
                </div>
              </div>
              <div class="template-card-footer">
                <span class="template-card-name">${t.name}</span>
                <span class="template-card-badge">${t.category}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 2. Typography & Easy-to-Read Fonts -->
      <div class="panel-section">
        <div class="section-label-row">
          <h4 class="section-label">Typography & Readability</h4>
        </div>

        <div class="typography-presets-row mb-3">
          <label class="text-xs text-muted display-block mb-1">Quick Font Pairings:</label>
          <div class="btn-group-presets">
            ${Object.entries(TYPOGRAPHY_PRESETS).map(([k, p]) => `
              <button class="btn-preset btn-typo-preset" data-typo-preset="${k}">${p.label}</button>
            `).join('')}
          </div>
        </div>

        <div class="control-row">
          <label for="font-primary-select">Body Font (Reading Ease)</label>
          <select id="font-primary-select" class="form-select">
            <optgroup label="✨ Easy-to-Read & Accessible Sans-Serif">
              <option value="Atkinson Hyperlegible">Atkinson Hyperlegible (Braille Inst. Disambiguation)</option>
              <option value="Lexend">Lexend (Visual Fluency & Low Strain)</option>
              <option value="Plus Jakarta Sans">Plus Jakarta Sans (Modern Geometric / Open Counters)</option>
              <option value="Source Sans 3">Source Sans 3 (Humanist Screen & Print Clarity)</option>
              <option value="IBM Plex Sans">IBM Plex Sans (Engineered Corporate Clarity)</option>
              <option value="Inter">Inter (Clean Modern UI Standard)</option>
              <option value="Verdana">Verdana (Ultra-Wide x-Height / Accessible System)</option>
              <option value="Trebuchet MS">Trebuchet MS (Humanist Open System)</option>
              <option value="Arial">Arial (Standard Neutral Sans)</option>
            </optgroup>
            <optgroup label="✒️ Editorial & Academic Serif">
              <option value="Lora">Lora (Contemporary Brushed Editorial Serif)</option>
              <option value="Merriweather">Merriweather (Sturdy Editorial / High x-Height Serif)</option>
              <option value="Libre Baskerville">Libre Baskerville (Classic Wide-Counter Book Serif)</option>
              <option value="EB Garamond">EB Garamond (Traditional Academic & Ivy Serif)</option>
              <option value="Georgia">Georgia (High-Contrast Screen & Print Serif)</option>
              <option value="Palatino">Palatino (Calligraphic Book Serif)</option>
            </optgroup>
            <optgroup label="💻 Monospace">
              <option value="JetBrains Mono">JetBrains Mono (Monospace)</option>
            </optgroup>
          </select>
        </div>

        <div class="control-row">
          <label for="font-header-select">Heading Font</label>
          <select id="font-header-select" class="form-select">
            <optgroup label="✨ Easy-to-Read & Accessible Sans-Serif">
              <option value="Atkinson Hyperlegible">Atkinson Hyperlegible (Braille Inst. Disambiguation)</option>
              <option value="Lexend">Lexend (Visual Fluency & Low Strain)</option>
              <option value="Plus Jakarta Sans">Plus Jakarta Sans (Modern Geometric / Open Counters)</option>
              <option value="Source Sans 3">Source Sans 3 (Humanist Screen & Print Clarity)</option>
              <option value="IBM Plex Sans">IBM Plex Sans (Engineered Corporate Clarity)</option>
              <option value="Inter">Inter (Clean Modern Sans)</option>
              <option value="Verdana">Verdana (Ultra-Wide x-Height / Accessible System)</option>
              <option value="Trebuchet MS">Trebuchet MS (Humanist Open System)</option>
            </optgroup>
            <optgroup label="✒️ Editorial & Academic Serif">
              <option value="Lora">Lora (Contemporary Brushed Editorial Serif)</option>
              <option value="Merriweather">Merriweather (Sturdy Editorial / High x-Height Serif)</option>
              <option value="Libre Baskerville">Libre Baskerville (Classic Wide-Counter Book Serif)</option>
              <option value="EB Garamond">EB Garamond (Traditional Academic & Ivy Serif)</option>
              <option value="Georgia">Georgia (High-Contrast Screen & Print Serif)</option>
              <option value="Palatino">Palatino (Calligraphic Book Serif)</option>
            </optgroup>
            <optgroup label="💻 Monospace">
              <option value="JetBrains Mono">JetBrains Mono (Monospace)</option>
            </optgroup>
          </select>
        </div>

        <div class="control-row">
          <label for="font-mono-select">Metadata & Monospace Font</label>
          <select id="font-mono-select" class="form-select">
            <option value="JetBrains Mono">JetBrains Mono (Modern Coding Mono)</option>
            <option value="IBM Plex Mono">IBM Plex Mono (Engineered Technical Mono)</option>
            <option value="Fira Code">Fira Code (Clean Screen Monospace)</option>
          </select>
        </div>
      </div>

      <!-- 3. Modular Style & Layout Customizations -->
      <div class="panel-section">
        <h4 class="section-label">Style & Layout Options</h4>

        <div class="control-row">
          <label for="select-header-align">Header Alignment</label>
          <select id="select-header-align" class="form-select form-select-sm">
            <option value="default">Template Default</option>
            <option value="left">Left Aligned</option>
            <option value="center">Centered</option>
            <option value="split">Split (Name Left, Contact Right Stack)</option>
          </select>
        </div>

        <div class="control-row">
          <label for="select-section-style">Section Divider Style</label>
          <select id="select-section-style" class="form-select form-select-sm">
            <option value="default">Template Default</option>
            <option value="underline">Solid Accent Rule</option>
            <option value="thick-bar">Tinted Callout Bar</option>
            <option value="left-accent">Vertical Left Accent</option>
            <option value="double-line">Double Line Rule</option>
            <option value="minimal">Minimal (Uppercase, No Line)</option>
          </select>
        </div>

        <div class="control-row">
          <label for="select-skill-style">Skills Display Style</label>
          <select id="select-skill-style" class="form-select form-select-sm">
            <option value="default">Template Default</option>
            <option value="pill">Rounded Pill Tags</option>
            <option value="badge">Soft Rectangular Badges</option>
            <option value="outlined">Outlined Border Tags</option>
            <option value="inline">Inline Comma-Separated (Strict ATS)</option>
          </select>
        </div>

        <div class="control-row">
          <label for="select-bullet-style">Bullet Marker Style</label>
          <select id="select-bullet-style" class="form-select form-select-sm">
            <option value="default">Template Default</option>
            <option value="disc">• Standard Disc</option>
            <option value="square">▪ Modern Square</option>
            <option value="arrow">▸ Chevron Arrow</option>
            <option value="dash">– En-Dash</option>
          </select>
        </div>
      </div>

      <!-- 4. Colors & Curated Palettes -->
      <div class="panel-section">
        <h4 class="section-label">Brand Color Palettes (${CURATED_PALETTES.length})</h4>
        <div class="palette-chips-row">
          ${CURATED_PALETTES.map((p, idx) => `
            <button class="palette-chip-btn" data-palette-idx="${idx}" title="${p.name}">
              <span class="palette-swatch" style="background: ${p.accent};"></span>
              <span>${p.name}</span>
            </button>
          `).join('')}
        </div>

        <h4 class="section-label mt-3">Custom Colors</h4>
        <div class="color-grid">
          <div class="color-item">
            <label for="color-accent-picker">Accent Brand</label>
            <div class="color-input-wrapper">
              <input type="color" id="color-accent-picker" value="#1e3a8a">
              <span id="hex-accent-label" class="color-hex">#1e3a8a</span>
            </div>
          </div>

          <div class="color-item">
            <label for="color-ink-picker">Body Ink</label>
            <div class="color-input-wrapper">
              <input type="color" id="color-ink-picker" value="#111827">
              <span id="hex-ink-label" class="color-hex">#111827</span>
            </div>
          </div>

          <div class="color-item">
            <label for="color-muted-picker">Muted Text</label>
            <div class="color-input-wrapper">
              <input type="color" id="color-muted-picker" value="#4b5563">
              <span id="hex-muted-label" class="color-hex">#4b5563</span>
            </div>
          </div>

          <div class="color-item">
            <label for="color-canvas-picker">Background</label>
            <div class="color-input-wrapper">
              <input type="color" id="color-canvas-picker" value="#ffffff">
              <span id="hex-canvas-label" class="color-hex">#ffffff</span>
            </div>
          </div>
        </div>

        <!-- WCAG Contrast Box -->
        <div id="wcag-audit-box" class="wcag-audit-box wcag-pass">
          <div class="wcag-title">
            <span>WCAG 2.1 AA Contrast:</span>
            <strong id="wcag-status-label">PASSED</strong>
          </div>
          <div id="wcag-metrics-row" class="wcag-metrics"></div>
          <button id="btn-fix-contrast" class="btn btn-sm btn-outline-warning mt-2" style="display: none;">
            Auto-Fix Accessible Contrast
          </button>
        </div>
      </div>

      <!-- 5. Spacing Presets -->
      <div class="panel-section">
        <h4 class="section-label">Spacing Presets</h4>
        <div class="btn-group-presets">
          <button class="btn-preset" data-preset="compact">Compact</button>
          <button class="btn-preset" data-preset="comfortable">Comfortable</button>
          <button class="btn-preset" data-preset="spacious">Spacious</button>
        </div>
      </div>

      <!-- 6. Micro-Spacing Sliders -->
      <div class="panel-section">
        <h4 class="section-label">Micro-Spacing Controls</h4>

        <div class="slider-control">
          <div class="slider-header">
            <span>Page Margin</span>
            <span id="val-margins" class="slider-val">0.5 in</span>
          </div>
          <input type="range" id="slider-margins" min="0.35" max="1.0" step="0.05" value="0.5">
        </div>

        <div class="slider-control">
          <div class="slider-header">
            <span>Base Font Size</span>
            <span id="val-fontsize" class="slider-val">10 pt</span>
          </div>
          <input type="range" id="slider-fontsize" min="9.0" max="12.0" step="0.25" value="10">
        </div>

        <div class="slider-control">
          <div class="slider-header">
            <span>Line Height</span>
            <span id="val-lineheight" class="slider-val">1.30</span>
          </div>
          <input type="range" id="slider-lineheight" min="1.15" max="1.55" step="0.01" value="1.30">
        </div>

        <div class="slider-control">
          <div class="slider-header">
            <span>Section Spacing</span>
            <span id="val-sectiongap" class="slider-val">14 px</span>
          </div>
          <input type="range" id="slider-sectiongap" min="6" max="28" step="1" value="14">
        </div>

        <div class="slider-control">
          <div class="slider-header">
            <span>Item Spacing</span>
            <span id="val-itemgap" class="slider-val">6 px</span>
          </div>
          <input type="range" id="slider-itemgap" min="2" max="16" step="1" value="6">
        </div>

        <div class="slider-control">
          <div class="slider-header">
            <span>Bullet Spacing</span>
            <span id="val-bulletgap" class="slider-val">3 px</span>
          </div>
          <input type="range" id="slider-bulletgap" min="1" max="8" step="1" value="3">
        </div>
      </div>
    </div>
  `;

  // Grab cached element references
  const dom = {
    closeBtn: containerEl.querySelector('#close-design-btn'),
    chkAutoFonts: containerEl.querySelector('#chk-auto-fonts'),
    primaryFont: containerEl.querySelector('#font-primary-select'),
    headerFont: containerEl.querySelector('#font-header-select'),
    monoFont: containerEl.querySelector('#font-mono-select'),
    headerAlign: containerEl.querySelector('#select-header-align'),
    sectionStyle: containerEl.querySelector('#select-section-style'),
    skillStyle: containerEl.querySelector('#select-skill-style'),
    bulletStyle: containerEl.querySelector('#select-bullet-style'),
    accentPicker: containerEl.querySelector('#color-accent-picker'),
    inkPicker: containerEl.querySelector('#color-ink-picker'),
    mutedPicker: containerEl.querySelector('#color-muted-picker'),
    canvasPicker: containerEl.querySelector('#color-canvas-picker'),
    hexAccent: containerEl.querySelector('#hex-accent-label'),
    hexInk: containerEl.querySelector('#hex-ink-label'),
    hexMuted: containerEl.querySelector('#hex-muted-label'),
    hexCanvas: containerEl.querySelector('#hex-canvas-label'),
    wcagBox: containerEl.querySelector('#wcag-audit-box'),
    wcagStatus: containerEl.querySelector('#wcag-status-label'),
    wcagMetrics: containerEl.querySelector('#wcag-metrics-row'),
    btnFixContrast: containerEl.querySelector('#btn-fix-contrast'),
    sliderMargins: containerEl.querySelector('#slider-margins'),
    sliderFontsize: containerEl.querySelector('#slider-fontsize'),
    sliderLineheight: containerEl.querySelector('#slider-lineheight'),
    sliderSectiongap: containerEl.querySelector('#slider-sectiongap'),
    sliderItemgap: containerEl.querySelector('#slider-itemgap'),
    sliderBulletgap: containerEl.querySelector('#slider-bulletgap'),
    valMargins: containerEl.querySelector('#val-margins'),
    valFontsize: containerEl.querySelector('#val-fontsize'),
    valLineheight: containerEl.querySelector('#val-lineheight'),
    valSectiongap: containerEl.querySelector('#val-sectiongap'),
    valItemgap: containerEl.querySelector('#val-itemgap'),
    valBulletgap: containerEl.querySelector('#val-bulletgap'),
    templateCards: containerEl.querySelectorAll('.template-card'),
    filterChips: containerEl.querySelectorAll('.filter-chip'),
    presetBtns: containerEl.querySelectorAll('.btn-preset:not(.btn-typo-preset)'),
    typoPresetBtns: containerEl.querySelectorAll('.btn-typo-preset'),
    paletteBtns: containerEl.querySelectorAll('.palette-chip-btn')
  };

  // Close button
  dom.closeBtn?.addEventListener('click', () => {
    containerEl.classList.remove('is-open');
    document.getElementById('drawer-backdrop')?.classList.remove('is-active');
  });

  // Checkbox: Auto-pair fonts preference
  dom.chkAutoFonts?.addEventListener('change', () => {
    store.setAutoPairFonts(dom.chkAutoFonts.checked);
  });

  // Template Category Filters
  dom.filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      dom.filterChips.forEach(c => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      activeCategory = chip.getAttribute('data-category');

      dom.templateCards.forEach(card => {
        const cat = card.getAttribute('data-template-cat');
        if (activeCategory === 'all' || cat === activeCategory) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // Template selection cards
  dom.templateCards.forEach(card => {
    card.addEventListener('click', () => {
      const templateId = card.getAttribute('data-template-id');
      const tmpl = TEMPLATES.find(t => t.id === templateId);
      const updates = { template: templateId };

      if (dom.chkAutoFonts?.checked && tmpl && tmpl.defaultPairing) {
        if (tmpl.defaultPairing.primaryFont) updates.primaryFont = tmpl.defaultPairing.primaryFont;
        if (tmpl.defaultPairing.headerFont) updates.headerFont = tmpl.defaultPairing.headerFont;
        if (tmpl.defaultPairing.monoFont) updates.monoFont = tmpl.defaultPairing.monoFont;
        if (tmpl.defaultPairing.accentColor) updates.accentColor = tmpl.defaultPairing.accentColor;
        if (tmpl.defaultPairing.margins) updates.margins = tmpl.defaultPairing.margins;
        if (tmpl.defaultPairing.headerAlign) updates.headerAlign = tmpl.defaultPairing.headerAlign;
        if (tmpl.defaultPairing.sectionStyle) updates.sectionStyle = tmpl.defaultPairing.sectionStyle;
        if (tmpl.defaultPairing.skillStyle) updates.skillStyle = tmpl.defaultPairing.skillStyle;
        if (tmpl.defaultPairing.bulletStyle) updates.bulletStyle = tmpl.defaultPairing.bulletStyle;
      }

      store.updateConfig(updates);
      showToastCallback(`Applied template: ${tmpl?.name || templateId}`);
    });
  });

  // Typography Presets
  dom.typoPresetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-typo-preset');
      const preset = TYPOGRAPHY_PRESETS[key];
      if (preset) {
        store.updateConfig({
          primaryFont: preset.primaryFont,
          headerFont: preset.headerFont,
          monoFont: preset.monoFont,
          lineHeight: preset.lineHeight
        });
        showToastCallback(`Applied ${preset.label} pairing`);
      }
    });
  });

  // Palette buttons
  dom.paletteBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-palette-idx'), 10);
      const palette = CURATED_PALETTES[idx];
      if (palette) {
        store.updateConfig({
          accentColor: palette.accent,
          inkColor: palette.ink,
          mutedColor: palette.muted,
          canvasColor: palette.canvas || '#ffffff'
        });
        showToastCallback(`Applied ${palette.name} color palette`);
      }
    });
  });

  // Typography selects
  dom.primaryFont?.addEventListener('change', () => {
    store.updateConfig({ primaryFont: dom.primaryFont.value });
  });
  dom.headerFont?.addEventListener('change', () => {
    store.updateConfig({ headerFont: dom.headerFont.value });
  });
  dom.monoFont?.addEventListener('change', () => {
    store.updateConfig({ monoFont: dom.monoFont.value });
  });

  // Modular Style selects
  dom.headerAlign?.addEventListener('change', () => {
    store.updateConfig({ headerAlign: dom.headerAlign.value });
  });
  dom.sectionStyle?.addEventListener('change', () => {
    store.updateConfig({ sectionStyle: dom.sectionStyle.value });
  });
  dom.skillStyle?.addEventListener('change', () => {
    store.updateConfig({ skillStyle: dom.skillStyle.value });
  });
  dom.bulletStyle?.addEventListener('change', () => {
    store.updateConfig({ bulletStyle: dom.bulletStyle.value });
  });

  // Color inputs
  dom.accentPicker?.addEventListener('input', () => {
    dom.hexAccent.textContent = dom.accentPicker.value;
    store.updateConfig({ accentColor: dom.accentPicker.value });
  });
  dom.inkPicker?.addEventListener('input', () => {
    dom.hexInk.textContent = dom.inkPicker.value;
    store.updateConfig({ inkColor: dom.inkPicker.value });
  });
  dom.mutedPicker?.addEventListener('input', () => {
    dom.hexMuted.textContent = dom.mutedPicker.value;
    store.updateConfig({ mutedColor: dom.mutedPicker.value });
  });
  dom.canvasPicker?.addEventListener('input', () => {
    dom.hexCanvas.textContent = dom.canvasPicker.value;
    store.updateConfig({ canvasColor: dom.canvasPicker.value });
  });

  // Auto-Fix contrast button
  dom.btnFixContrast?.addEventListener('click', () => {
    const config = store.getConfig();
    const bg = config.canvasColor || '#ffffff';
    const newInk = fixContrast(config.inkColor || '#111827', bg, 4.6);
    const newMuted = fixContrast(config.mutedColor || '#4b5563', bg, 4.6);
    const newAccent = fixContrast(config.accentColor || '#1e3a8a', bg, 4.6);
    store.updateConfig({
      inkColor: newInk,
      mutedColor: newMuted,
      accentColor: newAccent
    });
    showToastCallback('Auto-adjusted colors to satisfy WCAG 2.1 AA 4.6:1 contrast ratio!');
  });

  // Spacing presets
  dom.presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const presetKey = btn.getAttribute('data-preset');
      const vals = SPACING_PRESETS[presetKey];
      if (vals) {
        store.updateConfig({ ...vals, spacingPreset: presetKey });
        showToastCallback(`Applied ${presetKey} spacing preset`);
      }
    });
  });

  // Micro-spacing sliders
  const bindSlider = (sliderEl, labelEl, key, suffix, parser) => {
    sliderEl?.addEventListener('input', () => {
      const parsed = parser(sliderEl.value);
      labelEl.textContent = `${parsed}${suffix}`;
      store.updateConfig({ [key]: parsed, spacingPreset: 'custom' });
    });
  };

  bindSlider(dom.sliderMargins, dom.valMargins, 'margins', ' in', parseFloat);
  bindSlider(dom.sliderFontsize, dom.valFontsize, 'fontSize', ' pt', parseFloat);
  bindSlider(dom.sliderLineheight, dom.valLineheight, 'lineHeight', '', parseFloat);
  bindSlider(dom.sliderSectiongap, dom.valSectiongap, 'sectionSpacing', ' px', parseInt);
  bindSlider(dom.sliderItemgap, dom.valItemgap, 'itemSpacing', ' px', parseInt);
  bindSlider(dom.sliderBulletgap, dom.valBulletgap, 'bulletSpacing', ' px', parseInt);

  // In-place UI Updater (Decoupled from DOM construction)
  function updatePanelUI(config, contrastReport) {
    if (!config) return;

    // Active template card
    dom.templateCards.forEach(c => {
      c.classList.toggle('is-active', c.getAttribute('data-template-id') === config.template);
    });

    // Typography
    if (dom.primaryFont) dom.primaryFont.value = config.primaryFont || 'Inter';
    if (dom.headerFont) dom.headerFont.value = config.headerFont || 'Inter';
    if (dom.monoFont) dom.monoFont.value = config.monoFont || 'JetBrains Mono';

    // Modular Styles
    if (dom.headerAlign) dom.headerAlign.value = config.headerAlign || 'default';
    if (dom.sectionStyle) dom.sectionStyle.value = config.sectionStyle || 'default';
    if (dom.skillStyle) dom.skillStyle.value = config.skillStyle || 'default';
    if (dom.bulletStyle) dom.bulletStyle.value = config.bulletStyle || 'default';

    // Color pickers & labels
    if (dom.accentPicker) dom.accentPicker.value = config.accentColor || '#1e3a8a';
    if (dom.inkPicker) dom.inkPicker.value = config.inkColor || '#111827';
    if (dom.mutedPicker) dom.mutedPicker.value = config.mutedColor || '#4b5563';
    if (dom.canvasPicker) dom.canvasPicker.value = config.canvasColor || '#ffffff';
    if (dom.hexAccent) dom.hexAccent.textContent = config.accentColor || '#1e3a8a';
    if (dom.hexInk) dom.hexInk.textContent = config.inkColor || '#111827';
    if (dom.hexMuted) dom.hexMuted.textContent = config.mutedColor || '#4b5563';
    if (dom.hexCanvas) dom.hexCanvas.textContent = config.canvasColor || '#ffffff';

    // Sliders
    if (dom.sliderMargins) dom.sliderMargins.value = config.margins;
    if (dom.sliderFontsize) dom.sliderFontsize.value = config.fontSize;
    if (dom.sliderLineheight) dom.sliderLineheight.value = config.lineHeight;
    if (dom.sliderSectiongap) dom.sliderSectiongap.value = config.sectionSpacing;
    if (dom.sliderItemgap) dom.sliderItemgap.value = config.itemSpacing;
    if (dom.sliderBulletgap) dom.sliderBulletgap.value = config.bulletSpacing;

    if (dom.valMargins) dom.valMargins.textContent = `${config.margins} in`;
    if (dom.valFontsize) dom.valFontsize.textContent = `${config.fontSize} pt`;
    if (dom.valLineheight) dom.valLineheight.textContent = `${config.lineHeight}`;
    if (dom.valSectiongap) dom.valSectiongap.textContent = `${config.sectionSpacing} px`;
    if (dom.valItemgap) dom.valItemgap.textContent = `${config.itemSpacing} px`;
    if (dom.valBulletgap) dom.valBulletgap.textContent = `${config.bulletSpacing} px`;

    // Presets
    dom.presetBtns.forEach(b => {
      b.classList.toggle('is-active', b.getAttribute('data-preset') === config.spacingPreset);
    });

    // Contrast Check
    if (contrastReport) {
      const allPass = contrastReport.allPass;
      dom.wcagBox.className = `wcag-audit-box ${allPass ? 'wcag-pass' : 'wcag-fail'}`;
      dom.wcagStatus.textContent = allPass ? 'PASSED (≥ 4.5:1)' : 'FAIL (< 4.5:1)';
      dom.btnFixContrast.style.display = allPass ? 'none' : 'inline-block';

      const inkCheck = contrastReport.checks?.find(c => c.key === 'inkColor');
      const mutedCheck = contrastReport.checks?.find(c => c.key === 'mutedColor');
      const accentCheck = contrastReport.checks?.find(c => c.key === 'accentColor');

      dom.wcagMetrics.innerHTML = `
        <span>Ink: ${inkCheck ? inkCheck.ratio : '4.5'}:1 ${inkCheck?.passes ? '✓' : '⚠️'}</span>
        <span>Muted: ${mutedCheck ? mutedCheck.ratio : '4.5'}:1 ${mutedCheck?.passes ? '✓' : '⚠️'}</span>
        <span>Accent: ${accentCheck ? accentCheck.ratio : '4.5'}:1 ${accentCheck?.passes ? '✓' : '⚠️'}</span>
      `;
    }
  }

  // Subscribe to updates
  store.subscribe('config:change', ({ config }) => {
    updatePanelUI(config, store.parsedResult?.contrastReport);
  });

  store.subscribe('parsed:update', (result) => {
    if (result) {
      updatePanelUI(result.config, result.contrastReport);
    }
  });

  // Initial populate
  updatePanelUI(store.getConfig(), null);
}
