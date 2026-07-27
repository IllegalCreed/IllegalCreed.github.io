---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 react-styleguidist.js.org 官方文档编写，对照当前稳定版 13.1.4

## 速查

- **配置入口**：`styleguide.config.js`（CommonJS 导出对象）
- **核心字段**：`components` / `sections` / `webpackConfig` / `theme` / `styles` / `styleguideComponents` / `require` / `pagePerSection` / `exampleMode` / `usageMode` / `propsParser` / `compilerConfig`
- **代码块语义**：```jsx/js/javascript = 交互式可编辑；其他 = 仅高亮；无标签 = 交互式（向后兼容）
- **代码块修饰符**：`padded` / `noeditor` / `static` / `{"props":{...}}`
- **Props 表原理**：`react-docgen` 静态分析 propTypes + JSDoc + defaultProps
- **JSDoc 标签**：`@ignore` / `@public` / `@component` / `@visibleName` / `@example`
- **Wrapper 注入**：`styleguideComponents.Wrapper` 包裹所有示例注入 Provider
- **双重导出**：基础组件 named export（文档）+ 增强组件 default export（渲染）
- **vs Storybook**：Markdown 驱动风格指南 vs CSF 驱动开发工作台
- **当前稳定版**：**13.1.4**（MIT，作者 Artem Sapegin / sapegin）
- **CRA 零配置 glob**：`src/components/**/*.{js,jsx,ts,tsx}`，自动忽略 `__tests__` / `.test.` / `.spec.`
- **CLI 命令**：`npx styleguidist server`（开发，默认 6060 端口）/ `npx styleguidist build`（静态站）

## 配置项清单

### 路径与组件发现

| 字段 | 类型 | 默认 | 作用 |
| --- | --- | --- | --- |
| `components` | string / string[] | `src/components/**/*.{js,jsx,ts,tsx}` | 组件扫描 glob |
| `sections` | array | - | 嵌套分组（替代 `components`） |
| `ignore` | string[] | - | 排除组件的 glob |
| `skipComponentsWithoutExample` | bool | false | 跳过无示例文件的组件（建议 true） |
| `getExampleFilename` | function | 查找同目录 `Readme.md` | 自定义示例文件查找规则 |
| `getComponentPathLine` | function | 默认文件路径 | 自定义组件路径行显示 |
| `exampleMode` | string | `collapse` | 示例代码初始状态：`collapse` / `hide` / `expand` |
| `usageMode` | string | `collapse` | Props 表初始状态：`collapse` / `hide` / `expand` |
| `pagePerSection` | bool | false | 每个 section 独立页面（大型库建议 true） |
| `defaultExample` | bool / string | false | 无 Readme 时自动生成最小示例 |

### 构建与打包

| 字段 | 类型 | 作用 |
| --- | --- | --- |
| `webpackConfig` | object / function | 自定义 webpack 配置（一旦设置禁用 CRA 自动加载） |
| `dangerouslyUpdateWebpackConfig` | function | 无限制改 webpack（**可能破坏 Styleguidist**） |
| `compilerConfig` | object | Bublé 浏览器端转译配置 |
| `propsParser` | function | 替换默认 `react-docgen`（如换 `react-docgen-typescript`） |
| `require` | string[] | 全局注入的模块（polyfill / CSS / context helper） |
| `mountPointId` | string | `rsg-root` | 挂载点 DOM id |
| `styleguideDir` | string | `styleguide` | 构建输出目录 |
| `template` | object / function | 默认 HTML 模板 | 自定义 HTML 模板 |
| `assetsDir` | string | - | 静态资源目录（拷贝到输出） |

### 渲染与主题

| 字段 | 类型 | 作用 |
| --- | --- | --- |
| `styleguideComponents` | object | 替换内部组件（`Wrapper` / `Playground` / `ReactComponent` / `TableOfContents` / `Editor` 等） |
| `theme` | object | 主题（`color` / `fontFamily` / `fontSize` / `spaceFactor` / `borderRadius` / `maxWidth`） |
| `styles` | object / function | 细粒度样式覆盖（按组件 key 返回 style 对象） |
| `title` | string | `Style Guide` | 文档站标题 |
| `showCode` | bool | false | 默认显示示例源码 |
| `showUsage` | bool | false | 默认显示 Props 表 |
| `showSidebar` | bool | true | 是否显示侧边栏 |
| `previewTemplate` | function | - | 自定义示例预览模板 |
| `ribbon` | object | - | 右下角角标（链接到 GitHub 等） |

### 服务与部署

| 字段 | 类型 | 默认 | 作用 |
| --- | --- | --- | --- |
| `serverHost` | string | `0.0.0.0` | 开发服务器 host |
| `serverPort` | number | `6060` | 开发服务器端口 |
| `openBrowser` | bool | true | 启动时自动开浏览器 |
| `verbose` | bool | false | 详细日志 |
| `logger` | object | console | 自定义日志器 |

## CLI 命令清单

```bash
# 开发服务器（默认 http://localhost:6060）
npx styleguidist server

# 构建静态站（输出到 styleguide 目录）
npx styleguidist build

# 指定配置文件
npx styleguidist server --config ./path/to/styleguide.config.js
```

`package.json` 脚本示例：

```json
{
  "scripts": {
    "styleguide": "styleguidist server",
    "styleguide:build": "styleguidist build"
  }
}
```

## 代码块语义表

| 写法 | 行为 |
| --- | --- |
| ` ```jsx ` / ` ```js ` / ` ```javascript ` | 交互式可编辑示例（渲染真实组件 + 显示编辑器） |
| ` ```bash ` / ` ```json ` / ` ```css ` 等其他 | 仅高亮源码 |
| ` ``` ` 无语言标签 | 交互式（向后兼容） |
| ` ```jsx padded ` | 交互式 + 示例之间增加内边距 |
| ` ```jsx noeditor ` | 仅渲染示例，不显示编辑器 |
| ` ```jsx static ` | 仅高亮源码 |
| ` ```jsx {"props":{"title":"提示"}} ` | 交互式 + 给 wrapper 注入 props |

## JSDoc 标签清单

| 标签 | 作用 |
| --- | --- |
| `@ignore` | 在 Props 表中隐藏该 prop |
| `@public` | 把类组件的实例方法公开到文档 |
| `@component` | **styled-components 标记**（必加才能被 docgen 识别） |
| `@visibleName` | 自定义在文档中的显示名 |
| `@example ./path.md` | 关联外部示例文件 |

## 双重导出模式速查

```jsx
// 命名导出：基础组件（react-docgen 识别，生成 Props 表）
export function Component(props) { /* ... */ }
Component.propTypes = { /* ... */ };

// 默认导出：增强组件（HOC 包裹，供示例渲染）
export default withRouter(Component);
```

**约定**：

- 单文件仅 1 个 default 或 1 个 named export（多 named 官方警告不可靠）
- 命名导出供文档生成（含 `propTypes`）
- 默认导出供示例渲染（拿到 HOC 注入的 router / theme / store）

## 与 Storybook 对比表

| 维度 | Styleguidist | Storybook |
| --- | --- | --- |
| **驱动方式** | Markdown | CSF（Component Story Format） |
| **类比** | 商店橱窗（storefront） | 工作台（workshop） |
| **示例展示** | 所有组件及其变体同页陈列 | 一次一个变体 |
| **受众** | 开发 + 设计 + 产品 | 主要面向开发者 |
| **核心强项** | 文档可读性、Markdown 易写 | addon 生态、交互测试、视觉回归 |
| **addon 生态** | 无 | 数百个 |
| **视觉回归** | 无 | 内置（chromatic / percy addon） |
| **组件测试** | 无 | stories + play function |
| **框架支持** | React 专用 | React / Vue / Angular / Svelte / Web Components |
| **零配置启动** | CRA 项目开箱即用 | 需 `init` 配置 |
| **社区趋势** | 趋于稳定（部分团队迁出） | 主流（生态持续增长） |
| **维护状态** | 13.1.4（活跃），102 open issues / 144 PR | 持续高速迭代 |
| **作者** | Artem Sapegin（sapegin） | Storybook 团队（Norbert de Langen 等） |

> 二者并非二选一——一些团队同时用：Storybook 做开发期测试、Styleguidist 做对外风格指南。

## 与相邻章边界

- **vs Storybook**：Styleguidist = Markdown 驱动的「风格指南 / 文档展示」（storefront），所有组件及其变体同页陈列；Storybook = CSF 驱动的「组件开发工作台」（workshop），一次一个变体，重交互测试、addon 生态、视觉回归。Styleguidist **不做** addon 体系、视觉回归、组件交互测试自动化（那属 Storybook / 前端测试工具边界）。
- **vs react-docgen**：`react-docgen` 是 Styleguidist 内部依赖的 PropTypes 静态分析器，本章不深入 docgen API 本身（属 AST / 静态分析章）。
- **vs MDX / Docz / Catalog**：同属「组件文档生成工具」赛道，但 Styleguidist 是**纯 Markdown**（非 MDX 混 JSX），面向 React 生态、CRA 零配置。
- **本章覆盖范围**：仅 Styleguidist 的安装配置、Markdown 写法、Props 表生成、隔离渲染、与 Storybook 定位对比；不覆盖通用 Markdown 语法、webpack 通用配置、React 组件设计本身。

## 版本与运行环境

| 项 | 取值 |
| --- | --- |
| 当前稳定版 | **13.1.4**（npm dist-tags.latest） |
| 许可 | MIT |
| 作者 | Artem Sapegin（sapegin，v0.0.1 起唯一长期维护者） |
| beta tag | 12.0.0-alpha9.9（早期 v12 尝试，主线已跳到 13.x） |
| GitHub 状态 | 102 open issues / 144 PR（积压但未停更） |
| Node 要求 | 建议 LTS（Node 18+） |
| React 支持 | 16.8+（支持 Hooks） |
| 默认端口 | `6060` |
| 默认输出目录 | `styleguide/` |

## 官方资源

- 文档总入口：[https://react-styleguidist.js.org](https://react-styleguidist.js.org)
- Getting Started：[https://react-styleguidist.js.org/docs/getting-started](https://react-styleguidist.js.org/docs/getting-started)
- Documenting（Markdown 写法 / 示例 / Props 表）：[https://react-styleguidist.js.org/docs/documenting](https://react-styleguidist.js.org/docs/documenting)
- Configuration（全量配置项）：[https://react-styleguidist.js.org/docs/configuration](https://react-styleguidist.js.org/docs/configuration)
- Third Parties（Wrapper / Provider / styled-components）：[https://react-styleguidist.js.org/docs/thirdparties](https://react-styleguidist.js.org/docs/thirdparties)
- Cookbook（实战技巧）：[https://react-styleguidist.js.org/docs/cookbook](https://react-styleguidist.js.org/docs/cookbook)
- GitHub：[https://github.com/styleguidist/react-styleguidist](https://github.com/styleguidist/react-styleguidist)
- Issue #620（项目定位）：[https://github.com/styleguidist/react-styleguidist/issues/620](https://github.com/styleguidist/react-styleguidist/issues/620)
