---
layout: doc
outline: [2, 3]
---

# 入门

> 版本基线 **npm 10.x / 11.x**（随 Node.js 20+ 分发）。涉及版本演变（peer 自动安装、lockfileVersion、Corepack 移出发行版）处均显式标注。

## 速查

- npm 一词三义：**CLI 工具** + **公共 registry** + **包格式（package.json + tarball）**
- 初始化：`npm init -y`（用默认值生成 `package.json`，跳过交互）
- 安装依赖：`npm i <pkg>`（默认 `--save` 进 `dependencies`）｜ `-D` 进 devDependencies
- 复现安装：开发用 `npm install`，**CI/部署用 `npm ci`**（冻结、删 node_modules、不一致即报错）
- 版本范围：`^1.2.3`（锁主版本，`<2.0.0`）｜ `~1.2.3`（锁次版本，`<1.3.0`）｜ `1.2.3`（精确）
- 三个产物：`package.json`（声明）→ `package-lock.json`（锁定，**提交**）→ `node_modules`（**忽略**）
- 跑脚本：`npm run <name>`；`test`/`start` 等内置名可简写为 `npm test`
- 临时执行包命令：`npx <pkg>`（本地优先、否则临时拉取），如 `npx create-vite@latest`
- ⚠️ **Corepack 时效**：Node 25+ 不再内置（2025-03 TSC 投票），Node 24 及之前仍内置（实验性）

## 一、npm 是什么

npm 不是单一工具，而是三件事的合称：

1. **CLI 命令行工具**：随 Node.js 一起装好的 `npm` 命令，负责安装、运行脚本、发布等。
2. **公共 registry**：默认指向 `registry.npmjs.org`——世界上最大的开源软件仓库，绝大多数 JS 包都发布在此。
3. **包格式约定**：一个「包」就是含 `package.json` 的目录，发布时打成 tarball（`.tgz`）上传。

> 关键定位：npm 是**事实上的基线**。它随每个 Node.js 分发，无需额外安装，是任何 JS 项目都能假定存在的最低公分母。pnpm/yarn/bun 在它之上做优化，但默认教程、CI 模板、文档示例几乎都以 npm 为准。

## 二、初始化与第一个 package.json

```bash
mkdir my-pkg && cd my-pkg
npm init -y          # 用默认值直接生成 package.json
```

生成的 `package.json` 雏形：

```json
{
  "name": "my-pkg",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "license": "ISC"
}
```

> 发布到 registry 时，**`name` 与 `version` 是必填**——官方原文：「the most important things in your package.json are the name and version fields as they will be required.」`name` 须为 URL 安全的小写串（≤214 字符），`version` 须能被 node-semver 解析。

## 三、安装依赖：四种类型

```bash
npm i lodash              # → dependencies（默认带 --save）
npm i -D vitest           # → devDependencies（开发/测试/构建期）
npm i -O fsevents         # → optionalDependencies（装失败不阻断）
npm i --save-peer react   # → peerDependencies（由使用方提供）
```

| 字段 | 何时需要 | 被下游安装时是否传递 |
|---|---|---|
| `dependencies` | **运行时**必需 | **是** |
| `devDependencies` | 仅**开发/测试/构建**期 | 否 |
| `peerDependencies` | 与**宿主共享**的库（插件场景） | 由使用方装 |
| `optionalDependencies` | 可选（如平台相关原生包） | 是，但失败不阻断 |

> 自 npm 5 起，`npm i <pkg>` **默认 `--save`**，会写进 `dependencies` 并以 `^` 范围记录。不想写入用 `--no-save`。

## 四、三个核心产物

```text
package.json ──声明依赖范围(^/~)──▶ npm install ──解析──▶ package-lock.json ──▶ node_modules
   (提交)                                              (锁定精确版本，提交)      (忽略，可重建)
```

- **`package.json`**：你**声明**需要哪些依赖、什么范围（如 `"react": "^19.0.0"`）。
- **`package-lock.json`**：npm 把范围**解析成的精确结果**——每个包的确切版本、来源 URL（`resolved`）、完整性哈希（`integrity`）与整棵树，**必须提交**以保证可复现。
- **`node_modules`**：实际下载的文件，体积大、可由前两者重建，**加入 `.gitignore` 不提交**。

## 五、语义化版本范围

版本号是 `MAJOR.MINOR.PATCH`：破坏性变更升 MAJOR、向后兼容新功能升 MINOR、向后兼容修复升 PATCH。范围符决定 npm 能自动升到哪：

| 写法 | 含义 | 等价范围 |
|---|---|---|
| `^1.2.3` | 锁 **MAJOR**，放行 minor+patch（npm 默认） | `>=1.2.3 <2.0.0` |
| `~1.2.3` | 锁 **MINOR**，只放行 patch | `>=1.2.3 <1.3.0` |
| `1.2.3` | **精确**版本 | `=1.2.3` |
| `*` / `x` | 任意版本 | 不限 |

> ⚠️ `^` 对 `0.x` 行为特殊：`^0.2.3` = `>=0.2.3 <0.3.0`（0.x 时把次版本当主版本看，更保守）。这是 SemVer 对「不稳定 0.x」的约定，详见[基础篇](./guide-line/base)。

## 六、install vs ci

```bash
npm install     # 开发用：按 package.json 解析，按需更新 lockfile
npm ci          # CI/部署用：严格按 lockfile 装，冻结、可复现
```

- `npm install`：会读写 `package-lock.json`，范围内可解析到新版本，灵活但结果可能漂移。
- `npm ci`：**必须有 lockfile**；先**删 `node_modules`**；lockfile 与 package.json **不一致即报错**；**绝不写** lockfile。这正是 CI 要可复现的理想选择。

## 七、运行脚本与 npx

```bash
npm run build        # 跑 scripts.build
npm test             # test 是内置名，可省略 run
npx create-vite@latest my-app   # 临时执行远程包命令，免全局安装
```

> `npm run X` 会自动按 **`preX` → `X` → `postX`** 顺序执行同名钩子。`npx` 解析顺序：先找本地 `node_modules/.bin`，找不到再临时拉取到缓存执行。

---

掌握基本安装后，进入 [指南 · 基础](./guide-line/base)：package.json 核心字段、SemVer 与范围细节、lockfile 与可复现、scripts 生命周期。
