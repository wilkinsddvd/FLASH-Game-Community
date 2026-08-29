#!/usr/bin/env python3
"""批量从 Commons 下载用户点名车辆的参考图，用于 phash 对比验证"""
import os, sys, time
sys.path.insert(0, os.path.dirname(__file__))
from commons_fetch import search_files, download, OUT

# 车辆 -> 搜索词
VEHICLES = {
    'M113A3': 'M113A3 armored personnel carrier',
    'M1064A3': 'M1064 mortar carrier M113',
    'M1128': 'M1128 Stryker MGS',
    'ATV': 'military quad bike ATV army',
    'MTLB': 'MT-LB tracked armored',
    'MTLBM': 'MT-LBM armored',
    'BTRD': 'BTR-D airborne',
    'BTRMDM': 'BTR-MDM',
    'Sprut': '2S25 Sprut-SD airborne',
    'BTRZD': 'BTR-ZD anti-aircraft',
    'FV432': 'FV432 armored personnel carrier',
    'LPPV': 'LPPV Foxhound patrol vehicle',
    'Challenger2': 'Challenger 2 main battle tank',
    'Leopard2A6M': 'Leopard 2A6M CAN tank',
    'CH146': 'CH-146 Griffon helicopter',
    'LUVW': 'LUVW Mercedes G-Wagon military',
    'ZSL92': 'ZSL-92 armored personnel carrier',
    'ZBL08': 'ZBL-08 infantry fighting vehicle',
    'ZTZ99A': 'ZTZ-99A main battle tank',
    'Shanmao': 'CSK-131 all-terrain vehicle PLA',
}

for name, query in VEHICLES.items():
    print(f'===== {name}: {query} =====', flush=True)
    try:
        res = search_files(query, limit=4)
        if not res:
            print('  no results', flush=True)
            continue
        for t, u, w, h, m in res[:3]:
            print(f'  {w}x{h} {m} {t}', flush=True)
        # 下载第一张
        t, u, w, h, m = res[0]
        dest = os.path.join(OUT, name + os.path.splitext(t)[1].lower()[:5])
        try:
            download(u, dest)
            print(f'  -> {dest}', flush=True)
        except Exception as e:
            print(f'  download fail: {e}', flush=True)
    except Exception as e:
        print(f'  ERR {e}', flush=True)
    time.sleep(0.3)
print('ALL DONE')
