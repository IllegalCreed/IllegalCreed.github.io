---
layout: doc
outline: [2, 3]
---

# 参考：G2 速查表

> 基于 **AntV G2 v5.4**（npm latest 5.4.8）· 核于 2026-07

## 速查

- **心智公式**：一张图 ≈ `data + mark(type) + encode + transform + scale + coordinate + 组件 + animate + interaction`
- **图表 ↔ 组合对照**（最常用）：
  - 柱状图 = `interval`
  - 条形图 = `interval` + coordinate `transpose`
  - **饼图 = `interval` + `encode: { y, color }`（x 留空）+ `stackY` + coordinate `theta`**（innerRadius → 环图）
  - 玫瑰图 = `interval` + coordinate `polar`（半径比大小）；玉珏图 = `radial`
  - 直方图 = `rect` + `binX: { y: 'count' }`
  - 堆叠柱 = `stackY`；分组柱 = `dodgeX`；百分比堆叠 = `stackY` → `normalizeY`（顺序敏感）
  - 带点折线 = view children 里 `line` + `point`
  - 双轴图 = 两 mark + `scale: { y: { independent: true } }` + `axis: { y: { position: 'right' } }`
- **实例生命周期**：`new Chart({ container, autoFit })` → `options()` → `render()`（返回 `Promise<Chart>`，须 await）→ `changeData()` 更新 → `destroy()` 卸载；`clear()` 清配置留实例
- **双 API**：`chart.options({...})` Spec 式（主推）与 `chart.interval().encode(...)` 函数式**完全等价**、可混用
- **数据三形式**：内联数组 / `{ type: 'inline' }` / `{ type: 'fetch' }`（json / csv）；data.transform 预处理**原始行**、mark transform 加工**通道值**
- **React / Vue 范式**：ref 容器 + 挂载时 new + 卸载时 destroy + 数据变化 changeData（勿重建实例）
- **encode 四形式**：字段字符串 / 常量 / 回调（返回抽象数据再走 scale）/ column 数组；消歧用 `{ type: 'constant', value }`
- **scale 推断**：字符串 / 布尔→分类（定量通道→point、其余→ordinal）；Date→time；数值→linear；颜色连续无 range→sequential；band（柱）vs point（折线）看有无宽度
- **比例尺同步**：同 view 同名通道默认同步；`independent: true` / scale `key` 分组解绑（双轴核心）
- **主题**：`theme: 'classic'`（默认）/ `'classicDark'` / `'academy'` / 自定义对象
- **组件隐藏统一模式**：`axis: false`、`legend: { color: false }`、`tooltip: false`、`animate: false`
- **tooltip 两层**：mark `tooltip` 管内容（title / items），`interaction.tooltip` 管行为（shared / crosshairs / render）
- **防重叠**：轴标签 `labelAutoRotate / labelAutoHide / labelAutoEllipsis / labelAutoWrap`；数据标签 transform `overlapDodgeY / overlapHide / contrastReverse / overflowHide`
- **state 四状态**：`selected / unselected`（select 族驱动）、`active / inactive`（highlight 族驱动）
- **事件**：`chart.on / emit`，`组件:事件名` 格式（`element:click`、`brush:filter`）；多图联动 = on 转 emit
- **动画默认**：enter fadeIn / update morphing / exit fadeOut，300ms；动画属性是编码通道（enterDuration 可绑字段）
- **渲染器**：Canvas 内置默认；SVG / WebGL 单独装包 + `renderer: new SVGRenderer()`
- **SSR**：`@antv/g2-ssr` 的 `createChart` → `exportToFile`；或 node-canvas / jsdom 自组；产物静态无交互动画
- **按需打包**：`extend(Runtime, { ...corelib() })` 裁剪 library 减包体
- **生态**：G2Plot 基于 G2 4.x 已定格；v5 上层封装 = Ant Design Charts；移动端 F2、关系图 G6、图编辑 X6、地理 L7、交叉表 S2
- **v4 判别标志**：`position('x*y')`、`adjust('stack')`、`chart.scale('field', {...})` ——见到即老资料

## 一、Mark 速查表

| mark | 含义 | 对应传统图表 |
| --- | --- | --- |
| `interval` | 区间条 | 柱状 / 条形（+transpose）/ 饼（+theta）/ 玫瑰（+polar） |
| `line` | 折线 | 折线图；+parallel = 平行坐标系图 |
| `point` | 点 | 散点图、气泡图（size 编码） |
| `area` | 面积 | 面积图、堆叠面积图 |
| `cell` | 单元格分割 | 热力日历、分块热力图 |
| `rect` | 矩形 | 直方图（+binX）、矩形树图 |
| `text` / `image` / `link` | 文本 / 图片 / 两点连线 | 数据标注、关系标注 |
| `lineX` / `lineY` | 垂直 / 水平辅助线 | 均值线、参考线（v4 annotation 替代） |
| `range` / `rangeX` / `rangeY` | 区域块 | 区间高亮标注 |
| `box` / `boxplot` | 箱形 | 箱线图（boxplot 自带聚合） |
| `vector` / `shape` | 向量 / 自定义图形 | 向量场、任意定制 |
| `heatmap` / `density` | 密度热力 / 核密度 | 热力图、小提琴图 |
| `wordCloud` / `gauge` / `liquid` | 复合标记 | 词云 / 仪表盘 / 水波图 |
| `sunburst` / `chord` / `sankey` | 复合标记 | 旭日图 / 弦图 / 桑基图 |
| `treemap` / `pack` / `forceGraph` | 复合标记 | 矩形树图 / 打包图 / 力导向图 |

自定义复合标记：函数返回 spec（或 spec 数组）即可当 type；自定义 shape：`register('shape.interval.triangle', (style, context) => (P, value, defaults) => ...)`。

## 二、Transform 速查表

| 类别 | transform | 用途 |
| --- | --- | --- |
| 布局防重叠 | `stackY` | 堆叠（堆叠柱 / 饼图定角） |
| | `dodgeX` | 分组错位（分组柱） |
| | `jitter / jitterX / jitterY` | 散点抖动 |
| | `symmetryY` | 对称（河流图） |
| | `diffY` | 差值 |
| | `pack` | 紧密排布 |
| | `sample` | 大数据采样 |
| | `flexX` | 变宽柱 |
| 聚合统计 | `bin / binX` | 连续分箱（直方图） |
| | `group / groupX / groupY / groupColor` | 分组聚合（mean / max / min / count / sum…） |
| | `normalizeY` | 归一化（百分比图） |
| 筛选排序 | `select / selectX / selectY` | 按 selector 选极值（峰值标注） |
| | `sortX / sortY / sortColor` | 排序 |
| 动画 | `stackEnter` | enter 通道堆叠（交错入场） |

**数组顺序即执行顺序**；data.transform（`filter / map / sort / sortBy / pick / rename / fold / join / slice / kde / ema / log / custom`）处理原始行，mark transform 处理通道值。

## 三、Coordinate 速查表

| type | 含义 | 典型产物 |
| --- | --- | --- |
| `cartesian` | 直角坐标（默认） | 柱 / 折 / 散点 |
| `polar` | 极坐标（角度 + 半径） | 玫瑰图 |
| `theta` | 半径固定、只映射角度 | 饼图 / 环图 |
| `radial` | 极坐标转置扩展 | 玉珏图 |
| `helix` | 螺旋 | 螺旋图 |
| `parallel` | 平行坐标 | 平行坐标系图 |
| `radar` | polar + parallel 混合 | 雷达图 |
| `fisheye` | 鱼眼放大 | 焦点探索 |
| `cartesian3D` | 三维直角 | 3D 图表 |

坐标系变换：`coordinate: { transform: [{ type: 'transpose' }] }`；属性平铺：`outerRadius` / `innerRadius` 直接写在 coordinate 对象上。**一 view 一坐标系，先声明者优先**。

## 四、Interaction 速查表

| 族 | 交互 | 说明 |
| --- | --- | --- |
| 提示 | `tooltip` / `poptip` | 提示框行为层（shared / crosshairs / render） |
| 元素 | `elementHighlight`（ByColor / ByX） | 悬停高亮 → active / inactive |
| | `elementSelect`（ByColor / ByX） | 点击选中 → selected / unselected |
| | `elementHoverScale` | 悬停放大 |
| 刷选 | `brushHighlight`（X / Y） | 框选高亮 |
| | `brushFilter`（X / Y） | 框选过滤 |
| | `brushAxisHighlight` | 轴上刷选 |
| 组件 | `legendFilter / legendHighlight` | 图例筛选 / 高亮 |
| | `sliderFilter / scrollbarFilter` | 缩略轴 / 滚动条筛选 |
| 其他 | `fisheye` / `chartIndex` | 鱼眼、索引图 |

事件总线：`chart.on('brush:filter', cb)`、`chart.emit('brush:filter', { data })`；自定义交互 `register('interaction.xxx', ...)`。

## 五、v4 → v5 迁移对照

| v4 写法 | v5 写法 |
| --- | --- |
| `chart.interval().position('x*y').color('type')` | `chart.options({ type: 'interval', encode: { x, y, color: 'type' } })` |
| `adjust('stack')` / `adjust('dodge')` | `transform: [{ type: 'stackY' }]` / `[{ type: 'dodgeX' }]` |
| `chart.annotation().line(...)` 等 | `lineX` / `lineY` / `rangeY` 等标注型 mark |
| `chart.facet(...)` | `facetRect` / `facetCircle` 复合节点 |
| `chart.scale('field', { values })` | scale 绑**通道**：`scale: { x: { domain } }`（values → domain） |
| `padding: [10, 20, 30, 40]` 数组 | 拆为 `paddingLeft / paddingRight` 等 |
| 动画 `appear` 场景 | 并入 `enter` |
| 编码回调返回**视觉值** | 回调返回**抽象数据**（再经 scale 映射） |
| 时间字符串自动解析 | 需显式 `new Date(...)` |

判别 v4 老资料：见到 `*` 连接字段（`position('x*y')`）、geometry 链上 `.position()`、`adjust(...)` 即弃用。

## 六、渲染器、SSR 与按需打包

**渲染器三选一**（底层为 @antv/g 统一渲染引擎）：

| 渲染器 | 包 | 适用 |
| --- | --- | --- |
| Canvas | `@antv/g-canvas`（**内置默认**） | 通用；脏矩形优化 |
| SVG | `@antv/g-svg`（需单独安装） | 产出 DOM：无障碍、样式检查、导出矢量 |
| WebGL | `@antv/g-webgl`（需单独安装） | 大数据量高性能，可自动降级 |

切换：`new Chart({ renderer: new SVGRenderer() })`——只装 `@antv/g2` 就传 SVGRenderer 会报模块缺失。

**SSR（Node.js 出图）**：原理是 Chart 支持传入自定义 Canvas——node-canvas（Canvas2D 兼容实现）+ @antv/g-canvas 出 PNG / JPEG / PDF 流，或 jsdom 出 SVG。官方封装 `@antv/g2-ssr`：

```js
import { createChart } from '@antv/g2-ssr';

const chart = await createChart({
  imageType: 'png', // 产物类型
  type: 'interval',
  data,
  encode: { x: 'genre', y: 'sold' },
});
chart.exportToFile('chart'); // 导出 chart.png，约 400ms/张
```

SSR 产物是**静态图，无交互无动画**。

**按需打包**：可视化组件经 library 组织，`extend(Runtime, { ...corelib() })` 只带核心库走 Tree Shaking 减包体；geolib、3dlib 等可按需追加。

## 七、生态选型（AntV 家族分工）

| 场景 | 选择 | 说明 |
| --- | --- | --- |
| 统计图表（语法式） | **G2** | 本篇 |
| React 开箱图表 | **Ant Design Charts**（`@ant-design/charts` / `@ant-design/plots`） | 2.x 底层已是 G2 v5 |
| ~~开箱图表（旧）~~ | G2Plot | **停留在 G2 4.x**，新项目勿选 |
| 图 / 网络关系 | G6 | 关系可视化 |
| 图编辑器 | X6 | 流程图 / DAG |
| 地理空间 | L7 | 地图 |
| 移动端 | F2 | G2 面向 Web / Node，移动端 / 小程序场景由 F2 或社区适配承接 |
| 多维交叉表 | S2 | 透视表 |

## 八、易错点清单

- **v4 教程陷阱（头号坑）**：`position('x*y')`、`adjust('stack')`、`chart.scale('field', {...})` 全是 v4 写法，v5 完全不兼容。
- **encode 字段名拼错静默失败**：不存在的列名被当常量——不报错、不生成图例；`encode: { color: 'red' }` 撞同名列时写显式 `{ type: 'constant', value: 'red' }`。
- **饼图忘 stackY**：扇区全从 0 起画互相覆盖；「theta 定形，stackY 定角」。
- **transform 顺序敏感**：`normalizeY` 放 `stackY` 前面结果错误；`binX` 与 `stackY` 同理。
- **一 view 一坐标系**：混用极坐标 + 直角必须 spaceLayer 分层，第二个 coordinate 声明不生效。
- **autoFit 与容器尺寸**：autoFit 时手动宽高被容器覆盖；容器未布局（无高度）时图表高度异常。
- **框架里用字符串 id 当 container**：多实例 id 冲突渲染错乱，用 ref 传元素。
- **忘 destroy 内存泄漏**：SPA 路由切换 / 组件卸载必调 `chart.destroy()`。
- **数据更新误用重建**：应持有实例调 `changeData`（或改 options 后 `render()`），勿每次 `new Chart`。
- **render 异步**：render 后立即截图 / 取 DOM 可能拿到空画布，须 await。
- **渐变单线需禁 series**：color 绑连续字段画单线时 `series: () => undefined`。
- **d3-format 字符串**：`'.0%'`、`'~s'` 是 d3-format 语法，不是模板字符串。
- **SVG / WebGL 渲染器要单独装包**：Canvas 才是内置。
- **双轴忘 independent**：量纲差异大时小量纲折线被压成直线。

## 九、权威链接

- [G2 官方文档](https://g2.antv.antgroup.com) —— 手册 / 示例 / API
- [快速上手](https://g2.antv.antgroup.com/manual/quick-start) —— 第一个图表
- [什么是 G2](https://g2.antv.antgroup.com/manual/introduction/what-is-g2) —— 图形语法理念与七大概念
- [图表 API](https://g2.antv.antgroup.com/manual/api) —— 构造参数 / 实例方法 / 双 API 风格
- [v5 新特性](https://g2.antv.antgroup.com/manual/whats-new/new-version-features) —— 设计理念与按需打包
- [v4 → v5 迁移指南](https://g2.antv.antgroup.com/manual/whats-new/migration-from-g2v4) —— 断代对照
- [服务端渲染](https://g2.antv.antgroup.com/manual/extra-topics/ssr) —— Node.js 出图
- [GitHub: antvis/G2](https://github.com/antvis/G2) —— 源码与 issue
