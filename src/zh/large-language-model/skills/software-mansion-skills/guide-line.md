---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 `software-mansion-labs/skills` 各 `skills/**/SKILL.md` 编写。

## 速查

- **animations（Reanimated 4）**：动画分层选型——CSS 过渡 → CSS 动画 → shared value 动画 → Skia canvas 动画 → GPU shader 动画（WebGPU/TypeGPU）→ layout 动画；**`runOnJS` 已删 → `scheduleOnRN`**
- **gestures（Gesture Handler）**：`GestureHandlerRootView` 必须在根；**别用 `PanResponder`**（跑 JS 线程、事实废弃）；手势回调跑 UI 线程，调 JS 函数须 `scheduleOnRN`；v2 builder API vs v3 hook API
- **audio（react-native-audio-api）**：**单例** `AudioContext`；空闲 `suspend()`；`AudioBufferSourceNode` 单次使用；参数变化用 `AudioParam` 调度避免爆音
- **on-device-ai（ExecuTorch）**：先 `initExecutorch()` + resource-fetcher adapter；查 `isReady` 再推理；用 `_QUANTIZED` 变体；STT/VAD 音频须 **16kHz 单声道**；**需新架构**，Expo Go 不支持
- **multithreading（worklets）**：三 runtime（UI / Worker / RN）；`scheduleOnUI` / `scheduleOnRN` / `scheduleOnRuntime`；`'worklet'` 指令；runtime 间不共享内存
- **jsi**：C++↔JS 边界；`HostObject` / `HostFunction` / `NativeState` / 零拷贝 `ArrayBuffer` / `CallInvoker`；Pure JSI vs TurboModules vs Nitro
- **svg（react-native-svg）**：矢量图 / 图标 / 图表；选型对照 expo-image / vector-icons / Skia / Lottie
- **fishjam**：hosted WebRTC；rooms / peers / tracks + 两级 token（management 不出后端 / peer 24h）；4 SDK
- **detour**：deferred deep linking；Universal/App Links；确定性 vs 概率匹配；从 Branch/AppsFlyer 迁移
- **radon-mcp / rnrepo / expo-horizon**：Radon IDE 调试 / 构建提速 2× / 迁移 Meta Quest

## react-native-best-practices：动画的分层选型

animations 子主题的核心是**「按复杂度选对动画方式」**，从轻到重：

| 方式 | 用什么 | 何时用 |
| --- | --- | --- |
| **CSS 过渡 / CSS 动画** | Reanimated 4 的 CSS-like API | 简单的属性过渡、循环动画，写法最省 |
| **shared value 动画** | `useSharedValue` + `useAnimatedStyle` + `withTiming/withSpring/withDecay` | 需要命令式控制、手势联动的交互动画 |
| **canvas 动画** | `@shopify/react-native-skia` | 复杂 2D 绘制、路径动画、runtime shader（SKSL）、粒子、精灵（Atlas） |
| **GPU shader 动画** | `react-native-wgpu` + TypeGPU | WGSL 计算管线、粒子/物理仿真、Perlin 噪声、SDF、3D（Three.js / R3F） |
| **layout 动画** | `FadeIn` / `LinearTransition` / keyframes | 进入/退出、布局变化、列表项（`itemLayoutAnimation`）、共享元素过渡 |

配套还有 **scroll-driven** 动画（`useAnimatedScrollHandler` / `useScrollOffset` / `scrollTo`）、`useAnimatedReaction`、`useFrameCallback`，以及**性能**子文件（120fps 设置、feature flags、同时动画数上限、`useReducedMotion` 无障碍、worklet 闭包优化、debug vs release 差异）。

::: warning 贯穿全篇的关键规则
**绝不用 `runOnJS`**——Reanimated 4 已移除。所有 worklet 上下文（滚动处理器、手势回调、`useAnimatedReaction`、`useFrameCallback`）里要调 JS 线程函数，一律用 `react-native-worklets` 的 **`scheduleOnRN(fn, ...args)`**。
:::

## gestures：Gesture Handler 的硬规则

gestures 子主题围绕 **React Native Gesture Handler**，开篇就立规矩：**永远别用 `PanResponder`**——它跑在 JS 线程、事实上已废弃；有 RNGH 就用 RNGH。

几条会「崩运行时」的硬规则：

- **`GestureHandlerRootView` 必须在根**：没有它做祖先，`GestureDetector` 运行时直接崩。Expo Router 里包住根 `_layout.tsx` 的 `<Stack />`；嵌套的 `GestureHandlerRootView` 会被忽略（只用最外层）。
- **手势回调跑 UI 线程**：装了 Reanimated 后，手势回调被 workletize、跑在 UI 线程。**直接调任何非 worklet 函数**（state setter、导航、native module）会崩「Tried to synchronously call a non-worklet function on the UI thread」。必须用 `scheduleOnRN` 包起来。
- **别混用两套触摸系统**：同一组件树里 RN 原生触摸处理器与 RNGH 混用 → 双击 bug、手势冲突。一个 app 选一套。
- **滚动容器从 RNGH 导入**：`ScrollView` / `FlatList` 从 `react-native-gesture-handler` 导入，而非 `react-native`。

**v2 与 v3 API 差异**：v2 是 builder API（`Gesture.Pan().onUpdate(...)`，必须 `useMemo` 包住，否则每次渲染重建、丢状态）；v3 是 hook API（`usePanGesture({ onUpdate })`，内部处理 memoization、支持 React Compiler）。看 `package.json` 里版本号是 `2.` 还是 `3.` 来定用哪套。

## audio：react-native-audio-api 的资源纪律

audio 子主题基于 **react-native-audio-api**（Web Audio API 风格的音频图），几条关键纪律：

- **单例 `AudioContext`**：一个 app 只建一个实例，多实例会状态打架（一个 running 一个 suspended）。封成 singleton。
- **单例 `AudioRecorder`**：建一个复用；切换实例对性能、内存、电量都有明显影响。
- **空闲要 `suspend()`**：running 的 `AudioContext` 即使没连源节点也在放静音、耗电；iOS 上还会挡住锁屏的暂停态。临时不用 `suspend()`，永久不用 `close()`。
- **`AudioBufferSourceNode` 单次使用**：只能 `start()` 一次；重播要新建节点（节点很廉价，复用 `AudioBuffer` 即可）。
- **参数变化用调度**：直接改 gain/frequency 会爆音（click）。用 `linearRampToValueAtTime` / `exponentialRampToValueAtTime` / `setTargetAtTime` 平滑过渡。
- **可视化就地改数组**：把音频数据传给 Reanimated shared value 时，用 `.modify()` 就地改 `Float32Array`，别每帧新分配（60fps+ 分配会 GC 卡顿）。

覆盖：播放（buffer / oscillator / streamer / 队列）、录音（文件 / 数据回调 / 图处理三模式）、音效链（gain / filter / delay / convolver / panner / waveshaper）、实时分析（`AnalyserNode`）、audio worklet（`UIRuntime` vs `AudioRuntime`）、系统集成（session / 中断 / 通知 / 权限）。

## on-device-ai：ExecuTorch 端侧推理

on-device-ai 基于 **React Native ExecuTorch**，做**不依赖云**的端侧 AI。关键规则：

- **先 `initExecutorch()`**：在 app 入口、任何其它 API 之前调用，并注册 resource-fetcher adapter（Expo 用 `ExpoResourceFetcher`、bare 用 `BareResourceFetcher`）。否则抛 `ResourceFetcherAdapterNotInitialized`。
- **推理前查 `isReady`**：所有 hook 异步加载，没 ready 就推理抛 `ModuleNotLoaded`。
- **卸载前中断 LLM**：`isGenerating` 为 true 时卸载会崩；先 `llm.interrupt()` 等 `isGenerating === false`。
- **用 `_QUANTIZED` 变体**：全精度模型多数手机放不下；每个模型都有量化变体，默认选它。
- **音频采样率**：STT / VAD 要 **16kHz 单声道**（`new AudioContext({ sampleRate: 16000 })`）；TTS 输出是 **24kHz**。错采样率会静默产生乱码转写。
- **必须新架构**：Fabric 必需，老架构不支持；Expo Go 不支持（用 dev build）；iOS release 需真机（模拟器缺 Metal API）。

hook 覆盖：`useLLM`（含 VLM、tool calling、结构化输出）、`useClassification` / `useObjectDetection` / `useOCR` / `useSemanticSegmentation` / `useInstanceSegmentation` / `usePoseEstimation` / `useStyleTransfer` / `useTextToImage` / `useImageEmbeddings`（视觉）、`useSpeechToText` / `useTextToSpeech` / `useVAD`（语音）、`useTextEmbeddings` / `useTokenizer` / `usePrivacyFilter`、`useExecutorchModule`（自定义 `.pte`）。每个 hook 都有非 React 的 `Module` 对应物（如 `LLMModule.fromModelName(...)`）。

## multithreading：worklets 的三 runtime 模型

multithreading 基于 **react-native-worklets**（它也是 Reanimated / Gesture Handler / Skia 的底层）。核心是**三种 runtime**，先选对目标：

| Runtime | 特点 | 干什么 |
| --- | --- | --- |
| **UI Runtime** | 主线程，一个 app 一个 | 响应原生事件、同帧驱动动画 |
| **Worker Runtime** | 自定义线程，可多个 | 重计算、数据处理、后台任务 |
| **RN Runtime** | JS 线程，一个 app 一个 | 访问 React state / 导航 / RN API |

runtime **不共享内存**，数据跨界靠序列化（不可变拷贝）或 `Synchronizable`（共享可变）。API 按「fire-and-forget / 要异步返回 / 要同步返回」× 目标 runtime 组合：`scheduleOnUI` / `scheduleOnRN` / `scheduleOnRuntime`（fire-and-forget），`runOnUIAsync` / `runOnRuntimeAsync`（异步），`runOnUISync` / `runOnRuntimeSync`（同步）。

**弃用映射**（务必用新名）：`runOnUI` → `scheduleOnUI`，**`runOnJS` → `scheduleOnRN`**，`runOnRuntime` → `scheduleOnRuntime`。新 API 直接传参，不再返回 curried 函数。worklet 函数体首行加 `'worklet';`（传给调度 API 的内联回调由 Babel 插件自动 workletize）。

## jsi：C++ 与 JS 引擎的边界

jsi 子主题讲 **JSI（JavaScript Interface）**——让 C++ 直接与 JS 引擎交互（读写 JS 值、调 JS 函数、把 C++ 对象暴露给 JS），不走老的异步 bridge。覆盖：

- **核心类型**：`jsi::Runtime` / `Value` / `Object` / `Function` / `HostObject` / `HostFunction` / `NativeState` / `WeakObject` / `ArrayBuffer` 的构造、所有权、生命周期、GC 行为
- **线程安全**：单线程规则、`Value` 不可拷贝 + `shared_ptr` 模式、`WithRuntimeDecorator<AroundLock>`
- **调用与异步**：装 `HostFunction` 绑定、从 C++ 调 JS、`invokeAsync` + `CallInvoker`、Promise 模式
- **性能**：批量调用、缓存 `PropNameID`、**零拷贝 `ArrayBuffer`**（`MutableBuffer`）、`setExternalMemoryPressure`
- **模块选型**：Pure JSI vs **TurboModules** vs **Nitro Modules** vs 纯 C++ 核 + 薄适配器的决策树与取舍

## svg：react-native-svg 与选型

svg 子主题基于 **React Native SVG**，覆盖从 URI / XML 字符串 / 文件加载 SVG、filter、触摸事件、性能。它还给出**选型对照**：什么时候用 react-native-svg，什么时候用 expo-image / `@expo/vector-icons` / Skia / Lottie——矢量图标用 SVG，复杂动画绘制用 Skia，现成动效用 Lottie。

## fishjam：实时音视频平台

`fishjam` 是独立 skill，指导用 **Fishjam**（Software Mansion 托管的 WebRTC 平台）建实时视频、音频、一对多直播。领域模型：**rooms（房间）/ peers（参与者）/ tracks（音视频轨）**，两级鉴权：

- **management token 绝不出后端**：泄露就从 Dashboard 重新生成
- **peer token 有效 24h**：初次 WS 握手时消费；已建立的会话自己继续跑；未连接或 24h 后重连要 `refreshPeerToken` 重新签发
- **Sandbox API 仅 dev**：拿到它的人能在你账号上建房间，绝不进生产客户端构建

一个生产 Fishjam 应用 = **后端（server SDK）+ 客户端（client SDK）**。四个 SDK：**Node.js** 与 **Python** 服务端 SDK（含 AI 语音 agent、Gemini Live 集成）、**React** web 客户端、**React Native / Expo** 客户端（权限、前台服务、CallKit、屏幕共享、画中画）。原型阶段可用 Sandbox API 跳过后端。

## detour：deferred deep linking

`detour` 是 Software Mansion 的开源 **deferred deep linking**（延迟深链）SDK。核心心智模型：用户点 Detour 链接 → 记录点击 + 设备指纹 → 跳应用商店 → 装完首次打开，SDK 调 match API → 把安装匹配回原始点击 → app 导到正确页面（**即使首次启动、app 之前没装**）。此外也处理 **Universal Links（iOS）/ App Links（Android）**（app 已装时直接打开）。

匹配机制两种：**确定性匹配**（Android，Play Store 传回精确 `click_id`，直接查表，很可靠）；**概率匹配**（iOS 及 Android 兜底，按 IP / 设备型号 / user-agent / 时区 / 屏幕尺寸等打分，默认阈值 850 分、时间窗 15 分钟）。已知局限（要主动说）：iCloud Private Relay / VPN 混淆 IP、iOS 剪贴板拒绝、广告网络剥离 `click_id` 等——**不适合路由敏感数据 / 金融决策**。detour skill 分 `detour-onboarding`（从零上手）与 `migrate-to-detour`（从 **Branch / AppsFlyer** 迁移的结构映射）。

## radon-mcp / rnrepo / expo-horizon

- **radon-mcp**：**Radon IDE** 的 MCP 工具最佳实践——调试任何问题先 `view_application_logs`，再 `view_screenshot`（视觉态）、`view_component_tree`（组件结构）、`view_network_logs` / `view_network_request_details`（网络）、`reload_application`（JS reload / 进程重启 / 全量重构三选一）、`query_documentation`（查 RN/Expo 文档）。
- **rnrepo**：Software Mansion 的**预构建产物**基础设施，原生构建提速最高约 **2×**。Gradle（Android）/ CocoaPods（iOS）插件拦截构建、用 `packages.rnrepo.org` 的预构建产物替换库，不可用则回退源码。**beta、仅新架构**（RN 0.77~0.79 最新补丁及 0.80+）。Expo CNG 用 `@rnrepo/expo-config-plugin`；有**原生 patch** 的库要在 `rnrepo.config.json` 的 `denyList` 里 opt out（纯 JS patch 不用）；`DISABLE_RNREPO=1` 整体关闭。
- **expo-horizon**：把 **Expo SDK 应用迁移到 Meta Quest**。先装 `expo-horizon-core`（其它包都依赖它，建立 `quest`/`mobile` build flavor）；**绝不自动装** `expo-horizon-location` / `expo-horizon-notifications`——检测到 `expo-location` / `expo-notifications` 要**先问用户**再迁移。Quest 无 GPS / 磁传感器，heading / geocoding / geofencing 不可用，要用 `ExpoHorizon.isHorizonDevice` 守卫；`isHorizonDevice`（运行时硬件）vs `isHorizonBuild`（构建期特性门）；改插件配置后跑 `npx expo prebuild --clean`。

## 反模式（Software Mansion 明确点名）

- ❌ **用 `runOnJS`**（Reanimated 4 已删）→ ✅ `scheduleOnRN`
- ❌ **用 `PanResponder`** 做手势（跑 JS 线程、废弃）→ ✅ Gesture Handler
- ❌ **手势/worklet 回调里直接调 JS 函数**（崩 UI 线程）→ ✅ `scheduleOnRN` 包裹
- ❌ **忘了 `GestureHandlerRootView`** → `GestureDetector` 运行时崩
- ❌ **多个 `AudioContext` / `AudioRecorder`** → 状态打架、性能差 → ✅ 单例
- ❌ **ExecuTorch 用全精度模型 / 忘 `initExecutorch` / 不查 `isReady`** → OOM / 抛异常 → ✅ 量化变体 + 先初始化 + 门控
- ❌ **management token / Sandbox URL 进生产客户端** → 账号被滥用 → ✅ 只留后端
- ❌ **expo-horizon 自动装 location/notifications 包** → ✅ 先问用户

## 下一步

- [参考](./reference) —— skills 清单表、动画方式对照、安装、Reanimated 4、许可、链接
- 上游：[software-mansion-labs/skills](https://github.com/software-mansion-labs/skills)
