---
layout: doc
outline: [2, 3]
---

# 指南 - 配置

> 基于 Changesets（@changesets/cli）· 核于 2026-07

## 速查

- **配置文件**：`.changeset/config.json`，由 `changeset init` 生成
- **`access`**：`"restricted"`（默认）/ `"public"`；**发公开 npm 包必须改成 `"public"`**，否则 publish 失败
- **`baseBranch`**：检测「改了哪些包」的比较基线，默认 `"master"`，主干叫 `main` 的**务必改成 `"main"`**
- **`changelog`**：`false` 关闭 / 内置 `"@changesets/cli/changelog"`（默认）/ `"@changesets/changelog-git"` / `["@changesets/changelog-github", { "repo": "org/repo" }]`
- **`updateInternalDependencies`**：内部依赖被升级时，依赖方最低补几级——`"patch"`（默认）/ `"minor"`
- **`fixed`**：`[["a","b"]]` 一组包**永远齐步升级、齐步发布**（哪怕只有一个改了）
- **`linked`**：`[["a","b"]]` 一组包**共享版本号，但只发实际改动的那些**（与 fixed 的核心区别）
- **`ignore`**：`["pkg-x"]` 临时**不发布**这些包（monorepo 专用），常用于 in-progress 的包
- **`privatePackages`**：`{ "version": true, "tag": false }`（默认）——控制私有包是否升版本 / 打 tag
- **`commit`**：`false`（默认）/ `true`——是否让 `add` 与 `version` 自动 git commit
- **`bumpVersionsWithWorkspaceProtocolOnly`**：`true` 时只更新 `workspace:` 协议的内部依赖范围
- **`fixed` / `linked` / `ignore` 支持 glob**（picomatch），可写 `["pkg-*"]`

## 完整默认配置

`changeset init` 生成的 `config.json`（附各字段默认值）：

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

## 逐字段详解

### access

包发布可见性，**最容易踩的一项**。

- `"restricted"`（默认）：按私有包处理。发布无 scope 的公开包尚可，但发 scoped 公开包（`@org/pkg`）会失败。
- `"public"`：公开发布。**开源 monorepo 几乎都要设成这个。**

各包 `package.json` 里的 `publishConfig.access` 优先级高于此处的全局设置，可对单个包覆盖。

### baseBranch

「哪些包发生了改动」是通过和某个分支比 diff 得出的，`baseBranch` 就是那个基线。默认值是历史遗留的 `"master"`——**如果你的主干叫 `main`（现在的默认），一定要改成 `"main"`**，否则 `changeset status` / `add` 的变更检测会错乱。

### changelog

控制 changelog 生成方式，取值有三种形态：

```json
// 1. 关闭 changelog 生成
{ "changelog": false }

// 2. 指定一个模块（默认就是内置的简单格式）
{ "changelog": "@changesets/cli/changelog" }

// 3. [模块, 传给它的选项] 元组 —— GitHub 富格式最常用
{ "changelog": ["@changesets/changelog-github", { "repo": "myorg/myrepo" }] }
```

官方提供两个现成的 changelog 生成器：

| 包 | 效果 |
| --- | --- |
| `@changesets/changelog-git` | 在条目后附上 commit 短 hash |
| `@changesets/changelog-github` | 生成带 **PR 链接、commit 链接、作者 @提及** 的富 changelog，需传 `repo` 并在 CI 提供 `GITHUB_TOKEN` |

`@changesets/changelog-github` 是开源库最常见的选择。它需要单独安装，且运行时要能读到 `GITHUB_TOKEN`（本地跑需 `export GITHUB_TOKEN=...`，CI 里 action 会自动注入）：

```bash
pnpm add -Dw @changesets/changelog-github
```

要完全自定义格式，可指向本地文件，导出 `getReleaseLine`（每条改动的行）和 `getDependencyReleaseLine`（因依赖升级产生的行）两个异步函数：

```js
// .changeset/my-changelog.cjs
module.exports = {
  async getReleaseLine(changeset, type) {
    /* 返回该条 changelog 文本 */
  },
  async getDependencyReleaseLine(changesets, dependenciesUpdated) {
    /* 返回「因依赖更新」这一行文本 */
  },
};
```

### updateInternalDependencies

当被依赖的内部包升级时，依赖方**至少**要补几级 bump（并同步更新依赖范围）。默认 `"patch"`——B 升级，依赖 B 的 A 至少补一个 patch。设为 `"minor"` 则至少补 minor。这只是「地板」，如果 A 自己还有更高级别的 changeset，以更高者为准。

### fixed vs linked（重点辨析）

两者都用 `[["包A", "包B"]]` 的「数组的数组」写法（一个仓库可有多组），也都支持 picomatch glob（如 `[["@myorg/*"]]`），但**语义截然不同**：

| | `fixed` | `linked` |
| --- | --- | --- |
| 版本号 | 组内**始终一致** | 组内**始终一致** |
| 是否齐发 | **是**——只要组内有一个改了，**全组一起升、一起发** | **否**——只有**实际有 changeset 的包**才升、才发 |
| 典型场景 | 强绑定、必须同版本同节奏发布的套件 | 希望版本号看起来同步、但不想每次都全量发布 |

```json
{
  "fixed": [["@myorg/pkg-a", "@myorg/pkg-b"]],
  "linked": [["@myorg/tool-*"]]
}
```

举例：`fixed` 组三个包都在 `1.0.0`，一个 changeset 只给 `pkg-a` 标了 minor——结果 `pkg-a` 和 `pkg-b` **都**升到 `1.1.0`（取全组最高 bump，齐发）。换成 `linked`，则只有 `pkg-a` 升到 `1.1.0` 并发布，`pkg-b` 不动——但**下次 `pkg-b` 自己有改动时，它会从「全组当前最高版本」起跳**，从而保持版本号看齐。详细行为见 [Monorepo 页](./monorepo.md#fixed-与-linked-实战)。

### ignore

一个「临时**不发布**」名单（monorepo 专用）。放进 `ignore` 的包，即便有 changeset 也不会被 `version` / `publish` 处理——常用于「还没准备好发布、但已在仓库里开发」的包。

```json
{ "ignore": ["@myorg/experimental"] }
```

注意它和依赖联动的关系：如果一个要发布的包依赖了被 ignore 的包，Changesets **不会**强制你把依赖方也 ignore 掉（详见 [Monorepo 页](./monorepo.md)）。

### privatePackages

控制 `private: true` 的包如何处理，默认 `{ "version": true, "tag": false }`：只更新它们的版本号和 changelog，但不打 git tag、也（因为 private）不发 npm。给应用 / 非 npm 包做版本时会调它，见 [Monorepo 页](./monorepo.md#给应用与非-npm-包做版本)。

### commit

是否让 `changeset add` 和 `changeset version` 自动 `git commit`。默认 `false`（自己控制提交时机，更适合走 PR review）。设 `true` 或指向一个自定义提交信息模块即可开启。

### bumpVersionsWithWorkspaceProtocolOnly

设为 `true` 时，Changesets **只**更新以 `workspace:` 协议声明的内部依赖范围，不碰用固定版本号写死的那些。用 pnpm / yarn workspace 且内部依赖统一写 `workspace:*` 时开启更干净。

### changedFilePatterns

哪些文件的改动才算「这个包变了」，默认 `["**"]`（任何文件）。可收窄到只关心源码，例如 `["src/**"]`，避免改个 README 就被判定为「包已改动、缺 changeset」。

### format / snapshot

- `format`：`"auto"`（默认）自动选用 prettier 之类的格式化器格式化生成的文件，可设 `false` 关闭。
- `snapshot`：控制 snapshot 发布的版本号形态，支持 `useCalculatedVersion` 和 `prereleaseTemplate` 两个子项，详见 [预发布与 CI 页](./prerelease-ci.md#snapshot-临时快照发布)。

## $schema：编辑器补全

配置首行的 `$schema` 让编辑器对 `config.json` 做校验与自动补全，`init` 默认会带上，建议保留。
