---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 `software-mansion-labs/skills` README 与 `skills/` 目录编写。

## 速查

- **装**：`/plugin marketplace add software-mansion-labs/skills` → `/plugin install skills@swmansion` → `/reload-plugins`；或 `npx skills add software-mansion-labs/skills`
- **更新**：`/plugin marketplace update swmansion`
- **skills**：`react-native-best-practices`（8 子主题）· `fishjam` · `detour` · `radon-mcp` · `rnrepo` · `expo-horizon` · `typegpu`
- **动画分层**：CSS 过渡 → CSS 动画 → shared value → Skia canvas → GPU shader → layout
- **Reanimated 4**：`runOnJS` 已删 → `scheduleOnRN`（来自 `react-native-worklets`）
- **加载模型**：顶层 `SKILL.md` = 目录，reference 按需加载
- **许可**：README + 多个 SKILL.md 标 MIT，仓库根**无独立 LICENSE 文件**

## skills 清单全表

| Skill | 触发词（节选） | 覆盖 |
| --- | --- | --- |
| `react-native-best-practices` | React Native / Expo / Reanimated / Gesture Handler / 任何 RN 代码任务 | 顶层目录，路由到 8 个子主题 |
| ├ `animations` | useSharedValue / withTiming / Skia / WebGPU / 动画 | CSS 过渡·动画、shared value、canvas、GPU shader、layout、120fps |
| ├ `gestures` | GestureDetector / pan / pinch / swipe / drag | Gesture Handler，v2 builder / v3 hook API |
| ├ `svg` | react-native-svg / SVG / 图标 / 图表 | React Native SVG + 选型对照 |
| ├ `on-device-ai` | ExecuTorch / useLLM / OCR / 端侧 AI | 端侧 LLM / 视觉 / 语音 / embeddings |
| ├ `rich-text` | react-native-enriched / 富文本 / Markdown | 富文本编辑器 + Markdown 渲染 |
| ├ `multithreading` | worklet / scheduleOnUI / 后台线程 | react-native-worklets 三 runtime |
| ├ `audio` | react-native-audio-api / AudioContext / 录音 | 播放 / 录音 / 音效 / 分析 / worklet |
| └ `jsi` | jsi::Runtime / HostObject / TurboModule / Nitro | C++ ↔ JS 引擎边界 |
| `fishjam` | Fishjam / WebRTC / room / peer / livestream | hosted 实时音视频，4 SDK |
| `detour` | Detour / deferred deep link / Branch / AppsFlyer | 延迟深链 SDK（onboarding + migrate） |
| `radon-mcp` | Radon IDE / view_screenshot / app logs | Radon IDE MCP 工具调试 |
| `rnrepo` | RNRepo / slow builds / prebuilt artifacts | 预构建产物提速约 2×（beta） |
| `expo-horizon` | Meta Quest / Horizon OS / expo-horizon-core | 迁移 Expo 应用到 Meta Quest |
| `typegpu` | TypeGPU / WebGPU / WGSL / GPU shader | 类型化 GPU 管线 |

## 动画方式对照（animations 子主题）

| 方式 | 用什么库 / API | 典型场景 |
| --- | --- | --- |
| CSS 过渡 / CSS 动画 | Reanimated 4 CSS-like API | 简单属性过渡、循环动画 |
| shared value 动画 | `useSharedValue` + `useAnimatedStyle` + `withTiming/withSpring/withDecay` | 命令式、手势联动交互 |
| canvas 动画 | `@shopify/react-native-skia`（`usePathValue` / SKSL / Atlas） | 复杂 2D 绘制、路径、粒子、精灵 |
| GPU shader 动画 | `react-native-wgpu` + TypeGPU（`@typegpu/noise`、`@typegpu/sdf`） | WGSL 计算管线、仿真、3D |
| layout 动画 | `FadeIn` / `LinearTransition` / keyframes / `itemLayoutAnimation` | 进入退出、布局变化、列表项、共享元素 |
| scroll-driven | `useAnimatedScrollHandler` / `useScrollOffset` / `scrollTo` | 滚动驱动动画 |

## 安装与更新

```text
# 作为插件（推荐）
/plugin marketplace add software-mansion-labs/skills
/plugin install skills@swmansion
/reload-plugins

# 更新到最新版
/plugin marketplace update swmansion
```

```bash
# 通过开放 skills CLI（可进 Claude Code / Cursor / Codex）
npx skills add software-mansion-labs/skills
```

## Reanimated 4 与 worklets 关键点

| 项 | 旧（弃用） | 新（Reanimated 4 / worklets） |
| --- | --- | --- |
| 调 RN 线程函数 | `runOnJS(fn)(...args)` | `scheduleOnRN(fn, ...args)` |
| 调 UI 线程 | `runOnUI` | `scheduleOnUI` |
| 调 Worker runtime | `runOnRuntime` | `scheduleOnRuntime` |
| 手势库低层触摸 | `PanResponder`（JS 线程） | Gesture Handler（UI 线程） |

- worklet 函数体首行加 `'worklet';`；传给调度 API 的**内联**回调由 Babel 插件自动 workletize
- runtime 间**不共享内存**，跨界靠序列化（不可变拷贝）或 `Synchronizable`（共享可变）
- `react-native-worklets` 是 Reanimated / Gesture Handler / Skia 的**共同底层**

## 各 skill 的关键约束速记

| Skill | 硬约束 |
| --- | --- |
| animations | `runOnJS` 已删；worklet 里调 JS 用 `scheduleOnRN` |
| gestures | `GestureHandlerRootView` 必须在根；别用 `PanResponder`；别混 RN 触摸与 RNGH |
| audio | `AudioContext` / `AudioRecorder` 单例；空闲 `suspend()`；参数变化用 `AudioParam` 调度 |
| on-device-ai | 先 `initExecutorch` + adapter；查 `isReady`；用 `_QUANTIZED`；STT 16kHz/TTS 24kHz；需新架构 |
| jsi | 单线程规则；`Value` 不可拷贝用 `shared_ptr`；零拷贝 `ArrayBuffer` 用 `MutableBuffer` |
| fishjam | management token 不出后端；peer token 24h；Sandbox URL 不进生产客户端 |
| detour | 概率匹配默认 850 分 / 15 分钟窗；不路由敏感数据 |
| rnrepo | beta、仅新架构；原生 patch 的库要 `denyList`；`DISABLE_RNREPO=1` 关闭 |
| expo-horizon | 先装 `expo-horizon-core`；别自动装 location/notifications；Quest 无 GPS；改配置后 `expo prebuild --clean` |

## 许可

- README 底部标 **`## License MIT`**，`react-native-best-practices` / `fishjam` / `rnrepo` 等多个 `SKILL.md` frontmatter 也写 `license: MIT`。
- 但截至本次核查，**仓库根目录无独立 `LICENSE` 文件**——严格意义上属「文档中声明 MIT、无标准 LICENSE 文件」。引用 / 分发前建议以仓库最新状态自行确认。

## 资源链接

- 仓库：[software-mansion-labs/skills](https://github.com/software-mansion-labs/skills)
- Software Mansion 官网：[swmansion.com](https://swmansion.com/)
- Reanimated：[docs.swmansion.com/react-native-reanimated](https://docs.swmansion.com/react-native-reanimated/)
- Gesture Handler：[docs.swmansion.com/react-native-gesture-handler](https://docs.swmansion.com/react-native-gesture-handler/)
- React Native ExecuTorch：[docs.swmansion.com/react-native-executorch](https://docs.swmansion.com/react-native-executorch/)
- Fishjam：[fishjam.io](https://fishjam.io) ｜ Detour：[detour.swmansion.com/docs](https://detour.swmansion.com/docs)
- 同组邻叶：[Expo Skills](../expo-skills/) · [Callstack React Native Skills](../callstack-react-native-skills/)
