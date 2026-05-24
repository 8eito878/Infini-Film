/**
 * Retries TMDB search for entries that previously returned null or no poster_path.
 * Handles Japanese titles, remaster suffixes, mixed EN/JA titles, and "(原題)" markers.
 * Usage: node scripts/fetch-retry.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TMDB_KEY  = '16370ad515ac76b8ec2726ca32074643';
const TMDB_BASE = 'https://api.themoviedb.org/3';

const CURATED_FILE = path.resolve(__dirname, '..', 'public', 'curated.json');

// TV shows / shorts / non-films to skip
const SKIP_TITLES = new Set([
  'Alex Wheatle', 'Serial Experiments Lain', 'The Tatami Galaxy',
  'The Makanai: Cooking for the Maiko House', 'Modern Marvels: Television: Window to the World',
  'Sallie Gardner at a Gallop', 'Maple Leaf Viewing', 'The Mystic Swing',
  'Andy Warhol: Re-Reproduction', 'Anthology No. 1', 'Baseball',
  'Writing with Light: Vittorio Storaro', "Young Person's Guide to Cinema",
  'The Transgressor', 'Gosenzo-sama Banbanzai!', '藤本タツキ 17-26 Part-1',
  'A Girl & Three Sweethearts', 'The Hours of My Life',
]);

const JA_RE = /[぀-ゟ゠-ヿ一-鿿＀-￯]/;

/* ── Title cleaning ── */
function cleanTitle(raw) {
  let t = raw;

  // Remove "(原題)" markers
  t = t.replace(/[（(]原題[）)]/g, '').trim();

  // Remove remaster/restore/4K suffixes (Japanese)
  t = t.replace(
    /[\s　]*(新4Kリマスター版?|4Kリマスター版?|4K[\s　]*リマスター版?|デジタルリマスター版?|デジタル・リマスター版?|Kデジタルリマスター版?|4Kレストア版?|4K[\s　]*レストア版?|4K[\s　]*修復版?|修復版?|ファイナル・カット|HDレストア版?|PSゲームソフト版?|【[^】]*】|\d+周年[^\s]*)[\s　]*/g,
    ' '
  ).trim();

  // Remove trailing "4K" or "4Kリマスター"
  t = t.replace(/\s+4[Kk]$/, '').trim();

  return t;
}

/* Extract English prefix from mixed EN+JA title ("Ghost in the Shell 攻殻機動隊" → "Ghost in the Shell") */
function englishPrefix(title) {
  const idx = title.search(JA_RE);
  if (idx > 3) return title.slice(0, idx).trim().replace(/[\/\s]+$/, '').trim();
  return null;
}

/* ── TMDB search ── */
async function searchTMDB(title, year, lang = 'en-US') {
  const base = `${TMDB_BASE}/search/movie?api_key=${TMDB_KEY}&include_adult=false&language=${lang}&query=${encodeURIComponent(title)}`;
  const tryFetch = async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()).results ?? [];
  };
  if (year) {
    const r = await tryFetch(`${base}&year=${year}`);
    if (r.length) return r[0];
  }
  const r = await tryFetch(base);
  return r[0] ?? null;
}

/* Multi-strategy search: tries several cleaned variants */
async function multiSearch(rawTitle, year) {
  const clean = cleanTitle(rawTitle);
  const enPfx = englishPrefix(clean);
  const isJa  = JA_RE.test(clean);

  const candidates = [
    ...(enPfx ? [[enPfx, year, 'en-US'], [enPfx, null, 'en-US']] : []),
    [clean, year, 'en-US'],
    [clean, null, 'en-US'],
    ...(isJa ? [[clean, year, 'ja'], [clean, null, 'ja']] : []),
  ];

  for (const [q, y, lang] of candidates) {
    if (!q || q.length < 2) continue;
    try {
      const m = await searchTMDB(q, y, lang);
      if (m && m.poster_path) return m;
    } catch { /* continue */ }
  }
  return null;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ── Main ── */
async function main() {
  const existing  = JSON.parse(fs.readFileSync(CURATED_FILE, 'utf8'));
  const existingIds = new Set(existing.map(m => m.id));
  console.log(`Existing curated.json: ${existing.length} movies`);

  // Collect retry candidates from all progress files
  const progressFiles = [
    path.resolve(__dirname, '..', '.curated-progress.json'),
    path.resolve(__dirname, '..', '.movies2-progress.json'),
    path.resolve(__dirname, '..', '.movies3-progress.json'),
  ];

  const candidates = []; // { rawTitle, year }
  for (const pf of progressFiles) {
    if (!fs.existsSync(pf)) continue;
    const prog = JSON.parse(fs.readFileSync(pf, 'utf8'));
    for (const [key, val] of Object.entries(prog)) {
      const [rawTitle, rawYear] = key.split('|||');
      const year = rawYear || null;

      // Skip known TV shows / non-films
      const cleaned = cleanTitle(rawTitle);
      const enPfx = englishPrefix(cleaned) ?? cleaned;
      if (SKIP_TITLES.has(rawTitle) || SKIP_TITLES.has(cleaned) || SKIP_TITLES.has(enPfx)) continue;

      if (val === null) {
        candidates.push({ rawTitle, year });
      } else if (val && !val.poster_path) {
        // Wrong match: original title ≠ matched title (likely a misidentification)
        candidates.push({ rawTitle, year });
      }
    }
  }

  // Deduplicate by rawTitle+year
  const seen = new Set();
  const unique = candidates.filter(({ rawTitle, year }) => {
    const k = `${rawTitle}|||${year}`;
    if (seen.has(k)) return false;
    seen.add(k); return true;
  });

  console.log(`Retry candidates: ${unique.length}`);

  const toAdd    = [];
  const notFound = [];
  const BATCH_SIZE = 8;

  for (let i = 0; i < unique.length; i += BATCH_SIZE) {
    const batch = unique.slice(i, i + BATCH_SIZE);

    const results = await Promise.all(batch.map(async ({ rawTitle, year }) => {
      try {
        const m = await multiSearch(rawTitle, year);
        return { rawTitle, year, movie: m };
      } catch (e) {
        console.error(`\n  Error: "${rawTitle}" — ${e.message}`);
        return { rawTitle, year, movie: null };
      }
    }));

    for (const { rawTitle, year, movie } of results) {
      if (!movie || !movie.poster_path) {
        notFound.push(rawTitle + (year ? ` (${year})` : ''));
        continue;
      }
      if (existingIds.has(movie.id)) continue; // already in curated
      existingIds.add(movie.id);
      toAdd.push({
        id:                movie.id,
        title:             movie.title,
        release_date:      movie.release_date  ?? '',
        poster_path:       movie.poster_path,
        genre_ids:         movie.genre_ids     ?? [],
        vote_average:      movie.vote_average  ?? 0,
        vote_count:        movie.vote_count    ?? 0,
        origin_country:    movie.origin_country ?? [],
        original_language: movie.original_language ?? '',
        overview:          movie.overview      ?? '',
      });
      console.log(`  + ${movie.title} (${movie.release_date?.slice(0,4)}) ← "${rawTitle}"`);
    }

    const done = Math.min(i + BATCH_SIZE, unique.length);
    process.stdout.write(`\r  ${done}/${unique.length}  adding:${toAdd.length}  `);
    await sleep(800);
  }

  console.log(`\n\nDone — adding ${toAdd.length} new movies`);
  console.log(`Still not found (${notFound.length}):`);
  notFound.forEach(t => console.log(`  ${t}`));

  if (toAdd.length > 0) {
    const merged = [...existing, ...toAdd];
    fs.writeFileSync(CURATED_FILE, JSON.stringify(merged));
    console.log(`\nSaved → ${CURATED_FILE}  total: ${merged.length} movies`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
