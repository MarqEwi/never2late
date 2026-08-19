/**
 * Rohaufnahmen der App im Telefonformat – die Vorlage für storegrafik.py.
 *
 *     node aufnehmen.mjs konfig.json
 *
 * Gesteuert wird alles über den Abschnitt "aufnahmen" derselben JSON-Datei,
 * die auch die Grafiken baut. Pfade sind relativ zur Konfigurationsdatei.
 *
 * Der Grund für ein eigenes Skript statt „mal eben von Hand abfotografieren":
 * Store-Aufnahmen müssen reproduzierbar sein. Ändert sich die App, sollen
 * dieselben fünf Bilder auf Knopfdruck neu entstehen – mit denselben
 * Beispieldaten, derselben Scrollposition, demselben Zustand.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const konfigPfad = resolve(process.argv[2] ?? "konfig.json");
const k = JSON.parse(readFileSync(konfigPfad, "utf8"));
const a = k.aufnahmen ?? {};

// Playwright liegt im Projekt, dieses Skript aber im Skill-Ordner – und ESM
// beachtet NODE_PATH nicht. Deshalb von der Konfigurationsdatei und vom
// Arbeitsverzeichnis aus nach oben suchen. Die Projekte hängen mal an
// "playwright", mal nur an "playwright-core"; beide können Screenshots.
async function ladePlaywright() {
  const wurzeln = [dirname(konfigPfad), process.cwd()];
  for (const wurzel of wurzeln) {
    const auf = createRequire(join(wurzel, "_.js"));
    for (const name of ["playwright", "playwright-core"]) {
      try {
        const m = await import(pathToFileURL(auf.resolve(name)).href);
        // playwright-core ist CommonJS – je nach Version liegt chromium
        // direkt am Modul oder unter default.
        if (m.chromium ?? m.default?.chromium) return m.chromium ? m : m.default;
      } catch {}
    }
  }
  try {
    return await import("playwright");
  } catch {}
  throw new Error(
    "Playwright nicht gefunden. Im Projektordner ausführen oder dort " +
      "'npm i -D playwright-core' nachziehen.",
  );
}

const { chromium } = await ladePlaywright();
process.chdir(dirname(konfigPfad));

const BROWSER = a.browser ?? process.env.CHROMIUM ?? "/opt/pw-browsers/chromium";
const browser = await chromium.launch({
  // In den MERCwerk-Umgebungen liegt Chromium fest unter /opt/pw-browsers;
  // "playwright install" ist dort weder nötig noch erlaubt.
  ...(BROWSER && BROWSER !== "system" ? { executablePath: BROWSER } : {}),
});

const seite = await browser.newPage({
  viewport: { width: a.breite ?? 540, height: a.hoehe ?? 960 },
  deviceScaleFactor: a.skalierung ?? 2,   // 540x960 @2 = 1080x1920
  isMobile: true,
  hasTouch: true,
  locale: a.sprache ?? "de-DE",
});

// Beispieldaten und Zustand VOR dem ersten Rendern setzen. Leere Listen und
// Werbeplatzhalter sind die zwei häufigsten Gründe, warum Store-Aufnahmen
// billig aussehen.
if (a.vorbereiten) await seite.addInitScript(a.vorbereiten);

await seite.goto(a.url, { waitUntil: "networkidle" });
await seite.waitForTimeout(a.anlauf ?? 700);

for (const s of a.schritte ?? []) {
  // Eigene Ansichtsgröße je Schritt. Nützlich fürs Banner: Dort ist das Gerät
  // klein, und in einer engeren Ansicht sind die Bedienelemente relativ größer
  // und damit noch lesbar. Das Seitenverhältnis muss 9:16 bleiben; die reine
  // Pixelzahl darf kleiner sein, weil storegrafik.py ohnehin skaliert
  // (deviceScaleFactor lässt sich nachträglich nicht mehr ändern).
  if (s.breite || s.hoehe) {
    await seite.setViewportSize({
      width: s.breite ?? a.breite ?? 540,
      height: s.hoehe ?? a.hoehe ?? 960,
    });
    await seite.waitForTimeout(250);
  }
  if (s.js) await seite.evaluate(s.js);
  if (s.fuellen)
    for (const [wahl, wert] of Object.entries(s.fuellen))
      await seite.fill(wahl, String(wert));   // fill() löst change-Ereignisse
                                              // aus, ein gesetztes .value nicht
  if (s.klicken) await seite.click(s.klicken);
  if (s.scrollen)
    await seite.locator(s.scrollen).scrollIntoViewIfNeeded();
  await seite.waitForTimeout(s.warten ?? 450);

  if (s.datei) {
    await seite.screenshot({ path: s.datei });
    console.log(`${s.datei}  aufgenommen`);
  }
}

await browser.close();
