// Export- und Drucken-Tests für den nativen Zweig (Android-App).
// Hintergrund: In der App funktionieren weder Blob-Downloads (a.download) noch
// window.print(). Beides muss deshalb über die Capacitor-Plugins Filesystem und
// Share laufen. Dieser Test stellt eine App-Umgebung nach und prüft, dass die
// Plugins tatsächlich aufgerufen werden – ein stiller Ausfall wie in v1.0.0
// fällt damit sofort auf.
import { test, expect } from "@playwright/test";

const TESTPERSONEN = [
  { name: "Berger, T.", a: 47.9, b: 21.5, c: 63.0, d: 14.8, abbruch: "" },
  { name: "Vogel, A.", a: 66.8, b: 51.2, c: 97.4, d: 36.5, abbruch: "" }
];

/* Simuliert die Android-App: natives Capacitor mit Filesystem- und
   Share-Plugin, Premium freigeschaltet, zwei Testpersonen in der Liste. */
async function appUmgebung(page, { plugins = true } = {}){
  await page.addInitScript(([personen, mitPlugins]) => {
    localStorage.setItem("sgt_onboarding_done", "true");
    localStorage.setItem("sgt_edition", JSON.stringify("premium"));
    localStorage.setItem("sgt_participants", JSON.stringify(personen));
    window.__calls = [];
    const Plugins = mitPlugins ? {
      Filesystem: {
        writeFile: async o => { window.__calls.push({ fn: "writeFile", path: o.path, directory: o.directory, bytes: (o.data || "").length }); return {}; },
        getUri: async o => { window.__calls.push({ fn: "getUri", path: o.path }); return { uri: "file:///cache/" + o.path }; }
      },
      Share: {
        share: async o => { window.__calls.push({ fn: "share", title: o.title, file: (o.files || [])[0] }); return {}; }
      }
    } : {};
    window.Capacitor = { isNativePlatform: () => true, Plugins };
  }, [TESTPERSONEN, plugins]);
}

async function inPrueferModus(page){
  await page.goto("/");
  await page.click("#go-pruefer");
  await expect(page.locator("#p-tbody tr")).toHaveCount(TESTPERSONEN.length);
}

test("App-Export schreibt die Datei und öffnet das Teilen-Menü", async ({ page }) => {
  await appUmgebung(page);
  await inPrueferModus(page);

  for (const [knopf, endung] of [["#exp-pdf", ".pdf"], ["#exp-img", ".png"], ["#exp-txt", ".txt"]]){
    await page.evaluate(() => { window.__calls = []; });
    await page.click("#p-export");
    await page.click(knopf);
    await expect.poll(async () => (await page.evaluate(() => window.__calls)).map(c => c.fn))
      .toEqual(["writeFile", "getUri", "share"]);
    const calls = await page.evaluate(() => window.__calls);
    const write = calls.find(c => c.fn === "writeFile");
    expect(write.path).toContain(endung);
    expect(write.directory).toBe("CACHE");
    expect(write.bytes).toBeGreaterThan(0);          // Datei ist nicht leer
    expect(calls.find(c => c.fn === "share").file).toBe("file:///cache/" + write.path);
  }
});

test("Drucken erzeugt in der App ein PDF und teilt es", async ({ page }) => {
  await appUmgebung(page);
  await inPrueferModus(page);

  await page.click("#p-print");
  await expect.poll(async () => (await page.evaluate(() => window.__calls)).map(c => c.fn))
    .toEqual(["writeFile", "getUri", "share"]);
  const calls = await page.evaluate(() => window.__calls);
  expect(calls.find(c => c.fn === "writeFile").path).toContain(".pdf");
  // In der App heißt der Knopf passend zum Teilen-Menü
  await expect(page.locator("#p-print-label")).toHaveText("Drucken / Teilen");
});

test("Fehlendes Plugin meldet sich, statt stillschweigend nichts zu tun", async ({ page }) => {
  await appUmgebung(page, { plugins: false });
  await inPrueferModus(page);

  let hinweis = null;
  page.on("dialog", async d => { hinweis = d.message(); await d.dismiss(); });
  await page.click("#p-export");
  await page.click("#exp-pdf");
  await expect.poll(() => hinweis).toContain("nicht verfügbar");
});

test("Im Browser bleibt der Download-Weg erhalten", async ({ page }) => {
  await page.addInitScript(personen => {
    localStorage.setItem("sgt_onboarding_done", "true");
    localStorage.setItem("sgt_edition", JSON.stringify("premium"));
    localStorage.setItem("sgt_participants", JSON.stringify(personen));
  }, TESTPERSONEN);
  await inPrueferModus(page);

  await page.click("#p-export");
  const download = page.waitForEvent("download");
  await page.click("#exp-txt");
  expect((await download).suggestedFilename()).toContain(".txt");
});
