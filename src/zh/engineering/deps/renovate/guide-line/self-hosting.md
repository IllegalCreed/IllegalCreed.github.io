---
layout: doc
outline: [2, 3]
---

# 自托管

> 基于 Renovate · 核于 2026-07

## 速查

- **自托管 = 你负责**：提供运行环境、下发全局配置、定时触发、升级 Renovate 本身
- **四种发行物**：npm CLI（`npx renovate`）、Docker（`renovatebot/renovate`）、GitHub Action、GitLab Renovate Runner
- **Docker `-full` 标签**：预装大多数包管理器（体积达数 GB）；默认镜像运行时按需装工具
- **认证**：建专用机器人账号 + PAT → **`RENOVATE_TOKEN`**；提交身份用 **`gitAuthor`**
- **拉 changelog**：非 GitHub 平台也建议给 **`RENOVATE_GITHUB_COM_TOKEN`**（只读 github.com）
- **全局配置来源**：`config.js` / `RENOVATE_CONFIG_FILE` / `RENOVATE_` 前缀环境变量 / CLI 参数 / `RENOVATE_CONFIG`（JSON 串）
- **批量接入**：`autodiscover: true` 跑遍所有有权限的仓库；可加 `autodiscoverFilter` 过滤
- **仓库级配置照常**：`renovate.json` 仍分层生效，与全局配置合并
- **触发频率**：建议 **每小时**跑一轮（`schedule` 仍在仓库配置里控制创建窗口）
- **私有源**：`hostRules` 按 `matchHost` 配 token / 账密，供私有 registry 认证
- **CE / EE**：Mend Renovate 社区版 / 企业版是**有状态、响应 webhook**的托管形态，带任务队列
- **调试**：`--dry-run` 演练 + `LOG_LEVEL=debug`；改配置先跑 `renovate-config-validator`

## App vs 自托管：职责边界

先明确自托管意味着什么——所有 Mend 托管 App 替你做的事，都变成你的责任：

| 职责         | Mend 托管 App | 自托管           |
| ------------ | ------------- | ---------------- |
| 运行的基础设施 | Mend          | **你**           |
| 下发全局配置   | Mend 默认     | **你**           |
| 定时触发       | Mend 的 cron  | **你的 cron / CI** |
| 升级 Renovate  | Mend 自动     | **你手动 / 自动化** |
| 凭据           | 授权 App      | **你的 bot 账号 + token** |

只有在私有网络、合规隔离、需要接私有制品库、或想完全掌控版本与调度时，自托管才划算。

## 四种发行物

### npm CLI

任意 Node.js 环境直接跑，最灵活；但**第三方工具链（Ruby / Python / Composer 等）要你自己装**，否则对应生态的 lock 更新会失败。

```bash
# 一次性运行（对一个仓库）
RENOVATE_TOKEN=ghp_xxx npx --yes renovate owner/repo

# 全局安装后跑
npm install -g renovate
renovate owner/repo
```

### Docker

官方镜像 `renovatebot/renovate`（Docker Hub 与 GHCR 都有，支持 `linux/amd64` 与 `linux/arm64`）：

```bash
docker run --rm \
  -e RENOVATE_TOKEN=ghp_xxx \
  -e RENOVATE_GITHUB_COM_TOKEN=ghp_yyy \
  renovatebot/renovate:latest owner/repo
```

- **默认镜像**：运行时按需下载所需包管理器，体积小。
- **`-full` 标签**：预装绝大多数包管理器，**体积达数 GB**，适合离线 / 稳定环境。

### GitHub Action

用官方 [`renovatebot/github-action`](https://github.com/renovatebot/github-action)，配一个定时工作流即可：

```yaml
name: Renovate
on:
  schedule:
    - cron: "0 * * * *" # 每小时
  workflow_dispatch:
jobs:
  renovate:
    runs-on: ubuntu-latest
    steps:
      - uses: renovatebot/github-action@v40
        with:
          token: ${{ secrets.RENOVATE_TOKEN }}
        env:
          RENOVATE_AUTODISCOVER: "true"
```

### GitLab Renovate Runner

GitLab 用官方 [Renovate Runner](https://gitlab.com/renovate-bot/renovate-runner) 项目，在 GitLab CI 里跑定时 pipeline，接入 GitLab.com 或自管实例。

::: tip 还有有状态的 CE / EE
上面四种都是「一次性跑完就退出」的无状态方式。**Mend Renovate 社区版（CE）/ 企业版（EE）** 则是**有状态、以平台 App 身份响应 webhook** 的部署形态，自带优先级任务队列；EE 还支持横向扩展与企业支持。适合大规模自托管。
:::

## 认证与提交身份

```bash
# 平台访问 token（用专用机器人账号的 PAT）
RENOVATE_TOKEN=...
# 提交作者身份（PR 里的 commit 归属）
RENOVATE_GIT_AUTHOR="Renovate Bot <renovate@example.com>"
# 只读 github.com，用于抓取 changelog / release notes（非 GitHub 平台也建议配）
RENOVATE_GITHUB_COM_TOKEN=...
```

- 建议**专门建一个机器人账号**（如 `@renovate-bot`）并用它的 PAT，别用个人 token。
- `gitAuthor` 决定 PR 提交的作者，配合分支保护 / 签名策略。
- `RENOVATE_GITHUB_COM_TOKEN` 让 Renovate 能从 github.com 拉取变更日志与部分运行期工具——即便你的平台是 GitLab / Bitbucket 也建议配上，否则 PR 里常缺 changelog。

## 全局配置来源

自托管的**全局配置**（哪些仓库、并发、私有源等）可来自多处，优先级由高到低大致为 CLI 参数 > 环境变量 > 配置文件：

| 来源                    | 形式                                                    |
| ----------------------- | ------------------------------------------------------- |
| `config.js`             | 默认全局配置文件（JS / TS，可写逻辑）                    |
| `RENOVATE_CONFIG_FILE`  | 指向自定义配置文件路径                                   |
| `RENOVATE_` 前缀环境变量 | 如 `RENOVATE_AUTODISCOVER=true`、`RENOVATE_PLATFORM=gitlab` |
| `RENOVATE_CONFIG`       | 直接塞一段 JSON 字符串                                   |
| CLI 参数                | 如 `renovate --autodiscover`                            |

**仓库级 `renovate.json` 照常生效**，与全局配置合并（仓库配置负责该仓库的分组 / 排期 / 规则，全局配置负责跨仓库的运行策略）。

## 批量接入：autodiscover

不想一个个列仓库，用 `autodiscover` 让 Renovate 跑遍所有有权限的仓库：

```bash
renovate --autodiscover --autodiscover-filter="myorg/*"
```

`autodiscoverFilter` 可用 glob / 正则筛选要纳入的仓库，避免误扫。

## 私有源认证：hostRules

私有 npm registry、私有 Docker registry、私有 Go 模块等，用 `hostRules` 按主机配认证：

```json
{
  "hostRules": [
    { "matchHost": "npm.internal.corp", "token": "npm_xxx" },
    { "matchHost": "registry.internal.corp", "username": "ci", "password": "{{ secrets.REG_PASS }}" }
  ]
}
```

`matchHost` 匹配主机名，`token` 或 `username` + `password` 提供凭据。敏感值建议用自托管的 secrets 机制注入，别硬编码进仓库配置。

## 触发频率与排期

- 自托管需要你自己的 **cron / CI 定时**来触发 Renovate 跑一轮，官方**建议每小时**。（CE / EE 是常驻响应 webhook，无需外部 cron。）
- 注意分工：**外部 cron 决定「Renovate 多久醒一次」**，仓库配置里的 **`schedule` 决定「醒来后允不允许创建 PR」**。两者叠加：cron 每小时醒，但 `schedule` 限定只在凌晨建 PR，则白天醒来也不会提新 PR（但仍会更新已有 PR）。

## 调试

```bash
# 演练：只输出会做什么，不真的建分支 / PR
LOG_LEVEL=debug renovate --dry-run=full owner/repo

# 只校验配置文件语法与合法性
npx --yes --package renovate -- renovate-config-validator --strict
```

`--dry-run` 是排查「为什么某个依赖没被升 / 没提 PR」的首选；`LOG_LEVEL=debug` 会打印每个依赖的提取与决策过程。常见踩坑与选项速查见 [参考](../reference.md)。
