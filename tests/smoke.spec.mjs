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
