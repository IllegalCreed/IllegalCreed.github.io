---
layout: doc
outline: [2, 3]
---

# dotLottie 格式、Web Component 播放器与状态机

> 基于 lottie-web 5.13 / dotLottie · 核于 2026-07

## 速查

- **`.lottie` 是 zip 压缩容器**：内部结构 `manifest.json`（必需，元数据 + 索引）+ `a/`（动画目录，`a/{id}.json`）+ 可选 `i/`（图片等共享资源）/`t/`（主题 `t/{id}.json`）/`s/`（状态机 `s/{id}.json`）。
- **`manifest.json` 顶层字段**（v2 规范）：`version`/`generator`/`initial`/`animations[]`/`themes[]`/`stateMachines[]`。
- **dotLottie 四大优势**（对应传统 JSON 逐条打）：体积（压缩 + 资源共享）、多动画打包（一文件多场景/图标集）、主题（免重新导出即可深色模式/品牌换色/本地化）、状态机（交互无需自己写胶水代码）。
- **格式不互斥**：dotLottie 运行时**两种格式都能加载**（`.lottie` 与传统 `.json`），不是取代关系。
- **`DotLottie` 播放器构造参数**：`canvas`（必需，`<canvas>` 元素，**不是** lottie-web 的 `container` 那种 `<div>`）、`src`/`data`、`autoplay`、`loop`、`speed`、`mode`（`forward`/`reverse`/`bounce`/`reverse-bounce`）、`useFrameInterpolation`、`segment`、`backgroundColor`、`layout`（`fit`+`align`）、`marker`、`themeId`。
- **方法**：`play`/`pause`/`stop`/`setFrame`/`setSpeed`/`load(config)`/`loadAnimation(id)`（多动画文件内切换）/`destroy`/`setLayout`/`setMarker`/`setSegment`/`setTheme`/`setThemeData`/`markers()`。
- **事件新增**：除 lottie-web 那套事件名外新增 `load`/`loadError`/`ready`/`render`/`freeze`（离屏冻结）与状态机专属事件。
- **`DotLottieWorker`**：与 `DotLottie` 同参数 + `workerId` 指定共享 worker 池，把渲染彻底移出主线程。
- **内核**：Rust + WASM 的 `dotlottie-rs`，渲染引擎 **ThorVG**（C/C++ 矢量图形库），iOS/Android/Web 官方运行时共用同一套引擎；支持三种渲染后端，通过子路径切换：默认（Software/Canvas2D）、`/webgl`（WebGL2）、`/webgpu`（WebGPU，前沿）。
- **Web Component 三代演进**：`<lottie-player>`（`@lottiefiles/lottie-player`，已废弃）→ `<dotlottie-player>`（`@dotlottie/player-component`，已废弃）→ `<dotlottie-wc>`（`@lottiefiles/dotlottie-wc`，**当前推荐**）。
- **状态机四要素**：Inputs（数值/字符串/布尔类型变量 + 事件信号）、States（命名的播放配置）、Transitions（挂在状态上的规则，guard 通过则迁移，可配 `Tweened` 过渡动画）、Interactions（手势如 `PointerDown` 或生命周期事件如 `OnComplete` 绑定 action）。
- **状态机运行时 API**：`stateMachineLoadData(json)`/`stateMachineLoad(id)`（仅加载定义）→ 必须显式 `stateMachineStart()` 才真正激活；`stateMachineFireEvent`/`stateMachineSetNumericInput`/`stateMachineSetBooleanInput`/`stateMachineSetStringInput` 向状态机输入信号。
- **构建带状态机的 `.lottie`**：官方 SDK `@dotlottie/dotlottie-js`（`addAnimation`/`addStateMachine`/`build`/`toArrayBuffer`），与消费端 `dotlottie-web` 是生产/消费分工。
- **对标竞品**：dotLottie 状态机对标的是 **Rive**——不用写 JS 胶水代码就能做"点击变色""悬停播放""评分表情"级别的交互。
- **lottie-interactivity（经典库）**：`create({mode, player, actions})`，`mode` 有 `scroll`/`cursor`/`chain`，服务对象是 lottie-web/`<lottie-player>`；新项目做复杂交互推荐状态机，简单的"滚动进度条式播放"用它仍然轻量够用。
- **文档存疑提示**：LottieFiles 官方文档站某页曾把 Web Component 标签/包名混叠（显示 `<dotlottie-player>`/`@lottiefiles/dotlottie-web`），与 npm 实测 + GitHub README 不一致，本页以 npm 实测 + GitHub README 为准。

## 一、`.lottie` 压缩容器格式

**`.lottie` 是一个 zip 压缩容器**，典型内部结构：

```
my-animation.lottie
├── manifest.json     # 必需，元数据 + 索引
├── a/                # 动画目录：a/{id}.json（Lottie JSON 本体）
├── i/                # 可选：图片等共享资源
├── t/                # 可选：主题 t/{id}.json
└── s/                # 可选：状态机 s/{id}.json
```

`manifest.json` 关键字段（v2 规范）：

```json
{
  "version": "2",
  "generator": "dotlottie-js v2.0.0",
  "initial": { "animation": "main-animation" },
  "animations": [
    { "id": "main-animation", "initialTheme": "light", "themes": ["light", "dark"] }
  ],
  "themes": [{ "id": "light", "name": "Light Theme" }],
  "stateMachines": [{ "id": "button-states", "name": "Button States" }]
}
```

核心优势（对应老 JSON 格式逐条打）：**体积**（压缩 + 资源共享，远小于内联 base64 的原始 JSON）、**多动画打包**（一个文件装多个动画/场景/图标集，共享资源）、**主题**（不用重新导出即可深色模式/品牌换色/本地化）、**状态机**（点击/悬停/完成事件的交互无需自己写胶水代码）、**渲染一致性**（所有官方运行时统一走 ThorVG 引擎绘制，不再是"每平台各自实现"）。规范有 v1/v2 两版，manifest 字段以 v2 为准；`.lottie` 与传统 `.json` 并不互斥——dotLottie 运行时**两种格式都能加载**。

## 二、dotlottie-web 播放器 API

```js
import { DotLottie } from "@lottiefiles/dotlottie-web";

const dotLottie = new DotLottie({
  canvas: document.getElementById("canvas"), // 必需，<canvas> 元素（注意不是 container div）
  src: "https://lottie.host/xxx.lottie", // 或 data: 直接传数据
  autoplay: true,
  loop: true,
  speed: 1,
  mode: "forward", // 'forward' | 'reverse' | 'bounce' | 'reverse-bounce'
  useFrameInterpolation: true, // 平滑子帧插值，关闭可换性能
  segment: [10, 60], // 帧区间
  backgroundColor: "#ffffff",
  layout: { fit: "contain", align: [0.5, 0.5] }, // fit: contain|cover|fill|fit-width|fit-height
  marker: "intro", // 从命名 marker 开始
  themeId: "dark",
});

dotLottie.addEventListener("load", () => dotLottie.play());
dotLottie.addEventListener("complete", () => console.log("done"));
```

**关键区别**：构造参数是 `canvas: HTMLCanvasElement`，**不是** lottie-web 的 `container: HTMLDivElement`——两套 API 传入的 DOM 元素类型不同，混用会直接报错。

方法一览：`play`/`pause`/`stop`/`setFrame`/`setSpeed`/`load(config)`/`loadAnimation(id)`（多动画文件内切换）/`destroy`/`setLayout`/`setMarker`/`setSegment`/`setTheme`/`setThemeData`/`markers()`/`addEventListener`/`removeEventListener`。事件除 lottie-web 那套外新增 `load`/`loadError`/`ready`/`render`/`freeze`（离屏冻结）与状态机专属事件。

**离屏 Worker 渲染**用 `DotLottieWorker`（同参数 + `workerId` 指定共享 worker 池），把渲染彻底移出主线程：

```js
import { DotLottieWorker } from "@lottiefiles/dotlottie-web";
const player = new DotLottieWorker({
  canvas,
  src: "animation.lottie",
  autoplay: true,
  loop: true,
  workerId: "shared-pool", // 指定共享 worker 池
});
```

内核是 **Rust + WASM 的 `dotlottie-rs`，渲染引擎为 ThorVG**（C/C++ 矢量图形库，iOS/Android/Web 官方运行时共用同一套引擎），支持三种渲染后端，通过子路径切换：

```js
import { DotLottie } from "@lottiefiles/dotlottie-web"; // Software/Canvas2D，默认
import { DotLottie } from "@lottiefiles/dotlottie-web/webgl"; // WebGL2
import { DotLottie } from "@lottiefiles/dotlottie-web/webgpu"; // WebGPU，前沿
```

## 三、Web Component 播放器：三代命名演进

这是 Lottie 生态里最容易踩的命名坑——三代播放器包名、标签名均不同：

| 标签 | 包 | 状态 |
| --- | --- | --- |
| `<lottie-player>` | `@lottiefiles/lottie-player` | **已废弃**，包装经典 lottie-web |
| `<dotlottie-player>` | `@dotlottie/player-component` | **已废弃**，npm 明确写 superceded by dotlottie-wc |
| `<dotlottie-wc>` | `@lottiefiles/dotlottie-wc` | **当前推荐**，包装 dotlottie-web/ThorVG |

当前推荐的用法：

```html
<script type="module" src="https://unpkg.com/@lottiefiles/dotlottie-wc@latest/dist/dotlottie-wc.js"></script>
<dotlottie-wc src="https://lottie.host/xxx.lottie" autoplay loop></dotlottie-wc>
```

**生产环境安全提醒**：上面的 `@latest` 只适合快速试用，生产代码应锁定具体版本号（如 `@0.9.19`）并配上 Subresource Integrity（`integrity="sha384-..."` + `crossorigin="anonymous"`），防止 CDN 被劫持后注入恶意脚本；具体 hash 值可用 `npm view @lottiefiles/dotlottie-wc dist.integrity` 或在线 SRI Hash Generator 生成，也可以直接 `npm install` 后走本地打包，从根本上避免依赖第三方 CDN 的可用性与安全性。

已确认属性（GitHub README 逐字段核实）：`src`（`.lottie` 或 `.json` 均可）、`autoplay`、`loop`；`mode`/`speed`/`background`/`controls` 等在旧版 `<lottie-player>` 上有明确文档，`<dotlottie-wc>` 大概率透传同名核心库配置项，但**未逐字段抓到官方属性表**，实际项目里以 API Reference 页为准，不要凭旧组件属性表直接套。旧版 `<lottie-player>` 已确认属性：`src`/`autoplay`/`loop`/`mode`/`controls`/`speed`/`debug`/`background`；方法 `load(source)`；事件含 `rendered`。

**文档存疑提示**：LottieFiles 官方文档站 `web-component` 子页的自动摘要曾显示标签名为 `<dotlottie-player>`、包名 `@lottiefiles/dotlottie-web`，但这与 **npm registry 实测**（`@lottiefiles/dotlottie-player` 包并不存在）及 **GitHub README 明确示例**（标签 `<dotlottie-wc>`、包 `@lottiefiles/dotlottie-wc`）**不一致**，疑似把新旧两代信息混叠。本页以 npm 实测 + GitHub README 为准：当前推荐的 Web Component 是 `<dotlottie-wc>`/`@lottiefiles/dotlottie-wc`；`<dotlottie-player>` 对应的是已废弃的 `@dotlottie/player-component`，二者是新旧两代不同的包。

## 四、状态机 State Machine

四个核心概念：**Inputs**（数值/字符串/布尔类型变量 + 事件信号，guard 读取、action 写入）、**States**（命名的播放配置，机器任意时刻恰好处于一个状态，常见类型 `PlaybackState`/`GlobalState`）、**Transitions**（挂在状态上的规则，guard 通过则迁移到另一状态，可配 `Tweened` 过渡动画的 `duration`/`easing`）、**Interactions**（把用户手势如 `PointerDown` 或动画生命周期事件如 `OnComplete` 绑定到 action）。

```js
const ratingMachine = {
  initial: "laughing",
  states: [
    {
      name: "global",
      type: "GlobalState",
      transitions: [
        {
          type: "Tweened",
          toState: "angry",
          duration: 0.5,
          guards: [{ type: "Numeric", inputName: "rating", conditionType: "Equal", compareTo: 1 }],
        },
      ],
    },
    { type: "PlaybackState", name: "angry", animation: "", autoplay: true, loop: true, segment: "angry" },
  ],
  inputs: [{ type: "Numeric", name: "rating", value: 5 }],
  interactions: [
    { type: "PointerDown", layerName: "angry", actions: [{ type: "SetNumeric", inputName: "rating", value: 1 }] },
  ],
};

dotLottie.addEventListener("load", () => {
  dotLottie.stateMachineLoadData(JSON.stringify(ratingMachine)); // 或 stateMachineLoad(id) 加载文件内置状态机
  dotLottie.stateMachineStart(); // 必须显式 start 才真正激活
});
dotLottie.stateMachineFireEvent("click");
dotLottie.stateMachineSetNumericInput("progress", 0.5);
dotLottie.stateMachineSetBooleanInput("isActive", true);
dotLottie.stateMachineSetStringInput("mode", "dark");
```

构建带状态机的 `.lottie` 文件用官方 SDK `@dotlottie/dotlottie-js`：`new DotLottie().addAnimation(...).addStateMachine(...)`，再 `build()` + `toArrayBuffer()`。状态机事件：`stateMachineStart` / `stateMachineTransition` / `stateMachineStateEntered`。这是 dotLottie 对标 **Rive** 交互模型的核心能力——不用写 JS 胶水代码就能做出"点击变色""悬停播放""评分表情"级别的交互；Rive 用自有编辑器 + 状态机 + 更紧凑运行时从设计源头做交互，dotLottie 状态机是 Lottie 生态对这一模型的后补追赶，但 Lottie 的核心优势仍是 AE 原生工作流与海量现成动画资源沉淀。

## 五、lottie-interactivity：经典滚动/悬停交互库

```js
import { create } from "@lottiefiles/lottie-interactivity";

create({
  mode: "scroll", // 'scroll' | 'cursor' | 'chain'
  player: "#firstLottie", // lottie-player 组件或 lottie-web 容器的选择器
  actions: [
    { visibility: [0, 1], type: "seek", frames: [0, 100] }, // 容器可见区间 [0,1] 内滚动进度映射到帧区间
  ],
});
```

`type` 可选 `seek`/`play`/`stop`/`loop`；`mode: 'cursor'` 用于鼠标位置驱动动画进度（光标跟随）。这套库诞生早于 dotLottie 状态机，服务对象是 lottie-web/`<lottie-player>`；新项目做复杂交互推荐状态机（完整的有限状态机：多输入变量、guard 条件组合、跨状态过渡动画），简单的"滚动进度条式播放"用 `lottie-interactivity` 仍然轻量够用——二者不是替代关系而是能力代差。

dotLottie 格式、播放器与状态机是 2026 年 Lottie 生态的主推方向。下一叶 [框架集成与性能优化](./framework-and-optimization) 把 lottie-web/dotLottie 接进 React/Vue，并给出完整性能优化清单。
