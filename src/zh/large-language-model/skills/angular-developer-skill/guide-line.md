---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 angular/skills 的 `angular-developer/SKILL.md` 与 references/ 编写。

## 速查

- **依赖图设计**：精简 SKILL.md 作依赖图，指向 30+ `references/`，按任务渐进披露加载
- **三核心规则**：先查版本 → 用 CLI 脚手架 → 生成后必 `ng build` 验证
- **版本感知**：最佳实践随 Angular 版本变；`ng new` 三步检测（显式版本→npx@version / 已装→ng new / 兜底→npx@latest）
- **现代 Angular**：Signals（signal/computed/linkedSignal/resource/effect）、Signal Forms（v21+ 优先）、@if/@for/@switch
- **官方**：Google LLC，MIT，源在 angular/angular；`angular-developer` + `angular-new-app`

## 依赖图 + 渐进披露

Angular Developer Skill 的架构是**精简 SKILL.md 作依赖图**：

- SKILL.md 入口只列能力（组件/reactivity/forms/routing…），并为每个任务指向 `references/` 下的专项文件
- agent 根据当前 prompt **只加载需要的**：问路由 → 读 `define-routes.md` + `loading-strategies.md`；问组件 → 读 `components.md`；而 `reactive-forms.md`、`component-harnesses.md` 等**不加载**

> 这正是 Agent Skills 规范里「渐进披露」的教科书落地——SKILL.md 是目录，references 是按需打开的章节。30+ 个引用文件全塞进上下文会爆，依赖图让 agent 精准取用。

## 三条核心规则

### ① 先分析项目 Angular 版本

最佳实践和可用特性随 Angular 版本差异**很大**——所以给指导前先分析项目用的是哪个版本。用 CLI 建新项目时，除非用户要求，别指定版本（用最新稳定）。

### ② 用 Angular CLI 脚手架

用 CLI 生成组件、服务、指令、管道、路由，保证一致性；遵循 Angular 风格指南。不手写脚手架代码，让 CLI 保证结构正确。

### ③ 生成后必 `ng build` 验证

> 生成代码后**必须跑 `ng build`** 确保无构建错误。有错就分析错误信息、修复，再继续。**不要跳过这步——它是确保生成代码正确、可运行的关键。**

这是它最工程化的地方：不是「生成完就说完成」，而是**用 build 当验证门**，错了自己分析修。与其它叶的「证据要求」「验证内建」同源。

## `ng new` 版本检测三步

被要求建新项目时，严格三步确定命令：

| 步 | 条件 | 命令 |
| --- | --- | --- |
| 1 | 用户显式指定版本（如 Angular 15） | `npx @angular/cli@<version> new <name>`（绕过本地安装） |
| 2 | 没指定 + `ng version` 成功（已装 CLI） | `ng new <name>`（用本地/全局） |
| 3 | 没指定 + `ng version` 失败（没装） | `npx @angular/cli@latest new <name>`（取最新） |

> 不盲目 ng new，先探测环境用最合适的命令——版本感知的体现。

## 现代 Angular：优先 Signals / Signal Forms

技能一贯推现代 Angular：

### Reactivity（信号）

- **signal / computed**：核心信号概念、reactive context、untracked
- **linkedSignal**：依赖源信号的可写状态
- **resource**：异步数据直接 fetch 进 signal 状态
- **effect**：副作用（日志、第三方 DOM），且讲**何时不该**用 effect（afterRenderEffect 等）

### Forms（表单）

- **新 app 优先 Signal Forms**（v21+）
- 老 app 或既有 forms：用匹配现有策略的表单类型

### Components / Templates

- 模板控制流 @if / @for / @switch、signal-based inputs/outputs、host bindings & attribute injection

> 需要更深文档时，SKILL.md 指向 `references/` 对应文件（如 signals-overview.md、linked-signal.md、resource.md），或 angular.dev 官方指南。

## references 结构（依赖图指向）

SKILL.md 按任务把你导向 references，例如：

| 任务 | 读哪些 references |
| --- | --- |
| 组件基础 | components.md、inputs.md、outputs.md、host-elements.md |
| Reactivity | signals-overview.md、linked-signal.md、resource.md、effects.md |
| Forms | signal-forms.md 等 |
| Routing | define-routes.md、loading-strategies.md |

> 需要 references 里没有的更深文档，读 angular.dev 官方指南（如 `https://angular.dev/guide/components`）。

## 为什么它是工程价值而非文档封装

- **依赖图 + 渐进披露**：不是把整份 Angular 文档塞进来，而是精心组织的按需加载图
- **版本感知**：先查版本再指导，`ng new` 三步逻辑——这是决策逻辑，非静态文档
- **build 验证闭环**：生成后必 ng build、错了自己修——这是工作流，非文档
- **官方 + 版本随框架**：源在 angular/angular，与框架同步演进

这些让它远超「Angular 文档的离线封装」——它是官方沉淀的、带决策逻辑和验证闭环的开发工作流。

## 反模式

| 反模式 | 问题 |
| --- | --- |
| 不查版本就给指导 | 最佳实践随版本变，规则①要求先查 |
| 生成后跳过 ng build | 违背规则③，可能生成不可运行代码 |
| 手写脚手架不用 CLI | 违背规则②，结构可能不一致 |
| 一次读全部 30+ references | 依赖图就是让你按需读，别全塞 |
| 新 app 不用 Signal Forms（v21+） | 新 app 优先 Signal Forms |

## 下一步

- [参考](./reference) —— 两技能、references 分组、安装、贡献、版本要求
- 上游：[angular/skills](https://github.com/angular/skills) · [angular.dev](https://angular.dev)
