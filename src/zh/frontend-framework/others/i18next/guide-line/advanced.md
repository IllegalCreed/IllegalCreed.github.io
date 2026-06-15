---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

> 版本基线 **i18next v23+**。把 i18next 用进真实项目：语言检测插件、HTTP 懒加载、动态注入翻译、`fallbackLng` 高级形式、`load` 策略、事件系统、自定义格式器。只讲核心引擎与官方插件。

## 一、语言检测：i18next-browser-languagedetector

浏览器里自动识别用户语言（cookie / localStorage / `navigator.language` 等）：

```js
import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";

await i18next.use(LanguageDetector).init({
  fallbackLng: "en",
  detection: {
    order: ["cookie", "localStorage", "navigator"], // 检测优先级
    caches: ["localStorage"], // 把检测结果缓存到哪
  },
});
```

> ⚠️ 用检测器时**不要再硬写 `lng`**——`lng` 会覆盖语言检测。

## 二、HTTP 懒加载：i18next-http-backend

不把翻译打进 bundle，运行时按需从服务器拉 JSON：

```js
import i18next from "i18next";
import HttpBackend from "i18next-http-backend";

await i18next.use(HttpBackend).init({
  fallbackLng: "en",
  ns: ["translation", "common"],
  backend: {
    loadPath: "/locales/{{lng}}/{{ns}}.json", // {{lng}}/{{ns}} 会被替换
  },
});
```

- `loadPath` 里的 <code v-pre>{{lng}}</code>、<code v-pre>{{ns}}</code> 会替换成实际语言与命名空间去请求。
- Node 端从**文件系统**读用 `i18next-fs-backend`；想用 `import()` 动态导入用 `i18next-resources-to-backend`。

::: tip 内联 resources 与 backend 不互为 fallback
官方明确：直接同时给 `resources` 和 backend，二者**不会**自动拿一方当兜底。要链式回退请用 `i18next-chained-backend`。
:::

## 三、检测 + 加载 + 回退：组合配置

```js
import i18next from "i18next";
import HttpBackend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

await i18next
  .use(HttpBackend)
  .use(LanguageDetector)
  .init({
    fallbackLng: "en",
    supportedLngs: ["en", "de", "fr", "zh"],
    ns: ["translation", "common"],
    defaultNS: "translation",
    fallbackNS: "common",
    backend: { loadPath: "/locales/{{lng}}/{{ns}}.json" },
    detection: { order: ["localStorage", "navigator"], caches: ["localStorage"] },
  });
```

`.use()` 可链式串联多个插件，最后 `.init()`。每类插件靠自身 `type` 字段（`backend` / `languageDetector` / `postProcessor` 等）声明角色。

## 四、fallbackLng 的高级形式

`fallbackLng` 支持 string / array / object / function 四种：

```js
// 数组：依次尝试
fallbackLng: ["fr", "en"];

// 对象：按语言定制回退链，default 兜底
fallbackLng: {
  "zh-Hant": ["zh-Hans", "en"],
  "de-CH": ["fr", "it"],
  default: ["en"],
};

// 函数：动态决定回退链
fallbackLng: (code) => (code === "zh-TW" ? ["zh-CN", "en"] : ["en"]);
```

## 五、load 策略：要不要带地区

```js
await i18next.init({
  load: "languageOnly", // 把 en-US 当 en 加载，忽略地区
  // load: 'all'        // 默认：加载 en-US / en / dev
  // load: 'currentOnly'// 只加当前精确码
});
```

`load: 'languageOnly'` 适合「不想为每个地区单独维护文件」的项目。

## 六、动态注入翻译

代码分割时，把某模块的翻译运行时合并进来：

```js
i18next.addResourceBundle(
  "en", // 语言
  "moduleA", // 命名空间
  { title: "Module A" }, // 一批 key
  true, // deep：深度合并
  true // overwrite：覆盖已有
);

// 单条：
i18next.addResource("en", "moduleA", "subtitle", "Hello");
```

也可用 `i18next.loadNamespaces('moduleA')` 触发某命名空间的（backend）加载。

## 七、事件系统

```js
i18next.on("initialized", (options) => {});
i18next.on("loaded", (loaded) => {}); // 资源加载完成
i18next.on("languageChanged", (lng) => {}); // 语言切换完成 → 刷新 UI
i18next.on("missingKey", (lngs, ns, key, res) => {}); // 命中缺失 key

i18next.off("languageChanged", handler); // 取消监听
```

> i18next 用 `on` / `off`，不是 DOM 的 `addEventListener`。绑定层（如 react-i18next）正是监听 `languageChanged` 来自动重渲染。

## 八、自定义格式器

```js
// 普通：每次调用都跑
i18next.services.formatter.add("uppercase", (value, lng, options) => value.toUpperCase());

// 缓存版：适合 Intl 这类构造开销大的
i18next.services.formatter.addCached("eur", (lng, options) => {
  const f = new Intl.NumberFormat(lng, { style: "currency", currency: "EUR", ...options });
  return (val) => f.format(val);
});
```

文案里即可写 <code v-pre>{{name, uppercase}}</code> / <code v-pre>{{price, eur}}</code>。

---

进入 [指南 · 专家](./expert)：v3→v4 复数迁移、序数复数、skipOnVariables 安全、多实例与 SSR、TypeScript 类型安全、saveMissing 工作流。
