---
layout: doc
---

# v0

由 **Vercel** 出品的 AI 应用生成器，官方自我定义为"**一个能帮任何人创建真实代码、全栈应用与 agent 的 AI agent**"。最初以「**prompt → UI 组件**」（生成 React / shadcn 界面）起家，如今已演进为 **agentic 全栈生成**——v0 会自己规划、拆解任务、连接数据库、边构建边推进。默认产出栈固定为 **Next.js + shadcn/ui + Tailwind CSS**，并能一键部署到 **Vercel**（v0 账号本质就是 Vercel 账号，共享团队 / 计费 / 域名）。除网页对话产品外，它还把自有模型开放为 **OpenAI 兼容的 v0 Model API**，可在 Cursor / Cline 等客户端里当模型直接调用。

::: tip 域名已迁移
`v0.dev` 已 307 跳转到 **`v0.app`**，旧文档 `vercel.com/docs/v0` 也 308 跳转到 `v0.app/docs`。本笔记所有链接一律使用 `v0.app`。
:::

## 评价

**优点**

- **Vercel 生态深度整合**：部署 / 账号 / 计费 / 自定义域名 / RBAC 一体化，点 Publish 即自动创建对应 Vercel Project 并持续更新
- **高质量组件产出**：默认 **shadcn/ui + Tailwind**，生成的 Next.js 代码贴合 Vercel 最佳实践，可无缝拷进自己的项目
- **agentic 全栈**：不止画 UI——会规划、连数据库（Supabase / Neon）、调外部 API、跑终端命令，全程在隔离 sandbox 执行
- **自有模型可独立调用**：`v0-1.5-md` / `v0-1.5-lg` 经 **OpenAI 兼容 API** 暴露，能进 Cursor / Cline / liteLLM 当模型用
- **多模态输入**：文本、截图、文件、**Figma 设计**都能作为 prompt
- **GitHub 一类支持**：连接后仓库即唯一真相源，每条改代码的消息自动 commit，Publish 时向 `main` 发 PR
- **多端**：提供 iOS App，可在移动端构建

**缺点**

- **强绑 Vercel / Next.js 生态**：默认且主要产出 Next.js + shadcn/ui + Tailwind，非 Vercel / Next 场景适配偏弱
- **闭源**：v0 本体不开源，无法私有部署（仅托管在 Vercel 上）
- **Model API 参数受限**：虽 OpenAI 兼容，但**不支持** `temperature` / `max_tokens` / `top_p`
- **GitHub 非双向实时同步**：v0 读写 GitHub 仓库而非维护独立副本，文档未承诺导入既有仓库的双向 sync
- **额度 / 限速**：Free 每天仅 7 条消息，额度（credits）耗尽即暂停生成
- **计费常变**：金额 / 额度套餐时常调整（**Premium $20 正被 sunset、对新用户关闭**），一切以官方 pricing 为准
- **中国大陆访问需自备网络**

## 文档地址

[v0](https://v0.app/docs)

## GitHub 地址

v0 本体非开源，无公开主仓。面向开发者的 Platform SDK 在 npm 发布：[v0 Platform (v0-sdk)](https://www.npmjs.com/package/v0-sdk)

## 幻灯片地址

<a href="/SlideStack/v0-slide/" target="_blank">v0</a>
