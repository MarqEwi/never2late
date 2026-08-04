# Startprompt für die nächste App der Reihe

Dieses Dokument ist zum **Kopieren in einen neuen Thread** gedacht. Es fasst
alles zusammen, was beim Bau von Never2Late gelernt wurde – vor allem die
Fehler, die erst spät aufgefallen sind.

Der App-Name unten (`SkillLog Med`) ist auszutauschen, wenn eine andere App
entsteht. Alles ab „TEIL 2" gilt unverändert für jede Folge-App.

---

# TEIL 1 – Auftrag

Ich baue die fünfte App meiner App-Familie (nach BFT Tool, PFT Tool,
SGT Rechner und Never2Late). Basis ist ein Klon meiner fertigen App
**Never2Late** – bitte füge das Repo hinzu und nutze es als Grundlage.
Never2Late ist die technisch sauberste der bisherigen Apps; alles Wichtige
steckt dort schon drin.

Die neue App heißt **„SkillLog Med"**.

**WICHTIG:** Nach diesem Prompt folgen noch detaillierte Informationen zu
Funktionsumfang, Design und Inhalten. Beginne mit dem Umbau erst, wenn diese
Details da sind – bis dahin: Repo hinzufügen, einlesen, und mir Fragen
stellen, die für die Planung wichtig sind.

## Zuerst lesen: der Skill

Im Repo liegt unter `.claude/skills/mercwerk-app-baukasten/` ein Skill mit den
Learnings der ersten Apps. Lies die SKILL.md komplett und die references
gezielt (`architektur.md` vor dem Codeanfassen, `fallstricke.md` bei jedem
Fehlerbild, `veroeffentlichung.md` für alle Play-Console-Schritte). Was dort
steht, gilt – dieses Dokument ergänzt es um das, was bei Never2Late
dazugekommen ist.

---

# TEIL 2 – Was übernommen und nicht verschlimmbessert wird

- **Self-contained `index.html` ohne Bundler.** Plugins ausschließlich über
  `window.Capacitor.Plugins.<Name>` – `Capacitor.registerPlugin(...)`
  existiert ohne Bundler nicht, und das Modul fällt dann **still** aus.
- **Klar getrennte Ebenen im Code**, wie bei Never2Late:
  `Core` (Fachlogik, DOM-frei und ohne Speicherzugriff, dadurch direkt
  testbar) → `Daten` (versioniertes Schema im localStorage) → `Einst` →
  `Bridge` / `Erinnerungen` / `Kalender` → Oberfläche.
  Der Core wird als `window.<APP>` freigelegt, damit die Tests die Logik
  ohne Klicks prüfen können.
- **Eine einzige Normalisierungsfunktion**, durch die jeder Datensatz beim
  Laden, Speichern und Importieren läuft. Sie ist zugleich der einzige
  Migrationspfad – dadurch braucht ein Schemawechsel keinen zweiten Weg.
- **Native Brücke** für Dateien über `@capacitor/filesystem` +
  `@capacitor/share` (`directory` als String `"CACHE"`; FileProvider mit
  `cache-path` muss im Manifest bleiben). In der WebView funktionieren
  `a.download` und `window.print()` **nicht**, und zwar ohne Fehlermeldung.
- **Zurück-Taste** über `@capacitor/app`: erst oberstes Fenster schließen,
  dann eine Ebene zurück, dann Hinweis „Zum Verlassen erneut ‚Zurück'
  drücken" (2,5-s-Fenster, dann `exitApp`).
- **Werbe- und Kaufmodule als ruhende Infrastruktur** mit je einem Schalter
  (`ADS_CONF.ENABLED`, `Billing.ENABLED`, `Edition.PREMIUM_VERFUEGBAR`).
  In V1 abgeschaltet, kein Netzverkehr, nirgends sichtbar.
- **patch-package mit postinstall**, Node-Sync-Skripte statt Unix-Befehlen,
  Capacitor-Dateien bleiben im Git, Signierung über `keystore.properties`
  (gitignored, Vorlage liegt bei), Service Worker nur im Web.
- **Versteckte Diagnose-Statuszeilen** (5× auf die Versionsnummer tippen).
  Grundregel: **kein stiller Fehlschlag.**

---

# TEIL 3 – Umbenennungs-Checkliste

| Was | Hinweis |
|---|---|
| App-Name, Titel, alle Texte | auch `manifest.webmanifest`, `strings.xml`, README, Datenschutzseite |
| App-ID `de.mercwerk.<name>` | **keine Bindestriche** – in Android-App-IDs unzulässig, und nach dem ersten Upload nie mehr änderbar |
| Java-Paketordner + `MainActivity` | Ordner umziehen, `package`-Zeile anpassen, alten Ordner löschen |
| **localStorage-Präfix** | kritisch: alle Web-Versionen teilen unter `marqewi.github.io` dieselbe Origin. Ein Test soll prüfen, dass nur eigene Präfixe vorkommen. |
| Cache-Name im Service Worker | aus demselben Grund |
| Logo, Icons, **Splash-Screens** | siehe Fallstrick 1 – der Splash wird gern vergessen |
| Adaptive-Icon-Hintergrund | Farbe **aus dem fertigen Logo messen**, nicht schätzen |
| `versionCode` 1, `versionName` 1.0.0 | zurücksetzen |
| GitHub Pages + Datenschutz-URL | ergibt sich aus dem Repo-Namen |
| Store-Texte, Screenshots | bewusst neu denken – „wiederholter Inhalt" ist bei fünf Apps desselben Kontos das größte Ablehnungsrisiko |

---

# TEIL 4 – Fallstricke aus Never2Late

Das hier ist der eigentliche Wert dieses Dokuments. Jeder Punkt hat echte
Zeit gekostet oder wäre beinahe in die Veröffentlichung gerutscht.

## Grafik und Store

**1. Der Splash-Screen stammte noch von der übernächsten Vorgänger-App.**
Beim Klon des SGT Rechners zeigte `drawable*/splash.png` immer noch „Physical
Fitness Test" – zwei Apps zurück. Beim Rebranding also **alle** `splash.png`
in `drawable`, `drawable-port-*` und `drawable-land-*` ersetzen (11 Dateien).
Ein Skript, das sie aus dem Logo erzeugt, lohnt sich.

**2. Die Feature-Grafik hatte 1176×500 statt 1024×500.**
Der Schriftzug lief aus dem Rahmen, dadurch wuchs das Element mit –
`locator.screenshot()` erfasst die *tatsächliche* Breite, nicht die gesetzte.
Google verlangt die Maße auf den Pixel genau und hätte abgelehnt.
→ `overflow:hidden` plus schrumpffähiger Textblock (`flex:1; min-width:0`),
und **nach dem Erzeugen die Maße jeder Grafik nachmessen**.

**3. Screenshots zeigten das US-Datumsformat.**
Chromium formatiert `<input type="date">` nach der **System-Locale des
Prozesses**. Die Locale des Playwright-Kontexts genügt nicht, `--lang` allein
auch nicht. Nötig ist `env: { LANG: "de_DE.UTF-8", LC_ALL: "de_DE.UTF-8" }`
beim Start des Browsers.

**4. Die Play Console heißt auf Deutsch anders, als man sucht.**
„Produktivität" heißt dort **„Effizienz"**. Die Tag-Liste ist fest vorgegeben;
Tags beeinflussen, mit welchen Apps verglichen wird – also sparsam und genau
wählen. „Gesundheit & Fitness" und „Medizin" **nur** wählen, wenn die App
wirklich dorthin gehört: beide lösen zusätzliche Prüfungen und
Nachweispflichten aus.

## Android und Play Console

**5. Die Werbe-ID-Berechtigung kommt ungefragt mit.**
Das AdMob-Plugin zieht `play-services-ads` mit, und dieses Google-SDK trägt
`com.google.android.gms.permission.AD_ID` von sich aus ins zusammengeführte
Manifest ein – **auch wenn die Werbung abgeschaltet ist**. Die Play Console
verlangt dann eine Erklärung zur Werbe-ID, und die Angabe „keine
Datenerhebung" wäre nicht mehr stimmig.
→ Ohne Werbung ausdrücklich entfernen:
```xml
<manifest xmlns:tools="http://schemas.android.com/tools">
  <uses-permission android:name="com.google.android.gms.permission.AD_ID"
      tools:node="remove" />
```
Wird Werbung später aktiviert, muss die Zeile wieder raus.

**6. `releaseType` gehört auf `AAB`.** Der Play Store nimmt seit 2021 keine
APKs mehr an.

**7. Der `versionCode` muss bei *jedem* Upload steigen** – auch zwischen zwei
Uploads in denselben internen Test.

**8. „Clone Repository" in Android Studio funktioniert für dieses Projekt
nicht.** Zwei Gründe: Das Android-Projekt liegt im Unterordner `android/`
(die Wurzel enthält kein Gradle-Projekt), und `capacitor.settings.gradle`
verweist auf `../node_modules/...`, das nicht im Git liegt. Ohne
`npm install` scheitert der Gradle-Sync sofort.
→ Richtige Reihenfolge: `git clone` → `npm install` → `npm run cap:sync` →
**den Ordner `android` öffnen**, nicht die Wurzel.

## Fachlogik

**9. Wiederkehrende Termine dürfen nicht von selbst weiterrollen.**
Wer einen jährlichen Nachweis versäumt hat, muss ihn als „abgelaufen" sehen –
nicht als „in 11 Monaten fällig". Erst eine ausdrückliche Erledigt-Aktion
setzt den nächsten Zyklus, und zwar **auf denselben Kalendertag**, auch wenn
mehrere Zyklen ausgefallen sind.

**10. Statusschwelle und Meldung müssen zusammen umspringen.**
„Bald fällig" hängt an der **frühesten aktiven Erinnerung**, nicht an einem
festen Wert. Sonst erinnert die App an etwas, das in der Liste noch als
„Aktiv" steht. Nur wenn es gar keine Erinnerung gibt, greift ein Schwellwert
aus den Einstellungen.

**11. Monate addieren muss aufs Monatsende kappen.**
31.01. + 1 Monat = 28.02. Und alle Datumsrechnung in UTC-Tagen, sonst
verschiebt die Sommerzeit eine Tagesdifferenz.

**12. Datumsstrings streng prüfen.** `new Date(2026, 1, 31)` rollt still auf
den 3. März. Nach dem Parsen zurückrechnen und vergleichen.

## Erinnerungen

**13. Die Kennungen müssen stabil sein**, abgeleitet aus Datensatz und
Vorlaufzeit. Dann *ersetzt* eine Neuplanung den alten Alarm, statt einen
zweiten danebenzulegen.

**14. Nach jeder Änderung und bei jedem Start komplett neu planen.**
Der Speicher ist die einzige Wahrheit.

**15. Das Datumsformat des Plugins:** Die Android-Seite erwartet
`yyyy-MM-dd'T'HH:mm:ss.SSS'Z'` in UTC. Genau das entsteht, wenn die
Capacitor-Brücke ein `Date`-Objekt per `JSON.stringify` überträgt – hier ist
also nichts zu tun, aber es ist gut, es geprüft zu haben.

**16. Zeigen, was das System wirklich vorgemerkt hat.**
Die eigene Buchführung beweist nichts – sie sagt nur, was abgeschickt wurde.
`getPending()` abfragen und die Zahl **sichtbar in den Einstellungen**
anzeigen („12 Erinnerungen vorgemerkt, nächste am …"). Steht dort 0, obwohl
Daten vorhanden sind, sieht man den Fehler sofort. **Ohne diese Anzeige
bleibt ein Ausfall unbemerkt, bis sich ein Nutzer meldet.**

**17. Eine Probe-Benachrichtigung einbauen** („kommt in 10 Sekunden").
Sonst dauert jede Fehlersuche einen Tag. Sie braucht eine eigene Kennung und
muss beim Neuplanen ausgenommen werden, sonst löscht man sie vor dem
Auslösen wieder.

**18. Exakte Alarme nicht anfordern**, solange Tagesgenauigkeit reicht. Das
Plugin fällt von selbst auf ungenaue Alarme zurück, und die Berechtigung wird
von Google genauer geprüft.

## Oberfläche

**19. Inline-Elemente in Flex-Zeilen brauchen `display:block`.**
Zwei `<span>` untereinander laufen sonst nebeneinander und aus der Zeile
heraus – mitsamt `text-overflow: ellipsis`, das dann nichts tut.

**20. CSS-Reihenfolge schlägt Absicht.** Eine allgemeine Feldregel weiter
unten überschrieb das Innenpolster des Suchfelds, sodass die Lupe im Text lag.
Bei gleicher Spezifität gewinnt die spätere Regel – im Zweifel spezifischer
auswählen und **kommentieren, warum**.

**21. Ein schwebender Aktionsknopf verdeckt die letzte Listenzeile.**
Besser mittig in die untere Leiste setzen.

**22. Durchscheinende Leisten brauchen hohe Deckkraft.**
`backdrop-filter` fehlt in älteren WebViews; mit 88 % Deckkraft liest sich der
Inhalt darunter durch. 96–97 % sieht überall gut aus.

## Emoji

**23. Länderflaggen bestehen aus zwei Regional-Indikatoren.** Eine naive
Graphem-Erkennung schneidet 🇩🇪 nach dem ersten Zeichen ab. Ebenso beachten:
Variantenselektoren, Hauttöne, ZWJ-Folgen und Tag-Zeichen.

**24. `maxlength` in Zeichen ist nicht `maxlength` in Emoji.**
👨‍👩‍👧‍👦 braucht 11 UTF-16-Einheiten, 🏴󠁧󠁢󠁥󠁮󠁧󠁿 sogar 16.

**25. Nicht jedes Gerät kennt jedes Emoji.** Fehlendes erscheint als leeres
Kästchen. Per Canvas messen: Ein darstellbares Emoji ist so breit wie ein
sicher vorhandenes, und eine Verbundfolge muss zu einem Zeichen verschmelzen.
Was durchfällt, ausblenden – und beim Zweifel lieber alles zeigen als
fälschlich alles ausblenden.

**26. Der Emoji-*Stil* kommt vom Gerät**, nicht von der App: Noto auf
Android, Segoe auf Windows, Apple auf iOS. Ein eigener Stil kostet 8–14 MB
für den vollen Satz. Auf Android sieht die Systemschrift gut aus und altert
nicht – im Zweifel nichts mitliefern.

## Daten und Tests

**27. Ladereihenfolge beachten.** Nutzerdefinierte Stammdaten (eigene
Kategorien o. Ä.) müssen **vor** den Datensätzen geladen werden, sonst
verwirft die Normalisierung deren IDs als unbekannt. Dasselbe gilt beim
Import.

**28. Die Sicherungsdatei muss die Stammdaten enthalten**, sonst zeigen
wiederhergestellte Datensätze auf IDs, die es nicht gibt – und fallen still
auf einen Ersatzwert zurück.

**29. Der Testersatz muss sich wie das echte Plugin verhalten.**
Mein Ersatz leerte beim `cancel` die ganze Liste statt nur der genannten
Kennungen und ersetzte beim `schedule` alles statt zu überschreiben und zu
ergänzen. Dadurch hätte kein Test bemerkt, dass die Probe-Benachrichtigung
mitgelöscht wird. **Ein Testersatz, der freundlicher ist als die Wirklichkeit,
ist schlimmer als keiner.**

**30. Nach dem Veröffentlichen die ausgelieferten Dateien prüfen.**
Herunterladen, mit dem lokalen Stand vergleichen und die Testsuite **gegen
genau diese Dateien** laufen lassen. Das deckt Auslieferungs- und Cache-
Probleme auf, die lokal unsichtbar sind.

**31. Die Zurück-Taste funktioniert nur in der App.**
Im Browser gibt es kein `backButton`-Ereignis; dort verlässt die Geste sofort
die Seite, mit offenem Dialog und allem. Für gleiches Verhalten einen
History-Puffereintrag anlegen, ihn in `popstate` abfangen und neu setzen –
und darauf achten, dass man die Seite am Ende **auch wieder verlassen kann**.

---

# TEIL 5 – Arbeitsweise

- **Kleine Schritte:** je Änderung Branch → PR mit deutscher Beschreibung →
  merge. Die Beschreibung erklärt *warum*, nicht nur *was*.
- **Nach jeder Änderung** Playwright-Tests und Konsolen-Check. Vorinstalliertes
  Chromium unter `/opt/pw-browsers/chromium`, `executablePath` in der Config –
  **kein `playwright install`**.
- **Tests decken auch die nativen Zweige ab:** App-Umgebung per
  `page.addInitScript` nachstellen und prüfen, dass die Plugins **wirklich
  aufgerufen** werden.
- **`npm run cap:sync` vor jedem Commit.**
- **Vorschau-Screenshots schicken**, sobald sich optisch etwas ändert.
- **Bei allen PC-, AdMob- und Play-Console-Schritten einzeln und in einfacher
  Sprache anleiten** – ich bin kein Programmierer. Immer die exakten Werte zum
  Kopieren mitgeben.
- **`docs/veroeffentlichung.md` an die neue App anpassen** – das ist meine
  Klick-Anleitung.
- **Prüfen statt annehmen.** Fast jeder Punkt in Teil 4 wurde gefunden, weil
  nachgemessen statt vermutet wurde.

---

# TEIL 6 – Was ich dir als Nächstes schicke

Es folgen: Ziel der App, Zielgruppe, Datenmodell, Screens, Design und
Farbwelt, sowie was ausdrücklich **nicht** in V1 gehört.

Bis dahin bitte nur das Repo einlesen und mir deine Fragen stellen.
