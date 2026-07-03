---
layout: doc
outline: [2, 3]
---

# 渲染引擎：Skia 到 Impeller

> 基于 Flutter 3.44 · 核于 2026-07

## 速查

- **为何替换 Skia**：Skia 在**运行时首次遇到新 shader 组合才编译** → 首帧/复杂动画掉帧（**shader compilation jank**）
- **Impeller 方案**：**构建期预编译所有 shader 与 pipeline state object**（离线、带反射），运行时**零 shader 编译** → 可预测的 60/120fps
- **四大目标**：①可预测性能（shader 全离线编译、PSO 前置）②可观测（图形资源打标签、可抓帧不掉性能）③可移植（不绑单一图形 API）④现代并发（用 Metal/Vulkan 新特性、单帧分摊多线程）
- **平台默认**：**iOS（Metal）默认自 Flutter 3.10、Skia 已移除**；**Android（Vulkan，API 29+）默认自 Flutter 3.27**，低端/无 Vulkan 回退 OpenGL；macOS 实验/opt-in；**Web 不支持 Impeller**（走 CanvasKit / Skwasm，均基于 Skia）
- **关 Impeller（Android 调试）**：`flutter run --no-enable-impeller`；生产在 `AndroidManifest.xml` 设 `io.flutter.embedding.android.EnableImpeller=false`
- **渲染管线四阶段**：**Build**（Widget→Element）→ **Layout**（约束下尺寸上，一趟 O(n)）→ **Paint**（按树序绘制+合成）→ **Composite & Rasterize**（SceneBuilder→GPU）
- **Flutter Web 渲染器**：**CanvasKit**（默认，完整 Skia 编到 WASM、dart2js）vs **Skwasm**（`--wasm`，精简 Skia + Dart 直编 WebAssembly、**多线程**、更小、需 **WasmGC** 否则回退 CanvasKit）；**HTML renderer 已移除**
- **DevTools**：Performance 面板看帧、UI 线程 vs raster 线程；Impeller 图形资源可抓帧存盘

## 一、为什么要从 Skia 换到 Impeller

Flutter 早期用 **Skia** 做 2D 图形渲染，它有一个结构性顽疾：**shader 是在运行时按需编译的**——App 第一次遇到某个新的 shader 组合（某种渐变、某个复杂动画的合成）时，才现场编译该 shader。这次编译发生在渲染路径上，会导致**首帧或复杂动画时的掉帧卡顿**，业界称为 **shader compilation jank**。

**Impeller** 的思路正相反：**把所有 shader 和 pipeline state object（PSO）放到构建期离线预编译**（带反射信息），运行时**不再有任何 shader 编译**。这样每一帧的工作量都是可预测的，从根本上消除了这类卡顿，稳定输出 60 / 120fps。

## 二、Impeller 的四大目标

Impeller 的设计目标可以概括为四点：

1. **可预测性能**：shader 全部离线编译、PSO 前置构建，运行时无编译开销。
2. **可观测**：所有图形资源都打了标签，可以抓取整帧存盘分析，且**抓帧本身不拖慢性能**。
3. **可移植**：不绑定单一图形 API，shader 可转成各后端专用格式（Metal / Vulkan 等）。
4. **现代并发**：主动利用 Metal / Vulkan 的新特性，把单帧的工作**分摊到多个线程**。

## 三、后端与平台默认状态

Impeller 在不同平台用不同的图形后端，默认状态也不同：

| 平台 | 后端 | 默认状态 |
| --- | --- | --- |
| **iOS** | Metal | **默认且唯一，Skia 已移除**（默认自 **Flutter 3.10**） |
| **Android** | **Vulkan**（API 29+），OpenGL 回退（API<29 或无 Vulkan） | **默认自 Flutter 3.27**；现代 Android 以纯 Vulkan 为默认 |
| **macOS** | Metal | 实验 / opt-in（`--enable-impeller` 或 Info.plist `FLTEnableImpeller`） |
| **Web** | —— | **不支持 Impeller**，走 CanvasKit / Skwasm（均基于 Skia） |

在 Android 调试时可临时关掉 Impeller：

```bash
flutter run --no-enable-impeller
```

生产环境要关，则在 `AndroidManifest.xml` 里声明：

```xml
<meta-data
    android:name="io.flutter.embedding.android.EnableImpeller"
    android:value="false" />
```

> 官方对「移除 Skia 回退、彻底停用 opt-out」的说法是**计划中、无硬时间表**——本页不写死具体弃用版本，涉及时以官方 release notes 为准。

## 四、渲染管线四阶段

不管底层是 Skia 还是 Impeller，Flutter 把「一帧」拆成四个阶段（前两阶段与 [Dart 与 Widget](./dart-widgets)、[布局与约束](./layout-constraints) 对应）：

1. **Build**：Widget → Element，构建/更新 Element 树。
2. **Layout**：在约束下算尺寸（**约束向下、尺寸向上**），一趟 **O(n)**。
3. **Paint**：按树的顺序生成绘制指令并合成。
4. **Composite & Rasterize**：`SceneBuilder` 组装场景，经 `dart:ui` 交给 GPU 光栅化成像素。

在 DevTools 的 **Performance** 面板里，你能分别看到 **UI 线程**（Build/Layout/Paint 的 Dart 工作）与 **raster 线程**（光栅化）的耗时，定位到底是哪一段拖慢了帧。

## 五、Flutter Web 渲染器

Web 上不能用 Impeller，Flutter 提供两种基于 Skia 的渲染器：

| | CanvasKit（默认） | Skwasm（`--wasm`） |
| --- | --- | --- |
| 实现 | 完整 Skia 编到 WASM | 精简 Skia 编到 WASM + Dart 直编 WebAssembly |
| Dart 编译 | dart2js（→ JS） | 直编 WebAssembly |
| 线程 | 单线程 | **多线程**（Web Workers + SharedArrayBuffer） |
| 要求 | 所有现代浏览器 | 需 **WasmGC**，不支持则**自动回退 CanvasKit** |
| 体积 | 额外下载较大 | 更小 |
| 性能 | 标准 | 启动 / 帧率更好 |

- 早期的 **HTML renderer 已被移除**，现在 Web 只有 CanvasKit + Skwasm 两条路（本页不写死移除的具体版本，涉及时以官方 release notes 为准）。
- 走 `--wasm` 时，代码需用 `dart:js_interop`（非旧 `dart:js`）、`package:web`（非 `dart:html`），且 `int`/`double` 按 Dart VM 语义。

---

想知道 Dart 代码是怎么被编译（JIT/AOT）跑起来、以及热重载如何工作，见 [Dart 编译、异步与热重载](./dart-async-hotreload)。
