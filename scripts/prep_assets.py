"""Straighten the phone photos of the book covers into flat textures."""
import sys
import numpy as np
from PIL import Image

def coeffs(dst, src):
    # PIL's PERSPECTIVE maps output (dst) points to input (src) points.
    m = []
    for (x, y), (u, v) in zip(dst, src):
        m.append([x, y, 1, 0, 0, 0, -u * x, -u * y])
        m.append([0, 0, 0, x, y, 1, -v * x, -v * y])
    return np.linalg.solve(np.array(m, float), np.array(src, float).reshape(8))

def flatten(path, corners, out, size=(900, 1400)):
    w, h = size
    img = Image.open(path).convert("RGB")
    dst = [(0, 0), (w, 0), (w, h), (0, h)]
    flat = img.transform(size, Image.PERSPECTIVE, coeffs(dst, corners), Image.BICUBIC)
    flat.save(out, quality=92)

if __name__ == "__main__":
    src, out = sys.argv[1], sys.argv[2]
    pts = [tuple(map(float, p.split(","))) for p in sys.argv[3:7]]
    flatten(src, pts, out)
