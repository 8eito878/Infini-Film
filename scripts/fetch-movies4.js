/**
 * Fetches TMDB data for movies in movies4.txt and merges into public/curated.json.
 * Skips: already in curated (by ID), no poster_path, vote_average <= 4.0, vote_count <= 20.
 * Usage: node scripts/fetch-movies4.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TMDB_KEY  = '16370ad515ac76b8ec2726ca32074643';
const TMDB_BASE = 'https://api.themoviedb.org/3';

const MOVIES_FILE   = path.resolve('C:/Users/eito1/movie_txt/movies4.txt');
const CURATED_FILE  = path.resolve(__dirname, '..', 'public', 'curated.json');
const PROGRESS_FILE = path.resolve(__dirname, '..', '.movies4-progress.json');

function parseLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return null;
  const m = trimmed.match(/^(.*?)\s*\((\d{4})\)\s*$/);
  if (m) return { title: m[1].trim(), year: m[2] };
  return { title: trimmed, year: null };
}

async function searchTMDB(title, year) {
  const base = `${TMDB_BASE}/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(title)}&include_adult=false&language=en-US`;
  const tryFetch = async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()).results ?? [];
  };
  if (year) {
    const results = await tryFetch(`${base}&year=${year}`);
    if (results.length) return results[0];
  }
  const results = await tryFetch(base);
  return results[0] ?? null;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const lines   = fs.readFileSync(MOVIES_FILE, 'utf8').split('\n');
  const entries = lines.map(parseLine).filter(Boolean);
  console.log(`Total entries in movies4.txt: ${entries.length}`);

  const existing = JSON.parse(fs.readFileSync(CURATED_FILE, 'utf8'));
  const existingIds = new Set(existing.map(m => m.id));
  console.log(`Existing curated.json: ${existing.length} movies`);

  let progress = {};
  if (fs.existsSync(PROGRESS_FILE)) {
    progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    console.log(`Resuming — ${Object.keys(progress).length} already cached`);
  }

  const toAdd    = [];
  const notFound = [];
  const skipped  = [];

  const BATCH_SIZE = 10;
  const DELAY_MS   = 1000;

  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.all(batch.map(async ({ title, year }) => {
      const key = `${title}|||${year ?? ''}`;
      if (key in progress) return { key, movie: progress[key] };
      try {
        const movie = await searchTMDB(title, year);
        progress[key] = movie;
        return { key, movie };
      } catch (e) {
        console.error(`\n  Error: "${title}" — ${e.message}`);
        progress[key] = null;
        return { key, movie: null };
      }
    }));

    for (let j = 0; j < batchResults.length; j++) {
      const { movie } = batchResults[j];
      const entry = batch[j];
      if (!movie)                            { notFound.push(entry); continue; }
      if (!movie.poster_path)                { skipped.push({ ...entry, reason: 'no poster' }); continue; }
      if ((movie.vote_average ?? 0) <= 4.0)  { skipped.push({ ...entry, reason: 'low rating' }); continue; }
      if ((movie.vote_count   ?? 0) <= 20)   { skipped.push({ ...entry, reason: 'low votes' }); continue; }
      if (existingIds.has(movie.id))         { skipped.push({ ...entry, reason: 'duplicate' }); continue; }
      existingIds.add(movie.id);
      toAdd.push({
        id:                movie.id,
        title:             movie.title,
        original_title:    movie.original_title !== movie.title ? (movie.original_title ?? undefined) : undefined,
        release_date:      movie.release_date  ?? '',
        poster_path:       movie.poster_path,
        genre_ids:         movie.genre_ids     ?? [],
        vote_average:      movie.vote_average  ?? 0,
        vote_count:        movie.vote_count    ?? 0,
        origin_country:    movie.origin_country ?? [],
        original_language: movie.original_language ?? '',
        overview:          movie.overview      ?? '',
      });
    }

    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress));

    const done = Math.min(i + BATCH_SIZE, entries.length);
    if (done % 50 < BATCH_SIZE || done === entries.length) {
      process.stdout.write(`\r  ${done}/${entries.length}  adding:${toAdd.length}  no-poster:${skipped.filter(s=>s.reason==='no poster').length}  low-rating:${skipped.filter(s=>s.reason==='low rating').length}  low-votes:${skipped.filter(s=>s.reason==='low votes').length}  dup:${skipped.filter(s=>s.reason==='duplicate').length}  missing:${notFound.length}  `);
    }

    await sleep(DELAY_MS);
  }

  console.log(`\n\nDone — adding ${toAdd.length} new movies`);
  console.log(`  Skipped (no poster):  ${skipped.filter(s=>s.reason==='no poster').length}`);
  console.log(`  Skipped (low rating): ${skipped.filter(s=>s.reason==='low rating').length}`);
  console.log(`  Skipped (low votes):  ${skipped.filter(s=>s.reason==='low votes').length}`);
  console.log(`  Skipped (duplicate):  ${skipped.filter(s=>s.reason==='duplicate').length}`);
  console.log(`  Not found on TMDB:    ${notFound.length}`);
  if (notFound.length) notFound.forEach(e => console.log(`    ${e.title}${e.year ? ` (${e.year})` : ''}`));

  if (toAdd.length > 0) {
    const merged = [...existing, ...toAdd];
    fs.writeFileSync(CURATED_FILE, JSON.stringify(merged));
    console.log(`\nSaved → ${CURATED_FILE}  total: ${merged.length} movies`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
