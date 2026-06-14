---
layout: doc
outline: [2, 3]
---

# 入门

> 本篇讲 **i18next 核心引擎**的最小用法：安装、`init()`、`t()`、resources 结构、插值、复数、命名空间、回退。版本基线 **i18next v23+（含 v24/v25/v26）**，复数与插值 API 自 **v21（JSON format v4）** 起稳定。框架绑定（react-i18next 等）不在本篇展开。

## 速查

- 安装核心：`npm i i18next`
- 初始化：`i18next.init({ lng, fallbackLng, resources })` → **返回 Promise（异步）**
- 取词：`i18next.t('key')`；带变量：`t('greeting', { name: 'Jed' })`
- 资源结构：`{ 语言: { 命名空间: { key: 值 } } }`，默认命名空间是 `translation`
- 插值：默认 <code v-pre>{{var}}</code>，**默认 HTML 转义**（防 XSS）
- 复数：传 `count`，key 用 `_one` / `_other` 等后缀（走 `Intl.PluralRules`）
- 切语言：`i18next.changeLanguage('de')`（返回 Promise）
- 回退：`fallbackLng: 'en'`，缺 key 自动去 en 找
- ⚠️ 用 backend 懒加载时，**先 `await init()` 再用 `t`**

## 一、i18next 是什么

官方一句话定位：「**an internationalization-framework written in and for JavaScript**」。三个关键认知：

1. **框架无关**：核心引擎不依赖任何 UI 框架，浏览器 / Node 都能跑。
2. **绑定层在其上**：`react-i18next`（React）、`i18next-vue`（Vue）等是封装层，依赖 i18next 核心；而 `vue-i18n` 是 Vue 生态**另一套独立**方案（本站单列）。
3. **插件化**：语言检测、按需加载、缓存等平台能力都是独立插件，经 `.use()` 接入。

## 二、安装与第一段代码

```bash
npm i i18next
```

```js
import i18next from "i18next";

await i18next.init({
  lng: "en", // 当前语言
  fallbackLng: "en", // 回退语言
  resources: {
    en: { translation: { key: "hello world" } },
    de: { translation: { key: "hallo welt" } },
  },
});

i18next.t("key"); // -> "hello world"
```

`init()` 是**异步**的（`initAsync` 默认 `true`），返回 Promise，也支持回调 `init(options, (err, t) => {})`。内联 `resources` 时可较快就绪，但**统一按异步处理**最稳——尤其后面接 backend 懒加载时。

## 三、resources：三层资源结构

```js
const resources = {
  en: {
    // ① 语言
    translation: {
      // ② 命名空间（默认就是 translation）
      greeting: "Hello {{name}}", // ③ key: 值
      nav: { home: "Home", about: "About" }, // 可嵌套，t('nav.home')
    },
  },
};
```

- 最外层是**语言码**，第二层是**命名空间**，第三层才是 key/value。
- 默认命名空间是 `translation`（`ns` 默认 `['translation']`、`defaultNS` 默认 `'translation'`）。
- 嵌套对象用点号访问（`keySeparator` 默认 `.`）：`t('nav.home')` → `"Home"`。

## 四、t()：取词 + 插值

```js
i18next.t("greeting", { name: "Jed" }); // -> "Hello Jed"
```

- 默认插值语法是**双大括号** <code v-pre>{{name}}</code>。
- ⚠️ **默认会 HTML 转义**插值值（`interpolation.escapeValue` 默认 `true`）以防 XSS：传 `<img />` 会变成 `&lt;img &#x2F;&gt;`。确需原样输出 HTML，用 <code v-pre>{{- var}}</code> 或传 `escapeValue: false`（此时须自行确保已转义用户输入）。
- 缺失 key 兜底：可传 `defaultValue`（`t('key', { defaultValue: '兜底' })`），或简写 `t('key', '兜底')`；**什么都没命中且无 defaultValue 时，t 默认返回 key 本身**（保证总是字符串）。

## 五、复数：传 count

```js
const en = {
  item_one: "{{count}} item",
  item_other: "{{count}} items",
};

i18next.t("item", { count: 1 }); // -> "1 item"
i18next.t("item", { count: 5 }); // -> "5 items"
```

- 自 **v21（JSON format v4）** 起，复数判定**对齐 `Intl.PluralRules`**，英语常用 `_one` / `_other`；完整后缀集是 `_zero / _one / _two / _few / _many / _other`，具体语言用哪几个由 Intl 规则决定。
- **必须传 `count`** 才触发复数选择；不传不会回退到无后缀的裸 key。

## 六、命名空间：拆分翻译

```js
await i18next.init({
  ns: ["translation", "common"],
  defaultNS: "translation",
  resources: {
    en: {
      translation: { title: "Home" },
      common: { save: "Save", cancel: "Cancel" },
    },
  },
});

i18next.t("save", { ns: "common" }); // 跨命名空间取 key
i18next.t("common:save"); // 等价的前缀写法（冒号是 nsSeparator）
```

命名空间用于按领域拆分文案（公共 / 校验 / 各业务模块），并支持**按需懒加载**控制首屏体积。

## 七、回退语言

```js
await i18next.init({
  lng: "de-CH",
  fallbackLng: "en", // de-CH 缺 key → 先回退到 de，再到 en
});
```

语言码会自动从具体回退到宽泛（`de-CH` → `de`），再到 `fallbackLng`。注意 `lng` 显式设置会**覆盖语言检测**，用检测器时通常不要再硬写 `lng`。

## 八、运行时切换语言

```js
await i18next.changeLanguage("de"); // 返回 Promise，完成后触发 languageChanged 事件

i18next.on("languageChanged", (lng) => {
  // 在这里刷新自定义 UI
});
```

---

掌握基本用法后，进入 [指南 · 基础](./guide-line/base)：插值与格式化细节、复数与上下文、命名空间与回退机制、init 配置全景。
