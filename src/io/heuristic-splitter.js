/**
 * Heuristic Splitter: Converts raw unformatted text (from PDF copy/paste or TXT)
 * into structured Resume Markdown with YAML frontmatter.
 */

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_REGEX = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
const LINKEDIN_REGEX = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i;
const GITHUB_REGEX = /(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/i;
const URL_REGEX = /https?:\/\/[^\s]+/;

const KNOWN_SECTIONS = [
  { pattern: /^(?:experience|work\s+experience|professional\s+experience|work\s+history|employment)\b/i, title: 'Experience' },
  { pattern: /^(?:education|academic\s+background|academic\s+history)\b/i, title: 'Education' },
  { pattern: /^(?:skills|technical\s+skills|core\s+competencies|technologies)\b/i, title: 'Skills' },
  { pattern: /^(?:projects|key\s+projects|selected\s+projects)\b/i, title: 'Projects' },
  { pattern: /^(?:certifications|certificates|licenses)\b/i, title: 'Certifications' },
  { pattern: /^(?:summary|professional\s+summary|about\s+me|profile|objective)\b/i, title: 'Summary' },
  { pattern: /^(?:publications|papers)\b/i, title: 'Publications' },
  { pattern: /^(?:awards|honors|achievements)\b/i, title: 'Awards' }
];

const DATE_RANGE_REGEX = /(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?|\b\d{4}\b)[\s\S]*?(?:Present|Current|Now|\b\d{4}\b)/i;

export function convertRawTextToMarkdown(rawText = '') {
  const lines = rawText.split(/\r?\n/).map(l => l.trim());
  const nonEmptyLines = lines.filter(Boolean);

  if (nonEmptyLines.length === 0) {
    return '';
  }

  // 1. Extract contact metadata from the first 8 non-empty lines
  const metadata = {
    name: '',
    title: '',
    summary: '',
    contact: {
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      github: '',
      website: ''
    }
  };

  const headerCandidates = nonEmptyLines.slice(0, 8);
  let headerEndIndex = 0;

  headerCandidates.forEach((line, idx) => {
    let matchedContact = false;

    const emailMatch = line.match(EMAIL_REGEX);
    if (emailMatch && !metadata.contact.email) {
      metadata.contact.email = emailMatch[0];
      matchedContact = true;
    }

    const phoneMatch = line.match(PHONE_REGEX);
    if (phoneMatch && !metadata.contact.phone) {
      metadata.contact.phone = phoneMatch[0];
      matchedContact = true;
    }

    const liMatch = line.match(LINKEDIN_REGEX);
    if (liMatch && !metadata.contact.linkedin) {
      metadata.contact.linkedin = liMatch[0];
      matchedContact = true;
    }

    const ghMatch = line.match(GITHUB_REGEX);
    if (ghMatch && !metadata.contact.github) {
      metadata.contact.github = ghMatch[0];
      matchedContact = true;
    }

    if (matchedContact) {
      headerEndIndex = Math.max(headerEndIndex, idx + 1);
    }
  });

  // Assume line 0 is candidate name if it's short and doesn't contain email/url
  if (nonEmptyLines[0] && nonEmptyLines[0].length < 40 && !nonEmptyLines[0].includes('@') && !URL_REGEX.test(nonEmptyLines[0])) {
    metadata.name = nonEmptyLines[0];
    headerEndIndex = Math.max(headerEndIndex, 1);
  }

  // Assume line 1 might be headline/title if short
  if (nonEmptyLines[1] && nonEmptyLines[1].length < 60 && !nonEmptyLines[1].includes('@') && !PHONE_REGEX.test(nonEmptyLines[1])) {
    metadata.title = nonEmptyLines[1];
    headerEndIndex = Math.max(headerEndIndex, 2);
  }

  // 2. Process Remaining Body Lines
  const bodyLines = nonEmptyLines.slice(headerEndIndex);
  const outputLines = [];
  let inSkillsSection = false;

  for (let i = 0; i < bodyLines.length; i++) {
    const line = bodyLines[i];

    // Check for Section Header
    let matchedSection = null;
    const cleanHeader = line.replace(/[:#\-_]/g, '').trim();

    for (const sec of KNOWN_SECTIONS) {
      if (sec.pattern.test(cleanHeader)) {
        matchedSection = sec.title;
        break;
      }
    }

    if (matchedSection) {
      outputLines.push(`\n## ${matchedSection}\n`);
      inSkillsSection = matchedSection === 'Skills';
      continue;
    }

    // Check for Bullet Point
    if (/^[•▪·*>\-–—]\s*/.test(line)) {
      const cleanBullet = line.replace(/^[•▪·*>\-–—]\s*/, '').trim();
      outputLines.push(`- ${cleanBullet}`);
      continue;
    }

    // Check for Date Range & Entry Line
    if (DATE_RANGE_REGEX.test(line)) {
      // Split into parts or look at surrounding lines
      const dateMatch = line.match(DATE_RANGE_REGEX);
      const dateStr = dateMatch ? dateMatch[0].trim() : '';
      const remainder = line.replace(dateStr, '').replace(/[-–—|•]/g, ' ').trim();

      const parts = remainder.split(/\s{2,}|\bat\b|\bfor\b|,/).map(p => p.trim()).filter(Boolean);
      const role = parts[0] || 'Role';
      const company = parts[1] || '';
      const location = parts[2] || '';

      const entryHeader = `### ${role}${company ? ' | ' + company : ''}${location ? ' | ' + location : ''} | ${dateStr}`;
      outputLines.push(`\n${entryHeader}`);
      continue;
    }

    // Check for skills formatting
    if (inSkillsSection && line.includes(',')) {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        const cat = line.slice(0, colonIdx).trim();
        const tags = line.slice(colonIdx + 1).trim();
        outputLines.push(`::skills ${cat}: [${tags}]`);
      } else {
        outputLines.push(`::skills [${line}]`);
      }
      continue;
    }

    // Standard paragraph line
    outputLines.push(line);
  }

  // Build Frontmatter YAML
  const yamlBlock = `---
name: ${metadata.name || 'Your Name'}
title: ${metadata.title || 'Professional Title'}
contact:
  email: ${metadata.contact.email || ''}
  phone: "${metadata.contact.phone || ''}"
  location: ${metadata.contact.location || ''}
  linkedin: ${metadata.contact.linkedin || ''}
  github: ${metadata.contact.github || ''}
settings:
  template: modern-minimal
  paper: letter
  targetPages: 1
  margins: 0.5
  fontSize: 10
  lineHeight: 1.30
  sectionSpacing: 14
  itemSpacing: 6
  bulletSpacing: 3
  primaryFont: Inter
  headerFont: Inter
  accentColor: "#1e3a8a"
---
`;

  return `${yamlBlock}\n${outputLines.join('\n')}\n`;
}
