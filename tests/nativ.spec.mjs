// Native Zweige: Diese Fehlerklasse ist im Browser unsichtbar, weil die
// Web-Wege (a.download) klaglos funktionieren, während die WebView sie
// still ignoriert. Deshalb wird hier die App-Umgebung nachgestellt und
// geprüft, dass die Capacitor-Plugins wirklich aufgerufen werden.
import { test, expect } from "@playwright/test";
import { appOeffnen, eintragAnlegen, capacitorMock, inTagen } from "./helfer.mjs";

test.beforeEach(async ({ page }) => {
  await appOeffnen(page, { vorher: capacitorMock });
});

test("Kalender-Export schreibt über Filesystem und teilt über Share", async ({ page }) => {
  await eintragAnlegen(page, { titel: "Reisepass", kategorie: "ausweise", datum: "2027-05-14" });
  await page.click("#d-kalender");
  await page.waitForFunction(() => window.__calls.some(c => c.name === "Share.share"));

  const calls = await page.evaluate(() => window.__calls);
  const write = calls.find(c => c.name === "Filesystem.writeFile");
  const uri = calls.find(c => c.name === "Filesystem.getUri");
  const share = calls.find(c => c.name === "Share.share");

  expect(write).toBeTruthy();
  expect(write.arg.path).toBe("never2late-reisepass.ics");
  // Ohne Bundler gibt es kein Directory-Enum: der String "CACHE" ist Pflicht.
  expect(write.arg.directory).toBe("CACHE");
  expect(uri.arg.directory).toBe("CACHE");
  expect(share.arg.files).toEqual(["file:///cache/never2late-reisepass.ics"]);

  const ics = await page.evaluate(d => decodeURIComponent(escape(atob(d))), write.arg.data);
  expect(ics).toContain("BEGIN:VCALENDAR");
  expect(ics).toContain("DTSTART;VALUE=DATE:20270514");
  expect(ics).toContain("SUMMARY:Reisepass – läuft ab");
});

test("Datensicherung läuft in der App über das Teilen-Menü", async ({ page }) => {
  await eintragAnlegen(page, { titel: "Testeintrag", datum: inTagen(120) });
  await page.click("#btn-settings");
  await page.click("#s-export");
  await page.waitForFunction(() => window.__calls.some(c => c.name === "Share.share"));

  const write = await page.evaluate(() => window.__calls.find(c => c.name === "Filesystem.writeFile"));
  expect(write.arg.path).toMatch(/^never2late-sicherung-\d{8}\.json$/);
  expect(write.arg.directory).toBe("CACHE");

  const json = await page.evaluate(d => JSON.parse(decodeURIComponent(escape(atob(d)))), write.arg.data);
  expect(json.app).toBe("Never2Late");
  expect(json.eintraege).toHaveLength(1);
});

test("Erinnerungen werden beim Speichern wirklich eingeplant", async ({ page }) => {
  await eintragAnlegen(page, { titel: "Personalausweis", kategorie: "ausweise", datum: inTagen(200) });
  await page.waitForFunction(() => (window.__geplant || []).length > 0);

  const geplant = await page.evaluate(() => window.__geplant);
  expect(geplant).toHaveLength(3);                       // 90, 7 und 1 Tag vorher
  expect(geplant[0].title).toBe("Personalausweis läuft in 90 Tagen ab");
  expect(geplant[0].body).toContain("Ausweise · Gültig bis");
  geplant.forEach(n => {
    expect(Number.isInteger(n.id)).toBe(true);
    expect(n.id).toBeGreaterThan(0);
    expect(new Date(n.at).getTime()).toBeGreaterThan(Date.now());
  });
  // Alle Kennungen müssen verschieden sein, sonst überschreiben sie sich.
  expect(new Set(geplant.map(n => n.id)).size).toBe(3);
});

test("Neuplanen verwirft alte Erinnerungen und bleibt nach Neustart konsistent", async ({ page }) => {
  await eintragAnlegen(page, { titel: "Erster", kategorie: "ausweise", datum: inTagen(200) });
  await page.waitForFunction(() => (window.__geplant || []).length === 3);
  const vorher = await page.evaluate(() => window.__geplant.map(n => ({ id: n.id, at: n.at })));

  // Datum ändern: die alten Zeitpunkte müssen verschwinden.
  await page.click("#d-bearbeiten");
  await page.fill("#f-datum", inTagen(400));
  await page.click("#f-speichern");
  await page.waitForFunction(v => window.__geplant.length === 3 && window.__geplant[0].at !== v, vorher[0].at);

  const abbruch = await page.evaluate(() => window.__calls.filter(c => c.name === "LocalNotifications.cancel"));
  expect(abbruch.length).toBeGreaterThan(0);

  // Die Kennungen bleiben absichtlich gleich: sie hängen nur an Eintrag und
  // Vorlaufzeit. Dadurch ersetzt eine Neuplanung den alten Alarm, statt einen
  // zweiten danebenzulegen.
  const nachId = await page.evaluate(() => window.__geplant.map(n => n.id));
  expect(nachId).toEqual(vorher.map(n => n.id));

  // Nach einem Neustart wird alles frisch aus dem Speicher aufgebaut.
  await page.reload();
  await page.waitForFunction(() => !!window.N2L && (window.__geplant || []).length === 3);
  const nachher = await page.evaluate(() => window.__geplant.map(n => n.title));
  expect(nachher[2]).toBe("Erster läuft morgen ab");
});

test("Archivierte Einträge und abgeschaltete Erinnerungen erzeugen keine Benachrichtigung", async ({ page }) => {
  await eintragAnlegen(page, { titel: "Archivkandidat", kategorie: "karten", datum: inTagen(200) });
  await page.waitForFunction(() => (window.__geplant || []).length === 3);

  await page.click("#d-archiv");
  await page.waitForFunction(() => (window.__geplant || []).length === 0);

  await page.click("#d-archiv");                       // zurückholen
  await page.waitForFunction(() => (window.__geplant || []).length === 3);

  await page.click("#d-bearbeiten");
  // Der Schalter versteckt sein <input>; geklickt wird der sichtbare Regler.
  await page.click("#f-rem-an + .track");
  await expect(page.locator("#f-rem-an")).not.toBeChecked();
  await page.click("#f-speichern");
  await page.waitForFunction(() => (window.__geplant || []).length === 0);
});

test("Testbenachrichtigung wird geplant und überlebt eine Neuplanung", async ({ page }) => {
  await eintragAnlegen(page, { titel: "Irgendwas", kategorie: "karten", datum: inTagen(200) });
  await page.waitForFunction(() => (window.__geplant || []).length === 3);

  await page.click("#btn-settings");
  await page.click("#s-notif-test");
  await page.waitForFunction(() => (window.__geplant || []).some(n => n.id === 999000001));

  const probe = await page.evaluate(() => window.__geplant.find(n => n.id === 999000001));
  expect(probe.title).toBe("Testbenachrichtigung");
  // Rund zehn Sekunden in der Zukunft
  const inMs = new Date(probe.at).getTime() - Date.now();
  expect(inMs).toBeGreaterThan(3000);
  expect(inMs).toBeLessThan(20000);

  // Eine Neuplanung darf die Probe nicht wegräumen, sonst käme sie nie an.
  await page.evaluate(() => window.N2L.Erinnerungen.neuPlanen());
  await page.waitForTimeout(300);
  const nochDa = await page.evaluate(() =>
    window.__calls.filter(c => c.name === "LocalNotifications.cancel")
      .every(c => !c.arg.ids || c.arg.ids.indexOf(999000001) < 0));
  expect(nochDa).toBe(true);
});

test("Der Planungsstand wird beim System abgefragt und angezeigt", async ({ page }) => {
  await eintragAnlegen(page, { titel: "Reisepass", kategorie: "ausweise", datum: inTagen(300) });
  await page.waitForFunction(() => (window.__geplant || []).length === 3);

  await page.click("#btn-settings");
  await expect(page.locator("#s-notif-stand")).toContainText("3 Erinnerungen vorgemerkt");
  await expect(page.locator("#s-notif-stand")).toContainText("nächste am");

  // Meldet das System nichts, muss die App das offen sagen statt zu schweigen.
  await page.evaluate(() => {
    window.Capacitor.Plugins.LocalNotifications.getPending = async () => ({ notifications: [] });
  });
  await page.evaluate(() => window.N2L.Erinnerungen.standAbfragen());
  await expect(page.locator("#s-notif-stand")).toContainText("keine Erinnerung vorgemerkt");
});

test("Zurück-Taste schließt Fenster, geht zurück und verlangt zweimaliges Drücken", async ({ page }) => {
  await eintragAnlegen(page, { titel: "Testeintrag", datum: inTagen(100) });
  const zurueck = () => page.evaluate(() => window.__listener.backButton());

  // 1. offenes Fenster schließen
  await page.click("#btn-settings");
  await expect(page.locator("#modal-settings")).toHaveClass(/open/);
  await zurueck();
  await expect(page.locator("#modal-settings")).not.toHaveClass(/open/);

  // 2. eine Ebene zurück (Detail -> Start)
  await expect(page.locator("#view-detail")).toHaveClass(/active/);
  await zurueck();
  await expect(page.locator("#view-home")).toHaveClass(/active/);

  // 3. erst Hinweis, dann Beenden
  await zurueck();
  await expect(page.locator("#toast")).toHaveClass(/show/);
  expect(await page.evaluate(() => window.__calls.some(c => c.name === "App.exitApp"))).toBe(false);
  await zurueck();
  expect(await page.evaluate(() => window.__calls.some(c => c.name === "App.exitApp"))).toBe(true);
});

test("Die App nutzt keine Plugin-Registrierung ohne Bundler", async ({ page }) => {
  // Capacitor.registerPlugin existiert ohne Bundler nicht; ein Aufruf würde
  // das betroffene Modul still komplett ausfallen lassen.
  const quelle = await page.evaluate(async () => (await (await fetch("index.html")).text()));
  expect(quelle).not.toMatch(/registerPlugin\s*\(/);
  expect(quelle).toContain("window.Capacitor.Plugins");
});
