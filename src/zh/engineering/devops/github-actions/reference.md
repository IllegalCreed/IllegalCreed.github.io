---
layout: doc
outline: [2, 3]
---

# 参考

> 速查表 + Marketplace 常用 Action + 上下文 + 触发器

## yml 关键字索引

### 顶层

| 关键字        | 作用                                   |
| ------------- | -------------------------------------- |
| `name`        | workflow 显示名                        |
| `on`          | 触发器                                 |
| `permissions` | GITHUB_TOKEN 默认权限                  |
| `env`         | workflow 级环境变量                    |
| `defaults`    | 所有 run step 的默认 shell / cwd       |
| `concurrency` | 同组排队 / 取消                        |
| `jobs`        | jobs 容器                              |

### Job 级

| 关键字              | 作用                                |
| ------------------- | ----------------------------------- |
| `runs-on`           | Runner（必填）                      |
| `needs`             | 依赖的上游 jobs                     |
| `if`                | 条件                                |
| `permissions`       | job 级权限                          |
| `env`               | job 级环境变量                      |
| `defaults`          | job 级 default                      |
| `outputs`           | job 暴露给下游 jobs 的输出          |
| `environment`       | 部署环境（审批 + env secrets）      |
| `concurrency`       | job 级并发                          |
| `container`         | 整个 job 跑在容器里                 |
| `services`          | 旁路服务容器                        |
| `strategy.matrix`   | 矩阵展开                            |
| `strategy.fail-fast`| 一败俱败                            |
| `strategy.max-parallel`| 并发上限                         |
| `timeout-minutes`   | job 级超时（默认 360 min）          |
| `continue-on-error` | 失败不阻塞下游                      |
| `runs-on` larger    | 升级 runner 规格                    |
| `uses` (job 级)     | 调用 reusable workflow              |
| `with` (job 级)     | 给 reusable workflow 传参           |
| `secrets`           | 给 reusable workflow 传 secrets     |

### Step 级

| 关键字              | 作用                                |
| ------------------- | ----------------------------------- |
| `uses`              | 引用 Action                         |
| `run`               | 跑 shell（与 uses 互斥）            |
| `with`              | 给 Action 传参                      |
| `env`               | step 级环境变量                     |
| `id`                | 给 step 加 ID（拿 outputs 用）      |
| `name`              | 日志显示名                          |
| `working-directory` | 工作目录                            |
| `shell`             | bash / sh / pwsh / python / cmd ... |
| `if`                | 条件                                |
| `continue-on-error` | 失败不挂 job                        |
| `timeout-minutes`   | step 级超时                         |

## 触发器事件全表

### 仓库代码事件

| 事件                  | 触发条件                              |
| --------------------- | ------------------------------------- |
| `push`                | 推送 commit / tag                     |
| `pull_request`        | PR 创建 / 更新 / 关闭                 |
| `pull_request_target` | 同 PR 但用 base 分支的 workflow（fork 安全） |
| `pull_request_review` | PR 评审提交                           |
| `pull_request_review_comment` | PR 行级评论                  |
| `release`             | release 创建 / 发布 / 编辑             |
| `create`              | 创建分支 / tag                        |
| `delete`              | 删除分支 / tag                        |
| `fork`                | 仓库被 fork                           |

### Issue / Discussion

| 事件               | 触发条件                  |
| ------------------ | ------------------------- |
| `issues`           | issue 操作                |
| `issue_comment`    | issue / PR 评论            |
| `discussion`       | discussion 操作            |
| `discussion_comment` | discussion 评论          |

### CI / 调度

| 事件                  | 触发条件                          |
| --------------------- | --------------------------------- |
| `schedule`            | cron 定时（UTC）                   |
| `workflow_dispatch`   | UI / API 手动触发                  |
| `workflow_call`       | 被其它 workflow 调用                |
| `workflow_run`        | 监听另一个 workflow 完成            |
| `repository_dispatch` | 外部 API webhook                   |
| `check_run`           | check 状态变化                     |
| `check_suite`         | check suite 状态                   |

### 其它

| 事件                       | 触发条件                       |
| -------------------------- | ------------------------------ |
| `deployment` / `deployment_status` | 部署 API 调用            |
| `status`                   | commit status 变化              |
| `watch`                    | 仓库被 star                    |
| `page_build`               | GitHub Pages 构建完成          |
| `registry_package`         | 包仓库变更                     |

## 上下文（contexts）速查

| 上下文       | 主要属性                                 | 用途                          |
| ------------ | ---------------------------------------- | ----------------------------- |
| `github`     | `ref / sha / actor / repository / event_name / event / workflow / run_id / run_number / token` | 触发上下文 |
| `env`        | 自定义环境变量                           | 跨 step 共享变量              |
| `vars`       | UI 配置的非机密配置变量                  | 替代 env 中的非机密值         |
| `secrets`    | UI 配置的机密变量（含 `GITHUB_TOKEN`）   | API 凭据 / 部署密钥           |
| `inputs`     | workflow_dispatch / workflow_call 的输入 | 手动 / 复用 workflow 时取参   |
| `needs`      | 上游 jobs 的 `outputs` / `result`        | 跨 job 传值                   |
| `steps`      | 当前 job 的各 step `outputs` / `outcome` / `conclusion` | 跨 step 传值        |
| `job`        | 当前 job 的 `status` / `container`        | 用 job 自身信息               |
| `runner`     | `os / arch / name / temp / tool_cache`   | 跨平台分支                    |
| `strategy`   | `job-index / job-total / fail-fast`       | matrix 内部信息               |
| `matrix`     | 当前 matrix 的字段                       | matrix 内取值                 |

## 内置函数

| 函数                         | 用途                                  |
| ---------------------------- | ------------------------------------- |
| `contains(haystack, needle)` | 检查包含（字符串 / 数组 / 对象）       |
| `startsWith(s, prefix)`      | 字符串前缀检查                        |
| `endsWith(s, suffix)`        | 字符串后缀检查                        |
| `format(str, ...args)`       | C# style 字符串格式化                  |
| `join(array, sep)`           | 数组 join                              |
| `toJSON(obj)`                | 对象 → JSON 字符串                     |
| `fromJSON(str)`              | JSON 字符串 → 对象                     |
| `hashFiles(...paths)`        | 文件内容 hash（用于 cache key）        |
| `success()`                  | 上面 step 全部成功                    |
| `failure()`                  | 有 step 失败                          |
| `always()`                   | 不论成败都跑                          |
| `cancelled()`                | job 被取消                            |

## GITHUB_TOKEN permissions 完整列表

| Scope               | 默认（旧）| 默认（新仓库）| 写时能做                                    |
| ------------------- | --------- | ------------- | ------------------------------------------- |
| `actions`           | read      | read          | 触发 / 取消 其它 workflow                   |
| `attestations`      | -         | none          | 创建 artifact 证明                           |
| `checks`            | write     | read          | 创建 check runs                              |
| `contents`          | write     | read          | 读写仓库代码                                 |
| `deployments`       | write     | read          | 写部署状态                                   |
| `discussions`       | write     | read          | 创建 / 评论 discussions                      |
| `id-token`          | none      | none          | OIDC 联邦认证                                |
| `issues`            | write     | read          | 读写 / 评论 issues                           |
| `models`            | -         | none          | 调用 GitHub Models                           |
| `packages`          | write     | read          | push 到 GHCR                                 |
| `pages`             | write     | read          | 部署 GitHub Pages                            |
| `pull-requests`     | write     | read          | 创建 / 评论 / 加 label PR                    |
| `repository-projects` | write   | read          | 项目板写                                     |
| `security-events`   | write     | read          | 写 code scanning 结果                        |
| `statuses`          | write     | read          | 创建 commit status                           |

简写：

```yaml
permissions: read-all                   # 全部 read
permissions: write-all                  # 全部 write（不建议）
permissions: {}                         # 全部 none
```

## 预定义环境变量

| 变量                       | 含义                              | 示例                     |
| -------------------------- | --------------------------------- | ------------------------ |
| `GITHUB_WORKFLOW`          | workflow 名                       | `CI`                     |
| `GITHUB_RUN_ID`            | 运行 ID                           | `123456789`              |
| `GITHUB_RUN_NUMBER`        | workflow 在仓库内的序号           | `42`                     |
| `GITHUB_ACTION`            | 当前 action 名 / step id           | -                        |
| `GITHUB_ACTOR`             | 触发的用户                        | `octocat`                |
| `GITHUB_REPOSITORY`        | owner/repo                        | `myorg/myrepo`           |
| `GITHUB_REPOSITORY_OWNER`  | owner                             | `myorg`                  |
| `GITHUB_EVENT_NAME`        | 事件名                            | `push / pull_request`    |
| `GITHUB_EVENT_PATH`        | 事件 payload JSON 路径             | `/github/workflow/event.json` |
| `GITHUB_WORKSPACE`         | 工作目录                          | `/home/runner/work/...`  |
| `GITHUB_SHA`               | 触发的 commit SHA                  | -                        |
| `GITHUB_REF`               | 完整 ref                          | `refs/heads/main`        |
| `GITHUB_REF_NAME`          | 短 ref                            | `main`                   |
| `GITHUB_REF_TYPE`          | branch / tag                      | -                        |
| `GITHUB_HEAD_REF`          | PR 时的源分支                     | `feature/x`              |
| `GITHUB_BASE_REF`          | PR 时的目标分支                   | `main`                   |
| `GITHUB_TOKEN`             | 自动注入的 PAT                    | `ghs_xxx`                |
| `GITHUB_API_URL`           | API URL                           | `https://api.github.com` |
| `GITHUB_SERVER_URL`        | GitHub URL                        | `https://github.com`     |
| `RUNNER_OS`                | Linux / macOS / Windows           | -                        |
| `RUNNER_ARCH`              | X64 / ARM64                       | -                        |
| `RUNNER_TEMP`              | 临时目录                          | -                        |
| `RUNNER_TOOL_CACHE`        | 工具缓存目录                      | -                        |

## Marketplace 常用 Action

### GitHub 官方 actions/*

| Action                              | 用途                            |
| ----------------------------------- | ------------------------------- |
| `actions/checkout@v4`               | 拉取仓库代码                    |
| `actions/setup-node@v4`             | 装 Node.js + 内置 cache         |
| `actions/setup-python@v5`           | 装 Python                       |
| `actions/setup-go@v5`               | 装 Go                           |
| `actions/setup-java@v4`             | 装 JDK                          |
| `actions/cache@v4`                  | 自定义缓存                      |
| `actions/upload-artifact@v4`        | 上传产物                        |
| `actions/download-artifact@v4`      | 下载产物                        |
| `actions/github-script@v7`          | 在 step 里跑 JS 调 GitHub API   |
| `actions/labeler@v6`                | 按 paths 自动加 PR label        |
| `actions/stale@v9`                  | 标记 / 关闭长期不活的 issue / PR |
| `actions/create-release@v1`         | 创建 GitHub Release（已弃用，建议 softprops/action-gh-release） |

### Docker 官方 docker/*

| Action                              | 用途                                  |
| ----------------------------------- | ------------------------------------- |
| `docker/login-action@v3`            | 登录 registry                         |
| `docker/setup-buildx-action@v3`     | 启用 BuildKit                         |
| `docker/setup-qemu-action@v3`       | 跨架构构建（QEMU）                    |
| `docker/build-push-action@v6`       | 构建 + push 镜像（推荐）              |
| `docker/metadata-action@v5`         | 自动生成镜像 tags + labels            |

### 云厂商

| Action                                          | 用途              |
| ----------------------------------------------- | ----------------- |
| `aws-actions/configure-aws-credentials@v6`      | AWS OIDC          |
| `aws-actions/amazon-ecr-login@v2`               | ECR 登录          |
| `azure/login@v2`                                | Azure OIDC        |
| `google-github-actions/auth@v2`                 | GCP OIDC          |
| `hashicorp/vault-action@v3`                     | Vault             |

### Release / 部署

| Action                                  | 用途                              |
| --------------------------------------- | --------------------------------- |
| `softprops/action-gh-release@v2`        | 创建 GitHub Release（推荐）       |
| `peaceiris/actions-gh-pages@v4`         | 部署到 GitHub Pages               |
| `JamesIves/github-pages-deploy-action@v4` | 部署到 GitHub Pages（替代）     |
| `superfly/flyctl-actions/setup-flyctl@master` | Fly.io 部署                |
| `vercel/setup-now@v1`                   | Vercel CLI                        |

### 包管理

| Action                              | 用途                              |
| ----------------------------------- | --------------------------------- |
| `pnpm/action-setup@v4`              | 装 pnpm                           |
| `oven-sh/setup-bun@v2`              | 装 Bun                            |
| `astral-sh/setup-uv@v3`             | 装 uv（Python）                   |

### 工具

| Action                              | 用途                              |
| ----------------------------------- | --------------------------------- |
| `crazy-max/ghaction-github-labeler@v5` | 同步 labels                    |
| `dorny/paths-filter@v3`             | 按 paths 设置 outputs             |
| `lhotari/action-upterm@v1`          | 失败时启 SSH session 调试         |
| `tj-actions/changed-files@v45`      | 拿到本次变更的文件列表            |

## 常用 yml 片段拷贝即用

### Node.js 项目（pnpm）

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
permissions:
  contents: read
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build
```

### 跑 PostgreSQL 测试

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: ci
        ports: ['5432:5432']
        options: --health-cmd pg_isready --health-interval 10s
    steps:
      - uses: actions/checkout@v4
      - run: pnpm test:integration
        env:
          DATABASE_URL: postgres://postgres:ci@localhost:5432/postgres
```

### 多版本 matrix

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node: ['18', '20', '22']
      fail-fast: false
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: ${{ matrix.node }}, cache: 'pnpm' }
      - run: pnpm install && pnpm test
```

### Docker build + push (GHCR)

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
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
```

### OIDC 部署 AWS

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: aws-actions/configure-aws-credentials@v6
        with:
          role-to-assume: arn:aws:iam::123456789:role/github-actions-prod
          aws-region: ap-southeast-1
      - run: aws sts get-caller-identity
      - run: aws s3 sync dist/ s3://my-bucket/
```

### 发包到 npm

```yaml
on:
  push:
    tags: ['v*']
jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write                   # 启用 npm provenance
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          registry-url: 'https://registry.npmjs.org'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm publish --provenance --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### 部署 GitHub Pages

```yaml
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install && pnpm build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist
      - id: deployment
        uses: actions/deploy-pages@v4
```

## 与其他 CI 对比备查

| 概念        | GitHub Actions             | GitLab CI/CD              | Jenkins                |
| ----------- | -------------------------- | ------------------------- | ---------------------- |
| 配置        | `.github/workflows/*.yml`  | `.gitlab-ci.yml`          | `Jenkinsfile`          |
| 阶段        | jobs（默认并行 + needs）   | stages（默认串行）        | stages                 |
| 任务        | job                        | job                       | stage                  |
| 步骤        | `steps:`                   | `script:`                 | `steps { }`            |
| Action 复用 | uses / Composite / Reusable | extends / include         | Shared Library         |
| 执行环境    | `runs-on:` / container     | `image:` / `services:`    | `agent { docker }`     |
| 条件        | `if:`                      | `rules:`                  | `when {}`              |
| 矩阵        | `strategy.matrix`          | `parallel.matrix`         | `parallel { ... }`     |
| 凭据        | Secrets / OIDC             | CI/CD Variables           | Credentials            |
| 部署目标    | `environment:`             | `environment:`            | -                      |
| 触发器      | `on:`                      | `workflow:` + `rules:`    | `triggers { }`         |
