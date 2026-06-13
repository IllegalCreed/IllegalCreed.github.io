---
layout: doc
outline: [2, 3]
---

# 入门

> 版本基线 **pnpm 11.x**（`latest` 约 `11.6.x`，2026-06）。pnpm 沿用 v10 的「安全默认」：默认拦截依赖构建脚本，详见[专家篇](./guide-line/expert)。同期 npm 为 **11.x**、Node 稳定版 **26.x**。

## 速查

- 安装：`npm i -g pnpm@latest-11` ｜ `corepack enable pnpm` ｜ `curl -fsSL https://get.pnpm.io/install.sh | sh -`
- 加依赖：`pnpm add <pkg>`（`-D` 开发 / `-g` 全局 / `-E` 精确版本）；装齐全部：`pnpm install`
- 临时跑：`pnpm dlx <pkg>`（v11 起别名 `pnx`，对应 `npx`）
- 核心认知一：**内容寻址 store + 硬链接** → 跨项目省盘、命中即快
- 核心认知二：**符号链接式非扁平 `node_modules`** → 顶层只放直接依赖 → **防幽灵依赖**
- 锁文件 `pnpm-lock.yaml`（提交）；monorepo 定义在 **`pnpm-workspace.yaml`**（独立文件，非 package.json）
- ⚠️ CI 用 `pnpm install --frozen-lockfile`：锁文件与 `package.json` 不一致即失败
- ⚠️ 安装报「构建脚本需批准」是 v10+ 安全默认，用 `pnpm approve-builds` 放行，**不是装坏了**
- ⚠️ 迁移后报 `Cannot find module`：多半是原有幽灵依赖现形，**把它补进 `dependencies`**

## 一、pnpm 是什么

官方标语：「**Fast, disk space efficient package manager.**」它和 npm/Yarn 一样装包、跑脚本、管 monorepo，但底层用两套独特机制带来「省盘 + 严格 + 快」：

1. **内容寻址 store + 硬链接**：所有包文件按内容哈希存进一个**全局 store**（只存一份），项目 `node_modules` 里的文件是指向 store 的**硬链接**。官方原话：「their files are hard-linked from that single place, consuming no additional disk space.」依赖更新时只增量写改动的文件，而非整包重拷。
2. **符号链接式非扁平 `node_modules`**：顶层 `node_modules` 只放**直接依赖的符号链接**，所有包（含传递依赖）平铺在 `node_modules/.pnpm/` 这个虚拟 store 里。

> 关键收益：**防幽灵依赖**。幽灵依赖 = 代码 `import` 了一个没写进自己 `package.json` 的包，却因 npm 扁平提升而恰好可用。pnpm 顶层只暴露直接依赖，未声明的包访问不到，从结构上堵死这类隐患。

## 二、安装 pnpm

```bash
# 方式一：npm 全局装（最直接）
npm install -g pnpm@latest-11

# 方式二：Corepack（Node 自带，按项目锁版本）
npm install --global corepack@latest   # 2025 起 corepack 签名问题，先更新
corepack enable pnpm

# 方式三：独立脚本（POSIX）
curl -fsSL https://get.pnpm.io/install.sh | sh -

# 方式四：包管理器
brew install pnpm        # macOS
```

> 团队/CI 锁版本推荐在 `package.json` 写 `"packageManager": "pnpm@11.6.0"`，配合 Corepack 自动调用对应版本，保证全员一致。

## 三、最常用命令（对照 npm）

| 任务 | pnpm | npm |
|---|---|---|
| 安装全部依赖 | `pnpm install` | `npm install` |
| 加生产依赖 | `pnpm add <pkg>` | `npm i <pkg>` |
| 加开发依赖 | `pnpm add -D <pkg>` | `npm i -D <pkg>` |
| 移除依赖 | `pnpm remove <pkg>` | `npm uninstall <pkg>` |
| 跑脚本 | `pnpm <script>` / `pnpm run <script>` | `npm run <script>` |
| 临时执行包 | `pnpm dlx <pkg>` / `pnx` | `npx <pkg>` |
| 为何安装某包 | `pnpm why <pkg>` | `npm explain <pkg>` |
| CI 严格安装 | `pnpm install --frozen-lockfile` | `npm ci` |

> ⚠️ 与 npm 不同，**pnpm 会校验所有选项**（`Unlike npm, pnpm validates all options`），写错的 flag 会直接报错，而不是被悄悄忽略。

## 四、第一个项目

```bash
mkdir my-app && cd my-app
pnpm init                 # 生成 package.json
pnpm add lodash-es        # 加依赖
pnpm add -D typescript    # 加开发依赖
```

看一眼此时的 `node_modules`（pnpm 默认布局）：

```text
node_modules
├── lodash-es -> ./.pnpm/lodash-es@4.17.21/node_modules/lodash-es   # 直接依赖：符号链接
├── typescript -> ./.pnpm/typescript@5.x/node_modules/typescript    # 直接依赖：符号链接
└── .pnpm/                                                          # 虚拟 store：平铺所有包
    ├── lodash-es@4.17.21/node_modules/lodash-es -> <全局 store 硬链接>
    └── typescript@5.x/node_modules/typescript   -> <全局 store 硬链接>
```

> 注意顶层**只有你声明的两个包**，看不到它们的子依赖——这正是「防幽灵依赖」的直观体现。

## 五、锁文件与可复现安装

- pnpm 用 **`pnpm-lock.yaml`**（YAML）记录精确版本与完整性哈希，**必须提交**到版本库。
- 本地开发 `pnpm install`（无参）会按 `package.json` 安装，必要时更新锁文件。
- CI 一律加 **`--frozen-lockfile`**：严格按锁文件装、**不改锁文件**，若锁文件与 `package.json` 不一致则**直接失败退出**——强制二者同步提交，杜绝「本地能装、CI 偷偷改锁」。

```bash
pnpm install --frozen-lockfile   # CI 推荐（语义近似 npm ci）
```

## 六、临时执行：dlx

不想把一次性 CLI 装进项目时，用 `pnpm dlx`（v11 起别名 `pnx`），从 registry 临时拉取执行、即用即走，**不写入依赖**：

```bash
pnpm dlx create-vue my-app          # 脚手架，等价 npx create-vue
pnpm dlx create-vue@next my-app     # 指定版本/tag
# 包名与 bin 名不一致时用 --package 指定要装的包
pnpm dlx --package=@pnpm/meta-updater meta-updater --help
```

> 区别：`pnpm exec` 运行**项目里已安装**的二进制；`pnpm dlx` 才是临时下载执行未安装的包。

---

掌握基本使用后，进入 [指南 · 基础](./guide-line/base)：内容寻址 store 与硬链接、符号链接式 `node_modules` 结构、幽灵依赖原理，以及与 npm/Yarn 的对比。
