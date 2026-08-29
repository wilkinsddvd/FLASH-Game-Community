#!/usr/bin/env python3
"""批量生成裁剪高清字符画，逐张识别载具"""
import sys, os, glob
sys.path.insert(0, os.path.dirname(__file__))
from png2art import decode_png

CH = ' .:-=+*#%@'
def scan(path, cols=150, rows=50, x0f=0.05, x1f=0.95, y0f=0.05, y1f=0.95, invert=False):
    w, h, bpp, px = decode_png(path)
    x0, x1 = int(w*x0f), int(w*x1f)
    y0, y1 = int(h*y0f), int(h*y1f)
    cw = (x1-x0)/cols; chh = (y1-y0)/rows
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
    names = sys.argv[1:]
    for name in names:
        path = f'tmp_work/veh_png/{name}.png'
        if not os.path.exists(path): 
            print(f'!! {name} missing'); continue
        print(f'########## {name} ##########')
        for ln in scan(path, 150, 50):
            print(ln)
        print()
