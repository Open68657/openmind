"""
V | 2026-2027 Executive Social Strategy: 5-slide CEO deck (16:9, dark mode).

    pip install python-pptx
    python build_deck.py            -> V_Social_Strategy_CEO.pptx

Speaker notes (voiceover + tough question + answer) are embedded in every slide.
Visuals are crops from the "Social Plan" and "Social Workshop" decks, stored in ./assets
(kept out of git: this repo is public).
A missing asset renders as a labeled placeholder, so the deck always builds.
"""
from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Inches, Pt

HERE = Path(__file__).parent
ASSETS = HERE / "assets"
OUT = HERE / "V_Social_Strategy_CEO.pptx"

# ---------- Palette & type ----------
BG = RGBColor(0x0B, 0x0B, 0x0C)
CARD = RGBColor(0x16, 0x16, 0x18)
CARD_HI = RGBColor(0x1E, 0x1E, 0x21)
LINE = RGBColor(0x2C, 0x2C, 0x30)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
GREY = RGBColor(0xA0, 0xA0, 0xA0)
DIM = RGBColor(0x5E, 0x5E, 0x62)
GOLD = RGBColor(0xFF, 0xE2, 0x12)  # V yellow, sampled from the Social Plan deck
GOLD_DEEP = RGBColor(0x2E, 0x29, 0x05)
INK = RGBColor(0x0B, 0x0B, 0x0C)

HEAD = "Arial Black"  # ships with Windows & macOS: heavy, punchy headlines
BODY = "Arial"

prs = Presentation()
prs.slide_width, prs.slide_height = Inches(13.333), Inches(7.5)
SW, SH = prs.slide_width, prs.slide_height
M = Inches(0.75)  # outer margin
CW = SW - 2 * M  # content width


# ---------- Primitives ----------
def new_slide():
    s = prs.slides.add_slide(prs.slide_layouts[6])
    s.background.fill.solid()
    s.background.fill.fore_color.rgb = BG
    return s


def box(s, x, y, w, h, fill=CARD, line=None, shape=MSO_SHAPE.RECTANGLE, radius=None, lw=1.25):
    sh = s.shapes.add_shape(shape, x, y, w, h)
    if fill is None:
        sh.fill.background()
    else:
        sh.fill.solid()
        sh.fill.fore_color.rgb = fill
    if line is None:
        sh.line.fill.background()
    else:
        sh.line.color.rgb = line
        sh.line.width = Pt(lw)
    if radius is not None:
        sh.adjustments[0] = radius
    sh.shadow.inherit = False
    return sh


def card(s, x, y, w, h, fill=CARD, line=None):
    return box(s, x, y, w, h, fill, line, MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.06)


def txt(s, x, y, w, h, text, size, color=WHITE, font=BODY, bold=False,
        align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP, tracking=None, line_spacing=None):
    tb = s.shapes.add_textbox(x, y, w, h)
    tf = tb.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    for i, line in enumerate(text.split("\n")):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        if line_spacing:
            p.line_spacing = line_spacing
        r = p.add_run()
        r.text = line
        f = r.font
        f.name, f.size, f.bold = font, Pt(size), bold
        f.color.rgb = color
        if tracking is not None:
            r._r.get_or_add_rPr().set("spc", str(tracking))
    return tb


def pill(s, x, y, label, size=11, fg=GOLD, fill=None, outline=GOLD, h=Inches(0.4)):
    """Rounded badge; returns its width so pills can be chained."""
    w = Inches(0.36 + 0.0098 * size * len(label))
    box(s, x, y, w, h, fill=fill, line=outline, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.5)
    txt(s, x, y, w, h, label, size, fg, bold=True, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    return w


def pills(s, x, y, labels, gap=Inches(0.15), **kw):
    for label in labels:
        x += pill(s, x, y, label, **kw) + gap


def frame(s, n, title, sentence, accent=None):
    """Lean chrome: one bold headline (optional gold second line), one sentence, page mark."""
    tb = txt(s, M, Inches(0.6), CW, Inches(1.4) if accent else Inches(0.7), title, 38, WHITE, font=HEAD)
    y = Inches(1.3)
    if accent:
        p = tb.text_frame.add_paragraph()
        r = p.add_run()
        r.text = accent
        r.font.name, r.font.size = HEAD, Pt(38)
        r.font.color.rgb = GOLD
        y = Inches(1.95)
    txt(s, M, y, CW, Inches(0.45), sentence, 18, GREY)
    txt(s, SW - M - Inches(1), SH - Inches(0.5), Inches(1), Inches(0.25), f"{n:02d} / 05", 9, DIM,
        bold=True, align=PP_ALIGN.RIGHT, tracking=200)


def image(s, x, y, w, h, name, fit="contain", bg=None):
    """Place assets/<name>.jpg inside the box. contain = letterbox, cover = crop to fill."""
    x, y, w, h = int(x), int(y), int(w), int(h)
    if bg is not None:
        box(s, x, y, w, h, fill=bg)
    path = ASSETS / f"{name}.jpg"
    if not path.exists():
        box(s, x, y, w, h, fill=CARD, line=LINE)
        txt(s, x, y, w, h, f"assets/{name}.jpg", 10, GREY, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
        return
    pic = s.shapes.add_picture(str(path), x, y)
    iw, ih = pic.image.size
    img_r, box_r = iw / ih, w / h
    if fit == "cover":
        if img_r > box_r:
            c = (1 - box_r / img_r) / 2
            pic.crop_left = pic.crop_right = c
        else:
            c = (1 - img_r / box_r) / 2
            pic.crop_top = pic.crop_bottom = c
        pic.left, pic.top, pic.width, pic.height = x, y, w, h
    else:
        if img_r > box_r:
            pw, ph = w, int(w / img_r)
        else:
            pw, ph = int(h * img_r), h
        pic.left, pic.top, pic.width, pic.height = x + (w - pw) // 2, y + (h - ph) // 2, pw, ph


def caption(s, x, y, w, label, sub=None):
    txt(s, x, y, w, Inches(0.3), label, 14, WHITE, font=HEAD)
    if sub:
        txt(s, x, y + Inches(0.34), w, Inches(0.3), sub, 11, GREY)


def notes(s, say, question, answer):
    s.notes_slide.notes_text_frame.text = (
        f"SAY:\n{say}\n\nTOUGH QUESTION:\n{question}\n\nWINNING ANSWER (3 sec):\n{answer}"
    )


# ======================================================================
# 1. COVER: one cinematic photo, title, subtitle
# ======================================================================
s = new_slide()
s.background.fill.fore_color.rgb = RGBColor(0, 0, 0)
image(s, 0, 0, SW, SH, "cover_hero", fit="cover")
txt(s, M, Inches(0.55), Inches(11), Inches(1.75), "V: BEYOND THE\nBIG SCREEN", 54, WHITE, font=HEAD, line_spacing=0.9)
box(s, M, Inches(2.42), Inches(0.9), Inches(0.07), fill=GOLD)
txt(s, M + Inches(1.1), Inches(2.3), Inches(8), Inches(0.3), "EXECUTIVE SOCIAL STRATEGY", 13, GOLD, bold=True, tracking=400)
notes(s,
      "V already runs inside more than 400 TV brands, yet almost nobody outside the industry knows our name. "
      "In five minutes I'll show how social turns that invisible scale into market authority and consumer love.",
      "Why should a B2B operating system invest in social at all?",
      "Because OEMs, advertisers and buyers all check us there first, and today they find almost nothing.")

# ======================================================================
# 2. THE OPPORTUNITY: cold spec sheet vs culture, one stat
# ======================================================================
s = new_slide()
frame(s, 2, "Spec Sheets Don't Build Brands.", "The category's biggest audience went to the brand that sold lifestyle.",
      accent="Culture Does.")
iy, ih = Inches(2.65), Inches(4.3)
iw = Inches(2.55)
image(s, M, iy, iw, ih, "comp_samsung_cold", fit="cover")
image(s, SW - M - iw, iy, iw, ih, "comp_roku_1", fit="cover")
box(s, SW - M - iw, iy, iw, ih, fill=None, line=GOLD, lw=2)
txt(s, M, iy + ih + Inches(0.08), iw, Inches(0.3), "SAMSUNG TIZEN", 10, DIM, bold=True, tracking=300)
txt(s, SW - M - iw, iy + ih + Inches(0.08), iw, Inches(0.3), "ROKU CITY", 10, GOLD, bold=True, tracking=300,
    align=PP_ALIGN.RIGHT)
cx, cw_ = M + iw + Inches(0.4), CW - 2 * iw - Inches(0.8)
txt(s, cx, iy + Inches(0.35), cw_, Inches(2.2), "3.4x", 120, GOLD, font=HEAD, align=PP_ALIGN.CENTER)
txt(s, cx, iy + Inches(2.55), cw_, Inches(0.5), "Roku  623K   vs.   Tizen  184K", 22, WHITE, bold=True, align=PP_ALIGN.CENTER)
txt(s, cx, iy + Inches(3.1), cw_, Inches(0.4), "LinkedIn followers. Lifestyle beats hardware.", 14, GREY, align=PP_ALIGN.CENTER)
notes(s,
      "Samsung sells chips and processors and its OS disappears; Roku turned a screen saver into a pop-culture city. "
      "The result is 3.4 times Tizen's LinkedIn audience, and that's the lane V takes.",
      "Isn't Roku a consumer device brand, unlike us?",
      "So is every TV we power; we win the living room the same way.")

# ======================================================================
# 3. THE TWO PLATFORMS: pure split
# ======================================================================
s = new_slide()
frame(s, 3, "Two Platforms. Two Business Goals.", "LinkedIn wins the market. Instagram wins the living room.")
half = CW / 2
box(s, SW / 2 - Inches(0.01), Inches(2.3), Inches(0.02), Inches(4.7), fill=LINE)
for i, (label, goal, asset) in enumerate([("LINKEDIN", "B2B Market Authority", "li_second_screen"),
                                          ("INSTAGRAM", "B2C Living Room Loyalty", "cover_phone")]):
    x = M + i * half
    txt(s, x + Inches(0.3), Inches(2.35), half - Inches(0.6), Inches(0.3), label, 11, GOLD, bold=True, tracking=400)
    txt(s, x + Inches(0.3), Inches(2.65), half - Inches(0.6), Inches(0.5), goal, 22, WHITE, font=HEAD)
    image(s, x + Inches(0.3), Inches(3.3), half - Inches(0.6), Inches(3.75), asset, fit="contain")
notes(s,
      "Two platforms, two jobs: LinkedIn turns our 400-brand scale into authority with OEMs, partners and advertisers, starting from 13K followers today. "
      "Instagram, dormant since March 2025, relaunches in December with a 9-tile living room that makes the profile itself the launch.",
      "Why not TikTok and everything else too?",
      "Focus: two platforms done brilliantly beat six done averagely.")

# ======================================================================
# 4. THE CONTENT: product in action
# ======================================================================
s = new_slide()
frame(s, 4, "The Living Room, In 15 Seconds.", "Translating OS speed and smart features into snackable, relatable video.")
fw, fh, fg = Inches(2.55), Inches(4.3), Inches(0.9)
fx0 = (SW - 3 * fw - 2 * fg) / 2
for i, (asset, tag) in enumerate([("prod_binge", "FAST NAVIGATION"), ("prod_hack", "TV HACKS"),
                                  ("prod_smart_home", "SMART LIVING")]):
    x = fx0 + i * (fw + fg)
    image(s, x, Inches(2.3), fw, fh, asset, fit="cover")
    box(s, x, Inches(2.3), fw, fh, fill=None, line=LINE, lw=1)
    d = Inches(0.62)
    box(s, x + fw / 2 - d / 2, Inches(2.3) + fh / 2 - d / 2, d, d, fill=GOLD, shape=MSO_SHAPE.OVAL)
    tri = box(s, x + fw / 2 - Inches(0.1), Inches(2.3) + fh / 2 - Inches(0.12), Inches(0.26), Inches(0.24),
              fill=INK, shape=MSO_SHAPE.ISOSCELES_TRIANGLE)
    tri.rotation = 90
    txt(s, x, Inches(2.3) + fh + Inches(0.12), fw, Inches(0.3), tag, 12, GOLD, bold=True, tracking=300,
        align=PP_ALIGN.CENTER)
notes(s,
      "This is where the product becomes the star: 15-second videos that show how fast V is, the one shortcut that saves you time tonight, and how it runs the smart home. "
      "Every clip sells a real capability in the time it takes to scroll.",
      "Why would anyone watch a video about an operating system?",
      "Because it's 15 seconds and solves a real problem on their couch.")

# ======================================================================
# 5. THE ANCHOR + DECISION
# ======================================================================
s = new_slide()
frame(s, 5, "The Anchor: CES Las Vegas 2027.", "Launching December 2026, peaking at CES, scaling all year.")
ly = Inches(3.35)
box(s, M, ly - Inches(0.03), CW, Inches(0.06), fill=LINE)
box(s, M, ly - Inches(0.03), CW / 2, Inches(0.06), fill=GOLD)
for i, (when, name, big) in enumerate([("DEC 2026", "Instagram Relaunch", False), ("JAN 2027", "CES Las Vegas", True),
                                       ("2027", "Scale All Year", False)]):
    cx = M + CW * (i / 2) if i != 1 else SW / 2
    cx = [M + Inches(0.3), SW / 2, SW - M - Inches(0.3)][i]
    d = Inches(0.9) if big else Inches(0.34)
    box(s, cx - d / 2, ly - d / 2, d, d, fill=GOLD if i < 2 else BG, line=GOLD, shape=MSO_SHAPE.OVAL, lw=2.5)
    al = [PP_ALIGN.LEFT, PP_ALIGN.CENTER, PP_ALIGN.RIGHT][i]
    bx = [M, SW / 2 - Inches(2.5), SW - M - Inches(5)][i]
    txt(s, bx, ly + Inches(0.65), Inches(5), Inches(0.3), when, 12, GOLD, bold=True, tracking=300, align=al)
    txt(s, bx, ly + Inches(0.95), Inches(5), Inches(0.6), name, 30 if big else 20, WHITE, font=HEAD, align=al)
box(s, M, Inches(5.65), CW, Inches(0.8), fill=GOLD, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.2)
txt(s, M, Inches(5.65), CW, Inches(0.8),
    "DECISION TODAY:  Greenlight the December Instagram relaunch & CES 2027 live activation", 17, INK,
    font=HEAD, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
notes(s,
      "We relaunch Instagram in December, peak at CES Las Vegas in January with live executive coverage from the booth, then scale through the 2027 event calendar. "
      "All I need today is your green light for the December relaunch and the CES live activation.",
      "What will I see before CES to know it's working?",
      "A monthly scorecard: B2B inbound and Instagram growth, from month one.")

prs.save(OUT)
print(f"Saved {OUT}")
