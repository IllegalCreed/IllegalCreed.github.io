---
layout: doc
outline: [2, 3]
---

# 性能与兼容：Zig 底层、Node 兼容与 bun.lock

> 基于 Bun（JavaScriptCore + Zig）· 核于 2026-08

## 速查

- **JavaScriptCore（JSC）**：Bun 用 Apple 的 JavaScriptCore（Safari/WebKit 的 JS 引擎），而非 Node/Deno 的 V8。JSC 启动快、内存占用低，是 Bun 启动速度优势的来源之一。
- **Zig 写底层**：Bun 的运行时核心、HTTP 服务器、打包器、测试器、包管理器全用 Zig 写。Zig 是系统级语言，手动内存管理（无 GC 暂停）、无隐藏控制流、性能贴近 C。
- **HTTP 约 4x Node**：`Bun.serve` 基于 uSocket（C 的高性能 I/O 库）+ Zig 实现，HTTP 吞吐约为 Node 的 4 倍，延迟更低。
- **bun install 极快**：并行下载 + 全局缓存 + Zig 写的精简元数据解析，比 npm 快数倍到数十倍。
- **Node 兼容约 95%**：支持 node: 内置模块、npm 包、package.json/node_modules、Node-API 原生插件（多数）、process/Buffer 全局对象、CJS require 与 ESM import。
- **不兼容的 5%**：依赖 V8 特有内部 API 的包、少数老 Node-API 插件、冷门废弃 API、依赖幽灵依赖的包可能失败。
- **bun.lock**：单一文本格式锁文件，锁定依赖确切版本与来源，替代 package-lock.json/yarn.lock。
- **全局缓存**：`~/.bun/install/cache`，多项目共享，二次安装秒级。

## 一、Zig 与 JavaScriptCore：性能的根源

Bun 的性能优势不是单一优化，而是全栈技术选型的结果：

| 组件 | Bun 的选择 | 对比 Node | 带来的优势 |
| --- | --- | --- | --- |
| JS 引擎 | **JavaScriptCore**（Apple） | V8（Google） | 启动快、内存低 |
| 运行时核心 | **Zig** | C++（Node）/Rust（Deno） | 零开销、手动内存管理 |
| HTTP | **uSocket**（C 库）+ Zig | Node http（C++） | 约 4x 吞吐 |
| 包管理 | **Zig**（并行+缓存） | npm（JS） | 数倍到数十倍安装速度 |

- **为什么选 JSC 而非 V8**：JSC 是 Apple 为 Safari/移动端优化的引擎，启动延迟低、内存占用小。Bun 创始人 Jarred Sumner 在多次演讲中说明：JSC 的启动比 V8 快，这对 CLI 与脚本场景（频繁起进程）至关重要。代价是 JSC 在某些 JS 引擎特性上与 V8 有差异（极少数包依赖 V8 内部 API 会不兼容）。
- **为什么选 Zig**：Zig 是系统级语言，特点：①手动内存管理（无 GC 暂停，对低延迟服务重要）；②无隐藏控制流（无运算符重载/隐藏分配，性能可预测）；③编译期元编程；④与 C 互操作极佳（能直接用 uSocket 等 C 库）。性能贴近 C，比 Rust 编译快、心智模型简单。
- **uSocket**：Bun 的 HTTP 服务器基于 uSocket（一个 C 写的高性能 I/O 库），绕过 Node 的 Libuv 抽象层，直接处理 socket，实现约 4x Node 的吞吐。

## 二、HTTP 约 4x：Bun.serve 详解

`Bun.serve` 是 Bun 内置的 HTTP 服务器，性能约为 Node 的 4 倍：

```ts
// app.ts
Bun.serve({
  port: 3000,
  fetch(req) {
    return new Response('Hello from Bun!');
  },
});
```

- **Request/Response 标准 Web API**：用浏览器标准的 `Request`/`Response` 对象（不用 Node 的 `http.IncomingMessage`），与浏览器/Edge Workers 代码一致。
- **极低开销**：基于 uSocket 直接处理 socket，无 Libuv 中间层，单连接吞吐高、延迟低。
- **自动复用**：开发期 `bun --hot app.ts` 热重载时，Bun.serve 能保持现有连接不断（部分场景）。
- **适用场景**：API 服务、边缘函数、高性能 Web 服务。Bun 的官方基准测试显示其 RPS（每秒请求数）约为 Node 的 4 倍。

## 三、Node 兼容层机制

Bun 的 Node 兼容（约 95%）通过内置兼容层实现：

- **node: 内置模块**：Bun 实现了绝大多数 Node 内置模块（fs、http、https、crypto、stream、buffer、path、os、url、util、events、child_process 等）。`import { readFile } from 'node:fs'` 直接可用。
- **npm 包**：自动走 node_modules 解析，裸模块名 `import express from 'express'` 与 Node 行为一致。
- **package.json**：识别 dependencies/devDependencies/scripts/exports 字段，`bun run xxx` 跑 scripts。
- **Node-API 原生插件**：支持多数 Node-API（N-API）的 .node 原生插件（与 Node 二进制兼容的 ABI）。
- **全局对象**：`process`、`Buffer`、`__dirname`、`__filename`（CJS 里）、`setImmediate` 等 Node 全局在 Bun 里可用。
- **CJS 与 ESM**：同时支持 CommonJS 的 require/module.exports 与 ES Modules 的 import/export，根据扩展名与 package.json 的 type 切换。

## 四、兼容边界：5% 不兼容的典型

约 5% 的不兼容主要集中在：

| 不兼容类型 | 例子 | 原因 |
| --- | --- | --- |
| V8 特有内部 API | 某些用 v8.h 的包 | Bun 用 JSC，无 V8 内部 |
| 老 Node-API 插件 | 早期 NAN（非 N-API）插件 | ABI 老旧不兼容 |
| 冷门废弃 API | 已废弃的 Node API | Bun 未实现 |
| 幽灵依赖 | 依赖扁平化提升的包 | Bun 解析更严格 |
| 平台特定 | 强依赖 Linux 系统调用 | 跨平台差异 |

- **迁移建议**：开发环境先用 bun 试跑全量测试（bun test）与启动（bun run），遇到失败再定位是哪个包不兼容。多数不兼容包能找到替代或等 Bun 后续版本修复。
- **持续改善**：Bun 团队把 Node 兼容作为长期重点，每个版本都修一批兼容问题，5% 的不兼容面在持续缩小。

## 五、bun.lock 与包管理细节

Bun 的包管理与 npm/pnpm/yarn 有细节差异：

- **bun.lock 格式**：文本格式（早期 bun.lockb 是二进制，新版改为 bun.lock 文本），易读、易合并、易 code review。锁定所有依赖（含传递依赖）的确切版本与完整性。
- **node_modules 结构**：Bun 默认生成扁平化的 node_modules（类似 npm v3+），保证与 Node/npm 互操作。也支持 `--frozen-lockfile`（CI 用，锁文件必须匹配）。
- **全局缓存**：`~/.bun/install/cache` 内容寻址存储，多项目共享。第二个项目装相同包时从缓存硬链接，秒级完成。
- **workspace**：monorepo 的 workspaces 通过 package.json 的 `workspaces` 字段声明，`bun install` 自动链接本地包，体验与 pnpm/yarn workspace 一致。
- **与 npm 互操作**：Bun 读取标准 package.json、生成标准 node_modules——删掉 bun.lock 后 npm install 也能正常工作，可无缝切换。

## 交互演示

本叶无专门可视化。建议实操：在一个 Node 项目目录里，对比 `npm install` 与 `bun install` 的耗时（大项目差异最明显）；用 `bun run` 替换 `node` 跑同一个脚本，对比启动速度；用 `Bun.serve` 写个简单 HTTP 服务做压测，对比 Node 的 http.createServer 吞吐。

## 下一步

掌握了 Bun 的工具链、性能与兼容后，对照 [Node.js](../../nodejs/)（生态护城河 + 22.18+ 原生 TS）与 [Deno](../../deno/)（默认安全 + JSR）的对应设计，理解三大运行时在「生态/安全/性能/工具链」四个维度的取舍，根据项目需求选型。
