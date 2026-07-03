---
layout: doc
outline: [2, 3]
---

# Wails 构建与工程化

> 基于 Wails v2.12（v3 alpha）· 核于 2026-07

## 速查

- **CLI（v2 命令名 `wails`）**：`wails init` 建项目、`wails dev` 热重载开发、`wails build` 出单二进制、`wails generate module` 生成绑定、`wails doctor` 体检、`wails version/update` 版本/升级
- **建项目**：`wails init -n name -t vue`（`-t` 选模板，默认 vanilla；`-g` 初始化 git；`-ide vscode`）
- **开发**：`wails dev` 编译运行 + 监听（改 `.go` 触发**重建**、改前端资源触发**热重载**）；dev server 起在 `http://localhost:34115`，可用浏览器 + 扩展调试；接 Vite 用 `-frontenddevserverurl`，`-s` 跳过前端构建
- **打包**：`wails build`（`-clean` 清缓存、`-upx` 压缩、`-nsis` Win 安装包、`-obfuscated` garble 混淆、`-platform windows/arm64` 指定目标）
- **wails.json 关键字段**：`name`、`frontend:install`（如 `npm install`）、`frontend:build`（如 `npm run build`）、`frontend:dev:serverUrl`（设 `auto` 自动探测 Vite）、`wailsjsdir`、`outputfilename`、`info.*`（productName/version/copyright/fileAssociations/protocols）、`obfuscated`、`bindings.ts_generation`
- **前端「零介入」**：Wails 只按 `wails.json` 的 `frontend:install` / `frontend:build` 两个命令处理前端；不给就完全不碰
- **v3 构建不同**：命令名 `wails3`，构建改由 **Taskfile** 驱动（`wails3 build` 是薄封装、`wails3 task <name>` 跑任意任务）——见 [v2 与 v3](./v2-vs-v3)

## 一、CLI 全景（v2）

Wails 的开发流程全部由 CLI 驱动。**v2 命令名是 `wails`**（v3 是 `wails3`，二者可共存）：

| 命令 | 作用 | 关键 flag |
| --- | --- | --- |
| `wails init` | 从模板建项目 | `-n` 名字、`-t` 模板（默认 vanilla）、`-g` 初始化 git、`-ide vscode` |
| `wails dev` | 热重载开发 | `-frontenddevserverurl`（接 Vite）、`-s`（跳过前端构建） |
| `wails build` | 打生产单二进制 | `-clean`、`-upx`、`-nsis`、`-obfuscated`、`-platform` |
| `wails generate module` | 手动生成 `wailsjs` 绑定 | |
| `wails doctor` | 体检环境依赖 | |
| `wails version` / `wails update` | 查版本 / 升级 CLI | |

## 二、建项目：wails init

```bash
# -t 选前端模板：vanilla（默认）/vue/react/svelte/preact/lit，均有 JS 与 TS 两版
wails init -n myapp -t vue

# 也可初始化 git、指定 IDE 配置
wails init -n myapp -t react-ts -g -ide vscode
```

生成的项目是标准的 Go module + 一个 `frontend/` 目录，后端为 `main.go` + `app.go`（见[入门](../getting-started)）。

## 三、开发：wails dev 与热重载

`wails dev` 是日常开发主循环，它会：

1. 更新 `go.mod` 对齐 CLI 版本 → 编译并运行应用。
2. **文件监听**：默认监听 `.go` 文件，改动触发**重建**；改前端资源触发**热重载**（debounce 默认 100ms）。
3. 起一个 dev server 于 **`http://localhost:34115`**，可用**普通浏览器 + 浏览器扩展**调试前端。
4. 自动生成 `wailsjs/` 绑定模块。

```bash
wails dev                                   # 标准热重载开发
wails dev -s                                # 跳过前端构建（前端已单独跑时）
wails dev -frontenddevserverurl auto        # 接入外部框架 dev server（如 Vite）
```

接外部框架 dev server（Vite/CRA）时，配合 `wails.json` 的 `frontend:dev:serverUrl` 与 `frontend:dev:watcher` 使用。

## 四、打包：wails build

```bash
wails build                                  # 出当前平台单二进制
wails build -clean -upx                      # 清缓存 + UPX 压缩体积
wails build -nsis                            # 额外产出 Windows NSIS 安装包
wails build -obfuscated                      # 用 garble 混淆
wails build -platform windows/arm64          # 交叉指定目标平台/架构
```

产物是**单一可执行文件**（前端资源已由 `embed.FS` 嵌入，见[架构](./architecture)）。Windows 打包**无需 CGO、无需附带外部 DLL**，但目标机需装 WebView2 运行时。

## 五、wails.json：项目配置

`wails.json` 是项目根的配置文件，决定 Wails 如何处理前端与打包。**关键点：Wails 对前端「零介入」，只跑你在这里声明的两个命令**：

```json
{
  "name": "myapp",
  "frontend:install": "npm install",
  "frontend:build": "npm run build",
  "frontend:dev:serverUrl": "auto",
  "wailsjsdir": "./frontend",
  "outputfilename": "myapp",
  "info": {
    "productName": "My App",
    "productVersion": "1.0.0",
    "copyright": "© 2026"
  }
}
```

常用字段速记：

- **前端相关**：`frontend:dir`、`frontend:install`（装依赖命令）、`frontend:build`（打包命令）、`frontend:dev:watcher`、`frontend:dev:serverUrl`（设 `auto` 从 Vite 输出自动探测）。不给 install/build 则 Wails 完全不碰前端。
- **产物相关**：`wailsjsdir`（绑定生成位置）、`outputfilename`、`obfuscated`。
- **应用信息 `info.*`**：`productName`/`productVersion`/`copyright`，以及 `fileAssociations`（文件关联）、`protocols`（自定义 URI 协议）。
- **绑定生成 `bindings.ts_generation`**：`prefix`/`suffix`/`outputType`（`classes` 或 `interfaces`）。

## 六、AssetsHandler：动态资源

除了静态 `embed.FS`，可给 AssetServer 挂一个可选的 `http.Handler`：GET 请求先查 `embed.FS`，找不到再转交 handler（用于动态生成文件、处理 POST/PUT）；也可把 `Assets` 设 `nil` 只用 handler。适合需要在 Go 侧动态产出资源的场景。

## 七、v3 的构建差异（简述）

v3 把构建从「黑盒 CLI」改成 **Taskfile 编排**：

- 命令名是 **`wails3`**；`wails3 build` 只是 Taskfile `build` 任务的**薄封装**。
- 图标生成、manifest 等被拆成独立 CLI tool 命令，由 `Taskfile.yml` 串联，可完全自定义（甚至换成 make）。
- `wails3 task <name>` 可跑任意 Taskfile 任务，`wails3 generate bindings` 用静态分析生成绑定。

> v3 仍 alpha、未 GA，其工程化细节可能变动，生产构建请用 v2——完整对照见 [v2 与 v3](./v2-vs-v3)。
