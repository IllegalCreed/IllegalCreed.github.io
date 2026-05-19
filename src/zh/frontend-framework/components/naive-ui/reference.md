---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Naive UI 2.x（v2.44+）。本页是**速查工具**——包含 90+ 组件列表、常用 props 表、Composable 签名、TypeScript 类型、主题对象结构、30+ 语言包、xicons 图标包对照。

## 速查

- **组件命名**：`<NButton>`（PascalCase） / `<n-button>`（kebab-case）—— 二者等价
- **Composable**：`useMessage` / `useDialog` / `useNotification` / `useLoadingBar` / `useOsTheme` / `useThemeVars`
- **脱离 Provider**：`createDiscreteApi(['message', 'dialog', 'notification', 'loadingBar'])`
- **核心 TS 类型**：`FormInst` / `FormRules` / `DataTableInst` / `DataTableColumns` / `GlobalTheme` / `GlobalThemeOverrides` / `MessageReactive` / `MenuOption`
- **主题对象**：`lightTheme`（默认） / `darkTheme`（暗色） / `themeOverrides`（自定义）
- **必装包**：`naive-ui` + `vfonts`（字体，可选）+ `@vicons/ionicons5`（图标，可选）
- **按需引入**：`unplugin-vue-components` + `NaiveUiResolver` / `unplugin-auto-import` + `'naive-ui': ['useDialog', ...]`
- **Nuxt 模块**：`nuxtjs-naive-ui`（社区维护，官方文档推荐）
- **SSR CSS 收集**：`@css-render/vue3-ssr` 的 `setup(app) → { collect }`
- **语言包**：`zhCN` / `enUS` / `jaJP` / `koKR` / `frFR` / `deDE` / `arDZ` 等 30+ 种 + 对应 `dateXxx`

## 90+ 组件分类速查

### Common（通用，10）

| 组件 | 标签 | 常用 props |
|---|---|---|
| Button | NButton | `type`（default/tertiary/primary/info/success/warning/error） / `size` / `ghost` / `dashed` / `round` / `circle` / `text` / `loading` / `disabled` / `block` / `secondary` / `quaternary` |
| ButtonGroup | NButtonGroup | `size` / `vertical` |
| Icon | NIcon | `size` / `color` / `depth`（1-5 灰度层级） / `component` |
| IconWrapper | NIconWrapper | `size` / `border-radius` / `icon-color` / `color` |
| Typography（多组件） | NText / NP / NH1-6 / NA / NUl / NOl / NLi / NBlockquote / NCode / NHr | `depth` / `type` |
| Divider | NDivider | `title-placement` / `dashed` / `vertical` |
| Tag | NTag | `type` / `size` / `round` / `bordered` / `closable` / `checkable` / `checked` |
| Avatar | NAvatar | `size` / `round` / `circle` / `src` / `color` / `text-color` / `fallback-src` / `lazy` / `intersection-observer-options` |
| AvatarGroup | NAvatarGroup | `options` / `max` / `size` / `vertical` |
| Gradient Text | NGradientText | `type` / `gradient` / `size` |

### Layout（布局，5）

| 组件 | 标签 | 常用 props |
|---|---|---|
| Grid | NGrid / NGridItem | `cols` / `x-gap` / `y-gap` / `responsive` / `item-responsive` / `collapsed` |
| Layout | NLayout / NLayoutHeader / NLayoutContent / NLayoutSider / NLayoutFooter | `position`（absolute/static） / `has-sider` / `embedded` |
| LayoutSider | NLayoutSider | `width` / `collapsed-width` / `collapsed` / `collapse-mode` / `bordered` / `inverted` |
| Space | NSpace | `vertical` / `size` / `wrap` / `align` / `justify` |
| Flex | NFlex | `vertical` / `size` / `inline` / `align` / `justify` |
| Element | NEl | `tag` |

### Navigation（导航，8）

| 组件 | 标签 | 常用 props |
|---|---|---|
| Menu | NMenu | `options`（**必需，JS 数组**） / `mode`（horizontal/vertical） / `value` / `expanded-keys` / `collapsed` / `collapsed-width` / `collapsed-icon-size` / `inverted` / `accordion` |
| Breadcrumb | NBreadcrumb / NBreadcrumbItem | `separator` |
| Tabs | NTabs / NTabPane / NTab | `value` / `type`（bar/line/card/segment） / `size` / `placement` / `closable` / `tab-style` / `pane-style` |
| Dropdown | NDropdown | `options` / `trigger` / `placement` / `on-select` |
| Pagination | NPagination | `page` / `page-size` / `item-count` / `page-count` / `page-sizes` / `show-size-picker` / `show-quick-jumper` |
| Steps | NSteps / NStep | `current` / `status`（process/finish/error/wait） / `vertical` / `size` |
| Anchor | NAnchor / NAnchorLink | `affix` / `bound` / `target` / `ignore-gap` |
| BackTop | NBackTop | `target` / `right` / `bottom` / `visibility-height` |

### Feedback（反馈，12）

| 组件 | 标签 / API | 常用 props |
|---|---|---|
| Alert | NAlert | `type` / `title` / `closable` / `show-icon` / `bordered` |
| Modal | NModal | `v-model:show` / `preset` / `title` / `mask-closable` / `close-on-esc` / `display-directive` / `auto-focus` |
| Drawer | NDrawer | `v-model:show` / `width` / `height` / `placement` / `mask-closable` / `auto-focus` |
| DrawerContent | NDrawerContent | `title` / `closable` / `header-style` / `body-style` |
| Dialog | useDialog() | `title` / `content` / `positiveText` / `negativeText` / `onPositiveClick` / `onNegativeClick` / `showIcon` / `iconPlacement` |
| Message | useMessage() | `content` / `type` / `duration` / `closable` / `keepAliveOnHover` / `icon` |
| Notification | useNotification() | `title` / `content` / `meta` / `description` / `avatar` / `closable` / `duration` |
| LoadingBar | useLoadingBar() | `loadingBarStyle` / `containerStyle` |
| Spin | NSpin | `show` / `size` / `description` / `stroke` / `stroke-width` / `rotate` / `delay` |
| Progress | NProgress | `type`（line/circle/multiple-circle/dashboard） / `percentage` / `status` / `color` / `rail-color` / `stroke-width` |
| Result | NResult | `status`（success/error/info/warning/404/403/418/500） / `title` / `description` |
| Skeleton | NSkeleton | `text` / `round` / `circle` / `repeat` / `sharp` / `animated` |
| Empty | NEmpty | `description` / `size` |

### Data Display（数据展示，25）

| 组件 | 标签 | 常用 props |
|---|---|---|
| DataTable | NDataTable | `columns`（必需） / `data` / `pagination` / `bordered` / `striped` / `virtual-scroll` / `max-height` / `flex-height` / `row-key` / `checked-row-keys` / `expanded-row-keys` / `children-key` / `remote` / `loading` / `summary` |
| Table | NTable | `bordered` / `striped` / `single-line` / `single-column` / `size` |
| Tree | NTree | `data` / `key-field` / `label-field` / `children-field` / `default-expand-all` / `checkable` / `selectable` / `multiple` / `cascade` / `virtual-scroll` |
| TreeSelect | NTreeSelect | `options` / `value` / `multiple` / `cascade` / `check-strictly` / `filterable` |
| Cascader | NCascader | `options` / `value` / `multiple` / `cascade` / `check-strictly` / `filterable` / `show-path` |
| List | NList / NListItem | `bordered` / `hoverable` / `show-divider` / `clickable` |
| VirtualList | NVirtualList | `items` / `item-size` / `visible-items-tag` |
| Card | NCard | `title` / `size` / `closable` / `bordered` / `hoverable` / `embedded` / `segmented` |
| Carousel | NCarousel | `autoplay` / `interval` / `loop` / `transition-style` / `effect`（slide/fade/card/custom） / `arrow-show` / `show-dots` |
| Collapse | NCollapse / NCollapseItem | `default-expanded-names` / `accordion` / `arrow-placement` / `display-directive` |
| Calendar | NCalendar | `v-model:value` / `is-date-disabled` |
| Code | NCode | `code` / `language` / `hljs` / `show-line-numbers` / `word-wrap` |
| Descriptions | NDescriptions / NDescriptionsItem | `title` / `column` / `size` / `bordered` / `label-placement` / `label-style` |
| Equation | NEquation | `value` / `katex` |
| Ellipsis | NEllipsis | `line-clamp` / `expand-trigger` / `tooltip` |
| Image | NImage / NImageGroup | `src` / `alt` / `fallback-src` / `width` / `height` / `lazy` / `intersection-observer-options` / `preview-disabled` / `show-toolbar` |
| Marquee | NMarquee | `auto-fill` / `pause-on-hover` / `delay` / `direction` |
| NumberAnimation | NNumberAnimation | `from` / `to` / `duration` / `precision` / `show-separator` |
| Performant Ellipsis | NPerformantEllipsis | 同 NEllipsis，大列表场景 |
| QrCode | NQrCode | `value` / `size` / `padding` / `color` / `background-color` / `error-correction-level` / `icon-src` |
| Scrollbar | NScrollbar | `x-scrollable` / `trigger` / `size` / `content-style` / `content-class` |
| Statistic | NStatistic | `label` / `value` / `precision` / `tabular-nums` |
| Thing | NThing | `title` / `description` / `content` / `header-style` / `content-style` |
| Time | NTime | `time` / `format` / `type`（date/datetime/relative） / `unix` |
| Timeline | NTimeline / NTimelineItem | `horizontal` / `size` / `item-placement` |
| Tooltip | NTooltip | `placement` / `trigger` / `delay` / `show-arrow` / `width` / `raw` |
| Popover | NPopover | `placement` / `trigger` / `show` / `width` / `raw` / `display-directive` |
| Popconfirm | NPopconfirm | `positive-text` / `negative-text` / `show-icon` / `on-positive-click` / `on-negative-click` |
| Popselect | NPopselect | `options` / `value` / `multiple` / `trigger` |
| Tour | NTour | `current` / `steps` / `arrow` / `placement` / `show` |
| Watermark | NWatermark | `content` / `image` / `width` / `height` / `rotate` / `x-offset` / `y-offset` |

### Data Entry（数据输入，25）

| 组件 | 标签 | 常用 props |
|---|---|---|
| Form | NForm | `model` / `rules` / `inline` / `label-placement` / `label-width` / `label-align` / `show-feedback` / `show-label` / `show-require-mark` / `require-mark-placement` / `size` / `disabled` |
| FormItem | NFormItem | `label` / `path`（**字段路径**） / `rule` / `required` / `show-feedback` / `show-label` / `feedback` |
| Input | NInput | `v-model:value` / `type`（text/textarea/password） / `placeholder` / `disabled` / `clearable` / `show-password-on` / `maxlength` / `minlength` / `autosize` / `pair` |
| InputNumber | NInputNumber | `v-model:value` / `min` / `max` / `step` / `precision` / `show-button` / `placeholder` / `parse` / `format` |
| InputOtp | NInputOtp | `v-model:value` / `length` / `pattern` / `mask` |
| AutoComplete | NAutoComplete | `v-model:value` / `options` / `loading` / `placeholder` |
| Mention | NMention | `v-model:value` / `options` / `prefix` / `loading` |
| Select | NSelect | `v-model:value` / `options` / `multiple` / `filterable` / `clearable` / `tag` / `remote` / `loading` / `render-label` / `render-option` / `virtual-scroll` |
| Checkbox | NCheckbox / NCheckboxGroup | `v-model:checked` / `label` / `indeterminate` / `value` |
| Radio | NRadio / NRadioGroup / NRadioButton | `v-model:value` / `value` / `name` / `disabled` |
| Switch | NSwitch | `v-model:value` / `default-value` / `loading` / `disabled` / `round` / `size` / `rail-style` |
| Slider | NSlider | `v-model:value` / `min` / `max` / `step` / `range` / `vertical` / `marks` / `tooltip` |
| Rate | NRate | `v-model:value` / `count` / `size` / `color` / `allow-half` / `clearable` |
| DatePicker | NDatePicker | `v-model:value` / `type`（date/datetime/daterange/datetimerange/month/year/quarter/week） / `format` / `value-format` / `clearable` / `actions` / `default-time` / `shortcuts` |
| TimePicker | NTimePicker | `v-model:value` / `format` / `value-format` / `clearable` / `default-formatted-value` |
| ColorPicker | NColorPicker | `v-model:value` / `modes` / `show-alpha` / `swatches` / `default-show` |
| DynamicInput | NDynamicInput | `v-model:value` / `min` / `max` / `on-create` / `create-button-props` |
| DynamicTags | NDynamicTags | `v-model:value` / `max` / `closable` / `round` / `input-style` |
| Upload | NUpload / NUploadDragger | `action` / `method` / `headers` / `data` / `with-credentials` / `accept` / `multiple` / `default-file-list` / `max` / `show-file-list` / `directory` / `directory-dnd` / `default-upload` / `custom-request` / `on-before-upload` / `on-finish` / `on-error` |
| Transfer | NTransfer | `v-model:value` / `options` / `target-options` / `disabled` / `source-filterable` / `target-filterable` |
| TreeTransfer | NTreeTransfer | `v-model:value` / `options` / `source-filterable` / `target-filterable` |

### Universal Display / Config（5）

| 组件 | 标签 | 用途 |
|---|---|---|
| ConfigProvider | NConfigProvider | **必须**：全局配置入口 |
| MessageProvider | NMessageProvider | useMessage 上下文 |
| DialogProvider | NDialogProvider | useDialog 上下文 |
| NotificationProvider | NNotificationProvider | useNotification 上下文 |
| LoadingBarProvider | NLoadingBarProvider | useLoadingBar 上下文 |

## Composable API（命令式）

### useMessage

**调用方式**：

```ts
import { useMessage } from 'naive-ui'

const message = useMessage()

// 快捷方法
message.success(content, options?)
message.warning(content, options?)
message.error(content, options?)
message.info(content, options?)
message.loading(content, options?)

// 关闭全部
message.destroyAll()
```

**MessageOptions**：

```ts
interface MessageOptions {
  type?: 'info' | 'success' | 'warning' | 'error' | 'loading'
  duration?: number              // ms，默认 3000，0 = 不自动关闭
  closable?: boolean             // 显示关闭按钮
  keepAliveOnHover?: boolean     // 鼠标悬浮保持显示
  icon?: () => VNodeChild        // 自定义 icon
  showIcon?: boolean             // 是否显示 icon
  onAfterLeave?: () => void
  onClose?: () => void
  render?: (props: MessageRenderProps) => VNodeChild
}
```

**返回值**：`MessageReactive`

```ts
interface MessageReactive {
  content?: string | (() => VNodeChild)
  type?: 'info' | 'success' | 'warning' | 'error' | 'loading'
  duration?: number
  closable?: boolean
  destroy: () => void                              // 手动关闭
}
```

### useDialog

**调用方式**：

```ts
import { useDialog } from 'naive-ui'

const dialog = useDialog()

// 类型快捷方法
dialog.success(options)
dialog.warning(options)
dialog.error(options)
dialog.info(options)

// 创建（最底层）
dialog.create(options)

// 关闭全部
dialog.destroyAll()
```

**DialogOptions**：

```ts
interface DialogOptions {
  title?: string | (() => VNodeChild)
  content?: string | (() => VNodeChild)
  type?: 'default' | 'info' | 'success' | 'warning' | 'error'
  icon?: () => VNodeChild
  showIcon?: boolean
  iconPlacement?: 'left' | 'top'
  positiveText?: string
  negativeText?: string
  positiveButtonProps?: ButtonProps
  negativeButtonProps?: ButtonProps
  onPositiveClick?: (e: MouseEvent) => Promise<boolean> | boolean | void
  onNegativeClick?: (e: MouseEvent) => Promise<boolean> | boolean | void
  onMaskClick?: () => void
  onClose?: () => boolean | Promise<boolean>      // 返回 false 阻止关闭
  onEsc?: () => void
  closable?: boolean
  closeOnEsc?: boolean
  maskClosable?: boolean
  bordered?: boolean
  draggable?: boolean
  showCloseButton?: boolean
  style?: object | string
  class?: string
  blockScroll?: boolean
  transformOrigin?: 'mouse' | 'center'
  autoFocus?: boolean
  zIndex?: number
}
```

**返回值**：`DialogReactive`（同 MessageReactive，带 `destroy()`）

### useNotification

**调用方式**：

```ts
import { useNotification } from 'naive-ui'

const notification = useNotification()

notification.success(options)
notification.warning(options)
notification.error(options)
notification.info(options)
notification.create(options)
notification.destroyAll()
```

**NotificationOptions**：

```ts
interface NotificationOptions {
  title?: string | (() => VNodeChild)
  content?: string | (() => VNodeChild)
  description?: string | (() => VNodeChild)
  meta?: string | (() => VNodeChild)               // 副文字（时间等）
  avatar?: () => VNodeChild                        // 自定义 avatar
  action?: () => VNodeChild                        // 自定义 action 按钮
  duration?: number                                // 默认 4500，0 = 不自动关闭
  keepAliveOnHover?: boolean
  closable?: boolean
  showIcon?: boolean
  type?: 'default' | 'info' | 'success' | 'warning' | 'error'
  onAfterLeave?: () => void
  onClose?: () => void | Promise<void> | boolean
  onLeave?: () => void
}
```

### useLoadingBar

**调用方式**：

```ts
import { useLoadingBar } from 'naive-ui'

const loadingBar = useLoadingBar()

loadingBar.start()                                 // 开始（顶部进度条出现）
loadingBar.finish()                                // 完成（进度 100% 后消失）
loadingBar.error()                                 // 错误（变红色后消失）
```

**LoadingBarProvider props**：

```ts
interface LoadingBarProviderProps {
  loadingBarStyle?: {
    loading?: string | object
    error?: string | object
  }
  containerStyle?: string | object
  to?: string | HTMLElement | false                // 挂载位置
}
```

### useOsTheme

**调用方式**：

```ts
import { useOsTheme } from 'naive-ui'

const osTheme = useOsTheme()                       // Ref<'light' | 'dark' | null>

// 在 computed 中跟随
const currentTheme = computed(() =>
  osTheme.value === 'dark' ? darkTheme : null
)
```

### useThemeVars

获取当前主题的所有变量（动态使用主题色）：

```ts
import { useThemeVars } from 'naive-ui'

const themeVars = useThemeVars()

// 在 style 中使用
const style = computed(() => ({
  color: themeVars.value.primaryColor,
  backgroundColor: themeVars.value.cardColor,
}))
```

### createDiscreteApi（脱离 Provider）

**调用方式**：

```ts
import { createDiscreteApi } from 'naive-ui'

const { message, dialog, notification, loadingBar } = createDiscreteApi(
  ['message', 'dialog', 'notification', 'loadingBar'],
  {
    configProviderProps?: MaybeRef<ConfigProviderProps>,
    messageProviderProps?: MaybeRef<MessageProviderProps>,
    dialogProviderProps?: MaybeRef<DialogProviderProps>,
    notificationProviderProps?: MaybeRef<NotificationProviderProps>,
    loadingBarProviderProps?: MaybeRef<LoadingBarProviderProps>,
  }
)
```

**返回的 API 用法与 Composable 完全一致**——但可以在 setup 外（路由守卫、Pinia、工具函数）使用。

## TypeScript 类型

### Form 类型

```ts
import type {
  FormInst,
  FormRules,
  FormItemRule,
  FormItemInst,
  FormValidationError,
} from 'naive-ui'

const formRef = ref<FormInst | null>(null)

const rules: FormRules = {
  name: [{ required: true, message: '不能为空', trigger: 'blur' }],
}

// Promise 风格
try {
  await formRef.value?.validate()
} catch (errors: FormValidationError[]) {
  console.log(errors)
}

// callback 风格
formRef.value?.validate((errors) => {
  if (!errors) console.log('OK')
  else console.log('错误：', errors)
})
```

### DataTable 类型

```ts
import type {
  DataTableColumns,
  DataTableInst,
  DataTableBaseColumn,
  DataTableSelectionColumn,
  DataTableExpandColumn,
  DataTableSortState,
  DataTableFilterState,
  DataTableCreateRowKey,
  DataTableRowKey,
} from 'naive-ui'

interface RowData {
  id: number
  name: string
}

const columns: DataTableColumns<RowData> = [
  { type: 'selection' },
  { title: '姓名', key: 'name', render: (row) => row.name },
]

const tableRef = ref<DataTableInst | null>(null)

// 实例方法
tableRef.value?.clearFilters()
tableRef.value?.clearSorter()
tableRef.value?.filter({ ... })
tableRef.value?.sort('name', 'ascend')
tableRef.value?.page(1)
tableRef.value?.downloadCsv({ fileName: 'data' })
tableRef.value?.scrollTo({ top: 0 })
```

### Menu 类型

```ts
import type { MenuOption, MenuInst, MenuDividerOption, MenuGroupOption } from 'naive-ui'

const menuOptions: MenuOption[] = [
  {
    label: '首页',
    key: 'home',
    icon: () => h(NIcon, null, () => h(HomeIcon)),
  },
  {
    label: '产品',
    key: 'products',
    children: [
      { label: '产品 A', key: 'a' },
      { label: '产品 B', key: 'b' },
    ],
  },
  { type: 'divider' } as MenuDividerOption,
  {
    type: 'group',
    label: '设置',
    key: 'settings-group',
    children: [/* ... */],
  } as MenuGroupOption,
]

const menuRef = ref<MenuInst | null>(null)
menuRef.value?.showOption('a')
```

### Message / Dialog / Notification 类型

```ts
import type {
  MessageReactive,
  MessageType,
  MessageProviderInst,
  DialogReactive,
  DialogProviderInst,
  NotificationReactive,
  NotificationProviderInst,
  LoadingBarProviderInst,
} from 'naive-ui'

const message = useMessage()

const m: MessageReactive = message.success('保存成功', { duration: 0 })
m.destroy()                                          // 手动关闭
```

### Theme 类型

```ts
import type {
  GlobalTheme,                                     // 完整 Theme 对象
  GlobalThemeOverrides,                            // 自定义覆盖
  ConfigProviderProps,
  ThemeProps,
} from 'naive-ui'

const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#1890ff',
  },
  Button: {
    textColor: '#000',
  },
}
```

### Locale 类型

```ts
import type { NLocale, NDateLocale, LocaleProps, LocaleTextNumber } from 'naive-ui'

import { zhCN, dateZhCN } from 'naive-ui'

const customLocale: NLocale = {
  ...zhCN,
  name: 'customZh',
  Input: {
    ...zhCN.Input,
    placeholder: '请输入自定义内容',
  },
}
```

## ConfigProvider 完整选项

```ts
interface ConfigProviderProps {
  // 主题
  theme?: GlobalTheme | null                       // null = 亮色（默认） / darkTheme = 暗色
  themeOverrides?: GlobalThemeOverrides            // 自定义覆盖

  // 语言
  locale?: NLocale | null
  dateLocale?: NDateLocale | null

  // 命名空间（CSS class 前缀）
  namespace?: string

  // 全局组件 defaults
  hljs?: Hljs                                      // 代码高亮库（NCode 用）
  katex?: any                                      // KaTeX 库（NEquation 用）
  date?: { utc?: boolean }                         // 全局日期 utc

  // RTL（从右到左）
  rtl?: RtlEnabledState[]

  // 集中处理 props
  cls?: { prefix?: string }
  prefix?: string

  // Form 全局配置
  inputThemeOverrides?: InputThemeOverrides
  // ... 其他组件全局 themeOverrides 类似
}
```

**主题 token 完整结构（GlobalThemeOverrides）**：

```ts
interface GlobalThemeOverrides {
  // 通用 token
  common?: {
    primaryColor?: string
    primaryColorHover?: string
    primaryColorPressed?: string
    primaryColorSuppl?: string

    infoColor?: string
    infoColorHover?: string
    infoColorPressed?: string

    successColor?: string
    successColorHover?: string
    successColorPressed?: string

    warningColor?: string
    warningColorHover?: string
    warningColorPressed?: string

    errorColor?: string
    errorColorHover?: string
    errorColorPressed?: string

    // 文字色（按深度递减）
    textColorBase?: string
    textColor1?: string                            // 一级（最深）
    textColor2?: string
    textColor3?: string
    textColorDisabled?: string
    placeholderColor?: string
    placeholderColorDisabled?: string
    iconColor?: string
    iconColorHover?: string
    iconColorPressed?: string
    iconColorDisabled?: string

    // 背景色
    bodyColor?: string                             // 整体背景
    baseColor?: string                             // 基础（白/黑）
    cardColor?: string                             // 卡片背景
    modalColor?: string                            // 模态框背景
    popoverColor?: string                          // 弹层背景
    tableColor?: string                            // 表格背景
    tagColor?: string                              // 标签背景
    avatarColor?: string                           // 头像背景

    // 边框
    borderColor?: string
    borderRadius?: string
    borderRadiusSmall?: string
    boxShadow1?: string                            // 轻
    boxShadow2?: string                            // 中
    boxShadow3?: string                            // 重

    // 字号
    fontSize?: string
    fontSizeMini?: string
    fontSizeTiny?: string
    fontSizeSmall?: string
    fontSizeMedium?: string
    fontSizeLarge?: string
    fontSizeHuge?: string

    // 行高
    lineHeight?: string

    // 字体族
    fontFamily?: string
    fontFamilyMono?: string
    fontWeight?: string
    fontWeightStrong?: string

    // 高度
    heightTiny?: string
    heightSmall?: string
    heightMedium?: string
    heightLarge?: string
    heightHuge?: string

    // 过渡动画
    cubicBezierEaseInOut?: string
    cubicBezierEaseOut?: string
    cubicBezierEaseIn?: string

    // 滚动条
    scrollbarColor?: string
    scrollbarColorHover?: string
    scrollbarWidth?: string
    scrollbarHeight?: string
    scrollbarBorderRadius?: string
  }

  // 组件级 token（部分示例）
  Button?: ButtonThemeOverrides
  Input?: InputThemeOverrides
  Select?: SelectThemeOverrides
  DataTable?: DataTableThemeOverrides
  Form?: FormThemeOverrides
  Card?: CardThemeOverrides
  Modal?: ModalThemeOverrides
  // ... 90+ 组件每个都有对应的 *ThemeOverrides
}
```

## 主题对象速查

### 内置主题

```ts
import { lightTheme, darkTheme } from 'naive-ui'

// 亮色（默认，:theme="null" 等价）
<n-config-provider :theme="lightTheme">

// 暗色
<n-config-provider :theme="darkTheme">

// 全部组件 Dark 子主题
import {
  buttonDark, inputDark, datePickerDark,
  selectDark, treeDark, // ...
} from 'naive-ui'

// 用 createTheme 组合：
import { createTheme } from 'naive-ui'
const myDarkTheme = createTheme([buttonDark, inputDark, datePickerDark])
```

### 创建自定义主题

```ts
import type { GlobalTheme } from 'naive-ui'

const customTheme: GlobalTheme = {
  // 基于 lightTheme 修改
  ...lightTheme,
  common: {
    ...lightTheme.common,
    primaryColor: '#1890ff',
  },
}
```

## 30+ 语言包列表

```ts
// locale + dateLocale 一一对应
import {
  zhCN, dateZhCN,                                  // 简体中文
  zhTW, dateZhTW,                                  // 繁体中文（台湾）
  enUS, dateEnUS,                                  // 英文（默认）
  jaJP, dateJaJP,                                  // 日文
  koKR, dateKoKR,                                  // 韩文
  frFR, dateFrFR,                                  // 法文
  deDE, dateDeDE,                                  // 德文
  esAR, dateEsAR,                                  // 西班牙文
  ruRU, dateRuRU,                                  // 俄文
  arDZ, dateArDZ,                                  // 阿拉伯文
  ptBR, datePtBR,                                  // 葡萄牙文（巴西）
  itIT, dateItIT,                                  // 意大利文
  thTH, dateThTH,                                  // 泰文
  trTR, dateTrTR,                                  // 土耳其文
  ukUA, dateUkUA,                                  // 乌克兰文
  viVN, dateViVN,                                  // 越南文
  faIR, dateFaIR,                                  // 波斯文
  hrHR, dateHrHR,                                  // 克罗地亚文
  idID, dateIdID,                                  // 印度尼西亚文
  nlNL, dateNlNL,                                  // 荷兰文
  plPL, datePlPL,                                  // 波兰文
  csCZ, dateCsCZ,                                  // 捷克文
  // ...
} from 'naive-ui'
```

完整列表见 [GitHub locales 目录](https://github.com/tusen-ai/naive-ui/tree/main/src/locales)。

## xicons 图标包对照

[xicons](https://github.com/07akioni/xicons) 是 Naive UI 配套图标系列——多种风格、所有都是 Vue 3 组件、Tree Shakable：

| 包名 | 风格 | 图标数 | 推荐场景 |
|---|---|---|---|
| `@vicons/ionicons5` | **Discord 风格**（圆润现代） | ~1300 | **Naive UI 默认推荐** |
| `@vicons/antd` | Ant Design 5.x | ~800 | 与 Antd 设计一致 |
| `@vicons/material` | Material Design | ~2000 | 严格 Material |
| `@vicons/fa` | Font Awesome 6 | ~2000 | 通用经典 |
| `@vicons/fluent` | Microsoft Fluent | ~10000 | 微软风 |
| `@vicons/carbon` | IBM Carbon | ~2000 | 企业稳重 |
| `@vicons/tabler` | Tabler | ~4000 | 简洁线条 |
| `@vicons/ionicons4` | Ionicons 4（旧） | ~700 | 兼容旧版 |

### 使用示例

```ts
import { CloudUploadOutline } from '@vicons/ionicons5'
import { GithubOutlined } from '@vicons/antd'
import { Home24Regular } from '@vicons/fluent'
import { Cube16Filled } from '@vicons/fluent'
```

```vue
<template>
  <n-icon size="24" color="#1890ff">
    <CloudUploadOutline />
  </n-icon>
</template>
```

## 常用组件 props 类型

### NButton

```ts
interface ButtonProps {
  type?: 'default' | 'tertiary' | 'primary' | 'info' | 'success' | 'warning' | 'error'
  size?: 'tiny' | 'small' | 'medium' | 'large'
  color?: string
  ghost?: boolean
  dashed?: boolean
  text?: boolean                                   // 文字按钮（无背景边框）
  secondary?: boolean
  tertiary?: boolean
  quaternary?: boolean                             // 最浅级
  round?: boolean
  circle?: boolean
  block?: boolean                                  // 占满父容器宽度
  loading?: boolean
  disabled?: boolean
  iconPlacement?: 'left' | 'right'
  attrType?: 'button' | 'submit' | 'reset'         // HTML button 的 type
  bordered?: boolean
  strong?: boolean
  focusable?: boolean
  keyboard?: boolean
  renderIcon?: () => VNodeChild
  tag?: string                                     // 渲染为其他 HTML 标签
}
```

### NInput

```ts
interface InputProps {
  type?: 'text' | 'textarea' | 'password'
  value?: string | [string, string]                // 双输入时是数组（pair）
  defaultValue?: string | null
  placeholder?: string | [string, string]
  disabled?: boolean
  readonly?: boolean
  clearable?: boolean
  showCount?: boolean
  maxlength?: number | string
  minlength?: number | string
  showPasswordOn?: 'click' | 'mousedown'           // 密码框
  size?: 'tiny' | 'small' | 'medium' | 'large'
  status?: 'success' | 'warning' | 'error'         // 校验状态
  autosize?: boolean | { minRows?: number, maxRows?: number }
  pair?: boolean                                   // 双输入（如开始/结束时间）
  separator?: string                               // pair 间隔
  inputProps?: HTMLInputElement
  round?: boolean
  loading?: boolean
}
```

### NForm

```ts
interface FormProps {
  model?: Record<string, any>
  rules?: FormRules
  inline?: boolean
  labelPlacement?: 'left' | 'top'
  labelWidth?: number | string | 'auto'
  labelAlign?: 'left' | 'right'
  size?: 'small' | 'medium' | 'large'
  showFeedback?: boolean
  showLabel?: boolean
  showRequireMark?: boolean
  requireMarkPlacement?: 'left' | 'right' | 'right-hanging'
  disabled?: boolean
  validateMessages?: ValidateMessages
}
```

### NFormItem

```ts
interface FormItemProps {
  label?: string
  labelWidth?: number | string | 'auto'
  labelAlign?: 'left' | 'right'
  labelPlacement?: 'left' | 'top'
  labelStyle?: CSSProperties | string
  path?: string                                    // 字段路径（嵌套用 'a.b.c'）
  rule?: FormItemRule | FormItemRule[]             // 单独的 rules（覆盖 form rules 的同名 path）
  required?: boolean
  showFeedback?: boolean
  showLabel?: boolean
  showRequireMark?: boolean
  requireMarkPlacement?: 'left' | 'right' | 'right-hanging'
  feedback?: string                                // 手动设置 feedback 文字
  validationStatus?: 'success' | 'warning' | 'error'
  first?: boolean                                  // 校验只走第一个失败的 rule
}
```

### NSelect

```ts
interface SelectProps {
  value?: SelectValue
  defaultValue?: SelectValue
  options?: Array<SelectOption | SelectGroupOption>
  multiple?: boolean
  filterable?: boolean
  clearable?: boolean
  tag?: boolean                                    // 标签模式（输入即创建）
  remote?: boolean                                 // 远程搜索
  loading?: boolean
  disabled?: boolean
  placeholder?: string
  size?: 'tiny' | 'small' | 'medium' | 'large'
  consistentMenuWidth?: boolean
  virtualScroll?: boolean
  filter?: (pattern: string, option: SelectOption) => boolean
  renderLabel?: (option: SelectOption, selected: boolean) => VNodeChild
  renderOption?: ({ node, option, selected }) => VNodeChild
  renderTag?: ({ option, handleClose }) => VNodeChild
  fallbackOption?: false | ((value: string | number) => SelectOption)
  showCheckmark?: boolean
  showArrow?: boolean
  status?: 'success' | 'warning' | 'error'
  maxTagCount?: number | 'responsive'
}

interface SelectOption {
  label: string | (() => VNodeChild)
  value: string | number
  disabled?: boolean
  type?: 'group'
  children?: SelectOption[]
}
```

### NDataTable

```ts
interface DataTableProps<T = any> {
  columns: DataTableColumns<T>                     // 必需
  data?: T[]
  pagination?: false | PaginationProps
  bordered?: boolean
  bottomBordered?: boolean
  striped?: boolean
  singleLine?: boolean
  singleColumn?: boolean
  size?: 'small' | 'medium' | 'large'
  flexHeight?: boolean
  maxHeight?: number | string
  minHeight?: number | string
  scrollX?: number | string
  loading?: boolean
  virtualScroll?: boolean
  virtualScrollX?: boolean                         // v2.40+
  rowKey?: (row: T) => string | number
  rowClassName?: string | ((row: T, index: number) => string)
  rowProps?: (row: T, index: number) => HTMLAttributes
  expandedRowKeys?: Array<string | number>
  defaultExpandedRowKeys?: Array<string | number>
  defaultExpandAll?: boolean
  childrenKey?: string                             // 默认 'children'
  cascade?: boolean
  allowCheckingNotLoaded?: boolean
  checkedRowKeys?: Array<string | number>
  defaultCheckedRowKeys?: Array<string | number>
  remote?: boolean                                 // 异步分页
  renderCell?: (value, row, col) => VNodeChild
  summary?: (rows: T[]) => SummaryRowData
  spanMethod?: SpanMethod
  indent?: number
  paginateSinglePage?: boolean
  paginationBehaviorOnFilter?: 'first' | 'current'
}
```

## SSR Setup（@css-render/vue3-ssr）

```ts
import { setup } from '@css-render/vue3-ssr'

// 在 SSR 渲染入口设置
const { collect } = setup(app)

// 渲染完成后收集 CSS
const css = collect()

// 注入到 HTML head
const html = renderedHtml.replace('</head>', `${css}</head>`)
```

## 工具方法

```ts
import {
  // 主题工具
  createTheme,
  lightTheme,
  darkTheme,

  // 颜色工具（util 模块导出）
  // ...

  // Composable
  useMessage, useDialog, useNotification, useLoadingBar,
  useOsTheme, useThemeVars,

  // 脱离 Provider API
  createDiscreteApi,

  // Locale
  zhCN, enUS, jaJP, /* ... */
  dateZhCN, dateEnUS, dateJaJP, /* ... */

  // SSR 工具（来自 @css-render/vue3-ssr）
  // ... 见 SSR 章节
} from 'naive-ui'
```

## 相关链接

- [Naive UI 官网](https://www.naiveui.com/zh-CN/)
- [组件总览](https://www.naiveui.com/zh-CN/os-theme/components)
- [Playground](https://www.naiveui.com/zh-CN/os-theme/playground)
- [GitHub tusen-ai/naive-ui](https://github.com/tusen-ai/naive-ui)（主仓库 18.3k Star）
- [xicons 图标系列](https://github.com/07akioni/xicons)（@vicons/ionicons5 / antd / material / fa / fluent / carbon / tabler）
- [css-render](https://github.com/07akioni/css-render)（Naive UI 主题系统底层 CSS-in-JS）
- [nuxtjs-naive-ui](https://github.com/07akioni/nuxtjs-naive-ui)（Nuxt 模块）
- [vfonts](https://github.com/07akioni/vfonts)（推荐字体包，Inter / Fira Code）
- [naive-ui-admin](https://github.com/jekip/naive-ui-admin)（国内最流行的 Naive UI 中后台模板 8k+ Star）
- [pro-naive-ui](https://github.com/zheng-changfu/pro-naive-ui)（中后台二次封装）
- [async-validator](https://github.com/yiminghe/async-validator)（NForm 校验底层）
- [date-fns](https://date-fns.org/)（NDatePicker 时间库）
- [locales 源码](https://github.com/tusen-ai/naive-ui/tree/main/src/locales)（30+ 语言包）
- [SCSS-free 主题哲学](https://www.naiveui.com/zh-CN/os-theme/docs/customize-theme)
