---
layout: doc
outline: [2, 3]
---

# 指南 - 基础

> 基于 GitHub Actions 2025 当前版本编写 — `.yml` 完整字段速学

## 速查

- `on`：触发器；最常用 `push / pull_request / schedule / workflow_dispatch / workflow_call`
- `permissions`：`GITHUB_TOKEN` 默认权限；2023+ 默认 read-only，需写权限要显式声明
- `env`：三层（workflow / job / step），后者优先级高
- `defaults.run`：所有 `run:` 步骤的默认 `shell` / `working-directory`
- `concurrency`：同组任务自动排队 / 取消旧任务
- `jobs.<id>.runs-on`：Runner（GitHub-hosted 或 self-hosted labels）
- `steps[].uses` vs `steps[].run`：互斥，一个 step 只能选其一
- `services:`：旁路容器（Postgres / Redis）；与 GitLab CI 的 services 概念一致
- `container:`：让 job 整个跑在容器里（替代 Runner 默认 host）

## on：触发器全面看

### push / pull_request：最常用

```yaml
on:
  push:
    branches: [main, 'release/*']      # 支持 glob
    branches-ignore: ['dev/*']         # 反向排除（不能与 branches 同用）
    tags: ['v*']
    paths:                             # 只在改了这些路径时触发
      - 'apps/web/**'
      - '!apps/web/**.md'
  pull_request:
    types: [opened, synchronize, reopened, labeled]  # 默认前三种
    branches: [main]
    paths-ignore: ['docs/**']
```

### schedule：定时

```yaml
on:
  schedule:
    - cron: '0 4 * * 1-5'              # UTC 时间！工作日凌晨 4 点
    - cron: '*/30 * * * *'             # 每 30 分钟
```

::: warning schedule 是 UTC 不是本地时间

`0 4 * * *` 是 UTC 04:00 = 北京 12:00。要按本地时间排时记得换算；GitHub 不支持 cron 加时区参数。

:::

### workflow_dispatch：手动 + 参数化

```yaml
on:
  workflow_dispatch:
    inputs:
      target_env:
        description: '部署环境'
        required: true
        default: 'staging'
        type: choice
        options: [staging, production]
      dry_run:
        type: boolean
        default: false
      version:
        type: string
```

UI 上会弹出表单让人填，填完才触发；适合"手动发布"、"灰度测试"等场景。

### workflow_call：被其它 workflow 调

详见 [进阶 - Reusable Workflows](../guide-line/expert.md#reusable-workflows)。

### 多触发器组合

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 6 * * *'
  workflow_dispatch:
  repository_dispatch:                  # API 触发（外部系统 webhook）
    types: [deploy]
```

判断当前是哪种触发用 `github.event_name`：

```yaml
if: github.event_name == 'pull_request'
```

## permissions：最重要的安全开关

`GITHUB_TOKEN` 是 GitHub 自动给每个 job 注入的临时令牌（每次 job 都换）。默认权限受组织/仓库设置和 yml 共同决定。

2023 起 GitHub 推动"最小权限默认 read-only"——新仓库 / 新组织默认是 read-only，写操作要显式声明：

```yaml
permissions:                           # workflow 级
  contents: read
  pull-requests: write                  # 评论 PR / 加 label
  issues: read
  packages: write                       # push 到 GHCR
  id-token: write                       # OIDC 必备

jobs:
  deploy:
    permissions:                       # job 级覆盖（可缩小不可扩大）
      contents: read
      id-token: write
```

::: tip 经验法则

- 默认全部 `read` 都不用写——开头先 `contents: read`
- 哪个 step 要写就明确加哪个权限
- **id-token: write 只在用 OIDC 时给**——会让 GITHUB_TOKEN 拿到 cloud federation 能力

详细权限清单见 [参考](../reference.md#github_token-permissions-完整列表)。

:::

## env：三层环境变量

```yaml
env:
  REGION: ap-southeast-1                # workflow 级

jobs:
  build:
    env:
      NODE_ENV: production              # job 级（覆盖 workflow）
    steps:
      - run: echo $REGION $NODE_ENV     # 两个都能拿到
      - run: echo $LOG_LEVEL
        env:
          LOG_LEVEL: debug              # step 级（最高优先级）
```

定义在 yml 里的变量不适合放敏感值。机密用 `secrets:` 上下文（UI 配置），非机密配置用 `vars:` 上下文（同样 UI 配置但不打码）。

## defaults：默认 shell 和工作目录

```yaml
defaults:
  run:
    shell: bash                         # 所有 run 步骤默认 shell
    working-directory: ./apps/web       # monorepo 友好

jobs:
  test:
    defaults:                          # job 级覆盖
      run:
        working-directory: ./apps/api
```

支持的 `shell` 值：`bash` / `sh` / `pwsh` / `powershell` / `python` / `cmd`，或自定义命令模板。

## concurrency：自动排队 / 取消

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true              # 同分支新 push 取消旧 job
```

常用 group 表达式：

```yaml
group: deploy-prod                       # 永远只跑一个（部署队列）
group: ${{ github.workflow }}            # 同 workflow 同时只跑一个
group: ${{ github.workflow }}-${{ github.ref }}   # 同分支同时只跑一个（最常用）
group: ${{ github.workflow }}-${{ github.head_ref || github.ref }}  # PR 用 head_ref，避免 PR 和 push 撞
```

`cancel-in-progress`：

- `true`：新触发取消正在跑的（push 频繁的项目省 minutes）
- `false`：新触发排队等（部署 job 必须用 false，不能取消）

## jobs.runs-on：Runner 选择

```yaml
jobs:
  job_a:
    runs-on: ubuntu-latest               # GitHub-hosted Linux

  job_b:
    runs-on: macos-latest                # GitHub-hosted macOS

  job_c:
    runs-on: windows-latest              # GitHub-hosted Windows

  job_d:
    runs-on: ubuntu-latest-8-cores       # GitHub-hosted larger runner（付费）

  job_e:
    runs-on: [self-hosted, linux, x64, gpu]   # 自托管（多标签全匹配才调度）
```

`ubuntu-latest` 实际是滚动更新的（如 24.04），生产想锁版本写 `ubuntu-24.04`。

## steps[].uses vs steps[].run

一个 step **只能选其一**：

```yaml
# ✅ uses
- uses: actions/setup-node@v4
  with:
    node-version: '22'

# ✅ run
- name: Install
  run: pnpm install --frozen-lockfile
  shell: bash
  working-directory: ./apps/web

# ❌ 同时写会报错
- uses: actions/setup-node@v4
  run: echo hi
```

`run:` 多行用 `|`，单行可省：

```yaml
- run: pnpm test                         # 单行

- run: |
    pnpm install
    pnpm test
    pnpm build                           # 多行（保留换行 + 缩进）
```

## with：给 Action 传参

```yaml
- uses: actions/upload-artifact@v4
  with:
    name: build-output                   # 必填 inputs
    path: dist/
    retention-days: 7                    # 选填，覆盖默认 90 天
    if-no-files-found: error             # warn(默认) / error / ignore
```

每个 Action 的 inputs 在它的 README 或 `action.yml` 里——`uses` 行命中 ⌘+点击直接跳。

## services：旁路容器

跟 GitLab CI 的 services 一致，job 跑前先拉起这些容器：

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: ci
          POSTGRES_PASSWORD: ci
          POSTGRES_DB: testdb
        ports:
          - 5432:5432                    # 映射到 host
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
    steps:
      - uses: actions/checkout@v4
      - run: pnpm test:integration
        env:
          DATABASE_URL: postgres://ci:ci@localhost:5432/testdb
          REDIS_URL: redis://localhost:6379
```

注意：与 GitLab 不同，GHA services 需要显式 `ports` 映射才能从 host 访问。`options` 写 Docker 启动参数（健康检查、network 等）。

## container：让整个 job 跑在容器里

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    container:
      image: node:22-alpine
      env:
        NODE_ENV: test
      volumes:
        - /tmp:/tmp                      # 自定义挂载
      options: --cpus 4                  # 资源限制
    steps:
      - uses: actions/checkout@v4
      - run: node --version              # 跑在 node:22-alpine 里
```

适合：runner 默认环境没有你要的依赖，又不想花 step 装。注意 services + container 一起用时，services 的网络对 container 内的 host 是 services 名（如 `postgres`），不是 `localhost`。

## artifacts：上传 / 下载产物

```yaml
# 上游：上传
- uses: actions/upload-artifact@v4
  with:
    name: build-output                  # 必填
    path: |                             # 可多路径
      dist/
      coverage/
    retention-days: 7                    # 默认 90 天，公共仓库最多 90
    if-no-files-found: error             # 严格检查

# 下游：下载
- uses: actions/download-artifact@v4
  with:
    name: build-output                   # 同名抓回
    path: ./artifacts                    # 解压目标
```

跨 job 传文件 = upload + needs + download 三件套。注意 artifacts 是 GitHub 服务端存的，**单文件大、artifacts 名同名会冲突**——多 job 上传同名要加后缀（如 <span v-pre>`build-${{ matrix.os }}`</span>）。

## cache：缓存

```yaml
- uses: actions/cache@v4
  id: pnpm-cache
  with:
    path: |
      ~/.local/share/pnpm/store
      node_modules
    key: ${{ runner.os }}-pnpm-${{ hashFiles('pnpm-lock.yaml') }}
    restore-keys: |
      ${{ runner.os }}-pnpm-

- if: steps.pnpm-cache.outputs.cache-hit != 'true'
  run: pnpm install --frozen-lockfile     # cache 命中就跳过 install
```

最佳实践：

- **key** 用 `hashFiles('pnpm-lock.yaml')` 让 lockfile 决定 hash；lock 变了换 cache 是合理的
- **restore-keys** 是降级前缀：精确 hash 没命中时按前缀找最近的旧 cache 复用
- 多个 setup-X Action（`setup-node`, `setup-python`, `setup-go`）都自带 `cache:` 参数，能用就用，省去自己写 `actions/cache`

## artifacts vs cache 速查

| 维度        | artifacts                  | cache                      |
| ----------- | -------------------------- | -------------------------- |
| 目的        | 跨 job / 下载 / 保留产物   | 加速重复 install / 编译    |
| 存储        | GitHub 服务端              | GitHub 服务端              |
| 跨 workflow | ❌                         | ✅（按 key 复用）          |
| 失败时上传  | `if: always()` 配合 step    | 失败也会保存               |
| 大小限制    | 单 workflow 10 GB（默认）   | 单 cache 10 GB             |
| 典型用法    | dist / test report         | node_modules / .pnpm-store |
