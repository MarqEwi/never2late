# Grafiken: Logo, Icons, Skizzen, Store-Material

## Logo und Icons

Das Logo entsteht entweder als handgeschriebenes SVG (volle Kontrolle,
beliebig oft neu skalierbar) oder mit Higgsfield, wenn ein bestimmter Stil
getroffen werden soll. Bei einer Familie ähnlicher Apps ist das
Stil-Referenzbild der Vorgänger-App der beste Ausgangspunkt: das alte Logo
hochladen (`media_upload` → `media_confirm`), als `medias`-Referenz mitgeben
und im Prompt nur das ändern, was sich ändern soll.

Erfahrung aus der Praxis: Bei Text im Bild braucht es meist zwei bis drei
Anläufe. Nutzbare Hebel im Prompt:

- Wortlaut buchstabengenau vorgeben („spelled letter-perfect"), einzelne
  Wörter buchstabieren, wenn das Modell sie zerlegt
  (`"Grundfitness" (ONE single word, no hyphen)`)
- explizit ausschließen, was nicht dastehen soll (`NOT "Test"`)
- Schriftgrößen-Verhältnis benennen („all three lines the SAME font size,
  sized so that the longest line spans the width")

### Alle Größen aus einer Vorlage rendern

Kein Bildbearbeitungsprogramm nötig – headless Chromium reicht:

```js
const { chromium } = require("@playwright/test");
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const pg = await b.newPage({ viewport: { width: size, height: size } });
await pg.setContent(`<style>*{margin:0}</style><img id="i" width="${size}"
  height="${size}" src="data:image/svg+xml;base64,${b64}">`);
await pg.locator("#i").screenshot({ path: out, omitBackground: true });
```

Zu erzeugen sind:

| Zweck | Größen |
|---|---|
| Web-Icons | 192, 512, maskable 512 (Motiv auf ~78 % verkleinert) |
| Favicon + Kopfzeilen-Logo | 64 bzw. 96, als Data-URI in `index.html` |
| Android Launcher (eckig + rund) | mdpi 48, hdpi 72, xhdpi 96, xxhdpi 144, xxxhdpi 192 |
| Android Foreground-Ebene | mdpi 108, hdpi 162, xhdpi 216, xxhdpi 324, xxxhdpi 432 (Motiv ~60 %, transparent) |

### Hintergrundfarbe exakt messen

Die Adaptive-Icon-Hintergrundfarbe muss **exakt** der Logofarbe entsprechen,
sonst entsteht auf dem Startbildschirm eine sichtbare Kante. Nicht schätzen,
sondern aus den Bildecken auslesen:

```js
const pts = [[20,20],[w-20,20],[20,h-20],[w-20,h-20]];
// Mittelwert der vier Ecken -> #RRGGBB
```

Diesen Wert eintragen in `res/values/ic_launcher_background.xml`,
`res/drawable/ic_launcher_background.xml` – und ihn in den Store-Unterlagen
notieren, weil die Feature-Grafik denselben Hintergrund braucht.

## Stations-Skizzen (Higgsfield)

Ziel sind einheitliche, nüchterne Erklärbilder – keine Illustrationen mit
Eigenleben. Verfahren:

1. **Ein** Bild als Stilvorgabe erzeugen (Modell `nano_banana_pro`, 16:9):

   > flat instructional diagram, solid black airport-signage pictogram
   > figures, thin black measurement lines, olivgrüner Akzent, cremefarbener
   > Hintergrund #F4F3EA, keine Verläufe/Schatten/Texturen

2. Ergebnis prüfen. Erst wenn es sitzt, dessen **Job-ID bei allen weiteren
   Bildern als Referenz** mitgeben:
   `medias: [{ value: "<job-id>", role: "image" }]`
3. Jeden weiteren Prompt beginnen mit
   **„Match EXACTLY the illustration style of the reference image"**.
4. **Kein Text im Bild**: „ABSOLUTELY NO other text" – nur kurze Maßangaben
   wie „100 m" oder „24 kg". Titel und Erklärungen stehen im HTML daneben,
   wo sie übersetzbar und durchsuchbar sind.
5. Regelrelevante Details müssen erkennbar sein. Das Ergebnis gegen die
   Vorschrift prüfen, nicht nur gegen den eigenen Prompt – bei einer Skizze
   war die Ablage auf Schulterhöhe statt auf Brusthöhe (1,25 m), was fachlich
   falsch war und nachgeneriert werden musste.

### Einbau als WebP-Data-URI

640 px Breite, Qualität ~78, `loading="lazy"`. Umwandlung wieder über
Chromium-Canvas:

```js
const cv = document.createElement("canvas");
cv.width = 640; cv.height = Math.round(img.height * 640 / img.width);
const ctx = cv.getContext("2d");
ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, cv.width, cv.height);
ctx.drawImage(img, 0, 0, cv.width, cv.height);
return cv.toDataURL("image/webp", 0.78);       // ~6–30 KB je Bild
```

## Original-Abbildungen aus der Vorschrift

Zusätzlich zu den eigenen Skizzen gehören die Originalpläne in ausklappbare
`<details>`-Bereiche – sie sind die belastbare Quelle. Ausschneiden ohne
Bildbearbeitung: Seite mit `pdftoppm -r 150` rendern, dann per
Chromium-Canvas den Bildausschnitt in relativen Koordinaten zuschneiden
(`x, y, w, h` als Anteile) und als WebP ausgeben. Die relativen Werte lassen
sich durch Ansehen der gerenderten Seite schnell einstellen.

## Store-Grafiken

### Feature-Grafik 1024 × 500

Wirkt am besten, wenn sie nicht nur das Logo zeigt, sondern die App erzählt:
links der Schriftzug, rechts die Disziplinen als Piktogramm-Reihe – im
gleichen Stil wie die Stationsskizzen. Hintergrund exakt in der Logofarbe.
Wird ein Bild eingepasst, dessen Ränder nicht exakt passen, hilft eine weiche
Randmaske statt eines harten Schnitts:

```css
mask-image: linear-gradient(to bottom, transparent 0, #000 14px,
                            #000 calc(100% - 14px), transparent 100%);
```

### Screenshots 1080 × 1920

Nicht der nackte App-Screenshot, sondern gerahmt und mit Überschrift – das
verkauft die App und unterscheidet sie von den Schwester-Apps:

- 540 × 960 CSS bei `deviceScaleFactor: 2`
- Hintergrund in der Logofarbe, Überschrift in Creme, darunter das
  „Telefon" (abgerundeter Rahmen, unten offen)
- **Beispieldaten vorher in den localStorage schreiben** (`addInitScript`),
  damit keine leeren Listen zu sehen sind. Ein Verlauf, der eine Entwicklung
  von Rot über Gelb nach Grün zeigt, erzählt mehr als vier gleiche Zeilen.
- **Premium-Modus setzen**, damit kein Werbe-Platzhalter im Bild ist
- Motive und Überschriften bewusst anders wählen als bei den Schwester-Apps

### Produktsymbol für den In-App-Kauf

Play verlangt hier ausdrücklich **kein Text, keine Werbung, kein Branding** –
das App-Icon mit Schriftzug ist damit unzulässig. Ein schlichtes Symbol in
den App-Farben (512 × 512, 1:1) genügt; das Feld ist optional.
