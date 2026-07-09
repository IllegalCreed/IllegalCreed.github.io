---
layout: doc
---

# i18next（JavaScript 国际化框架）

::: tip 本篇范围
本篇聚焦 **i18next 核心引擎**——`init()` 初始化、`t()` 取词、resources 资源结构、命名空间、插值、复数、上下文、嵌套、回退，以及语言检测 / 后端懒加载等官方插件。i18next 是**框架无关**的核心，`react-i18next`、`i18next-vue` 等是建立在它之上的**绑定层**；Vue 生态另有一套独立的 `vue-i18n`（本站单列），这里只在对比时一笔带过。
:::

i18next 的官方定位是「**an internationalization-framework written in and for JavaScript**」——一个用 JavaScript 写、给 JavaScript 用的国际化框架。它的核心**与 UI 框架解耦**：在浏览器、Node、移动端、桌面端任何 JS 环境都能跑，正因如此才能被 React（`react-i18next`）、Vue（`i18next-vue`）、Angular、Svelte 等各种绑定层复用。你给它一份 `resources`（`语言 → 命名空间 → key/value` 三层结构），调用 `t('key')` 就能按当前语言取出文案。

它把「翻译」这件事拆成几块可组合的能力：**插值**（默认 <code v-pre>{{var}}</code>，且默认 HTML 转义防 XSS）、**复数**（v21 起对齐 `Intl.PluralRules`，用 `_one`/`_other` 等后缀）、**上下文**（按 `context` 拼 `key_male` 后缀）、**嵌套**（`$t(otherKey)` 在一条文案里引用另一条）、**格式化**（<code v-pre>{{val, number}}</code> 走 `Intl.NumberFormat` 等）、**回退**（`fallbackLng` 语言回退、`fallbackNS` 命名空间回退）。需要「检测用户语言」「按需从服务器加载翻译」这类平台能力时，用对应**插件**（`i18next-browser-languagedetector`、`i18next-http-backend`）经 `.use()` 接入，而非核心内置。**初始化是异步的**：`init()` 返回 Promise，用 backend 懒加载时尤其要等它就绪再用 `t`。

## 评价

**优点**

- **框架无关的核心引擎**：浏览器 / Node 通吃，可被 react-i18next、i18next-vue、Angular 等复用，一套心智多端通用
- **能力完整**：插值、复数、上下文、嵌套、格式化、命名空间、回退一应俱全，覆盖真实国际化的各种刁钻需求
- **复数对齐 Intl**：v21（JSON v4）起复数走 `Intl.PluralRules`，规则权威、支持序数（`ordinal`），不必手写各语言规则表
- **安全默认**：插值默认 HTML 转义（`escapeValue: true`）缓解 XSS；嵌套默认 `skipOnVariables: true` 防注入
- **插件化生态**：语言检测、HTTP/FS 懒加载、缓存、后处理（sprintf）等都是独立插件，按需 `.use()`，核心保持精简
- **懒加载友好**：命名空间 + backend 让单页应用只加载当前页所需文案，控制首屏体积
- **TypeScript 支持好**：用 `CustomTypeOptions` 模块增强即可让 `t('...')` 获得 key 补全与校验

**缺点**

- **配置项多、上手有坡度**：`keySeparator`/`nsSeparator`/`load`/`fallbackLng` 对象形式等，初学易被默认行为绕住
- **「核心 vs 绑定层」常被混淆**：很多人把 react-i18next 当成 i18next 本体，分不清谁依赖谁
- **异步初始化的时序坑**：用 backend 时若没等 `init`/`languageChanged` 就调 `t`，可能拿到未加载完的结果
- **关闭转义需自负其责**：`escapeValue: false` 或 <code v-pre>{{- var}}</code> 后若直插用户输入，会引入 XSS
- **复数依赖 Intl.PluralRules**：极旧环境需 polyfill；v3→v4 的复数后缀迁移对老项目是一次性成本

## 文档地址

[i18next 官方文档](https://www.i18next.com/)

## GitHub 地址

[i18next/i18next](https://github.com/i18next/i18next)

## 幻灯片地址

<a href="/SlideStack/i18next-slide/" target="_blank">i18next（JavaScript 国际化框架）</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=i18next-javascript-%E5%9B%BD%E9%99%85%E5%8C%96%E6%A1%86%E6%9E%B6" target="_blank" rel="noopener noreferrer">i18next（JavaScript 国际化框架） 测试题</a>
