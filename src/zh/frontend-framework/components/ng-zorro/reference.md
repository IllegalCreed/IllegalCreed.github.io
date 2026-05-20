---
layout: doc
outline: [2, 3]
---

# 参考

NG-ZORRO 70+ 组件 + 400+ Less 变量 + 60+ Locale + NzConfig 全套 API 速查。

## 70+ 组件总览

### General（4）

| 组件 | Selector | Module |
| --- | --- | --- |
| **NzButton** | `[nz-button]` 属性指令 | `NzButtonModule` |
| **NzFloatButton** | `<nz-float-button>` | `NzFloatButtonModule` |
| **NzIcon** | `<nz-icon>` / `[nz-icon]` | `NzIconModule` |
| **NzTypography** | `nz-typography` 系列 | `NzTypographyModule` |

### Layout（6）

| 组件 | Selector | Module |
| --- | --- | --- |
| **NzGrid** | `<nz-row>` / `<nz-col>` | `NzGridModule` |
| **NzFlex** | `<nz-flex>` | `NzFlexModule` |
| **NzLayout** | `<nz-layout>` / `<nz-header>` / `<nz-sider>` / `<nz-content>` / `<nz-footer>` | `NzLayoutModule` |
| **NzSpace** | `<nz-space>` + `*nzSpaceItem` | `NzSpaceModule` |
| **NzDivider** | `<nz-divider>` | `NzDividerModule` |
| **NzSplitter** | `<nz-splitter>` | `NzSplitterModule` |

### Navigation（8）

| 组件 | Selector | Module |
| --- | --- | --- |
| **NzMenu** | `<ul nz-menu>` / `<li nz-menu-item>` / `<li nz-submenu>` | `NzMenuModule` |
| **NzBreadcrumb** | `<nz-breadcrumb>` / `<nz-breadcrumb-item>` | `NzBreadCrumbModule` |
| **NzTabs** | `<nz-tabset>` / `<nz-tab>` | `NzTabsModule` |
| **NzPagination** | `<nz-pagination>` | `NzPaginationModule` |
| **NzSteps** | `<nz-steps>` / `<nz-step>` | `NzStepsModule` |
| **NzAnchor** | `<nz-anchor>` / `<nz-link>` | `NzAnchorModule` |
| **NzDropdown** | `[nz-dropdown]` 指令 | `NzDropDownModule` |
| **NzPageHeader** | `<nz-page-header>` | `NzPageHeaderModule` |

### Data Entry（18）

| 组件 | Selector | Module |
| --- | --- | --- |
| **NzForm** | `<form nz-form>` / `<nz-form-item>` / `<nz-form-label>` / `<nz-form-control>` | `NzFormModule` |
| **NzInput** | `<input nz-input>` 属性指令 + `<nz-input-group>` | `NzInputModule` |
| **NzInputNumber** | `<nz-input-number>` | `NzInputNumberModule` |
| **NzSelect** | `<nz-select>` / `<nz-option>` | `NzSelectModule` |
| **NzAutoComplete** | `<input nz-input [nzAutocomplete]>` + `<nz-autocomplete>` | `NzAutocompleteModule` |
| **NzCascader** | `<nz-cascader>` | `NzCascaderModule` |
| **NzCheckbox** | `[nz-checkbox]` + `<nz-checkbox-group>` / `<nz-checkbox-wrapper>` | `NzCheckboxModule` |
| **NzColorPicker** | `<nz-color-picker>` | `NzColorPickerModule` |
| **NzDatePicker** | `<nz-date-picker>` / `<nz-range-picker>` / `<nz-month-picker>` / `<nz-week-picker>` / `<nz-year-picker>` / `<nz-quarter-picker>` | `NzDatePickerModule` |
| **NzMention** | `<nz-mention>` | `NzMentionModule` |
| **NzRadio** | `[nz-radio]` + `<nz-radio-group>` | `NzRadioModule` |
| **NzRate** | `<nz-rate>` | `NzRateModule` |
| **NzSlider** | `<nz-slider>` | `NzSliderModule` |
| **NzSwitch** | `<nz-switch>` | `NzSwitchModule` |
| **NzTimePicker** | `<nz-time-picker>` | `NzTimePickerModule` |
| **NzTransfer** | `<nz-transfer>` | `NzTransferModule` |
| **NzTreeSelect** | `<nz-tree-select>` | `NzTreeSelectModule` |
| **NzUpload** | `<nz-upload>` | `NzUploadModule` |

### Data Display（21）

| 组件 | Selector | Module |
| --- | --- | --- |
| **NzTable** | `<nz-table>` | `NzTableModule` |
| **NzTree** | `<nz-tree>` | `NzTreeModule` |
| **NzTreeView** | `<nz-tree-view>` | `NzTreeViewModule` |
| **NzList** | `<nz-list>` / `<nz-list-item>` | `NzListModule` |
| **NzCard** | `<nz-card>` / `<nz-card-meta>` / `<nz-card-grid>` / `<nz-card-tab>` | `NzCardModule` |
| **NzDescriptions** | `<nz-descriptions>` / `<nz-descriptions-item>` | `NzDescriptionsModule` |
| **NzStatistic** | `<nz-statistic>` / `<nz-countdown>` | `NzStatisticModule` |
| **NzAvatar** | `<nz-avatar>` / `<nz-avatar-group>` | `NzAvatarModule` |
| **NzBadge** | `<nz-badge>` / `<nz-ribbon>` | `NzBadgeModule` |
| **NzCalendar** | `<nz-calendar>` | `NzCalendarModule` |
| **NzCarousel** | `<nz-carousel>` / `<div nz-carousel-content>` | `NzCarouselModule` |
| **NzCollapse** | `<nz-collapse>` / `<nz-collapse-panel>` | `NzCollapseModule` |
| **NzComment** | `<nz-comment>` | `NzCommentModule` |
| **NzEmpty** | `<nz-empty>` | `NzEmptyModule` |
| **NzImage** | `<img nz-image>` / `[nzImagePreview]` | `NzImageModule` |
| **NzPopover** | `[nz-popover]` 指令 | `NzPopoverModule` |
| **NzQRCode** | `<nz-qrcode>` | `NzQRCodeModule` |
| **NzSegmented** | `<nz-segmented>` | `NzSegmentedModule` |
| **NzTag** | `<nz-tag>` | `NzTagModule` |
| **NzTimeline** | `<nz-timeline>` / `<nz-timeline-item>` | `NzTimelineModule` |
| **NzTooltip** | `[nz-tooltip]` 指令 | `NzToolTipModule` |

### Feedback（10）

| 组件 | Selector / Service | Module |
| --- | --- | --- |
| **NzMessage** | `NzMessageService` 服务 | `NzMessageModule` |
| **NzNotification** | `NzNotificationService` 服务 | `NzNotificationModule` |
| **NzModal** | `<nz-modal>` / `NzModalService` 服务 | `NzModalModule` |
| **NzDrawer** | `<nz-drawer>` / `NzDrawerService` 服务 | `NzDrawerModule` |
| **NzAlert** | `<nz-alert>` | `NzAlertModule` |
| **NzSpin** | `<nz-spin>` | `NzSpinModule` |
| **NzPopconfirm** | `[nz-popconfirm]` 指令 | `NzPopconfirmModule` |
| **NzProgress** | `<nz-progress>` | `NzProgressModule` |
| **NzResult** | `<nz-result>` | `NzResultModule` |
| **NzSkeleton** | `<nz-skeleton>` | `NzSkeletonModule` |

### Other（2）

| 组件 | Selector | Module |
| --- | --- | --- |
| **NzAffix** | `<nz-affix>` | `NzAffixModule` |
| **NzWatermark** | `<nz-watermark>` | `NzWatermarkModule` |

## 常用组件核心 API 速查

### NzButton

```ts
nzType?: 'default' | 'primary' | 'dashed' | 'text' | 'link';   // 默认 default
nzSize?: 'large' | 'default' | 'small';                          // 默认 default
nzShape?: 'circle' | 'round' | null;                             // 默认 null
nzLoading?: boolean;                                              // 默认 false
nzGhost?: boolean;                                                // 默认 false
nzBlock?: boolean;                                                // 默认 false（满宽）
nzDanger?: boolean;                                               // 默认 false（v9+）
```

### NzInput

```ts
// <input nz-input> 属性指令
[nzSize]?: 'large' | 'default' | 'small';
[nzBorderless]?: boolean;                                         // v17+
[nzStatus]?: 'error' | 'warning' | null;                          // v13+
nzAutosize?: boolean | { minRows: number; maxRows: number };     // 自适应高度
nzMaxCharacterCount?: number;
```

### NzForm 表单

```ts
// <form nz-form>
nzLayout?: 'horizontal' | 'vertical' | 'inline';   // 默认 horizontal
nzNoColon?: boolean;                                  // 标签后冒号
nzAutoTips?: { default?: Record<string, string> };   // 全局错误提示

// <nz-form-item>
nzFlex?: boolean;                                     // flex 布局

// <nz-form-label>
nzSpan?: number;                                      // 24 栅格
nzRequired?: boolean;                                 // 红星
nzFor?: string;                                       // 关联 <input id>
nzNoColon?: boolean;
nzTooltipTitle?: string;                              // hover tooltip

// <nz-form-control>
nzSpan?: number;
nzOffset?: number;
nzErrorTip?: string | TemplateRef;
nzSuccessTip?: string | TemplateRef;
nzWarningTip?: string | TemplateRef;
nzValidatingTip?: string | TemplateRef;
nzExtra?: string | TemplateRef;
nzHasFeedback?: boolean;
nzValidateStatus?: 'success' | 'warning' | 'error' | 'validating' | AbstractControl | FormController;
```

### NzTable

```ts
// <nz-table>
[nzData]?: T[];
[nzFrontPagination]?: boolean;             // 默认 true，false 转服务端
[nzTotal]?: number;
[nzPageIndex]?: number;
[nzPageSize]?: number;
[nzPageSizeOptions]?: number[];            // 默认 [10, 20, 30, 40]
[nzShowPagination]?: boolean;              // 默认 true
[nzPaginationPosition]?: 'top' | 'bottom' | 'both';
[nzSize]?: 'default' | 'middle' | 'small';
[nzBordered]?: boolean;
[nzLoading]?: boolean;
[nzScroll]?: { x?: string | null; y?: string | null };
[nzVirtualItemSize]?: number;              // 虚拟滚动行高
[nzVirtualMaxBufferPx]?: number;           // 默认 200
[nzVirtualMinBufferPx]?: number;           // 默认 100

// <th> 排序
[nzSortFn]?: NzTableSortFn<T> | boolean;
[nzSortOrder]?: 'ascend' | 'descend' | null;
[nzSortDirections]?: NzTableSortOrder[];
[nzSortPriority]?: number | boolean;
[nzShowSort]?: boolean;
(nzSortOrderChange)?: EventEmitter;

// <th> 筛选
[nzFilters]?: NzTableFilterList;
[nzFilterFn]?: NzTableFilterFn<T> | boolean;
[nzFilterMultiple]?: boolean;
[nzShowFilter]?: boolean;
(nzFilterChange)?: EventEmitter;

// <th> / <td> 多选 + 展开 + 固定
[nzShowCheckbox]?: boolean;
[(nzChecked)]?: boolean;
[nzShowExpand]?: boolean;
[(nzExpand)]?: boolean;
[nzLeft]?: boolean;
[nzRight]?: boolean;
[nzWidth]?: string;

// 服务端事件
(nzQueryParams)?: EventEmitter<NzTableQueryParams>;
```

### NzModalService API

```ts
class NzModalService {
  create<T, D, R>(config: ModalOptions<T, D, R>): NzModalRef<T, R>;
  confirm<T>(config: ModalOptions<T>): NzModalRef<T>;
  info<T>(config: ModalOptions<T>): NzModalRef<T>;
  success<T>(config: ModalOptions<T>): NzModalRef<T>;
  error<T>(config: ModalOptions<T>): NzModalRef<T>;
  warning<T>(config: ModalOptions<T>): NzModalRef<T>;
  closeAll(): void;
  afterAllClose: Observable<void>;
  openModals: NzModalRef[];
}

interface ModalOptions<T, D, R> {
  nzTitle?: string | TemplateRef;
  nzContent?: string | TemplateRef | Type<T>;
  nzData?: D;                              // 给 Component 传 data
  nzFooter?: string | TemplateRef | ModalButtonOptions[] | null;
  nzWidth?: string | number;               // 默认 520
  nzCentered?: boolean;
  nzClosable?: boolean;
  nzMask?: boolean;
  nzMaskClosable?: boolean;
  nzDraggable?: boolean;
  nzKeyboard?: boolean;                    // ESC 键关闭
  nzOkText?: string;
  nzCancelText?: string;
  nzOkType?: 'primary' | 'default' | ...;
  nzOkDanger?: boolean;
  nzOkLoading?: boolean;
  nzCancelLoading?: boolean;
  nzOnOk?: (instance: T) => boolean | Promise<boolean> | void;
  nzOnCancel?: (instance: T) => void;
  nzZIndex?: number;
  nzAfterOpen?: EventEmitter<void>;
  nzAfterClose?: EventEmitter<R>;
  nzClassName?: string;
  nzStyle?: Record<string, string>;
  nzWrapClassName?: string;
}
```

### NzModalRef API

```ts
class NzModalRef<T, R> {
  componentInstance: T;
  getContentComponent(): T;
  close(result?: R): void;
  destroy(result?: R): void;
  triggerOk(): Promise<void>;
  triggerCancel(): void;
  updateConfig(config: Partial<ModalOptions>): void;
  getState(): NzModalState;
  afterOpen: Observable<void>;
  afterClose: Observable<R>;
}

// 子组件中注入
constructor() {
  const modalRef = inject(NzModalRef);
  const data = inject(NZ_MODAL_DATA);    // 拿父组件传入的 nzData
}
```

### NzMessageService

```ts
class NzMessageService {
  success(content: string, options?: NzMessageDataOptions): NzMessageDataFilled;
  error(content, options?): NzMessageDataFilled;
  info(content, options?): NzMessageDataFilled;
  warning(content, options?): NzMessageDataFilled;
  loading(content, options?): NzMessageDataFilled;
  create(type: NzMessageType, content: string, options?): NzMessageDataFilled;
  remove(messageId?: string): void;
}

interface NzMessageDataOptions {
  nzDuration?: number;                     // 默认 3000ms，0 = 不自动关
  nzAnimate?: boolean;
  nzPauseOnHover?: boolean;
}
```

### NzNotificationService

```ts
class NzNotificationService {
  success(title, content, options?): NzNotificationDataFilled;
  error(title, content, options?): NzNotificationDataFilled;
  info(title, content, options?): NzNotificationDataFilled;
  warning(title, content, options?): NzNotificationDataFilled;
  blank(title, content, options?): NzNotificationDataFilled;
  remove(id?: string): void;
}

interface NzNotificationDataOptions {
  nzPlacement?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
  nzDuration?: number;                     // 默认 4500ms
  nzKey?: string;
  nzClass?: string;
}
```

### NzDrawerService

```ts
class NzDrawerService {
  create<T, D, R>(options: NzDrawerOptions<T, D, R>): NzDrawerRef<T, R>;
}

interface NzDrawerOptions<T, D, R> {
  nzTitle?: string | TemplateRef;
  nzContent?: TemplateRef | Type<T>;
  nzContentParams?: D;                     // 注意：用 nzContentParams 而非 nzData
  nzPlacement?: 'top' | 'right' | 'bottom' | 'left';
  nzWidth?: string | number;
  nzHeight?: string | number;
  nzClosable?: boolean;
  nzMask?: boolean;
  nzMaskClosable?: boolean;
  nzKeyboard?: boolean;
  nzBodyStyle?: Record<string, string>;
  nzWrapClassName?: string;
  nzZIndex?: number;
}
```

### NzIcon

```ts
// <nz-icon>
nzType?: string;                            // 图标名（kebab-case）
nzTheme?: 'outline' | 'fill' | 'twotone'; // 默认 outline
nzSpin?: boolean;                           // 旋转动画
nzRotate?: number;                          // 旋转角度
nzTwotoneColor?: string;                    // twotone 主色
nzIconfont?: string;                        // iconfont.cn 远程图标
```

```ts
// 全局注册
provideNzIcons(icons: IconDefinition[]): EnvironmentProviders;
provideNzIconsPatch(icons: IconDefinition[]): Provider[];  // lazy 路由

// NzIconService
class NzIconService {
  addIcon(...icons: IconDefinition[]): void;
  addIconLiteral(type: string, literal: string): void;     // 自定义 SVG
  fetchFromIconfont(opts: { scriptUrl: string }): void;
  changeAssetsSource(prefix: string): void;
}
```

## Less 变量速查（400+）

### 主色系

```less
@primary-color:         #1677ff;           // 主色
@primary-1:             ~`...`;            // 派生 1-10 级色阶
@primary-2:             ~`...`;
...
@info-color:            #1677ff;           // 信息色
@success-color:         #52c41a;           // 成功色
@warning-color:         #faad14;           // 警告色
@error-color:           #ff4d4f;           // 错误色（v17+）
@link-color:            #1677ff;           // 链接色
@link-hover-color:      color(~`colorPalette(...)`);
@link-active-color:     color(~`colorPalette(...)`);
@processing-color:      @primary-color;
@highlight-color:       @error-color;
```

### 文字 / 标题色

```less
@heading-color:           rgba(0, 0, 0, 0.85);
@heading-color-dark:      rgba(255, 255, 255, 1);
@text-color:              rgba(0, 0, 0, 0.65);
@text-color-secondary:    rgba(0, 0, 0, 0.45);
@text-color-inverse:      #fff;
@text-color-dark:         rgba(255, 255, 255, 0.85);
@text-color-secondary-dark: rgba(255, 255, 255, 0.65);
@disabled-color:          rgba(0, 0, 0, 0.25);
@disabled-color-dark:     rgba(255, 255, 255, 0.35);
@icon-color:              inherit;
@icon-color-hover:        fade(@black, 75%);
```

### 字号

```less
@font-size-base:          14px;
@font-size-lg:            @font-size-base + 2px;   // 16px
@font-size-sm:            12px;
@font-size-xs:            8px;
@font-family:             "Segoe UI", "Helvetica Neue", ...;
@code-family:             Consolas, "Liberation Mono", ...;
@heading-1-size:          ceil(@font-size-base * 2.71); // 38px
@heading-2-size:          ceil(@font-size-base * 2.14); // 30px
@heading-3-size:          ceil(@font-size-base * 1.71); // 24px
@heading-4-size:          ceil(@font-size-base * 1.42); // 20px
@heading-5-size:          ceil(@font-size-base * 1.14); // 16px
```

### 边框 / 圆角

```less
@border-color-base:       hsv(0, 0, 85%);         // #d9d9d9
@border-color-split:      hsv(0, 0, 94%);         // #f0f0f0
@border-color-inverse:    @white;
@border-width-base:       1px;
@border-style-base:       solid;
@border-radius-base:      6px;
@border-radius-sm:        4px;
```

### 间距

```less
@padding-lg:              24px;
@padding-md:              16px;
@padding-sm:              12px;
@padding-xs:              8px;
@padding-xss:             4px;
@margin-lg:               24px;
@margin-md:               16px;
@margin-sm:               12px;
@margin-xs:               8px;
@margin-xss:              4px;
```

### 高度 / 控件

```less
@height-base:             32px;
@height-lg:               40px;
@height-sm:               24px;
@control-padding-horizontal:    @padding-md;
@control-padding-horizontal-sm: @padding-sm;
@control-border-radius:   @border-radius-base;
```

### 阴影

```less
@shadow-color:            rgba(0, 0, 0, 0.15);
@shadow-color-inverse:    @component-background;
@box-shadow-base:
  0 3px 6px -4px rgba(0, 0, 0, 0.12),
  0 6px 16px 0 rgba(0, 0, 0, 0.08),
  0 9px 28px 8px rgba(0, 0, 0, 0.05);
@shadow-1-up:             0 -6px 16px -8px rgba(0, 0, 0, 0.08), ...;
@shadow-1-down:           0 6px 16px -8px rgba(0, 0, 0, 0.08), ...;
@shadow-1-left:           -6px 0 16px -8px rgba(0, 0, 0, 0.08), ...;
@shadow-1-right:          6px 0 16px -8px rgba(0, 0, 0, 0.08), ...;
@shadow-2:                0 6px 16px 0 rgba(0, 0, 0, 0.08), ...;
```

### 动画

```less
@animation-duration-slow:   0.3s;
@animation-duration-base:   0.2s;
@animation-duration-fast:   0.1s;
@ease-base-out:             cubic-bezier(0.7, 0.3, 0.1, 1);
@ease-base-in:              cubic-bezier(0.9, 0, 0.3, 0.7);
@ease-out:                  cubic-bezier(0.215, 0.61, 0.355, 1);
@ease-in:                   cubic-bezier(0.55, 0.055, 0.675, 0.19);
@ease-in-out:               cubic-bezier(0.645, 0.045, 0.355, 1);
```

### Z-index

```less
@zindex-table-fixed:      2;
@zindex-affix:            10;
@zindex-back-top:         10;
@zindex-badge:            10;
@zindex-picker-panel:     10;
@zindex-popup-close:      10;
@zindex-modal:            1000;
@zindex-modal-mask:       1000;
@zindex-message:          1010;
@zindex-notification:     1010;
@zindex-popover:          1030;
@zindex-dropdown:         1050;
@zindex-picker:           1050;
@zindex-popoconfirm:      1060;
@zindex-tooltip:          1070;
```

### 表单

```less
@form-item-margin-bottom:   24px;
@form-item-trailing-colon:  true;
@form-vertical-label-padding: 0 0 8px;
@form-vertical-label-margin: 0;
@label-required-color:      @highlight-color;
@label-color:               @heading-color;
```

完整 400+ 变量见 [github.com/NG-ZORRO/ng-zorro-antd/blob/master/components/style/themes/default.less](https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/components/style/themes/default.less)。

## CSS Variables 速查（实验）

引入 `ng-zorro-antd.variable.min.css` 后可用：

```css
:root {
  /* 主色 */
  --ant-primary-color: #1677ff;
  --ant-primary-color-hover: #4096ff;
  --ant-primary-color-active: #0958d9;
  --ant-primary-color-outline: rgba(22, 119, 255, 0.2);

  /* 颜色 */
  --ant-info-color: #1677ff;
  --ant-success-color: #52c41a;
  --ant-warning-color: #faad14;
  --ant-error-color: #ff4d4f;

  /* 文字 */
  --ant-heading-color: rgba(0, 0, 0, 0.85);
  --ant-text-color: rgba(0, 0, 0, 0.65);
  --ant-text-color-secondary: rgba(0, 0, 0, 0.45);
  --ant-disabled-color: rgba(0, 0, 0, 0.25);
}
```

> CSS Variables 主题仍是 Experimental——生产慎用。

## NzConfig 完整结构

```ts
interface NzConfig {
  affix?: { nzOffsetBottom?: number; nzOffsetTop?: number };
  alert?: { nzCloseable?: boolean; nzShowIcon?: boolean };
  anchor?: { nzBounds?: number; nzOffsetTop?: number; nzShowInkInFixed?: boolean };
  autocomplete?: { nzBackfill?: boolean; nzWidth?: number };
  avatar?: { nzShape?: 'circle' | 'square'; nzSize?: NzSizeLDSType | number; nzGap?: number };
  backTop?: { nzVisibilityHeight?: number; nzDuration?: number };
  badge?: { nzColor?: string; nzShowZero?: boolean };
  breadcrumb?: { nzSeparator?: string };
  button?: { nzSize?: NzSizeLDSType };
  calendar?: { nzMode?: 'month' | 'year' };
  card?: { nzSize?: NzSizeDSType; nzHoverable?: boolean };
  carousel?: { nzAutoPlay?: boolean; nzDots?: boolean; nzEffect?: 'scrollx' | 'fade' };
  cascader?: { nzSize?: NzSizeLDSType; nzAllowClear?: boolean };
  codeEditor?: { nzDefaultOptions?: NzCodeEditorOption; nzUseStaticLoading?: boolean; nzOnLoad?: () => void };
  collapse?: { nzAccordion?: boolean; nzBordered?: boolean; nzExpandIconPosition?: 'left' | 'right' };
  collapsePanel?: { nzShowArrow?: boolean };
  comment?: { /* ... */ };
  datePicker?: { nzFormat?: string; nzMode?: 'date' | 'month' | 'year'; nzAllowClear?: boolean; nzInputReadOnly?: boolean };
  descriptions?: { nzBordered?: boolean; nzColon?: boolean; nzSize?: NzSizeMDSType };
  drawer?: { nzMask?: boolean; nzMaskClosable?: boolean; nzCloseIcon?: TemplateRef; nzCloseOnNavigation?: boolean };
  dropDown?: { /* ... */ };
  empty?: { nzDefaultEmptyContent?: TemplateRef };
  flex?: { /* ... */ };
  floatButton?: { /* ... */ };
  form?: { nzNoColon?: boolean; nzAutoTips?: { default?: Record<string, string> }; nzDisableAutoTips?: boolean };
  icon?: { nzTwotoneColor?: string };
  image?: { nzFallback?: string; nzPlaceholder?: TemplateRef };
  input?: { nzSize?: NzSizeLDSType; nzAutoSize?: boolean };
  inputNumber?: { nzSize?: NzSizeLDSType };
  layout?: { /* ... */ };
  list?: { nzBordered?: boolean; nzSize?: NzSizeMDSType };
  menu?: { nzInlineIndent?: number; nzTriggerSubMenuAction?: 'hover' | 'click' };
  message?: { nzAnimate?: boolean; nzDuration?: number; nzMaxStack?: number; nzPauseOnHover?: boolean; nzTop?: number | string };
  modal?: { nzMask?: boolean; nzMaskClosable?: boolean; nzCloseOnNavigation?: boolean };
  notification?: { nzPlacement?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'; nzTop?: number | string; nzBottom?: number | string; nzDuration?: number; nzMaxStack?: number; nzPauseOnHover?: boolean };
  pagination?: { nzShowSizeChanger?: boolean; nzPageSize?: number; nzShowQuickJumper?: boolean };
  popconfirm?: { nzAutoFocus?: 'ok' | 'cancel' | null; nzColor?: string };
  popover?: { nzColor?: string; nzMouseEnterDelay?: number; nzMouseLeaveDelay?: number };
  progress?: { nzShowInfo?: boolean; nzStrokeColor?: string };
  qrCode?: { nzColor?: string; nzBgColor?: string };
  rate?: { nzAllowClear?: boolean; nzAllowHalf?: boolean };
  result?: { nzIcon?: TemplateRef };
  segmented?: { /* ... */ };
  select?: { nzBackdrop?: boolean; nzSize?: NzSizeLDSType; nzShowArrow?: boolean; nzSuffixIcon?: string | TemplateRef };
  skeleton?: { /* ... */ };
  slider?: { /* ... */ };
  space?: { nzAlign?: 'start' | 'end' | 'center' | 'baseline'; nzSize?: NzSpaceSize };
  spin?: { nzIndicator?: TemplateRef };
  splitter?: { /* ... */ };
  statistic?: { /* ... */ };
  steps?: { nzSize?: 'default' | 'small' };
  switch?: { /* ... */ };
  table?: { nzSize?: 'default' | 'middle' | 'small'; nzShowQuickJumper?: boolean; nzShowSizeChanger?: boolean; nzPageSizeOptions?: number[] };
  tabs?: { nzAnimated?: boolean | { inkBar: boolean; tabPane: boolean }; nzSize?: NzSizeLDSType };
  tag?: { /* ... */ };
  timePicker?: { nzFormat?: string };
  timeline?: { /* ... */ };
  theme?: { primaryColor?: string };  // CSS Variables 实验主题
  tooltip?: { nzColor?: string; nzMouseEnterDelay?: number; nzMouseLeaveDelay?: number };
  transfer?: { /* ... */ };
  tree?: { nzBlockNode?: boolean; nzShowIcon?: boolean };
  treeSelect?: { /* ... */ };
  typography?: { /* ... */ };
  upload?: { nzShowUploadList?: boolean; nzDirectory?: boolean; nzWithCredentials?: boolean };
}

// 类型工具
type NzSizeLDSType = 'large' | 'default' | 'small';
type NzSizeMDSType = 'middle' | 'default' | 'small';
type NzSizeDSType = 'default' | 'small';
```

## i18n 60+ Locale 速查

```ts
import {
  // 中文
  zh_CN, zh_HK, zh_TW,
  // 英文
  en_US, en_GB, en_AU,
  // 亚洲
  ja_JP, ko_KR,
  th_TH, vi_VN, hi_IN, id_ID, ms_MY, bn_BD,
  // 欧洲
  de_DE, fr_FR, fr_BE, fr_CA, es_ES, it_IT, pt_BR, pt_PT,
  nl_BE, nl_NL, pl_PL, ru_RU, sv_SE, tr_TR, uk_UA,
  da_DK, fi_FI, nb_NO, cs_CZ, sk_SK, hr_HR, ro_RO,
  bg_BG, el_GR, hu_HU, sl_SI, sr_RS, lv_LV, lt_LT, et_EE,
  // 中东
  ar_EG, fa_IR, he_IL, ur_PK,
  // 其他
  ka_GE, hy_AM, mn_MN, kmr_IQ, kk_KZ
} from 'ng-zorro-antd/i18n';
```

### 运行时切换

```ts
class NzI18nService {
  setLocale(locale: NzI18nInterface): void;
  getLocale(): NzI18nInterface;
  setDateLocale(locale: dateFns.Locale): void;
  getDateLocale(): dateFns.Locale | null;
  localeChange: Observable<NzI18nInterface>;
}
```

## ng add / ng generate Schematic 全表

### ng add ng-zorro-antd 选项

```bash
ng add ng-zorro-antd \
  --theme=false \              # 是否生成自定义 theme.less
  --i18n=zh_CN \                # locale code
  --animations=true \           # 注入 provideAnimationsAsync
  --gestures=false \            # 注入 hammerjs（部分组件需要）
  --template=blank \            # blank | sidemenu
  --dynamic-icon=true           # 动态图标加载
```

### ng generate 模板

```bash
ng generate ng-zorro-antd:dashboard <name>
ng generate ng-zorro-antd:form <name>
ng generate ng-zorro-antd:form-normal-login <name>
ng generate ng-zorro-antd:form-step-register <name>
ng generate ng-zorro-antd:list <name>
ng generate ng-zorro-antd:tree-view <name>
ng generate ng-zorro-antd:sidemenu <name>
```

## 核心 TypeScript 类型

```ts
import {
  NzSafeAny,                // 等价 any，但语义化（NG-ZORRO 内部使用）
  NzSizeLDSType,            // 'large' | 'default' | 'small'
  NzSizeMDSType,            // 'middle' | 'default' | 'small'
  NzSizeDSType,             // 'default' | 'small'
  NzStatus,                 // 'error' | 'warning' | null
  NzValidateStatus,         // 'success' | 'warning' | 'error' | 'validating'
  NzFormatEmitEvent,        // Tree 等组件统一事件类型
  NzShape,                  // 'circle' | 'square' | 'round'
  NzType,                   // 通用 type 联合
  NzPlacementType,          // 'top' | 'right' | 'bottom' | 'left' 等
  NzDirectionVHType,        // 'horizontal' | 'vertical'
  NzDirectionVHIType,       // 'horizontal' | 'vertical' | 'inline'
  NzBreakpoint,             // 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'
  NzVariantsType,           // 'outlined' | 'borderless' | 'filled' | 'underlined'
} from 'ng-zorro-antd/core/types';

import { NzTableQueryParams, NzTableSortFn, NzTableFilterFn, NzTableFilterList } from 'ng-zorro-antd/table';
import { NzMessageDataOptions, NzMessageType } from 'ng-zorro-antd/message';
import { NzNotificationDataOptions } from 'ng-zorro-antd/notification';
import { ModalOptions, NzModalRef, NZ_MODAL_DATA, NzModalState } from 'ng-zorro-antd/modal';
import { NzDrawerOptions, NzDrawerRef, NZ_DRAWER_DATA } from 'ng-zorro-antd/drawer';
import { NzConfig, NzConfigKey } from 'ng-zorro-antd/core/config';
import { NzI18nInterface, NZ_DATE_LOCALE, NZ_I18N } from 'ng-zorro-antd/i18n';
import { NzUploadFile, NzUploadXHRArgs, NzUploadChangeParam } from 'ng-zorro-antd/upload';
import { NzTreeNode, NzTreeNodeOptions } from 'ng-zorro-antd/tree';
import { NzCascaderOption } from 'ng-zorro-antd/cascader';
import { NzMenuModeType, NzMenuThemeType } from 'ng-zorro-antd/menu';
```

### 表格高频类型

```ts
// nzQueryParams 事件类型
interface NzTableQueryParams {
  pageIndex: number;
  pageSize: number;
  sort: Array<{ key: string; value: 'ascend' | 'descend' | null }>;
  filter: Array<{ key: string; value: NzSafeAny }>;
}

// 排序函数
type NzTableSortFn<T> = (a: T, b: T, sortOrder?: NzTableSortOrder) => number;

// 排序方向
type NzTableSortOrder = 'ascend' | 'descend' | null;

// 筛选项
interface NzTableFilter {
  text: string;
  value: NzSafeAny;
  byDefault?: boolean;
  children?: NzTableFilter[];
}

type NzTableFilterList = NzTableFilter[];

// 筛选函数
type NzTableFilterFn<T> = (values: NzSafeAny[], item: T) => boolean;
```

### Form 高频类型

```ts
import { FormBuilder, FormGroup, FormControl, FormArray, Validators } from '@angular/forms';

// 严格类型 FormGroup
interface UserForm {
  email: string;
  password: string;
  remember: boolean;
}

const fb = inject(FormBuilder);
const form: FormGroup<{
  email: FormControl<string>;
  password: FormControl<string>;
  remember: FormControl<boolean>;
}> = fb.nonNullable.group({
  email: ['', [Validators.required, Validators.email]],
  password: ['', [Validators.required, Validators.minLength(6)]],
  remember: [true]
});
```

## 4 套内置主题文件

| 文件 | 含义 | 引入方式 |
| --- | --- | --- |
| `ng-zorro-antd/ng-zorro-antd.min.css` | 默认（蓝） | `angular.json` styles |
| `ng-zorro-antd/ng-zorro-antd.dark.min.css` | 暗色 | `angular.json` styles |
| `ng-zorro-antd/ng-zorro-antd.compact.min.css` | 紧凑 | `angular.json` styles |
| `ng-zorro-antd/ng-zorro-antd.aliyun.min.css` | 阿里云（橘） | `angular.json` styles |
| `ng-zorro-antd/ng-zorro-antd.variable.min.css` | CSS Variables（实验） | `angular.json` styles |

Less 入口：

| 文件 | 含义 |
| --- | --- |
| `ng-zorro-antd/ng-zorro-antd.less` | 默认主题 Less 入口 |
| `ng-zorro-antd/ng-zorro-antd.dark.less` | 暗色 Less 入口 |
| `ng-zorro-antd/ng-zorro-antd.compact.less` | 紧凑 Less 入口 |
| `ng-zorro-antd/ng-zorro-antd.aliyun.less` | 阿里云 Less 入口 |

## 版本兼容矩阵

| Angular | NG-ZORRO | Node.js | TypeScript |
| --- | --- | --- | --- |
| 17.x | 17.x | >= 18.13 | 5.2+ |
| 18.x | 18.x | >= 18.19 / >= 20.11 | 5.4+ |
| 19.x | 19.x | >= 18.19 / >= 20.11 / >= 22.0 | 5.5+ |
| 20.x | 20.x | >= 20.11 / >= 22.0 | 5.6+ |
| 21.x | 21.x | >= 20.19 / >= 22.12 / >= 24.0 | 5.6+ |

跨 major 升级：`ng update @angular/core @angular/cli ng-zorro-antd` 一条命令搞定。

## 资源链接

### 官方文档

- [中文文档首页](https://ng.ant.design/docs/introduce/zh)
- [组件总览](https://ng.ant.design/components/overview/zh)
- [开始使用](https://ng.ant.design/docs/getting-started/zh)
- [定制主题](https://ng.ant.design/docs/customize-theme/zh)
- [Dynamic Theme（实验）](https://ng.ant.design/docs/customize-theme-variable/zh)
- [国际化](https://ng.ant.design/docs/i18n/zh)
- [全局配置](https://ng.ant.design/docs/global-config/zh)
- [Schematics](https://ng.ant.design/docs/schematics/zh)
- [v21 升级](https://ng.ant.design/docs/migration-v21/zh)
- [FAQ](https://ng.ant.design/docs/faq/zh)

### 生态

- [GitHub - NG-ZORRO/ng-zorro-antd](https://github.com/NG-ZORRO/ng-zorro-antd)（主仓库）
- [@ant-design/icons-angular](https://github.com/ant-design/ant-design-icons)（图标库）
- [ng-alain](https://ng-alain.com/)（中后台脚手架）
- [Angular 框架](https://angular.dev/)
- [Ant Design 设计规范](https://ant.design/docs/spec/values-cn)

### 中文社区

- [NG-ZORRO 官方 QQ 群 / Discord](https://ng.ant.design/docs/contributing/zh)
- [Stack Overflow `ng-zorro-antd` 标签](https://stackoverflow.com/questions/tagged/ng-zorro-antd)
- [GitHub Discussions](https://github.com/NG-ZORRO/ng-zorro-antd/discussions)
- [掘金 NG-ZORRO 标签](https://juejin.cn/tag/NG-ZORRO)

## 回到目录

- [总览](./index.md)：定位 / 评价 / 对比
- [入门](./getting-started.md)：从零集成 + 第一个组件
- [指南](./guide-line.md)：70+ 组件 + 表单 + 表格 + 主题 + i18n + SSR + 踩坑
