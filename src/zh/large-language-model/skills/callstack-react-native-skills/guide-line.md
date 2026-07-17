---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 callstackincubator/agent-skills 官方 skills 的 `react-native-best-practices/SKILL.md` 及其 references 目录、`assess-react-native-migration` / `create-react-native-library` / `github-actions` 的 `SKILL.md` 编写。

## 速查

- **三大类**：JS/React（`js-*`，9 篇）· Native iOS/Android（`native-*`，10 篇）· Bundling（`bundle-*`，9 篇 + 交叉）
- **列表（CRITICAL）**：ScrollView 长列表 → FlatList/FlashList/Legend List；FlashList v2 弃用 `estimatedItemSize`
- **重渲染（CRITICAL）**：profile 确认后再上 React Compiler（自动 memo）或原子状态（Jotai/Zustand 选择器）
- **Turbo Module（HIGH）**：重活丢后台线程（DispatchQueue/Coroutines），异步优于同步，C++ 跨平台走 JSI 免 JNI
- **16KB 对齐（CRITICAL）**：Android 15+ 上架 Google Play 必须；RN 0.79+ 自带对齐但第三方 `.so` 仍要 `zipalign -c -P 16` 查
- **tree shaking / R8**：Expo SDK 52+ 实验性摇树（仅生产、须 ESM）；R8 `minifyEnabled true` 减 20~33% 包体
- **反模式**：内联 renderItem、无度量就 memoize、假设所有 FlashList 版本都要 estimatedItemSize、只查 32 位 ABI
- **迁移评估**：只读诊断，brownfield/greenfield/checkpoint 三路 + ROI，不执行迁移

## react-native-best-practices：三大类

核心技能把 React Native 性能优化拆成三大类，每类若干篇 reference（标注 Impact），并配「问题 → 起手技能」映射表。

### 一、JavaScript / React 优化（`js-*`）

聚焦 JS 线程、React 渲染、列表、状态、动画。

**列表虚拟化（CRITICAL）**——最高频的性能坑。长列表用 `ScrollView` 会一次性挂载全部行，撑爆 JS 工作量、原生视图数与内存：

```jsx
// 错误：ScrollView 一次渲染所有 item
<ScrollView>{items.map((i) => <Item key={i.id} {...i} />)}</ScrollView>

// 正确：虚拟化列表只渲染可视区 + 缓冲
<FlashList data={items} keyExtractor={(i) => i.id}
  renderItem={({ item }) => <Item {...item} />} />
```

选型：小静态内容 `ScrollView` 可以；量大用 `FlatList` 起步；大而复杂用 `FlashList`（回收视图，`getItemType` 按类型回收）或 `Legend List`（纯 JS、无原生依赖）。**版本护栏**：FlashList v1 才需 `estimatedItemSize`；**v2 已弃用**该属性（要求新架构、自动测算），别再当缺失项报。

**重渲染治理（CRITICAL）**——先 profile（`agent-device react-devtools profile` 或 Metro 里按 `j` 开 DevTools）确认级联重渲染或广播式 store 更新，**再**选方案：

- **React Compiler**（RN 0.76+ / Expo SDK 52+）：自动 memo，省掉手写 `memo`/`useMemo`/`useCallback`。先跑 `npx react-compiler-healthcheck@latest` 查是否符合 Rules of React。它只优化好代码、不修坏代码，改 Babel 配置后清缓存重启 Metro，可用 `"use no memo"` 局部退出
- **原子状态**（Jotai/Zustand）：广播式 Context/store 更新致无关订阅者重渲染时，用细粒度 atom 或带 selector 的 store，只订阅相关状态才重渲染
- `useDeferredValue`：给昂贵计算降优先级

**关键纪律**：技能明确要求「没有度量到渲染/FPS 问题，不要推荐 memoization、原子状态或编译器改造」；也不要仅凭组件树深度/数量当性能证据。

**其它 JS 篇**：`js-measure-fps`（FPS 监测）、`js-memory-leaks`（用 DevTools Memory 抓泄漏，最常见是 `useEffect` 漏 cleanup 的监听器/定时器）、`js-animations-reanimated`（Reanimated worklet 跑 UI 线程）、`js-bottomsheet`、`js-uncontrolled-components`（TextInput 用非受控减重渲染）、`js-concurrent-react`。

### 二、Native iOS/Android 优化（`native-*`）

聚焦原生模块、线程、TTI、内存、平台工具。

**Turbo Modules（HIGH）**——原生模块性能核心是**别阻塞 JS 线程**，重活丢后台线程：

```swift
// 错误：同步方法阻塞 JS 2 秒
@objc func heavyWork() -> NSNumber { Thread.sleep(forTimeInterval: 2); return 42 }

// 正确：异步 + 后台队列
@objc func heavyWork(resolve: @escaping RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
  DispatchQueue.global().async { resolve(self.compute()) }
}
```

Android 侧用结构化并发：模块自持 `CoroutineScope`（`Dispatchers.Default` 跑 CPU、`Dispatchers.IO` 跑磁盘/网络），`invalidate()` 里 `cancel()` 防泄漏，用 `SupervisorJob` 隔离失败，别用 `GlobalScope.launch`。**C++ Turbo Module** 经 JSI 直接持有函数引用，运行时免 JNI，适合跨平台性能关键代码。线程规则：同步方法保持 <16ms、可阻塞/IO/等锁的一律异步。

**原生 SDK 优于 JS polyfill（HIGH）**——JS polyfill 常吃掉 430+ KB：审计后按 Hermes 实际支持情况移除不必要的 `Intl` polyfill（`Intl.Collator` Hermes 已支持、`Intl.PluralRules`/`RelativeTimeFormat`/`DisplayNames` 仍需 polyfill）；crypto 换 `react-native-quick-crypto`（原生 C++）；导航用 `@react-navigation/native-stack` + `react-native-screens`（原生动画、iOS 大标题、卸 JS 线程负担）。注意：构造器支持不等于每个 option/method 都支持，逐一核对再删。

**TTI（HIGH）**——只测冷启动（warm/hot/prewarmed 都过滤掉）。用 `react-native-performance` 打 marker，管线：`nativeLaunchStart → nativeLaunchEnd → runJSBundleStart → runJSBundleEnd → contentAppeared → screenInteractive`（最后一个才是 TTI）。iOS 靠 `ActivePrewarm` 环境变量判冷启动。2~4s 只是粗略外部启发式，真正目标按设备档、启动路径、发布构建定。

**其它 Native 篇**：`native-threading-model`、`native-profiling`（Xcode Instruments Time Profiler / Android Studio CPU Profiler）、`native-platform-setup`、`native-view-flattening`（视图层级扁平化）、`native-memory-patterns`、`native-memory-leaks`。

### 三、Bundling 与包体优化（`bundle-*`）

聚焦包体分析、摇树、R8、Hermes、资源。

**避免 barrel 导入（CRITICAL）**——从 `index.ts` 桶文件导入会让所有 re-export 都可达并求值，即使只用一个：

```tsx
import { Button } from './components';        // 加载全部导出 ❌
import Button from './components/Button';       // 只加载 Button ✅
```

危害：包体膨胀、运行时全量求值、易造环形依赖（破坏 HMR）。可用 `eslint-plugin-no-barrel-files` 强制，或 `react-native-paper/babel` 这类库专属插件自动改写。

**tree shaking（HIGH）**——Metro 本身无通用摇树。Expo SDK 52+ 有实验性去除未用导入/导出：

```bash
# .env（仅生产构建生效）
EXPO_UNSTABLE_METRO_OPTIMIZE_GRAPH=1
EXPO_UNSTABLE_TREE_SHAKING=1
```

要求 ESM 导入（非 `require`）、库声明 `"sideEffects": false`。非 Expo 项目须 Metro `experimentalImportSupport: true` + Babel `disableImportExportTransform: true` 配套。`Platform.OS`/`Platform.select` 里的代码会按平台摇掉（**必须直接从 `react-native` 导入 `Platform`**，`import * as RN` 则失效）。预期减 10~15% 包体。

**R8 收缩（HIGH，Android）**——`android/app/build.gradle` 里 `minifyEnabled true` + `shrinkResources true` 开启收缩/优化/混淆，用 ProGuard 规则格式。示例减包 9.5MB→6.3MB（33%）。务必测 release 构建（R8 可能删掉它以为没用的反射代码，报错就加 `-keep` 规则）。

**Android 16KB 页对齐（CRITICAL）**——Android 15+ 上架/更新 Google Play 必须支持 64 位设备的 16KB 页。RN 0.79+ 自带对齐的官方二进制，但**第三方 `.so` 仍可能未对齐**：

```bash
zipalign -c -P 16 -v 4 app-release.apk   # 缺 -P 16 只查 4KB！
```

只影响 64 位 ABI（`arm64-v8a`/`x86_64`），32 位不受影响。修复要用兼容工具链**重新编译**原生库，重打包无效。别等 Play 商店打回，应在 CI 里查。

**其它 Bundling 篇**：`bundle-analyze-js`（`source-map-explorer` 可视化）、`bundle-analyze-app`（Emerge Tools / Ruler 拆解 App 体积）、`bundle-hermes-mmap`（RN 0.78 及更早：`noCompress += ["bundle"]` 关 Android 压缩以启用 Hermes mmap，装机 +8% 换 TTI -16%；RN 0.79+ 默认已非压缩，用 `react { enableBundleCompression = false }`）、`bundle-native-assets`、`bundle-library-size`、`bundle-code-splitting`（远程 chunk 只从可信 HTTPS 源、绑当前发布）。

## assess-react-native-migration：只读的迁移决策

评估现有原生 App 要不要、怎么迁 React Native。它**只出决策报告，不执行迁移**。核心：

- **先建产品范围**：清点所有生产客户端（iOS/Android 可能在不同仓库），缺哪个就标 `unknown` 并降置信度；不能因为当前仓库里没有某平台就断定它不支持
- **证据驱动，一次只问一个问题**：范围/驱动未知时，回复严格限于「Question + Why it matters」两行，不发问卷、不给建议
- **三条路径**：**Path A brownfield**（发布/存量用户连续性压倒一切、原生耦合深、不能整体切换）·**Path B greenfield**（行为可复原、原生依赖有可信替代、连续性可证）·**Path C greenfield-first checkpoint**（Callstack 后 2025 运营模型：先在原生宿主里证明代表性 RN 流程再规模化）；还有 **Defer** / **Do not migrate**
- **代表性 checkpoint**：选 2~3 个纵向流程（一个通用流 + 一个带鉴权状态流 + 一个最可能证伪的边界如原生 SDK/后台任务/离线），跑「忠实 pass + 惯用 pass」，定可度量验收
- **ROI**：只算 React Native 相对现有原生系统的**边际价值**，别把双平台验证当成被省掉的活，投入要算全（checkpoint、双维护、原生模块、培训、发布设施等）

Path A 被接受后，实施规划交给 `react-native-brownfield-migration`。

## create-react-native-library：脚手架建库

用 `create-react-native-library`（底层 React Native Builder Bob）建独立库或 App 内本地原生模块：

```bash
# 独立库：Turbo Module + Kotlin/Obj-C + Expo 示例
npx create-react-native-library@latest awesome-library \
  --no-interactive --yes --type turbo-module \
  --languages kotlin-objc --example expo

# App 内本地库
npx create-react-native-library@latest awesome-library --local ...
```

产出即可发布的库：iOS（Obj-C/Swift）、Android（Kotlin）、TypeScript 定义、Codegen 配置。发 npm 走 `scaffold-library.md`，App 内加原生功能走 `local-library.md`（autolinking）。

## github-actions：CI 云构建移动产物

在云端为 iOS 模拟器 / Android 模拟器构建 React Native 应用，产出可用 `gh` CLI 或 GitHub API 下载的产物：

1. 加 iOS/Android 复合 action（composite `action.yml`）
2. 接入 `.github/workflows/mobile-build.yml`
3. 用 `actions/upload-artifact@v4` 上传并捕获 `artifact-id`
4. 用 `gh run download` 或 REST `GET /repos/{owner}/{repo}/actions/artifacts/{id}/{format}` 下载

iOS 产 `.app.tar.gz`、Android 产 `.apk`，灵感源自 `callstackincubator/ios` 与 `callstackincubator/android` 的 action。

## 反模式速览

- 长列表用 `ScrollView`、内联 `renderItem` 函数、漏 `keyExtractor`
- 没度量就上 `memo`/`useMemo`/原子状态/React Compiler
- 假设所有 FlashList 版本都要 `estimatedItemSize`（v2 已弃用）
- Turbo Module 同步方法里做重活/IO、忘了 cancel CoroutineScope
- `useEffect` 漏 cleanup 致监听器/定时器泄漏
- `zipalign` 忘加 `-P 16`（只查了 4KB）、只查 32 位 ABI、只验 debug 构建
- 假设 RN 升级会重编第三方原生二进制（不会，需自己查 16KB 对齐）
- `import * as RN` 后用 `RN.Platform.OS`（平台摇树失效）

## 下一步

- [参考](./reference) —— 29 篇优化要点全表、安装命令、许可、链接
- 上游：[Announcing React Native Best Practices for AI agents](https://www.callstack.com/blog/announcing-react-native-best-practices-for-ai-agents)
