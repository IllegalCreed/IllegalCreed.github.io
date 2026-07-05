---
layout: doc
outline: [2, 3]
---

# 插件机制与 API：visitor、遍历、节点操作

> 基于 PostCSS 8.5.16 · 核于 2026-07

## 速查

- **插件本质**：一个**函数返回对象**，对象含 `postcssPlugin`（名字）+ 访问器方法；函数上标记 `plugin.postcss = true`（PostCSS 8 约定）。
- **访问器（visitor）**：以节点类型命名的方法，遍历到该类型节点即回调——`Once` / `Root` / `Rule` / `Declaration` / `AtRule` / `Comment`。
- **进入 vs 退出**：进入型（`Rule` 等）在处理子节点**之前**触发；退出型（`RuleExit`/`DeclarationExit`/`AtRuleExit`/`RootExit`/`OnceExit`）在子节点**都处理完之后**触发。
- **`Once` vs `Root`**：`Once` 每轮遍历**只触发一次**（放一次性逻辑）；`Root` 可能因 re-visit **多次**触发。
- **walk 系列**（旧式/主动查找）：`walkRules()` / `walkDecls()` / `walkAtRules()` / `walkComments()` / `walk()`，递归遍历子孙。
- **节点操作**：`decl.value = …`（改）、`replaceWith()`（替换）、`clone()`/`cloneBefore()`（复制）、`remove()`（删）、容器 `append()`/`prepend()`/`insertBefore()`（增）。
- **re-visit**：PostCSS 会**重新访问你改过/新增的节点**（让其他插件也能处理）→ 无条件改动可能**死循环**。
- **防死循环**：先判「是否已达目标状态」，或用 `WeakSet` / 节点上挂 `Symbol` 标记做**幂等判重**。
- **source**：新建/替换节点时复制原节点 `source`，保 source map。
- **visitor 相比旧式优势**：框架**统一调度一趟遍历**分发给各插件，减少重复遍历、组合性更好。

## 一、插件的标准结构（PostCSS 8）

一个现代 PostCSS 插件就是一个函数，返回带 `postcssPlugin` 名和访问器的对象，并在函数上打 `postcss` 标记：

```js
// 一个把所有 color 值改成 red 的最小插件
const plugin = (opts = {}) => {
  return {
    postcssPlugin: 'to-red',      // 插件名（必填）
    Declaration(decl) {           // 访问器：遇到每个声明节点回调
      if (decl.prop === 'color') {
        decl.value = 'red';
      }
    },
  };
};
plugin.postcss = true;            // 标记这是 PostCSS 插件（必填）

export default plugin;
```

- **`postcssPlugin`**：插件名字，用于报错与调试。
- **访问器方法**（这里是 `Declaration`）：PostCSS 遍历 AST，遇到对应类型节点就调用。
- **`plugin.postcss = true`**：告诉 PostCSS「这是个插件」，CommonJS 写法是 `module.exports.postcss = true`。

## 二、访问器（visitor）体系

访问器是 PostCSS 8 的核心机制：你按**节点类型命名方法**，框架在遍历时把对应节点分发给你。

### 进入型 vs 退出型

| 进入型（子节点处理**前**触发） | 退出型（子节点处理**后**触发） |
| --- | --- |
| `Once(root)` — 每轮开始一次 | `OnceExit(root)` — 每轮结束一次 |
| `Root(root)` | `RootExit(root)` |
| `AtRule(atRule)` | `AtRuleExit(atRule)` |
| `Rule(rule)` | `RuleExit(rule)` |
| `Declaration(decl)` | `DeclarationExit(decl)` |
| `Comment(comment)` | —— |

- **进入型是前序遍历**：适合在深入子树前就地改当前节点。
- **退出型是后序遍历**：适合「先让子孙都处理完，再基于结果处理父节点」的逻辑。

### `Once` 与 `Root` 的区别（易错点）

```js
{
  postcssPlugin: 'demo',
  Once(root) {
    // 每处理一个文件只跑一次 —— 放一次性初始化、或旧式 root.walkRules() 全量遍历
  },
  Root(root) {
    // 遍历中每遇到 Root 触发；因 re-visit，树被改动后可能被【多次】触发
  },
}
```

**需要保证只跑一遍的逻辑，放 `Once` 而不是 `Root`。**

### 精确到值/属性名的访问器

访问器还支持用对象形式，按 `prop` / `atRule name` 精确过滤，减少无谓回调：

```js
{
  postcssPlugin: 'demo',
  // 只在属性名是 color 时回调
  Declaration: {
    color(decl) { decl.value = 'red'; },
  },
  // 只在 @media 时回调
  AtRule: {
    media(atRule) { /* … */ },
  },
}
```

## 三、walk 系列：主动遍历与查找

除了被动等访问器回调，容器节点（`Root`/`Rule`/`AtRule`）还提供 `walk` 系列，用于**主动**递归查找节点（旧式插件常在 `Once` 里这么写）：

```js
Once(root) {
  root.walkRules(rule => { /* 每条规则 */ });
  root.walkDecls('color', decl => { /* 属性名为 color 的声明 */ });
  root.walkAtRules('media', atRule => { /* 每个 @media */ });
  root.walkComments(c => { /* 每条注释 */ });
  root.walk(node => { /* 所有节点 */ });
}
```

- `walkXxx` **递归**深入所有子孙；`each()` 只遍历**直接**子节点（不递归）。
- `walkDecls` / `walkAtRules` 可传第一个参数做名字过滤（字符串或正则）。
- 在遍历中删除/新增节点是安全的，PostCSS 会正确处理索引。

## 四、节点的增删改

写转换插件，本质就是对 AST 做 DOM 风格的增删改：

```js
// 改：直接赋值
decl.value = 'red';
decl.prop = 'background-color';

// 替换：把当前节点换成新节点（记得复制 source）
const clean = decl.clone({ prop: 'color', value: 'red' });
clean.source = decl.source;
decl.replaceWith(clean);

// 复制：深拷贝 / 在前后插入副本
const copy = rule.clone();
decl.cloneBefore({ prop: '-webkit-color', value: decl.value });

// 删除：从父节点移除自己
decl.remove();

// 增（容器方法）：追加 / 前插 / 指定位置插入
rule.append({ prop: 'display', value: 'flex' });
rule.prepend({ prop: 'margin', value: '0' });
root.insertBefore(rule, newRule);
```

- `clone(overrides)` 深拷贝并可就地覆盖字段，是「基于旧节点造新节点」的常用手法（如 Autoprefixer 造带前缀的副本）。
- `append` / `prepend` 接受节点对象或 `{ prop, value }` 简写，PostCSS 会帮你建 `Declaration`。

## 五、re-visit 与防死循环（关键坑）

PostCSS 有一条重要语义：**你在访问器里改过或新增的节点，会被重新访问（re-visit）**，以便其他插件（和你自己）也能处理到这些新内容。这很强大，但埋着一个经典陷阱：

```js
// ❌ 反例：无条件加前缀 → 改动触发 re-visit → 又给它加一遍 → 死循环
Declaration(decl) {
  decl.cloneBefore({ prop: '-webkit-' + decl.prop });
}
```

规避的核心思想是**幂等**——保证同一节点不会被重复无意义地再处理。三种常见判重手段：

```js
// 手段 1：先判目标状态是否已达成
Declaration(decl) {
  if (decl.prop.startsWith('-webkit-')) return; // 已是前缀，跳过
  decl.cloneBefore({ prop: '-webkit-' + decl.prop });
}

// 手段 2：WeakSet 记录处理过的节点
const seen = new WeakSet();
Declaration(decl) {
  if (seen.has(decl)) return;
  seen.add(decl);
  /* … */
}

// 手段 3：在节点上挂 Symbol 标记
const DONE = Symbol('done');
Declaration(decl) {
  if (decl[DONE]) return;
  decl[DONE] = true;
  /* … */
}
```

::: danger 死循环不会被框架自动救
PostCSS 不替你判断「业务上算不算已处理」，re-visit 是它的既定行为。**判重是插件作者的责任**。
:::

## 六、为什么 visitor 优于旧式 walk

PostCSS 8 引入 visitor 前，每个插件都在自己的 `Once` 里对整棵树 `walk` 一遍——**N 个插件 = N 趟全量遍历**。visitor 让 PostCSS：

- **统一调度一趟遍历**：把各插件注册的 `Declaration`/`Rule` 等汇总，在**同一趟**遍历中分发给所有插件，减少重复遍历、通常更快。
- **改动正确 re-visit**：一个插件的产出能被后续插件看到，插件间**组合性更好**。

新写插件**优先用 visitor**；只有需要「一次性全量扫描」或复杂主动查找时，才在 `Once` 里用 `walk`。

---

会写插件、懂遍历后，下一步进入 [主流插件生态](./ecosystem-plugins)：Autoprefixer、postcss-preset-env（stage）、postcss-nesting/nested、cssnano、postcss-import 逐个拆解。
