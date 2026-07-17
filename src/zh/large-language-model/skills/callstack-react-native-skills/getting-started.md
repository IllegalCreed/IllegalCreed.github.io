---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 callstackincubator/agent-skills 官方 skills 主分支（2026-07）的 README、`docs/ai-assistant-integration.md` 与各 `skills/*/SKILL.md` 编写。

## 速查

- **是什么**：Callstack 官方的 React Native Agent Skills 集（`callstackincubator/agent-skills`，MIT），核心是性能优化，源自《The Ultimate Guide to React Native Optimization》
- **装（Claude Code）**：先 `/plugin marketplace add callstackincubator/agent-skills`，再 `/plugin install react-native-best-practices@callstack-agent-skills`
- **多 agent**：Codex `$skill-installer install <skill> from callstackincubator/agent-skills`；Cursor/Gemini/OpenCode 克隆 `skills/` 目录；裸读 `skills/react-native-best-practices/SKILL.md` 也行
- **核心技能**：`react-native-best-practices`——JS/React（`js-*`）+ Native（`native-*`）+ Bundling（`bundle-*`）三大类，共 29 篇细分指南
- **其它技能**：`assess-react-native-migration`（迁移评估）·`create-react-native-library`（建库）·`github-actions`（CI 产物）·`upgrading-react-native`·`react-native-brownfield-migration`·`github`
- **工作流**：测量 → 优化 → 再测量 → 验证（Measure → Optimize → Re-measure → Validate）
- **分级**：CRITICAL（FlashList、bundle、16KB 对齐）> HIGH（TTI、原生性能）> MEDIUM（内存、动画）

## Callstack 是谁，这套技能什么来头

Callstack 是一支 React 与 React Native 专家团队，是 React Native 生态的核心贡献机构（FlashList 背后的 Shopify 合作方、Re.Pack、React Native Builder Bob 等工具的推动者之一）。这套 Agent Skills 把它多年的性能优化经验——尤其是免费电子书《The Ultimate Guide to React Native Optimization》——沉淀成可被 AI 编码 agent 按需调用的技能。它遵循 [agentskills.io](https://agentskills.io/specification) 开放格式，因此跨 agent 可移植。

与 Web 端的 [Vercel Agent Skills](../vercel-agent-skills/) 互补：Vercel 那套偏 React/Next.js 的 Web 优化，Callstack 这套专注 React Native 原生侧（Hermes、Turbo Modules、R8、TTI、包体）。README 里也明确建议两者搭配用。

## 安装

### Claude Code（推荐）

```bash
# 1. 添加 marketplace
/plugin marketplace add callstackincubator/agent-skills

# 2. 安装你要的技能
/plugin install react-native-best-practices@callstack-agent-skills
```

其它可装技能：

```bash
/plugin install assess-react-native-migration@callstack-agent-skills
/plugin install create-react-native-library@callstack-agent-skills
/plugin install github-actions@callstack-agent-skills
/plugin install upgrading-react-native@callstack-agent-skills
```

也可用交互菜单 `/plugin menu`。本地开发：`claude --plugin-dir ./path/to/agent-skills`。装完后 Claude 会根据任务自动加载相关技能。

### 其它 agent

| Agent | 安装方式 |
| --- | --- |
| **Codex** | `$skill-installer install react-native-best-practices from callstackincubator/agent-skills`；或用捆绑的 `.agents/plugins/marketplace.json` |
| **Cursor** | Settings → Rules → Import rules from GitHub，填仓库 URL（仅发现 `.mdc` 文件）；或克隆 `skills/` 到 `.cursor/skills/` |
| **Gemini CLI** | `gemini skills install https://github.com/callstackincubator/agent-skills.git` |
| **OpenCode** | 克隆后 `cp -r agent-skills/skills/* .opencode/skill/`（也识别 `.claude/skills/`） |
| **任意 agent** | 直接指路：`Read skills/react-native-best-practices/SKILL.md for React Native performance guidelines` |

## skills 总览

| 技能 | 何时用 | 一句话 |
| --- | --- | --- |
| `react-native-best-practices` | 卡顿/掉帧/启动慢/内存/包体 | 核心：29 篇 JS/Native/Bundling 优化指南，按影响力分级 |
| `assess-react-native-migration` | 原生 App 要不要迁 RN | 只读的证据驱动决策：brownfield/greenfield/checkpoint + ROI |
| `create-react-native-library` | 建库/本地原生模块 | 用 `create-react-native-library` 脚手架（Builder Bob） |
| `github-actions` | CI 云构建移动产物 | iOS 模拟器 `.app.tar.gz` / Android 模拟器 `.apk`，`gh` 可下载 |
| `upgrading-react-native` | 升 RN 版本 | 升级工作流：模板、依赖、常见坑 |
| `react-native-brownfield-migration` | 原生 App 里嵌 RN | `@callstack/react-native-brownfield` 分阶段集成 |
| `github` | PR/评审/分支 | GitHub 工作流模式 |

## 核心定位：React Native 性能优化

`react-native-best-practices` 是这套技能的重心。它的核心理念是**先测量再优化**，并把优化项按影响力（Impact）分级：

| 优先级 | 类别 | 影响 | 前缀 |
| --- | --- | --- | --- |
| 1 | FPS 与重渲染 | CRITICAL | `js-*` |
| 2 | Bundle 体积 | CRITICAL | `bundle-*` |
| 3 | TTI 优化 | HIGH | `native-*` `bundle-*` |
| 4 | 原生性能 | HIGH | `native-*` |
| 5 | 内存管理 | MEDIUM-HIGH | `js-*` `native-*` |
| 6 | 动画 | MEDIUM | `js-*` |

技能强调「Impact 标签只是分诊提示：CRITICAL 先做，HIGH 次之，MEDIUM 在证据指向时再做」，且明确禁止在没有度量到渲染/FPS 问题时就推荐 memoization、原子状态或编译器改造。

## 优化工作流：测量 → 优化 → 再测量 → 验证

任何性能问题都走这个循环：

1. **测量**：改动前先抓基线。运行时问题优先看提交时间线、重渲染次数、慢组件、最重提交拆解、启动/TTI
2. **优化**：从对应 reference 应用针对性修复
3. **再测量**：跑同一测量拿新指标
4. **验证**：确认改善（如 FPS 45→60、TTI 3.2s→1.8s、bundle 2.1MB→1.6MB）

若指标没改善，回滚并试下一个修复。这个「有证据才动手」的纪律，是这套技能区别于泛泛「最佳实践清单」的关键。

## 下一步

- [指南](./guide-line) —— 三大类逐类讲（JS/Native/Bundling）、迁移评估、建库、github-actions、反模式
- [参考](./reference) —— 29 篇优化要点全表、安装命令、许可、链接
