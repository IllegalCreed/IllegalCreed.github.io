---
layout: doc
---

# GitHub Actions

GitHub 自家的 CI/CD 系统，2018 年公测、2019 年正式发布。工作流配置文件放在仓库 `.github/workflows/*.yml`，与代码同版本控制；GitHub 直接提供托管 Runner（Linux / macOS / Windows 全平台），无需自己搭机器。最大的差异化是 **Marketplace 生态**——一万多个开箱即用 Action，从 `actions/checkout` 到云厂商 OIDC 登录，"装一行就能用"。

## 评价

**优点**

- **零运维起步**：开源项目永久免费 + 私有库每月 2000 分钟免费，新项目第一天就能跑
- **Marketplace 生态最广**：15000+ Actions，云厂商 / 容器 / 安全扫描 / 部署工具基本都有官方 Action
- **OIDC 替代长期密钥**：与 AWS / Azure / GCP / Vault 联邦认证，无需把云凭据塞 secrets
- **触发器最丰富**：`push / pull_request / workflow_dispatch / schedule / repository_dispatch / workflow_run / 自定义事件`，配合 GitHub 仓库事件丰富度无敌
- **与 PR / Issue / Release / Pages / Codespaces 一体**：状态徽章、合并前必过检查、Code Scanning、Dependabot 全部联动
- **Composite Actions + Reusable Workflows**：两套复用机制覆盖 step 级与 workflow 级

**缺点**

- **自托管 Runner 路径较少**：私有部署 GitHub Enterprise 才有完整自托管能力，且不如 GitLab 的多 executor 模式丰富
- **YAML 表达力有限**：跨 job 数据流要走 outputs + needs，复杂逻辑写得绕；调试要靠 `act` 工具本地模拟
- **第三方 Action 安全风险**：Marketplace 上有不少业余 Action 被供应链攻击过；生产里要锁 commit SHA 而非 tag
- **私有库免费配额不算多**：Pro / Team / Enterprise 各档容量差异大，密集 CI 需要花钱
- **monorepo 不友好**：触发器按整个仓库工作，要按子目录拆 workflow 得用 `paths: filter` + `workflow_dispatch` 凑

## 评价（个人 GitHub 用法）

对个人开源 / 副业项目来说，GHA 是默认选择——开源仓库永久免费、Marketplace 覆盖几乎所有需要、零配置零运维。学一遍 yml + 几个常用 Action（`checkout / setup-node / cache / upload-artifact`）就能搞定 95% 的场景。私有库 2000 分钟/月免费对个人也基本够用，超出再考虑买 minutes 或自托管 Runner。

## 文档地址

[GitHub Actions Documentation](https://docs.github.com/en/actions)

## GitHub 地址

GitHub Actions 本身是 GitHub 内置功能，没有独立仓库。Runner 开源在 [actions/runner](https://github.com/actions/runner)；常用核心 Actions 集中在 [github.com/actions](https://github.com/actions)（如 `checkout / setup-node / cache / upload-artifact`）。

## 幻灯片地址

<a href="/SlideStack/github-actions-slide/" target="_blank">GitHub Actions</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=github-actions" target="_blank" rel="noopener noreferrer">GitHub Actions 测试题</a>
