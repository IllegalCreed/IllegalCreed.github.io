---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 PrimeVue 4.x（v4.5+）。本页是**速查工具**——包含 90+ 组件 10 大类列表、常用 props 表、Plugin 配置选项、`@primeuix/themes` API、`definePreset` / `useToast` / `useConfirm` / `useDialog` 签名、PrimeIcons 常量、Forms / PassThrough 速查、TypeScript 类型、`tailwindcss-primeui` 工具类。

## 速查

- **组件命名**：所有 PrimeVue 组件 PascalCase 单词（`<Button>` / `<InputText>` / `<DataTable>`）—— **不用 P 前缀**（与 PrimeReact 不同）
- **Composable**：`useToast` / `useConfirm` / `useDialog` / `usePrimeVue` —— 各自需要对应 Service Plugin 和占位容器
- **核心 TS 类型**：`MenuItem` / `DataTableProps` / `FormSubmitEvent` / `ToastMessageOptions` / `ConfirmationOptions` / `DialogProps`
- **主题预设**：`Aura`（默认） / `Material` / `Lara` / `Nora` —— 从 `@primeuix/themes/xxx` 导入
- **必装包**：`primevue` + `@primeuix/themes` + `primeicons`
- **按需引入**：`unplugin-vue-components` + `@primevue/auto-import-resolver` 的 `PrimeVueResolver()`
- **Nuxt 模块**：`@primevue/nuxt-module`（官方维护）
- **Tailwind 集成**：`tailwindcss-primeui` 插件
- **Forms 库**：`@primevue/forms` + `zodResolver` / `yupResolver` / `valibotResolver` / `joiResolver` / `superstructResolver`
- **PassThrough**：`<Component :pt="{ section: { class, style, onClick } }" />`

## 90+ 组件分类速查

### Form（表单输入，30+）

| 组件 | 标签 | 常用 props |
|---|---|---|
| InputText | InputText | `v-model` / `type` / `placeholder` / `disabled` / `size`（small/large） / `variant`（filled/outlined） / `fluid` / `invalid` |
| InputNumber | InputNumber | `v-model` / `min` / `max` / `step` / `mode`（decimal/currency） / `currency` / `locale` / `min-fraction-digits` / `max-fraction-digits` / `show-buttons` |
| InputMask | InputMask | `v-model` / `mask`（如 `(999) 999-9999`） / `placeholder` / `slot-char` |
| InputOtp | InputOtp | `v-model` / `length` / `mask` / `integer-only` |
| Password | Password | `v-model` / `feedback` / `toggle-mask` / `prompt-label` / `weak-label` / `medium-label` / `strong-label` |
| Textarea | Textarea | `v-model` / `rows` / `cols` / `auto-resize` |
| Select | Select | `v-model` / `options` / `option-label` / `option-value` / `option-disabled` / `option-group-label` / `option-group-children` / `filter` / `editable` / `checkmark` / `show-clear` / `virtual-scroller-options` |
| MultiSelect | MultiSelect | `v-model` / `options` / `option-label` / `option-value` / `filter` / `display`（comma/chip） / `show-toggle-all` |
| AutoComplete | AutoComplete | `v-model` / `suggestions` / `field` / `option-label` / `multiple` / `dropdown` / `complete-on-focus` / `loading` / `delay` |
| CascadeSelect | CascadeSelect | `v-model` / `options` / `option-label` / `option-value` / `option-group-label` / `option-group-children` |
| TreeSelect | TreeSelect | `v-model` / `options` / `selection-mode`（single/multiple/checkbox） |
| Listbox | Listbox | `v-model` / `options` / `option-label` / `option-value` / `multiple` / `filter` |
| SelectButton | SelectButton | `v-model` / `options` / `option-label` / `multiple` |
| ToggleButton | ToggleButton | `v-model` / `on-label` / `off-label` / `on-icon` / `off-icon` |
| Checkbox | Checkbox | `v-model` / `value` / `binary` / `name` / `indeterminate` |
| RadioButton | RadioButton | `v-model` / `value` / `name` |
| ToggleSwitch | ToggleSwitch | `v-model` / `true-value` / `false-value` |
| Slider | Slider | `v-model` / `min` / `max` / `step` / `range` / `orientation`（horizontal/vertical） |
| Rating | Rating | `v-model` / `stars` / `cancel` / `readonly` |
| DatePicker | DatePicker | `v-model` / `selection-mode`（single/range/multiple） / `show-time` / `show-seconds` / `hour-format` / `date-format` / `min-date` / `max-date` / `inline` / `show-button-bar` / `view`（date/month/year） / `number-of-months` |
| Knob | Knob | `v-model` / `min` / `max` / `step` / `size` / `stroke-width` / `value-color` |
| ColorPicker | ColorPicker | `v-model` / `format`（hex/rgb/hsb） / `inline` |
| FloatLabel | FloatLabel | `variant`（in/out） |
| IftaLabel | IftaLabel | （无 props，纯包装） |
| IconField | IconField | `icon-position`（left/right） |
| Editor | Editor | `v-model` / `readonly` / `editor-style` / `formats`（数组） |

### Button（按钮，5）

| 组件 | 标签 | 常用 props |
|---|---|---|
| Button | Button | `label` / `icon` / `icon-pos`（left/right/top/bottom） / `severity`（primary/secondary/success/info/warn/danger/contrast） / `size`（small/large） / `rounded` / `outlined` / `text` / `raised` / `link` / `loading` / `disabled` / `fluid` / `badge` |
| ButtonGroup | ButtonGroup | （无 props，纯容器） |
| SpeedDial | SpeedDial | `model`（MenuItem 数组） / `type`（linear/circle/semi-circle/quarter-circle） / `direction` / `radius` |
| SplitButton | SplitButton | `label` / `icon` / `model`（下拉项） / `severity` |

### Data（数据展示，15+）

| 组件 | 标签 | 常用 props |
|---|---|---|
| DataTable | DataTable | `value` / `paginator` / `rows` / `rows-per-page-options` / `total-records` / `lazy` / `loading` / `selection-mode`（single/multiple/checkbox） / `data-key` / `sort-mode`（single/multiple） / `filters` / `filter-display`（menu/row） / `expanded-rows` / `edit-mode`（cell/row） / `virtual-scroller-options` / `scroll-height` / `scrollable` |
| Column | Column | `field` / `header` / `body`（slot 别名） / `sortable` / `frozen` / `align-frozen`（left/right） / `selection-mode`（multiple） / `expander` / `row-editor` / `filter` / `filter-match-mode-options` / `style` |
| ColumnGroup | ColumnGroup | `type`（header/footer） |
| Row | Row | （ColumnGroup 内的子行） |
| DataView | DataView | `value` / `layout`（grid/list） / `paginator` / `rows` / `sort-field` / `sort-order` |
| Tree | Tree | `value` / `selection-mode` / `selection-keys` / `expanded-keys` / `loading` / `loading-mode`（mask/icon） / `filter` / `filter-mode` |
| TreeTable | TreeTable | `value` / `paginator` / `selection-mode` / `expanded-keys` / `loading` |
| Timeline | Timeline | `value` / `align`（left/right/top/bottom/alternate） / `layout`（vertical/horizontal） |
| OrgChart | OrganizationChart | `value` / `selection-keys` / `selection-mode` / `collapsible` |
| Paginator | Paginator | `rows` / `total-records` / `first` / `rows-per-page-options` / `template`（自定义元素顺序） |
| PickList | PickList | `v-model` / `data-key` / `show-source-controls` / `show-target-controls` |
| OrderList | OrderList | `v-model` / `data-key` / `responsive-options` |
| VirtualScroller | VirtualScroller | `items` / `item-size` / `scroll-height` / `lazy` / `delay` / `loading` / `orientation` |

### Panel（容器，10+）

| 组件 | 标签 | 常用 props |
|---|---|---|
| Accordion | Accordion / AccordionPanel / AccordionHeader / AccordionContent | `v-model:value` / `multiple` / `expand-icon` / `collapse-icon` |
| Card | Card | （无 props，用 slot：title / subtitle / header / content / footer） |
| Divider | Divider | `align`（left/right/center） / `layout`（horizontal/vertical） / `type`（solid/dashed/dotted） |
| Fieldset | Fieldset | `legend` / `toggleable` / `collapsed` |
| Panel | Panel | `header` / `toggleable` / `collapsed` |
| ScrollPanel | ScrollPanel | `style` |
| Splitter | Splitter / SplitterPanel | `layout`（horizontal/vertical） / `gutter-size` / `state-key` |
| Stepper | Stepper / Step / StepList / StepPanel | `v-model:value` / `linear` |
| Tabs | Tabs / TabList / Tab / TabPanels / TabPanel | `v-model:value` / `scrollable` |
| Toolbar | Toolbar | （slot：start / center / end） |

### Overlay（弹层，10+）

| 组件 | 标签 | 常用 props |
|---|---|---|
| ConfirmDialog | ConfirmDialog | `group` |
| ConfirmPopup | ConfirmPopup | `group` |
| Dialog | Dialog | `v-model:visible` / `header` / `modal` / `closable` / `dismissable-mask` / `maximizable` / `position`（center/top/bottom/left/right/topleft/topright/bottomleft/bottomright） / `block-scroll` / `draggable` / `style` |
| Drawer | Drawer | `v-model:visible` / `header` / `position`（left/right/top/bottom/full） / `modal` / `dismissable` |
| DynamicDialog | DynamicDialog | （无 props，通过 useDialog 控制） |
| Popover | Popover | `dismissable` / `append-to`（body/self） / `breakpoints` |
| Tooltip | v-tooltip（指令） | `value` / `disabled` / `pt` |

### File（文件，3）

| 组件 | 标签 | 常用 props |
|---|---|---|
| FileUpload | FileUpload | `url` / `mode`（advanced/basic） / `multiple` / `accept` / `max-file-size` / `file-limit` / `with-credentials` / `headers` / `auto` / `choose-label` / `upload-label` / `cancel-label` / `name`（请求字段名） |

### Menu（菜单导航，10+）

| 组件 | 标签 | 常用 props |
|---|---|---|
| Breadcrumb | Breadcrumb | `model`（MenuItem 数组） / `home`（MenuItem） |
| Dock | Dock | `model` / `position`（top/bottom/left/right） |
| Menu | Menu | `model` / `popup` |
| Menubar | Menubar | `model` |
| MegaMenu | MegaMenu | `model` / `orientation`（horizontal/vertical） |
| PanelMenu | PanelMenu | `model` / `multiple` |
| Steps | Steps | `model` / `readonly` |
| TabMenu | TabMenu | `model` / `active-index` |
| TieredMenu | TieredMenu | `model` / `popup` |
| ContextMenu | ContextMenu | `model` / `global` |

### Chart（图表，1）

| 组件 | 标签 | 常用 props |
|---|---|---|
| Chart | Chart | `type`（line/bar/pie/doughnut/polarArea/radar/scatter/bubble） / `data` / `options` / `plugins` |

### Messages（消息反馈，3）

| 组件 / API | 标签 | 常用 props |
|---|---|---|
| Message | Message | `severity`（success/info/warn/error/secondary/contrast） / `closable` / `life` / `icon` / `size` / `variant` |
| Toast | Toast | `position`（top-right/top-left/top-center/bottom-right/bottom-left/bottom-center/center） / `group` / `breakpoints` |

### Media（媒体，5）

| 组件 | 标签 | 常用 props |
|---|---|---|
| Carousel | Carousel | `value` / `num-visible` / `num-scroll` / `responsive-options` / `circular` / `autoplay-interval` / `vertical-view-port-height` |
| Galleria | Galleria | `value` / `responsive-options` / `num-visible` / `circular` / `full-screen` / `show-thumbnails` / `show-indicators` / `change-item-on-indicator-hover` |
| Image | Image | `src` / `alt` / `width` / `height` / `preview` / `image-style` / `image-class` |
| ImageCompare | ImageCompare | `tag` / `aria-label` |

### Misc（杂项，10+）

| 组件 | 标签 | 常用 props |
|---|---|---|
| AnimateOnScroll | v-animateonscroll（指令） | `enter-class` / `leave-class` |
| Avatar | Avatar / AvatarGroup | `label` / `icon` / `image` / `size`（normal/large/xlarge） / `shape`（square/circle） |
| Badge | Badge | `value` / `severity`（primary/secondary/success/info/warn/danger/contrast） / `size`（small/large/xlarge） |
| BlockUI | BlockUI | `blocked` / `full-screen` / `base-z-index` |
| Chip | Chip | `label` / `icon` / `image` / `removable` |
| Inplace | Inplace | `closable` / `disabled` / `active` |
| MeterGroup | MeterGroup | `value`（数组） / `min` / `max` / `orientation`（horizontal/vertical） / `label-position`（end/start） |
| ProgressBar | ProgressBar | `value` / `mode`（determinate/indeterminate） / `show-value` |
| ProgressSpinner | ProgressSpinner | `stroke-width` / `animation-duration` / `fill` |
| ScrollTop | ScrollTop | `target`（window/parent） / `threshold` / `behavior`（smooth/auto） |
| Skeleton | Skeleton | `shape`（rectangle/circle） / `size` / `width` / `height` / `border-radius` / `animation`（wave/none） |
| Tag | Tag | `value` / `severity` / `rounded` / `icon` |
| Terminal | Terminal | `welcome-message` / `prompt` |

## PrimeVue Plugin 配置选项

```ts
import PrimeVue from 'primevue/config'

app.use(PrimeVue, {
  // 主题
  theme: {
    preset: Aura,                              // Aura / Material / Lara / Nora / 自定义
    options: {
      prefix: 'p',                             // CSS 变量前缀
      darkModeSelector: 'system',              // 'system' / '.dark' / false
      cssLayer: false,                         // false / { name, order }
    },
  },

  // 全局 PassThrough
  pt: {
    button: { root: { class: '...' } },
    inputtext: { root: { class: '...' } },
  },

  // PassThrough 选项
  ptOptions: {
    mergeSections: true,
    mergeProps: false,
  },

  // Unstyled 模式（全局禁用所有内置样式）
  unstyled: false,

  // Ripple 效果
  ripple: false,

  // Input 默认样式
  inputStyle: 'outlined',                      // outlined / filled
  inputVariant: 'outlined',                    // outlined / filled

  // Z-Index 默认
  zIndex: {
    modal: 1100,
    overlay: 1000,
    menu: 1000,
    tooltip: 1100,
  },

  // 国际化 locale（完整字段见 PrimeVue.d.ts）
  locale: {
    accept: '确认',
    reject: '取消',
    // ...
  },

  // CSP nonce
  csp: {
    nonce: 'random-nonce-value',
  },
})
```

## `@primeuix/themes` API

### 4 大预设导入

```ts
import Aura from '@primeuix/themes/aura'
import Material from '@primeuix/themes/material'
import Lara from '@primeuix/themes/lara'
import Nora from '@primeuix/themes/nora'
```

### `definePreset` 签名

```ts
import { definePreset } from '@primeuix/themes'

definePreset(basePreset: object, customization: {
  primitive?: {
    [colorName: string]: {                     // 自定义颜色
      50: string, 100: string, ..., 950: string,
    },
  },
  semantic?: {
    primary?: { 50: string, ..., 950: string }
    transitionDuration?: string,
    focusRing?: { width, style, color, offset, shadow },
    disabledOpacity?: string,
    iconSize?: string,
    formField?: { paddingX, paddingY, borderRadius, focusRing, ... },
    list?: { padding, gap, header, option, ... },
    content?: { background, hoverBackground, borderColor, color, ... },
    overlay?: { select, popover, modal },
    colorScheme?: {
      light?: { surface, primary, content, text, ... },
      dark?: { surface, primary, content, text, ... },
    },
  },
  components?: {
    button?: ButtonDesignTokens,
    inputtext?: InputTextDesignTokens,
    datatable?: DataTableDesignTokens,
    // ... 每个组件都有自己的 DesignTokens 接口
  },
}): GlobalThemeOverrides
```

### 运行时主题更新

```ts
import {
  usePreset,                                   // 完全替换 preset
  updatePreset,                                // 部分更新（合并）
  updatePrimaryPalette,                        // 快速改主色
  updateSurfacePalette,                        // 快速改 surface
  $dt,                                         // 程序化访问 token
} from '@primeuix/themes'

usePreset(Material)
updatePreset({ semantic: { primary: { 500: '#3b82f6' } } })
updatePrimaryPalette({ 500: '{indigo.500}' })

const primary = $dt('primary.color').value
```

## `useToast` API

```ts
import { useToast } from 'primevue/usetoast'

const toast = useToast()

toast.add(message: ToastMessageOptions)
toast.remove(message: any)
toast.removeGroup(group: string)
toast.removeAllGroups()
```

### ToastMessageOptions

```ts
interface ToastMessageOptions {
  severity?: 'success' | 'info' | 'warn' | 'error' | 'secondary' | 'contrast'
  summary?: string                             // 标题
  detail?: string                              // 内容
  closable?: boolean                           // 默认 true
  life?: number                                // ms，省略 = 不自动消失
  group?: string                               // 分组（配合多个 Toast 占位）
  styleClass?: string
  contentStyleClass?: string
}
```

### Toast 占位容器 props

```ts
interface ToastProps {
  position?: 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center' | 'center'
  group?: string                               // 与 message.group 匹配
  breakpoints?: { [breakpoint: string]: any }
  baseZIndex?: number
}
```

## `useConfirm` API

```ts
import { useConfirm } from 'primevue/useconfirm'

const confirm = useConfirm()

confirm.require(options: ConfirmationOptions)
confirm.close()
```

### ConfirmationOptions

```ts
interface ConfirmationOptions {
  message?: string                             // 提示文字
  header?: string                              // 标题
  icon?: string                                // PrimeIcons 类名
  target?: HTMLElement | EventTarget           // ConfirmPopup 必填（按钮元素）
  group?: string                               // 多个 ConfirmDialog 占位时区分
  position?: 'left' | 'right' | 'top' | 'bottom' | 'topleft' | 'topright' | 'bottomleft' | 'bottomright'

  acceptLabel?: string
  rejectLabel?: string
  acceptIcon?: string
  rejectIcon?: string
  acceptClass?: string
  rejectClass?: string
  acceptProps?: ButtonProps                    // 完全控制 accept 按钮
  rejectProps?: ButtonProps

  accept?: () => void                          // 点击确认
  reject?: () => void                          // 点击取消
  onShow?: () => void
  onHide?: () => void

  modal?: boolean
  dismissableMask?: boolean
  blockScroll?: boolean
  defaultFocus?: 'accept' | 'reject'
}
```

## `useDialog` API

```ts
import { useDialog } from 'primevue/usedialog'

const dialog = useDialog()

dialog.open(component: Component, options?: DialogOptions): DynamicDialogInstance
```

### DialogOptions

```ts
interface DialogOptions {
  props?: DialogProps                          // Dialog 组件的 props
  templates?: {
    header?: () => VNodeChild
    footer?: () => VNodeChild
  }
  data?: any                                   // 传给子组件 dialogRef.data
  onClose?: (options?: { data?: any }) => void
  emits?: Record<string, (...args: any[]) => any>
}
```

### 子组件中 `dialogRef`

```ts
import { inject } from 'vue'

const dialogRef = inject('dialogRef') as Ref<DynamicDialogInstance>

dialogRef.value.data                           // 父传的 data
dialogRef.value.close(returnData?: any)        // 关闭并回传数据
```

## `usePrimeVue` API

```ts
import { usePrimeVue } from 'primevue/config'

const $primevue = usePrimeVue()

// 访问全局配置（reactive）
$primevue.config.locale                        // Locale 对象
$primevue.config.ripple                        // Ripple 开关
$primevue.config.inputVariant                  // outlined / filled
$primevue.config.unstyled                      // 全局 Unstyled

// 修改即生效
$primevue.config.locale = newLocale
$primevue.config.ripple = true
```

## `@primevue/forms` API

### Form 组件 props

```ts
interface FormProps {
  initialValues?: Record<string, any>
  resolver?: Resolver
  validateOnValueUpdate?: boolean | string[]   // 默认 true（输入即校验）
  validateOnBlur?: boolean | string[]          // 默认 false
  validateOnMount?: boolean | string[]         // 默认 false
  validateOnSubmit?: boolean                   // 默认 true
}
```

### Form events

```ts
interface FormSubmitEvent {
  valid: boolean
  values: Record<string, any>
  errors?: Record<string, Array<{ message: string, type?: string }>>
  states?: Record<string, FieldState>
}

// @submit
const onSubmit = (event: FormSubmitEvent) => { ... }
```

### Resolver 函数

```ts
type Resolver = (params: {
  values: Record<string, any>
  names?: string[]                             // 只校验这些字段
}) => {
  errors: Record<string, Array<{ message: string }>>
  values: Record<string, any>
}
```

### 内置 schema resolvers

```ts
import { zodResolver } from '@primevue/forms/resolvers/zod'
import { yupResolver } from '@primevue/forms/resolvers/yup'
import { valibotResolver } from '@primevue/forms/resolvers/valibot'
import { joiResolver } from '@primevue/forms/resolvers/joi'
import { superstructResolver } from '@primevue/forms/resolvers/superstruct'

// 用法
:resolver="zodResolver(zodSchema)"
:resolver="yupResolver(yupSchema)"
:resolver="valibotResolver(valibotSchema)"
:resolver="joiResolver(joiSchema)"
:resolver="superstructResolver(superstructSchema)"
```

### `$form` slot 数据

```ts
interface FormSlot {
  [fieldName: string]: {
    value: any
    pristine: boolean                          // 未修改
    dirty: boolean                             // 已修改
    touched: boolean                           // 已聚焦过
    valid: boolean
    invalid: boolean
    error?: { message: string }                // 第一个错误
    errors?: Array<{ message: string }>        // 全部错误
  }
}

// 模板中
<template v-slot="$form">
  <InputText name="username" />
  <Message v-if="$form.username?.invalid">
    {{ $form.username.error?.message }}
  </Message>
</template>
```

### FormField 组件 props

```ts
interface FormFieldProps {
  name: string
  resolver?: Resolver                          // 字段级 resolver（覆盖 Form 的）
  initialValue?: any
  validateOnValueUpdate?: boolean
  validateOnBlur?: boolean
  validateOnMount?: boolean
}
```

## PassThrough 速查

### 常见组件的 PT section

| 组件 | 常用 section |
|---|---|
| Button | `root` / `label` / `icon` / `loadingIcon` / `pcBadge` |
| InputText | `root`（input 元素自己） |
| Select | `root` / `input` / `dropdown` / `panel` / `list` / `option` / `optionGroupLabel` / `filterContainer` / `filterInput` / `clearIcon` |
| MultiSelect | `root` / `labelContainer` / `panel` / `header` / `list` / `option` |
| DataTable | `root` / `header` / `mask` / `loadingIcon` / `paginatorContainer` / `wrapper` / `table` / `thead` / `tbody` / `tfoot` / `headerRow` / `bodyRow` / `column` / `headerCell` / `bodyCell` |
| Dialog | `root` / `mask` / `header` / `title` / `headerActions` / `closeButton` / `content` / `footer` |
| Toast | `root` / `message` / `messageContent` / `messageIcon` / `summary` / `detail` / `closeButton` |
| Menubar | `root` / `start` / `menu` / `submenu` / `menuitem` / `content` / `action` / `icon` / `label` / `submenuIcon` |
| DatePicker | `root` / `input` / `dropdown` / `panel` / `header` / `body` / `table` / `day` / `dayLabel` / `weekHeader` |

完整 PT section 见 [PrimeVue 官网每个组件页面的 PT 章节](https://primevue.org/passthrough/)。

### 全局 vs 单组件 PT

```ts
// 全局（main.ts）
app.use(PrimeVue, {
  pt: {
    button: {
      root: { class: 'global-class' },
    },
  },
})

// 单组件（模板中）
<Button :pt="{ root: { class: 'specific-class' } }" />

// 单组件覆盖全局（必须用 mergeProps）
<Button :pt="{ root: { class: 'override-class' } }" :pt-options="{ mergeProps: true }" />
```

### usePassThrough 工具

```ts
import { usePassThrough } from 'primevue/passthrough'

const myPT = usePassThrough(
  basePT,
  customPT,
  { mergeSections: true, mergeProps: false }
)

app.use(PrimeVue, { pt: myPT })
```

## TypeScript 类型

### 组件 props 类型

```ts
import type { ButtonProps } from 'primevue/button'
import type { InputTextProps } from 'primevue/inputtext'
import type { SelectProps } from 'primevue/select'
import type { DataTableProps, DataTablePageEvent, DataTableSortEvent, DataTableFilterEvent } from 'primevue/datatable'
import type { DialogProps } from 'primevue/dialog'
```

### Menu 类型

```ts
import type { MenuItem } from 'primevue/menuitem'

const items: MenuItem[] = [
  {
    label: '首页',
    icon: 'pi pi-home',
    command: () => { /* ... */ },
    url: '/',                                  // 或外部链接
    target: '_blank',
    disabled: false,
    visible: true,
    badge: 'New',
    badgeClass: 'p-badge-success',
    items: [/* 子项 */],
    separator: false,
  },
]
```

### Toast / Confirmation 类型

```ts
import type { ToastMessageOptions } from 'primevue/toast'
import type { ConfirmationOptions } from 'primevue/confirmationoptions'
```

### Forms 类型

```ts
import type {
  Form,
  FormField,
  FormSubmitEvent,
  FormFieldState,
  Resolver,
} from '@primevue/forms'

import type {
  ZodResolver,
  YupResolver,
  ValibotResolver,
  JoiResolver,
  SuperstructResolver,
} from '@primevue/forms/resolvers'
```

### Theme 类型

```ts
import type { ThemeOptions, Preset } from '@primeuix/themes/types'
```

## PrimeIcons 常量 API

```ts
import { PrimeIcons } from 'primevue/api'

PrimeIcons.PLUS                                // 'pi pi-plus'
PrimeIcons.MINUS                               // 'pi pi-minus'
PrimeIcons.CHECK                               // 'pi pi-check'
PrimeIcons.TIMES                               // 'pi pi-times'
PrimeIcons.PENCIL                              // 'pi pi-pencil'
PrimeIcons.TRASH                               // 'pi pi-trash'
PrimeIcons.SEARCH                              // 'pi pi-search'
PrimeIcons.HOME                                // 'pi pi-home'
PrimeIcons.USER                                // 'pi pi-user'
PrimeIcons.COG                                 // 'pi pi-cog'
// ... 250+ 常量
```

完整列表见 [PrimeIcons 官网](https://primevue.org/icons/) 的图标速查表。

### FilterMatchMode 常量

```ts
import { FilterMatchMode } from '@primevue/core/api'

FilterMatchMode.STARTS_WITH                    // 开头匹配
FilterMatchMode.CONTAINS                       // 包含
FilterMatchMode.NOT_CONTAINS                   // 不包含
FilterMatchMode.ENDS_WITH                      // 结尾匹配
FilterMatchMode.EQUALS                         // 相等
FilterMatchMode.NOT_EQUALS                     // 不等
FilterMatchMode.IN                             // 包含于
FilterMatchMode.LESS_THAN                      // 小于
FilterMatchMode.LESS_THAN_OR_EQUAL_TO          // 小于等于
FilterMatchMode.GREATER_THAN                   // 大于
FilterMatchMode.GREATER_THAN_OR_EQUAL_TO       // 大于等于
FilterMatchMode.BETWEEN                        // 区间
FilterMatchMode.DATE_IS                        // 日期相等
FilterMatchMode.DATE_IS_NOT                    // 日期不等
FilterMatchMode.DATE_BEFORE                    // 日期早于
FilterMatchMode.DATE_AFTER                     // 日期晚于
```

## Locale 完整字段

```ts
interface PrimeVueLocaleOptions {
  // 文本
  accept?: string
  reject?: string
  choose?: string
  upload?: string
  cancel?: string
  completed?: string
  pending?: string

  // 文件大小
  fileSizeTypes?: string[]                     // ['B', 'KB', 'MB', ...]

  // 星期
  dayNames?: string[]                          // ['星期日', '星期一', ...]
  dayNamesShort?: string[]
  dayNamesMin?: string[]

  // 月份
  monthNames?: string[]
  monthNamesShort?: string[]

  // 日期相关
  chooseYear?: string
  chooseMonth?: string
  chooseDate?: string
  prevDecade?: string
  nextDecade?: string
  prevYear?: string
  nextYear?: string
  prevMonth?: string
  nextMonth?: string
  prevHour?: string
  nextHour?: string
  prevMinute?: string
  nextMinute?: string
  prevSecond?: string
  nextSecond?: string
  am?: string
  pm?: string
  dateFormat?: string                          // 'yy-mm-dd'
  firstDayOfWeek?: number                      // 0 = 周日，1 = 周一
  today?: string
  weekHeader?: string

  // 密码强度
  weak?: string
  medium?: string
  strong?: string
  passwordPrompt?: string

  // 空状态
  emptyMessage?: string
  emptyFilterMessage?: string

  // ARIA（无障碍）
  aria?: {
    trueLabel?: string
    falseLabel?: string
    nullLabel?: string
    star?: string
    stars?: string
    selectAll?: string
    unselectAll?: string
    close?: string
    previous?: string
    next?: string
    navigation?: string
    scrollTop?: string
    moveTop?: string
    moveUp?: string
    moveDown?: string
    moveBottom?: string
    moveToTarget?: string
    moveToSource?: string
    moveAllToTarget?: string
    moveAllToSource?: string
    pageLabel?: string
    firstPageLabel?: string
    lastPageLabel?: string
    nextPageLabel?: string
    prevPageLabel?: string
    rowsPerPageLabel?: string
    jumpToPageDropdownLabel?: string
    jumpToPageInputLabel?: string
    selectRow?: string
    unselectRow?: string
    expandRow?: string
    collapseRow?: string
    showFilterMenu?: string
    hideFilterMenu?: string
    filterOperator?: string
    filterConstraint?: string
    editRow?: string
    saveEdit?: string
    cancelEdit?: string
  }
}
```

## `tailwindcss-primeui` 工具类速查

### 颜色

```
bg-primary / bg-primary-50 / bg-primary-100 / ... / bg-primary-950
text-primary / text-primary-50 / ... / text-primary-950
border-primary / border-primary-50 / ... / border-primary-950
ring-primary / ring-primary-50 / ...

bg-surface / bg-surface-0 / bg-surface-50 / ... / bg-surface-950
text-surface / text-surface-50 / ... / text-surface-950
border-surface / border-surface-50 / ... / border-surface-950

bg-emerald / bg-emerald-50 / ...               # 所有 Tailwind 调色板
bg-rose / bg-orange / bg-blue / bg-cyan / ...
```

### 动画

```
animate-fadein                                 # 淡入
animate-fadeout                                # 淡出
animate-slidedown                              # 滑下
animate-slideup                                # 滑上
animate-scalein                                # 缩放入场
```

### 间距 / 圆角（继承自 Tailwind）

`tailwindcss-primeui` 不修改 Tailwind 默认的 spacing / rounded / shadow 等。

## CLI 与构建

### 安装 PrimeVue CLI（可选）

PrimeVue 没有官方 CLI——通过 npm scripts 或 [primevue-examples](https://github.com/primefaces/primevue-examples) 起步。

### Volt UI CLI（拉取 Unstyled + Tailwind 组件）

```bash
npx volt-vue@latest init                       # 初始化项目
npx volt-vue@latest add button                 # 添加 Button 组件源码到项目
```

### 类型检查

```bash
pnpm exec vue-tsc --noEmit
```

## 升级与迁移

### v3 → v4 主要变化

| 变化 | v3 | v4 |
|---|---|---|
| 主题包 | `primevue/resources/themes/...css` | **`@primeuix/themes`** |
| 组件改名 | `Calendar` / `Dropdown` / `OverlayPanel` / `InputSwitch` / `Sidebar` | **`DatePicker` / `Select` / `Popover` / `ToggleSwitch` / `Drawer`** |
| Tabs 改写 | `<TabView><TabPanel>` | **`<Tabs><TabList><Tab></TabList><TabPanels><TabPanel></TabPanels></Tabs>`** |
| 自定义样式 | CSS overrides | **PassThrough (`pt`) + `definePreset`** |
| Service 注册 | 自动 | **手动 `app.use(ToastService)`** |
| Unstyled mode | 无 | **`unstyled: true` 全局或单组件** |
| Tailwind 集成 | 第三方 | **官方 `tailwindcss-primeui`** |
| Nuxt 模块 | 第三方 | **官方 `@primevue/nuxt-module`** |

### v3 → v4 升级步骤

1. 升级依赖：`pnpm add primevue@latest @primeuix/themes primeicons`
2. 替换主题 import：`primevue/resources/themes/aura-light-blue/theme.css` → `@primeuix/themes/aura`
3. 全局替换组件名：`Calendar` → `DatePicker` / `Dropdown` → `Select` 等
4. 重写 Tabs：旧 `<TabView>` → 新 `<Tabs>` 五个子组件
5. Service 注册：`<Toast>` / `<ConfirmDialog>` 之前加 `app.use(ToastService)` / `app.use(ConfirmationService)`
6. 自定义样式：CSS overrides → `pt` 或 `definePreset`

## 相关链接

- [PrimeVue 官网](https://primevue.org)
- [PrimeVue 组件总览](https://primevue.org/datatable/)（左侧菜单分组）
- [Volt UI](https://volt.primevue.org/)（官方 Unstyled + Tailwind 组件库）
- [PrimeBlocks](https://blocks.primevue.org/)（商业 Block 模板库）
- [GitHub primefaces/primevue](https://github.com/primefaces/primevue)（主仓库 12k+ Star）
- [GitHub primefaces/primeuix](https://github.com/primefaces/primeuix)（v4 主题系统底层 + `@primeuix/themes`）
- [GitHub primefaces/primeicons](https://github.com/primefaces/primeicons)（PrimeIcons 图标包）
- [GitHub primefaces/primevue-examples](https://github.com/primefaces/primevue-examples)（官方示例项目集合）
- [GitHub primefaces/volt](https://github.com/primefaces/volt)（Volt UI Tailwind 重写版）
- [GitHub primefaces/tailwindcss-primeui](https://github.com/primefaces/tailwindcss-primeui)（官方 Tailwind 插件）
- [Discord 社区](https://discord.gg/gzKFYnpmCY)（PrimeTek 官方）
- [Forum](https://forum.primefaces.org/)（论坛，与 PrimeFaces 共享）
- [Showcase](https://primevue.org/configuration/)（每个组件都有 Playground 示例）
