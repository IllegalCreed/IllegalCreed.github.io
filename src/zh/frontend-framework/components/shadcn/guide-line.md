---
layout: doc
outline: [2, 3]
---

# shadcn/ui 指南

本文围绕 **shadcn@4.7.x / Tailwind v4 / Radix Primitives / React 19** 深度梳理 70+ 组件分组、CLI 完整工作流、`cva` variant 系统、Form 完整方案（react-hook-form + zod）、Data Table（@tanstack/react-table）、Sidebar、Sonner、Chart、Blocks 模板系统、Themes 色板、Registry 私有分发、MCP Server AI 集成、Next.js App Router 集成、monorepo、常见踩坑。

> 本指南假设你已经读过 [入门](./getting-started.md)，掌握了 Button / Dialog / Sheet 三个基础组件、`cn()` utility、CSS 变量主题、`next-themes` 暗色模式。

## 1. 70+ 组件完整清单

shadcn 截至 2026 年 5 月 v4.7.x 共 **70+ 个组件**，按职责分为 **7 大类**：

### 1.1 Forms 类（表单输入）—— 11+ 个

| 组件 | CLI add | 底层 | 一句话功能 |
|------|---------|------|----------|
| `Button` | `button` | 原生 button + cva | 6 variant + 4 size 按钮 |
| `Checkbox` | `checkbox` | Radix Checkbox | 复选框 |
| `Input` | `input` | 原生 input | 文本输入框 |
| `Input Group` | `input-group` | 原生 input | 带前后缀的输入框组 |
| `Input OTP` | `input-otp` | input-otp 库 | OTP 验证码输入 |
| `Label` | `label` | Radix Label | 表单标签 |
| `Native Select` | `native-select` | 原生 select | 原生下拉选择 |
| `Radio Group` | `radio-group` | Radix RadioGroup | 单选组 |
| `Select` | `select` | Radix Select | 美化下拉选择 |
| `Switch` | `switch` | Radix Switch | 开关 |
| `Textarea` | `textarea` | 原生 textarea | 多行文本框 |
| `Toggle` | `toggle` | Radix Toggle | 单按钮开关 |
| `Toggle Group` | `toggle-group` | Radix ToggleGroup | 按钮组开关 |

### 1.2 Overlay 类（浮层 / 模态）—— 8 个

| 组件 | CLI add | 底层 | 功能 |
|------|---------|------|------|
| `Alert Dialog` | `alert-dialog` | Radix AlertDialog | 强制确认对话框 |
| `Context Menu` | `context-menu` | Radix ContextMenu | 右键菜单 |
| `Dialog` | `dialog` | Radix Dialog | 模态对话框 |
| `Drawer` | `drawer` | vaul 库 | 移动 / 桌面通用抽屉 |
| `Hover Card` | `hover-card` | Radix HoverCard | 悬停卡片 |
| `Popover` | `popover` | Radix Popover | 弹出气泡 |
| `Sheet` | `sheet` | Radix Dialog | 4 方向侧边面板 |
| `Tooltip` | `tooltip` | Radix Tooltip | 提示气泡 |

### 1.3 Navigation 类（导航 / 菜单）—— 6 个

| 组件 | CLI add | 底层 | 功能 |
|------|---------|------|------|
| `Breadcrumb` | `breadcrumb` | nav + ol | 面包屑 |
| `Dropdown Menu` | `dropdown-menu` | Radix DropdownMenu | 下拉菜单 |
| `Menubar` | `menubar` | Radix Menubar | macOS 风格菜单栏 |
| `Navigation Menu` | `navigation-menu` | Radix NavigationMenu | 大型导航菜单 |
| `Pagination` | `pagination` | a/button | 分页 |
| `Sidebar` | `sidebar` | 复合 | 完整侧边栏方案 |

### 1.4 Display 类（数据展示）—— 12 个

| 组件 | CLI add | 底层 | 功能 |
|------|---------|------|------|
| `Accordion` | `accordion` | Radix Accordion | 手风琴 |
| `Alert` | `alert` | div | 警告提示 |
| `Avatar` | `avatar` | Radix Avatar | 头像（带 Fallback） |
| `Badge` | `badge` | span + cva | 徽章 |
| `Card` | `card` | div | 卡片容器 |
| `Empty` | `empty` | div | 空状态 |
| `Kbd` | `kbd` | kbd | 键盘按键 |
| `Separator` | `separator` | Radix Separator | 分隔线 |
| `Skeleton` | `skeleton` | div | 骨架屏 |
| `Spinner` | `spinner` | svg + animate | 加载旋转 |
| `Table` | `table` | table | 基础表格（与 DataTable 不同） |
| `Typography` | - | 内置 | 标题 / 段落语义类 |

### 1.5 Selection / Interaction 类 —— 6 个

| 组件 | CLI add | 底层 | 功能 |
|------|---------|------|------|
| `Button Group` | `button-group` | div + Button | 按钮组 |
| `Collapsible` | `collapsible` | Radix Collapsible | 单项折叠 |
| `Combobox` | `combobox` / `command` | Command + Popover | 自动补全下拉 |
| `Command` | `command` | cmdk 库 | 命令面板（cmd+k） |
| `Item` | `item` | div | 列表项 |
| `Tabs` | `tabs` | Radix Tabs | 标签页 |

### 1.6 Layout 类（布局）—— 5 个

| 组件 | CLI add | 底层 | 功能 |
|------|---------|------|------|
| `Aspect Ratio` | `aspect-ratio` | Radix AspectRatio | 宽高比容器 |
| `Direction` | `direction` | Radix Direction | RTL 方向 |
| `Field` | `field` | label + Slot | 表单字段封装 |
| `Resizable` | `resizable` | react-resizable-panels | 可拖拽分屏 |
| `Scroll Area` | `scroll-area` | Radix ScrollArea | 自定义滚动条 |

### 1.7 Specialized 类（专业化）—— 12+ 个

| 组件 | CLI add | 底层 | 功能 |
|------|---------|------|------|
| `Calendar` | `calendar` | react-day-picker | 日历 |
| `Carousel` | `carousel` | embla-carousel | 轮播图 |
| `Chart` | `chart` | Recharts | 数据可视化包装 |
| `Data Table` | （文档） | @tanstack/react-table | 数据表格模板 |
| `Date Picker` | （文档） | Calendar + Popover | 日期选择器 |
| `Form` | `form` | react-hook-form | 表单状态管理 |
| `Progress` | `progress` | Radix Progress | 进度条 |
| `Slider` | `slider` | Radix Slider | 范围滑块 |
| `Sonner` | `sonner` | sonner 库 | 现代 Toast |
| `Toast` | `toast` | Radix Toast | 旧 Toast（推荐用 Sonner） |

> **聚合用法**：`pnpm dlx shadcn@latest add` **不加参数** 会进入交互式选择界面。`pnpm dlx shadcn@latest add -a` 一次性加全部。

## 2. CLI 完整工作流

### 2.1 init 命令

```bash
# 全量交互
pnpm dlx shadcn@latest init

# 自动模式（用默认设置）
pnpm dlx shadcn@latest init -d

# 强制覆盖已有 components.json
pnpm dlx shadcn@latest init -f

# 用框架模板
pnpm dlx shadcn@latest init -t next      # Next.js
pnpm dlx shadcn@latest init -t vite      # Vite
pnpm dlx shadcn@latest init -t start     # TanStack Start
pnpm dlx shadcn@latest init -t react-router  # React Router v7
pnpm dlx shadcn@latest init -t astro     # Astro
pnpm dlx shadcn@latest init -t laravel   # Laravel + Inertia

# Monorepo
pnpm dlx shadcn@latest init --monorepo

# 启用 RTL（v2026.4）
pnpm dlx shadcn@latest init --rtl

# 启用 pointer cursor（v2026.4）
pnpm dlx shadcn@latest init --pointer

# 切换底层
pnpm dlx shadcn@latest init --base radix  # 默认 Radix Primitives
pnpm dlx shadcn@latest init --base base   # Base UI（v2026 新增）

# CSS 变量开关
pnpm dlx shadcn@latest init --css-variables       # 用 CSS 变量（默认）
pnpm dlx shadcn@latest init --no-css-variables    # 直接写 Tailwind 类（如 bg-zinc-950）

# 完整示例
pnpm dlx shadcn@latest init -t next --monorepo --rtl --pointer
```

### 2.2 add 命令

```bash
# 添加单个组件
pnpm dlx shadcn@latest add button

# 添加多个组件（一次性）
pnpm dlx shadcn@latest add button dialog dropdown-menu

# 添加全部组件
pnpm dlx shadcn@latest add -a

# 跳过确认提示（CI 友好）
pnpm dlx shadcn@latest add button -y

# 覆盖已存在的文件
pnpm dlx shadcn@latest add button -o

# 指定路径
pnpm dlx shadcn@latest add button -p src/widgets

# 预览（不实际写入）
pnpm dlx shadcn@latest add button --dry-run

# 添加 Block（如登录页）
pnpm dlx shadcn@latest add login-03

# 添加 Sidebar Block
pnpm dlx shadcn@latest add sidebar-07

# 从私有 Registry
pnpm dlx shadcn@latest add @acme/special-button
```

### 2.3 其他命令

```bash
# 查看项目当前配置
pnpm dlx shadcn@latest info
pnpm dlx shadcn@latest info --json  # JSON 输出

# 在 Registry 里搜索
pnpm dlx shadcn@latest search button
pnpm dlx shadcn@latest search "data table" -l 10

# 列出所有可用组件
pnpm dlx shadcn@latest list

# 预览组件（不安装）
pnpm dlx shadcn@latest view button

# 拉取组件文档（AI 友好）
pnpm dlx shadcn@latest docs button
pnpm dlx shadcn@latest docs button --json

# 构建自己的 Registry
pnpm dlx shadcn@latest build ./registry.json -o ./public/r

# 应用 Preset
pnpm dlx shadcn@latest apply <preset-code>
pnpm dlx shadcn@latest apply <preset-code> --only theme

# 迁移老项目
pnpm dlx shadcn@latest migrate icons   # 切换图标库
pnpm dlx shadcn@latest migrate radix   # Radix 1.x → 2.x
pnpm dlx shadcn@latest migrate rtl     # 启用 RTL

# Preset 管理
pnpm dlx shadcn@latest preset decode <code>
pnpm dlx shadcn@latest preset resolve <code>
pnpm dlx shadcn@latest preset url <code>
pnpm dlx shadcn@latest preset open <code>
```

## 3. `cva` Variant 系统深度

### 3.1 基础语法

```ts
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  // 基础类（不可被 variant 覆盖）
  "inline-flex items-center justify-center rounded-md font-medium transition-colors",
  {
    variants: {
      // 第一维：颜色 variant
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent",
        secondary: "bg-secondary text-secondary-foreground",
        ghost: "hover:bg-accent",
        link: "text-primary underline-offset-4 hover:underline",
      },
      // 第二维：尺寸
      size: {
        default: "h-9 px-4 py-2 text-sm",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-6 text-base",
        icon: "size-9",
      },
      // 第三维：圆角
      rounded: {
        default: "rounded-md",
        full: "rounded-full",
        none: "rounded-none",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      rounded: "default",
    },
  },
);

// 使用
buttonVariants(); // → 默认类
buttonVariants({ variant: "outline", size: "lg" }); // → outline lg
buttonVariants({ variant: "outline", size: "lg", rounded: "full" });
```

### 3.2 `compoundVariants` 复合变体

**特定 variant 组合时叠加额外样式**：

```ts
const buttonVariants = cva("base", {
  variants: {
    variant: {
      default: "bg-primary",
      outline: "border",
    },
    size: {
      sm: "h-8 px-3",
      lg: "h-10 px-6",
    },
  },
  compoundVariants: [
    // 当 variant=outline 且 size=sm 时叠加 border-dashed
    {
      variant: "outline",
      size: "sm",
      className: "border-dashed",
    },
    // 多个 variant 取交集
    {
      variant: ["outline", "ghost"],
      size: "lg",
      className: "shadow-lg",
    },
  ],
  defaultVariants: {
    variant: "default",
    size: "sm",
  },
});
```

### 3.3 与 React 组件集成

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "text-foreground border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

// VariantProps 自动提取 cva 的类型
interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
```

**TypeScript 提示**：

```tsx
<Badge variant="outline">徽章</Badge>
// IDE 自动提示 variant: "default" | "secondary" | "destructive" | "outline"
```

## 4. Form 完整方案（react-hook-form + zod）

### 4.1 安装依赖

```bash
pnpm dlx shadcn@latest add form input button label
pnpm add react-hook-form zod @hookform/resolvers
```

### 4.2 完整示例：用户注册表单

`src/components/signup-form.tsx`：

```tsx
"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * zod 表单 schema
 * - 用 z.object 定义字段
 * - 链式校验：min / max / regex / email 等
 */
const formSchema = z
  .object({
    username: z
      .string()
      .min(2, "用户名至少 2 个字符")
      .max(20, "用户名最多 20 个字符"),
    email: z.string().email("请输入有效的邮箱地址"),
    password: z
      .string()
      .min(8, "密码至少 8 位")
      .regex(/[A-Z]/, "密码需包含至少 1 个大写字母")
      .regex(/[0-9]/, "密码需包含至少 1 个数字"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次密码不一致",
    path: ["confirmPassword"],
  });

/**
 * 注册表单组件
 * - useForm 管理表单状态
 * - zodResolver 把 zod schema 接入 RHF
 * - <Form> 是 FormProvider 的包装
 */
export function SignupForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  /**
   * 提交回调
   * - 仅当所有字段通过 zod 校验时才会触发
   */
  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    toast.success("注册成功", {
      description: `欢迎您，${values.username}！`,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>用户名</FormLabel>
              <FormControl>
                <Input placeholder="zhangsan" {...field} />
              </FormControl>
              <FormDescription>
                这将是您在系统中的公开标识。
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>邮箱</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>密码</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormDescription>
                至少 8 位，需包含大写字母和数字。
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>确认密码</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          注册
        </Button>
      </form>
    </Form>
  );
}
```

### 4.3 关键 API 解读

| API | 来源 | 作用 |
|-----|------|------|
| `z.object({...})` | zod | 定义 schema |
| `z.infer<typeof schema>` | zod | 从 schema 推导 TypeScript 类型 |
| `useForm({ resolver, defaultValues })` | RHF | 表单状态 hook |
| `zodResolver(schema)` | @hookform/resolvers | 桥接 zod 到 RHF |
| `form.handleSubmit(onSubmit)` | RHF | 包装 submit 自动校验 |
| `<Form {...form}>` | shadcn | 包装 FormProvider |
| `<FormField control={form.control} name="..." render={({field}) => ...}>` | shadcn | 单字段 Controller |
| `<FormItem>` | shadcn | 字段容器（自动注入 id） |
| `<FormLabel>` | shadcn | 标签（自动 htmlFor） |
| `<FormControl>` | shadcn | 输入容器（自动 aria-describedby） |
| `<FormDescription>` | shadcn | 描述文字 |
| `<FormMessage>` | shadcn | 错误信息 |

### 4.4 自动 ARIA 注入

`FormField` 内部自动 wiring 以下属性：

```html
<!-- FormLabel 自动 htmlFor -->
<label for="form-username">用户名</label>

<!-- Input 自动 id + aria-describedby + aria-invalid -->
<input
  id="form-username"
  aria-describedby="form-username-description form-username-message"
  aria-invalid="false"
  name="username"
/>

<!-- FormDescription 自动 id -->
<p id="form-username-description">这将是您在系统中的公开标识。</p>

<!-- FormMessage 自动 id（错误时显示） -->
<p id="form-username-message">用户名至少 2 个字符</p>
```

**a11y 完美 + 不用一行手动 aria 属性**。

### 4.5 动态字段（useFieldArray）

```tsx
import { useFieldArray } from "react-hook-form";

const { fields, append, remove } = useFieldArray({
  control: form.control,
  name: "items",
});

{fields.map((field, index) => (
  <FormField
    key={field.id}
    control={form.control}
    name={`items.${index}.name`}
    render={({ field }) => (
      <FormItem>
        <FormLabel>项目 {index + 1}</FormLabel>
        <FormControl><Input {...field} /></FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
))}

<Button type="button" onClick={() => append({ name: "" })}>
  添加项目
</Button>
```

## 5. Data Table 完整方案

### 5.1 安装

```bash
pnpm dlx shadcn@latest add table button input dropdown-menu checkbox
pnpm add @tanstack/react-table
```

### 5.2 列定义

`src/app/payments/columns.tsx`：

```tsx
"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// 数据类型
export type Payment = {
  id: string;
  amount: number;
  status: "pending" | "processing" | "success" | "failed";
  email: string;
};

export const columns: ColumnDef<Payment>[] = [
  // 行选择列
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) =>
          table.toggleAllPageRowsSelected(!!value)
        }
        aria-label="全选"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="选择行"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "status",
    header: "状态",
    cell: ({ row }) => {
      const status = row.getValue("status") as Payment["status"];
      const map = {
        pending: "待处理",
        processing: "处理中",
        success: "成功",
        failed: "失败",
      };
      return <span className="capitalize">{map[status]}</span>;
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        邮箱
        <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="lowercase">{row.getValue("email")}</div>,
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">金额</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"));
      const formatted = new Intl.NumberFormat("zh-CN", {
        style: "currency",
        currency: "CNY",
      }).format(amount);
      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  // 操作列
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const payment = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="size-8 p-0">
              <span className="sr-only">打开菜单</span>
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>操作</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(payment.id)}
            >
              复制订单 ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>查看详情</DropdownMenuItem>
            <DropdownMenuItem>查看用户</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
```

### 5.3 DataTable 组件

`src/app/payments/data-table.tsx`：

```tsx
"use client";

import * as React from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronDown } from "lucide-react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  // 排序状态
  const [sorting, setSorting] = React.useState<SortingState>([]);
  // 列过滤状态
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  // 列可见性状态
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  // 行选择状态
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="w-full">
      {/* 工具栏：过滤 + 列可见性 */}
      <div className="flex items-center py-4">
        <Input
          placeholder="按邮箱过滤..."
          value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
          onChange={(e) =>
            table.getColumn("email")?.setFilterValue(e.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              列 <ChevronDown className="ml-2 size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((c) => c.getCanHide())
              .map((c) => (
                <DropdownMenuCheckboxItem
                  key={c.id}
                  className="capitalize"
                  checked={c.getIsVisible()}
                  onCheckedChange={(value) => c.toggleVisibility(!!value)}
                >
                  {c.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 表格 */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  无数据。
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分页 */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-muted-foreground flex-1 text-sm">
          已选择 {table.getFilteredSelectedRowModel().rows.length} 项 /{" "}
          共 {table.getFilteredRowModel().rows.length} 项
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          上一页
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          下一页
        </Button>
      </div>
    </div>
  );
}
```

### 5.4 在页面使用

`src/app/payments/page.tsx`：

```tsx
import { columns, type Payment } from "./columns";
import { DataTable } from "./data-table";

async function getData(): Promise<Payment[]> {
  return [
    { id: "728ed52f", amount: 100, status: "pending", email: "m@example.com" },
    { id: "489e1d42", amount: 125, status: "processing", email: "a@example.com" },
    // ...更多数据
  ];
}

export default async function Page() {
  const data = await getData();
  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data} />
    </div>
  );
}
```

> **shadcn Data Table 不是组件、是模板**——你可以**自由修改 `data-table.tsx`** 适配业务（如服务端分页、虚拟滚动、行内编辑）。

## 6. Sidebar 完整方案

### 6.1 安装

```bash
pnpm dlx shadcn@latest add sidebar
```

会拷贝 `src/components/ui/sidebar.tsx`（约 700 行，包含 20+ 子组件 + `SidebarProvider` + `useSidebar` hook）。

### 6.2 自定义 Sidebar

`src/components/app-sidebar.tsx`：

```tsx
"use client";

import { Home, Inbox, Settings, Users, BarChart3 } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "首页", url: "/", icon: Home },
  { title: "收件箱", url: "/inbox", icon: Inbox, badge: "12" },
  { title: "用户", url: "/users", icon: Users },
  { title: "分析", url: "/analytics", icon: BarChart3 },
  { title: "设置", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      {/* 顶部 */}
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="bg-primary size-8 rounded-md" />
          <span className="font-semibold">我的应用</span>
        </div>
      </SidebarHeader>

      {/* 主体 */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>导航</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* 底部 */}
      <SidebarFooter>
        <div className="text-muted-foreground px-2 text-xs">v1.0.0</div>
      </SidebarFooter>
    </Sidebar>
  );
}
```

### 6.3 集成到 layout.tsx

```tsx
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1">
        <div className="flex items-center gap-2 border-b px-4 py-2">
          <SidebarTrigger />
          <span>页面标题</span>
        </div>
        <div className="p-6">{children}</div>
      </main>
    </SidebarProvider>
  );
}
```

### 6.4 collapsible 三种模式

| 值 | 行为 |
|----|------|
| `offcanvas` | 折叠时完全滑出视窗（默认） |
| `icon` | 折叠时只显示图标（推荐） |
| `none` | 不可折叠（固定显示） |

```tsx
<Sidebar collapsible="icon">  {/* 图标模式 */}
<Sidebar collapsible="offcanvas">  {/* 离屏模式 */}
<Sidebar collapsible="none">  {/* 固定 */}
```

### 6.5 useSidebar Hook

```tsx
"use client";

import { useSidebar } from "@/components/ui/sidebar";

export function CustomToggle() {
  const {
    state,        // "expanded" | "collapsed"
    open,         // boolean（控制状态）
    setOpen,      // (open: boolean) => void
    openMobile,   // 移动端 open 状态
    setOpenMobile,
    isMobile,     // 是否移动端
    toggleSidebar,// 切换显示
  } = useSidebar();

  return (
    <button onClick={toggleSidebar}>
      Sidebar 状态: {state}
    </button>
  );
}
```

### 6.6 键盘快捷键

shadcn Sidebar 默认绑定 `Cmd/Ctrl + B` 切换：

```tsx
// 在 sidebar.tsx 中可见
const SIDEBAR_KEYBOARD_SHORTCUT = "b";
```

## 7. Sonner Toast

### 7.1 安装

```bash
pnpm dlx shadcn@latest add sonner
```

### 7.2 全局 Toaster

`src/app/layout.tsx`：

```tsx
import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
```

### 7.3 调用 Toast

```tsx
"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ToastDemo() {
  return (
    <div className="flex gap-2">
      <Button onClick={() => toast("默认提示")}>默认</Button>

      <Button
        variant="outline"
        onClick={() => toast.success("保存成功", { description: "数据已保存到云端" })}
      >
        成功
      </Button>

      <Button
        variant="destructive"
        onClick={() => toast.error("网络错误", { description: "请检查您的网络连接" })}
      >
        错误
      </Button>

      <Button
        variant="secondary"
        onClick={() =>
          toast.promise(fetch("/api/data"), {
            loading: "加载中...",
            success: "加载成功",
            error: "加载失败",
          })
        }
      >
        Promise
      </Button>

      <Button
        onClick={() =>
          toast("撤销操作？", {
            action: { label: "撤销", onClick: () => console.log("已撤销") },
          })
        }
      >
        带 Action
      </Button>
    </div>
  );
}
```

### 7.4 Sonner Props

| Prop | 说明 |
|------|------|
| `position` | `top-left` / `top-center` / `top-right` / `bottom-left` / `bottom-center` / `bottom-right` |
| `richColors` | 启用彩色 toast |
| `expand` | 鼠标悬停时展开所有 toast |
| `duration` | 自动消失时长（ms） |
| `closeButton` | 显示关闭按钮 |
| `theme` | `light` / `dark` / `system` |

## 8. Chart Recharts 包装

### 8.1 安装

```bash
pnpm dlx shadcn@latest add chart
pnpm add recharts
```

### 8.2 完整示例：柱状图

```tsx
"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartData = [
  { month: "1 月", desktop: 186, mobile: 80 },
  { month: "2 月", desktop: 305, mobile: 200 },
  { month: "3 月", desktop: 237, mobile: 120 },
  { month: "4 月", desktop: 73, mobile: 190 },
  { month: "5 月", desktop: 209, mobile: 130 },
  { month: "6 月", desktop: 214, mobile: 140 },
];

const chartConfig = {
  desktop: {
    label: "桌面端",
    color: "var(--chart-1)",
  },
  mobile: {
    label: "移动端",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function MyChart() {
  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <BarChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
        <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
```

### 8.3 ChartConfig 解读

```ts
const chartConfig = {
  // key 必须与数据字段对应
  desktop: {
    label: "桌面端",                  // tooltip / legend 显示文本
    color: "var(--chart-1)",          // 用 CSS 变量
    icon: () => <LineIcon />,         // 可选：自定义图标
    theme: { light: "#000", dark: "#fff" }, // 可选：明暗分别配色
  },
} satisfies ChartConfig;
```

> `ChartContainer` 会自动把 `desktop.color` 注入为 `--color-desktop` CSS 变量，**Recharts 的 `fill="var(--color-desktop)"` 直接读取**。

### 8.4 Chart 主题 CSS 变量

`globals.css` 已内置 5 个 chart 变量：

```css
:root {
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
}
```

> shadcn Chart 是 **Recharts 的薄包装**——所有 Recharts 组件（`LineChart` / `AreaChart` / `PieChart` / `RadarChart` / `ScatterChart`）都可用，只是把样式 / tooltip / legend 统一了。

## 9. Combobox 自动补全

```bash
pnpm dlx shadcn@latest add combobox command popover
```

> **注**：shadcn 2026 起新增了独立 `Combobox` 组件（基于 Base UI），与早期「Command + Popover 自己组装」并存。

### 9.1 经典写法（Command + Popover）

```tsx
"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const frameworks = [
  { value: "next", label: "Next.js" },
  { value: "remix", label: "Remix" },
  { value: "astro", label: "Astro" },
  { value: "vite", label: "Vite" },
  { value: "tanstack", label: "TanStack Start" },
];

export function ComboboxDemo() {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {value
            ? frameworks.find((f) => f.value === value)?.label
            : "选择框架..."}
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="搜索框架..." />
          <CommandList>
            <CommandEmpty>未找到结果</CommandEmpty>
            <CommandGroup>
              {frameworks.map((f) => (
                <CommandItem
                  key={f.value}
                  value={f.value}
                  onSelect={(curr) => {
                    setValue(curr === value ? "" : curr);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4",
                      value === f.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {f.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

## 10. Blocks 模板系统

**Blocks 是复合 UI 模板**——不是单个组件，而是**整段业务场景**（Dashboard / Sidebar / Login / Authentication 等），**一次拷贝 5-10 个文件**。

### 10.1 Blocks 分类（截至 2026.5）

| 类别 | 示例 ID | 用途 |
|------|---------|------|
| **Dashboard** | `dashboard-01` ~ `dashboard-07` | 完整管理后台首页（侧边栏 + 顶栏 + 卡片 + 数据表） |
| **Sidebar** | `sidebar-01` ~ `sidebar-16` | 各种 Sidebar 变体（collapsible / 多级菜单 / 用户菜单） |
| **Login** | `login-01` ~ `login-05` | 登录页（含 OAuth 按钮 / 表单 / 插画） |
| **Signup** | `signup-01` ~ `signup-03` | 注册页 |
| **Authentication** | `authentication-01` ~ | OAuth 集成 / 双因素验证 |
| **Charts** | （在 [/charts](https://ui.shadcn.com/charts) 页） | 各种图表样式参考 |
| **Calendar** | `calendar-01` ~ | 日历 / 调度组件 |

### 10.2 使用 Block

```bash
# 查看可用 Block
pnpm dlx shadcn@latest search sidebar

# 添加 Block（一次拷贝多个文件）
pnpm dlx shadcn@latest add sidebar-07
# 等价：拷贝 app-sidebar.tsx + components/team-switcher.tsx + components/nav-main.tsx + ...

# 添加完整登录页
pnpm dlx shadcn@latest add login-03

# 添加完整 Dashboard
pnpm dlx shadcn@latest add dashboard-01
```

### 10.3 浏览所有 Blocks

访问 https://ui.shadcn.com/blocks 在线预览每个 Block 的外观。

## 11. Themes 色板系统

### 11.1 8 个 baseColor

| baseColor | 风格 |
|----------|------|
| `neutral` | 中性灰（默认） |
| `stone` | 暖灰 |
| `zinc` | 冷灰 |
| `mauve` | 紫灰 |
| `olive` | 橄榄灰 |
| `mist` | 雾蓝 |
| `taupe` | 灰褐 |
| `slate` | 石板蓝灰 |

### 11.2 Themes 在线生成器

访问 https://ui.shadcn.com/themes，可视化调整：

- baseColor（8 选 1）
- radius（0 / 0.3 / 0.5 / 0.75 / 1）
- font（Inter / Geist / Roboto / 等）
- icon library（Lucide / Radix / Tabler）

然后**生成 preset code**：

```text
preset:abc123def456
```

应用到项目：

```bash
pnpm dlx shadcn@latest apply abc123def456

# 只应用主题（不改字体）
pnpm dlx shadcn@latest apply abc123def456 --only theme
```

### 11.3 自定义 token

在 `globals.css` 添加自己的颜色 token：

```css
:root {
  /* 添加 warning 色 */
  --warning: oklch(0.84 0.16 84);
  --warning-foreground: oklch(0.28 0.07 46);
}

.dark {
  --warning: oklch(0.41 0.11 46);
  --warning-foreground: oklch(0.99 0.02 95);
}

/* 桥接到 Tailwind */
@theme inline {
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
}
```

现在可以用 `bg-warning text-warning-foreground` Tailwind 类。

## 12. Registry 私有分发

### 12.1 什么是 Registry

shadcn Registry **不是只有官方有**——任何人都能搭建自己的 Registry，发布自己的组件 / 模板 / 配置。

### 12.2 registry.json 结构

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry.json",
  "name": "acme",
  "homepage": "https://acme.com",
  "items": [
    {
      "name": "hello-world",
      "type": "registry:block",
      "title": "Hello World",
      "description": "一个示例组件",
      "registryDependencies": ["button", "@acme/input-form"],
      "dependencies": ["is-even@3.0.0", "motion"],
      "files": [
        {
          "path": "registry/new-york/hello-world/hello-world.tsx",
          "type": "registry:component"
        },
        {
          "path": "registry/new-york/hello-world/use-hello.ts",
          "type": "registry:hook"
        }
      ],
      "tailwind": {
        "config": {
          "theme": {
            "extend": {
              "colors": {
                "brand": "var(--brand)"
              }
            }
          }
        }
      },
      "cssVars": {
        "light": {
          "brand": "0 100% 50%"
        },
        "dark": {
          "brand": "0 100% 60%"
        }
      },
      "meta": {
        "iframeHeight": "600px"
      },
      "docs": "Read the docs at...",
      "categories": ["forms"]
    }
  ]
}
```

### 12.3 构建 Registry

```bash
# 项目根目录创建 registry.json + registry/* 源码
pnpm dlx shadcn@latest build ./registry.json -o ./public/r
# 生成 public/r/hello-world.json 等
```

部署 `public/r/` 到 CDN（如 acme.com/r/）。

### 12.4 使用私有 Registry

```bash
# 用 @acme 命名空间访问
pnpm dlx shadcn@latest add @acme/hello-world

# 或直接 URL
pnpm dlx shadcn@latest add https://acme.com/r/hello-world.json
```

### 12.5 在 components.json 注册

```json
{
  "registries": {
    "@acme": "https://acme.com/r/{name}.json"
  }
}
```

之后即可 `@acme/xxx` 短写。

### 12.6 著名第三方 Registry

| Registry | 命名空间 | 内容 |
|----------|---------|------|
| [Magic UI](https://magicui.design) | `@magicui` | 动画效果组件 |
| [Aceternity UI](https://ui.aceternity.com) | `@aceternity` | 复杂动画 + 3D |
| [Origin UI](https://originui.com) | `@originui` | 高质量业务组件 |
| [Park UI](https://park-ui.com) | `@parkui` | 多框架组件库 |
| [Tremor](https://tremor.so) | `@tremor` | Dashboard 组件 |

## 13. MCP Server AI 集成

### 13.1 安装

```bash
# 在你的项目根目录
pnpm dlx shadcn@latest mcp init --client claude
# 自动写 .mcp.json

# 或手动配置（见下）
```

### 13.2 Claude Code 配置

`.mcp.json`：

```json
{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": ["shadcn@latest", "mcp"]
    }
  }
}
```

### 13.3 Cursor 配置

`.cursor/mcp.json` 用同样结构，然后在 Cursor Settings 启用。

### 13.4 VS Code 配置

`.vscode/mcp.json` 同样结构，点击「Start」启动。

### 13.5 自然语言使用

```text
帮我加一个登录页
```

AI 自动调用 `shadcn add login-03`。

```text
帮我加 Button、Dialog、DropdownMenu
```

AI 自动调用 `shadcn add button dialog dropdown-menu`。

```text
查看 Sidebar 的 API 文档
```

AI 自动调用 `shadcn docs sidebar`。

## 14. Next.js App Router 完整集成

### 14.1 RSC vs Client Component 边界

```tsx
// app/page.tsx（Server Component，默认）
import { Button } from "@/components/ui/button";
import { LoginDialog } from "@/components/login-dialog";

export default function Home() {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">首页</h1>

      {/* Button 可以在 Server Component 渲染（仅 SSR HTML） */}
      <Button>静态按钮</Button>

      {/* LoginDialog 含 useState 必须 Client Component */}
      <LoginDialog />
    </main>
  );
}
```

```tsx
// components/login-dialog.tsx
"use client"; // 必须

import { useState } from "react";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";

export function LoginDialog() {
  const [open, setOpen] = useState(false);
  // ...
}
```

### 14.2 ThemeProvider 位置

`app/layout.tsx`：

```tsx
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### 14.3 components.json 配置 RSC

```json
{
  "rsc": true
}
```

CLI 自动在交互组件（Dialog / DropdownMenu / Form 等）头部加 `"use client"`。

## 15. monorepo 完整配置

### 15.1 初始化

```bash
pnpm dlx shadcn@latest init --monorepo

# 选择基础框架（next / vite / start）
# 创建 Turborepo 工作区
```

### 15.2 工作区结构

```text
my-monorepo/
├── apps/
│   └── web/                       # Next.js / Vite 应用
│       ├── src/
│       ├── package.json
│       └── components.json        # 应用级配置
├── packages/
│   └── ui/                        # 共享组件库
│       ├── src/
│       │   ├── components/        # shadcn 组件
│       │   ├── hooks/
│       │   ├── lib/
│       │   └── styles/globals.css
│       ├── package.json
│       └── components.json        # 库级配置
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

### 15.3 cross-workspace 引用

`packages/ui/package.json`：

```json
{
  "name": "@workspace/ui",
  "exports": {
    "./components/*": "./src/components/*.tsx",
    "./hooks/*": "./src/hooks/*.ts",
    "./lib/*": "./src/lib/*.ts",
    "./globals.css": "./src/styles/globals.css"
  }
}
```

`apps/web/components.json` aliases：

```json
{
  "aliases": {
    "components": "@workspace/ui/components",
    "utils": "@workspace/ui/lib/utils",
    "ui": "@workspace/ui/components",
    "lib": "@workspace/ui/lib",
    "hooks": "@workspace/ui/hooks"
  }
}
```

### 15.4 add 命令工作流

```bash
# 在 apps/web 目录运行
cd apps/web
pnpm dlx shadcn@latest add button
# CLI 自动识别 monorepo
# 把 button.tsx 放到 packages/ui/src/components/
# 把依赖装到正确的 package.json
```

> **关键约束**：所有 workspace 的 `style` / `iconLibrary` / `baseColor` **必须一致**。

## 16. 自定义与改造拷贝来的代码

### 16.1 添加新 variant

打开 `src/components/ui/button.tsx`，在 `buttonVariants` 添加：

```ts
const buttonVariants = cva("...", {
  variants: {
    variant: {
      default: "...",
      destructive: "...",
      outline: "...",
      // 自定义新增
      success: "bg-green-600 text-white hover:bg-green-700",
      warning: "bg-amber-500 text-white hover:bg-amber-600",
    },
  },
});
```

立即可用 `<Button variant="success">` —— TypeScript 自动推导。

### 16.2 修改默认尺寸

```ts
const buttonVariants = cva("...", {
  variants: {
    size: {
      // 调整默认高度
      default: "h-10 px-4 py-2",  // 原 h-9
      sm: "h-8 px-3",
      lg: "h-12 px-8",            // 原 h-10
      icon: "size-10",            // 原 size-9
    },
  },
});
```

### 16.3 替换默认图标库

```bash
# CLI 自动迁移
pnpm dlx shadcn@latest migrate icons
# 选 lucide → radix-icons / tabler-icons
```

`components.json` 更新：

```json
{
  "iconLibrary": "radix"
}
```

之后 `add` 的新组件会用 Radix Icons。**旧拷贝的组件需要手动改 import**。

### 16.4 自定义文件夹结构

```json
{
  "aliases": {
    "ui": "@/widgets/shadcn",
    "components": "@/widgets",
    "hooks": "@/widgets/hooks",
    "lib": "@/widgets/lib"
  }
}
```

`pnpm dlx shadcn@latest add button` 会拷贝到 `src/widgets/shadcn/button.tsx`。

## 17. 常见踩坑

### 17.1 components.json `style` 选错无法改

```json
{
  "style": "new-york"  // 选错只能删除 components.json 重新 init
}
```

**初始化前请确认风格选择**。

### 17.2 Tailwind v4 升级踩坑

v3 → v4 主要变化：

| v3 | v4 |
|----|----|
| `tailwind.config.js` 必须 | 可省略（用 `@theme inline`） |
| `tailwindcss-animate` 插件 | `@import "tw-animate-css"` |
| `@tailwind base/components/utilities` | `@import "tailwindcss"` |
| `dark: { ... }` config | `@custom-variant dark (&:is(.dark *))` |
| HSL 颜色变量 | OKLCH（推荐） |

```bash
# CLI 辅助迁移（部分自动）
pnpm dlx shadcn@latest migrate radix
```

剩余手动改：

1. 删除 `tailwind.config.js`（或保留为空对象）
2. `globals.css` 用 `@import "tailwindcss"` 替代 `@tailwind`
3. 用 `@theme inline { --color-primary: var(--primary) }` 桥接变量

### 17.3 `cn()` 顺序问题

```ts
// 错误：base 类在后会覆盖传入的 className
cn(className, "base-class")

// 正确：base 在前，传入的 className 在后覆盖
cn("base-class", className)
```

**shadcn 所有组件遵循「base 在前、props 在后」原则**。

### 17.4 next-themes Hydration 闪烁

**症状**：首次加载页面瞬间从浅色闪到深色。

**原因**：SSR 期间无法读取 localStorage 主题偏好，**默认输出 light，然后 client 端切换为 dark**。

**解决**：

```tsx
// app/layout.tsx
<html lang="zh-CN" suppressHydrationWarning>
  <body>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange  // 关键：禁用 transition 避免闪烁
    >
```

如果还闪，next-themes 提供了 `<script>` 注入方案（v0.3+ 自动）：在 SSR 输出的 HTML 头部注入小脚本提前读 localStorage 设置 class。

### 17.5 asChild 多元素错误

```tsx
// 错误：Children.only expected single React element
<DialogTrigger asChild>
  <Button>登录</Button>
  <span>说明</span>
</DialogTrigger>

// 正确：单个 React 元素
<DialogTrigger asChild>
  <Button>
    登录 <span>说明</span>
  </Button>
</DialogTrigger>
```

### 17.6 OKLCH 浏览器兼容

| 浏览器 | OKLCH 支持版本 |
|--------|---------------|
| Chrome | 111+ |
| Edge | 111+ |
| Safari | 15.4+ |
| Firefox | 113+ |

**降级方案**（针对需要兼容旧浏览器的项目）：

```css
:root {
  --primary: oklch(0.205 0 0);
  --primary-fallback: hsl(0 0% 9%);
}

body {
  background-color: var(--primary-fallback);
  background-color: var(--primary);  /* 现代浏览器覆盖 */
}
```

### 17.7 cva variant 类型推导失效

```ts
// 错误：少了 satisfies
const buttonVariants = cva("base", {
  variants: { variant: { default: "..." } },
}) // VariantProps 推导为 unknown

// 正确
const buttonVariants = cva("base", {
  variants: {
    variant: { default: "..." } as const, // 或不加
  },
  defaultVariants: { variant: "default" }, // 明确默认
});

type Props = VariantProps<typeof buttonVariants>; // 正确推导
```

### 17.8 Sonner Toast 不显示

**检查清单**：

1. `<Toaster />` 是否在 layout.tsx 加了
2. `<Toaster />` 是否在 ThemeProvider **内部**（外部会导致主题不同步）
3. `toast()` 调用方是否 `"use client"`

### 17.9 Form 错误信息显示不出来

```tsx
// 错误：缺 <FormMessage />
<FormField
  render={({ field }) => (
    <FormItem>
      <FormLabel>邮箱</FormLabel>
      <FormControl><Input {...field} /></FormControl>
      {/* 没有 FormMessage */}
    </FormItem>
  )}
/>

// 正确
<FormField
  render={({ field }) => (
    <FormItem>
      <FormLabel>邮箱</FormLabel>
      <FormControl><Input {...field} /></FormControl>
      <FormMessage />  {/* 必须 */}
    </FormItem>
  )}
/>
```

### 17.10 DataTable 大数据卡顿

**Recharts 自身性能瓶颈**——数据 1000+ 行开始明显。**方案**：

1. 服务端分页（`getPaginationRowModel` 替换为手动 onPaginationChange）
2. 虚拟滚动（用 [TanStack Virtual](https://tanstack.com/virtual)）
3. 改用 [AG Grid](https://www.ag-grid.com) 等专业 DataGrid（不是 shadcn 方案）

### 17.11 monorepo `cn()` 路径错误

每个 workspace 的 `components.json` 都要正确配置 `aliases.utils`：

```json
{
  "aliases": {
    "utils": "@workspace/ui/lib/utils"
  }
}
```

### 17.12 lucide-react 图标尺寸不对

shadcn Button / Item 等组件用 `[&_svg]:size-4` 自动设置 svg 大小——**显式 `<Icon className="size-5">` 会覆盖**：

```tsx
<Button>
  <Mail />            {/* 自动 size-4 */}
  <Mail className="size-5" />  {/* 手动 size-5 覆盖 */}
</Button>
```

## 18. 升级与维护

### 18.1 升级 shadcn CLI

```bash
# pnpm dlx 总是用 @latest，无需升级
pnpm dlx shadcn@latest --version
```

### 18.2 diff 检查更新

```bash
# 检查本地组件是否落后于 registry 最新
pnpm dlx shadcn@latest diff
```

会输出每个组件的差异，**你决定是否合并**。

### 18.3 强制覆盖

```bash
pnpm dlx shadcn@latest add button -o
# 重新拷贝最新 button.tsx，覆盖你的本地版
```

**警告**：会丢失你的本地修改！**先 `git diff` 备份**。

### 18.4 v3 → v4 大版本升级

```bash
# 自动迁移
pnpm dlx shadcn@latest migrate radix
pnpm dlx shadcn@latest migrate icons

# 手动检查
git diff components.json
git diff globals.css
```

## 19. 完成指南后

掌握上述内容后，可继续阅读：

- [参考](./reference.md)：70+ 组件 API 速查 / CLI 完整命令表 / components.json 全字段 / CSS 变量 token / cva API / TypeScript 类型 / Blocks 列表 / Themes 列表
- [shadcn/ui 官方文档](https://ui.shadcn.com/docs)
- [Radix Primitives 文档](https://www.radix-ui.com/primitives)
- [Tailwind CSS v4 文档](https://tailwindcss.com/docs)
- [react-hook-form 文档](https://react-hook-form.com/get-started)
- [zod 文档](https://zod.dev)
- [@tanstack/react-table 文档](https://tanstack.com/table/v8)
- [Recharts 文档](https://recharts.org)
- [Sonner 文档](https://sonner.emilkowal.ski)
