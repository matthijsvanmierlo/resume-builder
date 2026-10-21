/**
 * Template Registry: Metadata, Font Pairings, and Defaults for 12 Professional Templates
 */

export const TEMPLATES = [
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    description: 'Clean sans-serif with thin rules, pill tags, and high scannability.',
    category: 'modern',
    defaultPairing: {
      primaryFont: 'Inter',
      headerFont: 'Inter',
      monoFont: 'JetBrains Mono',
      accentColor: '#1e3a8a',
      margins: 0.5,
      headerAlign: 'default',
      sectionStyle: 'default',
      skillStyle: 'default',
      bulletStyle: 'default'
    }
  },
  {
    id: 'classic-ivy',
    name: 'Classic Ivy',
    description: 'Traditional centered serif header, horizontal rules, and academic elegance.',
    category: 'traditional',
    defaultPairing: {
      primaryFont: 'EB Garamond',
      headerFont: 'EB Garamond',
      monoFont: 'JetBrains Mono',
      accentColor: '#111827',
      margins: 0.55,
      headerAlign: 'center',
      sectionStyle: 'underline',
      skillStyle: 'inline',
      bulletStyle: 'default'
    }
  },
  {
    id: 'executive-compact',
    name: 'Executive Compact',
    description: 'Dense 15+ year layout, two-tone header, bold metric highlights, and right-aligned dates.',
    category: 'executive',
    defaultPairing: {
      primaryFont: 'Inter',
      headerFont: 'Merriweather',
      monoFont: 'JetBrains Mono',
      accentColor: '#0f766e',
      margins: 0.45,
      headerAlign: 'default',
      sectionStyle: 'thick-bar',
      skillStyle: 'badge',
      bulletStyle: 'default'
    }
  },
  {
    id: 'split-sidebar',
    name: 'Split Sidebar',
    description: 'Asymmetric 30/70 grid with tinted sidebar for skills, education, and credentials.',
    category: 'modern',
    defaultPairing: {
      primaryFont: 'Inter',
      headerFont: 'Inter',
      monoFont: 'JetBrains Mono',
      accentColor: '#3b82f6',
      margins: 0.45,
      headerAlign: 'default',
      sectionStyle: 'default',
      skillStyle: 'pill',
      bulletStyle: 'default'
    }
  },
  {
    id: 'tech-mono',
    name: 'Tech Mono',
    description: 'Monospace dates and badge capsules with terminal-inspired section markers.',
    category: 'technical',
    defaultPairing: {
      primaryFont: 'Inter',
      headerFont: 'Inter',
      monoFont: 'JetBrains Mono',
      accentColor: '#2563eb',
      margins: 0.5,
      headerAlign: 'default',
      sectionStyle: 'default',
      skillStyle: 'outlined',
      bulletStyle: 'default'
    }
  },
  {
    id: 'swiss-grid',
    name: 'Swiss Grid',
    description: 'Bold international typographic grid with asymmetric layout and hairline dividers.',
    category: 'design',
    defaultPairing: {
      primaryFont: 'Inter',
      headerFont: 'Inter',
      monoFont: 'JetBrains Mono',
      accentColor: '#b91c1c',
      margins: 0.5,
      headerAlign: 'default',
      sectionStyle: 'double-line',
      skillStyle: 'badge',
      bulletStyle: 'square'
    }
  },
  {
    id: 'academic-cv',
    name: 'Academic CV',
    description: 'Multi-page layout optimized for scholarly publications, teaching, and research grants.',
    category: 'academic',
    defaultPairing: {
      primaryFont: 'Merriweather',
      headerFont: 'Merriweather',
      monoFont: 'JetBrains Mono',
      accentColor: '#1e293b',
      margins: 0.6,
      headerAlign: 'default',
      sectionStyle: 'underline',
      skillStyle: 'inline',
      bulletStyle: 'default'
    }
  },
  {
    id: 'creative-accent',
    name: 'Creative Accent',
    description: 'Full-bleed header tint block with modern high-contrast tags.',
    category: 'creative',
    defaultPairing: {
      primaryFont: 'Inter',
      headerFont: 'Inter',
      monoFont: 'JetBrains Mono',
      accentColor: '#7c3aed',
      margins: 0.5,
      headerAlign: 'default',
      sectionStyle: 'thick-bar',
      skillStyle: 'pill',
      bulletStyle: 'default'
    }
  },
  {
    id: 'nordic-clean',
    name: 'Nordic Clean',
    description: 'Airy, accessible, high-whitespace aesthetic with pill section tags and generous line height.',
    category: 'accessible',
    defaultPairing: {
      primaryFont: 'Lexend',
      headerFont: 'Atkinson Hyperlegible',
      monoFont: 'JetBrains Mono',
      accentColor: '#0d9488',
      margins: 0.55,
      headerAlign: 'left',
      sectionStyle: 'thick-bar',
      skillStyle: 'pill',
      bulletStyle: 'arrow'
    }
  },
  {
    id: 'modern-timeline',
    name: 'Modern Timeline',
    description: 'Subtle vertical timeline rail with node badges detailing career progression.',
    category: 'modern',
    defaultPairing: {
      primaryFont: 'Plus Jakarta Sans',
      headerFont: 'Plus Jakarta Sans',
      monoFont: 'JetBrains Mono',
      accentColor: '#2563eb',
      margins: 0.5,
      headerAlign: 'default',
      sectionStyle: 'underline',
      skillStyle: 'badge',
      bulletStyle: 'disc'
    }
  },
  {
    id: 'bold-editorial',
    name: 'Bold Editorial',
    description: 'Magazine-grade typographic hierarchy pairing contemporary serif titles with clean sans-serif text.',
    category: 'creative',
    defaultPairing: {
      primaryFont: 'Plus Jakarta Sans',
      headerFont: 'Lora',
      monoFont: 'IBM Plex Mono',
      accentColor: '#b45309',
      margins: 0.55,
      headerAlign: 'left',
      sectionStyle: 'double-line',
      skillStyle: 'outlined',
      bulletStyle: 'dash'
    }
  },
  {
    id: 'ats-standard',
    name: 'ATS Ultra-Clean',
    description: 'Recruiter-optimized zero-decoration format with traditional bold headings and plain text skills.',
    category: 'traditional',
    defaultPairing: {
      primaryFont: 'Source Sans 3',
      headerFont: 'Source Sans 3',
      monoFont: 'JetBrains Mono',
      accentColor: '#1e293b',
      margins: 0.5,
      headerAlign: 'center',
      sectionStyle: 'underline',
      skillStyle: 'inline',
      bulletStyle: 'disc'
    }
  }
];

export function getTemplate(id) {
  return TEMPLATES.find(t => t.id === id) || TEMPLATES[0];
}

export function listTemplates() {
  return TEMPLATES;
}
