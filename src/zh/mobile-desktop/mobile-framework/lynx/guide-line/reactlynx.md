---
layout: doc
outline: [2, 3]
---

# ReactLynx 与开发模型

> 基于 Lynx（2025 开源）· 核于 2026-07

## 速查

- **ReactLynx 是什么**：官方为 Lynx 打造的 React 框架，定位 **「Idiomatic React on Lynx」**，**完整支持函数组件 / Hooks / Context**——同一套现代 React API
- **底层实现**：据技术资料，ReactLynx 运行时**基于 Preact**（更轻量）；但官方文档主要以「idiomatic React」表述、**未突出这一实现细节**，故此处**资料尚不充分**，实现以官方/源码为准
- **双线程心智（重点坑）**：代码在**主线程 + 后台线程各跑一次**；后台线程运行**完整 React 运行时**（管生命周期/副作用），主线程负责**首屏与后续 UI 更新**
- **三大坑**：① **副作用会「跑两次」** 除非显式作用域化；② 部分 API **仅后台线程可用**（如 `GlobalEventEmitter`）；③ 用 `'main thread'` 指令声明主线程脚本（MTS）
- **样式**：类 Web CSS——`linear / flex / grid / relative` 四布局；默认 `display: linear`、`box-sizing: border-box`、**无 margin 折叠**；**文本必须包在 `<text>` 里**
- **脚手架**：`npm create rspeedy@latest`（**Rspeedy** = 基于 **Rspack** 的 Lynx 构建工具）；Node 18+
- **不止 React**：Lynx 架构不与 React 强绑，另有 Vue/Svelte 等上层（**成熟度资料尚不充分**）

## 一、ReactLynx 是什么

**ReactLynx** 是官方为 Lynx 提供的 React 框架，文档标题即 **「Idiomatic React on Lynx」**、副标「Develop Lynx with the familiar React」。它**完整支持函数组件、Hooks 与 Context**——「the same set of modern React APIs」。也就是说，会 React 就能上手 ReactLynx，只是渲染目标从 DOM 换成了 Lynx 的原生/自绘视图。

Lynx 脚手架默认即基于 ReactLynx。它同时被官方描述为「Dual-threaded React tailor-made for Lynx」——**为双线程量身定制的 React**，这也带来下文最需要注意的心智差异。

## 二、底层：Preact 实现（资料尚不充分）

一个常被提及的技术点：**ReactLynx 的运行时据称基于 Preact**（一个更轻量的 React 兼容实现），以换取更小的运行时体积。

但需要如实说明：我核对的官方页面（ReactLynx 文档、「Thinking in ReactLynx」）**均未提及 Preact**，而是统一以 **「idiomatic React」** 对外表述。因此：

- 对**开发者**而言，可以按「就是 React」的心智使用（函数组件 / Hooks / Context 一致）。
- 「基于 Preact」属**实现层细节**，官方文档未突出、我未在官方一手页面证实，**资料尚不充分**——请以官方文档与源码为准，不要把它当作官方明确承诺的事实。

## 三、双线程下的 React 心智（最需要注意）

这是 ReactLynx 与 React DOM **最大的不同**。官方「Thinking in ReactLynx」明确：

> 「Your code runs on two threads: **main thread** and **background thread**.」

- **主线程**：负责**渲染初始屏幕**并**应用后续 UI 更新**。
- **后台线程**：运行**完整的 React 运行时**，处理**组件生命周期与其他副作用**。

由此带来三条必须记住的规则：

1. **双执行上下文 → 副作用会「跑两次」**：同一段代码在两个线程都会执行，**除非你显式把它作用域化**到某一线程，否则副作用可能被执行两次。
2. **线程特定的 API**：有些 API **只在后台线程可用**（官方点名 `GlobalEventEmitter`），有些只在主线程可用；用错线程会失效。
3. **生命周期被改造**：官方指出与单线程 React 完全一致「not possible」，因此组件生命周期在双线程下有所调整。

> 一句话：**把 React 当「双线程版」来写**——默认逻辑在后台线程，涉及首帧/高优先级手势的再显式放主线程。

## 四、`'main thread'` 指令与 MTS

要把某段脚本放到主线程执行（即 Main-Thread Scripting，MTS），ReactLynx 用 **`'main thread'` 指令**（类似 React 的 `'use client'`，是函数体顶部的字符串指令）：

```tsx
// 一段在主线程执行的脚本（MTS）：直接处理高优先级手势，省去往返后台线程
function handleGesture() {
  'main thread'
  // ...高优先级交互逻辑，直接在主线程运行
}
```

配合双线程模型：**默认组件逻辑跑后台线程**，只有被 `'main thread'` 标注的小段脚本才在主线程跑，用于手势等对延迟敏感的场景。MTS 的架构背景见 [双线程架构页](./dual-thread)。

## 五、类 Web 的 CSS 与 Grid

ReactLynx 的界面用 Lynx 内建元素（如 `<view>`、`<text>`）+ **类 Web 的 CSS** 编写。Lynx **明确支持四种布局系统**：

| 布局 | 说明 |
| --- | --- |
| **linear**（默认） | `display: linear`，Lynx 的默认布局 |
| **flex** | 弹性盒 |
| **grid** | 二维网格（`display: grid`）——**RN 没有** |
| **relative** | 相对布局 |

它比 RN 更接近 Web（支持 Grid、CSS 变量与选择器、CSS 动画/过渡），但仍有**关键差异**：

- 所有元素是**块级元素**（无 Web 的 inline / inline-block）。
- `box-sizing` **默认 `border-box`**（Web 默认 `content-box`）。
- **不存在 margin 折叠**（margin collapsing）。
- **文本不能直接写进 `<view>`**，必须包在 `<text>` 里（与 RN 的「文本必包 Text」规则一致）。

```tsx
import { useState } from '@lynx-js/react'

// 一个最小 ReactLynx 组件：用 <view>/<text> 内建元素，逻辑默认跑后台线程
export function Counter() {
  const [n, setN] = useState(0)
  return (
    <view>
      <text>点击了 {n} 次</text>
      <view bindtap={() => setN(n + 1)}>
        <text>+1</text>
      </view>
    </view>
  )
}
```

> 上例中的事件绑定、导入路径按常见用法书写，具体 API 以官方文档为准。

## 六、脚手架与工具链

```bash
# 脚手架：Rspeedy（基于 Rspack 的 Lynx 构建工具），要求 Node.js 18+
npm create rspeedy@latest
cd my-app && npm install
npm run dev          # 出二维码 → Lynx Explorer App 扫码，或粘贴 bundle URL
```

默认模板即 ReactLynx。构建工具 **Rspeedy** 基于 **Rspack**，因此享有 Rspack 的构建速度。

## 七、不止 React

Lynx 的分层设计**不与 React 强绑**——ReactLynx 只是官方主推的上层框架之一，KB 提到 Lynx 亦支持 **Vue / Svelte** 等其他上层。但这些非 React 上层的**官方支持成熟度与用法资料尚不充分**，本叶不展开、也不将其当作生产可用的事实陈述。若你评估用非 React 的方式写 Lynx，请以官方最新文档确认。
