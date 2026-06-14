---
layout: doc
outline: [2, 3]
---

# 参考

> i18next **核心引擎** 常用 init 选项、t() 选项、实例 API、插件、事件速查。版本基线 v23+（API 自 v21/JSON v4 起稳定）。框架绑定 API 不在此列。

## 一、常用 init 选项与默认值

| 选项                        | 默认值          | 作用                                   |
| --------------------------- | --------------- | -------------------------------------- |
| `lng`                       | `undefined`     | 当前语言（**覆盖语言检测**）           |
| `fallbackLng`               | `'dev'`         | 回退语言（string/array/object/function）|
| `debug`                     | `false`         | 向 console 打调试日志                  |
| `ns`                        | `['translation']`| 要加载的命名空间                       |
| `defaultNS`                 | `'translation'` | 默认命名空间                           |
| `fallbackNS`                | `false`         | 命名空间回退                           |
| `keySeparator`              | `'.'`           | 嵌套 key 分隔符（`false` 关闭）        |
| `nsSeparator`               | `':'`           | 命名空间分隔符（`false` 关闭）         |
| `pluralSeparator`           | `'_'`           | 复数后缀分隔符                         |
| `contextSeparator`          | `'_'`           | 上下文后缀分隔符                       |
| `load`                      | `'all'`         | `all` / `languageOnly` / `currentOnly` |
| `preload`                   | `false`         | 预加载的语言数组                       |
| `supportedLngs`             | `false`         | 允许的语言白名单                       |
| `nonExplicitSupportedLngs`  | `false`         | 地区码按主码视为受支持                 |
| `returnNull`                | `false`         | null 是否算有效翻译                    |
| `returnEmptyString`         | `true`          | 空串是否算有效翻译                     |
| `returnObjects`             | `false`         | 允许 t 返回对象/数组                   |
| `saveMissing`               | `false`         | 上报/写回缺失 key                      |
| `partialBundledLanguages`   | `false`         | 部分内联 + 部分 backend 加载           |

## 二、interpolation 段默认值

| 字段              | 默认值   | 作用                       |
| ----------------- | -------- | -------------------------- |
| `prefix`          | <code v-pre>'{{'</code>   | 变量前缀                   |
| `suffix`          | `'}}'`   | 变量后缀                   |
| `escapeValue`     | `true`   | **HTML 转义（防 XSS）**    |
| `formatSeparator` | `','`    | 值与格式器名的分隔         |
| `nestingPrefix`   | `'$t('`  | 嵌套前缀                   |
| `nestingSuffix`   | `')'`    | 嵌套后缀                   |
| `unescapePrefix`  | `'-'`    | 跳过转义的前缀（<code v-pre>{{- v}}</code>）|
| `skipOnVariables` | `true`   | 含变量的嵌套默认跳过       |
| `maxReplaces`     | `1000`   | 单次最大替换数             |

## 三、t() 常用选项

| 选项           | 作用                                       |
| -------------- | ------------------------------------------ |
| `count`        | 触发复数（数字），也作 <code v-pre>{{count}}</code> 插值    |
| `context`      | 拼 `_<context>` 后缀选 key                  |
| `ordinal`      | `true` 启用序数复数（`_ordinal_` 段）       |
| `ns`           | 指定命名空间（覆盖 defaultNS）             |
| `defaultValue` | key 缺失时的兜底文案                        |
| `returnObjects`| 该次返回对象/数组                          |
| `formatParams` | 按变量名给格式器传 Intl 选项               |
| `replace`      | 显式提供插值变量对象                        |
| `lng`          | 该次用指定语言取词                          |
| `interpolation`| 该次覆盖插值配置（如 `{ escapeValue: false }`）|

> 传 **key 数组** `t(['a','b'])` = 按序取第一个命中；第二参传字符串 = `defaultValue` 简写。

## 四、复数 / 上下文后缀

| 场景       | key 形态                                   |
| ---------- | ------------------------------------------ |
| 基数复数   | `key_zero/_one/_two/_few/_many/_other`     |
| 序数复数   | `key_ordinal_one/_two/_few/_other`         |
| 上下文     | `key_<context>`，如 `friend_male`          |
| 上下文+复数| `key_<context>_<pluralForm>`，如 `friend_male_other` |

## 五、内置格式器（基于 Intl）

| 格式器         | 底层 API                  | 示例文案                       |
| -------------- | ------------------------- | ------------------------------ |
| `number`       | `Intl.NumberFormat`       | <code v-pre>{{val, number}}</code>              |
| `currency`     | `Intl.NumberFormat`       | <code v-pre>{{val, currency(USD)}}</code>       |
| `datetime`     | `Intl.DateTimeFormat`     | <code v-pre>{{val, datetime}}</code>           |
| `relativetime` | `Intl.RelativeTimeFormat` | <code v-pre>{{val, relativetime}}</code>       |
| `list`         | `Intl.ListFormat`         | <code v-pre>{{val, list}}</code>               |

注册自定义：`i18next.services.formatter.add(name, fn)` / `addCached(name, fn)`。

## 六、实例 API

| 方法                                  | 作用                                   |
| ------------------------------------- | -------------------------------------- |
| `init(options, cb?)`                  | 初始化，返回 Promise                   |
| `t(key, options?)`                    | 取词（核心）                           |
| `changeLanguage(lng, cb?)`            | 切语言，返回 Promise                   |
| `exists(key, options?)`               | key 是否存在（布尔）                   |
| `getFixedT(lng, ns, keyPrefix?)`      | 固定语言/命名空间的 t                  |
| `use(plugin)`                         | 接入插件（可链式）                     |
| `createInstance(options?, cb?)`       | 新建独立实例                           |
| `cloneInstance(options?)`             | 克隆实例（默认共享 store）             |
| `addResource(s)Bundle(...)`           | 运行时注入翻译                         |
| `loadNamespaces(ns, cb?)`             | 加载命名空间                           |
| `dir(lng?)`                           | 返回 `'ltr'` / `'rtl'`                 |
| `on/off(event, cb)`                   | 监听/取消事件                          |

属性：`i18next.language`（当前语言）、`i18next.languages`（回退查找序列）、`i18next.store`（资源仓）。

## 七、事件

| 事件              | 触发时机                     |
| ----------------- | ---------------------------- |
| `initialized`     | 初始化完成                   |
| `loaded`          | 资源加载完成                 |
| `languageChanged` | `changeLanguage` 完成        |
| `missingKey`      | 命中缺失 key                 |

## 八、官方常用插件

| 插件                                 | 作用                               |
| ------------------------------------ | ---------------------------------- |
| `i18next-browser-languagedetector`   | 浏览器语言检测（`type: languageDetector`）|
| `i18next-http-backend`               | HTTP 按需加载翻译（`type: backend`）|
| `i18next-fs-backend`                 | Node 文件系统加载翻译              |
| `i18next-resources-to-backend`       | `import()` 动态导入翻译            |
| `i18next-chained-backend`            | 多 backend 链式回退                |
| `react-i18next` / `i18next-vue`      | React / Vue 绑定层（依赖 i18next） |

---

命令查完，进 [指南 · 基础](./guide-line/base) 理解机制，或 [指南 · 进阶](./guide-line/advanced) 看插件与懒加载实战。
