---
layout: doc
outline: [2, 3]
---

# Headless UI 参考

本文为 **Headless UI v2（React）+ v1（Vue）** 的 API 速查文档——16 个组件清单、关键 props、anchor 配置、data-* 属性、键盘快捷键、CSS 变量、TypeScript 类型一站式查询。

> 完整概念与示例见 [入门](./getting-started.md) 与 [指南](./guide-line.md)。

## 1. 16 个组件清单

### 1.1 React v2 全部组件

| 组件 | 子组件 | 分类 |
|------|--------|------|
| `Menu` | `MenuButton` / `MenuItems` / `MenuItem` / `MenuSection` / `MenuHeading` / `MenuSeparator` | Menu |
| `Listbox` | `ListboxButton` / `ListboxOptions` / `ListboxOption` / `ListboxSelectedOption` | Menu |
| `Combobox` | `ComboboxInput` / `ComboboxButton` / `ComboboxOptions` / `ComboboxOption` | Menu |
| `Select` | - | Form |
| `Dialog` | `DialogBackdrop` / `DialogPanel` / `DialogTitle` / `DialogDescription` | Overlay |
| `Popover` | `PopoverButton` / `PopoverPanel` / `PopoverGroup` / `PopoverBackdrop` | Overlay |
| `Disclosure` | `DisclosureButton` / `DisclosurePanel` | Disclosure |
| `TabGroup` | `TabList` / `Tab` / `TabPanels` / `TabPanel` | Disclosure |
| `Switch` | - | Form |
| `Checkbox` | - | Form (v2 新) |
| `RadioGroup` | `Radio` | Form |
| `Input` | - | Form (v2 新) |
| `Textarea` | - | Form (v2 新) |
| `Fieldset` | `Legend` | Form (v2 新) |
| `Field` | - | Utility (v2 新) |
| `Label` / `Description` | - | Utility |
| `Button` | - | Utility (v2 新) |
| `Transition` | `TransitionChild` | Utility |
| `CloseButton` | - | Utility |

### 1.2 React v2 导入

```tsx
import {
  Menu, MenuButton, MenuItems, MenuItem,
  MenuSection, MenuHeading, MenuSeparator,
  Listbox, ListboxButton, ListboxOptions, ListboxOption, ListboxSelectedOption,
  Combobox, ComboboxInput, ComboboxButton, ComboboxOptions, ComboboxOption,
  Dialog, DialogBackdrop, DialogPanel, DialogTitle, DialogDescription,
  Popover, PopoverButton, PopoverPanel, PopoverGroup, PopoverBackdrop,
  Disclosure, DisclosureButton, DisclosurePanel,
  TabGroup, TabList, Tab, TabPanels, TabPanel,
  Switch, Checkbox,
  RadioGroup, Radio,
  Input, Textarea, Select,
  Fieldset, Legend, Field, Label, Description,
  Button, CloseButton,
  Transition, TransitionChild,
} from "@headlessui/react";
```

### 1.3 Vue v1 全部组件

| 组件 | 子组件 | 备注 |
|------|--------|------|
| `Menu` | `MenuButton` / `MenuItems` / `MenuItem` | Menu |
| `Listbox` | `ListboxButton` / `ListboxOptions` / `ListboxOption` / `ListboxLabel` | Menu |
| `Combobox` | `ComboboxInput` / `ComboboxButton` / `ComboboxOptions` / `ComboboxOption` / `ComboboxLabel` | Menu |
| `Dialog` | `DialogPanel` / `DialogTitle` / `DialogDescription` / `DialogOverlay` | Overlay |
| `Popover` | `PopoverButton` / `PopoverPanel` / `PopoverGroup` / `PopoverOverlay` | Overlay |
| `Disclosure` | `DisclosureButton` / `DisclosurePanel` | Disclosure |
| `TabGroup` | `TabList` / `Tab` / `TabPanels` / `TabPanel` | Disclosure |
| `Switch` / `SwitchGroup` / `SwitchLabel` / `SwitchDescription` | - | Form |
| `RadioGroup` | `RadioGroupOption` / `RadioGroupLabel` / `RadioGroupDescription` | Form |
| `TransitionRoot` / `TransitionChild` | - | Utility |

> Vue v1 缺：Checkbox / Input / Textarea / Select / Field / Fieldset / Legend / Button / 内置 anchor。

### 1.4 Vue v1 导入

```ts
import {
  Menu, MenuButton, MenuItems, MenuItem,
  Listbox, ListboxButton, ListboxOptions, ListboxOption, ListboxLabel,
  Combobox, ComboboxInput, ComboboxButton, ComboboxOptions, ComboboxOption, ComboboxLabel,
  Dialog, DialogPanel, DialogTitle, DialogDescription, DialogOverlay,
  Popover, PopoverButton, PopoverPanel, PopoverGroup, PopoverOverlay,
  Disclosure, DisclosureButton, DisclosurePanel,
  TabGroup, TabList, Tab, TabPanels, TabPanel,
  Switch, SwitchGroup, SwitchLabel, SwitchDescription,
  RadioGroup, RadioGroupOption, RadioGroupLabel, RadioGroupDescription,
  TransitionRoot, TransitionChild,
} from "@headlessui/vue";
```

## 2. Menu API 速查

```tsx
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/react";
```

### 2.1 Menu

| Prop | 类型 | 默认 | 说明 |
|------|------|------|------|
| `as` | `ElementType` | `Fragment` | 渲染元素 |
| `__demoMode` | `boolean` | - | demo 模式 |

**Render prop**：`{ open, close }`

### 2.2 MenuButton

| Prop | 类型 | 默认 | 说明 |
|------|------|------|------|
| `as` | `ElementType` | `'button'` | 渲染元素 |
| `disabled` | `boolean` | `false` | 禁用 |
| `autoFocus` | `boolean` | - | 初始聚焦 |

**Data-* 属性**：`data-open` / `data-focus` / `data-hover` / `data-active` / `data-autofocus`
**Render prop**：`{ open, focus, hover, active, autofocus }`

### 2.3 MenuItems

| Prop | 类型 | 默认 | 说明 |
|------|------|------|------|
| `as` | `ElementType` | `'div'` | 渲染元素 |
| `anchor` | `AnchorProps` | - | 锚定配置 |
| `static` | `boolean` | `false` | 始终渲染 |
| `unmount` | `boolean` | `true` | 关闭时卸载 |
| `portal` | `boolean` | 自动 | 是否 portal |
| `modal` | `boolean` | `true` | 是否 modal |
| `transition` | `boolean` | `false` | 启用 transition |

**Data-* 属性**：`data-open` / `data-closed` / `data-enter` / `data-leave` / `data-transition`
**Render prop**：`{ open }`

### 2.4 MenuItem

| Prop | 类型 | 默认 | 说明 |
|------|------|------|------|
| `as` | `ElementType` | `Fragment` | 渲染元素 |
| `disabled` | `boolean` | `false` | 禁用 |

**Data-* 属性**：`data-disabled` / `data-focus`
**Render prop**：`{ disabled, focus, close }`

### 2.5 MenuSection / MenuHeading / MenuSeparator

| 组件 | 默认 as | 说明 |
|------|--------|------|
| `MenuSection` | `'div'` | 分组容器 |
| `MenuHeading` | `'header'` | 分组标题 |
| `MenuSeparator` | `'div'` | 分隔线 |

## 3. Listbox API 速查

```tsx
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from "@headlessui/react";
```

### 3.1 Listbox

| Prop | 类型 | 默认 | 说明 |
|------|------|------|------|
| `value` | `T \| T[]` | - | 受控值 |
| `defaultValue` | `T \| T[]` | - | 非受控初始值 |
| `onChange` | `(v: T \| T[]) => void` | - | 值变化 |
| `multiple` | `boolean` | `false` | 多选 |
| `disabled` | `boolean` | `false` | 禁用 |
| `name` | `string` | - | 表单字段名 |
| `form` | `string` | - | 关联表单 ID |
| `by` | `keyof T \| (a, b) => boolean` | - | 对象比较 |
| `horizontal` | `boolean` | `false` | 横向布局 |

**Render prop**：`{ open, disabled, value }`

### 3.2 ListboxButton

与 `MenuButton` 相同 props。**Data-* 属性**额外：`data-active` / `data-hover`。**Render prop** 额外：`{ value, disabled }`。

### 3.3 ListboxOptions

与 `MenuItems` 相同 props。

### 3.4 ListboxOption

| Prop | 类型 | 说明 |
|------|------|------|
| `value` | `T` | 当前选项值（必须） |
| `as` | `ElementType` | `Fragment` |
| `disabled` | `boolean` | 禁用 |
| `order` | `number` | 排序（虚拟滚动场景） |

**Data-* 属性**：`data-selected` / `data-focus` / `data-disabled`
**Render prop**：`{ focus, selected, disabled }`

### 3.5 ListboxSelectedOption

```tsx
<ListboxSelectedOption>
  {(value: typeof people[number] | null) => value?.name ?? "请选择"}
</ListboxSelectedOption>
```

在 `ListboxButton` 内显示当前选中项的便捷组件。

## 4. Combobox API 速查

```tsx
import { Combobox, ComboboxInput, ComboboxButton, ComboboxOptions, ComboboxOption } from "@headlessui/react";
```

### 4.1 Combobox

| Prop | 类型 | 默认 | 说明 |
|------|------|------|------|
| `value` | `T \| T[] \| null` | - | 受控值 |
| `defaultValue` | `T \| T[] \| null` | - | 非受控 |
| `onChange` | `(v: T \| T[] \| null) => void` | - | 值变化 |
| `onClose` | `() => void` | - | 关闭回调 |
| `multiple` | `boolean` | `false` | 多选 |
| `disabled` | `boolean` | `false` | 禁用 |
| `nullable` | `boolean` | - | (v1 用) v2 默认允许 null |
| `name` | `string` | - | 表单字段名 |
| `form` | `string` | - | 关联表单 |
| `by` | `keyof T \| (a, b) => boolean` | - | 对象比较 |
| `immediate` | `boolean` | `false` | 聚焦立即打开 |
| `virtual` | `{ options: T[], disabled?: (t: T) => boolean }` | - | 虚拟滚动 |

**Render prop**：`{ open, disabled, value, activeIndex, activeOption }`

### 4.2 ComboboxInput

| Prop | 类型 | 说明 |
|------|------|------|
| `displayValue` | `(value: T) => string` | 控制 input 显示文本 |
| `onChange` | `ChangeEventHandler` | 输入变化 |
| `as` | `ElementType` | `'input'` |
| `autoFocus` | `boolean` | 自动聚焦 |

**Data-* 属性**：`data-open` / `data-focus` / `data-disabled` / `data-hover`

### 4.3 ComboboxButton

类似 ListboxButton。

### 4.4 ComboboxOptions

| Prop | 类型 | 默认 | 说明 |
|------|------|------|------|
| `as` | `ElementType` | `'div'` | 渲染元素 |
| `anchor` | `AnchorProps` | - | 锚定 |
| `transition` | `boolean` | `false` | 启用 transition |
| `static` | `boolean` | `false` | 始终渲染 |
| `unmount` | `boolean` | `true` | 关闭卸载 |
| `portal` | `boolean` | 自动 | 是否 portal |
| `modal` | `boolean` | `true` | 是否 modal |
| `hold` | `boolean` | `false` | 阻止滚动事件冒泡 |

### 4.5 ComboboxOption

类似 ListboxOption。

## 5. Dialog API 速查

```tsx
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle, DialogDescription } from "@headlessui/react";
```

### 5.1 Dialog

| Prop | 类型 | 默认 | 说明 |
|------|------|------|------|
| `open` | `boolean` | - | 受控（**必须**） |
| `onClose` | `(value: false) => void` | - | 关闭回调（**必须**） |
| `role` | `'dialog' \| 'alertdialog'` | `'dialog'` | a11y role |
| `transition` | `boolean` | `false` | 启用 transition |
| `static` | `boolean` | `false` | 不内置 mount/unmount |
| `unmount` | `boolean` | `true` | 关闭卸载 |
| `autoFocus` | `boolean` | `true` | 自动聚焦 |
| `as` | `ElementType` | `'div'` | 渲染元素 |
| `__demoMode` | `boolean` | - | demo 模式 |

**Render prop**：`{ open }`

### 5.2 DialogBackdrop

| Prop | 类型 | 说明 |
|------|------|------|
| `as` | `ElementType` | `'div'` |
| `transition` | `boolean` | 启用 transition |

### 5.3 DialogPanel

| Prop | 类型 | 说明 |
|------|------|------|
| `as` | `ElementType` | `'div'` |
| `transition` | `boolean` | 启用 transition |

**点击 Panel 外触发 onClose**。

### 5.4 DialogTitle / DialogDescription

| 组件 | 默认 as | 说明 |
|------|--------|------|
| `DialogTitle` | `'h2'` | a11y title（必需） |
| `DialogDescription` | `'p'` | a11y description |

## 6. Popover API 速查

```tsx
import { Popover, PopoverButton, PopoverPanel, PopoverGroup, PopoverBackdrop } from "@headlessui/react";
```

### 6.1 Popover

| Prop | 类型 | 默认 | 说明 |
|------|------|------|------|
| `as` | `ElementType` | `'div'` | 渲染元素 |

**Render prop**：`{ open, close }`

### 6.2 PopoverButton

类似 MenuButton。

### 6.3 PopoverPanel

| Prop | 类型 | 默认 | 说明 |
|------|------|------|------|
| `as` | `ElementType` | `'div'` | 渲染元素 |
| `anchor` | `AnchorProps` | - | 锚定 |
| `transition` | `boolean` | `false` | 启用 transition |
| `static` | `boolean` | `false` | 始终渲染 |
| `unmount` | `boolean` | `true` | 关闭卸载 |
| `portal` | `boolean` | 自动 | 是否 portal |
| `modal` | `boolean` | `false` | 是否 modal（默认 false，不锁滚动） |
| `focus` | `boolean` | `false` | 强制聚焦内部 |

### 6.4 PopoverGroup

协调多个 Popover 的焦点流。

### 6.5 PopoverBackdrop

| Prop | 类型 | 说明 |
|------|------|------|
| `as` | `ElementType` | `'div'` |
| `transition` | `boolean` | 启用 transition |

**点击 backdrop 关闭 Popover**。

## 7. Disclosure API 速查

```tsx
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
```

### 7.1 Disclosure

| Prop | 类型 | 默认 | 说明 |
|------|------|------|------|
| `as` | `ElementType` | `Fragment` | 渲染元素 |
| `defaultOpen` | `boolean` | `false` | 非受控初始 open |

**Render prop**：`{ open, close }`

### 7.2 DisclosureButton

| Prop | 类型 | 说明 |
|------|------|------|
| `as` | `ElementType` | `'button'` |
| `autoFocus` | `boolean` | 自动聚焦 |
| `disabled` | `boolean` | 禁用 |

**Data-* 属性**：`data-open` / `data-focus` / `data-hover` / `data-active`

### 7.3 DisclosurePanel

| Prop | 类型 | 默认 | 说明 |
|------|------|------|------|
| `as` | `ElementType` | `'div'` | 渲染元素 |
| `transition` | `boolean` | `false` | 启用 transition |
| `static` | `boolean` | `false` | 始终渲染 |
| `unmount` | `boolean` | `true` | 关闭卸载 |

## 8. TabGroup API 速查

```tsx
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from "@headlessui/react";
```

### 8.1 TabGroup

| Prop | 类型 | 默认 | 说明 |
|------|------|------|------|
| `as` | `ElementType` | `'div'` | 渲染元素 |
| `defaultIndex` | `number` | `0` | 非受控 index |
| `selectedIndex` | `number` | - | 受控 index |
| `onChange` | `(index: number) => void` | - | 切换回调 |
| `vertical` | `boolean` | `false` | 垂直布局 |
| `manual` | `boolean` | `false` | 键盘不自动切换 |

### 8.2 TabList

| Prop | 类型 | 说明 |
|------|------|------|
| `as` | `ElementType` | `'div'` |

### 8.3 Tab

| Prop | 类型 | 说明 |
|------|------|------|
| `as` | `ElementType` | `'button'` |
| `disabled` | `boolean` | 禁用 |
| `autoFocus` | `boolean` | 自动聚焦 |

**Data-* 属性**：`data-selected` / `data-focus` / `data-hover` / `data-disabled` / `data-autofocus`
**Render prop**：`{ selected, focus, hover, autofocus, disabled }`

### 8.4 TabPanels / TabPanel

| 组件 | 默认 as | 说明 |
|------|--------|------|
| `TabPanels` | `'div'` | 容器 |
| `TabPanel` | `'div'` | 单个 panel |

`TabPanel` props：

| Prop | 类型 | 说明 |
|------|------|------|
| `static` | `boolean` | 始终渲染 |
| `unmount` | `boolean` | 切换时卸载（默认 true） |

## 9. Switch API 速查

```tsx
import { Switch } from "@headlessui/react";
```

| Prop | 类型 | 默认 | 说明 |
|------|------|------|------|
| `checked` | `boolean` | - | 受控 |
| `defaultChecked` | `boolean` | `false` | 非受控 |
| `onChange` | `(checked: boolean) => void` | - | 切换 |
| `as` | `ElementType` | `'button'` | 渲染元素 |
| `name` | `string` | - | 表单字段 |
| `form` | `string` | - | 关联表单 |
| `value` | `string` | `'on'` | 提交值 |
| `disabled` | `boolean` | `false` | 禁用 |
| `autoFocus` | `boolean` | - | 自动聚焦 |

**Data-* 属性**：`data-checked` / `data-focus` / `data-hover` / `data-active` / `data-disabled`
**Render prop**：`{ checked, focus, hover, autofocus, disabled, changing }`

## 10. Checkbox API 速查（v2 新）

```tsx
import { Checkbox } from "@headlessui/react";
```

| Prop | 类型 | 默认 | 说明 |
|------|------|------|------|
| `checked` | `boolean` | - | 受控 |
| `defaultChecked` | `boolean` | `false` | 非受控 |
| `onChange` | `(checked: boolean) => void` | - | 切换 |
| `indeterminate` | `boolean` | `false` | indeterminate 态 |
| `as` | `ElementType` | `'span'` | 渲染元素 |
| `name` | `string` | - | 表单字段 |
| `value` | `string` | `'on'` | 提交值 |
| `disabled` | `boolean` | `false` | 禁用 |
| `autoFocus` | `boolean` | - | 自动聚焦 |

**Data-* 属性**：`data-checked` / `data-indeterminate` / `data-focus` / `data-hover` / `data-active` / `data-disabled`
**Render prop**：`{ checked, focus, hover, indeterminate, disabled }`

## 11. RadioGroup API 速查

```tsx
import { RadioGroup, Radio } from "@headlessui/react";
```

### 11.1 RadioGroup

| Prop | 类型 | 默认 | 说明 |
|------|------|------|------|
| `value` | `T` | - | 受控 |
| `defaultValue` | `T` | - | 非受控 |
| `onChange` | `(value: T) => void` | - | 切换 |
| `disabled` | `boolean` | `false` | 禁用整组 |
| `name` | `string` | - | 表单字段 |
| `form` | `string` | - | 关联表单 |
| `by` | `keyof T \| (a, b) => boolean` | - | 对象比较 |
| `as` | `ElementType` | `'div'` | 渲染元素 |

### 11.2 Radio

| Prop | 类型 | 说明 |
|------|------|------|
| `value` | `T` | 选项值（必须） |
| `disabled` | `boolean` | 禁用 |
| `as` | `ElementType` | `'span'` |
| `autoFocus` | `boolean` | 自动聚焦 |

**Data-* 属性**：`data-checked` / `data-focus` / `data-hover` / `data-disabled`
**Render prop**：`{ checked, focus, hover, disabled }`

## 12. Input / Textarea / Select API 速查（v2 新）

```tsx
import { Input, Textarea, Select } from "@headlessui/react";
```

| Prop | 类型 | 说明 |
|------|------|------|
| `invalid` | `boolean` | 错误态 |
| `disabled` | `boolean` | 禁用 |
| `autoFocus` | `boolean` | 自动聚焦 |
| `as` | `ElementType` | `'input'` / `'textarea'` / `'select'` |
| 所有原生 HTML 属性 | - | type / placeholder / required / pattern... |

**Data-* 属性**：`data-focus` / `data-hover` / `data-invalid` / `data-disabled`

## 13. Fieldset / Legend / Field / Label / Description API 速查（v2 新）

```tsx
import { Fieldset, Legend, Field, Label, Description } from "@headlessui/react";
```

### 13.1 Fieldset

| Prop | 类型 | 说明 |
|------|------|------|
| `disabled` | `boolean` | 级联禁用所有内部表单控件 |
| `as` | `ElementType` | `'fieldset'` |

**Data-* 属性**：`data-disabled`
**Render prop**：`{ disabled }`

### 13.2 Legend

| Prop | 类型 | 说明 |
|------|------|------|
| `as` | `ElementType` | `'div'`（注意不是原生 `<legend>`） |

### 13.3 Field

| Prop | 类型 | 说明 |
|------|------|------|
| `disabled` | `boolean` | 级联禁用 |
| `as` | `ElementType` | `'div'` |

**Data-* 属性**：`data-disabled`
**Render prop**：`{ disabled }`

### 13.4 Label / Description

| 组件 | 默认 as | 说明 |
|------|--------|------|
| `Label` | `'label'` | 自动 wire `id` 和 control 的 `aria-labelledby` |
| `Description` | `'p'` | 自动 wire `id` 和 control 的 `aria-describedby` |

`Label` 额外 prop：

| Prop | 类型 | 说明 |
|------|------|------|
| `passive` | `boolean` | 点击 Label 不切换 control（默认 false） |

## 14. Button API 速查（v2 新）

```tsx
import { Button } from "@headlessui/react";
```

| Prop | 类型 | 说明 |
|------|------|------|
| `as` | `ElementType` | `'button'` |
| `disabled` | `boolean` | 禁用 |
| `autoFocus` | `boolean` | 自动聚焦 |
| 所有 `<button>` HTML 属性 | - | type / onClick / form... |

**Data-* 属性**：`data-focus` / `data-hover` / `data-active` / `data-disabled` / `data-autofocus`

## 15. Transition API 速查

```tsx
import { Transition, TransitionChild } from "@headlessui/react";
```

### 15.1 Transition

| Prop | 类型 | 默认 | 说明 |
|------|------|------|------|
| `show` | `boolean` | - | 是否显示 |
| `appear` | `boolean` | `false` | 首次挂载播放 enter |
| `as` | `ElementType` | `Fragment` | 渲染元素 |
| `unmount` | `boolean` | `true` | leave 后卸载 |
| `enter` | `string` | - | enter 阶段 className |
| `enterFrom` | `string` | - | enter 起始 className |
| `enterTo` | `string` | - | enter 终点 className |
| `leave` | `string` | - | leave 阶段 className |
| `leaveFrom` | `string` | - | leave 起始 className |
| `leaveTo` | `string` | - | leave 终点 className |
| `beforeEnter` | `() => void` | - | enter 开始前 |
| `afterEnter` | `() => void` | - | enter 结束后 |
| `beforeLeave` | `() => void` | - | leave 开始前 |
| `afterLeave` | `() => void` | - | leave 结束后 |

**Data-* 属性**：`data-closed` / `data-enter` / `data-leave` / `data-transition`

### 15.2 TransitionChild

与 Transition 相同但**不需要 `show` prop**（继承父级）。

### 15.3 `transition` prop（其他组件用）

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
```

适用组件：`MenuItems` / `ListboxOptions` / `ComboboxOptions` / `PopoverPanel` / `DisclosurePanel` / `Dialog` / `DialogBackdrop` / `DialogPanel`。

## 16. CloseButton API 速查

```tsx
import { CloseButton } from "@headlessui/react";
```

| Prop | 类型 | 说明 |
|------|------|------|
| `as` | `ElementType` | `'button'` |

**调用上下文最近的 close 函数**（Dialog / Popover / Disclosure）。

```tsx
<DisclosurePanel>
  <CloseButton>关闭</CloseButton>
</DisclosurePanel>
```

## 17. useClose Hook

```tsx
import { useClose } from "@headlessui/react";

function CustomCloseButton() {
  const close = useClose();
  return <button onClick={close}>关闭</button>;
}
```

调用上下文最近的 close 函数（Dialog / Popover / Disclosure / Menu）。

## 18. Anchor Positioning 完整配置

### 18.1 字符串语法

| 值 | 含义 |
|---|------|
| `"top"` | top center |
| `"top start"` | top 左对齐 |
| `"top end"` | top 右对齐 |
| `"bottom"` | bottom center |
| `"bottom start"` | bottom 左对齐 |
| `"bottom end"` | bottom 右对齐 |
| `"left"` | left center |
| `"left start"` | left 顶部对齐 |
| `"left end"` | left 底部对齐 |
| `"right"` | right center |
| `"right start"` | right 顶部对齐 |
| `"right end"` | right 底部对齐 |

### 18.2 对象语法

```ts
type AnchorProps = string | {
  to?: AnchorString;          // 同字符串语法
  gap?: number | string;       // 距 Trigger 距离
  offset?: number | string;    // 沿对齐方向偏移
  padding?: number | string;   // 视窗最小距离
};
```

### 18.3 CSS 变量

| 变量 | 含义 |
|------|------|
| `--anchor-gap` | 距 Trigger 距离 |
| `--anchor-offset` | 偏移 |
| `--anchor-padding` | 视窗最小距离 |
| `--button-width` | Trigger 宽度（只读） |
| `--input-width` | ComboboxInput 宽度（只读） |

### 18.4 适用组件

`MenuItems` / `ListboxOptions` / `ComboboxOptions` / `PopoverPanel`。

## 19. Data-* 属性全表

| 属性 | 含义 | 适用 |
|------|------|------|
| `data-open` | 当前 open | Menu / Listbox / Combobox / Popover / Disclosure / Dialog (Panel) |
| `data-closed` | transition closed 态 | 任何 transition 组件 |
| `data-enter` | transition enter 阶段 | 任何 transition 组件 |
| `data-leave` | transition leave 阶段 | 任何 transition 组件 |
| `data-transition` | transition 期间 | 任何 transition 组件 |
| `data-focus` | 键盘 focus（等价 `:focus-visible`） | Trigger / Item / Input |
| `data-hover` | 鼠标 hover（触摸设备自动忽略） | Trigger / Item |
| `data-active` | 鼠标按下（拖出自动消失） | Trigger / Item |
| `data-disabled` | 禁用 | 任何组件 |
| `data-selected` | 当前选中 | Listbox/Combobox Option / Tab |
| `data-checked` | 选中态 | Checkbox / Switch / Radio |
| `data-indeterminate` | indeterminate 态 | Checkbox |
| `data-invalid` | 错误态 | Input / Textarea / Select |
| `data-autofocus` | autoFocus prop 设置 | Trigger / Input |
| `data-headlessui-state` | 综合状态（debug） | 任何组件 |

## 20. 键盘快捷键全表

### 20.1 Menu

| 键 | 上下文 | 行为 |
|---|--------|------|
| Enter / Space | Button focused | 打开菜单，聚焦首项 |
| Arrow Down/Up | Button focused | 打开菜单，聚焦首/末项 |
| Esc | 菜单打开 | 关闭菜单 |
| Arrow Down/Up | 菜单打开 | 上下移动 |
| Home / PageUp | 菜单打开 | 跳到首项 |
| End / PageDown | 菜单打开 | 跳到末项 |
| Enter / Space | 菜单打开 | 选中当前项 |
| A-Z / a-z | 菜单打开 | typeahead 搜索 |
| Tab | 菜单打开 | 关闭菜单并跳到下一焦点 |

### 20.2 Listbox

同 Menu，且：

| 键 | 行为 |
|---|------|
| Arrow Up/Down | 移动选项 |
| Enter/Space | 选中 |
| Esc | 关闭 |
| Home/End | 跳到首/末 |

### 20.3 Combobox

| 键 | 行为 |
|---|------|
| Arrow Down/Up | 移动选项 |
| Enter | 选中当前 + 关闭 |
| Esc | 清空 query 或关闭 |
| Home/End | 跳到首/末 |
| 任意字符 | 输入到 query |

### 20.4 Dialog

| 键 | 行为 |
|---|------|
| Esc | 触发 onClose |
| Tab / Shift+Tab | 在 Dialog 内循环焦点 |

### 20.5 Tabs

| 键 | 行为 |
|---|------|
| Arrow Left/Right（水平）/ Up/Down（垂直） | 切换 tab |
| Home / End | 跳到首/末 tab |
| Enter / Space | 在 `manual` 模式下激活 tab |
| Tab | 跳到 panel |

### 20.6 Disclosure

| 键 | 行为 |
|---|------|
| Enter / Space | 切换 panel |

### 20.7 Switch / Checkbox

| 键 | 行为 |
|---|------|
| Space | 切换 |
| Enter | （在表单中）提交 |

### 20.8 RadioGroup

| 键 | 行为 |
|---|------|
| Arrow Up/Down / Left/Right | 切换选项 |
| Space | 选中 |

### 20.9 Popover

| 键 | 行为 |
|---|------|
| Esc | 关闭 |
| Tab / Shift+Tab | 离开 popover 后正常焦点流 |

## 21. TypeScript 核心类型

### 21.1 Anchor

```ts
type AnchorTo =
  | "top"
  | "top start"
  | "top end"
  | "bottom"
  | "bottom start"
  | "bottom end"
  | "left"
  | "left start"
  | "left end"
  | "right"
  | "right start"
  | "right end";

type AnchorProps =
  | AnchorTo
  | {
      to?: AnchorTo;
      gap?: number | string;
      offset?: number | string;
      padding?: number | string;
    };
```

### 21.2 组件 Props 类型

```ts
import type {
  MenuProps,
  MenuButtonProps,
  MenuItemsProps,
  MenuItemProps,
  ListboxProps,
  ComboboxProps,
  DialogProps,
  DialogPanelProps,
  PopoverProps,
  DisclosureProps,
  SwitchProps,
  CheckboxProps,
  RadioGroupProps,
  TabGroupProps,
  TransitionProps,
} from "@headlessui/react";
```

### 21.3 受控组件泛型

```tsx
{/* 单选 */}
type Person = { id: number; name: string };
<Listbox<Person> value={selected} onChange={setSelected}>...</Listbox>

{/* 多选 */}
<Listbox<Person[]> value={selectedList} onChange={setSelectedList} multiple>...</Listbox>
```

### 21.4 displayValue 类型

```tsx
<ComboboxInput<Person | null>
  displayValue={(p) => p?.name ?? ""}
  onChange={(e) => setQuery(e.target.value)}
/>
```

## 22. Vue v1 API 简要速查

### 22.1 Menu

```vue
<Menu as="div">
  <MenuButton>选项</MenuButton>
  <MenuItems>
    <MenuItem v-slot="{ active, disabled }">
      <a :class="active ? 'bg-blue-500' : ''">设置</a>
    </MenuItem>
  </MenuItems>
</Menu>
```

**slot props**：`active`（高亮）/ `disabled`

### 22.2 Listbox

```vue
<Listbox v-model="selected">
  <ListboxButton>{{ selected?.name }}</ListboxButton>
  <ListboxOptions>
    <ListboxOption
      v-for="p in people"
      :key="p.id"
      :value="p"
      v-slot="{ active, selected }"
    >
      <li :class="active ? 'bg-blue-500' : ''">
        {{ p.name }}
        <span v-if="selected">✓</span>
      </li>
    </ListboxOption>
  </ListboxOptions>
</Listbox>
```

### 22.3 Dialog

```vue
<TransitionRoot :show="isOpen" as="template">
  <Dialog @close="closeModal">
    <DialogOverlay class="fixed inset-0 bg-black/30" />
    <DialogPanel class="...">
      <DialogTitle>标题</DialogTitle>
      <DialogDescription>描述</DialogDescription>
    </DialogPanel>
  </Dialog>
</TransitionRoot>
```

> 注意：Vue 版的遮罩叫 **`DialogOverlay`**，React v2 叫 **`DialogBackdrop`**。

### 22.4 Combobox

```vue
<Combobox v-model="selected">
  <ComboboxInput
    :display-value="(p) => p?.name"
    @change="query = $event.target.value"
  />
  <ComboboxOptions>
    <ComboboxOption
      v-for="p in filtered"
      :key="p.id"
      :value="p"
      v-slot="{ active, selected }"
    >
      <li :class="active ? 'bg-blue-500' : ''">{{ p.name }}</li>
    </ComboboxOption>
  </ComboboxOptions>
</Combobox>
```

### 22.5 Switch

```vue
<Switch v-model="enabled" :class="enabled ? 'bg-blue-600' : 'bg-gray-200'">
  <span :class="enabled ? 'translate-x-6' : 'translate-x-1'" />
</Switch>
```

### 22.6 RadioGroup

```vue
<RadioGroup v-model="selected">
  <RadioGroupOption
    v-for="plan in plans"
    :key="plan.id"
    :value="plan"
    v-slot="{ active, checked }"
  >
    <div :class="checked ? 'border-blue-500' : 'border-gray-300'">
      <RadioGroupLabel>{{ plan.name }}</RadioGroupLabel>
      <RadioGroupDescription>{{ plan.price }}</RadioGroupDescription>
    </div>
  </RadioGroupOption>
</RadioGroup>
```

### 22.7 Tabs

```vue
<TabGroup>
  <TabList>
    <Tab v-slot="{ selected }">
      <button :class="selected ? 'border-b-2 border-blue-500' : ''">
        最新
      </button>
    </Tab>
  </TabList>
  <TabPanels>
    <TabPanel>内容 1</TabPanel>
  </TabPanels>
</TabGroup>
```

### 22.8 Vue v1 与 React v2 命名差异

| React v2 | Vue v1 | 备注 |
|---------|--------|------|
| `DialogBackdrop` | `DialogOverlay` | 遮罩 |
| `Transition` | `TransitionRoot` | 动画包装 |
| `Radio` | `RadioGroupOption` | 单选项 |
| `Label`（在 Listbox 内） | `ListboxLabel` | 关联 label |
| `Label`（在 Combobox 内） | `ComboboxLabel` | 关联 label |
| 数据属性 (`data-*`) | slot props (`v-slot`) | 状态消费 |
| `anchor` prop | 无（用 Floating UI Vue 手动） | 定位 |
| `transition` prop | 无（用 Vue `<transition>` 包装） | 动画 |
| `Checkbox` / `Input` / 等 | 不存在 | 表单 v2 新组件 |

## 23. 包尺寸参考

| 包 | gzipped 大小（约） |
|---|---|
| `@headlessui/react` v2 | ~30 KB |
| `@headlessui/vue` v1 | ~15 KB |

依赖（仅 React v2）：

- `@floating-ui/react` ~6 KB
- `@tanstack/react-virtual` ~5 KB
- `@react-aria/interactions` ~3 KB

## 24. 与同类库 API 对比

| 概念 | Headless UI v2 | Radix UI | Ark UI |
|------|---------------|----------|--------|
| 包结构 | 单包 | 30+ 独立包 + 1 聚合包 | 单包 |
| 命名 | 扁平（`MenuButton`） | 命名空间（`Menu.Trigger`） | 命名空间 |
| 状态属性 | `data-*` | `data-state="open"` | `data-state="open"` |
| Slot 模式 | `as={Fragment}` | `asChild` | `asChild` |
| 内置定位 | `anchor` prop（v2） | 无（Popover.Content side+align） | `positioning` prop |
| 内置 transition | `transition` prop | data-state + CSS 变量 | `present` API |
| 虚拟滚动 | `virtual.options`（Combobox） | 无 | 无 |
| Compound Component | 浅（2-3 层） | 深（4-6 层） | 中等 |
| Form Primitives | 完整 8 组件 | 4 组件 + Form root | 类似 |
| Vue 支持 | v1（部分） | 无（社区 Reka UI） | 有（完整） |

## 25. 官方资源链接

- 官网：[headlessui.com](https://headlessui.com)
- React v2 文档：[headlessui.com/react](https://headlessui.com/react/menu)
- Vue v1 文档：[headlessui.com/v1/vue](https://headlessui.com/v1/vue/menu)
- v2.0 发布博客（2024.5）：[tailwindcss.com/blog/headless-ui-v2](https://tailwindcss.com/blog/headless-ui-v2)
- 主仓库：[github.com/tailwindlabs/headlessui](https://github.com/tailwindlabs/headlessui)（27k+ Star）
- Changelog：[github.com/tailwindlabs/headlessui/releases](https://github.com/tailwindlabs/headlessui/releases)
- Tailwind UI：[tailwindui.com](https://tailwindui.com)
- Catalyst：[catalyst.tailwindui.com](https://catalyst.tailwindui.com/)
- 底层依赖（v2）：
  - [Floating UI](https://floating-ui.com)
  - [TanStack Virtual](https://tanstack.com/virtual)
  - [React Aria Interactions](https://react-spectrum.adobe.com/react-aria/)
