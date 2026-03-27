// Format death date
export function formatDeath(scholar, lang = 'tr') {
  const parts = [];
  if (scholar.death_ce) parts.push(`${scholar.death_ce} CE`);
  if (scholar.death_h) parts.push(`${scholar.death_h} AH`);
  return parts.join(' / ') || (lang === 'tr' ? 'Bilinmiyor' : 'Unknown');
}

// Format birth date
export function formatBirth(scholar, lang = 'tr') {
  const parts = [];
  if (scholar.birth_ce) parts.push(`${scholar.birth_ce} CE`);
  if (scholar.birth_h) parts.push(`${scholar.birth_h} AH`);
  return parts.join(' / ') || '';
}

// Format life span
export function formatLifespan(scholar) {
  const b = scholar.birth_ce;
  const d = scholar.death_ce;
  if (b && d) return `${b}–${d}`;
  if (d) return `d. ${d}`;
  return '';
}

// Get century from year
export function getCentury(year) {
  if (!year) return null;
  return Math.ceil(year / 100);
}

// Format century label
export function formatCentury(c, lang = 'tr') {
  const suffix = lang === 'tr' ? '. yy' : getSuffix(c) + ' c.';
  return `${c}${suffix}`;
}

function getSuffix(n) {
  if (n % 10 === 1 && n !== 11) return 'st';
  if (n % 10 === 2 && n !== 12) return 'nd';
  if (n % 10 === 3 && n !== 13) return 'rd';
  return 'th';
}

// DIA link
export function getDIALink(scholar) {
  if (!scholar.dia_slug) return null;
  return `https://islamansiklopedisi.org.tr/${scholar.dia_slug}`;
}

// Truncate text
export function truncate(text, maxLen = 150) {
  if (!text || text.length <= maxLen) return text;
  return text.slice(0, maxLen).replace(/\s+\S*$/, '') + '…';
}

// Number formatter
export function formatNumber(n) {
  if (n == null) return '—';
  return n.toLocaleString('tr-TR');
}

// Debounce
export function debounce(fn, ms = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// Class name helper
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

// Parse combined name field "العبّاس al-ʿAbbās ABBAS" into parts
const nameCache = {};
export function parseName(n) {
  if (!n) return { name_ar: '', name_en: '', name_tr: '' };
  if (nameCache[n]) return nameCache[n];

  // Extract Arabic characters from the beginning
  const arabicRe = /^([\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF\s\u0640]+)/;
  const arabicMatch = n.match(arabicRe);
  const name_ar = arabicMatch ? arabicMatch[1].trim() : '';
  const latin = arabicMatch ? n.slice(arabicMatch[0].length).trim() : n;

  // Split Latin text into transliteration (en) and Turkish (tr)
  // Turkish DİA names are predominantly UPPERCASE: ABBAS, ABBÂSÎ, ABDÜLKĀHİR
  const words = latin.split(/\s+/);
  let trStart = words.length;
  for (let i = 0; i < words.length; i++) {
    const clean = words[i].replace(/[^a-zA-ZÀ-ÖØ-öø-ÿĀ-žʿʾĞğİıŞşÇçÜüÖöÂâÛûÎî]/g, '');
    if (clean.length >= 3 && clean === clean.toUpperCase() && /[A-ZÀ-ÖØ-ÿĀ-žĞİŞÇÜÖÂÛÎ]/.test(clean)) {
      trStart = i;
      break;
    }
  }

  const name_en = words.slice(0, trStart).join(' ').trim();
  const name_tr = words.slice(trStart).join(' ').trim();

  const result = { name_ar, name_en, name_tr };
  nameCache[n] = result;
  return result;
}

// Scholar display name
export function getDisplayName(scholar, lang = 'tr') {
  // If scholar has proper name fields, use them
  if (lang === 'en' && scholar.name_en) return scholar.name_en;
  if (lang === 'tr' && scholar.name_tr) return scholar.name_tr;
  // Fallback: parse from combined 'n' field (search index)
  if (scholar.n) {
    const parsed = parseName(scholar.n);
    if (lang === 'en' && parsed.name_en) return parsed.name_en;
    if (lang === 'tr' && parsed.name_tr) return parsed.name_tr;
    return parsed.name_en || parsed.name_tr || scholar.n;
  }
  return scholar.name_en || scholar.name_tr || scholar.name_ar || scholar.id;
}

// Color from string hash (for consistent colors)
export function hashColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 35%, 55%)`;
}
