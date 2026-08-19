// Grundprüfung: Die App lädt fehlerfrei, zeigt sinnvolle Startzustände und
// belegt im localStorage ausschließlich eigene Schlüssel.
import { test, expect } from "@playwright/test";
import { appOeffnen } from "./helfer.mjs";

test("lädt ohne Konsolenfehler und zeigt den leeren Zustand", async ({ page }) => {
  const fehler = [];
  page.on("console", m => { if (m.type() === "error") fehler.push(m.text()); });
  page.on("pageerror", e => fehler.push("PAGEERROR: " + e.message));

  await appOeffnen(page);

  expect(fehler).toEqual([]);
  await expect(page).toHaveTitle(/Never2Late/);
  await expect(page.locator("#view-home")).toHaveClass(/active/);
  await expect(page.locator("#home-inhalt")).toContainText("Noch nichts erfasst");
  await expect(page.locator("#btn-neu")).toBeVisible();
});

test("Beim allerersten Start steht ein gekennzeichnetes Beispiel bereit", async ({ page }) => {
  // Ohne vorbereiteten Speicher – also wie bei einer frisch installierten App
  await page.goto("/index.html");
  await page.waitForFunction(() => !!window.N2L);
  await page.click("#ob-skip");

  await expect(page.locator("#home-inhalt")).not.toContainText("Noch nichts erfasst");
  await expect(page.locator("#home-inhalt")).toContainText("Personalausweis");

  const e = await page.evaluate(() => window.N2L.Daten.alle()[0]);
  expect(e.titel).toBe("Personalausweis");
  expect(e.kategorien).toEqual(["ausweise"]);
  expect(e.beispiel).toBe(true);
  // Datum relativ zu heute erzeugt und in der Zukunft
  const tage = await page.evaluate(t => window.N2L.Core.tageBis(t), e.datum);
  expect(tage).toBeGreaterThan(0);
  // Notizfeld bleibt frei – sonst stünde dort nach dem Bearbeiten noch ein
  // Hinweis auf ein Beispiel, das keines mehr ist.
  expect(e.notiz).toBe("");

  // Unübersehbar als Beispiel gekennzeichnet – niemand soll das Datum für
  // eine eigene Angabe halten.
  await expect(page.locator(".beispiel-hinweis")).toBeVisible();
  await expect(page.locator(".beispiel-hinweis")).toContainText("das Datum ist erfunden");
  await expect(page.locator("#home-inhalt .row .pill")).toContainText("Beispiel");
});

test("Das Beispiel kommt nach dem ersten Start nicht wieder", async ({ page }) => {
  page.on("dialog", d => d.accept());
  await page.goto("/index.html");
  await page.waitForFunction(() => !!window.N2L);
  await page.click("#ob-skip");
  expect(await page.evaluate(() => window.N2L.Daten.alle().length)).toBe(1);

  // Alles löschen und neu starten: jetzt der normale leere Zustand
  await page.click("#btn-settings");
  await page.click("#s-reset");
  await page.reload();
  await page.waitForFunction(() => !!window.N2L);

  expect(await page.evaluate(() => window.N2L.Daten.alle().length)).toBe(0);
  await expect(page.locator("#home-inhalt")).toContainText("Noch nichts erfasst");
});

test("Bearbeiten macht aus dem Beispiel einen eigenen Eintrag", async ({ page }) => {
  await page.goto("/index.html");
  await page.waitForFunction(() => !!window.N2L);
  await page.click("#ob-skip");

  await page.click("#home-inhalt .row");
  await expect(page.locator("#detail-inhalt")).toContainText("Beispieleintrag");
  await page.click("#d-bearbeiten");
  await page.fill("#f-titel", "Mein Personalausweis");
  await page.click("#f-speichern");

  const e = await page.evaluate(() => window.N2L.Daten.alle()[0]);
  expect(e.titel).toBe("Mein Personalausweis");
  expect(e.beispiel).toBe(false);
  await expect(page.locator("#detail-inhalt")).not.toContainText("Beispieleintrag");

  await page.click('nav.tabs button[data-tab="home"]');
  await expect(page.locator(".beispiel-hinweis")).toHaveCount(0);
});

test("Kurzeinführung erscheint beim ersten Start und danach nicht mehr", async ({ page }) => {
  await page.goto("/index.html");
  await page.waitForFunction(() => !!window.N2L);
  await expect(page.locator("#modal-onboarding")).toHaveClass(/open/);

  await page.click("#ob-next");
  await page.click("#ob-next");
  await page.click("#ob-next");
  await expect(page.locator("#modal-onboarding")).not.toHaveClass(/open/);

  await page.reload();
  await page.waitForFunction(() => !!window.N2L);
  await expect(page.locator("#modal-onboarding")).not.toHaveClass(/open/);
});

test("belegt nur localStorage-Schlüssel mit dem Präfix n2l_", async ({ page }) => {
  await appOeffnen(page);
  await page.click("#btn-settings");
  await page.click("#s-beispiele");
  await expect(page.locator("#modal-settings")).not.toHaveClass(/open/);

  const keys = await page.evaluate(() => Object.keys(localStorage));
  expect(keys.length).toBeGreaterThan(0);
  const fremd = keys.filter(k => !k.startsWith("n2l_"));
  expect(fremd).toEqual([]);
});

test("Beispieldaten decken alle Statuswerte ab", async ({ page }) => {
  await appOeffnen(page);
  await page.click("#btn-settings");
  await page.click("#s-beispiele");

  const zahlen = await page.locator(".stat b").allTextContents();
  expect(zahlen).toHaveLength(3);
  zahlen.forEach(z => expect(Number(z)).toBeGreaterThan(0));
  await expect(page.locator(".hero")).toBeVisible();
});

test("Werbung und Käufe sind in V1 abgeschaltet und unsichtbar", async ({ page }) => {
  await appOeffnen(page);
  const r = await page.evaluate(() => ({
    ads: window.N2L.Ads.ENABLED,
    billing: window.N2L.Billing.ENABLED,
    premium: window.N2L.Edition.isPremium(),
    adbarSichtbar: getComputedStyle(document.getElementById("adbar")).display !== "none"
  }));
  expect(r.ads).toBe(false);
  expect(r.billing).toBe(false);
  expect(r.premium).toBe(false);
  expect(r.adbarSichtbar).toBe(false);
  await expect(page.locator("body")).not.toContainText("Premium");
  await expect(page.locator("body")).not.toContainText("Werbung");
});
