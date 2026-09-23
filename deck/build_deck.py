"""
V | 2026-2027 Executive Social Strategy: 8-slide CEO deck (16:9, dark mode).

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
    txt(s, SW - M - Inches(1), SH - Inches(0.5), Inches(1), Inches(0.25), f"{n:02d} / 08", 9, DIM,
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
# 2. THE COMPETITIVE LANDSCAPE
# ======================================================================
s = new_slide()
frame(s, 2, "The competitive landscape", "From Hardware Specs to Living Room Culture.",
      "People don't follow processors. They follow culture.")
top, ch, gap = Inches(2.4), Inches(3.75), Inches(0.3)
cw = (CW - 2 * gap) / 3
iw, ih = Inches(1.6), Inches(2.25)
comps = [
    ("samsung", "THE SPEC SHEET", "Samsung", "Sells AI chips and picture modes. Tizen stays invisible.", DIM, GREY, None),
    ("amazon", "THE VIEWING HABIT", "Amazon Fire TV", "Rides live moments and quick hacks: red cards, movie nights, tips.", GREY, WHITE, None),
    ("roku", "THE CULTURE", "Roku", "Roku City: a screen saver fans want to move into.", GOLD, WHITE, GOLD),
]
for i, (key, tag, name, line, tag_c, name_c, outline) in enumerate(comps):
    x = M + i * (cw + gap)
    card(s, x, top, cw, ch, fill=CARD_HI if outline else CARD, line=outline)
    ix = x + (cw - 2 * iw - Inches(0.15)) / 2
    for j in range(2):
        image(s, ix + j * (iw + Inches(0.15)), top + Inches(0.2), iw, ih, f"comp_{key}_{j + 1}", fit="cover")
    txt(s, x + Inches(0.3), top + Inches(2.62), cw - Inches(0.6), Inches(0.3), tag, 10, tag_c, bold=True, tracking=300)
    txt(s, x + Inches(0.3), top + Inches(2.9), cw - Inches(0.6), Inches(0.4), name, 18, name_c, font=HEAD)
    txt(s, x + Inches(0.3), top + Inches(3.28), cw - Inches(0.6), Inches(0.45), line, 11, name_c if outline else GREY)
# specs -> culture spectrum between the cards
for i in range(2):
    ax = M + (i + 1) * cw + i * gap + Inches(0.02)
    box(s, ax, top + Inches(1.15), gap - Inches(0.04), Inches(0.3), fill=GOLD, shape=MSO_SHAPE.RIGHT_ARROW)
pills(s, M, Inches(6.35), ["ROKU ON LINKEDIN: 623K", "TIZEN ON LINKEDIN: 184K", "3.4x THE AUDIENCE"], size=10)
notes(s,
      "Samsung sells chips and picture modes and the OS disappears; Amazon Fire TV gets closer by riding real viewing moments and quick hacks; Roku owns culture with Roku City. "
      "The further a brand moves from specs to culture, the bigger its audience: Roku has 3.4 times Tizen's LinkedIn following, and that's the direction we take.",
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
# 7. EVENTS PLAYBOOK
# ======================================================================
s = new_slide()
frame(s, 7, "Events playbook", "Every Event Becomes a Month of Content.",
      "CES Las Vegas, January 2027, is the template for the whole year.")
# 2027 event calendar strip
events = [("DEC '26", "IG launch +\nCES teasers"), ("JAN", "CES\nLas Vegas"), ("APR", "ASEAN\nevent"),
          ("MAY", "CTV Summit\nLondon"), ("JUN", "StreamTV\nLisbon & Denver"), ("SEP", "IFA\nBerlin"),
          ("OCT", "DisruptTV +\nCanton Fair"), ("NOV", "Black\nFriday")]
eg = Inches(0.08)
ew = (CW - 7 * eg) / 8
ey = Inches(2.35)
for i, (mon, name) in enumerate(events):
    x = M + i * (ew + eg)
    hero = i == 1
    box(s, x, ey, ew, Inches(0.72), fill=GOLD if hero else CARD, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.12)
    txt(s, x + Inches(0.1), ey + Inches(0.06), ew - Inches(0.2), Inches(0.2), mon, 9, INK if hero else GOLD,
        bold=True, tracking=150)
    txt(s, x + Inches(0.1), ey + Inches(0.26), ew - Inches(0.2), Inches(0.45), name, 9, INK if hero else WHITE,
        bold=True, line_spacing=0.95)
# CES month table
tx, ty = M, Inches(3.3)
lw = Inches(1.35)
cg = Inches(0.08)
cw4 = (CW - lw - 4 * cg) / 4
hh, rh = Inches(0.5), Inches(1.12)
weeks = ["WEEK 1  |  TEASE", "WEEK 2  |  LIVE", "WEEK 3  |  BRING IT HOME", "WEEK 4  |  BACK TO ROUTINE"]
cells = {
    "INSTAGRAM": [("Packing the Living Room", "Teaser reel: living-room essentials + CES badges"),
                  ("3 CES Features for Tonight", "Feature spotlight straight from Vegas"),
                  ("Vegas Was Fun, But This Is Perfect", "Cozy reel back to the living room"),
                  ("Your Toxic Viewing Trait", "Relatable carousel built for tags & shares")],
    "LINKEDIN": [("What to Expect at CES 2027", "Denis on TVOS & smart-home trends"),
                 ("Live From the Booth", "Updates, team photos, new partnerships"),
                 ("The CEO's Vision", "Guy Edri's top CES takeaways for 2027"),
                 ("Partner & Team Spotlight", "A CES partner or a team insight")],
}
for j, wk in enumerate(weeks):
    x = tx + lw + cg + j * (cw4 + cg)
    live = j == 1
    box(s, x, ty, cw4, hh, fill=GOLD if live else CARD_HI, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.15)
    txt(s, x, ty, cw4, hh, wk, 10, INK if live else GOLD, bold=True, align=PP_ALIGN.CENTER,
        anchor=MSO_ANCHOR.MIDDLE, tracking=100)
for r, (chan, row) in enumerate(cells.items()):
    y = ty + hh + cg + r * (rh + cg)
    txt(s, tx, y, lw - Inches(0.1), rh, chan, 11, WHITE, font=HEAD, anchor=MSO_ANCHOR.MIDDLE)
    for j, (head, sub) in enumerate(row):
        x = tx + lw + cg + j * (cw4 + cg)
        card(s, x, y, cw4, rh, fill=CARD, line=GOLD if j == 1 else None)
        txt(s, x + Inches(0.18), y + Inches(0.14), cw4 - Inches(0.36), Inches(0.5), head, 12, WHITE, bold=True)
        txt(s, x + Inches(0.18), y + Inches(0.62), cw4 - Inches(0.36), Inches(0.45), sub, 10, GREY)
txt(s, M, Inches(6.6), CW, Inches(0.3), "+ DAILY STORIES ALL MONTH:  POLLS  /  BEHIND THE SCENES  /  EVENT TAKEOVERS",
    9, GREY, bold=True, tracking=150)
notes(s,
      "Every industry event gets the same four-week playbook: tease it, go live, bring it back home to the living room, then return to routine, with Instagram and LinkedIn each playing their own role. "
      "CES in January is the template, and we repeat it for ASEAN, CTV Summit London, StreamTV, IFA, DisruptTV and Black Friday.",
      "Isn't this a lot of content around one trade show?",
      "One shoot at the booth feeds a full month on both channels.")

# ======================================================================
# 8. HOW WE WORK + DECISION
# ======================================================================
s = new_slide()
frame(s, 8, "How we work", "One Monthly Rhythm. Zero Guesswork.",
      "Plan weekly, shoot in batches, optimize every month.")
top, ch, gap = Inches(2.4), Inches(3.05), Inches(0.55)
cw = (CW - 2 * gap) / 3
steps = [("01", "Monthly Content\nCalendar", "WEEKLY PLANNING", "A monthly Gantt for both channels, with ongoing feed management."),
         ("02", "Content Bank\nShoots", "BI-MONTHLY", "Concentrated production days that capture every visual asset."),
         ("03", "Performance\nReview", "MONTHLY", "An analytics wrap-up that tunes next month's content.")]
for i, (num, head, cadence, line) in enumerate(steps):
    x = M + i * (cw + gap)
    card(s, x, top, cw, ch)
    box(s, x, top, cw, Inches(0.07), fill=GOLD)
    txt(s, x + Inches(0.35), top + Inches(0.35), Inches(1.5), Inches(0.7), num, 36, GOLD, font=HEAD)
    txt(s, x + Inches(0.35), top + Inches(1.1), cw - Inches(0.7), Inches(0.8), head, 18, WHITE, font=HEAD, line_spacing=0.95)
    pill(s, x + Inches(0.35), top + Inches(1.95), cadence, size=9, fg=WHITE, outline=GOLD, h=Inches(0.34))
    txt(s, x + Inches(0.35), top + Inches(2.42), cw - Inches(0.7), Inches(0.6), line, 12, GREY)
    if i < 2:
        box(s, x + cw + Inches(0.1), top + ch / 2 - Inches(0.22), gap - Inches(0.2), Inches(0.44), fill=GOLD,
            shape=MSO_SHAPE.RIGHT_ARROW)
txt(s, M, Inches(5.6), CW, Inches(0.3), "REPEAT EVERY MONTH  /  RESULTS REPORTED MONTHLY", 10, DIM, bold=True,
    align=PP_ALIGN.CENTER, tracking=250)
box(s, M, Inches(6.05), CW, Inches(0.6), fill=GOLD, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.2)
txt(s, M, Inches(6.05), CW, Inches(0.6), "DECISION TODAY:  GREENLIGHT THE DECEMBER RELAUNCH + CES 2027 ACTIVATION", 15, INK,
    font=HEAD, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
notes(s,
      "The engine behind all of this is simple: a monthly content calendar planned week by week, batch production days every two months, and a monthly performance review that sharpens what comes next. "
      "All I need today is your green light for the December relaunch and the CES activation.",
      "What will I see before CES to know it's working?",
      "A monthly performance review, starting with the first month.")

prs.save(OUT)
print(f"Saved {OUT}")
