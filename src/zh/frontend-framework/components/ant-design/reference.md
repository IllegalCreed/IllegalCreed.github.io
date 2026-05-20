---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Ant Design 5.x（v5.22+）。本页是**速查工具**——包含 70+ 组件列表、常用 props 表、Hook 签名、TypeScript 类型、Design Token 完整列表、60+ 语言包、@ant-design/icons 对照表、Pro Components API 索引。

## 速查

- **组件命名**：所有组件 PascalCase（`<Button>` / `<Form.Item>` / `<Input.Password>`）
- **v5 推荐 Hook**：`Form.useForm()` / `Form.useWatch()` / `message.useMessage()` / `Modal.useModal()` / `notification.useNotification()` / `App.useApp()` / `theme.useToken()`
- **静态方法（不消费 Context，不推荐）**：`message.success(...)` / `Modal.confirm(...)` / `notification.open(...)`
- **核心 TS 类型**：`FormInstance` / `FormProps` / `TableColumnsType` / `TableProps` / `ThemeConfig` / `GetProps` / `GetProp` / `GetRef`
- **主题**：`<ConfigProvider theme=` + 双花括号包 `token, algorithm, components` 对象
- **algorithm**：`theme.defaultAlgorithm` / `theme.darkAlgorithm` / `theme.compactAlgorithm`（可组合）
- **必装包**：`antd` + `@ant-design/icons`（图标）
- **可选**：`@ant-design/pro-components`（中后台）/ `@ant-design/nextjs-registry`（Next.js）/ `@ant-design/charts`（可视化）
- **v5 默认 Tree Shaking**：无需 `babel-plugin-import`
- **SSR**：`@ant-design/cssinjs` 的 `<StyleProvider cache>` + `extractStyle(cache)`
- **i18n**：`<ConfigProvider locale={zhCN}>` + `dayjs.locale('zh-cn')`
- **语言包**：60+ 种，路径 `antd/locale/zh_CN` / `en_US` / `ja_JP` 等

## 70+ 组件分类速查

### General（通用，4）

| 组件 | 常用 props |
|---|---|
| Button | `type`（default/primary/dashed/link/text） / `size`（small/middle/large） / `shape`（default/circle/round） / `icon` / `iconPlacement`（start/end） / `loading` / `disabled` / `danger` / `ghost` / `block` / `href` / `target` / `variant`（solid/outlined/dashed/filled/text/link）/ `color`（default/primary/danger/PresetColors） / `autoInsertSpace` |
| FloatButton | `type` / `shape` / `icon` / `description` / `tooltip` / `badge` / `href` / `target`；`FloatButton.Group`（菜单组） / `FloatButton.BackTop`（回顶部） |
| Icon | 由 `@ant-design/icons` 提供，~700 图标，PascalCase + Outlined/Filled/TwoTone 后缀 |
| Typography | `Typography.Title` / `.Text` / `.Paragraph` / `.Link`；常用 props：`level`（1-5） / `type`（secondary/success/warning/danger） / `mark` / `code` / `keyboard` / `underline` / `delete` / `strong` / `italic` / `ellipsis` / `copyable` / `editable` |

### Layout（布局，7）

| 组件 | 常用 props |
|---|---|
| Divider | `type`（horizontal/vertical） / `orientation`（left/right/center） / `dashed` / `plain` |
| Flex | `vertical` / `wrap` / `justify` / `align` / `gap`（small/middle/large/数值） / `flex` / `component` |
| Grid（Row/Col） | `Row`：`gutter`（间距） / `justify` / `align` / `wrap`；`Col`：`span` / `offset` / `pull` / `push` / `order` / `flex` / `xs/sm/md/lg/xl/xxl` |
| Layout | `Layout` / `Layout.Header` / `Layout.Footer` / `Layout.Sider` / `Layout.Content`；Sider props：`width` / `collapsed` / `collapsible` / `theme`（light/dark） / `breakpoint` / `trigger` |
| Space | `direction`（horizontal/vertical） / `size`（small/middle/large/数值） / `align`（start/end/center/baseline） / `wrap` / `split`；`Space.Compact`（无间距紧凑） |
| Splitter | `Splitter.Panel`：`defaultSize` / `min` / `max` / `collapsible` / `resizable`（v5.21+） |
| Masonry | 瀑布流布局（v6.x+） |

### Navigation（导航，7）

| 组件 | 常用 props |
|---|---|
| Anchor | `affix` / `bounds` / `getContainer` / `offsetTop` / `targetOffset` / `items` |
| Breadcrumb | `separator` / `items`（推荐，替代 BreadcrumbItem children） |
| Dropdown | `menu` / `trigger`（hover/click/contextMenu） / `placement` / `disabled` / `arrow` / `open` / `onOpenChange`；`Dropdown.Button`（按钮组合） |
| Menu | `mode`（horizontal/vertical/inline） / `theme`（light/dark） / `items`（推荐数组） / `selectedKeys` / `openKeys` / `inlineCollapsed` / `multiple` / `subMenuCloseDelay` / `subMenuOpenDelay` |
| Pagination | `current` / `defaultCurrent` / `pageSize` / `total` / `showSizeChanger` / `pageSizeOptions` / `showQuickJumper` / `showTotal` / `simple` / `responsive` |
| Steps | `current` / `direction`（horizontal/vertical） / `size`（default/small） / `status`（wait/process/finish/error） / `items` / `progressDot` / `type`（default/navigation/inline） |
| Tabs | `activeKey` / `defaultActiveKey` / `type`（line/card/editable-card） / `size` / `tabPosition` / `centered` / `items` / `onChange` / `onEdit`（editable-card） |

### Data Entry（数据输入，18）

| 组件 | 常用 props |
|---|---|
| AutoComplete | `options` / `value` / `onChange` / `onSearch` / `filterOption` / `placeholder` / `allowClear` |
| Cascader | `options` / `value` / `onChange` / `multiple` / `expandTrigger`（click/hover） / `displayRender` / `showSearch` |
| Checkbox | 单：`checked` / `defaultChecked` / `disabled` / `indeterminate` / `onChange`；`Checkbox.Group`：`options` / `value` / `defaultValue` |
| ColorPicker | `value` / `defaultValue` / `format`（hex/rgb/hsb） / `allowClear` / `showText` / `presets` |
| DatePicker | `value` / `defaultValue` / `format` / `picker`（date/week/month/quarter/year） / `disabledDate` / `showTime` / `presets`；`DatePicker.RangePicker`（日期范围） |
| Form | 见下方专题 |
| Form.Item | 见下方专题 |
| Input | `value` / `defaultValue` / `placeholder` / `prefix` / `suffix` / `allowClear` / `disabled` / `maxLength` / `showCount` / `size` / `status`（error/warning） / `variant`（outlined/filled/borderless）；子组件：`Input.Password` / `Input.TextArea` / `Input.Search` / `Input.Group` / `Input.OTP`（v5.13+） |
| InputNumber | `value` / `min` / `max` / `step` / `precision` / `formatter` / `parser` / `controls` / `keyboard` |
| Mentions | `value` / `options` / `prefix`（@/#） / `split` / `placement`（top/bottom） / `filterOption` |
| Radio | 单：`checked` / `defaultChecked` / `value` / `disabled`；`Radio.Group`：`options` / `value` / `optionType`（default/button） / `buttonStyle`（outline/solid） / `size` |
| Rate | `value` / `defaultValue` / `count` / `allowHalf` / `allowClear` / `character` / `disabled` |
| Select | 见下方专题 |
| Slider | `value` / `min` / `max` / `step` / `range` / `marks` / `tooltip` / `vertical` / `included` |
| Switch | `checked` / `defaultChecked` / `disabled` / `loading` / `size`（default/small） / `checkedChildren` / `unCheckedChildren` |
| TimePicker | `value` / `format` / `hourStep` / `minuteStep` / `secondStep` / `use12Hours`；`TimePicker.RangePicker` |
| Transfer | `dataSource` / `targetKeys` / `selectedKeys` / `render` / `oneWay` / `pagination` / `showSearch` |
| TreeSelect | `treeData` / `value` / `treeCheckable` / `treeDefaultExpandAll` / `multiple` / `showCheckedStrategy` / `treeNodeFilterProp` |
| Upload | `action` / `method` / `headers` / `data` / `accept` / `multiple` / `directory` / `fileList` / `customRequest` / `beforeUpload` / `onChange` / `listType`（text/picture/picture-card/picture-circle） |

### Data Display（数据展示，20）

| 组件 | 常用 props |
|---|---|
| Avatar | `size`（number/small/middle/large） / `shape`（circle/square） / `src` / `icon` / `gap` / `crossOrigin` / `draggable`；`Avatar.Group`：`max` / `maxStyle` / `size` |
| Badge | `count` / `dot` / `showZero` / `overflowCount` / `status`（success/processing/default/error/warning） / `color` / `text` / `offset`；`Badge.Ribbon`（缎带） |
| Calendar | `value` / `defaultValue` / `mode`（month/year） / `fullscreen` / `cellRender` / `disabledDate` |
| Card | `title` / `extra` / `bordered` / `loading` / `hoverable` / `size`（default/small） / `cover` / `actions` / `type`（inner）；`Card.Grid` / `Card.Meta` |
| Carousel | `autoplay` / `dots` / `dotPosition` / `effect`（scrollx/fade） / `infinite` / `speed` / `arrows`（v6.x+） |
| Collapse | `activeKey` / `defaultActiveKey` / `accordion` / `bordered` / `ghost` / `expandIcon` / `expandIconPosition`（start/end） / `items`（推荐数组） |
| Descriptions | `title` / `bordered` / `column` / `size`（default/middle/small） / `layout`（horizontal/vertical） / `colon` / `items`（推荐数组） |
| Empty | `description` / `image` / `imageStyle` / `children` |
| Image | `src` / `alt` / `width` / `height` / `placeholder` / `fallback` / `preview` / `loading`（eager/lazy）；`Image.PreviewGroup` |
| List | `dataSource` / `renderItem` / `header` / `footer` / `bordered` / `size` / `split` / `loading` / `pagination` / `grid` / `itemLayout`（horizontal/vertical） |
| Popover | `title` / `content` / `trigger` / `placement` / `arrow` / `open` / `onOpenChange` / `getPopupContainer` |
| QRCode | `value` / `type`（canvas/svg） / `icon` / `iconSize` / `size` / `color` / `bgColor` / `errorLevel`（L/M/Q/H） / `status`（loading/expired） |
| Segmented | `options` / `value` / `defaultValue` / `block` / `size` / `disabled` / `vertical` |
| Statistic | `title` / `value` / `precision` / `prefix` / `suffix` / `formatter` / `loading`；`Statistic.Countdown`（倒计时） / `Statistic.Timer`（v5.30+） |
| Table | 见下方专题 |
| Tag | `color`（PresetColors/hex） / `closable` / `closeIcon` / `icon` / `bordered` / `onClose`；`Tag.CheckableTag` |
| Timeline | `mode`（left/right/alternate） / `pending` / `pendingDot` / `reverse` / `items`（推荐数组） |
| Tooltip | `title` / `placement` / `trigger`（hover/focus/click） / `arrow` / `color` / `mouseEnterDelay` / `mouseLeaveDelay` |
| Tour | `open` / `current` / `steps` / `placement` / `mask` / `type`（default/primary） / `onClose` / `onFinish` / `onChange`；`Tour.useTour` |
| Tree | `treeData` / `checkable` / `selectable` / `multiple` / `defaultExpandAll` / `checkedKeys` / `selectedKeys` / `expandedKeys` / `loadData` / `virtual`；`Tree.DirectoryTree`（文件目录树） |

### Feedback（反馈，11）

| 组件 | 常用 props / API |
|---|---|
| Alert | `type`（success/info/warning/error） / `message` / `description` / `closable` / `icon` / `showIcon` / `banner` / `action` / `afterClose`；`Alert.ErrorBoundary` |
| Drawer | `open` / `onClose` / `title` / `extra` / `footer` / `placement`（left/right/top/bottom） / `size`（default 378px / large 736px） / `width` / `height` / `mask` / `keyboard` / `destroyOnHidden`（v5.25+） / `closable` / `resizable`（v6+） |
| Message | `message.success/error/warning/info/loading(content, duration?, onClose?)` / `message.useMessage()` / `App.useApp().message`；options：`content` / `duration` / `key` / `icon` / `onClose` / `className` / `style` / `pauseOnHover`（默认 true） |
| Modal | `<Modal>` 组件：`open` / `onOk` / `onCancel` / `title` / `footer` / `okText` / `cancelText` / `confirmLoading` / `width` / `centered` / `closable` / `maskClosable` / `destroyOnHidden`；命令式：`Modal.confirm/info/success/error/warning(config)` / `Modal.useModal()` / `App.useApp().modal` |
| Notification | `notification.success/error/warning/info/open(config)` / `notification.useNotification()` / `App.useApp().notification`；options：`title`（v6） / `message`（v5） / `description`（必需） / `duration`（默认 4.5） / `placement`（topLeft/topRight/bottomLeft/bottomRight/top/bottom） / `icon` / `btn` / `actions` / `showProgress`（v5.20+） / `pauseOnHover` |
| Popconfirm | `title` / `description` / `okText` / `cancelText` / `onConfirm` / `onCancel` / `okType` / `icon` / `placement` / `disabled` / `trigger` |
| Progress | `type`（line/circle/dashboard） / `percent` / `status`（success/exception/normal/active） / `strokeColor` / `strokeWidth` / `showInfo` / `format` / `steps`（分段进度） |
| Result | `status`（success/error/info/warning/404/403/500） / `title` / `subTitle` / `icon` / `extra` |
| Skeleton | `loading` / `active` / `avatar` / `paragraph` / `title` / `round`；子组件：`Skeleton.Avatar` / `.Button` / `.Input` / `.Image` / `.Node` |
| Spin | `spinning` / `tip` / `size`（small/default/large） / `delay` / `indicator` / `fullscreen`（v5.11+） |
| Watermark | `content`（string/string[]） / `image` / `width` / `height` / `rotate` / `font` / `gap` / `offset` / `zIndex` |

### Other（其他，5）

| 组件 | 常用 props / API |
|---|---|
| Affix | `offsetTop` / `offsetBottom` / `target` / `onChange` |
| App | `<App>{ children }</App>`；`App.useApp()` 返回 `{ message, modal, notification }`；可设 `message` / `modal` / `notification` 默认 config |
| BorderBeam | 边框光束动效（v6+，装饰类） |
| ConfigProvider | 见下方专题 |
| Util | 内部工具（不直接使用） |

## ConfigProvider 完整选项

```ts
interface ConfigProviderProps {
  // 主题
  theme?: ThemeConfig

  // 国际化
  locale?: Locale

  // 方向
  direction?: 'ltr' | 'rtl'

  // 全局尺寸
  componentSize?: 'small' | 'middle' | 'large'

  // 全局禁用
  componentDisabled?: boolean

  // 变体
  variant?: 'outlined' | 'filled' | 'borderless'

  // CSS 前缀
  prefixCls?: string                                // 默认 'ant'
  iconPrefixCls?: string                            // 默认 'anticon'

  // CSP
  csp?: { nonce?: string }

  // 弹层
  popupMatchSelectWidth?: boolean | number
  popupOverflow?: 'viewport' | 'scroll'
  getPopupContainer?: (triggerNode?: HTMLElement) => HTMLElement
  getTargetContainer?: () => HTMLElement | Window

  // 空状态
  renderEmpty?: (componentName?: string) => ReactNode

  // 警告
  warning?: { strict?: boolean }

  // 虚拟滚动
  virtual?: boolean

  // 自动插入空格（按钮内中文字符之间）
  autoInsertSpaceInButton?: boolean

  // Wave 效果
  wave?: { disabled?: boolean }

  // 组件级配置（40+ 组件）
  button?: ComponentConfig<ButtonProps>
  input?: ComponentConfig<InputProps>
  form?: ComponentConfig<FormProps>
  select?: ComponentConfig
  datePicker?: ComponentConfig
  modal?: ComponentConfig
  drawer?: ComponentConfig
  notification?: ComponentConfig
  message?: ComponentConfig
  table?: ComponentConfig
  card?: ComponentConfig
  menu?: ComponentConfig
  pagination?: ComponentConfig
  collapse?: ComponentConfig
  tooltip?: ComponentConfig
  // ... 等等
}

interface ComponentConfig<T = {}> {
  className?: string
  style?: CSSProperties
  classNames?: T['classNames']
  styles?: T['styles']
  // ... 组件特定 props
}
```

### ConfigProvider.useConfig

```tsx
import { ConfigProvider } from 'antd'

function MyComponent() {
  const { componentDisabled, componentSize } = ConfigProvider.useConfig()
  return <Button disabled={componentDisabled} size={componentSize}>...</Button>
}
```

### ConfigProvider.config（静态全局配置）

```tsx
ConfigProvider.config({
  holderRender: (children) => (
    <ConfigProvider locale={zhCN}>{children}</ConfigProvider>
  ),
})
```

> **解决 message / Modal / notification 静态方法不消费 Context 的问题**——但**v5 更推荐用 `<App>` 组件**。

## Form 完整 API

### FormProps

```ts
interface FormProps<Values = any> {
  form?: FormInstance<Values>                     // useForm() 返回
  name?: string                                     // 表单名
  layout?: 'horizontal' | 'vertical' | 'inline'
  labelCol?: ColProps
  wrapperCol?: ColProps
  labelAlign?: 'left' | 'right'
  labelWrap?: boolean
  colon?: boolean                                   // 显示冒号
  initialValues?: Partial<Values>
  validateMessages?: ValidateMessages
  validateTrigger?: string | string[]               // 'onChange' / 'onBlur' / 'onSubmit'
  validateDebounce?: number                         // 防抖（v5.10+）
  scrollToFirstError?: boolean | ScrollOptions     // 提交失败时滚动到第一个错误
  preserve?: boolean                                // 卸载时保留字段值
  requiredMark?: boolean | 'optional' | RenderFn
  variant?: 'outlined' | 'filled' | 'borderless'
  size?: 'small' | 'middle' | 'large'
  disabled?: boolean
  feedbackIcons?: FeedbackIcons
  rootClassName?: string
  onFinish?: (values: Values) => void | Promise<void>
  onFinishFailed?: (errorInfo: ValidateErrorEntity<Values>) => void
  onValuesChange?: (changedValues, allValues) => void
  onFieldsChange?: (changedFields, allFields) => void
}
```

### FormInstance

```ts
interface FormInstance<Values = any> {
  // 取值
  getFieldValue(name: NamePath): any
  getFieldsValue(): Values
  getFieldsValue(nameList: NamePath[]): any
  getFieldsValue(nameList?: NamePath[], filterFunc?: (meta) => boolean): any

  // 设值
  setFieldValue(name: NamePath, value: any): void                // v4.22+
  setFieldsValue(values: Partial<Values>): void

  // 校验
  validateFields(nameList?: NamePath[]): Promise<Values>
  validateFields(options?: ValidateOptions): Promise<Values>

  // 重置
  resetFields(fields?: NamePath[]): void

  // 错误
  getFieldError(name: NamePath): string[]
  getFieldsError(nameList?: NamePath[]): FieldError[]

  // 状态
  isFieldTouched(name: NamePath): boolean
  isFieldsTouched(nameList?: NamePath[], allFieldsTouched?: boolean): boolean
  isFieldValidating(name: NamePath): boolean
  isFieldsValidating(nameList?: NamePath[]): boolean

  // 滚动
  scrollToField(name: NamePath, options?: ScrollOptions): void

  // 提交
  submit(): void
}
```

### Form.Item Props

```ts
interface FormItemProps {
  name?: NamePath                                   // string | number | (string | number)[]
  label?: ReactNode
  labelCol?: ColProps
  wrapperCol?: ColProps
  labelAlign?: 'left' | 'right'
  colon?: boolean
  required?: boolean
  rules?: Rule[]
  validateTrigger?: string | string[]
  validateFirst?: boolean                           // 校验出第一个错误后停止
  validateStatus?: 'success' | 'warning' | 'error' | 'validating'
  hasFeedback?: boolean | { icons?: FeedbackIcons }
  help?: ReactNode                                  // 自定义提示
  extra?: ReactNode                                 // 字段下方说明
  hidden?: boolean
  initialValue?: any
  dependencies?: NamePath[]                         // 依赖字段
  shouldUpdate?: boolean | (prev, cur) => boolean
  trigger?: string                                  // 默认 'onChange'
  valuePropName?: string                            // 默认 'value'（Checkbox 用 'checked'）
  getValueFromEvent?: (...args) => any
  getValueProps?: (value) => Record<string, any>
  normalize?: (value, prevValue, allValues) => any
  preserve?: boolean
  noStyle?: boolean
  tooltip?: ReactNode | TooltipProps
  htmlFor?: string
}
```

### Rule

```ts
interface Rule {
  required?: boolean
  type?: StringType                                 // string/number/boolean/url/email/date/method/regexp/integer/float/array/object/enum
  pattern?: RegExp
  min?: number
  max?: number
  len?: number
  whitespace?: boolean                              // 不允许空白字符
  enum?: any[]
  message?: ReactNode
  validator?: (rule, value) => Promise<void>
  validateTrigger?: string | string[]
  warningOnly?: boolean                             // 只警告不阻止
  defaultField?: Rule                               // 数组 / 对象的项校验
  fields?: Record<string, Rule[]>                  // 对象字段校验
  asyncValidator?: AsyncValidator
}
```

### Form.List render

```ts
type FormListRenderFn = (
  fields: FormListFieldData[],
  operation: {
    add: (defaultValue?: any, insertIndex?: number) => void
    remove: (index: number | number[]) => void
    move: (from: number, to: number) => void
  },
  meta: { errors: ReactNode[], warnings: ReactNode[] },
) => ReactNode
```

### Hook 签名

```ts
// Form.useForm
const [form] = Form.useForm<FormValues>()

// Form.useWatch
const username = Form.useWatch<string>('username', form)
const allValues = Form.useWatch(() => form.getFieldsValue(), form)

// Form.useFormInstance（在 Form 子组件中获取父 Form 实例）
const form = Form.useFormInstance()
```

## Table 完整 API

### TableProps

```ts
interface TableProps<T = any> {
  columns?: ColumnsType<T>
  dataSource?: T[]
  rowKey?: string | ((record: T) => Key)
  pagination?: false | PaginationProps
  bordered?: boolean
  size?: 'small' | 'middle' | 'large'
  scroll?: { x?: number | string, y?: number | string, scrollToFirstRowOnChange?: boolean }
  virtual?: boolean                                 // v5.9+
  loading?: boolean | SpinProps
  showHeader?: boolean
  showSorterTooltip?: boolean | TooltipProps
  sortDirections?: SortOrder[]                      // ['ascend', 'descend']
  expandable?: ExpandableConfig<T>
  rowSelection?: TableRowSelection<T>
  rowClassName?: string | ((record, index) => string)
  rowHoverable?: boolean
  onChange?: (pagination, filters, sorter, extra) => void
  onRow?: (record, index) => HTMLAttributes
  onHeaderRow?: (columns, index) => HTMLAttributes
  summary?: (data: readonly T[]) => ReactNode
  childrenColumnName?: string                       // 默认 'children'
  tableLayout?: 'auto' | 'fixed'
  sticky?: boolean | { offsetHeader, offsetScroll, getContainer }
  caption?: ReactNode
  components?: TableComponents<T>                  // 自定义渲染（包括 ant-design-virtual-table）
}
```

### ColumnsType

```ts
type ColumnsType<T> = (ColumnGroupType<T> | ColumnType<T>)[]

interface ColumnType<T> {
  key?: Key
  title?: ReactNode | (({ sortOrder, sortColumn, filters }) => ReactNode)
  dataIndex?: string | string[]
  width?: number | string
  minWidth?: number
  fixed?: 'left' | 'right' | boolean
  align?: 'left' | 'center' | 'right'
  className?: string
  ellipsis?: boolean | { showTitle?: boolean }
  render?: (value, record: T, index: number) => ReactNode | RenderedCell
  colSpan?: number
  rowScope?: 'row' | 'rowgroup'

  // 排序
  sorter?: boolean | SortFunction<T> | { compare: SortFunction<T>, multiple: number }
  sortOrder?: SortOrder
  defaultSortOrder?: SortOrder
  sortDirections?: SortOrder[]

  // 筛选
  filters?: { text: ReactNode, value: any, children?: Filters[] }[]
  filterMode?: 'menu' | 'tree'
  filterSearch?: boolean | FilterSearchType
  filterMultiple?: boolean
  filteredValue?: Key[] | null
  defaultFilteredValue?: Key[] | null
  filterDropdown?: ReactNode | (props) => ReactNode
  filterIcon?: ReactNode | (filtered: boolean) => ReactNode
  onFilter?: (value, record: T) => boolean
  onFilterDropdownOpenChange?: (visible) => void

  // 子列（表头分组）
  children?: ColumnsType<T>

  // 事件
  onCell?: (record, index) => CellHTMLAttributes
  onHeaderCell?: (column) => CellHTMLAttributes
}
```

### TableRowSelection

```ts
interface TableRowSelection<T> {
  type?: 'checkbox' | 'radio'
  selectedRowKeys?: Key[]
  defaultSelectedRowKeys?: Key[]
  onChange?: (keys: Key[], rows: T[], info: { type: 'all' | 'none' | 'invert' | 'single' | 'multiple' }) => void
  onSelect?: (record, selected, rows, event) => void
  onSelectAll?: (selected, rows, changeRows) => void
  onSelectMultiple?: (selected, rows, changeRows) => void
  onSelectNone?: () => void
  getCheckboxProps?: (record) => HTMLAttributes
  hideSelectAll?: boolean
  columnTitle?: ReactNode
  columnWidth?: number | string
  fixed?: boolean
  preserveSelectedRowKeys?: boolean                 // 跨页保留
  selections?: SelectionItem[] | boolean
  renderCell?: (checked, record, index, originNode) => ReactNode
  checkStrictly?: boolean                           // 树形：父子节点选中状态独立
}
```

## Message / Modal / Notification API

### message API

```ts
import { message } from 'antd'

// 静态方法（不推荐，不消费 Context）
message.success(content: ReactNode | ArgsProps, duration?: number, onClose?: () => void): MessageType
message.error(content, duration?, onClose?)
message.warning(content, duration?, onClose?)
message.info(content, duration?, onClose?)
message.loading(content, duration?, onClose?)
message.open(args: ArgsProps): MessageType
message.destroy(key?: Key)
message.config(options: ConfigOptions)

// Hook（推荐）
const [messageApi, contextHolder] = message.useMessage()

// App.useApp（最推荐）
const { message } = App.useApp()
```

**ArgsProps**：

```ts
interface ArgsProps {
  content: ReactNode
  duration?: number                                 // 默认 3 秒
  key?: Key
  icon?: ReactNode
  className?: string
  style?: CSSProperties
  onClose?: () => void
  onClick?: () => void
  pauseOnHover?: boolean                            // 默认 true
  type?: 'info' | 'success' | 'error' | 'warning' | 'loading'
}
```

### Modal API

```ts
// 组件形式
<Modal
  open
  title
  onOk
  onCancel
  okText / cancelText
  okType                                            // 'primary' | 'danger'
  okButtonProps / cancelButtonProps
  width                                             // 默认 520
  centered                                          // 居中
  closable                                          // 关闭按钮
  maskClosable                                      // 点击遮罩关闭
  keyboard                                          // ESC 关闭
  destroyOnHidden                                   // v5.25+
  confirmLoading                                    // OK 按钮 loading
  footer                                            // ReactNode | null
  forceRender
  zIndex                                            // 默认 1000
  loading                                           // v5.18+
/>

// 命令式
Modal.confirm(config)
Modal.info(config)
Modal.success(config)
Modal.error(config)
Modal.warning(config)
Modal.destroyAll()

// 返回 ModalFuncProps
const ref = Modal.confirm({...})
ref.update(newConfig)
ref.destroy()

// Hook
const [modal, contextHolder] = Modal.useModal()

// App.useApp
const { modal } = App.useApp()
```

### notification API

```ts
// 静态方法
notification.success(args)
notification.error(args)
notification.info(args)
notification.warning(args)
notification.open(args)
notification.destroy(key?)
notification.config(globalConfig)

// Hook（推荐）
const [api, contextHolder] = notification.useNotification()

// App.useApp（最推荐）
const { notification } = App.useApp()
```

**ArgsProps**：

```ts
interface NotificationArgsProps {
  title?: ReactNode                                 // v6
  message?: ReactNode                               // v5（v6 中改用 title）
  description: ReactNode                            // 必需
  duration?: number | false                         // 默认 4.5 秒
  placement?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'top' | 'bottom'
  icon?: ReactNode
  showProgress?: boolean                            // v5.20+
  pauseOnHover?: boolean
  btn?: ReactNode
  actions?: ReactNode                               // v6
  key?: Key
  className?: string
  style?: CSSProperties
  closeIcon?: ReactNode
  onClick?: () => void
  onClose?: () => void
  role?: 'alert' | 'status'                         // 可访问性
}
```

## App 组件 + App.useApp Hook

```ts
import { App } from 'antd'

// 包根
<App
  message={{ maxCount: 3 }}                         // message 默认配置
  modal={{ classNames: {...} }}                     // Modal 默认配置
  notification={{ placement: 'bottomRight' }}       // notification 默认配置
>
  <YourApp />
</App>

// 在子组件中使用
const { message, modal, notification } = App.useApp()

message.success('...')
modal.confirm({...})
notification.success({...})
```

## Theme 完整结构

```ts
import type { ThemeConfig } from 'antd'

interface ThemeConfig {
  token?: Partial<AliasToken>
  components?: Partial<ComponentsConfig>
  algorithm?: MappingAlgorithm | MappingAlgorithm[]
  hashed?: boolean                                  // 是否给 CSS 类名加 hash
  inherit?: boolean                                 // 是否继承父 ConfigProvider
  cssVar?: boolean | { key?, prefix? }              // 启用 CSS Variables（v5.7+）
}
```

### Seed Token（~12 个）

```ts
interface SeedToken {
  // 颜色 Seed（6 个）
  colorPrimary: string
  colorSuccess: string
  colorWarning: string
  colorError: string
  colorInfo: string
  colorTextBase: string
  colorBgBase: string

  // 字体 Seed
  fontFamily: string
  fontFamilyCode: string
  fontSize: number

  // 圆角 Seed
  borderRadius: number

  // 间距 Seed
  sizeUnit: number                                  // 间距步长（默认 4）
  sizeStep: number                                  // 间距倍数（默认 4）
  sizePopupArrow: number

  // 控件 Seed
  controlHeight: number                             // 默认 32

  // 边框 Seed
  lineWidth: number
  lineType: 'solid' | 'dashed' | 'dotted'

  // 动画 Seed
  motion: boolean
  motionUnit: number                                // 动画时长单位
  motionBase: number

  // Z-index Seed
  zIndexBase: number
  zIndexPopupBase: number

  // 透明度 Seed
  opacityImage: number

  // 线框模式
  wireframe: boolean
}
```

### Map Token（自动派生）

```ts
interface MapToken extends SeedToken {
  // 颜色 Map（每个主色派生 6-13 个 token）
  colorPrimaryBg: string                            // 主色 + 浅背景
  colorPrimaryBgHover: string
  colorPrimaryBorder: string
  colorPrimaryBorderHover: string
  colorPrimaryHover: string
  colorPrimaryActive: string
  colorPrimaryTextHover: string
  colorPrimaryText: string
  colorPrimaryTextActive: string
  // ... 其他色系类似

  // 字号 Map
  fontSizeSM: number
  fontSizeLG: number
  fontSizeXL: number
  fontSizeHeading1: number
  fontSizeHeading2: number
  fontSizeHeading3: number
  fontSizeHeading4: number
  fontSizeHeading5: number

  // 字重
  fontWeightStrong: number

  // 间距 Map
  sizeXXL: number
  sizeXL: number
  sizeLG: number
  sizeMD: number
  sizeMS: number                                    // 默认 sizeUnit * 3
  size: number                                      // 默认 sizeUnit * 4
  sizeSM: number
  sizeXS: number
  sizeXXS: number

  // 圆角 Map
  borderRadiusXS: number
  borderRadiusSM: number
  borderRadiusLG: number
  borderRadiusOuter: number
}
```

### Alias Token（语义别名）

```ts
interface AliasToken extends MapToken {
  // 背景
  colorBgContainer: string                          // 卡片等容器
  colorBgElevated: string                           // 浮层
  colorBgLayout: string                             // 页面
  colorBgMask: string                               // 遮罩
  colorBgSpotlight: string                          // Tooltip
  colorBgBlur: string                               // 模糊背景

  // 边框
  colorBorder: string
  colorBorderSecondary: string

  // 填充
  colorFill: string
  colorFillSecondary: string
  colorFillTertiary: string
  colorFillQuaternary: string

  // 文字
  colorText: string                                 // 一级
  colorTextSecondary: string                        // 二级
  colorTextTertiary: string                         // 三级
  colorTextQuaternary: string                       // 四级（disabled）
  colorTextDescription: string
  colorTextPlaceholder: string
  colorTextDisabled: string
  colorTextHeading: string
  colorTextLightSolid: string

  // 控件
  controlOutline: string
  controlOutlineWidth: number
  controlTmpOutline: string

  // 高度
  controlHeightXS: number                           // 16
  controlHeightSM: number                           // 24
  controlHeightLG: number                           // 40

  // 圆角
  controlInteractiveSize: number

  // 字号
  fontSizeIcon: number

  // 间距
  padding: number                                   // 16
  paddingXXS: number
  paddingXS: number
  paddingSM: number
  paddingMD: number                                 // 20
  paddingLG: number                                 // 24
  paddingXL: number

  // margin
  margin: number                                    // 16
  marginXXS: number                                 // 4
  marginXS: number                                  // 8
  marginSM: number                                  // 12
  marginMD: number                                  // 20
  marginLG: number                                  // 24
  marginXL: number                                  // 32

  // 阴影
  boxShadow: string
  boxShadowSecondary: string
  boxShadowTertiary: string

  // 动画时长
  motionDurationFast: string                        // '0.1s'
  motionDurationMid: string                         // '0.2s'
  motionDurationSlow: string                        // '0.3s'

  // 缓动函数
  motionEaseInOut: string
  motionEaseInOutCirc: string
  motionEaseInBack: string
  motionEaseOutBack: string
  motionEaseInQuint: string
  motionEaseOutQuint: string
  motionEaseOut: string

  // Z-index
  zIndexPopupBase: number
}
```

### algorithm

```ts
import { theme } from 'antd'

type MappingAlgorithm = (seedToken: SeedToken, mapToken?: MapToken) => MapToken

// 内置算法
theme.defaultAlgorithm                              // 浅色
theme.darkAlgorithm                                 // 暗色
theme.compactAlgorithm                              // 紧凑

// 组合
algorithm: [theme.darkAlgorithm, theme.compactAlgorithm]
```

### theme.useToken

```ts
import { theme } from 'antd'

const { useToken } = theme

function MyComponent() {
  const { token, hashId, theme: themeConfig } = useToken()

  // token 包含完整的 SeedToken + MapToken + AliasToken
  return <div style={{ color: token.colorPrimary }}>...</div>
}
```

### getDesignToken（静态获取）

```ts
import { getDesignToken } from 'antd'

const token = getDesignToken({ token: { colorPrimary: '#1677ff' } })
console.log(token.colorPrimaryHover)               // '#4096ff'
```

## TypeScript 工具类型

```ts
import type { GetProps, GetProp, GetRef } from 'antd'
import { Button, Input, Select } from 'antd'

// 获取组件 props
type ButtonProps = GetProps<typeof Button>
type InputProps = GetProps<typeof Input>

// 获取组件特定 prop 类型
type SelectOptionsType = GetProp<typeof Select, 'options'>

// 获取组件 ref 类型
type InputRef = GetRef<typeof Input>
const ref = useRef<InputRef>(null)
ref.current?.focus()
```

## 60+ 语言包列表

`antd/locale/` 目录下的语言包路径（部分）：

| 语言 | 路径 | dayjs locale |
|---|---|---|
| 简体中文 | `antd/locale/zh_CN` | `'zh-cn'` |
| 繁体中文（台湾） | `antd/locale/zh_TW` | `'zh-tw'` |
| 繁体中文（香港） | `antd/locale/zh_HK` | `'zh-hk'` |
| 英文 | `antd/locale/en_US` | `'en'` |
| 英文（英国） | `antd/locale/en_GB` | `'en-gb'` |
| 日文 | `antd/locale/ja_JP` | `'ja'` |
| 韩文 | `antd/locale/ko_KR` | `'ko'` |
| 法文 | `antd/locale/fr_FR` | `'fr'` |
| 法文（加拿大） | `antd/locale/fr_CA` | `'fr-ca'` |
| 德文 | `antd/locale/de_DE` | `'de'` |
| 西班牙文 | `antd/locale/es_ES` | `'es'` |
| 俄文 | `antd/locale/ru_RU` | `'ru'` |
| 葡萄牙文（巴西） | `antd/locale/pt_BR` | `'pt-br'` |
| 葡萄牙文 | `antd/locale/pt_PT` | `'pt'` |
| 意大利文 | `antd/locale/it_IT` | `'it'` |
| 阿拉伯文（埃及） | `antd/locale/ar_EG` | `'ar'` |
| 越南文 | `antd/locale/vi_VN` | `'vi'` |
| 泰文 | `antd/locale/th_TH` | `'th'` |
| 土耳其文 | `antd/locale/tr_TR` | `'tr'` |
| 波兰文 | `antd/locale/pl_PL` | `'pl'` |
| 荷兰文 | `antd/locale/nl_NL` | `'nl'` |
| 印尼文 | `antd/locale/id_ID` | `'id'` |
| 乌克兰文 | `antd/locale/uk_UA` | `'uk'` |
| 希伯来文 | `antd/locale/he_IL` | `'he'` |
| 希腊文 | `antd/locale/el_GR` | `'el'` |
| 捷克文 | `antd/locale/cs_CZ` | `'cs'` |
| 罗马尼亚文 | `antd/locale/ro_RO` | `'ro'` |
| 瑞典文 | `antd/locale/sv_SE` | `'sv'` |
| 挪威文 | `antd/locale/nb_NO` | `'nb'` |
| 芬兰文 | `antd/locale/fi_FI` | `'fi'` |
| 丹麦文 | `antd/locale/da_DK` | `'da'` |
| 匈牙利文 | `antd/locale/hu_HU` | `'hu'` |
| 保加利亚文 | `antd/locale/bg_BG` | `'bg'` |
| 印地文 | `antd/locale/hi_IN` | `'hi'` |
| 波斯文 | `antd/locale/fa_IR` | `'fa'` |
| 马来文 | `antd/locale/ms_MY` | `'ms'` |

完整列表见 [GitHub locale 目录](https://github.com/ant-design/ant-design/tree/master/components/locale).

## @ant-design/icons 速查

### 图标命名规则

```
{图标名}{风格后缀}
```

| 后缀 | 风格 | 例子 |
|---|---|---|
| `Outlined` | 线框（默认推荐） | `HomeOutlined` / `EditOutlined` / `DeleteOutlined` |
| `Filled` | 实心 | `HomeFilled` / `StarFilled` |
| `TwoTone` | 双色（`twoToneColor` 设第二色） | `HomeTwoTone` / `StarTwoTone twoToneColor="#1677ff"` |

### 常用图标分类

**基础操作**：

| 图标 | 用途 |
|---|---|
| EditOutlined | 编辑 |
| DeleteOutlined | 删除 |
| PlusOutlined | 新增 |
| SearchOutlined | 搜索 |
| CloseOutlined | 关闭 |
| CheckOutlined | 确认 |
| SettingOutlined | 设置 |
| EllipsisOutlined | 更多（三点） |
| ReloadOutlined | 刷新 |
| DownloadOutlined | 下载 |
| UploadOutlined | 上传 |
| CopyOutlined | 复制 |
| SaveOutlined | 保存 |
| FilterOutlined | 筛选 |
| SortAscendingOutlined | 升序 |

**导航**：

| 图标 | 用途 |
|---|---|
| HomeOutlined | 首页 |
| UserOutlined | 用户 |
| TeamOutlined | 团队 |
| MenuOutlined | 菜单 |
| AppstoreOutlined | 应用 |
| DashboardOutlined | 仪表盘 |
| FolderOutlined | 文件夹 |
| FileOutlined | 文件 |

**箭头**：

| 图标 | 用途 |
|---|---|
| ArrowUpOutlined | 上箭头 |
| ArrowDownOutlined | 下箭头 |
| ArrowLeftOutlined | 左箭头 |
| ArrowRightOutlined | 右箭头 |
| LeftOutlined | 左 |
| RightOutlined | 右 |
| UpOutlined | 上 |
| DownOutlined | 下 |

**状态**：

| 图标 | 用途 |
|---|---|
| LoadingOutlined | 加载中（自带 spin） |
| CheckCircleOutlined | 成功 |
| CloseCircleOutlined | 失败 |
| ExclamationCircleOutlined | 警告 |
| InfoCircleOutlined | 信息 |
| QuestionCircleOutlined | 问号 |
| WarningOutlined | 警告（三角形） |

完整图标库见 [图标列表](https://ant.design/components/icon-cn/).

### 自定义图标

```ts
// IconFont（阿里 iconfont.cn）
import { createFromIconfontCN } from '@ant-design/icons'

const IconFont = createFromIconfontCN({
  scriptUrl: '//at.alicdn.com/t/font_xxx.js',
})

<IconFont type="icon-mycustom" />

// SVG 自定义图标
import Icon from '@ant-design/icons'

const MyIcon = (props) => (
  <Icon
    component={() => (
      <svg width="1em" height="1em" fill="currentColor" viewBox="0 0 24 24">
        <path d="..." />
      </svg>
    )}
    {...props}
  />
)
```

## @ant-design/pro-components API 索引

[`@ant-design/pro-components`](https://procomponents.ant.design/) 是中后台二次封装：

### ProForm 家族

| 组件 | 用途 |
|---|---|
| ProForm | 增强 Form（自动 layout + 提交按钮 + loading） |
| ProFormText | 文本输入 |
| ProFormTextArea | 文本域 |
| ProFormSelect | 下拉选择（支持 request 远程加载） |
| ProFormCheckbox | 复选框 |
| ProFormRadio | 单选 |
| ProFormSwitch | 开关 |
| ProFormDatePicker | 日期 |
| ProFormDateTimePicker | 日期时间 |
| ProFormDateRangePicker | 日期范围 |
| ProFormTimePicker | 时间 |
| ProFormDigit | 数字 |
| ProFormSlider | 滑块 |
| ProFormRate | 评分 |
| ProFormUploadButton | 上传按钮 |
| ProFormUploadDragger | 拖拽上传 |
| ProFormCaptcha | 验证码 |
| ProFormColorPicker | 颜色选择 |
| ProFormMoney | 金额（带千分位 + 货币符号） |
| ProFormDependency | 字段依赖容器 |

### ProForm 布局变种

| 组件 | 用途 |
|---|---|
| ProForm | 默认布局 |
| ProForm.Group | 字段分组 |
| QueryFilter | 查询筛选器（搜索栏） |
| LightFilter | 轻量筛选器 |
| ModalForm | 弹窗表单 |
| DrawerForm | 抽屉表单 |
| StepsForm | 步骤表单 |
| LoginForm | 登录表单（带 logo / 标语 / 第三方登录） |

### ProTable

| 组件 | 用途 |
|---|---|
| ProTable | 增强 Table（自动搜索栏 + 工具栏 + 列设置 + 加载状态） |
| EditableProTable | 可编辑表格 |
| LightFilter（嵌入） | 轻量筛选 |

### 布局组件

| 组件 | 用途 |
|---|---|
| ProLayout | 完整中后台布局（顶栏 + 侧菜单 + 面包屑 + 用户中心） |
| PageContainer | 页面容器（替代 v4 的 PageHeader） |
| ProBreadcrumb | 增强面包屑 |
| GridContent | 栅格内容容器 |

### 展示组件

| 组件 | 用途 |
|---|---|
| ProCard | 增强卡片 |
| ProDescriptions | 增强描述列表 |
| ProList | 增强列表 |
| StatisticCard | 统计卡片 |
| WaterMark | 水印（与 antd Watermark 一致） |

## React 19 兼容性

- **Ant Design 5.20+** 完整支持 React 19
- **Ant Design 6.x** 主要面向 React 19
- React 17 / 16：使用 Ant Design 4.x（不再积极维护）

```bash
# 升级到 React 19 + antd 5.x
pnpm add react@latest react-dom@latest antd@latest
```

## 工具方法 / Hook 速查

```ts
import {
  // 全局
  ConfigProvider,
  theme,
  App,
  version,                                          // antd 版本号字符串

  // Hook（v5 推荐）
  // theme.useToken
  // App.useApp

  // Form 相关
  // Form.useForm
  // Form.useWatch
  // Form.useFormInstance
  // Form.Item.useStatus
  // Form.ErrorList

  // 反馈
  message,
  // message.useMessage
  Modal,
  // Modal.useModal
  notification,
  // notification.useNotification

  // 静态方法
  // ConfigProvider.config
  // ConfigProvider.useConfig

  // 工具
  getDesignToken,
} from 'antd'

import type {
  // 通用工具类型
  GetProps, GetProp, GetRef,

  // 主题
  ThemeConfig, MappingAlgorithm,

  // Form
  FormInstance, FormProps, FormItemProps, FormListProps,
  ValidateMessages, ValidateErrorEntity,

  // Table
  TableColumnsType, TableColumnType, TableProps,
  TableRowSelection, ExpandableConfig,

  // 反馈
  ModalFuncProps, MessageInstance, NotificationInstance,

  // 全局
  ConfigProviderProps, Locale,
} from 'antd'
```

## 相关链接

- [Ant Design 官网](https://ant.design/)
- [中文文档](https://ant.design/index-cn)
- [组件总览](https://ant.design/components/overview-cn/)
- [Theme Editor](https://ant.design/theme-editor-cn)（可视化主题编辑器）
- [Ant Design Charts](https://charts.ant.design/)（数据可视化）
- [Pro Components](https://procomponents.ant.design/)（中后台二次封装）
- [Ant Design Pro](https://pro.ant.design/)（中后台模板，36k Star）
- [GitHub ant-design/ant-design](https://github.com/ant-design/ant-design)（主仓库，98.1k Star）
- [GitHub ant-design/ant-design-icons](https://github.com/ant-design/ant-design-icons)（图标库）
- [GitHub ant-design/pro-components](https://github.com/ant-design/pro-components)
- [GitHub ant-design/nextjs-registry](https://github.com/ant-design/nextjs-registry)（Next.js App Router 集成）
- [GitHub ant-design/cssinjs](https://github.com/ant-design/cssinjs)（v5 CSS-in-JS 底层）
- [async-validator](https://github.com/yiminghe/async-validator)（Form 校验底层）
- [dayjs](https://day.js.org/)（v5 时间库，替换 v4 的 moment.js）
- [v4 → v5 迁移指南](https://ant.design/docs/react/migration-v5-cn)
- [设计价值观](https://ant.design/docs/spec/values-cn)
- [Vite 集成指南](https://ant.design/docs/react/use-with-vite-cn)
- [Next.js 集成指南](https://ant.design/docs/react/use-with-next-cn)
- [SSR 文档](https://ant.design/docs/react/server-side-rendering-cn)
