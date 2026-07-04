---
layout: doc
outline: [2, 3]
---

# 依赖治理：phantom / doppelganger 与 pnpm 严格隔离

> 基于 Rush（@microsoft/rush 5.x）· 核于 2026-07

## 速查

- **依赖治理是 Rush 的招牌**：大 monorepo 里最隐蔽的两类病是 **phantom dependency（幻影依赖）** 和 **npm doppelganger（同版本重影）**，都是 npm/yarn 扁平化（hoisting）的产物，Rush 靠 **pnpm 严格 symlink** 从根上治它们。
- **phantom = 用了没声明的**：代码 `require` 了一个**未在自己 `package.json` 声明**的包，却因被提升到父级 `node_modules` 而恰好能解析到——版本失配、发布事故的温床。
- **doppelganger = 同一版本被复制多份**：npm 树形解析被迫把**完全相同版本**的同一个包装到多个位置——单例破裂、TS 类型冲突、bundle 体积翻倍。
- **pnpm 为何是解药**：每个包的 `node_modules` **只含自己直接声明的依赖**，传递依赖不可见（phantom 无从发生），且精确模拟真实 DAG（不树形扁平化，doppelganger 消失）；**唯一支持 `--strict-peer-dependencies`**。
- **中心化安装 + symlink**：所有依赖装进 `common/temp/node_modules`，再 symlink 到各项目——全仓只装一次；损坏时 `rush update --purge`，彻底清理 `rush purge`。
- **禁令**：Rush 仓内**绝不**直接 `npm/pnpm/yarn install`、`npm link`、`npm dedupe`；给项目加依赖用 **`rush add`**，它自动跑 `rush update`。
- **`rush add` 常用 flag**：`-p name@version`（必填）、`--dev`、`--peer`、`--exact`、`--caret`、`-m/--make-consistent`（统一全仓同一依赖版本）、`--all`（加到所有项目）、`-s/--skip-update`。
- **`rush check`**：检测多个项目依赖同一库的**不同版本**；`rush.json` 的 `ensureConsistentVersions` 会自动前置调用它，强制全仓版本一致。
- **`common-versions.json`**（`common/config/rush/`）：`preferredVersions`（首选版本，减少间接依赖重复）、`implicitlyPreferredVersions`（默认 true）、`allowedAlternativeVersions`（给一致性校验开例外）。
- **autoinstaller**：`common/autoinstallers/<name>/` 下**自带 package.json + 独立锁文件**的隔离依赖容器，**不被 `rush install` 处理**——用于 Git hooks / 自定义命令 / **Rush 插件**的工具依赖，不污染主 shrinkwrap。
- **`decoupledLocalDependencies`**（旧名 `cyclicDependencyProjects`）：让某依赖**从 registry 装、不做本地互链**，用于打破包间循环依赖。
- **shrinkwrap 纪律**：锁文件在 `common/config/rush/`，必须提交；`rush install`（CI）拒改任何文件、过期即失败。

## 一、为什么依赖治理是 Rush 的第一价值

Turborepo/Nx 主打「构建快」，Rush 主打「**正确**」。在几百个包的大仓里，最贵的不是构建时间，而是**依赖关系的悄然腐化**——一个包用了没声明的依赖、一份 React 被复制成两份、两个项目锁了同一库的不同版本，这些问题在小仓里也许无感，在大仓里会演变成「线上偶发崩溃、类型莫名冲突、bundle 莫名膨胀」的长期慢性病。

Rush 的安装模型（推荐 pnpm + 严格 symlink + 中心化 + 一致性校验）就是一整套**让依赖关系「说到做到」**的机制。理解它要先理解它要根治的两个病：phantom 与 doppelganger。

## 二、phantom dependency（幻影依赖）

**定义**：代码 `require`/`import` 了一个**未在自己 `package.json` 声明**的包，却因为它被提升（hoist）到了父级 `node_modules`，而恰好能被 Node 解析器找到。

**一个具体例子**：`my-library` 只声明了 `minimatch`（deps）和 `rimraf`（devDeps），但代码里却写了：

```js
require("brace-expansion"); // minimatch 的传递依赖，没声明
require("glob");            // rimraf 的传递依赖，没声明
```

npm 3.x 把传递依赖**拍平**到 `my-library/node_modules`，于是这两行「恰好能跑」——但它们是**幻影**：你依赖了从没声明过的包。

**根因**：npm 3.x / yarn 的 **hoisting（扁平化）**把传递依赖上提到共享层级，任意兄弟包都能借「父目录查找规则」访问到它。

**危害**：

1. **版本失配**：`minimatch` 的一个 PATCH 版本可能升级了它自己的依赖大版本，你借来的 `brace-expansion` 随之破裂——你没声明它，却被它的版本变化伤到。
2. **发布事故**：借来的若是 devDependency（如 `glob`），只在开发者机器上装；发布后终端用户环境没有它，import 直接失败。而且因为**多数消费者恰好也有该包**，这个 bug 会长期隐藏，直到某个「干净环境」的用户踩中。
3. **仓根污染最危险**：仓根 `node_modules` 里的包所有子项目都能穿透访问，是 phantom 的重灾区。

**pnpm 如何根治**：严格符号链接下，每个包的 `node_modules` **只含自己直接声明的依赖**，传递依赖被藏在 `.pnpm` 里、对该包不可见——phantom 从物理上无从发生（除非用 `.pnpmfile.cjs` 显式变通）。Rush 还会额外扫描父级 `node_modules` 并告警。这个机制的通论在 [pnpm · 依赖治理](/zh/web-advanced/package-manager/pnpm/guide-line/base)已讲透，本页只讲它对 Rush 依赖治理的意义。

## 三、npm doppelganger（同版本重影）

**定义**：`node_modules` 结构被迫把**完全相同版本**的同一个包，安装到**多个不同位置**（npm 树形解析的固有怪癖）。

**一个具体例子**：`library-A` 依赖 B/C/D/E；其中 B、C 都要 `F@1.0.0`，D、E 都要 `F@2.0.0`。npm 只能把其中一个版本提升到顶层，另一个在多处重复安装——**即使是同一个 `1.0.0`，也可能被复制成多份**。

**危害**：

1. **postinstall 变慢**：有安装脚本（如下载二进制）的包被装多份，安装更慢。
2. **bundle 体积翻倍**：同一个库两份都进了打包产物。
3. **单例被打破**：`require("library-f")` 在不同位置返回**不同的模块实例**——依赖「全局唯一实例」的库（如某些状态/注册表库）直接失效。
4. **TypeScript 类型冲突**：同名 class 的两份声明**互不认可**，混用即编译报错（`Type 'X' is not assignable to type 'X'`）。
5. **语义分歧**：两份 F 各自解析自己的依赖，运行时行为可能不同。

**pnpm 如何根治**：pnpm 的安装模型精确模拟真实的**有向无环图（DAG）**，从根上避免了树形扁平化的复制——同一版本全仓只有一份，doppelganger 被彻底消除。

> **一句话记忆**：**phantom = 用了没声明的（hoisting 借来的）；doppelganger = 同一版本被复制成多份。** 两者都是 npm/yarn 扁平化的病，pnpm 的严格 symlink / DAG 是解药——这正是 Rush 推荐 pnpm 的核心理由。

## 四、中心化安装 + symlink：Rush 怎么组织 node_modules

Rush 不让每个项目各自装依赖，而是**中心化**：

1. 把全仓所有依赖装进 **`common/temp/node_modules`**（由选定的包管理器实际执行）；
2. 再为每个 project 用 **symlink** 生成它自己的 `node_modules`，指向中心化安装的内容；
3. 项目之间的本地依赖（`workspace` 内的包）也用 symlink 互链，改一处全仓即用。

好处是**全仓只跑一次底层 install**，而非 N 个项目 N 次；坏处是这套结构很脆，一旦手动 `npm install` 或 `git clean` 掉一半就会损坏。修复手段：

- `rush update --purge`：先清空再装，修复损坏的安装；
- `rush purge`：彻底清理 Rush 的临时/缓存目录（优于 `git clean`）；
- 若要跑 `git clean -dfx`，先 `rush unlink` 解除 symlink。

## 五、rush add / rush check：加依赖与一致性校验

**给项目加依赖用 `rush add`，不要手改 `package.json` 再 `npm install`**：

```bash
rush add -p lodash                    # 加到当前项目 dependencies，并自动 rush update
rush add -p "example@^1.2.3"          # 指定版本范围
rush add -p jest --dev --exact        # 进 devDependencies，精确版本（无 ~^）
rush add -p react -m                  # --make-consistent：把所有用 react 的项目统一到同一版本
rush add -p typescript --all --dev    # 加到全仓所有项目
```

`rush add` 会**自动跑 `rush update`**、尊重一致性策略、智能选版本，比手改 + update 更省事更安全。移除用 `rush remove`。

**`rush check`** 检测「多个项目依赖同一库的**不同版本**」这一大仓常见腐化。配合 `rush.json` 的 **`ensureConsistentVersions: true`**，Rush 会在 install / update / publish 前**自动前置**跑 `rush check`，强制全仓依赖版本一致——一致性从「靠人自觉」变成「机器门禁」。

## 六、common-versions.json：全仓版本治理

`common/config/rush/common-versions.json` 管全仓的 npm 版本选择，是 `rush check` / `ensureConsistentVersions` 的配套：

```json
{
  "preferredVersions": {
    "typescript": "~5.4.0"
  },
  "implicitlyPreferredVersions": true,
  "allowedAlternativeVersions": {
    "typescript": ["~2.4.0"]
  }
}
```

- **`preferredVersions`**：为某些包指定**首选版本/范围**，Rush 注入到 `common/temp/package.json` 顶层，**减少间接依赖的重复**（帮 doppelganger 收敛）。
- **`implicitlyPreferredVersions`**（默认 `true`）：自动把所有依赖登记为首选版本（除非项目间范围冲突）；遇 peer 依赖冲突装不上时可设为 `false`。
- **`allowedAlternativeVersions`**：给 `rush check` / `ensureConsistentVersions` 开**例外**——允许特定包在个别项目用不同版本（如遗留项目暂时锁老 TypeScript）。这是「强制一致」原则下的合法逃生口，但应克制使用。

## 七、autoinstallers：隔离的工具依赖容器

有一类依赖不属于任何业务项目，却要在特殊时机运行——比如 **Git hooks 里的 lint 工具、自定义命令依赖的 prettier 插件、Rush 插件本身**。这些若混进主 shrinkwrap，会污染依赖图，且在 `rush install` 尚未跑或可能失败（如 Git hook 跑在半成品分支）时无法保证可用。**autoinstaller** 就是为它们准备的隔离容器：

- **是什么**：`common/autoinstallers/<name>/` 下一个**自带 `package.json` + 独立锁文件**的目录，**不被 `rush install` / `rush build` 处理**。
- **解决什么**：让工具依赖在独立、快速、不污染主 shrinkwrap 的前提下安装；**启用 Rush 插件必须配 autoinstaller**。

```bash
rush init-autoinstaller --name my-tools    # 创建
# 编辑 common/autoinstallers/my-tools/package.json，加入 prettier 等
rush update-autoinstaller --name my-tools  # 生成独立 pnpm-lock.yaml，提交 Git
```

绑定：在 `common/config/rush/command-line.json` 里，自定义命令的 `autoinstallerName` 字段引用它，命令运行时 Rush 自动安装其依赖。

## 八、decoupledLocalDependencies：受控的循环依赖

大仓偶尔存在**包间循环依赖**（A 依赖 B、B 又依赖 A）。Rush 默认对本地包做 symlink 互链，循环会导致构建顺序无解。`rush.json` 的 project 字段 **`decoupledLocalDependencies`**（**旧名 `cyclicDependencyProjects`**）声明「这些依赖**改从 npm registry 安装、不做本地互链**」——用「装一份已发布的旧版本」打破循环。它是受控的妥协：循环依赖本身应尽量消除，这个字段只是让不得不存在的循环能被 Rush 处理。

## 小结

依赖治理是 Rush 区别于 Turborepo/Nx 的第一价值。两个必须理解的病：**phantom（用了没声明的，hoisting 借来）** 与 **doppelganger（同一版本被复制多份）**，都是 npm/yarn 扁平化的产物，**pnpm 严格 symlink / DAG 是解药**——这是 Rush 推荐 pnpm 的根本原因。Rush 用**中心化安装 + symlink** 组织 `node_modules`（清理用 `rush purge` 而非 `git clean`），用 **`rush add`** 加依赖（禁用原生包管理器），用 **`rush check` + `ensureConsistentVersions` + `common-versions.json`** 强制全仓版本一致，用 **autoinstaller** 隔离工具依赖不污染主锁文件。把依赖治理理解透，下一步看 Rush 怎么把大仓构建做快：[增量构建与缓存](./build-cache)。
