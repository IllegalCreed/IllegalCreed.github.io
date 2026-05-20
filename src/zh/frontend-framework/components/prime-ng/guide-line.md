---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 PrimeNG v20（截至 2026 年 5 月 **v20.x**）。包含 80+ 组件 10 大类速览、Form 组件深度（含 Angular Reactive Forms 完整集成）、DataTable 深度（lazy load + virtual scroll + 行编辑）、Theming 4 大预设 + `definePreset` 深度、Styled vs Unstyled Mode 对比、Tailwind 集成（v3 / v4 双版本 + cssLayer）、PassThrough (`pt`) 深度、`ConfirmationService` / `MessageService` / `DialogService` 完整 API、Locale 与 SSR、常见踩坑。

## 速查

- **组件 10 大类**：Form（25+）+ Button（4）+ Data（13+）+ Panel（10+）+ Overlay（7）+ File（1）+ Menu（10+）+ Chart（1）+ Messages（3）+ Media（4）+ Misc（10+）= **80+ 组件**
- **Form 核心**：`<form [formGroup]="exampleForm">` + `<input pInputText formControlName="username" [invalid]="isInvalid('username')" />` + `<p-message severity="error" />`
- **DataTable 核心**：`<p-table [value]="rows" [paginator]="true" [rows]="10">` + `<ng-template #header>` + `<ng-template #body let-rowData>` —— **列定义用 `<ng-template>` 模板（与 Angular Material `<ng-container matColumnDef>` 类似）**
- **反馈三件套**：`MessageService.add({...})`（消息）/ `ConfirmationService.confirm({...})`（确认）/ `DialogService.open(Component, {...})`（动态组件对话框）—— **每个都要 providers + 占位组件 + inject 三步**
- **主题**：`providePrimeNG({ theme: { preset: Aura, options: { darkModeSelector: '.dark', cssLayer: false } } })`
- **自定义**：`definePreset(Aura, { semantic: { primary: { ... } } })`
- **Tailwind 集成**：`pnpm add -D tailwindcss-primeui` + Tailwind v4 `@import "tailwindcss-primeui"` / Tailwind v3 在 `tailwind.config` 加 plugin
- **PassThrough**：`<p-button [pt]="{ root: '!px-4 !py-3', label: '!text-lg' }" />`
- **Unstyled**：`providePrimeNG({ theme: { preset: Aura, options: { ... } } })` 配合 `[unstyled]="true"` 单组件 / 全局
- **必须**：`provideAnimationsAsync()` + `providePrimeNG({ theme })` 注册 + 在 `styles.scss` 导入 `primeicons/primeicons.css`

## 80+ 组件 10 大类速览

PrimeNG 把所有组件分为 **10 大类** —— 熟悉分类有助于快速定位：

### Form（表单输入，25+）

所有输入类组件都在这里 —— PrimeNG 组件数最多的一类：

| 组件 | 用途 |
|---|---|
| InputText | 单行输入（指令 `pInputText` 加到原生 input） |
| InputNumber | 数字输入（含 currency / 步进 / 精度） |
| InputMask | 输入掩码（电话 / 邮编 / 信用卡） |
| InputOtp | 验证码输入框 |
| InputGroup / InputGroupAddon | 输入框组（前后缀） |
| Password | 密码输入（含强度提示 / toggleMask） |
| Textarea | 多行文本（指令 `pTextarea`） |
| Select | 单选下拉（v18 重命名，原 Dropdown） |
| MultiSelect | 多选下拉 |
| AutoComplete | 自动补全（含远程搜索 / 多选 / chip） |
| CascadeSelect | 级联下拉 |
| TreeSelect | 树形下拉 |
| Listbox | 列表选择框 |
| SelectButton | 单选按钮组 |
| ToggleButton | 切换按钮 |
| Checkbox | 复选框 |
| RadioButton | 单选 |
| ToggleSwitch | 开关（v18 重命名，原 InputSwitch） |
| Slider | 滑块 |
| Rating | 星级评分 |
| DatePicker | 日期选择（v18 重命名，原 Calendar） |
| Knob | 旋钮数值控件（圆形拖拽） |
| ColorPicker | 颜色选择器（含 hex / hsl / rgb） |
| FloatLabel | 浮动标签包装器 |
| IftaLabel | IFTA 标签包装器（v18 新增） |
| IconField / InputIcon | 输入框图标包装器 |
| Editor | 富文本编辑器（基于 Quill.js） |

### Button（按钮，4）

| 组件 | 用途 |
|---|---|
| Button | 基础按钮（含 severity / size / rounded / outlined / text / loading） |
| ButtonGroup | 按钮组（视觉合并） |
| SpeedDial | 悬浮快速操作按钮（FAB） |
| SplitButton | 拆分按钮（主操作 + 下拉菜单） |

### Data（数据展示，13+）

| 组件 | 用途 |
|---|---|
| Table | **重型表格**（lazy load + virtual scroll + 行编辑 + 列冻结 + CSV 导出） |
| DataView | 数据视图（grid / list 切换） |
| Tree | 树（含 lazy load / 多选 / 拖拽） |
| TreeTable | 树形表格（合并 Tree + Table） |
| Timeline | 时间线 |
| OrganizationChart | 组织架构图（PrimeNG 独有） |
| Paginator | 分页器 |
| PickList | 双面板拣选 |
| OrderList | 排序列表 |
| VirtualScroller | 虚拟滚动容器 |
| Carousel | 走马灯（也归 Media） |

### Panel（容器，10+）

| 组件 | 用途 |
|---|---|
| Accordion | 折叠面板 |
| Card | 卡片 |
| Divider | 分割线 |
| Fieldset | 字段集 |
| Panel | 面板（带 header / 收起） |
| ScrollPanel | 自定义滚动 |
| Splitter | 分隔器（可拖拽调整比例） |
| Stepper | 步骤条（带内容） |
| Tabs | 标签页（v18 改名，原 TabView） |
| Toolbar | 工具栏（start / center / end 三段） |

### Overlay（弹层，7）

| 组件 | 用途 |
|---|---|
| ConfirmDialog | 确认对话框（配合 ConfirmationService） |
| ConfirmPopup | 确认气泡（轻量版） |
| Dialog | 模态对话框 |
| Drawer | 抽屉（v18 重命名，原 Sidebar） |
| DynamicDialog | 动态对话框（命令式打开 Angular 组件） |
| Popover | 弹出气泡（v18 重命名，原 OverlayPanel） |
| Tooltip | 文字提示（指令 `pTooltip`） |

### File（文件，1）

| 组件 | 用途 |
|---|---|
| FileUpload | 文件上传（含拖拽 / 进度 / 多文件） |

### Menu（菜单导航，10+）

| 组件 | 用途 |
|---|---|
| Breadcrumb | 面包屑 |
| Dock | Dock 栏（Mac 风格） |
| Menu | 简单菜单 |
| Menubar | 顶部菜单栏（支持子菜单） |
| MegaMenu | 大型菜单（多列） |
| PanelMenu | 折叠侧边菜单 |
| Steps | 简单步骤条 |
| TabMenu | 标签菜单（无内容） |
| TieredMenu | 多级菜单 |
| ContextMenu | 右键菜单 |

### Chart（图表，1）

| 组件 | 用途 |
|---|---|
| Chart | 图表包装器（基于 [Chart.js](https://www.chartjs.org/)） |

### Messages（消息反馈，3）

| 组件 / API | 用途 |
|---|---|
| Message | 内联消息条 |
| Toast | 顶部 / 角落消息（配合 MessageService） |
| Inline Message | 内联提示（v18 合并到 Message） |

### Media（媒体，4）

| 组件 | 用途 |
|---|---|
| Carousel | 走马灯 |
| Galleria | 图库（含缩略图 / 全屏） |
| Image | 图片（含 zoom 预览） |
| ImageCompare | 图片对比（左右滑动） |

### Misc（杂项，10+）

| 组件 | 用途 |
|---|---|
| AnimateOnScroll | 滚动入场动画指令 |
| Avatar / AvatarGroup | 头像 |
| Badge | 角标 |
| BlockUI | 块级遮罩 |
| Chip | 芯片标签 |
| Inplace | 就地编辑 |
| MeterGroup | 多指标进度条（PrimeNG 独有） |
| ProgressBar | 进度条 |
| ProgressSpinner | 加载旋钮 |
| ScrollTop | 回到顶部 |
| Skeleton | 骨架屏 |
| Tag | 标签 |
| Terminal | 终端模拟 |

## Form 表单深度

PrimeNG 不像 PrimeVue 有独立的 `@primevue/forms`，而是**与 Angular Reactive Forms 深度集成** —— `FormGroup` / `FormControl` + `formControlName` 标准 Angular 表单 API。

### 基础 Reactive Form

```ts
import { Component, inject } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { InputTextModule } from 'primeng/inputtext'
import { MessageModule } from 'primeng/message'
import { ButtonModule } from 'primeng/button'

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, MessageModule, ButtonModule],
  template: `
    <form [formGroup]="exampleForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-4 w-full sm:w-56">
      <div class="flex flex-col gap-1">
        <input
          pInputText
          type="text"
          id="username"
          placeholder="用户名"
          formControlName="username"
          [invalid]="isInvalid('username')"
        />
        @if (isInvalid('username')) {
          <p-message severity="error" size="small" variant="simple">用户名必填</p-message>
        }
      </div>

      <div class="flex flex-col gap-1">
        <input
          pInputText
          type="email"
          id="email"
          placeholder="邮箱"
          formControlName="email"
          [invalid]="isInvalid('email')"
        />
        @if (isInvalid('email')) {
          @if (exampleForm.get('email')?.errors?.['required']) {
            <p-message severity="error" size="small" variant="simple">邮箱必填</p-message>
          }
          @if (exampleForm.get('email')?.errors?.['email']) {
            <p-message severity="error" size="small" variant="simple">请输入合法邮箱</p-message>
          }
        }
      </div>

      <p-button type="submit" label="登录" severity="secondary" />
    </form>
  `,
})
export class LoginFormComponent {
  private fb = inject(FormBuilder)

  exampleForm = this.fb.group({
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
  })

  isInvalid(controlName: string): boolean {
    const control = this.exampleForm.get(controlName)
    return !!(control?.invalid && (control.dirty || control.touched))
  }

  onSubmit() {
    if (this.exampleForm.valid) {
      console.log('表单值：', this.exampleForm.value)
    } else {
      this.exampleForm.markAllAsTouched()
    }
  }
}
```

> **关键概念**：
>
> 1. **`pInputText` 是指令**（不是组件标签），加到原生 `<input>` 上、不要写 `<p-inputtext>`
> 2. **`[invalid]="true"`** 让输入框变红 —— 用 PrimeNG 提供的标准错误样式
> 3. **`@if` 是 Angular 17+ 内置控制流**（不需要 `*ngIf`）
> 4. Angular Reactive Forms 是标准 API，PrimeNG 只是 wrap 视觉、**没有专属表单库**（与 PrimeVue `@primevue/forms` 不同）

### Select 单选下拉

```ts
import { Component, inject } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { SelectModule } from 'primeng/select'
import { MessageModule } from 'primeng/message'
import { ButtonModule } from 'primeng/button'

interface City {
  name: string
  code: string
}

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, SelectModule, MessageModule, ButtonModule],
  template: `
    <form [formGroup]="exampleForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-4 w-full sm:w-56">
      <div class="flex flex-col gap-1">
        <p-select
          formControlName="selectedCity"
          [options]="cities"
          [invalid]="isInvalid('selectedCity')"
          optionLabel="name"
          placeholder="选择城市"
          class="w-full md:w-56"
        />
        @if (isInvalid('selectedCity')) {
          <p-message severity="error" size="small" variant="simple">城市必填</p-message>
        }
      </div>
      <p-button type="submit" label="提交" severity="secondary" />
    </form>
  `,
})
export class SelectFormComponent {
  private fb = inject(FormBuilder)

  cities: City[] = [
    { name: '北京', code: 'BJ' },
    { name: '上海', code: 'SH' },
    { name: '广州', code: 'GZ' },
    { name: '深圳', code: 'SZ' },
  ]

  exampleForm = this.fb.group({
    selectedCity: [null as City | null, Validators.required],
  })

  isInvalid(controlName: string): boolean {
    const control = this.exampleForm.get(controlName)
    return !!(control?.invalid && (control.dirty || control.touched))
  }

  onSubmit() {
    if (this.exampleForm.valid) {
      console.log('选中：', this.exampleForm.value.selectedCity)
    }
  }
}
```

### MultiSelect 多选

```html
<form [formGroup]="exampleForm" (ngSubmit)="onSubmit()" class="flex justify-center flex-col gap-4 w-full md:w-80">
  <div class="flex flex-col gap-1">
    <p-multiselect
      [options]="cities"
      formControlName="city"
      optionLabel="name"
      placeholder="选择城市（多选）"
      [maxSelectedLabels]="3"
      [fluid]="true"
      [invalid]="isInvalid('city')"
    />
    @if (isInvalid('city')) {
      <p-message severity="error" size="small" variant="simple">城市必填</p-message>
    }
  </div>
  <p-button type="submit" label="提交" />
</form>
```

### DatePicker 日期选择

```html
<form [formGroup]="exampleForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-4">
  <div class="flex flex-col gap-1">
    <p-datepicker
      formControlName="selectedDate"
      [invalid]="isInvalid('selectedDate')"
      [showButtonBar]="true"
      dateFormat="yy-mm-dd"
    />
    @if (isInvalid('selectedDate')) {
      <p-message severity="error" size="small" variant="simple">日期必填</p-message>
    }
  </div>
  <p-button type="submit" label="提交" />
</form>
```

### Checkbox 复选框组

```ts
import { Component, inject } from '@angular/core'
import { FormBuilder, ReactiveFormsModule } from '@angular/forms'
import { CheckboxModule } from 'primeng/checkbox'
import { MessageModule } from 'primeng/message'
import { ButtonModule } from 'primeng/button'

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, CheckboxModule, MessageModule, ButtonModule],
  template: `
    <form [formGroup]="exampleForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-4">
      <div class="flex flex-wrap gap-4">
        @for (item of formKeys; track item) {
          <div class="flex items-center gap-2">
            <p-checkbox
              [formControlName]="item"
              [binary]="true"
              [inputId]="item"
              [invalid]="isInvalid(item)"
            />
            <label [for]="item">{{ item | titlecase }}</label>
          </div>
        }
      </div>
      @if (hasAnyInvalid()) {
        <p-message severity="error" size="small" variant="simple">至少选择一项</p-message>
      }
      <p-button type="submit" label="提交" severity="secondary" />
    </form>
  `,
})
export class CheckboxFormComponent {
  private fb = inject(FormBuilder)

  formKeys = ['cheese', 'tomato', 'lettuce', 'onion']

  exampleForm = this.fb.group({
    cheese: [false],
    tomato: [false],
    lettuce: [false],
    onion: [false],
  })

  isInvalid(name: string) {
    const c = this.exampleForm.get(name)
    return !!(c?.invalid && (c.dirty || c.touched))
  }

  hasAnyInvalid() {
    return !Object.values(this.exampleForm.value).some(v => v === true)
  }

  onSubmit() {
    console.log(this.exampleForm.value)
  }
}
```

### 表单常用 props 速查

| 组件 | 关键 props |
|---|---|
| `pInputText` 指令 | `[invalid]` / `[fluid]` / `variant`（outlined/filled） / `size`（small/large） |
| `<p-select>` | `[options]` / `optionLabel` / `optionValue` / `[filter]` / `[showClear]` / `[checkmark]` / `placeholder` |
| `<p-multiselect>` | `[options]` / `optionLabel` / `[filter]` / `display`（comma/chip） / `[maxSelectedLabels]` |
| `<p-datepicker>` | `[showButtonBar]` / `[showTime]` / `dateFormat` / `selectionMode`（single/range/multiple） / `[showIcon]` |
| `<p-checkbox>` | `[binary]` / `[value]` / `[name]` / `[inputId]` |
| `<p-radiobutton>` | `[value]` / `[name]` / `[inputId]` |

## Table 数据表深度

PrimeNG `<p-table>` 是业内功能最齐全的 Angular DataTable —— **lazy load + virtual scroll + 行编辑 + 列冻结 + CSV 导出 + 状态持久化** 一站式。

### 基础 + 分页 + 排序 + 全局搜索

```ts
import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { TableModule } from 'primeng/table'
import { ButtonModule } from 'primeng/button'
import { InputTextModule } from 'primeng/inputtext'
import { IconFieldModule } from 'primeng/iconfield'
import { InputIconModule } from 'primeng/inputicon'
import { TagModule } from 'primeng/tag'

interface Product {
  id: string
  code: string
  name: string
  price: number
  category: string
  inventoryStatus: 'INSTOCK' | 'LOWSTOCK' | 'OUTOFSTOCK'
}

@Component({
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule,
    InputTextModule, IconFieldModule, InputIconModule, TagModule,
  ],
  template: `
    <p-table
      #dt
      [value]="products"
      [rows]="10"
      [paginator]="true"
      [globalFilterFields]="['name', 'category', 'inventoryStatus']"
      [tableStyle]="{ 'min-width': '75rem' }"
      [(selection)]="selectedProducts"
      [rowHover]="true"
      dataKey="id"
      currentPageReportTemplate="显示第 {first} 到 {last} 条，共 {totalRecords} 条"
      [showCurrentPageReport]="true"
    >
      <ng-template #caption>
        <div class="flex items-center justify-between">
          <h5 class="m-0">商品管理</h5>
          <p-iconfield>
            <p-inputicon class="pi pi-search" />
            <input
              pInputText
              type="text"
              (input)="dt.filterGlobal($any($event.target).value, 'contains')"
              placeholder="搜索..."
            />
          </p-iconfield>
        </div>
      </ng-template>

      <ng-template #header>
        <tr>
          <th style="width: 3rem">
            <p-tableHeaderCheckbox />
          </th>
          <th pSortableColumn="code" style="min-width: 8rem">
            <div class="flex items-center gap-2">
              编号 <p-sortIcon field="code" />
            </div>
          </th>
          <th pSortableColumn="name" style="min-width: 12rem">
            <div class="flex items-center gap-2">
              名称 <p-sortIcon field="name" />
            </div>
          </th>
          <th pSortableColumn="price" style="min-width: 8rem">
            <div class="flex items-center gap-2">
              价格 <p-sortIcon field="price" />
            </div>
          </th>
          <th pSortableColumn="category" style="min-width: 10rem">
            <div class="flex items-center gap-2">
              分类 <p-sortIcon field="category" />
            </div>
          </th>
          <th pSortableColumn="inventoryStatus" style="min-width: 8rem">
            <div class="flex items-center gap-2">
              库存 <p-sortIcon field="inventoryStatus" />
            </div>
          </th>
          <th style="min-width: 8rem">操作</th>
        </tr>
      </ng-template>

      <ng-template #body let-product>
        <tr>
          <td>
            <p-tableCheckbox [value]="product" />
          </td>
          <td>{{ product.code }}</td>
          <td>{{ product.name }}</td>
          <td>{{ product.price | currency: 'CNY' }}</td>
          <td>{{ product.category }}</td>
          <td>
            <p-tag
              [value]="product.inventoryStatus"
              [severity]="getSeverity(product.inventoryStatus)"
            />
          </td>
          <td>
            <p-button icon="pi pi-pencil" [rounded]="true" [outlined]="true" class="mr-2" (onClick)="edit(product)" />
            <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (onClick)="delete(product)" />
          </td>
        </tr>
      </ng-template>
    </p-table>
  `,
})
export class ProductTableComponent implements OnInit {
  products: Product[] = []
  selectedProducts: Product[] = []

  ngOnInit() {
    // 模拟数据加载
    this.products = [
      { id: '1', code: 'P001', name: 'iPhone 17', price: 6999, category: '手机', inventoryStatus: 'INSTOCK' },
      { id: '2', code: 'P002', name: 'MacBook Pro', price: 14999, category: '电脑', inventoryStatus: 'LOWSTOCK' },
      { id: '3', code: 'P003', name: 'AirPods Pro', price: 1999, category: '配件', inventoryStatus: 'OUTOFSTOCK' },
    ]
  }

  getSeverity(status: string): 'success' | 'warn' | 'danger' {
    if (status === 'INSTOCK') return 'success'
    if (status === 'LOWSTOCK') return 'warn'
    return 'danger'
  }

  edit(product: Product) {
    console.log('edit:', product)
  }

  delete(product: Product) {
    console.log('delete:', product)
  }
}
```

> **关键概念**：
>
> 1. **`pSortableColumn` 指令 + `<p-sortIcon>` 配套** 启用列排序
> 2. **`<p-tableHeaderCheckbox>` + `<p-tableCheckbox>`** 配套实现多选
> 3. **`[(selection)]="selectedProducts"`** 双向绑定选中行（`dataKey="id"` 用于追踪唯一标识）
> 4. **`globalFilterFields`** 声明哪些字段参与全局搜索
> 5. **`dt.filterGlobal(value, 'contains')`** 触发全局搜索（通过 `#dt` 模板引用变量）
> 6. **`<ng-template #caption>` / `<ng-template #header>` / `<ng-template #body>`** 是 PrimeNG Table 的三大插槽

### Lazy Load + Virtual Scroll（大数据量必备）

```html
<p-table
  [columns]="cols"
  [value]="virtualCars"
  [scrollable]="true"
  scrollHeight="400px"
  [rows]="100"
  [virtualScroll]="true"
  [virtualScrollItemSize]="46"
  [lazy]="true"
  (onLazyLoad)="loadCarsLazy($event)"
>
  <ng-template #header let-columns>
    <tr>
      <th *ngFor="let col of columns" style="width: 20%;">
        {{ col.header }}
      </th>
    </tr>
  </ng-template>
  <ng-template #body let-rowData let-columns="columns">
    <tr style="height:46px">
      <td *ngFor="let col of columns">
        {{ rowData[col.field] }}
      </td>
    </tr>
  </ng-template>
  <ng-template #loadingbody let-columns="columns">
    <tr style="height:46px">
      <td *ngFor="let col of columns; let even = even">
        <p-skeleton [ngStyle]="{ 'width': even ? '40%' : '60%' }" />
      </td>
    </tr>
  </ng-template>
</p-table>
```

```ts
import type { TableLazyLoadEvent } from 'primeng/table'

loadCarsLazy(event: TableLazyLoadEvent) {
  // 从后端按 event.first / event.rows 取数据
  this.loading = true
  this.api.fetchCars({
    skip: event.first,
    take: event.rows,
    sortField: event.sortField,
    sortOrder: event.sortOrder,
    filters: event.filters,
  }).subscribe(response => {
    this.virtualCars = response.data
    this.totalRecords = response.total
    this.loading = false
  })
}
```

> **关键点**：
>
> 1. **`virtualScrollItemSize` 必须与 `<tr>` 的实际高度一致** —— 不一致会闪烁
> 2. **`<ng-template #loadingbody>`** 在 lazy load 期间显示骨架屏 —— 用户体验更好
> 3. **`onLazyLoad` 事件** 在初始加载 + 滚动 + 排序 + 筛选时触发 —— 服务端实现统一接口

### 行编辑

```html
<p-table
  [value]="products"
  dataKey="id"
  editMode="row"
  [tableStyle]="{ 'min-width': '50rem' }"
>
  <ng-template #header>
    <tr>
      <th style="width:22%">编号</th>
      <th style="width:22%">名称</th>
      <th style="width:22%">库存</th>
      <th style="width:22%">价格</th>
      <th style="width:12%"></th>
    </tr>
  </ng-template>

  <ng-template #body let-product let-editing="editing" let-ri="rowIndex">
    <tr [pEditableRow]="product">
      <td>
        <p-cellEditor>
          <ng-template #input>
            <input pInputText type="text" [(ngModel)]="product.code" />
          </ng-template>
          <ng-template #output>
            {{ product.code }}
          </ng-template>
        </p-cellEditor>
      </td>

      <td>
        <p-cellEditor>
          <ng-template #input>
            <input pInputText type="text" [(ngModel)]="product.name" required />
          </ng-template>
          <ng-template #output>
            {{ product.name }}
          </ng-template>
        </p-cellEditor>
      </td>

      <td>
        <p-cellEditor>
          <ng-template #input>
            <p-select
              [options]="statuses"
              appendTo="body"
              [(ngModel)]="product.inventoryStatus"
              [style]="{ width: '100%' }"
            />
          </ng-template>
          <ng-template #output>
            <p-tag [value]="product.inventoryStatus" [severity]="getSeverity(product.inventoryStatus)" />
          </ng-template>
        </p-cellEditor>
      </td>

      <td>
        <p-cellEditor>
          <ng-template #input>
            <input pInputText type="number" [(ngModel)]="product.price" />
          </ng-template>
          <ng-template #output>
            {{ product.price | currency: 'CNY' }}
          </ng-template>
        </p-cellEditor>
      </td>

      <td>
        <div class="flex items-center justify-center gap-2">
          @if (!editing) {
            <button
              pButton
              pRipple
              type="button"
              pInitEditableRow
              icon="pi pi-pencil"
              (click)="onRowEditInit(product)"
              [text]="true"
              [rounded]="true"
              severity="secondary"
            ></button>
          } @else {
            <button
              pButton
              pRipple
              type="button"
              pSaveEditableRow
              icon="pi pi-check"
              (click)="onRowEditSave(product)"
              [text]="true"
              [rounded]="true"
              severity="secondary"
            ></button>
            <button
              pButton
              pRipple
              type="button"
              pCancelEditableRow
              icon="pi pi-times"
              (click)="onRowEditCancel(product, ri)"
              [text]="true"
              [rounded]="true"
              severity="secondary"
            ></button>
          }
        </div>
      </td>
    </tr>
  </ng-template>
</p-table>
```

```ts
clonedProducts: { [s: string]: Product } = {}

onRowEditInit(product: Product) {
  this.clonedProducts[product.id] = { ...product }
}

onRowEditSave(product: Product) {
  if (product.price > 0) {
    delete this.clonedProducts[product.id]
    // 保存到后端
    this.api.update(product).subscribe()
  } else {
    // 价格非法，提示用户
  }
}

onRowEditCancel(product: Product, index: number) {
  // 还原数据
  this.products[index] = this.clonedProducts[product.id]
  delete this.clonedProducts[product.id]
}
```

> **关键指令**：
>
> - `[pEditableRow]` 把某行标记为可编辑
> - `<p-cellEditor>` + `<ng-template #input>` / `<ng-template #output>` 切换编辑 / 显示状态
> - `pInitEditableRow` / `pSaveEditableRow` / `pCancelEditableRow` 是按钮上的指令、自动触发编辑 / 保存 / 取消

### 列冻结 + 列调整

```html
<p-table
  [value]="customers"
  [columns]="cols"
  [resizableColumns]="true"
  columnResizeMode="expand"
  [scrollable]="true"
  scrollHeight="400px"
  showGridlines
>
  <ng-template #colgroup let-columns>
    <colgroup>
      <col *ngFor="let col of columns">
    </colgroup>
  </ng-template>

  <ng-template #header let-columns>
    <tr>
      <th *ngFor="let col of columns" [pSortableColumn]="col.field" pResizableColumn>
        {{ col.header }}
        <p-sortIcon [field]="col.field" />
      </th>
    </tr>
  </ng-template>

  <ng-template #body let-rowData let-columns="columns">
    <tr>
      <td *ngFor="let col of columns">
        {{ rowData[col.field] }}
      </td>
    </tr>
  </ng-template>
</p-table>
```

> **关键**：`[resizableColumns]="true"` 启用列拖拽调整 + `columnResizeMode="expand"`（撑开表格） / `"fit"`（按比例分配）。

## Theming 深度

PrimeNG v20 主题系统基于 **`@primeuix/themes`** —— 与 PrimeVue 4 / PrimeReact 共享同一份设计令牌底层。

### Design Token 三层架构

```
┌──────────────────────────────────────────────┐
│ Primitive Tokens                             │
│ 颜色 / 间距 / 字号原子值                       │
│ blue.50 / blue.100 / ... / blue.950          │
│ zinc.50 / spacing.4 / fontSize.lg            │
└──────────────────────────────────────────────┘
                    │
                    ▼ 引用
┌──────────────────────────────────────────────┐
│ Semantic Tokens                              │
│ 语义化令牌                                    │
│ primary.color / surface.50 / focus.ring      │
│ colorScheme.light / colorScheme.dark         │
└──────────────────────────────────────────────┘
                    │
                    ▼ 引用
┌──────────────────────────────────────────────┐
│ Component Tokens                             │
│ 组件级令牌                                    │
│ button.primary.background                     │
│ inputtext.background / panel.header.color    │
└──────────────────────────────────────────────┘
```

### 4 大预设详细对比

| 预设 | 描述 | import 路径 |
|---|---|---|
| **Aura** | PrimeTek 官方现代设计愿景 | `@primeuix/themes/aura` |
| Material | Google Material Design v2 | `@primeuix/themes/material` |
| Lara | Bootstrap 风格 | `@primeuix/themes/lara` |
| Nora | 传统企业应用 | `@primeuix/themes/nora` |

### definePreset 基础

```ts
// src/app/mypreset.ts
import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'

export const MyPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{indigo.50}',
      100: '{indigo.100}',
      200: '{indigo.200}',
      300: '{indigo.300}',
      400: '{indigo.400}',
      500: '{indigo.500}',
      600: '{indigo.600}',
      700: '{indigo.700}',
      800: '{indigo.800}',
      900: '{indigo.900}',
      950: '{indigo.950}',
    },
  },
})
```

> `{indigo.50}` 是 **primitive token 引用** —— Token 系统会解析为实际颜色值。

### 改主色 + 改 surface（灰阶）

```ts
import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'

export const MyPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '{zinc.50}',
          100: '{zinc.100}',
          200: '{zinc.200}',
          300: '{zinc.300}',
          400: '{zinc.400}',
          500: '{zinc.500}',
          600: '{zinc.600}',
          700: '{zinc.700}',
          800: '{zinc.800}',
          900: '{zinc.900}',
          950: '{zinc.950}',
        },
      },
      dark: {
        surface: {
          0: '#ffffff',
          50: '{slate.50}',
          100: '{slate.100}',
          200: '{slate.200}',
          300: '{slate.300}',
          400: '{slate.400}',
          500: '{slate.500}',
          600: '{slate.600}',
          700: '{slate.700}',
          800: '{slate.800}',
          900: '{slate.900}',
          950: '{slate.950}',
        },
      },
    },
  },
})
```

### 组件级令牌

```ts
import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'

export const MyPreset = definePreset(Aura, {
  components: {
    button: {
      colorScheme: {
        light: {
          primary: {
            background: '{indigo.500}',
            hoverBackground: '{indigo.600}',
            color: '#ffffff',
          },
        },
        dark: {
          primary: {
            background: '{indigo.400}',
            hoverBackground: '{indigo.300}',
            color: '#0f172a',
          },
        },
      },
      borderRadius: '8px',
    },
    inputtext: {
      colorScheme: {
        light: {
          background: '#ffffff',
          borderColor: '{zinc.300}',
          focusBorderColor: '{indigo.500}',
        },
      },
    },
  },
})
```

### 运行时切换主题

```ts
import { Component, inject } from '@angular/core'
import { ButtonModule } from 'primeng/button'
import { updatePreset, updatePrimaryPalette } from '@primeuix/themes'

@Component({
  standalone: true,
  imports: [ButtonModule],
  template: `
    <p-button label="改为绿色主题" (onClick)="changeToGreen()" />
    <p-button label="改为红色主题" (onClick)="changeToRed()" />
  `,
})
export class ThemeSwitcherComponent {
  changeToGreen() {
    updatePrimaryPalette({
      50: '{emerald.50}',
      100: '{emerald.100}',
      200: '{emerald.200}',
      300: '{emerald.300}',
      400: '{emerald.400}',
      500: '{emerald.500}',
      600: '{emerald.600}',
      700: '{emerald.700}',
      800: '{emerald.800}',
      900: '{emerald.900}',
      950: '{emerald.950}',
    })
  }

  changeToRed() {
    updatePreset({
      semantic: {
        primary: {
          50: '{red.50}',
          // ... 完整色阶
          500: '{red.500}',
          // ...
        },
      },
    })
  }
}
```

> `updatePrimaryPalette` 只改主色、`updatePreset` 改整个 preset。

## Styled vs Unstyled Mode

PrimeNG 支持两种渲染模式 —— **Styled**（默认，用内置 token 主题） vs **Unstyled**（关闭所有样式、配合 Tailwind 等完全自由）。

### Styled Mode（默认）

```ts
providePrimeNG({
  theme: { preset: Aura },
})
```

组件自带完整样式 —— 开箱即用。

### Unstyled Mode（全局）

```ts
providePrimeNG({
  theme: { preset: Aura },
  // 配置项 unstyled 实际通过组件 [unstyled]="true" 控制
  // 全局禁用样式：通过 cssLayer + 不引入 theme.preset 实现
})
```

### Unstyled 单组件

```html
<p-button label="无样式按钮" [unstyled]="true" class="my-custom-btn px-4 py-2 bg-blue-500 text-white rounded" />
```

> 单组件 `[unstyled]="true"` 后、Button 不会有任何 PrimeNG 内置样式、完全由用户提供。**配合 Tailwind 用最方便**。

### 何时用 Unstyled？

| 场景 | 推荐 |
|---|---|
| 项目用 Tailwind / UnoCSS、想完全自定义视觉 | **Unstyled** |
| 项目用 PrimeNG 默认 Aura / Material 视觉 | Styled |
| 项目用商业模板（Apollo / Diamond） | Styled |
| 需要与品牌设计语言完全一致 | **Unstyled** + 自写 CSS |

## Tailwind CSS 集成

PrimeNG v20 提供 **`tailwindcss-primeui`** 官方插件 —— 把 PrimeNG 主题色板映射为 Tailwind 工具类。

### 安装

```bash
pnpm add -D tailwindcss-primeui
```

### Tailwind v4 配置（推荐，2026 主流）

`src/styles.scss`：

```scss
@import "tailwindcss";
@import "tailwindcss-primeui";

@import "primeicons/primeicons.css";
```

> Tailwind v4 用 `@import "tailwindcss"` —— 不需要 tailwind.config.js。`tailwindcss-primeui` 直接在 CSS 中 import。

### Tailwind v3 配置

`tailwind.config.js`：

```js
import PrimeUI from 'tailwindcss-primeui'

export default {
  content: ['./src/**/*.{html,ts}'],
  darkMode: ['selector', '[class~="my-app-dark"]'],
  plugins: [PrimeUI],
}
```

`src/styles.scss`：

```scss
@tailwind base;
@tailwind components;
@tailwind utilities;

@import "primeicons/primeicons.css";
```

### cssLayer 解决优先级冲突

```ts
providePrimeNG({
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '.my-app-dark',
      cssLayer: {
        name: 'primeng',
        order: 'tailwind-base, primeng, tailwind-utilities',
      },
    },
  },
})
```

> **关键**：`cssLayer.order` 控制 CSS @layer 顺序 —— Tailwind 的 `tailwind-utilities` 在 PrimeNG 之后、保证 Tailwind 的 `bg-red-500` 等工具类能覆盖 PrimeNG 内部样式。

### tailwindcss-primeui 语义工具类

安装后可用以下额外工具类（与 PrimeNG 主题 token 同步）：

```html
<!-- 主色 -->
<div class="bg-primary text-primary-contrast">主色背景</div>
<div class="bg-primary-500 hover:bg-primary-600">主色 500</div>

<!-- Surface（灰阶） -->
<div class="bg-surface-0 text-surface-900 dark:bg-surface-900 dark:text-surface-50">
  surface 0/900
</div>

<!-- 暗色模式 -->
<div class="bg-white dark:bg-surface-800">
  亮 / 暗自动切换
</div>

<!-- 动画 -->
<div class="animate-fadein animate-duration-500">淡入</div>
```

> 配合 Tailwind 的 `dark:` 前缀 + PrimeNG `darkModeSelector` 一致 selector 完整启用暗色。

## PassThrough (pt) 深度

PassThrough (`pt`) 是 **PrimeTek 全家桶核心创新** —— 穿透到组件任意内部 DOM 元素、传入 class / style / 事件。

### 基础用法（class + style）

```html
<p-panel header="Header" [pt]="pt">
  <p>Content</p>
</p-panel>
```

```ts
import { Component } from '@angular/core'
import { Panel, PanelModule, PanelPassThrough } from 'primeng/panel'

@Component({
  selector: 'panel-pt-demo',
  standalone: true,
  imports: [PanelModule],
  templateUrl: './panel-pt-demo.html',
})
export class PanelPtDemoComponent {
  pt: PanelPassThrough<Panel> = {
    root: '!border !border-transparent !rounded-2xl !p-4 !bg-gradient-to-br !from-indigo-600 !to-indigo-400',
    header: {
      id: 'myPanelHeader',
      'data-custom': 'prime',
      style: {
        userSelect: 'none',
      },
      class: ['!text-white font-bold !p-0 !bg-transparent !border-none'],
      onclick: () => {
        console.log('Header Clicked')
      },
    },
    content: {
      class: '!text-white dark:text-primary-200 !p-0 mt-2 !font-medium',
    },
    title: 'text-xl',
  }
}
```

> **关键概念**：
>
> 1. **`PanelPassThrough<Panel>` 类型** 给你 IDE 自动补全所有 pt section 名称
> 2. **`!` 前缀** 是 Tailwind 的 `!important`、保证覆盖 PrimeNG 默认样式
> 3. **pt section 名称**（如 `root` / `header` / `content` / `title`）每个组件不同、查文档
> 4. **可以传字符串** = class、**可以传对象** = `{ class, style, onclick, ...attrs }`

### 嵌套组件 PassThrough（`pcBadge` 等）

```html
<p-button
  type="button"
  label="Messages"
  icon="pi pi-inbox"
  badge="2"
  variant="outlined"
  severity="secondary"
  [pt]="{
    root: '!px-4 !py-3',
    icon: '!text-xl !text-violet-500 dark:!text-violet-400',
    label: '!text-lg !text-violet-500 dark:!text-violet-400',
    pcBadge: {
      root: '!bg-violet-500 dark:!bg-violet-400 !text-white dark:!text-black'
    }
  }"
/>
```

> **`pcBadge` 是嵌套组件标识** —— Button 内部使用 Badge 子组件、通过 `pcBadge.root` 穿透到 Badge 的 root 元素。

### 访问组件实例（动态 pt）

```ts
import { Component } from '@angular/core'
import { PassThroughContext } from 'primeng/api'
import { Panel, PanelModule, PanelPassThrough } from 'primeng/panel'

@Component({
  standalone: true,
  imports: [PanelModule],
  template: `
    <p-panel header="Header" [pt]="pt">
      Content
    </p-panel>
  `,
})
export class PanelPtDemoComponent {
  pt: PanelPassThrough<Panel> = {
    header: (context: PassThroughContext<Panel>) => {
      const instance = context.instance
      const element = instance.el

      return {
        id: 'myPanelHeader',
        'data-custom': 'prime',
        style: {
          userSelect: 'none',
        },
        // 根据 instance 状态动态返回 class
        class: [
          { 'overflow-hidden': instance.toggleable },
          '!text-white font-bold !p-0 !bg-transparent !border-none',
        ],
      }
    },
  }
}
```

> **函数形式 pt** 可以根据组件实例状态（如 `instance.toggleable` / `instance.collapsed`）动态生成样式。

### 全局 PassThrough（providePrimeNG）

```ts
import { ApplicationConfig } from '@angular/core'
import { providePrimeNG } from 'primeng/config'

export const appConfig: ApplicationConfig = {
  providers: [
    providePrimeNG({
      pt: {
        panel: {
          header: {
            class: 'bg-primary text-primary-contrast',
          },
        },
        autocomplete: {
          pcInputText: {
            root: 'w-64',                       // 或 { class: 'w-64' }
          },
        },
      },
    }),
  ],
}
```

> **全局 pt 在所有 Panel / AutoComplete 实例上生效** —— 组件级 pt 默认覆盖全局 pt。

### mergeSections / mergeProps 控制覆盖行为

```html
<p-panel
  [pt]="pt"
  [ptOptions]="{ mergeSections: false, mergeProps: false }"
>
  Content
</p-panel>
```

| `mergeSections` | `mergeProps` | 行为 |
|---|---|---|
| `true`（默认） | `true`（默认） | 组件 pt 与全局 pt 合并、props 也合并 |
| `false` | `true` | 组件 pt **完全覆盖** 全局 pt 的同名 section |
| `true` | `false` | 同名 section 合并、但 props 之间互相覆盖 |
| `false` | `false` | 组件 pt 完全覆盖、props 也完全覆盖 |

## ConfirmationService / MessageService / DialogService 完整 API

PrimeNG 反馈交互三件套 —— 标准 Angular DI 服务。

### MessageService（Toast 消息）

**1. 注册 Service + 引入 ToastModule**：

```ts
import { Component, inject } from '@angular/core'
import { MessageService } from 'primeng/api'
import { ToastModule } from 'primeng/toast'
import { ButtonModule } from 'primeng/button'

@Component({
  selector: 'app-toast-demo',
  standalone: true,
  imports: [ToastModule, ButtonModule],
  providers: [MessageService],
  template: `
    <p-toast />
    <p-button label="成功" (onClick)="showSuccess()" severity="success" />
    <p-button label="信息" (onClick)="showInfo()" severity="info" />
    <p-button label="警告" (onClick)="showWarn()" severity="warn" />
    <p-button label="错误" (onClick)="showError()" severity="danger" />
  `,
})
export class ToastDemoComponent {
  private messageService = inject(MessageService)

  showSuccess() {
    this.messageService.add({
      severity: 'success',
      summary: '保存成功',
      detail: '数据已保存到服务器',
      life: 3000,
    })
  }

  showInfo() {
    this.messageService.add({
      severity: 'info',
      summary: '提示',
      detail: '请注意查收消息',
    })
  }

  showWarn() {
    this.messageService.add({
      severity: 'warn',
      summary: '警告',
      detail: '操作可能有风险',
    })
  }

  showError() {
    this.messageService.add({
      severity: 'error',
      summary: '错误',
      detail: '保存失败，请重试',
      sticky: true,                             // 不自动关闭
    })
  }
}
```

### Toast 多位置（key 区分）

```html
<p-toast position="top-left" key="tl" />
<p-toast position="bottom-left" key="bl" />
<p-toast position="bottom-right" key="br" />

<p-button (onClick)="showTopLeft()" label="左上" />
<p-button (onClick)="showBottomRight()" label="右下" />
```

```ts
showTopLeft() {
  this.messageService.add({
    severity: 'info',
    summary: '左上提示',
    detail: '...',
    key: 'tl',                                  // 与 <p-toast key="tl" /> 配对
  })
}

showBottomRight() {
  this.messageService.add({
    severity: 'success',
    summary: '右下成功',
    detail: '...',
    key: 'br',
  })
}
```

### ConfirmationService（确认对话框）

```ts
import { Component, inject } from '@angular/core'
import { ConfirmationService, MessageService } from 'primeng/api'
import { ConfirmDialogModule } from 'primeng/confirmdialog'
import { ToastModule } from 'primeng/toast'
import { ButtonModule } from 'primeng/button'

@Component({
  standalone: true,
  imports: [ConfirmDialogModule, ToastModule, ButtonModule],
  providers: [ConfirmationService, MessageService],
  template: `
    <p-toast />
    <p-confirmdialog />
    <p-button (onClick)="confirm1()" label="保存" [outlined]="true" />
    <p-button (onClick)="confirm2()" label="删除" severity="danger" [outlined]="true" />
  `,
})
export class ConfirmDemoComponent {
  private confirmationService = inject(ConfirmationService)
  private messageService = inject(MessageService)

  confirm1() {
    this.confirmationService.confirm({
      message: '确定要保存吗？',
      header: '保存确认',
      icon: 'pi pi-info-circle',
      acceptLabel: '保存',
      rejectLabel: '取消',
      accept: () => {
        this.messageService.add({ severity: 'success', summary: '已保存', detail: '...' })
      },
      reject: () => {
        this.messageService.add({ severity: 'info', summary: '已取消', detail: '...' })
      },
    })
  }

  confirm2() {
    this.confirmationService.confirm({
      message: '确定要删除吗？删除后无法恢复',
      header: '删除确认',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: '删除',
      rejectLabel: '取消',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.messageService.add({ severity: 'success', summary: '已删除', detail: '...' })
      },
    })
  }
}
```

### ConfirmDialog 自定义模板

```html
<p-toast />
<p-confirmdialog>
  <ng-template #message let-message>
    <div class="flex flex-col items-center w-full gap-4 border-b border-surface-200 dark:border-surface-700">
      <i [ngClass]="message.icon" class="!text-6xl text-primary-500"></i>
      <p>{{ message.message }}</p>
    </div>
  </ng-template>
</p-confirmdialog>

<p-button (onClick)="confirm()" label="自定义确认" />
```

### DialogService（动态对话框）

**1. 被打开的组件**：

```ts
// product-detail.component.ts
import { Component, inject } from '@angular/core'
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog'
import { ButtonModule } from 'primeng/button'

@Component({
  standalone: true,
  imports: [ButtonModule],
  template: `
    <div>
      <h3>商品 ID: {{ config.data?.productId }}</h3>
      <p>商品名称: {{ product?.name }}</p>
      <p-button label="保存" (onClick)="save()" />
    </div>
  `,
})
export class ProductDetailComponent {
  private ref = inject(DynamicDialogRef)
  config = inject(DynamicDialogConfig)

  product: { name: string } | null = null

  ngOnInit() {
    // 从 config.data 取传入数据
    const productId = this.config.data?.productId
    // 模拟查询
    this.product = { name: `商品 #${productId}` }
  }

  save() {
    this.ref.close({ saved: true, productId: this.config.data?.productId })
  }
}
```

**2. 打开对话框**：

```ts
import { Component, inject, OnDestroy } from '@angular/core'
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog'
import { ButtonModule } from 'primeng/button'
import { ProductDetailComponent } from './product-detail.component'

@Component({
  standalone: true,
  imports: [ButtonModule],
  providers: [DialogService],
  template: `
    <p-button label="打开商品详情" (onClick)="open()" />
  `,
})
export class DialogDemoComponent implements OnDestroy {
  private dialogService = inject(DialogService)
  ref: DynamicDialogRef | undefined

  open() {
    this.ref = this.dialogService.open(ProductDetailComponent, {
      header: '商品详情',
      width: '50vw',
      modal: true,
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
      data: {
        productId: 123,
      },
      // 也可以直接传 inputs（Angular 14+）
      inputValues: {
        // selectedProduct: 'Laptop',
        // quantity: 2,
      },
    })

    this.ref.onClose.subscribe((result) => {
      console.log('对话框关闭，返回：', result)
    })
  }

  ngOnDestroy() {
    if (this.ref) {
      this.ref.close()
    }
  }
}
```

> **关键点**：
>
> 1. `DialogService` 必须在 component 或全局 providers 注册
> 2. **子组件用 `inject(DynamicDialogRef)` + `inject(DynamicDialogConfig)`** 取引用和数据
> 3. **`ref.onClose.subscribe()` 监听关闭** —— 一定要在 `ngOnDestroy` 中 `ref.close()` 防止泄漏
> 4. **`breakpoints`** 在窄屏自动调整 width

## 与 Angular Router 集成

PrimeNG MenuItem / Menubar / Menu 与 Angular Router 集成两种方式：

### 方式 1：command 回调

```ts
import { MenuItem } from 'primeng/api'
import { Router, inject } from '@angular/router'

const router = inject(Router)

const items: MenuItem[] = [
  {
    label: '仪表盘',
    icon: 'pi pi-home',
    command: () => router.navigateByUrl('/'),
  },
  {
    label: '用户管理',
    icon: 'pi pi-users',
    command: (event) => {
      console.log('navigate event:', event)
      router.navigateByUrl('/users')
    },
  },
]
```

### 方式 2：routerLink

```ts
const items: MenuItem[] = [
  {
    label: '设置',
    icon: 'pi pi-cog',
    routerLink: '/settings',
  },
  {
    label: '资料',
    icon: 'pi pi-user',
    routerLink: ['/profile', 'edit'],          // 支持数组
    queryParams: { tab: 'profile' },
    routerLinkActiveOptions: { exact: true },
  },
]
```

### 完整布局示例（Menubar + RouterOutlet）

```ts
import { Component, inject } from '@angular/core'
import { Router, RouterOutlet } from '@angular/router'
import { MenuItem } from 'primeng/api'
import { MenubarModule } from 'primeng/menubar'
import { ToastModule } from 'primeng/toast'
import { ConfirmDialogModule } from 'primeng/confirmdialog'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MenubarModule, ToastModule, ConfirmDialogModule],
  template: `
    <p-toast />
    <p-confirmdialog />

    <p-menubar [model]="menuItems">
      <ng-template #start>
        <span class="font-bold text-xl mr-4">My App</span>
      </ng-template>
      <ng-template #end>
        <p-button icon="pi pi-user" [rounded]="true" [text]="true" />
      </ng-template>
    </p-menubar>

    <main style="padding: 24px;">
      <router-outlet />
    </main>
  `,
})
export class AppComponent {
  menuItems: MenuItem[] = [
    {
      label: '仪表盘',
      icon: 'pi pi-home',
      routerLink: '/dashboard',
    },
    {
      label: '管理',
      icon: 'pi pi-folder',
      items: [
        {
          label: '用户',
          icon: 'pi pi-users',
          routerLink: '/admin/users',
        },
        {
          label: '角色',
          icon: 'pi pi-shield',
          routerLink: '/admin/roles',
        },
        { separator: true },
        {
          label: '退出',
          icon: 'pi pi-sign-out',
          command: () => this.logout(),
        },
      ],
    },
  ]

  private router = inject(Router)

  logout() {
    // 退出登录逻辑
    this.router.navigateByUrl('/login')
  }
}
```

## i18n 完整方案

### 在 providePrimeNG 中传入 translation

见 [入门 > 中文国际化](./getting-started.md#中文国际化)。

### 运行时切换语言

```ts
import { Component, inject } from '@angular/core'
import { PrimeNG } from 'primeng/config'
import { zhCN } from '../locales/zh-cn'
import { enUS } from '../locales/en-us'

@Component({
  // ...
})
export class LangSwitcherComponent {
  private primeng = inject(PrimeNG)

  switchToZh() {
    this.primeng.setTranslation(zhCN)
  }

  switchToEn() {
    this.primeng.setTranslation(enUS)
  }
}
```

### 集成 ngx-translate

```bash
pnpm add @ngx-translate/core @ngx-translate/http-loader
```

```ts
// app.config.ts
import { provideHttpClient } from '@angular/common/http'
import { TranslateModule, TranslateLoader } from '@ngx-translate/core'
import { TranslateHttpLoader } from '@ngx-translate/http-loader'
import { HttpClient } from '@angular/common/http'

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    importProvidersFrom(
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: (http: HttpClient) => new TranslateHttpLoader(http, '/i18n/', '.json'),
          deps: [HttpClient],
        },
      }),
    ),
    providePrimeNG({
      theme: { preset: Aura },
    }),
  ],
}
```

```ts
// app.component.ts
import { Component, OnInit, inject } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'
import { PrimeNG } from 'primeng/config'

@Component({/* ... */})
export class AppComponent implements OnInit {
  private translateService = inject(TranslateService)
  private primeng = inject(PrimeNG)

  ngOnInit() {
    this.translateService.setDefaultLang('zh-CN')
    this.translateService.use('zh-CN')

    // 把 ngx-translate 的 primeng key 同步到 PrimeNG
    this.translateService.get('primeng').subscribe(res => {
      this.primeng.setTranslation(res)
    })
  }

  switchLang(lang: string) {
    this.translateService.use(lang)
    this.translateService.get('primeng').subscribe(res => {
      this.primeng.setTranslation(res)
    })
  }
}
```

`public/i18n/zh-CN.json`：

```json
{
  "primeng": {
    "accept": "确认",
    "reject": "取消",
    "choose": "选择",
    "dayNames": ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"]
  },
  "app": {
    "title": "我的应用",
    "logout": "退出"
  }
}
```

## SSR (Angular SSR / Angular Universal)

PrimeNG v20 完整支持 Angular SSR（v17+ 内置 SSR、不再用 Angular Universal）。

### 创建带 SSR 的项目

```bash
ng new my-app --ssr
```

### app.config.server.ts

```ts
import { ApplicationConfig, mergeApplicationConfig } from '@angular/core'
import { provideServerRendering } from '@angular/platform-server'
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async'
import { providePrimeNG } from 'primeng/config'
import Aura from '@primeuix/themes/aura'

import { appConfig } from './app.config'

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: { preset: Aura },
    }),
  ],
}

export const config = mergeApplicationConfig(appConfig, serverConfig)
```

### SSR 注意事项

1. **`document` / `window` 调用** 必须用 `isPlatformBrowser` 守护：

```ts
import { Component, PLATFORM_ID, inject } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'

@Component({/* ... */})
export class MyComponent {
  private platformId = inject(PLATFORM_ID)

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      document.documentElement.classList.toggle('my-app-dark')
    }
  }
}
```

2. **`localStorage` / `sessionStorage`** 同上、SSR 时不存在
3. **Animations** 通过 `provideAnimationsAsync()` 注册 —— SSR 友好

## 常见踩坑

### 1. v17 → v20 主题系统重构（最高频踩坑）

| 版本 | 主题方式 | import 路径 |
|---|---|---|
| v17 | 内置 Less 主题 CSS | `primeng/resources/themes/aura-light-blue/theme.css` |
| v18 | 引入 `@primeng/themes` token | `@primeng/themes/aura` |
| v19 | 默认 CSS Layer + 三层 token | `@primeng/themes/aura` |
| **v20** | **整合 `@primeuix/themes`**（与 PrimeVue 共用） | **`@primeuix/themes/aura`** |

> **升级 v17 → v20 必做**：删除所有 `primeng/resources/themes/*.css` 全局 import、改用 `providePrimeNG({ theme: { preset: Aura } })`。

### 2. Standalone import 缺失

```ts
@Component({
  standalone: true,
  // ❌ 忘记 import 对应 Module
  // imports: [ButtonModule],
  template: `<p-button label="点击" />`,    // 报错：'p-button' is not a known element
})
```

✅ 解决：每个用到的 PrimeNG 组件都要 `imports: [XxxModule]`。

### 3. ConfirmationService / MessageService / DialogService 未注册

```ts
@Component({
  standalone: true,
  imports: [ConfirmDialogModule],
  // ❌ 忘记 providers
  // providers: [ConfirmationService],
  template: `<p-confirmdialog />`,
})
export class MyComponent {
  // 注入失败：NullInjectorError: No provider for ConfirmationService
  private confirmationService = inject(ConfirmationService)
}
```

✅ 解决：在 component 的 `providers` 或 `app.config.ts` providers 中注册。

### 4. Tailwind 优先级冲突

```html
<!-- ❌ Tailwind 的 bg-red-500 不生效 -->
<p-button label="测试" class="bg-red-500" />
```

✅ 解决：
- 用 `!` 强制（`class="!bg-red-500"`） + 配置 cssLayer 顺序
- 或用 `[pt]="{ root: '!bg-red-500' }"` PassThrough

### 5. PrimeIcons 不显示

```ts
// ❌ 忘记 import CSS
@Component({
  template: `<i class="pi pi-check"></i>`,    // 显示空白方块
})
```

✅ 解决：`styles.scss` 中 `@import "primeicons/primeicons.css"` 或 `angular.json` 中加 styles 数组。

### 6. provideAnimationsAsync 缺失

```ts
export const appConfig: ApplicationConfig = {
  providers: [
    // ❌ 忘记 provideAnimationsAsync
    providePrimeNG({ theme: { preset: Aura } }),
  ],
}
```

> Toast / Dialog 等组件依赖 Angular Animations、不加 `provideAnimationsAsync()` 会报错。

✅ 解决：始终在 `providePrimeNG` 之前加 `provideAnimationsAsync()`。

### 7. DataTable Lazy Load 不触发

```html
<!-- ❌ 缺少 [lazy]="true" -->
<p-table [value]="rows" (onLazyLoad)="loadData($event)">
```

✅ 解决：lazy load 必须同时设置 `[lazy]="true"` + `[totalRecords]` + `[paginator]="true"` + `(onLazyLoad)="..."`。

### 8. PassThrough section 命名混淆

```html
<!-- ❌ pt section 写错 -->
<p-button [pt]="{ button: 'my-class' }" />  <!-- 没有 button section -->
```

✅ 解决：每个组件的 pt section 不同 —— **查官方文档每个组件的 PassThrough 表格**（root / label / icon / pcBadge 等）。

### 9. CSS @layer 顺序错误（与 Tailwind 共存）

```ts
providePrimeNG({
  theme: {
    preset: Aura,
    options: {
      cssLayer: {
        name: 'primeng',
        // ❌ 顺序错了：utilities 应该在最后
        order: 'tailwind-utilities, primeng, tailwind-base',
      },
    },
  },
})
```

✅ 解决：正确顺序 `'tailwind-base, primeng, tailwind-utilities'` —— Tailwind utilities 应在 PrimeNG 之后。

### 10. SSR 中 document 不存在

```ts
ngOnInit() {
  // ❌ SSR 时崩溃：document is not defined
  document.documentElement.classList.toggle('my-app-dark')
}
```

✅ 解决：用 `isPlatformBrowser(this.platformId)` 守护。

### 11. v18+ 组件改名

| v17 | v18+ |
|---|---|
| Dropdown | **Select** |
| InputSwitch | **ToggleSwitch** |
| Calendar | **DatePicker** |
| OverlayPanel | **Popover** |
| Sidebar | **Drawer** |
| TabView | **Tabs** |

> 升级时全局搜索替换。

### 12. PrimeIcons 字符串拼接

```ts
// ❌ 用 PrimeIcons 常量时记得是完整字符串（含 'pi pi-' 前缀）
icon: 'pi-check'    // 不显示
// ✅
icon: 'pi pi-check'
// ✅ 或
icon: PrimeIcons.CHECK  // 等价于 'pi pi-check'
```

## 下一步

- [参考](./reference.md)：**API 速查** / 80+ 组件分组列表 / 常用 props 表 / `providePrimeNG` 配置选项 / `@primeuix/themes` 4 大预设 / `definePreset` API / Service 签名 / TypeScript 类型 / `tailwindcss-primeui` 工具类
