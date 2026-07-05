---
layout: doc
outline: [2, 3]
---

# 参考：StyleX API 速查

> 基于 StyleX 0.19 · 核于 2026-07

## 速查

- **定位**：Meta 出品的编译期原子化 CSS-in-JS；`@stylexjs/stylex` 0.19.0，MIT；零运行时、原子化去重、类型安全、框架无关。
- **核心链路**：`stylex.create(...)` 定义 → `stylex.props(...)` 应用（返回 `className`/`style`）；非 React 用 `stylex.attrs()`。
- **条件写法**：伪类/媒体查询 = 属性级条件值（`{ default, ':hover'/'@media …' }`）；伪元素 = 命名空间顶层键（`'::placeholder'`）。
- **优先级**：后应用者胜，只看 `props()` 顺序，与定义/特异性/样式表顺序无关。
- **主题**：`defineVars`（放 `.stylex.js`、具名导出、编译成 CSS 变量、支持条件值/派生）+ `createTheme`（子树差量覆盖）；需 `unstable_moduleResolution`。
- **动态**：函数样式 `(x) => ({ ... })`，编译成 CSS 变量运行时赋值，函数体须为对象字面量。
- **类型**：`StyleXStyles`（可参数化白名单/值约束）、`StyleXStylesWithout`（黑名单）、`StaticStyles`（拒动态）；TS 结构类型对额外属性有漏洞，Flow 更严。
- **现代 API**：`firstThatWorks`、`keyframes`、`defineConsts`、`when.*` + `defaultMarker`、`positionTry`、`viewTransitionClass`、`@stylexjs/atoms`。
- **谁在用**：FB/IG/WhatsApp/Messenger/Threads + Figma/Snowflake；生态含 eslint-plugin、atoms、**Astryx**（基于 StyleX 的 React 设计系统）。

## 一、核心 API 速查表

| API | 作用 |
| --- | --- |
| `stylex.create(obj)` | 定义样式：命名空间对象 → 各组属性-值对 |
| `stylex.props(...styles)` | 应用样式（React）：返回 `{ className, style }`，忽略 falsy，接受数组 |
| `stylex.attrs(...styles)` | 应用样式（非 React）：返回 HTML 属性 `{ class, style }` 字符串 |
| `stylex.defineVars(obj)` | 声明变量组（CSS 自定义属性），须在 `.stylex.js` 具名导出 |
| `stylex.createTheme(vars, obj)` | 为某变量组生成主题，差量覆盖，应用到子树 |
| `stylex.defineConsts(obj)` | 声明编译期常量（内联，不可运行时切换） |
| `stylex.keyframes(obj)` | 定义关键帧动画，返回引用赋给 `animationName` |
| `stylex.firstThatWorks(...vals)` | 多候选值回退，取浏览器支持的第一个 |
| `stylex.when.ancestor/descendant/anySibling/siblingBefore/siblingAfter(...)` | 按 DOM 关系条件化样式，配 `defaultMarker()` |
| `stylex.defaultMarker()` | 标记被 `when.*` 观察的元素 |
| `stylex.positionTry(obj)` | CSS 锚点定位候选回退位置 |
| `stylex.viewTransitionClass(obj)` | 生成 View Transitions API 过渡类 |
| `@stylexjs/atoms` | 免 `create` 的预生成原子工具（`x.display.flex`） |

## 二、条件样式层级速查

| 条件类型 | 写在哪一层 | 例子 |
| --- | --- | --- |
| 伪类（`:hover`/`:focus`/`:active`） | 属性内部的条件值 | `color: { default: 'a', ':hover': 'b' }` |
| 媒体查询（`@media`） | 属性内部的条件值 | `width: { default: 800, '@media (max-width: 800px)': '100%' }` |
| 容器查询（`@container`） | 属性内部的条件值 | `fontSize: { default: 14, '@container (min-width: 400px)': 16 }` |
| 伪元素（`::placeholder`/`::before`） | 命名空间顶层键 | `{ '::placeholder': { color: '#999' } }` |
| 嵌套条件 | 条件内再嵌条件，`null` 兜底 | `':hover': { default: null, '@media (hover: hover)': 'x' }` |
| DOM 关系 | `when.*` 作为条件键 | `[stylex.when.ancestor(':hover')]: 'x'` |

## 三、类型工具速查

| 类型 | 作用 |
| --- | --- |
| `StyleXStyles` | 接收任意 StyleX 样式（组件 `style` prop 常用） |
| `StyleXStyles<{ color?: string }>` | 属性白名单：只接受列出的属性 |
| `StyleXStyles<{ marginTop: 0 \| 4 \| 8 }>` | 值约束：连取值一起锁死 |
| `StyleXStylesWithout<{ position: unknown }>` | 属性黑名单：禁列出的、放行其余 |
| `StaticStyles` | 只接受编译期常量，拒绝动态（函数）样式 |
| `Theme<>` / `VarGroup<>` | 主题对象 / 变量组的类型 |

> ⚠️ TypeScript 结构性子类型：白名单对「多出的属性」不总报错，StyleX 只能缓解；Flow 检查更严格。

## 四、选型对比矩阵

| 维度 | StyleX | Tailwind CSS | styled-components / Emotion | vanilla-extract | Panda CSS | CSS Modules |
| --- | --- | --- | --- | --- | --- | --- |
| 运行时机 | 编译期 | 编译期 | **运行时** | 编译期 | 编译期 | 编译期 |
| 授权方式 | JS 对象 | 工具类字符串 | JS 模板串/对象 | `.css.ts` | `css()`/配置 | `.module.css` |
| 默认产物 | 原子类 + 去重 | 原子类 | 运行时注入类 | 语义作用域类 | 原子类 | 语义作用域类 |
| 类型安全 | 强 | 弱 | 中 | 强 | 强 | 无 |
| 主题 | `defineVars`/`createTheme` | 配置 + CSS 变量 | ThemeProvider | `createTheme` | 令牌/recipe | 无内建 |
| RSC 友好 | 是 | 是 | 否（styled 维护期） | 是 | 是 | 是 |
| 一句话 | 类型安全的原子 CSS-in-JS | 标签即样式 | 极致运行时灵活 | 写 CSS 的直觉 + 类型 | 配置驱动设计系统 | 零运行时作用域基线 |

## 五、常见坑速查

| 坑 | 说明 |
| --- | --- |
| 忘开 `unstable_moduleResolution` | `defineVars`/`createTheme` 跨文件解析失败，主题不生效 |
| 变量放错文件/默认导出 | 变量必须在 `.stylex.js`/`.ts` 且具名导出，否则编译器解析不到 |
| `create` 里写函数调用/展开 | 违反 AOT 约束，只允许字面量/常量/StyleX 函数 + `.stylex.js` 变量 |
| 动态样式函数体带逻辑 | 函数体必须是纯对象字面量，不能 `if`/`for`/中间变量 |
| 以为定义顺序决定优先级 | 只有 `props()` 应用顺序决胜，后者胜 |
| 伪类/伪元素层级混淆 | 伪类在属性内条件值，伪元素在命名空间顶层键 |
| 指望白名单 100% 拦截 | TS 结构类型对额外属性有漏洞，需靠 lint/review 兜底 |
| `when.*` 里塞媒体查询 | `when.*` 只管 DOM 关系状态，不支持媒体/容器查询 |

## 六、权威链接

- [StyleX 官网](https://stylexjs.com) —— 首页与心智入口
- [Learn 文档](https://stylexjs.com/docs/learn/) —— 安装 / 定义样式 / 主题 / recipes / 静态类型
- [API 参考](https://stylexjs.com/docs/api/) —— 全部函数与类型
- [安装指南](https://stylexjs.com/docs/learn/installation/) —— Next.js / Vite / webpack / rspack / esbuild / PostCSS / Bun / CLI
- [GitHub · facebook/stylex](https://github.com/facebook/stylex) —— 源码与 Issue（MIT）
- [Engineering at Meta · CSS at Scale with StyleX](https://engineering.fb.com/2026/01/12/web/css-at-scale-with-stylex/) —— 大规模落地与原子化收益
- [npm · @stylexjs/stylex](https://www.npmjs.com/package/@stylexjs/stylex) —— 版本实测：`0.19.0`
