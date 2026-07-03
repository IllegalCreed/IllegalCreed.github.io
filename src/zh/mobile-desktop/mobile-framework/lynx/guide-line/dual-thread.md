---
layout: doc
outline: [2, 3]
---

# Lynx 双线程架构与 PrimJS

> 基于 Lynx（2025 开源）· 核于 2026-07

## 速查

- **双线程模型**：**主线程 / UI 线程**（PrimJS 驱动，负责**首帧渲染**与**高优先级事件 / 手势**）+ **后台线程**（默认跑用户业务代码、组件生命周期、副作用与异步，保持主线程低负载、不阻塞）
- **Main-Thread Scripting（MTS）**：一小段**静态调度、被授权在主线程运行**的脚本，专门处理高优先级事件与手势 → 交互无需往返后台线程
- **Instant First-Frame Rendering（IFR）**：**短暂阻塞主线程直到首帧完全渲染**，以此消除白屏；官方观点是「渲染够快就不需要中间态反馈」
- **PrimJS**：Lynx **自研、专为 Lynx 优化**的 JS 引擎，驱动主线程（快启动 / GC 等**具体指标资料尚不充分**）
- **与 RN 的区别**：Lynx 把「首屏关键渲染」放主线程**同步**做、把「业务逻辑」放后台线程；RN 新架构靠 **JSI** 打通 JS 线程与 UI 线程
- **性能口径（重要）**：官方**内部基准**称 **Web → Lynx 迁移「启动时间降低 2–4x」**——注意口径是 **Web→Lynx**，**并非** 「比 React Native 快 2–4x」

## 一、为什么要双线程

大多数 JS 系跨端框架的性能瓶颈，来自**业务逻辑与 UI 渲染争抢同一条 JS 线程**：一旦业务计算繁忙，UI 就掉帧、交互就卡。Lynx 的思路是**从线程层面把两类工作分开**：

- **关键、同步的 UI 工作**（首帧渲染、用户手势这类高优先级事件）放到**主线程 / UI 线程**，力求「秒开、跟手」。
- **其余业务逻辑**（数据处理、网络、副作用等）放到**后台线程**，即使它繁忙，也不拖累主线程的 UI 响应。

官网对多线程引擎的宣称是「achieve instant launch and silky UI responsiveness」（秒开与丝滑的 UI 响应）。

## 二、主线程 / UI 线程

- **职责**：处理「privileged, synchronous UI tasks」——**首屏启动渲染**与**高优先级事件处理**（手势等）。
- **驱动引擎**：由自研的 **PrimJS** 驱动（见第六节）。
- **设计目标**：让首屏与交互走「特权、同步」的快路径，不必等后台线程回传。

## 三、后台线程

- **职责**：作为**用户代码的默认运行处**，承载业务逻辑、组件生命周期、副作用与异步任务。
- **设计目标**：「ensuring the main thread remains low workload and non-blocking」——把重活留在后台，保证主线程始终轻量、不阻塞。
- 在 ReactLynx 中，后台线程运行**完整的 React 运行时**，负责组件生命周期等（详见 [ReactLynx 页](./reactlynx)）。

## 四、Main-Thread Scripting（MTS）

双线程带来一个新问题：**高优先级手势如果每次都要绕到后台线程处理，就会有延迟**。Lynx 用 **Main-Thread Scripting（MTS）** 解决——官方描述为：

> 「a small, statically scheduled piece of code, privileged to run on the main thread, handles high-priority events and gestures.」
> （一小段静态调度、被授权在主线程运行的代码，处理高优先级事件与手势。）

要点：

- **静态调度**：MTS 是可被提前调度的小段脚本，而非任意业务代码。
- **主线程特权**：它直接在主线程执行手势/高优先级事件，**省去往返后台线程的延迟**。
- 在 ReactLynx 里通过 `'main thread'` 指令把某段脚本标注为主线程脚本（详见 [ReactLynx 页](./reactlynx)）。

## 五、Instant First-Frame Rendering（IFR）

Lynx 用 **Instant First-Frame Rendering（IFR，首帧即时渲染）** 消除启动白屏。官方原话是：

> 「if rendering is fast enough—and Lynx is—no special intermediate feedback is needed. By briefly blocking the main thread until the first frame is fully rendered, Lynx eliminates blank screens.」

翻译要点：**只要渲染足够快，就不需要 loading/骨架屏这类中间态**；Lynx 的做法是**短暂阻塞主线程，直到首帧完全渲染完成**，从而**直接消除白屏**。这也解释了为什么「首帧渲染」被放在主线程同步路径上。

## 六、PrimJS 引擎

- **是什么**：官方称 PrimJS 是「a custom JavaScript engine specifically optimized for Lynx」——**Lynx 自研、专为 Lynx 优化**的 JS 引擎，由字节团队开发，用于驱动主线程。
- **与 RN 的对照**：RN 用 **Hermes**（AOT 预编译字节码）；Lynx 用**自研 PrimJS**，是它区别于 RN 引擎选型的一点。
- **待核**：KB 与坊间称 PrimJS 主打「快启动 + 高效 GC」，但我核对的官方页面**未给出具体性能指标**（启动耗时、GC 口径等）——此处**资料尚不充分**，不写成量化事实。独立引擎仓库（如 `lynx-family/primjs`）的确切地址亦以官方为准。

## 七、性能口径：正确理解「2–4x」

一个**常见误读**需要澄清：网络上流传「Lynx 比 React Native 快 2–4 倍」。但我核对官方博客，其**内部基准**的真实口径是——

> 「2–4× reduction in launch times」when **migrating from Web to Lynx**（从 **Web 迁移到 Lynx** 时，启动时间降低 2–4 倍）。

也就是说：

- **基准对象是 Web → Lynx**，**不是** Lynx vs React Native。
- 该数字来自**官方内部基准**，缺乏公开可复现的第三方口径。
- 因此本叶**不**把「Lynx 比 RN 快 N 倍」当作事实陈述；跨框架性能对比的可靠数据**资料尚不充分**。

## 八、一句话回顾

- **主线程 / UI 线程**：PrimJS 驱动，首帧渲染 + 高优先级手势，走同步快路径。
- **后台线程**：跑业务/副作用/异步，保主线程轻量不阻塞。
- **MTS**：静态调度的主线程小脚本，直接处理手势。
- **IFR**：短暂阻塞主线程直到首帧完成，消除白屏。
- **PrimJS**：自研引擎驱动主线程（具体指标待核）。
- **2–4x**：是 Web→Lynx 启动时间口径，**非** vs RN。
