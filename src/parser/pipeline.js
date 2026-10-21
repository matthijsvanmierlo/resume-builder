/**
 * Main Markup Parsing Pipeline
 * Orchestrates: Frontmatter -> Directives Pre-process -> Marked -> DOMPurify -> AST -> Audits
 */
import { getMarked, getPurify } from '../vendor/loader.js';
import { parseFrontmatter, renderHeaderHtml } from './frontmatter.js';
import { preprocessDirectives, parseEntryHeader, postprocessHtml } from './directives.js';
import { buildResumeAst } from './ast-builder.js';
import { lintResume } from '../audit/ats-linter.js';
import { auditColors } from '../audit/contrast.js';

let markedInstance = null;

async function initMarked() {
  if (markedInstance) return markedInstance;
  const markedPkg = await getMarked();
  const markedLib = markedPkg.marked || markedPkg;

  const renderer = new markedLib.Renderer();

  // Custom Heading Renderer: handles ### Title | Org | Location | Dates
  renderer.heading = function (text, level, raw) {
    if (level === 3 && raw.includes('|')) {
      const parsed = parseEntryHeader(raw);
      return parsed.html;
    }
    if (level === 2) {
      const cleanSlug = raw.toLowerCase().replace(/[^a-z0-9]/g, '-');
      return `<h2 class="resume-section-title" data-section="${cleanSlug}">${text}</h2>`;
    }
    return `<h${level}>${text}</h${level}>`;
  };

  // Safe external links
  renderer.link = function (href, title, text) {
    const titleAttr = title ? ` title="${title}"` : '';
    return `<a href="${href}" target="_blank" rel="noopener"${titleAttr}>${text}</a>`;
  };

  markedLib.setOptions({
    renderer,
    gfm: true,
    breaks: true
  });

  markedInstance = markedLib;
  return markedInstance;
}

export async function parseResumePipeline(rawMarkdown = '', options = {}) {
  const startTime = performance.now();

  // 1. Frontmatter extraction
  const fm = await parseFrontmatter(rawMarkdown);
  const metadata = fm.metadata;
  const config = options.forcedConfig || fm.config;

  // 2. Pre-process directives (::: columns, ::skills, etc.)
  const preprocessedBody = preprocessDirectives(fm.body);

  // 3. CommonMark parsing via marked
  const markedLib = await initMarked();
  const rawHtml = markedLib.parse(preprocessedBody);

  // 4. Sanitization via DOMPurify
  const purify = await getPurify();
  const sanitizedHtml = purify.sanitize(rawHtml, {
    ADD_ATTR: ['target', 'rel', 'data-section', 'aria-label', 'role'],
    ADD_TAGS: ['article', 'aside', 'section']
  });

  // 5. Post-process HTML (entry grouping, section tagging, split layout)
  const bodyHtml = postprocessHtml(sanitizedHtml, config);
  const headerHtml = renderHeaderHtml(metadata);
  const fullContentHtml = `${headerHtml}\n<div class="resume-body">${bodyHtml}</div>`;

  // 6. Build AST
  const ast = buildResumeAst(rawMarkdown, metadata, config);

  // 7. Real-Time Audits
  const atsReport = lintResume(ast, config, fullContentHtml);
  const contrastReport = auditColors(config);

  const durationMs = performance.now() - startTime;

  return {
    rawMarkdown,
    html: fullContentHtml,
    headerHtml,
    bodyHtml,
    ast,
    metadata,
    config,
    atsReport,
    contrastReport,
    frontmatterError: fm.error,
    durationMs
  };
}
