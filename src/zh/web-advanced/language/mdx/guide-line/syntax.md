---
layout: doc
outline: [2, 3]
---

# 语法详解：Markdown 与 JSX 的融合规则

> 基于 MDX v3 · 核于 2026-07

## 速查

- **四类内容**：Markdown 正文、JSX 元素、`{表达式}` 插值、ESM（import/export）——可在同一文件混排。
- **ESM**：顶层写标准 `import`/`export`；import 的组件在正文任意处可用（绑定在模块作用域）；`export` 的具名值对外可被 import。
- **表达式**：`{ }` 里放能**求值**的 JS 表达式（`{year}`、`{Math.PI*2}`、`{items.map(...)}`），**不能**放语句（`if`/`for`）。
- **JSX 命名规则**：大写 `<Planet />` = 组件引用；小写 `<section />` = 字面 HTML 元素；点号 `<a.b />` = 成员表达式；连字符 `<a-b />` = 字面元素。
- **自闭合**：空元素必须 `<img />`、`<br />`，不能 `<img>`（JSX 要求闭合）。
- **注释**：`{/* ... */}`（花括号 JS 注释）；**HTML 注释 `<!-- -->` 不被支持**。
- **转义**：字面 `<`、`{` 须写 `\<`、`\{`，或放进行内代码/围栏代码块。
- **混排规则**：同一行的 Markdown「inline」（`**加粗**`、`` `code` ``）能在 JSX 内工作；**块级 JSX 内跨行内容默认不再按 Markdown 解析**——想让组件内部继续吃 Markdown，需用**空行**把内容与标签分隔成独立块。
- ⚠️ **缩进代码块失效**：缩进被 MDX 用于排布 JSX，代码块只能用围栏（```）；**autolink**（裸 URL 自动成链）也不支持，需写完整 `[text](url)`。
- **props**：内容组件接收 props，正文用 `{props.xxx}` 读取渲染时传入的数据。

## 一、ESM：import 与 export

MDX 文件即模块，可直接写标准 ESM 语句：

```mdx
import {Chart} from './chart.js'
import * as UI from './ui.js'
export const title = '年度报告'
export const meta = {author: 'Alice', date: '2026-07-05'}

# {title}

<Chart /> 与 <UI.Button>点我</UI.Button> 都能直接用。
```

- **import** 把组件/值绑定到当前模块作用域，之后正文**任意位置**都能作为 JSX 标签使用（import 会被提升，写在顶部最清晰）。
- **export** 的具名值成为该 MDX 模块的具名导出，外部可 `import {title, meta} from './post.mdx'` 读取；同时它在**本文件作用域内可见**，可被 `{title}` 表达式引用——既对外导出元数据，又在正文复用同一个值。

## 二、`{表达式}` 插值

花括号 `{ }` 里放一个 JavaScript **表达式**，编译时求值并把结果渲染进内容：

```mdx
export const items = ['a', 'b', 'c']

一共有 {items.length} 项；圆周率两倍是 {Math.PI * 2}。

列表也能用表达式生成：

<ul>{items.map((x) => <li key={x}>{x}</li>)}</ul>
```

关键约束：花括号里必须是能**求值**的**表达式**，不能放 `if`、`for`、`const` 这类**语句**。要条件/循环，用三元运算符、`&&`、`.map()` 等表达式形式。

::: warning 想显示字面的花括号
正文里裸写 `{` 会被当作表达式起始。要显示字面 `{`，写 `\{` 转义，或放进行内代码 `` `{` ``、围栏代码块里。
:::

## 三、JSX 元素与命名规则

MDX 里使用组件就是 JSX 语法：像写 HTML 标签一样，无子节点时自闭合，可传 props。编译器如何区分「组件引用」与「字面元素」，取决于名字形态：

| 写法 | 判定 | 含义 |
| --- | --- | --- |
| `<Planet />` | 首字母**大写** | 组件**引用**，需 import 或经 components/Provider 提供 |
| `<section />` | 首字母**小写** | **字面** HTML 元素名 |
| `<lib.Button />` | 带**点号** | **成员表达式**，从对象 `lib` 上取 `Button`（`lib` 须是作用域内绑定） |
| `<a-b />` | 带**连字符**（非合法标识符） | **字面**元素名（类似自定义元素） |

```mdx
import * as lib from './ui.js'
import Planet from './planet.js'

<Planet name="Mars" />        {/* 大写：组件引用 */}
<section>普通 HTML 区块</section>  {/* 小写：字面元素 */}
<lib.Button>成员表达式</lib.Button>
```

⚠️ 常见坑：自定义组件**忘记大写**开头，会被当成字面 HTML 元素而非你的组件，静默渲染错误。空元素**忘记自闭合**（写成 `<img>`）会因未闭合标签报错。

## 四、Markdown 与 JSX 的混排规则

这是 MDX 最需要理解的一处。规则可概括为「**inline 通融、block 分界**」：

- **行内（inline）**：同一行里，Markdown 行内语法（`**加粗**`、`` `code` ``、`[链接]()`）能在 JSX 元素内部正常工作。
- **块级（block）**：当 JSX 是块级、内部内容**跨多行**时，其内部默认**不再**按 Markdown 解析（按 JSX 子节点处理）。想让组件内部继续吃 Markdown，必须用**空行**把内容与标签分隔，形成独立的 Markdown 块。

```mdx
{/* 有空行：内部 **加粗** 会被当独立 Markdown 块解析 */}
<Note>

这里的 **加粗** 和 [链接](https://mdxjs.com) 会正常渲染。

</Note>

{/* 无空行紧贴：内部内容按 JSX 子节点处理，**加粗** 可能原样输出 */}
<Note>这里的 **加粗** 未必生效</Note>
```

⚠️ 跨越不同块、标签一开一闭不匹配（misnested）会直接报错。养成「组件与内部 Markdown 之间空一行」的习惯能避开大多数混排问题。

## 五、注释

MDX 用 JSX，HTML 被 JSX 取代，因此 **HTML 注释 `<!-- -->` 在 MDX 中不被支持**。正确写法是花括号包裹的 JS 块注释：

```mdx
{/* 这是 MDX 注释，不会渲染出来 */}

# 标题 {/* 行尾也能写注释 */}
```

## 六、转义与「像 Markdown 却不同」的坑

从纯 Markdown 迁到 MDX，这几处最容易翻车：

| 现象 | 规则 | 正确做法 |
| --- | --- | --- |
| 裸 `<` / `{` 报错 | 被当标签/表达式起始 | 转义 `\<` `\{`，或放进代码块 |
| 缩进代码块不生效 | 缩进被 MDX 用于排布 JSX | 用围栏代码块（三反引号 ```） |
| 裸 URL 不自动成链 | MDX 不支持 autolink | 写完整 `[text](url)` |
| `<img>` 报未闭合 | JSX 要求标签闭合 | 自闭合 `<img />` |
| HTML 注释无效 | HTML 被 JSX 取代 | 用 `{/* ... */}` |

~~~mdx
在数学里 5 \< 6，配置写作 \{ key: value \}。

    // 这样缩进的代码块在 MDX 里不生效（缩进被用于排布 JSX）

```js
// 必须用围栏代码块才对
const ok = true
```
~~~

## 七、用 props 让内容动态化

MDX 编译出的内容组件本身接收 props，你可以在正文表达式里通过 `{props.xxx}` 读取渲染时传入的属性，让同一份 MDX 按外部数据出不同结果：

```mdx
# 你好 {props.name}

欢迎来到 {props.site} 文档站。
```

渲染 `<Post name="Alice" site="MDX" />` 时，正文会显示对应的值。这在「同一模板渲染多份数据」的内容站里很常用。

---

语法规则掌握后，下一步进入 [组件映射与 Provider](./components-and-provider)：`components` 映射对象、覆盖 `h1`~`h6` 等原生元素、`MDXProvider` 与传 prop 的取舍，以及布局（layout/wrapper）。
