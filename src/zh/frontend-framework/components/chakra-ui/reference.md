---
layout: doc
outline: [2, 3]
---

# Chakra UI 参考

> 适用范围：**Chakra UI v3.x**（2026 年 5 月最新 **v3.35.0**）。本页是 API 速查手册——具体用法参见 [指南](./guide-line.md)。

## 包速查

| 包名 | 用途 | 必装 |
| ---- | ---- | ---- |
| `@chakra-ui/react` | 100+ 核心组件 + style props + system API | ✅ |
| `@emotion/react` | CSS-in-JS 底层 (Emotion) | ✅ |
| `@chakra-ui/cli` | CLI 工具 (snippet add 命令) | npx 即可 |
| `@ark-ui/react` | Headless 底层组件库 (可选直接用) | 一般不需要 |
| `next-themes` | 暗色模式集成 (v3 默认) | 跟随 snippet |
| `react-icons` | 推荐图标库（替代 v2 `@chakra-ui/icons`） | 推荐 |
| `lucide-react` | 推荐图标库（替代方案） | 推荐 |
| `react-hook-form` | 表单库（推荐） | 推荐 |
| `zod` | Schema 校验（推荐） | 推荐 |

**核心 install 命令**：

```bash
pnpm add @chakra-ui/react @emotion/react
npx @chakra-ui/cli snippet add        # 生成 Provider / Toaster / ColorMode
```

## @chakra-ui/react - 100+ 组件清单

### Layout（17）

| 组件 | 说明 |
| ---- | ---- |
| `Box` | 通用容器（Style Props 入口） |
| `Flex` | 弹性盒 |
| `Grid` / `GridItem` | CSS Grid 网格 |
| `Stack` | 通用排列（含 Stack.Separator） |
| `HStack` | 横向 Stack 简写 |
| `VStack` | 纵向 Stack 简写 |
| `Container` | 限宽容器 |
| `Center` | 居中容器 |
| `AbsoluteCenter` | 绝对定位居中 |
| `AspectRatio` | 固定宽高比 |
| `Bleed` | 超出父容器的负边距 |
| `Float` | 浮动定位 |
| `Group` | 紧密分组 |
| `ScrollArea` | 自定义滚动条容器 |
| `Separator` | 分割线（v3 替代 v2 Divider） |
| `SimpleGrid` | 响应式简单网格 |
| `Splitter` | 可拖拽分割面板 |
| `Wrap` | 自动换行的横向布局 |
| `Spacer` | Flex 弹性填充 |

### Typography（14）

| 组件 | 说明 |
| ---- | ---- |
| `Heading` | h1-h6 标题 |
| `Text` | 通用文本 |
| `Blockquote` | 引用块 |
| `Code` | 行内代码 |
| `CodeBlock` | 代码块（含语法高亮） |
| `Em` | 强调文本 |
| `Highlight` | 高亮关键词 |
| `Kbd` | 键盘按键 |
| `Link` | 链接 |
| `LinkOverlay` | 整个区域可点击的链接遮罩 |
| `List` | 列表（ListRoot / ListItem） |
| `Mark` | 标记 |
| `Prose` | prose 容器 |
| `RichTextEditor` | 富文本编辑器 |

### Forms（22）

| 组件 | 说明 |
| ---- | ---- |
| `Field` | 字段包装（v3 替代 FormControl） |
| `Fieldset` | 字段组 |
| `Input` / `InputGroup` / `InputAddon` / `InputElement` | 单行文本 + 前后附加 |
| `Textarea` | 多行文本 |
| `NumberInput` | 数字输入 |
| `PasswordInput` | 密码输入 |
| `PinInput` | PIN 码输入 |
| `Checkbox` | 单选框 |
| `CheckboxCard` | 卡片样式 Checkbox |
| `Radio` / `RadioGroup` | 单选 |
| `RadioCard` | 卡片样式 Radio |
| `Switch` | 开关 |
| `Slider` / `RangeSlider` | 滑块 |
| `Select` | 自定义下拉（基于 Ark UI） |
| `NativeSelect` | 原生 select（v3 替代 v2 Select） |
| `Combobox` | 自动补全 + 多选下拉 |
| `TagsInput` | 标签输入 |
| `Editable` | 行内可编辑文本 |
| `ColorPicker` | 颜色选择器 |
| `ColorSwatch` | 颜色色块 |
| `FileUpload` | 文件上传 |
| `SegmentedControl` | 分段控件 |

### Data Display（13）

| 组件 | 说明 |
| ---- | ---- |
| `Avatar` (Root / Image / Fallback / Badge) | 头像 |
| `Badge` | 徽章 |
| `Card` (Root / Header / Body / Footer) | 卡片 |
| `Clipboard` | 剪贴板复制 |
| `Image` | 图片 |
| `DataList` | 键值对列表 |
| `Icon` | 图标容器 |
| `Marquee` | 跑马灯 |
| `QRCode` | 二维码 |
| `Stat` | 统计数字 |
| `Table` (Root / Header / Body / Row / Cell / ColumnHeader) | 表格 |
| `Tag` | 标签 |
| `Timeline` | 时间线 |

### Feedback（8）

| 组件 | 说明 |
| ---- | ---- |
| `Alert` (Root / Indicator / Title / Description) | 警告提示 |
| `EmptyState` | 空状态 |
| `Progress` (Root / Track / Range / ValueText) | 进度条 |
| `ProgressCircle` | 环形进度（v3 替代 CircularProgress） |
| `Skeleton` / `SkeletonText` / `SkeletonCircle` | 骨架屏 |
| `Spinner` | 加载指示器 |
| `Status` | 状态指示器 |
| `Toast` / `Toaster` | Toast 通知系统 |

### Disclosure（7）

| 组件 | 说明 |
| ---- | ---- |
| `Accordion` (Root / Item / ItemTrigger / ItemContent / ItemBody / ItemIndicator) | 手风琴 |
| `Breadcrumb` (Root / List / Item / Link / Separator / CurrentLink) | 面包屑 |
| `Carousel` | 轮播 |
| `Collapsible` (Root / Trigger / Content) | 折叠 |
| `Pagination` (Root / PrevTrigger / NextTrigger / Items) | 分页 |
| `Steps` (Root / List / Item / Indicator / Title / Separator / Content) | 步骤条 |
| `Tabs` (Root / List / Trigger / Content / Indicator) | 选项卡 |

### Overlays（9）

| 组件 | 说明 |
| ---- | ---- |
| `ActionBar` | 动作栏（底部固定操作条） |
| `Dialog` (Root / Trigger / Backdrop / Positioner / Content / Header / Title / Body / Footer / CloseTrigger) | 对话框（v3 替代 v2 Modal） |
| `Drawer` (同 Dialog 结构) | 抽屉 |
| `HoverCard` | 悬停卡片 |
| `Menu` (Root / Trigger / Positioner / Content / Item / ItemGroup / Separator) | 菜单 |
| `OverlayManager` | 遮罩管理 |
| `Popover` (Root / Trigger / Positioner / Content / Arrow / Header / Body / CloseTrigger) | 弹出框 |
| `ToggleTip` | 点击式 Tooltip |
| `Tooltip` (snippet) | 工具提示 |

### Buttons（4）

| 组件 | 说明 |
| ---- | ---- |
| `Button` / `ButtonGroup` | 标准按钮 |
| `CloseButton` | 关闭按钮 |
| `IconButton` | 图标按钮 |
| `DownloadTrigger` | 下载触发器 |

### Date & Time（2）

| 组件 | 说明 |
| ---- | ---- |
| `Calendar` | 日历 |
| `DatePicker` | 日期选择器 |

### Utilities（13）

| 组件 | 说明 |
| ---- | ---- |
| `ClientOnly` | 仅客户端渲染 |
| `EnvironmentProvider` | 环境上下文 |
| `For` | 迭代渲染（替代 .map） |
| `LocaleProvider` | 国际化上下文 |
| `FormatNumber` | 数字格式化 |
| `FormatByte` | 字节格式化 |
| `Presence` | 过渡动画容器 |
| `Portal` | 传送门 |
| `Show` | 条件渲染 |
| `SkipNav` | 跳过导航（a11y） |
| `VisuallyHidden` | 视觉隐藏 |
| `Theme` | 主题局部覆盖 |
| `Checkmark` / `Radiomark` | 通用 check / radio 标记 |

## Style Props 完整表

### Margin（10）

| Prop | CSS 属性 |
| ---- | -------- |
| `m` | margin |
| `mt` | margin-top |
| `mb` | margin-bottom |
| `ml` | margin-left |
| `mr` | margin-right |
| `mx` | margin-inline (left+right) |
| `my` | margin-block (top+bottom) |
| `marginInline` | margin-inline (RTL aware) |
| `marginBlock` | margin-block |
| `marginInlineStart` / `marginInlineEnd` | logical margin |

### Padding（10）

| Prop | CSS 属性 |
| ---- | -------- |
| `p` | padding |
| `pt` | padding-top |
| `pb` | padding-bottom |
| `pl` | padding-left |
| `pr` | padding-right |
| `px` | padding-inline |
| `py` | padding-block |
| `paddingInline` | padding-inline |
| `paddingBlock` | padding-block |
| `paddingInlineStart` / `paddingInlineEnd` | logical padding |

### Sizing（8）

| Prop | CSS 属性 |
| ---- | -------- |
| `w` / `width` | width |
| `h` / `height` | height |
| `minW` / `minWidth` | min-width |
| `maxW` / `maxWidth` | max-width |
| `minH` / `minHeight` | min-height |
| `maxH` / `maxHeight` | max-height |
| `boxSize` | width + height 同值 |

### Color（5）

| Prop | CSS 属性 |
| ---- | -------- |
| `color` | color |
| `bg` / `background` | background |
| `backgroundColor` | background-color |
| `borderColor` | border-color |
| `colorPalette` | 主题色板（影响所有 color/bg/border） |

### Typography（16）

| Prop | CSS 属性 |
| ---- | -------- |
| `fontSize` | font-size |
| `fontWeight` | font-weight |
| `fontFamily` | font-family |
| `lineHeight` | line-height |
| `letterSpacing` | letter-spacing |
| `textAlign` | text-align |
| `textTransform` | text-transform |
| `textDecoration` | text-decoration |
| `fontStyle` | font-style |
| `whiteSpace` | white-space |
| `wordBreak` | word-break |
| `textOverflow` | text-overflow |
| `overflowWrap` | overflow-wrap |
| `verticalAlign` | vertical-align |
| `lineClamp` | -webkit-line-clamp (多行截断) |
| `truncate` | 单行截断 (overflow+ellipsis+nowrap) |

### Background（5）

| Prop | CSS 属性 |
| ---- | -------- |
| `bgImage` | background-image |
| `bgSize` | background-size |
| `bgPosition` | background-position |
| `bgRepeat` | background-repeat |
| `bgGradient` | linear-gradient 等 |

### Border（13）

| Prop | CSS 属性 |
| ---- | -------- |
| `border` | border 缩写 |
| `borderWidth` | border-width |
| `borderStyle` | border-style |
| `borderColor` | border-color |
| `borderRadius` | border-radius |
| `borderTop` / `borderBottom` / `borderLeft` / `borderRight` | 单边 border |
| `borderTopWidth` / `borderTopColor` / `borderTopStyle` | 单边 width/color/style |
| `borderTopLeftRadius` / `borderTopRightRadius` 等 | 单角圆角 |

### Shadow（2）

| Prop | CSS 属性 |
| ---- | -------- |
| `boxShadow` | box-shadow |
| `textShadow` | text-shadow |

### Layout（10）

| Prop | CSS 属性 |
| ---- | -------- |
| `display` | display |
| `flex` | flex 缩写 |
| `flexDirection` | flex-direction |
| `flexWrap` | flex-wrap |
| `flexBasis` | flex-basis |
| `flexGrow` | flex-grow |
| `flexShrink` | flex-shrink |
| `gap` | gap |
| `rowGap` | row-gap |
| `columnGap` | column-gap |
| `alignItems` | align-items |
| `justifyContent` | justify-content |
| `alignSelf` | align-self |
| `justifySelf` | justify-self |
| `order` | order |

### Grid（10）

| Prop | CSS 属性 |
| ---- | -------- |
| `gridTemplateColumns` | grid-template-columns |
| `gridTemplateRows` | grid-template-rows |
| `gridTemplateAreas` | grid-template-areas |
| `gridColumn` | grid-column |
| `gridRow` | grid-row |
| `gridColumnGap` | grid-column-gap |
| `gridRowGap` | grid-row-gap |
| `gridGap` | grid-gap |
| `gridArea` | grid-area |
| `gridAutoFlow` | grid-auto-flow |

### Position（8）

| Prop | CSS 属性 |
| ---- | -------- |
| `pos` / `position` | position |
| `top` | top |
| `left` | left |
| `right` | right |
| `bottom` | bottom |
| `zIndex` | z-index |
| `inset` | inset (top+left+right+bottom) |
| `insetInline` / `insetBlock` | logical inset |

### Visibility（4）

| Prop | CSS 属性 |
| ---- | -------- |
| `opacity` | opacity |
| `visibility` | visibility |
| `hideFrom` | 在某断点及以上隐藏（v3 替代 v2 Hide above） |
| `hideBelow` | 在某断点以下隐藏 |

### Overflow（3）

| Prop | CSS 属性 |
| ---- | -------- |
| `overflow` | overflow |
| `overflowX` | overflow-x |
| `overflowY` | overflow-y |

### Transform（7）

| Prop | CSS 属性 |
| ---- | -------- |
| `transform` | transform |
| `transformOrigin` | transform-origin |
| `rotate` | rotate (CSS) |
| `scale` | scale (CSS) |
| `scaleX` / `scaleY` | scale single axis |
| `translateX` / `translateY` | translate single axis |
| `skew` / `skewX` / `skewY` | skew |

### Transition（4）

| Prop | CSS 属性 |
| ---- | -------- |
| `transition` | transition |
| `transitionProperty` | transition-property |
| `transitionDuration` | transition-duration |
| `transitionTimingFunction` | transition-timing-function |

### Filter（5）

| Prop | CSS 属性 |
| ---- | -------- |
| `filter` | filter |
| `backdropFilter` | backdrop-filter |
| `blur` | filter: blur() |
| `brightness` | filter: brightness() |
| `contrast` | filter: contrast() |

### Interactivity（4）

| Prop | CSS 属性 |
| ---- | -------- |
| `cursor` | cursor |
| `pointerEvents` | pointer-events |
| `userSelect` | user-select |
| `outline` | outline |

### Animation（2）

| Prop | CSS 属性 |
| ---- | -------- |
| `animation` | animation |
| `animationName` | animation-name |

## Conditional Style Props 完整表

### Pseudo Classes（30+）

| 条件 | 选择器 |
| ---- | ------ |
| `_hover` | :hover |
| `_active` | :active |
| `_focus` | :focus |
| `_focusWithin` | :focus-within |
| `_focusVisible` | :focus-visible |
| `_disabled` | :disabled / [aria-disabled=true] |
| `_checked` | :checked / [aria-checked=true] |
| `_visited` | :visited |
| `_selected` | [aria-selected=true] / [data-selected] |
| `_expanded` | [aria-expanded=true] |
| `_required` | :required |
| `_invalid` | [aria-invalid=true] / [data-invalid] |
| `_valid` | :valid |
| `_readOnly` | :read-only |
| `_empty` | :empty |
| `_first` | :first-child |
| `_last` | :last-child |
| `_odd` | :nth-child(odd) |
| `_even` | :nth-child(even) |
| `_indeterminate` | :indeterminate |
| `_currentPage` | [aria-current=page] (v3 替代 _activeLink) |
| `_currentStep` | [aria-current=step] (v3 替代 _activeStep) |

### Pseudo Elements（8）

| 条件 | 选择器 |
| ---- | ------ |
| `_before` | ::before |
| `_after` | ::after |
| `_placeholder` | ::placeholder |
| `_file` | ::file-selector-button |
| `_firstLetter` | ::first-letter |
| `_firstLine` | ::first-line |
| `_marker` | ::marker |
| `_selection` | ::selection |

### Group / Peer（10）

| 条件 | 说明 |
| ---- | ---- |
| `_groupHover` | 父 group hover 时 |
| `_groupFocus` | 父 group focus 时 |
| `_groupActive` | 父 group active 时 |
| `_groupDisabled` | 父 group disabled 时 |
| `_groupChecked` | 父 group checked 时 |
| `_peerHover` | 兄弟 peer hover 时 |
| `_peerFocus` | 兄弟 peer focus 时 |
| `_peerActive` | 兄弟 peer active 时 |
| `_peerDisabled` | 兄弟 peer disabled 时 |
| `_peerChecked` | 兄弟 peer checked 时 |

### Media Queries（11）

| 条件 | 说明 |
| ---- | ---- |
| `_dark` | 暗色模式 (`[data-theme=dark]` 或 `.dark`) |
| `_light` | 浅色模式 |
| `_osDark` | OS 暗色偏好 |
| `_osLight` | OS 浅色偏好 (v3 替代 v2 `_mediaDark`) |
| `_highContrast` | 高对比度偏好 |
| `_lessContrast` | 低对比度偏好 |
| `_motionReduce` | 减少动画偏好 |
| `_motionSafe` | 允许动画 |
| `_portrait` | 竖屏 |
| `_landscape` | 横屏 |
| `_print` | 打印 |
| `_rtl` | RTL 方向 |
| `_ltr` | LTR 方向 |

### Responsive Breakpoints（6 + 高级）

| 断点 | 像素 / em |
| ---- | --------- |
| `base` | 0px+ |
| `sm` | 30em / 480px+ |
| `md` | 48em / 768px+ |
| `lg` | 62em / 992px+ |
| `xl` | 80em / 1280px+ |
| `2xl` | 96em / 1536px+ |

**高级断点目标**：

| 写法 | 说明 |
| ---- | ---- |
| `mdToXl` | md ≤ 视口 < xl |
| `lgOnly` | 仅 lg 断点 |
| `smDown` | < sm |
| `mdUp` | ≥ md |
| `mdDown` | < md |
| `xlUp` | ≥ xl |

## createSystem + defineConfig 完整选项

```ts
import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
  // ─── 全局配置 ───────────────────────────────
  preflight: true,                       // 启用 CSS 重置
  cssVarsRoot: ":where(html)",           // CSS 变量根选择器
  cssVarsPrefix: "chakra",               // CSS 变量前缀
  strictTokens: false,                   // 严格 token 模式

  // ─── 全局样式 ───────────────────────────────
  globalCss: {
    "html, body": {
      fontFamily: "body",
      bg: "bg",
      color: "fg",
    },
  },

  // ─── 主题配置 ───────────────────────────────
  theme: {
    breakpoints: {
      base: "0em",
      sm: "30em",
      md: "48em",
      lg: "62em",
      xl: "80em",
      "2xl": "96em",
    },

    // ─── Base Tokens（design values）────────
    tokens: {
      colors: { /* 详见下文 Token 体系 */ },
      spacing: { /* ... */ },
      sizes: { /* ... */ },
      radii: { /* ... */ },
      shadows: { /* ... */ },
      fontSizes: { /* ... */ },
      fontWeights: { /* ... */ },
      lineHeights: { /* ... */ },
      letterSpacings: { /* ... */ },
      fonts: { /* ... */ },
      zIndices: { /* ... */ },
      borders: { /* ... */ },
      animations: { /* ... */ },
      cursor: { /* ... */ },
      easings: { /* ... */ },
      durations: { /* ... */ },
    },

    // ─── Semantic Tokens（语义化）──────────
    semanticTokens: {
      colors: {
        danger: { value: "{colors.red.500}" },
        primary: {
          value: { base: "{colors.brand.500}", _dark: "{colors.brand.400}" },
        },
      },
    },

    // ─── Recipes（组件变体）────────────────
    recipes: {
      button: defineRecipe({ /* ... */ }),
    },

    // ─── Slot Recipes（多部分组件）─────────
    slotRecipes: {
      card: defineSlotRecipe({ /* ... */ }),
    },

    // ─── Keyframes（动画）──────────────────
    keyframes: {
      spin: {
        from: { transform: "rotate(0deg)" },
        to: { transform: "rotate(360deg)" },
      },
    },

    // ─── Text Styles（预设文本样式）────────
    textStyles: {
      heading: {
        value: {
          fontFamily: "heading",
          fontWeight: "bold",
          lineHeight: "shorter",
        },
      },
    },

    // ─── Layer Styles（预设层样式）─────────
    layerStyles: {
      card: {
        value: {
          bg: "bg.panel",
          borderRadius: "lg",
          boxShadow: "md",
        },
      },
    },
  },

  // ─── 自定义条件 ─────────────────────────────
  conditions: {
    cqSm: "@container(min-width: 320px)",
    child: "& > *",
  },
});

export const system = createSystem(defaultConfig, config);
```

## defineRecipe API

```ts
import { defineRecipe } from "@chakra-ui/react";

export const buttonRecipe = defineRecipe({
  className: "chakra-button",   // 生成的 class 前缀

  base: {
    display: "inline-flex",
    alignItems: "center",
    fontWeight: "medium",
  },

  variants: {
    variant: {
      solid: { bg: "colorPalette.500", color: "white" },
      outline: { borderWidth: "1px" },
      ghost: { bg: "transparent" },
    },
    size: {
      sm: { px: "3", py: "1", fontSize: "sm" },
      md: { px: "4", py: "2", fontSize: "md" },
      lg: { px: "6", py: "3", fontSize: "lg" },
    },
  },

  compoundVariants: [
    {
      variant: "outline",
      size: "lg",
      css: { borderWidth: "2px" },
    },
  ],

  defaultVariants: {
    variant: "solid",
    size: "md",
  },
});
```

## defineSlotRecipe API

```ts
import { defineSlotRecipe } from "@chakra-ui/react";

export const cardRecipe = defineSlotRecipe({
  className: "chakra-card",
  slots: ["root", "header", "body", "footer"],

  base: {
    root: { bg: "bg.panel", borderRadius: "lg" },
    header: { p: "4" },
    body: { p: "4" },
    footer: { p: "4" },
  },

  variants: {
    size: {
      sm: { header: { p: "3" }, body: { p: "3" } },
      lg: { header: { p: "6" }, body: { p: "6" } },
    },
  },

  defaultVariants: { size: "md" },
});
```

## ChakraProvider 完整选项

```tsx
import { ChakraProvider } from "@chakra-ui/react";

<ChakraProvider
  value={system}                  // createSystem 生成的实例
>
  {children}
</ChakraProvider>;
```

> v3 只有 `value` prop（与 v2 的 `theme` prop 区别）。

## ColorModeProvider（next-themes）选项

```tsx
import { ColorModeProvider } from "@/components/ui/color-mode";

<ColorModeProvider
  attribute="class"                       // class 或 data-theme
  defaultTheme="system"                   // system / light / dark
  enableSystem={true}                     // 启用系统跟随
  disableTransitionOnChange={true}        // 切换时禁用过渡
  forcedTheme={undefined}                 // 强制特定 theme（不可切换）
  themes={["light", "dark"]}              // 可选 theme 列表
  storageKey="theme"                      // localStorage key
>
  {children}
</ColorModeProvider>;
```

## useColorMode

```ts
const {
  colorMode,         // "light" | "dark"
  setColorMode,      // (mode: "light" | "dark" | "system") => void
  toggleColorMode,   // () => void  light <-> dark
} = useColorMode();
```

## useColorModeValue

```ts
const value = useColorModeValue(lightValue, darkValue);
```

## useBreakpoint / useBreakpointValue

```ts
import { useBreakpoint, useBreakpointValue } from "@chakra-ui/react";

// 当前断点
const bp = useBreakpoint();
// 返回 "base" | "sm" | "md" | "lg" | "xl" | "2xl"

// 根据断点取值
const value = useBreakpointValue({
  base: "mobile",
  md: "desktop",
});
```

## Toast API

### createToaster 选项

```ts
import { createToaster } from "@chakra-ui/react";

export const toaster = createToaster({
  placement: "top-end",          // 6 个位置
  pauseOnPageIdle: true,
  max: 5,                         // 最多同时显示数
  duration: 5000,                 // 默认显示时长
  overlap: false,
  offsets: { top: "0px", bottom: "0px", left: "0px", right: "0px" },
});
```

`placement` 可选：

- `top-start` / `top` / `top-end`
- `bottom-start` / `bottom` / `bottom-end`

### toaster.create

```ts
toaster.create({
  id: "unique-id",
  title: "标题",
  description: "描述",
  type: "success",           // success / error / warning / info / loading
  duration: 5000,
  closable: true,
  action: {
    label: "撤销",
    onClick: () => {},
  },
});
```

### toaster.update / dismiss / promise

```ts
toaster.update("id", { title: "新标题" });
toaster.dismiss("id");
toaster.dismiss();           // 全部关闭

toaster.promise(promise, {
  loading: { title: "加载中" },
  success: { title: "成功" },
  error: { title: "失败" },
});
```

## Token 体系

### Spacing Scale（默认）

| Token | 值 |
| ----- | -- |
| `0` | 0 |
| `0.5` | 0.125rem (2px) |
| `1` | 0.25rem (4px) |
| `1.5` | 0.375rem (6px) |
| `2` | 0.5rem (8px) |
| `2.5` | 0.625rem (10px) |
| `3` | 0.75rem (12px) |
| `3.5` | 0.875rem (14px) |
| `4` | 1rem (16px) |
| `5` | 1.25rem (20px) |
| `6` | 1.5rem (24px) |
| `7` | 1.75rem (28px) |
| `8` | 2rem (32px) |
| `9` | 2.25rem (36px) |
| `10` | 2.5rem (40px) |
| `12` | 3rem (48px) |
| `14` | 3.5rem (56px) |
| `16` | 4rem (64px) |
| `20` | 5rem (80px) |
| `24` | 6rem (96px) |
| `32` | 8rem (128px) |
| `40` | 10rem (160px) |
| `48` | 12rem (192px) |
| `56` | 14rem (224px) |
| `64` | 16rem (256px) |
| `72` | 18rem (288px) |
| `80` | 20rem (320px) |
| `96` | 24rem (384px) |

### Sizes Scale

同 spacing + 额外别名：

| Token | 值 |
| ----- | -- |
| `3xs` | 14rem (224px) |
| `2xs` | 16rem (256px) |
| `xs` | 20rem (320px) |
| `sm` | 24rem (384px) |
| `md` | 28rem (448px) |
| `lg` | 32rem (512px) |
| `xl` | 36rem (576px) |
| `2xl` | 42rem (672px) |
| `3xl` | 48rem (768px) |
| `4xl` | 56rem (896px) |
| `5xl` | 64rem (1024px) |
| `6xl` | 72rem (1152px) |
| `7xl` | 80rem (1280px) |
| `8xl` | 90rem (1440px) |
| `full` | 100% |
| `min` | min-content |
| `max` | max-content |
| `fit` | fit-content |
| `prose` | 65ch |

### Color Palette（默认 10 色 × 11 shade）

v3 起每色板 11 shade（50-950）：

```css
--colors-{color}-50 ~ --colors-{color}-950
```

默认色板（10 色）：

| 色名 | 用途 |
| ---- | ---- |
| `gray` | 中性灰（默认 colorPalette） |
| `red` | 红色 |
| `orange` | 橙色 |
| `yellow` | 黄色 |
| `green` | 绿色 |
| `teal` | 蓝绿 |
| `blue` | 蓝色 |
| `cyan` | 青色 |
| `purple` | 紫色 |
| `pink` | 粉色 |

每色 11 shade：50 / 100 / 200 / 300 / 400 / 500 / 600 / 700 / 800 / 900 / 950

### Font Size Scale

| Token | 值 |
| ----- | -- |
| `xs` | 0.75rem |
| `sm` | 0.875rem |
| `md` | 1rem |
| `lg` | 1.125rem |
| `xl` | 1.25rem |
| `2xl` | 1.5rem |
| `3xl` | 1.875rem |
| `4xl` | 2.25rem |
| `5xl` | 3rem |
| `6xl` | 3.75rem |
| `7xl` | 4.5rem |
| `8xl` | 6rem |
| `9xl` | 8rem |

### Font Weight

| Token | 值 |
| ----- | -- |
| `hairline` | 100 |
| `thin` | 200 |
| `light` | 300 |
| `normal` | 400 |
| `medium` | 500 |
| `semibold` | 600 |
| `bold` | 700 |
| `extrabold` | 800 |
| `black` | 900 |

### Line Height

| Token | 值 |
| ----- | -- |
| `none` | 1 |
| `shorter` | 1.25 |
| `short` | 1.375 |
| `base` | 1.5 |
| `tall` | 1.625 |
| `taller` | 2 |
| `loose` | 2 |

### Letter Spacing

| Token | 值 |
| ----- | -- |
| `tighter` | -0.05em |
| `tight` | -0.025em |
| `normal` | 0 |
| `wide` | 0.025em |
| `wider` | 0.05em |
| `widest` | 0.1em |

### Border Radius

| Token | 值 |
| ----- | -- |
| `none` | 0 |
| `xs` | 0.125rem |
| `sm` | 0.25rem |
| `md` | 0.375rem |
| `lg` | 0.5rem |
| `xl` | 0.75rem |
| `2xl` | 1rem |
| `3xl` | 1.5rem |
| `full` | 9999px |

### Box Shadow

| Token | 值 |
| ----- | -- |
| `xs` | 0 0 0 1px rgba(0,0,0,0.05) |
| `sm` | 0 1px 2px 0 rgba(0,0,0,0.05) |
| `md` | 0 4px 6px -1px rgba(0,0,0,0.1) |
| `lg` | 0 10px 15px -3px rgba(0,0,0,0.1) |
| `xl` | 0 20px 25px -5px rgba(0,0,0,0.1) |
| `2xl` | 0 25px 50px -12px rgba(0,0,0,0.25) |
| `inner` | inset 0 2px 4px 0 rgba(0,0,0,0.06) |
| `outline` | 0 0 0 3px rgba(66,153,225,0.6) |
| `none` | none |

### Z-Index

| Token | 值 |
| ----- | -- |
| `hide` | -1 |
| `auto` | auto |
| `base` | 0 |
| `docked` | 10 |
| `dropdown` | 1000 |
| `sticky` | 1100 |
| `banner` | 1200 |
| `overlay` | 1300 |
| `modal` | 1400 |
| `popover` | 1500 |
| `skipLink` | 1600 |
| `toast` | 1700 |
| `tooltip` | 1800 |

## Semantic Tokens（默认提供）

v3 默认提供以下语义 token（自适应暗色 / 浅色）：

### Background

| Token | 用途 |
| ----- | ---- |
| `bg` | 默认背景 |
| `bg.subtle` | 弱化背景 |
| `bg.muted` | 静音背景 |
| `bg.emphasized` | 强调背景 |
| `bg.inverted` | 反转背景 |
| `bg.panel` | 面板背景（卡片等） |
| `bg.error` | 错误背景 |
| `bg.warning` | 警告背景 |
| `bg.success` | 成功背景 |
| `bg.info` | 信息背景 |

### Foreground

| Token | 用途 |
| ----- | ---- |
| `fg` | 默认文本色 |
| `fg.subtle` | 弱化文本 |
| `fg.muted` | 静音文本 |
| `fg.error` | 错误文本 |
| `fg.warning` | 警告文本 |
| `fg.success` | 成功文本 |
| `fg.info` | 信息文本 |
| `fg.inverted` | 反转文本 |

### Border

| Token | 用途 |
| ----- | ---- |
| `border` | 默认边框 |
| `border.subtle` | 弱化边框 |
| `border.muted` | 静音边框 |
| `border.error` | 错误边框 |
| `border.warning` | 警告边框 |
| `border.success` | 成功边框 |
| `border.info` | 信息边框 |

## Snippet CLI 命令

```bash
# 安装所有默认 snippet
npx @chakra-ui/cli snippet add

# 安装特定 snippet
npx @chakra-ui/cli snippet add color-mode
npx @chakra-ui/cli snippet add toaster
npx @chakra-ui/cli snippet add tooltip
npx @chakra-ui/cli snippet add dialog
npx @chakra-ui/cli snippet add drawer

# 列出可用的 snippet
npx @chakra-ui/cli snippet ls

# 自动迁移（v2 → v3）
npx @chakra-ui/codemod upgrade
```

## TypeScript 核心类型

```ts
import type {
  // 主题
  SystemContext,
  Tokens,
  SemanticTokens,
  RecipeConfig,
  SlotRecipeConfig,
  RecipeVariantProps,
  SlotRecipeVariantProps,

  // 组件 props
  BoxProps,
  ButtonProps,
  TextProps,
  HeadingProps,
  StackProps,
  FlexProps,
  ContainerProps,
  InputProps,
  TextareaProps,
  SelectProps,
  CheckboxProps,
  RadioProps,
  SwitchProps,
  DialogProps,
  DrawerProps,
  MenuProps,
  TooltipProps,

  // Style Props
  SystemStyleObject,
  StyleProps,
  ConditionalValue,
  ResponsiveValue,

  // Color Palette
  ColorPalette,

  // 系统
  ChakraProviderProps,
} from "@chakra-ui/react";
```

### 主题类型扩展

```ts
// src/chakra.d.ts
import "@chakra-ui/react";

declare module "@chakra-ui/react" {
  interface ConfigTokenMap {
    colors: {
      brand: { 50: string; 100: string; /* ... */ 950: string };
    };
  }
}
```

## Ark UI 底层组件清单

如果需要直接用 headless 组件、可以从 `@ark-ui/react` 引入：

```bash
pnpm add @ark-ui/react
```

**Ark UI 提供 50+ headless 组件**：

- Accordion / AlertDialog / Avatar / Carousel / Checkbox / Clipboard / Collapsible / Combobox / DatePicker / Dialog / Editable / FileUpload / Float / Hoverable / Listbox / Menu / NumberInput / Pagination / PinInput / Popover / Presence / Progress / QrCode / RadioGroup / RatingGroup / SegmentControl / Select / Signal / Slider / Splitter / Stepper / Steps / Switch / Tabs / Tags / TagsInput / Toast / Toggle / ToggleGroup / Tooltip / Tour / TreeView / Vimeo / YouTube

详见 [ark-ui.com](https://ark-ui.com)。

## 升级路径

### v2 → v3 重大变更

**安装依赖**：

- 移除 `@emotion/styled` 和 `framer-motion` peer deps
- 加入 `npx @chakra-ui/cli snippet add` 步骤
- 移除 `@chakra-ui/icons` → 用 `react-icons` / `lucide-react`
- 移除 `@chakra-ui/hooks` → 用 `react-use` / `usehooks-ts`

**Provider**：

- `<ChakraProvider theme={theme}>` → `<ChakraProvider value={system}>`
- 新增 snippet 提供的 `<Provider>` 封装
- `ColorModeProvider` 改用 `next-themes`
- `ColorModeScript` 完全移除

**主题配置**：

- `extendTheme()` → `createSystem(defaultConfig, defineConfig(...))`
- token 值必须 `{ value: "..." }` 包装
- 色板每色 11 shade（新增 950）
- 新增 `semanticTokens` + `recipes` + `slotRecipes` + `conditions`

**API 重命名**：

- `colorScheme` → `colorPalette`
- `isOpen` → `open`
- `isDisabled` → `disabled`
- `isInvalid` → `invalid`
- `isRequired` → `required`
- `defaultIsOpen` → `defaultOpen`
- `isLoading` → `loading`
- `noOfLines` → `lineClamp`
- `truncated` → `truncate`
- `spacing` → `gap`（Stack/VStack/HStack）

**组件重构**：

- `Modal` → `Dialog.Root + Backdrop + Positioner + Content + ...`
- `FormControl` → `Field.Root + Label + HelperText + ErrorText`
- `Avatar` → `Avatar.Root + Image + Fallback + Badge`
- `Breadcrumb` → `Breadcrumb.Root + List + Item + Link`
- `Accordion` → `Accordion.Root + Item + ItemTrigger + ItemContent + ItemBody`
- `Card` → `Card.Root + Header + Body + Footer`
- `Tabs` → `Tabs.Root + List + Trigger + Content`
- `Alert` → `Alert.Root + Indicator + Title + Description`
- `Select` → `NativeSelect.Root + Field + Indicator`

**移除组件**：

- `StackItem` → 用 `Box`
- `FocusLock` → 装 `react-focus-lock`
- `AlertDialog` → 用 `Dialog` + `role="alertdialog"`
- `CircularProgress` → 改名 `ProgressCircle`
- `StackDivider` → 用 `Stack.Separator`
- `Show` / `Hide` → 用 `hideFrom` / `hideBelow` props
- `Collapse` → 改名 `Collapsible`
- `Divider` → 改名 `Separator`
- `Fade` / `Slide` 等过渡 → 统一 `Presence`

**自动迁移**：

```bash
npx @chakra-ui/codemod upgrade
```

## 关键模板项目

```bash
# Chakra UI v3 + Next.js App Router（推荐）
pnpm create next-app my-app --typescript --app
cd my-app
pnpm add @chakra-ui/react @emotion/react
npx @chakra-ui/cli snippet add

# Chakra UI v3 + Vite + React + TypeScript
pnpm create vite my-app -- --template react-ts
cd my-app
pnpm add @chakra-ui/react @emotion/react
pnpm add -D vite-tsconfig-paths
npx @chakra-ui/cli snippet add

# Playground
# https://chakra-ui.com/docs/get-started/playground
```

## 官方资源

| 资源 | URL |
| ---- | --- |
| 主文档 | https://chakra-ui.com/ |
| 入门 | https://chakra-ui.com/docs/get-started/installation |
| Migration v2 → v3 | https://chakra-ui.com/docs/get-started/migration |
| 组件总览 | https://chakra-ui.com/docs/components/concepts/overview |
| Theming | https://chakra-ui.com/docs/theming/overview |
| Recipes | https://chakra-ui.com/docs/theming/recipes |
| Slot Recipes | https://chakra-ui.com/docs/theming/slot-recipes |
| Dark Mode | https://chakra-ui.com/docs/styling/dark-mode |
| Conditional Styles | https://chakra-ui.com/docs/styling/conditional-styles |
| Responsive Design | https://chakra-ui.com/docs/styling/responsive-design |
| CLI | https://chakra-ui.com/docs/get-started/cli |
| Playground | https://chakra-ui.com/docs/get-started/playground |
| Changelog | https://chakra-ui.com/docs/get-started/changelog |
| Figma | https://chakra-ui.com/docs/get-started/figma |
| GitHub | https://github.com/chakra-ui/chakra-ui |
| Ark UI（headless） | https://ark-ui.com |
| Panda CSS（引擎） | https://panda-css.com |
| Zag.js（状态机） | https://zagjs.com |

## 社区扩展生态

| 包 | 用途 |
| -- | ---- |
| `@chakra-ui/cli` | CLI 工具 |
| `react-icons` | 推荐图标库（替代 v2 `@chakra-ui/icons`） |
| `lucide-react` | 替代图标库 |
| `react-hook-form` | 表单库（与 Field 完美配合） |
| `@hookform/resolvers` | RHF + Zod / Yup 集成 |
| `zod` | Schema 校验（推荐） |
| `next-themes` | 暗色模式（v3 默认） |
| `react-focus-lock` | 焦点陷阱（v3 移除 FocusLock 替代品） |
| `@tanstack/react-table` | 数据表格（Chakra Table 不够强时） |
| `@tabler/icons-react` | Tabler 图标库 |
