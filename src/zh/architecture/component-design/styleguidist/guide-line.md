---
layout: doc
outline: [2, 3]
---

# 核心配置与文档写法

> 基于 react-styleguidist.js.org 官方文档编写，对照当前稳定版 13.1.4

## 速查

- **配置入口**：`styleguide.config.js`（CommonJS 导出对象），核心字段 `components` / `sections` / `webpackConfig` / `theme` / `styles` / `styleguideComponents` / `pagePerSection` / `require` / `exampleMode` / `usageMode`
- **Markdown 约定**：默认查找组件同目录 `Readme.md`，`getExampleFilename` 可自定义为 `组件名.md`
- **代码块语言语义**：```jsx/js/javascript = 交互式可编辑示例；其他语言 = 仅高亮；无标签 = 交互式（向后兼容）
- **代码块修饰符**：`padded`（内边距）/ `noeditor`（仅渲染）/ `static`（仅高亮）/ `{"props":{...}}`（给 wrapper 加 props）
- **Props 表原理**：`react-docgen` 静态分析 `propTypes` + JSDoc `/** */` 注释 + `defaultProps` 默认值；可用 `propsParser` 换成 `react-docgen-typescript`
- **JSDoc 标签**：`@ignore`（隐藏 prop）/ `@public`（公开方法）/ `@component`（styled-components 标记）/ `@visibleName`（自定义显示名）/ `@example ./path.md`（关联外部示例）
- **隔离渲染**：每个示例在浏览器独立编译（Bublé 转译），支持 `useState` Hook；`import` **仅限 Markdown 源文件**，浏览器内联编辑器不支持 `import`
- **Wrapper 注入 Provider**：通过 `styleguideComponents.Wrapper` 包裹所有示例以注入 Redux / Theme / Intl
- **双重导出模式**：HOC / CSSModules / styled 包裹的组件需「基础组件命名导出（供文档生成）+ 增强组件默认导出（供渲染）」
- **CRA 零配置**：默认 glob `src/components/**/*.{js,jsx,ts,tsx}`，自动忽略 `__tests__` / `.test.` / `.spec.`
- **vs Storybook**：Markdown 驱动风格指南（多组件变体同页、storefront、文档可读性优先）vs CSF 驱动开发工作台（单变体、workshop、addon 生态、视觉回归）
- **反模式**：单文件多 named 组件、浏览器编辑器写 `import`、不双重导出 HOC、styled 用对象写法漏 `@component`、显式设 `webpackConfig` 后指望自动读项目根 webpack

## styleguide.config.js 配置入口

`styleguide.config.js` 是 Styleguidist 的配置入口，CommonJS 导出一个对象。最小可用配置：

```js
module.exports = {
  // 组件扫描 glob（默认 CRA 兼容）
  components: "src/components/**/[A-Z]*.{js,jsx,ts,tsx}",

  // 是否跳过无示例文件的组件（建议开启，避免工具组件全堆进文档）
  skipComponentsWithoutExample: true,

  // 示例代码与 Props 表的初始展开状态：collapse（默认）/ hide / expand
  exampleMode: "collapse",
  usageMode: "collapse",

  // 主题与样式
  theme: {
    color: { link: "#1d6fa5", linkHover: "#1d6fa5" },
  },

  // 大型组件库按 section 拆页
  pagePerSection: true,
};
```

### 核心字段速览

| 字段 | 作用 |
| --- | --- |
| `components` | glob 字符串或数组，扫描组件路径（默认 `src/components/**/*.{js,jsx,ts,tsx}`） |
| `sections` | 嵌套分组数组（`name` / `content` / `components` / `sections` / `exampleMode` / `usageMode` / `ignore`） |
| `webpackConfig` | 自定义 webpack 配置（一旦设置禁用 CRA 自动加载） |
| `dangerouslyUpdateWebpackConfig` | 无限制改 webpack（**可能破坏 Styleguidist**，慎用） |
| `theme` | 主题对象（颜色、字体、间距） |
| `styles` | 细粒度样式覆盖（函数返回 style 对象） |
| `styleguideComponents` | 替换内部组件（`Wrapper` / `Playground` / `ReactComponent` / `TableOfContents` 等） |
| `require` | 全局注入的模块数组（如 polyfill、CSS、context helper） |
| `pagePerSection` | 大型库按 section 拆页（默认 false，单页加载所有示例） |
| `getExampleFilename` | 自定义示例文件查找规则（默认 `组件路径/Readme.md`） |
| `getComponentPathLine` | 自定义组件路径行显示（如 `<Button>` import 路径） |
| `exampleMode` / `usageMode` | 示例代码与 Props 表初始展开状态 |
| `propsParser` | 替换默认 `react-docgen`（如换成 `react-docgen-typescript`） |
| `compilerConfig` | Bublé 编译器配置（浏览器端 ES6 转译选项） |
| `ignore` | 排除组件的 glob 数组 |
| `skipComponentsWithoutExample` | 跳过无示例文件的组件（建议开启） |

> 一旦显式设置 `webpackConfig`，Styleguidist **不再自动读项目根的 `webpack.config.js`**，需手动 `require` 合并。

### sections 分组（大型组件库）

```js
module.exports = {
  sections: [
    {
      name: "Atoms",
      content: "docs/atoms.md",
      components: "src/components/atoms/**/[A-Z]*.jsx",
    },
    {
      name: "Molecules",
      content: "docs/molecules.md",
      components: "src/components/molecules/**/[A-Z]*.jsx",
      sections: [
        // 嵌套子章节
        {
          name: "Forms",
          components: "src/components/molecules/forms/**/[A-Z]*.jsx",
        },
      ],
    },
  ],
  pagePerSection: true, // 每个 section 独立页面，改善性能
};
```

> 默认单页加载所有组件示例易卡顿，大型库应配 `pagePerSection: true` 拆页。

## Markdown 写法

### 示例文件约定

Styleguidist 默认查找每个组件同目录下的 `Readme.md` 作为文档。如 `src/components/Button/Button.jsx` 对应 `src/components/Button/Readme.md`。

`getExampleFilename` 自定义查找规则：

```js
module.exports = {
  // 改成 组件名.md（如 Button.md）
  getExampleFilename: (componentPath) =>
    componentPath.replace(/\.jsx?$/, ".md"),
};
```

### Markdown 示例结构

一个完整的 `Readme.md`：

````markdown
# Button 按钮

通用的按钮组件，支持多种视觉风格。

```jsx
<Button kind="primary">提交</Button>
<Button kind="secondary">取消</Button>
<Button disabled>禁用</Button>
```

## 复合示例

```jsx padded
<ButtonBar>
  <Button>上一个</Button>
  <Button>下一个</Button>
</ButtonBar>
```

## 仅高亮源码（不渲染）

```static
<Button kind="primary">不会渲染</Button>
```
````

### 代码块语言语义（重点）

| 写法 | 行为 |
| --- | --- |
| ` ```jsx ` / ` ```js ` / ` ```javascript ` | **交互式可编辑示例**：编译成真实组件 + 下方显示编辑器 |
| ` ```bash ` / ` ```json ` / ` ```css ` 等其他语言 | **仅高亮源码**：不渲染、不显示编辑器 |
| ` ``` ` 无语言标签 | **交互式**（向后兼容老版本行为） |
| ` ```jsx padded ` | 交互式 + 示例之间增加内边距 |
| ` ```jsx noeditor ` | 仅渲染示例，不显示编辑器 |
| ` ```jsx static ` | 仅高亮源码（与指定非 jsx 语言类似） |
| ` ```jsx {"props":{"title":"提示"}} ` | 交互式 + 给外层 wrapper 注入额外 props |

> 注意：在浏览器内联编辑器里改代码可以实时预览，但**不支持写 `import`**——`import` 只能在 Markdown 源文件里写。

### 在 Markdown 示例里 import

Markdown 源文件支持 `import`，可引入组件、子组件、数据等：

````markdown
```jsx
import { Button } from "../Button";
import { Card } from "../Card";

<Card>
  <Button>点我</Button>
</Card>
```
````

> 这些 `import` 会在编译时被解析，但**浏览器内联编辑器不支持再写 `import`**——只能改 props 或调整 JSX 结构。

## 代码示例自动生成文档

Styleguidist 的核心能力之一：**Markdown 里的 fenced ```jsx 示例会被自动编译成可交互的真实 React 组件**，并配一个浏览器内联编辑器。流程：

1. **解析 Markdown**：Styleguidist 用 remark 解析 Markdown，提取 fenced code block
2. **判断语言标签**：```jsx / ```js / ```javascript（或无标签）触发交互式渲染；其他语言仅高亮
3. **Bublé 转译**：浏览器端用 Bublé 把 ES6+ 转成兼容代码（`compilerConfig` 可配置）
4. **隔离编译示例**：每个示例在浏览器内独立编译、独立运行，示例之间互不污染
5. **支持 Hooks**：每个示例相当于一个函数组件，可直接使用 `useState` / `useEffect` 等 Hook

````markdown
```jsx
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>点击 {count}</button>;
}

<Counter />;
```
````

### require 全局注入

复杂示例需要工具函数 / mock 数据时，用 `require` 在 `styleguide.config.js` 全局注入：

```js
module.exports = {
  require: [
    "core-js/stable",
    "regenerator-runtime/runtime",
    "./styleguide/require/global.css",
    "./styleguide/require/setup.js", // 全局 mock / context helper
  ],
};
```

> 不要在浏览器内联编辑器里写 `import` 或调用 `require.context`，二者都不支持。把它们抽到 helper 文件，再用 `require` 或 Markdown 顶部的 `import` 引入。

## Props 表自动生成

Styleguidist 的另一核心能力：基于 `react-docgen` 静态分析组件的 `propTypes` + JSDoc 注释，**自动生成 Props 表**。

### 静态分析原理

`react-docgen` 是一个**静态分析器**（不执行 JS），从源码 AST 提取：

- **prop 名称、类型**（从 `propTypes` 声明）
- **是否必填**（`isRequired`）
- **默认值**（从 `defaultProps`）
- **描述**（从 prop 上方的 JSDoc `/** */` 块注释）

```jsx
import PropTypes from "prop-types";

function Button({ kind, children, onClick }) {
  return (
    <button className={`btn btn-${kind}`} onClick={onClick}>
      {children}
    </button>
  );
}

Button.propTypes = {
  /**
   * 视觉风格
   */
  kind: PropTypes.oneOf(["primary", "secondary", "danger"]),
  /**
   * 按钮内容
   */
  children: PropTypes.node.isRequired,
  /**
   * 点击回调
   */
  onClick: PropTypes.func,
};

Button.defaultProps = {
  kind: "primary",
  onClick: () => {},
};
```

渲染出的 Props 表自动包含：prop 名、类型、默认值、是否必填、描述。

### TypeScript 支持

默认 `react-docgen` 不解析 `node_modules` 里的 TypeScript 类型注解。从 `node_modules` 重导出第三方 TS 组件时，需要装 `react-docgen-typescript` 并配 `propsParser`：

```bash
npm install --save-dev react-docgen-typescript
```

```js
module.exports = {
  propsParser: (filePath, source) =>
    require("react-docgen-typescript")
      .withCustomConfig("./tsconfig.json")
      .parse(filePath, source),
};
```

### JSDoc 标签语义

| 标签 | 作用 | 示例 |
| --- | --- | --- |
| `@ignore` | 在 Props 表中隐藏该 prop | `/** @ignore */` |
| `@public` | 把类组件的实例方法公开到文档 | `/** 打开对话框 @public */` |
| `@component` | **styled-components 标记**，触发文档生成（必加） | `/** @component */` |
| `@visibleName` | 自定义在文档中的显示名 | `/** @visibleName 按钮（Button） */` |
| `@example` | 关联外部示例文件 | `/** @example ./examples.md */` |

> styled-components 组件**必须加 `/** @component */` 注释**才能被 `react-docgen` 识别；且必须用模板字符串写法（`styled.button\`...\``），对象写法 `styled.button({...})` 和 `styled-system` 函数式调用都不识别。

## 隔离渲染与 Wrapper 注入

### 隔离渲染机制

Styleguidist 把每个示例**在浏览器内独立编译**（Bublé 转译 ES6+），每个示例相当于一个独立的函数组件：

- **独立作用域**：示例之间互不影响，不会因为一个示例的 state 污染另一个
- **支持 Hooks**：可直接在示例里使用 `useState` / `useEffect` / `useRef`
- **`import` 限制**：`import` **仅能在 Markdown 源文件**里写，浏览器内联编辑器**不支持** `import`（编辑器里改代码只能调 props / 调 JSX 结构，不能加新的 `import` 语句）

### Wrapper 组件模式

当组件依赖 Context / Redux / Theme / Intl 等 Provider 时，每个示例在浏览器独立编译无法自动包裹整个 style guide。需要通过 `styleguideComponents.Wrapper` 统一注入：

```jsx
// styleguide/wrapper/Wrapper.jsx
import React from "react";
import { ThemeProvider } from "styled-components";
import { Provider as ReduxProvider } from "react-redux";
import { IntlProvider } from "react-intl";
import theme from "./theme";
import store from "./store";

export default function Wrapper({ children }) {
  return (
    <ReduxProvider store={store}>
      <ThemeProvider theme={theme}>
        <IntlProvider locale="zh">{children}</IntlProvider>
      </ThemeProvider>
    </ReduxProvider>
  );
}
```

```js
// styleguide.config.js
module.exports = {
  styleguideComponents: {
    Wrapper: path.join(__dirname, "styleguide/wrapper/Wrapper.jsx"),
  },
};
```

> Wrapper 包裹**所有示例**，是注入全局上下文的唯一官方推荐方式。

## 双重导出模式

### 问题：HOC / CSSModules / styled 无法被静态分析

`react-docgen` 是**静态分析器**，无法穿透 HOC（如 `withRouter(Comp)`）、CSSModules 包裹、styled-components 工厂调用。这种组件会被 `react-docgen` 跳过，文档中不显示 Props 表。

### 解决：双重导出

```jsx
import { withRouter } from "react-router-dom";
import PropTypes from "prop-types";

// 1. 命名导出：基础组件（react-docgen 能识别，生成文档）
export function Link({ to, children }) {
  return <a href={to}>{children}</a>;
}

Link.propTypes = {
  to: PropTypes.string.isRequired,
  children: PropTypes.node,
};

// 2. 默认导出：增强组件（供示例渲染）
export default withRouter(Link);
```

**约定**：

- **命名导出（基础组件）**：供 `react-docgen` 提取 propTypes 生成 Props 表
- **默认导出（增强组件）**：供示例渲染（拿到 router / theme / store 等注入）

> 单文件**只能**有 1 个 default 或 1 个 named export——多个 named export 官方明确警告「Styleguidist is likely to behave unreliably」。

## 与 Storybook 对比

### 定位差异（核心）

| 维度 | Styleguidist | Storybook |
| --- | --- | --- |
| **驱动方式** | Markdown 驱动 | CSF（Component Story Format）驱动 |
| **类比** | 商店橱窗（storefront） | 工作坊（workshop） |
| **示例展示** | 所有组件及其变体**同页陈列** | 一次一个变体 |
| **受众** | 开发 + 设计 + 产品（非开发受众也能读） | 主要面向开发者 |
| **核心强项** | 文档可读性、Markdown 易写 | addon 生态、交互测试、视觉回归 |
| **addon 生态** | 无 | 数百个（a11y、knobs、actions、viewports…） |
| **视觉回归** | 无 | 内置（通过 addon） |
| **组件测试** | 无 | stories + play function |
| **跨框架** | React 专用 | React / Vue / Angular / Svelte / Web Components |

### 何时选 Styleguidist

- 重视**文档可读性**，希望产出非开发受众也能读懂的「风格指南」
- 团队习惯写 Markdown，不想学 CSF
- Create React App 项目想零配置快速启动
- 不需要复杂的 addon 生态、视觉回归

### 何时选 Storybook

- 需要 **addon 生态**（a11y、knobs、actions、viewports）
- 需要**视觉回归测试**（chromatic、percy）
- 需要**组件自动化测试**（play function）
- 跨框架（Vue / Angular / Svelte）
- 团队偏好 CSF 驱动的开发工作台

> 二者**并非二选一**——一些团队同时用：Storybook 做开发期测试、Styleguidist 做对外风格指南。

## 反模式（避坑）

### 1. 单文件多个 named 组件

```jsx
// ❌ 反模式：单文件多 named 组件，行为不可靠
export function Button() {}
export function Link() {}
```

官方明确警告「Styleguidist is likely to behave unreliably」——仅 default 或单 named export 能可靠暴露。

### 2. 浏览器内联编辑器写 import

```jsx
// ❌ 在浏览器编辑器里改示例时加 import 会报错
import { useState } from "react";
```

`import` 只能在 Markdown 源文件里写，浏览器编辑器**不支持** `import`。

### 3. HOC / 动态组件不双重导出

```jsx
// ❌ 指望 react-docgen 自动识别 HOC 包裹（它做不到）
export default withRouter(Button);
```

需双重导出：命名导出基础组件（生成文档）+ 默认导出增强组件（渲染）。

### 4. styled-components 用对象写法或漏 `@component`

```jsx
// ❌ 对象写法 + 漏 @component，docgen 不识别
const Button = styled.button({ color: "red" });
```

正确写法：

```jsx
/**
 * @component
 */
const Button = styled.button`
  color: red;
`;
```

### 5. 设置 webpackConfig 后指望它自动读项目根 webpack

一旦显式设置 `webpackConfig`，Styleguidist **禁用自动加载** CRA / 项目根 webpack，需手动 `require` 合并：

```js
module.exports = {
  webpackConfig: env => {
    // 手动合并项目 webpack 配置
    const projectConfig = require("./webpack.config.js")(env);
    return {
      ...projectConfig,
      module: {
        ...projectConfig.module,
        rules: [
          ...projectConfig.module.rules,
          { test: /\.custom$/, use: "custom-loader" },
        ],
      },
    };
  },
};
```

### 6. 在 webpackConfig 里放被忽略的插件

`HtmlWebpackPlugin` / `TerserPlugin` / `CommonsChunkPlugin` / `HotModuleReplacementPlugin` 这些会被 Styleguidist **忽略**（已内置或会冲突）。不要放进去，放了也不生效。

### 7. 在示例里直接 `require.context`

```jsx
// ❌ 示例无 require.context 访问权
const files = require.context("./icons", true, /\.svg$/);
```

需抽到 helper 文件再 `import`。

### 8. 忽略 skipComponentsWithoutExample

不开 `skipComponentsWithoutExample: true`，又没配 `ignore` glob，会导致**无示例文件的工具组件 / 内部组件全堆进文档**。建议开启该选项或用 `ignore` 排除。

### 9. 指望 Styleguidist 做视觉回归 / addon 插件 / 组件自动化测试

Styleguidist **不做**这些（属 Storybook / 前端测试工具边界）。需要视觉回归请用 Storybook + chromatic / percy。

## 下一步

- [参考](./reference.md)：完整配置项清单、与 Storybook 对比表、版本与运行环境、官方资源链接
