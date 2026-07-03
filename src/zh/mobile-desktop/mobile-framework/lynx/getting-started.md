---
layout: doc
outline: [2, 3]
---

# 入门：Lynx 是什么与怎么起步

> 基于 Lynx（2025 开源）· 核于 2026-07

## 速查

- **一句话**：Lynx 是**字节 2025 开源的高性能跨端 UI 框架**，用 **React 心智 + 类 Web CSS** 编写，在 **iOS / Android / HarmonyOS / Web / Desktop** 多端渲染；口号 **「Write Once, Render Anywhere」**
- **定位（重要）**：**新兴 / 观察叶**——厂内（TikTok、CapCut）大规模、**厂外生态早期**，2026 年宜**试验**不宜当主力；不少实现细节官方资料尚不充分
- **差异化核心**：**双线程架构**（主/UI 线程跑首帧与手势、后台线程跑业务）+ 自研 JS 引擎 **PrimJS**
- **上层框架**：**ReactLynx**（idiomatic React，完整支持函数组件 / Hooks / Context）；架构不与 React 强绑，另有 Vue/Svelte（成熟度资料尚不充分）
- **样式**：**类 Web CSS**——`linear / flex / grid / relative` 四种布局 + CSS 变量/动画/选择器；但默认 `box-sizing: border-box`、**无 margin 折叠**、**文本必须包在 `<text>` 里**
- **起步**：`npm create rspeedy@latest` → `npm install` → `npm run dev` → 用 **Lynx Explorer App** 扫二维码，或粘贴 bundle URL 预览
- **环境**：**Node.js 18+**（用 TS 写配置需 18.19+）；构建工具 **Rspeedy**（基于 Rspack）
- **渲染模型**：官网称「**原生渲染** 或 **pixel-perfect 自绘渲染器**」——两者的确切边界资料尚不充分
- **进阶顺序**：先读[双线程架构与 PrimJS](./guide-line/dual-thread)吃透主/后台线程 → 再读[ReactLynx 与开发模型](./guide-line/reactlynx)与[与 RN 对比·生态现状](./guide-line/status-vs-rn)

## 一、Lynx 解决什么问题

Lynx 想回答的问题与 React Native 相似：**能否用前端团队已有的 Web/React 技能，产出接近原生体验、且能一套代码跑多端的 App？** 但它给出的答案在两处明显不同：

1. **双线程架构**：把「首屏关键渲染 + 高优先级手势」放在**主线程 / UI 线程**同步完成，把「业务逻辑 / 副作用 / 异步」放到**后台线程**，让业务计算不阻塞 UI。官方称这带来「instant launch and silky UI responsiveness」（秒开与丝滑）。
2. **更贴近 Web 的样式**：支持 `linear / flex / grid / relative` 四种布局系统、CSS 动画/过渡、CSS 变量与选择器——尤其**支持 Grid**，这是 RN 所没有的。

它的口号 **「Write Once, Render Anywhere」** 强调「一次编写、多端渲染」；平台覆盖 iOS / Android / HarmonyOS / Web / Desktop（Windows·macOS）。字节系产品（TikTok、CapCut）是其大规模生产背书。

> **与 RN 的口号差异**：RN 讲「Learn once, write anywhere」（复用技能）；Lynx 讲「Write Once, Render Anywhere」（一套代码多端渲染），措辞更接近「一次编写到处渲染」。二者定位与成熟度差别很大，详见[与 RN 对比](./guide-line/status-vs-rn)。

## 二、定位：为什么把 Lynx 归为「新兴 / 观察」

这一叶刻意**克制**，因为 Lynx 的成熟度与 RN/Flutter 不在一个量级：

- **优势**：字节超大规模生产背书；双线程 + PrimJS 的性能故事；Web 化 CSS（含 Grid）降低前端上手门槛；多端含 HarmonyOS。
- **短板 / 风险**：2025 年 3 月才开源，**厂外生态、三方库、文档仍不成熟**；生产案例主要集中在字节系；API 仍在演进。
- **选型结论（2026）**：值得**关注与试验**，但一般团队**尚不宜当主力**。若你需要成熟生态、海量三方库与好招聘，RN/Flutter 仍是更稳的选择。

所以本叶只写**已坐实**的架构与用法，凡官方资料未明确的（如 PrimJS 具体指标、ReactLynx 底层实现细节、渲染边界、非 React 上层的成熟度）都标注「资料尚不充分」，不臆断。

## 三、怎么起步：`npm create rspeedy`

Lynx 的官方脚手架是 **Rspeedy**（基于 Rspack 的 Lynx 构建工具）。要求 **Node.js 18 或更高**（若用 TypeScript 写配置文件，需 18.19+）。

```bash
# 1. 创建项目（也可用 yarn create rspeedy / pnpm create rspeedy@latest）
npm create rspeedy@latest

# 2. 进入目录并安装依赖
cd my-app
npm install

# 3. 启动开发服务器
npm run dev
```

`npm run dev` 会在终端输出一个**二维码**。默认脚手架使用 **ReactLynx**（官方的 idiomatic React 框架）。

## 四、预览与调试

Lynx 不在浏览器里预览，而是通过官方的 **Lynx Explorer App**（真机或模拟器）加载你的 bundle：

- **真机**：用 Lynx Explorer App **扫描**终端里的二维码。
- **模拟器**：复制终端输出的 **bundle URL**，粘贴到 Explorer 的「Enter Card URL」输入框。

改动代码后会热更新到 Explorer。更深入的调试走官方 DevTool（能力细节以官方文档为准）。

> 文档导航（官网）：**Guide**（Quick Start / Integration）、**APIs**、**Learn**（Gallery/教程）、**Blog**；中英双语。

## 五、心智地图：接下来读什么

- 想搞懂 Lynx「为什么快、线程怎么分」→ [双线程架构与 PrimJS](./guide-line/dual-thread)（主/UI 线程、后台线程、MTS、IFR、PrimJS）。
- 想动手写界面 → [ReactLynx 与开发模型](./guide-line/reactlynx)（idiomatic React、双线程下的坑、类 Web CSS/Grid）。
- 想判断「该不该用、和 RN 怎么选」→ [与 React Native 对比·生态现状](./guide-line/status-vs-rn)。
- 速记表与待核清单在 [参考](./reference)。
