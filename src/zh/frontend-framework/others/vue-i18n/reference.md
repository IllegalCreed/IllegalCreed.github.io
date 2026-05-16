---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Vue I18n v11 编写。仅列出常用 API；完整接口见 [官方 API 文档](https://vue-i18n.intlify.dev/api/)。

## createI18n 配置项

```ts
import { createI18n } from "vue-i18n";

const i18n = createI18n({
  /* 配置项见下 */
});
```

### 核心配置

| 字段              | 类型                                | 默认       | 说明                                                                  |
| ----------------- | ----------------------------------- | ---------- | --------------------------------------------------------------------- |
| `legacy`          | `boolean`                           | `true`     | `true` 使用 Options API，`false` 切到 Composition API（Vue 3 推荐）   |
| `locale`          | `string`                            | `'en-US'`  | 当前 locale，如 `'zh-CN'`                                            |
| `fallbackLocale`  | `string` / `string[]` / `object`    | `false`    | 当前 locale 找不到 key 时的回退 locale                              |
| `messages`        | `Record<string, MessageObject>`     | `{}`       | 各 locale 的翻译字典                                                |
| `availableLocales`| `string[]`                          | 读 messages | 已加载的 locale 列表                                                |

### 行为控制

| 字段                  | 类型      | 默认    | 说明                                                            |
| --------------------- | --------- | ------- | --------------------------------------------------------------- |
| `missing`             | `Function`| -       | missing key handler                                            |
| `missingWarn`         | `boolean` / `RegExp` | `true`  | 是否输出 missing 警告，可用正则筛选 key                       |
| `fallbackWarn`        | `boolean` / `RegExp` | `true`  | 是否输出 fallback 警告                                         |
| `fallbackRoot`        | `boolean` | `true`  | 沿组件树向上找翻译时是否走到根 i18n                           |
| `fallbackFormat`      | `boolean` | `false` | fallback 阶段不再走完整解析，直接返回字符串                   |
| `silentTranslationWarn` | `boolean` / `RegExp` | `false` | 抑制 translation 警告（v9 字段，v11 仍兼容）               |
| `silentFallbackWarn`  | `boolean` / `RegExp` | `false` | 抑制 fallback 警告（同上）                                    |
| `formatFallbackMessages` | `boolean` | `false` | fallback 仍走完整 format（含插值）                          |
| `escapeParameter`     | `boolean` | `false` | 全局开启插值变量 HTML 转义                                    |
| `warnHtmlMessage`     | `boolean` | `true`  | 消息中含 HTML 时输出警告（v9 字段）                          |
| `warnHtmlInMessage`   | `'off' / 'warn' / 'error'` | `'off'` | 同上，更细粒度                                              |
| `postTranslation`     | `Function`| -       | 翻译后处理函数                                                |

### 复数 / 格式化

| 字段                | 类型     | 默认 | 说明                                          |
| ------------------- | -------- | ---- | --------------------------------------------- |
| `pluralizationRules`| `object` | -    | 自定义复数规则映射，如 `{ ru: ruRule }`     |
| `datetimeFormats`   | `object` | -    | 命名 datetime 预设，用于 `$d()`              |
| `numberFormats`     | `object` | -    | 命名 number 预设，用于 `$n()`               |
| `modifiers`         | `object` | -    | 自定义链接修饰符                              |

### 同步 / 异步

| 字段           | 类型      | 默认    | 说明                                           |
| -------------- | --------- | ------- | ---------------------------------------------- |
| `inheritLocale`| `boolean` | `true`  | 子作用域是否继承父 locale                     |
| `sync`         | `boolean` | `true`  | 与 Vue 实例 reactive 同步                     |

## Composition API

### `useI18n(options)`

```ts
import { useI18n } from "vue-i18n";

const {
  // 翻译
  t,          // (key, ...args) => string
  rt,         // resolved translation：解析 tm 返回的对象
  tm,         // translation message：返回原始消息对象 / 数组
  te,         // translation exists：key 是否存在
  d,          // datetime 格式化
  n,          // number 格式化

  // 状态
  locale,         // Ref<string>
  fallbackLocale, // Ref<string | string[] | object>
  messages,       // ComputedRef<Record<string, MessageObject>>
  datetimeFormats,
  numberFormats,
  availableLocales,

  // 钩子
  setLocaleMessage,
  mergeLocaleMessage,
  getLocaleMessage,
  setDateTimeFormat,
  mergeDateTimeFormat,
  getDateTimeFormat,
  setNumberFormat,
  mergeNumberFormat,
  getNumberFormat,
} = useI18n({
  useScope: "global", // 'local'（默认） | 'global'
  // 局部作用域可重写 locale / messages / fallbackLocale
});
```

### `t()` 重载

```ts
t(key: string): string
t(key, plural: number): string
t(key, defaultMsg: string): string
t(key, list: unknown[]): string
t(key, named: Record<string, unknown>): string
t(key, plural, list): string
t(key, plural, named): string
t(key, options: TranslateOptions): string

interface TranslateOptions {
  list?: unknown[];
  named?: Record<string, unknown>;
  plural?: number;
  default?: string;
  locale?: string;
  missingWarn?: boolean;
  fallbackWarn?: boolean;
  escapeParameter?: boolean;
  resolvedMessage?: boolean;
}
```

### `d()` 重载

```ts
d(value: number | Date | string): string
d(value, key: string): string                         // 预设名
d(value, options: Intl.DateTimeFormatOptions): string // 内联选项
d(value, key, locale: string): string                 // 临时切换 locale
```

### `n()` 重载

```ts
n(value: number): string
n(value, key: string): string
n(value, options: Intl.NumberFormatOptions): string
n(value, key, locale: string): string
```

### `tm()` + `rt()`

```ts
// tm 返回原始消息（含未解析插值）
const list = tm("items"); // [{ name: "{label}" }, ...]

// rt 解析占位符
rt(list[0].name); // 解析后的字符串
```

## 全局属性（Options API / 模板）

通过 `$` 前缀在模板里直接用：

| 属性     | 说明                                |
| -------- | ----------------------------------- |
| `$t`     | 翻译                                |
| `$tm`    | 取整段消息                          |
| `$rt`    | 解析消息                            |
| `$te`    | 判断 key 是否存在                   |
| `$d`     | 日期格式化                          |
| `$n`     | 数字格式化                          |

```vue
<template>
  <p>{{ $t("hello") }}</p>
  <p>{{ $d(new Date(), "short") }}</p>
  <p v-if="$te('optional.message')">{{ $t("optional.message") }}</p>
</template>
```

## 实例 API（i18n.global）

`createI18n()` 返回的 i18n 实例可通过 `i18n.global` 访问全局作用域，在组件外（store / router / 拦截器）使用：

```ts
import { i18n } from "@/i18n";

// 翻译
i18n.global.t("hello");
i18n.global.d(new Date(), "short");
i18n.global.n(1234.5, "currency");

// 切换 locale
i18n.global.locale.value = "zh"; // Composition 模式
// or
i18n.global.locale = "zh";       // Legacy 模式

// 动态加载字典
i18n.global.setLocaleMessage("ja", jaMessages);
i18n.global.mergeLocaleMessage("zh", { extra: "新消息" });

// 查询
i18n.global.te("hello");
i18n.global.getLocaleMessage("zh");
i18n.global.availableLocales;
```

::: warning Legacy vs Composition 的 locale 差别

Legacy 模式 `i18n.global.locale` 是普通字符串属性。

Composition 模式 `i18n.global.locale` 是 `Ref<string>`，赋值要 `.value`。

混用两种模式的项目需谨慎。

:::

## 消息语法速查

### 插值

| 写法                  | 类型     | 调用                                  |
| --------------------- | -------- | ------------------------------------- |
| `"你好 {name}"`       | 命名     | `t('hello', { name: 'Vue' })`         |
| `"第 {0} 件"`         | 列表     | `t('item', [1])`                     |
| `"{n} 个"`            | 计数     | `t('count', 3)`                      |
| `"{'@'}"`             | 字面量   | 转义保留字符                          |

### 链接消息

| 写法                  | 作用                                          |
| --------------------- | --------------------------------------------- |
| `"@:key"`             | 引用同 locale 下另一条 key                   |
| `"@.lower:key"`       | 引用并转小写                                  |
| `"@.upper:key"`       | 引用并转大写                                  |
| `"@.capitalize:key"`  | 引用并首字母大写                              |
| `"@.custom:key"`      | 自定义 modifier（需配 `modifiers` 注册）     |

### 复数

| 写法                                           | 计数  | 选支                  |
| ---------------------------------------------- | ----- | --------------------- |
| `"car \| cars"`                                | 1 / 其它 | 默认英文规则       |
| `"零 \| 一个 \| {count} 个"`                   | 0 / 1 / 其它 | 第二/三分支     |
| 自定义 `pluralizationRules[locale]`            | -     | 返回分支索引          |

## 配置示例

### 最小 Vue 3 + Vite

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

// src/main.ts
import { createApp } from "vue";
import App from "./App.vue";
import { i18n } from "./i18n";

createApp(App).use(i18n).mount("#app");
```

### 完整生产级

```ts
import { createI18n, type I18nOptions } from "vue-i18n";

const isDev = import.meta.env.DEV;

const options: I18nOptions = {
  legacy: false,
  locale: detectInitialLocale(),
  fallbackLocale: {
    "zh-HK": ["zh-TW", "zh-CN"],
    "zh-TW": ["zh-CN"],
    default: ["en"],
  },
  messages: {}, // 启动时为空，运行时按需加载
  datetimeFormats: { /* ... */ },
  numberFormats: { /* ... */ },
  escapeParameter: true,
  missingWarn: isDev,
  fallbackWarn: isDev,
  missing: (locale, key) => {
    if (!isDev) reportMissing(locale, key);
    return `🚫 ${key}`;
  },
  postTranslation: (str) => str.replace(/敏感词/g, "***"),
  pluralizationRules: { ru: ruRule },
};

export const i18n = createI18n(options);
```

## Vite Plugin (`@intlify/unplugin-vue-i18n`)

```ts
// vite.config.ts
import VueI18nPlugin from "@intlify/unplugin-vue-i18n/vite";

export default defineConfig({
  plugins: [
    VueI18nPlugin({
      include: [path.resolve(__dirname, "src/locales/**")],
      runtimeOnly: true,     // 生产只打 runtime（不带 parser，包小）
      compositionOnly: true, // 仅 Composition API（去除 Legacy 代码，包更小）
      fullInstall: false,    // 不打入完整 API（开发用 true 防 missing）
      forceStringify: true,  // JSON / YAML 编译时全字符串化（更快解析）
    }),
  ],
});
```

| 选项             | 作用                                                              |
| ---------------- | ----------------------------------------------------------------- |
| `include`        | 翻译资源 glob，用于预编译                                         |
| `runtimeOnly`    | 生产只打 runtime，不含编译器；包减小约 30%                       |
| `compositionOnly`| 去除 Legacy API 代码                                              |
| `fullInstall`    | 是否打入全部 directives / components（false 进一步瘦身）         |
| `forceStringify` | 把字典编译为预序列化的字符串，runtime 直接 `JSON.parse`，更快   |
| `strictMessage`  | 编译时校验所有 locale key 一致                                    |
| `escapeHtml`     | 编译时对消息内 HTML 转义                                          |

## ESLint Plugin 规则全表

```bash
pnpm add -D @intlify/eslint-plugin-vue-i18n
```

| 规则                                            | 默认级别 | 作用                                       |
| ----------------------------------------------- | -------- | ------------------------------------------ |
| `no-missing-keys`                               | error    | 引用了 messages 中不存在的 key             |
| `no-missing-keys-in-other-locales`              | warn     | 某 locale 缺 key 但其它 locale 有           |
| `no-unused-keys`                                | warn     | messages 中定义但代码未引用的 key          |
| `no-raw-text`                                   | warn     | 模板里出现非 i18n 字面文本                |
| `no-duplicate-keys-in-locale`                   | error    | 同一 locale 字典中重复 key                |
| `no-html-messages`                              | warn     | 消息中含 HTML 标签                         |
| `no-v-html`                                     | warn     | 直接 v-html i18n 输出                      |
| `key-format-style`                              | -        | 强制 key 命名风格                          |
| `valid-message-syntax`                          | error    | 消息语法合法（插值、复数语法）             |
| `no-dynamic-keys`                               | warn     | 禁用 `t(variable)`（lint 无法静态分析）   |
| `no-deprecated-tc`                              | error    | 使用了已弃用的 `$tc / tc`                 |
| `no-deprecated-v-t`                             | error    | 使用了已弃用的 `v-t` 指令                 |
| `no-deprecated-i18n-component`                  | error    | 使用了已弃用的 `<i18n>` 组件（应用新 `<i18n-t>`） |

## SFC `<i18n>` 块

```vue
<template>
  <p>{{ t("hello") }}</p>
</template>

<i18n lang="yaml">
  en:
    hello: Hello
  zh:
    hello: 你好
</i18n>

<i18n locale="ja" src="./ja.json" />
<i18n global lang="json">
  {
    "en": { "footer": "©2026" },
    "zh": { "footer": "©2026" }
  }
</i18n>
```

| 属性     | 作用                                                |
| -------- | --------------------------------------------------- |
| `lang`   | `'json'`（默认）/ `'yaml'` / `'yml'` / `'json5'`   |
| `src`    | 从外部文件引入                                      |
| `locale` | 仅为单一 locale 写                                  |
| `global` | 合并到全局字典（默认仅当前组件 local）             |

## CLI 工具

### `@intlify/cli`

```bash
pnpm add -D @intlify/cli
```

主要子命令：

| 命令                       | 作用                                                  |
| -------------------------- | ----------------------------------------------------- |
| `intlify resource compile` | 预编译 JSON / YAML 翻译资源为 JS module             |
| `intlify resource extract` | 从源码提取 `t()` 调用生成翻译模板                   |
| `intlify diff`             | 对比两个 locale 字典差异                              |

### `vue-i18n-extract`（社区）

```bash
pnpm add -D vue-i18n-extract

vue-i18n-extract \
  --vueFiles "./src/**/*.?(js|vue)" \
  --languageFiles "./src/locales/*.json" \
  --output report.json
```

输出报告：

```json
{
  "missingKeys": [],   // 模板用了但字典没有的 key
  "unusedKeys": [],    // 字典定义但代码未引用
  "maybeDynamicKeys": [] // 动态拼接的 key（无法静态分析）
}
```

## 与其它框架对比

| 库                          | 生态           | 包大小  | Composition API | 复数 | 推荐场景            |
| --------------------------- | -------------- | ------- | --------------- | ---- | ------------------- |
| **Vue I18n**                | Vue 官方       | ~25KB   | ✓               | ✓    | Vue 3 项目首选     |
| `@nuxtjs/i18n`              | Nuxt 封装      | + ~10KB | ✓               | ✓    | Nuxt 应用          |
| `vue-i18n-next` (已并入主仓) | -              | -       | -               | -    | 同 Vue I18n        |
| `formatjs` / `react-intl`   | 跨框架         | ~50KB   | -               | ✓    | 跨 React/Vue 团队  |
| 自研字典 + ref              | -              | <1KB    | ✓               | ✗    | 简单 demo / 双语   |

## 版本里程碑

| 版本 | 时间    | 主要变化                                              |
| ---- | ------- | ----------------------------------------------------- |
| v8   | 2019    | 仅 Vue 2，Options API                                |
| v9   | 2021    | 重写：支持 Vue 3，新增 Composition API（`useI18n`）  |
| v10  | 2024    | Legacy 模式标记弃用警告                              |
| v11  | 2025    | 移除 `$tc/tc`、`v-t` 指令；Composition 推为默认推荐  |
| v12  | 计划    | 完全移除 Legacy，仅 Composition                      |

## 参考链接

- [Vue I18n 官方文档](https://vue-i18n.intlify.dev/)
- [intlify GitHub 组织](https://github.com/intlify)
- [`@intlify/unplugin-vue-i18n`](https://github.com/intlify/bundle-tools)
- [`@intlify/eslint-plugin-vue-i18n`](https://github.com/intlify/eslint-plugin-vue-i18n)
- [`vue-i18n-extract`](https://github.com/Spirit-class/vue-i18n-extract)
- [ICU MessageFormat](https://unicode-org.github.io/icu/userguide/format_parse/messages/)（理论基础）
