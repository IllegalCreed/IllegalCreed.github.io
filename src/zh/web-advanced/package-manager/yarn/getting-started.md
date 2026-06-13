---
layout: doc
outline: [2, 3]
---

# 入门

> 版本基线 **Yarn Modern 4.x**（master 为 `4.16.0-dev`）。**Classic 1.22.x 已冻结**，仅收安全补丁。涉及 1.x → 4.x 差异处均显式标注，详见[专家篇](./guide-line/expert)。2026-06 同期：npm **11.x**、Node 稳定版 **26.x**。

## 速查

- 启用：`corepack enable`（Corepack 是 Node 自带的包管理器版本管理器）
- 新项目：`yarn init -2`（直接初始化为 Modern）｜ 老项目升级：`yarn set version berry`
- 锁版本：`package.json` 写 `"packageManager": "yarn@4.6.0"`，团队/CI 自动用同一版本
- 配置文件：**`.yarnrc.yml`**（YAML，唯一）——`.yarnrc`（Classic）、`.npmrc` 都被忽略
- 安装：裸 `yarn`（= `yarn install`）按 `package.json` + `yarn.lock` 还原依赖树
- 加依赖：`yarn add <pkg>`（`-D` 开发依赖、`-P` peer）；升级：`yarn up <pkg>`；移除：`yarn remove`
- 临时执行：`yarn dlx <pkg>`（对标 `npx`，用完即弃）；查来源：`yarn why <pkg>`
- ⚠️ 默认 **PnP**（无 `node_modules`）；要传统目录设 `nodeLinker: node-modules`
- ⚠️ CI 安装用 `yarn install --immutable`（对标 `npm ci`，lock 被改即报错）

## 一、Yarn 是什么

官方定位：「**a package manager that doubles down as project manager**」——它不仅装依赖，还把工作区、约束、补丁、版本工作流等「项目管理」能力一并纳入。与多数包管理器把非安装命令甩给 npm 不同，Yarn **重新实现了所有命令**，以完全掌控开发体验与稳定性。

现役主线是 **Modern（4.x / Berry）**，由全新代码库重写；**Classic（1.22.x）已冻结**，文档迁到 classic.yarnpkg.com，仅接受关键安全补丁。

> 关键心智：Modern 默认 **Plug'n'Play**——不生成 `node_modules`，而用 `.pnp.cjs` 加载器把模块解析直接指向 `.yarn/cache` 的 zip 包。这套和 npm/pnpm 的「铺目录」模型不同，是理解 Yarn 4 的钥匙。

## 二、安装与启用（Corepack）

Yarn 4 推荐用 **Corepack** 管理：它据项目 `packageManager` 字段自动调用对应版本的 Yarn。

```bash
# 开启 Corepack（Node 16.10+ 自带；若被禁用则手动开）
corepack enable

# 新建一个 Modern 项目
mkdir my-app && cd my-app
yarn init -2
```

`yarn init -2` 会写好 `.yarnrc.yml`、把 Yarn 锁到当前 Modern 版本，并在 `package.json` 写入：

```json
{
  "packageManager": "yarn@4.6.0"
}
```

> 这一行是团队一致性的关键：任何人 clone 后，只要开了 Corepack，在该项目里跑 `yarn` 就会自动用 4.6.0，无需各自全局安装特定版本。

## 三、第一次安装与添加依赖

```bash
yarn                 # = yarn install，按 package.json + yarn.lock 还原依赖树
yarn add lodash      # 加生产依赖
yarn add -D vitest   # 加开发依赖（-D）
yarn add -P react    # 加 peer 依赖（-P）
yarn remove lodash   # 移除依赖
yarn up lodash       # 升级依赖（范围内升到最新；可跨工作区统一）
```

安装产物取决于 `nodeLinker`：**默认 PnP** 生成 `.pnp.cjs` + `.yarn/cache`（无 `node_modules`）；若设为 `node-modules` 则像 npm 一样铺目录。

## 四、PnP 还是 node_modules？

Modern 默认 **PnP**，但**可一行退回**传统目录。在 `.yarnrc.yml`：

```yaml
# 退回传统 node_modules（兼容性最好，迁移期常用）
nodeLinker: node-modules
```

| linker | 产物 | 特点 |
|---|---|---|
| `pnp`（默认） | `.pnp.cjs` + zip 缓存 | 无 `node_modules`，最严格最快，少数工具需适配 |
| `node-modules` | 传统 `node_modules` | 像 npm/Classic，兼容性最好 |
| `pnpm` | 链接式 `node_modules` | 符号/硬链接 + 全局内容寻址仓库，近 pnpm |

> 新项目能接受少量适配成本就用 PnP；要快速接入大量历史依赖、或用 React Native/Expo，先用 `node-modules` 起步，详见[进阶篇](./guide-line/advanced)。

## 五、常用命令一览

```bash
yarn dlx create-vite    # 临时下载并运行脚手架（对标 npx，用完即弃）
yarn why lodash         # 解释 lodash 为何被安装、谁引入了它
yarn dedupe             # 合并范围重叠的重复依赖
yarn workspaces foreach -A run build   # 所有工作区批量跑 build
yarn node script.js     # 带 PnP 钩子运行 node（PnP 下直接 node 会找不到模块）
yarn install --immutable   # CI 安装：lock 若被改动则报错（对标 npm ci）
```

> ⚠️ 三个高频差异：① Classic 的 `yarn upgrade` 在 Modern 叫 **`yarn up`**；② `yarn audit` → **`yarn npm audit`**；③ Modern **移除了 `yarn global`**，一次性执行改用 `yarn dlx`。

---

掌握基本安装后，进入 [指南 · 基础](./guide-line/base)：Classic vs Berry、`yarn.lock`、`.yarnrc.yml` 与 `nodeLinker`、Workspaces 与 `workspace:` 协议。
