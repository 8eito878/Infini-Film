/**
 * Fetches production_countries for every movie in curated.json and patches origin_country.
 * Usage: node scripts/patch-countries.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TMDB_KEY    = '16370ad515ac76b8ec2726ca32074643';
const CURATED     = path.resolve(__dirname, '..', 'public', 'curated.json');
const CACHE_FILE  = path.resolve(__dirname, '..', '.patch-countries-cache.json');

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchCountries(id) {
  const url = `https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_KEY}&language=en-US`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const j = await res.json();
  return (j.production_countries || []).map(c => c.iso_3166_1);
}

async function main() {
  const movies = JSON.parse(fs.readFileSync(CURATED, 'utf8'));
  console.log(`Total movies: ${movies.length}`);

  let cache = {};
  if (fs.existsSync(CACHE_FILE)) {
    cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    console.log(`Resuming — ${Object.keys(cache).length} already cached`);
  }

  const BATCH = 10;
  const DELAY = 260; // ~38 req/10s — safely within TMDB's 40/10s limit

  let done = 0, errors = 0;

  for (let i = 0; i < movies.length; i += BATCH) {
    const batch = movies.slice(i, i + BATCH);

    await Promise.all(batch.map(async m => {
      const key = String(m.id);
      if (key in cache) return;
      try {
        cache[key] = await fetchCountries(m.id);
      } catch (e) {
        cache[key] = [];
        errors++;
      }
    }));

    // Apply cache to movies
    for (const m of batch) {
      m.origin_country = cache[String(m.id)] ?? [];
    }

    done = Math.min(i + BATCH, movies.length);
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache));

    if (done % 200 < BATCH || done === movies.length) {
      process.stdout.write(`\r  ${done}/${movies.length}  errors:${errors}  `);
    }

    await sleep(DELAY);
  }

  console.log(`\n\nDone. Saving...`);
  fs.writeFileSync(CURATED, JSON.stringify(movies));
  console.log(`Saved → ${CURATED}  (${(fs.statSync(CURATED).size/1024).toFixed(1)} KB)`);
}

main().catch(err => { console.error(err); process.exit(1); });
