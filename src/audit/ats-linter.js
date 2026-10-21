/**
 * Real-Time ATS (Applicant Tracking System) Compliance Linter & Scoring Engine
 */

const STANDARD_SECTION_MAP = {
  // Experience
  'experience': 'Experience',
  'work experience': 'Experience',
  'professional experience': 'Experience',
  'employment': 'Experience',
  'employment history': 'Experience',
  'work history': 'Experience',

  // Education
  'education': 'Education',
  'academic history': 'Education',
  'academic background': 'Education',

  // Skills
  'skills': 'Skills',
  'technical skills': 'Skills',
  'core competencies': 'Skills',
  'areas of expertise': 'Skills',
  'technologies': 'Skills',

  // Projects
  'projects': 'Projects',
  'key projects': 'Projects',
  'personal projects': 'Projects',

  // Certifications
  'certifications': 'Certifications',
  'licenses': 'Certifications',
  'certificates': 'Certifications',

  // Summary
  'summary': 'Summary',
  'professional summary': 'Summary',
  'about me': 'Summary',
  'profile': 'Summary',
  'overview': 'Summary'
};

const ACTION_VERBS = new Set([
  'built', 'engineered', 'architected', 'developed', 'designed', 'spearheaded',
  'implemented', 'led', 'managed', 'created', 'optimized', 'reduced', 'increased',
  'accelerated', 'automated', 'delivered', 'deployed', 'founded', 'established',
  'orchestrated', 'streamlined', 'scale', 'scaled', 'mentored', 'drove', 'generated',
  'formulated', 'negotiated', 'launched', 'overhauled', 'modernized', 'trained'
]);

export function lintResume(ast, config, rawHtml = '') {
  const issues = [];
  let score = 100;

  const metadata = ast.metadata || {};
  const contact = metadata.contact || {};

  // 1. Contact Info Checks (max deduction: 30 pts)
  if (!contact.email) {
    score -= 15;
    issues.push({
      category: 'contact',
      severity: 'critical',
      message: 'Missing contact email address',
      recommendation: 'Add your primary email in the frontmatter `contact: email:` field.'
    });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.replace(/^mailto:/, ''))) {
    score -= 8;
    issues.push({
      category: 'contact',
      severity: 'warning',
      message: 'Invalid email address format',
      recommendation: 'Ensure your email follows standard format (e.g., name@domain.com).'
    });
  }

  if (!contact.phone) {
    score -= 8;
    issues.push({
      category: 'contact',
      severity: 'warning',
      message: 'Missing phone number',
      recommendation: 'Add a standard phone number (e.g., +1 (555) 123-4567).'
    });
  }

  if (!contact.location) {
    score -= 4;
    issues.push({
      category: 'contact',
      severity: 'info',
      message: 'Missing location (City, State/Country)',
      recommendation: 'Include your city and state/country for regional recruiter filters.'
    });
  }

  if (!contact.linkedin && !contact.github && !contact.website) {
    score -= 5;
    issues.push({
      category: 'contact',
      severity: 'info',
      message: 'No professional profile links provided',
      recommendation: 'Include a LinkedIn or GitHub profile link.'
    });
  }

  // 2. Section Headings Taxonomy Checks (max deduction: 30 pts)
  const sections = ast.sections || [];
  const sectionTitles = sections.map(s => s.title.toLowerCase().trim());

  if (sections.length === 0) {
    score -= 30;
    issues.push({
      category: 'structure',
      severity: 'critical',
      message: 'No standard sections found',
      recommendation: 'Add `## Experience`, `## Education`, and `## Skills` headings.'
    });
  } else {
    // Check for Experience
    const hasExp = sectionTitles.some(t => STANDARD_SECTION_MAP[t] === 'Experience');
    if (!hasExp) {
      score -= 15;
      issues.push({
        category: 'structure',
        severity: 'critical',
        message: 'Missing standard "Experience" section',
        recommendation: 'Rename your work section to `## Experience` or `## Work Experience`.'
      });
    }

    // Check for Education
    const hasEdu = sectionTitles.some(t => STANDARD_SECTION_MAP[t] === 'Education');
    if (!hasEdu) {
      score -= 10;
      issues.push({
        category: 'structure',
        severity: 'warning',
        message: 'Missing standard "Education" section',
        recommendation: 'Add an `## Education` section.'
      });
    }

    // Check for Skills
    const hasSkills = sectionTitles.some(t => STANDARD_SECTION_MAP[t] === 'Skills');
    if (!hasSkills) {
      score -= 10;
      issues.push({
        category: 'structure',
        severity: 'warning',
        message: 'Missing standard "Skills" section',
        recommendation: 'Add a `## Skills` or `## Technical Skills` section.'
      });
    }

    // Check for creative non-standard headers
    sections.forEach(s => {
      const lower = s.title.toLowerCase().trim();
      if (!STANDARD_SECTION_MAP[lower] && lower !== 'overview') {
        const suggested = suggestStandardHeader(lower);
        issues.push({
          category: 'structure',
          severity: 'warning',
          message: `Non-standard section header: "${s.title}"`,
          recommendation: suggested ? `Rename to standard "${suggested}" for maximum ATS parsing accuracy.` : 'Consider using standard industry headers (Experience, Education, Skills, Projects, Certifications).',
          originalTitle: s.title,
          suggestedTitle: suggested
        });
        score -= 4;
      }
    });
  }

  // 3. Typography & Density Checks (max deduction: 20 pts)
  if (config) {
    if (config.fontSize < 9.0) {
      score -= 10;
      issues.push({
        category: 'typography',
        severity: 'critical',
        message: `Font size (${config.fontSize}pt) is below the 9.0pt ATS legibility floor`,
        recommendation: 'Increase font size to at least 9.0pt (10.0pt recommended).'
      });
    }

    if (config.margins < 0.35) {
      score -= 6;
      issues.push({
        category: 'typography',
        severity: 'warning',
        message: `Margins (${config.margins}in) risk printer edge clipping`,
        recommendation: 'Keep margins at 0.38in or higher for reliable printing.'
      });
    }
  }

  // 4. Bullet Point Quality & Action Verbs
  let totalBullets = 0;
  let actionVerbBullets = 0;
  let overlyLongBullets = 0;

  sections.forEach(s => {
    s.items.forEach(item => {
      if (item.type === 'entry' && item.bullets) {
        item.bullets.forEach(b => {
          totalBullets++;
          if (b.length > 320) {
            overlyLongBullets++;
          }
          const firstWord = b.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '');
          if (firstWord && ACTION_VERBS.has(firstWord)) {
            actionVerbBullets++;
          }
        });
      } else if (item.type === 'list' && item.items) {
        item.items.forEach(b => {
          totalBullets++;
          if (b.length > 320) {
            overlyLongBullets++;
          }
          const firstWord = b.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '');
          if (firstWord && ACTION_VERBS.has(firstWord)) {
            actionVerbBullets++;
          }
        });
      }
    });
  });

  if (overlyLongBullets > 0) {
    score -= Math.min(10, overlyLongBullets * 3);
    issues.push({
      category: 'content',
      severity: 'warning',
      message: `${overlyLongBullets} bullet point(s) exceed 300 characters`,
      recommendation: 'Keep bullets concise (1–2 sentences, under 300 characters).'
    });
  }

  if (totalBullets >= 4 && (actionVerbBullets / totalBullets) < 0.5) {
    score -= 6;
    issues.push({
      category: 'content',
      severity: 'info',
      message: 'Many bullets lack strong action verbs',
      recommendation: 'Start bullet points with strong past-tense verbs (e.g. Engineered, Spearheaded, Reduced, Delivered).'
    });
  }

  // 5. Raw DOM / Structural checks
  if (rawHtml) {
    if (/<svg\b[^>]*>/i.test(rawHtml)) {
      score -= 5;
      issues.push({
        category: 'structure',
        severity: 'warning',
        message: 'Raw SVG elements detected in resume content',
        recommendation: 'Some legacy ATS parsers fail when raw SVGs are embedded. Use clean text markers instead.'
      });
    }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    score,
    grade: getGrade(score),
    issues,
    stats: {
      sectionCount: sections.length,
      totalBullets,
      actionVerbRatio: totalBullets > 0 ? Math.round((actionVerbBullets / totalBullets) * 100) : 0
    }
  };
}

function suggestStandardHeader(title) {
  const clean = title.toLowerCase().replace(/['"’]/g, '');
  for (const [key, standard] of Object.entries(STANDARD_SECTION_MAP)) {
    if (clean.includes(key)) return standard;
  }
  if (clean.includes('job') || clean.includes('career') || clean.includes('role') || clean.includes('where ive been') || clean.includes('journey') || clean.includes('work') || clean.includes('been')) return 'Experience';
  if (clean.includes('degree') || clean.includes('college') || clean.includes('university') || clean.includes('school') || clean.includes('learning')) return 'Education';
  if (clean.includes('tool') || clean.includes('stack') || clean.includes('proficiency') || clean.includes('superpower') || clean.includes('competenc') || clean.includes('technolog')) return 'Skills';
  if (clean.includes('portfolio') || clean.includes('creation') || clean.includes('build')) return 'Projects';
  if (clean.includes('credential') || clean.includes('certificate')) return 'Certifications';
  return 'Experience';
}

function getGrade(score) {
  if (score >= 90) return { label: 'Excellent', color: '#10b981' };
  if (score >= 75) return { label: 'Good', color: '#3b82f6' };
  if (score >= 60) return { label: 'Needs Improvement', color: '#f59e0b' };
  return { label: 'Poor', color: '#ef4444' };
}
