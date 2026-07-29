---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Stack Overflow 官方 Tour 与 Help Center（stackoverflow.com）编写 —— 注册 / 提问 / 回答 / 声誉系统 / 徽章 / Collectives

## 速查

- 注册：邮箱 / Google / GitHub / Facebook 登录，免费
- 提问：点击 Ask Question，必须包含标题、正文、至少 1 个标签、最小可复现示例
- 回答：在问题页底部 Answer 框撰写，Markdown + 代码块
- 声誉（Reputation）：被点赞答案 +10，被采纳 +15，被反对 -2（提问者）/ -2（反对者）
- 徽章（Badges）：Bronze / Silver / Gold 三级，按贡献类型颁发
- 权限：声誉达阈值解锁（15 评论 / 50 改自己帖 / 100 改他人帖 / 3000 关闭问题 ...）
- Collectives：围绕 Google Cloud / AWS / Go / Kotlin 等技术栈的子社区（厂商赞助，2026 仍活跃）
- Markdown：标题、加粗、代码块（```）、链接、图片、引用
- 标签：最多 5 个，必选且与问题相关
- 提问前先搜：80% 的「新问题」其实已被问过
- 数据转储：每季度公开（data.stackexchange.com）
- 中文替代：SegmentFault（思否）/ 博客园问答

## Stack Overflow 是什么

Stack Overflow 是一个**以问答（Q&A）为核心的程序员知识社区**，定位与其他平台形成清晰对照：

| 维度 | Stack Overflow | dev.to | Medium | Reddit r/programming |
|---|---|---|---|---|
| 内容形态 | **问答** | 文章 | 长文 | 讨论 |
| 目标 | 沉淀可复用知识 | 分享教程 / 观点 | 长文变现 | 时效讨论 |
| 治理 | 声誉 + 徽章 + close | 反应表情 | 算法 + Boost | 投票 |
| 商业模式 | 广告 + Teams | 免费 / 赞助 | $5/月会员 | 广告 + Reddit Premium |
| 创作者激励 | 声誉（非现金） | 无 | Partner Program | Karma |
| 收购方 | Prosus（2021） | MLH（2026） | A Medium Corp | Reddit Inc（IPO 2024） |

**核心结论**：Stack Overflow = 「**问答 + 声誉 + 徽章 + 严格治理**」，是开发者求助与沉淀复用知识的事实平台；想写文章用 dev.to，想变现用 Medium。

## 注册与个人主页

### 注册

访问 [stackoverflow.com](https://stackoverflow.com)，用邮箱 / Google / GitHub / Facebook 登录。新账号声誉 = 1。

### 个人主页

- 头像、简介、所在地点、个人网站
- 关联 GitHub / Twitter
- 展示 Top 标签、徽章、声誉变化历史
- 声誉是求职背书（很多公司招聘会查 SO 主页）

## 提一个好问题

提问质量直接决定能否得到答案。Stack Overflow 对提问有严格规范。

### 提问前必做

1. **先搜索**：80% 的「新问题」其实已被问过
2. **检查 duplicate**：搜到类似问题先读，再决定是否新提
3. **准备最小可复现示例（MRE）**：剥离业务代码，只留复现 bug 的最小代码

### 提问结构

| 部分 | 要求 |
|---|---|
| 标题 | 一句话概括问题（不是「求助！！！」） |
| 正文 | 背景 → 期望 → 实际 → 已尝试 |
| 代码 | 最小可复现示例（用 ``` 包裹） |
| 报错信息 | 完整粘贴，不要截图 |
| 标签 | 最多 5 个，相关且具体（如 `python` `pandas` `group-by`） |
| 语言 | 用英文（中文提问易被忽略或迁移到关闭队列） |

### 常见 close 原因

| 原因 | 含义 |
|---|---|
| Duplicate | 已有相同问题 |
| Needs details / clarity | 信息不足 / 不清晰 |
| Needs more focus | 太宽泛（多个问题） |
| Opinion-based | 观点题（无确定答案） |
| Not reproducible | 无法复现 |

被 close 的问题会被 down vote，损害声誉。

## 回答一个好答案

### 回答要点

- **直接回答问题**：不要绕弯子
- **给代码 + 解释**：代码先行，解释为什么
- **引用来源**：官方文档、规范、源码链接
- **避免只丢链接**：「看这个 link」会被 down vote

### 被采纳（Accepted）

提问者可勾选一个最佳答案为「Accepted」（绿色对勾），作者 +15 声誉。被采纳的答案会置顶。

## 声誉系统（Reputation）

声誉是 Stack Overflow 的核心游戏化机制。

### 声誉变化

| 行为 | 声誉变化 |
|---|---|
| 提问被 up vote | +5 |
| 回答被 up vote | **+10** |
| 回答被采纳 | **+15** |
| 提问 / 回答被 down vote | -2（作者）|
| 你 down vote 他人 | -1（你） |
| 你达到某些徽章 | 视徽章 |
| 每日声誉上限 | **+200**（被采纳除外） |

### 声誉解锁的权限

| 声誉 | 权限 |
|---|---|
| 1 | 提问 / 回答 |
| 15 | **up vote** |
| 15 | 用 flag |
| 50 | **评论**（他人帖） |
| 100 | **编辑他人帖**（需审核） |
| 125 | **down vote** |
| 250 | 查看close / reopen 投票 |
| 500 | 访问审核队列 |
| 1000 | 编辑他人帖（无需审核） |
| 3000 | **close / reopen 投票** |
| 10000 | 访问审核工具 |
| 25000 | 访问站点分析 |
| 200000+ | 接近版主权限 |

## 徽章（Badges）

徽章按贡献类型颁发，分 Bronze / Silver / Gold 三级。

| 徽章 | 等级 | 获得方式 |
|---|---|---|
| Student | Bronze | 首次提问被 up vote |
| Editor | Bronze | 首次编辑帖子 |
| Nice Answer | Bronze | 答案获 10 up vote |
| Good Answer | Silver | 答案获 25 up vote |
| Necromancer | Silver | 回答 60 天前的问题获 5 up vote |
| Great Answer | Gold | 答案获 100 up vote |
| Famous Question | Gold | 问题浏览 10000 次 |
| Copy Editor | Gold | 编辑 500 个帖子 |
| Legendary | Gold | 150 天每天达声誉上限 |

## Collectives™（子社区）

2021 年推出的围绕技术栈的子社区。

### 什么是 Collectives

- 由厂商赞助（Google Cloud、AWS、Go、Kotlin、Prometheus 等）
- 聚合该技术栈的标签、文章、专家
- 厂商支持工程师（带「Recognized Member」标识）直接答疑
- **截至 2026 年仍活跃**，未受流量下滑影响下线

### 加入 Collectives

- 在 Collective 页面点击 Join
- 在你的主页展示该 Collective 徽章
- 该 Collective 的问答会进你的推荐

## 下一步

入门到此为止——你已经能注册、提问、回答、累积声誉与徽章、加入 Collectives。下一章 `guide-line.md` 深入讲 **AI 冲击下的现状 / 流量下滑数据 / 2026 改版失败 / 2023 版主罢工 / 与 AI 工具协作 / 求职背书**等核心主题。
