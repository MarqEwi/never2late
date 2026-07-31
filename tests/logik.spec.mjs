// Fachlogik-Tests: Status, Datum, Wiederholung, Erinnerungen.
// Der Kern (window.N2L.Core) ist bewusst DOM-frei, deshalb lässt er sich
// hier direkt und ohne Oberfläche prüfen.
import { test, expect } from "@playwright/test";
import { appOeffnen } from "./helfer.mjs";

test.beforeEach(async ({ page }) => { await appOeffnen(page); });

test("Datumshilfen rechnen tagesgenau und kappen Monatsenden", async ({ page }) => {
  const r = await page.evaluate(() => {
    const C = window.N2L.Core;
    return {
      diff: C.tageBis("2026-03-10", "2026-03-01"),
      negativ: C.tageBis("2026-02-27", "2026-03-01"),
      ueberJahr: C.tageBis("2027-01-01", "2026-01-01"),
      addTage: C.addTage("2026-02-27", 3),
      schaltjahr: C.addTage("2028-02-28", 1),
      monatsende: C.addMonate("2026-01-31", 1),
      jahr: C.addMonate("2026-05-14", 12),
      halb: C.addMonate("2026-08-31", 6),
      ungueltig: C.istIso("2026-02-31"),
      gueltig: C.istIso("2026-02-28"),
      quatsch: C.istIso("14.05.2026")
    };
  });
  expect(r.diff).toBe(9);
  expect(r.negativ).toBe(-2);
  expect(r.ueberJahr).toBe(365);
  expect(r.addTage).toBe("2026-03-02");
  expect(r.schaltjahr).toBe("2028-02-29");
  expect(r.monatsende).toBe("2026-02-28");     // 31.01. + 1 Monat = 28.02.
  expect(r.jahr).toBe("2027-05-14");
  expect(r.halb).toBe("2027-02-28");
  expect(r.ungueltig).toBe(false);
  expect(r.gueltig).toBe(true);
  expect(r.quatsch).toBe(false);
});

test("Status: aktiv, bald fällig, abgelaufen, archiviert", async ({ page }) => {
  const r = await page.evaluate(() => {
    const C = window.N2L.Core;
    const heute = "2026-06-15";
    const bau = (datum, extra) => C.normalisieren(Object.assign({ titel: "X", kategorien: ["ausweise"], datum }, extra));
    return {
      weit:        C.status(bau("2027-06-15"), heute),
      knappDrueber: C.status(bau("2026-09-14"), heute),  // 91 Tage: noch keine Erinnerung
      genauGrenze: C.status(bau("2026-09-13"), heute),   // 90 Tage = größte aktive Erinnerung
      knappDrin:   C.status(bau("2026-09-12"), heute),
      morgen:      C.status(bau("2026-06-16"), heute),
      heuteNoch:   C.status(bau("2026-06-15"), heute),   // heute ist noch nicht abgelaufen
      gestern:     C.status(bau("2026-06-14"), heute),
      archiv:      C.status(bau("2026-06-14", { archiviert: true }), heute),
      ohneRem:     C.status(bau("2026-08-01", { erinnerungen: [] }), heute, 30),
      ohneRemNah:  C.status(bau("2026-07-01", { erinnerungen: [] }), heute, 30)
    };
  });
  expect(r.weit).toBe("aktiv");
  expect(r.knappDrueber).toBe("aktiv");
  // Genau am Tag der ersten Erinnerung gilt der Eintrag als "bald fällig" –
  // Meldung und Status springen damit gemeinsam um.
  expect(r.genauGrenze).toBe("bald");
  expect(r.knappDrin).toBe("bald");
  expect(r.morgen).toBe("bald");
  expect(r.heuteNoch).toBe("bald");
  expect(r.gestern).toBe("abgelaufen");
  expect(r.archiv).toBe("archiviert");
  expect(r.ohneRem).toBe("aktiv");         // 47 Tage > Fallback 30
  expect(r.ohneRemNah).toBe("bald");       // 16 Tage <= Fallback 30
});

test("Wiederkehrende Termine rollen erst beim Erledigen weiter", async ({ page }) => {
  const r = await page.evaluate(() => {
    const C = window.N2L.Core;
    const bau = (datum, wdh) => C.normalisieren({ titel: "Nachweis", kategorie: "beruflich",
      datumstyp: "wiederkehrend", datum, wiederholung: wdh });
    return {
      // Termin liegt 2 Jahre zurück: der nächste Zyklus muss in der Zukunft
      // liegen, aber den Kalendertag behalten.
      versaeumt: C.naechstesDatum(bau("2024-03-20", "jaehrlich"), "2026-06-15"),
      jaehrlich: C.naechstesDatum(bau("2026-08-01", "jaehrlich"), "2026-06-15"),
      halb:      C.naechstesDatum(bau("2026-05-31", "halbjaehrlich"), "2026-06-15"),
      monat:     C.naechstesDatum(bau("2026-06-10", "monatlich"), "2026-06-15"),
      einmalig:  C.naechstesDatum(C.normalisieren({ titel: "Ausweis", kategorien: ["ausweise"],
                   datumstyp: "ablauf", datum: "2026-06-10" }), "2026-06-15"),
      // Ein überfälliger wiederkehrender Eintrag bleibt "abgelaufen".
      status:    C.status(bau("2026-06-01", "jaehrlich"), "2026-06-15")
    };
  });
  expect(r.versaeumt).toBe("2027-03-20");
  expect(r.jaehrlich).toBe("2027-08-01");
  expect(r.halb).toBe("2026-11-30");
  expect(r.monat).toBe("2026-07-10");
  expect(r.einmalig).toBe(null);
  expect(r.status).toBe("abgelaufen");
});

test("Erinnerungen: Standardwerte, Zeitpunkte und Meldungstexte", async ({ page }) => {
  const r = await page.evaluate(() => {
    const C = window.N2L.Core;
    const e = C.normalisieren({ titel: "Personalausweis", kategorien: ["ausweise"], datum: "2026-06-15" });
    // "Jetzt" liegt weit vor allen Erinnerungen, damit alle als künftig gelten.
    const t = C.termine(e, new Date(2026, 0, 1, 12, 0, 0));
    const aus = C.termine(C.normalisieren({ titel: "X", kategorien: ["ausweise"],
      datum: "2026-06-15", erinnerungenAn: false }), new Date(2026, 0, 1));
    return {
      standard: e.erinnerungen.map(x => x.tage),
      anzahl: t.length,
      kuenftig: t.every(x => x.kuenftig),
      // 1 Tag vorher = 14.06.2026, 09:00 Ortszeit
      letzter: t[t.length - 1].at.getFullYear() + "-" + (t[t.length - 1].at.getMonth() + 1)
        + "-" + t[t.length - 1].at.getDate() + " " + t[t.length - 1].at.getHours(),
      ausgeschaltet: aus.length,
      meldung7: C.meldung(e, 7),
      meldung1: C.meldung(e, 1),
      meldung0: C.meldung(e, 0),
      faellig: C.meldung(C.normalisieren({ titel: "TÜV", kategorie: "fahrzeug",
        datumstyp: "faellig", datum: "2026-06-15" }), 7),
      label90: C.erinnerungLabel(90),
      label7: C.erinnerungLabel(7),
      label5: C.erinnerungLabel(5),
      // Gleiche Eingabe muss immer dieselbe Kennung ergeben (Neuplanen!)
      idStabil: C.notifId("abc", 7) === C.notifId("abc", 7),
      idVerschieden: C.notifId("abc", 7) !== C.notifId("abc", 1),
      idPositiv: C.notifId("abc", 7) > 0 && C.notifId("abc", 7) < 2147483647
    };
  });
  expect(r.standard).toEqual([90, 7, 1]);
  expect(r.anzahl).toBe(3);
  expect(r.kuenftig).toBe(true);
  expect(r.letzter).toBe("2026-6-14 9");
  expect(r.ausgeschaltet).toBe(0);
  expect(r.meldung7.titel).toBe("Personalausweis läuft in 7 Tagen ab");
  expect(r.meldung1.titel).toBe("Personalausweis läuft morgen ab");
  expect(r.meldung0.titel).toBe("Personalausweis läuft heute ab");
  expect(r.meldung7.text).toBe("Ausweise · Gültig bis 15.06.2026");
  expect(r.faellig.titel).toBe("TÜV ist in 7 Tagen fällig");
  expect(r.label90).toBe("3 Monate vorher");
  expect(r.label7).toBe("1 Woche vorher");
  expect(r.label5).toBe("5 Tage vorher");
  expect(r.idStabil).toBe(true);
  expect(r.idVerschieden).toBe(true);
  expect(r.idPositiv).toBe(true);
});

test("Vergangene Erinnerungen werden nicht mehr eingeplant", async ({ page }) => {
  const kuenftig = await page.evaluate(() => {
    const C = window.N2L.Core;
    const e = C.normalisieren({ titel: "X", kategorien: ["ausweise"], datum: "2026-06-15" });
    // "Jetzt" liegt zwischen der 3-Monats- und der 1-Wochen-Erinnerung.
    return C.termine(e, new Date(2026, 5, 1, 12, 0, 0)).map(t => t.kuenftig);
  });
  expect(kuenftig).toEqual([false, true, true]);
});

test("Sortierung stellt das Dringendste nach vorn", async ({ page }) => {
  const titel = await page.evaluate(() => {
    const C = window.N2L.Core;
    const heute = "2026-06-15";
    const roh = [
      { titel: "Weit weg", kategorien: ["ausweise"], datum: "2028-01-01" },
      { titel: "Lange abgelaufen", kategorien: ["ausweise"], datum: "2025-01-01" },
      { titel: "Gerade abgelaufen", kategorien: ["ausweise"], datum: "2026-06-10" },
      { titel: "Bald", kategorien: ["ausweise"], datum: "2026-07-01" },
      { titel: "Archiviert", kategorien: ["ausweise"], datum: "2026-06-01", archiviert: true }
    ].map(x => C.normalisieren(x));
    return C.sortieren(roh, heute, 30).map(e => e.titel);
  });
  expect(titel).toEqual(["Gerade abgelaufen", "Lange abgelaufen", "Bald", "Weit weg", "Archiviert"]);
});

test("Normalisieren härtet fehlerhafte Daten ab", async ({ page }) => {
  const r = await page.evaluate(() => {
    const C = window.N2L.Core;
    const a = C.normalisieren({ titel: "  Test  ", kategorie: "gibtsnicht", datumstyp: "quatsch",
      datum: "kein datum", wiederholung: "taeglich",
      erinnerungen: [{ tage: 7, an: true }, { tage: 7, an: false }, { tage: "abc" }, { tage: -5, an: true }] });
    // Wiederkehrend ohne Zyklus bekommt automatisch "jährlich" ...
    const b = C.normalisieren({ titel: "W", kategorie: "beruflich", datumstyp: "wiederkehrend",
      datum: "2026-01-01", wiederholung: "keine" });
    // ... und ein einmaliger Eintrag verliert einen versehentlichen Zyklus.
    const c = C.normalisieren({ titel: "E", kategorie: "beruflich", datumstyp: "ablauf",
      datum: "2026-01-01", wiederholung: "jaehrlich" });
    return {
      titel: a.titel, kategorien: a.kategorien, typ: a.datumstyp,
      datumIstHeute: a.datum === C.heute(),
      remTage: a.erinnerungen.map(r => r.tage),
      idVorhanden: typeof a.id === "string" && a.id.length > 3,
      wdhB: b.wiederholung, wdhC: c.wiederholung
    };
  });
  expect(r.titel).toBe("Test");
  expect(r.kategorien).toEqual(["sonstiges"]);
  expect(r.typ).toBe("ablauf");
  expect(r.datumIstHeute).toBe(true);
  expect(r.remTage).toEqual([7, 0]);        // Duplikat raus, "abc" raus, -5 auf 0 begrenzt
  expect(r.idVorhanden).toBe(true);
  expect(r.wdhB).toBe("jaehrlich");
  expect(r.wdhC).toBe("keine");
});

test("Kategorien: Mehrfachzuordnung, Migration und Abhärtung", async ({ page }) => {
  const r = await page.evaluate(() => {
    const C = window.N2L.Core;
    const bau = x => C.normalisieren(Object.assign({ titel: "X", datum: "2026-06-15" }, x));
    return {
      // Schema 2: mehrere Kategorien
      mehrere: bau({ kategorien: ["ausweise", "reisen"] }).kategorien,
      // Schema 1: das alte Einzelfeld wird übernommen
      migriert: bau({ kategorie: "fahrzeug" }).kategorien,
      // Doppelte und unbekannte fliegen raus
      bereinigt: bau({ kategorien: ["karten", "karten", "gibtsnicht"] }).kategorien,
      // Ohne brauchbare Angabe bleibt "Sonstiges"
      leer: bau({ kategorien: [] }).kategorien,
      nurMuell: bau({ kategorien: ["gibtsnicht"] }).kategorien,
      // Anzeige: Reihenfolge folgt der Gesamtliste, nicht der Eingabe
      labels: C.katLabels(bau({ kategorien: ["reisen", "ausweise"] })),
      objekte: C.kategorienVon(bau({ kategorien: ["reisen", "ausweise"] })).map(k => k.id),
      // Meldungstext nennt alle Kategorien
      meldung: C.meldung(bau({ titel: "Reisepass", kategorien: ["ausweise", "reisen"] }), 7).text
    };
  });
  expect(r.mehrere).toEqual(["ausweise", "reisen"]);
  expect(r.migriert).toEqual(["fahrzeug"]);
  expect(r.bereinigt).toEqual(["karten"]);
  expect(r.leer).toEqual(["sonstiges"]);
  expect(r.nurMuell).toEqual(["sonstiges"]);
  expect(r.labels).toBe("Ausweise, Reisen");
  expect(r.objekte).toEqual(["ausweise", "reisen"]);
  expect(r.meldung).toBe("Ausweise, Reisen · Gültig bis 15.06.2026");
});

test("Eigene Kategorien: anlegen, prüfen, umbenennen, löschen", async ({ page }) => {
  const r = await page.evaluate(() => {
    const { Core, Kategorien, Daten } = window.N2L;
    const a = Kategorien.hinzufuegen("Haustier", "🐾");
    const b = Kategorien.hinzufuegen("Wohnung", "🏠");

    // Ein Eintrag mit fester und eigener Kategorie
    const e = Daten.upsert({ titel: "Impfpass Hund", kategorien: ["gesundheit", a.id],
      datum: "2027-01-10" });

    const fehler = [];
    try { Kategorien.hinzufuegen("haustier", "🐕"); } catch(x){ fehler.push("doppelt"); }
    try { Kategorien.hinzufuegen("   ", "🐕"); } catch(x){ fehler.push("leer"); }

    /* Zustand VOR dem Löschen festhalten – danach ist die Kategorie weg. */
    const vorher = {
      idPraefix: a.id.indexOf("eigen-") === 0 && b.id.indexOf("eigen-") === 0,
      eigenMarkiert: a.eigen === true,
      inGesamtliste: Core.kategorien().some(k => k.id === a.id),
      nichtInFesten: Core.KATEGORIEN_FEST.some(k => k.id === a.id),
      zugeordnet: Daten.get(e.id).kategorien.slice()
    };

    const umbenannt = Kategorien.umbenennen(a.id, "Haustiere", "🐕");
    const vorLoeschen = Kategorien.anzahl(a.id);
    const betroffen = Kategorien.entfernen(a.id);

    return Object.assign(vorher, {
      fehler,
      umbenannt: umbenannt && umbenannt.label + umbenannt.emoji,
      vorLoeschen, betroffen,
      // Nach dem Löschen bleibt die feste Kategorie übrig
      nachLoeschen: Daten.get(e.id).kategorien.slice(),
      restliche: Core.eigene.map(k => k.label)
    });
  });
  expect(r.idPraefix).toBe(true);
  expect(r.eigenMarkiert).toBe(true);
  expect(r.inGesamtliste).toBe(true);
  expect(r.nichtInFesten).toBe(false);
  expect(r.zugeordnet).toHaveLength(2);
  expect(r.fehler).toEqual(["doppelt", "leer"]);   // Name doppelt bzw. leer
  expect(r.umbenannt).toBe("Haustiere🐕");
  expect(r.vorLoeschen).toBe(1);
  expect(r.betroffen).toBe(1);
  expect(r.nachLoeschen).toEqual(["gesundheit"]);
  expect(r.restliche).toEqual(["Wohnung"]);
});

test("Löschen der letzten Kategorie eines Eintrags ergibt „Sonstiges“", async ({ page }) => {
  const kats = await page.evaluate(() => {
    const { Kategorien, Daten } = window.N2L;
    const k = Kategorien.hinzufuegen("Studium", "🎓");
    const e = Daten.upsert({ titel: "Semesterbeitrag", kategorien: [k.id], datum: "2027-04-01" });
    Kategorien.entfernen(k.id);
    return Daten.get(e.id).kategorien;
  });
  expect(kats).toEqual(["sonstiges"]);
});

test("Emoji-Prüfung nimmt genau ein Symbol – auch zusammengesetzte", async ({ page }) => {
  const r = await page.evaluate(() => {
    const K = window.N2L.Kategorien;
    return {
      einfach: K.emojiPruefen("🐾"),
      leer: K.emojiPruefen(""),
      undefiniert: K.emojiPruefen(undefined),
      // Aus einer Kette mehrerer bleibt das erste
      mehrere: K.emojiPruefen("🐾🏠🎓"),
      // Alles, was zu einem Symbol gehört, bleibt zusammen
      hautfarbe: K.emojiPruefen("👋🏽"),
      variante: K.emojiPruefen("⚠️"),
      flagge: K.emojiPruefen("🇩🇪"),
      zweiFlaggen: K.emojiPruefen("🇩🇪🇫🇷"),
      familie: K.emojiPruefen("👨‍👩‍👧‍👦"),
      regenbogen: K.emojiPruefen("🏳️‍🌈"),
      tagFlagge: K.emojiPruefen("🏴󠁧󠁢󠁥󠁮󠁧󠁿"),
      // Neuere Zeichen (Unicode 15/15.1/16) laufen durch dieselbe Regel
      neu15: K.emojiPruefen("🩷"),
      neu151: K.emojiPruefen("🫎"),
      neu16: K.emojiPruefen("🫩"),
      phoenix: K.emojiPruefen("🐦‍🔥"),
      limette: K.emojiPruefen("🍋‍🟩"),
      kopfschuetteln: K.emojiPruefen("🙂‍↔️")
    };
  });
  expect(r.einfach).toBe("🐾");
  expect(r.leer).toBe("📌");
  expect(r.undefiniert).toBe("📌");
  expect(r.mehrere).toBe("🐾");
  expect(r.hautfarbe).toBe("👋🏽");
  expect(r.variante).toBe("⚠️");
  // Flaggen bestehen aus zwei Regional-Indikatoren und dürfen nicht
  // nach dem ersten abgeschnitten werden.
  expect(r.flagge).toBe("🇩🇪");
  expect(r.zweiFlaggen).toBe("🇩🇪");
  expect(r.familie).toBe("👨‍👩‍👧‍👦");
  expect(r.regenbogen).toBe("🏳️‍🌈");
  expect(r.tagFlagge).toBe("🏴󠁧󠁢󠁥󠁮󠁧󠁿");
  expect(r.neu15).toBe("🩷");
  expect(r.neu151).toBe("🫎");
  expect(r.neu16).toBe("🫩");
  expect(r.phoenix).toBe("🐦‍🔥");
  expect(r.limette).toBe("🍋‍🟩");
  expect(r.kopfschuetteln).toBe("🙂‍↔️");
});

test("Nicht darstellbare Emoji werden erkannt", async ({ page }) => {
  const r = await page.evaluate(() => {
    const P = window.N2L.EmojiPruefung;
    return {
      messbar: P.vorbereiten(),
      alt: P.darstellbar("📌"),
      neu15: P.darstellbar("🩷"),
      verbund: P.darstellbar("🐦‍🔥"),
      // Ein unbelegter Codepoint kann nirgends dargestellt werden
      unbelegt: P.darstellbar("\u{10FFFD}"),
      leer: P.darstellbar("")
    };
  });
  expect(r.messbar).toBe(true);
  expect(r.alt).toBe(true);
  expect(r.neu15).toBe(true);
  expect(r.verbund).toBe(true);
  expect(r.unbelegt).toBe(false);
  expect(r.leer).toBe(true);          // nichts zu prüfen – nicht blockieren
});

test("Kalenderdatei enthält Termin, Wiederholung und Alarme", async ({ page }) => {
  const ics = await page.evaluate(() => {
    const C = window.N2L.Core;
    return window.N2L.Kalender.ics(C.normalisieren({
      titel: "Kompetenzerhalt; Theorie", kategorien: ["beruflich"], datumstyp: "wiederkehrend",
      datum: "2026-09-30", wiederholung: "jaehrlich", referenz: "AB-12", notiz: "Zeile1\nZeile2"
    }));
  });
  expect(ics).toContain("BEGIN:VCALENDAR");
  expect(ics).toContain("DTSTART;VALUE=DATE:20260930");
  expect(ics).toContain("DTEND;VALUE=DATE:20261001");
  expect(ics).toContain("RRULE:FREQ=YEARLY");
  expect(ics).toContain("SUMMARY:Kompetenzerhalt\\; Theorie – fällig");
  expect(ics).toContain("TRIGGER:-P90D");
  expect(ics).toContain("TRIGGER:-P1D");
  expect(ics).toContain("Zeile1\\nZeile2");
  expect(ics.trim().endsWith("END:VCALENDAR")).toBe(true);
});
