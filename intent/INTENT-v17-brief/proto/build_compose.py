#!/usr/bin/env python3
# Derives intent/proto/compose.html from a FROZEN version of the drawing tool.
# Every replacement is asserted, so a change upstream fails loudly here rather
# than silently producing a broken tool.
#
# IT IS NOT BUILT FROM index.html, AND THAT IS THE POINT (13 Aug 26). index.html
# is the bench: it holds whatever is being tried today, and on the day this was
# rebuilt it held the caustics work — which is not in version 14 and changes how
# a transmissive body lays its shadow. Built from the bench, compose came out
# with a shadow nobody had approved, and it was spotted on sight: "the shadows of
# the transparent bodies look like 15, not 14. I want 14." A tool for making
# finished work has to be cut from a version that was frozen on purpose.
#
# So SRC is a frozen file, and moving it forward is a deliberate act: change the
# line, rebuild, and look at the result against the one before it.
import io, re, sys, os

PROTO = os.path.dirname(os.path.abspath(__file__))
# AND THE STANDING ARRANGEMENT IS index.html, decided on 13 Aug 26: "the tool
# always contains the latest version of the tool inside it." The freeze above
# was the right instinct about the wrong risk — what went wrong that morning was
# building from unfinished work without saying so, not building from live work
# as such. The answer to that is a build that runs by itself and fails loudly,
# which is what serve.py now does: it rebuilds compose.html whenever index.html
# is newer, so the derived tool cannot silently fall behind the real one.
SRC = os.path.join(PROTO, 'index.html')
OUT = os.path.join(PROTO, 'compose.html')
# `python3 build_compose.py <file>` to try it against another version without
# editing this line — for comparing, not for shipping.
if len(sys.argv) > 1: SRC = os.path.join(PROTO, sys.argv[1])
print('from', os.path.basename(SRC))

s = io.open(SRC, encoding='utf-8').read()

def sub(old, new, n=1):
    global s
    c = s.count(old)
    assert c == n, 'expected %d of %r, found %d' % (n, old[:70], c)
    s = s.replace(old, new)

# ---------------------------------------------------------------- title
s = re.sub(r'<title>.*?</title>', '<title>INTENT — טיפוגרפיה וצורות</title>', s, count=1)

# ---------------------------------------------------------------- stylesheet
sub('''  #stage { position: fixed; inset: 0; }
  #stage canvas { display: block; }
  #draw {
    position: fixed; inset: 0; z-index: 2; cursor: crosshair;
  }''',
'''  /* The tool no longer works on the whole window. It works inside a format —
     a rectangle whose proportion comes from the typography that was uploaded —
     and the window around it is just the table the format lies on. */
  #frame { position: fixed; overflow: hidden; box-shadow: 0 18px 60px rgba(0,0,0,.38); }
  #stage { position: absolute; inset: 0; }
  #stage canvas { display: block; }
  /* the layer that stands IN FRONT of the shapes. It takes no pointer events:
     the drawing surface has to stay reachable through it */
  #flayer {
    position: absolute; inset: 0; z-index: 2;
    width: 100%; height: 100%; pointer-events: none; display: none;
  }
  #draw {
    position: absolute; inset: 0; z-index: 3; cursor: crosshair;
  }''')

sub('''  html, body {
    margin: 0; padding: 0; height: 100%; overflow: hidden;
    background: var(--ground);''',
'''  html, body {
    margin: 0; padding: 0; height: 100%; overflow: hidden;
    background: var(--table);''')

sub('''  :root {
    --ground: #e6e4dd;''',
'''  :root {
    --table: #2b2b29;      /* the surround, deliberately neutral and dark: a
                              coloured surround would talk the format's own
                              colour into looking like something it is not */
    --ground: #e6e4dd;''')

# the whole HUD of the drawing tool goes away. The elements stay in the
# document, because devCheck and the tuning panel still reach for them by id,
# but nothing of them is on screen.
sub('''@media (max-height: 760px) { #panel { top: 62px; max-height: calc(100vh - 110px); overflow-y: auto; } }
</style>''',
'''@media (max-height: 760px) { #panel { top: 62px; max-height: calc(100vh - 110px); overflow-y: auto; } }

  /* ---------- no interface ----------
     Past the setup card there is nothing on screen but the format: no title,
     no buttons, no readout, no hint. The elements are left in the document
     because devCheck() and the tuning panel still address them by id from the
     console — they are simply never shown. */
  #title, #tools, #hint, #readout, #matpick, #panel { display: none !important; }

  /* ---------- the setup card ----------
     The one piece of interface there is. It asks for the two typography layers,
     the colour behind the shapes and the length of a turn, and then it leaves.
     Escape brings it back without touching the composition. */
  #setup {
    position: fixed; inset: 0; z-index: 40;
    background: rgba(18,18,17,.72); backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center;
    color: #f2f1ec;
  }
  #setup[hidden] { display: none; }
  #setup .card {
    width: 420px; max-width: calc(100vw - 32px); max-height: calc(100vh - 32px);
    overflow-y: auto;
    background: rgba(32,32,30,.94);
    border: 1px solid rgba(255,255,255,.12); border-radius: 16px;
    padding: 22px 24px 20px;
  }
  #setup h1 { font-size: 15px; font-weight: 500; margin: 0 0 2px; }
  #setup .sub { font-size: 12px; color: #9d9c95; margin: 0 0 18px; line-height: 1.6; }
  #setup .grp {
    font-size: 10px; letter-spacing: .09em; text-transform: uppercase;
    color: #8d8c86; margin: 16px 0 7px;
  }
  #setup .drop {
    display: flex; align-items: center; gap: 10px;
    border: 1px dashed rgba(255,255,255,.24); border-radius: 10px;
    padding: 9px 11px; font-size: 12px; cursor: pointer;
    transition: border-color .15s, background .15s;
  }
  #setup .drop:hover, #setup .drop.over { border-color: rgba(255,255,255,.6); background: rgba(255,255,255,.05); }
  #setup .drop .thumb {
    width: 42px; height: 42px; flex: 0 0 42px; border-radius: 6px;
    background: repeating-conic-gradient(#4a4a47 0% 25%, #3a3a37 0% 50%) 50% / 10px 10px;
    background-size: 10px 10px; object-fit: contain; display: block;
  }
  #setup .drop .txt { flex: 1; line-height: 1.45; min-width: 0; }
  #setup .drop .txt b { display: block; font-weight: 500; }
  #setup .drop .txt span { color: #9d9c95; font-size: 11px; word-break: break-all; }
  #setup .drop input[type=file] { display: none; }
  #setup .drop .x {
    font-size: 15px; color: #9d9c95; padding: 0 4px; line-height: 1;
    background: none; border: 0; cursor: pointer;
  }
  /* both of these are numbers and swatches, not words: left to right, or the
     width of the format reads as its height */
  #setup .row2 { display: flex; gap: 8px; align-items: center; direction: ltr; }
  #setup input[type=color] {
    width: 42px; height: 34px; padding: 0; border: 1px solid rgba(255,255,255,.2);
    border-radius: 8px; background: none; cursor: pointer;
  }
  #setup input[type=text], #setup input[type=number] {
    font: inherit; font-size: 12px; direction: ltr; text-align: left;
    background: rgba(255,255,255,.06); color: #f2f1ec;
    border: 1px solid rgba(255,255,255,.16); border-radius: 8px;
    padding: 8px 10px; min-width: 0; width: 100%;
  }
  #setup .fmt { display: flex; gap: 8px; align-items: center; direction: ltr; }
  #setup .fmt span { font-size: 12px; color: #9d9c95; }
  #setup .go {
    width: 100%; margin-top: 20px; padding: 11px 0; font-size: 13px;
    color: #16160f; background: #f2f1ec; border: 0; border-radius: 999px;
  }
  #setup .go:hover { background: #fff; }
  #setup .exp { display: flex; gap: 8px; margin-top: 10px; }
  #setup .exp button { flex: 1; color: #f2f1ec; border-color: rgba(255,255,255,.24); font-size: 11px; padding: 8px 0; }
  #setup .exp button:hover { background: rgba(255,255,255,.08); }
  #setup .keys { font-size: 11px; color: #7f7e79; margin-top: 14px; line-height: 1.8; direction: rtl; }
  #setup .keys kbd {
    font: inherit; font-size: 10px; direction: ltr; display: inline-block;
    border: 1px solid rgba(255,255,255,.2); border-radius: 4px; padding: 0 4px; margin: 0 2px;
  }

  /* ---------- the bar ----------
     The exports live here and not in the setup card, and not floating over the
     work either. "No interface" is a rule about the POSTER, not about the
     window: the format is inset far enough at the bottom that this strip is
     table and never picture, so the composition is never covered and never
     competed with, and the exports are in sight while the thing being exported
     is in sight. It is quiet until it is looked at. */
  /* At the TOP, and that is not a taste. The page is shown inside a frame whose
     height is not the height of what anyone can see: measured off a screenshot
     of the shared link, the frame's viewport ran to 1232px while the visible
     region stopped at 1103 — the bottom 129 pixels, which is exactly where this
     strip was, were clipped away and the bar was simply not on screen. There is
     no scrolling to recover it either, since the page is fixed and hidden by
     design. The top edge of a frame is always the top edge of what is shown. */
  #bar {
    position: fixed; left: 0; right: 0; top: 0; height: 56px; z-index: 30;
    display: flex; align-items: center; justify-content: center; gap: 6px;
    opacity: .5; transition: opacity .18s;
  }
  #bar:hover, #bar:focus-within { opacity: 1; }
  #bar button {
    font-size: 11px; padding: 6px 14px; color: #d9d8d2;
    border-color: rgba(255,255,255,.22); background: transparent;
  }
  #bar button:hover { background: rgba(255,255,255,.09); }
  #bar button:focus-visible { outline: 2px solid #d9d8d2; outline-offset: 2px; }
  #bar .sep { width: 1px; height: 16px; background: rgba(255,255,255,.18); margin: 0 6px; }
  /* The paper's colour, on the bar as well as in the card. It is the one setting
     that is judged against the picture rather than decided before it — the
     shapes are already standing on it — so it has to be reachable without
     going back to a card that covers the thing being judged. A swatch and not
     a field: the exact hex still belongs in the card, and a round chip on the
     table reads as a colour rather than as a control. */
  #bar .swatch { display: flex; align-items: center; }
  #bar .swatch input[type=color] {
    width: 26px; height: 26px; padding: 0; cursor: pointer;
    background: none; border: 1px solid rgba(255,255,255,.22); border-radius: 50%;
  }
  #bar .swatch input[type=color]::-webkit-color-swatch-wrapper { padding: 2px; }
  #bar .swatch input[type=color]::-webkit-color-swatch { border: 0; border-radius: 50%; }

  /* a line of progress during an export, and nothing else ever */
  #note {
    position: fixed; z-index: 45; bottom: 20px; left: 50%; transform: translateX(-50%);
    background: rgba(18,18,17,.82); color: #f2f1ec; font-size: 12px;
    padding: 8px 16px; border-radius: 999px; pointer-events: none;
  }
  #note[hidden] { display: none; }

  /* ---------- the shelf ----------
     Where an export is put down when it cannot be handed over. A page inside a
     sandboxed frame is not always allowed to download anything, and the shared
     link is exactly that kind of frame — the GIF simply never arrived. The
     browser's own context menu is not the page's to lose, so the file is shown
     as a real <img> or <video> and can be saved from there. */
  #shelf {
    position: fixed; inset: 0; z-index: 50;
    background: rgba(18,18,17,.78); backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center; padding: 24px;
    color: #f2f1ec;
  }
  #shelf[hidden] { display: none; }
  #shelf .card {
    max-width: min(92vw, 900px); max-height: 92vh;
    display: flex; flex-direction: column; gap: 10px;
  }
  #shelf .media { min-height: 0; display: flex; justify-content: center; }
  #shelf .media img, #shelf .media video {
    max-width: 100%; max-height: 70vh; display: block; border-radius: 8px;
    background: #111; box-shadow: 0 14px 44px rgba(0,0,0,.5);
  }
  #shelf .foot { display: flex; align-items: center; gap: 14px; font-size: 12px; }
  #shelf .foot span { color: #9d9c95; direction: ltr; }
  #shelf .foot a {
    color: #16160f; background: #f2f1ec; text-decoration: none;
    padding: 7px 18px; border-radius: 999px; font-size: 12px;
  }
  #shelf .hint { margin: 0; font-size: 11px; color: #7f7e79; line-height: 1.7; }
</style>''')

# ---------------------------------------------------------------- body
sub('''<div id="stage"></div>
<canvas id="draw"></canvas>''',
'''<div id="frame">
  <div id="stage"></div>
  <img id="flayer" alt="">
  <canvas id="draw"></canvas>
</div>

<div id="setup">
  <div class="card">
    <h1>פורמט, טיפוגרפיה, צורות</h1>
    <p class="sub">העלי PNG של הטיפוגרפיה — הוא קובע את הפורמט. אחרי ההתחלה אין ממשק: רק השטח, הציור והצורות. <b>Esc</b> מחזיר לכאן, גם לייצוא.</p>

    <div class="grp">שכבות — שתיהן רשות</div>
    <p class="sub" style="margin:-3px 0 9px">אפשר רק מאחורה, רק מלפנים, שתיהן, או בלי כלום.</p>
    <div class="drop" id="drop-back" role="button" tabindex="0">
      <img class="thumb" id="thumb-back" alt="">
      <span class="txt"><b>מאחורי הצורות · רשות</b><span id="name-back">אין — לחצי, גררי או הדביקי PNG</span></span>
      <button type="button" class="x" id="clr-back" hidden>✕</button>
      <input type="file" id="file-back" accept="image/png,image/*">
    </div>
    <div style="height:8px"></div>
    <div class="drop" id="drop-front" role="button" tabindex="0">
      <img class="thumb" id="thumb-front" alt="">
      <span class="txt"><b>לפני הצורות · רשות</b><span id="name-front">אין — לחצי, גררי או הדביקי PNG</span></span>
      <button type="button" class="x" id="clr-front" hidden>✕</button>
      <input type="file" id="file-front" accept="image/png,image/*">
    </div>

    <div class="grp">רקע מאחורי הצורות</div>
    <div class="row2">
      <input type="color" id="bg-col" value="#f8f7f2" autocomplete="off">
      <input type="text" id="bg-hex" value="#f8f7f2" spellcheck="false" autocomplete="off">
    </div>

    <div class="grp">פורמט</div>
    <div class="fmt">
      <input type="number" id="fmt-w" min="80" max="8000" step="1" value="1080" autocomplete="off">
      <span>×</span>
      <input type="number" id="fmt-h" min="80" max="8000" step="1" value="1350" autocomplete="off">
    </div>

    <div class="grp">אורך הסרטון (שניות)</div>
    <input type="number" id="vid-secs" min="2" max="120" step="0.5" value="15" autocomplete="off">
    <p class="sub" style="margin:7px 0 0">סיבוב מלא לוקח 8 שניות, והסרטון ממשיך להסתובב עד שהוא מגיע לאורך שביקשת. 15 שניות הן כמעט שני סיבובים — מתאים לסטורי, שמתנגן פעם אחת. ללופ מושלם: 8, 16, 24. GIF תמיד סיבוב אחד.</p>

    <button class="go" id="go">התחל</button>
    <div class="exp">
      <button type="button" id="exp-png">PNG</button>
      <button type="button" id="exp-vid">וידאו</button>
      <button type="button" id="exp-gif">GIF</button>
    </div>
    <div class="keys">
      <kbd>Esc</kbd> חזרה להגדרות · <kbd>C</kbd> ניקוי ·
      <kbd>S</kbd> תמונה · <kbd>V</kbd> וידאו · <kbd>G</kbd> GIF
    </div>
  </div>
</div>
<div id="bar">
  <button type="button" id="bar-png">PNG</button>
  <button type="button" id="bar-vid">וידאו</button>
  <button type="button" id="bar-gif">GIF</button>
  <span class="sep"></span>
  <label class="swatch" title="רקע מאחורי הצורות">
    <input type="color" id="bar-bg" value="#f8f7f2" autocomplete="off">
  </label>
  <span class="sep"></span>
  <button type="button" id="bar-set">הגדרות</button>
  <button type="button" id="bar-clear">נקה</button>
</div>
<div id="note" hidden></div>
<div id="shelf" hidden>
  <div class="card">
    <div class="media" id="shelf-media"></div>
    <div class="foot">
      <span id="shelf-name"></span>
      <a id="shelf-dl" download>הורדה</a>
    </div>
    <p class="hint" id="shelf-hint"></p>
  </div>
</div>''')

# ---------------------------------------------------------------- the format
# Everything downstream that asked the window how big it is now asks the format.
s = s.replace('innerWidth', 'FW').replace('innerHeight', 'FH')

sub('''<script type="module">
import * as THREE from 'three';
''',
'''<script type="module">
import * as THREE from 'three';

/* ---------- the format ----------
   The drawing surface used to be the window. Here it is a rectangle whose
   proportion comes from the typography that was uploaded, sat in the middle of
   the window with the room around it as bare table. FW/FH are that rectangle in
   CSS pixels — every place that used to read innerWidth/innerHeight reads these
   instead, which is the whole of what makes the tool work inside a format
   rather than inside a browser window. */
const FRAME = document.getElementById('frame');
const FMT = { w: 1080, h: 1350 };        // the format at its own resolution
let FW = 1080, FH = 1350;                // and as it sits on screen, CSS px
/* The top inset is deeper than the other three on purpose: the export bar lives
   up there, and it has to be table rather than picture. Nothing is allowed to
   sit over the composition. Top rather than bottom because the bottom of this
   page is not always on screen — see #bar in the stylesheet. */
function layoutFrame() {
  const padX = 30, padTop = 62, padBottom = 30;
  const availW = window.innerWidth - padX * 2;
  const availH = window.innerHeight - padTop - padBottom;
  const s = Math.min(availW / FMT.w, availH / FMT.h);
  FW = Math.max(120, Math.round(FMT.w * s));
  FH = Math.max(120, Math.round(FMT.h * s));
  FRAME.style.width = FW + 'px';
  FRAME.style.height = FH + 'px';
  FRAME.style.left = Math.round((window.innerWidth - FW) / 2) + 'px';
  FRAME.style.top = Math.round(padTop + (availH - FH) / 2) + 'px';
}
layoutFrame();
''')

# the pointer now speaks in format coordinates, not window coordinates
sub('''function toWorld(x, y) { return { x: (x - FW / 2) * VIEW, y: -(y - FH / 2) * VIEW }; }''',
'''function toWorld(x, y) { return { x: (x - FW / 2) * VIEW, y: -(y - FH / 2) * VIEW }; }

/* The hand draws in the format's own pixels. The canvas is no longer pinned to
   the window, so a client coordinate has to lose the frame's offset first — and
   the whole shape pipeline downstream is written in these coordinates. */
function ptr(e) {
  const r = dc.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}''')

sub('''  drawing = true; pts = [{ x: e.clientX, y: e.clientY }];''',
'''  drawing = true; pts = [ptr(e)];''')
sub('''  const p = { x: e.clientX, y: e.clientY }, last = pts[pts.length - 1];''',
'''  const p = ptr(e), last = pts[pts.length - 1];''')

# the drawing-buffer size the screen-space decal is addressed in
sub('''  const pr = Math.min(devicePixelRatio, 2);
  makeTargets(w * pr, h * pr);
}''',
'''  const pr = Math.min(devicePixelRatio, 2);
  makeTargets(w * pr, h * pr);
  // the typography decal is addressed in drawing-buffer pixels; see typeDecal()
  renderer.getDrawingBufferSize(typeUniforms.uTypeRes.value);
}''')

# ---------------------------------------------------------------- the decal
sub('''function limboGround() {''',
'''/* ---------- typography that lies ON the backdrop ----------

   The layer behind the shapes could have been a plane hung in front of the
   cove, and that is where this started. It does not work, and the reason is the
   shadow: a shadow cast onto a plane at one depth lands somewhere else than the
   same shadow cast onto the ground behind it, so a shadow crossing a letter
   jumps sideways at the letter's edge. Turning the shadow off on the letters is
   worse — the shadow then disappears behind them.

   So the typography is not an object at all. It is the backdrop's own colour,
   swapped in per pixel: ink printed on the paper rather than paper held in
   front of paper. The camera is orthographic, so addressing it in screen space
   costs nothing in accuracy and buys the one thing a plane cannot have — the
   letters sit exactly in the plane that catches the shadow, so every shadow and
   every bit of occlusion crosses them without a seam.

   The colour is sampled through an inverse of the tone mapper (see calibrate),
   which is why the map holds albedo and not the colour anyone chose.

   uTypeOn is switched off around the mirror and gel passes: both render the
   scene at a size of their own, and gl_FragCoord over the wrong resolution
   would smear the typography into the chrome. */
const typeUniforms = {
  uTypeMap:  { value: null },
  uTypeRes:  { value: new THREE.Vector2(1, 1) },
  uTypeOn:   { value: 0 },
  uTypeGain: { value: 2 }
};
let typeWanted = 0;      // what uTypeOn goes back to after a pass that hides it
function typeDecal(mat) {
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = shader => {
    if (prev) prev(shader);
    Object.assign(shader.uniforms, typeUniforms);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform sampler2D uTypeMap;
        uniform vec2 uTypeRes;
        uniform float uTypeOn, uTypeGain;
        vec3 inkToLinear(vec3 c) {
          return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), c));
        }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        if (uTypeOn > 0.5) {
          vec2 tuv = gl_FragCoord.xy / uTypeRes;
          vec4 ink = texture2D(uTypeMap, tuv);
          diffuseColor.rgb = mix(diffuseColor.rgb, inkToLinear(ink.rgb) * uTypeGain, ink.a);
        }`);
  };
}

function limboGround() {''')

sub('''    color: 0xf7f5ef, roughness: 0.97, metalness: 0, emissive: 0x14130f''',
'''    /* No emissive here, where the drawing tool has a little. The backdrop
       colour is now chosen and then SOLVED for (see calibrate), and light this
       surface makes rather than receives is light the solve cannot see — it
       would put a floor under every dark colour and shift every other one. */
    color: 0xf7f5ef, roughness: 0.97, metalness: 0, emissive: 0x000000''')

sub('''  gelReceiver(m);
  return mesh;''',
'''  gelReceiver(m);
  typeDecal(m);
  return mesh;''')

# ---------------------------------------------------------- the ground, refitted
sub('''function placeCove(halfW, halfH) {
  frameHalf = { w: halfW, h: halfH };
  const s = Math.max(halfW, halfH);
  cove.rotation.x = -0.42;             // tips the ground's normal up toward the camera
  cove.scale.set(s * 22, s * 22, 1);   // every edge well outside the frame
  cove.position.set(0, -s * 0.05, -s * groundDist);
}''',
'''/* The distance was measured off the LONGER side of the window, and in a window
   that is roughly a portrait phone that is close enough to the shorter one that
   nothing ever showed. A format is not a window: it can be 16:9, and then the
   two are different by a factor of two.

   It matters because of where a cast shadow lands. The lamp sits at 24.8
   degrees and the ground is tipped up towards the camera, so a body drops its
   shadow about 0.88 of the ground's distance BELOW itself on screen. Measured
   in a 1212x682 format: the ground was 1363 back, so the shadow fell 533 below
   a body whose frame only reaches 341 — the whole picture came back with no
   shadow in it anywhere, on a backdrop measuring dead flat at every point.

   So the distance comes off the SHORTER half-extent, which is the one that says
   how much room a shadow has to fall into. A shadow then lands at 0.88 of the
   half-height in any proportion, which is where it landed in the window this
   was tuned in.

   Second job, in tension with the first: the ground has to stay behind
   everything. Close it up and a body reaching back — or swinging back as the
   pile turns — tears through it. So the distance is a floor and not a setting:
   it retreats, per frame, exactly as far as the pile makes it, and no further.
   In an ordinary composition it never moves at all. */
function placeCove(halfW, halfH) {
  frameHalf = { w: halfW, h: halfH };
  const s = Math.max(halfW, halfH);
  const d = Math.min(halfW, halfH);
  cove.rotation.x = -0.42;             // tips the ground's normal up toward the camera
  cove.scale.set(s * 22, s * 22, 1);   // every edge well outside the frame
  /* The clearance is measured over the WHOLE TURN, not over where the pile
     happens to be pointing this frame — and that is a flicker fix, not a
     refinement. Reading each body's current world z and following it made the
     ground creep forward and back as the sculpture rotated, because a body
     swinging towards the camera relieves the clearance and a body swinging away
     demands it. The ground moved every frame, the cast shadow moved with it, and
     the whole backdrop shimmered. Reported as "it flickers a little".

     Under a turn about Y, a body at (x, z) from the pivot sweeps a circle of
     radius hypot(x, z), so the furthest back it can EVER reach is that radius
     plus its own. That number does not depend on the angle, so the ground is
     placed once for the composition and then holds still until a shape is
     added to it. */
  let reach = 0;
  const p = new THREE.Vector3();
  for (const b of bodies) {
    b.mesh.getWorldPosition(p);
    p.sub(world.position);
    reach = Math.max(reach, Math.hypot(p.x, p.z) + b.radius * 1.15);
  }
  const wanted = -d * groundDist;
  const needed = world.position.z - reach - Math.max(90, d * 0.35);
  cove.position.set(0, -d * 0.05, Math.min(wanted, needed));
}''')

# ------------------------------------------------- the coloured shadow: UPSTREAM NOW
# This file used to carry version 11's fix — the stain multiplies, it does not
# add — because version 12 shipped without it and the typography here IS the
# backdrop's colour, so a term that adds light to the floor adds it to the
# letters. Versions 13 and 14 took that fix in and then went further than it:
# the clamp on coverage is a saturating exponential (uGelDeep is the ceiling it
# approaches, and 1 - exp is Beer-Lambert, which is the curve the thing being
# modelled actually has), and the lamp's term and the dome's are no longer the
# same question (uGelSky). Re-applying the old patch on top of the better one
# would be a downgrade, so the four replacements that did it are gone.
#
# One thing did not survive the upgrade: uGelKnee. Its job — stop the blurred
# tail, which is nearly all of the patch's area, from being multiplied into a
# wash across the poster — is now shared between the exponential and the
# ceiling. The shadow dial in compose_tail.js therefore moves uGelDeep as its
# third term instead of the knee. THIS IS THE ONE PLACE THE REBUILD CHANGES WHAT
# HADAR APPROVED, and it wants her eye on it rather than a measurement alone.


# ---------------------------------------------------------------- material draw
sub('''const bodies = [];
let matIndex = Math.floor(Math.random() * MATERIALS.length);
let SEED_PIN = null, seedTick = 0;''',
'''const bodies = [];

/* Which material a body arrives as is drawn, not ordered.

   It used to walk the list from a random start, which is random exactly once:
   after two bodies you can name every one that follows. So it is drawn — but
   drawn from a BAG rather than freshly from the whole list each time, because
   independent draws clump, and a clump here is the same profile twice running,
   which stops reading as chance and starts reading as a decision. The bag holds
   every profile once, shuffled; when it empties it is refilled and reshuffled,
   and the refill is nudged if it would put the same profile on both sides of
   the seam. No order, nothing repeated back to back, nothing left out for long. */
let matBag = [];
let matLast = -1;
function nextMaterial() {
  if (!matBag.length) {
    matBag = MATERIALS.map((_, i) => i);
    for (let i = matBag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = matBag[i]; matBag[i] = matBag[j]; matBag[j] = t;
    }
    // the one place a shuffle can still repeat: the join between two bags
    const end = matBag.length - 1;
    if (end > 0 && matBag[end] === matLast) {
      const k = Math.floor(Math.random() * end);
      const t = matBag[end]; matBag[end] = matBag[k]; matBag[k] = t;
    }
  }
  matLast = matBag.pop();
  return matLast;
}
let SEED_PIN = null, seedTick = 0;''')

sub('''  const M = MATERIALS[forcedMat >= 0 ? forcedMat : matIndex % MATERIALS.length];
  if (forcedMat < 0) matIndex++;''',
'''  const M = MATERIALS[forcedMat >= 0 ? forcedMat : nextMaterial()];''')

# ---------------------------------------------------------------- frame split
sub('''function frame(now) {
  const dt = Math.min(0.05, (now - prev) / 1000); prev = now;
  idle += dt;''',
'''function frame(now) {
  const dt = Math.min(0.05, (now - prev) / 1000); prev = now;
  /* An export drives the same passes itself, on a rotation and a clock of its
     own. The live loop stands aside for the length of one, rather than being
     torn down and rebuilt around it. */
  if (exporting) { requestAnimationFrame(frame); return; }
  idle += dt;''')

sub('''  world.rotation.y += spinVel * dt;
  repivot();

  const tSec = now * 0.001;''',
'''  world.rotation.y += spinVel * dt;
  repivot();
  animateBodies(now);
  drawPasses();
  requestAnimationFrame(frame);
}

/* Split out of frame() so an export can call it with a clock that does not
   move. A turn has to close on itself to loop, and the breathing here is built
   out of periods that deliberately never come round together — so during an
   export time is held still and the rotation is the only thing left alive. */
function animateBodies(now) {
  const tSec = now * 0.001;''')

sub('''  }
  /* Every frame. It ran at one in four to save the six renders a cube costs, on''',
'''  }
}

function drawPasses() {
  /* Every frame. It ran at one in four to save the six renders a cube costs, on''')

sub('''  RIM.dir.copy(key.position).normalize().transformDirection(camera.matrixWorldInverse);
  updateMirror();
  renderGel();
  renderAO();
  renderGlassLayers();
  renderer.render(scene, camera);
  compositeAO();
  // after the composite, so what is read back is the finished picture and not
  // the pass before the occlusion is laid over it
  if (bgSolveLeft > 0) solveBackdrop();
  requestAnimationFrame(frame);
}''',
    '''  // the ground now follows the pile as well as the frame; see placeCove
  placeCove(frameHalf.w, frameHalf.h);
  RIM.dir.copy(key.position).normalize().transformDirection(camera.matrixWorldInverse);
  /* Both of these render the scene into a target of their own size, and the
     decal is addressed in drawing-buffer pixels — so it has to be off while
     they run or the typography arrives smeared across the chrome. */
  typeUniforms.uTypeOn.value = 0;
  updateMirror();
  renderGel();
  typeUniforms.uTypeOn.value = typeWanted;
  renderAO();
  renderGlassLayers();
  renderer.render(scene, camera);
  compositeAO();
  /* AND NOT solveBackdrop(), which the drawing tool added in version 13 and
     which this tool must not run. Both files solve the backdrop's colour by
     rendering and reading back, but they solve different things: upstream reads
     ONE PIXEL at 3% by 5% of the frame and walks FLOOR_BASE towards the target,
     while calibrate() here reads a seven-point albedo ramp and inverts the film
     analytically. Two loops writing the same FLOOR_BASE would fight, and the
     single pixel is the worse reader of the two here anyway — at 3%, 5% of a
     format it may well land inside a letter, and the typography is the
     backdrop's own colour, so the solver would chase the ink and drag the paper
     after it. bgSolveLeft stays at 0: setBackdrop is only reachable from the
     hidden swatch and from the bootstrap this build replaces. */
}''')

# ---------------------------------------------------------------- bootstrap
NEW = io.open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'compose_tail.js'), encoding='utf-8').read()

# The bootstrap is taken as a REGION rather than as a literal, because it is the
# one part of the file that changes for reasons that have nothing to do with this
# build — the opening paper, a note about it, whatever is being tried that day.
# Everything from the resize listener to the first frame request is the drawing
# tool starting itself up, and all of it is replaced. The endpoints are still
# asserted, so a rename fails loudly; only the prose between them may drift.
_i = s.index("addEventListener('resize', sizeUp);")
_j = s.index('requestAnimationFrame(frame);', _i) + len('requestAnimationFrame(frame);')
_boot = s[_i:_j]
assert s.count(_boot) == 1, 'the bootstrap region is not unique'
sub(_boot, NEW)

io.open(OUT, 'w', encoding='utf-8').write(s)
print('wrote', OUT, len(s), 'chars')

# A module that does not parse takes the whole page down and leaves nothing on
# screen to say so — the browser reports it to a console nobody has open. It has
# already happened once here, and from something this file cannot see coming: a
# pair of backticks inside a PROSE COMMENT, sitting inside a GLSL string that is
# itself a JS template literal. The comment closed the string.
import shutil, subprocess, tempfile
node = shutil.which('node')
if not node:
    print('  (node not found, skipped the syntax check)')
else:
    b = s.index('<script type="module">') + len('<script type="module">')
    body = s[b:s.rindex('</script>')].replace("import * as THREE from 'three';", '')
    with tempfile.NamedTemporaryFile('w', suffix='.mjs', encoding='utf-8', delete=False) as f:
        f.write(body); path = f.name
    try:
        r = subprocess.run([node, '--check', path], capture_output=True, text=True)
    finally:
        os.unlink(path)
    if r.returncode:
        raise SystemExit('the built module does not parse:\n' + (r.stderr or r.stdout))
    print('  parses clean')
