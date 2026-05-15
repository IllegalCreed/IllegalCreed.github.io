---
layout: doc
outline: [2, 3]
---

# 指南 - 进阶

> matrix / needs / outputs / contexts / environments / concurrency 深入

## 速查

- `strategy.matrix`：多维度并行，配 `include / exclude` 精修
- `needs`：job 间依赖；可拿到上游 `outputs`
- `outputs`：step → job → workflow 三级映射
- <span v-pre>`${{ }}`</span> 表达式：常用 `github.* / env.* / secrets.* / steps.<id>.outputs.* / needs.<job>.outputs.*`
- 函数：`success() / failure() / always() / cancelled() / contains() / startsWith() / endsWith() / fromJSON() / toJSON() / hashFiles()`
- `if:` 条件：表达式不写 <span v-pre>`${{ }}`</span>（GitHub 自动识别）
- `environment:` 绑定部署目标 → 触发审批 / env-scoped secrets / URL 跟踪
- `concurrency`：deploy 类用 `cancel-in-progress: false`，CI 类用 true

## strategy.matrix：多维度并行

最简：一维

```yaml
jobs:
  test:
    strategy:
      matrix:
        node: ['18', '20', '22']
        fail-fast: false               # 一个失败不中断其它
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
      - run: pnpm test
```

多维：笛卡尔积

```yaml
strategy:
  matrix:
    os: [ubuntu-latest, macos-latest, windows-latest]
    node: ['18', '20', '22']
    # → 9 个组合并发
  fail-fast: false
runs-on: ${{ matrix.os }}
```

### include / exclude 精修

```yaml
strategy:
  matrix:
    os: [ubuntu-latest, macos-latest]
    node: ['20', '22']

    include:                            # 追加额外组合
      - os: ubuntu-latest
        node: '22'
        experimental: true              # 给特定组合加额外变量
      - os: ubuntu-22.04                # 加一个完全独立的组合
        node: '20'

    exclude:                            # 移除某些组合
      - os: macos-latest
        node: '20'

  max-parallel: 4                       # 最多 4 个并行（节省 minutes）
  fail-fast: false
```

### 矩阵中用 outputs

```yaml
jobs:
  test:
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest]
    outputs:
      result: ${{ steps.summary.outputs.status }}
    steps:
      - id: summary
        run: echo "status=ok-${{ matrix.os }}" >> $GITHUB_OUTPUT
```

矩阵 outputs 是覆盖式的——后跑的覆盖先跑的，要拿每个矩阵成员的结果用 `matrix.os` 拼 key 自己存。

## needs：依赖与串行

```yaml
jobs:
  lint:    { runs-on: ubuntu-latest, steps: [{run: pnpm lint}] }
  test:    { runs-on: ubuntu-latest, steps: [{run: pnpm test}] }
  build:
    needs: [lint, test]                 # 等两个都成功才跑
    runs-on: ubuntu-latest
    steps: [{run: pnpm build}]
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps: [{run: ./deploy.sh}]
```

::: tip GHA 默认 jobs 并行

不像 GitLab CI 的 stages 默认串行——GHA 默认 jobs 是**全并行**的，写了 `needs` 才依赖。这是有意而为：DAG 是 first-class 概念。

:::

### 失败时的 needs 行为

默认上游失败 → 下游不跑。要强制跑：

```yaml
jobs:
  cleanup:
    needs: [build, test]
    if: always()                        # 不论成败都跑
    steps:
      - run: ./cleanup.sh

  notify:
    needs: [build]
    if: failure()                       # 仅上游失败时跑
    steps:
      - run: ./send-alert.sh
```

## outputs：跨 job / 跨 step 传值

三级映射：step → job → workflow。

### Step → Job

```yaml
jobs:
  build:
    outputs:                            # job 级 outputs
      version: ${{ steps.meta.outputs.version }}
      tag: ${{ steps.meta.outputs.tag }}
    steps:
      - id: meta                         # step 必须有 id
        run: |
          echo "version=1.2.3" >> $GITHUB_OUTPUT
          echo "tag=v1.2.3" >> $GITHUB_OUTPUT
```

要点：

- 写法 `echo "key=value" >> $GITHUB_OUTPUT`（旧 `::set-output::` 已弃用）
- step 必须有 `id:`，没 id 拿不到 outputs
- 多个值多次 echo 即可

### Job → 下游 Job

```yaml
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - run: |
          echo "Deploying ${{ needs.build.outputs.version }}"
          echo "Tag: ${{ needs.build.outputs.tag }}"
```

### Job → Workflow（用于 reusable workflow）

```yaml
on:
  workflow_call:
    outputs:
      version:
        description: '构建版本'
        value: ${{ jobs.build.outputs.version }}
```

## ${{ }} 表达式

GitHub Actions 的 yml 不能像 Groovy 那样写代码，只能用受限的"表达式语言"：

```yaml
# 字符串 / 比较
${{ github.ref == 'refs/heads/main' }}
${{ github.event_name != 'pull_request' }}

# 函数
${{ success() && contains(github.event.head_commit.message, 'deploy') }}
${{ failure() || cancelled() }}
${{ startsWith(github.ref, 'refs/tags/v') }}
${{ contains(fromJSON('["main", "release"]'), github.ref_name) }}
${{ hashFiles('**/pnpm-lock.yaml') }}

# 三元（用 && + ||）
${{ github.event_name == 'pull_request' && 'staging' || 'production' }}

# 默认值
${{ inputs.target || 'staging' }}
```

::: tip 在 `if:` 里不写 <span v-pre>`${{ }}`</span>

```yaml
if: github.ref == 'refs/heads/main'              # ✅
if: ${{ github.ref == 'refs/heads/main' }}       # ❌ 大多数地方也能跑但不规范
```

只有少数地方（`if:` 嵌入 fromJSON 时）需要显式 <span v-pre>`${{ }}`</span>。其它字段如 `env:` / `with:` 全要写 <span v-pre>`${{ }}`</span>。

:::

完整内置函数 + contexts 见 [参考](../reference.md#上下文-contexts-速查) / [参考](../reference.md#内置函数)。

## if：条件执行

### Job 级

```yaml
jobs:
  deploy:
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
```

### Step 级

```yaml
steps:
  - run: pnpm test:e2e
    if: matrix.os == 'ubuntu-latest'

  - run: ./cleanup.sh
    if: always()                        # 不论上面成败都跑

  - run: ./send-alert.sh
    if: failure() && github.ref == 'refs/heads/main'
```

### 内置状态函数

| 函数            | 含义                                  |
| --------------- | ------------------------------------- |
| `success()`     | 默认；上面 step 全部成功才跑          |
| `failure()`     | 上面有 step 失败时跑                  |
| `always()`      | 不论成败都跑                          |
| `cancelled()`   | 整个 job 被取消时跑                   |

复合：

```yaml
if: success() || failure()             # = always()
if: failure() && !cancelled()           # 只在真正失败时跑（手动取消不算）
```

### 跨平台条件

```yaml
- if: runner.os == 'Linux'
  run: ./install-linux.sh

- if: runner.os == 'Windows'
  run: ./install.ps1
  shell: pwsh
```

## environments：声明部署目标

```yaml
jobs:
  deploy_prod:
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://app.example.com      # 显示在 deployments 页 + commit 状态
    steps:
      - run: ./deploy.sh
```

绑定 environment 后获得：

1. **审批门控**：仓库 Settings → Environments 配 required reviewers，必须批准才跑
2. **Env-scoped secrets**：在 environment 维度配的 secrets，只在该 environment 的 job 里能读
3. **部署历史**：仓库 Deployments 页可见、可一键回滚
4. **Wait timer / Branch protection**：限制只有特定分支能跑该 environment、强制等几分钟

> 个人项目最实用的是 **env-scoped secrets**——把 prod / staging 凭据分开放，写错地方部不到 prod。

### environment 的动态 name

```yaml
environment:
  name: ${{ github.ref_name == 'main' && 'production' || 'staging' }}
  url: ${{ steps.deploy.outputs.url }}
```

## concurrency：进阶用法

### Deploy 队列（永不取消）

```yaml
jobs:
  deploy_prod:
    concurrency:
      group: deploy-prod
      cancel-in-progress: false        # 永远排队，不取消
```

### PR + push 不撞

```yaml
concurrency:
  group: ci-${{ github.head_ref || github.ref }}
  cancel-in-progress: true
```

`github.head_ref`：PR 时是源分支；push 时是 undefined，回退到 `github.ref`。这样 PR 的多次 push 会取消旧的，但 push 到 main 不会被 PR 取消（不同 group）。

## permissions 进阶

### 各 scope 含义

| Scope                   | 用途                                              |
| ----------------------- | ------------------------------------------------- |
| `actions`               | 触发 / 取消其它 workflow                          |
| `checks`                | 创建 check runs（构建报告）                       |
| `contents`              | 读 / 写仓库代码                                   |
| `deployments`           | 写部署状态                                        |
| `issues`                | 读 / 写 / 评论 issues                              |
| `packages`              | push 镜像到 GHCR                                   |
| `pull-requests`         | 评论 PR / 加 label                                |
| `id-token`              | OIDC 联邦认证（cloud 部署必备）                   |
| `pages`                 | 部署 GitHub Pages                                 |
| `security-events`       | 写 code scanning 结果                             |
| `statuses`              | 创建 commit status                                |

### 三种简写

```yaml
permissions: read-all                   # 全部 scope = read
permissions: write-all                  # 全部 = write（**最危险**，慎用）
permissions: {}                         # 全部 = none（最严格）
```

## 调试技巧

### 1. 把上下文打出来

```yaml
- name: Dump context
  run: |
    echo "${{ toJSON(github) }}"
    echo "${{ toJSON(env) }}"
    echo "${{ toJSON(matrix) }}"
```

### 2. 打开调试日志

仓库 Secrets 里加：

- `ACTIONS_RUNNER_DEBUG=true`：runner 调试日志
- `ACTIONS_STEP_DEBUG=true`：step 详细日志

下次 workflow 跑日志里会多很多 trace 信息。

### 3. SSH 进 Runner

第三方 Action：

```yaml
- name: SSH session for debugging
  uses: lhotari/action-upterm@v1
  if: failure()                         # 仅失败时启用
  with:
    limit-access-to-actor: true
```

跑到这里时 console 会打印 SSH 连接命令，可直接登入正在运行的 Runner 排查。

### 4. 本地模拟：act

```bash
brew install act
act push                                # 模拟 push 事件
act pull_request -j test                # 跑特定 job
```

[nektos/act](https://github.com/nektos/act) 用 Docker 模拟 Runner，避免反复 push 调试。

## 一个高效模板

```yaml
name: CI/CD
on:
  push:
    branches: [main]
  pull_request:
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: ${{ github.workflow }}-${{ github.head_ref || github.ref }}
  cancel-in-progress: true

env:
  NODE_VERSION: '22'

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        shard: [1, 2, 3, 4]             # 测试分片并行
      fail-fast: false
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm test --shard=${{ matrix.shard }}/${{ strategy.job-total }}

  build:
    needs: test
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    outputs:
      sha: ${{ steps.meta.outputs.sha }}
    steps:
      - uses: actions/checkout@v4
      - id: meta
        run: echo "sha=$(git rev-parse --short HEAD)" >> $GITHUB_OUTPUT
      - run: pnpm build

  deploy:
    needs: build
    environment:
      name: production
      url: https://app.example.com
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying ${{ needs.build.outputs.sha }}"
```
