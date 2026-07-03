---
layout: doc
outline: [2, 3]
---

# 四文件结构与 WXS

> 基于微信小程序（基础库 3.x）· 核于 2026-07

## 速查

- **四文件（每个页面/组件一套）**：`.wxml`(结构，类比 HTML) · `.wxss`(样式，类比 CSS) · `.js`(逻辑，`Page()`/`Component()`) · `.json`(配置，**纯 JSON 不能写注释/逻辑**)
- **全局三文件（根目录）**：`app.js`(`App({})` 全局实例 + `globalData`) · `app.json`(全局配置：`pages`/`window`/`tabBar`/`subPackages`/`renderer`) · `app.wxss`(全局样式)
- **`app.json` 关键字段**：`pages`(路由数组，**第一项＝首页**)、`window`(导航栏/背景)、`tabBar`(底部标签)、`subPackages`(分包)、`renderer`(skyline)、`permission`/`requiredPrivateInfos`(隐私声明)
- **WXML**：内建**组件**非 HTML 标签；Mustache 双花括号数据绑定；`wx:for` + **`wx:key` 必填**；`wx:if`(渲染开销大) vs `hidden`(仅显隐)；`import`(引 template)/`include`(引 WXML 片段)
- **WXSS**：核心特色单位 **`rpx`**（**屏幕宽恒 750rpx**，iPhone6 下 1rpx=0.5px）；支持大部分 CSS 但**部分选择器受限**、`background-image` **不能用本地图**（需网络图/base64）；`@import` 可引样式
- **WXS**：小程序**独有的脚本语言**（非 JS，语法子集），运行在**渲染层**，用于 WXML 内联处理，避免频繁跨线程调逻辑层；**Skyline 下 WXS 变异步 → 动画改用 Worklet**
- **页面文件优先级**：页面 `.wxss` 覆盖 `app.wxss`；页面 `.json` 可覆盖全局 `window`；用组件的页面须在 `.json` 里 `usingComponents` 声明

## 一、四文件：职责分离

小程序把每个「页面 / 组件」拆成四类文件，各司其职：

| 后缀 | 全称 | 类比 Web | 职责 |
| --- | --- | --- | --- |
| `.wxml` | WeXin Markup Language | HTML | 页面结构；标签是**组件**（`view`/`text`），支持数据绑定、`wx:for`/`wx:if` |
| `.wxss` | WeXin Style Sheet | CSS | 样式；新增 **`rpx`** 响应式单位；支持 `@import` |
| `.js` | JavaScript | JS | 逻辑；注册 `Page()`/`Component()`，处理事件、调 `wx.*`、`setData` |
| `.json` | 配置 | — | 静态配置；**纯 JSON，不能写注释 / 逻辑** |

关键区别于 Web：`.wxml` 里写的不是 HTML 标签而是小程序**内建组件**（渲染层解析成原生视图或 WebView 节点）；`.json` 是**纯数据配置**，任何注释或表达式都会导致解析失败。

## 二、全局文件 vs 页面文件

**全局层（根目录，共 3 个）**：

- **`app.js`**：用 `App({})` 注册小程序实例——全局生命周期（`onLaunch` / `onShow` / `onHide` / `onError`）与全局数据 `globalData`。
- **`app.json`**：全局配置（下节详述）。
- **`app.wxss`**：全局样式，作用于所有页面。

**页面层（每个页面一套四文件）**：`page.js`（`Page({})`）、`page.wxml`、`page.wxss`、`page.json`。页面 `.wxss` 优先级高于 `app.wxss`；页面 `.json` 可覆盖全局 `window`，并在其中用 `usingComponents` 声明所引组件。

**其他辅助文件**：`project.config.json`（开发者工具项目配置）、`sitemap.json`（搜索索引配置）。

## 三、`app.json`：全局配置的中枢

`app.json` 决定了整个小程序的路由、窗口、标签栏、分包与渲染引擎：

```json
{
  "pages": [
    "pages/index/index",
    "pages/logs/logs"
  ],
  "window": {
    "navigationBarTitleText": "首页",
    "navigationBarBackgroundColor": "#ffffff"
  },
  "tabBar": {
    "list": [
      { "pagePath": "pages/index/index", "text": "首页" },
      { "pagePath": "pages/logs/logs", "text": "日志" }
    ]
  },
  "renderer": "skyline",
  "componentFramework": "glass-easel"
}
```

- **`pages`**：页面路由数组，**第一项即首页**；新增页面须在此登记。
- **`window`**：默认窗口（导航栏标题 / 颜色、背景等），页面 `.json` 可覆盖。
- **`tabBar`**：底部标签栏；**tabBar 页面必须在主包**，且不能用 `navigateTo`/`redirectTo` 跳转（详见[生命周期·API·事件](./lifecycle-api)）。
- **`subPackages`**：分包配置（详见[分包与云开发](./subpackage-cloud)）。
- **`renderer` / `componentFramework`**：切 Skyline 引擎（详见[Skyline 与性能优化](./skyline-perf)）。
- **`permission` / `requiredPrivateInfos`**：地理位置等隐私能力的声明。

## 四、WXML：结构与绑定

WXML 用数据绑定与指令描述界面。**凡出现 Mustache 双花括号的片段都放在代码块里**（下同），列表渲染务必带 `wx:key`：

```html
<!-- 数据绑定：Mustache 双花括号，支持三元/运算/拼接 -->
<view id="item-{{ id }}">{{ user.name }}</view>

<!-- 列表渲染：wx:key 必填（提升 diff 性能） -->
<view wx:for="{{ list }}" wx:key="id">{{ index }}: {{ item.name }}</view>

<!-- 条件渲染 vs 显隐 -->
<view wx:if="{{ show }}">渲染型（切换有创建/销毁开销）</view>
<view hidden="{{ !show }}">始终渲染，仅切换显隐（频繁切换用它）</view>
```

- **数据绑定**：Mustache 双花括号内可写表达式（三元、运算、字符串拼接）；属性也可绑定。
- **列表渲染 `wx:for`**：默认变量 `item` / `index`，可用 `wx:for-item` / `wx:for-index` 改名；**`wx:key` 必填**，值为唯一属性名或 `*this`。
- **条件渲染**：`wx:if` / `wx:elif` / `wx:else` 控制**是否渲染**（切换开销大）；`hidden` 属性**始终渲染**只切显隐（频繁切换首选）。
- **模板与引用**：`<template>` 定义 + 使用（组件化后少用）；`<import>` 引 template、`<include>` 引整段 WXML。

## 五、WXSS：样式与 `rpx`

WXSS 在 CSS 基础上做了小程序适配，最重要的是响应式单位 **`rpx`**：

```css
/* rpx：规定屏幕宽 = 750rpx，按屏宽等比缩放；做自适应布局首选 */
.card {
  width: 750rpx;      /* 占满屏宽 */
  padding: 20rpx 32rpx;
  font-size: 28rpx;
}
/* 也可混用 px；@import 引入外部样式 */
@import './common.wxss';
```

- **`rpx`（responsive pixel）**：**规定屏幕宽 = 750rpx**，按屏幕宽度等比缩放（iPhone6 下 1rpx = 0.5px）；做屏幕自适应布局首选。
- **受限项**：支持大部分 CSS（选择器、flex 等），但**部分选择器受限**（如复杂属性 / 标签选择器），且 **`background-image` 不能用本地资源图**（需网络图或 base64）。
- **优先级**：全局 `app.wxss` 与页面 `.wxss` 共同作用，页面样式优先级更高。

## 六、WXS：渲染层的脚本语言

**WXS（WeXin Script）** 是小程序**独有的脚本语言**（不是 JS，是其语法子集），写在 `.wxs` 文件或 `<wxs>` 标签内，**运行在渲染层**——用于 WXML 内联的格式化 / 过滤等处理，**避免频繁跨线程调用逻辑层**：

```html
<!-- 页面 wxml：用 WXS 在渲染层做格式化，无需跨线程回逻辑层 -->
<wxs module="fmt">
  module.exports.upper = function (s) { return s.toUpperCase() }
</wxs>
<view>{{ fmt.upper(name) }}</view>
```

- **为什么用**：WXS 与渲染层同线程，传统渲染模式下用它响应事件 / 做格式化比 `bind` 回逻辑层更快（少一次跨线程往返）。
- **Skyline 下的变化（重要）**：**Skyline 渲染引擎下 WXS 变为异步**，因此**动画必须从 WXS 改用 Worklet**（详见[Skyline 与性能优化](./skyline-perf)）。

> 下一步：四文件如何在**两个线程**里协作、`setData` 为何是性能命门，见 [双线程与 setData](./dual-thread)。
