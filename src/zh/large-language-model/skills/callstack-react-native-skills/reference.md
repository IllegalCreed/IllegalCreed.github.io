---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 callstackincubator/agent-skills 官方 skills 的 README 与各 `skills/*/SKILL.md`、`references/` 编写。

## 速查

- **仓库**：`callstackincubator/agent-skills`（MIT，Callstack 官方）
- **装**：`/plugin marketplace add callstackincubator/agent-skills` → `/plugin install react-native-best-practices@callstack-agent-skills`
- **核心技能** `react-native-best-practices`：`js-*`（9）+ `native-*`（10）+ `bundle-*`（9）= 29 篇优化指南，标 Impact
- **每技能结构**：`SKILL.md`（必）+ 可选 `references/` + 可选 `agents/openai.yaml`（Codex UI）
- **工作流**：Measure → Optimize → Re-measure → Validate
- **格式**：遵 agentskills.io；源自《The Ultimate Guide to React Native Optimization》

## 技能清单

| 技能 | 触发/何时用 | 覆盖 |
| --- | --- | --- |
| `react-native-best-practices` | 卡顿/掉帧/启动慢/内存/包体 | JS/Native/Bundling 三大类 29 篇，按 Impact 分级 |
| `assess-react-native-migration` | 原生 App 要不要迁 RN | 只读决策：brownfield/greenfield/checkpoint + ROI，一次一问 |
| `create-react-native-library` | 建库/本地原生模块 | `create-react-native-library`（Builder Bob），Turbo Module/Fabric |
| `github-actions` | CI 云构建移动产物 | iOS 模拟器 `.app.tar.gz` / Android 模拟器 `.apk`，`gh`/REST 下载 |
| `upgrading-react-native` | 升 RN 版本 | 升级工作流：模板、依赖、常见坑 |
| `react-native-brownfield-migration` | 原生 App 里嵌 RN | `@callstack/react-native-brownfield` 分阶段集成 |
| `github` | PR/评审/分支 | GitHub 工作流模式 |

## react-native-best-practices：优先级分级

| 优先级 | 类别 | Impact | 前缀 |
| --- | --- | --- | --- |
| 1 | FPS 与重渲染 | CRITICAL | `js-*` |
| 2 | Bundle 体积 | CRITICAL | `bundle-*` |
| 3 | TTI 优化 | HIGH | `native-*` `bundle-*` |
| 4 | 原生性能 | HIGH | `native-*` |
| 5 | 内存管理 | MEDIUM-HIGH | `js-*` `native-*` |
| 6 | 动画 | MEDIUM | `js-*` |

## JavaScript / React（`js-*`，9 篇）

| 文件 | Impact | 要点 |
| --- | --- | --- |
| `js-lists-flatlist-flashlist` | CRITICAL | ScrollView → FlatList/FlashList/Legend List；FlashList v2 弃用 `estimatedItemSize`；`getItemType` 按类型回收 |
| `js-measure-fps` | HIGH | FPS 监测与测量 |
| `js-atomic-state` | HIGH | Jotai/Zustand 细粒度订阅，selector 减重渲染 |
| `js-concurrent-react` | HIGH | `useDeferredValue`、`useTransition` |
| `js-react-compiler` | HIGH | 自动 memo；`react-compiler-healthcheck`；`"use no memo"` 退出 |
| `js-bottomsheet` | HIGH | Bottom sheet 重渲染优化 |
| `js-uncontrolled-components` | HIGH | 非受控 TextInput 减重渲染 |
| `js-profile-react` | MEDIUM | `agent-device react-devtools` profiling |
| `js-memory-leaks` | MEDIUM | DevTools Memory 抓 JS 泄漏（`useEffect` cleanup） |

## Native iOS/Android（`native-*`，10 篇）

| 文件 | Impact | 要点 |
| --- | --- | --- |
| `native-android-16kb-alignment` | CRITICAL | Android 15+ 上架必须；第三方 `.so` `zipalign -c -P 16` 查 |
| `native-turbo-modules` | HIGH | 后台线程（DispatchQueue/Coroutines），异步优于同步，C++ 走 JSI |
| `native-sdks-over-polyfills` | HIGH | 原生 crypto/导航替 JS polyfill；Intl 按 Hermes 支持精简 |
| `native-measure-tti` | HIGH | `react-native-performance` marker，只测冷启动 |
| `native-threading-model` | HIGH | Turbo Module 线程模型 |
| `native-profiling` | MEDIUM | Xcode Instruments / Android Studio Profiler |
| `native-platform-setup` | MEDIUM | iOS/Android 工具链 |
| `native-view-flattening` | MEDIUM | 视图层级扁平化 |
| `native-memory-patterns` | MEDIUM | C++/Swift/Kotlin 内存 |
| `native-memory-leaks` | MEDIUM | 原生侧内存泄漏 |

## Bundling（`bundle-*`，9 篇）

| 文件 | Impact | 要点 |
| --- | --- | --- |
| `bundle-barrel-exports` | CRITICAL | 避免 barrel 导入，直接路径导入；`eslint-plugin-no-barrel-files` |
| `bundle-analyze-js` | CRITICAL | `source-map-explorer` 可视化 JS 包 |
| `bundle-tree-shaking` | HIGH | Expo SDK 52+ 实验性摇树（ESM/生产）；Platform 摇树 |
| `bundle-analyze-app` | HIGH | Emerge Tools / Ruler 拆解 App 体积 |
| `bundle-r8-android` | HIGH | `minifyEnabled true` 减 20~33% 包体 |
| `bundle-hermes-mmap` | HIGH | RN ≤0.78 关 bundle 压缩启用 Hermes mmap（TTI -16%） |
| `bundle-native-assets` | HIGH | Asset catalog 配置 |
| `bundle-library-size` | MEDIUM | 评估依赖体积 |
| `bundle-code-splitting` | MEDIUM | 远程 chunk 加载安全护栏（可信 HTTPS、绑发布） |

## 问题 → 起手技能

| 问题 | 从这里开始 |
| --- | --- |
| App 卡/掉帧 | `js-measure-fps` → `js-profile-react` |
| 重渲染太多 | `js-profile-react` → `js-react-compiler` |
| 启动慢（TTI） | `native-measure-tti` → `bundle-analyze-js` |
| App 体积大 | `bundle-analyze-app` → `bundle-r8-android` |
| 内存增长 | `js-memory-leaks` 或 `native-memory-leaks` |
| 动画掉帧 | `js-animations-reanimated` |
| 列表滚动卡 | `js-lists-flatlist-flashlist` |
| TextInput 卡 | `js-uncontrolled-components` |
| 原生模块慢 | `native-turbo-modules` → `native-threading-model` |
| 原生库对齐问题 | `native-android-16kb-alignment` |

## 关键版本护栏

| 事项 | 护栏 |
| --- | --- |
| FlashList | v1 用 `estimatedItemSize`；**v2 弃用**（新架构，自动测算），别报缺失 |
| React Compiler | RN 0.76+ / Expo SDK 52+；先跑 `react-compiler-healthcheck` |
| Hermes bundle 压缩 | RN ≤0.78 手动关；**RN 0.79+ 默认非压缩** |
| Android 16KB 对齐 | RN 0.79+ 官方二进制已对齐，**第三方 `.so` 仍要查** |
| tree shaking | 仅生产构建、须 ESM、库声明 `sideEffects` |
| Platform 摇树 | 必须直接 `import { Platform } from 'react-native'` |

## 安装命令

```bash
# Claude Code
/plugin marketplace add callstackincubator/agent-skills
/plugin install react-native-best-practices@callstack-agent-skills

# Codex
$skill-installer install react-native-best-practices from callstackincubator/agent-skills

# Gemini CLI
gemini skills install https://github.com/callstackincubator/agent-skills.git

# 手动克隆（任意 agent 裸读 skills/）
git clone https://github.com/callstackincubator/agent-skills.git
```

## 目录结构

```
agent-skills/
├── .claude-plugin/marketplace.json   # Claude Code 插件定义
├── .agents/plugins/marketplace.json  # Codex 插件定义
├── plugins/                          # 可装 Codex 插件包
└── skills/
    ├── react-native-best-practices/
    │   ├── SKILL.md                  # 主文件 + 速查
    │   └── references/               # js-* / native-* / bundle-* + images/
    ├── assess-react-native-migration/
    ├── create-react-native-library/
    ├── github-actions/
    ├── upgrading-react-native/
    ├── react-native-brownfield-migration/
    └── github/
```

## 许可与出处

- **许可**：MIT
- **出品**：[Callstack](https://www.callstack.com/)（React / React Native 专家团队）
- **来源**：《The Ultimate Guide to React Native Optimization》电子书
- **代码示例仓**：[callstack/optimization-best-practices](https://github.com/callstack/optimization-best-practices)（React Compiler、原生 SDK vs Web polyfill、R8 示例）

## 资源链接

- 仓库：[callstackincubator/agent-skills](https://github.com/callstackincubator/agent-skills)
- 博客：[Announcing React Native Best Practices for AI agents](https://www.callstack.com/blog/announcing-react-native-best-practices-for-ai-agents)
- 电子书：[The Ultimate Guide to React Native Optimization](https://www.callstack.com/ebooks/the-ultimate-guide-to-react-native-optimization)
- 格式规范：[agentskills.io/specification](https://agentskills.io/specification)
- 相关叶：[Vercel Agent Skills](../vercel-agent-skills/)（Web 端 React/Next.js 优化）
