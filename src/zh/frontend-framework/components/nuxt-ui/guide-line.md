---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 Nuxt UI 4.x（v4.x，**2026 年 2 月 v3 → v4 重写版本**）。包含 125+ 组件 12 大类速览、UForm 深度（Standard Schema + Zod / Valibot / Yup / Joi / Superstruct）、UTable 深度（TanStack Table v8）、Overlay 全套（Modal / Slideover / Drawer / Popover + useOverlay）、useToast / useColorMode 完整 API、主题深度（app.config.ts + Tailwind 4 + tv Variants）、i18n + RTL、AI Chat 组件、Dashboard 模板、v3 → v4 迁移、常见踩坑。

## 速查

- **组件按 12 大类**：Layout（8）+ Element（16）+ Form（20）+ Data（9）+ Navigation（8）+ Overlay（8）+ Page（23）+ Dashboard（10）+ AI Chat（8）+ Editor（6）+ Content（5）+ Color Mode（5）+ i18n（1）= **127 组件**
- **UForm 核心**：`<UForm :schema="zodSchema" :state="state" @submit="onSubmit">` + `<UFormField label="..." name="email">` + `FormSubmitEvent<Schema>` 类型
- **UTable 核心**：`<UTable :columns="columns" :data="data" v-model:pagination="pagination">` —— **columns 是 `TableColumn<T>` 类型的 JS 数组**（基于 TanStack Table v8）
- **Overlay 全套**：`<UModal>` / `<USlideover>` / `<UDrawer>` / `<UPopover>` / `<UTooltip>` —— 都用 `v-model:open` 控制
- **`useOverlay` 程序化**：`const overlay = useOverlay(); const modal = overlay.create(MyModal); const result = await modal.open(props)`
- **`useToast`**：`const toast = useToast(); toast.add({ title, description, color, icon, duration })`
- **暗色**：`@nuxtjs/color-mode` 自动注册（Nuxt）/ `useColorMode()` 切换 `<html class="dark">` 类
- **主题**：`app.config.ts` 的 `ui` 字段 + Tailwind 4 `@theme` 自定义颜色
- **i18n**：`import { zhCn } from '@nuxt/ui/locale'` + `<UApp :locale="zhCn">`
- **必须**：`<UApp>` 包根（Toast / Tooltip / Overlay 必需），Vue 项目 `index.html` 根 div 加 `class="isolate"`

## 125+ 组件分 12 大类速览

### Layout（布局，8）

页面整体布局组件——大部分来自原 Nuxt UI Pro，v4 起免费：

| 组件 | 标签 | 用途 |
|---|---|---|
| App | UApp | **必须包根**：OverlayProvider + ToastProvider + 主题注入 |
| Container | UContainer | 居中容器（max-width 响应式） |
| Header | UHeader | 页面顶部导航栏 |
| Footer | UFooter | 页面底部 |
| Main | UMain | 主内容区 |
| Sidebar | USidebar | 侧边栏布局 |
| Error | UError | 错误页布局 |
| Theme | UTheme | 主题包装（local theme 覆盖） |

### Element（元素，16）

通用基础元素组件：

| 组件 | 标签 | 用途 |
|---|---|---|
| Alert | UAlert | 警告提示条 |
| Avatar | UAvatar | 头像（src / icon / text） |
| AvatarGroup | UAvatarGroup | 头像组（max 限制） |
| Badge | UBadge | 徽章 / 标签 |
| Banner | UBanner | 横幅（顶部通知条） |
| Button | UButton | 按钮（color / variant / size / icon / loading） |
| Calendar | UCalendar | 日历组件 |
| Card | UCard | 卡片（header / body / footer 三段） |
| Chip | UChip | 数字 / 圆点 chip |
| Collapsible | UCollapsible | 可折叠区域 |
| FieldGroup | UFieldGroup | **v4 新名**（v3 叫 ButtonGroup）：表单元素组 |
| Icon | UIcon | 图标包裹器（i-lucide-* 等） |
| Kbd | UKbd | 键盘快捷键展示 |
| Progress | UProgress | 进度条（line / circle） |
| Separator | USeparator | 分割线（水平 / 垂直 + 文字） |
| Skeleton | USkeleton | 骨架屏 |

### Form（表单输入，20）

所有表单 / 输入类组件：

| 组件 | 标签 | 用途 |
|---|---|---|
| Form | UForm | **核心**：表单容器 + schema 校验 |
| FormField | UFormField | 表单字段（label + error 自动定位） |
| Input | UInput | 输入框（type / icon / clearable） |
| InputDate | UInputDate | 日期选择（自带 Calendar） |
| InputMenu | UInputMenu | 输入 + 下拉建议（Autocomplete） |
| InputNumber | UInputNumber | 数字输入（+/- 步进） |
| InputTags | UInputTags | 标签输入（动态 chip） |
| InputTime | UInputTime | 时间选择 |
| Textarea | UTextarea | 多行文本 |
| Select | USelect | 原生 HTML select（轻量） |
| SelectMenu | USelectMenu | 自定义下拉菜单（搜索 / 多选 / 虚拟列表） |
| Listbox | UListbox | 列表选择 |
| Checkbox | UCheckbox | 复选框 |
| CheckboxGroup | UCheckboxGroup | 复选框组 |
| RadioGroup | URadioGroup | 单选组 |
| Switch | USwitch | 开关 |
| Slider | USlider | 滑块（单值 / 范围） |
| PinInput | UPinInput | 验证码 / OTP 输入 |
| ColorPicker | UColorPicker | 颜色选择 |
| FileUpload | UFileUpload | 文件上传 |

### Data（数据展示，9）

只读 / 展示型组件：

| 组件 | 标签 | 用途 |
|---|---|---|
| Accordion | UAccordion | 折叠面板 |
| Carousel | UCarousel | 走马灯（Embla Carousel） |
| Empty | UEmpty | 空状态 |
| Marquee | UMarquee | 跑马灯 |
| ScrollArea | UScrollArea | 自定义滚动区 |
| Table | UTable | **核心**：表格（TanStack Table v8） |
| Timeline | UTimeline | 时间线 |
| Tree | UTree | 树（虚拟滚动 / 多选 / 异步加载） |
| User | UUser | 用户卡片（头像 + 名字 + 描述） |

### Navigation（导航，8）

页面导航组件：

| 组件 | 标签 | 用途 |
|---|---|---|
| Breadcrumb | UBreadcrumb | 面包屑 |
| CommandPalette | UCommandPalette | 命令面板（Cmd+K 风格搜索） |
| FooterColumns | UFooterColumns | 底部分栏导航 |
| Link | ULink | 链接（router-link / a 智能切换） |
| NavigationMenu | UNavigationMenu | 导航菜单（横向 / 纵向 / 多级） |
| Pagination | UPagination | 分页器 |
| Stepper | UStepper | 步骤条 |
| Tabs | UTabs | 标签页 |

### Overlay（弹层，8）

弹窗 / 提示类——**全部基于 Reka UI primitives + Portal**：

| 组件 | 标签 / API | 用途 |
|---|---|---|
| Modal | UModal | 模态对话框（center） |
| Slideover | USlideover | 抽屉式弹层（left/right/top/bottom） |
| Drawer | UDrawer | 抽屉（Vaul 风格） |
| Popover | UPopover | 弹出气泡（hover / click） |
| Tooltip | UTooltip | 文字提示 |
| ContextMenu | UContextMenu | 右键菜单 |
| DropdownMenu | UDropdownMenu | 下拉菜单 |
| Toast | UToast / useToast() | Toast 通知（Composable 调用） |

### Page（营销页，23）

营销 / 落地页组件（**v4 新免费**，原 Nuxt UI Pro 付费）：

| 组件 | 标签 | 用途 |
|---|---|---|
| Page | UPage | 完整页面布局 |
| PageHero | UPageHero | Hero 大图区 |
| PageSection | UPageSection | 内容段（含标题 + 描述） |
| PageHeader | UPageHeader | 页面标题区 |
| PageBody | UPageBody | 正文区 |
| PageAside | UPageAside | 侧栏（TOC） |
| PageAnchors | UPageAnchors | 锚点导航 |
| PageGrid | UPageGrid | 网格布局 |
| PageColumns | UPageColumns | 多列布局 |
| PageCard | UPageCard | 内容卡片 |
| PageCTA | UPageCTA | Call-to-Action |
| PageFeature | UPageFeature | 功能特性展示 |
| PageList | UPageList | 列表布局 |
| PageLogos | UPageLogos | Logo 墙（合作伙伴 / 客户） |
| PageLinks | UPageLinks | 链接组 |
| AuthForm | UAuthForm | **登录页一键搞定**（Email + 社交登录 + OAuth） |
| BlogPost | UBlogPost | 博客文章卡片 |
| BlogPosts | UBlogPosts | 博客列表 |
| ChangelogVersion | UChangelogVersion | 更新日志单条 |
| ChangelogVersions | UChangelogVersions | 更新日志列表 |
| PricingPlan | UPricingPlan | 价格方案卡片 |
| PricingPlans | UPricingPlans | 价格方案组 |
| PricingTable | UPricingTable | 价格对比表 |

### Dashboard（中后台，10）

后台 / Dashboard 布局组件（**v4 新免费**）：

| 组件 | 标签 | 用途 |
|---|---|---|
| DashboardGroup | UDashboardGroup | Dashboard 根容器 |
| DashboardSidebar | UDashboardSidebar | 侧边栏（可折叠） |
| DashboardSidebarToggle | UDashboardSidebarToggle | 侧栏折叠按钮 |
| DashboardSidebarCollapse | UDashboardSidebarCollapse | 侧栏全折叠按钮 |
| DashboardNavbar | UDashboardNavbar | 顶部导航 |
| DashboardPanel | UDashboardPanel | 主面板 |
| DashboardToolbar | UDashboardToolbar | 工具栏（filter + actions） |
| DashboardSearch | UDashboardSearch | 全局搜索（Cmd+K） |
| DashboardSearchButton | UDashboardSearchButton | 搜索触发按钮 |
| DashboardResizeHandle | UDashboardResizeHandle | 可调整分栏宽度 |

### AI Chat（AI 聊天，8）

AI 产品 UI 组件（**v4 新**，配合 Vercel AI SDK v5）：

| 组件 | 标签 | 用途 |
|---|---|---|
| ChatPrompt | UChatPrompt | AI 输入框（含 send 按钮 + 上传 + 模型选择） |
| ChatPromptSubmit | UChatPromptSubmit | 提交按钮（自动 loading） |
| ChatMessage | UChatMessage | 单条消息（user / assistant 角色） |
| ChatMessages | UChatMessages | 消息列表（自动滚动） |
| ChatReasoning | UChatReasoning | 推理过程展示（GPT-o1 / Claude reasoning） |
| ChatShimmer | UChatShimmer | 加载中骨架屏 |
| ChatTool | UChatTool | 工具调用展示 |
| ChatPalette | UChatPalette | 聊天命令面板 |

### Editor（富文本编辑器，6）

基于 TipTap 的富文本编辑器组件（v4 新）：

| 组件 | 标签 | 用途 |
|---|---|---|
| Editor | UEditor | 编辑器主容器（TipTap） |
| EditorToolbar | UEditorToolbar | 工具栏（粗体 / 斜体等） |
| EditorDragHandle | UEditorDragHandle | 拖拽手柄 |
| EditorEmojiMenu | UEditorEmojiMenu | Emoji 选择菜单 |
| EditorMentionMenu | UEditorMentionMenu | @ 提及菜单 |
| EditorSuggestionMenu | UEditorSuggestionMenu | / 命令建议菜单 |

### Content（文档，5）

配合 Nuxt Content 的组件：

| 组件 | 标签 | 用途 |
|---|---|---|
| ContentNavigation | UContentNavigation | 文档侧栏 |
| ContentSearch | UContentSearch | 文档搜索 |
| ContentSearchButton | UContentSearchButton | 搜索触发 |
| ContentSurround | UContentSurround | 上一篇 / 下一篇 |
| ContentToc | UContentToc | TOC 目录 |

### Color Mode（暗色模式，5）

暗色 / 亮色切换组件：

| 组件 | 标签 | 用途 |
|---|---|---|
| ColorModeButton | UColorModeButton | 一键切换按钮 |
| ColorModeSwitch | UColorModeSwitch | 切换开关 |
| ColorModeSelect | UColorModeSelect | 下拉选择（light / dark / system） |
| ColorModeAvatar | UColorModeAvatar | 主题感知头像（不同主题显示不同图） |
| ColorModeImage | UColorModeImage | 主题感知图片 |

### i18n（国际化，1）

| 组件 | 标签 | 用途 |
|---|---|---|
| LocaleSelect | ULocaleSelect | 语言下拉选择 |

## UForm 表单深度

UForm 是 Nuxt UI 最复杂、最高频使用的组件——配合 **[Standard Schema](https://github.com/standard-schema/standard-schema)** 规范支持多种校验库：

### 基础用法（Zod）

```vue
<template>
  <UForm
    :schema="schema"
    :state="state"
    class="space-y-4 max-w-md"
    @submit="onSubmit"
  >
    <UFormField label="姓名" name="name">
      <UInput v-model="state.name" class="w-full" />
    </UFormField>

    <UFormField label="邮箱" name="email" hint="必填" required>
      <UInput v-model="state.email" type="email" class="w-full" />
    </UFormField>

    <UFormField
      label="密码"
      name="password"
      description="至少 8 位字符"
    >
      <UInput v-model="state.password" type="password" class="w-full" />
    </UFormField>

    <UButton type="submit" color="primary" block>
      提交
    </UButton>
  </UForm>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { reactive } from 'vue'
import * as z from 'zod'

// Zod schema
const schema = z.object({
  name: z.string().min(2, '姓名至少 2 个字符'),
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(8, '密码至少 8 位字符'),
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  name: undefined,
  email: undefined,
  password: undefined,
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  // event.data 已通过 Zod 校验、类型为 Schema
  console.log(event.data)
  // await api.create(event.data)
}
</script>
```

**关键点**：

- `name="email"` 与 `state.email` 字段名一致——错误自动绑定到该 FormField
- `<UFormField>` 的 `label` / `hint` / `description` / `required` 自动渲染
- `FormSubmitEvent<Schema>` 提供完整类型推导

### 支持的校验库（Standard Schema）

Nuxt UI 通过 [Standard Schema](https://github.com/standard-schema/standard-schema) 规范支持五大主流校验库——**API 统一、随时切换**：

| 库 | 安装 | 优势 |
|---|---|---|
| **Zod** | `pnpm add zod` | **最流行**、TS 优先、生态最完整 |
| **Valibot** | `pnpm add valibot` | **最轻量**（30x 比 Zod 小）、tree-shaking 极佳 |
| **Yup** | `pnpm add yup` | 经典老牌、文档丰富 |
| **Joi** | `pnpm add joi` | Hapi 生态、复杂校验强 |
| **Superstruct** | `pnpm add superstruct` | 简洁 API |
| **Regle** | `pnpm add regle` | Vue 专属、响应式校验 |

#### Zod 示例

```ts
import * as z from 'zod'

const schema = z.object({
  email: z.string().email(),
  age: z.number().min(18, '年龄必须 ≥ 18').max(120),
  tags: z.array(z.string()).min(1, '至少 1 个标签'),
})
```

#### Valibot 示例

```ts
import * as v from 'valibot'

const schema = v.object({
  email: v.pipe(v.string(), v.email()),
  age: v.pipe(v.number(), v.minValue(18), v.maxValue(120)),
})
```

#### Yup 示例

```ts
import * as yup from 'yup'

const schema = yup.object({
  email: yup.string().email().required(),
  age: yup.number().min(18).max(120),
})
```

### 自定义校验函数

不依赖 schema 库时——用 `validate` prop 写函数：

```vue
<template>
  <UForm :validate="validate" :state="state" @submit="onSubmit">
    <UFormField label="用户名" name="username">
      <UInput v-model="state.username" />
    </UFormField>

    <UButton type="submit">提交</UButton>
  </UForm>
</template>

<script setup lang="ts">
import type { FormError } from '@nuxt/ui'
import { reactive } from 'vue'

const state = reactive({
  username: '',
})

function validate(state: any): FormError[] {
  const errors: FormError[] = []

  if (!state.username) {
    errors.push({ name: 'username', message: '请输入用户名' })
  }
  else if (state.username.length < 3) {
    errors.push({ name: 'username', message: '至少 3 字符' })
  }

  return errors
}

async function onSubmit(event: any) {
  console.log(event.data)
}
</script>
```

### 校验时机

`validateOn` prop 控制何时校验：

```vue
<UForm
  :schema="schema"
  :state="state"
  :validate-on="['blur', 'change']"
  :validate-on-input-delay="500"
>
  <!-- ... -->
</UForm>
```

| 时机 | 说明 |
|---|---|
| `input` | 输入时校验（防抖 300ms） |
| `change` | 值变更时校验 |
| `blur` | 失焦时校验 |

> **submit 时始终校验**——无论 `validateOn` 设置。

### 程序化校验 / 提交

通过 `useTemplateRef` 拿 form 实例：

```vue
<template>
  <UForm ref="form" :schema="schema" :state="state" @submit="onSubmit">
    <UFormField label="姓名" name="name">
      <UInput v-model="state.name" />
    </UFormField>
  </UForm>

  <!-- 外部按钮（modal 底部等） -->
  <UButton @click="handleSubmit">外部提交</UButton>
  <UButton @click="handleValidate">仅校验</UButton>
  <UButton @click="handleClear">清空错误</UButton>
</template>

<script setup lang="ts">
import { reactive, useTemplateRef } from 'vue'

const form = useTemplateRef('form')

const state = reactive({ name: '' })
const schema = /* ... */

const handleSubmit = async () => {
  // 触发 HTML5 + schema 校验 + 提交事件
  await form.value?.submit()
}

const handleValidate = async () => {
  // 仅校验、不触发 submit
  const errors = await form.value?.validate()
  console.log(errors)
}

const handleClear = () => {
  // 清空所有错误
  form.value?.clear()
}
</script>
```

### 错误事件 + 滚动到错误字段

```vue
<template>
  <UForm
    :schema="schema"
    :state="state"
    @submit="onSubmit"
    @error="onError"
  >
    <!-- ... -->
  </UForm>
</template>

<script setup lang="ts">
import type { FormErrorEvent } from '@nuxt/ui'

const onError = (event: FormErrorEvent) => {
  // 自动滚动到第一个错误字段
  if (event?.errors?.[0]?.id) {
    const element = document.getElementById(event.errors[0].id)
    element?.focus()
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}
</script>
```

### 嵌套表单（v4 新）

```vue
<template>
  <UForm :schema="schema" :state="state" @submit="onSubmit">
    <UFormField label="姓名" name="name">
      <UInput v-model="state.name" />
    </UFormField>

    <UCheckbox v-model="state.newsletter" label="订阅邮件" />

    <!-- 仅订阅时显示 + 校验 -->
    <UForm v-if="state.newsletter" :schema="emailSchema" :state="state" nested>
      <UFormField label="邮箱" name="email">
        <UInput v-model="state.email" />
      </UFormField>
    </UForm>

    <UButton type="submit">提交</UButton>
  </UForm>
</template>
```

> **v4 关键**：嵌套表单必须加 `nested` prop——v3 是自动的。

### 数组字段（动态列表）

```vue
<template>
  <UForm :schema="schema" :state="state" @submit="onSubmit">
    <UFormField name="tags" :error-pattern="/^tags\..+/">
      <UInputTags v-model="state.tags" />
    </UFormField>
  </UForm>
</template>

<script setup lang="ts">
import * as z from 'zod'

const schema = z.object({
  tags: z.array(z.string().min(2)).min(1, '至少 1 个标签'),
})
</script>
```

> **关键**：数组项错误的 path 是 `tags.0` / `tags.1`——用 `error-pattern` 正则捕获全部。

## UTable 表格深度

UTable 基于 [TanStack Table v8](https://tanstack.com/table)——**Vue UI 库中最强的表格实现**，含排序 / 筛选 / 分页 / 行选 / 列固定 / 虚拟化 / 树形等全套能力：

### 基础用法

```vue
<template>
  <UTable
    :data="data"
    :columns="columns"
    v-model:pagination="pagination"
    v-model:sorting="sorting"
    sticky
    class="flex-1"
  />
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { h, ref, resolveComponent } from 'vue'

// 在 template 中 resolveComponent 拿到组件引用
const UBadge = resolveComponent('UBadge')

interface Payment {
  id: string
  user: string
  amount: number
  status: 'paid' | 'pending' | 'failed'
  createdAt: string
}

const data = ref<Payment[]>([
  { id: '1', user: 'Alice', amount: 100, status: 'paid', createdAt: '2026-05-01' },
  { id: '2', user: 'Bob', amount: 250, status: 'pending', createdAt: '2026-05-02' },
  { id: '3', user: 'Charlie', amount: 500, status: 'failed', createdAt: '2026-05-03' },
])

const columns: TableColumn<Payment>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
  },
  {
    accessorKey: 'user',
    header: '用户',
  },
  {
    accessorKey: 'amount',
    header: '金额',
    cell: ({ row }) => {
      const amount = row.getValue('amount') as number
      return new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency: 'CNY',
      }).format(amount)
    },
    meta: {
      class: { th: 'text-right', td: 'text-right tabular-nums' },
    },
  },
  {
    accessorKey: 'status',
    header: '状态',
    cell: ({ row }) => {
      const status = row.getValue('status') as Payment['status']
      const color = {
        paid: 'success',
        pending: 'warning',
        failed: 'error',
      }[status] as 'success' | 'warning' | 'error'

      return h(UBadge, { color, variant: 'subtle' }, () => status)
    },
  },
  {
    accessorKey: 'createdAt',
    header: '创建时间',
  },
]

const pagination = ref({ pageIndex: 0, pageSize: 10 })
const sorting = ref([])
</script>
```

### TableColumn 类型完整结构

```ts
type TableColumn<T> = {
  // 数据 key（必需）
  accessorKey?: string

  // 表头
  header?: string | ((info: HeaderContext) => VNode | string)

  // 单元格渲染
  cell?: (info: CellContext<T, unknown>) => VNode | string

  // 表尾
  footer?: string | ((info: FooterContext) => VNode | string)

  // 启用排序
  enableSorting?: boolean

  // 启用列隐藏
  enableHiding?: boolean

  // 元数据（class / style / colspan）
  meta?: {
    class?: { th?: string; td?: string }
    style?: { th?: CSSProperties; td?: CSSProperties }
    colspan?: { td?: number | (() => number) }
    rowspan?: { td?: number | (() => number) }
  }

  // 列宽
  size?: number
  minSize?: number
  maxSize?: number
}
```

### 排序

```vue
<UTable
  :data="data"
  :columns="columns"
  v-model:sorting="sorting"
/>
```

```ts
import type { SortingState } from '@tanstack/vue-table'

const sorting = ref<SortingState>([
  { id: 'amount', desc: true },
])
```

> **column 中 `enableSorting: false`** 关闭单列排序。

### 筛选

#### 列筛选（每列独立）

```vue
<UTable
  :data="data"
  :columns="columns"
  v-model:column-filters="columnFilters"
/>
```

```ts
const columnFilters = ref([
  { id: 'status', value: 'paid' },
])
```

#### 全局筛选（搜索）

```vue
<UInput v-model="globalFilter" placeholder="搜索..." leading-icon="i-lucide-search" />

<UTable
  :data="data"
  :columns="columns"
  v-model:global-filter="globalFilter"
/>
```

### 分页

```vue
<UTable
  :data="data"
  :columns="columns"
  v-model:pagination="pagination"
/>

<UPagination
  v-model:page="page"
  :total="data.length"
  :items-per-page="pagination.pageSize"
/>
```

```ts
const pagination = ref({
  pageIndex: 0,
  pageSize: 10,
})

const page = computed({
  get: () => pagination.value.pageIndex + 1,
  set: (val) => (pagination.value.pageIndex = val - 1),
})
```

### 行选

```vue
<UTable
  :data="data"
  :columns="columns"
  v-model:row-selection="rowSelection"
  :row-id="(row: Payment) => row.id"
/>

<p>已选 {{ Object.keys(rowSelection).length }} 行</p>
```

```ts
const rowSelection = ref<Record<string, boolean>>({})
```

> **加 selection 列**：在 columns 中插入特殊列：

```ts
import { h, resolveComponent } from 'vue'

const UCheckbox = resolveComponent('UCheckbox')

const columns: TableColumn<Payment>[] = [
  {
    id: 'select',
    header: ({ table }) =>
      h(UCheckbox, {
        modelValue: table.getIsAllPageRowsSelected(),
        'onUpdate:modelValue': (value: boolean) =>
          table.toggleAllPageRowsSelected(!!value),
      }),
    cell: ({ row }) =>
      h(UCheckbox, {
        modelValue: row.getIsSelected(),
        'onUpdate:modelValue': (value: boolean) => row.toggleSelected(!!value),
      }),
    enableSorting: false,
  },
  // ...其他列
]
```

### 列固定（Pinning）

```vue
<UTable
  :data="data"
  :columns="columns"
  v-model:column-pinning="columnPinning"
/>
```

```ts
const columnPinning = ref({
  left: ['select', 'id'],   // 左侧固定列
  right: ['actions'],        // 右侧固定列
})
```

### 列可见性

```vue
<UTable
  :data="data"
  :columns="columns"
  v-model:column-visibility="columnVisibility"
/>
```

```ts
const columnVisibility = ref({
  id: true,
  email: true,
  amount: false,  // 隐藏 amount 列
})
```

### 虚拟化（10 万行性能）

```vue
<UTable
  :data="hugeData"
  :columns="columns"
  :virtualize="{ enabled: true, rowHeight: 40 }"
/>
```

### 可展开行

```vue
<UTable
  :data="data"
  :columns="columns"
  v-model:expanded="expanded"
>
  <template #expanded="{ row }">
    <div class="p-4 bg-elevated">
      <p>展开内容：{{ row.original }}</p>
    </div>
  </template>
</UTable>
```

```ts
const expanded = ref({})
```

### Loading 与 Empty

```vue
<UTable
  :data="data"
  :columns="columns"
  :loading="isLoading"
  empty="暂无数据"
/>
```

## Overlay 全套（Modal / Slideover / Drawer / Popover）

Nuxt UI 的弹层全部基于 **Reka UI primitives + Portal + Tailwind transitions**——`v-model:open` 统一控制。

### UModal 模态对话框

#### 声明式用法

```vue
<template>
  <UModal v-model:open="open" title="确认操作" description="此操作不可撤销">
    <UButton label="打开 Modal" />

    <template #body>
      <p>确定要删除这条记录吗？</p>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton color="neutral" variant="ghost" @click="open = false">
          取消
        </UButton>
        <UButton color="error" @click="confirm">
          确认删除
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const open = ref(false)

const confirm = () => {
  // 删除逻辑
  open.value = false
}
</script>
```

#### Modal 完整 props

| Prop | 类型 | 默认 | 说明 |
|---|---|---|---|
| `v-model:open` | boolean | - | 受控 open 状态 |
| `title` | string | - | 标题 |
| `description` | string | - | 描述 |
| `dismissible` | boolean | true | 点击遮罩 / Esc 关闭 |
| `fullscreen` | boolean | false | 全屏 |
| `transition` | boolean | true | 开启过渡动画 |
| `overlay` | boolean | true | 背景遮罩 |
| `modal` | boolean | true | 阻止外部交互 |
| `close` | boolean / object | true | 关闭按钮 |
| `closeIcon` | string | `i-lucide-x` | 关闭按钮图标 |
| `scrollable` | boolean | false | 内容可滚动 |
| `portal` | boolean | true | Portal 渲染 |

#### 程序化 Overlay API（推荐）

`useOverlay` Composable——**返回 Promise + 任意自定义组件**：

```vue
<!-- ConfirmModal.vue（自定义组件） -->
<template>
  <UModal :title="title" :description="description">
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton color="neutral" variant="ghost" @click="emit('close', false)">
          取消
        </UButton>
        <UButton color="error" @click="emit('close', true)">
          确认
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description: string
}>()

const emit = defineEmits<{
  close: [confirmed: boolean]
}>()
</script>
```

```vue
<!-- 使用方 -->
<template>
  <UButton @click="handleDelete">删除</UButton>
</template>

<script setup lang="ts">
import ConfirmModal from './ConfirmModal.vue'

const overlay = useOverlay()

const confirmModal = overlay.create(ConfirmModal)

const handleDelete = async () => {
  // 打开 Modal 并 await 结果
  const result = await confirmModal.open({
    title: '确认删除',
    description: '此操作不可撤销，确定继续吗？',
  })

  if (result) {
    console.log('用户确认了删除')
    // await api.delete(...)
  }
}
</script>
```

> **`useOverlay` 优势**：
>
> - **Promise 返回**：`await modal.open(props)` 直接拿结果
> - **任意自定义组件**：不绑死 UModal、可以传 USlideover 等任何 Overlay 组件
> - **类型安全**：TypeScript 自动推导 props 和 emit
> - **避免一堆 ref**：不用 `const open = ref(false)`

### USlideover 抽屉

```vue
<template>
  <USlideover v-model:open="open" side="right" title="编辑用户">
    <UButton label="打开 Slideover" />

    <template #body>
      <UForm :schema="schema" :state="state" id="user-form" @submit="onSubmit">
        <UFormField label="姓名" name="name">
          <UInput v-model="state.name" />
        </UFormField>

        <UFormField label="邮箱" name="email">
          <UInput v-model="state.email" />
        </UFormField>
      </UForm>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton color="neutral" variant="ghost" @click="open = false">
          取消
        </UButton>
        <!-- 外部按钮触发表单提交 -->
        <UButton color="primary" type="submit" form="user-form">
          保存
        </UButton>
      </div>
    </template>
  </USlideover>
</template>
```

#### Slideover props

| Prop | 默认 | 说明 |
|---|---|---|
| `side` | `right` | `left` / `right` / `top` / `bottom` |
| `inset` | false | 是否内缩边距 |
| 其他 | - | 同 UModal |

### UDrawer 抽屉（Vaul 风格）

类似 Slideover、但**动画更细腻**（移动端友好）：

```vue
<UDrawer v-model:open="open" title="移动端抽屉">
  <UButton label="打开" />

  <template #body>
    <p>Drawer 内容</p>
  </template>
</UDrawer>
```

### UPopover 弹出气泡

```vue
<template>
  <UPopover :content="{ side: 'bottom', align: 'start' }">
    <UButton label="打开 Popover" variant="subtle" />

    <template #content>
      <div class="p-4 w-64">
        <h4 class="font-semibold mb-2">用户偏好</h4>
        <p class="text-sm text-muted">这是一个 Popover 内容</p>
      </div>
    </template>
  </UPopover>

  <!-- hover 触发 -->
  <UPopover mode="hover" :open-delay="200" :close-delay="100">
    <UButton label="hover 我" />

    <template #content>
      <div class="p-3">hover 触发的 Popover</div>
    </template>
  </UPopover>
</template>
```

### UTooltip

```vue
<template>
  <UApp>
    <UTooltip text="点击保存（Cmd+S）" :delay-duration="100">
      <UButton icon="i-lucide-save" />
    </UTooltip>
  </UApp>
</template>
```

> **UTooltip 必须在 `<UApp>` 内**——UApp 内置 TooltipProvider。

## useToast 通知

### 基础用法

```vue
<script setup lang="ts">
const toast = useToast()

const showSuccess = () => {
  toast.add({
    title: '保存成功',
    description: '用户信息已更新',
    color: 'success',
    icon: 'i-lucide-check-circle',
    duration: 3000,
  })
}

const showError = () => {
  toast.add({
    title: '保存失败',
    description: '请检查网络连接',
    color: 'error',
    icon: 'i-lucide-x-circle',
  })
}

const showWithAction = () => {
  toast.add({
    title: '撤销操作',
    description: '已删除 3 条记录',
    actions: [
      {
        label: '撤销',
        color: 'neutral',
        variant: 'outline',
        click: () => {
          console.log('用户撤销了')
        },
      },
    ],
    duration: 5000,
  })
}
</script>
```

### 完整 API

```ts
const toast = useToast()

// 添加 Toast
toast.add({
  title: '标题',
  description: '描述',
  icon: 'i-lucide-info',
  color: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral',
  duration: 5000,            // ms，0 = 不自动关闭
  actions: [{ label, click }],
  click: () => {},           // 整体点击回调
  id: 'my-toast',            // 自定义 ID（用于 update）
})

// 删除单个
toast.remove('my-toast')

// 更新
toast.update('my-toast', { title: '新标题' })

// 清空全部
toast.clear()

// 读取当前所有 toast
const { toasts } = useToast()
console.log(toasts.value)
```

### 全局可访问

Toast Composable 通过 `<UApp>` 注入——**任意组件 / Pinia store / 异步逻辑都能用**：

```ts
// stores/user.ts
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', () => {
  const toast = useToast()

  const login = async (credentials) => {
    try {
      const user = await api.login(credentials)
      toast.add({ title: '登录成功', color: 'success' })
      return user
    }
    catch (error) {
      toast.add({ title: '登录失败', description: error.message, color: 'error' })
      throw error
    }
  }

  return { login }
})
```

> **关键**：在 Pinia store / 工具函数中用 `useToast()` 必须**整个 App 在 `<UApp>` 内**——否则 Composable 拿不到 ToastProvider 上下文。

## useColorMode 暗色模式

### 基础用法

```vue
<template>
  <ClientOnly>
    <UButton
      :icon="icon"
      variant="ghost"
      aria-label="切换主题"
      @click="toggle"
    />
  </ClientOnly>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const colorMode = useColorMode()

const icon = computed(() => {
  if (colorMode.value === 'dark') return 'i-lucide-moon'
  return 'i-lucide-sun'
})

const toggle = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>
```

### 完整 API

```ts
const colorMode = useColorMode()

// 当前主题（自动响应式 'light' | 'dark'）
console.log(colorMode.value)

// 用户偏好（'light' | 'dark' | 'system'）
console.log(colorMode.preference)

// 系统主题（'light' | 'dark'）
console.log(colorMode.system)

// 切换到暗色
colorMode.preference = 'dark'

// 跟随系统
colorMode.preference = 'system'
```

> **`colorMode.preference` 自动持久化到 localStorage**——重新打开浏览器仍生效。

### 现成组件

```vue
<!-- 一键切换按钮 -->
<UColorModeButton />

<!-- 开关 -->
<UColorModeSwitch />

<!-- 下拉选择（light / dark / system） -->
<UColorModeSelect />

<!-- 主题感知头像 -->
<UColorModeAvatar
  light="/avatar-light.png"
  dark="/avatar-dark.png"
/>

<!-- 主题感知图片 -->
<UColorModeImage
  light="/hero-light.png"
  dark="/hero-dark.png"
  alt="Hero"
/>
```

## 主题深度自定义

### app.config.ts 完整结构

```ts
// app.config.ts (Nuxt) / vite.config.ts ui() option (Vue)
export default defineAppConfig({
  ui: {
    // 1. 语义化色别名
    colors: {
      primary: 'green',       // 默认 green
      secondary: 'blue',
      success: 'green',
      info: 'blue',
      warning: 'yellow',
      error: 'red',
      neutral: 'slate',
    },

    // 2. 单组件主题覆盖
    button: {
      slots: {
        base: 'font-medium rounded-lg',  // 覆盖 base slot
      },
      variants: {
        size: {
          xl: {
            base: 'px-6 py-4 text-lg',  // 自定义 xl 尺寸
          },
        },
      },
      defaultVariants: {
        size: 'md',
        color: 'primary',
        variant: 'solid',
      },
    },

    // 3. 全局 icon 配置
    icons: {
      loading: 'i-lucide-loader-2',
      chevronDown: 'i-lucide-chevron-down',
      check: 'i-lucide-check',
      close: 'i-lucide-x',
    },

    // 4. 过渡动画
    theme: {
      transitions: true,        // 启用动画（默认）
      radius: 0.25,             // border-radius rem（影响所有组件）
    },
  },
})
```

### Tailwind 4 @theme 自定义颜色

`main.css`：

```css
@import "tailwindcss";
@import "@nuxt/ui";

/* 自定义品牌色 */
@theme static {
  --color-brand-50: #f0f9ff;
  --color-brand-100: #e0f2fe;
  --color-brand-200: #bae6fd;
  --color-brand-300: #7dd3fc;
  --color-brand-400: #38bdf8;
  --color-brand-500: #0ea5e9;
  --color-brand-600: #0284c7;
  --color-brand-700: #0369a1;
  --color-brand-800: #075985;
  --color-brand-900: #0c4a6e;
  --color-brand-950: #082f49;
}

/* 字体 */
@theme {
  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "Fira Code", monospace;
}
```

然后在 `app.config.ts` 引用：

```ts
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'brand',  // 引用上面定义的 --color-brand-*
    },
  },
})
```

### 单组件 ui prop 覆盖

每个组件支持 `ui` prop 直接覆盖样式：

```vue
<template>
  <UButton
    color="primary"
    :ui="{
      base: 'rounded-xl shadow-lg',
      label: 'font-bold',
    }"
  >
    自定义样式按钮
  </UButton>
</template>
```

> **`ui` prop 比 `app.config.ts` 优先级高**——单次覆盖、不影响全局。

### Tailwind Variants slot 列表

每个组件的 slot 结构在官方文档有 [Theme 一节](https://ui.nuxt.com/components/button#theme)——示例 UButton：

```ts
{
  slots: {
    base: '...',           // 主容器
    label: '...',          // 文字 label
    leadingIcon: '...',    // 前置 icon
    leadingAvatar: '...',  // 前置 avatar
    leadingAvatarSize: '...',
    trailingIcon: '...',   // 后置 icon
  },
  variants: {
    size: { xs, sm, md, lg, xl },
    color: { primary, secondary, ..., neutral },
    variant: { solid, outline, soft, subtle, ghost, link },
    block: { true: '...' },
    square: { true: '...' },
    loading: { true: '...' },
    disabled: { true: '...' },
  },
  compoundVariants: [
    { color: 'primary', variant: 'solid', class: '...' },
    // ...
  ],
}
```

## i18n + RTL

### 基础用法

```vue
<template>
  <UApp :locale="currentLocale">
    <NuxtPage />
  </UApp>
</template>

<script setup lang="ts">
import { en, zhCn } from '@nuxt/ui/locale'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

const currentLocale = computed(() => {
  return locale.value === 'zh-CN' ? zhCn : en
})
</script>
```

### RTL 双向

```vue
<template>
  <UApp :locale="arabicLocale">
    <NuxtPage />
  </UApp>
</template>

<script setup lang="ts">
import { ar } from '@nuxt/ui/locale'
// UApp 自动添加 dir="rtl" 到根元素
</script>
```

### 自定义 Locale

```ts
import { defineLocale, extendLocale } from '@nuxt/ui/locale'
import { en } from '@nuxt/ui/locale'

// 完全自定义
const myLocale = defineLocale({
  name: 'My Custom',
  code: 'mycl',
  dir: 'ltr',
  messages: {
    inputMenu: {
      noMatch: '没有匹配项',
      noData: '暂无数据',
    },
    // ... 其他组件的文案
  },
})

// 扩展现有 locale
const customZh = extendLocale(zhCn, {
  messages: {
    inputMenu: {
      noMatch: '哎呀，没找到',
    },
  },
})
```

## AI Chat 组件（v4 新）

配合 [Vercel AI SDK v5](https://sdk.vercel.ai/) + `ai` 包，搭出 ChatGPT 风格 UI：

### 基础聊天界面

```vue
<template>
  <div class="flex h-screen flex-col">
    <UChatMessages :messages="chat.messages">
      <template #message="{ message }">
        <UChatMessage
          :role="message.role"
          :content="message.content"
        />
      </template>
    </UChatMessages>

    <UChatPrompt v-model="input" @submit="onSubmit">
      <UChatPromptSubmit
        :status="chat.status"
        :disabled="!input.trim()"
      />
    </UChatPrompt>
  </div>
</template>

<script setup lang="ts">
import { Chat } from '@ai-sdk/vue'
import { ref } from 'vue'

const input = ref('')

// v4 用 Chat 类（v3 是 useChat()）
const chat = new Chat({
  api: '/api/chat',
})

const onSubmit = async () => {
  if (!input.value.trim()) return
  await chat.sendMessage({ text: input.value })
  input.value = ''
}
</script>
```

### 推理过程展示

```vue
<UChatReasoning :reasoning="message.reasoning" />
```

适用于 GPT-o1 / Claude Sonnet 4.5 等 reasoning 模型——展示模型的思考过程。

### 工具调用

```vue
<UChatTool
  :name="tool.name"
  :input="tool.input"
  :output="tool.output"
  :status="tool.status"
/>
```

展示 AI 工具调用的详细信息（function calling / MCP）。

详细 AI SDK v5 用法见 [AI SDK 文档](https://sdk.vercel.ai/docs)。

## Dashboard 模板（v4 新）

完整 Dashboard 布局——**v4 起免费开源**（原 Pro 付费内容）：

```vue
<template>
  <UDashboardGroup>
    <UDashboardSidebar
      collapsible
      resizable
      :resize-storage="resize"
      class="bg-elevated/25"
    >
      <template #header="{ collapsed }">
        <UDashboardSidebarCollapse
          v-if="collapsed"
          class="md:hidden"
        />

        <UTeamsMenu v-else />
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default" />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links"
          orientation="vertical"
        />
      </template>

      <template #footer="{ collapsed }">
        <UUserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <UDashboardPanel id="home">
      <template #header>
        <UDashboardNavbar title="仪表盘" :ui="{ right: 'gap-3' }">
          <template #leading>
            <UDashboardSidebarCollapse />
          </template>

          <template #right>
            <UColorModeButton />
            <UAvatar src="https://avatars.example.com/me.png" size="md" />
          </template>
        </UDashboardNavbar>

        <UDashboardToolbar>
          <UTabs :items="tabs" variant="link" />
        </UDashboardToolbar>
      </template>

      <template #body>
        <div class="grid gap-4 lg:grid-cols-4">
          <!-- 内容 -->
        </div>
      </template>
    </UDashboardPanel>
  </UDashboardGroup>
</template>

<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const resize = useState('dashboard-resize', () => ({ collapsed: false, width: 256 }))

const links: NavigationMenuItem[] = [
  { label: '首页', icon: 'i-lucide-home', to: '/' },
  { label: '客户', icon: 'i-lucide-users', to: '/customers' },
  { label: '订单', icon: 'i-lucide-shopping-cart', to: '/orders' },
  { label: '设置', icon: 'i-lucide-settings', to: '/settings' },
]
</script>
```

> **完整 Dashboard 模板**：`npm create nuxt@latest -- --no-modules -t ui-vue/dashboard` —— **一行命令拿到完整中后台骨架**。

## UAuthForm 一行登录页

```vue
<template>
  <UAuthForm
    :schema="schema"
    title="登录"
    description="使用你的邮箱登录账户"
    icon="i-lucide-lock"
    :fields="fields"
    :providers="providers"
    @submit="onSubmit"
  >
    <template #description>
      还没有账户？
      <ULink to="/signup" class="text-primary font-semibold">立即注册</ULink>
    </template>

    <template #footer>
      使用即表示同意我们的
      <ULink to="/terms" class="text-primary font-semibold">服务条款</ULink>
    </template>
  </UAuthForm>
</template>

<script setup lang="ts">
import * as z from 'zod'

const schema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(8, '密码至少 8 位'),
})

const fields = [
  {
    name: 'email',
    type: 'text' as const,
    label: '邮箱',
    placeholder: 'you@example.com',
  },
  {
    name: 'password',
    type: 'password' as const,
    label: '密码',
    placeholder: '••••••••',
  },
]

const providers = [
  {
    label: 'Google',
    icon: 'i-simple-icons-google',
    onClick: () => {/* OAuth */},
  },
  {
    label: 'GitHub',
    icon: 'i-simple-icons-github',
    onClick: () => {/* OAuth */},
  },
]

async function onSubmit(event: any) {
  console.log(event.data)
  // await api.login(event.data)
}
</script>
```

## 与 Vue Router + Pinia 集成

### Vue 项目完整 main.ts

```ts
import { createPinia } from 'pinia'
import ui from '@nuxt/ui/vue-plugin'
import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

import './assets/css/main.css'

import App from './App.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: () => import('./views/HomeView.vue') },
    { path: '/users', component: () => import('./views/UsersView.vue') },
  ],
})

const pinia = createPinia()

const app = createApp(App)
app.use(router)
app.use(pinia)
app.use(ui)
app.mount('#app')
```

### Layout 示例

```vue
<!-- App.vue -->
<template>
  <UApp :locale="zhCn">
    <UDashboardGroup>
      <UDashboardSidebar>
        <UNavigationMenu :items="menuItems" orientation="vertical" />
      </UDashboardSidebar>

      <UDashboardPanel>
        <template #header>
          <UDashboardNavbar :title="currentTitle">
            <template #right>
              <UColorModeButton />
            </template>
          </UDashboardNavbar>
        </template>

        <template #body>
          <RouterView />
        </template>
      </UDashboardPanel>
    </UDashboardGroup>
  </UApp>
</template>

<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { zhCn } from '@nuxt/ui/locale'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const menuItems: NavigationMenuItem[] = [
  { label: '首页', icon: 'i-lucide-home', to: '/' },
  { label: '用户管理', icon: 'i-lucide-users', to: '/users' },
]

const currentTitle = computed(() => {
  const titles: Record<string, string> = {
    '/': '首页',
    '/users': '用户管理',
  }
  return titles[route.path] || ''
})
</script>
```

### Pinia 中用 useToast

```ts
// stores/user.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const toast = useToast()
  const user = ref(null)

  const login = async (credentials) => {
    try {
      const data = await fetch('/api/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }).then((r) => r.json())

      user.value = data
      toast.add({ title: '登录成功', color: 'success' })
    }
    catch (e) {
      toast.add({ title: '登录失败', color: 'error' })
    }
  }

  return { user, login }
})
```

## 命令面板（Cmd+K）

```vue
<template>
  <UButton
    icon="i-lucide-search"
    label="搜索..."
    color="neutral"
    variant="subtle"
    :ui="{ trailing: 'ms-auto' }"
    @click="open = true"
  >
    <template #trailing>
      <UKbd value="meta" />
      <UKbd value="K" />
    </template>
  </UButton>

  <UModal v-model:open="open" :ui="{ content: 'sm:max-w-md' }">
    <template #content>
      <UCommandPalette
        v-model:search-term="search"
        :groups="groups"
        :loading="loading"
        @update:model-value="onSelect"
      />
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const open = ref(false)
const search = ref('')
const loading = ref(false)

// Cmd+K 全局快捷键
defineShortcuts({
  meta_k: () => {
    open.value = true
  },
})

const groups = computed(() => [
  {
    id: 'pages',
    label: '页面',
    items: [
      { label: '首页', icon: 'i-lucide-home', to: '/' },
      { label: '用户', icon: 'i-lucide-users', to: '/users' },
    ],
  },
  {
    id: 'actions',
    label: '操作',
    items: [
      { label: '新建用户', icon: 'i-lucide-user-plus', onSelect: () => {/* ... */} },
    ],
  },
])

const onSelect = (item: any) => {
  open.value = false
  if (item.to) navigateTo(item.to)
  if (item.onSelect) item.onSelect()
}
</script>
```

## defineShortcuts 全局快捷键

```ts
defineShortcuts({
  // Cmd+K（macOS）/ Ctrl+K（Windows / Linux）
  meta_k: () => {
    console.log('打开搜索')
  },

  // 单键
  '?': () => {
    console.log('显示帮助')
  },

  // 组合键
  'ctrl_shift_d': () => {
    console.log('Ctrl+Shift+D')
  },

  // 序列键（g 然后 d）
  'g-d': () => {
    console.log('go to dashboard')
  },

  // 高级配置：输入框中也触发
  enter: {
    handler: () => console.log('Enter'),
    usingInput: true,
  },
})
```

> **特性**：
>
> - `meta` 自动跨平台（macOS Cmd / Windows Ctrl）
> - 支持序列键（Vim 风格 `g-d`）
> - `usingInput` 控制是否在输入框中触发
> - 基于 VueUse 的 `useEventListener`、性能优秀

## v3 → v4 迁移

### 1. 包结构合并

```bash
# 移除旧包
pnpm remove @nuxt/ui @nuxt/ui-pro

# 装新包
pnpm add @nuxt/ui tailwindcss
```

```diff
# nuxt.config.ts
- modules: ['@nuxt/ui', '@nuxt/ui-pro']
+ modules: ['@nuxt/ui']
```

```diff
/* main.css */
- @import "tailwindcss";
- @import "@nuxt/ui-pro";
- @import "@nuxt/ui";
+ @import "tailwindcss";
+ @import "@nuxt/ui";
```

### 2. Tailwind 4 强制升级

```diff
- @tailwind base;
- @tailwind components;
- @tailwind utilities;
+ @import "tailwindcss";
+ @import "@nuxt/ui";
```

`tailwind.config.js` 删除——主题搬到 CSS 中的 `@theme` 指令。

### 3. 组件改名

| v3 | v4 |
|---|---|
| `<UButtonGroup>` | `<UFieldGroup>` |
| `<UPageMarquee>` | `<UMarquee>` |
| `<UPageAccordion>` | 移除（用 `<UAccordion>`） |

### 4. Form 行为变化

```diff
- <UInput v-model.nullify="state.email" />
+ <UInput v-model.nullable="state.email" />
```

嵌套 Form 必须加 `nested` prop：

```diff
- <UForm :state="state" :schema="schema">
+ <UForm :state="state" :schema="schema" nested>
```

### 5. AI Chat 升级到 SDK v5

```diff
- import { useChat } from '@ai-sdk/vue'
+ import { Chat } from '@ai-sdk/vue'

- const { messages, input, handleSubmit } = useChat({ api: '/api/chat' })
+ const chat = new Chat({ api: '/api/chat' })
```

Message 结构变化：

```diff
- message.content
+ message.parts
```

```diff
- <MDC :value="message.content" />
+ <Comark :value="message.content" />
```

### 6. Nuxt 4 必须

v4 必须 Nuxt 4——Nuxt 3 项目不能用 Nuxt UI v4，要先升级 Nuxt 框架。

详细完整迁移见 [v4 迁移官方文档](https://ui.nuxt.com/getting-started/migration/v4)。

## 常见踩坑

### `<UApp>` 包根没加 / `class="isolate"` 没加

**症状**：Toast / Tooltip / 程序化 Overlay 完全不工作 / Modal 渲染位置错乱

**原因**：

- `<UApp>` 内置 OverlayProvider + ToastProvider + TooltipProvider —— **不包根则所有相关组件失效**
- Vue 项目 `index.html` 根 div 必须 `class="isolate"` —— 否则 Tailwind 4 的 `isolate` 隔离丢失、z-index / Portal 冲突

**解决**：

```vue
<!-- App.vue -->
<template>
  <UApp>
    <RouterView />
  </UApp>
</template>
```

```html
<!-- index.html -->
<div id="app" class="isolate"></div>
```

### Tailwind 4 没装 / @tailwind directives 没改

**症状**：所有样式失效 / 构建报错 `Module @tailwind not found`

**原因**：v4 必须 Tailwind 4，`@tailwind` directives 已废弃。

**解决**：

```bash
pnpm add tailwindcss@latest
```

```diff
- @tailwind base;
- @tailwind components;
- @tailwind utilities;
+ @import "tailwindcss";
+ @import "@nuxt/ui";
```

### Pinia / Vue Router 守卫中 useToast 报错

**症状**：`No active instance found` / Toast 不显示

**原因**：Composable 必须在**组件 setup** 内调用——Pinia store / 守卫不是 setup 上下文。

**解决**：

```ts
// 错误：Pinia store 顶层调用
import { useToast } from '#imports'
const toast = useToast()  // 报错

// 正确：在 store 函数内调用（仍是 Composable 上下文）
export const useUserStore = defineStore('user', () => {
  const toast = useToast()  // OK，Pinia setup store 内部

  const login = async () => {
    toast.add({ title: '登录中...' })
  }

  return { login }
})
```

> **Vue Router 守卫**中不能直接用——通过 Pinia store 中转、或在守卫触发后的页面组件中调用。

### 主题色不生效

**症状**：`<UButton color="primary">` 仍是默认绿色

**原因**：

- `app.config.ts` 没改 `ui.colors.primary`
- 自定义 `@theme` 色没在 `app.config.ts` 中映射

**解决**：

```css
/* main.css */
@theme static {
  --color-brand-500: #0ea5e9;
}
```

```ts
// app.config.ts
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'brand',  // 必须映射
    },
  },
})
```

### `i-lucide-*` 图标不显示

**症状**：图标位置空白

**原因**：

- pnpm 严格依赖隔离下 `@nuxt/icon` 找不到 `@iconify-json/lucide`
- 或离线环境无法访问 Iconify CDN

**解决**：

```bash
pnpm add @iconify-json/lucide
```

> Nuxt UI 默认依赖 Lucide——但生产构建强烈推荐显式装 `@iconify-json/lucide`，避免运行时去 CDN 拉。

### Vue 项目暗色模式默认开 + 影响样式

**症状**：所有页面默认是暗色 / `<html class="dark">` 一直存在

**原因**：Vue 项目 v4 默认 `colorMode: true`——`@nuxtjs/color-mode` 自动启用。

**解决方法 1**：跟随系统（默认行为）

无需配置，自动 prefer-color-scheme。

**解决方法 2**：完全禁用

```ts
// vite.config.ts
import ui from '@nuxt/ui/vite'

export default defineConfig({
  plugins: [
    vue(),
    ui({
      colorMode: false,
    }),
  ],
})
```

### v3 → v4 升级后 `<UButtonGroup>` 报 unknown component

**症状**：`Failed to resolve component: UButtonGroup`

**原因**：v4 改名为 `<UFieldGroup>`。

**解决**：

```diff
- <UButtonGroup>
+ <UFieldGroup>
    <UButton>左</UButton>
    <UButton>中</UButton>
    <UButton>右</UButton>
- </UButtonGroup>
+ </UFieldGroup>
```

### Vue 项目 main.ts 中 ui 插件位置错

**症状**：组件不渲染 / 主题不生效

**原因**：`app.use(ui)` 必须在 `app.use(router)` 等之后、`app.mount('#app')` 之前。

**解决**：

```ts
const app = createApp(App)
app.use(router)
app.use(pinia)
app.use(ui)         // 在 mount 前
app.mount('#app')
```

### UTable 不显示

**症状**：UTable 渲染空白 / 报错 `columns is required`

**原因**：

- `columns` 必须是 `TableColumn<T>[]` 类型——不能传普通对象
- `data` 必须是数组

**解决**：

```ts
import type { TableColumn } from '@nuxt/ui'

const columns: TableColumn<Payment>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'amount', header: '金额' },
]
```

## 下一步

到这里你已经掌握了 Nuxt UI v4 的所有核心组件 / API / 主题 / 国际化——下一步：

- [参考](./reference.md)：**API 速查** / 127 组件分类列表 / 常用 props 表 / Composable 签名 / TypeScript 类型 / `defineAppConfig` 主题完整结构 / 50+ 语言列表 / Lucide / Iconify 图标包对照
