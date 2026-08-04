// Gemeinsame Helfer für die Playwright-Tests.

/* Öffnet die App mit übersprungener Kurzeinführung, damit die Tests direkt
   auf dem Dashboard landen. */
export async function appOeffnen(page, opts = {}){
  await page.addInitScript(() => {
    localStorage.setItem("n2l_onboarding_done", "true");
  });
  if (opts.vorher) await page.addInitScript(opts.vorher);
  await page.goto("/index.html");
  await page.waitForFunction(() => !!window.N2L);
}

/* Stellt die Android-App-Umgebung nach: window.Capacitor mit den Plugins,
   die die App tatsächlich benutzt. Alle Aufrufe landen in window.__calls,
   damit die Tests prüfen können, dass der native Zweig wirklich läuft. */
export function capacitorMock(){
  window.__calls = [];
  const merke = (name, arg) => window.__calls.push({ name, arg });
  window.Capacitor = {
    isNativePlatform: () => true,
    Plugins: {
      App: {
        addListener: (ev, cb) => { (window.__listener ||= {})[ev] = cb; return { remove(){} }; },
        exitApp: () => merke("App.exitApp")
      },
      Filesystem: {
        writeFile: async o => {
          merke("Filesystem.writeFile", { path: o.path, directory: o.directory, data: o.data });
          return {};
        },
        getUri: async o => {
          merke("Filesystem.getUri", { path: o.path, directory: o.directory });
          return { uri: "file:///cache/" + o.path };
        }
      },
      Share: {
        share: async o => { merke("Share.share", { title: o.title, files: o.files }); return {}; }
      },
      LocalNotifications: {
        checkPermissions: async () => ({ display: "granted" }),
        requestPermissions: async () => ({ display: "granted" }),
        getPending: async () => ({ notifications: (window.__geplant || []).map(n => ({ id: n.id })) }),
        cancel: async o => {
          const ids = o.notifications.map(n => n.id);
          merke("LocalNotifications.cancel", { anzahl: ids.length, ids });
          window.__geplant = (window.__geplant || []).filter(n => ids.indexOf(n.id) < 0);
        },
        schedule: async o => {
          // Wie das echte Plugin: bereits vorgemerkte Kennungen werden
          // ersetzt, alles andere kommt hinzu.
          const neu = o.notifications.map(n => ({
            id: n.id, title: n.title, body: n.body,
            // Die Capacitor-Brücke wandelt Date beim Übertragen in einen
            // ISO-String – hier genauso, damit der Test dem Ernstfall folgt.
            at: n.schedule && n.schedule.at
              ? JSON.parse(JSON.stringify({ a: n.schedule.at })).a : null
          }));
          const ids = neu.map(n => n.id);
          window.__geplant = (window.__geplant || []).filter(n => ids.indexOf(n.id) < 0).concat(neu);
          merke("LocalNotifications.schedule", { anzahl: neu.length });
        }
      }
    }
  };
}

/* Legt einen Eintrag über die Oberfläche an.
   `kategorie` nimmt eine einzelne, `kategorien` mehrere Kategorien. */
export async function eintragAnlegen(page, { titel, kategorie, kategorien, datum, typ = "ablauf" }){
  const kats = kategorien || [kategorie || "ausweise"];
  await page.click("#btn-neu");
  await page.fill("#f-titel", titel);
  for (const k of kats) await page.click(`#f-kategorie button[data-k="${k}"]`);
  await page.click(`#f-datumstyp button[data-v="${typ}"]`);
  await page.fill("#f-datum", datum);
  await page.click("#f-speichern");
  await page.waitForSelector("#view-detail.active");
}

/* Datum relativ zu heute als ISO-String (JJJJ-MM-TT). */
export function inTagen(n){
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
