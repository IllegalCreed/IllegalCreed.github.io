---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 dev.to 官方文档与 Forem 开源项目编写 —— 平台事实 / 编辑器 / Liquid 标签 / 标签 / Forem 技术栈 / API / 时间线

## 关键事实速查

| 项目 | 数值 / 说明 |
|---|---|
| 域名 | dev.to（DEV Community） |
| 创始人 | Ben Halpern、Jess Lee、Peter Frank |
| 上线时间 | 2017 年 |
| 用户规模 | 约 **450 万开发者** |
| 是否开源 | **是（Forem）** |
| 技术栈 | **Ruby on Rails**（后端）+ Preact + Stimulus |
| 商业模式 | 完全免费 / 赞助 / Forem Cloud 企业服务 |
| 付费墙 | **无** |
| 创作者直接收入 | **无**（靠引流变现） |
| 收购方 | **MLH（Major League Hacking）** |
| 收购日期 | **2026-02-18** |
| 中文支持 | 弱（几乎纯英文） |

## 编辑器 frontmatter

| 字段 | 说明 |
|---|---|
| `title` | 标题 |
| `published` | true / false（false 为草稿） |
| `tags` | 最多 4 个标签 |
| `cover_image` | 封面图 URL |
| `canonical_url` | 跨平台首发声明（指向原文） |
| `series` | 归入系列 |
| `description` | 文章摘要 |

## Liquid 标签

| 标签 | 用途 |
|---|---|
| `{% codepen URL %}` | 嵌入 CodePen |
| `{% github user/repo %}` | 嵌入 GitHub 仓库卡片 |
| `{% glitch ID %}` | 嵌入 Glitch 项目 |
| `{% youtube VIDEO_ID %}` | 嵌入 YouTube |
| `{% twitter STATUS_ID %}` | 嵌入 Twitter / X |
| `{% replit @user/slug %}` | 嵌入 Replit |
| `{% gist GIST_ID %}` | 嵌入 GitHub Gist |
| `{% stackblitz ID %}` | 嵌入 StackBlitz |
| `{% codesandbox ID %}` | 嵌入 CodeSandbox |
| `{% link URL %}` | 嵌入外链卡片 |
| `{% podcast URL %}` | 嵌入播客 |

## 反应表情（Reactions）

| 表情 | 含义 |
|---|---|
| ❤️ | 喜欢 |
| 🦄 | 惊艳 |
| 🔥 | 精彩 |
| 🤯 | 震撼 |
| 🤔 | 思考 |
| 👀 | 关注 |
| 🆒 | 酷 |

> 注意：**无「踩」按钮**，社区氛围友好。

## 常用标签

| 标签 | 用途 |
|---|---|
| #webdev | Web 开发（流量最大） |
| #javascript / #python / #typescript / #rust ... | 编程语言 |
| #react / #vue / #angular / #svelte ... | 框架 |
| #beginners | 新手友好 |
| #tutorial | 教程 |
| #discuss | 讨论 / 观点 |
| #help | 求助 |
| #showdev | 展示自己做的东西 |
| #opensource | 开源项目 |
| #career | 职场 |
| #devops | DevOps |
| #ai / #machinelearning | AI / ML |
| #productivity | 生产力 |

## Forem 技术栈

| 组件 | 技术 |
|---|---|
| 后端框架 | **Ruby on Rails 7.x** |
| 数据库 | PostgreSQL |
| 前端 | Preact + Stimulus |
| 搜索 | Elasticsearch（可选 Algolia） |
| 缓存 | Redis |
| 后台作业 | Sidekiq |
| 图片存储 | AWS S3 / Cloudinary |
| 部署 | Docker / Render / 自托管 |

## Forem 自托管命令

| 命令 | 用途 |
|---|---|
| `git clone https://github.com/forem/forem.git` | 克隆仓库 |
| `bin/setup` | 安装依赖、初始化数据库 |
| `bin/startup` | 启动开发服务器 |
| `bin/rspec` | 运行测试 |
| `bin/rails console` | Rails 控制台 |

## dev.to / Forem API

| 端点 | 方法 | 用途 |
|---|---|---|
| `/api/articles` | GET / POST | 列出 / 发布文章 |
| `/api/articles/{id}` | GET | 获取单篇文章 |
| `/api/articles/me` | GET | 获取自己的文章 |
| `/api/articles/me/published` | GET | 已发布文章 |
| `/api/articles/me/unpublished` | GET | 未发布文章 |
| `/api/comments` | GET | 获取评论 |
| `/api/users/{id}` | GET | 获取用户信息 |
| `/api/tags` | GET | 获取标签 |
| `/api/webhooks` | GET / POST | 管理 Webhook |

> API 文档：<https://developers.forem.com/api>，用 `api-key` Header 鉴权（在 Settings → Extensions → DEV Community API Keys 生成）。

## 与同类平台对比

| 平台 | 开源 | 商业模式 | 创作者收入 | 自定义域名 | 技术内容 |
|---|---|---|---|---|---|
| **dev.to** | **是（Forem）** | 免费 / 赞助 | 无 | 否 | 极高 |
| Medium | 否 | $5/月会员 | Partner Program | 会员可用 | 中等 |
| Hashnode | 否 | 免费 + 企业 | 无 | **免费** | 极高 |
| Stack Overflow | 否 | 广告 + Teams | 声誉 | 否 | 极高（问答） |
| Hacker Noon | 否 | 编辑审核 | 有（编辑部结算） | 否 | 高 |
| Substack | 否 | 订阅抽成 10% | 订阅 90% | 付费可用 | 低 |
| Forem 自托管 | **是** | 自营 | 自定 | 是 | 自定 |

## 重要时间线

| 时间 | 事件 |
|---|---|
| 2017 | dev.to 上线（Ben Halpern 等） |
| 2018 | 开源 Forem（forem/forem） |
| 2019 | 用户突破 100 万开发者 |
| 2021 | 用户突破 200 万，Forem 1.0 |
| 2023 | AI 内容冲击，社区引入标记 |
| 2025 | 用户约 450 万开发者 |
| **2026-02-18** | **被 MLH（Major League Hacking）收购** |
| 2026-04-21 | MLH CEO 在 Stack Overflow 博客阐述收购战略 |

## 参考

- 官网：<https://dev.to>
- 帮助中心：<https://dev.to/help>
- Forem 开源仓库：<https://github.com/forem/forem>
- Forem 文档：<https://developers.forem.com/>
- API 文档：<https://developers.forem.com/api>
- 收购公告：<https://dev.to/devteam/a-new-chapter-dev-is-joining-forces-with-major-league-hacking-mlh-3kfd>
