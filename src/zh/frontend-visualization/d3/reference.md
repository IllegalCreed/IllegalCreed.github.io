---
layout: doc
outline: [2, 3]
---

# 参考：D3 模块与 API 速查

> 基于 D3.js v7.9 · 核于 2026-07

## 速查

- **版本**：`d3@7.9.0`（Mike Bostock，ISC）；v7 = **30 个独立模块的元包**；ESM 优先；TS 类型 `@types/d3`。
- **演进**：v4 拆模块化多包 → v5 d3-fetch（Promise）→ v5.8 `join()` → **v6 事件 `(event, d)` / 删 `d3.event` / `d3.mouse` 改 `d3.pointer` / `d3.nest` 改 `group/rollup`** → v7 ESM 优先。
- **选择集**：`select` 首个 / `selectAll` 全部 / `create` 游离；值函数 `(d, i, nodes)`，箭头函数无 this；`call(fn)` 传整个 selection（axis/行为安装范式）。
- **data join**：`data(data, key)` 返回 update；enter 有数据无元素、exit 反之；`join("rect")` 一步到位；key 函数保 object constancy；`datum()` 不做 join。
- **scale 选型**：
  - 连续数值：`scaleLinear`（`invert` / `clamp` / `nice` / `ticks`）
  - 柱状类目：`scaleBand`（`bandwidth` / `step`；**无 invert**）；折线类目：`scalePoint`
  - 配色：`scaleOrdinal`（**显式 domain**，防隐式漂移）
  - 时间：**优先 `scaleUtc`**；对数：`scaleLog`（domain 不得含 0，跨 0 用 symlog）
  - 分档：`scaleQuantize` 等宽 / `scaleQuantile` 等频 / `scaleThreshold` 手动（配 `invertExtent` 做图例交互）
- **axis**：轴渲染在原点**必须 transform**；`ticks / tickValues / tickFormat / tickSize / tickSizeOuter(0) / tickPadding`；网格线 `tickSize(-innerWidth)`。
- **shape**：
  - `line`：`defined()` 断线、`curve()` 插值；`area`：**y0 基线必设**
  - `pie` 只算角度（默认值降序，`sort(null)` 保输入序）+ `arc`（0 在 12 点、顺时针为正、`centroid` 放标签）
  - `stack`：输出 `[y0, y1]` 序列；offset Expand = 百分比、Wiggle + InsideOut = streamgraph、Diverging = 正负分离
  - 时间序列曲线默认 **curveMonotoneX**；Basis 系不过数据点
- **hierarchy**：`d3.hierarchy(json)` / `d3.stratify()(table)`；**布局前必 `sum()`**；tree/cluster 输出 x/y（cluster 叶等深）、treemap/partition 输出 x0/y0/x1/y1、pack 输出 x/y/r；`links()` 画连线。
- **force**：alpha 从 1 降温约 300 tick 停；`manyBody` 默认 -30；`forceCenter` 平移整体 ≠ `forceX/Y` 单点弹力；拖拽三步 = `alphaTarget(0.3).restart()` + fx/fy + 置 null；**手动 `tick()` 不发事件**。
- **transition**：默认 **250ms / easeCubic**；`delay((d, i) => i * 10)` 错峰；**同元素同名过渡互相中断**；attrTween 数据空间插值（饼图 `_current` 范式）；`end()` 返回 Promise。
- **zoom**：transform `{k, x, y}`；几何缩放 `g.attr("transform", event.transform)` vs 语义缩放 `event.transform.rescaleX(x)`；`scaleExtent` 不约束程序化 `zoom.transform`。
- **drag**：`subject()` 定拖谁；`container()` 定坐标系；`clickDistance` 区分点击。
- **brush**：`event.selection` 是**像素坐标**、**null = 清空必判**；`.map(x.invert)` 转数据域；`!event.sourceEvent` 防反馈循环。
- **tooltip 三件套**：`d3.pointer(event)` → `x.invert(px)` → `d3.bisector(d => d.date).center(data, x0)`。
- **数据处理**：
  - `d3.extent` 喂 domain；统计函数忽略 null/NaN；`least/greatest` 返回元素本身
  - `group / rollup / index`（v6 取代 nest，返回 InternMap）；`groupSort` 排类目轴
  - **csv 值全是字符串**：`d3.csv(url, d3.autoType)` 或手动 `+` 转型；结果带 `columns` 属性
  - `timeParse` 严格匹配，失败返回 **null**；autoType 纯日期按 **UTC 午夜**解析
- **易错 Top**：y range 忘反向 / 轴忘 transform / band 调 invert / area 忘 y0 / pie 默认降序 / hierarchy 忘 sum / fx-fy 忘清 / brush 忘判 null / ordinal 隐式 domain / v6 事件签名混用。
- **官方**：[d3js.org](https://d3js.org/) · [GitHub d3/d3](https://github.com/d3/d3)。

## 一、30 模块分类速查

| 类别 | 模块 |
| --- | --- |
| 选择与 DOM | d3-selection |
| 比例尺 | d3-scale、d3-scale-chromatic（配色） |
| 形状 | d3-shape（line/area/arc/pie/stack/curve/symbol） |
| 布局 | d3-hierarchy（tree/treemap/pack/partition）、d3-force |
| 动画 | d3-transition、d3-ease、d3-timer、d3-interpolate |
| 交互 | d3-zoom、d3-drag、d3-brush、d3-dispatch |
| 数据 | d3-array、d3-fetch、d3-dsv、d3-format、d3-time、d3-time-format、d3-random |
| 地理 | d3-geo |

**纯数据计算、不碰 DOM**：d3-scale / d3-shape / d3-array / d3-hierarchy——可单独引入给框架当「可视化数学库」。

## 二、版本演进关键节点

| 版本 | 变化 |
| --- | --- |
| v4 | 单包拆分为模块化多包 |
| v5 | d3-fetch 取代 d3-request（回调 → Promise） |
| v5.8+ | `selection.join()` 新范式（d3-selection 1.4） |
| **v6** | 事件签名 `(event, d)`；删除 `d3.event`；`d3.mouse` → `d3.pointer`；`d3.nest` → `d3.group/rollup` |
| v7 | ESM 优先（type: module），无重大 API 变更 |

## 三、数据处理 API

### 统计（d3-array）

- `d3.extent(data, d => d.v)` 返回 `[min, max]`——喂 domain 的标配。
- `min / max / sum / mean / median / quantile(p) / deviation / variance / mode / count`。
- **均忽略 null / undefined / NaN**；min/max 不做数字强转——字符串按字典序比较！
- `d3.least / d3.greatest(iter, accessor)` 返回**元素本身**（不是值）；`minIndex / maxIndex` 返回索引。

### 分组（v6 取代 d3.nest）

- `d3.group(data, d => d.species)` → InternMap（键可为 Date 等对象）；多 key 嵌套 `group(data, k1, k2)`。
- `d3.rollup(data, D => D.length, d => d.species)` → 分组 + 聚合（第二参是 reduce）。
- `d3.index(data, d => d.date)` → 键必须唯一，否则 throw（取组内首元素）。
- `d3.groups / rollups / flatGroup / flatRollup` 返回数组形态；`d3.groupSort(data, D => d3.median(D, accessor), key)` 返回排好序的 key 数组——排序类目轴利器。

### 二分查找

- `d3.bisector(accessor)` 生成 `{left, right, center}`；`center` 直接给最近点索引（tooltip 标准件）。
- `bisectLeft`（分界 `v < x` 与 `v >= x`）与 `bisectRight`（分界 `v <= x` 与 `v > x`）差在等值侧。

### d3-fetch（全部返回 Promise）

- `d3.csv / tsv / dsv(delim, url) / json / text / xml / html / svg / image / blob / buffer`。
- **`d3.csv(url)` 解析出的所有值都是字符串**（必考坑）——第二参传行转换函数，或 `d3.csv(url, d3.autoType)`。
- 返回数组带 **`columns` 属性**（保序列名）；`d3.json` 遇 204/205 返回 undefined。

### autoType 转换规则（属 d3-dsv）

| 输入 | 输出 |
| --- | --- |
| 空串 | null |
| "true" / "false" | 布尔 |
| "NaN" | NaN |
| 可转数字的串 | number |
| ISO 8601 日期串 | Date（**纯日期按 UTC 午夜**；带时间不带时区按本地时间） |
| 含逗号 / 单位（"$1.00"、"32px"） | 保持字符串 |

### d3-time-format

- `d3.timeParse("%Y-%m-%d")("2024-01-02")`：字符串 → Date；**严格匹配，失败返回 null**（不是 Invalid Date）。
- `d3.timeFormat("%b %d")(date)`：Date → 字符串；`utcFormat / utcParse` 对应 UTC；`d3.isoFormat / isoParse`。
- 高频符号：%Y 四位年、%y 两位年、%m 月、%d 日、%e 空格填充日、%H 24 时制、%I 12 时制、%M 分、%S 秒、%L 毫秒、%p AM/PM、%a/%A 周名、%b/%B 月名、%j 年内日、%U/%W 周数、%Z 时区、%% 百分号。
- 填充修饰：`%-d` 去填充、`%_d` 空格填充。

### d3-format（数值格式化）

- `d3.format(".2s")(4200)` → "4.2k"；`",.0f"` 千分位；`".1%"` 百分比。
- 与轴直通：`axis.ticks(10, "s")`。

## 四、curve 选型速查

| 需求 | 选择 |
| --- | --- |
| 时间序列折线，防过冲最稳 | **curveMonotoneX** |
| 通用平滑，防自交/过冲 | curveCatmullRom（alpha 0.5 向心参数化） |
| 阶梯图 | curveStep / StepBefore / StepAfter |
| 树/流程连线 | curveBumpX / BumpY |
| 层级边捆绑（仅 line） | curveBundle |
| 雷达图闭合 | Closed 变体 |
| 注意 | Basis 系**不过数据点**；Cardinal 可能过冲 |

## 五、d3-geo 一页纸

- 输入 **GeoJSON**（大数据用 TopoJSON 传输、topojson-client 解回 GeoJSON）；注意 D3 的绕线方向约定与 RFC 7946 **相反**。
- 投影：`const projection = d3.geoMercator().scale(k).translate([w/2, h/2]).center([lon, lat])`；常用 geoMercator / geoEqualEarth / geoAlbersUsa / geoOrthographic。
- `projection.fitSize([w, h], geojson)` 自动适配视口；projection 本身是函数：`projection([lon, lat])` 返回 `[px, py]`。
- **`d3.geoPath().projection(projection)`**：GeoJSON Feature → path d 字符串（或 `.context(ctx)` 画 Canvas）；`path.centroid(f)` 放标签、`path.bounds(f)` 取包围盒。

## 六、框架集成与 Canvas 速记

- **模式 1（默认）**：D3 纯计算模块算数据，框架渲染 DOM——「用 D3 的数学，不用 D3 的 DOM」。
- **模式 2**：需要 axis / transition / zoom / brush 等 DOM 行为时，在 useEffect / onMounted 里把某个 `g` 的所有权让渡给 D3；组件卸载记得清理（移除监听、停掉仿真）。
- **Canvas 路线**：SVG 千级元素顺滑、万级卡顿（DOM 节点数是主要瓶颈）；1 万以上元素用 shape 的 `.context(ctx)` 直接绘制 + tick 全量重绘 + `simulation.find` / quadtree / 隐藏色彩缓冲做拾取。
- **游离 DOM 技巧**：`d3.create("svg")` 内存构建再挂载；服务端 / Worker 配 JSDOM 跑 selection；detached 元素当 data join 状态机（记录 enter/exit 再手动画 Canvas）。

## 七、易错点清单

- **y 轴 range 忘反转**：`range([0, height])` 图倒挂；area 的 y0 默认 0 也是 SVG 顶部。
- **轴忘 transform**：轴永远画在原点，不平移只见一半。
- **csv 数字没转型**：`"9" > "10"` 字典序、domain 变 NaN——autoType 或手动 `+`；autoType 纯日期按 UTC 解析，与 `new Date("2024-01-02")` 的本地时区差一天问题同源。
- **scaleBand 调 invert**：undefined 报错——用 `Math.floor((px - range[0]) / step)` 反算。
- **scaleOrdinal 不设 domain**：颜色随数据顺序漂移。
- **log scale domain 含 0 / 跨 0**：行为未定义——用 symlog 或裁剪。
- **selectAll 选中已有同名元素**：enter 数量不对——数据元素加专属 class。
- **join 用 key 后 DOM 顺序乱**：补 `.order()`。
- **pie 默认按值降序**：图例对不上——`sort(null)`。
- **curve 选错**：Basis 不过点、Cardinal 过冲——时序用 MonotoneX。
- **stack 访问器与数据形态不匹配**：长表先 `d3.index`；缺组合兜底 0。
- **hierarchy 忘 sum**：treemap/pack 布局全 NaN。
- **force 手动 tick 等事件**：`simulation.tick()` 不触发 `on("tick")`。
- **拖拽后回弹/僵死**：end 忘清 fx/fy（钉死）或 start 忘 restart（不跟手）。
- **transition 被静默中断**：同元素同名新过渡掐掉旧的——命名分道或链式串行。
- **zoom 只设 scaleExtent**：程序化 `zoom.transform` 不受约束；缩到极限后滚轮放行给页面滚动。
- **brush 回调不判 null**：点击空白清空时 `map(invert)` 直接崩。
- **interpolateString 插 path**：两端结构不同产生乱形——attrTween 插值数据重算 path。
- **v5/v6 事件混用**：`d3.event` 已删除，一律 `(event, d)`；需要 this 用 `function`。

## 八、权威链接

- [D3 官方文档](https://d3js.org/) —— 各模块文档总入口
- [What is D3?](https://d3js.org/what-is-d3) —— 官方定位阐述（"not an alternative to a high-level charting library"）
- [Getting started](https://d3js.org/getting-started) —— 官方入门（含 React 集成示例）
- 模块文档直达（均在 d3js.org 下）：
  - 选择与绑定：`/d3-selection/selecting` · `/joining` · `/modifying` · `/events` · `/control-flow`
  - 比例尺与轴：`/d3-scale` · `/d3-axis`
  - 形状：`/d3-shape/line` · `/area` · `/arc` · `/pie` · `/stack` · `/curve`
  - 层级与力导向：`/d3-hierarchy` · `/d3-force/simulation`
  - 过渡与交互：`/d3-transition` · `/d3-zoom` · `/d3-drag` · `/d3-brush`
  - 数据：`/d3-fetch` · `/d3-dsv` · `/d3-array/summarize` · `/d3-array/group` · `/d3-array/bisect` · `/d3-time-format`
  - 地理：`/d3-geo`
- [GitHub d3/d3](https://github.com/d3/d3)
- npm 最新版本查询：`https://registry.npmjs.org/d3/latest`（当前 7.9.0）
- 本站幻灯片：<a href="/SlideStack/d3-slide/" target="_blank">D3.js</a>
