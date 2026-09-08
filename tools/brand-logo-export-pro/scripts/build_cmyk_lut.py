"""
Bake sRGB -> CMYK lookup tables from the real Adobe ICC profiles, so the tool
converts exactly the way Illustrator/Photoshop does (Relative Colorimetric + BPC,
Adobe's default for RGB -> CMYK).

Output: a TS module holding one base64 LUT per profile.
"""
import base64, itertools, json, os, sys
from PIL import Image, ImageCms

ADOBE = "/Library/Application Support/Adobe/Color/Profiles/Recommended"
PROFILES = [
    ("swop",    "U.S. Web Coated (SWOP) v2", f"{ADOBE}/USWebCoatedSWOP.icc"),
    ("fogra39", "Coated FOGRA39",            f"{ADOBE}/CoatedFOGRA39.icc"),
    ("gracol",  "Coated GRACoL 2006",        f"{ADOBE}/CoatedGRACoL2006.icc"),
]
N = int(sys.argv[1]) if len(sys.argv) > 1 else 17
FLAGS = ImageCms.FLAGS["BLACKPOINTCOMPENSATION"]
INTENT = ImageCms.Intent.RELATIVE_COLORIMETRIC


def grid_rgb(n):
    """The n^3 grid, R slowest -> B fastest (matches the JS index math)."""
    step = [round(i * 255 / (n - 1)) for i in range(n)]
    return [(r, g, b) for r in step for g in step for b in step]


def convert(pixels, icc_path):
    src = ImageCms.createProfile("sRGB")
    dst = ImageCms.getOpenProfile(icc_path)
    tf = ImageCms.buildTransform(src, dst, "RGB", "CMYK", renderingIntent=INTENT, flags=FLAGS)
    im = Image.new("RGB", (len(pixels), 1))
    im.putdata(pixels)
    # PIL hands back device values directly: 0 = no ink, 255 = full ink.
    return list(ImageCms.applyTransform(im, tf).getdata())


def emit():
    entries = []
    for key, label, path in PROFILES:
        if not os.path.exists(path):
            raise SystemExit(f"missing profile: {path}")
        data = convert(grid_rgb(N), path)
        buf = bytes(itertools.chain.from_iterable(data))
        entries.append((key, label, base64.b64encode(buf).decode()))
        print(f"{key}: {len(buf)} bytes -> {len(entries[-1][2])} b64 chars", file=sys.stderr)
    return entries


def check():
    """Interpolation error vs. a direct profile conversion, on a spread of colors."""
    import random
    random.seed(7)
    probes = [(random.randrange(256), random.randrange(256), random.randrange(256)) for _ in range(400)]
    probes += [(197, 26, 26), (0, 0, 0), (255, 255, 255), (128, 128, 128), (0, 122, 255)]
    for key, label, path in PROFILES:
        lut = convert(grid_rgb(N), path)
        exact = convert(probes, path)
        worst = avg = 0.0
        for (r, g, b), ex in zip(probes, exact):
            got = interp(lut, N, r, g, b)
            d = max(abs(a - c) for a, c in zip(got, ex)) / 255 * 100
            worst = max(worst, d)
            avg += d
        print(f"{key:8s} N={N}  avg err {avg/len(probes):.2f}%  worst {worst:.2f}%", file=sys.stderr)


def interp(lut, n, r, g, b):
    """Trilinear, mirroring the TS implementation."""
    def axis(v):
        f = v / 255 * (n - 1)
        i = min(int(f), n - 2)
        return i, f - i
    ri, rf = axis(r); gi, gf = axis(g); bi, bf = axis(b)
    out = [0.0] * 4
    for dr in (0, 1):
        for dg in (0, 1):
            for db in (0, 1):
                w = (rf if dr else 1 - rf) * (gf if dg else 1 - gf) * (bf if db else 1 - bf)
                if not w:
                    continue
                cell = lut[((ri + dr) * n + (gi + dg)) * n + (bi + db)]
                for i in range(4):
                    out[i] += cell[i] * w
    return out


if __name__ == "__main__":
    if "--check" in sys.argv:
        check()
    else:
        print(json.dumps([{"key": k, "label": l, "data": d} for k, l, d in emit()]))
