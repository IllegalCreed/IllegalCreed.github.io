---
layout: doc
outline: [2, 3]
---

# 入门：Deno 现代运行时、安全模型与 2.x 兼容

> 基于 Deno 2.x（V8 + Rust）· 核于 2026-08

## 速查

- **是什么**：Deno 是 Ryan Dahl（Node.js 之父）2018 年发起、2020 年发布的现代 JS/TS 运行时，定位是「Node.js 的反思重写」。底层用 **V8 引擎**跑 JS，但运行时核心用 **Rust**（而非 Node 的 C++）编写，强调安全与正确性。
- **两大设计支柱**：①**默认安全**——权限沙箱，进程启动时无任何权限，需 `--allow-*` 显式授权才能读文件/联网/起子进程；②**原生 TypeScript**——无需 ts-node/tsx/swc，直接 `deno run app.ts` 运行 TS，内置类型检查。
- **Node/npm 兼容（2.x，约 95%）**：Deno 2.0（2024）大幅强化兼容——原生支持 `package.json`、`node_modules`（本地目录）、`npm:` 说明符直接 import npm 包（`import express from 'npm:express'`）、支持 Node-API 原生插件（有本地 node_modules 时）。绝大多数 Node 项目可渐进迁移。
- **JSR 注册表**：Deno 2.0 推出的 TypeScript-first 包注册表（jsr.io），跨 Deno/Node/Bun 运行时。包用 TS 编写，JSR 自动为 Node 用户生成 `.d.ts` 类型声明与 npm 兼容包——解决 npm 的 TS 类型分离、跨运行时不可移植等历史包袱。
- **权限沙箱模型**：默认拒绝（deny-by-default）。无授权时不能：读写文件（`--allow-read`/`--allow-write`）、联网（`--allow-net`）、起子进程（`--allow-run`）、读环境变量（`--allow-env`）、读系统信息（`--allow-sys`）、高危 FFI（`--allow-ffi`）。`--allow-all`/`-A` 全开（不推荐）。
- **原生 TS**：Deno 内置 TS 编译器（基于 swc），`deno run app.ts` 自动编译执行。`deno check app.ts` 做完整类型检查。无需 `tsconfig.json`（可用 `deno.json` 配置）。
- **工具链一体化**：`deno fmt`（格式化，替代 prettier）、`deno lint`（Lint）、`deno test`（测试）、`deno compile`（编译成单一可执行文件）、`deno bundle`（打包）、`deno serve`（2.x 新增的 HTTP 服务）——零配置开箱即用。
- **OpenTelemetry 内置**（2.2+，2.4 稳定）：无需第三方库，`DENO_UNSTABLE_OTEL=1 deno run` 即可导出 trace/metrics 到 OTLP collector，可观测性原生集成。
- **与 Node 对比**：Deno 默认安全（Node 默认允许）、原生 TS（Node 22.18+ 才默认剥离）、内置工具链（Node 依赖第三方）、JSR（vs npm）；但 Deno 生态规模远不及 npm。
- **进阶顺序**：[兼容与 JSR](./guide-line/compat-and-jsr) → [安全与 TypeScript](./guide-line/security-and-typescript) → [参考](./reference)。

## 一、Deno 是什么：Node.js 的反思重写

Ryan Dahl 在 2018 年演讲《关于 Node.js 我后悔的 10 件事》列出了 Node 的设计遗憾：①默认全权限（任何包能读 SSH 密钥）；②`node_modules` 与 `package.json` 的复杂解析；③CJS/ESM 的历史分裂；④`require` 模块用扩展名省略；⑤构建工具链碎片化（要配 babel/ts-node/prettier/eslint...）。Deno 就是为解决这些而生：

```
        你的 TypeScript / JavaScript 代码
              │
   ┌──────────┴──────────┐
   │   Deno 命名空间      │  Deno.readfile / Deno.serve / Deno.test
   │   （Rust 实现）      │
   └──────────┬──────────┘
              │
      ┌───────┴────────┐
      │     V8 引擎     │  ← 解析/编译/执行 JS+TS（swc 编译 TS）
      └───────┬────────┘
              │
      ┌───────┴────────┐
      │  Rust 运行时    │  ← 权限沙箱 + 异步 I/O（tokio）+ 工具链
      └───────┬────────┘
              │
        操作系统（受权限沙箱约束）
```

- **V8 跑 JS**：和 Node/Chrome 一样用 V8。
- **Rust 写运行时**：Node 的运行时核心是 C++，Deno 用 Rust（内存安全、防 C 的 buffer overflow 类漏洞）。
- **默认安全**：所有敏感操作（文件/网络/子进程/环境变量）都要显式授权——这是与 Node 最大的哲学差异。

## 二、安全模型：默认拒绝的权限沙箱

Deno 的安全模型是其核心卖点。进程启动时**默认无任何权限**：

```bash
# 默认拒绝——以下会报 PermissionDenied
deno run app.ts                  # 若 app.ts 想读文件/联网，直接被拒

# 显式授权
deno run --allow-read=/app/data --allow-net app.ts   # 只允许读 /app/data 和联网
deno run --allow-env app.ts                          # 允许读环境变量
deno run --allow-run=git app.ts                      # 允许起 git 子进程
deno run -A app.ts                                   # 全开（不推荐生产）
```

- **可控维度**：`--allow-read`/`--allow-write`（文件系统，可限定路径）、`--allow-net`（网络，可限定域名）、`--allow-env`（环境变量）、`--allow-run`（子进程，可限定命令）、`--allow-sys`（系统信息如 OS/内存）、`--allow-ffi`（FFI 调用本地库，高危）。
- **细粒度**：`--allow-read=/app/data,/tmp` 只允许读指定路径；`--allow-net=github.com` 只允许连 github.com。这种最小权限让供应链攻击的伤害面大幅缩小。
- **与 Node 对比**：Node 默认拥有当前用户全部权限，一个 npm 包的 postinstall 脚本就能偷密钥；Deno 默认拒绝，第三方包想联网都得你点头。Node 20+ 的 Permission Model 才开始追赶，但哲学仍是「默认允许+收窄」。

## 三、Node/npm 兼容（Deno 2.x）

Deno 2.0（2024）的最大主题是「兼容」——让现有 Node 项目能渐进迁移：

```ts
// 直接 import npm 包（npm: 说明符）
import express from 'npm:express@4';
import { z } from 'npm:zod';

// 原生支持 package.json 与 node_modules
// （项目里有 package.json 时自动走 npm 兼容模式）
```

- **兼容程度约 95%**：内置 Node 兼容层（`node:` 协议开箱即用，如 `import { readFile } from 'node:fs'`），支持 `package.json` 的 `dependencies`/`scripts`、本地 `node_modules`、npm 包的 Node-API 原生插件（有 node_modules 时）。
- **npm: 说明符**：`import express from 'npm:express@4.18'` 直接从 npm 拉包，无需 package.json（适合 Deno 原生项目）。
- **不兼容的 5%**：少数 Node-API 原生插件、依赖幽灵依赖的包、冷门 API 可能出问题。Deno 团队持续修兼容性，每版改善。
- **意义**：解了 Deno 最大的「生态不足」之痛——现有 Node 项目不必推倒重来，可逐文件迁移；同时 Deno 也能用上 npm 的海量包。

## 四、JSR：TypeScript-first 的现代注册表

Deno 2.0 同步推出了 **JSR**（JavaScript Registry，jsr.io），定位是 npm 的现代替代：

| 维度 | npm | JSR |
| --- | --- | --- |
| 源码语言 | JS（TS 需另发 .d.ts） | **TypeScript-first**（直接发 TS） |
| 跨运行时 | 主要 Node | **Deno/Node/Bun 跨运行时** |
| 类型声明 | 手动维护或生成 | **自动生成**（给 Node 用户生成 .d.ts） |
| 包描述 | package.json | `deno.json`/`jsr.json` |
| 模块解析 | 扩展名省略、幽灵依赖 | 显式、严格 |

- **TS-first**：包用 TS 写，发布就是 TS 源码——Deno 直接用，Node 用户拿到自动生成的 JS + `.d.ts`。解决了 npm 上「TS 源码与发布的 JS + 类型声明分离」的痛点。
- **跨运行时**：一个 JSR 包能同时被 Deno、Node（通过生成的 npm 兼容包）、Bun 使用——不再有「这个包只能 Deno 用」的割裂。
- **与 npm 关系**：JSR 不取代 npm，而是补充——npm 的存量包仍可用（通过 npm: 说明符），JSR 鼓励新包用 TS-first 发布。

## 五、原生 TypeScript 与工具链

Deno 把「零配置跑 TS」做到了极致：

- **原生 TS 执行**：内置 swc 编译器，`deno run app.ts` 自动编译执行，无需 ts-node/tsx/webpack 配置。
- **类型检查**：`deno check app.ts` 做完整类型检查（运行时不强制，但可显式 check）。
- **工具链一体化**：
  - `deno fmt`：格式化（替代 prettier，零配置）
  - `deno lint`：Lint（替代 eslint）
  - `deno test`：测试（内置，`Deno.test`）
  - `deno compile`：编译成单一可执行二进制（部署无需装 Deno）
  - `deno bundle`（2.4 回归）：打包成单文件，支持 npm 与 JSR 依赖
  - `deno serve`（2.x）：一行命令起 HTTP 服务
- **OpenTelemetry 内置**（2.2+，2.4 稳定）：无需第三方库，环境变量开启即可导出 trace/metrics 到 OTLP collector——可观测性原生集成，回应云原生时代的需求。

## 下一步

理解了 Deno 的总览后，下一步深入两个核心维度——[兼容与 JSR](./guide-line/compat-and-jsr)（Deno 2.x 的 Node/npm 兼容机制、JSR 注册表的设计与跨运行时特性、依赖管理）与[安全与 TypeScript](./guide-line/security-and-typescript)（权限沙箱的完整机制、原生 TS 执行原理、内置工具链与 OpenTelemetry）。
