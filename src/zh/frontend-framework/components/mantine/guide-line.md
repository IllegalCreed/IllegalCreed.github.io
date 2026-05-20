---
layout: doc
outline: [2, 3]
---

# Mantine 指南

> 适用范围：**Mantine v8.x → v9.x**（2026 年 5 月最新 **v9.2.1**），React 18 / 19 + TypeScript 5+。

## 130+ 组件全景

Mantine 8 / 9 的 `@mantine/core` 提供 **130+ 组件** 分为 10 大类别。下表是按类别速览，详细 API 见 [参考](./reference.md) 与 [Mantine 官网](https://mantine.dev/)。

### Layout（布局）

布局是 Mantine 的强项 —— 10 个组件覆盖从全局壳到内部弹性盒的所有场景。

| 组件 | 用途 | 关键 props |
| ---- | ---- | ---------- |
| `AppShell` | 全局应用壳（含 header / navbar / aside / footer） | `header`, `navbar`, `aside`, `footer`, `padding` |
| `Container` | 限宽容器 | `size` (xs/sm/md/lg/xl/数字), `fluid` |
| `Flex` | 弹性盒（CSS Flexbox 直出） | `direction`, `gap`, `wrap`, `align`, `justify` |
| `Grid` | 12 栅格 | `gutter`, `columns`, `grow` |
| `Group` | 横向排列（gap + align） | `gap`, `justify`, `wrap`, `grow` |
| `SimpleGrid` | 响应式简单网格 | `cols`, `spacing`, `verticalSpacing` |
| `Stack` | 纵向排列 | `gap`, `align`, `justify` |
| `Center` | 居中容器 | `inline` |
| `Space` | 间距占位 | `h`, `w` |
| `AspectRatio` | 固定宽高比 | `ratio` |

`AppShell` 经典用法（顶部导航 + 侧边栏 + 主内容）：

```tsx
import { AppShell, Burger } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [opened, { toggle }] = useDisclosure();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 280, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" />
        Header 内容
      </AppShell.Header>
      <AppShell.Navbar p="md">侧边栏</AppShell.Navbar>
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
```

要点：

- `breakpoint: "sm"` - 小屏下导航栏可折叠
- `collapsed: { mobile: !opened }` - 移动端默认折叠、按钮触发展开
- `hiddenFrom="sm"` - Burger 按钮仅在小屏显示

### Inputs（输入）

23+ 个输入组件覆盖所有表单场景。

| 组件 | 用途 |
| ---- | ---- |
| `TextInput` | 单行文本输入 |
| `Textarea` | 多行文本输入 |
| `NumberInput` | 数字输入（支持 step / min / max / prefix / suffix） |
| `PasswordInput` | 密码输入（含可见性切换） |
| `PinInput` | 数字 PIN 验证码输入（6 位等） |
| `FileInput` | 文件选择（按钮形） |
| `JsonInput` | JSON 编辑器（含校验） |
| `MaskInput` | 输入掩码（电话 / 卡号格式化） |
| `Checkbox` | 单选框 |
| `Radio` / `Radio.Group` | 单选按钮组 |
| `Switch` | 开关 |
| `Slider` / `RangeSlider` | 滑块 / 区间滑块 |
| `Rating` | 星级评分 |
| `SegmentedControl` | 分段控件 |
| `ColorPicker` / `ColorInput` | 颜色选择 |
| `HueSlider` / `AlphaSlider` | 色相 / 透明度滑块 |
| `AngleSlider` | 角度滑块 |
| `Fieldset` | 字段集（含 legend） |
| `Input` | 底层 Input（用于自定义） |
| `NativeSelect` | 原生 select（不带搜索） |

`TextInput` + `useForm` 完整示例：

```tsx
import { TextInput, NumberInput, Textarea, Button, Stack } from "@mantine/core";
import { useForm } from "@mantine/form";

interface FormValues {
  name: string;
  age: number | "";
  bio: string;
}

export default function ProfileForm() {
  const form = useForm<FormValues>({
    mode: "uncontrolled",
    initialValues: { name: "", age: "", bio: "" },
    validate: {
      name: (value) => (value.length < 2 ? "至少 2 个字符" : null),
      age: (value) => (value === "" || value < 18 ? "必须 ≥ 18 岁" : null),
    },
  });

  return (
    <form onSubmit={form.onSubmit((values) => console.log(values))}>
      <Stack gap="md">
        <TextInput
          label="姓名"
          placeholder="张三"
          required
          {...form.getInputProps("name")}
        />
        <NumberInput
          label="年龄"
          min={0}
          max={120}
          required
          {...form.getInputProps("age")}
        />
        <Textarea
          label="个人简介"
          autosize
          minRows={3}
          maxRows={6}
          {...form.getInputProps("bio")}
        />
        <Button type="submit">提交</Button>
      </Stack>
    </form>
  );
}
```

### Combobox（下拉选择系列）

Combobox 是 Mantine 输入系列里**功能最丰富的一支** —— 8 个组件覆盖单选 / 多选 / 自动补全 / 标签 / 树形等所有下拉场景。

| 组件 | 用途 |
| ---- | ---- |
| `Select` | 单选下拉（带搜索可选） |
| `MultiSelect` | 多选下拉（带搜索可选） |
| `Autocomplete` | 自动补全输入（不限制只能选 options） |
| `TagsInput` | 标签输入（可创建新标签） |
| `Pill` / `PillsInput` | 药丸标签 / 药丸输入 |
| `TreeSelect` | 树形选择 |
| `Combobox` | **底层 Combobox**（用于完全自定义） |

`Select` 常见用法：

```tsx
import { Select } from "@mantine/core";

<Select
  label="选择国家"
  placeholder="请选择"
  searchable                  // 启用搜索
  clearable                   // 显示清除按钮
  nothingFoundMessage="无匹配"
  data={[
    { value: "cn", label: "中国" },
    { value: "us", label: "美国" },
    { value: "jp", label: "日本" },
  ]}
  onChange={(value) => console.log(value)}
/>;
```

`MultiSelect` 多选：

```tsx
<MultiSelect
  label="选择标签"
  data={["React", "Vue", "Angular", "Svelte"]}
  searchable
  clearable
  hidePickedOptions          // 已选项从下拉中隐藏
  maxValues={3}              // 最多 3 个
/>
```

`TagsInput` 可创建新标签：

```tsx
<TagsInput
  label="标签"
  placeholder="按回车添加"
  data={["前端", "后端", "全栈"]}  // 推荐项
  splitChars={[",", " ", "|"]}   // 这些字符也触发添加
  maxTags={5}
/>
```

### Buttons（按钮）

| 组件 | 用途 |
| ---- | ---- |
| `Button` | 标准按钮 |
| `ActionIcon` | 图标按钮（圆形 / 方形） |
| `CloseButton` | 关闭按钮 (×) |
| `CopyButton` | 复制按钮（含已复制反馈） |
| `FileButton` | 文件选择按钮 |
| `UnstyledButton` | 无样式按钮（保留按钮语义） |

`Button` 完整 props 演示：

```tsx
<Button
  variant="filled"         // filled / light / outline / subtle / transparent / white / default / gradient
  color="blue"             // 主题色键
  size="md"                // xs / sm / md / lg / xl
  radius="md"
  loading={isSubmitting}   // 加载态（spinner + 禁用）
  loaderProps={{ type: "dots" }}
  leftSection={<IconCheck size={16} />}   // 左侧图标
  rightSection={<IconArrowRight size={16} />}
  fullWidth                // 占满宽度
  disabled
  onClick={handleClick}
>
  提交
</Button>
```

`CopyButton` 自带反馈：

```tsx
import { Button, CopyButton, Tooltip } from "@mantine/core";

<CopyButton value="要复制的内容" timeout={2000}>
  {({ copied, copy }) => (
    <Tooltip label={copied ? "已复制" : "点击复制"}>
      <Button color={copied ? "teal" : "blue"} onClick={copy}>
        {copied ? "已复制" : "复制"}
      </Button>
    </Tooltip>
  )}
</CopyButton>;
```

### Navigation（导航）

| 组件 | 用途 |
| ---- | ---- |
| `Anchor` | 锚点（语义化 a 标签） |
| `Breadcrumbs` | 面包屑 |
| `Burger` | 汉堡菜单按钮 |
| `NavLink` | 侧边栏导航项（支持嵌套） |
| `Pagination` | 分页 |
| `Stepper` | 步骤条 |
| `TableOfContents` | 自动生成目录（基于 ScrollSpy） |
| `Tabs` | 选项卡 |
| `Tree` | 树视图 |

`NavLink` 侧边栏（含嵌套）：

```tsx
import { NavLink } from "@mantine/core";
import { IconHome, IconUsers, IconSettings } from "@tabler/icons-react";

<>
  <NavLink href="/" label="首页" leftSection={<IconHome size={16} />} />
  <NavLink label="用户管理" leftSection={<IconUsers size={16} />} childrenOffset={28}>
    <NavLink href="/users" label="用户列表" />
    <NavLink href="/roles" label="角色管理" />
  </NavLink>
  <NavLink href="/settings" label="设置" leftSection={<IconSettings size={16} />} />
</>;
```

`Stepper` 步骤条：

```tsx
import { Stepper, Button, Group } from "@mantine/core";
import { useState } from "react";

const [active, setActive] = useState(0);

<>
  <Stepper active={active} onStepClick={setActive}>
    <Stepper.Step label="第一步" description="填写信息">
      第一步内容
    </Stepper.Step>
    <Stepper.Step label="第二步" description="核对信息">
      第二步内容
    </Stepper.Step>
    <Stepper.Step label="第三步" description="完成">
      已完成
    </Stepper.Step>
    <Stepper.Completed>全部完成</Stepper.Completed>
  </Stepper>

  <Group justify="flex-end" mt="xl">
    <Button variant="default" onClick={() => setActive((s) => Math.max(s - 1, 0))}>
      上一步
    </Button>
    <Button onClick={() => setActive((s) => s + 1)}>下一步</Button>
  </Group>
</>;
```

### Feedback（反馈）

| 组件 | 用途 |
| ---- | ---- |
| `Alert` | 警告 / 信息提示框 |
| `Loader` | 加载指示器 |
| `Notification` | 通知项（搭配 `@mantine/notifications`） |
| `Progress` | 进度条 |
| `RingProgress` | 环形进度 |
| `SemiCircleProgress` | 半环形进度 |
| `Skeleton` | 骨架屏 |

`Alert`：

```tsx
import { Alert } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";

<Alert
  variant="light"
  color="blue"
  title="提示"
  icon={<IconInfoCircle />}
  withCloseButton
  onClose={() => console.log("关闭")}
>
  请确认你的操作。
</Alert>;
```

`Progress` 进度条：

```tsx
<Progress value={75} color="blue" size="md" striped animated />

{/* 多色分段 */}
<Progress.Root size="lg">
  <Progress.Section value={40} color="green" />
  <Progress.Section value={30} color="yellow" />
  <Progress.Section value={20} color="red" />
</Progress.Root>
```

### Overlays（覆盖层）

| 组件 | 用途 |
| ---- | ---- |
| `Modal` | 模态对话框 |
| `Drawer` | 抽屉 |
| `Popover` | 弹出框 |
| `HoverCard` | 悬停卡片 |
| `Menu` | 菜单 |
| `Tooltip` | 工具提示 |
| `LoadingOverlay` | 加载遮罩 |
| `Overlay` | 通用遮罩 |
| `Dialog` | 浮动对话框（固定位置） |
| `Affix` | 固定定位元素 |
| `FloatingIndicator` | 浮动指示器 |
| `FloatingWindow` | 浮动窗口（可拖拽） |

`Modal` 基础用法：

```tsx
import { Modal, Button } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

const [opened, { open, close }] = useDisclosure(false);

<>
  <Button onClick={open}>打开 Modal</Button>
  <Modal
    opened={opened}
    onClose={close}
    title="提示"
    centered
    size="md"
    closeOnClickOutside={false}    // 点击遮罩不关闭
    overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
  >
    Modal 内容
  </Modal>
</>;
```

`Menu` 菜单：

```tsx
import { Menu, Button } from "@mantine/core";
import { IconEdit, IconTrash } from "@tabler/icons-react";

<Menu shadow="md" width={200}>
  <Menu.Target>
    <Button>选项</Button>
  </Menu.Target>
  <Menu.Dropdown>
    <Menu.Label>操作</Menu.Label>
    <Menu.Item leftSection={<IconEdit size={14} />}>编辑</Menu.Item>
    <Menu.Item leftSection={<IconTrash size={14} />} color="red">
      删除
    </Menu.Item>
    <Menu.Divider />
    <Menu.Item disabled>不可用</Menu.Item>
  </Menu.Dropdown>
</Menu>;
```

### Data display（数据展示）

| 组件 | 用途 |
| ---- | ---- |
| `Avatar` | 头像 |
| `Badge` | 徽章 |
| `Card` | 卡片 |
| `Accordion` | 手风琴折叠 |
| `Image` | 图片 |
| `BackgroundImage` | 背景图容器 |
| `Indicator` | 指示器（小红点） |
| `Kbd` | 键盘按键样式 |
| `ColorSwatch` | 色块 |
| `NumberFormatter` | 数字格式化 |
| `OverflowList` | 溢出列表 |
| `RollingNumber` | 滚动数字 |
| `Spoiler` | 展开收起文本 |
| `ThemeIcon` | 主题图标容器 |
| `Timeline` | 时间线 |

`Card` 完整：

```tsx
import { Card, Image, Text, Badge, Button, Group } from "@mantine/core";

<Card shadow="sm" padding="lg" radius="md" withBorder>
  <Card.Section>
    <Image src="https://example.com/image.jpg" height={160} alt="封面" />
  </Card.Section>
  <Group justify="space-between" mt="md" mb="xs">
    <Text fw={500}>卡片标题</Text>
    <Badge color="pink">新</Badge>
  </Group>
  <Text size="sm" c="dimmed">
    卡片描述文字
  </Text>
  <Button color="blue" fullWidth mt="md" radius="md">
    立即购买
  </Button>
</Card>;
```

`Accordion`：

```tsx
import { Accordion } from "@mantine/core";

<Accordion defaultValue="item-1" variant="separated">
  <Accordion.Item value="item-1">
    <Accordion.Control>第一项</Accordion.Control>
    <Accordion.Panel>第一项内容</Accordion.Panel>
  </Accordion.Item>
  <Accordion.Item value="item-2">
    <Accordion.Control>第二项</Accordion.Control>
    <Accordion.Panel>第二项内容</Accordion.Panel>
  </Accordion.Item>
</Accordion>;
```

### Typography（排版）

| 组件 | 用途 |
| ---- | ---- |
| `Title` | h1-h6 标题 |
| `Text` | 段落 / 通用文本 |
| `Blockquote` | 引用块 |
| `Code` | 行内代码 |
| `Highlight` | 高亮关键词 |
| `List` | 有序 / 无序列表 |
| `Mark` | 标记文本 |
| `Table` | 表格（基础语义化） |
| `Typography` | 排版容器（应用 prose 样式） |

```tsx
<Title order={1}>H1 标题</Title>
<Title order={2} c="dimmed">H2 灰色标题</Title>

<Text size="lg" fw={500}>正常文本</Text>
<Text size="sm" c="red.6">红色小字</Text>

<Highlight highlight={["Mantine", "React"]}>
  Mantine 是 React 现代 UI 库
</Highlight>
```

### Miscellaneous（其他）

| 组件 | 用途 |
| ---- | ---- |
| `Box` | 通用容器（Style Props 入口） |
| `Collapse` | 折叠 |
| `Divider` | 分割线 |
| `FocusTrap` | 焦点陷阱 |
| `Marquee` | 跑马灯 |
| `Paper` | 纸片容器 |
| `Portal` | 传送门 |
| `ScrollArea` | 自定义滚动条 |
| `Transition` | 过渡动画 |
| `VisuallyHidden` | 视觉隐藏（a11y 友好） |

## Style Props 完整 API

Mantine 几乎所有组件都通过 `Box` 继承 Style Props——这是 Tailwind utility 哲学的 React props 化。

### 完整 Style Props 列表

```tsx
<Box
  // 外边距
  m="md" mt={4} mb="sm" ml="xs" mr={8} mx="lg" my="auto"
  // 内边距
  p="md" pt={4} pb="sm" pl="xs" pr={8} px="lg" py="auto"
  // 尺寸
  w={200} h="100%" miw="200px" maw="600px" mih={100} mah="80vh"
  // 颜色
  c="blue.6"            // text color
  bg="gray.0"           // background
  bd="1px solid blue"   // border
  // 字体
  fz="lg"               // font-size
  fw={700}              // font-weight
  ff="monospace"        // font-family
  lh={1.5}              // line-height
  ta="center"           // text-align
  tt="uppercase"        // text-transform
  td="underline"        // text-decoration
  fs="italic"           // font-style
  lts="0.05em"          // letter-spacing
  // 布局
  display="flex"
  flex={1}
  pos="absolute"
  top={0} left={0} right={0} bottom={0}
>
  内容
</Box>
```

### 主题值引用

```tsx
{/* 主题 spacing - "xs" / "sm" / "md" / "lg" / "xl" 或数字（px） */}
<Box mt="md" />        {/* = theme.spacing.md */}
<Box mt={16} />        {/* = 16px */}

{/* 主题颜色 - "颜色名.shade" 或纯 CSS 颜色 */}
<Box c="blue.6" />     {/* = theme.colors.blue[6] */}
<Box c="primary.5" />  {/* = theme.colors[theme.primaryColor][5] */}
<Box c="dimmed" />     {/* 特殊值：theme.colors.gray[6] / dark.2 自适应 */}
<Box c="bright" />     {/* 特殊值：自适应高对比文字色 */}
<Box c="#ff0000" />    {/* 直接 CSS 颜色 */}
```

### 响应式对象语法

```tsx
<Box
  w={{ base: 200, sm: 400, md: 600, lg: 800 }}
  p={{ base: "xs", md: "lg" }}
  c={{ base: "dark", md: "blue.6" }}
>
  小屏 200px、sm 屏 400px ...
</Box>
```

断点（默认值，可通过 `theme.breakpoints` 覆盖）：

- `xs`: 36em / 576px
- `sm`: 48em / 768px
- `md`: 62em / 992px
- `lg`: 75em / 1200px
- `xl`: 88em / 1408px

> **`base` 是默认值**——所有未匹配断点的视口都使用 base。

### Style Props 与 className 共存

Style Props 优先级低于 CSS Modules className —— 你可以同时用：

```tsx
import classes from "./MyCard.module.css";

<Box className={classes.card} mt="md" p="lg">
  className 设置基础样式、Style Props 覆盖细节
</Box>;
```

## Styles API 三重定制

Mantine 提供三种内部元素样式定制方式，适应不同场景。

### 方式 1：classNames - 推荐

`classNames` 接受对象，键是命名插槽（如 `root` / `label` / `input`），值是 CSS Modules 类名：

```tsx
// MyButton.module.css
.root { /* 根元素样式 */ }
.label { /* 文本样式 */ }
```

```tsx
import classes from "./MyButton.module.css";

<Button
  classNames={{
    root: classes.root,
    label: classes.label,
  }}
>
  自定义按钮
</Button>;
```

**优势**：性能最好（编译时确定）、可命中所有内部 DOM、与 CSS Modules 完美配合。

### 方式 2：styles - 内联样式

```tsx
<Button
  styles={{
    root: {
      backgroundColor: "purple",
      borderColor: "purple",
    },
    label: {
      fontSize: "20px",
      textTransform: "uppercase",
    },
  }}
>
  内联自定义
</Button>
```

**注意**：内联样式优先级高于 class —— 同时用 classNames + styles 时 styles 会覆盖 classNames。

### 方式 3：vars - CSS Variables 覆盖

```tsx
<Button
  vars={(theme, props) => ({
    root: {
      "--button-color": theme.colors.violet[6],
      "--button-bg": "transparent",
      "--button-hover": theme.colors.violet[0],
    },
  })}
>
  CSS 变量覆盖
</Button>
```

**优势**：精准只改 CSS Variables、不破坏其他样式、性能最好。

### Function 形式（响应 props）

`classNames` / `styles` 都支持函数形式，接受 theme + 当前组件 props：

```tsx
<Button
  classNames={(theme, props) => ({
    root: props.disabled ? classes.disabled : classes.active,
  })}
>
  动态类名
</Button>
```

### Theme 中全局定制

如果同一组件需要全局样式，写到 `theme.components`：

```ts
import { createTheme, Button } from "@mantine/core";
import classes from "./global-button.module.css";

export const theme = createTheme({
  components: {
    Button: Button.extend({
      classNames: {
        root: classes.root,
        label: classes.label,
      },
      defaultProps: {
        radius: "md",
        size: "md",
      },
    }),
  },
});
```

`Button.extend()` 是 v7+ 引入的辅助函数 —— 比直接写 `Button: { classNames: ... }` 更类型安全。

## createTheme 完整选项

```ts
import { createTheme, type MantineColorsTuple } from "@mantine/core";

const brand: MantineColorsTuple = [
  "#e0f7ff", "#b3ecff", "#80dfff", "#4dd2ff", "#26c8ff",
  "#00bfff", "#00a8e8", "#0094cc", "#0080b3", "#006d9e",
];

export const theme = createTheme({
  // ─── 颜色 ────────────────────────────────────
  primaryColor: "brand",        // 默认主色（引用 colors 键）
  primaryShade: 6,              // 默认主色 shade（0-9，可针对 light/dark 分别配置）
  colors: {
    brand,                      // 自定义 brand 色（10 个 shade）
    // 也可以覆盖默认色
    blue: ["#...", /* 10 个 */],
  },
  white: "#ffffff",
  black: "#1A1B1E",

  // ─── 字体 ────────────────────────────────────
  fontFamily: "Inter, sans-serif",
  fontFamilyMonospace: "Fira Code, monospace",
  headings: {
    fontFamily: "Inter, sans-serif",
    fontWeight: "600",
    sizes: {
      h1: { fontSize: "2.5rem", lineHeight: "1.3" },
      h2: { fontSize: "2rem", lineHeight: "1.35" },
      h3: { fontSize: "1.5rem", lineHeight: "1.4" },
      h4: { fontSize: "1.25rem", lineHeight: "1.45" },
      h5: { fontSize: "1.125rem", lineHeight: "1.5" },
      h6: { fontSize: "1rem", lineHeight: "1.55" },
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

  // ─── 间距 / 圆角 / 阴影 ──────────────────────
  spacing: {
    xs: "0.625rem",
    sm: "0.75rem",
    md: "1rem",
    lg: "1.25rem",
    xl: "2rem",
  },
  radius: {
    xs: "0.125rem",
    sm: "0.25rem",
    md: "0.5rem",
    lg: "1rem",
    xl: "2rem",
  },
  defaultRadius: "md",
  shadows: {
    xs: "0 1px 3px rgba(0,0,0,0.05)",
    sm: "0 1px 3px rgba(0,0,0,0.1)",
    md: "0 4px 6px rgba(0,0,0,0.1)",
    lg: "0 10px 15px rgba(0,0,0,0.1)",
    xl: "0 20px 25px rgba(0,0,0,0.15)",
  },

  // ─── 断点 ────────────────────────────────────
  breakpoints: {
    xs: "36em",
    sm: "48em",
    md: "62em",
    lg: "75em",
    xl: "88em",
  },

  // ─── 组件默认 props / 样式 ──────────────────
  components: {
    Button: {
      defaultProps: {
        radius: "md",
        size: "md",
      },
    },
    Card: {
      defaultProps: {
        shadow: "sm",
        radius: "md",
        withBorder: true,
        padding: "lg",
      },
    },
  },

  // ─── 用户自定义字段 ─────────────────────────
  other: {
    customSpacing: "2.5rem",
    brandName: "My Brand",
  },
});
```

### 主题嵌套

在子树内覆盖部分主题：

```tsx
<MantineProvider theme={theme}>
  <App />
  {/* 子树覆盖 primaryColor */}
  <MantineProvider theme={{ primaryColor: "pink" }}>
    <PinkSection />
  </MantineProvider>
</MantineProvider>
```

### 在组件内访问主题

```tsx
import { useMantineTheme } from "@mantine/core";

function MyComponent() {
  const theme = useMantineTheme();

  return <div style={{ color: theme.colors.blue[6] }}>主题色</div>;
}
```

## Color Scheme 完整方案

### 启用方式

```tsx
<MantineProvider defaultColorScheme="auto">
  {/* 三种值：light / dark / auto */}
</MantineProvider>
```

### useMantineColorScheme hook

```tsx
const {
  colorScheme,        // 当前用户设置 "light" / "dark" / "auto"
  setColorScheme,     // 设置 (cs: 'light' | 'dark' | 'auto') => void
  clearColorScheme,   // 清除持久化 () => void
  toggleColorScheme,  // 切换 light <-> dark () => void
} = useMantineColorScheme();
```

### useComputedColorScheme hook

```tsx
// 永远返回 "light" / "dark" 二选一（auto 自动解算）
const computed = useComputedColorScheme("light", { getInitialValueInEffect: true });
```

**关键参数**：

- 第一个参数：SSR 初始值（避免 hydration 错位）
- `getInitialValueInEffect: true`：在 useEffect 中获取初始值（避免 SSR mismatch）

### 完整切换按钮

```tsx
import { ActionIcon, useMantineColorScheme, useComputedColorScheme } from "@mantine/core";
import { IconSun, IconMoon } from "@tabler/icons-react";

export function ColorSchemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("light", {
    getInitialValueInEffect: true,
  });

  const toggle = () => setColorScheme(computedColorScheme === "light" ? "dark" : "light");

  return (
    <ActionIcon onClick={toggle} variant="default" size="lg" aria-label="切换主题">
      {computedColorScheme === "dark" ? <IconSun size={16} /> : <IconMoon size={16} />}
    </ActionIcon>
  );
}
```

### 组件级 lightHidden / darkHidden

任意组件可用：

```tsx
<Box lightHidden>仅暗色显示</Box>
<Box darkHidden>仅浅色显示</Box>
```

适合不同主题下显示不同 logo / 图片等场景。

### CSS 中适配

CSS Modules 中使用 `[data-mantine-color-scheme="dark"]` 选择器：

```css
.card {
  background: white;
  color: black;
}

[data-mantine-color-scheme="dark"] .card {
  background: var(--mantine-color-dark-7);
  color: white;
}
```

或者用 `light-dark()` mixin（`postcss-preset-mantine` 提供）：

```css
.card {
  background: light-dark(white, var(--mantine-color-dark-7));
  color: light-dark(black, white);
}
```

## @mantine/form 完整方案

### 基础用法

```tsx
import { useForm } from "@mantine/form";

interface FormValues {
  email: string;
  password: string;
  age: number | "";
  agree: boolean;
}

const form = useForm<FormValues>({
  mode: "uncontrolled",        // "uncontrolled"（推荐）/ "controlled"
  initialValues: {
    email: "",
    password: "",
    age: "",
    agree: false,
  },
  validate: {
    email: (value) => (/^\S+@\S+$/.test(value) ? null : "邮箱格式不正确"),
    password: (value) => (value.length < 6 ? "至少 6 个字符" : null),
    age: (value) =>
      typeof value === "number" && value >= 18 ? null : "必须 ≥ 18 岁",
    agree: (value) => (value ? null : "必须同意条款"),
  },
});
```

### validate 形式

#### 1. 同步函数

```ts
validate: {
  email: (value) => (/.../.test(value) ? null : "错误信息"),
}
```

返回 `null` / `undefined` 表示通过，返回字符串表示错误信息。

#### 2. 跨字段引用（接收完整 values）

```ts
validate: {
  passwordConfirm: (value, values) =>
    value !== values.password ? "两次密码不一致" : null,
}
```

#### 3. Zod resolver（推荐生产）

```bash
pnpm add zod mantine-form-zod-resolver
```

```ts
import { z } from "zod";
import { zodResolver } from "mantine-form-zod-resolver";

const schema = z.object({
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(6, "至少 6 个字符"),
});

const form = useForm({
  initialValues: { email: "", password: "" },
  validate: zodResolver(schema),
});
```

### onSubmit

```tsx
<form
  onSubmit={form.onSubmit(
    (values) => console.log("提交成功", values),
    (errors) => console.log("校验失败", errors),
  )}
>
  ...
</form>
```

`onSubmit` 自动 preventDefault + 触发 validate，校验失败调用第二个参数。

### getInputProps - 自动绑定

```tsx
<TextInput {...form.getInputProps("email")} />
<Checkbox {...form.getInputProps("agree", { type: "checkbox" })} />
```

`getInputProps` 自动展开 `value` / `onChange` / `error` / `defaultValue` 等。

### setValues / setFieldValue

```tsx
form.setValues({ email: "new@example.com" });
form.setFieldValue("password", "newPassword");
form.setFieldValue("user.profile.name", "新名字");  // 支持嵌套路径
```

### reset / clearErrors

```tsx
form.reset();                  // 重置为 initialValues
form.clearErrors();            // 清空所有错误
form.setFieldError("email", "");
```

### 嵌套对象 / 数组

```ts
const form = useForm({
  initialValues: {
    user: { name: "", email: "" },
    skills: ["", ""],
  },
});

<TextInput {...form.getInputProps("user.name")} />
<TextInput {...form.getInputProps("skills.0")} />
```

### 表单状态判断

```tsx
form.isValid();            // 整体是否有效（不设错误）
form.isValid("email");     // 单字段是否有效
form.isTouched();          // 是否有任意字段被触碰
form.isDirty();            // 是否被修改（与初始值比较）
form.isDirty("email");     // 单字段是否被修改
form.isSubmitting;         // 是否正在提交
```

## @mantine/notifications 完整 API

### 安装与初始化

```bash
pnpm add @mantine/notifications
```

```tsx
import "@mantine/notifications/styles.css";
import { Notifications } from "@mantine/notifications";

<MantineProvider>
  <Notifications
    position="top-right"     // 位置：top-left / top-center / top-right / bottom-left / ...
    limit={5}                // 最多同时显示数（超出进入队列）
    autoClose={4000}         // 默认自动关闭毫秒
    zIndex={1000}
    containerWidth={400}
    pauseResetOnHover        // 鼠标悬停暂停 + 重置定时器
  />
  {children}
</MantineProvider>;
```

### notifications.show

```tsx
import { notifications } from "@mantine/notifications";

notifications.show({
  id: "save-success",        // 可选 ID（用于后续 hide/update）
  title: "保存成功",
  message: "你的修改已同步",
  color: "green",
  icon: <IconCheck size={18} />,
  autoClose: 3000,           // 单位 ms，false 不自动关闭
  withCloseButton: true,
  withBorder: false,
  position: "top-right",     // 覆盖容器位置
  loading: false,
  classNames: { /* CSS Modules 类名 */ },
  styles: { /* 内联样式 */ },
  onClose: (notif) => console.log("已关闭", notif),
});
```

### notifications.hide / clean / cleanQueue

```ts
notifications.hide("save-success");  // 按 ID 隐藏单条
notifications.clean();               // 清空所有
notifications.cleanQueue();          // 仅清空队列（不清空已显示的）
```

### notifications.update

异步任务进度跟踪经典模式：

```ts
const id = notifications.show({
  loading: true,
  title: "上传中",
  message: "请稍候",
  autoClose: false,
  withCloseButton: false,
});

// 异步任务完成后更新
setTimeout(() => {
  notifications.update({
    id,
    color: "green",
    title: "上传成功",
    message: "文件已保存",
    icon: <IconCheck size={18} />,
    loading: false,
    autoClose: 3000,
  });
}, 2000);
```

## @mantine/modals 三种模式

### 安装与初始化

```bash
pnpm add @mantine/modals
```

```tsx
import { ModalsProvider } from "@mantine/modals";

<MantineProvider>
  <ModalsProvider>
    {children}
  </ModalsProvider>
</MantineProvider>;
```

### 模式 1：modals.open - 自由内容

```tsx
import { modals } from "@mantine/modals";
import { Text, Button } from "@mantine/core";

const handleClick = () => {
  modals.open({
    title: "通用 Modal",
    centered: true,
    size: "md",
    children: (
      <>
        <Text size="sm">这是 Modal 内容。</Text>
        <Button mt="md" onClick={() => modals.closeAll()}>
          关闭
        </Button>
      </>
    ),
  });
};
```

### 模式 2：modals.openConfirmModal - 确认对话框

最常用——「确认删除？」「确认提交？」等场景：

```tsx
modals.openConfirmModal({
  title: "确认删除",
  centered: true,
  children: (
    <Text size="sm">这条记录将被永久删除，无法恢复。确定继续？</Text>
  ),
  labels: { confirm: "删除", cancel: "取消" },
  confirmProps: { color: "red" },
  onCancel: () => console.log("取消"),
  onConfirm: () => {
    // 异步删除
    deleteRecord(id);
  },
});
```

### 模式 3：modals.openContextModal - 注册式

预先注册可复用 Modal、各处用 `modals.openContextModal({ modal: 'xxx' })` 调用：

```tsx
// 1. 定义 Modal 组件
import { ContextModalProps } from "@mantine/modals";
import { Button, Stack, TextInput } from "@mantine/core";

function CreateUserModal({ context, id, innerProps }: ContextModalProps<{ userId: string }>) {
  return (
    <Stack>
      <TextInput label="姓名" />
      <Button onClick={() => context.closeModal(id)}>关闭</Button>
    </Stack>
  );
}

// 2. 在 ModalsProvider 注册
<ModalsProvider modals={{ createUser: CreateUserModal }}>
  {children}
</ModalsProvider>;

// 3. 全局调用
modals.openContextModal({
  modal: "createUser",
  title: "创建用户",
  innerProps: { userId: "123" },
});

// 4. TypeScript 类型扩展
declare module "@mantine/modals" {
  export interface MantineModalsOverride {
    modals: { createUser: typeof CreateUserModal };
  }
}
```

### 多层嵌套

`modals.open` 自动支持多层嵌套——一个 Modal 内打开另一个 Modal：

```ts
// 一键关闭所有
modals.closeAll();

// 关闭单个
modals.close(id);

// 修改已打开
modals.updateModal({ modalId: id, title: "新标题" });
```

## @mantine/spotlight 命令面板

### 安装与初始化

```bash
pnpm add @mantine/spotlight
```

```tsx
import "@mantine/spotlight/styles.css";
import { Spotlight, spotlight } from "@mantine/spotlight";
import { IconSearch, IconHome, IconUser } from "@tabler/icons-react";

const actions = [
  {
    id: "home",
    label: "首页",
    description: "回到首页",
    onClick: () => console.log("跳转首页"),
    leftSection: <IconHome size={18} />,
  },
  {
    id: "profile",
    label: "个人资料",
    description: "查看个人资料",
    onClick: () => console.log("跳转个人资料"),
    leftSection: <IconUser size={18} />,
  },
];

<MantineProvider>
  <Spotlight
    actions={actions}
    nothingFound="无匹配结果"
    highlightQuery
    searchProps={{
      leftSection: <IconSearch size={20} />,
      placeholder: "搜索...",
    }}
    shortcut={["mod + K", "mod + P"]}  // ⌘K / Ctrl+P 触发
    limit={7}
  />
  {children}
</MantineProvider>;
```

### 分组

```tsx
const actions = [
  {
    group: "页面",
    actions: [
      { id: "home", label: "首页", onClick: () => {} },
      { id: "about", label: "关于", onClick: () => {} },
    ],
  },
  {
    group: "操作",
    actions: [
      { id: "create", label: "创建", onClick: () => {} },
    ],
  },
];
```

### 触发方式

```ts
spotlight.open();
spotlight.close();
spotlight.toggle();
```

### 模糊搜索集成

```ts
import Fuse from "fuse.js";

const fuse = new Fuse(actions, { keys: ["label", "description"], threshold: 0.4 });

<Spotlight
  filter={(query, actions) => {
    if (!query) return actions;
    return fuse.search(query).map((result) => result.item);
  }}
/>;
```

## Combobox 深度

Mantine `Combobox` 是底层 Combobox 组件，用于自定义 Select / Autocomplete 等场景。已经有 8 个开箱即用的组件（Select / MultiSelect / Autocomplete / TagsInput / Pill / PillsInput / TreeSelect），通常**只在需要完全自定义时**才直接用 `Combobox`。

```tsx
import { Combobox, useCombobox, InputBase, Input } from "@mantine/core";
import { useState } from "react";

const data = ["苹果", "香蕉", "橘子", "西瓜"];

export function CustomSelect() {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });
  const [value, setValue] = useState<string | null>(null);

  return (
    <Combobox
      store={combobox}
      onOptionSubmit={(val) => {
        setValue(val);
        combobox.closeDropdown();
      }}
    >
      <Combobox.Target>
        <InputBase
          component="button"
          type="button"
          pointer
          rightSection={<Combobox.Chevron />}
          onClick={() => combobox.toggleDropdown()}
        >
          {value || <Input.Placeholder>选择</Input.Placeholder>}
        </InputBase>
      </Combobox.Target>
      <Combobox.Dropdown>
        <Combobox.Options>
          {data.map((item) => (
            <Combobox.Option value={item} key={item}>
              {item}
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
```

> **何时用 Combobox**：自定义触发器（按钮 / 标签等）、自定义 Options 渲染（含图片 / 卡片等）、自定义筛选 / 分组逻辑——超出 Select / MultiSelect 默认能力时。

## DataTable 方案选择

Mantine 的 `Table` 是基础语义化表格，**没有内置分页 / 排序 / 筛选 / 虚拟滚动**。生产场景通常用以下两个社区方案：

### 选项 1：mantine-datatable

[mantine-datatable](https://icflorescu.github.io/mantine-datatable/) - 流行的简单数据表格。

```bash
pnpm add mantine-datatable
```

```tsx
import { DataTable } from "mantine-datatable";

<DataTable
  withTableBorder
  borderRadius="sm"
  striped
  highlightOnHover
  records={data}
  columns={[
    { accessor: "name", title: "姓名" },
    { accessor: "age", title: "年龄", textAlign: "right" },
    { accessor: "email", title: "邮箱" },
  ]}
  totalRecords={data.length}
  recordsPerPage={10}
  page={page}
  onPageChange={setPage}
/>;
```

### 选项 2：mantine-react-table

[mantine-react-table](https://www.mantine-react-table.com/) - 基于 TanStack Table、功能最强大。

```bash
pnpm add mantine-react-table @tanstack/react-table
```

```tsx
import { MantineReactTable, useMantineReactTable } from "mantine-react-table";

const table = useMantineReactTable({
  columns: [
    { accessorKey: "name", header: "姓名" },
    { accessorKey: "age", header: "年龄" },
  ],
  data,
  enableSorting: true,
  enableColumnFilters: true,
  enablePagination: true,
  enableRowSelection: true,
});

<MantineReactTable table={table} />;
```

### 选择建议

| 场景 | 推荐 |
| ---- | ---- |
| 简单后台列表（分页 / 排序 / 选择） | `mantine-datatable` |
| 复杂表格（虚拟滚动 / 列固定 / 树形 / Grouping） | `mantine-react-table` |
| 极致性能 + 自定义 | TanStack Table + Mantine Table 手动整合 |
| 大数据量（10k+） | AG Grid Community + Mantine 主题适配 |

## @mantine/dates 完整方案

### 安装

```bash
pnpm add @mantine/dates dayjs
```

```tsx
import "@mantine/dates/styles.css";
import { DatesProvider } from "@mantine/dates";
import "dayjs/locale/zh-cn";

<MantineProvider>
  <DatesProvider settings={{ locale: "zh-cn", firstDayOfWeek: 1, weekendDays: [0, 6] }}>
    {children}
  </DatesProvider>
</MantineProvider>;
```

### 常用组件

```tsx
import {
  DateInput,
  DatePicker,
  DatePickerInput,
  DateTimePicker,
  MonthPicker,
  MonthPickerInput,
  YearPicker,
  YearPickerInput,
  TimePicker,
  Calendar,
} from "@mantine/dates";

{/* 单日期选择 - 输入框 */}
<DatePickerInput
  label="日期"
  placeholder="选择日期"
  valueFormat="YYYY-MM-DD"
/>

{/* 范围选择 */}
<DatePickerInput
  type="range"
  label="日期范围"
  placeholder="选择范围"
/>

{/* 多选 */}
<DatePickerInput
  type="multiple"
  label="多个日期"
/>

{/* 日期 + 时间 */}
<DateTimePicker label="日期时间" valueFormat="YYYY-MM-DD HH:mm" />

{/* 直接渲染日历（无输入框） */}
<DatePicker />
```

### 自定义可选日期

```tsx
<DatePickerInput
  label="选择工作日"
  excludeDate={(date) => {
    const day = dayjs(date).day();
    return day === 0 || day === 6;   // 排除周末
  }}
  minDate={new Date(2024, 0, 1)}
  maxDate={new Date(2026, 11, 31)}
/>
```

## @mantine/charts 完整方案

### 安装

```bash
pnpm add @mantine/charts recharts
```

```tsx
import "@mantine/charts/styles.css";
```

### 13 种图表

```tsx
import {
  BarChart,
  LineChart,
  AreaChart,
  PieChart,
  DonutChart,
  RadarChart,
  ScatterChart,
  BubbleChart,
  FunnelChart,
  RadialBarChart,
  CompositeChart,
  Sparkline,
  Heatmap,
} from "@mantine/charts";
```

### BarChart 示例

```tsx
const data = [
  { month: "Jan", smoothies: 1100, juices: 800 },
  { month: "Feb", smoothies: 1200, juices: 750 },
  { month: "Mar", smoothies: 1500, juices: 900 },
];

<BarChart
  h={300}
  data={data}
  dataKey="month"
  series={[
    { name: "smoothies", color: "blue.6", label: "果昔" },
    { name: "juices", color: "teal.6", label: "果汁" },
  ]}
  tickLine="y"
  withLegend
  withTooltip
/>;
```

### LineChart 示例

```tsx
<LineChart
  h={300}
  data={data}
  dataKey="month"
  series={[{ name: "sales", color: "blue.6", label: "销量" }]}
  curveType="monotone"
  connectNulls
  withDots
/>;
```

### PieChart / DonutChart

```tsx
const pieData = [
  { name: "苹果", value: 400, color: "red.6" },
  { name: "香蕉", value: 300, color: "yellow.6" },
  { name: "橘子", value: 200, color: "orange.6" },
];

<DonutChart data={pieData} withLabels withTooltip />;
```

## @mantine/tiptap 富文本

### 安装

```bash
pnpm add @mantine/tiptap @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-link
```

```tsx
import "@mantine/tiptap/styles.css";
import { RichTextEditor, Link } from "@mantine/tiptap";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

const editor = useEditor({
  extensions: [StarterKit, Link],
  content: "<p>初始内容</p>",
});

<RichTextEditor editor={editor}>
  <RichTextEditor.Toolbar sticky stickyOffset={60}>
    <RichTextEditor.ControlsGroup>
      <RichTextEditor.Bold />
      <RichTextEditor.Italic />
      <RichTextEditor.Underline />
      <RichTextEditor.Strikethrough />
    </RichTextEditor.ControlsGroup>
    <RichTextEditor.ControlsGroup>
      <RichTextEditor.H1 />
      <RichTextEditor.H2 />
      <RichTextEditor.H3 />
    </RichTextEditor.ControlsGroup>
    <RichTextEditor.ControlsGroup>
      <RichTextEditor.BulletList />
      <RichTextEditor.OrderedList />
      <RichTextEditor.Link />
    </RichTextEditor.ControlsGroup>
  </RichTextEditor.Toolbar>
  <RichTextEditor.Content />
</RichTextEditor>;
```

## Polymorphic Component（component prop）

Mantine 的杀器之一 —— **任何组件都能通过 `component` prop 改变底层渲染元素**。

```tsx
{/* 默认渲染为 button */}
<Button>点我</Button>

{/* 渲染为 a 标签（保留 Button 所有样式） */}
<Button component="a" href="/about" target="_blank">
  外部链接
</Button>

{/* 与 React Router 集成 */}
import { Link } from "react-router-dom";
<Button component={Link} to="/users">
  用户页
</Button>;

{/* 与 Next.js 集成 */}
import Link from "next/link";
<Button component={Link} href="/users">
  用户页
</Button>;
```

### TypeScript 泛型推导

`component` prop 决定其余 props 的类型 —— TypeScript 自动检查：

```tsx
{/* TS 错误：a 标签没有 type 属性 */}
<Button component="a" type="submit">

{/* TS 错误：button 标签没有 href 属性 */}
<Button component="button" href="/...">
```

### 在自定义组件中使用

```tsx
import { Box, type BoxProps } from "@mantine/core";

function MyCard(props: BoxProps & { component?: "div" | "section" | "article" }) {
  return <Box {...props} />;
}
```

## CSS Variables 深度

### Mantine 生成的 CSS Variables

v7+ Mantine 在根元素 (`:root` / `html`) 上自动生成所有 theme token 的 CSS 变量：

```css
/* 颜色：每色 10 个 shade */
--mantine-color-blue-0
--mantine-color-blue-1
...
--mantine-color-blue-9

/* 间距 */
--mantine-spacing-xs
--mantine-spacing-sm
--mantine-spacing-md
--mantine-spacing-lg
--mantine-spacing-xl

/* 圆角 */
--mantine-radius-xs
...
--mantine-radius-xl

/* 字号 */
--mantine-font-size-xs
...
--mantine-font-size-xl

/* 字体 */
--mantine-font-family
--mantine-font-family-monospace
--mantine-font-family-headings

/* 阴影 */
--mantine-shadow-xs
...
--mantine-shadow-xl

/* 标题 */
--mantine-h1-font-size
--mantine-h1-line-height
...
```

### 自定义 CSS / Tailwind 中引用

```css
/* MyComponent.module.css */
.card {
  background: var(--mantine-color-blue-0);
  padding: var(--mantine-spacing-md);
  border-radius: var(--mantine-radius-md);
  box-shadow: var(--mantine-shadow-sm);
  font-family: var(--mantine-font-family);
}
```

### 与 Tailwind 整合

Tailwind config 引用 Mantine 变量：

```ts
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: "var(--mantine-primary-color-filled)",
      },
      spacing: {
        "mantine-md": "var(--mantine-spacing-md)",
      },
    },
  },
};
```

## @mantine/hooks 高频 70+ Hooks 速览

按使用频率排序。详细 API 见 [参考](./reference.md) 与 [Mantine 官网](https://mantine.dev/hooks/use-disclosure/)。

### State 管理 Top 10

```tsx
import {
  useDisclosure,        // boolean 开关 [opened, { open, close, toggle }]
  useToggle,            // 多值循环切换 [value, toggle]
  useCounter,           // 数字计数 [count, { increment, decrement, set, reset }]
  useLocalStorage,      // 持久化到 localStorage
  useDebouncedValue,    // 防抖值
  useDebouncedCallback, // 防抖回调
  useUncontrolled,      // 受控/非受控双模式 hook
  useListState,         // 列表 CRUD
  usePagination,        // 分页逻辑
  useInputState,        // input 状态
} from "@mantine/hooks";

// useDisclosure 经典
const [opened, { open, close, toggle }] = useDisclosure(false);

// useDebouncedValue 经典
const [search, setSearch] = useState("");
const [debouncedSearch] = useDebouncedValue(search, 500);
useEffect(() => fetchData(debouncedSearch), [debouncedSearch]);

// useListState 列表 CRUD
const [tasks, handlers] = useListState([{ id: 1, name: "Task 1" }]);
handlers.append({ id: 2, name: "Task 2" });
handlers.remove(0);
handlers.setItemProp(0, "name", "Updated");
```

### UI 交互 Top 10

```tsx
import {
  useClickOutside,    // 点击外部
  useHotkeys,         // 快捷键
  useHover,           // hover 状态
  useFocusTrap,       // 焦点陷阱
  useScrollIntoView,  // 滚动到指定元素
  useElementSize,     // 元素尺寸
  useResizeObserver,  // 监听尺寸变化
  useViewportSize,    // 视口尺寸
  useMediaQuery,      // 媒体查询
  useFullscreen,      // 全屏
} from "@mantine/hooks";

// useClickOutside - 关闭弹出层经典
const ref = useClickOutside(() => setOpened(false));

// useHotkeys - 全局快捷键
useHotkeys([
  ["mod+K", () => spotlight.open()],
  ["mod+S", () => handleSave()],
  ["Escape", () => setOpened(false)],
]);

// useScrollIntoView
const { scrollIntoView, targetRef } = useScrollIntoView({ duration: 600 });
<Button onClick={() => scrollIntoView()}>滚动到目标</Button>
<div ref={targetRef}>目标元素</div>
```

### 实用工具 Top 10

```tsx
import {
  useClipboard,         // 剪贴板复制
  useDocumentTitle,     // 文档标题
  useDocumentVisibility,// 文档可见性
  useFavicon,           // favicon
  useIdle,              // 用户空闲检测
  useNetwork,           // 网络状态
  useOs,                // 操作系统
  useEyeDropper,        // 取色器
  useColorScheme,       // 系统色彩模式（注意：与 useMantineColorScheme 不同）
  useReducedMotion,     // 减少动画偏好
} from "@mantine/hooks";

// useClipboard
const clipboard = useClipboard({ timeout: 2000 });
<Button onClick={() => clipboard.copy("内容")}>
  {clipboard.copied ? "已复制" : "复制"}
</Button>;

// useIdle - 检测空闲
const idle = useIdle(60000);  // 60 秒空闲
useEffect(() => {
  if (idle) handleAutoLogout();
}, [idle]);
```

### Lifecycle 系列

```tsx
import {
  useDidUpdate,         // 跳过首次的 effect
  useIsFirstRender,     // 首次渲染检测
  useIsomorphicEffect,  // SSR 安全 useEffect
  useShallowEffect,     // 浅比较 effect
  useMounted,           // 挂载状态
} from "@mantine/hooks";

// useDidUpdate - search 改变时（但跳过首次）
useDidUpdate(() => {
  fetchData(search);
}, [search]);
```

## Next.js App Router 完整集成

### 完整 layout.tsx

```tsx
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/dates/styles.css";

import type { Metadata } from "next";
import {
  ColorSchemeScript,
  MantineProvider,
  mantineHtmlProps,
} from "@mantine/core";
import { Providers } from "./providers";
import { theme } from "./theme";

export const metadata: Metadata = {
  title: "My Mantine App",
  description: "Modern React App",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
      </head>
      <body>
        <Providers theme={theme}>{children}</Providers>
      </body>
    </html>
  );
}
```

### Providers Client Component

```tsx
// app/providers.tsx
"use client";

import { MantineProvider, type MantineThemeOverride } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { ModalsProvider } from "@mantine/modals";
import { DatesProvider } from "@mantine/dates";
import "dayjs/locale/zh-cn";

export function Providers({
  theme,
  children,
}: {
  theme: MantineThemeOverride;
  children: React.ReactNode;
}) {
  return (
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <DatesProvider settings={{ locale: "zh-cn", firstDayOfWeek: 1 }}>
        <ModalsProvider>
          <Notifications position="top-right" />
          {children}
        </ModalsProvider>
      </DatesProvider>
    </MantineProvider>
  );
}
```

### 在 Server Component 中使用 Mantine

部分纯展示组件可以在 RSC（Server Component）中使用：

```tsx
// app/page.tsx (RSC)
import { Container, Title, Text } from "@mantine/core";

export default function HomePage() {
  return (
    <Container size="md" py="xl">
      <Title>欢迎</Title>
      <Text c="dimmed">这是 Server Component</Text>
    </Container>
  );
}
```

**但是**——所有交互组件（Button onClick / 表单 / Modal 等）必须放在 Client Component（`"use client"`）中。

## 常见踩坑

### 踩坑 1：PostCSS 配置文件缺失或错误

**症状**：响应式 prop（<span v-pre>`w={{ sm: 200 }}`</span>）不生效、CSS 中 `$mantine-breakpoint-*` 编译报错。

**解决**：

1. 项目根目录必须有 `postcss.config.cjs`（注意 `.cjs` 后缀）
2. 安装 `postcss-preset-mantine` + `postcss-simple-vars`
3. 检查 mantine-breakpoint-* 变量定义完整（xs/sm/md/lg/xl 全部）

### 踩坑 2：忘了导入 styles.css

**症状**：组件没有样式。

**解决**：每个子包都要导入对应 styles.css：

```ts
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/charts/styles.css";
import "@mantine/tiptap/styles.css";
// ...
```

### 踩坑 3：CSS Modules 中 var(--mantine-*) 不生效

**症状**：CSS 变量名拼写正确但没有效果。

**解决**：检查是否在 `MantineProvider` 包裹的子树内。Mantine 的 CSS Variables 是注入到 `:root` / `[data-mantine-color-scheme]` 上的，**不在 Provider 内的页面（如静态 404 页）不会有变量**。

### 踩坑 4：SSR Hydration Warning

**症状**：Next.js 控制台「Hydration failed because the server rendered HTML didn't match」红字。

**解决**：

1. `<html>` 上 spread `{...mantineHtmlProps}`
2. `<head>` 中渲染 `<ColorSchemeScript defaultColorScheme="auto" />`
3. 用 `useComputedColorScheme("light", { getInitialValueInEffect: true })` 而非默认 hook

### 踩坑 5：Polymorphic component TypeScript 报错

**症状**：`<Button component={CustomLink} to="/...">` TS 报错 to 不存在。

**解决**：

```tsx
// 方法 1：用泛型显式标注
<Button<typeof CustomLink> component={CustomLink} to="/...">

// 方法 2：as 断言
<Button component={CustomLink as any} to="/...">

// 方法 3：用 Box 替代
<Box component={CustomLink} to="/..." className="some-button-class">
```

### 踩坑 6：Tailwind 与 Mantine 类名优先级冲突

**症状**：Tailwind class（如 `bg-blue-500`）被 Mantine 默认样式覆盖。

**解决**：

1. Tailwind 配置 `important: true`（或限定 `important: '#root'`）
2. 用 Mantine `classNames` prop 代替 Tailwind className
3. 用 Mantine `style` prop 内联（最高优先级）
4. 在 PostCSS 中调整 layer 顺序（Tailwind layer 后于 Mantine）

### 踩坑 7：Notifications / Modals 在 SSR 中报错

**症状**：Next.js dev 服务器报「window is not defined」或「Cannot read properties of undefined」。

**解决**：

1. 把 `Notifications` / `ModalsProvider` 放在 `"use client"` 的 Providers 组件中
2. 不要在 Server Component 中调用 `notifications.show()` / `modals.open()`

### 踩坑 8：暗色模式下自定义组件样式不变

**症状**：手动写的样式只适配浅色。

**解决**：在 CSS Modules 中加 `[data-mantine-color-scheme="dark"]` 选择器或用 `light-dark(...)` mixin：

```css
.card {
  background: light-dark(white, var(--mantine-color-dark-7));
  color: light-dark(black, white);
}
```

### 踩坑 9：useForm 类型推导失败

**症状**：`form.getInputProps('email')` 类型不准确。

**解决**：显式标注 useForm 泛型：

```tsx
interface FormValues {
  email: string;
  password: string;
}

const form = useForm<FormValues>({
  initialValues: { email: "", password: "" },
});
```

### 踩坑 10：dates 组件 locale 不生效

**症状**：日期选择器显示英文星期。

**解决**：

1. 安装 `dayjs` 并 `import 'dayjs/locale/zh-cn'`
2. 用 `DatesProvider` 包裹并设置 <span v-pre>`settings={{ locale: 'zh-cn' }}`</span>
3. Next.js App Router 中 dayjs locale 必须在 `"use client"` 组件中导入

### 踩坑 11：Checkbox / Switch / Radio getInputProps 不绑定

**症状**：表单中复选框点击没反应。

**解决**：加 `{ type: 'checkbox' }` 参数：

```tsx
<Checkbox {...form.getInputProps("agree", { type: "checkbox" })} />
<Switch {...form.getInputProps("enabled", { type: "checkbox" })} />
```

### 踩坑 12：bundle 体积过大

**症状**：生产构建后 chunk 文件 1MB+。

**解决**：

1. **只安装实际用到的子包**（不是装全家桶）
2. 用 `import { Button } from '@mantine/core'` 命名导入（已经支持 Tree Shaking）
3. 图标库用 `@tabler/icons-react` 而非 `react-icons`（前者 Tree Shaking 更好）
4. 检查是否引入了 `@mantine/dates` 的所有 locale（只 import 需要的）

## 下一步

- [参考](./reference.md)：130+ 组件清单、70+ hooks 清单、createTheme 完整选项、Styles API 详解、TypeScript 类型
- [Mantine 官网](https://mantine.dev/)：实时 Demo + CodeSandbox 在线编辑
- [Mantine UI](https://ui.mantine.dev)：123 个免费业务级组件（导航 / 营销页 / 博客等）
- [Mantine Help](https://help.mantine.dev/)：常见问题 FAQ
