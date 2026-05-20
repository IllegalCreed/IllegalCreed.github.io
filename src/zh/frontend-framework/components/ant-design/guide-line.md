---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 **Ant Design 5.x**（v5.22+）。包含 70+ 组件分类速览、Form / Table 深度、反馈三件套（message / Modal / notification）、容器组件（Drawer / Modal）、ConfigProvider 全局配置、Design Token 三层架构 + algorithm 算法、暗色 / 紧凑模式、Pro Components 中后台二次封装、Next.js App Router 集成、SSR / cssinjs、与 React Router + 状态库集成、常见踩坑。

## 速查

- **组件按类别**：General（4） + Layout（7） + Navigation（7） + Data Entry（18） + Data Display（20） + Feedback（11） + Other（5） = **70+ 组件**
- **Form 核心**：`<Form form={form} onFinish={handleFinish}>` + `<Form.Item name="email" rules={[...]}>` + `Form.useForm()` + `form.validateFields()`
- **Table 核心**：`<Table columns={columns} dataSource={data} rowKey="id">` —— **columns 是 JS 对象数组、用 render 函数自定义渲染**
- **反馈三件套**：`message`（顶部条） / `Modal`（中央对话框，Promise 风格） / `notification`（角落通知卡片） —— **v5 推荐用 `App.useApp()` 或 `useMessage()` Hook**
- **`<Drawer>`**：`open` + `onClose` + `placement="right/left/top/bottom"`
- **`<Modal>`**：`open` + `onOk` + `onCancel` + `title` + `footer`
- **暗色**：`<ConfigProvider theme=` + 双花括号包 `algorithm: theme.darkAlgorithm`
- **紧凑**：`algorithm: theme.compactAlgorithm`
- **暗色 + 紧凑**：`algorithm: [theme.darkAlgorithm, theme.compactAlgorithm]`
- **主题对象**：`<ConfigProvider theme=` + 双花括号包 `token` 对象
- **i18n**：`<ConfigProvider locale={zhCN}>` + `dayjs.locale('zh-cn')`
- **Next.js App Router**：`<AntdRegistry>` 包 `layout.tsx`
- **SSR**：用 `@ant-design/cssinjs` 的 `<StyleProvider cache>` + `extractStyle(cache)`
- **Pro Components**：`@ant-design/pro-components` 提供 ProForm / ProTable / ProLayout
- **必须**：`<ConfigProvider>` 包根，否则主题 / locale 全部不生效

## 70+ 组件分类速览

Ant Design 把所有组件分为 **7 大类**——熟悉分类有助于快速找到合适的组件：

### General（通用，4）

通用基础组件——按钮、图标、文字、悬浮按钮：

| 组件 | 用途 |
|---|---|
| Button | 按钮（type / size / shape / icon / loading / danger / ghost / block / variant） |
| FloatButton | 悬浮按钮 / 回到顶部 / 多功能浮窗（替代 v4 的 BackTop） |
| Icon | 图标体系（配合 `@ant-design/icons`） |
| Typography | 排版（Typography.Title / Text / Paragraph / Link） |

### Layout（布局，7）

页面布局容器：

| 组件 | 用途 |
|---|---|
| Divider | 分割线 |
| Flex | Flex 布局（v5.10+） |
| Grid | 24 栅格（Row / Col） |
| Layout | 后台典型布局（Header / Sider / Content / Footer） |
| Masonry | 瀑布流（v6.x+） |
| Space | 间距控制 |
| Splitter | 可拖拽分隔面板（v5.21+） |

### Navigation（导航，7）

页面导航组件：

| 组件 | 用途 |
|---|---|
| Anchor | 锚点 |
| Breadcrumb | 面包屑 |
| Dropdown | 下拉菜单 |
| Menu | 导航菜单（horizontal / vertical / inline） |
| Pagination | 分页 |
| Steps | 步骤条 |
| Tabs | 标签页 |

### Data Entry（数据输入，18）

表单输入控件——所有输入类组件：

| 组件 | 用途 |
|---|---|
| AutoComplete | 自动补全 |
| Cascader | 级联选择 |
| Checkbox | 复选框 + CheckboxGroup |
| ColorPicker | 颜色选择（v5.5+） |
| DatePicker | 日期（date / range / month / year / quarter / week） |
| Form | 表单 + 校验（Form.Item / Form.List） |
| Input | 输入框（Input.Password / Input.TextArea / Input.Search / Input.OTP v5.13+） |
| InputNumber | 数字输入 |
| Mentions | @ 提及 |
| Radio | 单选 + RadioGroup + Radio.Button |
| Rate | 评分 |
| Select | 下拉选择（含虚拟滚动，无 v2 之分） |
| Slider | 滑块 |
| Switch | 开关 |
| TimePicker | 时间选择 |
| Transfer | 穿梭框 |
| TreeSelect | 树形下拉 |
| Upload | 文件上传 |

### Data Display（数据展示，20）

只读 / 展示型组件：

| 组件 | 用途 |
|---|---|
| Avatar | 头像 + AvatarGroup |
| Badge | 徽标数 |
| Calendar | 日历 |
| Card | 卡片 |
| Carousel | 走马灯 |
| Collapse | 折叠面板 |
| Descriptions | 描述列表 |
| Empty | 空状态 |
| Image | 图片（懒加载 + 预览） |
| List | 列表 |
| Popover | 弹出气泡 |
| QRCode | 二维码（v5.1+） |
| Segmented | 分段控件 |
| Statistic | 统计数值 |
| Table | **表格**（v5.9+ 内置虚拟滚动） |
| Tag | 标签 + CheckableTag |
| Timeline | 时间线 |
| Tooltip | 文字提示 |
| Tour | 引导（v5.0+） |
| Tree | 树（含 DirectoryTree） |

### Feedback（反馈，11）

用户反馈组件：

| 组件 | 用途 |
|---|---|
| Alert | 警告提示条 |
| Drawer | 抽屉（4 个 placement） |
| Message | 顶部消息条（API： `message.success/error/...` + `useMessage()`） |
| Modal | 模态对话框（API： `<Modal>` 组件 + `Modal.confirm/info/...` + `useModal()`） |
| Notification | 角落通知卡片（API： `notification.success/...` + `useNotification()`） |
| Popconfirm | 气泡确认框 |
| Progress | 进度条（line / circle / dashboard） |
| Result | 结果页（success / error / 404 / 403 / 500） |
| Skeleton | 骨架屏 |
| Spin | 加载中包裹器 |
| Watermark | 水印 |

### Other（其他，5）

| 组件 | 用途 |
|---|---|
| Affix | 固钉（滚动时固定位置） |
| App | **必须**：包根 + 提供 message / modal / notification Context |
| BorderBeam | 边框光束动效（v6.x+） |
| ConfigProvider | **必须**：全局配置（theme / locale / componentSize 等） |
| Util | 内部工具（不直接使用） |

## Form 表单深度

Form 是 Ant Design 最复杂、最高频使用的组件——配合 [async-validator](https://github.com/yiminghe/async-validator) + Form.useForm Hook 实现强大的表单校验：

### 基础用法

```tsx
import { Button, Form, Input, App } from 'antd'

interface FormValues {
  name: string
  email: string
}

function MyForm() {
  const { message } = App.useApp()
  const [form] = Form.useForm<FormValues>()

  const handleFinish = (values: FormValues) => {
    message.success(`提交：${values.name} - ${values.email}`)
  }

  const handleReset = () => {
    form.resetFields()
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      initialValues={{ name: '', email: '' }}
    >
      <Form.Item
        label="姓名"
        name="name"
        rules={[
          { required: true, message: '请输入姓名' },
          { min: 2, max: 20, message: '长度在 2 到 20 之间' },
        ]}
      >
        <Input placeholder="请输入姓名" />
      </Form.Item>

      <Form.Item
        label="邮箱"
        name="email"
        rules={[
          { required: true, message: '请输入邮箱' },
          { type: 'email', message: '邮箱格式不正确' },
        ]}
      >
        <Input placeholder="请输入邮箱" />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit">提交</Button>
        <Button onClick={handleReset} style={{ marginLeft: 8 }}>重置</Button>
      </Form.Item>
    </Form>
  )
}
```

> **三个关键关联**：
>
> 1. `form={form}` → 表单实例（`Form.useForm()` 创建）
> 2. `<Form.Item name="name">` → **Ant Design 用 `name`（不是 `prop` 也不是 `path`！）**——字段路径
> 3. `onFinish` → 校验通过后回调（**自动收集 form values**，不需要手动 getFieldsValue）

### Form 与其他 UI 库对比

| 特性 | Ant Design | Element Plus | Naive UI |
|---|---|---|---|
| 字段路径属性 | **`name`** | `prop` | `path` |
| 数据双向绑定 | **不需要 v-model**（自动注入 value/onChange） | `v-model` | `v-model:value` |
| Form 实例 | `Form.useForm()` 返回 `[form]` | `formRef.value` | `formRef.value` |
| 重置方法 | `form.resetFields()` | `formRef.resetFields()` | 手动清 model |
| 校验签名 | `form.validateFields()` Promise | `validate()` Promise / callback | `validate()` callback |

> **关键差异**：Ant Design 的 Form 是**数据驱动而非 ref 驱动**——`Form.Item` 自动注入 `value` + `onChange`，**不需要 React state**，所有数据通过 `form.getFieldsValue()` / `onFinish` 拿到。

### Form.useForm Hook

```tsx
import { Form } from 'antd'

const [form] = Form.useForm()

// 实例方法（v5）
form.setFieldsValue({ name: '张三' })             // 批量设值
form.setFieldValue('email', 'a@b.com')           // 设单个字段
form.getFieldsValue()                             // 获取全部
form.getFieldsValue(['name', 'email'])           // 获取指定字段
form.getFieldValue('name')                       // 获取单个
form.validateFields()                             // 校验全部（Promise）
form.validateFields(['email'])                   // 校验指定字段
form.resetFields()                                // 重置（清值 + 清状态）
form.resetFields(['email'])                      // 重置指定字段
form.submit()                                     // 程序触发 submit
form.isFieldTouched('name')                      // 是否被修改
form.getFieldsError(['name'])                    // 获取错误
form.scrollToField('email')                      // 滚动到指定字段（出错时常用）
```

### 校验规则（async-validator）

Ant Design Form 基于 [async-validator](https://github.com/yiminghe/async-validator)（与 Element Plus / Naive UI 同库）：

```tsx
<Form.Item
  name="email"
  rules={[
    { required: true, message: '请输入邮箱' },
    { type: 'email', message: '邮箱格式不正确' },
    { min: 6, max: 50, message: '长度在 6 到 50 之间' },
    { pattern: /^[a-zA-Z0-9]+$/, message: '只能是字母数字' },
    {
      validator: async (_, value) => {
        // 自定义校验（异步）
        if (!value) return Promise.resolve()
        const exists = await checkEmailExists(value)
        if (exists) {
          return Promise.reject(new Error('邮箱已被注册'))
        }
        return Promise.resolve()
      },
    },
  ]}
>
  <Input />
</Form.Item>
```

### 校验时机（validateTrigger）

```tsx
<Form.Item
  name="email"
  validateTrigger={['onBlur', 'onChange']}        // 默认：onChange
  rules={[{ required: true }]}
>
  <Input />
</Form.Item>

<Form
  form={form}
  validateTrigger="onBlur"                        // Form 级别默认
>
```

### 嵌套对象校验（name 用数组路径）

```tsx
<Form>
  <Form.Item label="街道" name={['address', 'street']} rules={[{ required: true }]}>
    <Input />
  </Form.Item>

  <Form.Item label="城市" name={['address', 'city']} rules={[{ required: true }]}>
    <Input />
  </Form.Item>
</Form>
```

> **关键**：Ant Design 用**数组路径** `name={['address', 'street']}`（而非字符串路径 `'address.street'`）—— 这与 Element Plus / Naive UI 不同。

### 动态字段（Form.List）

```tsx
import { Button, Form, Input, Space } from 'antd'
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'

function DynamicForm() {
  return (
    <Form name="dynamic" onFinish={(values) => console.log(values)}>
      <Form.List name="users">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...restField }) => (
              <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                <Form.Item
                  {...restField}
                  name={[name, 'firstName']}
                  rules={[{ required: true, message: '请输入名' }]}
                >
                  <Input placeholder="名" />
                </Form.Item>
                <Form.Item
                  {...restField}
                  name={[name, 'lastName']}
                  rules={[{ required: true, message: '请输入姓' }]}
                >
                  <Input placeholder="姓" />
                </Form.Item>
                <MinusCircleOutlined onClick={() => remove(name)} />
              </Space>
            ))}
            <Form.Item>
              <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} block>
                新增
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>

      <Form.Item>
        <Button type="primary" htmlType="submit">提交</Button>
      </Form.Item>
    </Form>
  )
}
```

> **Form.List 的 render prop 签名**：`(fields, { add, remove, move }) => ReactNode`。
> `fields` 数组中每个 field 含 `key` / `name` / `fieldKey`（v5 已废弃 fieldKey、自动用 name） —— **不要把 name 当 React key**，用 `field.key`。

### 字段依赖 dependencies

```tsx
<Form.Item label="密码" name="password" rules={[{ required: true }]}>
  <Input.Password />
</Form.Item>

<Form.Item
  label="确认密码"
  name="confirm"
  dependencies={['password']}                     // 依赖 password 字段
  rules={[
    { required: true, message: '请确认密码' },
    ({ getFieldValue }) => ({
      validator(_, value) {
        if (!value || getFieldValue('password') === value) {
          return Promise.resolve()
        }
        return Promise.reject(new Error('两次密码不一致'))
      },
    }),
  ]}
>
  <Input.Password />
</Form.Item>
```

> **`dependencies` 让 confirm 字段在 password 改变时重新校验**——这是 Ant Design Form 的独特设计。

### Form.useWatch（响应式监听字段）

```tsx
import { Form, Input } from 'antd'

function MyForm() {
  const [form] = Form.useForm()
  const username = Form.useWatch('username', form)  // 响应式监听字段

  return (
    <Form form={form}>
      <Form.Item name="username">
        <Input />
      </Form.Item>
      <div>当前输入：{username}</div>
    </Form>
  )
}
```

> **`Form.useWatch` 是 React Hook**——返回值是响应式的，字段改变时组件重新渲染。

### shouldUpdate（更细粒度的依赖）

```tsx
<Form.Item
  shouldUpdate={(prev, cur) => prev.type !== cur.type}
>
  {({ getFieldValue }) => {
    const type = getFieldValue('type')
    return type === 'a' ? <InputForTypeA /> : <InputForTypeB />
  }}
</Form.Item>
```

> **`shouldUpdate` + render prop 是动态字段的常用模式**——根据其他字段值条件渲染。

### Form 布局

```tsx
<Form
  layout="horizontal"                              // 默认：标签 + 输入框水平
  labelCol={{ span: 6 }}                           // 标签占 6 格
  wrapperCol={{ span: 18 }}                        // 输入框占 18 格
>

<Form layout="vertical">                            // 标签在上、输入框在下
<Form layout="inline">                              // 行内（搜索栏常用）
```

### 提交按钮 loading

```tsx
function MyForm() {
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const handleFinish = async (values) => {
    setLoading(true)
    try {
      await api.submit(values)
      message.success('提交成功')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form form={form} onFinish={handleFinish}>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          {loading ? '提交中...' : '提交'}
        </Button>
      </Form.Item>
    </Form>
  )
}
```

## Table 表格深度

Table 是 Ant Design 最重要的数据展示组件——支持排序 / 筛选 / 多选 / 树形 / 固定列 / 虚拟滚动（v5.9+）。

### 基础用法

```tsx
import { Table, Tag, Space } from 'antd'
import type { TableColumnsType, TableProps } from 'antd'

interface User {
  id: number
  name: string
  age: number
  status: 'active' | 'inactive'
  tags: string[]
}

const columns: TableColumnsType<User> = [
  {
    title: '姓名',
    dataIndex: 'name',
    key: 'name',
    render: (text) => <a>{text}</a>,
  },
  {
    title: '年龄',
    dataIndex: 'age',
    key: 'age',
    sorter: (a, b) => a.age - b.age,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    render: (status) => (
      <Tag color={status === 'active' ? 'green' : 'red'}>
        {status === 'active' ? '启用' : '禁用'}
      </Tag>
    ),
    filters: [
      { text: '启用', value: 'active' },
      { text: '禁用', value: 'inactive' },
    ],
    onFilter: (value, record) => record.status === value,
  },
  {
    title: '标签',
    dataIndex: 'tags',
    key: 'tags',
    render: (tags: string[]) => (
      <>
        {tags.map(tag => <Tag key={tag} color="blue">{tag}</Tag>)}
      </>
    ),
  },
  {
    title: '操作',
    key: 'action',
    render: (_, record) => (
      <Space size="middle">
        <a onClick={() => handleEdit(record)}>编辑</a>
        <a onClick={() => handleDelete(record)}>删除</a>
      </Space>
    ),
  },
]

const data: User[] = [
  { id: 1, name: '张三', age: 25, status: 'active', tags: ['前端', 'Vue'] },
  { id: 2, name: '李四', age: 30, status: 'inactive', tags: ['后端'] },
]

function MyTable() {
  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="id"
      pagination={{ pageSize: 10 }}
      bordered
    />
  )
}
```

> **核心理念**：columns 是 **JS 对象数组**——每列的 `render` 函数返回 JSX（不是 Vue 那种 template）。**好处是 TS 类型推导完整、列定义可以动态生成、render 直接写 JSX 比 Vue 的 h() 函数更自然**。

### 列定义结构（ColumnsType）

```ts
interface ColumnType<T> {
  title?: ReactNode | RenderedCell                 // 列标题
  dataIndex?: string | string[]                    // 字段路径
  key?: string                                     // 唯一 key（必需）
  width?: string | number                          // 列宽
  minWidth?: number
  fixed?: 'left' | 'right' | boolean               // 固定列
  align?: 'left' | 'center' | 'right'
  ellipsis?: boolean | { showTitle?: boolean }     // 溢出省略
  render?: (value, record, index) => ReactNode    // 自定义渲染
  sorter?: boolean | Function | { compare, multiple }   // 排序
  defaultSortOrder?: 'ascend' | 'descend'
  filters?: { text, value }[]                      // 筛选选项
  onFilter?: (value, record) => boolean
  filterMode?: 'menu' | 'tree'                     // v4.17+
  filterSearch?: boolean | Function
  filteredValue?: any[]                            // 受控筛选值
  className?: string
  colSpan?: number
  rowScope?: 'row' | 'rowgroup'
  children?: ColumnType[]                          // 表头分组
}
```

### 排序

`sorter: true` 触发事件（后端排序）；`sorter: (a, b) => ...` 本地排序：

```tsx
const columns: TableColumnsType<User> = [
  // 本地排序（默认）
  { title: '年龄', dataIndex: 'age', sorter: (a, b) => a.age - b.age },

  // 多列排序（带 multiple 优先级）
  { title: '姓名', dataIndex: 'name', sorter: { compare: (a, b) => a.name.localeCompare(b.name), multiple: 2 } },
  { title: '年龄', dataIndex: 'age', sorter: { compare: (a, b) => a.age - b.age, multiple: 1 } },

  // 后端排序（监听 onChange）
  { title: '热度', dataIndex: 'hot', sorter: true },
]

const handleTableChange: TableProps<User>['onChange'] = (pagination, filters, sorter) => {
  console.log(sorter)                              // { field, order: 'ascend' | 'descend' }
  // 请求后端...
}

<Table columns={columns} dataSource={data} onChange={handleTableChange} />
```

### 筛选

```tsx
const columns: TableColumnsType<User> = [
  {
    title: '状态',
    dataIndex: 'status',
    filters: [
      { text: '启用', value: 'active' },
      { text: '禁用', value: 'inactive' },
    ],
    onFilter: (value, record) => record.status === value,    // 本地筛选
    filterMode: 'menu',                                       // 'menu' | 'tree'
    filterSearch: true,                                       // 筛选项搜索
  },
  {
    // 后端筛选：用 filteredValue 受控
    title: '类型',
    dataIndex: 'type',
    filters: [{ text: 'A', value: 'a' }, { text: 'B', value: 'b' }],
    filteredValue: filterTypes,                              // 受控
    // 不传 onFilter，监听 table 的 onChange
  },
]
```

### 多选 rowSelection

```tsx
const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

const rowSelection: TableProps<User>['rowSelection'] = {
  selectedRowKeys,
  onChange: (keys, rows) => {
    setSelectedRowKeys(keys)
    console.log('已选中：', rows)
  },
  getCheckboxProps: (record) => ({
    disabled: record.status === 'inactive',
    name: record.name,
  }),
}

<Table
  rowSelection={rowSelection}
  columns={columns}
  dataSource={data}
  rowKey="id"
/>
```

### 树形数据

```tsx
const data = [
  {
    id: 1,
    name: 'src/',
    children: [
      { id: 2, name: 'main.tsx' },
      { id: 3, name: 'App.tsx' },
    ],
  },
]

<Table
  columns={columns}
  dataSource={data}
  rowKey="id"
  expandable={{
    defaultExpandAllRows: true,
    indentSize: 20,
  }}
  // 自定义 children 字段名（默认 'children'）
  // childrenColumnName="kids"
/>
```

### 展开行（expandable.expandedRowRender）

```tsx
<Table
  columns={columns}
  dataSource={data}
  expandable={{
    expandedRowRender: (record) => (
      <p style={{ margin: 0 }}>{record.description}</p>
    ),
    rowExpandable: (record) => record.id !== 0,
  }}
/>
```

### 虚拟滚动（v5.9+）

数据量超 **1000 行** 时启用 `virtual` —— v5.9+ **与普通 Table 同 API、零迁移成本**（v4 时代要换 `react-virtualized` 自己集成）：

```tsx
<Table
  columns={columns}
  dataSource={bigData}                             // 10000 行
  virtual                                          // v5.9+
  scroll={{ x: 1500, y: 500 }}                     // 必须设 scroll
  pagination={false}
  rowKey="id"
/>
```

> **`virtual` 模式必须设 `scroll.y`**——容器高度由 scroll.y 决定。

### 固定列

```tsx
const columns: TableColumnsType<User> = [
  { title: '姓名', dataIndex: 'name', fixed: 'left', width: 100 },
  { title: '年龄', dataIndex: 'age', width: 100 },
  // ... 大量中间列
  { title: '字段 A', dataIndex: 'a', width: 150 },
  { title: '字段 B', dataIndex: 'b', width: 150 },
  // ... 20 列
  { title: '操作', key: 'action', fixed: 'right', width: 150, render: () => <a>编辑</a> },
]

<Table
  columns={columns}
  dataSource={data}
  scroll={{ x: 1500 }}                             // 必须设 x（总宽度）
/>
```

### 分页

```tsx
<Table
  columns={columns}
  dataSource={data}
  pagination={{
    current: page,
    pageSize: 10,
    total: 100,
    showSizeChanger: true,
    pageSizeOptions: [10, 20, 50, 100],
    showQuickJumper: true,
    showTotal: (total) => `共 ${total} 条`,
    onChange: (page, pageSize) => {
      setPage(page)
      setPageSize(pageSize)
    },
  }}
/>

{/* 关闭分页 */}
<Table pagination={false} />
```

### onChange 一次处理 pagination / filter / sorter

```tsx
const handleTableChange: TableProps<User>['onChange'] = (
  pagination,
  filters,
  sorter,
  extra,
) => {
  console.log('当前页：', pagination.current)
  console.log('每页条数：', pagination.pageSize)
  console.log('筛选：', filters)                    // { status: ['active'] }
  console.log('排序：', sorter)                     // { field: 'age', order: 'ascend' }
  console.log('action：', extra.action)             // 'paginate' | 'filter' | 'sort'
  // 重新请求后端...
}

<Table columns={columns} dataSource={data} onChange={handleTableChange} />
```

## 反馈三件套

Ant Design 的反馈 API **v5 推荐用 Hook 版本或 `<App>` 组件**——静态方法 `message.success(...)` 不消费 ConfigProvider 的主题 / locale。

### message（顶部消息条）

**方式 1：用 `<App>` 组件**（最推荐）：

```tsx
// App.tsx
import { App as AntApp, ConfigProvider } from 'antd'

const App = () => (
  <ConfigProvider theme={{...}} locale={zhCN}>
    <AntApp>
      <MyPage />
    </AntApp>
  </ConfigProvider>
)
```

```tsx
// MyPage.tsx
import { App, Button } from 'antd'

const MyPage = () => {
  const { message } = App.useApp()                  // ⭐ v5 推荐

  return (
    <>
      <Button onClick={() => message.success('保存成功')}>保存</Button>
      <Button onClick={() => message.error('保存失败')}>失败</Button>
      <Button onClick={() => message.warning('警告')}>警告</Button>
      <Button onClick={() => message.info('提示')}>提示</Button>
      <Button onClick={() => message.loading('加载中...')}>Loading</Button>
    </>
  )
}
```

**方式 2：用 `useMessage` Hook**：

```tsx
import { message, Button } from 'antd'

const MyPage = () => {
  const [messageApi, contextHolder] = message.useMessage()

  const handleClick = () => {
    messageApi.success('保存成功')
  }

  return (
    <>
      {contextHolder}                                {/* ⭐ 必须挂载 */}
      <Button onClick={handleClick}>保存</Button>
    </>
  )
}
```

**完整 options**：

```tsx
messageApi.success({
  content: '保存成功',
  duration: 3,                                      // 秒，0 = 不自动关闭
  key: 'unique-key',                                // 标识符（更新同 key 消息）
  onClose: () => console.log('已关闭'),
  icon: <SmileOutlined />,
  className: 'my-class',
  style: { marginTop: 20 },
})

// 更新已显示消息（用 key）
messageApi.loading({ content: '上传中', key: 'upload' })
setTimeout(() => {
  messageApi.success({ content: '上传完成', key: 'upload' })
}, 2000)

// 关闭全部
messageApi.destroy()
```

### Modal（中央对话框）

**Modal 有两种用法**：组件形式 `<Modal>` 和命令式 `Modal.confirm(...)`。

#### 组件形式 `<Modal>`

```tsx
import { Modal, Button } from 'antd'
import { useState } from 'react'

const MyPage = () => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>打开</Button>

      <Modal
        title="标题"
        open={open}
        onOk={() => {
          // 确认
          setOpen(false)
        }}
        onCancel={() => setOpen(false)}
        okText="确定"
        cancelText="取消"
        width={520}
        confirmLoading={false}
        destroyOnHidden                             // v5.25+ 关闭时销毁子组件
      >
        <p>对话框内容</p>
      </Modal>
    </>
  )
}
```

**自定义 footer**：

```tsx
<Modal
  open={open}
  title="标题"
  onCancel={() => setOpen(false)}
  footer={[
    <Button key="back" onClick={() => setOpen(false)}>返回</Button>,
    <Button key="submit" type="primary" onClick={handleSubmit}>
      提交
    </Button>,
  ]}
>
  内容
</Modal>

{/* 无 footer */}
<Modal footer={null} ... />
```

#### 命令式 `Modal.confirm` / `Modal.useModal`

```tsx
// v5 推荐：useModal Hook（消费 ConfigProvider 主题）
import { App } from 'antd'

const MyPage = () => {
  const { modal } = App.useApp()

  const handleDelete = () => {
    modal.confirm({
      title: '确认删除',
      content: '此操作不可恢复',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        await api.delete()
        // 返回 Promise，按钮自动 loading
      },
      onCancel: () => {
        console.log('已取消')
      },
    })
  }

  return <Button onClick={handleDelete}>删除</Button>
}
```

**其他类型**：

```tsx
modal.confirm({ title, content })                  // 确认
modal.info({ title, content })                     // 信息
modal.success({ title, content })                  // 成功
modal.error({ title, content })                    // 错误
modal.warning({ title, content })                  // 警告

// 关闭全部
Modal.destroyAll()
```

### notification（角落通知卡片）

```tsx
import { App, Button } from 'antd'

const MyPage = () => {
  const { notification } = App.useApp()

  return (
    <Button
      onClick={() =>
        notification.success({
          message: '操作成功',                       // 标题（v6 改为 title）
          description: '数据已保存到云端',          // 描述（**必需**）
          duration: 4.5,                            // 秒，0 = 不自动关闭
          placement: 'topRight',                    // 默认
          icon: <SmileOutlined style={{ color: '#108ee9' }} />,
          showProgress: true,                        // v5.20+ 显示进度条
          pauseOnHover: true,                       // 悬浮暂停
          btn: <Button type="primary">查看详情</Button>,
          onClose: () => console.log('已关闭'),
        })
      }
    >
      通知
    </Button>
  )
}
```

**placement 取值**：`topLeft` / `topRight`（默认） / `bottomLeft` / `bottomRight` / `top` / `bottom`。

### 三件套对比

| 维度 | message | Modal | notification |
|---|---|---|---|
| 位置 | 顶部 | 中央 | 角落 |
| 用途 | 简短反馈（保存成功） | 确认 / 表单 / 详情 | 较长通知（含描述） |
| 默认时长 | 3 秒 | 不自动关闭 | 4.5 秒 |
| 用户操作 | 无 | 确定 / 取消 | 可有按钮 |
| 适用场景 | 操作成功 / 失败 | 危险操作确认 | 后台任务完成通知 |

## Drawer 抽屉

```tsx
import { Drawer, Button } from 'antd'
import { useState } from 'react'

const MyDrawer = () => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>打开抽屉</Button>

      <Drawer
        title="详情"
        placement="right"                            // 'left' | 'right' | 'top' | 'bottom'
        size="default"                               // 'default' (378px) | 'large' (736px)
        open={open}
        onClose={() => setOpen(false)}
        extra={<Button type="primary">操作</Button>} // 头部右侧按钮
        footer={
          <Button type="primary" block onClick={handleSave}>
            保存
          </Button>
        }
        destroyOnHidden                              // 关闭时销毁子组件（v5.25+）
      >
        <p>抽屉内容</p>
      </Drawer>
    </>
  )
}
```

**placement 取值**：

| 值 | 方向 |
|---|---|
| `right` | 右抽屉（默认） |
| `left` | 左抽屉 |
| `top` | 上抽屉 |
| `bottom` | 下抽屉 |

## Select 下拉选择

```tsx
import { Select } from 'antd'

const options = [
  { value: 'jack', label: '杰克' },
  { value: 'lucy', label: '露西' },
  { value: 'tom', label: '汤姆', disabled: true },
]

<Select
  options={options}                                 // ⭐ 推荐用 options 而非 Select.Option
  defaultValue="jack"
  onChange={(value, option) => console.log(value, option)}
  style={{ width: 200 }}
  placeholder="请选择"
  allowClear
/>

{/* 多选 */}
<Select
  mode="multiple"
  options={options}
  placeholder="多选"
  maxCount={3}                                      // 限制最大选中数
/>

{/* 标签模式（自由输入） */}
<Select mode="tags" options={options} placeholder="标签" />

{/* 远程搜索 */}
<Select
  showSearch
  filterOption={false}                              // 关闭本地筛选
  onSearch={async (value) => {
    const results = await api.search(value)
    setOptions(results)
  }}
  options={remoteOptions}
  loading={loading}
/>

{/* 大数据虚拟滚动（v5 默认开启） */}
<Select
  options={bigOptions}                              // 10000 项
  virtual                                           // 默认 true，可关闭
  listHeight={256}                                  // 下拉框高度
/>
```

## ConfigProvider 全局配置

`<ConfigProvider>` 是 Ant Design 的**中央配置入口**——主题 / locale / 组件级 defaults 全部从这里注入。

### 完整选项

```tsx
import { ConfigProvider, theme } from 'antd'
import zhCN from 'antd/locale/zh_CN'

<ConfigProvider
  // 主题
  theme={{
    token: { colorPrimary: '#1677ff', borderRadius: 6 },
    algorithm: theme.darkAlgorithm,                 // 算法
    components: {                                    // 组件级 token
      Button: { colorPrimary: '#00b96b' },
      Form: { itemMarginBottom: 16 },
    },
  }}

  // 国际化
  locale={zhCN}
  direction="ltr"                                    // 'ltr' | 'rtl'

  // 全局组件大小
  componentSize="middle"                             // 'small' | 'middle' | 'large'
  componentDisabled={false}                          // 全局禁用所有组件

  // CSS 前缀
  prefixCls="ant"                                    // 默认 'ant'（生成 .ant-button 等）
  iconPrefixCls="anticon"

  // 弹层
  popupMatchSelectWidth={true}                       // Select 弹层宽度匹配
  popupOverflow="viewport"                           // 弹层定位策略
  getPopupContainer={(triggerNode) => triggerNode.parentElement || document.body}

  // 表单
  form={{
    validateMessages: {
      required: '${label} 是必填项',
      types: { email: '${label} 不是有效的邮箱' },
    },
  }}

  // 组件级 defaults
  button={{ classNames: { ... }, styles: { ... } }}
  input={{ classNames: { ... } }}
  // ... 40+ 组件
>
  <YourApp />
</ConfigProvider>
```

### 嵌套 ConfigProvider（多区域不同主题）

```tsx
<ConfigProvider theme={{ algorithm: theme.defaultAlgorithm }}>
  {/* 整体浅色 */}
  <Header />
  <Content />

  <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
    {/* 只有 Footer 是暗色 */}
    <Footer />
  </ConfigProvider>
</ConfigProvider>
```

> **子 ConfigProvider 自动继承父 Provider 的未覆盖配置**——只需声明差异部分。

### componentSize 全局尺寸

```tsx
<ConfigProvider componentSize="large">
  <Form>
    <Form.Item label="姓名" name="name">
      <Input />                                      {/* large 尺寸 */}
    </Form.Item>
    <Button>提交</Button>                            {/* large 尺寸 */}
  </Form>
</ConfigProvider>
```

## Design Token 深度

Ant Design 5.x **Design Token 三层架构** 是主题系统的核心创新——理解三层结构是定制主题的关键。

### 三层结构

```
Seed Token   →  Map Token       →  Alias Token
（原子值）    （自动派生）        （语义别名）
colorPrimary →  colorPrimaryBg   →  colorBgContainer
              colorPrimaryHover     colorBgLayout
              colorPrimaryActive    colorBorder
              colorPrimaryText      ...
```

### Seed Token（原子值，~12 个）

```tsx
<ConfigProvider
  theme={{
    token: {
      // 颜色 Seed
      colorPrimary: '#1677ff',                      // 主色
      colorSuccess: '#52c41a',                      // 成功色
      colorWarning: '#faad14',                      // 警告色
      colorError: '#ff4d4f',                        // 错误色
      colorInfo: '#1677ff',                         // 信息色
      colorTextBase: '#000',                        // 基础文字色
      colorBgBase: '#fff',                          // 基础背景色

      // 字体 Seed
      fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
      fontSize: 14,

      // 圆角 Seed
      borderRadius: 6,

      // 控件 Seed
      sizeUnit: 4,                                  // 间距单位（margin/padding 基于此）
      sizeStep: 4,
      wireframe: false,                             // 线框模式（边框 + 无阴影）
      motion: true,                                 // 是否开启动效
    },
  }}
>
```

### Map Token（自动派生）

**Seed Token 通过算法自动派生出 Map Token**——开发者通常不需要直接改 Map Token，但可以覆盖：

```tsx
<ConfigProvider
  theme={{
    token: {
      colorPrimary: '#1677ff',
      // 派生的 Map Token（一般不手动设、由算法自动算）
      colorPrimaryBg: '#e6f4ff',                    // 主色的浅背景
      colorPrimaryBgHover: '#bae0ff',
      colorPrimaryHover: '#4096ff',
      colorPrimaryActive: '#0958d9',
      colorPrimaryText: '#1677ff',
      colorPrimaryBorder: '#91caff',
    },
  }}
>
```

### Alias Token（语义别名）

**Alias Token 是组件内部使用的语义化变量**——定制时通常改这一层：

```tsx
<ConfigProvider
  theme={{
    token: {
      // Alias Token（语义化）
      colorBgContainer: '#ffffff',                  // 卡片 / 弹层等容器背景
      colorBgLayout: '#f5f5f5',                     // 页面背景
      colorBgElevated: '#ffffff',                   // 浮层背景
      colorBgMask: 'rgba(0, 0, 0, 0.45)',           // 遮罩
      colorBgSpotlight: 'rgba(0, 0, 0, 0.85)',      // Tooltip 等

      colorBorder: '#d9d9d9',
      colorBorderSecondary: '#f0f0f0',

      colorText: 'rgba(0, 0, 0, 0.88)',             // 一级文字
      colorTextSecondary: 'rgba(0, 0, 0, 0.65)',    // 二级文字
      colorTextTertiary: 'rgba(0, 0, 0, 0.45)',     // 三级文字
      colorTextQuaternary: 'rgba(0, 0, 0, 0.25)',   // 四级文字（disabled）

      // 控件高度
      controlHeight: 32,                            // 默认（middle）
      controlHeightLG: 40,
      controlHeightSM: 24,
      controlHeightXS: 16,
    },
  }}
>
```

### 组件级 Token（`components` prop）

```tsx
<ConfigProvider
  theme={{
    token: {
      colorPrimary: '#1677ff',
    },
    components: {
      Button: {
        colorPrimary: '#00b96b',                    // 只改 Button 的主色
        algorithm: true,                             // 同时派生其他 token
        primaryShadow: '0 2px 0 rgba(0, 0, 0, 0.1)',
      },
      Form: {
        itemMarginBottom: 16,
        verticalLabelPadding: '0 0 4px',
        labelFontSize: 14,
      },
      Table: {
        headerBg: '#fafafa',
        rowHoverBg: '#f5f5f5',
        borderColor: '#f0f0f0',
      },
      Input: {
        activeBorderColor: '#1677ff',
        hoverBorderColor: '#4096ff',
      },
      Menu: {
        itemHeight: 40,
        subMenuItemBg: '#f5f5f5',
      },
    },
  }}
>
```

> **`components.X.algorithm: true`** 让组件 token 也走 algorithm 算法派生——一般保持开启。

### 在组件中消费 Token（useToken Hook）

```tsx
import { theme } from 'antd'

const { useToken } = theme

function MyComponent() {
  const { token } = useToken()                      // ⭐ Hook 获取当前主题 token

  return (
    <div
      style={{
        color: token.colorPrimary,
        backgroundColor: token.colorBgContainer,
        borderRadius: token.borderRadius,
        padding: token.paddingMD,
      }}
    >
      自定义元素
    </div>
  )
}
```

### algorithm 算法系统

Ant Design 提供 **3 个内置算法**——可单独用、可组合：

```tsx
import { ConfigProvider, theme } from 'antd'

// 默认浅色
<ConfigProvider theme={{ algorithm: theme.defaultAlgorithm }}>

// 暗色
<ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>

// 紧凑
<ConfigProvider theme={{ algorithm: theme.compactAlgorithm }}>

// ⭐ 组合：暗色 + 紧凑
<ConfigProvider theme={{
  algorithm: [theme.darkAlgorithm, theme.compactAlgorithm],
}}>
```

> **算法本质是 Seed Token → Map Token 的派生函数**——`darkAlgorithm` 让派生的颜色 token 变暗，`compactAlgorithm` 让派生的尺寸 token 变小。

### 动态切换主题（用户选择）

```tsx
import { useState } from 'react'
import { ConfigProvider, theme, Select } from 'antd'

function App() {
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'compact'>('light')

  const algorithm = {
    light: theme.defaultAlgorithm,
    dark: theme.darkAlgorithm,
    compact: theme.compactAlgorithm,
  }[themeMode]

  return (
    <ConfigProvider theme={{ algorithm }}>
      <Select
        value={themeMode}
        onChange={setThemeMode}
        options={[
          { value: 'light', label: '浅色' },
          { value: 'dark', label: '暗色' },
          { value: 'compact', label: '紧凑' },
        ]}
      />
      <YourApp />
    </ConfigProvider>
  )
}
```

### 多品牌主题切换器

```tsx
import { useState } from 'react'
import { ConfigProvider } from 'antd'

const themes = {
  blue: { colorPrimary: '#1677ff', borderRadius: 6 },
  green: { colorPrimary: '#00b96b', borderRadius: 6 },
  red: { colorPrimary: '#ff4d4f', borderRadius: 8 },
  purple: { colorPrimary: '#722ed1', borderRadius: 12 },
}

function App() {
  const [brand, setBrand] = useState<'blue' | 'green' | 'red' | 'purple'>('blue')

  return (
    <ConfigProvider theme={{ token: themes[brand] }}>
      <YourApp />
    </ConfigProvider>
  )
}
```

> **运行时切换零编译**——cssinjs 自动重新生成 CSS。

## Pro Components 中后台二次封装

[`@ant-design/pro-components`](https://procomponents.ant.design/) 是 antd 之上的**中后台二次封装**——蚂蚁官方 `ant-design-pro` 模板的基石。

### 安装

```bash
pnpm add @ant-design/pro-components
```

### ProForm（增强表单）

```tsx
import { ProForm, ProFormText, ProFormSelect, ProFormDatePicker } from '@ant-design/pro-components'

function MyProForm() {
  return (
    <ProForm
      onFinish={async (values) => {
        await api.submit(values)
        message.success('提交成功')
      }}
      submitter={{
        searchConfig: { submitText: '提交', resetText: '重置' },
      }}
    >
      <ProFormText
        name="username"
        label="用户名"
        rules={[{ required: true }]}
        placeholder="请输入用户名"
      />
      <ProFormSelect
        name="role"
        label="角色"
        options={[
          { label: '管理员', value: 'admin' },
          { label: '用户', value: 'user' },
        ]}
      />
      <ProFormDatePicker name="birthday" label="生日" />
    </ProForm>
  )
}
```

> **ProForm 自动处理 layout + 提交按钮 + loading + 校验** —— 比裸 Form 减少 ~50% 模板代码。

### ProTable（增强表格）

```tsx
import { ProTable } from '@ant-design/pro-components'
import type { ProColumns } from '@ant-design/pro-components'

interface User {
  id: number
  name: string
  status: 'active' | 'inactive'
}

const columns: ProColumns<User> = [
  { title: '姓名', dataIndex: 'name', formItemProps: { rules: [{ required: true }] } },
  {
    title: '状态',
    dataIndex: 'status',
    valueEnum: {
      active: { text: '启用', status: 'Success' },
      inactive: { text: '禁用', status: 'Error' },
    },
  },
  {
    title: '操作',
    valueType: 'option',
    render: (_, record) => [
      <a key="edit">编辑</a>,
      <a key="delete">删除</a>,
    ],
  },
]

function MyProTable() {
  return (
    <ProTable<User>
      columns={columns}
      request={async (params) => {
        // params 包含 current / pageSize / 搜索条件
        const { data, total } = await api.list(params)
        return { data, success: true, total }
      }}
      rowKey="id"
      search={{ labelWidth: 'auto' }}                {/* 自动生成搜索栏 */}
      toolBarRender={() => [
        <Button key="add" type="primary">新增</Button>,
      ]}
    />
  )
}
```

> **ProTable 自带搜索栏 + 列设置 + 工具栏 + 分页 + 加载状态** —— 中后台表格利器。

### ProLayout（中后台布局）

```tsx
import { ProLayout } from '@ant-design/pro-components'

function App() {
  return (
    <ProLayout
      title="管理后台"
      logo="/logo.svg"
      menuDataRender={() => [
        { path: '/', name: '首页', icon: 'HomeOutlined' },
        { path: '/users', name: '用户管理', icon: 'UserOutlined' },
      ]}
      menuItemRender={(item, dom) => (
        <Link to={item.path}>{dom}</Link>
      )}
    >
      <Outlet />
    </ProLayout>
  )
}
```

> **ProLayout 提供完整的中后台 Shell**：顶栏 + 侧边菜单 + 面包屑 + 用户中心 + 折叠 + 多 Tab —— **零配置即可达到 ant-design-pro 模板效果**。

详细见 [ProComponents 官网](https://procomponents.ant.design/)。

## Next.js App Router 集成深度

### 基础集成

```bash
pnpm add antd @ant-design/icons @ant-design/nextjs-registry
```

```tsx
// app/layout.tsx
import { AntdRegistry } from '@ant-design/nextjs-registry'
import { ConfigProvider, App as AntApp } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

dayjs.locale('zh-cn')

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <AntdRegistry>
          <ConfigProvider locale={zhCN} theme={{ token: { colorPrimary: '#1677ff' } }}>
            <AntApp>{children}</AntApp>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  )
}
```

### Client Component vs Server Component

Ant Design 组件**只能在 Client Component**（`'use client'` 头部）中使用：

```tsx
// ❌ Server Component（默认）：不能用 antd 组件
// app/page.tsx
import { Button } from 'antd'
export default function HomePage() {
  return <Button>按钮</Button>                       // ❌ 报错
}
```

```tsx
// ✅ Client Component
// app/page.tsx
'use client'
import { Button } from 'antd'
export default function HomePage() {
  return <Button>按钮</Button>                       // ✅ 正常
}
```

### App Router 已知限制

**1. `Select.Option` 等子组件不支持**：

```tsx
// ❌ App Router 中 Select.Option 不工作
<Select>
  <Select.Option value="1">A</Select.Option>
</Select>

// ✅ 改用 options 数组
<Select options={[{ value: '1', label: 'A' }]} />

// 或在 'use client' 文件内解构
'use client'
import { Select } from 'antd'
const { Option } = Select
<Select>
  <Option value="1">A</Option>
</Select>
```

**2. `<Typography.Text>` 类似限制**：

```tsx
// ❌
<Typography.Text>文字</Typography.Text>

// ✅ 直接 import 子组件
import { Typography } from 'antd'
const { Text } = Typography
<Text>文字</Text>
```

### 主题持久化（避免闪烁）

App Router 的默认 SSR 会**先渲染浅色再切到暗色**——用 cookies + middleware 在服务端就确定主题：

```tsx
// app/layout.tsx
import { cookies } from 'next/headers'
import { ConfigProvider, theme } from 'antd'

export default async function RootLayout({ children }) {
  const cookieStore = await cookies()
  const themeMode = cookieStore.get('theme')?.value || 'light'

  return (
    <html lang="zh-CN">
      <body>
        <AntdRegistry>
          <ConfigProvider
            theme={{
              algorithm: themeMode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
            }}
          >
            {children}
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  )
}
```

## SSR / cssinjs 完整方案

### Vite SSR / 自定义 Node 服务器

```tsx
// server.tsx（Node 服务器入口）
import { renderToString } from 'react-dom/server'
import { createCache, StyleProvider, extractStyle } from '@ant-design/cssinjs'
import App from './App'

async function render() {
  const cache = createCache()

  const html = renderToString(
    <StyleProvider cache={cache}>
      <App />
    </StyleProvider>,
  )

  // 收集所有 cssinjs 样式
  const cssText = extractStyle(cache)

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style id="antd-css">${cssText}</style>
      </head>
      <body>
        <div id="root">${html}</div>
        <script src="/client.js"></script>
      </body>
    </html>
  `
}
```

### 客户端 Hydrate

```tsx
// client.tsx
import { hydrateRoot } from 'react-dom/client'
import { StyleProvider } from '@ant-design/cssinjs'
import App from './App'

hydrateRoot(
  document.getElementById('root')!,
  <StyleProvider>                                    {/* 客户端复用同一个 Provider */}
    <App />
  </StyleProvider>,
)
```

> **`<StyleProvider>` + `extractStyle(cache)` 是 Ant Design SSR 的核心**——服务端收集 cssinjs 样式注入 HTML head，客户端 hydrate 时不再重复生成 CSS、保持样式一致。

### Static 模式（v6.0+ Zero Runtime）

v6.0+ 引入 **Zero Runtime 模式**——**预生成静态 CSS**、彻底告别运行时 cssinjs 性能开销：

```tsx
// 启用 Static 模式
import { StyleProvider } from '@ant-design/cssinjs'

<StyleProvider hashPriority="high" cache={cache} ssrInline>
  <App />
</StyleProvider>
```

详细见 [SSR 文档](https://ant.design/docs/react/server-side-rendering-cn)。

## 与 React Router + Zustand 集成

### Menu + Router

```tsx
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Layout, Menu } from 'antd'
import { HomeOutlined, UserOutlined, SettingOutlined } from '@ant-design/icons'
import { useMemo } from 'react'

const { Header, Sider, Content } = Layout

function RootLayout() {
  const location = useLocation()

  const menuItems = useMemo(
    () => [
      {
        key: '/',
        icon: <HomeOutlined />,
        label: <Link to="/">首页</Link>,
      },
      {
        key: 'system',
        icon: <SettingOutlined />,
        label: '系统管理',
        children: [
          {
            key: '/users',
            icon: <UserOutlined />,
            label: <Link to="/users">用户</Link>,
          },
          {
            key: '/roles',
            label: <Link to="/roles">角色</Link>,
          },
        ],
      },
    ],
    [],
  )

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider>
        <div style={{ height: 32, margin: 16, background: 'rgba(255,255,255,0.3)' }}>
          管理后台
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header />
        <Content>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
```

### Breadcrumb 自动生成

```tsx
import { Breadcrumb } from 'antd'
import { useLocation, Link } from 'react-router-dom'

function AutoBreadcrumb() {
  const location = useLocation()
  const segments = location.pathname.split('/').filter(Boolean)

  const items = [
    { title: <Link to="/">首页</Link> },
    ...segments.map((seg, i) => ({
      title: i === segments.length - 1
        ? seg
        : <Link to={`/${segments.slice(0, i + 1).join('/')}`}>{seg}</Link>,
    })),
  ]

  return <Breadcrumb items={items} />
}
```

### Zustand 持久化主题

```tsx
// stores/theme.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ThemeStore {
  mode: 'light' | 'dark'
  toggle: () => void
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      mode: 'light',
      toggle: () => set((s) => ({ mode: s.mode === 'light' ? 'dark' : 'light' })),
    }),
    { name: 'theme-storage' },
  ),
)
```

```tsx
// App.tsx
import { ConfigProvider, theme } from 'antd'
import { useThemeStore } from './stores/theme'

function App() {
  const mode = useThemeStore((s) => s.mode)

  return (
    <ConfigProvider
      theme={{
        algorithm: mode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <YourApp />
    </ConfigProvider>
  )
}
```

## 常见踩坑

### 1. 静态 `message.success(...)` 不消费 ConfigProvider 主题

**原因**：`message.success` / `Modal.confirm` / `notification.open` 是渲染在独立 React 树中的静态方法——**不在 ConfigProvider 的 Context 内**。

**症状**：

- ConfigProvider 设了暗色主题，但 message 还是浅色
- ConfigProvider 设了中文 locale，但 Modal.confirm 的"OK / Cancel" 还是英文

**解决**：用 `App.useApp()` 或 Hook 版本：

```tsx
// ✅ 推荐方式 1：App 组件
import { App } from 'antd'

const MyPage = () => {
  const { message } = App.useApp()
  message.success('...')                            // ✅ 主题 / locale 正确消费
}

// ✅ 推荐方式 2：Hook
const [messageApi, contextHolder] = message.useMessage()
return (
  <>
    {contextHolder}
    <Button onClick={() => messageApi.success('...')}>...</Button>
  </>
)
```

### 2. dayjs 多版本 / locale 没生效

**原因**：项目中存在多个版本的 dayjs（antd 依赖一个，自己又装了一个），或忘了 `dayjs.locale('zh-cn')`。

**症状**：

- DatePicker 中的星期 / 月份名仍是英文
- 时间格式不符合中文习惯

**诊断**：

```bash
pnpm ls dayjs
# 应该只有一个版本
```

**解决**：

```tsx
// 1. 检查版本统一（pnpm overrides 锁版本）
// package.json
{
  "pnpm": {
    "overrides": {
      "dayjs": "1.11.10"
    }
  }
}

// 2. import + 设置 locale
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

dayjs.locale('zh-cn')                               // ⭐ 必须在渲染前调用
```

### 3. Tailwind CSS 与 Ant Design 优先级冲突

**原因**：Tailwind 的 `preflight`（重置样式）会覆盖 Ant Design 的 button / a / hr 等元素样式。

**症状**：

- Button 看起来没样式
- 链接颜色异常

**解决方案 1**：禁用 Tailwind preflight：

```js
// tailwind.config.js
module.exports = {
  corePlugins: {
    preflight: false,                               // 关闭 Tailwind 重置
  },
}
```

**解决方案 2**：用 `:where` 降低 antd CSS 优先级：

```tsx
import { StyleProvider } from '@ant-design/cssinjs'

<StyleProvider hashPriority="high">
  <ConfigProvider>
    <App />
  </ConfigProvider>
</StyleProvider>
```

**解决方案 3**：调整 layer 顺序（PostCSS / Tailwind v4）：

```css
@layer reset, antd, components, utilities;
```

### 4. Next.js App Router 中 `<Select.Option>` 不工作

**症状**：选项不显示、报 hydration mismatch。

**解决**：

```tsx
// ❌ App Router 中
<Select>
  <Select.Option value="1">A</Select.Option>
</Select>

// ✅ 改用 options 数组
<Select options={[{ value: '1', label: 'A' }]} />

// 或在 'use client' 文件内
'use client'
import { Select } from 'antd'
const { Option } = Select

<Select>
  <Option value="1">A</Option>
</Select>
```

### 5. Bundle 体积过大

**原因**：v5 默认 Tree Shaking 但仍较大（Form / Table / DatePicker 都是重组件）。

**诊断**：

```bash
# Vite
pnpm build
ls -lh dist/assets/*.js

# 用 rollup-plugin-visualizer
pnpm add -D rollup-plugin-visualizer
```

**解决**：

1. **避免聚合 import**：
   ```tsx
   // ❌ 破坏 Tree Shaking
   import * as antd from 'antd'

   // ✅
   import { Button, Form } from 'antd'
   ```

2. **拆分代码（路由级别）**：
   ```tsx
   const UserPage = lazy(() => import('./pages/UserPage'))
   ```

3. **不用的组件别 import**：审计 Bundle Analyzer 找出大件

### 6. Form 表单嵌套对象 name 写错

**症状**：嵌套对象字段不绑定、提交时拿不到值。

```tsx
// ❌ 字符串路径（这是 Element Plus 写法）
<Form.Item name="address.city" />

// ✅ 数组路径（Ant Design 标准）
<Form.Item name={['address', 'city']} />
```

### 7. Table 排序 / 筛选不生效

**原因**：忘了设 `rowKey`。

```tsx
// ❌ 没有 rowKey
<Table dataSource={data} />                         // React 警告 + 排序异常

// ✅
<Table dataSource={data} rowKey="id" />
<Table dataSource={data} rowKey={(record) => record.uid} />
```

### 8. SSR 首屏样式闪烁

**原因**：cssinjs SSR 没有正确收集 critical CSS。

**Next.js**：用 `<AntdRegistry>`（见上文）。

**Vite SSR / 自定义服务**：

```tsx
import { createCache, StyleProvider, extractStyle } from '@ant-design/cssinjs'

const cache = createCache()
const html = renderToString(
  <StyleProvider cache={cache}>
    <App />
  </StyleProvider>,
)

const cssText = extractStyle(cache)
const finalHtml = html.replace('</head>', `<style>${cssText}</style></head>`)
```

### 9. Form `initialValues` 不响应外部变化

**症状**：从异步加载数据后 setState，但 Form 仍显示初始值。

**原因**：`initialValues` 只在 Form 首次挂载时使用。

**解决**：用 `form.setFieldsValue` 或 key 重新挂载：

```tsx
// ✅ 方式 1：setFieldsValue
useEffect(() => {
  if (user) {
    form.setFieldsValue(user)
  }
}, [user])

// ✅ 方式 2：用 key 强制重渲
<Form key={user?.id} initialValues={user} ... />
```

### 10. CSS 类名前缀 `ant-` 与团队 namespace 冲突

**解决**：用 `<ConfigProvider prefixCls>` 自定义：

```tsx
<ConfigProvider prefixCls="myorg" iconPrefixCls="myorg-icon">
  <App />
</ConfigProvider>
```

> **影响**：所有 CSS 类名从 `.ant-button` 变成 `.myorg-button`——确保你自定义的 CSS 选择器也同步更新。

## 下一步

- [参考](./reference.md)：**API 速查** / 70+ 组件列表 / 常用 props 表 / Hook 签名 / TypeScript 类型 / Design Token 完整列表 / 60+ 语言包 / 图标包对照
