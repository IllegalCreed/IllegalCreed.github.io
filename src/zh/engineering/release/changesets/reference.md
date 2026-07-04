---
layout: doc
outline: [2, 3]
---

# 参考

> 命令 / 配置 / 常见坑速查 + 官方链接 · 核于 2026-07（`@changesets/cli` 2.31.0 / `changesets/action` v1.9.0）

## 命令速查

| 命令 | 作用 |
| --- | --- |
| `changeset init` | 初始化 `.changeset/`（生成 `config.json` + `README.md`） |
| `changeset` / `changeset add` | 交互式新建 changeset 文件 |
| `changeset version` | 消费全部 changeset：升版本 + 联动内部依赖 + 写 CHANGELOG + 删 changeset |
| `changeset publish` | 只发布「本地版本 > npm 版本」的包（幂等）+ 打 `pkg@version` git tag |
| `changeset status` | 汇报待发布内容；有改动却无 changeset 时**退出码 1** |
| `changeset tag` | 按当前 `package.json` 版本补打 git tag（不发布） |
| `changeset pre enter <tag>` | 进入预发布模式（生成 `pre.json`） |
| `changeset pre exit` | 退出预发布模式 |

### 常用参数

```bash
# add
changeset add --empty                 # 空 changeset（不发任何包，CI 卡点放行）
changeset add --open                  # 在外部编辑器打开新建的 changeset
changeset add -m "变更说明"            # 直接从命令行给 changelog 说明

# version
changeset version                     # 正常消费
changeset version --snapshot [tag]    # 生成 0.0.0[-tag]-<时间戳> 快照版本
changeset version --ignore <pkg>      # 本次跳过某包

# publish
changeset publish --tag <dist-tag>    # 发到指定 dist-tag（预发布 / snapshot），不占 latest
changeset publish --otp=<code>        # npm 开了 2FA 时传一次性密码
changeset publish --no-git-tag        # 不打 git tag（snapshot 常用）

# status
changeset status --since=origin/main  # 相对某分支 / tag 的新增改动
changeset status --verbose            # 显示每个包将升到的新版本 + 链接
changeset status --output=status.json # 结果写成 JSON
```

::: tip 别忘了推 tag
`changeset publish` 会打 git tag 但**不会 push**，随后需 `git push --follow-tags`。
:::

## config.json 速查

```json
{
  "$schema": "https://unpkg.com/@changesets/config@latest/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "restricted",
  "baseBranch": "master",
  "updateInternalDependencies": "patch",
  "ignore": [],
  "bumpVersionsWithWorkspaceProtocolOnly": false,
  "changedFilePatterns": ["**"],
  "format": "auto",
  "privatePackages": { "version": true, "tag": false }
}
```

| 字段 | 默认 | 说明 |
| --- | --- | --- |
| `access` | `"restricted"` | 发公开包**必须**改 `"public"` |
| `baseBranch` | `"master"` | 变更检测基线；主干叫 `main` 要改成 `"main"` |
| `changelog` | `"@changesets/cli/changelog"` | `false` 关闭 / 模块路径 / `[模块, 选项]` 元组 |
| `commit` | `false` | 是否让 `add` / `version` 自动 commit |
| `fixed` | `[]` | 齐步升级 + 齐步发布的包组（`[["a","b"]]`，支持 glob） |
| `linked` | `[]` | 共享版本号、按需发布的包组（支持 glob） |
| `updateInternalDependencies` | `"patch"` | 内部依赖联动补 bump 的地板级（`"patch"` / `"minor"`） |
| `ignore` | `[]` | 临时不发布的包（monorepo 专用） |
| `bumpVersionsWithWorkspaceProtocolOnly` | `false` | `true` 时只更新 `workspace:` 内部依赖范围 |
| `changedFilePatterns` | `["**"]` | 哪些文件改动算「包变了」 |
| `format` | `"auto"` | 生成文件的格式化，`false` 关闭 |
| `privatePackages` | `{ "version": true, "tag": false }` | 私有包是否升版本 / 打 tag |
| `snapshot` | — | `{ useCalculatedVersion, prereleaseTemplate }` 微调快照版本号 |

### changelog 三种写法

```json
{ "changelog": false }                                              // 关闭
{ "changelog": "@changesets/changelog-git" }                        // 附 commit hash
{ "changelog": ["@changesets/changelog-github", { "repo": "org/repo" }] }  // PR/作者链接
```

### fixed vs linked 一句话

- **`fixed`**：组内一个改了，**全组齐升齐发**（取最高 bump）。
- **`linked`**：**只发实际改动的**，但版本号从「全组当前最高」起跳，保持看齐。

## 常见坑速查

| 坑 | 症状 / 说明 | 解法 |
| --- | --- | --- |
| `access` 未设 public | scoped 公开包 publish 失败 | `config.json` 设 `"access": "public"` |
| `baseBranch` 仍是 master | 主干是 `main` 时变更检测错乱 | 改成 `"baseBranch": "main"` |
| 忘写 changeset | 改动发出去了却没升版本 / 没进 changelog | CI 里 `changeset status --since=...` 卡点 |
| 无需发版的 PR 被卡 | 文档 / CI 类改动没 changeset 过不了检查 | `changeset --empty` 补空 changeset |
| tag 没推上去 | `publish` 打了 tag 但远端看不到 | `git push --follow-tags` |
| snapshot 占了 latest | `publish` 未加 `--tag`，用户装到快照版 | 快照发布**务必**带 `--tag <dist-tag>` |
| snapshot 改动合回主干 | 主干版本被 `0.0.0-...` 污染 | 在专用分支跑，不合回 main |
| 在默认分支进 pre 模式 | `pre exit` 前阻塞所有正常发布 | 预发布只在非默认分支做 |
| `changelog-github` 无 token | 本地跑 `version` 生成 changelog 失败 | 本地 `export GITHUB_TOKEN=...`，CI 由 action 注入 |
| 误把 `version` 当发布 | `version` 只改文件、没发 npm | 之后还要 `publish` |
| changeset/action 用错 tag | 抄到未发布的 `@v2`（仅 `-next` 预发布） | 用稳定的 **`changesets/action@v1`** |

## 关键约定回顾

- **两阶段**：`add`（贴着改动写意图）与 `version` + `publish`（发版时统一消费），中间隔着 review。
- **幂等**：`publish` 只发比 npm 新的包，可安全重跑；`version` 消费后删 changeset，不会重复计。
- **意图即文件**：changeset 是 `.changeset/*.md`，跟 PR 一起评审——这是它区别于 semantic-release 的根。

## 官方链接

- 文档目录（GitHub docs/）：<https://github.com/changesets/changesets/tree/main/docs>
- 快速上手（intro）：<https://github.com/changesets/changesets/blob/main/docs/intro-to-using-changesets.md>
- 配置项（config-file-options）：<https://github.com/changesets/changesets/blob/main/docs/config-file-options.md>
- 命令行选项（command-line-options）：<https://github.com/changesets/changesets/blob/main/docs/command-line-options.md>
- 预发布（prereleases）：<https://github.com/changesets/changesets/blob/main/docs/prereleases.md>
- 快照发布（snapshot-releases）：<https://github.com/changesets/changesets/blob/main/docs/snapshot-releases.md>
- CI 自动化（automating-changesets）：<https://github.com/changesets/changesets/blob/main/docs/automating-changesets.md>
- GitHub Action：<https://github.com/changesets/action>
- `@changesets/cli`（npm）：<https://www.npmjs.com/package/@changesets/cli>
