---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 shadcn-ui/ui 官方 skill 的 SKILL.md 与 `rules/*.md` 编写。

## 速查

- **6 大 Critical Rules**（始终强制，各链 rules/*.md 带错误/正确对）：Styling / Forms / Composition / Use-Components / Icons / Chat + CLI
- **Styling**：className 只管布局不管样式；`gap-*` 非 `space-x/y-*`；`size-*` 非 `w/h`；`truncate`；无手写 `dark:`/`z-index`；`cn()`
- **Forms**：`FieldGroup`+`Field`；`InputGroup`+`InputGroupInput`；选项集 `ToggleGroup`；`data-invalid`+`aria-invalid`
- **Composition**：Item 必在其 Group 内；触发用 `asChild`(radix)/`render`(base)；Dialog/Sheet/Drawer 必有 Title；完整 Card 组合；`TabsTrigger` 必在 `TabsList`
- **Icons**：Button 内图标用 `data-icon`；组件内图标不加尺寸类；图标传对象非字符串
- **Chat**：`MessageScroller`/`Message`/`Bubble`；MessageScroller 自管滚动
- **CLI/preset**：绝不手拼 preset URL，用 `preset decode/url/open/resolve` + `apply`/`init --preset`

## 6 大 Critical Rules（始终强制）

每条规则都链到 `rules/*.md`，里面是「错误 / 正确」代码对。

### ① Styling & Tailwind → rules/styling.md

- `className` 只管**布局**、不覆盖组件颜色/排版
- **无** `space-x-*`/`space-y-*` → 用 `flex` + `gap-*`（竖排 `flex flex-col gap-*`）
- 宽高相等用 `size-*`（`size-10` 非 `w-10 h-10`）
- 用 `truncate` 简写（非 `overflow-hidden text-ellipsis whitespace-nowrap`）
- **无手写 `dark:` 颜色覆盖** → 用语义 token（`bg-background`/`text-muted-foreground`）
- 条件类用 `cn()`（非手写模板字符串三元）
- overlay 组件（Dialog/Sheet/Popover）**不手写 `z-index`**，它们自管层叠

### ② Forms & Inputs → rules/forms.md

- 表单用 `FieldGroup` + `Field`（**绝不**用裸 `div` + `space-y-*`/`grid gap-*`）
- `InputGroup` 用 `InputGroupInput`/`InputGroupTextarea`（非裸 `Input`/`Textarea`）
- 选项集（2–7 选）用 `ToggleGroup`（别循环 `Button` 手管 active）
- 分组勾选/单选用 `FieldSet` + `FieldLegend`
- 校验用 `data-invalid`（在 `Field`）+ `aria-invalid`（在控件）

### ③ Component Structure → rules/composition.md

- **Item 永远在其 Group 内**：`SelectItem`→`SelectGroup`、`DropdownMenuItem`→`DropdownMenuGroup`
- 自定义触发用 `asChild`（radix）或 `render`（base）——查 `info` 的 `base` 字段
- Dialog/Sheet/Drawer **必有 Title**（无障碍，视觉隐藏用 `sr-only`）
- 用完整 Card 组合（Header/Title/Description/Content/Footer），别全塞 CardContent
- Button 无 `isPending`/`isLoading` → 用 `Spinner` + `data-icon` + `disabled` 组合
- `TabsTrigger` 必在 `TabsList` 内；`Avatar` 必有 `AvatarFallback`

### ④ 用组件而非自定义标记 → rules/composition.md

- 写样式 `div` 前先看有没有现成组件；Callout 用 `Alert`、空态用 `Empty`、Toast 用 `sonner` 的 `toast()`、分隔用 `Separator`（非 `<hr>`）、加载占位用 `Skeleton`（非 `animate-pulse` div）、标签用 `Badge`

### ⑤ Icons → rules/icons.md

- Button 内图标用 `data-icon="inline-start"`/`inline-end`
- 组件内图标**不加尺寸类**（组件用 CSS 管尺寸，别 `size-4`）
- 图标传**对象**（`icon={CheckIcon}`）非字符串键

### ⑥ Chat & Messaging → rules/chat.md

- 聊天 UI 组合聊天原语：会话 `MessageScroller`、行 `Message`、气泡 `Bubble`（别手搓气泡 div）
- `MessageScroller` 自管滚动（流式跟随/锚定/跳到最新），别写 `useStickToBottom`
- 附件用 `Attachment`，系统注记/分隔用 `Marker`

## CLI 与 preset 系统

- **preset 代码**：**绝不手动解码或拼 URL**——用 `npx shadcn@latest preset decode <code>` / `preset url <code>` / `preset open <code>`；项目感知检测用 `preset resolve`
- **应用 preset**：既有项目 `npx shadcn@latest apply <code>`；初始化 `npx shadcn@latest init --preset <code>`
- **registry**：`search` 查（含社区 registry）→ `add` 加组件源码 → `docs <component>` 取文档

## shadcn MCP

配套 shadcn MCP（ui.shadcn.com/docs/mcp）：一个 MCP URL 接 shadcn.io registry，让 AI 直接 **search / browse / install** 目录里每个 block、icon、example。skill（规则 + 项目上下文）与 MCP（registry 访问）互补。

## migrate-radix-to-base

同仓另一 skill `migrate-radix-to-base`：把组件从 **Radix UI** 迁到 **Base UI**（shadcn 触发用 `asChild`(radix) 还是 `render`(base) 就看这个）。

## 反模式

| 反模式 | 正确 |
| --- | --- |
| `space-y-4` 竖排 | `flex flex-col gap-4` |
| `w-10 h-10` | `size-10` |
| `bg-blue-500` 裸色 | 语义色 `bg-primary` / `Badge` |
| 裸 `div`+`space-y` 做表单 | `FieldGroup` + `Field` |
| 手写 Dialog 无 Title | `DialogTitle`（可 `sr-only`） |
| 手搓聊天气泡 div | `MessageScroller`/`Message`/`Bubble` |
| 手拼 preset URL | `preset url/decode/apply` |
| 自定义 `div` 代替现成组件 | 先 `search`，用 Alert/Empty/Badge/Skeleton |

## 下一步

- [参考](./reference) —— 规则文件清单、CLI 命令、MCP、preset、安装、许可
- 上游：[shadcn-ui/ui](https://github.com/shadcn-ui/ui) · [ui.shadcn.com/docs/skills](https://ui.shadcn.com/docs/skills)
