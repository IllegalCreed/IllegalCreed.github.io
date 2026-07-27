---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 react-doctor 官方文档（react.doctor + Mintlify + GitHub README）与 npm 0.9.2 实测编写

## 速查

- **本质**：Million.js 团队出品的 React 代码体检 CLI，0–100 健康分 + 60+ 规则 + AI 辅助修复
- **健康分三档**：75+ Great / 50–74 Needs work / <50 Critical
- **双趟分析**：Lint Analysis（60+ 规则）+ Dead Code Detection（unused files / exports / types / duplicates）
- **五大规则主类**：State & Effects / Performance / Architecture / Security / Accessibility
- **CLI 速跑**：`npx react-doctor@latest`（零配置）；`--verbose` 看位置；`--diff main` / `--scope changed` CI 只扫变更
- **子命令**：`install` / `ci install|config|upgrade` / `rules disable|set|category|ignore-tag` / `why &lt;file:line&gt;`
- **配置**：`doctor.config.ts` + `defineConfig({ ignore, rules, categories, deadCode, adoptExistingLintConfig, projects, surfaces })`
- **优先级**：本地 > 祖先；CLI > 配置；per-rule > categories；tag-ignored 不可被 per-rule 重开
- **License**：Modified MIT（非 standard MIT）；AI 训练 / 商业转售需 founders@million.dev 书面许可
- **当前版本**：npm latest 0.9.2（2026 年，0.x），GitHub 14.1k stars
- **Node 要求**：跟随 Node LTS（建议 ≥ 20）
- 完整说明见 [入门](./getting-started.md) / [核心规则与配置](./guide-line.md)

## 健康分阈值

| 分数区间 | 等级 | 含义 |
| --- | --- | --- |
| **75–100** | Great | 健康，可继续迭代 |
| **50–74** | Needs work | 有问题，应排期整改 |
| **0–49** | Critical | 严重，应优先处理 |

> 评分按 severity 加权（error > warning）。官方榜单上 tldraw / excalidraw 这类高质量项目也只 84 分，**84+ 已属优秀**。

## 规则分类速查

| 类别 | 关注 | 典型规则 |
| --- | --- | --- |
| **State & Effects** | hooks / 依赖数组 / effect 模式 | useEffect 依赖漏项 |
| **Performance** | 重渲染 / memo 缺失 | 子组件无 memo |
| **Architecture** | 组件边界 / 状态层级 | `react-doctor/no-derived-state` |
| **Security** | React 特定安全 | `react-doctor/no-danger` |
| **Accessibility** | jsx-a11y 系列 | `jsx-a11y/no-autofocus` |
| **Bundle Size** | 打包体积 | 动态 import 缺失 |
| **Correctness** | 正确性 | `react-doctor/no-array-index-as-key` |
| **Next.js**（自动开关） | App / Pages Router 专属 | Server Component 误用 |
| **React Native**（自动开关） | RN 专属 | 样式表、平台代码 |

> 框架特定规则**自动探测**：识别 Next.js / Vite / Remix / React Native / Expo + React 版本 + 编译器，据此自动开关——无需手动配插件。

## CLI 命令清单

### 基础扫描

```bash
# 零配置扫当前目录
npx react-doctor@latest
npx -y react-doctor@latest .

# 仅输出数字健康分
npx react-doctor@latest --score

# 输出文件名 + 行号
npx react-doctor@latest --verbose

# 结构化输出
npx react-doctor@latest --json > report.json

# 仅跑指定分类（可重复）
npx react-doctor@latest --category security --category performance
```

### CI / 防回归

```bash
# 与 main 分支对比，只扫变更
npx react-doctor@latest --diff main

# 只扫 uncommitted / 改动文件
npx react-doctor@latest --scope changed

# 只扫 git add 过的文件（pre-commit）
npx react-doctor@latest --staged

# 退出码门禁
npx react-doctor@latest --blocking error   # error 时 exit 非零
npx react-doctor@latest --blocking warning # warning 也阻断
npx react-doctor@latest --blocking none    # 仅报告，不阻断

# CI 非交互
npx react-doctor@latest -y
```

### 其他常用 flag

| flag | 作用 |
| --- | --- |
| `--no-score` | 不输出健康分（只看诊断） |
| `--no-telemetry` | 关闭 Sentry 遥测 |

### 子命令

```bash
# 给 AI agent 装 skill（Claude Code / Cursor / Codex 等）
npx react-doctor@latest install

# GitHub Action 集成
npx react-doctor@latest ci install    # 装 action
npx react-doctor@latest ci config     # 调整 gate / scope / 评论
npx react-doctor@latest ci upgrade    # 升级 action 版本

# 规则管理（写回 doctor.config）
npx react-doctor@latest rules disable <rule>
npx react-doctor@latest rules set <rule> warn|error|off
npx react-doctor@latest rules category <Cat> <sev>
npx react-doctor@latest rules ignore-tag <tag>

# 调试 suppression 是否生效
npx react-doctor@latest why <file:line>
```

## 配置 schema

`doctor.config.ts` 完整定义：

```ts
import { defineConfig } from "react-doctor";

export default defineConfig({
  ignore: {
    rules: [],        // 关闭的规则（仅丢结果，规则仍跑）
    files: [],        // 忽略的文件 glob
    tags: [],         // 按标签批量关闭（lint 前禁用）
    overrides: [],    // 文件级覆盖
  },
  rules: {
    "react-doctor/no-danger": "error",
    "react-doctor/no-array-index-as-key": "warn",
  },
  categories: {
    performance: "warn",
    accessibility: "error",
  },
  deadCode: { enabled: true },
  adoptExistingLintConfig: true,  // 默认 true
  projects: ["packages/*"],       // monorepo 按 workspace 打分
  surfaces: [],
});
```

**支持文件格式**：`.ts` / `.mts` / `.cts` / `.js` / `.mjs` / `.cjs` / `.json` / `.jsonc`，或 `package.json` 的 `reactDoctor` 键。

**优先级**：

1. CLI flag（最高）
2. 本地配置
3. 祖先目录配置
4. 默认值（最低）

> per-rule `rules` 优先于 `categories`；tag-ignored 规则在 lint 前禁用，**不可被 per-rule 重开**。

## 抑制规则三层

| 层级 | 写法 | 优先级 |
| --- | --- | --- |
| **inline** | `// react-doctor-disable-next-line &lt;rule&gt;`（多规则逗号分隔） | 最高 |
| **文件级** | `ignore.overrides` | 中 |
| **全局** | `ignore.rules` / `ignore.files` / `ignore.tags` | 最低 |

> `ignore.rules` 关规则后规则仍跑、只是结果被丢弃——浪费 CPU 还会掩盖问题。正确姿势是 `rules: { '&lt;rule&gt;': 'off' }` 或按 `tags` 关。

## GitHub Action 配置

```yaml
name: react-doctor
on: [pull_request]
jobs:
  react-doctor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: millionco/react-doctor@main
        with:
          diff: main
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

**PR 行为**：自动评论健康分 + 新增诊断；输出 `score` 可作门禁。

**CI 平台支持矩阵**：

| 平台 | 支持程度 |
| --- | --- |
| **GitHub Actions** | 一等公民（PR 评论 + 门禁） |
| GitLab CI | gate-only scaffold |
| CircleCI / Jenkins / Buildkite | scaffold |

## Programmatic API

```ts
import { diagnose } from "react-doctor/api";

const result = await diagnose({
  root: process.cwd(),
});

result.score;        // 0-100
result.diagnostics;  // [{ file, plugin, rule, severity, message, help, line, column }]
result.project;      // 项目元信息
```

## 版本与运行环境

| 项 | 取值 |
| --- | --- |
| npm latest | **0.9.2**（2026 年，0.x 阶段） |
| beta 通道 | 0.2.0-beta.6 |
| dev 通道 | 0.9.2-dev.b31fd85 |
| GitHub stars | 14.1k |
| Node 要求 | 跟随 LTS（建议 ≥ 20） |
| 扫描范围 | React / React Native 项目（JS / TS 源 + `.html` 内联 `&lt;script&gt;`） |
| Telemetry | 默认上报 Sentry（环境 / 调用上下文 / 项目形态 / 规则触发计数，**不含源码与具体发现**），可 `--no-telemetry` 关 |
| 已知 issue | 300s lint 分析超时被跳过；部分规则对 AI 生成代码偏严，可能产生噪声 |

## License 关键说明

**LICENSE 文件实为「Modified MIT」**，非标准 MIT：

| 用途 | 是否允许 |
| --- | --- |
| 个人 / 团队开发使用 | 允许 |
| 内部项目接入 CI | 允许 |
| **AI 训练 / 微调 / 评估数据** | **须 founders@million.dev 书面许可** |
| **付费托管 / 管理 SaaS 转售** | **须 founders@million.dev 书面许可** |

> npm `package.json` 的 `license` 字段写 `SEE LICENSE IN LICENSE`——必须打开 LICENSE 文件细看，别按 standard MIT 处理。

## 与同类工具对比

| 维度 | react-doctor | ESLint | Knip |
| --- | --- | --- | --- |
| **定位** | React 代码体检 | 通用 JS / TS linter | 死代码检测 |
| **健康分** | ✅ 0–100 | ❌ | ❌ |
| **React 反模式** | ✅ 60+ 规则 | 需 eslint-plugin-react 等插件 | ❌ |
| **死代码** | ✅（partial / staged 跳过） | ❌ | ✅（专精） |
| **供应链安全** | ✅ Socket.dev 集成 | ❌ | ❌ |
| **AI agent skill** | ✅ Claude Code / Cursor 等 | ❌ | ❌ |
| **框架自动探测** | ✅ Next.js / RN 自动开关 | 需手动配插件 | - |
| **0–100 趋势追踪** | ✅ | ❌ | ❌ |
| **License** | Modified MIT | MIT | ISC |

> 三者**互补**：ESLint 管通用 lint、Knip 管重度死代码、react-doctor 管 React 反模式 + 健康分 + AI agent 集成。

## 官方资源

- 官网：[https://www.react.doctor/](https://www.react.doctor/)
- Mintlify 文档：[https://millionco-react-doctor-36.mintlify.app/introduction](https://millionco-react-doctor-36.mintlify.app/introduction)
- GitHub：[https://github.com/millionco/react-doctor](https://github.com/millionco/react-doctor)
- npm：[https://www.npmjs.com/package/react-doctor](https://www.npmjs.com/package/react-doctor)
- dev.to 介绍：[https://dev.to/arshtechpro/react-doctor-is-this-the-missing-health-check-for-your-react-codebase-5015](https://dev.to/arshtechpro/react-doctor-is-this-the-missing-health-check-for-your-react-codebase-5015)
- GitHub Action：[millionco/react-doctor@main](https://github.com/millionco/react-doctor)
