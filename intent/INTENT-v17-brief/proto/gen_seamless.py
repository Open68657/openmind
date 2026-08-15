# Make the Nano-Banana crayon scan tileable and install it as the live
# crayon texture (procedural v4 kept aside for instant revert).
#
# The scan is a page: dense scribble center, white margins. Raw tiling would
# repeat the margins as visible frames — the exact "tiles" complaint. So:
# crop the dense square, then the classic two-pass wrap-heal, PIL-only:
# roll half a period on one axis (ImageChops.offset wraps), and composite the
# unrolled image back over the moved seam with a 1-D feathered band. A 1-D
# mask is constant along the other axis, so each pass is border-safe by
# construction and the second pass cannot break the first (same blend weights
# down entire columns/rows keeps tile-edge continuity).
from PIL import Image, ImageChops

SP = '/tmp/claude-0/-home-user-openmind/ae44b732-b8e2-5354-863d-169376d2a9bc/scratchpad'
PKG = f'{SP}/intent_v17/INTENT-v17-brief'
TEX = f'{PKG}/proto/textures'
GEN = '/home/user/openmind/intent/INTENT-v17-brief/proto/textures/_gen'
N, F = 1024, 80  # size, feather half-width (110 misted a wider stripe)

im = Image.open(f'{GEN}/crayon-nanobanana-orig.png')
bg = Image.new('RGB', im.size, (255, 255, 255))
bg.paste(im, mask=im.split()[3] if im.mode == 'RGBA' else None)
# crop edges deliberately in the QUIET margins (mostly paper): after the
# half-period roll those edges become the heal bands, and a paper-with-paper
# crossfade is invisible, where an ink crossfade ghosts. First try cropped
# tight into the dense mass and wore two misty stripes for it.
im = bg.crop((75, 92, 955, 908)).resize((N, N), Image.LANCZOS)

# Flatten the scan's paper illumination (the page vignettes toward its edges;
# after the roll, bright-center paper lands next to dim-edge paper and the
# heal band reads as a milky stripe). Brighten-only gain from the blurred
# luminance toward one paper white — also the whiter paper that was asked
# for. Ink survives: the gain is clamped and dense masses get at most +35%.
from PIL import ImageFilter
paper = (im.convert('L')
           .filter(ImageFilter.MaxFilter(31))     # paper level through the gaps
           .filter(ImageFilter.GaussianBlur(40))).getdata()
px = list(im.getdata())
im.putdata([
    (min(255, round(r * f)), min(255, round(g * f)), min(255, round(b * f)))
    for (r, g, b), lb in zip(px, paper)
    for f in (min(1.30, max(1.0, 245 / max(lb, 1))),)
])

def band(v):
    t = max(0.0, 1.0 - abs(v - N // 2) / F)
    return round(255 * t * t * (3 - 2 * t))

row = Image.new('L', (N, 1)); row.putdata([band(x) for x in range(N)])
Mx = row.resize((N, N), Image.NEAREST)
col = Image.new('L', (1, N)); col.putdata([band(y) for y in range(N)])
My = col.resize((N, N), Image.NEAREST)

A = Image.composite(im, ImageChops.offset(im, N // 2, 0), Mx)
B = Image.composite(A, ImageChops.offset(A, 0, N // 2), My)

# keep the procedural v4 for revert, then install
import shutil, os
os.makedirs(GEN, exist_ok=True)
if not os.path.exists(f'{GEN}/crayon-procedural-v4.jpg'):
    shutil.copy(f'{TEX}/crayon.jpg', f'{GEN}/crayon-procedural-v4.jpg')
B.save(f'{TEX}/crayon.jpg', quality=90)
B.resize((768, 768), Image.LANCZOS).save(f'{TEX}/baked/crayon.jpg', quality=85)
B.save(f'{GEN}/crayon-nanobanana-tile.jpg', quality=90)

half = B.resize((512, 512), Image.LANCZOS)
sheet = Image.new('RGB', (1024, 1024))
for ox in (0, 512):
    for oy in (0, 512):
        sheet.paste(half, (ox, oy))
sheet.save(f'{PKG}/shots-v17/crayon-gen-2x2-proof.jpg', quality=88)
print('ok', B.size)
