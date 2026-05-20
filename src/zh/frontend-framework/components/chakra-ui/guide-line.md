---
layout: doc
outline: [2, 3]
---

# Chakra UI 指南

> 适用范围：**Chakra UI v3.x**（2026 年 5 月最新 **v3.35.0**），React 18 / 19 + TypeScript 5+。

## 100+ 组件全景

Chakra UI v3 的 `@chakra-ui/react` 提供 **100+ 组件** 分为 9 大类别（Layout / Typography / Forms / Data Display / Feedback / Disclosure / Overlay / Navigation / Media）。下表是按类别速览，详细 API 见 [参考](./reference.md) 与 [Chakra UI 官网](https://chakra-ui.com/docs/components/concepts/overview)。

### Layout（布局）

布局是 Chakra UI 的强项 —— **15+ 个组件** 覆盖从 Flex 弹性盒到 Grid 网格的所有场景。

| 组件 | 用途 | 关键 props |
| ---- | ---- | ---------- |
| `Box` | 通用容器（Style Props 入口） | 所有 style props |
| `Flex` | 弹性盒（CSS Flexbox 直出） | `direction`, `gap`, `wrap`, `align`, `justify` |
| `Grid` | CSS Grid 网格 | `templateColumns`, `gap`, `templateRows`, `templateAreas` |
| `Stack` | 通用排列容器 | `direction`, `gap`, `align`, `justify` |
| `HStack` / `VStack` | 横向 / 纵向 Stack 简写 | `gap`, `align`, `justify`, `wrap` |
| `Container` | 限宽容器 | `maxW`, `centerContent` |
| `Center` | 居中容器 | `inline` |
| `AbsoluteCenter` | 绝对定位居中 | `axis` (both/horizontal/vertical) |
| `AspectRatio` | 固定宽高比 | `ratio` |
| `Bleed` | 超出父容器的负边距 | `inline`, `block` |
| `Float` | 浮动定位（左上 / 右下等） | `placement` |
| `Group` | 紧密分组（按钮组等） | `attached`, `orientation` |
| `ScrollArea` | 自定义滚动条容器 | `scrollbar` |
| `Separator` | 分割线（替代 v2 Divider） | `orientation`, `variant`, `size` |
| `SimpleGrid` | 响应式简单网格 | `columns`, `gap`, `minChildWidth` |
| `Splitter` | 可拖拽分割面板 | `defaultSize`, `onSizeChange` |
| `Wrap` | 自动换行的横向布局 | `gap`, `align`, `justify` |
| `Spacer` | Flex 中的弹性填充 | （无 props） |

`Stack` / `HStack` / `VStack` 经典用法：

```tsx
import { Stack, HStack, VStack, Button } from "@chakra-ui/react";

{/* 纵向排列、间距 4 */}
<Stack gap="4">
  <Button>按钮 1</Button>
  <Button>按钮 2</Button>
</Stack>

{/* 横向排列、间距 3、垂直居中 */}
<HStack gap="3" align="center">
  <Button>主按钮</Button>
  <Button variant="outline">次按钮</Button>
</HStack>

{/* 显式 Stack.Separator 分隔器（v3 替代 v2 divider prop） */}
<Stack gap="4" separator={<Stack.Separator />}>
  <Box>第一行</Box>
  <Box>第二行</Box>
  <Box>第三行</Box>
</Stack>
```

`Grid` 12 栅格示例：

```tsx
import { Grid, GridItem } from "@chakra-ui/react";

<Grid templateColumns="repeat(12, 1fr)" gap="4">
  <GridItem colSpan={{ base: 12, md: 8 }} bg="blue.100" p="4">
    主内容
  </GridItem>
  <GridItem colSpan={{ base: 12, md: 4 }} bg="gray.100" p="4">
    侧边栏
  </GridItem>
</Grid>;
```

### Typography（排版）

| 组件 | 用途 |
| ---- | ---- |
| `Heading` | h1-h6 标题 |
| `Text` | 段落 / 通用文本 |
| `Blockquote` | 引用块 |
| `Code` | 行内代码 |
| `CodeBlock` | 代码块（含语法高亮） |
| `Em` | 强调文本（斜体） |
| `Highlight` | 高亮关键词 |
| `Kbd` | 键盘按键样式 |
| `Link` | 链接（语义化 a 标签） |
| `LinkOverlay` | 整个区域可点击的链接遮罩 |
| `List` | 有序 / 无序列表 |
| `Mark` | 标记文本 |
| `Prose` | prose 容器（应用排版样式） |
| `RichTextEditor` | 富文本编辑器 |

```tsx
<Heading size="3xl">超大标题</Heading>
<Heading as="h2" size="lg" color="gray.700">二级标题</Heading>

<Text fontSize="md" color="gray.600">正常文本</Text>
<Text fontSize="sm" color="red.500" fontWeight="medium">红色小字</Text>

{/* 限行 - v3 用 lineClamp 替代 v2 noOfLines */}
<Text lineClamp={2}>
  超长的文本会被截断、只显示两行...
</Text>

{/* Highlight 关键词高亮 */}
<Highlight query={["Chakra", "React"]} styles={{ bg: "yellow.200", px: "1" }}>
  Chakra UI 是 React 现代 UI 库
</Highlight>

<HStack gap="2">
  按 <Kbd>Cmd</Kbd> + <Kbd>K</Kbd> 打开搜索
</HStack>
```

### Forms（表单）

**v3 重大变更**：`FormControl` → `Field`，`Select` → `NativeSelect`，所有 boolean props 改名（`isRequired` → `required`）。

| 组件 | 用途 |
| ---- | ---- |
| `Field` | 字段包装（替代 v2 FormControl） |
| `Fieldset` | 字段组（radio / checkbox 等多选场景） |
| `Input` | 单行文本输入 |
| `Textarea` | 多行文本输入 |
| `NumberInput` | 数字输入（步进 / 范围） |
| `PasswordInput` | 密码输入（含可见性切换） |
| `PinInput` | 数字 PIN 验证码输入 |
| `Checkbox` | 单选框 |
| `CheckboxCard` | 卡片样式复选框 |
| `Radio` | 单选按钮组 |
| `RadioCard` | 卡片样式单选 |
| `Switch` | 开关 |
| `Slider` | 滑块（含 RangeSlider 区间） |
| `Select` | 自定义下拉（基于 Ark UI） |
| `NativeSelect` | 原生 select（更轻量） |
| `Combobox` | 自动补全 + 多选下拉 |
| `TagsInput` | 标签输入 |
| `Editable` | 行内可编辑文本 |
| `ColorPicker` | 颜色选择器 |
| `ColorSwatch` | 颜色色块 |
| `FileUpload` | 文件上传 |
| `SegmentedControl` | 分段控件 |

`Field` 完整结构：

```tsx
import { Field, Input } from "@chakra-ui/react";

<Field.Root invalid={!!error} required>
  <Field.Label>
    邮箱
    <Field.RequiredIndicator />     {/* 自动渲染红色 * */}
  </Field.Label>
  <Input type="email" placeholder="your@email.com" />
  <Field.HelperText>用于接收登录通知</Field.HelperText>
  <Field.ErrorText>{error}</Field.ErrorText>
</Field.Root>;
```

`Field.Root` props：

- `invalid` - boolean，错误态（控制 `Field.ErrorText` 显示）
- `required` - boolean
- `disabled` - boolean
- `readOnly` - boolean
- `orientation` - "vertical" | "horizontal"
- `colorPalette` - 主题色板

`Input` 完整 props 演示：

```tsx
<Input
  variant="outline"      {/* outline (默认) / subtle / flushed */}
  size="md"              {/* 2xs / xs / sm / md (默认) / lg / xl / 2xl */}
  colorPalette="blue"
  placeholder="占位文字"
  disabled
/>

{/* InputGroup + Addon - 前缀 / 后缀 */}
<InputGroup>
  <InputAddon>https://</InputAddon>
  <Input placeholder="example" />
  <InputAddon>.com</InputAddon>
</InputGroup>

{/* InputLeftElement / InputRightElement - 图标等 */}
<InputGroup>
  <InputLeftElement>
    <Icon as={LuSearch} />
  </InputLeftElement>
  <Input placeholder="搜索" />
</InputGroup>
```

`NumberInput` 步进数字：

```tsx
import { NumberInput } from "@chakra-ui/react";

<NumberInput.Root defaultValue="0" min={0} max={100} step={5}>
  <NumberInput.Control>
    <NumberInput.IncrementTrigger />
    <NumberInput.DecrementTrigger />
  </NumberInput.Control>
  <NumberInput.Input />
</NumberInput.Root>;
```

`Switch` + `Field`：

```tsx
import { Switch, Field } from "@chakra-ui/react";

<Field.Root>
  <Field.Label>
    <Switch.Root>
      <Switch.HiddenInput />
      <Switch.Control>
        <Switch.Thumb />
      </Switch.Control>
      <Switch.Label>启用通知</Switch.Label>
    </Switch.Root>
  </Field.Label>
</Field.Root>;
```

### Data Display（数据展示）

| 组件 | 用途 |
| ---- | ---- |
| `Avatar` | 头像（含 Avatar.Image / Avatar.Fallback / Avatar.Badge） |
| `Badge` | 徽章 |
| `Card` | 卡片（Card.Root / Header / Body / Footer） |
| `Clipboard` | 剪贴板复制按钮 |
| `Image` | 图片 |
| `DataList` | 数据列表（label + value 键值对） |
| `Icon` | 图标容器（`<Icon as={LuPlus} />`） |
| `Marquee` | 跑马灯 |
| `QRCode` | 二维码 |
| `Stat` | 统计数字（含趋势箭头） |
| `Table` | 表格（基础语义化） |
| `Tag` | 标签 |
| `Timeline` | 时间线 |

`Card` 完整结构（v3 Compound）：

```tsx
import { Card, Button, Heading, Text } from "@chakra-ui/react";

<Card.Root maxW="md">
  <Card.Header>
    <Heading size="md">卡片标题</Heading>
  </Card.Header>
  <Card.Body>
    <Text>卡片描述文字</Text>
  </Card.Body>
  <Card.Footer>
    <Button colorPalette="blue">操作按钮</Button>
  </Card.Footer>
</Card.Root>;
```

`Avatar` Compound 模式：

```tsx
import { Avatar } from "@chakra-ui/react";

<Avatar.Root colorPalette="blue" size="md">
  <Avatar.Fallback name="John Smith" />
  <Avatar.Image src="https://example.com/avatar.jpg" />
</Avatar.Root>;

{/* Avatar.Fallback 自动取首字母作为 fallback */}
<Avatar.Root>
  <Avatar.Fallback name="张三" />       {/* 显示 "张" */}
</Avatar.Root>;
```

`Table` 表格：

```tsx
import { Table } from "@chakra-ui/react";

<Table.Root variant="line">
  <Table.Header>
    <Table.Row>
      <Table.ColumnHeader>姓名</Table.ColumnHeader>
      <Table.ColumnHeader>年龄</Table.ColumnHeader>
      <Table.ColumnHeader>城市</Table.ColumnHeader>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    <Table.Row>
      <Table.Cell>张三</Table.Cell>
      <Table.Cell>28</Table.Cell>
      <Table.Cell>上海</Table.Cell>
    </Table.Row>
  </Table.Body>
</Table.Root>;
```

`Stat` 统计数字（含趋势）：

```tsx
<Stat.Root>
  <Stat.Label>总销售额</Stat.Label>
  <Stat.ValueText>¥ 128,450</Stat.ValueText>
  <Stat.HelpText>
    <Stat.UpIndicator />
    23.36%
  </Stat.HelpText>
</Stat.Root>
```

### Feedback（反馈）

| 组件 | 用途 |
| ---- | ---- |
| `Alert` | 警告 / 信息提示框 |
| `EmptyState` | 空状态 |
| `Progress` | 进度条 |
| `ProgressCircle` | 环形进度 (v3 替代 v2 CircularProgress) |
| `Skeleton` | 骨架屏 |
| `Spinner` | 加载指示器 |
| `Status` | 状态指示器（小圆点） |
| `Toast` / `Toaster` | Toast 通知系统 |

`Alert` Compound：

```tsx
import { Alert, Icon } from "@chakra-ui/react";
import { LuInfo } from "react-icons/lu";

<Alert.Root status="info">
  <Alert.Indicator>
    <Icon as={LuInfo} />
  </Alert.Indicator>
  <Alert.Title>提示</Alert.Title>
  <Alert.Description>请确认你的操作。</Alert.Description>
</Alert.Root>;

{/* status: info / success / warning / error / neutral */}
```

`Progress` 进度条：

```tsx
<Progress.Root value={75} size="md" colorPalette="blue">
  <Progress.Track>
    <Progress.Range />
  </Progress.Track>
  <Progress.ValueText>75%</Progress.ValueText>
</Progress.Root>

{/* ProgressCircle 环形 */}
<ProgressCircle.Root value={75} size="md" colorPalette="green">
  <ProgressCircle.Circle>
    <ProgressCircle.Track />
    <ProgressCircle.Range />
  </ProgressCircle.Circle>
  <ProgressCircle.ValueText />
</ProgressCircle.Root>
```

`Skeleton` 骨架屏：

```tsx
import { Skeleton, SkeletonText, SkeletonCircle, Stack } from "@chakra-ui/react";

<Stack gap="4">
  <Skeleton height="20px" />
  <Skeleton height="20px" width="80%" />
  <SkeletonCircle size="12" />
  <SkeletonText noOfLines={4} gap="2" />
</Stack>;
```

`Spinner` 加载：

```tsx
<Spinner size="md" colorPalette="blue" borderWidth="4px" speed="0.7s" />
```

### Disclosure（折叠 / 切换）

| 组件 | 用途 |
| ---- | ---- |
| `Accordion` | 手风琴折叠 |
| `Breadcrumb` | 面包屑 |
| `Carousel` | 轮播 |
| `Collapsible` | 折叠展开 |
| `Pagination` | 分页 |
| `Steps` | 步骤条 |
| `Tabs` | 选项卡 |

`Tabs` Compound：

```tsx
import { Tabs } from "@chakra-ui/react";

<Tabs.Root defaultValue="tab1" colorPalette="blue">
  <Tabs.List>
    <Tabs.Trigger value="tab1">概览</Tabs.Trigger>
    <Tabs.Trigger value="tab2">设置</Tabs.Trigger>
    <Tabs.Trigger value="tab3">日志</Tabs.Trigger>
    <Tabs.Indicator />
  </Tabs.List>
  <Tabs.Content value="tab1">概览内容</Tabs.Content>
  <Tabs.Content value="tab2">设置内容</Tabs.Content>
  <Tabs.Content value="tab3">日志内容</Tabs.Content>
</Tabs.Root>;
```

`Accordion`：

```tsx
import { Accordion } from "@chakra-ui/react";

<Accordion.Root collapsible defaultValue={["item-1"]}>
  <Accordion.Item value="item-1">
    <Accordion.ItemTrigger>
      第一项
      <Accordion.ItemIndicator />
    </Accordion.ItemTrigger>
    <Accordion.ItemContent>
      <Accordion.ItemBody>第一项内容</Accordion.ItemBody>
    </Accordion.ItemContent>
  </Accordion.Item>
  <Accordion.Item value="item-2">
    <Accordion.ItemTrigger>
      第二项
      <Accordion.ItemIndicator />
    </Accordion.ItemTrigger>
    <Accordion.ItemContent>
      <Accordion.ItemBody>第二项内容</Accordion.ItemBody>
    </Accordion.ItemContent>
  </Accordion.Item>
</Accordion.Root>;
```

`Steps` 步骤条：

```tsx
import { Steps, Button, ButtonGroup } from "@chakra-ui/react";

<Steps.Root defaultStep={0} count={3}>
  <Steps.List>
    <Steps.Item index={0}>
      <Steps.Indicator />
      <Steps.Title>填写信息</Steps.Title>
      <Steps.Separator />
    </Steps.Item>
    <Steps.Item index={1}>
      <Steps.Indicator />
      <Steps.Title>核对信息</Steps.Title>
      <Steps.Separator />
    </Steps.Item>
    <Steps.Item index={2}>
      <Steps.Indicator />
      <Steps.Title>完成</Steps.Title>
    </Steps.Item>
  </Steps.List>

  <Steps.Content index={0}>第一步内容</Steps.Content>
  <Steps.Content index={1}>第二步内容</Steps.Content>
  <Steps.Content index={2}>第三步内容</Steps.Content>
  <Steps.CompletedContent>所有步骤完成</Steps.CompletedContent>

  <ButtonGroup>
    <Steps.PrevTrigger asChild>
      <Button variant="outline">上一步</Button>
    </Steps.PrevTrigger>
    <Steps.NextTrigger asChild>
      <Button>下一步</Button>
    </Steps.NextTrigger>
  </ButtonGroup>
</Steps.Root>;
```

`Pagination` 分页：

```tsx
import { Pagination, IconButton } from "@chakra-ui/react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

<Pagination.Root count={100} pageSize={10} defaultPage={1}>
  <ButtonGroup variant="ghost" size="sm">
    <Pagination.PrevTrigger asChild>
      <IconButton><LuChevronLeft /></IconButton>
    </Pagination.PrevTrigger>
    <Pagination.Items
      render={(page) => (
        <IconButton variant={{ base: "ghost", _selected: "solid" }}>
          {page.value}
        </IconButton>
      )}
    />
    <Pagination.NextTrigger asChild>
      <IconButton><LuChevronRight /></IconButton>
    </Pagination.NextTrigger>
  </ButtonGroup>
</Pagination.Root>;
```

### Overlay（覆盖层）

| 组件 | 用途 |
| ---- | ---- |
| `ActionBar` | 动作栏（底部固定操作条） |
| `Dialog` | 模态对话框 (v3 替代 v2 Modal) |
| `Drawer` | 抽屉 |
| `HoverCard` | 悬停卡片 |
| `Menu` | 菜单 |
| `OverlayManager` | 遮罩管理 |
| `Popover` | 弹出框 |
| `ToggleTip` | 点击式 Tooltip |
| `Tooltip` | 工具提示 |

`Dialog`（v3 取代 v2 `Modal`）完整结构：

```tsx
import {
  Dialog,
  Button,
  Portal,
  Text,
  HStack,
} from "@chakra-ui/react";
import { useState } from "react";

export function DialogDemo() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => setOpen(e.open)}
      placement="center"
    >
      <Dialog.Trigger asChild>
        <Button colorPalette="blue">打开 Dialog</Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>确认操作</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Text>
                这是 Dialog 的内容。点击 ESC、点击遮罩、点击 X 都可以关闭。
              </Text>
            </Dialog.Body>
            <Dialog.Footer>
              <HStack gap="3" justify="flex-end" width="full">
                <Dialog.ActionTrigger asChild>
                  <Button variant="outline">取消</Button>
                </Dialog.ActionTrigger>
                <Button colorPalette="blue">确定</Button>
              </HStack>
            </Dialog.Footer>
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
```

`Dialog.Root` 关键 props：

- `open` / `onOpenChange` - 受控
- `defaultOpen` - 非受控初始值
- `placement` - "center" | "top" | "bottom"
- `size` - "xs" | "sm" | "md" | "lg" | "xl" | "cover" | "full"
- `motionPreset` - 动画类型
- `scrollBehavior` - "inside" | "outside"
- `closeOnEscape` - 默认 true
- `closeOnInteractOutside` - 默认 true
- `trapFocus` - 默认 true
- `preventScroll` - 默认 true
- `initialFocusEl` / `finalFocusEl` - 焦点管理
- `role` - "dialog" | "alertdialog"（替代 v2 AlertDialog）

`Drawer` 抽屉（与 Dialog API 类似）：

```tsx
<Drawer.Root placement="end" size="md">    {/* end / start / top / bottom */}
  <Drawer.Trigger asChild>
    <Button>打开抽屉</Button>
  </Drawer.Trigger>
  <Portal>
    <Drawer.Backdrop />
    <Drawer.Positioner>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>抽屉标题</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body>抽屉内容</Drawer.Body>
        <Drawer.Footer>
          <Drawer.ActionTrigger asChild>
            <Button variant="outline">关闭</Button>
          </Drawer.ActionTrigger>
        </Drawer.Footer>
        <Drawer.CloseTrigger />
      </Drawer.Content>
    </Drawer.Positioner>
  </Portal>
</Drawer.Root>
```

`Menu` 菜单：

```tsx
import { Menu, Button, Portal, Icon } from "@chakra-ui/react";
import { LuChevronDown, LuPencil, LuTrash } from "react-icons/lu";

<Menu.Root>
  <Menu.Trigger asChild>
    <Button variant="outline">
      操作 <Icon as={LuChevronDown} />
    </Button>
  </Menu.Trigger>
  <Portal>
    <Menu.Positioner>
      <Menu.Content>
        <Menu.ItemGroup>
          <Menu.ItemGroupLabel>编辑</Menu.ItemGroupLabel>
          <Menu.Item value="edit">
            <Icon as={LuPencil} /> 编辑
          </Menu.Item>
          <Menu.Item value="duplicate">复制</Menu.Item>
        </Menu.ItemGroup>
        <Menu.Separator />
        <Menu.Item value="delete" color="red.500">
          <Icon as={LuTrash} /> 删除
        </Menu.Item>
      </Menu.Content>
    </Menu.Positioner>
  </Portal>
</Menu.Root>;
```

`Popover` 弹出框：

```tsx
<Popover.Root>
  <Popover.Trigger asChild>
    <Button>显示</Button>
  </Popover.Trigger>
  <Portal>
    <Popover.Positioner>
      <Popover.Content>
        <Popover.Arrow />
        <Popover.Header>
          <Popover.Title>提示</Popover.Title>
        </Popover.Header>
        <Popover.Body>这是 Popover 的内容</Popover.Body>
        <Popover.CloseTrigger />
      </Popover.Content>
    </Popover.Positioner>
  </Portal>
</Popover.Root>
```

`Tooltip`（v3 是 snippet）：

```tsx
import { Tooltip } from "@/components/ui/tooltip";

<Tooltip content="这是一个 tooltip">
  <Button>悬停我</Button>
</Tooltip>;

{/* showArrow / openDelay / closeDelay 等 props */}
```

### Buttons（按钮）

| 组件 | 用途 |
| ---- | ---- |
| `Button` | 标准按钮 |
| `CloseButton` | 关闭按钮 (×) |
| `IconButton` | 图标按钮（圆 / 方） |
| `DownloadTrigger` | 下载触发器 |

`Button` 完整 props 演示：

```tsx
<Button
  variant="solid"        {/* solid (默认) / subtle / surface / outline / ghost / plain */}
  size="md"              {/* 2xs / xs / sm / md (默认) / lg / xl / 2xl */}
  colorPalette="blue"    {/* gray (默认) / red / orange / yellow / green / teal / blue / cyan / purple / pink */}
  loading={isSubmitting}
  loadingText="提交中"
  spinnerPlacement="start"      {/* start / end */}
  disabled
  onClick={handleClick}
>
  提交
</Button>

{/* asChild - 渲染为 a 标签 */}
<Button asChild colorPalette="blue">
  <a href="/about">链接按钮</a>
</Button>

{/* IconButton */}
<IconButton aria-label="搜索" variant="ghost">
  <Icon as={LuSearch} />
</IconButton>

{/* ButtonGroup */}
<ButtonGroup variant="outline" attached>
  <Button>保存</Button>
  <Button>取消</Button>
</ButtonGroup>
```

### Media（媒体）

| 组件 | 用途 |
| ---- | ---- |
| `Image` | 图片 |
| `AspectRatio` | 固定宽高比 |
| `Icon` | 图标容器 |

```tsx
{/* Image - v3 移除了 v2 的 fit / align / fallbackSrc props */}
<Image
  src="https://example.com/image.jpg"
  alt="封面"
  borderRadius="md"
  objectFit="cover"     {/* 替代 v2 fit */}
  objectPosition="center"   {/* 替代 v2 align */}
  onError={(e) => {
    e.currentTarget.src = "/fallback.png";  // v3 用原生 onError 替代 fallbackSrc
  }}
/>

{/* 固定宽高比 */}
<AspectRatio ratio={16 / 9} maxW="600px">
  <iframe src="https://www.youtube.com/embed/..." allowFullScreen />
</AspectRatio>

{/* Icon - 包裹 react-icons */}
<Icon as={LuSearch} boxSize="6" color="blue.500" />
```

### Navigation（导航）

| 组件 | 用途 |
| ---- | ---- |
| `Breadcrumb` | 面包屑（已在 Disclosure 分类） |
| `Pagination` | 分页（已在 Disclosure 分类） |
| `Steps` | 步骤条（已在 Disclosure 分类） |
| `Tabs` | 选项卡（已在 Disclosure 分类） |
| `Link` | 链接 |

`Breadcrumb` 面包屑：

```tsx
<Breadcrumb.Root>
  <Breadcrumb.List>
    <Breadcrumb.Item>
      <Breadcrumb.Link href="/">首页</Breadcrumb.Link>
    </Breadcrumb.Item>
    <Breadcrumb.Separator />
    <Breadcrumb.Item>
      <Breadcrumb.Link href="/products">产品</Breadcrumb.Link>
    </Breadcrumb.Item>
    <Breadcrumb.Separator />
    <Breadcrumb.Item>
      <Breadcrumb.CurrentLink>详情</Breadcrumb.CurrentLink>
    </Breadcrumb.Item>
  </Breadcrumb.List>
</Breadcrumb.Root>
```

## Style Props 完整 API

Chakra UI v3 的杀器 —— **200+ Style Props 直接写在组件上**，相当于内置了 Tailwind utility 哲学的 React props 化。

### 完整 Style Props 分类

```tsx
<Box
  // 外边距 (Margin)
  m="4" mt="2" mb="4" ml="auto" mr={3} mx="4" my="6"
  marginInline="4" marginBlock="2"

  // 内边距 (Padding)
  p="4" pt="2" pb="4" pl="2" pr="3" px="4" py="6"
  paddingInline="4" paddingBlock="2"

  // 尺寸 (Width / Height)
  w="full" h="100vh" minW="200px" maxW="md" minH="400px" maxH="80vh"
  boxSize="10"           // = w + h

  // 颜色 (Color)
  color="gray.800"
  bg="blue.500"
  backgroundColor="white"
  borderColor="gray.200"
  colorPalette="red"     // 整组色板

  // 字体 (Typography)
  fontSize="lg"
  fontWeight="bold"
  fontFamily="heading"
  lineHeight="tall"
  letterSpacing="wide"
  textAlign="center"
  textTransform="uppercase"
  textDecoration="underline"
  fontStyle="italic"
  whiteSpace="nowrap"
  textOverflow="ellipsis"
  lineClamp={2}         // 多行截断 (v3 替代 v2 noOfLines)
  truncate              // 单行截断 (v3 替代 v2 truncated)

  // 边框 (Border)
  border="1px solid"
  borderColor="gray.200"
  borderRadius="md"
  borderWidth="1px"
  borderTop="1px solid"
  borderBottomWidth="2px"
  borderLeftStyle="dashed"

  // 阴影 (Shadow)
  boxShadow="lg"
  textShadow="md"

  // 布局 (Layout)
  display="flex"
  flexDirection="column"
  flexWrap="wrap"
  flex="1"
  flexBasis="200px"
  flexGrow={1}
  flexShrink={0}
  gap="4"
  rowGap="2"
  columnGap="4"
  alignItems="center"
  justifyContent="space-between"
  alignSelf="flex-end"
  justifySelf="end"
  order={1}

  // Grid
  gridTemplateColumns="repeat(12, 1fr)"
  gridTemplateRows="auto"
  gridColumn="span 2"
  gridRow="1 / 3"
  gridGap="4"
  gridArea="header"

  // 位置 (Position)
  pos="absolute"        // 简写
  position="relative"
  top="0" left="0" right="0" bottom="0"
  zIndex="modal"

  // 透明度 / 可见性
  opacity={0.8}
  visibility="visible"
  overflow="hidden"
  overflowX="scroll"
  overflowY="auto"

  // 变换 (Transform)
  transform="rotate(45deg)"
  transformOrigin="center"
  rotate="45deg"        // 简写
  scale="1.2"
  translateX="10px"
  translateY="20px"

  // 过渡 / 动画
  transition="all 0.3s ease"
  animation="spin 1s linear infinite"
  cursor="pointer"

  // 可见性辅助
  hideFrom="md"          // 替代 v2 <Hide above="md">
  hideBelow="lg"         // 替代 v2 <Hide below="lg">
>
  内容
</Box>
```

### Theme Token 引用

```tsx
{/* Spacing scale 0-96 (theme.spacing.*) */}
<Box mt="0" />        {/* 0 */}
<Box mt="0.5" />      {/* 0.125rem = 2px */}
<Box mt="1" />        {/* 0.25rem = 4px */}
<Box mt="2" />        {/* 0.5rem = 8px */}
<Box mt="4" />        {/* 1rem = 16px */}
<Box mt="8" />        {/* 2rem = 32px */}
<Box mt="16" />       {/* 4rem = 64px */}

{/* Size scale - 同 spacing + xs/sm/md/lg/xl 别名 */}
<Box maxW="xs" />     {/* 20rem = 320px */}
<Box maxW="sm" />     {/* 24rem = 384px */}
<Box maxW="md" />     {/* 28rem = 448px */}
<Box maxW="lg" />     {/* 32rem = 512px */}
<Box maxW="xl" />     {/* 36rem = 576px */}
<Box maxW="2xl" />    {/* 42rem = 672px */}

{/* Color scale - 14 色 × 11 shade (50-950) */}
<Box color="blue.500" />
<Box bg="gray.100" />
<Box borderColor="red.200" />

{/* Font Size scale */}
<Text fontSize="xs" />   {/* 0.75rem */}
<Text fontSize="sm" />   {/* 0.875rem */}
<Text fontSize="md" />   {/* 1rem */}
<Text fontSize="lg" />   {/* 1.125rem */}
<Text fontSize="xl" />   {/* 1.25rem */}
<Text fontSize="2xl" />  {/* 1.5rem */}
<Text fontSize="3xl" />  {/* 1.875rem */}

{/* BorderRadius */}
<Box borderRadius="none" />   {/* 0 */}
<Box borderRadius="sm" />     {/* 0.125rem */}
<Box borderRadius="md" />     {/* 0.375rem */}
<Box borderRadius="lg" />     {/* 0.5rem */}
<Box borderRadius="xl" />     {/* 0.75rem */}
<Box borderRadius="full" />   {/* 9999px */}

{/* Shadow */}
<Box boxShadow="xs" />
<Box boxShadow="sm" />
<Box boxShadow="md" />
<Box boxShadow="lg" />
<Box boxShadow="xl" />
<Box boxShadow="2xl" />
```

## Conditional Style Props

Chakra UI 的杀器之二 —— **30+ 状态条件 + 6 个断点 + 暗色模式** 全部用对象语法表达。

### 状态条件（30+）

| 条件 | 说明 |
| ---- | ---- |
| `_hover` | hover 状态 |
| `_active` | active 状态 |
| `_focus` | focus 状态 |
| `_focusWithin` | focus-within 状态（子元素聚焦） |
| `_focusVisible` | focus-visible 状态（键盘聚焦） |
| `_disabled` | disabled 状态 |
| `_checked` | checked 状态（Checkbox / Radio） |
| `_visited` | 已访问链接 |
| `_selected` | 选中状态（Tabs / Steps） |
| `_expanded` | 展开状态（Accordion） |
| `_required` | 必填状态 |
| `_invalid` | 错误状态 |
| `_valid` | 验证通过 |
| `_readOnly` | 只读 |
| `_empty` | 空状态 |
| `_first` | :first-child |
| `_last` | :last-child |
| `_odd` | :nth-child(odd) |
| `_even` | :nth-child(even) |
| `_indeterminate` | indeterminate 状态 |
| `_currentPage` | 当前页（NavLink） |
| `_currentStep` | 当前步骤（Steps） |

### Pseudo Elements

| 条件 | 说明 |
| ---- | ---- |
| `_before` | ::before |
| `_after` | ::after |
| `_placeholder` | ::placeholder |
| `_file` | ::file-selector-button |
| `_firstLetter` | ::first-letter |
| `_firstLine` | ::first-line |
| `_marker` | ::marker |
| `_selection` | ::selection |

### Parent / Sibling Selectors

| 条件 | 说明 |
| ---- | ---- |
| `_groupHover` | 父 group hover 时（父需加 `role="group"`） |
| `_groupFocus` | 同上 focus |
| `_groupActive` | 同上 active |
| `_groupDisabled` | 同上 disabled |
| `_groupChecked` | 同上 checked |
| `_peerHover` | 兄弟 peer hover 时（兄弟需加 `data-peer`） |
| `_peerFocus` | 同上 focus |
| `_peerActive` | 同上 active |
| `_peerDisabled` | 同上 disabled |
| `_peerChecked` | 同上 checked |

### 媒体查询条件

| 条件 | 说明 |
| ---- | ---- |
| `_dark` | 暗色模式 (`[data-theme=dark]` 或 `.dark`) |
| `_light` | 浅色模式 |
| `_osDark` | OS 暗色偏好 (`@media (prefers-color-scheme: dark)`) |
| `_osLight` | OS 浅色偏好 |
| `_highContrast` | 高对比度偏好 |
| `_lessContrast` | 低对比度偏好 |
| `_motionReduce` | 减少动画偏好 |
| `_motionSafe` | 允许动画 |
| `_portrait` | 竖屏 |
| `_landscape` | 横屏 |
| `_print` | 打印 |

### 响应式断点

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

### 综合使用

```tsx
<Button
  bg="blue.500"
  color="white"

  // hover / active / focus 状态
  _hover={{ bg: "blue.600", transform: "translateY(-1px)" }}
  _active={{ bg: "blue.700", transform: "translateY(0)" }}
  _focusVisible={{ outline: "2px solid", outlineColor: "blue.300" }}
  _disabled={{ opacity: 0.5, cursor: "not-allowed", _hover: { bg: "blue.500" } }}

  // 响应式
  size={{ base: "sm", md: "md", lg: "lg" }}
  px={{ base: "3", md: "5", lg: "8" }}

  // 暗色模式
  _dark={{ bg: "blue.400", color: "gray.900" }}

  // 组合：响应式 + 状态 + 主题
  bg={{ base: "blue.500", md: "blue.600", _dark: "blue.400" }}
>
  按钮
</Button>

{/* Group + GroupHover - 父 hover 时改变子元素 */}
<Box role="group" cursor="pointer">
  <Text _groupHover={{ color: "blue.500", fontWeight: "bold" }}>
    Hover 父容器看我变化
  </Text>
</Box>

{/* Pseudo Elements */}
<Box
  position="relative"
  _before={{
    content: '"★"',
    position: "absolute",
    left: "-20px",
    color: "yellow.500",
  }}
>
  带星号前缀的文本
</Box>
```

### 数组语法（响应式简写）

```tsx
{/* 数组语法 - [base, sm, md, lg, xl, 2xl] */}
<Box fontSize={["sm", undefined, "md", "lg"]} />
{/* = { base: 'sm', md: 'md', lg: 'lg' } */}
```

## createSystem + defineConfig 完整方案

主题对象是 Chakra UI 的设计 token 中心。v3 的核心 API 是 **`createSystem(defaultConfig, defineConfig(config))`**。

### 基础结构

```ts
import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
  preflight: true,
  cssVarsRoot: ":where(html)",
  cssVarsPrefix: "chakra",
  strictTokens: false,
  globalCss: { /* ... */ },

  theme: {
    breakpoints: { /* ... */ },
    tokens: { /* ... */ },
    semanticTokens: { /* ... */ },
    recipes: { /* ... */ },
    slotRecipes: { /* ... */ },
    keyframes: { /* ... */ },
    textStyles: { /* ... */ },
    layerStyles: { /* ... */ },
  },

  conditions: { /* ... */ },
});

export const system = createSystem(defaultConfig, config);
```

### Tokens 完整结构

```ts
const config = defineConfig({
  theme: {
    tokens: {
      // ─── 颜色 ────────────────────────────────────
      colors: {
        brand: {
          50: { value: "#e0f7ff" },
          100: { value: "#b3ecff" },
          200: { value: "#80dfff" },
          300: { value: "#4dd2ff" },
          400: { value: "#26c8ff" },
          500: { value: "#00bfff" },
          600: { value: "#00a8e8" },
          700: { value: "#0094cc" },
          800: { value: "#0080b3" },
          900: { value: "#006d9e" },
          950: { value: "#005278" },
        },
      },

      // ─── 间距 ────────────────────────────────────
      spacing: {
        "4.5": { value: "1.125rem" },   // 自定义额外 spacing
        "13": { value: "3.25rem" },
      },

      // ─── 尺寸 ────────────────────────────────────
      sizes: {
        "container.sm": { value: "640px" },
        "container.md": { value: "768px" },
        "container.lg": { value: "1024px" },
      },

      // ─── 字号 / 字重 / 行高 / 字距 ──────────────
      fontSizes: {
        "tiny": { value: "0.625rem" },
      },
      fontWeights: {
        thin: { value: "100" },
      },
      lineHeights: {
        relaxed: { value: "1.75" },
      },
      letterSpacings: {
        tight: { value: "-0.025em" },
      },

      // ─── 字体 ────────────────────────────────────
      fonts: {
        heading: { value: "Inter, sans-serif" },
        body: { value: "Inter, sans-serif" },
        mono: { value: "Fira Code, monospace" },
      },

      // ─── 圆角 ────────────────────────────────────
      radii: {
        xs: { value: "0.125rem" },
        sm: { value: "0.25rem" },
        md: { value: "0.5rem" },
        lg: { value: "1rem" },
        xl: { value: "1.5rem" },
      },

      // ─── 阴影 ────────────────────────────────────
      shadows: {
        xs: { value: "0 1px 3px rgba(0,0,0,0.05)" },
        sm: { value: "0 1px 3px rgba(0,0,0,0.1)" },
        md: { value: "0 4px 6px rgba(0,0,0,0.1)" },
        lg: { value: "0 10px 15px rgba(0,0,0,0.1)" },
        xl: { value: "0 20px 25px rgba(0,0,0,0.15)" },
      },

      // ─── zIndex ──────────────────────────────────
      zIndices: {
        modal: { value: 1400 },
        popover: { value: 1500 },
        tooltip: { value: 1800 },
      },

      // ─── 边框 ────────────────────────────────────
      borders: {
        sm: { value: "1px solid" },
      },

      // ─── 动画 ────────────────────────────────────
      animations: {
        spin: { value: "spin 1s linear infinite" },
      },
    },
  },
});
```

### Semantic Tokens

语义化 token —— 引用 base tokens、支持 `_dark` / `_light` 等条件值，**主题切换自动适配**：

```ts
const config = defineConfig({
  theme: {
    semanticTokens: {
      colors: {
        // 简单引用
        danger: { value: "{colors.red.500}" },
        success: { value: "{colors.green.500}" },

        // 条件值：暗色 / 浅色不同
        primary: {
          value: {
            base: "{colors.brand.500}",
            _dark: "{colors.brand.400}",
          },
        },
        "primary.subtle": {
          value: {
            base: "{colors.brand.50}",
            _dark: "{colors.brand.900}",
          },
        },

        // 默认 Chakra 提供的语义 token
        // bg / fg / border / etc.
        // 用户也可覆盖
      },
    },
  },
});
```

使用：

```tsx
<Box bg="danger" color="white">错误</Box>
<Box bg="primary" color="white">主色按钮</Box>
<Box bg="primary.subtle" color="primary">浅色按钮</Box>
```

### Recipes（组件变体）

`defineRecipe` —— 类似 [CVA](https://cva.style)，定义组件的 **base + variants + compoundVariants + defaultVariants**：

```ts
import { defineRecipe } from "@chakra-ui/react";

export const buttonRecipe = defineRecipe({
  className: "chakra-button",        // 生成的 class 前缀

  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "medium",
    borderRadius: "md",
    cursor: "pointer",
    transition: "all 0.2s",
    _disabled: { opacity: 0.5, cursor: "not-allowed" },
  },

  variants: {
    variant: {
      solid: {
        bg: "colorPalette.500",
        color: "white",
        _hover: { bg: "colorPalette.600" },
      },
      outline: {
        bg: "transparent",
        borderWidth: "1px",
        borderColor: "colorPalette.500",
        color: "colorPalette.500",
        _hover: { bg: "colorPalette.50" },
      },
      ghost: {
        bg: "transparent",
        color: "colorPalette.500",
        _hover: { bg: "colorPalette.50" },
      },
    },
    size: {
      sm: { px: "3", py: "1", fontSize: "sm" },
      md: { px: "4", py: "2", fontSize: "md" },
      lg: { px: "6", py: "3", fontSize: "lg" },
    },
  },

  compoundVariants: [
    // variant + size 组合特殊样式
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

注册到 system：

```ts
const config = defineConfig({
  theme: {
    recipes: {
      button: buttonRecipe,
    },
  },
});
```

使用：

```tsx
{/* Chakra Button 已经内置 recipe、外部 recipes 是覆盖默认 */}
<Button variant="outline" size="lg" colorPalette="blue">
  按钮
</Button>
```

### Slot Recipes（多部分组件）

`defineSlotRecipe` —— 用于 **多部分组件**（如 Card、Dialog 这种 Compound）：

```ts
import { defineSlotRecipe } from "@chakra-ui/react";

export const cardRecipe = defineSlotRecipe({
  className: "chakra-card",
  slots: ["root", "header", "body", "footer"],

  base: {
    root: {
      display: "flex",
      flexDirection: "column",
      bg: "bg.panel",
      borderRadius: "lg",
      borderWidth: "1px",
      borderColor: "border",
    },
    header: { p: "4", borderBottomWidth: "1px" },
    body: { p: "4", flex: "1" },
    footer: { p: "4", borderTopWidth: "1px" },
  },

  variants: {
    size: {
      sm: {
        header: { p: "3" },
        body: { p: "3" },
        footer: { p: "3" },
      },
      lg: {
        header: { p: "6" },
        body: { p: "6" },
        footer: { p: "6" },
      },
    },
  },

  defaultVariants: { size: "md" },
});
```

### Conditions（自定义条件）

```ts
const config = defineConfig({
  conditions: {
    cqSm: "@container(min-width: 320px)",
    cqMd: "@container(min-width: 480px)",
    child: "& > *",
    customClass: "&.my-custom-class",
  },
});
```

使用：

```tsx
<Box _cqSm={{ flexDirection: "row" }}>容器查询响应</Box>
```

### Global CSS

```ts
const config = defineConfig({
  globalCss: {
    "html, body": {
      fontFamily: "body",
      bg: "bg",
      color: "fg",
    },
    "*::placeholder": {
      color: "gray.400",
    },
    "*, *::before, *::after": {
      borderColor: "border",
    },
  },
});
```

### strictTokens 模式

```ts
const config = defineConfig({
  strictTokens: true,    // 编译期强制只用 token
});
```

启用后非 token 值会 TS 报错：

```tsx
<Box mt="4" />          {/* ✅ token */}
<Box mt="17px" />       {/* ❌ TS Error - 不是 token */}
<Box style={{ marginTop: "17px" }} />   {/* ✅ style prop 绕过 strictTokens */}
```

## Color Mode 完整方案

Chakra UI v3 改用 **next-themes** 库（业界事实标准）—— **比 v2 的 ColorModeProvider 更稳健、SSR 一致性更好**。

### 完整集成（snippet 自动生成）

`npx @chakra-ui/cli snippet add` 会生成：

```tsx
// src/components/ui/color-mode.tsx
"use client";

import { IconButton, Span, useTheme as useNextTheme } from "next-themes";
import { ThemeProvider } from "next-themes";
import { LuMoon, LuSun } from "react-icons/lu";

export function ColorModeProvider(props: React.ComponentProps<typeof ThemeProvider>) {
  return (
    <ThemeProvider
      attribute="class"
      disableTransitionOnChange
      defaultTheme="system"
      {...props}
    />
  );
}

export type ColorMode = "light" | "dark";

export function useColorMode() {
  const { resolvedTheme, setTheme, forcedTheme } = useNextTheme();
  const colorMode = forcedTheme || resolvedTheme;
  return {
    colorMode: colorMode as ColorMode,
    setColorMode: setTheme,
    toggleColorMode: () => setTheme(colorMode === "dark" ? "light" : "dark"),
  };
}

export function useColorModeValue<T>(light: T, dark: T): T {
  const { colorMode } = useColorMode();
  return colorMode === "dark" ? dark : light;
}

export function ColorModeIcon() {
  const { colorMode } = useColorMode();
  return colorMode === "dark" ? <LuMoon /> : <LuSun />;
}

export function ColorModeButton(props: { ref?: React.Ref<HTMLButtonElement> }) {
  const { toggleColorMode } = useColorMode();
  return (
    <IconButton onClick={toggleColorMode} variant="ghost" aria-label="切换主题" {...props}>
      <ColorModeIcon />
    </IconButton>
  );
}
```

### useColorMode

```tsx
import { useColorMode } from "@/components/ui/color-mode";

function MyToggle() {
  const { colorMode, setColorMode, toggleColorMode } = useColorMode();

  return (
    <>
      <Text>当前模式：{colorMode}</Text>
      <Button onClick={toggleColorMode}>切换</Button>
      <Button onClick={() => setColorMode("light")}>设为浅色</Button>
      <Button onClick={() => setColorMode("dark")}>设为暗色</Button>
      <Button onClick={() => setColorMode("system")}>跟随系统</Button>
    </>
  );
}
```

### useColorModeValue

JS 中根据当前模式取值：

```tsx
import { useColorModeValue } from "@/components/ui/color-mode";

function MyComponent() {
  const bg = useColorModeValue("white", "gray.900");
  const color = useColorModeValue("gray.800", "white");

  return <Box bg={bg} color={color}>内容</Box>;
}
```

> **推荐用 `_dark` 条件 props 而非 `useColorModeValue`**——前者编译时静态、性能更好。`useColorModeValue` 在 JS 中动态判断、SSR 时只能拿默认值。

### Conditional Style Props（推荐）

```tsx
<Box
  bg={{ base: "white", _dark: "gray.900" }}
  color={{ base: "gray.800", _dark: "white" }}
  borderColor={{ base: "gray.200", _dark: "gray.700" }}
>
  自适应卡片
</Box>
```

### Semantic Tokens（更推荐）

把 light/dark 适配抽到 token 层：

```ts
const config = defineConfig({
  theme: {
    semanticTokens: {
      colors: {
        bg: {
          value: { base: "{colors.white}", _dark: "{colors.gray.900}" },
        },
        fg: {
          value: { base: "{colors.gray.800}", _dark: "{colors.white}" },
        },
      },
    },
  },
});
```

然后整个项目用语义 token：

```tsx
<Box bg="bg" color="fg">  {/* 自动 light/dark 适配 */}
  内容
</Box>
```

### ColorModeButton 一键切换

```tsx
import { ColorModeButton } from "@/components/ui/color-mode";

<Flex justify="flex-end">
  <ColorModeButton />     {/* 自动渲染太阳/月亮图标 + 切换 */}
</Flex>
```

### 强制特定模式

某个子树强制使用某个模式（用 `next-themes` 的 `forcedTheme`）：

```tsx
import { ThemeProvider } from "next-themes";

<ThemeProvider attribute="class" forcedTheme="dark">
  <DarkOnlySection />   {/* 这个子树永远是暗色模式 */}
</ThemeProvider>
```

或者用 className 局部强制：

```tsx
<Box className="dark">
  <Box bg="bg" color="fg">强制暗色</Box>
</Box>
```

## Compound Component 模式深度

v3 的标志性变化 —— **所有复合组件都改为点号命名**。这是 [Ark UI](https://ark-ui.com) headless 底层的设计选择，**结构清晰、可拆分、可重组**。

### 完整 Compound 示例：Dialog

```tsx
<Dialog.Root>
  <Dialog.Trigger>            {/* 触发按钮 */}
  <Dialog.Backdrop />          {/* 遮罩 */}
  <Dialog.Positioner>          {/* 定位容器 */}
    <Dialog.Content>           {/* 内容容器 */}
      <Dialog.Header>          {/* 头部 */}
        <Dialog.Title />       {/* 标题 */}
        <Dialog.Description /> {/* 描述 */}
      </Dialog.Header>
      <Dialog.Body />          {/* 主体 */}
      <Dialog.Footer>          {/* 底部 */}
        <Dialog.ActionTrigger />     {/* 确认按钮 */}
        <Dialog.CloseTrigger />      {/* 取消按钮 */}
      </Dialog.Footer>
    </Dialog.Content>
  </Dialog.Positioner>
</Dialog.Root>
```

### 完整 Compound 示例：Avatar

```tsx
<Avatar.Root>
  <Avatar.Image />        {/* 头像图片 */}
  <Avatar.Fallback />     {/* 加载失败 / 无图片时的兜底（首字母等） */}
  <Avatar.Badge />        {/* 角标（在线状态等） */}
</Avatar.Root>
```

### 完整 Compound 示例：Field

```tsx
<Field.Root>
  <Field.Label>           {/* 标签 */}
    <Field.RequiredIndicator />  {/* 必填星号 */}
  </Field.Label>
  <Input />               {/* 输入框（标准 React 子组件） */}
  <Field.HelperText />    {/* 帮助文字 */}
  <Field.ErrorText />     {/* 错误信息 */}
</Field.Root>
```

### Compound 的优势

1. **结构清晰** —— 一眼看出组件层次
2. **可拆分** —— 只用部分 sub-component（如只用 `Dialog.Trigger` 不用 `Body`）
3. **样式定制** —— 单独覆盖某个 sub-component 的样式
4. **类型安全** —— 每个 sub-component 都有完整 TS 类型
5. **headless-friendly** —— 底层是 Ark UI，可以替换样式不替换逻辑

### 注意 Portal

很多 Overlay 组件（Dialog / Drawer / Menu / Popover）需要用 `<Portal>` 包裹 Positioner 来确保 z-index 正确：

```tsx
import { Portal } from "@chakra-ui/react";

<Dialog.Root>
  <Dialog.Trigger>...</Dialog.Trigger>
  <Portal>                              {/* 关键 */}
    <Dialog.Backdrop />
    <Dialog.Positioner>
      <Dialog.Content>...</Dialog.Content>
    </Dialog.Positioner>
  </Portal>
</Dialog.Root>
```

`Portal` 把内容渲染到 `document.body` 末尾，**避免被父容器的 `overflow: hidden` 或 `transform` 截断**。

## asChild Prop 组合

Chakra UI v3 借鉴 Radix UI 的 `asChild` 模式 —— **任何组件都能通过 `asChild` 把自身行为合并到子元素上**。

### 基础用法

```tsx
{/* 默认渲染为 button */}
<Button>点我</Button>

{/* asChild - 渲染为 a 标签同时保留 Button 样式 */}
<Button asChild colorPalette="blue">
  <a href="/about">链接按钮</a>
</Button>
```

### 与 Next.js Link 集成

```tsx
import Link from "next/link";

<Button asChild colorPalette="blue">
  <Link href="/users">用户页</Link>
</Button>

{/* IconButton + Link */}
<IconButton asChild aria-label="关于">
  <Link href="/about"><Icon as={LuInfo} /></Link>
</IconButton>
```

### 与 React Router 集成

```tsx
import { Link } from "react-router-dom";

<Button asChild>
  <Link to="/users">用户页</Link>
</Button>;
```

### asChild vs as

v3 同时支持两种：

- **`as`** - 改变底层 HTML 元素：`<Heading as="h3">`
- **`asChild`** - 把组件行为合并到子元素：`<Button asChild><a>...</a></Button>`

**简单场景用 `as`、与第三方组件（含 Link）集成用 `asChild`**。

### 在 Trigger 类组件上用 asChild

```tsx
<Dialog.Root>
  <Dialog.Trigger asChild>
    <Button>打开 Dialog</Button>   {/* Trigger 行为合并到 Button */}
  </Dialog.Trigger>
  ...
</Dialog.Root>
```

`asChild` 是 v3 Trigger 系列的**通用机制** —— Tooltip.Trigger / Popover.Trigger / Menu.Trigger / Dialog.Trigger / Drawer.Trigger 等都支持。

## Form 完整方案

### react-hook-form + Zod（推荐生产组合）

```bash
pnpm add react-hook-form zod @hookform/resolvers
```

```tsx
import {
  Button,
  Field,
  Input,
  NativeSelect,
  Stack,
  Textarea,
} from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2, "至少 2 个字符"),
  age: z.number().min(18, "必须 ≥ 18 岁"),
  gender: z.enum(["male", "female"]),
  bio: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function ProfileForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (values: FormValues) => {
    console.log("提交:", values);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack gap="4" maxW="md">
        <Field.Root invalid={!!errors.name} required>
          <Field.Label>姓名</Field.Label>
          <Input {...register("name")} />
          <Field.ErrorText>{errors.name?.message}</Field.ErrorText>
        </Field.Root>

        <Field.Root invalid={!!errors.age} required>
          <Field.Label>年龄</Field.Label>
          <Input
            type="number"
            {...register("age", { valueAsNumber: true })}
          />
          <Field.ErrorText>{errors.age?.message}</Field.ErrorText>
        </Field.Root>

        <Field.Root invalid={!!errors.gender} required>
          <Field.Label>性别</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field {...register("gender")}>
              <option value="">请选择</option>
              <option value="male">男</option>
              <option value="female">女</option>
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
          <Field.ErrorText>{errors.gender?.message}</Field.ErrorText>
        </Field.Root>

        <Field.Root>
          <Field.Label>个人简介</Field.Label>
          <Textarea
            {...register("bio")}
            placeholder="可选"
            resize="vertical"
            minH="20"
          />
        </Field.Root>

        <Button
          type="submit"
          loading={isSubmitting}
          loadingText="提交中"
          colorPalette="blue"
        >
          提交
        </Button>
      </Stack>
    </form>
  );
}
```

### Controller 包装 Compound 组件

如果是 `NumberInput.Root` 等 Compound 组件，react-hook-form 的 `register` 不能直接绑定，用 `Controller`：

```tsx
import { useForm, Controller } from "react-hook-form";
import { NumberInput, Slider } from "@chakra-ui/react";

const { control } = useForm();

<Controller
  name="age"
  control={control}
  defaultValue={18}
  render={({ field }) => (
    <NumberInput.Root
      value={field.value?.toString()}
      onValueChange={(e) => field.onChange(Number(e.value))}
      min={0}
      max={120}
    >
      <NumberInput.Input />
      <NumberInput.Control>
        <NumberInput.IncrementTrigger />
        <NumberInput.DecrementTrigger />
      </NumberInput.Control>
    </NumberInput.Root>
  )}
/>;
```

### 文件上传

```tsx
import { FileUpload, Button, Icon } from "@chakra-ui/react";
import { LuUpload } from "react-icons/lu";

<FileUpload.Root accept={["image/*"]} maxFiles={3}>
  <FileUpload.HiddenInput />
  <FileUpload.Trigger asChild>
    <Button variant="outline">
      <Icon as={LuUpload} /> 上传图片
    </Button>
  </FileUpload.Trigger>
  <FileUpload.List />
</FileUpload.Root>;
```

## Toast 完整方案

### 全局 Toaster 配置

```tsx
// src/components/ui/toaster.tsx (snippet 自动生成)
import { createToaster } from "@chakra-ui/react";

export const toaster = createToaster({
  placement: "top-end",        // 6 个位置
  pauseOnPageIdle: true,
  max: 5,                       // 最多同时显示数
  duration: 5000,               // 默认显示时长
  overlap: false,
});
```

`placement` 可选：

- `top-start` / `top` / `top-end`
- `bottom-start` / `bottom` / `bottom-end`

### toaster.create

```ts
import { toaster } from "@/components/ui/toaster";

toaster.create({
  id: "save-success",          // 可选 ID
  title: "保存成功",
  description: "你的修改已同步",
  type: "success",             // success / error / warning / info / loading
  duration: 3000,
  closable: true,
  action: {
    label: "撤销",
    onClick: () => undoSave(),
  },
});
```

### toaster.update / dismiss

```ts
{/* 按 ID 更新已显示的 toast */}
toaster.update("save-success", {
  title: "已撤销",
  type: "info",
});

{/* 关闭 */}
toaster.dismiss("save-success");
toaster.dismiss();            // 关闭全部
```

### toaster.promise - 异步任务

```ts
const handleSave = () => {
  toaster.promise(saveToServer(), {
    loading: { title: "保存中...", description: "请稍候" },
    success: { title: "保存成功", description: "已同步" },
    error: { title: "保存失败", description: "请重试" },
  });
};
```

`promise` 接收一个 Promise，自动根据 pending / fulfilled / rejected 状态展示对应 toast。

## Menu 完整方案

```tsx
import {
  Menu,
  Button,
  Portal,
  Icon,
  Kbd,
  HStack,
} from "@chakra-ui/react";
import {
  LuChevronDown,
  LuPencil,
  LuCopy,
  LuTrash,
  LuSettings,
} from "react-icons/lu";

<Menu.Root>
  <Menu.Trigger asChild>
    <Button variant="outline">
      操作 <Icon as={LuChevronDown} />
    </Button>
  </Menu.Trigger>

  <Portal>
    <Menu.Positioner>
      <Menu.Content>
        <Menu.ItemGroup>
          <Menu.ItemGroupLabel>编辑</Menu.ItemGroupLabel>
          <Menu.Item value="edit">
            <Icon as={LuPencil} />
            <Menu.ItemText>编辑</Menu.ItemText>
            <Menu.ItemCommand>
              <Kbd>⌘E</Kbd>
            </Menu.ItemCommand>
          </Menu.Item>
          <Menu.Item value="duplicate">
            <Icon as={LuCopy} />
            <Menu.ItemText>复制</Menu.ItemText>
          </Menu.Item>
        </Menu.ItemGroup>

        <Menu.Separator />

        <Menu.Item value="settings">
          <Icon as={LuSettings} /> 设置
        </Menu.Item>

        <Menu.Separator />

        <Menu.Item value="delete" color="red.500">
          <Icon as={LuTrash} /> 删除
        </Menu.Item>
      </Menu.Content>
    </Menu.Positioner>
  </Portal>
</Menu.Root>;
```

### Radio / Checkbox 菜单项

```tsx
const [view, setView] = useState("list");

<Menu.Root>
  <Menu.Trigger asChild>
    <Button>视图</Button>
  </Menu.Trigger>
  <Portal>
    <Menu.Positioner>
      <Menu.Content>
        <Menu.RadioItemGroup value={view} onValueChange={(e) => setView(e.value)}>
          <Menu.RadioItem value="list">列表视图</Menu.RadioItem>
          <Menu.RadioItem value="grid">网格视图</Menu.RadioItem>
          <Menu.RadioItem value="card">卡片视图</Menu.RadioItem>
        </Menu.RadioItemGroup>
      </Menu.Content>
    </Menu.Positioner>
  </Portal>
</Menu.Root>;
```

### Submenu 子菜单

```tsx
<Menu.Root>
  <Menu.Trigger>主菜单</Menu.Trigger>
  <Menu.Content>
    <Menu.Item value="open">打开</Menu.Item>
    <Menu.Root positioning={{ placement: "right-start" }}>
      <Menu.TriggerItem>导出 ▶</Menu.TriggerItem>
      <Menu.Positioner>
        <Menu.Content>
          <Menu.Item value="pdf">导出 PDF</Menu.Item>
          <Menu.Item value="csv">导出 CSV</Menu.Item>
          <Menu.Item value="json">导出 JSON</Menu.Item>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  </Menu.Content>
</Menu.Root>
```

## Ark UI Headless 底层

Chakra UI v3 的底层是 [Ark UI](https://ark-ui.com) —— 同团队开发的 headless 组件库。**Chakra UI = Ark UI + Style Props + Theme**。

### 何时直接用 Ark UI

99% 场景用 Chakra UI 即可。**只在以下情况下** 才直接 import Ark UI：

1. 需要完全自定义样式、不用 Chakra 默认主题
2. 需要 Ark UI 的某个高级功能但 Chakra 还没暴露（如 Date Picker、Menu 高级选项）
3. 想跨多个 UI 库共享 headless 逻辑

### Ark UI 安装与使用

```bash
pnpm add @ark-ui/react
```

```tsx
import { Dialog } from "@ark-ui/react";

{/* Ark UI 的 Dialog - 无任何默认样式 */}
<Dialog.Root>
  <Dialog.Trigger>打开</Dialog.Trigger>
  <Dialog.Backdrop />
  <Dialog.Positioner>
    <Dialog.Content>...</Dialog.Content>
  </Dialog.Positioner>
</Dialog.Root>;
```

**API 与 Chakra Dialog 几乎一致** —— 只是没有样式。可以自己加 Tailwind / CSS Modules。

### Ark UI 组件清单

Ark UI 提供 **50+ headless 组件**，覆盖 Dialog / Combobox / Menu / Popover / Tooltip / Tabs / Accordion / Steps / Slider / DatePicker / NumberInput / Switch / Tags / TreeView / Tour 等。详见 [ark-ui.com](https://ark-ui.com)。

## Next.js App Router 完整集成

### 完整 layout.tsx

```tsx
// app/layout.tsx
import { Provider } from "@/components/ui/provider";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Chakra App",
  description: "Modern React App with Chakra UI v3",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
```

`Provider` snippet 自动包含 ChakraProvider + ColorModeProvider + Toaster。

### Providers Client Component（如需自定义 theme）

```tsx
// src/components/ui/provider.tsx
"use client";

import { ChakraProvider } from "@chakra-ui/react";
import { ColorModeProvider } from "./color-mode";
import { Toaster } from "./toaster";
import { system } from "@/theme";

export function Provider(props: { children: React.ReactNode }) {
  return (
    <ChakraProvider value={system}>
      <ColorModeProvider {...props} />
      <Toaster />
    </ChakraProvider>
  );
}
```

### next.config.mjs 优化

```js
// next.config.mjs
export default {
  experimental: {
    optimizePackageImports: ["@chakra-ui/react"],
  },
};
```

启用按需 import 优化、bundle 体积减小 ~40%。

### Server Component 与 Client Component 划分

```tsx
// app/page.tsx - 默认 Server Component
import { Container, Heading, Text } from "@chakra-ui/react";
import { InteractiveSection } from "./InteractiveSection";

export default function HomePage() {
  return (
    <Container maxW="md" py="10">
      <Heading>欢迎</Heading>           {/* Server Component 可用 */}
      <Text>这是 Server Component</Text>  {/* 同上 */}

      <InteractiveSection />               {/* Client Component */}
    </Container>
  );
}
```

```tsx
// app/InteractiveSection.tsx
"use client";

import { Button } from "@chakra-ui/react";
import { useState } from "react";

export function InteractiveSection() {
  const [count, setCount] = useState(0);
  return (
    <Button onClick={() => setCount(count + 1)}>
      点击次数: {count}
    </Button>
  );
}
```

**布局展示类组件可以是 Server Component** —— Chakra UI 大部分纯展示组件（`Heading` / `Text` / `Box` / `Container` 等）都能在 RSC 中渲染。
**交互组件** （含 `onClick` / `useState` / hooks）必须放在 Client Component。

### SSR Cache Provider（可选优化）

如果遇到 SSR 样式闪烁、可以加 emotion cache provider：

```bash
pnpm add @emotion/cache
```

```tsx
// app/registry.tsx
"use client";

import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import { useServerInsertedHTML } from "next/navigation";
import { useState } from "react";

export function EmotionRegistry({ children }: { children: React.ReactNode }) {
  const [cache] = useState(() => {
    const cache = createCache({ key: "chakra" });
    cache.compat = true;
    return cache;
  });

  useServerInsertedHTML(() => (
    <style
      data-emotion={`${cache.key} ${Object.keys(cache.inserted).join(" ")}`}
      dangerouslySetInnerHTML={{
        __html: Object.values(cache.inserted).join(" "),
      }}
    />
  ));

  return <CacheProvider value={cache}>{children}</CacheProvider>;
}
```

包裹 Provider：

```tsx
<EmotionRegistry>
  <Provider>{children}</Provider>
</EmotionRegistry>
```

> **多数项目不需要这一步**—— Chakra UI v3 内置已经处理大部分 SSR 场景。只在出现样式闪烁时再加。

## 常见踩坑

### 踩坑 1：v2 → v3 不兼容

**症状**：升级后 `isOpen` / `colorScheme` / `extendTheme` 全部报错。

**解决**：跑自动迁移工具：

```bash
npx @chakra-ui/codemod upgrade
```

然后手动处理剩余 30%（Modal → Dialog、FormControl → Field 解构）。详见[入门 - v2 → v3 Migration](./getting-started.md#v2-v3-migration)。

### 踩坑 2：Color Mode Hydration 闪烁

**症状**：Next.js 首屏先看到浅色再瞬间切到暗色。

**解决**：

1. `<html>` 加 `suppressHydrationWarning`：

```tsx
<html lang="zh-CN" suppressHydrationWarning>
```

2. 用 `next-themes` 默认配置：

```tsx
<ColorModeProvider attribute="class" defaultTheme="system" disableTransitionOnChange>
```

3. 用 Semantic Tokens 代替条件 props（编译时静态、无需 JS 判断）

### 踩坑 3：strictTokens 报错

**症状**：开启 `strictTokens: true` 后 `<Box mt="17px" />` 报 TS 错。

**解决**：

1. 要么用 token：`<Box mt="4" />`
2. 要么自定义 token：在 `tokens.spacing` 加 `"4.5": { value: "1.125rem" }`
3. 要么用 `style` prop 绕过：<span v-pre>`<Box style={{ marginTop: "17px" }} />`</span>

### 踩坑 4：Snippet CLI 路径冲突

**症状**：`@/components/ui/...` 红色波浪线、TS 找不到模块。

**解决**：检查 `tsconfig.json` 的 paths：

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

Vite 项目还要装 `vite-tsconfig-paths`：

```bash
pnpm add -D vite-tsconfig-paths
```

并加到 `vite.config.ts`：

```ts
import tsconfigPaths from "vite-tsconfig-paths";
export default defineConfig({ plugins: [react(), tsconfigPaths()] });
```

### 踩坑 5：Token 值忘了 { value: ... } 包装

**症状**：`createSystem` 报错或 token 不生效。

**解决**：v3 的 token 必须用对象包装：

```ts
{/* ❌ v2 写法 */}
colors: { brand: { 500: "#00bfff" } }

{/* ✅ v3 写法 */}
colors: { brand: { 500: { value: "#00bfff" } } }
```

### 踩坑 6：Modal 找不到

**症状**：`import { Modal } from '@chakra-ui/react'` 报错。

**解决**：v3 改名 Dialog 且改为 Compound：

```tsx
import { Dialog, Portal } from "@chakra-ui/react";

<Dialog.Root open={open} onOpenChange={(e) => setOpen(e.open)}>
  <Portal>
    <Dialog.Backdrop />
    <Dialog.Positioner>
      <Dialog.Content>...</Dialog.Content>
    </Dialog.Positioner>
  </Portal>
</Dialog.Root>;
```

### 踩坑 7：忘了 Portal

**症状**：Dialog / Menu / Popover 被父容器遮挡或 z-index 不对。

**解决**：用 `<Portal>` 包裹 Positioner：

```tsx
<Dialog.Root>
  <Dialog.Trigger>...</Dialog.Trigger>
  <Portal>
    <Dialog.Backdrop />
    <Dialog.Positioner>...</Dialog.Positioner>
  </Portal>
</Dialog.Root>
```

### 踩坑 8：Stack spacing 不生效

**症状**：`<Stack spacing="4">` 没有间距。

**解决**：v3 改名 `gap`：

```tsx
<Stack gap="4">
```

VStack / HStack / SimpleGrid 同样。

### 踩坑 9：Select 找不到 placeholder prop

**症状**：v2 的 `<Select placeholder="...">` 在 v3 报错。

**解决**：v3 把原生 select 重命名为 `NativeSelect` 且改为 Compound：

```tsx
<NativeSelect.Root>
  <NativeSelect.Field placeholder="选择">
    <option value="a">A</option>
    <option value="b">B</option>
  </NativeSelect.Field>
  <NativeSelect.Indicator />
</NativeSelect.Root>
```

如果需要自定义下拉、用 `<Select>` 或 `<Combobox>`（v3 提供基于 Ark UI 的自定义 Select）。

### 踩坑 10：Turbopack 兼容性

**症状**：Next.js 15+ dev server 报 hydration error。

**解决**：暂时切回 webpack：

```json
{ "scripts": { "dev": "next dev --webpack" } }
```

或等 Next.js 16+ Turbopack 完全稳定。

### 踩坑 11：图标 import 报错

**症状**：`import { AddIcon } from '@chakra-ui/icons'` 找不到包。

**解决**：v3 移除 `@chakra-ui/icons`：

```bash
pnpm add react-icons
```

```tsx
import { Icon } from "@chakra-ui/react";
import { LuPlus } from "react-icons/lu";

<Icon as={LuPlus} boxSize="5" />;
```

或者用 lucide-react：

```bash
pnpm add lucide-react
```

```tsx
import { Plus } from "lucide-react";
<Plus size={20} />;
```

### 踩坑 12：bundle 体积过大

**症状**：生产构建后 chunk 1MB+。

**解决**：

1. **Next.js 启用 `optimizePackageImports`**：

```js
{ experimental: { optimizePackageImports: ["@chakra-ui/react"] } }
```

2. **图标按需 import**：

```ts
{/* ❌ 整个 react-icons/lu 都打进来 */}
import * as Icons from "react-icons/lu";

{/* ✅ 只 import 用到的 */}
import { LuPlus, LuCheck } from "react-icons/lu";
```

3. **不要全 import Chakra**：

```ts
{/* ❌ 不要这样 */}
import * as Chakra from "@chakra-ui/react";

{/* ✅ 这样 */}
import { Button, Box } from "@chakra-ui/react";
```

### 踩坑 13：colorPalette 与 colorScheme 混用

**症状**：从 v2 升级后部分组件颜色不对。

**解决**：v3 全部改用 `colorPalette`：

```tsx
{/* ❌ v2 */}
<Button colorScheme="blue">

{/* ✅ v3 */}
<Button colorPalette="blue">
```

### 踩坑 14：semantic token 引用语法错

**症状**：`{ value: "{colors.brand.500}" }` 语法引用错误导致 token 不生效。

**解决**：semantic token 用 `{ }` 包裹路径：

```ts
{/* ✅ */}
primary: { value: "{colors.brand.500}" }

{/* ❌ 不工作 */}
primary: { value: "colors.brand.500" }
primary: { value: "$colors.brand.500" }
```

### 踩坑 15：Tooltip 找不到

**症状**：`import { Tooltip } from '@chakra-ui/react'` 后 props 不对、文档不准。

**解决**：v3 的 Tooltip 是 snippet，应该从本地 import：

```tsx
import { Tooltip } from "@/components/ui/tooltip";

<Tooltip content="提示">
  <Button>悬停</Button>
</Tooltip>;
```

注意 snippet 的 Tooltip API 与 Chakra 原始 `Tooltip.Root` 不同 —— snippet 是封装过的简化版。

## 下一步

- [参考](./reference.md)：100+ 组件清单、Style Props 完整表、Conditional Style Props、createSystem / defineConfig 完整选项、Recipes / Slot Recipes API、TypeScript 类型
- [Chakra UI 官网](https://chakra-ui.com/)：实时 Demo + Sandpack 在线编辑
- [Ark UI](https://ark-ui.com)：headless 底层组件库
- [Panda CSS](https://panda-css.com)：设计系统引擎
- [Chakra UI Playground](https://chakra-ui.com/docs/get-started/playground)：在线试玩
