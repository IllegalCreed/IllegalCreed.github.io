---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Vuetify 3.x。本页是**速查工具**——包含 100+ 组件列表、常用 props 表、createVuetify 完整选项、Composables 签名、TypeScript 类型、CSS 变量、Display Breakpoints。

## 速查

- **组件命名**：`<v-*>`（kebab-case） / `<V*>`（PascalCase，等价）
- **指令**：`v-ripple` / `v-resize` / `v-intersect` / `v-scroll` / `v-touch` / `v-tooltip` / `v-mutate`
- **Composables**：`useTheme` / `useDisplay` / `useLocale` / `useDate` / `useRtl` / `useGoTo` / `useRules`（labs）
- **TS 类型**：`VForm` / `ThemeDefinition` / `DataTableHeader` / `SubmitEventPromise` / `IconAliases` 等
- **样式入口（SCSS）**：`vuetify/settings`（覆盖全局变量）
- **CSS 变量入口**：`vuetify/styles`（默认 CSS）
- **图标包**：`@mdi/font`（字体）/ `@mdi/js`（SVG）
- **Nuxt 模块**：`@vuetify/nuxt-module`（SSR 零配置）
- **按需引入**：`vite-plugin-vuetify`（自动 import + Tree Shaking）
- **官方脚手架**：`pnpm create vuetify`

## 100+ 组件分类速查

### Application（应用框架）

| 组件 | 标签 | 常用 props |
|---|---|---|
| App | v-app | `theme` / `full-height` |
| AppBar | v-app-bar | `color` / `elevation` / `density` / `prominent` / `flat` / `floating` / `extended` / `image` / `scroll-behavior` |
| AppBarTitle | v-app-bar-title | `text` |
| AppBarNavIcon | v-app-bar-nav-icon | `variant` |
| NavigationDrawer | v-navigation-drawer | `v-model` / `location` / `temporary` / `permanent` / `rail` / `rail-width` / `width` / `floating` / `border` / `elevation` |
| Main | v-main | `tag` / `scrollable` |
| Footer | v-footer | `app` / `absolute` / `color` / `height` |
| BottomNavigation | v-bottom-navigation | `v-model` / `mode` / `grow` / `bg-color` |
| SystemBar | v-system-bar | `color` / `height` / `lights-out` / `window` |

### Form（表单）

| 组件 | 标签 | 常用 props |
|---|---|---|
| Form | v-form | `v-model` / `validate-on` / `disabled` / `readonly` / `fast-fail` |
| TextField | v-text-field | `v-model` / `label` / `placeholder` / `type` / `variant` / `density` / `rounded` / `rules` / `error-messages` / `clearable` / `counter` / `prepend-inner-icon` / `append-inner-icon` / `hint` / `persistent-hint` |
| Textarea | v-textarea | `v-model` / `rows` / `auto-grow` / `no-resize` / `counter` / `variant` |
| Select | v-select | `v-model` / `items` / `item-title` / `item-value` / `multiple` / `chips` / `clearable` / `variant` |
| Combobox | v-combobox | `v-model` / `items` / `multiple` / `chips` / `closable-chips` |
| Autocomplete | v-autocomplete | `v-model` / `items` / `item-title` / `item-value` / `filter-mode` / `custom-filter` / `loading` / `no-data-text` |
| FileInput | v-file-input | `v-model` / `accept` / `multiple` / `show-size` / `chips` / `counter` |
| Checkbox | v-checkbox | `v-model` / `label` / `value` / `indeterminate` / `color` |
| CheckboxBtn | v-checkbox-btn | `v-model` / `value` |
| Radio | v-radio | `v-model` / `label` / `value` / `color` |
| RadioGroup | v-radio-group | `v-model` / `inline` |
| Switch | v-switch | `v-model` / `label` / `inset` / `flat` / `color` |
| Slider | v-slider | `v-model` / `min` / `max` / `step` / `thumb-label` / `ticks` |
| RangeSlider | v-range-slider | `v-model` / `min` / `max` / `step` |
| OtpInput | v-otp-input | `v-model` / `length` / `type` / `mask` |
| Rating | v-rating | `v-model` / `length` / `half-increments` / `hover` |
| ColorPicker | v-color-picker | `v-model` / `mode` / `show-swatches` / `hide-canvas` |
| DatePicker | v-date-picker | `v-model` / `min` / `max` / `multiple` / `range` / `view-mode` |
| TimePicker | v-time-picker（labs） | `v-model` / `format` / `min` / `max` / `use-seconds` |
| NumberInput | v-number-input（labs） | `v-model` / `min` / `max` / `step` / `precision` |

### Data（数据展示）

| 组件 | 标签 | 常用 props |
|---|---|---|
| DataTable | v-data-table | `headers` / `items` / `items-per-page` / `search` / `loading` / `item-value` / `multi-sort` / `show-select` / `density` |
| DataTableServer | v-data-table-server | `headers` / `items` / `items-length` / `loading` / `items-per-page` / 同上 |
| DataTableVirtual | v-data-table-virtual | `headers` / `items` / `height` / 同上 |
| DataIterator | v-data-iterator | `items` / `items-per-page` / `search` |
| List | v-list | `nav` / `density` / `bg-color` / `lines` / `select-strategy` |
| ListItem | v-list-item | `title` / `subtitle` / `prepend-icon` / `append-icon` / `to` / `href` / `active` / `value` |
| ListGroup | v-list-group | `value` / `prepend-icon` / `append-icon` / `subgroup` |
| ListSubheader | v-list-subheader | `title` / `inset` |
| Treeview | v-treeview（labs） | `items` / `item-value` / `item-children` / `selectable` / `selection-type` |
| Pagination | v-pagination | `v-model` / `length` / `total-visible` / `start` / `density` |
| Chip | v-chip | `closable` / `color` / `size` / `variant` / `prepend-icon` / `label` / `pill` |
| ChipGroup | v-chip-group | `v-model` / `multiple` / `column` / `mandatory` |
| Avatar | v-avatar | `size` / `color` / `image` / `icon` / `rounded` |
| Badge | v-badge | `content` / `color` / `dot` / `floating` / `inline` / `location` |
| ProgressLinear | v-progress-linear | `v-model` / `indeterminate` / `color` / `height` / `striped` |
| ProgressCircular | v-progress-circular | `v-model` / `indeterminate` / `size` / `width` / `color` |
| SkeletonLoader | v-skeleton-loader | `type` / `loading` / `boilerplate` |
| EmptyState | v-empty-state | `title` / `text` / `headline` / `icon` / `image` |
| Img | v-img | `src` / `lazy-src` / `width` / `height` / `cover` / `aspect-ratio` / `gradient` |
| Icon | v-icon | `icon` / `size` / `color` / `start` / `end` |
| Carousel | v-carousel | `v-model` / `cycle` / `interval` / `show-arrows` / `hide-delimiters` / `height` |
| Banner | v-banner | `lines` / `stacked` / `sticky` |
| Calendar | v-calendar（labs） | `v-model` / `type` / `events` |
| Sparkline | v-sparkline | `model-value` / `type` / `auto-draw` / `line-width` / `gradient` |
| Table | v-table | `density` / `fixed-header` / `height` / `hover` / `striped` |
| InfiniteScroll | v-infinite-scroll | `mode` / `side` / `load-more-text` / `empty-text` |
| Timeline | v-timeline | `align` / `direction` / `side` / `truncate-line` |
| TimelineItem | v-timeline-item | `dot-color` / `icon` / `size` |
| VirtualScroll | v-virtual-scroll | `items` / `item-height` / `height` |
| Parallax | v-parallax | `src` / `scale` |
| Hover | v-hover | `disabled` / `open-delay` / `close-delay` |

### Navigation（导航）

| 组件 | 标签 | 常用 props |
|---|---|---|
| Tabs | v-tabs | `v-model` / `direction` / `align-tabs` / `density` / `stacked` / `slider-color` / `show-arrows` |
| Tab | v-tab | `value` / `to` / `href` / `text` / `prepend-icon` / `append-icon` |
| TabsWindow | v-tabs-window | `v-model` / `direction` / `disabled` |
| TabsWindowItem | v-tabs-window-item | `value` / `transition` / `reverse-transition` |
| Window | v-window | `v-model` / `continuous` / `direction` / `show-arrows` |
| WindowItem | v-window-item | `value` |
| Stepper | v-stepper | `v-model` / `items` / `flat` / `non-linear` / `mobile` |
| StepperItem | v-stepper-item | `title` / `subtitle` / `complete` / `editable` |
| Breadcrumbs | v-breadcrumbs | `items` / `divider` / `density` |
| BreadcrumbsItem | v-breadcrumbs-item | `title` / `to` / `href` / `disabled` |
| Menu | v-menu | `v-model` / `activator` / `location` / `offset` / `close-on-content-click` / `open-on-hover` |
| SpeedDial | v-speed-dial | `v-model` / `location` / `transition` |
| Toolbar | v-toolbar | `color` / `density` / `height` / `flat` / `extended` |
| ToolbarTitle | v-toolbar-title | `text` |

### Layout（布局）

| 组件 | 标签 | 常用 props |
|---|---|---|
| Container | v-container | `fluid` / `tag` |
| Row | v-row | `dense` / `no-gutters` / `align` / `justify` / `align-content` |
| Col | v-col | `cols` / `sm` / `md` / `lg` / `xl` / `xxl` / `offset` / `align-self` |
| Spacer | v-spacer | — |
| Divider | v-divider | `inset` / `vertical` / `thickness` / `length` |
| Layout | v-layout | `full-height` |
| LayoutItem | v-layout-item | `position` / `size` / `model-value` |
| Sheet | v-sheet | `color` / `elevation` / `rounded` / `tile` / `border` |
| Responsive | v-responsive | `aspect-ratio` / `content-class` / `max-height` / `max-width` |

### Feedback（反馈）

| 组件 | 标签 | 常用 props |
|---|---|---|
| Dialog | v-dialog | `v-model` / `width` / `max-width` / `fullscreen` / `persistent` / `scrollable` / `transition` / `activator` |
| Snackbar | v-snackbar | `v-model` / `color` / `timeout` / `location` / `vertical` / `multi-line` / `transition` |
| SnackbarQueue | v-snackbar-queue（labs） | `model-value` / `closable` |
| Alert | v-alert | `type` / `title` / `text` / `closable` / `prominent` / `border` / `variant` / `density` |
| Tooltip | v-tooltip | `text` / `location` / `open-delay` / `close-delay` / `activator` / `transition` |
| Overlay | v-overlay | `v-model` / `persistent` / `scrim` / `transition` / `activator` |
| BottomSheet | v-bottom-sheet | `v-model` / `inset` / `fullscreen` |

### Surfaces（表面）

| 组件 | 标签 | 常用 props |
|---|---|---|
| Card | v-card | `title` / `subtitle` / `text` / `image` / `prepend-icon` / `append-icon` / `elevation` / `variant` / `color` / `loading` / `hover` / `link` |
| CardTitle | v-card-title | `tag` |
| CardSubtitle | v-card-subtitle | `tag` |
| CardText | v-card-text | `tag` |
| CardActions | v-card-actions | — |
| CardItem | v-card-item | `title` / `subtitle` |
| Btn | v-btn | `color` / `variant` / `size` / `density` / `rounded` / `icon` / `loading` / `block` / `disabled` / `to` / `href` / `prepend-icon` / `append-icon` / `stacked` |
| BtnGroup | v-btn-group | `color` / `variant` / `divided` / `rounded` |
| BtnToggle | v-btn-toggle | `v-model` / `multiple` / `mandatory` / `divided` |
| Fab | v-fab | `app` / `appear` / `location` / `position` / `extended` |
| ExpansionPanels | v-expansion-panels | `v-model` / `multiple` / `variant` / `accordion` |
| ExpansionPanel | v-expansion-panel | `title` / `value` |
| ExpansionPanelText | v-expansion-panel-text | `eager` |

### 其他

| 组件 | 标签 | 常用 props |
|---|---|---|
| ThemeProvider | v-theme-provider | `theme` / `with-background` |
| LocaleProvider | v-locale-provider | `locale` / `fallback` / `rtl` |
| DefaultsProvider | v-defaults-provider | `defaults` |
| Lazy | v-lazy | `v-model` / `min-height` / `options` / `transition` |
| NoSsr | v-no-ssr | — |

## createVuetify 完整选项

```ts
import { createVuetify, type ThemeDefinition } from 'vuetify'

const vuetify = createVuetify({
  // 组件注册
  components: { /* ... */ },
  directives: { /* ... */ },

  // 别名（重命名组件）
  aliases: {
    MyButton: VBtn,
    DangerBtn: VBtn,
  },

  // Blueprint（预设主题 + 默认值）
  blueprint: undefined,

  // 主题
  theme: {
    defaultTheme: 'light',     // 'light' / 'dark' / 'system' / 自定义名
    variations: {
      colors: ['primary', 'secondary'],
      lighten: 5,              // 生成 lighten-1 ~ lighten-5
      darken: 5,
    },
    themes: {
      light: {
        dark: false,
        colors: { /* ... */ },
        variables: { /* ... */ },
      },
      dark: {
        dark: true,
        colors: { /* ... */ },
      },
    },
  },

  // 国际化
  locale: {
    locale: 'zhHans',
    fallback: 'en',
    messages: { zhHans, en },
    rtl: { ar: true, he: true },
    adapter: undefined,        // vue-i18n 适配器
  },

  // 显示 / 平台
  display: {
    mobileBreakpoint: 'md',
    thresholds: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
      xxl: 2560,
    },
  },

  // 全局默认 props
  defaults: {
    global: {
      ripple: false,
    },
    VBtn: {
      variant: 'flat',
      color: 'primary',
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
    },
  },

  // 图标集
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },

  // 日期适配器
  date: {
    adapter: undefined,        // 'date-fns' / 'luxon' / 'moment' / 'dayjs' 或自定义
    formats: { /* ... */ },
    locale: { /* ... */ },
  },

  // SSR 模式
  ssr: false,                  // 启用 SSR
})
```

### Theme 类型

```ts
interface ThemeDefinition {
  dark: boolean
  colors: {
    background: string
    surface: string
    primary: string
    'primary-darken-1'?: string
    secondary: string
    'secondary-darken-1'?: string
    error: string
    info: string
    success: string
    warning: string
    [key: string]: string | undefined
  }
  variables: {
    'border-color'?: string
    'border-opacity'?: number
    'high-emphasis-opacity'?: number
    'medium-emphasis-opacity'?: number
    'disabled-opacity'?: number
    'idle-opacity'?: number
    'hover-opacity'?: number
    'focus-opacity'?: number
    'selected-opacity'?: number
    'activated-opacity'?: number
    'pressed-opacity'?: number
    'dragged-opacity'?: number
    'theme-kbd'?: string
    'theme-on-kbd'?: string
    'theme-code'?: string
    'theme-on-code'?: string
    [key: string]: string | number | undefined
  }
}
```

## Composables 完整签名

### useTheme

```ts
import { useTheme } from 'vuetify'

const theme = useTheme()

// 全局当前主题
theme.global.name              // ComputedRef<string>      当前主题名（可写）
theme.global.current           // ComputedRef<ThemeInstance>  完整主题对象
theme.global.current.value.dark
theme.global.current.value.colors

// 所有主题（可修改）
theme.themes                   // Ref<Record<string, ThemeDefinition>>
theme.themes.value.light.colors.primary = '#FF5722'

// 工具方法
theme.computeThemeClasses()    // 计算 theme class
theme.styles                   // ComputedRef<string>  CSS 变量样式
```

### useDisplay

```ts
import { useDisplay } from 'vuetify'

const display = useDisplay()

display.name                // Ref<'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'>
display.xs                  // Ref<boolean>   当前是 xs
display.sm                  // Ref<boolean>   当前是 sm
display.md                  // Ref<boolean>
display.lg                  // Ref<boolean>
display.xl                  // Ref<boolean>
display.xxl                 // Ref<boolean>

display.smAndDown           // Ref<boolean>   ≤ sm
display.smAndUp             // Ref<boolean>   ≥ sm
display.mdAndDown           // Ref<boolean>   ≤ md
display.mdAndUp             // Ref<boolean>   ≥ md
display.lgAndDown           // Ref<boolean>
display.lgAndUp             // Ref<boolean>

display.mobile              // Ref<boolean>   智能 mobile 判断（默认 smAndDown）
display.mobileBreakpoint    // Ref<Breakpoint | number>

display.width               // Ref<number>     窗口宽度（含滚动条）
display.height              // Ref<number>     窗口高度

display.platform            // Ref<{
                            //   android, ios, mac, windows, linux,
                            //   touch, ssr, chrome, firefox, edge, opera,
                            //   electron, win, mac, linux
                            // }>

display.thresholds          // 断点配置
display.update()            // 手动触发更新
```

### useLocale

```ts
import { useLocale } from 'vuetify'

const locale = useLocale()

locale.current              // Ref<string>     当前语言
locale.fallback             // Ref<string>     回退语言
locale.messages             // Ref<Record<string, LocaleMessage>>

locale.t                    // (key: string, ...params: any[]) => string
                            //   翻译函数：t('$vuetify.dataTable.itemsPerPage')

locale.n                    // (value: number) => string  数字格式化
locale.provide(props)       // 局部提供
```

### useDate

```ts
import { useDate } from 'vuetify'

const date = useDate()

// 创建 / 解析
date.date(value?: any)                          // Date 对象
date.toISO(date: Date)                          // ISO string
date.parseISO(iso: string)                      // Date

// 格式化
date.format(date: Date, formatString: string)   // 'fullDateWithWeekday' / 'keyboardDate' / 'shortDate' / ...

// 加减
date.addDays(date: Date, count: number): Date
date.addMonths(date: Date, count: number): Date
date.addHours(date: Date, count: number): Date
date.addMinutes(date: Date, count: number): Date

// 起点 / 终点
date.startOfDay(date: Date): Date
date.endOfDay(date: Date): Date
date.startOfMonth(date: Date): Date
date.endOfMonth(date: Date): Date
date.startOfWeek(date: Date): Date
date.endOfWeek(date: Date): Date
date.startOfYear(date: Date): Date
date.endOfYear(date: Date): Date

// 取值
date.getYear(date: Date): number
date.getMonth(date: Date): number
date.getDate(date: Date): number
date.getDay(date: Date): number
date.getHours(date: Date): number
date.getMinutes(date: Date): number

// 比较
date.isSameDay(a: Date, b: Date): boolean
date.isSameMonth(a: Date, b: Date): boolean
date.isSameYear(a: Date, b: Date): boolean
date.isAfter(a: Date, b: Date): boolean
date.isBefore(a: Date, b: Date): boolean
date.isWithinRange(date: Date, range: [Date, Date]): boolean
date.isValid(date: any): boolean
```

### useRtl

```ts
import { useRtl } from 'vuetify'

const rtl = useRtl()

rtl.isRtl                   // Ref<boolean>      当前是否 RTL
rtl.rtlClasses              // Ref<string>       'v-locale--is-rtl' / 'v-locale--is-ltr'
```

### useGoTo

```ts
import { useGoTo } from 'vuetify'

const goTo = useGoTo()

// 滚动到指定位置
goTo(0)                                         // 顶部
goTo(500)                                       // y = 500
goTo('#section-3')                              // 元素 ID
goTo('.section')                                // 选择器
goTo(elementRef)                                // ref / HTMLElement

// 选项
goTo('#section', {
  duration: 300,       // 动画时长（ms）
  offset: -80,         // 距离目标的偏移
  easing: 'easeInOutCubic',
  container: '#main',  // 滚动容器（默认 window）
})
```

### useRules（Labs）

```ts
import { useRules } from 'vuetify/labs/rules'

const rules = useRules()

// 内置规则
rules.required()                    // 必填
rules.email()                        // 邮箱
rules.url()                          // URL
rules.numeric()                      // 数字
rules.min(n: number)                 // 最小（数字 / 长度）
rules.max(n: number)                 // 最大
rules.between(a: number, b: number)  // 区间
rules.regex(pattern: RegExp)         // 正则
rules.length(n: number)              // 精确长度

// 自定义错误消息
rules.required('姓名不能为空')
rules.min(8, '至少 8 位')
```

## Display Breakpoints 完整

| 标识 | 范围 | 设备 |
|---|---|---|
| `xs` | <600px | 手机 |
| `sm` | 600-960px | 小平板 |
| `md` | 960-1280px | 平板 / 小笔记本 |
| `lg` | 1280-1920px | 笔记本 / 桌面 |
| `xl` | 1920-2560px | 大桌面 |
| `xxl` | ≥2560px | 4K / 超宽屏 |

**自定义断点**：

```ts
const vuetify = createVuetify({
  display: {
    mobileBreakpoint: 'md',
    thresholds: {
      xs: 0,
      sm: 640,            // 改为 Tailwind 风格
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536,
    },
  },
})
```

## Date Adapter

Vuetify 的 Date Adapter **抽象了底层日期库**——可以根据项目已有的库选择：

### date-fns（默认推荐）

```bash
pnpm add date-fns
pnpm add -D @date-io/date-fns
```

```ts
import DateFnsAdapter from '@date-io/date-fns'
import zhCN from 'date-fns/locale/zh-CN'

const vuetify = createVuetify({
  date: {
    adapter: DateFnsAdapter,
    locale: { zhHans: zhCN },
  },
})
```

### Luxon

```bash
pnpm add luxon
pnpm add -D @date-io/luxon
```

```ts
import LuxonAdapter from '@date-io/luxon'

const vuetify = createVuetify({
  date: { adapter: LuxonAdapter },
})
```

### Day.js

```bash
pnpm add dayjs
pnpm add -D @date-io/dayjs
```

```ts
import DayjsAdapter from '@date-io/dayjs'
import 'dayjs/locale/zh-cn'

const vuetify = createVuetify({
  date: {
    adapter: DayjsAdapter,
    locale: { zhHans: 'zh-cn' },
  },
})
```

### Moment

```bash
pnpm add moment
pnpm add -D @date-io/moment
```

```ts
import MomentAdapter from '@date-io/moment'

const vuetify = createVuetify({
  date: { adapter: MomentAdapter },
})
```

> **不强制安装**：如果项目不用 v-date-picker，可以**不引入 date adapter**——Vuetify 用内置最小 adapter。

## Icon Sets 完整

| 图标集 | import 路径 | 安装包 |
|---|---|---|
| **MDI Font**（默认） | `vuetify/iconsets/mdi` | `@mdi/font` |
| MDI SVG | `vuetify/iconsets/mdi-svg` | `@mdi/js` |
| Material Design | `vuetify/iconsets/md` | `material-icons` |
| Font Awesome SVG | `vuetify/iconsets/fa-svg` | `@fortawesome/*` |
| Font Awesome 4 | `vuetify/iconsets/fa4` | `font-awesome` |

**自定义图标集**：

```ts
import type { IconSet } from 'vuetify'
import { h } from 'vue'

const customSvgIconSet: IconSet = {
  component: (props) => h('svg', { /* ... */ }),
}

const vuetify = createVuetify({
  icons: {
    defaultSet: 'custom',
    sets: { custom: customSvgIconSet },
  },
})
```

## 指令（Directives）

### v-ripple

```vue
<div v-ripple>点击有波纹</div>
<div v-ripple.center>中心波纹</div>
<div v-ripple="{ class: 'text-primary' }">自定义颜色</div>
```

### v-intersect（IntersectionObserver）

```vue
<div v-intersect="onIntersect">进入视口触发</div>

<script setup>
const onIntersect = (isIntersecting: boolean) => {
  if (isIntersecting) console.log('进入视口')
}
</script>
```

### v-resize（窗口大小变化）

```vue
<div v-resize="onResize">监听 resize</div>

<script setup>
const onResize = () => {
  console.log('窗口变化', window.innerWidth)
}
</script>
```

### v-scroll（滚动）

```vue
<div v-scroll="onScroll">监听滚动</div>

<script setup>
const onScroll = (e: Event) => {
  // ...
}
</script>
```

### v-touch（触摸手势）

```vue
<div v-touch="{ left, right, up, down }">滑动手势</div>

<script setup>
const left = () => console.log('左滑')
const right = () => console.log('右滑')
const up = () => console.log('上滑')
const down = () => console.log('下滑')
</script>
```

### v-mutate（DOM 变化）

```vue
<div v-mutate="onMutate">监听 DOM 变化</div>
```

## CSS 变量速查

### 主题色（RGB tuple 格式）

```css
/* 用法：rgb(var(--v-theme-primary)) 或 rgba(var(--v-theme-primary), 0.5) */
--v-theme-background
--v-theme-surface
--v-theme-surface-bright
--v-theme-surface-light
--v-theme-surface-variant
--v-theme-on-surface-variant

--v-theme-primary
--v-theme-primary-darken-1
--v-theme-on-primary

--v-theme-secondary
--v-theme-secondary-darken-1
--v-theme-on-secondary

--v-theme-error
--v-theme-on-error

--v-theme-info
--v-theme-on-info

--v-theme-success
--v-theme-on-success

--v-theme-warning
--v-theme-on-warning
```

### 间距 / 圆角

```css
--v-disabled-opacity
--v-high-emphasis-opacity
--v-medium-emphasis-opacity
--v-hover-opacity
--v-focus-opacity
--v-activated-opacity
--v-pressed-opacity
--v-dragged-opacity

--v-border-opacity
--v-border-color
```

### 工具

```css
--v-scrollbar-offset       /* 滚动条宽度 */
--v-layout-bottom          /* 底部 Layout 占位（自动） */
--v-layout-top
--v-layout-left
--v-layout-right
```

## SCSS 变量入口

`vuetify/settings`：

```scss
@use 'vuetify/settings' with (
  // 颜色
  $color-pack: false,                  // 关闭默认色板（减小 bundle）

  // 字体
  $body-font-family: ('Inter', sans-serif),
  $heading-font-family: ('Inter', sans-serif),

  // 字号
  $body-1-size: 1rem,
  $body-2-size: 0.875rem,

  // 圆角
  $border-radius-root: 4px,
  $border-radius-pill: 9999px,

  // 间距
  $spacer: 4px,                        // 间距基础单位

  // 组件级
  $btn-border-radius: 4px,
  $btn-font-weight: 500,
  $card-border-radius: 4px,
  $text-field-border-radius: 4px,
  $list-density: 'comfortable',

  // 断点
  $grid-breakpoints: (
    'xs': 0,
    'sm': 600px,
    'md': 960px,
    'lg': 1280px,
    'xl': 1920px,
    'xxl': 2560px,
  )
);
```

**完整 SCSS 变量列表**：见 [GitHub packages/vuetify/src/styles/settings/](https://github.com/vuetifyjs/vuetify/tree/master/packages/vuetify/src/styles/settings)

## 语言包（部分）

```ts
import {
  // 中文
  zhHans,     // 简体中文
  zhHant,     // 繁体中文

  // 英语
  en,         // 英语

  // 亚洲
  ja,         // 日语
  ko,         // 韩语
  th,         // 泰语
  vi,         // 越南语
  id,         // 印尼语

  // 欧洲
  fr,         // 法语
  de,         // 德语
  es,         // 西班牙语
  it,         // 意大利语
  pt,         // 葡萄牙语
  nl,         // 荷兰语
  pl,         // 波兰语
  ru,         // 俄语
  uk,         // 乌克兰语
  sv,         // 瑞典语
  da,         // 丹麦语
  no,         // 挪威语
  fi,         // 芬兰语
  el,         // 希腊语
  cs,         // 捷克语
  hu,         // 匈牙利语

  // 中东
  ar,         // 阿拉伯语（RTL）
  he,         // 希伯来语（RTL）
  fa,         // 波斯语（RTL）
  tr,         // 土耳其语
} from 'vuetify/locale'
```

完整 40+ 语言列表见 [GitHub packages/vuetify/src/locale](https://github.com/vuetifyjs/vuetify/tree/master/packages/vuetify/src/locale)。

## vite-plugin-vuetify 完整选项

```ts
import vuetify from 'vite-plugin-vuetify'

vuetify({
  // 自动导入
  autoImport: true,                         // 默认 true

  // 样式处理
  styles: true,                              // 默认 true（自动处理 SCSS）
  // 或：
  styles: 'expose',                          // 暴露 CSS 到 'vuetify-css' 虚拟模块
  // 或：
  styles: { configFile: 'src/styles/settings.scss' },  // 指向自定义 SCSS 入口

  // Vuetify Labs
  // autoImport 会自动包括 labs 组件——无需额外配置
})
```

## TypeScript 类型

### Form 类型

```ts
import type {
  VForm,                       // <v-form ref> 类型
  ValidationRule,              // 校验规则
  SubmitEventPromise,          // v-form submit 事件
} from 'vuetify/components'

const formRef = ref<VForm>()

const rules: ValidationRule[] = [
  v => !!v || '不能为空',
  v => v.length >= 6 || '至少 6 位',
]

// validate() 返回类型
const { valid, errors } = await formRef.value!.validate()
// valid: boolean
// errors: { id: string, errorMessages: string[] }[]
```

### DataTable 类型

```ts
import type {
  DataTableHeader,
  DataTableItem,
  DataTableCompareFunction,
  SortItem,
} from 'vuetify'

const headers: DataTableHeader[] = [
  { title: '姓名', key: 'name', sortable: true },
  { title: '邮箱', key: 'email' },
]
```

### Theme 类型

```ts
import type {
  ThemeDefinition,
  ThemeInstance,
  ThemeConfig,
} from 'vuetify'

const myTheme: ThemeDefinition = {
  dark: false,
  colors: {
    background: '#FFFFFF',
    primary: '#1867C0',
    // ...
  },
}
```

### Display 类型

```ts
import type {
  Breakpoint,         // 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'
  DisplayInstance,
  DisplayPlatform,
  DisplayThresholds,
} from 'vuetify'
```

### Date 类型

```ts
import type {
  DateAdapter,
  DateInstance,
  DateOptions,
} from 'vuetify'
```

### Icons 类型

```ts
import type {
  IconSet,            // 图标集
  IconAliases,        // 别名
  IconProps,          // v-icon props
} from 'vuetify'
```

### Provide 注入 keys

```ts
import {
  // 主题
  ThemeSymbol,

  // 国际化
  LocaleSymbol,

  // 显示
  DisplaySymbol,

  // 默认值
  DefaultsSymbol,

  // 日期
  DateOptionsSymbol,
  DateAdapterSymbol,

  // RTL
  RtlSymbol,

  // 图标
  IconSymbol,
} from 'vuetify'
```

## 常用 props 类型

### 共享类型

```ts
// 尺寸
type Size = 'x-small' | 'small' | 'default' | 'large' | 'x-large'

// 密度
type Density = 'default' | 'comfortable' | 'compact'

// Variant（按钮 / 输入框）
type Variant = 'flat' | 'text' | 'elevated' | 'tonal' | 'outlined' | 'plain'

// 颜色（可以是主题色名或 CSS 颜色）
type Color = string                      // 'primary' / '#FF5722' / 'red-lighten-3'

// 圆角
type Rounded = boolean | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 'lg' | 'xl' | 'pill' | 'circle' | 'shaped'

// Elevation（阴影）
type Elevation = 0 | 1 | 2 | ... | 24

// 位置
type Anchor = 'top' | 'bottom' | 'start' | 'end' | 'left' | 'right'
              | 'top start' | 'top end' | 'bottom start' | 'bottom end'

// 过渡
type Transition = string | { component: Component }
```

### VBtn props

```ts
interface VBtnProps {
  // 主题
  color?: string
  variant?: Variant
  size?: Size
  density?: Density
  rounded?: Rounded
  elevation?: Elevation

  // 图标按钮
  icon?: boolean | string | Component
  prependIcon?: string
  appendIcon?: string

  // 状态
  disabled?: boolean
  loading?: boolean | string
  active?: boolean

  // 布局
  block?: boolean         // 撑满宽度
  stacked?: boolean       // 图标在文字上方
  slim?: boolean

  // 路由
  to?: RouteLocationRaw
  href?: string
  exact?: boolean
  replace?: boolean

  // 原生
  type?: 'button' | 'submit' | 'reset'
  tag?: string | Component

  // 形状
  flat?: boolean
  ripple?: boolean | RippleDirectiveBinding
}
```

### VTextField props

```ts
interface VTextFieldProps {
  // 数据
  modelValue?: string | number

  // 标签
  label?: string
  placeholder?: string

  // 类型
  type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url' | 'search'

  // 外观
  variant?: 'filled' | 'outlined' | 'plain' | 'underlined' | 'solo' | 'solo-inverted' | 'solo-filled'
  density?: Density
  rounded?: Rounded
  color?: string
  bgColor?: string

  // 校验
  rules?: ValidationRule[]
  errorMessages?: string | string[]
  error?: boolean
  validateOn?: string

  // 装饰
  prependInnerIcon?: string
  appendInnerIcon?: string
  prependIcon?: string
  appendIcon?: string
  clearable?: boolean
  clearIcon?: string
  counter?: boolean | number
  hint?: string
  persistentHint?: boolean
  persistentPlaceholder?: boolean
  persistentClear?: boolean

  // 状态
  disabled?: boolean
  readonly?: boolean
  loading?: boolean | string
  autofocus?: boolean

  // 其他
  maxlength?: string | number
  hideDetails?: boolean | 'auto'
}
```

### VDataTable props

```ts
interface VDataTableProps {
  // 数据
  headers: DataTableHeader[]
  items: any[]
  itemValue?: string | ((item: any) => any)

  // 搜索
  search?: string
  customFilter?: DataTableCompareFunction
  filterMode?: 'every' | 'some' | 'union' | 'intersection'

  // 分页
  page?: number
  itemsPerPage?: number
  itemsPerPageOptions?: number[]

  // 排序
  sortBy?: SortItem[]
  multiSort?: boolean
  mustSort?: boolean

  // 选择
  showSelect?: boolean
  selectStrategy?: 'single' | 'page' | 'all'
  modelValue?: any[]               // 选中项

  // 展开
  showExpand?: boolean
  expandOnClick?: boolean
  expanded?: string[]

  // 外观
  density?: Density
  hover?: boolean
  loading?: boolean

  // 固定
  fixedHeader?: boolean
  fixedFooter?: boolean
  height?: string | number

  // 分组
  groupBy?: SortItem[]
}
```

### VDialog props

```ts
interface VDialogProps {
  modelValue?: boolean

  // 尺寸
  width?: string | number
  maxWidth?: string | number
  height?: string | number
  maxHeight?: string | number
  fullscreen?: boolean

  // 行为
  persistent?: boolean      // 点击外部不关闭
  scrollable?: boolean      // 内容滚动而非整体
  retainFocus?: boolean

  // 外观
  origin?: string
  transition?: Transition
  scrim?: string | boolean  // 遮罩

  // 触发
  activator?: string | Element | 'parent'
  attach?: boolean | string | Element
  noClickAnimation?: boolean
}
```

## 相关链接

- [Vuetify GitHub](https://github.com/vuetifyjs/vuetify)
- [Vuetify 中文文档](https://vuetifyjs.com/zh-Hans/)
- [组件总览](https://vuetifyjs.com/zh-Hans/components/all/)
- [Playground](https://play.vuetifyjs.com/)
- [Discord 社区](https://community.vuetifyjs.com/)
- [Material Design Icons](https://pictogrammers.com/library/mdi/)
- [vite-plugin-vuetify](https://github.com/vuetifyjs/vuetify-loader)
- [@vuetify/nuxt-module](https://github.com/vuetifyjs/nuxt-module)
- [eslint-plugin-vuetify](https://github.com/vuetifyjs/eslint-plugin-vuetify)（v2 → v3 迁移）
- [@date-io](https://github.com/dmtrKovalenko/date-io)（Date Adapter 多框架抽象）
- [@mdi/font](https://github.com/Templarian/MaterialDesign-Webfont)（MDI 字体 9000+ 图标）
- [SCSS 变量源码](https://github.com/vuetifyjs/vuetify/tree/master/packages/vuetify/src/styles/settings)
- [40+ 语言包目录](https://github.com/vuetifyjs/vuetify/tree/master/packages/vuetify/src/locale)
