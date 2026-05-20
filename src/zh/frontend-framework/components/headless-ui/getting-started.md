---
layout: doc
outline: [2, 3]
---

# Headless UI 入门

本文以 **React 18+ / Vue 3+ / TypeScript 5+ / Tailwind CSS 4+ / pnpm** 为基线，展示从「**零样式 Headless UI**」到「**完整 Tailwind 设计**」的入门路径——你将学会 React v2 与 Vue v1 两条产品线的安装、使用、配合 Tailwind 写 `data-*` 状态样式、内置 Anchor Positioning、Transition、Field 表单组件。

> Headless UI 是 React 生态**与 Tailwind 集成最紧密的 a11y 组件库** —— 一定先理解 [index 页](./index.md) 提到的 **「React v2 vs Vue v1」** 不对称事实：React v2 有 16 个组件 + Anchor + Field 表单 + 虚拟滚动，Vue v1 只有 13 个组件、缺 v2 的所有重大更新。

## 0. 环境与前置要求

- **Node.js** ≥ 20（推荐 22 LTS）
- **包管理器** `pnpm`（推荐）/ `npm` / `yarn` 任意
- **React** ≥ 18（**强烈推荐 19**，原生 `useId` SSR 友好）/ **Vue** ≥ 3.3
- **TypeScript** ≥ 5.0
- 框架：**Vite 7+** / **Next.js 15+ App Router** / **Remix** / **Nuxt 3+**
- **Tailwind CSS 4+**（强烈推荐，Headless UI 的 `data-*` 是为 Tailwind variant 设计的）

> Headless UI **完全不依赖 Tailwind**——但 99% 的实际项目都用 Tailwind 写样式。本文示例默认假设你**已经安装并配置好 Tailwind CSS 4+**。

## 1. 安装

### React 版（v2，推荐）

```bash
pnpm add @headlessui/react
```

### Vue 版（仅 v1，功能受限）

```bash
pnpm add @headlessui/vue
```

> **重要**：截至 2026 年 5 月，**`@headlessui/vue` 仍停留在 v1.7**——**没有 v2 的 anchor positioning / Checkbox / Input / Field / 虚拟滚动**。**Vue 用户能享受到的 Headless UI 体验 ≈ React 用户体验的 50%**。本文 React 示例都基于 v2、Vue 示例都基于 v1（API 与 React v1 类似）。

## 2. 第一个 Menu 组件（React v2 + 内置 Anchor Positioning）

`src/components/MyMenu.tsx`：

```tsx
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/react";

/**
 * 自定义下拉菜单组件
 * - 基于 Headless UI v2.0+
 * - 使用内置 anchor positioning（基于 Floating UI）
 * - data-* 属性 + Tailwind variant 完成所有状态样式
 */
export function MyMenu() {
  return (
    <Menu>
      {/* 触发按钮 —— data-* 属性自动反映状态 */}
      <MenuButton className="inline-flex items-center gap-2 rounded-md bg-gray-800 px-4 py-2 text-sm/6 font-semibold text-white shadow-inner data-[hover]:bg-gray-700 data-[open]:bg-gray-700 data-[focus]:outline-1 data-[focus]:outline-white">
        选项
      </MenuButton>

      {/* 菜单内容 —— anchor 自动定位，transition + data-closed 写动画 */}
      <MenuItems
        anchor="bottom end"
        transition
        className="z-50 mt-2 w-52 origin-top-right rounded-xl border border-white/5 bg-white/5 p-1 text-sm/6 text-white shadow-lg backdrop-blur-md outline-none transition duration-100 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
      >
        <MenuItem>
          <a
            href="#settings"
            className="group flex w-full items-center gap-2 rounded-lg px-3 py-1.5 data-[focus]:bg-white/10"
          >
            设置
            <kbd className="ml-auto hidden font-sans text-xs text-white/50 group-data-[focus]:inline">
              ⌘S
            </kbd>
          </a>
        </MenuItem>
        <MenuItem>
          <a
            href="#support"
            className="group flex w-full items-center gap-2 rounded-lg px-3 py-1.5 data-[focus]:bg-white/10"
          >
            帮助
          </a>
        </MenuItem>
        <MenuItem>
          <a
            href="#license"
            className="group flex w-full items-center gap-2 rounded-lg px-3 py-1.5 data-[focus]:bg-white/10"
          >
            授权
          </a>
        </MenuItem>
      </MenuItems>
    </Menu>
  );
}
```

`src/App.tsx`：

```tsx
import { MyMenu } from "./components/MyMenu";

function App() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950">
      <MyMenu />
    </div>
  );
}

export default App;
```

```bash
pnpm dev
```

打开浏览器 —— 你将看到一个 Tailwind 风格的下拉菜单，**键盘 Arrow/Home/End/Esc 全部可用、focus 完美、a11y 完美**。

### 2.1 关键点解读

**`anchor="bottom end"`**：v2 的杀手锏 —— **自动 portal + 自动 collision detection + 自动 sticky**。**`anchor` prop 可填**：

- 字符串：`"bottom"` / `"bottom start"` / `"top end"` / `"left"` / `"right"` 等
- 对象：<span v-pre>`anchor={{ to: "bottom end", gap: 8, offset: 0, padding: 8 }}`</span>
- CSS 变量：`className="[--anchor-gap:8px] [--anchor-padding:8px]"`

**`transition` prop + `data-closed`**：v2 的另一杀手锏 —— **不需要 Framer Motion、纯 CSS 即可写完整 enter / leave 动画**。

- `data-[closed]:scale-95 data-[closed]:opacity-0` 是初始 + 退出状态
- 标签上的其余 transition 类（`transition duration-100 ease-out`）是过渡曲线

**`data-[focus]:bg-white/10`**：菜单项的高亮态 —— **键盘 Arrow 移动到该项时 `data-focus` 自动出现**，Tailwind variant 直接命中。

**`group-data-[focus]:inline`**：菜单项内的 `<kbd>` 只有 focused 时才显示——**`group` + `group-data-[focus]:`** 是 Tailwind 的「父级状态影响子级样式」模式。

### 2.2 anchor 的更多用法

```tsx
{/* 1. 基础方向 */}
<MenuItems anchor="bottom start">
  ...
</MenuItems>

{/* 2. 自定义 gap / offset / padding（对象语法） */}
<MenuItems
  anchor={{
    to: "bottom end",
    gap: "8px",       // 距 Trigger 的距离
    offset: "-4px",   // 沿对齐方向的偏移
    padding: "16px",  // 视窗最小距离
  }}
>
  ...
</MenuItems>

{/* 3. CSS 变量配置（推荐：与 Tailwind 配合） */}
<MenuItems
  anchor="bottom end"
  className="[--anchor-gap:8px] [--anchor-padding:16px]"
>
  ...
</MenuItems>

{/* 4. 与 button-width 联动（dropdown 宽度匹配按钮） */}
<MenuItems
  anchor="bottom start"
  className="w-(--button-width)"
>
  ...
</MenuItems>
```

> `--anchor-gap` / `--anchor-offset` / `--anchor-padding` / `--button-width` 这套 CSS 变量是 Headless UI v2 暴露的 anchor 几何信息。

## 3. 第二个示例：Dialog（含 Backdrop + Transition）

`src/components/MyDialog.tsx`：

```tsx
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { useState } from "react";

/**
 * 自定义对话框组件
 * - DialogBackdrop 黑色遮罩
 * - DialogPanel 实际内容
 * - DialogTitle a11y 标题（必须）
 * - transition + data-closed 完成动画
 */
export function MyDialog() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
      >
        打开对话框
      </button>

      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        transition
        className="relative z-50 transition duration-300 ease-out data-[closed]:opacity-0"
      >
        {/* 遮罩层 —— DialogBackdrop 必须放在 Dialog 内、Panel 外 */}
        <DialogBackdrop className="fixed inset-0 bg-black/50" />

        {/* 滚动容器 —— 适配长内容 */}
        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <DialogPanel className="max-w-lg space-y-4 rounded-2xl bg-white p-12 shadow-2xl">
            <DialogTitle className="text-xl font-semibold">
              确认删除
            </DialogTitle>

            <p className="text-sm text-gray-600">
              该操作不可撤销。所有数据将永久丢失，确定继续吗？
            </p>

            <div className="flex justify-end gap-2 pt-4">
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
              >
                删除
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
```

### 3.1 Dialog 关键点

- **`open` + `onClose` 必须**：Dialog 在 Headless UI 中**始终是 controlled** —— 必须自己用 `useState` 管理 `open`
- **`DialogPanel` 是「实际可见的对话框容器」**：**点击 Panel 外部会触发 `onClose`**
- **`DialogTitle` 必须存在**：a11y `aria-labelledby` 由 Title 提供
- **Esc 键自动调用 `onClose`** —— 不需要监听
- **焦点陷阱自动启用** —— 打开 Dialog 后 Tab 键只在 Dialog 内循环
- **body 滚动锁自动启用**

### 3.2 把 Dialog 拆分成更小组件

```tsx
function ConfirmDialog({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} transition className="...">
      <DialogBackdrop className="fixed inset-0 bg-black/50" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="max-w-lg rounded-2xl bg-white p-12">
          <DialogTitle>确认操作</DialogTitle>
          <button onClick={onConfirm}>确认</button>
          <button onClick={onClose}>取消</button>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
```

## 4. 第三个示例：Combobox（搜索 + 单选）

`src/components/PeopleCombobox.tsx`：

```tsx
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { useState } from "react";

const people = [
  { id: 1, name: "张伟" },
  { id: 2, name: "李娜" },
  { id: 3, name: "王芳" },
  { id: 4, name: "刘强" },
  { id: 5, name: "陈静" },
];

/**
 * 自定义搜索下拉
 * - 用 useState 管理 query 实现客户端过滤
 * - ComboboxInput.displayValue 控制选中后输入框显示
 * - anchor + transition 完整体验
 */
export function PeopleCombobox() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<typeof people[number] | null>(null);

  const filteredPeople =
    query === ""
      ? people
      : people.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <Combobox
      value={selected}
      onChange={(person) => setSelected(person)}
      onClose={() => setQuery("")}
    >
      <div className="relative">
        <ComboboxInput
          aria-label="选择联系人"
          displayValue={(person: typeof people[number] | null) =>
            person?.name ?? ""
          }
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="搜索人员..."
        />
        <ComboboxButton className="absolute inset-y-0 right-0 px-2.5">
          ▼
        </ComboboxButton>
      </div>

      <ComboboxOptions
        anchor="bottom"
        transition
        className="z-50 w-(--input-width) rounded-lg border border-gray-200 bg-white shadow-lg [--anchor-gap:4px] empty:invisible data-[closed]:opacity-0"
      >
        {filteredPeople.map((person) => (
          <ComboboxOption
            key={person.id}
            value={person}
            className="flex cursor-pointer items-center gap-2 px-3 py-1.5 data-[focus]:bg-indigo-100 data-[selected]:font-semibold"
          >
            {person.name}
          </ComboboxOption>
        ))}
      </ComboboxOptions>
    </Combobox>
  );
}
```

### 4.1 Combobox 关键点

- **`displayValue`**：用户**选中某项后**，控制 `<input>` 显示什么文本（默认为 `value.toString()`）
- **`onClose`**：关闭时清空 `query`（否则会留住上次搜索状态）
- **`data-[focus]:bg-indigo-100`**：键盘 Arrow 高亮态
- **`data-[selected]:font-semibold`**：当前选中项（**与 focus 不同**）
- **`empty:invisible`**：搜索无结果时整个 dropdown 不显示

### 4.2 多选模式

```tsx
const [selected, setSelected] = useState<typeof people[number][]>([]);

<Combobox value={selected} onChange={setSelected} multiple>
  ...
</Combobox>;
```

### 4.3 大数据虚拟滚动（v2 内置）

```tsx
import { Combobox, ComboboxOptions, ComboboxOption } from "@headlessui/react";

// 假设有 10000 条数据
const allPeople = Array.from({ length: 10000 }, (_, i) => ({
  id: i,
  name: `用户 ${i}`,
}));

<Combobox value={selected} virtual={{ options: filteredPeople }} onChange={setSelected}>
  <ComboboxInput onChange={(e) => setQuery(e.target.value)} />
  <ComboboxOptions anchor="bottom">
    {({ option: person }) => (
      <ComboboxOption value={person}>{person.name}</ComboboxOption>
    )}
  </ComboboxOptions>
</Combobox>;
```

> `virtual.options` 接收一个**过滤后的数组**，Headless UI 内部用 [TanStack Virtual](https://tanstack.com/virtual) 实现窗口化渲染。

### 4.4 "Create" 模式（输入新值）

```tsx
{query.length > 0 && !filteredPeople.find((p) => p.name === query) && (
  <ComboboxOption value={{ id: null, name: query }}>
    创建 "{query}"
  </ComboboxOption>
)}
{filteredPeople.map((person) => (
  <ComboboxOption key={person.id} value={person}>
    {person.name}
  </ComboboxOption>
))}
```

## 5. 第四个示例：Switch（开关）

```tsx
import { Switch } from "@headlessui/react";
import { useState } from "react";

export function MySwitch() {
  const [enabled, setEnabled] = useState(false);

  return (
    <Switch
      checked={enabled}
      onChange={setEnabled}
      className="group inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition data-[checked]:bg-blue-600"
    >
      <span className="sr-only">启用通知</span>
      <span className="inline-block size-4 translate-x-1 rounded-full bg-white transition group-data-[checked]:translate-x-6" />
    </Switch>
  );
}
```

**关键点**：

- **`data-[checked]:bg-blue-600`**：开关状态下背景变色
- **`group-data-[checked]:translate-x-6`**：内部圆点跟着移动
- **`<span className="sr-only">`**：屏幕阅读器用的可访问文字
- **键盘 Space 切换**

## 6. 第五个示例：Checkbox（v2 新组件）

```tsx
import { Checkbox, Field, Label, Description } from "@headlessui/react";
import { useState } from "react";

export function MyCheckbox() {
  const [enabled, setEnabled] = useState(true);

  return (
    <Field className="flex items-start gap-3">
      <Checkbox
        checked={enabled}
        onChange={setEnabled}
        className="mt-1 size-4 rounded border border-gray-300 bg-white data-[checked]:border-indigo-600 data-[checked]:bg-indigo-600"
      >
        {/* 自定义打钩图标 */}
        <svg
          className="hidden size-3 fill-white group-data-[checked]:block"
          viewBox="0 0 14 14"
        >
          <path d="M3 8L6 11L11 3.5" stroke="white" strokeWidth="2" fill="none" />
        </svg>
      </Checkbox>
      <div>
        <Label className="font-medium">启用 Beta 功能</Label>
        <Description className="text-sm text-gray-500">
          提前体验最新特性，可能存在不稳定情况。
        </Description>
      </div>
    </Field>
  );
}
```

**`<Field>` + `<Label>` + `<Description>` 自动注入**：

- `<Label>` 的 `id` 与 `<Checkbox>` 的 `aria-labelledby` 自动关联
- `<Description>` 的 `id` 与 `<Checkbox>` 的 `aria-describedby` 自动关联
- 点击 `<Label>` 自动切换 `<Checkbox>`

**Indeterminate 状态**：

```tsx
<Checkbox checked={false} indeterminate>...</Checkbox>
```

## 7. 第六个示例：Tabs

```tsx
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";

export function MyTabs() {
  return (
    <TabGroup>
      <TabList className="flex gap-4 border-b border-gray-200">
        <Tab className="border-b-2 border-transparent px-4 py-2 text-sm font-medium text-gray-600 focus:outline-none data-[selected]:border-indigo-600 data-[selected]:text-indigo-600 data-[hover]:text-gray-800">
          最新
        </Tab>
        <Tab className="border-b-2 border-transparent px-4 py-2 text-sm font-medium text-gray-600 focus:outline-none data-[selected]:border-indigo-600 data-[selected]:text-indigo-600 data-[hover]:text-gray-800">
          热门
        </Tab>
        <Tab className="border-b-2 border-transparent px-4 py-2 text-sm font-medium text-gray-600 focus:outline-none data-[selected]:border-indigo-600 data-[selected]:text-indigo-600 data-[hover]:text-gray-800">
          趋势
        </Tab>
      </TabList>
      <TabPanels className="mt-4">
        <TabPanel>最新内容...</TabPanel>
        <TabPanel>热门内容...</TabPanel>
        <TabPanel>趋势内容...</TabPanel>
      </TabPanels>
    </TabGroup>
  );
}
```

**关键点**：

- **`data-[selected]:border-indigo-600`**：选中态
- **键盘 Arrow Left/Right 自动切换**
- **`<TabGroup vertical>`**：垂直布局（键盘改用 Arrow Up/Down）
- **`<TabGroup manual>`**：键盘 Arrow 只移动焦点、不切换 panel；需 Enter / Space 才切换

## 8. 关键概念：`data-*` 属性 vs Render Props

Headless UI v2 同时支持两种状态消费方式：

### 8.1 `data-*` 属性（推荐，Tailwind 友好）

```tsx
{/* 状态属性自动挂到 DOM */}
<MenuButton className="data-[hover]:bg-blue-500 data-[open]:bg-blue-700">
  点我
</MenuButton>
```

**实际 DOM**：

```html
<button data-hover data-focus>点我</button>
```

**优点**：

- 写法极简
- Tailwind variant 直接命中
- 无需 render prop 嵌套

### 8.2 Render Props（向后兼容，复杂场景）

```tsx
import { MenuButton } from "@headlessui/react";
import { Fragment } from "react";

<MenuButton as={Fragment}>
  {({ open, focus, hover, active }) => (
    <button
      className={`
        ${open ? "bg-blue-700" : "bg-blue-500"}
        ${focus ? "ring-2" : ""}
      `}
    >
      点我
    </button>
  )}
</MenuButton>;
```

**何时使用 render prop**：

- 需要把状态传给第三方组件（如 Framer Motion `animate` prop）
- 需要在 JSX 中根据状态切换内部结构
- v1 项目迁移到 v2 暂时保留旧写法

## 9. 关键概念：`as` Prop 替代 Radix `asChild`

```tsx
{/* 默认：MenuButton 渲染为 <button> */}
<MenuButton>点我</MenuButton>

{/* as="a" —— 渲染为 <a> */}
<MenuButton as="a" href="/profile">查看个人主页</MenuButton>

{/* as={Fragment} —— 不渲染额外 DOM，作用于子元素 */}
<MenuButton as={Fragment}>
  <button>实际按钮</button>
</MenuButton>

{/* as={Link} —— 渲染为 React Router / Next.js Link */}
import Link from "next/link";
<MenuButton as={Link} href="/profile">查看个人主页</MenuButton>
```

> **`as={Fragment}` 要求**：子元素必须是**单个 React 节点**、且子元素必须**接收并展开所有 props**。

## 10. Next.js App Router 集成

### 10.1 安装

```bash
pnpm create next-app@latest my-app --typescript --tailwind --app
cd my-app
pnpm add @headlessui/react
```

### 10.2 Server Component vs Client Component

```tsx
// app/page.tsx —— Server Component
import { MyMenu } from "@/components/MyMenu";

export default function Page() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">首页</h1>
      <MyMenu />
    </main>
  );
}
```

```tsx
// components/MyMenu.tsx —— Client Component
"use client"; // 必须，因为用到 useState / Headless UI

import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/react";

export function MyMenu() {
  return (
    <Menu>
      <MenuButton>选项</MenuButton>
      <MenuItems anchor="bottom end">
        <MenuItem>...</MenuItem>
      </MenuItems>
    </Menu>
  );
}
```

> Headless UI React 18+ 自带 `useId` —— **无 hydration warning**、**SSR 完美**。**只需在 Client Component 用 Headless UI**。

### 10.3 与 next-themes 集成（暗色模式）

```tsx
// app/layout.tsx
import { ThemeProvider } from "next-themes";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

Headless UI 的 `data-*` 属性与 Tailwind `dark:` variant 可同时使用：

```tsx
<MenuButton className="bg-white text-black data-[hover]:bg-gray-100 dark:bg-gray-800 dark:text-white dark:data-[hover]:bg-gray-700">
  ...
</MenuButton>
```

## 11. Vite + React 集成

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

`src/main.tsx`：

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
```

## 12. Vue 3 + Vite 集成（基于 v1）

> Vue 版仅 v1.7，**不支持 anchor / Checkbox / Input / 虚拟滚动**。以下示例展示基础 Menu 用法。

```bash
pnpm create vite@latest my-vue-app -- --template vue-ts
cd my-vue-app
pnpm add @headlessui/vue
pnpm add -D tailwindcss @tailwindcss/vite
```

`src/components/MyMenu.vue`：

```vue
<script setup lang="ts">
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from "@headlessui/vue";
</script>

<template>
  <Menu as="div" class="relative inline-block text-left">
    <MenuButton class="rounded-md bg-gray-800 px-4 py-2 text-white">
      选项
    </MenuButton>

    <transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <MenuItems class="absolute right-0 mt-2 w-56 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
        <MenuItem v-slot="{ active }">
          <a
            href="#settings"
            :class="[
              active ? 'bg-indigo-500 text-white' : 'text-gray-900',
              'block px-4 py-2 text-sm',
            ]"
          >
            设置
          </a>
        </MenuItem>
        <MenuItem v-slot="{ active }">
          <a
            href="#support"
            :class="[
              active ? 'bg-indigo-500 text-white' : 'text-gray-900',
              'block px-4 py-2 text-sm',
            ]"
          >
            帮助
          </a>
        </MenuItem>
      </MenuItems>
    </transition>
  </Menu>
</template>
```

**Vue v1 与 React v2 主要差异**：

- **使用 `v-slot="{ active }"` 替代 React 的 render prop**
- **没有 `data-*` 自动注入** —— Vue 版仍是 `active` slot prop 时代
- **没有内置 `anchor` prop** —— 需自己用 [Floating UI Vue](https://floating-ui.com/docs/vue) 配合
- **没有 `transition` prop** —— 必须用 Vue 原生 `<transition>` 写动画
- **没有 Checkbox / Input / Textarea / Select / Field / Fieldset** —— 表单组件需自己实现
- **没有 Combobox 虚拟滚动** —— 大数据场景需自己实现

## 13. 第七个示例：Field 表单组件（v2 新）

```tsx
import {
  Field,
  Fieldset,
  Input,
  Label,
  Legend,
  Description,
  Select,
  Textarea,
} from "@headlessui/react";

/**
 * 完整的表单
 * - Fieldset / Legend 分组
 * - Field / Label / Input / Description 自动 wiring ARIA
 * - data-[invalid] 错误态
 */
export function MyForm() {
  return (
    <form className="space-y-6">
      <Fieldset className="space-y-4">
        <Legend className="text-lg font-semibold">个人信息</Legend>

        <Field>
          <Label className="text-sm font-medium">姓名</Label>
          <Input
            name="name"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 data-[focus]:outline-none data-[focus]:ring-2 data-[focus]:ring-indigo-500 data-[invalid]:ring-2 data-[invalid]:ring-red-500"
          />
          <Description className="mt-1 text-xs text-gray-500">
            请输入真实姓名
          </Description>
        </Field>

        <Field>
          <Label className="text-sm font-medium">所在城市</Label>
          <Select
            name="city"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 data-[focus]:outline-none data-[focus]:ring-2 data-[focus]:ring-indigo-500"
          >
            <option>请选择</option>
            <option value="bj">北京</option>
            <option value="sh">上海</option>
            <option value="gz">广州</option>
          </Select>
        </Field>

        <Field>
          <Label className="text-sm font-medium">个人简介</Label>
          <Textarea
            name="bio"
            rows={4}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 data-[focus]:outline-none data-[focus]:ring-2 data-[focus]:ring-indigo-500"
          />
        </Field>
      </Fieldset>

      <button
        type="submit"
        className="rounded-md bg-indigo-600 px-4 py-2 text-white"
      >
        提交
      </button>
    </form>
  );
}
```

**`<Field>` 的魔法**：

- `<Label>` `<Input>` `<Description>` 嵌入 `<Field>` 时**自动生成 `id`**
- `<Input>` 自动 `aria-labelledby="<label id>"` + `aria-describedby="<description id>"`
- `<Fieldset disabled>` 级联禁用所有内部 Field

## 14. Transition 组件深度

### 14.1 `transition` prop（v2 推荐方式）

许多 Headless UI v2 组件支持 `transition` prop —— 启用后**自动添加 `data-closed` / `data-enter` / `data-leave` / `data-transition` 属性**，配合 Tailwind 写动画：

```tsx
<MenuItems
  transition
  className="
    transition duration-200 ease-out
    data-[closed]:scale-95 data-[closed]:opacity-0
    data-[enter]:duration-200
    data-[leave]:duration-100
  "
>
  ...
</MenuItems>
```

### 14.2 `<Transition>` 独立组件（用于自定义动画包装）

```tsx
import { Transition } from "@headlessui/react";
import { useState } from "react";

function Toggle() {
  const [show, setShow] = useState(false);
  return (
    <>
      <button onClick={() => setShow(!show)}>切换</button>
      <Transition
        show={show}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 -translate-y-2"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 -translate-y-2"
      >
        <div className="mt-2 rounded-md bg-white p-4 shadow">
          这是被动画包装的内容
        </div>
      </Transition>
    </>
  );
}
```

### 14.3 嵌套 `<TransitionChild>`

适合**多元素协调动画**（如 Dialog Backdrop 和 Panel 各自不同动画）：

```tsx
<Transition show={isOpen}>
  <TransitionChild
    enter="transition-opacity duration-300"
    enterFrom="opacity-0"
    enterTo="opacity-100"
  >
    <div className="backdrop">遮罩</div>
  </TransitionChild>
  <TransitionChild
    enter="transition-transform duration-200"
    enterFrom="scale-95 opacity-0"
    enterTo="scale-100 opacity-100"
  >
    <div className="panel">面板</div>
  </TransitionChild>
</Transition>
```

## 15. 调试技巧

### 15.1 检查 data-* 属性

打开 DevTools，找到 Headless UI 组件根 DOM 元素 —— 你会看到：

```html
<button data-headlessui-state="open active" data-open data-active>
  点我
</button>
```

**用 `data-[hover]:` Tailwind variant** 响应状态变化。

### 15.2 检查 anchor CSS 变量

打开 DevTools，找到 Content 元素 —— 你会看到：

```css
:root {
  --button-width: 80px;
}
```

**这些 CSS 变量可以在 className 里直接用**（如 `w-(--button-width)`）。

### 15.3 检查焦点陷阱

打开 Dialog 后按 Tab 键 —— 焦点应该**只在 Dialog 内部循环**。如果焦点跳到外部，说明 Portal 配置有问题。

### 15.4 Strict Mode 双调用警告

React 18 Strict Mode 会**故意双调用**所有 effect —— 升级到最新 Headless UI 版本通常已修复。

## 16. 常见问题排查

### 16.1 Module not found: @headlessui/react

```bash
# 确认依赖已安装
cat package.json | grep headlessui
# 重新安装
pnpm install
```

### 16.2 Hydration warning（Next.js）

确认 **使用 Headless UI 的组件加了 `"use client"`**，并且 `useState` 不在 Server Component 顶层。

### 16.3 `as={Fragment}` 报错：Children.only expected single React element

`as={Fragment}` **只能有一个 React 子元素**，不能多个：

```tsx
// 错误
<MenuButton as={Fragment}>
  <button>打开</button>
  <span>说明</span>
</MenuButton>

// 正确
<MenuButton as={Fragment}>
  <button>
    打开
    <span>说明</span>
  </button>
</MenuButton>
```

### 16.4 自定义组件不接收 props

如果 `as={MyButton}` 不工作 —— `MyButton` 必须**接收并展开所有 props**：

```tsx
// 错误
const MyButton = ({ children }: { children: React.ReactNode }) => (
  <button>{children}</button>
);

// 正确
const MyButton = (props: React.ComponentPropsWithoutRef<"button">) => (
  <button {...props} />
);
```

### 16.5 anchor 不生效

确认你**用的是 v2** —— v1 没有 `anchor` prop：

```bash
pnpm list @headlessui/react
# 应该输出 2.x 版本
```

### 16.6 Transition 不工作

确认你**给了完整的 `transition` 类**：

```tsx
{/* 错误：只有 data-closed 没有 transition 基础 */}
<MenuItems transition className="data-[closed]:opacity-0">

{/* 正确：必须有 transition 基础类 */}
<MenuItems
  transition
  className="transition duration-200 ease-out data-[closed]:opacity-0"
>
```

### 16.7 Combobox 虚拟滚动报错 / 不滚动

虚拟滚动要求：

- `virtual.options` 是已过滤数组
- `<ComboboxOptions>` 子元素是**render prop**而不是 `.map`：

```tsx
<ComboboxOptions>
  {({ option: person }) => (
    <ComboboxOption value={person}>{person.name}</ComboboxOption>
  )}
</ComboboxOptions>
```

## 17. 完成入门后

掌握上述内容后，可继续阅读：

- [指南](./guide-line.md)：16 个组件深度梳理 / Anchor Positioning 完整 / data-* 属性表 / Render Props 全表 / Field 表单 / Combobox 虚拟滚动 / Vue v1 vs React v2 差异 / v1 → v2 迁移 / 常见踩坑
- [参考](./reference.md)：16 个组件 API 速查 / 键盘快捷键全表 / anchor 配置全表 / CSS 变量全表 / TypeScript 类型
- [Headless UI 官方文档](https://headlessui.com)：每个组件「Examples / Component API / Styling」结构清晰
- [Tailwind UI](https://tailwindui.com)：付费组件库，全部基于 Headless UI
- [Catalyst](https://catalyst.tailwindui.com/)：Tailwind 官方设计系统，Headless UI 上层
