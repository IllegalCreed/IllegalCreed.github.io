---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

> 版本基线 **i18next v23+**（API 自 v21/JSON v4 起稳定）。本篇把「会取词」用到「懂机制」：插值与格式化、复数与上下文、命名空间与回退、init 配置全景。只讲核心引擎。

## 一、init 配置全景与默认值

最常打交道的几个选项与默认值（其余见[参考](../reference)）：

| 选项                         | 默认值          | 作用                             |
| ---------------------------- | --------------- | -------------------------------- |
| `lng`                        | `undefined`     | 当前语言（**会覆盖语言检测**）   |
| `fallbackLng`                | `'dev'`         | 回退语言（实际项目几乎都要改）   |
| `ns` / `defaultNS`           | `'translation'` | 命名空间 / 默认命名空间          |
| `keySeparator`               | `'.'`           | 嵌套 key 分隔符                  |
| `nsSeparator`                | `':'`           | 命名空间分隔符                   |
| `pluralSeparator`            | `'_'`           | 复数后缀分隔符                   |
| `contextSeparator`           | `'_'`           | 上下文后缀分隔符                 |
| `interpolation.escapeValue`  | `true`          | 插值是否 HTML 转义（防 XSS）     |
| `returnEmptyString`          | `true`          | 空串是否算有效翻译               |
| `returnNull`                 | `false`         | null 是否算有效翻译              |

> 记住三个分隔符默认：嵌套 `.`、命名空间 `:`、复数/上下文 `_`。它们决定了 key 怎么被拆解。

## 二、插值进阶

```js
// 默认 {{var}}，默认 HTML 转义
i18next.t("greeting", { name: "<b>Jed</b>" });
// -> "Hello &lt;b&gt;Jed&lt;/b&gt;"

// 关闭该次转义：两种方式
i18next.t("greeting", { name: "<b>Jed</b>", interpolation: { escapeValue: false } });
// 或在文案里用连字符前缀：  "greeting": "Hello {{- name}}"
```

::: warning 关闭转义 = 自负其责
一旦 `escapeValue: false` 或用 <code v-pre>{{- var}}</code>，i18next 不再替你转义；若此处插入的是用户输入，**必须自己先转义**，否则有 XSS 风险。
:::

插值相关默认（`interpolation` 段）：<code v-pre>prefix '{{'</code>、`suffix '}}'`、`escapeValue true`、`formatSeparator ','`、`nestingPrefix '$t('`、`nestingSuffix ')'`、`unescapePrefix '-'`、`skipOnVariables true`。

## 三、格式化：内置走 Intl

文案语法 <code v-pre>{{value, formatname}}</code>，逗号后接格式器名：

```js
const en = {
  intlNumber: "Some {{val, number}}",
  intlCurrency: "Cost {{val, currency(USD)}}",
  intlDate: "On {{val, datetime}}",
};

i18next.t("intlNumber", { val: 1000 }); // -> "Some 1,000"
i18next.t("intlCurrency", { val: 2000 }); // -> "Cost $2,000.00"
```

内置格式器全部基于 Intl：

| 格式器名       | 底层 API                 |
| -------------- | ------------------------ |
| `number`       | `Intl.NumberFormat`      |
| `currency`     | `Intl.NumberFormat`（currency） |
| `datetime`     | `Intl.DateTimeFormat`    |
| `relativetime` | `Intl.RelativeTimeFormat`|
| `list`         | `Intl.ListFormat`        |

传选项三种方式：① 写文案里 <code v-pre>{{val, number(minimumFractionDigits: 2)}}</code>（分号分隔多项）；② options 根级 `t('k', { minimumFractionDigits: 3 })`；③ 按变量精确传 `t('k', { formatParams: { val: { minimumFractionDigits: 3 } } })`。

## 四、复数：对齐 Intl.PluralRules

```json
{
  "key_zero": "没有内容",
  "key_one": "{{count}} 条内容",
  "key_other": "{{count}} 条内容"
}
```

```js
i18next.t("key", { count: 0 }); // -> "没有内容"（_zero 给 0 更自然的措辞）
i18next.t("key", { count: 1 }); // -> "1 条内容"
```

- 完整后缀：`_zero / _one / _two / _few / _many / _other`，具体语言用哪几个由 `Intl.PluralRules` 决定。
- **必须传 `count`**；不传不会回退到裸 key。
- v3 的单一 `_plural` 后缀已被 v4 的 Intl 类别后缀取代（迁移见[专家篇](./expert)）。

## 五、上下文：按场景选措辞

```json
{
  "friend": "A friend",
  "friend_male": "A boyfriend",
  "friend_female": "A girlfriend"
}
```

```js
i18next.t("friend", { context: "male" }); // -> "A boyfriend"，找不到 friend_male 再回落 friend
```

- context 在 key 后拼 `_<context>` 后缀（`contextSeparator` 默认 `_`）。
- **与复数叠加**时顺序是 `key_<context>_<pluralForm>`，如 `friend_male_one` / `friend_male_other`；调用 `t('friend', { context: 'male', count: 100 })` 命中 `friend_male_other`。

## 六、嵌套：一条文案引用另一条

```json
{
  "nesting1": "1 $t(nesting2)",
  "nesting2": "2 $t(nesting3)",
  "nesting3": "3"
}
```

```js
i18next.t("nesting1"); // -> "1 2 3"
```

- 语法 `$t(key)`（`nestingPrefix '$t('`、`nestingSuffix ')'`）；可跨命名空间 `$t(common:key)`。
- 可给被嵌 key 传 options（合法 JSON）：<code v-pre>"x": "They have $t(boys, {\"count\": {{c}} })"</code>。
- ⚠️ 默认 `skipOnVariables: true`，含变量的嵌套默认被跳过，需要时显式关掉（见[专家篇](./expert)）。

## 七、命名空间与回退

```js
await i18next.init({
  ns: ["app", "common"],
  defaultNS: "app",
  fallbackNS: "common", // app 缺 key → 去 common 找
  fallbackLng: "en", // 当前语言缺 key → 去 en 找
});
```

- `fallbackLng`：**语言**回退（换语言找 key）。
- `fallbackNS`：**命名空间**回退（换命名空间找 key）。两者维度不同，别混。

---

进入 [指南 · 进阶](./advanced)：语言检测插件、HTTP 懒加载、动态注入翻译、fallbackLng 高级形式、事件系统。
