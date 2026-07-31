# Never2Late – Ablaufdaten im Blick

Never2Late verwaltet **Ablaufdaten, Gültigkeiten und wiederkehrende Fristen**:
Ausweise, Karten, berufliche Nachweise, Fahrzeugtermine, Gesundheitsdokumente,
Reisedokumente und Verträge zentral erfassen, rechtzeitig erinnert werden und
auf einen Blick sehen, was als Nächstes ansteht.

> Alle Daten bleiben **lokal auf dem Gerät** – kein Konto, kein Server,
> keine Cloud, kein Tracking. Die aktuelle Version (V1) enthält weder Werbung
> noch Käufe.

## Funktionen (V1)

- **Dashboard:** Abgelaufenes und bald Fälliges sofort sehen, schneller Zugriff
  auf „Neuer Eintrag“
- **Einträge:** Titel, Kategorien, Datumstyp (Gültig bis / Fällig am /
  Wiederkehrend), Nummer/Referenz und Notiz
- **Kategorien:** acht mitgelieferte (Ausweise, Karten, Beruflich, Fahrzeug,
  Gesundheit, Reisen, Verträge, Sonstiges) plus eigene mit frei wählbarem
  Emoji. Ein Eintrag kann **mehreren** Kategorien angehören – der Reisepass
  steht damit unter „Ausweise" und unter „Reisen"
- **Zentrale Statuslogik:** Aktiv · Bald fällig · Abgelaufen · Archiviert
- **Erinnerungen:** Standard 3 Monate / 1 Woche / 1 Tag vorher, je Eintrag
  anpassbar, ergänzbar und deaktivierbar – als lokale Benachrichtigungen
- **Wiederkehrende Fristen:** jährlich, halbjährlich oder monatlich; nach
  „Erledigt“ wird der nächste Termin automatisch berechnet
- **Erneuern & Archivieren:** Einträge erneuern (neues Datum) oder ins Archiv
  verschieben – nichts geht verloren
- **Liste:** Suche, Status- und Kategorie-Filter, das Dringendste zuerst
- **Kalender-Export:** einzelne Termine als .ics-Datei übernehmen (optional,
  ohne Kalender-Berechtigung)
- Helles Design mit Dark Mode, responsiv, Ersteinrichtungs-Dialog

## Technik

- Eine einzige, in sich geschlossene `index.html` (inline CSS/JS, keine externen Abhängigkeiten)
- Klar getrennte Ebenen im Code: Logik-Kern (Status/Datum/Wiederholung/Erinnerungen,
  DOM-frei und testbar) → Datenschicht (versioniertes Schema im localStorage unter
  `n2l_`-Schlüsseln) → Oberfläche → native Module
- Das Datenschema ist versioniert (aktuell 2). Einträge aus Schema 1 mit einer
  einzelnen Kategorie werden beim Laden automatisch auf das Kategorien-Array
  umgestellt – die Migration steckt in `Core.normalisieren()`, durch die jeder
  Eintrag beim Speichern und Einlesen läuft
- `npm run sync` kopiert die Web-Dateien nach `www/` (Quelle für die Capacitor-App)
- Service Worker (`sw.js`) wird nur auf `github.io` registriert, nicht in der App
- Native Brücke mit Feature-Detection (`window.Capacitor`): Kalender-Export läuft im
  Browser über `a.download`, in der Android-App über Filesystem + Share;
  Erinnerungen über `@capacitor/local-notifications`
- Plugins werden ausschließlich über `window.Capacitor.Plugins.<Name>` angesprochen
  (kein Bundler, daher kein `Capacitor.registerPlugin`)
- AdMob-/Billing-Module liegen als ruhende Infrastruktur für spätere Versionen bei,
  sind in V1 aber vollständig deaktiviert und nirgends sichtbar

## Tests

Playwright-Tests (vorinstalliertes Chromium, kein `playwright install`):

```
npx playwright test
```

## Web-Version

Die App läuft als Web-Version unter: <https://marqewi.github.io/never2late/>
(GitHub Pages: Settings → Pages → Deploy from a branch → `main` / root)
