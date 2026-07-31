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

test("Ein Eintrag lässt sich mehreren Kategorien zuordnen", async ({ page }) => {
  await page.click("#btn-neu");
  await page.fill("#f-titel", "Reisepass");
  await page.click('#f-kategorie button[data-k="ausweise"]');
  await page.click('#f-kategorie button[data-k="reisen"]');
  await expect(page.locator('#f-kategorie button[data-k="ausweise"]')).toHaveClass(/active/);
  await expect(page.locator('#f-kategorie button[data-k="reisen"]')).toHaveClass(/active/);

  // Nochmal antippen wählt wieder ab
  await page.click('#f-kategorie button[data-k="reisen"]');
  await expect(page.locator('#f-kategorie button[data-k="reisen"]')).not.toHaveClass(/active/);
  await page.click('#f-kategorie button[data-k="reisen"]');

  await page.fill("#f-datum", inTagen(600));
  await page.click("#f-speichern");

  expect(await page.evaluate(() => window.N2L.Daten.alle()[0].kategorien)).toEqual(["ausweise", "reisen"]);
  await expect(page.locator("#detail-inhalt .katchip")).toHaveCount(2);
  await expect(page.locator("#detail-inhalt")).toContainText("Ausweise");
  await expect(page.locator("#detail-inhalt")).toContainText("Reisen");

  // Die Zeile zeigt einen Zähler für die weiteren Kategorien
  // (auf die Liste eingegrenzt – das Dashboard rendert dieselben Zeilen)
  await page.click('nav.tabs button[data-tab="liste"]');
  await expect(page.locator("#liste-inhalt .row .kat .mehr")).toHaveText("+1");
  await expect(page.locator("#liste-inhalt .row .sub")).toContainText("Ausweise, Reisen");
});

test("Ohne Kategorie lässt sich nicht speichern", async ({ page }) => {
  await page.click("#btn-neu");
  await page.fill("#f-titel", "Ohne Kategorie");
  await page.fill("#f-datum", inTagen(100));
  await page.click("#f-speichern");
  await expect(page.locator("#view-form")).toHaveClass(/active/);
  await expect(page.locator("#toast")).toContainText("mindestens eine Kategorie");
  expect(await page.evaluate(() => window.N2L.Daten.alle().length)).toBe(0);
});

test("Eigene Kategorie im Formular anlegen und direkt verwenden", async ({ page }) => {
  await page.click("#btn-neu");
  await page.click("#f-kat-neu");
  await expect(page.locator("#modal-kategorie")).toHaveClass(/open/);

  await page.fill("#kat-name", "Haustier");
  await page.click('#kat-emojis button[data-e="🐾"]');
  await expect(page.locator("#kat-emoji-gross")).toHaveText("🐾");
  await page.click("#kat-ok");
  await expect(page.locator("#modal-kategorie")).not.toHaveClass(/open/);

  // Die neue Kategorie steht im Raster und ist schon ausgewählt
  const neu = page.locator("#f-kategorie button.active", { hasText: "Haustier" });
  await expect(neu).toHaveCount(1);

  await page.fill("#f-titel", "Impfpass Hund");
  await page.fill("#f-datum", inTagen(300));
  await page.click("#f-speichern");

  const e = await page.evaluate(() => window.N2L.Daten.alle()[0]);
  expect(e.kategorien).toHaveLength(1);
  expect(e.kategorien[0]).toMatch(/^eigen-haustier$/);
  await expect(page.locator("#detail-inhalt .katchip")).toContainText("Haustier");
});

test("Ein eingefügtes Emoji wird übernommen, auch eine Flagge", async ({ page }) => {
  await page.click("#btn-settings");
  await page.click("#s-kat-neu");
  await page.fill("#kat-name", "Urlaub Italien");
  // Ein Zeichen, das nicht im Raster steht – direkt ins Feld eingefügt
  await page.fill("#kat-emoji", "🇮🇹");
  await page.locator("#kat-emoji").blur();
  await expect(page.locator("#kat-emoji-gross")).toHaveText("🇮🇹");
  await expect(page.locator("#kat-emoji-warn")).toBeHidden();
  await page.click("#kat-ok");

  const k = await page.evaluate(() => window.N2L.Core.eigene[0]);
  expect(k.emoji).toBe("🇮🇹");
  await expect(page.locator("#s-kategorien")).toContainText("Urlaub Italien");
});

test("Ein Symbol, das das Gerät nicht kennt, wird angemerkt", async ({ page }) => {
  await page.click("#btn-settings");
  await page.click("#s-kat-neu");
  await page.fill("#kat-emoji", "\u{10FFFD}");     // garantiert unbelegt
  await page.locator("#kat-emoji").blur();
  await expect(page.locator("#kat-emoji-warn")).toBeVisible();

  // Nach der Korrektur verschwindet der Hinweis wieder
  await page.fill("#kat-emoji", "🏠");
  await page.locator("#kat-emoji").blur();
  await expect(page.locator("#kat-emoji-warn")).toBeHidden();
});

test("Doppelter Kategoriename wird abgelehnt", async ({ page }) => {
  await page.click("#btn-settings");
  await page.click("#s-kat-neu");
  await page.fill("#kat-name", "Ausweise");
  await page.click("#kat-ok");
  await expect(page.locator("#kat-err")).toBeVisible();
  await expect(page.locator("#kat-err")).toContainText("schon eine Kategorie");
  await expect(page.locator("#modal-kategorie")).toHaveClass(/open/);
  expect(await page.evaluate(() => window.N2L.Core.eigene.length)).toBe(0);
});

test("Eigene Kategorie filtern, bearbeiten und löschen", async ({ page }) => {
  page.on("dialog", d => d.accept());
  await page.evaluate(() => {
    const k = window.N2L.Kategorien.hinzufuegen("Wohnung", "🏠");
    window.N2L.Daten.upsert({ titel: "Mietvertrag", kategorien: ["vertraege", k.id],
      datum: "2028-01-31" });
    window.N2L.Daten.upsert({ titel: "Reisepass", kategorien: ["ausweise"], datum: "2029-05-05" });
  });
  await page.reload();
  await page.waitForFunction(() => !!window.N2L);

  // Der Filter kennt die eigene Kategorie
  await page.click('nav.tabs button[data-tab="liste"]');
  const chip = page.locator("#filter-kategorie button", { hasText: "Wohnung" });
  await expect(chip).toHaveCount(1);
  await chip.click();
  await expect(page.locator("#liste-inhalt .row")).toHaveCount(1);
  await expect(page.locator("#liste-inhalt")).toContainText("Mietvertrag");

  // Umbenennen in den Einstellungen
  await page.click("#btn-settings");
  await expect(page.locator("#s-kategorien")).toContainText("1 Eintrag");
  await page.click("#s-kategorien [data-bearbeiten]");
  await page.fill("#kat-name", "Wohnen");
  await page.click("#kat-ok");
  await expect(page.locator("#s-kategorien")).toContainText("Wohnen");

  // Löschen zieht den Eintrag mit, ohne ihn zu verlieren
  await page.click("#s-kategorien [data-loeschen]");
  await expect(page.locator("#s-kategorien")).toContainText("Noch keine eigenen Kategorien");
  await page.click('[data-close="modal-settings"]');

  const e = await page.evaluate(() =>
    window.N2L.Daten.alle().find(x => x.titel === "Mietvertrag").kategorien);
  expect(e).toEqual(["vertraege"]);
  expect(await page.evaluate(() => window.N2L.Daten.alle().length)).toBe(2);
});

test("Sicherung nimmt eigene Kategorien mit", async ({ page }) => {
  const sicherung = await page.evaluate(() => {
    const k = window.N2L.Kategorien.hinzufuegen("Studium", "🎓");
    window.N2L.Daten.upsert({ titel: "Semesterbeitrag", kategorien: [k.id], datum: "2027-04-01" });
    return JSON.stringify(window.N2L.Daten.exportObjekt());
  });
  expect(JSON.parse(sicherung).kategorien).toHaveLength(1);

  // Alles löschen und aus der Sicherung wiederherstellen
  await page.evaluate(() => { window.N2L.Daten.alleLoeschen(); window.N2L.Kategorien.alleLoeschen(); });
  await page.evaluate(s => window.N2L.Daten.importObjekt(JSON.parse(s)), sicherung);
  await page.reload();
  await page.waitForFunction(() => !!window.N2L);

  const r = await page.evaluate(() => ({
    eigene: window.N2L.Core.eigene.map(k => k.label + k.emoji),
    kats: window.N2L.Daten.alle()[0].kategorien
  }));
  expect(r.eigene).toEqual(["Studium🎓"]);
  expect(r.kats[0]).toMatch(/^eigen-studium$/);   // nicht auf "sonstiges" zurückgefallen
  await expect(page.locator("#home-inhalt")).toContainText("Semesterbeitrag");
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

test("Browser-Zurück schließt Fenster, geht zurück und warnt vorm Verlassen", async ({ page }) => {
  await eintragAnlegen(page, { titel: "Testeintrag", datum: inTagen(100) });

  // 1. offenes Fenster schließen – die Seite bleibt stehen
  await page.click("#btn-settings");
  await expect(page.locator("#modal-settings")).toHaveClass(/open/);
  await page.goBack();
  await expect(page.locator("#modal-settings")).not.toHaveClass(/open/);
  await expect(page.locator("#view-detail")).toHaveClass(/active/);

  // 2. eine Ebene zurück (Detail -> Start)
  await page.goBack();
  await expect(page.locator("#view-home")).toHaveClass(/active/);

  // 3. nichts mehr offen: erst der Hinweis, die App läuft weiter
  await page.goBack();
  await expect(page.locator("#toast")).toHaveClass(/show/);
  await expect(page.locator("#toast")).toContainText("erneut");
  await expect(page.locator("#view-home")).toHaveClass(/active/);
  expect(await page.evaluate(() => !!window.N2L)).toBe(true);
});

test("Browser-Zurück schließt gestapelte Fenster einzeln", async ({ page }) => {
  await page.click("#btn-settings");
  await page.click("#s-kat-neu");
  await expect(page.locator("#modal-kategorie")).toHaveClass(/open/);

  // Der Kategorie-Dialog liegt über den Einstellungen: erst er, dann die.
  await page.goBack();
  await expect(page.locator("#modal-kategorie")).not.toHaveClass(/open/);
  await expect(page.locator("#modal-settings")).toHaveClass(/open/);

  await page.goBack();
  await expect(page.locator("#modal-settings")).not.toHaveClass(/open/);
  await expect(page.locator("#view-home")).toHaveClass(/active/);
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
