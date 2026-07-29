---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 GitHub 官方文档与 GitHub Blog 编写（github.com，2026.07）—— Actions 进阶 / Secrets / Runner / Packages / Pages / Copilot 用量 / 安全 / 治理 / 多平台协同

## Actions 进阶

### 触发器（Triggers）

```yaml
on:
  push:
    branches: [main, "release/*"]
    paths: ["src/**"]            # 仅这些路径变更才触发
  pull_request:
    types: [opened, synchronize] # PR 打开/更新时
  schedule:
    - cron: "0 2 * * *"          # 每天 02:00 UTC（注意 cron 用 UTC）
  workflow_dispatch:             # 手动触发（UI 按钮 / API）
    inputs:
      env:
        description: "部署环境"
        default: "staging"
  repository_dispatch:           # 外部 API 触发
  release:
    types: [published]
```

### Matrix 矩阵构建

一次定义多版本/多平台并行：

```yaml
strategy:
  matrix:
    os: [ubuntu-latest, macos-latest, windows-latest]
    node: [18, 20, 22]
  fail-fast: false               # 某个失败不取消其余
steps:
  - run: echo "${{ matrix.os }} node ${{ matrix.node }}"
```

`fail-fast: false` 让所有组合都跑完，便于定位哪个环境坏了。

### 条件执行（if）

```yaml
- if: github.ref == 'refs/heads/main'   # 仅 main 分支
- if: github.event_name == 'pull_request'
- if: success()       # 上一步成功
- if: always()        # 无论成功失败都跑（发通知常用）
- if: failure()       # 失败时跑
```

### Job 依赖（needs）

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
  test:
    needs: build                   # 等 build 完才跑
  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
```

### 缓存依赖

```yaml
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

`setup-node` 内置缓存更省事：`cache: 'npm'`。

### 复用 workflow / Composite Action

```yaml
# 调用可复用 workflow
jobs:
  call-ci:
    uses: org/repo/.github/workflows/ci.yml@main
    secrets: inherit
```

把通用流程抽成 reusable workflow 或 composite action，多仓库共享。

## Secrets 与变量

| 类型 | 作用域 | 用法 |
|---|---|---|
| **Secrets**（加密）| repo / env / org | <code v-pre>`${{ secrets.TOKEN }}`</code> |
| **Variables**（明文）| repo / env / org | <code v-pre>`${{ vars.ENV_NAME }}`</code> |
| **Environment secrets** | 部署环境级 | 配合 `environment: production` |

```yaml
environment: production        # 引用 environment，用其 secrets
steps:
  - run: deploy.sh
    env:
      API_KEY: ${{ secrets.PROD_API_KEY }}
      REGION: ${{ vars.DEPLOY_REGION }}
```

**<code v-pre>`${{ secrets.GITHUB_TOKEN }}`</code>** 是 Actions 自动注入的临时 token，无需手动配，可 push 代码、调 API。发布包、触发其它 workflow 需用 PAT（Personal Access Token）或 GitHub App token。

## Runner 选择与自建

| Runner | 计费 | 适用 |
|---|---|---|
| **GitHub-hosted**（ubuntu/windows/macos-latest）| 按 Actions 分钟 | 通用，免运维 |
| **Self-hosted**（自建机器）| 免费（私有库也免费）| 内网、特殊硬件、GPU、大数据 |

```yaml
runs-on: self-hosted                # 你的自建 Runner
runs-on: [self-hosted, linux, gpu]  # 加 label 精确匹配
```

::: warning 自建 Runner 安全
自建 Runner 跑公开仓库的 PR 代码会有安全风险（恶意 PR 执行任意命令）。公开仓库务必用 GitHub-hosted，自建仅用于可信私有库。
:::

## Packages 私有包

```yaml
# 发布
- run: npm publish
  env:
    NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

# 消费（其它仓库）
# .npmrc:
# @my-org:registry=https://npm.pkg.github.com
# //npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

Docker 镜像用 `ghcr.io`：

```yaml
- uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}
- run: |
    docker build -t ghcr.io/${{ github.repository }}:latest .
    docker push ghcr.io/${{ github.repository }}:latest
```

## Pages + 静态站生成器

```yaml
# VitePress / Docusaurus 一键部署
name: Deploy Pages
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci && npm run build
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: github-pages
    steps:
      - uses: actions/deploy-pages@v4
```

`permissions` 必须显式声明 `pages: write` 与 `id-token: write`，否则部署失败。

## Copilot 用量管控（2026）

2026-06-01 起 Copilot 转 **usage-based billing**，组织需做用量治理：

- **GitHub AI Credits**：替代旧的 Premium Request Units (PRUs)，按 token + 模型费率消耗
- **管理控制**：企业级 / 成本中心 / 用户级三层 budget，可设上限或允许 overage
- **Credits 池化**：组织内未用 Credits 可跨用户共享，避免「有人超额有人浪费」
- **不消耗 Credits 的**：代码补全、Next Edit 建议（仍含在订阅内）
- **消耗 Credits 的**：Chat 对话、Agent 任务、Copilot Review、调用高级模型
- **预览账单**：2026-05 起可在 Settings 看预估账单

::: warning 用量计费陷阱
用量计费后，重度 Agent/Chat 用户账单可能远超订阅价。务必设 budget 上限、监控 AI Credits 消耗、教育团队优先用补全而非长对话。
:::

## 安全能力

| 能力 | 作用 |
|---|---|
| **Dependabot** | 依赖漏洞扫描 + 自动开 PR 升级 |
| **Secret Scanning** | 扫到仓库里泄露的 token/API key 并告警 |
| **CodeQL** | 语义化代码安全分析（SQL 注入、XSS 等）|
| **Branch protection** | 强制 PR/CI/Review 才能合 main |
| **Required reviews** | 至少 N 人 approve 才可 merge |
| **Status checks** | CI 必须绿才能 merge |

```yaml
# Dependabot 配置 .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
```

## 组织与企业治理

| 层级 | 关键能力 |
|---|---|
| **Organization** | Team 分组、统一计费、SSO（SAML）、org 级 secrets/actions |
| **Enterprise** | 多 org、合规审计、IP 允许列表、统一计费、Enterprise Server 自建 |
| **Branch protection** | 锁 main、强制 review/CI、禁 force push |
| **CODEOWNERS** | 按路径指定负责人，PR 自动加 reviewer |

`CODEOWNERS` 示例：

```
*                        @org/maintainers
/src/frontend/           @org/frontend-team
/src/backend/            @org/backend-team @alice
/package-lock.json       @org/infra
```

## 与 GitLab / Gitee 协同

- **镜像**：GitHub 主仓库 → 推镜像到 GitLab/Gitee 做备份或国内加速
- **CI 双跑**：GitHub Actions 跑国际 CI，GitLab CI/Gitee Go 跑国内 CI
- **迁移**：GitLab/Gitee 都提供 GitHub 仓库导入工具

```bash
# 镜像推送到 Gitee
git remote add mirror https://gitee.com/user/repo.git
git push mirror --all
```

::: warning 边界提醒
本叶讲 **GitHub 平台功能**（托管、Actions、Packages、Pages、Copilot、协作）。Git 命令用法（`git clone/commit/push/rebase`）、分支策略（Git Flow/Trunk-based）属于「版本控制」章，不在本叶范围。
:::
