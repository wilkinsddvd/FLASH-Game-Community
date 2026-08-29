#!/usr/bin/env python3
"""灰度轮廓渲染：用亮度阈值把图片变成清晰的剪影，便于模型识别车辆形状"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from png2art import decode_png

CHARS = ' .:-=+*#%@'
def render(path, cols=120, rows=40, thresh=None, invert=False):
    w, h, bpp, px = decode_png(path)
    cw = w / cols; chh = h / rows
    out = []
    for ry in range(rows):
        line = ''
        for rx in range(cols):
            sx = int(rx*cw); ex = int((rx+1)*cw)
            sy = int(ry*chh); ey = int((ry+1)*chh)
            lum = 0; n = 0
            for yy in range(sy, ey):
                base = (yy*w + sx)*bpp
                for xx in range(sx, ex):
                    o = base + (xx-sx)*bpp
                    if bpp == 4 and px[o+3] < 128: continue
                    lum += 0.299*px[o] + 0.587*px[o+1] + 0.114*px[o+2]
                    n += 1
            if n == 0:
                line += ' '
            else:
                v = lum/n/255
                if invert: v = 1 - v
                line += CHARS[min(9, int(v*10))]
        out.append(line)
    return out

if __name__ == '__main__':
    path = sys.argv[1]
    cols = int(sys.argv[2]) if len(sys.argv) > 2 else 120
    rows = int(sys.argv[3]) if len(sys.argv) > 3 else 40
    thresh = float(sys.argv[4]) if len(sys.argv) > 4 else None
    invert = len(sys.argv) > 5 and sys.argv[5] == 'inv'
    for ln in render(path, cols, rows, thresh, invert):
        print(ln)
