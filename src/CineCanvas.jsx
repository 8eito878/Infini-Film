import { useState, useEffect, useLayoutEffect, useRef, useMemo } from "react";

/* ── TMDB ────────────────────────────────────────────────────────────────── */
const TMDB_KEY = "16370ad515ac76b8ec2726ca32074643";
const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMG = typeof window !== 'undefined' && window.innerWidth <= 768
  ? "https://image.tmdb.org/t/p/w342"
  : "https://image.tmdb.org/t/p/w780";

/* ── Genre mapping ───────────────────────────────────────────────────────── */
const GENRE_IDS = {
  Action: 28, Adventure: 12, Animation: 16, Comedy: 35, Crime: 80,
  Documentary: 99, Drama: 18, Family: 10751, Fantasy: 14, History: 36,
  Horror: 27, Music: 10402, Mystery: 9648, Romance: 10749,
  "Science Fiction": 878, "TV Movie": 10770, Thriller: 53, War: 10752, Western: 37,
};
const GENRE_ID_TO_NAME = Object.fromEntries(Object.entries(GENRE_IDS).map(([k, v]) => [v, k]));
const GENRES = Object.keys(GENRE_IDS);

/* ── Language mapping ────────────────────────────────────────────────────── */
const LANGUAGE_CODES = {
  English: "en", Japanese: "ja", Korean: "ko", French: "fr", German: "de",
  Italian: "it", Spanish: "es", Mandarin: "zh", Cantonese: "cn",
  Portuguese: "pt", Russian: "ru", Persian: "fa", Arabic: "ar",
  Hindi: "hi", Swedish: "sv", Polish: "pl", Danish: "da",
  Dutch: "nl", Tamil: "ta", Telugu: "te",
};
const CODE_TO_LANGUAGE = Object.fromEntries(Object.entries(LANGUAGE_CODES).map(([k, v]) => [v, k]));
const LANGUAGES = Object.keys(LANGUAGE_CODES);


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
  { l: "All",  v: -1  },
  { l: "6.0+", v: 6.0 },
  { l: "6.5+", v: 6.5 },
  { l: "7.0+", v: 7.0 },
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
  overflow:hidden;height:100%;-webkit-tap-highlight-color:transparent;-webkit-touch-callout:none;-webkit-font-smoothing:antialiased;
  overscroll-behavior:none;}
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
@keyframes fc-save{0%{transform:scale(1)}28%{transform:scale(.84)}62%{transform:scale(1.06)}82%{transform:scale(.98)}100%{transform:scale(1)}}
@keyframes fc-flash{0%{opacity:.45}100%{opacity:0}}
@keyframes sh-spin{to{transform:rotate(360deg)}}
@keyframes fc-shake{0%,100%{transform:translateX(0)}18%{transform:translateX(-7px)}36%{transform:translateX(6px)}54%{transform:translateX(-5px)}72%{transform:translateX(4px)}88%{transform:translateX(-2px)}}
.fc-saving .fc-wrap{animation:fc-save .42s cubic-bezier(.36,.07,.19,.97);}
.fc-saving::after{content:'';position:absolute;inset:0;border-radius:4px;background:#fff;pointer-events:none;animation:fc-flash .28s ease forwards;}
.fc-shake .fc-wrap{animation:fc-shake .45s cubic-bezier(.36,.07,.19,.97);}

/* Loading */
.cv-loading{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;}
.dots{display:flex;gap:5px;padding:16px 0;justify-content:center;}
.dot{width:5px;height:5px;border-radius:50%;background:var(--dot);animation:dp 1.4s ease-in-out infinite;}
.dot:nth-child(2){animation-delay:.2s;}.dot:nth-child(3){animation-delay:.4s;}
@keyframes dp{0%,80%,100%{opacity:.3;transform:scale(.8);}40%{opacity:1;transform:scale(1);}}
.intro-cover{position:fixed;inset:0;background:#171715;z-index:9999;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  pointer-events:none;transition:opacity 0.55s ease-out;}
.intro-logo{width:140px;filter:brightness(0) invert(1);opacity:0.8;}

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
.hp-logo{height:15px;width:auto;display:block;pointer-events:none;-webkit-user-drag:none;user-select:none;-webkit-user-select:none;}
.hp-name{font-size:14px;font-weight:600;color:var(--t1);letter-spacing:-.01em;white-space:nowrap;user-select:none;-webkit-user-select:none;}
.hp-div{width:1px;height:20px;background:var(--bd);flex-shrink:0;}
.hp-shuf-wrap{display:flex;align-items:center;overflow:hidden;max-width:140px;opacity:1;
  transition:max-width .55s cubic-bezier(.25,.1,.25,1),opacity .4s ease .1s;}
.hp-shuf-wrap.hide{max-width:0;opacity:0;pointer-events:none;
  transition:max-width .3s cubic-bezier(.4,0,.2,1),opacity .18s ease;}
.hp-btn{display:flex;align-items:center;gap:5px;padding:0 14px;height:100%;background:none;border:none;
  cursor:pointer;color:var(--t2);font-size:12px;font-weight:500;font-family:inherit;
  -webkit-tap-highlight-color:transparent;-webkit-touch-callout:none;user-select:none;-webkit-user-select:none;
  white-space:nowrap;transition:color .15s;}
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
  -webkit-tap-highlight-color:transparent;-webkit-touch-callout:none;user-select:none;-webkit-user-select:none;}
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
.svmt{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:10px;padding-bottom:10%;}
@media(max-width:768px){.svmt{padding-bottom:40%;}}
.svmt svg{stroke:var(--bd);}
.svmt-t{font-size:13px;color:var(--t4);font-weight:500;}
.sv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,140px));
  gap:12px;justify-content:center;}
.svi{position:relative;cursor:pointer;border-radius:4px;overflow:hidden;background:var(--card);
  width:100%;aspect-ratio:2/3;height:auto;-webkit-tap-highlight-color:transparent;
  box-shadow:0 0 0 1px rgba(128,128,120,.12);}
.svi img{width:100%;height:100%;object-fit:cover;display:block;user-select:none;-webkit-user-select:none;-webkit-user-drag:none;-webkit-touch-callout:none;pointer-events:none;}
.svi-fb{width:100%;height:100%;display:flex;flex-direction:column;align-items:center;
  justify-content:center;font-size:9px;color:var(--tc);text-align:center;padding:6px;gap:3px;font-weight:600;
  background:linear-gradient(140deg,var(--bg2),var(--card2));}
.svx{position:absolute;top:5px;right:5px;background:rgba(0,0,0,.55);border:none;border-radius:50%;
  width:22px;height:22px;display:flex;align-items:center;justify-content:center;cursor:pointer;
  color:#fff;font-size:12px;-webkit-tap-highlight-color:transparent;-webkit-touch-callout:none;
  user-select:none;-webkit-user-select:none;opacity:0;transition:opacity .2s;}
.svi:hover .svx{opacity:1;}
.svi.svi-edit .svx{opacity:1;}
@keyframes svi-out{to{opacity:0;transform:scale(.82);}}
.svi-removing{animation:svi-out .28s ease forwards;pointer-events:none;}
@keyframes svi-wiggle{0%,100%{transform:rotate(-0.7deg)}50%{transform:rotate(0.7deg)}}
.svi.svi-edit:not(.svi-removing){animation:svi-wiggle .22s ease-in-out infinite;transform-origin:center;}

/* Modal */
.mbg{position:fixed;inset:0;background:var(--overlay);z-index:400;
  backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);
  opacity:0;transition:opacity .35s ease;pointer-events:none;}
.mbg.on{opacity:1;pointer-events:auto;}
.mclose{position:fixed;top:max(14px,env(safe-area-inset-top));right:14px;z-index:420;
  background:var(--surface);border:1px solid var(--bd);border-radius:50%;
  width:38px;height:38px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--t1);
  backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);-webkit-tap-highlight-color:transparent;-webkit-touch-callout:none;user-select:none;-webkit-user-select:none;
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
.m-title{font-size:26px;font-weight:700;line-height:1.12;color:var(--title);margin-bottom:4px;letter-spacing:-.02em;text-align:center;}
.m-orig{font-size:13px;color:var(--t2);font-weight:400;margin-bottom:6px;text-align:center;}
.m-orig::before{content:'「';user-select:none;-webkit-user-select:none;}
.m-orig::after{content:'」';user-select:none;-webkit-user-select:none;}
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
.cpbtn{flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:14px;
  background:var(--bg3);border:1px solid var(--bd);border-radius:14px;color:var(--t2);
  font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;cursor:pointer;
  font-family:inherit;-webkit-tap-highlight-color:transparent;transition:color .15s,border-color .15s;}
.cpbtn.ok{color:var(--accent);border-color:var(--accent);}
@media(min-width:769px){.cpbtn{display:none;}}

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
function filmLanguage(f) {
  const code = f.original_language;
  return CODE_TO_LANGUAGE[code] || code || "";
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

/* ── Curated list sampling ───────────────────────────────────────────────── */
function sampleMovies(criteria, pool) {
  let filtered = pool.filter(m => m.poster_path);

  if (criteria.genre.length > 0) {
    const ids = criteria.genre.map(g => GENRE_IDS[g]).filter(Boolean);
    if (ids.length) filtered = filtered.filter(m => m.genre_ids?.some(id => ids.includes(id)));
  }

  if (criteria.decade.length > 0) {
    filtered = filtered.filter(m => {
      const year = parseInt(m.release_date?.slice(0, 4));
      if (!year) return false;
      return criteria.decade.some(d => {
        const { gte, lte } = DECADE_RANGES[d];
        return year >= parseInt(gte) && year <= parseInt(lte);
      });
    });
  }

  if (criteria.language.length > 0) {
    const codes = criteria.language.map(l => LANGUAGE_CODES[l]).filter(Boolean);
    filtered = filtered.filter(m => codes.includes(m.original_language));
  }

  const hasOtherFilters = criteria.decade.length > 0 || criteria.genre.length > 0 || criteria.language.length > 0 || criteria.minRating !== 0;
  const effectiveMinRating = criteria.minRating > 0 ? criteria.minRating : criteria.minRating === 0 && !hasOtherFilters ? 7.5 : 0;
  filtered = filtered.filter(m => (m.vote_average ?? 0) >= effectiveMinRating);
  if (!hasOtherFilters) {
    filtered = filtered.filter(m => (m.vote_count ?? 0) >= 5000);
  }

  const shuffled = shuffleArr(filtered);
  const picked = shuffled.slice(0, 60);
  if (picked.length > 0 && picked.length < 60) {
    // Pad with a re-shuffled copy to avoid predictable repeat patterns
    const extra = shuffleArr([...picked]);
    while (picked.length < 60) picked.push(extra[picked.length % extra.length]);
  }

  // Deconflict: ensure no two vertically adjacent slots in the same column
  // share the same movie. Column step = COLS_PER_TILE (6); also check tile
  // wrap (fi=54..59 is adjacent to fi=0..5 when tiles repeat vertically).
  const cols = COLS_PER_TILE;
  const total = picked.length; // 60
  for (let pass = 0; pass < 4; pass++) {
    for (let i = 0; i < total; i++) {
      const next = (i + cols) % total;
      if (picked[i].id !== picked[next].id) continue;
      // Find a swap candidate for position `next` that breaks both conflicts
      const prev = (next - cols + total) % total;
      const nextNext = (next + cols) % total;
      for (let k = next + 1; k < total; k++) {
        const kPrev = (k - cols + total) % total;
        const kNext = (k + cols) % total;
        if (
          picked[k].id !== picked[prev].id &&
          picked[k].id !== picked[nextNext].id &&
          picked[next].id !== picked[kPrev].id &&
          picked[next].id !== picked[kNext].id
        ) {
          [picked[next], picked[k]] = [picked[k], picked[next]];
          break;
        }
      }
    }
  }

  return picked;
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
          ? <img src={src} alt={film.title} draggable={false}
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
  const reset = () => setLoc({ decade: [], genre: [], language: [], minRating: 0 });
  const chev = (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );

  const sections = [
    { k: "decade", l: "Decade", opts: DECADES },
    { k: "genre",  l: "Genre",  opts: GENRES },
    { k: "language", l: "Language", opts: LANGUAGES },
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
            {loc.minRating !== 0 && <span className="f-cnt">{loc.minRating < 0 ? "All" : `${loc.minRating}+`}</span>}
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
  const [editMode, setEditMode] = useState(false);
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
    <div className="saved-page" style={SAVED_PAGE_STYLE} onClick={() => setEditMode(false)}>
      <div className="sv-grid" onClick={e => e.stopPropagation()}>
        {savedFilms.map(f => (
          <SvItem key={f.id} film={f} onRemove={onRemove} onSelect={onSelect}
            editMode={editMode} onEnterEdit={() => setEditMode(true)} onExitEdit={() => setEditMode(false)} />
        ))}
      </div>
    </div>
  );
}

function SvItem({ film, onRemove, onSelect, editMode, onEnterEdit, onExitEdit }) {
  const [err, setErr] = useState(false);
  const [removing, setRemoving] = useState(false);
  const divRef = useRef(null);
  const timerRef = useRef(null);
  const longPressedRef = useRef(false);
  const src = film.poster_path ? `${TMDB_IMG}${film.poster_path}` : null;
  const year = filmYear(film);

  function handleRemove(e) {
    e.stopPropagation();
    setRemoving(true);
    setTimeout(() => onRemove(film.id), 280);
  }
  function handleSelect() {
    if (longPressedRef.current) { longPressedRef.current = false; return; }
    if (editMode) { onExitEdit(); return; }
    const r = divRef.current?.getBoundingClientRect();
    onSelect(film, r ? { x: r.left, y: r.top, w: r.width, h: r.height } : null);
  }
  function handleTouchStart() {
    longPressedRef.current = false;
    timerRef.current = setTimeout(() => { longPressedRef.current = true; onEnterEdit(); }, 500);
  }
  function handleTouchEnd() { clearTimeout(timerRef.current); }

  return (
    <div ref={divRef}
      className={`svi${removing ? ' svi-removing' : ''}${editMode ? ' svi-edit' : ''}`}
      onClick={handleSelect}
      onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} onTouchCancel={handleTouchEnd}>
      {src && !err
        ? <img src={src} alt={film.title} onError={() => setErr(true)} />
        : <div className="svi-fb"><span className="fb-t">{film.title}</span><span className="fb-y">{year}</span></div>}
      <button className="svx" onClick={handleRemove}>
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>
  );
}

/* ── Modal ───────────────────────────────────────────────────────────────── */
function FilmModal({ film, cardRect, isSaved, onToggleSave, onClose, closing, detailsData, detailsLoading }) {
  const [expanded, setExpanded] = useState(false);
  const [pe, setPe] = useState(false);
  const [copied, setCopied] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  const posterRef = useRef(null);
  const bgRef = useRef(null);
  const mscrollRef = useRef(null);
  const dragRef = useRef({ active: false, startY: 0, lastY: 0, lastT: 0, vel: 0, dy: 0 });

  const src = film.poster_path ? `${TMDB_IMG}${film.poster_path}` : null;
  const year = filmYear(film);
  const genres = filmGenres(film);
  const language = filmLanguage(film);

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

  function onDragStart(e) {
    if (!expanded || closing) return;
    const t = e.touches[0];
    dragRef.current = { active: true, startY: t.clientY, lastY: t.clientY, lastT: Date.now(), vel: 0, dy: 0 };
    if (posterRef.current) posterRef.current.style.transition = 'none';
    if (mscrollRef.current) mscrollRef.current.style.transition = 'none';
  }

  function onDragMove(e) {
    const dr = dragRef.current;
    if (!dr.active) return;
    const t = e.touches[0];
    const now = Date.now();
    const dy = Math.max(0, t.clientY - dr.startY);
    dr.vel = (t.clientY - dr.lastY) / Math.max(1, now - dr.lastT);
    dr.lastY = t.clientY;
    dr.lastT = now;
    dr.dy = dy;
    if (posterRef.current) posterRef.current.style.transform = `translate(0px,${dy}px) scale(1,1)`;
    if (mscrollRef.current) mscrollRef.current.style.transform = `translateY(${dy}px)`;
    if (bgRef.current) bgRef.current.style.opacity = String(Math.max(0, 1 - dy / 260));
  }

  function onDragEnd() {
    const dr = dragRef.current;
    if (!dr.active) return;
    dr.active = false;
    if (dr.dy > 120 || dr.vel > 0.5) {
      // Restore CSS transition so React's closing render animates poster back to card position
      if (posterRef.current) posterRef.current.style.transition = '';
      if (mscrollRef.current) { mscrollRef.current.style.transition = 'none'; mscrollRef.current.style.transform = ''; }
      if (bgRef.current) bgRef.current.style.opacity = '';
      onClose();
    } else {
      const ease = 'transform 0.38s cubic-bezier(.32,.72,0,1)';
      if (posterRef.current) { posterRef.current.style.transition = ease; posterRef.current.style.transform = 'translate(0px,0px) scale(1,1)'; }
      if (mscrollRef.current) { mscrollRef.current.style.transition = ease; mscrollRef.current.style.transform = 'translateY(0)'; }
      if (bgRef.current) bgRef.current.style.opacity = '';
      setTimeout(() => {
        if (posterRef.current) posterRef.current.style.transition = '';
        if (mscrollRef.current) mscrollRef.current.style.transition = '';
      }, 400);
    }
  }

  return (<>
    <div ref={bgRef} className={`mbg${expanded ? " on" : ""}`} onClick={onClose} />
    <button className={`mclose${expanded ? " on" : ""}`} onClick={onClose}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
    </button>
    <div ref={posterRef} className="mposter" style={{ left: naturalX, top: naturalY, width: naturalW, height: naturalH, borderRadius: expanded ? 6 : 4, transform: `translate(${tx}px,${ty}px) scale(${sx},${sy})` }}
      onTouchStart={onDragStart} onTouchMove={onDragMove} onTouchEnd={onDragEnd} onTouchCancel={onDragEnd}>
      {src && !pe
        ? <img src={src} alt={film.title} onError={() => setPe(true)} />
        : <div className="mposter-fb">{film.title}</div>}
    </div>
    <div ref={mscrollRef} className="mscroll" style={{ top: scrollTop }}>
      <div className="mscroll-inner">
        <div className={`minfo${expanded ? " on" : ""}`}>
          {genres.length > 0 && (
            <div className="m-genres">
              {genres.map(g => <span key={g} className="m-gen">{g}</span>)}
            </div>
          )}
          <div className="m-title">{film.title}</div>
          {film.original_title && <div className="m-orig">{film.original_title}</div>}
          {detailsData?.director && <div className="m-dir">Dir. {detailsData.director}</div>}
          <div className="m-meta">
            {year > 0 && (
              <div className="m-mit">
                <span className="m-ml">Year</span>
                <span className="m-mv">{year}</span>
              </div>
            )}
            {language && (
              <div className="m-mit">
                <span className="m-ml">Language</span>
                <span className="m-mv">{language}</span>
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
            <button className={`cpbtn${copied ? " ok" : ""}`} onClick={copyLink}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {copied
                  ? <polyline points="20 6 9 17 4 12" />
                  : <><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></>}
              </svg>
              {copied ? "Copied" : "Copy"}
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
  const [filters, setFilters] = useState({ decade: [], genre: [], language: [], minRating: 0 });
  const [savedFilters, setSavedFilters] = useState({ decade: [], genre: [], language: [], minRating: 0 });
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
  const longPressSaveRef = useRef(null);
  const curatedRef = useRef([]);
  const introPlayedRef = useRef(false);
  const refreshTokenRef = useRef(null);
  const skipResetRef = useRef(false);
  const coverRef = useRef(null);

  const MIN_S = useMemo(() => {
    const vw = window.innerWidth, vh = window.innerHeight;
    // Mobile: fixed at scale that fits exactly 4 card columns on screen
    if (vw <= 768) return vw / (4 * (CARD_W + GAP));
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
    const pool = curatedRef.current;
    if (!pool.length) return;
    let picked = sampleMovies(criteria, pool);
    if (!picked.length && criteria.language.length) {
      picked = sampleMovies({ ...criteria, language: [] }, pool);
    }
    if (!picked.length) {
      picked = sampleMovies({ decade: [], genre: [], language: [], minRating: 0 }, pool);
    }
    const token = {};
    refreshTokenRef.current = token;
    await Promise.race([
      Promise.all(picked.map(f => new Promise(res => {
        const img = new Image(); img.onload = img.onerror = res;
        img.src = `${TMDB_IMG}${f.poster_path}`;
      }))),
      new Promise(res => setTimeout(res, 6000)),
    ]);
    if (refreshTokenRef.current !== token) return;
    setFilms(picked);
  }

  /* Initial load — fetch curated list once */
  useEffect(() => {
    setLoadingFilms(true);
    fetch('/curated.json')
      .then(r => r.json())
      .then(data => {
        curatedRef.current = data.filter(m => m.poster_path);
        const picked = sampleMovies(filtersRef.current, curatedRef.current);
        setFilms(picked);
        setLoadingFilms(false);
        // Open film from URL /film/{slug}/{year}
        const pathM = window.location.pathname.match(/^\/film\/([^/]+)(?:\/(\d{4}))?/);
        if (pathM) {
          const [, slug, year] = pathM;
          const film = curatedRef.current.find(f =>
            lbSlug(f.title) === slug && (!year || f.release_date?.slice(0, 4) === year)
          );
          if (film) {
            const r = { x: window.innerWidth / 2 - CARD_W / 2, y: window.innerHeight / 2 - CARD_H / 2, w: CARD_W, h: CARD_H };
            setSelected({ film, cardRect: r });
          }
        }
      })
      .catch(err => {
        console.error('[curated]', err);
        setLoadingFilms(false);
      });
  }, []);

  /* Reset canvas position */
  function resetPosition() {
    cancelAnimationFrame(animRaf.current);
    cancelAnimationFrame(momentumRaf.current);
    animActiveRef.current = false;
    const vw = window.innerWidth, vh = window.innerHeight;
    const isMobile = vw <= 768;
    const s = isMobile ? vw / (4 * (CARD_W + GAP)) : Math.max(0.8, MIN_S);
    const px = pitchX * s, py = pitchY * s;
    let x, y;
    if (isMobile) {
      x = vw / 2 - (pitchX + (4 * CARD_W + 3 * GAP) / 2) * s;
      y = vh / 2 - (pitchY / 2) * s;
      while (y > 0) y -= py; while (y < -py) y += py;
    } else {
      const totalW = TILES_X * pitchX * s;
      x = (vw - totalW) / 2; y = 100 - py;
      while (x > 0) x -= px; while (x < -px) x += px;
      while (y > 0) y -= py; while (y < -py) y += py;
    }
    scaleRef.current = s; offRef.current = { x, y };
    if (innerRef.current) innerRef.current.style.transform = `translate3d(${x}px,${y}px,0) scale(${s})`;
    focusedRef.current = null;
  }

  /* Set intro starting state before paint — no flash */
  useLayoutEffect(() => {
    if (films.length === 0) return;
    if (introPlayedRef.current && skipResetRef.current) {
      // Shuffle: repos to zoomed-out start before paint so new posters never appear at wrong position
      const vw = window.innerWidth, vh = window.innerHeight;
      const isMobile = vw <= 768;
      const targetS = isMobile ? vw / (4 * (CARD_W + GAP)) : Math.max(0.8, MIN_S);
      const tpy = pitchY * targetS;
      let tx, ty;
      if (isMobile) {
        tx = vw / 2 - (pitchX + (4 * CARD_W + 3 * GAP) / 2) * targetS;
        ty = vh / 2 - (pitchY / 2) * targetS;
        while (ty > 0) ty -= tpy; while (ty < -tpy) ty += tpy;
      } else {
        const tpx = pitchX * targetS;
        const totalW = TILES_X * pitchX * targetS;
        tx = (vw - totalW) / 2; ty = 100 - tpy;
        while (tx > 0) tx -= tpx; while (tx < -tpx) tx += tpx;
        while (ty > 0) ty -= tpy; while (ty < -tpy) ty += tpy;
      }
      const startS = targetS * (isMobile ? 0.90 : 0.86);
      const sx = vw / 2 - (vw / 2 - tx) * startS / targetS;
      const sy = vh / 2 - (vh / 2 - ty) * startS / targetS;
      cancelAnimationFrame(animRaf.current);
      cancelAnimationFrame(momentumRaf.current);
      animActiveRef.current = false;
      scaleRef.current = startS;
      offRef.current = { x: sx, y: sy };
      if (innerRef.current) {
        innerRef.current.style.transform = `translate3d(${sx}px,${sy}px,0) scale(${startS})`;
      }
      return;
    }
    if (introPlayedRef.current) return;
    const vw = window.innerWidth, vh = window.innerHeight;
    const isMobile = vw <= 768;
    const targetS = isMobile ? vw / (4 * (CARD_W + GAP)) : Math.max(0.8, MIN_S);
    const tpy = pitchY * targetS;
    let tx, ty;
    if (isMobile) {
      tx = vw / 2 - (pitchX + (4 * CARD_W + 3 * GAP) / 2) * targetS;
      ty = vh / 2 - (pitchY / 2) * targetS;
      while (ty > 0) ty -= tpy; while (ty < -tpy) ty += tpy;
    } else {
      const tpx = pitchX * targetS;
      const totalW = TILES_X * pitchX * targetS;
      tx = (vw - totalW) / 2; ty = 100 - tpy;
      while (tx > 0) tx -= tpx; while (tx < -tpx) tx += tpx;
      while (ty > 0) ty -= tpy; while (ty < -tpy) ty += tpy;
    }
    // Derive start position so the same world point stays at screen center
    const startS = targetS * (isMobile ? 0.84 : 0.76);
    const sx = vw / 2 - (vw / 2 - tx) * startS / targetS;
    const sy = vh / 2 - (vh / 2 - ty) * startS / targetS;
    cancelAnimationFrame(animRaf.current);
    cancelAnimationFrame(momentumRaf.current);
    animActiveRef.current = false;
    scaleRef.current = startS;
    offRef.current = { x: sx, y: sy };
    if (innerRef.current) {
      innerRef.current.style.transform = `translate3d(${sx}px,${sy}px,0) scale(${startS})`;
    }
    if (innerRef.current) {
      innerRef.current.style.filter = 'blur(1px)';
    }
  }, [films]);

  /* Start intro animation after paint, handle subsequent film changes */
  useEffect(() => {
    if (films.length === 0) return;
    if (!introPlayedRef.current) {
      introPlayedRef.current = true;
      const vw = window.innerWidth, vh = window.innerHeight;
      const isMobile = vw <= 768;
      const targetS = isMobile ? vw / (4 * (CARD_W + GAP)) : Math.max(0.8, MIN_S);
      const tpy = pitchY * targetS;
      let tx, ty;
      if (isMobile) {
        tx = vw / 2 - (pitchX + (4 * CARD_W + 3 * GAP) / 2) * targetS;
        ty = vh / 2 - (pitchY / 2) * targetS;
        while (ty > 0) ty -= tpy; while (ty < -tpy) ty += tpy;
      } else {
        const tpx = pitchX * targetS;
        const totalW = TILES_X * pitchX * targetS;
        tx = (vw - totalW) / 2; ty = 100 - tpy;
        while (tx > 0) tx -= tpx; while (tx < -tpx) tx += tpx;
        while (ty > 0) ty -= tpy; while (ty < -tpy) ty += tpy;
      }

      // Preload all poster images so canvas appears fully loaded on first reveal
      const preload = Promise.race([
        Promise.all(films.filter(f => f.poster_path).map(f => new Promise(res => {
          const img = new Image();
          img.onload = img.onerror = res;
          img.src = `${TMDB_IMG}${f.poster_path}`;
        }))),
        new Promise(res => setTimeout(res, 8000)), // 8s max wait
      ]);

      preload.then(() => {
        // Start zoom and cover fade simultaneously — canvas already moving when revealed
        if (coverRef.current) coverRef.current.style.opacity = '0';
        animateTo(targetS, tx, ty, 1800,
          t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
        );
        // Start blur fade 700ms into zoom so it clears smoothly before zoom ends
        setTimeout(() => {
          if (innerRef.current) {
            innerRef.current.style.transition = 'filter 1.1s ease-out';
            innerRef.current.style.filter = 'blur(0px)';
            setTimeout(() => {
              if (innerRef.current) { innerRef.current.style.transition = ''; innerRef.current.style.filter = ''; }
            }, 1150);
          }
        }, 700);
        // Remove cover from DOM after its CSS transition finishes
        setTimeout(() => {
          if (coverRef.current) coverRef.current.style.display = 'none';
        }, 650);
      });
      return;
    }
    if (skipResetRef.current) {
      skipResetRef.current = false;
      // Canvas already positioned at zoomed-out start by useLayoutEffect — just animate in
      const vw = window.innerWidth, vh = window.innerHeight;
      const isMobile = vw <= 768;
      const targetS = isMobile ? vw / (4 * (CARD_W + GAP)) : Math.max(0.8, MIN_S);
      const tpy = pitchY * targetS;
      let tx, ty;
      if (isMobile) {
        tx = vw / 2 - (pitchX + (4 * CARD_W + 3 * GAP) / 2) * targetS;
        ty = vh / 2 - (pitchY / 2) * targetS;
        while (ty > 0) ty -= tpy; while (ty < -tpy) ty += tpy;
      } else {
        const tpx = pitchX * targetS;
        const totalW = TILES_X * pitchX * targetS;
        tx = (vw - totalW) / 2; ty = 100 - tpy;
        while (tx > 0) tx -= tpx; while (tx < -tpx) tx += tpx;
        while (ty > 0) ty -= tpy; while (ty < -tpy) ty += tpy;
      }
      animateTo(targetS, tx, ty, 1400,
        t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
      );
      return;
    }
    const t = setTimeout(resetPosition, 50);
    return () => clearTimeout(t);
  }, [films]);

  /* Animate to target */
  function animateTo(targetScale, targetX, targetY, duration = 460, easeFn = t => 1 - Math.pow(1 - t, 3), onComplete = null) {
    cancelAnimationFrame(animRaf.current);
    cancelAnimationFrame(momentumRaf.current);
    animActiveRef.current = true;
    const startScale = scaleRef.current, startX = offRef.current.x, startY = offRef.current.y;
    const startTime = performance.now();
    function step(now) {
      const t = Math.min(1, (now - startTime) / duration);
      const e = easeFn(t);
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
        if (onComplete) onComplete();
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
      openModal(film, cardRect);
    } else {
      focusSlot(slotIdx);
    }
  }

  function shuffle() {
    setSpinning(true);
    skipResetRef.current = true;
    const start = Date.now();
    refreshFilms().finally(() => {
      const elapsed = Date.now() - start;
      const wait = Math.max(0, 560 - elapsed);
      setTimeout(() => setSpinning(false), wait);
    });
  }

  function applyFilters(f) {
    filtersRef.current = f;
    setFilters(f);
    skipResetRef.current = true;
    refreshFilms(f);
  }

  function applySavedFilters(f) {
    setSavedFilters(f);
  }

  const filteredSavedFilms = useMemo(() => {
    const f = savedFilters;
    const active = f.decade.length > 0 || f.genre.length > 0 || f.language.length > 0 || f.minRating !== 0;
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
      if (f.language.length > 0) {
        const codes = f.language.map(l => LANGUAGE_CODES[l]).filter(Boolean);
        if (!codes.includes(film.original_language)) return false;
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

  function openModal(film, cardRect) {
    const year = film.release_date?.slice(0, 4) ?? '';
    window.history.pushState(null, '', `/film/${lbSlug(film.title)}${year ? `/${year}` : ''}`);
    setSelected({ film, cardRect });
  }

  function closeModal() {
    window.history.pushState(null, '', '/');
    setModalClosing(true);
    setTimeout(() => { setSelected(null); setModalClosing(false); }, 520);
  }

  /* Drag + wheel + pinch */
  useEffect(() => {
    const vp = vpRef.current; if (!vp) return;
    let act = false, moved = false, sx = 0, sy = 0, sox = 0, soy = 0;
    let lx = 0, ly = 0, lt = 0, vx = 0, vy = 0;
    let pinching = false, pStartDist = 0, pStartScale = 1, pinchMaxHit = false;
    let lpTimer = null, lpFired = false;
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
      if (e.touches) {
        const c = e.target?.closest('[data-slot]');
        if (c) {
          const slotIdx = parseInt(c.dataset.slot, 10);
          lpTimer = setTimeout(() => { lpTimer = null; lpFired = true; longPressSaveRef.current?.(slotIdx); }, 500);
        }
      }
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
        if (lpTimer) { clearTimeout(lpTimer); lpTimer = null; }
      }
      const now = Date.now(), dt = Math.max(1, now - lt);
      vx = vx * 0.6 + (x - lx) / dt * 16 * 0.4;
      vy = vy * 0.6 + (y - ly) / dt * 16 * 0.4;
      lx = x; ly = y; lt = now;
      apply(sox + dx, soy + dy);
    };

    const onE = e => {
      if (lpTimer) { clearTimeout(lpTimer); lpTimer = null; }
      const didLongPress = lpFired; lpFired = false;
      if (pinching) { pinching = false; act = false; vp.classList.remove('drag'); return; }
      if (!act) return;
      act = false; vp.classList.remove('drag');
      if (!moved) {
        if (didLongPress) { /* long-press save fired — skip tap */ }
        else {
        const t = e.changedTouches?.[0];
        const el = t ? document.elementFromPoint(t.clientX, t.clientY) : e.target;
        const c = el?.closest?.('[data-slot]');
        if (c) {
          onCardTap(parseInt(c.dataset.slot, 10));
        } else {
          focusedRef.current = null;
        }
        }
      } else if (Math.abs(vx) > 0.2 || Math.abs(vy) > 0.2) {
        const go = () => {
          vx *= 0.96; vy *= 0.96;
          if (Math.abs(vx) < 0.05 && Math.abs(vy) < 0.05) return;
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
    openModal(film, { x: slot.x * s + o.x, y: slot.y * s + o.y, w: CARD_W * s, h: CARD_H * s });
  };

  const savedSet = new Set(savedFilms.map(f => f.id));

  longPressSaveRef.current = (slotIdx) => {
    // Only respond when this card is already focused (1st tap done)
    if (focusedRef.current !== slotIdx) return;
    const slot = SLOT_POSITIONS[slotIdx];
    const film = films[slot.fi]; if (!film) return;
    const cardEl = document.querySelector(`[data-slot="${slotIdx}"]`);
    // Already saved → shake and return
    if (savedSet.has(film.id)) {
      navigator.vibrate?.([ 10, 60, 10 ]);
      if (cardEl) { cardEl.classList.add('fc-shake'); setTimeout(() => cardEl.classList.remove('fc-shake'), 480); }
      return;
    }
    toggleSave(film);
    navigator.vibrate?.(14);
    // カチ animation
    if (cardEl) { cardEl.classList.add('fc-saving'); setTimeout(() => cardEl.classList.remove('fc-saving'), 450); }
    // Flying poster to bookmark icon
    const src = film.poster_path ? `${TMDB_IMG}${film.poster_path}` : null;
    if (!src) return;
    const navBtn = document.querySelector('.bnav .pill button:last-child');
    if (!navBtn) return;
    const nr = navBtn.getBoundingClientRect();
    const s = scaleRef.current, o = offRef.current;
    const el = document.createElement('div');
    el.style.cssText = [
      `position:fixed`,
      `left:${slot.x * s + o.x}px`, `top:${slot.y * s + o.y}px`,
      `width:${CARD_W * s}px`, `height:${CARD_H * s}px`,
      `background:url(${src}) center/cover`, `border-radius:4px`,
      `z-index:9000`, `pointer-events:none`,
      `transition:left .75s cubic-bezier(.4,0,.2,1),top .75s cubic-bezier(.4,0,.2,1),width .75s cubic-bezier(.4,0,.2,1),height .75s cubic-bezier(.4,0,.2,1),border-radius .75s,opacity .5s .25s`,
    ].join(';');
    document.body.appendChild(el);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.style.left   = `${nr.left + nr.width / 2 - 14}px`;
      el.style.top    = `${nr.top  + nr.height / 2 - 14}px`;
      el.style.width  = '28px';
      el.style.height = '28px';
      el.style.borderRadius = '50%';
      el.style.opacity = '0';
    }));
    setTimeout(() => el.remove(), 1050);
  };

  const isCanvas = page === "canvas";

  return (
    <div className="app">
      {/* Full-screen loading cover — shown until all poster images are preloaded */}
      <div ref={coverRef} className="intro-cover">
        <img src={LOGO_PNG} className="intro-logo" alt="" />
      </div>
      {/* Shuffle blur overlay — lives outside .cv to avoid iOS compositor issues */}
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
            openModal(f, r);
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
                style={spinning ? { animation: "sh-spin .55s linear infinite" } : {}}>
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
            className={`nb${showFilter || (page === "saved" && (savedFilters.decade.length > 0 || savedFilters.genre.length > 0 || savedFilters.language.length > 0 || savedFilters.minRating !== 0)) ? " on" : ""}`}
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
