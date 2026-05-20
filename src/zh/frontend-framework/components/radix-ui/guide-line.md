---
layout: doc
outline: [2, 3]
---

# Radix UI 指南

本文围绕 **Radix Primitives + Radix Themes** 两条产品线，**深度梳理** 30+ Primitives 的全部分组、Compound Component 模式、`asChild`、Portal、`data-state` + CSS 变量动画、Tailwind 集成、Radix Themes 完整体系、与 shadcn/ui 协作、SSR、常见踩坑。

> 本指南假设你已经读过 [入门](./getting-started.md)，掌握了 Dialog / Dropdown Menu / Popover 三个基础 Primitive 的用法。

## 1. Radix Primitives 全部分组

Radix Primitives 共有 **30+ 独立 Primitive**，可分为 **6 大分类**：

### 1.1 Form 类（表单输入）—— 8 个

| Primitive | 用途 | 独立 npm 包 |
|-----------|------|-------------|
| `Checkbox` | 复选框 | `@radix-ui/react-checkbox` |
| `Radio Group` | 单选组 | `@radix-ui/react-radio-group` |
| `Switch` | 开关 | `@radix-ui/react-switch` |
| `Slider` | 滑块（支持多 thumb） | `@radix-ui/react-slider` |
| `Toggle` | 单按钮开关 | `@radix-ui/react-toggle` |
| `Toggle Group` | 按钮组开关 | `@radix-ui/react-toggle-group` |
| `Form` | 表单根 + HTML5 校验 | `@radix-ui/react-form` |
| `Label` | 关联表单控件的可点击 Label | `@radix-ui/react-label` |

### 1.2 Overlay 类（浮层）—— 5 个

| Primitive | 用途 | 独立 npm 包 |
|-----------|------|-------------|
| `Dialog` | 模态对话框 | `@radix-ui/react-dialog` |
| `Alert Dialog` | 强制确认的警告对话框 | `@radix-ui/react-alert-dialog` |
| `Popover` | 浮窗 | `@radix-ui/react-popover` |
| `Hover Card` | 悬停卡片 | `@radix-ui/react-hover-card` |
| `Tooltip` | 提示气泡 | `@radix-ui/react-tooltip` |

### 1.3 Menu 类（菜单）—— 4 个

| Primitive | 用途 | 独立 npm 包 |
|-----------|------|-------------|
| `Dropdown Menu` | 下拉菜单 | `@radix-ui/react-dropdown-menu` |
| `Context Menu` | 右键菜单 | `@radix-ui/react-context-menu` |
| `Menubar` | 顶部菜单栏（如 macOS） | `@radix-ui/react-menubar` |
| `Navigation Menu` | 大型导航菜单（带 Sub） | `@radix-ui/react-navigation-menu` |

### 1.4 Disclosure 类（展开收起）—— 3 个

| Primitive | 用途 | 独立 npm 包 |
|-----------|------|-------------|
| `Accordion` | 手风琴 | `@radix-ui/react-accordion` |
| `Collapsible` | 单项折叠 | `@radix-ui/react-collapsible` |
| `Tabs` | 标签页 | `@radix-ui/react-tabs` |

### 1.5 Visualization 类（可视化 / 反馈）—— 4 个

| Primitive | 用途 | 独立 npm 包 |
|-----------|------|-------------|
| `Progress` | 进度条 | `@radix-ui/react-progress` |
| `Avatar` | 头像（带 Fallback） | `@radix-ui/react-avatar` |
| `Aspect Ratio` | 宽高比容器 | `@radix-ui/react-aspect-ratio` |
| `Toast` | 通知 toast | `@radix-ui/react-toast` |

### 1.6 Utility / Layout 类 —— 7+ 个

| Primitive | 用途 | 独立 npm 包 |
|-----------|------|-------------|
| `Select` | 下拉选择器 | `@radix-ui/react-select` |
| `Scroll Area` | 自定义滚动条 | `@radix-ui/react-scroll-area` |
| `Separator` | 分隔线 | `@radix-ui/react-separator` |
| `Portal` | Portal 工具组件 | `@radix-ui/react-portal` |
| `Slot` | `asChild` 底层工具 | `@radix-ui/react-slot` |
| `Visually Hidden` | a11y 视觉隐藏 | `@radix-ui/react-visually-hidden` |
| `Direction Provider` | RTL 方向上下文 | `@radix-ui/react-direction` |
| `Accessible Icon` | 给图标加 aria-label | `@radix-ui/react-accessible-icon` |
| `One Time Password Field` | OTP 输入 | `@radix-ui/react-one-time-password-field` |
| `Password Toggle Field` | 密码可见性切换 | `@radix-ui/react-password-toggle-field` |
| `Toolbar` | 工具栏 | `@radix-ui/react-toolbar` |

> **聚合包 `radix-ui`** 通过 `import { Dialog, Dropdown } from "radix-ui"` 一次性引用所有。

## 2. Compound Component 模式深度

### 2.1 为什么 Radix 全部用 Compound Component

Radix Primitives **每个组件都拆成多个 sub-component**，按职责分层：

```tsx
<Dialog.Root>           {/* 状态容器：管理 open / 提供 context */}
  <Dialog.Trigger />    {/* 触发器：开关按钮 */}
  <Dialog.Portal>       {/* Portal：渲染到 body */}
    <Dialog.Overlay />  {/* 遮罩层：黑色背景 */}
    <Dialog.Content>    {/* 内容容器：实际对话框 */}
      <Dialog.Title />          {/* a11y 标题 */}
      <Dialog.Description />    {/* a11y 描述 */}
      <Dialog.Close />          {/* 关闭按钮 */}
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

**对比传统单组件 UI 库**：

```tsx
// Ant Design / MUI 风格：单组件 + 大量 props
<Dialog
  open={open}
  onClose={...}
  title="标题"
  description="描述"
  overlayProps={{ ... }}
  contentProps={{ ... }}
  triggerProps={{ ... }}
/>
```

**Compound Component 的优势**：
- **结构清晰**——一眼看穿 anatomy
- **可拆分**——Trigger 可以放在远离 Content 的地方
- **可单独样式**——每个 sub-component 独立 className
- **细粒度控制**——比如可以省略 Overlay、自定义 Portal 容器
- **可组合**——与其他 Primitive 嵌套时不冲突

### 2.2 Dialog 完整 Anatomy

```tsx
import * as Dialog from "@radix-ui/react-dialog";

<Dialog.Root
  open={open}                  // 受控 open
  onOpenChange={setOpen}       // 受控 callback
  defaultOpen={false}          // 非受控初始值
  modal={true}                 // 是否模态（默认 true）
>
  <Dialog.Trigger asChild />   {/* 触发器（任意子元素） */}

  <Dialog.Portal container={...}>  {/* container 可自定义 Portal 容器 */}
    <Dialog.Overlay
      className="..."
      forceMount               // 强制挂载（用于动画）
    />

    <Dialog.Content
      className="..."
      onEscapeKeyDown={...}              // Esc 回调
      onPointerDownOutside={...}         // 点击外部回调
      onInteractOutside={...}            // 任意外部交互
      onOpenAutoFocus={...}              // 打开自动聚焦
      onCloseAutoFocus={...}             // 关闭自动聚焦
      forceMount                         // 强制挂载
    >
      <Dialog.Title>...</Dialog.Title>
      <Dialog.Description>...</Dialog.Description>
      <Dialog.Close asChild />
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>;
```

### 2.3 Dropdown Menu 完整 Anatomy

```tsx
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

<DropdownMenu.Root>
  <DropdownMenu.Trigger asChild />

  <DropdownMenu.Portal>
    <DropdownMenu.Content
      side="bottom"            // top / right / bottom / left
      align="start"            // start / center / end
      sideOffset={4}           // 距 Trigger 的间距
      alignOffset={0}          // 沿 align 方向的偏移
      avoidCollisions={true}   // 自动避让视窗边缘
      collisionBoundary={null} // 碰撞边界
      sticky="partial"         // partial / always
      hideWhenDetached={false} // 滚出视窗时隐藏
    >
      <DropdownMenu.Label>分组标题</DropdownMenu.Label>

      <DropdownMenu.Item
        disabled={false}
        onSelect={(e) => { /* 选中回调，e.preventDefault() 阻止关闭 */ }}
        textValue="新建"  // typeahead 搜索文本
      >
        新建
      </DropdownMenu.Item>

      <DropdownMenu.Separator />

      {/* 复选项 */}
      <DropdownMenu.CheckboxItem
        checked={checked}
        onCheckedChange={setChecked}
      >
        <DropdownMenu.ItemIndicator>✓</DropdownMenu.ItemIndicator>
        显示工具栏
      </DropdownMenu.CheckboxItem>

      {/* 单选组 */}
      <DropdownMenu.RadioGroup value={value} onValueChange={setValue}>
        <DropdownMenu.RadioItem value="cn">
          <DropdownMenu.ItemIndicator>•</DropdownMenu.ItemIndicator>
          中文
        </DropdownMenu.RadioItem>
        <DropdownMenu.RadioItem value="en">
          <DropdownMenu.ItemIndicator>•</DropdownMenu.ItemIndicator>
          English
        </DropdownMenu.RadioItem>
      </DropdownMenu.RadioGroup>

      {/* 子菜单 */}
      <DropdownMenu.Sub>
        <DropdownMenu.SubTrigger>更多 ▶</DropdownMenu.SubTrigger>
        <DropdownMenu.Portal>
          <DropdownMenu.SubContent>
            <DropdownMenu.Item>导出 PDF</DropdownMenu.Item>
            <DropdownMenu.Item>导出 CSV</DropdownMenu.Item>
          </DropdownMenu.SubContent>
        </DropdownMenu.Portal>
      </DropdownMenu.Sub>

      <DropdownMenu.Arrow />
    </DropdownMenu.Content>
  </DropdownMenu.Portal>
</DropdownMenu.Root>;
```

### 2.4 Select 完整 Anatomy

```tsx
import * as Select from "@radix-ui/react-select";

<Select.Root
  value={value}
  onValueChange={setValue}
  defaultValue=""
  disabled={false}
  required={false}
  name="fruit"
>
  <Select.Trigger className="..." aria-label="水果">
    <Select.Value placeholder="请选择" />
    <Select.Icon>▼</Select.Icon>
  </Select.Trigger>

  <Select.Portal>
    <Select.Content
      position="popper"        // popper / item-aligned
      side="bottom"
      sideOffset={4}
    >
      <Select.ScrollUpButton>▲</Select.ScrollUpButton>
      <Select.Viewport>
        <Select.Group>
          <Select.Label>蔬菜</Select.Label>
          <Select.Item value="apple">
            <Select.ItemText>苹果</Select.ItemText>
            <Select.ItemIndicator>✓</Select.ItemIndicator>
          </Select.Item>
          <Select.Item value="banana">
            <Select.ItemText>香蕉</Select.ItemText>
            <Select.ItemIndicator>✓</Select.ItemIndicator>
          </Select.Item>
        </Select.Group>
        <Select.Separator />
      </Select.Viewport>
      <Select.ScrollDownButton>▼</Select.ScrollDownButton>
      <Select.Arrow />
    </Select.Content>
  </Select.Portal>
</Select.Root>;
```

### 2.5 Accordion 完整 Anatomy

```tsx
import * as Accordion from "@radix-ui/react-accordion";

<Accordion.Root
  type="single"            // single / multiple
  defaultValue="item-1"
  collapsible={true}       // type=single 时是否可全部折叠
  orientation="vertical"   // horizontal / vertical
  dir="ltr"                // ltr / rtl
>
  <Accordion.Item value="item-1">
    <Accordion.Header>
      <Accordion.Trigger>第一项</Accordion.Trigger>
    </Accordion.Header>
    <Accordion.Content>第一项的内容</Accordion.Content>
  </Accordion.Item>

  <Accordion.Item value="item-2">
    <Accordion.Header>
      <Accordion.Trigger>第二项</Accordion.Trigger>
    </Accordion.Header>
    <Accordion.Content>第二项的内容</Accordion.Content>
  </Accordion.Item>
</Accordion.Root>;
```

### 2.6 Tabs 完整 Anatomy

```tsx
import * as Tabs from "@radix-ui/react-tabs";

<Tabs.Root
  defaultValue="overview"
  orientation="horizontal"  // horizontal / vertical
  activationMode="automatic" // automatic / manual
>
  <Tabs.List aria-label="设置">
    <Tabs.Trigger value="overview">概览</Tabs.Trigger>
    <Tabs.Trigger value="profile">个人信息</Tabs.Trigger>
    <Tabs.Trigger value="security">安全</Tabs.Trigger>
  </Tabs.List>

  <Tabs.Content value="overview">概览内容</Tabs.Content>
  <Tabs.Content value="profile">个人信息内容</Tabs.Content>
  <Tabs.Content value="security">安全设置内容</Tabs.Content>
</Tabs.Root>;
```

> `activationMode="automatic"` —— 焦点移动到 Trigger 即激活该 Tab；`manual` —— 必须按 Enter / Space 才激活。

### 2.7 Toast 完整 Anatomy

```tsx
import * as Toast from "@radix-ui/react-toast";
import { useState } from "react";

function App() {
  const [open, setOpen] = useState(false);

  return (
    <Toast.Provider swipeDirection="right" duration={5000}>
      <button onClick={() => setOpen(true)}>显示 Toast</button>

      <Toast.Root open={open} onOpenChange={setOpen}>
        <Toast.Title>已保存</Toast.Title>
        <Toast.Description>你的更改已成功保存</Toast.Description>
        <Toast.Action altText="撤销" asChild>
          <button>撤销</button>
        </Toast.Action>
        <Toast.Close>×</Toast.Close>
      </Toast.Root>

      <Toast.Viewport className="fixed bottom-0 right-0 m-6" />
    </Toast.Provider>
  );
}
```

> Toast 设计**与其他 Primitive 不同**——`Provider` 包根、`Viewport` 放页面任意位置、每个 Toast 用 `Root` 独立管理 open 状态。**支持 swipe to dismiss、F8 跳转到 Viewport**。

## 3. Controlled vs Uncontrolled

所有 Primitive 都同时支持两种模式：

### 3.1 非受控（Uncontrolled）

```tsx
// 状态完全由 Radix 内部管理
<Dialog.Root defaultOpen={false}>
  ...
</Dialog.Root>
```

适合**简单场景**——只是点击按钮显示对话框。

### 3.2 受控（Controlled）

```tsx
const [open, setOpen] = useState(false);

<Dialog.Root open={open} onOpenChange={setOpen}>
  ...
</Dialog.Root>;

// 编程式打开
<button onClick={() => setOpen(true)}>外部打开</button>;
```

适合**程序化控制**——比如表单提交后自动打开成功 Dialog。

### 3.3 受控 Select 值变化

```tsx
const [fruit, setFruit] = useState("");

<Select.Root value={fruit} onValueChange={setFruit}>
  <Select.Trigger>
    <Select.Value placeholder="选择水果" />
  </Select.Trigger>
  ...
</Select.Root>;

// 同步到 URL / store
useEffect(() => {
  router.push(`/products?fruit=${fruit}`);
}, [fruit]);
```

## 4. asChild Slot 模式深度

### 4.1 默认渲染 vs asChild

```tsx
// 默认 —— Radix 渲染默认 button
<Dialog.Trigger>打开</Dialog.Trigger>
// DOM: <button>打开</button>

// asChild —— Radix 把 props 合并到你的子元素
<Dialog.Trigger asChild>
  <a href="#dialog">打开</a>
</Dialog.Trigger>
// DOM: <a href="#dialog" data-state="closed" aria-expanded="false" type="button">打开</a>
```

### 4.2 与 Next.js Link 组合

```tsx
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";

<Dialog.Trigger asChild>
  <Link href="/profile" className="text-blue-500">
    个人资料
  </Link>
</Dialog.Trigger>;
```

### 4.3 与 React Router Link 组合

```tsx
import { Link } from "react-router-dom";

<Dialog.Trigger asChild>
  <Link to="/settings" className="text-blue-500">
    设置
  </Link>
</Dialog.Trigger>;
```

### 4.4 自定义组件作为 Trigger

```tsx
// 自定义按钮组件 —— 必须 forwardRef + 展开 props
const MyButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<"button">
>(({ children, ...props }, ref) => (
  <button
    ref={ref}
    className="rounded-lg bg-indigo-600 px-4 py-2 text-white"
    {...props}
  >
    {children}
  </button>
));

// 使用
<Dialog.Trigger asChild>
  <MyButton>打开</MyButton>
</Dialog.Trigger>;
```

### 4.5 多层 asChild 嵌套

```tsx
// Tooltip + Dialog 嵌套
<Tooltip.Provider>
  <Tooltip.Root>
    <Tooltip.Trigger asChild>
      <Dialog.Trigger asChild>
        <button>带 Tooltip 的对话框按钮</button>
      </Dialog.Trigger>
    </Tooltip.Trigger>
    ...
  </Tooltip.Root>
</Tooltip.Provider>;
```

### 4.6 asChild 的两个硬性要求

1. **子元素必须接收并展开 props**——否则 Radix 注入的 `data-state` / `aria-*` / `onClick` 等会丢失
2. **子元素必须用 `React.forwardRef` 转发 ref**——Radix 需要测量 DOM 大小 / 设置焦点

```tsx
// 错误 —— props 未展开
const Bad = ({ children }: { children: React.ReactNode }) => (
  <button>{children}</button>
);

// 错误 —— ref 未转发
const Bad2 = ({ children, ...props }: any) => <button {...props}>{children}</button>;

// 正确
const Good = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<"button">>(
  ({ children, ...props }, ref) => (
    <button ref={ref} {...props}>
      {children}
    </button>
  ),
);
```

## 5. Portal 用法

### 5.1 默认 Portal 行为

Dialog / Popover / Dropdown / Tooltip / Select / Hover Card 等 overlay 类组件**默认 Portal 到 `<body>` 末端**：

```tsx
<Dialog.Portal>
  <Dialog.Overlay />
  <Dialog.Content>...</Dialog.Content>
</Dialog.Portal>
```

**好处**：
- 跳出父级 `overflow: hidden` 裁剪
- 跳出父级 `transform` / `filter` 锚定丢失
- 不受父级 `z-index` 层叠上下文影响

### 5.2 自定义 Portal 容器

```tsx
const containerRef = useRef<HTMLDivElement>(null);

return (
  <div ref={containerRef} className="relative">
    {/* 模态框限制在这个 div 内 */}
    <Dialog.Root>
      <Dialog.Portal container={containerRef.current}>
        <Dialog.Overlay />
        <Dialog.Content>...</Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  </div>
);
```

### 5.3 SSR / hydration

Radix React 18+ 自带 `useId` —— **SSR 不会出现 hydration warning**。Next.js App Router 中只需把使用 Radix 的组件加 `"use client"`。

### 5.4 跳过 Portal（不推荐）

```tsx
// 直接放 Content，不用 Portal —— 受父级 overflow 影响
<Dialog.Root>
  <Dialog.Trigger />
  <Dialog.Overlay />
  <Dialog.Content>...</Dialog.Content>
</Dialog.Root>
```

> 实际很少用。除非你**故意需要 Content 受父级影响**（如 inline popover）。

## 6. data-state + data-* 属性

Radix 在 DOM 元素上挂多个 `data-*` 属性，**所有这些属性都可用 CSS / Tailwind 选择器响应**。

### 6.1 完整属性列表

| 属性 | 可选值 | 出现位置 |
|------|--------|----------|
| `data-state` | `open` / `closed` / `instant-open` / `delayed-open` / `checked` / `unchecked` / `indeterminate` / `active` / `inactive` / `on` / `off` | 几乎所有 stateful Primitive |
| `data-side` | `top` / `right` / `bottom` / `left` | Popover / Tooltip / Dropdown / Select / Hover Card Content |
| `data-align` | `start` / `center` / `end` | Popover / Tooltip / Dropdown / Select / Hover Card Content |
| `data-orientation` | `horizontal` / `vertical` | Accordion / Tabs / Slider / Separator / Toolbar |
| `data-disabled` | （存在即禁用） | 任何可禁用元素 |
| `data-highlighted` | （存在即键盘高亮） | Menu Item / Select Item / Combobox Item |
| `data-placeholder` | （存在即占位状态） | Select Value（未选中时）|
| `data-collision-padding-side` | side 值 | Popper 类组件碰撞调整 |

### 6.2 Tailwind data-* 选择器语法

Tailwind v3+ 原生支持：

```tsx
<Dialog.Overlay
  className="
    bg-black/50
    data-[state=open]:animate-in
    data-[state=closed]:animate-out
    data-[state=closed]:fade-out-0
    data-[state=open]:fade-in-0
  "
/>

<Dialog.Content
  className="
    data-[state=open]:zoom-in-95
    data-[state=closed]:zoom-out-95
    data-[state=open]:slide-in-from-bottom-2
  "
/>

<DropdownMenu.Item
  className="
    rounded px-2 py-1.5
    outline-none
    data-[highlighted]:bg-blue-100
    data-[highlighted]:text-blue-900
    data-[disabled]:opacity-50
    data-[disabled]:pointer-events-none
  "
/>

<Popover.Content
  className="
    data-[side=top]:animate-slideDownAndFade
    data-[side=bottom]:animate-slideUpAndFade
    data-[side=left]:animate-slideRightAndFade
    data-[side=right]:animate-slideLeftAndFade
  "
/>
```

### 6.3 纯 CSS data-* 选择器

```css
.Trigger[data-state="open"] {
  background-color: var(--accent-9);
}

.Trigger[data-state="closed"] {
  background-color: white;
}

.Content[data-side="top"] {
  animation: slideDownAndFade 200ms ease-out;
}

.Content[data-side="bottom"] {
  animation: slideUpAndFade 200ms ease-out;
}

.Item[data-highlighted] {
  background-color: var(--accent-3);
}

.Item[data-disabled] {
  color: var(--gray-8);
  pointer-events: none;
}
```

## 7. CSS 变量动画

Radix 把组件几何信息暴露为 **CSS 变量**——纯 CSS 即可实现复杂动画，**不需要 JS 测量 DOM**。

### 7.1 Accordion 展开高度

```css
.AccordionContent[data-state="open"] {
  animation: slideDown 200ms ease-out;
}
.AccordionContent[data-state="closed"] {
  animation: slideUp 200ms ease-out;
}

@keyframes slideDown {
  from { height: 0; }
  to { height: var(--radix-accordion-content-height); }
}

@keyframes slideUp {
  from { height: var(--radix-accordion-content-height); }
  to { height: 0; }
}
```

Tailwind v4 配置：

```css
@theme {
  --animate-slideDown: slideDown 200ms ease-out;
  --animate-slideUp: slideUp 200ms ease-out;
}

@keyframes slideDown {
  from { height: 0; }
  to { height: var(--radix-accordion-content-height); }
}
```

### 7.2 Collapsible 展开高度

```css
.CollapsibleContent[data-state="open"] {
  animation: slideDown 200ms ease-out;
}
@keyframes slideDown {
  from { height: 0; }
  to { height: var(--radix-collapsible-content-height); }
}
```

### 7.3 Dialog / Popover / Tooltip 变换原点

```css
.DialogContent[data-state="open"] {
  animation: contentShow 150ms cubic-bezier(0.16, 1, 0.3, 1);
  transform-origin: var(--radix-dialog-content-transform-origin);
}

@keyframes contentShow {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

> 这样 Tooltip 从 Trigger 方向缩放出来 —— **不需要 JS 计算锚点**。

### 7.4 Trigger 宽度同步

```css
.PopoverContent {
  width: var(--radix-popover-trigger-width);
}
```

适合**搜索框下拉建议**等场景——Content 宽度与 Trigger 一致。

### 7.5 视窗可用空间

```css
.PopoverContent {
  max-height: var(--radix-popover-content-available-height);
}
```

> Content 自动限制最大高度为视窗可用空间，**避免溢出屏幕**。

### 7.6 CSS 变量命名空间完整列表

| 变量 | 出现位置 | 含义 |
|------|----------|------|
| `--radix-popper-anchor-width` | Popper 类 | Anchor 宽度 |
| `--radix-popper-anchor-height` | Popper 类 | Anchor 高度 |
| `--radix-popper-available-width` | Popper 类 | 视窗可用宽度 |
| `--radix-popper-available-height` | Popper 类 | 视窗可用高度 |
| `--radix-popper-transform-origin` | Popper 类 | 变换原点 |
| `--radix-{name}-content-transform-origin` | 各组件 | 同上别名 |
| `--radix-{name}-trigger-width` | 各组件 | Trigger 宽度 |
| `--radix-{name}-trigger-height` | 各组件 | Trigger 高度 |
| `--radix-{name}-content-available-width` | 各组件 | Content 可用宽度 |
| `--radix-{name}-content-available-height` | 各组件 | Content 可用高度 |
| `--radix-accordion-content-height` | Accordion | 内容实际高度 |
| `--radix-accordion-content-width` | Accordion | 内容实际宽度 |
| `--radix-collapsible-content-height` | Collapsible | 内容实际高度 |
| `--radix-collapsible-content-width` | Collapsible | 内容实际宽度 |
| `--radix-toast-swipe-move-x` | Toast | swipe X 偏移 |
| `--radix-toast-swipe-move-y` | Toast | swipe Y 偏移 |
| `--radix-toast-swipe-end-x` | Toast | swipe 结束 X |
| `--radix-toast-swipe-end-y` | Toast | swipe 结束 Y |
| `--radix-scroll-area-corner-width` | Scroll Area | 角落宽度 |
| `--radix-scroll-area-corner-height` | Scroll Area | 角落高度 |

## 8. 键盘导航全表

### 8.1 Dialog / Alert Dialog

| 键 | 行为 |
|----|------|
| `Tab` | 焦点在内部循环 |
| `Shift + Tab` | 反向循环 |
| `Esc` | 关闭（仅 modal 模式 + onEscapeKeyDown 未阻止） |

### 8.2 Dropdown Menu / Context Menu / Menubar

| 键 | 行为 |
|----|------|
| `Space` / `Enter` | 选中当前 Item |
| `Arrow Down` / `Arrow Up` | 上下导航 |
| `Arrow Right` | 进入 SubMenu |
| `Arrow Left` | 返回上级菜单 |
| `Home` / `End` | 跳转到首尾 |
| `Esc` | 关闭菜单 |
| 字母键 | typeahead 搜索 Item |

### 8.3 Select

| 键 | 行为 |
|----|------|
| `Space` / `Enter` | 打开 / 选中 |
| `Arrow Down` / `Arrow Up` | 上下导航选项 |
| `Home` / `End` | 跳转到首尾 |
| `Esc` | 关闭 |
| 字母键 | typeahead 搜索 |

### 8.4 Tabs

| 键 | 行为 |
|----|------|
| `Tab` | 进入 / 离开 Tabs 区域 |
| `Arrow Left` / `Arrow Right` | 切换 Trigger（horizontal） |
| `Arrow Up` / `Arrow Down` | 切换 Trigger（vertical） |
| `Home` / `End` | 首尾 Trigger |

### 8.5 Accordion

| 键 | 行为 |
|----|------|
| `Space` / `Enter` | 展开 / 折叠 |
| `Arrow Down` / `Arrow Up` | 上下导航 Trigger |
| `Home` / `End` | 首尾 Trigger |

### 8.6 Slider

| 键 | 行为 |
|----|------|
| `Arrow Left` / `Arrow Right` | 减小 / 增大 step |
| `Arrow Up` / `Arrow Down` | 减小 / 增大 step |
| `Page Up` / `Page Down` | 大步进 |
| `Home` / `End` | 跳到 min / max |

### 8.7 Toast

| 键 | 行为 |
|----|------|
| `F8` | 跳转到 Toast Viewport |
| `Esc` | 关闭最新 Toast（在 Viewport 内时） |

### 8.8 Popover / Tooltip / Hover Card

| 键 | 行为 |
|----|------|
| `Space` / `Enter` | 打开 / 关闭 Popover Trigger |
| `Tab` | 进入 Content 内部 |
| `Esc` | 关闭 |

## 9. Tailwind 集成最佳实践

### 9.1 安装 tailwindcss-animate（可选）

shadcn/ui 默认使用 `tailwindcss-animate` 插件，提供 `animate-in` / `animate-out` 等便利类：

```bash
pnpm add tailwindcss-animate
```

`tailwind.config.ts`（Tailwind v3）：

```ts
import animate from "tailwindcss-animate";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  plugins: [animate],
};
```

> Tailwind v4 通过 `@plugin "tailwindcss-animate"` 在 CSS 中引入。

### 9.2 典型动画类组合

```tsx
<Dialog.Overlay
  className="
    fixed inset-0 z-50 bg-black/50
    data-[state=open]:animate-in data-[state=open]:fade-in-0
    data-[state=closed]:animate-out data-[state=closed]:fade-out-0
  "
/>

<Dialog.Content
  className="
    fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2
    data-[state=open]:animate-in data-[state=open]:zoom-in-95
    data-[state=closed]:animate-out data-[state=closed]:zoom-out-95
    data-[state=open]:slide-in-from-bottom-2
  "
/>

<DropdownMenu.Content
  className="
    data-[side=top]:slide-in-from-bottom-2
    data-[side=bottom]:slide-in-from-top-2
    data-[side=left]:slide-in-from-right-2
    data-[side=right]:slide-in-from-left-2
  "
/>
```

### 9.3 自定义 keyframes（Tailwind v4）

```css
@theme {
  --animate-slideUpAndFade: slideUpAndFade 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  --animate-slideDownAndFade: slideDownAndFade 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUpAndFade {
  from { opacity: 0; transform: translateY(2px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideDownAndFade {
  from { opacity: 0; transform: translateY(-2px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### 9.4 cn 工具函数（合并 className）

```ts
// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

使用：

```tsx
import { cn } from "@/lib/utils";

<Dialog.Content className={cn("base-styles", className)}>
  ...
</Dialog.Content>;
```

## 10. Radix Themes 完整体系

> 注意：以下所有内容**仅适用于 Radix Themes（`@radix-ui/themes`）**，不适用于 Primitives。

### 10.1 Theme 组件完整 Props

```tsx
import { Theme } from "@radix-ui/themes";

<Theme
  accentColor="indigo"      // 主色（16 选 1）
  grayColor="slate"         // 灰色（6 选 1 + auto）
  panelBackground="solid"   // solid / translucent
  radius="medium"           // none / small / medium / large / full
  scaling="100%"            // 90% / 95% / 100% / 105% / 110%
  appearance="light"        // light / dark / inherit
  hasBackground={true}      // 是否给 body 加背景色
  asChild={false}           // 是否合并到子元素
>
  {children}
</Theme>;
```

### 10.2 accentColor 16 个选项

```
gray, gold, bronze, brown, yellow, amber, orange, tomato,
red, ruby, crimson, pink, plum, purple, violet, iris, indigo,
blue, cyan, teal, jade, green, grass, lime, mint, sky
```

> 实际是 **26 个**——文档里有时按主色调列 16 个。

### 10.3 grayColor 6 个选项

```
gray, mauve, slate, sage, olive, sand, auto
```

> `auto` —— Radix 根据 `accentColor` 自动配对最佳灰色。

### 10.4 嵌套 Theme（局部覆盖）

```tsx
<Theme accentColor="indigo">
  <App>
    {/* 局部覆盖：这一块用 red 主色 */}
    <Theme accentColor="red" asChild>
      <section>
        <Button>红色按钮</Button>
      </section>
    </Theme>
  </App>
</Theme>
```

### 10.5 Layout 系统统一 Props

Radix Themes 的 **Box / Flex / Grid / Container / Section** 共享 **30+ Layout props**：

```tsx
<Flex
  // Display
  display="flex"

  // Flex 特有
  direction="row"           // row / column / row-reverse / column-reverse
  align="center"            // start / center / end / baseline / stretch
  justify="between"         // start / center / end / between
  wrap="wrap"               // nowrap / wrap / wrap-reverse
  gap="4"                   // 0-9（间距 token）
  gapX="2"
  gapY="3"

  // 尺寸
  width="100%"
  minWidth="200px"
  maxWidth="500px"
  height="auto"
  minHeight="100vh"
  maxHeight="600px"

  // 间距
  m="2"      // margin
  mt="2"     // margin-top
  mr="2"     mb="2"     ml="2"
  mx="4"     my="4"
  p="3"      // padding
  pt="3"     pr="3"     pb="3"     pl="3"
  px="4"     py="4"

  // 定位
  position="relative"       // static / relative / absolute / fixed / sticky
  top="0"     right="0"     bottom="0"   left="0"
  inset="0"

  // 溢出
  overflow="hidden"         // visible / hidden / scroll / auto
  overflowX="auto"
  overflowY="auto"

  // Flex 子项
  flexGrow="1"
  flexShrink="0"
  flexBasis="200px"

  // Grid 特有（仅 Grid 组件）
  columns="3"
  rows="2"
  flow="row"

  // 响应式（所有 props 都支持对象语法）
  p={{ initial: "2", md: "4", lg: "6" }}
  gap={{ initial: "2", md: "4" }}
>
  ...
</Flex>;
```

### 10.6 间距 token（spacing scale）

| Token | 值 |
|-------|-----|
| `0` | 0px |
| `1` | 4px |
| `2` | 8px |
| `3` | 12px |
| `4` | 16px |
| `5` | 24px |
| `6` | 32px |
| `7` | 40px |
| `8` | 48px |
| `9` | 64px |

### 10.7 Typography 体系

```tsx
import { Heading, Text, Em, Strong, Code, Kbd, Blockquote, Quote } from "@radix-ui/themes";

<Heading size="6" weight="bold" mb="2">页面标题</Heading>

<Text size="3" weight="regular" color="gray">
  正文内容 <Strong>强调</Strong> 还有 <Em>斜体</Em> 和 <Code>代码</Code>。
</Text>

<Text size="2" color="gray">
  按下 <Kbd>Ctrl+K</Kbd> 打开搜索。
</Text>

<Blockquote>这是一段引用。</Blockquote>

<Text>这是 <Quote>引号包裹</Quote> 的文字。</Text>
```

**Text / Heading 共享 props**：

- `size="1"` ~ `"9"`（9 档字号）
- `weight="light"` / `"regular"` / `"medium"` / `"bold"`
- `color="indigo"` / `"red"` / 任意 accent
- `align="left"` / `"center"` / `"right"`
- `truncate={true}` （单行省略）
- `wrap="wrap"` / `"nowrap"` / `"balance"`（CSS text-wrap）
- `trim="normal"` / `"start"` / `"end"` / `"both"`（trim text 上下空白）

### 10.8 Form 系统

```tsx
import {
  TextField,
  TextArea,
  Checkbox,
  CheckboxGroup,
  RadioGroup,
  Radio,
  Select,
  Switch,
  Slider,
  Button,
} from "@radix-ui/themes";

<form>
  {/* 文本输入 */}
  <TextField.Root size="3" placeholder="搜索...">
    <TextField.Slot side="left">🔍</TextField.Slot>
    <TextField.Slot side="right">
      <Button size="1">提交</Button>
    </TextField.Slot>
  </TextField.Root>

  {/* 多行 */}
  <TextArea placeholder="留言" size="3" rows={4} />

  {/* 复选框 */}
  <Checkbox defaultChecked /> 同意条款

  {/* 复选框组 */}
  <CheckboxGroup.Root defaultValue={["1"]}>
    <CheckboxGroup.Item value="1">选项 1</CheckboxGroup.Item>
    <CheckboxGroup.Item value="2">选项 2</CheckboxGroup.Item>
  </CheckboxGroup.Root>

  {/* 单选组 */}
  <RadioGroup.Root defaultValue="m">
    <RadioGroup.Item value="m">男</RadioGroup.Item>
    <RadioGroup.Item value="f">女</RadioGroup.Item>
  </RadioGroup.Root>

  {/* 下拉选择 */}
  <Select.Root defaultValue="apple">
    <Select.Trigger />
    <Select.Content>
      <Select.Item value="apple">苹果</Select.Item>
      <Select.Item value="banana">香蕉</Select.Item>
    </Select.Content>
  </Select.Root>

  {/* 开关 */}
  <Switch defaultChecked /> 启用通知

  {/* 滑块 */}
  <Slider defaultValue={[50]} max={100} step={1} />

  <Button type="submit" size="3">
    提交
  </Button>
</form>;
```

### 10.9 Display / Feedback 组件

```tsx
import {
  Card,
  Box,
  Avatar,
  Badge,
  Callout,
  Spinner,
  Skeleton,
  Progress,
  DataList,
  Separator,
} from "@radix-ui/themes";

<Card size="3">
  <Flex align="center" gap="3">
    <Avatar
      src="https://example.com/avatar.jpg"
      fallback="J"
      size="4"
      radius="full"
    />
    <Box>
      <Heading size="4">张三</Heading>
      <Text size="2" color="gray">高级工程师</Text>
    </Box>
  </Flex>
</Card>

<Badge color="green" variant="soft">在线</Badge>
<Badge color="red" variant="solid">离线</Badge>

<Callout.Root color="blue">
  <Callout.Icon>ℹ️</Callout.Icon>
  <Callout.Text>这是一个提示信息</Callout.Text>
</Callout.Root>

<Spinner size="3" />
<Skeleton width="200px" height="20px" />
<Progress value={75} size="3" />

<DataList.Root>
  <DataList.Item>
    <DataList.Label minWidth="88px">状态</DataList.Label>
    <DataList.Value>已验证</DataList.Value>
  </DataList.Item>
  <DataList.Item>
    <DataList.Label minWidth="88px">邮箱</DataList.Label>
    <DataList.Value>jane@example.com</DataList.Value>
  </DataList.Item>
</DataList.Root>

<Separator orientation="horizontal" size="4" />
```

### 10.10 Navigation 组件

```tsx
import {
  Tabs,
  TabNav,
  SegmentedControl,
  DropdownMenu,
  ContextMenu,
  Link,
} from "@radix-ui/themes";

{/* 标签页 */}
<Tabs.Root defaultValue="overview">
  <Tabs.List>
    <Tabs.Trigger value="overview">概览</Tabs.Trigger>
    <Tabs.Trigger value="settings">设置</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="overview">...</Tabs.Content>
  <Tabs.Content value="settings">...</Tabs.Content>
</Tabs.Root>

{/* 导航 Tab（带 href） */}
<TabNav.Root>
  <TabNav.Link href="/">首页</TabNav.Link>
  <TabNav.Link href="/about" active>关于</TabNav.Link>
</TabNav.Root>

{/* 分段控件 */}
<SegmentedControl.Root defaultValue="day">
  <SegmentedControl.Item value="day">日</SegmentedControl.Item>
  <SegmentedControl.Item value="week">周</SegmentedControl.Item>
  <SegmentedControl.Item value="month">月</SegmentedControl.Item>
</SegmentedControl.Root>

{/* 文本链接 */}
<Link href="/docs">查看文档</Link>
```

## 11. Radix Colors 12 阶色板深度

[Radix Colors](https://www.radix-ui.com/colors) 是 Radix 团队**独立**发布的色板系统——已被 Tailwind / 业界广泛吸收。

### 11.1 12 阶语义

| 步骤 | 用途 |
|------|------|
| 1 | App 背景 |
| 2 | 微妙背景 |
| 3 | UI 元素背景 |
| 4 | hover UI 背景 |
| 5 | active / 选中背景 |
| 6 | 微妙边框 |
| 7 | UI 边框 |
| 8 | hover 边框 |
| 9 | **实色填充（如 primary 按钮）** |
| 10 | hover 实色 |
| 11 | **低对比度文字** |
| 12 | **高对比度文字** |

### 11.2 CSS 变量直接引用

在 `<Theme accentColor="indigo">` 内部：

```css
.MyComponent {
  background: var(--accent-3);
  color: var(--accent-11);
  border: 1px solid var(--accent-6);
}

.MyComponent:hover {
  background: var(--accent-4);
  border-color: var(--accent-8);
}

.MyButton {
  background: var(--accent-9);
  color: white;
}

.MyButton:hover {
  background: var(--accent-10);
}
```

**通用 accent / gray**：

```css
:root {
  --my-color: var(--accent-9);
  --my-text: var(--gray-12);
  --my-border: var(--gray-6);
}
```

### 11.3 暗色模式自动反转

`<Theme appearance="dark">` 切换时——**所有 1-12 阶自动反转**，**你的代码不需要任何变化**：

```css
/* 浅色：accent-3 是浅蓝、accent-12 是深蓝 */
/* 暗色：accent-3 是深蓝、accent-12 是浅蓝 */
.MyTag {
  background: var(--accent-3);
  color: var(--accent-12);
}
```

### 11.4 Alpha 变体

每色板还有 `--accent-a1` ~ `--accent-a12`（透明变体）—— 适合**悬浮在彩色背景上**。

### 11.5 与 Tailwind 配合

如果想**在 Tailwind 中使用 Radix Colors**：

```bash
pnpm add @radix-ui/colors
```

`tailwind.config.ts`：

```ts
import { indigo, indigoDark, gray, grayDark } from "@radix-ui/colors";

export default {
  theme: {
    extend: {
      colors: {
        ...indigo,        // indigo1, indigo2, ..., indigo12
        ...gray,
      },
    },
  },
};
```

> 这样你的 Tailwind 项目就可以用 `bg-indigo3` / `text-gray12` 了。

## 12. Next.js App Router 完整集成

### 12.1 项目结构

```
my-app/
├── app/
│   ├── layout.tsx           # Server Component（无 Radix）
│   ├── page.tsx             # Server Component（包含 Client 子组件）
│   └── (components)/
│       └── login-dialog.tsx # Client Component（用 Radix）
├── src/
│   └── lib/utils.ts
└── package.json
```

### 12.2 Layout（Server Component）

```tsx
// app/layout.tsx
import type { Metadata } from "next";
import "@radix-ui/themes/styles.css";   // 仅 Themes 路线
import { Theme } from "@radix-ui/themes"; // 仅 Themes 路线
import { ThemeProvider } from "next-themes";
import "./globals.css";

export const metadata: Metadata = {
  title: "我的应用",
};

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

### 12.3 Page（Server Component）

```tsx
// app/page.tsx
import { LoginDialog } from "./(components)/login-dialog";

export default function Home() {
  return (
    <main className="p-8">
      <h1>首页</h1>
      <LoginDialog />
    </main>
  );
}
```

### 12.4 Client Component（用 Radix）

```tsx
// app/(components)/login-dialog.tsx
"use client"; // 必须

import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";

export function LoginDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="rounded bg-indigo-600 px-4 py-2 text-white">
        登录
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-96 -translate-x-1/2 -translate-y-1/2 rounded bg-white p-6">
          <Dialog.Title>登录</Dialog.Title>
          <Dialog.Description>请输入邮箱和密码</Dialog.Description>
          ...
          <Dialog.Close className="absolute right-2 top-2">×</Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

### 12.5 suppressHydrationWarning

`<html suppressHydrationWarning>` —— **避免 next-themes 切换 class 时的 hydration warning**。

## 13. 与 shadcn/ui 协作

### 13.1 shadcn 初始化

```bash
pnpm dlx shadcn@latest init
```

回答（推荐）：
```
- TypeScript: yes
- Style: Default / New York
- Base color: Slate / Gray / Zinc
- CSS variables: yes
```

### 13.2 add 组件

```bash
pnpm dlx shadcn@latest add dialog dropdown-menu button card tabs
```

shadcn **拷贝代码到 `src/components/ui/`**，每个文件本质是 Radix Primitive 的 Tailwind 包装。

### 13.3 修改 shadcn 拷贝来的组件

```tsx
// src/components/ui/dialog.tsx —— 这是你自己的代码，随便改
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

// 你可以：
// - 加自己的 className
// - 修改默认 props
// - 添加新功能
// - 删除不需要的 sub-component
// - 重命名 export
```

### 13.4 用 shadcn 组件

```tsx
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

<Dialog>
  <DialogTrigger asChild>
    <Button>打开</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogTitle>标题</DialogTitle>
    ...
  </DialogContent>
</Dialog>;
```

> **shadcn 的 `<Dialog>` 等同于 Radix 的 `Dialog.Root`**——shadcn 把 Dot Notation 改成了 PascalCase 命名以更接近常规组件库。

## 14. 常见踩坑与排查

### 14.1 Portal 与 SSR

Radix Portal 是 React 18 的 `createPortal` —— **必须在 Client Component 使用**。

**症状**：Next.js 报 `useState is not a function` 或 hydration warning。

**修复**：在使用 Radix 的组件文件顶部加 `"use client";`。

### 14.2 asChild 子组件必须 forwardRef

**症状**：使用自定义组件作为 Trigger 时，**点击没反应** / **焦点跳不到 Trigger**。

**原因**：子组件没 forwardRef、没展开 props。

**修复**：

```tsx
// 错误
const MyButton = ({ children, ...props }) => (
  <button {...props}>{children}</button>
);

// 正确
const MyButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<"button">
>(({ children, ...props }, ref) => (
  <button ref={ref} {...props}>{children}</button>
));
```

### 14.3 Controlled 状态丢失

**症状**：受控 Dialog 被 unmount 后再 mount，open 状态变成 false。

**原因**：父组件销毁了 `useState`。

**修复**：把状态提升到更高层级（如 zustand store / URL state）。

### 14.4 Dialog Title 警告

**症状**：控制台 warning：`DialogContent requires a DialogTitle for accessibility`。

**修复**：必须加 `<Dialog.Title>`，如果视觉上不需要标题，用 `<VisuallyHidden>`：

```tsx
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

<Dialog.Content>
  <VisuallyHidden.Root asChild>
    <Dialog.Title>对话框标题</Dialog.Title>
  </VisuallyHidden.Root>
  ...
</Dialog.Content>;
```

### 14.5 Dialog Description 警告

类似 Title——如果不需要 Description，传 `aria-describedby={undefined}`：

```tsx
<Dialog.Content aria-describedby={undefined}>
  <Dialog.Title>标题</Dialog.Title>
  {/* 不需要 Description */}
</Dialog.Content>
```

### 14.6 z-index 仍然冲突

**症状**：Dialog Overlay 在某些 Toast / Tooltip 之下。

**修复**：显式给 Overlay / Content 加更高 z-index：

```tsx
<Dialog.Overlay className="z-[100]" />
<Dialog.Content className="z-[100]" />
```

### 14.7 Tailwind data-* 不生效

**症状**：`data-[state=open]:bg-blue-500` 没效果。

**原因**：
- Tailwind 版本 < 3.2（不支持 data-* 选择器）
- className 写法有空格 / 多余引号

**修复**：升级 Tailwind 到 3.2+ 或 4.0+。

### 14.8 Radix Themes 与 Tailwind 混用样式冲突

**症状**：Themes 组件被 Tailwind preflight 重置。

**修复**：
- 在 Theme 包根前 import Themes CSS、在后 import Tailwind CSS
- 或在 `tailwind.config.ts` 中 `corePlugins: { preflight: false }`
- **建议**：Primitives + Tailwind / Themes 单独使用，不混用

### 14.9 Form Primitive 校验不触发

**症状**：`<Form.Message match="valueMissing">` 不显示。

**原因**：浏览器原生 ValidityState 必须**先触发表单提交**才会显示。

**修复**：用户点击 submit 时浏览器自动校验。或手动调用 `formRef.current.checkValidity()`。

### 14.10 next-themes 切换暗色后 Radix Themes 不变

**症状**：next-themes 切到 dark，但 Radix Themes 仍是亮色。

**原因**：next-themes 默认在 `<html>` 上加 `class="dark"`，但 Radix Themes 监听 `appearance` prop。

**修复**：动态读取 next-themes 并传给 Theme：

```tsx
"use client";
import { useTheme } from "next-themes";
import { Theme } from "@radix-ui/themes";

function MyTheme({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  return (
    <Theme appearance={resolvedTheme === "dark" ? "dark" : "light"}>
      {children}
    </Theme>
  );
}
```

或更简单——`<Theme appearance="inherit">` 让它跟随 `<html>` 的 `data-theme` / `class`（需要在 next-themes 中配置 `attribute="data-theme"`）。

### 14.11 Trigger 宽度同步 Content 不工作

**症状**：CSS `width: var(--radix-popover-trigger-width)` 没效果。

**原因**：CSS 变量只在 Content 元素内部可用，**不在 Portal 容器内**。

**修复**：把 width 写在 Content 自己的 className 上：

```tsx
<Popover.Content
  style={{ width: "var(--radix-popover-trigger-width)" }}
  // 或 Tailwind v4 arbitrary
  className="w-[var(--radix-popover-trigger-width)]"
>
  ...
</Popover.Content>
```

### 14.12 选项数量大 Select 性能慢

**症状**：Select 内 500+ Item 卡顿。

**原因**：Radix Select 不内置虚拟化。

**修复**：用 **Combobox 模式**（Radix 没自带，但可以用 [cmdk](https://cmdk.paco.me) 或 [react-aria Combobox](https://react-spectrum.adobe.com/react-aria/Combobox.html) 替代）。

### 14.13 模态 Dialog 阻止 body 滚动失效

**症状**：Dialog 打开后页面仍然可以滚动。

**原因**：默认行为应该已经禁用 body 滚动 —— 检查是否有 CSS `body { overflow: visible !important }` 覆盖。

**修复**：移除冲突 CSS。

## 15. 完成指南后

掌握上述内容后可继续阅读：

- [参考](./reference.md)：30+ Primitives API 速查 / 70+ Themes API 速查 / 键盘快捷键全表 / CSS 变量全表 / TypeScript 类型
- [shadcn/ui 官方文档](https://ui.shadcn.com)：Radix 上层最流行实践
- [Radix Examples](https://www.radix-ui.com/primitives/example)：官方完整示例
- [Radix Themes Playground](https://www.radix-ui.com/themes/playground)：实时调主题
- [Radix Colors](https://www.radix-ui.com/colors)：12 阶语义色板
