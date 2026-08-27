#!/usr/bin/env python3
"""PNG 区域平均 RGB 采样（辅助复杂纹章识别）"""
import sys
sys.path.insert(0, '/Users/linhao_wang/Desktop/dev/FLASH/tmp_work')
from png2art import decode_png

def sample(path, cols, rows, crop=None):
    w, h, bpp, px = decode_png(path)
    x0, y0, x1, y1 = crop or (0, 0, w, h)
    cw = (x1-x0)/cols; chh = (y1-y0)/rows
    out = []
    for ry in range(rows):
        line = []
        for rx in range(cols):
            sx = int(x0+rx*cw); ex = int(x0+(rx+1)*cw)
            sy = int(y0+ry*chh); ey = int(y0+(ry+1)*chh)
            rs=gs=bs=n=0
            for yy in range(sy, min(ey,h)):
                base=(yy*w+sx)*bpp
                for xx in range(sx, min(ex,w)):
                    o=base+(xx-sx)*bpp
                    if bpp==4 and px[o+3]<128: continue
                    rs+=px[o]; gs+=px[o+1]; bs+=px[o+2]; n+=1
            if n==0: line.append('      ')
            else:
                line.append(f"{rs//n:02x}{gs//n:02x}{bs//n:02x}")
        out.append(line)
    return out

if __name__ == '__main__':
    path, cols, rows = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
    crop = tuple(int(v) for v in sys.argv[4:8]) if len(sys.argv)>7 else None
    grid = sample(path, cols, rows, crop)
    # 打印带表头的网格
    hdr = '     ' + ''.join(f"{i:>6}" for i in range(cols))
    print(hdr)
    for i, line in enumerate(grid):
        print(f"{i:>3} " + ' '.join(f"[{c}]" if False else f"{c}" for c in line))
