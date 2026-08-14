/* ============================================================================
   COMPOSE — the format, the two typography layers, the colour behind the
   shapes, and the exports. Everything above this line is the drawing tool as
   version 12 left it.
   ============================================================================ */

const note = document.getElementById('note');
let noteTimer = 0;
function say(msg, hold) {
  clearTimeout(noteTimer);
  if (!msg) { note.hidden = true; return; }
  note.textContent = msg; note.hidden = false;
  if (hold) noteTimer = setTimeout(() => { note.hidden = true; }, hold);
}

/* Handing a file over, with the case where it cannot be handed over.

   A page inside a sandboxed frame may not be permitted to download anything,
   and the shared artifact is exactly that: the GIF button there did nothing at
   all, silently, which is the worst way for a thing to fail. So the download is
   still attempted — it works from a file or a server — and the result is ALSO
   put on the shelf, as a real <img> or <video>. Saving from the browser's own
   context menu is not the page's permission to lose. */
const shelf = document.getElementById('shelf');
const shelfMedia = document.getElementById('shelf-media');
let shelfURL = null;

function closeShelf() {
  shelf.hidden = true;
  shelfMedia.textContent = '';
  if (shelfURL) { URL.revokeObjectURL(shelfURL); shelfURL = null; }
}

function save(blob, name) {
  if (shelfURL) URL.revokeObjectURL(shelfURL);
  shelfURL = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = shelfURL; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();

  shelfMedia.textContent = '';
  let el;
  if (/\.mp4$/.test(name)) {
    el = document.createElement('video');
    el.controls = true; el.loop = true; el.autoplay = true; el.muted = true; el.playsInline = true;
  } else {
    el = document.createElement('img');
    el.alt = name;
  }
  el.src = shelfURL;
  shelfMedia.appendChild(el);
  document.getElementById('shelf-name').textContent =
    name + ' · ' + (blob.size / 1048576).toFixed(1) + 'MB';
  const dl = document.getElementById('shelf-dl');
  dl.href = shelfURL; dl.download = name;
  /* Inside a frame the download is not this page's to give, so the shared link
     is told the truth rather than left to discover it. Elsewhere the file has
     already arrived and this only says where. */
  document.getElementById('shelf-hint').innerHTML = framed
    ? 'בקישור המשותף הדפדפן לא נותן לעמוד לכתוב קבצים — <b>לחיצה ימנית על הקובץ ואז שמירה בשם</b>. Esc לסגירה.'
    : 'הקובץ ירד. אם לא — לחיצה ימנית עליו ואז שמירה בשם. Esc לסגירה.';
  shelf.hidden = false;
}
// a page in a frame it did not open is a page whose downloads may be refused
const framed = (() => { try { return window.top !== window.self; } catch (_) { return true; } })();
shelf.addEventListener('click', e => { if (e.target === shelf) closeShelf(); });
function stampName(ext) {
  const d = new Date(), p = n => String(n).padStart(2, '0');
  return 'intent-' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate())
       + '-' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds()) + '.' + ext;
}

/* ---------------------------------------------------------------------------
   COLOUR, SOLVED RATHER THAN SET

   A colour handed to a lit surface is not the colour that comes out of it. The
   backdrop is lit, and then ACES rolls the top of the scale off and sRGB
   encodes it, so #E4572E chosen in the picker arrives on screen as something
   paler and less saturated — which makes a colour picker a guessing game, and
   makes uploaded typography come out in colours nobody chose.

   So nothing here is set. It is solved. The whole chain from albedo to pixel is
   invertible: the tone mapper analytically, the lighting by measuring it. Two
   renders of the backdrop at two known albedos give, per channel, how much
   light reaches it (E) and how much it returns that has nothing to do with its
   colour (S, the specular sheen that survives even at albedo zero). After that,
   for any colour anyone asks for, the albedo that produces it is arithmetic.

   Measured rather than assumed, and the numbers are readable: window.devColour()
   reports E and S and round-trips a colour through the solve.

   What it cannot do: the lamp is to one side, so E falls off across the frame,
   and the solve is exact at the point it was measured — the middle — and drifts
   towards the edges. And a colour brighter than the lamp can carry is not
   reachable at any albedo; those clamp, and devColour reports it. --------- */

const ACES_IN  = [[0.59719, 0.35458, 0.04823],
                  [0.07600, 0.90834, 0.01566],
                  [0.02840, 0.13383, 0.83777]];
const ACES_OUT = [[ 1.60475, -0.53108, -0.07367],
                  [-0.10208,  1.10813, -0.00605],
                  [-0.00327, -0.07276,  1.07602]];
function mat3inv(m) {
  const [a, b, c] = m[0], [d, e, f] = m[1], [g, h, i] = m[2];
  const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g;
  const det = a * A + b * B + c * C;
  return [[A / det, -(b * i - c * h) / det,  (b * f - c * e) / det],
          [B / det,  (a * i - c * g) / det, -(a * f - c * d) / det],
          [C / det, -(a * h - b * g) / det,  (a * e - b * d) / det]];
}
const ACES_IN_INV = mat3inv(ACES_IN), ACES_OUT_INV = mat3inv(ACES_OUT);
const mul3 = (m, v) => [
  m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
  m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
  m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2]];

const sRGBtoLin = c => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
const linTosRGB = c => c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;

/* three's ACES fit, per channel: y = (v(v+0.0245786) - 0.000090537)
                                    / (v(0.983729v + 0.432951) + 0.238081)
   which is a quadratic in v once y is known. The positive root is the one on
   the curve; the other is the branch below zero. */
function fitInv(y) {
  const A = 1 - 0.983729 * y;
  const B = 0.0245786 - 0.432951 * y;
  const C = -(0.000090537 + 0.238081 * y);
  if (Math.abs(A) < 1e-7) return -C / B;
  const disc = Math.max(0, B * B - 4 * A * C);
  return (-B + Math.sqrt(disc)) / (2 * A);
}
/* display-linear (what the canvas holds before sRGB encoding) -> scene-linear */
function acesInv(rgb) {
  const k = renderer.toneMappingExposure / 0.6;
  return mul3(ACES_IN_INV, mul3(ACES_OUT_INV, rgb).map(fitInv)).map(v => v / k);
}

/* ---------- the one colour ACES will not give you ----------

   A filmic curve desaturates as it brightens: that is what it is FOR, and it is
   why nothing in this renderer blows out into a flat white dot. The price shows
   up here and nowhere else in the tool. Measured: #F2E400 asked for, #F1E478
   delivered — the blue channel needs a negative amount of light to stay at zero
   while red and green are that bright, and there is no such thing. A bright
   saturated colour is simply not in the set the film can print. Anything below
   about eighty per cent brightness lands exactly; the reds, blues and greys
   tested all came back within one byte.

   So the film stays on the backdrop by default, because the backdrop belongs in
   the same light as the sculpture standing on it. But it is a dial, not a
   decision: turn it off and the backdrop leaves the film, every sRGB colour
   becomes reachable exactly, and the shadow that falls on it hardens a little
   because nothing is rolling its shoulder off any more. When an exact brand
   colour matters more than that, this is the switch. */
let coveFilm = true;
const sceneFromDisplay = rgb => coveFilm ? acesInv(rgb) : rgb.slice();

window.tuneBackdropFilm = (on = true) => {
  coveFilm = !!on;
  cove.material.toneMapped = coveFilm;
  cove.material.needsUpdate = true;
  calibrate();
  setBackground(BG.hex);
  if (LAYERS.back) applyLayers();
  return { film: coveFilm, colour: devColour() };
};

/* One reading of the bare backdrop at a known albedo, at the middle of the
   format, in the same sRGB bytes a screenshot would hold — which means it is
   read off the finished picture, past the occlusion composite, and not off some
   cleaner render made for the purpose. A calibration taken anywhere other than
   where the answer will be looked at is a calibration for a different question. */
function readCove(albedo) {
  const colWas = cove.material.color.clone();
  const typeWas = typeUniforms.uTypeOn.value;
  const worldWas = world.visible;
  world.visible = false;                       // the pile is not what is being read
  typeUniforms.uTypeOn.value = 0;              // nor is the typography
  cove.material.color.setRGB(albedo, albedo, albedo);
  const pr = renderer.getPixelRatio();
  const w = Math.round(FW * pr), h = Math.round(FH * pr);
  exporting = true;
  try { drawPasses(); blit(w, h); } finally { exporting = false; }
  const d = capx.getImageData((w >> 1) - 2, (h >> 1) - 2, 5, 5).data;
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
  cove.material.color.copy(colWas);
  typeUniforms.uTypeOn.value = typeWas;
  world.visible = worldWas;
  return [r / n / 255, g / n / 255, b / n / 255];
}

/* A straight line through two readings was the first try, and it lands about
   two per cent out — enough to turn a warm off-white into a neutral grey, which
   is precisely the kind of error a flat field shows and nothing else does. The
   lighting is not linear in albedo: the standard material's multi-scatter
   compensation puts a gentle bend in it. So the response is not modelled, it is
   TABULATED — a ramp of albedos, read back, and inverted by interpolation. Per
   channel, because light arrives warm here and each channel has its own scale;
   the cross-channel part of the chain lives in the tone mapper and is already
   handled exactly by acesInv. */
const CAL_RAMP = [0.06, 0.18, 0.34, 0.55, 0.82, 1.18, 1.65];
let RESP = null;                                // { a: [...], L: [[r,g,b], ...] }
function calibrate() {
  const L = CAL_RAMP.map(a => acesInv(readCove(a).map(sRGBtoLin)));
  RESP = { a: CAL_RAMP.slice(), L };
  return RESP;
}

/* Read the table backwards: given the light this channel has to return, the
   albedo that returns it. Outside the ramp it extends the end segment, which is
   how a colour brighter than the backdrop can carry still gets a number. */
function albedoOne(ch, want) {
  const A = RESP.a, T = RESP.L;
  const n = A.length;
  let i = 0;
  if (want <= T[0][ch]) i = 0;
  else if (want >= T[n - 1][ch]) i = n - 2;
  else { while (i < n - 2 && want > T[i + 1][ch]) i++; }
  const l0 = T[i][ch], l1 = T[i + 1][ch];
  const t = (want - l0) / (Math.abs(l1 - l0) < 1e-6 ? 1e-6 : l1 - l0);
  return Math.max(0, A[i] + t * (A[i + 1] - A[i]));
}

/* The albedo that renders as this colour. rgb255 is plain sRGB — the numbers
   off a colour picker, or out of a PNG. */
function albedoFor(rgb255) {
  const want = acesInv(rgb255.map(v => sRGBtoLin(v / 255)));
  if (!RESP) return want;                       // before the first render: honest fallback
  return [0, 1, 2].map(i => albedoOne(i, want[i]));
}

window.devColour = (hex) => {
  if (!RESP) calibrate();
  const c = hex ? hexRGB(hex) : hexRGB(BG.hex);
  const a = albedoFor(c);
  return {
    ramp: RESP.a,
    // light returned per unit of the ramp, per channel: the warm lamp shows here
    response: RESP.L.map(v => v.map(x => +x.toFixed(3))),
    asked: c, albedo: a.map(v => +v.toFixed(3)),
    // past the gain the ink map has to clamp; the background can go beyond freely
    beyondInkRange: a.some(v => v > typeUniforms.uTypeGain.value)
  };
};

function hexRGB(hex) {
  const h = String(hex).replace('#', '').trim();
  const n = h.length === 3 ? h.split('').map(c => c + c).join('') : h.slice(0, 6);
  const v = parseInt(n, 16) || 0;
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

/* ---------- how deep the shadow goes ----------

   Nothing here is broken and the numbers say so: measured against version 12 on
   the same five bodies in the same window, the cast shadow at the foot of the
   frame keeps 0.869 of the light here against 0.873 there. Identical.

   What changed is that you can SEE it. Version 12 put the ground far enough back
   that the shadow landed outside the picture entirely — the tool was not showing
   a lighter shadow, it was showing none — and this one had to bring the ground
   close so a format could contain its own shadow. A shadow that was always this
   deep is simply in the frame now.

   So it gets a dial, because how deep it should be is a decision about the
   picture and not a fact about the renderer. It works on the FILL rather than
   on the lamp: a shadow is the part of the backdrop the lamp cannot reach, so
   what is left there is ambient light alone, and raising the ambient lifts the
   shadow without touching how the bodies are modelled. The chosen colour does
   not drift, because the solve simply re-derives a lower albedo against the
   brighter room — which is the whole reason the colour is solved and not set. */
let coveFill = 1;
window.tuneShadow = (v = {}) => {
  if (v.fill !== undefined) {
    coveFill = Math.max(0.2, Math.min(6, v.fill));
    cove.material.envMapIntensity = coveFill;
  }
  if (v.dist !== undefined) { state.dist = Math.max(0.8, Math.min(4, v.dist)); }
  /* The occlusion belongs on this dial too, and it is the term that changed
     most. Its radius is in screen pixels, and version 12 kept the ground so far
     behind the pile that no ground pixel was ever within reach of one — so the
     contact darkening existed only between bodies. Bringing the ground close
     enough to catch the shadow brought it inside that radius as well, and a
     second, tighter darkening appeared around every silhouette that nobody had
     seen before. That is the part that reads as a blob. */
  if (v.ao !== undefined) { state.ao = Math.max(0, Math.min(1, v.ao)); }
  if (v.aoRange !== undefined) { state.aor = Math.max(10, Math.min(110, v.aoRange)); }
  calibrate();
  applyState();
  setBackground(BG.hex);
  if (LAYERS.back) applyLayers();
  return { fill: coveFill, dist: state.dist, ao: state.ao, aoRange: state.aor };
};

/* The paper the tool opens on. Chosen by eye and given as three numbers —
   248, 247, 242 — on 13 Aug 26; it is a default and not a decision, and the
   swatch on the bar or the field in the card moves it anywhere. It is written
   HERE and not only in the markup: statePins() pushes this one value into all
   three controls at boot, so this is the single place the opening paper lives.

   It is also near the top of what the room can deliver — see the note on the
   ceiling in setBackground's neighbourhood — so it is worth reading the
   measured value back rather than assuming the number arrives intact. */
const BG = { hex: '#f8f7f2' };
function setBackground(hex) {
  BG.hex = hex;
  const a = albedoFor(hexRGB(hex));
  FLOOR_BASE.setRGB(a[0], a[1], a[2]);
  applyState();                                 // which is what pushes it to the cove
}

/* ---------------------------------------------------------------------------
   THE TWO LAYERS

   Behind: the backdrop's own colour, per pixel — see typeDecal(). The map it
   samples does not hold the picture. It holds, per pixel, the albedo that makes
   that pixel come out the colour it is, divided by uTypeGain so that colours
   needing more reflectance than paper has still fit in eight bits.

   In front: an <img> lying over the canvas. Nothing is in front of it to light
   it or cast on it, so putting it in the scene would buy nothing and cost its
   exact colour. It is composited into the exports by hand.
   --------------------------------------------------------------------------- */

const flayer = document.getElementById('flayer');
const LAYERS = { back: null, front: null };     // the HTMLImageElements as loaded

function inkTexture(img) {
  const c = document.createElement('canvas');
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, c.width, c.height), p = d.data;
  const gain = typeUniforms.uTypeGain.value;
  // typography is a handful of colours over a great many pixels
  const seen = new Map();
  for (let i = 0; i < p.length; i += 4) {
    if (p[i + 3] === 0) continue;
    const key = (p[i] << 16) | (p[i + 1] << 8) | p[i + 2];
    let v = seen.get(key);
    if (v === undefined) {
      v = albedoFor([p[i], p[i + 1], p[i + 2]])
        .map(t => Math.round(255 * linTosRGB(Math.min(1, t / gain))));
      seen.set(key, v);
    }
    p[i] = v[0]; p[i + 1] = v[1]; p[i + 2] = v[2];
  }
  x.putImageData(d, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace;            // the patch decodes it itself
  t.anisotropy = MAX_ANISO;
  t.needsUpdate = true;
  return t;
}

function applyLayers() {
  if (LAYERS.back) {
    const old = typeUniforms.uTypeMap.value;
    typeUniforms.uTypeMap.value = inkTexture(LAYERS.back);
    if (old) old.dispose();
    typeWanted = 1;
  } else {
    typeWanted = 0;
  }
  typeUniforms.uTypeOn.value = typeWanted;

  if (LAYERS.front) {
    flayer.src = LAYERS.front.src;
    flayer.style.display = 'block';
  } else {
    flayer.removeAttribute('src');
    flayer.style.display = 'none';
  }
}

/* ---------------------------------------------------------------------------
   EXPORT

   A still is the canvas with the front layer laid over it. A turn is the same
   thing, once round, with the clock held still so that the last frame is the
   frame before the first one and the loop closes without a seam.

   Video records in real time, because MediaRecorder stamps what it is given by
   the wall clock and nothing else: so the rotation is driven by the wall clock
   too. However fast the machine happens to render, the file is exactly the
   asked-for length and exactly one turn. The GIF is the opposite — it is
   encoded here, frame by frame, so it is rendered as fast as it can be and the
   delays are written in afterwards.
   --------------------------------------------------------------------------- */

let exporting = false;
/* HOW LONG A TURN TAKES IS NOT A SETTING (13 Aug 26). It had a field in the
   card and the field came out: the period is a property of the movement, the
   same eight seconds every time, and the only thing anyone actually decides is
   how long the file is. Two numbers where one is a decision is a card that asks
   the reader to work out the relationship between them.

   It stays a variable rather than becoming a literal because two exports read
   it — the MP4's period and the GIF's whole length — and because it is worth
   being able to try another period from the console without a rebuild. */
const TURN = { secs: 8 };
/* How long the FILE is, which is not how long a turn is. Fifteen seconds
   because that is a story, and a story plays once — see the note on turn(). */
const VID = { secs: 15 };

const cap = document.createElement('canvas');
const capx = cap.getContext('2d', { willReadFrequently: true });

/* The composite has to happen in the same turn of the event loop as the render
   that fed it: without preserveDrawingBuffer the canvas is only readable until
   the browser composites it away. */
function sizeCap(w, h) {
  if (cap.width !== w || cap.height !== h) { cap.width = w; cap.height = h; }
}
function blit(w, h) {
  sizeCap(w, h);
  capx.drawImage(renderer.domElement, 0, 0, w, h);
  if (LAYERS.front) capx.drawImage(flayer, 0, 0, w, h);
}

const raf = () => new Promise(r => requestAnimationFrame(r));

/* Turns, stepped by hand. `onFrame` is called with the canvas already
   composited into `cap`.

   HOW LONG A TURN TAKES AND HOW LONG THE FILE IS ARE TWO DIFFERENT QUESTIONS,
   and they used to be one. The rotation was spread over however many frames the
   file had, so asking for a longer file did not add turns — it slowed the one
   turn down. They are separate now: `perTurn` is the period, `n` is the length,
   and the file simply keeps turning until it has enough frames.

   A file that is not a whole number of turns does not loop, and that is a real
   choice rather than an oversight: 15 seconds of an 8-second turn is 1.875
   turns, and the last frame does not meet the first. For a story, which plays
   once and then stops, that costs nothing. For anything that loops, ask for a
   multiple of the turn. */
async function turn(n, onFrame, perTurn = n) {
  const rot0 = world.rotation.y, lockWas = SPIN_LOCK, spinWas = spinning;
  exporting = true; SPIN_LOCK = true; spinning = false; spinVel = 0;
  // far enough ahead that every body has finished arriving, and then still
  const clock = performance.now() + 1e6;
  try {
    for (let i = 0; i < n; i++) {
      world.rotation.y = rot0 + (i / perTurn) * Math.PI * 2;
      repivot();
      animateBodies(clock);
      drawPasses();
      await onFrame(i);
    }
  } finally {
    world.rotation.y = rot0;
    repivot();
    SPIN_LOCK = lockWas; spinning = spinWas; exporting = false;
  }
}

/* ---------- the export is the FORMAT's resolution, not the window's ----------

   It used to be the window's, and that is worth stating plainly because it was
   invisible: the frame is laid out to fit whatever room the browser gives it,
   the renderer draws at that size, and `blit` only STRETCHES the finished canvas
   to whatever number it is handed. So a 1080×1350 format on a small window came
   out 964×1206, and asking for 1080 wide would not have helped — it would have
   upscaled a smaller picture. The size of the uploaded PNG is the size of the
   work; the window is just how much of a desk there happens to be.

   So the drawing buffer is grown for the length of the export by raising the
   renderer's pixel ratio, and put back afterwards. The CSS size never changes,
   so nothing moves on screen.

   IT DOES NOT CHANGE THE PICTURE, and that had to be checked rather than hoped
   for, because this tool is full of things measured in pixels. The occlusion is
   the one that would have shown: `uRadius` is 46, which reads like pixels — but
   it is spent in VIEW space (`P + TBN * h * uRadius`), so it is a distance in
   the scene and not on the screen, and a denser buffer only samples it better.
   The gel and the glass layers render into targets of their own size and are
   sampled by uv, which is likewise unitless. Verified by measurement rather than
   by reading: the same still at both scales, compared pixel by pixel.

   Bounded on both sides: never below what the window already gives — an export
   should not be worse than the preview — and never past 4096, which is the
   texture limit worth respecting even where the driver would allow more. */
const EXPORT_MAX = 4096;
/* Hands the callback the size the file should be and the scale that renders it.
   THE HEIGHT COMES FROM THE FORMAT'S RATIO AND NOT FROM THE FRAME'S, which is a
   single pixel and worth the line: FW and FH are the frame rounded to whole CSS
   pixels, so their ratio is only nearly the format's, and multiplying FH by the
   scale produced 1080×1351 for a format that is 1080×1350. A file whose height
   is one off is a file that is not the thing that was asked for. */
/* SUPERSAMPLING — the file keeps its size and gets its edges back.

   Rendering at the output size means one sample per pixel, and a silhouette
   crossing a pixel has to choose: the edge of a body against pale paper comes
   out stepped, and in a video those steps crawl along the outline as the pile
   turns, which reads as noise rather than as an edge. Rendering at twice the
   width and letting the blit resolve it down gives every output pixel the
   average of four — the file has exactly the same number of pixels and the
   same weight, and the edges stop stepping.

   It costs four times the pixels PER FRAME, which a still does not notice and a
   450-frame video certainly does. It is bounded rather than assumed: if twice
   the width would pass the texture limit, the factor comes down until it fits,
   so a large format quietly gets less of it instead of failing. */
let SS = 2;
/* A handle rather than a constant, because the cost is real: four times the
   pixels per frame is nothing for a still and is felt across a 450-frame video.
   tuneExport({ss: 1}) turns it off for a quick draft, {ss: 2} puts it back. */
window.tuneExport = (v = {}) => {
  if (v.ss !== undefined) SS = Math.max(1, Math.min(3, v.ss));
  return { ss: SS };
};
async function atFormatScale(targetW, fn, ss = SS) {
  const prWas = renderer.getPixelRatio();
  /* EXPORT_MAX IS A CEILING ON THE ASKED-FOR WIDTH, NOT A RATIO APPLIED TO IT.
     It was the second, and it double-counted: a 5000px format asking for a
     1080-wide video — already capped for a phone — was scaled AGAIN by
     4096/5000 and came out 886. A limit that has not been reached must do
     nothing at all. Both sides are checked, since it is the long one that meets
     the texture limit first. */
  const w = Math.max(2, Math.round(Math.min(targetW, EXPORT_MAX, EXPORT_MAX * FMT.w / FMT.h)));
  const h = Math.max(2, Math.round(w * FMT.h / FMT.w));
  // whatever multiple of the output still fits under the limit, and never less
  // than 1 — an export is not allowed to come out below its own resolution
  const fit = Math.max(1, Math.min(ss, EXPORT_MAX / w, EXPORT_MAX / h));
  const k = Math.max(prWas, (w * fit) / FW);
  if (Math.abs(k - prWas) < 0.01) return await fn({ w, h, ss: prWas * FW / w });
  renderer.setPixelRatio(k);
  sizeUp();
  try { return await fn({ w, h, ss: fit }); } finally { renderer.setPixelRatio(prWas); sizeUp(); }
}

/* THE STILL GOES THROUGH turn() TOO, AND THAT IS A FIX RATHER THAN TIDINESS.
   It used to call drawPasses on whatever the live loop had left, so two stills
   of the same composition, taken seconds apart, were not the same picture: the
   bodies breathe on a running clock. It showed up while comparing one sampling
   setting against another — the two exports differed by ten levels on average
   and by 89 at worst, none of which was sampling. turn(1) freezes the clock the
   way the video already does and leaves the angle where it was, so a still is
   now repeatable and matches the video frame at the same angle. */
async function exportStill() {
  await atFormatScale(FMT.w, async ({ w, h, ss }) => {
    await turn(1, async () => { blit(w, h); });
    cap.toBlob(b => { save(b, stampName('png'));
      say('נשמר PNG · ' + w + '×' + h + ' · דגימה ×' + ss.toFixed(1), 2800); }, 'image/png');
  });
}

/* ---------- MP4, written out here ----------

   The first version recorded the canvas with MediaRecorder, which is the short
   way and cannot do this job. MediaRecorder stamps frames by the wall clock, so
   the rotation had to be driven by the wall clock too — and then whatever the
   encoder has not swallowed by the time the turn ends is simply lost. Measured:
   two seconds asked for, a 1.667-second file delivered. That is sixty degrees
   of rotation missing from the end, and a loop that is missing its last sixty
   degrees is not a loop, it is a jump.

   So the frames are encoded by hand instead. WebCodecs takes each rendered
   frame with a timestamp this file decides, so the turn is exactly N frames of
   exactly one Nth of a circle, the file is exactly the asked-for length however
   slow the machine is, and the frame after the last one is the first one. The
   muxer below is the price of that, and it is a small price: one video track,
   one chunk, no editing, no B-frames to reorder. */

const u32 = v => [(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255];
const u16 = v => [(v >> 8) & 255, v & 255];
const chars = s => [...s].map(c => c.charCodeAt(0));

function box(type, ...parts) {
  let n = 8;
  const flat = parts.map(p => p instanceof Uint8Array ? p : Uint8Array.from(p));
  for (const p of flat) n += p.length;
  const out = new Uint8Array(n);
  out.set(u32(n), 0); out.set(chars(type), 4);
  let at = 8;
  for (const p of flat) { out.set(p, at); at += p.length; }
  return out;
}
const join = arr => {
  let n = 0; for (const a of arr) n += a.length;
  const out = new Uint8Array(n);
  let at = 0; for (const a of arr) { out.set(a, at); at += a.length; }
  return out;
};
// the unit matrix every player expects to find and nothing here ever changes
const UNITY = [].concat(u32(0x10000), u32(0), u32(0), u32(0), u32(0x10000), u32(0),
                        u32(0), u32(0), u32(0x40000000));

function muxMP4(samples, avcC, w, h, fps) {
  const scale = fps * 1000, delta = 1000;          // any integer fps divides cleanly
  const n = samples.length, dur = n * delta;
  const mdat = box('mdat', join(samples.map(s => s.data)));
  const sizes = [].concat(...samples.map(s => u32(s.data.length)));
  const syncs = [];
  samples.forEach((s, i) => { if (s.key) syncs.push(...u32(i + 1)); });

  const avc1 = box('avc1',
    [0, 0, 0, 0, 0, 0], u16(1),                    // reserved, data reference index
    [0, 0, 0, 0], new Uint8Array(12),              // predefined / reserved
    u16(w), u16(h), u32(0x00480000), u32(0x00480000),
    u32(0), u16(1), new Uint8Array(32), u16(0x0018), [0xFF, 0xFF],
    box('avcC', avcC));

  const stbl = box('stbl',
    box('stsd', u32(0), u32(1), avc1),
    box('stts', u32(0), u32(1), u32(n), u32(delta)),
    syncs.length ? box('stss', u32(0), u32(syncs.length / 4), syncs) : new Uint8Array(0),
    box('stsc', u32(0), u32(1), u32(1), u32(n), u32(1)),
    box('stsz', u32(0), u32(0), u32(n), sizes),
    box('stco', u32(0), u32(1), u32(0)));         // patched once the size is known

  const moov = box('moov',
    box('mvhd', u32(0), u32(0), u32(0), u32(scale), u32(dur), u32(0x10000),
        u16(0x0100), u16(0), u32(0), u32(0), UNITY, new Uint8Array(24), u32(2)),
    box('trak',
      box('tkhd', [0, 0, 0, 7], u32(0), u32(0), u32(1), u32(0), u32(dur),
          u32(0), u32(0), u16(0), u16(0), u16(0), u16(0), UNITY,
          u32(w * 65536), u32(h * 65536)),
      box('mdia',
        box('mdhd', u32(0), u32(0), u32(0), u32(scale), u32(dur), u16(0x55C4), u16(0)),
        box('hdlr', u32(0), u32(0), chars('vide'), new Uint8Array(12), chars('INTENT\0')),
        box('minf',
          box('vmhd', [0, 0, 0, 1], u16(0), u16(0), u16(0), u16(0)),
          box('dinf', box('dref', u32(0), u32(1), box('url ', [0, 0, 0, 1]))),
          stbl))));

  const ftyp = box('ftyp', chars('isom'), u32(0x200),
                   chars('isom'), chars('iso2'), chars('avc1'), chars('mp41'));
  /* The chunk offset is a file offset, so it cannot be known until everything
     before the samples has been built. The layout is fixed — ftyp, then mdat —
     so it is found and written back rather than guessed at. */
  const at = ftyp.length + 8;
  for (let i = 0; i + 4 <= moov.length; i++) {
    if (moov[i] === 0x73 && moov[i + 1] === 0x74 && moov[i + 2] === 0x63 && moov[i + 3] === 0x6F) {
      moov.set(u32(at), i + 12);                   // past the type, the version and the count
      break;
    }
  }
  return new Blob([ftyp, mdat, moov], { type: 'video/mp4' });
}

async function pickCodec(w, h) {
  for (const codec of ['avc1.640034', 'avc1.4d0034', 'avc1.640028', 'avc1.4d0028', 'avc1.42001f']) {
    try {
      const s = await VideoEncoder.isConfigSupported({
        codec, width: w, height: h, bitrate: 16e6, framerate: 30, avc: { format: 'avc' }
      });
      if (s.supported) return codec;
    } catch (_) {}
  }
  return null;
}

async function exportVideo() {
  if (!window.VideoEncoder) { say('הדפדפן הזה לא מקודד וידאו — נסי GIF', 3600); return; }
  const fps = 30;
  const perTurn = Math.max(8, Math.round(TURN.secs * fps));
  const n = Math.max(8, Math.round(VID.secs * fps));
  /* THE FORMAT'S RESOLUTION, THEN A PHONE-SIZED CEILING ON TOP OF IT.

     The size comes from the uploaded PNG — see atFormatScale — and then a video
     gets one limit a still does not: nothing on a phone can show more than
     1920 on the long side and 1080 on the short, so past that the file only
     gets heavier. The cap is applied to the FORMAT before the render is scaled
     to it, so a 3000px format renders at 1080 wide rather than rendering at
     3000 and being thrown away in the resize. Below the cap it does nothing. */
  const capK = Math.min(1, 1920 / Math.max(FMT.w, FMT.h), 1080 / Math.min(FMT.w, FMT.h));
  const targetW = Math.max(2, Math.round(FMT.w * capK));
  /* AND THE BITRATE FOLLOWS THE PIXELS INSTEAD OF BEING A CONSTANT. It was a
     flat 16 Mb/s, which is roughly three times what this content needs at this
     size and turns a 15-second story into some 30MB for no visible gain: the
     picture is a smooth backdrop with a few bodies on it, which is the easiest
     thing in the world for an encoder. About 0.12 bits per pixel per frame is
     where more stops showing on a phone — 1080×1350 at 30fps lands near
     5.2 Mb/s — with a floor so a small format still gets a clean file and a
     ceiling so a large one cannot run away.

     THE FLOOR IS LOW ON PURPOSE. It was 4.5 Mb/s, which is right for a poster
     format and absurd for a small one: a 400×400 loop asks for about 0.6 Mb/s
     by the same formula, and holding it at 4.5 would spend seven times the
     bytes on a picture with nowhere to put them. The floor exists to stop a
     tiny format being starved, not to hand it a poster's budget. */
  await atFormatScale(targetW, async ({ w: fw, h: fh, ss }) => {
  const w = Math.round(fw / 2) * 2, h = Math.round(fh / 2) * 2;   // even, for h264
  const bitrate = Math.round(Math.min(14e6, Math.max(1.5e6, w * h * fps * 0.12)));
  const codec = await pickCodec(w, h);
  if (!codec) { say('אין קודק H.264 זמין — נסי GIF', 3600); return; }

  const samples = [];
  let avcC = null, failed = null;
  const enc = new VideoEncoder({
    output: (chunk, meta) => {
      if (meta && meta.decoderConfig && meta.decoderConfig.description && !avcC) {
        avcC = new Uint8Array(meta.decoderConfig.description);
      }
      const data = new Uint8Array(chunk.byteLength);
      chunk.copyTo(data);
      samples.push({ data, key: chunk.type === 'key' });
    },
    error: e => { failed = e; }
  });
  /* realtime, and not for the latency: it is what keeps the encoder from
     reordering frames into B-pictures. The muxer below writes no composition
     offsets, so decode order has to be presentation order. */
  enc.configure({ codec, width: w, height: h, bitrate, framerate: fps,
                  avc: { format: 'avc' }, latencyMode: 'realtime' });

  try {
    await turn(n, async (i) => {
      blit(w, h);
      const frame = new VideoFrame(cap, { timestamp: Math.round(i * 1e6 / fps),
                                          duration: Math.round(1e6 / fps) });
      enc.encode(frame, { keyFrame: i % (fps * 2) === 0 });
      frame.close();
      say('מקודד… ' + (i + 1) + '/' + n);
      await raf();
    }, perTurn);
    await enc.flush();
  } finally {
    try { enc.close(); } catch (_) {}
  }
  if (failed) { say('הקידוד נכשל: ' + failed.message, 5000); return; }
  if (!avcC) { say('הקידוד לא החזיר תיאור — נסי GIF', 4000); return; }

  const blob = muxMP4(samples, avcC, w, h, fps);
  save(blob, stampName('mp4'));
  // the turn count is worth saying out loud: it is what tells you at a glance
  // whether this file loops or stops
  const turns = (n / perTurn).toFixed(2).replace(/\.?0+$/, '');
  say('נשמר MP4 · ' + w + '×' + h + ' · דגימה ×' + ss.toFixed(1) + ' · '
      + (n / fps).toFixed(1) + 'ש · ' + turns + ' סיבובים · '
      + (blob.size / 1048576).toFixed(1) + 'MB', 4600);
  });
}

/* ---------- GIF ----------
   Written out here rather than reached for, because the page is meant to run
   from a file with nothing behind it. One palette for the whole loop — a turn
   shows the same materials in the same light throughout, so a per-frame palette
   would buy nothing and would make the file flicker. */

function medianCut(sample, want) {
  // sample: Uint8Array of rgb triples
  const idx = new Uint32Array(sample.length / 3);
  for (let i = 0; i < idx.length; i++) idx[i] = i;
  let boxes = [{ lo: 0, hi: idx.length }];
  const rangeOf = box => {
    const mn = [255, 255, 255], mx = [0, 0, 0];
    for (let i = box.lo; i < box.hi; i++) {
      const p = idx[i] * 3;
      for (let c = 0; c < 3; c++) {
        const v = sample[p + c];
        if (v < mn[c]) mn[c] = v;
        if (v > mx[c]) mx[c] = v;
      }
    }
    box.mn = mn; box.mx = mx;
    box.ch = 0;
    let best = -1;
    for (let c = 0; c < 3; c++) { const r = mx[c] - mn[c]; if (r > best) { best = r; box.ch = c; } }
    box.range = best;
    return box;
  };
  rangeOf(boxes[0]);
  while (boxes.length < want) {
    let pick = -1, best = 0;
    for (let i = 0; i < boxes.length; i++) {
      const b = boxes[i];
      if (b.hi - b.lo < 2 || b.range <= 0) continue;
      const score = b.range * Math.cbrt(b.hi - b.lo);
      if (score > best) { best = score; pick = i; }
    }
    if (pick < 0) break;
    const b = boxes[pick], ch = b.ch;
    const part = Array.prototype.slice.call(idx.subarray(b.lo, b.hi));
    part.sort((p, q) => sample[p * 3 + ch] - sample[q * 3 + ch]);
    for (let i = 0; i < part.length; i++) idx[b.lo + i] = part[i];
    const mid = b.lo + (b.hi - b.lo >> 1);
    const left = { lo: b.lo, hi: mid }, right = { lo: mid, hi: b.hi };
    boxes.splice(pick, 1, rangeOf(left), rangeOf(right));
  }
  const pal = new Uint8Array(want * 3);
  for (let i = 0; i < boxes.length; i++) {
    const b = boxes[i];
    let r = 0, g = 0, bl = 0;
    for (let k = b.lo; k < b.hi; k++) { const p = idx[k] * 3; r += sample[p]; g += sample[p + 1]; bl += sample[p + 2]; }
    const n = Math.max(1, b.hi - b.lo);
    pal[i * 3] = Math.round(r / n); pal[i * 3 + 1] = Math.round(g / n); pal[i * 3 + 2] = Math.round(bl / n);
  }
  return { pal, used: boxes.length };
}

function quantiser(pal, used) {
  const cache = new Int16Array(32768).fill(-1);
  return (r, g, b) => {
    const key = (r >> 3 << 10) | (g >> 3 << 5) | (b >> 3);
    let v = cache[key];
    if (v >= 0) return v;
    let best = 0, bd = 1e9;
    for (let i = 0; i < used; i++) {
      const dr = r - pal[i * 3], dg = g - pal[i * 3 + 1], db = b - pal[i * 3 + 2];
      const d = dr * dr * 0.30 + dg * dg * 0.59 + db * db * 0.11;
      if (d < bd) { bd = d; best = i; }
    }
    cache[key] = best;
    return best;
  };
}

// 4x4 ordered dither, so a slow gradient across the backdrop does not band
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v / 16 - 0.5));

function lzw(px, minCode) {
  const clear = 1 << minCode, eoi = clear + 1;
  let size = minCode + 1, next = eoi + 1;
  let dict = new Map();
  const out = [];
  let cur = 0, bits = 0;
  const put = code => {
    cur |= code << bits; bits += size;
    while (bits >= 8) { out.push(cur & 255); cur >>= 8; bits -= 8; }
  };
  put(clear);
  let prefix = px[0];
  for (let i = 1; i < px.length; i++) {
    const k = px[i], key = prefix * 4096 + k;
    const found = dict.get(key);
    if (found !== undefined) { prefix = found; continue; }
    put(prefix);
    dict.set(key, next++);
    /* One code LATER than the arithmetic says, and this is the whole of GIF
       LZW's reputation. The obvious rule — widen as soon as the next free code
       stops fitting, so at 512 for nine bits — produces a stream no decoder
       will read: measured against Pillow, every frame came back "broken data
       stream", and the file was 0.76 bytes per pixel, which is LZW doing
       nothing at all. The reason is that the decoder builds its table one entry
       BEHIND the encoder: it cannot add an entry until it has seen the code
       after the one that created it. So it reaches 512 one code later than the
       encoder does, and the encoder has to wait for it. Verified by encoding
       the same frames under all three candidate rules and handing them to
       Pillow: only this one decodes. */
    if (next > (1 << size)) {
      if (size < 12) size++;
      // the table is full: say so at the width still in force, then start over
      else { put(clear); dict = new Map(); next = eoi + 1; size = minCode + 1; }
    }
    prefix = k;
  }
  put(prefix);
  put(eoi);
  if (bits > 0) out.push(cur & 255);
  return out;
}

function gifBytes(frames, w, h, pal, used, delayCs) {
  const b = [];
  const u16 = v => { b.push(v & 255, (v >> 8) & 255); };
  const str = t => { for (let i = 0; i < t.length; i++) b.push(t.charCodeAt(i)); };
  str('GIF89a');
  u16(w); u16(h);
  b.push(0xF7, 0, 0);                            // global table, 256 entries
  for (let i = 0; i < 256; i++) {
    const j = Math.min(i, used - 1) * 3;
    b.push(pal[j], pal[j + 1], pal[j + 2]);
  }
  b.push(0x21, 0xFF, 0x0B); str('NETSCAPE2.0');
  b.push(0x03, 0x01, 0x00, 0x00, 0x00);          // loop forever
  for (const px of frames) {
    b.push(0x21, 0xF9, 0x04, 0x04); u16(delayCs); b.push(0x00, 0x00);
    b.push(0x2C); u16(0); u16(0); u16(w); u16(h); b.push(0x00);
    b.push(8);
    const data = lzw(px, 8);
    for (let i = 0; i < data.length; i += 255) {
      const n = Math.min(255, data.length - i);
      b.push(n);
      for (let k = 0; k < n; k++) b.push(data[i + k]);
    }
    b.push(0x00);
  }
  b.push(0x3B);
  return new Uint8Array(b);
}

/* A GIF holds 256 colours and no inter-frame anything worth the name, so its
   weight is roughly pixels times frames and it climbs fast. 800 on the long
   side keeps a four-second turn in single-digit megabytes; the still and the
   video have no such ceiling and go out at twice the format on screen. Both are
   dials rather than decisions: tuneGif({max, fps}). */
let GIF_MAX = 800, GIF_FPS = 15;
window.tuneGif = (v = {}) => {
  if (v.max !== undefined) GIF_MAX = Math.max(120, Math.min(2000, v.max));
  if (v.fps !== undefined) GIF_FPS = Math.max(5, Math.min(50, v.fps));
  return { max: GIF_MAX, fps: GIF_FPS };
};

async function exportGIF() {
  const fps = GIF_FPS;
  const n = Math.max(8, Math.round(TURN.secs * fps));
  /* The format's proportion, and the format's size up to the GIF's own ceiling —
     which is far lower than the video's and stays that way. A GIF is 256 colours
     of unfiltered, palette-indexed pixels: doubling the side quadruples the file
     with no interframe compression to absorb it, and 800 on the long side is
     already a heavy file. So this is capped hard, but it is capped against the
     FORMAT rather than against the window, so the same upload gives the same GIF
     on any screen — which is the whole of what was asked for. */
  const capK = Math.min(1, GIF_MAX / Math.max(FMT.w, FMT.h));
  const targetW = Math.max(2, Math.round(FMT.w * capK));
  await atFormatScale(targetW, async ({ w, h, ss }) => {

  // one palette for the loop, built from four evenly spaced views of it
  say('GIF · בונה פלטה…');
  const sample = [];
  await turn(4, async () => {
    blit(w, h);
    const d = capx.getImageData(0, 0, w, h).data;
    for (let i = 0; i < d.length; i += 4 * 7) { sample.push(d[i], d[i + 1], d[i + 2]); }
    await raf();
  });
  const { pal, used } = medianCut(Uint8Array.from(sample), 256);
  const q = quantiser(pal, used);

  const frames = [];
  await turn(n, async (i) => {
    blit(w, h);
    const d = capx.getImageData(0, 0, w, h).data;
    const out = new Uint8Array(w * h);
    for (let y = 0, o = 0; y < h; y++) {
      for (let x = 0; x < w; x++, o++) {
        const p = o * 4, dz = BAYER[(y & 3) * 4 + (x & 3)] * 14;
        out[o] = q(Math.min(255, Math.max(0, d[p] + dz)),
                   Math.min(255, Math.max(0, d[p + 1] + dz)),
                   Math.min(255, Math.max(0, d[p + 2] + dz)));
      }
    }
    frames.push(out);
    say('GIF · ' + (i + 1) + '/' + n);
    await raf();
  });

  say('GIF · אורז…');
  await raf();
  const bytes = gifBytes(frames, w, h, pal, used, Math.max(2, Math.round(100 / fps)));
  const blob = new Blob([bytes], { type: 'image/gif' });
  save(blob, stampName('gif'));
  say('נשמר GIF · ' + w + '×' + h + ' · דגימה ×' + ss.toFixed(1) + ' · '
      + n + ' פריימים · ' + (blob.size / 1048576).toFixed(1) + 'MB', 3600);
  });
}

/* What the screen actually holds at a point in the format, in the same sRGB
   bytes a screenshot would hold. The colour solve above is a claim about this
   number, and a claim about a picture is worth what it can be measured against:
   devPixel() at the middle of an empty format should come back as the colour
   that was asked for, and devColour() says what it had to do to get there. */
window.devPixel = (x = FW / 2, y = FH / 2, half = 3) => {
  const pr = renderer.getPixelRatio();
  const w = Math.round(FW * pr), h = Math.round(FH * pr);
  exporting = true;
  try { drawPasses(); blit(w, h); } finally { exporting = false; }
  const px = Math.max(0, Math.round(x * pr) - half), py = Math.max(0, Math.round(y * pr) - half);
  const d = capx.getImageData(px, py, half * 2 + 1, half * 2 + 1).data;
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
  const av = [r / n, g / n, b / n].map(v => Math.round(v));
  return { rgb: av, hex: '#' + av.map(v => v.toString(16).padStart(2, '0')).join('') };
};

/* ---------------------------------------------------------------------------
   THE SETUP CARD, AND THEN NOTHING
   --------------------------------------------------------------------------- */

const setup = document.getElementById('setup');
const F = id => document.getElementById(id);

function readImage(file, into) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => { LAYERS[into] = img; res(img); };
      img.onerror = rej;
      img.src = fr.result;
    };
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });
}

function showSlot(which, img, name) {
  F('thumb-' + which).src = img ? img.src : '';
  F('name-' + which).textContent = img
    ? (name + ' · ' + img.naturalWidth + '×' + img.naturalHeight)
    : 'אין — לחצי או גררי PNG';
  F('clr-' + which).hidden = !img;
}

/* The format comes from the typography: whichever layer arrived first sets it,
   and the fields stay editable for the case where neither did.

   It writes the FIELDS and not FMT itself, which is not fussiness — closeSetup
   decides whether the frame has to be laid out again by comparing the fields
   against FMT, so a format that had already written itself into FMT would look
   like no change at all and the frame would keep the proportion of whatever was
   there before. Which is exactly what it did. */
function adoptFormat(img) {
  F('fmt-w').value = img.naturalWidth;
  F('fmt-h').value = img.naturalHeight;
}

async function takeFile(which, file) {
  if (!file || !/^image\//.test(file.type)) return;
  const img = await readImage(file, which);
  // the first layer to arrive is the one that sets the format
  if (!(which === 'back' ? LAYERS.front : LAYERS.back)) adoptFormat(img);
  showSlot(which, img, file.name || 'הודבק');
}

/* Three ways in, and that is deliberate rather than generous. The zone started
   as a <label> wrapped round a hidden file input, which is the usual trick and
   is exactly the thing that does nothing when the page is inside a preview pane
   that will not open a native file dialog. So the click is explicit, drag and
   drop works on the zone and on the whole card, and an image on the clipboard
   can simply be pasted. */
function wireSlot(which) {
  const drop = F('drop-' + which), input = F('file-' + which);
  input.addEventListener('change', () => takeFile(which, input.files[0]));
  drop.addEventListener('click', e => { if (!e.target.closest('.x')) input.click(); });
  drop.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); }
  });
  drop.addEventListener('dragover', e => { e.preventDefault(); e.stopPropagation(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', e => {
    e.preventDefault(); e.stopPropagation(); drop.classList.remove('over');
    takeFile(which, e.dataTransfer.files[0]);
  });
  F('clr-' + which).addEventListener('click', e => {
    e.preventDefault(); e.stopPropagation();
    LAYERS[which] = null; input.value = '';
    showSlot(which, null);
  });
}
wireSlot('back'); wireSlot('front');

// dropped or pasted anywhere on the card: it fills the empty slot, back first
const emptySlot = () => LAYERS.back ? 'front' : 'back';
setup.addEventListener('dragover', e => e.preventDefault());
setup.addEventListener('drop', e => {
  e.preventDefault();
  takeFile(emptySlot(), e.dataTransfer.files[0]);
});
addEventListener('paste', e => {
  if (setup.hidden || !e.clipboardData) return;
  const item = [...e.clipboardData.items].find(i => i.type.indexOf('image/') === 0);
  if (item) takeFile(emptySlot(), item.getAsFile());
});

F('bg-col').addEventListener('input', () => {
  F('bg-hex').value = F('bg-col').value;
  setBackground(F('bg-col').value);
});
F('bg-hex').addEventListener('change', () => {
  const v = F('bg-hex').value.trim();
  if (!/^#?[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(v)) { F('bg-hex').value = BG.hex; return; }
  const hex = '#' + hexRGB(v).map(n => n.toString(16).padStart(2, '0')).join('');
  F('bg-hex').value = hex; F('bg-col').value = hex;
  setBackground(hex);
});

/* AND THE SAME COLOUR ON THE BAR, because it is the one setting whose answer is
   only visible once the shapes are standing on it. Everything else the card
   asks for is decided before there is anything to look at — the format, the
   layers, the length of a turn — but paper is judged against the picture, and
   sending someone back to a card that covers the picture to change it is the
   same mistake the shadow dial made in the other direction.

   setBackground runs on every input event and that is deliberate: it is a table
   lookup, a colour write and applyState, so the paper follows the picker while
   it is being dragged. The one expensive part is held back — a back layer's ink
   map is re-derived against the new paper, seven renders, and it cannot be seen
   mid-drag anyway. The card needs no wiring in the other direction: statePins()
   re-reads BG.hex every time the card opens. */
let bgSettle = 0;
F('bar-bg').addEventListener('input', e => {
  setBackground(e.target.value);
  clearTimeout(bgSettle);
  bgSettle = setTimeout(() => { if (LAYERS.back) applyLayers(); }, 200);
});

function openSetup() {
  setup.hidden = false;
  statePins();
}
function closeSetup() {
  const w = Math.max(80, Math.min(8000, Math.round(+F('fmt-w').value || FMT.w)));
  const h = Math.max(80, Math.min(8000, Math.round(+F('fmt-h').value || FMT.h)));
  VID.secs = Math.max(2, Math.min(120, +F('vid-secs').value || 15));
  const moved = (w !== FMT.w || h !== FMT.h);
  FMT.w = w; FMT.h = h;
  setup.hidden = true;
  if (moved) { layoutFrame(); sizeUp(); }
  applyLayers();
  setBackground(F('bg-col').value);
  // the card had the last word on the colour, so the bar's swatch takes it back
  F('bar-bg').value = BG.hex;
}
/* Leaving the card takes the export with it, which is the point — but a way out
   that leaves no trace of itself is a way out nobody finds. So the card says so
   on the way in, and this says so again on the way out, and then goes quiet. */
F('go').addEventListener('click', () => closeSetup());
F('exp-png').addEventListener('click', () => { closeSetup(); exportStill(); });
F('exp-vid').addEventListener('click', () => { closeSetup(); exportVideo(); });
F('exp-gif').addEventListener('click', () => { closeSetup(); exportGIF(); });

/* And the same three on the bar, where the poster is actually being looked at.
   They sit on the table below the format, never over it. */
F('bar-png').addEventListener('click', exportStill);
F('bar-vid').addEventListener('click', exportVideo);
F('bar-gif').addEventListener('click', exportGIF);

/* THERE IS NO SHADOW DIAL, AND THAT IS THE DECISION (13 Aug 26).

   There was one, from version 11 to version 14, and it existed because this
   tool held its own opinion about the shadow: the numbers Hadar had chosen on
   version 11 were pinned to the middle of a slider so they would be reachable.
   The rebuild is what showed the cost. Those numbers were a reply to version
   11's shadow, and version 13 — backdrop-and-honest-shadow — replaced the thing
   they were replying to. Carried forward unexamined they were a quarter of the
   contact darkening under two and a half times the ambient light, and the
   shadow did not come out lighter, it came out missing.

   The fix is not a better centre for the slider. It is to hold no opinion at
   all: "no need for a shadow slider — whatever is set in the main tool is what
   it'll be." So nothing here touches state.ao, the ambient fill, or the gel.
   They arrive from the version this file was cut from, they change when it
   changes, and there is one place the shadow is decided instead of two that can
   disagree. tuneShadow() above is still on window if a number has to be tried
   by hand — it just is not wired to anything on screen, and it is not what the
   tool opens with. */

F('bar-set').addEventListener('click', () => { if (setup.hidden) openSetup(); else closeSetup(); });
F('bar-clear').addEventListener('click', () => document.getElementById('clear').click());

/* The only controls past the card, and none of them is on screen. */
addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const typing = /^(INPUT|TEXTAREA)$/.test((document.activeElement || {}).tagName || '');
  if (e.key === 'Escape') {
    if (!shelf.hidden) { closeShelf(); return; }
    setup.hidden ? openSetup() : closeSetup();
    return;
  }
  if (typing || !setup.hidden || !shelf.hidden || exporting) return;
  const k = e.key.toLowerCase();
  if (k === 'c') document.getElementById('clear').click();
  else if (k === 's') exportStill();
  else if (k === 'v') exportVideo();
  else if (k === 'g') exportGIF();
});

/* The card is stated from the code, not read from the markup, and this is not
   belt and braces — it is a fault that was measured twice. A reloaded page came
   up with the format reading 1712 x 2678, two numbers nobody had ever typed and
   which no image on the machine has: the browser restores form-control values
   across a reload by itself, and a restored format is a format nobody chose.
   autocomplete="off" asks it not to; this makes it so. */
/* The colour is pinned in all three places from the one value, so the swatch on
   the bar and the two fields in the card can never drift apart no matter which
   of them was last touched. */
function statePins() {
  F('fmt-w').value = FMT.w;
  F('fmt-h').value = FMT.h;
  F('vid-secs').value = VID.secs;
  F('bg-col').value = BG.hex;
  F('bg-hex').value = BG.hex;
  F('bar-bg').value = BG.hex;
}
statePins();

addEventListener('resize', () => { layoutFrame(); sizeUp(); });
layoutFrame();
sizeUp();
applyState();          // after sizeUp, which is what first gives placeCove a frame

/* The solve needs one real render behind it before it can read anything, so it
   happens on the first frame rather than here. */
let calibrated = false;
const firstFrame = (now) => {
  // and nothing sets the shadow here: applyState() above has already put the
  // main tool's own values in place, which is the whole arrangement
  drawPasses();
  if (!calibrated) {
    calibrated = true;
    try { calibrate(); setBackground(BG.hex); } catch (err) { console.warn('calibrate failed', err); }
  }
  requestAnimationFrame(frame);
};
requestAnimationFrame(firstFrame);
