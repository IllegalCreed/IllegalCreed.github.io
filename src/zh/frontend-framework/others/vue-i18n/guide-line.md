---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 Vue I18n v11 编写

## 速查

- 复数：`'no apples | one apple | {count} apples'`，调用 `t('apple', n)` 自动选支
- 链接消息：`'@:message.the_world'`；修饰符：`@.lower:`、`@.upper:`、`@.capitalize:`
- 字面量：`{'@'}` 引号包裹规避 `{`、`}`、`@`、`|`、`\`
- 日期 / 数字：`$d(date, 'long')` / `$n(num, 'currency')`，需先注册 `datetimeFormats` / `numberFormats`
- 全局作用域：`useI18n({ useScope: 'global' })`（默认 `'local'`）
- 取整段消息：`tm('group')` 返回对象 / 数组，配合 `rt()` 渲染
- 动态加载：`i18n.global.setLocaleMessage(locale, msg)` + 动态 `import()`
- SFC 块：`<i18n>` 需配 `@intlify/unplugin-vue-i18n`
- 外部使用：`import { i18n } from './i18n'; i18n.global.t('key')`（非组件场景）
- TS 推断：`declare module 'vue-i18n'` 把 `messages` 类型注入 `DefineLocaleMessage`

## 消息语法

### 命名插值

```ts
// messages.zh
{ welcome: "你好 {name}！" }
```

```vue
<p>{{ t("welcome", { name: "Vue" }) }}</p>
<!-- 你好 Vue！ -->
```

变量名需以字母或下划线开头，后跟字母 / 数字 / `_` / `-` / `$`。

### 列表插值

```ts
{ order: "第 {0} 件商品价格 {1} 元" }
```

```vue
<p>{{ t("order", [1, 99]) }}</p>
<!-- 第 1 件商品价格 99 元 -->
```

### 字面量插值

需要在消息里嵌 `{`、`@`、`|` 等保留字符时，用单引号包裹的字面量：

```ts
{ email: "{account}{'@'}{domain}" }
```

```vue
<p>{{ t("email", { account: "alice", domain: "ex.com" }) }}</p>
<!-- alice@ex.com -->
```

或用反斜杠转义：`'\\@'`、`'\\{'`、`'\\}'`、`'\\|'`、`'\\\\'`。

### 链接消息

`@:key` 引用同一语言下的另一条消息：

```ts
{
  the_world: "整个世界",
  hello: "你好，@:the_world！"
}
```

```vue
<p>{{ t("hello") }}</p>
<!-- 你好，整个世界！ -->
```

修饰符可改写引用结果的大小写：

| 修饰符          | 作用                          |
| --------------- | ----------------------------- |
| `@.lower:key`   | 全转小写                      |
| `@.upper:key`   | 全转大写                      |
| `@.capitalize:` | 首字母大写                    |

### 复数

用 `|` 分隔多个分支，根据 `t()` 的第二个数值参数自动选支：

```ts
{
  car: "汽车 | 多辆汽车",
  apple: "没有苹果 | 一个苹果 | {count} 个苹果"
}
```

```vue
<p>{{ t("car", 1) }}</p>        <!-- 汽车 -->
<p>{{ t("car", 2) }}</p>        <!-- 多辆汽车 -->
<p>{{ t("apple", 0) }}</p>      <!-- 没有苹果 -->
<p>{{ t("apple", 10) }}</p>     <!-- 10 个苹果 -->
```

`{count}` 与 `{n}` 是内置变量，等于传入的数值；要重写时显式传 `named`：

```vue
<p>{{ t("banana", 1, { named: { n: 1 } }) }}</p>
```

::: warning `tc / $tc` 已在 v11 移除（Legacy 模式）

旧代码里的 `$tc('apple', 10)` 在 Composition API 下直接写 `t('apple', 10)` 即可。

:::

### 自定义复数规则

英文 / 中文用默认规则足够。俄语、阿拉伯语等语言的复数形态多于两种时，需要自定义函数：

```ts
function ruRule(choice: number) {
  if (choice === 0) return 0;
  const teen = choice > 10 && choice < 20;
  const endsWithOne = choice % 10 === 1;
  if (!teen && endsWithOne) return 1;
  return 2;
}

createI18n({
  pluralizationRules: { ru: ruRule },
  messages: {
    ru: { car: "0 машин | {n} машина | {n} машины | {n} машин" },
  },
});
```

### HTML 与 XSS

Vue I18n 输出默认是文本节点。需要在翻译里嵌 HTML 时配合 `v-html`：

```ts
{ tip: "<strong>提示</strong>：保存即生效" }
```

```vue
<p v-html="t('tip')"></p>
```

::: danger 只在可信内容上用 v-html

`v-html` 直接注入 HTML，会执行其中的 `<script>` 与事件处理器。翻译来源若包含用户输入，**必须**在 `createI18n` 里开 `escapeParameter: true`，让插值变量自动转义。

:::

## 日期与数字格式化

### 日期

注册各语言的 `datetimeFormats` 命名预设：

```ts
createI18n({
  locale: "zh",
  datetimeFormats: {
    zh: {
      short: { year: "numeric", month: "short", day: "numeric" },
      long: {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
        hour: "numeric",
        minute: "numeric",
      },
    },
    en: {
      short: { year: "numeric", month: "short", day: "numeric" },
      long: {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      },
    },
  },
});
```

```vue
<p>{{ $d(new Date(), "short") }}</p>
<p>{{ $d(new Date(), "long") }}</p>
```

底层走的是浏览器的 `Intl.DateTimeFormat`，预设字段就是 [Intl 选项](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#options)。

### 数字

`numberFormats` 同理：

```ts
createI18n({
  numberFormats: {
    zh: {
      currency: { style: "currency", currency: "CNY" },
      percent: { style: "percent", minimumFractionDigits: 2 },
    },
    en: {
      currency: { style: "currency", currency: "USD" },
      percent: { style: "percent", minimumFractionDigits: 2 },
    },
  },
});
```

```vue
<p>{{ $n(1234.5, "currency") }}</p>   <!-- 中文: ¥1,234.50 / 英文: $1,234.50 -->
<p>{{ $n(0.872, "percent") }}</p>     <!-- 87.20% -->
```

## Composition API 深入

### 全局 vs 局部作用域

```ts
// 默认 local：本组件独享
const { t } = useI18n({
  locale: "en",
  messages: { en: { ok: "OK" } },
});

// 显式 global：拿到 createI18n 的全局字典
const { t, locale } = useI18n({ useScope: "global" });
```

经验法则：

- 切语言、读全局字典 → `useScope: 'global'`
- 组件自带翻译（少量、组件内可见的字典）→ 不传或 `'local'`

### 取整段消息：`tm` + `rt`

`tm('group')` 返回一棵子消息对象 / 数组，常用于动态遍历：

```ts
// messages.zh
{
  features: {
    a: "特性 A",
    b: "特性 B",
  }
}
```

```vue
<script setup lang="ts">
const { tm, rt } = useI18n();
const features = tm("features") as Record<string, string>;
</script>

<template>
  <ul>
    <li v-for="(text, key) in features" :key="key">
      {{ rt(text) }}
    </li>
  </ul>
</template>
```

`rt()` 负责解析消息中的插值占位符；直接绑定 `tm()` 的结果不会触发插值。

### 在组件外使用

需要在 store、router 守卫、API 拦截器里翻译时，导出 `i18n` 实例直接用：

```ts
// src/i18n/index.ts
export const i18n = createI18n({ /* ... */ });

// src/router.ts
import { i18n } from "./i18n";

router.beforeEach((to) => {
  document.title = i18n.global.t(to.meta.titleKey as string);
});
```

`i18n.global.t / d / n / locale` 等同于全局作用域下的 `useI18n` 返回值。

## SFC 自定义块

`<i18n>` 块让翻译和组件文件就近放置：

```vue
<template>
  <p>{{ t("hello") }}</p>
</template>

<script setup>
import { useI18n } from "vue-i18n";
const { t } = useI18n();   // 默认 local，能取到本块的 messages
</script>

<i18n>
{
  "en": { "hello": "Hello" },
  "zh": { "hello": "你好" }
}
</i18n>
```

属性：

- `lang="yaml"` 切到 YAML 写法
- `src="./locales/foo.json"` 从外部文件引入
- `global` 把消息合并到全局字典
- `locale="en"` 只为单一语言写

### Vite 集成

需要 `@intlify/unplugin-vue-i18n` 把 `<i18n>` 块编译成 JS 字典：

```bash
pnpm add -D @intlify/unplugin-vue-i18n
```

```ts
// vite.config.ts
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import VueI18nPlugin from "@intlify/unplugin-vue-i18n/vite";
import path from "node:path";

export default defineConfig({
  plugins: [
    vue(),
    VueI18nPlugin({
      include: [path.resolve(__dirname, "src/locales/**")],
    }),
  ],
});
```

`include` 指向项目里所有 `.json` / `.yaml` 翻译资源目录，让插件能提前预编译——比 runtime 解析快很多，并能 tree-shake 不用到的语言。

## 懒加载语言包

字典按需异步加载，首屏只下载当前语言。核心 API 是 `i18n.global.setLocaleMessage`：

```ts
// src/i18n/index.ts
import { createI18n } from "vue-i18n";
import zh from "./locales/zh.json";

export const i18n = createI18n({
  legacy: false,
  locale: "zh",
  fallbackLocale: "en",
  messages: { zh },   // 启动时只装当前语言
});

/** 按需加载并切换 */
export async function loadLocale(locale: string) {
  // 已加载过的语言直接切
  if (i18n.global.availableLocales.includes(locale)) {
    i18n.global.locale.value = locale;
    return;
  }
  // 动态 import；Vite/Webpack 自动 code-split
  const messages = await import(`./locales/${locale}.json`);
  i18n.global.setLocaleMessage(locale, messages.default);
  i18n.global.locale.value = locale;
}
```

配合路由守卫：

```ts
router.beforeEach(async (to) => {
  const lang = to.params.lang as string;
  if (lang) await loadLocale(lang);
});
```

## TypeScript 集成

让 `t('key.path')` 在 IDE 里有补全和类型检查，需要把 `messages` 的类型注入 `vue-i18n` 模块：

```ts
// src/i18n/types.ts
import zh from "./locales/zh.json";

type MessageSchema = typeof zh;

declare module "vue-i18n" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface DefineLocaleMessage extends MessageSchema {}
}
```

此后 `t('message.hello')` 写错 key 会直接报错，IDE 也能补全嵌套路径。

::: tip 多语言文件类型不一致怎么办

如果你的 `en.json` 与 `zh.json` 字段不完全一致（迁移期常见），把 `MessageSchema` 改为联合：

```ts
type MessageSchema = typeof zh & typeof en;
```

或用 [`@intlify/unplugin-vue-i18n`](https://vue-i18n.intlify.dev/guide/integrations/vite.html) 的 `strictMessage: true` 在构建时校验所有语言 key 一致。

:::

## v11 迁移要点

v11 主要把 Vue 2 时代留下的 Options API 风格 API 标记弃用，向 v12 完全 Composition API 化的方向收口。具体 breaking：

| 弃用 / 移除项                 | 替代                                           |
| ----------------------------- | ---------------------------------------------- |
| `legacy: true` Options API    | `legacy: false` + `useI18n()`                  |
| `v-t` 自定义指令              | 普通模板插值（直接调 `t('key')`）              |
| `tc / $tc`（v11 已移除）      | `t('key', count)` 直接用                       |
| `$i18n.t` 等组件实例上的 API  | 模板里仍可用 `$t`；脚本里改 `useI18n`         |

迁移辅助：

- ESLint 规则：`@intlify/vue-i18n/no-deprecated-v-t` 自动扫出残留 `v-t`
- 旧项目临时延期：v11 期间 Legacy 模式仍能跑，给改造留一个版本周期
- v12 时间表：官方 changelog 持续跟踪 [vue-i18n changelog](https://github.com/intlify/vue-i18n/blob/master/CHANGELOG.md)

## 与 Nuxt 集成

Nuxt 3 项目用 [`@nuxtjs/i18n`](https://i18n.nuxtjs.org/) 模块，是 Vue I18n 之上的封装：

- 自动按文件名生成 locale 路由（`/en/about` / `/zh/about`）
- SSR / SSG 友好，服务端预渲染时正确选语言
- 内置语言切换中间件 + cookie / header 探测

普通 SPA 项目直接用 Vue I18n 即可，无需 Nuxt 模块。
