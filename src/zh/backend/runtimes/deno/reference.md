---
layout: doc
outline: [2, 3]
---

# 参考：Deno 版本特性、权限标志与兼容矩阵

> 基于 Deno 2.x（V8 + Rust）· 核于 2026-08

## 速查

- **是什么**：Ryan Dahl 出品的现代 JS/TS 运行时，V8 + Rust 核心，默认安全 + 原生 TS。
- **安全模型**：默认拒绝，`--allow-*` 显式授权（文件/网络/子进程/环境变量/系统/FFI），`--deny-*` 优先级更高。
- **Node 兼容（2.x）**：约 95%，node: 协议开箱即用，npm: 说明符 / package.json + node_modules 双模式，支持 Node-API 原生插件。
- **JSR**：TypeScript-first 跨运行时注册表（jsr.io），自动生成 Node 兼容包。
- **原生 TS**：内置 swc 编译，`deno run app.ts` 直接跑，`deno check` 做类型检查。
- **工具链**：fmt/lint/test/check/compile/bundle/serve/task 一体化，零配置。
- **OpenTelemetry**：2.2 引入，2.4 稳定，环境变量开启即导出 OTLP。

## 一、Deno 关键版本特性

| 版本 | 年份 | 关键特性 |
| --- | --- | --- |
| **1.0** | 2020 | 首个稳定版，默认安全、原生 TS、URL import |
| **1.x** | 2020-2024 | 逐步加 Node 兼容（node: 协议）、npm: 说明符实验 |
| **2.0** | 2024 | **Node/npm 兼容大升级**（package.json/node_modules/Node-API）、**JSR 注册表**、标准库稳定 |
| **2.1** | 2024 | 性能优化、JSR 包体积减小 |
| **2.2** | 2025 | **内置 OpenTelemetry**（实验）、Lint 插件 API、`node:sqlite` |
| **2.4** | 2025 | **OpenTelemetry 稳定**、`deno bundle` 回归（支持 npm/JSR 依赖） |

## 二、权限标志速查

| 标志 | 控制什么 | 细粒度示例 |
| --- | --- | --- |
| `--allow-read` | 文件读 | `--allow-read=/app/data,/tmp` |
| `--allow-write` | 文件写 | `--allow-write=./out` |
| `--allow-net` | 网络 | `--allow-net=github.com,deno.land` |
| `--allow-env` | 环境变量 | `--allow-env=NODE_ENV,DB_URL` |
| `--allow-run` | 子进程 | `--allow-run=git,make` |
| `--allow-sys` | 系统信息 | （OS/内存/CPU） |
| `--allow-ffi` | FFI（调本地库） | 高危，慎用 |
| `--allow-hrtime` | 高精度时间 | 防时序侧信道攻击 |
| `--allow-all` / `-A` | 全开 | 不推荐生产 |
| `--deny-*` | 显式拒绝 | 优先级高于 allow |
| `--prompt` | 交互式逐个确认 | 开发期用 |

## 三、Deno.* 核心 API 速查

| API | 用途 | Node 对应 |
| --- | --- | --- |
| `Deno.readTextFile` | 读文本文件 | `fs.readFile` |
| `Deno.writeTextFile` | 写文本文件 | `fs.writeFile` |
| `Deno.serve` | 起 HTTP 服务 | `http.createServer` |
| `Deno.listen` | 监听 TCP | `net.createServer` |
| `Deno.test` | 定义测试 | （`node:test` 的 test） |
| `Deno.env.get/set` | 环境变量 | `process.env` |
| `Deno.args` | 命令行参数 | `process.argv` |
| `Deno.Command` | 起子进程 | `child_process.spawn` |
| `Deno.permissions` | 权限查询/请求 | （无对应） |
| `Deno.openKv` | 内置 KV 存储 | （无对应，Deno 独有） |
| `Deno.dlopen` | FFI 调本地库 | `ffi-napi`（第三方） |
| `fetch` | 网络请求（全局） | （Node 18+ 也有全局 fetch） |

## 四、Node 兼容矩阵

| 能力 | 支持度 | 说明 |
| --- | --- | --- |
| `node:` 内置模块 | 约 98% | fs/path/http/crypto/stream 等常用模块几乎全覆盖 |
| npm 包（npm: 说明符） | 约 95% | 绝大多数纯 JS/TS 包可用 |
| `package.json` 依赖 | ✅ | `deno install` 创建 node_modules |
| Node-API 原生插件 | ✅（需 node_modules） | .node 文件需本地磁盘加载 |
| `process`/`Buffer` 全局 | ✅ | 兼容模式下可用 |
| CJS `require` | ✅ | 支持 require CommonJS 包 |
| 幽灵依赖 | ⚠️ | 依赖扁平化的包可能出问题 |
| 冷门/废弃 API | ❌ | 少数老 API 未实现 |

## 五、易错点清单

- **"Deno 默认能读文件"**：错。Deno 默认拒绝，需 `--allow-read`，与 Node 默认允许相反。
- **"Deno 不兼容 Node"**：错（过时认知）。Deno 2.x 约 95% 兼容 Node，支持 package.json/node_modules/npm 包。
- **"deno run 会做类型检查"**：错。`deno run` 默认不做类型检查（性能优先），需 `deno check` 单独检查。
- **"`--allow-all` 之后还能用 `--deny-*` 限制"**：对。deny 优先级高于 allow，`-A --deny-run=rm` 全开但禁 rm。
- **"JSR 取代了 npm"**：错。JSR 是补充，npm 存量包仍可用（npm: 说明符），JSR 鼓励新包 TS-first 发布。
- **"Deno 不支持 Node-API 原生插件"**：错（过时）。2.0 起支持，前提是项目有本地 node_modules。
- **"Deno 的 TS 等于 Node 的类型剥离"**：错。Deno 用 swc 完整编译（支持 enum/decorator），Node 默认只剥离不转译。
- **"npm: 说明符 需要先 npm install"**：错。npm: 说明符直接从 npm 拉取并全局缓存，不需要本地 install。
- **"OpenTelemetry 要装一堆库"**：错。Deno 2.2+ 内置，环境变量开启即可，无需第三方 instrumentation。
- **"`--allow-net` 包含所有子进程网络"**：错。子进程的网络访问由子进程自己控制，不受 Deno 的 `--allow-net` 约束（`--allow-run` 才管子进程）。

## 六、进阶方向（链接其他叶）

- [Node.js](../nodejs/) —— 默认允许 + 生态最强 + 22.18+ 原生 TS 的参照系
- [Bun](../bun/) —— 全能工具链 + Zig 性能的极速运行时

## 权威链接

- [Deno 官网](https://deno.com/)
- [Announcing Deno 2](https://deno.com/blog/v2.0)
- [Deno 2.2: OpenTelemetry, Lint Plugins, node:sqlite](https://deno.com/blog/v2.2)
- [Deno 2.4: deno bundle is back](https://deno.com/blog/v2.4)
- [JSR 注册表](https://jsr.io/)
- [Node and npm Compatibility - Deno Docs](https://docs.deno.com/runtime/fundamentals/node/)
- [Running TypeScript Natively - Deno Docs](https://docs.deno.com/runtime/fundamentals/typescript/)
- 本站幻灯片：<a href="/SlideStack/deno-slide/" target="_blank">Deno</a>
