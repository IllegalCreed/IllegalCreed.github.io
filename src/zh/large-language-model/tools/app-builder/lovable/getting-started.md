---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 docs.lovable.dev 2025–2026 现状编写

## 速查

- 入口：浏览器打开 [lovable.dev](https://lovable.dev/)，无需安装，注册即用（vibe coding）
- 起步方式：① 自然语言描述想做的 app ② 上传截图 / 设计稿 / 文档 ③ 导入 Figma 资产
- 默认生成栈：**React + Vite + TypeScript + Tailwind CSS + shadcn/ui**（前端）
- 默认后端：**Lovable Cloud**（Supabase 基座，默认开启）或直接接 Supabase
- 三种核心模式：**Build Mode**（按复杂度计费 0.5–2 credit / 条）、**Plan Mode**（固定 1 credit / 条）、**Code Mode**
- 可视化编辑（Preview Toolbar）：**行内改文字免费**（每用户每天 ≤100 次）；点选改样式、涂画标注**按 credit 计**
- 发布：默认域名 `xxx.lovable.app`（不可移除），自定义域名仅付费档
- 代码同步：连 GitHub / GitLab 后双向同步，代码所有权归你
- 免费档：每天 5 credit、每月封顶 30；另含 Cloud grant 20 / 月、AI grant 4 / 月

## 第一步：注册与起步

Lovable 是纯 Web 平台，**无需本地安装**。打开 [lovable.dev](https://lovable.dev/) 注册后，在首页输入框里描述你想做的应用即可：

```text
做一个待办事项 App：可以新增 / 勾选完成 / 删除任务，
顶部有筛选（全部 / 进行中 / 已完成），界面用卡片风格。
```

Lovable 的 agent 会自动规划、生成全栈代码并在右侧预览区实时渲染。除了打字，你还可以：

- **上传截图 / 设计稿**：让它照着图生成界面
- **导入 Figma 资产**：把设计稿 / 素材带入工作流（注意：这是「导入设计 / 资产」，并非官方 Figma 连接器）
- **粘贴文档 / PRD**：作为需求上下文

::: tip vibe coding 是什么
「vibe coding」（氛围编程）指**用自然语言对话来造软件**，而不是手敲代码。Lovable 是该赛道标杆——你描述「想要什么」，它生成「真实可运行的代码」。但生成产物仍是标准工程代码，复杂逻辑 / 大重构最好仍由懂代码的人审阅。
:::

## 默认技术栈

Lovable 生成的项目默认是一套现代前端栈，搭配 Supabase 系后端：

| 层级 | 默认技术 | 说明 |
| --- | --- | --- |
| 前端框架 | **React** | 官方核心技术 |
| 构建工具 | **Vite** | 生成产物默认（业界一致） |
| 语言 | **TypeScript** | 生成产物默认 |
| 样式 | **Tailwind CSS** | 官方核心技术 |
| 组件库 | **shadcn/ui** | 生成产物默认 |
| 后端 | **Lovable Cloud / Supabase** | 官方核心后端 |

::: warning 栈来源的准确说法
官方文档明确点名的是 **React、Tailwind CSS、Supabase**。Vite / TypeScript / shadcn/ui 是「Lovable 生成项目的实际产物」+ 业界一致结论，可表述为「Lovable 生成的项目默认是 Vite + React + TypeScript + Tailwind + shadcn/ui」。
:::

## 三种工作模式

Lovable 的 agent 提供三种核心模式，**计费方式不同**：

| 模式 | 作用 | 计费 |
| --- | --- | --- |
| **Build Mode** | 直接构建 / 迭代应用 | 按消息复杂度扣 **0.5 ~ 2 credit** |
| **Plan Mode** | 先规划、再动手（适合复杂需求） | 固定 **1 credit / 条** |
| **Code Mode** | 面向代码的精细操作 | 按消息计 |

构建消息的 credit 与复杂度挂钩，例如「把按钮改成灰色」≈ 0.50，「加一个带图片的落地页」≈ 2.00。

## 可视化编辑（Preview Toolbar）

新版 **Preview Toolbar** 取代了旧的独立 Visual edits 面板，提供三种交互——**这是最容易踩坑的计费点**：

| 交互 | 作用 | 是否免费 |
| --- | --- | --- |
| **Edit Text Inline**（行内改文字） | 点进页面任意文字直接原地改 | ✅ 免费，每用户每天上限 **100 次** |
| **Select Elements**（点选元素） | 点选一个 / 多个元素，用自然语言描述改动 | ❌ 按普通 chat 消耗 credit |
| **Draw Annotation**（涂画标注） | 在预览上手绘示意 | ❌ 消耗 credit |

::: danger 别照搬「可视化编辑不耗 credit」
真正免费的只有「行内改文字」（每日 100 次内）。**点选改样式、涂画标注都按 credit 计**。官方那句「Visual edits don't consume credits」语境更偏指文字 / 布局微调这类免费操作，教学时务必点明边界。
:::

## 接后端：Lovable Cloud

新项目默认启用 **Lovable Cloud**——一套内建全栈后端（Supabase 基座），无需单独配置 Supabase：

- **数据库**：自动生成 schema，UI 里直接增删改，无需写 SQL
- **认证**：邮箱 / 手机 / Google 登录，自动生成登录注册页
- **存储**：文件上传 / 管理，存项目 bucket
- **Edge Functions**：Serverless 自定义逻辑 / API
- **AI**：内建模型（见[指南](./guide-line)）

::: tip Cloud 还是 Supabase？
新项目可在 **Lovable Cloud** 与**直接接 Supabase** 之间二选一；已有 Supabase 项目继续保持不变。认证默认走 Lovable Cloud / Supabase Auth——**Clerk 不是官方内置连接器**，仅作可选第三方认证。
:::

## 发布与域名

- 一键发布后得到默认域名 **`xxx.lovable.app`**（目前**无法移除**该项目 URL）
- **自定义域名仅限付费计划**：可在 Lovable 内购买域名（Entri 自动配置或手动 DNS），或接入已有域名；连域名本身不收月费，只付注册 / 续费
- 也可经 GitHub 集成把代码部署到 Vercel / Netlify 等平台

## 第一个真实任务

试一个端到端流程：

```text
给这个 App 加用户登录（邮箱 + Google），
登录后每个用户只能看到自己的任务，
任务数据存到 Cloud 数据库。
```

Lovable 会：

1. 在 **Lovable Cloud** 里建数据表（含 user 关联字段）
2. 接好**认证**、生成登录注册页
3. 配置 **RLS（行级安全）**，确保用户只能读自己的数据
4. 在预览区实时呈现可登录的应用

::: warning 发布前务必检查 RLS
敏感表必须开启 **RLS（行级安全）**，否则用户可能越权读到他人数据。Lovable 在发布前会自动安全扫描，但「有真实数据前改 RLS 更省事」——养成发布前核对的习惯。详见[指南](./guide-line)的安全章节。
:::

## 下一步

- [指南](./guide-line) —— Lovable Cloud + AI、GitHub 双向同步、计费机制、安全实践、与 Bolt / v0 对比
- [参考](./reference) —— 计划与额度、credit 计费表、集成清单、AI 模型速查
