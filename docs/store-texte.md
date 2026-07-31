# Play-Store-Texte – Never2Late

Vierte App im MERCwerk-Konto, aber die erste außerhalb des Fitness-Themas.
Die Texte sind deshalb komplett neu geschrieben: anderer Einstieg, andere
Gliederung, andere Bildsprache. „Wiederholter Inhalt“ ist bei mehreren Apps
desselben Kontos das größte Ablehnungsrisiko – hier hilft, dass Never2Late
inhaltlich nichts mit BFT, PFT oder SGT zu tun hat. **Nichts aus den anderen
Store-Einträgen übernehmen.**

## App-Name (max. 30 Zeichen)

```
Never2Late – Ablaufdaten
```

(24 Zeichen. Der Launcher-Name unter dem Icon bleibt kurz „Never2Late“.)

Alternative, falls der Name schon belegt ist:

```
Never2Late: Fristen im Blick
```

(28 Zeichen)

## Kurzbeschreibung (max. 80 Zeichen)

```
Ausweis, Karte, TÜV, Vertrag: Ablaufdaten erfassen und rechtzeitig erinnern.
```

(75 Zeichen)

## Vollständige Beschreibung (max. 4000 Zeichen)

```
Der Personalausweis ist seit vier Monaten abgelaufen. Die Bankkarte gilt nur noch bis nächsten Monat. Der berufliche Nachweis wäre im Frühjahr fällig gewesen. Solche Dinge fallen fast nie rechtzeitig auf – sondern genau dann, wenn man sie braucht.

Never2Late sammelt alles, was ein Ablauf- oder Fälligkeitsdatum hat, an einem Ort und meldet sich, bevor es knapp wird.

SO FUNKTIONIERT ES
Eintrag anlegen: Titel, Kategorie, Datum – fertig. Optional dazu eine Nummer, eine Notiz und eigene Erinnerungen. Das Dashboard zeigt danach immer zuerst, was als Nächstes zählt: abgelaufen, bald fällig, alles andere.

ACHT KATEGORIEN FÜR DEN ALLTAG – UND EIGENE DAZU
• Ausweise – Personalausweis, Reisepass, Aufenthaltstitel
• Karten – EC- und Kreditkarte, Gesundheitskarte, Mitgliedsausweise
• Beruflich – Zertifikate, Lizenzen, Fortbildungen, jährliche Nachweise
• Fahrzeug – Führerschein, Hauptuntersuchung, Zulassung
• Gesundheit – Impfungen und medizinische Nachweise
• Reisen – Visa und Reisedokumente
• Verträge – Versicherungen, Garantien, Abos, Kündigungsfristen
• Sonstiges – alles Übrige mit Frist

Fehlt etwas? Leg dir eigene Kategorien an – mit eigenem Namen und einem Symbol deiner Wahl, zum Beispiel Haustier, Wohnung oder Studium.

Und weil sich nicht alles in eine Schublade sortieren lässt, darf ein Eintrag zu mehreren Kategorien gehören: Der Reisepass steht unter Ausweise und unter Reisen und taucht in beiden Filtern auf.

ERINNERUNGEN, DIE NICHT NERVEN
Jeder Eintrag bekommt automatisch drei Erinnerungen: drei Monate, eine Woche und einen Tag vorher. Genug Vorlauf für einen Behördentermin, und trotzdem noch eine letzte Erinnerung kurz davor. Du kannst die Zeitpunkte je Eintrag ändern, weitere ergänzen oder alle abschalten. Die Meldungen sind kurz und sagen genau, worum es geht – zum Beispiel „Personalausweis läuft in 7 Tagen ab“.

WIEDERKEHRENDE FRISTEN
Manche Termine kommen jedes Jahr wieder: der jährliche Nachweis, die Vorsorgeuntersuchung, die Prüfung. Stell den Eintrag einmal auf monatlich, halbjährlich oder jährlich. Ein Tipp auf „Erledigt“ setzt den nächsten Termin – auf denselben Kalendertag, auch wenn ein Zyklus einmal ausgefallen ist. Bis dahin bleibt ein überfälliger Nachweis sichtbar überfällig; er verschwindet nicht einfach.

ERNEUERN STATT NEU ANLEGEN
Neuer Ausweis in der Hand? „Erneuert“ tippen, neues Datum wählen – der Eintrag läuft weiter, mit allen Erinnerungen. Was du nicht mehr brauchst, wandert ins Archiv: aus der Liste verschwunden, aber jederzeit wieder auffindbar.

SCHNELL WIEDERFINDEN
Suche nach Titel oder Nummer, Filter nach Status und Kategorie, sortiert nach Dringlichkeit. Die Liste zeigt immer zuerst, was drängt.

OPTIONAL IN DEN KALENDER
Einzelne Termine lassen sich als Kalendereintrag übergeben – inklusive Wiederholung und Erinnerungen. Die App braucht dafür keinen Zugriff auf deinen Kalender und funktioniert auch komplett ohne.

DEINE DATEN BLEIBEN BEI DIR
Kein Konto, keine Anmeldung, kein Server, keine Cloud. Alles wird ausschließlich auf deinem Gerät gespeichert. Es gibt keine Werbung, keine Käufe und keine Datenweitergabe. Über die Sicherungsfunktion legst du bei Bedarf selbst eine Datei an – du entscheidest, wo sie liegt.

Hell und dunkel, ohne Registrierung, sofort nutzbar. Alle Angaben ohne Gewähr: maßgeblich bleiben die Daten auf deinen Dokumenten.
```

## Grafiken

| Was | Datei |
|---|---|
| App-Icon 512 × 512 | `icons/icon-512.png` |
| Feature-Grafik 1024 × 500 | `docs/store-grafiken/feature-grafik-1024x500.png` |
| Screenshots 1080 × 1920 (7 Stück) | `docs/store-grafiken/screenshot-1…7-1080x1920.png` |

Neu erzeugen lassen sie sich mit:

```
python3 -m http.server 8931 &
node scripts/screenshots.mjs
node scripts/store-grafiken.mjs
```

## Data Safety – die Antworten in Kurzform

Never2Late erhebt **keine** Daten. Das macht das Formular kurz:

| Frage | Antwort |
|---|---|
| Werden Nutzerdaten erhoben oder geteilt? | **Nein** |
| Werden Daten verschlüsselt übertragen? | entfällt (es werden keine Daten übertragen) |
| Können Nutzer die Löschung beantragen? | entfällt – gelöscht wird in der App bzw. durch Deinstallation |
| Enthält die App Werbung? | **Nein** |
| Enthält die App In-App-Käufe? | **Nein** |
| Zielgruppe | Nicht speziell für Kinder |

Wichtig: Die Berechtigung für **Benachrichtigungen** (POST_NOTIFICATIONS) ist
*keine* Datenerhebung. Die Erinnerungen werden vollständig auf dem Gerät
berechnet und geplant. In der Data-Safety-Erklärung ändert sich dadurch nichts.

Kategorie: **Produktivität**. Die Kategorie „Gesundheit und Fitness“ passt
nicht und sollte auch nicht gewählt werden, obwohl es eine Kategorie
„Gesundheit“ *innerhalb* der App gibt.

## Was in V1 bewusst fehlt

Keine Werbung, keine Premium-Version, kein In-App-Produkt, keine Limits.
Die Module dafür liegen im Code vorbereitet, sind aber abgeschaltet – siehe
`docs/veroeffentlichung.md`, Abschnitt „Später: Monetarisierung“.
