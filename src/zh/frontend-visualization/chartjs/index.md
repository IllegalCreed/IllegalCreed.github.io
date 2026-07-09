---
layout: doc
---

# Chart.js

最流行的开源 JavaScript 图表库（约 6 万 star、npm 周下载约 240 万）：基于 **HTML5 Canvas** 渲染，内置 **8 种图表类型**（line / bar / pie / doughnut / radar / scatter / bubble / polarArea，另可混搭 mixed），合理默认值开箱即用、默认自带动画与响应式；v3 起全面组件化、支持 **tree-shaking**（官方实测按需注册约省 25% 包体），TypeScript 类型内置。当前版本 **4.5.x**（ESM-only 包），走「简单常用图表快速出活」路线——不追求 ECharts 的大而全，也不像 D3 提供底层绘图原语，胜在上手 5 分钟、默认好看、包体可裁剪。

## 评价

**优点**

- **上手极快**：一个 `new Chart(ctx, { type, data, options })` 即出图，config 三件套心智模型简单，默认值省心
- **Canvas 渲染**：大数据集下优于 SVG 方案——DOM 节点数不随数据点增长而爆炸
- **包体可裁剪**：controller / element / scale / plugin 全组件化，用什么注册什么（官方 Step-by-step 实测按需注册较 auto 省约 56 KB）
- **三级扩展体系**：scriptable options（样式项给函数）→ 插件钩子（覆盖完整生命周期）→ 自定义 controller（造新图表类型），中等复杂度需求都能覆盖
- **框架无关 + 类型内置**：vue-chartjs / react-chartjs-2 只是薄封装；`.d.ts` 内置无需 @types

**缺点**

- **图表类型少**：仅 8 种内置，桑基图/关系图/地图等需社区插件或换库（ECharts 的领域）
- **Canvas 无 DOM 可访问性**：画布内容屏幕阅读器不可见，需手动 `role="img"` + `aria-label` 补救
- **复杂联动要自己写**：多图联动、大屏级交互不如 ECharts 一站式
- **ESM-only 有迁移成本**：CommonJS 只能动态 `import()`，Jest 场景官方建议迁 Vitest

## 本叶地图

- [入门](./getting-started) —— 安装与引入、注册机制（auto vs 按需 register）、第一个图表、config 三件套、框架集成一瞥
- [数据结构与 options 体系](./guide-line/data-and-options) —— data 四种格式、parsing、options 解析层级、scriptable / indexable options、响应式、颜色字体、动画
- [坐标轴与交互](./guide-line/scales-and-interactions) —— scales 对象键式、time adapter、min/max、interaction 六种 mode、tooltip 定制、legend / title
- [插件体系与自定义图表](./guide-line/plugins-and-custom) —— inline vs 全局插件、生命周期钩子、Filler / Colors、mixed 混合图、自定义 controller
- [性能优化与实例管理](./guide-line/performance) —— destroy / update、Chart.getChart、禁动画、decimation 降采样、parsing:false、OffscreenCanvas
- [参考](./reference) —— 类型 / 配置 / 实例 API / 迁移映射速查表 + 易错点清单

## 文档地址

[Chart.js Docs](https://www.chartjs.org/docs/latest/)

## GitHub 地址

[chartjs/Chart.js](https://github.com/chartjs/Chart.js)

## 幻灯片地址

<a href="/SlideStack/chartjs-slide/" target="_blank">Chart.js</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=chart-js" target="_blank" rel="noopener noreferrer">Chart.js 测试题</a>
