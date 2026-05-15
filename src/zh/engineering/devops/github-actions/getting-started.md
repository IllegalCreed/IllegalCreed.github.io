---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 GitHub Actions 2025 当前版本编写

## 速查

- 配置位置：`.github/workflows/*.yml`（一个仓库可以有多个工作流文件）
- 顶层关键字：`name` / `on` / `permissions` / `env` / `defaults` / `concurrency` / `jobs`
- 触发：`on: push` / `pull_request` / `schedule` / `workflow_dispatch` / `workflow_call` / 等
- Job 结构：`runs-on` + `steps`；不写 `needs` 时 jobs 默认并行
- 两种 step 形态：`uses:` 调用 Marketplace Action / `run:` 直接跑 shell
- Runner：GitHub 托管（`ubuntu-latest / macos-latest / windows-latest`）或自托管
- 上下文：<span v-pre>`${{ github.* / env.* / secrets.* / steps.<id>.outputs.* }}`</span>
- 凭据：Repo / Org / Environment Secrets；OIDC 替代长期密钥首选

## 第一份 workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - run: pnpm install --frozen-lockfile
      - run: pnpm test
      - run: pnpm build
```

push 到 main 或开 PR 时自动触发——零额外配置。

## Workflow / Job / Step 三层

```
Workflow (.yml 文件)
└── Job (jobs.<id>)            ← 一个 job 一台 Runner
    └── Step (steps[])         ← 顺序执行
        ├── uses: 调用 Action
        └── run: 跑 shell
```

- **Workflow**：一个 yml 文件 = 一条工作流，对应一次或多次触发
- **Job**：一个 job 在一台独立 Runner 上跑（多 job 默认并行，写 `needs` 串行）
- **Step**：job 内的步骤；每步要么 `uses: 某/action@vN` 调外部封装，要么 `run: command` 跑 shell

::: tip uses vs run

- `uses:` 复用别人写好的逻辑（90% 时候你想要）：`actions/checkout@v4`、`actions/setup-node@v4` 这种
- `run:` 自己写 shell 命令；多行用 `|`：
  ```yaml
  - run: |
      pnpm install
      pnpm test
  ```
- 一个 step 里只能选一个，不能同时 `uses` + `run`

:::

## 触发器（on）

最常用四种：

```yaml
on:
  # 1. 推送 / PR
  push:
    branches: [main, 'release/*']     # 分支过滤（通配符）
    paths:                            # 路径过滤（monorepo 友好）
      - 'apps/web/**'
      - 'package.json'
    tags: ['v*']
  pull_request:
    types: [opened, synchronize, reopened]  # MR 活动类型
    branches: [main]

  # 2. 定时
  schedule:
    - cron: '0 4 * * 1-5'             # 工作日凌晨 4 点 UTC

  # 3. 手动触发（UI 上有按钮 / API 调）
  workflow_dispatch:
    inputs:
      version:
        description: '版本号'
        required: true
        default: 'v1.0.0'
        type: string

  # 4. 被其它 workflow 调用（reusable workflow）
  workflow_call:
    inputs:
      target_env:
        required: true
        type: string
```

完整事件类型见 [参考](./reference.md#触发器事件全表)。

## Marketplace Action：开箱即用

最大的杀手锏。常用核心 Action：

| Action                          | 作用                              | 用法                          |
| ------------------------------- | --------------------------------- | ----------------------------- |
| `actions/checkout@v4`           | 拉取仓库代码                      | 几乎每个 workflow 第一步      |
| `actions/setup-node@v4`         | 安装 Node.js + 内置 cache         | 配合 pnpm/npm/yarn            |
| `actions/setup-python@v5`       | 安装 Python                       | Python 项目                   |
| `actions/cache@v4`              | 缓存任意路径                      | 自定义缓存（lockfile-based）  |
| `actions/upload-artifact@v4`    | 上传构建产物                      | dist / test reports           |
| `actions/download-artifact@v4`  | 下载上游 job 的产物               | 跨 job 传递文件               |
| `docker/login-action@v3`        | 登录 Docker registry              | push 镜像                     |
| `docker/build-push-action@v6`   | 构建并 push 镜像（含 BuildKit）   | 推荐替代 docker build         |
| `aws-actions/configure-aws-credentials@v6` | OIDC 拿临时凭据         | AWS 部署                      |

```yaml
- uses: actions/checkout@v4
  with:                              # 给 Action 传参数
    fetch-depth: 0                    # 拉全部历史（默认浅克隆）
    submodules: recursive

- uses: actions/setup-node@v4
  with:
    node-version: '22'
    cache: 'pnpm'                     # 内置缓存
```

::: warning 锁版本：用 commit SHA，不要用 tag

```yaml
- uses: actions/checkout@v4                          # 一般用法，跟着 v4 minor / patch
- uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11  # 完全锁定（生产推荐）
```

Marketplace 上有过供应链攻击，`v4` 这种浮动 tag 可能被换内容。生产敏感场景锁 commit SHA，加 Dependabot 自动升级。

:::

## 一份完整工作流：测试 + 构建 + 部署

```yaml
name: CI/CD

on:
  push:
    branches: [main]
    tags: ['v*']
  pull_request:
    branches: [main]

# Workflow 默认权限：read-only
permissions:
  contents: read

# 同分支并发触发时，自动取消旧的
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  # ---- 测试 ----
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node: ['20', '22']            # 多版本并行测试
      fail-fast: false
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm test:unit

  # ---- 构建（只在主干 / tag 跑） ----
  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    permissions:
      contents: read
      packages: write                  # push 到 GHCR 需要这个
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v6
        with:
          push: true
          tags: |
            ghcr.io/${{ github.repository }}:${{ github.sha }}
            ghcr.io/${{ github.repository }}:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # ---- 部署 prod（只在 tag 推送时跑） ----
  deploy:
    needs: build
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    environment: production            # 触发审批 + 注入 env-scoped secrets
    permissions:
      id-token: write                  # OIDC 必备
      contents: read
    steps:
      - uses: aws-actions/configure-aws-credentials@v6
        with:
          role-to-assume: arn:aws:iam::123456789:role/github-actions-prod
          aws-region: ap-southeast-1
      - run: aws ecs update-service --cluster prod --service web --force-new-deployment
```

把它丢到 `.github/workflows/ci.yml`，下次 push 即生效。

## Runner：GitHub 托管 vs 自托管

| Runner 类型 | 优点                              | 缺点                       | 配额（公共仓库）     |
| ----------- | --------------------------------- | -------------------------- | -------------------- |
| GitHub 托管 | 零运维 + Linux/Win/macOS 三平台   | 性能固定 + 私有库收 minute | 开源免费             |
| 自托管      | 性能 / 网络 / 硬件自由            | 自己装 + 维护              | 不计 GitHub minute   |

GitHub 托管默认 `ubuntu-latest` (2 vCPU, 7 GB RAM, 14 GB SSD)；macOS arm64、Windows、大内存 / GPU 机型都需付费 (`runs-on: ubuntu-latest-8-cores` 之类的 larger runner)。

自托管 Runner 用 `runs-on: [self-hosted, linux, x64]` 调度——多个标签都要匹配。

## 下一步

- yml 完整字段（job/step 全字段、cache、artifacts、services）见 [指南 - 基础](./guide-line/base.md)
- `matrix` / `needs` / `outputs` / `if 表达式` / `contexts` / `concurrency` / `environments` 见 [指南 - 进阶](./guide-line/advanced.md)
- 自定义 Action（JS / Docker / Composite）+ Reusable Workflow + OIDC 部署 + 自托管 Runner 见 [指南 - 高级](./guide-line/expert.md)
- 与 GitLab CI / Jenkins 对比 + 性能 / 安全 / 常见陷阱见 [指南 - 其他](./guide-line/other.md)
- 完整关键字 / Marketplace Action 速查见 [参考](./reference.md)
