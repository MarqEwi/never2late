// Bedienabläufe: anlegen, bearbeiten, suchen, filtern, archivieren, erneuern.
import { test, expect } from "@playwright/test";
import { appOeffnen, eintragAnlegen, inTagen } from "./helfer.mjs";

test.beforeEach(async ({ page }) => { await appOeffnen(page); });

test("Eintrag anlegen: Pflichtfelder werden geprüft, danach steht er in der Liste", async ({ page }) => {
  await page.click("#btn-neu");
  await expect(page.locator("#view-form")).toHaveClass(/active/);

  // Ohne Titel und Datum darf nicht gespeichert werden.
  await page.click("#f-speichern");
  await expect(page.locator("#f-titel-err")).toBeVisible();
  await expect(page.locator("#f-datum-err")).toBeVisible();
  await expect(page.locator("#view-form")).toHaveClass(/active/);

  await page.fill("#f-titel", "Reisepass");
  await page.click('#f-kategorie button[data-k="ausweise"]');
  await page.fill("#f-datum", inTagen(400));
  await page.click("#f-speichern");

  await expect(page.locator("#view-detail")).toHaveClass(/active/);
  await expect(page.locator("#detail-inhalt")).toContainText("Reisepass");
  await expect(page.locator("#detail-inhalt")).toContainText("Ausweise");
  await expect(page.locator("#detail-inhalt .pill")).toContainText("Aktiv");

  const anzahl = await page.evaluate(() => window.N2L.Daten.alle().length);
  expect(anzahl).toBe(1);
});

test("Eintrag überlebt einen Neustart der App", async ({ page }) => {
  await eintragAnlegen(page, { titel: "Führerschein", kategorie: "fahrzeug", datum: inTagen(500) });
  await page.reload();
  await page.waitForFunction(() => !!window.N2L);
  await expect(page.locator("#home-inhalt")).toContainText("Führerschein");
});

test("Dashboard hebt Abgelaufenes und bald Fälliges hervor", async ({ page }) => {
  await eintragAnlegen(page, { titel: "Abgelaufener Ausweis", datum: inTagen(-10) });
  await page.click('nav.tabs button[data-tab="home"]');
  await eintragAnlegen(page, { titel: "Bald faellige Karte", kategorie: "karten", datum: inTagen(5) });
  await page.click('nav.tabs button[data-tab="home"]');
  await eintragAnlegen(page, { titel: "Ferne Garantie", kategorie: "vertraege", datum: inTagen(700) });
  await page.click('nav.tabs button[data-tab="home"]');

  await expect(page.locator(".hero")).toContainText("Abgelaufen");
  await expect(page.locator(".hero")).toContainText("Abgelaufener Ausweis");
  const zahlen = await page.locator(".stat b").allTextContents();
  expect(zahlen).toEqual(["1", "1", "1"]);
  await expect(page.locator("#home-inhalt")).toContainText("Braucht Aufmerksamkeit");
  await expect(page.locator("#home-inhalt")).toContainText("Kommt später");
});

test("Suche findet Titel und Nummer", async ({ page }) => {
  await eintragAnlegen(page, { titel: "Hausrat", kategorie: "vertraege", datum: inTagen(200) });
  await page.click("#d-bearbeiten");
  await page.fill("#f-referenz", "HR-889221");
  await page.click("#f-speichern");
  await page.click('nav.tabs button[data-tab="home"]');
  await eintragAnlegen(page, { titel: "Zahnvorsorge", kategorie: "gesundheit", datum: inTagen(150) });

  await page.click('nav.tabs button[data-tab="liste"]');
  await expect(page.locator("#liste-inhalt .row")).toHaveCount(2);

  await page.fill("#such-feld", "zahn");
  await expect(page.locator("#liste-inhalt .row")).toHaveCount(1);
  await expect(page.locator("#liste-inhalt")).toContainText("Zahnvorsorge");

  await page.fill("#such-feld", "889221");
  await expect(page.locator("#liste-inhalt .row")).toHaveCount(1);
  await expect(page.locator("#liste-inhalt")).toContainText("Hausrat");

  await page.fill("#such-feld", "gibtesnicht");
  await expect(page.locator("#liste-inhalt")).toContainText("Nichts gefunden");
  await page.click("#such-clear");
  await expect(page.locator("#liste-inhalt .row")).toHaveCount(2);
});

test("Status- und Kategoriefilter greifen zusammen", async ({ page }) => {
  await eintragAnlegen(page, { titel: "Alter Ausweis", kategorie: "ausweise", datum: inTagen(-3) });
  await page.click('nav.tabs button[data-tab="home"]');
  await eintragAnlegen(page, { titel: "Neue Karte", kategorie: "karten", datum: inTagen(900) });

  await page.click('nav.tabs button[data-tab="liste"]');
  await page.click('#filter-status button[data-st="abgelaufen"]');
  await expect(page.locator("#liste-inhalt .row")).toHaveCount(1);
  await expect(page.locator("#liste-inhalt")).toContainText("Alter Ausweis");

  await page.click('#filter-status button[data-st="alle"]');
  await page.click('#filter-kategorie button[data-kat="karten"]');
  await expect(page.locator("#liste-inhalt .row")).toHaveCount(1);
  await expect(page.locator("#liste-inhalt")).toContainText("Neue Karte");
});

test("Archivieren nimmt den Eintrag aus der Standardliste, das Archiv zeigt ihn", async ({ page }) => {
  await eintragAnlegen(page, { titel: "Alte Mitgliedskarte", kategorie: "karten", datum: inTagen(-40) });
  await page.click("#d-archiv");
  await expect(page.locator("#detail-inhalt .pill")).toContainText("Archiviert");
  await expect(page.locator("#d-archiv")).toContainText("Aus Archiv");

  await page.click('nav.tabs button[data-tab="liste"]');
  await expect(page.locator("#liste-inhalt")).toContainText("Keine Einträge");

  await page.click('#filter-status button[data-st="archiviert"]');
  await expect(page.locator("#liste-inhalt .row")).toHaveCount(1);
  await expect(page.locator("#liste-inhalt")).toContainText("Alte Mitgliedskarte");

  // Zurückholen
  await page.click("#liste-inhalt .row");
  await page.click("#d-archiv");
  await expect(page.locator("#detail-inhalt .pill")).not.toContainText("Archiviert");
});

test("Erneuert setzt bei einmaligen Einträgen ein neues Datum", async ({ page }) => {
  await eintragAnlegen(page, { titel: "Personalausweis", kategorie: "ausweise", datum: inTagen(-5) });
  await expect(page.locator("#detail-inhalt .pill")).toContainText("Abgelaufen");

  await page.click("#d-erneuern");
  await expect(page.locator("#modal-erneuern")).toHaveClass(/open/);
  await page.click('#ern-quick button[data-m="120"]');
  await page.click("#ern-ok");

  await expect(page.locator("#modal-erneuern")).not.toHaveClass(/open/);
  await expect(page.locator("#detail-inhalt .pill")).toContainText("Aktiv");

  const e = await page.evaluate(() => {
    const x = window.N2L.Daten.alle()[0];
    return { datum: x.datum, erledigt: !!x.erledigtAm, historie: x.historie.length,
             soll: window.N2L.Core.addMonate(window.N2L.Core.heute(), 120) };
  });
  expect(e.datum).toBe(e.soll);
  expect(e.erledigt).toBe(true);
  expect(e.historie).toBe(1);
});

test("Erledigt springt bei wiederkehrenden Einträgen direkt in den nächsten Zyklus", async ({ page }) => {
  await eintragAnlegen(page, { titel: "Kompetenzerhalt", kategorie: "beruflich",
    datum: inTagen(-2), typ: "wiederkehrend" });
  await expect(page.locator("#d-erneuern")).toContainText("Erledigt");
  await expect(page.locator("#detail-inhalt")).toContainText("Wiederkehrend (jährlich)");

  const vorher = await page.evaluate(() => window.N2L.Daten.alle()[0].datum);
  await page.click("#d-erneuern");
  // Kein Dialog: der nächste Termin wird direkt gesetzt.
  await expect(page.locator("#modal-erneuern")).not.toHaveClass(/open/);

  const nachher = await page.evaluate(() => {
    const x = window.N2L.Daten.alle()[0];
    return { datum: x.datum, tage: window.N2L.Core.tageBis(x.datum) };
  });
  expect(nachher.datum).not.toBe(vorher);
  expect(nachher.tage).toBeGreaterThan(0);
  await expect(page.locator("#detail-inhalt .pill")).toContainText("Aktiv");
});

test("Erinnerungen lassen sich ergänzen, abschalten und entfernen", async ({ page }) => {
  await page.click("#btn-neu");
  await expect(page.locator("#f-remlist li")).toHaveCount(3);

  await page.fill("#f-rem-zahl", "2");
  await page.selectOption("#f-rem-einheit", "7");     // 2 Wochen
  await page.click("#f-rem-add");
  await expect(page.locator("#f-remlist li")).toHaveCount(4);
  await expect(page.locator("#f-remlist")).toContainText("2 Wochen vorher");

  // Die 3-Monats-Erinnerung abschalten und die 1-Tages-Erinnerung löschen.
  await page.locator('#f-remlist input[data-i="0"]').uncheck();
  await page.locator('#f-remlist button[data-del="3"]').click();
  await expect(page.locator("#f-remlist li")).toHaveCount(3);

  await page.fill("#f-titel", "Testeintrag");
  await page.click('#f-kategorie button[data-k="sonstiges"]');
  await page.fill("#f-datum", inTagen(300));
  await page.click("#f-speichern");

  const rem = await page.evaluate(() => window.N2L.Daten.alle()[0].erinnerungen);
  expect(rem).toEqual([{ tage: 90, an: false }, { tage: 14, an: true }, { tage: 7, an: true }]);
  await expect(page.locator("#detail-inhalt")).toContainText("2 Wochen vorher, 1 Woche vorher");
});

test("Zurück führt Schritt für Schritt zurück zur Startseite", async ({ page }) => {
  await eintragAnlegen(page, { titel: "Testeintrag", datum: inTagen(100) });
  await page.click("#d-bearbeiten");
  await expect(page.locator("#view-form")).toHaveClass(/active/);

  await page.click("#btn-back");
  await expect(page.locator("#view-detail")).toHaveClass(/active/);
  await page.click("#btn-back");
  await expect(page.locator("#view-home")).toHaveClass(/active/);
  await expect(page.locator("#btn-back")).toBeHidden();
});

test("Löschen entfernt den Eintrag und kehrt zur Übersicht zurück", async ({ page }) => {
  page.on("dialog", d => d.accept());
  await eintragAnlegen(page, { titel: "Weg damit", datum: inTagen(100) });
  await page.click("#d-bearbeiten");
  await page.click("#f-loeschen");

  await expect(page.locator("#view-home")).toHaveClass(/active/);
  await expect(page.locator("#home-inhalt")).toContainText("Noch nichts erfasst");
  expect(await page.evaluate(() => window.N2L.Daten.alle().length)).toBe(0);
});

test("Sicherung schreibt und liest alle Einträge zurück", async ({ page }) => {
  await eintragAnlegen(page, { titel: "Gesicherter Eintrag", kategorie: "reisen", datum: inTagen(250) });

  const sicherung = await page.evaluate(() => JSON.stringify(window.N2L.Daten.exportObjekt()));
  expect(JSON.parse(sicherung).eintraege).toHaveLength(1);

  await page.evaluate(() => window.N2L.Daten.alleLoeschen());
  await page.evaluate(s => window.N2L.Daten.importObjekt(JSON.parse(s)), sicherung);
  await page.reload();
  await page.waitForFunction(() => !!window.N2L);
  await expect(page.locator("#home-inhalt")).toContainText("Gesicherter Eintrag");
});

test("Einstellung „Bald fällig ab“ verschiebt den Status", async ({ page }) => {
  // Ohne aktive Erinnerungen zählt der Schwellwert aus den Einstellungen.
  await page.evaluate(t => {
    window.N2L.Daten.upsert({ titel: "Ohne Erinnerung", kategorie: "sonstiges", datum: t, erinnerungen: [] });
  }, inTagen(20));
  await page.evaluate(() => { window.N2L.Einst.set("vorwarnTage", 7); location.reload(); });
  await page.waitForFunction(() => !!window.N2L);
  await expect(page.locator("#home-inhalt .pill").first()).toContainText("Aktiv");

  await page.click("#btn-settings");
  await page.selectOption("#s-vorwarn", "30");
  await page.click('[data-close="modal-settings"]');
  await expect(page.locator("#home-inhalt .pill").first()).toContainText("Bald fällig");
});
