---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 GitLab 17+ / gitlab-runner 17+ 编写

## 速查

- 配置文件：仓库根目录 `.gitlab-ci.yml`（路径在项目 Settings → CI/CD → General pipelines 可改）
- 顶层关键字：`stages` / `default` / `variables` / `workflow` / `include`
- 任务最小结构：`job_name: { script: [...] }`，`script` 必填
- 阶段默认：`build → test → deploy`（不定义 `stages` 时）；未指定 `stage` 的 job 落到 `test`
- 跑 pipeline：push / merge / Tag / 手动 / 定时（Schedules）
- Runner：执行 job 的进程；GitLab.com 用 shared runner（有配额），自建用 `gitlab-runner register`
- 凭据：Settings → CI/CD → Variables（protected / masked / hidden / file 四种属性）

## 第一份 `.gitlab-ci.yml`

```yaml
# .gitlab-ci.yml
stages:
  - install
  - test
  - build

variables:
  NODE_VERSION: "22"

default:
  image: node:22-alpine                # 整条 pipeline 默认镜像
  cache:                                # 跨 job 缓存 node_modules
    key: ${CI_COMMIT_REF_SLUG}
    paths:
      - node_modules/

install:
  stage: install
  script:
    - corepack enable
    - pnpm install --frozen-lockfile

test:
  stage: test
  script:
    - pnpm test:unit

build:
  stage: build
  script:
    - pnpm build
  artifacts:
    paths:
      - dist/
    expire_in: 1 week
```

把它推到任何分支，GitLab 自动起一条 pipeline，按 `install → test → build` 顺序执行。

## Pipeline / Stage / Job 三层

```
Pipeline ──┬── Stage: install ── Job: install
           ├── Stage: test    ──┬── Job: lint        ┐
           │                    ├── Job: type-check  ├─ 并行
           │                    └── Job: test:unit   ┘
           └── Stage: build   ── Job: build
```

- **Pipeline**：一次完整的 CI 运行
- **Stage**：阶段，**同一 stage 内的 jobs 并行**，下一个 stage 等本 stage 全成功才开始
- **Job**：实际跑命令的最小单元，每个 job 在独立的 Runner / Executor 环境里执行

## Job 必备 + 常用字段

```yaml
my_job:
  stage: test                          # 落到哪个 stage（默认 test）
  image: node:22-alpine                 # 用哪个 Docker 镜像
  services:                             # 旁路服务（数据库 / dind 等）
    - postgres:16
  variables:                            # 仅本 job 生效的变量
    DB_HOST: postgres
  before_script:                        # script 前跑（继承自 default 可被覆盖）
    - pnpm install
  script:                               # 必填，job 真正干活的命令
    - pnpm test:unit
  after_script:                         # script 后跑，独立 shell，**不会让 job 失败**
    - echo "Done"
  artifacts:                            # 产物：跨 job / 下载
    paths: [coverage/]
    when: always
  cache:                                # 缓存：加速重跑
    key: gems-${CI_COMMIT_REF_SLUG}
    paths: [vendor/]
  rules:                                # 条件触发
    - if: $CI_COMMIT_BRANCH == "main"
  tags:                                 # 限定哪些 Runner 能跑
    - linux-build
```

::: tip `script` 必填

GitLab 解析 yml 时，每个 job 都强制要求 `script` 字段。即使是部署 job 也得写 `script:[]`（或具体命令）；省略会直接报错"jobs:xxx config should contain at least one script step"。

:::

## 缓存（cache）vs 产物（artifacts）

| 维度       | cache                          | artifacts                            |
| ---------- | ------------------------------ | ------------------------------------ |
| 目的       | 加速重复构建（依赖 / 编译中间体）| 跨 job / 下载 / 部署的成品           |
| 存储       | Runner 本地（或对象存储）      | GitLab 服务端                        |
| 跨 pipeline | 是（按 key 复用）              | 否（仅 pipeline 内或显式下载）       |
| 失败时上传 | 否                             | `when: always` 可在失败时也上传      |
| 大小       | 适合数百 MB 的依赖             | 适合 MB 级产物（默认上传到 GitLab）  |

经验法则：`node_modules / .next/cache / .cargo` 用 cache；`dist / coverage / *.test.xml` 用 artifacts。

## 触发 Pipeline

| 方式       | 触发条件                                   | yml 配合                            |
| ---------- | ------------------------------------------ | ----------------------------------- |
| push       | git push 到分支                            | 默认行为，不用配                    |
| merge      | 创建 / 更新 / 合并 MR                      | `rules: $CI_PIPELINE_SOURCE == "merge_request_event"` |
| tag        | 推送 git tag                               | `rules: $CI_COMMIT_TAG`             |
| schedule   | UI 配 schedule（cron）                     | `rules: $CI_PIPELINE_SOURCE == "schedule"` |
| manual     | UI 点击 Run pipeline 按钮                  | `when: manual`                      |
| API        | curl 调 GitLab API                         | `rules: $CI_PIPELINE_SOURCE == "api"` |
| trigger    | 由上游 / 跨项目 pipeline 触发              | `trigger:` keyword                  |

## Runner 是什么

`gitlab-runner` 是装在你的机器上的"打工人"进程，它定期向 GitLab 服务端轮询有没有要跑的 job，拉到就在本地 / Docker / K8s 中执行。三类 Runner：

| 类型         | 范围                  | 谁能用                         | 适合                       |
| ------------ | --------------------- | ------------------------------ | -------------------------- |
| Instance     | 整个 GitLab 实例所有项目 | 管理员配置后所有项目可见       | 共享构建池                 |
| Group        | 一个 Group 下所有项目 | Group 内所有项目自动可用       | 团队 / 部门级专属          |
| Project      | 单个项目              | 仅当前项目可见                 | 专用机器 / 特殊硬件需求    |

GitLab.com 提供 instance shared runner（免费有配额），自建实例需要自己装。

## 一份能跑的最小 docker 镜像构建示例

```yaml
# .gitlab-ci.yml
stages: [build]

build_image:
  stage: build
  image: docker:24-cli
  services:
    - docker:24-dind
  variables:
    DOCKER_TLS_CERTDIR: "/certs"        # 启用 TLS
  before_script:
    - echo "$CI_REGISTRY_PASSWORD" | docker login -u "$CI_REGISTRY_USER" --password-stdin "$CI_REGISTRY"
  script:
    - docker build -t "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA" .
    - docker push "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA"
    - docker tag  "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA" "$CI_REGISTRY_IMAGE:latest"
    - docker push "$CI_REGISTRY_IMAGE:latest"
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
```

`CI_REGISTRY_*` 是 GitLab 注入的预定义变量，零配置就能 push 到内置 Container Registry。

## 下一步

- yml 关键字全部用法见 [指南 - 基础](./guide-line/base.md)
- `rules / needs / extends / include` 见 [指南 - 进阶](./guide-line/advanced.md)
- 自建 Runner 配置 + Docker 容器化部署见 [指南 - 高级](./guide-line/expert.md)
- 与 Jenkins / GitHub Actions 对比 + 常见陷阱见 [指南 - 其他](./guide-line/other.md)
- 预定义变量 / 完整关键字速查见 [参考](./reference.md)
