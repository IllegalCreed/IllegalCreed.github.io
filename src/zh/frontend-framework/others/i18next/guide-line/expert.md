---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

> 版本基线 **i18next v23+**。深入引擎内核：v3→v4 复数迁移与序数复数、`skipOnVariables` 安全模型、多实例与 SSR、TypeScript 类型安全、`saveMissing` 工作流、`supportedLngs` 边界控制、`exists`/`getFixedT`/`dir` 等高级 API。

## 一、复数 v3 → v4 迁移与序数

**v21（JSON format v4）** 把复数后缀从 v3 的单一 `_plural`（以及 `_0/_1/...`）改为对齐 `Intl.PluralRules` 的类别后缀：

```json
// v3（旧）
{ "key": "{{count}} item", "key_plural": "{{count}} items" }

// v4（新）
{ "key_one": "{{count}} item", "key_other": "{{count}} items" }
```

> 官方提供转换工具迁移旧资源；极旧环境需 polyfill `Intl.PluralRules`。

**序数复数**（1st / 2nd / 3rd）用 `ordinal: true`，key 带 `_ordinal_` 段：

```json
{
  "place_ordinal_one": "{{count}}st place",
  "place_ordinal_two": "{{count}}nd place",
  "place_ordinal_few": "{{count}}rd place",
  "place_ordinal_other": "{{count}}th place"
}
```

```js
i18next.t("place", { count: 2, ordinal: true }); // -> "2nd place"
```

底层走 `Intl.PluralRules` 的 `type: 'ordinal'`。

## 二、skipOnVariables：嵌套的安全闸

```js
// 默认 interpolation.skipOnVariables = true
// 含变量的嵌套会被「跳过」，需显式关掉才生效
await i18next.init({
  interpolation: { skipOnVariables: false },
});
```

```json
{
  "girlsAndBoys": "$t(girls, {\"count\": {{girls}} }) and $t(boys, {\"count\": {{boys}} })"
}
```

为什么默认开着？防止「用户输入混进嵌套 options 的 JSON」造成注入。关掉后要自行注意 XSS 与注入风险。

## 三、多实例与 SSR

并发服务端（每请求一种语言）必须用**独立实例**，否则全局单例的语言状态会相互串味：

```js
import i18next from "i18next";

// 全新独立实例（不共享状态）
const inst = i18next.createInstance();
await inst.init({ lng: req.language, fallbackLng: "en", resources });
inst.t("key");

// 克隆实例（默认共享 store/plugins/初始配置，可 forkResourceStore 分叉资源）
const child = i18next.cloneInstance({ lng: "de" });
```

配合 `getFixedT` 生成「固定语言/命名空间」的 t，省去每次传参：

```js
const tDe = i18next.getFixedT("de", "common");
tDe("save"); // 固定 de + common
```

## 四、TypeScript 类型安全

用**模块增强**把资源类型喂给 i18next，`t('...')` 即获得 key 补全与校验：

```ts
// i18next.d.ts
import "i18next";
import en from "./locales/en/translation.json";
import common from "./locales/en/common.json";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: {
      translation: typeof en;
      common: typeof common;
    };
  }
}
```

```ts
i18next.t("nav.home"); // ✅ 有补全；拼错 key 会报类型错
i18next.t(($) => $.nav.home); // selector 形式，类型更稳
```

## 五、saveMissing 工作流

```js
await i18next.init({
  saveMissing: true,
  missingKeyHandler: (lngs, ns, key, fallbackValue) => {
    console.warn(`[i18n missing] ${ns}:${key}`);
  },
});
```

- 遇缺失 key 会触发上报/写回流程：调 `missingKeyHandler`，或交给支持写回的 backend（如 http-backend 的 `addPath`、locize）。
- 它**不会**机器翻译、不会抛错中断渲染——只是把缺失 key 收集起来便于补翻译。开发期用，生产关闭。

## 六、supportedLngs 与地区码

```js
await i18next.init({
  supportedLngs: ["en", "de", "fr"],
  nonExplicitSupportedLngs: true, // en-US 等地区码按主码 en 视为受支持
});
```

- `supportedLngs` 限定允许的语言；不在列表的会被拒。
- `nonExplicitSupportedLngs: true` 让 `en-US` 这类「非显式」地区码也被接受（按 `en` 处理），无需逐一列出每个地区变体。
- `cleanCode` / `lowerCaseLng` 只管大小写，**不**解决地区码被拒的问题——别混淆。

## 七、几个高频高级 API

| API                       | 作用                                                      |
| ------------------------- | --------------------------------------------------------- |
| `exists(key, options?)`   | 用与 t 相同的解析逻辑返回**布尔**（t 总返回字符串）       |
| `getFixedT(lng, ns)`      | 返回固定语言/命名空间的 t（SSR / 组件内固定 ns）          |
| `dir(lng?)`               | 返回 `'ltr'` / `'rtl'`，用于 RTL 布局（如 `<html dir>`）  |
| `changeLanguage(lng)`     | 切换语言，返回 Promise，完成触发 `languageChanged`        |
| `loadNamespaces(ns)`      | 主动触发某命名空间（backend）加载                          |
| `getResourceBundle(l, n)` | 取某语言某命名空间的整份资源                                |

## 八、辨析：核心引擎 ≠ 框架绑定

最后强调本系列贯穿的边界：

- **i18next 核心**（本系列）：`init` / `t` / `changeLanguage` / `addResourceBundle`…… 框架无关，Node 与浏览器都能跑。
- **react-i18next / i18next-vue**：建立在核心之上的**绑定层**，提供 `useTranslation`、`<Trans>` 等让翻译随语言切换自动重渲染——它们**依赖** i18next。
- **vue-i18n**：Vue 生态**另一套独立**的 i18n 方案（本站单列），不是 i18next 的绑定。

把「谁是引擎、谁是封装」理清，就不会把 react-i18next 当成 i18next 本体。

---

回到 [入门](../getting-started) 复习用法，或查 [参考](../reference) 速览选项与 API。
