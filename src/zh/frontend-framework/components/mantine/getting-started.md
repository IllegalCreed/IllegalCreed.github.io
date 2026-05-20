---
layout: doc
outline: [2, 3]
---

# Mantine 入门

本文以 **Mantine v8.x → v9.x**（2026 年 5 月最新稳定版 **v9.2.1**）为基线，聚焦最常见的 **Vite + React 18/19 + TypeScript 5+** 组合，演示从零到「跑通第一个 Button + TextInput + 表单 + 通知」的完整链路。Next.js App Router 集成在最后单独给出。

## 前置准备

### Node.js 与包管理器

Mantine 官方文档默认使用 **yarn**，但本项目统一推荐 **pnpm**（monorepo 友好、磁盘占用更小）。最低要求：

- Node.js **18.18+**（建议 LTS 20.x 或 22.x）
- pnpm **9+**（或 npm 10+ / yarn 4+）
- React **18.2+** 或 **19.x**（v8+ 同时支持）
- TypeScript **5.0+**（强烈推荐，Mantine 是 TypeScript-first 项目）

```bash
# 检查环境
node -v   # v20.x.x
pnpm -v   # 9.x.x
```

### React 18 vs React 19

Mantine 9.x **完整支持 React 19**——所有组件、hooks、Polymorphic 类型推导都在 React 19 RC / GA 上测试通过。**新项目首选 React 19**，老项目 React 18 → 19 升级 Mantine 部分无破坏性变更。

### TypeScript 推荐

强烈推荐启用 TypeScript：

- Mantine 所有 API 都有完整 TS 类型
- `createTheme` 的 components 配置完美类型联动
- `useForm` 类型推导贯穿整个表单生命周期
- Polymorphic 组件 component prop 决定其余 props 类型

JavaScript 项目当然也能用，但**会丢失 60% 以上的 IDE 智能提示**。

## 快速开始 - 从模板创建

如果你是新项目，最快路径是用官方模板。

### vite-min-template（最小模板）

```bash
# 通过 GitHub 模板创建
npx degit mantinedev/vite-min-template my-mantine-app

cd my-mantine-app
pnpm install
pnpm dev
```

打开 http://localhost:5173，你会看到一个最小的 Mantine 演示页。

模板已经包含：

- Vite + React 19 + TypeScript 5
- PostCSS 配置（含 `postcss-preset-mantine`）
- `@mantine/core` + `@mantine/hooks`
- `MantineProvider` 包根
- 暗色模式支持

### vite-template（完整模板）

```bash
npx degit mantinedev/vite-template my-mantine-app
```

完整模板额外包含：

- Vitest + Testing Library
- ESLint + Prettier + Stylelint
- Storybook 8
- GitHub Actions CI 配置

适合**长期维护的工程化项目**，但初学建议从 vite-min-template 起步。

## 手动集成到 Vite 项目

如果你已经有一个 Vite 项目，从零集成 Mantine 只需 4 步。

### 第 1 步：创建 Vite 项目（已有可跳过）

```bash
pnpm create vite my-mantine-app -- --template react-ts
cd my-mantine-app
pnpm install
```

### 第 2 步：安装 Mantine 包

最小化安装只需 `@mantine/core` + `@mantine/hooks`：

```bash
pnpm add @mantine/core @mantine/hooks
```

PostCSS 相关开发依赖（v7+ 强制需要）：

```bash
pnpm add -D postcss postcss-preset-mantine postcss-simple-vars
```

> **重要**：`postcss-preset-mantine` 是 Mantine v7+ CSS Modules 架构的核心依赖，**必装否则响应式变量、自动暗色模式样式都不会生效**。

按需添加其他子包（后续章节会单独示例）：

```bash
# 表单 / 日期 / 通知 / 模态框 / 命令面板 / 图表 / 富文本 / 拖拽上传 / 进度条
pnpm add @mantine/form
pnpm add @mantine/dates dayjs
pnpm add @mantine/notifications
pnpm add @mantine/modals
pnpm add @mantine/spotlight
pnpm add @mantine/charts recharts
pnpm add @mantine/tiptap @tiptap/react @tiptap/pm @tiptap/starter-kit
pnpm add @mantine/dropzone
pnpm add @mantine/nprogress
pnpm add @mantine/code-highlight
pnpm add @mantine/carousel embla-carousel-react
```

### 第 3 步：配置 PostCSS

在项目根目录创建 `postcss.config.cjs`（**注意是 .cjs 不是 .js**，因为大多数项目 package.json 有 `"type": "module"`）：

```js
// postcss.config.cjs
module.exports = {
  plugins: {
    "postcss-preset-mantine": {},
    "postcss-simple-vars": {
      variables: {
        // 断点定义 - 与 theme.breakpoints 保持一致
        "mantine-breakpoint-xs": "36em", // 576px
        "mantine-breakpoint-sm": "48em", // 768px
        "mantine-breakpoint-md": "62em", // 992px
        "mantine-breakpoint-lg": "75em", // 1200px
        "mantine-breakpoint-xl": "88em", // 1408px
      },
    },
  },
};
```

> **为什么用 em 而不是 px**：Mantine 用户可能调大浏览器默认字号（无障碍考虑），em 单位能跟随调整，px 不会。

### 第 4 步：导入样式 + 包裹 MantineProvider

修改 `src/main.tsx`：

```tsx
import "@mantine/core/styles.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider>
      <App />
    </MantineProvider>
  </StrictMode>,
);
```

> **关键**：`@mantine/core/styles.css` 的 import 必须在 `MantineProvider` 之前（CSS 加载顺序）。

### 第 5 步：第一个组件

修改 `src/App.tsx`：

```tsx
import { Button, Container, Stack, Text, Title } from "@mantine/core";

export default function App() {
  return (
    <Container size="sm" py="xl">
      <Stack gap="md">
        <Title order={1}>欢迎来到 Mantine</Title>
        <Text c="dimmed">基于 CSS Modules + TypeScript-first 的现代 React 组件库</Text>
        <Button onClick={() => alert("点击了按钮")}>点我</Button>
      </Stack>
    </Container>
  );
}
```

运行 `pnpm dev` 打开页面，你会看到一个带标题、说明文字和按钮的简洁演示。

## 暗色模式一行启用

Mantine 暗色模式是一等公民——只需在 `MantineProvider` 加一个 prop：

```tsx
<MantineProvider defaultColorScheme="auto">
  <App />
</MantineProvider>
```

`defaultColorScheme` 可选值：

- `"light"` - 默认浅色
- `"dark"` - 默认深色
- `"auto"` - **跟随系统**（推荐）

### 用户手动切换

写一个切换按钮：

```tsx
import { ActionIcon, useMantineColorScheme, useComputedColorScheme } from "@mantine/core";
import { IconMoon, IconSun } from "@tabler/icons-react";

export function ColorSchemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("light", { getInitialValueInEffect: true });

  return (
    <ActionIcon
      variant="default"
      size="lg"
      aria-label="切换主题"
      onClick={() => setColorScheme(computedColorScheme === "dark" ? "light" : "dark")}
    >
      {computedColorScheme === "dark" ? <IconSun size={18} /> : <IconMoon size={18} />}
    </ActionIcon>
  );
}
```

> **`useMantineColorScheme` vs `useComputedColorScheme`**：
> - `useMantineColorScheme().colorScheme` 返回 `"light"` / `"dark"` / `"auto"` 三种值（用户设置值）
> - `useComputedColorScheme()` 永远返回 `"light"` / `"dark"` 二选一（auto 自动解算为系统当前值）
> - **写切换按钮逻辑用 `useComputedColorScheme`、读用户偏好用 `useMantineColorScheme`**

### 防 SSR 闪烁

如果你的项目是 SSR（Next.js / Remix），需要在 HTML head 中提前注入颜色脚本。SPA Vite 项目暂时不需要、但本地化 localStorage 模式下建议加上：

```tsx
// src/main.tsx（SPA 通常不需要、SSR 必需）
import { ColorSchemeScript } from "@mantine/core";

// 在 <head> 中渲染（Vite SPA 通过 index.html 注入或 React 19 renderHead）
```

完整 SSR 配置见下文 **Next.js App Router 集成** 章节。

## TextInput + Form 第一个表单

Mantine 表单是「输入组件 + `@mantine/form` 库」组合。先看一个最简表单：

```tsx
import { Button, Stack, TextInput, PasswordInput, Checkbox } from "@mantine/core";
import { useForm } from "@mantine/form";

interface LoginFormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

export default function LoginForm() {
  const form = useForm<LoginFormValues>({
    mode: "uncontrolled", // 推荐：uncontrolled 模式性能更好
    initialValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "邮箱格式不正确"),
      password: (value) =>
        value.length < 6 ? "密码至少 6 个字符" : null,
    },
  });

  return (
    <form onSubmit={form.onSubmit((values) => console.log("提交:", values))}>
      <Stack gap="md">
        <TextInput
          label="邮箱"
          placeholder="your@email.com"
          {...form.getInputProps("email")}
        />
        <PasswordInput
          label="密码"
          placeholder="至少 6 个字符"
          {...form.getInputProps("password")}
        />
        <Checkbox
          label="记住我"
          {...form.getInputProps("rememberMe", { type: "checkbox" })}
        />
        <Button type="submit">登录</Button>
      </Stack>
    </form>
  );
}
```

要点：

- `useForm` 默认 **uncontrolled 模式**（推荐，性能更好），需要响应 onChange 时改 `controlled`
- `form.getInputProps('field')` 自动展开 value / onChange / error 三个 props
- Checkbox / Switch / Radio 等用 `type: 'checkbox'` 参数（解决 `checked` vs `value` 区别）
- `form.onSubmit(callback)` 自动调用 `event.preventDefault()` + 触发 validate

> Checkbox 用 `{ type: 'checkbox' }` 是 Mantine 的设计选择——这样可以保持 `getInputProps` 统一返回 `value`，再由 Checkbox 内部转 `checked`。**忘了写这个参数会导致 Checkbox 不受控**。

## Notifications 第一个通知

`@mantine/notifications` 是独立子包，需要单独安装 + 初始化：

```bash
pnpm add @mantine/notifications
```

修改 `src/main.tsx`：

```tsx
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider>
      <Notifications position="top-right" />
      <App />
    </MantineProvider>
  </StrictMode>,
);
```

> **关键**：
> - `Notifications` 是普通组件不是 Provider，**只能渲染一次**（多次渲染会重复弹通知）
> - 样式 import 顺序：`@mantine/core/styles.css` → `@mantine/notifications/styles.css`
> - `position` 可选：`top-left` / `top-center` / `top-right` / `bottom-left` / `bottom-center` / `bottom-right`

任意组件触发通知：

```tsx
import { Button } from "@mantine/core";
import { notifications } from "@mantine/notifications";

export function NotifyDemo() {
  return (
    <Button
      onClick={() =>
        notifications.show({
          title: "保存成功",
          message: "你的修改已经同步到服务器",
          color: "green",
          autoClose: 3000,
        })
      }
    >
      触发通知
    </Button>
  );
}
```

注意 `notifications.show` 是**全局命令式 API**——任意位置（包括非 React 上下文如 axios interceptor）都能调用，无需 `useNotifications` hook。

## Style Props 入门

Mantine 几乎所有组件都支持 30+ 内联样式 props（统称 Style Props），相当于内置了 Tailwind / Chakra 的 utility props 哲学但走 CSS Variables 路线。

```tsx
import { Box, Text } from "@mantine/core";

<Box mt="md" mb="xs" px="lg" py="sm" bg="blue.0" c="blue.9">
  <Text fz="lg" fw={700} ta="center">
    标题文字
  </Text>
</Box>;
```

常用 Style Props 速查：

| 类别 | Props | 说明 |
| ---- | ----- | ---- |
| 外边距 | `m`, `mt`, `mb`, `ml`, `mr`, `mx`, `my` | margin / margin-top 等 |
| 内边距 | `p`, `pt`, `pb`, `pl`, `pr`, `px`, `py` | padding 同上 |
| 尺寸 | `w`, `h`, `miw`, `maw`, `mih`, `mah` | width / max-width 等 |
| 颜色 | `c`, `bg`, `bd` | text color / background / border |
| 字体 | `fz`, `fw`, `ff`, `lh`, `ta`, `tt`, `td`, `fs`, `lts` | size / weight / family / line-height / text-align 等 |
| 布局 | `display`, `flex`, `pos`, `top`, `left`, `bottom`, `right` | display / flex / position |

值可以是：

- **主题尺寸**：`mt="xs"` 引用 `theme.spacing.xs`
- **主题颜色**：`c="blue.6"` 引用 `theme.colors.blue[6]`
- **原生 CSS**：`mt={16}` / `c="#ff0000"` 直接写

响应式对象语法：

```tsx
<Box w={{ base: 200, sm: 400, lg: 500 }} p={{ base: "xs", md: "lg" }}>
  小屏 200px / sm 屏 400px / lg 屏 500px
</Box>
```

`base` 是默认值、`sm` / `md` / `lg` / `xl` 对应断点。

> **Style Props vs Tailwind**：Mantine Style Props 是 React props（编译进 JSX），Tailwind 是 class 字符串——**风格不同但目标一致**。Mantine 可以与 Tailwind 共存（用 className），但同一项目建议二选一保持一致性。

## createTheme 入门

主题对象是 Mantine 的设计 token 中心。最小示例：

```tsx
// src/theme.ts
import { createTheme } from "@mantine/core";

export const theme = createTheme({
  primaryColor: "blue", // 默认主色（引用 theme.colors.blue）
  defaultRadius: "md",  // 默认圆角
  fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
  headings: {
    fontFamily: "Inter, sans-serif",
    fontWeight: "600",
  },
});
```

在 main.tsx 注入：

```tsx
import { theme } from "./theme";

<MantineProvider theme={theme} defaultColorScheme="auto">
  <App />
</MantineProvider>;
```

### 自定义色板

Mantine 颜色系统每个色 10 个 shade（0-9），创建自定义色：

```ts
import { createTheme, type MantineColorsTuple } from "@mantine/core";

// 10 个 shade 的元组，从浅到深
const brandColor: MantineColorsTuple = [
  "#e0f7ff",
  "#b3ecff",
  "#80dfff",
  "#4dd2ff",
  "#26c8ff",
  "#00bfff",
  "#00a8e8",
  "#0094cc",
  "#0080b3",
  "#006d9e",
];

export const theme = createTheme({
  primaryColor: "brand",
  colors: {
    brand: brandColor,
  },
});
```

使用时：

```tsx
<Button color="brand">品牌按钮</Button>
<Box c="brand.9" bg="brand.0">浅背景 + 深字</Box>
```

> **生成色板的工具**：[Mantine Colors Generator](https://mantine.dev/colors-generator/) 输入一个 hex 自动生成 10 个 shade。

## Vite 集成完整示例

完整目录结构：

```
my-mantine-app/
├── postcss.config.cjs       # PostCSS 配置
├── package.json
├── vite.config.ts
├── tsconfig.json
└── src/
    ├── main.tsx              # MantineProvider 包根
    ├── App.tsx
    ├── theme.ts              # createTheme 主题对象
    └── components/
        ├── ColorSchemeToggle.tsx
        ├── LoginForm.tsx
        └── NotifyDemo.tsx
```

最终 `src/main.tsx`：

```tsx
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";

import App from "./App.tsx";
import { theme } from "./theme.ts";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <Notifications position="top-right" />
      <App />
    </MantineProvider>
  </StrictMode>,
);
```

最终 `src/App.tsx`：

```tsx
import { AppShell, Container, Group, Title } from "@mantine/core";
import { ColorSchemeToggle } from "./components/ColorSchemeToggle";
import { LoginForm } from "./components/LoginForm";

export default function App() {
  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Title order={3}>My Mantine App</Title>
          <ColorSchemeToggle />
        </Group>
      </AppShell.Header>
      <AppShell.Main>
        <Container size="xs" py="xl">
          <LoginForm />
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
```

`AppShell` 是 Mantine 的布局壳组件——一行配置实现「顶部 Header + 主内容区」骨架。

## Next.js App Router 集成

Next.js 13+ App Router 是 SSR 项目首选——Mantine 提供「**一行集成**」方案。

### 第 1 步：安装

```bash
pnpm create next-app my-mantine-app
cd my-mantine-app

pnpm add @mantine/core @mantine/hooks
pnpm add -D postcss postcss-preset-mantine postcss-simple-vars
```

### 第 2 步：PostCSS 配置（同上 Vite）

```js
// postcss.config.cjs
module.exports = {
  plugins: {
    "postcss-preset-mantine": {},
    "postcss-simple-vars": {
      variables: {
        "mantine-breakpoint-xs": "36em",
        "mantine-breakpoint-sm": "48em",
        "mantine-breakpoint-md": "62em",
        "mantine-breakpoint-lg": "75em",
        "mantine-breakpoint-xl": "88em",
      },
    },
  },
};
```

### 第 3 步：layout.tsx 一行集成

```tsx
// app/layout.tsx
import "@mantine/core/styles.css";

import type { Metadata } from "next";
import {
  ColorSchemeScript,
  MantineProvider,
  mantineHtmlProps,
} from "@mantine/core";

export const metadata: Metadata = {
  title: "My Mantine App",
  description: "Mantine on Next.js App Router",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
      </head>
      <body>
        <MantineProvider defaultColorScheme="auto">
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
```

**关键三件套**：

1. **`ColorSchemeScript`** - 在 `<head>` 中渲染、防止 SSR 闪烁（首屏立即应用正确主题）
2. **`{...mantineHtmlProps}`** - spread 到 `<html>` 上、避免 hydration warning（设置 `data-mantine-color-scheme` 等属性）
3. **`MantineProvider`** - 包裹整个应用

### 第 4 步：第一个页面（Client Component）

```tsx
// app/page.tsx
"use client";

import { Button, Container, Title } from "@mantine/core";

export default function HomePage() {
  return (
    <Container size="md" py="xl">
      <Title>Hello Mantine on Next.js</Title>
      <Button mt="md" onClick={() => alert("点击了")}>
        点我
      </Button>
    </Container>
  );
}
```

> **重要**：交互组件（含 onClick / useState）必须加 `"use client"` 指令。**布局展示类组件可以是 Server Component**——Mantine 大部分纯展示组件（Title / Text / Container 等）都能在 RSC 中渲染。

### Notifications / Modals / Spotlight 集成

这些 Provider 需要 Client Component 包裹，建议封装一个 `Providers` 组件：

```tsx
// app/providers.tsx
"use client";

import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { ModalsProvider } from "@mantine/modals";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider defaultColorScheme="auto">
      <ModalsProvider>
        <Notifications position="top-right" />
        {children}
      </ModalsProvider>
    </MantineProvider>
  );
}
```

然后在 `layout.tsx`：

```tsx
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";

import {
  ColorSchemeScript,
  mantineHtmlProps,
} from "@mantine/core";
import { Providers } from "./providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

> **注意**：`ColorSchemeScript` 必须直接渲染在 Server Component layout 的 `<head>` 中，**不能放进 `Providers`**——因为 Server Component 才能在 SSR 阶段输出 `<head>`。

## React Router 集成

React Router v7（原 Remix Router）集成与 Vite SPA 几乎一致，只是把 `App` 换成 `RouterProvider`：

```bash
pnpm add @mantine/core @mantine/hooks react-router-dom
pnpm add -D postcss postcss-preset-mantine postcss-simple-vars
```

```tsx
// src/main.tsx
import "@mantine/core/styles.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import HomePage from "./pages/Home";
import AboutPage from "./pages/About";

const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "/about", element: <AboutPage /> },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider defaultColorScheme="auto">
      <RouterProvider router={router} />
    </MantineProvider>
  </StrictMode>,
);
```

### Polymorphic + Router Link 集成

把 Mantine Button 渲染成 React Router 的 Link：

```tsx
import { Button } from "@mantine/core";
import { Link } from "react-router-dom";

<Button component={Link} to="/about" variant="filled">
  跳转到 About 页
</Button>;
```

这就是 Mantine **Polymorphic component** 的力量——`component` prop 改变底层渲染元素同时保留 Button 所有样式。

## CSS Modules 入门

v7+ Mantine 推荐的样式定制方式是 **CSS Modules**（取代旧版 Emotion sx prop / styled）。

### 创建 CSS Module 文件

```css
/* src/components/MyCard.module.css */
.card {
  padding: var(--mantine-spacing-md);
  background: var(--mantine-color-blue-0);
  border-radius: var(--mantine-radius-md);
  transition: transform 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
}

/* 暗色模式适配 */
[data-mantine-color-scheme="dark"] .card {
  background: var(--mantine-color-blue-9);
}

/* 响应式（依赖 postcss-simple-vars） */
@media (max-width: $mantine-breakpoint-sm) {
  .card {
    padding: var(--mantine-spacing-xs);
  }
}
```

### 使用

```tsx
import { Box } from "@mantine/core";
import classes from "./MyCard.module.css";

export function MyCard() {
  return <Box className={classes.card}>卡片内容</Box>;
}
```

要点：

- 直接使用 `var(--mantine-color-*)` 等 CSS 变量（Mantine v7+ 自动生成）
- `[data-mantine-color-scheme="dark"]` 选择器适配暗色模式
- `$mantine-breakpoint-*` 是 PostCSS 编译时变量（在 postcss-simple-vars 中定义）

### postcss-preset-mantine 提供的 mixins

`postcss-preset-mantine` 还提供 mixin 简化常见样式：

```css
.card {
  background: light-dark(white, var(--mantine-color-dark-7));

  @mixin smaller-than $mantine-breakpoint-sm {
    padding: var(--mantine-spacing-xs);
  }

  @mixin hover {
    transform: translateY(-2px);
  }

  @mixin dark {
    background: var(--mantine-color-dark-7);
  }
}
```

- `light-dark(lightValue, darkValue)` - 自动根据 color scheme 选择
- `@mixin smaller-than $mantine-breakpoint-sm` - 媒体查询简写
- `@mixin hover` - 桌面端 hover、移动端不触发
- `@mixin dark` / `@mixin light` - 主题适配简写

## TypeScript 配置要点

Mantine 是 TypeScript-first，配置零额外步骤——但有几个最佳实践：

### tsconfig.json 推荐

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "resolveJsonModule": true
  }
}
```

### CSS Modules 类型声明

如果用 CSS Modules + TypeScript，需要类型声明：

```ts
// src/css-modules.d.ts
declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}
```

Vite 自动包含这个声明（`vite/client.d.ts`），但**自定义构建工具需要手动**。

### 主题类型扩展

如果在 `theme.other` 中放自定义字段，可以用 module augmentation 扩展 TypeScript 类型：

```ts
// src/mantine.d.ts
import "@mantine/core";

declare module "@mantine/core" {
  export interface MantineThemeOther {
    customSpacing: string;
    brandName: string;
  }
}
```

之后访问 `theme.other.customSpacing` 会有完整类型提示。

## 验证安装：完整示例

最后跑一个综合示例，验证所有基础组件都正常：

```tsx
// src/App.tsx
"use client"; // Next.js 才需要、Vite 不需要

import {
  ActionIcon,
  Alert,
  AppShell,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Group,
  Stack,
  Text,
  Title,
  useMantineColorScheme,
  useComputedColorScheme,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";

export default function App() {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("light");

  const handleNotify = () => {
    notifications.show({
      title: "成功",
      message: "Mantine 集成完成",
      color: "green",
      autoClose: 3000,
    });
  };

  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Title order={3}>My Mantine App</Title>
          <ActionIcon
            variant="default"
            size="lg"
            aria-label="切换主题"
            onClick={() =>
              setColorScheme(computedColorScheme === "dark" ? "light" : "dark")
            }
          >
            {computedColorScheme === "dark" ? "Light" : "Dark"}
          </ActionIcon>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="md" py="xl">
          <Stack gap="lg">
            <Title order={1}>Mantine 集成验证</Title>

            <Alert color="blue" title="信息提示">
              当前主题：<strong>{computedColorScheme}</strong>
            </Alert>

            <Card withBorder padding="lg" radius="md">
              <Group justify="space-between" mb="md">
                <Group>
                  <Avatar color="blue" radius="xl">JS</Avatar>
                  <Box>
                    <Text fw={500}>John Smith</Text>
                    <Text size="xs" c="dimmed">前端工程师</Text>
                  </Box>
                </Group>
                <Badge color="green">在线</Badge>
              </Group>
              <Text c="dimmed">
                这是一个综合演示卡片，包含 Avatar / Badge / Text / 主题色等核心元素。
              </Text>
              <Button mt="md" fullWidth onClick={handleNotify}>
                触发通知
              </Button>
            </Card>
          </Stack>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
```

如果这个示例能正确显示、按钮能触发通知、暗色模式切换正常 —— **恭喜，Mantine 集成完成**。

## 常见踩坑速记

### 踩坑 1：忘了导入 styles.css

**症状**：所有组件没有样式、Button 是个朴素的 `<button>`。

**解决**：确保在应用入口顶部导入：

```ts
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css"; // 用到 notifications 才需要
import "@mantine/dates/styles.css";         // 用到 dates 才需要
import "@mantine/charts/styles.css";        // 用到 charts 才需要
```

### 踩坑 2：忘了 postcss.config.cjs

**症状**：响应式 prop（如 <span v-pre>`w={{ sm: 200 }}`</span>）不生效、CSS Modules 中的 `$mantine-breakpoint-*` 编译报错。

**解决**：在项目根目录创建 `postcss.config.cjs` 并安装 `postcss-preset-mantine` + `postcss-simple-vars`。

### 踩坑 3：Next.js Hydration Warning

**症状**：浏览器控制台出现「Hydration failed because the server rendered HTML didn't match the client」红字。

**解决**：在 `<html>` 上 spread `mantineHtmlProps`：

```tsx
<html lang="zh-CN" {...mantineHtmlProps}>
```

### 踩坑 4：SSR 首屏闪烁（白屏→暗色）

**症状**：Next.js / Remix 用户点开页面，先看到浅色界面再瞬间切到暗色。

**解决**：在 `<head>` 中渲染 `ColorSchemeScript`：

```tsx
<head>
  <ColorSchemeScript defaultColorScheme="auto" />
</head>
```

这个脚本在 React hydrate 之前同步执行、立即应用正确主题。

### 踩坑 5：Notifications 重复弹出

**症状**：一次调用 `notifications.show` 弹出 2-3 个通知。

**解决**：检查 `<Notifications />` 组件是否被多次渲染（React.StrictMode 在开发模式会双倍渲染、但 Notifications 是状态外置不受影响——真正的原因通常是手滑在多个地方写了 Notifications）。

### 踩坑 6：Checkbox 不受控

**症状**：用 `{...form.getInputProps('rememberMe')}` 后 Checkbox 点击没反应。

**解决**：加 `{ type: 'checkbox' }` 参数：

```tsx
<Checkbox {...form.getInputProps("rememberMe", { type: "checkbox" })} />
```

### 踩坑 7：CSS Modules 类名找不到

**症状**：`classes.card` 是 `undefined`。

**解决**：检查 CSS 文件名后缀 —— 必须是 `.module.css` 不是 `.css`。

### 踩坑 8：暗色模式样式不生效

**症状**：手动切到暗色但样式没变。

**解决**：在 CSS 中加 `[data-mantine-color-scheme="dark"]` 选择器、或用 `light-dark(...)` mixin。**不要用 `prefers-color-scheme` 媒体查询**——因为 Mantine 是 JS 控制 color scheme、不依赖系统媒体查询。

## 下一步

恭喜你完成 Mantine 入门 —— 接下来推荐阅读：

- [指南](./guide-line.md)：组件分类、表单深度、主题深度、Combobox 系列、Data Table 方案、Polymorphic、SSR 完整、@mantine/hooks 70+ hooks 速览、常见踩坑
- [参考](./reference.md)：130+ 组件清单、70+ hooks 清单、createTheme 完整选项、Styles API 详解、TypeScript 类型

或者直接打开 [Mantine 官网](https://mantine.dev/) 浏览 130+ 组件实时 Demo。
