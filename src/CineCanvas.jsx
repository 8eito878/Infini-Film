import { useState, useEffect, useRef, useMemo } from "react";

/* ── TMDB ────────────────────────────────────────────────────────────────── */
const TMDB_KEY = "16370ad515ac76b8ec2726ca32074643";
const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMG = "https://image.tmdb.org/t/p/w780";

/* ── Genre mapping ───────────────────────────────────────────────────────── */
const GENRE_IDS = {
  Action: 28, Adventure: 12, Animation: 16, Comedy: 35, Crime: 80,
  Documentary: 99, Drama: 18, Family: 10751, Fantasy: 14, History: 36,
  Horror: 27, Music: 10402, Mystery: 9648, Romance: 10749,
  "Science Fiction": 878, "TV Movie": 10770, Thriller: 53, War: 10752, Western: 37,
};
const GENRE_ID_TO_NAME = Object.fromEntries(Object.entries(GENRE_IDS).map(([k, v]) => [v, k]));
const GENRES = Object.keys(GENRE_IDS);

/* ── Country mapping ─────────────────────────────────────────────────────── */
const COUNTRY_CODES = {
  USA: "US", UK: "GB", France: "FR", Japan: "JP", "South Korea": "KR",
  Italy: "IT", Germany: "DE", Spain: "ES", Sweden: "SE", Mexico: "MX",
  Iran: "IR", China: "CN", Taiwan: "TW", "Hong Kong": "HK", Brazil: "BR",
  "Soviet Union": "SU", Belgium: "BE", Argentina: "AR", Australia: "AU",
};
const CODE_TO_COUNTRY = Object.fromEntries(Object.entries(COUNTRY_CODES).map(([k, v]) => [v, k]));
const COUNTRIES = Object.keys(COUNTRY_CODES);


/* ── Decades ─────────────────────────────────────────────────────────────── */
const DECADES = ["~1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s~"];
const DECADE_RANGES = {
  "~1960s": { gte: "1900-01-01", lte: "1969-12-31" },
  "1970s":  { gte: "1970-01-01", lte: "1979-12-31" },
  "1980s":  { gte: "1980-01-01", lte: "1989-12-31" },
  "1990s":  { gte: "1990-01-01", lte: "1999-12-31" },
  "2000s":  { gte: "2000-01-01", lte: "2009-12-31" },
  "2010s":  { gte: "2010-01-01", lte: "2019-12-31" },
  "2020s~": { gte: "2020-01-01", lte: "2099-12-31" },
};

/* ── Rating options ──────────────────────────────────────────────────────── */
const RATINGS_OPTS = [
  { l: "7.5+", v: 7.5 },
  { l: "8.0+", v: 8.0 },
  { l: "8.5+", v: 8.5 },
];

/* ── Layout ──────────────────────────────────────────────────────────────── */
const CARD_W = 240, CARD_H = 360, GAP = 20;
const COLS_PER_TILE = 6, ROWS_PER_TILE = 10;
const TILES_X = 4, TILES_Y = 4;
const pitchX = COLS_PER_TILE * (CARD_W + GAP);
const pitchY = ROWS_PER_TILE * (CARD_H + GAP);
const MAX_S = 1.4;

/* ── Logo ────────────────────────────────────────────────────────────────── */
const LOGO_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJgAAABCCAYAAACrZx9oAAArP0lEQVR42uV9aZQd1XXut8+pO/Q8qAekltCADAgBASMSxzhOt0McE08L2+okL9jPiRM7dp6dODjrJXnxa8mJ48Uiy4ljnEQeHpjBJC0wHgAbg9UNiElICEtoBEkIzd3qufsOVefs/X6cU/fWbVqAUCOJpLTOqurS7VtVu77z7W/vs89towixuIqL6+/tVV1eXic+tWbOmeuHChRen0+kVQRBcrrW+QCk1X2vdrLWuJqIUMwuAorV2gpkHrLX7oijaHkXRpsnJyU0f+tCH9iSv09fXF3R2dloiErxJNhGh/v5+/a53vcuIlG+7t7d3cX19/Vuz2ewVWuvlQRAs1lq3KaXqAWSVUnQq12XmiJmnmHnIGHPQGLPTGLO5UChs3LNnz3N/9md/VpxmVyYinq3nptkCFgDEN9bb29vc1NT0mzU1Ne/NZrNvr6qqWtzS0qKqq6sRBAGUUiCiE30XrLUIwxDj4+MYGRmZzOfz2wqFwrqpqakfX3PNNU8CEP9ZDYDPZqCJCAFQRGTjc/fff/+VNTU178tms1dXVVVd0tTUVFdfX49MJgOt9Qltc4r3AWZGFEWYmprC0NCQzefzL+Tz+fWTk5P3Dg4OrvvoRz867t+fXrlypcwG0OhUjbd27VrV3d1tAeC+++5b0dDQ8Ed1dXXXzps3r62lpQVKKaDBQ2MYwAL2UDgAYAlAqQCgWMBSgFIBg3FDCQkBLaAdJhHjgkOAAqgFECkCRgHlAAsOWoJiAQQQAtBUAwFR6pzHZAA0s5IVVBGxakIAC4YLsEQRVEjSE0IEjSoIYA3fFKNOJHH/RHTPsDwT0eW1VKYAAAAAElFTkSuQmCC";

/* ── InfiniIcon ──────────────────────────────────────────────────────────── */
function InfiniIcon({ size = 20, color = "currentColor", filled = false }) {
  const h = size * 314 / 727;
  return filled ? (
    <svg width={size} height={h} viewBox="0 0 727.1 314.01" xmlns="http://www.w3.org/2000/svg">
      <path d="M570.09,0h-71.1c-86.71,0-157.01,70.29-157.01,157.01s70.29,157.01,157.01,157.01h71.1c86.71,0,157.01-70.29,157.01-157.01S656.8,0,570.09,0ZM648.98,157.01c0,45.68-37.03,82.71-82.71,82.71h-63.45c-45.68,0-82.71-37.03-82.71-82.71h0c0-45.68,37.03-82.71,82.71-82.71h63.45c45.68,0,82.71,37.03,82.71,82.71h0Z" fill={color}/>
      <path d="M157.01,0C70.29,0,0,70.29,0,157.01s70.29,157.01,157.01,157.01,157.01-70.29,157.01-157.01S243.72,0,157.01,0ZM157.01,239.71c-45.68,0-82.71-37.03-82.71-82.71s37.03-82.71,82.71-82.71,82.71,37.03,82.71,82.71-37.03,82.71-82.71,82.71Z" fill={color}/>
    </svg>
  ) : (
    <svg width={size} height={h} viewBox="0 0 727.1 314.01" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M570.09,18h-71.1c-76.76,0-139.01,62.25-139.01,139.01s62.25,139.01,139.01,139.01h71.1c76.76,0,139.01-62.25,139.01-139.01S646.85,18,570.09,18Z" stroke={color} strokeWidth="36"/>
      <ellipse cx="534.55" cy="157.01" rx="72.71" ry="72.71" stroke={color} strokeWidth="20"/>
      <circle cx="157.01" cy="157.01" r="139.01" stroke={color} strokeWidth="36"/>
      <circle cx="157.01" cy="157.01" r="72.71" stroke={color} strokeWidth="20"/>
    </svg>
  );
}

/* ── CSS ─────────────────────────────────────────────────────────────────── */
const CSS = `
/* ── Color tokens ─────────────────────────────────────────────────────────── */
:root{
  --bg:#171715;--bg2:#1a1a18;--bg3:#0f0f0d;
  --card:#181816;--card2:#252522;
  --surface:rgba(20,20,18,.92);
  --bd:#2a2a28;--bd2:#1e1e1c;
  --t1:#ddd7cc;--t2:#888;--t3:#555;--t4:#444;
  --title:#f0ebe0;--body:#aaa599;--tc:#7a7a76;--ty:#55554f;
  --accent:#e8e2d4;--accent-fg:#0a0a09;
  --overlay:rgba(0,0,0,.92);--backdrop:rgba(0,0,0,.5);--dot:#333;
  --card-shadow:0 0 0 1px rgba(255,255,255,0.045),inset 0 1px 0 rgba(255,255,255,0.06),inset 0 -1px 0 rgba(0,0,0,0.4),0 4px 14px rgba(0,0,0,0.45);
}
@media(prefers-color-scheme:light){
  :root{
    --bg:#f5f4f0;--bg2:#eceae4;--bg3:#f0efe9;
    --card:#e8e5de;--card2:#dedad2;
    --surface:rgba(248,247,243,.95);
    --bd:#d0ccc4;--bd2:#dedad2;
    --t1:#1a1a18;--t2:#666;--t3:#888;--t4:#999;
    --title:#0a0a09;--body:#4a4840;--tc:#6a6660;--ty:#8a8680;
    --accent:#1a1a18;--accent-fg:#f5f4f0;
    --overlay:rgba(240,238,234,.96);--backdrop:rgba(0,0,0,.35);--dot:#bbb;
    --card-shadow:none;
  }
}

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html,body{background:var(--bg);color:var(--t1);
  font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Helvetica Neue',system-ui,sans-serif;
  overflow:hidden;height:100%;-webkit-tap-highlight-color:transparent;-webkit-touch-callout:none;-webkit-font-smoothing:antialiased;}
.app{position:fixed;inset:0;background:var(--bg);overflow:hidden;}
.cv{position:absolute;inset:0;overflow:hidden;cursor:grab;touch-action:none;
  -webkit-user-select:none;user-select:none;}
.cv.drag{cursor:grabbing;}
.ci{position:absolute;top:0;left:0;will-change:transform;transform-origin:0 0;}
.fc{position:absolute;cursor:pointer;border-radius:4px;will-change:transform;
  box-shadow:var(--card-shadow);}
.fc-wrap{position:absolute;inset:0;border-radius:inherit;overflow:hidden;}
.fc img{width:100%;height:100%;object-fit:cover;display:block;pointer-events:none;
  -webkit-user-drag:none;-webkit-user-select:none;user-select:none;}
.fc-fb{width:100%;height:100%;display:flex;flex-direction:column;align-items:center;
  justify-content:center;gap:4px;padding:6px;background:linear-gradient(140deg,var(--bg2),var(--card2));}
.fb-t{font-size:9px;text-align:center;color:var(--tc);line-height:1.25;font-weight:600;}
.fb-y{font-size:8px;color:var(--ty);font-weight:500;}
@media(hover:none){.fc:active{filter:brightness(1.05);}}

/* Loading */
.cv-loading{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;}
.dots{display:flex;gap:5px;padding:16px 0;justify-content:center;}
.dot{width:5px;height:5px;border-radius:50%;background:var(--dot);animation:dp 1.4s ease-in-out infinite;}
.dot:nth-child(2){animation-delay:.2s;}.dot:nth-child(3){animation-delay:.4s;}
@keyframes dp{0%,80%,100%{opacity:.3;transform:scale(.8);}40%{opacity:1;transform:scale(1);}}

/* Header */
.hdr{position:fixed;top:0;left:0;right:0;z-index:100;display:flex;justify-content:center;
  padding-top:max(12px,env(safe-area-inset-top));pointer-events:none;}
.hdr-pill{display:flex;align-items:center;height:42px;
  background:var(--surface);
  backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
  border-radius:100px;border:1px solid var(--bd);box-shadow:0 4px 20px rgba(0,0,0,.2);
  pointer-events:all;overflow:hidden;}
.hp-brand{display:flex;align-items:center;gap:7px;padding:0 14px;height:100%;}
.hp-icon{display:flex;align-items:center;flex-shrink:0;}
.hp-logo{height:15px;width:auto;display:block;pointer-events:none;-webkit-user-drag:none;}
.hp-name{font-size:14px;font-weight:600;color:var(--t1);letter-spacing:-.01em;white-space:nowrap;}
.hp-div{width:1px;height:20px;background:var(--bd);flex-shrink:0;}
.hp-shuf-wrap{display:flex;align-items:center;overflow:hidden;max-width:140px;opacity:1;
  transition:max-width .55s cubic-bezier(.25,.1,.25,1),opacity .4s ease .1s;}
.hp-shuf-wrap.hide{max-width:0;opacity:0;pointer-events:none;
  transition:max-width .3s cubic-bezier(.4,0,.2,1),opacity .18s ease;}
.hp-btn{display:flex;align-items:center;gap:5px;padding:0 14px;height:100%;background:none;border:none;
  cursor:pointer;color:var(--t2);font-size:12px;font-weight:500;font-family:inherit;
  -webkit-tap-highlight-color:transparent;white-space:nowrap;transition:color .15s;}
.hp-btn:hover{color:var(--t1);}
.hp-btn svg{flex-shrink:0;}
.hp-btn:disabled{opacity:.5;cursor:default;}

/* Bottom nav */
.bnav{position:fixed;bottom:0;left:0;right:0;z-index:200;display:flex;align-items:center;justify-content:center;
  padding-bottom:max(20px,env(safe-area-inset-bottom));pointer-events:none;}
.pill{display:flex;align-items:center;gap:2px;background:var(--surface);
  backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
  border-radius:100px;padding:8px 12px;border:1px solid var(--bd);
  box-shadow:0 4px 20px rgba(0,0,0,.2);pointer-events:all;}
.nb{background:none;border:none;cursor:pointer;padding:8px 16px;color:var(--t4);
  transition:color .2s;border-radius:100px;display:flex;align-items:center;justify-content:center;
  -webkit-tap-highlight-color:transparent;}
.nb:hover{color:var(--t2);}.nb.on{color:var(--t1);}
.nb svg{width:20px;height:20px;stroke-width:1.5;}

/* Filter panel */
.pbd{position:fixed;inset:0;background:var(--backdrop);z-index:300;animation:fi .2s forwards;opacity:0;}
@keyframes fi{to{opacity:1;}}
.pan{position:fixed;bottom:0;left:0;right:0;z-index:301;background:var(--bg3);border-top:1px solid var(--bd2);
  border-radius:20px 20px 0 0;padding:14px 18px;
  padding-bottom:max(36px,env(safe-area-inset-bottom));
  transform:translateY(100%);animation:su .38s cubic-bezier(.32,.72,0,1) forwards;
  max-height:84vh;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;}
@keyframes su{to{transform:translateY(0);}}
.ph{width:36px;height:4px;background:var(--bd);border-radius:2px;margin:0 auto 16px;}
.phd{font-size:12px;font-weight:600;color:var(--t1);letter-spacing:.04em;text-transform:uppercase;margin-bottom:14px;}
.f-sec{border-bottom:1px solid var(--bd2);}
.f-hdr{display:flex;align-items:center;justify-content:space-between;width:100%;padding:13px 0;
  background:none;border:none;cursor:pointer;font-family:inherit;font-size:13px;font-weight:600;color:var(--t2);
  -webkit-tap-highlight-color:transparent;}
.f-hdr:hover{color:var(--t1);}
.f-cnt{font-size:11px;font-weight:600;color:var(--accent);margin-left:6px;}
.f-chev{color:var(--t4);transition:transform .2s;display:flex;}
.f-chev.open{transform:rotate(180deg);}
.f-chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 0 14px;}
.chip{font-size:11px;font-weight:500;padding:7px 13px;border-radius:100px;border:1px solid var(--bd);
  background:transparent;color:var(--t2);cursor:pointer;transition:all .14s;white-space:nowrap;font-family:inherit;
  -webkit-tap-highlight-color:transparent;}
.chip.on{border-color:var(--accent);color:var(--accent);background:rgba(128,128,120,.1);}
.chip:hover:not(.on){border-color:var(--t3);color:var(--t2);}
.pfoot{display:flex;gap:10px;margin-top:14px;padding-top:14px;border-top:1px solid var(--bd2);}
.brst{flex:1;padding:14px;background:var(--bg2);border:1px solid var(--bd);color:var(--t2);
  font-size:12px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;cursor:pointer;border-radius:12px;
  font-family:inherit;-webkit-tap-highlight-color:transparent;}
.bapl{flex:2;padding:14px;background:var(--accent);border:none;color:var(--accent-fg);
  font-size:12px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;cursor:pointer;border-radius:12px;
  font-family:inherit;-webkit-tap-highlight-color:transparent;}
.bapl:hover{opacity:.88;}

/* Saved page */
.saved-page{position:absolute;inset:0;z-index:50;background:var(--bg);
  overflow-y:auto;-webkit-overflow-scrolling:touch;
  padding-bottom:max(100px,calc(env(safe-area-inset-bottom)+100px));
  padding-left:12px;padding-right:12px;
  animation:pi .28s ease forwards;opacity:0;}
@keyframes pi{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:none;}}
.svmt{display:flex;flex-direction:column;align-items:center;justify-content:center;height:60vh;gap:10px;}
.svmt svg{stroke:var(--bd);}
.svmt-t{font-size:13px;color:var(--t4);font-weight:500;}
.sv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,140px));
  gap:12px;justify-content:center;}
.svi{position:relative;cursor:pointer;border-radius:4px;overflow:hidden;background:var(--card);
  width:100%;aspect-ratio:2/3;height:auto;-webkit-tap-highlight-color:transparent;
  box-shadow:0 0 0 1px rgba(128,128,120,.12);}
.svi img{width:100%;height:100%;object-fit:cover;display:block;}
.svi-fb{width:100%;height:100%;display:flex;flex-direction:column;align-items:center;
  justify-content:center;font-size:9px;color:var(--tc);text-align:center;padding:6px;gap:3px;font-weight:600;
  background:linear-gradient(140deg,var(--bg2),var(--card2));}
.svx{position:absolute;top:5px;right:5px;background:rgba(0,0,0,.55);border:none;border-radius:50%;
  width:22px;height:22px;display:flex;align-items:center;justify-content:center;cursor:pointer;
  color:#fff;font-size:12px;-webkit-tap-highlight-color:transparent;opacity:0;transition:opacity .2s;}
.svi:hover .svx{opacity:1;}
@media(hover:none){.svx{opacity:1;}}
@keyframes svi-out{to{opacity:0;transform:scale(.82);}}
.svi-removing{animation:svi-out .28s ease forwards;pointer-events:none;}

/* Modal */
.mbg{position:fixed;inset:0;background:var(--overlay);z-index:400;
  backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);
  opacity:0;transition:opacity .35s ease;pointer-events:none;}
.mbg.on{opacity:1;pointer-events:auto;}
.mclose{position:fixed;top:max(14px,env(safe-area-inset-top));right:14px;z-index:420;
  background:var(--surface);border:1px solid var(--bd);border-radius:50%;
  width:38px;height:38px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--t1);
  backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);-webkit-tap-highlight-color:transparent;
  opacity:0;transition:opacity .25s ease .1s;}
.mclose.on{opacity:1;}
.mposter{position:fixed;z-index:410;overflow:hidden;background:var(--card);
  box-shadow:0 24px 80px rgba(0,0,0,.5),0 0 0 1px rgba(128,128,120,.1);
  transform-origin:center center;will-change:transform;
  transition:transform .5s cubic-bezier(.32,.72,0,1),border-radius .5s cubic-bezier(.32,.72,0,1);}
.mposter img{width:100%;height:100%;object-fit:cover;display:block;}
.mposter-fb{width:100%;height:100%;display:flex;align-items:center;justify-content:center;
  font-size:11px;color:var(--t2);padding:14px;text-align:center;font-weight:600;
  background:linear-gradient(140deg,var(--bg2),var(--card2));}
.mscroll{position:fixed;left:0;right:0;bottom:0;z-index:405;
  overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;
  padding-bottom:max(40px,env(safe-area-inset-bottom));}
.mscroll-inner{max-width:520px;margin:0 auto;padding:24px 22px 30px;}
.minfo{opacity:0;transition:opacity .4s ease .25s;color:var(--t1);}
.minfo.on{opacity:1;}
.m-genres{display:flex;justify-content:center;flex-wrap:wrap;gap:5px;margin-bottom:12px;}
.m-gen{font-size:10px;font-weight:600;padding:4px 10px;border:1px solid var(--bd);border-radius:100px;color:var(--t2);letter-spacing:.04em;}
.m-title{font-size:26px;font-weight:700;line-height:1.12;color:var(--title);margin-bottom:6px;letter-spacing:-.02em;text-align:center;}
.m-dir{font-size:12px;color:var(--t2);font-weight:500;margin-bottom:18px;text-align:center;}
.m-meta{display:flex;justify-content:center;gap:18px;margin-bottom:28px;flex-wrap:wrap;}
.m-mit{display:flex;flex-direction:column;align-items:center;gap:2px;}
.m-ml{font-size:9px;font-weight:600;color:var(--t3);letter-spacing:.14em;text-transform:uppercase;}
.m-mv{font-size:13px;font-weight:600;color:var(--accent);}
.m-desc{text-align:left;font-size:14px;line-height:1.78;color:var(--body);margin-bottom:24px;font-weight:400;}
.m-slbl{font-size:9px;font-weight:600;color:var(--t3);letter-spacing:.14em;text-transform:uppercase;margin-bottom:8px;display:block;text-align:left;}
.m-cast{font-size:13px;color:var(--t2);margin-bottom:22px;text-align:left;}
.m-act{display:flex;gap:10px;margin-bottom:20px;}
.svbtn{flex:1;display:flex;align-items:center;justify-content:center;gap:7px;padding:14px;
  background:var(--bg2);border:1px solid var(--bd);border-radius:14px;color:var(--t2);cursor:pointer;
  font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;font-family:inherit;
  -webkit-tap-highlight-color:transparent;transition:all .14s;}
.svbtn.saved{border-color:var(--accent);color:var(--accent);background:rgba(128,128,120,.1);}
.lbbtn{flex:2;display:flex;align-items:center;justify-content:center;gap:8px;padding:14px;
  background:var(--accent);border:none;border-radius:14px;color:var(--accent-fg);
  font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;cursor:pointer;text-decoration:none;
  font-family:inherit;-webkit-tap-highlight-color:transparent;}

/* ── Responsive ──────────────────────────────────────────────────────────── */
@media(max-width:768px){
  .sv-grid{grid-template-columns:repeat(4,1fr);gap:8px;}
}
@media(max-width:390px){
  .hp-brand{padding:0 10px;gap:5px;}
  .hp-btn{padding:0 10px;}
  .hp-name{font-size:13px;}
  .nb{padding:8px 12px;}
}
@media(min-width:600px){
  .pan{left:calc(50% - 280px);right:calc(50% - 280px);border-radius:20px 20px 0 0;}
  .sv-grid{grid-template-columns:repeat(auto-fill,minmax(130px,160px));}
}
@media(min-width:900px){
  .sv-grid{grid-template-columns:repeat(auto-fill,minmax(150px,180px));}
  .mscroll-inner{max-width:600px;}
}
`;

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function filmYear(f) { return parseInt(f.release_date?.substring(0, 4)) || 0; }
function filmDecade(year) {
  if (year < 1970) return "~1960s";
  if (year < 1980) return "1970s";
  if (year < 1990) return "1980s";
  if (year < 2000) return "1990s";
  if (year < 2010) return "2000s";
  if (year < 2020) return "2010s";
  return "2020s~";
}
function filmGenres(f) {
  return (f.genre_ids || []).map(id => GENRE_ID_TO_NAME[id]).filter(Boolean);
}
function filmCountry(f) {
  const code = (f.origin_country || [])[0];
  return CODE_TO_COUNTRY[code] || code || "";
}
function shuffleArr(a) {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}
function lbSlug(t) {
  return t.toLowerCase().replace(/['']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/* ── Slot positions ──────────────────────────────────────────────────────── */
const SLOT_POSITIONS = (() => {
  const s = [];
  for (let ty = 0; ty < TILES_Y; ty++)
    for (let tx = 0; tx < TILES_X; tx++)
      for (let r = 0; r < ROWS_PER_TILE; r++)
        for (let c = 0; c < COLS_PER_TILE; c++) {
          const yOff = (c / COLS_PER_TILE) * (CARD_H + GAP);
          s.push({
            x: tx * pitchX + c * (CARD_W + GAP),
            y: ty * pitchY + r * (CARD_H + GAP) + yOff,
            fi: r * COLS_PER_TILE + c,
          });
        }
  return s;
})();

/* ── TMDB API ────────────────────────────────────────────────────────────── */
async function fetchMovies(filters) {
  const p = new URLSearchParams();
  p.set("api_key", TMDB_KEY);
  p.set("language", "en-US");
  p.set("include_adult", "false");
  p.set("vote_count.gte", "500");
  p.set("vote_average.gte", String(filters.minRating > 0 ? filters.minRating : 7.5));
  p.set("sort_by", "vote_average.desc");

  if (filters.genre.length > 0) {
    const ids = filters.genre.map(g => GENRE_IDS[g]).filter(Boolean);
    if (ids.length) p.set("with_genres", ids.join("|"));
  }
  if (filters.country.length > 0) {
    const codes = filters.country.map(c => COUNTRY_CODES[c]).filter(Boolean);
    if (codes.length) p.set("with_origin_country", codes.join("|"));
  }
  if (filters.decade.length > 0) {
    const ranges = filters.decade.map(d => DECADE_RANGES[d]).filter(Boolean);
    if (ranges.length) {
      const gtes = ranges.map(r => r.gte).sort();
      const ltes = ranges.map(r => r.lte).sort();
      p.set("primary_release_date.gte", gtes[0]);
      p.set("primary_release_date.lte", ltes[ltes.length - 1]);
    }
  }


  p.set("page", "1");
  console.log("[TMDB Discover]", `${TMDB_BASE}/discover/movie?${p}`);
  const r1 = await fetch(`${TMDB_BASE}/discover/movie?${p}`);
  if (!r1.ok) throw new Error(`TMDB ${r1.status}`);
  const j1 = await r1.json();

  if (!j1.results?.length) return [];

  const totalPages = Math.min(j1.total_pages || 1, 20);
  const pageNums = new Set([1]);
  while (pageNums.size < Math.min(3, totalPages)) {
    pageNums.add(Math.floor(Math.random() * totalPages) + 1);
  }
  console.log(`[TMDB Discover] total_pages=${j1.total_pages}, picking pages ${[...pageNums].join(",")}`);

  const extraFetches = [...pageNums].filter(n => n !== 1).map(n => {
    const ep = new URLSearchParams(p); ep.set("page", String(n));
    return fetch(`${TMDB_BASE}/discover/movie?${ep}`).then(r => r.json());
  });
  const extraResults = await Promise.all(extraFetches);

  const allResults = [...j1.results, ...extraResults.flatMap(j => j.results || [])];
  const seen = new Set();
  const unique = allResults.filter(m => { if (seen.has(m.id)) return false; seen.add(m.id); return true; });
  return shuffleArr(unique).slice(0, 60);
}

async function fetchMovieDetails(id) {
  const url = `${TMDB_BASE}/movie/${id}?api_key=${TMDB_KEY}&language=en-US&append_to_response=credits`;
  console.log("[TMDB Detail]", url);
  const r = await fetch(url);
  if (!r.ok) throw new Error(`TMDB ${r.status}`);
  const j = await r.json();

  const director = j.credits?.crew?.find(c => c.job === "Director")?.name || "";
  const cast = (j.credits?.cast || []).slice(0, 5).map(c => c.name);
  const runtime = j.runtime || 0;

  return { director, cast, runtime };
}

/* ── Card ────────────────────────────────────────────────────────────────── */
function MCard({ film, slot, style }) {
  const [err, setErr] = useState(false);
  if (!film) return null;
  const src = film.poster_path ? `${TMDB_IMG}${film.poster_path}` : null;
  const year = filmYear(film);
  return (
    <div className="fc" data-slot={String(slot)} style={style}>
      <div className="fc-wrap">
        {src && !err
          ? <img src={src} alt={film.title} loading="lazy" draggable={false}
              onError={() => { console.warn("[IMG] load failed:", src); setErr(true); }} />
          : <div className="fc-fb">
              <span className="fb-t">{film.title}</span>
              <span className="fb-y">{year || ""}</span>
            </div>}
      </div>
    </div>
  );
}

/* ── Filter Panel ────────────────────────────────────────────────────────── */
function FilterPanel({ filters, onApply, onClose }) {
  const [loc, setLoc] = useState(filters);
  const [open, setOpen] = useState({});
  const tog = (k, v) => setLoc(p => {
    const a = p[k] || [];
    return { ...p, [k]: a.includes(v) ? a.filter(x => x !== v) : [...a, v] };
  });
  const reset = () => setLoc({ decade: [], genre: [], country: [], minRating: 0 });
  const chev = (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );

  const sections = [
    { k: "decade", l: "Decade", opts: DECADES },
    { k: "genre",  l: "Genre",  opts: GENRES },
    { k: "country", l: "Country", opts: COUNTRIES },
  ];

  return (<>
    <div className="pbd" onClick={onClose} />
    <div className="pan">
      <div className="ph" />
      <div className="phd">Filters</div>

      {sections.map(({ k, l, opts }) => (
        <div className="f-sec" key={k}>
          <button className="f-hdr" onClick={() => setOpen(o => ({ ...o, [k]: !o[k] }))}>
            <span>
              {l}
              {(loc[k] || []).length > 0 && <span className="f-cnt">{loc[k].length}</span>}
            </span>
            <span className={`f-chev${open[k] ? " open" : ""}`}>{chev}</span>
          </button>
          {open[k] && (
            <div className="f-chips">
              {opts.map(o => (
                <button
                  key={o}
                  className={`chip${(loc[k] || []).includes(o) ? " on" : ""}`}
                  onClick={() => tog(k, o)}
                >{o}</button>
              ))}
            </div>
          )}
        </div>
      ))}

      <div className="f-sec">
        <button className="f-hdr" onClick={() => setOpen(o => ({ ...o, rating: !o.rating }))}>
          <span>
            Min Rating
            {loc.minRating > 0 && <span className="f-cnt">{loc.minRating}+</span>}
          </span>
          <span className={`f-chev${open.rating ? " open" : ""}`}>{chev}</span>
        </button>
        {open.rating && (
          <div className="f-chips">
            {RATINGS_OPTS.map(({ l, v }) => (
              <button
                key={v}
                className={`chip${loc.minRating === v ? " on" : ""}`}
                onClick={() => setLoc(p => ({ ...p, minRating: p.minRating === v ? 0 : v }))}
              >{l}</button>
            ))}
          </div>
        )}
      </div>

      <div className="pfoot">
        <button className="brst" onClick={reset}>Reset</button>
        <button className="bapl" onClick={() => { onApply(loc); onClose(); }}>Apply</button>
      </div>
    </div>
  </>);
}

/* ── Saved Page ──────────────────────────────────────────────────────────── */
const SAVED_PAGE_STYLE = {
  paddingTop: "max(76px, calc(env(safe-area-inset-top) + 66px))",
};

function SavedPage({ savedFilms, onRemove, onSelect }) {
  if (savedFilms.length === 0) return (
    <div className="saved-page" style={SAVED_PAGE_STYLE}>
      <div className="svmt">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2a2a28" strokeWidth="1.2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
        </svg>
        <span className="svmt-t">No saved films yet</span>
      </div>
    </div>
  );
  return (
    <div className="saved-page" style={SAVED_PAGE_STYLE}>
      <div className="sv-grid">
        {savedFilms.map(f => (
          <SvItem key={f.id} film={f} onRemove={onRemove} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

function SvItem({ film, onRemove, onSelect }) {
  const [err, setErr] = useState(false);
  const [removing, setRemoving] = useState(false);
  const divRef = useRef(null);
  const src = film.poster_path ? `${TMDB_IMG}${film.poster_path}` : null;
  const year = filmYear(film);
  function handleRemove(e) {
    e.stopPropagation();
    setRemoving(true);
    setTimeout(() => onRemove(film.id), 280);
  }
  function handleSelect() {
    const r = divRef.current?.getBoundingClientRect();
    onSelect(film, r ? { x: r.left, y: r.top, w: r.width, h: r.height } : null);
  }
  return (
    <div ref={divRef} className={`svi${removing ? ' svi-removing' : ''}`} onClick={handleSelect}>
      {src && !err
        ? <img src={src} alt={film.title} onError={() => setErr(true)} />
        : <div className="svi-fb"><span className="fb-t">{film.title}</span><span className="fb-y">{year}</span></div>}
      <button className="svx" onClick={handleRemove}>×</button>
    </div>
  );
}

/* ── Modal ───────────────────────────────────────────────────────────────── */
function FilmModal({ film, cardRect, isSaved, onToggleSave, onClose, closing, detailsData, detailsLoading }) {
  const [expanded, setExpanded] = useState(false);
  const [pe, setPe] = useState(false);

  const src = film.poster_path ? `${TMDB_IMG}${film.poster_path}` : null;
  const year = filmYear(film);
  const genres = filmGenres(film);
  const country = filmCountry(film);

  const vw = window.innerWidth, vh = window.innerHeight;
  const naturalW = Math.min(240, vw * 0.62);
  const naturalH = naturalW * 1.5;
  const naturalX = (vw - naturalW) / 2;
  const naturalY = Math.max(60, vh * 0.10);
  const scrollTop = naturalY + naturalH + 24;

  useEffect(() => {
    if (closing) { setExpanded(false); return; }
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setExpanded(true)));
    return () => cancelAnimationFrame(id);
  }, [closing]);

  const sx = expanded ? 1 : cardRect.w / naturalW;
  const sy = expanded ? 1 : cardRect.h / naturalH;
  const tx = expanded ? 0 : (cardRect.x + cardRect.w / 2) - (naturalX + naturalW / 2);
  const ty = expanded ? 0 : (cardRect.y + cardRect.h / 2) - (naturalY + naturalH / 2);

  return (<>
    <div className={`mbg${expanded ? " on" : ""}`} onClick={onClose} />
    <button className={`mclose${expanded ? " on" : ""}`} onClick={onClose}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
    </button>
    <div className="mposter" style={{ left: naturalX, top: naturalY, width: naturalW, height: naturalH, borderRadius: expanded ? 6 : 4, transform: `translate(${tx}px,${ty}px) scale(${sx},${sy})` }}>
      {src && !pe
        ? <img src={src} alt={film.title} onError={() => setPe(true)} />
        : <div className="mposter-fb">{film.title}</div>}
    </div>
    <div className="mscroll" style={{ top: scrollTop }}>
      <div className="mscroll-inner">
        <div className={`minfo${expanded ? " on" : ""}`}>
          {genres.length > 0 && (
            <div className="m-genres">
              {genres.map(g => <span key={g} className="m-gen">{g}</span>)}
            </div>
          )}
          <div className="m-title">{film.title}</div>
          {detailsData?.director && <div className="m-dir">Dir. {detailsData.director}</div>}
          <div className="m-meta">
            {year > 0 && (
              <div className="m-mit">
                <span className="m-ml">Year</span>
                <span className="m-mv">{year}</span>
              </div>
            )}
            {country && (
              <div className="m-mit">
                <span className="m-ml">Country</span>
                <span className="m-mv">{country}</span>
              </div>
            )}
            {detailsData?.runtime > 0 && (
              <div className="m-mit">
                <span className="m-ml">Runtime</span>
                <span className="m-mv">{detailsData.runtime}m</span>
              </div>
            )}
            {film.vote_average > 0 && (
              <div className="m-mit">
                <span className="m-ml">TMDB</span>
                <span className="m-mv">{film.vote_average.toFixed(1)}</span>
              </div>
            )}
          </div>

          {film.overview
            ? <div className="m-desc">{film.overview}</div>
            : <div className="m-desc" style={{ color: "#555" }}>No overview available.</div>}

          {detailsLoading && (
            <div className="dots">
              <div className="dot" /><div className="dot" /><div className="dot" />
            </div>
          )}

          {detailsData?.cast?.length > 0 && (
            <>
              <span className="m-slbl">Cast</span>
              <div className="m-cast">{detailsData.cast.join(" · ")}</div>
            </>
          )}


          <div className="m-act">
            <button className={`svbtn${isSaved ? " saved" : ""}`} onClick={() => onToggleSave(film)}>
              <svg width="13" height="13" viewBox="0 0 24 24"
                fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
              </svg>
              {isSaved ? "Saved" : "Save"}
            </button>
            <a className="lbbtn" href={`https://letterboxd.com/film/${lbSlug(film.title)}/`}
              target="_blank" rel="noopener noreferrer">
              <svg width="14" height="14" viewBox="0 0 30 30">
                <circle cx="15" cy="15" r="15" fill="#0a0a09" />
                <circle cx="15" cy="15" r="9" fill="#e8e2d4" />
                <circle cx="15" cy="15" r="4" fill="#0a0a09" />
              </svg>
              Letterboxd
            </a>
          </div>
        </div>
      </div>
    </div>
  </>);
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function CineCanvas() {
  const [films, setFilms] = useState([]);
  const [filters, setFilters] = useState({ decade: [], genre: [], country: [], minRating: 0 });
  const [savedFilters, setSavedFilters] = useState({ decade: [], genre: [], country: [], minRating: 0 });
  const [showFilter, setShowFilter] = useState(false);
  const [page, setPage] = useState("canvas");
  const [selected, setSelected] = useState(null);
  const [modalClosing, setModalClosing] = useState(false);
  const [savedFilms, setSavedFilms] = useState([]);
  const [spinning, setSpinning] = useState(false);
  const [loadingFilms, setLoadingFilms] = useState(false);
  const [details, setDetails] = useState({});
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [isLight, setIsLight] = useState(() => window.matchMedia('(prefers-color-scheme: light)').matches);

  const vpRef = useRef(null), innerRef = useRef(null);
  const offRef = useRef({ x: 0, y: 0 }), scaleRef = useRef(1.0);
  const momentumRaf = useRef(null), animRaf = useRef(null);
  const animActiveRef = useRef(false), focusedRef = useRef(null);
  const filtersRef = useRef(filters);
  const openFilmAtRef = useRef(null);

  const MIN_S = useMemo(() => {
    const vw = window.innerWidth, vh = window.innerHeight;
    return Math.max(0.4, Math.max(vw / ((TILES_X - 1) * pitchX), vh / ((TILES_Y - 1) * pitchY)) * 1.04);
  }, []);
  const maxSRef = useRef(window.innerWidth <= 768 ? 1.1 : MAX_S);

  /* Inject CSS */
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = CSS;
    document.head.appendChild(el);
    return () => el.remove();
  }, []);

  /* Color scheme detection */
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const handler = (e) => setIsLight(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  /* Load saved films from localStorage */
  useEffect(() => {
    try {
      const raw = localStorage.getItem("cine-saved-v1");
      if (raw) setSavedFilms(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  /* Fetch details when modal opens */
  useEffect(() => {
    if (!selected) return;
    const id = selected.film.id;
    if (details[id]) return;
    setDetailsLoading(true);
    fetchMovieDetails(id)
      .then(d => setDetails(prev => ({ ...prev, [id]: d })))
      .catch(err => console.error("[fetchMovieDetails]", err))
      .finally(() => setDetailsLoading(false));
  }, [selected]);

  async function refreshFilms(criteria = filtersRef.current) {
    setLoadingFilms(true);
    try {
      let movies = await fetchMovies(criteria);

      if (!movies.length && criteria.country.length) {
        console.log("[TMDB] no results with country, relaxing filters");
        movies = await fetchMovies({ ...criteria, country: [] });
      }
      if (!movies.length) {
        console.log("[TMDB] no results at all, using defaults");
        movies = await fetchMovies({ decade: [], genre: [], country: [], minRating: 0 });
      }

      if (movies.length > 0 && movies.length < 60) {
        const padded = [...movies];
        while (padded.length < 60) padded.push(movies[padded.length % movies.length]);
        setFilms(padded);
      } else {
        setFilms(movies.slice(0, 60));
      }
    } catch (err) {
      console.error("[fetchMovies]", err);
    } finally {
      setLoadingFilms(false);
    }
  }

  /* Initial load */
  useEffect(() => { refreshFilms(); }, []);

  /* Reset canvas position */
  function resetPosition() {
    cancelAnimationFrame(animRaf.current);
    cancelAnimationFrame(momentumRaf.current);
    animActiveRef.current = false;
    const vw = window.innerWidth;
    const defaultS = vw <= 768 ? MIN_S : 0.8;
    const s = Math.max(defaultS, MIN_S);
    const px = pitchX * s, py = pitchY * s;
    const totalW = TILES_X * pitchX * s;
    let x = (vw - totalW) / 2, y = 100 - py;
    while (x > 0) x -= px; while (x < -px) x += px;
    while (y > 0) y -= py; while (y < -py) y += py;
    scaleRef.current = s; offRef.current = { x, y };
    if (innerRef.current) innerRef.current.style.transform = `translate3d(${x}px,${y}px,0) scale(${s})`;
    focusedRef.current = null;
  }

  useEffect(() => {
    if (films.length > 0) {
      const t = setTimeout(resetPosition, 50);
      return () => clearTimeout(t);
    }
  }, [films]);

  /* Animate to target */
  function animateTo(targetScale, targetX, targetY, duration = 460) {
    cancelAnimationFrame(animRaf.current);
    cancelAnimationFrame(momentumRaf.current);
    animActiveRef.current = true;
    const startScale = scaleRef.current, startX = offRef.current.x, startY = offRef.current.y;
    const startTime = performance.now();
    function step(now) {
      const t = Math.min(1, (now - startTime) / duration);
      const e = 1 - Math.pow(1 - t, 3);
      const s = startScale + (targetScale - startScale) * e;
      const nx = startX + (targetX - startX) * e;
      const ny = startY + (targetY - startY) * e;
      scaleRef.current = s; offRef.current = { x: nx, y: ny };
      if (innerRef.current) innerRef.current.style.transform = `translate3d(${nx}px,${ny}px,0) scale(${s})`;
      if (t < 1) {
        animRaf.current = requestAnimationFrame(step);
      } else {
        const px = pitchX * s, py = pitchY * s;
        let fx = nx, fy = ny;
        while (fx > 0) fx -= px; while (fx < -px) fx += px;
        while (fy > 0) fy -= py; while (fy < -py) fy += py;
        offRef.current = { x: fx, y: fy };
        if (innerRef.current) innerRef.current.style.transform = `translate3d(${fx}px,${fy}px,0) scale(${s})`;
        animActiveRef.current = false;
      }
    }
    animRaf.current = requestAnimationFrame(step);
  }

  /* Focus slot — raw target, no wrap-equivalent substitution */
  function focusSlot(slotIdx) {
    const slot = SLOT_POSITIONS[slotIdx]; if (!slot) return;
    const targetS = maxSRef.current;
    const cx = slot.x + CARD_W / 2, cy = slot.y + CARD_H / 2;
    const tx = window.innerWidth / 2 - cx * targetS;
    const ty = window.innerHeight / 2 - cy * targetS;
    focusedRef.current = slotIdx;
    animateTo(targetS, tx, ty, 460);
  }

  /* 2-step tap: 1st tap focuses, 2nd tap opens modal */
  function onCardTap(slotIdx) {
    if (animActiveRef.current) return;
    if (focusedRef.current === slotIdx) {
      const slot = SLOT_POSITIONS[slotIdx];
      const film = films[slot.fi]; if (!film) return;
      const s = scaleRef.current, o = offRef.current;
      const cardRect = { x: slot.x * s + o.x, y: slot.y * s + o.y, w: CARD_W * s, h: CARD_H * s };
      setSelected({ film, cardRect });
    } else {
      focusSlot(slotIdx);
    }
  }

  function shuffle() {
    setSpinning(true);
    refreshFilms();
    setTimeout(() => setSpinning(false), 550);
  }

  function applyFilters(f) {
    filtersRef.current = f;
    setFilters(f);
    refreshFilms(f);
  }

  function applySavedFilters(f) {
    setSavedFilters(f);
  }

  const filteredSavedFilms = useMemo(() => {
    const f = savedFilters;
    const active = f.decade.length > 0 || f.genre.length > 0 || f.country.length > 0 || f.minRating > 0;
    if (!active) return savedFilms;
    return savedFilms.filter(film => {
      if (f.genre.length > 0) {
        const ids = f.genre.map(g => GENRE_IDS[g]);
        if (!film.genre_ids?.some(id => ids.includes(id))) return false;
      }
      if (f.decade.length > 0) {
        const year = film.release_date ? parseInt(film.release_date.slice(0, 4)) : null;
        if (!year) return false;
        const ok = f.decade.some(d => {
          const { gte, lte } = DECADE_RANGES[d];
          return year >= parseInt(gte) && year <= parseInt(lte);
        });
        if (!ok) return false;
      }
      if (f.country.length > 0) {
        const codes = f.country.map(c => COUNTRY_CODES[c]);
        const fc = film.origin_country ?? [];
        const langMap = { ja:"JP", ko:"KR", fr:"FR", de:"DE", it:"IT", sv:"SE", fa:"IR", zh:"CN", pt:"BR", ar:"AR", es:"ES" };
        const resolved = fc.length > 0 ? fc : (langMap[film.original_language] ? [langMap[film.original_language]] : []);
        if (!resolved.some(c => codes.includes(c))) return false;
      }
      if (f.minRating > 0 && (film.vote_average ?? 0) < f.minRating) return false;
      return true;
    });
  }, [savedFilms, savedFilters]);

  function toggleSave(film) {
    setSavedFilms(prev => {
      const has = prev.some(f => f.id === film.id);
      const next = has ? prev.filter(f => f.id !== film.id) : [...prev, film];
      try { localStorage.setItem("cine-saved-v1", JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }

  function removeSaved(id) {
    setSavedFilms(prev => {
      const next = prev.filter(f => f.id !== id);
      try { localStorage.setItem("cine-saved-v1", JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }

  function closeModal() {
    setModalClosing(true);
    setTimeout(() => { setSelected(null); setModalClosing(false); }, 520);
  }

  /* Drag + wheel + pinch */
  useEffect(() => {
    const vp = vpRef.current; if (!vp) return;
    let act = false, moved = false, sx = 0, sy = 0, sox = 0, soy = 0;
    let lx = 0, ly = 0, lt = 0, vx = 0, vy = 0;
    let pinching = false, pStartDist = 0, pStartScale = 1, pinchMaxHit = false;
    const TAP_THRESH = 8;

    const co = e => e.touches
      ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
      : { x: e.clientX, y: e.clientY };

    const apply = (nx, ny) => {
      const s = scaleRef.current;
      const px = pitchX * s, py = pitchY * s;
      while (nx > 0) nx -= px; while (nx < -px) nx += px;
      while (ny > 0) ny -= py; while (ny < -py) ny += py;
      offRef.current = { x: nx, y: ny };
      if (innerRef.current) innerRef.current.style.transform = `translate3d(${nx}px,${ny}px,0) scale(${s})`;
    };

    const zoomTo = (newS, cx, cy) => {
      if (pinching && pStartScale >= maxSRef.current * 0.99 && newS > maxSRef.current && !pinchMaxHit) {
        pinchMaxHit = true;
        openFilmAtRef.current?.(cx, cy);
        return;
      }
      newS = Math.max(MIN_S, Math.min(maxSRef.current, newS));
      const oldS = scaleRef.current;
      if (Math.abs(newS - oldS) < 0.001) return;
      const o = offRef.current;
      scaleRef.current = newS;
      apply(cx - (cx - o.x) * (newS / oldS), cy - (cy - o.y) * (newS / oldS));
      focusedRef.current = null;
    };

    const onS = e => {
      if (e.target.closest('.pill,.pan,.pbd,.mbg,.mclose,.mposter,.mscroll,.hdr,.saved-page')) return;
      if (animActiveRef.current) return;
      if (e.touches && e.touches.length === 2) {
        act = false;
        vp.classList.remove('drag');
        pinching = true;
        pinchMaxHit = false;
        pStartDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        pStartScale = scaleRef.current;
        return;
      }
      cancelAnimationFrame(momentumRaf.current);
      const { x, y } = co(e);
      act = true; moved = false; vx = 0; vy = 0;
      sx = x; sy = y; sox = offRef.current.x; soy = offRef.current.y;
      lx = x; ly = y; lt = Date.now();
      vp.classList.add('drag');
    };

    const onM = e => {
      if (pinching && e.touches?.length === 2) {
        if (e.cancelable) e.preventDefault();
        const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        zoomTo(pStartScale * (d / pStartDist), (e.touches[0].clientX + e.touches[1].clientX) / 2, (e.touches[0].clientY + e.touches[1].clientY) / 2);
        return;
      }
      if (!act) return;
      if (e.cancelable) e.preventDefault();
      const { x, y } = co(e);
      const dx = x - sx, dy = y - sy;
      if (!moved && (Math.abs(dx) > TAP_THRESH || Math.abs(dy) > TAP_THRESH)) {
        moved = true; focusedRef.current = null;
      }
      const now = Date.now(), dt = Math.max(1, now - lt);
      vx = (x - lx) / dt * 16; vy = (y - ly) / dt * 16;
      lx = x; ly = y; lt = now;
      apply(sox + dx, soy + dy);
    };

    const onE = e => {
      if (pinching) { pinching = false; act = false; vp.classList.remove('drag'); return; }
      if (!act) return;
      act = false; vp.classList.remove('drag');
      if (!moved) {
        const t = e.changedTouches?.[0];
        const el = t ? document.elementFromPoint(t.clientX, t.clientY) : e.target;
        const c = el?.closest?.('[data-slot]');
        if (c) {
          onCardTap(parseInt(c.dataset.slot, 10));
        } else {
          focusedRef.current = null;
        }
      } else if (Math.abs(vx) > 0.3 || Math.abs(vy) > 0.3) {
        const go = () => {
          vx *= 0.94; vy *= 0.94;
          if (Math.abs(vx) < 0.08 && Math.abs(vy) < 0.08) return;
          apply(offRef.current.x + vx, offRef.current.y + vy);
          momentumRaf.current = requestAnimationFrame(go);
        };
        momentumRaf.current = requestAnimationFrame(go);
      }
    };

    const onWheel = e => {
      e.preventDefault();
      cancelAnimationFrame(momentumRaf.current);
      cancelAnimationFrame(animRaf.current);
      animActiveRef.current = false;
      const oldS = scaleRef.current;
      const newS = Math.max(MIN_S, Math.min(maxSRef.current, oldS * Math.exp(-e.deltaY * 0.0035)));
      if (Math.abs(newS - oldS) < 0.001) return;
      const o = offRef.current;
      scaleRef.current = newS;
      apply(e.clientX - (e.clientX - o.x) * (newS / oldS), e.clientY - (e.clientY - o.y) * (newS / oldS));
      focusedRef.current = null;
    };

    vp.addEventListener('mousedown', onS);
    vp.addEventListener('mousemove', onM);
    vp.addEventListener('mouseup', onE);
    vp.addEventListener('mouseleave', onE);
    vp.addEventListener('touchstart', onS, { passive: true });
    vp.addEventListener('touchmove', onM, { passive: false });
    vp.addEventListener('touchend', onE, { passive: true });
    vp.addEventListener('touchcancel', onE, { passive: true });
    vp.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      vp.removeEventListener('mousedown', onS);
      vp.removeEventListener('mousemove', onM);
      vp.removeEventListener('mouseup', onE);
      vp.removeEventListener('mouseleave', onE);
      vp.removeEventListener('touchstart', onS);
      vp.removeEventListener('touchmove', onM);
      vp.removeEventListener('touchend', onE);
      vp.removeEventListener('touchcancel', onE);
      vp.removeEventListener('wheel', onWheel);
      cancelAnimationFrame(momentumRaf.current);
      cancelAnimationFrame(animRaf.current);
    };
  }, [MIN_S, films]);

  openFilmAtRef.current = (cx, cy) => {
    const el = document.elementFromPoint(cx, cy);
    const c = el?.closest?.('[data-slot]');
    if (!c) return;
    const slotIdx = parseInt(c.dataset.slot, 10);
    const slot = SLOT_POSITIONS[slotIdx];
    const film = films[slot.fi]; if (!film) return;
    const s = scaleRef.current, o = offRef.current;
    setSelected({ film, cardRect: { x: slot.x * s + o.x, y: slot.y * s + o.y, w: CARD_W * s, h: CARD_H * s } });
  };

  const savedSet = new Set(savedFilms.map(f => f.id));
  const isCanvas = page === "canvas";

  return (
    <div className="app">
      {/* Infinite canvas */}
      <div className="cv" ref={vpRef} style={{ display: isCanvas ? "block" : "none" }}>
        {loadingFilms && films.length === 0 && (
          <div className="cv-loading">
            <div className="dots">
              <div className="dot" /><div className="dot" /><div className="dot" />
            </div>
          </div>
        )}
        <div className="ci" ref={innerRef} style={{ width: TILES_X * pitchX, height: TILES_Y * pitchY }}>
          {SLOT_POSITIONS.map((s, i) => {
            const f = films[s.fi]; if (!f) return null;
            return (
              <MCard key={i} slot={i} film={f}
                style={{ position: "absolute", left: s.x, top: s.y, width: CARD_W, height: CARD_H }} />
            );
          })}
        </div>
      </div>

      {/* Saved page */}
      {page === "saved" && (
        <SavedPage
          savedFilms={filteredSavedFilms}
          onRemove={removeSaved}
          onSelect={(f, rect) => {
            const r = rect ?? {
              x: (window.innerWidth - CARD_W) / 2,
              y: window.innerHeight / 2 - CARD_H / 2,
              w: CARD_W, h: CARD_H,
            };
            setSelected({ film: f, cardRect: r });
          }}
        />
      )}

      {/* Header */}
      <header className="hdr">
        <div className="hdr-pill">
          <div className="hp-brand">
            <span className="hp-icon">
              {isLight
                ? <InfiniIcon size={35} color="currentColor" filled={true} />
                : <img src="/InfiniFilm_icon.svg" alt="" className="hp-logo" />}
            </span>
            <span className="hp-name">Infini Film</span>
          </div>
          <div className={`hp-shuf-wrap${page === "saved" ? " hide" : ""}`}>
            <div className="hp-div" />
            <button className="hp-btn" style={{justifyContent:"center", transform:"translateX(-2px)"}} onClick={shuffle} disabled={loadingFilms}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                style={spinning
                  ? { transition: "transform .5s ease", transform: "rotate(360deg)" }
                  : { transition: "transform 0s" }}>
                <polyline points="16 3 21 3 21 8" />
                <line x1="4" y1="20" x2="21" y2="3" />
                <polyline points="21 16 21 21 16 21" />
                <line x1="15" y1="15" x2="21" y2="21" />
                <line x1="4" y1="4" x2="9" y2="9" />
              </svg>
              Shuffle
            </button>
          </div>
        </div>
      </header>

      {/* Bottom nav */}
      <nav className="bnav">
        <div className="pill">
          <button
            className={`nb${showFilter || (page === "saved" && (savedFilters.decade.length > 0 || savedFilters.genre.length > 0 || savedFilters.country.length > 0 || savedFilters.minRating > 0)) ? " on" : ""}`}
            onClick={() => setShowFilter(v => !v)}>
            {showFilter ? (
              <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <rect x="3" y="4.5" width="18" height="2.5" rx="1.25" />
                <rect x="7" y="10.75" width="10" height="2.5" rx="1.25" />
                <rect x="10" y="17" width="4" height="2.5" rx="1.25" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="8" y1="12" x2="16" y2="12" />
                <line x1="11" y1="18" x2="13" y2="18" />
              </svg>
            )}
          </button>
          <button
            className={`nb${isCanvas && !showFilter ? " on" : ""}`}
            onClick={() => { setPage("canvas"); setShowFilter(false); resetPosition(); }}>
            <InfiniIcon size={22} color="currentColor" filled={isCanvas && !showFilter} />
          </button>
          <button
            className={`nb${page === "saved" ? " on" : ""}`}
            onClick={() => { setPage(p => p === "saved" ? "canvas" : "saved"); setShowFilter(false); }}>
            {page === "saved" ? (
              <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Filter panel */}
      {showFilter && (
        page === "saved"
          ? <FilterPanel filters={savedFilters} onApply={applySavedFilters} onClose={() => setShowFilter(false)} />
          : <FilterPanel filters={filters} onApply={applyFilters} onClose={() => setShowFilter(false)} />
      )}

      {/* Modal */}
      {selected && (
        <FilmModal
          film={selected.film}
          cardRect={selected.cardRect}
          isSaved={savedSet.has(selected.film.id)}
          onToggleSave={toggleSave}
          onClose={closeModal}
          closing={modalClosing}
          detailsData={details[selected.film.id] || null}
          detailsLoading={detailsLoading}
        />
      )}
    </div>
  );
}
