# -*- coding: utf-8 -*-
"""Render a seamless-looping cyberpunk background video (21:9) via imageio-ffmpeg."""
import math
import random
import subprocess
import imageio_ffmpeg
from PIL import Image, ImageDraw, ImageFilter

W, H = 1680, 720
FPS, SECONDS = 24, 10
N_FRAMES = FPS * SECONDS
HORIZON = int(H * 0.42)
AMBER = (0, 229, 255)
AMBER_HI = (170, 240, 255)
GREEN = (57, 255, 20)

random.seed(7)
# static rain drops: (x, y0, len, speed, alpha)
DROPS = [(random.randrange(W), random.randrange(H), random.randint(14, 70),
          random.uniform(0.5, 2.0), random.randint(40, 150)) for _ in range(160)]
# stars
STARS = [(random.randrange(W), random.randrange(HORIZON), random.randint(1, 2),
          random.uniform(0.5, 1.0), random.uniform(0, math.pi * 2)) for _ in range(90)]

ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
cmd = [
    ffmpeg, "-y",
    "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
    "-i", "-",
    "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "23",
    "-movflags", "+faststart",
    "app/public/videos/cinematic-vision.mp4",
]
proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

base = Image.new("RGB", (W, H))
bp = base.load()
for y in range(H):
    t = y / (H - 1)
    c = (int(5 + 3 * t), int(10 + 4 * t), int(18 + 10 * t))
    for x in range(W):
        bp[x, y] = c

N_GRID = 14
CX = W // 2

for f in range(N_FRAMES):
    t = f / N_FRAMES  # 0..1, loops
    frame = base.copy().convert("RGBA")
    d = ImageDraw.Draw(frame, "RGBA")

    # stars with twinkle
    for x, y, r, base_a, ph in STARS:
        a = int(140 * base_a * (0.5 + 0.5 * math.sin(2 * math.pi * (2 * t) + ph)))
        d.ellipse([x - r, y - r, x + r, y + r], fill=(240, 240, 240, a))

    # horizon glow band (pulsing)
    pulse = 0.6 + 0.4 * math.sin(2 * math.pi * t)
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.rectangle([0, HORIZON - 30, W, HORIZON + 30], fill=(0, 229, 255, int(60 * pulse)))
    frame = Image.alpha_composite(frame, glow.filter(ImageFilter.GaussianBlur(40)))
    d = ImageDraw.Draw(frame, "RGBA")
    d.rectangle([0, HORIZON, W, HORIZON + 1], fill=(0, 229, 255, 200))

    # perspective verticals (static)
    for i in range(-18, 19):
        a = max(18, 70 - abs(i) * 3)
        d.line([(CX + i * W // 8, HORIZON), (CX + i * W, H)], fill=(0, 229, 255, a), width=1)

    # moving horizontal grid lines (seamless wrap)
    u = t * N_GRID
    for k in range(N_GRID):
        frac = ((k + u) % N_GRID) / N_GRID
        y = HORIZON + int((H - HORIZON) * (frac ** 3))
        a = int(30 + 140 * frac)
        d.line([(0, y), (W, y)], fill=(0, 229, 255, a), width=1)

    # rain (seamless wrap)
    for x, y0, ln, sp, a in DROPS:
        yy = (y0 + sp * t * H) % (H + ln) - ln
        d.line([(x, yy), (x, yy + ln)], fill=(57, 255, 20, a), width=1)

    # occasional glitch bar (periodic, 2 cycles per loop)
    gb = int(6 * (0.5 + 0.5 * math.sin(2 * math.pi * 2 * t)))
    for i in range(gb):
        y = random.Random(f * 31 + i).randrange(H)
        d.rectangle([0, y, W, y + 2], fill=(0, 229, 255, 26))

    # scanlines
    for y in range(0, H, 4):
        d.line([(0, y), (W, y)], fill=(0, 0, 0, 16))

    proc.stdin.write(frame.convert("RGB").tobytes())
    if f % 48 == 0:
        print(f"frame {f}/{N_FRAMES}")

proc.stdin.close()
proc.wait()
print("video done, returncode:", proc.returncode)
