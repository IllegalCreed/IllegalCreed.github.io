---
layout: doc
outline: [2, 3]
---

# 入门：安装、注册与第一个图表

> 基于 **Chart.js 4.5.x**（npm latest 4.5.1，ESM-only 包）· 核于 2026-07

## 速查

- **安装**：`npm install chart.js`；CDN 走 jsDelivr / CDNJS；GitHub 不再提供预构建产物（需自行编译）
- **CDN 生产建议**：锁版本 + SRI（`integrity="sha384-..." crossorigin="anonymous"`），防 CDN 被篡改
- **包形态**：**ESM-only**（`package.json` 带 `"type": "module"`）；唯一运行时依赖 `@kurkle/color`；无 peerDependencies
- **TypeScript 类型内置**（exports 带 types 字段），无需 @types 包
- **CommonJS 兜底**：`const { Chart } = await import('chart.js')` 动态引入；RequireJS 只能用 `dist/chart.umd.min.js`
- **v4 分发文件改名**：`chart.esm.js → chart.js`、`chart.min.js → chart.umd.min.js`
- **三个导出入口**：
  - `chart.js` —— 主入口，named import + 按需注册（生产推荐）
  - `chart.js/auto` —— default import，全量自动注册（快速上手，包体大）
  - `chart.js/helpers` —— 工具函数（如 `getRelativePosition`）
- **注册三路线**：
  - 路线 A：`import Chart from 'chart.js/auto'`（全量）
  - 路线 B：`import { Chart, BarController, ... } from 'chart.js'` + `Chart.register(...)`（按需）
  - 路线 B'：`Chart.register(...registerables)`（等价 auto 的显式写法）
- **按需注册收益**：官方实测较 auto 减约 56 KB（示例应用约 -25%）
- **漏注册典型报错**：`"category" is not a registered scale`（controller / element / plugin 同格式）
- **bar 最小组件集**：BarController + BarElement + CategoryScale + LinearScale
- **line 最小组件集**：LineController + LineElement + PointElement + 两个 scale
- **pie / doughnut**：对应 Controller + ArcElement（**无需 scale**）
- **script 标签 / UMD 场景无需注册**（全量内置）
- **config 三件套**：`new Chart(ctx, { type, data, options })`
- **ctx 三种合法形式**：canvas 元素 / 2d context / canvas id 字符串
- **data 最小结构**：`{ labels: [...], datasets: [{ label, data }] }`
- **8 种内置类型**：line / bar / pie / doughnut / radar / scatter / bubble / polarArea（mixed 靠 dataset 级 `type` 混搭；面积图 = line/radar + `fill`，非独立类型）
- **默认即有**：动画（1000ms）、响应式（`responsive: true`）、Canvas 渲染
- **容器铁律**：canvas 外包一层**专属 + 相对定位**的 div，宽高设在容器上（响应式必需）
- **框架集成**：vue-chartjs / react-chartjs-2 只是薄封装；SPA 卸载必 `chart.destroy()`（防「Canvas is already in use」）
- **测试环境**：Jest 需开 ESM 支持，官方建议 Vitest

## 一、Chart.js 是什么

最流行的开源 JavaScript 图表库（约 6 万 star、npm 周下载约 240 万），核心特征：

- **HTML5 Canvas 渲染**——与 ECharts 同阵营、与 D3 常走的 SVG 路线相对。Canvas 的优势是 DOM 节点数不随数据点增长，大数据集下比 SVG 方案（节点爆炸）更高效；代价是画布内元素没有天然的 DOM 可访问性。
- **8 种内置图表类型**：`line`、`bar`、`pie`、`doughnut`、`radar`、`scatter`、`bubble`、`polarArea`；再加 dataset 级 `type` 覆盖即得 mixed 混合图。面积图不是独立类型——line/radar 设 `fill` 即面积。
- **合理默认值开箱即用**：默认带动画（1000ms）、默认响应式（`responsive: true`），一个 config 对象即出图。
- **可 tree-shaking**：v3 起 controller / element / scale / plugin 全部组件化，用什么注册什么。
- **类型内置**：无需 @types 包。

定位一句话：不追求 ECharts 的大而全，也不像 D3 提供底层绘图原语——胜在**上手 5 分钟、默认好看、包体可裁剪**，配 scriptable options、插件钩子、自定义 controller 三级扩展体系，中等复杂度需求都能覆盖。

## 二、安装与引入

### npm 安装与包形态

```bash
npm install chart.js
```

4.5.x 的包形态要点：

- **ESM-only**：`package.json` 带 `"type": "module"`（`main: ./dist/chart.cjs`、`module: ./dist/chart.js`）。
- **CommonJS 项目**无法 `require('chart.js')`，只能动态引入：

```js
// CJS 项目唯一姿势：动态 import
const { Chart } = await import('chart.js');
```

- **UMD 构建仍随包分发**（`dist/chart.umd.min.js`），供 CDN / RequireJS 使用；v4 起分发文件改名：`chart.esm.js → chart.js`、`chart.min.js → chart.umd.min.js`。
- 唯一运行时依赖 `@kurkle/color`（颜色解析），无 peerDependencies。
- 测试环境：Jest 需开 ESM 支持，官方建议迁 Vitest。

### CDN

CDN 用 jsDelivr / CDNJS；GitHub 不再提供预构建产物（需自行编译）。生产环境引 CDN 建议**锁版本并加 SRI**（`integrity="sha384-..." crossorigin="anonymous"`），防 CDN 被篡改。

### 三个导出入口

| 入口 | 用法 | 场景 |
| --- | --- | --- |
| `chart.js` | named import + 按需注册 | 生产推荐，可 tree-shaking |
| `chart.js/auto` | default import，全量自动注册 | 快速上手 / 原型 |
| `chart.js/helpers` | 工具函数（如 `getRelativePosition`） | 事件坐标换算等 |

## 三、第一个图表

官方 quick start（裸 CDN 标签版）：

```html
<!-- canvas 外包一层专属 div 容器（响应式必需） -->
<div><canvas id="myChart"></canvas></div>

<!-- 演示用裸 CDN 标签（官方 quick start 原样）：
     生产环境务必锁定版本并加 SRI：integrity="sha384-..." crossorigin="anonymous" -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
  new Chart(document.getElementById('myChart'), {
    type: 'bar',                       // 图表类型
    data: {                            // labels + datasets
      labels: ['Red', 'Blue', 'Yellow'],
      datasets: [{ label: '# of Votes', data: [12, 19, 3], borderWidth: 1 }]
    },
    options: { scales: { y: { beginAtZero: true } } }  // 配置
  });
</script>
```

三个入门要点：

- 第一参数可传 **canvas 元素、2d context、canvas id 字符串**三种形式。
- script 标签 / UMD 场景**不需要注册组件**（全量内置）。
- 官方建议 canvas 外包一层**专属 div 容器**——响应式机制监听的是父容器而非 canvas 本身（原理与容器规则详见[数据结构与 options 体系](./guide-line/data-and-options)）。

## 四、config 三件套：type / data / options

config 恒为 `{ type, data, options }`：

- **`type`**：图表类型字符串（8 种内置之一；mixed 图 = 顶层 type + dataset 级 `type` 覆盖）。
- **`data`**：`{ labels, datasets }`——`labels` 服务索引轴（category 轴）；每个 dataset 的 `label` 用于图例与 tooltip 文案，`data` 是数据本体。
- **`options`**：其余一切配置的家——坐标轴（`scales`）、插件（`plugins.tooltip` / `legend` / `title`）、交互（`interaction`）、动画（`animation`）等。`scales.y.beginAtZero: true` 是 y 轴最常见的第一配置。

## 五、注册机制与 tree-shaking（v4 核心特色）

Chart.js v3+ 全组件化，**用什么注册什么**，两条主路线：

```js
// 路线 A：全量（快速上手，包体大）—— default import
import Chart from 'chart.js/auto';

// 路线 B：按需注册（生产推荐）—— named import
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

// 路线 B'：一次注册全部（等价 auto 的显式写法）
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);
```

各图表类型的最小组件集：

| 图表 | 必需组件 |
| --- | --- |
| bar | BarController + BarElement + CategoryScale + LinearScale |
| line | LineController + LineElement + PointElement + 两个 scale |
| pie / doughnut | 对应 Controller + ArcElement（**无需 scale**） |

- 可注册的 **plugin**：`Decimation`、`Filler`、`Legend`、`SubTitle`、`Title`、`Tooltip`、`Colors`；可注册的 **scale**：`CategoryScale`、`LinearScale`、`LogarithmicScale`、`TimeScale`、`TimeSeriesScale`、`RadialLinearScale`。
- 官方 Step-by-step guide 实测：按需注册较 auto **减少约 56 KB**（示例应用约 -25%）。
- 漏注册的典型报错：`"category" is not a registered scale`——按需引入后凡是出现 `"xxx" is not a registered controller/scale/element/plugin`，第一反应查注册清单。

## 六、框架集成一瞥

- Chart.js 本身**框架无关**；`vue-chartjs`、`react-chartjs-2` 等只是薄封装。
- SPA（Vue / React）最高频的坑是**热更新 / 组件重建时对同一 canvas 重复 new Chart**，必报「Canvas is already in use」——组件卸载钩子里 `chart.destroy()`，或重建前 `Chart.getChart(canvas)?.destroy()`（详见[性能优化与实例管理](./guide-line/performance)）。
- 打包器场景按路线 B 按需注册即可；注意 ESM-only 对 CJS 工具链的影响（见上文安装一节）。

下一页：[数据结构与 options 体系](./guide-line/data-and-options) —— data 四种格式、parsing 字段映射、options 解析层级、scriptable options 与响应式。
