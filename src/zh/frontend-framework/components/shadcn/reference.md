---
layout: doc
outline: [2, 3]
---

# shadcn/ui 参考

本文为 **shadcn@4.7.x（2026 年 5 月稳定版）** 的 API 速查文档——70+ 组件清单、CLI 完整命令表、components.json 字段、CSS 变量 token、`cva` API、TypeScript 类型、Blocks 列表、Themes 列表、Registry schema、MCP 配置一站式查询。

> 完整概念与示例见 [入门](./getting-started.md) 与 [指南](./guide-line.md)。

## 1. 70+ 组件完整清单

### 1.1 Forms（11 + 个）

| 组件 | CLI add | 底层依赖 | 一句话 |
|------|---------|---------|--------|
| `Button` | `button` | `@radix-ui/react-slot` + cva | 6 variant + 4 size 按钮 |
| `Checkbox` | `checkbox` | `@radix-ui/react-checkbox` | 复选框 |
| `Input` | `input` | - | 文本输入框 |
| `Input Group` | `input-group` | - | 输入框组（前后缀） |
| `Input OTP` | `input-otp` | `input-otp` | OTP 验证码 |
| `Label` | `label` | `@radix-ui/react-label` | 表单标签 |
| `Native Select` | `native-select` | - | 原生 select |
| `Radio Group` | `radio-group` | `@radix-ui/react-radio-group` | 单选组 |
| `Select` | `select` | `@radix-ui/react-select` | 美化下拉 |
| `Switch` | `switch` | `@radix-ui/react-switch` | 开关 |
| `Textarea` | `textarea` | - | 多行输入 |
| `Toggle` | `toggle` | `@radix-ui/react-toggle` | 单按钮开关 |
| `Toggle Group` | `toggle-group` | `@radix-ui/react-toggle-group` | 按钮组开关 |

### 1.2 Overlay（8 个）

| 组件 | CLI add | 底层依赖 | 一句话 |
|------|---------|---------|--------|
| `Alert Dialog` | `alert-dialog` | `@radix-ui/react-alert-dialog` | 强制确认对话框 |
| `Context Menu` | `context-menu` | `@radix-ui/react-context-menu` | 右键菜单 |
| `Dialog` | `dialog` | `@radix-ui/react-dialog` | 模态对话框 |
| `Drawer` | `drawer` | `vaul` | 移动 / 桌面通用抽屉 |
| `Hover Card` | `hover-card` | `@radix-ui/react-hover-card` | 悬停卡片 |
| `Popover` | `popover` | `@radix-ui/react-popover` | 弹出气泡 |
| `Sheet` | `sheet` | `@radix-ui/react-dialog` | 4 方向侧边面板 |
| `Tooltip` | `tooltip` | `@radix-ui/react-tooltip` | 提示气泡 |

### 1.3 Navigation（6 个）

| 组件 | CLI add | 底层依赖 | 一句话 |
|------|---------|---------|--------|
| `Breadcrumb` | `breadcrumb` | - | 面包屑 |
| `Dropdown Menu` | `dropdown-menu` | `@radix-ui/react-dropdown-menu` | 下拉菜单 |
| `Menubar` | `menubar` | `@radix-ui/react-menubar` | macOS 风格菜单栏 |
| `Navigation Menu` | `navigation-menu` | `@radix-ui/react-navigation-menu` | 大型导航菜单 |
| `Pagination` | `pagination` | - | 分页 |
| `Sidebar` | `sidebar` | 复合 | 完整侧边栏方案 |

### 1.4 Display（12 个）

| 组件 | CLI add | 底层依赖 | 一句话 |
|------|---------|---------|--------|
| `Accordion` | `accordion` | `@radix-ui/react-accordion` | 手风琴 |
| `Alert` | `alert` | - | 警告提示 |
| `Avatar` | `avatar` | `@radix-ui/react-avatar` | 头像（带 Fallback） |
| `Badge` | `badge` | cva | 徽章 |
| `Card` | `card` | - | 卡片容器 |
| `Empty` | `empty` | - | 空状态 |
| `Kbd` | `kbd` | - | 键盘按键 |
| `Separator` | `separator` | `@radix-ui/react-separator` | 分隔线 |
| `Skeleton` | `skeleton` | - | 骨架屏 |
| `Spinner` | `spinner` | - | 加载旋转 |
| `Table` | `table` | - | 基础表格 |
| `Typography` | - | - | 标题段落语义类 |

### 1.5 Selection / Interaction（6 个）

| 组件 | CLI add | 底层依赖 | 一句话 |
|------|---------|---------|--------|
| `Button Group` | `button-group` | - | 按钮组 |
| `Collapsible` | `collapsible` | `@radix-ui/react-collapsible` | 单项折叠 |
| `Combobox` | `combobox` | Base UI 或 Command+Popover | 自动补全下拉 |
| `Command` | `command` | `cmdk` | 命令面板（cmd+k） |
| `Item` | `item` | - | 列表项 |
| `Tabs` | `tabs` | `@radix-ui/react-tabs` | 标签页 |

### 1.6 Layout（5 个）

| 组件 | CLI add | 底层依赖 | 一句话 |
|------|---------|---------|--------|
| `Aspect Ratio` | `aspect-ratio` | `@radix-ui/react-aspect-ratio` | 宽高比容器 |
| `Direction` | `direction` | `@radix-ui/react-direction` | RTL 方向 |
| `Field` | `field` | `@radix-ui/react-slot` | 表单字段封装 |
| `Resizable` | `resizable` | `react-resizable-panels` | 可拖拽分屏 |
| `Scroll Area` | `scroll-area` | `@radix-ui/react-scroll-area` | 自定义滚动条 |

### 1.7 Specialized（12+ 个）

| 组件 | CLI add | 底层依赖 | 一句话 |
|------|---------|---------|--------|
| `Calendar` | `calendar` | `react-day-picker` | 日历 |
| `Carousel` | `carousel` | `embla-carousel-react` | 轮播图 |
| `Chart` | `chart` | `recharts` | 数据可视化包装 |
| `Data Table` | - (文档) | `@tanstack/react-table` | 数据表格模板 |
| `Date Picker` | - (文档) | Calendar + Popover | 日期选择器 |
| `Form` | `form` | `react-hook-form` + `@hookform/resolvers` | 表单状态管理 |
| `Progress` | `progress` | `@radix-ui/react-progress` | 进度条 |
| `Slider` | `slider` | `@radix-ui/react-slider` | 范围滑块 |
| `Sonner` | `sonner` | `sonner` | 现代 Toast |
| `Toast` | `toast` | `@radix-ui/react-toast` | 旧 Toast |

## 2. CLI 完整命令

### 2.1 init

```bash
pnpm dlx shadcn@latest init [options]
```

| Option | 说明 |
|--------|------|
| `-t, --template <name>` | 框架模板：`next` / `vite` / `start` / `react-router` / `astro` / `laravel` |
| `-b, --base <type>` | 底层库：`radix`（默认）/ `base` |
| `-p, --preset <code>` | 用 Preset 配置 |
| `-d, --defaults` | 默认设置 |
| `-f, --force` | 强制覆盖 |
| `--css-variables` / `--no-css-variables` | CSS 变量开关 |
| `--monorepo` / `--no-monorepo` | Monorepo 模式 |
| `--rtl` / `--no-rtl` | RTL 支持 |
| `--pointer` / `--no-pointer` | 按钮 cursor: pointer |
| `--name <name>` | 项目名 |
| `--cwd <path>` | 工作目录 |

### 2.2 add

```bash
pnpm dlx shadcn@latest add [components...] [options]
```

| Option | 说明 |
|--------|------|
| `-y, --yes` | 跳过确认 |
| `-o, --overwrite` | 覆盖现有文件 |
| `-a, --all` | 添加全部组件 |
| `-p, --path <path>` | 自定义路径 |
| `--dry-run` | 预览不写入 |
| `--cwd <path>` | 工作目录 |

```bash
# 单组件
pnpm dlx shadcn@latest add button

# 多组件
pnpm dlx shadcn@latest add button dialog dropdown-menu

# Block
pnpm dlx shadcn@latest add login-03 sidebar-07

# 私有 Registry
pnpm dlx shadcn@latest add @acme/my-component

# URL 直接安装
pnpm dlx shadcn@latest add https://acme.com/r/widget.json

# 全部
pnpm dlx shadcn@latest add -a -y
```

### 2.3 build

```bash
pnpm dlx shadcn@latest build <registry.json> [options]
```

| Option | 说明 |
|--------|------|
| `-o, --output <dir>` | 输出目录（默认 `public/r`） |
| `--registry <name>` | Registry 名称 |
| `--cwd <path>` | 工作目录 |

### 2.4 apply

```bash
pnpm dlx shadcn@latest apply <preset-code> [options]
```

| Option | 说明 |
|--------|------|
| `--only <part>` | 只应用：`theme` / `font` |
| `-y, --yes` | 跳过确认 |

### 2.5 view

```bash
pnpm dlx shadcn@latest view <name> [options]
```

预览组件源码（不安装）。支持 `@namespace/name`。

### 2.6 search / list

```bash
pnpm dlx shadcn@latest search <query> [options]
pnpm dlx shadcn@latest list [options]
```

| Option | 说明 |
|--------|------|
| `-q, --query <text>` | 搜索词 |
| `-l, --limit <n>` | 最大结果数 |
| `-o, --offset <n>` | 跳过数 |

### 2.7 docs

```bash
pnpm dlx shadcn@latest docs <component>
```

| Option | 说明 |
|--------|------|
| `-b, --base <type>` | radix / base |
| `--json` | JSON 输出 |

获取组件文档（AI 友好）。

### 2.8 info

```bash
pnpm dlx shadcn@latest info [options]
```

| Option | 说明 |
|--------|------|
| `--json` | JSON 输出 |

显示当前项目配置。

### 2.9 migrate

```bash
pnpm dlx shadcn@latest migrate <migration>
```

| Migration | 作用 |
|-----------|------|
| `icons` | 切换图标库（lucide / radix / tabler） |
| `radix` | Radix 1.x → 2.x |
| `rtl` | 启用 RTL |

### 2.10 preset

```bash
pnpm dlx shadcn@latest preset decode <code>     # 解码 Preset 内容
pnpm dlx shadcn@latest preset resolve <code>    # 解析最终配置
pnpm dlx shadcn@latest preset url <code>        # 获取 Preset URL
pnpm dlx shadcn@latest preset open <code>       # 浏览器打开
```

### 2.11 mcp

```bash
pnpm dlx shadcn@latest mcp [command]
```

| Subcommand | 说明 |
|------------|------|
| `init --client claude` | 配置 Claude Code |
| `init --client cursor` | 配置 Cursor |
| `init --client vscode` | 配置 VS Code |

## 3. components.json 字段速查

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide",
  "registries": {
    "@acme": "https://acme.com/r/{name}.json"
  }
}
```

| 字段 | 类型 | 默认值 | 初始化后可改 | 说明 |
|------|------|--------|------------|------|
| `$schema` | string | - | 是 | JSON Schema |
| `style` | `"new-york"` / `"default"` / `"sera"` | `"new-york"` | **否** | 视觉风格 |
| `rsc` | boolean | `false` | 是 | React Server Components 支持 |
| `tsx` | boolean | `true` | 是 | TypeScript vs JavaScript |
| `tailwind.config` | string | `""` | 是 | tailwind.config.js 路径（v4 留空） |
| `tailwind.css` | string | - | 是 | globals.css 路径 |
| `tailwind.baseColor` | string | `"neutral"` | **否** | 8 选 1 |
| `tailwind.cssVariables` | boolean | `true` | **否** | 用 CSS 变量 vs 直接 Tailwind 类 |
| `tailwind.prefix` | string | `""` | 是 | utility 类前缀（如 `"tw-"`） |
| `aliases.components` | string | `"@/components"` | 是 | 组件目录 |
| `aliases.utils` | string | `"@/lib/utils"` | 是 | utils 路径 |
| `aliases.ui` | string | `"@/components/ui"` | 是 | UI 组件路径 |
| `aliases.lib` | string | `"@/lib"` | 是 | lib 目录 |
| `aliases.hooks` | string | `"@/hooks"` | 是 | hooks 目录 |
| `iconLibrary` | `"lucide"` / `"radix"` / `"tabler"` | `"lucide"` | 是 | 图标库 |
| `registries` | object | `{}` | 是 | 自定义 Registry 命名空间 |

### 3.1 `baseColor` 8 个选项

| Value | 风格 |
|-------|------|
| `neutral` | 中性灰（默认） |
| `stone` | 暖灰 |
| `zinc` | 冷灰 |
| `mauve` | 紫灰 |
| `olive` | 橄榄灰 |
| `mist` | 雾蓝 |
| `taupe` | 灰褐 |
| `slate` | 石板蓝灰 |

## 4. CSS 变量 token 完整清单

### 4.1 基础色 token

| Variable | 用途 |
|----------|------|
| `--background` | 默认页面背景 |
| `--foreground` | 默认前景文字 |
| `--card` | 卡片背景 |
| `--card-foreground` | 卡片前景 |
| `--popover` | Popover / Dialog / Dropdown 背景 |
| `--popover-foreground` | Popover 前景 |
| `--primary` | 主操作色 |
| `--primary-foreground` | 主操作前景 |
| `--secondary` | 次操作色 |
| `--secondary-foreground` | 次操作前景 |
| `--muted` | 静音色（次要区域） |
| `--muted-foreground` | 静音前景（次要文字） |
| `--accent` | 强调色（hover / focus） |
| `--accent-foreground` | 强调前景 |
| `--destructive` | 危险色（删除 / 错误） |
| `--destructive-foreground` | 危险前景 |
| `--border` | 边框 |
| `--input` | 输入框边框 |
| `--ring` | 焦点环 |
| `--radius` | 基础圆角（其他 radius 派生） |

### 4.2 派生 radius

```css
--radius-sm: calc(var(--radius) - 4px);
--radius-md: calc(var(--radius) - 2px);
--radius-lg: var(--radius);
--radius-xl: calc(var(--radius) + 4px);
```

### 4.3 Chart 配色

| Variable | 用途 |
|----------|------|
| `--chart-1` | 图表系列 1 |
| `--chart-2` | 图表系列 2 |
| `--chart-3` | 图表系列 3 |
| `--chart-4` | 图表系列 4 |
| `--chart-5` | 图表系列 5 |

### 4.4 Sidebar 专用

| Variable | 用途 |
|----------|------|
| `--sidebar` | Sidebar 背景 |
| `--sidebar-foreground` | Sidebar 前景 |
| `--sidebar-primary` | Sidebar 主色 |
| `--sidebar-primary-foreground` | Sidebar 主色前景 |
| `--sidebar-accent` | Sidebar 强调 |
| `--sidebar-accent-foreground` | Sidebar 强调前景 |
| `--sidebar-border` | Sidebar 边框 |
| `--sidebar-ring` | Sidebar 焦点环 |

### 4.5 `@theme inline` 桥接

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  /* ...其余 token 同样桥接 */

  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);

  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  /* ... */
}
```

之后 Tailwind 即可使用 `bg-background` / `text-foreground` / `bg-primary` / `fill-chart-1` / `bg-sidebar` 等 utility。

## 5. `cn()` 函数完整签名

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string;
```

### 5.1 ClassValue 类型

```ts
type ClassValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | ClassValue[]
  | { [key: string]: any };
```

### 5.2 用法示例

```ts
cn("px-2", "py-1");                            // "px-2 py-1"
cn("px-2", isActive && "bg-blue-500");         // 条件
cn({ "bg-red-500": isError });                 // 对象语法
cn(["px-2", "py-1"]);                          // 数组语法
cn("px-2", "px-4");                            // → "px-4"（冲突解决）
cn("bg-red-500", "bg-blue-500");               // → "bg-blue-500"
cn("text-sm md:text-base", "md:text-lg");      // 保留 text-sm，md:text-lg 覆盖 md:text-base
```

## 6. `cva` API 完整签名

```ts
import { cva, type VariantProps } from "class-variance-authority";

cva(base, config): (props) => string
```

### 6.1 Config 结构

```ts
type Config = {
  variants?: Record<string, Record<string, string>>;
  defaultVariants?: Record<string, string>;
  compoundVariants?: Array<{
    [variantKey: string]: string | string[];
    className: string;
  }>;
};
```

### 6.2 完整示例

```ts
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        outline: "border border-input bg-background",
      },
      size: {
        sm: "h-8 px-3",
        md: "h-9 px-4",
        lg: "h-10 px-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
    compoundVariants: [
      {
        variant: "outline",
        size: "sm",
        className: "border-dashed",
      },
    ],
  },
);

// 自动 TypeScript
type Props = VariantProps<typeof buttonVariants>;
// type Props = {
//   variant?: "default" | "outline" | null | undefined;
//   size?: "sm" | "md" | "lg" | null | undefined;
// }
```

## 7. react-hook-form + zod 关键 API

### 7.1 useForm

```ts
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const form = useForm<FormValues>({
  resolver: zodResolver(schema),
  defaultValues: {...},
  mode: "onSubmit",   // "onChange" / "onBlur" / "onTouched" / "all"
});
```

| Return | 说明 |
|--------|------|
| `form.control` | 传给 `<FormField control>` |
| `form.register(name)` | 注册原生 input |
| `form.handleSubmit(onValid, onInvalid?)` | 包装 submit |
| `form.watch(name?)` | 监听字段值 |
| `form.setValue(name, value)` | 设值 |
| `form.reset(values?)` | 重置表单 |
| `form.getValues()` | 获取所有值 |
| `form.formState` | `{ errors, isDirty, isSubmitting, isValid, ... }` |

### 7.2 zod 关键 API

```ts
import { z } from "zod";

// 基础类型
z.string();
z.number();
z.boolean();
z.date();
z.array(z.string());
z.object({ name: z.string() });

// 链式校验
z.string().min(2).max(20).email();
z.number().int().positive().lt(100);
z.string().regex(/^[A-Z]+$/);

// 可选
z.string().optional();
z.string().nullable();

// 默认值
z.string().default("hello");

// 自定义错误
z.string().min(2, "至少 2 个字符");

// 类型推导
type FormValues = z.infer<typeof schema>;

// 跨字段校验
z.object({
  password: z.string(),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: "不一致",
  path: ["confirm"],
});

// transform
z.string().transform((v) => v.trim());
```

### 7.3 shadcn Form 组件

```tsx
<Form {...form}>            // 包装 RHF FormProvider
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="email"
      render={({ field, fieldState, formState }) => (
        <FormItem>           // 容器
          <FormLabel>邮箱</FormLabel>  // <label htmlFor>
          <FormControl>      // <Slot id, aria-describedby, aria-invalid>
            <Input {...field} />
          </FormControl>
          <FormDescription>说明文字</FormDescription>  // <p id>
          <FormMessage />    // 错误显示
        </FormItem>
      )}
    />
  </form>
</Form>
```

### 7.4 useFormField hook

shadcn 内部 hook，可在自定义 FormItem 内使用：

```ts
const { id, name, formItemId, formDescriptionId, formMessageId, error } =
  useFormField();
```

## 8. @tanstack/react-table 关键 API

### 8.1 useReactTable

```ts
const table = useReactTable({
  data,                              // 数据数组
  columns,                           // 列定义
  state: {
    sorting,
    columnFilters,
    columnVisibility,
    rowSelection,
    pagination,
  },
  onSortingChange,
  onColumnFiltersChange,
  onColumnVisibilityChange,
  onRowSelectionChange,
  onPaginationChange,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getFacetedRowModel: getFacetedRowModel(),
  getFacetedUniqueValues: getFacetedUniqueValues(),
});
```

### 8.2 列定义

```ts
import { type ColumnDef } from "@tanstack/react-table";

const columns: ColumnDef<MyData>[] = [
  {
    accessorKey: "email",
    header: "邮箱",
    cell: ({ row }) => row.getValue("email"),
    enableSorting: true,
    enableHiding: true,
    enableColumnFilter: true,
    filterFn: "includesString",
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionMenu data={row.original} />,
    enableSorting: false,
    enableHiding: false,
  },
];
```

### 8.3 table 实例方法

| 方法 | 说明 |
|------|------|
| `table.getHeaderGroups()` | 表头分组 |
| `table.getRowModel()` | 渲染行模型 |
| `table.getFilteredRowModel()` | 过滤后行 |
| `table.getFilteredSelectedRowModel()` | 已选行 |
| `table.previousPage() / nextPage()` | 翻页 |
| `table.getCanPreviousPage() / getCanNextPage()` | 翻页可用 |
| `table.setPageIndex(n)` | 跳页 |
| `table.setPageSize(n)` | 每页条数 |
| `table.getAllColumns()` | 所有列 |
| `table.getColumn(id)` | 按 id 取列 |

## 9. Blocks 完整列表（截至 2026.5）

### 9.1 Sidebar Blocks（sidebar-01 ~ sidebar-16）

| Block ID | 风格 |
|----------|------|
| `sidebar-01` | 简单浮动 sidebar + 折叠图标 |
| `sidebar-02` | 多组导航 + 用户菜单 |
| `sidebar-03` | 团队切换 + 多级菜单 |
| `sidebar-04` | 浮动 + 暗色主题 |
| `sidebar-05` | 二级菜单悬浮 |
| `sidebar-06` | 嵌套子菜单 |
| `sidebar-07` | 经典 Dashboard sidebar |
| `sidebar-08` | 仅图标模式 |
| `sidebar-09` | Inset 风格 |
| `sidebar-10` | 简洁右侧 sidebar |
| `sidebar-11` | 带搜索 + 团队 |
| `sidebar-12` | 浮动 + 顶部头像 |
| `sidebar-13` | 双侧 sidebar |
| `sidebar-14` | 多级菜单 |
| `sidebar-15` | 标签页式 sidebar |
| `sidebar-16` | 极简 sidebar |

### 9.2 Login Blocks（login-01 ~ login-05）

| Block ID | 风格 |
|----------|------|
| `login-01` | 简单卡片登录 |
| `login-02` | 双栏登录（左表单 / 右插画） |
| `login-03` | OAuth + 邮箱登录 |
| `login-04` | 居中卡片 + 多 OAuth |
| `login-05` | 全屏背景图 + 登录卡 |

### 9.3 Signup Blocks（signup-01 ~ signup-03）

| Block ID | 风格 |
|----------|------|
| `signup-01` | 简单注册 |
| `signup-02` | 双栏注册 |
| `signup-03` | 多步骤注册 |

### 9.4 Dashboard Blocks（dashboard-01 ~ dashboard-07）

| Block ID | 风格 |
|----------|------|
| `dashboard-01` | 经典数据 Dashboard |
| `dashboard-02` | 设置页 |
| `dashboard-03` | 表单 Dashboard |
| `dashboard-04` | Charts 多图表 |
| `dashboard-05` | 数据表 + 卡片 |
| `dashboard-06` | 简洁 Dashboard |
| `dashboard-07` | 多 sidebar 复杂 Dashboard |

### 9.5 Authentication Blocks

| Block ID | 内容 |
|----------|------|
| `authentication-01` | 二因素验证 |
| `authentication-02` | OTP 输入 |
| `authentication-03` | 重置密码 |

### 9.6 Charts Blocks

访问 [/charts](https://ui.shadcn.com/charts) 查看 50+ 图表样例（柱状 / 折线 / 饼图 / 雷达 / 散点 / 等）。

### 9.7 Calendar Blocks

| Block ID | 用途 |
|----------|------|
| `calendar-01` | 基础日历 |
| `calendar-02` | 范围选择 |
| `calendar-03` | 多月显示 |
| `calendar-04` | 带 schedule |

## 10. Registry schema

### 10.1 registry.json

```ts
type Registry = {
  $schema: "https://ui.shadcn.com/schema/registry.json";
  name: string;
  homepage: string;
  items: RegistryItem[];
};
```

### 10.2 registry-item

```ts
type RegistryItem = {
  // 基础
  $schema?: string;
  name: string;
  type: RegistryItemType;
  title?: string;
  description?: string;
  author?: string;

  // 依赖
  registryDependencies?: string[];  // 其他 registry item
  dependencies?: string[];          // npm 包
  devDependencies?: string[];

  // 文件
  files: RegistryFile[];

  // 样式
  tailwind?: {
    config?: object;                // tailwind.config.js extend
  };
  cssVars?: {
    light?: Record<string, string>;
    dark?: Record<string, string>;
    theme?: Record<string, string>;
  };

  // 元数据
  meta?: {
    iframeHeight?: string;
    [key: string]: any;
  };
  docs?: string;
  categories?: string[];
};

type RegistryItemType =
  | "registry:lib"        // 工具函数
  | "registry:block"      // 完整 Block
  | "registry:component"  // 单组件
  | "registry:ui"         // shadcn UI 组件
  | "registry:hook"       // React hook
  | "registry:page"       // 完整页面
  | "registry:file"       // 任意文件
  | "registry:style"      // 主题
  | "registry:theme";     // 完整主题

type RegistryFile = {
  path: string;
  type: RegistryItemType;
  content?: string;
  target?: string;        // 目标路径（不同于 path）
};
```

### 10.3 完整示例

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry.json",
  "name": "acme",
  "homepage": "https://acme.com",
  "items": [
    {
      "name": "fancy-button",
      "type": "registry:component",
      "title": "Fancy Button",
      "description": "一个动画按钮",
      "registryDependencies": ["button"],
      "dependencies": ["motion@10.0.0"],
      "files": [
        {
          "path": "registry/new-york/fancy-button/fancy-button.tsx",
          "type": "registry:component"
        }
      ],
      "tailwind": {
        "config": {
          "theme": {
            "extend": {
              "colors": { "brand": "var(--brand)" }
            }
          }
        }
      },
      "cssVars": {
        "light": { "brand": "oklch(0.5 0.2 240)" },
        "dark": { "brand": "oklch(0.7 0.2 240)" }
      },
      "categories": ["buttons"]
    }
  ]
}
```

## 11. MCP Server 配置

### 11.1 .mcp.json（Claude Code）

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

### 11.2 .cursor/mcp.json（Cursor）

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

### 11.3 .vscode/mcp.json（VS Code）

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

### 11.4 MCP 工具能力

| 工具 | 说明 |
|------|------|
| `list-components` | 列出所有可安装组件 |
| `search-components` | 搜索组件 |
| `add-components` | 安装组件 |
| `get-component-docs` | 获取文档 |
| `list-blocks` | 列出 Blocks |

## 12. TypeScript 核心类型

### 12.1 cva 类型

```ts
import { type VariantProps } from "class-variance-authority";

const buttonVariants = cva(...);
type ButtonVariants = VariantProps<typeof buttonVariants>;
```

### 12.2 ChartConfig

```ts
import { type ChartConfig } from "@/components/ui/chart";

const config = {
  desktop: {
    label: "桌面",
    color: "var(--chart-1)",
    icon?: React.ComponentType,
    theme?: { light: string; dark: string },
  },
} satisfies ChartConfig;
```

### 12.3 Form 类型

```ts
type FieldValues = Record<string, any>;

type ControllerRenderProps<TFieldValues, TName> = {
  onChange: (...event: any[]) => void;
  onBlur: () => void;
  value: any;
  name: string;
  ref: React.Ref<any>;
  disabled?: boolean;
};
```

### 12.4 Sidebar 类型

```ts
type SidebarContextProps = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const useSidebar: () => SidebarContextProps;
```

### 12.5 Theme（next-themes）

```ts
import { useTheme } from "next-themes";

const {
  theme,        // "light" / "dark" / "system" / undefined
  themes,       // ["light", "dark", "system"]
  setTheme,     // (theme: string) => void
  resolvedTheme,// 实际应用的（system → light/dark）
  systemTheme,  // 系统偏好
  forcedTheme,  // 强制主题
} = useTheme();
```

## 13. 关键 Hook 速查

| Hook | 来源 | 用途 |
|------|------|------|
| `useTheme()` | next-themes | 主题切换 |
| `useSidebar()` | shadcn/ui sidebar | Sidebar 状态 |
| `useFormField()` | shadcn/ui form | FormItem 内部 |
| `useForm()` | react-hook-form | 表单状态 |
| `useFieldArray()` | react-hook-form | 动态字段 |
| `useReactTable()` | @tanstack/react-table | 表格状态 |
| `useToast()` | shadcn/ui toast（旧） | 旧 Toast 系统 |

## 14. 键盘快捷键速查

### 14.1 Dialog / Sheet / Drawer

| 键 | 行为 |
|----|------|
| `Esc` | 关闭 |
| `Tab` | 焦点循环（焦点陷阱内） |
| `Shift+Tab` | 反向焦点循环 |

### 14.2 DropdownMenu / Context Menu / Menubar

| 键 | 行为 |
|----|------|
| `↑` / `↓` | 上下移动 |
| `←` / `→` | 子菜单展开 / 关闭 |
| `Enter` / `Space` | 选中 |
| `Esc` | 关闭 |
| `Home` / `End` | 首项 / 末项 |
| 字母键 | typeahead 搜索 |

### 14.3 Combobox / Command

| 键 | 行为 |
|----|------|
| 字母 | 搜索过滤 |
| `↑` / `↓` | 移动高亮 |
| `Enter` | 选中 |
| `Esc` | 关闭 |

### 14.4 Tabs

| 键 | 行为 |
|----|------|
| `←` / `→` | 切换标签（水平） |
| `↑` / `↓` | 切换标签（垂直） |
| `Home` / `End` | 首 / 末标签 |

### 14.5 Accordion

| 键 | 行为 |
|----|------|
| `↑` / `↓` | 切换项 |
| `Enter` / `Space` | 展开 / 收起 |
| `Home` / `End` | 首 / 末项 |

### 14.6 Slider

| 键 | 行为 |
|----|------|
| `←` / `→` / `↑` / `↓` | 微调 |
| `PageUp` / `PageDown` | 大幅调整 |
| `Home` / `End` | 最小 / 最大值 |

### 14.7 Sidebar 全局

| 键 | 行为 |
|----|------|
| `Cmd+B` / `Ctrl+B` | 切换 Sidebar |

## 15. 常用 Tailwind utility 速查（shadcn 风格）

### 15.1 颜色

```text
bg-background / text-foreground            主色
bg-primary / text-primary-foreground       主操作
bg-secondary / text-secondary-foreground   次操作
bg-muted / text-muted-foreground           次要
bg-accent / text-accent-foreground         强调（hover）
bg-destructive                             危险色
border-border                              边框
ring-ring                                  焦点环
```

### 15.2 圆角

```text
rounded-sm    --radius-sm
rounded-md    --radius-md
rounded-lg    --radius-lg
rounded-xl    --radius-xl
```

### 15.3 data-state 选择器

```text
data-[state=open]:bg-blue-500
data-[state=closed]:opacity-0
data-[state=on]:bg-primary
data-[disabled]:opacity-50
data-[highlighted]:bg-accent
```

### 15.4 tw-animate-css 动画

```text
animate-in / animate-out
fade-in-0 / fade-out-0
slide-in-from-top / slide-in-from-bottom
zoom-in-95 / zoom-out-95
```

### 15.5 size 简写

```text
size-4 = w-4 h-4 = 16px × 16px
size-8 = w-8 h-8 = 32px × 32px
size-9 = w-9 h-9 = 36px × 36px
```

### 15.6 svg 自动尺寸（Button / Item 内）

```text
[&_svg]:size-4                       // 内部 svg 16px
[&_svg]:pointer-events-none           // 禁用 svg 鼠标
[&_svg]:shrink-0                      // 不收缩
[&_svg:not([class*='size-'])]:size-4  // 未显式指定时 16px
```

## 16. 版本演进时间线

| 日期 | 版本 / 事件 |
|------|------------|
| **2023.1** | shadcn/ui 首次发布 |
| **2024.3** | v1.0 稳定 |
| **2024.10** | React 19 兼容 |
| **2025.2** | Tailwind v4 支持 + OKLCH 色 |
| **2025.8** | MCP Server + Registry 体系 |
| **2026.2** | Radix UI 包统一 + Base UI 双支持 |
| **2026.4** | RTL + Pointer + Sera style |
| **2026.5** | v4.7.0（**当前稳定**） |

## 17. 与官方文档对应表

| 主题 | 官方 URL |
|------|---------|
| 首页 | https://ui.shadcn.com |
| 文档 | https://ui.shadcn.com/docs |
| Installation | https://ui.shadcn.com/docs/installation |
| Next.js | https://ui.shadcn.com/docs/installation/next |
| Vite | https://ui.shadcn.com/docs/installation/vite |
| TanStack Start | https://ui.shadcn.com/docs/installation/tanstack |
| Astro | https://ui.shadcn.com/docs/installation/astro |
| React Router | https://ui.shadcn.com/docs/installation/react-router |
| Laravel | https://ui.shadcn.com/docs/installation/laravel |
| Manual | https://ui.shadcn.com/docs/installation/manual |
| components.json | https://ui.shadcn.com/docs/components-json |
| Theming | https://ui.shadcn.com/docs/theming |
| Dark Mode | https://ui.shadcn.com/docs/dark-mode |
| CLI | https://ui.shadcn.com/docs/cli |
| Monorepo | https://ui.shadcn.com/docs/monorepo |
| Registry | https://ui.shadcn.com/docs/registry |
| MCP | https://ui.shadcn.com/docs/mcp |
| Blocks | https://ui.shadcn.com/blocks |
| Themes 生成器 | https://ui.shadcn.com/themes |
| Charts | https://ui.shadcn.com/charts |
| 组件总览 | https://ui.shadcn.com/docs/components |
| Changelog | https://ui.shadcn.com/docs/changelog |

## 18. 周边生态速查

| 项目 | URL | 说明 |
|------|-----|------|
| Magic UI | https://magicui.design | 动画效果组件 |
| Aceternity UI | https://ui.aceternity.com | 复杂动画 + 3D |
| Origin UI | https://originui.com | 业务组件库 |
| Park UI | https://park-ui.com | 多框架组件 |
| Tremor | https://tremor.so | Dashboard 组件 |
| shadcn-vue | https://www.shadcn-vue.com | Vue fork |
| shadcn-svelte | https://shadcn-svelte.com | Svelte fork |
| Catalyst | https://catalyst.tailwindui.com | Tailwind 官方设计系统（参考） |
| Lucide Icons | https://lucide.dev | 默认图标库 |
| Sonner | https://sonner.emilkowal.ski | Toast 库 |
| vaul | https://vaul.emilkowal.ski | Drawer 库 |
| cmdk | https://cmdk.paco.me | Command 底层 |
| react-day-picker | https://daypicker.dev | Calendar 底层 |
| embla-carousel | https://www.embla-carousel.com | Carousel 底层 |
| react-hook-form | https://react-hook-form.com | Form 底层 |
| zod | https://zod.dev | Schema 校验 |
| @tanstack/react-table | https://tanstack.com/table | DataTable 底层 |
| recharts | https://recharts.org | Chart 底层 |

## 19. 完成参考后

完成参考查阅后，可继续：

- 阅读 [shadcn/ui 官方文档](https://ui.shadcn.com/docs) 查看最新组件
- 浏览 [Blocks](https://ui.shadcn.com/blocks) 复制业务模板
- 体验 [Themes 生成器](https://ui.shadcn.com/themes) 调主题
- 关注 [shadcn-ui/ui GitHub Releases](https://github.com/shadcn-ui/ui/releases) 跟踪更新
- 探索周边生态（Magic UI / Aceternity / Origin / Tremor）
