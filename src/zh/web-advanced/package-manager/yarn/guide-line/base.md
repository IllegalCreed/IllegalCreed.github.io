---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

> 版本基线 **Yarn Modern 4.x**。本篇把「能装」用到「会用」：Classic vs Berry、`yarn.lock`、`.yarnrc.yml` 与 `nodeLinker`、Workspaces 与 `workspace:` 协议、Corepack 版本锁定。

## 一、Classic（1.x）vs Berry（4.x）

Yarn 有两条代际，**心智模型不同**，混用老教程是头号踩坑源：

| 维度 | Classic 1.22.x | Modern 4.x（Berry） |
|---|---|---|
| 状态 | **冻结**（仅安全补丁） | **现役主线**（活跃迭代） |
| 默认装法 | 平铺 `node_modules` | **PnP**（`.pnp.cjs` + zip 缓存） |
| 配置文件 | `.yarnrc`（INI） | **`.yarnrc.yml`**（YAML） |
| 安装命令族 | 部分甩给 npm | **全部自研重写** |
| 典型命令 | `yarn upgrade`/`yarn global` | `yarn up`/`yarn dlx`（已移除 global） |

> 一句话：网上「`.yarnrc` 里写 registry」「`yarn global add`」之类十有八九是 Classic 内容，到 4.x 不适用。认准 yarnpkg.com（Modern）为准。

## 二、yarn.lock：可重现的基石

`yarn.lock` 记录每个依赖**最终解析到的精确版本、下载地址、完整性校验值（checksum）**，把 `package.json` 里的「范围」固化成「确定结果」：

```text
"lodash@npm:^4.17.0":
  version: 4.17.21
  resolution: "lodash@npm:4.17.21"
  checksum: ...
```

- **要提交进版本库**：保证团队/CI 拿到完全相同的依赖树。
- **由 Yarn 自动维护**：别手改；要变更走 `yarn add/up/remove`。
- **含传递依赖**：锁的是整棵依赖树，不只直接依赖。

> CI 用 `yarn install --immutable`：若安装会改动 lock（说明 lock 与 package.json 不一致），直接报错退出——这就是 Yarn 版的 `npm ci`。

## 三、.yarnrc.yml 与 nodeLinker

Modern 的唯一配置文件是 **`.yarnrc.yml`**（YAML）。最关键的一项是 `nodeLinker`：

```yaml
# .yarnrc.yml
nodeLinker: node-modules   # 退回传统 node_modules
# nodeLinker: pnp          # 默认：无 node_modules，用 .pnp.cjs
# nodeLinker: pnpm         # 链接式 node_modules（近 pnpm）
```

| linker | 产物 | 何时用 |
|---|---|---|
| `pnp`（默认） | `.pnp.cjs` + `.yarn/cache` | 新项目、追求严格与速度 |
| `node-modules` | 传统 `node_modules` | 迁移期、依赖大量历史包、RN/Expo |
| `pnpm` | 链接式 `node_modules` | 想要 pnpm 式隔离又留目录 |

> Classic 的 `.yarnrc`、npm 的 `.npmrc` 在 Modern 下**都被忽略**。registry 改用 `npmRegistryServer`，token 改用 `npmAuthToken`。

## 四、Workspaces：原生 monorepo

在根 `package.json` 声明工作区（glob 数组）：

```json
{
  "private": true,
  "workspaces": ["packages/*", "apps/*"]
}
```

Yarn 会把这些目录识别为工作区、**统一安装并相互链接**。常用命令：

```bash
yarn workspace @org/app add react       # 给指定工作区加依赖
yarn workspace @org/app run build        # 在指定工作区跑脚本
yarn workspaces foreach -A run lint       # 所有工作区跑 lint
yarn workspaces foreach -A -pt run build  # 并行(-p)+拓扑序(-t)
yarn workspaces foreach --since run test  # 只跑变更过的工作区
```

> Yarn 是最早提供原生 workspaces 的包管理器；`foreach` 的 `-t`（拓扑序）能保证「先构建被依赖、再构建依赖方」。

## 五、workspace: 协议

工作区之间互相依赖，**别写普通 semver**（可能去 registry 找），要用 `workspace:` 协议：

```json
{
  "dependencies": {
    "@org/utils": "workspace:^"
  }
}
```

- 开发时：始终解析到**本仓库**的 `@org/utils` 源码。
- 发布时：`workspace:^` 自动替换为发布版本对应的 `^x.y.z`，`workspace:*` 替换为精确版本。

## 六、Corepack 锁定版本

```bash
corepack enable                 # 开启 Corepack（Node 自带）
yarn set version 4.6.0          # 把项目 Yarn 锁到 4.6.0
```

`yarn set version` 会写入 `package.json` 的 `packageManager: "yarn@4.6.0"`。此后任何人在该项目跑 `yarn`，Corepack 都自动用 4.6.0，**团队与 CI 零版本漂移**。

---

进入 [指南 · 进阶](./advanced)：PnP 原理与 zip 缓存、zero-installs、`yarn dlx`/`up`/`why`、协议（patch/portal/link）、迁移 Classic→Berry。
