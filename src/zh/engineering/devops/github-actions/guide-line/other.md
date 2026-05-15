---
layout: doc
outline: [2, 3]
---

# 指南 - 其他

> 对比 / 性能 / 安全 / 常见陷阱

## 速查

- vs GitLab CI/CD：YAML 相似但 GHA 没 stages、jobs 默认并行；GHA 复用走 Composite + Reusable Workflow
- vs Jenkins：GHA YAML vs Groovy；GHA 仓库一体 vs Jenkins 独立 server
- 性能优先级：concurrency cancel > cache > matrix 控量 > self-hosted Runner
- 安全雷区：第三方 Action 锁 SHA / fork PR 别给 secrets / GITHUB_TOKEN 默认 read-only / OIDC 替代密钥
- 常见陷阱：cron UTC 时间 / setup-X 自带 cache / artifacts 同名覆盖 / Composite Action 必填 shell

## 与 GitLab CI/CD 对比

| 维度          | GitHub Actions                       | GitLab CI/CD                          |
| ------------- | ------------------------------------ | ------------------------------------- |
| 配置位置      | `.github/workflows/*.yml`（多文件）   | `.gitlab-ci.yml`（单文件，可 include）|
| 默认 job 顺序 | **全并行**                            | 按 stages 串行                        |
| 依赖控制      | `needs:`（声明依赖）                  | `stages:` + `needs:`（默认 stages）   |
| 复用机制      | Composite Action + Reusable Workflow | extends + include                     |
| 触发器        | `on:` 极丰富（含 workflow_dispatch / repository_dispatch） | `rules:` + `workflow:`                |
| Marketplace   | **15000+ Actions** 开箱即用            | GitLab Components（较新，规模小）     |
| Secrets       | Repo / Env / Org Secrets             | Project / Group / Instance Variables  |
| OIDC          | 第一类公民，多云完整支持              | 支持，配置稍复杂                      |
| 自托管 Runner | label-based 调度                     | tag-based + Executor 类型选择多       |
| Container 内置 | GHCR + <span v-pre>`${{ secrets.GITHUB_TOKEN }}`</span> 自动注入 | Container Registry 同样集成     |

### 决策建议

- **个人 / 开源**：GHA 默认选；公开仓库永久免费 + Marketplace 杀手锏
- **公司代码在 GitLab**：当然用 GitLab CI/CD，没必要把 CI 切出去
- **公司代码在 GitHub**：直接 GHA，私有仓配额够用 + 不用自托管
- **混合（GitHub + 私有部署）**：GHA + self-hosted Runner，鱼和熊掌兼得

## 与 Jenkins 对比

| 维度          | GitHub Actions                | Jenkins                              |
| ------------- | ----------------------------- | ------------------------------------ |
| 部署          | SaaS 为主                     | 独立服务器，需 Java                  |
| 配置          | YAML                          | Jenkinsfile（Groovy DSL）             |
| 复用          | Composite + Reusable Workflow | Shared Library（Groovy 类）           |
| 调度          | runs-on labels                | Master-Agent + label                  |
| 学习曲线      | 低（YAML 即可）               | 高（Groovy + 插件 + 运维）            |
| Marketplace   | 15000+ Actions                | 1800+ 插件（覆盖更深）                |
| 触发集成      | 与仓库原生融合                | 需配 webhook + Branch Source 插件     |
| 调试          | `act` 本地模拟                | 同 Jenkins 实例上调                   |

**何时选 Jenkins 不选 GHA**：

1. 已经有成熟 Jenkins 集群和插件 / Shared Library 投入大量人力
2. 强自托管 / 内网 / 合规要求
3. 复杂动态 pipeline（运行时根据条件生成 stage）

## 性能优化清单

按收益从高到低：

### 1. concurrency cancel-in-progress

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.head_ref || github.ref }}
  cancel-in-progress: true
```

PR 同分支频繁 push 时，自动取消旧 workflow，省 minutes 明显。

### 2. 用对 cache（lockfile-based key）

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '22'
    cache: 'pnpm'                        # 内置 cache，自动按 lockfile
```

或者手写：

```yaml
- uses: actions/cache@v4
  with:
    path: ~/.local/share/pnpm/store
    key: ${{ runner.os }}-pnpm-${{ hashFiles('pnpm-lock.yaml') }}
    restore-keys: ${{ runner.os }}-pnpm-
```

错的：

```yaml
key: ${{ github.sha }}                   # ❌ 每个 commit 一份 key，等于禁用
```

### 3. matrix 控量 + fail-fast

```yaml
strategy:
  matrix:
    os: [ubuntu-latest, macos-latest, windows-latest]
    node: ['18', '20', '22']
  max-parallel: 4                        # 同时最多 4 个，省 minutes
  fail-fast: true                        # 一个失败立刻取消其它
```

矩阵爆炸时（`os` × `node` = 9）要么 `max-parallel` 限并发、要么 `exclude` 砍冗余组合。

### 4. paths filter：monorepo 友好

```yaml
on:
  push:
    paths:
      - 'apps/web/**'                    # 只有改了 apps/web 才触发
      - 'packages/ui/**'
      - 'pnpm-lock.yaml'
```

monorepo 项目不写 paths 等于每次 push 都跑全部 workflow，是浪费大头。

### 5. larger runner（付费）或 self-hosted

CPU bottleneck 时升级到 `ubuntu-latest-8-cores` / `ubuntu-latest-16-cores`——按比例多收 minutes 但速度翻倍。或者自托管，物理机能多猛就多猛。

### 6. Docker build 用 buildx + GHA 缓存

```yaml
- uses: docker/build-push-action@v6
  with:
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

GHA 缓存对 Docker layer 极有效，第二次构建可能从 5 分钟降到 1 分钟。

### 7. 用对 setup-X 自带的 cache

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '22'
    cache: 'pnpm'                        # ✅ 自带，省去自己写 actions/cache

- uses: actions/setup-python@v5
  with:
    python-version: '3.12'
    cache: 'pip'

- uses: actions/setup-go@v5
  with:
    go-version: '1.22'
    cache: true
```

## 安全实践

### 1. 第三方 Action 锁 commit SHA

```yaml
# ❌ 浮动 tag，作者可以重打覆盖（曾被供应链攻击）
- uses: third-party/action@v1

# ✅ 锁 commit SHA + Dependabot 自动 PR 升级
- uses: third-party/action@a1b2c3d4e5f6789012345678901234567890abcd
```

`@v4` 这种浮动 tag 让作者可以悄悄修改内容；`commit SHA` 不可篡改。

仓库根放 `.github/dependabot.yml`：

```yaml
version: 2
updates:
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```

Dependabot 会自动开 PR 升级 Action 到最新 SHA，你审一下合并即可。

### 2. fork PR 永远不应拿 secrets

仓库 Settings → Actions → "Fork pull request workflows from outside collaborators" → 选 `Require approval for all outside collaborators`。

或在 workflow 里显式判断：

```yaml
jobs:
  build:
    if: github.event.pull_request.head.repo.full_name == github.repository
    # 只有同仓 PR（非 fork）才跑
```

如果 fork PR 也要 CI，单独写个无 secrets 的 lint/test workflow 给 fork 用，部署 workflow 限内部 PR。

### 3. GITHUB_TOKEN 默认 read-only

2023+ GitHub 推动新仓库默认 `GITHUB_TOKEN: read-only`。已有仓库可手动开启：

Settings → Actions → General → Workflow permissions → 选 `Read repository contents permission`。

之后想写权限要 yml 里显式声明：

```yaml
permissions:
  contents: write
  pull-requests: write
```

### 4. OIDC 替代长期密钥

长期 access key / token 一旦泄露损失大。OIDC 拿短期 token（默认 1 小时过期），且 cloud 侧可按 repo / branch / environment 精细限制 sub 字段。详见 [高级 - OIDC 部署](./expert.md#oidc-部署替代长期密钥)。

### 5. secrets 不要 echo

```bash
# ❌ 即使 GitHub 会 mask 完整值，截取后会泄露
echo "Token starts with ${TOKEN:0:5}..."
echo $TOKEN | base64

# ✅ 用了但不 echo
curl -H "Auth: $TOKEN" https://api.example.com
```

debug 时永远 echo 操作结果而非密钥本身。

### 6. 限制 self-hosted Runner 的访问

仓库 Settings → Actions → Runners → 配置 Runner 时勾选 "Restrict access to the repositories that are allowed to use this runner"。

不限制的话，可能你私有 Runner 给某仓库用，结果某个 fork PR 在你机器上跑 `cat ~/.aws/credentials | curl ...`。

## 常见陷阱

### 1. cron 用的是 UTC

```yaml
schedule:
  - cron: '0 4 * * 1-5'                  # UTC 04:00 = 北京 12:00
```

GitHub 不支持 timezone，要按本地时间排自己换算。

### 2. setup-X 自带 cache 别再叠

```yaml
- uses: actions/setup-node@v4
  with: { node-version: '22', cache: 'pnpm' }  # 已经管 pnpm cache

- uses: actions/cache@v4                # ❌ 重复，可能冲突
  with:
    path: ~/.local/share/pnpm/store
    key: ...
```

只需要一个；优先用 setup-X 自带的（自动按 lockfile）。

### 3. artifacts 同名会**冲突**（v4 起）

`upload-artifact@v4` 起，**同 workflow 内同名 artifact 上传会报错**（v3 是覆盖）。matrix 多 job 上传时要加后缀：

```yaml
- uses: actions/upload-artifact@v4
  with:
    name: build-${{ matrix.os }}-${{ matrix.node }}   # 多维度后缀
    path: dist/
```

### 4. Composite Action 的 run 必填 shell

```yaml
runs:
  using: composite
  steps:
    - run: pnpm install                 # ❌ 缺 shell
      # → "shell" is required for run steps in composite actions

    - run: pnpm install                 # ✅
      shell: bash
```

### 5. needs 上游 cancelled / skipped 时下游也 skip

```yaml
jobs:
  test: { ... }
  notify:
    needs: test
    if: failure()                       # 仅在 test 失败时跑
    steps: [...]
```

但如果 test 被 cancel（concurrency 取消），notify 也 skip。要强制跑写 `if: always()` 或 `if: !cancelled()`。

### 6. 反向 needs：取上游 outputs

```yaml
deploy:
  needs: build
  runs-on: ubuntu-latest
  steps:
    - run: echo "${{ needs.build.outputs.version }}"
    # 注意是 needs.build.outputs，不是 needs.build.steps...
```

job-level outputs 需要在被 needs 的 job 里**显式声明** `outputs:`，光在 step 里 echo 到 `$GITHUB_OUTPUT` 不够。

### 7. workflow_dispatch input 都是字符串

```yaml
inputs:
  count:
    type: number                         # GitHub 这么标了
```

但 <span v-pre>`${{ inputs.count }}`</span> 拿到的还是字符串 `"5"`，做数学要 `fromJSON`：

```yaml
- run: echo $((${{ fromJSON(inputs.count) }} + 1))
```

### 8. concurrency 把 deploy 一起取消了

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true              # ❌ 部署 workflow 用这个会被 push 取消
```

部署类 workflow 应该：

```yaml
concurrency:
  group: deploy-prod
  cancel-in-progress: false             # 排队，永不取消
```

### 9. paths filter 是 OR 不是 AND

```yaml
on:
  push:
    paths:                              # 任一匹配就触发
      - 'apps/web/**'
      - 'packages/ui/**'
```

要 AND 逻辑（"既改了 web 又改了 ui 才触发"）做不到——拆成两个 workflow，或者第一个 step 里自己 `git diff` 判断。

### 10. 你的 secret 也藏不住

GHA 自动 mask 完整 secret 值，但**只 mask 完整匹配**。把 secret 写到文件再 cat、base64 编码、截取前几位——这些都会泄露。生产里永远不要打印涉及 secret 的中间状态。

## 个人 GitHub 用法 — 真要省事的话

把这套放一边后，个人项目用 GHA 的最佳实践其实很简单：

1. **只用官方 + 一线第三方 Action**：`actions/*` + `docker/*` + `pnpm/action-setup` 这些
2. **永远 `actions/checkout@v4`** 起步，不要简化掉这步
3. **cache 走 setup-X 自带**：`cache: 'pnpm'` / `'npm'` / `'pip'` 就够
4. **不需要 OIDC / 自托管 Runner / Composite Action**——个人项目用不上
5. **配额够用**：开源仓永久免费，私有 2000 分钟/月够个人
6. **trigger 用 `push` + `pull_request`**，schedule 偶尔加（每周 dependabot 类的）
7. **写一个 `release.yml` 配合 `workflow_dispatch`** 做手动发包

GHA 的好处就是"刚学就能用，深入用也撑得住"。个人不需要把这本指南通读，先跑起来再说。
