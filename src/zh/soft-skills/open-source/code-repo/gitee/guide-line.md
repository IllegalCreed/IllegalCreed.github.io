---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 Gitee 官方站点与帮助中心编写（gitee.com / help.gitee.com，2026.07）—— 镜像自动化 / Go 进阶 / 企业版协作 / 私有化 / CopyCat / AI / 多平台协同 / 选型

## GitHub 镜像自动化

### 自动同步（Pull 镜像）

Gitee 仓库设置提供「**强制同步**」按钮，配置后 Gitee 定期从 GitHub 拉取最新代码：

1. Gitee 仓库 → 管理 → **仓库同步管理**
2. 填 GitHub 仓库地址 + token
3. 选同步方向（GitHub → Gitee）
4. 设置同步频率

### 双向保持一致（CI 推送）

更可控的是用 CI 在 GitHub Actions 里 push 镜像到 Gitee：

```yaml
# GitHub Actions: push 后同步到 Gitee
name: Mirror to Gitee
on: [push]
jobs:
  mirror:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - run: |
          git remote add gitee https://${{ secrets.GITEE_USER }}:${{ secrets.GITEE_TOKEN }}@gitee.com/${{ secrets.GITEE_USER }}/${{ github.event.repository.name }}.git
          git push gitee --all --force
          git push gitee --tags --force
```

::: warning 镜像方向
Gitee 的「强制同步」是 Gitee 拉 GitHub（Pull）。若你在 Gitee 直接改了代码再想推回 GitHub，需用 Push 方向或 CI 推送，单向 Pull 会覆盖 Gitee 改动。
:::

## Gitee Go 流水线进阶

### 触发器

| 触发 | 说明 |
|---|---|
| `push` | 推代码 |
| `pull_request` | PR 操作 |
| `schedule` | 定时 |
| `manual` | 手动 |

### Runner

| Runner | 说明 |
|---|---|
| **SaaS Runner** | Gitee 提供（Linux 为主）|
| **企业自建 Runner** | 企业版可注册私有 Runner |

```yaml
jobs:
  build:
    runs-on: ubuntu       # SaaS Runner
    # 或 runs-on: self-hosted  # 企业自建
```

### 与 GitHub Actions 的差异

- **模板生态**：Gitee Go 模板库 < GitHub Marketplace（数量与质量）
- **配置位置**：`.workflow/*.yml`（vs GitHub `.github/workflows/`）
- **免费额度**：Gitee Go 个人免费额度有限，企业版按订阅

## 企业版研发协作

Gitee 企业版把代码托管与项目管理打通：

| 模块 | 能力 |
|---|---|
| **需求/任务/缺陷** | 工作项跟踪、看板、甘特图 |
| **迭代（Sprint）** | 规划、燃尽图 |
| **代码评审** | PR、评审规则、Code Owner |
| **测试管理** | 测试用例、执行 |
| **统计度量** | 效能报表、贡献度 |
| **CopyCat** | 代码克隆检测（企业版特色）|

### 工作项关联

需求/任务/缺陷与 PR/commit 用编号关联（如 `#123`），merge 时可自动关闭关联工作项。

## 私有化部署（专业版）

### 适用场景

- **数据本地化**：金融/政企/军工，代码不能出内网
- **等保/信创**：国产化合规要求
- **离线/内网**：研发网与互联网隔离

### 部署形态

| 形态 | 说明 |
|---|---|
| **单机部署** | 小团队，一台服务器 |
| **集群部署** | 中大型，多节点 + 负载均衡 |
| **高可用** | 数据库主从、存储冗余 |

私有化版本与 SaaS 功能基本对齐，但需自行运维（升级、备份、监控）。

## CopyCat 代码克隆检测

Gitee 企业版内置的代码查重能力：

- **跨仓库查重**：检测企业内部仓库间的代码克隆
- **开源代码比对**：与开源库比对，识别未声明引用
- **入职代码审计**：新员工带入代码的合规检查
- **报告输出**：重复率、相似片段定位

这对大企业的代码资产合规与知识产权保护很有价值。

## Gitee AI（AI 队友 / 模力方舟）

### AI 队友

- IDE 内代码补全、生成
- 代码解释、注释生成
- 体验与生态广度不及 GitHub Copilot

### 模力方舟（Gitee AI）

- 开源模型托管（国产模型为主）
- 数据集市场
- 应用市场
- 提供 AI 推理 API（对接国产算力）

适合对接国产化 AI 生态、满足信创要求的场景。

## 多平台协同（GitHub + GitLab + Gitee）

国内团队常见的「三仓协同」拓扑：

```
GitHub（主仓 + 开源 + Copilot）
   ↓ 镜像
Gitee（国内加速 + 国内开源发布）
   ↕
GitLab（内置 CI + 安全扫描，可自建）
```

### 典型分工

| 平台 | 角色 |
|---|---|
| **GitHub** | 国际开源主仓、Copilot 编程、Issue 国际协作 |
| **Gitee** | 国内镜像（clone 加速）、国内开源发布、企业私有化 |
| **GitLab** | 内置 CI/CD、安全扫描、DevSecOps（可自建内网）|

### 同步策略

- GitHub → Gitee：Gitee 强制同步（Pull）或 Actions 推送
- GitHub → GitLab：GitLab Pull mirroring
- 主仓唯一：明确「以哪个为源」，避免双向冲突

## 选型决策

### 选 Gitee 的场景

- 团队/用户主要在国内，clone/push 速度优先
- 需 GitHub 国内镜像
- 政企/金融需私有化部署与等保合规
- 信创/国产化要求

### 选 GitHub 的场景

- 参与国际开源
- 需要 Copilot AI 编程
- 需要 Marketplace 海量 Action
- 团队国际化

### 选 GitLab 的场景

- 要一体化 DevOps + 内置 CI
- 要内建安全扫描（DevSecOps）
- 要开源自托管（CE）

::: warning 边界提醒
本叶讲 **Gitee 平台功能与国内定位**。Git 命令用法（clone/push/rebase）归版本控制章；Gitee Go 流水线语法细节可参考其帮助中心；敏捷方法论（Scrum/Kanban）归软件工程章，本叶只讲 Gitee 企业版如何承载这些实践。
:::
