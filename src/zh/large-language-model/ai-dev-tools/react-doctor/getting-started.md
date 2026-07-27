---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 react-doctor 官方文档（react.doctor + Mintlify）与 npm 0.9.2 实测编写，对照 2026 年 0.x 行为

## 速查

- **本质**：Million.js 团队出品的 React 代码体检 CLI，**0–100 健康分** + 60+ 规则 + AI 辅助修复，定位是「捕获 AI agent 写出的坏 React」
- **健康分三档**：**75+ Great / 50–74 Needs work / <50 Critical**；按 severity 加权（error > warning）
- **双趟分析**：① Lint Analysis 跑 60+ 规则 ② Dead Code Detection 找 unused files / exports / types / duplicates（partial / staged 扫描时跳过）
- **规则五大主类**：State & Effects / Performance / Architecture / Security / Accessibility；外加 Bundle Size / Correctness / 框架特定（Next.js / React Native 自动开关）
- **零配置速跑**：`npx react-doctor@latest` 或 `npx -y react-doctor@latest .`（框架 / React 版本 / 编译器自动探测后开关规则集）
- **必会 flag**：`--verbose`（文件 + 行号）/ `--diff main` / `--scope changed`（CI 只扫变更）/ `--score`（仅输出数字分）/ `--json`（结构化）/ `--staged`（pre-commit）/ `--blocking error`（退出码门禁）/ `-y`（CI 非交互）/ `--no-telemetry`
- **子命令**：`install`（给 AI agent 装 skill）/ `ci install|config|upgrade` / `rules disable|set|category|ignore-tag` / `why <code v-pre>&lt;file:line&gt;</code>`
- **配置文件**：`doctor.config.ts` 用 `defineConfig({ ignore, rules, categories, deadCode, adoptExistingLintConfig, projects, surfaces })`；支持 `.ts/.mts/.cts/.js/.mjs/.cjs/.json/.jsonc` 或 `package.json` 的 `reactDoctor` 键
- **优先级**：本地配置 > 祖先配置；CLI flag 覆盖配置文件；per-rule `rules` 优先于 `categories`；tag-ignored 规则 lint 前禁用、不可被 per-rule 重开
- **抑制层级**：inline <code v-pre>`// react-doctor-disable-next-line &lt;rule&gt;`</code> > 文件 `ignore.overrides` > 全局 `ignore.rules/files/tags`
- **License**：Modified MIT（非 standard MIT），AI 训练 / 商业转售需 founders@million.dev 书面许可
- **当前版本**：npm latest 0.9.2（2026 年，0.x 阶段），GitHub 14.1k stars

## react-doctor 是什么

react-doctor 是 Million.js 团队（Million Software, Inc.）出品的 **React 代码体检 CLI**，对项目跑「Lint Analysis + Dead Code Detection」两趟分析，按 severity 加权聚合成 **0–100 健康分**，并给出可执行的修复建议。它的核心定位有三：

- **AI 时代而生**：官方 tagline「Your agent writes bad React. This catches it.」——专治 AI coding agent 写出的 React 反模式
- **React 专属**：只扫 React / React Native 项目（JS / TS 源文件 + `.html` 内联 <code v-pre>&lt;script&gt;</code>），不是通用 linter
- **ESLint 的补充**：通用 JS / TS lint、代码风格仍归 ESLint；react-doctor 补的是 React 特定反模式 + 死代码 + 0–100 评分 + 供应链 + AI agent 集成

> react-doctor ≠ ESLint 替代品。并存才是正确姿势——`adoptExistingLintConfig` 默认 true 让它继承你的 ESLint / oxlint 配置。

## 健康分机制

**0–100 健康分**由两趟分析汇总得出：

| 分数区间 | 等级 | 含义 |
| --- | --- | --- |
| **75–100** | Great | 健康，可继续迭代 |
| **50–74** | Needs work | 有问题，应排期整改 |
| **0–49** | Critical | 严重，应优先处理 |

**评分流程**：双趟分析 → 按 `ignore` / `rules` / `categories` 配置过滤 → 按 severity 加权（error 权重大于 warning）→ 输出 0–100 数字分。

> 评分本就偏严——官方榜单上 tldraw / excalidraw 这类高质量项目也只 84 分，**84+ 已属优秀**，别把 100 当目标。

## 双趟分析

| 趟次 | 名称 | 做什么 |
| --- | --- | --- |
| 第一趟 | **Lint Analysis** | 跑 60+ 条 React 专属规则（覆盖五大主类 + 框架特定） |
| 第二趟 | **Dead Code Detection** | 找 unused files / unused exports / unused types / duplicates |

> 注意：**partial / staged 扫描时跳过 dead code 趟**——`--diff` / `--scope changed` / `--staged` 都属于 partial。重度死代码治理仍以 Knip 为准。

## CLI 速跑

```bash
# 零配置扫当前目录（自动探测框架 / React 版本 / 编译器）
npx react-doctor@latest

# 等价写法（CI 用 -y 跳过交互确认）
npx -y react-doctor@latest .

# 仅输出数字健康分（接入 dashboard / 趋势追踪）
npx react-doctor@latest --score

# 输出文件名 + 行号（默认汇总不含位置，无法定位）
npx react-doctor@latest --verbose

# 结构化输出（接入自有工具）
npx react-doctor@latest --json > report.json

# CI 中只扫引入的变更（避免被历史债淹没）
npx react-doctor@latest --diff main
npx react-doctor@latest --scope changed
```

> 默认汇总报告**不含文件名与行号**——本地主动修问题必须加 `--verbose`。

## 子命令一览

| 子命令 | 作用 |
| --- | --- |
| `install` | 给 Claude Code / Cursor / Codex / Windsurf / Copilot / OpenCode / Zed / Cline / Goose 等 AI agent 装 skill（教 47+ React 最佳实践，预防而非只检测） |
| `ci install` | 一键装 GitHub Action（PR 扫描） |
| `ci config` | 调整 gate / scope / 评论行为 |
| `ci upgrade` | 升级 action 版本 |
| `rules disable &lt;rule&gt;` | 关闭某规则（写回 `doctor.config`） |
| `rules set &lt;rule&gt; warn|error|off` | 调整某规则 severity |
| `rules category &lt;Cat&gt; &lt;sev&gt;` | 整类规则调 severity |
| `rules ignore-tag &lt;tag&gt;` | 按 tag 关规则（lint 前禁用） |
| `why &lt;file:line&gt;` | 调试某条 inline / file suppression 为何没生效 |

> GitLab CI 仅提供 gate-only scaffold；CircleCI / Jenkins / Buildkite 同样仅 scaffold，**GitHub Actions 是唯一一等公民**。

## 与 ESLint / Knip 的关系

- **ESLint 互补**：通用 JS / TS lint、代码风格仍归 ESLint；react-doctor 补 React 特定反模式 + 0–100 评分 + 死代码 + 供应链 + AI agent skill
- **adoptExistingLintConfig 默认 true**：自动采纳 JSON ESLint / oxlint 配置，可作 ESLint 插件或 oxlint-shaped 插件运行，与现有 lint pipeline 共存
- **Knip 重叠但定位不同**：react-doctor 的 `deadCode` 在 partial / staged 扫描时跳过，定位是体检辅能力；重度死代码治理仍以 Knip 为准

## AI 辅助修复

react-doctor 不止检测，还能教 AI agent **预防**：

- **skill 安装**：`install` 子命令为各 AI agent 装上 47+ React 最佳实践规则，per-rule prompts 提供 validation + fix 指引
- **Ami agent + `--fix`**：实验性自动修复代理，按诊断逐条修并提分
- **标准工作流**：扫描 → 优先修 error → 复扫验证提分

> 让 AI agent 装 skill 形成「扫描 → 修复 → 复扫提分」闭环——治本之道是教 agent 学会预防，而非反复生成同类错误。

## 下一步

- [核心规则与配置](./guide-line.md)：五大规则主类详解、CLI flag 全清单、配置文件 / 抑制层级、AI agent skill 与 CI 集成、反模式与避坑
- [参考](./reference.md)：规则速查表、CLI 命令清单、配置 schema、官方资源
