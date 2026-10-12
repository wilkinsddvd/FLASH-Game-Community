# 02 · 数据源盘点：地图清单 / 地图图片 / 层级与点位数据

> 目标：为《战术小队》(Squad) 的 **RAAS 猜点** 功能，盘点「地图清单 + 地图图片 + 层级数据」的可用数据源，并评估自动化抓取可行性。
>
> 环境：中国大陆；`squad.fandom.com` 的 `/wiki/` 网页与 `raw.githubusercontent.com` 直连被墙，走本地 Clash 代理 `-x http://127.0.0.1:7890` 可用；`api.github.com`、`squadmaps.com`、`static.wikia.nocookie.net` 可**直连**。
>
> 证据分级：**【已核实】**= 本次实测有 URL + 原始返回；**【推测】**= 合理推断未实测；**【未找到】**= 尝试过但没有。

---

## 0. 结论速览（TL;DR）

| 需求 | 最佳数据源 | 稳定性 | 备注 |
|---|---|---|---|
| 地图清单 | Wiki `Category:Maps` / `Maps` 页 + squadmaps sitemap + wiki-pipeline JSON | 高 | 三源交叉；当前 26 张官方地图 |
| RAAS 层级清单 | **squadmaps.com/sitemap.xml**（当前版本最全） | 中高 | 26 图共 215 条 layer URL，其中 **40 条 RAAS** |
| 地图俯视图（战术图） | **squadmaps `/assets/maps/<slug>/basemap.webp`** | 中（非官方 API，随时可能变） | 4096×4096 webp，~200–590 KB/张，直连可下 |
| 逐层级 minimap 图（含旗点） | **`Squad-Wiki/squad-wiki-pipeline-map-data`（GitHub，CC-BY-SA-4.0）** | 高（GitHub + 版本化） | 每 layer 一张 jpg，~1.2 MB，1645×1646 |
| 高点/海拔数据 | squadmaps `/assets/maps/<slug>/heightmap.json`（+ meta.json / heightmap.png） | 中 | 1.15 MB/图，4001×4001 高程栅格 |
| **Capture point / 层级（实时）** | **⭐ SquadCalc 公开 API：`GET https://squadcalc.app/api/get/layer?name=<rawName>`（+`/get/layers?map=<Map>`）** | **高（有版本、限速100/窗口，直连可用）** | ✅ **目前最完整、可直接读取的活接口**，附样例 |
| Capture point / lane（离线包） | `squad-wiki-pipeline-map-data` 的 `finished.json`（含 lanes/objectives）+ `w4rum/squadlanes` 的 `raas-data.yaml` | 高 | ✅ JSON/YAML，另有显示名 |
| 现成图片包 | `W4reka/squadmaps`（24 张 webp，**无 license**，慎用）；pipeline 仓库 images | 中 | 见 §3.5 |

**一句话结论**：
- **squadmaps.com 没有公开的「层级/点位」JSON API**（扒完前端只有 `server.*`/`sonar.*` 两组 tRPC），但它把**地图图片**以静态资源形式裸露在 `/assets/maps/<slug>/`，可直接批量下载。
- **真正好用的「层级 + 点位」活接口是 SquadCalc：`https://squadcalc.app/api/get/layer?name=<rawName>`**（直连可用、返回含 `capturePoints.lanes`/`objectives` 的完整 layer JSON）。
- 需**可商用许可**时用 **Squad Wiki 的 pipeline 仓库（CC-BY-SA-4.0，含逐 layer 图 + 点位几何）**；squadlanes（AGPL-3.0）提供清洗后的显示名。

---

## 1. 地图清单

### 1.1 三个可用数据源（全部实测可用）

| 源 | 获取方式 | 内容 | 实测 |
|---|---|---|---|
| **A. Wiki `Category:Maps`** | MediaWiki API | 地图页 + minimap/topo 文件（含 subcategory） | **【已核实】** 93 个成员 |
| **B. squadmaps sitemap** | `https://squadmaps.com/sitemap.xml` | 每张图的全部 `?map=&layer=` 组合 | **【已核实】** 216 条 `<loc>`（1 首页 + 215 layer） |
| **C. wiki-pipeline JSON** | GitHub raw | 每 layer 的 SDK 导出数据（mapId 权威） | **【已核实】** `Maps` 数组 453 条，28 个 mapId |

Wiki API（代理）：
```bash
curl -s -x http://127.0.0.1:7890 \
 "https://squad.fandom.com/api.php?action=query&list=categorymembers&cmtitle=Category:Maps&cmlimit=500&format=json"
# → 93 个成员（含 /de /fr 翻译页、Category:Minimaps、Category:Topographical maps、File:*）
```

squadmaps sitemap（直连）：
```bash
curl -s https://squadmaps.com/sitemap.xml -o sitemap.xml   # 200, 30117 B
```

pipeline JSON（代理，约 16 MB）：
```bash
curl -s -x http://127.0.0.1:7890 \
 "https://raw.githubusercontent.com/Squad-Wiki/squad-wiki-pipeline-map-data/master/completed_output/_Current%20Version/finished.json" \
 -o finished.json   # 200, 15 946 875 B
```

### 1.2 当前官方地图清单（26 张）【已核实】

来源：Wiki `Maps` 页分区 + `Category:Maps`；与 squadmaps 的 26 个 `?map=` 完全对应。按地区分组（Wiki 原文分区）：

- **Northern Europe**：Harju、Skorpo
- **Eastern Europe**：Belaya、Black Coast、Fool's Road、Gorodok、Mestia、Narva、Yehorivka
- **Southern Asia**：Chora、Kamdesh Highlands、Kohat Toi、Kokan、Lashkar Valley、Logar Valley、Sumari Bala
- **Eastern Asia**：Sanxian Islands
- **Middle East**：Al Basrah、Anvil、Fallujah、Mutaha、Tallil Outskirts
- **North America**：Manicouagan、Goose Bay
- **Training**：Jensen's Range、Pacific Proving Grounds

**已下架**（Wiki「No Longer In-game」，squadmaps 里也已无）：Forest、Operation First Light、Nanisivik。
**模组图**（仅出现在 squadmaps 前端 JS，把 mod 图也纳入了）：`Hrodna_Border`(slug `hrodna`)、`Chornivsk`(slug `chornivsk`)。

### 1.3 三套命名的对照（重要，别混用）

| squadmaps URL 参数 | squadmaps 资源 slug | wiki-pipeline mapId | Wiki 页面名 |
|---|---|---|---|
| `AlBasrah` | `albasrah` | `AlBasrah` | Al Basrah |
| `BelayaPass` | `belaya` | `Belaya` | Belaya |
| `KamdeshHighlands` | `kamdesh` | `Kamdesh` | Kamdesh Highlands |
| `KohatToi` | `kohat` | `Kohat` | Kohat Toi |
| `LashkarValley` | `lashkar` | `Lashkar` | Lashkar Valley |
| `LogarValley` | `logar` | `Logar` | Logar Valley |
| `SanxianIslands` | `sanxian` | `Sanxian_Islands` | Sanxian Islands |
| `SumariBala` | `sumari` | `Sumari` | Sumari Bala |
| `TallilOutskirts` | `tallil` | `Tallil` | Tallil Outskirts |
| `PacificProvingGrounds` | `pacific` | `PacificProvingGrounds` | Pacific Proving Grounds |
| `JensensRange` | `jensen` | `JensensRange` | Jensen's Range |

> slug 规则来自前端 JS（chunk `1r80hk0__yun9.js`）：
> `slug = {JensensRange:"jensen",PacificProvingGrounds:"pacific",Sanxian_Islands:"sanxian",Hrodna_Border:"hrodna",Chornivsk:"chornivsk"}[mapId] ?? mapId.toLowerCase()`
> 即「先取内部短名 mapId，再小写，少数特例」。**已实测**：`sanxian`✅ `tallil`✅ `kamdesh`✅ `kohat`✅ `lashkar`✅ `logar`✅ `sumari`✅ `belaya`✅ `foolsroad`✅ `pacific`✅；而 `sanxianislands`/`talliloutskirts`/`kamdeshhighlands`/`belayaPass` 等均 404。

机器可读清单已输出：`data/maps.json`（含 26 图 × {wiki 页名, 地区, url 参数, 资源 slug, pipeline mapId, RAAS 层级列表, 资源 URL 模板}）。

---

## 2. RAAS 层级清单

### 2.1 来自 squadmaps sitemap 的完整枚举【已核实】

`sitemap.xml` 共 216 条 `<loc>`，其中 215 条是 `?map=<地图>&layer=<层级>`。解析结果：**26 张图，215 个 layer，其中 40 个是 RAAS**（layer 名以 `RAAS` 开头；`_CL` 后缀 = Community Layer 社区层）。

| 地图 (squadmaps) | RAAS 层级 | 该图 layer 总数 |
|---|---|---|
| AlBasrah | RAASv1, RAASv2, RAASv3 | 14 |
| Anvil | RAASv1, RAASv2 | 6 |
| BelayaPass | RAASv1 | 8 |
| BlackCoast | RAASv1, RAASv2 | 9 |
| Chora | RAASv1 | 9 |
| Fallujah | RAASv1, RAASv2 | 11 |
| FoolsRoad | RAASv1 | 8 |
| GooseBay | RAASv1, RAASv2 | 7 |
| Gorodok | RAASv1, RAASv2 | 11 |
| Harju | RAASv1, RAASv2, **RAASv3_CL** | 14 |
| JensensRange | —（训练图） | 1 |
| KamdeshHighlands | RAASv1 | 6 |
| KohatToi | RAASv1, RAASv2 | 8 |
| Kokan | RAASv1 | 7 |
| LashkarValley | RAASv1 | 8 |
| LogarValley | RAASv1 | 6 |
| Manicouagan | RAASv1, RAASv2 | 12 |
| Mestia | RAASv1 | 6 |
| Mutaha | RAASv1, RAASv2 | 8 |
| Narva | RAASv1 | 9 |
| PacificProvingGrounds | —（训练图） | 2 |
| SanxianIslands | RAASv1, RAASv2, **RAASv3_CL** | 11 |
| Skorpo | RAASv1 | 5 |
| SumariBala | RAASv1 | 9 |
| TallilOutskirts | RAASv1, RAASv2 | 9 |
| Yehorivka | RAASv1, RAASv2 | 11 |

完整枚举（含每张图全部 layer 名）见 `data/layers.json` → `source_squadmaps_sitemap`。

复现命令：
```bash
curl -s https://squadmaps.com/sitemap.xml \
 | grep -oE '\?map=[^&<]+&amp;layer=[^<]+' \
 | sed 's/&amp;/\&/' | sort -u
```

### 2.2 来自 wiki-pipeline 的 RAAS 层级（含点位几何）【已核实】

`finished.json` 的 `Maps` 数组共 **453 个 layer**，其中 `gamemode=="RAAS"` 的 **154 个**（该数据集版本较旧于当前线上补丁，例如 Al Basrah 只列了 1 个 RAAS，而当前线上有 3 个——**枚举用 sitemap，几何/点位用 pipeline**）。

pipeline 的 RAAS layer 顶层字段样例：
```jsonc
{"Name":"Al Basrah RAAS v1","rawName":"...","levelName":"...(省略)", ...,
 "gamemode":"RAAS","layerVersion":"v1",
 "capturePoints":{ "type":"RAASLane Graph", ... },   // 见 §4
 "objectives":{ ... }, "team1":{...}, "team2":{...}}
```

完整枚举见 `data/layers.json` → `source_pipeline_json`（每个 layer 标注 `RAAS` / `capture_points_type` / `has_lane_data`）。

### 2.3 来自 SquadCalc API（**实时/最完整**）【已核实】⭐

SquadCalc 的公开后端（Express）直接给出每张图的 layer 列表，**直连可用、无需代理**：
```bash
curl -s "https://squadcalc.app/api/get/layers?map=AlBasrah"
# → [{"rawName":"AlBasrah_AAS_v1","shortName":"AAS v1"}, ..., {"rawName":"AlBasrah_RAAS_v1","shortName":"RAAS v1"}, ...]
```

实测枚举（25 张图，**206 个 layer，其中 39 个 RAAS**；`Belaya` 该接口无数据，需用其它源补）：

| MapKey | layer 数 | RAAS 数 | RAAS rawName |
|---|---|---|---|
| AlBasrah | 14 | 3 | RAAS_v1/v2/v3 |
| Anvil | 5 | 2 | v1/v2 |
| BlackCoast | 9 | 2 | v1/v2 |
| Chora | 8 | 1 | v1 |
| Fallujah | 10 | 2 | v1/v2 |
| FoolsRoad | 8 | 1 | v1 |
| GooseBay | 7 | 2 | v1/v2 |
| Gorodok | 10 | 2 | v1/v2 |
| Harju | 14 | 3 | v1/v2/**v3_CL** |
| Jensen | 8 | 0 | — |
| Kamdesh | 5 | 1 | v1 |
| Kohat | 7 | 2 | v1/v2 |
| Kokan | 6 | 1 | v1 |
| Lashkar | 7 | 1 | v1 |
| Logar | 5 | 1 | v1 |
| Manicouagan | 12 | 2 | v1/v2 |
| Mestia | 6 | 1 | v1 |
| Mutaha | 8 | 2 | v1/v2 |
| Narva | 9 | 1 | v1 |
| Pacific | 4 | 0 | — |
| Sanxian | 11 | 3 | v1/v2/**v3_CL** |
| Skorpo | 5 | 1 | v1 |
| Sumari | 8 | 1 | v1 |
| Tallil | 9 | 2 | v1/v2 |
| Yehorivka | 11 | 2 | v1/v2 |

（`*_CL` = Community Layer。与 §2.1 sitemap 的 40 个 RAAS 对齐，差 1 个即 Belaya。）

完整枚举见 `data/layers.json` → `source_squadcalc_api`。

### 2.4 来自 Wiki Cargo 查询（补充）【已核实/部分】

Fandom 的 Cargo 扩展提供 `action=cargoquery`，可查 wiki 的 layer 表（字段如 `mappage,gamemode,layerversion,capturepoints,team1faction,team2faction`）：
```bash
curl -s -x http://127.0.0.1:7890 \
 "https://squad.fandom.com/api.php?action=cargoquery&tables=Map_layers&fields=mappage,gamemode,layerversion,capturepoints&limit=50&format=json"
```
> 实测该接口存在且可返回数据（样例见同目录 `data-sources/wiki-cargo-map_layers.json`），但表名/字段名需按实际 Cargo 表调整，且**有较严格的 rate limit**（本次多次请求触发 `ratelimited`）。仅作交叉校验，不作为主源。

---

## 3. 地图图片

### 3.1 源 1：squadmaps 静态资源（覆盖「全图俯视战术图」）【已核实】

squadmaps 前端把每张图切好的静态资源裸露在固定路径（无鉴权、**可直连**、非官方 API）：

```
https://squadmaps.com/assets/maps/<slug>/<file>
```

| 文件 | 含义 | 实测样例 | 格式/尺寸 |
|---|---|---|---|
| `basemap.webp` | **2D 俯视战术图（无坐标标注底图）** | al basrah 200 / 214 822 B；yehorivka 200 / 588 997 B；gorodok 200 / 229 854 B | webp **4096×4096**（VP8X） |
| `topomap.webp` | 等高线/地形图 | albasrah 200 / 547 822 B；yehorivka 2 956 600 B；gorodok 2 805 404 B | webp |
| `terrainmap.webp` | 地形（卫星感）图 | albasrah 200 / 1 654 766 B | webp |
| `thumbnail.webp` | 缩略图（列表用） | albasrah 200 / 85 901 B；yehorivka 200 / 72 412 B | webp |
| `heightmap.json` | 高程栅格（JSON 二维数组） | albasrah 200 / 1 151 046 B | JSON，按 meta 为 4001×4001 |
| `meta.json` | 高程 meta（分辨率/边界/朝向） | albasrah 200 / 7 734 B | JSON |
| `heightmap.png` | 高程图（16-bit PNG） | albasrah 200 / 5 835 186 B | PNG |
| `heightmap.webp` | — | **404**（无此文件） | — |

`meta.json` 片段（**已核实**）：
```json
{"map":"AlBasrah","exported_utc":"2026-06-25T02:38:38Z","resolution_m":1.0,
 "grid_cols":4001,"grid_rows":4001,
 "bounds_m":{"min_x":-2000,"max_x":2000,"min_y":-2000,"max_y":2000},
 "orientation":{"transpose":false,"flip_rows":false,"flip_cols":false,
   "row_axis":"world Y (min to max)","col_axis":"world X (min to max)"}, ...}
```

`heightmap.json` 片段（**已核实**，开头即二维数组）：
```
[[1.55,1.68,1.82,1.95,1.82,...,2.23,2.09,2.37,2.51,...]]
```

批量下载模板：
```bash
# 单图验活
curl -s -o /dev/null -w "%{http_code} %{size_download}\n" \
  https://squadmaps.com/assets/maps/albasrah/basemap.webp      # → 200 214822
# 全量（按 maps.json 里的 slug 列表循环，建议 sleep 0.3~0.5s）
```

> ⚠️ 这是**未公开的静态资源路径**（扒前端 chunk 得到），不是官方 API，站点改版会随时失效；抓取请限速、别打挂。

### 3.2 源 2：Squad Wiki Pipeline（覆盖「逐 layer minimap」，**每层级一张、含旗点**）【已核实】

仓库 `Squad-Wiki/squad-wiki-pipeline-map-data`（**CC-BY-SA-4.0**），目录：
```
completed_output/_Current Version/images/<MapId>_<Gamemode>_<vN>.jpg
```

- 共 **340 张** 图片，合计 ~368.3 MB；其中 **104 张是 RAAS**，合计 ~123.8 MB，**均值 ~1.19 MB/张**。
- 实测下载 `Albasrah_RAAS_v1.jpg` → 200，`image/jpeg`，1 135 477 B，**1645×1646** px。
- 命名样例：`Albasrah_RAAS_v1.jpg`、`Anvil_RAAS_v1..v4.jpg`、`Belaya_RAAS_v1..v5.jpg`、`Gorodok_RAAS_v1..v5.jpg`、`Yehorivka_RAAS_v1..v5.jpg` 等。
- 这些图即 Wiki 页上「该 layer 的旗点布局图」，是最贴合「猜点」需求的图。

URL 模板与验活（**注意 raw.githubusercontent 需代理**）：
```bash
IMG="https://raw.githubusercontent.com/Squad-Wiki/squad-wiki-pipeline-map-data/master/completed_output/_Current%20Version/images/Albasrah_RAAS_v1.jpg"
curl -s -x http://127.0.0.1:7890 -o /tmp/x.jpg -w "%{http_code} %{content_type} %{size_download}\n" "$IMG"
# → 200 image/jpeg 1135477
```

图片清单（含每张体积）可通过 GitHub API 拉取：
```bash
curl -s "https://api.github.com/repos/Squad-Wiki/squad-wiki-pipeline-map-data/git/trees/master?recursive=1" \
 | python3 -c "import json,sys; [print(t['path'],t.get('size')) for t in json.load(sys.stdin)['tree'] if '/images/' in t['path']]"
```

### 3.3 源 3：Fandom Wiki `Category:Minimaps` / `Topographical maps`【已核实】

- `Category:Minimaps`：**330 个**文件；其中含 **84 个 RAAS 命名**（如 `File:Al Basrah RAAS V1.jpg`、`File:Gorodok RAAS V4.jpg`、`File:Yehorivka RAAS V5.jpg`，以及较新的 `File:Minimap Talil RAASv1.jpg` 等两套命名）。
- `Category:Topographical maps`：**20 个**（每图一张 relief 图，如 `File:AlBasrahTopoRelief.jpg`）。
- 直连可用（**无需代理**）：实测 `static.wikia.nocookie.net/.../Al_Basrah_RAAS_V1.jpg/revision/latest` → 直接 200（返回 webp 415 491 B，CDN 按 Accept 协商格式），**经代理** 200（887 378 B）。
- 单张元数据（**已核实**）：`File:Al Basrah RAAS V1.jpg` = 1623×1623，3 836 524 B，`image/jpeg`，URL 形如
  `https://static.wikia.nocookie.net/squad_gamepedia/images/<a>/<bc>/<File>.jpg/revision/latest?cb=<ts>`。

取「文件→真实 URL」：
```bash
curl -s -x http://127.0.0.1:7890 \
 "https://squad.fandom.com/api.php?action=query&titles=File:Al%20Basrah%20RAAS%20V1.jpg&prop=imageinfo&iiprop=url|size|mime&format=json"
```

### 3.4 源 4：其他社区工具
- `elialbert/squadmap.app`（Svelte，无 license）：自定义战术图编辑器，数据来自用户自建，**不提供地图底图包**。
- `yobaNGE/squad-map-data-CUE4Parse`：用 CUE4Parse 从游戏文件抽地图数据的脚本（可从游戏 asset 自己产出底图/点位，**工作量大、需游戏资源**，【推测】可行）。

### 3.5 现成「公开可下载图片包」
- **`W4reka/squadmaps`（GitHub）**：24 张 `<Map>.webp`（Al Basrah…Yehorivka），18–181 KB/张，2026-04 更新。**无 license 文件 → 存在版权风险，慎用**。【已核实】
- **`Squad-Wiki/squad-wiki-pipeline-map-data` 的 `images/`**：340 张逐 layer 图（见 §3.2），**CC-BY-SA-4.0 明确可复用（署名 + 相同方式共享）**。✅ 推荐。
- 未发现其它成规模、带明确许可的官方图包。【未找到】

### 3.6 格式 / 分辨率 / 体积速查

| 来源 | 格式 | 分辨率 | 单张体积 | 覆盖粒度 |
|---|---|---|---|---|
| squadmaps basemap | webp | 4096×4096 | ~0.1–1.9 MB | 每图 1 张 |
| squadmaps topomap | webp | 4096×4096（推测同底图） | ~0.4–3.0 MB | 每图 1 张 |
| squadmaps thumbnail | webp | 小 | 8–90 KB | 每图 1 张 |
| squadmaps heightmap | PNG / JSON | 4001×4001 | 5.8 MB / 1.15 MB | 每图 1 份 |
| pipeline images | jpeg | ~1645×1646 | ~1.19 MB | **每 layer** |
| wiki Minimaps | jpeg（CDN 可转 webp） | ~1623×1623 | ~0.8–3.8 MB | 每 layer/每图 |

### 3.7 版权 / 许可（公开游戏社区站使用风险）

| 素材 | 许可 | 商用 / 公开站风险 |
|---|---|---|
| **Squad 官方素材**（minimap、图标、游戏 asset，OWI 版权） | 无开放许可；属 Offworld Industries 版权 | 严格讲**需 OWI 授权**；社区站普遍以「非官方、粉丝用途、署名」方式使用，存在被要求下架的**低-中风险** |
| **Fandom Wiki 内容**（含 Minimaps/Topo 图） | `rightsinfo` = **CC BY-NC-SA**（实测 `action=query&meta=siteinfo&siprop=rightsinfo`） | **NC = 禁止商用**；非商业公益站可用但需署名 + 相同方式共享；图本身多为游戏截图，仍受 OWI 版权约束 |
| **squadmaps.com** | 应用代码 AGPL-3.0（`mahtoid/SquadMaps`）；README 注明素材来自 OWI | 直接搬运其图片**无授权**；站点资源路径非 API，**不建议当作长期正式数据源** |
| **`squad-wiki-pipeline-map-data`** | **CC-BY-SA-4.0** | ✅ **最友好**：可商用、需署名 + 相同方式共享；数据来自 SDK 导出 |
| **`w4rum/squadlanes` 的 `raas-data.yaml`** | **AGPL-3.0** | 可复用但**传染性强**（衍生作品需 AGPL）；数据处理脚本思路可借鉴 |
| **`W4reka/squadmaps`** | 无 license | ❌ 无权使用，**避免** |
| 自建底图（从游戏 asset 导出） | 仍属 OWI 素材 | 同上，且需处理工程复杂度 |

> 建议本站（公开社区站）：
> 1. 地图图片优先用 **pipeline 仓库（CC-BY-SA-4.0）**，并在页脚署名 "Map data © Squad Wiki contributors, CC BY-SA 4.0"。
> 2. 若用 Fandom 图，遵守 **CC BY-NC-SA**（**不要商用**）。
> 3. 使用任何 Squad 游戏素材时，加「非官方、与 Offworld Industries 无关」声明。
> 4. **不要**直接镜像 squadmaps 的资源路径作为正式数据源（无授权 + 易失效）。

---

## 4. 点位数据（Capture Points / Lane）

### 4.1 结论：**以 JSON / YAML 结构化暴露** ✅【已核实】

两条权威、机器可读的路径：

#### 源 A：`squad-wiki-pipeline-map-data` 的 `finished.json`（CC-BY-SA-4.0）

每个 layer 内既有 `capturePoints`（含 RAAS 的 **lane 图**），又有 `objectives`（每个点位的名字 + 世界坐标）。

RAAS layer 的 `capturePoints.lanes`（**已核实**，取自 `Al Basrah RAAS v1`）：
```jsonc
"capturePoints": {
  "type": "RAASLane Graph",
  "lanes": {
    "links": [
      {"name":"Link0","nodeA":"00-Team1 Main","nodeB":"01C-BP_CaptureZoneCluster"},
      {"name":"Link1","nodeA":"01C-BP_CaptureZoneCluster","nodeB":"02C-BP_CaptureZoneCluster"},
      {"name":"Link2","nodeA":"02C-BP_CaptureZoneCluster","nodeB":"03C-BP_CaptureZoneCluster"},
      {"name":"Link3","nodeA":"03C-BP_CaptureZoneCluster","nodeB":"04C-BP_CaptureZoneCluster"},
      {"name":"Link4","nodeA":"04C-BP_CaptureZoneCluster","nodeB":"05C-BP_CaptureZoneCluster"},
      {"name":"Link5","nodeA":"05C-BP_CaptureZoneCluster","nodeB":"100-Team2 Main"}
    ],
    "listOfLanes": ["Center","East","West"],
    "laneObjects": {
      "Center": {
        "name":"Center",
        "laneLinks": [ ...同上 6 条... ],
        "pointsOrder": ["00-Team1 Main","01C-BP_CaptureZoneCluster","02C-BP_CaptureZoneCluster",
                        "03C-BP_CaptureZoneCluster","04C-BP_CaptureZoneCluster","100-Team2 Main"],
        "numberOfPoints": 6,
        "listOfMains": ["00-Team1 Main","100-Team2 Main"]
      }, "East": {...}, "West": {...}
    }
  },
  "points": {}, "clusters": {}, "hexs": {}, "objectiveSpawnLocations": [], "destructionObject": {}
}
```

再往上一层给「点位世界坐标 + 人类可读名」（**已核实**）：
```jsonc
"objectives": {
  "00-Team1Main": {"name":"Main","objectName":"00-Team1Main",
     "location_x":-160541.94,"location_y":-183808.38,"location_z":-4465.36,"pointPosition":1, ...},
  "01C-BP_CaptureZoneCluster": {"name":"01C-BP_CaptureZoneCluster","pointPosition":2,
     "avgLocation":{"location_x":-18669.66,"location_y":-5639.98,"location_z":-761.46},
     "points":[{"name":"North VCP Ruins","objectName":"01C-NorthVCPRuins",
                "location_x":-9189.39,"location_y":-22865.75,"location_z":-778.45, "objects":[...]}, ...]}
}
```

> 即：**lane（可能的高点顺序）+ 每个 cluster 的候选旗点名字 + 世界坐标**都在。AAS layer 则直接给 `points.pointsOrder`（如 Al Basrah 一条 AAS lane：`["00-Team1 Main","01-Vineyard","02-Orchard","03-Lavender Farm","04-Qalat","05-Poppy Farms","100-Team2 Main"]`，**已核实**）。

#### 源 B：`w4rum/squadlanes` 的 `src/assets/raas-data.yaml`（AGPL-3.0）【已核实】

对 (地图, layer) 提供**清洗后的 cluster 显示名 + 坐标**，正是「猜点」最缺的人类可读名称：

```yaml
Al Basrah:
    Invasion v1:
        background:
            corners: [{x:-152000.0,y:-152000.0},{x:152000.0,y:152000.0}]
            minimap_filename: albasrah_minimap
        clusters:
            00-Team1Main:
                -   display_name: Team1 Main
                    sdk_name: Team1Main
                    x: -65989.34375
                    y: -69799.015625
            01-CaptureZoneCluster:
                -   display_name: Ruins
                    sdk_name: Ruins
                    x: -84007.4921875
                    y: 10320.5234375
            02-CaptureZoneCluster:
                -   display_name: Al Khora
                    sdk_name: AlKhora_808
                    x: -84917.90625
                    y: 34536.859375
            03-CaptureZoneCluster:
                -   {display_name: Poppy Production, sdk_name: PoppyProduction, x: -54764.84, y: 35760.15}
                -   {display_name: Warlord's Compound, sdk_name: WarlordsCompound, x: -38742.09, y: 46751.79}
            04-CaptureZoneCluster:
                -   {display_name: Apartments, ...}
```
（文件 1 539 659 B，覆盖各图各 layer；前景 `src/map/*.ts` 提供解析/渲染逻辑可参考。）

#### 源 C：SquadCalc 公开 API（**实时 JSON 接口**）⭐【已核实】

这是目前**最好用**的点位数据源：直接返回完整 layer JSON，含 RAAS lane 图与旗点名。
```bash
# 列出某图的全部 layer
curl -s "https://squadcalc.app/api/get/layers?map=AlBasrah"
# 取单个 layer 的完整数据（含 capturePoints / objectives）
curl -s "https://squadcalc.app/api/get/layer?name=AlBasrah_RAAS_v1"   # → 874 275 B
```
返回字段：`Name, rawName, mapId, gamemode, layerVersion, border, mapSize, mapTexture, mapTextureCorners, capturePoints, objectives, mapAssets, teamConfigs, ...`。

`AlBasrah_RAAS_v1` 的 `capturePoints` 样例（**已核实**）：
```jsonc
"capturePoints": {
  "type": "RAASLane Graph",
  "lanes": {
    "listOfLanes": ["A","B","C","D","E","F","G","H"],
    "laneObjects": {
      "A": {"pointsOrder":["00-Team1 Main","01W-BP_CaptureZoneCluster","02W-BP_CaptureZoneCluster",
                            "03C-BP_CaptureZoneCluster","04W-BP_CaptureZoneCluster","05W-BP_CaptureZoneCluster",
                            "05W-BP_CaptureZoneCluster_0","05W-BP_CaptureZoneCluster_1","Z-Team2 Main"], ...},
      "B": {...}, "C": {...}, ... "H": {...}
    },
    "links": [ {"name":"Link0","nodeA":"00-Team1 Main","nodeB":"01W-BP_CaptureZoneCluster"}, ... ]
  }
}
```

`objectives`（每个 cluster 的**候选旗点名**，本例共 56 个 cluster）样例（**已核实**）：
```jsonc
"01W-BP_CaptureZoneCluster": {"avgLocation":{"location_x":-53019.35,"location_y":-113509.06,"location_z":401.17},
   "points":[{"name":"Shu'Aiba", ...},{"name":"Truckstop", ...}]},
"02W-BP_CaptureZoneCluster": {"points":[{"name":"Terminal Building"},{"name":"Airport Hotel"},{"name":"Military ATC Tower"}]},
"03C-BP_CaptureZoneCluster": {"points":[{"name":"Military Warehouse"},{"name":"Military Barracks"},{"name":"Al Toza"}]}
```

接口信息：无鉴权；限速 `X-RateLimit-Limit: 100`/窗口；后端 Express。前端客户端代码见 `github.com/sh4rkman/SquadCalc` 的 `src/js/squadCalcAPI.js`（另有 `/get/weapons`、`/get/unit` 等）。

### 4.2 squadmaps.com 本身 **没有** 公开点位 JSON API【已核实/推测】

- **已核实**：扒完首屏全部 20 个 JS chunk，网络侧只有 tRPC `/api/trpc`，且仅存在 `server.*`（服务器列表）与 `sonar.*`（声呐热区）两组过程；对 `map.*/layer.*/layers.*/catalogue.*` 等 40+ 组合探测全部返回 `No procedure found`。
- **推测**：layer 点位数据是构建期打进客户端包/运行时按需加载，**未**以可枚举的静态 JSON（如 `/assets/maps/<slug>/layers.json`、`/api/layers/...`）暴露——这些路径实测均 404。
- 因此：**点位数据优先走 §4.1 的 源 C（SquadCalc 活接口）；离线包用 源 A/B**，不要试图从 squadmaps 抓点位。

---

## 5. 自动化可行性结论

### 5.1 推荐抓取路径（源 → 方法 → 产出 → 工作量）

| # | 目标 | 源 | 方法 | 产出形态 | 预计工作量 | 稳定性 |
|---|---|---|---|---|---|---|
| 1 | 地图清单 | wiki `Category:Maps` + squadmaps sitemap + pipeline JSON | 三源 API/XML 拉取 + 交集/并集 | `maps.json`（已产出） | 0.5 天 | **稳定**（wiki API、GitHub、sitemap） |
| 2 | RAAS 层级清单 | squadmaps `sitemap.xml` | 拉 XML，正则抽 `?map=&layer=` | `layers.json`（已产出） | 0.5 天 | **中高**（sitemap 会随版本变，但结构稳定） |
| 3 | 点位/层级数据（**核心，实时**） | **SquadCalc API** `squadcalc.app/api/get/layers`、`/get/layer` | 按图拉 layer 列表 → 逐 layer 拉完整 JSON | 每 layer 一个 JSON（含 `capturePoints.lanes`+`objectives`） | 0.5–1 天 | **高**（有版本、限速100/窗口，直连可用；非官方） |
| 3b | 点位/层级数据（**离线包 / 商用许可**） | pipeline `finished.json` + squadlanes `raas-data.yaml` | 下载 JSON/YAML，按 layer 抽出 | 每 layer 点位名+坐标+lane + 显示名 | 1–2 天 | **稳定**（GitHub 版本化 + 明确 license） |
| 4 | 逐 layer minimap（含旗点） | pipeline `images/*.jpg` | GitHub API 列目录 → 批量 curl（限速） | 340 张 jpg（~368 MB；RAAS 104 张 ~124 MB） | 0.5–1 天 | **稳定**（GitHub，CC-BY-SA-4.0） |
| 5 | 全图俯视底图（可选） | squadmaps `/assets/maps/<slug>/basemap.webp` | 按 slug 批量 curl（限速） | 26 张 4096² webp（每图 0.1–1.9 MB） | 0.5 天 | **中**（非 API，站点改版可能失效） |
| 6 | 高程数据（可选，做 3D/地形） | squadmaps `heightmap.json`/`meta.json`/`heightmap.png` | 同上 | 26×(1.15 MB JSON + 7 KB meta) | 0.5 天 | **中** |
| 7 | wiki 逐 layer 图（补充） | Fandom `Category:Minimaps` | `categorymembers` + `imageinfo` 取真实 URL 再下 | 330 张 | 1 天 | **中高**（Fandom API 稳定，但图受 OWI 版权 + CC BY-NC-SA） |

### 5.2 稳定性 & 风险标注

- **稳定（推荐长期依赖）**：**SquadCalc API `squadcalc.app/api`**（直连可用、限速 100/窗口）；GitHub 上的 `squad-wiki-pipeline-map-data`（CC-BY-SA-4.0）、`w4rum/squadlanes`（AGPL-3.0）；`api.github.com`；Fandom MediaWiki API（`/api.php`）。
- **较稳但非官方（会变）**：SquadCalc API 无正式文档/SLA，字段或限速可能变，建议本地缓存 + 定期全量刷新。
- **随时可能挂**：`squadmaps.com/assets/maps/<slug>/...`（未公开静态资源，非 API，站点重构即失效）；`sitemap.xml` 结构若变需改解析；`squadlanes.com` 网页有 **JS 挑战防护**（实测 302 跳转 + token，**网页不可直接爬**，但其 **GitHub 源码/数据协议开放**）。
- **版权红线**：squadmaps 图片无授权、`W4reka/squadmaps` 无 license、Fandom 图 **CC BY-NC-SA（禁商用）**；**首选 pipeline（CC-BY-SA-4.0）**，并全程保留 OWI「非官方」声明。

### 5.3 建议落地顺序（最小可用）

1. **今天就能跑**：先用 **SquadCalc API** 拉「每图 layer 列表 → 每 layer 完整 JSON」，直接得到点位 + lane（实时、最全）。
2. **合规/离线兜底**：拉 pipeline `images/` 的 104 张 RAAS 图当底图（CC-BY-SA-4.0）+ `finished.json`/`raas-data.yaml` 做离线点位包。
3. **可选增强**：squadmaps basemap/topomap/heightmap（注意限速与失效风险，仅作视觉增强，非必需）。

---

## 附录

### A. 可直接用的 URL 模板

```bash
# === Wiki (需代理) ===
curl -s -x http://127.0.0.1:7890 "https://squad.fandom.com/api.php?action=query&list=categorymembers&cmtitle=Category:Maps&cmlimit=500&format=json"
curl -s -x http://127.0.0.1:7890 "https://squad.fandom.com/api.php?action=query&list=categorymembers&cmtitle=Category:Minimaps&cmlimit=500&format=json"
curl -s -x http://127.0.0.1:7890 "https://squad.fandom.com/api.php?action=query&titles=File:X.jpg&prop=imageinfo&iiprop=url|size|mime&format=json"

# === squadmaps (直连) ===
curl -s https://squadmaps.com/sitemap.xml
curl -s "https://squadmaps.com/assets/maps/albasrah/basemap.webp" -o basemap.webp
curl -s "https://squadmaps.com/assets/maps/albasrah/heightmap.json" -o heightmap.json
curl -s "https://squadmaps.com/assets/maps/albasrah/meta.json" -o meta.json

# === SquadCalc API (直连，无需代理；限速100/窗口) ===
curl -s "https://squadcalc.app/api/get/layers?map=AlBasrah"
curl -s "https://squadcalc.app/api/get/layer?name=AlBasrah_RAAS_v1" -o AlBasrah_RAAS_v1.json

# === GitHub (api 直连；raw 需代理) ===
curl -s "https://api.github.com/repos/Squad-Wiki/squad-wiki-pipeline-map-data/git/trees/master?recursive=1"
curl -s -x http://127.0.0.1:7890 "https://raw.githubusercontent.com/Squad-Wiki/squad-wiki-pipeline-map-data/master/completed_output/_Current%20Version/finished.json" -o finished.json
curl -s -x http://127.0.0.1:7890 "https://raw.githubusercontent.com/w4rum/squadlanes/master/src/assets/raas-data.yaml" -o raas-data.yaml
```

### B. 关键源一览

| 名称 | 地址 | License |
|---|---|---|
| **SquadCalc API（实时）** | `https://squadcalc.app/api/get/layers`, `/get/layer`（前端 `github.com/sh4rkman/SquadCalc`） | 专有（站点）；代码 NOASSERTION |
| Wiki `Category:Maps` / `Minimaps` | `https://squad.fandom.com/api.php` | CC BY-NC-SA |
| squadmaps sitemap / 资源 | `https://squadmaps.com/sitemap.xml`, `/assets/maps/<slug>/` | 无（代码 AGPL-3.0） |
| Wiki Pipeline Map Data | `github.com/Squad-Wiki/squad-wiki-pipeline-map-data` | **CC-BY-SA-4.0** |
| squadlanes（RAAS 预测） | `github.com/w4rum/squadlanes` (`src/assets/raas-data.yaml`) | AGPL-3.0 |
| SquadMaps 社区 hub | `github.com/mahtoid/SquadMaps` | AGPL-3.0 |
| 图包（无 license，慎用） | `github.com/W4reka/squadmaps` | 无 |

### C. 产出文件

- `docs/raas-research/data/maps.json` — 26 张当前地图 + 各源命名/slug（wiki 页名、squadmaps url 参数与资源 slug、pipeline mapId、squadcalc key）+ 每图 RAAS 层级列表 + 资源 URL 模板。
- `docs/raas-research/data/layers.json` — 三个源：`source_squadcalc_api`（实时 206 layer / 39 RAAS）、`source_squadmaps_sitemap`（215 layer / 40 RAAS）、`source_pipeline_json`（453 layer，含 `capture_points_type` / `has_lane_data`）。

### D. 本次未找到 / 未做

- **未找到**：**squadmaps.com** 的公开「层级/点位」JSON API（已确认其无，改用 SquadCalc）；任何带明确许可的「官方」地图图片大包。
- **未做**（受限/超范围）：squadlanes 网页正文抓取（JS 挑战）；从游戏 `pak` 自行导出底图（`yobaNGE/squad-map-data-CUE4Parse` 思路可行但未实操）。
