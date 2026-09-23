"""
V | 2026-2027 Executive Social Strategy: 7-slide CEO deck (16:9, dark mode).

    pip install python-pptx
    python build_deck.py            -> V_Social_Strategy_CEO.pptx

Speaker notes (voiceover + tough question + answer) are embedded in every slide.
Visuals are crops from the "Social Plan" and "Social Workshop" decks, stored in ./assets.
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
image(s, Inches(7.0), Inches(0.55), Inches(5.9), Inches(6.4), "ig_launch_9grid", fit="contain")
txt(s, M, Inches(1.2), Inches(6), Inches(0.3), "V  |  EXECUTIVE SOCIAL STRATEGY 2026-2027", 12, GOLD,
    bold=True, tracking=300)
txt(s, M, Inches(1.75), Inches(6.2), Inches(2.9), "BEYOND\nTHE BIG\nSCREEN.", 60, WHITE, font=HEAD,
    line_spacing=0.9)
box(s, M, Inches(4.85), Inches(1.2), Inches(0.07), fill=GOLD)
txt(s, M, Inches(5.1), Inches(5.9), Inches(0.7),
    "From the OS inside 400+ TV brands to the brand inside every living room.", 16, GREY)
pills(s, M, Inches(6.05), ["400+ TV BRANDS", "POWERED BY HISENSE"], size=10)
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
for x, asset, tag, name, line, hi in [
    (M, "bench_tizen", "THE TRAP", "Tizen & webOS", "AI chips, processors, spec sheets. The OS stays invisible.", False),
    (rx, "bench_roku_strip", "THE PLAY", "Roku City", "A screen saver fans want to move into, now the brand's visual language.", True),
]:
    card(s, x, top, cw, ch, fill=CARD_HI if hi else CARD, line=GOLD if hi else None)
    image(s, x + Inches(0.25), top + Inches(0.25), cw - Inches(0.5), Inches(1.95), asset, fit="contain")
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
pills(s, M + Inches(1.6), Inches(6.15), ["YOUTUBE MASTERCLASS", "V AMBASSADORS", "MONTHLY SHOOT DAYS"],
      size=10, fg=WHITE, outline=GOLD)
notes(s,
      "Two engines with two clear jobs: LinkedIn, already at 13K followers, builds authority with OEMs, partners and advertisers, while Instagram, dormant since March 2025, relaunches in December to win the people on the sofa. "
      "YouTube tutorials and our V Ambassadors feed both engines with content.",
      "Why not TikTok and everything else too?",
      "Focus: two engines done brilliantly beat six done averagely.")

# ======================================================================
# 4. LINKEDIN (B2B)
# ======================================================================
s = new_slide()
frame(s, 4, "B2B channel  |  LinkedIn", "Turning Scale Into Industry Authority.",
      "400+ TV brands give V data and access no rival OS can match.")
top, ih, gap = Inches(2.5), Inches(3.05), Inches(0.35)
w3 = (CW - 2 * gap) / 3
items = [("li_second_screen", "01  Viewing Data", "Second-screen and viewing-habit insights"),
         ("li_partners", "02  Partnerships", "OpenAI, Teads, Hisense integrations"),
         ("li_exec_posts", "03  Executive Voice", "Guy Edri & Denis Ostir, in first person")]
for i, (asset, head, sub) in enumerate(items):
    x = M + i * (w3 + gap)
    card(s, x, top, w3, ih)
    image(s, x + Inches(0.15), top + Inches(0.15), w3 - Inches(0.3), ih - Inches(0.3), asset, fit="contain")
    caption(s, x, top + ih + Inches(0.2), w3, head, sub)
notes(s,
      "LinkedIn is where we sell what only V has: insight from more than 400 TV brands, partnerships like OpenAI, Teads and Hisense, and the first-person voices of you and Denis. "
      "When an OEM or media buyer thinks about the future of TV, we want V to be the first name in their feed.",
      "Do I have to post personally?",
      "Twice a month, fully drafted for you; ten minutes, and it's our strongest B2B reach.")

# ======================================================================
# 5. INSTAGRAM (B2C)
# ======================================================================
s = new_slide()
frame(s, 5, "B2C channel  |  Instagram", "Home Comes to Life.",
      "The relaunch turns the profile itself into one living room.")
top, ih = Inches(2.5), Inches(3.5)
lw = Inches(5.2)
card(s, M, top, lw, ih)
image(s, M + Inches(0.15), top + Inches(0.15), lw - Inches(0.3), ih - Inches(0.3), "ig_launch_9grid", fit="contain")
caption(s, M, top + ih + Inches(0.2), lw, "The 9-Grid Relaunch", '"Where Moments Come Alive"')
rx = M + lw + Inches(0.35)
rw = SW - M - rx
card(s, rx, top, rw, ih)
image(s, rx + Inches(0.15), top + Inches(0.15), rw - Inches(0.3), ih - Inches(0.3), "ig_family", fit="contain")
caption(s, rx, top + ih + Inches(0.2), rw, "Always-On Living Room",
        "Family moments, quick feature tips, gaming, AI & smart home")
notes(s,
      "We relaunch the dormant account with one panoramic living room split across nine tiles, Where Moments Come Alive, so the launch itself is the statement. "
      "Then we stay always-on with short, real living-room moments: binge nights, gaming, quick feature tips and the smart home.",
      "Will a dormant account really come back?",
      "The 9-grid is the reset button; the formats are built to earn the follow.")

# ======================================================================
# 6. V AMBASSADORS
# ======================================================================
s = new_slide()
frame(s, 6, "Creator strategy", "V Ambassadors: Real People, Zero Filters.",
      "Employees and everyday users become our most trusted creators.")
top, ih, gap = Inches(2.5), Inches(3.05), Inches(0.35)
w3 = (CW - 2 * gap) / 3
for i, (asset, head, sub) in enumerate([
    ("amb_ritual", "My Ritual", "Each ambassador's personal viewing ritual"),
    ("amb_real_room", "The Real Living Room", "No tidying, no filters, just the couch view"),
    ("amb_hack", "Hack My Living Room", "Quick hacks from busy mornings to bedtime"),
]):
    x = M + i * (w3 + gap)
    card(s, x, top, w3, ih)
    image(s, x + Inches(0.15), top + Inches(0.15), w3 - Inches(0.3), ih - Inches(0.3), asset, fit="contain")
    caption(s, x, top + ih + Inches(0.2), w3, head, sub)
notes(s,
      "Like Gap, Starbucks and Apple, we hand the camera to real employees and users and let them film their own living rooms, with no tidying and no filters. "
      "In return they get early access, exposure on our channels and living-room gear, and we get content people actually trust, at a fraction of production cost.",
      "How do we protect the brand if it's unfiltered?",
      "Clear playbook, light approval, and we only boost what's on-brand.")

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
    ("JAN 2027", "CES Las Vegas", "Live executive coverage\nCreator living-room takeovers", True),
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
txt(s, M, Inches(6.65), CW, Inches(0.3), "ENGINE:  MONTHLY CONTENT CALENDAR  /  BI-MONTHLY SHOOT DAYS  /  MONTHLY PERFORMANCE REVIEW",
    9, GREY, bold=True, align=PP_ALIGN.CENTER, tracking=150)
notes(s,
      "We relaunch Instagram in December with CES teasers, peak at CES Las Vegas in January with live executive coverage and creator takeovers, then ride the 2027 event calendar from CTV Summit London to IFA and Black Friday. "
      "All I need today is your green light for the December relaunch and the CES activation.",
      "What will I see before CES to know it's working?",
      "A monthly performance review, starting with the first month.")

prs.save(OUT)
print(f"Saved {OUT}")
