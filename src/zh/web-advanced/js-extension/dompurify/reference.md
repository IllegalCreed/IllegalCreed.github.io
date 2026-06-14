---
layout: doc
outline: [2, 3]
---

# 参考

> DOMPurify **常用 API、配置项、hooks 入口与返回类型**速查。版本基线 **3.x**。默认值以源码 `src/purify.ts` 为准。

## 一、核心 API

| API | 作用 |
|---|---|
| `DOMPurify.sanitize(dirty, config?)` | 净化字符串或节点，返回安全结果（默认字符串） |
| `DOMPurify.addHook(entryPoint, cb)` | 在指定入口注册钩子，定制净化过程 |
| `DOMPurify.removeHook(entryPoint)` | 移除该入口**最近一个**钩子 |
| `DOMPurify.removeHooks(entryPoint)` | 移除该入口的**全部**钩子 |
| `DOMPurify.removeAllHooks()` | 清空**所有入口**的全部钩子 |
| `DOMPurify.setConfig(cfg)` / `clearConfig()` | 设置 / 清除全局默认配置 |
| `DOMPurify.isSupported` | 布尔属性：当前环境是否支持净化 |
| `DOMPurify.version` | 当前版本号字符串 |
| `createDOMPurify(window)` | 工厂函数，传入 window 得到实例（Node 端用） |

## 二、返回类型（随配置变化）

| 配置 | 返回类型 | 用途 |
|---|---|---|
| （默认，无标志） | `string` | 直接赋给 `innerHTML` / `v-html` |
| `RETURN_DOM: true` | `Node`（`HTMLBodyElement`） | 需直接做 DOM 操作 |
| `RETURN_DOM_FRAGMENT: true` | `DocumentFragment` | 批量插入；内部会强制 `RETURN_DOM` |
| `RETURN_TRUSTED_TYPE: true` | `TrustedHTML` | 严格 CSP / Trusted Types sink |
| `IN_PLACE: true`（入参须 `Node`） | `Node` | 就地净化已有离线节点 |

> 3.x 用 TypeScript 函数重载精确刻画：`sanitize(dirty: string | Node, cfg?): string`；`{ RETURN_DOM: true }` → `Node`；`{ IN_PLACE: true }`（dirty 须 `Node`）→ `Node`。

## 三、标签 / 属性白名单配置

| 配置 | 默认 | 含义 |
|---|---|---|
| `ALLOWED_TAGS` | （全部安全标签） | **替换**标签白名单（只留你给的） |
| `ALLOWED_ATTR` | （全部安全属性） | **替换**属性白名单 |
| `ADD_TAGS` | — | 在默认白名单上**追加**标签 |
| `ADD_ATTR` | — | 在默认白名单上**追加**属性 |
| `FORBID_TAGS` | — | 在白名单上**精确移除**指定标签 |
| `FORBID_ATTR` | — | 在白名单上精确移除指定属性 |
| `FORBID_CONTENTS` | — | 被禁元素的内部内容也一并删除 |
| `ADD_URI_SAFE_ATTR` | — | 追加被视为「URI 安全」的属性 |

## 四、profile / data / aria / 协议

| 配置 | 默认 | 含义 |
|---|---|---|
| `USE_PROFILES` | `false` | 预设白名单：`{ html, svg, svgFilters, mathMl }` |
| `ALLOW_DATA_ATTR` | `true` | 是否允许 `data-*` 属性 |
| `ALLOW_ARIA_ATTR` | `true` | 是否允许 `aria-*` 属性 |
| `ALLOW_UNKNOWN_PROTOCOLS` | `false` | 是否放行未知协议的 URL（放开有风险） |
| `ALLOWED_URI_REGEXP` | （内置正则） | 自定义允许的 URL 协议 |
| `ALLOW_SELF_CLOSE_IN_ATTR` | `true` | 属性值中的自闭合处理 |

## 五、行为 / 安全开关

| 配置 | 默认 | 含义 |
|---|---|---|
| `KEEP_CONTENT` | `true` | 移除标签时保留其文本内容 |
| `WHOLE_DOCUMENT` | `false` | 输出含 `<html>`/`<head>`/`<body>` 整文档结构 |
| `SANITIZE_DOM` | `true` | 防 DOM Clobbering |
| `SANITIZE_NAMED_PROPS` | `false` | 给 `id`/`name` 加 `user-content-` 前缀，强化隔离 |
| `SAFE_FOR_TEMPLATES` | `false` | 剥离 `{{ }}`、`${ }`、`<% %>` 模板语法 |
| `SAFE_FOR_XML` | `true` | 处理注释中的危险字符 |
| `FORCE_BODY` | `false` | 把 `<style>` 等强制挂到 body |
| `IN_PLACE` | `false` | 就地净化传入的 DOM 节点 |
| `CUSTOM_ELEMENT_HANDLING` | `{}` | 自定义元素控制：`tagNameCheck` / `attributeNameCheck` / `allowCustomizedBuiltInElements` |

## 六、hooks 入口点

| 入口 | 时机 |
|---|---|
| `beforeSanitizeElements` | 处理元素前（整体） |
| `uponSanitizeElement` | **逐个元素**处理时（`data.tagName` 可用） |
| `afterSanitizeElements` | 处理元素后 |
| `beforeSanitizeAttributes` | 处理属性前 |
| `uponSanitizeAttribute` | **逐个属性**处理时（可设 `hookEvent.forceKeepAttr`） |
| `afterSanitizeAttributes` | 处理属性后（常用于补 `rel`、校验 `src`） |
| `uponSanitizeShadowNode` / `*SanitizeShadowDOM` | Shadow DOM 相关 |

## 七、默认白名单构成（源码）

- **`DEFAULT_ALLOWED_TAGS`** = `TAGS.html` + `TAGS.svg` + `TAGS.svgFilters` + `TAGS.mathMl` + `TAGS.text`
- **`DEFAULT_ALLOWED_ATTR`** = `ATTRS.html` + `ATTRS.svg` + `ATTRS.mathMl` + `ATTRS.xml`

> 即默认就允许 HTML + SVG（含滤镜）+ MathML + 文本；要收窄到纯 HTML 用 `USE_PROFILES: { html: true }`。

---

命令查完，进 [指南 · 基础](./guide-line/base) 理解配置语义，或 [指南 · 进阶](./guide-line/advanced) 看 hooks、Trusted Types、Node/jsdom 实战。
