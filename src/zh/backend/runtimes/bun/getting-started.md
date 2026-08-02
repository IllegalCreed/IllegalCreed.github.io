---
layout: doc
outline: [2, 3]
---

# 入门：Bun 全能工具链、Zig 性能与 Node 兼容

> 基于 Bun（JavaScriptCore + Zig）· 核于 2026-08

## 速查

- **是什么**：Bun 是 2022 年 Jarred Sumner 创立的全能型 JS/TS 运行时与工具链，口号「all-in-one toolkit」——一个 `bun` 命令替代 Node 运行时 + Webpack/Vite 打包器 + Jest 测试器 + npm 包管理器。
- **底层技术**：①**JavaScriptCore**（Safari/WebKit 的 JS 引擎，而非 Node/Deno 的 V8）执行 JS/TS；②**Zig**（系统级语言，手动内存管理、性能优先）编写运行时核心与所有工具——这是 Bun 极速的根源。
- **全能工具链（四合一）**：①运行时（`bun run app.ts`）；②打包器（`bun build`，内置 esbuild 兼容）；③测试器（`bun test`，兼容 Jest API）；④包管理器（`bun install`/`bun add`，比 npm 快数倍到数十倍）。单一二进制，零依赖安装。
- **极致性能**：HTTP 吞吐约为 Node 的 **4 倍**（`Bun.serve`）；`bun install` 比 npm 快数倍到数十倍（并行下载 + 全局缓存 + 无需联网校验）；启动快、内存占用低。
- **原生 TypeScript/JSX**：内置支持，`bun run app.ts` 直接跑，无需 ts-node/tsx/swc/tsconfig 配置。
- **Node 兼容约 95%**：支持绝大多数 Node API（`node:fs`/`node:http`）、npm 包、`package.json`/`node_modules`。目标是 drop-in replacement——把命令从 node/npm/jest 换成 bun 就能跑。
- **bun.lock 锁文件**：Bun 用单一的 `bun.lock`（文本格式，易读易合并）锁定依赖确切版本，替代 package-lock.json/yarn.lock。
- **内置常用 API**：`Bun.serve`（HTTP 服务）、`Bun.sql`（数据库查询）、`Bun.password`（密码哈希）、`bun:test`（测试）、`Bun.write`（写文件）等，减少第三方依赖。
- **与 Node/Deno 对比**：Bun 主打全能工具链 + 性能（Node 主打生态，Deno 主打安全）；三者 Node 兼容都约 95%（Deno/Bun）；Bun 用 JavaScriptCore，Node/Deno 用 V8。
- **进阶顺序**：[全能工具链](./guide-line/all-in-one-toolkit) → [性能与兼容](./guide-line/performance-and-compat) → [参考](./reference)。

## 一、Bun 是什么：全能工具链 + Zig 性能

Bun 的定位与 Node/Deno 不同——它不只是运行时，而是「运行时 + 工具链」的全能包。其架构：

```
        你的 TypeScript / JavaScript 代码
              │
   ┌──────────┴──────────┐
   │  Bun 内置 API        │  Bun.serve / Bun.sql / Bun.password / bun:test
   │  （Zig 实现）        │
   └──────────┬──────────┘
              │
      ┌───────┴────────┐
      │ JavaScriptCore │  ← Safari/WebKit 的 JS 引擎（非 V8）
      └───────┬────────┘
              │
      ┌───────┴────────┐
      │  Zig 运行时     │  ← 运行时核心 + 打包器 + 测试器 + 包管理器
      └───────┬────────┘
              │
        操作系统
```

- **JavaScriptCore**：Apple 为 Safari/WebKit 开发的 JS 引擎，Bun 选它而非 V8 是因为启动更快、内存占用更低（移动端优化经验）。
- **Zig 编写一切**：Bun 的运行时核心、打包器、测试器、包管理器都用 Zig 写（不是 C/C++/Rust）。Zig 手动内存管理、无隐藏控制流、性能贴近 C，让 Bun 全栈追求零开销。
- **单一二进制**：`curl -fsSL https://bun.sh/install | bash` 装一个 `bun` 命令，包含运行时+打包+测试+包管理所有能力，零依赖。

## 二、全能工具链：四合一替代

Bun 用一个 `bun` 命令覆盖 Node 生态里需要四五个工具才能完成的全部工作：

| 能力 | Bun 命令 | 替代的工具 |
| --- | --- | --- |
| 运行 JS/TS | `bun run app.ts` | `node` + `ts-node`/`tsx` |
| 热重载 | `bun --hot app.ts` | `nodemon` |
| 打包 | `bun build ./index.ts --outdir ./dist` | `webpack`/`esbuild`/`vite` |
| 测试 | `bun test` | `jest`/`vitest` |
| 包管理 | `bun install`/`bun add` | `npm`/`yarn`/`pnpm` |
| 脚本运行 | `bun run start` | `npm run start` |

- **零配置 TS**：`bun run app.ts` 直接跑 TypeScript，内置编译，无需 tsconfig/ts-node。
- **兼容 Jest API**：`bun test` 兼容 Jest 的 `describe/it/expect`，测试文件无需改写即可迁移。
- **esbuild 兼容打包**：`bun build` 的 API 与 esbuild 兼容，迁移成本低。
- **包管理极快**：`bun install` 用并行下载 + 全局缓存 + 精简元数据解析，比 npm 快数倍到数十倍。

## 三、性能：为什么 Bun 这么快

Bun 的速度优势来自底层全栈优化：

- **JavaScriptCore 而非 V8**：JSC 启动快、内存占用低（Apple 在移动端多年优化的成果）。Bun 的进程启动比 Node 快数倍。
- **Zig 零开销**：运行时核心、I/O、HTTP、打包、包管理全用 Zig 写，无 GC 暂停（Zig 手动内存管理）、无运行时抽象开销，性能贴近 C。
- **HTTP 约 4x Node**：`Bun.serve` 用 Zig 实现的 HTTP 服务器（基于 uSocket 高性能 I/O 库），吞吐约为 Node 的 4 倍，延迟更低。
- **bun install 极快**：并行下载所有依赖、全局缓存（多项目共享）、无 npm 那种串行元数据校验，安装速度数倍到数十倍于 npm。
- **内置热重载**：`bun --hot` 在开发期重载代码（保留部分状态），比 nodemon 重启进程更快。

## 四、Node 兼容约 95%

Bun 的目标是 drop-in replacement——现有 Node 项目命令换成 bun 就能跑：

```bash
# 原 Node 项目
node app.js              # → bun app.js（或 bun run app.js）
npm install              # → bun install
npm run test             # → bun test
npx jest                 # → bun test
```

- **兼容范围**：支持 `node:` 内置模块（fs/http/crypto/stream 等常用模块）、npm 包（自动走 node_modules）、`package.json` 的 dependencies/scripts、Node-API 原生插件（多数）、`process`/`Buffer`/`__dirname` 全局对象、CJS 的 require 与 ESM 的 import。
- **不兼容的约 5%**：少数 Node-API 老插件、依赖 V8 特有行为（如某些 V8 内部 API）的包、冷门废弃 API 可能出问题。Bun 团队持续修兼容，每版改善。
- **迁移策略**：先在开发环境把命令换成 bun 试跑，遇到不兼容的包再回退该部分到 Node——可渐进迁移。

## 五、bun.lock 与包管理

Bun 的包管理用单一 `bun.lock`（文本格式）：

- **bun.lock**：锁定所有依赖的确切版本与来源，文本格式（易读、易合并、易 review），替代 package-lock.json/yarn.lock/pnpm-lock.yaml。
- **bun install**：读取 package.json，并行下载依赖，生成 node_modules + bun.lock。
- **bun add/remove**：增删依赖，自动更新 package.json 与 bun.lock。
- **全局缓存**：下载的包缓存在全局（`~/.bun/install/cache`），多项目共享，二次安装极快。
- **workspace 支持**：Bun 支持 monorepo 的 workspaces（类似 npm/pnpm 的 workspace）。

## 下一步

理解了 Bun 的总览后，下一步深入两个核心维度——[全能工具链](./guide-line/all-in-one-toolkit)（运行时/打包器/测试器/包管理器四合一的每个细节）与[性能与兼容](./guide-line/performance-and-compat)（Zig + JavaScriptCore 的性能原理、Node 兼容层机制、bun.lock 包管理）。
