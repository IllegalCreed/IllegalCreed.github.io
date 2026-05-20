---
layout: doc
outline: [2, 3]
---

# Radix UI 参考

本文为 **Radix Primitives（30+）+ Radix Themes（70+）** 的 API 速查文档——所有组件清单、关键 props、CSS 变量、`data-*` 属性、键盘快捷键、TypeScript 类型一站式查询。

> 完整概念与示例见 [入门](./getting-started.md) 与 [指南](./guide-line.md)。

## 1. Radix Primitives 全部清单（30+）

### 1.1 独立 npm 包清单

| Primitive | 独立包名 | 分类 |
|-----------|---------|------|
| `Accordion` | `@radix-ui/react-accordion` | Disclosure |
| `Alert Dialog` | `@radix-ui/react-alert-dialog` | Overlay |
| `Aspect Ratio` | `@radix-ui/react-aspect-ratio` | Layout |
| `Avatar` | `@radix-ui/react-avatar` | Display |
| `Checkbox` | `@radix-ui/react-checkbox` | Form |
| `Collapsible` | `@radix-ui/react-collapsible` | Disclosure |
| `Context Menu` | `@radix-ui/react-context-menu` | Menu |
| `Dialog` | `@radix-ui/react-dialog` | Overlay |
| `Direction Provider` | `@radix-ui/react-direction` | Utility |
| `Dropdown Menu` | `@radix-ui/react-dropdown-menu` | Menu |
| `Form` | `@radix-ui/react-form` | Form |
| `Hover Card` | `@radix-ui/react-hover-card` | Overlay |
| `Label` | `@radix-ui/react-label` | Form |
| `Menubar` | `@radix-ui/react-menubar` | Menu |
| `Navigation Menu` | `@radix-ui/react-navigation-menu` | Menu |
| `One Time Password Field` | `@radix-ui/react-one-time-password-field` | Form |
| `Password Toggle Field` | `@radix-ui/react-password-toggle-field` | Form |
| `Popover` | `@radix-ui/react-popover` | Overlay |
| `Portal` | `@radix-ui/react-portal` | Utility |
| `Progress` | `@radix-ui/react-progress` | Display |
| `Radio Group` | `@radix-ui/react-radio-group` | Form |
| `Scroll Area` | `@radix-ui/react-scroll-area` | Layout |
| `Select` | `@radix-ui/react-select` | Form |
| `Separator` | `@radix-ui/react-separator` | Layout |
| `Slider` | `@radix-ui/react-slider` | Form |
| `Slot` | `@radix-ui/react-slot` | Utility |
| `Switch` | `@radix-ui/react-switch` | Form |
| `Tabs` | `@radix-ui/react-tabs` | Disclosure |
| `Toast` | `@radix-ui/react-toast` | Feedback |
| `Toggle` | `@radix-ui/react-toggle` | Form |
| `Toggle Group` | `@radix-ui/react-toggle-group` | Form |
| `Toolbar` | `@radix-ui/react-toolbar` | Layout |
| `Tooltip` | `@radix-ui/react-tooltip` | Overlay |
| `Accessible Icon` | `@radix-ui/react-accessible-icon` | Utility |
| `Visually Hidden` | `@radix-ui/react-visually-hidden` | Utility |

### 1.2 聚合包

```bash
pnpm add radix-ui
```

```tsx
import { Dialog, DropdownMenu, Popover, Tabs } from "radix-ui";
```

## 2. Dialog API 速查

```tsx
import * as Dialog from "@radix-ui/react-dialog";
```

### 2.1 Dialog.Root

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `defaultOpen` | `boolean` | `false` | 非受控初始 open |
| `open` | `boolean` | - | 受控 open |
| `onOpenChange` | `(open: boolean) => void` | - | open 变化回调 |
| `modal` | `boolean` | `true` | 是否模态（焦点陷阱 + body 滚动锁） |

### 2.2 Dialog.Trigger

| Prop | 类型 | 说明 |
|------|------|------|
| `asChild` | `boolean` | 合并到子元素 |

### 2.3 Dialog.Portal

| Prop | 类型 | 说明 |
|------|------|------|
| `container` | `HTMLElement` | 自定义 Portal 容器 |
| `forceMount` | `boolean` | 强制挂载（用于动画） |

### 2.4 Dialog.Overlay

| Prop | 类型 | 说明 |
|------|------|------|
| `forceMount` | `boolean` | 强制挂载 |
| `asChild` | `boolean` | 合并到子元素 |

### 2.5 Dialog.Content

| Prop | 类型 | 说明 |
|------|------|------|
| `onOpenAutoFocus` | `(e: Event) => void` | 打开时自动聚焦回调 |
| `onCloseAutoFocus` | `(e: Event) => void` | 关闭时焦点返回回调 |
| `onEscapeKeyDown` | `(e: KeyboardEvent) => void` | Esc 回调 |
| `onPointerDownOutside` | `(e: Event) => void` | 点击外部回调 |
| `onInteractOutside` | `(e: Event) => void` | 任意外部交互 |
| `forceMount` | `boolean` | 强制挂载 |

### 2.6 Dialog.Title / Description / Close

| Prop | 类型 | 说明 |
|------|------|------|
| `asChild` | `boolean` | 合并到子元素 |

## 3. Alert Dialog API 速查

```tsx
import * as AlertDialog from "@radix-ui/react-alert-dialog";
```

与 Dialog 几乎相同，但**总是 modal、不支持 onPointerDownOutside 关闭、必须 Action 或 Cancel**：

```tsx
<AlertDialog.Root>
  <AlertDialog.Trigger />
  <AlertDialog.Portal>
    <AlertDialog.Overlay />
    <AlertDialog.Content>
      <AlertDialog.Title />
      <AlertDialog.Description />
      <AlertDialog.Cancel />  {/* 取消按钮 */}
      <AlertDialog.Action />  {/* 确认按钮 */}
    </AlertDialog.Content>
  </AlertDialog.Portal>
</AlertDialog.Root>
```

## 4. Dropdown Menu API 速查

```tsx
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
```

### 4.1 Root

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `defaultOpen` | `boolean` | `false` | 非受控初始 |
| `open` | `boolean` | - | 受控 open |
| `onOpenChange` | `(open: boolean) => void` | - | open 变化回调 |
| `modal` | `boolean` | `true` | 是否模态 |
| `dir` | `'ltr' \| 'rtl'` | `'ltr'` | 方向 |

### 4.2 Content

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `loop` | `boolean` | `false` | 键盘循环 |
| `side` | `'top' \| 'right' \| 'bottom' \| 'left'` | `'bottom'` | 显示侧 |
| `sideOffset` | `number` | `0` | 距 Trigger 间距 |
| `align` | `'start' \| 'center' \| 'end'` | `'center'` | 沿边对齐 |
| `alignOffset` | `number` | `0` | 对齐偏移 |
| `avoidCollisions` | `boolean` | `true` | 自动避让 |
| `collisionBoundary` | `Element` | `null` | 碰撞边界 |
| `collisionPadding` | `number` | `0` | 碰撞内边距 |
| `arrowPadding` | `number` | `0` | Arrow 内边距 |
| `sticky` | `'partial' \| 'always'` | `'partial'` | 粘性 |
| `hideWhenDetached` | `boolean` | `false` | 滚出视窗时隐藏 |

### 4.3 Item

| Prop | 类型 | 说明 |
|------|------|------|
| `disabled` | `boolean` | 禁用 |
| `onSelect` | `(e: Event) => void` | 选中回调（e.preventDefault 阻止关闭） |
| `textValue` | `string` | typeahead 搜索文本 |
| `asChild` | `boolean` | 合并到子元素 |

### 4.4 CheckboxItem / RadioGroup / RadioItem

```tsx
<DropdownMenu.CheckboxItem
  checked={checked}              // 受控
  onCheckedChange={setChecked}
>
  <DropdownMenu.ItemIndicator>✓</DropdownMenu.ItemIndicator>
  显示工具栏
</DropdownMenu.CheckboxItem>

<DropdownMenu.RadioGroup value={value} onValueChange={setValue}>
  <DropdownMenu.RadioItem value="cn">
    <DropdownMenu.ItemIndicator>•</DropdownMenu.ItemIndicator>
    中文
  </DropdownMenu.RadioItem>
</DropdownMenu.RadioGroup>
```

### 4.5 Sub / SubTrigger / SubContent

```tsx
<DropdownMenu.Sub>
  <DropdownMenu.SubTrigger>更多 ▶</DropdownMenu.SubTrigger>
  <DropdownMenu.Portal>
    <DropdownMenu.SubContent
      side="right"
      sideOffset={2}
      alignOffset={-5}
    >
      ...
    </DropdownMenu.SubContent>
  </DropdownMenu.Portal>
</DropdownMenu.Sub>
```

### 4.6 Label / Separator / Group / Arrow

```tsx
<DropdownMenu.Label />        {/* 不可选的分组标题 */}
<DropdownMenu.Separator />    {/* 分隔线 */}
<DropdownMenu.Group />        {/* 语义分组 */}
<DropdownMenu.Arrow />        {/* 指向 Trigger 的小三角 */}
```

## 5. Context Menu API 速查

```tsx
import * as ContextMenu from "@radix-ui/react-context-menu";
```

与 Dropdown Menu **几乎相同**，但 Trigger 是**右键触发**：

```tsx
<ContextMenu.Root>
  <ContextMenu.Trigger asChild>
    <div className="h-64 w-64 bg-gray-200">右键我</div>
  </ContextMenu.Trigger>
  <ContextMenu.Portal>
    <ContextMenu.Content>
      <ContextMenu.Item>复制</ContextMenu.Item>
      <ContextMenu.Item>粘贴</ContextMenu.Item>
    </ContextMenu.Content>
  </ContextMenu.Portal>
</ContextMenu.Root>
```

## 6. Popover API 速查

```tsx
import * as Popover from "@radix-ui/react-popover";
```

```tsx
<Popover.Root
  defaultOpen={false}
  open={...}
  onOpenChange={...}
  modal={false}              // 默认 false，可点击外部关闭
>
  <Popover.Trigger asChild />
  <Popover.Anchor asChild /> {/* 可选：定位锚点（默认是 Trigger） */}

  <Popover.Portal>
    <Popover.Content
      side="bottom"
      sideOffset={8}
      align="center"
      alignOffset={0}
      avoidCollisions={true}
      collisionBoundary={null}
      collisionPadding={0}
      arrowPadding={0}
      sticky="partial"
      hideWhenDetached={false}
      onOpenAutoFocus={...}
      onCloseAutoFocus={...}
      onEscapeKeyDown={...}
      onPointerDownOutside={...}
      onInteractOutside={...}
      onFocusOutside={...}
    >
      ...内容...
      <Popover.Close asChild />
      <Popover.Arrow />
    </Popover.Content>
  </Popover.Portal>
</Popover.Root>
```

## 7. Hover Card API 速查

```tsx
import * as HoverCard from "@radix-ui/react-hover-card";
```

```tsx
<HoverCard.Root
  openDelay={700}    // 默认 700ms
  closeDelay={300}   // 默认 300ms
  open={...}
  onOpenChange={...}
>
  <HoverCard.Trigger asChild>
    <a href="/user/jane">@jane</a>
  </HoverCard.Trigger>
  <HoverCard.Portal>
    <HoverCard.Content
      side="bottom"
      sideOffset={5}
      align="center"
    >
      <h4>Jane Doe</h4>
      <p>Frontend Engineer at Vercel</p>
      <HoverCard.Arrow />
    </HoverCard.Content>
  </HoverCard.Portal>
</HoverCard.Root>
```

## 8. Tooltip API 速查

```tsx
import * as Tooltip from "@radix-ui/react-tooltip";
```

```tsx
<Tooltip.Provider
  delayDuration={700}      // 默认 700ms
  skipDelayDuration={300}  // 切到下一个 Tooltip 的延迟
  disableHoverableContent={false}
>
  <Tooltip.Root open={...} onOpenChange={...} delayDuration={...}>
    <Tooltip.Trigger asChild>
      <button>?</button>
    </Tooltip.Trigger>
    <Tooltip.Portal>
      <Tooltip.Content
        side="top"
        sideOffset={4}
        align="center"
        avoidCollisions={true}
      >
        提示文本
        <Tooltip.Arrow />
      </Tooltip.Content>
    </Tooltip.Portal>
  </Tooltip.Root>
</Tooltip.Provider>
```

## 9. Select API 速查

```tsx
import * as Select from "@radix-ui/react-select";
```

### 9.1 Root

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `defaultValue` | `string` | - | 非受控初始值 |
| `value` | `string` | - | 受控 value |
| `onValueChange` | `(value: string) => void` | - | value 变化 |
| `open` | `boolean` | - | 受控 open |
| `onOpenChange` | `(open: boolean) => void` | - | open 变化 |
| `disabled` | `boolean` | `false` | 整体禁用 |
| `required` | `boolean` | `false` | 表单必填 |
| `name` | `string` | - | 表单字段名 |
| `dir` | `'ltr' \| 'rtl'` | `'ltr'` | 方向 |

### 9.2 完整结构

```tsx
<Select.Root>
  <Select.Trigger>
    <Select.Value placeholder="请选择" />
    <Select.Icon>▼</Select.Icon>
  </Select.Trigger>

  <Select.Portal>
    <Select.Content
      position="popper"      // popper / item-aligned
      side="bottom"
      sideOffset={4}
      align="start"
    >
      <Select.ScrollUpButton>▲</Select.ScrollUpButton>
      <Select.Viewport>
        <Select.Group>
          <Select.Label>水果</Select.Label>
          <Select.Item value="apple" disabled={false} textValue="apple">
            <Select.ItemText>苹果</Select.ItemText>
            <Select.ItemIndicator>✓</Select.ItemIndicator>
          </Select.Item>
        </Select.Group>
        <Select.Separator />
      </Select.Viewport>
      <Select.ScrollDownButton>▼</Select.ScrollDownButton>
      <Select.Arrow />
    </Select.Content>
  </Select.Portal>
</Select.Root>
```

## 10. Accordion API 速查

```tsx
import * as Accordion from "@radix-ui/react-accordion";
```

### 10.1 Root

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `type` | `'single' \| 'multiple'` | - | 必填 |
| `defaultValue` | `string \| string[]` | - | 非受控初始值 |
| `value` | `string \| string[]` | - | 受控 value |
| `onValueChange` | `function` | - | value 变化 |
| `collapsible` | `boolean` | `false` | type=single 时是否可全折 |
| `disabled` | `boolean` | `false` | 整体禁用 |
| `orientation` | `'horizontal' \| 'vertical'` | `'vertical'` | 方向 |
| `dir` | `'ltr' \| 'rtl'` | `'ltr'` | LTR/RTL |

### 10.2 完整结构

```tsx
<Accordion.Root type="single" defaultValue="item-1" collapsible>
  <Accordion.Item value="item-1" disabled={false}>
    <Accordion.Header>
      <Accordion.Trigger>第一项</Accordion.Trigger>
    </Accordion.Header>
    <Accordion.Content>第一项内容</Accordion.Content>
  </Accordion.Item>
</Accordion.Root>
```

## 11. Collapsible API 速查

```tsx
import * as Collapsible from "@radix-ui/react-collapsible";
```

```tsx
<Collapsible.Root
  defaultOpen={false}
  open={...}
  onOpenChange={...}
  disabled={false}
>
  <Collapsible.Trigger asChild>
    <button>展开 / 折叠</button>
  </Collapsible.Trigger>
  <Collapsible.Content>...内容...</Collapsible.Content>
</Collapsible.Root>
```

## 12. Tabs API 速查

```tsx
import * as Tabs from "@radix-ui/react-tabs";
```

### 12.1 Root

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `defaultValue` | `string` | - | 非受控初始 |
| `value` | `string` | - | 受控 |
| `onValueChange` | `function` | - | 变化回调 |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | 方向 |
| `dir` | `'ltr' \| 'rtl'` | `'ltr'` | LTR/RTL |
| `activationMode` | `'automatic' \| 'manual'` | `'automatic'` | 自动 / 手动激活 |

### 12.2 List / Trigger / Content

```tsx
<Tabs.Root defaultValue="overview">
  <Tabs.List aria-label="标签组" loop={true}>
    <Tabs.Trigger value="overview" disabled={false}>概览</Tabs.Trigger>
    <Tabs.Trigger value="settings">设置</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="overview" forceMount={false}>概览</Tabs.Content>
  <Tabs.Content value="settings">设置</Tabs.Content>
</Tabs.Root>
```

## 13. Checkbox API 速查

```tsx
import * as Checkbox from "@radix-ui/react-checkbox";
```

```tsx
<Checkbox.Root
  defaultChecked={false}
  checked={...}                   // boolean | 'indeterminate'
  onCheckedChange={...}
  disabled={false}
  required={false}
  name="agree"
  value="on"
>
  <Checkbox.Indicator>✓</Checkbox.Indicator>
</Checkbox.Root>
```

## 14. Radio Group API 速查

```tsx
import * as RadioGroup from "@radix-ui/react-radio-group";
```

```tsx
<RadioGroup.Root
  defaultValue="m"
  value={...}
  onValueChange={...}
  disabled={false}
  required={false}
  name="gender"
  orientation="vertical"
  loop={true}
>
  <RadioGroup.Item value="m">
    <RadioGroup.Indicator>•</RadioGroup.Indicator>
  </RadioGroup.Item>
  <RadioGroup.Item value="f">
    <RadioGroup.Indicator>•</RadioGroup.Indicator>
  </RadioGroup.Item>
</RadioGroup.Root>
```

## 15. Switch API 速查

```tsx
import * as Switch from "@radix-ui/react-switch";
```

```tsx
<Switch.Root
  defaultChecked={false}
  checked={...}
  onCheckedChange={...}
  disabled={false}
  required={false}
  name="notifications"
  value="on"
>
  <Switch.Thumb />
</Switch.Root>
```

## 16. Slider API 速查

```tsx
import * as Slider from "@radix-ui/react-slider";
```

```tsx
<Slider.Root
  defaultValue={[50]}              // 多 thumb 时多个值
  value={...}
  onValueChange={...}
  onValueCommit={...}              // 释放时触发
  min={0}
  max={100}
  step={1}
  minStepsBetweenThumbs={0}        // 多 thumb 间距
  disabled={false}
  orientation="horizontal"
  dir="ltr"
  inverted={false}
  name="volume"
>
  <Slider.Track>
    <Slider.Range />
  </Slider.Track>
  <Slider.Thumb />                  {/* 多个 thumb 写多个 */}
</Slider.Root>
```

## 17. Toggle / Toggle Group API 速查

```tsx
import * as Toggle from "@radix-ui/react-toggle";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
```

### 17.1 Toggle（单个）

```tsx
<Toggle.Root
  defaultPressed={false}
  pressed={...}
  onPressedChange={...}
  disabled={false}
>
  Bold
</Toggle.Root>
```

### 17.2 ToggleGroup

```tsx
<ToggleGroup.Root
  type="single"          // single / multiple
  defaultValue="left"
  value={...}
  onValueChange={...}
  disabled={false}
  orientation="horizontal"
  loop={true}
  rovingFocus={true}
>
  <ToggleGroup.Item value="left">L</ToggleGroup.Item>
  <ToggleGroup.Item value="center">C</ToggleGroup.Item>
  <ToggleGroup.Item value="right">R</ToggleGroup.Item>
</ToggleGroup.Root>
```

## 18. Progress / Avatar / Aspect Ratio API 速查

### 18.1 Progress

```tsx
import * as Progress from "@radix-ui/react-progress";

<Progress.Root value={75} max={100}>
  <Progress.Indicator
    style={{ transform: `translateX(-${100 - 75}%)` }}
  />
</Progress.Root>;
```

### 18.2 Avatar

```tsx
import * as Avatar from "@radix-ui/react-avatar";

<Avatar.Root>
  <Avatar.Image
    src="https://example.com/jane.jpg"
    alt="Jane"
    onLoadingStatusChange={(status) => /* idle / loading / loaded / error */}
  />
  <Avatar.Fallback delayMs={600}>J</Avatar.Fallback>
</Avatar.Root>;
```

### 18.3 Aspect Ratio

```tsx
import * as AspectRatio from "@radix-ui/react-aspect-ratio";

<AspectRatio.Root ratio={16 / 9}>
  <img src="..." alt="..." className="h-full w-full object-cover" />
</AspectRatio.Root>;
```

## 19. Toast API 速查

```tsx
import * as Toast from "@radix-ui/react-toast";
```

```tsx
<Toast.Provider
  duration={5000}
  swipeDirection="right"      // up / right / down / left
  swipeThreshold={50}
  label="通知"
>
  {children}

  <Toast.Root
    type="foreground"          // foreground / background
    duration={3000}
    open={open}
    onOpenChange={setOpen}
    onEscapeKeyDown={...}
    onPause={...}
    onResume={...}
    onSwipeStart={...}
    onSwipeMove={...}
    onSwipeCancel={...}
    onSwipeEnd={...}
    forceMount={false}
  >
    <Toast.Title />
    <Toast.Description />
    <Toast.Action altText="撤销操作" asChild>
      <button>撤销</button>
    </Toast.Action>
    <Toast.Close>×</Toast.Close>
  </Toast.Root>

  <Toast.Viewport
    label="通知 ({hotkey})"
    hotkey={["F8"]}            // 默认 F8
  />
</Toast.Provider>
```

## 20. Form API 速查

```tsx
import * as Form from "@radix-ui/react-form";
```

```tsx
<Form.Root onSubmit={...}>
  <Form.Field name="email" serverInvalid={false}>
    <Form.Label>邮箱</Form.Label>
    <Form.Control asChild>
      <input type="email" required />
    </Form.Control>

    {/* 内置 ValidityState 校验 */}
    <Form.Message match="valueMissing">必填</Form.Message>
    <Form.Message match="typeMismatch">格式不对</Form.Message>
    <Form.Message match="tooShort">太短</Form.Message>
    <Form.Message match="tooLong">太长</Form.Message>
    <Form.Message match="patternMismatch">不符合规则</Form.Message>
    <Form.Message match="rangeUnderflow">小于最小值</Form.Message>
    <Form.Message match="rangeOverflow">大于最大值</Form.Message>
    <Form.Message match="stepMismatch">步长不对</Form.Message>

    {/* 自定义校验 */}
    <Form.Message
      match={(value) => value.includes("admin")}
    >
      不允许 admin
    </Form.Message>

    {/* ValidityState 函数 */}
    <Form.ValidityState>
      {(validity) => validity?.valid ? "✓" : "✗"}
    </Form.ValidityState>
  </Form.Field>

  <Form.Submit asChild>
    <button>提交</button>
  </Form.Submit>
</Form.Root>
```

## 21. Scroll Area API 速查

```tsx
import * as ScrollArea from "@radix-ui/react-scroll-area";
```

```tsx
<ScrollArea.Root
  type="hover"            // auto / always / scroll / hover
  scrollHideDelay={600}
  dir="ltr"
>
  <ScrollArea.Viewport>{children}</ScrollArea.Viewport>
  <ScrollArea.Scrollbar orientation="vertical">
    <ScrollArea.Thumb />
  </ScrollArea.Scrollbar>
  <ScrollArea.Scrollbar orientation="horizontal">
    <ScrollArea.Thumb />
  </ScrollArea.Scrollbar>
  <ScrollArea.Corner />
</ScrollArea.Root>
```

## 22. Navigation Menu API 速查

```tsx
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
```

```tsx
<NavigationMenu.Root
  orientation="horizontal"
  delayDuration={200}
  skipDelayDuration={300}
  dir="ltr"
>
  <NavigationMenu.List>
    <NavigationMenu.Item>
      <NavigationMenu.Trigger>产品</NavigationMenu.Trigger>
      <NavigationMenu.Content>
        <NavigationMenu.Link>商品 A</NavigationMenu.Link>
        <NavigationMenu.Link>商品 B</NavigationMenu.Link>
      </NavigationMenu.Content>
    </NavigationMenu.Item>

    <NavigationMenu.Item>
      <NavigationMenu.Link href="/about">关于</NavigationMenu.Link>
    </NavigationMenu.Item>

    <NavigationMenu.Indicator />
  </NavigationMenu.List>

  <NavigationMenu.Viewport />
</NavigationMenu.Root>
```

## 23. Utility 工具组件

### 23.1 Portal（独立工具）

```tsx
import * as Portal from "@radix-ui/react-portal";

<Portal.Root container={...} asChild={false}>
  渲染到 body 末端的任意内容
</Portal.Root>;
```

### 23.2 Slot（asChild 底层）

```tsx
import { Slot } from "@radix-ui/react-slot";

function MyButton({ asChild, ...props }: { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp {...props} />;
}
```

### 23.3 Visually Hidden

```tsx
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

<VisuallyHidden.Root>仅 screen reader 可见的文本</VisuallyHidden.Root>;
```

### 23.4 Accessible Icon

```tsx
import { AccessibleIcon } from "@radix-ui/react-accessible-icon";

<AccessibleIcon label="设置">
  <SettingsIcon />
</AccessibleIcon>;
```

### 23.5 Direction Provider

```tsx
import { DirectionProvider } from "@radix-ui/react-direction";

<DirectionProvider dir="rtl">
  <App />
</DirectionProvider>;
```

### 23.6 Separator

```tsx
import * as Separator from "@radix-ui/react-separator";

<Separator.Root
  orientation="horizontal"
  decorative={true}
/>;
```

### 23.7 Label

```tsx
import * as Label from "@radix-ui/react-label";

<Label.Root htmlFor="name">姓名</Label.Root>
<input id="name" />;
```

## 24. Radix Themes 70+ 组件清单

### 24.1 Layout（布局）—— 6 个

| 组件 | 用途 |
|------|------|
| `Box` | 通用容器（div） |
| `Flex` | Flexbox 容器 |
| `Grid` | Grid 容器 |
| `Container` | 居中限宽容器 |
| `Section` | 语义分区 |
| `Inset` | 反向 padding（贴边） |

### 24.2 Typography（排版）—— 8 个

| 组件 | 用途 |
|------|------|
| `Text` | 通用文本（替代 span） |
| `Heading` | 标题（h1-h6） |
| `Em` | 斜体强调 |
| `Strong` | 粗体强调 |
| `Code` | 代码片段 |
| `Kbd` | 键盘按键 |
| `Blockquote` | 块引用 |
| `Quote` | 行内引用 |
| `Link` | 链接 |

### 24.3 Form / Input（表单输入）—— 13 个

| 组件 | 用途 |
|------|------|
| `TextField.Root` / `TextField.Slot` | 单行文本 |
| `TextArea` | 多行文本 |
| `Checkbox` | 复选框 |
| `CheckboxGroup.Root` / `.Item` | 复选框组 |
| `CheckboxCards.Root` / `.Item` | 卡片复选框 |
| `RadioGroup.Root` / `.Item` | 单选组 |
| `RadioCards.Root` / `.Item` | 卡片单选 |
| `Radio` | 单个 Radio（手动组合） |
| `Select.Root` / `.Trigger` / `.Content` / `.Item` | 下拉选择 |
| `Switch` | 开关 |
| `Slider` | 滑块 |
| `SegmentedControl.Root` / `.Item` | 分段控件 |

### 24.4 Display（展示）—— 12 个

| 组件 | 用途 |
|------|------|
| `Card` | 卡片 |
| `Avatar` | 头像 |
| `Badge` | 徽章 |
| `Callout.Root` / `.Icon` / `.Text` | 信息提示框 |
| `Code` | 代码 |
| `Table.Root` / `.Header` / `.Body` / `.Row` / `.Cell` | 基础表格 |
| `DataList.Root` / `.Item` / `.Label` / `.Value` | 数据列表 |
| `AlertDialog.Root` / `.Trigger` / `.Content` / `.Action` / `.Cancel` | 警告对话框 |
| `Dialog.Root` / `.Trigger` / `.Content` | 对话框 |
| `Popover.Root` / `.Trigger` / `.Content` | 浮窗 |
| `HoverCard.Root` / `.Trigger` / `.Content` | 悬停卡片 |
| `Tooltip` | 提示气泡 |

### 24.5 Feedback（反馈）—— 5 个

| 组件 | 用途 |
|------|------|
| `Spinner` | 加载转圈 |
| `Skeleton` | 骨架屏 |
| `Progress` | 进度条 |
| `Callout` | 提示框 |

### 24.6 Navigation（导航）—— 5 个

| 组件 | 用途 |
|------|------|
| `Tabs.Root` / `.List` / `.Trigger` / `.Content` | 标签页 |
| `TabNav.Root` / `.Link` | 导航 Tab |
| `DropdownMenu.Root` / `.Trigger` / `.Content` / `.Item` | 下拉菜单 |
| `ContextMenu.Root` / `.Trigger` / `.Content` / `.Item` | 右键菜单 |
| `SegmentedControl.Root` / `.Item` | 分段控件 |

### 24.7 Button / IconButton —— 2 个

| 组件 | 用途 |
|------|------|
| `Button` | 按钮 |
| `IconButton` | 图标按钮 |

### 24.8 Utility —— 5 个

| 组件 | 用途 |
|------|------|
| `Separator` | 分隔线 |
| `ScrollArea` | 自定义滚动 |
| `Reset` | 重置默认样式 |
| `AccessibleIcon` | 给图标加 aria-label |
| `VisuallyHidden` | 视觉隐藏 |
| `Portal` | Portal 容器 |
| `Slot` | asChild 底层 |
| `ThemePanel` | 主题预览面板（开发用） |

## 25. Theme 组件完整 Props

```tsx
<Theme
  accentColor="indigo"
  grayColor="slate"
  panelBackground="solid"
  radius="medium"
  scaling="100%"
  appearance="light"
  hasBackground={true}
  asChild={false}
>
  {children}
</Theme>
```

| Prop | 可选值 | 默认值 |
|------|--------|--------|
| `accentColor` | `gray` / `gold` / `bronze` / `brown` / `yellow` / `amber` / `orange` / `tomato` / `red` / `ruby` / `crimson` / `pink` / `plum` / `purple` / `violet` / `iris` / `indigo` / `blue` / `cyan` / `teal` / `jade` / `green` / `grass` / `lime` / `mint` / `sky` | `indigo` |
| `grayColor` | `gray` / `mauve` / `slate` / `sage` / `olive` / `sand` / `auto` | `auto` |
| `panelBackground` | `solid` / `translucent` | `translucent` |
| `radius` | `none` / `small` / `medium` / `large` / `full` | `medium` |
| `scaling` | `90%` / `95%` / `100%` / `105%` / `110%` | `100%` |
| `appearance` | `light` / `dark` / `inherit` | `light` |
| `hasBackground` | `boolean` | `true` |
| `asChild` | `boolean` | `false` |

## 26. Themes Layout Props 速查

### 26.1 通用 Layout（所有 Layout 组件 + Box 共享）

| Prop | 类型 | 说明 |
|------|------|------|
| `width` / `minWidth` / `maxWidth` | string | 宽度（CSS 值） |
| `height` / `minHeight` / `maxHeight` | string | 高度 |
| `m` / `mt` / `mr` / `mb` / `ml` / `mx` / `my` | `'0'` ~ `'9'` 或 `-9` ~ `-0`（负值） | margin |
| `p` / `pt` / `pr` / `pb` / `pl` / `px` / `py` | `'0'` ~ `'9'` | padding |
| `position` | `static` / `relative` / `absolute` / `fixed` / `sticky` | 定位 |
| `top` / `right` / `bottom` / `left` | string | 定位偏移 |
| `inset` | string | 一次设四方向 |
| `overflow` / `overflowX` / `overflowY` | `visible` / `hidden` / `scroll` / `auto` | 溢出 |
| `flexBasis` / `flexGrow` / `flexShrink` | string / number | Flex 子项 |
| `gridArea` / `gridColumn` / `gridRow` | string | Grid 子项 |
| `display` | `none` / `inline` / `block` / `flex` / `grid` | 显示 |

### 26.2 Flex 特有

| Prop | 类型 | 说明 |
|------|------|------|
| `direction` | `row` / `column` / `row-reverse` / `column-reverse` | 方向 |
| `align` | `start` / `center` / `end` / `baseline` / `stretch` | 交叉轴对齐 |
| `justify` | `start` / `center` / `end` / `between` | 主轴对齐 |
| `wrap` | `nowrap` / `wrap` / `wrap-reverse` | 换行 |
| `gap` / `gapX` / `gapY` | `'0'` ~ `'9'` | 间距 |

### 26.3 Grid 特有

| Prop | 类型 | 说明 |
|------|------|------|
| `columns` | string | grid-template-columns |
| `rows` | string | grid-template-rows |
| `flow` | `row` / `column` / `dense` | grid-auto-flow |
| `gap` / `gapX` / `gapY` | `'0'` ~ `'9'` | 间距 |

### 26.4 响应式对象

所有 props 都支持响应式对象：

```tsx
<Flex
  direction={{ initial: "column", md: "row" }}
  gap={{ initial: "2", md: "4", lg: "6" }}
  p={{ initial: "3", md: "6" }}
>
```

断点：`initial` / `xs` / `sm` / `md` / `lg` / `xl`

## 27. Themes 6 个 Variant

大部分 Themes 组件支持以下 variants：

| Variant | 视觉 | 用途 |
|---------|------|------|
| `solid` | 实色填充 | Primary CTA |
| `soft` | 柔和填充 | Secondary |
| `surface` | 表面（默认 Button） | 普通按钮 |
| `outline` | 边框 | 次要操作 |
| `ghost` | 仅文字 | 链接式按钮 |
| `classic` | 经典风格（带阴影） | 个性化 |

## 28. Themes 4 个 Size

大部分组件支持 `size="1"` / `"2"` / `"3"` / `"4"`：

| Size | 字号 | 高度 |
|------|------|------|
| `"1"` | 12px | 24px |
| `"2"` | 14px | 32px（默认） |
| `"3"` | 16px | 40px |
| `"4"` | 18px | 48px |

## 29. Themes Button 完整 Props

```tsx
<Button
  size="2"                  // 1 / 2 / 3 / 4
  variant="solid"           // 6 个 variant
  color="indigo"            // 任意 accent color
  highContrast={false}      // 高对比度
  radius="medium"           // none / small / medium / large / full
  loading={false}           // 加载态
  asChild={false}
  disabled={false}
  // 所有 Layout props
  m="2"
  p="3"
>
  点击
</Button>
```

## 30. Themes TextField 完整 Props

```tsx
<TextField.Root
  size="2"                  // 1 / 2 / 3
  variant="surface"         // classic / surface / soft
  color="indigo"
  radius="medium"
  placeholder="..."
  type="text"
  // HTML input props
>
  <TextField.Slot side="left">
    {/* 左侧 icon / button */}
  </TextField.Slot>
  <TextField.Slot side="right">
    {/* 右侧 icon / button */}
  </TextField.Slot>
</TextField.Root>
```

## 31. data-* 属性完整表

| 属性 | 可选值 | 出现位置 |
|------|--------|----------|
| `data-state` | `open` / `closed` / `instant-open` / `delayed-open` / `checked` / `unchecked` / `indeterminate` / `active` / `inactive` / `on` / `off` / `visible` / `hidden` | 几乎所有 stateful Primitive |
| `data-side` | `top` / `right` / `bottom` / `left` | Popper 类 Content |
| `data-align` | `start` / `center` / `end` | Popper 类 Content |
| `data-orientation` | `horizontal` / `vertical` | Accordion / Tabs / Slider / Separator / Toolbar / Toggle Group / Menubar / Radio Group |
| `data-disabled` | （存在即禁用） | 任何可禁用元素 |
| `data-highlighted` | （存在即键盘高亮） | Menu / Select Item |
| `data-placeholder` | （存在即占位状态） | Select Value（未选中） |
| `data-checked` | （存在即选中） | Checkbox / Radio / Switch |
| `data-pressed` | `on` / `off` | Toggle / Toggle Group Item |
| `data-active` | （存在即活动） | Toolbar / Tabs Trigger（选中态） |
| `data-radix-portal` | （存在即 Portal） | Portal 容器 |
| `data-collision-side` | `top` / `right` / `bottom` / `left` | Popper 碰撞翻转后的实际 side |
| `data-collision-padding-side` | side 值 | 碰撞调整的 padding |

## 32. CSS 变量完整表

| 变量 | 类型 | 出现位置 |
|------|------|----------|
| `--radix-popper-anchor-width` | px | Popper 类 |
| `--radix-popper-anchor-height` | px | Popper 类 |
| `--radix-popper-available-width` | px | Popper 类 |
| `--radix-popper-available-height` | px | Popper 类 |
| `--radix-popper-transform-origin` | string | Popper 类 |
| `--radix-{name}-trigger-width` | px | Dropdown / Popover / Tooltip / Select / Hover Card / Context Menu Content |
| `--radix-{name}-trigger-height` | px | 同上 |
| `--radix-{name}-content-available-width` | px | 同上 |
| `--radix-{name}-content-available-height` | px | 同上 |
| `--radix-{name}-content-transform-origin` | string | 同上 |
| `--radix-accordion-content-height` | px | Accordion Content |
| `--radix-accordion-content-width` | px | Accordion Content |
| `--radix-collapsible-content-height` | px | Collapsible Content |
| `--radix-collapsible-content-width` | px | Collapsible Content |
| `--radix-toast-swipe-move-x` | px | Toast 滑动 X |
| `--radix-toast-swipe-move-y` | px | Toast 滑动 Y |
| `--radix-toast-swipe-end-x` | px | Toast 滑动结束 X |
| `--radix-toast-swipe-end-y` | px | Toast 滑动结束 Y |
| `--radix-scroll-area-corner-width` | px | Scroll Area 角落 |
| `--radix-scroll-area-corner-height` | px | Scroll Area 角落 |
| `--radix-navigation-menu-viewport-width` | px | Navigation Menu Viewport |
| `--radix-navigation-menu-viewport-height` | px | 同上 |

**注**：`{name}` 替换为组件小写名（如 `dropdown-menu` / `popover` / `tooltip` / `select` / `hover-card` / `context-menu` / `menubar`）。

## 33. 键盘快捷键全表

| Primitive | 键 | 行为 |
|-----------|----|------|
| **Dialog** | Tab / Shift+Tab | 内部循环焦点 |
| | Esc | 关闭（modal 模式） |
| **Alert Dialog** | Tab / Shift+Tab | 内部循环 |
| | Esc | 关闭 |
| | Enter | 默认 Action |
| **Dropdown Menu** | Space / Enter | 选中 Item |
| | Arrow Up / Down | 上下导航 |
| | Arrow Right | 进入 SubMenu |
| | Arrow Left | 返回上级 |
| | Home / End | 跳首 / 尾 |
| | Esc | 关闭 |
| | 字母 | typeahead 搜索 |
| **Context Menu** | 同 Dropdown Menu | |
| **Menubar** | 同 Dropdown Menu | |
| | Arrow Left / Right | 切换顶级菜单 |
| **Navigation Menu** | Arrow keys | 导航 |
| | Enter / Space | 激活 |
| | Esc | 关闭 |
| **Select** | Space / Enter | 打开 / 选中 |
| | Arrow Up / Down | 上下导航 |
| | Home / End | 首 / 尾 |
| | Esc | 关闭 |
| | 字母 | typeahead |
| **Tabs** | Tab | 进入 / 离开 |
| | Arrow Left / Right | 切换（horizontal） |
| | Arrow Up / Down | 切换（vertical） |
| | Home / End | 首 / 尾 |
| **Accordion** | Space / Enter | 展开 / 折叠 |
| | Arrow Up / Down | 导航 Trigger |
| | Home / End | 首 / 尾 |
| **Slider** | Arrow Left / Right | 减 / 加 step |
| | Arrow Up / Down | 减 / 加 step |
| | Page Up / Down | 大步进 |
| | Home / End | min / max |
| **Toast** | F8 | 跳到 Viewport |
| | Esc | 关闭最新 Toast |
| **Checkbox / Switch / Toggle** | Space | 切换 |
| **Radio Group** | Arrow keys | 切换选项 |
| **Popover / Tooltip / Hover Card** | Tab | 进入 Content |
| | Esc | 关闭 |
| **Toolbar** | Arrow keys | 导航 |
| **Toggle Group** | Arrow keys | 导航 |

## 34. TypeScript 核心类型

### 34.1 Primitives 类型导出

每个 Primitive 包都暴露完整 TS 类型：

```tsx
import * as Dialog from "@radix-ui/react-dialog";

// 组件 props
type DialogContentProps = React.ComponentPropsWithoutRef<typeof Dialog.Content>;

// ref 类型
type DialogContentRef = React.ElementRef<typeof Dialog.Content>;

// forwardRef 包装
const MyContent = React.forwardRef<DialogContentRef, DialogContentProps>(
  (props, ref) => <Dialog.Content ref={ref} {...props} />,
);
```

### 34.2 Themes 核心类型

```tsx
import type {
  ThemeProps,
  AccentColor,
  GrayColor,
  Radius,
  Scaling,
  Appearance,
  ButtonProps,
  TextProps,
  HeadingProps,
} from "@radix-ui/themes";

// AccentColor 是字符串字面量联合类型
const c: AccentColor = "indigo";

// Layout props 类型
import type { LayoutProps, MarginProps, PaddingProps } from "@radix-ui/themes";
```

### 34.3 Slot / asChild 类型

```tsx
import { Slot } from "@radix-ui/react-slot";

interface MyButtonProps extends React.ComponentPropsWithoutRef<"button"> {
  asChild?: boolean;
}

const MyButton = React.forwardRef<HTMLButtonElement, MyButtonProps>(
  ({ asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp ref={ref} {...props} />;
  },
);
```

## 35. shadcn/ui add 命令清单

```bash
pnpm dlx shadcn@latest add accordion       # Radix Accordion
pnpm dlx shadcn@latest add alert-dialog    # Radix Alert Dialog
pnpm dlx shadcn@latest add avatar          # Radix Avatar
pnpm dlx shadcn@latest add button          # 自己实现 + Radix Slot
pnpm dlx shadcn@latest add card            # 自己实现
pnpm dlx shadcn@latest add checkbox        # Radix Checkbox
pnpm dlx shadcn@latest add command         # cmdk + Radix Dialog
pnpm dlx shadcn@latest add context-menu    # Radix Context Menu
pnpm dlx shadcn@latest add dialog          # Radix Dialog
pnpm dlx shadcn@latest add dropdown-menu   # Radix Dropdown Menu
pnpm dlx shadcn@latest add hover-card      # Radix Hover Card
pnpm dlx shadcn@latest add input           # 自己实现
pnpm dlx shadcn@latest add label           # Radix Label
pnpm dlx shadcn@latest add menubar         # Radix Menubar
pnpm dlx shadcn@latest add navigation-menu # Radix Navigation Menu
pnpm dlx shadcn@latest add popover         # Radix Popover
pnpm dlx shadcn@latest add progress        # Radix Progress
pnpm dlx shadcn@latest add radio-group     # Radix Radio Group
pnpm dlx shadcn@latest add scroll-area     # Radix Scroll Area
pnpm dlx shadcn@latest add select          # Radix Select
pnpm dlx shadcn@latest add separator       # Radix Separator
pnpm dlx shadcn@latest add slider          # Radix Slider
pnpm dlx shadcn@latest add switch          # Radix Switch
pnpm dlx shadcn@latest add tabs            # Radix Tabs
pnpm dlx shadcn@latest add toggle          # Radix Toggle
pnpm dlx shadcn@latest add tooltip         # Radix Tooltip
```

## 36. 文档地址

- [Radix UI 官网](https://www.radix-ui.com/)
- [Radix Primitives 主页](https://www.radix-ui.com/primitives)
- [Radix Themes 主页](https://www.radix-ui.com/themes)
- [Radix Colors](https://www.radix-ui.com/colors)
- [Radix Icons](https://www.radix-ui.com/icons)
- [shadcn/ui](https://ui.shadcn.com/)
- [GitHub - radix-ui/primitives](https://github.com/radix-ui/primitives)
- [GitHub - radix-ui/themes](https://github.com/radix-ui/themes)
- [GitHub - shadcn-ui/ui](https://github.com/shadcn-ui/ui)
