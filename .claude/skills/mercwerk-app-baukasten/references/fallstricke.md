# Fallstricke

Fehler, die in diesem Projekt schon einmal Zeit gekostet haben. Bei einem
neuen Fehlerbild lohnt sich zuerst ein Blick hierher.

Die gefährlichsten haben eines gemeinsam: **sie melden sich nicht**. Im
Browser läuft alles, in der App passiert nichts, und niemand merkt es, bis
ein Nutzer es meldet. Deshalb die Grundregel: Jeder Zweig, der fehlschlagen
kann, meldet sich – dem Nutzer oder mindestens in der Diagnosezeile.

## Capacitor und die WebView

**`a.download` funktioniert in der Android-WebView nicht.** Ein Blob-Download
wird schlicht ignoriert – ohne Fehler. Dateien müssen über
`@capacitor/filesystem` in den Cache geschrieben und über `@capacitor/share`
ausgegeben werden.

**`window.print()` ist in der WebView eine leere Funktion.** Es gibt keinen
Druckdialog. Ersatz: die Liste als PDF erzeugen und teilen; das System-Menü
bietet Drucken an. Den Knopf entsprechend beschriften.

**`Capacitor.registerPlugin(...)` existiert ohne Bundler nicht.** Wird es
verwendet, fällt das ganze Modul still aus. Plugins immer über
`window.Capacitor.Plugins.<Name>` holen.

**Enums aus Plugin-Paketen sind ohne Bundler nicht verfügbar.** Statt
`Directory.Cache` den String `"CACHE"` übergeben – die Plugins erwarten
ohnehin die String-Werte.

**Das Share-Plugin braucht einen passenden FileProvider.** Es nutzt die
Authority `getPackageName() + ".fileprovider"`. Im `AndroidManifest.xml` muss
genau dieser Provider deklariert sein und die `file_paths.xml` einen
`<cache-path path="." />`-Eintrag haben, sonst gibt es eine
Security-Exception.

**Ein abgebrochenes Teilen-Menü wirft einen Fehler.** Das ist kein Fehler,
sondern eine Nutzerentscheidung – am Text (`cancel`, `abort`) erkennen und
schlucken, sonst erscheint eine unsinnige Meldung.

**Eine tote Brücke sieht aus wie eine funktionierende.** Ein Aufruf auf
`window.XxxNative` fällt stillschweigend auf den Web-Weg zurück, wenn es das
Objekt nicht gibt. Beim Übernehmen von Code aus einer Vorgänger-App prüfen,
ob der native Zweig dort überhaupt jemals implementiert war.

**Ohne eigenen backButton-Listener beendet die Zurück-Geste die App sofort** –
auch aus einem offenen Dialog heraus. Braucht `@capacitor/app`.

## Android-Projekt

**Anwendungs-IDs dürfen keine Bindestriche enthalten.** `de.mercwerk.sgt-rechner`
ist ungültig; korrekt ist `de.mercwerk.sgtrechner`.

**Fehlt die AdMob-App-ID im `AndroidManifest.xml`, stürzt die App beim Start
ab.** Auch im Testbetrieb muss dort eine ID stehen – notfalls Googles
Test-App-ID.

**`local.properties` fehlt nach einem frischen Klon.** Sie ist gitignored und
enthält den SDK-Pfad. Android Studio meldet dann „Unable to continue until an
Android SDK is specified" – im Dialog den vorhandenen SDK-Pfad angeben
(meist `C:\Users\<name>\AppData\Local\Android\Sdk`), fertig.

**Beim Umbenennen der App den Java-Paketordner mit umziehen** und die
`package`-Zeile in `MainActivity.java` anpassen; den alten Ordner löschen.

**`versionCode` muss bei jedem Upload steigen.** Sonst lehnt die Play Console
ab. Sind mehrere Änderungen noch nicht hochgeladen, gehen sie in einem Build
raus – dann steigt er nur einmal.

## Web-Version und Daten

**Alle Web-Versionen teilen unter `<konto>.github.io` dieselbe Origin.** Die
localStorage-Schlüssel müssen deshalb je App ein eigenes Präfix haben
(`bft_`, `pft_`, `sgt_`), sonst überschreiben sich die Apps gegenseitig die
Daten. Ein Test, der prüft, dass nur eigene Präfixe vorkommen, kostet nichts.

**Der Service-Worker-Cache-Name gehört ebenfalls je App eigen benannt** –
aus demselben Grund.

**Service Worker nur im Web registrieren** (github.io-Prüfung), nie in der
App: dort führt er nur zu veralteten Ständen.

## Oberfläche

**Data-URIs nicht zweimal einbetten.** Sollen dieselben Bilder an zwei
Stellen erscheinen, das Element per ID referenzieren und den `src` zur
Laufzeit übernehmen. Bei ~30 KB je Bild summiert sich das sonst schnell.

**Beim Vergeben von IDs an Bilder aufpassen, welche man erwischt.** Die
Original-Abbildungen aus der Vorschrift stehen im selben Markup-Muster wie
die eigenen Skizzen, nur innerhalb von `<details class="subdetails">`.

**Ein zentriertes Element mit `left:50%` + `translateX(-50%)` bekommt nur die
halbe Bildschirmbreite** zur Verfügung gestellt und bricht dadurch unnötig
um. Stattdessen `left/right` setzen und `margin:0 auto` mit
`width:fit-content` kombinieren.

**Beim Umbau eines Modus alle abhängigen Stellen mitnehmen**: Eingabefelder,
Ergebnisanzeige, Verlauf, Prüfermodus, Editor-Dialoge, Exporte, Info-Texte,
Onboarding, Einstellungen und Tests. Eine Suche nach den alten Feld-IDs deckt
Reste zuverlässig auf.

## Play Console

**Der Store-Titel ist auf 30 Zeichen begrenzt** – vorher zählen.

**Das Produktsymbol darf keinen Text und kein Branding enthalten.** Das
App-Icon mit Schriftzug ist dort also nicht zulässig.

**Produkt-ID und Kaufoptions-ID haben unterschiedliche Regeln**: Die
Produkt-ID erlaubt Unterstriche (`premium_unlock`), die Kaufoptions-ID nur
Bindestriche (`premium-unlock`).

**Die Produkt-ID lässt sich nach dem Anlegen nicht mehr ändern** und muss
exakt der im Code entsprechen.

**Der interne Test verlangt mindestens einen Tester**, sonst lässt sich der
Release nicht starten.

**Ohne eingetragenen Lizenztester kostet ein Testkauf echtes Geld.**

**Neue AdMob-Apps liefern anfangs „code 3 / not approved".** Normale
Prüfzeit, kein Fehler – und kein neuer Build nötig, wenn die IDs schon
eingebaut sind.

**„Wiederholter Inhalt" ist bei einer Familie ähnlicher Apps das größte
Ablehnungsrisiko.** Store-Texte, Screenshots und Anleitungen bewusst neu
denken statt variieren.

## Werkzeuge und Umgebung

**Eine als Administrator geöffnete Eingabeaufforderung startet in
`C:\Windows\System32`.** Wird dort geklont, liegt das Projekt im
Windows-Systemordner – Gradle und Virenscanner machen daraus schwer
verständliche Rechtefehler. Projekte gehören unter `C:\Users\<name>\...`.

**Unix-Befehle in npm-Skripten scheitern unter Windows still.** Deshalb
Node-Skripte für Kopieraktionen.

**`npm install` nicht überspringen, wenn sich `package.json` geändert hat** –
sonst fehlen neue Plugins und `patch-package` läuft nicht, was zu einem
Build-Fehler im AdMob-Plugin führt.

**Playwright: kein `playwright install`.** Das vorinstallierte Chromium unter
`/opt/pw-browsers/chromium` per `executablePath` in der Config nutzen.

**PDF-Seiten als Bild rendern braucht `poppler-utils`** (`pdftoppm`). Ist es
nicht vorhanden, vorher installieren – Textextraktion allein reicht für
Tabellen nicht.

**Lange Commit-Nachrichten mit Sonderzeichen besser über eine Datei
übergeben** (`git commit -F datei`), sonst zerlegt die Shell sie unter
Umständen.
