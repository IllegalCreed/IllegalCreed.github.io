---
layout: doc
outline: [2, 3]
---

# 参考

> 版本基线 **pnpm 11.x**（`latest`，2026-06）。命令、协议、配置字段与版本现状速查。

## CLI 速查

```bash
pnpm install                      # 装齐 package.json 全部依赖
pnpm install --frozen-lockfile    # CI：严格按锁文件，不一致即失败
pnpm add <pkg>                    # 加生产依赖（-D 开发 / -g 全局 / -E 精确）
pnpm add --save-peer <pkg>        # 加 peer 依赖
pnpm remove <pkg>                 # 移除依赖
pnpm update [pkg]                 # 升级依赖（-L 升到最新、忽略范围）
pnpm dlx <pkg>                    # 临时拉取执行（别名 pnx，对应 npx）
pnpm exec <cmd>                   # 执行项目内已安装的二进制
pnpm <script>                     # 跑 package.json scripts（run 可省略）
pnpm why <pkg>                    # 为何安装某包（依赖来源溯源）
pnpm outdated                     # 列出可升级的过期包
pnpm dedupe                       # 去重、收敛重复版本
pnpm -r <cmd>                     # 对工作区所有包递归执行
pnpm --filter <sel> <cmd>         # 对选中的工作区包执行
pnpm import                       # 由 package-lock.json/yarn.lock 生成 pnpm-lock.yaml
pnpm store path | status | prune  # store 路径 / 校验 / 清理孤儿
pnpm approve-builds               # 交互批准依赖的构建脚本（写入 allowBuilds）
pnpm patch <pkg>@<ver>            # 打补丁：解压到临时目录供编辑
pnpm patch-commit <dir>           # 生成补丁文件并写入 patchedDependencies
pnpm deploy <dir>                 # 产出自包含部署目录（配 --filter/--prod）
pnpm fetch                        # 仅依锁文件把依赖拉进 store（Docker 缓存层）
```

## 版本协议速查

| 写法 | 含义 | 用在哪 |
|---|---|---|
| `workspace:*` | 本地工作区包，精确版本 | monorepo 本地依赖 |
| `workspace:^` / `workspace:~` | 本地包，发布时转 `^x` / `~x` | monorepo 本地依赖 |
| `catalog:` | 引用默认版本目录（= `catalog:default`） | 工作区统一版本 |
| `catalog:<name>` | 引用命名版本目录 | 工作区多版本场景 |
| `npm:<pkg>@<ver>` | 别名安装（装成另一个名字） | 同名多版本 / 重命名 |

> `workspace:` 与 `catalog:` 在**发布时都会被替换成真实版本范围**（如 `workspace:^` → `^1.5.0`、`catalog:` → 目录里的 `^18.2.0`），对外可正常从 registry 解析。

## --filter 选择器速查

```bash
pnpm --filter <pkg> <cmd>            # 精确包名
pnpm --filter "@scope/*" <cmd>       # glob 包名
pnpm --filter "./packages/**" <cmd>  # 按目录
pnpm --filter <pkg>... <cmd>         # 该包 + 其依赖（上游 dependencies）
pnpm --filter ...<pkg> <cmd>         # 该包 + 其依赖方（下游 dependents）
pnpm --filter "<pkg>^..." <cmd>      # 只它的依赖（不含自己）
pnpm --filter "...^<pkg>" <cmd>      # 只它的依赖方（不含自己）
pnpm --filter "[origin/main]" <cmd>      # 自该 git 引用以来改动过的包
pnpm --filter "...[origin/main]" <cmd>   # 改动包 + 受影响的下游（CI 常用）
pnpm --filter=!<pkg> <cmd>           # 排除某包（! 前缀）
```

> 记忆口诀：**`...` 在前 = 带下游（谁依赖我）**；**`...` 在后 = 带上游（我依赖谁）**；`[ref]` = git 变更集。

## 关键配置字段（pnpm-workspace.yaml）

| 字段 | 作用 | 示例值 |
|---|---|---|
| `packages` | 定义工作区成员（glob 列表） | `["packages/*", "apps/*", "!**/test/**"]` |
| `catalog` / `catalogs` | 默认 / 命名版本目录 | `catalog: { react: ^18.2.0 }` |
| `nodeLinker` | node_modules 布局 | `isolated`（默认）/ `hoisted` / `pnp` |
| `overrides` | 强制依赖（含传递）版本 | `{ "lodash": "^4.17.21" }` |
| `peerDependencyRules` | peer 告警/允许版本 | `allowedVersions: { react: "18" }` |
| `packageExtensions` | 给破损包补缺失声明 | 补 `peerDependencies` 等 |
| `allowBuilds` | 允许跑构建脚本的包（v10.26/v11） | `{ esbuild: true, core-js: false }` |
| `publicHoistPattern` | 提升匹配包到顶层 node_modules | `["*eslint*", "@types/*"]` |
| `hoistPattern` | 提升到 `.pnpm/node_modules` | `["*babel*"]` |
| `shamefullyHoist` | 提升全部到顶层（= `publicHoistPattern: *`） | `true` |
| `minimumReleaseAge` | 拒绝安装过新版本（按分钟） | `1440`（1 天） |
| `patchedDependencies` | 补丁登记（`patch-commit` 自动写） | `{ "express@4.18.1": "patches/..." }` |

> ⚠️ **配置迁移**：pnpm 10+ 把大量原 `.npmrc` 设置搬进 `pnpm-workspace.yaml`（顶层即可）；单包项目则写在 `package.json` 的 `pnpm` 字段下。`.npmrc` 仍用于 registry/auth 等。

## nodeLinker 三种布局

| 取值 | 布局 | 适用 |
|---|---|---|
| `isolated`（默认） | 符号链接 + `.pnpm` 虚拟 store，严格非扁平 | 绝大多数项目，防幽灵依赖 |
| `hoisted` | 扁平、无符号链接，近似 npm | 兼容假定扁平结构的旧工具 |
| `pnp` | 无 node_modules，Plug'n'Play | 追求极致严格/快，但需工具适配 |

## 与各工具分工速记

| 任务 | 谁来做 |
|---|---|
| 省盘（跨项目复用） | **pnpm 内容寻址 store + 硬链接**（npm/Yarn Classic 各拷一份） |
| 防幽灵依赖 | **pnpm 默认非扁平** / Yarn PnP（npm 默认扁平易暴露） |
| monorepo 选择性执行 | **pnpm `--filter`** / Turborepo / Nx（任务编排在其上） |
| 统一工作区版本 | **pnpm catalog** / 手工 + `overrides` |
| 临时执行包 | `pnpm dlx`(`pnx`) / `npx` / `yarn dlx` |
| 锁版本一致 | `pnpm-lock.yaml` + `--frozen-lockfile`（≈ `npm ci`） |

## 版本现状（2026-06）

| 项目 | dist-tag | 版本 |
|---|---|---|
| pnpm | `latest` / `latest-11` | **11.6.x**（当前稳定） |
| pnpm | `latest-10` | **10.34.x** |
| npm | `latest` | **11.x** |
| Node.js | 稳定版 | **26.x** |

> 安全里程碑：**v10.0** 默认拦截依赖生命周期脚本；**v10.26/v11** 引入 `allowBuilds`（map）取代 `onlyBuiltDependencies`/`neverBuiltDependencies`/`ignoredBuiltDependencies`，配 `pnpm approve-builds`。详见[专家篇](./guide-line/expert)。
