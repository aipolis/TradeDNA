"""Compress mentor avatars: resize to 300x300 JPEG, keep clarity."""
from PIL import Image
import os

DIR = r"F:\startup\TradeDNA\miniprogram\assets\mentors"
SIZE = 300
QUALITY = 88
BG = (0, 0, 0)  # match decorative frame background


def flatten(im):
    if im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info):
        base = Image.new("RGB", im.size, BG)
        rgba = im.convert("RGBA")
        base.paste(rgba, mask=rgba.split()[-1])
        return base
    return im.convert("RGB")


def optimize_file(path):
    name, ext = os.path.splitext(os.path.basename(path))
    ext = ext.lower()
    im = Image.open(path)
    im = flatten(im)
    if im.size[0] != SIZE or im.size[1] != SIZE:
        im = im.resize((SIZE, SIZE), Image.Resampling.LANCZOS)
    out = os.path.join(DIR, f"{name}.jpg")
    im.save(out, "JPEG", quality=QUALITY, optimize=True, progressive=True)
    old_kb = os.path.getsize(path) / 1024
    new_kb = os.path.getsize(out) / 1024
    if ext == ".png" and path != out:
        os.remove(path)
    elif ext == ".jpg" and path != out:
        os.replace(out, path)
        out = path
    return name, old_kb, new_kb, out


def main():
    files = [
        os.path.join(DIR, f)
        for f in os.listdir(DIR)
        if f.lower().endswith((".png", ".jpg", ".jpeg"))
    ]
    for path in sorted(files):
        kb = os.path.getsize(path) / 1024
        ext = os.path.splitext(path)[1].lower()
        if ext == ".jpg" and kb < 40:
            continue
        if ext == ".png" or kb >= 40:
            name, old_kb, new_kb, out = optimize_file(path)
            print(f"{name}: {old_kb:.1f}KB -> {new_kb:.1f}KB  ({out})")


if __name__ == "__main__":
    main()
