---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 react-styleguidist.js.org 官方文档编写，对照当前稳定版 13.1.4（npm dist-tags.latest）

## 速查

- **本质**：Markdown 驱动的 React 组件文档工具，示例即文档（fenced ```jsx 渲染为可交互可编辑组件）
- **核心机制**：`react-docgen` 静态分析 `propTypes` + JSDoc `/** */` 注释 → 自动生成 Props 表
- **配置入口**：`styleguide.config.js`（CommonJS 导出对象），含 `components` / `sections` / `webpackConfig` / `theme` / `styles` / `styleguideComponents` / `pagePerSection`
- **Markdown 约定**：默认查找组件同目录 `Readme.md`，可用 `getExampleFilename` 自定义为 `组件名.md`
- **代码块语言**：```jsx / ```js / ```javascript = 交互式可编辑示例；其他语言 = 仅高亮；无语言标签 = 交互式（向后兼容）
- **代码块修饰符**：`padded`（内边距）/ `noeditor`（仅渲染不显示编辑器）/ `static`（仅高亮源码）/ `{"props":{...}}`（给 wrapper 加 props）
- **隔离渲染**：每个示例在浏览器独立编译（Bublé 转译 ES6），支持 `useState` Hook（每个示例相当于一个函数组件）
- **Wrapper 注入**：通过 `styleguideComponents.Wrapper` 为所有示例注入 Redux / Theme / Intl Provider
- **CRA 零配置**：默认 glob 扫 `src/components/**/*.{js,jsx,ts,tsx}`，自动忽略 `__tests__` / `.test.` / `.spec.` 文件
- **CLI 命令**：`npx styleguidist server`（开发）/ `npx styleguidist build`（构建静态站）
- **当前稳定版**：**13.1.4**（MIT 许可，作者 Artem Sapegin / sapegin）

## Styleguidist 是什么

Styleguidist（`react-styleguidist`）是 React 生态的「**Markdown 驱动的组件文档工具**」。开发者把组件的文档写成 Markdown 文件（默认放在组件同目录的 `Readme.md`），在其中用 fenced code block（如 ```jsx）写示例，Styleguidist 会：

1. **渲染示例为可交互组件**：```jsx 块被编译成真实 React 元素，用户可在浏览器内联编辑器里改 props 实时预览
2. **自动生成 Props 表**：内置 `react-docgen` 静态分析组件的 `propTypes` 声明 + JSDoc `/** */` 块注释，提取描述、类型、默认值
3. **隔离渲染**：每个示例在浏览器内独立编译（Bublé 转译），示例之间互不影响
4. **统一注入 Provider**：通过 `styleguideComponents.Wrapper` 为所有示例包裹 Redux / Theme / Intl 等上下文

它的核心定位有三：

- **Markdown 驱动**：文档以 Markdown 为中心，示例即文档，文档与代码零距离
- **风格指南（Style Guide）**：所有组件及其变体**同页陈列**，便于跨组件对比、便于非开发受众（设计师、产品）阅读
- **React 专用**：仅支持 React，不支持 Vue / Angular / Svelte

> Styleguidist ≠ 通用 Markdown 站点生成器。它专门面向 React 组件文档，依赖 `react-docgen` 静态分析。

## Markdown 驱动文档速览

Styleguidist 的核心理念是「**Markdown 即文档**」：开发者把示例直接写在 Markdown 里，工具把它编译成可交互的真实组件。一个最小示例（组件同目录的 `Readme.md`）：

````markdown
```jsx
<Button kind="primary">点击我</Button>
```
````

Styleguidist 看到 ```jsx 语言标签后，会把这段代码：

- **渲染为真实可点击的 Button 组件**（用户可在浏览器里实时交互）
- **下方显示一个可编辑的代码编辑器**（用户可改 props 实时预览效果）
- **同时自动生成该组件的 Props 表**（基于 `propTypes` + JSDoc 注释）

不同语言标签的行为差异（**易混淆点**）：

| 语言标签 | 行为 |
| --- | --- |
| ```jsx / ```js / ```javascript | **交互式可编辑示例**（编译成真实组件 + 显示编辑器） |
| ```bash / ```json / ```css 等其他 | **仅高亮源码**（不渲染、不显示编辑器） |
| 无语言标签（只有 ```） | **交互式**（向后兼容老版本行为） |

**代码块修饰符**（写在 ``` 后用空格分隔）：

- `padded`：示例之间增加内边距
- `noeditor`：仅渲染示例不显示编辑器
- `static`：仅高亮源码（与指定非 jsx 语言类似）
- `{"props":{"someProp":"value"}}`：给示例外层 wrapper 注入额外 props

## 安装

### 前置条件

- **Node**：建议 LTS 版本（Node 18+）
- **React**：React 16.8+（支持 Hooks）
- **构建工具**：Create React App 项目开箱即用，其他项目可能需要 `styleguide.config.js`

### 安装包

```bash
# 安装 react-styleguidist
npm install --save-dev react-styleguidist

# 或用 pnpm
pnpm add -D react-styleguidist

# 或用 yarn
yarn add -D react-styleguidist
```

### CRA 零配置启动

Create React App 项目**无需任何配置**，直接跑：

```bash
# 启动开发服务器（默认 http://localhost:6060）
npx styleguidist server

# 构建静态文档站（输出到 styleguide 目录）
npx styleguidist build
```

> CRA 零配置生效的前提：组件位于 `src/components/` 下、扩展名为 `.js` / `.jsx`。默认 glob 为 `src/components/**/*.{js,jsx,ts,tsx}`，且**自动忽略** `__tests__` 文件夹、`.test.` / `.spec.` 文件。

### 在 package.json 配置脚本

```json
{
  "scripts": {
    "styleguide": "styleguidist server",
    "styleguide:build": "styleguidist build"
  }
}
```

之后即可 `npm run styleguide` 启动开发服务器、`npm run styleguide:build` 构建静态站。

### 非 CRA 项目

非 CRA 项目需要一份 `styleguide.config.js`，至少指定 `components` glob 与 `webpackConfig`：

```js
module.exports = {
  // 组件 glob（默认 src/components/**/*.{js,jsx,ts,tsx}）
  components: "src/components/**/[A-Z]*.{js,jsx,ts,tsx}",

  // 自定义 webpack 配置（一旦设置即禁用 CRA 自动加载）
  webpackConfig: {
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: "babel-loader",
        },
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader"],
        },
      ],
    },
  },
};
```

> 一旦显式设置了 `webpackConfig`，Styleguidist 就**不再自动读项目根的 `webpack.config.js`**，需要手动 `require` 合并配置。

## 下一步

- [核心配置与文档写法](./guide-line.md)：`styleguide.config.js` 全量配置、Markdown 写法、Props 表自动生成原理、隔离渲染、Wrapper 注入、与 Storybook 对比、反模式
- [参考](./reference.md)：配置项清单、与 Storybook 对比表、官方资源链接
