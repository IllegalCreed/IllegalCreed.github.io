---
layout: doc
---

# Bun

**Bun** 是 2022 年由 Jarred Sumner 创立的**全能型 JavaScript/TypeScript 运行时与工具链**——它的口号是「all-in-one toolkit」，一个工具替代 Node 运行时 + Webpack/Vite 打包器 + Jest/Vitest 测试器 + npm/yarn/pnpm 包管理器。Bun 用 **Zig** 语言（一种系统级语言，强调手动内存管理与性能）从头编写底层（含自定义 JS 引擎 JavaScriptCore，源自 Safari，而非 Node/Deno 的 V8），追求极致启动速度与运行时性能——HTTP 吞吐约为 Node 的 **4 倍**，`bun install` 比 npm 快数倍到数十倍。Bun 对 Node.js 的兼容性约 **95%**（支持绝大多数 Node API、npm 包、package.json/node_modules），目标是「drop-in replacement」——把现有 Node 项目的命令从 `node`/`npm`/`jest` 换成 `bun` 就能跑得更快。Bun 用单一的 **`bun.lock`** 锁文件管理依赖。理解 Bun，关键是理解它如何用「全能工具链 + Zig 性能」两张牌，在 Node.js（生态）和 Deno（安全）之外开辟「速度至上」的第三条路。

Bun 的全部考点围绕**全能工具链与极致性能**展开：①**一体化工具链**（运行时 + 打包器 + 测试器 + 包管理器四合一，单一二进制 `bun`）——回答"为什么要装一堆工具"；②**性能与底层**（Zig 编写、JavaScriptCore 引擎、HTTP 约 4x、安装速度）——回答"为什么快"；③**Node 兼容**（约 95% 兼容、package.json/node_modules/npm 包 drop-in）——回答"能不能替换 Node"；④**包管理与锁文件**（`bun install`/`bun add`、`bun.lock`）——回答"依赖怎么管"。本叶与 [Node.js](../nodejs/)、[Deno](../deno/) 构成后端运行时三角，Bun 是其中「速度与工具链一体化」的代表。

## 评价

**优点**

- **极致性能**：Zig + JavaScriptCore 让 HTTP 吞吐约 4x Node，`bun install` 比npm快数倍到数十倍，启动快、内存占用低
- **全能工具链**：一个 `bun` 命令替代 node+nodemon+webpack+jest+npm，零配置开箱即用，开发体验丝滑
- **原生 TypeScript/JSX**：内置支持，无需 ts-node/tsx/swc 配置，直接 `bun run app.ts`
- **Node 兼容性好**：约 95% 兼容，现有 Node 项目可 drop-in 替换（命令换成 bun 即可）
- **内置常用 API**：Bun.serve（HTTP）、Bun.sql（数据库）、Bun.password（密码哈希）、bun:test（测试）等，减少第三方依赖

**缺点**

- **生态规模不及 npm（通过兼容层用）**：虽能跑 npm 包，但生态原生围绕 Bun 的库仍少，冷门/老旧 Node 包可能不兼容
- **兼容层边界**：约 95% 兼容意味着 5% 不行——某些 Node-API 原生插件、依赖 V8 特有行为的包、冷门 API 可能出问题
- **稳定性与成熟度**：相对 Node（2009）/Deno（2020），Bun（2022）较年轻，生产大规摸部署案例仍在积累，偶有 breaking change
- **平台覆盖**：对 ARM/Windows 等平台的支持成熟度不如 Node（Node 几乎全平台）

## 本叶地图

- [入门](./getting-started) —— Bun 定位、全能工具链、Zig + JavaScriptCore、Node 兼容约 95%、bun.lock、性能概览
- [全能工具链](./guide-line/all-in-one-toolkit) —— 运行时（bun run）+ 打包器（bun build）+ 测试器（bun test）+ 包管理器（bun install）四合一，单一二进制
- [性能与兼容](./guide-line/performance-and-compat) —— Zig 底层与 JavaScriptCore 引擎、HTTP 约 4x 性能、Node 兼容层机制、bun.lock 包管理
- [参考](./reference) —— Bun 命令速查、内置 API 清单、Node 兼容矩阵、易错点、版本特性

## 幻灯片地址

<a href="/SlideStack/bun-slide/" target="_blank">Bun</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=Bun" target="_blank" rel="noopener noreferrer">Bun 测试题</a>
