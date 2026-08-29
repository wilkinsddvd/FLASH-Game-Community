#!/usr/bin/env python3
"""裁剪图片中间区域并放大渲染，便于识别车辆"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from png2art import decode_png
from silhouette import render as sil

def center_crop_art(path, cols=120, rows=44, x0f=0.15, x1f=0.85, y0f=0.15, y1f=0.85, invert=False):
    w, h, bpp, px = decode_png(path)
    x0, x1 = int(w*x0f), int(w*x1f)
    y0, y1 = int(h*y0f), int(h*y1f)
    cw = (x1-x0)/cols; chh = (y1-y0)/rows
    CH = ' .:-=+*#%@'
    out = []
    for ry in range(rows):
        line = ''
        for rx in range(cols):
            sx = int(x0+rx*cw); ex = int(x0+(rx+1)*cw)
            sy = int(y0+ry*chh); ey = int(y0+(ry+1)*chh)
            lum = 0; n = 0
            for yy in range(sy, ey):
                base = (yy*w + sx)*bpp
                for xx in range(sx, ex):
                    o = base + (xx-sx)*bpp
                    if bpp == 4 and px[o+3] < 128: continue
                    lum += 0.299*px[o] + 0.587*px[o+1] + 0.114*px[o+2]
                    n += 1
            v = (lum/n/255) if n else 0
            if invert: v = 1-v
            line += CH[min(9, int(v*10))]
        out.append(line)
    return out

if __name__ == '__main__':
    path = sys.argv[1]
    x0f = float(sys.argv[2]) if len(sys.argv)>2 else 0.15
    x1f = float(sys.argv[3]) if len(sys.argv)>3 else 0.85
    y0f = float(sys.argv[4]) if len(sys.argv)>4 else 0.15
    y1f = float(sys.argv[5]) if len(sys.argv)>5 else 0.85
    inv = len(sys.argv)>6 and sys.argv[6]=='inv'
    for ln in center_crop_art(path, 120, 44, x0f, x1f, y0f, y1f, inv):
        print(ln)
