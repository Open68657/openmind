#!/usr/bin/env python3
"""Rounds 3-4 texture work, 15 Aug 26.

PULL   — round 4: "still not harmonious, I don't like reds with blue and
         orange." Three candidate palettes, judged as 2x2 sheets; the image's
         structure is never touched (hue LUT + per-hue saturation only, V
         intact). A = sea/sand (aqua family + golden sand, no red at all),
         B = soft sunset (coral/peach/gold + plum, no blue), C = sage/mustard
         (olive-sage-teal + mustard, earthy). A ships as the live default
         until told otherwise.

CRAYON — round 4: "worse than before — faded, and feels like too many tiles.
         Should feel like a white/cream form freely scribbled on." So: cream
         ground, FEW bold saturated scribbles (12 vs 48), each long and
         confident, torus-drawn (still seamless), ~40% ink. Profile tile went
         240→400 in index.html so one scribble reads as one hand mark.
"""
import math, os, random
from PIL import Image, ImageDraw, ImageChops, ImageFilter

_here = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'textures')
TEX = _here if os.path.isdir(_here) else \
    '/tmp/claude-0/-home-user-openmind/ae44b732-b8e2-5354-863d-169376d2a9bc/scratchpad/intent_v17/INTENT-v17-brief/proto/textures'
OUT2 = os.path.dirname(os.path.dirname(os.path.dirname(TEX)))   # intent_v17/
random.seed(17)

# ---------------------------------------------------------------- pull
# anchors: (source hue deg, target hue deg possibly lifted >360, sat factor)
PALETTES = {
    'A-sea-sand': [(0, 40, .45), (30, 44, .5), (60, 52, .55), (120, 165, .72),
                   (180, 188, .8), (240, 200, .85), (300, 242, .45), (360, 400, .45)],
    'B-sunset':   [(0, 10, .6), (30, 25, .55), (60, 40, .5), (120, 48, .4),
                   (180, 290, .45), (240, 310, .55), (300, 335, .5), (360, 370, .6)],
    'C-sage':     [(0, 44, .6), (30, 48, .55), (60, 58, .5), (120, 95, .5),
                   (180, 140, .4), (240, 168, .42), (300, 330, .3), (360, 404, .6)],
    # the studio's own list, 15 Aug evening: violet-leaning blue, azure,
    # turquoise, light green, lime, and just a little egg-yolk yellow —
    # saturated but not glowing. Blues (the biggest regions) carry the
    # violet-blue→azure span; greens go light-green; the scan's reds and
    # oranges are the only warmth left, so THEY become the yolk, tempered.
    'D-tchelet':  [(0, 38, .6), (30, 52, .68), (60, 78, .65), (120, 135, .7),
                   (180, 182, .8), (240, 244, .78), (300, 275, .55), (360, 398, .6)],
    # the studio's exact swatch card (15 Aug, hexes in hand): Winter Lilac
    # A196F8 (h247), Blue Genie 6C5FFF (h245), Science Blue 0A58DD (h219),
    # Mermaid Lagoon 13C2B7 (h176), Ulva Lactuca 7FEB96 (h133),
    # Highlighter EEFF00 (h64). Scan blues carry Science Blue through Genie,
    # magentas go Lilac, greens Ulva, cyans Mermaid, and the one warmth
    # left — the old reds/oranges — becomes the Highlighter.
    'E-swatch':   [(0, 64, .8), (30, 70, .7), (60, 90, .6), (120, 133, .55),
                   (180, 176, .85), (210, 219, .9), (240, 243, .8), (300, 248, .6),
                   (360, 424, .8)],
}

def remap_pull(pal_name, live=False):
    anchors = PALETTES[pal_name]
    im = Image.open(f'{TEX}/_originals/pull.jpg').convert('RGB')
    H, S, V = im.convert('HSV').split()

    hlut, slut = [], []
    for h8 in range(256):
        hdeg = h8 * 360.0 / 256.0
        for (a0, b0, s0), (a1, b1, s1) in zip(anchors, anchors[1:]):
            if a0 <= hdeg <= a1:
                t = (hdeg - a0) / (a1 - a0)
                out = b0 + (b1 - b0) * t
                sf = s0 + (s1 - s0) * t
                break
        hlut.append(int(round((out % 360) * 256.0 / 360.0)) % 256)
        slut.append(int(round(sf * 255)))
    H2 = H.point(hlut)
    # per-hue saturation factor, applied as an image multiply (S * f(H))
    S2 = ImageChops.multiply(S, H.point(slut))

    out = Image.merge('HSV', (H2, S2, V)).convert('RGB')
    tile = out.resize((512, 512), Image.LANCZOS)
    sheet = Image.new('RGB', (1024, 1024))
    for i in (0, 512):
        for j in (0, 512):
            sheet.paste(tile, (i, j))
    sheet.save(f'{OUT2}/pull-pal-{pal_name}-2x2.jpg', quality=88)
    if live:
        out.save(f'{TEX}/pull.jpg', quality=92)
        out.resize((768, 768), Image.LANCZOS).save(f'{TEX}/baked/pull.jpg', quality=85)
    print('pull palette', pal_name, 'live' if live else 'proof')

# ------------------------------------------------------------- crayon
def periodic_noise(size, grid):
    k = size // grid
    g = Image.effect_noise((grid, grid), 64).convert('L')
    tiled = Image.new('L', (grid * 3, grid * 3))
    for i in range(3):
        for j in range(3):
            tiled.paste(g, (i * grid, j * grid))
    big = tiled.resize((grid * 3 * k, grid * 3 * k), Image.BILINEAR)
    off = grid * k
    return big.crop((off, off, off + size, off + size))

def gen_crayon(size=1024):
    palette = [(39, 87, 184), (217, 58, 48), (44, 143, 82),
               (240, 205, 42), (224, 85, 157), (58, 157, 170)]
    weights = [3, 3, 3, 2, 2, 1]
    bag = [c for c, w in zip(palette, weights) for _ in range(w)]

    # the cream form itself — "a white/cream shape that was scribbled on"
    paper = Image.new('RGB', (size, size), (246, 241, 228))
    mottle = periodic_noise(size, 128).point(lambda x: 240 + x * 15 // 255)
    paper = ImageChops.multiply(paper, Image.merge('RGB', (mottle,) * 3))

    fine = periodic_noise(size, 256)
    coarse = periodic_noise(size, 128)
    tooth = ImageChops.blend(fine, coarse, 0.4)
    # the wax grain must READ inside a stroke (a flat core is a marker, not a
    # crayon) while the colour stays saturated: contrast in the tooth, floor
    # high enough that no pass drops out
    tooth = tooth.point(lambda x: int(58 + (x / 255) ** 1.1 * 197))

    canvas = paper.copy()
    # twelve bold scribbles. Stratified so no corner goes empty, shuffled so
    # the colour deal stays even; each is one long back-and-forth polyline,
    # drawn nine times on the torus — seamless stays structural.
    CX, CY = 4, 4
    order = [(i, j) for i in range(CX) for j in range(CY)]
    random.shuffle(order)
    deal = []
    while len(deal) < len(order):
        w = bag[:]
        random.shuffle(w)
        deal += w

    # "it should feel free, as if a child scribbled all kinds of things" —
    # so not one scribble grammar but four: back-and-forth hatches, cursive
    # loops, a wandering scrawl, and the round tornado every child draws.
    def pts_hatch(cx, cy, ang):
        length = random.uniform(380, 580)
        passes = random.randint(3, 6)
        wid = random.randint(20, 28)
        gap = wid * random.uniform(0.85, 1.1)
        dx, dy = math.cos(ang), math.sin(ang)
        px, py = -dy, dx
        pts = []
        for p in range(passes):
            side = 1 if p % 2 == 0 else -1
            lat = (p - passes / 2) * gap
            ln = length * random.uniform(0.85, 1.0)
            for t, wr in ((-0.5 * side, 9), (0, 16), (0.5 * side, 9)):
                wob = random.uniform(-wr, wr)
                pts.append((cx + dx * ln * t + px * (lat + wob),
                            cy + dy * ln * t + py * (lat + wob)))
        return pts, wid

    def pts_loops(cx, cy, ang):
        length = random.uniform(300, 480)
        loops = random.randint(3, 5)
        r = random.uniform(26, 44)
        wid = random.randint(15, 21)
        dx, dy = math.cos(ang), math.sin(ang)
        px, py = -dy, dx
        pts = []
        n = loops * 14
        for i in range(n + 1):
            t = i / n
            ph = 6.2832 * loops * t + 1.2
            a = t * length - length / 2 + r * math.cos(ph)
            b = r * 1.25 * math.sin(ph)
            pts.append((cx + dx * a + px * b, cy + dy * a + py * b))
        return pts, wid

    def pts_scrawl(cx, cy, ang):
        segs = random.randint(7, 10)
        step = random.uniform(50, 75)
        wid = random.randint(16, 24)
        h = ang
        x, y = cx - math.cos(ang) * segs * step / 2, cy - math.sin(ang) * segs * step / 2
        pts = [(x, y)]
        for _ in range(segs):
            h += random.uniform(-0.7, 0.7)
            x += math.cos(h) * step
            y += math.sin(h) * step
            pts.append((x, y))
        return pts, wid

    def pts_tornado(cx, cy, ang):
        turns = random.uniform(2.6, 3.8)
        R = random.uniform(55, 95)
        wid = random.randint(14, 19)
        pts = []
        n = int(turns * 14)
        for i in range(n + 1):
            t = i / n
            ph = 6.2832 * turns * t + ang
            r = 8 + (R - 8) * t
            pts.append((cx + r * math.cos(ph) * 1.15, cy + r * math.sin(ph)))
        return pts, wid

    kinds = [pts_hatch, pts_hatch, pts_hatch, pts_loops, pts_loops,
             pts_scrawl, pts_scrawl, pts_tornado]
    random.shuffle(kinds)

    for k, ((ci, cj), col) in enumerate(zip(order, deal)):
        cx = (ci + random.uniform(0.2, 0.8)) * size / CX
        cy = (cj + random.uniform(0.2, 0.8)) * size / CY
        minor = random.random() < 0.30
        ang = math.radians((35 if minor else -55) + random.uniform(-10, 10))
        kind = kinds[k % len(kinds)]
        if kind is not pts_hatch:
            ang = random.uniform(0, 6.2832)   # only the hatches keep a family
        pts, wid = kind(cx, cy, ang)
        vj = random.uniform(0.9, 1.05)
        c = tuple(min(255, int(v * vj)) for v in col)

        layer = Image.new('L', (size, size), 0)
        d = ImageDraw.Draw(layer)
        for ox in (-size, 0, size):
            for oy in (-size, 0, size):
                poly = [(x + ox, y + oy) for x, y in pts]
                # full width laid lighter, narrow core pressed harder — the
                # pressure profile a wax stick actually leaves
                d.line(poly, fill=215, width=wid, joint='curve')
                d.line(poly, fill=255, width=max(6, wid - 9), joint='curve')
        alpha = ImageChops.multiply(layer, tooth)
        canvas.paste(Image.new('RGB', (size, size), c), (0, 0), alpha)

    canvas.save(f'{TEX}/crayon.jpg', quality=90)
    canvas.resize((768, 768), Image.LANCZOS).save(f'{TEX}/baked/crayon.jpg', quality=85)

    tile = canvas.resize((512, 512), Image.LANCZOS)
    sheet = Image.new('RGB', (1024, 1024))
    for i in (0, 512):
        for j in (0, 512):
            sheet.paste(tile, (i, j))
    sheet.save(f'{OUT2}/crayon-2x2-proof.jpg', quality=88)
    print('crayon regenerated (bold sparse on cream)')

remap_pull('E-swatch', live=True)
print('done')
