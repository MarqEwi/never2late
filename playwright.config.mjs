// Playwright-Konfiguration: testet die Web-Version aus dem Repo-Root
// (Chromium liegt vorinstalliert unter /opt/pw-browsers, siehe PLAYWRIGHT_BROWSERS_PATH).
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  timeout: 30000,
  use: { baseURL: "http://127.0.0.1:8931" },
  webServer: {
    command: "python3 -m http.server 8931",
    url: "http://127.0.0.1:8931/",
    reuseExistingServer: true
  },
  projects: [{
    name: "chromium",
    use: {
      browserName: "chromium",
      // Vorinstallierter Chromium (kein Download nötig; PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1)
      launchOptions: { executablePath: "/opt/pw-browsers/chromium" }
    }
  }]
});
