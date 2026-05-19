---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 Vuetify 3.x。包含 100+ 组件分类速览、Form 完整方案（v-form + rules + vee-validate）、Data Table 深度、Application Layout、Theme System 深度、国际化 + RTL、Composables、SSR + Nuxt、常见踩坑。

## 速查

- **组件按类别**：Application（5）+ Form（25）+ Data（30）+ Navigation（10）+ Layout（10）+ Feedback（10）+ Surfaces（10）+ Lists（5）= **100+ 组件**
- **必备根组件**：`<v-app>` 包裹整个 App、所有 Layout 组件才能正确协调
- **Form 核心**：`<v-form ref="formRef" @submit.prevent="submit">` + `<v-text-field :rules="[...]">` + `await formRef.value.validate()` 返回 `{ valid, errors }`
- **DataTable 核心**：`<v-data-table :headers :items>` 客户端模式 / `<v-data-table-server :items-length>` 服务端模式
- **Application Layout**：`<v-app-bar>` 顶部 + `<v-navigation-drawer>` 侧边 + `<v-main>` 主区 + `<v-footer app>` 底部 —— 自动协调位置
- **栅格系统**：`<v-container>` + `<v-row>` + `<v-col cols="12" md="6">` 12 栅格
- **主题**：`createVuetify({ theme })` + `useTheme().global.name.value = 'dark'` 运行时切换
- **暗色**：`createVuetify({ theme: { defaultTheme: 'dark' } })` 或 `'system'` 跟随系统
- **多主题**：`themes: { light, dark, custom1, custom2 }` 任意数量
- **国际化**：`createVuetify({ locale: { locale: 'zhHans', messages: { zhHans, en } } })`
- **RTL**：`createVuetify({ locale: { rtl: { ar: true } } })` 阿拉伯语自动 RTL
- **图标**：`<v-icon icon="mdi-home" />` 直接传 `'mdi-*'` 字符串（默认 MDI Font）
- **响应式**：`const { mobile, mdAndUp, smAndDown } = useDisplay()` —— **响应式 ref**
- **全局默认**：`createVuetify({ defaults: { VBtn: { variant: 'flat' } } })`
- **SSR**：`createVuetify({ ssr: true })` 或 Nuxt 用 `@vuetify/nuxt-module`
- **Date Adapter**：默认 date-fns、可切换 luxon / dayjs / moment

## 100+ 组件分类速览

Vuetify 把所有组件分为 **7+ 大类**——熟悉分类有助于快速找到合适的组件：

### Application（应用框架，5 个）

| 组件 | 标签 | 用途 |
|---|---|---|
| App | v-app | **必须的根组件**，启用 Layout 系统 |
| AppBar | v-app-bar | 顶部 App Bar（标题栏） |
| NavigationDrawer | v-navigation-drawer | 侧边抽屉 |
| Main | v-main | 主内容区（自动避开 AppBar/Drawer） |
| Footer | v-footer | 底部 |
| BottomNavigation | v-bottom-navigation | 移动端底部导航 |
| SystemBar | v-system-bar | 顶部状态栏（移动端） |

### Form（表单，25 个）

输入控件——所有输入类组件：

| 组件 | 标签 | 用途 |
|---|---|---|
| Form | v-form | 表单容器 + 校验 |
| TextField | v-text-field | 文本输入 |
| Textarea | v-textarea | 多行输入 |
| Select | v-select | 下拉选择 |
| Combobox | v-combobox | 输入 + 下拉（可输入新值） |
| Autocomplete | v-autocomplete | 自动补全（带搜索过滤） |
| FileInput | v-file-input | 文件上传 |
| Checkbox | v-checkbox | 复选框 |
| CheckboxBtn | v-checkbox-btn | 复选框按钮（无 label 包裹） |
| Radio | v-radio | 单选框 |
| RadioGroup | v-radio-group | 单选组 |
| Switch | v-switch | 开关 |
| Slider | v-slider | 滑块 |
| RangeSlider | v-range-slider | 范围滑块（双滑块） |
| OtpInput | v-otp-input | 验证码输入 |
| Counter | v-counter | 字符计数器 |
| Input | v-input | 通用 Input 容器（底层） |
| Field | v-field | 通用 Field 容器（底层） |
| Label | v-label | 输入框标签 |
| Rating | v-rating | 评分 |
| ColorPicker | v-color-picker | 颜色选择器 |
| DatePicker | v-date-picker | 日期选择器 |
| TimePicker | v-time-picker（labs） | 时间选择器 |
| NumberInput | v-number-input（labs） | 数字输入 |

### Data（数据展示，30 个）

只读 / 展示型组件：

| 组件 | 标签 | 用途 |
|---|---|---|
| DataTable | v-data-table | 客户端表格 |
| DataTableServer | v-data-table-server | 服务端表格（外部分页 / 排序 / 筛选） |
| DataTableVirtual | v-data-table-virtual | 虚拟化表格 |
| DataIterator | v-data-iterator | 通用数据迭代器（自定义渲染） |
| List | v-list | 列表 |
| ListItem | v-list-item | 列表项 |
| ListGroup | v-list-group | 列表分组 |
| ListSubheader | v-list-subheader | 列表小标题 |
| TreeView | v-treeview（labs） | 树视图 |
| Pagination | v-pagination | 分页 |
| Chip | v-chip | 标签（可点击 / 可删除） |
| ChipGroup | v-chip-group | 标签组 |
| Avatar | v-avatar | 头像 |
| Badge | v-badge | 徽标（红点 / 数字） |
| Progress | v-progress-linear / v-progress-circular | 进度条 / 圆形进度 |
| Skeleton | v-skeleton-loader | 骨架屏 |
| EmptyState | v-empty-state | 空状态 |
| Img | v-img | 图片（懒加载 + 占位） |
| Icon | v-icon | 图标 |
| Carousel | v-carousel | 走马灯 |
| Banner | v-banner | 横幅 |
| Calendar | v-calendar（labs） | 日历 |
| Sparkline | v-sparkline | 迷你折线图 |
| Table | v-table | 简单表格（不带分页 / 排序） |
| InfiniteScroll | v-infinite-scroll | 无限滚动 |
| Timeline | v-timeline | 时间线 |
| TimelineItem | v-timeline-item | 时间线条目 |
| VirtualScroll | v-virtual-scroll | 虚拟滚动 |
| ParallaxImg | v-parallax | 视差图片 |
| HoverCard | v-hover | hover 状态包裹器 |

### Navigation（导航，10 个）

页面导航组件：

| 组件 | 标签 | 用途 |
|---|---|---|
| Tabs | v-tabs / v-tab | 标签页 |
| TabsWindow | v-tabs-window / v-tabs-window-item | Tab 内容（替代旧 v-window） |
| Window | v-window / v-window-item | 走马灯 / Tab 内容容器 |
| Stepper | v-stepper | 步骤条 |
| Breadcrumbs | v-breadcrumbs | 面包屑 |
| Menu | v-menu | 下拉菜单 |
| Speeddial | v-speed-dial | 浮动操作按钮组 |
| Toolbar | v-toolbar | 工具栏（独立于 v-app-bar） |
| AppBarTitle / AppBarNavIcon | v-app-bar-title / v-app-bar-nav-icon | App Bar 子组件 |
| ConfirmEdit | v-confirm-edit（labs） | 确认编辑 |

### Layout（布局，10 个）

布局容器组件：

| 组件 | 标签 | 用途 |
|---|---|---|
| Container | v-container | 容器（响应式宽度限制） |
| Row | v-row | 行（12 栅格） |
| Col | v-col | 列（cols / md / lg 响应式宽度） |
| Spacer | v-spacer | 弹性间距（撑满剩余空间） |
| Divider | v-divider | 分割线 |
| Layout | v-layout | 通用 Layout 容器 |
| LayoutItem | v-layout-item | Layout 项（用于自定义 Layout） |
| MainSidebar | v-main-sidebar（labs） | 主侧栏（多 Drawer 场景） |
| Sheet | v-sheet | 通用 Sheet 容器（带背景 / 圆角 / 阴影） |
| ResponsiveContainer | v-responsive | 响应式容器（保持比例） |

### Feedback（反馈，10 个）

用户反馈组件——弹窗 / 通知 / Loading：

| 组件 | 标签 | 用途 |
|---|---|---|
| Dialog | v-dialog | 对话框 |
| Snackbar | v-snackbar | 消息提示（底部条） |
| SnackbarQueue | v-snackbar-queue（labs） | 消息队列 |
| Alert | v-alert | 警告提示 |
| AlertTitle | v-alert-title | Alert 标题 |
| Tooltip | v-tooltip | 文字提示 |
| ProgressLinear | v-progress-linear | 线性进度条 |
| ProgressCircular | v-progress-circular | 圆形进度条 |
| Overlay | v-overlay | 遮罩 |
| BottomSheet | v-bottom-sheet | 底部表单（移动端） |

### Surfaces（表面，10 个）

容器表面组件——卡片 / 按钮 / 表面：

| 组件 | 标签 | 用途 |
|---|---|---|
| Card | v-card | 卡片 |
| CardTitle / CardSubtitle / CardText / CardActions | v-card-* | Card 子组件 |
| Btn | v-btn | 按钮 |
| BtnGroup | v-btn-group | 按钮组 |
| BtnToggle | v-btn-toggle | 单/多选按钮组 |
| Fab | v-fab | 浮动操作按钮 |
| ExpansionPanels | v-expansion-panels | 折叠面板 |
| ExpansionPanel | v-expansion-panel | 折叠条目 |
| Bottom Sheet | v-bottom-sheet | 移动端底部抽屉 |
| Sheet | v-sheet | 通用表面容器 |

## Form 表单完整方案

Vuetify 的 Form 是基于「**规则函数数组**」的轻量校验系统——比 Element Plus 的 async-validator 简单，复杂场景可结合 vee-validate / Zod。

### 基础用法（v-form + rules）

```vue
<template>
  <v-form ref="formRef" @submit.prevent="submit">
    <v-text-field
      v-model="form.name"
      label="姓名"
      :rules="[v => !!v || '姓名不能为空']"
      variant="outlined"
    />

    <v-text-field
      v-model="form.email"
      label="邮箱"
      :rules="[
        v => !!v || '邮箱不能为空',
        v => /.+@.+\..+/.test(v) || '邮箱格式不正确',
      ]"
      variant="outlined"
    />

    <v-btn color="primary" type="submit">提交</v-btn>
    <v-btn class="ml-2" @click="reset">重置</v-btn>
  </v-form>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import type { VForm } from 'vuetify/components'

const formRef = ref<VForm>()
const form = reactive({ name: '', email: '' })

const submit = async () => {
  // validate() 返回 Promise<{ valid: boolean, errors: ErrorMessage[] }>
  const { valid, errors } = await formRef.value!.validate()
  if (valid) {
    console.log('提交：', form)
  } else {
    console.log('校验错误：', errors)
  }
}

const reset = () => {
  formRef.value?.reset()         // 清空所有字段
  // formRef.value?.resetValidation()  // 仅清除校验状态、不清空字段
}
</script>
```

> **核心概念**：
>
> 1. `<v-form ref="formRef">` 包裹所有输入字段
> 2. 每个输入字段 `:rules="[fn1, fn2]"` —— **规则是函数数组**，每个函数 `(value) => true | 'error message'`
> 3. `formRef.value.validate()` 返回 Promise，包含 `{ valid, errors }`

### 校验规则（Rules）

**规则签名**：

```ts
type Rule = (value: any) => boolean | string | Promise<boolean | string>

// 返回 true → 校验通过
// 返回 string → 校验失败，string 作为错误信息
```

**常用规则**：

```ts
const rules = {
  // 必填
  required: (v: any) => !!v || '不能为空',

  // 最小长度
  min: (n: number) => (v: string) => (v && v.length >= n) || `至少 ${n} 个字符`,

  // 最大长度
  max: (n: number) => (v: string) => (v && v.length <= n) || `最多 ${n} 个字符`,

  // 邮箱
  email: (v: string) => /.+@.+\..+/.test(v) || '邮箱格式不正确',

  // 手机号
  mobile: (v: string) => /^\d{11}$/.test(v) || '手机号格式不正确',

  // 数字
  number: (v: string) => !isNaN(Number(v)) || '必须是数字',

  // 异步校验
  uniqueUsername: async (v: string) => {
    const exists = await api.checkUsername(v)
    return !exists || '用户名已存在'
  },
}
```

**使用**：

```vue
<v-text-field
  v-model="form.username"
  label="用户名"
  :rules="[rules.required, rules.min(6), rules.max(20), rules.uniqueUsername]"
/>
```

### useRules Composable（Vuetify 3.8+）

Vuetify Labs 提供了 `useRules` composable——**内置常用规则**：

```vue
<template>
  <v-form @submit.prevent="submit">
    <v-text-field
      label="邮箱"
      :rules="[rules.required(), rules.email()]"
    />
    <v-text-field
      label="密码"
      type="password"
      :rules="[rules.required(), rules.min(8)]"
    />
    <v-btn type="submit" text="提交" />
  </v-form>
</template>

<script setup lang="ts">
import { useRules } from 'vuetify/labs/rules'

const rules = useRules()

const submit = async (e: Event) => {
  await e  // submit 事件是一个 Promise（自动等待校验）
  console.log('提交')
}
</script>
```

> **内置规则**：`required()` / `email()` / `min(n)` / `max(n)` / `between(a, b)` / `regex(pattern)` / `url()` / `numeric()` 等——支持自动国际化（中文 / 英文等）。

### validate-on（校验时机）

`<v-form validate-on="submit">` 控制何时触发校验：

| 取值 | 时机 |
|---|---|
| `'input'`（默认） | 输入时校验 |
| `'blur'` | 失焦时校验 |
| `'submit'` | 仅提交时校验 |
| `'invalid-input'` | 首次提交后改为 input（最佳 UX） |
| `'eager'` | 立即校验（页面加载就显示错误） |
| `'lazy'` | 仅手动调用 validate() 才校验 |

> **推荐 `'submit lazy'`**：提交前不显示错误、提交后立即显示——避免用户输入时就被红圈吓到。

```vue
<v-form validate-on="submit lazy" @submit.prevent="submit">
  <!-- ... -->
</v-form>
```

### 提交时表单状态

```vue
<v-form v-model="isValid" @submit.prevent="submit">
  <!-- ... -->
  <v-btn type="submit" :disabled="!isValid">提交</v-btn>
</v-form>

<script setup>
const isValid = ref(false)  // 表单整体是否合法
</script>
```

> `v-model` 是表单整体合法性的 ref——所有字段合法 → `true`。

### 与 vee-validate / Zod 集成

复杂表单（嵌套对象 / 动态字段 / 跨字段校验）推荐用 **vee-validate**：

```bash
pnpm add vee-validate yup
```

```vue
<template>
  <v-form @submit.prevent="onSubmit">
    <v-text-field v-model="name" :error-messages="nameErrors" label="姓名" />
    <v-text-field v-model="email" :error-messages="emailErrors" label="邮箱" />
    <v-btn type="submit">提交</v-btn>
  </v-form>
</template>

<script setup lang="ts">
import { useForm, useField } from 'vee-validate'
import * as yup from 'yup'

// 校验 schema
const schema = yup.object({
  name: yup.string().required('姓名不能为空'),
  email: yup.string().email('邮箱格式不正确').required('邮箱不能为空'),
})

const { handleSubmit } = useForm({ validationSchema: schema })

const { value: name, errorMessage: nameError } = useField<string>('name')
const { value: email, errorMessage: emailError } = useField<string>('email')

const nameErrors = computed(() => nameError.value ? [nameError.value] : [])
const emailErrors = computed(() => emailError.value ? [emailError.value] : [])

const onSubmit = handleSubmit((values) => {
  console.log('提交：', values)
})
</script>
```

> **关键**：vee-validate 提供 `errorMessage`，Vuetify v-text-field 的 `error-messages` prop 接受字符串数组——**桥接两者**。

### v-text-field 完整用法

```vue
<v-text-field
  v-model="value"
  label="标签"
  placeholder="占位"
  hint="提示信息"
  persistent-hint
  prepend-inner-icon="mdi-magnify"
  append-inner-icon="mdi-close"
  variant="outlined"
  density="comfortable"
  rounded="lg"
  type="text"
  :rules="rules"
  :error-messages="errors"
  clearable
  counter
  maxlength="50"
  :disabled="disabled"
  :readonly="readonly"
  :loading="loading"
/>
```

**variant 取值**：

| 值 | 风格 |
|---|---|
| `'filled'`（默认） | 填充背景 |
| `'outlined'` | 描边 |
| `'plain'` | 无装饰 |
| `'underlined'` | 仅下划线 |
| `'solo'` | 立体 |
| `'solo-inverted'` | 反色立体 |
| `'solo-filled'` | 填充立体 |

**density 取值**：

| 值 | 高度 |
|---|---|
| `'default'`（默认） | 标准 |
| `'comfortable'` | 紧凑 |
| `'compact'` | 极紧凑 |

### v-select / v-autocomplete / v-combobox

```vue
<!-- 简单 v-select -->
<v-select
  v-model="role"
  :items="['Admin', 'Editor', 'Viewer']"
  label="角色"
/>

<!-- v-select 对象数组 -->
<v-select
  v-model="userId"
  :items="users"
  item-title="name"
  item-value="id"
  label="用户"
/>

<!-- v-autocomplete（带搜索过滤） -->
<v-autocomplete
  v-model="city"
  :items="cities"
  label="城市"
/>

<!-- v-combobox（可输入新值） -->
<v-combobox
  v-model="tags"
  :items="suggestedTags"
  label="标签"
  multiple
  chips
  clearable
/>
```

> **三者区别**：
>
> - **v-select**：仅从 items 中选（不可搜索）
> - **v-autocomplete**：从 items 中选 + 可输入搜索过滤
> - **v-combobox**：v-autocomplete 基础上**可输入新值**（用户输入的新字符串也作为选项）

### v-checkbox / v-radio / v-switch

```vue
<!-- 单个 checkbox -->
<v-checkbox v-model="agree" label="我同意条款" />

<!-- checkbox 组 -->
<v-checkbox v-model="features" value="a" label="特性 A" />
<v-checkbox v-model="features" value="b" label="特性 B" />
<v-checkbox v-model="features" value="c" label="特性 C" />
<!-- features 是字符串数组 ['a', 'b', 'c'] -->

<!-- radio 组 -->
<v-radio-group v-model="size" label="尺寸">
  <v-radio label="小" value="sm" />
  <v-radio label="中" value="md" />
  <v-radio label="大" value="lg" />
</v-radio-group>

<!-- switch -->
<v-switch v-model="notifications" label="启用通知" color="primary" />
```

### v-file-input 文件上传

```vue
<v-file-input
  v-model="files"
  label="上传文件"
  accept="image/*"
  multiple
  show-size
  prepend-icon="mdi-camera"
  :rules="[v => !v?.length || v[0].size < 2 * 1024 * 1024 || '文件不能超过 2MB']"
/>
```

> **注意**：v-file-input 的 `v-model` 是 `File[]` 数组（即使 `multiple=false`）——单文件场景取 `files.value[0]`。

## Data Table 深度

`v-data-table` 是 Vuetify 最重要的数据展示组件——分为**客户端模式**（数据全部加载、内部排序/分页/过滤）和**服务端模式**（外部处理）。

### 客户端模式（v-data-table）

```vue
<v-data-table
  :headers="headers"
  :items="users"
  :items-per-page="10"
  :search="search"
  class="elevation-1"
>
  <!-- 顶部工具栏 -->
  <template #top>
    <v-toolbar flat>
      <v-toolbar-title>用户列表</v-toolbar-title>
      <v-spacer />
      <v-text-field
        v-model="search"
        prepend-inner-icon="mdi-magnify"
        label="搜索"
        single-line
        hide-details
        density="compact"
        style="max-width: 300px"
      />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="addUser">新增</v-btn>
    </v-toolbar>
  </template>

  <!-- 自定义列：avatar -->
  <template #item.avatar="{ item }">
    <v-avatar size="32">
      <v-img :src="item.avatar" />
    </v-avatar>
  </template>

  <!-- 自定义列：status -->
  <template #item.status="{ item }">
    <v-chip :color="item.status === 'active' ? 'success' : 'error'" size="small">
      {{ item.status }}
    </v-chip>
  </template>

  <!-- 自定义列：操作 -->
  <template #item.actions="{ item }">
    <v-btn icon="mdi-pencil" size="small" variant="text" @click="editUser(item)" />
    <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="deleteUser(item)" />
  </template>
</v-data-table>

<script setup lang="ts">
import { ref } from 'vue'

const search = ref('')

const headers = [
  { title: '头像', key: 'avatar', sortable: false },
  { title: '姓名', key: 'name' },
  { title: '邮箱', key: 'email' },
  { title: '角色', key: 'role' },
  { title: '状态', key: 'status' },
  { title: '操作', key: 'actions', sortable: false, align: 'end' },
]

const users = ref([
  { id: 1, name: '张三', email: 'zhangsan@example.com', role: 'Admin', status: 'active', avatar: '...' },
  // ...
])
</script>
```

**headers 配置项**：

```ts
interface DataTableHeader {
  title: string                    // 表头显示文字
  key: string                      // 对应数据字段
  value?: string | ((item) => any) // 自定义取值（默认取 item[key]）
  sortable?: boolean               // 是否可排序（默认 true）
  align?: 'start' | 'center' | 'end'
  width?: string | number
  minWidth?: string
  maxWidth?: string
  fixed?: boolean                  // 固定列（v3.5+）
  divider?: boolean
  cellClass?: string
  cellProps?: object               // 单元格 props
  headerProps?: object             // 表头 props
}
```

### 服务端模式（v-data-table-server）

数据量大时（>1000 行）用服务端模式——**排序/分页/过滤由后端处理**：

```vue
<v-data-table-server
  v-model:items-per-page="itemsPerPage"
  :headers="headers"
  :items="items"
  :items-length="totalItems"
  :loading="loading"
  :search="search"
  item-value="id"
  @update:options="loadItems"
>
  <!-- 自定义 slot 同 v-data-table -->
</v-data-table-server>

<script setup lang="ts">
import { ref } from 'vue'

const search = ref('')
const items = ref([])
const totalItems = ref(0)
const loading = ref(false)
const itemsPerPage = ref(10)

const headers = [
  { title: '姓名', key: 'name' },
  { title: '邮箱', key: 'email' },
]

interface LoadOptions {
  page: number
  itemsPerPage: number
  sortBy: { key: string, order: 'asc' | 'desc' }[]
  search: string
}

const loadItems = async ({ page, itemsPerPage, sortBy }: LoadOptions) => {
  loading.value = true
  try {
    const { data, total } = await api.getUsers({
      page,
      pageSize: itemsPerPage,
      sortBy: sortBy[0]?.key,
      sortOrder: sortBy[0]?.order,
      search: search.value,
    })
    items.value = data
    totalItems.value = total
  } finally {
    loading.value = false
  }
}
</script>
```

> **关键事件**：`@update:options` 在分页/排序/过滤变化时触发——回调中**发起后端请求**。

### v-data-table-virtual（虚拟化）

数据量超 **10000 行**、客户端模式但需要虚拟化：

```vue
<v-data-table-virtual
  :headers="headers"
  :items="items"
  :height="400"
  item-value="id"
/>
```

> 适用：数据全部在前端、需要快速滚动浏览的场景。

## Application Layout 完整方案

Vuetify 的 **Application Layout 系统**自动协调 AppBar / Drawer / Main / Footer 的位置——**写一个标准 Material 后台只需 5 个组件**。

### 完整 Layout 示例

```vue
<template>
  <v-app>
    <!-- 顶部 App Bar -->
    <v-app-bar color="primary" elevation="2">
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      <v-app-bar-title>我的应用</v-app-bar-title>
      <v-spacer />

      <!-- 搜索 -->
      <v-btn icon="mdi-magnify" @click="searchDialog = true" />

      <!-- 通知 -->
      <v-btn icon>
        <v-badge :content="unreadCount" color="error">
          <v-icon icon="mdi-bell" />
        </v-badge>
      </v-btn>

      <!-- 用户菜单 -->
      <v-menu>
        <template #activator="{ props }">
          <v-btn v-bind="props" icon>
            <v-avatar size="32">
              <v-img src="..." />
            </v-avatar>
          </v-btn>
        </template>
        <v-list>
          <v-list-item title="个人资料" prepend-icon="mdi-account" />
          <v-list-item title="设置" prepend-icon="mdi-cog" />
          <v-divider />
          <v-list-item title="退出" prepend-icon="mdi-logout" @click="logout" />
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- 左侧导航 -->
    <v-navigation-drawer v-model="drawer" :rail="rail">
      <v-list-item
        prepend-avatar="..."
        :title="user.name"
        :subtitle="user.email"
        nav
      >
        <template #append>
          <v-btn
            :icon="rail ? 'mdi-chevron-right' : 'mdi-chevron-left'"
            variant="text"
            @click="rail = !rail"
          />
        </template>
      </v-list-item>

      <v-divider />

      <v-list nav>
        <v-list-item prepend-icon="mdi-home" title="首页" to="/" />

        <v-list-group value="users">
          <template #activator="{ props }">
            <v-list-item v-bind="props" prepend-icon="mdi-account" title="用户管理" />
          </template>
          <v-list-item prepend-icon="mdi-account-multiple" title="用户列表" to="/users" />
          <v-list-item prepend-icon="mdi-shield-account" title="角色管理" to="/roles" />
        </v-list-group>

        <v-list-item prepend-icon="mdi-cog" title="系统设置" to="/settings" />
      </v-list>
    </v-navigation-drawer>

    <!-- 主内容区 -->
    <v-main>
      <v-container fluid>
        <router-view v-slot="{ Component }">
          <v-fade-transition hide-on-leave>
            <component :is="Component" />
          </v-fade-transition>
        </router-view>
      </v-container>
    </v-main>

    <!-- 底部 -->
    <v-footer app color="grey-lighten-3" height="40">
      <v-container fluid class="text-center text-body-small">
        © {{ new Date().getFullYear() }} 我的应用
      </v-container>
    </v-footer>
  </v-app>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const drawer = ref(true)        // 抽屉开关
const rail = ref(false)          // 收缩模式（仅显示图标）
const searchDialog = ref(false)
const unreadCount = ref(5)

const user = ref({ name: '张三', email: 'zhangsan@example.com' })

const logout = () => {
  // ...
}
</script>
```

### v-navigation-drawer 模式

`<v-navigation-drawer>` 有多种模式：

```vue
<!-- 默认：左侧抽屉，可关闭 -->
<v-navigation-drawer v-model="drawer" />

<!-- 永久显示（无法关闭） -->
<v-navigation-drawer permanent />

<!-- 临时模式（覆盖在内容上方、点击外部关闭） -->
<v-navigation-drawer v-model="drawer" temporary />

<!-- rail 收缩模式（仅显示图标） -->
<v-navigation-drawer v-model="drawer" :rail="rail" rail-width="60" />

<!-- 右侧 -->
<v-navigation-drawer v-model="drawer" location="right" />

<!-- 底部抽屉 -->
<v-navigation-drawer v-model="drawer" location="bottom" />

<!-- 自适应：mobile 自动 temporary、desktop 自动 permanent -->
<v-navigation-drawer v-model="drawer" :temporary="mobile" />
```

### 响应式 Layout

```vue
<template>
  <v-app>
    <v-app-bar>
      <!-- 移动端显示菜单按钮、桌面端隐藏 -->
      <v-app-bar-nav-icon v-if="mobile" @click="drawer = !drawer" />
      <v-app-bar-title>应用</v-app-bar-title>
    </v-app-bar>

    <!-- 桌面端 permanent、移动端 temporary -->
    <v-navigation-drawer
      v-model="drawer"
      :permanent="!mobile"
      :temporary="mobile"
    >
      <!-- ... -->
    </v-navigation-drawer>

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup>
import { ref } from 'vue'
import { useDisplay } from 'vuetify'

const { mobile } = useDisplay()
const drawer = ref(true)
</script>
```

> `useDisplay()` 返回响应式 ref——`mobile.value` 在窗口大小变化时自动更新。

### 12 栅格系统（v-container / v-row / v-col）

```vue
<v-container fluid>
  <v-row>
    <!-- 移动端 12 列、平板 6 列、桌面 4 列 -->
    <v-col cols="12" md="6" lg="4">
      <v-card>内容 1</v-card>
    </v-col>
    <v-col cols="12" md="6" lg="4">
      <v-card>内容 2</v-card>
    </v-col>
    <v-col cols="12" md="6" lg="4">
      <v-card>内容 3</v-card>
    </v-col>
  </v-row>
</v-container>
```

**断点**：

| 标识 | 宽度 |
|---|---|
| `xs` | <600px（移动端） |
| `sm` | 600-960px（小平板） |
| `md` | 960-1280px（平板） |
| `lg` | 1280-1920px（笔记本） |
| `xl` | 1920-2560px（桌面） |
| `xxl` | ≥2560px（4K） |

**v-col 响应式 props**：

```vue
<v-col cols="12" sm="6" md="4" lg="3" xl="2">
  <!-- 移动端 12 / 小平板 6 / 平板 4 / 笔记本 3 / 桌面 2 -->
</v-col>
```

**v-row props**：

```vue
<v-row
  no-gutters       // 取消间距
  align="center"   // 垂直居中
  justify="center" // 水平居中
  dense            // 紧凑
>
  <!-- ... -->
</v-row>
```

## Theme System 主题系统

Vuetify 的 Theme System 是其**最强大的特性之一**——多主题 + 运行时切换 + 强类型。

### 创建多主题

```ts
import { createVuetify } from 'vuetify'

const vuetify = createVuetify({
  theme: {
    defaultTheme: 'myLight',
    themes: {
      myLight: {
        dark: false,
        colors: {
          background: '#FFFFFF',
          surface: '#FFFFFF',
          primary: '#1867C0',
          secondary: '#48A9A6',
          accent: '#82B1FF',
          error: '#B00020',
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FB8C00',
        },
      },
      myDark: {
        dark: true,
        colors: {
          background: '#121212',
          surface: '#212121',
          primary: '#2196F3',
          secondary: '#424242',
        },
      },
      // 可以定义任意多个主题
      brand: {
        dark: false,
        colors: {
          primary: '#FF6B35',
          secondary: '#F7C59F',
        },
      },
    },
  },
})
```

### useTheme 运行时切换

```vue
<template>
  <v-app-bar>
    <v-btn icon @click="cycleTheme">
      <v-icon :icon="currentIcon" />
    </v-btn>
  </v-app-bar>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from 'vuetify'

const theme = useTheme()

// 当前主题信息
const currentName = computed(() => theme.global.name.value)
const isDark = computed(() => theme.global.current.value.dark)
const colors = computed(() => theme.global.current.value.colors)

const currentIcon = computed(() => {
  return isDark.value ? 'mdi-weather-sunny' : 'mdi-weather-night'
})

const themes = ['myLight', 'myDark', 'brand']
let currentIndex = 0

const cycleTheme = () => {
  currentIndex = (currentIndex + 1) % themes.length
  theme.global.name.value = themes[currentIndex]
}
</script>
```

### 主题颜色 prop（color）

所有组件的 `color` prop 可以传**主题颜色名**或**任意 CSS 颜色**：

```vue
<v-btn color="primary">主要</v-btn>
<v-btn color="error">错误</v-btn>
<v-btn color="brand">品牌</v-btn>     <!-- 自定义主题色 -->
<v-btn color="#FF5722">十六进制</v-btn>
<v-btn color="rgb(255, 87, 34)">RGB</v-btn>
```

### 局部主题（v-theme-provider）

某些组件需要不同于全局的主题——用 `<v-theme-provider>`：

```vue
<template>
  <v-app>
    <!-- 全局是 light，但这部分用 dark -->
    <v-theme-provider theme="myDark">
      <v-card>
        <v-card-title>暗色卡片</v-card-title>
        <v-card-text>这个卡片用 dark 主题</v-card-text>
      </v-card>
    </v-theme-provider>

    <!-- 这部分回到全局 light -->
    <v-card>
      <v-card-title>常规卡片</v-card-title>
    </v-card>
  </v-app>
</template>
```

### CSS 变量（运行时切换）

Vuetify 的主题颜色**自动生成 CSS 变量**：

```css
:root {
  --v-theme-primary: 24, 103, 192;        /* RGB tuple */
  --v-theme-secondary: 72, 169, 166;
  --v-theme-background: 255, 255, 255;
  --v-theme-surface: 255, 255, 255;
}

/* 暗色主题 */
.v-theme--myDark {
  --v-theme-primary: 33, 150, 243;
  --v-theme-background: 18, 18, 18;
}
```

业务样式中使用：

```scss
.my-card {
  // 使用 Vuetify 主题色
  background: rgb(var(--v-theme-background));
  color: rgb(var(--v-theme-on-background));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}
```

> **注意**：Vuetify 的 CSS 变量是 **RGB tuple 格式**（`24, 103, 192`）—— 用 `rgb(var(--v-theme-primary))` 包裹才能用、可以加透明度 `rgba(var(--v-theme-primary), 0.5)`。

### SCSS 变量重写

修改 Vuetify 全局 SCSS 变量（圆角 / 字体 / 间距）：

`src/styles/settings.scss`：

```scss
@use 'vuetify/settings' with (
  $color-pack: false,
  $body-font-family: ('Inter', sans-serif),
  $heading-font-family: ('Inter', sans-serif),
  $border-radius-root: 8px,
  $button-border-radius: 8px,
  $card-border-radius: 12px,
);
```

`vite.config.ts`：

```ts
import vuetify from 'vite-plugin-vuetify'

export default defineConfig({
  plugins: [
    vuetify({
      autoImport: true,
      styles: {
        configFile: 'src/styles/settings.scss',
      },
    }),
  ],
})
```

> **关键**：`vite-plugin-vuetify` 的 `styles.configFile` 指向自定义 SCSS 入口——SCSS 变量覆盖才能生效。

## 全局默认值（defaults）

`createVuetify({ defaults })` 让全 App 所有组件有统一默认 prop：

```ts
const vuetify = createVuetify({
  defaults: {
    // 所有组件
    global: {
      ripple: false,         // 关闭点击波纹
    },

    // VBtn 默认
    VBtn: {
      variant: 'flat',
      rounded: 'lg',
      color: 'primary',
    },

    // VTextField 默认
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
      hideDetails: 'auto',
    },

    // VCard 默认
    VCard: {
      elevation: 2,
      rounded: 'lg',
    },

    // VDataTable 默认
    VDataTable: {
      itemsPerPage: 20,
      density: 'comfortable',
    },

    // 嵌套默认（卡片内的 button 用不同风格）
    VCard: {
      VBtn: { variant: 'text' },
    },
  },
})
```

> **嵌套默认很强大**：`VCard > VBtn` 让 Card 内部的 v-btn 自动用 text variant、Card 外的 button 保持默认 flat。

## 国际化（i18n）

### 内置语言包

```ts
import { createVuetify } from 'vuetify'
import { zhHans, zhHant, en, ja, ko, fr, de, ar } from 'vuetify/locale'

const vuetify = createVuetify({
  locale: {
    locale: 'zhHans',
    fallback: 'en',
    messages: { zhHans, zhHant, en, ja, ko, fr, de, ar },
  },
})
```

### useLocale 切换

```vue
<template>
  <v-select
    v-model="lang"
    :items="languages"
    item-title="name"
    item-value="code"
    @update:model-value="changeLocale"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useLocale } from 'vuetify'

const { current } = useLocale()
const lang = ref(current.value)

const languages = [
  { code: 'zhHans', name: '简体中文' },
  { code: 'zhHant', name: '繁體中文' },
  { code: 'en', name: 'English' },
  { code: 'ja', name: '日本語' },
]

const changeLocale = (code: string) => {
  current.value = code
}
</script>
```

### 与 vue-i18n 集成

```ts
import { createApp } from 'vue'
import { createI18n, useI18n } from 'vue-i18n'
import { createVuetify } from 'vuetify'
import { createVueI18nAdapter } from 'vuetify/locale/adapters/vue-i18n'
import { en, zhHans } from 'vuetify/locale'

const i18n = createI18n({
  legacy: false,
  locale: 'zhHans',
  fallbackLocale: 'en',
  messages: {
    zhHans: {
      $vuetify: { ...zhHans },
      hello: '你好',          // 业务翻译
    },
    en: {
      $vuetify: { ...en },
      hello: 'Hello',
    },
  },
})

const vuetify = createVuetify({
  locale: {
    adapter: createVueI18nAdapter({ i18n, useI18n }),
  },
})

createApp(App)
  .use(i18n)
  .use(vuetify)
  .mount('#app')
```

> **关键**：Vuetify 内置文案放在 `$vuetify` 命名空间下——Vuetify 内部调用 `t('$vuetify.dataTable.itemsPerPageText')` 时能找到。

### RTL（阿拉伯语 / 希伯来语）

```ts
const vuetify = createVuetify({
  locale: {
    locale: 'ar',
    messages: { ar },
    rtl: {
      ar: true,
      he: true,
    },
  },
})
```

> `rtl.ar = true` 让 locale 切换到 `ar` 时**自动应用 RTL 布局**——所有 Vuetify 组件 mirror。

### useRtl Composable

```vue
<script setup>
import { useRtl } from 'vuetify'

const { isRtl, rtlClasses } = useRtl()

// isRtl.value: true / false
// rtlClasses.value: 'v-locale--is-rtl' 或 'v-locale--is-ltr'
</script>
```

## Composables 速查

Vuetify 提供多个 composable 供业务复用：

### useDisplay（响应式断点）

```vue
<script setup>
import { useDisplay } from 'vuetify'

const {
  // 当前断点
  name,            // Ref<'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'>

  // 当前断点判断
  xs, sm, md, lg, xl, xxl,        // Ref<boolean>

  // 区间判断（最常用）
  smAndDown,      // <960px
  smAndUp,        // ≥600px
  mdAndDown,      // <1280px
  mdAndUp,        // ≥960px

  // 简化（mobile = smAndDown）
  mobile,         // Ref<boolean>
  mobileBreakpoint, // 移动端断点（默认 'md'）

  // 窗口尺寸
  width,          // Ref<number>
  height,         // Ref<number>

  // 平台
  platform,       // { android, ios, mac, windows, ... }

  // 是否是触摸设备
  touch,          // Ref<boolean>
} = useDisplay()
</script>
```

**用法**：

```vue
<template>
  <!-- 移动端用 v-btn block、桌面端用普通 -->
  <v-btn :block="mobile" color="primary">提交</v-btn>

  <!-- 移动端不显示 -->
  <v-btn v-if="mdAndUp">辅助按钮</v-btn>
</template>
```

### useTheme（主题）

```vue
<script setup>
import { useTheme } from 'vuetify'

const theme = useTheme()

// 当前主题信息
theme.global.name.value           // 'light' / 'dark' / ...
theme.global.current.value.dark   // true / false
theme.global.current.value.colors // { primary: '...', ... }

// 切换主题
theme.global.name.value = 'dark'

// 修改主题颜色
theme.themes.value.light.colors.primary = '#FF5722'
</script>
```

### useLocale（i18n）

```vue
<script setup>
import { useLocale } from 'vuetify'

const { current, fallback, t } = useLocale()

// 切换当前语言
current.value = 'zhHans'

// 翻译
const msg = t('$vuetify.close')
</script>
```

### useDate（日期适配器）

```vue
<script setup>
import { useDate } from 'vuetify'

const date = useDate()

// 当前日期
const now = date.date()

// 格式化
const formatted = date.format(now, 'fullDateWithWeekday')  // 2026年5月19日 星期一

// 比较
const isAfter = date.isAfter(date1, date2)

// 加减
const tomorrow = date.addDays(now, 1)
</script>
```

> **底层适配器**：默认 `@date-io/date-fns`、可在 `createVuetify({ date })` 切换。

### useGoTo（滚动到指定位置）

```vue
<template>
  <v-btn @click="goToTop">回到顶部</v-btn>
  <v-btn @click="goToSection">跳到第 3 节</v-btn>
</template>

<script setup>
import { useGoTo } from 'vuetify'

const goTo = useGoTo()

const goToTop = () => goTo(0)
const goToSection = () => goTo('#section-3', { offset: -80 })
</script>
```

### useRtl

```vue
<script setup>
import { useRtl } from 'vuetify'

const { isRtl, rtlClasses } = useRtl()
</script>
```

## SSR + Nuxt 集成

### Nuxt 推荐：@vuetify/nuxt-module

```bash
pnpm add vuetify
pnpm add -D @vuetify/nuxt-module
pnpm add @mdi/font
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@vuetify/nuxt-module'],
  vuetify: {
    moduleOptions: {
      styles: { configFile: 'assets/settings.scss' },
    },
    vuetifyOptions: {
      theme: {
        defaultTheme: 'light',
        themes: {
          light: { /* ... */ },
          dark: { /* ... */ },
        },
      },
      locale: {
        locale: 'zhHans',
        fallback: 'en',
      },
      defaults: {
        VBtn: { variant: 'flat', rounded: 'lg' },
      },
    },
  },
  css: ['@mdi/font/css/materialdesignicons.css', 'vuetify/styles'],
})
```

**模块自动处理**：

- ✅ SSR + Hydration（自动 `ssr: true`）
- ✅ Tree Shaking + 按需引入
- ✅ Vuetify SCSS 变量重写
- ✅ 主题 + i18n + Date Adapter 集成
- ✅ Vuetify Labs 自动注册

### 手动 SSR（不用 Nuxt 模块）

```ts
// plugins/vuetify.ts
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'

export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    ssr: true,    // 关键：启用 SSR 模式
  })
  nuxtApp.vueApp.use(vuetify)
})
```

```ts
// nuxt.config.ts
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

export default defineNuxtConfig({
  build: {
    transpile: ['vuetify'],
  },
  vite: {
    plugins: [vuetify({ autoImport: true })],
    vue: {
      template: { transformAssetUrls },
    },
  },
})
```

### Hydration mismatch 处理

Vuetify 的 `<v-dialog>` / `<v-menu>` / `<v-tooltip>` 等组件用了 Teleport——SSR 时容易 hydration mismatch。

**方式 1**：`<ClientOnly>` 包裹（Nuxt）：

```vue
<template>
  <ClientOnly>
    <v-tooltip text="提示">
      <template #activator="{ props }">
        <v-btn v-bind="props">悬浮</v-btn>
      </template>
    </v-tooltip>
  </ClientOnly>
</template>
```

**方式 2**：手动 isClient flag：

```vue
<template>
  <v-tooltip v-if="isClient" text="提示">
    <template #activator="{ props }">
      <v-btn v-bind="props">悬浮</v-btn>
    </template>
  </v-tooltip>
</template>

<script setup>
import { ref, onMounted } from 'vue'
const isClient = ref(false)
onMounted(() => { isClient.value = true })
</script>
```

## 与 Vue Router 集成

### v-list-item 直接传 to

```vue
<v-list nav>
  <!-- to 自动配合 router-link、当前路由自动高亮 -->
  <v-list-item prepend-icon="mdi-home" title="首页" to="/" />
  <v-list-item prepend-icon="mdi-account" title="用户" to="/users" />
  <v-list-item prepend-icon="mdi-cog" title="设置" to="/settings" />
</v-list>
```

### v-tabs + router

```vue
<v-tabs v-model="tab">
  <v-tab value="overview" to="/dashboard/overview">概览</v-tab>
  <v-tab value="analytics" to="/dashboard/analytics">分析</v-tab>
  <v-tab value="settings" to="/dashboard/settings">设置</v-tab>
</v-tabs>

<router-view />
```

### v-breadcrumbs（面包屑）

```vue
<v-breadcrumbs :items="breadcrumbs">
  <template #title="{ item }">
    <span class="text-primary">{{ item.title }}</span>
  </template>
</v-breadcrumbs>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const breadcrumbs = computed(() => {
  return route.matched.map(r => ({
    title: r.meta.title as string ?? r.name,
    to: r.path,
    disabled: r.path === route.path,
  }))
})
</script>
```

### 页面切换动画

```vue
<v-main>
  <router-view v-slot="{ Component }">
    <v-fade-transition hide-on-leave>
      <component :is="Component" />
    </v-fade-transition>
  </router-view>
</v-main>
```

### v-snackbar 在路由守卫中

Vuetify 没有命令式 `$snackbar.show()` API——必须用 Pinia store 协调：

```ts
// stores/snackbar.ts
export const useSnackbarStore = defineStore('snackbar', () => {
  const show = ref(false)
  const text = ref('')
  const color = ref('success')

  const showSnackbar = (msg: string, c: string = 'success') => {
    text.value = msg
    color.value = c
    show.value = true
  }

  return { show, text, color, showSnackbar }
})
```

```ts
// router.ts
router.beforeEach((to) => {
  if (to.meta.requiresAuth && !isAuthenticated()) {
    const snackbar = useSnackbarStore()
    snackbar.showSnackbar('请先登录', 'warning')
    return '/login'
  }
})
```

```vue
<!-- App.vue -->
<v-app>
  <!-- ... -->
  <v-snackbar v-model="snackbar.show" :color="snackbar.color">
    {{ snackbar.text }}
  </v-snackbar>
</v-app>

<script setup>
const snackbar = useSnackbarStore()
</script>
```

## 常见踩坑

### 1. 忘记包裹 v-app → Layout 错乱

**现象**：v-app-bar / v-navigation-drawer 位置不对、main 区域大小错误。

**原因**：没有 `<v-app>` 根组件——Layout 系统依赖 v-app 提供的 layout context。

```vue
<!-- ❌ 错 -->
<template>
  <v-app-bar>...</v-app-bar>
  <v-main>...</v-main>
</template>

<!-- ✅ 对 -->
<template>
  <v-app>
    <v-app-bar>...</v-app-bar>
    <v-main>...</v-main>
  </v-app>
</template>
```

### 2. 没用 vite-plugin-vuetify → 模板组件未识别

**现象**：模板写 `<v-btn>` 报错 "Failed to resolve component"。

**原因**：没装 `vite-plugin-vuetify` 也没在 `createVuetify({ components })` 全量注册。

**解决**：装 `vite-plugin-vuetify` 默认 `autoImport: true`、或在 `createVuetify` 中传 `components`。

### 3. SCSS 主题不生效

**原因 1**：没在 `vite-plugin-vuetify` 配 `styles.configFile`。

```ts
// ❌
vuetify({ autoImport: true })

// ✅
vuetify({
  autoImport: true,
  styles: { configFile: 'src/styles/settings.scss' },
})
```

**原因 2**：`settings.scss` 用 `@use` 顺序错——必须是 `@use 'vuetify/settings' with (...)`、不能在 import 之后改。

### 4. SSR Hydration mismatch（v-dialog / v-menu / v-tooltip）

**原因**：内置 Teleport 的组件 SSR 时 ID 与 CSR 不一致。

**解决方式 1**：用 `@vuetify/nuxt-module`（最简单）。

**解决方式 2**：`<ClientOnly>` 包裹（Nuxt）：

```vue
<ClientOnly>
  <v-tooltip text="提示">
    <template #activator="{ props }">
      <v-btn v-bind="props">按钮</v-btn>
    </template>
  </v-tooltip>
</ClientOnly>
```

**解决方式 3**：手动 SSR 时 `createVuetify({ ssr: true })`。

### 5. v-data-table 客户端模式数据量大卡顿

**现象**：>1000 行时滚动卡顿、初次渲染慢。

**解决**：

- 切换 `<v-data-table-server>`：服务端分页 + 排序
- 或 `<v-data-table-virtual>`：客户端虚拟化
- 不要在 column 中放重组件（v-img / v-rating）

### 6. v-form rules 触发时机不对

**现象**：用户首次输入就显示红圈错误、UX 差。

**原因**：默认 `validate-on="input"`——每次输入都校验。

**解决**：改用 `'submit lazy'` 或 `'invalid-input'`：

```vue
<v-form validate-on="submit lazy" @submit.prevent="submit">
  <!-- 用户提交前不会显示错误 -->
</v-form>
```

### 7. 没有命令式 API（$message / $confirm）

**现象**：Element Plus 用户习惯 `ElMessage.success('保存成功')`、Vuetify 没有。

**原因**：Vuetify 设计哲学是「**组件式优先**」——所有反馈通过 `<v-snackbar>` / `<v-dialog>` 组件声明。

**解决方案**：

- **方式 1**：用 Pinia store 协调 snackbar（见上文 [v-snackbar 在路由守卫中](#v-snackbar-在路由守卫中)）
- **方式 2**：自封装 composable

```ts
// composables/useSnackbar.ts
import { ref } from 'vue'

const show = ref(false)
const text = ref('')
const color = ref<'success' | 'error' | 'warning' | 'info'>('success')

export function useSnackbar() {
  const success = (msg: string) => {
    text.value = msg
    color.value = 'success'
    show.value = true
  }
  const error = (msg: string) => {
    text.value = msg
    color.value = 'error'
    show.value = true
  }
  return { show, text, color, success, error }
}
```

```vue
<!-- App.vue -->
<script setup>
const { show, text, color } = useSnackbar()
</script>

<template>
  <v-app>
    <!-- ... -->
    <v-snackbar v-model="show" :color="color">{{ text }}</v-snackbar>
  </v-app>
</template>
```

```vue
<!-- 其他组件 -->
<script setup>
const { success } = useSnackbar()

const save = async () => {
  await api.save()
  success('保存成功')
}
</script>
```

### 8. v-icon 不显示

**原因 1**：没引入 MDI 字体。

```ts
// main.ts
import '@mdi/font/css/materialdesignicons.css'  // 必须！
```

**原因 2**：图标名写错——MDI 图标必须 `mdi-` 前缀。

```vue
<!-- ❌ -->
<v-icon icon="home" />

<!-- ✅ -->
<v-icon icon="mdi-home" />
```

### 9. v-data-table headers 配置不显示数据

**现象**：表格表头显示了、但单元格全是空。

**原因**：headers 的 `key` 与 items 字段名不一致。

```ts
// items 是 { name, email, age }
const headers = [
  { title: '名字', key: 'fullName' },  // ❌ items 没有 fullName 字段
  { title: '邮箱', key: 'email' },     // ✅
]

// 解决方案 1：改 key
const headers = [
  { title: '名字', key: 'name' },
]

// 解决方案 2：用 value 函数
const headers = [
  { title: '名字', key: 'name', value: (item) => item.firstName + ' ' + item.lastName },
]
```

### 10. v-select / v-autocomplete 对象数组显示 [object Object]

**原因**：没传 `item-title` / `item-value`——Vuetify 默认尝试 `item.title` / `item.value` 字段。

```vue
<!-- ❌ items 是 [{ id, name, email }]，没设置 item-title -->
<v-select v-model="userId" :items="users" />

<!-- ✅ -->
<v-select
  v-model="userId"
  :items="users"
  item-title="name"
  item-value="id"
/>
```

### 11. v-dialog 内的 v-form 提交后没关闭

**原因**：v-dialog 内的 form 提交不会自动关闭 dialog。

```vue
<v-dialog v-model="dialog">
  <v-form @submit.prevent="submit">
    <!-- ... -->
    <v-btn type="submit">提交</v-btn>
  </v-form>
</v-dialog>

<script setup>
const submit = async () => {
  await api.save()
  dialog.value = false  // 手动关闭
}
</script>
```

### 12. 大量自定义 SCSS 变量导致 bundle 增大

**原因**：`vite-plugin-vuetify` 编译时为每个组件生成 CSS、SCSS 变量改动导致每个组件 CSS 都重新编译。

**解决**：

- 优先用 `createVuetify({ theme })` 改颜色（运行时 CSS 变量、不增加 bundle）
- SCSS 变量仅用于必须的全局设计令牌（圆角 / 字体 / 间距）

### 13. v-text-field 与 vee-validate 集成时双向绑定不工作

**原因**：v-text-field 的 v-model 与 vee-validate 的 useField 都试图管理状态。

**解决**：让 vee-validate 完全管理状态：

```vue
<v-text-field
  v-model="email"               // 绑定到 vee-validate 的 value ref
  :error-messages="emailError"  // 错误用 errorMessage
  label="邮箱"
/>

<script setup>
import { useField } from 'vee-validate'

const { value: email, errorMessage: emailError } = useField<string>('email')
</script>
```

## 与 Pinia 协同

```ts
// stores/user.ts
import { defineStore } from 'pinia'
import { useSnackbar } from '@/composables/useSnackbar'

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const loading = ref(false)

  const login = async (credentials: Credentials) => {
    const { success: showSuccess, error: showError } = useSnackbar()

    loading.value = true
    try {
      user.value = await api.login(credentials)
      showSuccess('登录成功')
    } catch (err) {
      showError('登录失败')
      throw err
    } finally {
      loading.value = false
    }
  }

  return { user, loading, login }
})
```

> Vuetify 没有命令式 API，所有反馈都通过 composable 桥接到 `<v-snackbar>` 组件。

## Icon Sets 图标集自定义

### 默认 MDI Font

```ts
import '@mdi/font/css/materialdesignicons.css'
```

```vue
<v-icon icon="mdi-home" />
```

### MDI SVG（按需）

```bash
pnpm add @mdi/js
```

```ts
// main.ts
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'
import { mdiHome, mdiAccount } from '@mdi/js'

const vuetify = createVuetify({
  icons: {
    defaultSet: 'mdi',
    aliases: { ...aliases, home: mdiHome, account: mdiAccount },
    sets: { mdi },
  },
})
```

```vue
<!-- 用别名 -->
<v-icon icon="$home" />

<!-- 或直接传 path -->
<v-icon :icon="mdiHome" />
```

### Font Awesome

```bash
pnpm add @fortawesome/fontawesome-svg-core @fortawesome/free-solid-svg-icons @fortawesome/vue-fontawesome
```

```ts
import { aliases, fa } from 'vuetify/iconsets/fa-svg'

const vuetify = createVuetify({
  icons: {
    defaultSet: 'fa',
    aliases,
    sets: { fa },
  },
})
```

### 多图标集混用

```ts
import { aliases as mdiAliases, mdi } from 'vuetify/iconsets/mdi'
import { fa } from 'vuetify/iconsets/fa-svg'

const vuetify = createVuetify({
  icons: {
    defaultSet: 'mdi',
    aliases: mdiAliases,
    sets: { mdi, fa },
  },
})
```

```vue
<v-icon icon="mdi-home" />     <!-- MDI -->
<v-icon icon="fa:fas fa-user" /> <!-- FA -->
```

## 下一步

- [参考](./reference.md)：**API 速查** / 100+ 组件列表 / 常用 props 表 / `createVuetify` 完整选项 / Theme API 类型 / Composables / Display Breakpoints / Date Adapter
