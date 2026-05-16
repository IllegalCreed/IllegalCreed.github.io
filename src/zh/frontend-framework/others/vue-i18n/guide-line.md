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

## `t()` 函数完整签名

`t()` 表面看像普通 lookup，实际有多个重载，应付不同场景：

```ts
// 1. 仅 key
t("hello");

// 2. key + 列表插值
t("welcome", ["Vue"]);

// 3. key + 命名插值
t("welcome", { name: "Vue" });

// 4. key + 复数计数
t("apple", 3);

// 5. key + 计数 + 命名插值
t("apple", 3, { named: { extra: "fresh" } });

// 6. key + options 对象（最完整形式）
t("hello", {
  named: { name: "Vue" },
  list: ["Vue"],
  plural: 1,
  default: "Fallback",
  locale: "en",      // 覆盖当前 locale
  missingWarn: false, // 抑制 missing 警告
  fallbackWarn: false,
  escapeParameter: true,
});
```

完整 options 字段表：

| 字段              | 类型      | 作用                                                       |
| ----------------- | --------- | ---------------------------------------------------------- |
| `list`            | `unknown[]` | 列表插值（替代第二参数的数组形式）                       |
| `named`           | `Record`    | 命名插值                                                  |
| `plural`          | `number`    | 复数计数                                                  |
| `default`         | `string`    | 命中 missing 时返回的默认值                              |
| `locale`          | `string`    | 临时切换 locale（不影响全局 `i18n.global.locale`）        |
| `missingWarn`     | `boolean`   | 该次调用关闭 missing key 警告                            |
| `fallbackWarn`    | `boolean`   | 关闭 fallback 链路警告                                   |
| `escapeParameter` | `boolean`   | 仅这次插值开启转义（防 XSS）                              |
| `resolvedMessage` | `boolean`   | 把 key 当作已解析的消息字符串处理（少用）                |

::: tip 何时用 options 对象

写应用代码时大多数情况用「key + named 对象」就够了。**options 对象用于工具库 / 上游封装**——比如做一个 `<I18n>` 通用组件，把 `default` / `escapeParameter` 暴露成 prop。

:::

## Fallback Locale 策略

`fallbackLocale` 控制 key 在当前 locale 找不到时往哪里降级：

```ts
createI18n({
  locale: "zh-HK",
  fallbackLocale: {
    "zh-HK": ["zh-TW", "zh-CN"], // zh-HK 优先回退到 zh-TW，再 zh-CN
    "zh-TW": ["zh-CN"],
    default: ["en"],              // 兜底
  },
});
```

四种写法：

| 形式                                   | 行为                                                         |
| -------------------------------------- | ------------------------------------------------------------ |
| 单字符串 `'en'`                        | 所有 locale 找不到都回退到 en                                |
| 数组 `['zh-TW', 'en']`                 | 依次尝试，第一个命中即返回                                   |
| 对象 `{ 'zh-HK': [...], default: [] }` | 每个 locale 独立 fallback 链；`default` 是兜底               |
| `false`                                | 关闭 fallback，找不到就抛出 / 返回 key                       |

```ts
// 同时关闭 fallback 警告
createI18n({
  fallbackLocale: "en",
  fallbackWarn: false,        // 不告警「key 走了 fallback」
  silentFallbackWarn: true,   // 等价别名（v9 用）
});
```

::: warning 别让 fallback 掩盖 missing 问题

线上把 `fallbackWarn` 关掉是合理的，但 dev 环境应保留——否则翻译漏掉时不会有任何提示，直到用户切到 fallback locale 才暴露。建议：`fallbackWarn: import.meta.env.PROD ? false : true`。

:::

## Missing Key 处理

Key 不存在时默认行为：console 警告 + 返回 key 字符串。可注入自定义 handler 改变行为：

```ts
createI18n({
  missing: (locale, key, instance, type) => {
    // 1. 上报到 Sentry / 自家埋点
    if (import.meta.env.PROD) {
      reportToSentry({ event: "i18n_missing", locale, key });
    }
    // 2. 返回自定义占位
    return `🚫 ${key}`;
  },
  missingWarn: import.meta.env.DEV, // 仅 dev 输出 warning
});
```

`missingWarn` 取值：

- `true` / `false`：开/关
- `string`：正则匹配 key（如 `/^user\./` 只对 `user.*` 类 key 警告）
- `RegExp`：同上

```ts
// 只对核心命名空间警告，其它静默
missingWarn: /^(common|errors)\./;
```

## Post Translation Hook

`postTranslation` 在每次 `t()` 计算完插值后调用，可统一加工结果：

```ts
createI18n({
  postTranslation: (str, key) => {
    // 1. 自动给所有翻译加视觉标记，方便定位漏翻
    if (import.meta.env.DEV) {
      return `🇨🇳 ${str}`;
    }
    // 2. 过滤敏感词 / 全角半角转换 / 等
    return str.replace(/敏感词/g, "***");
  },
});
```

适用场景：

- **伪本地化测试**：把翻译包裹特殊符号（`[--%s--]`），快速发现「直接写英文没用 i18n」的硬编码
- **统一标点**：英文翻译里的全角 → 半角
- **加 i18n 调试边框**：dev 环境把每段翻译染色

::: tip 与 `escapeParameter` 配合

`postTranslation` 在 `escapeParameter` 之后执行。想做转义后再加工要在 hook 内继续处理；想做加工再转义需在 hook 外手动 escape。

:::

## 转义与 XSS

默认插值变量**不转义**——所以 <span v-pre>`<p>{{ t('greet', { name: '<script>' }) }}</p>`</span> 是文本节点，浏览器不会执行 `<script>`，安全。但**配合 `v-html` 时**风险陡增：

```vue
<!-- 危险写法 -->
<p v-html="t('tip', { content: userInput })" />
```

`userInput` 是用户输入，如果含 `<img onerror=...>`，`v-html` 会执行。开启全局参数转义：

```ts
createI18n({
  escapeParameter: true, // 所有 t() 调用，插值变量自动 HTML escape
});
```

或单次调用开启：

```ts
t("tip", { content: userInput }, { escapeParameter: true });
```

::: danger v-html 仍危险

`escapeParameter` 只转义**插值变量**，不转义**消息模板本身**。如果消息模板里写了 `<script>`，仍然会被执行。规则：

1. 消息模板永远是开发者写的可信内容
2. 用户输入只能进**插值变量**且要 `escapeParameter`
3. 翻译里包含 HTML 标签需 `v-html` 时，**插值变量必须 escape**

:::

## DevTools 集成

Vue I18n v9+ 与 Vue DevTools 深度集成：

- **i18n 面板**：列出当前 locale、可用 locales、所有已加载消息（树状）
- **Performance 标签**：查看 `t()` 调用耗时（性能优化时有用）
- **Time travel**：切换 locale 历史 → undo/redo

启用前提：

```ts
createI18n({
  legacy: false,
  // ...
});

// app.use(i18n) 后 DevTools 自动接管
```

::: tip 生产环境关掉 DevTools

```ts
const i18n = createI18n({
  // ...
  __VUE_PROD_DEVTOOLS__: false, // Vite 中通过 define 配置
});
```

或在 Vite config 中：

```ts
define: {
  __INTLIFY_PROD_DEVTOOLS__: "false",
}
```

减少生产 bundle ~5KB。

:::

## 性能优化

### 预编译 vs 运行时

Vue I18n 解析消息有两种模式：

| 模式      | 包体        | 启动        | 运行         | 场景                                       |
| --------- | ----------- | ----------- | ------------ | ------------------------------------------ |
| 预编译    | 小          | 快          | 快           | 用 `@intlify/unplugin-vue-i18n` 编译资源 |
| 运行时    | 大（含 parser） | 中          | 慢（解析）   | 直接 `import json`，未走插件               |

启用预编译：

```ts
// vite.config.ts
import VueI18nPlugin from "@intlify/unplugin-vue-i18n/vite";

VueI18nPlugin({
  include: [path.resolve(__dirname, "src/locales/**")],
  runtimeOnly: true, // 生产模式只打 runtime，不带 parser
});
```

`runtimeOnly: true` 后所有翻译资源必须经插件编译——`fetch` 后 `setLocaleMessage` 拿到的 JSON 字符串无法直接用，需先 `compileMessages`。

### Tree Shaking 未用语言

监控 bundle，确认未用 locale 不被打入主包。技巧：

```ts
// ❌ 静态 import 全打入
import zh from "./locales/zh.json";
import en from "./locales/en.json";
import ja from "./locales/ja.json";

// ✅ 动态 import，每个 locale 独立 chunk
const loadLocale = (locale) => import(`./locales/${locale}.json`);
```

Vite 会为每个 `import('./locales/' + var + '.json')` 生成独立 chunk，只在切到该 locale 时下载。

### 大字典优化

字典 >100KB 时考虑：

1. **按命名空间拆分**：`common.json` / `pages/dashboard.json` / `errors.json` 等
2. **路由级懒加载**：进 `/dashboard` 才加载 `pages/dashboard` 字典
3. **CDN 分发**：字典放 CDN，浏览器缓存友好
4. **gzip / brotli**：JSON 压缩率 80%+

## SSR / SSG 集成

Nuxt 之外的 SSR 框架（Vite SSR / vite-plugin-ssr）使用 Vue I18n 需要：

```ts
// src/i18n/index.ts
import { createI18n } from "vue-i18n";

export function setupI18n(locale = "en") {
  const i18n = createI18n({
    legacy: false,
    locale,
    fallbackLocale: "en",
    messages: {
      /* 启动时只装当前 locale，避免 SSR 序列化所有字典 */
    },
  });
  return i18n;
}
```

```ts
// server.ts（Vite SSR）
async function render(url, manifest) {
  const lang = detectLocale(req); // 从 Accept-Language / cookie 判断
  const i18n = setupI18n(lang);
  await loadLocaleMessages(i18n, lang);

  const app = createApp(App);
  app.use(i18n);
  // ...renderToString
}
```

::: warning 不要在客户端复用服务端 i18n 实例

服务端 i18n 是单请求级（避免请求间串数据），客户端是单页应用级。**客户端 hydration 时必须新建 i18n 实例**，并用服务端传来的 `__INITIAL_LOCALE__` 初始化。

:::

## 路由集成

URL 中带 locale 是 SEO 友好的做法（`/zh/about` / `/en/about`）。Vue Router 中实现：

### 策略 1：路由前缀

```ts
const router = createRouter({
  routes: [
    {
      path: "/:locale(en|zh)?",  // 可选 locale 前缀
      children: [
        { path: "", component: Home },
        { path: "about", component: About },
      ],
    },
  ],
});

router.beforeEach(async (to) => {
  const locale = (to.params.locale as string) || "en";
  await loadLocale(locale);
  i18n.global.locale.value = locale;
});
```

URL：
- `/` → 默认 en
- `/zh/about` → 中文 about 页

### 策略 2：路由名 + 中间件

不改 URL 结构，用 cookie / localStorage 存 locale：

```ts
router.beforeEach((to) => {
  const stored = localStorage.getItem("locale") || navigator.language;
  i18n.global.locale.value = stored.startsWith("zh") ? "zh" : "en";
});
```

URL 都是 `/about`，根据用户偏好显示。**缺点**：SEO 不友好，搜索引擎拿不到独立 locale URL。

::: tip 选哪个？

- B 端 / 企业内系统：策略 2（用户偏好）
- C 端 / SEO 关键：策略 1（URL 前缀，每个 locale 都有独立 URL 索引）

:::

## 测试策略

### Vitest 中 mock i18n

组件单测里不需要真实翻译，mock 一个轻量 `t`：

```ts
// test/setup.ts
import { config } from "@vue/test-utils";

config.global.mocks = {
  $t: (key: string) => key,        // 直接返回 key 作翻译
  $d: (date: Date) => date.toISOString(),
  $n: (num: number) => String(num),
};
```

或装真 i18n：

```ts
// test/setup.ts
import { createI18n } from "vue-i18n";
import { config } from "@vue/test-utils";

const i18n = createI18n({
  legacy: false,
  locale: "en",
  messages: {
    en: { hello: "Hello", error: { notFound: "Not Found" } },
  },
});

config.global.plugins = [i18n];
```

### 翻译完整性测试

为防漏翻，写一个测试遍历所有 key 在所有 locale 都有定义：

```ts
import en from "@/locales/en.json";
import zh from "@/locales/zh.json";

function flatKeys(obj, prefix = "") {
  return Object.entries(obj).flatMap(([k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    return typeof v === "object" ? flatKeys(v, key) : [key];
  });
}

test("locales have same keys", () => {
  const enKeys = flatKeys(en).sort();
  const zhKeys = flatKeys(zh).sort();
  expect(zhKeys).toEqual(enKeys);
});
```

## ESLint Plugin

`@intlify/eslint-plugin-vue-i18n` 提供翻译相关 lint 规则：

| 规则                                            | 作用                                       |
| ----------------------------------------------- | ------------------------------------------ |
| `no-missing-keys`                               | 模板里用的 key 在字典中不存在 → error      |
| `no-unused-keys`                                | 字典中定义但模板从未引用的 key → warn      |
| `no-raw-text`                                   | 模板里出现非 i18n 字面文本 → 提示          |
| `no-duplicate-keys-in-locale`                   | 同一 locale 字典里重复 key                 |
| `no-html-messages`                              | 消息里出现 HTML 标签 → warn（推 escape）   |
| `key-format-style`                              | key 命名风格（camelCase / kebab-case 等）  |
| `valid-message-syntax`                          | 消息语法合法（插值、复数等）               |

flat config（v9+）配置示例：

```ts
// eslint.config.ts
import vueI18nPlugin from "@intlify/eslint-plugin-vue-i18n";

export default [
  {
    files: ["**/*.{vue,ts,js}"],
    plugins: { "vue-i18n": vueI18nPlugin },
    rules: {
      "vue-i18n/no-missing-keys": "error",
      "vue-i18n/no-unused-keys": ["warn", { extensions: [".ts", ".vue"] }],
      "vue-i18n/no-raw-text": ["warn", { ignoreText: ["—", "·", "/"] }],
    },
    settings: {
      "vue-i18n": {
        localeDir: "./src/locales/*.json",
        messageSyntaxVersion: "^11",
      },
    },
  },
];
```

::: warning no-unused-keys 在大项目易误报

大项目里 key 可能被字符串拼接动态拿（`t('errors.' + code)`），lint 看不到 → 误报 unused。解决：用 disabled comment 标记动态 key 命名空间，或在该文件用 `t` 的同时显式写 `// vue-i18n-extract: errors.*`。

:::

## 常见陷阱

### Vue 2 残留代码

```ts
// ❌ Vue 2 / Legacy
this.$t("hello");
this.$tc("apple", 10);
v-t="'hello'"

// ✅ Vue 3 / Composition
const { t } = useI18n();
t("hello");
t("apple", 10);
```

迁移技巧：grep `\$tc\|v-t=\|this\.\$t` 找出残留。

### `useI18n` 默认 local 作用域踩坑

```vue
<!-- 期望切换语言，但没生效 -->
<script setup>
import { useI18n } from "vue-i18n";
const { locale } = useI18n(); // ❌ 默认 local，改的是本组件的 locale
function switchLang() {
  locale.value = "zh"; // 只影响本组件
}
</script>
```

切换全局必须显式 `useScope: 'global'`：

```ts
const { locale } = useI18n({ useScope: "global" });
locale.value = "zh"; // ✅ 影响所有组件
```

### `tm()` 返回的对象不能直接渲染

```vue
<!-- ❌ 拿到的是 raw messages，未解析插值 -->
<template>
  <p v-for="item in tm('list')">{{ item }}</p>
</template>

<!-- ✅ 必须配合 rt() 解析 -->
<template>
  <p v-for="item in tm('list')">{{ rt(item) }}</p>
</template>
```

### 服务端 / 单测中 `useI18n` 报错

`useI18n` 必须在 `setup()` 调用，不能在普通函数 / store action 中用：

```ts
// ❌ 在 store 里报错
import { defineStore } from "pinia";
import { useI18n } from "vue-i18n";

export const useUserStore = defineStore("user", () => {
  const { t } = useI18n(); // ❌ "Must be called at top of setup()"
  function fetchUser() {
    return t("user.fetching"); // 错
  }
});

// ✅ 用全局实例
import { i18n } from "@/i18n";
function fetchUser() {
  return i18n.global.t("user.fetching");
}
```
