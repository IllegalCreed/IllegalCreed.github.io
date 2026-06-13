---
layout: doc
outline: [2, 3]
---

# 参考

> 版本基线 **Yarn Modern 4.x**。CLI、`.yarnrc.yml` 配置、协议、命令重命名与版本现状速查。

## CLI 速查（Modern 4.x）

```bash
yarn                       # = yarn install，按 lock 还原依赖树
yarn add <pkg>             # 加依赖（-D 开发、-P peer）
yarn up <pkg>              # 升级依赖（Classic 的 yarn upgrade）
yarn remove <pkg>          # 移除依赖
yarn dlx <pkg>             # 临时下载并运行（对标 npx）
yarn why <pkg>             # 谁引入了这个包
yarn dedupe                # 合并范围重叠的重复依赖
yarn set version 4.6.0     # 锁定项目 Yarn 版本（stable/canary 亦可）
yarn config get/set <k>    # 读写 .yarnrc.yml 配置
yarn workspace <名> run x  # 在指定工作区跑脚本
yarn workspaces foreach -A -pt run build   # 全工作区并行+拓扑序跑 build
yarn workspaces focus <名> # 聚焦安装：只装该工作区依赖链
yarn npm publish           # 发布工作区到 registry（Classic 的 yarn publish）
yarn npm audit             # 安全审计（Classic 的 yarn audit）
yarn patch <pkg>           # 给依赖打补丁（配 patch-commit）
yarn constraints [--fix]   # 检查/修复项目约束
yarn node <file>           # 带 PnP 钩子运行 node
yarn install --immutable   # CI 安装：lock 不可变（对标 npm ci）
```

## .yarnrc.yml 核心配置

| 配置项 | 作用 |
|---|---|
| `nodeLinker` | 安装方式：`pnp`（默认）/ `node-modules` / `pnpm` |
| `enableGlobalCache` | 默认 `true`（全局共享缓存）；zero-installs 需设 `false` 用项目内缓存 |
| `pnpMode` | PnP 严格度：`strict`（默认，只许显式依赖）/ `loose`（放宽提升可达） |
| `npmRegistryServer` | registry 地址（替代 Classic 的 registry，须 HTTPS） |
| `npmAuthToken` | registry 鉴权 token（替代旧 `_authToken`） |
| `packageExtensions` | 给第三方包补缺失的 deps/peerDeps（修幽灵依赖，不改原包） |
| `nmHoistingLimits` | node-modules linker 下的提升边界（替代 Classic 的 `nohoist`） |
| `supportedArchitectures` | 要安装的目标 OS/CPU/libc 组合（多平台预取原生包） |
| `yarnPath` | 指定项目专用 Yarn 二进制（from-sources 时用） |
| `enableImmutableInstalls` | 等价 `--immutable`：禁止安装改动 lock |
| `checksumBehavior` | 校验不符时：`throw`（默认）/ `update` / `reset` / `ignore` |

## 协议速查

| 协议 | 用途 |
|---|---|
| `workspace:` | 引用同仓库工作区（`workspace:^` 发布时替换为版本范围） |
| `npm:` | 从 registry 安装（默认协议）；也可做别名 `a@npm:b` |
| `patch:` | 引用打过补丁的包（`pkg@patch:pkg@1.0.0#./x.patch`） |
| `portal:` | 软链本地包，**解析其依赖与 peer**（像真实安装） |
| `link:` | 软链本地目录，**不处理被链包依赖**（纯代码目录） |
| `file:` | 指向本地文件/目录的依赖 |
| `git:` / `github:` | 从 Git 仓库安装 |
| `exec:` | 执行脚本来动态产出包内容（实验性） |

## 命令重命名（Classic → Modern）

| Classic | Modern |
|---|---|
| `yarn upgrade` | `yarn up` |
| `yarn audit` | `yarn npm audit` |
| `yarn publish` | `yarn npm publish` |
| `yarn global add` | （移除）→ 一次性执行用 `yarn dlx` |
| `yarn check` / `import` / `licenses` | 移除 |

## zero-installs 的 .gitignore

```gitignore
.yarn/*
!.yarn/cache
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/sdks
!.yarn/versions
```

> 思路：先忽略 `.yarn/*`，再用 `!` 白名单放行需提交的子目录；同时忽略 `node_modules`。提交 `.yarn/cache` + `.pnp.cjs` 即可做到切分支免 install。

## 与 npm / pnpm 分工速记

| 维度 | Yarn 4 | npm | pnpm |
|---|---|---|---|
| 默认装法 | PnP（无 node_modules） | 平铺 node_modules | 链接式 node_modules |
| 锁文件 | `yarn.lock` | `package-lock.json` | `pnpm-lock.yaml` |
| 幽灵依赖 | PnP 严格杜绝 | 易出现（提升） | 隔离杜绝 |
| 临时执行 | `yarn dlx` | `npx` | `pnpm dlx` |
| CI 不可变 | `--immutable` | `npm ci` | `--frozen-lockfile` |

## 版本现状（2026-06）

| 项 | 状态 |
|---|---|
| Yarn Modern | **4.x**（master `4.16.0-dev`，活跃主线） |
| Yarn Classic | **1.22.x**（**冻结，仅安全补丁**） |
| npm | **11.x**（随 Node 分发） |
| Node 稳定版 | **26.x** |
