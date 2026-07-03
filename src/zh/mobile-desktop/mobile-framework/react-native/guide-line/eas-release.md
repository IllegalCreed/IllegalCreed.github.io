---
layout: doc
outline: [2, 3]
---

# React Native 的 EAS 与发布

> 基于 React Native 0.86 · Expo SDK 57 · 核于 2026-07

## 速查

- **EAS = Expo Application Services**：云端 **Build**（出 iOS/Android 二进制、自动管签名）+ **Submit**（自动上架 App Store/Play）+ **Update**（OTA 热更新）
- **EAS Build**：`eas.json` 定义 profiles（development/preview/production）；`eas build --platform all`；`--local` 本地构建
- **EAS Update（OTA）**：靠 `expo-updates` 推**非原生**改动
  - ✅ 可 OTA：**JS 代码、样式布局、文案/翻译、图片资源、灰度**
  - ❌ 不可 OTA：**原生代码/依赖、权限、Expo SDK 升级**、任何需新二进制的
- **Runtime Version**：保证 OTA 只发给**原生代码兼容**的构建；原生变了要升它
- **OTA 合规（苹果）**：允许下发解释型代码（JS），但**不得改变 App 主要用途、不得绕过审核**做实质功能变更
- **裸 RN 发布**：Android 出 **AAB**（Play 要求）`bundleRelease`；iOS Xcode Archive → App Store Connect / TestFlight（需 Apple 开发者账号 + 证书/描述文件）
- **热更新纪律**：OTA 用于「审核之间快速修复」；重大行为变更仍需过审

## 一、EAS 全景

EAS（Expo Application Services）是 Expo 的云服务三件套：

- **EAS Build**：云端构建 iOS/Android 二进制（Android 跑 Linux、iOS 跑 Expo 的 macOS 云），**自动管理签名**（Android keystore、iOS 证书/描述文件），也可带自有凭据。
- **EAS Submit**：自动把构建产物提交到 App Store / Google Play。
- **EAS Update**：OTA 热更新，推送**非原生**改动。

```bash
# 构建（profiles 定义在 eas.json：development / preview / production）
eas build --platform all
eas build --platform ios --local        # 本地构建

# 上架
eas submit --platform android

# OTA 更新
npx expo install expo-updates
eas update:configure
eas update --channel production --message "修复登录页文案"
```

## 二、EAS Update（OTA）能下发什么、不能下发什么

OTA（Over-The-Air）靠 `expo-updates` 库把更新推给已安装的 App，但**只覆盖非原生层**：

| 可 OTA ✅ | 不可 OTA ❌ |
| --- | --- |
| JS 代码 | 原生代码 / 原生依赖 |
| 样式、布局 | 权限变更 |
| 文案、翻译 | Expo SDK 版本升级 |
| 图片等资源 | 任何需要重新出原生二进制的改动 |
| 灰度 / 分发渠道 | — |

JS 侧可用 `useUpdates()` / `checkForUpdateAsync()` / `fetchUpdateAsync()` 主动检查与拉取，支持 republish 回滚。

## 三、Runtime Version（运行时版本）

Runtime Version 是 **OTA 更新与原生二进制之间的兼容契约**：

- 它**确保一次 OTA 更新只发给原生代码与之兼容的构建**。
- 当原生层变化（升 SDK、加原生依赖）时**应提升 runtime version**，避免把依赖新原生能力的 JS 更新推给旧二进制而崩溃。

## 四、OTA 合规边界（苹果政策）

苹果允许 App 下发**解释型代码（JavaScript）**的更新，但有明确边界：

- **不得改变 App 的主要用途 / 功能类别**。
- **不得**借 OTA 下发原生二进制或**绕过审核**做实质功能变更。
- OTA 适合「**审核之间的快速修复与迭代**」；重大行为变更仍需走商店审核。
- Runtime Version 保证 OTA 只发给兼容的原生构建，是合规落地的技术保障。

## 五、裸 RN 的发布路径

不走 EAS 时，需自行处理构建与签名：

- **Android**：生成签名 keystore → `assembleRelease`（APK，多用于内部分发）/ `bundleRelease`（**AAB**，Google Play 要求）。
- **iOS**：Xcode **Archive** → 上传 App Store Connect / TestFlight；需 **Apple 开发者账号** + 证书（certificate）+ 描述文件（provisioning profile）。

> 用 Expo 时，上述签名与出包都由 EAS 托管，通常无需手工处理证书。
