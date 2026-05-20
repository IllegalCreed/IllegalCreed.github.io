---
layout: doc
outline: [2, 3]
---

# 指南

本文档基于 **MUI v9.x + React 18/19 + TypeScript 5+**，是从「能用」走向「精通」的核心实战指南。涵盖 80+ 组件分类、`sx` prop 完整 API、`styled()` 深度、`createTheme` 全部选项、Form 表单方案、MUI X 生态、Next.js 完整集成、TypeScript Module Augmentation、Pigment CSS 评估等。

## 80+ 组件分类速览

MUI Material UI 把 80+ 组件分为 **7 大类**：Inputs、Data Display、Feedback、Surfaces、Navigation、Layout、Utils。下面按类别速览。

### Inputs（表单输入类）

| 组件 | 作用 |
| --- | --- |
| `Autocomplete` | 自动补全输入（替代原生 datalist） |
| `Button` | 按钮（3 变体：contained / outlined / text） |
| `ButtonGroup` | 按钮组（连排去间距） |
| `Checkbox` | 复选框 |
| `Fab` | Floating Action Button（悬浮操作按钮） |
| `NumberField` | 数字输入（v9 新增） |
| `RadioGroup` / `Radio` | 单选组 |
| `Rating` | 星级评分 |
| `Select` | 下拉选择（基于 Menu） |
| `Slider` | 滑块（值范围 / 区间） |
| `Switch` | 开关 |
| `TextField` | 文本输入（最常用） |
| `ToggleButton` / `ToggleButtonGroup` | 切换按钮组（互斥选择） |
| `TransferList` | 穿梭框（双侧列表互移） |

### Data Display（数据展示类）

| 组件 | 作用 |
| --- | --- |
| `Avatar` / `AvatarGroup` | 头像（图片 / 字母 / 图标） |
| `Badge` | 角标（红点 / 数字 / dot） |
| `Chip` | 标签 / 标签栏 |
| `Divider` | 分隔线（水平 / 垂直） |
| `Icon` | 字体图标（基于 Material Icons 字体） |
| `List` / `ListItem` / `ListItemText` 等 | 列表 |
| `Table` / `TableHead` / `TableBody` / `TableRow` / `TableCell` | 表格（基础） |
| `Tooltip` | 工具提示（hover 显示） |
| `Typography` | 排版（h1-h6, body, caption 等） |

### Feedback（反馈类）

| 组件 | 作用 |
| --- | --- |
| `Alert` | 警告 / 错误 / 信息 / 成功 横幅 |
| `Backdrop` | 遮罩层 |
| `CircularProgress` | 圆形加载 |
| `LinearProgress` | 线性进度条 |
| `Dialog` | 模态对话框 |
| `Skeleton` | 骨架屏 |
| `Snackbar` | Toast 通知 |

### Surfaces（容器表面类）

| 组件 | 作用 |
| --- | --- |
| `Accordion` | 折叠面板 |
| `AppBar` / `Toolbar` | 顶部栏 |
| `Card` / `CardActions` / `CardContent` / `CardHeader` / `CardMedia` | 卡片 |
| `Paper` | 纸张（基础白底带阴影容器） |

### Navigation（导航类）

| 组件 | 作用 |
| --- | --- |
| `BottomNavigation` | 底部导航 |
| `Breadcrumbs` | 面包屑 |
| `Drawer` | 抽屉（左 / 右 / 顶 / 底） |
| `Link` | 链接（语义 + 主题色） |
| `Menu` / `MenuItem` | 菜单（下拉） |
| `Menubar` | 菜单栏（v9 新增） |
| `Pagination` | 分页器 |
| `SpeedDial` | 快捷拨号（Fab 衍生） |
| `Stepper` / `Step` / `StepLabel` | 步骤条 |
| `Tabs` / `Tab` | 选项卡 |

### Layout（布局类）

| 组件 | 作用 |
| --- | --- |
| `Box` | 通用容器（接受 `sx` prop） |
| `Container` | 限宽内容容器 |
| `Grid` | 12 列响应式网格（v2，**v7+ 默认**） |
| `Stack` | 一维 Flex 容器 |
| `ImageList` | 图片网格 |

### Utils（实用组件）

| 组件 | 作用 |
| --- | --- |
| `ClickAwayListener` | 检测点击外部 |
| `CssBaseline` | 全局 CSS Reset |
| `InitColorSchemeScript` | SSR 反闪烁脚本 |
| `Modal` | 底层模态（Dialog 基类） |
| `NoSsr` | 跳过 SSR 渲染 |
| `Popover` | 浮层（绑定 anchor 元素） |
| `Popper` | Popper.js 浮层底层 |
| `Portal` | React Portal 封装 |
| `TextareaAutosize` | 自动伸缩 textarea |
| `Transitions`（Fade / Grow / Slide / Zoom 等） | 动画包装器 |
| `useMediaQuery` Hook | 响应式断点检测 |

### Lab（实验组件，未来可能升级到 Core）

`Masonry`（瀑布流）、`Timeline`（时间轴）—— 来自 `@mui/lab` 包（需单独安装）。

### MUI X（独立包）

| 包 | 作用 | 许可 |
| --- | --- | --- |
| `@mui/x-data-grid` | 数据表格（DataGrid / DataGridPro / DataGridPremium） | 社区 MIT / 商业 Pro / Premium |
| `@mui/x-date-pickers` | 日期选择器 | MIT（基础）/ Pro（DateRangePicker 等） |
| `@mui/x-charts` | 图表（折线 / 柱 / 饼 / 散点） | MIT |
| `@mui/x-tree-view` | 树视图 | MIT |

## `sx` prop 完整 API

`sx` prop 是 MUI 自定义样式的**首选 API**——99% 一次性样式都通过 `sx` 实现，无需 `styled()`。

### 基本对象语法

```tsx
<Box
  sx={{
    width: 300,
    height: 200,
    bgcolor: "primary.main", // 主题路径
    color: "common.white",
    p: 2,
    m: 1,
    borderRadius: 1,
    boxShadow: 3,
  }}
/>
```

### 完整 spacing 缩写

| 缩写 | CSS 属性 |
| --- | --- |
| `m` | margin |
| `mt` / `mr` / `mb` / `ml` | margin-top / right / bottom / left |
| `mx` | margin-inline（左右） |
| `my` | margin-block（上下） |
| `p` | padding |
| `pt` / `pr` / `pb` / `pl` | padding-top / right / bottom / left |
| `px` | padding-inline |
| `py` | padding-block |
| `gap` / `rowGap` / `columnGap` | Flex / Grid 间距 |

**数字单位**：默认 `theme.spacing(n)` —— 即 `n * 8px`：

```tsx
<Box sx={{ p: 2 }} />   // padding: 16px（2 * 8）
<Box sx={{ m: 0.5 }} /> // margin: 4px（0.5 * 8）
<Box sx={{ p: 3 }} />   // padding: 24px（3 * 8）
```

字符串单位（直接 CSS 值）：

```tsx
<Box sx={{ p: "16px" }} />
<Box sx={{ p: "1rem" }} />
<Box sx={{ width: "100%" }} />
```

### 主题路径（palette / typography / shadows / zIndex / shape）

```tsx
<Box
  sx={{
    // palette 路径
    bgcolor: "primary.main",         // theme.palette.primary.main
    color: "text.secondary",         // theme.palette.text.secondary
    borderColor: "divider",          // theme.palette.divider

    // typography
    fontSize: "h4.fontSize",         // theme.typography.h4.fontSize
    fontWeight: "bold",              // theme.typography.fontWeightBold

    // shadows
    boxShadow: 3,                    // theme.shadows[3]

    // zIndex
    zIndex: "modal",                 // theme.zIndex.modal

    // shape
    borderRadius: 1,                 // theme.shape.borderRadius * 1
    borderRadius: 2,                 // * 2 = 8px
    borderRadius: "50%",             // 直接 CSS 值
  }}
/>
```

### 响应式值

```tsx
// 对象语法（推荐）
<Box
  sx={{
    width: { xs: "100%", sm: 400, md: 600, lg: 800 },
    fontSize: { xs: 14, md: 18 },
    p: { xs: 1, md: 3 },
  }}
/>

// 数组语法 [xs, sm, md, lg, xl]
<Box sx={{ width: [200, 300, 400, 500, 600] }} />
```

### 主题回调

```tsx
<Box
  sx={(theme) => ({
    color: theme.palette.primary.main,
    border: `1px solid ${theme.palette.divider}`,
    "@media (min-width: 600px)": {
      fontSize: theme.typography.h4.fontSize,
    },
  })}
/>
```

### 数组 sx 合并

`sx` 接受**数组**，依次合并 —— 用于组件库内部接受外部 `sx` prop 时的样式叠加：

```tsx
interface MyBoxProps {
  sx?: SxProps<Theme>;
}

function MyBox({ sx }: MyBoxProps) {
  return (
    <Box
      sx={[
        { p: 2, bgcolor: "background.paper" }, // 内置默认
        ...(Array.isArray(sx) ? sx : [sx]),     // 外部叠加
      ]}
    />
  );
}
```

### 伪选择器 + 嵌套选择器

```tsx
<Button
  sx={{
    "&:hover": { bgcolor: "primary.dark" },
    "&:focus": { outline: "2px solid red" },
    "&:active": { transform: "scale(0.95)" },
    "&.Mui-disabled": { opacity: 0.3 },
    "& .MuiButton-startIcon": { mr: 2 },       // 子元素
    "& > svg": { fontSize: 20 },                // 直接子元素
  }}
/>
```

### 条件样式

```tsx
<Box
  sx={{
    bgcolor: isActive ? "primary.main" : "grey.300",
    color: isActive ? "white" : "text.primary",
  }}
/>
```

### 媒体查询

```tsx
<Box
  sx={{
    "@media (min-width: 1200px)": {
      fontSize: 24,
    },
    "@media (prefers-color-scheme: dark)": {
      bgcolor: "common.black",
    },
  }}
/>
```

### TypeScript 类型 `SxProps<Theme>`

```tsx
import type { SxProps, Theme } from "@mui/material";

const sharedSx: SxProps<Theme> = {
  p: 2,
  bgcolor: "background.paper",
};

<Box sx={sharedSx} />;
```

## `styled()` API 深度

`styled()` 是 MUI 提供的样式化函数（基于 Emotion 的 `styled.div`）—— 用于**创建可复用的样式化组件**。

### 基本用法

```tsx
import { styled } from "@mui/material/styles";

const StyledBox = styled("div")({
  padding: 16,
  backgroundColor: "#f5f5f5",
  borderRadius: 4,
});

<StyledBox>Hello</StyledBox>;
```

### 访问主题

```tsx
const StyledBox = styled("div")(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[1],
  transition: theme.transitions.create("box-shadow"),
  "&:hover": {
    boxShadow: theme.shadows[4],
  },
}));
```

### 基于已有 MUI 组件

```tsx
import Button from "@mui/material/Button";

const RoundedButton = styled(Button)(({ theme }) => ({
  borderRadius: 999,
  textTransform: "none",
  padding: theme.spacing(1, 3),
}));

<RoundedButton variant="contained">圆角按钮</RoundedButton>;
```

### 自定义 props（泛型）

```tsx
interface CustomBoxProps {
  active?: boolean;
  size?: "small" | "large";
}

const CustomBox = styled("div")<CustomBoxProps>(({ theme, active, size }) => ({
  padding: size === "large" ? theme.spacing(4) : theme.spacing(2),
  backgroundColor: active ? theme.palette.primary.main : theme.palette.background.paper,
  color: active ? theme.palette.primary.contrastText : theme.palette.text.primary,
}));

<CustomBox active size="large">Active Large</CustomBox>;
```

### `shouldForwardProp` 阻止自定义 props 传给 DOM

```tsx
const CustomBox = styled("div", {
  shouldForwardProp: (prop) => prop !== "active" && prop !== "size",
})<CustomBoxProps>(({ active, size }) => ({
  /* ... */
}));
```

> 若不阻止、`active` 会作为 HTML 属性传给 DOM，React 报错 `Unknown DOM property`。

### `theme.applyStyles` 暗色模式

```tsx
const StyledBox = styled("div")(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  ...theme.applyStyles("dark", {
    boxShadow: "0 0 10px rgba(255,255,255,0.1)",
  }),
}));
```

### `name` + `slot` 让 styled 组件可被主题 components 配置覆盖

```tsx
const StyledBox = styled("div", {
  name: "MyApp", // 组件名
  slot: "Root",  // 槽位名
})(({ theme }) => ({
  padding: theme.spacing(2),
}));

// 之后可以在 createTheme 中覆盖：
const theme = createTheme({
  components: {
    MyApp: {
      defaultProps: { /* ... */ },
      styleOverrides: {
        root: {
          padding: 32,
        },
      },
    },
  },
});
```

### CSS Variables 友好的 `theme.vars`

启用 `cssVariables: true` 后，推荐用 `theme.vars.*` 代替 `theme.palette.*`：

```tsx
const StyledBox = styled("div")(({ theme }) => ({
  // ✅ 输出 var(--mui-palette-primary-main)
  color: theme.vars.palette.primary.main,
  // ✅ 输出 var(--mui-shape-borderRadius)
  borderRadius: theme.vars.shape.borderRadius,
}));
```

## `createTheme` 完整选项

`createTheme(options)` 返回完整 Theme 对象。下面逐项说明 7 大配置。

### `palette` 调色板

```ts
const theme = createTheme({
  palette: {
    // 主色调
    primary: {
      main: "#1976d2",
      light: "#42a5f5",
      dark: "#1565c0",
      contrastText: "#fff",
    },
    // 次色调
    secondary: {
      main: "#9c27b0",
      light: "#ba68c8",
      dark: "#7b1fa2",
      contrastText: "#fff",
    },
    // 状态色（自动派生 light / dark / contrastText）
    error: { main: "#d32f2f" },
    warning: { main: "#ed6c02" },
    info: { main: "#0288d1" },
    success: { main: "#2e7d32" },

    // 文本
    text: {
      primary: "rgba(0, 0, 0, 0.87)",
      secondary: "rgba(0, 0, 0, 0.6)",
      disabled: "rgba(0, 0, 0, 0.38)",
    },

    // 背景
    background: {
      default: "#fafafa",
      paper: "#fff",
    },

    // 分隔线
    divider: "rgba(0, 0, 0, 0.12)",

    // 灰阶（默认从 Material Design 颜色派生）
    grey: {
      50: "#fafafa",
      100: "#f5f5f5",
      // ...
      900: "#212121",
    },

    // 动作色
    action: {
      active: "rgba(0, 0, 0, 0.54)",
      hover: "rgba(0, 0, 0, 0.04)",
      selected: "rgba(0, 0, 0, 0.08)",
      disabled: "rgba(0, 0, 0, 0.26)",
      disabledBackground: "rgba(0, 0, 0, 0.12)",
    },
  },
});
```

### `typography` 排版

```ts
const theme = createTheme({
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: 14, // 基准字号（默认 14）
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,

    // 13 个变体
    h1: { fontSize: "6rem", fontWeight: 300, lineHeight: 1.167 },
    h2: { fontSize: "3.75rem", fontWeight: 300 },
    h3: { fontSize: "3rem", fontWeight: 400 },
    h4: { fontSize: "2.125rem", fontWeight: 400 },
    h5: { fontSize: "1.5rem", fontWeight: 400 },
    h6: { fontSize: "1.25rem", fontWeight: 500 },
    subtitle1: { fontSize: "1rem", fontWeight: 400 },
    subtitle2: { fontSize: "0.875rem", fontWeight: 500 },
    body1: { fontSize: "1rem", fontWeight: 400 },
    body2: { fontSize: "0.875rem", fontWeight: 400 },
    button: { fontSize: "0.875rem", fontWeight: 500, textTransform: "uppercase" },
    caption: { fontSize: "0.75rem", fontWeight: 400 },
    overline: { fontSize: "0.75rem", fontWeight: 400, textTransform: "uppercase" },
  },
});
```

### `spacing` 间距单位

默认 `spacing(n) = n * 8px`。可以自定义：

```ts
// 数字（基准 8px）
spacing: 4,        // spacing(n) = n * 4

// 函数（完全自定义）
spacing: (factor) => `${0.5 * factor}rem`,

// 数组（discrete 取值）
spacing: [0, 4, 8, 16, 32, 64],
```

```ts
const theme = createTheme({ spacing: 8 });
// 现在 sx={{ p: 2 }} = 16px
// sx={{ p: 3 }} = 24px
```

### `breakpoints` 断点

```ts
const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
});
```

可以新增自定义断点（需配合 Module Augmentation）：

```ts
// types/mui.d.ts
declare module "@mui/material/styles" {
  interface BreakpointOverrides {
    mobile: true;
    tablet: true;
    laptop: true;
    desktop: true;
    // 默认 xs/sm/md/lg/xl 仍生效
  }
}

// theme.ts
const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
      mobile: 480,
      tablet: 768,
      laptop: 1024,
      desktop: 1440,
    },
  },
});
```

### `zIndex` 层级

```ts
const theme = createTheme({
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
});
```

### `shadows` 阴影 25 级

```ts
const theme = createTheme({
  shadows: [
    "none",
    "0 1px 2px rgba(0,0,0,0.1)",
    "0 2px 4px rgba(0,0,0,0.1)",
    // ... 共 25 级
  ] as any,
});
```

### `transitions` 过渡

```ts
const theme = createTheme({
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
});
```

### `components` 全局组件默认值 + 样式覆盖

```ts
const theme = createTheme({
  components: {
    // 全局 Button 配置
    MuiButton: {
      defaultProps: {
        variant: "contained", // 全局默认变体
        size: "medium",
        disableRipple: false,
      },
      styleOverrides: {
        // root slot
        root: {
          textTransform: "none", // 取消大写
          borderRadius: 8,
        },
        // 针对 size="large" 的样式
        sizeLarge: {
          fontSize: "1rem",
        },
      },
      variants: [
        // 新增 variant="dashed"
        {
          props: { variant: "dashed" },
          style: {
            border: "2px dashed",
            borderColor: "currentColor",
            background: "transparent",
          },
        },
      ],
    },

    // TextField 全局默认变体为 outlined
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
        size: "small",
      },
    },

    // 全局禁用 ripple
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true,
      },
    },
  },
});
```

> 自定义 variants 需配合 Module Augmentation 声明类型，见下文「TypeScript Module Augmentation」。

### `shape` 形状

```ts
const theme = createTheme({
  shape: {
    borderRadius: 8, // 默认 4，全局基准
  },
});
```

之后 <span v-pre>`sx={{ borderRadius: 1 }}`</span> 即 `8px`、<span v-pre>`sx={{ borderRadius: 2 }}`</span> 即 `16px`。

### `cssVariables` 启用 CSS Variables 模式

```ts
const theme = createTheme({
  cssVariables: true,
});
```

启用后所有 token 输出为 CSS 变量（`--mui-palette-primary-main` 等）—— SSR 一致性显著提升，支持 native CSS `color-mix()`。

```ts
// 完整选项
cssVariables: {
  cssVarPrefix: "myapp",  // 默认 "mui"
  rootSelector: ":root",
  colorSchemeSelector: "class", // 'class' / 'data' / CSS selector
  shouldSkipGeneratingVar: (keys) => keys[0] === "typography",
}
```

## `colorSchemes` 暗色模式深度

### 基础：一行启用

```ts
const theme = createTheme({
  colorSchemes: {
    dark: true, // 使用默认暗色 palette
  },
});
```

### 自定义 light / dark palette

```ts
const theme = createTheme({
  colorSchemes: {
    light: {
      palette: {
        primary: { main: "#1976d2" },
        background: { default: "#ffffff", paper: "#f5f5f5" },
      },
    },
    dark: {
      palette: {
        primary: { main: "#90caf9" },
        background: { default: "#0a1929", paper: "#1a2027" },
      },
    },
  },
});
```

### `defaultColorScheme`

```ts
const theme = createTheme({
  defaultColorScheme: "dark", // 默认暗色（覆盖默认的 light）
  colorSchemes: {
    light: true,
    dark: true,
  },
});
```

### `useColorScheme()` Hook

```tsx
import { useColorScheme } from "@mui/material/styles";

function ModeToggle() {
  const { mode, setMode, systemMode } = useColorScheme();

  if (!mode) return null; // SSR 阶段返回 null 防闪烁

  return (
    <Box>
      <Button onClick={() => setMode("light")}>浅色</Button>
      <Button onClick={() => setMode("dark")}>暗色</Button>
      <Button onClick={() => setMode("system")}>跟随系统（{systemMode}）</Button>
    </Box>
  );
}
```

`mode` 取值：`"light"` / `"dark"` / `"system"`。

### `InitColorSchemeScript` 反闪烁

Next.js / SSR 场景必须用此组件——它在 React hydrate 前内联一段同步脚本，立即读取 localStorage 并应用对应主题。

```tsx
// app/layout.tsx
import { InitColorSchemeScript } from "@mui/material/InitColorSchemeScript";

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>
        <InitColorSchemeScript
          attribute="class" // 'class' / 'data' / CSS selector
          defaultMode="system"
          modeStorageKey="my-app-mode"
        />
        {children}
      </body>
    </html>
  );
}
```

### 自定义 storage manager

```tsx
import { ThemeProvider } from "@mui/material/styles";

const customStorage = {
  get(key: string) {
    return sessionStorage.getItem(key);
  },
  set(key: string, value: string) {
    sessionStorage.setItem(key, value);
  },
  subscribe(key: string, handler: (value: string | null) => void) {
    /* ... */
    return () => {};
  },
};

<ThemeProvider theme={theme} storageManager={customStorage}>
  {children}
</ThemeProvider>;
```

### 禁用持久化

```tsx
<ThemeProvider theme={theme} storageManager={null}>
  {children}
</ThemeProvider>
```

## Layout 四件套深度

### `Box` 通用容器

`Box` 是 MUI 项目中**最常用的容器**——本质上是 `<div>` + `sx` prop：

```tsx
<Box
  sx={{
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    p: 3,
    bgcolor: "background.paper",
  }}
>
  <Typography variant="h4">标题</Typography>
  <Button variant="contained">提交</Button>
</Box>
```

通过 `component` prop 渲染为其他标签：

```tsx
<Box component="form" onSubmit={handleSubmit} sx={{ /* ... */ }}>
  <TextField name="email" />
  <Button type="submit">提交</Button>
</Box>

<Box component="section" aria-labelledby="section-title">
  ...
</Box>

<Box component="header" sx={{ /* ... */ }}>
  ...
</Box>
```

### `Container` 限宽容器

```tsx
<Container maxWidth="md" disableGutters>
  ...
</Container>
```

| `maxWidth` | 最大宽度 |
| --- | --- |
| `false` | 无限制 |
| `xs` | 444px |
| `sm` | 600px |
| `md` | 900px（**默认**） |
| `lg` | 1200px |
| `xl` | 1536px |

`disableGutters` —— 取消左右 24px padding（默认有）。

`fixed` —— 用断点对应的固定宽度（与 maxWidth 互斥）。

### `Grid` v2 12 列响应式网格

**v7+ 默认 `Grid` 即 v2、v1 重命名为 `GridLegacy`**。新项目无脑用 v2：

```tsx
import Grid from "@mui/material/Grid";

<Grid container spacing={2}>
  <Grid size={6}>左半</Grid>
  <Grid size={6}>右半</Grid>
</Grid>

<Grid container spacing={2}>
  <Grid size={{ xs: 12, md: 6 }}>移动占满、桌面占半</Grid>
  <Grid size={{ xs: 12, md: 6 }}>移动占满、桌面占半</Grid>
</Grid>

<Grid container spacing={{ xs: 1, md: 3 }}>
  <Grid size={{ xs: 6, md: 4 }}>1/3</Grid>
  <Grid size={{ xs: 6, md: 4 }}>1/3</Grid>
  <Grid size={{ xs: 12, md: 4 }}>1/3</Grid>
</Grid>
```

#### size 的特殊值

```tsx
<Grid size="grow">     {/* 占据剩余空间 */}
<Grid size="auto">     {/* 内容宽度 */}
<Grid size={6}>        {/* 6/12 = 50% */}
<Grid size={{ xs: 12, md: 6 }}>  {/* 响应式 */}
```

#### offset 偏移

```tsx
<Grid container spacing={2}>
  <Grid size={4}>左 1/3</Grid>
  <Grid size={4} offset={4}>右 1/3，从中间开始</Grid>
</Grid>

<Grid container>
  <Grid size={4} offset={{ md: "auto" }}>响应式 auto offset</Grid>
</Grid>
```

#### 嵌套 Grid

```tsx
<Grid container spacing={2}>
  <Grid size={8}>
    {/* 嵌套，spacing 自动从父级继承 */}
    <Grid container spacing={1}>
      <Grid size={6}>A</Grid>
      <Grid size={6}>B</Grid>
    </Grid>
  </Grid>
  <Grid size={4}>侧边</Grid>
</Grid>
```

#### 自定义列数

```tsx
<Grid container columns={16}>
  <Grid size={5}>5/16</Grid>
  <Grid size={11}>11/16</Grid>
</Grid>
```

### `Stack` 一维 Flex

```tsx
<Stack direction="row" spacing={2}>
  <Button>1</Button>
  <Button>2</Button>
  <Button>3</Button>
</Stack>

<Stack direction="column" spacing={1} sx={{ width: 300 }}>
  <TextField label="姓名" />
  <TextField label="邮箱" />
  <Button variant="contained">提交</Button>
</Stack>

<Stack
  direction={{ xs: "column", sm: "row" }}
  spacing={{ xs: 1, sm: 2, md: 4 }}
  divider={<Divider orientation="vertical" flexItem />}
>
  ...
</Stack>
```

## Form 表单方案

MUI 不内置表单状态管理——**生产项目几乎都配合 React Hook Form**。下面是完整集成示例。

### 安装

```bash
pnpm add react-hook-form
pnpm add @hookform/resolvers zod # 可选：Zod schema 验证
```

### 基础：受控 TextField + RHF

```tsx
import { useForm, Controller } from "react-hook-form";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginForm() {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginForm) => {
    console.log(data);
    await new Promise((r) => setTimeout(r, 1000));
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={2}>
        <Controller
          name="email"
          control={control}
          rules={{
            required: "邮箱必填",
            pattern: { value: /^[\w-]+@[\w-]+\.[a-z]{2,}$/, message: "邮箱格式错误" },
          }}
          render={({ field }) => (
            <TextField
              {...field}
              label="邮箱"
              type="email"
              error={!!errors.email}
              helperText={errors.email?.message}
              fullWidth
            />
          )}
        />

        <Controller
          name="password"
          control={control}
          rules={{
            required: "密码必填",
            minLength: { value: 8, message: "至少 8 位" },
          }}
          render={({ field }) => (
            <TextField
              {...field}
              label="密码"
              type="password"
              error={!!errors.password}
              helperText={errors.password?.message}
              fullWidth
            />
          )}
        />

        <Button type="submit" variant="contained" loading={isSubmitting}>
          登录
        </Button>
      </Stack>
    </Box>
  );
}
```

### Zod schema 验证（推荐）

```tsx
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const loginSchema = z.object({
  email: z.string().email("邮箱格式错误"),
  password: z.string().min(8, "至少 8 位"),
});

type LoginForm = z.infer<typeof loginSchema>;

const { control, handleSubmit } = useForm<LoginForm>({
  resolver: zodResolver(loginSchema),
  defaultValues: { email: "", password: "" },
});
```

### Select + RHF

```tsx
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import FormHelperText from "@mui/material/FormHelperText";

<Controller
  name="role"
  control={control}
  rules={{ required: "请选择角色" }}
  render={({ field }) => (
    <FormControl fullWidth error={!!errors.role}>
      <InputLabel>角色</InputLabel>
      <Select {...field} label="角色">
        <MenuItem value="admin">管理员</MenuItem>
        <MenuItem value="editor">编辑</MenuItem>
        <MenuItem value="viewer">浏览者</MenuItem>
      </Select>
      <FormHelperText>{errors.role?.message}</FormHelperText>
    </FormControl>
  )}
/>;
```

### Checkbox + RHF

```tsx
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";

<Controller
  name="agreed"
  control={control}
  rules={{ required: "必须同意条款" }}
  render={({ field }) => (
    <FormControlLabel
      control={<Checkbox {...field} checked={field.value} />}
      label="同意服务条款"
    />
  )}
/>;
```

### Autocomplete + RHF

```tsx
import Autocomplete from "@mui/material/Autocomplete";

interface Option {
  id: number;
  label: string;
}

const options: Option[] = [
  { id: 1, label: "选项一" },
  { id: 2, label: "选项二" },
];

<Controller
  name="option"
  control={control}
  render={({ field: { onChange, value, ...rest } }) => (
    <Autocomplete
      {...rest}
      options={options}
      getOptionLabel={(opt) => opt.label}
      value={options.find((o) => o.id === value) ?? null}
      onChange={(_, selected) => onChange(selected?.id ?? null)}
      renderInput={(params) => <TextField {...params} label="选项" />}
    />
  )}
/>;
```

### DatePicker + RHF

```tsx
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";

<Controller
  name="birthday"
  control={control}
  render={({ field }) => (
    <DatePicker
      {...field}
      label="生日"
      slotProps={{
        textField: {
          fullWidth: true,
          error: !!errors.birthday,
          helperText: errors.birthday?.message,
        },
      }}
    />
  )}
/>;
```

## MUI X Data Grid 完整方案

`@mui/x-data-grid` 是 React 生态最强大的数据表格——社区版 MIT 免费、Pro 商业授权、Premium 企业级。

### 安装

```bash
pnpm add @mui/x-data-grid
```

### 基础用法

```tsx
import { DataGrid, type GridColDef } from "@mui/x-data-grid";

const columns: GridColDef[] = [
  { field: "id", headerName: "ID", width: 70 },
  { field: "firstName", headerName: "名", width: 130 },
  { field: "lastName", headerName: "姓", width: 130 },
  {
    field: "age",
    headerName: "年龄",
    type: "number",
    width: 90,
  },
  {
    field: "fullName",
    headerName: "全名",
    description: "由名 + 姓拼接，不可排序",
    sortable: false,
    width: 160,
    valueGetter: (value, row) => `${row.firstName ?? ""} ${row.lastName ?? ""}`,
  },
];

const rows = [
  { id: 1, lastName: "张", firstName: "三", age: 35 },
  { id: 2, lastName: "李", firstName: "四", age: 42 },
  { id: 3, lastName: "王", firstName: "五", age: 28 },
];

export default function DataGridDemo() {
  return (
    <Box sx={{ height: 400, width: "100%" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 5 },
          },
        }}
        pageSizeOptions={[5, 10, 20]}
        checkboxSelection
        disableRowSelectionOnClick
      />
    </Box>
  );
}
```

### 排序 / 筛选 / 分页

```tsx
<DataGrid
  rows={rows}
  columns={columns}
  initialState={{
    sorting: {
      sortModel: [{ field: "age", sort: "desc" }],
    },
    filter: {
      filterModel: {
        items: [{ field: "age", operator: ">", value: "30" }],
      },
    },
    pagination: {
      paginationModel: { pageSize: 10 },
    },
  }}
  pageSizeOptions={[5, 10, 20, 50, 100]}
/>
```

### 编辑单元格

```tsx
const columns: GridColDef[] = [
  {
    field: "name",
    headerName: "姓名",
    editable: true, // 双击进入编辑
  },
  {
    field: "status",
    headerName: "状态",
    editable: true,
    type: "singleSelect",
    valueOptions: ["pending", "active", "inactive"],
  },
];

<DataGrid
  rows={rows}
  columns={columns}
  processRowUpdate={(newRow, oldRow) => {
    console.log("行更新", newRow, oldRow);
    return newRow;
  }}
  onProcessRowUpdateError={(error) => console.error(error)}
/>;
```

### 自定义渲染

```tsx
const columns: GridColDef[] = [
  {
    field: "avatar",
    headerName: "头像",
    width: 60,
    renderCell: (params) => (
      <Avatar src={params.value} alt={params.row.name} />
    ),
  },
  {
    field: "status",
    headerName: "状态",
    renderCell: (params) => (
      <Chip
        label={params.value}
        color={params.value === "active" ? "success" : "default"}
        size="small"
      />
    ),
  },
];
```

### 服务端模式

```tsx
import { useState } from "react";

const [rows, setRows] = useState([]);
const [loading, setLoading] = useState(false);
const [rowCount, setRowCount] = useState(0);

<DataGrid
  rows={rows}
  columns={columns}
  loading={loading}
  rowCount={rowCount}
  paginationMode="server"
  sortingMode="server"
  filterMode="server"
  pageSizeOptions={[10, 25, 50]}
  onPaginationModelChange={async (model) => {
    setLoading(true);
    const { rows, total } = await api.fetchUsers(model);
    setRows(rows);
    setRowCount(total);
    setLoading(false);
  }}
/>;
```

### Pro / Premium 特性

| 特性 | 社区 (MIT) | Pro | Premium |
| --- | --- | --- | --- |
| 列 / 行 / 排序 / 筛选 / 选择 / 编辑 / 分页 | ✅ | ✅ | ✅ |
| 列固定 | ❌ | ✅ | ✅ |
| 列 / 行重排序 | ❌ | ✅ | ✅ |
| 树形数据 | ❌ | ✅ | ✅ |
| 行分组 + 聚合 | ❌ | ❌ | ✅ |
| Excel 导出 | ❌ | ❌ | ✅ |

## MUI X Date Pickers

### 安装

```bash
pnpm add @mui/x-date-pickers dayjs
```

### LocalizationProvider 包根

```tsx
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/zh-cn";

<LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="zh-cn">
  <App />
</LocalizationProvider>;
```

### DatePicker

```tsx
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { type Dayjs } from "dayjs";
import { useState } from "react";

function MyPicker() {
  const [value, setValue] = useState<Dayjs | null>(dayjs("2026-05-20"));
  return (
    <DatePicker
      label="选择日期"
      value={value}
      onChange={(newValue) => setValue(newValue)}
      format="YYYY-MM-DD"
    />
  );
}
```

### DateTimePicker

```tsx
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";

<DateTimePicker label="选择日期时间" />;
```

### TimePicker

```tsx
import { TimePicker } from "@mui/x-date-pickers/TimePicker";

<TimePicker label="选择时间" ampm={false} />;
```

### 静态版本（嵌入页面、不显示输入框）

```tsx
import { StaticDatePicker } from "@mui/x-date-pickers/StaticDatePicker";

<StaticDatePicker
  defaultValue={dayjs("2026-05-20")}
  slotProps={{ actionBar: { actions: ["clear", "today"] } }}
/>;
```

### slotProps 自定义子组件

```tsx
<DatePicker
  label="生日"
  slotProps={{
    textField: {
      fullWidth: true,
      size: "small",
      helperText: "格式 YYYY-MM-DD",
    },
    popper: {
      placement: "bottom-end",
    },
    actionBar: {
      actions: ["clear", "today", "accept"],
    },
  }}
/>
```

## MUI X Charts

```bash
pnpm add @mui/x-charts
```

### 折线图

```tsx
import { LineChart } from "@mui/x-charts/LineChart";

<LineChart
  xAxis={[{ data: [1, 2, 3, 4, 5, 6, 7], label: "X 轴" }]}
  series={[
    { data: [2, 5.5, 2, 8.5, 1.5, 5, 7], label: "系列 1" },
    { data: [3, 7, 4, 6, 3, 8, 5], label: "系列 2" },
  ]}
  width={500}
  height={300}
/>;
```

### 柱状图

```tsx
import { BarChart } from "@mui/x-charts/BarChart";

<BarChart
  series={[
    { data: [3, 4, 1, 6, 5] },
    { data: [4, 3, 1, 5, 8] },
  ]}
  xAxis={[{ data: ["A", "B", "C", "D", "E"], scaleType: "band" }]}
  width={500}
  height={300}
/>;
```

### 饼图

```tsx
import { PieChart } from "@mui/x-charts/PieChart";

<PieChart
  series={[
    {
      data: [
        { id: 0, value: 10, label: "A" },
        { id: 1, value: 15, label: "B" },
        { id: 2, value: 20, label: "C" },
      ],
    },
  ]}
  width={400}
  height={300}
/>;
```

## Next.js App Router 完整集成

### 项目结构

```
src/
├── app/
│   ├── layout.tsx
│   └── page.tsx
├── theme.ts
└── types/
    └── mui.d.ts
```

### `src/theme.ts`

```ts
"use client";

import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: "class",
  },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: "#1976d2" },
      },
    },
    dark: {
      palette: {
        primary: { main: "#90caf9" },
      },
    },
  },
  typography: {
    fontFamily: "var(--font-roboto), sans-serif",
  },
});

export default theme;
```

### `src/app/layout.tsx`

```tsx
import * as React from "react";
import { Roboto } from "next/font/google";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import { InitColorSchemeScript } from "@mui/material/InitColorSchemeScript";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "../theme";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={roboto.variable} suppressHydrationWarning>
      <body>
        <InitColorSchemeScript attribute="class" defaultMode="system" />
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <ThemeProvider theme={theme} defaultMode="system">
            <CssBaseline />
            {children}
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
```

> `enableCssLayer: true` —— v7+ 启用 CSS Layers，**彻底解决与 Tailwind 优先级冲突**。

### 客户端组件强制 `"use client"`

任何使用 MUI 组件 + Hooks 的页面 / 组件**必须**标记 `"use client"`：

```tsx
// src/app/page.tsx
"use client";

import Button from "@mui/material/Button";
import { useColorScheme } from "@mui/material/styles";

export default function HomePage() {
  const { mode, setMode } = useColorScheme();
  return (
    <Button onClick={() => setMode(mode === "light" ? "dark" : "light")}>
      切换主题
    </Button>
  );
}
```

> 性能优化：把交互组件抽到独立 client component、保留页面级 `page.tsx` 为 server component。

### 与 RSC（Server Components）共存

```tsx
// src/app/page.tsx - 纯 RSC，无 'use client'
import * as React from "react";
import HeaderClient from "./HeaderClient";

export default async function HomePage() {
  // ✅ 可以 await fetch
  const data = await fetch("https://api.example.com/posts").then((r) => r.json());

  return (
    <div>
      <HeaderClient />
      {/* MUI 组件不能直接在这里用（无 use client） */}
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
```

```tsx
// src/app/HeaderClient.tsx
"use client";

import Button from "@mui/material/Button";

export default function HeaderClient() {
  return <Button variant="contained">点我</Button>;
}
```

## Vite 完整集成

### 安装

```bash
pnpm create vite my-mui-app --template react-ts
cd my-mui-app
pnpm add @mui/material @emotion/react @emotion/styled @mui/icons-material @fontsource/roboto
```

### `vite.config.ts`

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // 显式预构建 MUI 主包，加速冷启动
    include: ["@mui/material", "@mui/icons-material"],
  },
});
```

### `src/theme.ts`

```ts
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  cssVariables: true,
  colorSchemes: {
    light: true,
    dark: true,
  },
  palette: {
    primary: { main: "#1976d2" },
  },
  components: {
    MuiButton: {
      defaultProps: {
        variant: "contained",
      },
      styleOverrides: {
        root: {
          textTransform: "none",
        },
      },
    },
  },
});

export default theme;
```

### `src/main.tsx`

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { BrowserRouter } from "react-router-dom";

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

import App from "./App";
import theme from "./theme";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme} defaultMode="system">
      <CssBaseline />
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
```

## 样式互操作

### 与 Tailwind CSS

**最关键问题：Tailwind class 与 MUI Emotion 注入的 CSS 优先级**。MUI v7+ 内置 CSS Layers 解决：

```ts
// vite.config.ts（无需特殊配置，MUI v7+ 默认 CSS Layers）
```

```ts
// theme.ts
const theme = createTheme({
  cssVariables: true,
});
```

但 Next.js 必须显式启用：

```tsx
<AppRouterCacheProvider options={{ enableCssLayer: true }}>
  ...
</AppRouterCacheProvider>
```

之后 Tailwind class 在 layer 内、MUI 在另一个 layer，**Tailwind 永远优先**：

```tsx
<Button variant="contained" className="bg-red-500 text-white">
  红色按钮（Tailwind override）
</Button>
```

> 重要：Tailwind preflight 仍然可能与 CssBaseline 冲突——建议**保留两者并测试**，必要时禁用 Tailwind preflight：`corePlugins: { preflight: false }`。

### 与 CSS Modules

```tsx
// MyButton.module.css
.root {
  border-radius: 999px;
  text-transform: none;
}
```

```tsx
import styles from "./MyButton.module.css";

<Button variant="contained" className={styles.root}>
  自定义按钮
</Button>;
```

> CSS Modules 默认有 scope hash，不与 MUI 冲突；但优先级仍取决于 CSS injection order。

### 与 styled-components

```bash
pnpm add @mui/styled-engine-sc styled-components
```

```ts
// vite.config.ts 配置 alias
import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: {
      "@mui/styled-engine": "@mui/styled-engine-sc",
    },
  },
});
```

> **不推荐**：styled-components 在 SSR 场景与 MUI 兼容性较差、且失去 Emotion 的诸多优化。**99% 项目用默认 Emotion 即可**。

## Pigment CSS（Zero Runtime）评估

### 是什么

**Pigment CSS** 是 MUI 团队推出的**编译时零运行时**样式引擎——把 CSS-in-JS 在构建时编译为静态 CSS，**消除运行时 Emotion 开销**。

### 安装

```bash
pnpm add @pigment-css/react
pnpm add -D @pigment-css/vite-plugin # Vite
pnpm add -D @pigment-css/nextjs-plugin # Next.js
```

### Vite 配置

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { pigment } from "@pigment-css/vite-plugin";
import { extendTheme } from "@pigment-css/react";

export default defineConfig({
  plugins: [
    pigment({
      theme: extendTheme({
        colorSchemes: {
          light: { palette: { primary: { main: "#1976d2" } } },
        },
      }),
    }),
    react(),
  ],
});
```

### 优势

1. **零运行时**——编译时生成静态 CSS、没有 Emotion 的运行时计算 + 注入
2. **首屏更快**——CSS 在 HTML head 一次性 inject、零 hydration 计算
3. **更小 JS bundle**——剥离 Emotion 运行时（~25KB gzip）
4. **完美 RSC 兼容**——零运行时意味着可在 Server Components 内直接使用

### 限制（**生产可用度警告**）

1. **不支持动态主题切换**——`createTheme` 在构建时执行，运行时改 token 失效
2. **复杂 styled 回调有限**——`({ theme, prop }) => ({ ... })` 中只能用静态值，不能基于运行时 prop 动态计算 CSS
3. **生态尚在演进**——很多 MUI 高级 API（dynamic variants、Theme Augmentation）尚未完全支持
4. **MUI v9 还未默认启用**——预计 v10 / v11 才会成为推荐方案

### 建议

**生产项目暂时不要迁移 Pigment CSS**。继续用 Emotion + `cssVariables: true`：

- SSR 一致性已经显著提升
- bundle 体积可接受
- 等 MUI 团队官宣 Pigment CSS production ready 再迁移

## Base UI 与 Joy UI 状态

### Base UI（已独立）

- **原名**：`@mui/base`
- **现状**：v6 后实质迁出 MUI 主仓库、独立站 [base-ui.com](https://base-ui.com)、与 Radix UI / Floating UI 团队联合维护
- **定位**：**unstyled headless 组件库**——自带样式 Tailwind / CSS Modules / 你自己的 CSS
- **包名**：`@base-ui/react`（已不再 `@mui/base`）

```bash
pnpm add @base-ui/react
```

```tsx
import { Slider } from "@base-ui/react/slider";

<Slider.Root defaultValue={50}>
  <Slider.Control>
    <Slider.Track>
      <Slider.Indicator />
      <Slider.Thumb />
    </Slider.Track>
  </Slider.Control>
</Slider.Root>;
```

> Base UI 是 Radix UI 的有力竞争者——比 Radix 更注重 a11y + 类型完整度。**新项目想要完全自定义样式的、考虑 Base UI**。

### Joy UI（开发暂停 ⚠️）

- **现状**：2025 年明确**开发暂停**（on hold）
- **MUI 团队官方建议**：「**新项目选 Material UI 而非 Joy UI**」
- **结论**：**不要在新项目使用 Joy UI**。如有现存 Joy UI 项目、考虑迁移到 Material UI 或 Base UI

## TypeScript Module Augmentation

MUI 的 TypeScript 集成强大——通过 Module Augmentation 可以扩展 palette、typography、breakpoints、组件 variants。

### 自定义 palette 颜色

```ts
// src/types/mui.d.ts
import "@mui/material/styles";
import "@mui/material/Button";

declare module "@mui/material/styles" {
  interface Palette {
    brand: Palette["primary"];
    accent: Palette["primary"];
  }
  interface PaletteOptions {
    brand?: PaletteOptions["primary"];
    accent?: PaletteOptions["primary"];
  }
}

// Button 接受 brand / accent 作为 color prop
declare module "@mui/material/Button" {
  interface ButtonPropsColorOverrides {
    brand: true;
    accent: true;
  }
}
```

```ts
const theme = createTheme({
  palette: {
    brand: { main: "#ff6b00", light: "#ff8a3a", dark: "#cc5500", contrastText: "#fff" },
    accent: { main: "#00d4ff", light: "#5ddbff", dark: "#0099cc", contrastText: "#000" },
  },
});
```

```tsx
<Button color="brand">品牌色按钮</Button>
<Button color="accent">强调色按钮</Button>
```

### 自定义 Typography variants

```ts
declare module "@mui/material/styles" {
  interface TypographyVariants {
    hero: React.CSSProperties;
    code: React.CSSProperties;
  }
  interface TypographyVariantsOptions {
    hero?: React.CSSProperties;
    code?: React.CSSProperties;
  }
}

declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    hero: true;
    code: true;
  }
}
```

```ts
const theme = createTheme({
  typography: {
    hero: { fontSize: "5rem", fontWeight: 900, lineHeight: 1.1, letterSpacing: -2 },
    code: { fontFamily: "'JetBrains Mono', monospace", fontSize: "0.875rem" },
  },
});
```

```tsx
<Typography variant="hero">Hero 文字</Typography>
<Typography variant="code">const x = 1;</Typography>
```

### 自定义 Button variants

```ts
declare module "@mui/material/Button" {
  interface ButtonPropsVariantOverrides {
    dashed: true;
    glass: true;
  }
}
```

```ts
const theme = createTheme({
  components: {
    MuiButton: {
      variants: [
        {
          props: { variant: "dashed" },
          style: {
            border: "2px dashed currentColor",
            background: "transparent",
          },
        },
        {
          props: { variant: "glass" },
          style: {
            background: "rgba(255,255,255,0.1)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.2)",
          },
        },
      ],
    },
  },
});
```

```tsx
<Button variant="dashed">虚线按钮</Button>
<Button variant="glass">玻璃按钮</Button>
```

### 自定义断点

```ts
declare module "@mui/material/styles" {
  interface BreakpointOverrides {
    mobile: true;
    tablet: true;
    laptop: true;
    desktop: true;
    // 默认 xs/sm/md/lg/xl 保留
  }
}
```

```ts
const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
      mobile: 480,
      tablet: 768,
      laptop: 1024,
      desktop: 1440,
    },
  },
});
```

```tsx
<Box
  sx={{
    fontSize: { mobile: 14, tablet: 16, laptop: 18, desktop: 20 },
  }}
/>
```

### 扩展 Theme 自定义字段

```ts
declare module "@mui/material/styles" {
  interface Theme {
    customTokens: {
      sidebarWidth: number;
      headerHeight: number;
    };
  }
  interface ThemeOptions {
    customTokens?: {
      sidebarWidth?: number;
      headerHeight?: number;
    };
  }
}
```

```ts
const theme = createTheme({
  customTokens: {
    sidebarWidth: 240,
    headerHeight: 64,
  },
});

// 之后任何地方可以访问
const theme = useTheme();
console.log(theme.customTokens.sidebarWidth); // 240
```

## useMediaQuery Hook

```tsx
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

function ResponsiveComponent() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));

  return (
    <Box>
      {isMobile && <p>移动端</p>}
      {isTablet && <p>平板</p>}
      {isDesktop && <p>桌面</p>}
    </Box>
  );
}
```

### 自定义媒体查询

```tsx
const matches = useMediaQuery("(min-width: 1024px) and (orientation: landscape)");

const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");

const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
```

### SSR 模式

```tsx
// 服务端默认值（false） + 客户端正确值
const matches = useMediaQuery("(min-width: 768px)", {
  defaultMatches: false,
  noSsr: false, // 默认 false（SSR 模式）
});
```

## Drawer 抽屉模式

```tsx
import Drawer from "@mui/material/Drawer";
import { useState } from "react";

function MyDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>打开抽屉</Button>
      <Drawer
        anchor="right" // 'top' / 'left' / 'right' / 'bottom'
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{ sx: { width: 320, p: 2 } }}
      >
        <Box>
          <Typography variant="h6">抽屉内容</Typography>
          <Button onClick={() => setOpen(false)}>关闭</Button>
        </Box>
      </Drawer>
    </>
  );
}
```

## Dialog 模态对话框

```tsx
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import { useState } from "react";

function ConfirmDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>打开对话框</Button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            此操作不可撤销，确定要删除吗？
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>取消</Button>
          <Button onClick={() => setOpen(false)} color="error" variant="contained">
            删除
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
```

## Snackbar Toast 通知

```tsx
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

function MySnackbar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>显示通知</Button>
      <Snackbar
        open={open}
        autoHideDuration={3000}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setOpen(false)}
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
        >
          保存成功！
        </Alert>
      </Snackbar>
    </>
  );
}
```

### 全局 Snackbar（notistack）

MUI 不内置全局 Snackbar API（不像 Element Plus 的 `ElMessage`）。推荐 [`notistack`](https://notistack.com/)：

```bash
pnpm add notistack
```

```tsx
// main.tsx
import { SnackbarProvider } from "notistack";

<SnackbarProvider maxSnack={3}>
  <App />
</SnackbarProvider>;
```

```tsx
// AnyComponent.tsx
import { useSnackbar } from "notistack";

function MyButton() {
  const { enqueueSnackbar } = useSnackbar();
  return (
    <Button onClick={() => enqueueSnackbar("保存成功", { variant: "success" })}>
      保存
    </Button>
  );
}
```

## 常见踩坑深度

### 1. SSR 下 `useColorScheme()` 返回 undefined

**原因**：服务端无法读取 localStorage、`mode` 在客户端 hydrate 前为 undefined。

**解决**：

```tsx
const { mode } = useColorScheme();
if (!mode) return null; // 或返回 skeleton
```

或用 `<NoSsr>` 包裹仅客户端渲染的部分：

```tsx
import NoSsr from "@mui/material/NoSsr";

<NoSsr>
  <ModeToggle />
</NoSsr>;
```

### 2. Grid v1 → v2 大规模迁移

写一个 codemod 一次性替换：

```bash
# 官方 codemod
pnpm dlx @mui/codemod@latest deprecations/grid-v2-props src/
```

### 3. Tailwind preflight 与 CssBaseline 冲突

两者都会重置默认样式但**部分规则不一致**——容易导致诡异样式。

**方案 A**：只用 CssBaseline，禁用 Tailwind preflight：

```ts
// tailwind.config.ts
export default {
  corePlugins: {
    preflight: false,
  },
};
```

**方案 B**：只用 Tailwind preflight，不渲染 CssBaseline。

> 推荐 **方案 A**——MUI 组件依赖 CssBaseline 的 box-sizing 等规则。

### 4. Next.js Hydration Mismatch

**症状**：`Hydration failed because the initial UI does not match`。

**根因**：

1. 没用 `AppRouterCacheProvider`
2. `<html>` 上没加 `suppressHydrationWarning`
3. 服务端和客户端 colorScheme 不一致

**解决**：

```tsx
<html lang="zh-CN" suppressHydrationWarning>
  <body>
    <InitColorSchemeScript ... />
    <AppRouterCacheProvider>
      <ThemeProvider>...</ThemeProvider>
    </AppRouterCacheProvider>
  </body>
</html>
```

### 5. `theme.palette.mode` 在 colorSchemes 模式下不可靠

**错误**：

```tsx
const StyledBox = styled("div")(({ theme }) => ({
  // ❌ colorSchemes 模式下 theme.palette.mode 可能不准
  background: theme.palette.mode === "dark" ? "#000" : "#fff",
}));
```

**正确**：

```tsx
const StyledBox = styled("div")(({ theme }) => ({
  background: theme.palette.background.default,
  // 或针对暗色追加样式
  ...theme.applyStyles("dark", {
    boxShadow: "0 0 10px rgba(255,255,255,0.1)",
  }),
}));
```

### 6. `@mui/icons-material` 全量 import 导致 bundle 飙升

**错误**：

```tsx
import { Add, Edit, Delete } from "@mui/icons-material";
```

Tree Shaking 失效、bundle +500KB。

**正确**：

```tsx
import Add from "@mui/icons-material/Add";
import Edit from "@mui/icons-material/Edit";
import Delete from "@mui/icons-material/Delete";
```

或使用 babel-plugin-import / babel-plugin-transform-imports 自动转换。

### 7. `<TextField select>` 与 RHF 兼容性

**症状**：用 `<TextField select>` + RHF Controller 时 `value` 不更新。

**原因**：`<TextField select>` 内部用 Select 但事件机制略不同。

**解决**：用独立 `<Select>` + `<MenuItem>`：

```tsx
<Controller
  name="role"
  control={control}
  render={({ field }) => (
    <FormControl fullWidth>
      <InputLabel>角色</InputLabel>
      <Select {...field} label="角色">
        <MenuItem value="admin">管理员</MenuItem>
        <MenuItem value="user">用户</MenuItem>
      </Select>
    </FormControl>
  )}
/>
```

### 8. `Autocomplete` value 为对象时 `getOptionLabel` 报错

**症状**：`Autocomplete` 的 value 为对象 + `getOptionLabel={(o) => o.label}` 报 `Cannot read property 'label' of null`。

**解决**：

```tsx
<Autocomplete
  options={options}
  getOptionLabel={(option) => option?.label ?? ""}  // 防御
  isOptionEqualToValue={(option, value) => option.id === value?.id}
  value={selectedOption}
  onChange={(_, newValue) => setSelectedOption(newValue)}
/>
```

### 9. `Dialog` 在 Strict Mode 重复触发动画

React 18 Strict Mode 会让 `Dialog` open/close 动画看起来「闪一下」——这是 React 故意触发的副作用测试，**生产环境无影响**。

### 10. Pigment CSS 迁移失败

**症状**：启用 Pigment CSS 后某些 `styled()` 调用报错 `Cannot resolve theme at build time`。

**原因**：Pigment CSS 需要静态分析、不支持动态主题。

**解决**：**回退到 Emotion**——继续用 `cssVariables: true` + Emotion，等 Pigment CSS 成熟。

## 下一步

- **[参考](./reference.md)** —— 80+ 组件 API 速查、`sx` prop 全部缩写、`createTheme` 选项树、TypeScript 核心类型、MUI X 包速查
- 实战项目：可以参考 [react-admin](https://marmelab.com/react-admin/)、[material-react-table](https://www.material-react-table.com/)、[refine.dev](https://refine.dev/) 这些以 MUI 为底层的知名项目
