// Erzeugt Vorschau-Screenshots der App (Handy-Format) unter docs/screenshots/.
//
//   node scripts/screenshots.mjs
//
// Setzt einen laufenden Webserver auf Port 8931 voraus:
//   python3 -m http.server 8931
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const ZIEL = "docs/screenshots";
mkdirSync(ZIEL, { recursive: true });

// Chromium formatiert <input type="date"> nach der System-Locale des
// Prozesses – die Locale des Playwright-Kontexts genügt dafür NICHT, und
// --lang allein auch nicht. Ohne LANG steht im Screenshot MM/TT/JJJJ.
const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium",
  args: ["--lang=de-DE"],
  env: { ...process.env, LANG: "de_DE.UTF-8", LC_ALL: "de_DE.UTF-8" }
});

async function schuss(name, { dunkel = false, schritte }){
  const ctx = await browser.newContext({
    viewport: { width: 412, height: 892 }, deviceScaleFactor: 2,
    colorScheme: dunkel ? "dark" : "light",
    // Ohne deutsche Locale zeigt das Datumsfeld das US-Format MM/TT/JJJJ.
    locale: "de-DE", timezoneId: "Europe/Berlin"
  });
  const page = await ctx.newPage();
  await page.addInitScript(() => localStorage.setItem("n2l_onboarding_done", "true"));
  await page.goto("http://127.0.0.1:8931/index.html");
  await page.waitForFunction(() => !!window.N2L);
  await page.evaluate(() => {
    /* Zwei eigene Kategorien, damit die Screenshots die Funktion zeigen. */
    const h = window.N2L.Kategorien.hinzufuegen("Haustier", "🐾");
    const w = window.N2L.Kategorien.hinzufuegen("Wohnung", "🏠");
    window.N2L.Daten.beispieleLaden();
    window.N2L.Daten.upsert({ titel: "Impfpass Hund", kategorien: ["gesundheit", h.id],
      datumstyp: "wiederkehrend", wiederholung: "jaehrlich",
      datum: window.N2L.Core.addTage(window.N2L.Core.heute(), 34) });
    window.N2L.Daten.upsert({ titel: "Mietvertrag Kündigungsfrist", kategorien: ["vertraege", w.id],
      datumstyp: "faellig", datum: window.N2L.Core.addTage(window.N2L.Core.heute(), 96),
      referenz: "MV-2024-118" });
  });
  await page.evaluate(() => location.reload());
  await page.waitForFunction(() => !!window.N2L);
  if (schritte) await schritte(page);
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${ZIEL}/${name}.png` });
  console.log(`${ZIEL}/${name}.png`);
  await ctx.close();
}

await schuss("01-dashboard", {});
await schuss("02-dashboard-dunkel", { dunkel: true });
await schuss("03-liste", { schritte: async p => {
  await p.click('nav.tabs button[data-tab="liste"]');
} });
await schuss("04-detail", { schritte: async p => {
  await p.click('nav.tabs button[data-tab="liste"]');
  await p.click("#liste-inhalt .row");
} });
await schuss("05-formular", { schritte: async p => {
  await p.click("#btn-neu");
  await p.fill("#f-titel", "Reisepass");
  await p.click('#f-kategorie button[data-k="ausweise"]');
  await p.click('#f-kategorie button[data-k="reisen"]');
  await p.fill("#f-datum", "2032-04-18");
} });
await schuss("07-kategorie-neu", { schritte: async p => {
  await p.click("#btn-neu");
  await p.click("#f-kat-neu");
  await p.fill("#kat-name", "Haustier");
  await p.click('#kat-emojis button[data-e="🐾"]');
} });
await schuss("06-archiv", { dunkel: true, schritte: async p => {
  await p.click('nav.tabs button[data-tab="liste"]');
  await p.click('#filter-status button[data-st="abgelaufen"]');
} });

await browser.close();
