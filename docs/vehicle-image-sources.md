# 载具图片替换来源记录

> 用途：每张替换图的可追溯来源（日后复核 / 换图 / 授权确认）。
> 结构来源优先级：官方 Wiki / 官方更新页 → squadintelligence（社区，游戏文件提取）→ 同底盘兜底。

## 2026-10-25 批次（squadintelligence 直取）

图源站点：`https://squadintelligence.com`（Squad 社区 Wiki，数据取自游戏文件）
取图规则：`https://squadintelligence.com/icons/Images/<蓝图名>.webp`，每条均以其车辆页 `og:image` 交叉确认

| 车型（中文数据名） | 落入文件 | 蓝图名 | 来源页 |
|:-|:-|:-|:-|
| BMC-185 运兵卡车 | `v2/bmc_185_trans_infocard.webp` | `BP_TLF_Util_Truck` | https://squadintelligence.com/vehicles/BP_TLF_Util_Truck |
| BMC-185 补给卡车 | `v2/bmc_185_logi_infocard.webp` | `BP_TLF_Util_Truck_Logi` | https://squadintelligence.com/vehicles/BP_TLF_Util_Truck_Logi |
| BMP-1TS | `v2/bmp_1ts_infocard.webp` | `BP_BMP1TS_AFU` | https://squadintelligence.com/vehicles/BP_BMP1TS_AFU |
| “山猫”全地形车运输型 | `v2/lynx_atv_trans_infocard.webp` | `BP_LynxATV` | https://squadintelligence.com/vehicles/BP_LynxATV |
| “山猫”全地形车补给型 | `v2/lynx_atv_logi_infocard.webp` | `BP_LynxATV_Logistic` | https://squadintelligence.com/vehicles/BP_LynxATV_Logistic |
| “山猫”全地形车运输型 QJZ89 | `v2/lynx_atv_qjz89_infocard.webp` | `BP_LynxATV_Rollcage_QJZ89` | https://squadintelligence.com/vehicles/BP_LynxATV_Rollcage_QJZ89 |
| “山猫”全地形车运输型 QLZ87 | `v2/lynx_atv_qlz87_infocard.webp` | `BP_LynxATV_Rollcage_QLZ87` | https://squadintelligence.com/vehicles/BP_LynxATV_Rollcage_QLZ87 |
| 轻型改装皮卡 AGS-17榴弹发射器型 | `v2/technical_ags17_infocard.webp` | `BP_Technical2Seater_White_AGS17` | https://squadintelligence.com/vehicles/BP_Technical2Seater_White_AGS17 |
| OH-6 “泥鳅” 侦察型 | `v2/loach_scout_infocard.webp` | `BP_Loach` | https://squadintelligence.com/vehicles/BP_Loach |

规格：均为 1920×1080 webp，原样落盘（站点已压缩，未二次转码）。

### 取图方法（可复用）

1. `https://squadintelligence.com/assets/VehicleList-*.js` 里有全量 `BP_xxx → displayName` 表（429 条），可用来查蓝图名
2. `https://squadintelligence.com/vehicles/<蓝图名>` 的 `og:image` 即该车官方主图
3. `/icons/Images/` 目录对不存在的车返回 HTML（`text/html`），存在返回 `image/webp` → 可用来批量探测有没有图

## 未解决 / 兜底项（截至 2026-10-25）

- 卡玛兹5320 运兵/补给：按用户决定**继续用** `v2/kamaz_5350_*`（游戏内即 KamAZ-5350），详情页加注型号差异
- 护卫载具 M134 / 轻型 FSV / 橡皮艇 12 型：同底盘变体共用图，页面加「武器站变体」角标
