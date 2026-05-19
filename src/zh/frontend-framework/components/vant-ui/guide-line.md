---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 **Vant 4.x**（v4.9.24+）的核心组件、主题、暗色、国际化、移动端适配深度指南——可作为日常项目开发的「**速查 + 深度参考**」。

## 80+ 组件分类速览

Vant 4 的 **80+** 组件按业务用途分为 **六大类**：

### 基础组件（Basic）

最常用的展示与排版组件，**几乎所有页面都会用到**：

| 组件 | 标签 | 用途 |
|---|---|---|
| Button | van-button | 按钮（5 种 type / 4 种 size / loading / icon） |
| Cell | van-cell | 单元格（移动端通用列表项） |
| CellGroup | van-cell-group | 单元格组（inset 圆角卡片 / title 分组标题） |
| Icon | van-icon | 图标（内置 1000+ 个图标） |
| Image | van-image | 图片（懒加载 / fit / 加载失败兜底） |
| Layout | van-row / van-col | 24 栅格布局 |
| Popup | van-popup | 弹出层（4 个方向 / 圆角 / 自定义动画） |
| Style | - | 内置样式工具类（hairline 0.5px 边框等） |
| Toast | showToast | 轻提示（命令式） |

### 表单组件（Form）

**电商业务核心**，覆盖输入 / 选择 / 校验完整流程：

| 组件 | 标签 | 用途 |
|---|---|---|
| Calendar | van-calendar | 日历（单选 / 多选 / 范围 / 月份切换） |
| Cascader | van-cascader | 级联选择（地区 / 分类） |
| Checkbox | van-checkbox | 复选框 |
| CheckboxGroup | van-checkbox-group | 复选框组 |
| DatePicker | van-date-picker | 日期选择器（年月日 / 年月 / 月日） |
| TimePicker | van-time-picker | 时间选择器（时分秒 / 时分） |
| PickerGroup | van-picker-group | Picker 组（多 tab 切换 Picker） |
| Field | van-field | 输入框（type / clearable / formatter / 校验） |
| Form | van-form | 表单（与 Field 配套使用） |
| NumberKeyboard | van-number-keyboard | 数字键盘（金额 / 验证码） |
| PasswordInput | van-password-input | 密码输入框（六位密码格） |
| Picker | van-picker | 选择器（单列 / 多列 / 级联） |
| Radio | van-radio | 单选框 |
| RadioGroup | van-radio-group | 单选框组 |
| Rate | van-rate | 评分（半选 / 自定义图标） |
| Search | van-search | 搜索框 |
| Signature | van-signature | 手写签名 |
| Slider | van-slider | 滑块 |
| Stepper | van-stepper | 步进器（数量增减） |
| Switch | van-switch | 开关（异步切换 / 自定义颜色） |
| Uploader | van-uploader | 文件上传 |
| Area | van-area | 省市区选择器 |

### 反馈组件（Feedback）

**用户交互结果**反馈、与 Element Plus 的 `ElMessage` 一致的命令式 + 组件式两种风格：

| 组件 | 标签 / 函数 | 用途 |
|---|---|---|
| ActionSheet | van-action-sheet | 动作面板（底部弹出菜单） |
| Dialog | showDialog / van-dialog | 对话框（命令式 + 组件式） |
| Loading | van-loading | 加载（circular / spinner） |
| Notify | showNotify / van-notify | 通知（顶部消息条） |
| Overlay | van-overlay | 遮罩层 |
| PullRefresh | van-pull-refresh | 下拉刷新 |
| ShareSheet | van-share-sheet | 分享面板（微信 / 微博等） |
| SwipeCell | van-swipe-cell | 滑动单元格（左右滑动展示操作） |
| Toast | showToast / van-toast | 轻提示（命令式 + 组件式） |

### 展示组件（Display）

**数据展示**、不可交互：

| 组件 | 标签 | 用途 |
|---|---|---|
| Badge | van-badge | 徽标（数字 / 红点） |
| Barrage | van-barrage | 弹幕 |
| Card | van-card | 商品卡片（电商场景） |
| Circle | van-circle | 环形进度条 |
| Collapse | van-collapse / van-collapse-item | 折叠面板 |
| CountDown | van-count-down | 倒计时 |
| Divider | van-divider | 分割线 |
| Empty | van-empty | 空状态 |
| FloatingBubble | van-floating-bubble | 悬浮气泡（v4.6+） |
| FloatingPanel | van-floating-panel | 悬浮面板（v4.7+） |
| Highlight | van-highlight | 关键词高亮（v4.7+） |
| ImagePreview | showImagePreview | 图片预览（命令式） |
| Lazyload | v-lazy 指令 | 图片懒加载 |
| NoticeBar | van-notice-bar | 通告栏（滚动文字） |
| Progress | van-progress | 进度条 |
| RollingText | van-rolling-text | 数字滚动（v4.8+） |
| Skeleton | van-skeleton | 骨架屏 |
| Sticky | van-sticky | 粘性布局 |
| Swipe | van-swipe / van-swipe-item | 轮播图 |
| Tag | van-tag | 标签 |
| TextEllipsis | van-text-ellipsis | 文本省略 |
| Watermark | van-watermark | 水印 |

### 导航组件（Navigation）

**移动端三件套** + Sidebar / Index / Pagination：

| 组件 | 标签 | 用途 |
|---|---|---|
| ActionBar | van-action-bar | 动作栏（详情页底部立即购买 / 加入购物车） |
| Grid | van-grid / van-grid-item | 宫格菜单（个人中心 / 应用入口） |
| IndexBar | van-index-bar / van-index-anchor | 索引栏（A-Z 联系人列表） |
| NavBar | van-nav-bar | 顶部导航栏（左箭头 + 标题 + 右文字） |
| Pagination | van-pagination | 分页 |
| Sidebar | van-sidebar / van-sidebar-item | 侧边栏 |
| Tab | van-tab / van-tabs | 标签页（顶部 Tab） |
| Tabbar | van-tabbar / van-tabbar-item | 底部 Tab 栏（页面切换） |
| TreeSelect | van-tree-select | 树形选择（分类筛选） |

### 业务组件（Business）

**电商场景专属**——AddressEdit / Coupon / Sku 等大量耦合有赞商城业务：

| 组件 | 标签 | 用途 |
|---|---|---|
| AddressEdit | van-address-edit | 地址编辑（姓名 / 电话 / 地区 / 详细地址 / 默认） |
| AddressList | van-address-list | 地址列表 |
| Card | van-card | 商品卡片 |
| ContactCard | van-contact-card | 联系人卡片 |
| ContactEdit | van-contact-edit | 联系人编辑 |
| ContactList | van-contact-list | 联系人列表 |
| Coupon | van-coupon-cell / van-coupon-list | 优惠券（cell + list） |
| Sku | van-sku（v4 中已移除，需要独立 [@vant/sku](https://github.com/vant-ui/vant-sku)） | 商品规格选择 |
| SubmitBar | van-submit-bar | 提交栏（电商结算页底部） |

> **业务组件耦合电商场景**——非电商项目几乎用不到、且不容易拆出来定制。重 SaaS 项目可以参考其源码自行实现。

## Form 表单深度

Form + Field 是 Vant 表单核心、**与 Element Plus 的 ElForm + ElFormItem 一致的设计哲学**：

### 基础用法

```vue
<template>
  <van-form @submit="onSubmit" @failed="onFailed">
    <van-cell-group inset>
      <van-field
        v-model="form.username"
        name="username"
        label="用户名"
        placeholder="请输入用户名"
        :rules="[{ required: true, message: '请填写用户名' }]"
      />
      <van-field
        v-model="form.password"
        type="password"
        name="password"
        label="密码"
        placeholder="请输入密码"
        :rules="[
          { required: true, message: '请填写密码' },
          { min: 6, message: '密码至少 6 位' },
        ]"
      />
    </van-cell-group>
    <div style="margin: 16px">
      <van-button round block type="primary" native-type="submit">
        提交
      </van-button>
    </div>
  </van-form>
</template>

<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({
  username: '',
  password: '',
})

// 校验通过时触发，参数是表单数据
function onSubmit(values: typeof form) {
  console.log('submit', values)
}

// 校验失败时触发
function onFailed(errorInfo: any) {
  console.log('failed', errorInfo)
}
</script>
```

> **关键点**：`van-form` 的 `submit` 事件**只在校验通过时触发**——失败会触发 `failed`，无需自己手动调用校验。

### 校验规则（FieldRule）

`Field` 组件的 `rules` 属性接收 `FieldRule[]` 数组：

| 字段 | 类型 | 说明 |
|---|---|---|
| required | boolean | 是否必填 |
| message | string \| (val, rule) => string | 错误提示 |
| pattern | RegExp | 正则校验 |
| validator | (val, rule) => boolean \| string \| Promise | 自定义校验函数（支持同步 / 异步） |
| formatter | (val, rule) => any | 格式化值后再校验 |
| trigger | 'onBlur' \| 'onChange' \| 'onSubmit' | 校验时机（默认 onBlur） |
| min | number | 最小长度（v4.x+） |
| max | number | 最大长度（v4.x+） |

### 五种校验场景

```vue
<template>
  <van-form>
    <!-- 1. required 必填 -->
    <van-field
      v-model="form.name"
      :rules="[{ required: true, message: '请输入姓名' }]"
    />

    <!-- 2. pattern 正则 -->
    <van-field
      v-model="form.phone"
      :rules="[
        { required: true, message: '请输入手机号' },
        { pattern: /^1\d{10}$/, message: '手机号格式错误' },
      ]"
    />

    <!-- 3. validator 同步函数 -->
    <van-field
      v-model="form.age"
      :rules="[{ validator: validateAge, message: '年龄需在 1-120 之间' }]"
    />

    <!-- 4. validator 异步函数（返回 Promise） -->
    <van-field
      v-model="form.username"
      :rules="[{ validator: validateUsername }]"
    />

    <!-- 5. trigger 自定义校验时机 -->
    <van-field
      v-model="form.email"
      :rules="[{ required: true, trigger: 'onChange', message: '邮箱必填' }]"
    />
  </van-form>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { showLoadingToast, closeToast } from 'vant'

const form = reactive({
  name: '',
  phone: '',
  age: '',
  username: '',
  email: '',
})

// 同步校验：返回 boolean
function validateAge(val: string): boolean {
  const num = Number(val)
  return num >= 1 && num <= 120
}

// 异步校验：返回 Promise<boolean | string>
async function validateUsername(val: string): Promise<boolean | string> {
  showLoadingToast({ message: '验证中...', forbidClick: true })
  try {
    // 模拟接口请求
    const res = await fetch(`/api/check?username=${val}`)
    const json = await res.json()
    // 返回错误提示（字符串）即校验失败 + 自定义消息
    return json.exists ? '用户名已被占用' : true
  }
  finally {
    closeToast()
  }
}
</script>
```

> **validator 三种返回值**：
> - `true` → 校验通过
> - `false` → 校验失败、使用 `message` 字段的提示
> - `string` → 校验失败、使用返回的字符串作为提示

### 命令式校验（ref + validate）

通过 `ref` 获取 `Form` 实例，**程序化触发校验**：

```vue
<template>
  <van-form ref="formRef">
    <van-field v-model="form.username" name="username" :rules="rules" />
    <van-field v-model="form.email" name="email" :rules="emailRules" />
  </van-form>

  <van-button @click="onValidateUsername">仅校验用户名</van-button>
  <van-button @click="onValidateAll">校验全部</van-button>
  <van-button @click="onReset">重置校验</van-button>
</template>

<script setup lang="ts">
import { reactive, ref, useTemplateRef } from 'vue'
import type { FormInstance } from 'vant'

// 类型化的 ref（推荐）
const formRef = useTemplateRef<FormInstance>('formRef')

const form = reactive({ username: '', email: '' })

async function onValidateUsername() {
  try {
    await formRef.value?.validate('username')
    console.log('用户名校验通过')
  }
  catch (errors) {
    console.log('用户名校验失败', errors)
  }
}

async function onValidateAll() {
  try {
    await formRef.value?.validate()
    console.log('全部校验通过')
  }
  catch (errors) {
    console.log('校验失败', errors)
  }
}

function onReset() {
  formRef.value?.resetValidation()
}
</script>
```

`FormInstance` 提供的方法：

| 方法 | 签名 | 说明 |
|---|---|---|
| validate | `(name?: string \| string[]) => Promise<void>` | 校验全部或指定字段 |
| resetValidation | `(name?: string \| string[]) => void` | 重置校验状态 |
| getValidationStatus | `() => Record<string, FieldValidationStatus>` | 获取所有字段校验状态 |
| scrollToField | `(name: string, alignToTop?: boolean) => void` | 滚动到指定字段（错误定位） |
| submit | `() => void` | 触发 submit 事件 |

### 表单项类型扩展

`Field` 默认是输入框、但可以**通过 input 插槽**变成任意类型：

```vue
<template>
  <van-form>
    <van-cell-group inset>
      <!-- 1. 文本输入（默认） -->
      <van-field v-model="form.name" label="姓名" />

      <!-- 2. 开关 -->
      <van-field name="agree" label="同意协议">
        <template #input>
          <van-switch v-model="form.agree" />
        </template>
      </van-field>

      <!-- 3. 复选框组 -->
      <van-field name="hobbies" label="爱好">
        <template #input>
          <van-checkbox-group v-model="form.hobbies" direction="horizontal">
            <van-checkbox name="music">音乐</van-checkbox>
            <van-checkbox name="sport">运动</van-checkbox>
            <van-checkbox name="read">阅读</van-checkbox>
          </van-checkbox-group>
        </template>
      </van-field>

      <!-- 4. 单选框组 -->
      <van-field name="gender" label="性别">
        <template #input>
          <van-radio-group v-model="form.gender" direction="horizontal">
            <van-radio name="male">男</van-radio>
            <van-radio name="female">女</van-radio>
          </van-radio-group>
        </template>
      </van-field>

      <!-- 5. 评分 -->
      <van-field name="rate" label="评分">
        <template #input>
          <van-rate v-model="form.rate" />
        </template>
      </van-field>

      <!-- 6. 滑块 -->
      <van-field name="slider" label="滑块">
        <template #input>
          <van-slider v-model="form.slider" />
        </template>
      </van-field>

      <!-- 7. 步进器 -->
      <van-field name="stepper" label="数量">
        <template #input>
          <van-stepper v-model="form.stepper" />
        </template>
      </van-field>

      <!-- 8. 文件上传 -->
      <van-field name="uploader" label="上传">
        <template #input>
          <van-uploader v-model="form.uploader" />
        </template>
      </van-field>
    </van-cell-group>
  </van-form>
</template>

<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({
  name: '',
  agree: false,
  hobbies: [],
  gender: 'male',
  rate: 0,
  slider: 50,
  stepper: 1,
  uploader: [],
})
</script>
```

> **关键点**：`Field` 的 `name` 属性**对应 form 数据的 key**——提交时 `onSubmit(values)` 的 `values` 是 `{ [name]: value }` 对象。

### 配合 Picker（点击弹出选择器）

`Field` + `Popup` + `Picker` 是 Vant 表单**最常见的组合**：

```vue
<template>
  <van-form>
    <van-cell-group inset>
      <van-field
        v-model="fieldValue"
        is-link
        readonly
        label="城市"
        placeholder="请选择城市"
        @click="showPicker = true"
      />
    </van-cell-group>
  </van-form>

  <van-popup v-model:show="showPicker" position="bottom" round destroy-on-close>
    <van-picker
      :columns="columns"
      @confirm="onConfirm"
      @cancel="showPicker = false"
    />
  </van-popup>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { PickerConfirmEventParams } from 'vant'

const fieldValue = ref('')
const showPicker = ref(false)

const columns = [
  { text: '杭州', value: 'hangzhou' },
  { text: '宁波', value: 'ningbo' },
  { text: '温州', value: 'wenzhou' },
]

function onConfirm({ selectedOptions }: PickerConfirmEventParams) {
  // selectedOptions 是数组，单列时取第一个
  fieldValue.value = selectedOptions[0]?.text || ''
  showPicker.value = false
}
</script>
```

> `is-link` 让 Field 右侧显示箭头、`readonly` 阻止键盘弹起、`@click` 弹出 Picker——**移动端选择类输入的标准模式**。

## Picker 系列深度

Vant 的 Picker 体系是**移动端选择器的事实标准**——但**新手容易混淆**该用哪个：

### 五种 Picker 的区别

| 组件 | 适用场景 | 示例 |
|---|---|---|
| Picker | 通用选择器（单列 / 多列 / 级联） | 城市选择 / 学历选择 / 自定义数据 |
| PickerGroup | 多 tab 切换 Picker | 「开始日期 + 结束日期」并排 |
| DatePicker | 日期专用（年月日 / 年月 / 月日） | 出生日期 / 到期日期 |
| TimePicker | 时间专用（时分秒 / 时分） | 营业时间 / 闹钟设置 |
| Area | **省市区**专用 | 收货地址 |
| Cascader | **级联**专用（带 tab 顶部导航） | 商品分类 / 部门组织架构 |

### Picker 基础（单列）

```vue
<template>
  <van-picker
    title="选择城市"
    :columns="columns"
    @confirm="onConfirm"
    @cancel="onCancel"
  />
</template>

<script setup lang="ts">
import type { PickerConfirmEventParams } from 'vant'

const columns = [
  { text: '杭州', value: 'hangzhou' },
  { text: '宁波', value: 'ningbo' },
  { text: '温州', value: 'wenzhou' },
]

function onConfirm({ selectedValues, selectedOptions }: PickerConfirmEventParams) {
  console.log('values', selectedValues)
  console.log('options', selectedOptions)
}

function onCancel() {
  console.log('cancel')
}
</script>
```

### Picker 多列

```vue
<template>
  <van-picker title="选择" :columns="columns" />
</template>

<script setup lang="ts">
// 多列即二维数组：每个子数组是一列
const columns = [
  // 第一列：周
  [
    { text: '周一', value: 1 },
    { text: '周二', value: 2 },
    { text: '周三', value: 3 },
  ],
  // 第二列：时段
  [
    { text: '上午', value: 'am' },
    { text: '下午', value: 'pm' },
    { text: '晚上', value: 'night' },
  ],
]
</script>
```

### Picker 级联（联动）

每个选项可以有 `children` 字段，**自动级联**：

```vue
<template>
  <van-picker title="选择地区" :columns="columns" :columns-field-names="fieldNames" />
</template>

<script setup lang="ts">
// 自定义字段名（默认 text / value / children）
const fieldNames = {
  text: 'name',
  value: 'code',
  children: 'cities',
}

const columns = [
  {
    name: '浙江',
    code: 'zj',
    cities: [
      { name: '杭州', code: 'hz' },
      { name: '宁波', code: 'nb' },
    ],
  },
  {
    name: '江苏',
    code: 'js',
    cities: [
      { name: '南京', code: 'nj' },
      { name: '苏州', code: 'sz' },
    ],
  },
]
</script>
```

### DatePicker（日期专用）

```vue
<template>
  <van-date-picker
    v-model="currentDate"
    title="选择日期"
    :min-date="minDate"
    :max-date="maxDate"
    :columns-type="columnsType"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'

// 当前选中日期（数组形式：['2026', '05', '17']）
const currentDate = ref(['2026', '05', '17'])

const minDate = new Date(2020, 0, 1)
const maxDate = new Date(2030, 11, 31)

// 显示列：'year' / 'month' / 'day'
// 三列 = 年月日 / 两列 = 年月 或 月日
const columnsType = ['year', 'month', 'day']
</script>
```

### TimePicker（时间专用）

```vue
<template>
  <van-time-picker
    v-model="currentTime"
    title="选择时间"
    :columns-type="['hour', 'minute']"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'

// '14:30' 拆为 ['14', '30']
const currentTime = ref(['14', '30'])
</script>
```

### Area（省市区）

```vue
<template>
  <van-area
    title="选择地址"
    :area-list="areaList"
    @confirm="onConfirm"
  />
</template>

<script setup lang="ts">
import { areaList } from '@vant/area-data'

function onConfirm({ selectedOptions }: any) {
  // selectedOptions: [{省}, {市}, {区}]
  const address = selectedOptions.map((o: any) => o.text).join('')
  console.log(address) // '浙江省杭州市西湖区'
}
</script>
```

> 必须安装 **`@vant/area-data`**（独立包）：`pnpm add @vant/area-data`——包含**最新的省市区编码数据**。

### Cascader（带 tab 的级联）

适合**深层级联场景**（3 级以上）：

```vue
<template>
  <van-cascader
    v-model="cascaderValue"
    title="选择地区"
    :options="options"
    @close="show = false"
    @finish="onFinish"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'

const cascaderValue = ref('')
const options = [
  {
    text: '浙江',
    value: '330000',
    children: [
      {
        text: '杭州',
        value: '330100',
        children: [
          { text: '西湖区', value: '330106' },
          { text: '余杭区', value: '330110' },
        ],
      },
    ],
  },
]

function onFinish({ selectedOptions }: any) {
  console.log(selectedOptions.map((o: any) => o.text).join('/'))
}
</script>
```

### PickerGroup（多 Picker 组合）

「**开始日期 + 结束日期**」这类场景：

```vue
<template>
  <van-picker-group
    title="预约时间"
    :tabs="['开始时间', '结束时间']"
    @confirm="onConfirm"
    @cancel="onCancel"
  >
    <van-date-picker v-model="startDate" :min-date="minDate" :max-date="maxDate" />
    <van-date-picker v-model="endDate" :min-date="minDate" :max-date="maxDate" />
  </van-picker-group>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const startDate = ref(['2026', '05', '17'])
const endDate = ref(['2026', '05', '24'])
const minDate = new Date(2020, 0, 1)
const maxDate = new Date(2030, 11, 31)

function onConfirm() {
  console.log({ startDate: startDate.value, endDate: endDate.value })
}

function onCancel() {
  console.log('cancel')
}
</script>
```

## List + PullRefresh（下拉刷新 + 上拉加载）

移动端长列表标配——`List` 上拉加载 + `PullRefresh` 下拉刷新：

### 基础用法

```vue
<template>
  <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
    <van-list
      v-model:loading="loading"
      :finished="finished"
      finished-text="没有更多了"
      @load="onLoad"
    >
      <van-cell v-for="item in list" :key="item.id" :title="item.title" />
    </van-list>
  </van-pull-refresh>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const list = ref<{ id: number; title: string }[]>([])
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const pageSize = 20
let page = 1

// 上拉加载：滚动到底部触发
async function onLoad() {
  try {
    const data = await fetchList({ page, pageSize })
    list.value.push(...data.items)
    page++
    // 数据全部加载完
    if (list.value.length >= data.total) {
      finished.value = true
    }
  }
  finally {
    // 必须设为 false 才能再次触发 load
    loading.value = false
  }
}

// 下拉刷新：从顶部下拉触发
async function onRefresh() {
  page = 1
  list.value = []
  finished.value = false
  // loading 设为 true 立即触发 load
  loading.value = true
  await onLoad()
  refreshing.value = false
}

// 模拟接口
async function fetchList({ page, pageSize }: { page: number; pageSize: number }) {
  return new Promise<{ items: any[]; total: number }>((resolve) => {
    setTimeout(() => {
      const items = Array.from({ length: pageSize }, (_, i) => ({
        id: (page - 1) * pageSize + i + 1,
        title: `第 ${(page - 1) * pageSize + i + 1} 条`,
      }))
      resolve({ items, total: 100 })
    }, 500)
  })
}
</script>
```

> **关键状态机**：
> - `loading=true` + `onLoad` 还没回 → 显示加载中
> - `loading=false` + `finished=false` → 触底再触发 `load`
> - `finished=true` → 显示「没有更多了」、不再触发 `load`
> - `refreshing=true` → 下拉刷新动画中

### 错误处理 + 重试

```vue
<template>
  <van-list
    v-model:loading="loading"
    v-model:error="error"
    :finished="finished"
    error-text="请求失败，点击重新加载"
    @load="onLoad"
  >
    <van-cell v-for="item in list" :key="item.id" :title="item.title" />
  </van-list>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const list = ref<any[]>([])
const loading = ref(false)
const error = ref(false)
const finished = ref(false)

async function onLoad() {
  try {
    const data = await fetchList()
    list.value.push(...data.items)
    if (list.value.length >= 100) finished.value = true
  }
  catch {
    // 错误处理：error=true 显示「请求失败，点击重新加载」
    error.value = true
  }
  finally {
    loading.value = false
  }
}

async function fetchList() {
  // 模拟接口可能失败
  if (Math.random() < 0.3) throw new Error('Network Error')
  return { items: [{ id: 1, title: '第 1 条' }] }
}
</script>
```

> 用户点击错误提示后会**自动重试** `onLoad`、不需要手动重置 error。

## Toast / Dialog / Notify / Loading（反馈四件套）

Vant 的**命令式反馈 API**——与 Element Plus 的 `ElMessage` / `ElMessageBox` / `ElNotification` 风格一致：

### Toast（轻提示）

```ts
import {
  showToast,
  showSuccessToast,
  showFailToast,
  showLoadingToast,
  closeToast,
  allowMultipleToast,
  setToastDefaultOptions,
} from 'vant'

// 1. 文字提示
showToast('提示内容')

// 2. 成功 / 失败
showSuccessToast('保存成功')
showFailToast('保存失败')

// 3. 加载提示（禁用背景点击）
const toast = showLoadingToast({
  message: '加载中...',
  forbidClick: true,
  duration: 0, // 0 = 不自动关闭
})
// 手动关闭
toast.close()
// 或全局关闭
closeToast()

// 4. 自定义图标
showToast({
  message: '点赞',
  icon: 'like-o', // 内置图标名
})

// 5. 自定义位置
showToast({
  message: '顶部',
  position: 'top', // 'top' | 'middle' | 'bottom'
})

// 6. 动态更新（实例返回值可直接改 message）
const t = showLoadingToast({ duration: 0, message: '倒计时 3 秒' })
let sec = 3
const timer = setInterval(() => {
  sec--
  if (sec > 0) t.message = `倒计时 ${sec} 秒`
  else {
    clearInterval(timer)
    closeToast()
  }
}, 1000)

// 7. 允许多个 Toast（默认单例）
allowMultipleToast()
showToast('第一个')
showSuccessToast('第二个')

// 8. 修改全局默认配置
setToastDefaultOptions({ duration: 2000 })
setToastDefaultOptions('loading', { forbidClick: true })
```

### Dialog（对话框）

```ts
import { showDialog, showConfirmDialog } from 'vant'

// 1. 提示框（只有「确认」按钮）
await showDialog({
  title: '提示',
  message: '操作完成',
})

// 2. 确认框（「取消」+「确认」按钮）
try {
  await showConfirmDialog({
    title: '确认',
    message: '确定删除这条记录吗？',
  })
  // 用户点击「确认」
  console.log('confirmed')
}
catch {
  // 用户点击「取消」
  console.log('cancelled')
}

// 3. 自定义按钮
await showDialog({
  message: '自定义按钮',
  showCancelButton: true,
  cancelButtonText: '不要',
  confirmButtonText: '好的',
  confirmButtonColor: '#07c160',
})

// 4. 异步关闭（点击「确认」后等待异步操作）
await showConfirmDialog({
  message: '提交吗？',
  beforeClose: async (action) => {
    if (action === 'confirm') {
      await submitToServer()
    }
    return true // 返回 true 才会关闭
  },
})
```

> **Promise 风格**：`await showConfirmDialog(...)` resolve 是「确认」、reject 是「取消」——用 `try/catch` 区分。

### Notify（顶部消息条）

```ts
import { showNotify, closeNotify } from 'vant'

// 1. 文字通知
showNotify('通知内容')

// 2. 不同类型（与 Toast 一致：primary / success / warning / danger）
showNotify({ type: 'primary', message: '主要通知' })
showNotify({ type: 'success', message: '成功通知' })
showNotify({ type: 'warning', message: '警告通知' })
showNotify({ type: 'danger', message: '危险通知' })

// 3. 自定义颜色 + 时长
showNotify({
  message: '自定义',
  color: '#fff',
  background: '#07c160',
  duration: 5000, // 5 秒
})

// 4. 关闭
closeNotify()
```

### Loading（加载动画）

`Loading` 是**组件**而非命令式 API——直接放到模板中：

```vue
<template>
  <!-- 圆环（默认） -->
  <van-loading />
  <!-- 菊花 -->
  <van-loading type="spinner" />
  <!-- 文字 + 加载图标 -->
  <van-loading size="24px">加载中...</van-loading>
  <!-- 垂直布局 -->
  <van-loading size="24px" vertical>加载中...</van-loading>
  <!-- 自定义颜色 -->
  <van-loading color="#07c160" />
</template>
```

需要**全屏加载**时用 `showLoadingToast`（前面 Toast 章节）。

## Tab / Tabbar / NavBar（移动端导航三件套）

### NavBar（顶部导航栏）

```vue
<template>
  <van-nav-bar
    title="标题"
    left-text="返回"
    right-text="设置"
    left-arrow
    @click-left="onBack"
    @click-right="onSetting"
  />
</template>

<script setup lang="ts">
function onBack() {
  history.back()
}
function onSetting() {
  console.log('open setting')
}
</script>
```

固定吸顶：

```vue
<van-sticky>
  <van-nav-bar title="标题" left-arrow />
</van-sticky>
```

### Tab（页面 Tab）

```vue
<template>
  <van-tabs v-model:active="active">
    <van-tab title="首页">首页内容</van-tab>
    <van-tab title="发现">发现内容</van-tab>
    <van-tab title="我的">我的内容</van-tab>
  </van-tabs>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const active = ref(0)
</script>
```

常用属性：

| 属性 | 说明 |
|---|---|
| sticky | 粘性布局（滚动时吸顶） |
| swipeable | 支持左右滑动切换 |
| line-width | 底部下划线宽度 |
| line-height | 底部下划线高度 |
| color | 激活颜色 |
| background | 背景色 |
| type | 'line'（默认）/ 'card'（卡片式） |

### Tabbar（底部 Tab 栏）

```vue
<template>
  <van-tabbar v-model="active" safe-area-inset-bottom>
    <van-tabbar-item icon="home-o" to="/">首页</van-tabbar-item>
    <van-tabbar-item icon="search" to="/search">搜索</van-tabbar-item>
    <van-tabbar-item icon="friends-o" to="/friends" :badge="5">好友</van-tabbar-item>
    <van-tabbar-item icon="setting-o" to="/setting">设置</van-tabbar-item>
  </van-tabbar>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const active = ref(0)
</script>
```

> **`safe-area-inset-bottom` 必加**——iPhone X 等异形屏底部安全区适配。

## Lazyload（图片懒加载指令）

Vant 的 Lazyload **是指令、不是组件**——必须**单独注册**（即使 `app.use(Vant)` 也需要）：

### 注册

```ts
// main.ts
import { createApp } from 'vue'
import { Lazyload } from 'vant'
import App from './App.vue'

const app = createApp(App)

app.use(Lazyload, {
  lazyComponent: true,
  loading: 'https://fastly.jsdelivr.net/npm/@vant/assets/loading.png',
  error: 'https://fastly.jsdelivr.net/npm/@vant/assets/error.png',
  preload: 1.3, // 提前 1.3 屏加载
})

app.mount('#app')
```

### 使用

```vue
<template>
  <!-- 1. 普通图片懒加载 -->
  <img v-lazy="imageSrc" />

  <!-- 2. 背景图懒加载 -->
  <div v-lazy:background-image="imageSrc"></div>

  <!-- 3. 组件懒加载（需要 lazyComponent: true） -->
  <lazy-component>
    <HeavyChart />
  </lazy-component>

  <!-- 4. List 中循环懒加载 -->
  <van-list>
    <van-cell v-for="item in list" :key="item.id">
      <img v-lazy="item.cover" />
    </van-cell>
  </van-list>
</template>

<script setup lang="ts">
const imageSrc = '/big-image.jpg'
const list = []
</script>
```

> **`v-lazy` 优先级高于 `<van-image lazy-load>`**——`<van-image>` 自带懒加载、不需要再用 `v-lazy`。

## 主题深度（700+ CSS 变量）

Vant 4 暴露 **700+ CSS 变量**——**全局覆盖** + **局部覆盖** + **运行时切换**三种方式：

### 三种覆盖方式

#### 方式 1：CSS `:root` 全局覆盖（编译期 / 运行时均可）

```css
/* 在全局样式文件中（main.css） */
:root:root {
  /* 基础变量（影响所有组件） */
  --van-primary-color: #07c160;
  --van-success-color: #07c160;
  --van-danger-color: #ee0a24;

  /* 组件变量（只影响特定组件） */
  --van-button-primary-background: #07c160;
  --van-tab-active-text-color: #07c160;
}
```

> **为什么 `:root:root`（双重）？** Vant 内部主题变量也声明在 `:root`、双重 `:root` 提升优先级、确保覆盖。

#### 方式 2：ConfigProvider 局部 / 全局覆盖

```vue
<template>
  <van-config-provider :theme-vars="themeVars" theme-vars-scope="global">
    <RouterView />
  </van-config-provider>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import type { ConfigProviderThemeVars } from 'vant'

// camelCase 自动转 --van-* kebab-case
const themeVars: ConfigProviderThemeVars = reactive({
  primaryColor: '#07c160',
  buttonPrimaryBackground: '#07c160',
  buttonPrimaryBorderColor: '#07c160',
})
</script>
```

`theme-vars-scope` 两种值：

- `local`（默认）：变量设置到 ConfigProvider 根节点、**只影响内部子组件**
- `global`：变量设置到 HTML `:root`、**影响整个页面**

> **修改基础变量必须用 `theme-vars-scope="global"`** 或 `:root` 选择器——组件变量会寻找最近的父级基础变量，`local` 模式下基础变量会**找不到父级**导致继承失败。

#### 方式 3：运行时动态切换

```vue
<template>
  <van-config-provider :theme-vars="currentTheme" theme-vars-scope="global">
    <RouterView />
  </van-config-provider>

  <van-button @click="setTheme('blue')">蓝色</van-button>
  <van-button @click="setTheme('green')">绿色</van-button>
  <van-button @click="setTheme('red')">红色</van-button>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const themes = {
  blue: { primaryColor: '#1989fa' },
  green: { primaryColor: '#07c160' },
  red: { primaryColor: '#ee0a24' },
} as const

const currentTheme = ref(themes.blue)

function setTheme(name: keyof typeof themes) {
  currentTheme.value = themes[name]
}
</script>
```

### 基础变量速查

| 变量 | 默认值 | 用途 |
|---|---|---|
| `--van-primary-color` | #1989fa | 主色调（影响 Primary 按钮 / Tab 激活色等） |
| `--van-success-color` | #07c160 | 成功色 |
| `--van-warning-color` | #ff976a | 警告色 |
| `--van-danger-color` | #ee0a24 | 危险色 |
| `--van-text-color` | #323233 | 主文字色 |
| `--van-text-color-2` | #969799 | 次要文字色 |
| `--van-text-color-3` | #c8c9cc | 弱化文字色 |
| `--van-background` | #f7f8fa | 页面背景色 |
| `--van-background-2` | #fff | 内容背景色 |
| `--van-border-color` | #ebedf0 | 边框颜色 |
| `--van-radius-sm` | 2px | 小圆角 |
| `--van-radius-md` | 4px | 中圆角 |
| `--van-radius-lg` | 8px | 大圆角 |
| `--van-padding-base` | 4px | 基础间距 |
| `--van-padding-xs` | 8px | xs 间距 |
| `--van-padding-sm` | 12px | sm 间距 |
| `--van-padding-md` | 16px | md 间距 |
| `--van-padding-lg` | 24px | lg 间距 |
| `--van-padding-xl` | 32px | xl 间距 |
| `--van-font-size-sm` | 12px | sm 字号 |
| `--van-font-size-md` | 14px | md 字号 |
| `--van-font-size-lg` | 16px | lg 字号 |
| `--van-line-height-sm` | 18px | sm 行高 |

> **完整变量列表**：参见 [Vant CSS 变量源码](https://github.com/vant-ui/vant/blob/main/packages/vant/src/style/var.less)（700+）。

### 组件变量命名规范

| 模式 | 示例 |
|---|---|
| `--van-{component}-{property}` | `--van-button-primary-background` |
| `--van-{component}-{state}-{property}` | `--van-tab-active-text-color` |
| `--van-{component}-{size}-{property}` | `--van-button-large-min-width` |

## 深色模式完整方案

### 基础启用

```vue
<template>
  <van-config-provider :theme="theme">
    <RouterView />
  </van-config-provider>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const theme = ref<'light' | 'dark'>('light')
</script>
```

### 配合 VueUse useDark（推荐）

```vue
<template>
  <van-config-provider :theme="theme">
    <RouterView />
  </van-config-provider>

  <!-- 切换按钮 -->
  <van-cell title="深色模式">
    <template #right-icon>
      <van-switch v-model="isDark" />
    </template>
  </van-cell>
</template>

<script setup lang="ts">
import { useDark } from '@vueuse/core'
import { computed } from 'vue'

// 自动同步 localStorage + prefers-color-scheme
const isDark = useDark({
  storageKey: 'vant-theme',
  valueDark: 'dark',
  valueLight: 'light',
})

const theme = computed(() => (isDark.value ? 'dark' : 'light'))
</script>
```

### 全局背景色 / 文字色

Vant 的深色模式**只影响 Vant 组件**——HTML body 背景 / 文字需要**手动设置**：

```css
/* 浅色模式（默认） */
body {
  color: var(--van-text-color);
  background-color: var(--van-background);
}

/* 深色模式（.van-theme-dark 类自动添加到根节点） */
.van-theme-dark body {
  color: #f5f5f5;
  background-color: #000;
}
```

### 浅色 / 深色专属变量

`theme-vars` 全局生效、`theme-vars-light` 仅浅色生效、`theme-vars-dark` 仅深色生效：

```vue
<template>
  <van-config-provider
    :theme="theme"
    :theme-vars="themeVars"
    :theme-vars-dark="themeVarsDark"
    :theme-vars-light="themeVarsLight"
  >
    <RouterView />
  </van-config-provider>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

const theme = ref<'light' | 'dark'>('light')

// 浅色 / 深色通用变量
const themeVars = reactive({
  primaryColor: '#07c160',
})

// 浅色模式下覆盖
const themeVarsLight = reactive({
  buttonPrimaryBackground: '#07c160',
})

// 深色模式下覆盖
const themeVarsDark = reactive({
  buttonPrimaryBackground: '#1d8845', // 深色下用更暗的绿
})
</script>
```

## 国际化（30+ 语言包）

### 默认中文

Vant **默认即中文**——无需任何配置（与 Element Plus 不同）。

### 切换其他语言

```ts
import { Locale } from 'vant'
import enUS from 'vant/es/locale/lang/en-US'
import jaJP from 'vant/es/locale/lang/ja-JP'

Locale.use('en-US', enUS)
Locale.use('ja-JP', jaJP)
```

支持的语言（部分）：

| 语言 | 文件名 | 说明 |
|---|---|---|
| 简体中文 | zh-CN | 默认 |
| 繁体中文（港） | zh-HK | - |
| 繁体中文（台） | zh-TW | - |
| 英语 | en-US | - |
| 日语 | ja-JP | - |
| 韩语 | ko-KR | - |
| 法语 | fr-FR | - |
| 德语 | de-DE | - |
| 西班牙语 | es-ES | - |
| 意大利语 | it-IT | - |
| 葡萄牙语（巴西） | pt-BR | - |
| 俄语 | ru-RU | - |
| 阿拉伯语 | ar-SA | 自动 RTL |
| 印度尼西亚语 | id-ID | - |
| 越南语 | vi-VN | - |
| 泰语 | th-TH | - |
| 土耳其语 | tr-TR | - |
| 波兰语 | pl-PL | - |
| 罗马尼亚语 | ro-RO | - |
| 荷兰语 | nl-NL | - |
| 瑞典语 | sv-SE | - |
| 希伯来语 | he-IL | 自动 RTL |
| 高棉语 | km-KH | - |
| 印地语 | hi-IN | - |
| 蒙古语 | mm-MN | - |

完整列表见 [Vant locale 源码](https://github.com/vant-ui/vant/tree/main/packages/vant/src/locale/lang)。

### 自定义部分文案

```ts
import { Locale } from 'vant'

Locale.add({
  'zh-CN': {
    vanPicker: {
      confirm: '关闭', // 默认「确认」改为「关闭」
      cancel: '不要', // 默认「取消」改为「不要」
    },
    vanDialog: {
      confirm: '好的',
    },
  },
})
```

### 配合 vue-i18n（业务文案）

Vant `Locale` 只管 **Vant 组件内部文案**（如 Picker 的「确认 / 取消」），**业务代码的多语言**需要 `vue-i18n`：

```ts
// i18n.ts
import { createI18n } from 'vue-i18n'
import { Locale } from 'vant'
import enUS from 'vant/es/locale/lang/en-US'

const i18n = createI18n({
  locale: 'zh-CN',
  messages: {
    'zh-CN': { hello: '你好' },
    'en-US': { hello: 'Hello' },
  },
})

// 同步 Vant Locale 和 vue-i18n locale
i18n.global.locale.value = 'en-US'
Locale.use('en-US', enUS)

export default i18n
```

### 获取当前语言

```ts
import { useCurrentLang } from 'vant'

const currentLang = useCurrentLang()
console.log(currentLang.value) // 'zh-CN' 或其他
```

## 移动端适配深度

### Rem 适配（lib-flexible + postcss-pxtorem）

#### 配置

```bash
pnpm add lib-flexible
pnpm add -D postcss-pxtorem
```

```ts
// main.ts（必须在 createApp 之前）
import 'lib-flexible'
```

```js
// postcss.config.js
module.exports = {
  plugins: {
    'postcss-pxtorem': {
      rootValue: 37.5, // Vant 设计稿基准 375，root = 37.5
      propList: ['*'],
    },
  },
}
```

#### 不同设计稿尺寸

| 项目设计稿 | Vant 内部 | rootValue 配置 |
|---|---|---|
| 375（与 Vant 一致） | 37.5 | `rootValue: 37.5` |
| 750（淘宝 / 京东） | 37.5 | 函数式：Vant 走 37.5、业务走 75 |
| 1080（更高分辨率） | 37.5 | 函数式：Vant 走 37.5、业务走 108 |

```js
// 750 设计稿
module.exports = {
  plugins: {
    'postcss-pxtorem': {
      rootValue({ file }) {
        return file.indexOf('vant') !== -1 ? 37.5 : 75
      },
      propList: ['*'],
    },
  },
}
```

### Viewport 适配（postcss-px-to-viewport）

```bash
pnpm add -D postcss-px-to-viewport
```

```js
// postcss.config.js
module.exports = {
  plugins: {
    'postcss-px-to-viewport': {
      viewportWidth: 375, // Vant 设计稿
    },
  },
}
```

### 底部安全区适配（iPhone X 等）

```html
<!-- index.html -->
<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0, viewport-fit=cover"
/>
```

```vue
<template>
  <!-- 顶部安全区适配 -->
  <van-nav-bar title="标题" safe-area-inset-top />

  <!-- 底部安全区适配 -->
  <van-tabbar safe-area-inset-bottom>...</van-tabbar>
  <van-submit-bar :price="3050" safe-area-inset-bottom />
  <van-number-keyboard safe-area-inset-bottom />
</template>
```

> **`viewport-fit=cover` 必加**——否则 iOS 不会触发安全区。

## 桌面端 PC 适配

### @vant/touch-emulator（事件适配）

```bash
pnpm add @vant/touch-emulator
```

```ts
// main.ts
import '@vant/touch-emulator'
// 引入后桌面端 mouse 事件自动转为 touch 事件、所有组件可点
```

### max-width 容器（视觉适配）

```vue
<template>
  <div class="mobile-container">
    <RouterView />
  </div>
</template>

<style>
.mobile-container {
  max-width: 540px;
  min-height: 100vh;
  margin: 0 auto;
  background: var(--van-background);
  /* PC 浏览器全屏时居中显示 */
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.05);
}

/* 让浏览器全屏背景柔和 */
@media (min-width: 540px) {
  body {
    background: #f5f5f5;
  }
}
</style>
```

### hover 状态优化（鼠标悬停）

桌面端鼠标 hover 时 Vant 默认无视觉反馈——可以**全局加 hover 状态**：

```css
@media (hover: hover) {
  .van-cell:hover {
    background: var(--van-cell-active-color);
  }

  .van-button:not(.van-button--disabled):hover {
    opacity: 0.9;
  }
}
```

## SSR + Nuxt 集成深度

### `@vant/nuxt` 模块（推荐）

```bash
pnpm add -D @vant/nuxt
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@vant/nuxt'],
  vant: {
    lazyload: true, // 启用组件 CSS 懒加载
    importStyle: 'css', // 引入 CSS（vs 'less' 引入 less 源文件）
  },
})
```

### 处理 Teleport hydration

Vant 大量使用 `Teleport`（Dialog / Toast / Popup / NumberKeyboard 等）——SSR 时 server 端无法 Teleport、需要 `<ClientOnly>`：

```vue
<template>
  <!-- 服务端不渲染、客户端 hydration 后渲染 -->
  <ClientOnly>
    <van-dialog v-model:show="show" title="提示">这是对话框</van-dialog>
  </ClientOnly>
</template>
```

> `@vant/nuxt` **已自动处理大部分场景**——但**自定义 Teleport 容器**时仍可能踩坑。

### 命令式 API 在 SSR 中的处理

`showToast` / `showDialog` 等命令式 API **只能在 client 端调用**——服务端 import 后调用会**报错**（`document is not defined`）。

```vue
<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  // 只在 client 端执行
  showToast('页面已加载')
})

// 错误：以下代码在 SSR 阶段执行、会崩溃
// showToast('立即执行') // ❌
</script>
```

## 与 Vue Router + Pinia 集成

### Vue Router

```vue
<template>
  <!-- Tabbar 联动 router -->
  <van-tabbar route>
    <van-tabbar-item to="/" icon="home-o">首页</van-tabbar-item>
    <van-tabbar-item to="/search" icon="search">搜索</van-tabbar-item>
    <van-tabbar-item to="/me" icon="user-o">我的</van-tabbar-item>
  </van-tabbar>
</template>
```

`route` 属性让 Tabbar 根据当前路由**自动激活对应 item**——比 `v-model:active` 更适合页面切换场景。

`Button` / `Cell` 等也支持 `to` 属性：

```vue
<template>
  <van-cell title="个人信息" is-link to="/profile" />
  <van-button to="/login" type="primary">登录</van-button>
</template>
```

### Pinia

Pinia 与 Vant 无特殊集成——按常规方式使用：

```ts
// stores/user.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  const token = ref('')
  const userInfo = ref<{ name: string } | null>(null)

  const isLogin = computed(() => !!token.value)

  async function login(form: { username: string; password: string }) {
    const res = await fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify(form),
    })
    const data = await res.json()
    token.value = data.token
    userInfo.value = data.user
  }

  function logout() {
    token.value = ''
    userInfo.value = null
  }

  return { token, userInfo, isLogin, login, logout }
})
```

```vue
<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { showSuccessToast, showFailToast } from 'vant'

const userStore = useUserStore()

async function onLogin(form: any) {
  try {
    await userStore.login(form)
    showSuccessToast('登录成功')
  }
  catch {
    showFailToast('登录失败')
  }
}
</script>
```

## 常见踩坑

### 1. 按需引入后组件没样式

**症状**：`<van-button>` 渲染了 HTML、但**没有 CSS**——按钮没颜色 / 没圆角。

**原因**：

- **手动 import 时漏 import CSS**：必须 `import 'vant/es/button/style'`
- **postcss-loader 忽略了 node_modules**：Vant 内部样式没被编译

**解决**：

- 用 `@vant/auto-import-resolver` + unplugin，CSS 自动注入
- PostCSS 配置中**移除 `exclude: /node_modules/`**

### 2. unplugin 按需引入不生效

**症状**：`<van-button>` 在浏览器 console 报「Vue warn: Failed to resolve component: van-button」。

**原因**：

- VantResolver 没正确传给 `Components({ resolvers: [...] })`
- `components.d.ts` 没生成 / 没在 tsconfig include

**解决**：

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { VantResolver } from '@vant/auto-import-resolver'

export default defineConfig({
  plugins: [
    vue(),
    Components({
      resolvers: [VantResolver()], // 必须传 resolver
      dts: true, // 生成 components.d.ts
    }),
    AutoImport({
      resolvers: [VantResolver()],
      dts: 'auto-imports.d.ts',
    }),
  ],
})
```

### 3. 主题色不生效

**症状**：`<van-config-provider :theme-vars="{ primaryColor: 'red' }">` 后按钮还是蓝色。

**原因**：

- 基础变量必须用 `theme-vars-scope="global"` 或 `:root`
- camelCase 没正确转换（如 `button-primary-background` 错写为 `buttonPrimary-background`）

**解决**：

```vue
<template>
  <!-- 基础变量必须用 global scope -->
  <van-config-provider
    :theme-vars="{ primaryColor: 'red' }"
    theme-vars-scope="global"
  >
    ...
  </van-config-provider>
</template>
```

或直接 CSS：

```css
:root:root {
  --van-primary-color: red;
}
```

### 4. SSR hydration mismatch

**症状**：Nuxt 控制台报「Hydration node mismatch」、组件位置闪烁。

**原因**：

- Vant 大量使用 `Teleport`、SSR 时 server 端不渲染、client hydration 后才挂到 body
- 自定义 `<Teleport to="#custom">` 的容器在 server / client 不一致

**解决**：

```vue
<!-- 用 ClientOnly 包裹 -->
<ClientOnly>
  <van-dialog v-model:show="show">...</van-dialog>
</ClientOnly>
```

或在 nuxt.config 中确保 `@vant/nuxt` 模块已启用。

### 5. Picker 系列混淆

**症状**：选择城市用了 `<van-picker>`、又用了 `<van-area>`、又看见 `<van-cascader>`、不知道用哪个。

**判断标准**：

| 场景 | 用 |
|---|---|
| 自定义选项（性别 / 学历 / 自定义数据） | Picker |
| 省市区（用 `@vant/area-data`） | Area |
| 商品分类 / 部门组织（深层级联） | Cascader |
| 日期 | DatePicker |
| 时间 | TimePicker |
| 开始日期 + 结束日期 | PickerGroup + 2 x DatePicker |

### 6. 桌面端 touch 事件无响应

**症状**：PC 浏览器调试时点 `<van-button>` 无反应、`<van-swipe>` 不能拖动。

**原因**：Vant 默认只监听 `touchstart` / `touchmove` / `touchend`、桌面端鼠标点击不触发 touch 事件。

**解决**：

```ts
// main.ts
import '@vant/touch-emulator'
```

### 7. iPhone X 底部安全区被遮挡

**症状**：iPhone X 在 Tabbar 底部、内容被「下巴」遮住。

**解决**：

```html
<!-- 1. index.html 必须加 viewport-fit=cover -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

```vue
<!-- 2. Tabbar / SubmitBar / NumberKeyboard 加 safe-area-inset-bottom -->
<van-tabbar safe-area-inset-bottom>...</van-tabbar>
```

### 8. List 触底无限触发 onLoad

**症状**：`onLoad` 被调用无数次、数据狂涨。

**原因**：`loading` 没在请求完成后设为 `false`、List 认为还在加载、又触底 → 又加载。

**解决**：

```ts
async function onLoad() {
  try {
    const data = await fetchList()
    list.value.push(...data.items)
    if (list.value.length >= total) finished.value = true
  }
  finally {
    // 必须在 finally 中重置 loading（避免请求失败也重置）
    loading.value = false
  }
}
```

### 9. Form 校验提示位置错乱

**症状**：错误提示显示在了表单顶部、用户看不到具体哪个字段错了。

**解决**：用 `scrollToField` 自动滚动到错误字段：

```vue
<script setup lang="ts">
import { useTemplateRef } from 'vue'
import type { FormInstance } from 'vant'

const formRef = useTemplateRef<FormInstance>('formRef')

async function onSubmit() {
  try {
    await formRef.value?.validate()
    // 提交
  }
  catch (errors) {
    // errors[0].name 是第一个错误字段
    if (errors[0]?.name) {
      formRef.value?.scrollToField(errors[0].name, true)
    }
  }
}
</script>
```

### 10. Lazyload 指令未注册

**症状**：`<img v-lazy="src">` 报错「Failed to resolve directive: lazy」。

**原因**：`app.use(Vant)` **不会自动注册** Lazyload 指令、必须**单独注册**。

**解决**：

```ts
import { Lazyload } from 'vant'
app.use(Lazyload, {
  loading: '/loading.png',
})
```

## 业务组件速查

### AddressEdit（地址编辑）

```vue
<template>
  <van-address-edit
    :area-list="areaList"
    show-postal
    show-delete
    :address-info="addressInfo"
    @save="onSave"
    @delete="onDelete"
  />
</template>

<script setup lang="ts">
import { areaList } from '@vant/area-data'

const addressInfo = {
  name: '张三',
  tel: '13800138000',
  province: '浙江省',
  city: '杭州市',
  county: '西湖区',
  addressDetail: '文一西路 xxx 号',
  areaCode: '330106',
  postalCode: '310000',
  isDefault: false,
}

function onSave(content: any) {
  console.log('save', content)
}
function onDelete() {
  console.log('delete')
}
</script>
```

### Coupon（优惠券）

```vue
<template>
  <van-coupon-cell :coupons="coupons" :chosen-coupon="chosenCoupon" @click="show = true" />

  <van-popup v-model:show="show" round position="bottom" style="height: 90%">
    <van-coupon-list
      :coupons="coupons"
      :chosen-coupon="chosenCoupon"
      :disabled-coupons="disabledCoupons"
      @change="onChange"
    />
  </van-popup>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const show = ref(false)
const chosenCoupon = ref(-1)

const coupons = [
  {
    available: 1,
    condition: '无使用门槛\n最多优惠 12 元',
    reason: '',
    value: 150,
    name: '优惠券名称',
    startAt: Date.now() / 1000 - 7 * 86400,
    endAt: Date.now() / 1000,
    valueDesc: '1.5',
    unitDesc: '元',
  },
]
const disabledCoupons = []

function onChange(index: number) {
  show.value = false
  chosenCoupon.value = index
}
</script>
```

### SubmitBar（提交栏 / 结算栏）

```vue
<template>
  <van-submit-bar
    :price="3050"
    button-text="提交订单"
    safe-area-inset-bottom
    @submit="onSubmit"
  >
    <van-checkbox v-model="checked">全选</van-checkbox>
    <template #tip>
      你的收货地址不支持配送，<span @click="onClickLink">修改地址</span>
    </template>
  </van-submit-bar>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { showToast } from 'vant'

const checked = ref(false)

function onSubmit() {
  showToast('提交订单')
}
function onClickLink() {
  showToast('修改地址')
}
</script>
```

> **`price` 单位是分**——`3050` 表示 `30.50 元`、自动格式化为 `¥30.50`。

## 下一步

- [参考](./reference.md)：80+ 组件 props / events / slots / 命令式 API 签名速查、Composables、TypeScript 类型、CSS 变量入口
