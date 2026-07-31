# Veröffentlichung: AdMob, Play Console, Build, Upload

Alles hier macht der Auftraggeber selbst im Browser bzw. in Android Studio.
Deshalb: einzeln anleiten, in einfacher Sprache, mit exakten Werten zum
Kopieren. Diese Datei ist die Vorlage für die `docs/veroeffentlichung.md` der
jeweiligen App.

## 1. GitHub Pages (Web-Version + Datenschutz-URL)

Repo → **Settings → Pages** → „Deploy from a branch" → `main` / `/ (root)`.
Nach ein bis zwei Minuten läuft die App unter
`https://<konto>.github.io/<repo>/`, die Datenschutzseite unter
`…/datenschutz.html`. Diese URL braucht die Play Console.

Prüfen lässt sich das Ergebnis auch ohne Browserzugriff: die ausgelieferten
Dateien herunterladen und ihre Prüfsummen mit den lokal getesteten
vergleichen – sind sie identisch, läuft dort exakt der getestete Stand.

## 2. AdMob

1. **Apps → App hinzufügen** → Android → „bei Google Play gelistet?" →
   **Nein** (die App ist noch nicht veröffentlicht) → Name eintragen.
2. Die **App-ID** (`ca-app-pub-…~…`, mit Tilde) ins `AndroidManifest.xml`.
3. **Anzeigenblöcke → Banner** anlegen → die **Banner-ID**
   (`ca-app-pub-…/…`, mit Schrägstrich) in `ADS_CONF.BANNER_ID`,
   `TESTING` auf `false`.
4. **Datenschutz & Mitteilungen → DSGVO**: Meldung für die neue App
   aktivieren, Option „Nicht einwilligen" auf AN.

Bis die echten IDs vorliegen, laufen Googles offizielle Test-IDs mit
`TESTING: true`. Neue AdMob-Apps liefern anfangs oft **„code 3 / not
approved"** – das ist die normale Prüfzeit (Stunden bis wenige Tage), kein
Fehler. Für die Freigabe ist **kein neuer Build** nötig.

## 3. Play Console: App einrichten

| Punkt | Antwort |
|---|---|
| Datenschutzerklärung | die GitHub-Pages-URL von oben |
| Anmeldedaten / Zugriff | „Alle Funktionen ohne besondere Zugriffsvoraussetzungen" (kein Login) |
| Anzeigen | **Ja** |
| Einstufung des Inhalts | Kategorie „Alle anderen App-Typen"; alle Inhaltsfragen **Nein**, nur Werbung **Ja** |
| Zielgruppe | nur **18+**; „unbeabsichtigt für Kinder attraktiv?" → **Nein** |
| Behörden-App | Nein |
| Finanzfunktionen | keine (der Premium-Kauf zählt nicht) |
| Gesundheit | keine Gesundheitsfunktionen |
| Kategorie | App · Gesundheit & Fitness (einheitlich zur Familie) |
| Store-Titel | **max. 30 Zeichen** – Zeichen vorher zählen |

### Data Safety (wegen AdMob)

Erhebt/teilt Daten: **Ja**. Verschlüsselt: **Ja**. Löschfunktion: **Nein**.

Genau vier Datentypen, alle mit denselben Einstellungen:

- Gerätekennungen oder andere IDs
- Standort → ungefährer Standort
- App-Aktivitäten → App-Interaktionen
- App-Informationen und -Leistung → Absturzprotokolle und Diagnosedaten

Je Typ: **erhoben und geteilt**, Zweck **Analyse + Werbung**, sitzungs­spezifisch
**Nein**, Erhebung **erforderlich**.

**„Gesundheit und Fitness" NICHT ankreuzen** – die Trainingsdaten bleiben
lokal und werden nirgendwohin übertragen.

## 4. Einmalkaufprodukt

**Monetarisieren → Produkte → In-App-Produkte → Produkt erstellen**

| Feld | Wert |
|---|---|
| Produkt-ID | `premium_unlock` – exakt wie `Billing.PRODUCT` im Code, später nicht änderbar |
| Name | „Premium freischalten" |
| Beschreibung | was der Kauf freischaltet, Hinweis „Einmaliger Kauf, kein Abo" |
| Symbol | schlichtes Symbol ohne Text/Branding (optional) |
| Steuerkategorie | Voreinstellung „Verkäufe digitaler Apps" |
| Kaufoptions-ID | `premium-unlock` – **mit Bindestrich**, Unterstriche sind hier nicht erlaubt |
| Kauftyp | „Kaufen" (nicht „Leihen") |
| Preis | z. B. 2,99 € |

Produkt **und** Kaufoption aktivieren, sonst findet die App sie nicht.

Für das Anlegen muss bereits ein App Bundle in irgendeinem Track liegen –
also erst hochladen, dann das Produkt anlegen.

## 5. Bauen und hochladen

### Vorbereiten

```
git pull
npm install          # zieht Plugins nach und führt patch-package aus
npm run cap:sync     # vor JEDEM Build
```

### Keystore (einmalig pro PC)

Der **vorhandene** Keystore der App-Familie – niemals einen neuen erzeugen,
sonst lässt sich die App später nicht mehr aktualisieren. Datei nach
`android/` kopieren, `keystore.properties.example` zu `keystore.properties`
kopieren und ausfüllen (`storeFile`, `storePassword`, `keyAlias`,
`keyPassword`). Beides ist gitignored.

### Bundle erzeugen

Android Studio, Ordner **`android`** als Projekt öffnen (nicht den
Hauptordner). Dann **Build → Generate Signed App Bundle / APK →
Android App Bundle → release**. Ergebnis:
`android/app/release/app-release.aab`.

### Hochladen

**Testen und veröffentlichen → Tests → Interner Test → Neuen Release
erstellen**. Beim ersten Mal die **Play App-Signatur** in der
Standardeinstellung bestätigen. Bundle hochladen, Versionshinweise
eintragen, freigeben.

Der interne Test verlangt mindestens einen Tester: Reiter „Tester" →
E-Mail-Liste anlegen → eigene Adresse eintragen.

Bei jedem weiteren Upload den **`versionCode` um 1 erhöhen** (und bei
sichtbaren Änderungen den `versionName`). Sind seit dem letzten Upload
mehrere Änderungen zusammengekommen, gehen sie in **einem** Build raus – der
`versionCode` steigt dann nur einmal.

## 6. Gerätetest vor der Veröffentlichung

Lohnt sich immer – hier sind bisher alle App-spezifischen Fehler aufgefallen,
die im Browser unsichtbar waren.

1. **Lizenztester eintragen**, damit Testkäufe nichts kosten: Play Console →
   Alle Apps → **Einstellungen → Lizenztests** → eigene Adresse →
   Lizenzantwort `RESPOND_NORMALLY`.
2. Über den Einladungslink des internen Tests installieren.
3. Prüfen: App startet ohne Absturz (= AdMob-App-ID im Manifest stimmt),
   Werbeleiste erscheint, Premium-Kauf zeigt Preis und schaltet frei,
   „Käufe wiederherstellen", Export und Drucken, Zurück-Taste.
4. Bei Problemen: 5× auf die Versionsnummer tippen und die Statuszeilen
   auslesen lassen.

## 7. In die Produktion

**Produktion → Neuen Release erstellen** → Bundle **aus der Bibliothek**
wählen (nicht neu hochladen) oder den internen Test hochstufen → Länder
wählen → freigeben. Prüfung durch Google: Stunden bis wenige Tage.

Verlangt die Console vorher einen **geschlossenen Test mit 12 Testern über
14 Tage**, betrifft das neuere private Entwicklerkonten – dann zuerst diesen
Test durchlaufen lassen.
