/**
 * Frontmatter extraction, serialization, and bi-directional synchronization.
 */
import { getJsYaml } from '../vendor/loader.js';
import { normalizeConfig, DEFAULT_DOCUMENT_CONFIG } from '../state/schema.js';

const FRONTMATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

/**
 * Parses frontmatter and markdown body from raw markdown string.
 */
export async function parseFrontmatter(rawText = '') {
  const yaml = await getJsYaml();
  const match = rawText.match(FRONTMATTER_REGEX);

  let rawYaml = '';
  let body = rawText;
  let parsedYaml = {};
  let error = null;

  if (match) {
    rawYaml = match[1];
    body = rawText.slice(match[0].length);
    try {
      parsedYaml = yaml.load(rawYaml) || {};
    } catch (e) {
      error = {
        message: e.message || 'YAML parsing error',
        line: e.mark ? e.mark.line + 2 : null,
        column: e.mark ? e.mark.column : null
      };
    }
  }

  // Extract metadata
  const metadata = {
    name: parsedYaml.name || '',
    title: parsedYaml.title || '',
    summary: parsedYaml.summary || '',
    contact: {
      email: parsedYaml.contact?.email || parsedYaml.email || '',
      phone: parsedYaml.contact?.phone || parsedYaml.phone || '',
      location: parsedYaml.contact?.location || parsedYaml.location || '',
      website: parsedYaml.contact?.website || parsedYaml.website || '',
      linkedin: parsedYaml.contact?.linkedin || parsedYaml.linkedin || '',
      github: parsedYaml.contact?.github || parsedYaml.github || '',
      portfolio: parsedYaml.contact?.portfolio || parsedYaml.portfolio || ''
    }
  };

  // Map settings keys to DocumentConfig
  const settings = parsedYaml.settings || {};
  const config = normalizeConfig({
    template: settings.template,
    paper: settings.paper,
    targetPages: settings.targetPages,
    margins: settings.margins,
    fontSize: settings.fontSize,
    lineHeight: settings.lineHeight,
    sectionSpacing: settings.sectionSpacing,
    itemSpacing: settings.itemSpacing,
    bulletSpacing: settings.bulletSpacing,
    primaryFont: settings.primaryFont || settings.fontPrimary,
    headerFont: settings.headerFont || settings.fontHeader,
    monoFont: settings.monoFont || settings.fontMono,
    headerAlign: settings.headerAlign,
    sectionStyle: settings.sectionStyle,
    skillStyle: settings.skillStyle,
    bulletStyle: settings.bulletStyle,
    inkColor: settings.inkColor,
    mutedColor: settings.mutedColor,
    accentColor: settings.accentColor,
    canvasColor: settings.canvasColor,
    spacingPreset: settings.spacingPreset,
    dateFormat: settings.dateFormat
  });

  return {
    hasFrontmatter: !!match,
    rawYaml,
    body,
    parsedYaml,
    metadata,
    config,
    error
  };
}

/**
 * Updates or injects settings into the frontmatter block of rawMarkdown
 * while preserving comments and structure as much as possible.
 */
export async function syncConfigToMarkdown(rawMarkdown = '', newConfig = {}) {
  const yaml = await getJsYaml();
  const match = rawMarkdown.match(FRONTMATTER_REGEX);

  let existingData = {};
  let body = rawMarkdown;

  if (match) {
    body = rawMarkdown.slice(match[0].length);
    try {
      existingData = yaml.load(match[1]) || {};
    } catch (e) {
      // In case of syntax error, do not overwrite to avoid destroying user's unclosed YAML
      console.warn('Cannot sync config: existing frontmatter is malformed');
      return rawMarkdown;
    }
  }

  // Merge settings
  existingData.settings = {
    ...(existingData.settings || {}),
    template: newConfig.template,
    paper: newConfig.paper,
    targetPages: newConfig.targetPages,
    margins: newConfig.margins,
    fontSize: newConfig.fontSize,
    lineHeight: newConfig.lineHeight,
    sectionSpacing: newConfig.sectionSpacing,
    itemSpacing: newConfig.itemSpacing,
    bulletSpacing: newConfig.bulletSpacing,
    primaryFont: newConfig.primaryFont,
    headerFont: newConfig.headerFont,
    monoFont: newConfig.monoFont,
    headerAlign: newConfig.headerAlign || 'default',
    sectionStyle: newConfig.sectionStyle || 'default',
    skillStyle: newConfig.skillStyle || 'default',
    bulletStyle: newConfig.bulletStyle || 'default',
    inkColor: newConfig.inkColor,
    mutedColor: newConfig.mutedColor,
    accentColor: newConfig.accentColor,
    canvasColor: newConfig.canvasColor,
    spacingPreset: newConfig.spacingPreset
  };

  const newYaml = yaml.dump(existingData, {
    lineWidth: -1,
    noRefs: true,
    quotingType: '"'
  });

  return `---\n${newYaml}---\n${body.startsWith('\n') ? body.slice(1) : body}`;
}

/**
 * Updates or injects metadata (name, title, summary, contact) into the frontmatter block
 * while preserving settings, custom fields, and the markdown body.
 */
export async function syncMetadataToMarkdown(rawMarkdown = '', newMetadata = {}) {
  const yaml = await getJsYaml();
  const match = rawMarkdown.match(FRONTMATTER_REGEX);

  let existingData = {};
  let body = rawMarkdown;

  if (match) {
    body = rawMarkdown.slice(match[0].length);
    try {
      existingData = yaml.load(match[1]) || {};
    } catch (e) {
      console.warn('Cannot sync metadata: existing frontmatter is malformed');
      return rawMarkdown;
    }
  }

  if (newMetadata.name !== undefined) existingData.name = newMetadata.name;
  if (newMetadata.title !== undefined) existingData.title = newMetadata.title;
  if (newMetadata.summary !== undefined) existingData.summary = newMetadata.summary;

  if (newMetadata.contact) {
    existingData.contact = {
      ...(existingData.contact || {}),
      ...(newMetadata.contact.email !== undefined ? { email: newMetadata.contact.email } : {}),
      ...(newMetadata.contact.phone !== undefined ? { phone: newMetadata.contact.phone } : {}),
      ...(newMetadata.contact.location !== undefined ? { location: newMetadata.contact.location } : {}),
      ...(newMetadata.contact.website !== undefined ? { website: newMetadata.contact.website } : {}),
      ...(newMetadata.contact.linkedin !== undefined ? { linkedin: newMetadata.contact.linkedin } : {}),
      ...(newMetadata.contact.github !== undefined ? { github: newMetadata.contact.github } : {})
    };
  }

  const newYaml = yaml.dump(existingData, {
    lineWidth: -1,
    noRefs: true,
    quotingType: '"'
  });

  return `---\n${newYaml}---\n${body.startsWith('\n') ? body.slice(1) : body}`;
}

/**
 * Formats contact items with clickable icons/links for live preview & PDF exports.
 */
export function renderHeaderHtml(metadata = {}) {
  if (!metadata || (!metadata.name && !metadata.title && !metadata.summary && !metadata.contact)) {
    return '';
  }

  const { name, title, summary, contact = {} } = metadata;

  const contactItems = [];

  if (contact.email) {
    const clean = contact.email.replace(/^mailto:/, '');
    contactItems.push(`<a class="contact-item contact-email" href="mailto:${clean}" target="_blank" rel="noopener">${clean}</a>`);
  }
  if (contact.phone) {
    const clean = contact.phone.replace(/^tel:/, '');
    const telDigits = clean.replace(/[^\d+]/g, '');
    contactItems.push(`<a class="contact-item contact-phone" href="tel:${telDigits}">${clean}</a>`);
  }
  if (contact.location) {
    contactItems.push(`<span class="contact-item contact-location">${contact.location}</span>`);
  }
  if (contact.website) {
    const href = contact.website.startsWith('http') ? contact.website : `https://${contact.website}`;
    const display = contact.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
    contactItems.push(`<a class="contact-item contact-website" href="${href}" target="_blank" rel="noopener">${display}</a>`);
  }
  if (contact.linkedin) {
    const href = contact.linkedin.startsWith('http') ? contact.linkedin : `https://${contact.linkedin}`;
    const display = contact.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, 'linkedin.com/in/').replace(/\/$/, '');
    contactItems.push(`<a class="contact-item contact-linkedin" href="${href}" target="_blank" rel="noopener">${display}</a>`);
  }
  if (contact.github) {
    const href = contact.github.startsWith('http') ? contact.github : `https://${contact.github}`;
    const display = contact.github.replace(/^https?:\/\/(www\.)?github\.com\//, 'github.com/').replace(/\/$/, '');
    contactItems.push(`<a class="contact-item contact-github" href="${href}" target="_blank" rel="noopener">${display}</a>`);
  }
  if (contact.portfolio && contact.portfolio !== contact.website) {
    const href = contact.portfolio.startsWith('http') ? contact.portfolio : `https://${contact.portfolio}`;
    const display = contact.portfolio.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
    contactItems.push(`<a class="contact-item contact-portfolio" href="${href}" target="_blank" rel="noopener">${display}</a>`);
  }

  let html = `<header class="resume-header">`;
  if (name) {
    html += `<h1 class="resume-name">${escapeHtml(name)}</h1>`;
  }
  if (title) {
    html += `<div class="resume-headline">${escapeHtml(title)}</div>`;
  }
  if (contactItems.length > 0) {
    html += `<div class="resume-contact-bar">${contactItems.join('<span class="contact-sep" aria-hidden="true">•</span>')}</div>`;
  }
  if (summary) {
    html += `<p class="resume-summary">${escapeHtml(summary)}</p>`;
  }
  html += `</header>`;

  return html;
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
