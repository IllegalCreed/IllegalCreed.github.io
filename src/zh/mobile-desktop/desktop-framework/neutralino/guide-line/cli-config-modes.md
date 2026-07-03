---
layout: doc
outline: [2, 3]
---

# Neutralino 的 CLI、配置与运行模式

> 基于 Neutralino v6.x · 核于 2026-07

## 速查

- **`neu` CLI**：`create`（建应用）/ `run`（开发，默认热重载）/ `build`（出 `dist/`）/ `update`（升级二进制与客户端库）/ `version` / `plugins`
- **最短路径**：`npm i -g @neutralinojs/neu` → `neu create myapp` → `neu run` → `neu build --release`
- **配置文件**：`neutralino.config.json`——基础字段 `applicationId` / `version` / `defaultMode` / `port`（`0`=随机，推荐）/ `url` / `documentRoot` / `enableServer` / `enableNativeAPI`
- **安全（重点）**：
  - `tokenSecurity`：**`one-time`（推荐）** token 只下发一次存 `sessionStorage`；`none` 始终下发 = **危险**
  - `nativeAllowList`：**白名单**，只有列出的原生方法可被前端调用，支持通配（如 `'os.*'`）
  - `nativeBlockList`：**黑名单**，禁用指定方法（`cloud` 模式尤其重要）
- **四种模式**（`defaultMode`）：`window`（默认，原生窗口）/ `browser`（默认浏览器打开）/ `cloud`（后台服务，务必收紧权限）/ `chrome`（Chrome app 模式，需预装）
- **构建 flag**：`--release`（便携包）/ `--embed-resources`（单文件可执行）等
- **API 与扩展**：`Neutralino.*` 能调什么由白/黑名单决定；扩展注册也在这个配置里（见[原生 API 与扩展](./api-extensions)）

## 一、`neu` CLI

官方命令行工具，安装 `npm i -g @neutralinojs/neu`（或免全装用 `npx @neutralinojs/neu <cmd>`）。

| 命令 | 作用 | 常用 flag |
| --- | --- | --- |
| `neu create <path>` | 从模板创建应用（二进制名由目录名推导） | `--template <account>/<repo>` 指定 GitHub 模板 |
| `neu run` | 运行当前应用；默认**改资源自动重载** | `--disable-auto-reload`、`--arch=<arch>` |
| `neu build` | 生成 `dist/`（各平台二进制 + resources） | `--release`、`--embed-resources`、`--copy-storage` |
| `neu update` | 更新已有 Neutralino 二进制与客户端库 | `--latest` 拉最新版 |
| `neu version` | 显示 CLI / 项目版本 | — |
| `neu plugins [plugin]` | 管理 CLI 插件 | `--add <pkg>` / `--remove <pkg>` |

## 二、最短上手路径

```bash
npm i -g @neutralinojs/neu
neu create myapp && cd myapp

neu run                 # 开发（热重载）
neu build --release     # 产出便携二进制到 dist/
```

- `neu run` 默认热重载，改前端资源即刷新。
- `neu build --release` 为各平台出便携包；`--embed-resources` 可打成**单文件可执行**。

## 三、`neutralino.config.json`

应用的核心配置文件，主要字段：

```json
{
  "applicationId": "js.neutralino.sample",
  "version": "1.0.0",
  "defaultMode": "window",
  "port": 0,
  "url": "/",
  "documentRoot": "/resources/",
  "enableServer": true,
  "enableNativeAPI": true,
  "tokenSecurity": "one-time",
  "nativeAllowList": ["app.*", "os.*", "debug.log"]
}
```

| 字段 | 说明 |
| --- | --- |
| `applicationId` | 应用唯一 ID（如 `js.neutralino.sample`） |
| `version` | 应用版本 |
| `defaultMode` | 运行模式：`window` / `browser` / `cloud` / `chrome` |
| `port` | 服务端口，`0` = 随机分配（推荐） |
| `url` | 入口（相对 `/` 或绝对 URL） |
| `documentRoot` | 静态资源根目录 |
| `enableServer` | 启用内嵌服务器（交付资源 + 原生 API 消息） |
| `enableNativeAPI` | 允许前端访问原生 API |

> 完整字段（含 `modes.window.*` 窗口设置、`cli.*` 构建设置、`globalVariables` 等）以官方 [Configuration](https://neutralino.js.org/docs/configuration/neutralino.config.json) 为准；部分子字段名随版本演进，建议对照当前版本 schema。

## 四、安全：`tokenSecurity` 与白/黑名单

Neutralino 没有 Tauri 那种「默认拒绝」的强权限模型，安全**靠配置手动收紧**，三个抓手：

### `tokenSecurity`（WebSocket 令牌策略）

- **`one-time`（推荐）**：token 只下发一次，客户端存 `sessionStorage`。外部浏览器拿不到 token 就无法连上后端，显著降低跨客户端攻击面。
- **`none`**：始终下发 token，任何新客户端都能连——**危险**，一旦配合宽松的文件/OS 权限会造成严重风险。

### `nativeAllowList`（白名单，推荐主力）

只有列在里面的原生方法能被前端调用，支持通配 `*`：

```json
"nativeAllowList": ["app.*", "os.*", "storage.*", "debug.log"]
```

默认模板通常放行 `app.*` / `os.*` / `debug.log` 一类基础调用——这就是[入门](../getting-started)里 `os.getEnv` 无需改权限即可用的原因。

### `nativeBlockList`（黑名单）

禁用指定方法，支持通配。在 `cloud` 模式下尤其重要（把危险方法明确挡掉）：

```json
"nativeBlockList": ["filesystem.*", "os.execCommand"]
```

> 原则：**能白名单就白名单**（最小授权）；`cloud` 模式务必再用黑名单兜底。

## 五、四种运行模式

`defaultMode` 决定应用如何运行：

| 模式 | 形态 | 适用 |
| --- | --- | --- |
| **window**（默认） | 原生 OS 窗口，跟随系统主题 | 桌面应用首选 |
| **browser** | 在用户默认浏览器里打开 | 「能调原生操作的 Web 应用」 |
| **cloud** | 作为后台服务进程运行，可暴露到网络 | 轻量服务 / 消息 broker |
| **chrome** | 以 Chrome/Chromium/Edge 的 app 模式运行 | 想要更接近原生的外观（需预装浏览器） |

要点：

- **window** 提供完整窗口能力（`Neutralino.window.*` 仅此模式可用）。
- **cloud** 会把后端暴露出去，**管理员权限会传导给 Web 端**——务必用 `nativeAllowList` / `nativeBlockList` 收紧权限。
- **chrome** 需机器预装 Chrome/Chromium/Edge，可经 `args` 传命令行参数（如 `--disable-web-security`）。

> 详见官方 [Modes](https://neutralino.js.org/docs/configuration/modes)。模式选择配合安全配置一起看——尤其 `cloud`。
