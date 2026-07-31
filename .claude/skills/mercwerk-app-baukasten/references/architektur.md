# Architektur und Codemuster

## Projektstruktur

```
index.html                  die ganze App (CSS + JS inline, Bilder als Data-URIs)
datenschutz.html            Datenschutz & Impressum (auch im Store verlinkt)
manifest.webmanifest, sw.js Web-Version (GitHub Pages)
icons/                      Web-Icons 192/512/maskable
scripts/sync-www.mjs        kopiert die Web-Dateien nach www/
www/                        Quelle für Capacitor (nicht von Hand bearbeiten)
android/                    Capacitor-Projekt, bleibt vollständig im Git
patches/                    patch-package (behebt AdMob-Build-Fehler)
tests/                      Playwright
docs/                       Store-Texte, Veröffentlichungs-Checkliste, Grafiken
```

`package.json`-Skripte:

```json
"sync-www": "node scripts/sync-www.mjs",
"cap:sync": "npm run sync-www && npx cap sync android",
"cap:open": "npx cap open android",
"postinstall": "patch-package"
```

Warum Node statt `cp`: Unix-Befehle scheitern unter Windows – und zwar
**still**, sodass anschließend eine veraltete `www/index.html` in die App
wandert.

## Edition (free/premium)

Ein Schalter, der Werbung und Premium-Funktionen gemeinsam steuert. Alles
andere liest nur noch `Edition.isPremium()`.

```js
const Edition = {
  KEY: "xxx_edition",
  FREE_LIMIT: 3,
  get(){ return load(this.KEY, "free") === "premium" ? "premium" : "free"; },
  isPremium(){ return this.get() === "premium"; },
  set(v){ store(this.KEY, v === "premium" ? "premium" : "free"); this.apply(); },
  apply(){
    document.body.classList.toggle("edition-free", !this.isPremium());
    document.body.classList.toggle("edition-premium", this.isPremium());
    renderSettings(); renderListen();
    if (typeof updateAdbarH === "function") updateAdbarH();
    if (typeof Ads === "object" && Ads.sync) Ads.sync();
  }
};
```

Die CSS-Klassen am `<body>` erledigen das Ein- und Ausblenden der
Werbeleiste, ohne dass jede Stelle einzeln nachfragen muss.

## Werbung (AdMob)

Die gesamte Konfiguration steht an **einer** Stelle, damit vor dem Release
klar ist, was zu tauschen ist:

```js
const ADS_CONF = {
  TESTING: false,
  BANNER_ID: "ca-app-pub-…/…"   /* echter Banner-Block */
};
```

Wichtige Eigenschaften des Moduls:

- Prüft `window.Capacitor.isNativePlatform()`; im Browser bleibt der
  HTML-Platzhalter sichtbar und es passiert sonst nichts.
- Holt das Plugin über `window.Capacitor.Plugins.AdMob`.
- **UMP/DSGVO vor der ersten Anzeige**: `requestConsentInfo()`, bei
  `status === "REQUIRED"` und verfügbarem Formular `showConsentForm()`.
  Schlägt das fehl (z. B. weil im AdMob-Konto noch keine Meldung
  konfiguriert ist), läuft die App weiter statt zu blockieren.
- Ist `privacyOptionsRequirementStatus === "REQUIRED"`, wird der Knopf
  „Werbe-Einstellungen ändern" eingeblendet (`showPrivacyOptionsForm()`).
- Auf `bannerAdSizeChanged` hören und die gemeldete Höhe in eine
  CSS-Variable schreiben, damit der Inhalt nicht unter dem Banner
  verschwindet.
- Jeder Schritt geht zusätzlich in eine Diagnose-Liste (siehe unten).

## Kauf (Billing)

```js
const Billing = {
  PRODUCT: "premium_unlock",
  init(){
    const { store, ProductType, Platform } = window.CdvPurchase;
    store.register([{ id: this.PRODUCT, type: ProductType.NON_CONSUMABLE,
                      platform: Platform.GOOGLE_PLAY }]);
    store.when()
      .productUpdated(() => { /* Preis übernehmen, Dialog auffrischen */ })
      .approved(tr => { this.unlock(); try { tr.finish(); } catch(e){} })
      .receiptUpdated(() => { if (store.owned(this.PRODUCT)) this.unlock(); });
    store.initialize([Platform.GOOGLE_PLAY]);
  }
};
```

- `receiptUpdated` sorgt dafür, dass ein früherer Kauf nach Neuinstallation
  automatisch erkannt wird; zusätzlich gibt es „Käufe wiederherstellen"
  (`store.restorePurchases()`).
- Die Produkt-ID muss exakt der in der Play Console angelegten entsprechen.
- Initialisierung erst auf `deviceready` (mit `setTimeout`-Rückfall, falls
  das Ereignis schon durch ist).

## Native Brücke: Export und Drucken

**Das ist die Stelle, an der schon zwei Apps still kaputt waren.** In der
Android-WebView funktioniert weder ein Blob-Download über `a.download` noch
`window.print()`. Beides scheitert ohne Fehlermeldung. Der native Weg führt
über Filesystem + Share:

```js
const Bridge = {
  statusLog: [],
  log(msg, isErr){ /* in Diagnosezeile schreiben */ },
  isNative(){ return !!(window.Capacitor?.isNativePlatform?.()); },
  plugin(name){ return window.Capacitor?.Plugins?.[name] || null; },

  async saveBlob(filename, blob, title){
    if (!this.isNative()){ /* Browser: a.download */ }
    const Fs = this.plugin("Filesystem"), Sh = this.plugin("Share");
    if (!Fs || !Sh){ alert("Export nicht verfügbar (Modul fehlt)."); return false; }
    try {
      const data = await this.blobToBase64(blob);
      await Fs.writeFile({ path: filename, data, directory: "CACHE", recursive: true });
      const res = await Fs.getUri({ path: filename, directory: "CACHE" });
      await Sh.share({ title: title || filename, files: [res.uri] });
      return true;
    } catch(e){
      const msg = e?.message || String(e);
      if (/cancel|abort/i.test(msg)) return true;   // Nutzer hat abgebrochen
      alert("Die Datei konnte nicht erstellt werden.\n\n" + msg);
      return false;
    }
  },

  async print(){
    if (this.isNative()){
      const blob = buildListPdfBlob();               // dieselbe PDF-Erzeugung
      return blob ? await this.saveBlob("liste.pdf", blob, "Liste drucken") : false;
    }
    window.print();
  }
};
```

Voraussetzungen, die leicht übersehen werden:

- `@capacitor/filesystem` und `@capacitor/share` in der zum Core passenden
  Major-Version.
- `directory: "CACHE"` als **String** – ohne Bundler gibt es kein
  `Directory`-Enum. Der String wird im Plugin auf `context.cacheDir`
  abgebildet.
- Das Share-Plugin nutzt die FileProvider-Authority
  `getPackageName() + ".fileprovider"`. Im `AndroidManifest.xml` muss genau
  dieser Provider stehen und die zugehörige `file_paths.xml` einen
  `<cache-path path="." />`-Eintrag haben.
- Die PDF-Erzeugung in eine Funktion herausziehen, die den Blob
  zurückgibt – Export und Drucken teilen sie sich.
- Der Knopf heißt in der App sinnvollerweise „Drucken / Teilen", weil sich
  dort das System-Teilen-Menü öffnet.

## Zurück-Taste (Android)

Ohne eigenen Listener beendet die Zurück-Geste die App sofort – auch aus
einem offenen Dialog heraus. Erwartetes Verhalten: Fenster schließen →
Startseite → Hinweis → Beenden.

```js
const modalStack = [];
function openModal(id){
  $(id).classList.add("open");
  const i = modalStack.indexOf(id); if (i >= 0) modalStack.splice(i, 1);
  modalStack.push(id);
}
function closeModal(id){
  $(id).classList.remove("open");
  const i = modalStack.indexOf(id); if (i >= 0) modalStack.splice(i, 1);
}

function handleBack(){
  for (let i = modalStack.length - 1; i >= 0; i--){
    const el = document.getElementById(modalStack[i]);
    if (el && el.classList.contains("open")){
      if (modalStack[i] === "modal-onboarding") obFinish(); else closeModal(modalStack[i]);
      return true;
    }
    modalStack.splice(i, 1);
  }
  if (!$("view-home").classList.contains("active")){ show("home"); return true; }
  return false;
}

function onBackButton(){
  if (handleBack()){ exitHinweisBis = 0; return; }
  if (Date.now() < exitHinweisBis){ Bridge.plugin("App")?.exitApp(); return; }
  exitHinweisBis = Date.now() + 2500;
  toast("Zum Verlassen der App erneut „Zurück" drücken");
}

if (Bridge.isNative()) Bridge.plugin("App")?.addListener("backButton", onBackButton);
```

Braucht `@capacitor/app`. Auch das Schließen per Klick auf den Hintergrund
muss über `closeModal()` laufen, sonst bleibt der Stapel unsauber.

Der Toast darf **nicht** mit `left:50%` + `translateX(-50%)` zentriert
werden – dadurch steht ihm nur die halbe Bildschirmbreite zur Verfügung und
der Text bricht unnötig um. Stattdessen:

```css
left:16px; right:16px; margin:0 auto; width:fit-content;
max-width:calc(100% - 32px);
```

## Diagnose auf fremden Geräten

Werbung, Kauf und Export schreiben ihre Schritte in je eine Statusliste. Fünf
Tipps auf die Versionsnummer in den Einstellungen blenden diese Zeilen ein.
Auf dem Handy des Auftraggebers ist das oft die einzige Möglichkeit,
„funktioniert nicht" in eine konkrete Ursache zu übersetzen.

```js
let dbgTaps = 0;
$("s-version").addEventListener("click", () => {
  if (++dbgTaps >= 5){
    ["ads-status","buy-status","export-status"].forEach(id => $(id).style.display = "");
    renderSettings();
  }
});
```

**Grundregel:** Kein stiller Fehlschlag. Jeder Zweig, der fehlschlagen kann,
meldet sich entweder dem Nutzer oder mindestens in der Diagnosezeile.

## Skizzen doppelt nutzen, nicht doppelt einbetten

Die Stationsskizzen liegen als WebP-Data-URIs im Aufbau-Tab. Sollen sie auch
in den Info-Dialogen erscheinen, bekommen die Bilder dort feste IDs und
werden zur Laufzeit übernommen:

```js
const quelle = document.getElementById(info.skizze);
if (quelle?.getAttribute("src")){
  const img = document.createElement("img");
  img.className = "station-img";
  img.src = quelle.getAttribute("src");
  img.alt = quelle.getAttribute("alt") || "";
  img.loading = "lazy";
  cont.insertBefore(img, cont.firstChild);
}
```

Bei rund 30 KB je Skizze spart das spürbar Dateigröße. Beim Vergeben der IDs
darauf achten, **nicht** die Original-Abbildungen aus der Vorschrift zu
erwischen – die stehen im selben Muster, aber innerhalb von
`<details class="subdetails">`.
