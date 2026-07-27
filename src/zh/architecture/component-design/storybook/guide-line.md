---
layout: doc
outline: [2, 3]
---

# 核心指南：CSF 3 / Controls / Addons / 测试 / 设计系统

> 基于 storybook.js.org 官方文档编写，对照 Storybook 10 稳定版（CSF 3 默认推荐，CSF Factories 实验性）

## 速查

- **CSF 3 三件套**：`default export`（meta，含 `component`/`tags`/`argTypes`/`decorators`/`parameters`）+ 多个 `named export`（story 对象，含 `args`/`render`/`play`）+ `Meta`/`StoryObj` 类型
- **Story 复用**：`export const Large = { args: { ...Default.args, size: 'lg' } }`（CSF3 对象式，比 CSF2 的 `Template.bind({})` 简洁）
- **title 自动推断**（CSF3）：省略 `title` 按文件路径推导，重构移动文件时导航层级自动跟随
- **includeStories/excludeStories**：过滤命名导出（mock 数据用 `.*Data$` 排除，避免污染侧边栏）
- **三层作用域**：global（preview.ts）→ component（meta）→ story，下层层覆盖上层层
- **Actions 三选一**：`fn()`（推荐，可作 spy 用于 play）/ `action()`（日志）/ `argTypesRegex` 自动匹配（**play 里拿不到 spy**）
- **autodocs**：preview.ts 全局 `tags:['autodocs']` 给所有 stories 自动生成文档页（替代手写 .mdx）
- **a11y 三档**：`parameters.a11y.test` 取 `off` / `todo`（默认，仅展示）/ `error`（CI 失败）
- **视觉回归**：Chromatic 像素级比对，每个 story = 一个视觉测试用例，跨浏览器/视口/主题
- **play 函数**：`play: async ({ canvas, userEvent }) => {...}`，结合 `@storybook/addon-vitest` / `test-runner` 进 CI
- **CSF Factories**（下一代实验性）：`defineMain` → `definePreview` → `preview.meta` → `meta.story`，端到端类型安全
- **反模式**：用 CSF2 函数式不升级 / mock 数据不排除 / 关 a11y / 写 production 逻辑 / framework 写字符串

## 安装配置深度

### .storybook/main.ts（StorybookConfig）

主配置文件，定义项目级行为（不进 Canvas iframe）：

```ts
import type { StorybookConfig } from "@storybook/vue3-vite";

const config: StorybookConfig = {
  stories: [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(ts|tsx)",
  ],
  // Essentials 包含 Actions/Controls/Backgrounds/Viewport/Measure/Outline/Highlight/Toolbars
  addons: [
    "@storybook/addon-essentials",
    "@storybook/addon-a11y",
    "@storybook/addon-interactions",
  ],
  framework: {
    name: "@storybook/vue3-vite", // 必须是对象不是字符串
    options: {},
  },
  // 注入项目构建插件（如 UnoCSS/Tailwind），与生产环境对齐
  viteFinal: async (config) => {
    config.plugins = [...(config.plugins ?? []), unocssIns];
    return config;
  },
  docs: { autodocs: "tag" }, // 也可在 preview.ts 用 tags:['autodocs']
  staticDirs: ["../public"], // 静态资源目录
  features: { /* storyStoreV7 等 */ },
  typescript: {
    check: false, // 是否在 storybook dev 时跑 type-check
    reactDocgen: "react-docgen-typescript",
  },
  core: { disableTelemetry: true },
};

export default config;
```

**关键字段速查**

| 字段 | 作用 |
| --- | --- |
| `stories` | story 文件 glob 数组 |
| `addons` | 插件清单 |
| `framework.name` | 框架 + builder，如 `@storybook/vue3-vite` / `@storybook/react-webpack5` |
| `viteFinal` / `webpackFinal` | 注入项目自定义 Vite/Webpack 配置 |
| `staticDirs` | 静态资源目录（注入到 Canvas） |
| `docs` | 文档配置（autodocs 开关等） |
| `features` | 实验特性开关 |
| `typescript` | TS 配置（type-check / docgen） |
| `refs` | 跨项目 stories 引用（构复合 Storybook） |
| `env` | 注入到 process.env 的变量 |

### .storybook/preview.ts（Canvas 全局）

在 Canvas iframe 加载，影响 stories 渲染：

```ts
import type { Preview } from "@storybook/vue3";
import { fn } from "storybook/test"; // 推荐的 action spy

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    backgrounds: {
      default: "light",
      values: [
        { name: "light", value: "#fff" },
        { name: "dark", value: "#1a1a1a" },
      ],
    },
    a11y: {
      test: "todo", // 默认仅展示违规；CI 改 'error' 让违规导致失败
      config: {
        rules: [
          { id: "color-contrast", enabled: false }, // 局部禁用 + 注释原因
        ],
      },
    },
    viewport: {
      viewports: {
        mobile: { name: "Mobile", styles: { width: "375px", height: "812px" } },
        tablet: { name: "Tablet", styles: { width: "768px", height: "1024px" } },
      },
    },
  },
  globalTypes: {
    theme: {
      name: "主题",
      description: "切换明暗主题",
      defaultValue: "light",
      toolbar: {
        icon: "circlehollow",
        items: [
          { value: "light", icon: "sun", title: "Light" },
          { value: "dark", icon: "moon", title: "Dark" },
        ],
      },
    },
  },
  // 全局 decorators：注入主题 / 路由 / 状态
  decorators: [
    (story, context) => /* 根据 context.globals.theme 包裹主题 provider */,
  ],
  tags: ["autodocs"], // 给所有 stories 自动开文档页
  initialGlobals: { theme: "light" },
};

export default preview;
```

### .storybook/manager.ts（UI 主题）

UI 层配置（不影响 Canvas），通过 `addons.setConfig` 设置界面行为：

```ts
import { addons } from "@storybook/manager-api";
import theme from "./theme";

addons.setConfig({
  theme: theme, // 自定义 Storybook UI 主题（与 Canvas 组件主题无关）
  sidebar: { showRoots: true },
  toolbar: { zoom: { hidden: false } },
});
```

> manager.ts 改的是 Storybook UI 框架的样式（侧边栏 / 工具栏），与被测组件的主题（globalTypes.theme）是两件事，勿混淆。

## CSF 3 Stories 深度

### 完整 Meta 字段

```ts
const meta = {
  // 必需：组件本身，驱动 props 表与 docgen
  component: Button,
  // 可省略：CSF3 按文件路径推断
  title: "Components/Button",
  // 全 story 共用的 args（被各 story 的 args 覆盖）
  args: { size: "md" },
  // 元数据
  argTypes: { /* 见下 */ },
  // 组件级 decorators
  decorators: [/* ... */],
  // 组件级 parameters
  parameters: { layout: "centered" },
  // 自动文档
  tags: ["autodocs"],
  // 渲染器（罕见，覆盖默认 render）
  render: (args) => /* ... */,
  // 控制哪些命名导出当 story 加载
  includeStories: /^[A-Z]/,
  excludeStories: /.*Data$/,
} satisfies Meta<typeof Button>;
```

### 完整 Story 对象

```ts
export const Primary: Story = {
  // story 专属 args（覆盖 meta.args）
  args: { primary: true, label: "Primary" },
  // story 专属 argTypes
  argTypes: { size: { control: "radio", options: ["sm", "md"] } },
  // story 专属 decorators
  decorators: [/* ... */],
  // story 专属 parameters
  parameters: { backgrounds: { default: "dark" } },
  // 自定义渲染（罕见）
  render: (args) => /* ... */,
  // 自定义 story 名（默认按导出名 startCase）
  name: "主按钮",
  // 交互测试（自动化）
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button"));
    await expect(onClick).toHaveBeenCalledWith(/* ... */);
  },
  // 标签（如跳过视觉回归）
  tags: ["!dev"], // 不在侧边栏显示但能跑测试
};
```

### Story 复用模式（CSF3 推荐）

```ts
// 基础 story
export const Default: Story = {
  args: { label: "Button", size: "md", variant: "primary" },
};

// 展开复用 + 部分覆盖
export const Large: Story = {
  args: { ...Default.args, size: "lg" },
};

export const Secondary: Story = {
  args: { ...Default.args, variant: "secondary" },
};

// 组合多个 story 的 args
export const DisabledLarge: Story = {
  args: { ...Large.args, disabled: true },
};
```

### includeStories / excludeStories

避免 mock 数据被当 story 加载：

```ts
// 导出 mock 数据用于多个 story
export const userMockData = { id: 1, name: "Alice" }; // ❌ 默认会被加载到侧边栏

const meta = {
  // ✅ 仅大写开头的导出当 story
  includeStories: /^[A-Z]/,
  // 或：排除 Data 结尾的导出
  excludeStories: /.*Data$/,
} satisfies Meta;
```

### 命名规则

- 导出名 `Primary` → UI 显示 `Primary`（Lodash `startCase`）
- `PrimaryAction` → `Primary Action`
- 自定义：`name: "主按钮"` 覆盖

## Controls / ArgTypes / Args

### ArgTypes 配置位置

可定义在三层：

```ts
// 1. preview.ts 全局：所有组件生效
parameters: {
  argTypes: {
    // 隐藏框架注入的噪声属性（Vue 的 key/ref/class/style）
    key: { table: { disable: true } },
    ref: { table: { disable: true } },
  };
}

// 2. meta 组件级
argTypes: { size: { control: "select", options: ["sm", "md"] } }

// 3. story 级
export const Large = {
  argTypes: { /* 仅本 story */ },
};
```

### Control 类型族完整对照

| 类型 | 适用 | 可选配置 | 示例 |
| --- | --- | --- | --- |
| `boolean` | 布尔开关 | — | `disabled: { control: "boolean" }` |
| `number` | 数字输入 | `min`/`max`/`step` | `count: { control: { type: "number", min: 0, step: 1 } }` |
| `range` | 范围滑块 | `min`/`max`/`step` | `opacity: { control: { type: "range", min: 0, max: 1, step: 0.1 } }` |
| `object` | JSON 对象 | — | `style: { control: "object" }` |
| `file` | 文件选择 | `accept` | `avatar: { control: { type: "file", accept: "image/*" } }` |
| `radio` | 单选（块） | `options` | `size: { control: "radio", options: ["sm", "md"] }` |
| `inline-radio` | 单选（行内） | `options` | 同上 |
| `check` | 多选（块） | `options` | `tags: { control: "check", options: ["a", "b"] }` |
| `inline-check` | 多选（行内） | `options` | 同上 |
| `select` | 下拉单选 | `options` | `variant: { control: "select", options: [...] }` |
| `multi-select` | 下拉多选 | `options` | 同上 |
| `text` | 文本 | — | `label: { control: "text" }` |
| `color` | 颜色选择器 | `presetColors` | `bg: { control: "color", presetColors: ["#fff", "#000"] }` |
| `date` | 日期选择器 | — | `birthday: { control: "date" }` |
| `null` / `false` | 关闭控件 | — | `internal: { control: false }` |

### 隐藏属性（两种方式的差异）

```ts
argTypes: {
  // 完全移除：从 Controls + ArgsTable 都消失
  internalProp: { table: { disable: true } },
  // 仅移除控件：ArgsTable 仍有这一行（用于"只文档不控件"的属性）
  docsOnlyProp: { control: false },
}
```

> `tags:['autodocs']` 是开自动文档，`table:{disable:true}` 是从 ArgsTable 移除某行；前者影响「是否生成文档页」，后者影响「ArgsTable 里这一行是否出现」。

## Addons 全家桶

### Essentials（一包八个）

`@storybook/addon-essentials` 打包：

| 插件 | 作用 |
| --- | --- |
| **Actions** | 捕获事件回调（onClick、onSubmit…）显示在 Actions 面板 |
| **Controls** | 根据 args/argTypes 自动生成参数控件 |
| **Backgrounds** | 切换 Canvas 背景色（验深浅模式） |
| **Viewport** | 响应式视口预设（iPhone/iPad/desktop） |
| **Measure** | 测量元素尺寸 / 距离 |
| **Outline** | 显示元素轮廓（视觉对齐检查） |
| **Highlight** | 高亮 DOM 节点（点击锁定） |
| **Toolbars** | 全局工具栏（globalTypes 配套） |

**禁用单个**：

```ts
features: {
  backgrounds: false, // 关掉 Backgrounds
  measure: false,
  outline: false,
}
```

### Actions 三种回调注入

```ts
import { fn } from "storybook/test"; // 推荐
import { action } from "@storybook/addon-actions"; // 仅日志

// 1. fn()：jest 兼容 spy，可在 play 函数中断言（推荐）
export const Default: Story = {
  args: { onClick: fn() }, // play 里能 expect(onClick).toHaveBeenCalled()
};

// 2. action()：仅日志记录，不是 spy
export const Default2: Story = {
  args: { onClick: action("onClick") },
};

// 3. argTypesRegex 自动匹配（不推荐用于 play）
const meta = {
  args: { onClick: fn() }, // 显式注入更可控
};
// ❌ 旧写法：argTypesRegex: /^on.*/ 自动注入 —— 自动注入的 args
//    官方明确「are not available as spies in your play function」
```

> 现代写法：直接在 args 里写 `onClick: fn()`，既能记录到 Actions 面板、也能在 play 函数里 `expect(...)`。argTypesRegex 自动注入已不推荐用于 play 测试。

### addon-a11y（无障碍检查）

底层 axe-core（Deque），自动发现约 57% 的 WCAG 问题：

```ts
// preview.ts 全局启用
parameters: {
  a11y: {
    test: "todo", // 默认：仅展示，不失败
    // test: "error", // CI 防回归：违规就 fail
    // test: "off",   // 完全关闭
    config: {
      rules: [
        // 局部禁用 + 注释原因
        { id: "color-contrast", enabled: false }, // 设计决策：用品牌色
      ],
    },
    options: {},
    element: "#root", // 检查范围
  },
}
```

**面板分三栏**：Violations / Passes / Incomplete。

**渐进式工作流**：

1. 新项目全局 `test: "todo"`（不一开始就红）
2. 存量违规组件用 `test: "error"` 单独覆盖
3. 逐个修复后移除局部覆盖

### addon-docs（自动文档）

通过 MDX + Doc Blocks 自动生成文档页：

```ts
// preview.ts 全局开启
tags: ["autodocs"], // 给所有 stories 自动生成 Docs 页
// docs: { autodocs: "tag" } // 也可在 main.ts 配
```

单文件覆盖：

```ts
// 不生成文档
const meta = {
  tags: ["!autodocs"], // 仅本组件
};
```

**手写 MDX（富叙事文档）**：

```mdx
<!-- Button.mdx -->
import { Canvas, Story, ArgTypes } from "@storybook/blocks";
import * as ButtonStories from "./Button.stories";

# Button 按钮

用于触发动作。

<Canvas of={ButtonStories.Default} />

<ArgTypes of={ButtonStories} />
```

> autodocs 优先：组件一多 autodocs 维护成本为零，手写 .mdx 仅在需要富叙事文档（介绍 / 教程 / 多组件对比）时补充。

### addon-interactions / addon-vitest（play 测试）

```bash
pnpm add -D @storybook/addon-interactions @storybook/test
```

play 函数写交互测试：

```ts
import { expect, fn, userEvent, within } from "@storybook/test";

export const FormSubmit: Story = {
  args: { onSubmit: fn() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("邮箱"), "a@b.com");
    await userEvent.click(canvas.getByRole("button", { name: /提交/i }));
    await expect(canvas.getByText(/成功/)).toBeInTheDocument();
  },
};
```

CI 跑测试：

```bash
# 1. test-runner（独立进程跑 stories）
pnpm add -D @storybook/test-runner
test-storybook --url http://localhost:6006

# 2. addon-vitest（Vitest 集成）
pnpm add -D @storybook/addon-vitest
# 在 vitest.config 里加 storybookTest() plugin
```

## 视觉回归测试

### Chromatic（推荐）

Storybook 团队开发的云服务：

```bash
pnpm add -D @chromatic-com/storybook
```

`package.json`：

```json
{
  "scripts": {
    "chromatic": "chromatic --project-token=<token>"
  }
}
```

**工作原理**：

1. 每个 story 自动转为视觉测试用例
2. 首次跑生成 **baseline 快照**
3. 后续跑做**像素级比对**
4. 差异 → 进入 review 工作流（接受 = 更新 baseline / 拒绝 = 阻塞 PR）
5. 支持跨浏览器（Chrome/Firefox/Safari/Edge）、跨视口、跨主题

**为什么不用 HTML 快照测试**：

| 维度 | HTML 快照（jest snapshot） | 视觉测试（Chromatic） |
| --- | --- | --- |
| 比对对象 | 渲染后的 HTML 标记 | 用户实际看到的像素 |
| 重构误报 | 改 className / 移位空格都触发 | 不影响视觉就不报 |
| 格式化误报 | Prettier 重排触发 | 不影响视觉就不报 |
| 跨浏览器 | 不支持 | 支持 |
| 视口 / 主题 | 不支持 | 支持 |

> 视觉测试信噪比远高于 HTML 快照——快照比的是「代码」，视觉比的是「用户看到的」。

### 本地替代方案

| 方案 | 说明 |
| --- | --- |
| **Storyshots**（@storybook/addon-storyshots） | 在 Jest 里跑 stories + puppeteer 截图比对，配置复杂 |
| **jest-image-snapshot** | 通用图像快照，需自己写采集 |
| **Playwright + 截图** | 在 Playwright 测试里访问 Canvas URL 截图比对 |
| **Reg-suit** | 通用视觉回归工具，可接 Storybook |

> 中小项目直接用 Chromatic 免费档即可；只有强本地化需求（如离线 / 数据合规）才考虑本地替代。

## 设计系统集成

### Storybook 作为设计系统门户

把 design tokens / primitives / patterns 全部接入 Storybook，设计师 / PM / QA 一处查看：

```
.storybook/
├── main.ts
├── preview.ts        # 全局主题注入
└── theme.ts          # UI 主题（manager）

src/
├── tokens/           # design tokens
│   ├── colors.stories.ts
│   ├── typography.stories.ts
│   └── spacing.stories.ts
├── primitives/       # 原子组件
│   └── Button/
│       ├── Button.vue
│       └── Button.stories.ts
├── patterns/         # 复合模式
│   └── Form/
│       └── Form.stories.ts
└── pages/            # 整页 demo
```

### 主题切换（globalTypes + decorators）

```ts
// preview.ts
import { themes } from "../src/themes";

const preview: Preview = {
  globalTypes: {
    theme: {
      name: "主题",
      defaultValue: "light",
      toolbar: {
        items: [
          { value: "light", title: "Light", icon: "sun" },
          { value: "dark", title: "Dark", icon: "moon" },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (story, context) => ({
      components: { story, ThemeProvider },
      setup() {
        const theme = context.globals.theme === "dark" ? themes.dark : themes.light;
        return { theme };
      },
      template: '<ThemeProvider :theme="theme"><story /></ThemeProvider>',
    }),
  ],
};
```

### Figma 集成

通过 `storybook-addon-designs` 嵌入 Figma 设计稿：

```bash
pnpm add -D storybook-addon-designs
```

```ts
// 在 story 里嵌入 Figma
export const Default: Story = {
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/file/xxx/Button",
    },
  },
};
```

### 跨项目复合（refs）

把多个库的 Storybook 聚合到一个门户：

```ts
// .storybook/main.ts
const config: StorybookConfig = {
  refs: {
    ui: { title: "UI 库", url: "https://ui.example.com/storybook" },
    icons: { title: "图标库", url: "https://icons.example.com/storybook" },
  },
};
```

## 反模式（避坑）

- **继续用 CSF2 函数式不升级**：`Template = (args) => <Comp {...args}/>` + `Template.bind({})` 逐字段赋值已被 CSF3 对象式取代；样板多、复用要 bind、title 必须手写。用 codemod 升级：
  ```bash
  npx storybook migrate csf-2-to-3 --glob="**/*.stories.tsx"
  ```
- **mock 数据命名导出不配置 includeStories/excludeStories**：mock（如 `userData`）会被当 story 加载到侧边栏。应用 `includeStories: /^[A-Z]/` 或 `excludeStories: /.*Data$/` 过滤。
- **用 argTypesRegex ^on.* 自动匹配 actions 还指望在 play 函数里 spy**：官方明确「自动推断的 args 'are not available as spies in your play function'」，交互测试会失败——改用 `fn()`。
- **为消 a11y 告警全局关掉检查**（`test:'off'` 或 `manual:true`）：等于放弃无障碍门禁。按规则 id 局部禁用 + 注释原因：
  ```ts
  parameters: {
    a11y: {
      config: { rules: [{ id: "color-contrast", enabled: false }] }, // 设计决策
    },
  }
  ```
- **在 story 的 render 或 args 里写 production-only 逻辑 / 真实 API 调用**：story 应是隔离的纯 UI 用例，副作用会让视觉回归 / a11y 测试 flaky。
- **main.ts 把 framework 写成字符串 / 遗漏 viteFinal 注入项目插件**：组件样式（UnoCSS/Tailwind/SCSS）在 Canvas 里走样，视觉回归误报。framework 必须是 `{ name, options }` 对象。
- **每页组件文档都手写 .mdx 不用 autodocs**：组件一多文档与 props 漂移。autodocs 基于 argTypes/docgen 自动同步，手写仅用于富叙事文档。
- **在 Storybook 里跑业务逻辑单元测试**（纯函数 / 状态机）：职责混淆——Storybook 聚焦组件隔离开发与交互 / 视觉 / a11y 测试，纯逻辑测试交给 Vitest/Jest。
- **混淆 `table:{disable:true}` 与 `control:false`**：前者完全移除（含文档行），后者仅移除控件保留文档行——按需要选。
- **CSF Factories 当生产用**（非 React 框架）：API 仍实验性可能变，Vue/Angular/Svelte/Web Components 项目继续用 CSF3 + `satisfies Meta`。

## 下一步

- [参考](./reference.md)：CSF 语法表、addon 完整清单、配置项速查、版本变化、官方资源
