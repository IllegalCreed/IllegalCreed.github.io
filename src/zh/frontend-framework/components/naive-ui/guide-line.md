---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 Naive UI 2.x（v2.44+）。包含 90+ 组件分类速览、NForm / NDataTable 深度、反馈四件套（useMessage / useDialog / useNotification / useLoadingBar）、容器组件、主题深度（GlobalThemeOverrides 完整）、createDiscreteApi 脱离 Provider、国际化、SSR / Nuxt 完整方案、常见踩坑。

## 速查

- **组件按类别**：Common（10）+ Layout（5）+ Navigation（8）+ Feedback（12）+ Data Display（25）+ Data Entry（25）+ Universal Display（5）= **90+ 组件**
- **NForm 核心**：`<n-form :model="form" :rules="rules" ref="formRef">` + `<n-form-item path="email">` + `formRef.value?.validate((errors) => ...)`
- **NDataTable 核心**：`<n-data-table :columns="columns" :data="data" :pagination="pagination">` —— **columns 是 JS 对象数组，不是 `<n-data-table-column>` 模板**
- **反馈四件套**：`useMessage()`（顶部条）/ `useDialog()`（中央对话框，Promise 风格） / `useNotification()`（角落通知卡片） / `useLoadingBar()`（顶部进度条，类似 NProgress）
- **`<n-modal>`**：`v-model:show="visible"` + `preset="card"` / `dialog` / `confirm`
- **`<n-drawer>`**：`v-model:show` + `placement="right"` / `left` / `top` / `bottom`
- **暗色**：`import { darkTheme } from 'naive-ui'` + `:theme="darkTheme"`
- **主题对象**：`<n-config-provider :theme-overrides="{ common: { primaryColor: '#1890ff' } }">`
- **i18n**：`<n-config-provider :locale="zhCN" :date-locale="dateZhCN">` 包裹
- **SSR**：Nuxt 用 `nuxtjs-naive-ui` 模块 / Vite SSR 用 `@css-render/vue3-ssr` 收集 CSS
- **必须**：`<n-config-provider>` 包根，否则主题 / locale 全部不生效

## 90+ 组件分类速览

Naive UI 把所有组件分为 **7 大类**——熟悉分类有助于快速找到合适的组件：

### Common（通用，10）

通用基础组件——按钮、图标、文字、滚动等：

| 组件 | 标签 | 用途 |
|---|---|---|
| Button | NButton | 按钮（type / size / ghost / dashed / round） |
| ButtonGroup | NButtonGroup | 按钮组 |
| Icon | NIcon | 图标包裹器（配合 xicons 系列） |
| IconWrapper | NIconWrapper | 图标背景包装（带圆形背景） |
| Typography | NText / NP / NH1-6 / NA / NBlockquote / NCode | 排版（多组件） |
| Divider | NDivider | 分割线（horizontal / vertical / title-placement） |
| Tag | NTag | 标签（type / size / closable / round / bordered） |
| Avatar | NAvatar | 头像（size / round / color / src） |
| AvatarGroup | NAvatarGroup | 头像组 |
| Gradient Text | NGradientText | 渐变文字 |

### Layout（布局，5）

页面布局容器：

| 组件 | 标签 | 用途 |
|---|---|---|
| Grid | NGrid / NGridItem / NGi | 24 栅格（响应式 + 收集模式） |
| Layout | NLayout / NLayoutHeader / NLayoutContent / NLayoutSider / NLayoutFooter | 后台典型布局 |
| Space | NSpace | 间距控制（替代 margin） |
| Flex | NFlex | Flex 布局（v2.36+） |
| Element | NEl | 通用元素（带主题感知） |

### Navigation（导航，8）

页面导航组件：

| 组件 | 标签 | 用途 |
|---|---|---|
| Menu | NMenu | 导航菜单（横向 / 纵向 / 折叠） |
| Breadcrumb | NBreadcrumb / NBreadcrumbItem | 面包屑 |
| Tabs | NTabs / NTabPane / NTab | 标签页（line / card / bar / segment） |
| Dropdown | NDropdown | 下拉菜单 |
| Pagination | NPagination | 分页器 |
| Steps | NSteps / NStep | 步骤条 |
| Anchor | NAnchor / NAnchorLink | 锚点 |
| Back Top | NBackTop | 回到顶部 |

### Feedback（反馈，12）

用户反馈组件——弹窗 / 提示 / 加载：

| 组件 | 标签 / API | 用途 |
|---|---|---|
| Alert | NAlert | 警告提示条 |
| Modal | NModal | 模态对话框（preset: card / dialog / confirm） |
| Drawer | NDrawer | 抽屉 |
| Dialog | useDialog() | 命令式对话框（Composable） |
| Message | useMessage() | 顶部消息条（Composable） |
| Notification | useNotification() | 角落通知卡片（Composable） |
| Loading Bar | useLoadingBar() | 顶部加载进度条（类似 NProgress） |
| Spin | NSpin | 加载中包裹器 |
| Progress | NProgress | 进度条 |
| Result | NResult | 结果页（404 / 500 / success / error） |
| Skeleton | NSkeleton | 骨架屏 |
| Empty | NEmpty | 空状态 |

### Data Display（数据展示，25）

只读 / 展示型组件：

| 组件 | 标签 | 用途 |
|---|---|---|
| Data Table | NDataTable | 表格（含虚拟滚动 + 树形 + CSV 导出 + 列拖拽） |
| Table | NTable | 简单表格（HTML table 包装） |
| Tree | NTree | 树（虚拟滚动 / 拖拽 / 异步加载） |
| Tree Select | NTreeSelect | 树形下拉 |
| Cascader | NCascader | 级联选择 |
| List | NList / NListItem | 列表 |
| Virtual List | NVirtualList | 虚拟列表 |
| Card | NCard | 卡片 |
| Carousel | NCarousel | 走马灯 |
| Collapse | NCollapse / NCollapseItem | 折叠面板 |
| Calendar | NCalendar | 日历 |
| Code | NCode | 代码块（配合 highlight.js） |
| Description | NDescriptions / NDescriptionsItem | 描述列表 |
| Equation | NEquation | 公式（KaTeX） |
| Ellipsis | NEllipsis | 文本省略 |
| Image | NImage / NImageGroup | 图片（懒加载 + 预览） |
| Marquee | NMarquee | 跑马灯 |
| Number Animation | NNumberAnimation | 数字滚动动画 |
| Performant Ellipsis | NPerformantEllipsis | 高性能省略（大列表场景） |
| QR Code | NQrCode | 二维码 |
| Scrollbar | NScrollbar | 自定义滚动条 |
| Statistic | NStatistic | 统计数值 |
| Thing | NThing | 通用元素（图标 + 文字组合） |
| Time | NTime | 时间格式化（相对 / 绝对） |
| Timeline | NTimeline / NTimelineItem | 时间线 |
| Tooltip | NTooltip | 文字提示 |
| Popover | NPopover | 弹出气泡 |
| Popconfirm | NPopconfirm | 气泡确认框 |
| Popselect | NPopselect | 弹出选择 |
| Tour | NTour | 引导（v2.39+） |
| Watermark | NWatermark | 水印 |

### Data Entry（数据输入，25）

表单输入控件——所有输入类组件都在这里：

| 组件 | 标签 | 用途 |
|---|---|---|
| Form | NForm / NFormItem / NFormItemGi / NFormItemRow | 表单 + 校验 |
| Input | NInput / NInputGroup | 输入框（text / textarea / password） |
| InputNumber | NInputNumber | 数字输入框（+/- 步进） |
| Auto Complete | NAutoComplete | 自动补全 |
| Mention | NMention | @ 提及（v2.30+） |
| Select | NSelect | 下拉选择（含虚拟列表，无 v2 之分） |
| Checkbox | NCheckbox / NCheckboxGroup | 复选框 |
| Radio | NRadio / NRadioGroup / NRadioButton | 单选 |
| Switch | NSwitch | 开关 |
| Slider | NSlider | 滑块 |
| Rate | NRate | 评分 |
| Date Picker | NDatePicker | 日期选择（date / datetime / daterange / month / year / quarter） |
| Time Picker | NTimePicker | 时间选择 |
| Color Picker | NColorPicker | 颜色选择 |
| Dynamic Input | NDynamicInput | 动态输入（数组型） |
| Dynamic Tags | NDynamicTags | 动态标签 |
| Upload | NUpload / NUploadDragger / NUploadFileList / NUploadTrigger | 文件上传 |
| Transfer | NTransfer | 穿梭框 |
| Tree Transfer | NTreeTransfer | 树形穿梭框（v2.36+） |
| Input OTP | NInputOtp | 验证码（v2.39+） |

### Universal Display（通用展示 + Config，5）

| 组件 | 标签 | 用途 |
|---|---|---|
| Config Provider | NConfigProvider | **必须**：全局配置（locale / theme / themeOverrides） |
| Message Provider | NMessageProvider | 提供 useMessage 上下文 |
| Dialog Provider | NDialogProvider | 提供 useDialog 上下文 |
| Notification Provider | NNotificationProvider | 提供 useNotification 上下文 |
| Loading Bar Provider | NLoadingBarProvider | 提供 useLoadingBar 上下文 |

## NForm 表单深度

NForm 是 Naive UI 最复杂、最高频使用的组件——配合 [async-validator](https://github.com/yiminghe/async-validator) 实现强大的表单校验：

### 基础用法

```vue
<template>
  <n-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-placement="left"
    label-width="100"
  >
    <n-form-item label="姓名" path="name">
      <n-input v-model:value="form.name" />
    </n-form-item>

    <n-form-item label="邮箱" path="email">
      <n-input v-model:value="form.email" />
    </n-form-item>

    <n-form-item>
      <n-space>
        <n-button type="primary" @click="submit">提交</n-button>
        <n-button @click="reset">重置</n-button>
      </n-space>
    </n-form-item>
  </n-form>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import type { FormInst, FormRules } from 'naive-ui'

const formRef = ref<FormInst | null>(null)

const form = reactive({
  name: '',
  email: '',
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: ['blur', 'input'] },
  ],
}

const submit = (e: MouseEvent) => {
  e.preventDefault()
  formRef.value?.validate((errors) => {
    if (!errors) {
      console.log('提交：', form)
    } else {
      console.log('校验失败：', errors)
    }
  })
}

const reset = () => {
  formRef.value?.restoreValidation()
  // 注意 NForm 没有 resetFields——需要手动清空 model
  form.name = ''
  form.email = ''
}
</script>
```

> **三个关键关联**：
>
> 1. `:model="form"` → 表单数据对象
> 2. `:rules="rules"` → 校验规则对象
> 3. `<n-form-item path="name">` → **Naive UI 用 `path`（不是 `prop`！）**——与 model 的 key 一致

### 关键差异：Naive UI vs Element Plus

| 特性 | Naive UI | Element Plus |
|---|---|---|
| 字段路径属性 | **`path`** | `prop` |
| 数据双向绑定 | **`v-model:value`** | `v-model` |
| Form 实例类型 | `FormInst` | `FormInstance` |
| 重置方法 | `restoreValidation()`（只清状态、不重值） | `resetFields()`（清状态 + 重值） |
| 校验签名 | `validate(callback)` | `validate()` Promise / callback 都支持 |

> **最常见踩坑**：把 `path` 写成 `prop`、把 `v-model:value` 写成 `v-model`——**校验完全失效**。

### 校验规则（async-validator）

Naive UI 基于 [async-validator](https://github.com/yiminghe/async-validator)（与 Element Plus 同库）：

```ts
{
  required: true,                    // 必填
  type: 'email',                     // string / number / boolean / url / email / date / regexp / array / object
  pattern: /^\d{11}$/,               // 正则
  min: 6,                            // 字符串最小长度 / 数字最小值
  max: 20,                           // 字符串最大长度 / 数字最大值
  len: 11,                           // 精确长度
  enum: ['admin', 'user'],           // 枚举
  whitespace: true,                  // 不允许只有空白字符
  message: '错误提示',                // 错误消息
  trigger: 'blur',                   // 'blur' / 'input' / 'change' / 数组
  validator: (rule, value) => {
    if (value === 'foo') {
      return new Error('不能为 foo')
    }
    return true
  },
}
```

> **触发时机注意**：Element Plus 用 `'change'`，Naive UI 用 **`'input'`**（与原生 input 事件一致）。

### 自定义校验器

```ts
const rules: FormRules = {
  password: [
    { required: true, message: '请输入密码', trigger: ['blur', 'input'] },
    { min: 6, message: '至少 6 位', trigger: 'blur' },
  ],
  confirmPassword: [
    {
      required: true,
      validator: (rule, value) => {
        if (!value) {
          return new Error('请再次输入密码')
        }
        if (value !== form.password) {
          return new Error('两次密码不一致')
        }
        return true
      },
      trigger: ['blur', 'input'],
    },
  ],
}
```

> **return 风格**（推荐）：直接 `return new Error(...)` 表示校验失败 / `return true` 表示通过——比 callback 风格简洁，与 Vue 3 风格一致。

### 异步校验器

```ts
const rules: FormRules = {
  username: [
    {
      validator: async (rule, value) => {
        const exists = await checkUsernameExists(value)
        if (exists) {
          return new Error('用户名已存在')
        }
        return true
      },
      trigger: 'blur',
    },
  ],
}
```

### 嵌套对象校验（path 用点路径）

```vue
<n-form :model="form" :rules="rules">
  <n-form-item label="街道" path="address.street">
    <n-input v-model:value="form.address.street" />
  </n-form-item>

  <n-form-item label="城市" path="address.city">
    <n-input v-model:value="form.address.city" />
  </n-form-item>
</n-form>
```

```ts
const form = reactive({
  address: { street: '', city: '' },
})

const rules: FormRules = {
  'address.street': [{ required: true, message: '请输入街道', trigger: 'blur' }],
  'address.city': [{ required: true, message: '请输入城市', trigger: 'blur' }],
}
```

> **注意**：嵌套 `path` 用 **字符串路径** `'address.street'`（同 Element Plus）。

### 动态表单（数组）

```vue
<n-form :model="form" ref="formRef">
  <n-form-item
    v-for="(item, index) in form.items"
    :key="item.key"
    :label="`项目 ${index + 1}`"
    :path="`items.${index}.value`"
    :rule="{ required: true, message: '不能为空', trigger: 'blur' }"
  >
    <n-space>
      <n-input v-model:value="item.value" />
      <n-button @click="removeItem(index)">删除</n-button>
    </n-space>
  </n-form-item>

  <n-button @click="addItem">新增</n-button>
</n-form>

<script setup>
const form = reactive({
  items: [{ key: Date.now(), value: '' }],
})

const addItem = () => {
  form.items.push({ key: Date.now(), value: '' })
}

const removeItem = (index) => {
  form.items.splice(index, 1)
}
</script>
```

> **关键**：`:path="\`items.${index}.value\`"` —— 动态路径表达数组项的字段。

### Form 实例方法（formRef）

| 方法 | 签名 | 说明 |
|---|---|---|
| `validate` | `(callback?, shouldRuleBeApplied?)` → Promise | 校验整个表单 |
| `restoreValidation` | `()` | **只清除校验状态**（不重置值） |

> **NForm 没有 `resetFields()`**：与 Element Plus 不同，**Naive UI 要重置必须手动清空 model 对象**。

```ts
// Promise 风格（推荐）
try {
  await formRef.value?.validate()
  console.log('校验通过')
} catch (errors) {
  console.log('校验失败：', errors)
}

// callback 风格
formRef.value?.validate((errors) => {
  if (!errors) {
    console.log('校验通过')
  } else {
    console.log('校验失败：', errors)
  }
})
```

### 单 FormItem 校验

```ts
// 校验单个 FormItem（需要 FormItem 上有 ref）
formItemRef.value?.validate({ trigger: 'blur' })
```

或在 Input 的事件中触发：

```vue
<n-form-item path="user" label="用户名">
  <n-input
    v-model:value="form.user"
    @input="formRef?.validate(undefined, (rule) => rule.key === 'user')"
  />
</n-form-item>
```

### inline 行内表单（搜索栏常用）

```vue
<n-form :model="searchForm" inline label-placement="left">
  <n-form-item label="关键字" path="keyword">
    <n-input v-model:value="searchForm.keyword" />
  </n-form-item>
  <n-form-item label="状态" path="status">
    <n-select v-model:value="searchForm.status" :options="statusOptions" />
  </n-form-item>
  <n-form-item>
    <n-space>
      <n-button type="primary" @click="search">搜索</n-button>
      <n-button @click="reset">重置</n-button>
    </n-space>
  </n-form-item>
</n-form>
```

## NDataTable 表格深度

NDataTable 是 Naive UI 最重要的数据展示组件——内置虚拟滚动、树形数据、列拖拽、CSV 导出。**与 ElTable 最大的区别：列定义只能用 JS 对象数组（columns prop），不用 template 写法**。

### 基础用法

```vue
<template>
  <n-data-table
    :columns="columns"
    :data="data"
    :pagination="pagination"
    :bordered="true"
  />
</template>

<script setup lang="ts">
import { ref, h } from 'vue'
import { NTag, NButton, type DataTableColumns } from 'naive-ui'

interface RowData {
  id: number
  name: string
  age: number
  status: 'active' | 'inactive'
}

const columns: DataTableColumns<RowData> = [
  { type: 'selection' },                                 // 多选列
  { title: '姓名', key: 'name' },
  { title: '年龄', key: 'age', sorter: 'default' },     // 内置排序
  {
    title: '状态',
    key: 'status',
    render(row) {
      // render 函数返回 VNode
      return h(NTag, { type: row.status === 'active' ? 'success' : 'default' }, () =>
        row.status === 'active' ? '启用' : '禁用'
      )
    },
  },
  {
    title: '操作',
    key: 'actions',
    render(row) {
      return h(
        NButton,
        { size: 'small', onClick: () => edit(row) },
        () => '编辑'
      )
    },
  },
]

const data = ref<RowData[]>([
  { id: 1, name: '张三', age: 25, status: 'active' },
  { id: 2, name: '李四', age: 30, status: 'inactive' },
])

const pagination = { pageSize: 10 }

const edit = (row: RowData) => {
  console.log('编辑：', row)
}
</script>
```

> **核心理念**：columns 是 **JS 对象数组**——每列的 render 函数用 `h()` 渲染 VNode（不是模板）。**好处是 TS 类型推导完整、列定义可以动态生成；坏处是模板使用者要学 h() 语法**。

### 列定义结构（DataTableColumn）

```ts
interface DataTableColumn<T = any> {
  type?: 'selection' | 'expand'                          // 多选列 / 展开行
  key: string                                            // 字段名（必需）
  title?: string | (() => VNodeChild)                    // 列标题
  width?: number | string                                // 列宽
  minWidth?: number
  maxWidth?: number
  align?: 'left' | 'center' | 'right'                    // 对齐
  fixed?: 'left' | 'right'                               // 固定列
  ellipsis?: boolean | { tooltip: boolean }              // 溢出省略
  sorter?: boolean | 'default' | ((a, b) => number)      // 排序
  defaultSortOrder?: 'ascend' | 'descend' | false
  filter?: (value, row) => boolean                       // 筛选函数
  filterOptions?: { label: string, value: any }[]        // 筛选选项
  defaultFilterOptionValues?: any[]
  render?: (row: T, index: number) => VNodeChild         // 自定义渲染
  renderExpand?: (row: T, index: number) => VNodeChild   // 展开行内容
  className?: string
}
```

### 自定义列渲染（render + h）

如果**不喜欢 `h()` 语法**，可以用 [JSX](https://cn.vuejs.org/guide/extras/render-function.html) 或单独抽组件：

```ts
// 方式 1：h() 函数
{
  key: 'status',
  render(row) {
    return h(NTag, { type: 'success' }, () => row.status)
  },
}

// 方式 2：抽出 Vue 组件
import StatusCell from './StatusCell.vue'

{
  key: 'status',
  render(row) {
    return h(StatusCell, { status: row.status })
  },
}

// 方式 3：JSX（需要 @vitejs/plugin-vue-jsx）
{
  key: 'status',
  render(row) {
    return <NTag type="success">{row.status}</NTag>
  },
}
```

> **推荐方式 2**：复杂列抽组件，render 只做组件转发——代码可读、TS 类型友好。

### 排序

`sorter: 'default'` 启用默认排序（前端比较）；`sorter: (a, b) => ...` 自定义排序；`sorter: true` 触发事件（后端排序）：

```ts
const columns: DataTableColumns<RowData> = [
  // 默认排序（按字段值比较）
  { title: '年龄', key: 'age', sorter: 'default' },

  // 自定义排序
  {
    title: '创建时间',
    key: 'createdAt',
    sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  },

  // 后端排序（监听 update:sorter 事件）
  { title: '热度', key: 'hot', sorter: true },
]
```

监听排序变化：

```vue
<n-data-table
  :columns="columns"
  :data="data"
  @update:sorter="handleSorterChange"
/>

<script setup>
const handleSorterChange = (sorter: DataTableSortState | null) => {
  if (sorter) {
    console.log(`排序：${sorter.columnKey} ${sorter.order}`)
    // 重新请求后端...
  }
}
</script>
```

### 筛选

```ts
const columns: DataTableColumns<RowData> = [
  {
    title: '状态',
    key: 'status',
    filterOptions: [
      { label: '启用', value: 'active' },
      { label: '禁用', value: 'inactive' },
    ],
    filter: 'default',                                // 默认筛选（按值匹配）
    // 或自定义：
    // filter: (value, row) => row.status === value,
  },
]
```

### 多选

```vue
<template>
  <n-data-table
    :columns="columns"
    :data="data"
    :row-key="(row) => row.id"
    @update:checked-row-keys="handleCheck"
  />
</template>

<script setup>
const columns: DataTableColumns<RowData> = [
  { type: 'selection' },           // 自动添加复选框列
  { title: '姓名', key: 'name' },
]

const handleCheck = (rowKeys: (string | number)[]) => {
  console.log('已选中：', rowKeys)
}
</script>
```

> **`row-key` 必填**——告诉 DataTable 用什么字段作为唯一标识。

### 树形数据

```ts
const data = ref([
  {
    id: 1,
    name: 'src/',
    children: [
      { id: 2, name: 'main.ts' },
      { id: 3, name: 'App.vue' },
    ],
  },
])
```

```vue
<n-data-table
  :columns="columns"
  :data="data"
  :row-key="(row) => row.id"
  :default-expand-all="true"
/>
```

> **默认 `children-key="children"`**——通过 `children-key` 改字段名。

### 虚拟滚动（大数据量）

数据量超 **1000 行**时启用 `:virtual-scroll="true"` 即可——**与普通 DataTable 同 API、零迁移成本**（不像 ElTable 要换 ElTableV2）：

```vue
<n-data-table
  :columns="columns"
  :data="bigData"
  :pagination="pagination"
  :virtual-scroll="true"
  :max-height="500"
/>

<script setup>
// 10000 行
const bigData = Array.from({ length: 10000 }, (_, i) => ({
  id: i,
  name: `用户 ${i}`,
  age: 20 + (i % 30),
}))
</script>
```

> **`virtual-scroll-x`**（v2.40+）：横向虚拟滚动，列数很多时也不卡。

### 固定列

```ts
const columns: DataTableColumns<RowData> = [
  { type: 'selection', fixed: 'left' },               // 固定左
  { title: '姓名', key: 'name', fixed: 'left' },

  // 大量中间列
  { title: '字段 A', key: 'a' },
  { title: '字段 B', key: 'b' },
  // ... 20 列

  { title: '操作', key: 'actions', fixed: 'right', render: ... },
]
```

> **配合 `scroll-x`**：固定列必须设 `<n-data-table :scroll-x="1500">` —— 否则不生效。

### 分页

```vue
<n-data-table
  :columns="columns"
  :data="data"
  :pagination="pagination"
  remote
  @update:page="handlePageChange"
  @update:page-size="handlePageSizeChange"
/>

<script setup>
import { ref, reactive } from 'vue'

const pagination = reactive({
  page: 1,
  pageSize: 10,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  itemCount: 100,                           // 总数（来自后端）
  prefix({ itemCount }) {
    return `共 ${itemCount} 条`
  },
})

const handlePageChange = (page: number) => {
  pagination.page = page
  fetchData()
}

const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize
  pagination.page = 1
  fetchData()
}
</script>
```

> **`remote` 属性**：告诉 DataTable 不要前端分页（数据来自后端）。

### CSV 导出（v2.40+）

```vue
<template>
  <n-button @click="exportCsv">导出 CSV</n-button>
  <n-data-table ref="tableRef" :columns="columns" :data="data" />
</template>

<script setup>
import { ref } from 'vue'
import type { DataTableInst } from 'naive-ui'

const tableRef = ref<DataTableInst | null>(null)

const exportCsv = () => {
  tableRef.value?.downloadCsv({
    fileName: 'users',
    keepOriginalData: true,
  })
}
</script>
```

## 反馈四件套

Naive UI 的反馈 API 是 **Composable**（vs Element Plus 的全局静态方法）—— 必须在 setup 内调用 + 必须包对应 Provider。

### useMessage（顶部消息条）

```vue
<!-- App.vue：必须包 Provider -->
<template>
  <n-config-provider>
    <n-message-provider>
      <router-view />
    </n-message-provider>
  </n-config-provider>
</template>
```

```vue
<!-- 子组件中使用 -->
<script setup lang="ts">
import { useMessage } from 'naive-ui'

const message = useMessage()

const showMessage = () => {
  // 快捷方法
  message.success('保存成功')
  message.warning('请检查输入')
  message.error('保存失败')
  message.info('提示信息')
  message.loading('加载中...')

  // 完整选项
  message.success('保存成功', {
    duration: 3000,
    closable: true,
    keepAliveOnHover: true,
    onAfterLeave: () => console.log('消息消失了'),
  })

  // 持久化（不自动消失）
  const m = message.loading('上传中...', { duration: 0 })
  setTimeout(() => {
    m.destroy()       // 手动关闭
    message.success('上传完成')
  }, 3000)
}
</script>
```

> **不包 Provider**：报错 `useMessage must be called inside a setup of a child of n-message-provider`。

### useDialog（中央对话框，Promise / Callback 风格）

```vue
<!-- App.vue -->
<template>
  <n-config-provider>
    <n-dialog-provider>
      <router-view />
    </n-dialog-provider>
  </n-config-provider>
</template>
```

```vue
<script setup lang="ts">
import { useDialog } from 'naive-ui'

const dialog = useDialog()

const showWarning = () => {
  dialog.warning({
    title: '提示',
    content: '确定要删除？',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: () => {
      // 用户点了确定
      console.log('已删除')
    },
    onNegativeClick: () => {
      // 用户点了取消
      console.log('已取消')
    },
  })

  // 其他类型
  dialog.success({ /* ... */ })
  dialog.error({ /* ... */ })
  dialog.info({ /* ... */ })

  // 创建（最底层 API）
  dialog.create({
    title: '自定义',
    content: '...',
    showIcon: false,
  })
}
</script>
```

> **Naive UI 的 Dialog 是 callback 风格**——`onPositiveClick` / `onNegativeClick`，**不是 Promise**（vs Element Plus `ElMessageBox.confirm` 的 Promise + try-catch）。
>
> 如果想用 Promise 风格，**自己包一层**：

```ts
const dialogConfirm = (options: DialogOptions): Promise<boolean> => {
  return new Promise((resolve) => {
    dialog.warning({
      ...options,
      onPositiveClick: () => resolve(true),
      onNegativeClick: () => resolve(false),
      onClose: () => resolve(false),
    })
  })
}

// 使用
const confirmed = await dialogConfirm({
  title: '提示',
  content: '确定删除？',
})
if (confirmed) {
  await deleteApi()
}
```

### useNotification（角落通知卡片）

```vue
<!-- App.vue -->
<template>
  <n-config-provider>
    <n-notification-provider>
      <router-view />
    </n-notification-provider>
  </n-config-provider>
</template>
```

```vue
<script setup lang="ts">
import { useNotification } from 'naive-ui'

const notification = useNotification()

const showNotification = () => {
  notification.success({
    title: '操作成功',
    content: '数据已保存',
    duration: 4500,
    keepAliveOnHover: true,
  })

  notification.error({
    title: '错误',
    content: '操作失败',
    meta: '2 分钟前',                // 副文字
    avatar: () => h(NIcon, ...),     // 自定义 avatar
  })
}
</script>
```

### useLoadingBar（顶部加载进度条，类似 NProgress）

```vue
<!-- App.vue -->
<template>
  <n-config-provider>
    <n-loading-bar-provider>
      <router-view />
    </n-loading-bar-provider>
  </n-config-provider>
</template>
```

```vue
<script setup lang="ts">
import { useLoadingBar } from 'naive-ui'

const loadingBar = useLoadingBar()

const fetchData = async () => {
  loadingBar.start()                         // 启动（顶部出现进度条）
  try {
    await fetch('/api/data')
    loadingBar.finish()                      // 完成（进度条 100% 后消失）
  } catch (err) {
    loadingBar.error()                       // 错误（红色进度条）
    throw err
  }
}
</script>
```

> **配合 Vue Router 自动启停**——典型用法：

```ts
import { useLoadingBar } from 'naive-ui'

// 全局守卫（必须在组件 setup 内拿到 loadingBar）
const setupLoadingBar = () => {
  const loadingBar = useLoadingBar()

  router.beforeEach(() => {
    loadingBar.start()
  })

  router.afterEach(() => {
    loadingBar.finish()
  })

  router.onError(() => {
    loadingBar.error()
  })
}

// 在 App.vue setup 内调用
onMounted(setupLoadingBar)
```

> **`useLoadingBar` 在 setup 外（如路由守卫外）调用会报错**——见下文 `createDiscreteApi` 解决方案。

### ElMessage vs Naive UI Message 选择对比

| 场景 | Element Plus | Naive UI |
|---|---|---|
| 简短反馈 | `ElMessage.success('...')` | `message.success('...')` |
| 确认对话框 | `await ElMessageBox.confirm(...)` | `dialog.warning({ onPositiveClick })` |
| 角落通知 | `ElNotification(...)` | `notification.success(...)` |
| 加载进度 | 无内置（用第三方 NProgress） | **`loadingBar.start()`** |
| 调用风格 | 全局静态方法 | **Composable**（setup 内） |
| Provider 要求 | 无 | **必须包对应 Provider** |

## createDiscreteApi（脱离 Provider）

**问题**：`useMessage` 等 Composable 必须在 setup 内调用——**Vue Router 守卫、Pinia store、axios 拦截器、原生 JS 工具函数**中怎么用？

**解决**：`createDiscreteApi` 创建脱离 Provider 的全局 API：

```ts
// src/utils/naive-discrete.ts
import { createDiscreteApi, darkTheme, type ConfigProviderProps } from 'naive-ui'
import { computed, ref } from 'vue'

const themeRef = ref<'light' | 'dark'>('light')

const configProviderPropsRef = computed<ConfigProviderProps>(() => ({
  theme: themeRef.value === 'light' ? null : darkTheme,
}))

const { message, dialog, notification, loadingBar } = createDiscreteApi(
  ['message', 'dialog', 'notification', 'loadingBar'],
  {
    configProviderProps: configProviderPropsRef,
  }
)

export { message, dialog, notification, loadingBar }
```

**用法**：在任何地方（包括 setup 外）：

```ts
// router/index.ts
import { loadingBar } from '@/utils/naive-discrete'

router.beforeEach(() => {
  loadingBar.start()
})

router.afterEach(() => {
  loadingBar.finish()
})
```

```ts
// axios 拦截器
import axios from 'axios'
import { message } from '@/utils/naive-discrete'

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    message.error(error.message)
    return Promise.reject(error)
  }
)
```

```ts
// Pinia store
import { defineStore } from 'pinia'
import { message } from '@/utils/naive-discrete'

export const useUserStore = defineStore('user', {
  actions: {
    async login(credentials) {
      try {
        // ...
        message.success('登录成功')
      } catch (err) {
        message.error('登录失败')
      }
    },
  },
})
```

> **注意**：`createDiscreteApi` 创建的 API **不与 Provider 共享主题**（除非传 configProviderProps）—— 但更适合工具函数 / 非组件代码。

## 容器组件

### NModal 模态对话框

NModal 支持 4 个 preset：

| preset | 用途 |
|---|---|
| `card` | 带 header / footer 的卡片对话框（最常用） |
| `dialog` | 简单对话框（类似 useDialog） |
| `confirm` | 确认对话框（已废弃，用 dialog） |
| `panel` | 自定义面板（无 preset，自己写） |

```vue
<template>
  <n-button @click="showModal = true">打开</n-button>

  <n-modal
    v-model:show="showModal"
    preset="card"
    title="标题"
    style="width: 500px;"
    :mask-closable="true"
    :close-on-esc="true"
    :on-after-leave="handleAfterLeave"
  >
    <p>对话框内容</p>

    <template #footer>
      <n-space justify="end">
        <n-button @click="showModal = false">取消</n-button>
        <n-button type="primary" @click="confirm">确定</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const showModal = ref(false)

const confirm = () => {
  // ...
  showModal.value = false
}

const handleAfterLeave = () => {
  console.log('Modal 已关闭')
}
</script>
```

**常用属性**：

| 属性 | 类型 | 说明 |
|---|---|---|
| `v-model:show` | boolean | 控制显隐（**注意：是 `:show`，不是 `:visible` / `:value`**） |
| `preset` | `'card' / 'dialog' / 'panel'` | 预设样式 |
| `title` | string | 标题 |
| `mask-closable` | boolean | 点击遮罩关闭（默认 true） |
| `close-on-esc` | boolean | ESC 关闭（默认 true） |
| `auto-focus` | boolean | 自动 focus 第一个 input |
| `display-directive` | `'if'` / `'show'` | 用 v-if 还是 v-show（默认 'if'） |
| `transform-origin` | string | CSS transform-origin |

### NDrawer 抽屉

```vue
<n-drawer
  v-model:show="showDrawer"
  :width="400"
  placement="right"
>
  <n-drawer-content title="详情" closable>
    <p>抽屉内容</p>
  </n-drawer-content>
</n-drawer>
```

**placement 取值**：

| 值 | 方向 |
|---|---|
| `right` | 右抽屉（默认） |
| `left` | 左抽屉 |
| `top` | 上抽屉 |
| `bottom` | 下抽屉 |

> **必须包 `<n-drawer-content>`**——否则 header / closable / footer 不会生效。

## 主题深度自定义

Naive UI 主题系统的精髓在于 **TS 对象** —— 主题就是 `GlobalThemeOverrides` 对象、运行时切换、无需 CSS 编译。

### 完整 themeOverrides 结构

```ts
import type { GlobalThemeOverrides } from 'naive-ui'

const themeOverrides: GlobalThemeOverrides = {
  // 通用 token（影响全局）
  common: {
    primaryColor: '#1890ff',
    primaryColorHover: '#40a9ff',
    primaryColorPressed: '#096dd9',
    primaryColorSuppl: '#1890ff',

    successColor: '#52c41a',
    warningColor: '#faad14',
    errorColor: '#f5222d',
    infoColor: '#1890ff',

    // 文字色
    textColorBase: '#000',
    textColor1: 'rgba(0, 0, 0, 0.9)',     // 一级文字
    textColor2: 'rgba(0, 0, 0, 0.82)',    // 二级文字
    textColor3: 'rgba(0, 0, 0, 0.52)',    // 三级文字
    textColorDisabled: 'rgba(0, 0, 0, 0.38)',
    placeholderColor: 'rgba(0, 0, 0, 0.38)',

    // 背景色
    bodyColor: '#fff',
    cardColor: '#fff',
    modalColor: '#fff',
    popoverColor: '#fff',
    tableColor: '#fff',

    // 边框
    borderColor: 'rgba(0, 0, 0, 0.12)',
    borderRadius: '6px',
    borderRadiusSmall: '4px',

    // 字号
    fontSize: '14px',
    fontSizeMini: '12px',
    fontSizeTiny: '12px',
    fontSizeSmall: '14px',
    fontSizeMedium: '14px',
    fontSizeLarge: '15px',
    fontSizeHuge: '16px',

    // 行高
    lineHeight: '1.6',

    // 高度
    heightTiny: '22px',
    heightSmall: '28px',
    heightMedium: '34px',
    heightLarge: '40px',
    heightHuge: '46px',
  },

  // 组件级 token
  Button: {
    textColor: '#000',
    color: '#fff',
    border: '1px solid #d9d9d9',
    fontWeight: '500',
    borderRadiusMedium: '6px',
  },
  Input: {
    border: '1px solid #d9d9d9',
    borderHover: '#1890ff',
    borderFocus: '#1890ff',
    boxShadowFocus: '0 0 0 2px rgba(24, 144, 255, 0.2)',
  },
  Select: {
    peers: {
      InternalSelection: {
        borderHover: '#1890ff',
      },
      InternalSelectMenu: {
        borderRadius: '6px',
      },
    },
  },
  DataTable: {
    borderRadius: '6px',
    thColor: '#fafafa',
    thTextColor: 'rgba(0, 0, 0, 0.88)',
  },
}
```

### 动态切换主题（多主题切换器）

```vue
<template>
  <n-config-provider :theme-overrides="currentTheme">
    <n-select v-model:value="themeName" :options="themeOptions" />
    <router-view />
  </n-config-provider>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { GlobalThemeOverrides } from 'naive-ui'

const themeName = ref<'blue' | 'green' | 'red'>('blue')

const themeOptions = [
  { label: '蓝色', value: 'blue' },
  { label: '绿色', value: 'green' },
  { label: '红色', value: 'red' },
]

const themes: Record<string, GlobalThemeOverrides> = {
  blue: { common: { primaryColor: '#1890ff' } },
  green: { common: { primaryColor: '#52c41a' } },
  red: { common: { primaryColor: '#f5222d' } },
}

const currentTheme = computed(() => themes[themeName.value])
</script>
```

> **运行时零 CSS 重排**——切换主题瞬间生效，**比 Element Plus CSS Variables 批量切换更快**。

### 暗色模式深度定制

`darkTheme` 是 Naive UI 的默认暗色对象——可以再叠加 `themeOverrides`：

```vue
<template>
  <n-config-provider :theme="darkTheme" :theme-overrides="darkOverrides">
    <router-view />
  </n-config-provider>
</template>

<script setup lang="ts">
import { darkTheme } from 'naive-ui'

const darkOverrides = {
  common: {
    bodyColor: '#0a0a0a',
    cardColor: '#1a1a1a',
    primaryColor: '#4096ff',
  },
}
</script>
```

### 嵌套 NConfigProvider

不同区域用不同主题——嵌套 NConfigProvider：

```vue
<n-config-provider :theme="null">                  <!-- 外层亮色 -->
  <my-app />

  <n-config-provider :theme="darkTheme">           <!-- 内层暗色 -->
    <my-dark-section />
  </n-config-provider>
</n-config-provider>
```

## 国际化（i18n）

### 同步切换 locale + dateLocale

```vue
<template>
  <n-config-provider :locale="currentLocale" :date-locale="currentDateLocale">
    <router-view />
  </n-config-provider>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { zhCN, dateZhCN, enUS, dateEnUS, jaJP, dateJaJP } from 'naive-ui'

const lang = ref<'zh' | 'en' | 'ja'>('zh')

const localeMap = { zh: zhCN, en: enUS, ja: jaJP }
const dateLocaleMap = { zh: dateZhCN, en: dateEnUS, ja: dateJaJP }

const currentLocale = computed(() => localeMap[lang.value])
const currentDateLocale = computed(() => dateLocaleMap[lang.value])
</script>
```

### 与 vue-i18n 集成

```ts
// main.ts
import { createI18n } from 'vue-i18n'

const i18n = createI18n({
  locale: 'zh-cn',
  messages: {
    'zh-cn': { hello: '你好' },
    'en': { hello: 'Hello' },
  },
})

app.use(i18n)
```

App.vue 同步：

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { zhCN, dateZhCN, enUS, dateEnUS } from 'naive-ui'

const { locale } = useI18n()

const elLocale = computed(() => (locale.value === 'zh-cn' ? zhCN : enUS))
const elDateLocale = computed(() => (locale.value === 'zh-cn' ? dateZhCN : dateEnUS))
</script>

<template>
  <n-config-provider :locale="elLocale" :date-locale="elDateLocale">
    <router-view />
  </n-config-provider>
</template>
```

## SSR / Nuxt 完整方案

### Nuxt（推荐：用 nuxtjs-naive-ui 模块）

```bash
npx nuxi module add nuxtjs-naive-ui
# 或 pnpm dlx nuxi module add nuxtjs-naive-ui
```

`nuxt.config.ts`：

```ts
export default defineNuxtConfig({
  modules: ['nuxtjs-naive-ui'],
})
```

**模块自动处理**：

- 按需引入组件 / Composable
- 自动收集 critical CSS 注入到 HTML head（解决 hydration mismatch）
- 自动处理 Teleport 的 SSR

> **`nuxtjs-naive-ui` 是社区维护的非官方模块**，但被 Naive UI 官方文档推荐——这是 Naive UI SSR 的事实标准。

### Vite SSR / SSG 手动配置

```ts
// vite.config.ts
import { setup } from '@css-render/vue3-ssr'

export default defineConfig({
  ssr: {
    noExternal: ['naive-ui', 'vueuc', 'date-fns'],
  },
  ssgOptions: {
    async onBeforePageRender(_, __, appCtx) {
      const { collect } = setup(appCtx.app)
      ;(appCtx as any).__collectStyle = collect
      return undefined
    },
    async onPageRendered(_, renderedHTML, appCtx) {
      return renderedHTML.replace(
        /<!-- -->/,                             // Placeholder
        `${(appCtx as any).__collectStyle()}</head>`
      )
    },
  },
})
```

> **核心问题**：Naive UI 主题用 CSS-in-JS（css-render）——SSR 时需要收集渲染过程中产生的 CSS、注入到 HTML head，**否则首屏样式闪烁**。
>
> `@css-render/vue3-ssr` 提供 `setup(app)` 收集 CSS 的 API、然后用 `collect()` 拿到 CSS 字符串注入到 HTML。

### SSR hydration mismatch

如果某些组件 SSR 时显示异常（首屏 → 客户端切换闪烁），可以用 `<ClientOnly>` 包裹：

```vue
<template>
  <ClientOnly>
    <n-tooltip>
      <template #trigger>
        <n-button>悬浮</n-button>
      </template>
      提示
    </n-tooltip>
  </ClientOnly>
</template>
```

> 但 Naive UI 官方处理 SSR 比 Element Plus 好——**一般不需要 ClientOnly**，hydration 问题主要由 `@css-render/vue3-ssr` 解决。

## 与 Vue Router + Pinia 集成

### 菜单 + 路由

NMenu 用 `options` JS 数组（不是 `<n-menu-item>` 模板）—— 用 `h()` 渲染 RouterLink：

```vue
<template>
  <n-layout has-sider>
    <n-layout-sider width="200" bordered>
      <n-menu
        :options="menuOptions"
        :value="activeMenu"
        :collapsed="collapsed"
        :collapsed-width="64"
        :collapsed-icon-size="22"
      />
    </n-layout-sider>

    <n-layout-content>
      <router-view />
    </n-layout-content>
  </n-layout>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { NIcon, type MenuOption } from 'naive-ui'
import { HomeOutline, PersonOutline, SettingsOutline } from '@vicons/ionicons5'

const route = useRoute()
const collapsed = ref(false)

const activeMenu = computed(() => route.name as string)

// 工具函数：图标 render
const renderIcon = (icon: Component) => () => h(NIcon, null, () => h(icon))

const menuOptions: MenuOption[] = [
  {
    label: () => h(RouterLink, { to: { name: 'dashboard' } }, () => '仪表盘'),
    key: 'dashboard',
    icon: renderIcon(HomeOutline),
  },
  {
    label: '系统管理',
    key: 'system',
    icon: renderIcon(SettingsOutline),
    children: [
      {
        label: () => h(RouterLink, { to: { name: 'users' } }, () => '用户'),
        key: 'users',
        icon: renderIcon(PersonOutline),
      },
      {
        label: () => h(RouterLink, { to: { name: 'roles' } }, () => '角色'),
        key: 'roles',
      },
    ],
  },
]
</script>
```

### 面包屑

```vue
<n-breadcrumb separator="/">
  <n-breadcrumb-item v-for="match in $route.matched" :key="match.path">
    <RouterLink :to="match.path">{{ match.meta.title }}</RouterLink>
  </n-breadcrumb-item>
</n-breadcrumb>
```

### LoadingBar 路由集成

```vue
<!-- App.vue -->
<template>
  <n-config-provider>
    <n-loading-bar-provider>
      <main-app />
    </n-loading-bar-provider>
  </n-config-provider>
</template>
```

```vue
<!-- MainApp.vue -->
<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLoadingBar } from 'naive-ui'

const router = useRouter()
const loadingBar = useLoadingBar()

router.beforeEach(() => {
  loadingBar.start()
})

router.afterEach(() => {
  loadingBar.finish()
})

router.onError(() => {
  loadingBar.error()
})
</script>
```

## 与 Pinia 协同

Pinia store 中如何用 Message？—— 用 `createDiscreteApi`：

```ts
// src/utils/naive-discrete.ts
import { createDiscreteApi } from 'naive-ui'

const { message, dialog, notification } = createDiscreteApi(
  ['message', 'dialog', 'notification'],
)

export { message, dialog, notification }
```

```ts
// stores/user.ts
import { defineStore } from 'pinia'
import { message } from '@/utils/naive-discrete'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    loading: false,
  }),

  actions: {
    async login(credentials) {
      this.loading = true
      try {
        this.user = await api.login(credentials)
        message.success('登录成功')
      } catch (err) {
        message.error('登录失败')
        throw err
      } finally {
        this.loading = false
      }
    },
  },
})
```

## 常见踩坑

### 1. `useMessage must be called inside a setup of a child of n-message-provider`

**原因**：调用 `useMessage()` 时没有上层 `<n-message-provider>` 包裹。

**解决**：在 App.vue 包 Provider：

```vue
<template>
  <n-config-provider>
    <n-message-provider>           <!-- 必须 -->
      <n-dialog-provider>
        <n-notification-provider>
          <n-loading-bar-provider>
            <router-view />
          </n-loading-bar-provider>
        </n-notification-provider>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>
```

### 2. 主题 / locale 不生效

**原因**：组件不是 `<n-config-provider>` 的子孙。

```vue
<!-- 错误：Provider 在 router-view 外，但组件渲染到 modal 外的 body -->
<n-config-provider :theme="darkTheme">
  <router-view />
</n-config-provider>

<!-- 某个组件用 Teleport 渲染到 body 外，主题失效 -->
```

**解决**：用 `:provider="..."` 或确保所有组件都在 Provider 内。Naive UI 内部 Teleport 已自动包 Provider 上下文——但**自定义 Teleport 需要注意**。

### 3. `useMessage` 在路由守卫 / Pinia store / 工具函数中报错

**原因**：Composable 必须在 setup 内。

**解决**：用 `createDiscreteApi`（见上文）。

### 4. NForm 的 `path` 写成 `prop`、`v-model:value` 写成 `v-model`

```vue
<!-- 错误：从 Element Plus 习惯过来 -->
<n-form-item label="姓名" prop="name">
  <n-input v-model="form.name" />
</n-form-item>

<!-- 正确 -->
<n-form-item label="姓名" path="name">
  <n-input v-model:value="form.name" />
</n-form-item>
```

> **校验完全失效**——这是 Element Plus 用户切换到 Naive UI 最高频的踩坑。

### 5. NForm 没有 `resetFields()`

**原因**：Naive UI 设计上认为「重置」是 model 责任、不是 Form 责任。

**解决**：手动清空 model：

```ts
const initialForm = { name: '', email: '' }

const form = reactive({ ...initialForm })

const reset = () => {
  Object.assign(form, initialForm)             // 重置数据
  formRef.value?.restoreValidation()           // 清除校验状态
}
```

### 6. DataTable 列定义不能用模板

**原因**：Naive UI 设计上 columns 是 JS 对象数组（不像 ElTable 的 `<el-table-column>` 模板）。

**解决**：用 render 函数 + h() 或 JSX：

```ts
const columns: DataTableColumns<RowData> = [
  {
    key: 'name',
    title: '姓名',
    render(row) {
      return h('strong', null, row.name)
    },
  },
]
```

> **复杂列抽组件**：见上文 DataTable 章节。

### 7. SSR 首屏样式闪烁

**原因**：CSS-in-JS 在 SSR 时需要收集 critical CSS 注入到 HTML head、否则首屏无样式。

**解决**：

- Nuxt：用 `nuxtjs-naive-ui` 模块（自动处理）
- Vite SSR：用 `@css-render/vue3-ssr` 收集（见上文）

### 8. Modal 的 `v-model` 用错属性

```vue
<!-- 错误：以为是 v-model -->
<n-modal v-model="show">

<!-- 错误：以为是 :visible -->
<n-modal :visible="show">

<!-- 正确：是 v-model:show -->
<n-modal v-model:show="show">
```

### 9. NMenu 用 `<n-menu-item>` 模板写法

**原因**：Naive UI 设计上 NMenu 用 `options` 数组。

```vue
<!-- 错误（不工作） -->
<n-menu>
  <n-menu-item>首页</n-menu-item>
</n-menu>

<!-- 正确 -->
<n-menu :options="menuOptions" />
```

### 10. 图标必须包 `<n-icon>`

```vue
<!-- 错误：直接放图标组件 -->
<NButton>
  <CloudUploadOutline />
  上传
</NButton>

<!-- 正确：用 <n-icon> 包裹 -->
<NButton>
  <template #icon>
    <n-icon><CloudUploadOutline /></n-icon>
  </template>
  上传
</NButton>
```

> **`<n-icon>` 负责 size / color 控制**——直接放图标组件没法设大小。

## 下一步

- [参考](./reference.md)：**API 速查** / 90+ 组件列表 / 常用 props 表 / Composable 签名 / TypeScript 类型 / 主题对象结构 / 30+ 语言包 / xicons 图标包对照
