# Veröffentlichung Schritt für Schritt (SGT Rechner)

Einfache Checkliste für alle Schritte außerhalb des Codes. Reihenfolge einhalten –
jeder Block ist unabhängig abhakbar.

## 1. GitHub Pages aktivieren (Web-Version + Datenschutz-URL)

1. Im Browser das Repo öffnen: `github.com/MarqEwi/sgt-rechner`
2. Oben auf **Settings** → links auf **Pages**
3. Bei „Build and deployment“: **Deploy from a branch** wählen,
   Branch **main**, Ordner **/ (root)** → **Save**
4. Nach 1–2 Minuten ist die App unter `https://marqewi.github.io/sgt-rechner/`
   erreichbar – und die Datenschutzerklärung unter
   `https://marqewi.github.io/sgt-rechner/datenschutz.html`
   (diese URL brauchst du später in der Play Console)

## 2. AdMob: neue App + Banner anlegen

1. Auf [admob.google.com](https://admob.google.com) anmelden (gleiches Konto wie BFT/PFT)
2. **Apps → App hinzufügen** → Plattform **Android** →
   „Ist die App bei Google Play gelistet?“ → **Nein** (sie ist ja noch nicht veröffentlicht)
3. App-Name: **SGT Rechner** → anlegen
4. Die neue **App-ID** kopieren (Format `ca-app-pub-…~…`) →
   in `android/app/src/main/AndroidManifest.xml` die Test-ID ersetzen
5. In der neuen App: **Anzeigenblöcke → Anzeigenblock hinzufügen → Banner**,
   Name z. B. „SGT Banner unten“ → anlegen
6. Die **Banner-Block-ID** kopieren (Format `ca-app-pub-…/…`) →
   in `index.html` bei `ADS_CONF` eintragen und `TESTING: false` setzen
7. **Datenschutz & Mitteilungen** → DSGVO-Meldung für die neue App aktivieren,
   Option „Nicht einwilligen“ einschalten
8. Wichtig: Neue AdMob-Apps liefern anfangs oft „code 3 / not approved“ –
   das ist die normale Prüfzeit (Stunden bis wenige Tage). Solange laufen
   keine echten Anzeigen; die App funktioniert trotzdem.

## 3. Play Console: App anlegen

1. [play.google.com/console](https://play.google.com/console) → **App erstellen**
2. Name: **SGT Soldaten-Grundfitness-Tool** (exakt 30 Zeichen) ·
   Sprache Deutsch · **App** · **Kostenlos**
3. Store-Eintrag: Texte aus `docs/store-texte.md` einfügen,
   Icon `icons/icon-512.png`, Feature-Grafik 1024×500 mit Hintergrund **#5C663B**
4. **Data Safety** ausfüllen (siehe Kurzreferenz in `docs/store-texte.md`);
   „Gesundheit und Fitness“ NICHT ankreuzen
5. Anzeigen: **Ja** · Werbe-ID: **Ja** · Zielgruppe: **18+**
6. Datenschutz-URL: `https://marqewi.github.io/sgt-rechner/datenschutz.html`

## 4. Einmalkauf-Produkt anlegen

Play Console → deine App → **Monetarisieren → Produkte → In-App-Produkte** →
**Produkt erstellen**.

**Schritt 1 – Produktdetails:**

| Feld | Wert |
|---|---|
| Produkt-ID | `premium_unlock` (muss exakt so lauten – steht so im Code) |
| Tags | leer lassen |
| Name (max. 55) | `Premium freischalten` |
| Beschreibung (max. 200) | `Entfernt die Werbung, hebt das Limit im Prüfermodus auf und schaltet Export und Druck der Ergebnisliste frei. Einmaliger Kauf, kein Abo.` |
| Symbol | `docs/store-grafiken/produktsymbol-premium-512.png` (optional; enthält bewusst keinen Text und kein Branding – das App-Icon ist hier nicht zulässig) |
| Produktsteuerkategorie | Voreinstellung **Verkäufe digitaler Apps** beibehalten |
| Altersfreigabe | leer lassen (erbt die Einstufung der App) |
| Beschränkungen des Zahlungsortes | unverändert lassen |

**Schritt 2 – Verfügbarkeit und Preisgestaltung:**

1. Kaufoption anlegen mit der ID `premium-unlock`
2. Preis **2,99 €** setzen (Google rechnet die übrigen Währungen automatisch um)
3. Produkt und Kaufoption **aktivieren**

Wichtig: Die Produkt-ID `premium_unlock` steht so in `index.html`
(`Billing.PRODUCT`). Ein Tippfehler führt dazu, dass der Kauf-Knopf in der App
meldet, der Kauf sei nicht verfügbar.

## 5. Signieren & hochladen (Android Studio) – ausführlich

### 5.1 Projekt auf den PC holen und vorbereiten

1. Ordner für das Projekt wählen und in der Eingabeaufforderung (cmd) öffnen.
   Beim **ersten Mal** klonen:
   ```
   git clone https://github.com/MarqEwi/sgt-rechner.git
   cd sgt-rechner
   ```
   Wenn der Ordner schon existiert, stattdessen nur aktualisieren:
   ```
   cd sgt-rechner
   git checkout main
   git pull
   ```
2. Abhängigkeiten installieren (nur nötig, wenn `node_modules` fehlt oder sich
   `package.json` geändert hat). Das `postinstall` mit patch-package läuft
   dabei automatisch mit – es behebt einen Build-Fehler des AdMob-Plugins:
   ```
   npm install
   ```
3. Web-Dateien in die App kopieren – **vor jedem Build**:
   ```
   npm run cap:sync
   ```

### 5.2 Keystore hinterlegen (einmalig pro PC)

1. Die vorhandene Keystore-Datei (derselbe Schlüssel wie bei BFT und PFT –
   **niemals einen neuen erzeugen**, sonst lässt sich die App später nicht mehr
   aktualisieren) in den Ordner `android/` kopieren, z. B. als `android.keystore`.
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

### 5.3 Signiertes App Bundle bauen

1. Android Studio öffnen (aus dem Projektordner heraus geht auch
   `npm run cap:open`) und den Ordner `android` als Projekt laden.
   Beim ersten Start dauert die Gradle-Synchronisierung ein paar Minuten.
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

### 5.4 In der Play Console hochladen

1. Play Console → deine App → links **Testen und veröffentlichen → Tests →
   Interner Test** (empfohlen für den ersten Upload; für die Monetarisierung
   genügt ein Bundle in irgendeinem Track).
2. **Neuen Release erstellen**.
3. Beim ersten Mal fragt Google nach der **Play App-Signatur**: die
   Standardeinstellung („Von Google Play verwalteter Signaturschlüssel“)
   einfach bestätigen. Dein Keystore ist dann der Upload-Schlüssel.
4. Die Datei `app-release.aab` hochladen.
5. Release-Name kann bleiben; unter „Versionshinweise“ z. B. eintragen:
   `Erste Version des SGT Rechners.`
6. **Speichern → Release überprüfen → Freigabe starten**.

Nach diesem Upload kennt die Play Console den Paketnamen
`de.mercwerk.sgtrechner`, und das In-App-Produkt aus Schritt 4 lässt sich
anlegen.

### 5.5 Bei jedem weiteren Upload

In `android/app/build.gradle` den `versionCode` um 1 erhöhen (aktuell `2`),
bei sichtbaren Änderungen zusätzlich den `versionName` anpassen. Danach wieder
`npm run cap:sync` und neu bauen.

## 5.6 Vor der Veröffentlichung: auf dem Handy testen

1. **Lizenztester eintragen**, damit Testkäufe nichts kosten:
   Play Console → ganz links oben aufs Haus (Alle Apps) → **Einstellungen →
   Lizenztests** → eigene Google-Adresse hinzufügen → Lizenzantwort
   **RESPOND_NORMALLY** → speichern.
2. Im internen Test den **Einladungslink** öffnen (Reiter „Tester“), auf dem
   Handy mit demselben Google-Konto annehmen und die App installieren.
3. Auf dem Gerät prüfen:
   - App startet ohne Absturz (heißt: die AdMob-App-ID im Manifest stimmt)
   - Werbeleiste unten erscheint (oder bleibt leer, solange die AdMob-App noch
     in Prüfung ist – siehe Abschnitt 2)
   - Premium-Kauf lässt sich öffnen, Preis wird angezeigt, Kauf schaltet
     werbefrei; „Käufe wiederherstellen“ funktioniert
   - Diagnose bei Problemen: in den Einstellungen 5× auf die Versionsnummer
     tippen, dann erscheinen Werbe- und Kauf-Status als Textzeilen

## 5.7 In die Produktion veröffentlichen

1. Play Console → **Testen und veröffentlichen → Produktion → Neuen Release
   erstellen**.
2. Statt neu hochzuladen: **„App-Bundles hinzufügen“ → aus der Bibliothek** das
   bereits hochgeladene Bundle (versionCode 1) auswählen. Alternativ lässt sich
   der interne Test über **„Release hochstufen → Produktion“** direkt übernehmen.
3. Länder/Regionen auswählen (z. B. alle, oder nur Deutschland/Österreich/Schweiz).
4. Versionshinweise eintragen, **Speichern → Release überprüfen →
   Freigabe starten**.
5. Die Prüfung durch Google dauert bei neuen Apps üblicherweise einige Stunden
   bis wenige Tage. Danach ist die App im Play Store sichtbar.

Hinweis: Falls die Play Console vor der Produktion einen **geschlossenen Test
mit 12 Testern über 14 Tage** verlangt, betrifft das neuere private
Entwicklerkonten. Dann zuerst diesen Test durchlaufen lassen; an der App selbst
ändert sich dadurch nichts.

## 6. Nach der AdMob-Freigabe

Die echten IDs sind bereits eingebaut (`TESTING: false`, Banner-ID in
`ADS_CONF`, App-ID im `AndroidManifest.xml`). Die Freigabe passiert allein auf
Googles Seite – ein neuer Build ist dafür **nicht** nötig. Sobald AdMob die App
freigegeben hat, erscheinen die Banner von selbst.
