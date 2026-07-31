// Smoke-Test: App lädt fehlerfrei, SGT-Auswertung und Speicherung funktionieren.
import { test, expect } from "@playwright/test";

test("App lädt ohne Konsolenfehler und wertet das SGT korrekt aus", async ({ page }) => {
  const errors = [];
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", e => errors.push(String(e)));

  await page.goto("/");
  await expect(page).toHaveTitle(/SGT Rechner/);
  await page.click("#ob-skip");
  await page.click("#go-teilnehmer");

  // Beispiel "Grün" aus Tabelle 2 der Handanweisung
  await page.fill("#t-a", "48,2");
  await page.fill("#t-b", "22,4");
  await page.fill("#t-c", "60,6");
  await page.fill("#t-d", "15,4");
  await expect(page.locator("#t-r-total")).toHaveText("146,6 s");
  await expect(page.locator("#t-r-grade")).toHaveText("Kategorie Grün");

  // Ausklappbare Kategoriegrenzen (für alle gleich, ohne Wertungsgruppen)
  await expect(page.locator("#t-limits-sum")).toContainText("für alle gleich");
  await page.click("#t-limits-sum");
  await expect(page.locator("#t-limits-body")).toContainText("≤ 55 s");   // SGT-A Grün
  await expect(page.locator("#t-limits-body")).toContainText("≥ 100 s");  // SGT-C Rot
  await expect(page.locator("#t-limits-body")).toContainText("vorläufig");
  await page.click("#t-limits-sum");

  // Beispiel "Gelb" 1 aus Tabelle 3: nur SGT-A im gelben Bereich
  await page.fill("#t-a", "56,3");
  await page.fill("#t-b", "25,9");
  await page.fill("#t-c", "55,0");
  await page.fill("#t-d", "18,8");
  await expect(page.locator("#t-r-total")).toHaveText("156,0 s");
  await expect(page.locator("#t-r-grade")).toHaveText("Kategorie Gelb");
  await expect(page.locator("#t-r-failhint")).toContainText("SGT-A");

  // Beispiel "Rot" 2 aus Tabelle 4: Abbruch bei SGT-D => obligatorisch Rot
  await page.fill("#t-a", "54,5");
  await page.fill("#t-b", "54,6");
  await page.fill("#t-c", "101,9");
  await page.selectOption("#t-abbruch", "d");
  await expect(page.locator("#t-r-total")).toHaveText("Abbruch");
  await expect(page.locator("#t-r-grade")).toHaveText("Kategorie Rot");
  await expect(page.locator("#t-r-failhint")).toContainText("Abbruch");

  // Verlauf speichern + nur sgt_-Schlüssel im localStorage
  await page.selectOption("#t-abbruch", "");
  await page.fill("#t-a", "48,2");
  await page.fill("#t-b", "22,4");
  await page.fill("#t-c", "60,6");
  await page.fill("#t-d", "15,4");
  await page.click("#t-save");
  await expect(page.locator("#t-history table")).toBeVisible();
  const keys = await page.evaluate(() => Object.keys(localStorage));
  expect(keys.every(k => k.startsWith("sgt_"))).toBeTruthy();
  expect(keys.some(k => k.startsWith("pft_") || k.startsWith("bft_"))).toBeFalsy();

  expect(errors).toEqual([]);
});

test("Prüfermodus: Testpersonen erfassen und kategorisieren", async ({ page }) => {
  await page.goto("/");
  await page.click("#ob-skip");
  await page.click("#go-pruefer");

  await page.click("#p-add");
  await page.fill("#e-name", "Mustermann, A.");
  await page.fill("#e-a", "69,5");
  await page.fill("#e-b", "52,7");
  await page.fill("#e-c", "76,9");
  await page.fill("#e-d", "54,3");
  await page.click("#e-save");
  // Beispiel "Rot" 1 aus Tabelle 4: Gesamt 253,4 s, Kategorie Rot
  await expect(page.locator("#p-tbody tr")).toHaveCount(1);
  await expect(page.locator("#p-tbody")).toContainText("253,4");
  await expect(page.locator("#p-tbody")).toContainText("Rot");

  // Aufbau-&-Ablauf-Tab öffnet und zeigt die vier Aufgaben
  await page.click("#ptab-aufbau-btn");
  await expect(page.locator("#pruefer-tab-aufbau")).toContainText("SGT-A");
  await expect(page.locator("#pruefer-tab-aufbau")).toContainText("Heben und Absetzen");
});
