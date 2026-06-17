---
layout: doc
outline: [2, 3]
---

# 嵌入与边界

> 基于 snack.expo.dev 与 Expo 官方文档 2025–2026 现状编写

## 速查

- **嵌入两法**：① **embed.js 脚本**（`data-snack-*` 属性，自动转 iframe）② **URL / iframe**（`/embedded/{id}` + 查询参数）
- **embed.js**：在含 `data-snack-id` 或 `data-snack-code` 的元素上写属性，页尾加 `<script async src="https://snack.expo.dev/embed.js">`，脚本扫描 DOM 替换成 iframe
- ⚠️ **所有属性值 / 参数值都要 URL 编码**（用 `encodeURIComponent`）
- ⚠️ **`platform` 默认 `web`**（一显示就运行）；取值 `ios` / `android` / `web` / `mydevice`
- 🔴 **`preview` 两套默认值别记混**：**embed.js 下默认 `true`**，**URL 嵌入下默认 `false`**
- 🔴 **`data-snack-id` 一旦设置**，`code` / `dependencies` 被**忽略**
- **加载已存 Snack**：`snack.expo.dev/{id}`；极简嵌入：`snack.expo.dev/embedded/{id}`
- **真实案例**：React Native 官方文档（reactnative.dev）用 Snack embed 做 live preview
- 🔴 **边界**：自定义原生模块 / config plugin / 上架构建**必须落本地 + EAS Build / dev client**——Snack **不构建二进制**
- **文档**：<https://github.com/expo/snack/blob/main/docs/embedding-snacks.md>

## 嵌入方式 A：embed.js 脚本（推荐）

最省事的嵌入法：在页面里放一个带 `data-snack-*` 属性的 `<div>`，再在页尾引入 `embed.js`。脚本会扫描 DOM，把所有含 `data-snack-id` 或 `data-snack-code` 的元素**替换成 `<iframe>`**，并把 `data-snack-*` 属性映射成对应的 URL 参数。

```html
<!-- 嵌入一个已保存的 Snack（用 id） -->
<div
  data-snack-id="@react-navigation/basic-scrollview-tab-v3"
  data-snack-platform="web"
  data-snack-preview="true"
  data-snack-theme="light"
  data-snack-loading="lazy"
  style="overflow:hidden;background:#fafafa;border:1px solid rgba(0,0,0,.08);border-radius:4px;height:505px;width:100%">
</div>

<!-- 或：嵌入内联代码的 Snack（所有值都要 URL 编码） -->
<div
  data-snack-code="console.log('hello%20world')%3B"
  data-snack-dependencies="expo-constants%2Clodash%404"
  data-snack-name="My%20Snack"
  data-snack-preview="true"
  data-snack-platform="ios"
  style="...height:505px;width:100%"></div>

<!-- 页尾引入一次即可，扫描全页 -->
<script async src="https://snack.expo.dev/embed.js"></script>
```

::: warning 所有属性值都要 URL 编码
注意上面内联代码里的 `%20`（空格）、`%3B`（分号）、`%2C`（逗号）、`%40`（@）——`data-snack-*` 的值都必须经过 **`encodeURIComponent`** 编码，否则解析会出错。
:::

::: danger `data-snack-id` 设了，`code` / `dependencies` 就被忽略
一旦提供 `data-snack-id`（引用一个已存在的 Snack），`data-snack-code` 和 `data-snack-dependencies` 会被**直接忽略**——内容以那个已存 Snack 为准。要嵌「内联代码」就别同时设 id。
:::

完整的 `data-snack-*` 属性表见「参考」页。

## 嵌入方式 B：URL / iframe 参数

不想用脚本时，可直接拿一个 URL 当链接或塞进 `<iframe src>`：

| 用途                | URL                                                |
| ------------------- | -------------------------------------------------- |
| 主站                | `https://snack.expo.dev`                           |
| 极简嵌入页          | `https://snack.expo.dev/embedded`                  |
| 加载已存 Snack      | `https://snack.expo.dev/{id}`                      |
| 极简嵌入 + 已存     | `https://snack.expo.dev/embedded/{id}`             |

```
https://snack.expo.dev/?platform=android&name=Hello%20World&dependencies=lodash%404&theme=dark
```

URL 查询参数（`code` / `dependencies` / `files` / `platform` / `preview` / `sdkVersion` / `theme` / `sourceUrl` 等）的完整列表见「参考」页；同样地，**所有值都要 URL 编码**。

::: danger `preview` 的默认值：两套嵌入法不一样
这是最容易记混的一点：

- 用 **embed.js**（`data-snack-preview`）时，`preview` **默认 `true`**（默认显示预览面板）。
- 用 **URL 嵌入页**（`?preview=`）时，`preview` **默认 `false`**（默认不显示预览面板）。

而 `platform` 在两边都**默认 `web`**（一显示就在浏览器里运行）。别把这两套默认值记混。
:::

::: tip 官方文档自己就在用
React Native 官方文档（reactnative.dev）的「live preview」可运行示例，正是用 Snack embed 做的——这是 Snack 嵌入能力最有说服力的实战案例。
:::

## 与 EAS / 本地开发的边界

Snack 强大，但有清晰的能力天花板。理解这条边界，能避免「为什么我的库 / 功能在 Snack 里跑不起来」的困惑。

**Snack 适合**：demo、教学、快速试 API/库、bug 最小复现、零安装入门。Expo 官方把它定位为「**零本地配置地试用 Expo**」。

**Snack 跑不了、必须落本地的能力**：

| 需求                                    | 为什么 Snack 不行                          | 该用什么                          |
| --------------------------------------- | ------------------------------------------ | --------------------------------- |
| 自定义原生模块 / 链接原生库             | 要重新编译原生二进制（development build）  | 本地项目 + **EAS Build / dev client** |
| config plugin / `prebuild`              | 同样需要原生编译                           | 本地项目 + EAS Build              |
| 生产构建 / 签名 / 上架提交              | Snack **不产出可上架的 app**、不做生产构建 | **EAS Build / EAS Submit**        |
| 特定原生 SDK 集成                       | 超出 Expo Go 预置原生模块范围              | 本地项目 + 自定义 dev client      |

::: danger Snack 不构建二进制
Snack 在真机上跑在 **Expo Go 的预置 runtime**，只能用「Expo SDK 自带的原生模块 + 纯 JS 包」。任何需要自定义原生 / config plugin / 重新编译的场景，Snack 都做不到——因为它**根本不构建原生二进制**。这类需求必须落到本地项目并用 **EAS Build / custom development client**。
:::

::: tip 心智模型（一句话）
**Snack = 浏览器里的 Expo Go playground**，吃「预编译 runtime」，只能 JS + Expo 自带原生模块；一旦要自定义原生 / config plugin / 上架构建，就必须 `npx create-expo-app` 建本地项目 + EAS。
:::

一个佐证：Expo 官方的本地环境搭建文档（`get-started/set-up-your-environment`）**完全没提 Snack**，只讲 Expo Go 与 development build——这印证了「Snack = 浏览器快速试玩」与「本地 = 真项目开发」是两条分流的路。

::: warning Snack 的 Expo Go 限制 = 本地 Expo Go 的限制
Snack 的真机预览和你在本地用 Expo Go 预览，**共享同一个限制根源**（都吃预置 runtime）。区别只在代码来源：Snack 是云端、本地是 Metro。所以「本地 Expo Go 也跑不了的原生库」，在 Snack 里同样跑不了——这不是 Snack 的额外缺陷，而是 Expo Go 模型本身的边界。
:::
