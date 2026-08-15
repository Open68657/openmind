#!/usr/bin/env python3
"""Round-3 texture work, 15 Aug 26.

PULL  — "the colours are not so harmonious." The scan's structure (veins,
        squeegee ridges, the pour regions) is exactly what the material is
        about, so the geometry of the image is not touched at all: a smooth
        circular hue LUT moves the palette from fighting primaries into one
        family — blue→indigo, green→turquoise, red→terracotta, orange→ochre —
        and saturation is eased, the warm side more than the cool.

CRAYON — "the tiles can be improved." Two real faults in the original scan:
        the edges do not wrap (grid lines at every tile border) and it has
        landmark patches (the dark-green crosshatch, the yellow field) that
        re-appear every repeat and give the grid away. A photo cannot be
        de-landmarked honestly with the tools here, so the field is REDRAWN:
        every stroke is drawn nine times on a torus (seamless by
        construction), positions are stratified so coverage is even and no
        patch is anyone's landmark, and the palette is sampled from the
        original scan so the crayons stay Hadar's crayons. Original kept in
        textures/_originals/.
"""
import math, os, random
from PIL import Image, ImageDraw, ImageChops, ImageFilter

# next to this script when it lives in proto/, with the scratchpad
# checkout as fallback so the same file runs in both homes
_here = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'textures')
TEX = _here if os.path.isdir(_here) else \
    '/tmp/claude-0/-home-user-openmind/ae44b732-b8e2-5354-863d-169376d2a9bc/scratchpad/intent_v17/INTENT-v17-brief/proto/textures'
random.seed(17)

# ---------------------------------------------------------------- pull
def remap_pull():
    im = Image.open(f'{TEX}/_originals/pull.jpg').convert('RGB')
    hsv = im.convert('HSV')
    H, S, V = hsv.split()

    # anchors in degrees, circularly interpolated; monotonic in the lifted
    # sense so no two source hues cross on the way to their targets
    anchors = [(0, 12), (30, 38), (60, 48), (120, 175), (180, 200),
               (240, 235), (300, 290), (360, 372)]
    lut = []
    for h8 in range(256):
        hdeg = h8 * 360.0 / 256.0
        for (a0, b0), (a1, b1) in zip(anchors, anchors[1:]):
            if a0 <= hdeg <= a1:
                t = (hdeg - a0) / (a1 - a0)
                out = b0 + (b1 - b0) * t
                break
        lut.append(int(round((out % 360) * 256.0 / 360.0)) % 256)
    H2 = H.point(lut)

    # saturation: eased everywhere, the warm accents most — terracotta and
    # ochre read as paint, full-bore red reads as a traffic sign
    warm = H.point(lambda h: 255 if (h < 45 or h > 228) else 0)
    warm = warm.filter(ImageFilter.GaussianBlur(3))
    S_cool = S.point(lambda s: int(s * 0.88))
    S_warm = S.point(lambda s: int(s * 0.68))
    S2 = Image.composite(S_warm, S_cool, warm)

    out = Image.merge('HSV', (H2, S2, V)).convert('RGB')
    out.save(f'{TEX}/pull.jpg', quality=92)
    out.resize((768, 768), Image.LANCZOS).save(f'{TEX}/baked/pull.jpg', quality=85)
    print('pull remapped')

# ------------------------------------------------------------- crayon
def periodic_noise(size, grid):
    """Value noise whose period is exactly `size`: a random grid tiled 3x3,
    resized so one grid-period spans `size`, centre-cropped one period."""
    k = size // grid
    g = Image.effect_noise((grid, grid), 64).convert('L')
    tiled = Image.new('L', (grid * 3, grid * 3))
    for i in range(3):
        for j in range(3):
            tiled.paste(g, (i * grid, j * grid))
    big = tiled.resize((grid * 3 * k, grid * 3 * k), Image.BILINEAR)
    off = grid * k
    return big.crop((off, off, off + size, off + size))

def sample_palette(path, n=5):
    im = Image.open(path).convert('RGB').resize((128, 128))
    q = im.quantize(10, method=Image.MEDIANCUT).convert('RGB')
    counts = {}
    for c in q.getdata():
        counts[c] = counts.get(c, 0) + 1
    cols = sorted(counts, key=counts.get, reverse=True)
    # drop paper (bright, low-chroma) and near-black
    keep = []
    for r, g, b in cols:
        mx, mn = max(r, g, b), min(r, g, b)
        if mx > 235 and mx - mn < 60:  # paper
            continue
        if mx < 60:
            continue
        keep.append((r, g, b))
    return keep[:n]

def gen_crayon(size=1024):
    # the original scan's crayons, read off it directly — quantizing averaged
    # them with the paper and handed back pastels
    palette = [(39, 87, 184), (217, 58, 48), (44, 143, 82),
               (240, 205, 42), (224, 85, 157), (58, 157, 170)]
    weights = [3, 3, 3, 2, 2, 1]          # blue/red/green carry, teal accents
    bag = [c for c, w in zip(palette, weights) for _ in range(w)]

    paper = Image.new('RGB', (size, size), (249, 246, 238))
    mottle = periodic_noise(size, 128).point(lambda x: 238 + x * 17 // 255)
    paper = ImageChops.multiply(paper, Image.merge('RGB', (mottle,) * 3))

    # the paper's tooth — one field for every stroke, because the skipping
    # happens at the paper's valleys and the paper is the same paper
    fine = periodic_noise(size, 256)
    coarse = periodic_noise(size, 128)
    tooth = ImageChops.blend(fine, coarse, 0.4)
    tooth = tooth.point(lambda x: int(48 + (x / 255) ** 0.85 * 207))

    canvas = paper.copy()
    # a crayon mark is a SCRIBBLE, not a stick: one polyline going back and
    # forth without lifting, advancing sideways a stroke-width per pass. 88
    # of them, stratified on an 11x8 grid so coverage is even and nothing
    # becomes the landmark that gives a repeat away.
    CX, CY = 8, 6
    order = [(i, j) for i in range(CX) for j in range(CY)]
    random.shuffle(order)
    deal = []
    while len(deal) < len(order):
        w = bag[:]
        random.shuffle(w)
        deal += w

    for (ci, cj), col in zip(order, deal):
        cx = (ci + random.uniform(0.15, 0.85)) * size / CX
        cy = (cj + random.uniform(0.15, 0.85)) * size / CY
        minor = random.random() < 0.30
        ang = math.radians((35 if minor else -55) + random.uniform(-9, 9))
        # long and narrow: a scribble runs much further than it advances,
        # and the paper between scribbles is a third of the sheet
        length = random.uniform(280, 430)
        wid = random.randint(13, 17)
        passes = random.randint(3, 7)
        gap = wid * random.uniform(1.0, 1.3)
        vj = random.uniform(0.88, 1.06)
        c = tuple(min(255, int(v * vj)) for v in col)

        dx, dy = math.cos(ang), math.sin(ang)
        px, py = -dy, dx
        pts = []
        for p in range(passes):
            side = 1 if p % 2 == 0 else -1
            lat = (p - passes / 2) * gap
            ln = length * random.uniform(0.82, 1.0)
            for t in (-0.5 * side, 0, 0.5 * side):
                wob = random.uniform(-5, 5)
                pts.append((cx + dx * ln * t + px * (lat + wob),
                            cy + dy * ln * t + py * (lat + wob)))

        layer = Image.new('L', (size, size), 0)
        d = ImageDraw.Draw(layer)
        for ox in (-size, 0, size):
            for oy in (-size, 0, size):
                d.line([(x + ox, y + oy) for x, y in pts],
                       fill=240, width=wid, joint='curve')
        alpha = ImageChops.multiply(layer, tooth)
        canvas.paste(Image.new('RGB', (size, size), c), (0, 0), alpha)

    canvas.save(f'{TEX}/crayon.jpg', quality=90)
    canvas.resize((768, 768), Image.LANCZOS).save(f'{TEX}/baked/crayon.jpg', quality=85)
    print('crayon regenerated')

remap_pull()
gen_crayon()

# proof sheet: each result tiled 2x2 so the wrap is judged at a glance
for name in ('pull', 'crayon'):
    im = Image.open(f'{TEX}/{name}.jpg').resize((512, 512))
    sheet = Image.new('RGB', (1024, 1024))
    for i in (0, 512):
        for j in (0, 512):
            sheet.paste(im, (i, j))
    sheet.save(f'{TEX}/../../../{name}-2x2-proof.png')
print('proof sheets written')
