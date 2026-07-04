---
layout: doc
outline: [2, 3]
---

# CI 接入与选型：release-please-action 及横向对比

> 基于 release-please · 核于 2026-07

## 速查

- **官方接入 = release-please-action**：`googleapis/release-please-action@v4`，在 push 到主干时运行，负责建/刷新 Release PR 与合并后发布。
- **权限三件套**：`contents: write`（tag/Release/写文件）、`pull-requests: write`（Release PR）、需要标签时加 `issues: write`。
- **关键输出 `release_created`**：布尔值，标识「本次是否真的发布了」；用它 `if:` 门控后续 `npm publish` 等步骤。
- **`releases_created`**：任一包发布了就为 true（monorepo 用它判断整体是否有发布）。
- **发布后接续发包**：把 setup-node / `npm ci` / `npm publish` 步骤全部加 <code v-pre>if: ${{ steps.release.outputs.release_created }}</code>，仅在发布时执行。
- **常用输出**：`tag_name`、`version`/`major`/`minor`/`patch`、`sha`、`body`（changelog 正文）、`paths_released`（发布的包路径 JSON 数组）、`prs`。
- **默认 `GITHUB_TOKEN` 不触发下游工作流**：要让 tag/Release 事件触发别的工作流、或 Release PR 上跑 CI，需换 PAT 或 GitHub App token。
- **GitHub-native**：只支持 GitHub，与 PR/Release/Label 深度绑定，**不支持 GitLab/Bitbucket**——跨平台需求应选别的工具。
- **vs semantic-release**：后者**无 PR 闸门**、在 CI 上直接发版；release-please 用 Release PR 把发布时机交回人手。
- **vs Changesets**：Changesets 靠贡献者**手写 changeset 文件**声明变更意图；release-please 从 **commit** 推断，无需额外文件。
- **选型一句话**：**要 GitHub 上「可审阅的发布闸门 + 多语言 + 从 commit 推断」→ release-please**；要「合并即自动发」→ semantic-release；要「贡献者显式声明 + JS monorepo」→ Changesets。

## 一、release-please-action 的标准工作流

官方推荐通过 Action 接入。最小工作流在 [入门](../getting-started) 已给出，这里补充**发布后接续发包**的完整形态——通过 `id` 拿到步骤输出，再用它门控后续步骤：

```yaml
# .github/workflows/release-please.yml
on:
  push:
    branches:
      - main

permissions:
  contents: write
  pull-requests: write

name: release-please

jobs:
  release-please:
    runs-on: ubuntu-latest
    steps:
      - uses: googleapis/release-please-action@v4
        id: release
        with:
          release-type: node

      # 以下步骤仅在「本次确实发布了」时执行
      - uses: actions/checkout@v4
        if: ${{ steps.release.outputs.release_created }}
      - uses: actions/setup-node@v4
        if: ${{ steps.release.outputs.release_created }}
        with:
          node-version: 20
          registry-url: "https://registry.npmjs.org"
      - run: npm ci
        if: ${{ steps.release.outputs.release_created }}
      - run: npm publish
        if: ${{ steps.release.outputs.release_created }}
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

运行逻辑：这个工作流**每次 push 到 `main` 都会跑**，但绝大多数时候它只是「刷新 Release PR」或「什么都不做」，`release_created` 为 false，后续发包步骤被跳过。只有当**合并了 Release PR** 的那次 push，release-please 打完 tag/Release 后把 `release_created` 置为 true，`npm publish` 才真正执行。

## 二、关键 outputs 与门控模式

release-please-action 的输出是把「发布」与「发布后动作」串起来的关键：

| 输出 | 含义 |
| --- | --- |
| `release_created` | 根组件是否创建了 Release（布尔） |
| `releases_created` | 是否有**任一**包创建了 Release（monorepo 用） |
| `tag_name` | 本次发布的 tag（如 `v1.4.0`） |
| `version` / `major` / `minor` / `patch` | 版本号及其拆分 |
| `sha` | 打 tag 的提交 SHA |
| `body` | 从 CHANGELOG 提取的本版本 release notes |
| `paths_released` | 已发布包路径的 JSON 数组（monorepo） |
| `prs` / `pr` | 创建/更新的 Release PR 对象（JSON） |
| `prs_created` | 是否创建/更新了 PR |

**门控范式**：所有「发布后才该做的事」（发 npm、传 artifact、通知、部署）都加 <code v-pre>if: ${{ steps.release.outputs.release_created }}</code>（monorepo 用 <code v-pre>${{ steps.release.outputs.releases_created }}</code>）。上传产物到 Release 可用 `tag_name`，如 <code v-pre>gh release upload ${{ steps.release.outputs.tag_name }} ./dist/app.zip</code>。

## 三、GITHUB_TOKEN 的坑

这是接入时最容易踩的坑，务必理解：

- **现象**：用默认 `GITHUB_TOKEN` 创建的 Release PR、tag、Release **不会触发其它工作流**——这是 GitHub 为防止工作流无限互相触发而设的机制。
- **后果**：① Release PR 上不会跑你配置的 CI 检查（PR 看起来没有状态检查）；② 你若有「监听 tag / Release 事件」的独立发布工作流，它不会被 release-please 创建的 tag 触发。
- **解法**：改用 **Personal Access Token（PAT）** 或 **GitHub App token**，通过 `token` 输入传入。这样它创建的事件能正常触发下游工作流。
- **注意**：本文第一节的「同一 job 内用 `release_created` 接续 `npm publish`」**不受此限制**——因为那是同一次运行内的步骤门控，不依赖事件再触发。只有「跨工作流触发」才需要 PAT/App token。

## 四、GitHub-native 的含义与代价

release-please 与 GitHub 深度绑定：它用 GitHub 的 **PR** 承载 Release PR、用 **Label** 追踪发布状态（`autorelease: *`）、用 **Releases** API 建 Release、官方分发形态是 **GitHub Action**。这带来极佳的 GitHub 体验，但也意味着：

- **只服务 GitHub 仓库**。GitLab、Bitbucket、Gitea 等平台无法使用——这类需求应转向 semantic-release（多平台）或平台自带方案。
- 强依赖 GitHub 的 PR/Label 语义，迁移出 GitHub 成本高。

如果团队铁定在 GitHub 上，这个「绑定」是优点而非缺点。

## 五、与 semantic-release / Changesets 对比

三者都做「版本发布自动化」，但发布触发模型与生态定位截然不同：

| 维度 | release-please | semantic-release | Changesets |
| --- | --- | --- | --- |
| 版本来源 | Conventional Commits（从 commit 推断） | Conventional Commits（从 commit 推断） | **贡献者手写 changeset 文件**声明 bump 类型 |
| 发布触发 | **合并 Release PR**（人工闸门） | **CI 上直接自动发版**（无 PR 闸门） | 合并「Version Packages」PR |
| 是否有 PR 预览 | 有（Release PR 长期可见可审） | 无（默认合并即在 CI 发） | 有（Version Packages PR） |
| 平台 | **仅 GitHub** | 多平台（GitHub/GitLab 等） | 主要 GitHub（有 Action），核心是 CLI |
| 多语言 | **20+ 语言**（node/python/go/rust/java…） | 以 JS/npm 为主，靠插件扩展 | **JS/TS 生态**为主 |
| monorepo | manifest 模式，组合/独立 PR | 需额外方案（如 multi-semantic-release） | **monorepo 一等公民**，按包出 changeset |
| 出品方 | Google（googleapis） | 社区（semantic-release org） | 社区（changesets，Atlassian 起源） |

**选型建议**：

- **release-please**：你在 GitHub 上，想要「自动算版本 + 一道可审阅的发布闸门」，且可能涉及多语言 / monorepo。适合希望「发布时机由人决定、其余全自动」的团队。
- **semantic-release**：追求「合并到主干即自动发版」的极致 CI 自动化，不需要人工闸门；或需要 GitLab 等非 GitHub 平台、丰富插件生态。
- **Changesets**：JS/TS monorepo，希望**贡献者在 PR 里显式声明**「这个改动影响哪些包、升什么版本」（尤其开源库多人协作时，changeset 文件也是变更意图的书面记录）。

三者没有绝对优劣，核心区别在**「版本意图从哪来」（commit 推断 vs 手写声明）**和**「发布是否要人点头」（PR 闸门 vs 自动发）**。想深入配置项与排错，见 [参考](../reference)。
