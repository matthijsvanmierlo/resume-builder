/**
 * Bidirectional JSON Resume (jsonresume.org) Adapter
 */

export function jsonResumeToMarkdown(json) {
  const data = typeof json === 'string' ? JSON.parse(json) : json;
  const basics = data.basics || {};

  let linkedin = '';
  let github = '';
  if (Array.isArray(basics.profiles)) {
    basics.profiles.forEach(p => {
      const net = (p.network || '').toLowerCase();
      if (net.includes('linkedin')) linkedin = p.url || '';
      if (net.includes('github')) github = p.url || '';
    });
  }

  const loc = basics.location ? [basics.location.city, basics.location.region || basics.location.countryCode].filter(Boolean).join(', ') : '';

  const frontmatter = `---
name: ${basics.name || 'Your Name'}
title: ${basics.label || ''}
summary: ${basics.summary ? JSON.stringify(basics.summary) : '""'}
contact:
  email: ${basics.email || ''}
  phone: "${basics.phone || ''}"
  location: ${loc}
  website: ${basics.url || ''}
  linkedin: ${linkedin}
  github: ${github}
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

  const sections = [];

  // Work Experience
  if (Array.isArray(data.work) && data.work.length > 0) {
    let exp = `## Experience\n`;
    data.work.forEach(w => {
      const dates = [w.startDate, w.endDate || 'Present'].filter(Boolean).join(' - ');
      const header = `### ${w.position || 'Role'} | ${w.name || 'Company'} | ${w.location || ''} | ${dates}`;
      exp += `\n${header}\n`;
      if (w.summary) {
        exp += `${w.summary}\n`;
      }
      if (Array.isArray(w.highlights)) {
        w.highlights.forEach(h => {
          exp += `- ${h}\n`;
        });
      }
    });
    sections.push(exp);
  }

  // Skills
  if (Array.isArray(data.skills) && data.skills.length > 0) {
    let sk = `## Skills\n\n`;
    data.skills.forEach(s => {
      const keywords = Array.isArray(s.keywords) ? s.keywords.join(', ') : '';
      if (s.name) {
        sk += `::skills ${s.name}: [${keywords}]\n`;
      } else {
        sk += `::skills [${keywords}]\n`;
      }
    });
    sections.push(sk);
  }

  // Education
  if (Array.isArray(data.education) && data.education.length > 0) {
    let edu = `## Education\n`;
    data.education.forEach(e => {
      const degree = [e.studyType, e.area].filter(Boolean).join(' in ') || 'Degree';
      const dates = [e.startDate, e.endDate || 'Present'].filter(Boolean).join(' - ');
      const header = `### ${degree} | ${e.institution || 'University'} | ${dates}`;
      edu += `\n${header}\n`;
      if (e.score) edu += `- GPA: ${e.score}\n`;
      if (Array.isArray(e.courses)) {
        edu += `- Relevant Coursework: ${e.courses.join(', ')}\n`;
      }
    });
    sections.push(edu);
  }

  // Projects
  if (Array.isArray(data.projects) && data.projects.length > 0) {
    let proj = `## Projects\n`;
    data.projects.forEach(p => {
      const dates = [p.startDate, p.endDate || 'Present'].filter(Boolean).join(' - ');
      const header = `### ${p.name || 'Project'} | ${p.description || ''} | ${dates}`;
      proj += `\n${header}\n`;
      if (Array.isArray(p.highlights)) {
        p.highlights.forEach(h => {
          proj += `- ${h}\n`;
        });
      }
    });
    sections.push(proj);
  }

  // Certificates
  if (Array.isArray(data.certificates) && data.certificates.length > 0) {
    let cert = `## Certifications\n`;
    data.certificates.forEach(c => {
      cert += `### ${c.name} | ${c.issuer || ''} | ${c.date || ''}\n`;
    });
    sections.push(cert);
  }

  return `${frontmatter}\n${sections.join('\n\n')}\n`;
}

export function astToJsonResume(ast, metadata = {}) {
  const contact = metadata.contact || {};
  const profiles = [];
  if (contact.linkedin) {
    profiles.push({ network: 'LinkedIn', url: contact.linkedin });
  }
  if (contact.github) {
    profiles.push({ network: 'GitHub', url: contact.github });
  }

  const jsonResume = {
    $schema: 'https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json',
    basics: {
      name: metadata.name || '',
      label: metadata.title || '',
      email: contact.email || '',
      phone: contact.phone || '',
      url: contact.website || '',
      summary: metadata.summary || '',
      location: {
        address: contact.location || ''
      },
      profiles
    },
    work: [],
    education: [],
    skills: [],
    projects: [],
    certificates: []
  };

  const sections = ast.sections || [];
  sections.forEach(sec => {
    const title = sec.title.toLowerCase();

    if (title.includes('experience') || title.includes('work') || title.includes('employment')) {
      sec.items.forEach(item => {
        if (item.type === 'entry') {
          jsonResume.work.push({
            name: item.org || '',
            position: item.title || '',
            location: item.location || '',
            startDate: item.date ? item.date.split(/[-–—to]+/)[0]?.trim() : '',
            endDate: item.date ? item.date.split(/[-–—to]+/)[1]?.trim() : '',
            summary: item.paragraphs?.join('\n') || '',
            highlights: item.bullets || []
          });
        }
      });
    } else if (title.includes('education')) {
      sec.items.forEach(item => {
        if (item.type === 'entry') {
          jsonResume.education.push({
            institution: item.org || '',
            studyType: item.title || '',
            startDate: item.date ? item.date.split(/[-–—to]+/)[0]?.trim() : '',
            endDate: item.date ? item.date.split(/[-–—to]+/)[1]?.trim() : '',
            courses: []
          });
        }
      });
    } else if (title.includes('skills')) {
      sec.items.forEach(item => {
        if (item.type === 'skills') {
          jsonResume.skills.push({
            name: item.category || 'General',
            keywords: item.tags || []
          });
        }
      });
    } else if (title.includes('project')) {
      sec.items.forEach(item => {
        if (item.type === 'entry') {
          jsonResume.projects.push({
            name: item.title || '',
            description: item.org || '',
            startDate: item.date || '',
            highlights: item.bullets || []
          });
        }
      });
    }
  });

  return jsonResume;
}
