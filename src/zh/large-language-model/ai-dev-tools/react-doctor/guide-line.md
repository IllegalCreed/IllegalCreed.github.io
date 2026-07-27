---
layout: doc
outline: [2, 3]
---

# 核心规则与配置

> 基于 react-doctor 官方文档（react.doctor + Mintlify）与 GitHub README 编写，对照 npm 0.9.2 行为

## 速查

- **五大规则主类**：State & Effects（hooks / 依赖数组 / effect 模式）/ Performance（重渲染 / memo 缺失）/ Architecture / Security（如 `no-danger`）/ Accessibility（如 `jsx-a11y/no-autofocus`）
- **附加类**：Bundle Size / Correctness（如 `no-array-index-as-key`、`no-derived-state`）/ 框架特定（Next.js / React Native 自动开关）
- **规则名前缀**：`react-doctor/&lt;rule&gt;` 与 `jsx-a11y/&lt;rule&gt;`
- **CLI flag 全清单**：`--verbose` / `--diff &lt;branch&gt;` / `--scope changed` / `--score` / `--json` / `--category &lt;cat&gt;`（可重复）/ `--staged` / `--blocking &lt;error|warning|none&gt;` / `-y` / `--no-score` / `--no-telemetry`
- **配置文件**：`doctor.config.ts` 用 `defineConfig({ ignore, rules, categories, deadCode, adoptExistingLintConfig, projects, surfaces })`；支持 `.ts/.mts/.cts/.js/.mjs/.cjs/.json/.jsonc` 或 `package.json` 的 `reactDoctor` 键
- **优先级**：本地 > 祖先；CLI flag 覆盖配置；per-rule `rules` > `categories`；tag-ignored 规则 lint 前禁用、不可被 per-rule 重开
- **抑制层级**：inline `// react-doctor-disable-next-line &lt;rule&gt;`（多规则逗号分隔）> 文件 `ignore.overrides` > 全局 `ignore.rules/files/tags`
- **GitHub Action**：`millionco/react-doctor@main`，`with: diff: main + github-token`，PR 评论 + score 门禁
- **AI agent skill**：`install` 子命令装给 Claude Code / Cursor / Codex / Windsurf / Copilot / Zed / Cline / Goose
- **反模式**：当 ESLint 替代品 / 全局 ignore 关规则以为省事 / 把 100 当 KPI / PR 直接开 blocking error 全量门禁

## 五大规则主类

### State & Effects（状态与副作用）

最常见的 React 反模式聚集地——hooks 用法、useEffect 依赖数组、effect 模式。典型场景：

- useEffect 依赖数组**漏项**或错误依赖
- 在 effect 里直接修改 state 而非用函数式更新
- 缺少 cleanup 导致内存泄漏

### Performance（性能）

抓**重渲染**与 **memo 缺失**：

- 子组件无 `memo` 而被父组件重渲染连带
- 内联对象 / 函数作为 props 触发不必要重渲染
- `useMemo` / `useCallback` 该用而没用

### Architecture（架构）

组件边界、状态层级、模块组织：

- 派生 state（`no-derived-state`）
- props 钻取过深
- 组件职责过载

### Security（安全）

React 特定安全反模式：

- `react-doctor/no-danger`：滥用 `dangerouslySetInnerHTML`
- XSS 风险点

### Accessibility（可访问性）

jsx-a11y 系列：

- `jsx-a11y/no-autofocus`：禁止 autofocus
- alt 文本、ARIA、tabindex、label 关联

> Accessibility 类规则与 ESLint 的 eslint-plugin-jsx-a11y 同源，规则名共享 `jsx-a11y/` 前缀。

## 附加规则类

| 类别 | 关注 | 典型规则 |
| --- | --- | --- |
| **Bundle Size** | 打包体积 | 动态 import 缺失、巨型依赖 |
| **Correctness** | 正确性 | `react-doctor/no-array-index-as-key`、`react-doctor/no-derived-state` |
| **Next.js**（自动开关） | App Router / Pages Router 专属 | Server Component 误用、metadata 缺失 |
| **React Native**（自动开关） | RN 专属 | 样式表、平台特定代码 |

> 框架特定规则**只在对应项目激活**——react-doctor 自动识别 Next.js / Vite / Remix / React Native / Expo + React 版本 + 编译器配置，无需手动配插件。

## CLI flag 全清单

| flag | 作用 | 典型场景 |
| --- | --- | --- |
| `--verbose` | 输出文件名 + 行号 | 本地定位修问题（默认汇总不含位置） |
| `--diff &lt;branch&gt;` | 与指定分支对比，只扫变更 | CI / PR 防回归（避免历史债淹没） |
| `--scope changed` | 只扫 uncommitted / 改动文件 | pre-commit 阶段 |
| `--staged` | 只扫 `git add` 过的文件 | pre-commit hook |
| `--score` | 仅输出数字健康分 | dashboard / 趋势追踪 |
| `--json` | 结构化 JSON 输出 | 接入自有工具 / pipeline |
| `--category &lt;cat&gt;` | 仅跑指定分类（可重复） | 专项治理（如只跑 security） |
| `--blocking &lt;error\|warning\|none&gt;` | 退出码门禁级别 | CI 强制阻断 |
| `-y` | 非交互模式 | CI 自动化 |
| `--no-score` | 不输出健康分 | 只看诊断细节 |
| `--no-telemetry` | 关闭 Sentry 遥测 | 敏感项目 / 合规要求 |

> Telemetry 默认上报 Sentry（环境 / 调用上下文 / 项目形态 / 规则触发计数，**不含源码与具体发现**），可用 `--no-telemetry` 关闭。

## 配置文件

支持 `doctor.config.ts/.mts/.cts/.js/.mjs/.cjs/.json/.jsonc`，或写在 `package.json` 的 `reactDoctor` 键下。

**`defineConfig` 完整 schema**：

```ts
// doctor.config.ts
import { defineConfig } from "react-doctor";

export default defineConfig({
  // 全局抑制（最低优先级）
  ignore: {
    rules: [],        // 关闭的规则（仅丢结果，规则仍跑——浪费 CPU）
    files: [],        // 忽略的文件 glob
    tags: [],         // 按标签批量关闭（lint 前禁用，更高效）
    overrides: [],    // 文件级覆盖
  },
  // per-rule severity（优先于 categories）
  rules: {
    "react-doctor/no-danger": "error",
    "react-doctor/no-array-index-as-key": "warn",
  },
  // 整类 severity（被 per-rule 覆盖）
  categories: {
    performance: "warn",
    accessibility: "error",
  },
  // 死代码检测配置
  deadCode: {
    enabled: true,
  },
  // 默认 true：自动采纳 JSON ESLint / oxlint 配置
  adoptExistingLintConfig: true,
  // monorepo 按 workspace 分别打分
  projects: ["packages/*"],
  // 限定扫描范围
  surfaces: [],
});
```

> **优先级**：本地配置 > 祖先目录配置；CLI flag > 配置文件；per-rule `rules` > `categories`；tag-ignored 规则在 lint 前禁用，**不可被 per-rule 重开**。

## 抑制规则的三层优先级

| 层级 | 写法 | 适用 |
| --- | --- | --- |
| **inline**（最高） | `// react-doctor-disable-next-line &lt;rule&gt;`（多规则逗号分隔） | 单行豁免 |
| **文件级** | `ignore.overrides` 中的文件匹配 | 单文件批量豁免 |
| **全局**（最低） | `ignore.rules` / `ignore.files` / `ignore.tags` | 整类豁免 |

**关键陷阱**：

- `ignore.rules` 关规则后**规则其实仍在跑、只是结果被丢弃**——浪费 CPU 还会掩盖问题。正确姿势是 `rules: { '&lt;rule&gt;': 'off' }` 或按 `tags` 关（lint 前禁用更高效）
- inline suppression 必须写明**为何此处豁免**，配合 `why &lt;file:line&gt;` 调试是否生效

## GitHub Action 集成

`.github/workflows/react-doctor.yml` 最小配置：

```yaml
name: react-doctor
on: [pull_request]
jobs:
  react-doctor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # diff 需要完整历史
      - uses: millionco/react-doctor@main
        with:
          diff: main            # 只扫与 main 的差异
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

**PR 行为**：

- 自动在 PR 评论健康分 + 新增诊断
- 输出 `score` 可作门禁（结合 `--blocking` 控制 exit code）

> GitLab CI 仅 gate-only scaffold；CircleCI / Jenkins / Buildkite 同样仅 scaffold——**GitHub Actions 是唯一一等公民**。

## AI agent skill 集成

`install` 子命令为各 AI coding agent 装上 47+ React 最佳实践规则：

```bash
# 交互式选择 agent
npx react-doctor@latest install

# 装 skill 后，agent 写代码时会主动避免反模式
# per-rule prompts 提供 validation + fix 指引
```

**支持的 agent**：Claude Code / Cursor / Codex / Windsurf / Copilot / OpenCode / Zed / Cline / Goose 等。

**标准闭环工作流**：

1. **扫描**：`npx react-doctor@latest --verbose` 拿到诊断
2. **优先修 error**：按 severity 排序处理
3. **复扫验证提分**：跑 `--score` 确认健康分提升

> 让 agent 装 skill 形成「扫描 → 修复 → 复扫提分」闭环——治本之道是教 agent 学会预防，而非反复生成同类错误。

## Programmatic API

`react-doctor/api` 暴露 `diagnose` 函数，可嵌入自有工具：

```ts
import { diagnose } from "react-doctor/api";

const result = await diagnose({
  root: process.cwd(),
  // 其他配置
});

// 返回结构
result.score;        // 0-100 健康分
result.diagnostics;  // [{ file, plugin, rule, severity, message, help, line, column }]
result.project;      // 项目元信息
```

> 用 `--json` 也能拿结构化结果，但 `diagnose` API 更适合**长期嵌入**自有 dashboard / IDE 插件 / 周边工具。

## 反模式（避坑）

- **把 react-doctor 当 ESLint 替代品**：它只懂 React，不做通用 JS 代码风格 / 格式化 lint；正确姿势是并存（`adoptExistingLintConfig` 让它继承你的 ESLint / oxlint 配置）
- **用全局 `ignore.rules` 关规则以为省事**：规则其实仍在跑、只是结果被丢弃，浪费 CPU 还会掩盖问题；正确是 `rules: { '&lt;rule&gt;': 'off' }` 或按 `tags` 关
- **不了解 `adoptExistingLintConfig` 默认 true** 的情况下既保留完整 ESLint 配置又不调整，导致两套规则重复报告同类问题、PR 噪声爆炸
- **把 0–100 健康分当成必须冲到 100 的 KPI**：评分按 severity 模糊加权，连顶级开源项目也只 80+，强行追求满分会逼出奇怪的 suppression 而非真改进
- **PR 直接开 `--blocking error` 全量门禁而不先用 `--diff` 限定范围**：会因历史既有问题把所有 PR 一次性全部卡红，团队必然弃用
- **写出 react-doctor 专门捕获的反模式**：用数组下标当 key（`no-array-index-as-key`）、滥用 `dangerouslySetInnerHTML`（`no-danger`）、useEffect 依赖数组漏项、a11y 的 autofocus（`jsx-a11y/no-autofocus`）、派生 state（`no-derived-state`）
- **inline suppression 当万能橡皮擦到处贴而不写明原因**：应配合 `why &lt;file:line&gt;` 定位 + 最窄作用域 + 注释说明为何豁免
- **用 react-doctor 的死代码分析完全替代 Knip**：react-doctor 的 `deadCode` 在 partial / staged 扫描时会跳过，定位是体检辅能力；重度死代码治理仍以 Knip 为准
- **忽视 License 限制**直接拿 react-doctor 喂自家 AI 训练管线或包装成付费 SaaS 转售：Modified MIT 明确禁止这两类用途，需先获 founders@million.dev 书面许可

## 下一步

- [参考](./reference.md)：规则速查表、CLI 命令清单、配置 schema、版本与 License、官方资源
