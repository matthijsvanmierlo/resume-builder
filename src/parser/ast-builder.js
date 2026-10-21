/**
 * AST Builder: Constructs a normalized ResumeAST for both HTML preview,
 * JSON Resume export, and docx.js OpenXML compilation.
 */
import { parseEntryHeader } from './directives.js';

const SECTION_HEADER_REGEX = /^##\s+(.+)$/;
const ENTRY_HEADER_REGEX = /^###\s+(.+)$/;
const SKILLS_DIRECTIVE_REGEX = /^::skills\s*(?:([^:\[\n]+):)?\s*\[(.*?)\]\s*$/;
const STANDALONE_TAGS_REGEX = /^\[([a-zA-Z0-9\s.,+#\-_/()&]{2,})\]\s*$/;
const BULLET_REGEX = /^[-*•▪·]\s+(.+)$/;

export function buildResumeAst(rawMarkdown = '', metadata = {}, config = {}) {
  const ast = {
    metadata: { ...metadata },
    config: { ...config },
    sections: []
  };

  const lines = rawMarkdown.split(/\r?\n/);
  let currentSection = null;
  let currentEntry = null;

  function commitEntry() {
    if (currentEntry && currentSection) {
      currentSection.items.push(currentEntry);
      currentEntry = null;
    }
  }

  function commitSection() {
    commitEntry();
    if (currentSection) {
      ast.sections.push(currentSection);
      currentSection = null;
    }
  }

  let inYaml = false;
  let inColumns = false;
  let currentColumnData = null;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Skip YAML frontmatter block
    if (i === 0 && line === '---') {
      inYaml = true;
      continue;
    }
    if (inYaml) {
      if (line === '---') {
        inYaml = false;
      }
      continue;
    }

    if (!line) {
      continue;
    }

    // Check ::: columns N
    if (line.startsWith('::: columns') || line.startsWith('::: layout-columns')) {
      commitEntry();
      inColumns = true;
      currentColumnData = {
        type: 'columns',
        count: parseInt(line.replace(/\D/g, ''), 10) || 2,
        columns: [[]]
      };
      continue;
    }
    if (line === ':::' && inColumns) {
      if (currentSection && currentColumnData) {
        currentSection.items.push(currentColumnData);
      }
      inColumns = false;
      currentColumnData = null;
      continue;
    }
    if (line === '|||' && inColumns && currentColumnData) {
      currentColumnData.columns.push([]);
      continue;
    }

    // Section Header: ## Experience
    const sectionMatch = line.match(SECTION_HEADER_REGEX);
    if (sectionMatch) {
      commitSection();
      currentSection = {
        type: 'section',
        title: sectionMatch[1].trim(),
        items: []
      };
      continue;
    }

    // If no section has begun yet, create an implicit default section
    if (!currentSection && !line.startsWith('# ')) {
      currentSection = {
        type: 'section',
        title: 'Overview',
        items: []
      };
    }

    // Entry Header: ### Senior Software Engineer | Acme Corp | 2021-Present
    const entryMatch = line.match(ENTRY_HEADER_REGEX);
    if (entryMatch) {
      commitEntry();
      const parsed = parseEntryHeader(entryMatch[1]);
      currentEntry = {
        type: 'entry',
        title: parsed.title,
        org: parsed.org,
        location: parsed.location,
        date: parsed.date,
        bullets: [],
        paragraphs: []
      };
      continue;
    }

    // Skills Directive: ::skills Category: [A, B, C]
    const skillMatch = line.match(SKILLS_DIRECTIVE_REGEX);
    if (skillMatch) {
      const category = skillMatch[1]?.trim() || '';
      const tags = skillMatch[2].split(',').map(s => s.trim()).filter(Boolean);
      const skillNode = { type: 'skills', category, tags };
      if (currentEntry) {
        currentEntry.bullets.push(`${category ? category + ': ' : ''}${tags.join(', ')}`);
      } else if (currentSection) {
        currentSection.items.push(skillNode);
      }
      continue;
    }

    // Standalone Tag List: [A, B, C]
    const tagMatch = line.match(STANDALONE_TAGS_REGEX);
    if (tagMatch && tagMatch[1].includes(',')) {
      const tags = tagMatch[1].split(',').map(s => s.trim()).filter(Boolean);
      const skillNode = { type: 'skills', category: '', tags };
      if (currentEntry) {
        currentEntry.bullets.push(tags.join(', '));
      } else if (currentSection) {
        currentSection.items.push(skillNode);
      }
      continue;
    }

    // Bullet item: - Developed microservices...
    const bulletMatch = line.match(BULLET_REGEX);
    if (bulletMatch) {
      const bulletText = bulletMatch[1].trim();
      if (currentEntry) {
        currentEntry.bullets.push(bulletText);
      } else if (currentSection) {
        // Find or create a bullet list item in section
        const lastItem = currentSection.items[currentSection.items.length - 1];
        if (lastItem && lastItem.type === 'list') {
          lastItem.items.push(bulletText);
        } else {
          currentSection.items.push({
            type: 'list',
            items: [bulletText]
          });
        }
      }
      continue;
    }

    // Paragraph text
    if (currentEntry) {
      currentEntry.paragraphs.push(line);
    } else if (currentSection) {
      currentSection.items.push({
        type: 'paragraph',
        text: line
      });
    }
  }

  commitSection();
  return ast;
}
