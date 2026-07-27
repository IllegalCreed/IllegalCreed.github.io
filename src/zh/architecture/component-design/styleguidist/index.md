---
layout: doc
---

# Styleguidist

Styleguidist（npm 包名 `react-styleguidist`）是 Artem Sapegin 长期维护的**Markdown 驱动的 React 组件文档工具**，官方定位为「Isolated React component development environment with a living style guide」。开发者只需在组件同目录放一个 Markdown 文件（默认 `Readme.md`），在其中用 fenced code block 写 ```jsx 示例，Styleguidist 就会把这些示例**编译成可交互、可在线编辑**的真实 React 组件，同时通过内置的 `react-docgen` 静态分析 `propTypes` 与 JSDoc 注释**自动生成 Props 表**。它面向「重视文档可读性、希望产出非开发受众也能看懂的『风格指南』」的场景，与 Storybook 的「CSF 驱动的组件开发工作台」形成互补。当前稳定版 **13.1.4**（MIT 许可），Create React App 项目可零配置启动（`npx styleguidist server`），开箱即用扫描 `src/components/**/*.{js,jsx,ts,tsx}`。

## 评价

**优点**

- **Markdown 即文档**：示例即文档，文档与代码零距离，非开发受众也能读懂
- **零配置开箱**：CRA 项目 `npx styleguidist server` 即跑，默认 glob 扫 `src/components/`
- **Props 表自动生成**：内置 `react-docgen` 静态分析 `propTypes` + JSDoc 注释，无需手写
- **隔离渲染**：每个示例在浏览器独立编译（Bublé 转译），互不污染
- **Wrapper 注入 Provider**：通过 `styleguideComponents.Wrapper` 统一注入 Redux / Theme / Intl
- **CRA 友好**：默认 CRA webpack 配置自动加载，无需额外配

**缺点**

- **React 专用**：不支持 Vue / Angular / Svelte，跨技术栈团队需另选工具
- **无 addon 生态**：不做视觉回归、不做组件交互测试自动化（属 Storybook 边界）
- **静态分析限制**：`react-docgen` 无法穿透 HOC / 动态工厂，需手动「双重导出」绕开
- **社区趋势下滑**：Storybook 已成主流，Yelp 等团队已迁出，GitHub 积压 102 open issues / 144 PR
- **TypeScript 类型注解不解析**：从 `node_modules` 重导出第三方 TS 组件需另装 `react-docgen-typescript` 配 `propsParser`

## 文档地址

- [Styleguidist 官方文档总入口](https://react-styleguidist.js.org)
- [Getting Started（安装 / 命令 / CRA 零配置）](https://react-styleguidist.js.org/docs/getting-started)
- [Documenting（Markdown 写法 / 示例 / JSDoc / Props 表）](https://react-styleguidist.js.org/docs/documenting)
- [Configuration（styleguide.config.js 全量配置）](https://react-styleguidist.js.org/docs/configuration)
- [Third Parties（Wrapper / Provider / styled-components / CSS Modules）](https://react-styleguidist.js.org/docs/thirdparties)

## GitHub 地址

[styleguidist/react-styleguidist](https://github.com/styleguidist/react-styleguidist)

## 幻灯片地址

<a href="/SlideStack/styleguidist-slide/" target="_blank">Styleguidist</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=704" target="_blank" rel="noopener noreferrer">Styleguidist 测试题</a>

