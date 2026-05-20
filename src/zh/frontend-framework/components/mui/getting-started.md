---
layout: doc
outline: [2, 3]
---

# 入门

本文档基于 **MUI v9.x + React 18/19 + TypeScript 5+**，演示从安装、第一个组件、主题、暗色模式到 Vite / Next.js 集成的完整流程。MUI 全称 **Material UI**（`@mui/material`），是 React 生态最权威的 Google Material Design 实现。

## 概念速览

### MUI 生态全景

MUI 不是单包，而是**多包生态**，新手最容易在「该装哪个包」上迷茫。一张表说清各包定位：

| 包名 | 作用 | 是否必装 |
| --- | --- | --- |
| `@mui/material` | **Material Design 组件库主包**（80+ 组件） | 是 |
| `@emotion/react` + `@emotion/styled` | **默认 CSS-in-JS 引擎**（运行时计算样式） | 是 |
| `@mui/icons-material` | **2100+ Material 图标**（按需 import） | 强烈推荐 |
| `@fontsource/roboto` | **Roboto 字体本地化**（不挂 Google CDN 时必装） | 推荐 |
| `@mui/material-nextjs` | **Next.js App Router 一行 SSR 集成** | Next.js 项目必装 |
| `@mui/x-data-grid` | **MUI X 数据表格**（社区版 MIT 免费） | 可选 |
| `@mui/x-date-pickers` | **MUI X 日期选择器**（MIT 免费） | 可选 |
| `@mui/x-charts` | **MUI X 图表**（MIT 免费） | 可选 |
| `@mui/system` | **底层样式工具**（`sx` / `styled` / `Box`） | `@mui/material` 自动依赖 |
| `@mui/joy` | **Joy UI**（独立设计语言，**已 on hold 不推荐**） | 不要装 |
| `@mui/base` | **已迁出**，新地址 [base-ui.com](https://base-ui.com) | 不要装 |

> 关键认知：**`@mui/material` 内部使用 Emotion 作为样式引擎，但 `@emotion/react` 和 `@emotion/styled` 是 peer dependency 必须手动装**——这是 MUI 安装命令永远三个包的原因。

### 样式引擎选择

MUI 支持**三种样式引擎**，**99% 项目用默认 Emotion 即可**：

| 引擎 | 命令 | 适用 |
| --- | --- | --- |
| **Emotion**（默认） | `pnpm add @mui/material @emotion/react @emotion/styled` | 99% 项目 |
| **styled-components** | `pnpm add @mui/material @mui/styled-engine-sc styled-components` | 已有 styled-components 项目（**SSR 兼容性较差**） |
| **Pigment CSS**（实验） | `pnpm add @mui/material @pigment-css/react` | 极致首屏优化、Zero Runtime |

> 推荐：**新项目无脑选 Emotion**（MUI 默认 + SSR 完美 + 社区资料最多），有特殊需求再评估 Pigment CSS。

## 安装

### Emotion 默认引擎（推荐）

```bash
# pnpm（推荐）
pnpm add @mui/material @emotion/react @emotion/styled

# npm
npm install @mui/material @emotion/react @emotion/styled

# yarn
yarn add @mui/material @emotion/react @emotion/styled
```

### 推荐附加包

```bash
# Roboto 字体（本地化，不依赖 Google Fonts CDN）
pnpm add @fontsource/roboto

# Material 图标（2100+ 图标，按需 import Tree Shaking）
pnpm add @mui/icons-material
```

### React 版本要求

MUI v9 支持 **React 17 / 18 / 19**。但 MUI 内部使用 `react-is@19`，若你的项目使用 React 17 或 18，需安装匹配版本以避免 PropTypes 警告：

```bash
# React 18 项目
pnpm add react-is@18.3.1

# React 19 项目
pnpm add react-is@19
```

> 注意：CRA（Create React App）官方已停止维护、MUI 文档**不再推荐 CRA**，新项目请用 Vite 或 Next.js。

## 第一个组件

### 单文件最小示例

```tsx
import * as React from "react";
import Button from "@mui/material/Button";

export default function App() {
  return <Button variant="contained">Hello MUI</Button>;
}
```

仅此一行 `<Button variant="contained">` 已经能渲染出完整的 Material Design 按钮（带波纹动画、Elevation 阴影、focus 状态等）。

### `variant` 三大变体

```tsx
<Button variant="contained">Contained（默认填充，高强调）</Button>
<Button variant="outlined">Outlined（描边，中等强调）</Button>
<Button variant="text">Text（纯文本，低强调）</Button>
```

### `color` 主题色

```tsx
<Button variant="contained" color="primary">Primary</Button>
<Button variant="contained" color="secondary">Secondary</Button>
<Button variant="contained" color="success">Success</Button>
<Button variant="contained" color="error">Error</Button>
<Button variant="contained" color="warning">Warning</Button>
<Button variant="contained" color="info">Info</Button>
```

### `size` + `disabled` + `loading`

```tsx
<Button size="small">小</Button>
<Button size="medium">中（默认）</Button>
<Button size="large">大</Button>

<Button disabled>禁用</Button>
<Button loading>加载中（v6.4+ 内置）</Button>
```

### `startIcon` / `endIcon`

```tsx
import DeleteIcon from "@mui/icons-material/Delete";
import SendIcon from "@mui/icons-material/Send";

<Button variant="contained" startIcon={<DeleteIcon />} color="error">
  删除
</Button>
<Button variant="outlined" endIcon={<SendIcon />}>
  发送
</Button>
```

### `href` 渲染为链接

```tsx
<Button variant="contained" href="https://mui.com" target="_blank">
  访问 MUI
</Button>
```

### `component` prop 多态

```tsx
import { Link } from "react-router-dom";

// 渲染为 React Router 的 Link、保留 Button 样式
<Button component={Link} to="/dashboard" variant="contained">
  仪表盘
</Button>
```

## ThemeProvider 包根

虽然 MUI 组件**不强制需要 ThemeProvider** 也能渲染（用内置默认主题），但**生产项目必须用 ThemeProvider 包根**，否则：

1. 无法自定义颜色 / 字体 / 间距
2. 无法启用暗色模式
3. 无法启用 CSS Variables 模式

### 最小 ThemeProvider 例

```tsx
// src/App.tsx
import * as React from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Button from "@mui/material/Button";

// 创建主题对象
const theme = createTheme({
  palette: {
    primary: { main: "#1976d2" }, // Material Blue 700
    secondary: { main: "#9c27b0" }, // Material Purple 500
  },
});

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Button variant="contained">Hello Themed MUI</Button>
    </ThemeProvider>
  );
}
```

### `CssBaseline` 跨浏览器样式重置

`<CssBaseline />` 是 MUI 提供的 CSS Reset，**强烈推荐放在 ThemeProvider 内**：

- 重置 `box-sizing: border-box`
- 重置 `body` 字体（应用 Roboto）
- 重置 `body` 背景色（适配暗色模式）
- 重置链接 / 表格 / 表单等默认样式

> 与 Tailwind preflight 类似，但**专为 Material Design 优化**。

## Roboto 字体集成

MUI 默认字体是 **Roboto**（Google 出品、Material Design 标准字体）。但 MUI **不自动加载 Roboto**——必须手动接入，否则会 fallback 到 Times New Roman 风格的衬线字体。

### 方法一：`@fontsource/roboto`（推荐）

```bash
pnpm add @fontsource/roboto
```

在入口文件（`main.tsx` / `_app.tsx`）顶部 import：

```tsx
import "@fontsource/roboto/300.css"; // Light
import "@fontsource/roboto/400.css"; // Regular（默认）
import "@fontsource/roboto/500.css"; // Medium
import "@fontsource/roboto/700.css"; // Bold
```

### 方法二：Google Fonts CDN

在 HTML 入口文件 `index.html` `<head>` 添加：

```html
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap"
/>
```

> Vite / Next.js / Remix 都推荐**方法一**（本地化、不依赖外网）。中国大陆项目尤其建议本地化。

### 方法三：Next.js `next/font/google`

Next.js 13+ App Router 推荐用 `next/font/google` 优化字体加载：

```tsx
// src/app/layout.tsx
import { Roboto } from "next/font/google";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={roboto.variable}>
      <body>{children}</body>
    </html>
  );
}
```

然后在主题中引用 CSS 变量：

```tsx
const theme = createTheme({
  typography: {
    fontFamily: "var(--font-roboto)",
  },
});
```

## Material 图标接入

### 安装

```bash
pnpm add @mui/icons-material
```

### 按需 import（强烈推荐）

```tsx
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";

export default function IconDemo() {
  return (
    <div>
      <AddIcon />
      <DeleteIcon color="error" />
      <EditIcon fontSize="large" />
      <SaveIcon sx={{ color: "primary.main" }} />
    </div>
  );
}
```

> 不要写 `import { AddIcon } from '@mui/icons-material'`——全量 import 后 Tree Shaking 失效、bundle 直接 +500KB。

### 图标变体

每个图标有 5 个变体（后缀决定）：

| 后缀 | 变体 |
| --- | --- |
| 无 | **Filled**（实心，默认） |
| `Outlined` | 描边 |
| `Rounded` | 圆角 |
| `TwoTone` | 双色 |
| `Sharp` | 直角 |

```tsx
import Add from "@mui/icons-material/Add";              // Filled
import AddOutlined from "@mui/icons-material/AddOutlined";
import AddRounded from "@mui/icons-material/AddRounded";
import AddTwoTone from "@mui/icons-material/AddTwoTone";
import AddSharp from "@mui/icons-material/AddSharp";
```

### `<Icon>` 组件 + Material Symbols 字体

如果不想 npm 装包，也可以挂 Material Symbols 字体 + `<Icon>` 组件：

```html
<!-- index.html -->
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/icon?family=Material+Icons"
/>
```

```tsx
import Icon from "@mui/material/Icon";

<Icon>star</Icon>
<Icon color="primary">favorite</Icon>
```

> 不推荐：bundle 减少了但需要联网加载字体、且没有 Tree Shaking 优势。**默认按需 import `@mui/icons-material` 即可**。

## sx prop 入门

`sx` prop 是 MUI 独创的「样式即 props」API，**99% 一次性自定义场景都用 `sx`**。

### 基础用法

```tsx
<Box
  sx={{
    width: 300,           // 数字 → px
    height: 200,
    bgcolor: "primary.main", // 主题路径
    color: "white",
    p: 2,                 // padding: theme.spacing(2) = 16px
    m: 1,                 // margin
    borderRadius: 1,      // borderRadius: theme.shape.borderRadius
    boxShadow: 3,         // theme.shadows[3]
  }}
>
  Hello sx
</Box>
```

### spacing 缩写（最常用）

| 缩写 | CSS |
| --- | --- |
| `m` / `mt` / `mr` / `mb` / `ml` | `margin` / `marginTop` / ... |
| `mx` / `my` | `margin-inline` / `margin-block` |
| `p` / `pt` / `pr` / `pb` / `pl` | `padding` / ... |
| `px` / `py` | `padding-inline` / `padding-block` |

```tsx
<Box sx={{ p: 2, my: 4, mx: "auto" }} />
```

### 响应式值（数组语法）

```tsx
<Box
  sx={{
    // [xs, sm, md, lg, xl]
    width: [100, 200, 300, 400, 500],
    fontSize: { xs: 14, md: 18 },  // 对象语法
  }}
/>
```

### 主题回调

```tsx
<Box
  sx={(theme) => ({
    color: theme.palette.primary.main,
    border: `1px solid ${theme.palette.divider}`,
  })}
/>
```

### 伪选择器 + 嵌套

```tsx
<Button
  sx={{
    "&:hover": { bgcolor: "primary.dark" },
    "&.Mui-disabled": { opacity: 0.5 },
    "& .MuiButton-startIcon": { mr: 2 },
  }}
/>
```

## Vite 集成

### 创建 Vite + React + TS 项目

```bash
pnpm create vite my-mui-app --template react-ts
cd my-mui-app
pnpm install
pnpm add @mui/material @emotion/react @emotion/styled @mui/icons-material @fontsource/roboto
```

### `src/main.tsx`

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

// Roboto 字体
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

import App from "./App";

const theme = createTheme({
  palette: {
    primary: { main: "#1976d2" },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
```

### `src/App.tsx`

```tsx
import * as React from "react";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import AddIcon from "@mui/icons-material/Add";

export default function App() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Hello MUI + Vite
      </Typography>
      <Stack direction="row" spacing={2}>
        <Button variant="contained" startIcon={<AddIcon />}>
          新建
        </Button>
        <Button variant="outlined">取消</Button>
      </Stack>
    </Container>
  );
}
```

### Vite 配置无需调整

MUI 在 Vite 下**零配置即可工作**——没有 SSR 时不需要任何 Emotion / styled 相关配置。

```ts
// vite.config.ts（无需为 MUI 修改）
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
```

> 启动 `pnpm dev`、打开 `http://localhost:5173` 即可看到 Material Design 风格的页面。

## Next.js App Router 集成

Next.js 13+ App Router 与 MUI 的集成**比 Vite 复杂**——因为 MUI 默认 Emotion CSS-in-JS 需要在 SSR 流式渲染时正确收集样式，否则会 hydration mismatch。

### 安装

```bash
pnpm add @mui/material @emotion/react @emotion/styled @mui/icons-material
pnpm add @mui/material-nextjs
```

`@mui/material-nextjs` 是官方 Next.js 集成包，导出 `AppRouterCacheProvider` 处理 SSR Emotion 缓存。

### `src/theme.ts`

```ts
"use client";

import { createTheme } from "@mui/material/styles";
import { Roboto } from "next/font/google";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto",
});

const theme = createTheme({
  cssVariables: true, // 推荐启用 CSS Variables 模式
  typography: {
    fontFamily: roboto.style.fontFamily,
  },
  palette: {
    primary: { main: "#1976d2" },
  },
});

export default theme;
```

> `"use client"` 必须放第一行——`createTheme` 返回的 theme 对象**不可序列化**、不能从 RSC 传给客户端。

### `src/app/layout.tsx`

```tsx
import * as React from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "../theme";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
```

### `src/app/page.tsx`

```tsx
import * as React from "react";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";

export default function HomePage() {
  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h2">Next.js + MUI</Typography>
      <Button variant="contained">Hello</Button>
    </Container>
  );
}
```

### Pages Router 集成（旧版）

如果还在用 Pages Router，看[官方文档](https://mui.com/material-ui/integrations/nextjs/)——需要在 `_document.tsx` 中手动 `createEmotionCache` + `extractCriticalToChunks`。**新项目不要再用 Pages Router**。

## 暗色模式

MUI v9 的暗色模式方案是**业界最完善之一**——`colorSchemes` API 一行配置 + `useColorScheme()` Hook 用户控制 + `InitColorSchemeScript` SSR 反闪烁。

### 一行启用（系统跟随）

```ts
const theme = createTheme({
  colorSchemes: {
    dark: true, // 启用暗色模式
  },
});
```

默认行为：跟随系统 `prefers-color-scheme` 自动切换。

### 用户手动切换

```tsx
import { useColorScheme } from "@mui/material/styles";
import Button from "@mui/material/Button";

function ModeToggle() {
  const { mode, setMode } = useColorScheme();
  if (!mode) return null; // SSR 期间还未确定，返回 null 避免闪烁

  return (
    <Button
      onClick={() => setMode(mode === "light" ? "dark" : "light")}
    >
      切换到 {mode === "light" ? "暗色" : "浅色"}
    </Button>
  );
}
```

`mode` 的可能值：`"light"` / `"dark"` / `"system"`（跟随系统）。

### SSR 反闪烁（Next.js）

在 `<body>` 内最顶部放 `<InitColorSchemeScript>` 才能避免 SSR 渲染时的「白闪一下」：

```tsx
// src/app/layout.tsx
import { InitColorSchemeScript } from "@mui/material/InitColorSchemeScript";

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>
        <InitColorSchemeScript attribute="class" defaultMode="system" />
        <AppRouterCacheProvider>...</AppRouterCacheProvider>
      </body>
    </html>
  );
}
```

> 工作原理：在 React hydrate 之前内联一段 `<script>`、立即读取 localStorage 应用对应主题——所以页面**首屏就是正确主题色**。

### 自定义暗色 palette

```ts
const theme = createTheme({
  colorSchemes: {
    light: {
      palette: {
        primary: { main: "#1976d2" },
        background: { default: "#ffffff" },
      },
    },
    dark: {
      palette: {
        primary: { main: "#90caf9" },
        background: { default: "#0a1929" },
      },
    },
  },
});
```

### `theme.applyStyles` 模式

在自定义组件中针对不同 colorScheme 写不同样式：

```tsx
import { styled } from "@mui/material/styles";

const StyledBox = styled("div")(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  // 暗色模式追加样式
  ...theme.applyStyles("dark", {
    boxShadow: "0 0 10px rgba(255,255,255,0.1)",
  }),
}));
```

> `theme.applyStyles('dark', { ... })` 是 v6+ 推荐方式——比 `theme.palette.mode === 'dark'` 判断更适合 Pigment CSS / CSS Variables 模式。

## TypeScript 基础

MUI 的 TypeScript 集成**开箱即用**——所有组件 props、theme 对象、自定义 styled 组件都有完整类型。

### 组件 Props 类型

```tsx
import Button, { type ButtonProps } from "@mui/material/Button";

function MyButton(props: ButtonProps) {
  return <Button {...props} sx={{ borderRadius: 4 }} />;
}
```

### `Theme` 类型

```ts
import type { Theme } from "@mui/material/styles";

function getPrimaryColor(theme: Theme): string {
  return theme.palette.primary.main;
}
```

### `sx` prop 接受 `SxProps<Theme>`

```tsx
import type { SxProps, Theme } from "@mui/material";

const sharedSx: SxProps<Theme> = {
  p: 2,
  bgcolor: "background.paper",
  borderRadius: 1,
};

<Box sx={sharedSx}>...</Box>
```

### 自定义 styled 组件泛型

```tsx
import { styled } from "@mui/material/styles";

interface MyBoxProps {
  active?: boolean;
}

const MyBox = styled("div")<MyBoxProps>(({ theme, active }) => ({
  padding: theme.spacing(2),
  bgcolor: active ? theme.palette.primary.main : theme.palette.background.paper,
}));

<MyBox active>Active</MyBox>;
```

### Module Augmentation 扩展主题

详细见 [指南 - TypeScript Module Augmentation](./guide-line.md)。简单预览：

```ts
// src/types/mui.d.ts
import "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Palette {
    brand: Palette["primary"];
  }
  interface PaletteOptions {
    brand?: PaletteOptions["primary"];
  }
}
```

之后即可 `color="brand"` 用自定义颜色，IDE 完整提示。

## Box 容器组件

`Box` 是 MUI 提供的**通用 div 替代品**——接受 `sx` prop 实现任意样式定制，是 MUI 项目中**最常用的容器组件**。

```tsx
import Box from "@mui/material/Box";

<Box
  sx={{
    display: "flex",
    flexDirection: "column",
    gap: 2,
    p: 3,
    bgcolor: "background.paper",
    border: 1,
    borderColor: "divider",
    borderRadius: 1,
  }}
>
  <Typography variant="h6">标题</Typography>
  <Typography>内容</Typography>
</Box>;
```

### `component` prop 多态

```tsx
<Box component="section">渲染为 section 标签</Box>
<Box component="header">渲染为 header 标签</Box>
<Box component="aside">渲染为 aside 标签</Box>
```

## Container 限宽容器

`Container` 用于**限制内容最大宽度并居中**——典型 Web 排版的「内容容器」。

```tsx
import Container from "@mui/material/Container";

<Container maxWidth="xs">极小（444px）</Container>
<Container maxWidth="sm">小（600px）</Container>
<Container maxWidth="md">中（900px）</Container>
<Container maxWidth="lg">大（1200px）</Container>
<Container maxWidth="xl">极大（1536px）</Container>
<Container maxWidth={false}>无限宽（占满 viewport）</Container>
```

## Stack 一维布局

`Stack` 是 Flex 容器的语义封装——一行管 `direction` + `spacing` + `divider`：

```tsx
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";

// 水平排列
<Stack direction="row" spacing={2}>
  <Button>1</Button>
  <Button>2</Button>
  <Button>3</Button>
</Stack>

// 垂直排列 + 分隔线
<Stack
  direction="column"
  spacing={2}
  divider={<Divider orientation="horizontal" flexItem />}
>
  <Box>Item A</Box>
  <Box>Item B</Box>
</Stack>

// 响应式方向
<Stack direction={{ xs: "column", md: "row" }} spacing={2}>
  ...
</Stack>
```

## Typography 排版

```tsx
import Typography from "@mui/material/Typography";

<Typography variant="h1">H1 标题</Typography>
<Typography variant="h2">H2 标题</Typography>
<Typography variant="h3">H3 标题</Typography>
<Typography variant="h4">H4 标题</Typography>
<Typography variant="h5">H5 标题</Typography>
<Typography variant="h6">H6 标题</Typography>
<Typography variant="subtitle1">副标题 1</Typography>
<Typography variant="subtitle2">副标题 2</Typography>
<Typography variant="body1">正文 1（默认）</Typography>
<Typography variant="body2">正文 2</Typography>
<Typography variant="button">按钮文字</Typography>
<Typography variant="caption">辅助说明</Typography>
<Typography variant="overline">OVERLINE</Typography>
```

### `component` prop 控制语义化标签

```tsx
// 视觉上是 h3 样式、但 DOM 上渲染为 h1（SEO 友好）
<Typography variant="h3" component="h1">
  实际是 h1
</Typography>

// 视觉上是 body1、但渲染为 p
<Typography variant="body1" component="p">
  段落
</Typography>
```

### 截断 + 颜色

```tsx
<Typography
  variant="body1"
  color="primary"        // 主题色路径
  noWrap                 // 单行截断（...）
  gutterBottom           // 底部添加 margin-bottom
>
  超长文本超长文本超长文本超长文本
</Typography>
```

## TextField 表单输入

```tsx
import TextField from "@mui/material/TextField";
import { useState } from "react";

export default function FormDemo() {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  return (
    <Stack spacing={2} sx={{ maxWidth: 400 }}>
      <TextField
        label="姓名"
        variant="outlined"
        value={name}
        onChange={(e) => setName(e.target.value)}
        helperText="必填"
        required
        fullWidth
      />

      <TextField
        label="邮箱"
        variant="filled"
        error={!!error}
        helperText={error || "我们不会泄露你的邮箱"}
        type="email"
      />

      <TextField
        label="备注"
        variant="standard"
        multiline
        rows={4}
      />
    </Stack>
  );
}
```

### 三大变体

- `variant="outlined"` —— 描边（默认推荐）
- `variant="filled"` —— 填充
- `variant="standard"` —— 下划线（Material 老式）

## 与 React Router 集成

```tsx
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Button from "@mui/material/Button";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";

function App() {
  return (
    <BrowserRouter>
      <AppBar position="static">
        <Toolbar>
          {/* Button 多态为 RouterLink */}
          <Button component={Link} to="/" color="inherit">
            首页
          </Button>
          <Button component={Link} to="/about" color="inherit">
            关于
          </Button>
        </Toolbar>
      </AppBar>

      <Routes>
        <Route path="/" element={<div>首页</div>} />
        <Route path="/about" element={<div>关于</div>} />
      </Routes>
    </BrowserRouter>
  );
}
```

## 与 Zustand 集成（状态管理）

MUI 不内置状态管理（不像 Element Plus 的 ElMessage / ElNotification 静态 API）—— 需要配合 Zustand / Redux / Jotai 等：

```tsx
// store.ts
import { create } from "zustand";

interface SnackbarState {
  open: boolean;
  message: string;
  show: (msg: string) => void;
  hide: () => void;
}

export const useSnackbar = create<SnackbarState>((set) => ({
  open: false,
  message: "",
  show: (message) => set({ open: true, message }),
  hide: () => set({ open: false }),
}));
```

```tsx
// GlobalSnackbar.tsx
import Snackbar from "@mui/material/Snackbar";
import { useSnackbar } from "./store";

export default function GlobalSnackbar() {
  const { open, message, hide } = useSnackbar();
  return (
    <Snackbar
      open={open}
      autoHideDuration={3000}
      onClose={hide}
      message={message}
    />
  );
}
```

```tsx
// AnyComponent.tsx - 全局调用
import { useSnackbar } from "./store";

function MyForm() {
  const show = useSnackbar((s) => s.show);
  return <Button onClick={() => show("保存成功")}>保存</Button>;
}
```

## 完整示例：登录表单

把上面的概念组合成一个完整登录页：

```tsx
import * as React from "react";
import { useState } from "react";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 模拟登录请求
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (email !== "admin@example.com") {
        throw new Error("用户名或密码错误");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "登录失败";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          p: 4,
          border: 1,
          borderColor: "divider",
          borderRadius: 2,
        }}
      >
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          登录
        </Typography>

        {error && <Alert severity="error">{error}</Alert>}

        <TextField
          label="邮箱"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
          autoFocus
        />

        <TextField
          label="密码"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
        />

        <Button
          type="submit"
          variant="contained"
          loading={loading}
          fullWidth
          size="large"
        >
          登录
        </Button>
      </Box>
    </Container>
  );
}
```

## 常见踩坑

### 1. Roboto 字体不加载（最高频）

**症状**：默认看到 Times New Roman 衬线字体而非 Roboto。

**原因**：MUI 不自动加载 Roboto。

**解决**：

```bash
pnpm add @fontsource/roboto
```

```ts
// main.tsx / _app.tsx
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
```

### 2. 全量 import 图标导致 bundle 飙升

**错误**：

```ts
import { AddIcon, EditIcon } from "@mui/icons-material"; // 错误！
```

全量 import 后 Tree Shaking 失效、bundle +500KB。

**正确**：

```ts
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
```

### 3. CSS-in-JS 与 Tailwind 优先级冲突

**症状**：Tailwind class 写了 `text-red-500` 但 MUI 内联样式 override 了。

**原因**：默认 Emotion 注入 style 标签在 head 底部，**优先级高于 Tailwind CSS**。

**解决**（v7 + CSS Layers，**最佳**）：

```ts
const theme = createTheme({
  cssVariables: true,
  // v7+ 默认启用 CSS Layers，无需额外配置
});
```

或在 Vite 配置：

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  css: {
    transformer: "lightningcss", // 启用 CSS Layers 支持
  },
});
```

或老式方案（v6 及更早）：

```tsx
import { StyledEngineProvider } from "@mui/material/styles";

<StyledEngineProvider injectFirst>
  <ThemeProvider theme={theme}>
    <App />
  </ThemeProvider>
</StyledEngineProvider>;
```

### 4. SSR Hydration Mismatch

**症状**：Next.js / Remix 报 `Hydration failed because the initial UI does not match`。

**原因**：服务端渲染的 Emotion class 与客户端不一致。

**解决**：Next.js App Router 必须用 `@mui/material-nextjs`：

```tsx
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";

<AppRouterCacheProvider>
  <ThemeProvider theme={theme}>...</ThemeProvider>
</AppRouterCacheProvider>;
```

### 5. `useTheme()` 在 ThemeProvider 外调用报错

**错误**：

```tsx
function App() {
  const theme = useTheme(); // ❌ 还没进 ThemeProvider 内
  return <ThemeProvider theme={...}>...</ThemeProvider>;
}
```

**解决**：确保**所有调用 `useTheme()` 的组件**都在 `<ThemeProvider>` 内部。把组件抽出来：

```tsx
function AppContent() {
  const theme = useTheme(); // ✅ 在 ThemeProvider 内
  return <Box sx={{ color: theme.palette.primary.main }}>...</Box>;
}

function App() {
  return (
    <ThemeProvider theme={...}>
      <AppContent />
    </ThemeProvider>
  );
}
```

### 6. Grid v1 → v2 迁移

v7+ 默认 `Grid` 即 v2，API 完全变化：

```tsx
// ❌ v1（v7 已废弃，重命名为 GridLegacy）
<Grid container spacing={2}>
  <Grid item xs={12} md={6}>左</Grid>
  <Grid item xs={12} md={6}>右</Grid>
</Grid>

// ✅ v2（新 API）
<Grid container spacing={2}>
  <Grid size={{ xs: 12, md: 6 }}>左</Grid>
  <Grid size={{ xs: 12, md: 6 }}>右</Grid>
</Grid>
```

旧项目升级时把 `<Grid item xs={6}>` 替换为 `<Grid size={6}>`、`<Grid item xs={12} md={6}>` 替换为 <span v-pre>`<Grid size={{ xs: 12, md: 6 }}>`</span>。

### 7. `cssVariables: true` 与某些 styled 调用冲突

**症状**：开启 `cssVariables: true` 后某些自定义 styled 组件颜色失效。

**原因**：旧的 `theme.palette.primary.main` 引用变成 CSS Variable `var(--mui-palette-primary-main)`，部分 JS 表达式无法直接使用。

**解决**：用 `theme.vars` 访问 CSS Variable 形式：

```tsx
// ❌ 不推荐（仍可工作但失去 SSR 一致性优势）
const StyledBox = styled("div")(({ theme }) => ({
  color: theme.palette.primary.main,
}));

// ✅ 推荐
const StyledBox = styled("div")(({ theme }) => ({
  color: theme.vars.palette.primary.main, // 输出 var(--mui-palette-primary-main)
}));
```

### 8. Pigment CSS 不要急于迁移

**症状**：尝试启用 Pigment CSS 后某些动态主题 / 动态 styled 调用报错。

**原因**：Pigment CSS Zero Runtime **不支持动态 theme 切换**和**复杂的 styled 回调**。

**解决**：**生产项目暂时不要迁移 Pigment CSS**——继续用 Emotion + `cssVariables: true` 即可。Pigment CSS 等 MUI v10 / v11 成熟后再考虑。

## 下一步

入门到此结束，接下来：

- **[指南](./guide-line.md)** —— 80+ 组件分类、`sx` prop 完整 API、`styled()` 深度、Theme 完整选项、Form 表单（React Hook Form 集成）、MUI X Data Grid / Date Pickers、TypeScript Module Augmentation、Next.js 完整集成、常见踩坑深度
- **[参考](./reference.md)** —— API 速查、组件清单、Theme 选项树、`sx` 缩写表
