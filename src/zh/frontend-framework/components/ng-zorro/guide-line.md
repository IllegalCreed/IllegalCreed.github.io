---
layout: doc
outline: [2, 3]
---

# 指南

NG-ZORRO 70+ 组件覆盖企业级中后台所有场景。本章按「组件全景 → 表单深度 → 数据表完整 → 反馈服务 → 主题与图标 → 国际化 → 配置体系 → SSR → 踩坑」串成一条完整链路。

## 组件全景

NG-ZORRO 70+ 组件按 **7 大类别**组织，与 Ant Design React 版**一比一对应**。

### General（4 个）

通用组件——按钮、图标、文字。

| 组件 | 用途 | Selector |
| --- | --- | --- |
| **NzButton** | 标准按钮 | `[nz-button]`（属性指令） |
| **NzFloatButton** | 浮动操作按钮（FAB） | `<nz-float-button>` |
| **NzIcon** | 图标 | `<nz-icon>` |
| **NzTypography** | 标题、段落、文本格式 | `nz-typography` 系列 |

### Layout（6 个）

布局——栅格、间距、分隔、分屏。

| 组件 | 用途 |
| --- | --- |
| **NzGrid** | 24 栅格响应式布局 (`nz-row` / `nz-col`) |
| **NzFlex** | Flex 容器 (`<nz-flex>`) |
| **NzLayout** | 整页布局 (`nz-layout` / `nz-header` / `nz-sider` / `nz-content` / `nz-footer`) |
| **NzSpace** | 间距 (`<nz-space>`) |
| **NzDivider** | 分割线 (`<nz-divider>`) |
| **NzSplitter** | 可拖拽分屏 (`<nz-splitter>`) |

### Navigation（8 个）

导航——菜单、面包屑、tabs、分页、步骤。

| 组件 | 用途 |
| --- | --- |
| **NzMenu** | 主导航菜单 (`<ul nz-menu>`) |
| **NzBreadcrumb** | 面包屑 (`<nz-breadcrumb>`) |
| **NzTabs** | Tabs 标签页 (`<nz-tabset>`) |
| **NzPagination** | 分页 (`<nz-pagination>`) |
| **NzSteps** | 步骤条 (`<nz-steps>`) |
| **NzAnchor** | 锚点导航 (`<nz-anchor>`) |
| **NzDropdown** | 下拉菜单 (`[nz-dropdown]` 指令) |
| **NzPageHeader** | 页头 (`<nz-page-header>`) |

### Data Entry（18 个）

数据录入——表单、输入、选择器、日期、上传等。

| 组件 | 用途 |
| --- | --- |
| **NzForm** | 表单 (`<form nz-form>` + `nz-form-item` + `nz-form-label` + `nz-form-control`) |
| **NzInput** | 文本输入 (`<input nz-input>`) |
| **NzInputNumber** | 数字输入 (`<nz-input-number>`) |
| **NzSelect** | 下拉选择 (`<nz-select>`) |
| **NzAutoComplete** | 自动补全 (`<input nz-input [nzAutocomplete]>`) |
| **NzCascader** | 级联选择 (`<nz-cascader>`) |
| **NzCheckbox** | 复选框 (`[nz-checkbox]`) |
| **NzColorPicker** | 颜色选择 (`<nz-color-picker>`) |
| **NzDatePicker** | 日期选择 (`<nz-date-picker>` / `nz-range-picker` / `nz-month-picker` / `nz-week-picker` / `nz-year-picker`) |
| **NzMention** | @ 提及 (`<nz-mention>`) |
| **NzRadio** | 单选 (`[nz-radio]` + `nz-radio-group`) |
| **NzRate** | 评分 (`<nz-rate>`) |
| **NzSlider** | 滑块 (`<nz-slider>`) |
| **NzSwitch** | 开关 (`<nz-switch>`) |
| **NzTimePicker** | 时间选择 (`<nz-time-picker>`) |
| **NzTransfer** | 穿梭框 (`<nz-transfer>`) |
| **NzTreeSelect** | 树选择 (`<nz-tree-select>`) |
| **NzUpload** | 上传 (`<nz-upload>`) |

### Data Display（21 个）

数据展示——表格、树、列表、卡片、统计等。

| 组件 | 用途 |
| --- | --- |
| **NzTable** | 数据表 (`<nz-table>`) |
| **NzTree** | 树 (`<nz-tree>`) |
| **NzTreeView** | 增强树视图 (`<nz-tree-view>`) |
| **NzList** | 列表 (`<nz-list>`) |
| **NzCard** | 卡片 (`<nz-card>`) |
| **NzDescriptions** | 描述列表 (`<nz-descriptions>`) |
| **NzStatistic** | 统计数值 (`<nz-statistic>`) |
| **NzAvatar** | 头像 (`<nz-avatar>`) |
| **NzBadge** | 徽标 (`<nz-badge>`) |
| **NzCalendar** | 日历 (`<nz-calendar>`) |
| **NzCarousel** | 走马灯 (`<nz-carousel>`) |
| **NzCollapse** | 折叠面板 (`<nz-collapse>`) |
| **NzComment** | 评论 (`<nz-comment>`) |
| **NzEmpty** | 空状态 (`<nz-empty>`) |
| **NzImage** | 图片预览 (`<img nz-image>`) |
| **NzPopover** | 弹出气泡 (`[nz-popover]` 指令) |
| **NzQRCode** | 二维码 (`<nz-qrcode>`) |
| **NzSegmented** | 分段控制器 (`<nz-segmented>`) |
| **NzTag** | 标签 (`<nz-tag>`) |
| **NzTimeline** | 时间轴 (`<nz-timeline>`) |
| **NzTooltip** | 文字提示 (`[nz-tooltip]` 指令) |

### Feedback（10 个）

反馈——消息、模态、通知、加载、警告。

| 组件 | 用途 |
| --- | --- |
| **NzMessage** | 全局消息 (`NzMessageService`) |
| **NzNotification** | 通知提醒 (`NzNotificationService`) |
| **NzModal** | 模态对话框 (`<nz-modal>` / `NzModalService`) |
| **NzDrawer** | 抽屉 (`<nz-drawer>` / `NzDrawerService`) |
| **NzAlert** | 警告提示 (`<nz-alert>`) |
| **NzSpin** | 加载中 (`<nz-spin>`) |
| **NzPopconfirm** | 气泡确认 (`[nz-popconfirm]` 指令) |
| **NzProgress** | 进度 (`<nz-progress>`) |
| **NzResult** | 结果反馈 (`<nz-result>`) |
| **NzSkeleton** | 骨架屏 (`<nz-skeleton>`) |

### Other（2 个）

其他——固定 / 水印。

| 组件 | 用途 |
| --- | --- |
| **NzAffix** | 固钉 (`<nz-affix>`) |
| **NzWatermark** | 水印 (`<nz-watermark>`) |

## NzForm + Reactive Forms 完整方案

中后台最高频场景。NG-ZORRO 的表单与 Angular Reactive Forms 深度集成。

### 基础结构

```html
<form nz-form [formGroup]="form" nzLayout="horizontal">
  <nz-form-item>
    <nz-form-label [nzSpan]="6" nzRequired nzFor="name">姓名</nz-form-label>
    <nz-form-control [nzSpan]="14" nzErrorTip="请输入姓名">
      <input nz-input id="name" formControlName="name">
    </nz-form-control>
  </nz-form-item>
</form>
```

四层结构：

1. **`<form nz-form [formGroup]>`**：宿主 + NG-ZORRO 表单样式 + Reactive Forms FormGroup 绑定
2. **`<nz-form-item>`**：一行字段容器
3. **`<nz-form-label>`**：标签（栅格 `nzSpan` 控制宽度、`nzRequired` 红星、`nzFor` 关联 `<input id>`）
4. **`<nz-form-control>`**：控件区域 + 校验状态显示（`nzErrorTip` / `nzValidateStatus` / `nzHasFeedback`）

### 三种布局

```html
<!-- 水平布局：标签与控件同一行（默认） -->
<form nz-form nzLayout="horizontal">...</form>

<!-- 垂直布局：标签在控件上方 -->
<form nz-form nzLayout="vertical">...</form>

<!-- 行内布局：所有字段一行 -->
<form nz-form nzLayout="inline">...</form>
```

### 错误提示三种方式

```html
<!-- 方式 1：静态 nzErrorTip（最简单、所有错误同一提示） -->
<nz-form-control nzErrorTip="请输入有效邮箱">
  <input nz-input formControlName="email">
</nz-form-control>

<!-- 方式 2：模板 nzErrorTip（按错误类型显示不同提示） -->
<nz-form-control [nzErrorTip]="emailErrorTpl">
  <input nz-input formControlName="email">
  <ng-template #emailErrorTpl let-control>
    @if (control.errors?.['required']) { 邮箱必填 }
    @if (control.errors?.['email']) { 邮箱格式不正确 }
  </ng-template>
</nz-form-control>

<!-- 方式 3：动态 nzValidateStatus + nzExtra -->
<nz-form-control
  [nzValidateStatus]="form.controls['email']"
  nzExtra="extra 永久显示的提示信息"
>
  <input nz-input formControlName="email">
</nz-form-control>
```

### 表单实例 + 校验时机

```ts
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [ReactiveFormsModule, NzFormModule, NzInputModule, NzButtonModule],
  template: `
    <form nz-form [formGroup]="form" (ngSubmit)="submit()">
      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired nzFor="email">邮箱</nz-form-label>
        <nz-form-control [nzSpan]="14" [nzErrorTip]="emailErrTpl" nzHasFeedback>
          <input nz-input id="email" formControlName="email">
          <ng-template #emailErrTpl let-control>
            @if (control.hasError('required')) { 邮箱必填 }
            @if (control.hasError('email')) { 邮箱格式不正确 }
          </ng-template>
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired nzFor="password">密码</nz-form-label>
        <nz-form-control [nzSpan]="14" [nzErrorTip]="passwordErrTpl">
          <input nz-input id="password" formControlName="password" type="password">
          <ng-template #passwordErrTpl let-control>
            @if (control.hasError('required')) { 密码必填 }
            @if (control.hasError('minlength')) { 密码至少 6 位 }
          </ng-template>
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-control [nzOffset]="6" [nzSpan]="14">
          <button nz-button nzType="primary" [disabled]="!form.valid">提交</button>
        </nz-form-control>
      </nz-form-item>
    </form>
  `
})
export class UserFormComponent implements OnInit {
  private fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  ngOnInit(): void {
    // 监听表单值变化（reactive）
    this.form.valueChanges.subscribe(values => {
      console.log('表单值变化', values);
    });
  }

  submit(): void {
    if (this.form.valid) {
      console.log('提交：', this.form.value);
    } else {
      // 触发所有控件 dirty + 重新校验
      Object.values(this.form.controls).forEach(control => {
        control.markAsDirty();
        control.updateValueAndValidity({ onlySelf: true });
      });
    }
  }
}
```

### 异步校验

```ts
import { AsyncValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { of, timer } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

// 异步校验：检查用户名是否被占用
function usernameUniqueValidator(api: ApiService): AsyncValidatorFn {
  return (control: AbstractControl) => {
    return timer(500).pipe(  // debounce 500ms
      switchMap(() => api.checkUsername(control.value)),
      map((exists: boolean) => (exists ? { unique: true } : null))
    );
  };
}

// 使用
this.form = this.fb.nonNullable.group({
  username: ['', [Validators.required], [usernameUniqueValidator(this.api)]]
});
```

模板里配合 `nzValidatingTip` 显示 loading 提示：

```html
<nz-form-control
  nzHasFeedback
  [nzErrorTip]="errTpl"
  nzValidatingTip="正在校验用户名..."
>
  <input nz-input formControlName="username">
  <ng-template #errTpl let-control>
    @if (control.hasError('unique')) { 用户名已被占用 }
  </ng-template>
</nz-form-control>
```

### 嵌套对象 + FormArray 动态字段

```ts
// 嵌套对象
this.form = this.fb.nonNullable.group({
  user: this.fb.nonNullable.group({
    name: [''],
    email: ['']
  }),
  // 动态字段数组
  hobbies: this.fb.array([
    this.fb.control('阅读'),
    this.fb.control('运动')
  ])
});

get hobbies() {
  return this.form.controls.hobbies;
}

addHobby() {
  this.hobbies.push(this.fb.control(''));
}

removeHobby(i: number) {
  this.hobbies.removeAt(i);
}
```

```html
<div formGroupName="user">
  <nz-form-item>
    <nz-form-label>姓名</nz-form-label>
    <nz-form-control>
      <input nz-input formControlName="name">
    </nz-form-control>
  </nz-form-item>
</div>

<div formArrayName="hobbies">
  @for (hobby of hobbies.controls; track $index; let i = $index) {
    <nz-form-item>
      <nz-form-control>
        <input nz-input [formControlName]="i">
        <button nz-button (click)="removeHobby(i)">删除</button>
      </nz-form-control>
    </nz-form-item>
  }
  <button nz-button (click)="addHobby()">添加爱好</button>
</div>
```

## NzTable 完整 API

NG-ZORRO 的 `<nz-table>` 是企业级数据表标杆——支持排序、筛选、多选、展开、固定列、虚拟滚动、树形、服务端分页。

### 基础用法

```ts
import { Component } from '@angular/core';
import { NzTableModule } from 'ng-zorro-antd/table';

interface User {
  id: number;
  name: string;
  age: number;
  address: string;
}

@Component({
  selector: 'app-user-table',
  standalone: true,
  imports: [NzTableModule],
  template: `
    <nz-table #userTable [nzData]="users" [nzPageSize]="10">
      <thead>
        <tr>
          <th>ID</th>
          <th>姓名</th>
          <th>年龄</th>
          <th>地址</th>
        </tr>
      </thead>
      <tbody>
        @for (user of userTable.data; track user.id) {
          <tr>
            <td>{{ user.id }}</td>
            <td>{{ user.name }}</td>
            <td>{{ user.age }}</td>
            <td>{{ user.address }}</td>
          </tr>
        }
      </tbody>
    </nz-table>
  `
})
export class UserTableComponent {
  users: User[] = [/* ... */];
}
```

**关键点**：

- `<nz-table #userTable>` 通过模板变量拿到表格实例
- `userTable.data` 是**经过分页 + 排序 + 过滤后的当前页数据**——不是原始 `nzData`
- 数据更新必须 `this.users = [...this.users]` immutable（OnPush 模式）

### 排序

```html
<nz-table #userTable [nzData]="users">
  <thead>
    <tr>
      <th
        [nzSortFn]="sortByAge"
        nzSortPriority="2"
      >年龄</th>
      <th
        [nzSortFn]="sortByName"
        [nzSortDirections]="['ascend', 'descend', null]"
        nzSortPriority="1"
      >姓名</th>
    </tr>
  </thead>
  <tbody>
    @for (user of userTable.data; track user.id) { ... }
  </tbody>
</nz-table>
```

```ts
sortByName = (a: User, b: User) => a.name.localeCompare(b.name);
sortByAge = (a: User, b: User) => a.age - b.age;
```

- `[nzSortFn]` 传函数 → 客户端排序
- `[nzSortFn]="true"` → 服务端排序（用 `(nzQueryParams)` 拿排序参数）
- `nzSortDirections` 控制排序循环顺序，加 `null` 允许"取消排序"
- `nzSortPriority` 多列排序优先级

### 筛选

```html
<th
  [nzFilters]="ageFilters"
  [nzFilterFn]="filterByAge"
  [nzFilterMultiple]="true"
>年龄</th>
```

```ts
ageFilters = [
  { text: '20-29', value: '20s', byDefault: false },
  { text: '30-39', value: '30s', byDefault: true }  // 默认选中
];

filterByAge = (list: string[], item: User) => {
  if (list.length === 0) return true;
  return list.some(range => {
    if (range === '20s') return item.age >= 20 && item.age <= 29;
    if (range === '30s') return item.age >= 30 && item.age <= 39;
    return false;
  });
};
```

- `nzFilterMultiple="true"` 多选筛选、`false` 单选
- `[nzFilterFn]="true"` → 服务端筛选

### 多选

```html
<nz-table
  #userTable
  [nzData]="users"
  [nzShowPagination]="true"
>
  <thead>
    <tr>
      <th
        [nzChecked]="checked"
        [nzIndeterminate]="indeterminate"
        (nzCheckedChange)="onAllChecked($event)"
      ></th>
      <th>姓名</th>
    </tr>
  </thead>
  <tbody>
    @for (user of userTable.data; track user.id) {
      <tr>
        <td
          [nzChecked]="setOfCheckedId.has(user.id)"
          (nzCheckedChange)="onItemChecked(user.id, $event)"
        ></td>
        <td>{{ user.name }}</td>
      </tr>
    }
  </tbody>
</nz-table>
```

```ts
setOfCheckedId = new Set<number>();
checked = false;
indeterminate = false;

onItemChecked(id: number, checked: boolean): void {
  if (checked) {
    this.setOfCheckedId.add(id);
  } else {
    this.setOfCheckedId.delete(id);
  }
  this.refreshCheckedStatus();
}

onAllChecked(checked: boolean): void {
  this.users.forEach(user => this.onItemChecked(user.id, checked));
}

refreshCheckedStatus(): void {
  this.checked = this.users.every(user => this.setOfCheckedId.has(user.id));
  this.indeterminate = this.users.some(user => this.setOfCheckedId.has(user.id)) && !this.checked;
}
```

### 展开行

```html
<nz-table #expTable [nzData]="users">
  <thead>
    <tr>
      <th></th>
      <th>姓名</th>
    </tr>
  </thead>
  <tbody>
    @for (user of expTable.data; track user.id) {
      <tr>
        <td
          [nzShowExpand]="true"
          [(nzExpand)]="expandSet.has(user.id) ? true : false"
          (nzExpandChange)="onExpandChange(user.id, $event)"
        ></td>
        <td>{{ user.name }}</td>
      </tr>
      <tr [nzExpand]="expandSet.has(user.id)">
        <td colspan="2">{{ user.detail }}</td>
      </tr>
    }
  </tbody>
</nz-table>
```

```ts
expandSet = new Set<number>();

onExpandChange(id: number, checked: boolean): void {
  if (checked) {
    this.expandSet.add(id);
  } else {
    this.expandSet.delete(id);
  }
}
```

### 固定列 + 横向滚动

```html
<nz-table
  #wideTable
  [nzData]="wideUsers"
  [nzScroll]="{ x: '1500px', y: '400px' }"
>
  <thead>
    <tr>
      <th nzLeft nzWidth="100px">ID</th>
      <th nzLeft nzWidth="150px">姓名</th>
      <th nzWidth="100px">年龄</th>
      <th nzWidth="200px">地址</th>
      <th nzWidth="200px">邮箱</th>
      <th nzWidth="200px">部门</th>
      <th nzRight nzWidth="120px">操作</th>
    </tr>
  </thead>
  <tbody>
    @for (user of wideTable.data; track user.id) {
      <tr>
        <td nzLeft>{{ user.id }}</td>
        <td nzLeft>{{ user.name }}</td>
        ...
        <td nzRight>
          <a>编辑</a>
        </td>
      </tr>
    }
  </tbody>
</nz-table>
```

- `nzLeft` / `nzRight`：固定列在表格左/右侧
- `[nzScroll]="{ x: '1500px', y: '400px' }"`：表格内部双向滚动

### 虚拟滚动（10W 行数据）

```html
<nz-table
  #vTable
  [nzData]="bigData"
  [nzVirtualItemSize]="54"
  [nzVirtualMinBufferPx]="200"
  [nzVirtualMaxBufferPx]="400"
  [nzScroll]="{ x: '1200px', y: '400px' }"
>
  <thead>
    <tr>
      <th>ID</th>
      <th>姓名</th>
    </tr>
  </thead>
  <tbody>
    <ng-template nz-virtual-scroll let-data let-index="index">
      <tr>
        <td>{{ data.id }}</td>
        <td>{{ data.name }}</td>
      </tr>
    </ng-template>
  </tbody>
</nz-table>
```

- `nzVirtualItemSize`：**每行固定像素高**（必填）
- 大数据量（>1000 行）建议虚拟滚动、否则浏览器主线程会卡

### 服务端分页 + 排序 + 筛选（统一 nzQueryParams）

```html
<nz-table
  [nzData]="users"
  [nzFrontPagination]="false"
  [nzTotal]="total"
  [nzPageSize]="pageSize"
  [nzPageIndex]="pageIndex"
  [nzLoading]="loading"
  (nzQueryParams)="onQueryParamsChange($event)"
>
  <thead>
    <tr>
      <th [nzSortFn]="true" nzColumnKey="name">姓名</th>
      <th [nzFilters]="ageFilters" [nzFilterFn]="true" nzColumnKey="age">年龄</th>
    </tr>
  </thead>
  ...
</nz-table>
```

```ts
import { NzTableQueryParams } from 'ng-zorro-antd/table';

onQueryParamsChange(params: NzTableQueryParams): void {
  console.log(params);
  /*
    {
      pageIndex: 2,
      pageSize: 10,
      sort: [{ key: 'name', value: 'ascend' }],
      filter: [{ key: 'age', value: ['20s', '30s'] }]
    }
  */
  this.loading = true;
  this.api.list(params).subscribe(res => {
    this.users = res.data;
    this.total = res.total;
    this.loading = false;
  });
}
```

`[nzFrontPagination]="false"` 是关键——告诉 NG-ZORRO **不要客户端分页**，由父组件接管。

## NzModal + NzModalService 完整

NG-ZORRO 的 Modal 有**两种模式**：模板式（`<nz-modal>`）和命令式（`NzModalService`）。

### 命令式：NzModalService

最灵活——可以传**动态组件**作为弹窗内容：

```ts
import { Component, inject } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { UserEditFormComponent } from './user-edit-form.component';

@Component({
  selector: 'app-user-actions',
  standalone: true,
  imports: [NzButtonModule],
  template: `
    <button nz-button (click)="openInfo()">Info</button>
    <button nz-button (click)="openConfirm()">Confirm</button>
    <button nz-button (click)="openComponent()">动态组件</button>
  `
})
export class UserActionsComponent {
  private modal = inject(NzModalService);

  openInfo(): void {
    this.modal.info({
      nzTitle: '提示',
      nzContent: '这是一条 Info 消息'
    });
  }

  openConfirm(): void {
    this.modal.confirm({
      nzTitle: '确认删除？',
      nzContent: '删除后不可恢复',
      nzOkText: '删除',
      nzOkDanger: true,
      nzCancelText: '取消',
      nzOnOk: () => console.log('已确认删除'),
      nzOnCancel: () => console.log('用户取消')
    });
  }

  openComponent(): void {
    const modalRef = this.modal.create<UserEditFormComponent, { id: number }>({
      nzTitle: '编辑用户',
      nzContent: UserEditFormComponent,
      nzData: { id: 123 },
      nzWidth: 720,
      nzCentered: true,
      nzMaskClosable: false,
      nzOnOk: () => {
        // 调用子组件方法
        const instance = modalRef.getContentComponent();
        return instance.submit();  // 返回 Promise 阻塞关闭
      }
    });

    // 监听 modal 关闭事件
    modalRef.afterClose.subscribe(result => {
      console.log('Modal 关闭，结果：', result);
    });
  }
}
```

### 子组件接收数据 + 控制关闭

```ts
// user-edit-form.component.ts
import { Component, inject } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';

interface ModalData {
  id: number;
}

@Component({
  selector: 'app-user-edit-form',
  standalone: true,
  template: `
    <p>编辑用户 ID: {{ data.id }}</p>
    <button (click)="cancel()">取消</button>
  `
})
export class UserEditFormComponent {
  private modalRef = inject(NzModalRef);
  data: ModalData = inject(NZ_MODAL_DATA);

  async submit(): Promise<boolean> {
    // 异步提交、return false 阻止 modal 关闭
    const success = await this.api.save();
    if (success) {
      this.modalRef.close('saved');
      return true;
    }
    return false;
  }

  cancel(): void {
    this.modalRef.destroy('cancel');
  }
}
```

`NZ_MODAL_DATA` 是关键 token——子组件通过 inject 拿父组件传入的 `nzData`。

### 模板式 `<nz-modal>`

适合静态弹窗：

```html
<button nz-button (click)="visible = true">打开 Modal</button>

<nz-modal
  [(nzVisible)]="visible"
  nzTitle="标题"
  (nzOnCancel)="visible = false"
  (nzOnOk)="handleOk()"
>
  <ng-container *nzModalContent>
    <p>这是 Modal 内容。</p>
  </ng-container>

  <div *nzModalFooter>
    <button nz-button (click)="visible = false">取消</button>
    <button nz-button nzType="primary" (click)="handleOk()">确认</button>
  </div>
</nz-modal>
```

### 5 种命令式预设

- `modal.info({...})` ：蓝色 i 图标
- `modal.success({...})` ：绿色对勾
- `modal.warning({...})` ：黄色感叹号
- `modal.error({...})` ：红色叉
- `modal.confirm({...})` ：含确认/取消两按钮

## NzDrawer 抽屉

类似 Modal 但从屏幕边缘滑入：

```ts
import { NzDrawerService } from 'ng-zorro-antd/drawer';

openDrawer(): void {
  const drawerRef = this.drawer.create<UserEditFormComponent, { id: number }, string>({
    nzTitle: '编辑用户',
    nzContent: UserEditFormComponent,
    nzContentParams: { id: 123 },  // 注意：Drawer 用 nzContentParams 而非 nzData
    nzWidth: 720,
    nzPlacement: 'right'  // 'top' | 'right' | 'bottom' | 'left'
  });

  drawerRef.afterClose.subscribe(result => {
    console.log(result);
  });
}
```

> Drawer 用 `nzContentParams` 给子组件传 props，Modal 用 `nzData`——**这是 NG-ZORRO 历史遗留的 API 不一致**。

## 反馈服务：Message / Notification / Popconfirm

### NzMessageService（顶部短消息）

```ts
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({ /* ... */ })
export class FooComponent {
  private message = inject(NzMessageService);

  notify(): void {
    this.message.success('操作成功');
    this.message.error('操作失败');
    this.message.warning('警告');
    this.message.info('信息');
    this.message.loading('加载中', { nzDuration: 0 });  // 不自动关闭
  }
}
```

全局配置（顶部距离、默认时长）：

```ts
provideNzConfig({
  message: { nzTop: 80, nzDuration: 3000, nzMaxStack: 7 }
})
```

### NzNotificationService（右上角通知）

```ts
import { NzNotificationService } from 'ng-zorro-antd/notification';

@Component({ /* ... */ })
export class FooComponent {
  private notification = inject(NzNotificationService);

  show(): void {
    this.notification.success('成功标题', '描述详情，可以是多行');
    this.notification.error('错误', '系统异常，请稍后重试', {
      nzPlacement: 'topRight',  // 4 个位置：topLeft / topRight / bottomLeft / bottomRight
      nzDuration: 0  // 不自动关闭
    });
  }
}
```

### NzPopconfirm（气泡确认）

行内二次确认——比开 Modal 体验更轻：

```html
<a
  nz-popconfirm
  nzPopconfirmTitle="确认删除？"
  nzPopconfirmPlacement="topRight"
  (nzOnConfirm)="handleDelete()"
  (nzOnCancel)="handleCancel()"
>
  <nz-icon nzType="delete" />
  删除
</a>
```

## NzIcon 完整方案

### 三种主题

```html
<nz-icon nzType="smile" nzTheme="outline" />     <!-- 线框（默认） -->
<nz-icon nzType="smile" nzTheme="fill" />        <!-- 实心 -->
<nz-icon nzType="smile" nzTheme="twotone" nzTwotoneColor="#52c41a" />  <!-- 双色 -->
```

### 动画

```html
<nz-icon nzType="loading" nzSpin />              <!-- 旋转 -->
<nz-icon nzType="arrow-down" [nzRotate]="180" /> <!-- 旋转 180 度 -->
```

### 静态注册（推荐生产）

```ts
import { provideNzIcons } from 'ng-zorro-antd/icon';
import {
  StarFill, StarOutline, EditOutline, DeleteOutline,
  PlusOutline, ReloadOutline, LoadingOutline,
  CheckCircleFill, CloseCircleFill, InfoCircleOutline
} from '@ant-design/icons-angular/icons';

provideNzIcons([
  StarFill, StarOutline, EditOutline, DeleteOutline,
  PlusOutline, ReloadOutline, LoadingOutline,
  CheckCircleFill, CloseCircleFill, InfoCircleOutline
])
```

### Lazy 路由按需注册

```ts
import { provideNzIconsPatch } from 'ng-zorro-antd/icon';

export const adminRoutes: Routes = [
  {
    path: '',
    providers: [
      provideNzIconsPatch([UploadOutline, DownloadOutline])
    ],
    loadComponent: () => import('./admin.component').then(m => m.AdminComponent)
  }
];
```

### iconfont.cn 远程加载

如果团队有自建 iconfont.cn 图标库：

```ts
import { NzIconService } from 'ng-zorro-antd/icon';

constructor() {
  const iconService = inject(NzIconService);
  iconService.fetchFromIconfont({
    scriptUrl: 'https://at.alicdn.com/t/font_xxxxx.js'
  });
}
```

```html
<nz-icon nzIconfont="icon-tuichu" />
<nz-icon nzIconfont="icon-shangchuan" />
```

### Custom SVG

```ts
import { NzIconService } from 'ng-zorro-antd/icon';

const myCustomSvg = `<svg ...>...</svg>`;

iconService.addIconLiteral('app:my-icon', myCustomSvg);
```

```html
<nz-icon nzType="app:my-icon" />
```

## Less 主题定制

### 400+ Less 变量速记

NG-ZORRO 提供 **400+ Less 变量**，按类别：

| 类别 | 关键变量 |
| --- | --- |
| 主色 | `@primary-color` / `@info-color` / `@success-color` / `@warning-color` / `@error-color` |
| 链接 | `@link-color` / `@link-hover-color` / `@link-active-color` |
| 字号 | `@font-size-base` / `@font-size-lg` / `@font-size-sm` / `@heading-1-size` ~ `@heading-5-size` |
| 文字色 | `@heading-color` / `@text-color` / `@text-color-secondary` / `@disabled-color` |
| 圆角 | `@border-radius-base` / `@border-radius-sm` |
| 边框 | `@border-color-base` / `@border-color-split` / `@border-width-base` |
| 间距 | `@padding-lg` / `@padding-md` / `@padding-sm` / `@padding-xs` / `@padding-xss` |
| 高度 | `@height-base` / `@height-lg` / `@height-sm` |
| 阴影 | `@shadow-color` / `@box-shadow-base` |
| 动画 | `@animation-duration-slow` / `@animation-duration-base` / `@animation-duration-fast` |
| 表单 | `@form-item-margin-bottom` / `@label-color` / `@label-required-color` |
| Z-index | `@zindex-modal` / `@zindex-drawer` / `@zindex-tooltip` 等 |

完整变量见 [github.com/NG-ZORRO/ng-zorro-antd/blob/master/components/style/themes/default.less](https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/components/style/themes/default.less)。

### 编译时定制（推荐生产）

`src/theme.less`：

```less
@import "~ng-zorro-antd/ng-zorro-antd.less";

// 覆盖变量
@primary-color: #1da57a;
@link-color: #1da57a;
@border-radius-base: 4px;
@font-size-base: 14px;
```

`angular.json`：

```json
{
  "styles": ["src/theme.less"]
}
```

### 通过 webpack modifyVars（不改源码）

如果用 `@angular-builders/custom-webpack`：

```bash
pnpm add -D @angular-builders/custom-webpack
```

`extra-webpack.config.js`：

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.less$/,
        use: [
          {
            loader: 'less-loader',
            options: {
              lessOptions: {
                modifyVars: {
                  'primary-color': '#1DA57A',
                  'link-color': '#1DA57A',
                  'border-radius-base': '2px'
                },
                javascriptEnabled: true
              }
            }
          }
        ]
      }
    ]
  }
};
```

`angular.json` 切换 builder：

```json
{
  "build": {
    "builder": "@angular-builders/custom-webpack:browser",
    "options": {
      "customWebpackConfig": { "path": "./extra-webpack.config.js" }
    }
  }
}
```

### 多主题切换（运行时）

`angular.json` 配多个 Less bundle、设 `inject: false`：

```json
{
  "styles": [
    { "input": "src/styles/default.less", "bundleName": "default", "inject": false },
    { "input": "src/styles/dark.less", "bundleName": "dark", "inject": false }
  ]
}
```

`src/styles/dark.less`：

```less
@import "~ng-zorro-antd/ng-zorro-antd.dark.less";
```

运行时 `loadCss` 切换：

```ts
loadCss(href: string, id: string): Promise<Event> {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.id = id;
    link.onload = resolve;
    link.onerror = reject;
    document.head.appendChild(link);
  });
}

switchTheme(theme: 'default' | 'dark'): void {
  const oldLink = document.getElementById('theme-css');
  if (oldLink) {
    oldLink.parentNode?.removeChild(oldLink);
  }
  this.loadCss(`${theme}.css`, 'theme-css');
}
```

### CSS Variables 实验主题

```json
{ "styles": ["node_modules/ng-zorro-antd/ng-zorro-antd.variable.min.css"] }
```

```ts
this.nzConfigService.set('theme', { primaryColor: '#1da57a' });
```

> CSS Variables 主题仍是 Experimental——能跑、但官方文档明确「生产慎用」。详见 [docs/customize-theme-variable](https://ng.ant.design/docs/customize-theme-variable/zh)。

## NzI18n 国际化

### 60+ 语言包速记

主流 locale 一览：

- 中文：`zh_CN`、`zh_HK`、`zh_TW`
- 英文：`en_US`、`en_GB`、`en_AU`
- 日韩：`ja_JP`、`ko_KR`
- 欧洲：`de_DE`、`fr_FR`、`es_ES`、`it_IT`、`pt_BR`、`ru_RU`、`nl_NL`、`pl_PL`、`sv_SE`、`tr_TR`、`uk_UA`
- 亚洲其他：`th_TH`、`vi_VN`、`hi_IN`、`id_ID`、`ms_MY`
- 中东：`ar_EG`、`fa_IR`、`he_IL`、`ur_PK`

完整 60+ locale 见 [docs/i18n](https://ng.ant.design/docs/i18n/zh)。

### 初始化 locale

```ts
import { provideNzI18n, zh_CN } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import zh from '@angular/common/locales/zh';

registerLocaleData(zh);

provideNzI18n(zh_CN)
```

`registerLocaleData(zh)` 不可省——管 Angular 自身的 `DatePipe` / `CurrencyPipe` / `DecimalPipe` 等内置 pipe。

### 运行时切换 locale

```ts
import { NzI18nService, en_US, zh_CN } from 'ng-zorro-antd/i18n';

@Component({ /* ... */ })
export class LangSwitcherComponent {
  private i18n = inject(NzI18nService);

  switchTo(lang: 'zh' | 'en'): void {
    this.i18n.setLocale(lang === 'zh' ? zh_CN : en_US);
  }
}
```

### NZ_DATE_LOCALE（DatePicker 用）

```ts
import { NZ_DATE_LOCALE } from 'ng-zorro-antd/i18n';
import { zhCN, enUS } from 'date-fns/locale';

provideNzI18n(zh_CN),
{ provide: NZ_DATE_LOCALE, useValue: zhCN }
```

运行时切换：

```ts
this.i18n.setDateLocale(enUS);
```

### 自定义文案

```ts
import { en_US } from 'ng-zorro-antd/i18n';

const customLocale = {
  ...en_US,
  Pagination: {
    ...en_US.Pagination,
    items_per_page: '/ page'
  }
};

provideNzI18n(customLocale)
```

### 与 Angular Localize 集成

如果用 `@angular/localize` 做多语言构建：

```ts
import { LOCALE_ID } from '@angular/core';
import { en_US, zh_CN } from 'ng-zorro-antd/i18n';

function localeFactory(): NzI18nInterface {
  const locale = inject(LOCALE_ID);  // Angular 内置 LOCALE_ID
  switch (locale) {
    case 'zh-Hans':
    case 'zh':
      return zh_CN;
    case 'en':
    default:
      return en_US;
  }
}

{ provide: NZ_I18N, useFactory: localeFactory }
```

## NzConfigService 全局组件配置

每个组件几乎都可以全局配 default props——配置一次，整个 App 生效。

### 初始化

```ts
import { NzConfig, provideNzConfig } from 'ng-zorro-antd/core/config';

const ngZorroConfig: NzConfig = {
  // Message
  message: {
    nzTop: 80,
    nzDuration: 3000,
    nzMaxStack: 7,
    nzPauseOnHover: true
  },
  // Notification
  notification: {
    nzTop: 24,
    nzPlacement: 'topRight',
    nzDuration: 4500
  },
  // Button 全局尺寸
  button: {
    nzSize: 'default'  // 'large' | 'default' | 'small'
  },
  // Spin 全局自定义 indicator
  spin: {
    nzIndicator: customSpinTpl
  },
  // Modal 全局默认宽度
  modal: {
    nzWidth: 520,
    nzCentered: false,
    nzMaskClosable: true
  },
  // Icon 默认双色色值
  icon: {
    nzTwotoneColor: '#1890ff'
  },
  // Form 全局默认 layout
  form: {
    nzNoColon: false,
    nzAutoTips: { default: { required: '请输入此字段' } }
  },
  // Table 全局默认 size
  table: {
    nzSize: 'default'
  },
  // DatePicker 全局默认 format
  datePicker: {
    nzFormat: 'yyyy-MM-dd'
  }
};

provideNzConfig(ngZorroConfig)
```

### 运行时动态调整

```ts
import { NzConfigService } from 'ng-zorro-antd/core/config';

export class SettingsComponent {
  private nzConfigService = inject(NzConfigService);

  enlargeButtons(): void {
    this.nzConfigService.set('button', { nzSize: 'large' });
  }

  resetModal(): void {
    this.nzConfigService.set('modal', { nzWidth: 720 });
  }
}
```

### 优先级机制

高到低：

1. **组件 instance prop**：`<button nz-button nzSize="small">`（最高优先级）
2. **NzConfigService.set()** 运行时设置
3. **provideNzConfig()** 初始注入
4. **NG-ZORRO 内置默认值**（最低）

例：`provideNzConfig({ button: { nzSize: 'large' } })` 之后，所有按钮变大；但 `<button nz-button nzSize="small">` 仍然小，因为 instance prop 优先级最高。

## ng generate 5 大模板

```bash
# 1. Dashboard 仪表板：栅格 + 卡片 + Echarts 占位
ng generate ng-zorro-antd:dashboard

# 2. Form 表单（多变种）
ng generate ng-zorro-antd:form
ng generate ng-zorro-antd:form-normal-login login
ng generate ng-zorro-antd:form-step-register register

# 3. List 列表（含搜索筛选 + 分页）
ng generate ng-zorro-antd:list

# 4. TreeView 树视图
ng generate ng-zorro-antd:tree-view

# 5. Sidemenu 侧边菜单
ng generate ng-zorro-antd:sidemenu
```

每个模板生成一套完整的 **Component + Template + Style + Mock 数据**——10 分钟拼出可演示中后台。

## Standalone Component 最佳实践

### 按组件按需 import

```ts
// 推荐：精确 import 子模块（Tree Shaking 极致）
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzTableModule } from 'ng-zorro-antd/table';

@Component({
  standalone: true,
  imports: [
    NzButtonModule,
    NzInputModule,
    NzFormModule,
    NzTableModule
  ]
})
export class MyComponent {}
```

### v19+ 单独 Component / Directive import

NG-ZORRO 19+ 部分组件支持直接 import 而不是 Module：

```ts
// v19+ 新写法：import 单个 directive / component
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzInputDirective } from 'ng-zorro-antd/input';

@Component({
  imports: [NzButtonComponent, NzInputDirective]
})
```

但生产推荐**仍用 Module import**——更稳定、文档示例也用 Module 风格。

## Angular SSR 集成

### 启用 SSR

```bash
ng add @angular/ssr
```

### app.config.ts

```ts
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(),
    provideAnimationsAsync(),
    provideNzI18n(zh_CN),
    provideNzIcons(icons),
    // ...
  ]
};
```

### SSR 注意事项

1. **避免 SSR 期访问 `window` / `document`**：NG-ZORRO 内部用 `PlatformId` + `isPlatformBrowser()` 守卫
2. **CSS Variables 主题**：SSR 时 HTML head 必须有完整变量定义，否则首屏闪烁
3. **图标 Lazy 加载**：SSR 无法 fetch `assets/` —— **SSR 路由全部用 `provideNzIcons` 静态注册**
4. **i18n SSR**：`registerLocaleData(zh)` 必须在**服务端入口**也调用，否则服务端 render 时报错

## Angular Router 集成

### NzMenu + routerLink

```html
<ul nz-menu nzMode="inline" nzTheme="dark">
  <li nz-menu-item [nzMatchRouter]="true">
    <a [routerLink]="['/dashboard']">
      <nz-icon nzType="dashboard" />
      <span>仪表板</span>
    </a>
  </li>
  <li nz-submenu nzTitle="用户管理">
    <ul>
      <li nz-menu-item [nzMatchRouter]="true">
        <a [routerLink]="['/users']">用户列表</a>
      </li>
      <li nz-menu-item [nzMatchRouter]="true">
        <a [routerLink]="['/users/roles']">角色管理</a>
      </li>
    </ul>
  </li>
</ul>
```

- `[nzMatchRouter]="true"` 让 menu item 自动跟随 router 变化高亮

### NzBreadcrumb + 自动渲染

```html
<nz-breadcrumb [nzAutoGenerate]="true"></nz-breadcrumb>
```

```ts
// router 配置时给 data.breadcrumb 加上面包屑文案
const routes: Routes = [
  { path: 'users', data: { breadcrumb: '用户管理' }, children: [
    { path: '', data: { breadcrumb: '列表' }, component: UserListComponent },
    { path: ':id', data: { breadcrumb: '详情' }, component: UserDetailComponent }
  ]}
];
```

### NzTabs + 路由切换

```html
<nz-tabset [nzSelectedIndex]="activeIdx" (nzSelectChange)="onTabChange($event)">
  <nz-tab [nzTitle]="tab.title" *ngFor="let tab of tabs"></nz-tab>
</nz-tabset>
<router-outlet />
```

## 常见踩坑

### 坑 1：OnPush 数据 mutate 不更新

```ts
// 错误：push 不触发更新
this.users.push(newUser);

// 正确：immutable 替换
this.users = [...this.users, newUser];

// Signal 写法
this.users.update(list => [...list, newUser]);

// 用 immer 写法
import { produce } from 'immer';
this.users = produce(this.users, draft => { draft.push(newUser); });
```

### 坑 2：图标显示空白

**原因**：`provideNzIcons` 没注册 / 动态加载 assets 路径错。

**排查**：

```ts
// 1. 检查 app.config.ts 是否 provideNzIcons([...]) 注册了图标
// 2. 检查图标名拼写：注意 ant-design icons 都是 kebab-case
//    错：<nz-icon nzType="checkCircle" />
//    对：<nz-icon nzType="check-circle" />
// 3. 检查 nzTheme 是否匹配 import 的图标
//    错：<nz-icon nzType="star" nzTheme="fill" />  但只 import 了 StarOutline
//    对：import { StarFill } 后用 nzTheme="fill"
```

### 坑 3：DatePicker 周数不对（ISO 不一致）

NG-ZORRO 默认用 Angular 内置 `DatePipe`——某些情况下周数计算与 ISO 8601 不一致。

**解决**：用 `date-fns` 适配器：

```ts
import { NZ_DATE_LOCALE } from 'ng-zorro-antd/i18n';
import { zhCN } from 'date-fns/locale';

{ provide: NZ_DATE_LOCALE, useValue: zhCN }
```

### 坑 4：Less 编译失败 `JavaScript is not enabled`

```text
Error: JavaScript evaluation in less is disabled.
```

**原因**：less-loader 默认禁用了 JavaScript。

**解决**：`extra-webpack.config.js` 加 `javascriptEnabled: true`：

```js
{
  loader: 'less-loader',
  options: {
    lessOptions: { javascriptEnabled: true }
  }
}
```

### 坑 5：`registerLocaleData` 没调用

```text
Error: Missing locale data for the locale "zh-Hans"
```

**解决**：`app.config.ts` 顶部加：

```ts
import { registerLocaleData } from '@angular/common';
import zh from '@angular/common/locales/zh';

registerLocaleData(zh);
```

### 坑 6：Tailwind 优先级冲突

NG-ZORRO 内部用了 BEM 类名 + 较高的选择器特异性、Tailwind utility 默认优先级低。

**方案 A**：用 `!` 强制：

```html
<button nz-button class="!px-8 !py-3">大按钮</button>
```

**方案 B**：Tailwind `important: true` 全局提升：

```js
// tailwind.config.js
module.exports = { important: true }
```

### 坑 7：SSR `style flicker`

SSR 渲染 HTML 后客户端 hydration 时样式短暂闪烁。

**原因**：critical CSS 没在 HTML 提前注入。

**解决**：

1. 用预编译 CSS（`ng-zorro-antd.min.css`）而非 Less 编译
2. `provideClientHydration` 加上
3. 用 Tailwind `darkMode: 'class'` + `color-scheme` 提前声明配色方案

### 坑 8：`NzModalService.create` 传 component 时丢 context

```ts
// 错误：直接 new 不通过 DI
const modalRef = this.modal.create({
  nzContent: new MyComponent()  // ❌ DI 注入不到
});

// 正确：传 class、NG-ZORRO 内部用 DI 创建
const modalRef = this.modal.create({
  nzContent: MyComponent,  // ✅ 传类、DI 容器创建
  nzData: { id: 123 }
});
```

子组件用 `inject(NZ_MODAL_DATA)` 拿数据：

```ts
constructor() {
  const data = inject(NZ_MODAL_DATA);
}
```

### 坑 9：`<nz-form-control>` 校验状态不显示

```html
<!-- 错误：input 没用 formControlName -->
<nz-form-control nzErrorTip="必填">
  <input nz-input [(ngModel)]="value">  <!-- 没绑定到 form -->
</nz-form-control>

<!-- 正确：formControlName 绑定 -->
<nz-form-control nzErrorTip="必填">
  <input nz-input formControlName="email">
</nz-form-control>
```

`<nz-form-control>` 通过 Angular Forms API 检测 control 的 `invalid + dirty | touched` 状态——必须用 `formControlName` 或 `[formControl]`。

### 坑 10：lazy 路由的图标未注册

Lazy 加载的路由组件用了主路由没注册的图标 → 空白。

**解决**：用 `provideNzIconsPatch`：

```ts
export const adminRoutes: Routes = [
  {
    path: '',
    providers: [
      provideNzIconsPatch([UploadOutline, DownloadOutline])
    ],
    loadComponent: () => import('./admin.component').then(m => m.AdminComponent)
  }
];
```

### 坑 11：`@for track` 必填

```html
<!-- 错误：Angular 17+ @for 必须有 track -->
@for (user of userTable.data) { ... }

<!-- 正确：用唯一 ID 做 track -->
@for (user of userTable.data; track user.id) { ... }
```

不写 track 会编译报错 `@for must use track`。

### 坑 12：`<nz-icon>` v19 新标签 vs 老标签

```html
<!-- v19+ 推荐 -->
<nz-icon nzType="star" />

<!-- 老写法仍兼容 -->
<i nz-icon nzType="star"></i>
<span nz-icon nzType="star"></span>
```

老项目升级 v19 时**不需要批量改**——老写法仍可用。但新代码统一用 `<nz-icon>` 更清晰。

## 性能优化

### 1. OnPush 全组件 + Signal API

NG-ZORRO 所有组件默认 OnPush——你的业务组件也用 OnPush + Signal：

```ts
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyComponent {
  count = signal(0);

  increment() {
    this.count.update(v => v + 1);
  }
}
```

### 2. Tree Shaking 按需 import

```ts
// ✅ 推荐
import { NzButtonModule } from 'ng-zorro-antd/button';

// ❌ 已废弃
// import { NgZorroAntdModule } from 'ng-zorro-antd';
```

### 3. Lazy 路由 + Icon Patch

主 bundle 只装最核心图标、lazy 路由按需 patch：

```ts
// app.config.ts：主路由只 import 通用图标
provideNzIcons([HomeOutline, UserOutline, SettingOutline]);

// admin.routes.ts：admin 路由 patch 业务图标
provideNzIconsPatch([UploadOutline, DownloadOutline, ExportOutline])
```

### 4. NzTable 大数据用虚拟滚动

```html
<nz-table [nzVirtualItemSize]="54" [nzScroll]="{ y: 400 }">
  <ng-template nz-virtual-scroll let-data>
    <tr>...</tr>
  </ng-template>
</nz-table>
```

## 与 React Ant Design 的差异

NG-ZORRO 与 React 版 Ant Design 视觉一致，但 API 有差异：

| 对比维度 | React Ant Design | NG-ZORRO |
| --- | --- | --- |
| 主题方式 | CSS-in-JS Design Token | Less 变量 + 实验 CSS Variables |
| 暗色 | `theme.darkAlgorithm` 算法 | `ng-zorro-antd.dark.min.css` 文件 |
| 紧凑 | `theme.compactAlgorithm` 算法 | `ng-zorro-antd.compact.min.css` 文件 |
| 反馈服务 | `App.useApp()` hooks | `NzMessageService` DI 注入 |
| 表单 | `useForm()` hook | Angular Reactive Forms `FormBuilder` |
| 图标 | `<EditOutlined />` 直接组件 | `<nz-icon nzType="edit" />` + `provideNzIcons` 注册 |
| Modal | `Modal.confirm({...})` | `NzModalService.confirm({...})` |
| 国际化 | `<ConfigProvider locale={...}>` | `provideNzI18n(...)` + `NzI18nService` |

**视觉与 spec 同步、API 各自融入框架习惯**——React 用 hooks、Angular 用 DI 服务。

## 下一步

继续：

- [参考](./reference.md)：组件清单 + Less 变量 + NzConfig + TypeScript types 速查
- 入门回顾：[Getting Started](./getting-started.md)
