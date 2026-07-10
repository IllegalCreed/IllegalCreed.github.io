---
layout: doc
outline: [2, 3]
---

# 参考

> DOMPurify **常用 API、配置项、hooks 入口与返回类型**速查。版本基线 **3.4.11**。默认值以该版本发布包源码为准。

## 速查

- 核心调用：`DOMPurify.sanitize(dirty, config?)` 默认返回字符串；净化后不要再交给会改写 markup 的库
- 默认范围：允许安全的 HTML、SVG 与 MathML；只需 HTML 时用 `USE_PROFILES: { html: true }` 收窄
- allowlist：`ALLOWED_*` **替换**默认集合，`ADD_*` 追加，`FORBID_*` 移除；`USE_PROFILES` 会覆盖 `ALLOWED_TAGS`
- URL：默认剥离 `javascript:` 等危险协议；不要轻易开启 `ALLOW_UNKNOWN_PROTOCOLS` 或放宽 `ALLOWED_URI_REGEXP`
- 返回值：`RETURN_DOM` / `RETURN_DOM_FRAGMENT` 返回节点；`RETURN_TRUSTED_TYPE` 仅在环境支持 Trusted Types 时返回 `TrustedHTML`
- 持久配置：调用 `setConfig()` 后，后续 `sanitize(..., config)` 的临时 config 会被忽略，直到 `clearConfig()`
- hooks：挂在当前实例并影响后续每次净化；用独立实例或 `try/finally` 配对移除，避免跨模块串扰
- 服务端：使用最新 jsdom，**不要搭配 happy-dom**；`removed` 只用于诊断，不能参与安全决策

## 一、核心 API

| API | 作用 |
|---|---|
| `DOMPurify.sanitize(dirty, config?)` | 净化字符串或节点，返回安全结果（默认字符串） |
| `DOMPurify.addHook(entryPoint, cb)` | 在指定入口注册钩子，定制净化过程 |
| `DOMPurify.removeHook(entryPoint)` | 移除该入口**最近一个**钩子 |
| `DOMPurify.removeHooks(entryPoint)` | 移除该入口的**全部**钩子 |
| `DOMPurify.removeAllHooks()` | 清空**所有入口**的全部钩子 |
| `DOMPurify.setConfig(cfg)` / `clearConfig()` | 设置 / 清除实例级持久配置；设置后临时 config 会被忽略 |
| `DOMPurify.isSupported` | 当前环境是否支持完整净化；不支持时可能只得到工厂函数，或 `sanitize` 原样返回输入，必须 fail closed |
| `DOMPurify.version` | 当前版本号字符串 |
| `DOMPurify.removed` | 最近一次净化移除项，仅供诊断，**不可用于安全决策** |
| `createDOMPurify(window)` | 工厂函数，传入 window 得到实例（Node 端用） |

## 二、返回类型（随配置变化）

| 配置 | 返回类型 | 用途 |
|---|---|---|
| （默认，无标志） | `string` | 直接赋给 `innerHTML` / `v-html` |
| `RETURN_DOM: true` | `Node`（`HTMLBodyElement`） | 需直接做 DOM 操作 |
| `RETURN_DOM_FRAGMENT: true` | `DocumentFragment` | 批量插入；内部会强制 `RETURN_DOM` |
| `RETURN_TRUSTED_TYPE: true` | 支持时为 `TrustedHTML`，否则运行时仍是 `string` | 严格 CSP / Trusted Types sink |
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
| `SAFE_FOR_TEMPLATES` | `false` | 剥离模板语法；官方不建议生产使用，应避免让不可信 HTML 进入模板解析器 |
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
