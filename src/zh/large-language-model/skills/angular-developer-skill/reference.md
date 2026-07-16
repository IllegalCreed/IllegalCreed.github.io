---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 angular/skills 的 `angular-developer/SKILL.md`、references/ 与 README 编写。

## 速查

- **装**：`npx skills add https://github.com/angular/skills`
- **两技能**：`angular-developer`（开发）· `angular-new-app`（建项目）
- **三规则**：先查版本 → 用 CLI 脚手架 → 生成后必 `ng build`
- **依赖图**：SKILL.md → 30+ `references/` 渐进披露
- **现代 Angular**：Signals、Signal Forms（v21+）、DI、routing、SSR、a11y、Tailwind
- **官方**：Copyright 2026 Google LLC，MIT，源在 angular/angular

## 两个技能

| 技能 | 用途 |
| --- | --- |
| `angular-developer` | 生成 Angular 代码 + 架构指导（组件/reactivity/forms/DI/routing/SSR/a11y/animations/styling/testing/CLI） |
| `angular-new-app` | 用 Angular CLI 建新 app，含现代应用的设置与结构指引 |

## 三条核心规则

1. **先分析项目 Angular 版本**（最佳实践随版本变；`ng new` 时除非用户要求别指定版本）
2. **用 Angular CLI 脚手架**（组件/服务/指令/管道/路由，遵循风格指南）
3. **生成后必 `ng build`**（有错分析修复再继续，关键步骤不跳）

## `ng new` 版本检测

| 步 | 条件 | 命令 |
| --- | --- | --- |
| 1 | 显式版本 | `npx @angular/cli@<version> new <name>` |
| 2 | 已装 CLI（`ng version` 成功） | `ng new <name>` |
| 3 | 未装（`ng version` 失败） | `npx @angular/cli@latest new <name>` |

## references 分组（依赖图指向）

| 领域 | references（示例） |
| --- | --- |
| Components | components.md、inputs.md、outputs.md、host-elements.md |
| Reactivity | signals-overview.md、linked-signal.md、resource.md、effects.md |
| Forms | signal-forms.md（v21+ 优先）、reactive-forms.md |
| Routing | define-routes.md、loading-strategies.md |
| 其它 | component-harnesses.md（测试）等 30+ |

> 更深文档读 angular.dev（如 `https://angular.dev/guide/components`）。

## 现代 Angular 覆盖

| 领域 | 内容 |
| --- | --- |
| Reactivity | signal / computed / linkedSignal / resource / effect（含何时不用 effect） |
| Forms | Signal Forms（v21+ 新 app 优先） |
| Templates | @if / @for / @switch、signal-based inputs/outputs |
| 其它 | DI、routing、SSR、a11y(ARIA)、animations、styling（组件样式 + Tailwind）、testing、CLI |

## 安装与集成

```bash
npx skills add https://github.com/angular/skills
```

CLI 下 canonical 技能到全局 `.agents/skills/angular-developer/`，`.claude/skills/angular-developer/` 建符号链接指过去。支持 Claude Code、Cursor、Windsurf、Gemini CLI、Antigravity 等。

## 贡献

技能源在 `angular/angular` 主仓库的 `skills/dev-skills/` 目录，经基建输出到 angular/skills。贡献：改 `skills/dev-skills/` → 遵循 Angular commit 规范/编码标准 → 提 PR 到 angular/angular。反馈/bug 到 angular/angular issue tracker。

## 资源链接

- 仓库：[angular/skills](https://github.com/angular/skills)（源在 angular/angular）
- 官方文档：[angular.dev](https://angular.dev)
- 实现介绍：[implementing the official Angular Claude Skills](https://angular.love/implementing-the-official-angular-claude-skills)
- 相关叶：[Agent Skills 规范与生态](../agent-skills-spec/)（渐进披露）· [Vercel Agent Skills](../vercel-agent-skills/)
