# SGT Rechner – Soldaten-Grundfitness-Tool (inoffiziell)

Zeitrechner für das **Soldaten-Grundfitness-Tool (SGT)** der Bundeswehr: Die
Zwischenzeiten der vier Aufgaben (Bewegen im Gelände, Ziehen, Tragen sowie Heben
und Absetzen von Lasten) eingeben – die App ermittelt die Ampel-Kategorie
**Grün, Gelb oder Rot** je Aufgabe und für den gesamten Durchlauf.

> **Inoffizielle App** – privates Projekt, kein Angebot der Bundeswehr.
> Alle Angaben ohne Gewähr; maßgeblich ist die offizielle Auswertung.

## Funktionen

- **Teilnehmer-Modus:** Zeiten eingeben, Ampel-Kategorie live sehen, Verlauf lokal speichern
- **Prüfermodus:** mehrere Testpersonen erfassen, Ergebnisliste mit Kategorie,
  Aufbau- und Ablaufanleitung für den Parcours (inkl. Skizzen und Original-Plänen),
  Drucken, Export als PDF/Bild/Text (Premium)
- **Editionen:** Freie Version (mit Werbung, begrenzte Personenzahl) und Premium
  (2,99 €: werbefrei, unbegrenzte Listen, Export als PDF/Bild/Text)
- Helles Design mit Dark Mode, responsiv, Ersteinrichtungs-Dialog
- Komplett offline-fähig, alle Daten bleiben lokal auf dem Gerät (kein Server, kein Tracking)

## Technik

- Eine einzige, in sich geschlossene `index.html` (inline CSS/JS, keine externen Abhängigkeiten)
- `npm run sync` kopiert die Web-Dateien nach `www/` (Quelle für die Capacitor-App)
- Service Worker (`sw.js`) wird nur auf `github.io` registriert, nicht in der App
- Native Brücke mit Feature-Detection (`window.Capacitor`): Datei-Export und Drucken laufen im
  Browser über `a.download`/`window.print()`, in der Android-App über Capacitor-Plugins
- Plugins werden ausschließlich über `window.Capacitor.Plugins.<Name>` angesprochen
  (kein Bundler, daher kein `Capacitor.registerPlugin`)

## Bewertungssystem (Kurzfassung)

Das SGT besteht aus 4 Aufgaben, die in **einem Durchlauf ohne festgelegte Pause**
auf einem 55 m × 10 m großen Parcours im Freien absolviert werden – mit Feldanzug,
Gefechtshelm und 13-kg-Gewichtsweste (gesamt ca. 20 kg). Die Zeiten werden auf
0,1 s genau gemessen.

| Aufgabe | Inhalt | Grün | Gelb | Rot |
|---|---|---|---|---|
| SGT-A „Bewegen im Gelände“ | ca. 130 m Parcours, 2× Slalom, 10 m Gleiten | ≤ 55 s | 55–70 s | ≥ 70 s |
| SGT-B „Ziehen von Lasten“ | 50-kg-Dummy über ca. 40 m | ≤ 30 s | 30–50 s | ≥ 50 s |
| SGT-C „Tragen von Lasten“ | 2 × 18-kg-Kanister über 100 m | ≤ 75 s | 75–100 s | ≥ 100 s |
| SGT-D „Heben und Absetzen“ | 24-kg-Kanister 5× auf 1,25 m | ≤ 20 s | 20–50 s | ≥ 50 s |
| *Gesamtzeit (nur Schnellüberblick)* | Summe A–D | ≤ 180 s | 180–270 s | ≥ 270 s |

Die Grenzen gelten **für alle Testpersonen gleich** (keine Alters- oder
Geschlechtergruppen). Die **schlechteste Einzelkategorie** bestimmt die Kategorie
des Durchlaufs; ein **vorzeitiger Abbruch** bedeutet obligatorisch „Rot“.
Die Zeitwerte sind laut Handanweisung **vorläufig**.

Quelle: Kommando Streitkräftebasis / Institut für Präventivmedizin der Bundeswehr,
„Handanweisung Soldaten-Grundfitness-Tool ‚SGT‘“ (Stand April 2019).

## Web-Version

Die App läuft als Web-Version unter: <https://marqewi.github.io/sgt-rechner/>
(GitHub Pages: Settings → Pages → Deploy from a branch → `main` / root)
