---
layout: doc
outline: [2, 3]
---

# 入门：Rush 是什么与为什么

> 基于 Rush（@microsoft/rush 5.x）· 核于 2026-07

## 速查

- **一句话定位**：Rush 是微软 **Rush Stack** 出品的「a scalable monorepo manager for the web」——面向**大规模企业级** JS/TS 大仓，做依赖治理 + 增量/并行构建 + change file 受控发布。
- **本质是编排层（orchestrator）**：Rush **不替代**你的构建工具，它统一做跨项目的安装、互链、并行构建、发布、部署、策略治理；每个项目内部用什么构建（Heft/tsc/Webpack）由你定。
- **安装**：`npm install -g @microsoft/rush`——但全局装的只是**薄壳（版本选择器）**，真正运行的是 `rush.json` 里 **`rushVersion`** 锁定的引擎版本，保证全团队 + CI 行为一致。
- **唯一主配置是 `rush.json`**（仓根，支持 `//` 注释的 JSONC）；其余配置在 `common/config/rush/`。必填三件：`rushVersion`、**三选一的包管理器版本**（`pnpmVersion`/`npmVersion`/`yarnVersion`）、`projects` 清单。
- **包管理器三选一，官方推荐 pnpm**：pnpm 用严格 symlink 模拟真实依赖图，**天然消灭 phantom 依赖与 doppelganger**，且唯一支持 `--strict-peer-dependencies`。
- **`rush update`（开发者日常）vs `rush install`（CI 专用）**：`update` 会**按需修改 shrinkwrap**；`install` **拒绝改任何文件**，锁文件过期即直接构建失败。
- **中心化安装**：所有依赖装进 `common/temp/node_modules`，再为每个项目用 **symlink** 生成 `node_modules`——全仓只跑一次底层 install。
- **shrinkwrap（锁文件）统一放 `common/config/rush/`**：pnpm → `pnpm-lock.yaml`、npm → `npm-shrinkwrap.json`、yarn → `yarn.lock`，**必须提交 Git**。
- **禁令**：Rush 仓内**绝不能**直接跑 `npm/pnpm/yarn install`、`npm link`、`npm dedupe`——会破坏中心化 + symlink 结构；清理用 `rush purge` 而非 `git clean`。
- **`rush build`（增量）vs `rush rebuild`（全量）**：增量靠 **`@rushstack/package-deps-hash` 对文件内容做哈希**（不看时间戳），切分支时间戳变了内容没变也不误判。
- **`rushx <script>`**：在当前项目目录跑其 `package.json` 里的 script（类似 `npm run` 但更短、报错更好）。
- **版本坐标**：`@microsoft/rush` **5.x**（2026-07 为 `5.177.x`，schema v5，长期单调递增无「Rush 6」大改）。

## 一、Rush 解决什么问题：企业级大 monorepo

monorepo 的通用理由（原子提交、跨包重构、统一工具链）在 monorepo 章已讲。Rush 的**独特切入点**不是「怎么把多个包放一个仓」，而是**「当这个仓大到几百个包、几百人协作、每天几百个 PR 时，怎么让它仍然正确、可控、可复现」**。它把多仓协作的四大痛点作为设计出发点：

| 多仓痛点 | 含义 | Rush 的回答 |
| --- | --- | --- |
| **隧道视野** | 开发者只盯自己那几个仓，跨项目问题无人管 | 一个大仓装下互相依赖的包，改动即刻可见 |
| **级联发布** | 改动沿 `lib3→lib2→lib1→app` 逐级人工发版 | 中心化安装 + 本地互链，改一处全仓即用 |
| **下游受害者** | 更新传播慢，回归数周后 `npm update` 才暴雷 | 改动时**一起跑全部单测**，回归当场暴露 |
| **link 地狱** | `npm link` 变通导致跨分支 symlink 混乱 | Rush 统一管理 symlink，禁用手动 link |

所以 Rush 面向的是「**one Git repo per team**」——不是开源界「一个包一个仓」，而是企业内「一个团队/产品线一个大仓」。它的价值主张不在「构建快」（那是 Turborepo 的主场），而在**正确性、治理、受控发布、确定性**。这也是判断「该不该用 Rush」的信号：**你的瓶颈是「几百人协作下的依赖混乱与发布失控」，而不是「CI 构建慢」**。

> **Rush ≠ 构建工具。** 这是入门第一个必须扭正的认知：Rush 不编译任何代码，它**编排**你已有的构建。跨项目的「装依赖 / 并行跑 build / 发 npm 包 / 打部署包」归 Rush，单个项目内的「tsc / webpack / jest」归你自己的构建工具（官方推荐搭配 Heft，但不强制，见[生态与扩展](./guide-line/ecosystem)）。

## 二、版本选择器：为什么全局 `rush` 只是一个壳

安装 Rush 用 `npm install -g @microsoft/rush`，但这里藏着 Rush 一个关键设计——**版本选择器（version selector）**：

- **痛点**：团队里每人全局装的 Rush 版本可能不一致 → 行为漂移、构建结果不确定、「在我机器上能跑」。
- **机制**：`rush.json` 里的 **`rushVersion`** 字段声明本仓要用的引擎版本。全局装的 `rush` 只是个**薄壳（shim）**——它读 `rush.json` 的 `rushVersion`，**自动下载并调用该指定版本的引擎**来运行，与你全局装了哪个版本无关。
- **收益**：确定性构建、可复现 bug、无需人工统一版本；升级 Rush 只改 `rush.json` 一行，全团队下次运行自动切换。
- **CI / 脚本场景**：`common/scripts/install-run-rush.js` 无需全局装 Rush 即可跑对版本；工具脚本经 `@rushstack/rush-sdk` 自动对齐引擎版本（见[生态与扩展](./guide-line/ecosystem)）。

## 三、rush.json：唯一必需的主配置

`rush.json`（仓根）是 Rush 唯一必需的主配置，其余配置都在 `common/config/rush/`。它是 **JSONC**（支持 `//` 行注释）。最小可用配置只需三样：**引擎版本 + 包管理器版本 + 项目清单**。

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/rush/v5/rush.schema.json",
  "rushVersion": "5.177.1",
  "pnpmVersion": "8.15.0",
  "nodeSupportedVersionRange": ">=18.17.0 <19.0.0 || >=20.9.0 <21.0.0",
  "projectFolderMinDepth": 2,
  "projectFolderMaxDepth": 2,
  "ensureConsistentVersions": true,
  "repository": {
    "url": "https://github.com/example/monorepo",
    "defaultBranch": "main"
  },
  "projects": [
    {
      "packageName": "@my-scope/my-app",
      "projectFolder": "apps/my-app",
      "reviewCategory": "production",
      "shouldPublish": true,
      "tags": ["frontend-team"]
    },
    {
      "packageName": "@my-scope/my-lib",
      "projectFolder": "libraries/my-lib",
      "shouldPublish": true,
      "versionPolicyName": "myPublic"
    }
  ]
}
```

几个入门必须理解的字段（完整字段见[参考](./reference)）：

- **`rushVersion`（必填）**：版本选择器锁定的引擎版本（见上一节）。
- **`pnpmVersion` / `npmVersion` / `yarnVersion`（三选一必填）**：声明并锁定包管理器及其版本。
- **`projects`（必填）**：每个 project 一条，`packageName` 必须与该项目 `package.json` 的 `name` 一致，`projectFolder` 是相对仓根的路径。
- **`ensureConsistentVersions`**：开启后在 install/update/publish 前自动跑 `rush check`，**强制全仓依赖版本一致**（例外走 `common-versions.json` 的 `allowedAlternativeVersions`，见[依赖治理](./guide-line/dependencies)）。
- **`projectFolderMinDepth` / `MaxDepth`**：project 目录嵌套深度（默认 1 / 2），鼓励 `apps/xxx`、`libraries/xxx` 这种「分类目录 / 项目」两级组织。
- **`shouldPublish` / `versionPolicyName`**：标记可发布的公共包并绑定版本策略（见[受控发布](./guide-line/publishing)）。

## 四、选包管理器：为什么官方推荐 pnpm

Rush 不硬性钦定包管理器，但给出**明确倾向**——推荐 pnpm：

| 包管理器 | Rush 视角 |
| --- | --- |
| **pnpm（推荐）** | 用符号链接严格模拟真实依赖图，**天然消灭 phantom 依赖与 doppelganger**，遵循 Node 模块解析标准；**唯一支持 `--strict-peer-dependencies`**；微软内部数百项目、每天数百 PR 验证过 |
| **npm** | 兼容性最好、对问题包最宽容；但无法根治 hoisting 带来的 phantom / doppelganger |
| **yarn** | 装得比 npm 快、比 pnpm 慢；Rush 对 yarn 支持较新、验证不足；**Rush 下 yarn 不启用 workspaces**（Rush 自己的 link 策略已等效） |

推荐 pnpm 的**核心理由**是依赖治理——它从根上消除 phantom 依赖与 doppelganger 这两类「npm/yarn 扁平化的病」。这个机制是 Rush 的招牌深度考点，完整展开见[依赖治理](./guide-line/dependencies)。切换包管理器：改 `rush.json` 三选一字段 → 删旧配置 → `rush update --full --purge`。

## 五、rush install vs rush update：装依赖的两种姿势

Rush 的安装是**中心化**的：所有依赖装进 `common/temp/node_modules`，再为每个 project 用 **symlink** 生成其 `node_modules`——全仓只跑一次底层 install，避免 N 个项目 N 次安装的时间爆炸。装依赖有两个入口，**区分它们是入门最高频的考点**：

| 命令 | 用途 | 会改文件吗 | 锁文件过期时 |
| --- | --- | --- | --- |
| **`rush update`** | **开发者日常**：改了 `package.json` 后运行 | **会**：按需更新 shrinkwrap | 更新锁文件 |
| **`rush install`** | **CI 专用**：从干净仓库装依赖 | **不会**：拒绝修改任何文件 | **直接构建失败** |

- **`rush update`**：校验/应用策略 → 校验并**按需更新 shrinkwrap** → 装到 `common/temp/node_modules` → 为各项目建 symlink。变体：`--full`（无视锁文件、重算所有版本到允许的最新）、`--purge`（先清空再装，修复损坏）。
- **`rush install`**：**拒绝修改任何文件**——若锁文件过期/不一致，直接**构建失败**并提醒「你忘了本地跑 `rush update`」。这保证 CI 用的是已提交的确定依赖，不会偷偷改锁文件。

> **shrinkwrap 纪律**：锁文件统一放 `common/config/rush/`（pnpm → `pnpm-lock.yaml`、npm → `npm-shrinkwrap.json`、yarn → `yarn.lock`），**必须提交 Git**。锁文件是「已提交的确定依赖」的载体，`rush install` 的整个可靠性都建立在它被正确提交之上。

::: danger 绝不要在 Rush 仓内直接跑原生包管理器
`npm install`、`pnpm install`、`yarn install`、`npm link`、`npm dedupe` 都会**破坏 Rush 的中心化安装 + symlink 结构**。装依赖一律走 `rush update` / `rush install`；给单个项目加依赖用 `rush add`（见[依赖治理](./guide-line/dependencies)）；清理损坏用 `rush purge`（优于 `git clean`）。
:::

## 六、rush build：增量构建初体验

依赖装好后，构建走 `rush build`：

```bash
rush install        # CI：按已提交锁文件装依赖（本地日常用 rush update）
rush build          # 增量构建：只建变化的项目
rush build --to my-app   # 只建 my-app 及其所有上游依赖
rush rebuild        # 全量构建：忽略增量状态，干净重建所有项目
```

- **`rush build`（增量）**：只构建**发生变化**的项目。判定「已是最新」的三条件：① 本地已构建过；② 输入文件与 npm 依赖自那以后未变；③ 依赖的其他 Rush 项目也都最新。任一变化即重建。
- **`rush rebuild`（全量）**：忽略增量状态，干净重建所有项目。
- **增量靠内容哈希，不靠时间戳**：Rush 用 **`@rushstack/package-deps-hash`** 对**文件内容做哈希**（遵守 `.gitignore`）。这意味着切 Git 分支再切回、时间戳变了但内容没变，增量分析**不受影响**——这是 Rush 增量比「看 mtime」更可靠的关键。
- **并行**：`rush build -p max` 按 CPU 核数并行（基于依赖图决定顺序）；`-v` 打印各项目详细日志。

增量构建的哈希机制、项目子集选择器（`--to` / `--from` / `--impacted-by`）、以及更进一步的**本地 + 云 build cache**，是 Rush 的核心深度能力，完整展开见[增量构建与缓存](./guide-line/build-cache)。

## 小结

Rush 是**编排层而非构建工具**——它在企业级大 monorepo（一个团队一个仓、几百人协作）场景下做依赖治理、增量/并行构建、受控发布。入门要钉死的心智：**全局 `rush` 是壳，真正跑 `rush.json` 里 `rushVersion` 锁定的引擎**；**`rush update` 是开发者日常（改锁文件）、`rush install` 是 CI 专用（只读、过期即失败）**；**推荐 pnpm 是为了根治 phantom / doppelganger**；**Rush 仓内绝不直接跑原生包管理器**；**`rush build` 增量靠内容哈希不靠时间戳**。这五条立住了，就可以往深处走——从 Rush 的招牌能力「依赖治理」开始：[依赖治理](./guide-line/dependencies)。
