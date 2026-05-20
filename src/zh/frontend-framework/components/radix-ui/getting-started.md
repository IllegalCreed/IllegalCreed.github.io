---
layout: doc
outline: [2, 3]
---

# Radix UI 入门

本文以 **React 18+ / TypeScript 5+ / Tailwind CSS 4+ / pnpm** 为基线，展示从「**零样式 Radix Primitives**」到「**带样式 Radix Themes**」的完整入门路径——你将学会两条产品线分别的安装、使用、与 shadcn/ui 的关系。

> Radix UI 是 React 生态**最特殊的 UI 库** —— 它不是「给你一套带样式的组件」，而是**给你「带行为 + a11y + 键盘 + 焦点管理」的盒子**。一定先理解 [index 页](./index.md) 提到的 **「Primitives vs Themes」** 二分。

## 0. 环境与前置要求

- **Node.js** ≥ 20（推荐 22 LTS）
- **包管理器** `pnpm`（推荐）/ `npm` / `yarn` 任意
- **React** ≥ 18（**强烈推荐 19**，原生 `useId` SSR 友好）
- **TypeScript** ≥ 5.0
- 框架：**Vite 7+** / **Next.js 15+ App Router** / **Remix** / **TanStack Router**

> Radix Primitives **完全不依赖任何 CSS 工具**，但 99% 的实际项目会搭配 **Tailwind CSS 4+**。本文示例默认假设你**已经安装并配置好 Tailwind**。

## 1. 三条主流路径概览

Radix UI 在实际项目中通常按以下三条路径之一引入，**选哪条取决于你的设计自由度需求**：

### 路径 A：直接用 Radix Primitives（最大自由度）

适合 **设计驱动 + 完全自定义视觉** 场景。**你自己用 Tailwind / CSS 写所有样式**。

```bash
# 方式 1：独立包（按需安装）
pnpm add @radix-ui/react-dialog @radix-ui/react-dropdown-menu

# 方式 2：聚合包（一次拿全）
pnpm add radix-ui
```

### 路径 B：用 shadcn/ui（推荐 99% 场景）

**shadcn/ui = Radix Primitives + Tailwind + 拷贝代码到本地**。截至 2026 年 90k+ Star。**不是 npm 包，而是 CLI 工具拷贝代码到你的项目**。

```bash
# shadcn/ui 初始化（项目根目录）
pnpm dlx shadcn@latest init

# 拷贝具体组件代码到 src/components/ui
pnpm dlx shadcn@latest add dialog dropdown-menu button
```

shadcn 拷贝来的 `src/components/ui/dialog.tsx` **底层就是 Radix Primitives**——所以**学会 Radix Primitives = 半个 shadcn 已经会了**。

### 路径 C：用 Radix Themes（最快上手）

适合 **追求开箱即用 + 默认设计已经够好 + 不需要 Tailwind** 的项目。

```bash
pnpm add @radix-ui/themes
```

> **本入门指南聚焦路径 A（Primitives + Tailwind）和路径 C（Themes）**，路径 B 见 shadcn/ui 官方文档。

## 2. 路径 A：Radix Primitives + Tailwind

### 2.1 安装第一个 Primitive（Dialog）

```bash
# 创建 Vite + React + TS 项目（如果还没有）
pnpm create vite@latest my-app -- --template react-ts
cd my-app
pnpm install

# 安装 Tailwind CSS 4
pnpm add tailwindcss @tailwindcss/vite

# 安装 Radix Dialog
pnpm add @radix-ui/react-dialog
```

`vite.config.ts`：

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

`src/index.css`：

```css
@import "tailwindcss";
```

### 2.2 第一个 Dialog 组件

`src/components/MyDialog.tsx`：

```tsx
import * as Dialog from "@radix-ui/react-dialog";

/**
 * 自定义对话框组件
 * - Compound Component 模式：Root + Trigger + Portal + Overlay + Content + Title + Description + Close
 * - 默认 Portal 到 body，避免 z-index / overflow 问题
 * - 默认 modal，按 Esc 关闭、焦点自动陷阱
 */
export function MyDialog() {
  return (
    <Dialog.Root>
      {/* 触发器 —— 任何 React 节点都可以 */}
      <Dialog.Trigger asChild>
        <button className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">
          打开对话框
        </button>
      </Dialog.Trigger>

      {/* Portal —— 默认渲染到 body 末端 */}
      <Dialog.Portal>
        {/* 遮罩层 */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* 内容容器 */}
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          {/* a11y 必须：Title + Description（可隐藏但不可省） */}
          <Dialog.Title className="text-lg font-semibold">
            欢迎使用 Radix Dialog
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-gray-600">
            这是一个完全无样式的 Dialog，所有视觉由你的 Tailwind 类决定。
          </Dialog.Description>

          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close asChild>
              <button className="rounded-lg border px-3 py-1.5 text-sm">
                取消
              </button>
            </Dialog.Close>
            <Dialog.Close asChild>
              <button className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white">
                确认
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

`src/App.tsx`：

```tsx
import { MyDialog } from "./components/MyDialog";

function App() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <MyDialog />
    </div>
  );
}

export default App;
```

```bash
pnpm dev
```

打开 http://localhost:5173，点击按钮 —— 你将看到一个 Tailwind 风格的 Dialog 弹出，**Esc 关闭、焦点锁定、a11y 完美**——但所有视觉**100% 由你的 Tailwind 类决定**。

### 2.3 关键概念：Compound Component

Radix 的所有 Primitives 都是**复合组件**——一个组件拆成多个子组件、每个子组件**独立暴露**给你：

```tsx
// Dialog 的完整 anatomy
<Dialog.Root>           {/* 状态容器 */}
  <Dialog.Trigger />    {/* 触发器（任意元素） */}
  <Dialog.Portal>       {/* Portal 到 body */}
    <Dialog.Overlay />  {/* 遮罩层 */}
    <Dialog.Content>    {/* 内容容器 */}
      <Dialog.Title />        {/* a11y 标题 */}
      <Dialog.Description />  {/* a11y 描述 */}
      <Dialog.Close />        {/* 关闭按钮 */}
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

**为什么这样设计**：
- **结构清晰**——anatomy 一眼看穿
- **可拆分**——你可以把 Trigger 放在任意位置
- **可单独样式**——每个 sub-component 有自己的 className
- **细粒度控制**——比如自定义 Portal 容器、跳过 Overlay 等

### 2.4 关键概念：asChild Slot 模式

Radix 所有 Trigger / Close / Item 等**都支持 `asChild` prop**——**把功能注入到子元素而非额外渲染一层 DOM**：

```tsx
// 不用 asChild —— Radix 会渲染默认的 <button>
<Dialog.Trigger>打开</Dialog.Trigger>
// 实际 DOM: <button>打开</button>

// 用 asChild —— Radix 把功能合并到你的 <a> 上
<Dialog.Trigger asChild>
  <a href="#dialog">打开</a>
</Dialog.Trigger>
// 实际 DOM: <a href="#dialog" data-state="closed" ...>打开</a>
```

**与 Next.js Link 组合**：

```tsx
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";

<Dialog.Trigger asChild>
  <Link href="/products" className="text-blue-500">
    商品列表
  </Link>
</Dialog.Trigger>;
```

> **`asChild` 要求**：子元素必须**接收并展开所有 props**、必须使用 `React.forwardRef` 转发 ref。Next.js Link / React Router Link 默认满足。

### 2.5 关键概念：data-state 状态属性

Radix 在每个**有状态**的 DOM 元素上挂 `data-state` 属性：

```html
<button data-state="open">打开</button>
<div data-state="open">遮罩</div>
<div data-state="open" data-side="top" data-align="center">内容</div>
```

**用 Tailwind 选择器响应状态**：

```tsx
<Dialog.Trigger
  className="
    bg-indigo-600
    data-[state=open]:bg-indigo-800
    data-[state=closed]:bg-indigo-600
  "
>
  按钮
</Dialog.Trigger>
```

**用纯 CSS 写状态样式**：

```css
.MyTrigger[data-state="open"] {
  background-color: #4338ca;
}
```

### 2.6 关键概念：CSS 变量驱动动画

Radix 把组件的**几何信息**（高度、宽度、变换原点）暴露为 CSS 变量——**纯 CSS 即可写动画，不需要 JS 测量**：

```css
/* Accordion 展开高度动画 */
.AccordionContent[data-state="open"] {
  animation: slideDown 200ms ease-out;
}

.AccordionContent[data-state="closed"] {
  animation: slideUp 200ms ease-out;
}

@keyframes slideDown {
  from {
    height: 0;
  }
  to {
    height: var(--radix-accordion-content-height);
  }
}

@keyframes slideUp {
  from {
    height: var(--radix-accordion-content-height);
  }
  to {
    height: 0;
  }
}
```

完整 CSS 变量列表见 [指南](./guide-line.md) 「CSS 变量动画」章节。

## 3. 第二个示例：Dropdown Menu（含 SubMenu）

```bash
pnpm add @radix-ui/react-dropdown-menu
```

`src/components/MyDropdown.tsx`：

```tsx
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

/**
 * 下拉菜单组件
 * - 含 SubMenu 二级菜单
 * - 含 Checkbox Item
 * - 自动键盘导航：Arrow / Enter / Esc / Type to find
 */
export function MyDropdown() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="rounded-lg border px-4 py-2 hover:bg-gray-50">
          选项
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 min-w-44 rounded-lg border bg-white p-1 shadow-lg"
          sideOffset={4}
          align="start"
        >
          <DropdownMenu.Item className="cursor-pointer rounded px-3 py-1.5 text-sm outline-none data-[highlighted]:bg-indigo-50 data-[highlighted]:text-indigo-900">
            新建
          </DropdownMenu.Item>

          <DropdownMenu.Item className="cursor-pointer rounded px-3 py-1.5 text-sm outline-none data-[highlighted]:bg-indigo-50 data-[highlighted]:text-indigo-900">
            打开
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="my-1 h-px bg-gray-200" />

          {/* 二级菜单 */}
          <DropdownMenu.Sub>
            <DropdownMenu.SubTrigger className="flex cursor-pointer items-center justify-between rounded px-3 py-1.5 text-sm outline-none data-[highlighted]:bg-indigo-50">
              更多
              <span className="ml-2 text-gray-400">▶</span>
            </DropdownMenu.SubTrigger>

            <DropdownMenu.Portal>
              <DropdownMenu.SubContent
                className="z-50 min-w-44 rounded-lg border bg-white p-1 shadow-lg"
                sideOffset={4}
              >
                <DropdownMenu.Item className="rounded px-3 py-1.5 text-sm data-[highlighted]:bg-indigo-50">
                  导出 PDF
                </DropdownMenu.Item>
                <DropdownMenu.Item className="rounded px-3 py-1.5 text-sm data-[highlighted]:bg-indigo-50">
                  导出 CSV
                </DropdownMenu.Item>
              </DropdownMenu.SubContent>
            </DropdownMenu.Portal>
          </DropdownMenu.Sub>

          <DropdownMenu.Separator className="my-1 h-px bg-gray-200" />

          <DropdownMenu.Item className="cursor-pointer rounded px-3 py-1.5 text-sm text-red-600 data-[highlighted]:bg-red-50">
            删除
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
```

> 注意 `data-[highlighted]:bg-indigo-50` —— **键盘导航高亮态**通过 `data-highlighted` 属性暴露，Tailwind 选择器可直接响应。

## 4. 第三个示例：Popover

```bash
pnpm add @radix-ui/react-popover
```

```tsx
import * as Popover from "@radix-ui/react-popover";

export function MyPopover() {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button className="rounded-lg border px-3 py-1.5">详情</button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="z-50 w-64 rounded-lg border bg-white p-4 shadow-lg outline-none"
          sideOffset={8}
          align="end"
        >
          <h4 className="font-semibold">产品规格</h4>
          <p className="mt-1 text-sm text-gray-600">
            尺寸 12.5cm × 8.0cm，重量 250g
          </p>
          <Popover.Arrow className="fill-white" />
          <Popover.Close asChild>
            <button className="absolute right-2 top-2 text-gray-400 hover:text-gray-600">
              ×
            </button>
          </Popover.Close>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
```

> `Popover.Arrow` 是 Radix 自动绘制的**指向 Trigger 的小三角**，**自动跟随 collision detection 调整位置**。

## 5. 受控 vs 非受控

所有 Primitives 都支持两种模式：

```tsx
// 非受控（Uncontrolled）—— Radix 自己管理 open 状态
<Dialog.Root defaultOpen={false}>
  ...
</Dialog.Root>

// 受控（Controlled）—— 你自己管理 open 状态
function MyDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>打开</Dialog.Trigger>
      ...
    </Dialog.Root>
  );
}
```

**受控的好处**：可以通过外部状态（如 URL / global state / 父组件）控制对话框，**适合需要程序化打开/关闭**的场景。

## 6. Portal 与 SSR

### 6.1 默认 Portal 行为

Dialog / Popover / Dropdown / Tooltip / Select 等 overlay 类组件**默认 Portal 到 `<body>` 末端**：

```tsx
<Dialog.Portal>
  <Dialog.Overlay />
  <Dialog.Content>...</Dialog.Content>
</Dialog.Portal>
```

这彻底解决了：
- `z-index` 层叠上下文
- 父级 `overflow: hidden` 裁剪
- 父级 `transform` / `filter` 锚定丢失

### 6.2 自定义 Portal 容器

```tsx
const containerRef = useRef<HTMLDivElement>(null);

return (
  <div ref={containerRef}>
    <Dialog.Root>
      <Dialog.Portal container={containerRef.current}>
        ...
      </Dialog.Portal>
    </Dialog.Root>
  </div>
);
```

适合**模态框需要限制在特定容器内**（如 iframe 内部）。

### 6.3 Next.js App Router SSR

```tsx
// app/page.tsx —— Server Component
import { MyDialog } from "@/components/MyDialog";

export default function Page() {
  return <MyDialog />;
}
```

```tsx
// components/MyDialog.tsx —— Client Component
"use client"; // 必须，因为用到 useState / useEffect

import * as Dialog from "@radix-ui/react-dialog";
// ...
```

> Radix React 18+ 自带 `useId` —— **无 hydration warning**、**SSR 完美**。**只需在 Client Component 用 Radix Primitives**。

## 7. 路径 C：Radix Themes 完整安装

如果你**不想自己写样式 + 不需要 Tailwind 自由度**，那 Radix Themes 是更快的选择。

### 7.1 安装

```bash
pnpm add @radix-ui/themes
```

### 7.2 导入 CSS + 包根 Theme

`src/main.tsx`：

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import "@radix-ui/themes/styles.css"; // 必须导入
import { Theme } from "@radix-ui/themes";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Theme accentColor="indigo" grayColor="slate" radius="medium" scaling="100%">
      <App />
    </Theme>
  </React.StrictMode>,
);
```

### 7.3 第一个 Themes 组件

`src/App.tsx`：

```tsx
import { Button, TextField, Card, Flex, Heading, Text } from "@radix-ui/themes";

export default function App() {
  return (
    <Flex direction="column" gap="4" p="6" maxWidth="500px">
      <Heading>用户登录</Heading>

      <Card>
        <Flex direction="column" gap="3">
          <Text size="2" weight="bold">
            邮箱
          </Text>
          <TextField.Root placeholder="your@email.com" size="3" />

          <Text size="2" weight="bold" mt="3">
            密码
          </Text>
          <TextField.Root type="password" placeholder="••••••••" size="3" />

          <Button size="3" mt="4">
            登录
          </Button>
          <Button size="3" variant="soft">
            忘记密码？
          </Button>
        </Flex>
      </Card>
    </Flex>
  );
}
```

**特点**：
- 不需要写一行 CSS
- 自动响应 `accentColor="indigo"` 主题色
- 6 个 variant（`solid` / `soft` / `outline` / `ghost` / `surface` / `classic`）
- 4 个 size（`"1"` / `"2"` / `"3"` / `"4"`）
- 响应式 props 对象语法（见下节）

### 7.4 Theme 完整 Props

```tsx
<Theme
  accentColor="indigo"      // 主色（16 选 1：indigo / blue / red / purple / green / mint / ...）
  grayColor="slate"         // 灰色（6 选 1：gray / mauve / slate / sage / olive / sand）
  panelBackground="solid"   // 面板背景：solid / translucent
  radius="medium"           // 圆角：none / small / medium / large / full
  scaling="100%"            // 整体缩放：90% / 95% / 100% / 105% / 110%
  appearance="light"        // 主题模式：light / dark / inherit
>
  {children}
</Theme>
```

### 7.5 响应式 Prop 对象

```tsx
<Flex
  direction={{ initial: "column", md: "row" }}
  gap={{ initial: "2", md: "4" }}
  p={{ initial: "3", md: "6" }}
>
  <Button size={{ initial: "2", md: "3" }}>响应式按钮</Button>
</Flex>
```

断点：`initial` / `xs` / `sm` / `md` / `lg` / `xl`（与 Tailwind 接近但前缀不同）。

### 7.6 暗色模式

```tsx
// 方式 1：appearance prop 硬编码
<Theme appearance="dark">...</Theme>

// 方式 2：跟随系统
<Theme appearance="inherit">...</Theme>

// 方式 3：next-themes 集成（推荐）
import { ThemeProvider } from "next-themes";

<ThemeProvider attribute="class" defaultTheme="system">
  <Theme>{children}</Theme>
</ThemeProvider>;
```

## 8. 与 shadcn/ui 的关系

**shadcn/ui = Radix Primitives + Tailwind + CLI 拷贝代码**：

```bash
pnpm dlx shadcn@latest init        # 初始化（选 Tailwind / 路径等）
pnpm dlx shadcn@latest add dialog  # 拷贝 dialog 组件到 src/components/ui
```

拷贝来的 `src/components/ui/dialog.tsx` 长这样（简化）：

```tsx
"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out",
      className,
    )}
    {...props}
  />
));

// ...其余 sub-component

export { Dialog, DialogTrigger, DialogPortal, DialogOverlay /* ... */ };
```

**你可以直接修改这个 dialog.tsx 文件**——这就是 shadcn 「**拷贝代码、不依赖 npm**」的哲学。**所以会 Radix Primitives = 半个 shadcn 已经会了**。

## 9. 完整 Next.js App Router 集成

### 9.1 安装

```bash
pnpm create next-app@latest my-app --typescript --tailwind --app
cd my-app
pnpm add @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-popover
```

### 9.2 layout.tsx（Server Component）

```tsx
// app/layout.tsx
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
```

### 9.3 Client Component 使用 Radix

```tsx
// app/page.tsx
import { MyDialog } from "@/components/MyDialog";

export default function Home() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">首页</h1>
      <MyDialog />
    </main>
  );
}
```

```tsx
// components/MyDialog.tsx
"use client"; // 必须，因为用到 useState

import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";

export function MyDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {/* ... */}
    </Dialog.Root>
  );
}
```

### 9.4 Radix Themes + Next.js + next-themes

```bash
pnpm add @radix-ui/themes next-themes
```

```tsx
// app/layout.tsx
import "@radix-ui/themes/styles.css";
import { Theme } from "@radix-ui/themes";
import { ThemeProvider } from "next-themes";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Theme accentColor="indigo" grayColor="slate" radius="medium">
            {children}
          </Theme>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

## 10. 完整 Vite 集成

`vite.config.ts`（前面已写）：

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

`src/main.tsx`：

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
```

**如果用 Radix Themes**，多加一行 `import "@radix-ui/themes/styles.css"`：

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import "@radix-ui/themes/styles.css";
import "./index.css";
import { Theme } from "@radix-ui/themes";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <Theme accentColor="indigo">
    <App />
  </Theme>,
);
```

## 11. 第一个表单（Primitives + Tailwind）

`src/components/LoginForm.tsx`：

```tsx
import * as Form from "@radix-ui/react-form";
import { useState } from "react";

/**
 * 登录表单
 * - 用 @radix-ui/react-form Primitive
 * - HTML5 原生校验 + Radix Validation Message
 */
export function LoginForm() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <Form.Root
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.currentTarget));
        console.log("提交：", data);
        setSubmitted(true);
      }}
    >
      <Form.Field name="email" className="block">
        <Form.Label className="block text-sm font-medium">邮箱</Form.Label>
        <Form.Control asChild>
          <input
            type="email"
            required
            className="mt-1 block w-full rounded border px-3 py-2 outline-none focus:border-indigo-500"
          />
        </Form.Control>
        <Form.Message
          match="valueMissing"
          className="mt-1 block text-xs text-red-500"
        >
          邮箱不能为空
        </Form.Message>
        <Form.Message
          match="typeMismatch"
          className="mt-1 block text-xs text-red-500"
        >
          请输入有效邮箱
        </Form.Message>
      </Form.Field>

      <Form.Field name="password">
        <Form.Label className="block text-sm font-medium">密码</Form.Label>
        <Form.Control asChild>
          <input
            type="password"
            required
            minLength={8}
            className="mt-1 block w-full rounded border px-3 py-2 outline-none focus:border-indigo-500"
          />
        </Form.Control>
        <Form.Message
          match="valueMissing"
          className="mt-1 block text-xs text-red-500"
        >
          密码不能为空
        </Form.Message>
        <Form.Message
          match="tooShort"
          className="mt-1 block text-xs text-red-500"
        >
          密码至少 8 位
        </Form.Message>
      </Form.Field>

      <Form.Submit asChild>
        <button className="w-full rounded bg-indigo-600 py-2 text-white">
          登录
        </button>
      </Form.Submit>

      {submitted && (
        <p className="text-sm text-green-600">提交成功（控制台查看数据）</p>
      )}
    </Form.Root>
  );
}
```

> `Form.Message match="..."` 接受 HTML5 ValidityState key（`valueMissing` / `typeMismatch` / `tooShort` / `tooLong` / `patternMismatch` / `rangeUnderflow` / `rangeOverflow` 等），**校验完全用浏览器原生**。

## 12. 调试技巧

### 12.1 检查 data-state 属性

打开 DevTools，找到 Radix 组件根 DOM 元素 —— 你会看到：

```html
<button data-state="closed" aria-expanded="false">打开</button>
<!-- 点击后 -->
<button data-state="open" aria-expanded="true">打开</button>
```

**用 `data-[state=open]:` Tailwind 选择器**响应状态变化。

### 12.2 检查 Radix CSS 变量

打开 DevTools，找到 Content 元素 —— 你会看到：

```css
:root {
  --radix-dialog-content-transform-origin: var(--radix-popper-transform-origin);
  --radix-popper-available-width: 1200px;
  --radix-popper-available-height: 800px;
  --radix-popper-trigger-width: 80px;
  --radix-popper-trigger-height: 36px;
}
```

**这些 CSS 变量可以在 className 里直接用**（如 <span v-pre>`style={{ width: "var(--radix-popover-trigger-width)" }}`</span>）。

### 12.3 检查焦点陷阱

打开 Dialog 后按 Tab 键 —— 焦点应该**只在 Dialog 内部循环**。如果焦点跳到外部，说明 Portal 配置有问题。

### 12.4 Strict Mode 双调用警告

React 18 Strict Mode 会**故意双调用**所有 effect ——某些 Radix 组件首次启动时会出现警告，**升级到最新 Radix 版本通常已修复**。

## 13. 常见问题排查

### 13.1 Module not found: @radix-ui/react-dialog

```bash
# 确认依赖已安装
cat package.json | grep radix
# 重新安装
pnpm install
```

### 13.2 Hydration warning（Next.js）

确认 **使用 Radix 的组件加了 `"use client"`**，并且 `useState` 不在 Server Component 顶层。

### 13.3 asChild 报错：Children.only expected single React element

`Dialog.Trigger asChild` 等**只能有一个 React 子元素**，不能多个：

```tsx
// 错误
<Dialog.Trigger asChild>
  <button>打开</button>
  <span>说明</span>
</Dialog.Trigger>

// 正确
<Dialog.Trigger asChild>
  <button>
    打开
    <span>说明</span>
  </button>
</Dialog.Trigger>
```

### 13.4 自定义 asChild 子组件不工作

子组件**必须 forwardRef 并展开 props**：

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

### 13.5 z-index 仍然冲突

Radix Portal 默认渲染到 `<body>` 末端 —— 如果你的样式系统有全局 `z-index` 规则，**给 Overlay 和 Content 显式设置 z-index**：

```tsx
<Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
<Dialog.Content className="fixed left-1/2 top-1/2 z-50 ..." />
```

### 13.6 Radix Themes 与 Tailwind 样式冲突

**官方不推荐 Themes + Tailwind 混用**——Tailwind 会**穿透到 Themes 组件内部** 导致样式冲突。

如果非要混用，建议：
1. Themes 组件用 Themes props（`size` / `variant` / `color`）控制
2. Tailwind 只用在**布局层**（Box / Flex / Grid 等容器）
3. **不用 `className` 覆盖 Themes 组件内部样式**

## 14. 完成入门后

掌握上述内容后，可继续阅读：

- [指南](./guide-line.md)：Radix Primitives 全部 30+ 组件 / Themes 全部 70+ 组件 / `data-state` + CSS 变量动画 / Tailwind 集成最佳实践 / `<Theme>` 完整配置 / Layout 系统 / Radix Colors 12 阶 / 常见踩坑
- [参考](./reference.md)：30+ Primitives API 速查 / 70+ Themes API 速查 / 键盘快捷键全表 / CSS 变量全表 / TypeScript 类型
- [shadcn/ui 官方文档](https://ui.shadcn.com/docs)：Radix 上层最流行的实践
- [Radix Colors](https://www.radix-ui.com/colors)：业界事实标准的 12 阶语义色板
- [Radix Icons](https://www.radix-ui.com/icons)：300+ 风格统一的图标（虽然推荐 Lucide）
