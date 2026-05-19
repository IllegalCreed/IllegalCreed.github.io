---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 PrimeVue 4.x（v4.5+）。包含 90+ 组件 10 大类速览、Form 组件深度（含 `@primevue/forms` + Zod / Yup 集成）、DataTable 深度（lazy load + virtual scroll + 行编辑）、Theming 4 大预设 + `definePreset` 深度、Styled vs Unstyled Mode 对比、Tailwind 集成、PassThrough (`pt`) 深度、`useToast` / `useConfirm` / `useDialog` 完整 API、Locale 与 SSR、常见踩坑。

## 速查

- **组件 10 大类**：Form（30+）+ Button（5）+ Data（15+）+ Panel（10+）+ Overlay（10+）+ File（3）+ Menu（10+）+ Chart（1）+ Messages（3）+ Media（5）+ Misc（10+）= **90+ 组件**
- **Form 核心**：`<Form :resolver="zodResolver(schema)" @submit="onSubmit" v-slot="$form">` + `<InputText name="username" />` + `$form.username?.error`
- **DataTable 核心**：`<DataTable :value="rows" paginator :rows="10">` + `<Column field="name" header="姓名" sortable />` —— **列定义用 `<Column>` 模板（与 Naive UI 不同）**
- **反馈三件套**：`useToast()`（消息）/ `useConfirm()`（确认）/ `useDialog()`（动态组件对话框）—— **每个都要 Plugin + 占位容器 + Composable 三步**
- **主题**：`app.use(PrimeVue, { theme: { preset: Aura, options: { darkModeSelector: '.dark' } } })`
- **自定义**：`definePreset(Aura, { semantic: { primary: { ... } } })`
- **Tailwind 集成**：`pnpm add -D tailwindcss-primeui` + `tailwind.config` 加 plugin
- **PassThrough**：`<Button :pt="{ root: { class: 'my-button' } }" />`
- **Unstyled**：`app.use(PrimeVue, { unstyled: true })` 全局 / `<Button unstyled />` 单组件
- **必须**：`app.use(PrimeVue, { theme })` 注册 + `import 'primeicons/primeicons.css'` 加载图标

## 90+ 组件 10 大类速览

PrimeVue 把所有组件分为 **10 大类**——熟悉分类有助于快速定位：

### Form（表单输入，30+）

所有输入类组件都在这里——PrimeVue 组件数最多的一类：

| 组件 | 用途 |
|---|---|
| InputText | 单行输入（支持 variant=filled / size=small/large） |
| InputNumber | 数字输入（含 currency / 步进 / 精度） |
| InputMask | 输入掩码（电话 / 邮编 / 信用卡） |
| InputOtp | 验证码输入框 |
| Password | 密码输入（含强度提示 / toggleMask 切换显示） |
| Textarea | 多行文本 |
| Select | 单选下拉（v4 重命名，原 Dropdown） |
| MultiSelect | 多选下拉 |
| AutoComplete | 自动补全（含远程搜索 / 多选 / chip） |
| Cascade Select | 级联下拉 |
| Tree Select | 树形下拉 |
| Listbox | 列表选择框 |
| SelectButton | 单选按钮组 |
| ToggleButton | 切换按钮 |
| Checkbox | 复选框 |
| RadioButton | 单选 |
| Toggle Switch | 开关（v4 重命名，原 InputSwitch） |
| Slider | 滑块 |
| Rating | 星级评分 |
| DatePicker | 日期选择（v4 重命名，原 Calendar） |
| Knob | 旋钮数值控件（圆形拖拽） |
| ColorPicker | 颜色选择器（含 hex / hsl / rgb） |
| FloatLabel | 浮动标签包装器 |
| IftaLabel | IFTA 标签包装器（v4 新增） |
| IconField | 输入框图标包装器（v4 新增） |
| Form | 表单容器（`@primevue/forms`，v4.3+） |
| FormField | 表单字段包装器（`@primevue/forms`） |
| Editor | 富文本编辑器（基于 Quill.js） |

### Button（按钮，5）

| 组件 | 用途 |
|---|---|
| Button | 基础按钮（含 severity / size / rounded / outlined / text / loading） |
| ButtonGroup | 按钮组（视觉合并） |
| SpeedDial | 悬浮快速操作按钮（FAB） |
| SplitButton | 拆分按钮（主操作 + 下拉菜单） |

### Data（数据展示，15+）

| 组件 | 用途 |
|---|---|
| DataTable | **重型表格**（lazy load + virtual scroll + 行编辑 + 列冻结 + CSV 导出） |
| DataView | 数据视图（grid / list 切换） |
| Tree | 树（含 lazy load / 多选 / 拖拽） |
| TreeTable | 树形表格（合并 Tree + Table） |
| Timeline | 时间线 |
| OrgChart | 组织架构图（PrimeVue 独有） |
| Paginator | 分页器 |
| PickList | 双面板拣选 |
| OrderList | 排序列表 |
| VirtualScroller | 虚拟滚动容器 |

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
| TabView / Tabs | 标签页（v4 改名为 Tabs） |
| Toolbar | 工具栏 |

### Overlay（弹层，10+）

| 组件 | 用途 |
|---|---|
| ConfirmDialog | 确认对话框（配合 useConfirm） |
| ConfirmPopup | 确认气泡 |
| Dialog | 模态对话框 |
| Drawer | 抽屉（v4 重命名，原 Sidebar） |
| DynamicDialog | 动态对话框（命令式打开 Vue 组件） |
| Popover | 弹出气泡（v4 重命名，原 OverlayPanel） |
| Tooltip | 文字提示（指令 v-tooltip） |

### File（文件，3）

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
| Toast | 顶部 / 角落消息（配合 useToast） |
| InlineMessage | 内联提示（v4 合并到 Message） |

### Media（媒体，5）

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
| MeterGroup | 多指标进度条（PrimeVue 独有） |
| ProgressBar | 进度条 |
| ProgressSpinner | 加载旋钮 |
| ScrollTop | 回到顶部 |
| Skeleton | 骨架屏 |
| Tag | 标签 |
| Terminal | 终端模拟 |

## Form 表单深度

PrimeVue 4.3+ 内置 `@primevue/forms` —— 现代化的 schema-first 表单库（支持 Zod / Yup / Valibot / Joi / Superstruct）。

### 安装 `@primevue/forms`

```bash
pnpm add @primevue/forms zod
```

| 包 | 用途 |
|---|---|
| `@primevue/forms` | 表单核心（Form / FormField） |
| `zod` | Schema 库（推荐，最现代） |
| `yup` | Schema 库（成熟） |
| `valibot` | Schema 库（轻量） |
| `joi` | Schema 库（Node 后端常用） |
| `superstruct` | Schema 库（函数式） |

### 基础用法（Zod resolver）

```vue
<template>
  <Form
    v-slot="$form"
    :initial-values="initialValues"
    :resolver="resolver"
    @submit="onSubmit"
    style="display: flex; flex-direction: column; gap: 16px; max-width: 400px;"
  >
    <div>
      <InputText name="username" type="text" placeholder="用户名" fluid />
      <Message
        v-if="$form.username?.invalid"
        severity="error"
        size="small"
      >
        {{ $form.username.error?.message }}
      </Message>
    </div>

    <div>
      <InputText name="email" type="email" placeholder="邮箱" fluid />
      <Message
        v-if="$form.email?.invalid"
        severity="error"
        size="small"
      >
        {{ $form.email.error?.message }}
      </Message>
    </div>

    <div>
      <Password
        name="password"
        placeholder="密码"
        :feedback="false"
        toggle-mask
        fluid
      />
      <Message
        v-if="$form.password?.invalid"
        severity="error"
        size="small"
      >
        {{ $form.password.error?.message }}
      </Message>
    </div>

    <Button type="submit" label="提交" />
  </Form>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import { Form } from '@primevue/forms'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Message from 'primevue/message'
import Button from 'primevue/button'

const schema = z.object({
  username: z
    .string()
    .min(3, '用户名至少 3 个字符')
    .max(20, '用户名不超过 20 字符'),
  email: z.string().email('邮箱格式不正确'),
  password: z
    .string()
    .min(8, '密码至少 8 个字符')
    .regex(/[A-Z]/, '必须包含至少一个大写字母'),
})

const resolver = zodResolver(schema)

const initialValues = {
  username: '',
  email: '',
  password: '',
}

interface SubmitEvent {
  valid: boolean
  values: Record<string, any>
  errors?: Record<string, any>
}

const onSubmit = (event: SubmitEvent) => {
  if (event.valid) {
    console.log('提交数据：', event.values)
  } else {
    console.log('校验错误：', event.errors)
  }
}
</script>
```

> **三个关键关联**：
>
> 1. `:resolver="zodResolver(schema)"` → schema 库的 resolver 包装
> 2. **`name="username"` 必填**——`<Form>` 通过 name 跟踪字段状态
> 3. **不用 v-model**——`<Form>` 内部用 `name` 关联 `initialValues` 自动管理状态

### Yup resolver

```vue
<script setup lang="ts">
import * as yup from 'yup'
import { yupResolver } from '@primevue/forms/resolvers/yup'

const schema = yup.object({
  username: yup.string().min(3).max(20).required(),
  email: yup.string().email().required(),
  age: yup.number().min(18).max(100),
})

const resolver = yupResolver(schema)
</script>
```

### Valibot resolver（轻量、最新）

```vue
<script setup lang="ts">
import * as v from 'valibot'
import { valibotResolver } from '@primevue/forms/resolvers/valibot'

const schema = v.object({
  username: v.pipe(v.string(), v.minLength(3), v.maxLength(20)),
  email: v.pipe(v.string(), v.email()),
})

const resolver = valibotResolver(schema)
</script>
```

### 自定义 resolver（不用 schema 库）

```ts
const resolver = ({ values }: { values: Record<string, any> }) => {
  const errors: Record<string, Array<{ message: string }>> = {}

  if (!values.username) {
    errors.username = [{ message: '用户名不能为空' }]
  } else if (values.username.length < 3) {
    errors.username = [{ message: '用户名至少 3 个字符' }]
  }

  if (!values.password) {
    errors.password = [{ message: '密码不能为空' }]
  }

  return { errors, values }
}
```

### `FormField` 包装非 PrimeVue 组件

如果想用原生 input 或第三方组件加入表单——用 `FormField` 包装：

```vue
<template>
  <Form @submit="onSubmit">
    <FormField v-slot="$field" name="username" :resolver="usernameResolver">
      <!-- 原生 input -->
      <input v-bind="$field.props" />
      <Message v-if="$field?.invalid" severity="error">
        {{ $field.error?.message }}
      </Message>
    </FormField>
  </Form>
</template>

<script setup>
import { Form, FormField } from '@primevue/forms'
</script>
```

### 校验触发时机

```vue
<Form
  v-slot="$form"
  :resolver="resolver"
  :validate-on-value-update="false"            <!-- 输入时不校验（默认 true） -->
  :validate-on-blur="true"                     <!-- blur 时校验 -->
  :validate-on-mount="['username']"            <!-- 挂载时只校验 username -->
  :validate-on-submit="true"                   <!-- submit 时校验全部（默认 true） -->
  @submit="onSubmit"
>
  <!-- ... -->
</Form>
```

### Form 与 PrimeVue 4 vs Element Plus 的对比

| 特性 | PrimeVue (@primevue/forms) | Element Plus (async-validator) |
|---|---|---|
| schema 库 | **Zod / Yup / Valibot / Joi / Superstruct** | 内置 rules 对象 |
| 字段标识 | **`name` prop** | `prop` |
| 数据绑定 | **不用 v-model（Form 内部管理）** | `v-model` |
| 错误访问 | `$form.username?.error` | 通过 ref.value.validate |
| 子表单 | `FormField` 包装 | 嵌套 ElFormItem |
| TS 类型 | **schema 即类型** | 手写类型 |
| 校验时机 | validateOnValueUpdate / Blur / Mount / Submit | trigger: blur/change |

## DataTable 表格深度

PrimeVue DataTable 是业内最强的 Vue 表格组件——**列定义必须用 `<Column>` 模板**（与 Naive UI columns 数组不同）。

### 基础用法

```vue
<template>
  <DataTable
    :value="users"
    paginator
    :rows="10"
    :rows-per-page-options="[5, 10, 20, 50]"
    table-style="min-width: 50rem"
  >
    <Column field="id" header="ID" sortable style="width: 80px;" />
    <Column field="name" header="姓名" sortable />
    <Column field="email" header="邮箱" />
    <Column field="age" header="年龄" sortable />
    <Column header="操作">
      <template #body="slotProps">
        <Button
          icon="pi pi-pencil"
          severity="info"
          size="small"
          @click="edit(slotProps.data)"
        />
        <Button
          icon="pi pi-trash"
          severity="danger"
          size="small"
          @click="remove(slotProps.data)"
        />
      </template>
    </Column>
  </DataTable>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'

interface User {
  id: number
  name: string
  email: string
  age: number
}

const users = ref<User[]>([
  { id: 1, name: '张三', email: 'zhang@example.com', age: 25 },
  { id: 2, name: '李四', email: 'li@example.com', age: 30 },
  // ...
])

const edit = (row: User) => console.log('编辑：', row)
const remove = (row: User) => console.log('删除：', row)
</script>
```

> **核心理念**：
>
> 1. `<Column field="name">` → 自动渲染 `row.name`
> 2. `#body` slot → 自定义单元格（`slotProps.data` 是行数据）
> 3. `sortable` → 启用排序
> 4. `paginator` → 启用分页器

### 排序

```vue
<!-- 单列排序（默认） -->
<DataTable :value="users" sort-mode="single">
  <Column field="name" header="姓名" sortable />
  <Column field="age" header="年龄" sortable />
</DataTable>

<!-- 多列排序（Ctrl/Cmd + 点击） -->
<DataTable :value="users" sort-mode="multiple">
  <Column field="name" header="姓名" sortable />
  <Column field="age" header="年龄" sortable />
</DataTable>
```

监听排序事件：

```vue
<DataTable :value="users" @sort="onSort">
  <Column field="name" header="姓名" sortable />
</DataTable>

<script setup lang="ts">
const onSort = (event: { sortField: string, sortOrder: 1 | -1 }) => {
  console.log(`排序：${event.sortField} ${event.sortOrder === 1 ? 'ASC' : 'DESC'}`)
  // 重新请求后端...
}
</script>
```

### 筛选（filterDisplay="row"）

行内搜索栏：

```vue
<template>
  <DataTable
    :value="users"
    :filters="filters"
    filter-display="row"
    :global-filter-fields="['name', 'email']"
  >
    <Column field="name" header="姓名" :filter-match-mode-options="['contains']">
      <template #filter="{ filterModel, filterCallback }">
        <InputText
          v-model="filterModel.value"
          type="text"
          @input="filterCallback"
          placeholder="搜索姓名"
        />
      </template>
    </Column>
    <Column field="age" header="年龄">
      <template #filter="{ filterModel, filterCallback }">
        <InputNumber v-model="filterModel.value" @input="filterCallback" />
      </template>
    </Column>
  </DataTable>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { FilterMatchMode } from '@primevue/core/api'

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  age: { value: null, matchMode: FilterMatchMode.EQUALS },
})
</script>
```

### 单选 / 多选

```vue
<template>
  <!-- 单选 -->
  <DataTable
    v-model:selection="selectedUser"
    :value="users"
    selection-mode="single"
    data-key="id"
  >
    <Column field="name" header="姓名" />
  </DataTable>

  <!-- 多选 + 复选框 -->
  <DataTable
    v-model:selection="selectedUsers"
    :value="users"
    selection-mode="multiple"
    data-key="id"
  >
    <Column selection-mode="multiple" header-style="width: 3rem" />
    <Column field="name" header="姓名" />
  </DataTable>
</template>

<script setup lang="ts">
const selectedUser = ref()
const selectedUsers = ref([])
</script>
```

> **`data-key="id"` 必填**——告诉 DataTable 用什么字段作唯一标识。

### 行展开

```vue
<template>
  <DataTable
    v-model:expanded-rows="expandedRows"
    :value="users"
    data-key="id"
  >
    <Column expander style="width: 3rem" />
    <Column field="name" header="姓名" />

    <template #expansion="slotProps">
      <div style="padding: 16px;">
        <h5>{{ slotProps.data.name }} 的详细信息</h5>
        <p>邮箱：{{ slotProps.data.email }}</p>
        <!-- 嵌套 DataTable 也可以 -->
      </div>
    </template>
  </DataTable>
</template>

<script setup lang="ts">
const expandedRows = ref<Record<string, boolean>>({})
</script>
```

### 单元格编辑

```vue
<template>
  <DataTable
    :value="users"
    edit-mode="cell"
    @cell-edit-complete="onCellEditComplete"
  >
    <Column field="name" header="姓名">
      <template #editor="{ data, field }">
        <InputText v-model="data[field]" />
      </template>
    </Column>
    <Column field="age" header="年龄">
      <template #editor="{ data, field }">
        <InputNumber v-model="data[field]" />
      </template>
    </Column>
  </DataTable>
</template>

<script setup lang="ts">
const onCellEditComplete = (event: { data: any, newValue: any, field: string }) => {
  event.data[event.field] = event.newValue
  // 调用后端 API 保存...
}
</script>
```

### 行编辑

```vue
<template>
  <DataTable
    v-model:editing-rows="editingRows"
    :value="users"
    edit-mode="row"
    data-key="id"
    @row-edit-save="onRowEditSave"
  >
    <Column field="name" header="姓名">
      <template #editor="{ data, field }">
        <InputText v-model="data[field]" />
      </template>
    </Column>
    <Column field="email" header="邮箱">
      <template #editor="{ data, field }">
        <InputText v-model="data[field]" />
      </template>
    </Column>
    <Column row-editor style="width: 10rem" header-style="width: 10rem" />
  </DataTable>
</template>

<script setup lang="ts">
const editingRows = ref([])

const onRowEditSave = (event: { newData: any, index: number }) => {
  users.value[event.index] = event.newData
  // 调用后端 API 保存...
}
</script>
```

### Lazy Load（后端分页 + 排序 + 筛选）

```vue
<template>
  <DataTable
    :value="users"
    lazy
    paginator
    :rows="rowsPerPage"
    :total-records="totalRecords"
    :loading="loading"
    @page="onPage"
    @sort="onSort"
    @filter="onFilter"
  >
    <Column field="name" header="姓名" sortable />
    <Column field="email" header="邮箱" />
  </DataTable>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const users = ref([])
const totalRecords = ref(0)
const rowsPerPage = ref(10)
const loading = ref(false)

const fetchData = async (params: {
  first: number
  rows: number
  sortField?: string
  sortOrder?: 1 | -1
  filters?: any
}) => {
  loading.value = true
  try {
    const res = await fetch('/api/users?' + new URLSearchParams(params))
    const data = await res.json()
    users.value = data.rows
    totalRecords.value = data.total
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData({ first: 0, rows: rowsPerPage.value })
})

const onPage = (event: any) => {
  fetchData(event)
}

const onSort = (event: any) => {
  fetchData(event)
}

const onFilter = (event: any) => {
  fetchData(event)
}
</script>
```

### Virtual Scroll（10 万行不卡）

```vue
<DataTable
  :value="bigData"
  :virtual-scroller-options="{ itemSize: 46 }"
  scroll-height="500px"
>
  <Column field="id" header="ID" />
  <Column field="name" header="姓名" />
</DataTable>

<script setup>
// 10 万行
const bigData = Array.from({ length: 100000 }, (_, i) => ({
  id: i,
  name: `用户 ${i}`,
}))
</script>
```

> **`itemSize`** 必填——行高（px）；**`scroll-height`** 必填——容器高度。

### 列冻结

```vue
<DataTable :value="users" scroll-direction="horizontal" :scroll-height="400">
  <Column field="id" header="ID" frozen />
  <Column field="name" header="姓名" frozen />

  <!-- 大量中间列 -->
  <Column field="col1" header="字段 A" />
  <Column field="col2" header="字段 B" />
  <!-- ... 20 列 -->

  <Column field="actions" header="操作" frozen align-frozen="right" />
</DataTable>
```

### CSV / Excel / PDF 导出

```vue
<template>
  <Button label="导出 CSV" icon="pi pi-download" @click="exportCSV" />

  <DataTable ref="dataTable" :value="users">
    <Column field="name" header="姓名" />
  </DataTable>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const dataTable = ref()

const exportCSV = () => {
  dataTable.value.exportCSV()
}
</script>
```

> **PDF 导出**需要装 jsPDF + jsPDF-AutoTable，**Excel 导出**需要装 xlsx——见 [DataTable 文档](https://primevue.org/datatable/) Export 章节。

## Theming 深度

PrimeVue 4 主题系统基于 **Design Token 三层架构**：

### Primitive / Semantic / Component 三层 token

```
Primitive Tokens（基础调色板）
  └─ blue-50, blue-100, ..., blue-900, blue-950
  └─ indigo-50, ..., indigo-950
  └─ green-50, ..., green-950
  └─ ...（每种颜色 11 个层级）

      ↓ 映射到

Semantic Tokens（语义化）
  └─ primary.color = {indigo.500}
  └─ surface.color
  └─ text.color
  └─ ...

      ↓ 映射到

Component Tokens（组件级）
  └─ button.color = {primary.color}
  └─ button.background = {primary.color}
  └─ ...
```

**优势**：

- **改主色**：只需改 `primary.500` → 全局所有用主色的组件自动更新
- **改单组件**：只需改 component token → 不影响其他组件
- **不用 deep selector**：所有 token 通过 CSS 变量传递

### `definePreset` 自定义主题

基础用法：

```ts
import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'

const MyPreset = definePreset(Aura, {
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

app.use(PrimeVue, {
  theme: { preset: MyPreset },
})
```

### 修改 surface（背景）颜色

```ts
const MyPreset = definePreset(Aura, {
  semantic: {
    primary: { /* ... */ },
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '{slate.50}',
          100: '{slate.100}',
          // ...
          950: '{slate.950}',
        },
      },
      dark: {
        surface: {
          0: '#000000',
          50: '{zinc.50}',
          // ...
          950: '{zinc.950}',
        },
      },
    },
  },
})
```

### 组件级 token

```ts
const MyPreset = definePreset(Aura, {
  components: {
    button: {
      root: {
        borderRadius: '8px',
        paddingX: '1.5rem',
      },
      primary: {
        background: '#3b82f6',
        hoverBackground: '#2563eb',
      },
    },
    inputtext: {
      root: {
        borderRadius: '6px',
        focusRingColor: '#3b82f6',
      },
    },
  },
})
```

### 运行时切换主题（`usePreset` / `updatePreset` / `updatePrimaryPalette`）

```vue
<script setup lang="ts">
import { usePreset, updatePreset, updatePrimaryPalette } from '@primeuix/themes'
import Material from '@primeuix/themes/material'

// 完全替换主题
const switchToMaterial = () => {
  usePreset(Material)
}

// 部分更新（合并到当前主题）
const customizeSpacing = () => {
  updatePreset({
    semantic: {
      formField: {
        paddingY: '0.75rem',
      },
    },
  })
}

// 快速改主色板（最常用）
const changeBrandColor = () => {
  updatePrimaryPalette({
    50: '{indigo.50}',
    100: '{indigo.100}',
    500: '{indigo.500}',
    700: '{indigo.700}',
  })
}
</script>
```

### `$dt()` 程序化访问 token

```vue
<template>
  <div :style="{ color: primaryColor }">动态颜色</div>
</template>

<script setup lang="ts">
import { $dt } from '@primeuix/themes'

const primaryColor = $dt('primary.color').value
</script>
```

### CSS Layer（与第三方 CSS 共存）

```ts
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      cssLayer: {
        name: 'primevue',
        order: 'app-styles, primevue, another-library',
      },
    },
  },
})
```

> **CSS Layer 帮助你控制样式优先级**——当 PrimeVue 与 Tailwind / 自定义 CSS 冲突时启用。

## Styled vs Unstyled Mode

PrimeVue 4 的核心创新——**两种渲染模式**：

### Styled Mode（默认）

```ts
app.use(PrimeVue, {
  theme: { preset: Aura },
})
```

- 用内置的 `Aura` / `Material` / `Lara` / `Nora` 预设
- 组件**自带样式**（CSS-in-JS 通过设计令牌注入）
- 开箱即用、设计专业、可通过 `definePreset` 自定义

### Unstyled Mode（高级）

```ts
app.use(PrimeVue, {
  unstyled: true,                              // 全局
})
```

- **关闭所有内置样式**——组件只渲染功能 DOM 结构
- 自己用 Tailwind / 自定义 CSS / SCSS 完全控制视觉
- 通过 PassThrough (`pt`) 注入 class

### 部分组件用 Unstyled

```vue
<template>
  <!-- 这个 Button unstyled（不带样式） -->
  <Button unstyled class="px-4 py-2 bg-blue-500 text-white rounded">登录</Button>

  <!-- 这个 Button styled（带默认样式） -->
  <Button label="取消" />
</template>
```

### Volt UI：官方 Unstyled + Tailwind 模板

PrimeTek 官方维护 **Volt UI**（[volt.primevue.org](https://volt.primevue.org/)）——基于 Unstyled PrimeVue + Tailwind 重写的完整组件库：

- **可以直接 copy 组件到你的项目**（类似 shadcn-vue 的工作流）
- 所有组件已用 Tailwind 类重写
- 视觉风格现代、设计自由度高

```bash
# 通过 Volt UI 工具拉取一个组件
npx volt-vue@latest add button
```

## Tailwind 集成

PrimeVue 4 与 Tailwind 集成的最佳实践——**`tailwindcss-primeui` 官方插件**：

### 安装插件

```bash
pnpm add tailwindcss tailwindcss-primeui
```

### Tailwind v4 配置

```css
/* style.css */
@import "tailwindcss";
@plugin "tailwindcss-primeui";
```

### Tailwind v3 配置

```js
// tailwind.config.js
import primeui from 'tailwindcss-primeui'

export default {
  content: ['./src/**/*.{vue,js,ts,jsx,tsx}'],
  plugins: [primeui],
}
```

### 插件提供的工具类

`tailwindcss-primeui` 把 PrimeVue 主题色板映射为 Tailwind 类：

| Tailwind 类 | 对应 PrimeVue token |
|---|---|
| `bg-primary` / `bg-primary-50` / ... / `bg-primary-950` | `primary.color` 调色板 |
| `bg-surface` / `bg-surface-0` / ... / `bg-surface-950` | `surface` 调色板 |
| `text-primary` / `text-primary-500` | `primary.color` 文字 |
| `text-surface-500` | `surface` 文字 |
| `border-primary` / `border-surface` | 边框 |
| `animate-fadein` / `animate-fadeout` | 动画 |
| `animate-slidedown` / `animate-slideup` | 滑动动画 |
| `animate-scalein` | 缩放入场 |

### 使用示例

```vue
<template>
  <!-- 用 Tailwind 类配合 PrimeVue 组件 -->
  <div class="bg-primary text-white p-4 rounded-lg">
    主色背景区块
  </div>

  <div class="bg-surface-50 dark:bg-surface-800 p-4">
    自适应深色背景
  </div>

  <Button class="!bg-primary-600 hover:!bg-primary-700">
    自定义 Tailwind 样式按钮
  </Button>
</template>
```

> **`!` 前缀** 表示 Tailwind 的 `important`——覆盖 PrimeVue 默认样式时常用。

### 与 darkModeSelector 配合

如果用 Tailwind 暗色 + PrimeVue 暗色——两者用同一选择器：

```ts
// main.ts
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '.dark',                // 与 Tailwind dark: 前缀同步
    },
  },
})
```

```css
/* style.css (Tailwind v4) */
@import "tailwindcss";
@plugin "tailwindcss-primeui";
@custom-variant dark (&:where(.dark, .dark *));
```

```js
// tailwind.config.js (Tailwind v3)
export default {
  darkMode: ['selector', '.dark'],              // 与 PrimeVue 同步
}
```

## PassThrough (pt) 深度

PassThrough 是 PrimeVue 4 的核心创新——**深度自定义组件内部 DOM 元素**：

### 基础用法（pt prop）

```vue
<template>
  <Button
    label="登录"
    :pt="{
      root: { class: 'my-button-root' },
      label: { class: 'my-button-label', style: { fontWeight: 'bold' } },
    }"
  />
</template>
```

### 声明式 pt 语法

```vue
<Button label="登录" pt:root:class="my-button-root" pt:label:class="my-button-label" />
```

### pt 接受的值类型

| 类型 | 示例 |
|---|---|
| **string** | `pt:root="my-class"` —— 等价 class |
| **object** | `pt:root="{ class: '...', style: '...', onClick: () => ... }"` |
| **function** | 接收组件 context、返回 object（动态 class） |

### 函数式 pt（动态 class）

```vue
<template>
  <DataTable
    :value="users"
    :pt="{
      bodyRow: ({ state, context }) => ({
        class: context.selected ? 'bg-blue-50' : '',
      }),
    }"
  >
    <Column field="name" header="姓名" />
  </DataTable>
</template>
```

### 全局 pt 配置（影响所有该组件实例）

```ts
// main.ts
app.use(PrimeVue, {
  theme: { preset: Aura },
  pt: {
    // 所有 Button 自动应用
    button: {
      root: { class: 'global-button' },
      label: { class: 'font-medium' },
    },
    // 所有 InputText
    inputtext: {
      root: { class: 'rounded-lg border-gray-300' },
    },
  },
})
```

### pcXxx 前缀（嵌套子组件）

某些 PrimeVue 组件内部使用其他 PrimeVue 组件——用 `pc` 前缀的 section 名：

```vue
<Button
  label="选择文件"
  badge="3"
  :pt="{
    root: { class: 'my-btn' },
    pcBadge: {                                 // ← 内部 Badge 组件
      root: { class: '!bg-red-500' },
    },
  }"
/>
```

### pt hooks（生命周期回调）

```vue
<Button
  label="点击"
  :pt="{
    hooks: {
      onMounted: () => console.log('Button mounted'),
      onUpdated: () => console.log('Button updated'),
      onUnmounted: () => console.log('Button unmounted'),
    },
  }"
/>
```

### `usePassThrough` 合并基础配置

```ts
import { usePassThrough } from 'primevue/passthrough'

const myPT = usePassThrough(
  basePT,                                       // 基础 pt 配置
  customPT,                                     // 自定义 pt（覆盖）
  {
    mergeSections: true,                        // 合并 section（默认）
    mergeProps: true,                           // 合并 props
  },
)

// 然后传给 PrimeVue plugin
app.use(PrimeVue, {
  pt: myPT,
})
```

## 反馈三件套：Toast / Confirm / Dialog

PrimeVue 的弹窗 API 都是 **Plugin + 占位容器 + Composable** 三件套。

### `useToast` 顶部消息

**main.ts**：

```ts
import ToastService from 'primevue/toastservice'
app.use(ToastService)
```

**App.vue**：

```vue
<template>
  <Toast position="top-right" />              <!-- 占位容器（必须） -->
  <router-view />
</template>
```

**子组件**：

```vue
<script setup lang="ts">
import { useToast } from 'primevue/usetoast'

const toast = useToast()

const showToast = () => {
  toast.add({
    severity: 'success',
    summary: '保存成功',
    detail: '数据已保存到服务器',
    life: 3000,                                 // ms（不设 = 不自动消失）
    closable: true,
    group: 'default',                           // 分组（配合多个 Toast 占位用）
  })

  // 清空所有
  toast.removeAllGroups()
}
</script>
```

**severity 取值**：`success` / `info` / `warn` / `error` / `secondary` / `contrast`

**Toast position**：`top-right`（默认） / `top-left` / `top-center` / `bottom-right` / `bottom-left` / `bottom-center` / `center`

### `useConfirm` 确认对话框

**main.ts**：

```ts
import ConfirmationService from 'primevue/confirmationservice'
app.use(ConfirmationService)
```

**App.vue**：

```vue
<template>
  <ConfirmDialog />
  <router-view />
</template>
```

**子组件**：

```vue
<script setup lang="ts">
import { useConfirm } from 'primevue/useconfirm'

const confirm = useConfirm()

const onDelete = () => {
  confirm.require({
    message: '确定要删除该记录？',
    header: '确认删除',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
      label: '取消',
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: '确定',
      severity: 'danger',
    },
    accept: () => {
      console.log('已删除')
    },
    reject: () => {
      console.log('已取消')
    },
  })
}
</script>
```

### `useConfirm` Popup 风格（按钮旁边气泡）

```vue
<template>
  <ConfirmPopup />                              <!-- ← Popup 风格用这个 -->
  <Button @click="confirmDelete($event)" label="删除" />
</template>

<script setup>
const confirm = useConfirm()

const confirmDelete = (event: MouseEvent) => {
  confirm.require({
    target: event.currentTarget as HTMLElement,
    message: '确定？',
    icon: 'pi pi-exclamation-triangle',
    accept: () => console.log('删除'),
  })
}
</script>
```

### `useDialog` 动态对话框（命令式打开 Vue 组件）

**main.ts**：

```ts
import DialogService from 'primevue/dialogservice'
app.use(DialogService)
```

**App.vue**：

```vue
<template>
  <DynamicDialog />
  <router-view />
</template>
```

**子组件**：

```vue
<script setup lang="ts">
import { useDialog } from 'primevue/usedialog'
import UserEditDialog from './UserEditDialog.vue'

const dialog = useDialog()

const openEdit = (user: any) => {
  dialog.open(UserEditDialog, {
    props: {
      header: `编辑 ${user.name}`,
      style: { width: '50vw' },
      modal: true,
    },
    data: { user },
    onClose: (options) => {
      if (options?.data?.saved) {
        console.log('已保存')
      }
    },
  })
}
</script>
```

**`UserEditDialog.vue`**：

```vue
<template>
  <div>
    <p>编辑：{{ data.user.name }}</p>
    <InputText v-model="form.name" />
    <Button label="保存" @click="save" />
  </div>
</template>

<script setup lang="ts">
import { inject, ref } from 'vue'

const dialogRef = inject('dialogRef') as any
const data = dialogRef.value.data

const form = ref({ name: data.user.name })

const save = () => {
  // 保存逻辑...
  dialogRef.value.close({ saved: true, name: form.value.name })
}
</script>
```

> **`useDialog` vs `useConfirm`**：useConfirm 用来「显示确认对话框」、useDialog 用来「打开任意 Vue 组件作为对话框」——后者更灵活、适合复杂表单。

## Locale 中文配置 + setLocale 动态切换

### main.ts 配置中文

见 [入门 > 中文国际化](./getting-started.md#中文国际化) 完整 locale 对象。

### 动态切换语言

```vue
<template>
  <Select
    v-model="currentLang"
    :options="languages"
    option-label="label"
    option-value="value"
    @change="switchLanguage"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { usePrimeVue } from 'primevue/config'

const $primevue = usePrimeVue()

const currentLang = ref('zh-CN')

const languages = [
  { label: '简体中文', value: 'zh-CN' },
  { label: 'English', value: 'en-US' },
]

const switchLanguage = async () => {
  const locale = await import(`./locales/${currentLang.value}.ts`)
  $primevue.config.locale = locale.default
}
</script>
```

### 与 vue-i18n 集成

```ts
// main.ts
import { createI18n } from 'vue-i18n'
import zhCNApp from './locales/app/zh-cn'
import enUSApp from './locales/app/en-us'
import zhCNPrimeVue from './locales/primevue/zh-cn'
import enUSPrimeVue from './locales/primevue/en-us'

const i18n = createI18n({
  locale: 'zh-cn',
  messages: { 'zh-cn': zhCNApp, 'en-us': enUSApp },
})

app.use(i18n)
app.use(PrimeVue, {
  theme: { preset: Aura },
  locale: zhCNPrimeVue,
})
```

App.vue 同步：

```vue
<script setup lang="ts">
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePrimeVue } from 'primevue/config'

const { locale } = useI18n()
const $primevue = usePrimeVue()

watch(locale, async (newLocale) => {
  const primeLocale = await import(`./locales/primevue/${newLocale}.ts`)
  $primevue.config.locale = primeLocale.default
})
</script>
```

## SSR + Nuxt 完整方案

### Nuxt（推荐用 `@primevue/nuxt-module`）

见 [入门 > Nuxt 集成](./getting-started.md#nuxt-集成推荐用官方模块)。

### Vite SSR 手动配置

```ts
// vite.config.ts
export default defineConfig({
  ssr: {
    noExternal: ['primevue', '@primeuix/themes', 'primeicons'],
  },
})
```

```ts
// entry-server.ts
import { renderToString } from 'vue/server-renderer'
import { createApp } from './main'

export async function render(url: string) {
  const { app, router } = createApp()
  await router.push(url)
  await router.isReady()

  const html = await renderToString(app)
  return { html }
}
```

> **PrimeVue 4 基于 CSS 变量主题、SSR 友好**——不像 Naive UI CSS-in-JS 需要 critical CSS 收集。

### SSR Hydration Mismatch

如果某些组件 SSR 时显示异常—— 用 `<ClientOnly>` 包裹（特别是 Tooltip / Popover 等 portal 组件）：

```vue
<template>
  <ClientOnly>
    <Tooltip target=".my-button" />
  </ClientOnly>
</template>
```

## 与 Vue Router + Pinia 集成

### Menubar 配合 Router

```vue
<template>
  <Menubar :model="items">
    <template #item="{ item, props }">
      <a v-bind="props.action" @click="navigateTo(item)">
        <span :class="item.icon" />
        <span>{{ item.label }}</span>
      </a>
    </template>
  </Menubar>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { MenuItem } from 'primevue/menuitem'

const router = useRouter()

const items: MenuItem[] = [
  {
    label: '仪表盘',
    icon: 'pi pi-home',
    route: '/',
  },
  {
    label: '用户管理',
    icon: 'pi pi-users',
    items: [
      { label: '用户列表', icon: 'pi pi-list', route: '/users' },
      { label: '角色管理', icon: 'pi pi-shield', route: '/roles' },
    ],
  },
]

const navigateTo = (item: any) => {
  if (item.route) router.push(item.route)
}
</script>
```

### Breadcrumb 面包屑

```vue
<template>
  <Breadcrumb :model="items" :home="home">
    <template #item="{ item, props }">
      <RouterLink v-if="item.route" :to="item.route" v-slot="{ navigate, href }">
        <a :href="href" v-bind="props.action" @click="navigate">
          <span :class="item.icon" />
          <span>{{ item.label }}</span>
        </a>
      </RouterLink>
    </template>
  </Breadcrumb>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()

const home = { icon: 'pi pi-home', route: '/' }

const items = computed(() =>
  route.matched.slice(1).map((m) => ({
    label: m.meta.title,
    route: m.path,
  }))
)
</script>
```

### 与 Pinia 配合（在 store 中调用 useToast）

**问题**：`useToast` 等 Composable 必须在 setup / Vue 组件上下文内调用——store 中如何用？

**方案 1：通过组件传递**

```ts
// stores/user.ts
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', () => {
  const login = async (credentials: any, toast: any) => {
    try {
      // ...
      toast.add({ severity: 'success', summary: '登录成功' })
    } catch (err) {
      toast.add({ severity: 'error', summary: '登录失败' })
    }
  }

  return { login }
})
```

```vue
<script setup>
import { useToast } from 'primevue/usetoast'
import { useUserStore } from '@/stores/user'

const toast = useToast()
const userStore = useUserStore()

const handleLogin = async () => {
  await userStore.login(credentials, toast)
}
</script>
```

**方案 2：在 store action 中直接 useToast**（Pinia 的 setup-style store + 调用时机在组件 context 内）：

```ts
// stores/user.ts
import { defineStore } from 'pinia'
import { useToast } from 'primevue/usetoast'

export const useUserStore = defineStore('user', () => {
  // 注意：useToast() 只在 store 被 setup 内首次调用时才能 work
  const toast = useToast()

  const login = async () => {
    try {
      toast.add({ severity: 'success', summary: '登录成功' })
    } catch (err) {
      toast.add({ severity: 'error', summary: '登录失败' })
    }
  }

  return { login }
})
```

> **比 Naive UI `createDiscreteApi` 麻烦**——PrimeVue 没有「脱离 Provider」的官方 API。

## 常见踩坑

### 1. PrimeIcons 图标不显示

**原因**：忘记 import `primeicons/primeicons.css`。

**解决**：

```ts
// main.ts
import 'primeicons/primeicons.css'             // ← 必须
```

### 2. 主题路径报错（`primevue/resources/themes/...` 找不到）

**原因**：v3 主题路径在 v4 已废弃。

**解决**：换成 v4 的 `@primeuix/themes`：

```ts
// ❌ v3 写法（v4 不支持）
import 'primevue/resources/themes/aura-light-blue/theme.css'

// ✅ v4 写法
import Aura from '@primeuix/themes/aura'
app.use(PrimeVue, { theme: { preset: Aura } })
```

### 3. 组件名找不到（v4 改名）

PrimeVue 4 重命名了几个组件：

| v3 名称 | v4 名称 |
|---|---|
| `Calendar` | **`DatePicker`** |
| `Dropdown` | **`Select`** |
| `OverlayPanel` | **`Popover`** |
| `InputSwitch` | **`ToggleSwitch`** |
| `Sidebar` | **`Drawer`** |
| `TabView` / `TabPanel` | **`Tabs` / `TabPanel` / `TabList` / `TabPanels` / `Tab`** |

**解决**：v3 → v4 升级时全局替换组件名。

### 4. `useToast` / `useConfirm` 报错「No PrimeVue Toast Service」

**原因**：忘记 `app.use(ToastService)` 或忘记放占位容器 `<Toast />`。

**解决**：

```ts
// main.ts
import ToastService from 'primevue/toastservice'
app.use(ToastService)
```

```vue
<!-- App.vue（占位容器必须放） -->
<template>
  <Toast />
  <router-view />
</template>
```

### 5. Form 字段不识别（`name` prop 漏写）

```vue
<!-- 错误：没有 name -->
<Form :resolver="resolver">
  <InputText placeholder="用户名" />            <!-- ❌ -->
</Form>

<!-- 正确 -->
<Form :resolver="resolver">
  <InputText name="username" placeholder="用户名" /> <!-- ✅ -->
</Form>
```

### 6. DataTable 列定义不能用 columns 数组

**原因**：PrimeVue 设计上列定义用 `<Column>` 模板（不像 Naive UI 用 JS 数组）。

```vue
<!-- ❌ 错误（不工作） -->
<DataTable :value="rows" :columns="columns" />

<!-- ✅ 正确 -->
<DataTable :value="rows">
  <Column field="name" header="姓名" />
  <Column field="age" header="年龄" />
</DataTable>
```

### 7. selectionMode 没有 dataKey 导致选择异常

```vue
<!-- ❌ 错误：没 data-key 选择行为异常 -->
<DataTable v-model:selection="selected" :value="rows" selection-mode="multiple">

<!-- ✅ 正确 -->
<DataTable v-model:selection="selected" :value="rows" selection-mode="multiple" data-key="id">
```

### 8. Tailwind 与 PrimeVue 样式冲突

**原因**：Tailwind 的 reset / preflight 与 PrimeVue 默认样式冲突。

**解决**：用 CSS Layer 控制优先级：

```ts
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      cssLayer: {
        name: 'primevue',
        order: 'tailwind-base, primevue, tailwind-utilities',
      },
    },
  },
})
```

### 9. pt 配置不生效

**原因 1**：组件用了 `unstyled` 模式——pt 仍然有效，但要确保 class 名正确。
**原因 2**：section 名错——每个组件的 section 名不同（见 [PrimeVue 官网每个组件的 PT 章节](https://primevue.org/passthrough/)）。

```vue
<!-- Button 的 section：root / label / icon -->
<Button :pt="{ root: { class: '...' }, label: { class: '...' } }" />

<!-- DataTable 的 section：root / header / body / footer / paginatorContainer / ... -->
<DataTable :pt="{ root: { class: '...' }, header: { class: '...' } }" />
```

### 10. 暗色模式 class 加错位置

**原因**：`darkModeSelector: '.dark'` 配置后，要在 `<html>` 或 `<body>` 加该 class——而不是某个子元素。

```ts
// main.ts
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: { darkModeSelector: '.dark' },
  },
})
```

```ts
// 错误：加在子元素无效
document.querySelector('#app').classList.add('dark')

// 正确：加在 html
document.documentElement.classList.add('dark')
```

### 11. SSR 闪烁（主题在客户端水合时切换）

**原因**：SSR 时 `darkModeSelector` 的 class 没被预先注入 HTML。

**解决**：用 Nuxt 模块（自动处理）或在 SSR entry 中根据 cookie 提前注入 class：

```ts
// SSR entry-server.ts
if (cookies.theme === 'dark') {
  html = html.replace('<html', '<html class="dark"')
}
```

### 12. Form initialValues 类型推导丢失

```vue
<!-- 推导不出来 -->
<Form :initial-values="initialValues">

<!-- 显式声明类型 -->
<script setup lang="ts">
interface FormValues {
  username: string
  email: string
}

const initialValues: FormValues = {
  username: '',
  email: '',
}
</script>
```

## 下一步

- [参考](./reference.md)：**API 速查** / 90+ 组件分组列表 / 常用 props 表 / Plugin 配置选项 / `@primeuix/themes` 4 大预设 API / `definePreset` / `useToast` / `useConfirm` / `useDialog` 签名 / TypeScript 类型 / `tailwindcss-primeui` 工具类 / PassThrough section 速查
