---
layout: doc
outline: [2, 3]
---

# Headless UI 指南

本文围绕 **Headless UI v2 React + v1 Vue** 两条产品线，**深度梳理** 16 个组件的完整 anatomy、内置 Anchor Positioning、data-* 属性与 Tailwind variant 集成、Render Props 双模式、Field 表单 ARIA 自动注入、Combobox 虚拟滚动、Transition、`as` Prop、SSR、v1 → v2 迁移、Vue v1 与 React v2 差异、常见踩坑。

> 本指南假设你已经读过 [入门](./getting-started.md)，掌握了 Menu / Dialog / Combobox / Switch 四个基础组件的用法。

## 1. 16 个组件全部分组

Headless UI v2 共有 **16 个组件**，可分为 **5 大分类**：

### 1.1 Menu 类（下拉菜单） —— 4 个

| 组件 | 用途 | 关键子组件 |
|------|------|----------|
| `Menu` | 下拉菜单（action menu） | `MenuButton` / `MenuItems` / `MenuItem` / `MenuSection` / `MenuHeading` / `MenuSeparator` |
| `Listbox` | 单/多选下拉（custom select） | `ListboxButton` / `ListboxOptions` / `ListboxOption` / `ListboxSelectedOption` |
| `Combobox` | 搜索可输入下拉（autocomplete） | `ComboboxInput` / `ComboboxButton` / `ComboboxOptions` / `ComboboxOption` |
| `Select` | 原生 `<select>` 增强 | 单一组件 |

### 1.2 Overlay 类（浮层） —— 2 个

| 组件 | 用途 | 关键子组件 |
|------|------|----------|
| `Dialog` | 模态对话框 | `DialogBackdrop` / `DialogPanel` / `DialogTitle` / `DialogDescription` |
| `Popover` | 浮窗（任意内容） | `PopoverButton` / `PopoverPanel` / `PopoverGroup` / `PopoverBackdrop` |

### 1.3 Disclosure 类（展开收起） —— 2 个

| 组件 | 用途 | 关键子组件 |
|------|------|----------|
| `Disclosure` | 单项折叠 | `DisclosureButton` / `DisclosurePanel` |
| `TabGroup` | 标签页 | `TabList` / `Tab` / `TabPanels` / `TabPanel` |

### 1.4 Form 类（表单） —— 7 个

| 组件 | 用途 | 关键子组件 |
|------|------|----------|
| `Checkbox` | 复选框（v2 新） | 单一组件 |
| `RadioGroup` | 单选组 | `Radio` |
| `Switch` | 开关 | 单一组件 |
| `Input` | 文本输入（v2 新） | 单一组件 |
| `Textarea` | 多行文本（v2 新） | 单一组件 |
| `Select` | 下拉选择（v2 新，原生 select 增强） | 单一组件 |
| `Fieldset` | 表单分组（v2 新） | `Legend` |

### 1.5 Utility 类（实用组件） —— 5 个

| 组件 | 用途 |
|------|------|
| `Field` | 表单字段容器（v2 新，自动 ARIA wiring） |
| `Label` | 关联表单控件的 Label |
| `Description` | 表单字段描述 |
| `Button` | 通用按钮（v2 新，handles a11y） |
| `Transition` | 动画包装 |

### 1.6 Vue v1 限制

Vue 版仅 13 个组件，**缺失**：

- Checkbox / Input / Select / Textarea / Field / Fieldset / Legend / Description / Button（v2 新表单 + 工具组件）
- 没有 `transition` prop（v2 内置）
- 没有 `anchor` prop（v2 内置）
- Combobox 没有 `virtual.options`

## 2. Anchor Positioning 深度（v2 杀手锏）

### 2.1 概念

v2 内置 [Floating UI](https://floating-ui.com) —— **`Menu` / `Listbox` / `Combobox` / `Popover` 组件的内容部分**（`MenuItems` / `ListboxOptions` / `ComboboxOptions` / `PopoverPanel`）**接受 `anchor` prop**。

```tsx
<MenuItems anchor="bottom start">
  ...
</MenuItems>
```

### 2.2 `anchor` 字符串语法

```
<position> <align>
```

- **`position`**：`top` / `bottom` / `left` / `right`
- **`align`**：`start` / `center`（默认）/ `end`

合法值：

- `"top"` / `"top start"` / `"top center"` / `"top end"`
- `"bottom"` / `"bottom start"` / `"bottom end"`
- `"left"` / `"right"` / 类似

### 2.3 `anchor` 对象语法

```tsx
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
```

### 2.4 CSS 变量配置（推荐：Tailwind 友好）

```tsx
<MenuItems
  anchor="bottom end"
  className="[--anchor-gap:8px] [--anchor-padding:16px] [--anchor-offset:-4px]"
>
  ...
</MenuItems>
```

完整 CSS 变量清单：

| 变量 | 含义 | 默认值 |
|------|------|--------|
| `--anchor-gap` | 距 Trigger 的距离 | 0 |
| `--anchor-offset` | 沿对齐方向的偏移 | 0 |
| `--anchor-padding` | 视窗最小距离 | 0 |
| `--button-width` | Trigger 的宽度（只读） | 自动 |
| `--input-width` | ComboboxInput 的宽度（只读） | 自动 |

### 2.5 Dropdown 宽度匹配按钮

```tsx
<Menu>
  <MenuButton className="px-4 py-2">长长长长的按钮</MenuButton>
  <MenuItems
    anchor="bottom start"
    className="w-(--button-width)"
  >
    ...
  </MenuItems>
</Menu>
```

`w-(--button-width)` 是 **Tailwind 4 任意值语法** —— 自动让 dropdown 与按钮等宽。

### 2.6 自动碰撞翻转

**`anchor` 的默认行为是 collision-aware** —— 如果 `"bottom"` 的内容会出视窗，Floating UI **自动翻转到 `"top"`**。

### 2.7 不用 anchor 时的行为

如果**省略 `anchor` prop**：

- 不开启 portal
- 必须自己用 `position: absolute` 定位
- Trigger 与 Content 必须共享父级（不能跨 portal）

## 3. data-* 属性与 Tailwind variant

### 3.1 完整 data-* 列表

| 属性 | 含义 | 适用组件 |
|------|------|---------|
| `data-open` | 当前 open 状态 | Menu / Popover / Disclosure / Listbox / Combobox / Dialog（`DialogPanel`） |
| `data-closed` | transition 中的 closed 态 | 任何 `transition` 组件 |
| `data-enter` | transition enter 阶段 | 任何 `transition` 组件 |
| `data-leave` | transition leave 阶段 | 任何 `transition` 组件 |
| `data-transition` | transition 期间 | 任何 `transition` 组件 |
| `data-focus` | 键盘 focus | Trigger / Item / Input |
| `data-hover` | 鼠标 hover（**触摸设备自动忽略**） | Trigger / Item |
| `data-active` | 鼠标按下中（**拖出区域自动消失**） | Trigger / Item |
| `data-disabled` | 禁用 | 任何组件 |
| `data-selected` | 当前选中（与 focus 不同） | Listbox / Combobox / Tab |
| `data-checked` | 选中态 | Checkbox / Switch / Radio |
| `data-indeterminate` | indeterminate 态 | Checkbox |
| `data-invalid` | 错误态 | Input / Textarea / Select |
| `data-autofocus` | autoFocus prop 被设置 | Trigger |
| `data-headlessui-state` | 综合状态（debug 用） | 任何组件 |

### 3.2 与 Tailwind variant 集成

```tsx
<MenuButton
  className="
    bg-gray-100
    data-[hover]:bg-gray-200
    data-[active]:bg-gray-300
    data-[focus]:ring-2 data-[focus]:ring-indigo-500
    data-[open]:bg-blue-500 data-[open]:text-white
    data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed
  "
>
  ...
</MenuButton>
```

### 3.3 `group-data-*` 父级影响子级

```tsx
<MenuItem className="group flex items-center">
  <span>菜单项</span>
  <kbd className="hidden group-data-[focus]:inline">⌘K</kbd>
</MenuItem>
```

`<MenuItem>` 自身有 `data-focus`，**子元素 `<kbd>` 用 `group-data-[focus]:`** 响应父级状态。

### 3.4 v2 优势：`data-active` 拖出消失

```tsx
<MenuButton className="data-[active]:bg-blue-700">
  按住我
</MenuButton>
```

**v1 / Radix 中**：按住后拖到按钮外仍然「按住」态。

**v2 中**：按住拖出按钮区域 —— `data-active` **自动消失**，体验更符合直觉。

### 3.5 v2 优势：`data-hover` 触摸设备忽略

```tsx
<MenuItem className="data-[hover]:bg-blue-100">
  菜单项
</MenuItem>
```

**v1 / CSS `:hover` 中**：触摸设备点击后**留下「sticky hover」**——元素一直保持 hover 态直到点击别处。

**v2 中**：`data-hover` **触摸设备自动跳过** —— 不会留下 sticky 状态。

### 3.6 v2 优势：`data-focus` 等价 `:focus-visible`

```tsx
<MenuButton className="data-[focus]:ring-2">
  按钮
</MenuButton>
```

**v1 / CSS `:focus` 中**：鼠标点击按钮也会触发 focus 环 —— 误触发。

**v2 中**：`data-focus` **等价 `:focus-visible`** —— 鼠标点击不触发、键盘 Tab 才触发。

## 4. Render Props 双模式

### 4.1 何时用 data-* className

99% 场景下用 `data-*` className —— **代码更简洁、Tailwind variant 直接命中**：

```tsx
<MenuButton className="data-[open]:bg-blue-700">...</MenuButton>
```

### 4.2 何时用 Render Props

需要把状态传给**非 className 场景**时：

```tsx
import { MenuButton } from "@headlessui/react";
import { motion } from "framer-motion";

{/* 状态传给 Framer Motion */}
<MenuButton as={motion.button} animate={{ scale: open ? 1.1 : 1 }}>
  ...
</MenuButton>

{/* 状态切换内部结构 */}
<Menu>
  {({ open }) => (
    <>
      <MenuButton>{open ? "关闭菜单" : "打开菜单"}</MenuButton>
      <MenuItems>...</MenuItems>
    </>
  )}
</Menu>
```

### 4.3 Render Props 全表

| 组件 | render prop 暴露 |
|------|------------------|
| `Menu` | `{ open, close }` |
| `MenuButton` | `{ open, focus, hover, active, autofocus }` |
| `MenuItems` | `{ open }` |
| `MenuItem` | `{ disabled, focus, close }` |
| `Listbox` | `{ open, disabled, value }` |
| `ListboxButton` | `{ open, focus, hover, active, value, disabled }` |
| `ListboxOption` | `{ focus, selected, disabled }` |
| `Combobox` | `{ open, disabled, value }` |
| `ComboboxButton` | `{ open, focus, hover, active, disabled }` |
| `ComboboxOption` | `{ focus, selected, disabled }` |
| `Dialog` | `{ open }` |
| `Popover` | `{ open, close }` |
| `Disclosure` | `{ open, close }` |
| `Tab` | `{ selected, focus, hover, autofocus, disabled }` |
| `Switch` | `{ checked, focus, hover, autofocus, disabled, changing }` |
| `Checkbox` | `{ checked, focus, hover, indeterminate, disabled }` |
| `RadioGroup.Option` | `{ checked, focus, hover, disabled }` |

## 5. `as` Prop 完整用法

### 5.1 字符串语义

```tsx
<MenuButton as="a" href="/profile">个人主页</MenuButton>
{/* 实际 DOM: <a href="/profile">个人主页</a> + 所有 Menu Button 属性 */}
```

### 5.2 Fragment（不渲染额外 DOM）

```tsx
<MenuButton as={Fragment}>
  <button className="my-custom-button">
    实际按钮
  </button>
</MenuButton>
```

> 要求：子元素必须**单个 React 节点**、必须**接收 props**。

### 5.3 React 组件

```tsx
import Link from "next/link";

<MenuItem as={Link} href="/profile">
  个人主页
</MenuItem>;
```

### 5.4 forwardRef 自定义组件

```tsx
import * as React from "react";

const MyCustomButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<"button">
>(function MyCustomButton(props, ref) {
  return <button ref={ref} {...props} />;
});

<MenuButton as={MyCustomButton}>...</MenuButton>;
```

## 6. Menu 完整 Anatomy

### 6.1 基础结构

```tsx
import {
  Menu,
  MenuButton,
  MenuItems,
  MenuItem,
  MenuSection,
  MenuHeading,
  MenuSeparator,
} from "@headlessui/react";

<Menu>
  <MenuButton>选项</MenuButton>

  <MenuItems anchor="bottom start" transition>
    <MenuSection>
      <MenuHeading>账户操作</MenuHeading>
      <MenuItem>
        <button>设置</button>
      </MenuItem>
      <MenuItem>
        <button>个人资料</button>
      </MenuItem>
    </MenuSection>

    <MenuSeparator className="my-1 h-px bg-gray-200" />

    <MenuSection>
      <MenuHeading>危险操作</MenuHeading>
      <MenuItem disabled>
        <button>归档</button>
      </MenuItem>
      <MenuItem>
        <button className="text-red-600">删除</button>
      </MenuItem>
    </MenuSection>
  </MenuItems>
</Menu>;
```

### 6.2 完整 Props

#### Menu

| Prop | 类型 | 默认 | 说明 |
|------|------|------|------|
| `as` | `ElementType` | `Fragment` | 渲染元素 |
| `__demoMode` | `boolean` | - | demo 模式 |

#### MenuButton

| Prop | 类型 | 默认 | 说明 |
|------|------|------|------|
| `as` | `ElementType` | `'button'` | 渲染元素 |
| `disabled` | `boolean` | `false` | 禁用 |
| `autoFocus` | `boolean` | - | 自动聚焦 |

#### MenuItems

| Prop | 类型 | 默认 | 说明 |
|------|------|------|------|
| `as` | `ElementType` | `'div'` | 渲染元素 |
| `anchor` | `AnchorProps` | - | 锚定配置 |
| `static` | `boolean` | `false` | 始终渲染，忽略 open 状态 |
| `unmount` | `boolean` | `true` | 关闭时是否卸载 |
| `portal` | `boolean` | - | 是否 Portal（设 `anchor` 时自动 `true`） |
| `modal` | `boolean` | `true` | 是否 modal（焦点陷阱） |
| `transition` | `boolean` | `false` | 启用 `data-*` transition |

#### MenuItem

| Prop | 类型 | 默认 | 说明 |
|------|------|------|------|
| `as` | `ElementType` | `Fragment` | 渲染元素 |
| `disabled` | `boolean` | `false` | 禁用 |

### 6.3 高级用法

#### 阻止 Item 点击关闭菜单

```tsx
<MenuItem>
  {({ close }) => (
    <button
      onClick={(e) => {
        e.preventDefault(); // 阻止默认关闭
        console.log("不关闭菜单");
      }}
    >
      操作
    </button>
  )}
</MenuItem>
```

#### 手动关闭菜单

```tsx
<Menu>
  {({ close }) => (
    <>
      <MenuButton>选项</MenuButton>
      <MenuItems>
        <MenuItem>
          <button
            onClick={() => {
              doSomething();
              close(); // 手动关闭
            }}
          >
            执行 + 关闭
          </button>
        </MenuItem>
      </MenuItems>
    </>
  )}
</Menu>
```

## 7. Listbox 完整 Anatomy

```tsx
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
  ListboxSelectedOption,
} from "@headlessui/react";
import { useState } from "react";

const people = [
  { id: 1, name: "张伟" },
  { id: 2, name: "李娜" },
  { id: 3, name: "王芳" },
];

function MyListbox() {
  const [selected, setSelected] = useState(people[0]);
  return (
    <Listbox value={selected} onChange={setSelected}>
      <ListboxButton className="block w-full rounded-md bg-white py-1.5 pl-3 pr-10 text-left ring-1 ring-inset ring-gray-300 focus:outline-none data-[focus]:ring-2 data-[focus]:ring-indigo-500">
        <ListboxSelectedOption>
          {(value) => value?.name ?? "请选择"}
        </ListboxSelectedOption>
      </ListboxButton>

      <ListboxOptions
        anchor="bottom"
        transition
        className="z-50 w-(--button-width) rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 [--anchor-gap:4px] data-[closed]:opacity-0"
      >
        {people.map((person) => (
          <ListboxOption
            key={person.id}
            value={person}
            className="cursor-pointer select-none px-3 py-1.5 data-[focus]:bg-indigo-50 data-[selected]:font-semibold"
          >
            {person.name}
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  );
}
```

### 7.1 多选模式

```tsx
const [selected, setSelected] = useState<typeof people[number][]>([]);

<Listbox value={selected} onChange={setSelected} multiple>
  ...
</Listbox>;
```

`onChange` 接收数组、`selected` 是已选项的数组。

### 7.2 对象 + `by` Prop

```tsx
{/* 默认：用 === 比较 */}
<Listbox value={selected} onChange={setSelected}>...</Listbox>

{/* by="id"：用 obj.id === obj2.id 比较 */}
<Listbox value={selected} onChange={setSelected} by="id">...</Listbox>

{/* by={(a, b) => ...}：自定义比较 */}
<Listbox value={selected} onChange={setSelected} by={(a, b) => a.email === b.email}>...</Listbox>
```

### 7.3 表单集成

```tsx
<Listbox value={selected} onChange={setSelected} name="person">
  ...
</Listbox>
```

加 `name` prop —— Headless UI 自动渲染**隐藏 input**，传统表单提交可用。

## 8. Combobox 完整 Anatomy

```tsx
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
```

### 8.1 单选基础

```tsx
function PeopleCombobox() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Person | null>(null);

  const filtered =
    query === ""
      ? people
      : people.filter((p) =>
          p.name.toLowerCase().includes(query.toLowerCase()),
        );

  return (
    <Combobox
      value={selected}
      onChange={setSelected}
      onClose={() => setQuery("")}
    >
      <div className="relative">
        <ComboboxInput
          displayValue={(p: Person | null) => p?.name ?? ""}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-md border px-3 py-1.5 data-[focus]:outline-none data-[focus]:ring-2"
        />
        <ComboboxButton className="absolute inset-y-0 right-0 px-2.5">
          ▼
        </ComboboxButton>
      </div>

      <ComboboxOptions
        anchor="bottom"
        transition
        className="z-50 w-(--input-width) rounded-md bg-white shadow-lg [--anchor-gap:4px] data-[closed]:opacity-0 empty:invisible"
      >
        {filtered.map((person) => (
          <ComboboxOption
            key={person.id}
            value={person}
            className="px-3 py-1.5 data-[focus]:bg-indigo-50"
          >
            {person.name}
          </ComboboxOption>
        ))}
      </ComboboxOptions>
    </Combobox>
  );
}
```

### 8.2 关键 Props

#### Combobox

| Prop | 类型 | 说明 |
|------|------|------|
| `value` | `T \| T[] \| null` | 受控值 |
| `defaultValue` | `T \| T[] \| null` | 非受控初始值 |
| `onChange` | `(value: T \| T[] \| null) => void` | 值变化回调 |
| `onClose` | `() => void` | 关闭回调（用于清空 query） |
| `multiple` | `boolean` | 多选 |
| `disabled` | `boolean` | 禁用 |
| `name` | `string` | 表单字段名 |
| `by` | `keyof T \| (a, b) => boolean` | 对象比较 |
| `immediate` | `boolean` | 输入框聚焦立即打开（command palette） |
| `virtual` | `{ options: T[] }` | 虚拟滚动 |

#### ComboboxInput

| Prop | 类型 | 说明 |
|------|------|------|
| `displayValue` | `(value: T) => string` | 控制选中后输入框显示 |
| `onChange` | `ChangeEventHandler<HTMLInputElement>` | 输入变化 |

### 8.3 虚拟滚动（10000+ 选项）

```tsx
import { Combobox, ComboboxOptions, ComboboxOption, ComboboxInput } from "@headlessui/react";
import { useMemo, useState } from "react";

const allPeople = Array.from({ length: 10000 }, (_, i) => ({
  id: i,
  name: `用户 ${i}`,
}));

function VirtualCombobox() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<typeof allPeople[number] | null>(null);

  const filtered = useMemo(
    () =>
      query === ""
        ? allPeople
        : allPeople.filter((p) =>
            p.name.toLowerCase().includes(query.toLowerCase()),
          ),
    [query],
  );

  return (
    <Combobox
      value={selected}
      virtual={{ options: filtered }}
      onChange={setSelected}
    >
      <ComboboxInput
        displayValue={(p: typeof allPeople[number] | null) => p?.name ?? ""}
        onChange={(e) => setQuery(e.target.value)}
      />
      <ComboboxOptions anchor="bottom">
        {({ option: person }: { option: typeof allPeople[number] }) => (
          <ComboboxOption value={person}>{person.name}</ComboboxOption>
        )}
      </ComboboxOptions>
    </Combobox>
  );
}
```

**关键点**：

- `virtual.options` **必须是已过滤数组**
- `<ComboboxOptions>` 子元素**必须是 render prop**（不能是 `.map`）

### 8.4 Immediate Mode（Command Palette）

```tsx
<Combobox value={selected} onChange={setSelected} immediate>
  <ComboboxInput placeholder="搜索命令..." />
  <ComboboxOptions>...</ComboboxOptions>
</Combobox>
```

`immediate` —— **输入框聚焦立即弹出 dropdown**（用于命令面板）。

### 8.5 "Create" 模式（输入新值）

```tsx
{query.length > 0 && !filtered.find((p) => p.name === query) && (
  <ComboboxOption value={{ id: null, name: query }}>
    创建 "{query}"
  </ComboboxOption>
)}
{filtered.map((person) => (
  <ComboboxOption key={person.id} value={person}>
    {person.name}
  </ComboboxOption>
))}
```

## 9. Dialog 完整 Anatomy

```tsx
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  DialogDescription,
} from "@headlessui/react";
```

### 9.1 基础结构

```tsx
function MyDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      transition
      className="relative z-50 transition data-[closed]:opacity-0"
    >
      <DialogBackdrop className="fixed inset-0 bg-black/50" />

      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel className="max-w-lg space-y-4 rounded-2xl bg-white p-12">
          <DialogTitle className="text-xl font-semibold">标题</DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            描述
          </DialogDescription>
          <p>内容</p>
          <button onClick={onClose}>关闭</button>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
```

### 9.2 关键 Props

| Prop | 类型 | 默认 | 说明 |
|------|------|------|------|
| `open` | `boolean` | - | 受控 open（**必须**） |
| `onClose` | `() => void` | - | Esc / 点击 DialogPanel 外触发 |
| `role` | `'dialog' \| 'alertdialog'` | `'dialog'` | a11y role |
| `transition` | `boolean` | `false` | 启用 transition |
| `static` | `boolean` | - | 不内置管理 open，配合 AnimatePresence |
| `unmount` | `boolean` | `true` | 关闭时是否卸载 |
| `autoFocus` | `boolean` | `true` | 自动聚焦首个 |
| `__demoMode` | `boolean` | - | demo 模式 |

### 9.3 自动 Focus 指定元素

```tsx
<DialogPanel>
  <input autoFocus />  {/* 普通 HTML autoFocus 不工作 */}

  <Input data-autofocus />  {/* Headless UI 推荐：data-autofocus 属性 */}
</DialogPanel>
```

### 9.4 AlertDialog（强制确认）

```tsx
<Dialog open={open} onClose={onClose} role="alertdialog">
  <DialogBackdrop className="fixed inset-0 bg-black/50" />
  <DialogPanel>
    <DialogTitle>确认删除</DialogTitle>
    <p>该操作不可撤销，确定继续吗？</p>
    <button onClick={onClose}>取消</button>
    <button onClick={onConfirm}>删除</button>
  </DialogPanel>
</Dialog>
```

`role="alertdialog"` 让屏幕阅读器**强制朗读 title + description**，常用于破坏性操作确认。

### 9.5 与 Framer Motion 集成

```tsx
import { Dialog, DialogPanel } from "@headlessui/react";
import { motion, AnimatePresence } from "framer-motion";

<AnimatePresence>
  {open && (
    <Dialog static open onClose={onClose}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50"
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="fixed inset-0 flex items-center justify-center"
      >
        <DialogPanel>...</DialogPanel>
      </motion.div>
    </Dialog>
  )}
</AnimatePresence>;
```

`static` prop 关闭 Headless UI 自身的内部 mount/unmount —— **完全交给 AnimatePresence 控制**。

## 10. Popover 完整 Anatomy

```tsx
import {
  Popover,
  PopoverButton,
  PopoverPanel,
  PopoverGroup,
  PopoverBackdrop,
} from "@headlessui/react";
```

### 10.1 基础结构

```tsx
<Popover className="relative">
  <PopoverButton className="px-4 py-2">产品</PopoverButton>

  <PopoverPanel
    anchor="bottom"
    transition
    className="z-50 mt-2 w-80 rounded-lg bg-white p-4 shadow-lg [--anchor-gap:8px] data-[closed]:opacity-0"
  >
    <div className="grid grid-cols-2 gap-4">
      <a href="#one" className="block hover:bg-gray-50 p-2">产品 1</a>
      <a href="#two" className="block hover:bg-gray-50 p-2">产品 2</a>
    </div>
  </PopoverPanel>
</Popover>
```

### 10.2 PopoverGroup（导航栏多 Popover）

```tsx
<PopoverGroup className="flex gap-4">
  <Popover>
    <PopoverButton>产品</PopoverButton>
    <PopoverPanel anchor="bottom">...</PopoverPanel>
  </Popover>

  <Popover>
    <PopoverButton>方案</PopoverButton>
    <PopoverPanel anchor="bottom">...</PopoverPanel>
  </Popover>
</PopoverGroup>
```

`PopoverGroup` **协调多个 Popover 的焦点流** —— Tab 从一个 Popover 离开时自动跳到下一个。

### 10.3 PopoverBackdrop（点击关闭）

```tsx
<Popover>
  <PopoverButton>菜单</PopoverButton>
  <PopoverBackdrop className="fixed inset-0 bg-black/30" />
  <PopoverPanel>...</PopoverPanel>
</Popover>
```

`PopoverBackdrop` —— **半透明全屏背景，点击关闭 Popover**。常用于移动端导航菜单。

### 10.4 与 Menu / Dialog 的对比

| | Menu | Popover | Dialog |
|---|------|---------|--------|
| **用途** | 操作菜单（Action） | 任意 UI（菜单/卡片/导航） | 模态对话框 |
| **键盘 Arrow 导航** | 是 | 否 | 否 |
| **Esc 关闭** | 是 | 是 | 是 |
| **点击外部关闭** | 是 | 是 | 是（点 Panel 外） |
| **a11y role** | `menu` / `menuitem` | `region` / `button` | `dialog` |

## 11. Disclosure（单项折叠）

```tsx
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";

<Disclosure>
  <DisclosureButton className="flex w-full justify-between rounded-lg bg-indigo-100 px-4 py-2 text-left">
    <span>什么是退款政策？</span>
    <span className="data-[open]:rotate-180 transition-transform">▼</span>
  </DisclosureButton>

  <DisclosurePanel className="px-4 pt-4 pb-2 text-sm text-gray-600">
    14 天内可申请全额退款。
  </DisclosurePanel>
</Disclosure>;
```

### 11.1 与 `data-[open]:` 旋转图标

```tsx
<DisclosureButton className="group">
  <span>问题</span>
  <ChevronIcon className="group-data-[open]:rotate-180 transition" />
</DisclosureButton>
```

### 11.2 手动关闭（useClose）

```tsx
import { useClose } from "@headlessui/react";

function CustomButton() {
  const close = useClose();
  return <button onClick={close}>关闭面板</button>;
}

<Disclosure>
  <DisclosureButton>展开</DisclosureButton>
  <DisclosurePanel>
    <CustomButton /> {/* 调用 useClose 关闭外层 Disclosure */}
  </DisclosurePanel>
</Disclosure>;
```

### 11.3 多项手风琴（用 Disclosure 组装）

```tsx
const faqs = [
  { q: "什么是退款政策？", a: "14 天内可申请全额退款。" },
  { q: "如何联系客服？", a: "邮箱：support@example.com" },
  { q: "支持哪些支付方式？", a: "支持微信、支付宝、银行卡。" },
];

<div className="space-y-2">
  {faqs.map((faq) => (
    <Disclosure key={faq.q}>
      <DisclosureButton className="flex w-full justify-between rounded-lg bg-indigo-100 px-4 py-2 text-left">
        {faq.q}
      </DisclosureButton>
      <DisclosurePanel className="px-4 pt-4 pb-2 text-sm">
        {faq.a}
      </DisclosurePanel>
    </Disclosure>
  ))}
</div>;
```

> **Headless UI 没有官方 Accordion** —— 用多个 Disclosure 组装是常见方案。如需「单项联动」（打开一个时关其他），需自己用 useState 管理。

## 12. Tabs 完整 Anatomy

```tsx
import {
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from "@headlessui/react";

<TabGroup>
  <TabList className="flex gap-4 border-b">
    <Tab className="px-4 py-2 data-[selected]:border-b-2 data-[selected]:border-indigo-600 data-[selected]:text-indigo-600 focus:outline-none">
      最新
    </Tab>
    <Tab className="px-4 py-2 data-[selected]:border-b-2 data-[selected]:border-indigo-600 data-[selected]:text-indigo-600 focus:outline-none">
      热门
    </Tab>
    <Tab className="px-4 py-2 data-[selected]:border-b-2 data-[selected]:border-indigo-600 data-[selected]:text-indigo-600 focus:outline-none">
      趋势
    </Tab>
  </TabList>
  <TabPanels className="mt-4">
    <TabPanel>最新内容...</TabPanel>
    <TabPanel>热门内容...</TabPanel>
    <TabPanel>趋势内容...</TabPanel>
  </TabPanels>
</TabGroup>;
```

### 12.1 关键 Props

#### TabGroup

| Prop | 类型 | 默认 | 说明 |
|------|------|------|------|
| `defaultIndex` | `number` | `0` | 非受控初始 index |
| `selectedIndex` | `number` | - | 受控 index |
| `onChange` | `(index: number) => void` | - | 切换回调 |
| `vertical` | `boolean` | `false` | 垂直布局 |
| `manual` | `boolean` | `false` | 键盘 Arrow 仅移动焦点、不切换 |

### 12.2 受控模式（与 URL 同步）

```tsx
import { useSearchParams } from "next/navigation";

function MyTabs() {
  const params = useSearchParams();
  const tab = params.get("tab") ?? "latest";
  const index = ["latest", "popular", "trending"].indexOf(tab);

  const router = useRouter();
  return (
    <TabGroup
      selectedIndex={index}
      onChange={(i) =>
        router.replace(`?tab=${["latest", "popular", "trending"][i]}`)
      }
    >
      ...
    </TabGroup>
  );
}
```

### 12.3 垂直布局

```tsx
<TabGroup vertical>
  <div className="flex">
    <TabList className="flex flex-col gap-2 border-r">
      <Tab>选项卡 1</Tab>
      <Tab>选项卡 2</Tab>
    </TabList>
    <TabPanels className="flex-1 pl-4">
      <TabPanel>内容 1</TabPanel>
      <TabPanel>内容 2</TabPanel>
    </TabPanels>
  </div>
</TabGroup>
```

垂直模式下 **键盘 Arrow Up/Down** 替代 Arrow Left/Right。

## 13. Switch（开关）

```tsx
<Switch
  checked={enabled}
  onChange={setEnabled}
  className="
    group inline-flex h-6 w-11 items-center rounded-full
    bg-gray-200 data-[checked]:bg-blue-600
  "
>
  <span className="sr-only">启用通知</span>
  <span className="
    inline-block size-4 translate-x-1 rounded-full bg-white transition
    group-data-[checked]:translate-x-6
  " />
</Switch>
```

### 13.1 关键 Props

| Prop | 类型 | 说明 |
|------|------|------|
| `checked` | `boolean` | 受控 |
| `defaultChecked` | `boolean` | 非受控 |
| `onChange` | `(checked: boolean) => void` | 切换回调 |
| `disabled` | `boolean` | 禁用 |
| `name` | `string` | 表单字段名 |
| `form` | `string` | 关联表单 ID |
| `value` | `string` | 表单提交值 |

### 13.2 与 Field 组合

```tsx
<Field className="flex items-center justify-between">
  <Label>启用通知</Label>
  <Switch checked={enabled} onChange={setEnabled} className="...">
    <span className="..." />
  </Switch>
</Field>
```

## 14. Checkbox（v2 新）

```tsx
import { Checkbox, Field, Label, Description } from "@headlessui/react";

<Field className="flex items-start gap-3">
  <Checkbox
    checked={enabled}
    onChange={setEnabled}
    className="
      mt-1 size-4 rounded border border-gray-300
      data-[checked]:bg-indigo-600 data-[checked]:border-indigo-600
    "
  >
    <CheckIcon className="hidden size-3 fill-white group-data-[checked]:block" />
  </Checkbox>
  <div>
    <Label>启用 Beta</Label>
    <Description className="text-sm text-gray-500">
      提前体验新功能
    </Description>
  </div>
</Field>;
```

### 14.1 Indeterminate 状态（"全选"中间态）

```tsx
const allChecked = items.every((i) => i.selected);
const someChecked = items.some((i) => i.selected);
const indeterminate = someChecked && !allChecked;

<Checkbox
  checked={allChecked}
  indeterminate={indeterminate}
  onChange={(checked) => setAll(checked)}
/>;
```

### 14.2 表单集成

```tsx
<Checkbox name="agree" value="yes">
  ...
</Checkbox>
```

加 `name` 后会**渲染隐藏 input**，可被传统表单提交。

## 15. RadioGroup

```tsx
import { RadioGroup, Radio, Field, Label, Description } from "@headlessui/react";

const plans = [
  { id: "free", name: "免费版", price: "￥0" },
  { id: "pro", name: "专业版", price: "￥99/月" },
  { id: "enterprise", name: "企业版", price: "联系销售" },
];

function PlanRadio() {
  const [selected, setSelected] = useState("free");
  return (
    <RadioGroup
      value={selected}
      onChange={setSelected}
      className="space-y-2"
    >
      {plans.map((plan) => (
        <Field key={plan.id} className="flex items-center gap-3">
          <Radio
            value={plan.id}
            className="
              size-5 rounded-full border border-gray-300
              data-[checked]:border-indigo-600 data-[checked]:bg-indigo-600
            "
          >
            <span className="block size-2 rounded-full bg-white opacity-0 data-[checked]:opacity-100" />
          </Radio>
          <Label>{plan.name}</Label>
          <Description className="text-sm text-gray-500">{plan.price}</Description>
        </Field>
      ))}
    </RadioGroup>
  );
}
```

## 16. Field 表单 ARIA 自动注入

### 16.1 Field 的魔法

```tsx
<Field>
  <Label>邮箱</Label>
  <Input name="email" />
  <Description>用于接收验证码</Description>
</Field>
```

**实际生成的 DOM**：

```html
<div>
  <label id="label-1234" for="input-5678">邮箱</label>
  <input id="input-5678" name="email" aria-labelledby="label-1234" aria-describedby="description-9012" />
  <p id="description-9012">用于接收验证码</p>
</div>
```

**所有 ID 自动生成、所有 aria-* 自动 wiring** —— 这是 Headless UI v2 表单组件的核心价值。

### 16.2 Fieldset / Legend 级联禁用

```tsx
<Fieldset disabled>
  <Legend>支付信息</Legend>
  <Field>
    <Label>卡号</Label>
    <Input name="card" /> {/* 自动 disabled */}
  </Field>
  <Field>
    <Label>有效期</Label>
    <Input name="exp" /> {/* 自动 disabled */}
  </Field>
</Fieldset>
```

`<Fieldset disabled>` —— **级联所有内部 Field、Input、Select、Textarea**。

### 16.3 Input invalid 错误态

```tsx
<Input
  invalid={hasError}
  className="
    border border-gray-300
    data-[invalid]:border-red-500 data-[invalid]:ring-red-500
  "
/>
```

### 16.4 与 react-hook-form 集成

```tsx
import { useForm, Controller } from "react-hook-form";

function LoginForm() {
  const { control, handleSubmit } = useForm();
  return (
    <form onSubmit={handleSubmit(console.log)}>
      <Field>
        <Label>邮箱</Label>
        <Controller
          name="email"
          control={control}
          rules={{ required: true }}
          render={({ field, fieldState }) => (
            <Input {...field} invalid={!!fieldState.error} />
          )}
        />
      </Field>
      <button type="submit">提交</button>
    </form>
  );
}
```

## 17. Transition 完整使用

### 17.1 `transition` prop（v2 推荐）

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

### 17.2 `<Transition>` 组件

```tsx
<Transition
  show={isVisible}
  enter="transition-opacity duration-300 ease-out"
  enterFrom="opacity-0"
  enterTo="opacity-100"
  leave="transition-opacity duration-200 ease-in"
  leaveFrom="opacity-100"
  leaveTo="opacity-0"
>
  <div>淡入淡出内容</div>
</Transition>
```

| Prop | 说明 |
|------|------|
| `show` | 是否显示 |
| `appear` | 首次挂载时也播放 enter 动画 |
| `as` | 渲染元素（默认 Fragment） |
| `enter` / `enterFrom` / `enterTo` | enter 动画 |
| `leave` / `leaveFrom` / `leaveTo` | leave 动画 |
| `beforeEnter` / `afterEnter` / `beforeLeave` / `afterLeave` | 生命周期回调 |
| `unmount` | leave 完成后是否卸载（默认 `true`） |

### 17.3 `<TransitionChild>` 协调多元素

```tsx
<Transition show={isOpen}>
  <TransitionChild
    enter="transition-opacity duration-300"
    enterFrom="opacity-0"
    enterTo="opacity-100"
  >
    <div className="fixed inset-0 bg-black/50">遮罩</div>
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

> 父 `<Transition>` 协调状态、子 `<TransitionChild>` 各自配置动画。

## 18. SSR 与 Next.js / Remix / Vite

### 18.1 Next.js App Router

```tsx
// app/page.tsx —— Server Component
import { MyDialog } from "@/components/MyDialog";

export default function Page() {
  return <MyDialog />;
}
```

```tsx
// components/MyDialog.tsx —— Client Component
"use client"; // 必须

import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useState } from "react";
// ...
```

### 18.2 hydration 警告排查

Next.js 项目偶尔出现 `id` mismatch 警告 —— 通常是因为：

1. 在 **Server Component 顶层** 用了 Headless UI：必须移到 Client Component
2. **Strict Mode** 双调用导致：升级到最新 Headless UI 版本通常已修复
3. **`Math.random()` / `Date.now()`** 在 ID 生成中误用：用 `useId` 替代

### 18.3 Remix

```tsx
// app/routes/dashboard.tsx
import { Menu, MenuButton, MenuItems } from "@headlessui/react";

export default function Dashboard() {
  return (
    <Menu>
      <MenuButton>选项</MenuButton>
      <MenuItems>...</MenuItems>
    </Menu>
  );
}
```

Remix 直接支持，无需额外配置。

### 18.4 Vite SPA（不需要 SSR）

```tsx
// 直接 import 用即可
import { Menu } from "@headlessui/react";
```

## 19. 与 Tailwind UI / Catalyst 协作

### 19.1 Tailwind UI

[Tailwind UI](https://tailwindui.com) 是 **Tailwind 官方付费组件库**，提供 **数百个完整组件示例**——**所有交互组件都基于 Headless UI**。

**实际场景**：

- 拿 Tailwind UI 的代码示例
- 替换业务文案
- 整合到你的项目

**因为底层都是 Headless UI**，你可以**自由修改样式、添加新功能** —— 没有任何"被 UI 库锁死"的问题。

### 19.2 Catalyst

[Catalyst](https://catalyst.tailwindui.com/) 是 **Tailwind 官方付费设计系统** —— **完全基于 Headless UI 构建**，提供：

- 30+ 组件（Button / Input / Dialog / Combobox 等）
- 完整 a11y + dark mode
- TypeScript-first
- **源码完全开源给购买用户**——**拷贝到你的项目自由修改**

**Catalyst vs shadcn/ui**：

- Catalyst 基于 **Headless UI + Tailwind**
- shadcn/ui 基于 **Radix Primitives + Tailwind**

设计哲学相近、底层不同。

## 20. Vue v1 vs React v2 差异详解

| 特性 | React v2 | Vue v1 |
|------|---------|--------|
| **版本** | v2.2.x（2024.5 起） | v1.7（最后更新 2024 年） |
| **组件数量** | 16 | 13 |
| **Anchor Positioning** | 内置 `anchor` prop + Floating UI | 无 |
| **`transition` prop** | 内置 `data-closed` / `data-enter` | 无（用 Vue `<transition>` 元素） |
| **Checkbox** | 有 | 无 |
| **Input / Textarea / Select** | 有 | 无 |
| **Field / Fieldset / Legend / Description** | 有 | 无 |
| **Combobox 虚拟滚动** | <span v-pre>`virtual={{ options }}`</span> | 无 |
| **data-* 属性** | 全面（`data-hover` / `data-focus` 智能检测） | 仅 `data-headlessui-state` |
| **状态消费** | data-* className + Render Props 双模式 | 仅 v-slot 单一模式 |

### 20.1 Vue v1 典型用法

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
  <Menu as="div" class="relative">
    <MenuButton>选项</MenuButton>
    <MenuItems class="absolute mt-2 w-56 bg-white shadow-lg">
      <MenuItem v-slot="{ active }">
        <a
          href="#"
          :class="[
            active ? 'bg-indigo-500 text-white' : 'text-gray-900',
            'block px-4 py-2',
          ]"
        >
          设置
        </a>
      </MenuItem>
    </MenuItems>
  </Menu>
</template>
```

**Vue 用户的现实选择**：

1. **接受 v1 现状**：足够用，缺 anchor / Checkbox / Field 等
2. **配合 Floating UI Vue**：手动实现 anchor positioning
3. **切到 [Ark UI](https://ark-ui.com)**：Vue 支持更完整、有 anchor、有所有组件
4. **切到 [Radix Vue](https://www.radix-vue.com/)**（已改名 **Reka UI**）：Radix Vue 移植版

## 21. v1 → v2 迁移指南（React）

### 21.1 主要 breaking changes

| v1 | v2 | 说明 |
|----|----|------|
| `Menu.Items` | `MenuItems` | 命名空间 → 扁平命名 |
| `Menu.Item` | `MenuItem` | 同上 |
| `Dialog.Panel` | `DialogPanel` | 同上 |
| `{({ active }) => ...}` | `data-[focus]:...` | active 改名为 focus（与 Radix 对齐） |
| 手动 Floating UI | `anchor="bottom start"` | 内置 anchor |
| 手动 react-transition-group | `transition` prop | 内置 transition |

### 21.2 命名空间 → 扁平命名

```tsx
// v1
import { Menu } from "@headlessui/react";

<Menu>
  <Menu.Button>...</Menu.Button>
  <Menu.Items>
    <Menu.Item>...</Menu.Item>
  </Menu.Items>
</Menu>;

// v2
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/react";

<Menu>
  <MenuButton>...</MenuButton>
  <MenuItems>
    <MenuItem>...</MenuItem>
  </MenuItems>
</Menu>;
```

### 21.3 active → focus

```tsx
// v1
<Menu.Item>
  {({ active }) => (
    <a className={active ? "bg-blue-500" : ""}>设置</a>
  )}
</Menu.Item>;

// v2（推荐 data-* className）
<MenuItem>
  <a className="data-[focus]:bg-blue-500">设置</a>
</MenuItem>;

// v2（仍可用 render prop，但属性改名）
<MenuItem>
  {({ focus }) => (
    <a className={focus ? "bg-blue-500" : ""}>设置</a>
  )}
</MenuItem>;
```

### 21.4 手动 Floating UI → 内置 anchor

```tsx
// v1（需要手动 Floating UI）
import { useFloating, autoUpdate } from "@floating-ui/react";

function MyMenu() {
  const { refs, floatingStyles } = useFloating({ /* ... */ });
  return (
    <Menu>
      <Menu.Button ref={refs.setReference}>...</Menu.Button>
      <Menu.Items ref={refs.setFloating} style={floatingStyles}>
        ...
      </Menu.Items>
    </Menu>
  );
}

// v2（一行搞定）
<Menu>
  <MenuButton>...</MenuButton>
  <MenuItems anchor="bottom start">...</MenuItems>
</Menu>;
```

### 21.5 react-transition-group → transition prop

```tsx
// v1（用 Transition 包装）
<Menu>
  <Menu.Button>...</Menu.Button>
  <Transition
    enter="transition duration-100 ease-out"
    enterFrom="transform scale-95 opacity-0"
    enterTo="transform scale-100 opacity-100"
    leave="transition duration-75 ease-in"
    leaveFrom="transform scale-100 opacity-100"
    leaveTo="transform scale-95 opacity-0"
  >
    <Menu.Items>...</Menu.Items>
  </Transition>
</Menu>;

// v2（transition prop + data-*）
<Menu>
  <MenuButton>...</MenuButton>
  <MenuItems
    transition
    className="
      transition duration-100 ease-out
      data-[closed]:scale-95 data-[closed]:opacity-0
    "
  >
    ...
  </MenuItems>
</Menu>;
```

### 21.6 升级步骤

```bash
# 1. 升级包
pnpm add @headlessui/react@latest

# 2. 全局替换命名（VSCode 全工程搜索替换）
Menu.Button → MenuButton
Menu.Items → MenuItems
Menu.Item → MenuItem
Dialog.Panel → DialogPanel
...

# 3. 更新 className 模式
className={active ? "..." : ""} → className="data-[focus]:..."

# 4. 移除 Floating UI 手动配置，改用 anchor

# 5. 移除 Transition 包装，改用 transition prop + data-closed
```

## 22. 常见踩坑

### 22.1 `as={Fragment}` + 子元素多个

`<MenuButton as={Fragment}>` 后**只能跟单个 React 节点**。

```tsx
// 错误
<MenuButton as={Fragment}>
  <button>打开</button>
  <span>说明</span>
</MenuButton>

// 正确
<MenuButton as={Fragment}>
  <button>
    打开 <span>说明</span>
  </button>
</MenuButton>
```

### 22.2 自定义组件不接收 props

如果 `as={MyButton}` —— `MyButton` 必须**展开所有 props**：

```tsx
// 错误
function MyButton({ children }: { children: React.ReactNode }) {
  return <button>{children}</button>;
}

// 正确
function MyButton(props: React.ComponentPropsWithoutRef<"button">) {
  return <button {...props} />;
}
```

### 22.3 SSR 时 portal 报错

Headless UI 默认 portal 到 body —— **Next.js App Router 中需要在 Client Component 用**：

```tsx
"use client"; // 必须

import { Dialog } from "@headlessui/react";
```

### 22.4 Combobox 虚拟滚动 ComboboxOptions 子元素必须 render prop

```tsx
// 错误（虚拟滚动模式下不工作）
<ComboboxOptions>
  {filtered.map((p) => (
    <ComboboxOption key={p.id} value={p}>{p.name}</ComboboxOption>
  ))}
</ComboboxOptions>

// 正确
<ComboboxOptions>
  {({ option: person }) => (
    <ComboboxOption value={person}>{person.name}</ComboboxOption>
  )}
</ComboboxOptions>
```

### 22.5 Transition 不工作

确认你**给了完整的 transition 类**：

```tsx
{/* 错误：缺少基础 transition 类 */}
<MenuItems transition className="data-[closed]:opacity-0">

{/* 正确 */}
<MenuItems
  transition
  className="transition duration-200 ease-out data-[closed]:opacity-0"
>
```

### 22.6 Dialog `onClose` 不触发

`onClose` 只在 **点击 DialogPanel 之外**或**按 Esc** 时触发。

如果 DialogPanel 撑满全屏 —— 没有「外部」可点击，需要自己加按钮 + 调用 `setIsOpen(false)`。

### 22.7 Dialog 内 `autoFocus` 不工作

普通 HTML `autoFocus` 在 Headless UI Dialog 内**经常失效**（因为 Headless UI 接管了 focus 管理）。

```tsx
{/* 错误：经常被 Headless UI 覆盖 */}
<DialogPanel>
  <input autoFocus />
</DialogPanel>

{/* 正确：用 data-autofocus 属性 */}
<DialogPanel>
  <input data-autofocus />
</DialogPanel>

{/* 或用 Headless UI Input + autoFocus */}
<DialogPanel>
  <Input autoFocus />
</DialogPanel>
```

### 22.8 z-index 不够高

Portal 后**子元素自身需要显式 z-index**：

```tsx
<MenuItems anchor="bottom" className="z-50 ...">
```

### 22.9 Tailwind variant 不生效

确认 **Tailwind 4 启用了 data-* variant**：

Tailwind 4 默认开启 `data-[hover]:` / `data-[focus]:` 等 variant。如果用的是旧版 Tailwind 3，需要额外配置：

```js
// tailwind.config.js（v3）
module.exports = {
  // ...
  variants: {
    extend: {
      backgroundColor: ["data-hover", "data-focus", "data-active"],
    },
  },
};
```

### 22.10 anchor positioning 与 `position: fixed` 父容器冲突

少数场景下 `anchor` 子元素**渲染到 portal 外**——确认：

- 没有用 `static` prop
- 没有手动设置 `portal: false`
- 父级没有 `position: fixed` + `z-index` 低的层叠上下文

如有冲突，用 `portal` prop 强制走 portal：

```tsx
<MenuItems anchor="bottom" portal>...</MenuItems>
```

### 22.11 Vue v1 没有 anchor 怎么办

Vue 用户用 [Floating UI Vue](https://floating-ui.com/docs/vue) 手动实现：

```vue
<script setup>
import { useFloating, autoUpdate } from "@floating-ui/vue";
import { ref } from "vue";

const reference = ref(null);
const floating = ref(null);
const { floatingStyles } = useFloating(reference, floating, {
  whileElementsMounted: autoUpdate,
});
</script>

<template>
  <Menu>
    <MenuButton ref="reference">选项</MenuButton>
    <MenuItems ref="floating" :style="floatingStyles">
      ...
    </MenuItems>
  </Menu>
</template>
```

## 23. 完成指南后

掌握上述内容后，可继续阅读：

- [参考](./reference.md)：16 个组件 API 速查 / anchor 配置全表 / data-* 属性表 / 键盘快捷键全表 / CSS 变量全表 / TypeScript 类型
- [Headless UI 官方文档](https://headlessui.com)：每个组件 Examples / API
- [Tailwind UI](https://tailwindui.com) 与 [Catalyst](https://catalyst.tailwindui.com/)
- [Floating UI](https://floating-ui.com)：Headless UI 内置的定位引擎
- [TanStack Virtual](https://tanstack.com/virtual)：Combobox 虚拟滚动的底层
