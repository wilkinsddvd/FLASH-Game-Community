#!/usr/bin/env python3
"""PNG 解码 → 下采样 → 字符画（模型"看"图用）"""
import struct, zlib, sys, os

def decode_png(path):
    with open(path, 'rb') as f:
        data = f.read()
    assert data[:8] == b'\x89PNG\r\n\x1a\n', 'not png'
    pos = 8
    idat = b''
    w = h = bitdepth = colortype = None
    while pos < len(data):
        length = struct.unpack('>I', data[pos:pos+4])[0]
        ctype = data[pos+4:pos+8]
        cdata = data[pos+8:pos+8+length]
        if ctype == b'IHDR':
            w, h, bitdepth, colortype = struct.unpack('>IIBB', cdata[:10])
        elif ctype == b'IDAT':
            idat += cdata
        elif ctype == b'IEND':
            break
        pos += 12 + length
    assert colortype in (0, 2, 6), f'unsupported colortype {colortype}'
    bpp = {0:1, 2:3, 6:4}[colortype]
    raw = zlib.decompress(idat)
    stride = w * bpp
    out = bytearray(w * h * bpp)
    prev = bytearray(stride)
    p = 0
    for y in range(h):
        ft = raw[p]; p += 1
        line = bytearray(raw[p:p+stride]); p += stride
        if ft == 1:
            for i in range(bpp, stride): line[i] = (line[i] + line[i-bpp]) & 255
        elif ft == 2:
            for i in range(stride): line[i] = (line[i] + prev[i]) & 255
        elif ft == 3:
            for i in range(stride):
                a = line[i-bpp] if i >= bpp else 0
                line[i] = (line[i] + ((a + prev[i]) >> 1)) & 255
        elif ft == 4:
            for i in range(stride):
                a = line[i-bpp] if i >= bpp else 0
                b = prev[i]
                c = prev[i-bpp] if i >= bpp else 0
                pa, pb, pc = abs(b-c), abs(a-c), abs(a+b-2*c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[i] = (line[i] + pr) & 255
        out[y*stride:(y+1)*stride] = line
        prev = line
    return w, h, bpp, bytes(out)

# 颜色名映射
PALETTE = [
    (255,255,255,'W'), (245,245,245,'w'), (200,200,200,'s'), (150,150,150,'S'), (100,100,100,'k'), (60,60,60,'K'), (20,20,20,'K'),
    (255,0,0,'R'), (220,30,30,'R'), (190,30,45,'r'), (166,25,46,'r'), (140,20,40,'M'), (120,10,30,'M'),
    (255,220,0,'Y'), (255,200,40,'Y'), (201,162,39,'y'), (230,180,80,'y'), (200,150,60,'N'), (150,110,60,'n'),
    (0,120,255,'B'), (0,90,180,'B'), (0,57,166,'b'), (30,60,120,'b'), (20,40,90,'b'), (10,25,60,'D'),
    (0,150,60,'G'), (46,125,50,'G'), (60,140,60,'g'), (30,100,40,'g'), (20,80,30,'g'),
    (255,150,0,'O'), (230,120,20,'O'),
    (150,60,120,'P'), (120,50,100,'P'),
    (0,180,180,'C'), (0,130,140,'C'),
]
def color_char(r,g,b):
    best, bd = '?', 1e9
    for pr,pg,pb,ch in PALETTE:
        d = (pr-r)**2 + (pg-g)**2 + (pb-b)**2
        if d < bd: bd, best = d, ch
    return best

def render(path, cols=110, rows=46, crop=None):
    w, h, bpp, px = decode_png(path)
    x0, y0, x1, y1 = crop or (0, 0, w, h)
    cw = max(1, (x1-x0) / cols)
    chh = max(1, (y1-y0) / rows)
    lines = []
    for ry in range(rows):
        line = ''
        for rx in range(cols):
            sx = int(x0 + rx*cw); ex = int(x0 + (rx+1)*cw)
            sy = int(y0 + ry*chh); ey = int(y0 + (ry+1)*chh)
            rs = gs = bs = n = 0
            for yy in range(sy, min(ey, h)):
                row = yy*stride if False else 0
            for yy in range(sy, min(ey, h)):
                base = (yy*w + sx)*bpp
                for xx in range(sx, min(ex, w)):
                    o = base + (xx-sx)*bpp
                    if bpp == 4 and px[o+3] < 128: continue
                    rs += px[o]; gs += px[o+1]; bs += px[o+2]; n += 1
            if n == 0:
                line += ' '
            else:
                line += color_char(rs//n, gs//n, bs//n)
        lines.append(line)
    return lines

if __name__ == '__main__':
    path = sys.argv[1]
    cols = int(sys.argv[2]) if len(sys.argv) > 2 else 110
    rows = int(sys.argv[3]) if len(sys.argv) > 3 else 46
    crop = None
    if len(sys.argv) > 7:
        crop = tuple(int(v) for v in sys.argv[4:8])
    for ln in render(path, cols, rows, crop):
        print(ln)

# 放大裁剪模式: python3 png2art.py file.png COLS ROWS crop x0,y0,x1,y1
