#!/usr/bin/env python3
"""Generate neutral (tintable) material textures for the INTENT prototype.
Shot 'white' so the code can tint them any colour — per the palette decision."""
import os, sys, base64
import google.generativeai as genai

api_key = os.environ.get('GEMINI_API_KEY')
if not api_key:
    print("ERROR: GEMINI_API_KEY not set"); sys.exit(1)
genai.configure(api_key=api_key)

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "textures")
os.makedirs(OUT, exist_ok=True)

BASE = ("Full-frame macro texture photograph, the texture fills the entire frame edge to edge, "
        "no objects, no borders, no shadows cast, flat even lighting, "
        "white and pale off-white monochrome only, high detail, scanned look. ")

TEXTURES = {
    "gouache": BASE + "Thick white gouache paint spread with a wide brush on paper, "
               "visible bristle streaks, ridges of paint, matte finish, slightly torn paper edges visible in paint gaps.",
    "sponge":  BASE + "White kitchen sponge surface extreme close-up, porous, many irregular holes and cavities, soft foam.",
    "moss":    BASE + "Pale white-bleached moss and lichen dense carpet from directly above, tiny fibrous fronds, fluffy.",
    "paper":   BASE + "White heavy watercolor paper, rough cold-press grain, subtle fiber texture.",
    "clay":    BASE + "White air-dry clay smoothed by fingers, subtle fingerprints and tool marks, matte ceramic.",
    "crystal": BASE + "White translucent crystal cluster macro, faceted quartz points densely packed, gently glowing.",
}

MODELS = ["gemini-3-pro-image-preview", "gemini-2.0-flash-preview-image-generation"]

def gen(name, prompt):
    for mname in MODELS:
        try:
            model = genai.GenerativeModel(mname)
            resp = model.generate_content(prompt)
            for part in resp.candidates[0].content.parts:
                if hasattr(part, 'inline_data') and part.inline_data and part.inline_data.data:
                    path = os.path.join(OUT, f"{name}.jpg")
                    data = part.inline_data.data
                    if isinstance(data, str):
                        data = base64.b64decode(data)
                    with open(path, 'wb') as f:
                        f.write(data)
                    print(f"OK {name} <- {mname} ({len(data)//1024}KB)")
                    return True
            print(f"no image in response for {name} via {mname}")
        except Exception as e:
            print(f"fail {name} via {mname}: {e}")
    return False

ok = 0
for name, prompt in TEXTURES.items():
    if gen(name, prompt):
        ok += 1
print(f"done: {ok}/{len(TEXTURES)}")
