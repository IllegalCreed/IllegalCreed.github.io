---
layout: doc
---

# Mermaid

「JavaScript 文本转图表」工具：用 Markdown 风格的 DSL 描述图，浏览器端解析后渲染成 **SVG**——diagram-as-code，让图表跟文档一起进版本库、可 diff、可 review，专治「Doc-Rot」（文档腐烂）。当前版本 **v11.16.0**（MIT，作者 Knut Sveidqvist，2019 JS Open Source Awards 得主），**22+ 种图**覆盖流程/时序/类/状态/ER/甘特/Git 全场景；GitHub、GitLab、Notion、Obsidian、Typora 等平台原生渲染围栏 mermaid 代码块，是技术文档绘图的事实标准。

## 评价

**优点**

- **学习成本极低**：会 Markdown 就能上手——首行声明图类型，几行文本即出图
- **图随代码活**：文本进 Git、可 diff、可 review，改一行文字全图自动重排，维护成本最低
- **平台原生支持面碾压**：GitHub/GitLab/Obsidian/Typora 围栏直接出图；纯 JS 浏览器端渲染、零服务依赖（对比 PlantUML 需 Java + Graphviz 服务端）
- **图类型全**：从流程/时序/类/状态/ER/甘特/gitGraph 到思维导图、时间线、架构图、报文图
- **v11 增量可观**：`look: handDrawn` 手绘风、`layout: elk` 备选布局引擎、30+ 新形状、边动画

**缺点**

- **布局由引擎自动决定**：精细排版、像素级控制力弱于拖拽工具（draw.io）
- **纯浏览器渲染**：依赖真实 DOM，SSR / Node 端不能直接跑，无头场景需 mermaid-cli（puppeteer）绕行
- **样式覆盖难**：SVG 内联样式优先级高，外部 CSS 常改不动，须走 classDef / themeVariables 通道
- **重度 UML 建模表达力不及 PlantUML**：时序/类图的高级 UML 细节仍有差距

## 本叶地图

- [入门](./getting-started) —— 定位（文本即图）、渲染管线、四种使用方式、CDN 与 `startOnLoad` 第一个图、通用语法骨架、集成生态现状
- [流程图与时序图](./guide-line/flowchart-and-sequence) —— flowchart 方向/形状/连线/子图/样式/交互全语法 + sequenceDiagram 消息箭头/激活/控制块全语法
- [类图 / 状态图 / ER 图](./guide-line/class-state-er) —— 成员与可见性、关系箭头八件套语义、状态机复合/并发/fork/choice、ER 基数符号与 identifying 关系
- [甘特 / gitGraph / 更多图](./guide-line/gantt-git-and-more) —— 甘特任务与时间轴、饼图、Git 分支图与 cherry-pick 前提、新图类型速览
- [配置 / API / 安全](./guide-line/config-api-security) —— 三层配置、主题与 themeVariables、run/render/parse API、securityLevel 四值、mermaid-cli、转义坑
- [参考](./reference) —— 图类型/形状/箭头/基数/配置速查表 + 易错点清单 + 资源链接

## 文档地址

[Mermaid Docs](https://mermaid.js.org)

## GitHub 地址

[mermaid-js/mermaid](https://github.com/mermaid-js/mermaid)

## 幻灯片地址

<a href="/SlideStack/mermaid-slide/" target="_blank">Mermaid</a>
