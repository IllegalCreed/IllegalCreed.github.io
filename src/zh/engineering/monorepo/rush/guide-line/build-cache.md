---
layout: doc
outline: [2, 3]
---

# 增量构建与缓存：package-deps-hash、并行、build cache

> 基于 Rush（@microsoft/rush 5.x）· 核于 2026-07

## 速查

- **`rush build`（增量）vs `rush rebuild`（全量）**：`build` 只重建变化的项目，`rebuild` 忽略增量状态干净重建所有项目。
- **增量靠内容哈希，不靠时间戳**：Rush 用 **`@rushstack/package-deps-hash`** 对**文件内容**做哈希（遵守 `.gitignore`）——切分支导致 mtime 变、内容没变时，增量分析**不误判**。
- **「已最新」三条件**：① 本地已构建过；② 输入文件与 npm 依赖未变；③ 依赖的其他 Rush 项目也都最新。任一变化即重建。命令行参数变化（`--production`）也触发重建。
- **增量状态存 `.rush/temp/`**（如 `package-deps_<task>.json`），**不提交 Git**；中心化安装与缓存在 `common/temp/`。
- **并行 `-p / --parallelism`**：取正整数、百分比（`50%`）、或 `max`（= CPU 核数）；基于依赖图决定顺序与可并行部分。
- **项目子集选择器**：`--to X`（X + 上游依赖）、`--from X`（X + 下游依赖者）、`--to-except X`（上游但不含 X）、`--impacted-by X` / `--only X`（**unsafe**，略过上游）；可叠加取并集。
- **选择器取值**：包名、`.`（当前目录项目）、`git:<branch>`（自某提交起改动的项目）、`tag:<name>`、`subspace:<name>`。
- **两种增量策略**：**输出保留**（无 build cache，输入未变则保留本地产物、跳过执行）vs **缓存恢复**（启用 build cache，命中则删产物、从缓存 tar 包解压还原）。
- **build cache 更进一步**：把产物打成 **tar 归档**存本地或云端，切分支/新克隆免全量重建（官方举例 30 分钟 → 30 秒）。
- **缓存键四要素**：① 项目源文件哈希；② 依赖项目源文件哈希；③ 所有直接/间接 npm 依赖版本；④ 命令行参数。
- **`build-cache.json`（`common/config/rush/`）**：`buildCacheEnabled` + `cacheProvider`（`local-only` / `azure-blob-storage` / `amazon-s3`）；本地缓存在 `common/temp/build-cache`（`rush purge` 会清）。
- **写权限控制**：`rush build` 读写缓存；`rush rebuild` 默认**不写**缓存；用环境变量 **`RUSH_BUILD_CACHE_WRITE_ALLOWED`**（`0`/`1` 开关）覆盖当前操作是否可写——CI 常置 `1` 让缓存被填充。

## 一、rush build vs rush rebuild

Rush 的构建有两个基本命令，区别只在「是否吃增量」：

- **`rush build`（增量）**：只构建**发生变化**的项目——这是日常与 CI 的常态。
- **`rush rebuild`（全量）**：**忽略增量状态**，干净重建所有项目——用于「怀疑增量算错了」或「首次建立缓存基线」。

`rush build` 判定一个项目「已是最新、可跳过」需同时满足**三条件**：

1. 该项目在本地**已经构建过**；
2. 它的**输入文件**与它依赖的 **npm 包**自那以后**未发生变化**；
3. 如果它依赖其他 Rush 项目，**那些项目也都是最新**的。

任一条件被打破即重建。此外，**命令行参数变化也会触发重建**——例如从 `rush build` 换成 `rush build --production`，Rush 认为输出可能不同，会重建而非复用。

## 二、package-deps-hash：为什么增量靠内容哈希而非时间戳

朴素的增量工具看文件**修改时间（mtime）**，但 mtime 在 monorepo 里极不可靠：`git checkout` 切换分支会重写一堆文件的时间戳，即使内容一个字没改。Rush 用 **`@rushstack/package-deps-hash`** 解决这个问题——它对**文件内容做哈希**（并遵守 `.gitignore`，排除产物与临时文件），而非看时间戳。

带来的直接好处：**切到别的分支验证一下、再切回来，时间戳全变了但内容没变——增量分析完全不受影响，不会白白重建**。这是 Rush 增量比「看 mtime」类工具更可靠的关键。

增量状态存在 **`.rush/temp/`**（如 `package-deps_<task>.json`），**不提交 Git**（它是本地机器的构建足迹，跨机器无意义）。注意区分两个临时目录：**`.rush/temp/` 存增量状态，`common/temp/` 存中心化安装与 build cache**。

## 三、并行与项目子集选择器

### 并行度 `-p`

`rush build -p <n>` 控制并行度，取值：正整数、百分比（如 `50%`）、或 `max`（= CPU 核数）；默认按 OS 调整。Rush 基于**依赖图**决定构建顺序——有依赖关系的串行、无依赖关系的并行。配套 flag：`-v/--verbose`（打印各项目日志而非仅状态汇总）、`--timeline`（构建后打印 ASCII 时序 + CPU 图，用于分析并行瓶颈）。

### 子集选择器

大仓里往往只想建「我改的那块 + 相关的」。`rush build` 及多数命令支持一组**选择器**参数，多个可叠加取并集：

| 参数 | 含义 |
| --- | --- |
| `--to X` / `-t` | X **及其所有依赖**（上游）——最常用，「把 X 建出来所需的一切」 |
| `--to-except X` / `-T` | X 的依赖，但**不含 X 自己** |
| `--from X` / `-f` | X + 其依赖 + **所有依赖 X 的下游**——「改了 X，重建受影响的一切」 |
| `--only X` / `-o` | **仅 X**，忽略依赖（**unsafe**：假定依赖已就绪） |
| `--impacted-by X` / `-i` | X + 依赖 X 的下游，**忽略 X 的上游**（**unsafe**） |
| `--impacted-by-except X` / `-I` | 仅下游依赖者，不含 X（**unsafe**） |

**「unsafe」的含义**：`--only` / `--impacted-by` 略过上游依赖，假定它们已经是最新——若上游其实变了，你会基于过时的上游构建，结果不可靠。日常求稳用 `--to` / `--from`；`--impacted-by` 只在你确信上游没动、想省时间时用。

**选择器取值**不止包名：`.`（当前目录所在项目）、`git:<branch>`（自某 Git 提交以来改动的项目——CI 只建变更）、`tag:<name>`（`rush.json` 里登记的标签）、`subspace:<name>`。例：

```bash
rush build --to .                    # 建「当前项目 + 其所有上游依赖」
rush build --from @scope/ui          # 改了 ui，重建它 + 所有依赖它的项目
rush build --to tag:frontend-team    # 建某团队负责的项目及其依赖
```

## 四、两种增量策略：输出保留 vs 缓存恢复

Rush 的「跳过重复工作」有两个层次，理解它们的区别是本页重点：

- **输出保留（Output Preservation，无 build cache）**：输入未变时，**保留本地已有产物、直接跳过执行**，省去起进程 / 跑脚本的开销。前提是产物**还在本地**——切了分支、清了目录就没了。
- **缓存恢复（Cache Restoration，启用 build cache）**：命中缓存时，**删掉产物目录、从缓存 tar 归档解压还原**。因为产物存在缓存里（本地磁盘或云端），即使**切分支、全新克隆、换台机器**也能恢复。

一句话：**输出保留只在「本地产物还在」时有效；build cache 让「换环境也能秒级恢复」成为可能**。

## 五、build cache：本地 + 云

**作用**：比「输出保留」更进一步——把每个项目的产物打成 **tar 归档**存到本地磁盘或云端；切分支、新克隆、CI 新机器无需全量重建，直接**从缓存解压恢复**（官方举例：一次 30 分钟的构建 → 命中缓存 30 秒）。

### 缓存键（cache key）：什么变了才算 miss

Rush 自动把以下**四类输入**算进缓存键，任一变化即缓存 miss、重新构建：

1. **项目自身源文件的哈希**（遵守 `.gitignore`）；
2. **依赖项目的源文件哈希**（上游变了，你也得重建）；
3. **所有直接 / 间接 npm 依赖的版本**（依赖升级即失效）；
4. **命令行参数**（`--production` 与否算不同缓存）。

可在 `rush-project.json` 里加环境变量或排除 glob 来定制缓存键。

### build-cache.json：开关与存储后端

`common/config/rush/build-cache.json`：

```json
{
  "buildCacheEnabled": true,
  "cacheProvider": "local-only"
}
```

`cacheProvider` 取值：

- **`local-only`**：只存本地磁盘（`common/temp/build-cache`，`rush purge` 会清）；
- **`azure-blob-storage`**：微软 Azure Blob 容器；
- **`amazon-s3`**：Amazon S3 桶。

**云端缓存的典型配置**：CI 系统**写**缓存，个体开发者**只读**——于是开发者拉下代码首次构建就能命中 CI 早已建好的缓存，「全新克隆也秒级构建」。

### rush-project.json：声明要缓存哪些产物目录

每个项目在自己的 `config/rush-project.json` 声明产物目录，Rush 才知道该缓存/恢复什么：

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/rush/v5/rush-project.schema.json",
  "operationSettings": [
    { "operationName": "build", "outputFolderNames": ["lib", "dist"] }
  ]
}
```

`operationSettings` 是现代（schema v5）写法，可按 operation 分别声明产物、甚至禁用某 operation 的缓存；早期文档里的顶层 `projectOutputFolderNames` 是等效的简化写法，仍被支持。

## 六、写权限控制：RUSH_BUILD_CACHE_WRITE_ALLOWED

缓存的「读」与「写」是分开控制的，这是本页最易错的考点：

- **`rush build`**：**既读又写**缓存（构建完把产物存进缓存）。
- **`rush rebuild`**：既不读、默认也**不写**缓存——它的语义是「不信任缓存、干净重建」。
- **`RUSH_BUILD_CACHE_WRITE_ALLOWED`**：一个 `0` / `1` 开关，**覆盖当前操作是否允许写缓存**。CI 里常把它置 `1`，让一次「本不写缓存的操作」（如 `rush rebuild`）也去**填充**缓存，供后续开发者/流水线命中。

> **为什么要这个开关**：默认策略下 `rush rebuild` 不写缓存，避免「一次可疑的重建污染缓存」；但在**受控的 CI 环境**里，你恰恰希望用干净的 rebuild 产物去填充/刷新云缓存——这时显式开 `RUSH_BUILD_CACHE_WRITE_ALLOWED=1`，把写权限交给可信的 CI，而不放开给随手 rebuild 的开发者。这就是「写权限控制」的用意：**读放开、写收紧到可信来源**。

### Cobuilds（实验）

多台 CI 机器**协同分担同一次构建**（`cobuild.json`），进一步压缩超大仓的 CI 时间。标注实验特性。

## 小结

Rush 的构建加速是三层递进：**增量**（`rush build` 靠 `package-deps-hash` 内容哈希、不看时间戳，「已最新」三条件，状态在 `.rush/temp/`）→ **并行**（`-p` 取整数/百分比/max，选择器 `--to`/`--from` 安全、`--impacted-by`/`--only` unsafe）→ **build cache**（把产物打 tar 存本地或云，缓存键 = 源哈希 + 依赖源哈希 + 依赖版本 + 命令行参数）。写权限是关键治理点：`rush build` 读写、`rush rebuild` 默认不写，用 `RUSH_BUILD_CACHE_WRITE_ALLOWED` 把写权限收紧到可信 CI。加速做完，剩下的是 Rush 的另一招牌——把「发版」也变成受控流程：[受控发布](./publishing)。
