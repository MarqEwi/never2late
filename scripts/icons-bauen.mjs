// Erzeugt alle Icon-Dateien aus icons/logo.svg.
//
// Gerendert wird mit dem vorinstallierten Chromium (kein zusätzliches
// Grafikwerkzeug nötig, kein "playwright install").
//
//   node scripts/icons-bauen.mjs
//
// Ergebnis:
//   icons/icon-192.png, icon-512.png, icon-maskable-512.png   (Web/PWA)
//   android/.../mipmap-*/ic_launcher.png, ic_launcher_round.png,
//                        ic_launcher_foreground.png            (App)
//   android/.../values/ic_launcher_background.xml              (gemessene Farbe)
import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const SVG = readFileSync("icons/logo.svg", "utf8");
const RES = "android/app/src/main/res";

/* Android-Dichten. 48 dp Symbolkante bzw. 108 dp beim adaptiven Icon. */
const DICHTEN = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };

/* Seite, die das Logo in einer definierten Größe zeichnet.
   - rund:   beschneidet das Symbol kreisförmig (ic_launcher_round)
   - anteil: Größe des Motivs relativ zur Fläche. Beim adaptiven Vordergrund
     muss das Motiv in die innere Sicherheitszone passen (Android beschneidet
     ringsum bis zu 18 dp von 108 dp), beim maskierbaren Web-Icon ebenso.
   - hintergrund: false lässt die Fläche transparent (Vordergrund-Ebene). */
function seite(px, { rund = false, anteil = 1, hintergrund = true, stanzfarbe = null } = {}){
  const inner = Math.round(px * anteil);
  const rand = Math.round((px - inner) / 2);
  // Beim Vordergrund entfällt die Kachel: nur das Motiv, transparent umgeben.
  let svg = hintergrund
    ? SVG
    : SVG.replace(/<rect width="512" height="512" rx="112" fill="url\(#bg\)"\/>/, "");
  // Der Stanzkreis hinter der Uhr muss exakt die Fläche treffen, auf der er
  // liegt – beim adaptiven Icon ist das die einfarbige Hintergrundebene.
  if (stanzfarbe) svg = svg.replace(/(id="uhr-stanze"[^>]*fill=")url\(#bg\)"/, `$1${stanzfarbe}"`);
  return `<!doctype html><meta charset="utf-8"><style>
    html,body{margin:0;padding:0;background:transparent}
    #b{width:${px}px;height:${px}px;position:relative;overflow:hidden;
       ${rund ? "border-radius:50%;" : ""}}
    #s{position:absolute;left:${rand}px;top:${rand}px;width:${inner}px;height:${inner}px}
    #s svg{width:100%;height:100%;display:block}
  </style><div id="b"><div id="s">${svg}</div></div>`;
}

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage();

async function schreibe(pfad, px, opts){
  await page.setViewportSize({ width: px, height: px });
  await page.setContent(seite(px, opts));
  const buf = await page.locator("#b").screenshot({ omitBackground: true });
  mkdirSync(pfad.replace(/\/[^/]+$/, ""), { recursive: true });
  writeFileSync(pfad, buf);
  console.log(pfad + "  (" + px + "px)");
}

/* ---- Hintergrundfarbe des adaptiven Icons exakt aus dem Logo messen ----
   Genommen wird die Mitte der Farbfläche, damit Icon-Hintergrund und Logo
   in der App-Übersicht nahtlos ineinander übergehen. Die Messung steht vor
   dem Rendern, weil der Vordergrund diese Farbe braucht. */
await page.setViewportSize({ width: 512, height: 512 });
await page.setContent(seite(512));
const farbe = await page.evaluate(async () => {
  const svg = document.querySelector("#s svg");
  const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  await new Promise(r => { img.onload = r; img.src = url; });
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const ctx = c.getContext("2d");
  ctx.drawImage(img, 0, 0, 512, 512);
  const p = ctx.getImageData(256, 256, 1, 1).data;   // Mitte der Kachel
  return "#" + [p[0], p[1], p[2]].map(v => v.toString(16).padStart(2, "0").toUpperCase()).join("");
});
writeFileSync(`${RES}/values/ic_launcher_background.xml`,
  `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n` +
  `    <!-- Aus icons/logo.svg gemessen (Mitte der Farbfläche). -->\n` +
  `    <color name="ic_launcher_background">${farbe}</color>\n</resources>\n`);
console.log("Adaptive-Icon-Hintergrund: " + farbe);

/* ---- Web / PWA ---- */
await schreibe("icons/icon-192.png", 192);
await schreibe("icons/icon-512.png", 512);
/* Maskierbar: Startbildschirme beschneiden bis zu 20 % Rand, deshalb das
   Motiv kleiner und die Farbfläche darunter durchgehend. */
await schreibe("icons/icon-maskable-512.png", 512, { anteil: 0.78 });

/* ---- Android ---- */
for (const [name, f] of Object.entries(DICHTEN)){
  const dir = `${RES}/mipmap-${name}`;
  await schreibe(`${dir}/ic_launcher.png`, Math.round(48 * f));
  await schreibe(`${dir}/ic_launcher_round.png`, Math.round(48 * f), { rund: true });
  /* Adaptives Icon: 108 dp Ebene, Motiv auf 72 dp = zwei Drittel begrenzt. */
  await schreibe(`${dir}/ic_launcher_foreground.png`, Math.round(108 * f),
    { anteil: 72 / 108, hintergrund: false, stanzfarbe: farbe });
}

/* ---- Startbildschirm (Splash) ----
   Einfarbige Fläche in der Markenfarbe mit Logo und Schriftzug. Die
   Abmessungen entsprechen denen, die Capacitor anlegt. */
const SPLASH = {
  "drawable": [480, 320],
  "drawable-port-mdpi": [320, 480], "drawable-port-hdpi": [480, 800],
  "drawable-port-xhdpi": [720, 1280], "drawable-port-xxhdpi": [960, 1600],
  "drawable-port-xxxhdpi": [1280, 1920],
  "drawable-land-mdpi": [480, 320], "drawable-land-hdpi": [800, 480],
  "drawable-land-xhdpi": [1280, 720], "drawable-land-xxhdpi": [1600, 960],
  "drawable-land-xxxhdpi": [1920, 1280]
};
for (const [dir, [w, h]] of Object.entries(SPLASH)){
  const marke = Math.round(Math.min(w, h) * 0.26);
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<!doctype html><meta charset="utf-8"><style>
    html,body{margin:0;padding:0}
    #b{width:${w}px;height:${h}px;background:${farbe};display:flex;
       flex-direction:column;align-items:center;justify-content:center;
       gap:${Math.round(marke * 0.22)}px;
       font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}
    #s{width:${marke}px;height:${marke}px}
    #s svg{width:100%;height:100%;display:block}
    #t{color:#fff;font-size:${Math.round(marke * 0.3)}px;font-weight:700;letter-spacing:-.01em}
  </style><div id="b"><div id="s">${SVG}</div><div id="t">Never2Late</div></div>`);
  const buf = await page.locator("#b").screenshot();
  writeFileSync(`${RES}/${dir}/splash.png`, buf);
  console.log(`${RES}/${dir}/splash.png  (${w}x${h})`);
}

await browser.close();
