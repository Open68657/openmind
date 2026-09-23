"""
V | 2026-2027 Executive Social Strategy: 7-slide CEO deck (16:9, dark mode).

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


def frame(s, n, kicker, title, takeaway):
    """Shared chrome: kicker, headline, takeaway, footer mark."""
    box(s, M, Inches(0.62), Inches(0.42), Inches(0.06), fill=GOLD)
    txt(s, M + Inches(0.55), Inches(0.5), Inches(9), Inches(0.3), kicker.upper(), 11, GOLD,
        bold=True, tracking=300)
    txt(s, M, Inches(0.95), CW, Inches(0.8), title, 32, WHITE, font=HEAD)
    txt(s, M, Inches(1.8), CW, Inches(0.45), takeaway, 17, GREY)
    txt(s, M, SH - Inches(0.5), Inches(6), Inches(0.25), "V  |  SOCIAL STRATEGY 2026-2027", 9, DIM,
        bold=True, tracking=200)
    txt(s, SW - M - Inches(1), SH - Inches(0.5), Inches(1), Inches(0.25), f"{n:02d} / 07", 9, DIM,
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
# 1. COVER
# ======================================================================
s = new_slide()
s.background.fill.fore_color.rgb = RGBColor(0, 0, 0)  # pure black so the phone mockup blends in
txt(s, M, Inches(0.6), Inches(8), Inches(0.3), "V  |  EXECUTIVE SOCIAL STRATEGY 2026-2027", 12, GOLD,
    bold=True, tracking=300)
txt(s, M, Inches(0.95), Inches(8), Inches(1.6), "BEYOND THE\nBIG SCREEN.", 54, WHITE, font=HEAD, line_spacing=0.9)
txt(s, M, Inches(2.8), Inches(7.8), Inches(0.4),
    "From the OS inside 400+ TV brands to the brand inside every living room.", 16, GREY)
image(s, M, Inches(3.4), Inches(7.8), Inches(3.15), "cover_living_room", fit="cover")
box(s, M, Inches(6.55), Inches(7.8), Inches(0.06), fill=GOLD)
pills(s, M, Inches(6.8), ["400+ TV BRANDS", "POWERED BY HISENSE"], size=10)
image(s, Inches(9.15), Inches(0.55), Inches(3.45), Inches(6.45), "cover_phone", fit="contain")
notes(s,
      "V already runs inside more than 400 TV brands, yet almost nobody outside the industry knows our name. "
      "In five minutes I'll show how social turns that invisible scale into market authority and consumer love.",
      "Why should a B2B operating system invest in social at all?",
      "Because OEMs, advertisers and buyers all check us there first, and today they find almost nothing.")

# ======================================================================
# 2. THE STRATEGIC SHIFT
# ======================================================================
s = new_slide()
frame(s, 2, "The strategic shift", "From Hardware Specs to Living Room Culture.",
      "People don't follow processors. They follow culture.")
top, ch = Inches(2.5), Inches(3.4)
cw = Inches(5.5)
rx = SW - M - cw
for x, hi in [(M, False), (rx, True)]:
    card(s, x, top, cw, ch, fill=CARD_HI if hi else CARD, line=GOLD if hi else None)
# The trap: two clean spec-sheet cutouts (Samsung / LG)
iw, ih = Inches(1.85), Inches(1.95)
ix = M + (cw - 2 * iw - Inches(0.2)) / 2
image(s, ix, top + Inches(0.25), iw, ih, "trap_samsung", fit="cover")
image(s, ix + iw + Inches(0.2), top + Inches(0.25), iw, ih, "trap_lg", fit="cover")
# The play: Roku City
image(s, rx + Inches(0.25), top + Inches(0.25), cw - Inches(0.5), Inches(1.95), "bench_roku_strip", fit="contain")
for x, tag, name, line, hi in [
    (M, "THE TRAP", "Tizen & webOS", "AI chips, processors, spec sheets. The OS stays invisible.", False),
    (rx, "THE PLAY", "Roku City", "A screen saver fans want to move into, now the brand's visual language.", True),
]:
    txt(s, x + Inches(0.35), top + Inches(2.4), Inches(2), Inches(0.3), tag, 11, GOLD if hi else DIM,
        bold=True, tracking=300)
    txt(s, x + Inches(2.0), top + Inches(2.3), cw - Inches(2.3), Inches(0.4), name, 20, WHITE if hi else GREY,
        font=HEAD, align=PP_ALIGN.RIGHT)
    txt(s, x + Inches(0.35), top + Inches(2.8), cw - Inches(0.7), Inches(0.5), line, 12, WHITE if hi else DIM)
box(s, SW / 2 - Inches(0.3), top + ch / 2 - Inches(0.3), Inches(0.6), Inches(0.6), fill=GOLD, shape=MSO_SHAPE.RIGHT_ARROW)
pills(s, M, Inches(6.2), ["ROKU ON LINKEDIN: 623K", "TIZEN ON LINKEDIN: 184K", "3.4x THE AUDIENCE"], size=10)
notes(s,
      "Samsung and LG sell chips and processors, and the operating system disappears behind the TV. "
      "Roku turned a screen saver into a cult icon and now has 3.4 times Tizen's LinkedIn audience, proof that the category rewards culture.",
      "Isn't Roku a consumer device brand, unlike us?",
      "So is every TV we power; we win the living room the same way.")

# ======================================================================
# 3. THE ARCHITECTURE
# ======================================================================
s = new_slide()
frame(s, 3, "The architecture", "Two Platforms. Two Growth Engines.",
      "LinkedIn wins the market. Instagram wins the living room.")
top, ch, gap = Inches(2.55), Inches(3.3), Inches(0.5)
half = (CW - gap) / 2
for i, (tag, name, role, today, next_, fill, fg, sub) in enumerate([
    ("B2B", "LinkedIn", "Market Authority", "13K", "followers today. OEMs, partners, advertisers, talent.",
     CARD, WHITE, GREY),
    ("B2C", "Instagram", "Living Room Loyalty", "DEC '26", "relaunch. Dormant since March 2025.",
     WHITE, INK, DIM),
]):
    x = M + i * (half + gap)
    card(s, x, top, half, ch, fill=fill)
    pill(s, x + Inches(0.45), top + Inches(0.4), tag, size=11, fg=INK, fill=GOLD, outline=GOLD)
    txt(s, x + Inches(0.45), top + Inches(0.95), half, Inches(0.7), name, 32, fg, font=HEAD)
    txt(s, x + Inches(0.45), top + Inches(1.6), half, Inches(0.4), role, 17, sub, bold=True)
    box(s, x + Inches(0.45), top + Inches(2.2), half - Inches(0.9), Inches(0.02), fill=LINE if i == 0 else GREY)
    txt(s, x + Inches(0.45), top + Inches(2.4), Inches(2.0), Inches(0.6), today, 28, GOLD if i == 0 else INK, font=HEAD)
    txt(s, x + Inches(2.45), top + Inches(2.45), half - Inches(2.9), Inches(0.6), next_, 12, sub)
hub = Inches(0.95)
box(s, SW / 2 - hub / 2, top + Inches(0.9), hub, hub, fill=GOLD, line=BG, shape=MSO_SHAPE.OVAL, lw=6)
txt(s, SW / 2 - hub / 2, top + Inches(0.9), hub, hub, "V", 28, INK, font=HEAD, align=PP_ALIGN.CENTER,
    anchor=MSO_ANCHOR.MIDDLE)
txt(s, M, Inches(6.15), Inches(2.2), Inches(0.4), "POWERED BY", 10, DIM, bold=True, tracking=300, anchor=MSO_ANCHOR.MIDDLE)
pills(s, M + Inches(1.6), Inches(6.15), ["YOUTUBE MASTERCLASS", "SHORT-FORM VIDEO HUBS", "IN-HOUSE PRODUCTION DAYS"],
      size=10, fg=WHITE, outline=GOLD)
notes(s,
      "Two engines with two clear jobs: LinkedIn, already at 13K followers, builds authority with OEMs, partners and advertisers, while Instagram, dormant since March 2025, relaunches in December to win the people on the sofa. "
      "A YouTube masterclass library and short-form video hubs, shot on our own in-house production days, feed both engines.",
      "Why not TikTok and everything else too?",
      "Focus: two engines done brilliantly beat six done averagely.")

# ======================================================================
# 4. LINKEDIN (B2B)
# ======================================================================
s = new_slide()
frame(s, 4, "B2B channel  |  LinkedIn", "Turning Scale Into Industry Authority.",
      "400+ TV brands give V data and access no rival OS can match.")
top, ch, gap = Inches(2.45), Inches(3.35), Inches(0.3)
sw_ = Inches(3.35)
ew = CW - 2 * sw_ - 2 * gap
cols = [M, M + sw_ + gap, M + 2 * (sw_ + gap)]
for x, w, asset, head, sub in [
    (cols[0], sw_, "li_second_screen", "01  Viewing Data", "Second-screen and viewing-habit insights"),
    (cols[1], sw_, "li_partners", "02  Partnerships", "OpenAI, Teads, Hisense integrations"),
]:
    card(s, x, top, w, ch)
    image(s, x + Inches(0.15), top + Inches(0.15), w - Inches(0.3), ch - Inches(0.3), asset, fit="contain")
    caption(s, x, top + ch + Inches(0.15), w, head, sub)
# Executive voice: Guy Edri front and center
ex = cols[2]
card(s, ex, top, ew, ch, fill=CARD_HI, line=GOLD)
image(s, ex + Inches(0.15), top + Inches(0.15), Inches(2.0), ch - Inches(0.3), "li_guy_post", fit="contain")
rx = ex + Inches(2.3)
rw = ew - Inches(2.45)
image(s, rx, top + Inches(0.15), rw, Inches(1.25), "li_guy_teads", fit="contain")
txt(s, rx, top + Inches(1.65), rw, Inches(0.4), "GUY EDRI", 20, WHITE, font=HEAD)
txt(s, rx, top + Inches(2.05), rw, Inches(0.3), "CEO, VIDAA", 12, GOLD, bold=True, tracking=200)
pill(s, rx, top + Inches(2.6), "+ DENIS OSTIR", size=10, fg=WHITE, outline=GOLD, h=Inches(0.36))
caption(s, ex, top + ch + Inches(0.15), ew, "03  Executive Voice", "First-person posts that put V next to Hisense")
notes(s,
      "LinkedIn is where we sell what only V has: insight from more than 400 TV brands, partnerships like OpenAI, Teads and Hisense, and above all your own voice, backed by Denis. "
      "Your post on getting close to number one with Hisense and 400 brands is exactly the tone that makes OEMs and media buyers call us first.",
      "Do I have to post personally?",
      "Twice a month, fully drafted for you; ten minutes, and it's our strongest B2B reach.")

# ======================================================================
# 5. INSTAGRAM (B2C)
# ======================================================================
s = new_slide()
frame(s, 5, "B2C channel  |  Instagram", "Home Comes to Life.",
      "The relaunch turns the profile itself into one living room.")
top = Inches(2.45)
t, g = Inches(1.14), Inches(0.05)
gw = 3 * t + 2 * g
gx = M
# Row 1: one panorama across three tiles
image(s, gx, top, gw, t, "grid_row1", fit="cover")
for k in (1, 2):
    box(s, gx + k * t + (k - 1) * g, top, g, t, fill=BG)
# Row 2: typography in its own tile, photo across the other two
r2 = top + t + g
box(s, gx, r2, t, t, fill=GOLD)
txt(s, gx + Inches(0.1), r2, t - Inches(0.1), t, "WHERE\nMOMENTS\nCOME\nALIVE", 12, INK, font=HEAD,
    anchor=MSO_ANCHOR.MIDDLE, line_spacing=0.9)
image(s, gx + t + g, r2, 2 * t + g, t, "grid_room", fit="cover")
box(s, gx + 2 * t + g, r2, g, t, fill=BG)
# Row 3: people, the V mark, welcome
r3 = r2 + t + g
image(s, gx, r3, t, t, "grid_girl", fit="cover")
box(s, gx + t + g, r3, t, t, fill=RGBColor(0x05, 0x05, 0x05))
image(s, gx + t + g + Inches(0.3), r3 + Inches(0.3), t - Inches(0.6), t - Inches(0.6), "v_logo", fit="contain")
box(s, gx + 2 * (t + g), r3, t, t, fill=RGBColor(0x05, 0x05, 0x05))
txt(s, gx + 2 * (t + g), r3, t, t, "Welcome\nHome", 12, WHITE, font=HEAD, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
caption(s, gx, top + gw + Inches(0.15), gw, "The 9-Grid Relaunch", "One living room across nine tiles")
# Right: always-on formats
rx = gx + gw + Inches(0.4)
rw = SW - M - rx
card(s, rx, top, rw, gw)
pw = Inches(1.95)
for i, asset in enumerate(["ig_room_1", "ig_room_2"]):
    image(s, rx + Inches(0.2) + i * (pw + Inches(0.15)), top + Inches(0.2), pw, gw - Inches(0.4), asset, fit="cover")
tx = rx + Inches(0.2) + 2 * pw + Inches(0.45)
txt(s, tx, top + Inches(0.3), SW - M - tx - Inches(0.2), Inches(0.3), "ALWAYS-ON FORMATS", 11, GOLD, bold=True, tracking=300)
for i, label in enumerate(["FAMILY & HOME MOMENTS", "FEATURE SPOTLIGHT & TIPS", "AI  |  SMART HOME", "HOW IT'S MADE", "COMMUNITY & USERS"]):
    pill(s, tx, top + Inches(0.8) + i * Inches(0.5), label, size=9, fg=WHITE, outline=GOLD, h=Inches(0.36))
caption(s, rx, top + gw + Inches(0.15), rw, "Always-On Living Room", "Binge nights, gaming, family time and the smart home")
notes(s,
      "We relaunch the dormant account with one living room spread across nine tiles, Where Moments Come Alive, so the launch itself is the statement. "
      "Then we stay always-on with real living-room moments, quick feature tips and the smart home, so the product is always the hero of the feed.",
      "Will a dormant account really come back?",
      "The 9-grid is the reset button; the formats are built to earn the follow.")

# ======================================================================
# 6. PRODUCT IN ACTION
# ======================================================================
s = new_slide()
frame(s, 6, "Product in action", "15-Second TV Hacks & Features.",
      "Making speed, AI and smart home connectivity approachable through snackable video.")
top, ph = Inches(2.45), Inches(3.4)
colw = CW / 3
pw = Inches(2.35)
for i, (asset, head, sub) in enumerate([
    ("prod_smart_home", "Fast Navigation & Smart Home", "UI in action, AI and device integrations"),
    ("prod_hack", "15-Second TV Life Hacks", "Quick shortcuts, finding content instantly"),
    ("prod_binge", "Binge & Gaming Modes", "Low latency, sports and cinema picture modes"),
]):
    cx = M + i * colw
    px = cx + (colw - pw) / 2
    box(s, px - Inches(0.07), top - Inches(0.07), pw + Inches(0.14), ph + Inches(0.14), fill=BG, line=DIM,
        shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.08, lw=1.5)
    image(s, px, top, pw, ph, asset, fit="cover")
    pill(s, px + Inches(0.12), top + Inches(0.12), "15s", size=10, fg=INK, fill=GOLD, h=Inches(0.32))
    d = Inches(0.55)
    box(s, px + pw / 2 - d / 2, top + ph - d - Inches(0.2), d, d, fill=GOLD, shape=MSO_SHAPE.OVAL)
    tri = box(s, px + pw / 2 - Inches(0.1), top + ph - d / 2 - Inches(0.2) - Inches(0.11), Inches(0.24), Inches(0.22),
              fill=INK, shape=MSO_SHAPE.ISOSCELES_TRIANGLE)
    tri.rotation = 90
    txt(s, cx, top + ph + Inches(0.2), colw, Inches(0.3), f"0{i + 1}  {head}", 14, WHITE, font=HEAD, align=PP_ALIGN.CENTER)
    txt(s, cx, top + ph + Inches(0.55), colw, Inches(0.3), sub, 11, GREY, align=PP_ALIGN.CENTER)
notes(s,
      "This is where the product becomes the star: 15-second videos that show how fast V is, how it connects the smart home, and the one shortcut that saves you time tonight. "
      "Every clip sells a real capability, from finding content instantly to low-latency gaming and sports picture modes, in the time it takes to scroll.",
      "Why would anyone watch a video about an operating system?",
      "Because it's 15 seconds and solves a real problem on their couch.")

# ======================================================================
# 7. ROADMAP
# ======================================================================
s = new_slide()
frame(s, 7, "Roadmap", "The Road to CES 2027 & Beyond.",
      "Launch in December, peak in Vegas, then an event-driven drumbeat all year.")
ly = Inches(3.15)
box(s, M, ly - Inches(0.03), CW, Inches(0.06), fill=LINE)
box(s, M, ly - Inches(0.03), CW * 0.5, Inches(0.06), fill=GOLD)
w3 = CW / 3
stages = [
    ("DEC 2026", "Relaunch", "Instagram 9-grid launch\nCES teasers on LinkedIn", False),
    ("JAN 2027", "CES Las Vegas", "Live executive coverage\nBehind the scenes from the booth", True),
    ("2027", "Always-On Growth", "CTV Summit, StreamTV, IFA,\nDisruptTV, Black Friday", False),
]
for i, (when, name, what, hero) in enumerate(stages):
    cx = M + w3 * i + w3 / 2
    d = Inches(0.55) if hero else Inches(0.32)
    box(s, cx - d / 2, ly - d / 2, d, d, fill=GOLD if i < 2 else BG, line=GOLD, shape=MSO_SHAPE.OVAL, lw=2.5)
    cy = ly + Inches(0.5)
    if hero:
        card(s, cx - w3 / 2 + Inches(0.1), cy, w3 - Inches(0.2), Inches(2.05), fill=CARD_HI, line=GOLD)
    txt(s, cx - w3 / 2, cy + Inches(0.25), w3, Inches(0.3), when, 12, GOLD, bold=True, align=PP_ALIGN.CENTER, tracking=300)
    txt(s, cx - w3 / 2, cy + Inches(0.6), w3, Inches(0.5), name, 22, WHITE, font=HEAD, align=PP_ALIGN.CENTER)
    txt(s, cx - w3 / 2 + Inches(0.3), cy + Inches(1.2), w3 - Inches(0.6), Inches(0.8), what, 13, GREY,
        align=PP_ALIGN.CENTER)
pill(s, M + w3 + w3 / 2 - Inches(0.67), ly - Inches(0.85), "THE ANCHOR", size=10, fg=INK, fill=GOLD)
box(s, M, Inches(5.95), CW, Inches(0.6), fill=GOLD, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.2)
txt(s, M, Inches(5.95), CW, Inches(0.6), "DECISION TODAY:  GREENLIGHT THE DECEMBER RELAUNCH + CES 2027 ACTIVATION", 15, INK,
    font=HEAD, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
txt(s, M, Inches(6.65), CW, Inches(0.3), "ENGINE:  MONTHLY CONTENT CALENDAR  /  IN-HOUSE PRODUCTION DAYS  /  MONTHLY PERFORMANCE REVIEW",
    9, GREY, bold=True, align=PP_ALIGN.CENTER, tracking=150)
notes(s,
      "We relaunch Instagram in December with CES teasers, peak at CES Las Vegas in January with live executive coverage from the booth, then ride the 2027 event calendar from CTV Summit London to IFA and Black Friday. "
      "All I need today is your green light for the December relaunch and the CES activation.",
      "What will I see before CES to know it's working?",
      "A monthly performance review, starting with the first month.")

prs.save(OUT)
print(f"Saved {OUT}")
