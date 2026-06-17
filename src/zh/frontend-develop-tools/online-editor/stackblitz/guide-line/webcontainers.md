---
layout: doc
outline: [2, 3]
---

# WebContainers 原理与限制

> 基于 developer.stackblitz.com 与 @webcontainer/api 2025–2026 现状编写

## 速查

- **本质**：基于 WebAssembly 的微操作系统，Node.js 运行时**原生跑在浏览器标签页内**（非远程容器、非 Docker、非转译）；npm 包 `@webcontainer/api`
- **vs 云容器**：代码在客户端跑 → 延迟比 localhost 还低、可离线、不按分钟计费、毫秒启动
- **架构**：内存态易失虚拟文件系统 + 虚拟 TCP 网络栈（映射到 ServiceWorker）+ 内置 shell `jsh`
- **能跑**：npm/pnpm/yarn；Vite/Next/Nuxt/Remix/SvelteKit/React Router；WASM；LibSQL/Drizzle
- **不能跑**：原生 addon（默认 `--no-addons`）、原生二进制 / Python / Java 原生
- **网络**：无任意原始 TCP/UDP 出站；npm 装包受 CORS 约束，缺 `package-lock.json` 易失败 / 超时
- **单实例**：`boot()` 只能调一次；多项目同开会 OOM
- 🔴 **跨域隔离硬要求**：承载页必须设 `Cross-Origin-Embedder-Policy: require-corp` + `Cross-Origin-Opener-Policy: same-origin`（因为需要 SharedArrayBuffer）；线上需 HTTPS（localhost 豁免）
- **浏览器**：Chrome/Chromium 完整；Safari ≥16.4 beta；Firefox alpha；移动端不支持
- **授权**：`webcontainer-core` 仓库 LICENSE 是 MIT，但**商用营利性生产使用 WebContainer API 需付费许可**
- **文档**：<https://webcontainers.io/>

## 本质：浏览器内的微操作系统

WebContainers 是一个**基于 WebAssembly 的微型操作系统**，它把 Node.js 运行时**原生编译进浏览器标签页内执行**。这一句话里每个词都重要：

- **不是远程容器**——代码不出你的机器，不存在「连到某台云主机」。
- **不是 Docker / microVM**——没有服务端容器，整个运行时就在当前标签页的 WASM 沙箱里。
- **不是转译 / 模拟**——它跑的是真正的 Node，不是把 Node 代码翻译成别的东西。

对外暴露的能力封装在 npm 包 **`@webcontainer/api`** 里，`stackblitz.com` 与 `bolt.new` 自身就建立在它之上。

平台数据：WebContainers 每月服务 **300 万+ 开发者**。

## 与传统云容器 / 服务端 microVM 的本质差异

这是理解 StackBlitz 一切特性的关键。把它和「CodeSandbox 式服务端 microVM」并排看：

| 维度       | WebContainers（StackBlitz）        | 服务端容器 / microVM（传统在线 IDE）|
| ---------- | ---------------------------------- | ----------------------------------- |
| 代码执行   | **客户端**（你的浏览器标签页）     | 远端服务器                          |
| 延迟       | **比 localhost 还低**（无网络往返）| 受网络往返影响                      |
| 离线       | **可离线**                         | 依赖网络                            |
| 计费       | 用本地算力，**不按分钟计费**       | 按计算分钟计费                      |
| 安全       | 沙箱在标签页内，代码不外传         | 代码上传到远端执行                  |
| 启动       | **毫秒级**                         | 秒级 / 分钟级冷启动                 |

性能数字（官方）：

- 包安装速度 **≥ 5×**
- 构建速度快约 **20%**
- 首页宣称在某些场景下最高 **10×**

::: tip 为什么「比 localhost 还快」
省掉了 SSH / 网络往返，加上虚拟文件系统在内存中，I/O 几乎零开销。对「装依赖 → 跑 dev server」这类高频操作，体感提升最明显。
:::

## 架构组成

WebContainers 内部由三块拼成：

- **虚拟文件系统**：**内存态、易失**。文件按树挂载，**父目录必须先存在**才能往里写文件。刷新标签页 = 文件系统清空。
- **虚拟 TCP 网络栈**：映射到浏览器的 **ServiceWorker**。正因如此，你在 WebContainer 里 `listen` 一个端口就能即时起一个 Node server，预览通过 iframe 渲染、并能拿到可分享的 URL。
- **内置 shell `jsh`**：一个自定义的精简 shell，`/bin` 下只提供一个**精简命令集**。

`jsh` 内置命令大致是：`bash`、`cat`、`cp`、`ls`、`mkdir`、`mv`、`rm`、`sh`、`zsh` 等常用项。

::: warning 不是完整的 coreutils
像 `sleep` 这类命令**不在内置集**里。脚本里若依赖某个冷门 Unix 命令，可能直接「command not found」。需要时改用 Node 脚本或 npm 包实现等价逻辑。
:::

## 能跑什么

官方的判断标准是一句话：**「if your toolchain runs on Node.js, it can run on WebContainers.」**（只要你的工具链跑在 Node 上，它就能跑在 WebContainers 上。）

具体已验证可用：

- **包管理器**：npm / pnpm / yarn
- **框架 / 工具链**：Vite、Next.js、Nuxt、Remix、SvelteKit、React Router 等
- **WASM**：开箱即跑
- **数据库**：LibSQL、Drizzle 等纯 JS / WASM 实现的方案

## 限制（重点）

| 限制               | 表现 / 报错                                                            | 解法                                       |
| ------------------ | --------------------------------------------------------------------- | ------------------------------------------ |
| 不能跑原生 addon   | 默认 `--no-addons`；报 `Cannot load native addon because loading addons is disabled.` | 改用纯 JS / WASM 实现                       |
| 仅 Web 原生语言    | 只能执行 JS + WASM；原生二进制 / Python / Java 原生不行                | 选用编译到 WASM 的方案                      |
| 网络受限           | 无任意原始 TCP/UDP 出站；只有虚拟 TCP → ServiceWorker + 浏览器 fetch   | 经由 fetch / 受支持的协议通信              |
| npm 装包受 CORS    | 缺 `package-lock.json` 易失败 / 超时                                   | 把 lockfile 放进 FS（同时加速启动）        |
| 文件系统易失       | 虚拟 / 内存态；按树挂载，父目录须先存在                                | 关键产物及时落到 GitHub / 导出             |
| 单实例             | `boot()` **只能调一次**；重复（含 HMR 误触）报 `Proxy has been released and is not usable` | 全局只 boot 一次                           |
| 内存有限           | 多项目同开报 `WebAssembly.instantiate(): Out of memory`               | 关掉其他项目后刷新                         |

::: danger `boot()` 只能调一次
WebContainer 是**单实例**模型。在带 HMR 的开发场景里，热更新可能重复触发初始化逻辑，导致第二次 `boot()` 把第一个实例的 Proxy 释放掉，于是报 `Proxy has been released and is not usable`。务必把 `boot()` 放在模块级单例里，确保整个页面生命周期只调用一次。
:::

## 跨域隔离：硬性前置条件

这是嵌入 WebContainers 时**最容易翻车**的一关，必须配置。

WebContainer **需要 `SharedArrayBuffer`**，而浏览器只在页面**跨域隔离（cross-origin isolated）**时才开放 `SharedArrayBuffer`。因此承载页必须返回这两个响应头：

```
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
```

没配会报：

```
SharedArrayBuffer transfer requires self.crossOriginIsolated.
```

::: warning 线上必须 HTTPS
跨域隔离要求安全上下文：**线上环境必须走 HTTPS**，`localhost` 是唯一豁免。
:::

### credentialless 模式

如果 `require-corp` 太严（比如要嵌入大量不带 CORP 头的第三方资源），可改用 **`credentialless`** 模式：响应头用 `credentialless`，并在 boot 时显式声明：

```
Cross-Origin-Embedder-Policy: credentialless
Cross-Origin-Opener-Policy: same-origin
```

```js
import { WebContainer } from "@webcontainer/api";

// 与 credentialless 响应头配套
const instance = await WebContainer.boot({ coep: "credentialless" });
```

### 各平台设头办法

| 平台              | 设头位置                                                            |
| ----------------- | ------------------------------------------------------------------ |
| **Vite**          | `server.headers`（dev）；生产由部署平台设头                        |
| **Vercel**        | `vercel.json` 的 `headers`（`source: "/(.*)"`）                    |
| **Netlify**       | `netlify.toml` 的 `[[headers]]`（`for = "/*"`）                     |
| **Next.js**       | `next.config.js` 的 `async headers()`                              |
| **SvelteKit**     | 在 hooks 里给响应加头，或交给部署适配器 / 平台                     |
| **Nuxt**          | `nuxt.config` 的 `routeRules` / `nitro` 头配置                     |

Vercel 示例：

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cross-Origin-Embedder-Policy", "value": "require-corp" },
        { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" }
      ]
    }
  ]
}
```

Netlify 示例：

```toml
[[headers]]
  for = "/*"
  [headers.values]
    Cross-Origin-Embedder-Policy = "require-corp"
    Cross-Origin-Opener-Policy = "same-origin"
```

## 浏览器支持矩阵

| 浏览器               | 状态           |
| -------------------- | -------------- |
| Chrome / Chromium    | **完整支持**   |
| Safari               | **≥ 16.4**，仍是 Technology Preview / beta |
| Firefox              | **alpha**      |
| 移动端（各平台）     | **不支持**     |

所需底层特性：`SharedArrayBuffer`、`WebAssembly`、**跨域隔离**。Safari 额外还需要 `Atomics.waitAsync` 与正则 lookbehind 支持。

## 商用授权（避免误导）

这一点很关键、也最容易被想当然：

- `stackblitz/webcontainer-core` 仓库的 **LICENSE 是 MIT**。
- **但 MIT ≠ 商用嵌入免费**。真正的运行时引擎由 **StackBlitz 托管**，你嵌入时调用的是它的服务。
- **商用、营利性的生产环境使用 WebContainer API，需要付费许可**；开源项目 / 原型 / 学习用途免费。
- `stackblitz.com`、`bolt.new` 自家产品当然免费用——付费许可针对的是「你把 WebContainer API 嵌进自己的商业产品」。

::: danger 别把 MIT 仓库当成「商用随便用」
看到 `webcontainer-core` 是 MIT 就以为能免费商用，是常见误判。判定是否需要付费，看的是**你的使用场景**（是否营利性生产），而不是某个仓库的 LICENSE 文件。商用前请以官方授权条款为准。
:::

## 排错速查表

| 现象                                            | 原因                                  | 解法                              |
| ----------------------------------------------- | ------------------------------------- | --------------------------------- |
| `SharedArrayBuffer transfer requires self.crossOriginIsolated.` | 缺 COOP/COEP 头（常因 304 缓存丢头）  | 设头 + 硬刷新（绕过缓存）         |
| `Proxy has been released and is not usable`     | 多次调用 `boot()`（含 HMR 误触）      | 全局只 boot 一次                  |
| CORS / 装包超时                                 | 缺 `package-lock.json`                | 把 lockfile 放进虚拟 FS           |
| `WebAssembly.instantiate(): Out of memory`      | 多项目同开耗尽内存                    | 关闭其他项目后刷新                |
| `Cannot load native addon ...`                  | 试图加载原生 addon                    | 改用纯 JS / WASM 实现             |
