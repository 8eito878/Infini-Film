/**
 * Fetches original_title for all movies in curated.json via TMDB /movie/{id}
 * and adds it to each entry. Skips movies where original_title === title.
 * Usage: node scripts/add-original-titles.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TMDB_KEY  = '16370ad515ac76b8ec2726ca32074643';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const CURATED_FILE = path.resolve(__dirname, '..', 'public', 'curated.json');
const CACHE_FILE   = path.resolve(__dirname, '..', '.original-titles-cache.json');

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchOriginalTitle(id) {
  const url = `${TMDB_BASE}/movie/${id}?api_key=${TMDB_KEY}&language=en-US`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const j = await res.json();
  return j.original_title ?? null;
}

async function main() {
  const movies = JSON.parse(fs.readFileSync(CURATED_FILE, 'utf8'));
  console.log(`Total movies: ${movies.length}`);

  // Load cache
  let cache = {};
  if (fs.existsSync(CACHE_FILE)) {
    cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    console.log(`Cache: ${Object.keys(cache).length} entries`);
  }

  const BATCH_SIZE = 15;
  let fetched = 0;

  for (let i = 0; i < movies.length; i += BATCH_SIZE) {
    const batch = movies.slice(i, i + BATCH_SIZE);
    const needFetch = batch.filter(m => !(m.id in cache));

    if (needFetch.length > 0) {
      const results = await Promise.all(needFetch.map(async m => {
        try {
          const ot = await fetchOriginalTitle(m.id);
          return { id: m.id, ot };
        } catch (e) {
          console.error(`\n  Error id=${m.id}: ${e.message}`);
          return { id: m.id, ot: null };
        }
      }));
      for (const { id, ot } of results) {
        cache[id] = ot;
        fetched++;
      }
      fs.writeFileSync(CACHE_FILE, JSON.stringify(cache));
      await sleep(400);
    }

    const done = Math.min(i + BATCH_SIZE, movies.length);
    process.stdout.write(`\r  ${done}/${movies.length}  fetched:${fetched}  `);
  }

  console.log('\n\nApplying original_title...');
  let added = 0;
  for (const m of movies) {
    const ot = cache[m.id];
    if (ot && ot !== m.title) {
      m.original_title = ot;
      added++;
    }
    // Remove existing field if same as title
    else if (m.original_title === m.title) {
      delete m.original_title;
    }
  }

  console.log(`original_title added to ${added} movies`);
  fs.writeFileSync(CURATED_FILE, JSON.stringify(movies));
  console.log(`Saved → ${CURATED_FILE}`);
}

main().catch(err => { console.error(err); process.exit(1); });
