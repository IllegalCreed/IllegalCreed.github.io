---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 PrimeNG v20（截至 2026 年 5 月 **v20.x**）。本页是**速查工具**——包含 80+ 组件 10 大类列表、常用 props 表、`providePrimeNG` 完整配置选项、`@primeuix/themes` API、`definePreset` / `ConfirmationService` / `MessageService` / `DialogService` 签名、PrimeIcons 常量、PassThrough 速查、TypeScript 类型、`tailwindcss-primeui` 工具类。

## 速查

- **组件命名**：所有 PrimeNG 组件 `p-{kebab-case}` 前缀（`<p-button>` / `<p-table>` / `<p-select>`）—— **InputText / InputNumber 等是指令** 加在原生 `<input>` 上（`<input pInputText>`）
- **Service**：`MessageService` / `ConfirmationService` / `DialogService` / `PrimeNG`（config 服务）—— 各自需要 `providers: [...]` 注册和占位组件
- **核心 TS 类型**：`MenuItem` / `Message` / `Confirmation` / `DynamicDialogConfig` / `DynamicDialogRef` / `TableLazyLoadEvent` / `PassThroughContext`
- **主题预设**：`Aura`（默认） / `Material` / `Lara` / `Nora` —— 从 `@primeuix/themes/xxx` 导入
- **必装包**：`primeng` + `@primeuix/themes` + `primeicons`
- **按需引入**：Angular standalone API、`imports: [ButtonModule]` 按组件 Module 引入
- **Tailwind 集成**：`tailwindcss-primeui` 插件 + v3/v4 配置不同
- **PassThrough**：`[pt]="{ root: 'class', section: { class, style, onclick } }"`

## 80+ 组件分类速查

### Form（表单输入，25+）

| 组件 | 标签/指令 | 常用 props |
|---|---|---|
| InputText | `pInputText` 指令 | `[invalid]` / `[fluid]` / `variant`（outlined/filled） / `size`（small/large） |
| InputNumber | `<p-inputnumber>` | `[(ngModel)]` / `min` / `max` / `step` / `mode`（decimal/currency） / `currency` / `locale` / `minFractionDigits` / `maxFractionDigits` / `showButtons` |
| InputMask | `<p-inputmask>` | `[(ngModel)]` / `mask`（如 `(999) 999-9999`） / `placeholder` / `slotChar` |
| InputOtp | `<p-inputotp>` | `[(ngModel)]` / `length` / `mask` / `integerOnly` |
| InputGroup | `<p-inputgroup>` / `<p-inputgroupaddon>` | 输入框前后缀容器 |
| Password | `<p-password>` | `[(ngModel)]` / `feedback` / `toggleMask` / `promptLabel` / `weakLabel` / `mediumLabel` / `strongLabel` |
| Textarea | `pTextarea` 指令 | `[(ngModel)]` / `rows` / `cols` / `autoResize` |
| Select | `<p-select>` | `[(ngModel)]` / `[options]` / `optionLabel` / `optionValue` / `optionDisabled` / `optionGroupLabel` / `optionGroupChildren` / `[filter]` / `[editable]` / `[checkmark]` / `[showClear]` / `[virtualScrollerOptions]` |
| MultiSelect | `<p-multiselect>` | `[(ngModel)]` / `[options]` / `optionLabel` / `optionValue` / `[filter]` / `display`（comma/chip） / `[showToggleAll]` / `[maxSelectedLabels]` |
| AutoComplete | `<p-autocomplete>` | `[(ngModel)]` / `[suggestions]` / `field` / `optionLabel` / `[multiple]` / `[dropdown]` / `[completeOnFocus]` / `[loading]` / `[delay]` |
| CascadeSelect | `<p-cascadeselect>` | `[(ngModel)]` / `[options]` / `optionLabel` / `optionValue` / `optionGroupLabel` / `optionGroupChildren` |
| TreeSelect | `<p-treeselect>` | `[(ngModel)]` / `[options]` / `selectionMode`（single/multiple/checkbox） |
| Listbox | `<p-listbox>` | `[(ngModel)]` / `[options]` / `optionLabel` / `optionValue` / `[multiple]` / `[filter]` |
| SelectButton | `<p-selectbutton>` | `[(ngModel)]` / `[options]` / `optionLabel` / `[multiple]` |
| ToggleButton | `<p-togglebutton>` | `[(ngModel)]` / `onLabel` / `offLabel` / `onIcon` / `offIcon` |
| Checkbox | `<p-checkbox>` | `[(ngModel)]` / `[value]` / `[binary]` / `[name]` / `[indeterminate]` / `[invalid]` |
| RadioButton | `<p-radiobutton>` | `[(ngModel)]` / `[value]` / `[name]` |
| ToggleSwitch | `<p-toggleswitch>` | `[(ngModel)]` / `[trueValue]` / `[falseValue]` |
| Slider | `<p-slider>` | `[(ngModel)]` / `min` / `max` / `step` / `[range]` / `orientation`（horizontal/vertical） |
| Rating | `<p-rating>` | `[(ngModel)]` / `[stars]` / `[cancel]` / `[readonly]` |
| DatePicker | `<p-datepicker>` | `[(ngModel)]` / `selectionMode`（single/range/multiple） / `[showTime]` / `[showSeconds]` / `hourFormat` / `dateFormat` / `minDate` / `maxDate` / `[inline]` / `[showButtonBar]` / `view`（date/month/year） / `[numberOfMonths]` |
| Knob | `<p-knob>` | `[(ngModel)]` / `min` / `max` / `step` / `size` / `strokeWidth` / `valueColor` |
| ColorPicker | `<p-colorpicker>` | `[(ngModel)]` / `format`（hex/rgb/hsb） / `[inline]` |
| FloatLabel | `<p-floatlabel>` | `variant`（in/out） |
| IftaLabel | `<p-iftalabel>` | （无 props，纯包装） |
| IconField / InputIcon | `<p-iconfield>` / `<p-inputicon>` | `iconPosition`（left/right） |
| Editor | `<p-editor>` | `[(ngModel)]` / `[readonly]` / `editorStyle` / `[formats]` |

### Button（按钮，4）

| 组件 | 标签 | 常用 props |
|---|---|---|
| Button | `<p-button>` | `label` / `icon` / `iconPos`（left/right/top/bottom） / `severity`（primary/secondary/success/info/warn/danger/contrast） / `size`（small/large） / `[rounded]` / `[outlined]` / `[text]` / `[raised]` / `[link]` / `[loading]` / `[disabled]` / `[fluid]` / `badge` |
| ButtonGroup | `<p-buttongroup>` | 按钮组容器 |
| SpeedDial | `<p-speeddial>` | `[model]`（MenuItem 数组） / `type`（linear/circle/semi-circle/quarter-circle） / `direction` / `radius` |
| SplitButton | `<p-splitbutton>` | `label` / `icon` / `[model]`（下拉项） / `severity` |

### Data（数据展示，13+）

| 组件 | 标签 | 常用 props |
|---|---|---|
| Table | `<p-table>` | `[value]` / `[paginator]` / `[rows]` / `[rowsPerPageOptions]` / `[totalRecords]` / `[lazy]` / `[loading]` / `selectionMode`（single/multiple/checkbox） / `dataKey` / `sortMode`（single/multiple） / `[filters]` / `filterDisplay`（menu/row） / `[expandedRowKeys]` / `editMode`（cell/row） / `[virtualScroll]` / `[virtualScrollItemSize]` / `scrollHeight` / `[scrollable]` |
| DataView | `<p-dataview>` | `[value]` / `layout`（grid/list） / `[paginator]` / `[rows]` / `sortField` / `sortOrder` |
| Tree | `<p-tree>` | `[value]` / `selectionMode` / `[selectionKeys]` / `[expandedKeys]` / `[loading]` / `[filter]` / `filterMode` |
| TreeTable | `<p-treetable>` | `[value]` / `[paginator]` / `selectionMode` / `[expandedKeys]` / `[loading]` |
| Timeline | `<p-timeline>` | `[value]` / `align`（left/right/top/bottom/alternate） / `layout`（vertical/horizontal） |
| OrganizationChart | `<p-organizationchart>` | `[value]` / `[selectionKeys]` / `selectionMode` / `[collapsible]` |
| Paginator | `<p-paginator>` | `[rows]` / `[totalRecords]` / `[first]` / `[rowsPerPageOptions]` / `[template]` |
| PickList | `<p-picklist>` | `[source]` / `[target]` / `dataKey` / `[showSourceControls]` / `[showTargetControls]` |
| OrderList | `<p-orderlist>` | `[(ngModel)]` / `dataKey` / `[responsiveOptions]` |
| VirtualScroller | `<p-virtualscroller>` | `[items]` / `itemSize` / `scrollHeight` / `[lazy]` / `[delay]` / `[loading]` / `orientation` |

### Panel（容器，10+）

| 组件 | 标签 | 常用 props |
|---|---|---|
| Accordion | `<p-accordion>` / `<p-accordion-panel>` / `<p-accordion-header>` / `<p-accordion-content>` | `[(value)]` / `[multiple]` / `expandIcon` / `collapseIcon` |
| Card | `<p-card>` | （无 props，用 ng-template：title / subtitle / header / content / footer） |
| Divider | `<p-divider>` | `align`（left/right/center） / `layout`（horizontal/vertical） / `type`（solid/dashed/dotted） |
| Fieldset | `<p-fieldset>` | `legend` / `[toggleable]` / `[collapsed]` |
| Panel | `<p-panel>` | `header` / `[toggleable]` / `[collapsed]` |
| ScrollPanel | `<p-scrollpanel>` | `[style]` |
| Splitter | `<p-splitter>` / `<p-splitterpanel>` | `layout`（horizontal/vertical） / `gutterSize` / `stateKey` |
| Stepper | `<p-stepper>` / `<p-step>` / `<p-step-list>` / `<p-step-panels>` / `<p-step-panel>` | `[(value)]` / `[linear]` |
| Tabs | `<p-tabs>` / `<p-tablist>` / `<p-tab>` / `<p-tabpanels>` / `<p-tabpanel>` | `[(value)]` / `[scrollable]` |
| Toolbar | `<p-toolbar>` | （ng-template：start / center / end） |

### Overlay（弹层，7）

| 组件 | 标签 | 常用 props |
|---|---|---|
| ConfirmDialog | `<p-confirmdialog>` | `key`（多实例区分） |
| ConfirmPopup | `<p-confirmpopup>` | `key` |
| Dialog | `<p-dialog>` | `[(visible)]` / `header` / `[modal]` / `[closable]` / `[dismissableMask]` / `[maximizable]` / `position`（center/top/bottom/left/right/topleft/topright/bottomleft/bottomright） / `[blockScroll]` / `[draggable]` / `[style]` |
| Drawer | `<p-drawer>` | `[(visible)]` / `header` / `position`（left/right/top/bottom/full） / `[modal]` / `[dismissible]` |
| DynamicDialog | `<p-dynamicdialog>` | （通过 DialogService 控制） |
| Popover | `<p-popover>` | `[dismissable]` / `appendTo`（body/self） / `[breakpoints]` |
| Tooltip | `pTooltip` 指令 | `tooltipPosition`（top/bottom/left/right） / `tooltipEvent`（hover/focus） / `tooltipStyleClass` |

### File（文件，1）

| 组件 | 标签 | 常用 props |
|---|---|---|
| FileUpload | `<p-fileupload>` | `url` / `mode`（advanced/basic） / `[multiple]` / `accept` / `[maxFileSize]` / `[fileLimit]` / `[withCredentials]` / `[headers]` / `[auto]` / `chooseLabel` / `uploadLabel` / `cancelLabel` / `name`（请求字段名） |

### Menu（菜单导航，10+）

| 组件 | 标签 | 常用 props |
|---|---|---|
| Breadcrumb | `<p-breadcrumb>` | `[model]`（MenuItem 数组） / `[home]`（MenuItem） |
| Dock | `<p-dock>` | `[model]` / `position`（top/bottom/left/right） |
| Menu | `<p-menu>` | `[model]` / `[popup]` |
| Menubar | `<p-menubar>` | `[model]` |
| MegaMenu | `<p-megamenu>` | `[model]` |
| PanelMenu | `<p-panelmenu>` | `[model]` |
| Steps | `<p-steps>` | `[model]` / `[(activeIndex)]` / `[readonly]` |
| TabMenu | `<p-tabmenu>` | `[model]` / `[(activeItem)]` |
| TieredMenu | `<p-tieredmenu>` | `[model]` |
| ContextMenu | `<p-contextmenu>` | `[model]` / `[target]` |

### Chart（图表，1）

| 组件 | 标签 | 常用 props |
|---|---|---|
| Chart | `<p-chart>` | `type`（bar/line/pie/doughnut/polarArea/radar/scatter/bubble） / `[data]` / `[options]` / `[plugins]` |

### Messages（消息反馈，3）

| 组件 | 标签 | 常用 props |
|---|---|---|
| Message | `<p-message>` | `severity`（success/info/warn/error/secondary/contrast） / `text` / `icon` / `size`（small/large） / `variant`（outlined/simple） |
| Toast | `<p-toast>` | `key` / `position`（top-left/top-center/top-right/bottom-left/bottom-center/bottom-right/center） / `[baseZIndex]` / `[autoZIndex]` |
| InlineMessage | `<p-inline-message>` | 同 Message |

### Media（媒体，4）

| 组件 | 标签 | 常用 props |
|---|---|---|
| Carousel | `<p-carousel>` | `[value]` / `[numVisible]` / `[numScroll]` / `[responsiveOptions]` / `[circular]` / `[autoplayInterval]` |
| Galleria | `<p-galleria>` | `[value]` / `[(activeIndex)]` / `[responsiveOptions]` / `[showThumbnails]` / `[fullScreen]` |
| Image | `<p-image>` | `src` / `alt` / `[preview]` / `imageStyle` |
| ImageCompare | `<p-imagecompare>` | `leftImage` / `rightImage` / `[fluid]` |

### Misc（杂项，10+）

| 组件 | 标签 | 常用 props |
|---|---|---|
| AnimateOnScroll | `pAnimateOnScroll` 指令 | `enterClass` / `leaveClass` |
| Avatar / AvatarGroup | `<p-avatar>` / `<p-avatar-group>` | `image` / `icon` / `label` / `shape`（circle/square） / `size`（normal/large/xlarge） |
| Badge | `<p-badge>` | `value` / `severity` / `size` |
| BlockUI | `<p-blockui>` | `[(blocked)]` / `[target]` |
| Chip | `<p-chip>` | `label` / `icon` / `image` / `[removable]` |
| Inplace | `<p-inplace>` | `[(active)]` / `closable` |
| MeterGroup | `<p-metergroup>` | `[value]` / `[max]` / `[min]` / `orientation` / `labelPosition` |
| ProgressBar | `<p-progressbar>` | `[value]` / `mode`（determinate/indeterminate） / `[showValue]` |
| ProgressSpinner | `<p-progressspinner>` | `[style]` / `[strokeWidth]` |
| ScrollTop | `<p-scrolltop>` | `target`（window/parent） / `[threshold]` |
| Skeleton | `<p-skeleton>` | `shape`（rectangle/circle） / `size` / `width` / `height` / `borderRadius` |
| Tag | `<p-tag>` | `value` / `severity` / `icon` / `[rounded]` |
| Terminal | `<p-terminal>` | `welcomeMessage` / `prompt` |

## providePrimeNG 完整配置

### 基础结构

```ts
import { providePrimeNG } from 'primeng/config'
import Aura from '@primeuix/themes/aura'

providePrimeNG({
  ripple: true,                                 // 启用 ripple 动画
  inputStyle: 'outlined',                       // outlined / filled
  inputVariant: 'outlined',                     // outlined / filled
  csp: { nonce: 'random-nonce-string' },        // CSP nonce
  filterMode: 'lenient',                        // lenient / strict
  zIndex: {
    modal: 1100,
    overlay: 1000,
    menu: 1000,
    tooltip: 1100,
  },
  translation: {                                // i18n 文本
    accept: '确认',
    reject: '取消',
    // ...
  },
  theme: {
    preset: Aura,
    options: {
      prefix: 'p',                              // CSS 变量前缀（默认 p）
      darkModeSelector: 'system',               // 'system' / '.my-app-dark' / false
      cssLayer: false,                          // 或 { name, order } 对象
    },
  },
  pt: {                                          // 全局 PassThrough
    panel: {
      header: { class: 'bg-primary text-primary-contrast' },
    },
  },
  ptOptions: {
    mergeSections: true,
    mergeProps: true,
  },
})
```

### theme.options 详解

| 选项 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `prefix` | string | `'p'` | CSS 变量前缀（影响 `--p-primary-color` 等） |
| `darkModeSelector` | string \| boolean | `'system'` | 暗色模式选择器 |
| `cssLayer` | boolean \| object | `false` | CSS @layer 配置 |

`cssLayer` 对象形式：

```ts
cssLayer: {
  name: 'primeng',
  order: 'tailwind-base, primeng, tailwind-utilities',
}
```

### zIndex 默认值

```ts
zIndex: {
  modal: 1100,        // dialog / drawer
  overlay: 1000,      // dropdown / popover
  menu: 1000,         // overlay menus
  tooltip: 1100,      // tooltip
}
```

### PrimeNG config service（运行时更新）

```ts
import { inject } from '@angular/core'
import { PrimeNG } from 'primeng/config'

const primeng = inject(PrimeNG)

// 运行时启用 / 禁用 ripple
primeng.ripple.set(true)

// 运行时切换 inputStyle
primeng.inputStyle.set('filled')

// 运行时切换 translation
primeng.setTranslation({ accept: '是', reject: '否' })

// 运行时切换 filterMode
primeng.filterMode.set('strict')
```

## @primeuix/themes API

### 4 大预设 import

```ts
import Aura from '@primeuix/themes/aura'
import Material from '@primeuix/themes/material'
import Lara from '@primeuix/themes/lara'
import Nora from '@primeuix/themes/nora'
```

### definePreset 完整签名

```ts
import { definePreset, updatePreset, updatePrimaryPalette, usePreset, palette } from '@primeuix/themes'

// 1. 定义新 preset（基于已有预设）
const MyPreset = definePreset(Aura, {
  primitive: {
    /* primitive tokens */
  },
  semantic: {
    primary: { 50: '...', 100: '...', /* ... */ 950: '...' },
    colorScheme: {
      light: { surface: { /* ... */ } },
      dark: { surface: { /* ... */ } },
    },
    transitionDuration: '0.2s',
    focusRing: {
      width: '1px',
      style: 'solid',
      color: '{primary.color}',
      offset: '2px',
      shadow: 'none',
    },
    formField: { /* ... */ },
    list: { /* ... */ },
    content: { /* ... */ },
    overlay: { /* ... */ },
    mask: { /* ... */ },
    navigation: { /* ... */ },
  },
  components: {
    button: { /* button-specific tokens */ },
    inputtext: { /* inputtext-specific tokens */ },
    // ... 任意组件
  },
  directives: {
    tooltip: { /* tooltip-specific tokens */ },
  },
})

// 2. 运行时更新 primary 色板（最常用）
updatePrimaryPalette({
  50: '{emerald.50}',
  // ... 完整色阶
})

// 3. 运行时更新整个 preset
updatePreset({
  semantic: { /* ... */ },
})

// 4. 切换 preset
usePreset(MyPreset)

// 5. palette 工具函数（生成 50-950 完整色阶）
const blueShades = palette('#3b82f6')        // 自动生成 50-950
// {
//   50: '#eff6ff', 100: '#dbeafe', ..., 950: '#172554',
// }
```

## ConfirmationService API

```ts
import { ConfirmationService, Confirmation } from 'primeng/api'

interface Confirmation {
  message?: string                              // 提示文本
  key?: string                                  // 多实例区分
  icon?: string                                 // 图标类名（如 'pi pi-info-circle'）
  header?: string                               // 标题
  acceptLabel?: string                          // 确认按钮文本
  rejectLabel?: string                          // 取消按钮文本
  acceptIcon?: string
  rejectIcon?: string
  acceptVisible?: boolean
  rejectVisible?: boolean
  acceptButtonStyleClass?: string               // 确认按钮 class
  rejectButtonStyleClass?: string
  defaultFocus?: 'accept' | 'reject' | 'close' | 'none'
  blockScroll?: boolean
  closeOnEscape?: boolean
  dismissableMask?: boolean
  position?: 'left' | 'right' | 'top' | 'bottom' | 'top-left' | /* ... */
  target?: any                                  // ConfirmPopup 锚点元素
  accept?: () => void                           // 用户确认回调
  reject?: () => void                           // 用户取消回调
}

const confirmationService = inject(ConfirmationService)
confirmationService.confirm(confirmation: Confirmation)
confirmationService.close()                     // 关闭当前对话框
```

## MessageService API

```ts
import { MessageService, Message } from 'primeng/api'

interface Message {
  severity?: 'success' | 'info' | 'warn' | 'error' | 'secondary' | 'contrast'
  summary?: string                              // 标题
  detail?: string                               // 详情
  id?: any
  key?: string                                  // 多实例区分
  life?: number                                 // 自动关闭毫秒（默认 3000）
  sticky?: boolean                              // 不自动关闭
  closable?: boolean
  data?: any                                    // 自定义数据
  icon?: string
  contentStyleClass?: string
  styleClass?: string
}

const messageService = inject(MessageService)

// 添加单条
messageService.add(message: Message)

// 添加多条
messageService.addAll(messages: Message[])

// 清空所有
messageService.clear()

// 清空特定 key
messageService.clear('myKey')
```

## DialogService API

```ts
import { DialogService, DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog'

interface DynamicDialogConfig {
  header?: string
  data?: any                                    // 传给子组件 config.data
  inputValues?: { [key: string]: any }         // Angular 14+ 输入绑定
  width?: string                                // 如 '50vw' / '800px'
  height?: string
  closeOnEscape?: boolean
  dismissableMask?: boolean
  closable?: boolean
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right' | /* ... */
  draggable?: boolean
  resizable?: boolean
  contentStyle?: { [key: string]: string }
  baseZIndex?: number
  autoZIndex?: boolean
  rtl?: boolean
  style?: { [key: string]: string }
  styleClass?: string
  showHeader?: boolean
  maximizable?: boolean
  modal?: boolean
  breakpoints?: { [key: string]: string }       // 响应式 width
  templates?: { /* header/footer/content templates */ }
  duplicate?: boolean
  focusOnShow?: boolean
  appendTo?: any
}

const dialogService = inject(DialogService)
const ref: DynamicDialogRef = dialogService.open(ComponentType, config: DynamicDialogConfig)

// DynamicDialogRef 方法
ref.close(data?: any)                           // 关闭并返回数据
ref.destroy()                                   // 销毁
ref.onClose                                     // Observable<any> 监听关闭
ref.onDestroy                                   // Observable<void>
ref.onMaximize                                  // Observable<void>

// 子组件中注入
@Component({/* ... */})
export class MyDialogContent {
  private ref = inject(DynamicDialogRef)
  config = inject(DynamicDialogConfig)
}
```

## PrimeIcons 常量速查

```ts
import { PrimeIcons } from 'primeng/api'

PrimeIcons.PLUS                     // 'pi pi-plus'
PrimeIcons.MINUS                    // 'pi pi-minus'
PrimeIcons.CHECK                    // 'pi pi-check'
PrimeIcons.TIMES                    // 'pi pi-times'
PrimeIcons.SEARCH                   // 'pi pi-search'
PrimeIcons.USER                     // 'pi pi-user'
PrimeIcons.HOME                     // 'pi pi-home'
PrimeIcons.COG                      // 'pi pi-cog'
PrimeIcons.TRASH                    // 'pi pi-trash'
PrimeIcons.PENCIL                   // 'pi pi-pencil'
PrimeIcons.SAVE                     // 'pi pi-save'
PrimeIcons.SPINNER                  // 'pi pi-spinner'
PrimeIcons.INFO_CIRCLE              // 'pi pi-info-circle'
PrimeIcons.EXCLAMATION_TRIANGLE     // 'pi pi-exclamation-triangle'
PrimeIcons.QUESTION_CIRCLE          // 'pi pi-question-circle'
PrimeIcons.ARROW_UP                 // 'pi pi-arrow-up'
PrimeIcons.ARROW_DOWN               // 'pi pi-arrow-down'
PrimeIcons.CHEVRON_LEFT             // 'pi pi-chevron-left'
PrimeIcons.CHEVRON_RIGHT            // 'pi pi-chevron-right'
PrimeIcons.SIGN_OUT                 // 'pi pi-sign-out'
PrimeIcons.SIGN_IN                  // 'pi pi-sign-in'
PrimeIcons.UPLOAD                   // 'pi pi-upload'
PrimeIcons.DOWNLOAD                 // 'pi pi-download'
PrimeIcons.EYE                      // 'pi pi-eye'
PrimeIcons.EYE_SLASH                // 'pi pi-eye-slash'
PrimeIcons.LOCK                     // 'pi pi-lock'
PrimeIcons.UNLOCK                   // 'pi pi-unlock'
PrimeIcons.REFRESH                  // 'pi pi-refresh'
PrimeIcons.FILTER                   // 'pi pi-filter'
PrimeIcons.SORT                     // 'pi pi-sort'
PrimeIcons.ENVELOPE                 // 'pi pi-envelope'
PrimeIcons.BELL                     // 'pi pi-bell'
PrimeIcons.CLOUD                    // 'pi pi-cloud'
PrimeIcons.FILE                     // 'pi pi-file'
PrimeIcons.FOLDER                   // 'pi pi-folder'
PrimeIcons.STAR                     // 'pi pi-star'
PrimeIcons.STAR_FILL                // 'pi pi-star-fill'
PrimeIcons.HEART                    // 'pi pi-heart'
PrimeIcons.HEART_FILL               // 'pi pi-heart-fill'
```

完整 250+ 图标见 [PrimeIcons 官网](https://primeng.org/icons)。

## Translation 完整数据结构

```ts
interface Translation {
  // 通用
  accept?: string
  reject?: string
  choose?: string
  upload?: string
  cancel?: string
  completed?: string
  pending?: string

  // 文件大小
  fileSizeTypes?: string[]

  // 日历
  dayNames?: string[]
  dayNamesShort?: string[]
  dayNamesMin?: string[]
  monthNames?: string[]
  monthNamesShort?: string[]
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
  dateFormat?: string
  firstDayOfWeek?: number
  today?: string
  weekHeader?: string

  // Password 强度
  weak?: string
  medium?: string
  strong?: string
  passwordPrompt?: string

  // 空状态
  emptyMessage?: string
  emptyFilterMessage?: string
  emptySearchMessage?: string
  emptySelectionMessage?: string

  // 搜索 / 选择
  searchMessage?: string
  selectionMessage?: string

  // Filter
  clear?: string
  apply?: string
  addRule?: string
  removeRule?: string
  matchAll?: string
  matchAny?: string
  startsWith?: string
  contains?: string
  notContains?: string
  endsWith?: string
  equals?: string
  notEquals?: string
  noFilter?: string
  lt?: string
  lte?: string
  gt?: string
  gte?: string
  is?: string
  isNot?: string
  before?: string
  after?: string
  dateIs?: string
  dateIsNot?: string
  dateBefore?: string
  dateAfter?: string

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
    listView?: string
    gridView?: string
    slide?: string
    slideNumber?: string
    zoomImage?: string
    zoomIn?: string
    zoomOut?: string
    rotateRight?: string
    rotateLeft?: string
  }
}
```

## PassThrough 速查

### 通用 section 名称

大部分组件都有 **`root`** 作为顶层元素。其他常见 section：

| 组件 | 常见 sections |
|---|---|
| Panel | `root` / `header` / `headerActions` / `title` / `content` / `footer` / `pcToggleButton` |
| Button | `root` / `label` / `icon` / `pcBadge` |
| Card | `root` / `header` / `body` / `caption` / `title` / `subtitle` / `content` / `footer` |
| Dialog | `root` / `header` / `title` / `headerActions` / `pcCloseButton` / `pcMaximizeButton` / `content` / `footer` |
| Toast | `root` / `message` / `messageContent` / `summary` / `detail` / `messageIcon` / `closeButton` |
| Table | `root` / `table` / `thead` / `tbody` / `tfoot` / `tr` / `headerCell` / `bodyCell` / `paginator` |
| Select | `root` / `dropdown` / `panel` / `list` / `option` / `optionLabel` / `pcFilter` |
| InputText 指令 | `root`（指令直接附加到 `<input>`） |

### PassThrough 类型

```ts
import type { PanelPassThrough } from 'primeng/panel'
import type { ButtonPassThrough } from 'primeng/button'
import type { TablePassThrough } from 'primeng/table'

// 类型支持完整 IDE 自动补全
const pt: ButtonPassThrough = {
  root: '!px-4 !py-3',
  label: '!text-lg',
}
```

### ptOptions 配置

```ts
{
  mergeSections: true,        // 全局 + 组件 pt 合并 section
  mergeProps: true,           // section 内 props 合并
}
```

## TypeScript 核心类型

```ts
// MenuItem（菜单项通用）
import type { MenuItem } from 'primeng/api'

interface MenuItem {
  label?: string
  icon?: string
  command?: (event: { originalEvent: Event; item: MenuItem }) => void
  url?: string
  routerLink?: any
  queryParams?: { [key: string]: any }
  routerLinkActiveOptions?: any
  items?: MenuItem[]                              // 子菜单
  expanded?: boolean
  disabled?: boolean
  visible?: boolean
  target?: string
  escape?: boolean
  separator?: boolean
  badge?: string
  badgeStyleClass?: string
  style?: any
  styleClass?: string
  title?: string
  id?: string
  automationId?: string
  tabindex?: string
  tooltip?: string
  tooltipPosition?: string
}

// Table Lazy Load Event
import type { TableLazyLoadEvent } from 'primeng/table'

interface TableLazyLoadEvent {
  first?: number
  rows?: number
  sortField?: string | string[]
  sortOrder?: number
  filters?: { [s: string]: FilterMetadata | FilterMetadata[] }
  globalFilter?: string
  multiSortMeta?: SortMeta[]
  forceUpdate?: () => void
}

// Filter Metadata
interface FilterMetadata {
  value?: any
  matchMode?: string
  operator?: string
}

// Tree Node（Tree / TreeTable）
interface TreeNode<T = any> {
  label?: string
  data?: T
  icon?: string
  expandedIcon?: string
  collapsedIcon?: string
  children?: TreeNode<T>[]
  leaf?: boolean
  expanded?: boolean
  type?: string
  parent?: TreeNode<T>
  partialSelected?: boolean
  style?: any
  styleClass?: string
  draggable?: boolean
  droppable?: boolean
  selectable?: boolean
  key?: string
  loading?: boolean
}

// Message（Toast）
import type { Message } from 'primeng/api'

interface Message {
  severity?: 'success' | 'info' | 'warn' | 'error' | 'secondary' | 'contrast'
  summary?: string
  detail?: string
  id?: any
  key?: string
  life?: number
  sticky?: boolean
  closable?: boolean
  data?: any
  icon?: string
  contentStyleClass?: string
  styleClass?: string
}

// Confirmation
import type { Confirmation } from 'primeng/api'

interface Confirmation {
  message?: string
  key?: string
  icon?: string
  header?: string
  acceptLabel?: string
  rejectLabel?: string
  acceptIcon?: string
  rejectIcon?: string
  acceptVisible?: boolean
  rejectVisible?: boolean
  acceptButtonStyleClass?: string
  rejectButtonStyleClass?: string
  defaultFocus?: 'accept' | 'reject' | 'close' | 'none'
  blockScroll?: boolean
  closeOnEscape?: boolean
  dismissableMask?: boolean
  position?: string
  target?: any
  accept?: () => void
  reject?: () => void
}

// PassThrough Context
import type { PassThroughContext } from 'primeng/api'

interface PassThroughContext<T = any> {
  instance: T                                   // 组件实例
}
```

## tailwindcss-primeui 工具类

安装后可用以下额外工具类（与 PrimeNG 主题 token 同步）：

### 主色

| 类名 | 说明 |
|---|---|
| `bg-primary` / `bg-primary-50` ~ `bg-primary-950` | 主色背景 |
| `text-primary` / `text-primary-50` ~ `text-primary-950` | 主色文字 |
| `border-primary` / `border-primary-500` | 主色边框 |
| `bg-primary-contrast` / `text-primary-contrast` | 主色对比色（白/黑） |
| `ring-primary` | focus ring |

### Surface（灰阶）

| 类名 | 说明 |
|---|---|
| `bg-surface-0` ~ `bg-surface-950` | 灰阶背景（0 = 白、950 = 黑） |
| `text-surface-0` ~ `text-surface-950` | 灰阶文字 |
| `border-surface-200` / `border-surface-700` | 灰阶边框 |
| `dark:bg-surface-900` | 暗色模式背景 |

### 动画

| 类名 | 说明 |
|---|---|
| `animate-fadein` | 淡入 |
| `animate-fadeout` | 淡出 |
| `animate-slidedown` | 上滑入 |
| `animate-slideup` | 下滑入 |
| `animate-scalein` | 缩放入 |
| `animate-duration-{ms}` | 动画时长 |

### 暗色模式

配合 PrimeNG `darkModeSelector` 一致：

```ts
// providePrimeNG 配置
options: {
  darkModeSelector: '.my-app-dark',
}
```

```js
// tailwind.config.js (v3)
darkMode: ['selector', '[class~="my-app-dark"]'],
```

之后所有 `dark:bg-surface-900` 等类自动跟随。

## 主题预设 import 路径

| 预设 | import | umd | css（v17 旧版） |
|---|---|---|---|
| Aura | `@primeuix/themes/aura` | `@primeuix/themes/umd/aura.js` | 已废弃 |
| Material | `@primeuix/themes/material` | `@primeuix/themes/umd/material.js` | 已废弃 |
| Lara | `@primeuix/themes/lara` | `@primeuix/themes/umd/lara.js` | 已废弃 |
| Nora | `@primeuix/themes/nora` | `@primeuix/themes/umd/nora.js` | 已废弃 |

## 版本对应表

| Angular | PrimeNG | 主题包 |
|---|---|---|
| Angular 20 | **PrimeNG v20** | `@primeuix/themes` |
| Angular 19 | PrimeNG v19 | `@primeng/themes` |
| Angular 18 | PrimeNG v18 | `@primeng/themes` |
| Angular 17 | PrimeNG v17 | 内置 Less |
| Angular &lt;=16 | PrimeNG &lt;=v16 | 内置 Less（NgModule） |

## 与 PrimeVue / PrimeReact 对比

| 维度 | PrimeNG | PrimeVue | PrimeReact |
|---|---|---|---|
| 框架 | Angular 17+ | Vue 3.x | React 17+ |
| 组件命名 | `<p-button>` kebab | `<Button>` Pascal | `<Button>` Pascal |
| 主题包 | `@primeuix/themes` | `@primeuix/themes` | `@primeuix/themes` |
| Form 库 | Angular Reactive Forms | `@primevue/forms` 独立库 | React Hook Form 兼容 |
| 服务 | Angular DI（`ConfirmationService` 等） | Vue Provider（`useToast` 等） | React Context（`ToastContext` 等） |
| Standalone | v17+ 默认 | 都是 SFC | 都是组件 |
| Tailwind 集成 | `tailwindcss-primeui` | `tailwindcss-primeui` | `tailwindcss-primeui` |

> **跨框架共享设计令牌** = 同一 Figma 库可用于三框架项目 —— **PrimeTek 全家桶的核心价值**。
