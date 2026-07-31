# Play-Store-Texte – SGT Rechner (Vorschlag)

Dritte App der Reihe (nach BFT Tool und PFT Tool) – deshalb sind diese Texte
bewusst mit anderem Einstieg, anderer Gliederung und anderem Wortlaut
geschrieben, damit der Play-Review sie nicht als „wiederholten Inhalt“
einstuft. Vor dem Einreichen in der Play Console einfügen und bei Bedarf anpassen.

## App-Name (max. 30 Zeichen) – FESTGELEGT

```
SGT Soldaten-Grundfitness-Tool
```

(Exakt 30 Zeichen – schöpft das Play-Limit voll aus und enthält den kompletten
offiziellen Testnamen als Suchbegriff. Der Launcher-Name unter dem App-Icon
bleibt davon unberührt „SGT Rechner“.)

## Kurzbeschreibung (max. 80 Zeichen)

```
Ampel-Auswertung für das Soldaten-Grundfitness-Tool: 4 Aufgaben, Grün-Gelb-Rot.
```

(80 Zeichen)

## Vollständige Beschreibung (max. 4000 Zeichen)

```
Grün, Gelb oder Rot? Beim Soldaten-Grundfitness-Tool (SGT) der Bundeswehr zählt jede Zehntelsekunde: Vier einsatznahe Aufgaben, ein Durchlauf, ca. 20 kg Ausrüstung am Körper – und am Ende entscheidet die schwächste Einzelzeit über deine Kategorie. Der SGT Rechner nimmt dir die Auswertung ab: Zwischenzeiten eintippen, Ampel ablesen, gezielt trainieren.

EIN PARCOURS, VIER AUFGABEN
Auf 55 × 10 Metern werden ohne feste Pause nacheinander absolviert:
– SGT-A „Bewegen im Gelände“: ca. 130 m mit zweimal Slalom und 10 m Gleiten
– SGT-B „Ziehen von Lasten“: 50-kg-Personendummy über ca. 40 m
– SGT-C „Tragen von Lasten“: zwei 18-kg-Kanister über 100 m
– SGT-D „Heben und Absetzen“: 24-kg-Kanister fünfmal auf 1,25 m Höhe

DIE AMPEL SAGT DIR, WO DU STEHST
Die App übernimmt das Bewertungssystem der offiziellen Handanweisung (Stand April 2019): Für jede Aufgabe gilt eine Grün-, Gelb- und Rot-Zone – für alle gleich, ohne Alters- oder Geschlechtergruppen. Eine gelbe Aufgabe macht den Durchlauf gelb, eine rote macht ihn rot, ein Abbruch zählt automatisch als Rot. Zusätzlich zeigt dir die App die Gesamtzeit als schnellen Überblick und alle Zielzeiten zum Nachschlagen. Hinweis der Vorschrift: Die Zeitwerte sind vorläufig.

TRAINING MIT SYSTEM
Jeder gespeicherte Durchlauf landet in deinem Verlauf. So erkennst du sofort, welche der vier Aufgaben dich Kategorie kostet – Schnelligkeit, Ziehen, Tragen oder Heben – und ob dein Training wirkt.

AUSBILDER-FUNKTIONEN AN BORD
Der Prüfermodus führt eine Ergebnisliste für ganze Gruppen und enthält eine bebilderte Anleitung zum Parcours: Aufbauplan mit allen Pylonen-Positionen, Materialsatz, Ablaufskizzen zu jeder Aufgabe und die typischen Ausführungsfehler. Listen lassen sich drucken oder als PDF, Bild und Text exportieren (Premium).

OFFLINE UND PRIVAT
Es gibt kein Konto und keinen Server: Sämtliche Eingaben bleiben lokal auf deinem Gerät, die App läuft vollständig offline.

EINMAL ZAHLEN STATT ABO
Kostenlos nutzt du den kompletten Rechner mit Werbung und bis zu drei Personen im Prüfermodus. Premium (einmaliger Kauf) schaltet Werbefreiheit, unbegrenzte Listen sowie Export und Druck frei.

RECHTLICHER HINWEIS
Privates, inoffizielles Projekt – kein Angebot der Bundeswehr. „Soldaten-Grundfitness-Tool“ wird nur beschreibend verwendet. Grundlage ist die öffentlich zugängliche Handanweisung; maßgeblich ist stets die offizielle Auswertung durch die Überprüfungsleitung. Alle Angaben ohne Gewähr.
```

## Grafiken

Alle Grafiken liegen fertig unter `docs/store-grafiken/`:
`feature-grafik-1024x500.png` und `screenshot-1…6-1080x1920.png`
(gerahmte Screenshots mit Überschrift, Motive siehe unten).

- **App-Icon 512×512**: liegt bereit unter `icons/icon-512.png`
- **Feature-Grafik 1024×500**: Logo-Schriftzug links, rechts die vier
  SGT-Aufgaben als Piktogramm-Reihe (Slalom, Ziehen, Tragen, Heben) auf
  Olivgrün – liegt fertig unter `docs/store-grafiken/feature-grafik-1024x500.png`
- **Screenshots**: eigene Motive und andere Überschriften als bei BFT/PFT, z. B.:
  1. Teilnehmer-Ansicht mit Ampel-Ergebnis („Zeiten rein, Ampel ablesen“)
  2. Kategoriegrenzen-Aufklapper („Alle Zielzeiten auf einen Blick“)
  3. Aufbau-&-Ablauf-Tab mit Parcours-Plan („Der komplette Parcours erklärt“)
  4. Stationsskizze SGT-D („Jede Aufgabe als Skizze“)
  5. Verlauf („Sieh, welche Aufgabe dich Kategorie kostet“)
  6. Prüfermodus-Liste („Ergebnisse für die ganze Gruppe“)

## Formulare (Kurzreferenz)

- Data Safety: Geräte-/andere IDs, ungefährer Standort, App-Interaktionen,
  Absturz-/Diagnosedaten – jeweils „erhoben und geteilt“, Zweck Analyse + Werbung,
  nicht sitzungsspezifisch, erforderlich, keine Löschfunktion;
  „Gesundheit und Fitness“ NICHT ankreuzen (alle Eingaben bleiben lokal)
- Anzeigen: Ja · Werbe-ID: Ja · Zielgruppe: 18+
- Datenschutz-URL: `https://marqewi.github.io/sgt-rechner/datenschutz.html`
  (ergibt sich aus dem Repo-Namen `sgt-rechner`, sobald GitHub Pages aktiviert ist)
- In-App-Produkt: `premium_unlock` (Einmalkauf, 2,99 €, „Digitale Inhalte“;
  Kaufoptions-ID `premium-unlock`)
- AdMob-DSGVO-Meldung: Option „Nicht einwilligen“ auf AN
- Builds: immer „Generate Signed App Bundle → release“, versionCode bei jedem
  Upload erhöhen (aktuell 2)
