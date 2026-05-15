---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 GitLab 17+ 编写 — 速查表 + 预定义变量 + 关键字索引

## yml 关键字全表

### 顶层关键字

| 关键字     | 作用                                                       |
| ---------- | ---------------------------------------------------------- |
| `stages`   | 定义阶段顺序                                               |
| `default`  | pipeline 级默认配置（被 job 覆盖而非合并）                 |
| `include`  | 引入外部 yml（local / project / remote / template / component） |
| `variables`| pipeline 级变量                                            |
| `workflow` | 决定 pipeline 是否创建                                     |

### Job 级关键字

| 关键字            | 作用                                            |
| ----------------- | ----------------------------------------------- |
| `script`          | 必填，job 实际执行命令                          |
| `before_script`   | script 前跑（与 script 同 shell）               |
| `after_script`    | script 后跑（独立 shell，不影响 job 状态）      |
| `stage`           | 落在哪个 stage                                  |
| `image`           | 用哪个 Docker 镜像                              |
| `services`        | 旁路容器服务（db / dind）                       |
| `tags`            | 限定 Runner 标签                                |
| `variables`       | job 级变量                                      |
| `rules`           | 条件触发（替代 only / except）                  |
| `only` / `except` | 旧版条件触发（停止演进，仍可用）                |
| `when`            | `on_success / on_failure / always / manual / delayed` |
| `allow_failure`   | 失败不阻塞 pipeline                             |
| `retry`           | 自动重试                                        |
| `timeout`         | 覆盖项目级 timeout                              |
| `parallel`        | 并行实例数 / matrix 展开                        |
| `needs`           | DAG 依赖（打破 stage 串行）                     |
| `dependencies`    | 限制 artifacts 下载范围                         |
| `artifacts`       | 产物（跨 job + 可下载 + 报告）                  |
| `cache`           | 缓存（加速重复构建）                            |
| `environment`     | 部署环境追踪                                    |
| `extends`         | 配置继承（支持多层）                            |
| `trigger`         | 触发下游 / 子 pipeline                          |
| `interruptible`   | 同分支新 push 时取消旧 pipeline                 |
| `release`         | 自动创建 GitLab Release（配合 `release-cli`）   |
| `pages`           | 部署到 GitLab Pages                             |
| `secrets`         | 集成 Vault / 外部密钥管理（17+）                |
| `hooks`           | pre/post hook                                   |

## 预定义变量速查表

### 项目信息

| 变量                       | 含义                              | 示例                          |
| -------------------------- | --------------------------------- | ----------------------------- |
| `CI_PROJECT_ID`            | 项目 ID                           | `42`                          |
| `CI_PROJECT_NAME`          | 项目名                            | `quiz-monorepo`               |
| `CI_PROJECT_PATH`          | namespace/项目名                  | `team/quiz-monorepo`          |
| `CI_PROJECT_NAMESPACE`     | namespace                         | `team`                        |
| `CI_PROJECT_URL`           | 项目 web URL                      | `https://gitlab.com/team/quiz`|
| `CI_PROJECT_DIR`           | 工作目录（job 内）                | `/builds/team/quiz`           |
| `CI_DEFAULT_BRANCH`        | 默认分支名                        | `main`                        |
| `CI_PROJECT_VISIBILITY`    | 可见性                            | `private / internal / public` |

### Commit / 分支 / Tag

| 变量                       | 含义                                  | 示例                       |
| -------------------------- | ------------------------------------- | -------------------------- |
| `CI_COMMIT_SHA`            | commit 完整 hash                      | `a1b2c3d...`               |
| `CI_COMMIT_SHORT_SHA`      | 前 8 位短 hash                        | `a1b2c3d4`                 |
| `CI_COMMIT_BRANCH`         | 分支名（push 触发）                   | `main` / `feature/x`       |
| `CI_COMMIT_TAG`            | tag 名（tag 触发）                    | `v1.2.3`                   |
| `CI_COMMIT_REF_NAME`       | 分支或 tag 名                         | `main`                     |
| `CI_COMMIT_REF_SLUG`       | URL-safe 版                           | `feature-x`                |
| `CI_COMMIT_MESSAGE`        | commit message                        | `fix: typo`                |
| `CI_COMMIT_TITLE`          | commit message 第一行                 | `fix: typo`                |
| `CI_COMMIT_TIMESTAMP`      | commit 时间（ISO 8601）               | `2026-05-15T08:00:00Z`     |

### Pipeline / Job

| 变量                       | 含义                                          | 示例                          |
| -------------------------- | --------------------------------------------- | ----------------------------- |
| `CI_PIPELINE_ID`           | pipeline 全站唯一 ID                          | `12345`                       |
| `CI_PIPELINE_IID`          | pipeline 项目内 ID                            | `42`                          |
| `CI_PIPELINE_SOURCE`       | 触发来源                                      | `push / merge_request_event / schedule / api / web / trigger / pipeline / external_pull_request_event / chat` |
| `CI_PIPELINE_URL`          | pipeline 详情页 URL                           | -                             |
| `CI_JOB_ID`                | job 全站唯一 ID                               | `54321`                       |
| `CI_JOB_NAME`              | job 名（yml 里写的）                          | `build_image`                 |
| `CI_JOB_STAGE`             | job 所在 stage                                | `build`                       |
| `CI_JOB_STATUS`            | job 当前状态（在 `after_script` 里可用）       | `success / failed / canceled`  |
| `CI_JOB_TOKEN`             | 临时令牌，可拉 artifacts / 推 Registry         | `glt-xxxx`                    |
| `CI_NODE_INDEX`            | 并行 job 的索引（1 起）                       | `1`                           |
| `CI_NODE_TOTAL`            | 并行 job 总数                                 | `5`                           |

### Merge Request 触发时

| 变量                                | 含义                              | 示例           |
| ----------------------------------- | --------------------------------- | -------------- |
| `CI_MERGE_REQUEST_ID`               | MR 全站 ID                        | `123`          |
| `CI_MERGE_REQUEST_IID`              | MR 项目内编号                     | `42`           |
| `CI_MERGE_REQUEST_SOURCE_BRANCH_NAME`| 源分支                            | `feature/x`    |
| `CI_MERGE_REQUEST_TARGET_BRANCH_NAME`| 目标分支                          | `main`         |
| `CI_MERGE_REQUEST_TITLE`            | MR 标题                           | -              |
| `CI_MERGE_REQUEST_LABELS`           | 标签列表（逗号分隔）              | `bug,priority` |
| `CI_MERGE_REQUEST_SOURCE_PROJECT_ID`| 源项目 ID（fork 时与本项目不同）  | -              |

### Runner / Container Registry

| 变量                       | 含义                          | 示例                          |
| -------------------------- | ----------------------------- | ----------------------------- |
| `CI_RUNNER_ID`             | Runner ID                     | `7`                           |
| `CI_RUNNER_DESCRIPTION`    | Runner 描述                   | `company-docker-runner`       |
| `CI_RUNNER_TAGS`           | Runner 标签列表               | `linux,docker`                |
| `CI_REGISTRY`              | Container Registry 域名       | `registry.gitlab.com`         |
| `CI_REGISTRY_IMAGE`        | 当前项目的 registry 镜像名    | `registry.gitlab.com/team/x`  |
| `CI_REGISTRY_USER`         | Registry 用户名（自动注入）   | `gitlab-ci-token`             |
| `CI_REGISTRY_PASSWORD`     | Registry 密码（= CI_JOB_TOKEN）| -                             |

### 用户

| 变量                       | 含义                                  | 示例                |
| -------------------------- | ------------------------------------- | ------------------- |
| `GITLAB_USER_ID`           | 触发 pipeline 的用户 ID               | `42`                |
| `GITLAB_USER_LOGIN`        | 用户名                                | `alice`             |
| `GITLAB_USER_NAME`         | 显示名                                | `Alice Wonderland`  |
| `GITLAB_USER_EMAIL`        | 邮箱                                  | -                   |

完整列表见 [GitLab 官方文档](https://docs.gitlab.com/ci/variables/predefined_variables/)。

## 变量优先级（高 → 低）

```
1. 触发 pipeline 时手动填的变量 (UI / API trigger 时的 variables)
2. Pipeline schedule 的 variables
3. Project 级 CI/CD Variables（UI 配置）
4. Group 级 CI/CD Variables（subgroup 优先于 parent）
5. Instance 级 CI/CD Variables（GitLab 自管理）
6. dotenv 报告里的变量（来自 artifacts.reports.dotenv）
7. job-level `variables:`
8. global `variables:` / `default:`
9. Deployment variables（部署相关）
10. Predefined variables（GitLab 内置 CI_*）
```

## `rules` 关键字组合

| 子关键字          | 作用                                  |
| ----------------- | ------------------------------------- |
| `if`              | 表达式判断（推荐主用法）              |
| `changes`         | 文件改动判断                          |
| `exists`          | 文件存在判断                          |
| `variables`       | 匹配该规则时注入变量                  |
| `when`            | 该规则的 when（覆盖 job 级 when）     |
| `allow_failure`   | 该规则的 allow_failure                |
| `start_in`        | 配合 `when: delayed`                  |
| `needs`           | 该规则的 needs                        |

## `cache` 关键字组合

```yaml
cache:
  key: ...            # 字符串 / files / prefix
  paths: [...]        # 缓存路径
  policy: ...         # pull-push / pull / push
  untracked: false    # 是否包含未追踪的文件
  when: ...           # on_success(默认) / on_failure / always
  unprotect: false    # 受保护分支的缓存是否对非保护分支可见
```

## `artifacts` 关键字组合

```yaml
artifacts:
  paths: [...]                 # 要保存的路径
  exclude: [...]               # 排除的路径
  name: "${CI_JOB_NAME}"       # 下载文件名
  expose_as: "Build report"    # 在 MR 上的展示名
  expire_in: 1 week            # 多久后删除
  when: on_success             # on_success / on_failure / always
  public: true                 # 是否能被未登录用户下载
  reports:                     # 专项报告（GitLab 解析展示）
    junit: ...                 # JUnit XML
    coverage_report: ...       # 覆盖率
    sast: ...                  # SAST 安全扫描
    dast: ...                  # DAST
    container_scanning: ...    # 容器扫描
    dependency_scanning: ...   # 依赖扫描
    secret_detection: ...      # 密钥扫描
    license_scanning: ...      # 许可证扫描
    performance: ...           # 性能
    accessibility: ...         # 可访问性
    cyclonedx: ...             # SBOM
    dotenv: ...                # 输出变量传到下游 job
```

## Runner Executor 速查

| Executor       | 系统           | 适合                              | 关键 config.toml 字段                          |
| -------------- | -------------- | --------------------------------- | ---------------------------------------------- |
| `shell`        | Linux / macOS / Windows | 试用 / 单项目独占     | `shell = "bash"`                               |
| `docker`       | Linux （需 Docker） | **生产首选**                    | `[runners.docker] image = "..."`                |
| `docker-machine` | Linux        | 旧云端自动扩容（淡出）            | `[runners.machine] ...`                        |
| `kubernetes`   | K8s 集群       | **大规模生产**                    | `[runners.kubernetes] namespace = "..."`       |
| `ssh`          | 任意           | 临时跨机执行                      | `[runners.ssh] host = "..."`                   |

## `gitlab-runner` 常用命令

```bash
# 注册（auth token 模式）
sudo gitlab-runner register \
  --non-interactive \
  --url "https://gitlab.com/" \
  --token "glrt-xxx" \
  --executor "docker" \
  --docker-image "alpine:latest" \
  --description "my-runner"

# 列出当前注册的 Runner
sudo gitlab-runner list

# 验证连接
sudo gitlab-runner verify

# 启动 / 重启 / 停止 / 状态
sudo gitlab-runner start
sudo gitlab-runner restart
sudo gitlab-runner stop
sudo gitlab-runner status

# 取消注册（按 token 或 name）
sudo gitlab-runner unregister --name "my-runner"

# 重新加载 config.toml
sudo gitlab-runner reload

# 临时跑一次（调试）
sudo gitlab-runner run
```

## 常用 yml 片段拷贝即用

### Node.js 项目

```yaml
default:
  image: node:22-alpine
  cache:
    key:
      files: [pnpm-lock.yaml]
    paths: [.pnpm-store/]
  before_script:
    - corepack enable
    - pnpm install --frozen-lockfile --store-dir .pnpm-store

stages: [test, build]

test:
  stage: test
  script: pnpm test

build:
  stage: build
  script: pnpm build
  artifacts:
    paths: [dist/]
    expire_in: 1 week
```

### 跑 Postgres 的测试

```yaml
test_with_db:
  image: node:22-alpine
  services:
    - name: postgres:16
      alias: db
  variables:
    POSTGRES_USER: ci
    POSTGRES_PASSWORD: ci
    POSTGRES_DB: testdb
    DATABASE_URL: postgresql://ci:ci@db:5432/testdb
  script:
    - pnpm test:integration
```

### kaniko 构建 + push

```yaml
build_image:
  stage: build
  image:
    name: gcr.io/kaniko-project/executor:v1.23.2-debug
    entrypoint: [""]
  script:
    - mkdir -p /kaniko/.docker
    - echo "{\"auths\":{\"$CI_REGISTRY\":{\"username\":\"$CI_REGISTRY_USER\",\"password\":\"$CI_REGISTRY_PASSWORD\"}}}" > /kaniko/.docker/config.json
    - /kaniko/executor
        --context "$CI_PROJECT_DIR"
        --destination "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA"
        --destination "$CI_REGISTRY_IMAGE:latest"
        --cache=true
        --cache-repo "$CI_REGISTRY_IMAGE/cache"
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
    - if: $CI_COMMIT_TAG
```

### 部署到 K8s

```yaml
deploy:
  image: bitnami/kubectl:1.30
  before_script:
    - export KUBECONFIG=$KUBECONFIG_FILE
  script:
    - kubectl set image deployment/my-app
        my-app="$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA"
        -n production
    - kubectl rollout status deployment/my-app -n production --timeout=5m
  environment:
    name: production
    url: https://app.example.com
```

### Review App（每个 MR 一份环境）

```yaml
review:
  stage: deploy
  script: ./deploy-review.sh
  environment:
    name: review/$CI_COMMIT_REF_SLUG
    url: https://$CI_COMMIT_REF_SLUG.review.example.com
    on_stop: stop_review
    auto_stop_in: 1 week
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"

stop_review:
  script: ./teardown-review.sh
  environment:
    name: review/$CI_COMMIT_REF_SLUG
    action: stop
  when: manual
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
```

### 避免双流水线

```yaml
workflow:
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH && $CI_OPEN_MERGE_REQUESTS
      when: never
    - if: $CI_COMMIT_BRANCH
    - if: $CI_COMMIT_TAG
```

## 与其他 CI 对比备查

| 概念           | GitLab CI/CD     | Jenkins                | GitHub Actions                |
| -------------- | ---------------- | ---------------------- | ----------------------------- |
| 配置文件       | `.gitlab-ci.yml` | `Jenkinsfile`          | `.github/workflows/*.yml`     |
| 阶段           | `stages`         | `stages { stage(...) }`| `jobs.<id>.needs`             |
| 任务           | job              | stage                  | job                           |
| 步骤           | `script:`        | `steps { ... }`        | `steps:`                      |
| 执行环境       | `image:`         | `agent { docker ... }` | `runs-on:` / `container:`     |
| 条件           | `rules:`         | `when {}`              | `if:`                         |
| 并发           | `parallel:`      | `parallel { ... }`     | `strategy.matrix:`            |
| 复用           | `extends:`       | Shared Library         | Composite / Reusable Workflows |
| 引用文件       | `include:`       | `load(...)`            | `uses: ./.github/...`         |
| 部署目标       | `environment:`   | -                      | `environment:`                |
| Runner 调度    | `tags:`          | `agent { label '...' }`| `runs-on:` labels             |
| 凭据           | CI/CD Variables  | Credentials Store      | Secrets                       |
| 触发器         | `workflow:`      | `triggers { }`         | `on:`                         |
| 上下游 pipeline | `trigger:`       | `build job: '...'`     | `workflow_call:` / `repository_dispatch:` |
