# Squad (战术小队) RAAS 模式机制 &「各图层点位名称 / 刷新规律」数据可得性研究

> 研究时间：2026-10-12 · 研究者：subagent（RAAS机制研究）
> 结论来源全部为可复现的公开数据（wiki / GitHub / 公开 API）。凡「推测」处均已显式标注；查不到的写「未找到」，未编造。
> 本地已保存的证据文件见文末「附录 B」。

---

## 0. 摘要（TL;DR）

| 问题 | 结论 | 可信度 |
|---|---|---|
| RAAS 与 AAS 区别 | 机制几乎相同；**唯一硬差异**是 RAAS 的旗点布局每局随机、不按分数掉票（AAS 会按旗点掉票） | ✅已核实 |
| 「lane / 进攻路线」 | 确实存在。一个 layer 内可有 1 条或多条 lane；每条 lane 是 主基地→主基地 的有向「clusters 序列」 | ✅已核实 |
| 一图层有几条 lane | 1～7 条不等（全量历史数据中 Black Coast RAAS v1/v4/v5/v6 为 7 条；多数为 1 或 3 条） | ✅已核实 |
| 开局如何随机 | 选一条 route(lane)，然后沿 route 每个 cluster 里随机选 1 个候选点 | ✅已核实（社区工具实现层）／权重是否均匀为 ⚠️推测 |
| 后续点严格按序？ | 经典 RAAS：按所选 lane 的 cluster 顺序严格推进；GRAAS 网格型：分层推进并允许对角「跳点」（有 Jump Chance） | ✅已核实 |
| 旗点是否必须按序占领 | 是。不能跳序占领 | ✅已核实 |
| 下一揭示时机 | 占领/丢失后通过地图上的 Attack/Defense 标记揭示；「何时揭示」的官方原文 **未找到**，仅有社区实现佐证 | ⚠️部分推测 |
| 「random 型旗点（多选一）」 | 有。即 cluster（候选点组）：一个 cluster 含 N 个候选点位，随机取 1 | ✅已核实 |
| 点位**名称**可否拿到 | 可，全地图全 RAAS 图层（多个开源数据源） | ✅已核实 |
| 点位**刷新顺序/规律**可否拿到 | 可，以 lane 图（links 列表）+ cluster 分组形式结构化提供 | ✅已核实 |
| 点位**世界坐标**可否拿到 | 可，x/y/z（cm）+ 占领区几何（球/盒/胶囊半径） | ✅已核实 |
| 是否存在社区维护的完整开源数据集 | 存在，至少 4 个（见第 6 节） | ✅已核实 |

---

## 1. RAAS 是什么 · 与 AAS 的区别

**机制（已核实）**：RAAS = Random Advance and Secure，是 Squad 主要游戏模式之一，核心机制与 AAS 几乎完全一致，差异在旗点布局随机。

证据（Fandom 官方 wiki `Random Advance and Secure`，pageid 3102）原文：

> `While in AAS the Flag layout is static and always the same for a map layer, in RAAS the Flag layout is randomized and will be different every time you play.`
> `In RAAS, teams do not bleed tickets depending on what Flags are captured. Other than that, all the rules and mechanics are identical to AAS.`
> — https://squad.fandom.com/api.php?action=parse&page=RAAS&prop=wikitext&format=json （`RAAS` 为重定向到 `Random Advance and Secure`）

AAS 侧定义（wiki `Advance and Secure`，pageid 737）：

> `The objective of Advance and Secure is to capture and hold Control Points (also referred to as flags) in a preset order.`
> `There is also a variation of this game mode called Random Advance and Secure (RAAS).`

**票数差异（已核实）**：AAS/RAAS 的票数规则写在 `Advance and Secure` 词条「AAS & RAAS Mechanics → Ticket Bleed」一节。要点：控制敌方半场至少 1 个目标开始掉票（每目标 1 票/分）；奇/偶数目标层判定不同；双中立暂停掉票；占领全部目标触发 Mercy Bleed（60 秒 60 票）。RAAS **不因控制哪些旗点而掉票**（见上引原文）。

---

## 2. lane（进攻路线）概念

**定义（已核实）**：lane 是「主基地 → 主基地」的一条有向路径；路径上的节点是 **cluster（候选点组）**，每个 cluster 内含 1..N 个候选 capture point。

权威实现描述来自 Squad 社区工具 SquadCalc 的 lane 求解器（源码注释即文档）：

> `A randomized layer picks one route from main to main, then one point per cluster along that route:`
> `    route   = ordered list of clusters (one lane, main to main)`
> `    cluster = one step on the route, holding N candidate points`
> `    step    = 1-based index along the route. This is the number drawn on the flag.`
> — https://raw.githubusercontent.com/sh4rkman/SquadCalc/master/src/js/squadLaneSolver.js

wiki 也直接点名了提供 lane 数据库的站点：

> `A database of all lanes (how Control Points are connected to each other) can be found on several site, like Squadlanes and SquadMaps`
> — https://squad.fandom.com/api.php?action=parse&page=Advance%20and%20Secure&prop=wikitext&format=json

**一个 layer 里有几条 lane —— 已核实的真实分布**
对 squadlanes 数据集（`data-sources/squadlanes-raas-data.yaml`，152 个 RAAS 图层）统计：

| lane 数 | 图层数 | 例子 |
|---|---|---|
| 1 | 75 | Anvil RAAS v2、Belaya Pass RAAS v2… |
| 2 | 5 | Logar Valley RAAS v1 |
| 3 | 60 | Anvil RAAS v1、Narva RAAS v1、Lashkar RAAS v1… |
| 4 | 8 | Manicouagan RAAS v01/v02… |
| 7 | 4 | Black Coast RAAS v1/v4/v5/v6 |
（合计 152 个 RAAS 图层；`raas-data.yaml` 中 `lanes` 键数量统计）

- 3 条 lane 的图层通常命名为 `Center / East / West`（如 Anvil RAAS v1），或多线型 Manicouagan 为 4~7 条。
- squadlanes 对图层「逻辑类型」的统计标签（`logic` 字段）：`Multiple Lanes` 77 个、`Single Lane` 53 个、`No Lanes` 22 个，合计 152。
- 注：`No Lanes` 是工具侧标签（表示 lane 图无法完全自动解析/存在分支），并**不**代表游戏内该图层没有 lane —— 见第 8 节。

**底层实现（已核实，来自 SDK 反解脚本）**：Squad 的 RAAS 有 4 种初始化器，决定 lane 图形态：
`SQRAASLaneInitializer_C`（多条命名 lane）、`SQGraphRAASInitializerComponent`（单 lane 图）、`SQRAASGridInitializer_C`（GRAAS 网格，带 Jump Chance）、`HLP_SQRAASLatticeInitializer_C`（lattice 社区图层）。
证据：https://raw.githubusercontent.com/w4rum/squadlanes/master/extraction/squadlanes_extraction/extract_map_info.py （函数 `get_lane_graph_and_clusters`）

---

## 3. 开局随机 / 刷新规则 / 揭示 / random 旗点

### 3.1 开局如何随机（部分是推测，已标注）
- **已核实（实现层）**：先随机选 1 条 lane（route），再沿 lane 的每个 cluster 随机取 1 个候选点。见第 2 节 squadLaneSolver 注释；squadlanes「路径求解 / 概率」逻辑也以此为前提（`refreshLaneProbabilities()` 里对每条 lane 假设同先验）。
  证据：https://raw.githubusercontent.com/w4rum/squadlanes/master/src/map/mapData.ts
- **⚠️推测**：各 lane 先验概率是否**均匀**。squadlanes 代码对 lane 等概率处理（`P[lane]` 相互抵消），但游戏内真实权重未见于公开数据。
- **已核实**：GRAAS 网格型图层存在「跳点概率」：向前为 `(1 - Jump Chance)`，对角为 `Jump Chance`（对角若有两侧邻点则各 50%）。该说明写在 squadlanes 反解脚本注释中（并标注为 TODO 尚未纳入概率计算）：
  > `the SQRAASGridInitializer has a "Jump Chance" going diagonally has Jump Chance %, going forward has (1 - Jump Chance) %`
  > — extract_map_info.py 同上

### 3.2 后续点位：严格顺序 or 随机分支（已核实）
- 经典 RAAS：在**所选 lane 内**，cluster 顺序固定，逐点依次推进（不能跳序）。
- GRAAS 网格：按「层(depth)」推进，同一层内有多个横向 cluster，允许对角跳点 → 存在分支（非单一序列）。
- wiki 原文（AAS 规则适用 RAAS）：
  > `Your team cannot capture a Control Point out of order, your team will need to capture and hold the previous flag.`
  > — Advance and Secure 词条

### 3.3 旗点是否按序占领 / 揭示（已核实 + 部分推测）
- **按序占领**：已核实（见 3.2）。
- **揭示**：地图上以 Attack/Defense 标记表示当前可攻/可守点；当己方最前线 CP 被占领/丢失时 HUD 顶部会给出提示（与所在位置无关）。
  > `Additionally in case of a capture, lost or neutralization of your teams most front CP a message is shown in the top center of the HUD, independently of your current location.`
  > — wiki `Control Point` （pageid 738）
- **⚠️未找到**：「下一个点具体在被占后第几秒/以何种动画揭示」的**官方原文**。仅有社区实践佐证：SquadCalc lane 求解器支持「链上任意已确认点作为约束」，Steam 社区指南亦描述为「按已知点逐步点击、预测下一个点」。
  > Steam 指南（L1BBER, 2023，社区）：`Sequentially click on the circles that you already know, and the map will update the next likely triggers`
  > https://steamcommunity.com/sharedfiles/filedetails/?id=3020966971

### 3.4 「random 旗点（多选一）」机制（已核实）
存在。即 **cluster**：一个 cluster 持有一组候选点位，游戏在其间随机取 1。数据里可直接看到「一个 cluster 含多个不同点名」。
证据：Anvil RAAS v1 的多个 cluster 各含 3~6 个候选点（见附录 B 的 API 样例）：
- `01W-...Cluster` = {Compound 16, Lower Poppy Farms, Plateau Village, Upper Poppy Farms}
- `02C-...Cluster` = {Bridge Hold East, Central Mansion, Hemp, Qalat, Riverside, Village}

**统计佐证**：squadlanes 152 个 RAAS 图层中，绝大多数图层存在「多个候选点的 cluster（多选一组）」，例如 Anvil RAAS v1 有 14 个 cluster、其中 12 个是多选组；Harju RAAS v3 有 24 个 cluster、22 个多选；Manicouagan RAAS v01 有 30 个 cluster、25 个多选。

---

## 4. 权威 / 权威性来源原文汇总

| 来源 | 性质 | 关键原文 / 结论 |
|---|---|---|
| Fandom「Official Squad Wiki」`Random Advance and Secure` | OWI 社区官方 wiki（半官方） | 旗点布局随机、每局不同；不掉票；其余同 AAS |
| Fandom wiki `Advance and Secure` | 同上 | lane 数据库见 Squadlanes / SquadMaps；不能跳序占领；票数规则 |
| Fandom wiki `Control Point` | 同上 | CP 图标/占领态；最前线 CP 变化时 HUD 提示 |
| Fandom wiki `Map Layers` + Cargo 表 `map_layers` | 同上 | 图层定义；结构化图层表（含每层 capturepoints **数量**，无名称） |
| Squad Wiki Pipeline（GitHub `Squad-Wiki/squad-wiki-pipeline-map-data`） | 与 wiki 同源的 SDK 导出流水线 | 从 **Squad SDK** 导出图层 JSON，上传到 wiki Cargo；含点位名称与坐标 |
| squadlanes（`w4rum/squadlanes`）| 社区工具（AGPLv3，52★） | 自动从游戏文件提取点位与 lane；提供 `raas-data.yaml` |
| SquadMaps v2（`aachtenberg/squadmaps-v2`）| 社区工具（MIT） | 从 SDK `.umap` 提取；`v10_data.json` |
| SquadCalc（`sh4rkman/SquadCalc`）| 社区工具（118★） | lane 求解器源码即机制文档；公开 API `/api/get/layer` |

> 说明：`squad.fandom.com` 即社区语境中的「Official Squad Wiki」，是被 OWI 与社区广泛引用的权威 wiki（DDG 结果标题即 “Random Advance and Secure - Official Squad Wiki”）。**未找到** OWI 官网 `joinsquad.com` 上独立的 RAAS 机制文档页（`https://joinsquad.com` 可访问，未见 RAAS 规则专页；`wiki.joinsquad.com` 无法解析）。

---

## 5. 关键可行性判断：点位名称 & 刷新规律是否公开可得

**总判断：可以拿到。** 点位**名称**与**刷新顺序/规律**都是公开数据，且有**结构化（JSON/YAML）**形态，覆盖**全部地图的全部 RAAS 图层**（以各数据源自身的版本为准）。

### 5.1 数据源对比表

| # | 数据源 | URL | 形态 | 覆盖度 | 版本/时效 | 可靠性 |
|---|---|---|---|---|---|---|
| A | **SquadCalc 公开 API** | `https://squadcalc.app/api/get/layer?name=<rawName>`；列表 `.../get/layers?map=<Map>` | **结构化 JSON**（点位名称+objectName+世界坐标+占领区几何+lane links+clusters/objectives） | 现役全部 vanilla 图层（`/health` 报 vanilla=206 层） | **Squad 10.6.1（最新）** | 高（在线、可用、有版本号） |
| B | **SquadMaps v2** `data/v10_data.json` | `https://raw.githubusercontent.com/aachtenberg/squadmaps-v2/main/data/v10_data.json` | **结构化 JSON**（同 A 结构：`capturePoints.lanes.links` + `objectives[cluster].points[].location_xyz`） | README 称约 245 层（`.umap` 反解 + CSV 合并） | Squad 10.6（2026-10-05 刷新） | 高 |
| C | **Squad Wiki Pipeline** `finished.json` | `https://raw.githubusercontent.com/Squad-Wiki/squad-wiki-pipeline-map-data/master/completed_output/_Current%20Version/finished.json` | **结构化 JSON**（453 条图层；`capturePoints.lanes.links` + `objectives`） | 453 条 / RAAS 154 条（各 gamemode 均有） | 更新时间 2026-01-01（对应版本未核实，计数与 v7 时代吻合） | 高（与 wiki Cargo 同源，37★） |
| D | **squadlanes** `raas-data.yaml` | `https://raw.githubusercontent.com/w4rum/squadlanes/master/src/assets/raas-data.yaml` | **结构化 YAML**（map→layer→clusters[display_name,x,y] + lanes[a,b 边] + mains + logic） | 23 图 / 251 层 / **RAAS 152 层** | **Squad v7.0.1（2023-12-15，较旧）** | 高（但已过期） |
| E | Fandom wiki Cargo 表 `map_layers` | `.../api.php?action=cargoquery&tables=map_layers&fields=mappage,gamemode,layerversion,capturepoints,...` | **结构化表格**（图层名、faction、ticket、capturepoints **数量**） | 292 行（RAAS 90 行） | **v2.7（2021，很旧）** | 中（无点位名称/顺序） |
| F | wiki 地图页（如 `Yehorivka`） | `https://squad.fandom.com/wiki/Yehorivka` | 图片 + 表格（由 Cargo 生成） | 视页面 | 视页面 | 中 |
| G | 早期 GitHub 图层清单 | `pocketcode-au/squad-maps/layers.json`、`bsubei/squad_map_layers/layers.json` | JSON（map/layer/gamemode/faction/ticket/`RAA_Lanes`布尔） | 全图层**清单** | 2019/2020 | 低（无点位数据） |

### 5.2 「点位名称」
- **可得，且最完整来源为 A/B/C**（均含 SDK 内 `FlagName` → 显示名，以及唯一 `objectName`）。
- 命名注意（已核实）：**显示名不唯一**。SquadCalc lane 求解器注释：
  > `Points are identified by objectName ("C4-BridgeviewApartments"), which is unique inside a layer. The name field is not: 16 of 42 layers checked reuse a display name for two unrelated locations.`
- 用 C（wiki pipeline）或 D（squadlanes）可得到「人类可读点名」；用 A/B 可额外拿到占领区几何。

### 5.3 「点位刷新顺序 / 规律」
- **可得**：以 **lane 图** 形式给出——`lanes.links` 是 `{nodeA, nodeB}` 有向边列表（A/B/C 源），或 `lanes.<LaneName> = [{a,b},...]`（D 源）。
- 配合 `objectives[cluster].points[]`（候选点组）即可完整表达「route × cluster 内随机」的刷新规律。
- **⚠️未找到**：游戏内**每步随机权重**的官方数值（lane 权重、跳点概率的官方参数）。现有工具用等概率或简单模型近似。

### 5.4 覆盖度小结（计数来源与口径差异，已核实）
同一批地图，不同数据源给出的 RAAS 图层数差异很大，原因是最新版本**精简/移除了大量历史 RAAS 图层**：

| 地图 | wiki Cargo(v2.7) | squadlanes(v7.0.1) | wiki pipeline | **SquadCalc(v10.6.1，现役)** |
|---|---|---|---|---|
| Anvil | 2 | 5 | 5 | **2** |
| Gorodok | 9 | 13 | 13 | **2** |
| Yehorivka | 11 | 15 | 15 | **2** |
| Manicouagan | 8 | 15 | 15 | **2** |
| Kohat | 7 | 11 | 11 | **2** |
| Fallujah | 4 | 8 | 8 | **2** |
| 合计（全部地图） | 90 | 152 | 154 | **≈39**（我逐图枚举所得） |

**交叉验证（已核实）**：对现役候选取值直接探测——
`Gorodok_RAAS_v3`、`Gorodok_RAAS_v13`、`Yehorivka_RAAS_v5`、`Yehorivka_RAAS_v15`、`Manicouagan_RAAS_v3`、`Manicouagan_RAAS_v15`、`Kohat_RAAS_v5` 在 SquadCalc API 中均返回
`{"error":"Layer not found", ...}` → 说明这些历史图层在当前版本已不存在（而非列表被过滤）。
> 因此：**要「最新、可用」的点位与 lane 数据，用 A/B（v10.6.x）；要「历史/更全图层」，用 C/D（v7 时代）。**

---

## 6. 社区维护的开源数据集（GitHub，已用 GitHub API 检索验证）

检索命令与结果（`api.github.com` 可直连）：
- `q=squad+raas` → `w4rum/squadlanes`（52★）、`aachtenberg/squadmaps-v2`、`pixlcrashr/squad-raas-algorithms-example`
- `q=squad+map+layer` → `pocketcode-au/squad-maps`、`bsubei/squad_map_layers`、`fbraun4358/squad-map-json`
- `q=squad+map+data` → `Squad-Wiki/squad-wiki-pipeline-map-data`（37★）、`yobaNGE/squad-map-data-CUE4Parse`
- `q=SquadCalc` → `sh4rkman/SquadCalc`（118★）

| 仓库 | 星 | 语言 | 数据文件 | 数据内容 | 许可 |
|---|---|---|---|---|---|
| `w4rum/squadlanes` | 52 | Python/TS | `src/assets/raas-data.yaml` (1.5 MB) | 点位名(x,y)+lanes+mains+logic；含反解脚本 | AGPLv3 |
| `aachtenberg/squadmaps-v2` | 0(新) | JS | `data/v10_data.json` (22 MB) | 点位名+坐标+lane links+占领区几何+载具点 | MIT |
| `Squad-Wiki/squad-wiki-pipeline-map-data` | 37 | JS | `completed_output/**/finished.json` | 453 图层全量（点位名+坐标+lane） | 见 `license.md`（CC/GPL 类） |
| `sh4rkman/SquadCalc` | 118 | — | 依赖公开 API `/api/get/layer` | 点位名+坐标+lane（在线） | 见仓库 LICENSE |
| `yobaNGE/squad-map-data-CUE4Parse` | 1 | C# | CUE4Parse 反解项目 | 从 `.usmap`/`.umap` 提取空间数据 | — |
| `pixlcrashr/squad-raas-algorithms-example` | 0 | GDScript | 示例 | RAAS 算法演示 | — |
| `bsubei/squad_map_layers` / `pocketcode-au/squad-maps` | 0 | — | `layers.json` | 仅图层清单（无点位） | — |

**结论（已核实）**：存在多个带完整 layer 点位数据的开源数据集，**JSON/YAML 结构化**；其中 C（wiki pipeline 的 `finished.json`）是覆盖面最广的单文件全量集（453 条图层、154 条 RAAS，含点位名+坐标+lane），许可清晰、来自 wiki 官方流水线。
**未找到**「专门只打包 RAAS `layer→point 名称 + 顺序` 的、独立维护的 CSV/JSON 仓库」——最新数据多以「整层空间数据 JSON」形态存在（见第 5 节 A/B）。

---

## 7. 点位的命名与坐标（绘制到图片上）

**可以拿到世界坐标（已核实）**。所有主流数据源均提供：
- 点位世界坐标 `location_x / location_y / location_z`（单位 cm）。
- 主基地与 cluster 平均位置 `avgLocation` / 主基地 `location_xyz`。
- 占领区几何：`objects[]`，含 `isSphere/sphereRadius`、`isBox/boxExtent`、`isCapsule/capsuleRadius+capsuleLength` 及旋转（更精确地画出占领范围）。
- 地图贴图世界边界：`mapTextureCorners`（一对最小/最大角点）——用于把世界坐标换算成贴图像素，可直接在 map 图上画点。
- 另有 `border`（边界样条折线，含每点 xyz）与 `mapSize`。

示例（Anvil RAAS v1，来自 SquadCalc API）：
- 点位：`A1-PlateauVillage` "(Plateau Village)" → x=-36133.14, y=-130599.41, z=-1969.69，占领区 `capsuleRadius 3000 / capsuleLength 5000`
- 点位：`A1-UpperPoppyFarms` → x=-5820.00, y=-130750.00；占领区为 Box（scaling 130×45×50）
- 主基地 `00-Team1Base`、`Z`/`100-Team2 Main` 亦含坐标

（本机已保存该完整 JSON 的裁剪样例：`data-sources/squadcalc-api-Anvil_RAAS_v1.sample.json`。）

---

## 8. 未找到 / 需存疑

1. **未找到**：OWI 官方（`joinsquad.com`）关于 RAAS 随机算法的原文说明；现有权威描述全部来自 Fandom wiki（半官方）与社区工具。
2. **未找到**：lane 先验概率、GRAAS 跳点概率等「数值化随机权重」的官方/数据化来源（工具侧用的是等概率或简化模型）。
3. **未找到**：「下一旗点揭示的具体时机/规则」的官方原文（仅社区实践佐证）。
4. **需注意**：各数据源**图层数量口径不一致**（第 5.4 节）。若需「现役」数据必须用 A/B；C/D 偏旧。
5. **存疑**：`logic:"No Lanes"` 的 22 个图层（squadlanes 标签）在游戏内其实仍是随机 RAAS，只是其 lane 图无法被工具完整自动解析（可能是 GRAAS 网格/lattice 型），不应理解为「无 lane」。
6. **未核实**：wiki pipeline `finished.json`（453 条）对应的**确切 Squad 版本**（其计数与 v7 时代吻合，但 repo 提交时间为 2026-01-01）。
7. `Belaya` 在 SquadCalc API 中 `get/layers?map=Belaya` 返回 “No layers found”（可能键名不同或未收录）——**未找到**其现役 RAAS 图层列表。

---

## 附录 A：可复现抓取命令

```bash
# 代理（中国大陆需要）
PROXY="-x http://127.0.0.1:7890"

# 1) wiki（MediaWiki API，网页走代理仍 403，但 API 可用）
curl -s $PROXY "https://squad.fandom.com/api.php?action=parse&page=RAAS&prop=wikitext&format=json"
curl -s $PROXY "https://squad.fandom.com/api.php?action=query&prop=revisions&rvprop=content&rvslots=main&titles=Advance%20and%20Secure&format=json"
# Cargo 结构化图层表（含 capturepoints 数量）
curl -s $PROXY "https://squad.fandom.com/api.php?action=cargoquery&tables=map_layers&fields=mappage,gamemode,layerversion,capturepoints&limit=500&format=json"

# 2) SquadCalc 公开 API（最新，Squad 10.6.1）
curl -s $PROXY "https://squadcalc.app/api/health"
curl -s $PROXY "https://squadcalc.app/api/get/layers?map=Anvil"
curl -s $PROXY "https://squadcalc.app/api/get/layer?name=Anvil_RAAS_v1"

# 3) squadmaps-v2（Squad 10.6，22MB）
curl -s $PROXY -L "https://raw.githubusercontent.com/aachtenberg/squadmaps-v2/main/data/v10_data.json" -o v10_data.json

# 4) Squad Wiki Pipeline（全量 453 图层，约 16MB）
curl -s $PROXY -L "https://raw.githubusercontent.com/Squad-Wiki/squad-wiki-pipeline-map-data/master/completed_output/_Current%20Version/finished.json" -o finished.json

# 5) squadlanes raas-data.yaml（v7.0.1，1.5MB）
curl -s $PROXY -L "https://raw.githubusercontent.com/w4rum/squadlanes/master/src/assets/raas-data.yaml" -o raas-data.yaml

# 6) 源码/机制（GitHub API 可直连）
curl -s "https://api.github.com/repos/w4rum/squadlanes/contents/src/map/mapData.ts?ref=master"
curl -s "https://raw.githubusercontent.com/w4rum/squadlanes/master/extraction/squadlanes_extraction/extract_map_info.py"
curl -s "https://raw.githubusercontent.com/sh4rkman/SquadCalc/master/src/js/squadLaneSolver.js"
```

## 附录 B：本目录已保存的证据文件（`docs/raas-research/data-sources/`）

| 文件 | 说明 |
|---|---|
| `squadlanes-raas-data.yaml` | squadlanes 全量 RAAS 数据（Squad v7.0.1；点位名+坐标+lane+mains） |
| `squadcalc-api-Anvil_RAAS_v1.sample.json` | SquadCalc API 现役样例（裁剪：lane links + 3 个 cluster/点位 + mapTextureCorners） |
| `wiki-cargo-map_layers.json` | Fandom Cargo `map_layers` 全表（292 行，含每层 capturepoints 数量） |

> 其余大体量原始文件（`v10_data.json` 22MB、`finished.json` 16MB）因体积未落盘，可用附录 A 命令按需获取。
