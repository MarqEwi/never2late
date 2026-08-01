# Veröffentlichung Schritt für Schritt (Never2Late)

Einfache Checkliste für alles, was außerhalb des Codes zu tun ist. Reihenfolge
einhalten – jeder Block ist unabhängig abhakbar.

**Wichtig für diese App:** Never2Late V1 hat **keine Werbung und keine Käufe**.
Die Schritte, die es bei den Fitness-Apps für AdMob und das Kaufprodukt gab,
entfallen hier komplett. Was du dafür später bräuchtest, steht ganz unten unter
„Später: Monetarisierung“ – jetzt ist dort nichts zu tun.

## 1. GitHub Pages aktivieren (Web-Version + Datenschutz-URL)

1. Im Browser das Repo öffnen: `github.com/MarqEwi/never2late`
2. Oben auf **Settings** → links auf **Pages**
3. Bei „Build and deployment“: **Deploy from a branch** wählen,
   Branch **main**, Ordner **/ (root)** → **Save**
4. Nach 1–2 Minuten ist die App erreichbar unter
   `https://marqewi.github.io/never2late/`
   und die Datenschutzerklärung unter
   `https://marqewi.github.io/never2late/datenschutz.html`

Die zweite Adresse brauchst du gleich in der Play Console. Ruf sie einmal auf
und prüf, dass die Seite wirklich erscheint – Google prüft das auch.

## 2. Play Console: App anlegen

1. [play.google.com/console](https://play.google.com/console) öffnen →
   **App erstellen**
2. Ausfüllen:
   - App-Name: **Never2Late – Ablaufdaten** (24 Zeichen, erlaubt sind 30)
   - Standardsprache: **Deutsch (Deutschland)**
   - App oder Spiel: **App**
   - Kostenlos oder kostenpflichtig: **Kostenlos**
3. Store-Eintrag ausfüllen (**Wachstum → Store-Präsenz → Haupt-Store-Eintrag**).
   Alle Texte stehen fertig in `docs/store-texte.md` zum Kopieren:
   - Kurzbeschreibung und vollständige Beschreibung von dort einfügen
   - App-Symbol: `icons/icon-512.png`
   - Feature-Grafik: `docs/store-grafiken/feature-grafik-1024x500.png`
   - Telefon-Screenshots: die sechs Dateien aus `docs/store-grafiken/`
     (`screenshot-1…6-1080x1920.png`)
   - Kategorie: **Produktivität**
4. Datenschutz-URL eintragen:
   `https://marqewi.github.io/never2late/datenschutz.html`

## 3. Die Formulare unter „Richtlinien → App-Inhalte“

Hier ist Never2Late angenehm schnell abgehakt, weil die App nichts sammelt:

| Formular | Antwort |
|---|---|
| Datenschutzerklärung | die URL aus Schritt 1 |
| Anzeigen | **Nein**, die App enthält keine Werbung |
| App-Zugriff | Alle Funktionen ohne Einschränkung verfügbar (kein Login) |
| Inhaltseinstufung | Fragebogen ausfüllen, alles verneinen → „Ab 0 Jahren“ |
| Zielgruppe | **18 und älter**; „Für Kinder gedacht“: **Nein** |
| Werbe-ID | **Nein**, die App verwendet keine Werbe-ID |
| Datensicherheit | siehe unten – die wichtigste Antwort ist ein Nein |
| Staatliche App | Nein |
| Finanzfunktionen | Nein |
| Gesundheits-Apps | Nein |

**Datensicherheit im Detail:** Auf die erste Frage „Erhebt oder teilt deine App
die erforderlichen Nutzerdatentypen?“ antwortest du **Nein**. Danach ist das
Formular fertig. Alles bleibt auf dem Gerät, es gibt keinen Server.

Die Berechtigung für **Benachrichtigungen** ist dabei keine Datenerhebung – die
Erinnerungen werden komplett auf dem Handy berechnet. An der
Datensicherheits-Erklärung ändert sie also nichts.

**Zur Werbe-ID:** Das AdMob-Plugin zieht `play-services-ads` mit, und dieses
Google-SDK trägt die Berechtigung `AD_ID` von sich aus ins Manifest ein – auch
wenn die Werbung abgeschaltet ist. Damit die Angabe „keine Werbe-ID" stimmt,
wird die Berechtigung im `AndroidManifest.xml` ausdrücklich wieder entfernt
(`tools:node="remove"`). Ohne das verlangt die Play Console eine Erklärung zur
Werbe-ID, und die Antwort „keine Datenerhebung" wäre nicht mehr stimmig.

## 4. Signieren & hochladen (Android Studio)

### 4.1 Projekt auf den PC holen und vorbereiten

1. Ordner für das Projekt wählen und in der Eingabeaufforderung (cmd) öffnen.
   **Nicht** in einer als Administrator geöffneten Eingabeaufforderung
   arbeiten – die startet in `C:\Windows\System32`, und dort gibt es später
   schwer verständliche Rechtefehler. Ein Ordner unter `C:\Users\<dein Name>\`
   ist richtig.

   Beim **ersten Mal** klonen:
   ```
   git clone https://github.com/MarqEwi/never2late.git
   cd never2late
   ```
   Wenn der Ordner schon existiert, stattdessen nur aktualisieren:
   ```
   cd never2late
   git checkout main
   git pull
   ```
2. Abhängigkeiten installieren (beim ersten Mal und immer, wenn sich
   `package.json` geändert hat). Das `postinstall` mit patch-package läuft dabei
   automatisch mit:
   ```
   npm install
   ```
3. Web-Dateien in die App kopieren – **vor jedem Build**:
   ```
   npm run cap:sync
   ```

### 4.2 Keystore hinterlegen (einmalig pro PC)

1. Die vorhandene Keystore-Datei (**derselbe Schlüssel wie bei BFT, PFT und
   SGT – niemals einen neuen erzeugen**) in den Ordner `android/` kopieren,
   z. B. als `android.keystore`.
2. Im Ordner `android/` die Datei `keystore.properties.example` kopieren und die
   Kopie in `keystore.properties` umbenennen (die Endung `.example` entfällt).
3. Diese Datei im Editor öffnen und die vier Werte eintragen:
   ```
   storeFile=android.keystore
   storePassword=<Keystore-Passwort>
   keyAlias=<Alias des Schlüssels>
   keyPassword=<Passwort des Schlüssels>
   ```
   `keystore.properties` und `*.keystore` stehen in `.gitignore` und landen
   deshalb nie auf GitHub.

### 4.3 Signiertes App Bundle bauen

1. Android Studio öffnen (aus dem Projektordner heraus geht auch
   `npm run cap:open`) und den Ordner `android` als Projekt laden.
   Beim ersten Start dauert die Gradle-Synchronisierung ein paar Minuten.
   Meldet Android Studio „Unable to continue until an Android SDK is
   specified“, im Dialog den vorhandenen SDK-Pfad angeben (meist
   `C:\Users\<dein Name>\AppData\Local\Android\Sdk`).
2. Menü **Build → Generate Signed App Bundle / APK…**
3. **Android App Bundle** auswählen → *Next*.
4. Keystore-Angaben eintragen (dieselben wie in `keystore.properties`):
   Key store path, Passwörter, Alias → *Next*.
5. Build-Variante **release** wählen → *Create*.
6. Nach dem Build erscheint unten rechts eine Meldung mit „locate“. Die Datei
   liegt unter:
   ```
   android/app/release/app-release.aab
   ```

### 4.4 In der Play Console hochladen

1. Play Console → deine App → links **Testen und veröffentlichen → Tests →
   Interner Test**.
2. **Neuen Release erstellen**.
3. Beim ersten Mal fragt Google nach der **Play App-Signatur**: die
   Standardeinstellung („Von Google Play verwalteter Signaturschlüssel“)
   einfach bestätigen. Dein Keystore ist dann der Upload-Schlüssel.
4. Die Datei `app-release.aab` hochladen.
5. Unter „Versionshinweise“ z. B. eintragen:
   `Erste Version von Never2Late.`
6. **Speichern → Release überprüfen → Freigabe starten**.

Der interne Test verlangt mindestens **einen Tester**, sonst lässt sich der
Release nicht starten. Trag dich unter „Tester“ selbst ein.

### 4.5 Bei jedem weiteren Upload

In `android/app/build.gradle` den `versionCode` um 1 erhöhen (steht aktuell auf
`2`), bei sichtbaren Änderungen zusätzlich den `versionName` anpassen. Danach
wieder `npm run cap:sync` und neu bauen. Sind mehrere Änderungen noch nicht
hochgeladen, gehen sie in einem Build raus – dann steigt der `versionCode` nur
einmal.

## 5. Auf dem Handy testen

Im internen Test den **Einladungslink** öffnen (Reiter „Tester“), auf dem Handy
mit demselben Google-Konto annehmen und die App installieren. Dann durchgehen:

- App startet ohne Absturz
- Einführung erscheint, danach fragt die App nach der Erlaubnis für
  **Benachrichtigungen** → **Zulassen** tippen
- Einen Testeintrag anlegen mit einem Datum in **2 Tagen** und einer Erinnerung
  **1 Tag vorher** – am nächsten Morgen um 9 Uhr muss die Benachrichtigung
  kommen
- Bei einem Eintrag **„In Kalender“** antippen: das Teilen-Menü öffnet sich und
  die Kalender-App übernimmt den Termin
- **Einstellungen → Daten sichern**: das Teilen-Menü öffnet sich, Datei z. B. in
  Google Drive ablegen; danach **Daten wiederherstellen** mit derselben Datei
- Zurück-Taste: schließt erst offene Fenster, geht dann eine Ebene zurück und
  verlangt auf der Startseite zweimaliges Drücken zum Verlassen
- Handy neu starten und prüfen, dass die Erinnerung trotzdem noch kommt (das
  Plugin stellt geplante Erinnerungen nach einem Neustart wieder her)

**Wenn etwas nicht geht:** In den Einstellungen **5× auf die Versionsnummer
tippen**. Darunter erscheinen dann Statuszeilen für Erinnerungen, Export,
Werbung und Käufe. Schick mir den Text dieser Zeilen – daraus lässt sich meist
sofort erkennen, woran es liegt.

## 6. In die Produktion veröffentlichen

1. Play Console → **Testen und veröffentlichen → Produktion → Neuen Release
   erstellen**.
2. Statt neu hochzuladen: **„App-Bundles hinzufügen“ → aus der Bibliothek** das
   bereits hochgeladene Bundle auswählen. Alternativ den internen Test über
   **„Release hochstufen → Produktion“** direkt übernehmen.
3. Länder/Regionen auswählen (z. B. Deutschland, Österreich, Schweiz).
4. Versionshinweise eintragen, **Speichern → Release überprüfen → Freigabe
   starten**.
5. Die Prüfung durch Google dauert bei neuen Apps üblicherweise einige Stunden
   bis wenige Tage.

Hinweis: Falls die Play Console vor der Produktion einen **geschlossenen Test
mit 12 Testern über 14 Tage** verlangt, betrifft das neuere private
Entwicklerkonten. Dann zuerst diesen Test durchlaufen lassen; an der App selbst
ändert sich dadurch nichts.

## 7. Später: Monetarisierung (jetzt nichts zu tun)

V1 ist bewusst ohne Werbung und ohne Kauf. Der Code dafür liegt vorbereitet
bereit und ist über je einen Schalter abgeschaltet. Wenn du das später
aktivieren willst, sind das die Schritte – **erst dann**, nicht jetzt:

1. **AdMob:** auf [admob.google.com](https://admob.google.com) im selben Konto
   eine neue App **Never2Late** anlegen. Die App-ID (`ca-app-pub-…~…`) ersetzt
   im `android/app/src/main/AndroidManifest.xml` die dort eingetragene
   Google-Test-App-ID. **Dieser Eintrag darf nie leer sein – fehlt er, stürzt
   die App beim Start ab.** Dann einen Banner-Block anlegen und dessen ID
   (`ca-app-pub-…/…`) in `index.html` bei `ADS_CONF.BANNER_ID` eintragen,
   `ADS_CONF.ENABLED` auf `true` und `TESTING` auf `false` setzen.
   Neue AdMob-Apps liefern anfangs oft „code 3 / not approved“ – das ist die
   normale Prüfzeit und kein Fehler.
2. **Kaufprodukt:** In der Play Console unter **Monetarisieren → Produkte →
   In-App-Produkte** ein Produkt mit der Produkt-ID `premium_unlock` anlegen
   (mit Unterstrich) und darin eine Kaufoption mit der ID `premium-unlock`
   (mit Bindestrich – Unterstriche sind dort nicht erlaubt). Im Code dann
   `Billing.ENABLED` und `Edition.PREMIUM_VERFUEGBAR` auf `true` setzen.
   Die Produkt-ID lässt sich nach dem Anlegen **nicht mehr ändern**.
3. **Werbe-ID wieder zulassen:** Im `android/app/src/main/AndroidManifest.xml`
   die Zeile mit `com.google.android.gms.permission.AD_ID` und
   `tools:node=”remove”` **löschen**. Sonst bekommt das SDK die Werbe-ID nicht
   und die Anzeigen bleiben leer.
4. **Datenschutzerklärung und Formulare anpassen:** Mit Werbung ändern sich
   mehrere Angaben. In `datenschutz.html` muss wieder ein Abschnitt zu AdMob
   hinein; im Formular „Anzeigen” wird aus dem Nein ein Ja, bei „Werbe-ID”
   ebenfalls, und in der Datensicherheit ist dann „Geräte- oder andere IDs”
   als erhoben anzugeben.
5. **Lizenztester eintragen**, sonst kostet ein Testkauf echtes Geld:
   Play Console → Haus-Symbol (Alle Apps) → **Einstellungen → Lizenztests** →
   eigene Google-Adresse hinzufügen → **RESPOND_NORMALLY**.
