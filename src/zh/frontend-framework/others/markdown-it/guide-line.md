---
layout: doc
outline: [2, 3]
---

# 指南

> 本篇深入 markdown-it 的核心 API、插件、Token 流与渲染器、三级架构与安全，并汇总常见坑。基于 v14.x。

## 核心 API

| API | 说明 |
|---|---|
| `markdownit([preset][, options])` | 创建实例（默认导出即构造器，**可不加 `new`**）；preset：`commonmark`（严格）/ `default`（全开）/ `zero`（全禁） |
| `md.render(src, env?)` | 渲染成完整 HTML（块级） |
| `md.renderInline(src, env?)` | 渲染行内（**不裹 `<p>`**） |
| `md.parse(src, env)` | → `Token[]`（**扁平 token 流，非 AST**） |
| `md.parseInline(src, env)` | 同 parse 但跳过所有块级规则 |
| `md.set(options)` | 运行时改选项（链式） |
| `md.enable(list, ignoreInvalid?)` / `disable(...)` | 开/关规则（自动找 core/block/inline 链）；未知规则名**抛错**除非 `ignoreInvalid: true` |
| `md.use(plugin, ...params)` | 加载插件（链式） |
| `md.configure(presets)` | 批量加载预设（预设名内部映射到它，少直接调） |

```js
const md = markdownit('zero', { html: true })
  .enable(['emphasis', 'link'])   // zero 后挑要的规则开
```

### highlight 回调的包裹规则

```js
markdownit({
  highlight(str, lang) {
    // 返回字符串若以 <pre 开头 → markdown-it 跳过自己的 <pre><code> 包裹
    // 返回 '' → 走默认转义
    return ''
  },
})
```

## 插件

```js
md.use(plugin, ...params)  // 插件签名 function(md, ...params) {}，直接改 md 实例并返回它
```

| 插件 | 作用 |
|---|---|
| `markdown-it-anchor` | 标题加锚点/permalink |
| `markdown-it-attrs` | `{.class #id key=val}` 行内属性 |
| `markdown-it-container` | 自定义 `::: name` 容器（VitePress 风格） |
| `markdown-it-emoji`（官方） | `:smile:` → 😄 |
| `markdown-it-footnote`（官方） | 脚注 |
| `markdown-it-table-of-contents` / `toc-done-right` | 目录 |
| `markdown-it-task-lists` | `- [ ]` 任务列表 |
| `markdown-it-highlightjs` / `markdown-it-prism` | 代码高亮（也可用 `options.highlight` 接 Shiki） |

> VitePress 用 **`mdit-vue`** 与 `@mdit/plugin-*` 系列在 markdown-it 之上做 Vue 增强。

## Token 流与渲染器

markdown-it **不建 AST**，而是 parse 成扁平的 `Token[]`，再 render。

### Token 对象

| 字段 | 含义 |
|---|---|
| `type` | token 类型，如 `paragraph_open` / `inline` / `fence` |
| `tag` | HTML 标签名，如 `p`；无标签为空 |
| `nesting` | **`1` 开标签 / `0` 自闭 / `-1` 闭标签** |
| `attrs` | `[[name, value], ...]` |
| `content` | 自闭 token（code/fence/text）的内容 |
| `children` | 子 token（inline / img 的内容） |
| `markup` | 标记符（emphasis 的 `*`/`_`、fence 的围栏） |
| `info` | fence 的 info 串（语言） |
| `map` | 源码行号 `[行始, 行末]` |
| `block` | 是否块级 token |
| `hidden` | 渲染时是否忽略（紧凑列表隐藏 `<p>`） |

Token 属性方法：`attrGet(name)` / `attrSet(name,v)` / `attrPush([name,v])` / `attrJoin(name,v)`（空格拼接，如累加 class）/ `attrIndex(name)`。

### 自定义渲染规则

```js
// 覆盖某类 token 的渲染：function(tokens, idx, options, env, self) => htmlString
const defaultFence = md.renderer.rules.fence
md.renderer.rules.fence = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  // ...自定义...
  return defaultFence(tokens, idx, options, env, self) // 兜底调默认
}

// 给链接加 target=_blank：link_open 无默认规则，用 renderToken 兜底
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  tokens[idx].attrSet('target', '_blank')
  return self.renderToken(tokens, idx, options)
}
```

> ⚠️ **很多 token 类型（`paragraph_open` / `link_open` / `heading_open` …）没有默认渲染规则**，由通用 `self.renderToken(tokens, idx, options)` 处理——覆盖这类时要调 `renderToken` 兜底。辅助：`renderAttrs(token)` / `renderInline` / `renderInlineAsText`（图片 alt 用，别滥用）。

## 架构：core / block / inline 三级 Ruler

```
源码 → [core 规则链] → [block 规则链生成块 token] → [inline 规则链解析行内] → Token[] → renderer → HTML
```

每级有一条 `Ruler`，可插入自定义规则：

```js
// 在 inline 链的 emphasis 规则前插入自定义规则
md.inline.ruler.before('emphasis', 'my_rule', (state, silent) => { /* ... */ })
md.core.ruler.push('my_core_rule', (state) => { /* 后处理 token */ })
md.block.ruler.after('paragraph', 'my_block', fn, { alt: ['paragraph'] })
```

Ruler 方法：`.before(refName, name, fn)` / `.after(refName, name, fn)` / `.push(name, fn)` / `.at(name, fn)` / `.enable()` / `.disable()`。

### env 沙箱

`render(src, env)` 的 `env` 是**一次渲染内跨规则/插件共享的数据对象**（如脚注收集、引用定义），**不是选项**——别和 options 搞混。

## 安全

- **`html: false`（默认）**：源码里的原始 HTML 标签被**转义**（输出为文本），安全
- **`html: true`**：原样输出 HTML——**markdown-it 不做 sanitize**，处理不可信输入**必须**配 `DOMPurify` 等外部清理
- `linkify: true` 用 `linkify-it` 自动识别 URL；`typographer` 用排版替换
- 代码高亮经 `options.highlight`，注意高亮器输出也可能含需信任的 HTML

## 常见坑

- **`html: true` 不安全**：必须配 DOMPurify 等 sanitizer 处理用户内容
- **覆盖 `renderer.rules.X` 要 `renderToken` 兜底**：多数 `*_open` token 无默认规则
- **`enable`/`disable` 未知规则名抛错**：传 `ignoreInvalid: true` 抑制
- **`quotes` 需 `typographer: true`**：否则空操作
- **`env` 不是选项**：是一次渲染内的共享数据沙箱
- **token 流非 AST**：要 AST 级遍历/转换用 remark/unified，markdown-it 强在转 HTML
- **`highlight` 返回 `<pre` 开头会跳过默认包裹**：想自定义整个代码块结构时利用这点
- **`renderInline` 不裹 `<p>`**：渲染单段行内内容用它，别用 `render`
