---
layout: doc
outline: [2, 3]
---

# 指南 - 高级

> 基于 GitLab 17+ / gitlab-runner 17+ 编写 — Runner 配置 + Docker 容器化部署，落地公司 CI/CD 的核心两章

## 速查

- Runner 装在你自己机器上，定期向 GitLab 轮询 job
- Executor 五种主流：`shell` / `docker` / `docker-machine` / `kubernetes` / `ssh`，生产首选 docker / kubernetes
- 注册：`gitlab-runner register --non-interactive --token glrt-xxx ...`
- Auth Token（`glrt-` 前缀）从 GitLab UI 「Settings → CI/CD → Runners → New runner」获得（17+ 标准）
- Docker 镜像构建：DinD（privileged）/ kaniko（无 daemon）/ buildah / Docker socket binding，按安全要求选
- Push 到内置 Registry：用 `CI_REGISTRY_*` 预定义变量零配置 login
- 部署 K8s：用 `image: bitnami/kubectl` + `KUBECONFIG_FILE`（file 类型变量）
- 部署 SSH：把私钥放 file 类型变量，job 里 `ssh -i $SSH_KEY user@host ...`
- environment：声明部署目标，让 GitLab 跟踪历史、滚动、回滚

## Runner 安装

### Docker 装最快

```bash
# 1. 启 runner 容器
docker run -d --name gitlab-runner --restart always \
  -v /srv/gitlab-runner/config:/etc/gitlab-runner \
  -v /var/run/docker.sock:/var/run/docker.sock \
  gitlab/gitlab-runner:v17.5.0

# 2. 在 GitLab UI 拿到 auth token (Settings → CI/CD → Runners → New runner)
#    会得到形如 glrt-xxxxxxxxxxxxxxxx 的 token

# 3. 注册（非交互式）
docker exec -it gitlab-runner gitlab-runner register \
  --non-interactive \
  --url "https://gitlab.com/" \
  --token "glrt-xxxxxxxxxxxxxxxx" \
  --executor "docker" \
  --docker-image "alpine:latest" \
  --description "company-docker-runner"
```

### Linux 包管理器装（生产推荐）

```bash
# Debian / Ubuntu
curl -L "https://packages.gitlab.com/install/repositories/runner/gitlab-runner/script.deb.sh" | sudo bash
sudo apt install gitlab-runner

# RHEL / Alibaba Cloud / Rocky
curl -L "https://packages.gitlab.com/install/repositories/runner/gitlab-runner/script.rpm.sh" | sudo bash
sudo yum install gitlab-runner

# 注册（交互式）
sudo gitlab-runner register
```

::: tip Auth Token vs Registration Token

GitLab 15.10+ 引入 **runner auth token**（`glrt-` 前缀）替代旧的 **registration token**。后者 GitLab 20.0 会移除。新装 Runner 一律走 auth token 流程：

1. 在 GitLab UI 创建一条 runner 记录（拿 token）
2. 用这个 token 注册本机 Runner

旧文档里的 `--registration-token` 已弃用，看到了就换成 `--token`。

:::

## Executor 选型

| Executor       | 优点                                      | 缺点                            | 适合                             |
| -------------- | ----------------------------------------- | ------------------------------- | -------------------------------- |
| shell          | 最简单，本机 shell 直接跑                 | 各 job 不隔离，依赖污染严重     | 试用 / 单项目独占机器             |
| docker         | 每 job 独立容器 + 缓存 / 镜像复用         | 需要 Docker daemon，磁盘易爆    | **生产首选**                      |
| docker-machine | 自动扩缩容到云上 EC2 等                   | 配置复杂，2025 起官方逐步淘汰   | 旧的自动扩容方案                 |
| kubernetes     | 弹性 + 多租户隔离 + 与 K8s 生态融合       | 需要会 K8s + 启动慢一点         | 已经上 K8s 的团队，**大规模首选** |
| ssh            | 临时连远端机器跑命令                      | 共享主机，隔离差                | 部署 job 临时跨机                |

### docker executor 配置

`config.toml`（在 `/etc/gitlab-runner/` 或 `~/.gitlab-runner/`）：

```toml
concurrent = 4                              # 同时跑 4 个 job

[[runners]]
  name = "company-docker-runner"
  url = "https://gitlab.com/"
  token = "glrt-xxxxxxxxxxxxxxxx"
  executor = "docker"

  [runners.docker]
    image = "alpine:latest"                 # 默认镜像（job 没声明 image 时用）
    privileged = false                      # 想跑 DinD 时设 true
    volumes = ["/cache"]                    # 缓存挂载点
    pull_policy = ["always"]                # 每次都拉最新镜像
    # 私有 registry 镜像加速
    [runners.docker.tmpfs]
      "/tmp" = "rw,exec"
    # 默认拉镜像走的 registry
    [runners.docker.services_tmpfs]

  [runners.cache]
    Type = "s3"                             # 缓存放到 S3 / MinIO（多 Runner 共享）
    Shared = true
    [runners.cache.s3]
      ServerAddress = "minio.local:9000"
      AccessKey = "..."
      SecretKey = "..."
      BucketName = "gitlab-runner-cache"
```

### kubernetes executor 配置

```toml
[[runners]]
  name = "k8s-runner"
  url = "https://gitlab.com/"
  token = "glrt-xxxxxxxxxxxxxxxx"
  executor = "kubernetes"

  [runners.kubernetes]
    namespace = "gitlab-runner"
    image = "alpine:latest"
    cpu_request = "100m"
    memory_request = "256Mi"
    cpu_limit = "2"
    memory_limit = "4Gi"
    helper_image = "gitlab/gitlab-runner-helper:latest"
    # 让每个 job 在独立 Pod 里跑
    pod_labels = ["gitlab-ci"]
```

或者直接装 GitLab 官方 Runner Helm Chart：

```bash
helm repo add gitlab https://charts.gitlab.io
helm install gitlab-runner gitlab/gitlab-runner \
  --namespace gitlab-runner \
  --set gitlabUrl=https://gitlab.com/ \
  --set runnerRegistrationToken=glrt-xxx \
  --set runners.config="..."
```

## Docker 镜像构建：四种姿势

### 1. Docker-in-Docker（DinD）—— 经典但需 privileged

```yaml
build_image:
  stage: build
  image: docker:24-cli
  services:
    - docker:24-dind
  variables:
    DOCKER_TLS_CERTDIR: "/certs"          # 启用 TLS
    DOCKER_HOST: tcp://docker:2376
    DOCKER_CERT_PATH: "/certs/client"
    DOCKER_TLS_VERIFY: 1
  before_script:
    - echo "$CI_REGISTRY_PASSWORD" | docker login -u "$CI_REGISTRY_USER" --password-stdin "$CI_REGISTRY"
  script:
    - docker build -t "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA" .
    - docker push "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA"
```

需要 Runner 启用 privileged：

```toml
[runners.docker]
  privileged = true                          # 必须！否则 dind service 起不来
```

::: warning DinD privileged 的安全代价

privileged 容器实质上拥有 host root 权限。如果 CI yml 由不可信用户控制（fork 提交等），等于把 host 暴露给攻击者。生产环境优先考虑 kaniko / buildah。

:::

### 2. kaniko —— 不需要 daemon / privileged

```yaml
build_image:
  stage: build
  image:
    name: gcr.io/kaniko-project/executor:v1.23.2-debug
    entrypoint: [""]
  script:
    - mkdir -p /kaniko/.docker
    - |
      cat <<EOF > /kaniko/.docker/config.json
      {
        "auths": {
          "$CI_REGISTRY": {
            "username": "$CI_REGISTRY_USER",
            "password": "$CI_REGISTRY_PASSWORD"
          }
        }
      }
      EOF
    - /kaniko/executor
        --context "${CI_PROJECT_DIR}"
        --dockerfile "${CI_PROJECT_DIR}/Dockerfile"
        --destination "${CI_REGISTRY_IMAGE}:${CI_COMMIT_SHA}"
        --destination "${CI_REGISTRY_IMAGE}:latest"
        --cache=true
        --cache-repo "${CI_REGISTRY_IMAGE}/cache"
```

优势：

- **无需 privileged**——直接以普通 Docker container 跑
- 内置 layer 缓存（`--cache --cache-repo`）
- 输出与 Docker build 兼容的 OCI 镜像

劣势：

- 比 DinD 慢一点（无 host buildkit）
- 部分 Dockerfile 语法支持滞后（不过 90% 的项目用不到那些特性）

### 3. buildah —— Red Hat 出品

```yaml
build_image:
  stage: build
  image: quay.io/buildah/stable
  variables:
    STORAGE_DRIVER: vfs
    BUILDAH_FORMAT: docker
  before_script:
    - echo "$CI_REGISTRY_PASSWORD" | buildah login -u "$CI_REGISTRY_USER" --password-stdin "$CI_REGISTRY"
  script:
    - buildah build -t "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA" .
    - buildah push "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA"
```

适合：RHEL / Fedora / OpenShift 生态用户。

### 4. Docker socket binding —— 简单粗暴

```yaml
build_image:
  tags: [socket-binding-runner]                # 只让特定 Runner 跑
  image: docker:24-cli
  before_script:
    - docker info
  script:
    - docker build -t "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA" .
    - docker push "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA"
```

Runner 端把 host 的 docker.sock 挂进来：

```toml
[runners.docker]
  volumes = ["/cache", "/var/run/docker.sock:/var/run/docker.sock"]
```

优劣：

- **快**——直接复用 host daemon
- **极不安全**——job 容器能控制整台 host 的 docker，连别人正在跑的容器都能操作
- 只用在 Runner 是单租户、不接外部 PR 的场景

## 部署到 Kubernetes

```yaml
deploy_k8s:
  stage: deploy
  image: bitnami/kubectl:1.30
  variables:
    KUBE_CONTEXT: prod-cluster
  before_script:
    # KUBECONFIG_FILE 是 File 类型变量，值就是文件路径
    - export KUBECONFIG=$KUBECONFIG_FILE
    - kubectl config use-context $KUBE_CONTEXT
  script:
    - kubectl set image deployment/my-app
        my-app="$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA"
        --namespace=production
    - kubectl rollout status deployment/my-app --namespace=production --timeout=5m
  environment:
    name: production
    url: https://app.example.com
    deployment_tier: production
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
```

`KUBECONFIG_FILE` 是 **File 类型变量**：

1. 在 GitLab UI → Settings → CI/CD → Variables → Add variable
2. Key: `KUBECONFIG_FILE`
3. Type: **File**
4. Value: 整个 kubeconfig YAML 内容
5. 勾选 Protect + Mask（如有 token）

job 里 `$KUBECONFIG_FILE` 自动展开为临时文件路径（如 `/builds/.../KUBECONFIG_FILE`），文件内容是你填的 YAML。

### Helm Chart 升级

```yaml
deploy_with_helm:
  stage: deploy
  image: alpine/helm:3.16
  variables:
    KUBECONFIG: $KUBECONFIG_FILE
  script:
    - helm upgrade --install my-app ./charts/my-app
        --namespace production
        --set image.tag="$CI_COMMIT_SHA"
        --set image.repository="$CI_REGISTRY_IMAGE"
        --atomic                                # 失败自动回滚
        --timeout 10m
  environment:
    name: production
```

## 部署到 SSH 主机

```yaml
deploy_ssh:
  stage: deploy
  image: alpine:3.20
  before_script:
    - apk add --no-cache openssh-client rsync
    - chmod 600 "$SSH_PRIVATE_KEY"             # File 类型变量
    - mkdir -p ~/.ssh
    - ssh-keyscan -H "$DEPLOY_HOST" >> ~/.ssh/known_hosts
  script:
    - rsync -avz --delete dist/ deploy@"$DEPLOY_HOST":/var/www/app/
    - ssh -i "$SSH_PRIVATE_KEY" deploy@"$DEPLOY_HOST" 'sudo systemctl reload nginx'
  environment:
    name: production
    url: https://app.example.com
```

`SSH_PRIVATE_KEY` 同样用 File 类型，值是 RSA / Ed25519 私钥全文。

## environment：让 GitLab 看见部署

```yaml
deploy_staging:
  script: ./deploy.sh staging
  environment:
    name: staging                              # 环境名
    url: https://staging.example.com           # 部署后地址
    deployment_tier: staging                   # 显式声明层级
    on_stop: stop_staging                      # 停止环境时跑的 job
    auto_stop_in: 2 hours                      # 2 小时后自动停（如清理资源）

stop_staging:
  script: ./teardown.sh staging
  environment:
    name: staging
    action: stop                               # 必须有
  when: manual                                 # 一般 manual 触发
```

效果：

- GitLab UI → Operate → Environments 能看到所有环境 + 部署历史
- MR 上能看到 "Deployed to staging" + URL
- 可手动回滚到任何历史版本

### Review App：每个 MR 一份独立环境

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

每个 MR 自动起一份独立环境，URL 在 MR 上一眼能看到——前端 / 设计师可以直接打开预览。MR 关闭后自动 teardown，1 周后再不动也清理。

## 一份完整的"构建 + 推镜像 + 部署"yml

```yaml
# .gitlab-ci.yml
stages:
  - install
  - test
  - build
  - deploy

default:
  image: node:22-alpine
  cache:
    key:
      files: [pnpm-lock.yaml]
    paths: [.pnpm-store/]
  before_script:
    - corepack enable

install:
  stage: install
  script:
    - pnpm install --frozen-lockfile --store-dir .pnpm-store

# ---- 测试阶段：DAG 并行 ----
lint:
  stage: test
  needs: [install]
  script: pnpm lint
type:
  stage: test
  needs: [install]
  script: pnpm type-check
unit:
  stage: test
  needs: [install]
  script: pnpm test:unit
  artifacts:
    when: always
    reports:
      junit: reports/*.xml
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura.xml

# ---- 构建镜像（仅主干 / tag）----
build_image:
  stage: build
  image:
    name: gcr.io/kaniko-project/executor:v1.23.2-debug
    entrypoint: [""]
  needs: [lint, type, unit]
  script:
    - mkdir -p /kaniko/.docker
    - |
      cat <<EOF > /kaniko/.docker/config.json
      {"auths":{"$CI_REGISTRY":{"username":"$CI_REGISTRY_USER","password":"$CI_REGISTRY_PASSWORD"}}}
      EOF
    - /kaniko/executor
        --context "$CI_PROJECT_DIR"
        --destination "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA"
        --destination "$CI_REGISTRY_IMAGE:latest"
        --cache=true
        --cache-repo "$CI_REGISTRY_IMAGE/cache"
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
    - if: $CI_COMMIT_TAG

# ---- 部署 staging（主干自动）----
deploy_staging:
  stage: deploy
  image: bitnami/kubectl:1.30
  needs: [build_image]
  before_script:
    - export KUBECONFIG=$KUBECONFIG_STAGING
  script:
    - kubectl set image deployment/my-app my-app="$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA" -n staging
    - kubectl rollout status deployment/my-app -n staging --timeout=5m
  environment:
    name: staging
    url: https://staging.example.com
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH

# ---- 部署 prod（tag 触发 + 手动）----
deploy_prod:
  stage: deploy
  image: bitnami/kubectl:1.30
  needs: [build_image]
  before_script:
    - export KUBECONFIG=$KUBECONFIG_PROD
  script:
    - kubectl set image deployment/my-app my-app="$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA" -n production
    - kubectl rollout status deployment/my-app -n production --timeout=10m
  environment:
    name: production
    url: https://app.example.com
    deployment_tier: production
  rules:
    - if: $CI_COMMIT_TAG
      when: manual                              # tag 推送时显示手动按钮
```

这份 yml 大致就是公司项目落地 GitLab CI/CD 的"最小完整版"——按需替换 image / kubectl context / secret 名即可。
