---
layout: doc
---

# pnpm

JavaScript 包管理器（官方标语「**Fast, disk space efficient package manager**」——快、省盘、为 monorepo 而生）。它最大的差异化在两件事：**内容寻址 store（content-addressable store）+ 硬链接**——同一份包文件在磁盘上只存一份，各项目 `node_modules` 通过硬链接复用，「100 个项目用同一依赖也只占一份空间」；以及**符号链接式（非扁平）`node_modules`**——顶层只放直接依赖的符号链接，传递依赖隔离在 `node_modules/.pnpm/` 虚拟 store 里，从结构上**杜绝幽灵依赖（phantom dependency）**。它用 **`pnpm-lock.yaml`**（YAML）锁版本、用独立的 **`pnpm-workspace.yaml`** 定义 monorepo、首创 **catalog（版本目录）** 统一工作区依赖版本，并提供 **`--filter` 选择性执行、`overrides`/`patch`/`deploy`** 等工程化能力。**2026 年现状**：pnpm 主线在 **11.x**（`latest` 约 `11.6.x`），沿用并强化了 **v10 的安全默认**——默认拦截依赖的生命周期/构建脚本（防恶意 postinstall），改用 `allowBuilds` + `pnpm approve-builds` 显式放行；同期 npm 已到 **11.x**、Node 稳定版 **26.x**。新项目选型里，pnpm 因「省盘 + 严格 + monorepo 友好」已成主流首选之一。

## 评价

**优点**

- **省盘是降维打击**：内容寻址 store + 硬链接，跨项目复用同一份文件，依赖更新只增量写差异文件，磁盘占用远小于 npm/Yarn Classic
- **严格防幽灵依赖**：默认非扁平 `node_modules`，顶层只暴露直接依赖，未声明的传递依赖访问不到——把「能跑但不该跑」的隐患在结构层堵死
- **安装快**：命中 store 时「链接」阶段几乎只创建硬链接/符号链接、不复制内容不重下，二次安装与 CI 缓存命中极快，benchmark 长期领先
- **一流 monorepo**：独立的 `pnpm-workspace.yaml`、`workspace:` 协议、`--filter`（含 git 变更过滤 `[origin/main]`）、共享单一锁文件让依赖单例化
- **catalog 版本目录**：在 `pnpm-workspace.yaml` 集中声明版本、各包 `catalog:` 引用，单一事实来源、升级改一处、减少 `package.json` 合并冲突
- **安全默认（v10+）**：默认拦截依赖构建脚本、`allowBuilds`/`approve-builds` 白名单、`minimumReleaseAge` 拦截过新版本、`blockExoticSubdeps` 限制传递依赖来源
- **工程化齐备**：`overrides` 强制版本、`patch`/`patch-commit` 内置打补丁、`packageExtensions` 补破损包声明、`pnpm deploy` 产出自包含部署目录、`pnpm fetch` 优化 Docker 层缓存

**缺点**

- **严格性带来迁移阵痛**：从 npm 迁来常因「幽灵依赖现形」报 `Cannot find module`，需补全 `dependencies`（这其实是在帮你修问题，但有改造成本）
- **少数旧工具假定扁平布局**：个别工具不识别符号链接结构，需 `node-linker=hoisted` 或 `public-hoist-pattern` 定向兜底
- **硬链接受文件系统约束**：store 与项目须在同一文件系统/分区，跨盘退化为复制（或依赖 reflink）
- **配置迁移期概念多**：v10/v11 把大量设置从 `.npmrc` 搬到 `pnpm-workspace.yaml`，`allowBuilds` 取代 `onlyBuiltDependencies` 等，老教程易过时
- **构建脚本默认拦截的学习成本**：首次安装常见「需 approve-builds」提示，不了解会以为装坏了

## 文档地址

[pnpm](https://pnpm.io/)

## GitHub 地址

[pnpm/pnpm](https://github.com/pnpm/pnpm)

## 幻灯片地址

<a href="/SlideStack/pnpm-slide/" target="_blank">pnpm</a>
