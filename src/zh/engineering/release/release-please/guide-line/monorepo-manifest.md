---
layout: doc
outline: [2, 3]
---

# monorepo 与 manifest 模式

> 基于 release-please · 核于 2026-07

## 速查

- **manifest 模式 = 两个文件**：`release-please-config.json`（配置：包列表、release-type、插件）+ `.release-please-manifest.json`（记录每个包路径当前版本）。
- **为 monorepo 而生**：一个仓库多个可发布产物，manifest 让一份配置集中管理所有包，也完全适用于单包仓库。
- **`packages` 是核心**：把「相对仓库根的路径」映射到该包的配置；每个包可覆盖 `release-type`、`package-name`、`changelog-path`、`release-as` 等。
- **默认组合 PR**：默认所有有变更的包**共用一个 Release PR**（一次合并全发）；`separate-pull-requests: true` 改为**每包一个独立 PR**。
- **多语言混排**：同一仓库里 `path/js-pkg` 用 `node`、`path/rust-crate` 用 `rust`、`path/py-pkg` 用 `python`，各包独立推断版本。
- **tag 格式**：monorepo 默认带组件前缀 `<component>-v1.2.3`；`include-component-in-tag: false` 可回到 `v1.2.3`。
- **根包用 `"."`**：路径 `"."` 代表仓库根，可让「根库」与子包一起发布。
- **manifest 文件是版本真相源**：形如 <code v-pre>{ "packages/a": "1.1.0", "packages/b": "0.3.2" }</code>，release-please 据此定位「上次发布版本」并计算下一个。
- **workspace 插件**：`node-workspace`（联动 npm 内部依赖版本）、`cargo-workspace`（Rust）、`maven-workspace`（Java）、`linked-versions`（多包版本同步）、`sentence-case`。
- **bootstrap**：`release-please bootstrap` 或手动创建两文件（config 写包列表、manifest 写各包起始版本）即可初始化。
- **`exclude-paths`**：把某子目录从某包的变更判定中排除，避免误算。

## 一、为什么需要 manifest 模式

早期 release-please 面向单包仓库：一个版本号、一个 CHANGELOG、tag 形如 `v1.2.3`。但 monorepo 里有多个独立发布的产物，各有各的版本节奏。**manifest 模式**就是为此设计的——用两个源码受控的文件集中管理所有包：

- **`release-please-config.json`**：**配置**。声明有哪些包、每个包用什么 release type、启用哪些插件、是否分开出 PR 等。
- **`.release-please-manifest.json`**：**状态**。记录每个包**当前已发布的版本号**，是版本推断的「上次发布」基准。release-please 每次发布后会写回它。

即便是单包项目，官方也推荐用 manifest 模式（更统一、可扩展）。

## 二、两个文件长什么样

**`release-please-config.json`**（配置）：

```json
{
  "release-type": "node",
  "separate-pull-requests": false,
  "plugins": ["node-workspace"],
  "packages": {
    ".": {
      "release-type": "node",
      "package-name": "root-toolkit"
    },
    "packages/core": {
      "release-type": "node"
    },
    "packages/cli": {
      "release-type": "node",
      "changelog-path": "CHANGELOG.md"
    },
    "crates/engine": {
      "release-type": "rust"
    },
    "services/api": {
      "release-type": "python",
      "package-name": "acme-api",
      "exclude-paths": ["services/api/testdata"]
    }
  }
}
```

**`.release-please-manifest.json`**（状态，记录各包当前版本）：

```json
{
  ".": "2.4.1",
  "packages/core": "1.8.0",
  "packages/cli": "0.9.3",
  "crates/engine": "0.2.0",
  "services/api": "3.1.2"
}
```

- 顶层 `release-type` 是所有包的默认值，`packages` 里每个路径可覆盖它。
- `package-name` 对没有源码可查名字的类型（如 python）是必需的。
- `"."` 代表仓库根，让根库能与子包一起发布。

## 三、组合 PR vs 每包独立 PR

这是 monorepo 配置里最关键的一个取舍：

- **组合 PR（默认，`separate-pull-requests: false`）**：所有有可发布变更的包**共用一个 Release PR**。合并一次，多个包同时发布（各自打各自的 tag / Release）。适合包之间发布节奏一致、想「一把梭」的团队。
- **每包独立 PR（`separate-pull-requests: true`）**：**每个包一个独立 Release PR**，可以只合 `packages/core` 的 PR 而暂不发 `packages/cli`。适合各包版本节奏差异大、需要独立控制发布时机的场景。

组合 PR 模式下，可用 `group-pull-request-title-pattern` 自定义这个合并 PR 的标题（如 `chore: release ${branch}`）。

## 四、tag 与 component 前缀

monorepo 里多个包共存，tag 必须区分是哪个包发的：

- **默认带前缀**：tag 形如 `<component>-v1.2.3`（如 `core-v1.8.0`、`cli-v0.9.3`），GitHub Release 名同理。component 名默认取包名/路径。
- **去掉前缀**：`include-component-in-tag: false` 让 tag 回到 `v1.2.3` 形式——通常只在单包（或仓库根为唯一发布物）时才这么设，多包时去掉前缀会撞车。

若你从单包迁移到 manifest 多包，注意 tag 命名规则的变化，历史 tag 与新规则可能不一致，需要用 `bootstrap-sha` / manifest 里的起始版本对齐。

## 五、workspace 插件：联动内部依赖

monorepo 里包之间常互相依赖。当 `packages/core` 升版本，依赖它的 `packages/cli` 的 `package.json` 里对 core 的版本约束也该跟着更新——这就是 workspace 插件做的事：

- **`node-workspace`**：npm/pnpm/yarn workspace。自动把内部包之间的依赖版本更新一致，并可选把「被依赖包的变更」传导为「依赖方也需要发版」。支持 `updatePeerDependencies` 等选项。
- **`cargo-workspace`**：Rust/Cargo workspace，联动 crate 版本与 `Cargo.lock`。
- **`maven-workspace`**：Java/Maven 多模块。
- **`linked-versions`**：把指定的一组包**版本号绑定同步**——任一包发版，组内其它包一起抬到同一版本（类似 lerna 的 fixed 模式）。
- **`sentence-case`**：把 changelog 里提交信息首字母大写，纯文案层面的美化。

插件在 `plugins` 数组里声明，可以是字符串或带参对象：

```json
{
  "plugins": [
    { "type": "node-workspace", "updatePeerDependencies": true },
    "sentence-case"
  ]
}
```

## 六、初始化（bootstrap）

两种方式让一个仓库进入 manifest 模式：

- **CLI 一键**：`release-please bootstrap --token=$GH_TOKEN --repo-url=owner/repo --release-type=node`。它会生成 `release-please-config.json` 与 `.release-please-manifest.json` 并开一个初始化 PR。
- **手动**：自己创建这两个文件——config 里写好 `packages` 列表，manifest 里为每个包填**当前已发布的版本**（新项目可填 `0.0.0` 或用 `--initial-version` 指定）。若历史提交很多、不想让首个 changelog 塞满全部历史，可设 `bootstrap-sha` 把起点限定到某个 commit。

接入 CI 时，把 Action 的 `config-file` 与 `manifest-file` 指向这两个文件即可（默认名就是上面两个，通常无需显式配置）。下一页 [CI 接入与选型](./ci-selection) 讲如何在 GitHub Actions 里跑起来并接续发布步骤。
