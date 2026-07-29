---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 dev.to（DEV Community）官方文档与 Forem 开源项目（github.com/forem/forem）编写 —— 注册 / 写作 / 标签 / 社区互动 / 自托管 Forem

## 速查

- 注册：邮箱 / GitHub / Twitter / Facebook 登录，完全免费
- 写作：点击 Create Post，Markdown 编辑器 + Liquid 标签嵌入
- 文章结构：cover_image / tags（最多 4 个）/ canonical_url（跨平台首发声明）/ series
- Liquid 标签：`{% codepen %}` `{% github %}` `{% glitch %}` `{% youtube %}` `{% twitter %}`
- 反应表情：❤️🦄🔥🤯 等，无「踩」按钮，社区氛围友好
- 标签：#webdev #javascript #python #beginners #tutorial #discuss #help 等
- 系列文章：Create Series 把多篇文章聚合
- 播客：dev.to 内置 Podcast 频道聚合
- 无付费墙：所有内容永久开放访问
- 自托管：克隆 [forem/forem](https://github.com/forem/forem)，Ruby on Rails 项目
- 收购事件：**2026-02-18 被 MLH（Major League Hacking）收购**
- 用户规模：约 **450 万开发者**

## dev.to 是什么

dev.to（DEV Community）是一个**完全免费、完全开源的英文开发者社区**，定位与其他平台形成清晰对照：

| 维度 | dev.to | Medium | Stack Overflow | Hashnode |
|---|---|---|---|---|
| 定位 | 免费开源开发者社区 | 付费墙长文社区 | 开发者问答 | 开发者博客 |
| 是否开源 | **是（Forem / Rails）** | 否 | 否 | 否 |
| 商业模式 | 赞助 + 企业服务 | $5/月会员分成 | 广告 + Teams | 免费 + 企业 |
| 创作者收入 | 无直接分成 | Partner Program 阅读时长 | 声誉（非现金） | 无 |
| 内容形态 | 文章 + 讨论 | 长文 | 问答 | 文章 |
| 技术内容占比 | **极高** | 中等 | 极高 | 极高 |
| 中文友好 | 弱 | 弱 | 弱 | 弱 |
| 收购方 | MLH（2026-02-18） | A Medium Corporation | Prosus（2021） | - |

**核心结论**：dev.to = 「**免费 + 开源（Forem）+ 开发者原生**」，适合技术教程、行业讨论、个人品牌建设；想直接变现请用 Medium / Substack。

## 注册与个人主页

### 注册

访问 [dev.to](https://dev.to)，用邮箱 / GitHub / Twitter / Facebook 之一登录即可，完全免费。

### 完善个人主页

- 头像、简介、所在地点
- 关联 GitHub / Twitter / 网站
- 设置技能标签（用于推荐流匹配）

## 写第一篇文章

点击右上角 **Create Post**，进入 Markdown 编辑器。

### 文章 frontmatter（编辑器顶部）

| 字段 | 说明 |
|---|---|
| `title` | 标题 |
| `published` | true / false（草稿） |
| `tags` | 最多 4 个标签 |
| `cover_image` | 封面图 URL |
| `canonical_url` | 跨平台首发声明（避免 SEO 重复内容惩罚） |
| `series` | 归入系列 |

### Liquid 标签嵌入

dev.to 用 Liquid 标签嵌入外部内容：

```liquid
{% codepen https://codepen.io/user/pen/xxx %}
{% github user/repo %}
{% glitch xxx %}
{% youtube VIDEO_ID %}
{% twitter STATUS_ID %}
```

### 跨平台首发声明

如果文章首发在个人博客 / Medium / Hashnode，在 `canonical_url` 里填原文 URL：

- dev.to 会在文章头部显示「Originally published at...」
- Google 把搜索权重归给原文，dev.to 副本不被惩罚
- 这是技术写作者多平台分发的标准做法

## 标签与社区互动

### 常用标签

| 标签 | 用途 |
|---|---|
| #webdev | Web 开发 |
| #javascript / #python / #rust ... | 语言 |
| #beginners | 新手友好 |
| #tutorial | 教程 |
| #discuss | 讨论 / 观点 |
| #help | 求助 |
| #showdev | 展示自己做的东西 |
| #opensource | 开源项目 |

### 反应（Reactions）

文章底部有 ❤️🦄🔥🤯 等表情反应，**无「踩」按钮**，社区氛围友好。反应数是 dev.to 主要的互动指标。

### 评论与讨论

评论区支持 Markdown 与代码块，#discuss 标签的文章常引发深度讨论。社区有严格的 Code of Conduct。

## 系列文章（Series）

把多篇相关文章聚合成一个系列：

- 发文时在 frontmatter 设 `series`
- 读者可在系列页连续阅读
- 适合教程连载、深度专题

## 自托管 Forem

dev.to 背后是开源项目 **Forem**，可自托管搭建同类社区。

### Forem 是什么

- 基于 **Ruby on Rails** 的开源社区框架
- GitHub：[forem/forem](https://github.com/forem/forem)
- 支持：文章、评论、反应、标签、播客、聊天、Code of Conduct 工具
- 适用：企业内部社区、产品用户社区、垂直技术社区

### 快速开始

```bash
# 克隆仓库
git clone https://github.com/forem/forem.git
cd forem

# 安装依赖（需 Ruby 3.x + Rails 7.x）
bin/setup

# 启动开发服务器
bin/startup
```

详见 [Forem 文档](https://developers.forem.com/) 与仓库 README。

> 2026-02-18 MLH 收购 dev.to 后，Forem 开源项目承诺继续独立服务开源社区。

## 下一步

入门到此为止——你已经能注册、写作、用 Liquid 标签、跨平台声明 canonical、自托管 Forem。下一章 `guide-line.md` 深入讲 **创作策略 / 标签优化 / 跨平台分发 / 与 Medium / Hashnode 对比 / MLH 收购影响**等核心主题。
