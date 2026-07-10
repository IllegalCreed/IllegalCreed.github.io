---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

> 版本基线 **DOMPurify 3.4.11**。把净化用进真实项目：`addHook` 定制、Trusted Types 集成、Node/jsdom 与 SSR、协议/URI 控制、安全放行 iframe、与 Markdown 管线协作。

## 速查

- hooks 属于实例级可变状态，会影响该实例后续所有 `sanitize`；临时 hook 要在 `try/finally` 中移除
- `forceKeepAttr` 能绕过普通属性 allowlist，只应用于经过独立验证的属性，不能拿来放行事件处理器
- Node / SSR 必须提供 DOM；使用**最新 jsdom**并保持默认不加载资源、不执行脚本，官方不推荐 happy-dom
- `RETURN_TRUSTED_TYPE: true` 在浏览器支持时返回 `TrustedHTML`；创建 policy 时回调内应传 `false` 取得字符串
- URI 默认拒绝危险协议；iframe 等高风险元素需同时限制 HTTPS、精确 hostname、属性与 sandbox
- Markdown 管线顺序是“渲染最终 HTML → DOMPurify → 立即写入 sink”，不是净化 Markdown 源文本
- `setConfig()` 是持久配置且会让单次 `sanitize` 的 config 失效；模块化代码优先显式单次配置或独立实例
- `DOMPurify.removed` 只能做日志 / 测试观察，不能据此决定输入是否可信或授权业务动作

## 一、hooks：在净化过程里插逻辑

`DOMPurify.addHook(entryPoint, cb)` 可在净化的各阶段插入回调。最常用的两个入口：

- `uponSanitizeElement(node, data, config)`：**逐元素**触发，`data.tagName` 可用于判断当前元素；
- `afterSanitizeAttributes(node)`：属性净化后触发，常用于补属性、校验 URL。

**例 1：给所有外链 `<a>` 补 `target="_blank" rel="noopener noreferrer"`**

```js
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A' && node.getAttribute('href')) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});
const clean = DOMPurify.sanitize(dirty);
```

**例 2：在 `uponSanitizeAttribute` 强制保留某个属性**

```js
DOMPurify.addHook('uponSanitizeAttribute', (node, hookEvent, config) => {
  // 修改 hookEvent 影响当前属性的处置
  if (hookEvent.attrName === 'data-allow-this') {
    hookEvent.forceKeepAttr = true; // 即便不在白名单也保留
  }
});
```

> `forceKeepAttr = true` 是 README 给出的可变字段，用于精确放行个别属性。

## 二、hooks 的全局性与清理

`addHook` 注册在 **DOMPurify 实例（通常是全局单例）** 上，会影响**该实例的每一次 `sanitize`**。所以：

```js
// 用完务必清理，避免污染后续调用
DOMPurify.addHook('afterSanitizeAttributes', myHook);
let clean;
try {
  clean = DOMPurify.sanitize(dirty);
} finally {
  DOMPurify.removeHook('afterSanitizeAttributes'); // 即使 sanitize 抛错也清理
}
// 或 DOMPurify.removeAllHooks(); 清空全部
```

大型应用里若多个模块各自 `addHook`，钩子会**叠加且全局生效**，顺序难控、相互干扰。两种隔离思路：

1. **多实例**：`createDOMPurify(window)` 造出独立实例，各挂各的钩子（见下一节）；
2. **配对管理**：`addHook` 与 `removeHook` 成对出现，或把差异逻辑放进 `config` 而非全局钩子。

## 三、Node.js / SSR：用 jsdom 提供 DOM

DOMPurify 依赖 DOM，浏览器外要先造一个 `window`：

```js
import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const clean = DOMPurify.sanitize('<b>hello</b><script>alert(1)</script>');
// → '<b>hello</b>'
```

::: warning jsdom 既要最新，也要最小权限
服务端 DOM 是净化链的可信计算基。官方明确要求保持 jsdom 最新：旧版 DOM 实现曾存在即使 DOMPurify 本身正确也可导致 XSS 的解析缺陷（例如 jsdom 19 的已知向量在 20 修复）。同时把 jsdom 当**纯 DOM 宿主**：不要开启外链资源加载或脚本执行；官方当前也明确不建议与 happy-dom 组合。
:::

**同构项目（Next.js / Nuxt / Astro / SvelteKit）** 推荐直接用封装：

```js
import DOMPurify from 'isomorphic-dompurify';
// 浏览器走原生 DOMPurify，Node 端自动用 jsdom，API 完全一致
const clean = DOMPurify.sanitize(dirty);
```

## 四、Trusted Types 集成

在启用 Trusted Types、且 CSP 要求 `require-trusted-types-for 'script'` 的页面，让 `sanitize` 直接产出可赋给受保护 sink 的值：

```js
const clean = DOMPurify.sanitize(dirty, { RETURN_TRUSTED_TYPE: true });
// 支持的环境下返回 TrustedHTML，可直接赋给 innerHTML
el.innerHTML = clean;
```

也可把 DOMPurify 接进一个 default policy：

```js
window.trustedTypes.createPolicy('default', {
  createHTML: (input) => DOMPurify.sanitize(input, { RETURN_TRUSTED_TYPE: false }),
});
```

::: danger 递归陷阱
如果你创建的 policy 在 `createHTML` 内部调用 `DOMPurify.sanitize`，而 DOMPurify 内部又用了**这个** policy，会**无限递归**。不要把一个会回调 `sanitize` 的 policy 再传回给 DOMPurify。
:::

## 五、协议 / URI 控制

默认通过 `ALLOWED_URI_REGEXP` 限制链接协议，`javascript:` 等危险协议的 `href`/`src` 会被剥离：

```js
DOMPurify.sanitize('<a href="javascript:alert(1)">x</a>');
// → '<a>x</a>'  (危险 href 被移除，标签与文本保留)
```

- `ALLOW_UNKNOWN_PROTOCOLS`（默认 `false`）：设 `true` 会**放行未知协议**，扩大攻击面，谨慎使用；
- `ALLOWED_URI_REGEXP`：需要自定义允许协议时覆盖内置正则；
- `ADD_URI_SAFE_ATTR`：把某些属性额外标记为 URI 安全。

## 六、安全放行 iframe（按来源白名单）

需求：允许嵌入视频，但只信任 youtube。**只 `ADD_TAGS:['iframe']` 是不够的**——必须校验 `src` 来源：

```js
DOMPurify.addHook('uponSanitizeElement', (node, data) => {
  if (data.tagName === 'iframe') {
    const src = node.getAttribute('src') || '';
    let ok = false;
    try {
      const url = new URL(src);
      ok = url.protocol === 'https:'
        && ['youtube.com', 'www.youtube.com'].includes(url.hostname)
        && url.pathname.startsWith('/embed/');
    } catch {
      // 非法或相对 URL 不在本例信任范围内
    }
    if (!ok) {
      node.parentNode?.removeChild(node); // 非白名单来源直接移除
    } else {
      node.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation');
      node.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    }
  }
});

const clean = DOMPurify.sanitize(dirty, {
  ADD_TAGS: ['iframe'],
  ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'src', 'sandbox', 'referrerpolicy'],
});
```

放行标签 + 钩子校验来源，才能把信任限定在可信域名。

## 七、与 Markdown 管线协作

Markdown 渲染器（如 markdown-it）**本身不是净化器**。当允许内嵌 HTML 时，正确顺序是：

```text
markdown 源 → 渲染成 HTML 字符串 → DOMPurify.sanitize(HTML) → 插入 DOM
```

```js
import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';

const md = new MarkdownIt({ html: true });
const html = md.render(userMarkdown);     // 先渲染
const clean = DOMPurify.sanitize(html);   // 再净化「最终 HTML」
el.innerHTML = clean;                     // 最后插入
```

注意净化对象是**渲染后的 HTML**，不是 Markdown 源文本；且仍要在**插入前**完成。

---

进入 [指南 · 专家](./expert)：返回类型与 TS 重载内幕、`IN_PLACE` 性能权衡、DOM Clobbering 与 `SANITIZE_NAMED_PROPS`、mXSS、与 CSP 的纵深防御。
