---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 dev.to 官方文档与社区公告编写 —— 创作策略 / 标签优化 / 跨平台分发 / Forem 自托管 / MLH 收购影响

## 为什么用 dev.to：免费开源的开发者原生

理解 dev.to 的第一性原理——**「免费 + 开源 + 开发者原生体验」是它区别于 Medium / Stack Overflow / 个人博客的核心**。

### 开发者写作者的痛点

| 痛点 | 自建博客 | Medium | Stack Overflow | dev.to |
|---|---|---|---|---|
| 托管与维护 | 自己 | 内置 | 内置 | **内置** |
| 编辑器对代码友好 | 看插件 | 一般 | 仅问答 | **极好（Liquid 标签）** |
| 分发流量 | 靠 SEO | 算法 + 付费墙 | 问答驱动 | **算法 + 标签 + 450 万用户** |
| 读者门槛 | 无 | 付费墙 | 无 | **无** |
| 收入 | 自营 | Partner Program | 声誉 | **无（靠引流变现）** |
| 可自托管 | 是 | 否 | 否 | **是（Forem）** |

**核心结论**：dev.to 把「托管 + 代码友好编辑器 + 分发 + 450 万开发者流量」打包成免费服务，用「开源 + 赞助」维持——这是它能持续吸引技术写作者的根本。

## 创作策略

### 适合 dev.to 的内容

| 内容类型 | 适合度 | 原因 |
|---|---|---|
| 入门到进阶教程 | ★★★★★ | 开放访问，搜索流量大 |
| 「我做了个 X」展示（#showdev） | ★★★★★ | 社区氛围鼓励分享 |
| 框架 / 库横向对比 | ★★★★ | 开发者关心选型 |
| 行业讨论 / 观点（#discuss） | ★★★★ | 引发互动 |
| 求职 / 职场建议 | ★★★ | 标签流量中等 |
| 学术论文复现 | ★★ | 深度过高，受众窄 |
| 公司产品软文 | ★ | 易被社区反感 |

### 不适合的内容

- **纯 AI 生成水文**：社区会标记，损害个人品牌
- **付费墙内容预告**：dev.to 无分成机制，不如直接发 Medium
- **离技术太远的个人生活**：偏离社区定位

## 标签优化

标签是 dev.to 主要的分发机制（最多 4 个）。

### 标签选择原则

1. **大标签带流量**：#webdev #javascript #python #beginners
2. **小标签带精准**：#react #vue #devops #css
3. **功能标签带场景**：#tutorial #discuss #showdev #help
4. **不要堆砌**：4 个标签要相关，无关标签会被算法降权

### 典型组合

| 文章类型 | 标签示例 |
|---|---|
| React 入门教程 | #react #javascript #tutorial #beginners |
| 新开源项目展示 | #showdev #opensource #javascript #webdev |
| 框架对比讨论 | #discuss #javascript #react #vue |
| 求职问题求助 | #help #career #discuss #beginners |

## 跨平台分发

dev.to 是技术写作者多平台分发的核心一环。

### 典型分发链路

```
个人博客（首发，canonical 源）
  ↓ 同步
dev.to（开放访问，吃英文搜索流量）
Hashnode（开发者博客，开放访问）
  ↓ 同步（可付费墙）
Medium（吃 Partner Program 分成）
  ↓ 引流
Twitter / X / LinkedIn（社交传播）
```

### canonical_url 的关键作用

跨平台首发必须在 dev.to 设 `canonical_url` 指向原文：

- 避免搜索引擎判定重复内容
- 搜索权重归原文博客
- dev.to 副本仍获得平台内推荐流量

### 多平台同步工具

- **Crosspost 变量**：在 dev.to 编辑器顶部 `canonical_url` 填原文
- **自动化**：可用 GitHub Actions / RSS 把博客自动同步到 dev.to（API 文档见 [developers.forem.com](https://developers.forem.com/api)）

## Forem 自托管实战

dev.to 背后是开源 Forem，可自托管。

### 适用场景

| 场景 | 示例 |
|---|---|
| 企业内部开发者社区 | 公司技术布道 |
| 产品用户社区 | 框架 / SaaS 用户论坛 |
| 垂直技术社区 | 某语言 / 某领域专精 |
| 教育社区 | 编程训练营学员社区 |

### 技术栈

- **后端**：Ruby on Rails 7.x
- **数据库**：PostgreSQL
- **前端**：Preact + Stimulus
- **搜索**：Elasticsearch（可选 Algolia）
- **缓存**：Redis
- **部署**：Docker / Render / 自托管

### 部署方式

| 方式 | 适合 |
|---|---|
| Forem Cloud（forem.com） | 不想运维的团队 |
| 自托管 Docker | 需要完全掌控 |
| 本地开发 | `bin/setup` + `bin/startup` |

### 维护要点

- **升级**：跟随上游 forem/forem release
- **插件**：Forem 有扩展机制，但生态比 Discourse 小
- **2026 MLH 收购后**：Forem 承诺继续独立开源，但需关注维护节奏

## MLH 收购（2026-02-18）的影响

**Major League Hacking（MLH）** 是全球最大的学生黑客马拉松运营商。2026-02-18 收购 dev.to / Forem 后：

### 对写作者

- **流量叠加**：MLH 线下黑客马拉松生态为 dev.to 导入更多学生开发者
- **内容方向**：可能强化 #hackathon #students #beginners 等标签
- **变现路径**：暂未引入付费墙，但可能增加赞助内容位

### 对 Forem 开源

- **独立性**：官方承诺 Forem 继续独立服务开源社区
- **维护节奏**：需观察 MLH 是否持续投入研发
- **商业化**：可能通过 Forem Cloud 企业版变现

### 对 Stack Overflow 博客呼应

MLH CEO 在 2026-04-21 的 Stack Overflow 博客「We still need developer communities」中阐述：在线开发者社区在 AI 时代依然重要——这是 MLH 收购 dev.to 的战略逻辑。

## 与其他平台对比

| 需求 | 推荐 |
|---|---|
| 英文技术教程免费分发 | **dev.to** |
| 英文长文变现 | Medium |
| 开发者博客（自带域名） | Hashnode |
| 程序员问答 | Stack Overflow |
| 自托管开发者社区 | **Forem（dev.to 同款）** |
| 中文技术文章 | 掘金 |
| 邮件订阅 | Substack |

## 创作策略 Checklist

1. **免费思维**：dev.to 不分成，目标是品牌曝光与引流，不要想直接变现
2. **canonical**：跨平台同步必设 `canonical_url` 指向原文博客
3. **标签**：4 个标签组合「大标签 + 小标签 + 功能标签」
4. **Liquid 标签**：用 `{% codepen %}` `{% github %}` 嵌入交互内容，提升体验
5. **#showdev**：做了什么就发出来，社区鼓励分享
6. **系列文章**：教程连载用 Series 聚合
7. **AI 内容克制**：纯 AI 水文损害品牌，用 AI 做调研正文人工写
8. **多平台**：dev.to + Hashnode + Medium + 个人博客同步发，吃不同流量池
9. **关注 MLH 动向**：2026-02-18 收购后的产品迭代可能带来新机会
