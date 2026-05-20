---
layout: doc
outline: [2, 3]
---

# shadcn/ui 入门

本文以 **React 19 / TypeScript 5+ / Tailwind CSS v4 / pnpm / shadcn@4.7.x（2026 年 5 月稳定版）** 为基线，展示从「**零项目**」到「**Button / Dialog / Sheet / 暗色模式**」的完整入门路径——你将理解 shadcn 的「**拷贝代码到本地**」哲学、CLI 工作流、`cn()` utility、Tailwind v4 配套、`next-themes` 暗色模式。

> shadcn/ui **不是 npm UI 库**——一定先阅读 [index 页](./index.md) 理解「**Copy-Paste 哲学**」与「**Distribution Platform**」两个核心概念，否则会困惑「为什么不能 `import { Button } from "@shadcn/ui"`」。

## 0. 环境与前置要求

- **Node.js** ≥ 20（**推荐 22 LTS**）
- **包管理器**：**pnpm**（推荐）/ npm / yarn / bun 任意
- **React** ≥ 18（**强烈推荐 19**）
- **TypeScript** ≥ 5.0（**可选 JS**：components.json 设 `tsx: false`）
- **框架**：**Next.js 15+ App Router**（首选）/ **Vite 7+ + React** / **TanStack Start** / **Remix** / **Astro 5+** / **Laravel 12 + Inertia**
- **浏览器**：Chrome 111+ / Safari 15.4+ / Firefox 113+（**OKLCH 颜色需要**）

> shadcn **强绑定 Tailwind CSS v4**——本文示例默认假设你**用 Tailwind**。**v3 项目也能用 shadcn 但推荐升级到 v4**。

## 1. 三种使用形态概览

shadcn 在实际项目中通常按以下三条路径之一引入，**选哪条取决于你的项目状态**：

### 路径 A：全新 Next.js 项目（90% 场景）

```bash
# 一行命令创建 Next.js 项目 + 集成 shadcn
pnpm dlx shadcn@latest init -t next

cd my-app
pnpm dlx shadcn@latest add button
pnpm dev
```

CLI 帮你做了：

1. `create-next-app` 创建 Next.js + TypeScript + Tailwind v4
2. 配置 `components.json`、`tsconfig.json`、`tailwind` CSS 变量
3. 生成 `src/lib/utils.ts` 内置 `cn()` utility
4. 拷贝 `src/components/ui/button.tsx` 到你的代码库

### 路径 B：已有项目集成（Vite / Remix / Astro / 现有 Next.js）

```bash
# 进入已有项目
cd existing-app

# 确保已有 Tailwind CSS v4
pnpm add tailwindcss @tailwindcss/vite

# 初始化 shadcn（CLI 自动识别框架）
pnpm dlx shadcn@latest init

# 选风格 / 颜色 / 是否用 CSS 变量
pnpm dlx shadcn@latest add button
```

### 路径 C：完全手动配置

适合**对自动化不放心 / 完全掌控所有文件**。**详见后文 §10**。

> **本入门指南聚焦路径 A（Next.js）和路径 B（Vite）**，因为它们是 99% 的实际场景。

## 2. 路径 A：Next.js 完整入门

### 2.1 创建新项目

```bash
# 选项 1：用 shadcn CLI 一键创建
pnpm dlx shadcn@latest init -t next

# 系统会问几个问题：
# - Project name: my-app
# - TypeScript? Yes
# - ESLint? Yes
# - Tailwind CSS? Yes (强制)
# - src/ directory? Yes (推荐)
# - App Router? Yes (强制)
# - Customize default import alias? @/* (默认)
```

CLI 完成后，目录结构：

```text
my-app/
├── src/
│   ├── app/
│   │   ├── globals.css           # Tailwind v4 + shadcn CSS 变量
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   └── ui/                   # 拷贝的 shadcn 组件源码
│   └── lib/
│       └── utils.ts              # cn() 工具
├── components.json               # shadcn 配置
├── tailwind.config.ts            # Tailwind 配置（v4 可省略）
├── tsconfig.json
└── package.json
```

### 2.2 components.json 解读

打开 `components.json`：

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

| 字段 | 含义 |
|------|------|
| `style` | 视觉风格：**`new-york`**（推荐，紧凑）/ `default`（早期默认）/ `sera`（v2026 新增，serif） |
| `rsc` | 是否注入 `"use client"`（Next.js App Router 必开） |
| `tsx` | TypeScript（`.tsx`）vs JavaScript（`.jsx`） |
| `tailwind.cssVariables` | **true**：用 CSS 变量；**false**：直接写 Tailwind 类（如 `bg-zinc-950`） |
| `tailwind.baseColor` | **8 选 1**：`neutral` / `stone` / `zinc` / `mauve` / `olive` / `mist` / `taupe` / `slate` |
| `aliases.ui` | shadcn 组件拷贝目标目录 |
| `iconLibrary` | 图标库：`lucide` / `radix` / `tabler` |

> **`style` / `baseColor` / `cssVariables` 初始化后不可改**——选错只能删 `components.json` 重新 init。

### 2.3 拷贝第一个组件 Button

```bash
pnpm dlx shadcn@latest add button
```

CLI 工作流：

1. 分析 Button 依赖：需要 `class-variance-authority` / `clsx` / `tailwind-merge` / `lucide-react`
2. 自动 `pnpm add` 缺少的 npm 包
3. 拷贝 `src/components/ui/button.tsx` 到你的项目
4. 提示完成

打开 `src/components/ui/button.tsx`，你会看到完整源码（约 60 行）——**这是你的代码，可以随意修改**：

```tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Button 组件 variant 声明
 * - 用 cva 把多个 className 组合成 variant + size 的二维矩阵
 * - data-slot="button" 用于 Tailwind 后代选择器（如 [&_svg]:size-4）
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive: "bg-destructive text-white shadow-xs hover:bg-destructive/90",
        outline: "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3",
        lg: "h-10 px-6",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  // asChild 启用时用 Radix Slot 把 className 合并到子元素而非渲染额外 <button>
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
```

### 2.4 使用 Button

`src/app/page.tsx`：

```tsx
import { Button } from "@/components/ui/button";
import { Mail, Loader2 } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-8">
      {/* 默认按钮 */}
      <Button>登录</Button>

      {/* 5 种 variant */}
      <div className="flex gap-2">
        <Button variant="default">主要</Button>
        <Button variant="destructive">删除</Button>
        <Button variant="outline">次要</Button>
        <Button variant="secondary">禁用次要</Button>
        <Button variant="ghost">幽灵</Button>
        <Button variant="link">链接</Button>
      </div>

      {/* 4 种 size */}
      <div className="flex items-center gap-2">
        <Button size="sm">小</Button>
        <Button size="default">默认</Button>
        <Button size="lg">大</Button>
        <Button size="icon">
          <Mail />
        </Button>
      </div>

      {/* 带图标 */}
      <Button>
        <Mail /> 发邮件
      </Button>

      {/* Loading 状态 */}
      <Button disabled>
        <Loader2 className="animate-spin" />
        正在提交...
      </Button>

      {/* asChild：把 Button 样式注入到 <a> */}
      <Button asChild>
        <a href="https://ui.shadcn.com">访问官网</a>
      </Button>
    </div>
  );
}
```

### 2.5 启动开发服务器

```bash
pnpm dev
# http://localhost:3000
```

你将看到一个 Tailwind 风格的页面，**所有按钮 a11y 完美 + 键盘可达 + 视觉一致**——但所有源码**100% 在你的项目里**。

## 3. 关键概念深度

### 3.1 「Copy-Paste 哲学」是 shadcn 的灵魂

**`pnpm dlx shadcn@latest add button` 不是装包**——它**只把源码文件从 shadcn registry 拷贝到你的项目**，然后**断开关系**。

```bash
# 拷贝 Button
pnpm dlx shadcn@latest add button

# 现在你可以：
# 1. 编辑 src/components/ui/button.tsx
# 2. 删除 src/components/ui/button.tsx
# 3. 重命名 src/components/ui/button.tsx
# 4. 合并多个组件到一个文件
# 5. 完全删除 shadcn CLI 也不影响 Button 工作
```

**vs MUI / Mantine / Ant Design**：

```bash
# MUI 装包后无法编辑 node_modules/@mui 里的源码
import { Button } from "@mui/material"; // 只能用 theme 间接定制
```

> **「代码所有权完全在你手里」是 shadcn 区别于所有传统 UI 库的根本差异**。

### 3.2 `cn()` utility

`src/lib/utils.ts`：

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn 函数：智能合并 Tailwind 类
 * - clsx 处理条件类 + 数组 + 对象
 * - tailwind-merge 解决 Tailwind 类冲突（后者覆盖前者）
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**`cn` 的两个核心能力**：

```ts
// 1. 条件类
cn("px-2", isActive && "bg-blue-500", { "text-white": isActive });

// 2. Tailwind 冲突自动解决（后者覆盖前者）
cn("px-2", "px-4"); // → "px-4"
cn("text-red-500", "text-blue-500"); // → "text-blue-500"
cn("bg-white", isDark && "bg-black"); // 条件覆盖
```

**vs 单用 `clsx`**：

```ts
clsx("px-2", "px-4"); // → "px-2 px-4"（两个都保留、CSS 后者胜出但产物冗余）
```

**vs 单用 `tailwind-merge`**：

```ts
twMerge("px-2", isActive && "px-4"); // 不支持条件类
```

> **`cn()` 是 shadcn 项目几乎每个组件都会用的核心 utility**。

### 3.3 `cva` Variant 系统

[class-variance-authority](https://cva.style) 把**多个 className 组合**抽象成 **variant + size 的二维矩阵**：

```ts
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  // 基础类（所有 variant 共享）
  "inline-flex items-center justify-center rounded-md font-medium",
  {
    // 变体
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        outline: "border bg-background",
        ghost: "hover:bg-accent",
      },
      size: {
        default: "h-9 px-4",
        sm: "h-8 px-3",
        lg: "h-10 px-6",
      },
    },
    // 默认 variant
    defaultVariants: {
      variant: "default",
      size: "default",
    },
    // 复合 variant（多变体组合时的额外样式）
    compoundVariants: [
      {
        variant: "outline",
        size: "sm",
        className: "border-dashed", // 特定组合时叠加
      },
    ],
  },
);

// 使用
buttonVariants(); // 默认 variant + 默认 size
buttonVariants({ variant: "outline" }); // 指定 variant
buttonVariants({ variant: "outline", size: "lg" });

// TypeScript 类型推导
type ButtonVariantProps = VariantProps<typeof buttonVariants>;
// type ButtonVariantProps = {
//   variant?: "default" | "outline" | "ghost";
//   size?: "default" | "sm" | "lg";
// }
```

> `cva` 是 shadcn / Radix / Catalyst 等现代 Tailwind UI 库**共同选择**——**类型安全 + 默认值 + 复合规则**全部内置。

### 3.4 `asChild` Slot 模式

shadcn Button / DialogTrigger 等都支持 `asChild` prop（来自 Radix Primitives）——**把 className + onClick 等注入到子元素而非额外渲染一层**：

```tsx
// 不用 asChild：渲染 <button>
<Button>普通按钮</Button>

// 用 asChild：把 Button 样式注入到 <a>
<Button asChild>
  <a href="/about">关于我们</a>
</Button>

// 实际 DOM：
// <a href="/about" class="inline-flex items-center ...">关于我们</a>
```

**与 Next.js Link 组合**：

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

<Button asChild>
  <Link href="/products">商品列表</Link>
</Button>;
```

> **`asChild` 要求子元素接受并展开所有 props + 必须用 `React.forwardRef` 转发 ref**。Next.js Link / React Router Link 默认满足。

### 3.5 lucide-react 图标

shadcn 默认用 [lucide-react](https://lucide.dev)（**1500+ 图标**）：

```tsx
import { Mail, Send, Loader2, ChevronDown } from "lucide-react";

<Mail className="size-4" />
<Send className="size-5 text-blue-500" />
<Loader2 className="size-4 animate-spin" />
```

**Button 内置规则**（来自 buttonVariants 的基础类）：

```text
[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0
```

这段 Tailwind 等于：「**Button 内所有未显式指定 size 的 svg 自动 16px**」。

## 4. Tailwind v4 + CSS 变量主题

打开 `src/app/globals.css`：

```css
@import "tailwindcss";
@import "tw-animate-css";

/* @custom-variant 启用 .dark 类切换 */
@custom-variant dark (&:is(.dark *));

/* 浅色主题 CSS 变量（OKLCH 色空间） */
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --radius: 0.625rem;
}

/* 暗色主题 */
.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --primary: oklch(0.985 0 0);
  --primary-foreground: oklch(0.205 0 0);
  /* ...其他变量都有对应暗色版 */
}

/* @theme inline：把 CSS 变量桥接到 Tailwind utility */
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

/* 全局 body 应用主题色 */
body {
  background-color: var(--background);
  color: var(--foreground);
}
```

**关键点**：

1. **OKLCH 色空间**——感知更均匀、比 HSL 更现代（需 Chrome 111+ / Safari 15.4+）
2. **`@theme inline { --color-primary: var(--primary); }`**——Tailwind v4 的 **CSS 变量桥接**：让 `bg-primary` 这个 Tailwind 类自动读取 `--primary` CSS 变量
3. **`.dark` 类切换**——`document.documentElement.classList.add("dark")` 即可整站换主题
4. **`@import "tw-animate-css"`**——shadcn v2025+ 用 `tw-animate-css` 替代旧 `tailwindcss-animate`

## 5. 暗色模式（next-themes）

### 5.1 安装 next-themes

```bash
pnpm add next-themes
```

### 5.2 创建 ThemeProvider

`src/components/theme-provider.tsx`：

```tsx
"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * 主题提供器
 * - 包装 next-themes 的 ThemeProvider
 * - 默认 attribute="class"，配合 .dark 类切换
 * - storageKey 持久化用户选择
 */
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

### 5.3 集成到 layout.tsx

`src/app/layout.tsx`：

```tsx
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning 必须，避免 next-themes 切换主题时的 hydration 警告
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

| ThemeProvider Prop | 默认值 | 说明 |
|------|------|------|
| `attribute` | `class` | 把主题写入 `<html class="dark">`（也可用 `data-theme`） |
| `defaultTheme` | `system` | 初始主题：`light` / `dark` / `system` |
| `enableSystem` | `false` | 监听 `prefers-color-scheme` |
| `disableTransitionOnChange` | `false` | 切换时禁用所有 transition（避免闪烁） |
| `storageKey` | `theme` | localStorage 键名 |

### 5.4 ModeToggle 组件

先拷贝 DropdownMenu：

```bash
pnpm dlx shadcn@latest add dropdown-menu
```

`src/components/mode-toggle.tsx`：

```tsx
"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * 主题切换下拉菜单
 * - 三选项：浅色 / 深色 / 跟随系统
 * - Sun / Moon 图标根据当前主题旋转
 */
export function ModeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          {/* 浅色主题：太阳显示、月亮隐藏 */}
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          {/* 暗色主题：月亮显示、太阳隐藏 */}
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">切换主题</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          浅色
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          深色
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          跟随系统
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

在页面里用：

```tsx
import { ModeToggle } from "@/components/mode-toggle";

export default function Home() {
  return (
    <main className="p-8">
      <ModeToggle />
      {/* 其他内容 */}
    </main>
  );
}
```

> **常见 Hydration 闪烁**：`next-themes` 默认在 client 端读取 localStorage，**SSR 期间无法知道用户主题** —— `<html suppressHydrationWarning>` + `disableTransitionOnChange` 缓解，**但仍可能首屏闪一下**。详见 [指南](./guide-line.md) 「常见踩坑」章节。

## 6. 第一个 Dialog

```bash
pnpm dlx shadcn@latest add dialog
```

`src/components/login-dialog.tsx`：

```tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * 登录对话框
 * - DialogTrigger 任意子元素都可触发
 * - DialogContent 默认 Portal 到 body
 * - DialogTitle 必须（a11y）
 * - DialogDescription 必须（a11y）
 * - Esc 关闭 / 点击外部关闭 / 焦点陷阱内循环
 */
export function LoginDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>登录</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>登录账号</DialogTitle>
          <DialogDescription>
            请输入您的邮箱与密码登录系统。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="email">邮箱</Label>
            <Input id="email" type="email" placeholder="you@example.com" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">密码</Label>
            <Input id="password" type="password" />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">取消</Button>
          </DialogClose>
          <Button type="submit">登录</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

需要的依赖：

```bash
pnpm dlx shadcn@latest add input label
```

**Dialog Anatomy**：

```text
<Dialog>                       — 状态容器
  <DialogTrigger asChild>      — 触发器（任意子元素）
  <DialogContent>              — 内容容器（默认 Portal）
    <DialogHeader>             — 顶部
      <DialogTitle>            — a11y 标题（必须）
      <DialogDescription>      — a11y 描述（必须）
    </DialogHeader>
    <div>正文</div>
    <DialogFooter>             — 底部按钮区
      <DialogClose asChild>    — 关闭按钮
    </DialogFooter>
  </DialogContent>
</Dialog>
```

> **Dialog 底层就是 [Radix Dialog](https://www.radix-ui.com/primitives/docs/components/dialog)**——所有 a11y 行为（焦点陷阱 / Esc 关闭 / body 滚动锁 / aria-modal）都来自 Radix。

## 7. 第一个 Sheet（4 方向侧边栏）

```bash
pnpm dlx shadcn@latest add sheet
```

`src/components/mobile-nav.tsx`：

```tsx
"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/**
 * 移动端导航抽屉
 * - side="left" 从左侧滑入
 * - 适合替代移动端汉堡菜单
 */
export function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="md:hidden">
          <Menu />
          <span className="sr-only">打开菜单</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle>导航</SheetTitle>
          <SheetDescription>选择您想访问的页面</SheetDescription>
        </SheetHeader>
        <nav className="mt-6 flex flex-col gap-2">
          <a href="/" className="hover:bg-accent rounded px-3 py-2">
            首页
          </a>
          <a href="/products" className="hover:bg-accent rounded px-3 py-2">
            商品
          </a>
          <a href="/about" className="hover:bg-accent rounded px-3 py-2">
            关于
          </a>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
```

`side` 4 个值：

| 值 | 效果 |
|----|------|
| `top` | 从顶部滑下（通知栏风格） |
| `right` | 从右滑入（购物车 / 详情面板） |
| `bottom` | 从底部弹起（移动端常用） |
| `left` | 从左滑入（侧边栏导航） |

## 8. 路径 B：Vite + React 完整入门

### 8.1 创建 Vite 项目

```bash
# 创建 Vite React TS 项目
pnpm create vite@latest my-app -- --template react-ts
cd my-app
pnpm install
```

### 8.2 安装 Tailwind CSS v4

```bash
pnpm add tailwindcss @tailwindcss/vite
```

`src/index.css`：

```css
@import "tailwindcss";
```

### 8.3 配置 vite.config.ts

```bash
pnpm add -D @types/node
```

`vite.config.ts`：

```ts
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // @/ 指向 src/，shadcn CLI 必需
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

### 8.4 配置 tsconfig.json + tsconfig.app.json

`tsconfig.json`（根）：

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

`tsconfig.app.json` 也加同样的 paths：

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 8.5 初始化 shadcn

```bash
pnpm dlx shadcn@latest init

# 系统会问：
# Which color would you like to use as the base color? › Neutral
```

完成后会生成：

- `components.json`
- `src/lib/utils.ts`（含 `cn()`）
- `src/index.css` 更新（含 Tailwind + CSS 变量）

### 8.6 添加第一个组件

```bash
pnpm dlx shadcn@latest add button
```

`src/App.tsx`：

```tsx
import { Button } from "@/components/ui/button";

function App() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center">
      <Button>点击我</Button>
    </div>
  );
}

export default App;
```

```bash
pnpm dev
```

打开 http://localhost:5173 即可看到 Button。

## 9. 其他框架快速链接

| 框架 | CLI 命令 |
|------|---------|
| **Next.js** | `pnpm dlx shadcn@latest init -t next` |
| **Vite** | `pnpm create vite@latest` → `pnpm dlx shadcn@latest init` |
| **TanStack Start** | `pnpm dlx shadcn@latest init -t start` |
| **React Router v7** | `pnpm dlx shadcn@latest init -t react-router` |
| **Astro** | `pnpm dlx shadcn@latest init -t astro` |
| **Laravel + Inertia** | `pnpm dlx shadcn@latest init -t laravel`（需先 `laravel new`） |
| **Monorepo (Turborepo)** | `pnpm dlx shadcn@latest init --monorepo` |

详见各框架对应官方文档：

- [Next.js 安装](https://ui.shadcn.com/docs/installation/next)
- [Vite 安装](https://ui.shadcn.com/docs/installation/vite)
- [TanStack Start 安装](https://ui.shadcn.com/docs/installation/tanstack)
- [Astro 安装](https://ui.shadcn.com/docs/installation/astro)
- [React Router 安装](https://ui.shadcn.com/docs/installation/react-router)
- [Laravel 安装](https://ui.shadcn.com/docs/installation/laravel)
- [Manual Setup](https://ui.shadcn.com/docs/installation/manual)

## 10. 路径 C：手动配置（不推荐但完整可控）

### 10.1 安装依赖

```bash
pnpm add class-variance-authority clsx tailwind-merge lucide-react tw-animate-css
pnpm add -D @radix-ui/react-slot
```

### 10.2 创建 components.json

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

### 10.3 创建 lib/utils.ts

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### 10.4 配置 globals.css

按前文 §4 的 CSS 模板复制到 `src/index.css`。

### 10.5 直接从官方文档拷贝组件代码

打开 https://ui.shadcn.com/docs/components/button 的 「Manual」标签，复制 button.tsx 到 `src/components/ui/button.tsx`。

> **手动配置只在「公司网络不允许 npm dlx」等特殊场景下使用**。99% 项目用自动 CLI。

## 11. 与 Radix UI / Headless UI 的关系

### 11.1 与 Radix Primitives

**shadcn = Radix Primitives + Tailwind + 拷贝源码**：

```tsx
// shadcn 拷贝来的 dialog.tsx（简化版）
"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

// 直接 re-export Radix 的 Root
const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;

// 用 Tailwind 包装 Radix Content
function DialogContent({ className, children, ...props }: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80" />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg",
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
```

**所以会 Radix Primitives = 半个 shadcn 已经会了**。

### 11.2 与 Headless UI

**Headless UI** 是 Tailwind 团队的 headless 库（仅 16 个组件）——shadcn **不基于 Headless UI**，而是基于 Radix Primitives（30+ 组件、a11y 更扎实）。**Headless UI 适合不需要 30+ 组件的简单项目**，**shadcn 适合完整业务场景**。

### 11.3 与 Mantine / MUI / Ant Design

**完全不同的思路**：

| 维度 | shadcn | Mantine / MUI / Ant Design |
|------|--------|--------------------------|
| 安装方式 | CLI 拷贝源码 | `npm install` 装包 |
| 代码所有权 | 在你的项目里 | 在 node_modules 里 |
| 定制方式 | 直接改源码 | theme / sx / styles API |
| 业务组件 | 不全（缺 Pro 组件） | 齐全 |
| 学习曲线 | 中（需要会 Tailwind + Radix） | 低（装包即用） |
| AI 友好度 | 极高（MCP Server + 代码可见） | 中（黑盒抽象） |

> **shadcn 是给「会 Tailwind + 喜欢代码自由」的开发者**，**Mantine / MUI / Ant Design 是给「快速开箱即用」的开发者**——两条路线没有谁更好。

## 12. 调试与排查

### 12.1 检查 components.json

```bash
# 查看当前配置
pnpm dlx shadcn@latest info

# 或直接 cat
cat components.json
```

### 12.2 检查 cn() 工作

打开浏览器 DevTools 检查渲染后的 class：

```tsx
<Button className="px-8">测试</Button>
// 实际生成的 class：
// "inline-flex items-center justify-center ... h-9 py-2 px-8"
// （px-4 被你传入的 px-8 覆盖，因为 tailwind-merge）
```

### 12.3 检查 CSS 变量

```js
// 浏览器控制台
getComputedStyle(document.documentElement).getPropertyValue("--primary");
// "oklch(0.205 0 0)"
```

### 12.4 检查 .dark 类切换

```js
// 浏览器控制台手动切换主题
document.documentElement.classList.toggle("dark");
```

### 12.5 React Strict Mode 警告

React 19 Strict Mode 会**故意双调用** effect ——某些 shadcn 组件首次启动时出现警告，**升级到最新 shadcn 版本通常已修复**。

## 13. 常见问题排查

### 13.1 `Cannot find module '@/lib/utils'`

**确认 tsconfig.json paths 已配置 + Vite alias 已配置 + 重启 dev server**。

### 13.2 `Could not resolve @radix-ui/react-slot`

```bash
# CLI 安装组件时会自动装 Radix 包
# 如果失败，手动安装
pnpm add @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-dropdown-menu
```

### 13.3 Tailwind 类不生效

确认 `src/index.css` 顶部有 `@import "tailwindcss"`，并且 `vite.config.ts` / `next.config.js` 已注入 `@tailwindcss/vite`。

### 13.4 OKLCH 颜色显示为空

检查浏览器版本：Chrome 111+ / Safari 15.4+ / Firefox 113+。Safari 14 等旧版本不支持，**降级方案**：把 CSS 变量改为 HSL（`oklch(0.205 0 0)` → `hsl(0 0% 9%)`）。

### 13.5 暗色模式闪烁

```tsx
// app/layout.tsx 必须加 suppressHydrationWarning
<html lang="zh-CN" suppressHydrationWarning>

// ThemeProvider 加 disableTransitionOnChange
<ThemeProvider attribute="class" disableTransitionOnChange>
```

### 13.6 asChild 报错 `Children.only expected single React element`

```tsx
// 错误：多个子元素
<DialogTrigger asChild>
  <Button>登录</Button>
  <span>说明</span>
</DialogTrigger>

// 正确：单个子元素（可以内含多元素）
<DialogTrigger asChild>
  <Button>
    登录 <span>说明</span>
  </Button>
</DialogTrigger>
```

### 13.7 自定义 asChild 子组件不工作

子组件必须用 `React.forwardRef`：

```tsx
// 错误
const MyButton = ({ children }: { children: React.ReactNode }) => (
  <button>{children}</button>
);

// 正确
const MyButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<"button">
>(({ children, ...props }, ref) => (
  <button ref={ref} {...props}>
    {children}
  </button>
));
```

### 13.8 `shadcn add` 拷贝失败

```bash
# 清除 npm/pnpm 缓存
pnpm store prune

# 重新尝试
pnpm dlx shadcn@latest add button --overwrite
```

### 13.9 Next.js App Router `useTheme` 报错

`useTheme` 是 client-side hook，**调用方必须 `"use client"`**：

```tsx
"use client"; // 必须

import { useTheme } from "next-themes";
```

## 14. 完成入门后

掌握上述内容后，可继续阅读：

- [指南](./guide-line.md)：70+ 组件完整清单 / `cva` variant 深度 / Form + react-hook-form + zod / Data Table / Sidebar / Sonner / Chart / Blocks / Themes / Registry / MCP / monorepo / 常见踩坑
- [参考](./reference.md)：70+ 组件 API 速查 / CLI 完整命令 / components.json 全字段 / CSS 变量 token / cva API / TypeScript 类型
- [shadcn/ui 官方文档](https://ui.shadcn.com/docs)
- [Radix Primitives 文档](https://www.radix-ui.com/primitives)（理解底层）
- [Tailwind CSS v4 文档](https://tailwindcss.com/docs)
- [lucide-react 图标库](https://lucide.dev)
