---
name: mercwerk-app-baukasten
description: Baukasten für die MERCwerk-App-Familie (BFT Tool, PFT Tool, SGT Rechner und Nachfolger) – eine in sich geschlossene HTML-App in einer Capacitor-Android-Hülle mit AdMob-Werbung, Premium-Einmalkauf und Play-Store-Veröffentlichung. Nutze diesen Skill immer, wenn eine neue App dieser Reihe entsteht, eine bestehende erweitert oder repariert wird, wenn ein Rechenkern aus einer amtlichen Vorschrift (PDF) umgesetzt werden soll, wenn es um AdMob, Play Console, Data Safety, Signieren und Hochladen eines App Bundles geht, oder wenn Icons, Stationsskizzen und Store-Grafiken gebraucht werden – auch dann, wenn der Auftrag eine dieser Apps nur beiläufig erwähnt oder nur „die App" sagt.
---

# MERCwerk-App-Baukasten

## Worum es geht

Diese App-Familie folgt einem bewährten Muster: **eine einzige, in sich
geschlossene `index.html`** (CSS und JS inline, alle Bilder als Data-URIs,
keine externen Abhängigkeiten), die per Node-Skript nach `www/` kopiert und
von **Capacitor** in eine Android-App verpackt wird. Dieselbe Datei läuft
unverändert als Web-Version auf GitHub Pages.

Das klingt altmodisch, ist aber der Grund, warum diese Apps wartbar sind:
kein Bundler, kein Build-Schritt, der kaputtgehen kann, keine
Versionskonflikte zwischen Paketen. Wer hier „modernisiert", zerstört genau
die Eigenschaft, die das Projekt trägt.

Der Auftraggeber ist **kein Programmierer**. Alles, was er selbst am PC, in
AdMob oder in der Play Console tun muss, braucht eine Anleitung in einfacher
Sprache, Schritt für Schritt, mit den exakten Werten zum Kopieren.

## Wenn eine neue App entsteht: Reihenfolge

1. **Vorschrift lesen und den Rechenkern verifizieren**, bevor eine Zeile UI
   entsteht. Alles andere hängt davon ab. → `references/rechenkern.md`
2. **Repo aus der Vorgänger-App ableiten** und konsequent umbenennen. Die
   Umbenennungs-Checkliste unten ist vollständig abzuarbeiten – jeder
   vergessene Punkt fällt erst in der App oder im Store auf.
3. **Rechenkern + Tests** zuerst, dann die Oberfläche darauf aufsetzen.
4. **Grafiken**: Logo → Icons → Stationsskizzen → Store-Grafiken.
   → `references/grafiken.md`
5. **Store-Texte** bewusst anders formulieren als bei den Schwester-Apps.
6. **Veröffentlichen**: AdMob, Play Console, Signieren, Upload.
   → `references/veroeffentlichung.md`

## Die Bausteine, die übernommen und nicht „verbessert" werden

Diese Entscheidungen haben sich über mehrere Apps bewährt. Wenn etwas davon
im Weg zu stehen scheint, ist fast immer die neue Idee das Problem.
Technische Einzelheiten und Codemuster: `references/architektur.md`.

- **Self-contained `index.html` ohne Bundler.** Plugins deshalb
  ausschließlich über `window.Capacitor.Plugins.<Name>` ansprechen –
  `Capacitor.registerPlugin(...)` existiert ohne Bundler nicht, und das Modul
  fällt dann **still** komplett aus.
- **Ein zentraler Edition-Schalter** free/premium im localStorage steuert
  Werbung *und* Premium-Funktionen. Eine einzige Wahrheit, kein zweiter Ort,
  an dem der Zustand auseinanderlaufen kann.
- **AdMob-Modul mit `ADS_CONF`** (Testmodus-Schalter und Banner-ID an einer
  Stelle), adaptives Banner unten, Höhenanpassung über
  `bannerAdSizeChanged`, HTML-Platzhalter als Rückfall.
- **DSGVO/UMP-Einwilligung vor der ersten Werbung** plus Knopf
  „Werbe-Einstellungen ändern".
- **Billing-Modul** (cordova-plugin-purchase, NON_CONSUMABLE,
  `premium_unlock`, „Käufe wiederherstellen", Auto-Erkennung früherer Käufe).
- **Native Brücke für Export und Drucken** über Filesystem + Share. Ohne sie
  tun beide Funktionen in der App **nichts** – siehe Fallstricke.
- **Zurück-Taste** (Android): erst Fenster schließen, dann zur Startseite,
  dann Hinweis „erneut drücken zum Verlassen".
- **`patch-package` mit postinstall** – behebt einen Build-Fehler des
  AdMob-Plugins. Den `patches/`-Ordner nicht löschen.
- **Node-basierte Sync-Skripte** (`scripts/sync-www.mjs`) statt `cp`/`mkdir`;
  Unix-Befehle scheitern unter Windows still.
- **Von Capacitor erzeugte Dateien bleiben im Git**, damit das Projekt nach
  dem Klonen sofort baubar ist.
- **Signierung über `keystore.properties`** (gitignored, Vorlage
  `keystore.properties.example` liegt bei). Service Worker nur im Web
  (github.io-Prüfung), nie in der App.
- **Versteckte Diagnose-Statuszeilen** (5× auf die Versionsnummer tippen) für
  Werbe-, Kauf- und Export-Fehlersuche. Auf einem fremden Handy ist das oft
  die einzige Möglichkeit, einen Fehler einzugrenzen.
- **Ausklappbare Übersicht der Grenzwerte** unter dem Gesamtergebnis, passend
  zur jeweiligen Wertungsgruppe.
- **Aufbau-&-Ablauf-Tab** mit einheitlichen Stations-Skizzen plus
  ausklappbaren Original-Skizzen aus der Vorschrift. Dieselben Skizzen
  erscheinen in den Info-Dialogen der Startseite – dort per DOM aus dem
  Aufbau-Tab übernommen, **nicht ein zweites Mal eingebettet**.

## Umbenennungs-Checkliste für eine neue App

Vollständig abarbeiten – jeder Punkt hat schon einmal Ärger gemacht:

| Was | Hinweis |
|---|---|
| App-Name, Titel, alle Texte | auch `manifest.webmanifest`, `strings.xml`, README, Datenschutzseite |
| App-ID `de.mercwerk.<name>` | **keine Bindestriche** – in Android-Anwendungs-IDs unzulässig |
| Java-Paketordner + `MainActivity` | Ordner umziehen, `package`-Zeile anpassen, alten Ordner löschen |
| **localStorage-Schlüssel** `xxx_…` | kritisch: alle Web-Versionen teilen unter `marqewi.github.io` dieselbe Origin |
| Name der nativen Brücke | falls noch ein `XxxNative` im Code steht |
| Logo, Icons, Adaptive-Icon-Hintergrund | Farbwert **exakt aus dem Logo messen** |
| Cache-Name im Service Worker | sonst kollidieren die Web-Versionen |
| AdMob: neue App + neuer Banner-Block | bis die IDs da sind Google-Test-IDs + `TESTING: true` |
| AdMob-App-ID im `AndroidManifest.xml` | **fehlt sie, stürzt die App beim Start ab** |
| Neues Kaufprodukt in neuer Play-Console-App | gleicher Keystore signiert alle Apps der Familie |
| GitHub Pages + eigene Datenschutz-URL | ergibt sich aus dem Repo-Namen |
| Store-Texte, Screenshots, Anleitungen | bewusst anders aufbauen – siehe unten |
| `versionCode` / `versionName` | bei jedem Upload erhöhen |

**Wiederholter Inhalt beim Play-Review** ist bei einer Familie ähnlicher Apps
das größte Ablehnungsrisiko. Store-Texte deshalb nicht variieren, sondern neu
denken: anderer Einstieg, andere Gliederung, andere Bilder, andere
Screenshot-Überschriften.

## Arbeitsweise

- **Kleine Schritte**: je Änderung Branch → PR mit deutscher Beschreibung →
  merge. Die PR-Beschreibung erklärt *warum*, nicht nur *was*.
- **Nach jeder Änderung**: Playwright-Tests und Konsolen-Check.
  Vorinstalliertes Chromium unter `/opt/pw-browsers/chromium`,
  `executablePath` in der Config – **kein `playwright install`**.
- **`npm run cap:sync` vor jedem Commit**, damit `www/` und die
  Android-Assets nie hinter `index.html` zurückfallen.
- **Vorschau-Screenshots schicken**, sobald sich optisch etwas ändert.
- **Bei PC-, AdMob- und Play-Console-Schritten** einzeln und in einfacher
  Sprache anleiten, mit exakten Werten zum Kopieren.

## Testen

Die Tests sind hier keine Formalie, sondern das Sicherheitsnetz für einen
Auftraggeber, der Fehler sonst erst auf dem Handy bemerkt. Drei Ebenen:

1. **Rechenkern** – jede Bandgrenze und jedes Beispiel aus der Vorschrift.
   → `references/rechenkern.md`
2. **Smoke** – App lädt ohne Konsolenfehler, Kernablauf funktioniert, im
   localStorage stehen nur Schlüssel mit dem eigenen Präfix.
3. **Native Funktionen** – die App-Umgebung per `page.addInitScript` mit
   einem falschen `window.Capacitor` nachstellen und prüfen, dass die
   Plugins **wirklich aufgerufen** werden. Genau das deckt die Fehlerklasse
   auf, die im Browser unsichtbar bleibt.

```js
await page.addInitScript(() => {
  window.__calls = [];
  window.Capacitor = { isNativePlatform: () => true, Plugins: {
    Filesystem: { writeFile: async o => { window.__calls.push(o.path); return {}; },
                  getUri: async o => ({ uri: "file:///cache/" + o.path }) },
    Share:      { share: async o => { window.__calls.push("share"); return {}; } }
  } };
});
```

## Referenzdateien

Lies gezielt, was zur Aufgabe passt:

- **`references/architektur.md`** – Codemuster der Module: Edition, Ads,
  Billing, native Brücke (Export/Drucken), Zurück-Taste, Diagnose,
  Projektstruktur. Lies das, bevor du am Code arbeitest.
- **`references/rechenkern.md`** – wie ein Rechenkern aus einer amtlichen
  Vorschrift verifiziert wird: Tabellen als Bilder prüfen, Grenzsemantik,
  Druckfehler, Zweitquelle, Teststrategie.
- **`references/grafiken.md`** – Logo und Icons erzeugen, Farbwert messen,
  Stationsskizzen mit Higgsfield, Store-Grafiken und Screenshots.
- **`references/veroeffentlichung.md`** – AdMob, Play Console (alle
  Formulare mit den konkreten Antworten), Signieren, Upload, Gerätetest.
- **`references/fallstricke.md`** – die Fehler, die schon einmal Zeit
  gekostet haben, mit Ursache und Lösung. **Bei jedem Fehlerbild zuerst hier
  nachsehen**, bevor du selbst zu suchen anfängst.
