---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 GitHub 官方文档 —— 产品矩阵 / Actions 字段全表 / Runner / Copilot 计费 / 计划对比 / 安全 / 迁移

## GitHub 产品矩阵

| 产品 | 定位 | 典型用户 |
|---|---|---|
| **GitHub.com**（SaaS）| 云端托管 + 全套协作 | 个人、团队、开源 |
| **GitHub Enterprise Cloud** | 云端企业版（多 org、合规）| 企业 |
| **GitHub Enterprise Server** | 自托管（内网部署）| 强合规、内网企业 |
| **GitHub Actions** | CI/CD | 所有 |
| **GitHub Packages** | 制品仓库 | 所有 |
| **GitHub Pages** | 静态站托管 | 文档、博客、项目主页 |
| **GitHub Codespaces** | 云端 IDE（按计算分钟）| 远程开发 |
| **GitHub Copilot** | AI 编程助手 | 所有 |
| **GitHub Marketplace** | 第三方 Action/App 商店 | 扩展生态 |

## 计划与免费额度（2026）

| 计划 | 价格 | Actions 分钟/月 | Packages 存储 | 备注 |
|---|---|---|---|---|
| **Free** | $0 | 2000（私有库）/ 无限（公开库）| 500MB | 无限私有库、无限协作者 |
| **Pro** | $4/月 | 3000 | 1GB | 个人开发者增强 |
| **Team** | $4/user/月 | 3000 | 2GB | 团队协作 |
| **Enterprise** | $21/user/月 | 50000 | 50GB | SSO、审计、合规 |

- **公开仓库的 Actions 永久免费、无分钟限制**（这是开源项目零成本 CI 的基础）
- **Runner OS 倍率**：Linux ×1、Windows ×2、macOS ×10（macOS 跑 1 分钟扣 10 分钟额度）
- **Codespaces**：免费 120 核小时/月（2 核）、15GB 存储

## GitHub Actions workflow 字段速查

### 顶层

| 字段 | 说明 |
|---|---|
| `name` | workflow 名 |
| `on` | 触发器 |
| `env` | 全局环境变量 |
| `permissions` | GITHUB_TOKEN 权限 |
| `concurrency` | 并发控制（同分支只跑最新）|
| `jobs` | 任务集合 |

### job 字段

| 字段 | 说明 |
|---|---|
| `runs-on` | Runner（`ubuntu-latest` / `self-hosted`）|
| `needs` | 依赖的 job |
| `if` | 条件 |
| `steps` | 步骤列表 |
| `environment` | 引用部署环境（用其 secrets）|
| `strategy` | matrix 矩阵 |
| `timeout-minutes` | 超时（默认 360）|
| `continue-on-error` | 失败是否继续 |
| `services` | 附属容器（如 postgres/mysql）|

### step 字段

| 字段 | 说明 |
|---|---|
| `name` | 步骤名 |
| `uses` | 调用 Action（`actions/checkout@v4`）|
| `with` | 传给 Action 的参数 |
| `run` | 跑 shell 命令 |
| `env` | 环境变量 |
| `if` | 条件 |
| `working-directory` | 工作目录 |

### 触发器一览

| 触发器 | 触发时机 |
|---|---|
| `push` | 推代码 |
| `pull_request` | PR 操作（opened/synchronize/closed）|
| `schedule` | 定时（cron，UTC）|
| `workflow_dispatch` | 手动（UI / API）|
| `repository_dispatch` | 外部 API |
| `release` | 发布 release |
| `issue` / `issue_comment` | Issue 操作 |
| `workflow_call` | 被其它 workflow 调用 |
| `page_build` | Pages 构建 |
| `watch` | Star |

## 常用官方 Action

| Action | 用途 |
|---|---|
| `actions/checkout@v4` | 拉代码（默认不拉，必须显式）|
| `actions/setup-node@v4` | 装 Node |
| `actions/setup-python@v5` | 装 Python |
| `actions/setup-java@v4` | 装 Java |
| `actions/cache@v4` | 缓存依赖 |
| `actions/upload-artifact@v3` | 上传构建产物 |
| `actions/download-artifact@v3` | 下载产物 |
| `actions/upload-pages-artifact@v3` | 打包 Pages 产物 |
| `actions/deploy-pages@v4` | 部署 Pages |
| `github/codeql-action` | CodeQL 安全扫描 |

## Runner 对照

| Runner | OS | 倍率 | 计费 |
|---|---|---|---|
| `ubuntu-latest` | Linux | ×1 | 私有库扣额度 |
| `windows-latest` | Windows | ×2 | 私有库扣额度 |
| `macos-latest` | macOS | ×10 | 私有库扣额度 |
| `self-hosted` | 任意 | 免费 | 私有库也免费（自己出机器成本）|

`ubuntu-latest` 当前指向 Ubuntu 24.04（随时间更新）。

## Copilot 计费（2026-06-01 用量制）

| 计划 | 月费 | 含 AI Credits | 促销期额外 |
|---|---|---|---|
| **Pro** | $10/月 | $10 | - |
| **Pro+** | $39/月 | $39 | - |
| **Business** | $19/user/月 | $19 | 2026.06-08 月 +$30 促销 |
| **Enterprise** | $39/user/月 | $39 | 2026.06-08 月 +$70 促销 |

- **计量单位**：GitHub AI Credits（替代旧 Premium Request Units / PRUs）
- **消耗依据**：token 用量（输入/输出/缓存）× 各模型 API 费率
- **不消耗 Credits**：代码补全、Next Edit 建议
- **消耗 Credits**：Chat、Agent、Copilot Review（Review 还额外扣 Actions 分钟）
- **超额**：可买 Credits 或开启 overage 按发布费率计费
- **管理**：enterprise / cost center / user 三级 budget，可设上限或允许 overage
- **池化**：组织内未用 Credits 可跨用户共享
- **迁移**：月付用户 2026-06-01 自动迁移；年付用户到期前维持旧价（但模型倍率 06-01 同步调整）

## Pages 速查

| 项 | 说明 |
|---|---|
| 站点地址 | `https://&lt;user&gt;.github.io/<repo>` 或 `https://&lt;user&gt;.github.io`（用户名仓库）|
| 源 | 分支 + 目录（`/` 或 `/docs`），或 GitHub Actions 部署 |
| 自定义域名 | Settings → Pages → Custom domain，CNAME 指向 |
| HTTPS | 自带 Let's Encrypt |
| 流量 | 不限 |
| 构建工具 | Jekyll（默认）/ VitePress / Docusaurus / Hugo（用 Actions）|

## 安全能力对照

| 能力 | 作用 | 计划 |
|---|---|---|
| **Dependabot alerts** | 依赖漏洞告警 | Free |
| **Dependabot updates** | 自动开 PR 升级依赖 | Free |
| **Secret scanning** | 扫描泄露的 token | Free（公开库）/ 付费（私有库）|
| **Code scanning (CodeQL)** | 代码安全分析 | Free（公开库）|
| **Branch protection** | 分支保护规则 | Free |
| **Required reviewers** | 强制评审人数 | Free |
| **Environment protection** | 部署环境保护 | Free |
| **Audit log** | 审计日志 | Enterprise |

## 平台对比速查

| 维度 | GitHub | GitLab | Gitee |
|---|---|---|---|
| CI/CD | Actions（生态强）| built-in（深度集成）| Go（轻量）|
| AI 助手 | Copilot（领先）| Duo | AI 队友 |
| 自托管 | Enterprise Server | CE/EE | 企业版私有化 |
| 国内速度 | 慢 | 中 | 快 |
| 开源生态 | 全球第一 | 中 | 国内为主 |
| 公开库审核 | 无 | 无 | 需人工审核 |

## 迁移

| 方向 | 工具 |
|---|---|
| GitHub → GitLab | GitLab 导入工具（URL + token）|
| GitHub → Gitee | Gitee 「导入 GitHub 仓库」（OAuth 授权）|
| 任意 → GitHub | `git remote add` + `git push`，或 GitHub Importer |

## 参考

- 官方文档：<https://docs.github.com/>
- Actions 文档：<https://docs.github.com/actions>
- Packages 文档：<https://docs.github.com/packages>
- Pages 文档：<https://docs.github.com/pages>
- Copilot 文档：<https://docs.github.com/copilot>
- Copilot 用量计费公告：<https://github.blog/news-insights/company-news/github-copilot-is-moving-to-usage-based-billing/>
- 定价：<https://github.com/pricing>
- Marketplace：<https://github.com/marketplace>
