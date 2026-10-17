/**
 * 载具武器/弹药数据（由 Squad Wiki 采集生成）
 * 数据源：https://squad.fandom.com/wiki/<page>
 * 采集时间：2026-10-17；页面 revision 时间见 sourceTimestamp
 *
 * 说明：
 * - armaments[].ammo 为总弹药数；detail 为弹种/弹箱说明
 * - ammo=null 表示 Wiki 未给出明确数字，页面显示「—」
 * - unarmed=true 表示确认无武装（运输/侦察载具）
 * - 未收录的名称返回 null，页面显示「数据待补」
 */
export const VEHICLE_SPECS = {
 "M939运兵卡车": {
  "page": "M939 Truck",
  "crew": "Transport: 13 players (1 driver, 12 passengers)",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/M939_Truck",
  "sourceTimestamp": "2024-12-05T11:35:37Z",
  "unarmed": true
 },
 "M939补给卡车": {
  "page": "M939 Truck",
  "crew": "Transport: 13 players (1 driver, 12 passengers)",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/M939_Truck",
  "sourceTimestamp": "2024-12-05T11:35:37Z",
  "unarmed": true
 },
 "M1151 M2": {
  "page": "M1151",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "M2HB Open Top",
    "caliber": ".50 BMG (12.7×99mm NATO)",
    "ammo": 1000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1000
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/M1151",
  "sourceTimestamp": "2024-12-05T12:02:42Z"
 },
 "LAV-25装甲侦察车": {
  "page": "LAV-25",
  "crew": "3",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "M242 Bushmaster",
    "caliber": "25 mm",
    "ammo": 210,
    "ammoTypes": [
     {
      "type": "M919 Armor Piercing Fin Stabilized Discarding Sabot-Tracer",
      "count": 60
     },
     {
      "type": "MK210 High Explosive-Incendiary",
      "count": 150
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "M240C",
    "caliber": "7.62 mm",
    "ammo": 225,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 225
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/LAV-25",
  "sourceTimestamp": "2025-09-19T11:40:16Z"
 },
 "M1A1": {
  "page": "M1A1",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "M256 120mm smoothbore gun",
    "caliber": "120 mm",
    "ammo": 42,
    "ammoTypes": [
     {
      "type": "KEW-A2 Armor-Piercing Sabot",
      "count": 21
     },
     {
      "type": "M830A1 High Explosive Anti-Tank",
      "count": 21
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "Mag58",
    "caliber": "7.62 mm",
    "ammo": 2000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2000
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   },
   {
    "category": "Commander's HMG",
    "name": "M2A1 Browning CWS",
    "caliber": "12.7 mm",
    "ammo": 700,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 700
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/M1A1",
  "sourceTimestamp": "2025-04-06T18:03:53Z"
 },
 "UH-1Y": {
  "page": "UH-1",
  "crew": "",
  "armaments": [
   {
    "category": "Door Gun",
    "name": "M240H",
    "caliber": "7.62 mm",
    "ammo": 2000,
    "detail": "2 挺，各 5×200 发"
   }
  ],
  "source": "https://squad.fandom.com/wiki/UH-1",
  "sourceTimestamp": "2025-04-16T01:29:49Z"
 },
 "橡皮艇 M240": {
  "page": "RHIB",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "",
    "caliber": "",
    "ammo": null,
    "ammoTypes": []
   }
  ],
  "source": "https://squad.fandom.com/wiki/RHIB",
  "sourceTimestamp": "2024-06-02T14:20:40Z"
 },
 "橡皮艇 M2": {
  "page": "RHIB",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "",
    "caliber": "",
    "ammo": null,
    "ammoTypes": []
   }
  ],
  "source": "https://squad.fandom.com/wiki/RHIB",
  "sourceTimestamp": "2024-06-02T14:20:40Z"
 },
 "橡皮艇 补给型": {
  "page": "RHIB",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "",
    "caliber": "",
    "ammo": null,
    "ammoTypes": []
   }
  ],
  "source": "https://squad.fandom.com/wiki/RHIB",
  "sourceTimestamp": "2024-06-02T14:20:40Z"
 },
 "四轮摩托车": {
  "page": "Quad Bike",
  "crew": "2 players (1 driver, 1 passenger)",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/Quad_Bike",
  "sourceTimestamp": "2025-11-08T19:27:24Z",
  "unarmed": true
 },
 "MATV M2": {
  "page": "M-ATV",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "M2A1 Browning",
    "caliber": "12.7 mm",
    "ammo": 1000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1000
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/M-ATV",
  "sourceTimestamp": "2024-12-05T12:19:40Z"
 },
 "MATV Mk19": {
  "page": "M-ATV",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "M2A1 Browning",
    "caliber": "12.7 mm",
    "ammo": 1000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1000
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/M-ATV",
  "sourceTimestamp": "2024-12-05T12:19:40Z"
 },
 "MATV CROWS M2": {
  "page": "M-ATV",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "M2A1 Browning",
    "caliber": "12.7 mm",
    "ammo": 1000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1000
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/M-ATV",
  "sourceTimestamp": "2024-12-05T12:19:40Z"
 },
 "MATV TOW": {
  "page": "M-ATV",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "M2A1 Browning",
    "caliber": "12.7 mm",
    "ammo": 1000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1000
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/M-ATV",
  "sourceTimestamp": "2024-12-05T12:19:40Z"
 },
 "AAVC-7A1补给载具": {
  "page": "AAVC",
  "crew": "?",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/AAVC",
  "sourceTimestamp": "2024-05-18T15:33:53Z",
  "unarmed": true
 },
 "AAVP-7A1": {
  "page": "AAVP",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "MK19",
    "caliber": "40 mm",
    "ammo": 48,
    "ammoTypes": [
     {
      "type": "HEDP",
      "count": 48
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "M2A1",
    "caliber": "12.7 mm",
    "ammo": 500,
    "ammoTypes": [
     {
      "type": "Ball",
      "count": 500
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 4,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 4
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/AAVP",
  "sourceTimestamp": "2024-09-24T23:04:10Z"
 },
 "M1151 M240": {
  "page": "M1151",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "M2HB Open Top",
    "caliber": ".50 BMG (12.7×99mm NATO)",
    "ammo": 1000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1000
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/M1151",
  "sourceTimestamp": "2024-12-05T12:02:42Z"
 },
 "M939 运兵卡车": {
  "page": "M939 Truck",
  "crew": "Transport: 13 players (1 driver, 12 passengers)",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/M939_Truck",
  "sourceTimestamp": "2024-12-05T11:35:37Z",
  "unarmed": true
 },
 "M113A3补给载具": {
  "page": "M113A3",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "M2A1",
    "caliber": "12.7 mm",
    "ammo": 500,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 500
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "C6",
    "caliber": "7.62 mm",
    "ammo": 1100,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1100
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/M113A3",
  "sourceTimestamp": "2024-12-14T06:01:05Z"
 },
 "M113A3 M2": {
  "page": "M113A3",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "M2A1",
    "caliber": "12.7 mm",
    "ammo": 500,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 500
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "C6",
    "caliber": "7.62 mm",
    "ammo": 1100,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1100
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/M113A3",
  "sourceTimestamp": "2024-12-14T06:01:05Z"
 },
 "M113A3 Mk19": {
  "page": "M113A3",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "M2A1",
    "caliber": "12.7 mm",
    "ammo": 500,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 500
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "C6",
    "caliber": "7.62 mm",
    "ammo": 1100,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1100
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/M113A3",
  "sourceTimestamp": "2024-12-14T06:01:05Z"
 },
 "M1064A3 M121迫击炮车": {
  "page": "M1064A3",
  "crew": "3",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "M120 120mm 迫击炮",
    "caliber": "120 mm",
    "ammo": null,
    "detail": "载具内迫击炮"
   },
   {
    "category": "Secondary Armament",
    "name": "M2A1",
    "caliber": "12.7 mm",
    "ammo": null,
    "detail": "开顶 .50 机枪"
   }
  ],
  "source": "https://squad.fandom.com/wiki/M1064A3",
  "sourceTimestamp": "2024-07-02T04:33:00Z"
 },
 "M2A3": {
  "page": "M2A3",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "M242 Bushmaster",
    "caliber": "25 mm",
    "ammo": 300,
    "ammoTypes": [
     {
      "type": "M919 Armor-Piercing Fin Stabilized Discarding Sabot-Tracer",
      "count": 70
     },
     {
      "type": "MK210 High Explosive Incendiary-Tracer",
      "count": 230
     }
    ]
   },
   {
    "category": "Guided Missile",
    "name": "BGM-71 TOW Anti-Tank Guided Missile",
    "caliber": "152 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "M240C",
    "caliber": "7.62 mm",
    "ammo": 1600,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1600
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/M2A3",
  "sourceTimestamp": "2025-09-19T11:58:47Z"
 },
 "M1A2": {
  "page": "M1A2",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "M256 120mm smoothbore gun",
    "caliber": "120 mm",
    "ammo": 42,
    "ammoTypes": [
     {
      "type": "M829A4 Armor-Piercing Fin-Stabilized Discarding Sabot",
      "count": 21
     },
     {
      "type": "M830A1 High Explosive Anti-Tank",
      "count": 21
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "M240",
    "caliber": "7.62 mm",
    "ammo": 2000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2000
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   },
   {
    "category": "Commander's HMG",
    "name": "M2A1 CROWS",
    "caliber": "12.7 mm",
    "ammo": 400,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 400
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/M1A2",
  "sourceTimestamp": "2025-03-21T04:00:13Z"
 },
 "UH-60M": {
  "page": "UH-60M",
  "crew": "",
  "armaments": [
   {
    "category": "Door Gun",
    "name": "M240H",
    "caliber": "7.62 mm",
    "ammo": 400,
    "detail": "2 挺，各 200 发"
   }
  ],
  "source": "https://squad.fandom.com/wiki/UH-60M",
  "sourceTimestamp": "2025-04-16T01:22:55Z"
 },
 "M1126遥控武器站 M240": {
  "page": "M1126",
  "crew": "11 players (1 driver, 1 gunner, 9 passengers)",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "M240B CROWS",
    "caliber": "7.62 mm",
    "ammo": 750,
    "detail": "CROWS 武器站"
   }
  ],
  "source": "https://squad.fandom.com/wiki/M1126",
  "sourceTimestamp": "2024-10-25T10:50:39Z"
 },
 "M1126 CROWS M2": {
  "page": "M1126",
  "crew": "11 players (1 driver, 1 gunner, 9 passengers)",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "M2A1 Browning CROWS",
    "caliber": "12.7 mm",
    "ammo": 400,
    "detail": "CROWS 武器站"
   }
  ],
  "source": "https://squad.fandom.com/wiki/M1126",
  "sourceTimestamp": "2024-10-25T10:50:39Z"
 },
 "M1128机动火炮系统": {
  "page": "M1128",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "M68A2 105mm Rifled Gun",
    "caliber": "105 mm",
    "ammo": 18,
    "ammoTypes": [
     {
      "type": "M900 Armor-Piercing Sabot",
      "count": 6
     },
     {
      "type": "M456A2 High Explosive Anti-Tank",
      "count": 10
     },
     {
      "type": "M416 White Phosphorus",
      "count": 2
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "M240C",
    "caliber": "7.62 mm",
    "ammo": 2000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2000
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/M1128",
  "sourceTimestamp": "2025-01-26T04:03:52Z"
 },
 "M-ATV M240": {
  "page": "M-ATV",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "M2A1 Browning",
    "caliber": "12.7 mm",
    "ammo": 1000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1000
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/M-ATV",
  "sourceTimestamp": "2024-12-05T12:19:40Z"
 },
 "M-ATV M2": {
  "page": "M-ATV",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "M2A1 Browning",
    "caliber": "12.7 mm",
    "ammo": 1000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1000
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/M-ATV",
  "sourceTimestamp": "2024-12-05T12:19:40Z"
 },
 "M-ATV Mk19": {
  "page": "M-ATV",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "M2A1 Browning",
    "caliber": "12.7 mm",
    "ammo": 1000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1000
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/M-ATV",
  "sourceTimestamp": "2024-12-05T12:19:40Z"
 },
 "M-ATV CROWS M2": {
  "page": "M-ATV",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "M2A1 Browning",
    "caliber": "12.7 mm",
    "ammo": 1000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1000
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/M-ATV",
  "sourceTimestamp": "2024-12-05T12:19:40Z"
 },
 "M-ATV M2HB“陶”": {
  "page": "M-ATV",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "M2A1 Browning",
    "caliber": "12.7 mm",
    "ammo": 1000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1000
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/M-ATV",
  "sourceTimestamp": "2024-12-05T12:19:40Z"
 },
 "M939 补给卡车": {
  "page": "M939 Truck",
  "crew": "Transport: 13 players (1 driver, 12 passengers)",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/M939_Truck",
  "sourceTimestamp": "2024-12-05T11:35:37Z",
  "unarmed": true
 },
 "M1151 Mk19": {
  "page": "M1151",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "M2HB Open Top",
    "caliber": ".50 BMG (12.7×99mm NATO)",
    "ammo": 1000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1000
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/M1151",
  "sourceTimestamp": "2024-12-05T12:02:42Z"
 },
 "M1151 CROWS M2": {
  "page": "M1151",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "M2HB Open Top",
    "caliber": ".50 BMG (12.7×99mm NATO)",
    "ammo": 1000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1000
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/M1151",
  "sourceTimestamp": "2024-12-05T12:02:42Z"
 },
 "M1151 陶氏反坦克导弹": {
  "page": "M1151",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "M2HB Open Top",
    "caliber": ".50 BMG (12.7×99mm NATO)",
    "ammo": 1000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1000
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/M1151",
  "sourceTimestamp": "2024-12-05T12:02:42Z"
 },
 "卡玛兹5320 运输卡车": {
  "page": "KamAZ 5350",
  "crew": "?",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/KamAZ_5350",
  "sourceTimestamp": "2024-05-22T18:23:18Z",
  "unarmed": true
 },
 "MT-LB 补给载具": {
  "page": "MT-LB",
  "crew": "19 players (1 driver, 1 gunner, 17 passengers)",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "PKT",
    "caliber": "7.62x54mmR",
    "ammo": 1375,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1375
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/MT-LB",
  "sourceTimestamp": "2026-04-13T22:00:37Z"
 },
 "MT-LB VMK": {
  "page": "MT-LB",
  "crew": "19 players (1 driver, 1 gunner, 17 passengers)",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "PKT",
    "caliber": "7.62x54mmR",
    "ammo": 1375,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1375
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/MT-LB",
  "sourceTimestamp": "2026-04-13T22:00:37Z"
 },
 "BMP-2M步兵战车": {
  "page": "BMP-2M",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "2A42",
    "caliber": "30 mm",
    "ammo": 500,
    "ammoTypes": [
     {
      "type": "3UBR8 Armor Piercing Discarding Sabot-Tracer",
      "count": 160
     },
     {
      "type": "3UOR6 High Explosive-Tracer",
      "count": 340
     }
    ]
   },
   {
    "category": "Missile Launcher",
    "name": "9M133 Kornet",
    "caliber": "160 mm",
    "ammo": 4,
    "ammoTypes": [
     {
      "type": "Beam-Riding Guided Missile",
      "count": 4
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "PKT",
    "caliber": "7.62 mm",
    "ammo": 2000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2000
     }
    ]
   },
   {
    "category": "Tertiary Armament",
    "name": "AGS-30",
    "caliber": "30 mm",
    "ammo": 120,
    "ammoTypes": [
     {
      "type": "GPD-30 Fragmentation",
      "count": 120
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/BMP-2M",
  "sourceTimestamp": "2025-09-19T11:36:02Z"
 },
 "BMP-3M步兵战车": {
  "page": "BMP-3M",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "2A72",
    "caliber": "30 mm",
    "ammo": 500,
    "ammoTypes": [
     {
      "type": "3UBR8 Armor-Piercing",
      "count": 195
     },
     {
      "type": "3UOR6 HE-T High Explosive Fragmentation",
      "count": 305
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "2A70",
    "caliber": "100 mm",
    "ammo": 25,
    "ammoTypes": [
     {
      "type": "3UOF19 High Explosive Fragmentation",
      "count": 22
     },
     {
      "type": "9M117 Bastion Anti-Tank Guided Missile",
      "count": 3
     }
    ]
   },
   {
    "category": "Tertiary Armament",
    "name": "PKT",
    "caliber": "7.62 mm",
    "ammo": 3000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 3000
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/BMP-3M",
  "sourceTimestamp": "2025-09-19T11:43:24Z"
 },
 "T-72B3主战坦克": {
  "page": "T-72",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "125 mm 2A46M-5 smoothbore gun",
    "caliber": "125 mm",
    "ammo": 41,
    "ammoTypes": [
     {
      "type": "3BM60 Armor-Piercing Fin Stabilized Discarding Sabot (APFSDS)",
      "count": 20
     },
     {
      "type": "3BK29M High Explosive Anti-Tank (HEAT)",
      "count": 10
     },
     {
      "type": "3OF82 Fragmentation",
      "count": 9
     },
     {
      "type": "9M119M Refleks Anti-Tank Guided Missile",
      "count": 2
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "PKT",
    "caliber": "7.62 mm",
    "ammo": 2000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2000
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   },
   {
    "category": "Commander's HMG",
    "name": "NSVT (Remote-Control, Stabilized)",
    "caliber": "12.7 mm",
    "ammo": 300,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 300
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/T-72",
  "sourceTimestamp": "2025-09-19T11:30:52Z"
 },
 "米-8河马": {
  "page": "Mi-8",
  "crew": "",
  "armaments": [
   {
    "category": "Door Gun",
    "name": "PKP",
    "caliber": "7.62 mm",
    "ammo": 1600,
    "detail": "2 挺，各 8×100 发"
   }
  ],
  "source": "https://squad.fandom.com/wiki/Mi-8",
  "sourceTimestamp": "2025-09-19T16:09:30Z"
 },
 "橡皮艇 PKP": {
  "page": "RHIB",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "",
    "caliber": "",
    "ammo": null,
    "ammoTypes": []
   }
  ],
  "source": "https://squad.fandom.com/wiki/RHIB",
  "sourceTimestamp": "2024-06-02T14:20:40Z"
 },
 "橡皮艇 NSV": {
  "page": "RHIB",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "",
    "caliber": "",
    "ammo": null,
    "ammoTypes": []
   }
  ],
  "source": "https://squad.fandom.com/wiki/RHIB",
  "sourceTimestamp": "2024-06-02T14:20:40Z"
 },
 "卡玛兹5320运输卡车": {
  "page": "KamAZ 5350",
  "crew": "?",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/KamAZ_5350",
  "sourceTimestamp": "2024-05-22T18:23:18Z",
  "unarmed": true
 },
 "卡玛兹5320补给卡车": {
  "page": "KamAZ 5350",
  "crew": "?",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/KamAZ_5350",
  "sourceTimestamp": "2024-05-22T18:23:18Z",
  "unarmed": true
 },
 "虎-M-Kord重机枪型": {
  "page": "Tigr-M",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "Kord Open Top",
    "caliber": "12.7×108mm",
    "ammo": 1000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1000
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/Tigr-M",
  "sourceTimestamp": "2026-02-09T00:29:31Z"
 },
 "BTR-80": {
  "page": "BTR-80",
  "crew": "13 players (1 driver, 1 gunner, 1 commander, 7 passengers)",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "KPVT",
    "caliber": "14,5 mm",
    "ammo": 450,
    "ammoTypes": [
     {
      "type": "KPVT BZT Armor-Piercing Incendiary",
      "count": 450
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "PKT",
    "caliber": "7.62 mm",
    "ammo": 1250,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1250
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/BTR-80",
  "sourceTimestamp": "2025-09-19T11:44:24Z"
 },
 "BTR-82A步兵战车": {
  "page": "BTR-82A",
  "crew": "10 players (1 driver, 1 gunner, 1 commander, 7 passengers)",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "2A72",
    "caliber": "30x165mm",
    "ammo": 300,
    "ammoTypes": [
     {
      "type": "3UBR8 Armor Piercing Discarding Sabot-Tracer",
      "count": 150
     },
     {
      "type": "3UOR6 High Explosive-Tracer",
      "count": 150
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "PKT",
    "caliber": "7.62x54 mmR",
    "ammo": 2000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2000
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/BTR-82A",
  "sourceTimestamp": "2025-09-19T11:55:33Z"
 },
 "T-90A主战坦克": {
  "page": "T-90A",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "125 mm",
    "caliber": "125mm",
    "ammo": 41,
    "ammoTypes": [
     {
      "type": "3BM60 Armor-Piercing",
      "count": 20
     },
     {
      "type": "3BK29M High Explosive",
      "count": 10
     },
     {
      "type": "3OF82 Fragmentation",
      "count": 9
     },
     {
      "type": "9M119M Refleks",
      "count": 2
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "PKT",
    "caliber": "7.62 mm",
    "ammo": 2000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2000
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   },
   {
    "category": "Commander's HMG",
    "name": "NSVT",
    "caliber": "12.7 mm",
    "ammo": 300,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 300
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/T-90A",
  "sourceTimestamp": "2026-01-15T00:32:03Z"
 },
 "虎式-M AGS-17榴弹发射器型": {
  "page": "Tigr-M",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "Kord Open Top",
    "caliber": "12.7×108mm",
    "ammo": 1000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1000
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/Tigr-M",
  "sourceTimestamp": "2026-02-09T00:29:31Z"
 },
 "Tigr-M遥控武器站 Kord": {
  "page": "Tigr-M",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "Kord Open Top",
    "caliber": "12.7×108mm",
    "ammo": 1000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1000
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/Tigr-M",
  "sourceTimestamp": "2026-02-09T00:29:31Z"
 },
 "BRDM-2装甲侦察车": {
  "page": "BRDM-2",
  "crew": "3 players (1 driver, 1 gunner, 1 commander)",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "KPVT",
    "caliber": "14.5 mm",
    "ammo": 450,
    "ammoTypes": [
     {
      "type": "KPVT BZT Armor-Piercing Incendiary",
      "count": 450
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "PKT",
    "caliber": "7.62 mm",
    "ammo": 1250,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1250
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/BRDM-2",
  "sourceTimestamp": "2026-04-13T21:04:05Z"
 },
 "BRDM-2“拱肩”": {
  "page": "BRDM-2",
  "crew": "3 players (1 driver, 1 gunner, 1 commander)",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "KPVT",
    "caliber": "14.5 mm",
    "ammo": 450,
    "ammoTypes": [
     {
      "type": "KPVT BZT Armor-Piercing Incendiary",
      "count": 450
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "PKT",
    "caliber": "7.62 mm",
    "ammo": 1250,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1250
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/BRDM-2",
  "sourceTimestamp": "2026-04-13T21:04:05Z"
 },
 "卡玛兹5320 补给卡车": {
  "page": "KamAZ 5350",
  "crew": "?",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/KamAZ_5350",
  "sourceTimestamp": "2024-05-22T18:23:18Z",
  "unarmed": true
 },
 "虎-M - Kord重机枪型": {
  "page": "Tigr-M",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "Kord Open Top",
    "caliber": "12.7×108mm",
    "ammo": 1000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1000
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/Tigr-M",
  "sourceTimestamp": "2026-02-09T00:29:31Z"
 },
 "Tigr-M 遥控武器站 Kord": {
  "page": "Tigr-M",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "Kord Open Top",
    "caliber": "12.7×108mm",
    "ammo": 1000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1000
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/Tigr-M",
  "sourceTimestamp": "2026-02-09T00:29:31Z"
 },
 "BMP-2步兵战车": {
  "page": "BMP-2",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "2A42",
    "caliber": "30 mm",
    "ammo": 500,
    "ammoTypes": [
     {
      "type": "3UBR8 Armor Piercing Discarding Sabot-Tracer",
      "count": 160
     },
     {
      "type": "3UOR6 High Explosive-Tracer",
      "count": 340
     }
    ]
   },
   {
    "category": "Missile Launcher",
    "name": "9M113 Konkurs",
    "caliber": "135 mm",
    "ammo": 4,
    "ammoTypes": [
     {
      "type": "Guided Missile",
      "count": 4
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "PKT",
    "caliber": "7.62 mm",
    "ammo": 2000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2000
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/BMP-2",
  "sourceTimestamp": "2026-04-16T20:16:20Z"
 },
 "T-90A 主战坦克": {
  "page": "T-90A",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "125 mm",
    "caliber": "125mm",
    "ammo": 41,
    "ammoTypes": [
     {
      "type": "3BM60 Armor-Piercing",
      "count": 20
     },
     {
      "type": "3BK29M High Explosive",
      "count": 10
     },
     {
      "type": "3OF82 Fragmentation",
      "count": 9
     },
     {
      "type": "9M119M Refleks",
      "count": 2
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "PKT",
    "caliber": "7.62 mm",
    "ammo": 2000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2000
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   },
   {
    "category": "Commander's HMG",
    "name": "NSVT",
    "caliber": "12.7 mm",
    "ammo": 300,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 300
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/T-90A",
  "sourceTimestamp": "2026-01-15T00:32:03Z"
 },
 "米-8 河马": {
  "page": "Mi-8",
  "crew": "",
  "armaments": [
   {
    "category": "Door Gun",
    "name": "PKP",
    "caliber": "7.62 mm",
    "ammo": 1600,
    "detail": "2 挺，各 8×100 发"
   }
  ],
  "source": "https://squad.fandom.com/wiki/Mi-8",
  "sourceTimestamp": "2025-09-19T16:09:30Z"
 },
 "BRDM-2装甲侦查车": {
  "page": "BRDM-2",
  "crew": "3 players (1 driver, 1 gunner, 1 commander)",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "KPVT",
    "caliber": "14.5 mm",
    "ammo": 450,
    "ammoTypes": [
     {
      "type": "KPVT BZT Armor-Piercing Incendiary",
      "count": 450
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "PKT",
    "caliber": "7.62 mm",
    "ammo": 1250,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1250
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/BRDM-2",
  "sourceTimestamp": "2026-04-13T21:04:05Z"
 },
 "MT-LBM 6MA装甲运兵车": {
  "page": "MT-LBM",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "KPVT",
    "caliber": "14.5×114mm",
    "ammo": 450,
    "ammoTypes": [
     {
      "type": "KPVT BZT Armor-Piercing Incendiary",
      "count": 450
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "PKT",
    "caliber": "7.62x54mmR",
    "ammo": 1375,
    "ammoTypes": [
     {
      "type": "PKT Coaxial Medium Machine Gun",
      "count": 1375
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/MT-LBM",
  "sourceTimestamp": "2026-04-13T23:03:37Z"
 },
 "MT-LBM 6MB": {
  "page": "MT-LBM",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "KPVT",
    "caliber": "14.5×114mm",
    "ammo": 450,
    "ammoTypes": [
     {
      "type": "KPVT BZT Armor-Piercing Incendiary",
      "count": 450
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "PKT",
    "caliber": "7.62x54mmR",
    "ammo": 1375,
    "ammoTypes": [
     {
      "type": "PKT Coaxial Medium Machine Gun",
      "count": 1375
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/MT-LBM",
  "sourceTimestamp": "2026-04-13T23:03:37Z"
 },
 "BTR-D装甲补给车": {
  "page": "BTR-D",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "2x PKT, only shooting forwards",
    "caliber": "7.62 mm",
    "ammo": 2000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2000
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/BTR-D",
  "sourceTimestamp": "2025-11-10T20:34:31Z"
 },
 "BTR-D Kord重机枪": {
  "page": "BTR-D",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "2x PKT, only shooting forwards",
    "caliber": "7.62 mm",
    "ammo": 2000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2000
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/BTR-D",
  "sourceTimestamp": "2025-11-10T20:34:31Z"
 },
 "BTR-D AGS-17 榴弹发射器型": {
  "page": "BTR-D",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "2x PKT, only shooting forwards",
    "caliber": "7.62 mm",
    "ammo": 2000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2000
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/BTR-D",
  "sourceTimestamp": "2025-11-10T20:34:31Z"
 },
 "BTR-ZD \"锉刀\"防空车": {
  "page": "BTR-ZD",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "ZU-23-2",
    "caliber": "23 mm",
    "ammo": 1000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1000
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "Kord Open top",
    "caliber": "12.7 mm",
    "ammo": 1000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1000
     }
    ]
   },
   {
    "category": "Tertiary Armament",
    "name": "2x PKT, only shooting forwards",
    "caliber": "7.62 mm",
    "ammo": 2000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2000
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/BTR-ZD",
  "sourceTimestamp": "2024-12-27T16:17:21Z"
 },
 "BTR-MDM": {
  "page": "BTR-MDM",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "PKT RWS",
    "caliber": "7.62 mm",
    "ammo": 2000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2000
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "Hull-mounted PKT",
    "caliber": "7.62 mm",
    "ammo": null,
    "ammoTypes": []
   }
  ],
  "source": "https://squad.fandom.com/wiki/BTR-MDM",
  "sourceTimestamp": "2025-06-30T00:47:13Z"
 },
 "BMD-4M伞兵战车": {
  "page": "BMD-4M",
  "crew": "3",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "2A72",
    "caliber": "30 mm",
    "ammo": 300,
    "ammoTypes": [
     {
      "type": "3UBR8 Armor-Piercing",
      "count": 150
     },
     {
      "type": "3UOR6 High Explosive Fragmentation Tracer",
      "count": 150
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "2A70",
    "caliber": "100 mm",
    "ammo": 26,
    "ammoTypes": [
     {
      "type": "3UOF19 High Explosive Fragmentation",
      "count": 23
     },
     {
      "type": "9M117 Bastion Anti-Tank Guided Missile",
      "count": 3
     }
    ]
   },
   {
    "category": "Tertiary Armament",
    "name": "PKT",
    "caliber": "7.62 mm",
    "ammo": 3000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 3000
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/BMD-4M",
  "sourceTimestamp": "2025-09-19T11:42:29Z"
 },
 "T-72B3 主战坦克": {
  "page": "T-72",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "125 mm 2A46M-5 smoothbore gun",
    "caliber": "125 mm",
    "ammo": 41,
    "ammoTypes": [
     {
      "type": "3BM60 Armor-Piercing Fin Stabilized Discarding Sabot (APFSDS)",
      "count": 20
     },
     {
      "type": "3BK29M High Explosive Anti-Tank (HEAT)",
      "count": 10
     },
     {
      "type": "3OF82 Fragmentation",
      "count": 9
     },
     {
      "type": "9M119M Refleks Anti-Tank Guided Missile",
      "count": 2
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "PKT",
    "caliber": "7.62 mm",
    "ammo": 2000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2000
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   },
   {
    "category": "Commander's HMG",
    "name": "NSVT (Remote-Control, Stabilized)",
    "caliber": "12.7 mm",
    "ammo": 300,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 300
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/T-72",
  "sourceTimestamp": "2025-09-19T11:30:52Z"
 },
 "Mi-8": {
  "page": "Mi-8",
  "crew": "",
  "armaments": [
   {
    "category": "Door Gun",
    "name": "PKP",
    "caliber": "7.62 mm",
    "ammo": 1600,
    "detail": "2 挺，各 8×100 发"
   }
  ],
  "source": "https://squad.fandom.com/wiki/Mi-8",
  "sourceTimestamp": "2025-09-19T16:09:30Z"
 },
 "章鱼-SDM1": {
  "page": "Sprut-SDM1",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "2A45 125mm Smoothbore Gun",
    "caliber": "125 mm",
    "ammo": 36,
    "ammoTypes": [
     {
      "type": "3BM60 AP Armor-Piercing Sabot",
      "count": 14
     },
     {
      "type": "3BK29M High Explosive Anti-Tank",
      "count": 6
     },
     {
      "type": "3OF82 Fragmentation",
      "count": 14
     },
     {
      "type": "9M119M Refleks Anti-Tank Guided Missile",
      "count": 2
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "PKT",
    "caliber": "7.62 mm",
    "ammo": 2000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2000
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/Sprut-SDM1",
  "sourceTimestamp": "2025-01-26T04:04:37Z"
 },
 "BTR-ZD“锉刀”防空车": {
  "page": "BTR-ZD",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "ZU-23-2",
    "caliber": "23 mm",
    "ammo": 1000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1000
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "Kord Open top",
    "caliber": "12.7 mm",
    "ammo": 1000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1000
     }
    ]
   },
   {
    "category": "Tertiary Armament",
    "name": "2x PKT, only shooting forwards",
    "caliber": "7.62 mm",
    "ammo": 2000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2000
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/BTR-ZD",
  "sourceTimestamp": "2024-12-27T16:17:21Z"
 },
 "BMD-1M伞兵战车": {
  "page": "BMD-1M",
  "crew": "3",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "2A28",
    "caliber": "73 mm",
    "ammo": 41,
    "ammoTypes": [
     {
      "type": "PG-15V High Explosive Anti-Tank",
      "count": 24
     },
     {
      "type": "OG-15V Fragmentation",
      "count": 17
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "PKT",
    "caliber": "7.62 mm",
    "ammo": 3000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 3000
     }
    ]
   },
   {
    "category": "Tertiary Armament",
    "name": "2x PKT for hull gunners, only shooting forwards",
    "caliber": "7.62 mm",
    "ammo": null,
    "ammoTypes": []
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/BMD-1M",
  "sourceTimestamp": "2024-06-21T14:26:32Z"
 },
 "HX60 运兵卡": {
  "page": "MAN HX",
  "crew": "Transport: 18 players (1 driver, 17 passengers)",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/MAN_HX",
  "sourceTimestamp": "2026-04-18T11:43:00Z",
  "unarmed": true
 },
 "HX60 补给卡车": {
  "page": "MAN HX",
  "crew": "Transport: 18 players (1 driver, 17 passengers)",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/MAN_HX",
  "sourceTimestamp": "2026-04-18T11:43:00Z",
  "unarmed": true
 },
 "FV432 L37A2 遥控武器站": {
  "page": "FV432",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "L111A1 Heavy Machine Gun",
    "caliber": ".50 BMG (12.7×99mm NATO)",
    "ammo": 1000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1000
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/FV432",
  "sourceTimestamp": "2026-04-18T12:00:56Z"
 },
 "FV432 L111A1 遥控武器站": {
  "page": "FV432",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "L111A1 Heavy Machine Gun",
    "caliber": ".50 BMG (12.7×99mm NATO)",
    "ammo": 1000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1000
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/FV432",
  "sourceTimestamp": "2026-04-18T12:00:56Z"
 },
 "FV107装甲侦察车": {
  "page": "FV107",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "L21A1 RARDEN",
    "caliber": "30 mm",
    "ammo": 168,
    "ammoTypes": [
     {
      "type": "NM225 Armor-Piercing Sabot",
      "count": 84
     },
     {
      "type": "NM232 High Explosive Tracer",
      "count": 84
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "L94A1 EX-34",
    "caliber": "7.62 mm",
    "ammo": 3750,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 3750
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/FV107",
  "sourceTimestamp": "2025-06-25T20:50:10Z"
 },
 "FV510 步兵战车": {
  "page": "FV510",
  "crew": "2 players (1 driver, 1 gunner, 9 passengers)",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "L21A1 RARDEN Autocannon",
    "caliber": "30 mm",
    "ammo": 228,
    "ammoTypes": [
     {
      "type": "NM225 Armor-Piercing Discarding Sabot",
      "count": 114
     },
     {
      "type": "NM232 High Explosive Tracer",
      "count": 114
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "L94A1 EX-34",
    "caliber": "7.62 mm",
    "ammo": 2500,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2500
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/FV510",
  "sourceTimestamp": "2025-09-19T11:38:03Z"
 },
 "FV510 附加装甲": {
  "page": "FV510",
  "crew": "2 players (1 driver, 1 gunner, 9 passengers)",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "L21A1 RARDEN Autocannon",
    "caliber": "30 mm",
    "ammo": 228,
    "ammoTypes": [
     {
      "type": "NM225 Armor-Piercing Discarding Sabot",
      "count": 114
     },
     {
      "type": "NM232 High Explosive Tracer",
      "count": 114
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "L94A1 EX-34",
    "caliber": "7.62 mm",
    "ammo": 2500,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2500
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/FV510",
  "sourceTimestamp": "2025-09-19T11:38:03Z"
 },
 "FV4034": {
  "page": "FV4034",
  "crew": "4",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "Royal Ordnance L30A1 120mm rifled gun",
    "caliber": "120 mm",
    "ammo": 47,
    "ammoTypes": [
     {
      "type": "L27A1 CHARM 3 Armor-Piercing Fin Stabilized Discarding Sabot (APFSDS)",
      "count": 25
     },
     {
      "type": "L31A7 High Explosive Squash Head (HESH)",
      "count": 16
     },
     {
      "type": "L34 White Phosphorus (Smoke)",
      "count": 6
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "L94A1",
    "caliber": "7.62 mm",
    "ammo": 2000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2000
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/FV4034",
  "sourceTimestamp": "2025-09-19T11:38:26Z"
 },
 "SA330": {
  "page": "SA330",
  "crew": "",
  "armaments": [
   {
    "category": "Door Gun",
    "name": "M240H",
    "caliber": "7.62 mm",
    "ammo": 2000,
    "detail": "2 挺，各 5×200 发"
   }
  ],
  "source": "https://squad.fandom.com/wiki/SA330",
  "sourceTimestamp": "2025-04-16T01:55:03Z"
 },
 "HX60运兵卡车": {
  "page": "MAN HX",
  "crew": "Transport: 18 players (1 driver, 17 passengers)",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/MAN_HX",
  "sourceTimestamp": "2026-04-18T11:43:00Z",
  "unarmed": true
 },
 "HX60补给卡车": {
  "page": "MAN HX",
  "crew": "Transport: 18 players (1 driver, 17 passengers)",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/MAN_HX",
  "sourceTimestamp": "2026-04-18T11:43:00Z",
  "unarmed": true
 },
 "FV432 L11A1": {
  "page": "FV432",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "L111A1 Heavy Machine Gun",
    "caliber": ".50 BMG (12.7×99mm NATO)",
    "ammo": 1000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1000
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/FV432",
  "sourceTimestamp": "2026-04-18T12:00:56Z"
 },
 "FV432 L11A1遥控武器站": {
  "page": "FV432",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "L111A1 Heavy Machine Gun",
    "caliber": ".50 BMG (12.7×99mm NATO)",
    "ammo": 1000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1000
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/FV432",
  "sourceTimestamp": "2026-04-18T12:00:56Z"
 },
 "HX60运兵卡": {
  "page": "MAN HX",
  "crew": "Transport: 18 players (1 driver, 17 passengers)",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/MAN_HX",
  "sourceTimestamp": "2026-04-18T11:43:00Z",
  "unarmed": true
 },
 "FV432 L37A2遥控武器站": {
  "page": "FV432",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "L111A1 Heavy Machine Gun",
    "caliber": ".50 BMG (12.7×99mm NATO)",
    "ammo": 1000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1000
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/FV432",
  "sourceTimestamp": "2026-04-18T12:00:56Z"
 },
 "MSVS 运兵卡车": {
  "page": "MSVS",
  "crew": "",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/MSVS",
  "sourceTimestamp": "2024-05-22T18:26:08Z",
  "unarmed": true
 },
 "MSVS 补给卡车": {
  "page": "MSVS",
  "crew": "",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/MSVS",
  "sourceTimestamp": "2024-05-22T18:26:08Z",
  "unarmed": true
 },
 "TAPV装甲巡逻车": {
  "page": "TAPV",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "C16",
    "caliber": "40mm",
    "ammo": 45,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 45
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "C6",
    "caliber": "7.62×51mm",
    "ammo": 1000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1000
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/TAPV",
  "sourceTimestamp": "2025-06-28T03:27:09Z"
 },
 "LAV 6": {
  "page": "LAV 6.0",
  "crew": "3",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "M242 Bushmaster",
    "caliber": "25 mm",
    "ammo": 275,
    "ammoTypes": [
     {
      "type": "M919 Armor Piercing Fin Stabilized Discarding Sabot-Tracer",
      "count": 75
     },
     {
      "type": "MK210 High Explosive-Incendiary Tracer",
      "count": 200
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "C6",
    "caliber": "7.62 mm",
    "ammo": 440,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 440
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/LAV_6.0",
  "sourceTimestamp": "2025-09-19T11:36:26Z"
 },
 "豹2A6M CAN": {
  "page": "Leopard 2A6M",
  "crew": "4",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "Rheinmetall Rh-120 L/55",
    "caliber": "120 mm",
    "ammo": 42,
    "ammoTypes": [
     {
      "type": "DM53 Armor-Piercing Fin Stabilized Discarding Sabot (APFSDS)",
      "count": 21
     },
     {
      "type": "DM12 High Explosive Anti-Tank (HEAT)",
      "count": 21
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "C6",
    "caliber": "7.62 mm",
    "ammo": 2000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2000
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/Leopard_2A6M",
  "sourceTimestamp": "2025-01-30T13:02:28Z"
 },
 "CH-146": {
  "page": "CH-146",
  "crew": "",
  "armaments": [
   {
    "category": "Door Gun",
    "name": "C6A1",
    "caliber": "7.62 mm",
    "ammo": 2000,
    "detail": "2 挺，各 5×200 发"
   }
  ],
  "source": "https://squad.fandom.com/wiki/CH-146",
  "sourceTimestamp": "2026-02-01T16:42:55Z"
 },
 "TAPV 装甲巡逻车": {
  "page": "TAPV",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "C16",
    "caliber": "40mm",
    "ammo": 45,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 45
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "C6",
    "caliber": "7.62×51mm",
    "ammo": 1000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1000
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/TAPV",
  "sourceTimestamp": "2025-06-28T03:27:09Z"
 },
 "郊狼侦察车": {
  "page": "Coyote",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "M242 Bushmaster",
    "caliber": "25 mm",
    "ammo": 210,
    "ammoTypes": [
     {
      "type": "M919 Armor Piercing Fin Stabilized Discarding Sabot-Tracer",
      "count": 75
     },
     {
      "type": "MK210 High Explosive-Incendiary Tracer",
      "count": 135
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "C6",
    "caliber": "7.62 mm",
    "ammo": 440,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 440
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/Coyote",
  "sourceTimestamp": "2025-09-19T11:40:38Z"
 },
 "豹 2A6M CAN": {
  "page": "Leopard 2A6M",
  "crew": "4",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "Rheinmetall Rh-120 L/55",
    "caliber": "120 mm",
    "ammo": 42,
    "ammoTypes": [
     {
      "type": "DM53 Armor-Piercing Fin Stabilized Discarding Sabot (APFSDS)",
      "count": 21
     },
     {
      "type": "DM12 High Explosive Anti-Tank (HEAT)",
      "count": 21
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "C6",
    "caliber": "7.62 mm",
    "ammo": 2000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2000
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/Leopard_2A6M",
  "sourceTimestamp": "2025-01-30T13:02:28Z"
 },
 "MSVS运兵卡车": {
  "page": "MSVS",
  "crew": "",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/MSVS",
  "sourceTimestamp": "2024-05-22T18:26:08Z",
  "unarmed": true
 },
 "MSVS补给卡车": {
  "page": "MSVS",
  "crew": "",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/MSVS",
  "sourceTimestamp": "2024-05-22T18:26:08Z",
  "unarmed": true
 },
 "LAV III C6遥控武器站": {
  "page": "LAV III",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "M2A1 Heavy Machine Gun",
    "caliber": ".50 BMG (12.7×99mm NATO)",
    "ammo": 400,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 400
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "C6 Mounted Machine Gun",
    "caliber": "7.62x51mm",
    "ammo": 2500,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2500
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/LAV_III",
  "sourceTimestamp": "2024-06-21T14:23:01Z"
 },
 "M113A3 TLAV": {
  "page": "M113A3",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "M2A1",
    "caliber": "12.7 mm",
    "ammo": 500,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 500
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "C6",
    "caliber": "7.62 mm",
    "ammo": 1100,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1100
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/M113A3",
  "sourceTimestamp": "2024-12-14T06:01:05Z"
 },
 "CH-146 近距离支援型": {
  "page": "CH-146",
  "crew": "",
  "armaments": [
   {
    "category": "Door Gun",
    "name": "GAU-21 / Minigun",
    "caliber": "12.7 / 7.62 mm",
    "ammo": null,
    "detail": "CAS 武装型"
   }
  ],
  "source": "https://squad.fandom.com/wiki/CH-146",
  "sourceTimestamp": "2026-02-01T16:42:55Z"
 },
 "CTM131运输型 QJZ89": {
  "page": "CTM131",
  "crew": "?",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/CTM131",
  "sourceTimestamp": "2024-06-21T14:31:10Z"
 },
 "CTM131补给型": {
  "page": "CTM131",
  "crew": "?",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/CTM131",
  "sourceTimestamp": "2024-06-21T14:31:10Z"
 },
 "ZSL92A装甲运输车 QLZ89": {
  "page": "ZSL92",
  "crew": "?",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/ZSL92",
  "sourceTimestamp": "2026-02-19T00:34:34Z"
 },
 "ZSL92A装甲运输车 QLZ87": {
  "page": "ZSL92",
  "crew": "?",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/ZSL92",
  "sourceTimestamp": "2026-02-19T00:34:34Z"
 },
 "ZSL92装甲运输车": {
  "page": "ZSL92",
  "crew": "?",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/ZSL92",
  "sourceTimestamp": "2026-02-19T00:34:34Z"
 },
 "ZBL08步兵战车": {
  "page": "ZBL08",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "ZPT99A",
    "caliber": "30 mm",
    "ammo": 460,
    "ammoTypes": [
     {
      "type": "DTC041A-30 Armor-Piercing Sabot",
      "count": 160
     },
     {
      "type": "DTB02-30 High Explosive Fragmentation",
      "count": 300
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "QJT02",
    "caliber": "5.8 mm",
    "ammo": null,
    "ammoTypes": []
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/ZBL08",
  "sourceTimestamp": "2026-02-19T00:25:48Z"
 },
 "ZTZ99A主战坦克": {
  "page": "ZTZ99A",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "ZPT98A 125mm Smoothbore Gun",
    "caliber": "125 mm",
    "ammo": 43,
    "ammoTypes": [
     {
      "type": "DTC10-125 Armor-Piercing Sabot",
      "count": 15
     },
     {
      "type": "DTP10-125 High Explosive Anti-Tank",
      "count": 12
     },
     {
      "type": "DTB12-125 High Explosive",
      "count": 12
     },
     {
      "type": "APS201-125 Anti-Tank Guided Missile",
      "count": 4
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "QJT02",
    "caliber": "5.8 mm",
    "ammo": 2000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2000
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/ZTZ99A",
  "sourceTimestamp": "2025-01-30T13:17:33Z"
 },
 "Z-8G运输直升机": {
  "page": "Z-8",
  "crew": "",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/Z-8",
  "sourceTimestamp": "2026-02-19T01:00:18Z",
  "unarmed": true
 },
 "橡皮艇 QJY88": {
  "page": "RHIB",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "",
    "caliber": "",
    "ammo": null,
    "ammoTypes": []
   }
  ],
  "source": "https://squad.fandom.com/wiki/RHIB",
  "sourceTimestamp": "2024-06-02T14:20:40Z"
 },
 "橡皮艇 QJZ89": {
  "page": "RHIB",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "",
    "caliber": "",
    "ammo": null,
    "ammoTypes": []
   }
  ],
  "source": "https://squad.fandom.com/wiki/RHIB",
  "sourceTimestamp": "2024-06-02T14:20:40Z"
 },
 "ZSD89装甲运输车 QJZ89": {
  "page": "ZSD89",
  "crew": "?",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/ZSD89",
  "sourceTimestamp": "2026-02-19T00:41:41Z"
 },
 "ZSD89装甲运输车 QLZ87": {
  "page": "ZSD89",
  "crew": "?",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/ZSD89",
  "sourceTimestamp": "2026-02-19T00:41:41Z"
 },
 "ZSD89II装甲运输车": {
  "page": "ZSD89",
  "crew": "?",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/ZSD89",
  "sourceTimestamp": "2026-02-19T00:41:41Z"
 },
 "CTM131运输型 QJY88": {
  "page": "CTM131",
  "crew": "?",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/CTM131",
  "sourceTimestamp": "2024-06-21T14:31:10Z"
 },
 "“山猫”全地形车运输型": {
  "page": "CSK131",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "QJY88",
    "caliber": "5.8mm GPMG",
    "ammo": null,
    "ammoTypes": []
   }
  ],
  "source": "https://squad.fandom.com/wiki/CSK131",
  "sourceTimestamp": "2024-12-05T12:20:37Z"
 },
 "“山猫”全地形车补给型": {
  "page": "CSK131",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "QJY88",
    "caliber": "5.8mm GPMG",
    "ammo": null,
    "ammoTypes": []
   }
  ],
  "source": "https://squad.fandom.com/wiki/CSK131",
  "sourceTimestamp": "2024-12-05T12:20:37Z"
 },
 "“山猫”全地形车运输型 QJZ89": {
  "page": "CSK131",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "QJY88",
    "caliber": "5.8mm GPMG",
    "ammo": null,
    "ammoTypes": []
   }
  ],
  "source": "https://squad.fandom.com/wiki/CSK131",
  "sourceTimestamp": "2024-12-05T12:20:37Z"
 },
 "“山猫”全地形车运输型 QLZ87": {
  "page": "CSK131",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "QJY88",
    "caliber": "5.8mm GPMG",
    "ammo": null,
    "ammoTypes": []
   }
  ],
  "source": "https://squad.fandom.com/wiki/CSK131",
  "sourceTimestamp": "2024-12-05T12:20:37Z"
 },
 "CSK131 QJZ89": {
  "page": "CSK131",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "QJY88",
    "caliber": "5.8mm GPMG",
    "ammo": null,
    "ammoTypes": []
   }
  ],
  "source": "https://squad.fandom.com/wiki/CSK131",
  "sourceTimestamp": "2024-12-05T12:20:37Z"
 },
 "CSK131 QLZ87": {
  "page": "CSK131",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "QJY88",
    "caliber": "5.8mm GPMG",
    "ammo": null,
    "ammoTypes": []
   }
  ],
  "source": "https://squad.fandom.com/wiki/CSK131",
  "sourceTimestamp": "2024-12-05T12:20:37Z"
 },
 "CSK131 HJ8": {
  "page": "CSK131",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "QJY88",
    "caliber": "5.8mm GPMG",
    "ammo": null,
    "ammoTypes": []
   }
  ],
  "source": "https://squad.fandom.com/wiki/CSK131",
  "sourceTimestamp": "2024-12-05T12:20:37Z"
 },
 "CTM131 运输型 QJZ89": {
  "page": "CTM131",
  "crew": "?",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/CTM131",
  "sourceTimestamp": "2024-06-21T14:31:10Z"
 },
 "CTM131 补给型": {
  "page": "CTM131",
  "crew": "?",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/CTM131",
  "sourceTimestamp": "2024-06-21T14:31:10Z"
 },
 "CSK131 QJY88": {
  "page": "CSK131",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "QJY88",
    "caliber": "5.8mm GPMG",
    "ammo": null,
    "ammoTypes": []
   }
  ],
  "source": "https://squad.fandom.com/wiki/CSK131",
  "sourceTimestamp": "2024-12-05T12:20:37Z"
 },
 "\"山猫\" 全地形车运输型 QJZ89": {
  "page": "CSK131",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "QJY88",
    "caliber": "5.8mm GPMG",
    "ammo": null,
    "ammoTypes": []
   }
  ],
  "source": "https://squad.fandom.com/wiki/CSK131",
  "sourceTimestamp": "2024-12-05T12:20:37Z"
 },
 "\"山猫\" 全地形车运输型 QLZ87": {
  "page": "CSK131",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "QJY88",
    "caliber": "5.8mm GPMG",
    "ammo": null,
    "ammoTypes": []
   }
  ],
  "source": "https://squad.fandom.com/wiki/CSK131",
  "sourceTimestamp": "2024-12-05T12:20:37Z"
 },
 "CSK131 QJC88 RWS": {
  "page": "CSK131",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "QJY88",
    "caliber": "5.8mm GPMG",
    "ammo": null,
    "ammoTypes": []
   }
  ],
  "source": "https://squad.fandom.com/wiki/CSK131",
  "sourceTimestamp": "2024-12-05T12:20:37Z"
 },
 "ZTZ99A 主战坦克": {
  "page": "ZTZ99A",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "ZPT98A 125mm Smoothbore Gun",
    "caliber": "125 mm",
    "ammo": 43,
    "ammoTypes": [
     {
      "type": "DTC10-125 Armor-Piercing Sabot",
      "count": 15
     },
     {
      "type": "DTP10-125 High Explosive Anti-Tank",
      "count": 12
     },
     {
      "type": "DTB12-125 High Explosive",
      "count": 12
     },
     {
      "type": "APS201-125 Anti-Tank Guided Missile",
      "count": 4
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "QJT02",
    "caliber": "5.8 mm",
    "ammo": 2000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2000
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/ZTZ99A",
  "sourceTimestamp": "2025-01-30T13:17:33Z"
 },
 "Z-8G 运输直升机": {
  "page": "Z-8",
  "crew": "",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/Z-8",
  "sourceTimestamp": "2026-02-19T01:00:18Z",
  "unarmed": true
 },
 "Z-9A 运输直升机": {
  "page": "Z-9",
  "crew": "",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/Z-9",
  "sourceTimestamp": "2026-02-19T01:01:25Z",
  "unarmed": true
 },
 "ZBL08 步兵战车": {
  "page": "ZBL08",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "ZPT99A",
    "caliber": "30 mm",
    "ammo": 460,
    "ammoTypes": [
     {
      "type": "DTC041A-30 Armor-Piercing Sabot",
      "count": 160
     },
     {
      "type": "DTB02-30 High Explosive Fragmentation",
      "count": 300
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "QJT02",
    "caliber": "5.8 mm",
    "ammo": null,
    "ammoTypes": []
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/ZBL08",
  "sourceTimestamp": "2026-02-19T00:25:48Z"
 },
 "ZBD04A 步兵战车": {
  "page": "ZBD04A",
  "crew": "3",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "ZPT99",
    "caliber": "30 mm",
    "ammo": 500,
    "ammoTypes": [
     {
      "type": "DTC10-30 Armor-Piercing",
      "count": 200
     },
     {
      "type": "DTB02-30 High Explosive Fragmentation",
      "count": 300
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "2A70",
    "caliber": "100 mm",
    "ammo": 25,
    "ammoTypes": [
     {
      "type": "DTB02-100 High Explosive Fragmentation",
      "count": 22
     },
     {
      "type": "APS03-100 Anti-Tank Guided Missile",
      "count": 3
     }
    ]
   },
   {
    "category": "Tertiary Armament",
    "name": "QJT02",
    "caliber": "5.8 mm",
    "ammo": 3000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 3000
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/ZBD04A",
  "sourceTimestamp": "2025-09-19T11:41:36Z"
 },
 "ZSL10装甲运输车 QJZ89": {
  "page": "ZSL10",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "QJZ89",
    "caliber": "12,7 mm",
    "ammo": 10,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 10
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/ZSL10",
  "sourceTimestamp": "2024-12-14T05:59:09Z"
 },
 "ZSD05 补给型": {
  "page": "ZSD05",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "QJZ89",
    "caliber": "12,7 mm",
    "ammo": 10,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 10
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/ZSD05",
  "sourceTimestamp": "2024-12-14T06:13:32Z"
 },
 "ZSD05 两栖装甲输送车": {
  "page": "ZSD05",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "QJZ89",
    "caliber": "12,7 mm",
    "ammo": 10,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 10
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/ZSD05",
  "sourceTimestamp": "2024-12-14T06:13:32Z"
 },
 "ZBD05两栖步战车": {
  "page": "ZBD05",
  "crew": "3",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "ZPT99",
    "caliber": "30 mm",
    "ammo": 500,
    "ammoTypes": [
     {
      "type": "DTC041A-30 Armor-Piercing Sabot",
      "count": 200
     },
     {
      "type": "DTB02-30 High Explosive Fragmentation",
      "count": 300
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "QJT02",
    "caliber": "5.8 mm",
    "ammo": 3000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 3000
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/ZBD05",
  "sourceTimestamp": "2025-09-19T11:42:13Z"
 },
 "ZLT05两栖突击炮": {
  "page": "ZTD05",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "ZPL98A 105mm Rifled Gun",
    "caliber": "105 mm",
    "ammo": 40,
    "ammoTypes": [
     {
      "type": "DTC02-105 Armor-Piercing Sabot",
      "count": 12
     },
     {
      "type": "DTP04-105 High Explosive Anti-Tank",
      "count": 8
     },
     {
      "type": "DTB02-105 Fragmentaion",
      "count": 20
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "QJT02",
    "caliber": "5.8 mm",
    "ammo": 2500,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2500
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/ZTD05",
  "sourceTimestamp": "2025-01-26T04:01:37Z"
 },
 "ZSD05补给型": {
  "page": "ZSD05",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "QJZ89",
    "caliber": "12,7 mm",
    "ammo": 10,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 10
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/ZSD05",
  "sourceTimestamp": "2024-12-14T06:13:32Z"
 },
 "ZSD05两栖装甲输送车": {
  "page": "ZSD05",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "QJZ89",
    "caliber": "12,7 mm",
    "ammo": 10,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 10
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/ZSD05",
  "sourceTimestamp": "2024-12-14T06:13:32Z"
 },
 "CTM131 QJZ89": {
  "page": "CTM131",
  "crew": "?",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/CTM131",
  "sourceTimestamp": "2024-06-21T14:31:10Z"
 },
 "ZSL10轮式运兵车": {
  "page": "ZSL10",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "QJZ89",
    "caliber": "12,7 mm",
    "ammo": 10,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 10
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/ZSL10",
  "sourceTimestamp": "2024-12-14T05:59:09Z"
 },
 "Z-8J运输直升机": {
  "page": "Z-8",
  "crew": "",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/Z-8",
  "sourceTimestamp": "2026-02-19T01:00:18Z",
  "unarmed": true
 },
 "ZLT05 两栖突击炮": {
  "page": "ZTD05",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "ZPL98A 105mm Rifled Gun",
    "caliber": "105 mm",
    "ammo": 40,
    "ammoTypes": [
     {
      "type": "DTC02-105 Armor-Piercing Sabot",
      "count": 12
     },
     {
      "type": "DTP04-105 High Explosive Anti-Tank",
      "count": 8
     },
     {
      "type": "DTB02-105 Fragmentaion",
      "count": 20
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "QJT02",
    "caliber": "5.8 mm",
    "ammo": 2500,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2500
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/ZTD05",
  "sourceTimestamp": "2025-01-26T04:01:37Z"
 },
 "Z-8J 运输直升机": {
  "page": "Z-8",
  "crew": "",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/Z-8",
  "sourceTimestamp": "2026-02-19T01:00:18Z",
  "unarmed": true
 },
 "PMV Mag58": {
  "page": "Bushmaster PMV",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "Mag58",
    "caliber": "7.62 mm",
    "ammo": 2500,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2500
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/Bushmaster_PMV",
  "sourceTimestamp": "2024-05-19T07:05:26Z"
 },
 "ASLAV": {
  "page": "ASLAV-25",
  "crew": "3",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "M242 Bushmaster",
    "caliber": "25 mm",
    "ammo": 300,
    "ammoTypes": [
     {
      "type": "M919 Armor-Piercing Sabot",
      "count": 70
     },
     {
      "type": "MK210 High Explosive Incendiary",
      "count": 230
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "FN MAG",
    "caliber": "7.62 mm",
    "ammo": 1600,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1600
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "76mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/ASLAV-25",
  "sourceTimestamp": "2025-09-19T11:39:25Z"
 },
 "MRH-90": {
  "page": "MRH-90",
  "crew": "",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/MRH-90",
  "sourceTimestamp": "2025-04-16T01:44:39Z"
 },
 "HX60 运兵卡车": {
  "page": "MAN HX",
  "crew": "Transport: 18 players (1 driver, 17 passengers)",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/MAN_HX",
  "sourceTimestamp": "2026-04-18T11:43:00Z",
  "unarmed": true
 },
 "PMV 遥控武器站 M2": {
  "page": "Bushmaster PMV",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "Mag58",
    "caliber": "7.62 mm",
    "ammo": 2500,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2500
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/Bushmaster_PMV",
  "sourceTimestamp": "2024-05-19T07:05:26Z"
 },
 "KrAZ-6322 运兵卡": {
  "page": "KrAZ-6322",
  "crew": "",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/KrAZ-6322",
  "sourceTimestamp": "2026-04-13T20:25:41Z",
  "unarmed": true
 },
 "MTLB 运输车": {
  "page": "MT-LBM",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "KPVT",
    "caliber": "14.5×114mm",
    "ammo": 450,
    "ammoTypes": [
     {
      "type": "KPVT BZT Armor-Piercing Incendiary",
      "count": 450
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "PKT",
    "caliber": "7.62x54mmR",
    "ammo": 1375,
    "ammoTypes": [
     {
      "type": "PKT Coaxial Medium Machine Gun",
      "count": 1375
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/MT-LBM",
  "sourceTimestamp": "2026-04-13T23:03:37Z"
 },
 "BMP-1TS": {
  "page": "BMP-1",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "2A28 Grom",
    "caliber": "73 mm",
    "ammo": 40,
    "ammoTypes": [
     {
      "type": "PG-2000V High Explosive Anti-Tank",
      "count": 24
     },
     {
      "type": "OG-15V Fragmentation",
      "count": 16
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "PKT",
    "caliber": "7.62 mm",
    "ammo": 200,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 200
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/BMP-1",
  "sourceTimestamp": "2026-04-13T23:11:58Z"
 },
 "KrAZ-6322 BM-21 \"冰雹\"": {
  "page": "KrAZ-6322",
  "crew": "",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/KrAZ-6322",
  "sourceTimestamp": "2026-04-13T20:25:41Z",
  "unarmed": true
 },
 "T-64BM2": {
  "page": "T-64",
  "crew": "",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/T-64",
  "sourceTimestamp": "2026-04-13T23:14:04Z"
 },
 "橡皮艇 DShK": {
  "page": "RHIB",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "",
    "caliber": "",
    "ammo": null,
    "ammoTypes": []
   }
  ],
  "source": "https://squad.fandom.com/wiki/RHIB",
  "sourceTimestamp": "2024-06-02T14:20:40Z"
 },
 "橡皮艇 PKM": {
  "page": "RHIB",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "",
    "caliber": "",
    "ammo": null,
    "ammoTypes": []
   }
  ],
  "source": "https://squad.fandom.com/wiki/RHIB",
  "sourceTimestamp": "2024-06-02T14:20:40Z"
 },
 "KrAZ-6322 补给卡": {
  "page": "KrAZ-6322",
  "crew": "",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/KrAZ-6322",
  "sourceTimestamp": "2026-04-13T20:25:41Z",
  "unarmed": true
 },
 "Kozak-2M1 NSV 重机枪型": {
  "page": "Kozak-2M1",
  "crew": "",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/Kozak-2M1",
  "sourceTimestamp": "2026-04-13T20:30:39Z"
 },
 "BTR-4": {
  "page": "BTR-4",
  "crew": "",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/BTR-4",
  "sourceTimestamp": "2026-02-14T02:30:34Z"
 },
 "KrAZ-6322 BM-21 “冰雹”": {
  "page": "KrAZ-6322",
  "crew": "",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/KrAZ-6322",
  "sourceTimestamp": "2026-04-13T20:25:41Z",
  "unarmed": true
 },
 "KrAZ-6322运兵卡车": {
  "page": "KrAZ-6322",
  "crew": "",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/KrAZ-6322",
  "sourceTimestamp": "2026-04-13T20:25:41Z",
  "unarmed": true
 },
 "MTLB运输车": {
  "page": "MT-LBM",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "KPVT",
    "caliber": "14.5×114mm",
    "ammo": 450,
    "ammoTypes": [
     {
      "type": "KPVT BZT Armor-Piercing Incendiary",
      "count": 450
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "PKT",
    "caliber": "7.62x54mmR",
    "ammo": 1375,
    "ammoTypes": [
     {
      "type": "PKT Coaxial Medium Machine Gun",
      "count": 1375
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/MT-LBM",
  "sourceTimestamp": "2026-04-13T23:03:37Z"
 },
 "MTLB PKT": {
  "page": "MT-LBM",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "KPVT",
    "caliber": "14.5×114mm",
    "ammo": 450,
    "ammoTypes": [
     {
      "type": "KPVT BZT Armor-Piercing Incendiary",
      "count": 450
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "PKT",
    "caliber": "7.62x54mmR",
    "ammo": 1375,
    "ammoTypes": [
     {
      "type": "PKT Coaxial Medium Machine Gun",
      "count": 1375
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/MT-LBM",
  "sourceTimestamp": "2026-04-13T23:03:37Z"
 },
 "BMP-1": {
  "page": "BMP-1",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "2A28 Grom",
    "caliber": "73 mm",
    "ammo": 40,
    "ammoTypes": [
     {
      "type": "PG-2000V High Explosive Anti-Tank",
      "count": 24
     },
     {
      "type": "OG-15V Fragmentation",
      "count": 16
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "PKT",
    "caliber": "7.62 mm",
    "ammo": 200,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 200
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/BMP-1",
  "sourceTimestamp": "2026-04-13T23:11:58Z"
 },
 "KrAZ-6322 BM-21“冰雹”": {
  "page": "KrAZ-6322",
  "crew": "",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/KrAZ-6322",
  "sourceTimestamp": "2026-04-13T20:25:41Z",
  "unarmed": true
 },
 "KrAZ-6322运兵卡": {
  "page": "KrAZ-6322",
  "crew": "",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/KrAZ-6322",
  "sourceTimestamp": "2026-04-13T20:25:41Z",
  "unarmed": true
 },
 "KrAZ-6322补给卡": {
  "page": "KrAZ-6322",
  "crew": "",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/KrAZ-6322",
  "sourceTimestamp": "2026-04-13T20:25:41Z",
  "unarmed": true
 },
 "Kozak-2M1 NSV重机枪型": {
  "page": "Kozak-2M1",
  "crew": "",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/Kozak-2M1",
  "sourceTimestamp": "2026-04-13T20:30:39Z"
 },
 "Kozak-2M1 AGS-17榴弹发射器型": {
  "page": "Kozak-2M1",
  "crew": "",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/Kozak-2M1",
  "sourceTimestamp": "2026-04-13T20:30:39Z"
 },
 "BRDM-2L1": {
  "page": "BRDM-2",
  "crew": "3 players (1 driver, 1 gunner, 1 commander)",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "KPVT",
    "caliber": "14.5 mm",
    "ammo": 450,
    "ammoTypes": [
     {
      "type": "KPVT BZT Armor-Piercing Incendiary",
      "count": 450
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "PKT",
    "caliber": "7.62 mm",
    "ammo": 1250,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1250
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/BRDM-2",
  "sourceTimestamp": "2026-04-13T21:04:05Z"
 },
 "改装皮卡车 短号": {
  "page": "Technical",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "DShK Open Top",
    "caliber": "12.7 mm",
    "ammo": null,
    "ammoTypes": []
   }
  ],
  "source": "https://squad.fandom.com/wiki/Technical",
  "sourceTimestamp": "2025-11-08T18:49:38Z"
 },
 "MTLB ZU23": {
  "page": "MT-LBM",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "KPVT",
    "caliber": "14.5×114mm",
    "ammo": 450,
    "ammoTypes": [
     {
      "type": "KPVT BZT Armor-Piercing Incendiary",
      "count": 450
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "PKT",
    "caliber": "7.62x54mmR",
    "ammo": 1375,
    "ammoTypes": [
     {
      "type": "PKT Coaxial Medium Machine Gun",
      "count": 1375
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/MT-LBM",
  "sourceTimestamp": "2026-04-13T23:03:37Z"
 },
 "Kozak-2M1 AGS-17 榴弹发射器型": {
  "page": "Kozak-2M1",
  "crew": "",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/Kozak-2M1",
  "sourceTimestamp": "2026-04-13T20:30:39Z"
 },
 "BMC-185 运兵卡车": {
  "page": "KrAZ-6322",
  "crew": "",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/KrAZ-6322",
  "sourceTimestamp": "2026-04-13T20:25:41Z",
  "unarmed": true
 },
 "M113A2 补给车": {
  "page": "M113A3",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "M2A1",
    "caliber": "12.7 mm",
    "ammo": 500,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 500
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "C6",
    "caliber": "7.62 mm",
    "ammo": 1100,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1100
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/M113A3",
  "sourceTimestamp": "2024-12-14T06:01:05Z"
 },
 "ACV-15 MG3": {
  "page": "ACV-15",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "M242 Bushmaster",
    "caliber": "25 mm",
    "ammo": 300,
    "ammoTypes": [
     {
      "type": "M252 Armor-Piercing Sabot",
      "count": 70
     },
     {
      "type": "M252 High Explosive",
      "count": 230
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "M240C",
    "caliber": "7.62 mm",
    "ammo": 2000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2000
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/ACV-15",
  "sourceTimestamp": "2025-09-19T11:55:59Z"
 },
 "ACV-15 M2": {
  "page": "ACV-15",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "M242 Bushmaster",
    "caliber": "25 mm",
    "ammo": 300,
    "ammoTypes": [
     {
      "type": "M252 Armor-Piercing Sabot",
      "count": 70
     },
     {
      "type": "M252 High Explosive",
      "count": 230
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "M240C",
    "caliber": "7.62 mm",
    "ammo": 2000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2000
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/ACV-15",
  "sourceTimestamp": "2025-09-19T11:55:59Z"
 },
 "ACV-15 25毫米": {
  "page": "ACV-15",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "M242 Bushmaster",
    "caliber": "25 mm",
    "ammo": 300,
    "ammoTypes": [
     {
      "type": "M252 Armor-Piercing Sabot",
      "count": 70
     },
     {
      "type": "M252 High Explosive",
      "count": 230
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "M240C",
    "caliber": "7.62 mm",
    "ammo": 2000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2000
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/ACV-15",
  "sourceTimestamp": "2025-09-19T11:55:59Z"
 },
 "M113A2T M121自行迫击炮": {
  "page": "M113A3",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "M2A1",
    "caliber": "12.7 mm",
    "ammo": 500,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 500
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "C6",
    "caliber": "7.62 mm",
    "ammo": 1100,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1100
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/M113A3",
  "sourceTimestamp": "2024-12-14T06:01:05Z"
 },
 "M60T": {
  "page": "M60T",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "IMI MG253 smoothbore cannon",
    "caliber": "120 mm",
    "ammo": 42,
    "ammoTypes": [
     {
      "type": "M322 Armor-Piercing Sabot",
      "count": 21
     },
     {
      "type": "M339 High Explosive",
      "count": 21
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "M240",
    "caliber": "7.62 mm",
    "ammo": 2000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2000
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   },
   {
    "category": "Commander's HMG",
    "name": "M85 machine gun",
    "caliber": "12.7x99 mm",
    "ammo": 400,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 400
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/M60T",
  "sourceTimestamp": "2025-01-30T13:11:20Z"
 },
 "UH60 PKM": {
  "page": "UH-60M",
  "crew": "",
  "armaments": [
   {
    "category": "Door Gun",
    "name": "PKM",
    "caliber": "7.62 mm",
    "ammo": 1600,
    "detail": "2 挺，各 8×100 发"
   }
  ],
  "source": "https://squad.fandom.com/wiki/UH-60M",
  "sourceTimestamp": "2025-04-16T01:22:55Z"
 },
 "橡皮艇 MG3": {
  "page": "RHIB",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "",
    "caliber": "",
    "ammo": null,
    "ammoTypes": []
   }
  ],
  "source": "https://squad.fandom.com/wiki/RHIB",
  "sourceTimestamp": "2024-06-02T14:20:40Z"
 },
 "BMC-185运兵卡车": {
  "page": "KrAZ-6322",
  "crew": "",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/KrAZ-6322",
  "sourceTimestamp": "2026-04-13T20:25:41Z",
  "unarmed": true
 },
 "BMC-185补给卡车": {
  "page": "KrAZ-6322",
  "crew": "",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/KrAZ-6322",
  "sourceTimestamp": "2026-04-13T20:25:41Z",
  "unarmed": true
 },
 "PARS III Mk19遥控武器站": {
  "page": "PARS III",
  "crew": "3",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "M242 Bushmaster",
    "caliber": "25 mm",
    "ammo": 300,
    "ammoTypes": [
     {
      "type": "M252 Armor-Piercing Sabot",
      "count": 70
     },
     {
      "type": "M252 High Explosive",
      "count": 230
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "M240C",
    "caliber": "7.62 mm",
    "ammo": 800,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 800
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/PARS_III",
  "sourceTimestamp": "2025-09-19T11:57:16Z"
 },
 "PARS III MG3遥控武器站": {
  "page": "PARS III",
  "crew": "3",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "M242 Bushmaster",
    "caliber": "25 mm",
    "ammo": 300,
    "ammoTypes": [
     {
      "type": "M252 Armor-Piercing Sabot",
      "count": 70
     },
     {
      "type": "M252 High Explosive",
      "count": 230
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "M240C",
    "caliber": "7.62 mm",
    "ammo": 800,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 800
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/PARS_III",
  "sourceTimestamp": "2025-09-19T11:57:16Z"
 },
 "PARS III M2 RWS": {
  "page": "PARS III",
  "crew": "3",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "M242 Bushmaster",
    "caliber": "25 mm",
    "ammo": 300,
    "ammoTypes": [
     {
      "type": "M252 Armor-Piercing Sabot",
      "count": 70
     },
     {
      "type": "M252 High Explosive",
      "count": 230
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "M240C",
    "caliber": "7.62 mm",
    "ammo": 800,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 800
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/PARS_III",
  "sourceTimestamp": "2025-09-19T11:57:16Z"
 },
 "PARS III 25mm": {
  "page": "PARS III",
  "crew": "3",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "M242 Bushmaster",
    "caliber": "25 mm",
    "ammo": 300,
    "ammoTypes": [
     {
      "type": "M252 Armor-Piercing Sabot",
      "count": 70
     },
     {
      "type": "M252 High Explosive",
      "count": 230
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "M240C",
    "caliber": "7.62 mm",
    "ammo": 800,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 800
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/PARS_III",
  "sourceTimestamp": "2025-09-19T11:57:16Z"
 },
 "BMC-185 补给卡车": {
  "page": "KrAZ-6322",
  "crew": "",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/KrAZ-6322",
  "sourceTimestamp": "2026-04-13T20:25:41Z",
  "unarmed": true
 },
 "Cobra II M2": {
  "page": "Cobra-II",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "M2A1 RWS",
    "caliber": "12.7 mm",
    "ammo": 400,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 400
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/Cobra-II",
  "sourceTimestamp": "2025-06-28T03:23:21Z"
 },
 "Cobra II M2 遥控武器站": {
  "page": "Cobra-II",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "M2A1 RWS",
    "caliber": "12.7 mm",
    "ammo": 400,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 400
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/Cobra-II",
  "sourceTimestamp": "2025-06-28T03:23:21Z"
 },
 "Cobra II MG3": {
  "page": "Cobra-II",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "M2A1 RWS",
    "caliber": "12.7 mm",
    "ammo": 400,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 400
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/Cobra-II",
  "sourceTimestamp": "2025-06-28T03:23:21Z"
 },
 "Ural-4320 运兵卡": {
  "page": "URAL 4320",
  "crew": "Transport: 18 players (1 driver, 17 passengers)",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/URAL_4320",
  "sourceTimestamp": "2025-09-19T11:57:44Z",
  "unarmed": true
 },
 "MTLB 6MA UB-32": {
  "page": "MT-LBM",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "KPVT",
    "caliber": "14.5×114mm",
    "ammo": 450,
    "ammoTypes": [
     {
      "type": "KPVT BZT Armor-Piercing Incendiary",
      "count": 450
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "PKT",
    "caliber": "7.62x54mmR",
    "ammo": 1375,
    "ammoTypes": [
     {
      "type": "PKT Coaxial Medium Machine Gun",
      "count": 1375
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/MT-LBM",
  "sourceTimestamp": "2026-04-13T23:03:37Z"
 },
 "T-72S": {
  "page": "T-72",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "125 mm 2A46M-5 smoothbore gun",
    "caliber": "125 mm",
    "ammo": 41,
    "ammoTypes": [
     {
      "type": "3BM60 Armor-Piercing Fin Stabilized Discarding Sabot (APFSDS)",
      "count": 20
     },
     {
      "type": "3BK29M High Explosive Anti-Tank (HEAT)",
      "count": 10
     },
     {
      "type": "3OF82 Fragmentation",
      "count": 9
     },
     {
      "type": "9M119M Refleks Anti-Tank Guided Missile",
      "count": 2
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "PKT",
    "caliber": "7.62 mm",
    "ammo": 2000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2000
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   },
   {
    "category": "Commander's HMG",
    "name": "NSVT (Remote-Control, Stabilized)",
    "caliber": "12.7 mm",
    "ammo": 300,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 300
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/T-72",
  "sourceTimestamp": "2025-09-19T11:30:52Z"
 },
 "UH-1H MG3": {
  "page": "UH-1",
  "crew": "",
  "armaments": [
   {
    "category": "Door Gun",
    "name": "MG3",
    "caliber": "7.62 mm",
    "ammo": null,
    "detail": "舱门机枪"
   }
  ],
  "source": "https://squad.fandom.com/wiki/UH-1",
  "sourceTimestamp": "2025-04-16T01:29:49Z"
 },
 "Ural-4320运兵卡车": {
  "page": "URAL 4320",
  "crew": "Transport: 18 players (1 driver, 17 passengers)",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/URAL_4320",
  "sourceTimestamp": "2025-09-19T11:57:44Z",
  "unarmed": true
 },
 "MT-LB补给载具": {
  "page": "MT-LB",
  "crew": "19 players (1 driver, 1 gunner, 17 passengers)",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "PKT",
    "caliber": "7.62x54mmR",
    "ammo": 1375,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1375
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/MT-LB",
  "sourceTimestamp": "2026-04-13T22:00:37Z"
 },
 "T-62": {
  "page": "T-62",
  "crew": "4",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "115 mm U-5TS smoothbore gun",
    "caliber": "115 mm",
    "ammo": 40,
    "ammoTypes": [
     {
      "type": "3BM-4 Armor-Piercing Sabot",
      "count": 12
     },
     {
      "type": "BK-4M High Explosive Anti-Tank",
      "count": 8
     },
     {
      "type": "OF-11 Fragmentation",
      "count": 20
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "PKT",
    "caliber": "7.62 mm",
    "ammo": 2000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2000
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/T-62",
  "sourceTimestamp": "2026-02-06T19:21:36Z"
 },
 "Ural-4320运兵卡": {
  "page": "URAL 4320",
  "crew": "Transport: 18 players (1 driver, 17 passengers)",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/URAL_4320",
  "sourceTimestamp": "2025-09-19T11:57:44Z",
  "unarmed": true
 },
 "萨菲尔高机动运输车": {
  "page": "Safir",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "MG3",
    "caliber": "7.62×51mm NATO",
    "ammo": 6,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 6
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/Safir",
  "sourceTimestamp": "2025-09-19T11:15:49Z"
 },
 "萨菲尔高机动车 短号": {
  "page": "Safir",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "MG3",
    "caliber": "7.62×51mm NATO",
    "ammo": 6,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 6
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/Safir",
  "sourceTimestamp": "2025-09-19T11:15:49Z"
 },
 "M1151陶氏反坦克导弹": {
  "page": "M1151",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "M2HB Open Top",
    "caliber": ".50 BMG (12.7×99mm NATO)",
    "ammo": 1000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1000
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/M1151",
  "sourceTimestamp": "2024-12-05T12:02:42Z"
 },
 "BRDM-2 UB-32": {
  "page": "BRDM-2",
  "crew": "3 players (1 driver, 1 gunner, 1 commander)",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "KPVT",
    "caliber": "14.5 mm",
    "ammo": 450,
    "ammoTypes": [
     {
      "type": "KPVT BZT Armor-Piercing Incendiary",
      "count": 450
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "PKT",
    "caliber": "7.62 mm",
    "ammo": 1250,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1250
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/BRDM-2",
  "sourceTimestamp": "2026-04-13T21:04:05Z"
 },
 "Ural-4320 运输车": {
  "page": "URAL 4320",
  "crew": "Transport: 18 players (1 driver, 17 passengers)",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/URAL_4320",
  "sourceTimestamp": "2025-09-19T11:57:44Z",
  "unarmed": true
 },
 "萨菲尔高机动车 Kord": {
  "page": "Safir",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "MG3",
    "caliber": "7.62×51mm NATO",
    "ammo": 6,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 6
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/Safir",
  "sourceTimestamp": "2025-09-19T11:15:49Z"
 },
 "Ural-4320运输车": {
  "page": "URAL 4320",
  "crew": "Transport: 18 players (1 driver, 17 passengers)",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/URAL_4320",
  "sourceTimestamp": "2025-09-19T11:57:44Z",
  "unarmed": true
 },
 "乌拉尔-375D 运输车": {
  "page": "URAL 375D",
  "crew": "",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/URAL_375D",
  "sourceTimestamp": "2024-05-22T18:27:37Z",
  "unarmed": true
 },
 "Ural-375D 运输车": {
  "page": "URAL 375D",
  "crew": "",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/URAL_375D",
  "sourceTimestamp": "2024-05-22T18:27:37Z",
  "unarmed": true
 },
 "MT-LB ZU-23-2": {
  "page": "MT-LB",
  "crew": "19 players (1 driver, 1 gunner, 17 passengers)",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "PKT",
    "caliber": "7.62x54mmR",
    "ammo": 1375,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1375
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/MT-LB",
  "sourceTimestamp": "2026-04-13T22:00:37Z"
 },
 "乌拉尔-375D BM-21 \"冰雹\"": {
  "page": "URAL 375D",
  "crew": "",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/URAL_375D",
  "sourceTimestamp": "2024-05-22T18:27:37Z",
  "unarmed": true
 },
 "T72A": {
  "page": "T-72",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "125 mm 2A46M-5 smoothbore gun",
    "caliber": "125 mm",
    "ammo": 41,
    "ammoTypes": [
     {
      "type": "3BM60 Armor-Piercing Fin Stabilized Discarding Sabot (APFSDS)",
      "count": 20
     },
     {
      "type": "3BK29M High Explosive Anti-Tank (HEAT)",
      "count": 10
     },
     {
      "type": "3OF82 Fragmentation",
      "count": 9
     },
     {
      "type": "9M119M Refleks Anti-Tank Guided Missile",
      "count": 2
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "PKT",
    "caliber": "7.62 mm",
    "ammo": 2000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2000
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   },
   {
    "category": "Commander's HMG",
    "name": "NSVT (Remote-Control, Stabilized)",
    "caliber": "12.7 mm",
    "ammo": 300,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 300
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/T-72",
  "sourceTimestamp": "2025-09-19T11:30:52Z"
 },
 "明斯克400摩托车": {
  "page": "Minsk 400",
  "crew": "2 players (1 driver, 1 passenger)",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/Minsk_400",
  "sourceTimestamp": "2024-05-22T18:32:11Z",
  "unarmed": true
 },
 "现代补给皮卡": {
  "page": "Technical",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "DShK Open Top",
    "caliber": "12.7 mm",
    "ammo": null,
    "ammoTypes": []
   }
  ],
  "source": "https://squad.fandom.com/wiki/Technical",
  "sourceTimestamp": "2025-11-08T18:49:38Z"
 },
 "乌拉尔-375D ZU-23-2": {
  "page": "URAL 375D",
  "crew": "",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/URAL_375D",
  "sourceTimestamp": "2024-05-22T18:27:37Z",
  "unarmed": true
 },
 "乌拉尔-375D运输车": {
  "page": "URAL 375D",
  "crew": "",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/URAL_375D",
  "sourceTimestamp": "2024-05-22T18:27:37Z",
  "unarmed": true
 },
 "Ural-375D运输车": {
  "page": "URAL 375D",
  "crew": "",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/URAL_375D",
  "sourceTimestamp": "2024-05-22T18:27:37Z",
  "unarmed": true
 },
 "乌拉尔-375D BM-21“冰雹”": {
  "page": "URAL 375D",
  "crew": "",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/URAL_375D",
  "sourceTimestamp": "2024-05-22T18:27:37Z",
  "unarmed": true
 },
 "T-72A": {
  "page": "T-72",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "125 mm 2A46M-5 smoothbore gun",
    "caliber": "125 mm",
    "ammo": 41,
    "ammoTypes": [
     {
      "type": "3BM60 Armor-Piercing Fin Stabilized Discarding Sabot (APFSDS)",
      "count": 20
     },
     {
      "type": "3BK29M High Explosive Anti-Tank (HEAT)",
      "count": 10
     },
     {
      "type": "3OF82 Fragmentation",
      "count": 9
     },
     {
      "type": "9M119M Refleks Anti-Tank Guided Missile",
      "count": 2
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "PKT",
    "caliber": "7.62 mm",
    "ammo": 2000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2000
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   },
   {
    "category": "Commander's HMG",
    "name": "NSVT (Remote-Control, Stabilized)",
    "caliber": "12.7 mm",
    "ammo": 300,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 300
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/T-72",
  "sourceTimestamp": "2025-09-19T11:30:52Z"
 },
 "补给皮卡": {
  "page": "Technical",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "DShK Open Top",
    "caliber": "12.7 mm",
    "ammo": null,
    "ammoTypes": []
   }
  ],
  "source": "https://squad.fandom.com/wiki/Technical",
  "sourceTimestamp": "2025-11-08T18:49:38Z"
 },
 "改装皮卡车 重机枪": {
  "page": "Technical",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "DShK Open Top",
    "caliber": "12.7 mm",
    "ammo": null,
    "ammoTypes": []
   }
  ],
  "source": "https://squad.fandom.com/wiki/Technical",
  "sourceTimestamp": "2025-11-08T18:49:38Z"
 },
 "改装皮卡车 SPG-9": {
  "page": "Technical",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "DShK Open Top",
    "caliber": "12.7 mm",
    "ammo": null,
    "ammoTypes": []
   }
  ],
  "source": "https://squad.fandom.com/wiki/Technical",
  "sourceTimestamp": "2025-11-08T18:49:38Z"
 },
 "M1151改装皮卡车 DSHK": {
  "page": "M1151",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "M2HB Open Top",
    "caliber": ".50 BMG (12.7×99mm NATO)",
    "ammo": 1000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1000
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/M1151",
  "sourceTimestamp": "2024-12-05T12:02:42Z"
 },
 "改装皮卡车 UB-32": {
  "page": "Technical",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "DShK Open Top",
    "caliber": "12.7 mm",
    "ammo": null,
    "ammoTypes": []
   }
  ],
  "source": "https://squad.fandom.com/wiki/Technical",
  "sourceTimestamp": "2025-11-08T18:49:38Z"
 },
 "明斯克 400 摩托车": {
  "page": "Minsk 400",
  "crew": "2 players (1 driver, 1 passenger)",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/Minsk_400",
  "sourceTimestamp": "2024-05-22T18:32:11Z",
  "unarmed": true
 },
 "M1151 改装皮卡车 DSHK": {
  "page": "M1151",
  "crew": "?",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "M2HB Open Top",
    "caliber": ".50 BMG (12.7×99mm NATO)",
    "ammo": 1000,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1000
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/M1151",
  "sourceTimestamp": "2024-12-05T12:02:42Z"
 },
 "BRDM-2 装甲侦查车": {
  "page": "BRDM-2",
  "crew": "3 players (1 driver, 1 gunner, 1 commander)",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "KPVT",
    "caliber": "14.5 mm",
    "ammo": 450,
    "ammoTypes": [
     {
      "type": "KPVT BZT Armor-Piercing Incendiary",
      "count": 450
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "PKT",
    "caliber": "7.62 mm",
    "ammo": 1250,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1250
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/BRDM-2",
  "sourceTimestamp": "2026-04-13T21:04:05Z"
 },
 "改装皮卡车 BMP-1": {
  "page": "Technical",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "DShK Open Top",
    "caliber": "12.7 mm",
    "ammo": null,
    "ammoTypes": []
   }
  ],
  "source": "https://squad.fandom.com/wiki/Technical",
  "sourceTimestamp": "2025-11-08T18:49:38Z"
 },
 "改装皮卡车 ZU-23-2": {
  "page": "Technical",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "DShK Open Top",
    "caliber": "12.7 mm",
    "ammo": null,
    "ammoTypes": []
   }
  ],
  "source": "https://squad.fandom.com/wiki/Technical",
  "sourceTimestamp": "2025-11-08T18:49:38Z"
 },
 "MT-LB PKT": {
  "page": "MT-LB",
  "crew": "19 players (1 driver, 1 gunner, 17 passengers)",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "PKT",
    "caliber": "7.62x54mmR",
    "ammo": 1375,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1375
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/MT-LB",
  "sourceTimestamp": "2026-04-13T22:00:37Z"
 },
 "轻型运输车": {
  "page": "Technical",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "DShK Open Top",
    "caliber": "12.7 mm",
    "ammo": null,
    "ammoTypes": []
   }
  ],
  "source": "https://squad.fandom.com/wiki/Technical",
  "sourceTimestamp": "2025-11-08T18:49:38Z"
 },
 "改装皮卡补给车": {
  "page": "Technical",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "DShK Open Top",
    "caliber": "12.7 mm",
    "ammo": null,
    "ammoTypes": []
   }
  ],
  "source": "https://squad.fandom.com/wiki/Technical",
  "sourceTimestamp": "2025-11-08T18:49:38Z"
 },
 "轻型 FSV": {
  "page": "Technical",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "DShK Open Top",
    "caliber": "12.7 mm",
    "ammo": null,
    "ammoTypes": []
   }
  ],
  "source": "https://squad.fandom.com/wiki/Technical",
  "sourceTimestamp": "2025-11-08T18:49:38Z"
 },
 "M113A3": {
  "page": "M113A3",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "M2A1",
    "caliber": "12.7 mm",
    "ammo": 500,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 500
     }
    ]
   },
   {
    "category": "Secondary Armament",
    "name": "C6",
    "caliber": "7.62 mm",
    "ammo": 1100,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 1100
     }
    ]
   },
   {
    "category": "Countermeasure",
    "name": "Smoke Launcher",
    "caliber": "40 mm",
    "ammo": 2,
    "ammoTypes": [
     {
      "type": "其他",
      "count": 2
     }
    ]
   }
  ],
  "source": "https://squad.fandom.com/wiki/M113A3",
  "sourceTimestamp": "2024-12-14T06:01:05Z"
 },
 "护卫载具 运兵型": {
  "page": "Technical",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "DShK Open Top",
    "caliber": "12.7 mm",
    "ammo": null,
    "ammoTypes": []
   }
  ],
  "source": "https://squad.fandom.com/wiki/Technical",
  "sourceTimestamp": "2025-11-08T18:49:38Z"
 },
 "护卫载具 M134 转轮机枪": {
  "page": "Technical",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "DShK Open Top",
    "caliber": "12.7 mm",
    "ammo": null,
    "ammoTypes": []
   }
  ],
  "source": "https://squad.fandom.com/wiki/Technical",
  "sourceTimestamp": "2025-11-08T18:49:38Z"
 },
 "改装皮卡车 M2": {
  "page": "Technical",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "DShK Open Top",
    "caliber": "12.7 mm",
    "ammo": null,
    "ammoTypes": []
   }
  ],
  "source": "https://squad.fandom.com/wiki/Technical",
  "sourceTimestamp": "2025-11-08T18:49:38Z"
 },
 "M113A3 机动支援载具": {
  "page": "M113A3",
  "crew": "",
  "armaments": [],
  "source": "https://squad.fandom.com/wiki/M113A3",
  "sourceTimestamp": "2024-12-14T06:01:05Z",
  "unarmed": true
 },
 "改装皮卡车-迫击炮": {
  "page": "Technical",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "DShK Open Top",
    "caliber": "12.7 mm",
    "ammo": null,
    "ammoTypes": []
   }
  ],
  "source": "https://squad.fandom.com/wiki/Technical",
  "sourceTimestamp": "2025-11-08T18:49:38Z"
 },
 "渡鸦 运兵型": {
  "page": "CH-146",
  "crew": "",
  "armaments": [
   {
    "category": "Door Gun",
    "name": "M240H",
    "caliber": "7.62 mm",
    "ammo": 400,
    "detail": "2 挺，各 200 发"
   }
  ],
  "source": "https://squad.fandom.com/wiki/CH-146",
  "sourceTimestamp": "2026-02-01T16:42:55Z"
 },
 "橡皮艇 M134 转管机枪": {
  "page": "RHIB",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "",
    "caliber": "",
    "ammo": null,
    "ammoTypes": []
   }
  ],
  "source": "https://squad.fandom.com/wiki/RHIB",
  "sourceTimestamp": "2024-06-02T14:20:40Z"
 },
 "橡皮艇 Mk19": {
  "page": "RHIB",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "",
    "caliber": "",
    "ammo": null,
    "ammoTypes": []
   }
  ],
  "source": "https://squad.fandom.com/wiki/RHIB",
  "sourceTimestamp": "2024-06-02T14:20:40Z"
 },
 "改装皮卡车 迫击炮": {
  "page": "Technical",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "DShK Open Top",
    "caliber": "12.7 mm",
    "ammo": null,
    "ammoTypes": []
   }
  ],
  "source": "https://squad.fandom.com/wiki/Technical",
  "sourceTimestamp": "2025-11-08T18:49:38Z"
 },
 "护卫载具 M134转轮机枪": {
  "page": "Technical",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "DShK Open Top",
    "caliber": "12.7 mm",
    "ammo": null,
    "ammoTypes": []
   }
  ],
  "source": "https://squad.fandom.com/wiki/Technical",
  "sourceTimestamp": "2025-11-08T18:49:38Z"
 },
 "橡皮艇 M134转管机枪": {
  "page": "RHIB",
  "crew": "",
  "armaments": [
   {
    "category": "Main Armament",
    "name": "",
    "caliber": "",
    "ammo": null,
    "ammoTypes": []
   }
  ],
  "source": "https://squad.fandom.com/wiki/RHIB",
  "sourceTimestamp": "2024-06-02T14:20:40Z"
 }
}

export function getVehicleSpec(name) {
  return VEHICLE_SPECS[String(name || '').trim()] || null
}
