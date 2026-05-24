/**
 * Fetches TMDB data for every movie in movies.txt and writes to public/curated.json.
 * Usage: node scripts/fetch-curated.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TMDB_KEY  = '16370ad515ac76b8ec2726ca32074643';
const TMDB_BASE = 'https://api.themoviedb.org/3';

const MOVIES_FILE   = path.resolve(__dirname, '..', '..', '..', 'movie_txt', 'movies.txt');
const OUTPUT_FILE   = path.resolve(__dirname, '..', 'public', 'curated.json');
const PROGRESS_FILE = path.resolve(__dirname, '..', '.curated-progress.json');

/* ── Parse "Title (Year)" ──────────────────────────────────────────────── */
function parseLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return null;
  const m = trimmed.match(/^(.*?)\s*\((\d{4})\)\s*$/);
  if (!m) return null;
  return { title: m[1].trim(), year: m[2] };
}

/* ── TMDB search ───────────────────────────────────────────────────────── */
async function searchTMDB(title, year) {
  const withYear = `${TMDB_BASE}/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(title)}&year=${year}&include_adult=false&language=en-US`;
  let res = await fetch(withYear);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  let data = await res.json();
  if (data.results?.length) return data.results[0];

  // Retry without year constraint
  const noYear = `${TMDB_BASE}/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(title)}&include_adult=false&language=en-US`;
  res = await fetch(noYear);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  data = await res.json();
  return data.results?.[0] ?? null;
}

/* ── Sleep ─────────────────────────────────────────────────────────────── */
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ── Main ──────────────────────────────────────────────────────────────── */
async function main() {
  const lines = fs.readFileSync(MOVIES_FILE, 'utf8').split('\n');
  const entries = lines.map(parseLine).filter(Boolean);
  console.log(`Total entries to process: ${entries.length}`);

  // Load saved progress (key → TMDB result | null)
  let progress = {};
  if (fs.existsSync(PROGRESS_FILE)) {
    progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    console.log(`Resuming — ${Object.keys(progress).length} already cached`);
  }

  const results  = [];
  const seenIds  = new Set();
  const notFound = [];

  const BATCH_SIZE = 10;
  const DELAY_MS   = 1000; // 10 req/s — well within TMDB's 40 req/10s limit

  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.all(batch.map(async ({ title, year }) => {
      const key = `${title}|||${year}`;
      if (key in progress) return progress[key];
      try {
        const movie = await searchTMDB(title, year);
        progress[key] = movie;
        return movie;
      } catch (e) {
        console.error(`  Error: "${title}" (${year}) — ${e.message}`);
        progress[key] = null;
        return null;
      }
    }));

    for (let j = 0; j < batchResults.length; j++) {
      const movie = batchResults[j];
      if (!movie) {
        notFound.push(batch[j]);
        continue;
      }
      if (seenIds.has(movie.id)) continue; // skip duplicates
      seenIds.add(movie.id);
      results.push({
        id:                movie.id,
        title:             movie.title,
        release_date:      movie.release_date  ?? '',
        poster_path:       movie.poster_path   ?? null,
        genre_ids:         movie.genre_ids     ?? [],
        vote_average:      movie.vote_average  ?? 0,
        vote_count:        movie.vote_count    ?? 0,
        origin_country:    movie.origin_country ?? [],
        original_language: movie.original_language ?? '',
        overview:          movie.overview      ?? '',
      });
    }

    // Checkpoint
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress));

    const done = Math.min(i + BATCH_SIZE, entries.length);
    if (done % 100 < BATCH_SIZE || done === entries.length) {
      process.stdout.write(`\r  ${done}/${entries.length}  found:${results.length}  missing:${notFound.length}  `);
    }

    await sleep(DELAY_MS);
  }

  console.log(`\n\nDone — ${results.length} movies found, ${notFound.length} not found`);
  if (notFound.length) {
    console.log('Not found (sample):', notFound.slice(0, 20).map(e => `${e.title} (${e.year})`).join(', '));
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results));
  console.log(`Saved → ${OUTPUT_FILE}  (${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(1)} KB)`);
}

main().catch(err => { console.error(err); process.exit(1); });
