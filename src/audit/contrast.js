/**
 * WCAG 2.1 AA Real-Time Contrast Checker and Auto-Fixer
 */

function parseHex(hex) {
  let c = hex.replace('#', '').trim();
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

function toHex(r, g, b) {
  const clamp = v => Math.max(0, Math.min(255, Math.round(v)));
  const toH = v => clamp(v).toString(16).padStart(2, '0');
  return `#${toH(r)}${toH(g)}${toH(b)}`;
}

function sRgbToLinear(val) {
  const v = val / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

export function getRelativeLuminance(hex) {
  try {
    const { r, g, b } = parseHex(hex);
    const rLin = sRgbToLinear(r);
    const gLin = sRgbToLinear(g);
    const bLin = sRgbToLinear(b);
    return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
  } catch (e) {
    return 0;
  }
}

export function getContrastRatio(fgHex, bgHex) {
  const l1 = getRelativeLuminance(fgHex);
  const l2 = getRelativeLuminance(bgHex);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function auditColors(config) {
  const canvas = config.canvasColor || '#ffffff';
  const ink = config.inkColor || '#111827';
  const muted = config.mutedColor || '#4b5563';
  const accent = config.accentColor || '#1e3a8a';

  const inkRatio = getContrastRatio(ink, canvas);
  const mutedRatio = getContrastRatio(muted, canvas);
  const accentRatio = getContrastRatio(accent, canvas);

  const checks = [
    {
      name: 'Primary Ink Text',
      key: 'inkColor',
      color: ink,
      bg: canvas,
      ratio: Number(inkRatio.toFixed(2)),
      passes: inkRatio >= 4.5,
      required: 4.5,
      type: 'normal'
    },
    {
      name: 'Muted Metadata Text',
      key: 'mutedColor',
      color: muted,
      bg: canvas,
      ratio: Number(mutedRatio.toFixed(2)),
      passes: mutedRatio >= 4.5,
      required: 4.5,
      type: 'normal'
    },
    {
      name: 'Accent / Heading Color',
      key: 'accentColor',
      color: accent,
      bg: canvas,
      ratio: Number(accentRatio.toFixed(2)),
      passes: accentRatio >= 4.5, // 4.5 for normal, 3.0 for large
      passesHeading: accentRatio >= 3.0,
      required: 4.5,
      type: 'accent'
    }
  ];

  const allPass = checks.every(c => c.passes);

  return {
    allPass,
    checks,
    canvas
  };
}

/**
 * Iteratively adjusts fgHex until it meets targetRatio against bgHex.
 */
export function fixContrast(fgHex, bgHex, targetRatio = 4.6) {
  let { r, g, b } = parseHex(fgHex);
  const bgLum = getRelativeLuminance(bgHex);
  // If background is light (lum > 0.5), we darken fg; otherwise lighten
  const shouldDarken = bgLum > 0.5;

  let currentHex = fgHex;
  let ratio = getContrastRatio(currentHex, bgHex);
  if (ratio >= targetRatio) return fgHex;

  // Max 100 iterations
  for (let i = 0; i < 100; i++) {
    const step = shouldDarken ? -3 : 3;
    r = Math.max(0, Math.min(255, r + step));
    g = Math.max(0, Math.min(255, g + step));
    b = Math.max(0, Math.min(255, b + step));

    currentHex = toHex(r, g, b);
    ratio = getContrastRatio(currentHex, bgHex);
    if (ratio >= targetRatio) {
      return currentHex;
    }
    // If reached pure black or pure white, break
    if ((shouldDarken && r === 0 && g === 0 && b === 0) || (!shouldDarken && r === 255 && g === 255 && b === 255)) {
      break;
    }
  }

  return currentHex;
}
