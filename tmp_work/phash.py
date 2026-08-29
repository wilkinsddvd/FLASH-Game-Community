import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from png2art import decode_png

def phash(path, size=16):
    w, h, bpp, px = decode_png(path)
    # 灰度下采样
    g = [[0]*size for _ in range(size)]
    for y in range(size):
        for x in range(size):
            sx = int(x*w/size); ex = int((x+1)*w/size)
            sy = int(y*h/size); ey = int((y+1)*h/size)
            s=n=0
            for yy in range(sy, ey):
                base=(yy*w+sx)*bpp
                for xx in range(sx, ex):
                    o=base+(xx-sx)*bpp
                    if bpp==4 and px[o+3]<128: continue
                    s += 0.299*px[o]+0.587*px[o+1]+0.114*px[o+2]; n+=1
            g[y][x] = s/n if n else 0
    # 相邻像素差 -> 64 bit hash
    bits=[]
    for y in range(size):
        for x in range(size):
            l = g[y][x-1] if x>0 else g[y][x]
            bits.append(1 if g[y][x] > l else 0)
    return bits

def hdist(a,b): return sum(1 for x,y in zip(a,b) if x!=y)

if __name__ == '__main__':
    import glob
    files = sorted(glob.glob('tmp_work/veh_png/*.png'))
    hashes = {}
    for f in files:
        hashes[os.path.basename(f)[:-4]] = phash(f)
    names = list(hashes)
    # 找最相似的 3 对
    pairs = []
    for i in range(len(names)):
        for j in range(i+1, len(names)):
            d = hdist(hashes[names[i]], hashes[names[j]])
            pairs.append((d, names[i], names[j]))
    pairs.sort()
    print("最相似的图片对 (越小越像, 64位哈希汉明距离):")
    for d,a,b in pairs[:15]:
        print(f"  {d:3d}  {a} <-> {b}")
