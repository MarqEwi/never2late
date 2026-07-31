// Bedienung: Skizzen in den Info-Dialogen und Verhalten der Zurück-Taste.
import { test, expect } from "@playwright/test";

/* Simuliert die Android-App mit dem App-Plugin, damit sich die Zurück-Taste
   auslösen lässt und exitApp beobachtbar ist. */
async function appUmgebung(page, { onboardingFertig = true } = {}){
  await page.addInitScript(fertig => {
    if (fertig) localStorage.setItem("sgt_onboarding_done", "true");
    window.__back = { exits: 0, events: [] };
    window.Capacitor = {
      isNativePlatform: () => true,
      Plugins: {
        App: {
          addListener: (ev, cb) => {
            window.__back.events.push(ev);
            if (ev === "backButton") window.__backCb = cb;
            return { remove(){} };
          },
          exitApp: () => { window.__back.exits++; }
        }
      }
    };
  }, onboardingFertig);
}
const zurueck = page => page.evaluate(() => window.__backCb && window.__backCb());

test("Info-Dialoge zeigen die Skizze der jeweiligen Aufgabe", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("sgt_onboarding_done", "true"));
  await page.goto("/");

  for (const [knopf, skizzeId] of [["a", "skizze-a"], ["b", "skizze-b"], ["c", "skizze-c"],
                                   ["d", "skizze-d"], ["parcours", "skizze-parcours"]]){
    await page.click(`[data-info="${knopf}"]`);
    const bild = page.locator("#info-content img.station-img").first();
    await expect(bild).toBeVisible();
    // Es ist dasselbe Bild wie im Aufbau-&-Ablauf-Tab (nicht doppelt eingebettet)
    const [imModal, imTab] = await page.evaluate(id => [
      document.querySelector("#info-content img.station-img").getAttribute("src"),
      document.getElementById(id).getAttribute("src")
    ], skizzeId);
    expect(imModal).toBe(imTab);
    expect(imModal.startsWith("data:image/webp")).toBeTruthy();
    await page.click('[data-close="modal-info"]');
  }
});

test("Info-Dialoge ohne eigene Skizze bleiben bildlos", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("sgt_onboarding_done", "true"));
  await page.goto("/");
  await page.click('[data-info="ausruestung"]');
  await expect(page.locator("#info-content img.station-img")).toHaveCount(0);
  await expect(page.locator("#info-content")).toContainText("Gewichtsweste");
});

test("Zurück schließt Fenster, geht zur Startseite und warnt vor dem Verlassen", async ({ page }) => {
  await appUmgebung(page);
  await page.goto("/");
  expect(await page.evaluate(() => window.__back.events)).toContain("backButton");

  // Unterseite öffnen und darin ein Fenster
  await page.click("#go-pruefer");
  await page.click("#btn-settings");
  await expect(page.locator("#modal-settings")).toHaveClass(/open/);

  // 1× zurück: Fenster zu, Seite bleibt
  await zurueck(page);
  await expect(page.locator("#modal-settings")).not.toHaveClass(/open/);
  await expect(page.locator("#view-pruefer")).toHaveClass(/active/);

  // 2× zurück: zurück zur Startseite
  await zurueck(page);
  await expect(page.locator("#view-home")).toHaveClass(/active/);

  // 3× zurück: Hinweis statt Beenden
  await zurueck(page);
  await expect(page.locator("#toast")).toBeVisible();
  await expect(page.locator("#toast")).toContainText("erneut");
  expect(await page.evaluate(() => window.__back.exits)).toBe(0);

  // 4× zurück (innerhalb der Frist): App wird beendet
  await zurueck(page);
  expect(await page.evaluate(() => window.__back.exits)).toBe(1);
});

test("Zurück schließt zuerst das zuletzt geöffnete Fenster", async ({ page }) => {
  await appUmgebung(page);
  await page.goto("/");
  await page.click("#go-pruefer");
  await page.click("#p-add");                       // Teilnehmer-Editor
  await expect(page.locator("#modal-editor")).toHaveClass(/open/);
  await zurueck(page);
  await expect(page.locator("#modal-editor")).not.toHaveClass(/open/);
  await expect(page.locator("#view-pruefer")).toHaveClass(/active/);
});

test("Zurück beendet die Einführung, statt sie beim Neustart erneut zu zeigen", async ({ page }) => {
  await appUmgebung(page, { onboardingFertig: false });
  await page.goto("/");
  await expect(page.locator("#modal-onboarding")).toHaveClass(/open/);
  await zurueck(page);
  await expect(page.locator("#modal-onboarding")).not.toHaveClass(/open/);
  expect(await page.evaluate(() => localStorage.getItem("sgt_onboarding_done"))).toBe("true");
});
