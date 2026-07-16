---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 angular/skills（v1.0，2026-07-16）的 `angular-developer/SKILL.md` 与 README 编写。

## 速查

- **装**：`npx skills add https://github.com/angular/skills`（Claude Code / Cursor / Windsurf / Gemini CLI / Antigravity 等）
- **两技能**：`angular-developer`（生成代码 + 架构指导）· `angular-new-app`（用 CLI 建新项目）
- **三条核心规则**：①先分析项目 Angular 版本 ②用 Angular CLI 脚手架 ③生成后必 `ng build` 验证
- **依赖图**：精简 SKILL.md 指向 30+ `references/`，按任务渐进披露加载
- **现代 Angular**：Signals（signal/computed/linkedSignal/resource/effect）、Signal Forms（v21+ 优先）、DI、routing、SSR、a11y、Tailwind、testing
- **官方**：Copyright 2026 Google LLC，MIT，源在 angular/angular

## 安装

```bash
npx skills add https://github.com/angular/skills
```

Agent Skills 用于 agentic 编码工具（Gemini CLI、Antigravity、Claude Code、Cursor、Windsurf 等）。激活某技能会加载该任务需要的具体指令与资源。CLI 会把 canonical 技能文件下到全局 `.agents/skills/angular-developer/`，再在 `.claude/skills/angular-developer/` 建符号链接指过去。

## 两个技能

| 技能 | 用途 |
| --- | --- |
| `angular-developer` | 生成 Angular 代码 + 架构指导——组件、服务、reactivity（signals/linkedSignal/resource）、forms、DI、routing、SSR、a11y、animations、styling、testing、CLI |
| `angular-new-app` | 用 Angular CLI 建新 app——设置和构建现代 Angular 应用的重要指引 |

## 三条核心规则

`angular-developer` 的 SKILL.md 开头就是三条不可跳的规则：

1. **先分析项目 Angular 版本**——最佳实践和可用特性随版本差异很大。用 CLI 建新项目时，除非用户要求，别指定版本
2. **用 Angular CLI 脚手架**——用 CLI 生成组件、服务、指令、管道、路由，保证一致性；遵循 Angular 风格指南
3. **生成后必跑 `ng build`**——确保无构建错误。有错就分析错误信息、修复，再继续。**「不要跳过这步，它是确保生成代码正确、可运行的关键」**

> 第 3 条是它最工程化的地方——不是「生成完就说完成」，而是**用 build 验证**，错了自己修。这与「证据要求」「验证内建」是同一种严谨。

## `ng new` 的版本检测逻辑

当被要求建新 Angular 项目，它按严格三步确定命令：

```text
Step 1: 用户显式指定版本（如 Angular 15）？
  → 用 npx，绕过本地安装：npx @angular/cli@<version> new <name>

Step 2: 没指定版本 → 跑 ng version 检查是否已装 CLI？
  → 已装：直接用本地/全局：ng new <name>

Step 3: 没指定 + ng version 失败（没装 Angular）？
  → 用 npx 取最新：npx @angular/cli@latest new <name>
```

> 这套逻辑体现「版本感知」——不盲目 ng new，而是先探测环境，用最合适的命令。

## 现代 Angular：优先 Signals

技能强调现代 Angular 特性：

- **Reactivity**：Signals（signal/computed）、linkedSignal（依赖源信号的可写状态）、resource（异步数据直接进 signal 状态）、effect（副作用，且讲何时**不该**用 effect）
- **Forms**：**新 app 优先 Signal Forms**（v21+）；老 app 或既有 forms 用匹配现有策略的类型
- **Components**：模板控制流（@if/@for/@switch）、signal-based inputs/outputs、host bindings

> 需要更深文档时，SKILL.md 会指你读 `references/` 下的对应文件，或 angular.dev 的官方指南。

## 下一步

- [指南](./guide-line) —— 依赖图 + 渐进披露、版本感知、ng build 验证、现代 Angular 深入
- [参考](./reference) —— 两技能、references 分组、安装、贡献、版本要求
