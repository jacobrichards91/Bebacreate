"""Make irobot.png and eufy.png truly transparent.

Strategy: build a 'background-ish' mask (bright, low-saturation pixels), then
flood-fill from the image edges across that mask (8-connectivity, so the eufy
checkerboard's corner-touching squares are all reached). Only flooded pixels
become transparent — interior whites (the R inside iRobot's circle) survive.
Then soften the 1px fringe, trim, and resize oversized images.
"""
import os
from collections import deque
from PIL import Image

GAME = os.path.join(os.path.dirname(__file__), '..', 'game')


def remove_bg(name, bright_min, sat_max, max_height=None):
    path = os.path.join(GAME, name)
    img = Image.open(path).convert('RGBA')
    w, h = img.size
    px = img.load()

    def is_bg(x, y):
        r, g, b, a = px[x, y]
        return a > 0 and max(r, g, b) >= bright_min and (max(r, g, b) - min(r, g, b)) <= sat_max

    flooded = bytearray(w * h)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if is_bg(x, y) and not flooded[y * w + x]:
                flooded[y * w + x] = 1
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if is_bg(x, y) and not flooded[y * w + x]:
                flooded[y * w + x] = 1
                q.append((x, y))

    neigh = [(-1, -1), (0, -1), (1, -1), (-1, 0), (1, 0), (-1, 1), (0, 1), (1, 1)]
    while q:
        x, y = q.popleft()
        for dx, dy in neigh:
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and not flooded[ny * w + nx] and is_bg(nx, ny):
                flooded[ny * w + nx] = 1
                q.append((nx, ny))

    n_removed = 0
    for y in range(h):
        for x in range(w):
            if flooded[y * w + x]:
                r, g, b, _ = px[x, y]
                px[x, y] = (r, g, b, 0)
                n_removed += 1

    # soften fringe: semi-bright pixels adjacent to removed background get partial alpha
    px2 = img.load()
    fringe = 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = px2[x, y]
            if a == 255 and max(r, g, b) >= bright_min - 35 and (max(r, g, b) - min(r, g, b)) <= sat_max + 12:
                near_clear = any(
                    0 <= x + dx < w and 0 <= y + dy < h and px2[x + dx, y + dy][3] == 0
                    for dx, dy in neigh
                )
                if near_clear:
                    px2[x, y] = (r, g, b, 120)
                    fringe += 1

    bbox = img.getbbox()
    if bbox:
        pad = 4
        bbox = (max(0, bbox[0] - pad), max(0, bbox[1] - pad),
                min(w, bbox[2] + pad), min(h, bbox[3] + pad))
        img = img.crop(bbox)

    if max_height and img.height > max_height:
        ratio = max_height / img.height
        img = img.resize((round(img.width * ratio), max_height), Image.LANCZOS)

    img.save(path, optimize=True)
    print(f"{name}: removed {n_removed} bg px, softened {fringe} fringe px, "
          f"final {img.width}x{img.height}, {os.path.getsize(path)//1024}KB")


remove_bg('irobot.png', bright_min=242, sat_max=14)
remove_bg('eufy.png', bright_min=228, sat_max=12, max_height=220)
