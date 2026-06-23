from PIL import Image
import os

SRC = r"C:\Users\fanxi\.cursor\projects\f-startup\assets\c__Users_fanxi_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_b9c51fec-939f-42db-b6f0-141356ef951f-03322cb0-40f6-4f8e-9ded-22cf12f631dc.png"
OUT_DIR = r"F:\startup\TradeDNA\miniprogram\assets\mentors"

NAMES_TOP = ["dengxiaofeng", "munger", "wangchen", "wangyawei"]
NAMES_BOT = ["fengchengyi", "qiuguolu", "guandayu"]


def is_content(p):
    if len(p) == 4:
        r, g, b, a = p
        if a < 10:
            return False
    else:
        r, g, b = p
    return r < 245 or g < 245 or b < 245


def row_segments(im, y0, y1, min_gap=8):
    w = im.size[0]
    col_sum = []
    for x in range(w):
        s = sum(1 for y in range(y0, y1) if is_content(im.getpixel((x, y))))
        col_sum.append(s)
    threshold = max(col_sum) * 0.06
    segments = []
    in_seg = False
    start = 0
    for x, s in enumerate(col_sum):
        if s > threshold and not in_seg:
            start = x
            in_seg = True
        elif s <= threshold and in_seg:
            if x - start > min_gap:
                segments.append((start, x))
            in_seg = False
    if in_seg and w - start > min_gap:
        segments.append((start, w - 1))
    return segments


def crop_square(im, x0, x1, y0, y1, pad=0):
    """Crop centered square from cell bounds, excluding label area at bottom."""
    cell_w = x1 - x0
    cell_h = y1 - y0
    # portrait occupies upper ~78% of cell (label below)
    portrait_h = int(cell_h * 0.78)
    size = min(cell_w - pad * 2, portrait_h - pad * 2)
    cx = (x0 + x1) // 2
    cy = y0 + portrait_h // 2
    left = cx - size // 2
    top = cy - size // 2
    return im.crop((left, top, left + size, top + size))


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    im = Image.open(SRC).convert("RGB")
    im_rgba = im.convert("RGBA")

    top_segs = row_segments(im, 20, 330)
    bot_segs = row_segments(im, 350, 650)

    print("top segments:", top_segs)
    print("bot segments:", bot_segs)

    if len(top_segs) != 4 or len(bot_segs) != 3:
        # fallback fixed grid for 1024x673
        w, h = im.size
        top_segs = [(0, w // 4), (w // 4, w // 2), (w // 2, 3 * w // 4), (3 * w // 4, w)]
        bw = w // 4
        off = bw // 2
        bot_segs = [(off, off + bw), (off + bw, off + 2 * bw), (off + 2 * bw, off + 3 * bw)]
        print("fallback top:", top_segs)
        print("fallback bot:", bot_segs)

    for name, (x0, x1) in zip(NAMES_TOP, top_segs):
        crop = crop_square(im_rgba, x0, x1, 20, 330)
        path = os.path.join(OUT_DIR, f"{name}.png")
        crop.save(path, "PNG")
        print("saved", path, crop.size)

    for name, (x0, x1) in zip(NAMES_BOT, bot_segs):
        crop = crop_square(im_rgba, x0, x1, 350, 650)
        path = os.path.join(OUT_DIR, f"{name}.png")
        crop.save(path, "PNG")
        print("saved", path, crop.size)


if __name__ == "__main__":
    main()
