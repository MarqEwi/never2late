// Erzeugt die Grafiken für den Play-Store-Eintrag unter docs/store-grafiken/.
//
//   node scripts/screenshots.mjs && node scripts/store-grafiken.mjs
//
// Grundlage sind die App-Aufnahmen aus docs/screenshots/. Die Überschriften
// sind bewusst eigenständig formuliert: Bei mehreren Apps im selben Konto ist
// "wiederholter Inhalt" das größte Ablehnungsrisiko beim Play-Review.
import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const ZIEL = "docs/store-grafiken";
mkdirSync(ZIEL, { recursive: true });
const bild = p => "data:image/png;base64," + readFileSync(p).toString("base64");
const LOGO = readFileSync("icons/logo.svg", "utf8");

const SCHRIFT = 'system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
const VERLAUF = "linear-gradient(150deg,#0f766e 0%,#14b8a6 100%)";

const AUFNAHMEN = [
  { datei: "01-dashboard",         text: "Sofort sehen,<br>was als Nächstes zählt" },
  { datei: "03-liste",             text: "Ausweise, Karten, Verträge –<br>alles an einem Ort" },
  { datei: "04-detail",            text: "Erneuern, archivieren,<br>in den Kalender übernehmen" },
  { datei: "05-formular",          text: "In wenigen Sekunden erfasst –<br>auch in mehreren Kategorien" },
  { datei: "07-kategorie-neu",     text: "Eigene Kategorien<br>mit eigenem Symbol" },
  { datei: "06-archiv",            text: "Nichts läuft mehr<br>unbemerkt ab" },
  { datei: "02-dashboard-dunkel",  text: "Auch dunkel –<br>und ganz ohne Konto" }
];

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage();

/* ---- Store-Screenshots 1080 × 1920 ---- */
for (let i = 0; i < AUFNAHMEN.length; i++){
  const a = AUFNAHMEN[i];
  await page.setViewportSize({ width: 1080, height: 1920 });
  await page.setContent(`<style>
    html,body{margin:0;padding:0}
    #b{width:1080px;height:1920px;background:${VERLAUF};font-family:${SCHRIFT};
       display:flex;flex-direction:column;align-items:center;overflow:hidden}
    h1{color:#fff;font-size:62px;line-height:1.18;font-weight:700;letter-spacing:-.02em;
       text-align:center;margin:78px 60px 0}
    img{width:760px;border-radius:38px;margin-top:52px;
        box-shadow:0 26px 70px rgba(0,40,38,.42)}
  </style><div id="b"><h1>${a.text}</h1><img src="${bild(`docs/screenshots/${a.datei}.png`)}"></div>`);
  const name = `${ZIEL}/screenshot-${i + 1}-1080x1920.png`;
  writeFileSync(name, await page.locator("#b").screenshot());
  console.log(name);
}

/* ---- Feature-Grafik 1024 × 500 ---- */
await page.setViewportSize({ width: 1024, height: 500 });
await page.setContent(`<style>
  html,body{margin:0;padding:0}
  /* overflow:hidden ist Pflicht: Läuft der Text über, wächst sonst die
     Elementbreite mit, und der Screenshot wird breiter als 1024 px –
     Google verlangt die Maße aber auf den Pixel genau. */
  #b{width:1024px;height:500px;background:${VERLAUF};font-family:${SCHRIFT};
     display:flex;align-items:center;gap:52px;padding:0 76px;overflow:hidden;
     box-sizing:border-box}
  #s{width:190px;height:190px;flex:none}
  #s svg{width:100%;height:100%;display:block;
    filter:drop-shadow(0 12px 26px rgba(0,40,38,.35))}
  #t{flex:1;min-width:0}
  h1{color:#fff;font-size:78px;font-weight:700;letter-spacing:-.03em;margin:0}
  p{color:#d9f5f1;font-size:35px;margin:12px 0 0;font-weight:500}
</style><div id="b"><div id="s">${LOGO}</div>
  <div id="t"><h1>Never2Late</h1><p>Ablaufdaten und Fristen im Blick</p></div></div>`);
writeFileSync(`${ZIEL}/feature-grafik-1024x500.png`, await page.locator("#b").screenshot());
console.log(`${ZIEL}/feature-grafik-1024x500.png`);

await browser.close();
