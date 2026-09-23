"""
V Social Strategy: CEO deck (7 slides, 16:9).
Usage:  pip install python-pptx && python build_deck.py
Drop exported PDF crops into ./assets using the filenames listed in ASSETS.
Missing files render as labeled gold placeholders so the deck always builds.
"""
from pathlib import Path
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR

HERE = Path(__file__).parent
ASSET_DIR = HERE / "assets"
OUT = HERE / "V_Social_CEO_Deck.pptx"

BLACK = RGBColor(0x0A, 0x0A, 0x0A)
CARD = RGBColor(0x17, 0x17, 0x17)
LINE = RGBColor(0x2E, 0x2E, 0x2E)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
GREY = RGBColor(0x9A, 0x9A, 0x9A)
GOLD = RGBColor(0xF5, 0xC5, 0x18)
FONT = "Montserrat"  # falls back to the system sans if not installed

prs = Presentation()
prs.slide_width, prs.slide_height = Inches(13.333), Inches(7.5)
W, H = prs.slide_width, prs.slide_height
BLANK = prs.slide_layouts[6]


def bg(slide, color=BLACK):
    f = slide.background.fill
    f.solid()
    f.fore_color.rgb = color


def text(slide, x, y, w, h, s, size, color=WHITE, bold=False, align=PP_ALIGN.LEFT,
         anchor=MSO_ANCHOR.TOP, spacing=None):
    tb = slide.shapes.add_textbox(x, y, w, h)
    tf = tb.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    lines = s.split("\n")
    for i, line in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        r = p.add_run()
        r.text = line
        r.font.name, r.font.size, r.font.bold = FONT, Pt(size), bold
        r.font.color.rgb = color
        if spacing is not None:
            r.font._element.set("spc", str(spacing))
    return tb


def rect(slide, x, y, w, h, fill=CARD, line=None, shape=MSO_SHAPE.RECTANGLE):
    s = slide.shapes.add_shape(shape, x, y, w, h)
    s.fill.solid()
    s.fill.fore_color.rgb = fill
    if line is None:
        s.line.fill.background()
    else:
        s.line.color.rgb = line
        s.line.width = Pt(1.25)
    s.shadow.inherit = False
    return s


def asset(slide, x, y, w, h, filename, label):
    """Insert image cropped-to-fill if present, else a labeled placeholder."""
    p = ASSET_DIR / filename
    if p.exists():
        pic = slide.shapes.add_picture(str(p), x, y)
        iw, ih = pic.image.size
        box_r, img_r = w / h, iw / ih
        if img_r > box_r:
            c = (1 - box_r / img_r) / 2
            pic.crop_left = pic.crop_right = c
        else:
            c = (1 - img_r / box_r) / 2
            pic.crop_top = pic.crop_bottom = c
        pic.left, pic.top, pic.width, pic.height = x, y, w, h
        return pic
    r = rect(slide, x, y, w, h, fill=CARD, line=LINE)
    text(slide, x + Inches(0.15), y, w - Inches(0.3), h,
         f"{label}\nassets/{filename}", 10, GREY, align=PP_ALIGN.CENTER,
         anchor=MSO_ANCHOR.MIDDLE)
    return r


def header(slide, n, kicker, title, sub):
    text(slide, Inches(0.7), Inches(0.5), Inches(8), Inches(0.3),
         f"{n:02d}  /  {kicker.upper()}", 11, GOLD, bold=True, spacing=300)
    text(slide, Inches(0.7), Inches(0.85), Inches(12), Inches(0.9), title, 30, WHITE, bold=True)
    text(slide, Inches(0.7), Inches(1.7), Inches(11.5), Inches(0.5), sub, 16, GREY)


def badges(slide, items, y=Inches(6.55), x=Inches(0.7)):
    for label in items:
        w = Inches(0.3 + 0.115 * len(label))
        b = rect(slide, x, y, w, Inches(0.45), fill=BLACK, line=GOLD,
                 shape=MSO_SHAPE.ROUNDED_RECTANGLE)
        b.adjustments[0] = 0.5
        text(slide, x, y, w, Inches(0.45), label, 12, GOLD, bold=True,
             align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
        x += w + Inches(0.2)


def notes(slide, voiceover, q, a):
    slide.notes_slide.notes_text_frame.text = (
        f"SAY: {voiceover}\n\nIF CEO ASKS: {q}\nANSWER: {a}")


# ---------- 1. Title ----------
s = prs.slides.add_slide(BLANK); bg(s)
asset(s, 0, 0, W, H, "01_hero_living_room.png",
      "HERO: cinematic dark living room, TV glowing with V UI (Plan PDF cover / launch key visual)")
rect(s, 0, Inches(4.3), W, Inches(3.2), fill=BLACK)
text(s, Inches(0.7), Inches(4.55), Inches(4), Inches(0.9), "V", 60, GOLD, bold=True)
text(s, Inches(0.7), Inches(5.45), Inches(12), Inches(0.9), "Built to Be Seen.", 44, WHITE, bold=True)
text(s, Inches(0.7), Inches(6.35), Inches(12), Inches(0.5),
     "One OS. Two audiences. One social engine that sells both.", 18, GREY)
notes(s, "V is no longer a platform people use without noticing; from today it is a brand people choose. "
         "In five minutes I will show you how social turns V into the name OEMs sign with and families talk about.",
      "Why rebrand on social first?",
      "Because social is where OEMs, advertisers and buyers already judge us, every day, for free.")

# ---------- 2. Benchmark ----------
s = prs.slides.add_slide(BLANK); bg(s)
header(s, 2, "Competitive benchmark", "Giants Sell Specs. No One Owns the Home.",
       "Seven OS brands benchmarked. The lifestyle + authority space is wide open.")
brands = [("LG webOS", "01_lg"), ("Samsung Tizen", "02_samsung"), ("Roku", "03_roku"),
          ("Apple TV", "04_apple"), ("Google TV", "05_googletv"), ("Android", "06_android"),
          ("Microsoft", "07_microsoft")]
cw, gap, top = Inches(1.35), Inches(0.12), Inches(2.6)
for i, (name, key) in enumerate(brands):
    x = Inches(0.7) + i * (cw + gap)
    asset(s, x, top, cw, Inches(2.6), f"02_bench_{key}.png", f"{name} feed screenshot")
    text(s, x, top + Inches(2.7), cw, Inches(0.3), name, 11, GREY, align=PP_ALIGN.CENTER)
vx = Inches(0.7) + 7 * (cw + gap) + Inches(0.1)
v = rect(s, vx, top, Inches(1.6), Inches(2.6), fill=BLACK, line=GOLD)
text(s, vx, top, Inches(1.6), Inches(2.6), "V\n\nTHE\nOPEN\nSPACE", 16, GOLD, bold=True,
     align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
badges(s, ["7 brands benchmarked", "Feature-led: the norm", "Lifestyle + authority: unowned"])
notes(s, "We benchmarked LG, Samsung, Roku, Apple, Google, Android and Microsoft, and almost all of them talk about features, not about life at home. "
         "Nobody combines industry authority with real living-room emotion, and that gap is exactly where V plants its flag.",
      "Can't Samsung or LG just copy us?",
      "They're locked into their own hardware; V is the independent OS every OEM can partner with.")

# ---------- 3. Two channels ----------
s = prs.slides.add_slide(BLANK); bg(s)
header(s, 3, "The strategy", "Two Channels. Two Jobs. One Brand.",
       "LinkedIn wins the deal. Instagram wins the living room.")
half = (W - Inches(1.4) - Inches(0.3)) / 2
for i, (tag, head, sub, fn, lab, fill, fg) in enumerate([
    ("B2B  /  LINKEDIN", "Win OEMs & Advertisers", "Industry authority",
     "03_linkedin_preview.png", "LinkedIn feed mockup: exec post + data card", CARD, WHITE),
    ("B2C  /  INSTAGRAM", "Win the Living Room", "Smart-home lifestyle & community",
     "03_instagram_preview.png", "Instagram 9-grid preview", WHITE, BLACK),
]):
    x = Inches(0.7) + i * (half + Inches(0.3))
    rect(s, x, Inches(2.5), half, Inches(3.85), fill=fill)
    text(s, x + Inches(0.35), Inches(2.75), half, Inches(0.3), tag, 11, GOLD, bold=True, spacing=300)
    text(s, x + Inches(0.35), Inches(3.1), Inches(3.2), Inches(1.2), head, 28, fg, bold=True)
    text(s, x + Inches(0.35), Inches(4.4), Inches(3.0), Inches(0.6), sub, 14, GREY)
    asset(s, x + half - Inches(2.45), Inches(2.75), Inches(2.1), Inches(3.35), fn, lab)
badges(s, ["B2B: pipeline", "B2C: preference", "One visual language"])
notes(s, "We deliberately split the work: LinkedIn is our sales tool for OEMs and advertisers, and Instagram is our brand tool for the people on the sofa. "
         "Same black, white and gold identity, but each channel has one business job and one scorecard.",
      "Why not just be everywhere?",
      "Focus wins: two channels done brilliantly beat seven done averagely.")

# ---------- 4. LinkedIn ----------
s = prs.slides.add_slide(BLANK); bg(s)
header(s, 4, "LinkedIn  |  B2B", "V Becomes the Industry's Point of View.",
       "Data and leadership voices that make OEMs and advertisers call us first.")
asset(s, Inches(0.7), Inches(2.5), Inches(5.6), Inches(3.8), "04_mckinsey_viewing_graph.png",
      "McKinsey viewing-data graph as a branded LinkedIn data post (Plan PDF)")
asset(s, Inches(6.55), Inches(2.5), Inches(3.0), Inches(3.8), "04_exec_post_1.png",
      "Executive thought-leadership post mockup #1")
asset(s, Inches(9.8), Inches(2.5), Inches(2.85), Inches(3.8), "04_exec_post_2.png",
      "Executive post #2 / OEM partnership announcement card")
badges(s, ["OEM inbound", "Advertiser demand", "Exec-led voice"])
notes(s, "On LinkedIn we lead with proprietary-style insight like the McKinsey viewing data, packaged as sharp visual posts, and we put our executives' faces and opinions in front of the industry. "
         "The goal is simple: when an OEM or media buyer thinks about the future of TV, they think of V.",
      "Do I have to post personally?",
      "Once a month, ghost-drafted for you; 10 minutes of your time, the most valuable reach we have.")

# ---------- 5. Instagram ----------
s = prs.slides.add_slide(BLANK); bg(s)
header(s, 5, "Instagram  |  B2C", "V Lives on the Sofa, Not the Spec Sheet.",
       "Real homes, real moments. V is the quiet hero of the living room.")
px, pw, ph = Inches(0.7), Inches(3.2), Inches(4.0)
rect(s, px - Inches(0.08), Inches(2.37), pw + Inches(0.16), ph + Inches(0.26),
     fill=BLACK, line=GOLD, shape=MSO_SHAPE.ROUNDED_RECTANGLE).adjustments[0] = 0.08
asset(s, px, Inches(2.5), pw, ph, "05_ig_9grid_launch_mobile.png",
      "9-grid living-room launch mockup in phone frame (Plan PDF)")
for i in range(3):
    asset(s, Inches(4.35) + i * Inches(2.85), Inches(2.5), Inches(2.65), Inches(4.0),
          f"05_sofa_lifestyle_{i + 1}.png", f"Uncurated sofa lifestyle shot #{i + 1}")
badges(s, ["9-grid launch moment", "Lifestyle > specs", "Community-first"])
notes(s, "We launch with a 9-grid that turns our Instagram profile into one big living room, then keep it alive with real, uncurated sofa moments instead of glossy product renders. "
         "People don't buy an operating system, they buy the feeling of Friday night, and V owns that feeling.",
      "Where's the product in these shots?",
      "On the screen, every time; the product is the hero, the home is the proof.")

# ---------- 6. Amplifiers ----------
s = prs.slides.add_slide(BLANK); bg(s)
header(s, 6, "Amplifiers", "Creators Make V Famous Faster.",
       "YouTube and ambassadors multiply reach we don't have to buy.")
asset(s, Inches(0.7), Inches(2.5), Inches(6.2), Inches(3.8), "06_youtube_thumbnails.png",
      "YouTube channel / thumbnail mockups (Plan PDF)")
for i in range(3):
    asset(s, Inches(7.15) + i * Inches(1.85), Inches(2.5), Inches(1.7), Inches(3.8),
          f"06_creator_{i + 1}.png", f"Creator / ambassador card #{i + 1}")
badges(s, ["Borrowed trust", "Always-on video", "Lower cost per reach"])
notes(s, "YouTube gives V a permanent home for demos and stories, and creators and ambassadors carry our message into audiences that would never follow a tech brand. "
         "It is the fastest way to earn trust, because people believe people, not logos.",
      "How do we control what creators say?",
      "Clear brief, approval gate, paid only on delivery.")

# ---------- 7. The ask ----------
s = prs.slides.add_slide(BLANK); bg(s)
header(s, 7, "Decision", "Greenlight: 90 Days to Launch V.",
       "Three phases. Every phase tied to a business number.")
phases = [("DAY 0-30", "Ignite", "Rebrand live, 9-grid launch, exec voices on"),
          ("DAY 31-60", "Prove", "Data posts, first creators, community rhythm"),
          ("DAY 61-90", "Scale", "Double down on what converts, OEM showcases")]
pw = (W - Inches(1.4) - Inches(0.6)) / 3
for i, (d, name, what) in enumerate(phases):
    x = Inches(0.7) + i * (pw + Inches(0.3))
    rect(s, x, Inches(2.5), pw, Inches(0.08), fill=GOLD)
    text(s, x, Inches(2.8), pw, Inches(0.3), d, 12, GOLD, bold=True, spacing=300)
    text(s, x, Inches(3.15), pw, Inches(0.8), name, 34, WHITE, bold=True)
    text(s, x, Inches(4.05), pw - Inches(0.3), Inches(0.9), what, 15, GREY)
rect(s, Inches(0.7), Inches(5.25), W - Inches(1.4), Inches(1.0), fill=GOLD)
text(s, Inches(1.0), Inches(5.25), W - Inches(2.0), Inches(1.0),
     "THE ASK:  approve budget [ $X ]  +  one CEO post per month", 20, BLACK, bold=True,
     anchor=MSO_ANCHOR.MIDDLE)
badges(s, ["KPI: OEM & advertiser leads", "KPI: brand search & followers", "90-day review"])
notes(s, "I'm asking for one decision today: approve the 90-day plan and the budget, and lend us your voice once a month on LinkedIn. "
         "In 90 days I'll come back with the numbers that matter: OEM and advertiser leads, and how many more people search for V by name.",
      "What if it doesn't work?",
      "Day-60 checkpoint: we cut what doesn't convert and move the money to what does.")

prs.save(OUT)
print(f"Saved {OUT}")
