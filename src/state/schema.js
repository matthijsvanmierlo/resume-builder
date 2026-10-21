/**
 * Data Schema, Validation, and Normalization Helpers
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
  headerAlign: "default",         // default | left | center | split
  sectionStyle: "default",        // default | underline | thick-bar | left-accent | double-line | minimal
  skillStyle: "default",          // default | pill | badge | outlined | inline
  bulletStyle: "default",         // default | disc | square | arrow | dash
  inkColor: "#111827",            // Primary body text color
  mutedColor: "#4b5563",          // Secondary metadata/date color
  accentColor: "#1e3a8a",         // Brand/heading/rule accent color
  canvasColor: "#ffffff",         // Paper background color
  spacingPreset: "comfortable",   // compact | comfortable | spacious | custom
  dateFormat: "MM/YYYY - Present"
};

export const FONT_CATALOG = {
  // High-Legibility & Accessible Sans-Serif
  "Atkinson Hyperlegible": {
    name: "Atkinson Hyperlegible",
    label: "Atkinson Hyperlegible (Braille Inst. High Disambiguation)",
    category: "accessible-sans",
    stack: "'Atkinson Hyperlegible', Verdana, -apple-system, sans-serif"
  },
  "Lexend": {
    name: "Lexend",
    label: "Lexend (Reading Fluency & Low Visual Stress)",
    category: "accessible-sans",
    stack: "'Lexend', 'Trebuchet MS', -apple-system, sans-serif"
  },
  "Plus Jakarta Sans": {
    name: "Plus Jakarta Sans",
    label: "Plus Jakarta Sans (Modern Geometric / Open Counters)",
    category: "accessible-sans",
    stack: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif"
  },
  "Source Sans 3": {
    name: "Source Sans 3",
    label: "Source Sans 3 (Humanist Screen & Print Clarity)",
    category: "accessible-sans",
    stack: "'Source Sans 3', 'Segoe UI', -apple-system, sans-serif"
  },
  "IBM Plex Sans": {
    name: "IBM Plex Sans",
    label: "IBM Plex Sans (Engineered Corporate & Tech Clarity)",
    category: "accessible-sans",
    stack: "'IBM Plex Sans', -apple-system, sans-serif"
  },
  "Inter": {
    name: "Inter",
    label: "Inter (Clean Modern Sans)",
    category: "modern-sans",
    stack: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },
  "Verdana": {
    name: "Verdana",
    label: "Verdana (Ultra-Wide x-Height / Accessible System)",
    category: "accessible-sans",
    stack: "Verdana, Geneva, sans-serif"
  },
  "Trebuchet MS": {
    name: "Trebuchet MS",
    label: "Trebuchet MS (Humanist Open Sans System)",
    category: "accessible-sans",
    stack: "'Trebuchet MS', 'Lucida Sans Unicode', sans-serif"
  },
  "Arial": {
    name: "Arial",
    label: "Arial (Standard Neutral Sans)",
    category: "modern-sans",
    stack: "Arial, Helvetica, sans-serif"
  },

  // Editorial & Academic Serif
  "Lora": {
    name: "Lora",
    label: "Lora (Contemporary Brushed Editorial Serif)",
    category: "editorial-serif",
    stack: "'Lora', Georgia, serif"
  },
  "Merriweather": {
    name: "Merriweather",
    label: "Merriweather (Sturdy Editorial / High x-Height Serif)",
    category: "editorial-serif",
    stack: "'Merriweather', Georgia, serif"
  },
  "Libre Baskerville": {
    name: "Libre Baskerville",
    label: "Libre Baskerville (Classic Wide-Counter Book Serif)",
    category: "editorial-serif",
    stack: "'Libre Baskerville', Baskerville, Georgia, serif"
  },
  "EB Garamond": {
    name: "EB Garamond",
    label: "EB Garamond (Traditional Academic & Ivy Serif)",
    category: "editorial-serif",
    stack: "'EB Garamond', Garamond, Georgia, serif"
  },
  "Georgia": {
    name: "Georgia",
    label: "Georgia (High-Contrast Screen & Print Serif)",
    category: "editorial-serif",
    stack: "Georgia, 'Times New Roman', serif"
  },
  "Palatino": {
    name: "Palatino",
    label: "Palatino (Calligraphic Book Serif)",
    category: "editorial-serif",
    stack: "'Palatino Linotype', 'Book Antiqua', Palatino, serif"
  },

  // Monospace & Metadata
  "JetBrains Mono": {
    name: "JetBrains Mono",
    label: "JetBrains Mono (Modern Coding Mono)",
    category: "mono",
    stack: "'JetBrains Mono', monospace"
  },
  "IBM Plex Mono": {
    name: "IBM Plex Mono",
    label: "IBM Plex Mono (Engineered Technical Mono)",
    category: "mono",
    stack: "'IBM Plex Mono', monospace"
  },
  "Fira Code": {
    name: "Fira Code",
    label: "Fira Code (Clean Screen Monospace)",
    category: "mono",
    stack: "'Fira Code', 'Courier New', monospace"
  }
};

export const SPACING_PRESETS = {
  compact: {
    margins: 0.4,
    fontSize: 9.5,
    lineHeight: 1.22,
    sectionSpacing: 10,
    itemSpacing: 4,
    bulletSpacing: 2
  },
  comfortable: {
    margins: 0.5,
    fontSize: 10,
    lineHeight: 1.30,
    sectionSpacing: 14,
    itemSpacing: 6,
    bulletSpacing: 3
  },
  spacious: {
    margins: 0.65,
    fontSize: 10.5,
    lineHeight: 1.40,
    sectionSpacing: 18,
    itemSpacing: 8,
    bulletSpacing: 4
  }
};

export const PAPER_DIMENSIONS = {
  letter: {
    widthInches: 8.5,
    heightInches: 11,
    widthPx: 816,      // 8.5 * 96
    heightPx: 1056     // 11 * 96
  },
  a4: {
    widthMm: 210,
    heightMm: 297,
    widthPx: 793.7,    // 210 / 25.4 * 96
    heightPx: 1122.5   // 297 / 25.4 * 96
  }
};

export function generateId(prefix = 'res') {
  return `${prefix}_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;
}

export function normalizeConfig(input = {}) {
  const merged = { ...DEFAULT_DOCUMENT_CONFIG, ...input };

  // Validate and clamp numbers
  merged.margins = Math.max(0.35, Math.min(1.0, parseFloat(merged.margins) || DEFAULT_DOCUMENT_CONFIG.margins));
  merged.fontSize = Math.max(9.0, Math.min(12.0, parseFloat(merged.fontSize) || DEFAULT_DOCUMENT_CONFIG.fontSize));
  merged.lineHeight = Math.max(1.15, Math.min(1.55, parseFloat(merged.lineHeight) || DEFAULT_DOCUMENT_CONFIG.lineHeight));
  merged.sectionSpacing = Math.max(6, Math.min(28, parseInt(merged.sectionSpacing, 10) || DEFAULT_DOCUMENT_CONFIG.sectionSpacing));
  merged.itemSpacing = Math.max(2, Math.min(16, parseInt(merged.itemSpacing, 10) || DEFAULT_DOCUMENT_CONFIG.itemSpacing));
  merged.bulletSpacing = Math.max(1, Math.min(8, parseInt(merged.bulletSpacing, 10) || DEFAULT_DOCUMENT_CONFIG.bulletSpacing));
  merged.targetPages = [1, 2, 3].includes(Number(merged.targetPages)) ? Number(merged.targetPages) : 1;
  merged.paper = ['letter', 'a4'].includes(merged.paper) ? merged.paper : 'letter';

  // Modular Styles
  merged.headerAlign = ['default', 'left', 'center', 'split'].includes(merged.headerAlign) ? merged.headerAlign : 'default';
  merged.sectionStyle = ['default', 'underline', 'thick-bar', 'left-accent', 'double-line', 'minimal'].includes(merged.sectionStyle) ? merged.sectionStyle : 'default';
  merged.skillStyle = ['default', 'pill', 'badge', 'outlined', 'inline'].includes(merged.skillStyle) ? merged.skillStyle : 'default';
  merged.bulletStyle = ['default', 'disc', 'square', 'arrow', 'dash'].includes(merged.bulletStyle) ? merged.bulletStyle : 'default';

  // Colors
  merged.inkColor = normalizeHex(merged.inkColor, DEFAULT_DOCUMENT_CONFIG.inkColor);
  merged.mutedColor = normalizeHex(merged.mutedColor, DEFAULT_DOCUMENT_CONFIG.mutedColor);
  merged.accentColor = normalizeHex(merged.accentColor, DEFAULT_DOCUMENT_CONFIG.accentColor);
  merged.canvasColor = normalizeHex(merged.canvasColor, DEFAULT_DOCUMENT_CONFIG.canvasColor);

  return merged;
}

function normalizeHex(color, fallback) {
  if (!color || typeof color !== 'string') return fallback;
  const cleaned = color.trim();
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(cleaned)) {
    return cleaned;
  }
  return fallback;
}

export function createInitialDocument(overrides = {}) {
  const now = Date.now();
  return {
    id: overrides.id || generateId(),
    title: overrides.title || "Untitled Resume",
    createdAt: overrides.createdAt || now,
    updatedAt: overrides.updatedAt || now,
    config: normalizeConfig(overrides.config),
    metadata: overrides.metadata || {
      name: "",
      title: "",
      email: "",
      phone: "",
      location: "",
      website: "",
      linkedin: "",
      github: ""
    },
    rawMarkdown: overrides.rawMarkdown || ""
  };
}
