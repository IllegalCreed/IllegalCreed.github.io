---
layout: doc
---

# D3.js

D3（**Data-Driven Documents**）是基于 Web 标准的**低层级数据可视化工具集**——它**不是图表库**，没有「图表」这个概念，而是用数据驱动 DOM（SVG / Canvas / HTML），换取无与伦比的定制自由度。核心创新是 **data join**（enter / update / exit 三态数据绑定），几乎所有高层图表库（Observable Plot、Recharts 的底层思想、ECharts 的 scale 设计）都受其影响。当前版本 `d3@7.9.0`（作者 Mike Bostock，ISC 协议），v7 是 **30 个独立模块的元包**（d3-selection@3、d3-scale@4、d3-force@3 等各自独立发版），其中 d3-scale / d3-shape / d3-array / d3-hierarchy 是**纯数据计算、不碰 DOM** 的模块——这也是它能与 React / Vue 分工协作的基础。它被称为可视化领域的「汇编语言」与事实标准，拿下 IEEE VIS 与 Information is Beautiful 双料 Test of Time Award。

## 评价

**优点**

- **定制自由度无上限**：不受预设图表类型束缚，任意视觉形式都能造——新闻级定制叙事图、创新图型的唯一解
- **data join + transition**：对每个元素的进场/更新/离场做精确动画控制，key 函数（object constancy）保证动画语义正确
- **模块化**：30 个模块按需引入；纯计算模块可单独当「可视化数学库」用——Recharts / Nivo / Observable Plot 都构建于 D3 模块之上
- **渲染介质自选**：SVG / Canvas / HTML 都能驱动，大数据量可走 Canvas 路线
- **事实标准**：可视化领域的公共语言，生态与教程沉淀深厚

**缺点**

- **上手成本高**：一个基础柱状图也要几十行代码，且需要懂 SVG 坐标系
- **DOM 所有权要自己管**：与 React / Vue 集成需明确划界（谁渲染、谁清理）
- **对常规需求是 overkill**：官方直言内部仪表板、一次性分析别用 D3，推荐自家高层姊妹库 Observable Plot（「D3 直方图约 50 行，Plot 1 行」）

官方对定位的原话：「Consider D3 an alternative to "doing everything yourself", not an alternative to a high-level charting library.」——赶时间做仪表板该用 Plot / ECharts；要做《纽约时报》级定制交互可视化，D3 是唯一解。

## 本叶地图

- [入门](./getting-started) —— 定位哲学（为什么不是图表库）、30 模块架构与引入方式、第一张柱状图（margin convention）、与图表库怎么选、框架协作两模式
- [选择集与数据绑定](./guide-line/selection-and-data) —— select/selectAll、修改与控制流、v6 事件、enter/update/exit 三态、join() 新范式、key 函数
- [比例尺与坐标轴](./guide-line/scales-and-axes) —— scale 全家桶选型、invert/nice/clamp、band/ordinal 的坑、d3-axis 与网格线
- [形状与层级布局](./guide-line/shapes-and-layouts) —— line/area/arc/pie/stack 生成器、curve 家族选型、hierarchy 与 tree/treemap/pack
- [力导向图](./guide-line/force-simulation) —— forceSimulation、alpha 温度机制、力清单区分、拖拽三步范式、静态布局
- [过渡与交互](./guide-line/interaction-and-transition) —— transition 插值与中断、zoom 几何/语义缩放、drag、brush、tooltip bisector 范式
- [参考](./reference) —— 模块速查表、数据处理 API、autoType/时间格式符号、易错点清单、链接

## 文档地址

[D3.js](https://d3js.org/)

## GitHub 地址

[d3/d3](https://github.com/d3/d3)

## 幻灯片地址

<a href="/SlideStack/d3-slide/" target="_blank">D3.js</a>
