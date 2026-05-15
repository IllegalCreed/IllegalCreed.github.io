---
layout: doc
outline: [2, 3]
---

# 指南 - 基础

> 基于 GitLab 17+ 编写 — 把 `.gitlab-ci.yml` 关键字摸清

## 速查

- `stages`：定义阶段顺序，决定 jobs 的执行顺序
- `default`：整条 pipeline 的默认 job 配置（image / cache / before_script 等），job 自己写的会**覆盖**而非合并
- `job_name.script`：必填，可以是字符串也可以是数组
- `before_script` / `after_script`：script 前后跑；后者独立 shell + 不影响 job 状态
- `image` / `services`：job 跑在哪个容器 + 旁路服务（db / dind）
- `tags`：限定 Runner（必须有匹配标签才能跑）
- `artifacts` / `cache`：产物（跨 job + 可下载）vs 缓存（加速）
- `when`：`on_success`（默认）/ `on_failure` / `always` / `manual` / `delayed`
- `allow_failure`：失败也不阻塞 pipeline；manual job 默认 `true`
- `retry`：自动重试；`retry: { max: 2, when: runner_system_failure }`
- `timeout`：覆盖项目级超时
- `parallel`：并行实例数；可用 `matrix` 矩阵展开

## stages

```yaml
stages:
  - install        # 第 1 阶段
  - test           # 第 2 阶段
  - build          # 第 3 阶段
  - deploy         # 第 4 阶段
```

规则：

- **同 stage 内 jobs 并行**，下一个 stage 等本 stage 全成功才开始
- 不写 `stages` 时默认 `[build, test, deploy]`
- job 不写 `stage` 时默认 `test`
- 一个 job 只能属于一个 stage；要在多个 stage 间共享逻辑，用 `extends`

::: tip stage 不是绝对的串行

`needs` 关键字（DAG）可以打破 stage 顺序，让 job 一旦它依赖的任务完成就立刻开始，不必等同 stage 其它任务。详见 [进阶](./advanced.md#needs-dag-加速)。

:::

## default

整条 pipeline 的共用默认：

```yaml
default:
  image: node:22-alpine                # 所有 job 默认镜像
  before_script:                       # 所有 job 默认 before_script
    - corepack enable
  cache:
    key: ${CI_COMMIT_REF_SLUG}
    paths: [node_modules/]
  tags: [linux-docker]                  # 默认 Runner 标签

test:
  script: pnpm test                     # 自动继承 image / before_script / cache / tags

deploy:
  image: alpine:3.20                    # 这条 job 用别的镜像（覆盖 default.image）
  script: ./deploy.sh
```

支持的 default 字段：`after_script` / `artifacts` / `before_script` / `cache` / `image` / `interruptible` / `retry` / `services` / `tags` / `timeout`。

::: warning default 是覆盖，不是合并

job 自己写了 `cache`，**完全替换** default.cache，不会把两边合并。要既继承又增加，要么 `extends`，要么把通用部分写在 job 里。

:::

## script / before_script / after_script

```yaml
test:
  before_script:                       # 1. 先跑（继承 default 后可被覆盖）
    - corepack enable
    - pnpm install --frozen-lockfile
  script:                              # 2. 跑这部分，**失败导致 job 失败**
    - pnpm test:unit
    - pnpm test:e2e
  after_script:                        # 3. 后跑，**独立 shell，独立 timeout 5min**
    - echo "Job ${CI_JOB_STATUS}"      # 拿到 success / failed
    - rm -rf /tmp/cache                # 清理临时文件
```

重点：

- **`after_script` 在独立 shell 里跑**，前面 `cd /work` 在它这里失效
- **`after_script` 不影响 job 状态**：里面的命令报错不会让 job 失败
- **`after_script` 限时 5 分钟**（项目级 timeout 不适用），别放慢命令

## artifacts

```yaml
build:
  script: pnpm build
  artifacts:
    paths:                             # 上传哪些文件
      - dist/
      - public/
    name: "${CI_JOB_NAME}-${CI_COMMIT_REF_SLUG}"  # 下载文件名
    expire_in: 1 week                  # 多久后删除
    when: on_success                   # on_success(默认) / on_failure / always
    reports:                           # 专项报告（GitLab 会解析展示）
      junit: reports/test-results.xml
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura.xml
    exclude:                           # 排除特定文件
      - dist/*.map
```

下游 job 默认会下载所有上游 artifacts，除非用 `dependencies: []` 显式控制。

```yaml
deploy:
  needs: [build]                       # 只依赖 build 的 artifacts
  script: ./deploy.sh dist/
```

## cache

```yaml
install:
  cache:
    key:
      files: [pnpm-lock.yaml]          # lockfile 变了才换 cache key
      prefix: ${CI_JOB_NAME}
    paths:
      - node_modules/
      - .pnpm-store/
    policy: pull-push                  # 默认：先拉取，结束推送
  script: pnpm install
```

策略（`policy`）：

| 值          | 行为                              | 适用                            |
| ----------- | --------------------------------- | ------------------------------- |
| `pull-push` | 开始拉、结束推（默认）            | 既用 cache 又写 cache 的 job    |
| `pull`      | 只拉不推                          | 下游 job 只消费 cache 不更新    |
| `push`      | 只推不拉                          | 强制覆盖 cache，少见            |

`key` 的常见模式：

```yaml
cache:
  key: ${CI_COMMIT_REF_SLUG}                # 按分支区分
  key: files: [package-lock.json]            # 按 lock 文件区分（hash）
  key:
    files: [pnpm-lock.yaml, .nvmrc]
    prefix: ${CI_JOB_NAME}                  # 多文件 + job 名前缀
```

## image / services

```yaml
test_with_db:
  image: node:22-alpine
  services:
    - name: postgres:16
      alias: db
      command: ["postgres", "-c", "log_statement=all"]
    - name: redis:7-alpine
  variables:
    POSTGRES_USER: ci
    POSTGRES_PASSWORD: ci
    POSTGRES_DB: test
    DB_HOST: db                         # 通过 alias 访问
  script:
    - pnpm test:integration
```

`services` 在同一个 Docker network 里启动，job 容器可通过服务名 / alias 访问。常见用法：CI 环境拉起 Postgres / MySQL / Redis / DinD。

## tags

```yaml
build:
  tags:
    - linux
    - docker
  script: docker build .
```

job 只能被**所有标签都匹配**的 Runner 拉取。常用来：

- 让 Linux 任务跑在 Linux Runner、Windows 任务跑在 Windows Runner
- 把构建任务调度到独立的高性能机器（标签 `heavy`）
- 把部署任务限制到能访问内网的 Runner（标签 `prod-network`）

::: warning 没有匹配的 Runner，job 会 stuck

未匹配标签的 job 会一直显示 `pending`。注意：默认情况下，**没标签的 Runner 不接有标签的 job**（除非勾选了 "Run untagged jobs"）。

:::

## when 与 allow_failure

```yaml
deploy_prod:
  stage: deploy
  when: manual                          # 不自动跑，等人点
  allow_failure: false                  # 即使 manual 也阻塞流水线（默认 manual 是 true）
  script: ./deploy.sh prod

flaky_e2e:
  script: pnpm test:e2e
  allow_failure: true                   # 失败不挂 pipeline，但会标黄
```

`when` 值：

| 值          | 行为                                              |
| ----------- | ------------------------------------------------- |
| on_success  | 默认；前面 jobs 全成功才跑                        |
| on_failure  | 前面有失败时跑（错误处理 / 通知）                 |
| always      | 不论成败都跑                                      |
| manual      | 不自动跑，UI 上有按钮触发                         |
| delayed     | 延后跑，配合 `start_in: 30 minutes`               |

## retry

```yaml
flaky_test:
  script: pnpm test
  retry:
    max: 2                              # 最多重试 2 次（不含首次）
    when:
      - runner_system_failure           # Runner 自己挂了
      - stuck_or_timeout_failure        # 卡住超时
      - api_failure                     # GitLab API 失败
```

完整 `when` 触发条件：`always`, `unknown_failure`, `script_failure`, `api_failure`, `stuck_or_timeout_failure`, `runner_system_failure`, `runner_unsupported`, `stale_schedule`, `job_execution_timeout`, `archived_failure`, `unmet_prerequisites`, `scheduler_failure`, `data_integrity_failure`。

## parallel

最简单：同一 job 起 N 个并行实例

```yaml
test:
  parallel: 5
  script:
    - pytest --shard $((CI_NODE_INDEX-1))/$CI_NODE_TOTAL
```

`CI_NODE_INDEX` 从 1 到 5，`CI_NODE_TOTAL` 是总数，配合测试工具的分片功能即可分布执行。

矩阵展开（笛卡尔积）：

```yaml
deploy:
  parallel:
    matrix:
      - PROVIDER: aws
        REGION: [us-east-1, eu-west-1]
      - PROVIDER: gcp
        REGION: [us-central1, asia-east1]
  script: ./deploy.sh $PROVIDER $REGION
```

会生成 4 个 job：`aws/us-east-1`、`aws/eu-west-1`、`gcp/us-central1`、`gcp/asia-east1`。
