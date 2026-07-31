# Rechenkern aus einer amtlichen Vorschrift

Der Rechenkern ist der eigentliche Wert dieser Apps. Ein falscher Grenzwert
fällt niemandem sofort auf und beschädigt das Vertrauen dauerhaft. Deshalb
gilt: erst verifizieren, dann bauen.

## 1. Die Vorschrift wirklich ansehen

Textextraktion aus PDFs verliert genau das, worauf es ankommt: welche Zahl in
welcher Spalte steht, welche Zellen farbig zusammengefasst sind, wo ein
`>` und wo ein `<` steht. Deshalb die relevanten Seiten **als Bild rendern**
und Zelle für Zelle visuell prüfen:

```bash
# poppler-utils installieren, falls nicht vorhanden
pdftoppm -png -r 200 -f <erste> -l <letzte> vorschrift.pdf tab
```

Dann die erzeugten PNGs ansehen. Zusätzlich `pdftotext -layout` als
Gegenprobe – wenn Bild und Text auseinandergehen, gilt das Bild.

## 2. Grenzsemantik klären, bevor Zahlen abgetippt werden

Die häufigste Fehlerquelle ist nicht die Zahl, sondern ihre Bedeutung.
Beispiel aus der SGT-Handanweisung: In der Tabelle steht
`Grün | 55 | > | < | 70 | Rot`. Das heißt: der Gelb-Bereich liegt **strikt
zwischen** den Grenzen, die Grenzwerte selbst gehören zu Grün bzw. Rot. Ein
Wert von exakt 55,0 s ist also noch Grün, exakt 70,0 s schon Rot.

Solche Festlegungen gehören als Kommentar in den Code, direkt an die
Tabellendaten. Wer sie später liest, muss nicht erneut ins PDF.

## 3. Innere Schlüssigkeit prüfen

Amtliche Tabellen sind meist redundant – das lässt sich ausnutzen:

- **Summen**: Summieren sich die Einzelgrenzen zur Gesamtgrenze?
  (SGT: 55+30+75+20 = 180 und 70+50+100+50 = 270 – beides stimmt, die
  Tabelle ist in sich schlüssig.)
- **Lückenlosigkeit**: Schließen die Bänder ohne Lücke und ohne Überlappung
  aneinander an?
- **Beispiele**: Enthält die Vorschrift Beispielrechnungen, müssen sie alle
  aufgehen. Das ist der stärkste Test überhaupt, weil er Werte *und*
  Auswertungsregel gleichzeitig prüft.

## 4. Druckfehler nur bei Eindeutigkeit korrigieren

Manchmal ist eine Zelle offensichtlich falsch – etwa `25,0–37,0`, wo sich aus
den lückenlosen Nachbarbändern zwingend `35,0–37,0` ergibt. Solche Fehler
dürfen korrigiert werden, aber nur wenn:

1. sich der richtige Wert **eindeutig** aus den Bandgrenzen ergibt, und
2. die Korrektur **im Code dokumentiert** wird (was stand da, was steht jetzt
   da, warum), und
3. sie in den Erläuterungstexten der App erwähnt wird.

Ist die Sache nicht eindeutig, wird nicht geraten – dann bekommt der
Auftraggeber die Frage vorgelegt.

Wenn keine Druckfehler gefunden wurden, gehört auch **das** in den Kommentar.
Sonst sucht beim nächsten Mal jemand erneut.

## 5. Zweitquelle

Nach Möglichkeit gegen eine unabhängige Quelle gegenprüfen (offizielle
Spiegelung des Dokuments, seriöse Abschrift, Fachseite). Auch wenn die
Zweitquelle nur Eckdaten bestätigt, ist das ein Zugewinn – und im
Quellen-Abschnitt der App zu nennen.

## 6. Rechnen ohne Gleitkomma-Überraschungen

Zeiten auf Zehntelsekunden und Vergleiche auf Bandgrenzen vertragen sich
schlecht mit Fließkommazahlen (`0.1 + 0.2 !== 0.3`). Deshalb in der kleinsten
Messeinheit ganzzahlig vergleichen:

```js
band(key, sec){
  const lim = this.LIMITS[key];
  const v = Math.round(sec * 10);          // in Zehntelsekunden
  if (v <= lim.gruen * 10) return "gruen";
  if (v <  lim.rot   * 10) return "gelb";
  return "rot";
}
```

Dasselbe gilt für Summen: erst in Zehnteln addieren, dann zurückrechnen.

Bei Punktetabellen mit unterschiedlichen Messschritten (0,1 s, ½ Runde,
ganze Wiederholungen) hat sich ein `scale`-Faktor je Disziplin bewährt, mit
dem vor dem Vergleich multipliziert und gerundet wird.

## 7. Teststrategie

Die Tests laufen gegen die **echte Seite** (`page.evaluate`), nicht gegen
eine nachgebaute Kopie der Logik – sonst testet man die Kopie.

Abzudecken sind:

1. **Jede Bandgrenze** in der kleinsten Messeinheit: der Wert exakt auf der
   Grenze, einer knapp darüber, einer knapp darunter. Für jede Disziplin,
   jede Wertungsgruppe, jede Altersklasse.
2. **Alle Beispiele aus der Vorschrift**, mit Ergebnis *und* Gesamtwert.
3. **Sonderfälle**: Abbruch, unvollständige Eingabe, Werte außerhalb der
   Tabelle, Altersklassen an den Rändern.
4. **Regeln, die über Einzelwerte hinausgehen** – etwa dass die schwächste
   Einzelleistung das Gesamtergebnis bestimmt, auch wenn die Summe besser
   aussieht. Genau solche Fälle bewusst konstruieren:

```js
// Gesamtzeit läge im grünen Bereich, aber eine Einzelzeit ist gelb
const x = SGT.evaluate({ a: 56.0, b: 10.0, c: 40.0, d: 10.0, abbruch: "" });
expect(x.totalBand).toBe("gruen");
expect(x.kat).toBe("gelb");        // Einzelzeit schlägt Gesamtzeit
```

Die Tests sind zugleich Dokumentation: Wer wissen will, wie die Vorschrift
gemeint ist, liest sie.
