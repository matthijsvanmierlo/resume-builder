/**
 * Automated Verification Test Suite for Resume Builder SPA
 */
if (typeof console === 'undefined') {
  globalThis.console = {
    log: typeof print !== 'undefined' ? print : () => {},
    warn: typeof print !== 'undefined' ? print : () => {},
    error: typeof print !== 'undefined' ? print : () => {}
  };
}

import { DEFAULT_DOCUMENT_CONFIG, normalizeConfig, createInitialDocument, PAPER_DIMENSIONS, FONT_CATALOG } from '../src/state/schema.js';
import { parseFrontmatter, renderHeaderHtml, syncConfigToMarkdown, syncMetadataToMarkdown } from '../src/parser/frontmatter.js';
import { preprocessDirectives, parseEntryHeader } from '../src/parser/directives.js';
import { buildResumeAst } from '../src/parser/ast-builder.js';
import { getContrastRatio, auditColors, fixContrast } from '../src/audit/contrast.js';
import { lintResume } from '../src/audit/ats-linter.js';
import { convertRawTextToMarkdown } from '../src/io/heuristic-splitter.js';
import { jsonResumeToMarkdown, astToJsonResume } from '../src/io/json-resume.js';
import { calculatePageMetrics } from '../src/layout/pagination.js';
import { fitToPage, undoFitToPage } from '../src/layout/fit-to-page.js';
import { STARTER_RESUMES } from '../src/templates/starters.js';
import { TEMPLATES } from '../src/templates/registry.js';
import { compileInteractiveHtml } from '../src/io/html-export.js';

let passedCount = 0;
let failedCount = 0;

function assert(condition, testName) {
  if (condition) {
    print(`  ✓ PASS: ${testName}`);
    passedCount++;
  } else {
    print(`  ✗ FAIL: ${testName}`);
    failedCount++;
  }
}

function assertEqual(actual, expected, testName) {
  if (actual === expected) {
    print(`  ✓ PASS: ${testName}`);
    passedCount++;
  } else {
    print(`  ✗ FAIL: ${testName} (Expected "${expected}", got "${actual}")`);
    failedCount++;
  }
}

async function runAllTests() {
  print('====================================================');
  print('Starting Resume Builder Verification Test Suite...');
  print('====================================================\n');

  // Test 1: Schema Normalization & Clamping
  print('[1] Testing State Schema & Boundary Clamping:');
  const normalized = normalizeConfig({
    margins: 0.1,         // below min 0.35
    fontSize: 15,          // above max 12.0
    lineHeight: 1.0,       // below min 1.15
    sectionSpacing: 50,    // above max 28
    itemSpacing: 1,        // below min 2
    bulletSpacing: 20,     // above max 8
    targetPages: 4,        // invalid (must be 1 or 2)
    paper: 'legal'         // invalid (must be letter or a4)
  });

  assertEqual(normalized.margins, 0.35, 'Margins clamped to floor 0.35in');
  assertEqual(normalized.fontSize, 12.0, 'Font size clamped to ceiling 12.0pt');
  assertEqual(normalized.lineHeight, 1.15, 'Line height clamped to floor 1.15');
  assertEqual(normalized.sectionSpacing, 28, 'Section spacing clamped to ceiling 28px');
  assertEqual(normalized.itemSpacing, 2, 'Item spacing clamped to floor 2px');
  assertEqual(normalized.bulletSpacing, 8, 'Bullet spacing clamped to ceiling 8px');
  assertEqual(normalized.targetPages, 1, 'Target pages defaulted to 1');
  assertEqual(normalized.paper, 'letter', 'Paper defaulted to letter');

  // Test 2: Frontmatter Extraction & Header HTML
  print('\n[2] Testing Frontmatter Extraction & Bi-Directional Sync:');
  const starter = STARTER_RESUMES['mid-swe'].rawMarkdown;
  const fm = await parseFrontmatter(starter);

  assertEqual(fm.hasFrontmatter, true, 'Detected YAML frontmatter');
  assertEqual(fm.metadata.name, 'Alex Chen', 'Extracted name from frontmatter');
  assertEqual(fm.metadata.contact.email, 'alex.chen@example.com', 'Extracted email from frontmatter');
  assertEqual(fm.config.template, 'modern-minimal', 'Extracted template setting');

  const headerHtml = renderHeaderHtml(fm.metadata);
  assert(headerHtml.includes('mailto:alex.chen@example.com'), 'Header contains clickable mailto: link');
  assert(headerHtml.includes('tel:'), 'Header contains clickable tel: link');
  assert(headerHtml.includes('https://linkedin.com/in/alexchen-dev'), 'Header contains clickable LinkedIn URL');

  // Sync config back to markdown
  const updatedMarkdown = await syncConfigToMarkdown(starter, { ...fm.config, margins: 0.65, fontSize: 11 });
  assert(updatedMarkdown.includes('margins: 0.65'), 'Synced margins to frontmatter');
  assert(updatedMarkdown.includes('fontSize: 11'), 'Synced fontSize to frontmatter');

  // Test 3: Directives & Entry Headers
  print('\n[3] Testing Directives & Extended Shorthands:');
  const h4 = parseEntryHeader('Senior Software Engineer | Stripe | San Francisco, CA | 2022 - Present');
  assertEqual(h4.title, 'Senior Software Engineer', 'Parsed 4-segment entry title');
  assertEqual(h4.org, 'Stripe', 'Parsed 4-segment entry org');
  assertEqual(h4.location, 'San Francisco, CA', 'Parsed 4-segment entry location');
  assertEqual(h4.date, '2022 - Present', 'Parsed 4-segment entry date');

  const h3 = parseEntryHeader('B.S. in Computer Science | UC Berkeley | 2015 - 2019');
  assertEqual(h3.title, 'B.S. in Computer Science', 'Parsed 3-segment title');
  assertEqual(h3.org, 'UC Berkeley', 'Parsed 3-segment org');
  assertEqual(h3.date, '2015 - 2019', 'Parsed 3-segment date');

  const h2 = parseEntryHeader('Independent Consultant | 2020 - 2021');
  assertEqual(h2.title, 'Independent Consultant', 'Parsed 2-segment title');
  assertEqual(h2.date, '2020 - 2021', 'Parsed 2-segment date');

  const directiveText = `::: columns 2
Col A Content
|||
Col B Content
:::

::skills Languages: [TypeScript, Go, Rust]
[Python, React, Docker]
`;
  const preprocessed = preprocessDirectives(directiveText);
  assert(preprocessed.includes('resume-columns-2'), 'Rendered ::: columns 2 directive');
  assert(preprocessed.includes('skill-tag">TypeScript</li>'), 'Rendered ::skills tag list');
  assert(preprocessed.includes('skill-tag">Python</li>'), 'Rendered standalone bracketed tags');

  // Test 4: AST Construction
  print('\n[4] Testing ResumeAST Construction:');
  const ast = buildResumeAst(starter, fm.metadata, fm.config);
  assert(ast.sections.length >= 4, 'Parsed at least 4 resume sections');
  const expSection = ast.sections.find(s => s.title === 'Experience');
  assert(expSection !== undefined, 'Found Experience section in AST');
  assert(expSection.items.length >= 2, 'Experience section has entries');
  assertEqual(expSection.items[0].type, 'entry', 'First item in Experience is entry');
  assertEqual(expSection.items[0].title, 'Senior Software Engineer', 'Entry title correctly populated in AST');
  assert(expSection.items[0].bullets.length >= 3, 'Entry bullets correctly populated in AST');

  // Test 5: WCAG 2.1 AA Contrast Engine & Auto-Fix
  print('\n[5] Testing WCAG 2.1 AA Contrast & Auto-Fixer:');
  const highContrastRatio = getContrastRatio('#111827', '#ffffff');
  assert(highContrastRatio >= 14.0, `High contrast black on white ratio: ${highContrastRatio.toFixed(2)}:1`);

  const lowContrastRatio = getContrastRatio('#9ca3af', '#ffffff');
  assert(lowContrastRatio < 4.5, `Detected low contrast ratio: ${lowContrastRatio.toFixed(2)}:1`);

  const fixedHex = fixContrast('#9ca3af', '#ffffff', 4.6);
  const fixedRatio = getContrastRatio(fixedHex, '#ffffff');
  assert(fixedRatio >= 4.6, `Auto-fixed hex ${fixedHex} satisfies ratio: ${fixedRatio.toFixed(2)}:1`);

  // Test 6: ATS Compliance Linter
  print('\n[6] Testing ATS Compliance Linter:');
  const atsResult = lintResume(ast, fm.config);
  assert(atsResult.score >= 90, `Starter SWE resume scores high ATS grade: ${atsResult.score}% (${atsResult.grade.label})`);

  // Test ATS with creative non-standard headers and missing email
  const badAst = {
    metadata: { contact: {} },
    sections: [
      { title: "Where I've Been", items: [] },
      { title: "My Superpowers", items: [] }
    ]
  };
  const badAtsResult = lintResume(badAst, fm.config);
  assert(badAtsResult.score < 60, `Flagged non-standard resume with low score: ${badAtsResult.score}%`);
  const headerIssue = badAtsResult.issues.find(i => i.originalTitle === "Where I've Been");
  assert(headerIssue !== undefined, 'Flagged creative header "Where I\'ve Been"');
  assertEqual(headerIssue.suggestedTitle, 'Experience', 'Suggested standard "Experience" header');

  // Test 7: Heuristic Splitter
  print('\n[7] Testing Heuristic Splitter (Unformatted Text -> Markdown):');
  const rawText = `Jane Doe
Senior Product Manager
jane.doe@work.com | (555) 482-1928 | San Francisco, CA | linkedin.com/in/janedoe

EXPERIENCE
Lead Product Manager at FinTech Labs, 2021 - Present
• Spearheaded roadmap for core payments API serving 2M users
• Increased conversion rate by 18% through A/B experimentation

EDUCATION
B.A. in Economics, Stanford University, 2015 - 2019

SKILLS
Product Strategy, Agile/Scrum, SQL, Python, Figma
`;
  const convertedMd = convertRawTextToMarkdown(rawText);
  assert(convertedMd.includes('name: Jane Doe'), 'Heuristically extracted name');
  assert(convertedMd.includes('email: jane.doe@work.com'), 'Heuristically extracted email');
  assert(convertedMd.includes('## Experience'), 'Detected and converted EXPERIENCE section');
  assert(convertedMd.includes('## Education'), 'Detected and converted EDUCATION section');
  assert(convertedMd.includes('## Skills'), 'Detected and converted SKILLS section');
  assert(convertedMd.includes('- Spearheaded roadmap'), 'Converted bullet points cleanly');

  // Test 8: JSON Resume Adapter (Bidirectional)
  print('\n[8] Testing JSON Resume Bidirectional Conversion:');
  const sampleJsonResume = {
    basics: {
      name: 'Samantha Ray',
      label: 'Cloud Architect',
      email: 'samantha@cloud.io',
      phone: '+1 555-0199',
      profiles: [{ network: 'GitHub', url: 'https://github.com/samanthar' }]
    },
    work: [
      {
        name: 'CloudCorp',
        position: 'Principal Architect',
        startDate: '2020-01',
        highlights: ['Designed multi-region disaster recovery']
      }
    ],
    skills: [
      {
        name: 'Cloud',
        keywords: ['AWS', 'GCP', 'Kubernetes']
      }
    ]
  };

  const mdFromJson = jsonResumeToMarkdown(sampleJsonResume);
  assert(mdFromJson.includes('name: Samantha Ray'), 'Converted JSON resume name to YAML');
  assert(mdFromJson.includes('### Principal Architect | CloudCorp'), 'Converted JSON resume work entry');
  assert(mdFromJson.includes('::skills Cloud: [AWS, GCP, Kubernetes]'), 'Converted JSON resume skills');

  const astFromJson = buildResumeAst(mdFromJson, { name: 'Samantha Ray' }, DEFAULT_DOCUMENT_CONFIG);
  const exportedBack = astToJsonResume(astFromJson, { name: 'Samantha Ray', title: 'Cloud Architect' });
  assertEqual(exportedBack.basics.name, 'Samantha Ray', 'Round-trip exported JSON resume preserves name');
  assert(exportedBack.work.length > 0, 'Round-trip exported JSON resume preserves work');

  // Test 9: Paper Dimensions & Pagination Metrics
  print('\n[9] Testing Pagination & Paper Calibration:');
  assertEqual(PAPER_DIMENSIONS.letter.widthPx, 816, 'Letter width: 816px at 96 DPI');
  assertEqual(PAPER_DIMENSIONS.letter.heightPx, 1056, 'Letter height: 1056px at 96 DPI');
  assertEqual(PAPER_DIMENSIONS.a4.widthPx, 793.7, 'A4 width: 793.7px');
  assertEqual(PAPER_DIMENSIONS.a4.heightPx, 1122.5, 'A4 height: 1122.5px');

  // Mock DOM sheet for pagination test
  const mockSheet = { scrollHeight: 950 };
  const letterMetrics = calculatePageMetrics(mockSheet, { paper: 'letter', targetPages: 1 });
  assertEqual(letterMetrics.isOverflowing, false, '950px fits within 1056px Letter height');
  assertEqual(letterMetrics.statusType, 'good', 'Status type is good for 950px');

  const mockOverflowSheet = { scrollHeight: 1200 };
  const overflowMetrics = calculatePageMetrics(mockOverflowSheet, { paper: 'letter', targetPages: 1 });
  assertEqual(overflowMetrics.isOverflowing, true, '1200px exceeds 1056px Letter height');
  assert(overflowMetrics.overflowPx > 0, 'Calculated positive overflow pixels');

  // Test 10: Fit-to-Page Solver
  print('\n[10] Testing Fit-to-Page Solver & Undo:');
  let simulatedHeight = 1200;
  const mockSolverSheet = {
    get scrollHeight() { return simulatedHeight; }
  };

  const initialConfig = {
    ...DEFAULT_DOCUMENT_CONFIG,
    margins: 0.6,
    fontSize: 10.5,
    lineHeight: 1.35,
    sectionSpacing: 18,
    itemSpacing: 8,
    bulletSpacing: 4
  };

  const fitResult = fitToPage(1, initialConfig, mockSolverSheet, (newConfig) => {
    // Simulate content height reducing as parameters contract
    simulatedHeight = Math.max(900, simulatedHeight - 60);
  });

  assert(fitResult !== null, 'Fit-to-page solver executed');
  assert(fitResult.config.sectionSpacing < initialConfig.sectionSpacing || fitResult.config.lineHeight < initialConfig.lineHeight, 'Reduced spacing/line-height to fit');

  const backup = undoFitToPage();
  assertEqual(backup.sectionSpacing, 18, 'Undo restored previous sectionSpacing');
  assertEqual(backup.margins, 0.6, 'Undo restored previous margins');

  // Test 11: Profile & Contact Metadata Sync
  print('\n[11] Testing Metadata-to-Frontmatter Sync (syncMetadataToMarkdown):');
  const sampleMd = `---
name: Old Name
title: Old Title
summary: Old summary
contact:
  email: old@example.com
settings:
  template: modern-minimal
  margins: 0.5
---

## Experience
### Role | Org | 2022
- Bullet 1
`;
  const updatedMetaMd = await syncMetadataToMarkdown(sampleMd, {
    name: 'Jane Doe',
    title: 'Lead Architect',
    summary: 'Seasoned systems builder',
    contact: {
      email: 'jane@new.io',
      phone: '+1 555-0100',
      location: 'New York, NY',
      linkedin: 'linkedin.com/in/janedoe'
    }
  });

  assert(updatedMetaMd.includes('name: "Jane Doe"') || updatedMetaMd.includes('name: Jane Doe'), 'Updated name in frontmatter');
  assert(updatedMetaMd.includes('title: "Lead Architect"') || updatedMetaMd.includes('title: Lead Architect'), 'Updated title in frontmatter');
  assert(updatedMetaMd.includes('email: "jane@new.io"') || updatedMetaMd.includes('email: jane@new.io'), 'Updated email in frontmatter');
  assert(updatedMetaMd.includes('template: "modern-minimal"') || updatedMetaMd.includes('template: modern-minimal'), 'Preserved settings in frontmatter');
  assert(updatedMetaMd.includes('### Role | Org | 2022'), 'Preserved markdown body');

  // Test 12: Blank-Guided Starter & Template Registry
  print('\n[12] Testing Blank-Guided Starter & Template Registry:');
  const blankStarter = STARTER_RESUMES['blank-guided'];
  assert(blankStarter !== undefined, 'Found blank-guided starter resume');
  assert(blankStarter.rawMarkdown.includes('## Experience'), 'Blank starter contains structured sections');
  assertEqual(TEMPLATES.length, 12, 'All 12 templates registered');
  TEMPLATES.forEach(t => {
    assert(!!t.defaultPairing && !!t.defaultPairing.primaryFont, `Template ${t.name} has valid defaultPairing`);
  });

  // Test 13: Interactive HTML Website Compiler
  print('\n[13] Testing Interactive HTML Website Compiler (compileInteractiveHtml):');
  const websiteAst = buildResumeAst(starter, fm.metadata, fm.config);
  const websiteHtml = compileInteractiveHtml(websiteAst, fm.metadata, fm.config, '<p>Mock Sheet</p>');

  assert(websiteHtml.includes('<!DOCTYPE html>'), 'Generated valid DOCTYPE html');
  assert(websiteHtml.includes('Alex Chen'), 'Rendered candidate name in web portfolio');
  assert(websiteHtml.includes('Senior Software Engineer'), 'Rendered candidate title');
  assert(websiteHtml.includes('class="timeline-card"'), 'Rendered experience timeline cards');
  assert(websiteHtml.includes('data-skill="TypeScript"'), 'Rendered interactive skill chips');
  assert(websiteHtml.includes('class="metric-highlight"'), 'Applied quantitative metric highlights');
  assert(websiteHtml.includes('id="btn-toggle-view"'), 'Included Web vs Paper mode toggle button');
  assert(websiteHtml.includes('id="btn-download-vcard"'), 'Included client-side vCard generator button');
  assert(websiteHtml.includes('@media print'), 'Included embedded print isolation stylesheet');
  assert(websiteHtml.includes('BEGIN:VCARD'), 'Included vCard generation script');
  assert(websiteHtml.includes('schema.org'), 'Included structured Person schema');

  // Test 14: Modular Layout Styles & Extended Font Catalog
  print('\n[14] Testing Modular Layout Styles & Extended Font Catalog:');
  const customConfig = normalizeConfig({
    targetPages: 3,
    headerAlign: 'center',
    sectionStyle: 'left-accent',
    skillStyle: 'badge',
    bulletStyle: 'arrow',
    primaryFont: 'Atkinson Hyperlegible',
    headerFont: 'Lora',
    monoFont: 'IBM Plex Mono'
  });

  assertEqual(customConfig.targetPages, 3, 'Target pages accepts 3');
  assertEqual(customConfig.headerAlign, 'center', 'Header align set to center');
  assertEqual(customConfig.sectionStyle, 'left-accent', 'Section style set to left-accent');
  assertEqual(customConfig.skillStyle, 'badge', 'Skill style set to badge');
  assertEqual(customConfig.bulletStyle, 'arrow', 'Bullet style set to arrow');
  assert(!!FONT_CATALOG['Atkinson Hyperlegible'], 'Accessible font Atkinson Hyperlegible in catalog');
  assert(!!FONT_CATALOG['Lexend'], 'Accessible font Lexend in catalog');
  assert(!!FONT_CATALOG['Lora'], 'Editorial font Lora in catalog');
  assert(!!FONT_CATALOG['IBM Plex Mono'], 'Technical monospace IBM Plex Mono in catalog');
  assert(FONT_CATALOG['Atkinson Hyperlegible'].category === 'accessible-sans', 'Atkinson Hyperlegible categorized as accessible-sans');

  // Test 15: Manual Page Break Directive Processing
  print('\n[15] Testing Manual Page Break Directive Processing:');
  const breakDirective1 = preprocessDirectives('::: page-break\n');
  assert(breakDirective1.includes('class="resume-manual-page-break"'), 'Processed ::: page-break directive');
  assert(breakDirective1.includes('role="separator"'), 'Manual page break has accessible role="separator"');

  const breakDirective2 = preprocessDirectives('\\pagebreak\n');
  assert(breakDirective2.includes('class="resume-manual-page-break"'), 'Processed \\pagebreak shorthand');

  const breakDirective3 = preprocessDirectives('::pagebreak\n');
  assert(breakDirective3.includes('class="resume-manual-page-break"'), 'Processed ::pagebreak shorthand');

  // Test 16: Frontmatter Sync with Modular Styles
  print('\n[16] Testing Frontmatter Sync with Modular Styles:');
  const modularMd = await syncConfigToMarkdown(starter, customConfig);
  assert(modularMd.includes('headerAlign: center'), 'Frontmatter contains headerAlign');
  assert(modularMd.includes('sectionStyle: left-accent'), 'Frontmatter contains sectionStyle');
  assert(modularMd.includes('skillStyle: badge'), 'Frontmatter contains skillStyle');
  assert(modularMd.includes('bulletStyle: arrow'), 'Frontmatter contains bulletStyle');
  assert(modularMd.includes('targetPages: 3'), 'Frontmatter contains targetPages: 3');

  const parsedModular = await parseFrontmatter(modularMd);
  assertEqual(parsedModular.config.headerAlign, 'center', 'Parsed modular headerAlign correctly');
  assertEqual(parsedModular.config.sectionStyle, 'left-accent', 'Parsed modular sectionStyle correctly');
  assertEqual(parsedModular.config.skillStyle, 'badge', 'Parsed modular skillStyle correctly');
  assertEqual(parsedModular.config.bulletStyle, 'arrow', 'Parsed modular bulletStyle correctly');
  assertEqual(parsedModular.config.targetPages, 3, 'Parsed modular targetPages: 3 correctly');

  // Test 17: Multi-Page Spacing Parity Metrics
  print('\n[17] Testing Multi-Page Spacing Parity Metrics:');
  const mockMultiPageSheet = {
    scrollHeight: 2200,
    querySelectorAll: (selector) => {
      if (selector === '.page-break-spacer') {
        return [{}, {}]; // 2 spacers = 3 pages
      }
      return [];
    }
  };
  const multiPageMetrics = calculatePageMetrics(mockMultiPageSheet, { paper: 'letter', targetPages: 3, margins: 0.5 });
  assertEqual(multiPageMetrics.renderedPages, 3, 'Detected 3 rendered pages via spacers');
  assertEqual(multiPageMetrics.isOverflowing, false, '3 pages within 3-page target is not overflowing');
  assertEqual(multiPageMetrics.statusType, 'good', 'Status type is good for 3 pages within target');

  print('\n====================================================');
  print(`Test Suite Complete: ${passedCount} PASSED, ${failedCount} FAILED`);
  print('====================================================');

  if (failedCount > 0) {
    throw new Error(`${failedCount} test(s) failed`);
  }
}

runAllTests().catch(err => {
  print('ERROR in test suite:', err);
});
