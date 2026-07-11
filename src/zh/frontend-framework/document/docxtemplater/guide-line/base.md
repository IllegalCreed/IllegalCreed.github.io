---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

> 版本基线 **3.69.0**。本篇把「会填一个值」升级到「懂标签与作用域」：标签类型全览、区块的循环/条件双重身份、作用域如何切换、默认解析器的局限与 expressions 解析器、缺值处理。

## 速查

- `{name}` 取值；`{#items}...{/items}` 对数组循环、对其他真值渲染一次；`{^items}` 处理空值分支
- 数组循环会把作用域切到当前元素，原始值数组用 `{.}`；缺失字段会向父作用域查找
- 默认解析器把 `{user.name}` 当作字面 key；点号、运算、比较与过滤器需要 expressions
- expressions 适配器从 `docxtemplater/expressions.js` 导入，另装 `angular-expressions@^1.5.2`
- `expressionParser.configure(options)` **返回新 parser**，必须保存并传入构造函数
- 普通标签的 null/undefined 默认输出 `undefined`；用 `nullGetter` 改为空串或业务占位文案

## 一、四类标签一览

| 写法 | 名字 | 干什么 |
|---|---|---|
| `{name}` | 占位符 | 取数据里的 name 填进去 |
| `{#list}…{/list}` | 区块 | 数组→循环；真值→条件 |
| `{^list}…{/list}` | 反向区块 | falsy（空/false/null）时才渲染 |
| `{@xml}` | raw XML | 插入一段原始 OOXML（不转义） |

> 还有两个常用辅助：`{.}` 取「当前元素本身」（原始值数组用），`{/}` 闭合「最近打开的区块」（省名字）。

## 二、区块：循环与条件是同一个东西

docxtemplater 的精妙之处：**区块标签**根据数据类型自动切换身份。

```text
{#users}{name}{/users}
```

- `users` 是**数组** → 中间内容对每个元素**重复**（循环），作用域切到当前元素。
- `users` 是**真值**（对象/true/非空字符串）→ 中间内容渲染**一次**（条件成立）。
- `users` 是 **falsy**（false/null/空数组）→ 中间内容**不渲染**。

配套的反向区块 `{^users}` 正好相反：仅当 falsy 时渲染，常用来写「没有数据时的提示」。

```text
订单数：{orderCount}
{#orders}- {name}：{amount} 元{/orders}
{^orders}暂无订单{/orders}
```

## 三、作用域：循环内的 {name} 是谁

区块会把**作用域（scope）下沉**到当前元素。看这个例子：

```text
公司：{company}
{#staff}
  - 姓名：{name}（部门：{dept}）
{/staff}
```

```ts
doc.render({
  company: 'ACME',
  staff: [
    { name: '张三', dept: '研发' },
    { name: '李四', dept: '市场' },
  ],
});
```

- 循环外 `{company}` 取顶层的 `company`。
- 循环内 `{name}`、`{dept}` 取**当前 staff 元素**的属性，不是顶层。
- 若当前元素没有某属性，docxtemplater 会**向上回溯**到父作用域查找。

> 原始值数组（如 `['a','b','c']`）的元素没有属性名，循环里用 `{.}` 取元素本身：`{#tags}{.} {/tags}` → `a b c`。

## 四、默认解析器的「天花板」

这是新手最容易栽的地方。**默认解析器只做简单属性查找**：

```text
{user.name}   ← 被当成查找字面键名 "user.name"，而不是 user → name
{price + tax} ← 不会做加法，当成怪异键名
{n > 1}       ← 不支持比较
```

默认解析器**不会报编译错误**，只是默默取不到值（渲染成 `undefined`），更隐蔽。

## 五、expressions 解析器：解锁表达式

要支持点号、运算、比较、过滤器，启用免费的 expressions 适配器。适配器由 docxtemplater 导出，底层依赖需另装：

```bash
npm install angular-expressions@^1.5.2
```

```ts
import expressionParser from 'docxtemplater/expressions.js';

const doc = new Docxtemplater(zip, {
  parser: expressionParser,
  paragraphLoop: true,
  linebreaks: true,
});
```

启用后这些都能用：

```text
{user.name}                嵌套属性
{price + tax}              算术
{#users.length > 1}多人{/} 比较 + 条件区块
{vip ? '尊享' : '普通'}     三元
{name | upper}             过滤器（需 configure 注册）
{#items}{$index}: {.}{/items}  下标 $index
```

> `{/}` 在这里很实用：长表达式区块 `{#users.length > 1}…{/}` 结尾不必重写整个表达式。

## 六、注册过滤器

过滤器要先通过 `configure` 注册再用管道 `|` 调用：

```ts
import expressionParser from 'docxtemplater/expressions.js';

const parser = expressionParser.configure({
  filters: {
    upper: (input) => (input == null ? input : String(input).toUpperCase()),
    round: (input, digits = 0) => Number(input).toFixed(digits),
  },
});

const doc = new Docxtemplater(zip, {
  parser,
  paragraphLoop: true,
  linebreaks: true,
});
// 模板：{name | upper}   {price | round:2}
```

> `configure()` 不会修改原始导出，而是返回一个带配置的新解析器。官方 2026-05 安全公告要求 `angular-expressions` 至少为 1.5.2。

## 七、缺值：默认是字面 "undefined"

普通标签取不到值时，**默认渲染成字面字符串 `undefined`**（不是空串！）。要改成空串或占位文案，用 `nullGetter`：

```ts
const doc = new Docxtemplater(zip, {
  nullGetter() {
    return ''; // 缺值统一显示为空
  },
});
```

> raw XML 标签 `{@xml}` 缺值时默认是空串。

---

进入 [指南 · 进阶](./advanced)：表格行循环、异步数据 `renderAsync`、浏览器下载、服务端返回文件、错误聚合处理。
