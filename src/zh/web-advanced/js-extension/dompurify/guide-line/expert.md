---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

> 版本基线 **DOMPurify 3.4.11**。深入净化器内核：返回类型与 TypeScript 函数重载、`IN_PLACE` 与节点克隆的性能/安全权衡、DOM Clobbering 与 `SANITIZE_NAMED_PROPS`、mutation XSS（mXSS）、与 CSP 的纵深防御。

## 速查

- TS 重载会按配置收窄返回类型；运行时 `RETURN_TRUSTED_TYPE` 仍取决于 Trusted Types 是否存在，不支持时回退字符串
- `IN_PLACE: true` 会修改原节点，只能处理尚未进入文档树的离线节点；默认克隆路径副作用更小
- `SANITIZE_DOM` 默认开启；更强隔离可用 `SANITIZE_NAMED_PROPS` 给 `id` / `name` 加 `user-content-` 前缀
- mXSS 利用解析、序列化、再解析时的 DOM 变异；保持 DOMPurify 与服务端 DOM 实现最新是安全要求
- `SAFE_FOR_TEMPLATES` 不是生产推荐方案；更稳妥的边界是不让用户可控 HTML 进入模板求值
- DOMPurify 与 CSP / Trusted Types 是互补层：前者清内容，后者约束危险 sink 和脚本执行
- `isSupported === false` 代表没有完整净化能力：可能只得到等待 `window` 的工厂，或原样返回输入；调用方必须 fail closed
- 不把 `removed`、hook 观察结果或“本次没删东西”当可信证明；安全性由固定策略、上下文与完整管线决定

## 一、返回类型与 TypeScript 重载

3.x 源码（`src/purify.ts`）用**函数重载**精确刻画返回类型，开发时能拿到准确推断：

```ts
// 就地净化：dirty 必须是 Node，返回 Node（最严格）
sanitize(dirty: Node, cfg: Config & { IN_PLACE: true }): Node;
// 返回 DOM 节点
sanitize(dirty: string | Node, cfg: Config & { RETURN_DOM: true }): Node;
// 默认：返回字符串
sanitize(dirty: string | Node, cfg?: Config): string;
```

实战推断：

```ts
const a = DOMPurify.sanitize(dirty);                              // a: string
const b = DOMPurify.sanitize(dirty, { RETURN_DOM: true });        // b: Node
const c = DOMPurify.sanitize(dirty, { RETURN_TRUSTED_TYPE: true });// c: TrustedHTML
```

- `RETURN_DOM_FRAGMENT: true` → `DocumentFragment`，且内部强制 `RETURN_DOM = true`（片段是 DOM 返回的子类型）；
- `RETURN_TRUSTED_TYPE: true` → 类型从 `string` 收窄为 `TrustedHTML`；
- 这套重载让「忘记处理非字符串返回」在编译期就能被发现。

> 运行时仍要看浏览器能力：3.4.11 在没有 Trusted Types 的 jsdom 环境中，即使传 `RETURN_TRUSTED_TYPE: true` 也会返回普通字符串。不要只凭静态类型推断运行时对象能力。

## 二、节点入参与 IN_PLACE

当 `dirty` 是 **DOM 节点**而非字符串时：

| 情况 | 行为 | 副作用 |
|---|---|---|
| 未设 `IN_PLACE`（默认） | 走 `importNode` **克隆**一份再净化 | 不动你传入的原节点 |
| `IN_PLACE: true` | **就地**在原节点上净化，跳过克隆 | **会修改原节点** |

```ts
// 就地净化一个尚未插入文档的离线节点
const div = document.createElement('div');
div.innerHTML = userHtml;
DOMPurify.sanitize(div, { IN_PLACE: true }); // 返回被就地净化的 div
```

**性能/安全权衡**：

- `IN_PLACE` 省去克隆开销，**性能更好**；
- 但它会修改原节点（有副作用），且——若该节点**已经在文档树中**，净化前的瞬间其危险内容可能已被浏览器解析执行；
- 因此 `IN_PLACE` 只应作用于**尚未插入文档的离线节点**。

## 三、DOM Clobbering 与 SANITIZE_NAMED_PROPS

**DOM Clobbering**：攻击者用 `id` / `name` 等命名属性「覆盖」掉 `document` / `form` 上的原生属性或全局变量，从而扰乱脚本逻辑（例如让 `document.cookie`、`form.action` 被一个注入的元素「顶替」）。

DOMPurify 的两层防护：

```ts
// 默认开启：基础 DOM Clobbering 防护
DOMPurify.sanitize(dirty);                              // SANITIZE_DOM 默认 true

// 更严格：给命名属性加 user-content- 前缀做命名空间隔离
DOMPurify.sanitize(dirty, { SANITIZE_NAMED_PROPS: true });
```

| 配置 | 默认 | 做法 |
|---|---|---|
| `SANITIZE_DOM` | `true` | 拦截会造成 clobbering 的命名属性 |
| `SANITIZE_NAMED_PROPS` | `false` | 给 `id`/`name` 加 `user-content-` 前缀，彻底隔离命名空间 |

> 处理「会被脚本通过 `document.x` / `form.x` 访问」的高风险内容时，叠加 `SANITIZE_NAMED_PROPS` 更稳。

## 四、mutation XSS（mXSS）

mXSS 是 DOMPurify 长期对抗的高级威胁，也是「自己写正则」永远做不到的防线：

- **本质**：一段**看似安全**的 HTML，在被**解析 → 序列化 → 再解析**的过程中，浏览器的容错与规范化把它「变异」成可执行的危险结构，从而绕过一次性净化；
- **诱因**：HTML 解析器对畸形/边界写法的自动「纠正」，以及不同上下文（如 `<svg>`、`<math>`、`<template>`）的解析规则差异；
- **DOMPurify 的应对**：基于对解析器变异行为的深入研究做针对性处理，并**随浏览器更新持续迭代规则**。

正因如此，**务必用当前维护的版本**（mXSS 防御依赖与浏览器同步的规则），并优先用官方维护的 profile / 默认白名单，而非自创放行规则。

## 五、与 CSP 的纵深防御

净化与 CSP 是**互补的两层**，不可互相替代：

| 层 | 职责 | 失效场景 |
|---|---|---|
| **DOMPurify** | 内容层：移除注入向量 | 配置放太宽 / 净化后被改写 |
| **CSP** | 执行层：限制脚本来源、禁内联 | 策略有疏漏 / 允许 `unsafe-inline` |

最佳实践是**两者并用**：即使有严格 CSP，仍应净化用户 HTML；即使净化了，也应配 CSP 兜底。在支持 Trusted Types 的环境，用 `RETURN_TRUSTED_TYPE: true` 让二者无缝衔接。

## 六、工程清单

| 手段 | 说明 |
|---|---|
| 紧挨写入前净化 | 别让其它库在净化后再改写 HTML，否则可能 void 掉效果 |
| 用 profile / 默认白名单 | 优先 `USE_PROFILES`，少自创放行规则 |
| 全局 hooks 配对清理 | `addHook` / `removeHook` 成对；或用多实例隔离 |
| 高风险内容加 `SANITIZE_NAMED_PROPS` | 强化 DOM Clobbering 隔离 |
| 锁定并跟进版本 | mXSS 防御依赖与浏览器同步的规则更新 |
| 服务端 DOM 保持最新 | jsdom 等解析器属于可信计算基；不要使用官方明确不推荐的 happy-dom 组合 |
| 叠加 CSP | 纵深防御，Trusted Types 下用 `RETURN_TRUSTED_TYPE` 衔接 |

---

回到 [入门](../getting-started) 复习基本用法，或查 [参考](../reference) 速览配置项与 hooks 入口。
