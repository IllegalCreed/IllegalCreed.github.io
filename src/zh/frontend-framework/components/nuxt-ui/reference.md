---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Nuxt UI 4.x（**2026 年 2 月 v3 → v4 重写**）。本页是**速查工具**——包含 125+ 组件列表、常用 props 表、Composable 签名、TypeScript 类型、`defineAppConfig` 主题结构、50+ 语言列表、Lucide / Iconify 图标包对照。

## 速查

- **组件命名**：`<UButton>` / `<UInput>` / `<UForm>` 等（默认前缀 `U`，可通过 `prefix: 'Nuxt'` 改成 `<NuxtButton>`）
- **Composable**：`useToast` / `useOverlay` / `useColorMode` / `defineShortcuts` / `useFormGroup` / `useFormField`
- **核心 TS 类型**：`FormSubmitEvent<T>` / `FormError` / `TableColumn<T>` / `DropdownMenuItem` / `NavigationMenuItem` / `SelectItem` / `TabsItem`
- **必装包**：`@nuxt/ui` + `tailwindcss`（**必装**）
- **自动注册模块**：`@nuxt/icon` + `@nuxt/fonts` + `@nuxtjs/color-mode`（Nuxt 项目）
- **Vue 项目**：`@nuxt/ui/vite` 插件 + `@nuxt/ui/vue-plugin` + `index.html` 根 div 加 `class="isolate"`
- **i18n**：`import { zhCn } from '@nuxt/ui/locale'`
- **必须**：`<UApp>` 包根（Toast / Tooltip / 程序化 Overlay 必需）

## 125+ 组件分类速查

### Layout（布局，8）

| 组件 | 标签 | 常用 props |
|---|---|---|
| App | UApp | `locale` / `tooltip` / `toaster` / `portal` |
| Container | UContainer | （Tailwind 类） |
| Header | UHeader | `to` / `title` / `ui` |
| Footer | UFooter | `ui` |
| Main | UMain | `ui` |
| Sidebar | USidebar | `collapsible` / `collapsed-width` / `width` |
| Error | UError | `error`（必需） / `redirect` / `clear` |
| Theme | UTheme | （Tailwind Variants 主题包装） |

### Element（元素，16）

| 组件 | 标签 | 常用 props |
|---|---|---|
| Alert | UAlert | `title` / `description` / `icon` / `avatar` / `color` / `variant` / `orientation` / `actions` / `close` |
| Avatar | UAvatar | `src` / `alt` / `icon` / `text` / `size` / `chip` |
| AvatarGroup | UAvatarGroup | `max` / `size` |
| Badge | UBadge | `label` / `color` / `variant`（solid/outline/soft/subtle） / `size` / `square` / `icon` / `leading` / `trailing` |
| Banner | UBanner | `id` / `title` / `actions` / `close` / `to` |
| Button | UButton | `label` / `color` / `variant`（solid/outline/soft/subtle/ghost/link） / `size` / `icon` / `loading` / `loading-auto` / `loading-icon` / `square` / `block` / `disabled` / `to` / `target` / `active-color` / `active-variant` |
| Calendar | UCalendar | `v-model` / `min-value` / `max-value` / `range` / `multiple` / `number-of-months` / `disabled` |
| Card | UCard | `variant`（solid/outline/soft/subtle） / `ui` |
| Chip | UChip | `text` / `color` / `size` / `position`（top-right 等） / `inset` / `standalone` |
| Collapsible | UCollapsible | `v-model:open` / `disabled` / `unmount-on-hide` |
| FieldGroup | UFieldGroup | `size` / `orientation`（horizontal/vertical） |
| Icon | UIcon | `name`（必需，如 `i-lucide-home`） |
| Kbd | UKbd | `value` / `size` / `variant` |
| Progress | UProgress | `v-model` / `max` / `status` / `color` / `size` / `orientation`（horizontal/vertical） / `indeterminate` |
| Separator | USeparator | `label` / `icon` / `avatar` / `color` / `type`（solid/dashed/dotted） / `size` / `orientation` |
| Skeleton | USkeleton | （Tailwind 类） |

### Form（表单输入，20）

| 组件 | 标签 | 常用 props |
|---|---|---|
| Form | UForm | `state` / `schema` / `validate` / `validate-on` / `validate-on-input-delay` / `disabled` / `nested` / `loading-auto` |
| FormField | UFormField | `name` / `label` / `description` / `hint` / `help` / `required` / `error` / `error-pattern` / `size` |
| Input | UInput | `v-model` / `type`（text/email/password/number/...） / `placeholder` / `color` / `variant`（outline/soft/subtle/ghost/none） / `size` / `icon` / `leading-icon` / `trailing-icon` / `loading` / `disabled` / `autofocus` / `required` / `readonly` / `maxlength` / `pattern` / `step` |
| InputDate | UInputDate | `v-model` / `placeholder` / `min-value` / `max-value` / `granularity`（day/hour/minute/second） |
| InputMenu | UInputMenu | `v-model` / `items` / `multiple` / `loading` / `value-key` / `label-key` |
| InputNumber | UInputNumber | `v-model` / `min` / `max` / `step` / `format-options` / `disabled` |
| InputTags | UInputTags | `v-model` / `placeholder` / `max` / `delimiter`（分隔符） |
| InputTime | UInputTime | `v-model` / `hour-cycle`（12/24） / `granularity` |
| Textarea | UTextarea | `v-model` / `rows` / `autoresize` / `maxrows` / 其他同 UInput |
| Select | USelect | `v-model` / `items`（**必需**） / `multiple` / `value-key` / `label-key` / `placeholder` / `icon` / `trailing-icon` / `disabled` / `loading` |
| SelectMenu | USelectMenu | 同 USelect + `searchable` / `searchable-placeholder` / `create-item` / `filter`（自定义筛选） |
| Listbox | UListbox | `v-model` / `items` / `multiple` |
| Checkbox | UCheckbox | `v-model` / `label` / `description` / `icon` / `indeterminate` / `color` / `variant`（card/list） / `size` / `indicator`（start/end/hidden） / `disabled` / `required` |
| CheckboxGroup | UCheckboxGroup | `v-model` / `items` / `orientation` |
| RadioGroup | URadioGroup | `v-model` / `items` / `orientation` |
| Switch | USwitch | `v-model` / `label` / `description` / `icon` / `unchecked-icon` / `checked-icon` / `color` / `size` |
| Slider | USlider | `v-model` / `min` / `max` / `step` / `color` / `size` / `orientation` |
| PinInput | UPinInput | `v-model` / `length` / `mask` / `placeholder` / `type` |
| ColorPicker | UColorPicker | `v-model` / `disabled` / `format`（hex/rgb/hsl） |
| FileUpload | UFileUpload | `v-model` / `accept` / `multiple` / `disabled` / `max-size` |

### Data（数据展示，9）

| 组件 | 标签 | 常用 props |
|---|---|---|
| Accordion | UAccordion | `items` / `type`（single/multiple） / `collapsible` / `disabled` / `unmount-on-hide` |
| Carousel | UCarousel | `items` / `loop` / `autoplay` / `arrows` / `dots` / `align` |
| Empty | UEmpty | `title` / `description` / `icon` / `actions` |
| Marquee | UMarquee | `direction` / `pause-on-hover` / `reverse` / `speed` |
| ScrollArea | UScrollArea | `type`（auto/always/scroll/hover） / `dir` |
| Table | UTable | `data` / `columns`（**必需**） / `v-model:sorting` / `v-model:column-filters` / `v-model:global-filter` / `v-model:pagination` / `v-model:row-selection` / `v-model:expanded` / `v-model:column-visibility` / `v-model:column-pinning` / `sticky` / `loading` / `empty` / `virtualize` / `row-id` |
| Timeline | UTimeline | `items` / `orientation` |
| Tree | UTree | `items` / `v-model:expanded` / `multiple` / `value-key` / `label-key` / `children-key` |
| User | UUser | `name` / `description` / `avatar` / `chip` / `orientation` |

### Navigation（导航，8）

| 组件 | 标签 | 常用 props |
|---|---|---|
| Breadcrumb | UBreadcrumb | `items` / `separator-icon` |
| CommandPalette | UCommandPalette | `groups` / `v-model` / `v-model:search-term` / `placeholder` / `loading` / `close` / `fuse`（fuzzy 搜索配置） |
| FooterColumns | UFooterColumns | `columns` |
| Link | ULink | `to` / `href` / `target` / `active` / `exact-active-class` / `external` |
| NavigationMenu | UNavigationMenu | `items` / `orientation`（horizontal/vertical） / `variant`（pill/link） / `highlight` / `highlight-color` / `collapsed` / `tooltip` / `popover` / `arrow` |
| Pagination | UPagination | `v-model:page` / `total` / `items-per-page` / `sibling-count` / `show-edges` / `show-controls` / `color` / `variant` / `size` / `active-color` / `active-variant` |
| Stepper | UStepper | `v-model` / `items` / `orientation` / `linear` / `disabled` |
| Tabs | UTabs | `v-model` / `items` / `orientation` / `variant`（pill/link） / `color` / `size` |

### Overlay（弹层，8）

| 组件 | 标签 / API | 常用 props |
|---|---|---|
| Modal | UModal | `v-model:open` / `title` / `description` / `dismissible` / `fullscreen` / `transition` / `overlay` / `modal` / `close` / `close-icon` / `scrollable` / `portal` |
| Slideover | USlideover | `v-model:open` / `side`（left/right/top/bottom） / `title` / `description` / `dismissible` / `modal` / `overlay` / `transition` / `inset` / `close` / `close-icon` |
| Drawer | UDrawer | `v-model:open` / `direction` / `dismissible` / `should-scale-background` / `set-background-color-on-scale` |
| Popover | UPopover | `v-model:open` / `mode`（click/hover） / `content`（{side, align}） / `arrow` / `modal` / `open-delay` / `close-delay` / `dismissible` / `portal` |
| Tooltip | UTooltip | `text` / `kbds` / `arrow` / `content` / `delay-duration` / `disable-hoverable-content` |
| ContextMenu | UContextMenu | `items` / `disabled` |
| DropdownMenu | UDropdownMenu | `items` / `content`（{side, align}） / `arrow` / `disabled` |
| Toast | UToast / useToast() | `title` / `description` / `icon` / `color` / `duration` / `actions` / `click` |

### Page（营销页，23）

| 组件 | 标签 | 用途 |
|---|---|---|
| Page | UPage | 完整页面布局 |
| PageHero | UPageHero | `title` / `description` / `links` / `headline` / `orientation` |
| PageSection | UPageSection | `title` / `description` / `headline` / `links` / `features` |
| PageHeader | UPageHeader | `title` / `description` / `headline` / `links` |
| PageBody | UPageBody | `prose` |
| PageAside | UPageAside | （TOC 容器） |
| PageAnchors | UPageAnchors | `links` |
| PageGrid | UPageGrid | `items` |
| PageColumns | UPageColumns | （多列） |
| PageCard | UPageCard | `title` / `description` / `icon` / `to` |
| PageCTA | UPageCTA | `title` / `description` / `links` / `card`（边框样式） |
| PageFeature | UPageFeature | `icon` / `title` / `description` |
| PageList | UPageList | `items` |
| PageLogos | UPageLogos | `logos` |
| PageLinks | UPageLinks | `links` |
| AuthForm | UAuthForm | `schema` / `fields` / `providers` / `title` / `description` / `icon` / `submit` |
| BlogPost | UBlogPost | `title` / `description` / `image` / `date` / `to` |
| BlogPosts | UBlogPosts | `posts` / `orientation` |
| ChangelogVersion | UChangelogVersion | `version` / `date` / `description` |
| ChangelogVersions | UChangelogVersions | `versions` |
| PricingPlan | UPricingPlan | `title` / `description` / `price` / `features` / `button` / `highlight` |
| PricingPlans | UPricingPlans | `plans` |
| PricingTable | UPricingTable | `tiers` / `sections` |

### Dashboard（中后台，10）

| 组件 | 标签 | 用途 |
|---|---|---|
| DashboardGroup | UDashboardGroup | 根容器 |
| DashboardSidebar | UDashboardSidebar | `collapsible` / `resizable` / `resize-storage` / `min-width` / `max-width` / `default-width` |
| DashboardSidebarToggle | UDashboardSidebarToggle | （切换按钮） |
| DashboardSidebarCollapse | UDashboardSidebarCollapse | （全折叠） |
| DashboardNavbar | UDashboardNavbar | `title` / `description` / `icon` / `toggle` |
| DashboardPanel | UDashboardPanel | `id` / `collapsible` / `resizable` |
| DashboardToolbar | UDashboardToolbar | （子容器） |
| DashboardSearch | UDashboardSearch | `groups` / `placeholder` / `shortcut` |
| DashboardSearchButton | UDashboardSearchButton | `kbds` / `collapsed` |
| DashboardResizeHandle | UDashboardResizeHandle | （调整宽度） |

### AI Chat（AI 聊天，8）

| 组件 | 标签 | 用途 |
|---|---|---|
| ChatPrompt | UChatPrompt | `v-model` / `placeholder` / `disabled` |
| ChatPromptSubmit | UChatPromptSubmit | `status`（submitted/streaming/ready/error） |
| ChatMessage | UChatMessage | `role`（user/assistant/system） / `content` / `avatar` |
| ChatMessages | UChatMessages | `messages` / `auto-scroll` |
| ChatReasoning | UChatReasoning | `reasoning` |
| ChatShimmer | UChatShimmer | （加载骨架屏） |
| ChatTool | UChatTool | `name` / `input` / `output` / `status` |
| ChatPalette | UChatPalette | （命令面板） |

### Editor（编辑器，6）

| 组件 | 标签 | 用途 |
|---|---|---|
| Editor | UEditor | `v-model` / `extensions` / `placeholder` |
| EditorToolbar | UEditorToolbar | （工具栏） |
| EditorDragHandle | UEditorDragHandle | （拖拽） |
| EditorEmojiMenu | UEditorEmojiMenu | （emoji） |
| EditorMentionMenu | UEditorMentionMenu | （@ 提及） |
| EditorSuggestionMenu | UEditorSuggestionMenu | （/ 命令） |

### Content（文档，5）

| 组件 | 标签 | 用途 |
|---|---|---|
| ContentNavigation | UContentNavigation | `navigation` / `default-open` |
| ContentSearch | UContentSearch | `groups` / `files` |
| ContentSearchButton | UContentSearchButton | `kbds` |
| ContentSurround | UContentSurround | `surround`（{prev, next}） |
| ContentToc | UContentToc | `links` / `title` |

### Color Mode（5）

| 组件 | 标签 | 用途 |
|---|---|---|
| ColorModeButton | UColorModeButton | （一键切换） |
| ColorModeSwitch | UColorModeSwitch | （开关） |
| ColorModeSelect | UColorModeSelect | （下拉） |
| ColorModeAvatar | UColorModeAvatar | `light` / `dark` |
| ColorModeImage | UColorModeImage | `light` / `dark` / `alt` |

### i18n（1）

| 组件 | 标签 | 用途 |
|---|---|---|
| LocaleSelect | ULocaleSelect | （语言下拉，自动绑 Nuxt i18n） |

## Composable API（命令式）

### useToast

```ts
const toast = useToast()

// 添加
toast.add({
  title: 'string',
  description: 'string',
  icon: 'i-lucide-info',
  color: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral',
  duration: 5000,
  actions: [
    {
      label: 'string',
      icon: 'string',
      color: 'string',
      variant: 'string',
      click: () => void,
    },
  ],
  click: () => void,
  id: 'unique-id',
})

// 删除单个
toast.remove(id: string | number)

// 更新
toast.update(id: string | number, props: Partial<ToastOptions>)

// 清空全部
toast.clear()

// 读取列表（响应式）
const { toasts } = useToast()
console.log(toasts.value)
```

### useOverlay

```ts
const overlay = useOverlay()

// 创建（一次注册）
const myModal = overlay.create(MyModalComponent, {
  props: { title: '默认标题' },
})

// 打开（返回 Promise）
const result = await myModal.open({
  // 覆盖 create 时的 props
  title: '新标题',
})

// 关闭并传值（在 Modal 内部调用 emit('close', value)）
emit('close', valueToResolve)

// 修改 props
myModal.patch({ title: '更新后' })
```

**完整签名**：

```ts
interface UseOverlayReturn {
  create: <T>(component: Component, options?: { props?: T }) => OverlayInstance<T>
  overlays: Ref<OverlayInstance<any>[]>
}

interface OverlayInstance<T> {
  open: (props?: Partial<T>) => Promise<unknown>
  close: (value?: unknown) => void
  patch: (props: Partial<T>) => void
  isOpen: Ref<boolean>
}
```

### useColorMode

```ts
const colorMode = useColorMode()

// 当前生效主题（响应式 'light' | 'dark'）
colorMode.value

// 用户偏好（'light' | 'dark' | 'system'）
colorMode.preference

// 系统主题（自动监听）
colorMode.system

// 切换
colorMode.preference = 'dark'
```

### defineShortcuts

```ts
defineShortcuts({
  // 单键
  '?': () => void,

  // 修饰键组合（_ 分隔）
  meta_k: () => void,           // Cmd+K（macOS）/ Ctrl+K（其他）
  ctrl_shift_d: () => void,

  // 序列键（- 分隔，Vim 风格）
  'g-d': () => void,            // 按 g 然后 d

  // 高级配置
  enter: {
    handler: () => void,
    usingInput: true | false | 'specific-input-name',
  },
})
```

**修饰键**：

| Key | Mac | Windows / Linux |
|---|---|---|
| `meta` | Cmd | Ctrl（自动转换） |
| `ctrl` | Ctrl | Ctrl |
| `shift` | Shift | Shift |
| `alt` | Option | Alt |

**特殊键**：`escape` / `enter` / `arrowleft` / `arrowright` / `arrowup` / `arrowdown` / `space` / `tab` / `backspace`

### useFormField

在自定义表单组件内访问父 Form 上下文：

```ts
const { error, name, id, size, disabled } = useFormField()
```

### useFormGroup

（与 useFormField 类似，访问 FieldGroup 上下文）

## TypeScript 类型

### Form 相关

```ts
import type {
  FormError,        // 单个错误
  FormSubmitEvent,  // submit 事件参数
  FormErrorEvent,   // error 事件参数
  FormFieldInjectedOptions,
} from '@nuxt/ui'

// FormError
interface FormError {
  name: string       // 字段路径（如 'email' 或 'user.email' 或 'tags.0'）
  message: string    // 错误消息
}

// FormSubmitEvent
interface FormSubmitEvent<T> {
  data: T            // 已通过 schema 校验的数据
}

// FormErrorEvent
interface FormErrorEvent {
  errors: FormError[]
}
```

### Table 相关

```ts
import type { TableColumn, TableRow } from '@nuxt/ui'
import type {
  SortingState,
  ColumnFiltersState,
  PaginationState,
  RowSelectionState,
  ExpandedState,
  VisibilityState,
  ColumnPinningState,
} from '@tanstack/vue-table'

// TableColumn 完整定义
interface TableColumn<T> {
  accessorKey?: string
  header?: string | ((info: HeaderContext) => VNode | string)
  cell?: (info: CellContext<T, unknown>) => VNode | string
  footer?: string | ((info: FooterContext) => VNode | string)
  enableSorting?: boolean
  enableHiding?: boolean
  size?: number
  minSize?: number
  maxSize?: number
  meta?: {
    class?: { th?: string; td?: string }
    style?: { th?: CSSProperties; td?: CSSProperties }
    colspan?: { td?: number | (() => number) }
    rowspan?: { td?: number | (() => number) }
  }
}
```

### 菜单 / 导航相关

```ts
import type {
  NavigationMenuItem,
  DropdownMenuItem,
  ContextMenuItem,
  SelectItem,
  TabsItem,
  AccordionItem,
  CommandPaletteItem,
  CommandPaletteGroup,
  BreadcrumbItem,
  StepperItem,
} from '@nuxt/ui'

// NavigationMenuItem
interface NavigationMenuItem {
  label?: string
  icon?: string
  avatar?: AvatarProps
  to?: string
  href?: string
  target?: '_blank' | '_self' | '_parent' | '_top'
  badge?: string | number | BadgeProps
  children?: NavigationMenuChildItem[]
  type?: 'label' | 'trigger' | 'link'
  active?: boolean
  disabled?: boolean
  open?: boolean
}

// DropdownMenuItem
interface DropdownMenuItem {
  label?: string
  icon?: string
  avatar?: AvatarProps
  type?: 'link' | 'label' | 'separator' | 'checkbox'
  color?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'
  to?: string
  checked?: boolean
  disabled?: boolean
  children?: DropdownMenuItem[]
  filter?: boolean | InputProps
  onSelect?: (e: Event) => void
}

// SelectItem
interface SelectItem {
  label?: string
  value?: string | number | boolean
  icon?: string
  avatar?: AvatarProps
  chip?: ChipProps
  type?: 'item' | 'label' | 'separator'
  disabled?: boolean
}
```

### 主题相关

```ts
import type { AppConfig } from '@nuxt/schema'

// app.config.ts 的类型
defineAppConfig<AppConfig>({
  ui: {
    colors: {
      primary?: string
      secondary?: string
      success?: string
      info?: string
      warning?: string
      error?: string
      neutral?: string
    },
    // 其他组件主题覆盖...
  },
})
```

## defineAppConfig 主题完整结构

```ts
// app.config.ts
export default defineAppConfig({
  ui: {
    // ============ 1. 语义化色别名 ============
    colors: {
      primary: 'green',
      secondary: 'blue',
      success: 'green',
      info: 'blue',
      warning: 'yellow',
      error: 'red',
      neutral: 'slate',
    },

    // ============ 2. 全局 icon 默认值 ============
    icons: {
      // 常用全局图标
      loading: 'i-lucide-loader-2',
      chevronDown: 'i-lucide-chevron-down',
      chevronLeft: 'i-lucide-chevron-left',
      chevronRight: 'i-lucide-chevron-right',
      chevronUp: 'i-lucide-chevron-up',
      check: 'i-lucide-check',
      close: 'i-lucide-x',
      arrowLeft: 'i-lucide-arrow-left',
      arrowRight: 'i-lucide-arrow-right',
      ellipsis: 'i-lucide-ellipsis',
      search: 'i-lucide-search',
      info: 'i-lucide-info',
      success: 'i-lucide-check-circle',
      warning: 'i-lucide-alert-triangle',
      error: 'i-lucide-x-circle',
    },

    // ============ 3. 单组件主题覆盖 ============
    button: {
      slots: {
        base: 'font-medium',
        label: '',
        leadingIcon: '',
        leadingAvatar: '',
        trailingIcon: '',
      },
      variants: {
        size: {
          xs: { base: 'px-2 py-1 text-xs' },
          sm: { base: 'px-2.5 py-1.5 text-xs' },
          md: { base: 'px-2.5 py-1.5 text-sm' },
          lg: { base: 'px-3 py-2 text-sm' },
          xl: { base: 'px-3.5 py-2.5 text-base' },
        },
        // ...
      },
      defaultVariants: {
        size: 'md',
        color: 'primary',
        variant: 'solid',
      },
    },

    input: { /* ... */ },
    select: { /* ... */ },
    form: { /* ... */ },
    table: { /* ... */ },
    modal: { /* ... */ },
    // 每个组件都可以单独覆盖

    // ============ 4. 主题全局 ============
    theme: {
      transitions: true,    // 启用动画
      radius: 0.25,         // border-radius rem
    },

    // ============ 5. Toast 默认配置 ============
    toaster: {
      position: 'top-right',  // top-left / top-right / bottom-left / bottom-right
      expand: true,            // 展开模式
      duration: 5000,          // 默认时长
    },

    // ============ 6. Tooltip 默认配置 ============
    tooltip: {
      delayDuration: 700,
      skipDelayDuration: 300,
    },
  },
})
```

## i18n 50+ 语言列表

部分常用语言（完整列表见 [`@nuxt/ui/locale` 导出](https://ui.nuxt.com/getting-started/i18n/nuxt#supported-locales)）：

| 语言 | locale 名 | 代码 | 方向 |
|---|---|---|---|
| English | `en` | en | ltr（默认） |
| 简体中文 | `zhCn` | zh-CN | ltr |
| 繁体中文 | `zhTw` | zh-TW | ltr |
| 日本語 | `ja` | ja | ltr |
| 한국어 | `ko` | ko | ltr |
| Français | `fr` | fr | ltr |
| Deutsch | `de` | de | ltr |
| Español | `es` | es | ltr |
| Italiano | `it` | it | ltr |
| Português (BR) | `ptBr` | pt-BR | ltr |
| Português (PT) | `pt` | pt | ltr |
| Русский | `ru` | ru | ltr |
| Polski | `pl` | pl | ltr |
| Türkçe | `tr` | tr | ltr |
| Tiếng Việt | `vi` | vi | ltr |
| ไทย | `th` | th | ltr |
| Bahasa Indonesia | `id` | id | ltr |
| Bahasa Melayu | `ms` | ms | ltr |
| Nederlands | `nl` | nl | ltr |
| Svenska | `sv` | sv | ltr |
| Norsk | `nb` | nb | ltr |
| Dansk | `da` | da | ltr |
| Suomi | `fi` | fi | ltr |
| Čeština | `cs` | cs | ltr |
| Slovenčina | `sk` | sk | ltr |
| Magyar | `hu` | hu | ltr |
| Română | `ro` | ro | ltr |
| Български | `bg` | bg | ltr |
| Українська | `uk` | uk | ltr |
| Ελληνικά | `el` | el | ltr |
| العربية | `ar` | ar | **rtl** |
| עברית | `he` | he | **rtl** |
| فارسی | `fa` | fa | **rtl** |
| اردو | `ur` | ur | **rtl** |
| हिन्दी | `hi` | hi | ltr |
| বাংলা | `bn` | bn | ltr |

使用方式：

```ts
import { en, zhCn, ar /* ... */ } from '@nuxt/ui/locale'
```

```vue
<UApp :locale="zhCn">
  <NuxtPage />
</UApp>
```

## Lucide / Iconify 图标包对照

### 默认（自带）

| 包 | 前缀 | 风格 | 站点 |
|---|---|---|---|
| Lucide | `i-lucide-*` | **现代极简**（Feather Icons 分支） | [lucide.dev](https://lucide.dev/) |

### 常用 Iconify 集合

```bash
pnpm add @iconify-json/{collection}
```

| 包名 | 前缀 | 风格 | 用途 |
|---|---|---|---|
| `@iconify-json/lucide` | `i-lucide-*` | 现代极简 | **Nuxt UI 默认**（建议显式装） |
| `@iconify-json/heroicons` | `i-heroicons-*` | Heroicons | Tailwind 官方风格 |
| `@iconify-json/simple-icons` | `i-simple-icons-*` | **品牌 logo** | GitHub / Google / X / Discord 等 |
| `@iconify-json/carbon` | `i-carbon-*` | IBM Carbon | 企业稳重 |
| `@iconify-json/mdi` | `i-mdi-*` | Material Design Icons | Material 风格 |
| `@iconify-json/tabler` | `i-tabler-*` | Tabler | 线条简洁 |
| `@iconify-json/fa6-solid` | `i-fa6-solid-*` | Font Awesome 6 实心 | 通用经典 |
| `@iconify-json/fa6-regular` | `i-fa6-regular-*` | Font Awesome 6 描边 | 通用经典 |
| `@iconify-json/fluent` | `i-fluent-*` | Microsoft Fluent | 微软风 |
| `@iconify-json/material-symbols` | `i-material-symbols-*` | Material Symbols | Google 最新 |
| `@iconify-json/ph` | `i-ph-*` | Phosphor | 多权重 |
| `@iconify-json/ri` | `i-ri-*` | Remix Icon | 国内常用 |
| `@iconify-json/twemoji` | `i-twemoji-*` | Twitter Emoji | Emoji |
| `@iconify-json/logos` | `i-logos-*` | 技术 / 品牌 logo 彩色 | 框架 / 工具 logo |
| `@iconify-json/devicon` | `i-devicon-*` | 开发工具 logo | 技术栈展示 |

### 浏览全部图标

[icones.js.org](https://icones.js.org/) —— Iconify 200,000+ 图标在线搜索。

## 颜色色阶（Tailwind 4）

Tailwind 4 内置 **21 个色系** + 11 级色阶（50-950）—— 可以直接在 `app.config.ts` 中映射：

```ts
ui: {
  colors: {
    primary: 'blue',  // 用 Tailwind 默认色
  },
}
```

可用颜色：

| 暖色 | 冷色 | 中性 |
|---|---|---|
| red | cyan | slate |
| orange | sky | gray |
| amber | blue | zinc |
| yellow | indigo | neutral |
| lime | violet | stone |
| green | purple | - |
| emerald | fuchsia | - |
| teal | pink | - |
| - | rose | - |

每个色都有 `50`、`100`、`200`、`300`、`400`、`500`、`600`、`700`、`800`、`900`、`950` 共 11 级。

## 常用配置 cheat sheet

### Nuxt 项目 nuxt.config.ts

```ts
export default defineNuxtConfig({
  modules: ['@nuxt/ui'],

  css: ['~/assets/css/main.css'],

  // 可选：图标配置
  icon: {
    customCollections: [
      {
        prefix: 'custom',
        dir: './app/assets/icons',
      },
    ],
  },

  // 可选：字体配置
  fonts: {
    families: [
      { name: 'Inter', provider: 'google' },
    ],
  },

  // 可选：色彩模式配置
  colorMode: {
    classSuffix: '',         // 默认 '-mode'，'' 表示直接用 .dark
    preference: 'system',    // 默认 'light' / 'dark' / 'system'
  },
})
```

### Vue 项目 vite.config.ts

```ts
import vue from '@vitejs/plugin-vue'
import ui from '@nuxt/ui/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    vue(),
    ui({
      // 组件前缀（默认 'U'）
      prefix: 'U',

      // 暗色模式（默认 true）
      colorMode: true,

      // app.config.ts 配置（无 app.config 时可写在这里）
      ui: {
        colors: {
          primary: 'blue',
          neutral: 'zinc',
        },
      },
    }),
  ],
})
```

### CSS 入口

```css
/* main.css */
@import "tailwindcss";
@import "@nuxt/ui";

/* 自定义颜色 */
@theme static {
  --color-brand-500: #0ea5e9;
  /* ...其他色阶 */
}

/* 自定义字体 */
@theme {
  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "Fira Code", monospace;
}

/* 自定义全局样式（可选） */
@layer base {
  html {
    @apply text-default bg-default;
  }
}
```

### App.vue / app.vue 模板

```vue
<template>
  <UApp :locale="zhCn">
    <!-- Nuxt -->
    <NuxtPage />
    <!-- 或 Vue Router -->
    <!-- <RouterView /> -->
  </UApp>
</template>

<script setup lang="ts">
import { zhCn } from '@nuxt/ui/locale'
</script>
```

### Vue 项目 index.html

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>App</title>
</head>
<body>
  <div id="app" class="isolate"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

## 命名规范

### 组件命名

- **PascalCase**：`<UButton />` / `<UInput />` / `<UDataTable />`（推荐）
- **kebab-case**：`<u-button />` / `<u-input />`（HTML 模板兼容写法）

### Prop 命名

- 模板中：`leading-icon="..."` / `default-value="..."`（kebab-case）
- 脚本中：`leadingIcon` / `defaultValue`（camelCase）

### Event 命名

- 模板中：`@update:open="..."` / `@close:prevent="..."`
- emit 内部：`emit('update:open', value)` / `emit('close:prevent')`

### Slot 命名

- 模板中：`<template #content>` / `<template #leading="{ ... }">`
- 主要 slots：`#default`（trigger） / `#content`（弹窗内容） / `#header` / `#body` / `#footer`

## 参考链接

| 用途 | 链接 |
|---|---|
| 官方文档 | [ui.nuxt.com](https://ui.nuxt.com/) |
| 组件总览 | [ui.nuxt.com/components](https://ui.nuxt.com/components) |
| Composables | [ui.nuxt.com/composables](https://ui.nuxt.com/composables) |
| 主题 | [ui.nuxt.com/getting-started/theme](https://ui.nuxt.com/getting-started/theme) |
| 图标 | [ui.nuxt.com/getting-started/icons/nuxt](https://ui.nuxt.com/getting-started/icons/nuxt) |
| i18n | [ui.nuxt.com/getting-started/i18n/nuxt](https://ui.nuxt.com/getting-started/i18n/nuxt) |
| v4 迁移 | [ui.nuxt.com/getting-started/migration/v4](https://ui.nuxt.com/getting-started/migration/v4) |
| 模板 | [ui.nuxt.com/templates](https://ui.nuxt.com/templates) |
| Figma Kit | [ui.nuxt.com/figma](https://ui.nuxt.com/figma) |
| Reka UI（底层） | [reka-ui.com](https://reka-ui.com/) |
| Tailwind 4 | [tailwindcss.com](https://tailwindcss.com/) |
| Tailwind Variants | [tailwind-variants.org](https://www.tailwind-variants.org/) |
| TanStack Table | [tanstack.com/table](https://tanstack.com/table) |
| Iconify | [iconify.design](https://iconify.design/) |
| Lucide Icons | [lucide.dev](https://lucide.dev/) |
| Vercel AI SDK | [sdk.vercel.ai](https://sdk.vercel.ai/) |
| GitHub | [github.com/nuxt/ui](https://github.com/nuxt/ui) |
