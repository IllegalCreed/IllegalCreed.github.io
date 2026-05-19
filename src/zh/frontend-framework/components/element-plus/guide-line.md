---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 Element Plus 2.x。包含 80+ 组件分类速览、ElForm / ElTable 深度、反馈三件套、容器组件、主题与暗色完整方案、按需引入、国际化、SSR、常见踩坑。

## 速查

- **组件按类别**：Basic（12）+ Configuration（1）+ Form（25）+ Data（23）+ Navigation（9）+ Feedback（10）+ Others（2）= **82+ 组件**
- **ElForm 核心**：`<el-form :model="form" :rules="rules" ref="formRef">` + `<el-form-item prop="email">` + `formRef.value.validate(callback)` / `formRef.value.validate()` Promise
- **ElTable 核心**：`<el-table :data="rows">` + `<el-table-column prop="name" label="..." sortable>` + `<template #default="{ row }">` 自定义渲染
- **反馈三件套**：`ElMessage`（顶部通知条）/ `ElMessageBox`（中央对话框 Promise 风格）/ `ElNotification`（角落通知卡片）
- **ElDialog**：`v-model="visible"` + `width="500px"` + `<template #footer>` + `:before-close` 拦截
- **ElDrawer**：`v-model` + `direction="rtl"` 右抽屉（默认）/ `ltr` / `ttb` / `btt`
- **`v-loading`**：`<el-table v-loading="loading">` + 全屏 `v-loading.fullscreen.lock`
- **`ElLoading.service`**：命令式全屏 loading，`loading.close()` 关闭
- **`ElIcon`**：`<el-icon :size="20" color="red"><Edit /></el-icon>` 包裹 `@element-plus/icons-vue` 图标
- **暗色**：`import 'element-plus/theme-chalk/dark/css-vars.css'` + `<html class="dark">` 或 VueUse `useDark`
- **主题 SCSS**：`@forward 'element-plus/theme-chalk/src/common/var.scss' with ($colors: ...)`
- **主题 CSS**：`:root { --el-color-primary: green }` 运行时
- **命名空间**：`<el-config-provider namespace="ep">` 让所有类名变成 `ep-button` 避免冲突
- **i18n**：`<el-config-provider :locale="zhCn">` 包裹 + `import 'dayjs/locale/zh-cn'`
- **SSR**：`app.provide(ID_INJECTION_KEY, ...)` + `app.provide(ZINDEX_INJECTION_KEY, ...)`
- **Nuxt**：用 `@element-plus/nuxt` 模块，**不要手动 `app.use`**

## 80+ 组件分类速览

Element Plus 把所有组件分为 **7 大类**——熟悉分类有助于快速找到合适的组件：

### Basic（基础，12 个）

通用基础组件——按钮、布局、图标、文字、滚动等：

| 组件 | 标签 | 用途 |
|---|---|---|
| Button | `<el-button>` | 按钮（type / plain / link / icon） |
| ButtonGroup | `<el-button-group>` | 按钮组 |
| Border | （CSS） | 边框风格指南 |
| Color | （CSS） | 调色板 |
| Container | `<el-container>` / `<el-aside>` / `<el-header>` / `<el-main>` / `<el-footer>` | 布局容器（典型后台布局） |
| Layout | `<el-row>` / `<el-col>` | 24 栅格布局 |
| Icon | `<el-icon>` | 图标包裹器（配合 `@element-plus/icons-vue`） |
| Link | `<el-link>` | 链接（type / underline） |
| Text | `<el-text>` | 文字（size / type / truncated 截断） |
| Scrollbar | `<el-scrollbar>` | 自定义滚动条（隐藏原生 + 美化） |
| Space | `<el-space>` | 间距控制（替代 margin） |
| Splitter | `<el-splitter>` | 分割面板（拖拽改变大小，v2.10+） |

### Configuration（配置，1 个）

全局配置中心：

| 组件 | 标签 | 用途 |
|---|---|---|
| Config Provider | `<el-config-provider>` | 全局 locale / size / namespace / 各组件 defaults |

### Form（表单，25 个）

表单输入控件——所有输入类组件都在这里：

| 组件 | 标签 | 用途 |
|---|---|---|
| Autocomplete | `<el-autocomplete>` | 自动补全输入框 |
| Cascader | `<el-cascader>` | 级联选择器（树形选择） |
| Checkbox | `<el-checkbox>` / `<el-checkbox-group>` | 复选框 |
| Color Picker | `<el-color-picker>` | 颜色选择器 |
| Date Picker | `<el-date-picker>` | 日期选择（date / range / week / month / year） |
| DateTime Picker | `<el-date-picker type="datetime">` | 日期时间选择 |
| Form | `<el-form>` / `<el-form-item>` | 表单 + 校验 |
| Input | `<el-input>` | 输入框（text / textarea / password） |
| Input Number | `<el-input-number>` | 数字输入框（+/- 步进） |
| Input Tag | `<el-input-tag>` | 标签输入框（v2.7+） |
| Input OTP | `<el-input-otp>` | 验证码输入（v2.7+） |
| Mention | `<el-mention>` | @ 提及输入（v2.7+） |
| Radio | `<el-radio>` / `<el-radio-group>` | 单选框 |
| Rate | `<el-rate>` | 评分 |
| Select | `<el-select>` / `<el-option>` | 下拉选择 |
| Select V2 | `<el-select-v2>` | 虚拟化下拉（大数据量） |
| Slider | `<el-slider>` | 滑块 |
| Switch | `<el-switch>` | 开关 |
| Time Picker | `<el-time-picker>` | 时间选择 |
| Time Select | `<el-time-select>` | 时间下拉选择 |
| Transfer | `<el-transfer>` | 穿梭框 |
| TreeSelect | `<el-tree-select>` | 树形下拉选择 |
| Upload | `<el-upload>` | 文件上传 |

### Data（数据展示，23 个）

只读 / 展示型组件：

| 组件 | 标签 | 用途 |
|---|---|---|
| Avatar | `<el-avatar>` | 头像 |
| Badge | `<el-badge>` | 徽标（红点 / 数字） |
| Calendar | `<el-calendar>` | 日历 |
| Card | `<el-card>` | 卡片 |
| Carousel | `<el-carousel>` | 走马灯 |
| Collapse | `<el-collapse>` / `<el-collapse-item>` | 折叠面板 |
| Descriptions | `<el-descriptions>` / `<el-descriptions-item>` | 描述列表 |
| Empty | `<el-empty>` | 空状态 |
| Image | `<el-image>` | 图片（懒加载 + 预览） |
| Infinite Scroll | `v-infinite-scroll` | 无限滚动 |
| Pagination | `<el-pagination>` | 分页 |
| Progress | `<el-progress>` | 进度条 |
| Result | `<el-result>` | 结果页（404 / 500 / success） |
| Skeleton | `<el-skeleton>` | 骨架屏 |
| Table | `<el-table>` / `<el-table-column>` | 表格 |
| Table V2 | `<el-table-v2>` | 虚拟化表格 |
| Tag | `<el-tag>` | 标签 |
| Timeline | `<el-timeline>` / `<el-timeline-item>` | 时间线 |
| Tour | `<el-tour>` | 引导（v2.5+） |
| Tree | `<el-tree>` | 树 |
| Tree V2 | `<el-tree-v2>` | 虚拟化树 |
| Statistic | `<el-statistic>` | 统计数值（v2.5+） |
| Segmented | `<el-segmented>` | 分段选择器（v2.6+） |

### Navigation（导航，9 个）

页面导航组件——后台菜单 / 面包屑等：

| 组件 | 标签 | 用途 |
|---|---|---|
| Affix | `<el-affix>` | 固钉（吸顶吸底） |
| Anchor | `<el-anchor>` | 锚点（v2.6+） |
| Backtop | `<el-backtop>` | 回到顶部 |
| Breadcrumb | `<el-breadcrumb>` / `<el-breadcrumb-item>` | 面包屑 |
| Dropdown | `<el-dropdown>` | 下拉菜单 |
| Menu | `<el-menu>` / `<el-menu-item>` / `<el-sub-menu>` | 导航菜单（横向 / 纵向） |
| Page Header | `<el-page-header>` | 页头 |
| Steps | `<el-steps>` / `<el-step>` | 步骤条 |
| Tabs | `<el-tabs>` / `<el-tab-pane>` | 标签页 |

### Feedback（反馈，10 个）

用户反馈组件——弹窗 / 提示 / 加载：

| 组件 | 标签 / API | 用途 |
|---|---|---|
| Alert | `<el-alert>` | 警告提示条 |
| Dialog | `<el-dialog>` | 对话框 |
| Drawer | `<el-drawer>` | 抽屉 |
| Loading | `v-loading` / `ElLoading.service` | 加载遮罩（指令 + 命令式） |
| Message | `ElMessage.success(...)` | 消息提示（顶部条） |
| Message Box | `ElMessageBox.confirm(...)` | 模态对话框（命令式 Promise） |
| Notification | `ElNotification(...)` | 通知（角落卡片） |
| Popconfirm | `<el-popconfirm>` | 气泡确认框 |
| Popover | `<el-popover>` | 弹出气泡 |
| Tooltip | `<el-tooltip>` | 文字提示 |

### Others（其他，2 个）

| 组件 | 标签 | 用途 |
|---|---|---|
| Divider | `<el-divider>` | 分割线 |
| Watermark | `<el-watermark>` | 水印（v2.5+） |

## ElForm 表单深度

ElForm 是 Element Plus 最复杂、最高频使用的组件——配合 [async-validator](https://github.com/yiminghe/async-validator) 实现强大的表单校验：

### 基础用法

```vue
<template>
  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-width="100px"
    label-position="right"
  >
    <el-form-item label="姓名" prop="name">
      <el-input v-model="form.name" />
    </el-form-item>

    <el-form-item label="邮箱" prop="email">
      <el-input v-model="form.email" />
    </el-form-item>

    <el-form-item>
      <el-button type="primary" @click="submit">提交</el-button>
      <el-button @click="reset">重置</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'

const formRef = ref<FormInstance>()

const form = reactive({
  name: '',
  email: '',
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' },
  ],
}

const submit = async () => {
  if (!formRef.value) return
  // Promise 风格：valid 为 true，失败 throw error
  try {
    await formRef.value.validate()
    console.log('提交：', form)
  } catch (errors) {
    console.error('校验失败：', errors)
  }
}

const reset = () => {
  formRef.value?.resetFields()
}
</script>
```

> **三个关键关联**：
>
> 1. `:model="form"` → 表单数据对象
> 2. `:rules="rules"` → 校验规则对象
> 3. `<el-form-item prop="name">` → **`prop` 必须与 `model` 的 key 一致**——否则校验失效

### 校验规则（async-validator）

完整规则字段：

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
  trigger: 'blur',                   // 'blur' / 'change' / ['blur', 'change']
  validator: (rule, value, callback) => {
    if (value === 'foo') callback(new Error('不能为 foo'))
    else callback()
  },
}
```

### 自定义校验器

```ts
const rules: FormRules = {
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '至少 6 位', trigger: 'blur' },
  ],
  confirmPassword: [
    {
      required: true,
      validator: (rule, value, callback) => {
        if (!value) {
          callback(new Error('请再次输入密码'))
        } else if (value !== form.password) {
          callback(new Error('两次密码不一致'))
        } else {
          callback() // 必须调用 callback（即使无错误）
        }
      },
      trigger: 'blur',
    },
  ],
}
```

> **callback 风格**：必须最后调用 `callback()`——**忘记调用会让表单 hang**。

### 异步校验器

```ts
const rules: FormRules = {
  username: [
    {
      validator: async (rule, value) => {
        const exists = await checkUsernameExists(value)
        if (exists) throw new Error('用户名已存在')
      },
      trigger: 'blur',
    },
  ],
}
```

> **Promise 风格**（推荐）：直接 `throw new Error(...)` 表示校验失败——比 callback 风格简洁。

### 嵌套对象校验

`prop` 用 `.` 路径表达嵌套：

```vue
<el-form :model="form">
  <el-form-item label="街道" prop="address.street">
    <el-input v-model="form.address.street" />
  </el-form-item>

  <el-form-item label="城市" prop="address.city">
    <el-input v-model="form.address.city" />
  </el-form-item>
</el-form>
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

> **注意**：嵌套 `prop` 用 **字符串路径** `'address.street'`（不是数组）。

### 动态表单（数组）

```vue
<el-form :model="form" ref="formRef">
  <el-form-item
    v-for="(item, index) in form.items"
    :key="item.key"
    :label="`项目 ${index + 1}`"
    :prop="`items.${index}.value`"
    :rules="{ required: true, message: '不能为空', trigger: 'blur' }"
  >
    <el-input v-model="item.value" />
    <el-button @click="removeItem(index)">删除</el-button>
  </el-form-item>

  <el-button @click="addItem">新增</el-button>
</el-form>

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

> **关键**：`:prop="`items.${index}.value`"` —— 动态路径表达数组项的字段。

### Form 方法（formRef 实例）

| 方法 | 签名 | 说明 |
|---|---|---|
| `validate` | `(callback?)` → Promise | 校验整个表单 |
| `validateField` | `(props?, callback?)` → Promise | 校验指定字段 |
| `resetFields` | `(props?)` | 重置字段值 + 清除校验状态 |
| `clearValidate` | `(props?)` | 仅清除校验状态（不重置值） |
| `scrollToField` | `(prop)` | 滚动到字段（配合 `scroll-to-error`） |

```ts
// Promise 风格（推荐）
try {
  await formRef.value.validate()
  // 校验通过
} catch (errors) {
  // 校验失败，errors 是 { field: [error] } 对象
}

// callback 风格（旧）
formRef.value.validate((valid, fields) => {
  if (valid) { /* ... */ }
  else { /* fields 包含错误字段 */ }
})
```

### scroll-to-error + 长表单

长表单提交时，校验失败的字段可能在屏幕外——加 `scroll-to-error` 自动滚动到第一个错误：

```vue
<el-form :model="form" :rules="rules" scroll-to-error scroll-into-view-options>
  <!-- ... -->
</el-form>
```

`scroll-into-view-options` 是 [DOM scrollIntoView 选项](https://developer.mozilla.org/zh-CN/docs/Web/API/Element/scrollIntoView)（`{ behavior: 'smooth', block: 'center' }` 等）。

### inline 行内表单（搜索栏常用）

```vue
<el-form :model="searchForm" inline>
  <el-form-item label="关键字">
    <el-input v-model="searchForm.keyword" />
  </el-form-item>
  <el-form-item label="状态">
    <el-select v-model="searchForm.status">
      <el-option label="启用" value="1" />
      <el-option label="禁用" value="0" />
    </el-select>
  </el-form-item>
  <el-form-item>
    <el-button type="primary" @click="search">搜索</el-button>
    <el-button @click="reset">重置</el-button>
  </el-form-item>
</el-form>
```

> 后台**搜索 + 表格**场景：行内表单是国内中后台的标准模式。

## ElTable 表格深度

ElTable 是 Element Plus 最重要的数据展示组件——支持排序、筛选、多选、固定列、合并单元格、树形数据：

### 基础用法

```vue
<el-table :data="tableData" stripe border>
  <el-table-column type="index" label="序号" width="60" />
  <el-table-column prop="name" label="姓名" />
  <el-table-column prop="age" label="年龄" width="100" />
  <el-table-column prop="email" label="邮箱" />
</el-table>
```

### type 特殊列

| type | 用途 |
|---|---|
| `selection` | 多选复选框列（自动加复选框 + 全选） |
| `index` | 行号列（自动生成 1、2、3） |
| `expand` | 展开行（点击展开二级内容） |

```vue
<el-table :data="tableData" @selection-change="onSelectionChange">
  <el-table-column type="selection" width="55" />
  <el-table-column type="index" width="50" />
  <el-table-column prop="name" label="姓名" />
</el-table>
```

### 自定义列内容（slot）

每个列的内容用 `<template #default="{ row, $index }">`：

```vue
<el-table-column label="操作" width="200">
  <template #default="{ row, $index }">
    <el-button size="small" @click="edit(row)">编辑</el-button>
    <el-button size="small" type="danger" @click="remove(row, $index)">
      删除
    </el-button>
  </template>
</el-table-column>
```

### 排序

`sortable` 启用排序，`sortable="custom"` 启用自定义排序（不在前端排，触发 `sort-change` 事件由后端排）：

```vue
<el-table :data="tableData" @sort-change="onSortChange">
  <!-- 前端排序 -->
  <el-table-column prop="age" label="年龄" sortable />

  <!-- 后端排序 -->
  <el-table-column prop="created" label="创建时间" sortable="custom" />
</el-table>

<script setup>
const onSortChange = ({ prop, order }) => {
  // order: 'ascending' / 'descending' / null
  console.log(`排序：${prop} ${order}`)
  // 重新请求接口...
}
</script>
```

### 筛选

```vue
<el-table-column
  prop="status"
  label="状态"
  :filters="[
    { text: '启用', value: 1 },
    { text: '禁用', value: 0 },
  ]"
  :filter-method="filterStatus"
/>

<script setup>
const filterStatus = (value, row) => {
  return row.status === value
}
</script>
```

### 多选

```vue
<el-table :data="tableData" @selection-change="onSelectionChange" ref="tableRef">
  <el-table-column type="selection" width="55" />
  <!-- ... -->
</el-table>

<el-button @click="clearSelection">清空选择</el-button>

<script setup>
import type { TableInstance } from 'element-plus'

const tableRef = ref<TableInstance>()
const selected = ref([])

const onSelectionChange = (val) => {
  selected.value = val
}

const clearSelection = () => {
  tableRef.value?.clearSelection()
}
</script>
```

### 树形数据

`row-key` 唯一标识 + `tree-props` 配置子节点字段：

```vue
<el-table
  :data="treeData"
  row-key="id"
  :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
  default-expand-all
>
  <el-table-column prop="name" label="名称" />
  <el-table-column prop="size" label="大小" />
</el-table>

<script setup>
const treeData = ref([
  {
    id: 1,
    name: 'src/',
    children: [
      { id: 2, name: 'main.ts' },
      { id: 3, name: 'App.vue' },
    ],
  },
])
</script>
```

### 固定列

`fixed="left"` / `fixed="right"`：

```vue
<el-table :data="tableData">
  <el-table-column type="selection" width="55" fixed="left" />
  <el-table-column prop="name" label="姓名" fixed="left" />
  <el-table-column prop="age" label="年龄" />
  <!-- 大量中间列 -->
  <el-table-column label="操作" width="200" fixed="right">
    <template #default="{ row }">
      <el-button>编辑</el-button>
    </template>
  </el-table-column>
</el-table>
```

### 合并单元格（span-method）

```vue
<el-table :data="tableData" :span-method="spanMethod" border>
  <el-table-column prop="name" label="姓名" />
  <el-table-column prop="amount" label="金额" />
</el-table>

<script setup>
// 第 0、2、4 行的第 0 列向下合并 2 行
const spanMethod = ({ row, column, rowIndex, columnIndex }) => {
  if (columnIndex === 0) {
    if (rowIndex % 2 === 0) {
      return { rowspan: 2, colspan: 1 }
    } else {
      return { rowspan: 0, colspan: 0 }
    }
  }
}
</script>
```

### 表尾合计行（summary-method）

```vue
<el-table :data="tableData" show-summary :summary-method="summaryMethod">
  <el-table-column prop="name" label="姓名" />
  <el-table-column prop="amount" label="金额" />
</el-table>

<script setup>
const summaryMethod = ({ columns, data }) => {
  return columns.map((col, index) => {
    if (index === 0) return '合计'
    if (col.property === 'amount') {
      const sum = data.reduce((acc, row) => acc + (row.amount || 0), 0)
      return sum
    }
    return ''
  })
}
</script>
```

### 性能：ElTableV2 虚拟化

数据量超 **1000 行**时 ElTable 卡顿——换用 `<el-table-v2>` 虚拟化版本：

```vue
<el-table-v2
  :columns="columns"
  :data="data"
  :width="700"
  :height="400"
/>

<script setup>
const columns = [
  { key: 'name', title: '姓名', dataKey: 'name', width: 200 },
  { key: 'age', title: '年龄', dataKey: 'age', width: 100 },
]

// 10000 行数据
const data = Array.from({ length: 10000 }, (_, i) => ({
  id: i,
  name: `用户 ${i}`,
  age: 20 + (i % 30),
}))
</script>
```

> **ElTableV2 与 ElTable API 完全不同**——列定义改成 JS 对象数组、模板写法不一样。需要重写表格代码。

## 反馈三件套

`ElMessage` / `ElMessageBox` / `ElNotification` 是 **命令式 API**——不需要 `<template>` 中声明，直接在 JS 中调用：

### ElMessage（顶部通知条）

```ts
import { ElMessage } from 'element-plus'

// 类型快捷方法
ElMessage.success('保存成功')
ElMessage.warning('请检查输入')
ElMessage.error('保存失败')
ElMessage.info('提示信息')
ElMessage.primary('主要提示')

// 完整选项
ElMessage({
  message: '保存成功',
  type: 'success',
  duration: 3000,           // 显示时长（ms），0 为不自动关闭
  showClose: true,          // 显示关闭按钮
  center: false,            // 居中
  grouping: true,           // 相同消息合并（v2.5+）
  plain: true,              // 朴素背景（v2.6+）
  offset: 16,               // 距离顶部偏移
  customClass: 'my-msg',
})

// 关闭所有
ElMessage.closeAll()
```

> **按需引入时**：`unplugin-auto-import` + `ElementPlusResolver` 自动 import `ElMessage`——**模板中调用无需 import**。

### ElMessageBox（中央模态对话框）

```ts
import { ElMessageBox } from 'element-plus'

// alert（仅确认）
await ElMessageBox.alert('内容', '标题', {
  confirmButtonText: '知道了',
  type: 'warning',
})

// confirm（确认 + 取消，Promise 风格）
try {
  await ElMessageBox.confirm('确定删除？', '提示', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning',
    dangerouslyUseHTMLString: false,
  })
  // 用户点了确定
  await deleteApi()
  ElMessage.success('已删除')
} catch (action) {
  // 用户点了取消 / ESC / 点遮罩
  // action 默认 'cancel'，如果设了 distinguishCancelAndClose 可能是 'close'
  ElMessage.info('已取消')
}

// prompt（输入）
try {
  const { value } = await ElMessageBox.prompt('请输入新昵称', '修改', {
    inputPattern: /\S+/,
    inputErrorMessage: '不能为空',
  })
  console.log('用户输入：', value)
} catch {
  // 用户取消
}
```

**关键选项**：

| 选项 | 类型 | 说明 |
|---|---|---|
| `title` | string | 标题 |
| `message` | string / VNode | 内容（支持 HTML） |
| `type` | `'success'` / `'warning'` / `'info'` / `'error'` | 图标 |
| `confirmButtonText` | string | 确认按钮文字 |
| `cancelButtonText` | string | 取消按钮文字 |
| `showCancelButton` | boolean | 显示取消 |
| `beforeClose` | Function | 关闭前回调（可阻止关闭） |
| `distinguishCancelAndClose` | boolean | 区分 cancel 和 close（按钮 vs ESC） |
| `draggable` | boolean | 可拖拽（v2.5+） |
| `dangerouslyUseHTMLString` | boolean | 内容作为 HTML 渲染 |
| `center` | boolean | 内容居中 |

> **Promise 风格 + try-catch** 是 ElMessageBox 的最佳实践——比 callback 嵌套清晰。

### ElNotification（角落通知卡片）

```ts
import { ElNotification } from 'element-plus'

ElNotification.success({
  title: '操作成功',
  message: '数据已保存',
  position: 'top-right',    // top-right / top-left / bottom-right / bottom-left
  duration: 4500,
  offset: 0,                // 距离对应边的偏移
  showClose: true,
})

ElNotification.error({
  title: '错误',
  message: '操作失败',
})
```

**ElMessage vs ElNotification 选择**：

| 场景 | 用 |
|---|---|
| 简短反馈（保存成功 / 校验提示） | ElMessage（顶部条，自动消失） |
| 详细通知（系统消息 / 重要提示） | ElNotification（角落卡片，标题 + 内容） |
| 需要用户确认 | ElMessageBox（模态对话框） |

## 容器组件

### ElDialog 对话框

```vue
<template>
  <el-button @click="visible = true">打开对话框</el-button>

  <el-dialog
    v-model="visible"
    title="标题"
    width="500px"
    :before-close="handleClose"
    draggable
    align-center
  >
    <p>对话框内容</p>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="confirm">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const visible = ref(false)

const handleClose = (done: () => void) => {
  // 拦截关闭
  ElMessageBox.confirm('确定关闭？')
    .then(() => done())
    .catch(() => { /* 阻止关闭 */ })
}

const confirm = () => {
  // ...
  visible.value = false
}
</script>
```

**常用属性**：

| 属性 | 类型 | 说明 |
|---|---|---|
| `v-model` | boolean | 控制显隐 |
| `title` | string | 标题 |
| `width` | string / number | 宽度（默认 `50%`） |
| `fullscreen` | boolean | 全屏 |
| `top` | string | 距离顶部（默认 `15vh`） |
| `modal` | boolean | 显示遮罩（默认 `true`） |
| `close-on-click-modal` | boolean | 点击遮罩关闭（默认 `true`） |
| `close-on-press-escape` | boolean | ESC 关闭（默认 `true`） |
| `before-close` | Function | 关闭前回调 |
| `align-center` | boolean | 水平垂直居中（v2.2+） |
| `draggable` | boolean | 可拖拽 |
| `destroy-on-close` | boolean | 关闭时销毁内容（重置子组件 state） |
| `append-to-body` | boolean | 挂载到 body（嵌套 Dialog 必需） |

### ElDrawer 抽屉

```vue
<el-drawer
  v-model="drawerVisible"
  title="详情"
  direction="rtl"
  size="40%"
  :before-close="handleClose"
>
  <p>抽屉内容</p>
</el-drawer>
```

**direction 取值**：

| 值 | 方向 |
|---|---|
| `rtl` | 右抽屉（默认） |
| `ltr` | 左抽屉 |
| `ttb` | 上抽屉 |
| `btt` | 下抽屉 |

**size**：百分比 `'40%'` 或像素 `'400px'`。

**Drawer 适用场景**：

- 右抽屉：详情面板 / 编辑面板（不打断主流程）
- 左抽屉：侧边导航（移动端）
- 上下抽屉：消息面板 / 工具栏

## 主题定制完整方案

Element Plus 主题有 **3 层定制**：SCSS 变量（编译期）+ CSS 变量（运行时）+ 命名空间（隔离冲突）。

### SCSS 变量（编译期定制）

修改默认主题色 / 字体 / 间距 / 圆角：

`src/styles/element.scss`：

```scss
// 覆盖默认变量
@forward 'element-plus/theme-chalk/src/common/var.scss' with (
  $colors: (
    'primary': ('base': #1890ff),
    'success': ('base': #52c41a),
    'warning': ('base': #faad14),
    'danger': ('base': #f5222d),
  ),
  $border-radius: (
    'base': 8px,
    'small': 4px,
    'round': 999px,
  ),
  $font-size: (
    'base': 14px,
    'small': 12px,
  )
);
```

`vite.config.ts` 配置：

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver({ importStyle: 'sass' })], // 关键：sass
    }),
    Components({
      resolvers: [ElementPlusResolver({ importStyle: 'sass' })], // 关键：sass
    }),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/styles/element.scss" as *;`,
      },
    },
  },
})
```

> **关键**：`importStyle: 'sass'` —— 让 resolver 引入 SCSS 源码而非预编译 CSS、SCSS 变量覆盖才能生效。

### CSS 变量（运行时定制）

**Element Plus 所有 SCSS 变量都自动生成对应 CSS 变量**——可以运行时改：

```css
/* main.css */
:root {
  --el-color-primary: #1890ff;
  --el-color-success: #52c41a;
}
```

或在 JS 中动态切：

```ts
document.documentElement.style.setProperty('--el-color-primary', '#ff4d4f')
```

或组件级覆盖：

```vue
<el-tag style="--el-tag-bg-color: red">标签</el-tag>
```

### 命名空间（避免冲突）

如果项目已用其他 UI 库（如 Ant Design）、类名 `el-button` 与其他冲突——改命名空间：

```vue
<el-config-provider namespace="ep">
  <router-view />
</el-config-provider>
```

> **所有类名变成** `ep-button` / `ep-input` ——避免冲突。**但是默认 CSS 仍是 `el-` 开头**：必须**重新编译 SCSS 变量** `$namespace: 'ep'` 才能完全切换。

## 暗色模式完整方案

### 方式 1：默认暗色（最简单）

```ts
// main.ts
import 'element-plus/theme-chalk/dark/css-vars.css'
```

```html
<html class="dark">
```

### 方式 2：VueUse useDark（用户切换 + 跟随系统）

```bash
pnpm add @vueuse/core
```

```vue
<!-- DarkModeToggle.vue -->
<template>
  <el-switch
    v-model="isDark"
    inline-prompt
    :active-icon="Moon"
    :inactive-icon="Sunny"
  />
</template>

<script setup lang="ts">
import { useDark } from '@vueuse/core'
import { Moon, Sunny } from '@element-plus/icons-vue'

const isDark = useDark({
  selector: 'html',
  attribute: 'class',
  valueDark: 'dark',
  valueLight: '',
})
</script>
```

### 方式 3：自定义暗色变量

`src/styles/element-dark.scss`：

```scss
// 覆盖暗色模式变量
@forward 'element-plus/theme-chalk/src/dark/var.scss' with (
  $bg-color: (
    'page': #0a0a0a,
    '': #181818,
    'overlay': #1d1e1f,
  ),
  $text-color: (
    'primary': #f0f0f0,
    'regular': #d0d0d0,
  )
);
```

或 CSS 方式：

```css
/* main.css */
html.dark {
  --el-bg-color: #181818;
  --el-bg-color-page: #0a0a0a;
  --el-color-primary: #4096ff;
}
```

## 按需引入完整配置

### Vite 完整配置

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import IconsResolver from 'unplugin-icons/resolver'
import Icons from 'unplugin-icons/vite'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia'],     // 顺便自动 import Vue API
      resolvers: [
        ElementPlusResolver(),
        IconsResolver({ prefix: 'Icon' }),
      ],
      dts: 'src/auto-imports.d.ts',
      eslintrc: {
        enabled: true,
        filepath: './.eslintrc-auto-import.json', // 让 ESLint 知道这些全局变量
      },
    }),
    Components({
      resolvers: [
        ElementPlusResolver(),
        IconsResolver({ enabledCollections: ['carbon'] }),
      ],
      dts: 'src/components.d.ts',
    }),
    Icons({ autoInstall: true }),
  ],
})
```

### 不引入特定组件 CSS

某些场景需要排除特定组件 CSS：

```ts
ElementPlusResolver({
  exclude: /ElScrollbar/,
})
```

### Resolver 完整选项

```ts
ElementPlusResolver({
  importStyle: 'css',         // 'css' / 'sass' / false
  exclude: undefined,         // 正则排除组件
  ssr: false,                 // SSR 模式
  version: '2.0.0',           // 指定版本（影响 import 路径）
  noStylesComponents: [],     // 不引入样式的组件（如 ElIcon）
  directives: true,           // 是否解析指令（v-loading 等）
})
```

## 国际化（i18n）

### ElConfigProvider 切换语言

```vue
<template>
  <el-config-provider :locale="currentLocale">
    <router-view />
  </el-config-provider>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'

const lang = ref<'zh' | 'en'>('zh')
const currentLocale = computed(() => (lang.value === 'zh' ? zhCn : en))
</script>
```

### Day.js 本地化（DatePicker 必需）

```ts
import 'dayjs/locale/zh-cn'
import 'dayjs/locale/en'

// 动态切换：
import dayjs from 'dayjs'
dayjs.locale('zh-cn') // 切到中文
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

App.vue 中根据 vue-i18n 当前 locale 同步 Element Plus locale：

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'

const { locale } = useI18n()
const elLocale = computed(() => (locale.value === 'zh-cn' ? zhCn : en))
</script>

<template>
  <el-config-provider :locale="elLocale">
    <router-view />
  </el-config-provider>
</template>
```

## SSR 深度

### Nuxt（推荐：用 @element-plus/nuxt 模块）

```bash
pnpm add @element-plus/nuxt
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@element-plus/nuxt'],
  elementPlus: {
    importStyle: 'scss',
    themes: ['dark'],
  },
})
```

**模块自动处理**：

- 按需引入组件 / 命令式 API
- 自动加载语言包
- 自动处理 SSR 的 Teleport hydration
- 自动注入 ID / zIndex 解决 hydration mismatch

### 手动 SSR（不用 Nuxt）

```ts
import { createSSRApp } from 'vue'
import { ID_INJECTION_KEY, ZINDEX_INJECTION_KEY } from 'element-plus'

const app = createSSRApp(App)

// 关键 1：稳定 ID（避免 SSR 与 CSR ID 不一致）
app.provide(ID_INJECTION_KEY, {
  prefix: 1024,
  current: 0,
})

// 关键 2：稳定 z-index
app.provide(ZINDEX_INJECTION_KEY, { current: 0 })

app.use(ElementPlus)
```

### Teleport hydration

ElDialog / ElDrawer / ElTooltip / ElDropdown / ElSelect / ElDatePicker 内部用了 `<Teleport>`——SSR 时**首次渲染容易 hydration mismatch**：

```vue
<template>
  <ClientOnly>
    <el-tooltip content="提示">
      <el-button>悬浮</el-button>
    </el-tooltip>
  </ClientOnly>
</template>
```

Nuxt 提供 `<ClientOnly>`；手动 SSR 时用 `onMounted` flag：

```vue
<template>
  <el-tooltip v-if="isClient" content="提示">
    <el-button>悬浮</el-button>
  </el-tooltip>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const isClient = ref(false)
onMounted(() => { isClient.value = true })
</script>
```

## v-loading 指令 + ElLoading.service

### 指令用法

```vue
<el-table v-loading="loading" :data="tableData">
  <!-- ... -->
</el-table>
```

**指令修饰符**：

| 修饰符 | 说明 |
|---|---|
| `.fullscreen` | 全屏 loading |
| `.lock` | 禁用 body 滚动（仅全屏时） |
| `.body` | 挂载到 body 而非父元素 |

```vue
<div v-loading.fullscreen.lock="globalLoading">全屏加载</div>
```

**自定义文字 / 图标**：

```vue
<el-table
  v-loading="loading"
  element-loading-text="加载中..."
  element-loading-spinner="el-icon-loading"
  element-loading-background="rgba(0, 0, 0, 0.7)"
>
</el-table>
```

### 命令式 ElLoading.service

```ts
import { ElLoading } from 'element-plus'

const loading = ElLoading.service({
  lock: true,
  text: '加载中...',
  background: 'rgba(0, 0, 0, 0.7)',
  target: document.querySelector('#app') as HTMLElement, // 不传则全屏
})

// 异步操作
await fetchData()

loading.close()
```

> **全屏 ElLoading 是单例**——重复调用返回同一实例。

## ElIcon 与图标管理

### 基础用法

```vue
<template>
  <el-icon><Edit /></el-icon>
  <el-icon :size="20" color="red"><Search /></el-icon>
</template>

<script setup>
import { Edit, Search } from '@element-plus/icons-vue'
</script>
```

### 旋转动画

加 `class="is-loading"` 即可旋转：

```vue
<el-icon class="is-loading"><Loading /></el-icon>
```

### 与 Button 集成

`<el-button :icon>` 自动包裹 ElIcon：

```vue
<el-button type="primary" :icon="Edit">编辑</el-button>
<el-button :icon="Search" circle />
```

### 替代方案：unplugin-icons

`@element-plus/icons-vue` 只有 ~700 个图标——更多图标用 unplugin-icons + iconify（提供 200+ 图标集、~10 万图标）：

```bash
pnpm add -D unplugin-icons @iconify-json/carbon
```

```vue
<template>
  <el-icon><Edit /></el-icon>
  <i-carbon-edit class="text-xl" />  <!-- unplugin-icons -->
</template>

<script setup>
import { Edit } from '@element-plus/icons-vue'
</script>
```

## ElConfigProvider 全局配置

`<el-config-provider>` 是 Element Plus 的**全局配置中心**——所有可配置的 default 都集中在这里：

```vue
<el-config-provider
  :locale="zhCn"
  size="default"
  :z-index="3000"
  namespace="el"
  :button="{ autoInsertSpace: true, plain: false }"
  :message="{ max: 3, duration: 3000, plain: true }"
  :dialog="{ alignCenter: true, draggable: true }"
  :empty-values="[undefined, null, '']"
  :value-on-clear="undefined"
>
  <router-view />
</el-config-provider>
```

**完整选项**：

| 选项 | 类型 | 说明 |
|---|---|---|
| `locale` | Object | 语言包 |
| `size` | `'large'` / `'default'` / `'small'` | 全局组件尺寸 |
| `z-index` | number | overlay 基础 z-index（默认 2000） |
| `namespace` | string | CSS 类名前缀（默认 `el`） |
| `button` | Object | Button defaults |
| `link` | Object | Link defaults |
| `message` | Object | ElMessage defaults |
| `dialog` | Object | ElDialog defaults |
| `table` | Object | ElTable defaults |
| `empty-values` | Array | 视为空的值列表 |
| `value-on-clear` | any | clearable 清空后的值 |

## 与 Vue Router 集成

### 菜单 + 路由

```vue
<el-menu router :default-active="$route.path" mode="vertical">
  <el-menu-item index="/dashboard">
    <el-icon><DataBoard /></el-icon>
    <span>仪表盘</span>
  </el-menu-item>

  <el-sub-menu index="/system">
    <template #title>
      <el-icon><Setting /></el-icon>
      <span>系统管理</span>
    </template>
    <el-menu-item index="/system/users">用户</el-menu-item>
    <el-menu-item index="/system/roles">角色</el-menu-item>
  </el-sub-menu>
</el-menu>
```

> `router` 属性让 `index` 直接作为路由路径调用 `router.push(index)`。

### 面包屑

```vue
<el-breadcrumb separator="/">
  <el-breadcrumb-item
    v-for="match in $route.matched"
    :key="match.path"
    :to="match.path"
  >
    {{ match.meta.title }}
  </el-breadcrumb-item>
</el-breadcrumb>
```

### 路由守卫中 ElMessage

```ts
import { ElMessage } from 'element-plus'

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !isAuthenticated()) {
    ElMessage.warning('请先登录')
    return '/login'
  }
})
```

## 常见踩坑

### 1. 按需引入失败：`ElMessage is not defined`

**原因**：按需引入只配了 `unplugin-vue-components`、没配 `unplugin-auto-import`。

**解决**：两个插件都装、都配 `ElementPlusResolver`：

```ts
plugins: [
  AutoImport({ resolvers: [ElementPlusResolver()] }),    // 这个必须有
  Components({ resolvers: [ElementPlusResolver()] }),
]
```

### 2. SCSS 主题不生效

**原因 1**：没设 `importStyle: 'sass'` —— resolver 引入了预编译 CSS、SCSS 变量被忽略。

```ts
ElementPlusResolver({ importStyle: 'sass' })  // 必须
```

**原因 2**：`additionalData` 顺序错——必须在 `@forward var.scss` 中覆盖、不能在 `@use` 之后再改。

### 3. SSR hydration mismatch（带 Teleport 的组件）

**原因**：ElDialog / ElTooltip 等组件用 Teleport、SSR 渲染时 ID 与 CSR 不一致。

**解决方式 1**：用 `<ClientOnly>` 包裹（最简单）：

```vue
<ClientOnly>
  <el-tooltip content="...">
    <el-button>悬浮</el-button>
  </el-tooltip>
</ClientOnly>
```

**解决方式 2**：手动 SSR provide ID_INJECTION_KEY + ZINDEX_INJECTION_KEY。

### 4. ElTable 性能瓶颈（数据量 > 1000）

**现象**：滚动卡顿、初次渲染慢。

**解决**：

- 后端分页：用 `ElPagination` + 每页 50 条以内
- 切换 `<el-table-v2>`：虚拟化版本，支持 10 万行不卡
- 不要在 column 中放重组件（`<el-image>` 等）

### 5. ElForm 嵌套对象校验失败

**原因**：`prop` 没用字符串路径。

```vue
<!-- ❌ 错误 -->
<el-form-item prop="user.email">

<!-- ❌ 错误 -->
<el-form-item :prop="['user', 'email']">

<!-- ✅ 正确 -->
<el-form-item prop="user.email">
```

> rules 里的 key 也要用字符串路径 `'user.email'`。

### 6. ElDialog 嵌套时无法点击

**原因**：嵌套 Dialog 时内层 Dialog 不在 body 下、被外层 Dialog 的 modal 遮挡。

**解决**：内层 Dialog 加 `append-to-body`：

```vue
<el-dialog v-model="outer">
  外层
  <el-dialog v-model="inner" append-to-body>
    内层
  </el-dialog>
</el-dialog>
```

### 7. 暗色模式下自定义颜色不变

**原因**：用了写死的 hex 颜色而非 CSS 变量。

```css
/* ❌ 暗色模式下仍是白底 */
.my-card { background: #fff; }

/* ✅ 自动跟随 */
.my-card { background: var(--el-bg-color); }
```

### 8. components.d.ts 报错 "Cannot find module"

**原因**：插件还没生成 d.ts 就开始 type-check。

**解决**：

- 启动一次 dev server（让插件生成 d.ts）
- 或手动建空文件：`touch src/components.d.ts src/auto-imports.d.ts`
- 提交到 git 避免 CI 失败

### 9. ElMessageBox 在路由守卫中 await 后不跳转

**原因**：路由守卫的 next() 必须同步调用（v4 已废弃 next，应返回值）。

**解决**：用 Promise 风格 + return：

```ts
router.beforeEach(async (to) => {
  if (to.meta.requiresConfirm) {
    try {
      await ElMessageBox.confirm('确认进入？')
      return true  // 放行
    } catch {
      return false // 拦截
    }
  }
})
```

### 10. ElIcon 在 SSR 报错 `Component is not a function`

**原因**：图标按 ES Module 导入、SSR 编译路径问题。

**解决**：Nuxt 中用 `@element-plus/nuxt` 自动处理；手动 SSR 时检查 ESM 配置。

## 与 Pinia 协同

```ts
// stores/user.ts
import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const loading = ref(false)

  const login = async (credentials) => {
    loading.value = true
    try {
      user.value = await api.login(credentials)
      ElMessage.success('登录成功')
    } catch (err) {
      ElMessage.error('登录失败')
      throw err
    } finally {
      loading.value = false
    }
  }

  return { user, loading, login }
})
```

> **store 中可以直接调用 `ElMessage`** —— 不需要传 `app` 实例（命令式 API 是全局的）。

## 下一步

- [参考](./reference.md)：**API 速查** / 80+ 组件列表 / 常用 props 表 / 命令式 API 签名 / TypeScript 类型 / CSS 变量
