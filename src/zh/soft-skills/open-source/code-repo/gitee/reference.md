---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Gitee 官方站点 —— 产品形态 / 功能对照 / 镜像 / 企业版 / 私有化 / 审核 / 多平台对比 / 选型

## 运营方与时间线

| 项 | 信息 |
|---|---|
| **运营方** | 开源中国 OSCHINA（北京奥思研工智能科技有限公司）|
| **上线** | 2013 年 |
| **定位** | 国内代码托管与协作平台 |
| **官网** | <https://gitee.com> |

## 产品形态对照

| 形态 | 说明 | 计费 |
|---|---|---|
| **个人版** | 个人/小团队托管 | 免费（5 人团队）|
| **企业版（SaaS）** | 团队研发协作 | 按人订阅 |
| **专业版私有化** | 内网/私有云部署 | 商业授权 |

## 功能模块对照

| 功能 | Gitee | GitHub | GitLab |
|---|---|---|---|
| 仓库托管 | 公开/私有 | 公开/私有 | 公开/私有 |
| 评审单元 | Pull Request | Pull Request | Merge Request |
| 静态站 | **Gitee Pages / Pages Pro** | GitHub Pages | GitLab Pages |
| CI/CD | **Gitee Go** | Actions | 内置 CI/CD |
| 制品库 | Gitee Packages | GitHub Packages | Container/Package Registry |
| AI 助手 | **AI 队友** | Copilot | Duo |
| 代码查重 | **CopyCat（企业版）** | 无原生 | 无原生 |
| 开源模型市场 | **模力方舟** | 无 | 无 |
| 公开库审核 | **需人工审核** | 无 | 无 |
| 自托管 | 专业版私有化 | Enterprise Server | CE/EE |

## GitHub 镜像方式对照

| 方式 | 方向 | 自动化 | 适用 |
|---|---|---|---|
| **一键导入** | GitHub → Gitee | 一次性 | 初始迁移 |
| **强制同步（Pull）** | GitHub → Gitee | Gitee 定期拉 | 持续镜像 |
| **CI 推送（Push）** | GitHub → Gitee | Actions 触发 | 可控、可定制 |
| **手动 push** | 任意 | 手动 | 临时 |

## Gitee Pages 对照

| 项 | Gitee Pages | Gitee Pages Pro |
|---|---|---|
| 站点地址 | `&lt;user&gt;.gitee.io/<repo>` | 同 |
| 自定义域名 | 不支持 | 支持 |
| HTTPS | 有限 | 支持 |
| 自动部署 | 手动触发 | 支持 |
| 计费 | 免费 | 付费 |

## Gitee Go 流水线要点

| 项 | 说明 |
|---|---|
| 配置目录 | `.workflow/*.yml` |
| 触发器 | push / pull_request / schedule / manual |
| Runner | SaaS Runner（Linux）/ 企业自建 |
| 模板生态 | < GitHub Marketplace |
| 免费额度 | 个人有限，企业按订阅 |

## 企业版模块

| 模块 | 能力 |
|---|---|
| 工作项 | 需求 / 任务 / 缺陷 |
| 看板 | 任务流转可视化 |
| 迭代 | Sprint 规划、燃尽图 |
| 甘特图 | 进度时间线 |
| 代码评审 | PR、Code Owner、规则 |
| 测试管理 | 用例、执行 |
| CopyCat | 代码克隆检测 |
| 统计 | 效能、贡献度 |

## 私有化部署形态

| 形态 | 规模 | 特点 |
|---|---|---|
| **单机** | 小团队 | 一台服务器 |
| **集群** | 中大型 | 多节点 + LB |
| **高可用** | 关键业务 | DB 主从、存储冗余 |

## 公开仓库审核（重要）

| 时间 | 事件 |
|---|---|
| **2022-05-18** | Gitee 公告：公开仓库「审核后上线」 |
| 影响 | 新公开库需人工审核；已公开库暂转私有待审 |
| 官方表态 | 「迫于无奈」（内容合规与版权要求）|
| 社区反响 | 广泛争议（与开源精神冲突）|
| 现状 | 公开库创建后需提交审核，通过方可公开 |

::: warning 关键差异
GitHub/GitLab 公开仓库**无需审核**即可公开。Gitee 因国内合规要求需审核——选型时务必考量。
:::

## Gitee AI 对照

| 能力 | Gitee | GitHub | GitLab |
|---|---|---|---|
| IDE 补全 | AI 队友 | **Copilot（领先）** | Duo Code Suggestions |
| 对话 | 有限 | Copilot Chat | Duo Chat |
| 模型市场 | **模力方舟** | 无 | 无 |
| 自托管模型 | 模力方舟 | Enterprise 可接 | Ultimate Self Hosted |
| 国产化适配 | **强** | 弱 | 弱 |

## 多平台选型速查

| 需求 | 推荐 |
|---|---|
| 国内速度优先 | **Gitee** |
| GitHub 镜像加速 | **Gitee** |
| 政企/等保私有化 | **Gitee 专业版** / GitLab CE |
| 国际开源 | **GitHub** |
| Copilot AI | **GitHub** |
| 一体化 DevOps + 安全 | **GitLab** |
| 开源自托管（免费）| **GitLab CE** |

## 参考

- Gitee 官网：<https://gitee.com>
- 帮助中心：<https://help.gitee.com/>
- 企业版：<https://gitee.com/enterprises>
- 私有化部署：<https://gitee.com/enterprises/private>
- Gitee Pages：<https://gitee.com/help/articles/4136>
- Gitee Go：<https://gitee.com/help/categories/100>
- 模力方舟（Gitee AI）：<https://ai.gitee.com/>
- 从 GitHub 导入：<https://gitee.com/help/articles/4155>
- Gitee 维基百科：<https://zh.wikipedia.org/zh-cn/Gitee>
