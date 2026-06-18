---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 v0.app 2025–2026 现状编写

## 速查

- 入口：[v0.app](https://v0.app)（`v0.dev` 自动跳转至此），登录即用 Vercel 账号
- 默认产出栈：**Next.js + shadcn/ui + Tailwind CSS**，部署目标 Vercel
- 四段式工作流：**Prompt → Iterate → Integrate → Ship**
- 多模态 prompt：文本 / 截图 / 文件 / **Figma 设计**
- 一键上线：点 **Publish** 自动建 Vercel Project；或 **创建 Pull Request** 回 GitHub
- 两套 API 别混：网页对话产品 ≠ **Model API**（`api.v0.dev/v1`，调模型）≠ **Platform API**（`v0-sdk`，做 dev tools）
- Free 计划：$0、含 $5/月 credits、**每天 7 条消息上限**
- iOS App 可在移动端构建

## 注册与登录

v0 没有独立账号体系——**v0 账号本质就是 Vercel 账号**。

1. 打开 [v0.app](https://v0.app)
2. 用 GitHub / GitLab / Email 登录（与 Vercel 同一套凭据）
3. 登录后即进入对话主界面，可直接开始第一个 prompt

::: tip 已有 Vercel 团队
如果你已在 Vercel 有团队 / 计费 / 自定义域名，v0 会直接复用——共享 team、RBAC、billing，无需重复配置。
:::

## 第一个 prompt

v0 的核心交互就是「**用自然语言描述你要什么**」。在对话框里直接说：

```
帮我做一个待办事项应用：
- 顶部输入框 + 添加按钮
- 列表项可勾选完成、可删除
- 用 shadcn/ui 组件，深色主题
```

v0 会：

1. **规划（plan）**：列出要创建的页面 / 组件 / 数据结构
2. **生成代码**：默认 Next.js + shadcn/ui + Tailwind，实时在右侧预览
3. **可迭代**：你继续追加「加一个清空已完成按钮」，它增量改代码

::: tip 多模态输入
不止文字——你可以：

- 粘贴一张 **UI 截图**，让 v0 还原成可运行界面
- 上传 **Figma 设计**（Premium 起支持 Figma 导入）作为 prompt
- 拖入文件 / 图片 / 视频 作为上下文

:::

## 官方四段式工作流

v0 把使用流程总结为 **Prompt → Iterate → Integrate → Ship**：

| 阶段 | 做什么 | 关键能力 |
| --- | --- | --- |
| **Prompt** | 描述需求 | 文本 / 截图 / 文件 / Figma 多模态输入 |
| **Iterate** | 打磨 | 代码编辑、终端命令、**Design Mode** 可视化设计、Versions 版本管理 |
| **Integrate** | 接外部 | 数据库、外部 API、GitHub、MCP、预装 agent、Slack |
| **Ship** | 上线 | 一键 Deploy 到 Vercel / 创建 PR、自定义域名、分享、模板 |

## 一键部署（Ship）

完成后点 **Publish**，v0 把当前 chat 部署到 Vercel：

- **首次 Publish 自动创建对应的 Vercel Project**，之后更新该 project
- 预览窗口会继承所连 Vercel project 的**环境变量（仅 Development 环境）**，构建期就能跑通真实集成
- 拿到线上 URL，可绑自定义域名、分享、存为模板

::: tip 从 UI 到代码库
v0 不是封闭黑盒——你可以：

- 把生成的组件**直接拷进自己的代码库**
- 连接 **GitHub**，把代码 push 到仓库（详见 [指南](./guide-line)）

:::

## 连接数据库（Integrate）

需要后端时，通过 **Vercel Marketplace** 一键集成数据库：

```
帮这个待办应用接一个 Supabase 数据库，
todos 表存所有待办，支持增删改查
```

- 支持 **Supabase / Neon** 等 Marketplace 数据库，集成会暴露为 agent 可调用的"工具"
- 超出 Marketplace 的服务，用 **MCP 服务器**接入
- 所有 agent 动作都在**隔离 sandbox** 里执行，终端命令有 Ask / Auto / Full 三档权限，可随时打断

## 两套 API 速辨

刚接触 v0 最容易混的就是它有**两套完全不同的 API**：

| | v0 Model API | v0 Platform API |
| --- | --- | --- |
| 干什么 | 直接调 v0 的**模型**做补全 / 对话 | 做 **dev tools / 平台**的基础设施 |
| Base URL / 包 | `https://api.v0.dev/v1`（OpenAI 兼容） | `v0-sdk`（`pnpm add v0-sdk`） |
| 环境变量 | `V0_API_KEY` | `V0_API_KEY` |
| 典型用法 | 在 Cursor / Cline 里当模型用 | 管理 chat、解析生成文件、操作 project / deployment |

两者都需要付费计划 + `V0_API_KEY`，深入用法见 [指南](./guide-line) 与 [参考](./reference)。

## 下一步

- [指南](./guide-line) —— 默认栈细节、集成、两套 API、计费、与竞品对比
- [参考](./reference) —— 模型清单、API 参数、计划档位、链接速查
- 官方文档：[v0.app/docs](https://v0.app/docs)
