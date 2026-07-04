---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Dependabot（GitHub 原生）· 核于 2026-07

## 速查

- **归属**：GitHub 内置功能，不是你去安装的 CLI；更新引擎开源在 `github/dependabot-core`
- **配置文件**：`.github/dependabot.yml`（默认分支根目录下的 `.github/` 里）
- **三块能力**：**alerts**（告警 / 只读检测）、**security updates**（漏洞修复 PR）、**version updates**（常规升级 PR）
- **两条主线**：**安全线**（alerts → security updates，由 GHSA 驱动）＋ **更新线**（version updates，由你配的节奏驱动）
- **安全线近零配置**：alerts + security updates 是仓库 **Settings → 安全（Code security）** 里的开关，无需写 yml
- **更新线必须写 yml**：没有 `dependabot.yml` 就没有 version updates
- **顶层必填**：`version: 2` + `updates:` 数组，每个条目对应一个 `package-ecosystem`
- **最小条目三要素**：`package-ecosystem` + `directory` + `schedule.interval`
- **默认 PR 上限**：`open-pull-requests-limit` 默认 **5**（version updates）；security updates 另有内部上限 **10**
- **合并**：在 PR 上评论 `@dependabot merge` / `@dependabot squash and merge`，CI 通过后自动并
- **签名提交**：Dependabot 默认对它开出的提交进行签名
- **会自动暂停**：长期没人搭理它的 PR，Dependabot 会暂停该仓库的更新

## Dependabot 是什么

Dependabot 不是一个你 `npm install` 进项目的库，而是 **GitHub 平台内置的托管服务**。它跑在 GitHub 侧：读取你仓库里的依赖清单（`package.json`、`Gemfile`、`go.mod`、workflow 里的 `uses:` 等）与锁文件，判断有没有更新或漏洞，然后**替你开 Pull Request**。

「GitHub 原生」意味着三点：

1. **零接入成本**——不用注册第三方 App、不用起服务器，配置文件进仓库即生效；安全告警甚至连配置文件都不用。
2. **与 GitHub 一体**——alerts 直接进 Security 面板，PR 走标准 review / 必需检查 / 合并流程，元数据能被 GitHub Actions 消费。
3. **只服务 GitHub**——不支持 GitLab / Bitbucket 等其它平台，那是 Renovate 的地盘（见[与 Renovate 取舍](./guide-line/vs-renovate)）。

引擎本身（`github/dependabot-core`）是开源的，但托管运行环境是 GitHub 的闭源服务。

## 三块能力，别混为一谈

初学者最容易把「告警」「安全更新」「版本更新」搅在一起。它们各司其职：

| 能力 | 干什么 | 会改代码吗 | 触发源 | 需要 yml 吗 |
| --- | --- | --- | --- | --- |
| **alerts** | 发现引入了已知漏洞的依赖并报警 | 否（只读） | GHSA 新公告 / 依赖图变化 | 否 |
| **security updates** | 针对告警开 PR，做最小必要升级 | 是（开 PR） | 有 alert 且存在补丁版本 | 否（可选微调） |
| **version updates** | 与漏洞无关，把依赖升到新版 | 是（开 PR） | 你配置的 `schedule` | **是** |

关键关系：

- **alerts 是「发现问题」**，security updates 是「修复问题」——两者都属于**安全线**，其前提是仓库开了 **依赖图（dependency graph）**。
- **version updates 是「保持不落后」**，属于**更新线**，跟漏洞没关系，完全由 `dependabot.yml` 的 `schedule` 决定节奏。

## 安全能力：近零配置

安全线不需要 `dependabot.yml`。在仓库 **Settings → 安全（Code security / Advanced Security）** 里打开开关即可：

- 打开 **Dependency graph**（依赖图）——是一切的基础。
- 打开 **Dependabot alerts**——开始报漏洞。
- 打开 **Dependabot security updates**——让它针对告警自动开修复 PR。

security updates 的前提是 **依赖图 + alerts 都已启用**，且有漏洞的依赖出现在 manifest 或锁文件里（纯传递依赖若无法通过父依赖升级，可能修不了）。

## 版本更新：从一份最小 dependabot.yml 开始

想要 version updates，就得写配置文件。最小可用示例：

```yaml
# .github/dependabot.yml
version: 2
updates:
  # 维护 npm 依赖（package.json / lockfile 在仓库根目录）
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"

  # 顺手维护 workflow 里引用的 Actions 版本
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```

提交到默认分支后，Dependabot 会立刻跑一次，之后按 `schedule` 定期跑。上面第二条尤其推荐——它能自动升级 workflow 里 `uses:` 引用的 Action 版本，配合「锁 SHA」的安全实践一起用效果最好。

完整配置项见[配置详解](./guide-line/config)。

## Dependabot 的 PR 长什么样

每个 version / security update PR 都会带上：变更的版本区间、**changelog / release notes 摘要**、以及（部分生态）基于社区数据的**兼容性评分**，方便你决定要不要合。

处理方式：

- 直接在 GitHub 上 review、跑 CI，然后手动合，或评论 `@dependabot merge` 让它在 CI 通过后自动合。
- Dependabot 默认会**自动 rebase** 以解决冲突；但一个 PR 超过 **30 天**没合并，它会停止 rebase。
- 更多命令（`recreate` / `close` / `ignore …`）见[命令表](./guide-line/security-groups#dependabot-评论命令)。

## 常见误区

- **「开了 alerts 就会自动修」**——不会。alerts 只报警，还要单独开 **security updates** 才会开修复 PR。
- **「写了 dependabot.yml 才有安全告警」**——不对。安全线（alerts / security updates）不依赖 yml，yml 只管 version updates（可选地微调安全更新）。
- **「version updates 会自动合并」**——不会。默认只开 PR，automerge 需要额外配 GitHub 自动合并 + Actions workflow（见[对比页](./guide-line/vs-renovate#automerge-dependabot-要额外搭两件套)）。
- **「把 interval 设 daily 更安全」**——version updates 与漏洞无关，`daily` 只会刷屏；真正的漏洞修复走 security updates，其实时性由 alert 驱动，不看这个节奏。
