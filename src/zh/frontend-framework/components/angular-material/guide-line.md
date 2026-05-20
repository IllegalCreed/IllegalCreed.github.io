---
layout: doc
outline: [2, 3]
---

# 指南

本章覆盖 Angular Material v20.x 在生产中的完整使用——**60+ 组件全景** + **`@angular/cdk` 行为底座** + **`mat.theme()` Material 3 主题系统** + **Component Harnesses 测试**。Angular Material 与 Angular 框架共生，每个章节都包含 standalone 时代的 import 和 signals 友好的写法。

## 60+ 组件全景

Angular Material 把 60+ 组件按官方文档分为 **7 大类**：Form Controls / Navigation / Layout / Buttons & Indicators / Popups & Modals / Data Table / Tabs。

### Form Controls（14 个）

表单控件——Material 的核心阵地，全部 14 个组件配合 Reactive Forms 使用。

| 组件 | 用途 | Standalone import |
| --- | --- | --- |
| MatFormField | 表单字段容器（label / hint / error / 前后缀） | `@angular/material/form-field` |
| MatInput | 文本输入框指令（用 `matInput`） | `@angular/material/input` |
| MatSelect | 下拉选择 | `@angular/material/select` |
| MatAutocomplete | 自动补全输入 | `@angular/material/autocomplete` |
| MatCheckbox | 复选框 | `@angular/material/checkbox` |
| MatRadioGroup / MatRadioButton | 单选 | `@angular/material/radio` |
| MatSlideToggle | 开关 | `@angular/material/slide-toggle` |
| MatSlider | 滑块 | `@angular/material/slider` |
| MatDatepicker | 日期选择 | `@angular/material/datepicker` |
| MatTimepicker（v20 新） | 时间选择 | `@angular/material/timepicker` |
| MatChipGrid / MatChipRow | 多值标签输入 | `@angular/material/chips` |
| MatButtonToggle | 单选 / 多选按钮组 | `@angular/material/button-toggle` |
| MatStepper | 多步表单 | `@angular/material/stepper` |
| MatTree | 树形结构（标签 / 文件目录） | `@angular/material/tree` |

### Navigation（4 个）

导航类组件。

| 组件 | 用途 |
| --- | --- |
| MatToolbar | 顶部工具栏（应用栏 / Header） |
| MatSidenav | 侧边抽屉（响应式可配） |
| MatMenu | 下拉菜单（点击触发） |
| MatNavList / MatList | 导航列表 / 普通列表 |

### Layout（6 个）

布局容器。

| 组件 | 用途 |
| --- | --- |
| MatCard | 卡片容器（v20 新增 filled 变体） |
| MatDivider | 分割线 |
| MatExpansionPanel / MatAccordion | 折叠面板 |
| MatGridList | 栅格布局 |
| MatList | 列表 |
| MatStepper | 步骤器 |

### Buttons & Indicators（8 个）

按钮和指示器。

| 组件 | 用途 |
| --- | --- |
| MatButton | 普通按钮（text / filled / outlined / elevated / **tonal** v20 新） |
| MatIconButton | 图标按钮 |
| MatFabButton / MatMiniFabButton / MatExtendedFabButton | 浮动操作按钮 |
| MatBadge | 角标 |
| MatChipSet / MatChip | 标签 |
| MatIcon | 图标渲染器（字体 / SVG） |
| MatProgressBar | 进度条 |
| MatProgressSpinner | 进度环 |
| MatRipple | 涟漪指令 |

### Popups & Modals（7 个）

弹层组件。

| 组件 | 用途 |
| --- | --- |
| MatDialog | 模态对话框（service 触发） |
| MatBottomSheet | 底部抽屉（service 触发） |
| MatSnackBar | 顶部通知条（service 触发） |
| MatTooltip | 工具提示（指令） |
| MatMenu | 下拉菜单（指令 + 元素） |
| MatAutocomplete | 自动补全（指令 + 元素） |
| MatDatepicker overlay | Datepicker 自带的弹层 |

### Data Table（4 个）

数据表格。

| 组件 | 用途 |
| --- | --- |
| MatTable | 主表格（基于 CdkTable） |
| MatHeaderRow / MatRow / MatFooterRow | 行 |
| MatPaginator | 分页器 |
| MatSort / MatSortHeader | 排序 |

### Tabs（1 个）

| 组件 | 用途 |
| --- | --- |
| MatTabGroup / MatTab / MatTabNav | 标签页（支持 router 集成） |

## MatFormField + MatInput 完整 API

MatFormField 是 Angular Material 表单的核心容器——**所有表单控件几乎都要包在 `<mat-form-field>` 内**。

### 完整属性矩阵

```html
<mat-form-field
  appearance="outline"                  <!-- 'outline' | 'fill' -->
  floatLabel="auto"                     <!-- 'auto' | 'always' -->
  hideRequiredMarker="false"            <!-- 隐藏 * 必填标记 -->
  color="primary"                       <!-- 'primary' | 'accent' | 'warn' -->
  subscriptSizing="fixed">              <!-- 'fixed' | 'dynamic' 错误区高度 -->

  <mat-label>邮箱</mat-label>           <!-- 标签 -->

  <mat-icon matPrefix>email</mat-icon>  <!-- 前缀图标 -->
  <span matTextPrefix>+86</span>        <!-- 前缀文本 -->

  <input
    matInput
    type="email"
    placeholder="example@gmail.com"
    [formControl]="emailControl"
    required>

  <mat-icon matSuffix>visibility</mat-icon>
  <span matTextSuffix>.com</span>

  <mat-hint>请输入有效邮箱</mat-hint>
  <mat-hint align="end">{{ emailControl.value?.length || 0 }}/50</mat-hint>

  <mat-error>{{ getEmailError() }}</mat-error>
</mat-form-field>
```

### 完整 imports 清单

```ts
import {
  MatFormField,
  MatLabel,
  MatHint,
  MatError,
  MatPrefix,
  MatSuffix,
  MatTextPrefix,        // v17+ 区分纯文本前后缀
  MatTextSuffix,
} from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
```

### subscriptSizing 控制错误区

`subscriptSizing` 控制错误 / hint 区域的高度行为：

- `fixed`（默认）：始终预留高度，错误出现不抖动布局
- `dynamic`：仅在错误出现时占位，布局会变高

```html
<!-- 密集表单推荐 dynamic -->
<mat-form-field appearance="outline" subscriptSizing="dynamic">
  <mat-label>查询关键词</mat-label>
  <input matInput>
</mat-form-field>
```

### floatLabel - 标签浮动行为

```html
<!-- auto: 有内容或获得焦点时浮动 -->
<mat-form-field floatLabel="auto">...</mat-form-field>

<!-- always: 永远浮动 -->
<mat-form-field floatLabel="always">...</mat-form-field>
```

### appearance 外观对比

| appearance | 视觉 | 推荐场景 |
| --- | --- | --- |
| `outline` | 边框 + 标签悬浮在线上 | **推荐默认** |
| `fill` | 填充背景 + 标签悬浮 | 卡片内 / 强调输入 |

## MatSelect

下拉选择——支持单选 / 多选 / 分组 / 自定义 trigger。

### 单选

```ts
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatSelect, MatOption } from '@angular/material/select';

@Component({
  selector: 'app-select-demo',
  standalone: true,
  imports: [FormsModule, MatFormField, MatLabel, MatSelect, MatOption],
  template: `
    <mat-form-field appearance="outline">
      <mat-label>选择城市</mat-label>
      <mat-select [(value)]="city">
        <mat-option value="beijing">北京</mat-option>
        <mat-option value="shanghai">上海</mat-option>
        <mat-option value="shenzhen">深圳</mat-option>
        <mat-option value="hangzhou">杭州</mat-option>
      </mat-select>
    </mat-form-field>

    <p>当前：{{ city() }}</p>
  `,
})
export class SelectDemoComponent {
  city = signal('beijing');
}
```

### 多选

```html
<mat-form-field appearance="outline">
  <mat-label>选择技术</mat-label>
  <mat-select [(value)]="techs" multiple>
    <mat-option value="vue">Vue</mat-option>
    <mat-option value="react">React</mat-option>
    <mat-option value="angular">Angular</mat-option>
    <mat-option value="svelte">Svelte</mat-option>
  </mat-select>
</mat-form-field>
```

### 分组

```ts
import { MatOptgroup } from '@angular/material/select';

@Component({
  imports: [MatFormField, MatSelect, MatOption, MatOptgroup],
  template: `
    <mat-form-field appearance="outline">
      <mat-label>选择字体</mat-label>
      <mat-select [(value)]="font">
        <mat-optgroup label="无衬线">
          <mat-option value="roboto">Roboto</mat-option>
          <mat-option value="inter">Inter</mat-option>
        </mat-optgroup>
        <mat-optgroup label="衬线">
          <mat-option value="merriweather">Merriweather</mat-option>
          <mat-option value="lora">Lora</mat-option>
        </mat-optgroup>
        <mat-optgroup label="等宽">
          <mat-option value="fira-code">Fira Code</mat-option>
          <mat-option value="jetbrains">JetBrains Mono</mat-option>
        </mat-optgroup>
      </mat-select>
    </mat-form-field>
  `,
})
```

### 自定义触发器显示

```html
<mat-form-field appearance="outline">
  <mat-label>多选标签</mat-label>
  <mat-select [(value)]="selected" multiple>
    <mat-select-trigger>
      已选 {{ selected().length }} 项
      @if (selected().length > 0) {
        <span>（{{ selected()[0] }}{{ selected().length > 1 ? ' 等' : '' }}）</span>
      }
    </mat-select-trigger>
    @for (item of items; track item) {
      <mat-option [value]="item">{{ item }}</mat-option>
    }
  </mat-select>
</mat-form-field>
```

## MatAutocomplete

自动补全——文本输入 + 实时过滤选项。

```ts
import { Component, signal, computed } from '@angular/core';
import { FormsModule, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatAutocomplete, MatAutocompleteTrigger, MatOption } from '@angular/material/autocomplete';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';

@Component({
  selector: 'app-autocomplete-demo',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatInput,
    MatAutocomplete,
    MatAutocompleteTrigger,
    MatOption,
  ],
  template: `
    <mat-form-field appearance="outline">
      <mat-label>选择编程语言</mat-label>
      <input
        type="text"
        matInput
        [formControl]="control"
        [matAutocomplete]="auto">
      <mat-autocomplete #auto="matAutocomplete" (optionSelected)="onSelect($event)">
        @for (option of filtered(); track option) {
          <mat-option [value]="option">{{ option }}</mat-option>
        }
      </mat-autocomplete>
    </mat-form-field>
  `,
})
export class AutocompleteDemoComponent {
  options = ['TypeScript', 'JavaScript', 'Python', 'Rust', 'Go', 'Swift', 'Kotlin'];

  control = new FormControl('', { nonNullable: true });

  /** 用 toSignal 把 valueChanges 转 signal */
  private value = toSignal(this.control.valueChanges.pipe(startWith('')), { initialValue: '' });

  /** computed 派生过滤结果 */
  filtered = computed(() => {
    const v = this.value().toLowerCase();
    return this.options.filter((opt) => opt.toLowerCase().includes(v));
  });

  onSelect(event: any) {
    console.log('已选：', event.option.value);
  }
}
```

### autoActiveFirstOption

```html
<mat-autocomplete #auto="matAutocomplete" autoActiveFirstOption>
  <!-- 自动高亮第一项，回车直接选中 -->
</mat-autocomplete>
```

### displayWith（对象选项）

```ts
@Component({
  template: `
    <mat-autocomplete #auto="matAutocomplete" [displayWith]="displayUser">
      @for (user of filteredUsers(); track user.id) {
        <mat-option [value]="user">{{ user.name }} - {{ user.email }}</mat-option>
      }
    </mat-autocomplete>
  `,
})
export class UserAutocompleteComponent {
  /** 选中后显示的内容 */
  displayUser = (user: { name: string; email: string } | null): string =>
    user?.name ?? '';
}
```

## MatCheckbox / MatRadio / MatSlideToggle

### MatCheckbox

```html
<mat-checkbox [(ngModel)]="agreed">同意服务协议</mat-checkbox>

<!-- 不确定状态 -->
<mat-checkbox
  [checked]="allChecked"
  [indeterminate]="someChecked"
  (change)="onMasterChange($event)">
  全选
</mat-checkbox>
@for (task of tasks; track task.id) {
  <mat-checkbox [(ngModel)]="task.done">{{ task.title }}</mat-checkbox>
}
```

### MatRadioGroup

```ts
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';

@Component({
  standalone: true,
  imports: [FormsModule, MatRadioGroup, MatRadioButton],
  template: `
    <mat-radio-group [(ngModel)]="plan" aria-label="选择套餐">
      <mat-radio-button value="free">免费版</mat-radio-button>
      <mat-radio-button value="pro">专业版</mat-radio-button>
      <mat-radio-button value="enterprise">企业版</mat-radio-button>
    </mat-radio-group>
  `,
})
```

### MatSlideToggle

```html
<mat-slide-toggle [(ngModel)]="darkMode">深色模式</mat-slide-toggle>
<mat-slide-toggle [(ngModel)]="notifications" color="accent">推送通知</mat-slide-toggle>
```

## MatDatepicker 完整方案

Angular Material 唯一企业级日期选择器——**必须配适配器**才能用。

### 安装适配器

```bash
# 三选一
pnpm add @angular/material-moment-adapter moment       # 偏好 Moment.js
pnpm add @angular/material-luxon-adapter luxon         # 偏好 Luxon
pnpm add @angular/material-date-fns-adapter date-fns   # 偏好 date-fns（推荐）
```

### provide Adapter

```ts
// src/app/app.config.ts
import { provideNativeDateAdapter } from '@angular/material/core';
// 或：
// import { provideMomentDateAdapter } from '@angular/material-moment-adapter';
// import { provideLuxonDateAdapter } from '@angular/material-luxon-adapter';
// import { provideDateFnsAdapter } from '@angular/material-date-fns-adapter';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimationsAsync(),
    provideNativeDateAdapter(),     // 原生 Date（最简单，但 i18n 弱）
  ],
};
```

### 基础日期选择

```ts
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormField, MatLabel, MatHint } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import {
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerToggle,
} from '@angular/material/datepicker';

@Component({
  selector: 'app-date-demo',
  standalone: true,
  imports: [
    FormsModule,
    MatFormField,
    MatLabel,
    MatHint,
    MatInput,
    MatDatepicker,
    MatDatepickerInput,
    MatDatepickerToggle,
  ],
  template: `
    <mat-form-field appearance="outline">
      <mat-label>选择日期</mat-label>
      <input matInput [matDatepicker]="picker" [(ngModel)]="date">
      <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
      <mat-datepicker #picker></mat-datepicker>
      <mat-hint>MM/DD/YYYY</mat-hint>
    </mat-form-field>
  `,
})
export class DateDemoComponent {
  date: Date | null = null;
}
```

### 日期范围选择

```ts
import {
  MatDateRangeInput,
  MatStartDate,
  MatEndDate,
  MatDateRangePicker,
} from '@angular/material/datepicker';

@Component({
  template: `
    <mat-form-field appearance="outline">
      <mat-label>选择范围</mat-label>
      <mat-date-range-input [rangePicker]="picker">
        <input matStartDate placeholder="开始日期">
        <input matEndDate placeholder="结束日期">
      </mat-date-range-input>
      <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
      <mat-date-range-picker #picker></mat-date-range-picker>
    </mat-form-field>
  `,
})
```

### 日期限制

```html
<input
  matInput
  [matDatepicker]="picker"
  [matDatepickerFilter]="weekdaysOnly"
  [min]="minDate"
  [max]="maxDate">
```

```ts
export class DateLimitComponent {
  minDate = new Date(2026, 0, 1);
  maxDate = new Date(2026, 11, 31);

  /** 仅工作日可选 */
  weekdaysOnly = (date: Date | null): boolean => {
    if (!date) return false;
    const day = date.getDay();
    return day !== 0 && day !== 6;
  };
}
```

### 国际化（中文）

```ts
import { MAT_DATE_LOCALE } from '@angular/material/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'zh-CN' },   // ← 中文
  ],
};
```

### MatTimepicker（v20 新）

v20 新增的时间选择器——补足 Material 历史长期缺失的 timepicker。

```ts
import { MatTimepicker, MatTimepickerInput } from '@angular/material/timepicker';

@Component({
  imports: [MatFormField, MatLabel, MatInput, MatTimepicker, MatTimepickerInput],
  template: `
    <mat-form-field appearance="outline">
      <mat-label>选择时间</mat-label>
      <input matInput [matTimepicker]="t" [(ngModel)]="time">
      <mat-timepicker #t></mat-timepicker>
    </mat-form-field>
  `,
})
```

## MatTable 完整数据表

`MatTable` 基于 `CdkTable`——Angular 生态最强大的开源表格之一，**社区版自带 sort + pagination + selection + sticky header**。

### 基础静态表格

```ts
import { Component } from '@angular/core';
import {
  MatTable,
  MatColumnDef,
  MatHeaderCellDef,
  MatHeaderCell,
  MatCellDef,
  MatCell,
  MatHeaderRowDef,
  MatHeaderRow,
  MatRowDef,
  MatRow,
} from '@angular/material/table';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

@Component({
  selector: 'app-basic-table',
  standalone: true,
  imports: [
    MatTable,
    MatColumnDef,
    MatHeaderCellDef,
    MatHeaderCell,
    MatCellDef,
    MatCell,
    MatHeaderRowDef,
    MatHeaderRow,
    MatRowDef,
    MatRow,
  ],
  template: `
    <table mat-table [dataSource]="users" class="mat-elevation-z2">
      <!-- ID 列 -->
      <ng-container matColumnDef="id">
        <th mat-header-cell *matHeaderCellDef>ID</th>
        <td mat-cell *matCellDef="let user">{{ user.id }}</td>
      </ng-container>

      <!-- Name 列 -->
      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef>姓名</th>
        <td mat-cell *matCellDef="let user">{{ user.name }}</td>
      </ng-container>

      <!-- Email 列 -->
      <ng-container matColumnDef="email">
        <th mat-header-cell *matHeaderCellDef>邮箱</th>
        <td mat-cell *matCellDef="let user">{{ user.email }}</td>
      </ng-container>

      <!-- Role 列 -->
      <ng-container matColumnDef="role">
        <th mat-header-cell *matHeaderCellDef>角色</th>
        <td mat-cell *matCellDef="let user">{{ user.role }}</td>
      </ng-container>

      <!-- 表头 + 数据行 -->
      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
    </table>
  `,
})
export class BasicTableComponent {
  displayedColumns = ['id', 'name', 'email', 'role'];

  users: User[] = [
    { id: 1, name: 'Alice', email: 'alice@example.com', role: '管理员' },
    { id: 2, name: 'Bob', email: 'bob@example.com', role: '编辑' },
    { id: 3, name: 'Charlie', email: 'charlie@example.com', role: '只读' },
  ];
}
```

### 排序 + 分页

```ts
import { Component, ViewChild, AfterViewInit, signal } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, MatSortHeader } from '@angular/material/sort';
import { MatPaginator, PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-sortable-table',
  standalone: true,
  imports: [
    // ... 上面所有 MatTable 相关
    MatSort,
    MatSortHeader,
    MatPaginator,
  ],
  template: `
    <table mat-table [dataSource]="dataSource" matSort class="mat-elevation-z2">
      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef mat-sort-header>姓名</th>
        <td mat-cell *matCellDef="let row">{{ row.name }}</td>
      </ng-container>

      <ng-container matColumnDef="age">
        <th mat-header-cell *matHeaderCellDef mat-sort-header>年龄</th>
        <td mat-cell *matCellDef="let row">{{ row.age }}</td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
    </table>

    <mat-paginator
      [pageSizeOptions]="[10, 20, 50, 100]"
      showFirstLastButtons>
    </mat-paginator>
  `,
})
export class SortableTableComponent implements AfterViewInit {
  displayedColumns = ['name', 'age'];

  dataSource = new MatTableDataSource([
    { name: 'Alice', age: 30 },
    { name: 'Bob', age: 25 },
    // ...
  ]);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }
}
```

### 行选择（MatCheckbox + SelectionModel）

```ts
import { SelectionModel } from '@angular/cdk/collections';
import { MatCheckbox } from '@angular/material/checkbox';

@Component({
  imports: [MatCheckbox, /* ... */],
  template: `
    <table mat-table [dataSource]="dataSource">
      <!-- 选择列 -->
      <ng-container matColumnDef="select">
        <th mat-header-cell *matHeaderCellDef>
          <mat-checkbox
            (change)="$event ? toggleAllRows() : null"
            [checked]="selection.hasValue() && isAllSelected()"
            [indeterminate]="selection.hasValue() && !isAllSelected()">
          </mat-checkbox>
        </th>
        <td mat-cell *matCellDef="let row">
          <mat-checkbox
            (click)="$event.stopPropagation()"
            (change)="$event ? selection.toggle(row) : null"
            [checked]="selection.isSelected(row)">
          </mat-checkbox>
        </td>
      </ng-container>

      <!-- 其他列... -->
    </table>
  `,
})
export class SelectableTableComponent {
  selection = new SelectionModel<User>(true, []);

  isAllSelected() {
    return this.selection.selected.length === this.dataSource.data.length;
  }

  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.selection.select(...this.dataSource.data);
    }
  }
}
```

### 过滤

```ts
applyFilter(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  this.dataSource.filter = value.trim().toLowerCase();
  if (this.dataSource.paginator) {
    this.dataSource.paginator.firstPage();
  }
}
```

```html
<mat-form-field appearance="outline">
  <mat-label>搜索</mat-label>
  <input matInput (keyup)="applyFilter($event)" placeholder="输入关键词...">
</mat-form-field>
```

### Sticky 表头 + 表尾

```html
<th mat-header-cell *matHeaderCellDef [sticky]="true">姓名</th>
<th mat-header-cell *matHeaderCellDef [stickyEnd]="true">操作</th>
```

### Virtual Scroll 集成

`MatTable` 自身不带虚拟滚动，但可以配合 `@angular/cdk/scrolling` 的 `cdk-virtual-scroll-viewport` 实现 10W+ 行流畅渲染。详见下文 CDK Scrolling 章节。

## MatDialog 弹窗

`MatDialog` 是 service 注入式 API——不像 ant-design `<a-modal>` 那样写在 template 里，而是 `dialog.open(MyComponent, config)` 触发。

### 完整工作流

```ts
// confirm-dialog.component.ts
import { Component, inject } from '@angular/core';
import { MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';

interface ConfirmData {
  title: string;
  message: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, MatButton],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>{{ data.message }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton (click)="dialogRef.close(false)">取消</button>
      <button matButton="filled" color="warn" (click)="dialogRef.close(true)">确认</button>
    </mat-dialog-actions>
  `,
})
export class ConfirmDialogComponent {
  dialogRef = inject<MatDialogRef<ConfirmDialogComponent, boolean>>(MatDialogRef);
  data = inject<ConfirmData>(MAT_DIALOG_DATA);
}
```

```ts
// page.component.ts - 触发 dialog
import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';
import { ConfirmDialogComponent } from './confirm-dialog.component';

@Component({
  selector: 'app-page',
  standalone: true,
  imports: [MatButton],
  template: `<button matButton="filled" color="warn" (click)="confirmDelete()">删除</button>`,
})
export class PageComponent {
  private dialog = inject(MatDialog);

  confirmDelete() {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: '确认删除', message: '此操作不可撤销，确认继续？' },
      width: '400px',
      disableClose: false,
    });

    ref.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        console.log('用户已确认删除');
      }
    });
  }
}
```

### v20 closePredicate 关闭谓词

v20 新增 `closePredicate` 让 dialog 关闭可被拦截——例如未保存表单提示。

```ts
this.dialog.open(EditDialogComponent, {
  data: { ... },
  closePredicate: (result) => {
    if (this.form.dirty && !result?.confirmed) {
      // 表单已改但用户没确认 → 阻止关闭
      return confirm('有未保存修改，确认放弃？');
    }
    return true;
  },
});
```

### Dialog 完整 config

```ts
this.dialog.open(MyComponent, {
  width: '500px',           // 宽度
  height: 'auto',           // 高度
  maxWidth: '90vw',         // 最大宽
  maxHeight: '80vh',
  data: { ... },            // 注入 data
  disableClose: false,      // 是否禁用点击外部 / Esc 关闭
  panelClass: 'my-dialog',  // 自定义 class
  hasBackdrop: true,        // 是否显示遮罩
  backdropClass: 'my-backdrop',
  position: { top: '50px', right: '50px' },  // 自定义位置
  enterAnimationDuration: '300ms',
  exitAnimationDuration: '200ms',
  autoFocus: 'first-tabbable',  // 自动聚焦
  restoreFocus: true,       // 关闭后恢复焦点
});
```

## MatBottomSheet 底部抽屉

API 与 `MatDialog` 极其相似——区别在视觉是从底部滑入。

```ts
import { MatBottomSheet, MatBottomSheetRef } from '@angular/material/bottom-sheet';

@Component({
  selector: 'app-share-sheet',
  standalone: true,
  imports: [MatList, MatListItem, MatIcon],
  template: `
    <mat-nav-list>
      <a mat-list-item (click)="share('wechat')">
        <mat-icon matListItemIcon>chat</mat-icon>
        <span matListItemTitle>微信</span>
      </a>
      <a mat-list-item (click)="share('weibo')">
        <mat-icon matListItemIcon>chat_bubble</mat-icon>
        <span matListItemTitle>微博</span>
      </a>
    </mat-nav-list>
  `,
})
export class ShareSheetComponent {
  private ref = inject(MatBottomSheetRef);

  share(platform: string) {
    this.ref.dismiss(platform);
  }
}

// 调用
@Component({
  template: `<button matButton (click)="openShare()">分享</button>`,
})
export class HostComponent {
  private bottomSheet = inject(MatBottomSheet);

  openShare() {
    const ref = this.bottomSheet.open(ShareSheetComponent);
    ref.afterDismissed().subscribe((platform) => {
      console.log('分享到：', platform);
    });
  }
}
```

## MatSnackBar 通知

顶部 / 底部出现的轻量通知——也是 service 注入式。

```ts
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Component({
  selector: 'app-notify-demo',
  template: `
    <button matButton (click)="success()">成功</button>
    <button matButton (click)="error()">错误</button>
    <button matButton (click)="action()">带操作</button>
  `,
})
export class NotifyDemoComponent {
  private snackBar = inject(MatSnackBar);

  success() {
    this.snackBar.open('保存成功', '关闭', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['mat-snackbar-success'],
    });
  }

  error() {
    this.snackBar.open('删除失败：网络错误', '重试', {
      duration: 0,        // 0 = 不自动关闭
      panelClass: ['mat-snackbar-error'],
    });
  }

  action() {
    const ref = this.snackBar.open('已归档', '撤销', {
      duration: 5000,
    });

    ref.onAction().subscribe(() => {
      console.log('用户点击撤销');
    });
  }
}
```

### 自定义组件 snack-bar

```ts
@Component({
  selector: 'app-custom-snackbar',
  standalone: true,
  imports: [MatIcon, MatButton, MatSnackBarLabel, MatSnackBarActions, MatSnackBarAction],
  template: `
    <mat-icon>check_circle</mat-icon>
    <span matSnackBarLabel>{{ data.message }}</span>
    <span matSnackBarActions>
      <button matButton matSnackBarAction (click)="snackRef.dismissWithAction()">
        {{ data.action }}
      </button>
    </span>
  `,
})
export class CustomSnackbarComponent {
  snackRef = inject(MatSnackBarRef);
  data = inject(MAT_SNACK_BAR_DATA);
}

// 用法
this.snackBar.openFromComponent(CustomSnackbarComponent, {
  data: { message: '操作完成', action: '关闭' },
  duration: 3000,
});
```

## MatTabs 标签页

```ts
import { MatTabGroup, MatTab, MatTabLabel } from '@angular/material/tabs';

@Component({
  selector: 'app-tabs-demo',
  standalone: true,
  imports: [MatTabGroup, MatTab, MatTabLabel, MatIcon],
  template: `
    <mat-tab-group [(selectedIndex)]="active">
      <mat-tab label="概览">
        <h3>概览内容</h3>
        <p>这里是概览页面...</p>
      </mat-tab>

      <mat-tab>
        <ng-template mat-tab-label>
          <mat-icon>analytics</mat-icon>
          数据分析
        </ng-template>
        <h3>数据分析内容</h3>
      </mat-tab>

      <mat-tab label="设置" disabled>
        <h3>设置（已禁用）</h3>
      </mat-tab>
    </mat-tab-group>
  `,
})
export class TabsDemoComponent {
  active = signal(0);
}
```

### 路由集成（MatTabNav）

```html
<nav mat-tab-nav-bar [tabPanel]="tabPanel">
  @for (link of navLinks; track link.path) {
    <a
      mat-tab-link
      [routerLink]="link.path"
      routerLinkActive
      #rla="routerLinkActive"
      [active]="rla.isActive">
      {{ link.label }}
    </a>
  }
</nav>
<mat-tab-nav-panel #tabPanel>
  <router-outlet></router-outlet>
</mat-tab-nav-panel>
```

## MatStepper 步骤器

```ts
import { MatStepper, MatStep, MatStepLabel } from '@angular/material/stepper';

@Component({
  imports: [MatStepper, MatStep, MatStepLabel, /* ... */],
  template: `
    <mat-stepper #stepper>
      <!-- 第 1 步 -->
      <mat-step [stepControl]="firstFormGroup">
        <ng-template matStepLabel>填写用户信息</ng-template>
        <form [formGroup]="firstFormGroup">
          <mat-form-field appearance="outline">
            <mat-label>姓名</mat-label>
            <input matInput formControlName="name" required>
          </mat-form-field>
        </form>
        <div>
          <button matButton matStepperNext>下一步</button>
        </div>
      </mat-step>

      <!-- 第 2 步 -->
      <mat-step [stepControl]="secondFormGroup">
        <ng-template matStepLabel>填写地址</ng-template>
        <form [formGroup]="secondFormGroup">
          <mat-form-field appearance="outline">
            <mat-label>地址</mat-label>
            <input matInput formControlName="address" required>
          </mat-form-field>
        </form>
        <div>
          <button matButton matStepperPrevious>上一步</button>
          <button matButton matStepperNext>下一步</button>
        </div>
      </mat-step>

      <!-- 第 3 步 -->
      <mat-step>
        <ng-template matStepLabel>确认</ng-template>
        <p>所有信息填写完成。</p>
        <button matButton matStepperPrevious>上一步</button>
        <button matButton="filled" color="primary" (click)="stepper.reset()">提交</button>
      </mat-step>
    </mat-stepper>
  `,
})
```

## @angular/cdk 完整方案

CDK 是 Angular Material 的底层行为底座——**Angular 生态的 Radix + Headless UI + Floating UI 三合一**。本节覆盖最重要的 6 个模块。

### Overlay（浮层）

`@angular/cdk/overlay` 是所有 dialog / menu / tooltip / autocomplete 的底层——**自定义浮层场景必备**。

```ts
import { Component, inject, ViewChild, ElementRef } from '@angular/core';
import { Overlay, OverlayRef, OverlayPositionBuilder } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { ViewContainerRef, TemplateRef } from '@angular/core';

@Component({
  selector: 'app-custom-popover',
  template: `
    <button #trigger matButton (click)="showPopover()">显示浮层</button>

    <ng-template #popoverContent>
      <div class="custom-popover">
        <p>这是自定义浮层内容！</p>
        <button matButton (click)="closePopover()">关闭</button>
      </div>
    </ng-template>
  `,
})
export class CustomPopoverComponent {
  @ViewChild('trigger', { read: ElementRef }) trigger!: ElementRef;
  @ViewChild('popoverContent') template!: TemplateRef<unknown>;

  private overlay = inject(Overlay);
  private vcr = inject(ViewContainerRef);
  private overlayRef: OverlayRef | null = null;

  showPopover() {
    const positionStrategy = this.overlay.position()
      .flexibleConnectedTo(this.trigger)
      .withPositions([
        { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top' },
      ]);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
    });

    const portal = new TemplatePortal(this.template, this.vcr);
    this.overlayRef.attach(portal);

    // 点击 backdrop 关闭
    this.overlayRef.backdropClick().subscribe(() => this.closePopover());
  }

  closePopover() {
    this.overlayRef?.dispose();
    this.overlayRef = null;
  }
}
```

### Portal（传送门）

`@angular/cdk/portal` 把内容渲染到 DOM 任意位置——类似 Vue Teleport / React Portal。

```ts
import { Portal, ComponentPortal, TemplatePortal } from '@angular/cdk/portal';
import { CdkPortalOutlet } from '@angular/cdk/portal';

@Component({
  imports: [CdkPortalOutlet],
  template: `
    <!-- 切换不同 portal -->
    <ng-template [cdkPortalOutlet]="selectedPortal"></ng-template>

    <button (click)="selectedPortal = comp">渲染组件</button>
    <button (click)="selectedPortal = tpl">渲染模板</button>
  `,
})
export class PortalDemoComponent {
  comp = new ComponentPortal(MyDynamicComponent);
  tpl = new TemplatePortal(this.myTemplate, this.vcr);

  selectedPortal: Portal<unknown> | null = null;
}
```

### A11y（可访问性）

`@angular/cdk/a11y` 提供 focus / list keyboard / screen reader 工具。

```ts
import { Component, inject, ViewChild } from '@angular/core';
import { FocusTrap, FocusTrapFactory, FocusMonitor, LiveAnnouncer } from '@angular/cdk/a11y';

@Component({
  selector: 'app-a11y-demo',
  template: `
    <div #trap>
      <input>
      <button>确认</button>
      <button (click)="release()">取消</button>
    </div>

    <button (click)="announce()">公告</button>
  `,
})
export class A11yDemoComponent implements AfterViewInit {
  @ViewChild('trap') trapEl!: ElementRef;
  private focusTrapFactory = inject(FocusTrapFactory);
  private announcer = inject(LiveAnnouncer);
  private focusTrap?: FocusTrap;

  ngAfterViewInit() {
    /** 锁定焦点在容器内 */
    this.focusTrap = this.focusTrapFactory.create(this.trapEl.nativeElement);
  }

  release() {
    this.focusTrap?.destroy();
  }

  announce() {
    /** 给屏幕阅读器播报 */
    this.announcer.announce('操作已完成', 'polite');
  }
}
```

### LayoutModule（断点观察）

`@angular/cdk/layout` 提供响应式断点工具。

```ts
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { map, toSignal } from '@angular/core/rxjs-interop';

@Component({
  template: `
    @if (isMobile()) {
      <p>移动端布局</p>
    } @else {
      <p>桌面端布局</p>
    }
  `,
})
export class ResponsiveDemoComponent {
  private breakpointObserver = inject(BreakpointObserver);

  isMobile = toSignal(
    this.breakpointObserver.observe([Breakpoints.Handset]).pipe(map((r) => r.matches)),
    { initialValue: false },
  );
}
```

预设 Breakpoints（来自 Material Design spec）：

```ts
Breakpoints.XSmall          // (max-width: 599.98px)
Breakpoints.Small           // (min-width: 600px) and (max-width: 959.98px)
Breakpoints.Medium          // (min-width: 960px) and (max-width: 1279.98px)
Breakpoints.Large           // (min-width: 1280px) and (max-width: 1919.98px)
Breakpoints.XLarge          // (min-width: 1920px)

Breakpoints.Handset         // 手机（竖 + 横）
Breakpoints.Tablet          // 平板
Breakpoints.Web             // 桌面

Breakpoints.HandsetPortrait
Breakpoints.HandsetLandscape
Breakpoints.TabletPortrait
Breakpoints.TabletLandscape
Breakpoints.WebPortrait
Breakpoints.WebLandscape
```

### DragDropModule（拖拽）

`@angular/cdk/drag-drop` 是 Angular 生态最强大的拖拽工具——支持排序 / 跨容器拖动 / 自定义占位 / 边界约束。

```ts
import { CdkDrag, CdkDropList, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  imports: [CdkDropList, CdkDrag],
  template: `
    <div cdkDropList (cdkDropListDropped)="drop($event)">
      @for (item of items; track item) {
        <div class="box" cdkDrag>{{ item }}</div>
      }
    </div>
  `,
  styles: [`
    .box {
      padding: 8px;
      margin: 4px 0;
      background: var(--mat-sys-surface-container);
      cursor: move;
    }
  `],
})
export class DragDropDemoComponent {
  items = ['项目 1', '项目 2', '项目 3', '项目 4'];

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.items, event.previousIndex, event.currentIndex);
  }
}
```

### v20 resetToBoundary()

v20 新增的 `resetToBoundary()` 方法——当 drag 容器尺寸动态变化时，让 dragged 元素回到新边界内。

```ts
import { CdkDrag } from '@angular/cdk/drag-drop';

@Component({
  template: `<div cdkDrag [cdkDragBoundary]="boundary" #drag="cdkDrag">拖我</div>`,
})
export class DynamicBoundaryComponent {
  @ViewChild('drag') drag!: CdkDrag;

  onContainerResize() {
    // 容器尺寸变化后，把拖拽元素重新约束到新边界内
    this.drag.resetToBoundary();
  }
}
```

### ScrollingModule（虚拟滚动）

`@angular/cdk/scrolling` 提供虚拟滚动——10W+ 行列表流畅渲染。

```ts
import { CdkVirtualScrollViewport, CdkFixedSizeVirtualScroll, CdkVirtualForOf } from '@angular/cdk/scrolling';

@Component({
  imports: [CdkVirtualScrollViewport, CdkFixedSizeVirtualScroll, CdkVirtualForOf],
  template: `
    <cdk-virtual-scroll-viewport itemSize="50" class="viewport">
      <div *cdkVirtualFor="let item of items" class="item">
        {{ item }}
      </div>
    </cdk-virtual-scroll-viewport>
  `,
  styles: [`
    .viewport {
      height: 400px;
      width: 100%;
    }
    .item {
      height: 50px;
      padding: 8px;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
    }
  `],
})
export class VirtualScrollDemoComponent {
  items = Array.from({ length: 100000 }, (_, i) => `项目 ${i + 1}`);
}
```

## mat.theme() 完整主题 API

v19 引入、v20 默认的现代主题 API——单 mixin 完成 color + typography + density 三大维度。

### 完整签名

```scss
@include mat.theme((
  color: <Palette | ColorMap>,
  typography: <Font | TypographyMap>,
  density: <0 | -1 | -2 | -3 | -4 | -5>,
), $overrides: <Map>);
```

### Color 完整选项

```scss
@use '@angular/material' as mat;

html {
  color-scheme: light dark;

  /* 方式 1: 单 palette - primary / secondary / tertiary 自动 derive */
  @include mat.theme((
    color: mat.$violet-palette,
    typography: Roboto,
    density: 0,
  ));

  /* 方式 2: 色彩 map - 显式分离 primary + tertiary */
  @include mat.theme((
    color: (
      primary: mat.$violet-palette,
      tertiary: mat.$orange-palette,
      theme-type: color-scheme,    /* color-scheme | light | dark */
      use-system-variables: false,  /* 高级：用系统 CSS variables */
    ),
    typography: Roboto,
    density: 0,
  ));
}
```

### 自定义 palette（schematic 生成）

`ng generate @angular/material:theme-color` 基于一个主色生成完整 Material 3 palette：

```bash
ng generate @angular/material:theme-color

# 交互式询问：
# Primary color: #6750A4    (主色 HEX)
# Secondary color: #625B71  (可选)
# Tertiary color: #7D5260
# Neutral color: #605D62

# 输出文件：
# src/styles/m3-theme.scss      (完整 palette 文件)
```

生成的 `m3-theme.scss` 类似：

```scss
@use 'sass:map';
@use '@angular/material' as mat;

$_palettes: (
  primary: (
    0: #000000,
    10: #21005d,
    20: #381e72,
    25: #432b7c,
    /* ... 全部 13 个 tone */
    99: #fffbfe,
    100: #ffffff,
  ),
  secondary: (...),
  tertiary: (...),
  neutral: (...),
  neutral-variant: (...),
  error: (...),
);

$primary-palette: map.merge(map.get($_palettes, primary), $_palettes);
$tertiary-palette: map.merge(map.get($_palettes, tertiary), $_palettes);

$theme: (
  color: (
    theme-type: light,
    primary: $primary-palette,
    tertiary: $tertiary-palette,
  ),
  typography: Roboto,
  density: 0,
);
```

然后在 `styles.scss` 引用：

```scss
@use '@angular/material' as mat;
@use './styles/m3-theme';

html {
  color-scheme: light dark;
  @include mat.theme(m3-theme.$theme);
}
```

### Typography 完整选项

```scss
@include mat.theme((
  color: mat.$violet-palette,

  /* 单字体 - 所有文本统一 */
  typography: Roboto,

  /* 或：完整 map */
  typography: (
    plain-family: Roboto,              /* 正文字体（label / body / 普通） */
    brand-family: 'Open Sans',         /* 品牌字体（display / headline） */
    bold-weight: 700,
    medium-weight: 500,
    regular-weight: 400,
  ),

  density: 0,
));
```

Material 3 typography 14 个级别（在 `--mat-sys-*` 变量中暴露）：

```scss
--mat-sys-display-large
--mat-sys-display-medium
--mat-sys-display-small
--mat-sys-headline-large
--mat-sys-headline-medium
--mat-sys-headline-small
--mat-sys-title-large
--mat-sys-title-medium
--mat-sys-title-small
--mat-sys-body-large
--mat-sys-body-medium
--mat-sys-body-small
--mat-sys-label-large
--mat-sys-label-medium
--mat-sys-label-small
```

### 用 CSS Variables 应用主题

```scss
.my-card {
  background: var(--mat-sys-surface-container);
  color: var(--mat-sys-on-surface);
  border: 1px solid var(--mat-sys-outline-variant);
  border-radius: var(--mat-sys-corner-medium);
  padding: var(--mat-sys-spacing-medium);
  font: var(--mat-sys-body-large);
}

.my-banner {
  background: var(--mat-sys-primary-container);
  color: var(--mat-sys-on-primary-container);
}

.error-message {
  color: var(--mat-sys-error);
  font: var(--mat-sys-body-small);
}
```

### Utility Classes（mat.system-classes()）

```scss
@use '@angular/material' as mat;

html {
  color-scheme: light dark;
  @include mat.theme((...));

  /* 启用 utility classes */
  @include mat.system-classes();
}
```

```html
<!-- 直接用 utility class -->
<div class="mat-bg-primary mat-text-on-primary mat-font-body-lg">
  Primary 背景内容
</div>

<div class="mat-bg-surface-container mat-text-on-surface">
  Surface 卡片
</div>
```

## Material 3 design tokens 全集

Angular Material 把 Material Design 3 的所有 token 暴露为 CSS Variables——按系统层次分 5 大类。

### Color Tokens（45+）

```css
/* Primary 系列（9个） */
--mat-sys-primary
--mat-sys-on-primary
--mat-sys-primary-container
--mat-sys-on-primary-container
--mat-sys-primary-fixed
--mat-sys-on-primary-fixed
--mat-sys-on-primary-fixed-variant
--mat-sys-primary-fixed-dim
--mat-sys-inverse-primary

/* Secondary 系列（8个） */
--mat-sys-secondary
--mat-sys-on-secondary
--mat-sys-secondary-container
--mat-sys-on-secondary-container
/* ... */

/* Tertiary 系列（8个） */
--mat-sys-tertiary
--mat-sys-on-tertiary
/* ... */

/* Error 系列（4个） */
--mat-sys-error
--mat-sys-on-error
--mat-sys-error-container
--mat-sys-on-error-container

/* Surface 系列（13个） */
--mat-sys-surface
--mat-sys-on-surface
--mat-sys-on-surface-variant
--mat-sys-surface-bright
--mat-sys-surface-container
--mat-sys-surface-container-high
--mat-sys-surface-container-highest
--mat-sys-surface-container-low
--mat-sys-surface-container-lowest
--mat-sys-surface-dim
--mat-sys-surface-tint
--mat-sys-surface-variant
--mat-sys-inverse-surface
--mat-sys-inverse-on-surface

/* 杂项 */
--mat-sys-background
--mat-sys-on-background
--mat-sys-outline
--mat-sys-outline-variant
--mat-sys-scrim
--mat-sys-shadow
```

### Typography Tokens（14 个 level + N 个细粒度）

```css
/* 14 个 typography level（font 简写） */
--mat-sys-display-large
--mat-sys-display-medium
--mat-sys-display-small
--mat-sys-headline-large
--mat-sys-headline-medium
--mat-sys-headline-small
--mat-sys-title-large
--mat-sys-title-medium
--mat-sys-title-small
--mat-sys-body-large
--mat-sys-body-medium
--mat-sys-body-small
--mat-sys-label-large
--mat-sys-label-medium
--mat-sys-label-small

/* 细粒度（每个 level 都有） */
--mat-sys-body-large-font
--mat-sys-body-large-size
--mat-sys-body-large-weight
--mat-sys-body-large-line-height
--mat-sys-body-large-tracking
```

### Shape Tokens（5 个）

```css
--mat-sys-corner-extra-small        /* 4px */
--mat-sys-corner-small              /* 8px */
--mat-sys-corner-medium             /* 12px */
--mat-sys-corner-large              /* 16px */
--mat-sys-corner-extra-large        /* 28px */
```

### Elevation Tokens（6 个）

```css
--mat-sys-level0                     /* 无阴影 */
--mat-sys-level1
--mat-sys-level2
--mat-sys-level3
--mat-sys-level4
--mat-sys-level5
```

### State Tokens

```css
--mat-sys-hover-state-layer-opacity
--mat-sys-focus-state-layer-opacity
--mat-sys-pressed-state-layer-opacity
--mat-sys-dragged-state-layer-opacity
```

## Token 双层定制

Angular Material 提供 system token 和 component token 两层精细化定制——**不需要 hack CSS 选择器**。

### System Token 全局覆盖

```scss
@use '@angular/material' as mat;

html {
  color-scheme: light dark;
  @include mat.theme((
    color: mat.$violet-palette,
    typography: Roboto,
    density: 0,
  ));

  /* 覆盖 primary-container 系统 token */
  @include mat.theme-overrides((
    primary-container: #84ffff,
    on-primary-container: #003a3a,
  ));
}
```

### Component Token（单个组件覆盖）

每个组件都有 `mat.{component}-overrides()` mixin——例如 Card：

```scss
html {
  /* 覆盖所有 Card 组件 */
  @include mat.card-overrides((
    elevated-container-color: #fef7ff,
    elevated-container-shape: 24px,
    title-text-size: 1.5rem,
    title-text-weight: 700,
    subtitle-text-size: 1rem,
  ));

  /* 覆盖所有 Button */
  @include mat.button-overrides((
    filled-container-color: #4a154b,
    filled-label-text-color: #ffffff,
    filled-container-shape: 100px,    /* 全圆角 pill 风格 */
  ));

  /* 覆盖 Form Field */
  @include mat.form-field-overrides((
    outlined-outline-color: #4a154b,
    outlined-focus-outline-color: #6750a4,
    outlined-label-text-color: #4a154b,
  ));
}
```

### 局部 scope 覆盖

```scss
.brand-section {
  @include mat.card-overrides((
    elevated-container-color: gold,
  ));
}

.danger-zone {
  @include mat.button-overrides((
    filled-container-color: var(--mat-sys-error),
  ));
}
```

## 多主题（context-specific）

`mat.theme()` 可调用多次——在不同 CSS scope 内应用不同主题。

```scss
@use '@angular/material' as mat;

html {
  color-scheme: light dark;

  /* 全局主题 */
  @include mat.theme((
    color: mat.$violet-palette,
    typography: Roboto,
    density: 0,
  ));
}

/* 警告区域用红色主题 */
.danger-zone {
  @include mat.theme((
    color: mat.$red-palette,
  ));
}

/* 高强调区域用青色主题 */
.bright-container {
  @include mat.theme((
    color: mat.$cyan-palette,
  ));
}
```

## Strong Focus Indicators

WCAG 4.5:1 对比度要求强焦点指示——一行启用。

```scss
@use '@angular/material' as mat;

html {
  color-scheme: light dark;
  @include mat.theme((...));

  /* 默认配置 */
  @include mat.strong-focus-indicators();

  /* 或自定义 */
  @include mat.strong-focus-indicators((
    border-color: red,
    border-style: dotted,
    border-width: 4px,
    border-radius: 2px,
  ));
}
```

## Material 2 兼容（旧项目过渡）

v20 仍保留 Material 2 API（带 `m2-` 前缀），但**强烈推荐迁移到 M3**。

### M2 API（仅过渡）

```scss
@use '@angular/material' as mat;

@include mat.core();

$my-primary: mat.m2-define-palette(mat.$m2-indigo-palette, 500);
$my-accent: mat.m2-define-palette(mat.$m2-pink-palette, A200, A100, A400);
$my-warn: mat.m2-define-palette(mat.$m2-red-palette);

$my-theme: mat.m2-define-light-theme((
  color: (
    primary: $my-primary,
    accent: $my-accent,
    warn: $my-warn,
  ),
  typography: mat.m2-define-typography-config(),
  density: 0,
));

@include mat.all-component-themes($my-theme);
```

### 迁移到 M3

```bash
# Angular 官方迁移 schematic（自动重写 theme 文件）
ng update @angular/material
```

## Component Harness 测试

`@angular/cdk/testing` 提供组件测试 harness——**Angular 官方推荐的稳定测试 API**。

### 单元测试基础

```ts
// app.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let loader: HarnessLoader;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('should load all buttons', async () => {
    const buttons = await loader.getAllHarnesses(MatButtonHarness);
    expect(buttons.length).toBe(3);
  });

  it('should click submit button', async () => {
    const submitBtn = await loader.getHarness(MatButtonHarness.with({ text: '提交' }));
    await submitBtn.click();

    expect(component.submitted()).toBe(true);
  });

  it('should fill input', async () => {
    const input = await loader.getHarness(MatInputHarness.with({ placeholder: '用户名' }));
    await input.setValue('alice');

    const value = await input.getValue();
    expect(value).toBe('alice');
  });
});
```

### 常用 Harness API

| Harness | 关键方法 |
| --- | --- |
| `MatButtonHarness` | `click()` / `isDisabled()` / `getText()` |
| `MatInputHarness` | `setValue()` / `getValue()` / `getPlaceholder()` |
| `MatSelectHarness` | `open()` / `clickOptions()` / `getValueText()` |
| `MatCheckboxHarness` | `check()` / `uncheck()` / `isChecked()` |
| `MatDialogHarness` | `close()` / `getText()` |
| `MatTableHarness` | `getRows()` / `getCellTextByIndex()` |
| `MatPaginatorHarness` | `goToNextPage()` / `setPageSize()` |
| `MatSnackBarHarness` | `dismiss()` / `getMessage()` |

### 子区域查询

```ts
it('should only load buttons in toolbar', async () => {
  // 在 .toolbar 子区域查找
  const toolbarLoader = await loader.getChildLoader('.toolbar');
  const buttons = await toolbarLoader.getAllHarnesses(MatButtonHarness);
  expect(buttons.length).toBe(2);
});
```

## Angular Router 集成

### MatNavList + routerLink

```ts
import { MatNavList, MatListItem, MatListItemIcon, MatListItemTitle } from '@angular/material/list';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [MatNavList, MatListItem, MatListItemIcon, MatListItemTitle, MatIcon, RouterLink, RouterLinkActive],
  template: `
    <mat-nav-list>
      <a mat-list-item routerLink="/dashboard" routerLinkActive="active">
        <mat-icon matListItemIcon>dashboard</mat-icon>
        <span matListItemTitle>仪表板</span>
      </a>
      <a mat-list-item routerLink="/users" routerLinkActive="active">
        <mat-icon matListItemIcon>people</mat-icon>
        <span matListItemTitle>用户</span>
      </a>
      <a mat-list-item routerLink="/settings" routerLinkActive="active">
        <mat-icon matListItemIcon>settings</mat-icon>
        <span matListItemTitle>设置</span>
      </a>
    </mat-nav-list>
  `,
})
```

### MatTabNav 与 Router

```html
<nav mat-tab-nav-bar [tabPanel]="tabPanel">
  <a
    mat-tab-link
    routerLink="overview"
    routerLinkActive
    #o="routerLinkActive"
    [active]="o.isActive">
    概览
  </a>
  <a
    mat-tab-link
    routerLink="analytics"
    routerLinkActive
    #a="routerLinkActive"
    [active]="a.isActive">
    数据分析
  </a>
</nav>
<mat-tab-nav-panel #tabPanel>
  <router-outlet></router-outlet>
</mat-tab-nav-panel>
```

## 常见踩坑

### 1. M2 主题 API 迁移到 M3

**症状**：升级到 Angular 19 / 20 后，`mat.define-light-theme()` 报 deprecation warning。

**原因**：v19 引入 `mat.theme()`、v20 默认。`mat.define-light-theme()` 是 M2 旧 API、被 `mat.m2-define-light-theme()` 替代（加 `m2-` 前缀）。

**解决**：

- **新项目**：用 `mat.theme()` 新 API
- **旧项目过渡**：把 `mat.define-light-theme` 全替换为 `mat.m2-define-light-theme`、`mat.$indigo-palette` → `mat.$m2-indigo-palette`
- **自动迁移**：`ng update @angular/material` 自动重写

### 2. v20 token 重命名 `--mdc-*` → `--mat-*`

**症状**：从 v19 升 v20 后，自定义 SCSS 里的 `--mdc-outlined-card-container-shape` 不生效。

**原因**：v20 把所有 MDC（Material Design Components for Web）前缀 token 重命名为 `--mat-*`。

**解决**：

```scss
/* 旧 v19 */
.my-card {
  --mdc-outlined-card-container-shape: 16px;
}

/* 新 v20 */
.my-card {
  --mat-card-outlined-container-shape: 16px;
}

/* 推荐：用 component override mixin，自动用对的 token */
@include mat.card-overrides((
  outlined-container-shape: 16px,
));
```

### 3. Datepicker 没适配器报错

**症状**：`<mat-datepicker>` 弹不出来 / 控制台报 `MatDateAdapter is required`。

**原因**：MatDatepicker 不内置日期库。

**解决**：在 `app.config.ts` provide 一个 DateAdapter：

```ts
import { provideNativeDateAdapter } from '@angular/material/core';

export const appConfig = {
  providers: [
    provideNativeDateAdapter(),    // 必须
  ],
};
```

### 4. Material Icons 国内 CDN 慢

**症状**：`<mat-icon>` 图标加载慢、出现 "home" 文字几秒后才变图标。

**原因**：Google Fonts CDN 国内访问慢。

**解决**（推荐生产）：自托管 Material Symbols + SCSS unicode-range 子集化：

```scss
@font-face {
  font-family: 'Material Symbols Outlined';
  font-style: normal;
  font-weight: 400;
  src: url('/fonts/material-symbols-outlined.woff2') format('woff2');
  unicode-range: U+E000-F8FF;
}

mat-icon {
  font-family: 'Material Symbols Outlined' !important;
}
```

或换成 SVG 图标注册（见 getting-started 章节）。

### 5. Tailwind 优先级冲突

**症状**：Material 内部样式覆盖 Tailwind utility class。

**解决**：CSS Layers：

```scss
@layer base, mat-theme, components, utilities;

@layer mat-theme {
  @include mat.theme((...));
}

@import 'tailwindcss';     /* 进 utilities layer，自动覆盖 mat-theme */
```

### 6. provideAnimationsAsync() vs provideAnimations()

**症状**：选 `provideAnimationsAsync()` 后，首次打开 dialog 卡顿 100-300ms。

**原因**：`provideAnimationsAsync()` lazy-load `@angular/animations`、首次触发组件时才下载。

**解决**：

- **追求首屏快**：保持 `provideAnimationsAsync()`，接受首次轻微卡顿
- **追求即时动画**：切换到 `provideAnimations()` 把 animation 立刻进主 bundle

### 7. Standalone 组件子指令忘 import

**症状**：`<mat-label>` 报 `'mat-label' is not a known element`。

**原因**：MatLabel / MatHint / MatError / MatPrefix / MatSuffix 各自是独立 directive、必须各自 import。

**解决**：

```ts
import {
  MatFormField,
  MatLabel,
  MatError,
  MatHint,
  MatPrefix,
  MatSuffix,
} from '@angular/material/form-field';

@Component({
  standalone: true,
  imports: [MatFormField, MatLabel, MatError, MatHint, MatPrefix, MatSuffix /* 全部 */],
})
```

### 8. SSR 主题闪烁

**症状**：Angular Universal SSR 首屏出现浅色主题、然后切到深色（用户偏好）。

**原因**：服务端无法知道用户系统偏好、默认 light。

**解决**：

- **推荐**：用 `color-scheme: light dark` 让浏览器在 hydration 前就读偏好
- **生产**：在登录前用 cookie / localStorage 保存用户主题、SSR 时通过 SSR context 注入 html class

### 9. MatTable 数据更新后不重渲染

**症状**：直接修改 `dataSource.data.push(newItem)`，但表格不刷新。

**原因**：`MatTableDataSource` 内部用 `===` 比较引用。

**解决**：替换数组引用而非 mutate：

```ts
// 错误
this.dataSource.data.push(newItem);

// 正确
this.dataSource.data = [...this.dataSource.data, newItem];
```

### 10. MatDialog 注入 data 类型不安全

**症状**：`inject(MAT_DIALOG_DATA)` 返回 `any`、类型不安全。

**解决**：用泛型注入：

```ts
import { inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

interface ConfirmData {
  title: string;
  message: string;
}

@Component({...})
export class ConfirmComponent {
  data = inject<ConfirmData>(MAT_DIALOG_DATA);
  ref = inject<MatDialogRef<ConfirmComponent, boolean>>(MatDialogRef);
}
```

---

至此 Angular Material 的 60+ 组件、CDK 底层、`mat.theme()` 主题、Component Harness 测试已完整覆盖。详细组件 API 表请见[参考](./reference.md)。
