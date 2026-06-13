---
layout: doc
---

# npm

**Node.js 的默认包管理器，也是整个 JS 生态的事实基线**。它一词三义：命令行工具（`npm` CLI）、公共仓库（registry，默认 `registry.npmjs.org`，世界上最大的软件仓库）、以及包的格式约定（`package.json` + tarball）。核心职责是**声明、安装、锁定、发布**依赖：`package.json` 用语义化版本范围（`^`/`~`/精确）声明依赖，`package-lock.json` 把每个包的精确版本、来源与完整性哈希**锁死成可复现的依赖树**，`node_modules` 则以**扁平化提升**承载实际文件。**2026-06 现状**：npm 仍随每个 Node.js 一同分发（本文基线 npm 10.x / 11.x），是无需额外安装就能用的最低公分母；pnpm、yarn、bun 在速度、磁盘与严格性上各有超越，但 npm 凭「零安装即用 + 生态默认」稳坐基本盘。一个**务必记准的时效点**：负责管理 npm/yarn/pnpm 版本的 **Corepack**，已被 Node.js TSC 于 **2025-03-19 投票移出发行版**——**Node 25+ 不再内置、Node 26 LTS 也不含，Node 24 及之前仍内置（实验性）**，未来需 `npm i -g corepack` 单独安装。

## 评价

**优点**

- **零安装即用**：随 Node 分发，是任何环境都能假定存在的基线，新人上手成本最低
- **生态最全**：registry 是全球最大软件仓库，几乎所有 JS 包首发于此，文档/教程默认以 npm 为准
- **可复现安装**：`package-lock.json` 固化精确版本树 + `integrity` 哈希，`npm ci` 提供冻结式干净安装
- **依赖类型完备**：dependencies / devDependencies / peerDependencies / optionalDependencies 语义清晰
- **工程能力齐**：内置 workspaces（monorepo）、overrides（钉版本修漏洞）、scripts 生命周期、audit（漏洞扫描）、provenance（来源证明）
- **官方持续投入**：归属 GitHub，安全特性（2FA、provenance、细粒度 token）逐步补齐

**缺点**

- **慢且占盘**：扁平化复制依赖，安装速度与磁盘占用都不及 pnpm（硬链接 + 内容寻址）
- **幽灵依赖**：扁平化提升放任「未声明却能 import」的间接依赖，升级路径一变就崩
- **peer 解析历史包袱**：v7 起自动装 peer，`ERESOLVE` 冲突常逼人用 `--legacy-peer-deps` 绕过
- **无内置多版本/workspace 高级能力**：复杂 monorepo 任务（任务编排、过滤）仍需 Turborepo/Nx 等补位
- **生命周期脚本是攻击面**：`postinstall` 自动执行任意代码，供应链投毒高发，需 `--ignore-scripts` 等防护

## 文档地址

[npm Docs](https://docs.npmjs.com/)

## GitHub 地址

[npm/cli](https://github.com/npm/cli)

## 幻灯片地址

<a href="/SlideStack/npm-slide/" target="_blank">npm</a>
