---
layout: doc
outline: [2, 3]
---

# React Native 新架构深潜

> 基于 React Native 0.86 · 核于 2026-07

## 速查

- **为何弃 Bridge**：旧架构靠**异步 Bridge** 传**序列化成 JSON** 的消息，三痛点＝序列化开销、全异步（布局跳变）、高频大数据瓶颈（相机每帧数十 MB 扛不住）
- **JSI**（地基）：C++ 接口，让 **JS↔C++ 直接互相持有引用、同步调用**，消除序列化；不绑定具体 JS 引擎
- **Fabric**（新渲染器，替 Paper）：C++ 统一核心 + **Shadow Tree**，Render→Commit→Mount；带来**同步布局**（消跳变）+ React 18/19 并发（Suspense/Transitions/自动批处理）+ 视图扁平化 + 懒初始化
- **TurboModules**（新原生模块）：JSI **同步、类型安全、懒加载**；spec 以 `Native` 前缀、`extends TurboModule`，放 `specs/`
- **Codegen**：**构建期**从 TS/Flow spec 生成 C++/Java/ObjC++ 胶水，保 JS↔原生类型安全；配 `package.json` 的 `codegenConfig`（`type: modules|components`）
- **Bridgeless**：彻底不建桥；0.73 实验 → **0.74 新架构下默认** → 0.82 唯一模式
- **Yoga**：跨平台 Flexbox 布局引擎（C/C++），把样式算成坐标
- **Hermes**：默认 JS 引擎，**AOT 把 JS 预编译成字节码（.hbc）**→ 更快启动/更低内存/更小包；`global.HermesInternal` 判断，性能看 **release build**
- **版本口诀**：**0.68 实验 → 0.74 Bridgeless 默认 → 0.76 默认 → 0.82 强制不可关**；可关的最后版本＝**0.81**（Expo SDK 54）
- **重要提醒**：新架构**不保证立刻变快**——需重构才能吃到同步布局/并发红利

## 一、为什么要替换旧架构（Bridge）

旧架构（俗称 Paper 时代）在 JS 线程与原生线程之间架了一条**异步 Bridge**，所有跨语言通信都要把数据**序列化成 JSON** 再传。这套模型有三个结构性痛点：

1. **序列化开销**：每一次 JS↔原生的数据往返都要 JSON 编解码，量大时开销显著。
2. **强制全异步**：无法**同步**读取布局或调用原生。典型后果是「先渲染出错误尺寸，下一帧再纠正」的**布局跳变（layout jank）**。
3. **高频/大数据瓶颈**：相机预览每帧可能几十 MB、每秒上 GB，Bridge 的序列化 + 异步根本扛不住。

新架构的整体思路：**用 JSI 直接内存互引替代序列化 Bridge**，并在其上重建渲染器（Fabric）、原生模块（TurboModules）、类型安全（Codegen），最终**彻底不建桥（Bridgeless）**。

## 二、JSI：新架构的地基

**JSI（JavaScript Interface）** 是一层用 C++ 写的接口，核心能力是让 **JS 能直接持有 C++ 对象的引用、C++ 也能持有 JS 的引用**，从而**同步调用**彼此的方法、**消除 JSON 序列化**。

- 收益：同步互操作、可暴露复杂类型（数据库句柄、图像、音频样本），支撑实时高频场景（如 VisionCamera 逐帧处理）。
- 关键性质：JSI **不依赖某个特定 JS 引擎**——它是架在 Hermes/JSC 之上的抽象层。这也是为什么切换引擎不影响上层。

## 三、Fabric：新渲染器

Fabric 取代旧渲染器 Paper，把渲染逻辑集中到**跨平台 C++ 核心**：

- **Shadow Tree（影子树）**：React 组件的中间表示，用于布局计算；布局由 **Yoga** 算。
- **三阶段管线**：**Render（构建/更新影子树）→ Commit（提交、算布局）→ Mount（挂载为原生视图）**。
- 关键收益：
  - **同步布局与测量**（线程安全）→ 消除嵌入原生视图时的跳变；`useLayoutEffect` 可在同一 commit 内测量并更新。
  - 完整支持 **React 18/19 并发**：Suspense、Transitions（`useTransition`/`startTransition`）、自动批处理。
  - **View Flattening（视图扁平化）**：原为 Android 优化，现所有平台默认，减少无谓层级。
  - **懒初始化** host 组件 → 启动更快。

| 维度 | Paper（旧） | Fabric（新） |
| --- | --- | --- |
| 布局 | 异步 | **同步** |
| 数据传输 | 序列化 JSON | **JSI 直接访问** |
| 代码 | 各平台各写 | **统一 C++ 核心** |
| 启动 | 全量初始化 | **懒初始化** |
| 并发 | 有限 | **完整 React 18/19** |

## 四、TurboModules 与 Codegen

### TurboModules（新原生模块）

相较旧原生模块（Bridge 异步、无类型、启动即全量初始化、样板手写），TurboModules 全面升级：**JSI 同步/低延迟、类型安全、懒加载**（首次访问才初始化，改善启动）。

```ts
// specs/NativeLocalStorage.ts —— spec 以 Native 前缀命名、extends TurboModule
import type { TurboModule } from "react-native";
import { TurboModuleRegistry } from "react-native";

export interface Spec extends TurboModule {
  setItem(value: string, key: string): void;
  getItem(key: string): string | null;
}
// getEnforcing：不存在则抛错；get：不存在返回 null
export default TurboModuleRegistry.getEnforcing<Spec>("NativeLocalStorage");
```

### Codegen

Codegen 在**构建期**（每次 build iOS/Android 都触发）从**类型化的 spec** 生成 **C++ 胶水 + Android(Java) + iOS(ObjC++)** 样板，为 TurboModules 与 Fabric Native Components 服务，并**保证 JS↔原生类型安全**（不匹配就编译报错）。

```json
// package.json
{
  "codegenConfig": {
    "name": "NativeLocalStorageSpec",
    "type": "modules",
    "jsSrcsDir": "specs",
    "android": { "javaPackageName": "com.nativelocalstorage" }
  }
}
```

> 无 UI 的纯逻辑用 **TurboModules**；包裹原生 UI 控件用 **Fabric Native Components**（`codegenNativeComponent`，`type: "components"`）。

## 五、Bridgeless 与 Yoga

- **Bridgeless（无桥模式）**：完全用 JSI + TurboModules + Fabric，**彻底不创建 bridge**。0.73 实验、**0.74 起在新架构下默认**、0.82 起随强制新架构成为唯一模式；为兼容旧模块/旧组件提供 Interop Layer（互操作层）。
- **Yoga**：跨平台 **Flexbox 布局引擎**（C/C++），Fabric 用它把 Flexbox 样式算成具体坐标；持续向 Web 对齐（Playground：yogalayout.dev）。

## 六、Hermes 引擎

Hermes 是 Meta 为 RN 定制的开源 JS 引擎，**默认开启**且每个 RN 版本**内置匹配版本（bundled Hermes）**：

- **核心机制：AOT 字节码预编译**——构建期把 JS 编成 **Hermes Bytecode（.hbc）**，省去设备端解析/编译 → **更快启动、更低内存、更小包体**。
- 验证是否启用：`const isHermes = () => !!global.HermesInternal;`；**性能收益要在 release build 才准**（dev 模式本身拖慢 JS）。
- 切回 JavaScriptCore 走社区包 `react-native-community/javascriptcore`。

## 七、版本时间线与开关

| 版本 | 时间 | 里程碑 |
| --- | --- | --- |
| 0.68 | 2022 | 新架构首次可实验性 opt-in |
| 0.73 | 2023-12 | **Bridgeless Mode** 首次引入（实验） |
| 0.74 | 2024-04 | **Bridgeless 成为新架构下默认** |
| **0.76** | 2024-10 | **新架构成为所有项目默认**、production-ready |
| **0.82** | 2025-10 | **首个完全运行在新架构上**；旧架构开关移除、`newArchEnabled` 失效 |
| 0.85 / 0.86 | 2026 | 新架构专属时代，持续清理 legacy |

- **可 opt-out 的最后版本＝0.81**（Expo SDK 54）；**0.82 起强制、不可关**（Expo SDK 55 起）。
- 0.76–0.81 临时关闭：Android 改 `android/gradle.properties` 的 `newArchEnabled=false`；iOS 在 `ios/Podfile` 顶部设 `ENV['RCT_NEW_ARCH_ENABLED'] = '0'` 后 `pod install`。
- ⚠️ **新架构不保证立即变快**：同步布局/并发红利需**重构**才能吃到；若瓶颈本不在序列化，收益有限。

## 八、四大件一句话回顾

- **JSI**：JS↔C++ 直接互引、同步调用，替代序列化 Bridge。
- **Fabric**：C++ 统一新渲染器，同步布局 + React 并发。
- **TurboModules**：JSI 原生模块，类型安全 + 懒加载。
- **Codegen**：构建期从 spec 生成原生胶水，保类型安全。
- 配角：**Bridgeless**（彻底不建桥）、**Yoga**（Flexbox 布局引擎）、**Hermes**（默认引擎、AOT 字节码）。
