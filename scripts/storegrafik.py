#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Store-Grafiken für den Play Store: Feature-Grafik (1024x500) und
Screenshots (1080x1920) aus echten App-Aufnahmen, Fotohintergrund und
Wortmarke.

    python3 storegrafik.py konfig.json              # alles
    python3 storegrafik.py konfig.json --nur feature
    python3 storegrafik.py konfig.json --nur screenshots

Das Skript rechnet und misst; es rät nicht. Am Ende meldet es für jede
Grafik die Ränder, damit ohne Hinsehen prüfbar ist, ob etwas anstößt oder
angeschnitten wird.
"""
import argparse
import json
import math
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

# ── Schriften ─────────────────────────────────────────────────────────────
# Erste vorhandene Datei gewinnt. Liberation Sans ist metrisch mit Arial
# kompatibel und auf Linux-Buildmaschinen fast immer da.
SCHRIFTPFADE = {
    'fett': [
        '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
        '/System/Library/Fonts/Supplemental/Arial Bold.ttf',
        'C:/Windows/Fonts/arialbd.ttf',
    ],
    'normal': [
        '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
        '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        '/System/Library/Fonts/Supplemental/Arial.ttf',
        'C:/Windows/Fonts/arial.ttf',
    ],
}
_schnitte = {}


def schrift(schnitt, groesse, konfig=None):
    pfade = list(SCHRIFTPFADE[schnitt])
    if konfig and konfig.get('schriften', {}).get(schnitt):
        pfade.insert(0, konfig['schriften'][schnitt])
    if schnitt not in _schnitte:
        gefunden = next((p for p in pfade if os.path.exists(p)), None)
        if not gefunden:
            sys.exit('Keine Schrift gefunden für "%s". In der Konfiguration '
                     'unter "schriften" einen Pfad angeben.' % schnitt)
        _schnitte[schnitt] = gefunden
    return ImageFont.truetype(_schnitte[schnitt], groesse)


def farbe(wert, standard=(0, 0, 0)):
    """"#RRGGBB", [r,g,b] oder [r,g,b,a] → Tupel."""
    if wert is None:
        return standard
    if isinstance(wert, (list, tuple)):
        return tuple(int(v) for v in wert)
    s = wert.lstrip('#')
    return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4))


# ── Bildwerkzeuge ─────────────────────────────────────────────────────────
def runde_ecken(im, r):
    m = Image.new('L', im.size, 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, im.width - 1, im.height - 1),
                                        radius=r, fill=255)
    im = im.convert('RGBA')
    im.putalpha(m)
    return im


def deckend(pfad, breite, hoehe):
    """Auf das Zielformat bringen, ohne zu verzerren: einpassen, mittig
    beschneiden. Verzerren ist die häufigste stille Verschlimmbesserung –
    Gesichter und Kreise verraten es sofort."""
    im = Image.open(pfad).convert('RGB')
    z = max(breite / im.width, hoehe / im.height)
    im = im.resize((round(im.width * z), round(im.height * z)), Image.LANCZOS)
    l, o = (im.width - breite) // 2, (im.height - hoehe) // 2
    return im.crop((l, o, l + breite, o + hoehe)).convert('RGBA')


def verlauf(breite, hoehe, ton, kopf_deckung, kopf_anteil, grund_deckung):
    """Weicher Schleier: oben kräftig genug für helle Schrift, nach unten nur
    noch leicht abgesenkt. Bewusst kein harter Balken – ein Foto, das
    unvermittelt in eine Fläche kippt, sieht abgeschnitten aus."""
    s = Image.new('RGBA', (breite, hoehe), (0, 0, 0, 0))
    d = ImageDraw.Draw(s)
    for y in range(hoehe):
        t = y / max(1, hoehe - 1)
        oben = kopf_deckung * max(0.0, 1 - t / kopf_anteil) ** 1.4
        fuss = grund_deckung * min(1.0, t / 0.45)
        d.line([(0, y), (breite, y)], fill=ton + (int(max(oben, fuss)),))
    return s


def geraet(pfad, breite, rahmen=None, radius=None, saum=(92, 101, 117)):
    """Aufnahme in ein gezeichnetes Gehäuse setzen. Der helle Saum außen ist
    das, was den Rahmen wie Metall statt wie einen schwarzen Kasten wirken
    lässt; das Kameraloch macht den Rest.

    Alle Maße hängen an der Breite, damit ein Gerät in der Feature-Grafik
    dieselben Proportionen hat wie eines im Screenshot – ungleiche
    Eckenradien fallen im Nebeneinander sofort auf."""
    rahmen = rahmen if rahmen is not None else max(6, round(breite * 0.0194))
    radius = radius or round(breite * 0.0777)
    schirm_b = breite - 2 * rahmen
    s = Image.open(pfad).convert('RGB')
    s = s.resize((schirm_b, round(s.height * schirm_b / s.width)), Image.LANCZOS)
    s = runde_ecken(s, round(radius * 0.733))

    hoehe = s.height + 2 * rahmen
    tel = Image.new('RGBA', (breite, hoehe), (0, 0, 0, 0))
    d = ImageDraw.Draw(tel)
    d.rounded_rectangle((0, 0, breite - 1, hoehe - 1), radius=radius,
                        fill=(13, 16, 21, 255))
    d.rounded_rectangle((0, 0, breite - 1, hoehe - 1), radius=radius,
                        outline=saum + (255,), width=max(2, round(breite / 257)))
    tel.paste(s, (rahmen, rahmen), s)
    cx = breite // 2
    cy = rahmen + round(breite * 0.0389)
    r = max(7, round(breite * 0.01425))
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(9, 11, 15, 255))
    d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=(40, 46, 58, 255),
              width=max(1, round(breite / 386)))
    return tel


def koeffizienten(ziel, quelle):
    """Perspektive: vier Punkte im Ergebnis auf vier Punkte der Vorlage."""
    m = []
    for (zx, zy), (qx, qy) in zip(ziel, quelle):
        m.append([zx, zy, 1, 0, 0, 0, -qx * zx, -qx * zy])
        m.append([0, 0, 0, zx, zy, 1, -qy * zx, -qy * zy])
    return np.linalg.solve(np.array(m, dtype=float),
                           np.array(quelle, dtype=float).reshape(8))


def kippen(tel, leinwand, ecken):
    quelle = [(0, 0), (tel.width, 0), (tel.width, tel.height), (0, tel.height)]
    k = koeffizienten(ecken, quelle)
    return tel.transform(leinwand, Image.PERSPECTIVE, k, Image.BICUBIC,
                         fillcolor=(0, 0, 0, 0))


def schlagschatten(groesse, ecken, versatz=(10, 18), deckung=130, weich=30,
                   ton=(50, 30, 5), radius=None):
    """Der Schatten muss die Form des Geräts haben, Ecken eingeschlossen –
    ein rechteckiger Schatten unter einem abgerundeten Gerät zeigt an den
    Ecken einen dunklen Zipfel, den man nicht benennen, aber sehen kann."""
    s = Image.new('RGBA', groesse, (0, 0, 0, 0))
    d = ImageDraw.Draw(s)
    p = [(x + versatz[0], y + versatz[1]) for x, y in ecken]
    if radius:
        d.rounded_rectangle((p[0][0], p[0][1], p[2][0], p[2][1]),
                            radius=radius, fill=ton + (deckung,))
    else:
        d.polygon(p, fill=ton + (deckung,))
    return s.filter(ImageFilter.GaussianBlur(weich))


def umbrechen(d, text, font, maxbreite):
    zeilen, akt = [], ''
    for w in text.split(' '):
        probe = (akt + ' ' + w).strip()
        if d.textlength(probe, font=font) > maxbreite and akt:
            zeilen.append(akt)
            akt = w
        else:
            akt = probe
    zeilen.append(akt)
    return zeilen


def mittig(d, text, font, breite, y, fuellung, **kw):
    d.text(((breite - d.textlength(text, font=font)) / 2, y), text,
           font=font, fill=fuellung, **kw)


# ── Screenshots ───────────────────────────────────────────────────────────
def baue_screenshots(k):
    s = k.get('screenshots', {})
    W, H = s.get('breite', 1080), s.get('hoehe', 1920)
    oben = s.get('geraet_oben', round(H * 0.253))
    # Untere Zielkante des Geräts: fast am Rand, ohne ihn zu berühren.
    unten = s.get('geraet_unten', round(H * 0.9557))
    f_t = schrift('fett', s.get('titel_groesse', round(W / 15.4)), k)
    f_u = schrift('normal', s.get('unter_groesse', round(W / 30)), k)
    ton = farbe(s.get('schleier_ton', '#0A0E14'))
    ziel = k.get('ausgabe', '.')
    os.makedirs(ziel, exist_ok=True)

    for i, seite in enumerate(k.get('seiten', []), 1):
        # Die Gerätebreite folgt dem Seitenverhältnis der Aufnahme: Das Gerät
        # spannt sich immer von `geraet_oben` bis `geraet_unten`, die Breite
        # ergibt sich daraus. Eine 9:19,5-Aufnahme (modernes Telefon) wird so
        # automatisch schlank; eine 9:16-Aufnahme sähe breit wie ein Tablet
        # aus – genau so kam es als Rückmeldung zurück. `geraet_breite`
        # übersteuert die Rechnung bei Bedarf.
        q = Image.open(seite['aufnahme'])
        a = q.height / q.width
        tel_b = s.get('geraet_breite')
        if not tel_b:
            r = s.get('rahmen', 15)
            for _ in range(2):
                tel_b = round((unten - oben - 2 * r) / a + 2 * r)
                r = s.get('rahmen', max(8, round(tel_b / 51)))
        rahmen = s.get('rahmen', max(8, round(tel_b / 51)))

        bild = deckend(seite['hintergrund'], W, H)
        bild = Image.alpha_composite(bild, verlauf(
            W, H, ton, s.get('kopf_deckung', 200), s.get('kopf_anteil', 0.30),
            s.get('grund_deckung', 70)))

        d = ImageDraw.Draw(bild)
        zeilen = umbrechen(d, seite['titel'], f_t, W - round(W * 0.176))
        zh = round(f_t.size * 1.23)
        y = round(H * (0.078 if len(zeilen) > 1 else 0.099))
        for t in zeilen:
            mittig(d, t, f_t, W, y, (255, 255, 255))
            y += zh
        if seite.get('unter'):
            mittig(d, seite['unter'], f_u, W, y + round(H * 0.006),
                   farbe(s.get('unter_farbe', '#D6DDE7')))

        tel_r = s.get('geraet_radius') or round(tel_b * 0.0777)
        tel = geraet(seite['aufnahme'], tel_b, rahmen, radius=tel_r)
        tx = (W - tel_b) // 2
        ecken = [(tx, oben), (tx + tel_b, oben),
                 (tx + tel_b, oben + tel.height), (tx, oben + tel.height)]
        bild = Image.alpha_composite(
            bild, schlagschatten((W, H), ecken, (8, 26), 165, 34, (0, 0, 0),
                                 radius=tel_r).crop((0, 0, W, H)))
        bild.paste(tel, (tx, oben), tel)

        name = seite.get('datei') or 'screenshot-%d.png' % i
        pfad = os.path.join(ziel, name)
        bild.convert('RGB').save(pfad, quality=95)
        print('%-24s %dx%d · Gerät %d–%d px (Rand je %d) · endet bei y=%d von %d'
              % (name, W, H, tx, tx + tel_b, tx, oben + tel.height, H))


# ── Feature-Grafik ────────────────────────────────────────────────────────
def pille(d, x, y, text, font, hoehe, fuellung, rand, schriftfarbe, luft):
    b = d.textlength(text, font=font) + 2 * luft
    d.rounded_rectangle((x, y, x + b, y + hoehe), radius=hoehe // 2,
                        fill=fuellung, outline=rand, width=2)
    o = font.getbbox(text)
    d.text((x + luft, y + (hoehe - (o[3] - o[1])) / 2 - o[1]), text,
           font=font, fill=schriftfarbe)
    return b


def baue_feature(k):
    f = k.get('feature', {})
    W, H = f.get('breite', 1024), f.get('hoehe', 500)
    # Der linke Satzspiegel ist bewusst großzügig. Play zeigt die Feature-Grafik
    # je nach Oberfläche unterschiedlich breit und schneidet dabei an den Seiten
    # an; Schrift, die dicht am Rand steht, sieht dort abgeschnitten aus, auch
    # wenn sie es in der Datei nicht ist. Alles Wichtige gehört deshalb in die
    # mittleren rund 80 Prozent.
    rand = f.get('rand', round(W * 0.107))
    ziel = k.get('ausgabe', '.')
    os.makedirs(ziel, exist_ok=True)

    bild = deckend(f['hintergrund'], W, H)

    # Die Textseite aufhellen bzw. abdunkeln, damit die Wortmarke ruhig sitzt.
    aufhellen = f.get('textseite_aufhellen', 120)
    if aufhellen:
        ton = farbe(f.get('aufhell_ton', '#FFFCF5'))
        s = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        ds = ImageDraw.Draw(s)
        for x in range(W):
            a = int(abs(aufhellen) * max(0.0, 1 - (x / W) / f.get('aufhell_anteil', 0.62)) ** 1.2)
            ds.line([(x, 0), (x, H)], fill=ton + (a,))
        bild = Image.alpha_composite(bild, s)

    # ── Gerät rechts, gekippt ─────────────────────────────────────────────
    mit_geraet = bool(f.get('aufnahme'))
    geraet_bis = None
    if mit_geraet:
        g = f.get('geraet', {})
        tel = geraet(f['aufnahme'], g.get('breite', 660), g.get('rahmen', 26))

        if g.get('vollstaendig', True):
            # Das Gerät wird so berechnet, dass es vollständig ins Bild passt.
            # Läuft es unten heraus, liest sich das im Store als angeschnittenes
            # Bild – auch wenn es als Tiefenwirkung gemeint war. Genau das kam
            # als Rückmeldung zurück, deshalb ist Einpassen die Vorgabe.
            luft = g.get('luft', 18)                   # oben und unten
            rechts = g.get('luft_rechts', 24)
            rad = math.radians(abs(g.get('neigung', 7.3)))
            co, si = math.cos(rad), math.sin(rad)
            seiten = tel.height / tel.width
            # Höhe des gedrehten Rechtecks: L·cos + (L/seiten)·sin
            lang = (H - 2 * luft) / (co + si / seiten)
            quer = lang / seiten
            breit = quer * co + lang * si              # Breite des Umrisses
            TL = (W - rechts - breit, luft + quer * si)
            TR = (TL[0] + quer * co, TL[1] - quer * si)
            ll = lang
            lr = lang * g.get('verjuengung', 0.95)     # rechte Kante kürzer
        else:
            TL = tuple(g.get('oben_links', [618, 60]))
            TR = tuple(g.get('oben_rechts', [945, 18]))
            # Die Seitenlängen folgen dem Seitenverhältnis der Aufnahme,
            # sonst wird das Telefon gestaucht oder gestreckt. Wer sie doch
            # von Hand setzt, übersteuert damit bewusst die Proportionen.
            kante = ((TR[0] - TL[0]) ** 2 + (TR[1] - TL[1]) ** 2) ** 0.5 \
                * tel.height / tel.width
            ll = g.get('kante_links', kante)
            lr = g.get('kante_rechts', kante * g.get('verjuengung', 0.95))

        ex, ey = TR[0] - TL[0], TR[1] - TL[1]
        lg = (ex * ex + ey * ey) ** 0.5
        px, py = -ey / lg, ex / lg                     # Lot, zeigt nach unten
        # Rechte Kante kürzer als die linke – daraus entsteht die Tiefe.
        ecken = [TL, TR,
                 (TR[0] + px * lr, TR[1] + py * lr),
                 (TL[0] + px * ll, TL[1] + py * ll)]
        leinwand = (W, int(max(p[1] for p in ecken)) + 40)
        bild = Image.alpha_composite(
            bild, schlagschatten(leinwand, ecken).crop((0, 0, W, H)))
        bild = Image.alpha_composite(
            bild, kippen(tel, leinwand, ecken).crop((0, 0, W, H)))
        geraet_bis = max(p[0] for p in ecken)
        geraet_rand = (min(p[0] for p in ecken), min(p[1] for p in ecken),
                       W - geraet_bis, H - max(p[1] for p in ecken))

    # ── Linke Spalte als Block vermessen und mittig setzen ────────────────
    d = ImageDraw.Draw(bild)
    sym_g = f.get('symbol_groesse', 86)
    f_t = schrift('fett', f.get('titel_groesse', 58), k)
    f_s = schrift('normal', f.get('unter_groesse', 25), k)
    f_p = schrift('fett', f.get('pillen_groesse', 21), k)
    f_n = schrift('normal', f.get('fuss_groesse', 20), k)
    zh = round(f_t.size * 1.14)
    pillen_h = f.get('pillen_hoehe', 44)

    hat_symbol = bool(f.get('symbol'))
    zeilen = f.get('wortmarke', [])
    hoch = 0
    if hat_symbol:
        hoch += sym_g + 30
    hoch += zh * len(zeilen)
    if f.get('untertitel'):
        hoch += 22 + round(f_s.size * 1.2)
    if f.get('pillen'):
        hoch += 20 + pillen_h
    if f.get('fusszeile'):
        hoch += 26 + round(f_n.size * 1.2)
    y = max(24, (H - hoch) // 2)

    if hat_symbol:
        r = round(sym_g * 0.235)
        sym = runde_ecken(Image.open(f['symbol']).convert('RGBA')
                          .resize((sym_g, sym_g), Image.LANCZOS), r)
        sch = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(sch).rounded_rectangle(
            (rand + 3, y + 8, rand + sym_g + 3, y + sym_g + 8),
            radius=r, fill=(60, 40, 5, 90))
        bild = Image.alpha_composite(bild, sch.filter(ImageFilter.GaussianBlur(12)))
        bild.paste(sym, (rand, y), sym)
        d = ImageDraw.Draw(bild)
        y += sym_g + 30

    # Wortmarke: je Zeile eine Liste von [Text, Farbe] oder
    # [Text, Farbe, Konturfarbe]. Die Kontur braucht man, wenn eine helle
    # Farbe auf hellem Grund steht – Gold franst sonst sichtbar aus.
    breiteste = 0
    for zeile in zeilen:
        x = rand
        for stueck in zeile:
            text, fb = stueck[0], farbe(stueck[1])
            extra = (dict(stroke_width=2, stroke_fill=farbe(stueck[2]))
                     if len(stueck) > 2 and stueck[2] else {})
            d.text((x, y), text, font=f_t, fill=fb, **extra)
            x += d.textlength(text, font=f_t)
        breiteste = max(breiteste, x - rand)
        y += zh

    if f.get('untertitel'):
        y += 22
        d.text((rand + 2, y), f['untertitel'], font=f_s,
               fill=farbe(f.get('unter_farbe', '#5C5242')))
        breiteste = max(breiteste, d.textlength(f['untertitel'], font=f_s))
        y += round(f_s.size * 1.2)

    pillen_bis = rand
    if f.get('pillen'):
        y += 20
        px_ = rand
        for t in f['pillen']:
            px_ += pille(d, px_, y, t, f_p, pillen_h,
                         farbe(f.get('pillen_fuellung', '#FFFFFF')) + (235,),
                         (0, 0, 0, 32),
                         farbe(f.get('pillen_schrift', '#2C2822')),
                         f.get('pillen_luft', 20)) + 12
        pillen_bis = px_ - 12
        breiteste = max(breiteste, pillen_bis - rand)
        y += pillen_h

    if f.get('fusszeile'):
        y += 26
        d.text((rand + 2, y), f['fusszeile'], font=f_n,
               fill=farbe(f.get('fuss_farbe', '#7A6E5C')))
        breiteste = max(breiteste, d.textlength(f['fusszeile'], font=f_n))
        y += round(f_n.size * 1.2)

    name = f.get('datei', 'feature-grafik.png')
    pfad = os.path.join(ziel, name)
    bild.convert('RGB').save(pfad, quality=95)

    text_bis = rand + breiteste
    print('%-24s %dx%d · Textspalte %d–%d px · Block %d–%d px hoch'
          % (name, W, H, rand, round(text_bis), max(24, (H - hoch) // 2), y))
    sicher = round(W * 0.08)
    if rand < sicher:
        print('  ⚠ Nur %d px Rand links (Sicherheitszone %d px). Play schneidet '
              'die Grafik je nach Oberfläche seitlich an – "rand" erhöhen.'
              % (rand, sicher))
    if mit_geraet:
        li, ob, re, un = (round(v) for v in geraet_rand)
        print('%-24s Gerät: Rand links %d · oben %d · rechts %d · unten %d px'
              % ('', li, ob, re, un))
        # Nach unten auszulaufen ist eine gestalterische Entscheidung und
        # erzeugt Tiefe – sie wird mit "vollstaendig": false getroffen. Oben
        # und seitlich ist ein Anschnitt dagegen immer ein Versehen.
        seiten = [('links', li), ('oben', ob), ('rechts', re)]
        if f.get('geraet', {}).get('vollstaendig', True):
            seiten.append(('unten', un))
        for seite, wert in seiten:
            if wert < 4:
                print('  ⚠ Gerät ist %s angeschnitten (%d px). Mit '
                      '"geraet": {"vollstaendig": true} passt es sich selbst ein.'
                      % (seite, wert))
        if li < text_bis:
            print('  ⚠ Text läuft unter das Gerät (Text bis %d, Gerät ab %d) – '
                  'Textspalte kürzen oder geraet.luft_rechts verringern.'
                  % (round(text_bis), li))


# ── Einstieg ──────────────────────────────────────────────────────────────
def main():
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('konfig', help='JSON-Datei mit den Angaben')
    p.add_argument('--nur', choices=['feature', 'screenshots'],
                   help='nur diesen Teil bauen')
    a = p.parse_args()

    with open(a.konfig, encoding='utf-8') as fh:
        k = json.load(fh)

    # Relative Pfade beziehen sich auf die Konfigurationsdatei, nicht auf das
    # Arbeitsverzeichnis – sonst hängt das Ergebnis davon ab, von wo aus man
    # das Skript startet.
    basis = os.path.dirname(os.path.abspath(a.konfig))
    os.chdir(basis)

    if a.nur != 'screenshots' and k.get('feature'):
        baue_feature(k)
    if a.nur != 'feature' and k.get('seiten'):
        baue_screenshots(k)


if __name__ == '__main__':
    main()
