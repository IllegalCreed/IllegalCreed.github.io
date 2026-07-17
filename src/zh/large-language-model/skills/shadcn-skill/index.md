---
layout: doc
---

# shadcn Skill

shadcn Skill 是 **shadcn/ui 官方**（源在主仓库 `shadcn-ui/ui` 的 `skills/shadcn/`，MIT，★119k）出品的 agent 技能——管理 shadcn 组件与项目：添加、搜索、修复、调试、样式、组合 UI（含聊天界面），并提供项目上下文、组件文档与用法示例。它面向「组件以**源码**形式经 CLI 加入项目」的 shadcn/ui 范式，核心是一套**始终强制的 Critical Rules**（styling / forms / composition / icons / chat / CLI，每类链到带「错误/正确」代码对的 `rules/*.md`）+ 4 条原则（优先用现有组件、组合而非重造、内建 variant 优先、语义色）。配套 **shadcn MCP**（一个 URL 接 registry，search/browse/install 组件/blocks/examples），另有 `migrate-radix-to-base`（Radix → Base UI 迁移）技能。

## 评价

**优点**

- **shadcn/ui 官方**：源在 shadcn-ui/ui 主仓库、随 CLI/registry 演进、权威不漂移
- **规则内建、始终强制**：6 大类 Critical Rules 各带 Incorrect/Correct 代码对，AI 照着写就合规
- **项目感知**：`npx shadcn@latest info --json` 拿项目配置 + 已装组件；`docs <component>` 取文档
- **组合优先**：原则①②——先 `search` registry（含社区）找现有组件，组合而非重造（设置页 = Tabs + Card + form）
- **语义化**：语义色（`bg-primary` 不用 `bg-blue-500`）、`gap-*` 不用 `space-y-*`、`size-*` 不用 `w-* h-*`、`cn()` 条件类
- **preset 系统**：`--preset` 代码，`preset decode/url/open/resolve` + `apply`/`init --preset`，绝不手拼 URL
- **shadcn MCP**：一个 MCP URL 接 registry，search/browse/install 组件/blocks/examples
- **配套迁移**：`migrate-radix-to-base`（Radix UI → Base UI）

**缺点 / 边界**

- **强 opinionated**：规则严格（不许手写 `space-y-*`/`z-index`/`dark:` 覆盖），需接受其范式
- **依赖 CLI**：组件靠 `shadcn@latest` CLI 加源码，需 `components.json`
- **面向 shadcn/ui**：非通用 UI 技能
- **规则文件多**：rules/ 下 styling/forms/composition/icons/chat 等，按需读

## 适用场景

- 用 AI 建 shadcn/ui 界面，想照官方组件组合规则（表单、卡片、对话框、聊天）
- 想让 AI 自动 `search` registry 找现有组件、组合而非重造
- 用 `--preset` 代码初始化/应用主题
- 需要项目感知（info --json）+ 组件文档（docs）

## 边界

- **只服务 shadcn/ui**：非通用组件技能
- **规则强制**：接受 opinionated 约定（语义色/gap/size-*/data-icon）
- **依赖 CLI + registry**：源码式组件、preset 系统
- **贡献到 shadcn-ui/ui**：官方主仓库

## 官方文档

[Skills（ui.shadcn.com/docs/skills）](https://ui.shadcn.com/docs/skills) ｜ [MCP Server（ui.shadcn.com/docs/mcp）](https://ui.shadcn.com/docs/mcp) ｜ [ui.shadcn.com](https://ui.shadcn.com)

## GitHub 地址

[shadcn-ui/ui](https://github.com/shadcn-ui/ui)（官方，MIT，skill 在 `skills/shadcn/`）

## 内容地图

- [入门](./getting-started) —— 定位、安装/接入（skill + MCP）、4 原则、项目上下文、CLI 总览
- [指南](./guide-line) —— 6 大 Critical Rules、CLI/registry/preset、shadcn MCP、组合模式、migrate-radix-to-base
- [参考](./reference) —— 规则文件清单、CLI 命令、MCP、preset、安装、许可

## 幻灯片地址

<a href="/SlideStack/shadcn-skill-slide/" target="_blank">shadcn Skill</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">shadcn Skill 测试题</a>

> 测试题链接待生产库分类导入、获得真实数字叶节点 ID 后回填。
