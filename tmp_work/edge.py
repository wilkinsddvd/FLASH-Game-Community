#!/usr/bin/env python3
"""Sobel 边缘检测 -> 字符画，勾勒车辆轮廓"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from png2art import decode_png

def edges(path, cols=140, rows=46):
    w, h, bpp, px = decode_png(path)
    gw = w // cols + 1
    gh = h // rows + 1
    g = [[0.0]*cols for _ in range(rows)]
    for ry in range(rows):
        for rx in range(cols):
            x0, x1 = rx*gw, min((rx+1)*gw, w)
            y0, y1 = ry*gh, min((ry+1)*gh, h)
            s=n=0
            for yy in range(y0, y1):
                base=(yy*w+x0)*bpp
                for xx in range(x0, x1):
                    o=base+(xx-x0)*bpp
                    if bpp==4 and px[o+3]<128: continue
                    s += 0.299*px[o]+0.587*px[o+1]+0.114*px[o+2]; n+=1
            g[ry][rx] = s/n if n else 0
    # Sobel
    out=[]
    for ry in range(rows):
        line=''
        for rx in range(cols):
            gx = (g[ry][min(rx+1,cols-1)] - g[ry][max(rx-1,0)])
            gy = (g[min(ry+1,rows-1)][rx] - g[max(ry-1,0)][rx])
            m = (gx*gx+gy*gy)**0.5
            line += '#' if m > 30 else ('+' if m > 15 else ('.' if m > 6 else ' '))
        out.append(line)
    return out

if __name__ == '__main__':
    for p in sys.argv[1:]:
        print(f'########## {os.path.basename(p)} ##########')
        for ln in edges(p):
            print(ln)
        print()
