---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Changesets（@changesets/cli）· 核于 2026-07

## 速查

- **定位**：monorepo 版本 + changelog 工具；把「发布意图」落成文件，跟着 PR 一起评审
- **安装 + 初始化**：`pnpm add -Dw @changesets/cli` → `pnpm changeset init`（生成 `.changeset/` 目录 + `config.json` + `README.md`）
- **changeset 文件**：`.changeset/<随机名>.md`，YAML frontmatter 声明「**包名: bump 级别**」，正文是 changelog 条目
- **三步工作流**：`changeset add`（声明意图）→ `changeset version`（消费、升版本、写 changelog、删 changeset）→ `changeset publish`（发 npm）
- **bump 级别**：`major` / `minor` / `patch`，遵循 **semver**；同一包被多个 changeset 命中时取**最高级**
- **add 快捷**：直接 `changeset` 等价 `changeset add`；`--empty` 建空 changeset（不发任何包，给 CI 卡点用）；`-m "..."` 直接给说明
- **version 幂等**：消费全部 changeset → 算新版本 → 联动内部依赖 → 更新各包 CHANGELOG → **删掉已消费的 changeset 文件**
- **publish 幂等**：只发布「本地版本 > npm 上版本」的包，可安全重跑；成功后按 `pkg@version` 打 git tag
- **关键配置**：`.changeset/config.json`；`access`（公开包**必须**设 `"public"`）、`baseBranch`（默认 `"master"`）、`changelog`
- **CI 自动化**：`changesets/action@v1` 自动维护「Version Packages」PR，合并即触发发布
- **当前版本**：`@changesets/cli` **2.31.0** / `changesets/action` **v1.9.0**（2026-07）

## Changesets 解决什么问题

在 monorepo 里手工发版有三个痛点：（1）改了一个底层包，得记得把所有依赖它的包也升个版本；（2）多个 PR 累积后，发版时要回忆每个包该升 `major` 还是 `patch`；（3）CHANGELOG 靠人肉整理，容易漏、容易错。

Changesets 的答案是**把「决策」前移到写代码的当下**：谁改的谁最清楚这次该怎么发版，就让他在 PR 里顺手写一个 changeset 文件。发版时工具把这些文件汇总，机械地算出版本号、补齐依赖联动、生成 changelog——**人只做决策，机器做计算**。

## 安装与初始化

以 pnpm workspace 为例，装在仓库根：

```bash
# 1. 安装（-w 装到 workspace 根）
pnpm add -Dw @changesets/cli

# 2. 初始化
pnpm changeset init
```

`init` 会在仓库根生成 `.changeset/` 目录：

```
.changeset/
├── README.md      # 给协作者看的说明
└── config.json    # 配置文件（见「配置」页）
```

::: tip 不同包管理器的调用方式

```bash
pnpm changeset            # pnpm
yarn changeset            # yarn
npx @changesets/cli       # npm（也可先 npm i -D @changesets/cli 再 npx changeset）
```

下文统一写 `pnpm changeset ...`。

:::

## changeset 文件长什么样

一个 changeset 就是 `.changeset/` 下的一个 Markdown 文件，文件名随机（如 `tricky-lions-cry.md`）。它承载**三条信息**：要发哪些包、各按什么 semver 级别发、以及给用户看的 changelog 说明。

```md
---
"@myorg/core": minor
"@myorg/cli": patch
---

新增 `parse()` 的流式模式；修复 CLI 在 Windows 下的路径解析。
```

- **frontmatter**：每行一个「`"包名": 级别`」，级别是 `major` / `minor` / `patch`
- **正文**：这次变更的 changelog 条目，会被原样搬进对应包的 `CHANGELOG.md`

一个 PR 可以有多个 changeset 文件——比如两处互不相关的改动，各写一个，让它们在 changelog 里分开成条。

::: tip 好的 changelog 说明写什么
官方建议围绕三点：**做了什么**（WHAT）、**为什么**（WHY）、**使用方该如何跟进**（HOW）。一句「fix bug」对下游毫无价值。
:::

## 三步工作流

### 1. `changeset add`：声明变更意图

```bash
pnpm changeset          # 等价于 pnpm changeset add
```

交互式流程：**用方向键 + 空格勾选受影响的包 → 为每个包选 `major`/`minor`/`patch` → 输入 changelog 说明**。完成后在 `.changeset/` 生成一个 `.md` 文件，**把它连同代码一起提交**。

常用参数：

```bash
pnpm changeset --empty                 # 建一个不含任何包的空 changeset（CI 卡点用）
pnpm changeset add -m "修复登录态过期"   # 直接从命令行给说明
pnpm changeset add --open              # 在外部编辑器里打开新建的 changeset
```

### 2. `changeset version`：消费 changeset、升版本

通常由维护者在发版前执行（或交给 CI）：

```bash
pnpm changeset version
```

它会一次性完成：**读取全部 changeset → 为每个包计算新版本号（取命中它的最高 bump）→ 联动升级 monorepo 内部依赖 → 更新各包的 `package.json` 与 `CHANGELOG.md` → 删除已消费的 changeset 文件**。

结果是一堆对 `package.json` / `CHANGELOG.md` 的改动 + `.changeset/*.md` 被删。**先 review 这批 diff，确认版本号和 changelog 无误，再进入下一步。**

### 3. `changeset publish`：发布到 npm

```bash
pnpm changeset publish
```

它对每个包比较「本地 `package.json` 版本」与「npm 上已发布版本」，**只发布本地更新的那些**，然后为发布成功的包打上 `pkg@version` 形式的 git tag。因为「比 npm 新才发」，这条命令**幂等**、可安全重跑。

完整发布脚本通常长这样（`version` 走人工 / CI，`publish` 前先 build）：

```json
// package.json（仓库根）
{
  "scripts": {
    "changeset": "changeset",
    "version-packages": "changeset version",
    "release": "pnpm build && changeset publish"
  }
}
```

## 一张图记住整条链路

```
写代码
  │  改动
  ▼
changeset add ──► .changeset/xxx.md（意图：包 + 级别 + 说明）─┐
  │  （多个 PR 各自累积 changeset）                          │ 累积
  ▼                                                          │
changeset version ◄──────────────────────────────────────────┘
  │  消费全部 changeset：升 package.json 版本 + 写 CHANGELOG + 删 changeset
  ▼
（review 这批 diff）
  │
  ▼
changeset publish ──► npm publish（只发比 npm 新的包）+ 打 git tag
```

## 下一步

- `version` / `publish` / `status` / 空 changeset 的细节见 [指南 - 工作流](./guide-line/workflow.md)
- `config.json` 每个字段怎么配见 [指南 - 配置](./guide-line/config.md)
- 内部依赖联动、`workspace:` 协议、给应用 / 非 npm 包做版本见 [指南 - Monorepo](./guide-line/monorepo.md)
- 预发布（`pre`）、snapshot、`changesets/action` CI 自动发布见 [指南 - 预发布与 CI](./guide-line/prerelease-ci.md)
- 命令 / 配置 / 坑速查见 [参考](./reference.md)
