---
layout: doc
outline: [2, 3]
---

# Mantine 参考

> 适用范围：**Mantine v8.x → v9.x**（2026 年 5 月最新 **v9.2.1**）。本页是 API 速查手册——具体用法参见 [指南](./guide-line.md)。

## 子包速查

| 包名 | 用途 | 必装依赖 |
| ---- | ---- | -------- |
| `@mantine/core` | 130+ 核心组件 | `@mantine/hooks` |
| `@mantine/hooks` | 70+ 实用 hooks（可独立使用） | - |
| `@mantine/form` | 表单库 | - |
| `@mantine/dates` | 日期选择器套件 | `dayjs` |
| `@mantine/notifications` | 通知系统 | `@mantine/core` |
| `@mantine/modals` | 集中式 Modal 管理器 | `@mantine/core` |
| `@mantine/spotlight` | 命令面板（⌘K） | `@mantine/core` |
| `@mantine/charts` | 图表（Recharts 封装） | `recharts` |
| `@mantine/dropzone` | 拖拽上传 | `@mantine/core` |
| `@mantine/tiptap` | 富文本编辑器（Tiptap） | `@tiptap/react @tiptap/pm @tiptap/starter-kit` |
| `@mantine/code-highlight` | 代码高亮（highlight.js） | - |
| `@mantine/carousel` | 轮播（Embla） | `embla-carousel-react` |
| `@mantine/nprogress` | 顶部进度条 | - |

**开发依赖**（v7+ 强制）：

```bash
pnpm add -D postcss postcss-preset-mantine postcss-simple-vars
```

## @mantine/core - 130+ 组件清单

### Layout（10）

| 组件 | 说明 |
| ---- | ---- |
| `AppShell` | 全局应用壳（header / navbar / aside / footer） |
| `AspectRatio` | 固定宽高比 |
| `Center` | 居中容器 |
| `Container` | 限宽容器 |
| `Flex` | 弹性盒 |
| `Grid` | 12 栅格 |
| `Group` | 横向排列 |
| `SimpleGrid` | 响应式简单网格 |
| `Space` | 间距占位 |
| `Stack` | 纵向排列 |

### Inputs（23）

| 组件 | 说明 |
| ---- | ---- |
| `AlphaSlider` | 透明度滑块 |
| `AngleSlider` | 角度滑块 |
| `Checkbox` | 单选框 |
| `Chip` | 芯片选择 |
| `ColorInput` | 颜色输入 |
| `ColorPicker` | 颜色选择器 |
| `Fieldset` | 字段集 |
| `FileInput` | 文件选择 |
| `HueSlider` | 色相滑块 |
| `Input` | 底层 Input |
| `JsonInput` | JSON 编辑器 |
| `MaskInput` | 掩码输入 |
| `NativeSelect` | 原生 select |
| `NumberInput` | 数字输入 |
| `PasswordInput` | 密码输入 |
| `PinInput` | PIN 输入 |
| `Radio` / `Radio.Group` | 单选按钮 |
| `RangeSlider` | 区间滑块 |
| `Rating` | 星级评分 |
| `SegmentedControl` | 分段控件 |
| `Slider` | 滑块 |
| `Switch` | 开关 |
| `Textarea` | 多行文本 |
| `TextInput` | 单行文本 |

### Combobox（8）

| 组件 | 说明 |
| ---- | ---- |
| `Autocomplete` | 自动补全 |
| `Combobox` | 底层 Combobox |
| `MultiSelect` | 多选下拉 |
| `Pill` | 药丸标签 |
| `PillsInput` | 药丸输入 |
| `Select` | 单选下拉 |
| `TagsInput` | 标签输入 |
| `TreeSelect` | 树形选择 |

### Buttons（6）

| 组件 | 说明 |
| ---- | ---- |
| `ActionIcon` | 图标按钮 |
| `Button` | 标准按钮 |
| `CloseButton` | 关闭按钮 |
| `CopyButton` | 复制按钮 |
| `FileButton` | 文件按钮 |
| `UnstyledButton` | 无样式按钮 |

### Navigation（9）

| 组件 | 说明 |
| ---- | ---- |
| `Anchor` | 锚点 |
| `Breadcrumbs` | 面包屑 |
| `Burger` | 汉堡菜单按钮 |
| `NavLink` | 侧边栏导航项 |
| `Pagination` | 分页 |
| `Stepper` | 步骤条 |
| `TableOfContents` | 目录 |
| `Tabs` | 选项卡 |
| `Tree` | 树视图 |

### Feedback（7）

| 组件 | 说明 |
| ---- | ---- |
| `Alert` | 警告提示 |
| `Loader` | 加载指示器 |
| `Notification` | 通知项 |
| `Progress` | 进度条 |
| `RingProgress` | 环形进度 |
| `SemiCircleProgress` | 半环形进度 |
| `Skeleton` | 骨架屏 |

### Overlays（12）

| 组件 | 说明 |
| ---- | ---- |
| `Affix` | 固定定位 |
| `Dialog` | 浮动对话框 |
| `Drawer` | 抽屉 |
| `FloatingIndicator` | 浮动指示器 |
| `FloatingWindow` | 浮动窗口 |
| `HoverCard` | 悬停卡片 |
| `LoadingOverlay` | 加载遮罩 |
| `Menu` | 菜单 |
| `Modal` | 模态对话框 |
| `Overlay` | 通用遮罩 |
| `Popover` | 弹出框 |
| `Tooltip` | 工具提示 |

### Data display（15）

| 组件 | 说明 |
| ---- | ---- |
| `Accordion` | 手风琴 |
| `Avatar` | 头像 |
| `BackgroundImage` | 背景图容器 |
| `Badge` | 徽章 |
| `Card` | 卡片 |
| `ColorSwatch` | 色块 |
| `Image` | 图片 |
| `Indicator` | 小红点 |
| `Kbd` | 键盘按键 |
| `NumberFormatter` | 数字格式化 |
| `OverflowList` | 溢出列表 |
| `RollingNumber` | 滚动数字 |
| `Spoiler` | 展开收起 |
| `ThemeIcon` | 主题图标容器 |
| `Timeline` | 时间线 |

### Typography（9）

| 组件 | 说明 |
| ---- | ---- |
| `Blockquote` | 引用块 |
| `Code` | 行内代码 |
| `Highlight` | 高亮关键词 |
| `List` | 列表 |
| `Mark` | 标记 |
| `Table` | 表格（基础语义化） |
| `Text` | 通用文本 |
| `Title` | h1-h6 标题 |
| `Typography` | prose 容器 |

### Miscellaneous（10）

| 组件 | 说明 |
| ---- | ---- |
| `Box` | 通用容器（Style Props 入口） |
| `Collapse` | 折叠 |
| `Divider` | 分割线 |
| `FocusTrap` | 焦点陷阱 |
| `Marquee` | 跑马灯 |
| `Paper` | 纸片容器 |
| `Portal` | 传送门 |
| `ScrollArea` | 自定义滚动条 |
| `Scroller` | 滚动容器 |
| `Transition` | 过渡动画 |
| `VisuallyHidden` | 视觉隐藏 |

## @mantine/hooks - 70+ Hooks 清单

### State 管理（21）

| Hook | 说明 |
| ---- | ---- |
| `useCounter` | 数字计数器 |
| `useDebouncedCallback` | 防抖回调 |
| `useDebouncedState` | 防抖状态 |
| `useDebouncedValue` | 防抖值 |
| `useDisclosure` | boolean 开关（最常用） |
| `useId` | 唯一 ID 生成 |
| `useInputState` | input 状态 |
| `useListState` | 列表 CRUD |
| `useLocalStorage` | 持久化到 localStorage |
| `useMap` | Map 数据结构 |
| `usePagination` | 分页逻辑 |
| `usePrevious` | 上一次的值 |
| `useQueue` | 队列 |
| `useSelection` | 选择状态 |
| `useSet` | Set 数据结构 |
| `useSetState` | 多字段状态 |
| `useStateHistory` | 状态历史（undo/redo） |
| `useThrottledCallback` | 节流回调 |
| `useThrottledState` | 节流状态 |
| `useThrottledValue` | 节流值 |
| `useToggle` | 多值循环切换 |
| `useUncontrolled` | 受控/非受控双模式 |
| `useValidatedState` | 带校验的状态 |

### UI / DOM（30）

| Hook | 说明 |
| ---- | ---- |
| `useClickOutside` | 点击外部检测 |
| `useCollapse` | 折叠展开 |
| `useColorScheme` | 系统色彩模式偏好 |
| `useDrag` | 拖拽 |
| `useElementSize` | 元素尺寸 |
| `useEventListener` | 事件监听 |
| `useFileDialog` | 文件选择对话框 |
| `useFloatingWindow` | 浮动窗口管理 |
| `useFocusReturn` | 焦点返回 |
| `useFocusTrap` | 焦点陷阱 |
| `useFocusWithin` | 焦点检测 |
| `useFullscreen` | 全屏 |
| `useHotkeys` | 快捷键 |
| `useHover` | hover 状态 |
| `useInViewport` | 视口内检测 |
| `useIntersection` | IntersectionObserver |
| `useLongPress` | 长按 |
| `useMask` | 输入掩码 |
| `useMediaQuery` | 媒体查询 |
| `useMouse` | 鼠标位置 |
| `useMove` | 鼠标移动 |
| `useMutationObserver` | DOM 变更监听 |
| `useOrientation` | 设备方向 |
| `useRadialMove` | 径向移动 |
| `useReducedMotion` | 减少动画偏好 |
| `useResizeObserver` | 尺寸变化监听 |
| `useRovingIndex` | 焦点漫游索引 |
| `useScrollIntoView` | 滚动到指定元素 |
| `useScrollSpy` | 滚动监听 |
| `useScroller` | 滚动管理 |
| `useViewportSize` | 视口尺寸 |
| `useWindowEvent` | window 事件 |
| `useWindowScroll` | window 滚动 |

### Utilities（16）

| Hook | 说明 |
| ---- | ---- |
| `useClipboard` | 剪贴板 |
| `useDocumentTitle` | 文档标题 |
| `useDocumentVisibility` | 文档可见性 |
| `useEyeDropper` | 取色器 |
| `useFavicon` | favicon |
| `useFetch` | 数据请求 |
| `useHash` | URL hash |
| `useHeadroom` | 滚动隐藏头部 |
| `useIdle` | 空闲检测 |
| `useInterval` | 定时器 |
| `useMergedRef` | 合并 refs |
| `useNetwork` | 网络状态 |
| `useOs` | 操作系统 |
| `usePageLeave` | 离开页面检测 |
| `useScrollDirection` | 滚动方向 |
| `useTextSelection` | 文本选择 |
| `useTimeout` | 延时 |

### Lifecycle（6）

| Hook | 说明 |
| ---- | ---- |
| `useDidUpdate` | 跳过首次的 effect |
| `useForceUpdate` | 强制更新 |
| `useIsFirstRender` | 首次渲染检测 |
| `useIsomorphicEffect` | SSR 安全 useEffect |
| `useLogger` | 日志 |
| `useMounted` | 挂载状态 |
| `useShallowEffect` | 浅比较 effect |

## Style Props 完整表

| Prop | CSS 属性 | 类型 |
| ---- | -------- | ---- |
| `m` | margin | string / number / responsive |
| `mt` | margin-top | 同上 |
| `mb` | margin-bottom | 同上 |
| `ml` | margin-left | 同上 |
| `mr` | margin-right | 同上 |
| `mx` | margin-left + margin-right | 同上 |
| `my` | margin-top + margin-bottom | 同上 |
| `p` | padding | 同上 |
| `pt` | padding-top | 同上 |
| `pb` | padding-bottom | 同上 |
| `pl` | padding-left | 同上 |
| `pr` | padding-right | 同上 |
| `px` | padding-x | 同上 |
| `py` | padding-y | 同上 |
| `w` | width | string / number / responsive |
| `h` | height | 同上 |
| `miw` | min-width | 同上 |
| `maw` | max-width | 同上 |
| `mih` | min-height | 同上 |
| `mah` | max-height | 同上 |
| `c` | color | 主题色 / CSS color |
| `bg` | background | 主题色 / CSS color |
| `bd` | border | 边框完整字符串 |
| `fz` | font-size | 主题尺寸 / number |
| `fw` | font-weight | number / string |
| `ff` | font-family | string |
| `lh` | line-height | number / string |
| `ta` | text-align | left / center / right / justify |
| `tt` | text-transform | uppercase / lowercase / capitalize |
| `td` | text-decoration | underline / line-through / none |
| `fs` | font-style | italic / normal |
| `lts` | letter-spacing | number / string |
| `display` | display | block / flex / inline / ... |
| `flex` | flex | 1 / 0 0 auto / ... |
| `pos` | position | static / relative / absolute / fixed |
| `top` | top | number / string |
| `left` | left | 同上 |
| `right` | right | 同上 |
| `bottom` | bottom | 同上 |

### 主题值（spacing）

- `xs` = 0.625rem (10px)
- `sm` = 0.75rem (12px)
- `md` = 1rem (16px)
- `lg` = 1.25rem (20px)
- `xl` = 2rem (32px)

### 主题颜色引用

- `"blue.6"` - `theme.colors.blue[6]`
- `"primary.5"` - `theme.colors[theme.primaryColor][5]`
- `"dimmed"` - 自适应灰色（light: gray.6 / dark: dark.2）
- `"bright"` - 自适应高对比文字色

### 响应式语法

```tsx
<Box w={{ base: 200, sm: 400, md: 600, lg: 800 }} />
```

## createTheme 完整选项

```ts
import { createTheme, type MantineColorsTuple } from "@mantine/core";

export const theme = createTheme({
  // ─── 颜色 ────────────────────────────────────
  primaryColor: "blue",
  primaryShade: 6,                     // number 或 { light: 6, dark: 8 }
  colors: {
    customColor: ["...", /* 10 个 shade */] as MantineColorsTuple,
  },
  white: "#fff",
  black: "#1A1B1E",

  // ─── 字体 ────────────────────────────────────
  fontFamily: "Inter, sans-serif",
  fontFamilyMonospace: "Fira Code, monospace",
  fontSmoothing: true,
  headings: {
    fontFamily: undefined,
    fontWeight: "700",
    textWrap: "wrap",
    sizes: {
      h1: { fontSize: "2.125rem", lineHeight: "1.3", fontWeight: undefined },
      h2: { fontSize: "1.625rem", lineHeight: "1.35" },
      h3: { fontSize: "1.375rem", lineHeight: "1.4" },
      h4: { fontSize: "1.125rem", lineHeight: "1.45" },
      h5: { fontSize: "1rem", lineHeight: "1.5" },
      h6: { fontSize: "0.875rem", lineHeight: "1.5" },
    },
  },
  fontSizes: {
    xs: "0.75rem",
    sm: "0.875rem",
    md: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
  },
  lineHeights: {
    xs: "1.4",
    sm: "1.45",
    md: "1.55",
    lg: "1.6",
    xl: "1.65",
  },

  // ─── 间距 ────────────────────────────────────
  spacing: {
    xs: "0.625rem",
    sm: "0.75rem",
    md: "1rem",
    lg: "1.25rem",
    xl: "2rem",
  },

  // ─── 圆角 ────────────────────────────────────
  radius: {
    xs: "0.125rem",
    sm: "0.25rem",
    md: "0.5rem",
    lg: "1rem",
    xl: "2rem",
  },
  defaultRadius: "sm",

  // ─── 阴影 ────────────────────────────────────
  shadows: {
    xs: "0 1px 3px rgba(0,0,0,0.05)",
    sm: "0 1px 3px rgba(0,0,0,0.1)",
    md: "0 4px 6px rgba(0,0,0,0.1)",
    lg: "0 10px 15px rgba(0,0,0,0.1)",
    xl: "0 20px 25px rgba(0,0,0,0.15)",
  },

  // ─── 断点 ────────────────────────────────────
  breakpoints: {
    xs: "36em",  // 576px
    sm: "48em",  // 768px
    md: "62em",  // 992px
    lg: "75em",  // 1200px
    xl: "88em",  // 1408px
  },

  // ─── 其他 ────────────────────────────────────
  focusRing: "auto",         // auto / always / never
  cursorType: "default",     // default / pointer
  scale: 1,
  autoContrast: false,
  luminanceThreshold: 0.3,
  respectReducedMotion: true,
  defaultGradient: { from: "blue", to: "cyan", deg: 45 },
  activeClassName: "...",    // 模拟 active 状态的类名
  focusClassName: "...",     // 模拟 focus 状态的类名

  // ─── 组件默认配置 ───────────────────────────
  components: {
    Button: {
      defaultProps: { radius: "md", size: "md" },
      classNames: { root: "..." },
      styles: { root: { /* ... */ } },
      vars: (theme, props) => ({ root: { "--button-...": "..." } }),
    },
    // ... 其他组件
  },

  // ─── 用户自定义字段 ─────────────────────────
  other: {
    customField: "value",
  },
});
```

## MantineProvider 完整选项

```tsx
<MantineProvider
  theme={theme}                          // 主题对象
  defaultColorScheme="auto"              // light / dark / auto
  colorSchemeManager={defaultManager}    // 自定义存储
  forceColorScheme={undefined}           // 强制色彩模式（不可切换）
  cssVariablesResolver={undefined}       // 自定义 CSS 变量生成
  classNamesPrefix="mantine"             // 类名前缀
  withCssVariables={true}                // 是否输出 CSS 变量
  withStaticClasses={true}               // 是否输出 .mantine-Xxx-xxx 静态类名
  withGlobalClasses={true}               // 是否输出全局类名
  deduplicateCssVariables={true}         // 去重 CSS 变量
  getRootElement={() => document.documentElement}
  stylesTransform={undefined}            // 样式转换
  env="default"                          // "default" / "test"（test 关闭动画 / 关闭 Portal）
>
  {children}
</MantineProvider>
```

## Styles API

### classNames

```tsx
<Button
  classNames={{
    root: classes.root,
    label: classes.label,
    inner: classes.inner,
    section: classes.section,
    loader: classes.loader,
  }}
/>;
```

### styles

```tsx
<Button
  styles={{
    root: { backgroundColor: "red" },
    label: { fontWeight: 700 },
  }}
/>;
```

### vars

```tsx
<Button
  vars={(theme, props) => ({
    root: {
      "--button-bg": theme.colors.blue[6],
      "--button-color": "#fff",
    },
  })}
/>;
```

### Function 形式

```tsx
<Button
  classNames={(theme, props) => ({
    root: props.disabled ? classes.disabled : classes.active,
  })}
/>;
```

### attributes（测试用）

```tsx
<Button attributes={{ root: { "data-testid": "submit-btn" } }} />;
```

## useMantineColorScheme

```ts
const {
  colorScheme,         // "light" | "dark" | "auto"
  setColorScheme,      // (cs: "light" | "dark" | "auto") => void
  clearColorScheme,    // () => void
  toggleColorScheme,   // () => void  light <-> dark
} = useMantineColorScheme({ keepTransitions: true });
```

## useComputedColorScheme

```ts
const computed = useComputedColorScheme(
  "light",                                  // SSR 初始值
  { getInitialValueInEffect: true },
);
// 返回："light" | "dark"
```

## @mantine/form API

### useForm

```ts
const form = useForm<Values>({
  mode: "uncontrolled",                     // "controlled" | "uncontrolled"
  initialValues: { /* ... */ },
  initialErrors: { /* ... */ },
  initialTouched: { /* ... */ },
  initialDirty: { /* ... */ },
  validate: { /* ... */ },                  // 或 zodResolver(schema)
  validateInputOnChange: false,
  validateInputOnBlur: false,
  clearInputErrorOnChange: true,
  transformValues: (values) => values,
  enhanceGetInputProps: (payload) => ({}),
  onValuesChange: (values, previous) => {},
});
```

### form API

```ts
form.getValues();                           // 当前所有值
form.getInitialValues();                    // 初始值
form.setValues({ /* ... */ });
form.setFieldValue("path", value);
form.setInitialValues({ /* ... */ });

form.reset();
form.resetTouched();
form.resetDirty();

form.validate();                            // 全部校验
form.validateField("path");                 // 单字段校验
form.isValid();                             // 当前是否有效
form.isValid("path");

form.errors;                                // 当前错误对象
form.setErrors({ /* ... */ });
form.setFieldError("path", "msg");
form.clearErrors();
form.clearFieldError("path");

form.isTouched();
form.isTouched("path");
form.setTouched({ /* ... */ });

form.isDirty();
form.isDirty("path");
form.setDirty({ /* ... */ });

form.onSubmit(onSubmit, onError);
form.onReset(onReset);

form.getInputProps("path", options);
form.key("path");                           // 用于 React key
form.removeListItem("path", index);
form.insertListItem("path", value, index);
form.reorderListItem("path", { from, to });
form.replaceListItem("path", index, value);
```

### Watch 字段变化

```ts
form.watch("path", ({ previousValue, value, touched, dirty }) => {
  console.log(value);
});
```

## @mantine/notifications API

### notifications.show

```ts
notifications.show({
  id: "unique-id",
  title: "标题",
  message: "消息",
  color: "blue",
  icon: <IconCheck />,
  autoClose: 4000,                          // false 不自动关闭
  withCloseButton: true,
  withBorder: false,
  loading: false,
  position: "top-right",
  zIndex: 1000,
  className: "...",
  classNames: { /* ... */ },
  style: { /* ... */ },
  styles: { /* ... */ },
  onOpen: () => {},
  onClose: (notif) => {},
});
```

### 其他方法

```ts
notifications.hide(id);
notifications.update({ id, /* 其他 props */ });
notifications.clean();                       // 清空所有
notifications.cleanQueue();                  // 仅清空队列
```

### Notifications 组件 props

```tsx
<Notifications
  position="top-right"                       // top-left / top-center / top-right / bottom-...
  autoClose={4000}
  transitionDuration={250}
  limit={5}                                  // 最多同时显示
  zIndex={400}
  containerWidth={400}
  notificationMaxHeight={undefined}
  pauseResetOnHover={true}
  pauseOnFocusLoss={true}
  allowDragDismiss={true}
  allowScrollDismiss={true}
  withinPortal={true}
  portalProps={{ /* ... */ }}
/>
```

## @mantine/modals API

### modals.open

```ts
modals.open({
  modalId: "unique-id",
  title: "标题",
  centered: true,
  size: "md",                                // xs / sm / md / lg / xl / "100%" / number
  fullScreen: false,
  withCloseButton: true,
  closeOnClickOutside: true,
  closeOnEscape: true,
  trapFocus: true,
  returnFocus: true,
  zIndex: 200,
  overlayProps: { backgroundOpacity: 0.55, blur: 3 },
  transitionProps: { transition: "fade", duration: 200 },
  classNames: { /* ... */ },
  styles: { /* ... */ },
  children: <YourContent />,
  onClose: () => {},
});
```

### modals.openConfirmModal

```ts
modals.openConfirmModal({
  title: "确认操作",
  centered: true,
  children: <Text>确定要继续吗？</Text>,
  labels: { confirm: "确定", cancel: "取消" },
  confirmProps: { color: "red" },
  cancelProps: { variant: "default" },
  closeOnConfirm: true,
  closeOnCancel: true,
  onConfirm: () => {},
  onCancel: () => {},
  // 其他 modals.open 选项
});
```

### modals.openContextModal

```ts
modals.openContextModal({
  modal: "createUser",                       // 预注册的 modal 键
  title: "创建用户",
  innerProps: { userId: "123" },             // 传给 modal 组件的 innerProps
  // 其他 modals.open 选项
});
```

### 其他方法

```ts
modals.close(id);
modals.closeAll();
modals.updateModal({ modalId, /* 其他 props */ });
modals.updateContextModal({ modalId, /* 其他 props */ });
```

## @mantine/spotlight API

### Spotlight 组件 props

```tsx
<Spotlight
  store={spotlight}                          // 可选自定义 store
  actions={actions}                          // SpotlightActionData[] | SpotlightActionGroupData[]
  shortcut={["mod + K", "mod + P", "/"]}     // 触发快捷键
  nothingFound="无匹配结果"
  highlightQuery={true}
  scrollable={true}
  maxHeight={350}
  limit={50}                                 // 显示 actions 上限
  clearQueryOnClose={true}
  filter={undefined}                         // 自定义筛选函数
  filterByTokens={undefined}
  searchProps={{ placeholder: "搜索...", leftSection: <IconSearch /> }}
  closeOnActionTrigger={true}
  closeOnEscape={true}
  closeOnClickOutside={true}
  trapFocus={true}
  zIndex={300}
  overlayProps={{ /* ... */ }}
  transitionProps={{ /* ... */ }}
  classNames={{ /* ... */ }}
  styles={{ /* ... */ }}
/>
```

### SpotlightActionData

```ts
{
  id: "home",
  label: "首页",
  description: "回到首页",
  keywords: ["index", "/"],
  onClick: () => {},
  leftSection: <IconHome />,
  rightSection: <Kbd>Ctrl+H</Kbd>,
  closeSpotlightOnTrigger: true,
  disabled: false,
}
```

### SpotlightActionGroupData

```ts
{
  group: "页面",
  actions: [/* SpotlightActionData[] */],
}
```

### spotlight API

```ts
spotlight.open();
spotlight.close();
spotlight.toggle();
spotlight.registerActions([/* ... */]);
spotlight.removeActions([/* ids */]);
spotlight.updateActions([/* ... */]);
```

## @mantine/dates 组件清单

| 组件 | 说明 |
| ---- | ---- |
| `Calendar` | 纯日历组件 |
| `DateInput` | 日期输入（自由输入 + 选择器） |
| `DatePicker` | 日历（无输入框） |
| `DatePickerInput` | 日期选择器（含输入框） |
| `DateTimePicker` | 日期 + 时间选择器 |
| `MonthPicker` | 月份日历 |
| `MonthPickerInput` | 月份选择器（含输入框） |
| `TimeGrid` | 时间网格 |
| `TimeInput` | 原生时间输入 |
| `TimePicker` | 时间选择器 |
| `TimeValue` | 时间值 |
| `YearPicker` | 年份日历 |
| `YearPickerInput` | 年份选择器（含输入框） |
| `DatesProvider` | 全局配置（locale / 第一天） |

## @mantine/charts 13 种图表

| 图表 | 说明 |
| ---- | ---- |
| `AreaChart` | 面积图 |
| `BarChart` | 柱状图（垂直 / 水平 / 堆叠） |
| `BubbleChart` | 气泡图 |
| `CompositeChart` | 组合图（混合柱状 + 折线 + 面积） |
| `DonutChart` | 环形图 |
| `FunnelChart` | 漏斗图 |
| `Heatmap` | 热力图（如 GitHub 贡献图） |
| `LineChart` | 折线图 |
| `PieChart` | 饼图 |
| `RadarChart` | 雷达图 |
| `RadialBarChart` | 径向柱图 |
| `ScatterChart` | 散点图 |
| `Sparkline` | 迷你折线（行内） |

## TypeScript 核心类型

```ts
import type {
  // 主题
  MantineTheme,
  MantineThemeOverride,
  MantineThemeOther,
  MantineThemeColors,
  MantineThemeComponent,

  // 颜色
  MantineColor,
  MantineColorsTuple,
  MantineColorScheme,
  MantineGradient,
  MantineShade,

  // 尺寸
  MantineSize,
  MantineSpacing,
  MantineRadius,
  MantineFontSize,
  MantineLineHeight,
  MantineBreakpoint,
  MantineBreakpointsValues,
  MantineSpacingValues,
  MantineRadiusValues,
  MantineFontSizesValues,
  MantineLineHeightValues,

  // 阴影
  MantineShadow,
  MantineShadowsValues,

  // 标题
  MantineHeading,
  MantineHeadings,
  MantineHeadingProperties,
  MantineHeadingSize,

  // Styles API
  StylesApiProps,
  StylesRecord,
  ClassNames,
  PartialVarsResolver,
  Factory,

  // 组件 props
  BoxProps,
  BoxComponentProps,
  PolymorphicComponentProps,

  // 组件特定
  ButtonProps,
  ButtonVariant,
  TextInputProps,
  SelectProps,
  // ...

  // 响应式
  StyleProp,
} from "@mantine/core";

// 组件 ref
import type { ElementRef, RefCallBack } from "react";
type ButtonRef = ElementRef<typeof Button>;
```

### 主题类型扩展（Module Augmentation）

```ts
// src/mantine.d.ts
import "@mantine/core";

declare module "@mantine/core" {
  export interface MantineThemeOther {
    customField: string;
  }

  // 扩展 colors 键
  export interface MantineThemeColorsOverride {
    colors: {
      brand: MantineColorsTuple;
    };
  }
}
```

### 表单类型

```ts
import type {
  UseFormInput,
  UseFormReturnType,
  FormErrors,
  FormValidateInput,
  FormRulesRecord,
} from "@mantine/form";
```

### Modals 类型扩展

```ts
declare module "@mantine/modals" {
  export interface MantineModalsOverride {
    modals: {
      createUser: typeof CreateUserModal;
      editProfile: typeof EditProfileModal;
    };
  }
}
```

## PostCSS 配置

`postcss.config.cjs` 完整推荐配置：

```js
module.exports = {
  plugins: {
    "postcss-preset-mantine": {
      autoRem: false,                        // true 自动 px → rem
    },
    "postcss-simple-vars": {
      variables: {
        "mantine-breakpoint-xs": "36em",
        "mantine-breakpoint-sm": "48em",
        "mantine-breakpoint-md": "62em",
        "mantine-breakpoint-lg": "75em",
        "mantine-breakpoint-xl": "88em",
      },
    },
  },
};
```

### postcss-preset-mantine 提供的 mixins

| Mixin | 说明 |
| ----- | ---- |
| `light-dark(lightValue, darkValue)` | 根据当前色彩模式选择 |
| `alpha(color, opacity)` | 设置颜色透明度 |
| `lighten(color, amount)` | 颜色变浅 |
| `darken(color, amount)` | 颜色变深 |
| `@mixin light` | 仅浅色模式样式 |
| `@mixin dark` | 仅暗色模式样式 |
| `@mixin hover` | 仅 hover 支持设备 |
| `@mixin smaller-than $bp` | 媒体查询 `(max-width: $bp - 0.001em)` |
| `@mixin larger-than $bp` | 媒体查询 `(min-width: $bp)` |
| `@mixin rtl` | RTL 方向 |
| `@mixin ltr` | LTR 方向 |
| `@mixin not-rtl` | 非 RTL |
| `@mixin where-light` | `:where([data-mantine-color-scheme="light"])` |
| `@mixin where-dark` | `:where([data-mantine-color-scheme="dark"])` |

## 生成的 CSS Variables

### 颜色（10 shade 每色）

```css
--mantine-color-blue-0 ~ --mantine-color-blue-9
--mantine-color-red-0 ~ --mantine-color-red-9
--mantine-color-green-0 ~ --mantine-color-green-9
... (gray / dark / red / pink / grape / violet / indigo / blue / cyan / teal / green / lime / yellow / orange)
```

### 间距 / 圆角 / 字号 / 阴影 / 行高

```css
--mantine-spacing-xs ~ --mantine-spacing-xl
--mantine-radius-xs ~ --mantine-radius-xl
--mantine-font-size-xs ~ --mantine-font-size-xl
--mantine-shadow-xs ~ --mantine-shadow-xl
--mantine-line-height-xs ~ --mantine-line-height-xl
```

### 标题

```css
--mantine-h1-font-size ~ --mantine-h6-font-size
--mantine-h1-line-height ~ --mantine-h6-line-height
--mantine-h1-font-weight ~ --mantine-h6-font-weight
```

### 字体

```css
--mantine-font-family
--mantine-font-family-monospace
--mantine-font-family-headings
```

### 主色

```css
--mantine-primary-color-0 ~ --mantine-primary-color-9
--mantine-primary-color-filled       /* 默认 filled 背景 */
--mantine-primary-color-filled-hover
--mantine-primary-color-light
--mantine-primary-color-light-hover
--mantine-primary-color-light-color
--mantine-primary-color-contrast     /* 对比色（深色背景上的白字等） */
```

### 通用色（自适应深浅）

```css
--mantine-color-text          /* 默认文本色 */
--mantine-color-body          /* body 背景 */
--mantine-color-error         /* 错误色 */
--mantine-color-placeholder   /* placeholder 色 */
--mantine-color-anchor        /* 链接色 */
--mantine-color-default       /* 默认背景 */
--mantine-color-default-hover
--mantine-color-default-color
--mantine-color-default-border
--mantine-color-dimmed        /* 弱化文本 */
--mantine-color-bright        /* 高对比文本 */
--mantine-color-disabled      /* 禁用背景 */
--mantine-color-disabled-color
```

## 主题色板（默认）

Mantine 默认提供 14 种颜色，每种 10 个 shade（0-9）：

| 颜色 | 用途 |
| ---- | ---- |
| `dark` | 暗色背景 |
| `gray` | 中性灰 |
| `red` | 红色 |
| `pink` | 粉色 |
| `grape` | 葡萄紫 |
| `violet` | 紫罗兰 |
| `indigo` | 靛蓝 |
| `blue` | 蓝色（默认 primaryColor） |
| `cyan` | 青色 |
| `teal` | 蓝绿 |
| `green` | 绿色 |
| `lime` | 青柠 |
| `yellow` | 黄色 |
| `orange` | 橙色 |

## 关键模板项目

```bash
# 最小 Vite + React + TS
npx degit mantinedev/vite-min-template my-app

# 完整 Vite + Vitest + Storybook + ESLint
npx degit mantinedev/vite-template my-app

# Next.js App Router
npx degit mantinedev/next-app-template my-app

# Next.js Pages Router（已不推荐）
npx degit mantinedev/next-pages-template my-app
```

## 升级路径

### v6 → v7 重大变更

- **从 Emotion 迁移到 CSS Modules** —— 移除 `<EmotionProvider>` / `MantineEmotionStylesProvider`
- 移除 `sx` prop —— 用 `style` prop 或 CSS Modules 代替
- 移除 `createStyles` —— 用 CSS Modules 代替
- 主题对象部分字段调整（如 `colorScheme` 改为顶层）

### v7 → v8 改动

- `@mantine/form` 重写（性能提升 + uncontrolled 模式成为默认）
- `useForm` API 部分调整（`getInputProps` 第二参数 options 变更）
- `MultiSelect` / `TagsInput` API 统一
- 性能优化（render 次数减少）

### v8 → v9 改动

- 主要是 bug 修复 + 类型完善 + 小型 API 优化
- **基本无破坏性变更**，平滑升级

## 官方资源

| 资源 | URL |
| ---- | --- |
| 主文档 | https://mantine.dev/ |
| 组件入门 | https://mantine.dev/getting-started/ |
| Hooks 入门 | https://mantine.dev/hooks/use-disclosure/ |
| Mantine UI（123 业务组件） | https://ui.mantine.dev/ |
| Colors Generator | https://mantine.dev/colors-generator/ |
| Help 站 | https://help.mantine.dev/ |
| GitHub | https://github.com/mantinedev/mantine |
| Discord | https://discord.gg/mantine |
| X / Twitter | https://x.com/mantinedev |

## 社区扩展生态

| 包 | 用途 |
| -- | ---- |
| `mantine-datatable` | 简单数据表格 |
| `mantine-react-table` | 高级数据表格（TanStack Table 底层） |
| `mantine-form-zod-resolver` | Zod 校验集成 |
| `mantine-form-yup-resolver` | Yup 校验集成 |
| `mantine-form-valibot-resolver` | Valibot 校验集成 |
| `mantine-contextmenu` | 右键菜单 |
| `@tabler/icons-react` | Tabler 图标库（Mantine 推荐） |
| `@mantinex/dev-icons` | Mantine 开发图标 |
| `@mantinex/mantine-logo` | Mantine 官方 Logo 组件 |
| `@mantinex/dates-meta` | dates 元数据 |
