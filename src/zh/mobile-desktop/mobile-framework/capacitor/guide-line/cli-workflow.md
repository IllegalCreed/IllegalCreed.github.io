---
layout: doc
outline: [2, 3]
---

# Capacitor CLI 与工作流

> 基于 Capacitor 8 · 核于 2026-07

## 速查

- **本地 CLI**：全部经 `npx cap <cmd>`（项目内、版本随项目锁定），不是全局 CLI
- **命令**：`init`（初始化）、`add`（加平台）、`copy`/`update`/`sync`、`open`（开 IDE）、`run`（跑设备）、`build`（出签名包）、`ls`/`doctor`/`migrate`
- **copy vs update vs sync（高频考点）**：`copy`=搬 webDir 资产+配置；`update`=更新原生插件/依赖(Pods/Gradle)；`sync`=**copy+update**
- **顺序铁律**：**先 `npm run build`（产出 webDir）→ 再 `cap copy/sync`**——Capacitor 不构建 Web，只搬产物
- **Live Reload**：让 WebView 从 dev server 加载；推荐 `ionic cap run android -l --external`，或手动配 `server.url` + `cleartext`

## 一、copy vs update vs sync

这是最容易混淆的三个命令：

| 命令 | 做什么 | 何时用 |
| --- | --- | --- |
| `npx cap copy [platform]` | 把 **webDir 的 Web 构建产物** + capacitor 配置拷进原生工程 | **每次改了 Web 代码或配置**后（快） |
| `npx cap update [platform]` | 更新 `package.json` 引用的**原生插件与依赖**（重跑 Pods/Gradle） | **装/删/升级插件**后 |
| `npx cap sync [platform]` | **= copy + update**（先 copy 再 update） | 一把梭 / 拉取他人改动 / 加平台后 |

记忆：**copy = 搬 Web 资产；update = 装原生依赖；sync = 两者合一**。日常仅改 Web 代码时 `copy` 最快；动了插件才需 `update`（或直接 `sync`）。

`sync`/`update` 支持 `--deployment`（iOS `pod install --deployment`、不删 `Podfile.lock`）、`--inline`（内联 JS sourcemap 便于调试 Android WebView）；均有 `capacitor:sync:before/after` 等 hooks。

## 二、完整命令一览

```bash
npx cap init                    # 初始化（appId / appName / webDir）
npx cap add ios | android       # 加平台（生成源码工程，入库）
npx cap copy                    # 搬 Web 资产 + 配置
npx cap update                  # 更新原生插件/依赖
npx cap sync                    # copy + update
npx cap open ios | android      # 开 Xcode / Android Studio
npx cap run ios | android       # 跑真机/模拟器（debug）
npx cap build android           # 出签名包（AAB/APK/IPA）
npx cap ls                      # 列平台/插件
npx cap doctor                  # 体检配置
npx cap migrate                 # 跨大版本升级辅助
```

## 三、日常循环（顺序是重点）

```bash
npm run build          # 1) 前端框架构建 → 产出到 webDir（Capacitor 不做这步）
npx cap sync           # 2) 同步到原生
npx cap open ios       # 3) 开 IDE 或 npx cap run 直接跑
```

**为什么顺序不能反**：Capacitor 只把 `webDir` 里已构建好的产物搬进原生工程，它**不负责构建 Web**。若不先 `npm run build`，搬进去的就是旧产物（或空目录 → 报「unable to find the web assets directory」）。

## 四、Live Reload（热重载到真机）

让 WebView **从开发服务器加载**而非本地 `webDir`，改 Web 代码即时刷新，无需重打原生包。

```bash
# 推荐（Ionic CLI，自动写/清 server 配置）
npm i -g @ionic/cli native-run
ionic cap run android -l --external
```

手动方式（纯 Capacitor CLI）：查本机局域网 IP → dev server 绑 `0.0.0.0` → 在 `capacitor.config` 配 `server.url`：

```json
{ "server": { "url": "http://192.168.1.68:8100", "cleartext": true } }
```

再 `npx cap copy` → `npx cap open`。前提：手机与电脑同一 Wi-Fi、可经 IP 访问。用完记得移除 `server.url`，否则打包会仍指向 dev server。
