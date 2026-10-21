/**
 * Native Structured .docx (OpenXML) Compiler
 * Translates ResumeAST + DocumentConfig into clean, ATS-compliant Microsoft Word documents.
 */
import { getDocx } from '../vendor/loader.js';

export async function exportToDocx(ast, config, filename = 'resume.docx') {
  const docx = await getDocx();
  const {
    Document,
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    WidthType,
    AlignmentType,
    HeadingLevel,
    Packer,
    BorderStyle,
    ExternalHyperlink
  } = docx;

  const cleanHex = (hex) => (hex ? hex.replace('#', '').trim() : '000000');
  const inkHex = cleanHex(config.inkColor || '#111827');
  const mutedHex = cleanHex(config.mutedColor || '#4b5563');
  const accentHex = cleanHex(config.accentColor || '#1e3a8a');

  // Exact twip conversions
  const marginTwips = Math.round((config.margins || 0.5) * 1440);
  const baseFontSizeHalfPt = Math.round((config.fontSize || 10) * 2);
  const sectionGapTwips = Math.round((config.sectionSpacing || 14) * 15);
  const itemGapTwips = Math.round((config.itemSpacing || 6) * 15);
  const bulletGapTwips = Math.round((config.bulletSpacing || 3) * 15);
  const lineSpacing = Math.round((config.lineHeight || 1.3) * 240);

  const primaryFont = config.primaryFont || 'Arial';
  const headerFont = config.headerFont || primaryFont;

  const noBorders = {
    top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' }
  };

  const children = [];

  // 1. Header (Name, Headline, Contact items, Summary)
  const metadata = ast.metadata || {};
  if (metadata.name) {
    children.push(
      new Paragraph({
        text: metadata.name,
        heading: HeadingLevel.TITLE,
        spacing: { after: 100 },
        run: {
          font: headerFont,
          size: Math.round(baseFontSizeHalfPt * 2.0),
          bold: true,
          color: accentHex
        }
      })
    );
  }

  if (metadata.title) {
    children.push(
      new Paragraph({
        text: metadata.title,
        spacing: { after: 120 },
        run: {
          font: primaryFont,
          size: Math.round(baseFontSizeHalfPt * 1.15),
          color: mutedHex
        }
      })
    );
  }

  // Contact line
  const contact = metadata.contact || {};
  const contactParts = [];
  if (contact.email) contactParts.push(contact.email);
  if (contact.phone) contactParts.push(contact.phone);
  if (contact.location) contactParts.push(contact.location);
  if (contact.website) contactParts.push(contact.website);
  if (contact.linkedin) contactParts.push(contact.linkedin);
  if (contact.github) contactParts.push(contact.github);

  if (contactParts.length > 0) {
    children.push(
      new Paragraph({
        text: contactParts.join('  •  '),
        spacing: { after: 160 },
        run: {
          font: primaryFont,
          size: Math.round(baseFontSizeHalfPt * 0.9),
          color: mutedHex
        }
      })
    );
  }

  if (metadata.summary) {
    children.push(
      new Paragraph({
        text: metadata.summary,
        spacing: { after: sectionGapTwips, line: lineSpacing },
        run: {
          font: primaryFont,
          size: baseFontSizeHalfPt,
          color: inkHex
        }
      })
    );
  }

  // 2. Sections
  const sections = ast.sections || [];
  sections.forEach(section => {
    // Heading 2 Section Title with accent bottom rule
    children.push(
      new Paragraph({
        text: section.title.toUpperCase(),
        heading: HeadingLevel.HEADING_2,
        spacing: { before: sectionGapTwips, after: itemGapTwips },
        border: {
          bottom: {
            color: accentHex,
            space: 4,
            style: BorderStyle.SINGLE,
            size: 12
          }
        },
        run: {
          font: headerFont,
          size: Math.round(baseFontSizeHalfPt * 1.18),
          bold: true,
          color: accentHex
        }
      })
    );

    // Items
    (section.items || []).forEach(item => {
      if (item.type === 'entry') {
        // Borderless 2-column table for entry header (Title & Org left, Loc & Dates right)
        const leftRuns = [
          new TextRun({
            text: item.title,
            bold: true,
            font: primaryFont,
            size: baseFontSizeHalfPt,
            color: inkHex
          })
        ];
        if (item.org) {
          leftRuns.push(
            new TextRun({
              text: `  •  ${item.org}`,
              bold: true,
              font: primaryFont,
              size: baseFontSizeHalfPt,
              color: accentHex
            })
          );
        }

        const rightRuns = [];
        const metaRight = [item.location, item.date].filter(Boolean).join('  |  ');
        if (metaRight) {
          rightRuns.push(
            new TextRun({
              text: metaRight,
              font: config.monoFont || primaryFont,
              size: Math.round(baseFontSizeHalfPt * 0.88),
              color: mutedHex
            })
          );
        }

        const entryTable = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: noBorders,
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 70, type: WidthType.PERCENTAGE },
                  borders: noBorders,
                  children: [
                    new Paragraph({
                      spacing: { before: itemGapTwips, after: 40 },
                      children: leftRuns
                    })
                  ]
                }),
                new TableCell({
                  width: { size: 30, type: WidthType.PERCENTAGE },
                  borders: noBorders,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.RIGHT,
                      spacing: { before: itemGapTwips, after: 40 },
                      children: rightRuns
                    })
                  ]
                })
              ]
            })
          ]
        });

        children.push(entryTable);

        // Paragraphs
        (item.paragraphs || []).forEach(p => {
          children.push(
            new Paragraph({
              spacing: { after: bulletGapTwips, line: lineSpacing },
              children: [
                new TextRun({
                  text: p,
                  font: primaryFont,
                  size: baseFontSizeHalfPt,
                  color: inkHex
                })
              ]
            })
          );
        });

        // Bullets
        (item.bullets || []).forEach(b => {
          children.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { after: bulletGapTwips, line: lineSpacing },
              children: [
                new TextRun({
                  text: b,
                  font: primaryFont,
                  size: baseFontSizeHalfPt,
                  color: inkHex
                })
              ]
            })
          );
        });
      } else if (item.type === 'skills') {
        const catRun = item.category
          ? [
              new TextRun({
                text: `${item.category}: `,
                bold: true,
                font: primaryFont,
                size: baseFontSizeHalfPt,
                color: inkHex
              })
            ]
          : [];

        const tagsRun = new TextRun({
          text: (item.tags || []).join(', '),
          font: primaryFont,
          size: baseFontSizeHalfPt,
          color: mutedHex
        });

        children.push(
          new Paragraph({
            spacing: { after: itemGapTwips, line: lineSpacing },
            children: [...catRun, tagsRun]
          })
        );
      } else if (item.type === 'paragraph') {
        children.push(
          new Paragraph({
            spacing: { after: itemGapTwips, line: lineSpacing },
            children: [
              new TextRun({
                text: item.text,
                font: primaryFont,
                size: baseFontSizeHalfPt,
                color: inkHex
              })
            ]
          })
        );
      } else if (item.type === 'list') {
        (item.items || []).forEach(b => {
          children.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { after: bulletGapTwips, line: lineSpacing },
              children: [
                new TextRun({
                  text: b,
                  font: primaryFont,
                  size: baseFontSizeHalfPt,
                  color: inkHex
                })
              ]
            })
          );
        });
      }
    });
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: marginTwips,
              bottom: marginTwips,
              left: marginTwips,
              right: marginTwips
            }
          }
        },
        children
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
  return true;
}
