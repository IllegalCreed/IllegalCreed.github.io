---
layout: doc
outline: [2, 3]
---

# 参考：CSS Modules 速查与对照表

> 基于 CSS Modules 规范 + Vite/webpack 实现 · 核于 2026-07

## 速查

- **定位**：构建期把类名局部作用域化的方案；写标准 CSS，零运行时；是**作用域基线**，不是运行时 CSS-in-JS。
- **不是单一库**：约定/规范（css-modules/css-modules）+ 实现（Vite 8.1 / css-loader 7.x / postcss-modules 9.x / Next.js 16.x / CRA）。
- **触发**：`.module.css`（及 `.module.scss` 等）后缀；普通 `.css` 为全局。
- **原理**：编译期 `.foo` → 唯一哈希名（`_foo_x1y2`）+ 导出映射 `{ foo: '_foo_x1y2' }`；底层经 ICSS。
- **用法**：`import styles from './x.module.css'` → `className={styles.foo}`（默认导入映射对象）。
- **作用域**：默认局部；`:global(.x)` 全局例外；`:local(.x)` 切局部；块级 `:global { }` 批量。
- **组合**：`composes: base` / `composes: x from './y.css'` / `composes: z from global`；只组单个局部类，须在其他声明前。
- **值变量**：`@value primary: #BF4040;` + `@value primary from './c.css';`；编译期替换，≠ 运行时 `var()`。
- **命名**：推荐 camelCase；`localsConvention`（Vite/postcss）/ `exportLocalsConvention`（css-loader）控制键名风格。
- **TS**：默认无类型；通配声明 / `typed-css-modules`（`.d.ts`）/ `typescript-plugin-css-modules`（LSP，编译期不报错）。

## 一、语法与作用域速查

| 写法 | 含义 |
| --- | --- |
| `.foo { }` | 局部类（默认，被哈希） |
| `:global(.foo) { }` | 全局例外，`foo` 保持原名 |
| `:local(.foo) { }` | 显式局部（`scopeBehaviour: 'global'` 时用） |
| `:global { .a { } }` | 块级切换：整块当全局 |
| `.a :global(.b)` | 局部 `.a` 后代里的全局 `.b` |
| `@keyframes spin { }` | 动画名也默认被作用域化 |

## 二、composes 组合速查

| 语法 | 来源 |
| --- | --- |
| `composes: base;` | 同文件类 |
| `composes: a b;` | 同文件多个类（空格分隔） |
| `composes: base from './x.module.css';` | 跨文件类 |
| `composes: g from global;` | 全局（未哈希）类 |

- 约束：只组合**单个局部类名**；`composes` 须在规则内**其他声明之前**；带伪类样式会带过来。
- ⚠️ 跨文件同属性给不同值 = **未定义行为**；CSS 输出顺序**不由 composes 书写位置决定**（表达依赖，非层叠优先级）。

## 三、@value vs 原生 var()

| 维度 | `@value` | `var(--x)` |
| --- | --- | --- |
| 时机 | 编译期替换（固化） | 运行时级联 |
| JS 动态改 | ❌ | ✅ |
| 参与级联 | ❌ | ✅ |
| 可当选择器名 | ✅ | ❌ |
| 动态主题 | 不适合 | 首选 |

## 四、构建工具配置对照

| 能力 | Vite（postcss-modules） | webpack（css-loader） |
| --- | --- | --- |
| 触发 | `.module.css` 自动 | `modules.auto`（默认 `/\.module\.\w+$/i`） |
| 开关模式 | `scopeBehaviour: 'local'|'global'` | `modules: 'local'|'global'|'pure'|'icss'` |
| 命名风格 | `localsConvention` | `exportLocalsConvention` |
| 哈希格式 | `generateScopedName`（默认 `[name]__[local]___[hash:base64:5]`） | `localIdentName`（默认 `[hash:base64]`） |
| 全局路径 | `globalModulePaths` | — |
| 取映射 | `getJSON` | — |
| 导出全局 | `exportGlobals` | — |
| 命名导出 | — | `namedExport` |
| 另一实现 | Lightning CSS（`css.lightningcss.cssModules`） | — |

> Vite 的 `css.modules` 选项**透传给 postcss-modules**；启用 Lightning CSS 时改走 `css.lightningcss.cssModules`（`css.modules` 不生效）。

## 五、localIdentName / generateScopedName 占位符

| 占位符 | 含义 |
| --- | --- |
| `[name]` | 源文件名 |
| `[local]` | 原始类名 |
| `[path]` | 相对路径 |
| `[hash:base64:5]` | 5 位 base64 哈希 |
| `[folder]` / `[file]` / `[ext]` | 目录 / 文件 / 扩展名 |

- 开发推荐：`[path][name]__[local]`（可读，便于 DevTools 定位）。
- 生产推荐：`[hash:base64]`（短、不泄露目录结构）。
- `hashPrefix` 加盐，规避跨项目哈希碰撞。

## 六、TypeScript 补类型三方案

| 方案 | 机制 | 精度 | 编译期报错 |
| --- | --- | --- | --- |
| 通配环境声明 `declare module '*.module.css'` | 一段全局声明，字符串字典 | 低（不校验具体类名） | ❌ |
| `typed-css-modules`（`tcm`） | 生成 `.module.css.d.ts` | 高（逐类名） | ✅ |
| `typescript-plugin-css-modules` | TS 语言服务插件 | 高（编辑器内） | ❌（`tsc` 不加载 LSP 插件） |

> Vite 项目 `vite/client` 已内置 `.module.css` 的 `CSSModuleClasses` 声明，常无需手写通配声明。

## 七、CSS Modules vs 其他样式方案

| 维度 | CSS Modules | Tailwind | StyleX/Panda/vanilla-extract | styled-components/Emotion |
| --- | --- | --- | --- | --- |
| 样式写在 | `.css` 文件 | HTML class 属性 | JS/TS 文件 | JS/TS 文件 |
| 运行时 | 零 | 零 | 零（编译抽取） | **有运行时** |
| 作用域 | ✅ 局部 | 原子类天然无冲突 | ✅ | ✅ |
| 类型安全 | 需补 `.d.ts` | 弱 | ✅ 原生 | 部分 |
| 设计令牌 | `@value`（弱） | 内建配置 | ✅ 内建 | 主题对象 |
| 动态样式 | 切类/`var()` | 条件类 | 变体 API | ✅ 极致动态 |

**选型速记**：写标准 CSS + 作用域 + 零运行时 → **CSS Modules**；原子类快开发 → **Tailwind**；类型安全样式系统 → **StyleX/Panda/vanilla-extract**；极致运行时动态 → styled-components/Emotion。三者可组合。

## 八、常见坑对照

| 现象 | 根因 | 解法 |
| --- | --- | --- |
| `className="foo"` 不生效 | 原类名已被哈希 | 改 `className={styles.foo}` |
| `styles.pull-quote` 报错 | kebab 名在 JS 点号非法 | 用 `styles['pull-quote']` 或 `localsConvention` 转驼峰 |
| TS 里 `styles` 是 any | 默认无类型 | 加环境声明 / `typed-css-modules` |
| DevTools 看到乱码类名 | 生产用了纯哈希 | 开发用 `[path][name]__[local]` |
| `composes` 报错 | 组了复合选择器 / 没放在最前 | 只组单个局部类，写在其他声明前 |
| 组合样式覆盖不确定 | 跨文件同属性冲突 | 避免冲突，用明确选择器 |
| Vite 配了 `css.modules` 没用 | 启用了 Lightning CSS | 改用 `css.lightningcss.cssModules` |
| css-loader 不识别 `.module.css` | 关了 `modules.auto` | 开 `auto` 或显式 `modules: true` |

## 九、权威链接

- [CSS Modules 规范 · css-modules/css-modules](https://github.com/css-modules/css-modules) —— 定义、命名、组合、作用域文档
- [Vite · CSS Modules](https://vite.dev/guide/features#css-modules) ｜ [css.modules 配置](https://vite.dev/config/shared-options#css-modules)
- [webpack · css-loader modules](https://webpack.js.org/loaders/css-loader/#modules) —— `modules`/`auto`/`localIdentName`/`namedExport`
- [postcss-modules](https://github.com/css-modules/postcss-modules) —— PostCSS 参考实现（`getJSON`/`generateScopedName`）
- [Next.js · CSS](https://nextjs.org/docs/app/getting-started/css) —— 内建 CSS Modules
- [typed-css-modules](https://github.com/Quramy/typed-css-modules) ｜ [typescript-plugin-css-modules](https://github.com/mrmckeb/typescript-plugin-css-modules) —— TS 类型
- [ICSS · Interoperable CSS](https://github.com/css-modules/icss) —— 底层交换格式
