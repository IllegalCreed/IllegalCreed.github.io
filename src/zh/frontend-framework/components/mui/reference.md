---
layout: doc
outline: [2, 3]
---

# 参考

本文档是 **MUI v9.x** 的 API 速查手册：80+ 组件清单、`sx` prop 全部缩写、`createTheme` 完整选项树、TypeScript 核心类型、MUI X 包速查。日常开发查找 API 用此页。

## 包速查

### 核心包

| 包 | 用途 | 必装 |
| --- | --- | --- |
| `@mui/material` | Material Design 组件主包 | ✅ |
| `@emotion/react` | Emotion 引擎 peer dep | ✅ |
| `@emotion/styled` | Emotion styled peer dep | ✅ |
| `@mui/system` | 底层 sx / styled / Box（自动依赖） | 自动 |
| `@mui/icons-material` | 2100+ Material 图标 | 推荐 |
| `@fontsource/roboto` | Roboto 字体本地化 | 推荐 |
| `@mui/material-nextjs` | Next.js App Router 集成 | Next.js 项目 |
| `@mui/lab` | 实验组件（Masonry / Timeline） | 可选 |

### MUI X 包

| 包 | 用途 | 许可 |
| --- | --- | --- |
| `@mui/x-data-grid` | 数据表格（社区版） | MIT |
| `@mui/x-data-grid-pro` | DataGrid Pro | 商业 |
| `@mui/x-data-grid-premium` | DataGrid Premium | 商业 |
| `@mui/x-date-pickers` | 日期选择器（含基础 DateRangePicker） | MIT |
| `@mui/x-date-pickers-pro` | Date Pickers Pro | 商业 |
| `@mui/x-charts` | 图表 | MIT |
| `@mui/x-tree-view` | 树视图 | MIT |

### 样式引擎替换

| 包 | 用途 |
| --- | --- |
| `@mui/styled-engine` | 默认 Emotion |
| `@mui/styled-engine-sc` | styled-components 替换 |
| `@pigment-css/react` | Pigment CSS Zero Runtime（实验） |

### 已迁出 / 不推荐

| 包 | 状态 |
| --- | --- |
| `@mui/base` | **已迁出**，新地址 `@base-ui/react`（[base-ui.com](https://base-ui.com)） |
| `@mui/joy` | **Joy UI 开发暂停**、不推荐新项目使用 |
| `@material-ui/core` | v4 老版本、已被 v9 取代 |

## 80+ 组件清单（按类别）

### Inputs（14）

| 组件 | import |
| --- | --- |
| Autocomplete | `@mui/material/Autocomplete` |
| Button | `@mui/material/Button` |
| ButtonGroup | `@mui/material/ButtonGroup` |
| Checkbox | `@mui/material/Checkbox` |
| Fab | `@mui/material/Fab` |
| FormControl | `@mui/material/FormControl` |
| FormControlLabel | `@mui/material/FormControlLabel` |
| FormGroup | `@mui/material/FormGroup` |
| FormHelperText | `@mui/material/FormHelperText` |
| FormLabel | `@mui/material/FormLabel` |
| Input | `@mui/material/Input` |
| InputAdornment | `@mui/material/InputAdornment` |
| InputBase | `@mui/material/InputBase` |
| InputLabel | `@mui/material/InputLabel` |
| Radio | `@mui/material/Radio` |
| RadioGroup | `@mui/material/RadioGroup` |
| Rating | `@mui/material/Rating` |
| Select | `@mui/material/Select` |
| MenuItem | `@mui/material/MenuItem` |
| Slider | `@mui/material/Slider` |
| Switch | `@mui/material/Switch` |
| TextField | `@mui/material/TextField` |
| ToggleButton | `@mui/material/ToggleButton` |
| ToggleButtonGroup | `@mui/material/ToggleButtonGroup` |

### Data Display（10）

| 组件 | import |
| --- | --- |
| Avatar | `@mui/material/Avatar` |
| AvatarGroup | `@mui/material/AvatarGroup` |
| Badge | `@mui/material/Badge` |
| Chip | `@mui/material/Chip` |
| Divider | `@mui/material/Divider` |
| Icon | `@mui/material/Icon` |
| List / ListItem / ListItemText / ListItemIcon / ListItemAvatar / ListItemButton | `@mui/material/List...` |
| Table / TableHead / TableBody / TableRow / TableCell / TableFooter / TablePagination / TableContainer / TableSortLabel | `@mui/material/Table...` |
| Tooltip | `@mui/material/Tooltip` |
| Typography | `@mui/material/Typography` |

### Feedback（7）

| 组件 | import |
| --- | --- |
| Alert / AlertTitle | `@mui/material/Alert` / `@mui/material/AlertTitle` |
| Backdrop | `@mui/material/Backdrop` |
| CircularProgress | `@mui/material/CircularProgress` |
| LinearProgress | `@mui/material/LinearProgress` |
| Dialog / DialogTitle / DialogContent / DialogContentText / DialogActions | `@mui/material/Dialog...` |
| Skeleton | `@mui/material/Skeleton` |
| Snackbar / SnackbarContent | `@mui/material/Snackbar...` |

### Surfaces（5）

| 组件 | import |
| --- | --- |
| Accordion / AccordionSummary / AccordionDetails / AccordionActions | `@mui/material/Accordion...` |
| AppBar | `@mui/material/AppBar` |
| Card / CardActions / CardActionArea / CardContent / CardHeader / CardMedia | `@mui/material/Card...` |
| Paper | `@mui/material/Paper` |
| Toolbar | `@mui/material/Toolbar` |

### Navigation（10）

| 组件 | import |
| --- | --- |
| BottomNavigation / BottomNavigationAction | `@mui/material/BottomNavigation...` |
| Breadcrumbs | `@mui/material/Breadcrumbs` |
| Drawer | `@mui/material/Drawer` |
| Link | `@mui/material/Link` |
| Menu / MenuItem / MenuList | `@mui/material/Menu...` |
| Menubar | `@mui/material/Menubar` |
| Pagination / PaginationItem | `@mui/material/Pagination...` |
| SpeedDial / SpeedDialAction / SpeedDialIcon | `@mui/material/SpeedDial...` |
| Stepper / Step / StepLabel / StepContent / StepConnector / StepIcon / StepButton | `@mui/material/Step...` |
| Tabs / Tab | `@mui/material/Tabs` / `@mui/material/Tab` |

### Layout（5）

| 组件 | import |
| --- | --- |
| Box | `@mui/material/Box` |
| Container | `@mui/material/Container` |
| Grid（**v2 默认**） | `@mui/material/Grid` |
| GridLegacy（v1 旧版） | `@mui/material/GridLegacy` |
| ImageList / ImageListItem / ImageListItemBar | `@mui/material/ImageList...` |
| Stack | `@mui/material/Stack` |

### Utils（10+）

| 组件 / Hook | import |
| --- | --- |
| ClickAwayListener | `@mui/material/ClickAwayListener` |
| CssBaseline | `@mui/material/CssBaseline` |
| ScopedCssBaseline | `@mui/material/ScopedCssBaseline` |
| GlobalStyles | `@mui/material/GlobalStyles` |
| InitColorSchemeScript | `@mui/material/InitColorSchemeScript` |
| Modal | `@mui/material/Modal` |
| NoSsr | `@mui/material/NoSsr` |
| Popover | `@mui/material/Popover` |
| Popper | `@mui/material/Popper` |
| Portal | `@mui/material/Portal` |
| TextareaAutosize | `@mui/material/TextareaAutosize` |
| Fade / Grow / Slide / Zoom / Collapse | `@mui/material/Fade` 等 |
| useMediaQuery | `@mui/material/useMediaQuery` |

### Lab 实验组件

| 组件 | import |
| --- | --- |
| Masonry | `@mui/lab/Masonry` |
| Timeline / TimelineItem / TimelineSeparator / TimelineConnector / TimelineContent / TimelineDot / TimelineOppositeContent | `@mui/lab/Timeline...` |

## 常用组件 Props 速查

### Button

| Prop | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `variant` | `"text" \| "outlined" \| "contained"` | `"text"` | 变体 |
| `color` | `"primary" \| "secondary" \| "success" \| "error" \| "info" \| "warning" \| "inherit"` | `"primary"` | 主题色 |
| `size` | `"small" \| "medium" \| "large"` | `"medium"` | 尺寸 |
| `disabled` | `boolean` | `false` | 禁用 |
| `loading` | `boolean` | `false` | 加载中（v6.4+） |
| `loadingPosition` | `"start" \| "end" \| "center"` | `"center"` | loading 位置 |
| `loadingIndicator` | `ReactNode` | `<CircularProgress />` | 自定义 loading 图标 |
| `startIcon` | `ReactNode` | — | 左侧图标 |
| `endIcon` | `ReactNode` | — | 右侧图标 |
| `fullWidth` | `boolean` | `false` | 占满父宽 |
| `href` | `string` | — | 渲染为链接 |
| `component` | `ElementType` | `"button"` | 渲染元素类型 |
| `disableElevation` | `boolean` | `false` | 取消阴影 |
| `disableFocusRipple` | `boolean` | `false` | 取消 focus 涟漪 |
| `disableRipple` | `boolean` | `false` | 取消所有涟漪 |
| `sx` | `SxProps<Theme>` | — | 内联样式 |

### TextField

| Prop | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `variant` | `"outlined" \| "filled" \| "standard"` | `"outlined"` | 变体 |
| `label` | `ReactNode` | — | 标签 |
| `value` | `unknown` | — | 受控值 |
| `defaultValue` | `unknown` | — | 非受控默认值 |
| `onChange` | `(e) => void` | — | 变化回调 |
| `error` | `boolean` | `false` | 错误状态 |
| `helperText` | `ReactNode` | — | 帮助文本 |
| `required` | `boolean` | `false` | 必填 |
| `disabled` | `boolean` | `false` | 禁用 |
| `multiline` | `boolean` | `false` | 多行 |
| `rows` / `minRows` / `maxRows` | `number` | — | 行数 |
| `fullWidth` | `boolean` | `false` | 占满父宽 |
| `size` | `"small" \| "medium"` | `"medium"` | 尺寸 |
| `margin` | `"none" \| "dense" \| "normal"` | `"none"` | 外边距 |
| `color` | 主题色 | `"primary"` | focus 时的色 |
| `select` | `boolean` | `false` | 渲染为下拉 |
| `type` | `string` | `"text"` | input type |
| `placeholder` | `string` | — | 占位符 |
| `autoFocus` | `boolean` | `false` | 自动聚焦 |
| `autoComplete` | `string` | — | 自动补全 |
| `slotProps` | `object` | — | 子组件 props |
| `sx` | `SxProps<Theme>` | — | 内联样式 |

### Box

| Prop | 类型 | 说明 |
| --- | --- | --- |
| `component` | `ElementType` | 渲染元素（默认 `div`） |
| `sx` | `SxProps<Theme>` | 内联样式 |

### Container

| Prop | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `maxWidth` | `false \| "xs" \| "sm" \| "md" \| "lg" \| "xl"` | `"lg"` | 最大宽度断点 |
| `fixed` | `boolean` | `false` | 用固定宽度替代响应式 |
| `disableGutters` | `boolean` | `false` | 取消左右 padding |
| `component` | `ElementType` | `"div"` | 渲染元素 |
| `sx` | `SxProps<Theme>` | — | 内联样式 |

### Grid (v2)

| Prop | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `container` | `boolean` | `false` | 是否为容器 |
| `size` | `number \| "auto" \| "grow" \| Partial<Record<Breakpoint, number \| "auto" \| "grow">>` | — | 占据列数 |
| `offset` | `number \| "auto" \| Partial<Record<Breakpoint, ...>>` | — | 偏移列数 |
| `spacing` | `number \| string \| Partial<Record<Breakpoint, ...>>` | `0` | container 的间距 |
| `rowSpacing` / `columnSpacing` | 同上 | — | 行 / 列单独间距 |
| `columns` | `number \| Partial<Record<Breakpoint, number>>` | `12` | 列数 |
| `direction` | `"row" \| "column" \| "row-reverse" \| "column-reverse"` | `"row"` | Flex 方向 |
| `wrap` | `"nowrap" \| "wrap" \| "wrap-reverse"` | `"wrap"` | 换行 |

### Stack

| Prop | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `direction` | `"row" \| "column" \| "row-reverse" \| "column-reverse"` | `"column"` | 方向 |
| `spacing` | `number \| string \| Partial<Record<Breakpoint, ...>>` | `0` | 子元素间距 |
| `divider` | `ReactNode` | — | 分隔符 |
| `useFlexGap` | `boolean` | `false` | 用 gap 而非 margin（推荐 true） |
| `component` | `ElementType` | `"div"` | 渲染元素 |

### Typography

| Prop | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `variant` | `"h1"-"h6" \| "subtitle1" \| "subtitle2" \| "body1" \| "body2" \| "button" \| "caption" \| "overline" \| "inherit"` | `"body1"` | 排版变体 |
| `component` | `ElementType` | 推导自 variant | 渲染元素 |
| `color` | `string` | `"text.primary"` | 主题路径或 CSS 颜色 |
| `align` | `"inherit" \| "left" \| "center" \| "right" \| "justify"` | `"inherit"` | 文本对齐 |
| `gutterBottom` | `boolean` | `false` | 底部留空 |
| `noWrap` | `boolean` | `false` | 不换行 + 省略 |
| `paragraph` | `boolean` | `false` | 渲染为 p |

### Dialog

| Prop | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `open` | `boolean` | — | 是否打开 |
| `onClose` | `(event, reason) => void` | — | 关闭回调 |
| `maxWidth` | `false \| "xs" \| "sm" \| "md" \| "lg" \| "xl"` | `"sm"` | 最大宽度 |
| `fullWidth` | `boolean` | `false` | 占满 maxWidth |
| `fullScreen` | `boolean` | `false` | 全屏 |
| `scroll` | `"body" \| "paper"` | `"paper"` | 滚动模式 |
| `transitionDuration` | `number \| { enter, exit }` | `225/195` | 过渡时间 |
| `disableEscapeKeyDown` | `boolean` | `false` | 禁用 ESC 关闭 |
| `slotProps` | `object` | — | 子组件 props |

### Drawer

| Prop | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `open` | `boolean` | — | 是否打开 |
| `onClose` | `(event, reason) => void` | — | 关闭回调 |
| `anchor` | `"left" \| "right" \| "top" \| "bottom"` | `"left"` | 位置 |
| `variant` | `"permanent" \| "persistent" \| "temporary"` | `"temporary"` | 变体 |
| `PaperProps` | `PaperProps` | — | Paper 容器 props |
| `ModalProps` | `ModalProps` | — | 底层 Modal props |

### Select

| Prop | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` | `unknown` | — | 受控值 |
| `onChange` | `(event, child) => void` | — | 变化回调 |
| `multiple` | `boolean` | `false` | 多选 |
| `displayEmpty` | `boolean` | `false` | 显示空值 |
| `renderValue` | `(value) => ReactNode` | — | 自定义值显示 |
| `variant` | `"standard" \| "outlined" \| "filled"` | `"outlined"` | 变体 |
| `MenuProps` | `MenuProps` | — | 菜单 props |

### Menu

| Prop | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `open` | `boolean` | — | 是否打开 |
| `onClose` | `(event, reason) => void` | — | 关闭回调 |
| `anchorEl` | `HTMLElement` | — | 锚定元素 |
| `anchorOrigin` | `{ vertical, horizontal }` | `top/left` | 锚点位置 |
| `transformOrigin` | `{ vertical, horizontal }` | `top/left` | 变换原点 |
| `MenuListProps` | `MenuListProps` | — | MenuList props |

### Tabs

| Prop | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` | `unknown` | — | 当前 tab 值 |
| `onChange` | `(event, value) => void` | — | 变化回调 |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | 方向 |
| `variant` | `"standard" \| "scrollable" \| "fullWidth"` | `"standard"` | 变体 |
| `scrollButtons` | `"auto" \| boolean` | `"auto"` | 滚动按钮 |
| `indicatorColor` | `"primary" \| "secondary"` | `"primary"` | 指示器色 |
| `textColor` | `"primary" \| "secondary" \| "inherit"` | `"primary"` | 文本色 |
| `centered` | `boolean` | `false` | 居中 |

### Pagination

| Prop | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `count` | `number` | — | 总页数 |
| `page` | `number` | — | 当前页（受控） |
| `defaultPage` | `number` | `1` | 默认页 |
| `onChange` | `(event, page) => void` | — | 变化回调 |
| `size` | `"small" \| "medium" \| "large"` | `"medium"` | 尺寸 |
| `variant` | `"text" \| "outlined"` | `"text"` | 变体 |
| `shape` | `"circular" \| "rounded"` | `"circular"` | 形状 |
| `color` | 主题色 | `"standard"` | 颜色 |
| `siblingCount` / `boundaryCount` | `number` | `1` | 显示按钮数 |

## `sx` prop 完整缩写表

### Spacing

| 缩写 | 等价 |
| --- | --- |
| `m` | `margin: theme.spacing(n)` |
| `mt` / `mr` / `mb` / `ml` | `margin-top / right / bottom / left` |
| `mx` | `margin-left + margin-right` |
| `my` | `margin-top + margin-bottom` |
| `p` | `padding: theme.spacing(n)` |
| `pt` / `pr` / `pb` / `pl` | `padding-top / right / bottom / left` |
| `px` | `padding-left + padding-right` |
| `py` | `padding-top + padding-bottom` |
| `gap` | `gap: theme.spacing(n)` |
| `rowGap` | `row-gap: theme.spacing(n)` |
| `columnGap` | `column-gap: theme.spacing(n)` |

### Palette（颜色）

| 缩写 | 等价 |
| --- | --- |
| `color` | `color` + palette 路径 |
| `bgcolor` | `background-color` + palette 路径 |
| `borderColor` | `border-color` + palette 路径 |
| `caretColor` | `caret-color` |

### Typography

| 缩写 | 等价 |
| --- | --- |
| `fontFamily` | `font-family` |
| `fontSize` | `font-size` + 主题路径 |
| `fontStyle` | `font-style` |
| `fontWeight` | `font-weight` + 主题路径 |
| `letterSpacing` | `letter-spacing` |
| `lineHeight` | `line-height` |
| `textAlign` | `text-align` |
| `textTransform` | `text-transform` |
| `typography` | 应用整个 variant（`typography: 'h4'`） |

### Sizing

| 缩写 | 等价 |
| --- | --- |
| `width` | `width`（数字 ≤1 转为百分比） |
| `height` | `height` |
| `minWidth` / `maxWidth` | `min/max-width` |
| `minHeight` / `maxHeight` | `min/max-height` |
| `boxSizing` | `box-sizing` |

### Border

| 缩写 | 等价 |
| --- | --- |
| `border` | `border`（数字 → `${n}px solid`） |
| `borderTop` / `borderRight` / `borderBottom` / `borderLeft` | 同上 |
| `borderColor` | `border-color` + palette |
| `borderRadius` | `border-radius`（数字 × `theme.shape.borderRadius`） |

### Display / Flexbox / Grid

| 缩写 | 等价 |
| --- | --- |
| `display` | `display` |
| `displayPrint` | print 模式专用 display |
| `flexDirection` | `flex-direction` |
| `flexWrap` | `flex-wrap` |
| `justifyContent` | `justify-content` |
| `alignItems` | `align-items` |
| `alignContent` | `align-content` |
| `alignSelf` | `align-self` |
| `order` | `order` |
| `flex` | `flex` |
| `flexGrow` | `flex-grow` |
| `flexShrink` | `flex-shrink` |
| `flexBasis` | `flex-basis` |
| `justifySelf` | `justify-self` |
| `gridAutoFlow` | `grid-auto-flow` |
| `gridTemplateColumns` | `grid-template-columns` |
| `gridTemplateRows` | `grid-template-rows` |
| `gridColumn` | `grid-column` |
| `gridRow` | `grid-row` |

### Position

| 缩写 | 等价 |
| --- | --- |
| `position` | `position` |
| `top` / `right` / `bottom` / `left` | `top` / `right` / `bottom` / `left` |
| `zIndex` | `z-index` + 主题路径（`zIndex: 'modal'`） |

### Box-shadow

| 缩写 | 等价 |
| --- | --- |
| `boxShadow` | `box-shadow` + `theme.shadows[n]`（数字索引） |

### Misc

| 缩写 | 等价 |
| --- | --- |
| `overflow` | `overflow` |
| `textOverflow` | `text-overflow` |
| `visibility` | `visibility` |
| `whiteSpace` | `white-space` |
| `opacity` | `opacity` |
| `cursor` | `cursor` |
| `transition` | `transition` |
| `transform` | `transform` |

## `createTheme` 选项树

```ts
createTheme({
  // Palette
  palette: {
    mode: "light" | "dark",
    primary: { main, light, dark, contrastText },
    secondary: { main, light, dark, contrastText },
    error: { main, ... },
    warning: { main, ... },
    info: { main, ... },
    success: { main, ... },
    text: { primary, secondary, disabled },
    background: { default, paper },
    divider: string,
    action: { active, hover, hoverOpacity, selected, selectedOpacity, disabled, disabledBackground, disabledOpacity, focus, focusOpacity, activatedOpacity },
    grey: { 50, 100, 200, ..., 900, A100, A200, A400, A700 },
    common: { black, white },
    contrastThreshold: number, // 默认 3
    tonalOffset: number,       // 默认 0.2
  },

  // Color Schemes（v9 推荐）
  colorSchemes: {
    light: { palette: { ... } },
    dark: { palette: { ... } } | true,
  },
  defaultColorScheme: "light" | "dark",

  // CSS Variables
  cssVariables: true | {
    cssVarPrefix: string,        // 默认 "mui"
    rootSelector: string,        // 默认 ":root"
    colorSchemeSelector: "class" | "data" | string, // CSS selector
    disableCssColorScheme: boolean,
    shouldSkipGeneratingVar: (keys, value) => boolean,
  },

  // Typography
  typography: {
    fontFamily: string,
    fontSize: number, // 默认 14
    fontWeightLight: number,
    fontWeightRegular: number,
    fontWeightMedium: number,
    fontWeightBold: number,
    htmlFontSize: number, // 默认 16
    h1 | h2 | h3 | h4 | h5 | h6: TypographyStyle,
    subtitle1 | subtitle2: TypographyStyle,
    body1 | body2: TypographyStyle,
    button | caption | overline: TypographyStyle,
  },

  // Spacing
  spacing: 8 | ((factor) => string) | number[],

  // Breakpoints
  breakpoints: {
    values: { xs, sm, md, lg, xl, [自定义]: number },
    unit: "px", // 默认
    step: number, // 默认 5
  },

  // zIndex
  zIndex: {
    mobileStepper: 1000,
    fab: 1050,
    speedDial: 1050,
    appBar: 1100,
    drawer: 1200,
    modal: 1300,
    snackbar: 1400,
    tooltip: 1500,
  },

  // Shape
  shape: {
    borderRadius: 4, // 默认
  },

  // Shadows（25 级）
  shadows: ["none", "...", "..."] as Shadows,

  // Transitions
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
    easing: {
      easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
      easeOut: "cubic-bezier(0.0, 0, 0.2, 1)",
      easeIn: "cubic-bezier(0.4, 0, 1, 1)",
      sharp: "cubic-bezier(0.4, 0, 0.6, 1)",
    },
  },

  // Components 默认值 + 样式覆盖 + 自定义 variants
  components: {
    [组件名 Mui+...]: {
      defaultProps: { ... },
      styleOverrides: {
        [slot 名]: { ... } | ((args) => ({ ... })),
      },
      variants: [
        { props: { ... }, style: { ... } },
      ],
    },
  },

  // Mixins
  mixins: {
    toolbar: CSSProperties,
  },

  // 自定义字段（需 Module Augmentation）
  customTokens: { ... },
});
```

## `styled()` 完整签名

```ts
styled(
  Component: React.ComponentType | string, // 基础组件或 HTML 标签
  options?: {
    name?: string;                    // 组件名（用于 theme.components 覆盖）
    slot?: string;                    // 槽位名
    shouldForwardProp?: (prop) => boolean;  // 控制 prop 是否传给底层
    overridesResolver?: (props, styles) => ComponentStyles; // 主题覆盖解析
    label?: string;                   // 开发模式 className 标签
    skipVariantsResolver?: boolean;   // 跳过 variants 解析
    skipSx?: boolean;                 // 跳过 sx prop
  }
)(
  // 样式定义：对象、函数、模板字符串
  styles: object | (({ theme, ...props }) => object) | (string[])
): StyledComponent<Props>
```

### 重载示例

```tsx
// 1. 对象样式
const A = styled("div")({ padding: 16 });

// 2. 函数（访问 theme + props）
const B = styled("div")<{ active: boolean }>(({ theme, active }) => ({
  padding: theme.spacing(2),
  background: active ? theme.palette.primary.main : "transparent",
}));

// 3. 基于 MUI 组件
const C = styled(Button)({ borderRadius: 999 });

// 4. options 完整
const D = styled("div", {
  name: "MyApp",
  slot: "Root",
  shouldForwardProp: (prop) => prop !== "active",
})<{ active: boolean }>(({ theme, active }) => ({
  /* ... */
}));
```

## TypeScript 核心类型

### `Theme`

```ts
import type { Theme } from "@mui/material/styles";

function getColor(theme: Theme): string {
  return theme.palette.primary.main;
}
```

### `SxProps<Theme>`

```ts
import type { SxProps, Theme } from "@mui/material";

const sx: SxProps<Theme> = {
  p: 2,
  bgcolor: "background.paper",
};
```

### `PaletteOptions` / `TypographyOptions` / `Components<Theme>`

```ts
import { createTheme, type PaletteOptions, type TypographyOptions, type Components } from "@mui/material/styles";

const palette: PaletteOptions = { primary: { main: "#1976d2" } };
const typography: TypographyOptions = { fontFamily: "Inter, sans-serif" };
const components: Components = {
  MuiButton: { defaultProps: { variant: "contained" } },
};

const theme = createTheme({ palette, typography, components });
```

### 组件 Props 类型

```ts
import type { ButtonProps, TextFieldProps, AlertProps } from "@mui/material";

interface MyButtonProps extends ButtonProps {
  customProp?: string;
}
```

### `Breakpoint`

```ts
import type { Breakpoint } from "@mui/material/styles";
// "xs" | "sm" | "md" | "lg" | "xl"

function getWidth(bp: Breakpoint): number {
  return { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 }[bp];
}
```

### Form / Controller 兼容

```ts
import type { Control, UseFormReturn, FieldValues } from "react-hook-form";

interface FormProps<T extends FieldValues> {
  control: Control<T>;
  form: UseFormReturn<T>;
}
```

## Hooks 速查

| Hook | 用途 |
| --- | --- |
| `useTheme()` | 访问当前 theme（必须在 ThemeProvider 内） |
| `useMediaQuery(query, options?)` | 响应式断点检测 |
| `useColorScheme()` | 暗色 / 浅色模式控制 |
| `useColorSchemeShim()` | colorSchemes 模式的 shim（兼容性） |
| `useFormControl()` | 在 FormControl 子组件内访问表单状态 |
| `useScrollTrigger(options?)` | 滚动触发器（AppBar elevation 等） |
| `useAutocomplete(options?)` | 自定义 Autocomplete 底层逻辑 |
| `usePagination(options?)` | 自定义 Pagination 底层逻辑 |
| `useStepperContext()` | 在 Step 子组件内访问 stepper 状态 |
| `useDialog()` | 在 Dialog 子组件内访问 Dialog 状态 |

## MUI X Data Grid Props 速查

```ts
import { DataGrid, type GridColDef, type DataGridProps } from "@mui/x-data-grid";
```

### 核心 Props

| Prop | 类型 | 说明 |
| --- | --- | --- |
| `rows` | `readonly any[]` | 数据行 |
| `columns` | `readonly GridColDef[]` | 列定义 |
| `loading` | `boolean` | 加载中 |
| `getRowId` | `(row) => GridRowId` | 行 ID 提取器（默认 `row.id`） |
| `initialState` | `GridInitialState` | 初始状态（排序 / 筛选 / 分页 / 列） |
| `checkboxSelection` | `boolean` | 复选选择 |
| `disableRowSelectionOnClick` | `boolean` | 禁用行点击选中 |
| `pagination` | `boolean` | 启用分页 |
| `paginationMode` | `"client" \| "server"` | 分页模式 |
| `pageSizeOptions` | `(number \| GridPageSizeOption)[]` | 每页大小选项 |
| `sortingMode` | `"client" \| "server"` | 排序模式 |
| `filterMode` | `"client" \| "server"` | 筛选模式 |
| `density` | `"compact" \| "standard" \| "comfortable"` | 行密度 |
| `processRowUpdate` | `(newRow, oldRow) => Row \| Promise<Row>` | 行编辑回调 |
| `rowSelectionModel` | `GridRowSelectionModel` | 当前选中（受控） |
| `onRowSelectionModelChange` | `(model) => void` | 选中变化 |
| `slots` | `Slots` | 替换子组件 |
| `slotProps` | `SlotProps` | 子组件 props |
| `sx` | `SxProps<Theme>` | 内联样式 |

### `GridColDef` 列定义

```ts
interface GridColDef {
  field: string;                            // 字段名
  headerName?: string;                      // 表头标题
  width?: number;                           // 宽度（px）
  minWidth?: number;
  maxWidth?: number;
  flex?: number;                            // flex 比例
  type?: "string" | "number" | "date" | "dateTime" | "boolean" | "singleSelect" | "actions";
  sortable?: boolean;
  filterable?: boolean;
  editable?: boolean;
  resizable?: boolean;
  hideable?: boolean;
  pinnable?: boolean;
  description?: string;                     // 表头 tooltip
  align?: "left" | "right" | "center";
  headerAlign?: "left" | "right" | "center";
  valueGetter?: (value, row, column, apiRef) => any;
  valueFormatter?: (value, row, column, apiRef) => string;
  valueParser?: (value, row, column, apiRef) => any;
  renderCell?: (params) => React.ReactNode;
  renderEditCell?: (params) => React.ReactNode;
  renderHeader?: (params) => React.ReactNode;
  valueOptions?: any[] | ((params) => any[]); // singleSelect 时
  cellClassName?: string | ((params) => string);
  headerClassName?: string;
}
```

## MUI X Date Pickers 速查

```ts
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { StaticDatePicker } from "@mui/x-date-pickers/StaticDatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
```

### 通用 DatePicker Props

| Prop | 类型 | 说明 |
| --- | --- | --- |
| `value` | `Dayjs \| null` | 当前值 |
| `onChange` | `(value) => void` | 变化回调 |
| `defaultValue` | `Dayjs \| null` | 默认值（非受控） |
| `label` | `ReactNode` | 标签 |
| `format` | `string` | 格式（如 `"YYYY-MM-DD"`） |
| `minDate` | `Dayjs` | 最小日期 |
| `maxDate` | `Dayjs` | 最大日期 |
| `shouldDisableDate` | `(date) => boolean` | 禁用日期函数 |
| `views` | `("year" \| "month" \| "day")[]` | 显示视图 |
| `openTo` | `"year" \| "month" \| "day"` | 默认打开视图 |
| `disabled` | `boolean` | 禁用 |
| `readOnly` | `boolean` | 只读 |
| `slotProps` | `object` | 子组件 props |

### Adapter 选择

| Adapter | 包 |
| --- | --- |
| `AdapterDayjs` | `dayjs`（推荐，小） |
| `AdapterDateFns` | `date-fns` |
| `AdapterLuxon` | `luxon` |
| `AdapterMoment` | `moment`（已不推荐） |

## MUI X Charts 速查

```ts
import { LineChart, BarChart, PieChart, ScatterChart, SparkLineChart } from "@mui/x-charts";
```

### LineChart Props

| Prop | 类型 | 说明 |
| --- | --- | --- |
| `xAxis` | `AxisConfig[]` | X 轴配置 |
| `yAxis` | `AxisConfig[]` | Y 轴配置 |
| `series` | `LineSeriesType[]` | 数据系列 |
| `width` | `number` | 宽度 |
| `height` | `number` | 高度 |
| `margin` | `{ top, right, bottom, left }` | 边距 |
| `colors` | `string[]` | 颜色数组 |
| `slots` | `Slots` | 替换子组件 |
| `slotProps` | `SlotProps` | 子组件 props |
| `tooltip` | `{ trigger: "axis" \| "item" \| "none" }` | tooltip 配置 |
| `legend` | `{ direction, position }` | 图例 |

## Material 图标

```bash
pnpm add @mui/icons-material
```

### 5 个变体（每个图标）

| 后缀 | 风格 |
| --- | --- |
| `（无）` | Filled（实心，默认） |
| `Outlined` | 描边 |
| `Rounded` | 圆角 |
| `TwoTone` | 双色 |
| `Sharp` | 直角 |

### 常用图标

```ts
import Add from "@mui/icons-material/Add";
import Delete from "@mui/icons-material/Delete";
import Edit from "@mui/icons-material/Edit";
import Save from "@mui/icons-material/Save";
import Search from "@mui/icons-material/Search";
import Settings from "@mui/icons-material/Settings";
import Close from "@mui/icons-material/Close";
import Menu from "@mui/icons-material/Menu";
import Home from "@mui/icons-material/Home";
import Person from "@mui/icons-material/Person";
import Notifications from "@mui/icons-material/Notifications";
import Favorite from "@mui/icons-material/Favorite";
import Star from "@mui/icons-material/Star";
import ArrowBack from "@mui/icons-material/ArrowBack";
import ArrowForward from "@mui/icons-material/ArrowForward";
import ExpandMore from "@mui/icons-material/ExpandMore";
import ChevronRight from "@mui/icons-material/ChevronRight";
import Check from "@mui/icons-material/Check";
import Cancel from "@mui/icons-material/Cancel";
import Refresh from "@mui/icons-material/Refresh";
import Download from "@mui/icons-material/Download";
import Upload from "@mui/icons-material/Upload";
import CloudUpload from "@mui/icons-material/CloudUpload";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import LightMode from "@mui/icons-material/LightMode";
import DarkMode from "@mui/icons-material/DarkMode";
import KeyboardArrowUp from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDown from "@mui/icons-material/KeyboardArrowDown";
```

### 图标 props

| Prop | 说明 |
| --- | --- |
| `color` | 主题色（`"primary"` / `"secondary"` 等） |
| `fontSize` | `"small"` / `"medium"` / `"large"` / `"inherit"` |
| `sx` | 内联样式 |

## `@mui/material-nextjs` API

```ts
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
// 或更老版本：
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v13-appRouter";
```

### AppRouterCacheProvider props

| Prop | 类型 | 说明 |
| --- | --- | --- |
| `options.key` | `string` | Emotion cache key（默认 `"mui"`） |
| `options.prepend` | `boolean` | 是否在 head 前面注入 |
| `options.enableCssLayer` | `boolean` | **启用 CSS Layers**（解决 Tailwind 优先级） |

### Pages Router 版本

```ts
import { DocumentHeadTags } from "@mui/material-nextjs/v15-pagesRouter";
```

需在 `_document.tsx` 配合 `createEmotionCache` 使用。**新项目推荐 App Router**。

## Base UI（独立站）

> **重要**：原 `@mui/base` 已迁出主仓库。新地址：[base-ui.com](https://base-ui.com)、包名 `@base-ui/react`。

```bash
pnpm add @base-ui/react
```

```ts
import { Slider } from "@base-ui/react/slider";
import { Dialog } from "@base-ui/react/dialog";
import { Tooltip } from "@base-ui/react/tooltip";
import { Menu } from "@base-ui/react/menu";
import { Tabs } from "@base-ui/react/tabs";
import { Accordion } from "@base-ui/react/accordion";
import { Select } from "@base-ui/react/select";
// 等等
```

> Base UI 是 unstyled / headless 组件、需自带样式（Tailwind / CSS Modules / 自定义 CSS）。

## 全局 CSS 工具

### CssBaseline

```ts
import CssBaseline from "@mui/material/CssBaseline";

<CssBaseline />
```

- 重置 `box-sizing`
- 重置 body 字体（Roboto）
- 重置 body 背景色（适配暗色模式）
- 重置链接 / 表格等

### ScopedCssBaseline

仅在子树内重置（不影响全局）：

```tsx
<ScopedCssBaseline>
  <App />
</ScopedCssBaseline>
```

### GlobalStyles

```tsx
import GlobalStyles from "@mui/material/GlobalStyles";

<GlobalStyles
  styles={(theme) => ({
    body: { backgroundColor: theme.palette.background.default },
    "@keyframes spin": {
      from: { transform: "rotate(0deg)" },
      to: { transform: "rotate(360deg)" },
    },
  })}
/>;
```

## 60+ 语言包

MUI 不像 Ant Design 那样集中维护语言包，但提供 `locales`（Material Design 文本本地化）+ MUI X 各 picker 的 locale。

### Material UI locales

```ts
import { zhCN, enUS, jaJP, koKR, frFR, deDE } from "@mui/material/locale";

const theme = createTheme(
  {
    palette: { /* ... */ },
  },
  zhCN,
);
```

主要语言包：`zhCN` / `zhTW` / `enUS` / `enGB` / `jaJP` / `koKR` / `frFR` / `deDE` / `esES` / `ptBR` / `ruRU` / `arSA` / `viVN` / `thTH` / `idID` / `trTR` / `nlNL` / `plPL` / `itIT` / `daDK` / `svSE` / `nbNO` / `fiFI`...

### MUI X Date Pickers locales

```ts
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/zh-cn";

<LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="zh-cn">
  <App />
</LocalizationProvider>;
```

### MUI X Data Grid locales

```ts
import { zhCN } from "@mui/x-data-grid/locales";

const theme = createTheme(
  { /* ... */ },
  zhCN, // 应用 Data Grid 中文
);
```

## 版本兼容矩阵

| MUI v9 | React | TypeScript | Node | Browser |
| --- | --- | --- | --- | --- |
| Material UI | 17 / 18 / 19 | 5+ | 18+ | Chrome 109+ / FF 115+ / Safari 16.4+ |
| MUI X v9 | 17 / 18 / 19 | 5+ | 18+ | 同上 |
| Pigment CSS | 18 / 19 | 5+ | 18+ | 同上 |

## 完整 import 速记

```ts
// 主题 + Hook
import {
  createTheme,
  ThemeProvider,
  useTheme,
  styled,
  alpha,
  darken,
  lighten,
  hslToRgb,
  type Theme,
  type Components,
} from "@mui/material/styles";
import { useColorScheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

// 全局 CSS
import CssBaseline from "@mui/material/CssBaseline";
import ScopedCssBaseline from "@mui/material/ScopedCssBaseline";
import GlobalStyles from "@mui/material/GlobalStyles";
import { InitColorSchemeScript } from "@mui/material/InitColorSchemeScript";

// 布局
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";

// 排版
import Typography from "@mui/material/Typography";

// 表单
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Checkbox from "@mui/material/Checkbox";
import Radio from "@mui/material/Radio";
import Switch from "@mui/material/Switch";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputLabel from "@mui/material/InputLabel";
import FormHelperText from "@mui/material/FormHelperText";
import Autocomplete from "@mui/material/Autocomplete";

// 反馈
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import CircularProgress from "@mui/material/CircularProgress";
import LinearProgress from "@mui/material/LinearProgress";

// 导航
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Drawer from "@mui/material/Drawer";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Pagination from "@mui/material/Pagination";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Menu from "@mui/material/Menu";

// Surfaces
import Paper from "@mui/material/Paper";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import CardHeader from "@mui/material/CardHeader";
import CardMedia from "@mui/material/CardMedia";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";

// Data Display
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import Tooltip from "@mui/material/Tooltip";

// Utils
import ClickAwayListener from "@mui/material/ClickAwayListener";
import Modal from "@mui/material/Modal";
import Popover from "@mui/material/Popover";
import Popper from "@mui/material/Popper";
import Portal from "@mui/material/Portal";
import NoSsr from "@mui/material/NoSsr";

// MUI X
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LineChart } from "@mui/x-charts/LineChart";

// Next.js
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
```

## 颜色常量

```ts
import {
  red, pink, purple, deepPurple,
  indigo, blue, lightBlue, cyan,
  teal, green, lightGreen, lime,
  yellow, amber, orange, deepOrange,
  brown, grey, blueGrey,
  common,
} from "@mui/material/colors";

// 每个颜色都有 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, A100, A200, A400, A700
blue[500]; // "#2196f3"
red[700];  // "#d32f2f"
```

## 工具函数

```ts
import {
  alpha,       // 添加透明度：alpha("#000", 0.5)
  darken,      // 加深：darken("#1976d2", 0.2)
  lighten,     // 提亮：lighten("#1976d2", 0.2)
  emphasize,   // 强调（自动暗色亮色）
  hslToRgb,    // HSL → RGB
  hexToRgb,    // Hex → RGB
  rgbToHex,    // RGB → Hex
  decomposeColor, // 拆分颜色
  recomposeColor, // 重组颜色
} from "@mui/material/styles";
```

## 资源链接

- **官网**：[mui.com](https://mui.com)
- **GitHub**：[mui/material-ui](https://github.com/mui/material-ui)
- **MUI X GitHub**：[mui/mui-x](https://github.com/mui/mui-x)
- **MUI X 官网**：[mui.com/x](https://mui.com/x)
- **Base UI**：[base-ui.com](https://base-ui.com)
- **Pigment CSS**：[github.com/mui/pigment-css](https://github.com/mui/pigment-css)
- **设计模板**：[mui.com/store](https://mui.com/store)
- **React Hook Form**：[react-hook-form.com](https://react-hook-form.com/)
- **notistack（全局 Snackbar）**：[notistack.com](https://notistack.com/)
- **material-react-table（DataGrid 替代）**：[material-react-table.com](https://www.material-react-table.com/)
- **react-admin（基于 MUI 的管理后台框架）**：[marmelab.com/react-admin](https://marmelab.com/react-admin/)
- **refine.dev（基于 MUI 的全栈框架）**：[refine.dev](https://refine.dev/)
