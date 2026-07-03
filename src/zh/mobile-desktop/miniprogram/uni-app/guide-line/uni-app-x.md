---
layout: doc
outline: [2, 3]
---

# uni-app x：UTS + uvue 原生渲染

> 基于 uni-app 5.x（uni-app x）· 核于 2026-07

## 速查

- **本质**：不是传统 uni-app 换皮，而是**换语言（UTS 取代 JS）+ 换渲染（uvue 原生渲染取代 HTML/CSS+WebView）**的新引擎，主打接近甚至超越原生的性能
- **UTS（uni TypeScript）**：跨平台强类型语言，语法**基本对齐 TypeScript**；编译目标 —— Android→**Kotlin**、iOS→**Swift**、鸿蒙→**ArkTS**、Web/小程序→**JavaScript**
- **为何要编译成原生**：安卓不内置 JS 引擎、无法直接跑 JS，故 UTS 编译为各平台原生代码
- **uvue 渲染引擎**：Vue 兼容的原生渲染（页面文件为 `.uvue`），两种模式 —— **VDOM**（早期，全平台）与 **Vapor**（新，性能优化，**2026 起逐步替换 VDOM**，HBuilderX 5.0+ 用 `VUE3-VAPOR` 条件）；Vapor 是**进行时**，非已完成
- **平台支持**：Android / iOS / Web / **鸿蒙（HarmonyOS Next，4.61/4.64 起）** 已覆盖，**微信小程序已支持**；**其他小程序（支付宝/抖音等）在 x 上逐端推进中**，别写「全小程序 GA」
- **与传统版关系**：**并存**——传统版继续维护、生态最大；x 面向要原生性能的场景，共享 UTS 插件生态、**共用版本号 5.x**
- **UTS 两大用途**：① 写**原生插件**（传统版与 x 都能用）② 作 uni-app x 的**应用主逻辑语言**
- **nvue 定位**：传统版的 App 原生渲染（基于 Weex）；官方口径是**存量继续支持、新原生需求引导 uni-app x（uvue）**——**不要写成「已废弃」**

## 一、uni-app x 是什么

uni-app x 是 DCloud 主推的**新形态**，不是把传统 uni-app 改个名，而是**两处换血**：

- **换语言**：用 **UTS** 取代 JavaScript 作为应用主逻辑语言。
- **换渲染**：用 **uvue 原生渲染**取代「HTML/CSS + WebView」。

目标是给出**接近甚至宣称超越原生的性能**，同时尽量保留 Vue 的开发心智与 uni-app 的跨端能力。它与传统 uni-app **并存**：传统版最成熟、生态最大、上手最低；x 面向「要极致原生性能/原生级能力」的场景，两者**共用统一版本号 5.x**、共享 UTS 插件生态。

## 二、UTS：跨平台强类型语言

**UTS（uni TypeScript）** 是一门跨平台、强类型的现代语言，语法**基本对齐 TypeScript**、支持多数 ES6 API，但**不是简单把 TS 翻译成原生**——它按平台编译成各自的原生语言：

| 平台 | UTS 编译目标 |
| --- | --- |
| Android | **Kotlin** |
| iOS | **Swift** |
| 鸿蒙（HarmonyOS） | **ArkTS** |
| Web / 小程序 | **JavaScript** |

**关键动因**：安卓系统不内置 JS 引擎，无法直接运行 JS，因此把 UTS 编译为原生（Kotlin），才能获得原生性能与原生 API 直连。

```ts
// UTS：强类型、可空类型用 | null（无隐式 undefined）、支持可选链
let str: string = 'hello'
const num: number = 42

function pass(score: number): boolean {
  return score >= 60
}

let name: string | null = null
console.log(name?.length) // 可选链
```

**UTS 两大用途**：

1. **写原生插件**：用 UTS 封装原生能力，**传统 uni-app 与 uni-app x 都能调用**。
2. **作 uni-app x 应用主逻辑语言**：整个 x 应用的业务逻辑用 UTS 写。

## 三、uvue：Vue 兼容的原生渲染

uvue 是 uni-app x 的渲染引擎，**Vue 兼容**（页面文件为 `.uvue`），但渲染到**原生视图**而非 WebView。两种渲染模式：

| 模式 | 说明 |
| --- | --- |
| **VDOM 模式** | 早期方案，全平台可用 |
| **Vapor 模式** | 新方案，性能优化，**2026 起逐步替换 VDOM**；HBuilderX 5.0+ 用 `VUE3-VAPOR` 条件编译 |

- Vapor 的官方基准：渲染约 4050 个视图，iOS/鸿蒙上约为原生的 **2–3 倍**速度。
- **注意**：「Vapor 全面替代 VDOM」是**进行时**而非已完成，安卓 Vapor、JS 驱动等特性排期在 5.x 后续小版本，不要写成「已完成/全平台切换完毕」。

## 四、平台支持（2026 现状）

- **已覆盖**：Android / iOS / Web / **鸿蒙（HarmonyOS Next，自 4.61/4.64 起）**。
- **微信小程序**：已支持（旧介绍页曾标 planned，2026 release 页与新闻确认已支持）。
- **其他小程序（支付宝/抖音等）**：在 uni-app x 上**逐端推进中**，覆盖进度需逐端核对——**不要一概写成「全小程序 GA」**。

## 五、和传统版、nvue 的关系

- **传统版 uni-app**：JS + WebView（vue 页）/ Weex 原生（nvue 页），生态最大、最成熟。
- **nvue**：传统版的 App **原生渲染**方案（基于 Weex），用于超长列表、复杂交互、与原生控件层级冲突等重场景。**限制比 WebView 严格**：仅 flex 布局、用 `v-if` 不能 `v-show`、文本必须放 `<text>` 内、不支持媒体查询等。
- **nvue 与 uvue**：nvue 是传统版的原生渲染；uvue 是 uni-app x 的新一代原生渲染，架构更先进。官方口径是**nvue 存量继续支持、新的原生需求引导用 uni-app x（uvue）**——**未见明确「废弃」声明，勿写成「nvue 已废弃」**。

## 六、何时选 uni-app x

| 场景 | 建议 |
| --- | --- |
| 覆盖最多端、上手最快、生态最全 | **传统版 uni-app** |
| 要极致原生性能、原生级能力 | **uni-app x** |
| 只需封装某块原生能力 | 写 **UTS 原生插件**（两版都能用） |

选型也要看目标端在 x 上的成熟度（尤其小程序端）；跨端差异化仍靠[条件编译](./conditional-compile)（`UNI-APP-X` / `APP-ANDROID` / `APP-IOS` / `VUE3-VAPOR` 等常量）。云端能力见 [uniCloud](./unicloud)。
