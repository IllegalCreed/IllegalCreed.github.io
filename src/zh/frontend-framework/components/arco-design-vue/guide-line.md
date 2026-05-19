---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 **Arco Design Vue 2.x（v2.58+）**。包含 60+ 组件分类速览、AForm / ATable 深度、Modal / Message / Notification 全局静态 API、主题深度（Less + CSS Variables + Design Lab）、国际化、SSR / Nuxt 3 完整方案、与 arco-design-pro-vue 配合、常见踩坑。

## 速查

- **组件按类别**：General（4） + Layout（4） + Navigation（8） + Data Entry（17） + Data Display（17） + Feedback（11） + Other（4） = **60+ 组件**
- **AForm 核心**：`<a-form :model="form" :rules="rules" ref="formRef" @submit="...">` + `<a-form-item field="email">` + `formRef.value?.validate((errors) => ...)`
- **校验类型**：`string` / `number` / `boolean` / `array` / `object` / `email` / `url` / `ip` + `required` / `length` / `minLength` / `maxLength` / `min` / `max` / `match` / `validator` Promise 风格
- **ATable 核心**：`<a-table :columns="columns" :data="data" :pagination="pagination">` —— **columns 是 JS 对象数组**
- **虚拟列表**：`virtual-list-props="{height:400}"` —— 注意**和展开行 / 树形数据 / 固定列冲突**
- **Modal**：`Modal.confirm({...})` / `Modal.info` / `Modal.success` / `Modal.warning` / `Modal.error` / `Modal.open` —— 静态方法 + 声明式 `<a-modal v-model:visible>`
- **Message**：`Message.success('...')` / `Message.error` / `Message.warning` / `Message.info` / `Message.loading` —— 顶部消息条
- **Notification**：`Notification.info({...})` / `success` / `warning` / `error` —— 角落卡片
- **Drawer**：`<a-drawer v-model:visible :placement="right">` —— right / left / top / bottom
- **暗色**：`document.body.setAttribute('arco-theme', 'dark')` —— 一行
- **主题**：CSS Variables 运行期（`--color-primary-6`） + Less 变量编译期（`@arcoblue-6`）双轨
- **i18n**：`<a-config-provider :locale="zhCN">` —— `@arco-design/web-vue/es/locale/lang/zh-cn`
- **必须**：CSS 必须 import（按需引入设置 `sideEffect: true`）

## 60+ 组件分类速览

Arco Design Vue 把所有组件分为 **7 大类**——熟悉分类有助于快速找到合适的组件：

### General（通用，4）

通用基础组件——按钮、图标、文字、链接：

| 组件 | 标签 | 用途 |
|---|---|---|
| Button | AButton / AButtonGroup | 按钮（type / size / status / shape / loading） |
| Icon | AIcon + 700+ 子图标 | 图标（@arco-design/web-vue/es/icon 内置） |
| Typography | ATypography / ATypographyParagraph / ATypographyTitle / ATypographyText | 排版（多组件） |
| Link | ALink | 链接（hoverable / status） |

### Layout（布局，4）

页面布局容器：

| 组件 | 标签 | 用途 |
|---|---|---|
| Grid | ARow / ACol / AGrid / AGridItem | 24 栅格 + 新版 Grid（v2.15+） |
| Layout | ALayout / ALayoutHeader / ALayoutContent / ALayoutSider / ALayoutFooter | 后台典型布局 |
| Space | ASpace | 间距控制（替代 margin） |
| Divider | ADivider | 分割线 |

### Navigation（导航，8）

页面导航组件：

| 组件 | 标签 | 用途 |
|---|---|---|
| Menu | AMenu / AMenuItem / AMenuItemGroup / ASubMenu | 导航菜单（横向 / 纵向 / 折叠） |
| Breadcrumb | ABreadcrumb / ABreadcrumbItem | 面包屑 |
| Tabs | ATabs / ATabPane | 标签页（line / card / capsule / rounded） |
| Dropdown | ADropdown / ADropdownButton / ADoption | 下拉菜单 |
| Pagination | APagination | 分页器 |
| Steps | ASteps / AStep | 步骤条 |
| Anchor | AAnchor / AAnchorLink | 锚点 |
| BackTop | ABackTop | 回到顶部 |

### Data Entry（数据输入，17）

表单输入控件——所有输入类组件都在这里：

| 组件 | 标签 | 用途 |
|---|---|---|
| Form | AForm / AFormItem | 表单 + 校验 |
| Input | AInput / AInputGroup / AInputPassword / AInputSearch / AInputTag | 输入框（多变种） |
| InputNumber | AInputNumber | 数字输入框 |
| Textarea | ATextarea | 多行文本 |
| AutoComplete | AAutoComplete | 自动补全 |
| Select | ASelect / AOption / AOptgroup | 下拉选择 |
| TreeSelect | ATreeSelect | 树形下拉 |
| Cascader | ACascader | 级联选择 |
| Checkbox | ACheckbox / ACheckboxGroup | 复选框 |
| Radio | ARadio / ARadioGroup | 单选 |
| Switch | ASwitch | 开关 |
| Slider | ASlider | 滑块 |
| Rate | ARate | 评分 |
| DatePicker | ADatePicker / AMonthPicker / AYearPicker / AQuarterPicker / AWeekPicker / ARangePicker | 日期选择 |
| TimePicker | ATimePicker | 时间选择 |
| ColorPicker | AColorPicker | 颜色选择（v2.40+） |
| Upload | AUpload | 文件上传 |
| Transfer | ATransfer | 穿梭框 |
| Mention | AMention | @ 提及 |
| VerificationCode | AVerificationCode | 验证码（v2.40+） |

### Data Display（数据展示，17）

只读 / 展示型组件：

| 组件 | 标签 | 用途 |
|---|---|---|
| Table | ATable / ATableColumn | 表格（虚拟列表 + 树形 + 列拖拽） |
| Tree | ATree | 树（虚拟滚动 / 拖拽 / 多选） |
| List | AList / AListItem | 列表 |
| Card | ACard | 卡片 |
| Carousel | ACarousel / ACarouselItem | 走马灯 |
| Collapse | ACollapse / ACollapseItem | 折叠面板 |
| Calendar | ACalendar | 日历 |
| Avatar | AAvatar / AAvatarGroup | 头像 |
| Badge | ABadge | 徽标 |
| Comment | AComment | 评论 |
| Descriptions | ADescriptions / ADescriptionsItem | 描述列表 |
| Empty | AEmpty | 空状态 |
| Image | AImage / AImagePreview / AImagePreviewGroup | 图片 |
| Statistic | AStatistic | 统计数值 |
| Tag | ATag | 标签 |
| Timeline | ATimeline / ATimelineItem | 时间线 |
| Tooltip | ATooltip | 文字提示 |
| Popover | APopover | 弹出气泡 |
| Popconfirm | APopconfirm | 气泡确认框 |
| Watermark | AWatermark | 水印 |

### Feedback（反馈，11）

用户反馈组件——弹窗 / 提示 / 加载：

| 组件 | 标签 / API | 用途 |
|---|---|---|
| Alert | AAlert | 警告提示条 |
| Modal | AModal / Modal.confirm() | 模态对话框（声明式 + 静态方法） |
| Drawer | ADrawer | 抽屉（right / left / top / bottom） |
| Message | Message.success() | 顶部消息条（静态方法） |
| Notification | Notification.info() | 角落通知卡片（静态方法） |
| Spin | ASpin | 加载中包裹器 |
| Progress | AProgress | 进度条（line / circle / dashboard） |
| Result | AResult | 结果页（success / error / 404 / 500） |
| Skeleton | ASkeleton | 骨架屏 |
| Notice | ANotice | 通知（声明式 v-if） |
| Trigger | ATrigger | 弹出触发器（底层组件） |

### Other（其他，4）

| 组件 | 标签 | 用途 |
|---|---|---|
| ConfigProvider | AConfigProvider | **必须**：全局配置（locale / size / prefix-cls / theme） |
| Affix | AAffix | 固钉 |
| Mention | AMention | @ 提及 |
| ResizeObserver | AResizeObserver | 尺寸观察器（底层） |

## AForm 表单深度

AForm 是 Arco Design Vue 最常用的组件之一——配合 **13+ 校验类型** 实现强大的表单校验：

### 基础用法

```vue
<template>
  <a-form
    ref="formRef"
    :model="form"
    :rules="rules"
    :style="{ width: '500px' }"
    @submit="handleSubmit"
  >
    <a-form-item field="name" label="姓名">
      <a-input v-model="form.name" placeholder="请输入姓名" />
    </a-form-item>

    <a-form-item field="email" label="邮箱">
      <a-input v-model="form.email" placeholder="请输入邮箱" />
    </a-form-item>

    <a-form-item>
      <a-space>
        <a-button type="primary" html-type="submit">提交</a-button>
        <a-button @click="reset">重置</a-button>
      </a-space>
    </a-form-item>
  </a-form>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import type { FormInstance } from '@arco-design/web-vue/es/form'
import { Message } from '@arco-design/web-vue'

const formRef = ref<FormInstance | null>(null)

const form = reactive({
  name: '',
  email: '',
})

const rules = {
  name: [
    { required: true, message: '请输入姓名' },
    { minLength: 2, maxLength: 20, message: '长度在 2 到 20 个字符' },
  ],
  email: [
    { required: true, message: '请输入邮箱' },
    { type: 'email', message: '邮箱格式不正确' },
  ],
}

const handleSubmit = ({ values, errors }: any) => {
  if (errors) {
    Message.error('请检查表单填写')
    return
  }
  Message.success(`提交成功：${JSON.stringify(values)}`)
}

const reset = () => {
  formRef.value?.resetFields()
}
</script>
```

> **关键概念**：
>
> 1. **`<a-form>` 必须 `:model="form"`**——表单数据对象（reactive）
> 2. **`<a-form-item field="...">`**——字段名（对应 model 中的 key）
> 3. **校验规则**：可以在 `<a-form :rules="rules">` 上统一定义，也可以在 `<a-form-item :rules="...">` 上单独定义
> 4. **`@submit="handleSubmit"`**：提交事件签名 `(payload: { values, errors }) => void` —— **errors 不为 null 说明校验失败**

### 13+ 内置校验类型

Arco Design Vue 的 `FieldRule` 比 Element Plus / Naive UI 内置类型更多：

```ts
const rules = {
  // 类型校验
  username: [{ type: 'string', required: true }],
  age: [{ type: 'number', min: 0, max: 120 }],
  agree: [{ type: 'boolean', true: true, message: '必须勾选' }],
  tags: [{ type: 'array', minLength: 1, maxLength: 5 }],
  config: [{ type: 'object', empty: false, hasKeys: ['name'] }],

  // 特殊类型
  email: [{ type: 'email', required: true }],
  website: [{ type: 'url' }],
  ip: [{ type: 'ip' }],

  // 字符串
  password: [
    { required: true },
    { minLength: 8, maxLength: 32 },
    { uppercase: false },     // 不允许全大写
    { lowercase: false },     // 不允许全小写
    { match: /^[a-zA-Z0-9]+$/, message: '只允许字母 + 数字' },
  ],

  // 数字
  score: [
    { type: 'number', min: 0, max: 100 },
    { positive: true },       // 必须正数
    { equal: 60 },            // 等于 60
  ],

  // 数组
  hobbies: [
    { type: 'array', includes: ['running', 'reading'], message: '必须包含 running 或 reading' },
  ],

  // 异步校验（Promise 风格）
  username2: [
    {
      validator: (value: any, cb: (error?: string) => void) => {
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            if (value === 'admin') {
              cb('用户名不能是 admin')
            }
            resolve()
          }, 1000)
        })
      },
    },
  ],

  // 自定义同步校验
  password2: [
    {
      validator: (value: any, cb: (error?: string) => void) => {
        if (value !== 'foo') {
          cb('密码必须是 foo')
        } else {
          cb()
        }
      },
    },
  ],
}
```

**完整 FieldRule 字段**：

| 字段 | 类型 | 说明 |
|---|---|---|
| `type` | string | 校验类型（'string' / 'number' / 'boolean' / 'array' / 'object' / 'email' / 'url' / 'ip'） |
| `required` | boolean | 是否必填 |
| `message` | string | 失败提示 |
| `length` | number | 精确长度（string / array） |
| `minLength` / `maxLength` | number | 最小 / 最大长度（string / array） |
| `match` | RegExp | 正则匹配（string） |
| `uppercase` / `lowercase` | boolean | 是否全大写 / 全小写（string） |
| `min` / `max` | number | 最小 / 最大值（number） |
| `equal` | number | 等于（number） |
| `positive` / `negative` | boolean | 正数 / 负数（number） |
| `true` / `false` | boolean | 必须是 true / false（boolean） |
| `includes` | any[] | 数组必须包含（array） |
| `deepEqual` | any | 数组元素相等（array） |
| `empty` | boolean | 对象是否为空（object） |
| `hasKeys` | string[] | 对象必须包含的 key（object） |
| `validator` | function | 自定义函数 `(value, callback) => void / Promise` |

### 嵌套字段（path）

`field` 支持 `[index]` 数组下标和 `.` 对象路径：

```vue
<template>
  <a-form :model="form">
    <!-- 对象嵌套 -->
    <a-form-item field="user.name" label="用户名">
      <a-input v-model="form.user.name" />
    </a-form-item>

    <!-- 数组下标 -->
    <a-form-item
      v-for="(post, index) in form.posts"
      :key="index"
      :field="`posts[${index}].title`"
      :label="`帖子 ${index + 1}`"
    >
      <a-input v-model="post.title" />
    </a-form-item>
  </a-form>
</template>
```

### 动态添加 / 删除字段

```vue
<template>
  <a-form :model="form">
    <a-form-item field="name" label="姓名">
      <a-input v-model="form.name" />
    </a-form-item>

    <a-form-item
      v-for="(post, index) of form.posts"
      :key="index"
      :field="`posts[${index}].value`"
      :label="`帖子 ${index + 1}`"
      :rules="[{ required: true, message: '帖子内容必填' }]"
    >
      <a-input v-model="post.value" placeholder="请输入帖子内容" />
      <a-button @click="handleDelete(index)" :style="{ marginLeft: '10px' }">
        删除
      </a-button>
    </a-form-item>

    <a-form-item>
      <a-button @click="handleAdd">添加帖子</a-button>
    </a-form-item>
  </a-form>
</template>

<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({
  name: '',
  posts: [{ value: '' }] as { value: string }[],
})

const handleAdd = () => {
  form.posts.push({ value: '' })
}

const handleDelete = (index: number) => {
  form.posts.splice(index, 1)
}
</script>
```

### FormInstance 方法

通过 `formRef.value?.method()` 调用：

| 方法 | 签名 | 说明 |
|---|---|---|
| `validate` | `(cb?: (errors) => void) => Promise` | 全部校验 |
| `validateField` | `(field: string \| string[], cb?: ...) => Promise` | 单字段校验 |
| `resetFields` | `(field?: string \| string[]) => void` | 重置（清空 + 清校验状态） |
| `clearValidate` | `(field?: string \| string[]) => void` | 仅清校验状态（保留值） |
| `setFields` | `(fields: Record<string, { value?, status?, message? }>) => void` | 手动设字段值 / 状态 |
| `scrollToField` | `(field: string) => void` | 滚动到字段 |

```vue
<script setup lang="ts">
const formRef = ref<FormInstance | null>(null)

// Promise 风格
const submit = async () => {
  const errors = await formRef.value?.validate()
  if (errors) {
    Message.error('请检查表单')
    return
  }
  Message.success('提交成功')
}

// callback 风格
const submitCb = () => {
  formRef.value?.validate((errors) => {
    if (errors) {
      Message.error('请检查表单')
    } else {
      Message.success('提交成功')
    }
  })
}

// 手动设字段错误（异步校验失败回写）
const setError = () => {
  formRef.value?.setFields({
    username: {
      status: 'error',
      message: '用户名已被占用',
    },
  })
}
</script>
```

### 自动滚动到第一个错误字段

长表单提交后自动滚动到第一个错误：

```vue
<template>
  <a-form
    ref="formRef"
    :model="form"
    :scroll-to-first-error="true"
  >
    <!-- ... -->
  </a-form>
</template>
```

> **`:scroll-to-first-error="true"`**——`validate()` 失败后自动 scrollIntoView。

### 校验触发时机

通过 `validate-trigger` 控制校验时机（默认 `change`）：

```vue
<a-form-item field="email" label="邮箱" validate-trigger="blur">
  <a-input v-model="form.email" />
</a-form-item>

<a-form-item field="phone" label="手机" :validate-trigger="['change', 'input']">
  <a-input v-model="form.phone" />
</a-form-item>
```

可选值：`'change'` / `'input'` / `'blur'` / `'focus'`，也可数组组合。

## ATable 表格深度

ATable 是 Arco Design Vue 最强大的组件——支持虚拟列表、树形、列固定、行选择、服务端排序等高级特性：

### 基础用法

```vue
<template>
  <a-table :columns="columns" :data="data" :pagination="pagination" />
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import type { TableColumnData } from '@arco-design/web-vue/es/table/interface'

const columns: TableColumnData[] = [
  { title: '姓名', dataIndex: 'name', width: 140, fixed: 'left' },
  { title: '邮箱', dataIndex: 'email' },
  { title: '地址', dataIndex: 'address' },
  { title: '薪资', dataIndex: 'salary', align: 'right' },
]

const data = reactive([
  { key: '1', name: 'Jane', email: 'jane@example.com', address: 'London', salary: 23000 },
  { key: '2', name: 'Alisa', email: 'alisa@example.com', address: 'Paris', salary: 25000 },
])

const pagination = reactive({
  total: 100,
  current: 1,
  pageSize: 10,
  showTotal: true,
  showPageSize: true,
})
</script>
```

> **关键概念**：
>
> 1. **`columns` 是 JS 对象数组**——和 Naive UI 一样、不是 Element Plus 的 `<el-table-column>` 模板写法
> 2. **`dataIndex`**：数据键名（对应 `data[i][dataIndex]`）
> 3. **`fixed: 'left' | 'right'`**：列固定（横向滚动时不动）
> 4. **`pagination` 是对象配置**——不要传 `false` 才显示

### 排序 + 筛选

```ts
const columns: TableColumnData[] = [
  {
    title: '姓名',
    dataIndex: 'name',
    sortable: {
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
  },
  {
    title: '薪资',
    dataIndex: 'salary',
    sortable: {
      sortDirections: ['ascend', 'descend'],
    },
    filterable: {
      filters: [
        { text: '> 20000', value: '20000' },
        { text: '> 30000', value: '30000' },
      ],
      filter: (value, record) => record.salary > Number(value),
      multiple: true,
    },
  },
  {
    title: '地址',
    dataIndex: 'address',
    filterable: {
      filters: [
        { text: 'London', value: 'London' },
        { text: 'Paris', value: 'Paris' },
      ],
      filter: (value, row) => row.address.includes(value),
    },
  },
]
```

### 服务端排序 / 筛选 / 分页

```vue
<template>
  <a-table
    :columns="columns"
    :data="data"
    :pagination="pagination"
    @change="handleChange"
  />
</template>

<script setup lang="ts">
const columns = [
  {
    title: '姓名',
    dataIndex: 'name',
    sortable: {
      sortDirections: ['ascend', 'descend'],
      sorter: true,   // 关闭内部排序、走服务端
    },
  },
]

const handleChange = (
  data: any[],
  extra: { type: 'pagination' | 'sorter' | 'filter'; sorter: any; filters: any; page: any },
) => {
  // 根据 extra.type 区分是分页 / 排序 / 筛选触发
  fetchData({
    page: extra.page?.current,
    pageSize: extra.page?.pageSize,
    sortField: extra.sorter?.field,
    sortDir: extra.sorter?.direction,
    filters: extra.filters,
  })
}
</script>
```

### 行选择

```vue
<template>
  <a-table
    :columns="columns"
    :data="data"
    :row-selection="rowSelection"
    :row-key="'key'"
    @selection-change="handleSelectionChange"
  />
</template>

<script setup lang="ts">
const rowSelection = {
  type: 'checkbox',           // 或 'radio'
  showCheckedAll: true,        // 显示全选
  onlyCurrent: false,          // false = 跨页全选
}

const selectedKeys = ref<string[]>([])

const handleSelectionChange = (keys: (string | number)[]) => {
  selectedKeys.value = keys as string[]
}
</script>
```

### 展开行（不能与虚拟列表共用）

```vue
<template>
  <a-table :columns="columns" :data="data" :expandable="expandable" />
</template>

<script setup lang="ts">
const expandable = reactive({
  title: '展开',
  width: 80,
  expandedRowRender: (record: any) => {
    return `Detail for: ${record.name}`
  },
})
</script>
```

### 树形数据

```vue
<template>
  <a-table
    :columns="columns"
    :data="treeData"
    :children-key="'children'"
    :indent-size="40"
  />
</template>

<script setup lang="ts">
const treeData = [
  {
    key: '1',
    name: '根 1',
    children: [
      { key: '1-1', name: '子 1-1' },
      { key: '1-2', name: '子 1-2' },
    ],
  },
  {
    key: '2',
    name: '根 2',
  },
]
</script>
```

### 虚拟列表（大数据场景）

10 万行流畅滚动：

```vue
<template>
  <a-table
    :columns="columns"
    :data="data"
    :virtual-list-props="{ height: 400 }"
    :pagination="false"
    :scroll="{ x: 1000 }"
  />
</template>

<script setup lang="ts">
const data = Array(100000).fill(null).map((_, i) => ({
  key: String(i),
  name: `用户 ${i + 1}`,
  email: `user.${i + 1}@example.com`,
}))
</script>
```

> **虚拟列表注意**：
>
> 1. **不能与展开行 / 树形数据 / 行合并共用** —— 虚拟列表内部使用 `transform: translate3d(...)`、不兼容这些特性
> 2. **必须固定 `:pagination="false"`** —— 虚拟列表 = 不分页
> 3. **建议固定列**（`fixed: 'left'`）+ 横向 `scroll.x` —— 防止水平滚动时性能下降

### 自定义单元格渲染（slot）

模板写法（推荐）：

```vue
<template>
  <a-table :columns="columns" :data="data">
    <template #status="{ record }">
      <a-tag :color="record.status === 'active' ? 'green' : 'red'">
        {{ record.status }}
      </a-tag>
    </template>

    <template #actions="{ record }">
      <a-space>
        <a-button size="mini" @click="handleEdit(record)">编辑</a-button>
        <a-popconfirm content="确定删除？" @ok="handleDelete(record)">
          <a-button size="mini" status="danger">删除</a-button>
        </a-popconfirm>
      </a-space>
    </template>
  </a-table>
</template>

<script setup lang="ts">
const columns = [
  { title: '姓名', dataIndex: 'name' },
  { title: '状态', dataIndex: 'status', slotName: 'status' },      // 关键：slotName
  { title: '操作', slotName: 'actions', width: 200 },
]
</script>
```

> **`slotName` 是 Arco 的关键**——告诉 ATable 用哪个 slot 渲染。

也可以用 `render` 函数（适合复杂逻辑）：

```ts
import { h } from 'vue'
import { Tag } from '@arco-design/web-vue'

const columns: TableColumnData[] = [
  {
    title: '状态',
    dataIndex: 'status',
    render: ({ record }) => {
      return h(Tag, { color: record.status === 'active' ? 'green' : 'red' }, () => record.status)
    },
  },
]
```

## Modal / Message / Notification 反馈

Arco Design Vue 的反馈三件套**都是全局静态方法**——**无需 Provider 嵌套**（与 Element Plus 一致、与 Naive UI 不同）：

### Modal（模态对话框）

#### 声明式（v-model）

```vue
<template>
  <a-button type="primary" @click="visible = true">打开 Modal</a-button>

  <a-modal
    v-model:visible="visible"
    title="编辑用户"
    :ok-loading="loading"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-form :model="form">
      <a-form-item field="name" label="姓名">
        <a-input v-model="form.name" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Message } from '@arco-design/web-vue'

const visible = ref(false)
const loading = ref(false)

const form = reactive({ name: '' })

const handleOk = async () => {
  loading.value = true
  await new Promise((r) => setTimeout(r, 1500))
  loading.value = false
  visible.value = false
  Message.success('保存成功')
}

const handleCancel = () => {
  visible.value = false
}
</script>
```

#### 静态方法（imperative）

```ts
import { Modal } from '@arco-design/web-vue'
import { h } from 'vue'

// 信息提示
Modal.info({
  title: '提示',
  content: '这是一条信息',
  okText: '知道了',
})

// 确认
Modal.confirm({
  title: '确认删除',
  content: '删除后不可恢复，确定继续？',
  okText: '删除',
  cancelText: '取消',
  okButtonProps: { status: 'danger' },
  onOk: () => {
    Message.success('已删除')
  },
  onCancel: () => {
    Message.info('已取消')
  },
})

// 异步关闭（阻止默认关闭）
Modal.confirm({
  title: '确认',
  content: '保存修改？',
  onOk: async () => {
    await saveData()
    Message.success('已保存')
    // 返回 true / 不返回 = 关闭
    // 返回 false = 阻止关闭
  },
})

// 状态变种
Modal.success({ title: '成功', content: '操作成功' })
Modal.warning({ title: '警告', content: '请注意' })
Modal.error({ title: '失败', content: '操作失败' })

// 自定义内容（render 函数）
Modal.open({
  title: '自定义',
  content: () =>
    h('div', { style: 'padding: 16px;' }, [
      h('p', '这是自定义内容'),
      h('a-button', { onClick: () => Message.info('button clicked') }, '点我'),
    ]),
})
```

#### 关闭返回值（控制是否真的关闭）

```ts
Modal.confirm({
  title: '提示',
  content: '请输入姓名',
  onOk: () => {
    if (!form.name) {
      Message.error('姓名必填')
      return false   // 阻止关闭
    }
    Message.success('已确认')
    // 不返回 / 返回 true = 关闭
  },
})
```

### Message（顶部消息条）

```ts
import { Message } from '@arco-design/web-vue'

// 基础
Message.success('成功')
Message.error('失败')
Message.warning('警告')
Message.info('信息')

// loading（不自动关闭）
const loading = Message.loading({
  content: '加载中...',
  duration: 0,   // 不自动关闭
})
// 手动关闭
setTimeout(() => loading.close(), 3000)

// 完整配置
Message.success({
  content: '保存成功',
  duration: 5000,           // 5 秒
  closable: true,
  position: 'top',          // 'top' / 'bottom'
  id: 'save-msg',           // 防重复（同 id 会更新而非新建）
  onClose: () => {
    console.log('消息关闭')
  },
})

// 更新（通过 id）
Message.success({
  id: 'save-msg',
  content: '更新后的内容',
})

// 清空
Message.clear()
Message.clear('top')   // 只清顶部
```

### Notification（角落通知）

```ts
import { Notification } from '@arco-design/web-vue'

Notification.info({
  title: '系统消息',
  content: '您有 5 条新消息',
})

Notification.success({
  title: '成功',
  content: '操作已完成',
  duration: 4500,
  position: 'topRight',   // topLeft / topRight / bottomLeft / bottomRight
  closable: true,
})

// 自定义关闭
const noti = Notification.info({
  title: '提示',
  content: '点击右上角关闭按钮',
  duration: 0,
  closable: true,
})

// 手动关闭
setTimeout(() => noti.close(), 5000)

// 清空
Notification.clear()
Notification.clear('topRight')
```

### setup 外调用（必须设置 _context）

`Modal` / `Message` 等静态方法在某些场景下可能丢失 Vue 上下文（如 vue-router 守卫、Pinia store、原生 JS 函数）——需要手动注入：

```ts
// main.ts
import { createApp } from 'vue'
import { Modal, Message, Notification } from '@arco-design/web-vue'
import App from './App.vue'

const app = createApp(App)

// 注入 Vue 上下文（确保 i18n / theme / route 能正常工作）
Modal._context = app._context
Message._context = app._context
Notification._context = app._context

app.mount('#app')
```

> **不注入 `_context` 也可以用**——但 Modal 内部如果用到了 `vue-i18n` / `vue-router` 等通过 provide 注入的功能、会失效。

## Drawer 抽屉

```vue
<template>
  <a-space>
    <a-button type="primary" @click="visible = true">右抽屉（默认）</a-button>
    <a-button @click="leftVisible = true">左抽屉</a-button>
    <a-button @click="bottomVisible = true">底抽屉</a-button>
  </a-space>

  <!-- 右抽屉（默认） -->
  <a-drawer
    v-model:visible="visible"
    title="编辑详情"
    :width="400"
    :ok-loading="loading"
    @ok="handleOk"
    @cancel="visible = false"
  >
    <a-form :model="formData" layout="vertical">
      <a-form-item label="姓名">
        <a-input v-model="formData.name" />
      </a-form-item>
      <a-form-item label="描述">
        <a-textarea v-model="formData.description" />
      </a-form-item>
    </a-form>
  </a-drawer>

  <!-- 左抽屉 -->
  <a-drawer
    v-model:visible="leftVisible"
    title="菜单"
    placement="left"
    :width="250"
    :footer="false"
  >
    <a-menu>
      <a-menu-item key="1">菜单 1</a-menu-item>
      <a-menu-item key="2">菜单 2</a-menu-item>
    </a-menu>
  </a-drawer>

  <!-- 底抽屉 -->
  <a-drawer
    v-model:visible="bottomVisible"
    title="筛选条件"
    placement="bottom"
    :height="300"
  >
    <a-checkbox-group v-model="filters">
      <a-checkbox value="active">激活</a-checkbox>
      <a-checkbox value="inactive">未激活</a-checkbox>
    </a-checkbox-group>
  </a-drawer>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Message } from '@arco-design/web-vue'

const visible = ref(false)
const leftVisible = ref(false)
const bottomVisible = ref(false)
const loading = ref(false)
const filters = ref<string[]>([])

const formData = reactive({ name: '', description: '' })

const handleOk = async () => {
  loading.value = true
  await new Promise((r) => setTimeout(r, 1500))
  loading.value = false
  visible.value = false
  Message.success('保存成功')
}
</script>
```

**常用 Drawer 配置**：

| Prop | 类型 | 说明 |
|---|---|---|
| `visible` | boolean | v-model 绑定 |
| `placement` | `'top'` / `'right'` / `'bottom'` / `'left'` | 位置（默认 right） |
| `width` / `height` | number / string | 宽度（左/右） / 高度（上/下） |
| `title` | string / slot | 标题 |
| `mask-closable` | boolean | 点遮罩是否关闭（默认 true） |
| `close-on-esc` | boolean | ESC 是否关闭（默认 true） |
| `footer` | boolean / slot | 是否显示底部按钮区 |
| `ok-loading` | boolean | OK 按钮 loading 状态 |
| `unmount-on-close` | boolean | 关闭时是否销毁 DOM（推荐 true） |

## 主题深度自定义

Arco Design Vue 主题系统**双轨制**：

- **CSS Variables**：**运行期切换、灵活、与暗色模式兼容**——日常推荐
- **Less 变量**：**编译期深度定制、彻底**——品牌色统一覆盖时用

### 方案一：CSS Variables（运行期）

Arco Design Vue 暴露了大量 CSS Variables，**可以在任何地方覆盖**：

```css
/* 全局覆盖 */
:root {
  --color-primary-1: #e8f3ff;
  --color-primary-2: #bedaff;
  --color-primary-3: #94bfff;
  --color-primary-4: #6aa1ff;
  --color-primary-5: #4080ff;
  --color-primary-6: #165dff;   /* 主色 */
  --color-primary-7: #0e42d2;
  --color-primary-8: #072ca6;
  --color-primary-9: #001a7a;
  --color-primary-10: #00114d;

  /* 文字色 */
  --color-text-1: #1d2129;
  --color-text-2: #4e5969;
  --color-text-3: #86909c;
  --color-text-4: #c9cdd4;

  /* 背景色 */
  --color-bg-1: #ffffff;
  --color-bg-2: #ffffff;
  --color-bg-3: #ffffff;
  --color-bg-4: #ffffff;
  --color-bg-5: #ffffff;

  /* 边框色 */
  --color-border-1: #f2f3f5;
  --color-border-2: #e5e6eb;
  --color-border-3: #c9cdd4;
  --color-border-4: #86909c;
}

/* 暗色覆盖 */
body[arco-theme='dark'] {
  --color-primary-6: #3c7eff;
  --color-text-1: #f7f8fa;
  --color-bg-1: #17171a;
  /* ... */
}
```

> **CSS Variables 命名规则**：`--color-{type}-{n}`，其中：
>
> - `type`：`primary` / `success` / `warning` / `danger` / `text` / `bg` / `border` / `fill` / `neutral`
> - `n`：1-10 色阶（1 最浅、10 最深）
> - 例：`--color-primary-6` 是主色、`--color-primary-1` 是主色最浅 tint

### 方案二：Less 变量（编译期）

适合**深度定制 + 品牌色全站统一**：

```ts
// vite.config.ts
export default defineConfig({
  css: {
    preprocessorOptions: {
      less: {
        modifyVars: {
          'arcoblue-6': '#f85959',         // 主色改红
          'green-6': '#00b42a',
          'red-6': '#f53f3f',
          'orange-6': '#ff7d00',
        },
        javascriptEnabled: true,            // 必须 true
      },
    },
  },
})
```

> **Less 变量列表**：完整见 [arco-design-vue/tokens.less](https://github.com/arco-design/arco-design-vue/blob/main/packages/web-vue/components/style/themes/default/tokens.less) —— 数百个变量覆盖所有色阶 / 间距 / 圆角 / 字体。

### 方案三：Design Lab（GUI 拖拽）

[arco.design/themes](https://arco.design/themes) 是 Arco 提供的**在线主题平台**——设计师在线调色、实时预览、一键导出 npm package：

1. 访问 [arco.design/themes](https://arco.design/themes)
2. 在线拖拽调整色阶 / 圆角 / 间距
3. 实时预览所有组件效果
4. 点「下载主题」生成 npm package（如 `@arco-themes/web-mytheme`）
5. 项目中：

```bash
pnpm add @arco-themes/web-mytheme
```

```ts
// main.ts
import '@arco-themes/web-mytheme/css/arco.css'   // 替换默认 CSS
```

> **Design Lab 是 Arco 的杀手锏**——设计师无需写代码、一个下午就能产出企业级品牌主题。

### 完整品牌主题示例

完整的「品牌主题切换」示例（结合 CSS Variables）：

```vue
<template>
  <a-space>
    <a-button @click="setTheme('default')">默认蓝</a-button>
    <a-button @click="setTheme('red')">红色</a-button>
    <a-button @click="setTheme('green')">绿色</a-button>
    <a-button @click="toggleDark">切换暗色</a-button>
  </a-space>
</template>

<script setup lang="ts">
const themes: Record<string, Record<string, string>> = {
  default: {
    '--color-primary-6': '#165dff',
  },
  red: {
    '--color-primary-6': '#f53f3f',
  },
  green: {
    '--color-primary-6': '#00b42a',
  },
}

const setTheme = (name: string) => {
  const theme = themes[name]
  if (!theme) return
  Object.entries(theme).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value)
  })
}

const toggleDark = () => {
  const isDark = document.body.getAttribute('arco-theme') === 'dark'
  if (isDark) {
    document.body.removeAttribute('arco-theme')
  } else {
    document.body.setAttribute('arco-theme', 'dark')
  }
}
</script>
```

## 国际化深度

### locale 完整结构

Arco 的 locale 包就是一个嵌套对象：

```ts
// 简化版（实际有几百个 key）
const zhCN = {
  locale: 'zh-CN',
  empty: {
    description: '暂无数据',
  },
  pagination: {
    goto: '前往',
    page: '页',
    countPerPage: '条/页',
    total: '共 {0} 条',
  },
  table: {
    okText: '确定',
    resetText: '重置',
  },
  modal: {
    okText: '确定',
    cancelText: '取消',
    msgInfo: '提示',
    msgSuccess: '成功',
    msgWarning: '警告',
    msgError: '错误',
  },
  // ... 几百个 key
}
```

### 与 vue-i18n 集成

业务文案用 `vue-i18n`、组件文案用 Arco locale：

```ts
// main.ts
import { createI18n } from 'vue-i18n'
import zhCNBusiness from './locales/zh-CN.json'   // 业务文案

const i18n = createI18n({
  locale: 'zh-CN',
  messages: {
    'zh-CN': zhCNBusiness,
  },
})

app.use(i18n)
```

```vue
<template>
  <!-- Arco locale -->
  <a-config-provider :locale="arcoLocale">
    <!-- 业务文案 -->
    <h1>{{ $t('welcome') }}</h1>

    <!-- 组件文案（自动用 Arco zh-CN） -->
    <a-pagination :total="100" show-total />
  </a-config-provider>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import zhCN from '@arco-design/web-vue/es/locale/lang/zh-cn'
import enUS from '@arco-design/web-vue/es/locale/lang/en-us'

const { locale } = useI18n()

const arcoLocale = computed(() => {
  return locale.value === 'zh-CN' ? zhCN : enUS
})
</script>
```

### 切换语言（联动）

```vue
<template>
  <a-config-provider :locale="arcoLocale">
    <a-radio-group v-model="lang" type="button">
      <a-radio value="zh-CN">中文</a-radio>
      <a-radio value="en-US">English</a-radio>
    </a-radio-group>
  </a-config-provider>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ref } from 'vue'
import zhCN from '@arco-design/web-vue/es/locale/lang/zh-cn'
import enUS from '@arco-design/web-vue/es/locale/lang/en-us'

const i18n = useI18n()
const lang = ref<'zh-CN' | 'en-US'>('zh-CN')

const arcoLocale = computed(() => (lang.value === 'zh-CN' ? zhCN : enUS))

// vue-i18n 同步切换
watch(lang, (val) => {
  i18n.locale.value = val
  localStorage.setItem('lang', val)
})
</script>
```

## SSR / Nuxt 完整方案

### Nuxt 3 配置

Arco Design Vue **v2.44.3+ 添加 `exports` 配置**——Nuxt 3 即装即用：

```bash
pnpm add @arco-design/web-vue
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  css: ['@arco-design/web-vue/dist/arco.css'],

  build: {
    transpile: ['@arco-design/web-vue'],
  },

  vite: {
    // 可选：Less 变量定制
    css: {
      preprocessorOptions: {
        less: {
          modifyVars: {
            'arcoblue-6': '#165dff',
          },
          javascriptEnabled: true,
        },
      },
    },
  },
})
```

### Nuxt 3 + 按需引入

```bash
pnpm add -D unplugin-vue-components unplugin-auto-import
```

```ts
// nuxt.config.ts
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ArcoResolver } from 'unplugin-vue-components/resolvers'

export default defineNuxtConfig({
  build: {
    transpile: ['@arco-design/web-vue'],
  },

  vite: {
    plugins: [
      AutoImport({
        resolvers: [ArcoResolver({ resolveIcons: true })],
        dts: 'auto-imports.d.ts',
      }),
      Components({
        resolvers: [ArcoResolver({ sideEffect: true })],
        dts: 'components.d.ts',
      }),
    ],
  },
})
```

### Nuxt 3 plugin（注入 `_context`）

如果在 server-side 中用 Modal.confirm 等静态方法，需要注入 context：

```ts
// plugins/arco.client.ts
import { Modal, Message, Notification } from '@arco-design/web-vue'

export default defineNuxtPlugin((nuxtApp) => {
  // 只在 client-side 注入
  Modal._context = nuxtApp.vueApp._context
  Message._context = nuxtApp.vueApp._context
  Notification._context = nuxtApp.vueApp._context
})
```

> **`.client.ts` 后缀**——确保只在浏览器执行（Modal 等命令式 API 依赖 DOM、SSR 阶段会报错）。

### Vite SSR 配置

```ts
// vite.config.ts
export default defineConfig({
  ssr: {
    noExternal: ['@arco-design/web-vue'],
  },
})
```

### 防止 SSR hydration mismatch

**关键原则**：**Modal / Message / Notification 静态方法只在 client 调用**：

```vue
<script setup lang="ts">
import { onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'

// 在 onMounted 中调用（onMounted 仅 client-side 执行）
onMounted(() => {
  Message.success('页面加载完成')
})

// 错误：在 setup 顶层调用会导致 SSR 失败
// Message.success('...')   ❌
</script>
```

## 与 Vue Router + Pinia 集成

Arco Design Vue 与 Vue Router + Pinia 完美集成——零冲突：

```vue
<!-- App.vue -->
<template>
  <a-config-provider :locale="zhCN" :size="size">
    <a-layout style="height: 100vh;">
      <a-layout-sider
        :width="220"
        theme="dark"
        breakpoint="lg"
        collapsible
        v-model:collapsed="collapsed"
      >
        <div class="logo" />

        <a-menu
          theme="dark"
          :default-selected-keys="[activeMenu]"
          :default-open-keys="['/system']"
          @menu-item-click="handleMenuClick"
        >
          <a-menu-item key="/">
            <template #icon><icon-home /></template>
            仪表盘
          </a-menu-item>

          <a-sub-menu key="/system">
            <template #icon><icon-settings /></template>
            <template #title>系统管理</template>
            <a-menu-item key="/system/users">用户管理</a-menu-item>
            <a-menu-item key="/system/roles">角色管理</a-menu-item>
          </a-sub-menu>
        </a-menu>
      </a-layout-sider>

      <a-layout>
        <a-layout-header class="layout-header">
          <a-breadcrumb>
            <a-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
              {{ item.title }}
            </a-breadcrumb-item>
          </a-breadcrumb>
        </a-layout-header>

        <a-layout-content style="padding: 24px;">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </a-layout-content>
      </a-layout>
    </a-layout>
  </a-config-provider>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import zhCN from '@arco-design/web-vue/es/locale/lang/zh-cn'

const route = useRoute()
const router = useRouter()

const size = ref<'mini' | 'small' | 'medium' | 'large'>('medium')
const collapsed = ref(false)

const activeMenu = computed(() => route.path)

// 面包屑（从 route.matched 推导）
const breadcrumbs = computed(() => {
  return route.matched.map((item) => ({
    path: item.path,
    title: item.meta.title || item.name,
  }))
})

// 菜单点击 → 路由跳转
const handleMenuClick = (key: string) => {
  router.push(key)
}
</script>

<style scoped>
.layout-header {
  display: flex;
  align-items: center;
  padding: 0 24px;
  background: var(--color-bg-2);
  border-bottom: 1px solid var(--color-border-2);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
```

> **关键点**：
>
> 1. `<a-menu>` 用 `<a-menu-item>` / `<a-sub-menu>` **模板写法**（更接近 Element Plus）
> 2. `<a-menu-item :key="path">` —— **key 就是路由路径**、方便联动
> 3. `@menu-item-click="handleMenuClick"` —— **menu-item-click 事件**（不是 `select`）
> 4. CSS Variables 直接用——`var(--color-bg-2)` / `var(--color-border-2)`

## 与 arco-design-pro-vue 配合

[arco-design-pro-vue](https://github.com/arco-design/arco-design-pro-vue) 是 Arco **官方维护**的企业级中后台模板：

```bash
pnpm create arco-design-pro
# 或
git clone https://github.com/arco-design/arco-design-pro-vue.git
```

**内置功能**：

- TypeScript + Vue 3 + Vite + Pinia
- 多主题 + 暗色 + 国际化（中英）
- 完整权限模型（路由权限 + 按钮权限）
- Mock 数据 + Axios 封装
- 多页签 + 动态面包屑
- 业务模板（Dashboard / List / Form / Profile / Result / Exception）

**目录结构**：

```
arco-design-pro-vue/
├── src/
│   ├── api/                # API 封装
│   ├── components/         # 公共组件
│   ├── layout/             # 布局（侧边栏 / 顶栏 / Tab 栏）
│   ├── locale/             # 国际化（zh-CN / en-US）
│   ├── router/             # 路由 + 权限
│   ├── store/              # Pinia 状态
│   ├── views/              # 页面
│   ├── App.vue
│   └── main.ts
├── mock/                   # Mock 数据
├── vite.config.ts
└── package.json
```

**适合**：直接基于此模板开发企业中后台——**比从零搭建省 1-2 周**。

## 常见踩坑

### 坑 1：CSS 没 import / 组件无样式

**现象**：组件渲染但白屏 / 无边框 / 无颜色。

**原因**：未 import CSS。

**全量引入修复**：

```ts
import '@arco-design/web-vue/dist/arco.css'
```

**按需引入修复**：

```ts
Components({
  resolvers: [
    ArcoResolver({
      sideEffect: true,   // 必须 true
    }),
  ],
})
```

### 坑 2：icon 包路径变化（v2.44.3 前后）

**现象**：升级到 v2.44.3+ 后 icon 报 `Cannot find module '@arco-design/web-vue/es/icon'`。

**原因**：v2.44.3 为兼容 Nuxt 3 添加了 `exports` 配置——**老路径仍可用、但部分构建工具会变严格**。

**修复**：确保 `pnpm-lock.yaml` / `package-lock.json` 没有锁住老版本，按官方推荐的 import 路径：

```ts
import { IconPlus } from '@arco-design/web-vue/es/icon'
```

### 坑 3：Modal 上下文丢失（i18n / route 失效）

**现象**：`Modal.confirm` 弹窗内的 `$t()` / `<router-link>` 报错。

**原因**：静态 API 未注入 Vue 上下文。

**修复**：

```ts
// main.ts
import { Modal, Message, Notification } from '@arco-design/web-vue'

const app = createApp(App)

Modal._context = app._context
Message._context = app._context
Notification._context = app._context

app.mount('#app')
```

### 坑 4：SSR hydration mismatch

**现象**：Nuxt 3 项目控制台报 `Hydration node mismatch`。

**原因**：

- Modal 等命令式 API 在 server-side 执行报错
- 暗色模式判断（`document.body.getAttribute(...)`）在 SSR 无 document

**修复**：

```vue
<script setup lang="ts">
import { onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'

// 只在 client 调用
onMounted(() => {
  Message.success('已加载')
})

// 暗色判断包在 onMounted 内
onMounted(() => {
  const isDark = document.body.getAttribute('arco-theme') === 'dark'
  // ...
})
</script>
```

### 坑 5：Less 主题编译失败

**现象**：定制 Less 变量后构建报 `Cannot read property of undefined` / Less 语法错误。

**原因**：缺少 `javascriptEnabled: true`（Arco 的 Less 变量内部用了 JS 表达式）。

**修复**：

```ts
// vite.config.ts
css: {
  preprocessorOptions: {
    less: {
      modifyVars: { /* ... */ },
      javascriptEnabled: true,   // 必须 true
    },
  },
},
```

### 坑 6：ATable 虚拟列表与展开行 / 树形冲突

**现象**：开启 `virtual-list-props` 后 `:expandable` / `children-key` 不生效。

**原因**：虚拟列表内部用 `transform`、不兼容展开 / 树形。

**修复**：

- 数据量小（&lt; 1000 行）：关掉虚拟列表
- 数据量大 + 需要展开：用**展开点击触发 Drawer / Modal** 显示详情（不在表格内展开）
- 树形 + 大数据：考虑用 `<a-tree>` 替代 `<a-table>`

### 坑 7：AForm 校验提示中文乱码

**现象**：校验失败提示是英文 `Please enter ...`。

**原因**：未配置中文 locale 或在 `<a-form>` 外部使用。

**修复**：

```vue
<a-config-provider :locale="zhCN">
  <a-form ...>
    <!-- ... -->
  </a-form>
</a-config-provider>
```

### 坑 8：按需引入 ArcoResolver 报版本错误

**现象**：按需引入插件报 `version >= 2.11.0 required`。

**原因**：ArcoResolver 要求 Arco Design Vue v2.11.0+。

**修复**：

```bash
pnpm add @arco-design/web-vue@latest
```

## 下一步

学完指南后，可以查阅 [参考](./reference.md) 速查 API 细节：60+ 组件分类 / 常用 props 速查表 / Modal / Message / Notification 静态 API 签名 / TypeScript 类型 / 主题对象结构 / 13+ 语言包列表。
