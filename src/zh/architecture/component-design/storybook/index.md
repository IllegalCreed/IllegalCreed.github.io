---
layout: doc
---

# Storybook

Storybook 是业界事实标准的**组件开发环境**（Component Driven Development 工具），由 Frontend.es / Chromatic 团队维护，把 UI 组件从应用里**隔离**出来，在一个独立 Canvas 里以「stories 用例」的方式逐个状态开发、调试、文档化、测试。它本身不打包组件、也不是单元测试框架——它消费你已有的组件源码（Vue / React / Angular / Svelte / Web Components 等都支持），围绕组件构建「文档 + 控件 + 交互测试 + 视觉回归 + 无障碍检查」一整套开发者工作流。核心数据结构是 **CSF（Component Story Format）开放标准**：每个 `.stories.tsx` 文件一个 `default export`（meta 元数据）+ 多个 `named export`（每个 story 一个用例），CSF 3（对象式 + `Meta`/`StoryObj` 类型 + 自动 title 推断）为当前默认推荐写法。配置体系三件套：`.storybook/main.ts`（项目级行为：stories/addons/framework/builder）、`.storybook/preview.ts`（Canvas 全局 decorators/parameters/globalTypes）、`.storybook/manager.ts`（UI 主题）。官方 Essentials 包打包了最常用的八个插件（Actions/Controls/Backgrounds/Viewport/Measure/Outline/Highlight/Toolbars），`@storybook/addon-a11y` 接 axe-core 做无障碍检查，`@storybook/addon-docs` 通过 MDX + Doc Blocks 自动生成文档页，Chromatic 提供**像素级视觉回归测试**云服务。Storybook 10（2025-10）为当前主线，本仓库 `packages/ui` 已使用 `@storybook/vue3-vite ^10.3.6`，10.0 的主要破坏性变更为 **ESM-only** 包分发；下一代 CSF Factories（`defineMain`/`definePreview`/`preview.meta`/`meta.story` 链式工厂）作为端到端类型安全的演进方向，React 框架已完整支持、非 React 框架仍在推进（实验性）。

## 评价

**优点**

- **隔离开发**：组件脱离业务路由 / 真实 API / 全局状态在 Canvas 单独渲染，聚焦「这个组件长这样对不对」
- **状态即用例**：每个状态（loading / error / disabled / 满足边界值）都是一个 story，回归时一键复现
- **CSF 是开放标准**：基于 ES Module，可移植到 Storybook 之外（如被 Loki / Chromatic / 自有工具消费）
- **自动文档**：`tags:['autodocs']` 一行配置给所有组件生成文档页 + ArgsTable，与 argTypes/docgen 自动同步 props 表
- **Controls 即时改参**：args 动态输入，Controls 面板自动生成对应控件（select/radio/color/date/number…），无需改代码就能探索边界
- **多 addon 集成**：a11y 接 axe-core、Viewport 模拟响应式、Actions 捕获事件、Backgrounds 切背景、Docs 写富文档
- **视觉回归闭环**：Chromatic 把每个 story 转为像素级视觉测试用例，首次 baseline、后续比对，跨浏览器 / 视口 / 主题
- **生态广**：主流框架（Vue/React/Angular/Svelte/Web Components）+ 主流构建器（Vite/Webpack）全覆盖

**缺点**

- **配置面广**：main.ts / preview.ts / manager.ts 三层 + decorators/parameters/globalTypes 三作用域，新手上手有曲线
- **CSF 版本迁移成本**：CSF2 → CSF3 需 codemod，CSF Factories 又是下一代实验性，文档与博客并存容易混淆
- **样式隔离坑**：组件样式（UnoCSS/Tailwind/SCSS）若没在 viteFinal 注入，Canvas 渲染走样导致视觉回归误报
- **ESM-only 限制**（10.0）：Node 工具链与下游包必须支持 ESM，旧 CJS 项目升级需全链改造
- **测试不是单元测试**：play 函数聚焦组件交互与渲染断言；纯函数 / reducer / util 仍归 Vitest/Jest，混淆职责两边都慢
- **Chromatic 商业化**：免费额度有限，大团队商用需付费；本地替代方案（如 Storyshots + jest-image-snapshot）配置成本高
- **mock 数据易混入侧边栏**：未配 `includeStories`/`excludeStories` 时，命名导出的 mock 会被当成 story

## 文档地址

- [Storybook 官方文档总入口](https://storybook.js.org/docs)
- [CSF（Component Story Format）规范](https://storybook.js.org/docs/api/csf)
- [Essentials 插件包](https://storybook.js.org/docs/essentials/index)
- [Writing stories 指南](https://storybook.js.org/docs/writing-stories)
- [Writing tests（视觉 / a11y / 交互）](https://storybook.js.org/docs/writing-tests)

## GitHub 地址

[storybookjs/storybook](https://github.com/storybookjs/storybook) · [Chromatic](https://www.chromatic.com/)

## 幻灯片地址

<a href="/SlideStack/storybook-slide/" target="_blank">Storybook</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=703" target="_blank" rel="noopener noreferrer">Storybook 测试题</a>
