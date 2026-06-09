"""Analyze logo PNGs: mode, alpha stats, corner/edge colors — decide cleanup per file."""
import os
from PIL import Image

GAME = os.path.join(os.path.dirname(__file__), '..', 'game')
FILES = ['irobot.png', 'eufy.png', 'roborock.png', 'logo.png',
         'Shark.png', 'ilife_logo.png', 'samsung_logo.png']

for name in FILES:
    path = os.path.join(GAME, name)
    img = Image.open(path)
    rgba = img.convert('RGBA')
    w, h = rgba.size
    px = rgba.load()
    alphas = [px[x, y][3] for y in range(0, h, max(1, h // 50)) for x in range(0, w, max(1, w // 50))]
    transparent = sum(1 for a in alphas if a < 10)
    opaque = sum(1 for a in alphas if a > 245)
    corners = [px[0, 0], px[w - 1, 0], px[0, h - 1], px[w - 1, h - 1]]
    mid_edges = [px[w // 2, 0], px[w // 2, h - 1], px[0, h // 2], px[w - 1, h // 2]]
    print(f"{name}: {img.mode} {w}x{h} | sampled transparent={transparent} opaque={opaque} of {len(alphas)}")
    print(f"   corners: {corners}")
    print(f"   mid-edges: {mid_edges}")
