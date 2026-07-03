---
layout: doc
outline: [2, 3]
---

# 抖音小程序 文件结构与视图层

> 基于抖音小程序（基础库 4.x）· 核于 2026-07

## 速查

- **四文件 + SJS**：`.ttml`（模板，对微信 `.wxml`）/ `.ttss`（样式，对 `.wxss`）/ `.js` / `.json`；视图层脚本 `.sjs`（对 `.wxs`）
- 全局 `app.json` + `app.js` + `app.ttss`；页面 `page.json` 覆盖 window；组件 `component.json`（`"component": true`）
- **视图层指令前缀 `tt:`**：`tt:if`/`tt:elif`/`tt:else`、`tt:for`/`tt:for-item`/`tt:for-index`/`tt:key`
- 数据绑定 Mustache（同微信）；事件 `bindtap`/`catchtap`（全小写，`e.currentTarget.dataset` 取 `data-*`）
- 模板 `<template>`、`<block>` 无渲染包裹、`<import>`/`<include>` 复用；样式单位 `rpx`
- 记忆法：`wx:`→`tt:`、`wxml/wxss`→`ttml/ttss`，其余语法大部分一致

## 一、文件结构（对比微信）

| 抖音（字节） | 微信 | 作用 |
| --- | --- | --- |
| `.ttml`（Toutiao Template Markup Language） | `.wxml` | 结构/模板 |
| `.ttss`（Toutiao Template Style Sheets） | `.wxss` | 样式 |
| `.js` | `.js` | 逻辑 |
| `.json` | `.json` | 页面/组件配置 |
| `.sjs` | `.wxs` | 视图层内联脚本 |

- 全局配置 `app.json`（pages / window / tabBar / 分包 / 域名白名单）+ `app.js` + `app.ttss`。
- 页面 `page.json` 覆盖 `app.json` 的 window 项；自定义组件用 `component.json` 声明 `"component": true`。

## 二、TTML 视图层

数据绑定用 Mustache 双花括号（同微信），指令前缀 `tt:`：

```html
<!-- 数据绑定 -->
<view>{{ message }}</view>

<!-- 条件渲染：tt:if / tt:elif / tt:else -->
<view tt:if="{{ cond }}">A</view>
<view tt:elif="{{ other }}">B</view>
<view tt:else>C</view>

<!-- 列表渲染：tt:for / tt:for-item / tt:for-index / tt:key -->
<view tt:for="{{ list }}" tt:for-item="item" tt:for-index="idx" tt:key="id">
  {{ idx }}: {{ item.name }}
</view>

<!-- 事件：bindtap 冒泡 / catchtap 阻止冒泡（全小写） -->
<view data-id="1" bindtap="handleTap">Click</view>

<!-- 模板 -->
<template name="card"><view>{{ title }}</view></template>
<template is="card" data="{{ ...obj }}" />
```

```js
Page({ handleTap(e) { console.log(e.currentTarget.dataset.id); } });
```

- `<block>` 作无渲染包裹容器；`<import>` / `<include>` 复用 TTML 片段。
- 小坑（官方问答区）：TTML 样式选择器不支持动态模板字符串。

## 三、TTSS 样式

- 语法即 CSS + `rpx` 响应式单位（750 设计稿基准，同微信）；支持全局 `app.ttss` 与页面局部 `.ttss`、flex 布局。

## 四、SJS（视图层脚本）

- 对标微信 WXS：在视图层做过滤/格式化等轻逻辑，减少视图-逻辑通信。官方有独立「SJS 语法参考」。
- 记忆法一句话：**把微信 `wx:` 换成 `tt:`、`wxml/wxss` 换成 `ttml/ttss`、`wx.` 换成 `tt.`，绝大部分语法一致**（生态 API 除外，见 [生态能力](./features)）。
