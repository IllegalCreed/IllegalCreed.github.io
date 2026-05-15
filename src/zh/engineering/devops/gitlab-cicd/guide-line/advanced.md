---
layout: doc
outline: [2, 3]
---

# 指南 - 进阶

> 基于 GitLab 17+ 编写 — rules / needs / extends / include / variables 的玩法

## 速查

- `rules`：替代 `only / except`，条件触发；支持 `if / changes / exists / variables`
- `needs`：打破 stage 串行，DAG 加速
- `extends`：YAML 锚点之外的"配置继承"，支持多层 + 数组
- `include`：拆分 yml；`local / project / remote / template / component` 五种来源
- `variables`：全局 / job / 默认 / file 类型 / 受保护 / masked
- `workflow.rules`：决定 pipeline 是否创建（vs `rules` 决定 job 是否加入）
- `trigger`：触发下游或子 pipeline

## rules：替代 only / except

```yaml
build:
  script: pnpm build
  rules:
    - if: $CI_COMMIT_TAG                            # 1. 打 tag：跑
      when: on_success
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH   # 2. 主干推送：跑
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"  # 3. MR 触发：手动
      when: manual
      allow_failure: true
    - when: never                                    # 4. 其它情况：不跑（兜底）
```

**rules 是顺序匹配**：第一个命中的规则决定 job 是否创建以及附带的 `when / allow_failure / variables`。没匹配上就不创建 job。

::: warning rules 取代了 only / except

GitLab 13.5 起 `rules` 是官方推荐，`only / except` 不会被移除但停止演进。**新项目应该统一用 rules**——它表达力更强、和 `workflow` 联动更顺。

:::

### 常用 rules 模板

**主干 + tag 才跑：**

```yaml
rules:
  - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
  - if: $CI_COMMIT_TAG
```

**只在文件改动时跑：**

```yaml
rules:
  - changes:
      - "src/**/*.ts"
      - "package.json"
```

**MR 触发 + 修改了前端代码：**

```yaml
rules:
  - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    changes:
      paths: ["apps/web/**/*"]
      compare_to: "refs/heads/main"
```

**变量条件 + 兜底 never：**

```yaml
rules:
  - if: $DEPLOY_PROD == "true"
    when: manual
  - when: never
```

### rules 里赋变量

```yaml
deploy:
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
      variables:
        ENV: production
    - if: $CI_COMMIT_BRANCH =~ /^release\//
      variables:
        ENV: staging
  script:
    - ./deploy.sh $ENV
```

匹配到的规则可以注入 `variables`，比手写 if/else 干净。

## needs：DAG 加速

不写 `needs` 时 stage 是串行的，写了 `needs` 后该 job 一旦它依赖的 job 完成就开跑，无视 stage 边界：

```yaml
stages: [install, test, build, deploy]

install: { stage: install, script: pnpm install }

lint:    { stage: test, needs: [install], script: pnpm lint }
type:    { stage: test, needs: [install], script: pnpm type-check }
unit:    { stage: test, needs: [install], script: pnpm test:unit }

build:
  stage: build
  needs:
    - install
    - job: unit
      artifacts: true                  # 默认就是 true，写出来显式
  script: pnpm build

deploy:
  stage: deploy
  needs:
    - job: build
      artifacts: true
    - job: lint                        # 等 lint 也通过
    - job: type
  script: ./deploy.sh
```

效果：unit / lint / type 三个 job 一旦 install 完成就并行开跑，build 不必等 lint / type 而是只等 unit，deploy 才等齐 build/lint/type。最快路径取代了线性 stage。

::: tip needs 上限

GitLab 默认每个 job 最多 50 个 needs（实例可调）。大型 monorepo 用 needs 矩阵时记得别超过这个数。

:::

## extends：配置继承

```yaml
.node-base:
  image: node:22-alpine
  before_script:
    - corepack enable
    - pnpm install --frozen-lockfile
  cache:
    key: ${CI_COMMIT_REF_SLUG}
    paths: [node_modules/]

.deploy-base:
  image: alpine:3.20
  before_script:
    - apk add --no-cache curl
  rules:
    - if: $CI_COMMIT_BRANCH == "main"

test:
  extends: .node-base                   # 单继承
  stage: test
  script: pnpm test

deploy_prod:
  extends:                              # 多继承（后面的覆盖前面的）
    - .node-base
    - .deploy-base
  stage: deploy
  script: ./deploy.sh prod
```

**约定**：以 `.` 开头的 job 名（`.node-base`）是"模板"，GitLab 不会把它当真的 job 跑，只用来被继承。

### extends vs YAML 锚点

```yaml
# YAML 锚点（&xxx + <<: *xxx）—— 旧方式
.cache_anchor: &node_cache
  key: ${CI_COMMIT_REF_SLUG}
  paths: [node_modules/]

job_a:
  cache: *node_cache                    # 完全替换

# extends —— 推荐
.node-base:
  cache:
    key: ${CI_COMMIT_REF_SLUG}
    paths: [node_modules/]

job_b:
  extends: .node-base                   # 深度合并
```

差异：

- **锚点**：纯 YAML 特性，只能完全替换值
- **extends**：GitLab CI 的特性，**深度合并**（嵌套字段一一合并，更智能）

多数情况用 extends 就好；YAML 锚点只在跨文件、需要被任意位置引用的标量值时还有点优势。

## include：拆分配置

把 yml 拆成多份，按需引入：

```yaml
include:
  # 1. 本地：仓库内其它 yml
  - local: '.gitlab/ci/test.yml'

  # 2. 跨项目：从另一个仓库拉
  - project: 'platform/ci-templates'
    ref: 'main'                         # 分支 / tag / commit
    file: '/templates/node.yml'

  # 3. 远程：HTTP URL
  - remote: 'https://example.com/ci-template.yml'

  # 4. GitLab 内置模板（在 GitLab 服务端预置）
  - template: 'Auto-DevOps.gitlab-ci.yml'

  # 5. CI/CD Component（GitLab 16.10+）
  - component: gitlab.com/components/code-quality@1.0
    inputs:
      stage: lint
```

各类适用：

| 来源       | 适合                                       |
| ---------- | ------------------------------------------ |
| local      | 同一仓库内按目录拆 yml（推荐）             |
| project    | 公司共享 CI 模板仓库                       |
| remote     | 临时引用外部脚本，不推荐生产               |
| template   | GitLab 自带（如 Auto-DevOps / SAST）       |
| component  | 新的可参数化模板系统，类似 Helm chart      |

### 真实场景：monorepo 拆 yml

```
.gitlab/
  ci/
    common.yml                         # 公共模板（.node-base / .deploy-base）
    frontend.yml                       # 前端的 jobs
    backend.yml                        # 后端的 jobs
    deploy.yml                         # 部署 jobs
.gitlab-ci.yml                          # 主入口
```

```yaml
# .gitlab-ci.yml
include:
  - local: '.gitlab/ci/common.yml'
  - local: '.gitlab/ci/frontend.yml'
  - local: '.gitlab/ci/backend.yml'
  - local: '.gitlab/ci/deploy.yml'

stages:
  - install
  - test
  - build
  - deploy
```

## variables 深入

### 定义层级（高 → 低优先级）

```yaml
variables:
  APP_NAME: my-app                      # pipeline 级（全局）
  DEPLOY_ENV: staging

deploy_prod:
  variables:
    DEPLOY_ENV: production              # job 级覆盖
  script:
    - echo "$APP_NAME / $DEPLOY_ENV"    # my-app / production
```

UI 配置的变量（Project / Group / Instance）在 yml 之上，又被 pipeline 触发变量、policy 变量覆盖。完整顺序见 [参考](../reference.md#变量优先级)。

### 受保护变量（Protected）

UI 配置变量勾选 "Protect variable"，**只在 protected branches / tags 跑的 pipeline 里可见**。常用于：

- 部署到 prod 的密钥（只在 main 推送时可见）
- 签名证书 / Apple 推送证书

### 屏蔽变量（Masked）

勾选 "Mask variable" 后，job 日志里的变量值显示为 `[MASKED]`。要求：

- 单行无空格
- 至少 8 字符
- 不能命中 Base64 / 常见 hash 等格式

::: warning Masked 不是绝对安全

GitLab 只屏蔽**完整变量值**。如果脚本里 `echo ${TOKEN:0:5}`（取前 5 字符）或 base64 编码后 echo，**还是会泄露**。生产里永远别 echo 密钥相关变量。

:::

### 文件类型变量

UI 勾选 "Type: File" 时，变量值会被存到临时文件，环境变量值变成**文件路径**：

```yaml
deploy:
  script:
    - kubectl --kubeconfig=$KUBECONFIG_FILE apply -f k8s/
    # KUBECONFIG_FILE = "/builds/secrets/KUBECONFIG_FILE"
    # 文件内容 = UI 上配置的 kubeconfig YAML
```

适合那些"要求文件路径而不是字符串"的工具：`kubectl --kubeconfig`、`gcloud auth --key-file`、`docker --config`。

### 预定义变量速查（常用）

| 变量                       | 含义                                       |
| -------------------------- | ------------------------------------------ |
| `CI_PROJECT_NAME`          | 项目名（如 `quiz-monorepo`）              |
| `CI_PROJECT_PATH`          | namespace + 项目名（`group/sub/project`）  |
| `CI_COMMIT_SHA`            | 当前 commit 完整 hash                      |
| `CI_COMMIT_SHORT_SHA`      | 前 8 位短 hash                             |
| `CI_COMMIT_BRANCH`         | 当前分支名（push 触发才有）                |
| `CI_COMMIT_TAG`            | tag 名（tag 触发才有）                     |
| `CI_COMMIT_REF_SLUG`       | 分支 / tag 的 URL-safe 版本                |
| `CI_DEFAULT_BRANCH`        | 默认分支（如 `main`）                      |
| `CI_PIPELINE_SOURCE`       | `push / merge_request_event / schedule / api / trigger / pipeline` |
| `CI_MERGE_REQUEST_IID`     | MR 编号                                    |
| `CI_REGISTRY` / `CI_REGISTRY_IMAGE` | 内置 Container Registry URL / 项目镜像名 |
| `CI_REGISTRY_USER` / `CI_REGISTRY_PASSWORD` | 自动 login 的凭据 |
| `CI_JOB_TOKEN`             | 临时令牌，可拉取 artifacts / 触发下游 |

完整表见 [参考](../reference.md#预定义变量速查表)。

## workflow.rules：决定 pipeline 是否创建

`rules`（job 级）决定的是 job 在 pipeline 里是否出现；`workflow.rules` 决定的是**整个 pipeline 是否创建**：

```yaml
workflow:
  rules:
    - if: $CI_COMMIT_TITLE =~ /-draft$/   # commit 信息含 -draft 的不跑
      when: never
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
    - if: $CI_COMMIT_TAG
    - when: never                          # 其它情况不跑
```

避免"双流水线"（同一 commit 既是 push 又是 MR 时跑两遍）：

```yaml
workflow:
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"  # MR 时跑 MR pipeline
    - if: $CI_COMMIT_BRANCH && $CI_OPEN_MERGE_REQUESTS  # 推到有 MR 的分支：不跑（去重）
      when: never
    - if: $CI_COMMIT_BRANCH                              # 其它推送跑
```

## trigger：触发下游 / 子 pipeline

### 跨项目触发

```yaml
deploy_downstream:
  stage: deploy
  trigger:
    project: platform/deployer
    branch: main
    strategy: depend                    # 阻塞等下游完成
  variables:
    APP_VERSION: ${CI_COMMIT_SHA}
```

### 子 pipeline（同项目内）

```yaml
trigger_subpipeline:
  stage: deploy
  trigger:
    include:
      - local: '.gitlab/ci/deploy-subpipeline.yml'
    strategy: depend
```

### 动态子 pipeline（先生成 yml）

```yaml
generate_yml:
  stage: build
  script: ./scripts/generate-ci.sh > dynamic.yml
  artifacts: { paths: [dynamic.yml] }

trigger_dynamic:
  stage: deploy
  needs: [generate_yml]
  trigger:
    include:
      - artifact: dynamic.yml
        job: generate_yml
```

适合 monorepo / 包数量不固定的场景：先扫描出哪些包改了，再动态生成只跑这些包的子 pipeline。
