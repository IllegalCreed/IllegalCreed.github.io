---
layout: doc
outline: [2, 3]
---

# 参考：PostCSS 速查与对照表

> 基于 PostCSS 8.5.16 · Autoprefixer 10.5.x · cssnano 8.0.x · postcss-preset-env（stage 默认 2）· 核于 2026-07

## 速查

- **定位**：用 JS 插件转换 CSS 的**工具/AST 平台**，非语言/预处理器/框架；本体只做 parse→transform→stringify，**全靠插件**。
- **管线**：`tokenizer`→`parser`→AST→插件→`stringifier`；tokenize 约占 90% 耗时。
- **节点**：`Root` / `Rule`(`selector`) / `Declaration`(`prop`,`value`) / `AtRule`(`name`,`params`) / `Comment`(`text`)；基类 `Node`→`Container`。
- **插件**：函数返回 `{ postcssPlugin, 访问器 }` + `plugin.postcss = true`。
- **访问器**：`Once`/`Root`/`Rule`/`Declaration`/`AtRule`/`Comment` + 各 `*Exit`；`Once` 只一次、`Root` 可多次。
- **遍历**：`walkRules`/`walkDecls`/`walkAtRules`/`walkComments`/`walk`；`each` 只浅层。
- **改 AST**：`value=` / `replaceWith` / `clone` / `remove` / `append` / `prepend`；复制 `source` 保 map；判重防 re-visit 死循环。
- **配置**：`postcss.config.js`（+.cjs/.mjs/.postcssrc*/package.json）；`plugins` 数组或对象；顺序=执行顺序。
- **明星插件**：autoprefixer · postcss-preset-env（内置 autoprefixer）· postcss-nesting/nested · cssnano · postcss-import · stylelint。
- **Browserslist**：`.browserslistrc`/`package.json`，多工具共享。
- **边界**：Sass/Less 先编译后 PostCSS；Tailwind 配合 PostCSS；UnoCSS 独立于 PostCSS；Lightning CSS 是高速固定转换器。

## 一、核心 AST 节点速查

| 节点 | 代表 | 关键字段 | 是否容器 |
| --- | --- | --- | --- |
| `Root` | 整棵树根 | `nodes` | ✅ |
| `Rule` | `.a { … }` | `selector`、`nodes` | ✅ |
| `AtRule` | `@media … { … }` | `name`、`params`、（有体则 `nodes`） | 有体时✅ |
| `Declaration` | `color: red` | `prop`、`value`、`important` | ❌ 叶子 |
| `Comment` | `/* … */` | `text` | ❌ 叶子 |

> 通用字段（所有节点）：`type`、`parent`、`source`、`raws`。基类：`Node` → `Container`（Root/Rule/AtRule）。

## 二、访问器（visitor）速查

| 进入型（子节点前） | 退出型（子节点后） | 触发次数 |
| --- | --- | --- |
| `Once(root)` | `OnceExit(root)` | 每轮**一次** |
| `Root(root)` | `RootExit(root)` | 可**多次**（re-visit） |
| `AtRule(node)` | `AtRuleExit(node)` | 每个 @规则 |
| `Rule(node)` | `RuleExit(node)` | 每条规则 |
| `Declaration(node)` | `DeclarationExit(node)` | 每条声明 |
| `Comment(node)` | —— | 每条注释 |

- 精确过滤：`Declaration: { color(decl){} }`、`AtRule: { media(at){} }`。
- 只跑一次的逻辑放 `Once`（不是 `Root`）。

## 三、遍历与节点操作速查

| 操作 | 方法 |
| --- | --- |
| 递归遍历 | `walk()` / `walkRules()` / `walkDecls([filter])` / `walkAtRules([name])` / `walkComments()` |
| 浅层遍历 | `each()`（只直接子节点） |
| 改 | `decl.value = …` / `decl.prop = …` |
| 替换 | `node.replaceWith(newNode)` |
| 复制 | `node.clone([overrides])` / `cloneBefore()` / `cloneAfter()` |
| 删 | `node.remove()` |
| 增（容器） | `append()` / `prepend()` / `insertBefore()` / `insertAfter()` |
| 保 source map | 新建/替换后复制 `node.source` |

## 四、插件结构模板

```js
const plugin = (opts = {}) => ({
  postcssPlugin: 'my-plugin',
  Declaration(decl) {
    if (decl.prop === 'color') decl.value = 'red';
  },
});
plugin.postcss = true;
export default plugin;   // CJS: module.exports = plugin; module.exports.postcss = true;
```

- 防 re-visit 死循环：判「已达目标态」/ `WeakSet` / 节点挂 `Symbol` 标记做幂等。

## 五、主流插件速查

| 插件 | 作用 | 关键点 |
| --- | --- | --- |
| **autoprefixer** | 加/删浏览器厂商前缀 | Can I Use + Browserslist 驱动；`remove` 默认 `true` |
| **postcss-preset-env** | 未来 CSS 降级 + polyfill | **内置 autoprefixer**；`stage` 0–4（默认 2）；`features` 逐项开关 |
| **postcss-nesting** | 官方 CSS 嵌套规范 | `&` 选择器；edition `2024-02`（用 `:is()`）/ `2021` |
| **postcss-nested** | Sass 式嵌套 | 与 postcss-nesting 是两套约定，别混用 |
| **cssnano** | CSS 压缩 | 预设 `default`（安全）/ `advanced`（激进有前提） |
| **postcss-import** | 内联 `@import` | 产单文件；放插件链最前；Vite 已内置 |
| **stylelint** | CSS/SCSS 校验 | 基于 PostCSS 解析，可换 parser 读 SCSS |

## 六、配置文件与 plugins 写法

| 配置文件 | 说明 |
| --- | --- |
| `postcss.config.js` / `.cjs` / `.mjs` | 最常用 |
| `.postcssrc` / `.postcssrc.json` / `.postcssrc.yml` | 纯配置格式 |
| `package.json` 的 `postcss` 键 | 内联 |

```js
// 数组形式
export default { plugins: [autoprefixer(), cssnano()] };
// 对象形式（值=选项，false 可关闭）
export default { plugins: { 'postcss-preset-env': { stage: 2 }, cssnano: {} } };
// 函数式（区分环境）
export default (ctx) => ({ plugins: { cssnano: ctx.env === 'production' ? {} : false } });
```

## 七、Browserslist 常用 query

| query | 含义 |
| --- | --- |
| `> 0.5%` | 全球市占率大于 0.5% |
| `last 2 versions` | 每个浏览器最近 2 个版本 |
| `not dead` | 排除已停止维护（24 个月无更新） |
| `Chrome > 100` | 指定浏览器版本区间 |
| `defaults` | 官方推荐默认集（`> 0.5%, last 2 versions, Firefox ESR, not dead`） |

- 位置：`.browserslistrc` 或 `package.json` 的 `browserslist`；被 autoprefixer / preset-env / cssnano / Babel 共享。
- `npx browserslist` 查看命中的浏览器列表。

## 八、PostCSS vs 预处理器 vs 原子化 vs Lightning CSS

| 维度 | PostCSS | Sass/Less | Tailwind | UnoCSS | Lightning CSS |
| --- | --- | --- | --- | --- | --- |
| 本质 | JS 插件转换平台 | 预处理编译器 | 原子类框架 | 原子化引擎 | Rust 高速转换器 |
| 与 PostCSS | 本体 | 可串联（先编译） | v3 是其插件 / v4 可选 | **独立、不依赖** | 替代/补充固定任务 |
| 输入 | CSS | `.scss`/`.less` | 类名扫描 | 类名扫描 | CSS |
| 强项 | 生态、可组合 | 语法糖 | 原子类 DX | 即时、按需 | 速度 |
| 扩展 | 任意 JS 插件 | 内建函数 | 配置/插件 | preset | 内置为主 |

## 九、集成速查

| 环境 | 接入方式 |
| --- | --- |
| **Vite** | 放 `postcss.config.js` **自动加载**；或 `vite.config` 的 `css.postcss` 内联；内置 `@import` 内联 |
| **webpack** | `postcss-loader`（放 `css-loader` 之前），读 `postcss.config.js` |
| **Node API** | `postcss([plugins]).process(css, { from, to })` → `await` → `result.css` |
| **CLI** | `postcss-cli`：`postcss input.css -o output.css` |

## 十、常见错误对照

| 现象 | 根因 | 解法 |
| --- | --- | --- |
| 装了 PostCSS 但没加前缀 | 没挂 autoprefixer/preset-env | 本体不做事，配上对应插件 |
| 前缀重复/冗余 | preset-env 又单独挂 autoprefixer | 用 preset-env 时移除单独的 autoprefixer |
| `@import` 未合并 | 没挂 postcss-import 或顺序太靠后 | 挂 postcss-import 且放最前（Vite 已内置） |
| 插件改动后没生效 | 顺序错，后续插件处理不到 | 调整 plugins 顺序（import 前、压缩后） |
| 自定义插件卡死/超时 | re-visit 死循环 | 判重（WeakSet/Symbol/目标态） |
| source map 定位错 | 新建节点没复制 `source` | 复制原节点 `node.source` |
| 目标浏览器没生效 | Browserslist 没配或写错位置 | 写 `.browserslistrc`/`package.json`；`npx browserslist` 验证 |
| 同步取 `result.css` 报错 | 链上有异步插件 | 改用 `await` / `.then()` 取结果 |

## 十一、权威链接

- [postcss.org 官方站](https://postcss.org/) ｜ [API 文档](https://postcss.org/api/)
- [postcss/postcss](https://github.com/postcss/postcss) —— 源码与 docs
- [写插件指南](https://github.com/postcss/postcss/blob/main/docs/writing-a-plugin.md) ｜ [架构文档](https://github.com/postcss/postcss/blob/main/docs/architecture.md) ｜ [插件列表](https://github.com/postcss/postcss/blob/main/docs/plugins.md)
- [Autoprefixer](https://github.com/postcss/autoprefixer) ｜ [postcss-preset-env](https://github.com/csstools/postcss-plugins/tree/main/plugin-packs/postcss-preset-env) ｜ [cssnano](https://cssnano.github.io/cssnano/)
- [postcss-nesting](https://github.com/csstools/postcss-plugins/tree/main/plugins/postcss-nesting) ｜ [postcss-import](https://github.com/postcss/postcss-import)
- [Browserslist](https://github.com/browserslist/browserslist) ｜ [Can I Use](https://caniuse.com/)
- [AST Explorer](https://astexplorer.net/)（选 CSS + postcss）—— 实时看 AST
