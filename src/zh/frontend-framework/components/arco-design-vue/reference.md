---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 **Arco Design Vue 2.x（v2.58+）**。本页是**速查工具**——包含 60+ 组件列表、常用 props 表、Modal / Message / Notification 静态 API 签名、TypeScript 类型、主题对象结构、13+ 语言包、700+ Arco Icons 分类。

## 速查

- **组件命名**：`<AButton>`（PascalCase） / `<a-button>`（kebab-case）—— 二者等价
- **静态 API**：`Modal` / `Message` / `Notification` 是全局静态方法（**无需 Provider**）
- **核心 TS 类型**：`FormInstance` / `FieldRule` / `TableColumnData` / `TableData` / `MessageReturn` / `NotificationReturn` / `ModalReturn` / `MenuOption`
- **主题模式**：CSS Variables（`--color-primary-6`） / Less 变量（`@arcoblue-6`） / Design Lab（在线 GUI）
- **必装包**：`@arco-design/web-vue`（含 700+ Arco Icons）
- **按需引入**：`unplugin-vue-components` + `ArcoResolver({ sideEffect: true })` / `unplugin-auto-import` + `ArcoResolver({ resolveIcons: true })`
- **CSS 路径**：`@arco-design/web-vue/dist/arco.css`（全量）
- **icon 路径**：`@arco-design/web-vue/es/icon`
- **locale 路径**：`@arco-design/web-vue/es/locale/lang/zh-cn`
- **暗色**：`document.body.setAttribute('arco-theme', 'dark')`

## 60+ 组件分类速查

### General（通用，4）

| 组件 | 标签 | 常用 props |
|---|---|---|
| Button | AButton | `type`（primary / outline / dashed / text / default） / `size`（mini / small / medium / large） / `status`（normal / success / warning / danger） / `shape`（square / round / circle） / `long` / `loading` / `disabled` / `html-type`（button / submit / reset） |
| ButtonGroup | AButtonGroup | `type` / `size` / `status` / `shape` / `direction`（horizontal / vertical） |
| Icon | AIcon + 700+ 子组件 | `size` / `spin` / `rotate` / `color` |
| Typography | ATypography / ATypographyParagraph / ATypographyTitle / ATypographyText | `heading`（1-6） / `bold` / `mark` / `underline` / `delete` / `code` / `type`（primary / secondary / success / warning / danger） |
| Link | ALink | `href` / `status`（normal / success / warning / danger） / `hoverable` / `disabled` |

### Layout（布局，4）

| 组件 | 标签 | 常用 props |
|---|---|---|
| Grid | ARow / ACol | `gutter`（number / array） / `justify` / `align` / `wrap` / `span`（1-24） / `offset` / `push` / `pull` / `flex` / `xs` / `sm` / `md` / `lg` / `xl` / `xxl` |
| Grid（v2.15+） | AGrid / AGridItem | `cols` / `row-gap` / `col-gap` / `collapsed` / `collapsed-rows` |
| Layout | ALayout / ALayoutHeader / ALayoutContent / ALayoutSider / ALayoutFooter | `width` / `collapsed` / `collapsible` / `breakpoint` / `theme`（light / dark） / `hide-trigger` / `reverse-arrow` |
| Space | ASpace | `direction`（vertical / horizontal） / `size`（mini / small / medium / large / number / array） / `align` / `wrap` / `fill` |
| Divider | ADivider | `type`（horizontal / vertical） / `orientation`（left / center / right） / `direction` |

### Navigation（导航，8）

| 组件 | 标签 | 常用 props |
|---|---|---|
| Menu | AMenu / AMenuItem / ASubMenu / AMenuItemGroup | `mode`（horizontal / vertical / pop / popButton） / `theme`（light / dark） / `accordion` / `collapsed` / `collapsed-width` / `breakpoint` / `selected-keys` / `open-keys` |
| Breadcrumb | ABreadcrumb / ABreadcrumbItem | `separator` / `max-count` / `routes` |
| Tabs | ATabs / ATabPane | `active-key` / `type`（line / card / capsule / rounded） / `position`（top / bottom / left / right） / `size` / `editable` / `lazy-load` / `destroy-on-hide` |
| Dropdown | ADropdown / ADropdownButton / ADoption / ADgroup | `trigger`（hover / click / contextMenu / focus） / `position` / `disabled` / `popup-visible` |
| Pagination | APagination | `total` / `current` / `page-size` / `page-size-options` / `show-total` / `show-jumper` / `show-page-size` / `simple` / `size`（mini / small / medium / large） |
| Steps | ASteps / AStep | `current` / `status`（process / finish / error / wait） / `direction`（horizontal / vertical） / `size`（mini / small / default） / `type`（default / arrow / dot / navigation） / `label-placement` |
| Anchor | AAnchor / AAnchorLink | `affix` / `offset-top` / `offset-bottom` / `bound-distance` / `target-offset` / `scroll-container` |
| BackTop | ABackTop | `target-container` / `visible-height` / `easing` / `duration` |

### Data Entry（数据输入，17）

| 组件 | 标签 | 常用 props |
|---|---|---|
| Form | AForm / AFormItem | `model`（必需） / `rules` / `layout`（horizontal / vertical / inline） / `label-col-props` / `wrapper-col-props` / `label-align` / `disabled` / `scroll-to-first-error` |
| FormItem | AFormItem | `field` / `label` / `rules` / `required` / `validate-trigger`（change / input / blur / focus） / `tooltip` / `extra` / `help` / `hide-label` |
| Input | AInput / AInputSearch / AInputPassword / AInputGroup / AInputTag | `model-value` / `placeholder` / `allow-clear` / `disabled` / `error` / `size` / `max-length` / `show-word-limit` / `prefix` / `suffix` |
| InputNumber | AInputNumber | `model-value` / `mode`（embed / button） / `min` / `max` / `step` / `precision` / `formatter` / `parser` / `hide-button` |
| Textarea | ATextarea | `model-value` / `placeholder` / `auto-size`（boolean / `{ minRows, maxRows }`） / `max-length` / `show-word-limit` |
| AutoComplete | AAutoComplete | `model-value` / `data` / `filter-option` / `strict` / `placeholder` / `disabled` / `loading` |
| Select | ASelect / AOption / AOptgroup | `model-value` / `options` / `multiple` / `allow-clear` / `allow-search` / `allow-create` / `max-tag-count` / `disabled` / `loading` |
| TreeSelect | ATreeSelect | `model-value` / `data` / `multiple` / `tree-checkable` / `tree-check-strictly` / `field-names` |
| Cascader | ACascader | `model-value` / `options` / `multiple` / `check-strictly` / `expand-trigger`（click / hover） / `path-mode` |
| Checkbox | ACheckbox / ACheckboxGroup | `model-value` / `value` / `indeterminate` / `disabled` / `default-checked` |
| Radio | ARadio / ARadioGroup | `model-value` / `type`（radio / button） / `direction`（horizontal / vertical） / `options` / `disabled` |
| Switch | ASwitch | `model-value` / `size` / `type`（circle / round / line） / `disabled` / `loading` |
| Slider | ASlider | `model-value` / `min` / `max` / `step` / `range` / `marks` / `direction`（horizontal / vertical） / `show-tooltip` |
| Rate | ARate | `model-value` / `count`（默认 5） / `allow-half` / `allow-clear` / `read-only` / `color` |
| DatePicker | ADatePicker / AMonthPicker / AYearPicker / AQuarterPicker / AWeekPicker / ARangePicker | `model-value` / `value-format`（YYYY-MM-DD / timestamp / Date） / `disabled-date` / `show-time` / `placeholder` |
| TimePicker | ATimePicker | `model-value` / `format` / `disabled-hours` / `disabled-minutes` / `disabled-seconds` / `hide-disabled-options` |
| ColorPicker（v2.40+） | AColorPicker | `model-value` / `format`（hex / rgb / hsl / hsv） / `disabled-alpha` / `history-colors` / `preset-colors` |
| Upload | AUpload | `action` / `data` / `headers` / `accept` / `multiple` / `directory` / `draggable` / `auto-upload` / `limit` / `disabled` / `list-type`（text / picture / picture-card） |
| Transfer | ATransfer | `data` / `model-value` / `default-value` / `show-search` / `disabled` / `simple` / `one-way` |
| Mention | AMention | `model-value` / `data` / `prefix` / `split` / `type`（input / textarea） |
| VerificationCode（v2.40+） | AVerificationCode | `model-value` / `length` / `mode`（normal / separate） / `mask` / `placeholder` |

### Data Display（数据展示，17）

| 组件 | 标签 | 常用 props |
|---|---|---|
| Table | ATable / ATableColumn | `columns`（必需） / `data` / `pagination` / `row-key` / `row-selection` / `expandable` / `children-key` / `virtual-list-props` / `bordered` / `loading` / `scroll` / `summary` |
| Tree | ATree | `data` / `multiple` / `checkable` / `selectable` / `field-names` / `default-expand-all` / `virtual-list-props` / `block-node` / `draggable` |
| List | AList / AListItem | `data` / `data-source` / `grid-props` / `bordered` / `hoverable` / `split` / `size` / `pagination-props` |
| Card | ACard | `title` / `bordered` / `hoverable` / `size` / `loading` / `style` |
| Carousel | ACarousel / ACarouselItem | `default-current` / `auto-play` / `move-speed` / `animation-name`（slide / card / fade） / `trigger`（hover / click） / `direction` / `show-arrow` |
| Collapse | ACollapse / ACollapseItem | `active-key` / `accordion` / `bordered` / `expand-icon-position`（left / right） / `destroy-on-hide` |
| Calendar | ACalendar | `model-value` / `mode`（month / year） / `default-date` / `panel-width` / `panel-height` |
| Avatar | AAvatar / AAvatarGroup | `shape`（circle / square） / `size` / `image-url` / `auto-fix-font-size` / `trigger-type`（mask / button） |
| Badge | ABadge | `count` / `max-count` / `text` / `dot` / `dot-style` / `color` / `offset` |
| Comment | AComment | `author` / `avatar` / `datetime` / `align`（left / right / `{ datetime: 'right' }`） |
| Descriptions | ADescriptions / ADescriptionsItem | `data` / `column` / `title` / `bordered` / `align`（left / center / right） / `layout`（horizontal / inline-horizontal / vertical） / `size`（mini / small / medium / large） |
| Empty | AEmpty | `description` / `image-size` |
| Image | AImage / AImagePreview / AImagePreviewGroup | `src` / `alt` / `width` / `height` / `fit` / `preview` / `preview-props` / `show-loader` |
| Statistic | AStatistic | `title` / `value` / `value-from`（0 / 数字） / `precision` / `prefix` / `suffix` / `start` / `animation` |
| Tag | ATag | `color` / `size`（small / medium / large） / `closable` / `bordered` / `checkable` / `checked` / `loading` / `visible` |
| Timeline | ATimeline / ATimelineItem | `reverse` / `direction`（horizontal / vertical） / `mode`（left / right / alternate / top / bottom） / `pending` |
| Tooltip | ATooltip | `content` / `position` / `popup-visible` / `mini` / `background-color` / `content-class` / `content-style` |
| Popover | APopover | `title` / `content` / `position` / `trigger` / `popup-visible` |
| Popconfirm | APopconfirm | `content` / `position` / `type`（info / success / warning / error） / `ok-text` / `cancel-text` / `ok-button-props` |
| Watermark | AWatermark | `content` / `gap` / `offset` / `image` / `font` / `rotate` / `width` / `height` |

### Feedback（反馈，11）

| 组件 | 标签 / API | 常用 props |
|---|---|---|
| Alert | AAlert | `type`（info / success / warning / error / normal） / `title` / `show-icon` / `closable` / `banner` / `center` |
| Modal | AModal | `visible` / `title` / `width` / `mask-closable` / `closable` / `mask` / `simple` / `fullscreen` / `align-center` / `body-class` / `ok-text` / `cancel-text` / `ok-loading` / `ok-button-props` / `cancel-button-props` / `unmount-on-close` |
| Modal Methods | Modal.confirm / info / success / warning / error / open | `title` / `content` / `okText` / `cancelText` / `onOk` / `onCancel` / `okButtonProps` / `cancelButtonProps` / `maskClosable` / `width` / `simple` / `escToClose` |
| Drawer | ADrawer | `visible` / `title` / `width` / `height` / `placement`（right / left / top / bottom） / `mask-closable` / `mask` / `closable` / `header` / `footer` / `ok-text` / `cancel-text` / `unmount-on-close` |
| Message | Message.success / error / warning / info / loading | `content` / `type` / `duration` / `closable` / `position` / `id` / `onClose` / `icon` / `showIcon` |
| Notification | Notification.info / success / warning / error | `title` / `content` / `position`（topLeft / topRight / bottomLeft / bottomRight） / `duration` / `closable` / `icon` / `style` / `class` / `footer` |
| Spin | ASpin | `loading` / `tip` / `dot` / `size`（number） / `delay` / `block` |
| Progress | AProgress | `type`（line / circle / steps） / `percent`（0-1） / `size` / `width` / `color` / `track-color` / `status`（normal / success / warning / danger） / `show-text` / `format-text` |
| Result | AResult | `status`（info / success / warning / error / 403 / 404 / 500 / null） / `title` / `subtitle` / `extra` |
| Skeleton | ASkeleton / ASkeletonLine / ASkeletonShape | `loading` / `animation` |
| Notice | ANotice | `type`（info / success / warning / error） / `title` / `content` |

### Other（其他，4）

| 组件 | 标签 | 常用 props |
|---|---|---|
| ConfigProvider | AConfigProvider | `locale` / `size` / `prefix-cls` / `global` / `update-at-scroll` |
| Affix | AAffix | `offset-top` / `offset-bottom` / `target` / `target-offset` |
| ResizeObserver | AResizeObserver | （插槽组件，监听内部元素尺寸变化） |
| Trigger | ATrigger | `popup-visible` / `trigger`（click / hover / focus / contextMenu） / `position` / `mouse-enter-delay` / `mouse-leave-delay` |

## ConfigProvider 完整选项

```vue
<template>
  <a-config-provider
    :locale="zhCN"
    :size="size"
    :prefix-cls="prefixCls"
    :global="global"
    :update-at-scroll="updateAtScroll"
  >
    <router-view />
  </a-config-provider>
</template>
```

| Prop | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `locale` | object | - | 语言包（`@arco-design/web-vue/es/locale/lang/*`） |
| `size` | `'mini'` / `'small'` / `'medium'` / `'large'` | `'medium'` | 全局组件尺寸 |
| `prefix-cls` | string | `'arco'` | CSS class 前缀（隔离多个 Arco 实例） |
| `global` | boolean | `false` | 全局生效（不仅子组件） |
| `update-at-scroll` | boolean | `false` | 滚动时更新 Tooltip / Popover 位置 |

## Modal 静态 API 完整签名

```ts
import { Modal } from '@arco-design/web-vue'

// 方法签名
Modal.info(config: ModalConfig): { close: () => void }
Modal.success(config: ModalConfig): { close: () => void }
Modal.warning(config: ModalConfig): { close: () => void }
Modal.error(config: ModalConfig): { close: () => void }
Modal.confirm(config: ModalConfig): { close: () => void }
Modal.open(config: ModalConfig): { close: () => void }
Modal.destroyAll(): void
```

**ModalConfig 选项**：

| 选项 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `title` | string / RenderFunction | - | 标题 |
| `content` | string / RenderFunction | - | 内容（支持 h 函数自定义） |
| `okText` | string | `'确定'` | OK 按钮文字 |
| `cancelText` | string | `'取消'` | Cancel 按钮文字 |
| `okButtonProps` | object | - | OK 按钮 props（status / type 等） |
| `cancelButtonProps` | object | - | Cancel 按钮 props |
| `hideCancel` | boolean | `false` | 隐藏 Cancel 按钮（info / success / warning / error 默认 true） |
| `maskClosable` | boolean | `true` | 点遮罩是否关闭 |
| `escToClose` | boolean | `true` | ESC 是否关闭 |
| `mask` | boolean | `true` | 是否显示遮罩 |
| `simple` | boolean | `false` | 简洁模式 |
| `width` | number / string | `520` | 宽度 |
| `top` | number / string | `100` | 距顶部距离 |
| `alignCenter` | boolean | `false` | 垂直居中 |
| `bodyClass` / `bodyStyle` | string / CSSObject | - | body 样式 |
| `onOk` | `() => Promise / boolean / void` | - | OK 回调（返回 false 阻止关闭） |
| `onCancel` | `() => void` | - | Cancel 回调 |
| `onBeforeOk` | `() => Promise / boolean` | - | Ok 前置钩子 |

## Message 静态 API 完整签名

```ts
import { Message } from '@arco-design/web-vue'

Message.success(config: string | MessageConfig): MessageReturn
Message.error(config: string | MessageConfig): MessageReturn
Message.warning(config: string | MessageConfig): MessageReturn
Message.info(config: string | MessageConfig): MessageReturn
Message.loading(config: string | MessageConfig): MessageReturn
Message.clear(position?: 'top' | 'bottom'): void

interface MessageReturn {
  close: () => void
}
```

**MessageConfig 选项**：

| 选项 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `content` | string / RenderFunction | - | 内容 |
| `duration` | number | `3000` | 持续时间（ms，0 表示不自动关闭） |
| `closable` | boolean | `false` | 是否可关闭 |
| `position` | `'top'` / `'bottom'` | `'top'` | 位置 |
| `id` | string | - | 唯一 id（防重复 + 更新） |
| `icon` | RenderFunction | - | 自定义图标 |
| `showIcon` | boolean | `true` | 是否显示图标 |
| `resetOnHover` | boolean | `false` | 鼠标悬停时重置计时 |
| `onClose` | `() => void` | - | 关闭回调 |

## Notification 静态 API 完整签名

```ts
import { Notification } from '@arco-design/web-vue'

Notification.info(config: string | NotificationConfig): NotificationReturn
Notification.success(config: string | NotificationConfig): NotificationReturn
Notification.warning(config: string | NotificationConfig): NotificationReturn
Notification.error(config: string | NotificationConfig): NotificationReturn
Notification.remove(id: string): void
Notification.clear(position?: NotificationPosition): void

interface NotificationReturn {
  close: () => void
}
```

**NotificationConfig 选项**：

| 选项 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `content` | RenderContent | - | 主要内容（必填） |
| `title` | RenderContent | - | 标题 |
| `position` | `'topLeft'` / `'topRight'` / `'bottomLeft'` / `'bottomRight'` | `'topRight'` | 位置 |
| `duration` | number | `4500` | 持续时间（ms） |
| `closable` | boolean | `false` | 是否可关闭 |
| `showIcon` | boolean | `true` | 是否显示图标 |
| `icon` | RenderFunction | - | 自定义图标 |
| `id` | string | - | 唯一 id |
| `style` / `class` | CSSProperties / string | - | 样式 |
| `footer` | RenderFunction（v2.25+） | - | 自定义底部 |
| `closeIcon` | RenderFunction | - | 关闭图标 |
| `onClose` | `(id) => void` | - | 关闭回调 |

## TypeScript 核心类型

```ts
// 表单
import type { FormInstance, FieldRule } from '@arco-design/web-vue/es/form'

const formRef = ref<FormInstance | null>(null)

const rules: Record<string, FieldRule[]> = {
  username: [
    { required: true, message: 'Username is required' },
    { minLength: 3, maxLength: 20 },
  ],
}

// 表格
import type { TableColumnData, TableData, TableRowSelection } from '@arco-design/web-vue/es/table/interface'

const columns: TableColumnData[] = [
  { title: 'Name', dataIndex: 'name', width: 140 },
]

interface User extends TableData {
  key: string
  name: string
  email: string
}

const data: User[] = [/* ... */]

// 菜单
import type { MenuOption } from '@arco-design/web-vue/es/menu/interface'

const menuOptions: MenuOption[] = [
  { key: '1', label: '菜单 1' },
]
```

### FormInstance 方法签名

```ts
interface FormInstance {
  validate: (cb?: (errors: any) => void) => Promise<any>
  validateField: (field: string | string[], cb?: (errors: any) => void) => Promise<any>
  resetFields: (field?: string | string[]) => void
  clearValidate: (field?: string | string[]) => void
  setFields: (fields: Record<string, { value?: any; status?: 'success' | 'warning' | 'error'; message?: string }>) => void
  scrollToField: (field: string) => void
}
```

### FieldRule 完整字段

```ts
interface FieldRule {
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'email' | 'url' | 'ip'
  required?: boolean
  message?: string
  // 字符串 / 数组
  length?: number
  minLength?: number
  maxLength?: number
  // 字符串
  match?: RegExp
  uppercase?: boolean
  lowercase?: boolean
  // 数字
  min?: number
  max?: number
  equal?: number
  positive?: boolean
  negative?: boolean
  // 布尔
  true?: boolean
  false?: boolean
  // 数组
  includes?: any[]
  deepEqual?: any
  // 对象
  empty?: boolean
  hasKeys?: string[]
  // 自定义
  validator?: (value: any, callback: (error?: string) => void) => void | Promise<void>
}
```

### TableColumnData 完整字段

```ts
interface TableColumnData {
  title?: string | RenderFunction
  dataIndex?: string
  width?: number | string
  align?: 'left' | 'center' | 'right'
  fixed?: 'left' | 'right'
  ellipsis?: boolean
  tooltip?: boolean | TooltipProps
  sortable?: {
    sortDirections?: ('ascend' | 'descend')[]
    sorter?: boolean | ((a: T, b: T) => number)
    sortOrder?: 'ascend' | 'descend' | ''
    defaultSortOrder?: 'ascend' | 'descend' | ''
  }
  filterable?: {
    filters: { text: string; value: string }[]
    filter: (value: any, record: T) => boolean
    multiple?: boolean
    filteredValue?: string[]
    defaultFilteredValue?: string[]
    icon?: RenderFunction
  }
  render?: (data: { record: T; column: TableColumnData; rowIndex: number }) => VNode
  slotName?: string
  cellClass?: string | string[] | ((record: T, columnIndex: number) => string | string[])
  cellStyle?: CSSProperties | ((record: T, columnIndex: number) => CSSProperties)
  children?: TableColumnData[]
}
```

## 主题对象速查

### Less 变量核心列表

```less
// 主色
@arcoblue-1 through @arcoblue-10   // 主色 10 个色阶（默认 #165dff @ -6）

// 状态色
@green-1 through @green-10         // 成功（默认 #00b42a @ -6）
@orange-1 through @orange-10       // 警告（默认 #ff7d00 @ -6）
@red-1 through @red-10             // 危险（默认 #f53f3f @ -6）
@gold-1 through @gold-10           // 金色
@purple-1 through @purple-10       // 紫色

// 中性色
@gray-1 through @gray-10           // 灰色
@black                             // 纯黑
@white                             // 纯白

// 文字
@color-text-1 through @color-text-4

// 背景
@color-bg-1 through @color-bg-5

// 边框
@color-border-1 through @color-border-4

// 填充
@color-fill-1 through @color-fill-4

// 间距 / 圆角
@border-radius-small               // 2px
@border-radius-medium              // 4px
@border-radius-large               // 8px
@border-radius-circle              // 50%

@spacing-1 through @spacing-12     // 间距
```

### CSS Variables 核心列表

```css
:root {
  /* 主色 10 阶 */
  --color-primary-1 through --color-primary-10
  --color-primary-light-1 through --color-primary-light-4

  /* 状态色 */
  --color-success-light-1 through --color-success-light-4
  --color-warning-light-1 through --color-warning-light-4
  --color-danger-light-1 through --color-danger-light-4

  /* 文字 */
  --color-text-1   /* #1d2129 */
  --color-text-2   /* #4e5969 */
  --color-text-3   /* #86909c */
  --color-text-4   /* #c9cdd4 */

  /* 背景 */
  --color-bg-1     /* #ffffff */
  --color-bg-2     /* #ffffff */
  --color-bg-3     /* #ffffff */
  --color-bg-4     /* #ffffff */
  --color-bg-5     /* #ffffff */
  --color-bg-white /* #ffffff */
  --color-bg-popup /* #ffffff */

  /* 边框 */
  --color-border-1 /* #f2f3f5 */
  --color-border-2 /* #e5e6eb */
  --color-border-3 /* #c9cdd4 */
  --color-border-4 /* #86909c */

  /* 填充 */
  --color-fill-1 through --color-fill-4

  /* 中性 */
  --color-neutral-1 through --color-neutral-10
}

/* 暗色覆盖 */
body[arco-theme='dark'] {
  --color-bg-1: #17171a
  --color-text-1: #f7f8fa
  /* ... 全部反转 */
}
```

> **完整 token 列表**：[arco-design-vue/tokens.less](https://github.com/arco-design/arco-design-vue/blob/main/packages/web-vue/components/style/themes/default/tokens.less)（数百个 Less 变量）+ [arco-design-vue/css-variables](https://github.com/arco-design/arco-design-vue/blob/main/packages/web-vue/components/style/index.less)（对应 CSS Variables）。

## 13 种语言包

| 语言 | locale Key | 引入路径 |
|---|---|---|
| 简体中文 | `zh-CN` | `@arco-design/web-vue/es/locale/lang/zh-cn` |
| 英文 | `en-US` | `@arco-design/web-vue/es/locale/lang/en-us` |
| 日文 | `ja-JP` | `@arco-design/web-vue/es/locale/lang/ja-jp` |
| 韩文 | `ko-KR` | `@arco-design/web-vue/es/locale/lang/ko-kr` |
| 西班牙文 | `es-ES` | `@arco-design/web-vue/es/locale/lang/es-es` |
| 法文 | `fr-FR` | `@arco-design/web-vue/es/locale/lang/fr-fr` |
| 德文 | `de-DE` | `@arco-design/web-vue/es/locale/lang/de-de` |
| 意大利文 | `it-IT` | `@arco-design/web-vue/es/locale/lang/it-it` |
| 印尼文 | `id-ID` | `@arco-design/web-vue/es/locale/lang/id-id` |
| 葡萄牙文 | `pt-PT` | `@arco-design/web-vue/es/locale/lang/pt-pt` |
| 泰文 | `th-TH` | `@arco-design/web-vue/es/locale/lang/th-th` |
| 越南文 | `vi-VN` | `@arco-design/web-vue/es/locale/lang/vi-vn` |
| 荷兰文 | `nl-NL` | `@arco-design/web-vue/es/locale/lang/nl-nl` |

## 700+ Arco Icons 分类

完整图标列表见 [arco.design/vue/component/icon](https://arco.design/vue/component/icon)。常用图标速查：

### 方向 / 箭头

`IconUp` / `IconDown` / `IconLeft` / `IconRight` / `IconArrowUp` / `IconArrowDown` / `IconArrowLeft` / `IconArrowRight` / `IconDoubleLeft` / `IconDoubleRight` / `IconCaretUp` / `IconCaretDown` / `IconCaretLeft` / `IconCaretRight`

### 操作

`IconPlus` / `IconMinus` / `IconClose` / `IconCheck` / `IconEdit` / `IconDelete` / `IconSave` / `IconCopy` / `IconExport` / `IconImport` / `IconRefresh` / `IconSync` / `IconUpload` / `IconDownload` / `IconSwap`

### 文件

`IconFile` / `IconFolder` / `IconFolderAdd` / `IconFolderDelete` / `IconAttachment` / `IconImage` / `IconImageClose` / `IconVideoCamera` / `IconStorage` / `IconArchive`

### 用户 / 权限

`IconUser` / `IconUserAdd` / `IconUserGroup` / `IconRobot` / `IconLock` / `IconUnlock` / `IconShield` / `IconShieldCheck` / `IconIdcard` / `IconLockHidden`

### 导航 / 菜单

`IconHome` / `IconMenu` / `IconMenuFold` / `IconMenuUnfold` / `IconList` / `IconApps` / `IconDashboard` / `IconNav`

### 状态反馈

`IconCheckCircleFill` / `IconCloseCircleFill` / `IconExclamationCircleFill` / `IconInfoCircleFill` / `IconQuestionCircleFill` / `IconMinusCircleFill` / `IconStop` / `IconBug` / `IconLoading`

### 装饰

`IconStar` / `IconStarFill` / `IconHeart` / `IconHeartFill` / `IconLike` / `IconLikeFill` / `IconBookmark` / `IconShareAlt` / `IconShareInternal` / `IconScissor` / `IconBranch` / `IconCommand` / `IconGift`

### 设置

`IconSettings` / `IconTool` / `IconControl` / `IconCalendar` / `IconClockCircle` / `IconHistory` / `IconCalendarClock` / `IconNotification` / `IconNotificationClose` / `IconMessage` / `IconEmail`

### 图表 / 数据

`IconBarChart` / `IconLineChart` / `IconPieChart` / `IconStorage` / `IconLayout` / `IconTriangleUp` / `IconTriangleDown` / `IconCompass`

### 媒体 / 形状

`IconPlayCircle` / `IconPauseCircle` / `IconRecord` / `IconBgColors` / `IconHighlight` / `IconLink` / `IconUnorderedList` / `IconOrderedList`

### 按需引入 icon

按 `ArcoResolver({ resolveIcons: true })` 配置后——模板写 `<icon-plus />` 插件自动 import：

```ts
// 构建时插件自动生成：
import { IconPlus } from '@arco-design/web-vue/es/icon'
```

或手动 import：

```ts
import {
  IconPlus,
  IconDelete,
  IconEdit,
  IconSettings,
  IconUser,
} from '@arco-design/web-vue/es/icon'
```

## 常用 npm 包速查

| 包名 | 用途 | 版本 |
|---|---|---|
| `@arco-design/web-vue` | 主组件库（含 700+ Arco Icons） | 2.58+ |
| `unplugin-vue-components` | 按需引入组件（生产推荐） | ^0.27 |
| `unplugin-auto-import` | 按需引入 API + 图标 | ^0.18 |
| `less` | Less 主题深度定制 | ^4.x |
| `@arco-themes/web-mytheme` | Design Lab 生成的主题包 | 视主题而定 |
| `@arco-design/color` | Arco 调色板工具（10 色阶生成） | ^0.4 |

## 相关链接

- **官网**：[arco.design/vue](https://arco.design/vue)
- **GitHub**：[arco-design/arco-design-vue](https://github.com/arco-design/arco-design-vue)
- **Pro 模板**：[arco-design/arco-design-pro-vue](https://github.com/arco-design/arco-design-pro-vue)
- **Design Lab**：[arco.design/themes](https://arco.design/themes)
- **React 版**：[arco-design/arco-design](https://github.com/arco-design/arco-design)
- **更新日志**：[arco.design/vue/docs/changelog](https://arco.design/vue/docs/changelog)
- **Issue 反馈**：[github.com/arco-design/arco-design-vue/issues](https://github.com/arco-design/arco-design-vue/issues)
