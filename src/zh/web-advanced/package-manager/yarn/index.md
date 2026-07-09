---
layout: doc
---

# Yarn

JavaScript 包管理器（官方定位「**a package manager that doubles down as project manager**」——既管依赖、也管项目）。Yarn 当前现役主线是 **Modern（4.x，又称 Berry）**，由全新代码库重写：默认启用 **Plug'n'Play（PnP）**——不铺 `node_modules`，而是生成一个加载器文件 `.pnp.cjs` 把模块解析直接指向 `.yarn/cache` 里的 **zip 缓存**，从根上杜绝幽灵依赖、并让安装几乎只是「生成映射」；也可一行 `nodeLinker: node-modules` 退回传统平铺，或用 `nodeLinker: pnpm` 走链接方案。它用 **`.yarnrc.yml`**（YAML）配置、原生支持 **Workspaces + `workspace:` 协议**、提供 **constraints（约束引擎）/ plugins（插件）/ patch:（打补丁）/ zero-installs（缓存随仓库提交）** 等工程化能力，并靠 **Corepack + `packageManager` 字段**按项目锁定版本。**2026 年现状**：Modern 主线在 **4.x**（master 为 `4.16.0-dev`），**Classic 1.22.x 已冻结、仅收安全补丁**；同期 npm 已到 **11.x**、Node 稳定版 **26.x**。

## 评价

**优点**

- **Plug'n'Play 极致严格**：去掉 `node_modules`，用 `.pnp.cjs` 映射 + zip 缓存，安装快、启动解析确定，且从解析层杜绝幽灵依赖
- **linker 可切换**：`pnp`（默认）/ `node-modules`（兼容传统）/ `pnpm`（链接 + 内容寻址）三选一，迁移与兼容有退路
- **一流的 Workspaces**：原生 monorepo 支持，`workspace:` 协议、`workspaces foreach`、`workspaces focus` 聚焦安装齐备
- **工程化能力丰富**：constraints 约束（JS 编写，「monorepo 的 ESLint」）、patch: 打补丁、plugins 插件、zero-installs 零安装
- **版本治理省心**：Corepack + `packageManager` 字段按项目锁定 Yarn 版本，团队与 CI 完全一致
- **可重现与安全**：`yarn.lock` 锁精确版本 + 校验值，`--immutable`（对标 `npm ci`）、`checksumBehavior: throw` 默认拦截篡改

**缺点**

- **PnP 兼容成本**：少数不识别 PnP 的工具链（如 React Native/Expo 仍需 `node_modules`）、历史包的幽灵依赖会集中爆发，迁移需逐个 `packageExtensions` 补声明
- **编辑器需配 SDK**：PnP 下 VS Code/TS Server 默认不识别，需 `@yarnpkg/sdks` 生成 `.yarn/sdks` 垫片
- **与 Classic 不兼容**：4.x 是重写，命令（`upgrade`→`up`、`audit`→`npm audit`、移除 `global`）、配置（`.yarnrc`→`.yarnrc.yml`）大量变化，老教程易误导
- **概念门槛高**：PnP、linker、协议、约束、zero-installs 一套新心智模型，初学比 npm 陡
- **生态默认仍偏 npm/pnpm**：许多脚手架默认 npm，PnP 的「非主流」偶尔带来踩坑成本

## 文档地址

[Yarn](https://yarnpkg.com/)

## GitHub 地址

[yarnpkg/berry](https://github.com/yarnpkg/berry)

## 幻灯片地址

<a href="/SlideStack/yarn-slide/" target="_blank">Yarn</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=yarn" target="_blank" rel="noopener noreferrer">Yarn 测试题</a>
