---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 storybook.js.org 官方文档编写，对照 Storybook 10 稳定版

## 速查

- **三配置文件**：`main.ts`（项目行为）/ `preview.ts`（Canvas 全局）/ `manager.ts`（UI 主题）
- **三作用域**：global（preview）→ component（meta）→ story，下层覆盖上层
- **CSF 3 三件套**：`default export`（meta）+ 多个 `named export`（story）+ `Meta`/`StoryObj` 类型
- **Essentials 八件**：Actions / Controls / Backgrounds / Viewport / Measure / Outline / Highlight / Toolbars
- **核心 addon**：`addon-a11y`（axe-core）/ `addon-docs`（autodocs）/ `addon-interactions` + `addon-vitest`（play 测试）
- **Actions 三选一**：`fn()`（推荐，可 spy）/ `action()`（仅日志）/ `argTypesRegex`（play 不可用）
- **a11y 三档**：`test` = `off` / `todo`（默认）/ `error`（CI 失败）
- **autodocs**：`tags:['autodocs']` 全局 / `tags:['!autodocs']` 单组件关
- **属性隐藏**：`table:{disable:true}` 完全移除；`control:false` 仅关控件保留文档行
- **Storybook 10**（2025-10）：ESM-only 包分发；CSF Factories 实验性（defineMain/definePreview/preview.meta/meta.story）
- **本仓库版本**：`packages/ui` 用 `@storybook/vue3-vite ^10.3.6`
- 完整说明见 [入门](./getting-started.md) / [核心指南](./guide-line.md)

## CSF 语法速查

### CSF 2 vs CSF 3

| 维度 | CSF 2（旧） | CSF 3（推荐） |
| --- | --- | --- |
| Story 写法 | 函数式 `(args) => <Comp {...args}/>` | 对象式 `{ args: {...} }` |
| 复用 | `Template.bind({})` + 逐字段赋值 | 展开运算符 `{ args: { ...Default.args, size:'lg' } }` |
| 类型 API | `ComponentMeta` / `ComponentStory` | `Meta` / `StoryObj` |
| title | 必须手写 | 可省略，按文件路径推断 |
| render | 默认隐式 | 可选，覆盖默认渲染 |
| 升级 | 已过时 | codemod：`npx storybook migrate csf-2-to-3` |

### Meta（默认导出）字段

| 字段 | 必需 | 类型 | 作用 |
| --- | --- | --- | --- |
| `component` | 是 | 组件 | 驱动 props 表 / docgen |
| `title` | 否 | string | 侧边栏分组（CSF3 可省略自动推断） |
| `tags` | 否 | string[] | `autodocs` / `!dev` / `test-only` 等 |
| `args` | 否 | object | 全 story 共用的默认 args |
| `argTypes` | 否 | object | 元数据（控件类型 / 选项 / 描述 / 表） |
| `decorators` | 否 | fn[] | 组件级包装函数 |
| `parameters` | 否 | object | 组件级参数（layout / backgrounds / a11y 等） |
| `render` | 否 | fn | 覆盖默认渲染 |
| `includeStories` | 否 | regex/string[] | 哪些导出当 story 加载 |
| `excludeStories` | 否 | regex/string[] | 哪些导出不加载 |

### Story（命名导出）字段

| 字段 | 作用 |
| --- | --- |
| `args` | story 专属输入（覆盖 meta.args） |
| `argTypes` | story 专属元数据 |
| `decorators` | story 专属包装函数 |
| `parameters` | story 专属参数 |
| `render` | 自定义渲染 |
| `name` | 覆盖 UI 显示名（默认按导出名 startCase） |
| `play` | 交互测试函数 `async ({ canvas, userEvent }) => {}` |
| `tags` | 标签（如 `!dev` 不在侧边栏显示） |
| `loaders` | 异步加载 mock 数据 |

### loaders（异步数据）

```ts
export const WithUser: Story = {
  loaders: [
    async () => {
      const user = await fetch("/api/user").then(r => r.json());
      return { user };
    },
  ],
  render: (args, { loaded: { user } }) => ({
    props: { ...args, user },
  }),
};
```

## Control 类型族完整表

| 类型 | 适配 prop 类型 | 可选配置 | 典型用例 |
| --- | --- | --- | --- |
| `boolean` | boolean | — | disabled / loading |
| `number` | number | `min`/`max`/`step` | count |
| `range` | number | `min`/`max`/`step` | opacity / progress |
| `object` | object | — | style / config |
| `file` | File/string | `accept` | avatar / logo |
| `radio` | string/number（单选） | `options` | size（块状） |
| `inline-radio` | 同上 | `options` | size（行内） |
| `check` | array（多选） | `options` | tags（块状） |
| `inline-check` | 同上 | `options` | tags（行内） |
| `select` | string/number（下拉） | `options` | variant |
| `multi-select` | array（下拉多选） | `options` | selected |
| `text` | string | — | label |
| `color` | string（hex/rgb） | `presetColors` | bg / color |
| `date` | string（ISO） | — | birthday |
| `null` | — | — | 自动推断 |
| `false` | — | — | 关闭控件 |

## Addons 完整清单

### Essentials（@storybook/addon-essentials 一包八个）

| 插件 | 作用 | 禁用方式 |
| --- | --- | --- |
| Actions | 捕获事件回调 | `features: { actions: false }` |
| Controls | 自动参数控件 | `parameters: { controls: { disable: true } }` |
| Backgrounds | 切换背景色 | `features: { backgrounds: false }` |
| Viewport | 响应式视口 | `parameters: { viewport: { disable: true } }` |
| Measure | 测量元素 | `features: { measure: false }` |
| Outline | 元素轮廓 | `features: { outline: false }` |
| Highlight | DOM 高亮 | `features: { highlight: false }` |
| Toolbars | 全局工具栏 | — |

### 测试 / 质量类

| 插件 | 包名 | 作用 |
| --- | --- | --- |
| A11y | `@storybook/addon-a11y` | axe-core 无障碍检查 |
| Interactions | `@storybook/addon-interactions` | play 函数调试面板 |
| Vitest | `@storybook/addon-vitest` | Vitest 集成跑 stories |
| Test Runner | `@storybook/test-runner` | 独立进程跑 stories 测试 |
| Storyshots | `@storybook/addon-storyshots` | Jest snapshot（旧） |

### 文档 / 协作类

| 插件 | 包名 | 作用 |
| --- | --- | --- |
| Docs | `@storybook/addon-docs` | autodocs + MDX |
| Links | `@storybook/addon-links` | story 间跳转 |
| Design | `storybook-addon-designs` | 嵌入 Figma 设计稿 |
| Changelog | `storybook-changelog` | 显示 CHANGELOG |

### 主题 / 样式类

| 插件 | 包名 | 作用 |
| --- | --- | --- |
| Themes | `storybook-addon-themes` | 主题切换（与 globalTypes.theme 类似） |
| Styles | `@storybook/addon-styling`（已更名） | SCSS/Tailwind/UnoCSS 集成 |

### 数据 / Mock 类

| 插件 | 包名 | 作用 |
| --- | --- | --- |
| GraphQL | `storybook-addon-apollo` | Apollo Client mock |
| Mock Date | `storybook-mock-date-decorator` | 时间 mock |

## 配置项速查

### main.ts（StorybookConfig）字段

| 字段 | 类型 | 作用 |
| --- | --- | --- |
| `stories` | string[] | story 文件 glob |
| `addons` | string[]/object[] | 插件清单 |
| `framework.name` | string | `@storybook/{framework}-{builder}` |
| `framework.options` | object | builder 选项 |
| `viteFinal` | fn | 注入 Vite 配置 |
| `webpackFinal` | fn | 注入 Webpack 配置 |
| `staticDirs` | string[] | 静态资源 |
| `docs` | object | `autodocs: 'tag' \| false` |
| `features` | object | 实验特性 |
| `typescript` | object | TS 配置（check / reactDocgen） |
| `core` | object | `disableTelemetry` 等 |
| `refs` | object | 跨项目 stories 引用 |
| `env` | object | 注入 process.env |
| `loglevel` | string | verbose/debug/info/warn/error/error |

### preview.ts（Preview）字段

| 字段 | 类型 | 作用 |
| --- | --- | --- |
| `parameters` | object | 全局参数（controls/backgrounds/a11y/viewport/layout） |
| `globalTypes` | object | 工具栏全局注解（theme 等） |
| `decorators` | fn[] | 全局包装函数 |
| `tags` | string[] | `autodocs` |
| `initialGlobals` | object | globalTypes 初始值 |
| `args` | object | 全局默认 args |
| `argTypes` | object | 全局元数据（隐藏框架噪声） |
| `loaders` | fn[] | 全局异步数据加载 |
| `applyDecorators` | fn | 自定义 decorator 组合 |

### parameters 常用项

| 参数 | 作用 |
| --- | --- |
| `layout` | `padded`（默认）/ `centered` / `fullscreen` |
| `controls.matchers` | 自动推断 color/date 的正则 |
| `controls.hideNoControlsWarning` | 关闭「无控件」警告 |
| `backgrounds.default` | 默认背景名 |
| `backgrounds.values` | 背景列表（name/value） |
| `viewport.default` | 默认视口 |
| `viewport.viewports` | 视口列表 |
| `a11y.test` | `off`/`todo`/`error` |
| `a11y.config.rules` | 局部禁用规则 |
| `docs.page` | 自定义文档页（mdx） |

## a11y 配置详解

```ts
parameters: {
  a11y: {
    element: "#root", // 检查范围
    config: {
      rules: [
        { id: "color-contrast", enabled: false }, // 局部禁用
      ],
    },
    options: {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa"], // 仅检查 WCAG 2.x A/AA
      },
    },
    manual: false, // true = 完全手动（不推荐）
  },
}
```

**test 三值行为**：

| 值 | 行为 | 用途 |
| --- | --- | --- |
| `off` | 完全不跑 | 调试临时关 |
| `todo`（默认） | 跑 + 显示但不失败 | 渐进式引入 |
| `error` | 跑 + 违规即失败 | CI 防回归 |

## play 函数 API

```ts
import { expect, fn, userEvent, within, waitFor } from "@storybook/test";

export const Demo: Story = {
  args: { onSubmit: fn() }, // 注入 spy
  play: async ({ canvasElement, args, step, loaded, globals }) => {
    const canvas = within(canvasElement); // Testing Library 风格
    await step("输入邮箱", async () => {
      await userEvent.type(canvas.getByLabelText("邮箱"), "a@b.com");
    });
    await step("提交", async () => {
      await userEvent.click(canvas.getByRole("button", { name: /提交/i }));
    });
    await waitFor(() => {
      expect(args.onSubmit).toHaveBeenCalledWith({ email: "a@b.com" });
    });
  },
};
```

**play 参数**：

| 字段 | 类型 | 作用 |
| --- | --- | --- |
| `canvasElement` | HTMLElement | Canvas 根节点（给 within） |
| `args` | object | story 的 args（含 spy） |
| `step` | fn | 分步（在 UI 里展开） |
| `loaded` | object | loaders 返回的数据 |
| `globals` | object | globalTypes 当前值 |

## 视觉回归对比

| 维度 | HTML 快照（jest snapshot） | Chromatic |
| --- | --- | --- |
| 比对对象 | 渲染后的 HTML 标记 | 用户实际看到的像素 |
| 重构误报 | 改 className / 移位空格都触发 | 不影响视觉就不报 |
| 格式化误报 | Prettier 重排触发 | 不触发 |
| 跨浏览器 | 不支持 | Chrome/Firefox/Safari/Edge |
| 视口 / 主题 | 不支持 | 支持 |
| Review 工作流 | git diff | Web 界面（接受/拒绝） |
| 成本 | 免费（本地） | 商业化（免费档有限） |
| 信噪比 | 低 | 高 |

## 版本变化

### Storybook 10.0（2025-10，当前主线）

- **ESM-only 包分发**：v9 已减 50% 安装体积，10 再降 29%
- **CSF 3 仍是默认推荐**：对象式 + `Meta`/`StoryObj` + 自动 title 推断
- **CSF Factories 实验性**（下一代）：`defineMain` → `definePreview` → `preview.meta` → `meta.story` 链式工厂
  - 端到端类型安全（含 addon parameters/globals 类型推断）
  - subpath imports（`#.storybook/preview`）
  - React 框架完整支持，Vue/Angular/Svelte/Web Components 推进中（API 可能变化）
  - **同一文件不能 CSF 3 与 Factories 混用**，但项目内可分文件混用
- **Angular-vite 框架**（preview）
- **CSF 1/2/3 不会被废弃**

### Storybook 9（2024）

- 安装体积减 50%
- Onboarding UI 升级
- Test provider API 改进

### Storybook 8（2024）

- 引入 CSF Factories 早期实验
- Test provider API
- Vite builder 默认推荐
- Vue 3 / Svelte 5 / Next.js 14 支持

### Storybook 7（2023）

- CSF 3 成默认推荐
- 新型框架 API（framework 字段为对象）
- Vite builder 正式
- Interactions addon
- Component Testing

## 框架与 Builder 对照

| 框架 | 包名 | Builder |
| --- | --- | --- |
| Vue 3 | `@storybook/vue3-vite` | Vite |
| Vue 3 | `@storybook/vue3-webpack5`（旧） | Webpack |
| React | `@storybook/react-vite` | Vite |
| React | `@storybook/react-webpack5` | Webpack |
| Angular | `@storybook/angular` | Webpack |
| Angular | `@storybook/angular-vite`（10 preview） | Vite |
| Svelte | `@storybook/svelte-vite` / `sveltekit` | Vite |
| Web Components | `@storybook/web-components-vite` | Vite |
| Preact | `@storybook/preact` | Vite |
| Solid | `@storybook/solid` | Vite |
| Next.js | `@storybook/nextjs` | Webpack |
| Remix | `@storybook/remix-vite` | Vite |

> 本仓库用 `@storybook/vue3-vite ^10.3.6`。

## 与相邻工具的边界

| 工具 | 边界 |
| --- | --- |
| **Vitest / Jest** | 纯逻辑（reducer/util/纯函数）单元测试 |
| **Vue Test Utils / Testing Library** | 组件渲染 + 用户事件断言（Storybook 的 play 函数等价能力） |
| **Cypress / Playwright** | E2E：整页 / 跨页 / 真实后端的用户流 |
| **Ladle / Storyshots** | Storybook 的本地化轻量替代 |
| **Styleguidist** | React 专用组件文档（同生态位） |
| **dumi** | Vue/React 组件文档（中文生态） |
| **Figma / Design Tokens** | 上游设计来源（Storybook 消费） |
| **packages/ui 构建配置** | 组件实现与打包（Vite library mode / tsup），Storybook 只消费 |

## 官方资源

- 文档总入口：[storybook.js.org/docs](https://storybook.js.org/docs)
- CSF 规范：[storybook.js.org/docs/api/csf](https://storybook.js.org/docs/api/csf)
- CSF Factories：[storybook.js.org/docs/8/api/csf/csf-factories](https://storybook.js.org/docs/8/api/csf/csf-factories)
- Essentials：[storybook.js.org/docs/essentials/index](https://storybook.js.org/docs/essentials/index)
- Writing stories：[storybook.js.org/docs/writing-stories](https://storybook.js.org/docs/writing-stories)
- Writing tests：[storybook.js.org/docs/writing-tests](https://storybook.js.org/docs/writing-tests)
- Visual testing：[storybook.js.org/docs/writing-tests/visual-testing](https://storybook.js.org/docs/writing-tests/visual-testing)
- Accessibility testing：[storybook.js.org/docs/writing-tests/accessibility-testing](https://storybook.js.org/docs/writing-tests/accessibility-testing)
- Storybook 10 发布说明：[storybook.js.org/blog/storybook-10](https://storybook.js.org/blog/storybook-10/)
- GitHub：[github.com/storybookjs/storybook](https://github.com/storybookjs/storybook)
- Chromatic：[chromatic.com](https://www.chromatic.com/)
- 本仓库使用：`packages/ui` 中 `@storybook/vue3-vite ^10.3.6`
