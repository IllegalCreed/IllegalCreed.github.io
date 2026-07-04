---
layout: doc
outline: [2, 3]
---

# 告警、安全更新、分组与命令

> 基于 Dependabot（GitHub 原生）· 核于 2026-07

## 速查

- **alerts 来源**：**GitHub Advisory Database（GHSA）**——只有 GitHub 审核过的公告会触发；靠**依赖图**扫描默认分支
- **触发时机**：GHSA 新增公告，或依赖图变化（新增 / 升级依赖后）
- **alert 内容**：受影响文件链接、严重级、（若有）修复版本
- **auto-triage 规则**：可自动关闭低风险告警、在通知前降噪
- **security updates 前提**：**依赖图 + alerts 都开**，且依赖出现在 manifest / 锁文件里
- **最小必要升级**：只把漏洞依赖抬到**含补丁的最低版本**，不顺手升到最新
- **间接依赖**：npm 可改父依赖或移除子依赖；其它生态若需改父依赖，则无法自动修间接依赖
- **不与常规更新混组**：security 与 version updates 不同组；不同生态的 security updates 也彼此不同组
- **分组降噪**：`groups` 按 `patterns` / `exclude-patterns` / `dependency-type` / `update-types` / `applies-to` 合并 PR
- **monorepo 跨目录**：`group-by: dependency-name` 把多目录同一依赖合成一个 PR
- **命令**：PR 下评论 `@dependabot merge` / `rebase` / `recreate` / `close` / `ignore …`，机器人以 👍 确认
- **私有源**：顶层 `registries` 定义，凭据存加密 secret，用 <code v-pre>${{secrets.NAME}}</code> 引用

## Dependabot alerts：基于 GHSA 的漏洞检测

alerts 的职责是**发现**：它拿仓库的**依赖图**去比对 **GitHub Advisory Database（GHSA）**，凡是引入了已知漏洞的依赖，就在仓库 Security 面板生成一条告警。每条告警包含：

- 受影响文件（清单 / 锁文件）的链接；
- 漏洞详情与**严重级**；
- （若有）**修复版本**。

触发条件有两类：

1. **GHSA 新增了一条公告**——你没动代码，但世界变了，某个依赖突然「有洞」；
2. **依赖图发生变化**——你提交了新增 / 升级依赖，引入了已知漏洞版本。

局限（务必知道）：

- 只有**经 GitHub 审核（GitHub-reviewed）的公告**才触发告警；未收录的漏洞不会报。
- 新漏洞进入 Advisory Database **有滞后**，不是零延迟。
- **归档仓库不扫描**。
- **GitHub Actions 的告警只对语义化版本（tag）有效**，对锁定的 commit SHA 不报（这是「锁 SHA」安全实践的一个取舍）。

可以用 **Dependabot auto-triage 规则**在通知前自动关闭低风险告警，缓解告警疲劳。

## Dependabot security updates：最小必要升级

security updates 的职责是**修复**：一旦某条 alert 存在可用补丁，Dependabot 就自动开 PR，把漏洞依赖升到**「含补丁的最低版本」**——即**最小必要升级**，而不是顺手升到最新，以尽量减少破坏性。合并后，对应的 alert 会自动关闭。

要点与前提：

- 需要**依赖图 + Dependabot alerts 都启用**；依赖须出现在 manifest 或锁文件里。
- **间接（传递）依赖**：`npm` 能通过更新父依赖、甚至移除子依赖来修；其它多数生态若必须改动父依赖才能修，则**无法自动修**间接依赖。
- security updates 与 version updates **不会合进同一个 PR**；不同 package 生态的 security updates 也**彼此不分组**。
- 安全更新**不需要 `dependabot.yml`**（开关即可），但你可以用 yml 微调它——例如给它加 `labels`、指定 `target-branch`，或用 `groups` 配合 `applies-to: security-updates` 分组。

## groups：把一堆升级合成一个 PR

依赖一多，Dependabot 一个包一个 PR 会淹没你。`groups` 把符合条件的更新**合并进一个 PR**，让你集中 review。

分组条件（**每个生态各自配置**，同一生态可有多个 group）：

- `patterns` / `exclude-patterns`：按包名匹配（精确名或通配）；命中 `exclude-patterns` 的会被移出该组、通常单独开 PR。
- `dependency-type`：`production` / `development`。
- `update-types`：**裸**的 `major` / `minor` / `patch`（注意与 `ignore.update-types` 的 `version-update:semver-*` 写法不同）。
- `applies-to`：`version-updates`（缺省默认）或 `security-updates`——决定这个组作用于哪条主线。

```yaml
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    groups:
      # 所有非破坏性升级合成一个 PR
      minor-and-patch:
        patterns: ["*"]
        update-types: ["minor", "patch"]
      # ESLint 全家桶单独一个 PR
      eslint:
        patterns:
          - "eslint"
          - "@eslint/*"
          - "eslint-*"
      # 给安全更新也分个组
      security:
        applies-to: "security-updates"
        patterns: ["*"]
```

**monorepo**：在多目录（`directories`）下，用 `group-by: dependency-name` 可以「**同一依赖跨多个目录的升级合成一个 PR**」，显著减少 PR 数量与 CI 开销。

## `@dependabot` 评论命令

在 Dependabot 开的 PR 下评论以下命令即可操作；机器人会用 👍 表情确认并可能回帖：

| 命令 | 作用 |
| --- | --- |
| `@dependabot rebase` | 对该 PR 执行 rebase |
| `@dependabot recreate` | 重建该 PR，**覆盖你在其上做的任何修改** |
| `@dependabot merge` | CI 通过后合并 |
| `@dependabot squash and merge` | CI 通过后 squash 合并 |
| `@dependabot cancel merge` | 取消先前请求的合并 |
| `@dependabot reopen` | 重新打开已关闭的 PR |
| `@dependabot close` | 关闭 PR 并阻止 Dependabot 再次重建它 |
| `@dependabot show <dependency name> ignore conditions` | 列出该依赖当前所有 ignore 条件（回帖表格） |
| `@dependabot ignore this dependency` | 关闭 PR 并**不再为该依赖开任何 PR** |
| `@dependabot ignore this major version` | 不再为此**大版本**开 PR |
| `@dependabot ignore this minor version` | 不再为此**小版本**开 PR |
| `@dependabot ignore <dependency name> <update type>` | **仅分组 PR**：阻止更新指定依赖的指定版本类型 |
| `@dependabot unignore <dependency name>` | **仅分组 PR**：清除该依赖的全部 ignore 条件并重开 PR |
| `@dependabot unignore <dependency name> <ignore condition>` | **仅分组 PR**：清除指定 ignore 条件并重开 PR |

补充：

- Dependabot 默认**自动 rebase** 解决冲突；PR 超过 **30 天**没合并则停止 rebase。
- 若想在 Dependabot 的分支上追加提交而不被它 force-push 覆盖，在提交信息里加 `[dependabot skip]` / `[skip dependabot]` / `[dependabot-skip]` / `[skip-dependabot]`（大小写不限）。
- 用 `@dependabot ignore …` 下达的 ignore 条件是**持久化**的，等价于写进 `ignore` 配置——后续要恢复用 `unignore`。

## 私有 registry 凭据

依赖托管在私有源时，用顶层 `registries` 声明访问方式，再在 `updates` 里引用。

**凭据不写明文**：存成加密的 **Dependabot secret**（仓库或组织级），在配置里用 <code v-pre>${{secrets.NAME}}</code> 引用。secret 命名不能含空格、会被转大写、不能以 `GITHUB_` 开头、不能以数字开头。

```yaml
version: 2
registries:
  npm-github:
    type: npm-registry
    url: https://npm.pkg.github.com
    token: ${{secrets.NPM_GITHUB_TOKEN}}
  docker-hub:
    type: docker-registry
    url: registry.hub.docker.com
    username: octocat
    password: ${{secrets.DOCKERHUB_PASSWORD}}

updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    registries:
      - npm-github # 只用指定源
  - package-ecosystem: "docker"
    directory: "/"
    schedule:
      interval: "weekly"
    registries: "*" # 用上面定义的所有源
```

支持的 `type` 覆盖各大生态：`npm-registry`、`docker-registry`、`maven-repository`、`nuget-feed`、`python-index`、`rubygems-server`、`cargo-registry`、`composer-repository`、`terraform-registry`、`goproxy-server`、`git`、`hex-organization` / `hex-repository`、`pub-repository`、`helm-registry` 等。多数需要 `type` + `url`，认证按类型用 `username`/`password` 或 `token`；可选 `replaces-base`、（npm 的）`scope` 等。
