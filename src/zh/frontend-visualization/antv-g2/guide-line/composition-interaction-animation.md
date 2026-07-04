---
layout: doc
outline: [2, 3]
---

# 复合、交互与动画：单实例多视图与联动叙事

> 基于 **AntV G2 v5.4**（npm latest 5.4.8）· 核于 2026-07

## 速查

- **Composition 全表**：
  - `spaceLayer`：多视图**重叠**同一空间，各自独立坐标系——柱图 + 饼图叠加、**双轴图**
  - `spaceFlex`：水平 / 垂直**并排**（类 CSS flex）——多图并列报表
  - `facetRect`：**分面**，按字段切数据子集、行列排布——小倍数图（small multiples）
  - `facetCircle`：圆周分面——环形小倍数
  - `repeatMatrix`：**重复**，数据不变、编码叉乘——散点相关性矩阵（SPLOM）
  - `timingKeyframe`：时间维度管理视图——关键帧动画叙事
- **三概念辨析**（考点）：空间复合只分空间不动数据；**分面 = 分空间 + 分数据**（每个子视图见一个数据子集）；重复 = 全量数据 + 编码组合变化
- **结构**：复合节点用 `children: [...]` 嵌套，**可任意递归**——「通过一个单独的声明去实现一个报表」
- **分面写法**：facetRect 自身 `encode: { x: '分面字段' }`（或 y），children 里的 mark 再声明自己的 x / y
- **双轴图配方**：view / spaceLayer 内两 mark + 第二 mark `scale: { y: { independent: true } }` + `axis: { y: { position: 'right' } }`
- **同坐标系双轴用 view 即可；异坐标系混画（柱 + 饼）必须 spaceLayer**（一 view 一坐标系）
- **双轴 legend 去重**：两 mark 各自生成图例时需处理去重
- **Interaction 配置**：view 或 mark 层 `interaction: { tooltip: {...}, brushXHighlight: true, elementHighlight: { link: true, background: true } }`；函数式 `.interaction('tooltip', {...})`；关闭传 `false`；**mark 级覆盖 view 级**
- **内置交互清单**：
  - 提示：`tooltip` / `poptip`
  - 元素：`elementHighlight / elementHighlightByColor / elementHighlightByX / elementSelect / elementSelectByColor / elementSelectByX / elementHoverScale`
  - 刷选：`brushHighlight / brushXHighlight / brushYHighlight / brushFilter / brushXFilter / brushYFilter / brushAxisHighlight`
  - 组件：`legendFilter / legendHighlight / sliderFilter / scrollbarFilter`
  - 其他：`fisheye / chartIndex`
- **state 状态样式**：`state: { selected: {...}, unselected: {...}, active: {...}, inactive: {...} }`——elementSelect 驱动 selected / unselected，highlight 类驱动 active / inactive
- **事件流**：`chart.on('brush:filter', cb)` 监听；`chart.emit('brush:filter', { data })` 程序化触发——**多图联动（Focus + Context）= 一图 on 转另一图 emit**
- **事件名格式**：「组件:事件名」——`element:click` / `brush:filter` / `legend:filter` / `tooltip:disable`
- **自定义交互**：`register('interaction.xxx', () => (context, _, emitter) => { ...; return 清理函数 })`
- **Animate 三场景**：**enter**（入场，默认 fadeIn）、**update**（更新，默认 morphing 形变）、**exit**（退场，默认 fadeOut）；默认时长 300ms
- **配置**：`animate: { enter: { type: 'scaleInY', duration: 1000, delay, easing } }`；关全部 `animate: false`；关单场景 `animate: { enter: { type: false } }`
- **动画类型**：入场 `fadeIn / growInX / growInY / scaleInX / scaleInY / zoomIn / pathIn / waveIn`；更新 `morphing`；退场 `fadeOut / scaleOutX / scaleOutY / zoomOut`
- **数据驱动动画**（v5 特色）：动画属性就是**编码通道**——`encode: { enterDuration: (d) => d.end - d.start, enterDelay: 'startTime' }`，还能配 scale（`scale: { enterDuration: { range: [0, 3000] } }`）
- **交错入场**：transform `stackEnter`：`[{ type: 'stackEnter', groupBy: ['color', 'x'], duration: 2000 }]` 按组依次出现
- **stackEnter 是 transform 不是 animate 配置**：写在 `transform: []` 数组里（对 enter 动画通道做堆叠）
- **关键帧**：`timingKeyframe` 容器 + children 多视图，`direction / iterationCount` 控制播放；跨视图图形靠 encode **`key` / `groupKey`** 关联实现平滑 morphing

## 一、Composition：单实例多视图

单视图只能画一张图；把多张图组织进一个 Chart 实例，靠**视图复合（Composition）**节点。复合节点也是一种 type，用 `children` 装子视图，且**可以任意递归嵌套**——官方的说法是「通过一个单独的声明去实现一个报表」。

| type | 语义 | 典型场景 |
| --- | --- | --- |
| `spaceLayer` | 多视图**重叠**同一空间，各自独立坐标系 | 柱图 + 饼图叠加、双轴图 |
| `spaceFlex` | 水平 / 垂直**并排**（类 CSS flex） | 多图并列报表 |
| `facetRect` | **分面**：按字段把数据切子集，行列排布 | 小倍数图（small multiples） |
| `facetCircle` | 圆周分面 | 环形小倍数 |
| `repeatMatrix` | **重复**：数据不变，编码叉乘重复 | 散点相关性矩阵（SPLOM） |
| `timingKeyframe` | 时间维度管理视图 | 关键帧动画叙事 |

回忆[转换与坐标系](./transform-and-coordinate)的层级规则——「一个 view 只能有一个坐标系」：想在同一画布混用极坐标与直角坐标（柱 + 饼），唯一正解就是 `spaceLayer` 把它们放进不同子视图。

## 二、空间复合、分面、重复：三概念辨析

三个容易混的概念，按「空间怎么分、数据怎么分」区分（考点）：

| 概念 | 空间 | 数据 | 代表 |
| --- | --- | --- | --- |
| 空间复合 | 分（重叠或并排） | **不动**（各视图自带各的） | spaceLayer / spaceFlex |
| **分面** | 分 | **切子集**：每个子视图只见自己那份 | facetRect / facetCircle |
| **重复** | 分 | **全量**：每个子视图数据相同，变的是编码组合 | repeatMatrix |

分面的写法要点——**分面字段声明在 facetRect 自己的 encode 上**，children 里的 mark 再声明自己的 x / y：

```js
// 小倍数图：按 series 字段横向切成一排子图
chart.options({
  type: 'facetRect',
  data,
  encode: { x: 'series' },   // 分面字段：facetRect 自身的 encode
  children: [
    {
      type: 'line',
      encode: { x: 'date', y: 'value' }, // 子 mark 声明自己的 x/y
    },
  ],
});
```

## 三、双轴图的正确姿势

双轴图 = 「两个 mark 叠加 + 比例尺解绑 + 第二条轴放右侧」。v5 里每个 mark 可绑独立数据、多 mark 同名通道默认同步比例尺，所以只需三步：

```js
chart.options({
  type: 'view',
  data,
  children: [
    // 柱：左轴
    { type: 'interval', encode: { x: 'time', y: 'waiting' } },
    // 线：右轴
    {
      type: 'line',
      encode: { x: 'time', y: 'people' },
      scale: { y: { independent: true } },  // ① y 比例尺独立，不与柱同步
      axis: { y: { position: 'right' } },   // ② 第二条 y 轴放右侧
    },
  ],
});
```

需要两个视图各有坐标系（如柱 + 饼）时，把 `view` 换成 `spaceLayer` 即可。**最经典的翻车**：忘了 `independent: true`，两侧量纲差异大时小量纲折线被压成贴地直线；图例重复时记得对 legend 做去重处理。

## 四、Interaction 交互与 state 状态

交互按需声明在 view 或 mark 层（**mark 级覆盖 view 级**），键是交互名、值是配置或 `false`：

```js
chart.options({
  type: 'interval',
  data,
  encode: { x: 'genre', y: 'sold' },
  interaction: {
    tooltip: { shared: true },                          // 提示（行为层）
    brushXHighlight: true,                              // x 向刷选高亮
    elementHighlight: { link: true, background: true }, // 元素高亮（连带 link / 背景）
  },
  // state：状态样式，与交互联动
  state: {
    selected: { fill: '#f4bb51' },   // elementSelect 驱动 selected / unselected
    unselected: { opacity: 0.6 },
    active: { stroke: 'black' },     // highlight 类驱动 active / inactive
    inactive: { opacity: 0.3 },
  },
});
```

内置交互按族记：

- **提示**：`tooltip`、`poptip`；
- **元素族**：`elementHighlight / elementHighlightByColor / elementHighlightByX / elementSelect / elementSelectByColor / elementSelectByX / elementHoverScale`；
- **刷选族**：`brushHighlight / brushXHighlight / brushYHighlight / brushFilter / brushXFilter / brushYFilter / brushAxisHighlight`；
- **组件族**：`legendFilter / legendHighlight / sliderFilter / scrollbarFilter`；
- **其他**：`fisheye`（鱼眼探索）、`chartIndex`（索引图）。

**state 与交互的对应关系**是考点：select 族驱动 `selected` / `unselected`，highlight 族驱动 `active` / `inactive`——交互负责「何时切状态」，state 负责「切到什么样式」。

## 五、事件流与多图联动

交互体系构建在 `chart.on` / `chart.emit` 事件总线上：

```js
// 监听：刷选过滤事件
chart1.on('brush:filter', (e) => {
  const selection = e.data.selection;
  // 程序化触发另一张图的同名事件 → 多图联动（Focus + Context）
  chart2.emit('brush:filter', { data: { selection } });
});
```

- 事件名遵循 `组件:事件名` 格式：`element:click`、`brush:filter`、`legend:filter`、`tooltip:disable` 等；
- **多图联动的通用范式**：在 A 图 `on` 监听交互事件，转手对 B 图 `emit` 同类事件——大图刷选、小图缩放的 Focus + Context 就是这一对 on / emit；
- 交互不够用时可**自定义**：`register('interaction.xxx', () => (context, _, emitter) => { ...; return 清理函数 })` 注册后像内置交互一样使用。

## 六、Animate：三场景与数据驱动动画

G2 把动画拆成三个场景，各有默认值（默认时长 300ms）：

| 场景 | 触发 | 默认动画 |
| --- | --- | --- |
| **enter** | 图形入场 | fadeIn |
| **update** | 数据更新 | morphing（形变过渡） |
| **exit** | 图形退场 | fadeOut |

```js
animate: { enter: { type: 'scaleInY', duration: 1000 } } // 指定入场动画与时长
animate: false                                            // 关闭全部动画
animate: { enter: { type: false } }                       // 只关入场
```

动画类型清单：入场 `fadeIn / growInX / growInY / scaleInX / scaleInY / zoomIn / pathIn / waveIn`；更新 `morphing`；退场 `fadeOut / scaleOutX / scaleOutY / zoomOut`。

**v5 的特色是「动画属性就是编码通道」**——`enterDuration`、`enterDelay` 等可以像 x / y 一样绑定数据字段，甚至配比例尺：

```js
chart.options({
  type: 'interval',
  data,
  encode: {
    x: 'name',
    y: ['end', 'start'],
    enterDuration: (d) => d.end - d.start, // 动画时长由数据决定（甘特图按工期入场）
    enterDelay: 'startTime',               // 延迟绑定字段
  },
  scale: { enterDuration: { range: [0, 3000] } }, // 动画通道同样能配 scale
});
```

**交错入场**用 transform 里的 `stackEnter`——对 enter 通道做堆叠，让图形按组依次出现：

```js
transform: [{ type: 'stackEnter', groupBy: ['color', 'x'], duration: 2000 }]
```

## 七、关键帧动画叙事

`timingKeyframe` 是「时间维度」上的复合容器：children 里的多个视图按帧播放，`direction` / `iterationCount` 控制播放方向与次数。**跨视图的图形如何平滑过渡**？靠编码通道 `key` / `groupKey` 做数据↔图形关联——两帧之间 key 相同的图形会 morphing 形变（如散点图聚合演变成条形图），这正是「更新动画的对应依据」在关键帧场景的延伸。

```js
chart.options({
  type: 'timingKeyframe', // 关键帧容器
  children: [
    { type: 'point', data, encode: { x: 'gdp', y: 'life', key: 'country' } },      // 帧 1：散点
    { type: 'interval', data, encode: { x: 'country', y: 'gdp', key: 'country' } }, // 帧 2：条形
  ],
});
```

## 八、易错点

- **柱 + 饼混画不用 spaceLayer**：一 view 一坐标系，第二个 coordinate 静默失效。
- **分面字段写错位置**：分面字段在 facetRect 自身 encode，不在子 mark 上。
- **双轴忘 independent**：小量纲折线贴地。
- **state 与交互配不成对**：配了 `selected` 样式却没开 `elementSelect`（或反之），状态永远不触发。
- **关键帧忘绑 key**：跨视图无法建立图形对应关系，morphing 退化为生硬切换。

---

至此语法全图完成：单图（mark / encode / transform / scale / coordinate / 组件）→ 多图（composition）→ 联动叙事（interaction / animate）。查表与迁移对照见[参考](../reference)。
