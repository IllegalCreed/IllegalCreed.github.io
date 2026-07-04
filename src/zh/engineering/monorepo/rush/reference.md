---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Rush（@microsoft/rush 5.x）· 核于 2026-07

## 速查

- 本页汇总七张表：**常用命令** / **rush.json 字段** / **配置文件** / **构建选择器** / **change type** / **版本策略** / **高频坑**，末尾附权威链接。
- 命令一句话：装依赖 `rush update`（日常）/ `rush install`（CI）；构建 `rush build`（增量）/ `rush rebuild`（全量）；加依赖 `rush add`；发布 `rush change` → `rush version --bump` → `rush publish`；部署 `rush deploy`；跑脚本 `rushx`。
- 配置一句话：主配置 `rush.json`（仓根），其余全在 `common/config/rush/`；锁文件、`build-cache.json`、`version-policies.json`、`common-versions.json`、`command-line.json` 都在这里。
- 选择器一句话：`--to`（含上游依赖，安全）、`--from`（含下游依赖者，安全）、`--impacted-by`/`--only`（略过上游，**unsafe**）。
- change type 一句话：`major`/`minor`/`patch`/`none`（也要写）/`hotfix`（实验）；CI 用 `rush change --verify` 强制门禁。
- 版本策略一句话：**lockstep**（共享版本一起升）vs **individual**（各升各的，`lockedMajor` 锁主版本）。
- 高频坑一句话：全局 `rush` 是壳跑 `rushVersion`；仓内禁跑原生包管理器；`rush publish` 裸跑是 dry run；`deploy ≠ publish`；`none` change file 也要写。
- 版本一句话：`@microsoft/rush` **5.x（2026-07 为 5.177.x，schema v5）**，微软 Rush Stack 出品，配套 Heft / rush-sdk / Lockfile Explorer。

## 一、常用命令表

| 命令 | 用途 | 关键点 |
| --- | --- | --- |
| `rush update` | 开发者日常装依赖 | **会改 shrinkwrap**；`--full` 重算最新、`--purge` 先清空 |
| `rush install` | CI 装依赖 | **只读、拒改文件**；锁文件过期即失败 |
| `rush add -p <pkg>` | 给当前项目加依赖 | 自动 `rush update`；`--dev`/`--exact`/`-m`/`--all` |
| `rush remove -p <pkg>` | 移除依赖 | 同样自动 update |
| `rush check` | 检测跨项目版本不一致 | `ensureConsistentVersions` 自动前置调用 |
| `rush build` | 增量构建 | 靠内容哈希；`-p max` 并行、`-v` 详细日志 |
| `rush rebuild` | 全量构建 | 忽略增量；默认不写缓存 |
| `rush change` | 生成 change file | `--verify`（CI 门禁）、`--bulk`（批量） |
| `rush version --bump` | 结算版本 + changelog | 消费 change files、按策略递增 |
| `rush publish` | 发布 npm 包 | **裸跑 = dry run**；`--apply`/`--publish`/`--pack` |
| `rush deploy` | 打可运行部署包 | 产物到 `common/deploy/`；≠ publish |
| `rush purge` | 彻底清理 | 优于 `git clean`；修损坏 |
| `rushx <script>` | 跑当前项目 script | 类似 `npm run`，更短、报错更好 |
| `rush-pnpm <cmd>` | 安全代理 pnpm 子命令 | 如 `rush-pnpm audit` |
| `rush init` / `rush init-autoinstaller` / `rush init-deploy` | 初始化配置 | 生成 rush.json / autoinstaller / deploy.json |

详见[入门](./getting-started)与各深度页。

## 二、rush.json 关键字段表

| 字段 | 说明 |
| --- | --- |
| `rushVersion`（必填） | 版本选择器锁定的引擎版本 |
| `pnpmVersion` / `npmVersion` / `yarnVersion`（三选一必填） | 声明并锁定包管理器版本 |
| `projects`（必填） | 项目清单（`packageName` / `projectFolder` / …） |
| `nodeSupportedVersionRange` | 强制团队用一致的 Node SemVer 范围 |
| `ensureConsistentVersions` | 开启后 install/publish 前自动跑 `rush check` |
| `projectFolderMinDepth` / `MaxDepth` | 项目目录深度（默认 1 / 2） |
| `approvedPackagesPolicy` | 新包审批工作流（按 `reviewCategory` 分类） |
| `gitPolicy` | `allowedEmailRegExps` 邮箱白名单、提交信息模板 |
| `repository` | `url` / `defaultBranch`（默认 `main`）/ `defaultRemote` |
| `eventHooks` | 生命周期钩子（`preRushInstall`/`postRushBuild` 等） |
| `variants` | 平行的替代依赖配置集（迁移期用） |
| `allowedProjectTags` | 集中登记合法 tag，防拼写错误 |

**`projects[]` 每项**：`packageName`（须与 package.json 一致）、`projectFolder`、`reviewCategory`、`shouldPublish`、`publishFolder`、`versionPolicyName`、**`decoupledLocalDependencies`**（旧名 `cyclicDependencyProjects`，打破循环依赖）、`skipRushCheck`、`subspaceName`、`tags`。

## 三、配置文件位置表

| 文件 | 位置 | 作用 |
| --- | --- | --- |
| `rush.json` | 仓根 | 唯一必需主配置（JSONC） |
| `pnpm-lock.yaml` / `npm-shrinkwrap.json` / `yarn.lock` | `common/config/rush/` | 锁文件，**必须提交** |
| `.npmrc` / `.npmrc-publish` | `common/config/rush/` | registry 配置（查找位置与标准 npm 不同） |
| `common-versions.json` | `common/config/rush/` | `preferredVersions` / `allowedAlternativeVersions` |
| `build-cache.json` | `common/config/rush/` | `buildCacheEnabled` + `cacheProvider` |
| `version-policies.json` | `common/config/rush/` | lockstep / individual 策略 |
| `command-line.json` | `common/config/rush/` | 自定义命令（含 `autoinstallerName`） |
| `rush-project.json` | 各项目 `config/` | 声明缓存产物目录（`operationSettings`） |
| `deploy.json` | `common/config/rush/deploy/` | `deploymentProjectNames` / `linkCreation` |
| autoinstaller | `common/autoinstallers/<name>/` | 隔离工具依赖（独立锁文件） |
| change files | `common/changes/` | 待发布的版本变更记录 |
| 中心化 node_modules / 缓存 | `common/temp/` | 安装 + build cache（`rush purge` 会清） |
| 增量状态 | `.rush/temp/` | `package-deps` 哈希（不提交） |

## 四、构建选择器表

| 参数 | 含义 | 安全性 |
| --- | --- | --- |
| `--to X` / `-t` | X + 其**所有上游依赖** | 安全（最常用） |
| `--to-except X` / `-T` | X 的依赖，不含 X 自己 | 安全 |
| `--from X` / `-f` | X + 依赖 + **所有下游依赖者** | 安全 |
| `--only X` / `-o` | 仅 X，忽略依赖 | **unsafe**（假定上游就绪） |
| `--impacted-by X` / `-i` | X + 下游，忽略上游 | **unsafe** |
| `--impacted-by-except X` / `-I` | 仅下游依赖者，不含 X | **unsafe** |
| `-c` / `--changed-projects-only` | 只建变更项目、忽略下游 | **unsafe** |

**取值**：包名（`@scope/x` 或 `x`）、`.`（当前目录项目）、`git:<branch>`（自某提交起改动）、`tag:<name>`、`subspace:<name>`。并行 `-p`：整数 / 百分比（`50%`）/ `max`。详见[增量构建与缓存](./guide-line/build-cache)。

## 五、change type 表

| type | 语义 | 版本效果 |
| --- | --- | --- |
| `major` | 破坏性变更 | 主版本 +1 |
| `minor` | 兼容新增 | 次版本 +1 |
| `patch` | Bug 修复 / 私有改动 | 修订号 +1 |
| `none` | 不需发布 | 不升版本，**但仍需写一条** |
| `hotfix` | 旧版热修（实验） | 阻止其他递增 |

CI 门禁：`rush change --verify`（改公共包没写即失败，靠 `git diff` 对比目标分支）。发布两步：`rush version --bump` → `rush publish`（裸跑 dry run / `--apply` / `--publish` / `--pack`）。详见[受控发布](./guide-line/publishing)。

## 六、版本策略表

| 维度 | `lockStepVersion`（锁步） | `individualVersion`（独立） |
| --- | --- | --- |
| 版本号 | 一组包**共享同一版本、一起升** | 各包**独立递增** |
| 适用 | 同产品的一组可选组件 | 彼此独立演进的库 |
| 关键字段 | `version`（当前版）、`nextBump`（下次递增）、`mainProject`（共享 CHANGELOG） | `lockedMajor`（可选，锁主版本） |
| 绑定 | `rush.json` 的 `versionPolicyName` + `shouldPublish: true` | 同左 |

## 七、build cache 与依赖治理速查

| 主题 | 要点 |
| --- | --- |
| **缓存键四要素** | 项目源哈希 + 依赖项目源哈希 + 所有 npm 依赖版本 + 命令行参数 |
| **cacheProvider** | `local-only` / `azure-blob-storage` / `amazon-s3` |
| **写权限** | `rush build` 读写；`rush rebuild` 默认不写；`RUSH_BUILD_CACHE_WRITE_ALLOWED`（0/1）覆盖 |
| **增量哈希** | `@rushstack/package-deps-hash` 对**文件内容**哈希（不看时间戳），状态在 `.rush/temp/` |
| **phantom 依赖** | 用了没声明的（hoisting 借来）→ pnpm 严格 symlink 根治 |
| **doppelganger** | 同一版本被复制多份 → pnpm 模拟 DAG 根治 |
| **推荐 pnpm** | 根治上述两者 + **唯一支持 `--strict-peer-dependencies`** |
| **autoinstaller** | 隔离工具依赖（Git hook / 命令 / 插件），不进主锁文件；插件必配 |

## 八、高频坑与易错点

- **全局 `rush` 只是壳**：真正跑的是 `rush.json` 里 `rushVersion` 锁定的引擎版本。
- **`rush install` vs `rush update`**：CI 用 install（只读、过期即失败），开发者用 update（改锁文件）。
- **仓内禁跑原生包管理器**：`npm/pnpm/yarn install`、`npm link`、`npm dedupe` 会破坏结构；清理用 `rush purge`。
- **`rush publish` 裸跑是 dry run**：不加 `--publish` 不会真发 registry。
- **`none` change file 也要写**：改了公共包目录就得有 change file，`rush change --verify` 会拦。
- **`deploy ≠ publish`**：deploy 交付可运行 App（`common/deploy/`），publish 发 npm 包。
- **`--impacted-by` / `--only` 是 unsafe**：略过上游依赖，假定其已就绪；求稳用 `--to` / `--from`。
- **`decoupledLocalDependencies` 旧名 `cyclicDependencyProjects`**：打破循环依赖 / 强制从 registry 装。
- **写脚本用 `rush-sdk` 而非 `rush-lib`**：前者自动对齐引擎版本。
- **Rush ≠ 构建工具**：Rush 编排跨项目，单项目构建交给 Heft/自选工具。
- **实验特性**：subspaces / cobuilds / phased builds / Rush 插件 / hotfix change type 均为实验，生产使用需谨慎。

## 九、权威链接

- [Rush 官网](https://rushjs.io/) —— 总入口
- [Intro · Welcome](https://rushjs.io/pages/intro/welcome/) · [Why a monorepo?](https://rushjs.io/pages/intro/why_mono/) —— 定位与理念
- [Developer · Everyday commands](https://rushjs.io/pages/developer/everyday_commands/) · [Selecting subsets](https://rushjs.io/pages/developer/selecting_subsets/) —— 日常命令与选择器
- [Configs · rush.json](https://rushjs.io/pages/configs/rush_json/) · [common-versions.json](https://rushjs.io/pages/configs/common-versions_json/) · [version-policies.json](https://rushjs.io/pages/configs/version-policies_json/) —— 配置字段
- [Maintainer · Package managers](https://rushjs.io/pages/maintainer/package_managers/) · [Build cache](https://rushjs.io/pages/maintainer/build_cache/) · [Publishing](https://rushjs.io/pages/maintainer/publishing/) · [Autoinstallers](https://rushjs.io/pages/maintainer/autoinstallers/) · [Deploying](https://rushjs.io/pages/maintainer/deploying/) —— 维护者主题
- [Advanced · Phantom dependencies](https://rushjs.io/pages/advanced/phantom_deps/) · [NPM doppelgangers](https://rushjs.io/pages/advanced/npm_doppelgangers/) · [Incremental builds](https://rushjs.io/pages/advanced/incremental_builds/) —— 深度概念
- [Extensibility · rush-lib API](https://rushjs.io/pages/extensibility/api/) —— rush-sdk / RushConfiguration
- [Heft 文档](https://heft.rushstack.io/) · [Lockfile Explorer](https://lfx.rushstack.io/) —— 配套工具
- [GitHub: microsoft/rushstack](https://github.com/microsoft/rushstack) —— 源码与版本（`@microsoft/rush` 5.x）
- 本站相关：[入门](./getting-started) · [依赖治理](./guide-line/dependencies) · [增量构建与缓存](./guide-line/build-cache) · [受控发布](./guide-line/publishing) · [生态与扩展](./guide-line/ecosystem) · [Turborepo](../turborepo/) · [pnpm](/zh/web-advanced/package-manager/pnpm/)
