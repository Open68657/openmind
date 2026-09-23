"""
V | 2026-2027 Executive Social Strategy: 7-slide CEO deck (16:9, dark mode).

    pip install python-pptx
    python build_deck.py            -> V_Social_Strategy_CEO.pptx

Speaker notes (voiceover + tough question + answer) are embedded in every slide.
"""
from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Inches, Pt

OUT = Path(__file__).with_name("V_Social_Strategy_CEO.pptx")

# ---------- Palette & type ----------
BG = RGBColor(0x0B, 0x0B, 0x0C)
CARD = RGBColor(0x16, 0x16, 0x18)
CARD_HI = RGBColor(0x1E, 0x1E, 0x21)
LINE = RGBColor(0x2C, 0x2C, 0x30)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
GREY = RGBColor(0xA0, 0xA0, 0xA0)
DIM = RGBColor(0x5E, 0x5E, 0x62)
GOLD = RGBColor(0xF5, 0xC5, 0x18)
GOLD_DEEP = RGBColor(0x3A, 0x2F, 0x08)
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


def notes(s, say, question, answer):
    s.notes_slide.notes_text_frame.text = (
        f"SAY:\n{say}\n\nTOUGH QUESTION:\n{question}\n\nWINNING ANSWER (3 sec):\n{answer}"
    )


# ======================================================================
# 1. COVER
# ======================================================================
s = new_slide()
box(s, Inches(-1.2), Inches(0.9), Inches(6.4), Inches(6.4), fill=GOLD_DEEP, shape=MSO_SHAPE.OVAL)
txt(s, Inches(0.3), Inches(1.0), Inches(4.6), Inches(5.6), "V", 300, GOLD, font=HEAD,
    align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
x0 = Inches(5.6)
txt(s, x0, Inches(1.35), Inches(7), Inches(0.3), "EXECUTIVE SOCIAL STRATEGY  |  2026-2027", 12, GOLD,
    bold=True, tracking=300)
txt(s, x0, Inches(1.85), Inches(7.1), Inches(2.6), "BEYOND\nTHE BIG\nSCREEN.", 56, WHITE, font=HEAD,
    line_spacing=0.9)
box(s, x0, Inches(4.75), Inches(1.2), Inches(0.07), fill=GOLD)
txt(s, x0, Inches(5.0), Inches(7), Inches(0.5), "From the OS inside 400+ TV brands to the brand inside every living room.",
    16, GREY)
pills(s, x0, Inches(5.8), ["400+ TV BRANDS", "POWERED BY HISENSE", "LINKEDIN + INSTAGRAM"], size=10)
notes(s,
      "V already runs inside more than 400 TV brands, yet almost nobody knows our name. "
      "In the next five minutes I'll show how social turns that invisible scale into market leadership and consumer love.",
      "Why should a B2B operating system invest in social at all?",
      "Because OEMs, advertisers and buyers all check us there first, and today they find nothing.")

# ======================================================================
# 2. THE STRATEGIC SHIFT
# ======================================================================
s = new_slide()
frame(s, 2, "The strategic shift", "From Hardware Specs to Living Room Culture.",
      "People don't follow processors. They follow culture.")
top, ch = Inches(2.65), Inches(3.05)
cw = Inches(5.45)
# Left: the trap
card(s, M, top, cw, ch, fill=CARD)
txt(s, M + Inches(0.4), top + Inches(0.35), Inches(4), Inches(0.3), "THE TRAP", 11, DIM, bold=True, tracking=300)
txt(s, M + Inches(0.4), top + Inches(0.7), Inches(4.8), Inches(0.5), "Samsung Tizen  |  LG webOS", 20, GREY, font=HEAD)
pills(s, M + Inches(0.4), top + Inches(1.45), ["SPEC SHEETS", "PROCESSORS", "AI CHIPS"],
      size=10, fg=GREY, outline=DIM)
txt(s, M + Inches(0.4), top + Inches(2.15), Inches(4.8), Inches(0.6), "Social as a cold hardware manual.\nZero emotional pull.",
    15, DIM)
# Middle arrow
ax = M + cw + Inches(0.18)
box(s, ax, top + ch / 2 - Inches(0.35), Inches(0.75), Inches(0.7), fill=GOLD, shape=MSO_SHAPE.RIGHT_ARROW)
# Right: the play
rx = ax + Inches(0.93)
card(s, rx, top, cw, ch, fill=CARD_HI, line=GOLD)
txt(s, rx + Inches(0.4), top + Inches(0.35), Inches(4), Inches(0.3), "THE PLAY", 11, GOLD, bold=True, tracking=300)
txt(s, rx + Inches(0.4), top + Inches(0.7), Inches(4.8), Inches(0.5), "Roku City", 24, WHITE, font=HEAD)
txt(s, rx + Inches(0.4), top + Inches(1.3), Inches(4.8), Inches(0.6),
    "A screen saver turned into a pop-culture icon with millions of fans.", 15, WHITE)
txt(s, rx + Inches(0.4), top + Inches(2.15), Inches(4.8), Inches(0.6),
    "Apple & Starbucks: everyday users as uncurated ambassadors.", 15, GREY)
# Bottom verdict bar
box(s, M, Inches(6.0), CW, Inches(0.62), fill=GOLD, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.2)
txt(s, M, Inches(6.0), CW, Inches(0.62), "V'S MOVE:  OWN THE LIVING ROOM, NOT THE SPEC SHEET.", 15, INK,
    font=HEAD, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
notes(s,
      "Samsung and LG use social like a product manual: chips, processors, specs, and nobody feels anything. "
      "Roku turned a screen saver into a cult icon, which proves the category rewards culture, and that's the lane we take.",
      "Isn't Roku a consumer device brand, unlike us?",
      "So is every TV we power; we win the living room the same way.")

# ======================================================================
# 3. THE ARCHITECTURE
# ======================================================================
s = new_slide()
frame(s, 3, "The architecture", "Two Platforms. Two Growth Engines.",
      "LinkedIn wins the market. Instagram wins the living room.")
top, ch, gap = Inches(2.6), Inches(3.75), Inches(0.5)
half = (CW - gap) / 2
for i, (tag, name, role, chips, outcome, fill, fg, sub, chip_fg, chip_line) in enumerate([
    ("B2B", "LinkedIn", "Market Authority", ["OEMs", "HARDWARE", "CONTENT APPS", "ADVERTISERS"],
     "Deals, partners, ad revenue", CARD, WHITE, GREY, GOLD, GOLD),
    ("B2C", "Instagram", "Living Room Loyalty", ["VIEWERS", "FAMILIES", "GAMERS"],
     "Preference, loyalty, retention", WHITE, INK, DIM, INK, INK),
]):
    x = M + i * (half + gap)
    card(s, x, top, half, ch, fill=fill)
    pill(s, x + Inches(0.45), top + Inches(0.4), tag, size=11, fg=INK, fill=GOLD, outline=GOLD)
    txt(s, x + Inches(0.45), top + Inches(1.0), half, Inches(0.7), name, 34, fg, font=HEAD)
    txt(s, x + Inches(0.45), top + Inches(1.7), half, Inches(0.4), role, 18, sub, bold=True)
    pills(s, x + Inches(0.45), top + Inches(2.35), chips, size=9, fg=chip_fg, outline=chip_line,
          h=Inches(0.34), gap=Inches(0.1))
    box(s, x + Inches(0.45), top + Inches(3.0), Inches(0.5), Inches(0.05), fill=GOLD)
    txt(s, x + Inches(0.45), top + Inches(3.12), half, Inches(0.4), "OUTCOME:  " + outcome, 13, fg, bold=True)
# Center V hub
hub = Inches(1.0)
box(s, SW / 2 - hub / 2, top + ch / 2 - hub / 2, hub, hub, fill=GOLD, line=BG, shape=MSO_SHAPE.OVAL, lw=6)
txt(s, SW / 2 - hub / 2, top + ch / 2 - hub / 2, hub, hub, "V", 30, INK, font=HEAD,
    align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
notes(s,
      "We run two engines with two clear jobs: LinkedIn builds our authority with OEMs, partners and advertisers, and Instagram builds loyalty with the people on the sofa. "
      "One brand, one look, but each channel is judged by its own business outcome.",
      "Why not TikTok, X and everything else too?",
      "Focus: two engines done brilliantly beat six done averagely.")

# ======================================================================
# 4. LINKEDIN (B2B)
# ======================================================================
s = new_slide()
frame(s, 4, "B2B channel  |  LinkedIn", "Turning Scale Into Industry Authority.",
      "400+ TV brands give V data and access no rival OS can match.")
top, ch, gap = Inches(2.6), Inches(3.3), Inches(0.35)
w3 = (CW - 2 * gap) / 3
cols = [M + i * (w3 + gap) for i in range(3)]
heads = [("01", "Proprietary\nViewing Data"), ("02", "Strategic\nPartnerships"), ("03", "Executive\nVoice")]
for x, (num, head) in zip(cols, heads):
    card(s, x, top, w3, ch)
    txt(s, x + Inches(0.35), top + Inches(0.3), Inches(1), Inches(0.3), num, 12, GOLD, bold=True, tracking=200)
    txt(s, x + Inches(0.35), top + Inches(0.6), w3 - Inches(0.7), Inches(0.9), head, 19, WHITE, font=HEAD)
# 01: mini bar motif (decorative, no values)
txt(s, cols[0] + Inches(0.35), top + Inches(1.55), w3 - Inches(0.7), Inches(0.5),
    "Second-screen stats. Viewing habits.", 12, GREY)
bx, by = cols[0] + Inches(0.35), top + Inches(3.0)
for i, hgt in enumerate([0.3, 0.5, 0.4, 0.65, 0.85]):
    box(s, bx + i * Inches(0.42), by - Inches(hgt), Inches(0.28), Inches(hgt),
        fill=GOLD if i == 4 else LINE)
# 02: partner chips
py = top + Inches(1.75)
for i, name in enumerate(["TEADS", "OPENAI", "HISENSE"]):
    pill(s, cols[1] + Inches(0.35), py + i * Inches(0.47), name, size=11, fg=WHITE, outline=GOLD, h=Inches(0.37))
# 03: exec avatars
for i, (ini, name) in enumerate([("GE", "Guy Edri\nCEO"), ("DO", "Dennis Ostir")]):
    ay = top + Inches(1.7) + i * Inches(0.78)
    box(s, cols[2] + Inches(0.35), ay, Inches(0.6), Inches(0.6), fill=GOLD, shape=MSO_SHAPE.OVAL)
    txt(s, cols[2] + Inches(0.35), ay, Inches(0.6), Inches(0.6), ini, 13, INK, font=HEAD,
        align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    txt(s, cols[2] + Inches(1.1), ay, w3 - Inches(1.3), Inches(0.6), name, 13, WHITE, bold=True,
        anchor=MSO_ANCHOR.MIDDLE)
pills(s, M, Inches(6.2), ["TARGET: OEMs & ADVERTISERS", "GOAL: INBOUND DEALS"], size=10)
notes(s,
      "On LinkedIn we sell what only V has: viewing data from 400-plus brands, headline partnerships like Teads, OpenAI and Hisense, and the personal voices of Guy and Dennis. "
      "When an OEM or media buyer thinks about the future of TV, we want V to be the first name in their feed.",
      "Is sharing our viewing data a risk?",
      "We publish aggregated insights only; the raw data stays ours.")

# ======================================================================
# 5. INSTAGRAM (B2C)
# ======================================================================
s = new_slide()
frame(s, 5, "B2C channel  |  Instagram", "Home Comes to Life.",
      "Relaunch the dormant account as the living room's favorite feed.")
# 9-grid panoramic relaunch (left)
gx, gy, t, g = M, Inches(2.55), Inches(1.18), Inches(0.06)
grid_w = 3 * t + 2 * g
shades = [RGBColor(0x1A, 0x1A, 0x1C), RGBColor(0x22, 0x22, 0x25), RGBColor(0x1A, 0x1A, 0x1C)]
for r in range(3):
    for c in range(3):
        fill = GOLD if (r, c) == (1, 1) else shades[(r + c) % 3]
        box(s, gx + c * (t + g), gy + r * (t + g), t, t, fill=fill)
# continuous "sofa line" across the panorama (reads as one image split into 9)
box(s, gx, gy + 2 * (t + g) + Inches(0.55), grid_w, Inches(0.08), fill=GOLD)
txt(s, gx + (t + g), gy + (t + g), t, t, "WHERE\nMOMENTS\nCOME\nALIVE", 10, INK, font=HEAD,
    align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
pill(s, gx, gy + grid_w + Inches(0.18), "9-TILE PANORAMIC RELAUNCH", size=10)
# Right cards
rx = M + grid_w + Inches(0.5)
rw = SW - M - rx
card(s, rx, Inches(2.55), rw, Inches(1.65))
box(s, rx + Inches(0.35), Inches(2.85), Inches(1.05), Inches(1.05), fill=GOLD, shape=MSO_SHAPE.OVAL)
txt(s, rx + Inches(0.35), Inches(2.85), Inches(1.05), Inches(1.05), "15s", 22, INK, font=HEAD,
    align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
txt(s, rx + Inches(1.7), Inches(2.9), rw - Inches(2), Inches(0.5), "Living Room Hacks", 22, WHITE, font=HEAD)
txt(s, rx + Inches(1.7), Inches(3.45), rw - Inches(2), Inches(0.5), "Quick TV tricks, family rituals, gaming.", 14, GREY)
card(s, rx, Inches(4.4), rw, Inches(1.65))
txt(s, rx + Inches(0.35), Inches(4.65), rw, Inches(0.5), "Community Formats", 22, WHITE, font=HEAD)
pills(s, rx + Inches(0.35), Inches(5.3), ['"MY RITUAL"', '"THE REAL LIVING ROOM"', "UNPOLISHED COUCH MOMENTS"],
      size=10, fg=WHITE, outline=GOLD)
notes(s,
      "We relaunch the dormant Instagram with one panoramic living room split across nine tiles, Where Moments Come Alive, so the profile itself becomes the launch. "
      "Then we stay alive with 15-second TV hacks and community formats like My Ritual, real couches, real families, zero gloss.",
      "Will a dormant account really come back?",
      "The 9-grid is the reset button; the formats are built to earn the follow.")

# ======================================================================
# 6. V AMBASSADORS
# ======================================================================
s = new_slide()
frame(s, 6, "Creator strategy", "V Ambassadors: Real People, Zero Filters.",
      "Authentic living rooms outperform staged commercials.")
top, ch = Inches(2.6), Inches(2.55)
cw = Inches(5.35)
# Staged (muted, crossed out)
card(s, M, top, cw, ch, fill=CARD)
txt(s, M + Inches(0.4), top + Inches(0.35), Inches(4), Inches(0.3), "OLD WAY", 11, DIM, bold=True, tracking=300)
txt(s, M + Inches(0.4), top + Inches(0.7), cw, Inches(0.6), "Staged Commercial", 24, DIM, font=HEAD)
box(s, M + Inches(0.4), top + Inches(0.9), Inches(4.3), Inches(0.05), fill=GOLD)
pills(s, M + Inches(0.4), top + Inches(1.6), ["HIGH COST", "LOW TRUST", "SLOW"], size=10, fg=DIM, outline=DIM)
# Real (gold)
rx = SW - M - cw
card(s, rx, top, cw, ch, fill=CARD_HI, line=GOLD)
txt(s, rx + Inches(0.4), top + Inches(0.35), Inches(4), Inches(0.3), "V WAY", 11, GOLD, bold=True, tracking=300)
txt(s, rx + Inches(0.4), top + Inches(0.7), cw, Inches(0.6), "Real Living Rooms", 24, WHITE, font=HEAD)
pills(s, rx + Inches(0.4), top + Inches(1.6), ["LOW COST", "HIGH TRUST", "ALWAYS-ON"], size=10)
box(s, SW / 2 - Inches(0.38), top + ch / 2 - Inches(0.3), Inches(0.76), Inches(0.6), fill=GOLD,
    shape=MSO_SHAPE.RIGHT_ARROW)
# Who films
y2 = Inches(5.4)
w3 = (CW - Inches(0.5)) / 3
for i, (who, what) in enumerate([("Employees", "Our people, their homes"),
                                  ("Real Users", "Raw, phone-shot moments"),
                                  ("Creators", "Living-room takeovers")]):
    x = M + i * (w3 + Inches(0.25))
    box(s, x, y2, Inches(0.07), Inches(0.75), fill=GOLD)
    txt(s, x + Inches(0.25), y2, w3, Inches(0.4), who, 18, WHITE, font=HEAD)
    txt(s, x + Inches(0.25), y2 + Inches(0.42), w3, Inches(0.35), what, 13, GREY)
notes(s,
      "Instead of expensive glossy ads, we hand the camera to real employees, real users and creators and let them film their own living rooms. "
      "It costs a fraction of a production and people trust it more, because people believe people, not logos.",
      "How do we protect the brand if it's unfiltered?",
      "Clear playbook, light approval, and we only boost what's on-brand.")

# ======================================================================
# 7. ROADMAP
# ======================================================================
s = new_slide()
frame(s, 7, "Roadmap", "The Road to CES 2027 & Beyond.",
      "One relaunch, one global anchor, then always-on growth.")
ly = Inches(3.25)
box(s, M, ly - Inches(0.03), CW, Inches(0.06), fill=LINE)
box(s, M, ly - Inches(0.03), CW * 0.55, Inches(0.06), fill=GOLD)
stages = [
    ("Q4 2026", "Relaunch", "9-grid Instagram reveal\nLinkedIn exec cadence live", False),
    ("JAN 2027", "CES Las Vegas", "Live BTS executive coverage\nCreator living-room takeovers", True),
    ("2027", "Always-On Growth", "Ambassadors at scale\nData-led B2B drumbeat", False),
]
w3 = CW / 3
for i, (when, name, what, hero) in enumerate(stages):
    cx = M + w3 * i + w3 / 2
    d = Inches(0.55) if hero else Inches(0.32)
    box(s, cx - d / 2, ly - d / 2, d, d, fill=GOLD if hero or i == 0 else BG,
        line=GOLD, shape=MSO_SHAPE.OVAL, lw=2.5)
    cy = ly + Inches(0.55)
    if hero:
        card(s, cx - w3 / 2 + Inches(0.1), cy, w3 - Inches(0.2), Inches(2.1), fill=CARD_HI, line=GOLD)
    txt(s, cx - w3 / 2, cy + Inches(0.25), w3, Inches(0.3), when, 12, GOLD, bold=True,
        align=PP_ALIGN.CENTER, tracking=300)
    txt(s, cx - w3 / 2, cy + Inches(0.6), w3, Inches(0.5), name, 22, WHITE, font=HEAD, align=PP_ALIGN.CENTER)
    txt(s, cx - w3 / 2 + Inches(0.3), cy + Inches(1.2), w3 - Inches(0.6), Inches(0.8), what, 13, GREY,
        align=PP_ALIGN.CENTER)
pill(s, M + w3 + w3 / 2 - Inches(0.67), ly - Inches(0.85), "THE ANCHOR", size=10, fg=INK, fill=GOLD)
box(s, M, Inches(6.05), CW, Inches(0.6), fill=GOLD, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.2)
txt(s, M, Inches(6.05), CW, Inches(0.6), "DECISION TODAY:  GREENLIGHT THE Q4 RELAUNCH + CES 2027 ACTIVATION", 15, INK,
    font=HEAD, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
notes(s,
      "We relaunch in Q4, peak at CES Las Vegas in January with live executive coverage and creator takeovers, then switch to always-on growth through 2027. "
      "All I need today is your green light for the Q4 relaunch and the CES activation.",
      "What will I see before CES to know it's working?",
      "A monthly scorecard: B2B inbound and Instagram growth, from month one.")

prs.save(OUT)
print(f"Saved {OUT}")
