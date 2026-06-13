---
layout: doc
outline: [2, 3]
---

# 入门

> 本篇只讲 **Bun 作为包管理器**（`bun install` / `bun pm`）。版本基线 **Bun 1.2+**（文本锁文件 `bun.lock` 已为默认）。运行时 / 打包器 / 测试见「后端框架 > Bun」。对比对象：npm 10/11、pnpm、yarn。

## 速查

- 安装 Bun：`curl -fsSL https://bun.sh/install | bash`（macOS/Linux）；Windows 用 `powershell -c "irm bun.sh/install.ps1 | iex"`
- 装全部依赖：`bun install`（简写 `bun i`）→ 写 `bun.lock`
- 增 / 删 / 升：`bun add <pkg>` ｜ `bun remove <pkg>` ｜ `bun update [pkg]`
- 开发依赖：`bun add -d <pkg>`（`--dev`/`-D`）；全局：`bun add -g <pkg>`
- 临时跑 CLI：`bunx <pkg>`（对位 `npx`）
- CI 复现：`bun ci`（= `bun install --frozen-lockfile`）
- 核心认知：**读写标准 `package.json` / `node_modules`**，不绑定 Bun 运行时
- ⚠️ 默认**不跑依赖的生命周期脚本**（`postinstall` 等）→ 需 `trustedDependencies` 放行
- ⚠️ 默认**会装 `peerDependencies`**（类似 yarn），与 npm 习惯不同

## 一、Bun 的包管理器是什么

官方一句话定位：「**a Node.js-compatible package manager designed to be a dramatically faster replacement for `npm`, `yarn`, and `pnpm`**」。三个关键点：

1. **兼容**：读标准 `package.json`、写标准 `node_modules`、兼容 `.npmrc` 的 registry/scope 配置——现有 Node 项目可无缝切换。
2. **独立**：它是 standalone 工具，**不要求**把运行时也换成 Bun。你完全可以「`bun install` 装依赖 + `node` 跑代码 + Vite 打包」。
3. **快**：官方称比 `npm install` 快**约 25×**。

> 边界提醒：Bun 还是运行时、打包器、测试运行器。本篇所有内容都只围绕「装包/管包」，`bun build`（打包）、`bun test`（测试）、`bun run`（跑脚本/运行 JS）不展开。

## 二、为什么这么快

| 机制 | 说明 | 对比 |
|---|---|---|
| **全局共享缓存** | 包缓存在 `~/.bun/install/cache/${name}@${version}`，多项目复用 | 类似 pnpm 的全局 store |
| **OS 级文件物化** | macOS `clonefile`（写时复制）、Linux `hardlink`（硬链接） | 避免逐字节拷贝 |
| **惰性 + 按需** | 锁文件命中且 `package.json` 未变时，只下缺失的、跳过已匹配的包 | 二次安装近乎瞬时 |
| **Zig 原生 + 高并发** | 非 JS 实现，网络/解析高并发 | 比 JS 实现的 npm 快 |

> `clonefile`/`hardlink` 不可用或出错时回退到 `copyfile`。可用 `--backend` 显式指定。

## 三、安装 Bun 与第一条命令

```bash
# 安装 Bun 本体（含包管理器）
curl -fsSL https://bun.sh/install | bash

# 在现有 Node 项目里装依赖（把 npm install 换成它）
bun install            # 简写 bun i
```

`bun install` 会做三件事：

- **安装** `dependencies`、`devDependencies`、`optionalDependencies`，并**默认安装** `peerDependencies`；
- **运行项目自身**的 `{pre|post}install` / `{pre|post}prepare` 脚本（注意：**不跑依赖的**脚本）；
- **写** `bun.lock` 到项目根。

## 四、增删改依赖

```bash
bun add zod                 # 加生产依赖，写进 package.json
bun add -d typescript       # 加开发依赖（--dev / -D）
bun add -g @biomejs/biome   # 全局安装 CLI 工具
bun add react@19.1.1        # 指定版本
bun add react@latest        # 指定 tag
bun add -E react            # --exact：写 19.1.1 而非 ^19.1.1

bun remove zod              # 卸载（简写 bun rm）
bun update                  # 在 package.json range 内升级全部
bun update react --latest   # 突破 range 升到绝对最新（并改写 range）
bun outdated                # 列出可升级项（Current / Update / Latest）
```

> 对比 npm：`bun add` ≈ `npm install <pkg>`，`bun remove` ≈ `npm uninstall`，`bun update --latest` ≈ `npm install <pkg>@latest`。`bun update`（不带 `--latest`）只在 semver 范围内升级，行为更可控。

## 五、锁文件：bun.lock（文本）

Bun 1.2 起，默认锁文件是**文本格式 `bun.lock`**（JSONC，可带注释，类似 `tsconfig.json`）：

```bash
bun install          # 自动写 bun.lock
```

- **务必提交** `bun.lock` 到版本控制——它是可复现安装的依据。
- 文本格式的好处：PR 里能渲染 **diff**、合并冲突更易解决、GitHub / Dependabot 等工具能直接读。
- 旧的二进制 `bun.lockb` 仍受支持，但已非默认（升级方式见[专家篇](./guide-line/expert)）。

## 六、临时执行：bunx

```bash
bunx cowsay "Hello, Bun!"   # 一次性执行包的可执行文件，必要时临时下载
bunx create-vite my-app     # 跑脚手架，不写进项目依赖
```

`bunx`（等价 `bun x`）对位 `npx`：不把包装进 `package.json`，用完即走。

## 七、最小 CI 用法

```yaml
# .github/workflows/ci.yml
steps:
  - uses: actions/checkout@v4
  - uses: oven-sh/setup-bun@v2     # 官方 action
  - run: bun ci                    # = bun install --frozen-lockfile
  - run: bun run build
```

> `bun ci` 按 `bun.lock` 装精确版本，若 `package.json` 与锁文件不一致就**失败退出**——对位 `npm ci`，保证 CI 复现。

---

掌握基本命令后，进入 [指南 · 基础](./guide-line/base)：安装策略（hoisted vs isolated）、workspaces、`bunfig.toml`、生命周期脚本安全模型。
