---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Vue I18n v11 编写

## 速查

- 安装：`pnpm add vue-i18n@11`
- 适配版本：Vue **3.0+**（v8 已停更，新项目直接上 v11）
- 入口：`createI18n({ legacy: false, locale, fallbackLocale, messages })`
- 注册：`app.use(i18n)`
- 模板取值：`$t('key')` / `$d(date)` / `$n(num)`（`globalInjection` 默认开启）
- Composition：`const { t, d, n, locale } = useI18n()`
- 切语言：`locale.value = 'en'`（响应式自动重渲染）
- SFC 翻译块：`<i18n>{ "en": {...}, "ja": {...} }</i18n>`，需 `@intlify/unplugin-vue-i18n`
- 懒加载：`i18n.global.setLocaleMessage(locale, msg)` + 动态 `import()`

## 安装

```bash
pnpm add vue-i18n@11
```

::: tip 版本与 Vue 兼容

| Vue I18n | Vue       | 状态                                                       |
| -------- | --------- | ---------------------------------------------------------- |
| v11.x    | Vue 3.0+  | **当前主线**，长期维护                                     |
| v10.x    | Vue 3.0+  | 仍可用，建议升级到 v11                                     |
| v9.x     | Vue 3.0+  | 已停更，迁移到 v10/v11                                     |
| v8.x     | Vue 2.x   | 已停更（Vue 2 EOL 后不再维护）                             |

旧项目从 v9 迁到 v11 主要看三个 breaking：Legacy API 模式弃用、`v-t` 自定义指令弃用、`tc / $tc` 已移除（Legacy 模式）。详见 [v11 迁移要点](./guide-line.md#v11-迁移要点)。

:::

## 配置

`createI18n()` 创建实例，`app.use(i18n)` 注册到 Vue 应用：

```ts
// src/i18n.ts
import { createI18n } from "vue-i18n";

const messages = {
  en: {
    message: {
      hello: "hello world",
    },
  },
  zh: {
    message: {
      hello: "你好，世界",
    },
  },
};

export const i18n = createI18n({
  legacy: false,           // 启用 Composition API 模式（v12 将默认 false）
  locale: "zh",            // 当前语言
  fallbackLocale: "en",    // 兜底语言（key 缺失时回退）
  messages,
});
```

```ts
// src/main.ts
import { createApp } from "vue";
import App from "./App.vue";
import { i18n } from "./i18n";

createApp(App).use(i18n).mount("#app");
```

::: warning Composition API 必须 `legacy: false`

`createI18n` 默认 `legacy: true`（沿用 Vue 2 时代的全局注入模式），此时 `useI18n` 会抛错。从 v11 起 Legacy API 已被官方标记弃用，**新项目应总是显式写 `legacy: false`**，v12 将彻底移除 Legacy 模式。

:::

### 常用配置项

| 字段                  | 默认值     | 说明                                                                                  |
| --------------------- | ---------- | ------------------------------------------------------------------------------------- |
| `legacy`              | `true`     | `false` 启用 Composition API；强烈建议显式设为 `false`                                |
| `locale`              | `'en-US'`  | 当前语言代码                                                                          |
| `fallbackLocale`      | —          | 兜底语言；可传字符串、数组或 `{ zh: ['en','ja'], default: ['en'] }` 这种 fallback 链 |
| `messages`            | `{}`       | 嵌套对象：`{ locale: { key: 'value' } }`                                              |
| `globalInjection`     | `true`     | 是否把 `$t / $d / $n` 注入到所有组件的模板上下文                                      |
| `missingWarn`         | `true`     | key 缺失时是否在控制台告警；上线后可关                                                |
| `fallbackWarn`        | `true`     | 触发 fallback 时是否告警                                                              |
| `silentTranslationWarn` | `false`  | `true` 关闭所有翻译告警                                                               |

## 基本用法

### 模板里取值

```vue
<template>
  <p>{{ $t("message.hello") }}</p>            <!-- 翻译 -->
  <p>{{ $d(new Date(), "long") }}</p>          <!-- 日期 -->
  <p>{{ $n(1234.5, "currency") }}</p>          <!-- 数字 -->
</template>
```

`$t / $d / $n` 来自 `globalInjection: true`。如果显式关闭，模板里需用 `useI18n()` 解构后的 `t / d / n`。

### `<script setup>` 里取值

```vue
<script setup lang="ts">
import { useI18n } from "vue-i18n";

const { t, d, n, locale, availableLocales } = useI18n();

function switchTo(lang: string) {
  // locale 是 ref，赋值会触发整棵组件树重渲染
  locale.value = lang;
}
</script>

<template>
  <button @click="switchTo('en')">EN</button>
  <button @click="switchTo('zh')">中文</button>
  <p>{{ t("message.hello") }}</p>
</template>
```

### 命名插值与变量

模板用 `{name}` 占位，调用时第二参传字典：

```ts
// messages.en.greeting
"greeting": "Hello, {name}!"
```

```vue
<p>{{ t("greeting", { name: "Vue" }) }}</p>
<!-- Hello, Vue! -->
```

列表插值用 `{0}`、`{1}`：

```ts
"order": "Item {0} costs {1}"
```

```vue
<p>{{ t("order", ["Apple", "$3"]) }}</p>
<!-- Item Apple costs $3 -->
```

### 切换语言

直接给 `locale.value` 赋值即可，所有用到 `t()` 的组件会自动重渲染：

```ts
const { locale } = useI18n();
locale.value = "en";
```

要把当前语言持久化，常见做法是写 localStorage + 启动时读回：

```ts
// 启动时
const saved = localStorage.getItem("locale") ?? navigator.language.split("-")[0];
i18n.global.locale.value = saved;

// 切换时
watch(locale, (v) => localStorage.setItem("locale", v));
```

## 一份能跑的最小示例

```
src/
├── i18n/
│   ├── index.ts           # createI18n 实例
│   └── locales/
│       ├── en.json
│       └── zh.json
├── App.vue
└── main.ts
```

```ts
// src/i18n/index.ts
import { createI18n } from "vue-i18n";
import en from "./locales/en.json";
import zh from "./locales/zh.json";

export const i18n = createI18n({
  legacy: false,
  locale: "zh",
  fallbackLocale: "en",
  messages: { en, zh },
});
```

```json
// src/i18n/locales/zh.json
{
  "message": {
    "hello": "你好，世界"
  }
}
```

```vue
<!-- src/App.vue -->
<script setup lang="ts">
import { useI18n } from "vue-i18n";
const { t, locale } = useI18n();
</script>

<template>
  <select v-model="locale">
    <option value="zh">中文</option>
    <option value="en">English</option>
  </select>
  <h1>{{ t("message.hello") }}</h1>
</template>
```

## 下一步

- 详细消息语法（复数、链接消息、字面量、HTML 转义）见 [指南 - 消息语法](./guide-line.md#消息语法)
- 日期与数字本地化见 [指南 - 日期与数字格式化](./guide-line.md#日期与数字格式化)
- SFC `<i18n>` 自定义块与 Vite 集成见 [指南 - SFC 自定义块](./guide-line.md#sfc-自定义块)
- 路由懒加载语言包见 [指南 - 懒加载语言包](./guide-line.md#懒加载语言包)
- TypeScript 字面量类型推断见 [指南 - TypeScript 集成](./guide-line.md#typescript-集成)
