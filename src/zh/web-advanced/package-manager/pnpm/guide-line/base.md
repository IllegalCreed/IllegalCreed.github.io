---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

> 版本基线 **pnpm 11.x**。本篇把 pnpm「为什么省盘、为什么严格」讲透：内容寻址 store、硬链接、符号链接式 `node_modules` 结构、幽灵依赖原理，以及与 npm 的核心差异。

## 一、内容寻址 store 与硬链接

npm/Yarn Classic 的模型是：**每个项目各拷一份依赖**。「如果有 100 个项目用同一个依赖，磁盘上就有 100 份拷贝。」

pnpm 换了一套模型：

1. 所有包文件按**内容哈希**存进一个**全局内容寻址 store**（content-addressable store），**只存一份**。
2. 安装时，项目 `node_modules` 里的文件是指向 store 的**硬链接**（hard link）——官方：「their files are hard-linked from that single place, consuming no additional disk space.」
3. 依赖更新时按文件粒度增量：「100 个文件里只改了 1 个，`pnpm update` 只往 store 加 1 个新文件，而不是整包克隆一遍。」

```bash
pnpm store path     # 查看全局 store 实际位置
pnpm store status   # 校验 store 中被改动的包
pnpm store prune    # 清理不再被任何项目引用的孤儿包（需要时会重下，安全）
```

> 硬链接让同一物理文件被多处引用：**省盘**（不重复占用），也**省时**（命中 store 时安装只是建链接、不复制内容不重下）。代价：store 与项目须在**同一文件系统/分区**，跨盘会退化为复制。

## 二、符号链接式 node_modules 结构

pnpm 默认（`nodeLinker: isolated`）的 `node_modules` 是**非扁平**的：

```text
node_modules
├── foo -> ./.pnpm/foo@1.0.0/node_modules/foo        # 顶层只放「直接依赖」的符号链接
└── .pnpm                                            # 虚拟 store：平铺所有包（含传递依赖）
    ├── bar@1.0.0/node_modules/bar -> <全局 store>
    └── foo@1.0.0/node_modules
        ├── foo -> <全局 store>                       # 包自身（可 require 自己）
        └── bar -> ../../bar@1.0.0/node_modules/bar  # foo 的依赖 bar：符号链接到同级
```

三个关键点：

- **顶层只暴露直接依赖**：`package.json` 里写了什么，`node_modules` 顶层才有什么的符号链接。
- **所有包平铺在 `.pnpm/`**：按 `node_modules/.pnpm/<name>@<version>/node_modules/<name>` 规律存放，文件全是 store 的硬链接。
- **每个包的依赖放在它同级**：`foo` 的依赖 `bar` 被符号链接到 `foo@1.0.0/node_modules/` 下——这样 `foo` **只能访问到自己声明的 `bar`**，访问不到别的包。

> 这层嵌套结构（`.pnpm/<name>@<ver>/node_modules/<name>`）有两个明确目的：① 让包能 **require 自身**（读自己的 `package.json`）；② 把依赖放同级**避免循环符号链接**，并实现**强隔离**。

## 三、幽灵依赖：pnpm 为什么能防住

**幽灵依赖（phantom dependency）**：代码 `import` 了一个**并未写进自己 `package.json`** 的包。

在 npm 扁平 `node_modules` 里，大量传递依赖被**提升到顶层**，于是这种未声明的包**恰好能 require 到**——代码「能跑」。隐患在于：哪天那个传递依赖被移除、换版本或不再被提升，代码就毫无征兆地崩。

```js
// 你的 package.json 只声明了 axios，没声明 lodash
import _ from "lodash"; // npm 下可能「恰好可用」(axios 的传递依赖被提升)；pnpm 下直接报错
```

pnpm 顶层**只暴露直接依赖**，未声明的传递依赖被隔离在 `.pnpm/.../node_modules/` 里、顶层访问不到，因此**从结构上杜绝幽灵依赖**。

> 迁移真相：从 npm 切到 pnpm 后冒出的 `Cannot find module 'xxx'`，多半不是 pnpm 的 bug，而是**它把你原有的幽灵依赖揪出来了**。正解是把 `xxx` **补进该包的 `dependencies`**（详见[进阶篇](./advanced)）。

## 四、和 npm / Yarn 的核心差异

| 维度 | npm | pnpm | Yarn Berry (PnP) |
|---|---|---|---|
| 磁盘 | 每项目各拷一份 | **全局 store + 硬链接复用** | zip 缓存（可 zero-install） |
| node_modules | 扁平提升 | **符号链接非扁平** | **无**（`.pnp.cjs` 接管解析） |
| 幽灵依赖 | 易暴露 | **结构上杜绝** | 杜绝 |
| 锁文件 | `package-lock.json` | `pnpm-lock.yaml` | `yarn.lock` |
| 工作区定义 | `package.json` 的 `workspaces` | **`pnpm-workspace.yaml`** | `package.json` 的 `workspaces` |
| 临时执行 | `npx` | `pnpm dlx` / `pnx` | `yarn dlx` |
| CI 严格安装 | `npm ci` | `pnpm install --frozen-lockfile` | `yarn install --immutable` |

> pnpm 也提供 `nodeLinker: pnp` 这种「无 node_modules」的可选模式，但**默认是符号链接式 node_modules**，走 Node 标准模块解析、兼容性最好。

## 五、安装与缓存表现

- **首次安装**：解析依赖 → 下载到 store → 计算 `node_modules` 结构 → 从 store 硬链接到项目。
- **二次/CI 安装**：包已在 store 中，跳过下载，只建链接，**极快**。
- **省盘**：N 个项目共用一份 store，依赖越多、项目越多，相对 npm 的优势越大。

```bash
# 直观对比：装同样的依赖，pnpm 的 node_modules 几乎不额外占盘（硬链接）
du -sh node_modules      # pnpm 项目通常远小于等价 npm 项目的实占
```

---

进入 [指南 · 进阶](./advanced)：monorepo（`pnpm-workspace.yaml` + `workspace:` 协议）、`--filter` 选择性执行、catalog 版本目录、CI 与 `--frozen-lockfile` 实践。
