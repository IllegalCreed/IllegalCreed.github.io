---
layout: doc
---

# react-doctor

react-doctor 是 Million.js 团队（Million Software, Inc.）出品的 **React 代码体检 CLI**，官方 tagline 是「Your agent writes bad React. This catches it.」——直击当下 AI coding agent（Claude Code / Cursor / Codex 等）批量生成 React 代码后留下的反模式。它对项目跑一次「双趟分析」：第一趟 **Lint Analysis** 跑 60+ 条 React 专属规则（State & Effects / Performance / Architecture / Security / Accessibility / Bundle Size / Correctness / 框架特定），第二趟 **Dead Code Detection** 找未引用文件、未使用导出、未使用类型与重复代码，最后按 severity 加权聚合成一个 **0–100 健康分**（75+ Great / 50–74 Needs work / <50 Critical）。它与 ESLint 是**互补而非替代**关系——通用 JS/TS 代码风格仍归 ESLint，react-doctor 补的是 React 特定反模式 + 死代码 + 0–100 评分 + 供应链安全（Socket.dev 集成）+ 给 AI agent 装 skill 教它预防坏代码。当前 npm latest = 0.9.2（2026 年，仍处 0.x，未到 1.0 稳定），License 为 **Modified MIT**（非标准 MIT）——AI 训练 / 微调 / 评估数据用途与付费托管转售须先获 founders@million.dev 书面许可。

## 评价

**优点**

- **AI 时代的精准定位**：直接捕获 AI agent 反复生成的同类 React 反模式（数组下标当 key、滥用 `dangerouslySetInnerHTML`、useEffect 依赖漏项、a11y autofocus 等），用工具堵住 agent 写出的坏代码
- **0–100 健康分一把尺**：把代码质量从「主观判断」变成「可度量指标」，可在迭代中追踪趋势，把工程指标接入 dashboard
- **双趟分析互补**：Lint 抓反模式 + Dead Code 抓僵尸代码，一次跑出两类问题清单
- **框架自动探测**：识别 Next.js / Vite / Remix / React Native / Expo + React 版本 + 编译器，据此自动开关对应规则集，无需手动配插件
- **AI agent 深度集成**：`install` 子命令给 Claude Code / Cursor / Codex / Windsurf / Copilot / Zed / Cline / Goose 装 skill，形成「扫描 → 修复 → 复扫提分」闭环
- **与 ESLint 共存**：`adoptExistingLintConfig` 默认 true 自动采纳 JSON ESLint / oxlint 配置，可作 ESLint 或 oxlint 插件运行
- **CI 一等公民**：官方 GitHub Action（`millionco/react-doctor@main`）做 PR 评论 + score 门禁

**缺点**

- **License 陷阱**：Modified MIT 非 standard MIT——AI 训练 / 商业转售需书面许可，企业引入前需法务过一遍
- **0.x 阶段，规则变动频**：beta / dev / latest 三通道并存，部分规则对 AI 生成代码偏严，可能产生噪声
- **不是通用 linter**：只懂 React，JS / TS 代码风格、格式化仍要 ESLint + Prettier
- **deadCode 在 partial / staged 扫描时跳过**：重度死代码治理仍以 Knip 为准
- **CI 平台覆盖不全**：GitHub Actions 是一等公民；GitLab / CircleCI / Jenkins / Buildkite 仅 scaffold，GitLab 更只有 gate-only
- **已知 lint 分析超时**：300s 超时会被跳过（issue 已记录），大型 monorepo 可能踩到

## 文档地址

- [react-doctor 官网](https://www.react.doctor/)
- [Mintlify 官方文档](https://millionco-react-doctor-36.mintlify.app/introduction)
- [npm 包页面](https://www.npmjs.com/package/react-doctor)
- [dev.to 介绍文](https://dev.to/arshtechpro/react-doctor-is-this-the-missing-health-check-for-your-react-codebase-5015)

## GitHub地址

[millionco/react-doctor](https://github.com/millionco/react-doctor)

## 幻灯片地址

<a href="/SlideStack/react-doctor-slide/" target="_blank">react-doctor</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">react-doctor 测试题</a>
