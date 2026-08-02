---
layout: doc
outline: [2, 3]
---

# 参考：Bun 命令、内置 API 与兼容矩阵

> 基于 Bun（JavaScriptCore + Zig）· 核于 2026-08

## 速查

- **是什么**：全能 JS/TS 运行时 + 工具链（运行/打包/测试/包管理四合一），JavaScriptCore + Zig 底层。
- **性能**：HTTP 约 4x Node，bun install 数倍到数十倍 npm，启动快、内存低。
- **Node 兼容**：约 95%，支持 node:/npm 包/package.json/node_modules/Node-API。
- **工具链**：单一二进制 `bun`，零配置（TS/JSX/打包/测试内置）。
- **锁文件**：bun.lock（文本格式），替代 package-lock.json/yarn.lock。

## 一、Bun 关键版本特性

| 版本 | 年份 | 关键特性 |
| --- | --- | --- |
| **0.x** | 2022 | 首次发布，JavaScriptCore + Zig，all-in-one 定位 |
| **1.0** | 2023 | 首个稳定版，Node 兼容大幅提升，Windows 支持 |
| **1.1** | 2024 | Windows 稳定支持、`Bun.serve` 性能优化 |
| **1.2** | 2025 | bun.lock 文本格式、稳定性提升、Node-API 兼容扩展 |
| **1.3** | 2025 | 性能优化、bundle 改进、更多 Node API 兼容 |

## 二、命令速查

| 命令 | 作用 | Node 对应 |
| --- | --- | --- |
| `bun run app.ts` | 运行 JS/TS | `node` + `ts-node` |
| `bun app.ts` | 运行（run 可省略） | `node app.js` |
| `bun --hot app.ts` | 热重载（保留部分状态） | `nodemon` |
| `bun build ./index.ts --outdir ./dist` | 打包 | `webpack`/`esbuild` |
| `bun test` | 跑测试 | `jest`/`vitest` |
| `bun test --coverage` | 测试+覆盖率 | `jest --coverage` |
| `bun install` | 装全部依赖 | `npm install` |
| `bun add pkg` | 加依赖 | `npm install pkg` |
| `bun add -d pkg` | 加开发依赖 | `npm install -D pkg` |
| `bun remove pkg` | 删依赖 | `npm uninstall pkg` |
| `bun update` | 升级依赖 | `npm update` |
| `bun run start` | 跑 scripts | `npm run start` |
| `bunx pkg` | 执行 bin（本地/远程） | `npx` |
| `bun init` | 初始化项目 | `npm init` |
| `bun create` | 用模板创建 | `create-react-app`/`vite create` |

## 三、Bun.* 核心 API 速查

| API | 用途 | Node 对应 |
| --- | --- | --- |
| `Bun.serve` | HTTP 服务（约 4x 性能） | `http.createServer` |
| `Bun.write` | 写文件（高效） | `fs.writeFile` |
| `Bun.file` | 文件引用（惰性） | `fs.readFileSync`（返回 File 对象） |
| `Bun.password.hash/verify` | 密码哈希/验证 | `bcrypt`（第三方） |
| `Bun.sql` | SQL 查询（内置） | `pg`/`mysql2`（第三方） |
| `Bun.spawn` | 起子进程 | `child_process.spawn` |
| `Bun.dns` | DNS 查询 | `node:dns` |
| `Bun.gc` | 触发 GC（手动） | （无对应，V8 自动） |
| `Bun.md5/sha` | 哈希计算 | `node:crypto` |
| `bun:test` | 测试 API（import） | `jest`（第三方） |

## 四、Node 兼容矩阵

| 能力 | 支持度 | 说明 |
| --- | --- | --- |
| `node:` 内置模块 | 约 98% | fs/http/crypto/stream 等常用模块几乎全覆盖 |
| npm 包 | 约 95% | 绝大多数纯 JS/TS 包可用 |
| `package.json` | ✅ | dependencies/scripts/exports 识别 |
| Node-API 原生插件 | ✅（多数） | 兼容 N-API 的 .node 文件 |
| `process`/`Buffer` 全局 | ✅ | 兼容模式可用 |
| CJS `require` | ✅ | 支持 CommonJS |
| ESM `import` | ✅ | 支持 ES Modules |
| V8 内部 API 包 | ❌ | JSC 无 V8 内部，这类包不兼容 |
| 老 NAN 插件 | ❌ | 早期 NAN（非 N-API）不兼容 |
| 幽灵依赖 | ⚠️ | Bun 解析更严格，可能失败 |

## 五、易错点清单

- **"Bun 用 V8 引擎"**：错。Bun 用 JavaScriptCore（Apple/Safari），Node/Deno 才用 V8。
- **"Bun 用 Rust 写"**：错。Bun 用 Zig 写底层（Node 是 C++，Deno 是 Rust）。
- **"Bun 不兼容 Node"**：错（过时）。Bun 约 95% 兼容 Node，支持 node:/npm 包/package.json。
- **"Bun 的 TS 等于 Node 类型剥离"**：错。Bun 完整编译（支持 enum/decorator），Node 默认只剥离。
- **"bun.lockb 是二进制无法 review"**：部分对。早期是 .lockb 二进制，新版改为 bun.lock 文本格式（易读易合并）。
- **"Bun.serve 用 Node 的 http 模块"**：错。Bun.serve 基于 uSocket（C 库）+ Zig，独立实现，约 4x Node http。
- **"bun install 走 npm registry 协议"**：对（仍从 npm 等标准 registry 拉包，只是解析/下载更快）。
- **"--hot 是完整 HMR 保留所有状态"**：错。--hot 保留部分状态，复杂状态可能丢失，不是完整 HMR。
- **"Bun 完全取代 Node 生态"**：错。Bun 约 95% 兼容，5% 不兼容（V8 内部 API 包、老插件）；且 Node 生态成熟度与平台覆盖仍领先。
- **"Bun 比 Node 慢"**：错。Bun 主打性能，HTTP 约 4x、install 数倍到数十倍、启动更快。

## 六、进阶方向（链接其他叶）

- [Node.js](../nodejs/) —— 生态最强 + 22.18+ 原生 TS 的参照系
- [Deno](../deno/) —— 默认安全 + JSR 的现代运行时

## 权威链接

- [Bun 官网](https://bun.sh/)
- [Bun 文档](https://bun.com/docs)
- [Bun GitHub](https://github.com/oven-sh/bun)
- [Bun 1.0 发布博客](https://bun.com/blog/bun-v1.0)
- [Bun Benchmark（性能对比）](https://bun.com/docs/benchmark)
- [Jarred Sumner 谈 Bun 性能（演讲）](https://www.youtube.com/watch?v=jY2bDQPIBIQ)
- 本站幻灯片：<a href="/SlideStack/bun-slide/" target="_blank">Bun</a>
