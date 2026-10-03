# -*- coding: utf-8 -*-
"""Generate cyberpunk-style images for the self-intro site."""
import math
import random
from PIL import Image, ImageDraw, ImageFilter

OUT = "app/public/images"
random.seed(42)

NEAR_BLACK = (5, 10, 18)
AMBER = (0, 229, 255)       # 荧光蓝主色
AMBER_HI = (170, 240, 255)  # 荧光蓝高光
CYAN = (0, 229, 255)
MAGENTA = (255, 45, 149)
WHITE = (240, 248, 255)


def vgrad(size, top, bottom):
    w, h = size
    img = Image.new("RGB", size)
    px = img.load()
    for y in range(h):
        t = y / max(h - 1, 1)
        c = tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3))
        for x in range(w):
            px[x, y] = c
    return img


def glow_line(draw, p1, p2, color, width=2):
    draw.line([p1, p2], fill=color, width=width)


def add_scanlines(img, step=4, alpha=18):
    ov = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    for y in range(0, img.size[1], step):
        d.line([(0, y), (img.size[0], y)], fill=(0, 0, 0, alpha))
    return Image.alpha_composite(img.convert("RGBA"), ov)


def add_noise(img, strength=10):
    px = img.load()
    w, h = img.size
    for _ in range(w * h // 18):
        x, y = random.randrange(w), random.randrange(h)
        r, g, b, a = px[x, y]
        n = random.randint(-strength, strength)
        px[x, y] = (max(0, min(255, r + n)), max(0, min(255, g + n)), max(0, min(255, b + n)), a)
    return img


def vignette(img, power=1.6):
    w, h = img.size
    mask = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(mask)
    d.ellipse([-w * 0.25, -h * 0.25, w * 1.25, h * 1.25], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(w // 6))
    black = Image.new("RGBA", (w, h), (0, 0, 0, 255))
    return Image.composite(img, black, mask.point(lambda p: int(255 - (255 - p) * power) if power > 1 else p))


def grid_perspective(draw, w, h, horizon, color, n=18):
    cx = w // 2
    for i in range(-n, n + 1):
        draw.line([(cx + i * w // 8, horizon), (cx + i * w, h)], fill=color, width=1)
    y = horizon
    gap = 8
    while y < h:
        draw.line([(0, y), (w, y)], fill=color, width=1)
        gap *= 1.45
        y += int(gap)


def rain_streaks(draw, w, h, color, count=120):
    for _ in range(count):
        x = random.randrange(w)
        y = random.randrange(h)
        ln = random.randint(12, 60)
        c = color + (random.randint(40, 160),)
        draw.line([(x, y), (x, y + ln)], fill=c, width=1)


def glitch_bars(draw, w, h, colors, count=10):
    for _ in range(count):
        y = random.randrange(h)
        bh = random.randint(2, 8)
        x = random.randrange(0, w // 2)
        bw = random.randint(w // 8, w // 2)
        c = random.choice(colors)
        draw.rectangle([x, y, x + bw, y + bh], fill=c + (random.randint(30, 90),))


def neon_text_like(draw, w, h, color):
    # abstract glyph columns, like code/rain frozen in place
    for col in range(0, w, 26):
        x = col + random.randint(0, 10)
        n = random.randint(3, 12)
        y0 = random.randrange(h // 3)
        for i in range(n):
            s = random.randint(6, 14)
            a = max(20, 200 - i * 18)
            draw.rectangle([x, y0 + i * 22, x + s, y0 + i * 22 + s], outline=color + (a,), width=1)


def make(base_name, size, accent, variant):
    w, h = size
    img = vgrad(size, (5, 10, 18), (8, 14, 28)).convert("RGBA")
    d = ImageDraw.Draw(img, "RGBA")
    horizon = int(h * 0.42)

    if variant == 1:  # perspective grid + horizon sun (跃迁: ascending grid)
        grid_perspective(d, w, h, horizon, AMBER + (70,))
        for r in range(int(h * 0.30), 0, -6):
            a = int(90 * (1 - r / (h * 0.30)))
            d.ellipse([w // 2 - r, horizon - r, w // 2 + r, horizon + r], outline=AMBER_HI + (a,), width=2)
        d.rectangle([0, horizon, w, horizon + 2], fill=AMBER + (160,))
        rain_streaks(d, w, h, AMBER, 90)
    elif variant == 2:  # circuit / data core (AI 造物)
        neon_text_like(d, w, h, AMBER)
        for _ in range(26):
            x1, y1 = random.randrange(w), random.randrange(h)
            x2 = x1 + random.choice([-1, 1]) * random.randint(40, 200)
            y2 = y1
            x3, y3 = x2, y2 + random.choice([-1, 1]) * random.randint(30, 140)
            d.line([(x1, y1), (x2, y2), (x3, y3)], fill=accent + (120,), width=2)
            d.ellipse([x3 - 3, y3 - 3, x3 + 3, y3 + 3], fill=accent + (200,))
        glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        gd = ImageDraw.Draw(glow)
        gd.ellipse([w * 0.3, h * 0.15, w * 0.7, h * 0.75], fill=accent + (40,))
        img = Image.alpha_composite(img, glow.filter(ImageFilter.GaussianBlur(60)))
        d = ImageDraw.Draw(img, "RGBA")
    elif variant == 3:  # signal waves (内容创作: broadcast)
        for k in range(7):
            y0 = int(h * (0.25 + k * 0.09))
            pts = []
            for x in range(0, w, 4):
                t = x / w
                y = y0 + math.sin(t * math.pi * (3 + k) + k) * (12 + k * 7) * math.sin(t * math.pi)
                pts.append((x, y))
            d.line(pts, fill=(AMBER if k % 2 == 0 else accent) + (140 - k * 12,), width=2)
        for _ in range(40):
            x, y = random.randrange(w), random.randrange(h)
            r = random.randint(1, 3)
            d.ellipse([x - r, y - r, x + r, y + r], fill=WHITE + (random.randint(60, 180),))
        rain_streaks(d, w, h, AMBER, 60)
    else:  # books as city skyline (深度阅读)
        x = 0
        while x < w:
            bw = random.randint(28, 70)
            bh = random.randint(int(h * 0.25), int(h * 0.6))
            d.rectangle([x, h - bh, x + bw, h], fill=(8, 12, 22, 255), outline=AMBER + (120,), width=1)
            for wy in range(h - bh + 12, h - 8, 16):
                for wx in range(x + 6, x + bw - 6, 12):
                    if random.random() < 0.35:
                        d.rectangle([wx, wy, wx + 5, wy + 8], fill=AMBER_HI + (random.randint(60, 170),))
            x += bw + random.randint(4, 14)
        d.rectangle([0, int(h * 0.35), w, int(h * 0.35) + 1], fill=accent + (110,))
        rain_streaks(d, w, h, AMBER, 80)

    glitch_bars(d, w, h, [AMBER, accent], 8)
    img = add_scanlines(img)
    img = add_noise(img, 9)
    img = vignette(img)
    img.convert("RGB").save(f"{OUT}/{base_name}.jpg", quality=88)
    print("saved", base_name)


make("capability-1", (960, 640), CYAN, 1)
make("capability-2", (960, 640), CYAN, 2)
make("capability-3", (960, 640), MAGENTA, 3)
make("capability-4", (960, 640), CYAN, 4)
make("research-1", (800, 800), MAGENTA, 3)
make("research-2", (800, 800), CYAN, 2)
make("research-3", (800, 800), CYAN, 1)
make("research-4", (800, 800), CYAN, 4)
print("done")
