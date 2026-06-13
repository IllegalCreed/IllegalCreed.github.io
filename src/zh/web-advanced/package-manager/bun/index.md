---
layout: doc
---

# Bun（包管理器）

::: tip 本篇范围
本篇聚焦 **Bun 的「包管理器」角色**（`bun install` / `bun pm`）——即作为 npm / pnpm / yarn 的高速替代。Bun 同时还是运行时、打包器、测试运行器，那部分内容见「后端框架 > Bun」，这里只在对比与定位时一笔带过。
:::

Bun 是用 Zig 写的 all-in-one JavaScript 工具箱，其中的包管理器被官方定位为「**a Node.js-compatible package manager designed to be a dramatically faster replacement for `npm`, `yarn`, and `pnpm`**」。它是个**独立工具**：哪怕你的项目仍用 Node.js 运行、用 Vite 打包，只要有 `package.json`，把 `npm install` 换成 `bun install` 就能把装依赖的速度提到**官方称的约 25 倍**。它读标准 `package.json`、写标准 `node_modules`、兼容 `.npmrc`，几乎零迁移成本。

速度来自三件事叠加：① 一个**全局共享缓存**（`~/.bun/install/cache`），同一个包永不重复下载；② 用 **OS 级快速文件复制**把缓存物化到 `node_modules`——macOS 默认 `clonefile`（写时复制）、Linux 默认 `hardlink`（硬链接），避免逐字节拷贝；③ Zig 原生实现 + 高并发网络。**2026 年的现状**：锁文件已从二进制 `bun.lockb` 全面转为**文本 `bun.lock`（JSONC）**（Bun 1.2 起默认）；新建 monorepo 默认采用 **isolated installs**（pnpm 式严格隔离）；并默认**不执行依赖的生命周期脚本**（`trustedDependencies` 安全模型）。

## 评价

**优点**

- **极快的安装**：全局缓存 + `clonefile`/`hardlink` 物化，官方称比 npm 快约 25×，缓存命中的二次安装近乎瞬时
- **零迁移成本**：读写标准 `package.json` / `node_modules`，兼容 `.npmrc`，现有 Node 项目直接可用
- **文本锁文件 `bun.lock`**：JSONC 格式，PR 能看 diff、合并冲突好解、Dependabot 等工具能接入
- **isolated installs**：可选 pnpm 式中心 store + symlink，杜绝「幻影依赖」；新建 monorepo 默认开启
- **供应链安全默认**：默认不跑依赖的 `postinstall` 等脚本，需 `trustedDependencies` 显式放行；还支持 `minimumReleaseAge` 时间闸门
- **monorepo 友好**：原生 `workspaces` + `workspace:` 协议 + catalog 版本目录 + `--filter` 跨工作区（拓扑序）跑脚本
- **一体化命令**：`bun add/remove/update/outdated/patch/link/ci` + `bun pm` 工具族 + `bunx`，无需额外装工具

**缺点**

- **生态成熟度仍在追赶**：相比 npm/pnpm，边缘场景与企业级私有源工具链的兼容偶有坑
- **「运行时 Bun」与「包管理器 Bun」常被混为一谈**：很多人以为用 `bun install` 就必须用 Bun 跑代码，其实两者解耦
- **默认行为差异需注意**：默认装 peerDependencies、默认不跑依赖脚本，与 npm 习惯不同，迁移时要心里有数
- **双锁文件风险**：与 npm 混用时若同时提交 `bun.lock` 和 `package-lock.json`，易产生不一致——应择一为单一事实来源
- **isolated 与某些依赖的兼容**：少数假设扁平 `node_modules` 的老包在严格隔离下可能需调整

## 文档地址

[Bun Package Manager](https://bun.com/docs/pm/cli/install)

## GitHub 地址

[oven-sh/bun](https://github.com/oven-sh/bun)

## 幻灯片地址

<a href="/SlideStack/bun-slide/" target="_blank">Bun（包管理器）</a>
