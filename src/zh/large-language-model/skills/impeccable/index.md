---
layout: doc
---

# Impeccable

Impeccable（`pbakaus/impeccable`）是知名开发者 Paul Bakaus（[@pbakaus](https://github.com/pbakaus)）个人出品的一套「面向 AI 编码 agent 的设计语言」，Apache-2.0 开源、在 GitHub 上广受欢迎、业界知名（**个人/产品，非某组织的官方项目，但作者知名、项目极流行**）。它的一句话定位是「让你的 AI harness 更擅长做设计」——用一套 **steering（引导）命令词汇** 与你的 AI 达成设计上的共识，把 AI 生成界面从「一眼假」的通用套路（generic AI-generated look）拉到「有意图的、生产级 UI」。

它由四部分构成：**1 个 skill（`impeccable`）+ 23 个命令 + 46 条确定性检测规则（deterministic detectors）+ live browser 实时迭代**。安装用 `npx impeccable install`，然后在 AI 编码工具里跑 `/impeccable init`。跨 Claude Code / Cursor / Gemini CLI / Codex / GitHub Copilot / OpenCode / Pi / Qoder / Trae / Rovo Dev 等多种 agent（各写入 `.{agent}/skills/impeccable/`）。它脱胎于 Anthropic 的 [frontend-design](https://github.com/anthropics/skills/tree/main/skills/frontend-design) skill，再把设计维度（typography / color / motion / layout / UX writing）拆成可精准引导的命令。

## 评价

**优点**

- **设计语言而非泛 prompt**：把「改设计」变成一套确定的命令词汇（`polish` / `audit` / `critique` / `distill` / `animate` / `bolder` / `quieter`…），你说 `/impeccable typeset the header` 就是精准引导排版，而非「把这里弄好看点」
- **确定性检测，无需 LLM**：46 条 detector 规则由 CLI 与浏览器扩展**无 LLM、无 API key** 直接跑，专抓 AI slop（侧边强调条、紫渐变、bounce 缓动、暗色发光）+ 通用质量（行长、局促内边距、过小点击区、跳级标题）
- **主动避「一眼假」**：内置明确的「绝对禁止」清单——渐变文字、侧边彩条、卡片套卡片、每段小号全大写 eyebrow、`01/02/03` 编号段标……都是 AI 生成界面的通病，Impeccable 逐条 match-and-refuse
- **register 感知**：`/impeccable init` 先问是 **brand**（营销/落地页/作品集，设计即产品）还是 **product**（应用 UI/仪表盘/工具，设计服务产品），写入 `PRODUCT.md` + `DESIGN.md`，后续命令据此调风格
- **live 实时迭代**：`/impeccable live` 在浏览器里选元素、选设计动作，AI 生成多个变体经 HMR 热替换，边看边改
- **跨 agent + 设计 hook**：一条命令装进十余种 AI 工具；在 Claude Code / Copilot / Codex / Cursor 上还装 provider 原生 hook，编辑 UI 文件后自动跑 detector 回灌 findings（Cursor 甚至在写入前拦截）

**缺点 / 边界**

- **个人/产品，非组织官方**：由 Paul Bakaus 个人维护（Apache-2.0），不是某大厂官方项目——但作者知名、项目极流行，社区活跃
- **偏 Web 前端**：`live` 与内置 detector 是 **web-only**；iOS/Android 原生走 HIG/Material 变体参考，不吃浏览器 detector
- **审是输入、判断在人**：detector 给确定性命中，`critique` 给设计评审，但最终取舍仍靠你的设计判断
- **需要「说人话」的引导**：它放大你的意图，前提是你有意图——`init` 捕获的 audience/brand/voice/anti-references 越清楚，产出越准

## 适用场景

- 用 AI 编码工具做界面，却总产出「一眼是 AI 做的」通用样子，想系统性避坑
- 想用一套**共享设计词汇**精准引导 AI（改排版、加动效、上色、去繁、变大胆/收敛）
- 上线前要一道**确定性质量门禁**（a11y/对比度/行长/AI slop）——CLI 进 CI，退出码 `2` 即失败
- 在浏览器里对着真实页面**实时迭代** UI 元素的多个视觉变体

## 边界

- **web-only 的部分**：`live` 变体模式与打包的 detector 只作用于 HTML/CSS，原生 app 代码不适用
- **不替你做设计决定**：命令是引导、detector 是信号，是否采纳由你定
- **依赖捕获的上下文**：跳过 `init`、没有 `PRODUCT.md`/`DESIGN.md` 时，从零构建类命令会先引导补齐
- **不是组件库/框架**：它是设计指导层，产出的是你自己代码里的改动，而非引入某个 UI 依赖

## 官方文档

[impeccable.style](https://impeccable.style) ｜ [detector 文档](https://impeccable.style/docs/detector) ｜ [design hook 文档](https://impeccable.style/docs/hooks) ｜ [Neo Mirai 案例](https://impeccable.style/cases/neo-mirai)

## GitHub 地址

[pbakaus/impeccable](https://github.com/pbakaus/impeccable)（Apache-2.0）｜ [impeccable · npm](https://www.npmjs.com/package/impeccable)

## 内容地图

- [入门](./getting-started) —— 定位（个人/产品、作者、设计语言）、安装（`npx impeccable install` → `/impeccable init`）、1 skill + 23 命令 + 46 检测总览
- [指南](./guide-line) —— 设计维度、steering 命令用法、46 检测规则、live 迭代、避通用 AI 套路与反模式
- [参考](./reference) —— 命令全表、检测清单、安装方式、多 agent、许可与链接

## 幻灯片地址

<a href="/SlideStack/impeccable-slide/" target="_blank">Impeccable</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=643" target="_blank" rel="noopener noreferrer">Impeccable 测试题</a>

