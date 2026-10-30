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

## 2026-10-31 批次（补充编制 + 129 个变体逐个取真图）

图源站点：`https://squadintelligence.com`（同 10-25 批次）
取图规则：`https://squadintelligence.com/icons/Images/<蓝图名>.webp`（1920×1080）
蓝图 ↔ 显示名对照：`https://squadintelligence.com/assets/VehicleList-*.js`

| 车型（中文数据名） | 落入文件 | 蓝图名 | squadintelligence 显示名 |
|:-|:-|:-|:-|
| BMP-2M步兵战车 | `v2/bmp2m_infocard.webp` | `BP_BMP2M` | BMP-2M |
| BMP-2步兵战车 | `v2/bmp2_infocard.webp` | `BP_BMP2` | BMP-2 |
| BRDM-2 UB-32 | `v2/brdm_2_gfi_infocard.webp` | `BP_BRDM-2_GFI` | BRDM-2 UB-32 |
| BRDM-2 装甲侦查车 | `v2/brdm_2_insurgents_infocard.webp` | `BP_BRDM-2_Insurgents` | BRDM-2 |
| BRDM-2L1 | `v2/brdm_2l1_afu_infocard.webp` | `BP_BRDM-2L1_AFU` | BRDM-2L1 |
| BRDM-2装甲侦察车 | `v2/brdm_2_rus_infocard.webp` | `BP_BRDM-2_RUS` | BRDM-2 |
| BRDM-2装甲侦查车 | `v2/brdm_2_rus_infocard.webp` | `BP_BRDM-2_RUS` | BRDM-2 |
| BTR-D AGS-17 榴弹发射器型 | `v2/btr_d_ags17_infocard.webp` | `BP_BTR-D_AGS17` | BTR-D AGS-17 |
| BTR-D Kord重机枪 | `v2/btr_d_kord_infocard.webp` | `BP_BTR-D_Kord` | BTR-D Kord |
| BTR-D装甲补给车 | `v2/btr_dg_logistics_infocard.webp` | `BP_BTR-DG_Logistics` | BTR-DG Logistics |
| CH-146 | `v2/ch146_infocard.webp` | `BP_CH146` | CH-146 |
| CH-146 近距离支援型 | `v2/ch146_cas_infocard.webp` | `BP_CH146_CAS` | CH-146 CAS |
| CSK131 HJ8 | `v2/csk131_hj_8atgm_infocard.webp` | `BP_CSK131_HJ-8ATGM` | CSK131 HJ8 |
| CSK131 QJC88 RWS | `v2/csk131_rws_infocard.webp` | `BP_CSK131_RWS` | CSK131 QJC88 RWS |
| CSK131 QJY88 | `v2/csk131_qjy88_infocard.webp` | `BP_CSK131_QJY88` | CSK131 QJY88 |
| CSK131 QJZ89 | `v2/csk131_qjz89_infocard.webp` | `BP_CSK131_QJZ89` | CSK131 QJZ89 |
| CSK131 QLZ87 | `v2/csk131_qlz87_infocard.webp` | `BP_CSK131_QLZ87` | CSK131 QLZ87 |
| CTM131 QJZ89 | `v2/ctm131_qjz89_naval_infocard.webp` | `BP_CTM131_QJZ89_Naval` | CTM131 QJZ89 |
| CTM131 补给型 | `v2/ctm131_logistic_infocard.webp` | `BP_CTM131_Logistic` | CTM131 Logistics |
| CTM131 运输型 QJZ89 | `v2/ctm131_qjz89_infocard.webp` | `BP_CTM131_QJZ89` | CTM131 Transport QJZ89 |
| CTM131补给型 | `v2/ctm131_logistic_infocard.webp` | `BP_CTM131_Logistic` | CTM131 Logistics |
| CTM131运输型 QJZ89 | `v2/ctm131_qjz89_infocard.webp` | `BP_CTM131_QJZ89` | CTM131 Transport QJZ89 |
| FV432 L111A1 遥控武器站 | `v2/fv432_m2_rws_infocard.webp` | `BP_FV432_M2_RWS` | FV432 L11A1 RWS |
| FV432 L11A1 | `v2/fv432_infocard.webp` | `BP_FV432` | FV432 L11A1 |
| FV432 L11A1遥控武器站 | `v2/fv432_m2_rws_infocard.webp` | `BP_FV432_M2_RWS` | FV432 L11A1 RWS |
| FV432 L37A2 遥控武器站 | `v2/fv432_l37a2_rws_infocard.webp` | `BP_FV432_L37A2_RWS` | FV432 L37A2 RWS |
| FV432 L37A2遥控武器站 | `v2/fv432_l37a2_rws_infocard.webp` | `BP_FV432_L37A2_RWS` | FV432 L37A2 RWS |
| FV510 步兵战车 | `v2/fv510_infocard.webp` | `BP_FV510` | FV510 |
| FV510 附加装甲 | `v2/fv510ua_infocard.webp` | `BP_FV510UA` | FV510 UA |
| HX60 运兵卡 | `v2/brit_util_truck_infocard.webp` | `BP_Brit_Util_Truck` | HX60 Transport |
| HX60运兵卡 | `v2/brit_util_truck_infocard.webp` | `BP_Brit_Util_Truck` | HX60 Transport |
| HX60运兵卡车 | `v2/brit_util_truck_infocard.webp` | `BP_Brit_Util_Truck` | HX60 Transport |
| KrAZ-6322 补给卡 | `v2/kraz_6322_logi_infocard.webp` | `BP_Kraz_6322_Logi` | KrAZ-6322 Logistics |
| KrAZ-6322 运兵卡 | `v2/kraz_6322_infocard.webp` | `BP_Kraz_6322` | KrAZ-6322 Transport |
| KrAZ-6322补给卡 | `v2/kraz_6322_logi_infocard.webp` | `BP_Kraz_6322_Logi` | KrAZ-6322 Logistics |
| KrAZ-6322运兵卡 | `v2/kraz_6322_infocard.webp` | `BP_Kraz_6322` | KrAZ-6322 Transport |
| KrAZ-6322运兵卡车 | `v2/kraz_6322_infocard.webp` | `BP_Kraz_6322` | KrAZ-6322 Transport |
| LUVW 运兵载具 | `v2/luvw_infocard.webp` | `BP_LUVW` | LUVW Transport |
| LUVW 运输车 | `v2/luvw_infocard.webp` | `BP_LUVW` | LUVW Transport |
| M-ATV M2 | `v2/matv_infocard.webp` | `BP_MATV` | M-ATV M2 |
| M-ATV M240 | `v2/matv_m240_infocard.webp` | `BP_MATV_M240` | M-ATV M240 |
| M-ATV M2HB“陶” | `v2/matv_tow_infocard.webp` | `BP_MATV_TOW` | M-ATV TOW |
| M-ATV Mk19 | `v2/matv_mk19_infocard.webp` | `BP_MATV_Mk19` | M-ATV Mk19 |
| M1126 CROWS M2 | `v2/m1126_infocard.webp` | `BP_M1126` | M1126 CROWS M2 |
| M1126遥控武器站 M240 | `v2/m1126_m240_infocard.webp` | `BP_M1126_M240` | M1126 CROWS M240 |
| M113A2 补给车 | `v2/m113a2t_logistics_tlf_infocard.webp` | `BP_M113A2T_Logistics_TLF` | M113A2 Logistics |
| M113A2T M121自行迫击炮 | `v2/m1064_m121_tlf_infocard.webp` | `BP_M1064_M121_TLF` | M113A2T M121 |
| M113A3 | `v2/m113a3_m2_crf_infocard.webp` | `BP_M113A3_M2_CRF` | M113A3 |
| M113A3 Mk19 | `v2/m113a3_mk19_infocard.webp` | `BP_M113A3_MK19` | M113A3 Mk19 |
| M113A3 机动支援载具 | `v2/m113a3_msv_wpmc_infocard.webp` | `BP_M113A3_MSV_WPMC` | M113A3 MSV |
| M1151 CROWS M2 | `v2/m1151_crows_infocard.webp` | `BP_M1151_CROWS` | M1151 CROWS M2 |
| M1151 M240 | `v2/m1151_m240_infocard.webp` | `BP_M1151_M240` | M1151 M240 |
| M1151 Mk19 | `v2/m1151_mk19_infocard.webp` | `BP_M1151_Mk19` | M1151 Mk19 |
| M1151 改装皮卡车 DSHK | `v2/m1151_technical_infocard.webp` | `BP_M1151_Technical` | M1151 Technical DSHK |
| M1151 陶氏反坦克导弹 | `v2/m1151_light_tow_infocard.webp` | `BP_M1151_Light_TOW` | M1151 TOW |
| M1151改装皮卡车 DSHK | `v2/m1151_technical_infocard.webp` | `BP_M1151_Technical` | M1151 Technical DSHK |
| M1151陶氏反坦克导弹 | `v2/m1151_tow_gfi_infocard.webp` | `BP_M1151_TOW_GFI` | M1151 TOW |
| MATV M2 | `v2/matv_usmc_infocard.webp` | `BP_MATV_USMC` | MATV M2 |
| MATV Mk19 | `v2/matv_mk19_usmc_infocard.webp` | `BP_MATV_Mk19_USMC` | MATV Mk19 |
| MATV TOW | `v2/matv_usmc_tow_infocard.webp` | `BP_MATV_USMC_TOW` | MATV TOW |
| MT-LB ZU-23-2 | `v2/mtlb_zu23_mil_infocard.webp` | `BP_MTLB_ZU23_MIL` | MT-LB ZU-23-2 |
| MT-LBM 6MA装甲运兵车 | `v2/mtlbm_6ma_rus_infocard.webp` | `BP_MTLBM_6MA_RUS` | MT-LBM 6MA |
| MTLB 6MA UB-32 | `v2/mtlbm_6ma_gfi_infocard.webp` | `BP_MTLBM_6MA_GFI` | MTLB 6MA UB-32 |
| MTLB ZU23 | `v2/mtlb_zu23_afu_infocard.webp` | `BP_MTLB_ZU23_AFU` | MTLB ZU23 |
| Mi-8 | `v2/mi8_vdv_infocard.webp` | `BP_MI8_VDV` | Mi-8 |
| PARS III 25mm | `v2/pars3_infocard.webp` | `BP_PARS3` | PARS III 25mm |
| PARS III M2 RWS | `v2/pars3_m2_infocard.webp` | `BP_PARS3_M2` | PARS III M2 RWS |
| PARS III MG3遥控武器站 | `v2/pars3_mg3_infocard.webp` | `BP_PARS3_MG3` | PARS III MG3 RWS |
| PARS III Mk19遥控武器站 | `v2/pars3_mk19_infocard.webp` | `BP_PARS3_MK19` | PARS III Mk19 RWS |
| UH-60M | `v2/uh60_infocard.webp` | `BP_UH60` | UH-60M |
| UH60 PKM | `v2/uh60_tlf_pkm_infocard.webp` | `BP_UH60_TLF_PKM` | UH60 PKM |
| Ural-375D 运输车 | `v2/ural_375_mil_infocard.webp` | `BP_Ural_375_MIL` | Ural-375D Transport |
| Ural-375D运输车 | `v2/ural_375_mil_infocard.webp` | `BP_Ural_375_MIL` | Ural-375D Transport |
| Ural-4320 运兵卡 | `v2/ural_4320_gfi_infocard.webp` | `BP_Ural_4320_GFI` | Ural-4320 Transport |
| Ural-4320 运输车 | `v2/ural_4320_gfi_infocard.webp` | `BP_Ural_4320_GFI` | Ural-4320 Transport |
| Ural-4320运兵卡 | `v2/ural_4320_gfi_infocard.webp` | `BP_Ural_4320_GFI` | Ural-4320 Transport |
| Ural-4320运兵卡车 | `v2/ural_4320_gfi_infocard.webp` | `BP_Ural_4320_GFI` | Ural-4320 Transport |
| Ural-4320运输车 | `v2/ural_4320_gfi_infocard.webp` | `BP_Ural_4320_GFI` | Ural-4320 Transport |
| ZSD05 两栖装甲输送车 | `v2/zsd05_qjz_89_woodland_infocard.webp` | `BP_ZSD05_QJZ-89_Woodland` | ZSD05 QJZ89 |
| ZSD05 补给型 | `v2/zsd05_logi_woodland_infocard.webp` | `BP_ZSD05_Logi_Woodland` | ZSD05 Logistics |
| ZSD05两栖装甲输送车 | `v2/zsd05_qjz_89_woodland_infocard.webp` | `BP_ZSD05_QJZ-89_Woodland` | ZSD05 QJZ89 |
| ZSD05补给型 | `v2/zsd05_logi_woodland_infocard.webp` | `BP_ZSD05_Logi_Woodland` | ZSD05 Logistics |
| ZSD89II装甲运输车 | `v2/zsd89ii_infocard.webp` | `BP_ZSD89II` | ZSD89II IFV |
| ZSD89装甲运输车 QJZ89 | `v2/zsd89_infocard.webp` | `BP_ZSD89` | ZSD89 QJZ89 |
| ZSD89装甲运输车 QLZ87 | `v2/zsd89_qlz_87_infocard.webp` | `BP_ZSD89_QLZ-87` | ZSD89 QLZ87 |
| ZSL10装甲运输车 QJZ89 | `v2/zsl10_qjz_89_infocard.webp` | `BP_ZSL10_QJZ-89` | ZSL10 QJZ89 |
| ZSL10轮式运兵车 | `v2/zsl10_qjz_89_naval_infocard.webp` | `BP_ZSL10_QJZ-89_Naval` | ZSL10 |
| ZSL92A装甲运输车 QLZ87 | `v2/wz551b_qlz_87_infocard.webp` | `BP_WZ551B_QLZ-87` | ZSL92A APC QLZ87 |
| ZSL92A装甲运输车 QLZ89 | `v2/wz551b_infocard.webp` | `BP_WZ551B` | ZSL92A APC QJZ89 |
| ZSL92装甲运输车 | `v2/wz551b_infocard.webp` | `BP_WZ551B` | ZSL92A APC QJZ89 |
| 乌拉尔-375D ZU-23-2 | `v2/ural_375_zu23_mil_infocard.webp` | `BP_Ural_375_ZU23_MIL` | Ural-375D ZU-23-2 |
| 乌拉尔-375D 运输车 | `v2/ural_375_mil_infocard.webp` | `BP_Ural_375_MIL` | Ural-375D Transport |
| 乌拉尔-375D运输车 | `v2/ural_375_mil_infocard.webp` | `BP_Ural_375_MIL` | Ural-375D Transport |
| 护卫载具 M134 转轮机枪 | `v2/cpv_m134_infocard.webp` | `BP_CPV_M134` | CPV M134 Minigun |
| 护卫载具 M134转轮机枪 | `v2/cpv_m134_infocard.webp` | `BP_CPV_M134` | CPV M134 Minigun |
| 护卫载具 运兵型 | `v2/cpv_transport_infocard.webp` | `BP_CPV_Transport` | CPV Transport |
| 改装皮卡车 M2 | `v2/technical2seater_m2_black_infocard.webp` | `BP_Technical2Seater_M2_Black` | Technical M2 |
| 改装皮卡车 重机枪 | `v2/technical_dshk_ins_armoured_infocard.webp` | `BP_Technical_Dshk_INS_Armoured` | Technical HMG |
| 现代补给皮卡 | `v2/technical4seater_logi_camo_infocard.webp` | `BP_Technical4Seater_Logi_Camo` | Logistics Modern Pickup |
| 米-8 河马 | `v2/mi8_infocard.webp` | `BP_MI8` | Mi-8MTV-5 |
| 米-8河马 | `v2/mi8_infocard.webp` | `BP_MI8` | Mi-8MTV-5 |
| 虎-M - Kord重机枪型 | `v2/tigr_infocard.webp` | `BP_Tigr` | Tigr-M Kord |
| 虎-M-Kord重机枪型 | `v2/tigr_infocard.webp` | `BP_Tigr` | Tigr-M Kord |
| 虎式-M AGS-17榴弹发射器型 | `v2/tigr_ags17_infocard.webp` | `BP_Tigr_AGS17` | Tigr-M AGS-17 |
| 补给皮卡 | `v2/technical4seater_logi_infocard.webp` | `BP_Technical4Seater_Logi` | Logistics Pickup Truck |
| 轻型 FSV | `v2/technical2seater_camo_m2_crf_infocard.webp` | `BP_Technical2Seater_Camo_M2_CRF` | Light FSV |
| 轻型运输车 | `v2/technical4seater_transport_crf_infocard.webp` | `BP_Technical4Seater_Transport_CRF` | Light Transport |
