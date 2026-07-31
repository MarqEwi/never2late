// Bewertungs-Tests: prüft die SGT-Engine der echten Seite gegen die
// "Handanweisung Soldaten-Grundfitness-Tool 'SGT'" (Stand April 2019).
// Abgedeckt sind alle Bandgrenzen aus Tabelle 1 (inkl. der exakten
// Grenzwerte in Zehntelsekunden) sowie sämtliche Beispiele der
// Tabellen 2–4 (Kategorisierung und Gesamtzeiten).
import { test, expect } from "@playwright/test";

// [Aufgabe, Zeit in s, erwartetes Band]
// Grenzsemantik aus Tabelle 1 ("Grün x > … < y Rot"): Werte exakt auf der
// Grün-Grenze sind noch "gruen", exakt auf der Rot-Grenze bereits "rot".
const BAND_CHECKS = [
  ["a", 40.0, "gruen"], ["a", 54.9, "gruen"], ["a", 55.0, "gruen"],
  ["a", 55.1, "gelb"], ["a", 62.0, "gelb"], ["a", 69.9, "gelb"],
  ["a", 70.0, "rot"], ["a", 85.0, "rot"],
  ["b", 22.4, "gruen"], ["b", 29.9, "gruen"], ["b", 30.0, "gruen"],
  ["b", 30.1, "gelb"], ["b", 40.4, "gelb"], ["b", 49.9, "gelb"],
  ["b", 50.0, "rot"], ["b", 52.7, "rot"],
  ["c", 60.6, "gruen"], ["c", 74.9, "gruen"], ["c", 75.0, "gruen"],
  ["c", 75.1, "gelb"], ["c", 76.9, "gelb"], ["c", 99.9, "gelb"],
  ["c", 100.0, "rot"], ["c", 101.9, "rot"],
  ["d", 15.4, "gruen"], ["d", 19.9, "gruen"], ["d", 20.0, "gruen"],
  ["d", 20.1, "gelb"], ["d", 38.8, "gelb"], ["d", 49.9, "gelb"],
  ["d", 50.0, "rot"], ["d", 54.3, "rot"],
  ["total", 146.6, "gruen"], ["total", 180.0, "gruen"],
  ["total", 180.1, "gelb"], ["total", 189.3, "gelb"], ["total", 253.4, "gelb"],
  ["total", 269.9, "gelb"], ["total", 270.0, "rot"]
];

test("Tabelle 1: alle Bandgrenzen entsprechen der Handanweisung", async ({ page }) => {
  await page.goto("/");
  const results = await page.evaluate(cs => cs.map(([k, t]) => SGT.band(k, t)), BAND_CHECKS);
  const diffs = [];
  results.forEach((got, i) => {
    const [k, t, want] = BAND_CHECKS[i];
    if (got !== want) diffs.push(`${k} ${t}s: erwartet ${want}, erhalten ${got}`);
  });
  expect(diffs, diffs.join("\n")).toEqual([]);
});

test("Tabellen 2–4: alle Kategorisierungsbeispiele der Handanweisung", async ({ page }) => {
  await page.goto("/");
  const r = await page.evaluate(() => {
    const ev = inp => SGT.evaluate(inp);
    return {
      gruen: ev({ a: 48.2, b: 22.4, c: 60.6, d: 15.4, abbruch: "" }),
      gelb1: ev({ a: 56.3, b: 25.9, c: 55.0, d: 18.8, abbruch: "" }),
      gelb2: ev({ a: 54.6, b: 40.4, c: 75.6, d: 18.7, abbruch: "" }),
      rot1:  ev({ a: 69.5, b: 52.7, c: 76.9, d: 54.3, abbruch: "" }),
      rot2:  ev({ a: 54.5, b: 54.6, c: 101.9, d: null, abbruch: "d" }),
      unvollstaendig: ev({ a: 48.2, b: null, c: 60.6, d: 15.4, abbruch: "" }),
      abbruchOhneZeiten: ev({ a: null, b: null, c: null, d: null, abbruch: "a" })
    };
  });
  // Tabelle 2: alle Grün => Kategorie Grün, Gesamt 146,6
  expect(r.gruen.kat).toBe("gruen");
  expect(r.gruen.total).toBeCloseTo(146.6, 5);
  // Tabelle 3, Beispiel 1: nur SGT-A Gelb => Gelb, Gesamt 156,0
  expect(r.gelb1.kat).toBe("gelb");
  expect(r.gelb1.bands).toEqual({ a: "gelb", b: "gruen", c: "gruen", d: "gruen" });
  expect(r.gelb1.total).toBeCloseTo(156.0, 5);
  // Tabelle 3, Beispiel 2: SGT-B und SGT-C Gelb => Gelb, Gesamt 189,3
  expect(r.gelb2.kat).toBe("gelb");
  expect(r.gelb2.bands).toEqual({ a: "gruen", b: "gelb", c: "gelb", d: "gruen" });
  expect(r.gelb2.total).toBeCloseTo(189.3, 5);
  // Tabelle 4, Beispiel 1: zwei Gelb + zwei Rot => Rot, Gesamt 253,4
  expect(r.rot1.kat).toBe("rot");
  expect(r.rot1.bands).toEqual({ a: "gelb", b: "rot", c: "gelb", d: "rot" });
  expect(r.rot1.total).toBeCloseTo(253.4, 5);
  // Tabelle 4, Beispiel 2: Abbruch bei SGT-D => obligatorisch Rot, keine Gesamtzeit
  expect(r.rot2.kat).toBe("rot");
  expect(r.rot2.complete).toBe(true);
  expect(r.rot2.total).toBeNull();
  // Ohne alle vier Zeiten (und ohne Abbruch) gibt es keine Kategorie
  expect(r.unvollstaendig.complete).toBe(false);
  expect(r.unvollstaendig.kat).toBeNull();
  // Abbruch bei SGT-A ist auch ohne Zwischenzeiten vollständig wertbar => Rot
  expect(r.abbruchOhneZeiten.complete).toBe(true);
  expect(r.abbruchOhneZeiten.kat).toBe("rot");
});

test("Gesamtzeit dient nur dem Schnellüberblick, Einzelzeiten entscheiden", async ({ page }) => {
  await page.goto("/");
  const r = await page.evaluate(() => {
    // Gesamt läge im grünen Bereich (116,0 s), aber SGT-A ist gelb:
    const x = SGT.evaluate({ a: 56.0, b: 10.0, c: 40.0, d: 10.0, abbruch: "" });
    return { kat: x.kat, total: x.total, totalBand: x.totalBand };
  });
  expect(r.total).toBeCloseTo(116.0, 5);
  expect(r.totalBand).toBe("gruen");
  expect(r.kat).toBe("gelb"); // Einzelzeit schlägt Gesamtzeit
});
