---
layout: doc
outline: [2, 3]
---

# Lynx 参考

> 基于 Lynx（2025 开源）· 核于 2026-07

## 速查

- **出身**：字节跳动，**2025-03-05 开源**（TikTok 团队推动）；仓库 `lynx-family/lynx`（C++ 内核，Apache-2.0）
- **架构关键词**：**双线程**（主/UI + 后台）· **MTS**（主线程脚本）· **IFR**（首帧即时渲染）· **PrimJS**（自研引擎）
- **上层**：**ReactLynx**（idiomatic React）；样式**类 Web CSS**（`linear/flex/grid/relative`）
- **起步**：`npm create rspeedy@latest` → `npm install` → `npm run dev`（Node 18+，构建工具 Rspeedy/Rspack）
- **最常踩**：文本必包 `<text>`、默认 `border-box`、无 margin 折叠、副作用双线程「各跑一次」、`'2–4x'` 是 **Web→Lynx** 口径**非** vs RN

## 一、项目坐标

| 项 | 值 |
| --- | --- |
| 开源方 | **字节跳动（ByteDance）**，由 TikTok 团队推动 |
| 开源时间 | **2025-03-05** |
| 仓库 | github.com/**lynx-family/lynx**（主语言 **C++**，**Apache-2.0**） |
| 官网 | **lynxjs.org** |
| 上层框架 | **ReactLynx**（idiomatic React）；Vue/Svelte 等（成熟度**资料尚不充分**） |
| JS 引擎 | **PrimJS**（自研，专为 Lynx 优化） |
| 构建工具 | **Rspeedy**（基于 **Rspack**） |
| 脚手架 | `npm create rspeedy@latest` |
| 运行环境 | **Node.js 18+**（TS 配置需 18.19+） |
| 平台 | **iOS 10+ / Android 5.0（API 21+）/ HarmonyOS / Web / Desktop（Windows·macOS）** |
| 标杆用户 | **TikTok、CapCut** 等字节系 |
| 稳定版本号 / 是否 1.0 | **资料尚不充分（待核）** |

## 二、架构关键词

| 关键词 | 一句话 |
| --- | --- |
| **双线程架构** | 主/UI 线程（首帧+高优先级手势）+ 后台线程（业务/副作用/异步） |
| **主线程 / UI 线程** | PrimJS 驱动，走「特权、同步」快路径 |
| **后台线程** | 用户代码默认运行处，保主线程低负载不阻塞 |
| **MTS**（Main-Thread Scripting） | 静态调度、被授权在主线程运行的小段脚本，处理手势 |
| **IFR**（Instant First-Frame Rendering） | 短暂阻塞主线程直到首帧渲染完成，消除白屏 |
| **PrimJS** | Lynx 自研、专为 Lynx 优化的 JS 引擎（具体指标待核） |
| **ReactLynx** | 官方 idiomatic React 框架（函数组件/Hooks/Context） |
| **Rspeedy** | 基于 Rspack 的 Lynx 构建工具 |

## 三、Lynx CSS vs Web / RN

| 维度 | Lynx | Web | React Native |
| --- | --- | --- | --- |
| 布局系统 | **linear / flex / grid / relative** | 全部 | Flexbox 子集 |
| 默认布局 | **linear**（`display: linear`） | block/inline | Flexbox |
| Grid | **支持** | 支持 | **不支持** |
| `box-sizing` 默认 | **border-box** | content-box | 类 border-box |
| margin 折叠 | **无** | 有 | 无 |
| 级联 / 继承 | 类 Web（含变量/选择器） | 完整 | **无级联** |
| 文本 | 必须包在 `<text>` 里 | 任意 | 必须包在 `<Text>` 里 |

## 四、起步命令

```bash
# 创建（也可 yarn create rspeedy / pnpm create rspeedy@latest）
npm create rspeedy@latest
cd my-app && npm install
npm run dev          # 出二维码 → Lynx Explorer App 扫码，或粘贴 bundle URL 到 'Enter Card URL'
```

## 五、常见易错点

| # | 易错点 |
| --- | --- |
| 1 | Lynx 是**字节 2025-03 开源**（非老牌），仓库 `lynx-family/lynx` |
| 2 | **双线程**：主/UI 线程（PrimJS，首帧/手势）+ 后台线程（业务/异步） |
| 3 | JS 引擎是**自研 PrimJS**（不是 Hermes/V8/JSC） |
| 4 | 上层 **ReactLynx** 是 idiomatic React；「基于 Preact」属实现细节、官方未突出（待核） |
| 5 | 双线程下**副作用会跑两次**，除非显式作用域化；部分 API 仅后台线程可用（如 `GlobalEventEmitter`） |
| 6 | 用 `'main thread'` 指令声明主线程脚本（MTS） |
| 7 | 样式**类 Web CSS**，**支持 Grid**（RN 不支持）；默认 `border-box`、**无 margin 折叠** |
| 8 | **文本不能直接写进 `<view>`**，必须包 `<text>` |
| 9 | 脚手架 `npm create rspeedy@latest`（Rspeedy/Rspack 系），Node 18+ |
| 10 | 多端含 **HarmonyOS** 与 Desktop |
| 11 | **「2–4x」是 Web→Lynx 启动口径，不是「比 RN 快 2–4x」** |
| 12 | 渲染是「原生渲染 或 pixel-perfect 自绘」，确切边界**待核** |
| 13 | 定位：厂内大规模、**厂外生态早期**，属观察/前瞻，非 2026 主力选型 |

## 六、资料尚不充分（待核）清单

> 本叶为「新兴/观察」叶，以下项官方一手资料尚不充分，未写成事实，仅列出以待后续核实。

| # | 待核项 |
| --- | --- |
| 1 | ReactLynx「基于 Preact」的实现细节——官方以「idiomatic React」表述、未突出该点 |
| 2 | Vue / Svelte 等非 React 上层的官方支持成熟度与用法 |
| 3 | 「比 RN 快 2–4x」——一手口径实为 **Web→Lynx 启动降 2–4x**（内部基准），非 vs RN |
| 4 | PrimJS 的快启动 / GC 等**具体量化指标**；独立引擎仓库地址 |
| 5 | 双线程通信机制的底层实现细节 |
| 6 | 渲染「原生控件 vs pixel-perfect 自绘」的**确切边界** |
| 7 | 最新稳定**版本号** / 稳定性承诺 / 是否有 1.0 |

## 七、权威链接

- [Lynx 官网](https://lynxjs.org/) · [Quick Start](https://lynxjs.org/guide/start/quick-start.html)
- [ReactLynx 文档](https://lynxjs.org/react/) · [Thinking in ReactLynx](https://lynxjs.org/react/thinking-in-reactlynx.html)
- [布局系统（Layout）](https://lynxjs.org/guide/ui/layout.html) · [Why Lynx（博客）](https://lynxjs.org/blog/lynx-unlock-native-for-more)
- [GitHub · lynx-family/lynx](https://github.com/lynx-family/lynx) · [APIs](https://lynxjs.org/api/) · [Learn / Gallery](https://lynxjs.org/learn/gallery)
