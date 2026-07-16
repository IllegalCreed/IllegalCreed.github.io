---
layout: doc
---

# Angular Developer Skill

Angular Developer Skill 是 **Angular 官方**（Copyright 2026 Google LLC，MIT）出品的 agent 技能——生成 Angular 代码并提供架构指导。它的源码就在 Angular 主仓库 `angular/angular` 的 `skills/dev-skills/` 里，经基建输出到 `angular/skills`。设计上它是一个**精简的 SKILL.md 作依赖图**：入口只列能力，指向 `references/` 下 30+ 个专项 Markdown 文件，agent 按当前任务**渐进披露**加载（问路由才读 define-routes.md，reactive-forms.md 就不加载）。它覆盖现代 Angular——Signals（signal/computed/linkedSignal/resource）、Signal Forms、DI、routing、SSR、a11y、Tailwind、testing，且强调**先查项目 Angular 版本、生成后必 `ng build` 验证**。

## 评价

**优点**

- **Angular 官方**：Google 出品、源在 angular/angular 主仓库、版本随框架，权威且不漂移
- **依赖图 + 渐进披露**：精简 SKILL.md 指向 30+ references，按任务只加载需要的，省上下文
- **版本感知**：**先分析项目 Angular 版本**再给指导（最佳实践随版本变），`ng new` 有严格的版本检测三步逻辑
- **build 验证内建**：生成代码后**必跑 `ng build`**，有错就分析修复再继续，「关键步骤不跳」
- **现代 Angular**：Signals（signal/computed/linkedSignal/resource/effect）、Signal Forms（v21+ 优先）、DI、routing、SSR、a11y(ARIA)、Tailwind、testing、CLI
- **两技能配套**：`angular-developer`（写代码 + 架构）+ `angular-new-app`（用 CLI 建新项目）
- **跨 agent**：`npx skills add https://github.com/angular/skills`，Claude Code / Cursor / Windsurf / Gemini CLI / Antigravity 等

**缺点 / 边界**

- **专注 Angular**：只服务 Angular 开发，非通用
- **依赖新版特性**：Signal Forms 要 v21+，部分指导偏现代 Angular
- **需要 CLI**：脚手架依赖 Angular CLI（ng），build 验证需能跑 ng build
- **references 深**：30+ 文件，靠依赖图导航，直接读全部会很多

## 适用场景

- 写 Angular 组件/服务，想照官方最佳实践 + 架构指导
- 建新 Angular 项目（angular-new-app + CLI）
- 用现代 Angular 特性：Signals、Signal Forms、resource、linkedSignal
- 想要「生成后自动 ng build 验证」的可靠闭环

## 边界

- **只服务 Angular**：非通用技能
- **版本敏感**：先查版本再指导，部分特性要新版
- **官方但两技能**：angular-developer（开发）+ angular-new-app（建项目）
- **贡献改 angular/angular**：源在主框架仓库，PR 提到那里

## 官方文档

[实现官方 Angular Claude Skills（angular.love）](https://angular.love/implementing-the-official-angular-claude-skills) ｜ [angular/skills README](https://github.com/angular/skills#readme) ｜ [angular.dev](https://angular.dev)

## GitHub 地址

[angular/skills](https://github.com/angular/skills)（源在 `angular/angular` 的 `skills/dev-skills/`，MIT，Copyright 2026 Google LLC）

## 内容地图

- [入门](./getting-started) —— `npx skills add` 安装、angular-developer + angular-new-app、三条核心规则
- [指南](./guide-line) —— 依赖图 + 渐进披露、版本感知、ng build 验证、现代 Angular（Signals/Signal Forms）、ng new 逻辑
- [参考](./reference) —— 两技能、references 分组、安装、贡献、版本要求

## 幻灯片地址

<a href="/SlideStack/angular-developer-skill-slide/" target="_blank">Angular Developer Skill</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">Angular Developer Skill 测试题</a>

> 测试题链接待生产库分类导入、获得真实数字叶节点 ID 后回填。
