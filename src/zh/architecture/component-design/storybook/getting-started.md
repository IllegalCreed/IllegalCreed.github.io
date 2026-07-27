---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 storybook.js.org 官方文档编写，对照 Storybook 10 稳定版行为（本仓库 packages/ui 已使用 `@storybook/vue3-vite ^10.3.6`）

## 速查

- **定位**：组件隔离开发环境（不是构建工具、不是单元测试框架）；用 CSF 描述 stories 用例，驱动文档 / Controls / 测试 / 视觉回归
- **CSF 三件套**：`.stories.tsx` 文件 = 一个 `default export`（meta）+ 多个 `named export`（每个 story 一个用例）
- **CSF 3 推荐写法**：对象式 story、`satisfies Meta<typeof Comp>` 类型、`type Story = StoryObj<typeof meta>`、title 自动推断
- **三配置文件**：`main.ts`（项目行为 stories/addons/framework）/ `preview.ts`（Canvas 全局 decorators/parameters/globalTypes）/ `manager.ts`（UI 主题）
- **三作用域**：global（preview）→ component（meta）→ story，下层覆盖上层
- **Essentials 八件**：Actions / Controls / Backgrounds / Viewport / Measure / Outline / Highlight / Toolbars
- **核心 addon**：`@storybook/addon-a11y`（axe-core 无障碍）、`@storybook/addon-docs`（autodocs 自动文档）
- **视觉回归**：Chromatic 云服务，每个 story = 一个视觉测试用例，像素级比对（优于 HTML 快照）
- **play 函数**：`play: async ({ canvas, userEvent }) => {...}`，结合 test-runner / addon-vitest 进入 CI 自动化
- **Storybook 10**（2025-10）：ESM-only 包分发；CSF Factories 为下一代实验性写法（React 完整、其他框架推进中）
- **安装速跑**：`npx storybook@latest init` 自动加配置 + 脚本 + 示例 stories

## Storybook 是什么

Storybook 是组件**隔离开发环境**——把 UI 组件从应用路由 / 真实 API / 全局状态里抽出来，在独立 Canvas 里以「stories 用例」逐个状态开发、调试、文档化、测试。它由 Chromatic 团队（前身 Frontend.es）维护，是业界事实标准。

三个核心定位：

- **开发**：以状态为单位开发组件，每个状态（默认 / loading / error / 满足边界值）是一个 story
- **协作**：设计师 / PM / QA 不读代码也能在文档页看到组件所有状态、改 Controls 探索边界
- **质量门禁**：a11y 检查 + 视觉回归 + play 函数交互测试，CI 防回归

> Storybook ≠ 单元测试框架。play 函数 + test-runner/addon-vitest 才进入自动化测试范畴，且聚焦组件交互与渲染断言（Testing Library 风格 DOM 断言）；纯函数 / reducer / util 测试仍归 Vitest/Jest。

## CSF 速览（Component Story Format）

CSF 是基于 ES6 模块的开放标准，把 stories 与组件元数据定义为 ES Module：

```ts
// Button.stories.ts
import type { Meta, StoryObj } from "@storybook/vue3";
import Button from "./Button.vue";

// 默认导出 = 组件元数据（meta）
const meta = {
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg"] },
  },
} satisfies Meta<typeof Button>;
export default meta;

// 命名导出 = 每个 story 一个用例
type Story = StoryObj<typeof meta>;
export const Primary: Story = {
  args: { primary: true, label: "点击" },
};
export const Disabled: Story = {
  args: { ...Primary.args, disabled: true },
};
```

**CSF 关键点**：

- `default export` 是必需的 meta 对象（含 `component` 字段，驱动 props 表 / docgen）
- 每个 `named export` 是一个 story，导出名经 Lodash `startCase` 转 UI 显示名（`Primary` → `Primary`）
- **CSF 3**（推荐）：对象式 story + `...Primary.args` 展开复用，无需 `Template.bind({})`
- **CSF 2**（旧）：函数式 `Template = (args) => <Comp {...args}/>` + `Template.bind({})` 逐字段赋值，已有 codemod 升级

## 安装与初始化

### 全新项目初始化

```bash
# 在项目根目录跑（自动检测框架并安装对应版本）
npx storybook@latest init

# 该命令做四件事：
# 1. 装 @storybook/* 依赖
# 2. 创建 .storybook/main.ts、.storybook/preview.ts
# 3. 加 package.json 脚本：storybook（dev）/ build-storybook（构建）
# 4. 生成示例 stories（Button/Header/Page）
```

初始化后的 `package.json`：

```json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  }
}
```

### 已有项目手动安装（Vue 3 + Vite 示例）

```bash
# 装框架对应的 builder + essentials
pnpm add -D storybook @storybook/vue3-vite \
  @storybook/addon-essentials

# 创建配置目录
mkdir -p .storybook
```

`.storybook/main.ts`（最小配置）：

```ts
import type { StorybookConfig } from "@storybook/vue3-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx|mdx)"],
  addons: ["@storybook/addon-essentials"],
  framework: {
    name: "@storybook/vue3-vite",
    options: {},
  },
};

export default config;
```

`.storybook/preview.ts`（最小配置）：

```ts
import type { Preview } from "@storybook/vue3";

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
  },
};

export default preview;
```

### 启动与构建

```bash
# 启动开发服务（默认 6006 端口）
pnpm storybook

# 静态构建（输出到 ./storybook-static）
pnpm build-storybook

# 本地预览构建产物
npx http-server ./storybook-static
```

## 第一个 Story

写一个 Vue Button 组件的 stories：

```ts
// src/components/Button.vue 的 stories
import type { Meta, StoryObj } from "@storybook/vue3";
import Button from "./Button.vue";

const meta = {
  title: "Components/Button", // 显式指定侧边栏分组（CSF3 也可省略自动推断）
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: { type: "select" },
      options: ["sm", "md", "lg"],
      description: "按钮尺寸",
    },
    variant: {
      control: { type: "radio" },
      options: ["primary", "secondary", "ghost"],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// 默认 story
export const Default: Story = {
  args: { size: "md", variant: "primary", label: "Button" },
};

// 复用 Default.args 的展开
export const Large: Story = {
  args: { ...Default.args, size: "lg" },
};

export const Disabled: Story = {
  args: { ...Default.args, disabled: true },
};
```

启动后即可看到：

- **Canvas**：渲染 Button 各状态
- **Controls 面板**：根据 `argTypes` 自动生成 size 下拉、variant 单选、label 文本框
- **Docs 页**：自动生成「描述 + ArgsTable + 各 story 预览」
- **Actions 面板**：点击按钮捕获 `onClick` 事件（如配置了）

## 三类核心概念

### args（动态输入）

`args` 是 story 的动态输入数据，Storybook 据此自动生成 Controls 控件：

```ts
export const Primary: Story = {
  args: {
    label: "Hello",
    primary: true,
    // Controls 面板会自动出现对应控件
  },
};
```

修改 Controls 控件 → 实时更新 Canvas 渲染。**args 是响应式的**，多个 story 用展开运算符复用。

### ArgTypes（元数据）

`argTypes` 是 args 的元数据，定义控件类型 / 选项 / 描述 / 表显示：

```ts
argTypes: {
  size: {
    control: "select",
    options: ["sm", "md", "lg"],
    description: "尺寸",
    table: { defaultValue: { summary: "md" } },
  },
  // 完全隐藏某 prop（不显示在 Controls 也不显示在 ArgsTable）
  internalProp: { table: { disable: true } },
  // 仅隐藏控件保留文档行
  docsOnlyProp: { control: false },
}
```

**Control 类型族**：`boolean` / `number` / `range` / `object` / `file` / `radio` / `inline-radio` / `check` / `inline-check` / `select` / `multi-select` / `text` / `color` / `date`（配 `presetColors`/`min`/`max`/`step`/`accept`）。

### decorators（包装函数）

`decorators` 是包裹 story 渲染的包装函数，常用于注入主题 / 路由 / 全局状态：

```ts
// 全局（preview.ts）：所有 stories 都被红色边框包裹
export const decorators = [
  (story) => ({
    components: { story },
    template: '<div style="border: 2px solid red"><story /></div>',
  }),
];

// 组件级（meta）：仅 Button stories 加 padding
const meta = {
  decorators: [(story) => /* ... */],
};

// story 级：仅 Large story 加背景
export const Large = {
  decorators: [(story) => /* ... */],
};
```

**优先级**：story 级 > 组件级（meta）> 全局（preview），下层覆盖上层。

## 下一步

- [核心指南](./guide-line.md)：CSF 3 深度 + Controls/ArgTypes 配置 + addons 全家桶 + 视觉回归 + 设计系统集成 + 反模式
- [参考](./reference.md)：CSF 语法表、addon 完整清单、配置项速查、版本变化、官方资源
