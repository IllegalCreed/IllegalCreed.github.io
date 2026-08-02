---
layout: doc
outline: [2, 3]
---

# 安全与 TypeScript：权限沙箱与原生 TS

> 基于 Deno 2.x（V8 + Rust）· 核于 2026-08

## 速查

- **默认拒绝（deny-by-default）**：Deno 进程启动时无任何权限，所有敏感操作（文件/网络/子进程/环境变量/系统信息/FFI）都需 `--allow-*` 显式授权。这是与 Node「默认允许」的根本差异。
- **权限维度**：`--allow-read`/`--allow-write`（文件，可限路径）、`--allow-net`（网络，可限域名）、`--allow-env`（环境变量）、`--allow-run`（子进程，可限命令）、`--allow-sys`（系统信息）、`--allow-ffi`（FFI）、`--allow-hrtime`（高精度时间，防时序攻击）、`--allow-all`/`-A`（全开）。
- **`--deny-*` 显式拒绝**：`--deny-env`/`--deny-net` 等可显式禁止某些权限，优先级高于 `--allow-*`——即便 `-A` 全开，加 `--deny-run` 仍禁子进程。用于「全开但锁死某项」。
- **权限提示**：未授权时代码触发权限请求，Deno 默认报 PermissionDenied 终止；`--prompt`（交互）让用户运行时逐个确认（适合开发）。
- **程序内查询**：`Deno.permissions.query({ name: 'read', path: '/etc' })` 查询当前权限状态；`Deno.permissions.request(...)` 请求授权（需 `--prompt` 或 unstable）。
- **原生 TS（无需配置）**：Deno 内置 swc 编译器，`deno run app.ts` 自动编译执行 TS，无需 ts-node/tsx/tsconfig。
- **类型检查**：`deno check app.ts` 做完整类型检查（基于 TypeScript 编译器）；运行时默认不做检查（性能优先），但 CI 里应跑 `deno check`。
- **deno.json 配置**：可选的配置文件，定义 tasks/imports/lint/fmt/compilerOptions，不强制（零配置也能跑）。
- **OpenTelemetry 内置**（2.2+）：环境变量 `DENO_UNSTABLE_OTEL=1` 开启，自动导出 trace/metrics 到 OTLP collector，无需第三方 instrumentation 库。

## 一、权限沙箱机制详解

Deno 的权限沙箱由 Rust 运行时强制执行，所有敏感系统调用都要先过权限检查：

| 权限 | 标志 | 限制范围 | 典型 API |
| --- | --- | --- | --- |
| 文件读 | `--allow-read` | 可限路径 | `Deno.readTextFile`、`node:fs.readFile` |
| 文件写 | `--allow-write` | 可限路径 | `Deno.writeTextFile` |
| 网络 | `--allow-net` | 可限域名/IP | `fetch`、`Deno.listen`、`node:http` |
| 子进程 | `--allow-run` | 可限命令 | `Deno.Command`、`node:child_process` |
| 环境变量 | `--allow-env` | 可限变量名 | `Deno.env.get`、`process.env` |
| 系统信息 | `--allow-sys` | —— | `Deno.osUptime`、`Deno.systemMemoryInfo` |
| FFI | `--allow-ffi` | —— | `Deno.dlopen`（调本地 .so/.dylib，高危） |
| 高精度时间 | `--allow-hrtime` | —— | `performance.now()` 纳秒级（防时序侧信道攻击） |

- **最小权限原则**：只授予代码实际需要的权限。如只读不写、只连白名单域名。`--allow-net=github.com,deno.land` 限定域名；`--allow-read=/app/data` 限定路径。
- **deny 优先于 allow**：`--allow-all --deny-run=rm,sh` 表示全开但禁起 rm/sh——用于「大部分开放但锁死高危操作」。
- **第三方依赖受同样约束**：你 `npm:install` 的包想偷读 `~/.ssh`？没 `--allow-read=~/.ssh` 就报错。这是 Deno 防供应链攻击的核心。

## 二、程序内权限管理

Deno 提供 API 在运行时查询/请求权限，实现「按需申请」（类似移动端的权限弹窗）：

```ts
// 查询当前是否有读 /app/data 的权限
const status = await Deno.permissions.query({
  name: 'read',
  path: '/app/data',
});
if (status.state !== 'granted') {
  // 请求授权（需 --prompt 或在交互终端）
  const req = await Deno.permissions.request({ name: 'read', path: '/app/data' });
  if (req.state !== 'granted') {
    throw new Error('需要读权限');
  }
}
const data = await Deno.readTextFile('/app/data/config.json');
```

- **query**：查询权限状态（granted/denied/prompt），不弹窗，安全。
- **request**：请求授权，在交互终端会弹确认（`--prompt`），CI/非交互则直接 deny。
- **revoke**：`Deno.permissions.revoke({ name: 'net' })` 运行时撤销权限（用完即收回，最小化窗口）。
- **适用场景**：CLI 工具按需申请权限（而不是一开始全开），让用户清楚每次授权的目的。

## 三、原生 TypeScript 执行

Deno 的 TS 支持是「零配置」的，与 Node 22.18+ 的「类型剥离」有本质区别：

| 维度 | Deno 原生 TS | Node 22.18+ 类型剥离 |
| --- | --- | --- |
| 实现 | swc 完整编译 | 文本级剥离类型 |
| 类型检查 | `deno check` 完整检查 | 不检查（靠 tsc/IDE） |
| 语法变换 | 支持 enum/decorator 等 | 默认只剥离，enum 需额外 flag |
| 配置 | 无需 tsconfig | 无需 tsconfig |
| 历史 | 2020 起原生支持 | 2025（22.18）起默认 |

- **编译原理**：Deno 用 **swc**（Rust 写的超快 TS/JS 编译器）在加载 .ts 文件时编译成 JS 再交 V8 执行。编译结果有缓存（`~/.cache/deno`），二次运行快。
- **类型检查分离**：`deno run` 默认**不做类型检查**（性能优先，类型错误不阻止运行）；`deno check` 单独做完整检查。CI 流水线应跑 `deno check` 保证类型正确。
- **TS 配置**：不需要 `tsconfig.json`。可用 `deno.json` 的 `compilerOptions` 微调（如 `strict`、`jsx`），但绝大多数情况默认值就够。

## 四、内置工具链与 OpenTelemetry

Deno 把常用开发工具都内置，消除「配 prettier+eslint+jest+tsc+...」的碎片化：

| 命令 | 作用 | 替代的第三方工具 |
| --- | --- | --- |
| `deno fmt` | 格式化代码 | prettier |
| `deno lint` | 静态检查 | eslint |
| `deno test` | 测试运行器 | jest/mocha |
| `deno check` | TS 类型检查 | tsc --noEmit |
| `deno compile` | 编译成单一二进制 | pkg/nexe |
| `deno bundle` | 打包成单文件 | esbuild/rollup |
| `deno serve` | 起HTTP服务 | 自写 http.createServer |
| `deno task` | 任务运行器 | npm scripts |
| `deno init` | 初始化项目 | 手建配置 |

**OpenTelemetry 内置**（Deno 2.2 引入，2.4 稳定）是云原生的关键能力：

```bash
# 开启 OpenTelemetry，导出到 OTLP collector
DENO_UNSTABLE_OTEL=1 OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317 \
  deno run --allow-net app.ts
```

- **零侵入**：Deno 自动对 `fetch`、`Deno.serve`、`Deno.openKv` 等做 instrumentation，生成 trace span 与 metrics，无需改业务代码。
- **标准协议**：导出 OTLP（OpenTelemetry Protocol），兼容 Jaeger/Tempo/Prometheus/Honeycomb 等后端。
- **与 Node 对比**：Node 要装 `@opentelemetry/*` 一堆库并手动 patch；Deno 内置即开即用，大幅降低可观测性门槛。

## 交互演示

本叶无专门可视化。建议实操：写一个 `app.ts`（用 `fetch` 读远程 API + 用 `Deno.writeTextFile` 写本地），不加任何 `--allow-*` 运行，观察 PermissionDenied 报错；再逐步加 `--allow-net=...` `--allow-write=...`，体会最小权限。

## 下一步

掌握了 Deno 的安全模型与原生 TS 后，对照 [Node.js](../../nodejs/)（默认允许 + 22.18+ 类型剥离）与 [Bun](../../bun/)（全能工具链 + 极致性能）的对应设计，理解三大运行时在「安全/TS/工具链」三个维度的取舍。
