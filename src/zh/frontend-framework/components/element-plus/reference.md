---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Element Plus 2.x。本页是**速查工具**——包含 80+ 组件列表、常用 props 表、命令式 API 签名、TypeScript 类型、CSS 变量、SCSS 变量入口。

## 速查

- **组件命名**：`<el-*>`（默认前缀） / `<Ep*>`（PascalCase 大写） / 自定义命名空间 `<custom-*>`
- **命令式 API**：`ElMessage` / `ElMessageBox` / `ElNotification` / `ElLoading.service`
- **指令**：`v-loading` / `v-infinite-scroll`
- **TS 类型**：`FormInstance` / `FormRules` / `TableInstance` / `MenuInstance` / `ElMessageOptions` / `Action` 等
- **样式入口（SCSS）**：`element-plus/theme-chalk/src/common/var.scss`（亮色变量）/ `element-plus/theme-chalk/src/dark/var.scss`（暗色变量）
- **CSS 变量入口**：`element-plus/dist/index.css`（全量 CSS）/ `element-plus/theme-chalk/dark/css-vars.css`（暗色 CSS 变量）
- **语言包**：`element-plus/es/locale/lang/zh-cn` / `element-plus/es/locale/lang/en` 等 60+ 种
- **图标包**：`@element-plus/icons-vue`（700+ 图标，独立包）
- **Nuxt 模块**：`@element-plus/nuxt`（SSR 零配置）
- **按需引入**：`unplugin-vue-components` + `unplugin-auto-import` + `ElementPlusResolver`

## 80+ 组件分类速查

### Basic（基础，12 个）

| 组件 | 标签 | 常用 props |
|---|---|---|
| Button | `<el-button>` | `type` / `size` / `plain` / `round` / `circle` / `text` / `link` / `loading` / `disabled` / `icon` |
| ButtonGroup | `<el-button-group>` | `size` / `type` / `direction` |
| Container | `<el-container>` | `direction`（vertical / horizontal） |
| Aside | `<el-aside>` | `width`（默认 300px） |
| Header | `<el-header>` | `height`（默认 60px） |
| Main | `<el-main>` | — |
| Footer | `<el-footer>` | `height`（默认 60px） |
| Row | `<el-row>` | `gutter` / `justify` / `align` |
| Col | `<el-col>` | `span` / `offset` / `xs` / `sm` / `md` / `lg` / `xl` |
| Icon | `<el-icon>` | `size` / `color` |
| Link | `<el-link>` | `type` / `underline` / `disabled` / `href` |
| Text | `<el-text>` | `type` / `size` / `truncated` / `tag` |
| Scrollbar | `<el-scrollbar>` | `height` / `max-height` / `native` / `wrap-class` |
| Space | `<el-space>` | `direction` / `size` / `wrap` / `fill` |
| Splitter | `<el-splitter>` | `layout` / `lazy` |

### Configuration（配置，1 个）

| 组件 | 标签 | 用途 |
|---|---|---|
| Config Provider | `<el-config-provider>` | 全局配置（locale / size / namespace / 各组件 defaults） |

### Form（表单，25 个）

| 组件 | 标签 | 常用 props |
|---|---|---|
| Form | `<el-form>` | `model` / `rules` / `label-width` / `label-position` / `inline` / `size` / `scroll-to-error` |
| FormItem | `<el-form-item>` | `label` / `prop` / `rules` / `required` / `error` / `show-message` |
| Input | `<el-input>` | `v-model` / `type` / `placeholder` / `disabled` / `clearable` / `show-password` / `maxlength` / `prefix-icon` / `suffix-icon` |
| InputNumber | `<el-input-number>` | `v-model` / `min` / `max` / `step` / `precision` / `controls-position` |
| InputTag | `<el-input-tag>` | `v-model` / `placeholder` / `max-tags` |
| InputOTP | `<el-input-otp>` | `v-model` / `length` / `mask` / `type` |
| Autocomplete | `<el-autocomplete>` | `v-model` / `fetch-suggestions` / `trigger-on-focus` |
| Select | `<el-select>` | `v-model` / `filterable` / `multiple` / `collapse-tags` / `clearable` / `remote` / `remote-method` |
| SelectV2 | `<el-select-v2>` | `v-model` / `options` / `filterable` / `multiple` |
| Cascader | `<el-cascader>` | `v-model` / `options` / `props` / `filterable` |
| TreeSelect | `<el-tree-select>` | `v-model` / `data` / `multiple` / `check-strictly` |
| Mention | `<el-mention>` | `v-model` / `options` / `prefix` |
| Checkbox | `<el-checkbox>` | `v-model` / `label` / `indeterminate` |
| CheckboxGroup | `<el-checkbox-group>` | `v-model` |
| Radio | `<el-radio>` | `v-model` / `label` / `border` |
| RadioGroup | `<el-radio-group>` | `v-model` / `size` |
| Switch | `<el-switch>` | `v-model` / `active-text` / `inactive-text` / `active-value` |
| Slider | `<el-slider>` | `v-model` / `min` / `max` / `step` / `range` / `marks` |
| Rate | `<el-rate>` | `v-model` / `max` / `colors` / `void-color` / `show-text` |
| DatePicker | `<el-date-picker>` | `v-model` / `type` / `format` / `value-format` / `range-separator` / `shortcuts` |
| TimePicker | `<el-time-picker>` | `v-model` / `format` / `value-format` / `is-range` |
| TimeSelect | `<el-time-select>` | `v-model` / `start` / `end` / `step` |
| ColorPicker | `<el-color-picker>` | `v-model` / `show-alpha` / `color-format` / `predefine` |
| Upload | `<el-upload>` | `action` / `headers` / `data` / `before-upload` / `on-success` / `multiple` / `accept` / `auto-upload` |
| Transfer | `<el-transfer>` | `v-model` / `data` / `filterable` / `titles` |

### Data（数据展示，23 个）

| 组件 | 标签 | 常用 props |
|---|---|---|
| Table | `<el-table>` | `data` / `height` / `max-height` / `stripe` / `border` / `row-key` / `tree-props` / `default-sort` |
| TableColumn | `<el-table-column>` | `prop` / `label` / `width` / `min-width` / `type` / `sortable` / `filters` / `fixed` / `formatter` |
| TableV2 | `<el-table-v2>` | `columns` / `data` / `width` / `height` / `row-height` |
| Pagination | `<el-pagination>` | `v-model:current-page` / `v-model:page-size` / `total` / `page-sizes` / `layout` / `background` |
| Tree | `<el-tree>` | `data` / `props` / `show-checkbox` / `default-expand-all` / `node-key` / `load` |
| TreeV2 | `<el-tree-v2>` | `data` / `props` / `height` / `item-size` |
| Tag | `<el-tag>` | `type` / `size` / `closable` / `effect`（dark/light/plain） |
| Progress | `<el-progress>` | `percentage` / `type` / `stroke-width` / `status` / `color` |
| Badge | `<el-badge>` | `value` / `max` / `is-dot` / `hidden` |
| Avatar | `<el-avatar>` | `size` / `shape` / `src` / `icon` / `fit` |
| Card | `<el-card>` | `header` / `body-style` / `shadow` |
| Empty | `<el-empty>` | `image` / `image-size` / `description` |
| Image | `<el-image>` | `src` / `fit` / `lazy` / `preview-src-list` |
| Skeleton | `<el-skeleton>` | `loading` / `rows` / `animated` / `count` |
| Calendar | `<el-calendar>` | `v-model` / `range` |
| Carousel | `<el-carousel>` | `interval` / `arrow` / `indicator-position` / `type` / `direction` |
| Collapse | `<el-collapse>` | `v-model` / `accordion` |
| CollapseItem | `<el-collapse-item>` | `title` / `name` / `disabled` |
| Descriptions | `<el-descriptions>` | `title` / `column` / `size` / `border` / `direction` |
| Timeline | `<el-timeline>` | — |
| TimelineItem | `<el-timeline-item>` | `timestamp` / `type` / `color` / `size` / `icon` / `hollow` |
| Tour | `<el-tour>` | `v-model` / `current` / `steps` |
| Statistic | `<el-statistic>` | `value` / `precision` / `prefix` / `suffix` / `value-style` |
| Segmented | `<el-segmented>` | `v-model` / `options` / `disabled` |
| Result | `<el-result>` | `icon` / `title` / `sub-title` |
| InfiniteScroll | `v-infinite-scroll`（指令） | `disabled` / `distance` / `delay` / `immediate` |

### Navigation（导航，9 个）

| 组件 | 标签 | 常用 props |
|---|---|---|
| Menu | `<el-menu>` | `mode`（horizontal/vertical）/ `default-active` / `default-openeds` / `unique-opened` / `collapse` / `router` |
| MenuItem | `<el-menu-item>` | `index` / `route` / `disabled` |
| SubMenu | `<el-sub-menu>` | `index` / `popper-class` / `disabled` |
| MenuItemGroup | `<el-menu-item-group>` | `title` |
| Breadcrumb | `<el-breadcrumb>` | `separator` / `separator-icon` |
| BreadcrumbItem | `<el-breadcrumb-item>` | `to` / `replace` |
| Tabs | `<el-tabs>` | `v-model` / `type`（card/border-card）/ `closable` / `addable` / `editable` / `tab-position` |
| TabPane | `<el-tab-pane>` | `label` / `name` / `disabled` / `closable` / `lazy` |
| Dropdown | `<el-dropdown>` | `trigger` / `placement` / `split-button` / `hide-on-click` |
| DropdownMenu | `<el-dropdown-menu>` | — |
| DropdownItem | `<el-dropdown-item>` | `command` / `disabled` / `divided` / `icon` |
| Steps | `<el-steps>` | `active` / `direction` / `process-status` / `finish-status` / `align-center` / `simple` |
| Step | `<el-step>` | `title` / `description` / `icon` / `status` |
| PageHeader | `<el-page-header>` | `icon` / `title` / `content` |
| Affix | `<el-affix>` | `offset` / `position` / `target` / `z-index` |
| Anchor | `<el-anchor>` | `offset` / `bound` / `direction` / `type` |
| AnchorLink | `<el-anchor-link>` | `href` / `title` |
| Backtop | `<el-backtop>` | `target` / `visibility-height` / `right` / `bottom` |

### Feedback（反馈，10 个）

| 组件 | 标签 / API | 常用 props |
|---|---|---|
| Alert | `<el-alert>` | `title` / `type` / `description` / `closable` / `center` / `show-icon` |
| Dialog | `<el-dialog>` | `v-model` / `title` / `width` / `fullscreen` / `top` / `before-close` / `align-center` / `draggable` |
| Drawer | `<el-drawer>` | `v-model` / `title` / `direction` / `size` / `before-close` / `with-header` |
| Loading | `v-loading`（指令） / `ElLoading.service`（API） | `text` / `background` / `spinner` / `svg` |
| Message | `ElMessage()`（API） | `message` / `type` / `duration` / `showClose` / `center` / `grouping` / `plain` |
| MessageBox | `ElMessageBox.alert / confirm / prompt`（API） | `title` / `message` / `type` / `confirmButtonText` / `cancelButtonText` / `beforeClose` |
| Notification | `ElNotification()`（API） | `title` / `message` / `type` / `position` / `duration` / `offset` |
| Popconfirm | `<el-popconfirm>` | `title` / `confirm-button-text` / `cancel-button-text` / `icon` / `width` |
| Popover | `<el-popover>` | `trigger` / `placement` / `width` / `visible` / `content` |
| Tooltip | `<el-tooltip>` | `content` / `placement` / `effect` / `trigger` / `visible` |

### Others（其他，2 个）

| 组件 | 标签 | 常用 props |
|---|---|---|
| Divider | `<el-divider>` | `direction` / `border-style` / `content-position` |
| Watermark | `<el-watermark>` | `content` / `image` / `width` / `height` / `rotate` / `font` |

## 命令式 API

### ElMessage

**调用方式**：

```ts
ElMessage(options | message)
ElMessage.success(message | options)
ElMessage.warning(message | options)
ElMessage.error(message | options)
ElMessage.info(message | options)
ElMessage.primary(message | options)

ElMessage.closeAll()  // 关闭全部
```

**ElMessageOptions**：

```ts
interface MessageOptions {
  message?: string | VNode | (() => VNode)
  type?: 'success' | 'warning' | 'info' | 'error' | 'primary'
  icon?: string | Component
  iconClass?: string
  dangerouslyUseHTMLString?: boolean
  customClass?: string
  duration?: number          // ms，默认 3000，0 = 不自动关闭
  showClose?: boolean        // 默认 false
  center?: boolean
  onClose?: () => void
  offset?: number            // 默认 16
  appendTo?: string | HTMLElement
  grouping?: boolean         // v2.5+，相同消息合并
  repeatNum?: number
  plain?: boolean            // v2.6+，朴素背景
}
```

**返回值**：`MessageHandler { close(): void }`

### ElMessageBox

**调用方式**：

```ts
// alert（仅确认按钮）
ElMessageBox.alert(message, title?, options?): Promise<MessageBoxData>
ElMessageBox.alert(message, options): Promise<MessageBoxData>

// confirm（确认 + 取消）
ElMessageBox.confirm(message, title?, options?): Promise<MessageBoxData>
ElMessageBox.confirm(message, options): Promise<MessageBoxData>

// prompt（输入框）
ElMessageBox.prompt(message, title?, options?): Promise<MessageBoxInputData>
ElMessageBox.prompt(message, options): Promise<MessageBoxInputData>

ElMessageBox.close()  // 关闭当前
```

**MessageBoxOptions**：

```ts
interface ElMessageBoxOptions {
  title?: string
  message?: string | VNode
  dangerouslyUseHTMLString?: boolean
  type?: 'success' | 'warning' | 'info' | 'error'
  icon?: string | Component
  iconClass?: string
  customClass?: string
  customStyle?: CSSProperties
  callback?: (action: Action, instance: MessageBoxState) => void
  beforeClose?: (action: Action, instance: MessageBoxState, done: () => void) => void
  distinguishCancelAndClose?: boolean
  lockScroll?: boolean
  showCancelButton?: boolean
  showConfirmButton?: boolean
  showClose?: boolean
  cancelButtonText?: string
  confirmButtonText?: string
  cancelButtonClass?: string
  confirmButtonClass?: string
  closeOnClickModal?: boolean
  closeOnPressEscape?: boolean
  closeOnHashChange?: boolean
  center?: boolean
  draggable?: boolean
  overflow?: boolean
  roundButton?: boolean
  buttonSize?: 'large' | 'default' | 'small'
  inputPattern?: RegExp
  inputValidator?: (value: string) => boolean | string
  inputErrorMessage?: string
  inputValue?: string
  inputPlaceholder?: string
  inputType?: string
  inputValidator?: ((value: string) => boolean | string)
  zIndex?: number
}
```

**Action 类型**：

```ts
type Action = 'confirm' | 'cancel' | 'close'
```

**返回值**：

```ts
// alert / confirm：
{ action: 'confirm' | 'cancel' | 'close' }

// prompt：
{ value: string, action: 'confirm' | 'cancel' | 'close' }
```

### ElNotification

**调用方式**：

```ts
ElNotification(options)
ElNotification.success(options)
ElNotification.warning(options)
ElNotification.info(options)
ElNotification.error(options)
ElNotification.primary(options)

ElNotification.closeAll()
```

**NotificationOptions**：

```ts
interface NotificationOptions {
  title?: string
  message?: string | VNode | (() => VNode)
  type?: 'primary' | 'success' | 'warning' | 'info' | 'error'
  dangerouslyUseHTMLString?: boolean
  customClass?: string
  duration?: number          // 默认 4500，0 = 不自动关闭
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  showClose?: boolean        // 默认 true
  offset?: number
  icon?: string | Component
  zIndex?: number
  appendTo?: string | HTMLElement
  onClose?: () => void
  onClick?: () => void
}
```

### ElLoading

**调用方式**：

```ts
const loading = ElLoading.service(options)
loading.close()
```

**LoadingOptions**：

```ts
interface LoadingOptions {
  target?: string | HTMLElement       // 默认 document.body
  body?: boolean                      // 默认 false
  fullscreen?: boolean                // 默认 true
  lock?: boolean                      // 默认 false（禁用 body 滚动）
  text?: string | VNode
  spinner?: string | Component
  background?: string                 // 默认 ''
  svg?: string                        // 自定义 SVG
  svgViewBox?: string
  customClass?: string
}
```

**返回值**：`LoadingInstance { close(): void, visible: Ref<boolean> }`

## 指令

### v-loading

```vue
<div v-loading="loading">内容</div>
<div v-loading.fullscreen.lock="loading">全屏 + 锁定</div>

<el-table
  v-loading="loading"
  element-loading-text="加载中..."
  element-loading-spinner="el-icon-loading"
  element-loading-svg-view-box="-10, -10, 50, 50"
  element-loading-background="rgba(0, 0, 0, 0.7)"
>
</el-table>
```

| 修饰符 | 说明 |
|---|---|
| `.fullscreen` | 全屏 |
| `.lock` | 锁定 body 滚动（仅 fullscreen 有效） |
| `.body` | 挂载到 body |

### v-infinite-scroll

```vue
<ul
  v-infinite-scroll="load"
  :infinite-scroll-disabled="disabled"
  :infinite-scroll-distance="50"
  :infinite-scroll-delay="100"
  style="overflow: auto; height: 300px"
>
  <li v-for="item in list" :key="item.id">{{ item.name }}</li>
</ul>
```

| 参数 | 说明 |
|---|---|
| `infinite-scroll-disabled` | 是否禁用 |
| `infinite-scroll-distance` | 触发距离阈值（px） |
| `infinite-scroll-delay` | 延迟（ms） |
| `infinite-scroll-immediate` | 立即执行一次 |

## TypeScript 类型

### Form 类型

```ts
import type {
  FormInstance,
  FormRules,
  FormItemRule,
  FormItemInstance,
  FormValidateCallback,
  FormValidationResult,
} from 'element-plus'

const formRef = ref<FormInstance>()

const rules: FormRules = {
  name: [{ required: true, message: '不能为空', trigger: 'blur' }],
}

// 校验
const validateForm: FormValidateCallback = (valid, fields) => {
  if (valid) console.log('OK')
  else console.log('错误：', fields)
}

formRef.value.validate(validateForm)
// 或 Promise
const result: FormValidationResult = await formRef.value.validate()
```

### Table 类型

```ts
import type { TableInstance, TableColumnInstance } from 'element-plus'

const tableRef = ref<TableInstance>()

tableRef.value?.toggleRowSelection(row)
tableRef.value?.clearSelection()
tableRef.value?.setCurrentRow(row)
```

### Upload 类型

```ts
import type {
  UploadProps,
  UploadInstance,
  UploadFile,
  UploadFiles,
  UploadRawFile,
  UploadUserFile,
} from 'element-plus'

const uploadRef = ref<UploadInstance>()

const beforeUpload: UploadProps['beforeUpload'] = (rawFile) => {
  if (rawFile.size > 2 * 1024 * 1024) {
    ElMessage.error('文件不能大于 2MB')
    return false
  }
  return true
}
```

### Menu 类型

```ts
import type { MenuInstance, MenuItemRegistered } from 'element-plus'

const menuRef = ref<MenuInstance>()

menuRef.value?.open('1')
menuRef.value?.close('1')
```

### ConfigProvider 类型

```ts
import type {
  ConfigProviderProps,
  Language,
} from 'element-plus'

const locale: Language = zhCn
```

### Message / MessageBox 类型

```ts
import type {
  MessageHandler,
  MessageOptions,
  MessageParams,
  ElMessageBoxOptions,
  Action,
  MessageBoxData,
} from 'element-plus'

const action: Action = 'confirm'  // 'confirm' | 'cancel' | 'close'
```

## ElConfigProvider 完整选项

```ts
interface ConfigProviderProps {
  locale?: Language                                  // 语言包
  size?: 'large' | 'default' | 'small'              // 全局尺寸
  zIndex?: number                                    // 默认 2000
  namespace?: string                                 // 默认 'el'
  button?: ButtonConfigContext                       // Button defaults
  link?: LinkConfigContext                           // Link defaults
  message?: MessageConfigContext                     // Message defaults
  dialog?: DialogConfigContext                       // Dialog defaults
  table?: TableConfigContext                         // Table defaults
  emptyValues?: any[]                                // 视为空的值
  valueOnClear?: any | (() => any)                   // clearable 清空后的值
  experimentalFeatures?: ExperimentalFeatures
}

// Button defaults
interface ButtonConfigContext {
  autoInsertSpace?: boolean
  plain?: boolean
  text?: boolean
  round?: boolean
  dashed?: boolean
  type?: ButtonType
}

// Message defaults
interface MessageConfigContext {
  max?: number              // 同时存在最大数量
  duration?: number
  offset?: number
  placement?: 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  showClose?: boolean
  plain?: boolean
  grouping?: boolean
}

// Dialog defaults
interface DialogConfigContext {
  alignCenter?: boolean
  draggable?: boolean
  overflow?: boolean
  transition?: string | object
}

// Table defaults
interface TableConfigContext {
  showOverflowTooltip?: boolean
  tooltipEffect?: 'dark' | 'light'
  tooltipOptions?: object
  tooltipFormatter?: Function
}
```

**Provide 注入 keys**（SSR / Composable 中可读取）：

```ts
import {
  localeContextKey,
  configProviderContextKey,
  namespaceContextKey,
  zIndexContextKey,
  buttonGroupContextKey,
  messageContextKey,
  formContextKey,
  formItemContextKey,
} from 'element-plus'
```

## SSR Inject Keys

```ts
import {
  ID_INJECTION_KEY,
  ZINDEX_INJECTION_KEY,
} from 'element-plus'

app.provide(ID_INJECTION_KEY, {
  prefix: 1024,
  current: 0,
})

app.provide(ZINDEX_INJECTION_KEY, { current: 0 })
```

## CSS 变量速查

### 颜色

```css
/* Brand 色 */
--el-color-primary
--el-color-primary-light-3
--el-color-primary-light-5
--el-color-primary-light-7
--el-color-primary-light-8
--el-color-primary-light-9
--el-color-primary-dark-2

/* 语义色 */
--el-color-success
--el-color-warning
--el-color-danger
--el-color-error
--el-color-info

/* 中性色 */
--el-color-white
--el-color-black
```

### 文字 / 背景 / 边框

```css
/* 文字 */
--el-text-color-primary
--el-text-color-regular
--el-text-color-secondary
--el-text-color-placeholder
--el-text-color-disabled

/* 背景 */
--el-bg-color
--el-bg-color-page
--el-bg-color-overlay

/* 边框 */
--el-border-color
--el-border-color-light
--el-border-color-lighter
--el-border-color-extra-light
--el-border-color-dark
--el-border-color-darker

/* 填充 */
--el-fill-color
--el-fill-color-light
--el-fill-color-lighter
--el-fill-color-extra-light
--el-fill-color-dark
--el-fill-color-darker
--el-fill-color-blank
```

### 尺寸 / 圆角 / 阴影

```css
/* 字号 */
--el-font-size-extra-large
--el-font-size-large
--el-font-size-medium
--el-font-size-base
--el-font-size-small
--el-font-size-extra-small

/* 圆角 */
--el-border-radius-base
--el-border-radius-small
--el-border-radius-round
--el-border-radius-circle

/* 阴影 */
--el-box-shadow
--el-box-shadow-light
--el-box-shadow-lighter
--el-box-shadow-dark

/* z-index */
--el-index-normal
--el-index-top
--el-index-popper
```

### 组件级变量（部分）

```css
/* Button */
--el-button-text-color
--el-button-bg-color
--el-button-border-color
--el-button-hover-text-color
--el-button-hover-bg-color
--el-button-active-bg-color

/* Input */
--el-input-text-color
--el-input-border
--el-input-hover-border-color
--el-input-focus-border-color
--el-input-bg-color
--el-input-placeholder-color
--el-input-height

/* Dialog */
--el-dialog-width
--el-dialog-margin-top
--el-dialog-bg-color
--el-dialog-box-shadow

/* Tag */
--el-tag-bg-color
--el-tag-text-color
--el-tag-border-color
```

> **完整 CSS 变量列表**：见 [GitHub theme-chalk/src/common/var.scss](https://github.com/element-plus/element-plus/blob/dev/packages/theme-chalk/src/common/var.scss)（每个 SCSS 变量都会生成对应的 CSS 变量）。

## SCSS 变量入口

### 亮色（默认）

`element-plus/theme-chalk/src/common/var.scss`：

```scss
@forward 'element-plus/theme-chalk/src/common/var.scss' with (
  $colors: (
    'primary': ('base': #1890ff),
    'success': ('base': #52c41a),
    'warning': ('base': #faad14),
    'danger': ('base': #f5222d),
    'info': ('base': #909399),
  ),
  $bg-color: (
    '': #ffffff,
    'page': #f2f3f5,
    'overlay': #ffffff,
  ),
  $text-color: (
    'primary': #303133,
    'regular': #606266,
    'secondary': #909399,
  ),
  $border-radius: (
    'base': 4px,
    'small': 2px,
    'round': 20px,
    'circle': 100%,
  ),
  $font-size: (
    'extra-large': 20px,
    'large': 18px,
    'medium': 16px,
    'base': 14px,
    'small': 13px,
    'extra-small': 12px,
  ),
  $namespace: 'el'  // 自定义命名空间
);
```

### 暗色

`element-plus/theme-chalk/src/dark/var.scss`：

```scss
@forward 'element-plus/theme-chalk/src/dark/var.scss' with (
  $bg-color: (
    'page': #0a0a0a,
    '': #181818,
    'overlay': #1d1e1f,
  )
);
```

## 语言包列表（常用）

```ts
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import zhTw from 'element-plus/es/locale/lang/zh-tw'
import en from 'element-plus/es/locale/lang/en'
import ja from 'element-plus/es/locale/lang/ja'
import ko from 'element-plus/es/locale/lang/ko'
import fr from 'element-plus/es/locale/lang/fr'
import de from 'element-plus/es/locale/lang/de'
import es from 'element-plus/es/locale/lang/es'
import ru from 'element-plus/es/locale/lang/ru'
import pt from 'element-plus/es/locale/lang/pt'
import it from 'element-plus/es/locale/lang/it'
import ar from 'element-plus/es/locale/lang/ar'
import vi from 'element-plus/es/locale/lang/vi'
import th from 'element-plus/es/locale/lang/th'
```

完整列表见 [GitHub packages/locale/lang](https://github.com/element-plus/element-plus/tree/dev/packages/locale/lang)（60+ 种语言）。

## 图标包（@element-plus/icons-vue）

**常用图标**：

```ts
import {
  // 操作
  Edit, Delete, Plus, Minus, Close, Check, Search, Refresh,

  // 文件
  Document, Folder, FolderOpened, Files, Upload, Download,

  // 用户
  User, UserFilled, Avatar, Lock, Unlock, Key,

  // 导航
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  DArrowLeft, DArrowRight,

  // 状态
  Loading, Warning, SuccessFilled, CircleCheck,
  CircleClose, InfoFilled, WarningFilled,

  // 设备
  Phone, Iphone, Cellphone,

  // 媒体
  VideoPlay, VideoPause, VideoCamera, Microphone,

  // 时间
  Calendar, Clock, AlarmClock, Timer,

  // 主题
  Sunny, Moon, Star,
} from '@element-plus/icons-vue'
```

完整图标 ~700 个、可视化浏览见 [Element Plus Icons](https://element-plus.org/zh-CN/component/icon.html)。

## Resolver 选项（unplugin-vue-components）

```ts
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

ElementPlusResolver({
  importStyle: 'css',         // 'css' / 'sass' / false
  exclude: undefined,         // 排除某些组件的正则
  ssr: false,                 // SSR 模式
  version: '2.0.0',
  noStylesComponents: [],     // 不引入样式的组件
  directives: true,           // 解析指令（v-loading 等）
})
```

## 工具 composable / hook（部分）

Element Plus 内部用了大量 composable——部分**对外导出**可在业务中复用：

```ts
import {
  useNamespace,       // 命名空间工具
  useId,              // 唯一 ID（SSR 安全）
  useZIndex,          // 全局 z-index 管理
  useFormItem,        // FormItem 上下文
  useLocale,          // locale 上下文
  useGlobalConfig,    // 全局配置
  useSize,            // 尺寸推导
  useDisabled,        // disabled 推导
  useFocusController,
  useDelayedToggle,
} from 'element-plus'

// 在自定义组件中沿用 Element Plus 命名空间
const ns = useNamespace('my-component')
// ns.b() → 'el-my-component'
// ns.e('header') → 'el-my-component__header'
// ns.m('large') → 'el-my-component--large'
```

## 常用 props 类型

### 共享类型

```ts
// 尺寸
type ComponentSize = 'large' | 'default' | 'small'

// 主题类型
type ButtonType = 'primary' | 'success' | 'warning' | 'info' | 'danger' | 'text' | 'default'

// 位置
type Placement =
  | 'top' | 'top-start' | 'top-end'
  | 'bottom' | 'bottom-start' | 'bottom-end'
  | 'left' | 'left-start' | 'left-end'
  | 'right' | 'right-start' | 'right-end'

// 方向
type Direction = 'horizontal' | 'vertical'
type DrawerDirection = 'rtl' | 'ltr' | 'ttb' | 'btt'
```

### Button props

```ts
interface ButtonProps {
  size?: ComponentSize
  type?: ButtonType
  plain?: boolean
  text?: boolean
  bg?: boolean
  link?: boolean
  round?: boolean
  circle?: boolean
  dashed?: boolean
  loading?: boolean
  loadingIcon?: string | Component
  disabled?: boolean
  icon?: string | Component
  autofocus?: boolean
  nativeType?: 'button' | 'submit' | 'reset'
  autoInsertSpace?: boolean
  color?: string
  dark?: boolean
  tag?: string | Component
}
```

### Form props

```ts
interface FormProps {
  model?: Record<string, any>
  rules?: FormRules
  inline?: boolean
  labelPosition?: 'left' | 'right' | 'top'
  labelWidth?: string | number
  labelSuffix?: string
  hideRequiredAsterisk?: boolean
  requireAsteriskPosition?: 'left' | 'right'
  showMessage?: boolean
  inlineMessage?: boolean
  statusIcon?: boolean
  validateOnRuleChange?: boolean
  size?: ComponentSize
  disabled?: boolean
  scrollToError?: boolean
  scrollIntoViewOptions?: object | boolean
}
```

### Table props

```ts
interface TableProps {
  data: any[]
  height?: string | number
  maxHeight?: string | number
  stripe?: boolean
  border?: boolean
  size?: ComponentSize
  fit?: boolean
  showHeader?: boolean
  highlightCurrentRow?: boolean
  currentRowKey?: string | number
  rowClassName?: string | ((row: { row: any, rowIndex: number }) => string)
  rowStyle?: object | Function
  cellClassName?: string | Function
  cellStyle?: object | Function
  headerRowClassName?: string | Function
  rowKey?: string | ((row: any) => string)
  emptyText?: string
  defaultExpandAll?: boolean
  expandRowKeys?: any[]
  defaultSort?: { prop: string, order: 'ascending' | 'descending' }
  tooltipEffect?: 'dark' | 'light'
  showSummary?: boolean
  sumText?: string
  summaryMethod?: Function
  spanMethod?: Function
  selectOnIndeterminate?: boolean
  indent?: number
  lazy?: boolean
  load?: Function
  treeProps?: { hasChildren?: string, children?: string }
}
```

## 相关链接

- [Element Plus GitHub](https://github.com/element-plus/element-plus)
- [Element Plus 中文文档](https://element-plus.org/zh-CN/)
- [组件总览](https://element-plus.org/zh-CN/component/overview.html)
- [Playground](https://element-plus.org/zh-CN/playground)
- [@element-plus/icons-vue](https://github.com/element-plus/element-plus-icons)
- [@element-plus/nuxt](https://github.com/element-plus/element-plus-nuxt)
- [element-plus-vite-starter](https://github.com/element-plus/element-plus-vite-starter)（官方 Vite 模板）
- [unplugin-vue-components](https://github.com/unplugin/unplugin-vue-components)
- [unplugin-auto-import](https://github.com/unplugin/unplugin-auto-import)
- [SCSS 变量源码](https://github.com/element-plus/element-plus/blob/dev/packages/theme-chalk/src/common/var.scss)
- [暗色变量源码](https://github.com/element-plus/element-plus/blob/dev/packages/theme-chalk/src/dark/var.scss)
- [60+ 语言包目录](https://github.com/element-plus/element-plus/tree/dev/packages/locale/lang)
- [async-validator 规则](https://github.com/yiminghe/async-validator)（ElForm 校验底层）
