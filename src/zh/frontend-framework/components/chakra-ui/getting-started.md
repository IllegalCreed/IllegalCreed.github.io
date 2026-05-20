---
layout: doc
outline: [2, 3]
---

# Chakra UI 入门

本文以 **Chakra UI v3.x**（2026 年 5 月最新稳定版 **v3.35.0**，2024 年 11 月 v3.0 GA）为基线，聚焦最常见的 **Vite + React 18/19 + TypeScript 5+** 组合，演示从零到「跑通第一个 Button + Input + 表单 + Toast」的完整链路。Next.js App Router 集成在最后单独给出。

> v3 是 **基于 Ark UI + Panda CSS 的重写**，与 v2 不兼容。本文按 v3 写法。如果你来自 v2，强烈建议先读完[「v2 → v3 迁移」章节](#v2-v3-migration)。

## 前置准备

### Node.js 与包管理器

Chakra UI v3 官方明确要求 **Node.js 20.x+**。本项目统一推荐 **pnpm**（monorepo 友好、磁盘占用更小）。最低要求：

- Node.js **20.x+**（v3 硬性要求，**18.x 会报错**）
- pnpm **9+**（或 npm 10+ / yarn 4+）
- React **18.2+** 或 **19.x**（v3 同时支持）
- TypeScript **5.0+**（强烈推荐，Chakra UI 是 TypeScript-first 项目）

```bash
# 检查环境
node -v   # v20.x.x 或更高
pnpm -v   # 9.x.x
```

### React 18 vs React 19

Chakra UI v3 **完整支持 React 19**——所有组件、hooks 在 React 19 GA 上测试通过。**新项目首选 React 19**，老项目 React 18 → 19 升级 Chakra 部分无破坏性变更。

### TypeScript 推荐

强烈推荐启用 TypeScript：

- Chakra UI 所有 API 都有完整 TS 类型
- `createSystem` + `defineConfig` 的 tokens / recipes 完美类型联动
- **`strictTokens: true`** 模式下编译期强制只能用设计 token
- Recipes / Slot Recipes 的 variant props 类型推导贯穿组件全生命周期

JavaScript 项目当然也能用，但**会丢失 60% 以上的 IDE 智能提示**。

## 快速开始 - 从模板创建

如果你是新项目，最快路径是用官方推荐模板。

### Vite + Chakra UI v3 最小模板

Chakra UI 没有官方 degit 模板，但有 **Playground** 在线沙箱可参考：[chakra-ui.com/docs/get-started/playground](https://chakra-ui.com/docs/get-started/playground)。本地从零起步用下面手动集成步骤即可。

### Next.js App Router 模板

```bash
# 用 create-next-app 起一个 Next.js 项目
pnpm create next-app my-chakra-app --typescript --app

cd my-chakra-app
pnpm add @chakra-ui/react @emotion/react
npx @chakra-ui/cli snippet add
```

`snippet add` 命令会向项目 `components/ui/` 目录写入 **provider.tsx / color-mode.tsx / toaster.tsx / tooltip.tsx** 等预制组件，**与 shadcn/ui 类似的「代码归用户所有」哲学**。

## 手动集成到 Vite 项目

如果你已经有一个 Vite 项目，从零集成 Chakra UI v3 只需 5 步。

### 第 1 步：创建 Vite 项目（已有可跳过）

```bash
pnpm create vite my-chakra-app -- --template react-ts
cd my-chakra-app
pnpm install
```

### 第 2 步：安装 Chakra UI v3 + Emotion

最小化安装只需两个包：

```bash
pnpm add @chakra-ui/react @emotion/react
```

> **关键**：v3 不再需要 `@emotion/styled` 和 `framer-motion`（v2 必需的两个 peer dep）—— **bundle 体积比 v2 小 ~30%**。

### 第 3 步：用 Snippet CLI 安装 Provider

v3 的标志性命令：

```bash
npx @chakra-ui/cli snippet add
```

这会向项目 `src/components/ui/` 写入若干预制组件：

```
src/components/ui/
├── provider.tsx       # ChakraProvider 封装（含 ColorModeProvider）
├── color-mode.tsx     # useColorMode / useColorModeValue / ColorModeButton
├── toaster.tsx        # Toast 通知系统（toaster + Toaster 组件）
├── tooltip.tsx        # Tooltip 简化包装
├── dialog.tsx         # Dialog 简化包装（可选）
├── drawer.tsx         # Drawer 简化包装（可选）
└── ...
```

> **为什么需要 snippet**：Chakra UI v3 把**配置 + 主题 + Color Mode + Toast** 等「胶水代码」生成到用户项目中——用户可以自由修改、不需要 wrapper API。**比 v2 直接 import 更灵活、但比 shadcn/ui 完全拷贝代码更内聚**。

### 第 4 步：配置 Vite (`vite-tsconfig-paths`)

由于 snippet 文件用 `@/components/ui/provider` 形式 import，需要配置路径别名：

```bash
pnpm add -D vite-tsconfig-paths
```

修改 `vite.config.ts`：

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
});
```

修改 `tsconfig.app.json`（或 `tsconfig.json`）：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

### 第 5 步：用 Provider 包根

修改 `src/main.tsx`：

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "@/components/ui/provider";
import App from "./App.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider>
      <App />
    </Provider>
  </React.StrictMode>
);
```

> **注意**：v3 的 Provider 是 snippet 安装到 `@/components/ui/provider` 的本地文件，**不是从 `@chakra-ui/react` 直接 import**。这就是 v3 的 snippet 哲学体现。

### 第 6 步：第一个组件

修改 `src/App.tsx`：

```tsx
import { Button, Heading, HStack, Stack, Text } from "@chakra-ui/react";

export default function App() {
  return (
    <Stack gap="4" p="8" maxW="md" mx="auto">
      <Heading size="2xl">欢迎来到 Chakra UI v3</Heading>
      <Text color="gray.600">
        基于 Ark UI + Panda CSS 的现代 React 组件库
      </Text>
      <HStack gap="3">
        <Button colorPalette="blue">主按钮</Button>
        <Button variant="outline" colorPalette="gray">
          次按钮
        </Button>
      </HStack>
    </Stack>
  );
}
```

运行 `pnpm dev` 打开 http://localhost:5173，你会看到一个带标题、说明文字和两个按钮的简洁演示。

> **Style Props 入门**：上面代码里的 `gap="4"` / `p="8"` / `maxW="md"` / `mx="auto"` 全部是 Chakra UI 的 Style Props——直接在组件上写 styling 而不写 CSS。详见下文「Style Props 入门」章节。

## 暗色模式一行启用

Chakra UI v3 改用 **next-themes** 库（业界事实标准）做暗色模式。`snippet add` 已经把 `color-mode.tsx` + `ColorModeProvider` 写入项目，**默认就开启了**：

```tsx
// src/components/ui/provider.tsx (snippet 自动生成)
"use client";

import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { ColorModeProvider, type ColorModeProviderProps } from "./color-mode";

export function Provider(props: ColorModeProviderProps) {
  return (
    <ChakraProvider value={defaultSystem}>
      <ColorModeProvider {...props} />
    </ChakraProvider>
  );
}
```

`ColorModeProvider` 默认参数：

- `attribute="class"` - 通过 `<html class="dark">` 控制
- `defaultTheme="system"` - 默认跟随系统
- `disableTransitionOnChange` - 切换时禁用过渡

### 用户手动切换

snippet 提供了 `ColorModeButton` 一键切换按钮：

```tsx
import { ColorModeButton } from "@/components/ui/color-mode";

export default function Header() {
  return (
    <header>
      <ColorModeButton />
    </header>
  );
}
```

或者用 `useColorMode` hook 自定义按钮：

```tsx
import { useColorMode } from "@/components/ui/color-mode";
import { Button } from "@chakra-ui/react";

export function MyToggle() {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Button onClick={toggleColorMode}>
      {colorMode === "light" ? "切换到暗色" : "切换到浅色"}
    </Button>
  );
}
```

### 适配条件样式

任意 Style Prop 都支持 `_dark` / `_light` 条件：

```tsx
<Box
  bg={{ base: "white", _dark: "gray.900" }}
  color={{ base: "gray.800", _dark: "gray.100" }}
  p="6"
  borderRadius="md"
>
  这是一个自适应卡片
</Box>
```

或者用 `useColorModeValue`：

```tsx
import { useColorModeValue } from "@/components/ui/color-mode";

const bgColor = useColorModeValue("white", "gray.900");
const textColor = useColorModeValue("gray.800", "gray.100");

<Box bg={bgColor} color={textColor}>
  ...
</Box>;
```

> **推荐用 `_dark` 条件 props 而非 `useColorModeValue`**——前者编译时静态、性能更好、SSR 一致性更强。`useColorModeValue` 在 JS 中动态判断、SSR 时只能拿默认值。

### 防 SSR 闪烁

`next-themes` 自动处理 SSR 闪烁 —— 在 `<html>` 加 `suppressHydrationWarning` 即可：

```tsx
// app/layout.tsx (Next.js)
<html lang="zh-CN" suppressHydrationWarning>
  <body>
    <Provider>{children}</Provider>
  </body>
</html>
```

Vite SPA 不需要这一步（没有 SSR）。

## Input + Field 第一个表单

Chakra UI v3 表单是「输入组件 + Field 包装」组合。**Field 是 v3 重大变更**——替代 v2 的 `FormControl`：

```tsx
import {
  Button,
  Field,
  Input,
  Stack,
} from "@chakra-ui/react";
import { useState } from "react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+$/.test(email)) {
      setEmailError("邮箱格式不正确");
      return;
    }
    setEmailError("");
    console.log("提交:", { email, password });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="4" maxW="md">
        <Field.Root invalid={!!emailError}>
          <Field.Label>
            邮箱
            <Field.RequiredIndicator />
          </Field.Label>
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Field.HelperText>用于接收登录通知</Field.HelperText>
          <Field.ErrorText>{emailError}</Field.ErrorText>
        </Field.Root>

        <Field.Root required>
          <Field.Label>
            密码
            <Field.RequiredIndicator />
          </Field.Label>
          <Input
            type="password"
            placeholder="至少 6 个字符"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field.Root>

        <Button type="submit" colorPalette="blue">
          登录
        </Button>
      </Stack>
    </form>
  );
}
```

要点：

- `Field.Root` 是字段容器、`invalid` / `required` / `disabled` / `readOnly` props 自动传递到子组件
- `Field.Label` + `Field.RequiredIndicator`（自动渲染 `*` 星号）
- `Field.HelperText` + `Field.ErrorText`（`invalid={true}` 时显示）
- 不需要手动 `htmlFor` —— Field 自动用 React Context 关联 label + input + helper + error

### react-hook-form 集成

生产推荐用 `react-hook-form`：

```bash
pnpm add react-hook-form zod @hookform/resolvers
```

```tsx
import { Button, Field, Input, Stack } from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(6, "至少 6 个字符"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginForm() {
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
        <Field.Root invalid={!!errors.email}>
          <Field.Label>邮箱</Field.Label>
          <Input {...register("email")} />
          <Field.ErrorText>{errors.email?.message}</Field.ErrorText>
        </Field.Root>

        <Field.Root invalid={!!errors.password}>
          <Field.Label>密码</Field.Label>
          <Input type="password" {...register("password")} />
          <Field.ErrorText>{errors.password?.message}</Field.ErrorText>
        </Field.Root>

        <Button type="submit" loading={isSubmitting} colorPalette="blue">
          登录
        </Button>
      </Stack>
    </form>
  );
}
```

注意 v3 用 `loading` 而非 v2 的 `isLoading`（boolean props 命名统一改为去掉 `is` 前缀）。

## Toast 第一个通知

Chakra UI v3 的 Toast 是 snippet 安装到本地的 —— `npx @chakra-ui/cli snippet add` 会写入 `src/components/ui/toaster.tsx`：

```tsx
// src/components/ui/toaster.tsx (snippet 自动生成)
"use client";

import {
  Toaster as ChakraToaster,
  Portal,
  Spinner,
  Stack,
  Toast,
  createToaster,
} from "@chakra-ui/react";

export const toaster = createToaster({
  placement: "top-end",
  pauseOnPageIdle: true,
});

export const Toaster = () => {
  return (
    <Portal>
      <ChakraToaster toaster={toaster} insetInline={{ mdDown: "4" }}>
        {(toast) => (
          <Toast.Root width={{ md: "sm" }}>
            {toast.type === "loading" ? <Spinner size="sm" /> : <Toast.Indicator />}
            <Stack gap="1" flex="1" maxWidth="100%">
              {toast.title && <Toast.Title>{toast.title}</Toast.Title>}
              {toast.description && (
                <Toast.Description>{toast.description}</Toast.Description>
              )}
            </Stack>
            {toast.action && (
              <Toast.ActionTrigger>{toast.action.label}</Toast.ActionTrigger>
            )}
            {toast.closable && <Toast.CloseTrigger />}
          </Toast.Root>
        )}
      </ChakraToaster>
    </Portal>
  );
};
```

在 Provider 中渲染 `Toaster`：

```tsx
// src/components/ui/provider.tsx
"use client";

import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { ColorModeProvider } from "./color-mode";
import { Toaster } from "./toaster";

export function Provider(props: { children: React.ReactNode }) {
  return (
    <ChakraProvider value={defaultSystem}>
      <ColorModeProvider {...props} />
      <Toaster />
    </ChakraProvider>
  );
}
```

任意组件触发 Toast：

```tsx
import { Button } from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";

export function NotifyDemo() {
  return (
    <Button
      colorPalette="blue"
      onClick={() =>
        toaster.create({
          title: "保存成功",
          description: "你的修改已经同步到服务器",
          type: "success",
          duration: 3000,
        })
      }
    >
      触发通知
    </Button>
  );
}
```

5 种 type：`success` / `error` / `warning` / `info` / `loading`。

异步任务 toast：

```tsx
const handleSave = async () => {
  toaster.promise(saveToServer(), {
    loading: { title: "保存中...", description: "请稍候" },
    success: { title: "保存成功", description: "已同步到服务器" },
    error: { title: "保存失败", description: "请重试" },
  });
};
```

`toaster.promise` 接收一个 Promise，自动根据 pending / fulfilled / rejected 状态展示对应 toast。

## Style Props 入门

Chakra UI 的标志性特性 —— **几乎所有组件都支持 200+ Style Props**，相当于内置了 Tailwind 风格的 utility props。

```tsx
import { Box, Text } from "@chakra-ui/react";

<Box mt="4" mb="2" px="6" py="3" bg="blue.50" color="blue.900" borderRadius="md">
  <Text fontSize="lg" fontWeight="bold" textAlign="center">
    标题文字
  </Text>
</Box>;
```

### 常用 Style Props 速查

| 类别 | Props | 说明 |
| ---- | ----- | ---- |
| 外边距 | `m`, `mt`, `mb`, `ml`, `mr`, `mx`, `my` | margin / margin-top 等 |
| 内边距 | `p`, `pt`, `pb`, `pl`, `pr`, `px`, `py` | padding 同上 |
| 尺寸 | `w`, `h`, `minW`, `maxW`, `minH`, `maxH`, `boxSize` | width / max-width 等 |
| 颜色 | `color`, `bg`, `borderColor`, `colorPalette` | text / background / border / 主题色板 |
| 字体 | `fontSize`, `fontWeight`, `fontFamily`, `lineHeight`, `letterSpacing`, `textAlign`, `textTransform`, `textDecoration`, `fontStyle` | size / weight / family 等 |
| 布局 | `display`, `flex`, `flexDirection`, `gap`, `gridTemplateColumns`, `position`, `top`, `left`, `bottom`, `right`, `zIndex` | flex / grid / position |
| 边框 | `border`, `borderRadius`, `borderWidth`, `borderStyle`, `borderTop` | border 系列 |
| 阴影 | `boxShadow`, `textShadow` | shadow |
| 透明度 | `opacity` | opacity |

### 值的形式

```tsx
{/* 主题尺寸 - 数字 token */}
<Box mt="4" />        {/* = 1rem = 16px (theme.spacing.4) */}
<Box mt="8" />        {/* = 2rem = 32px (theme.spacing.8) */}

{/* 主题颜色 - "颜色名.shade" */}
<Box color="blue.600" />     {/* = theme.colors.blue.600 */}
<Box bg="gray.100" />        {/* = theme.colors.gray.100 */}

{/* colorPalette 主色板 */}
<Button colorPalette="red">  {/* 整组红色风格 */}

{/* 原生 CSS - 字符串或对象 */}
<Box mt="20px" />     {/* = 20px */}
<Box color="#ff0000" />     {/* CSS color */}
```

### 响应式对象语法

```tsx
<Box
  w={{ base: "100%", sm: "80%", md: "60%", lg: "50%" }}
  p={{ base: "2", md: "6" }}
  fontSize={{ base: "sm", md: "lg" }}
>
  小屏 100% / sm 80% / md 60% / lg 50%
</Box>
```

`base` 是默认值、`sm` / `md` / `lg` / `xl` / `2xl` 对应断点：

- `base`: 0px+
- `sm`: 30em / 480px+
- `md`: 48em / 768px+
- `lg`: 62em / 992px+
- `xl`: 80em / 1280px+
- `2xl`: 96em / 1536px+

### 数组语法（简写）

```tsx
<Box w={["100%", undefined, "60%", "50%"]} />
{/* = { base: '100%', md: '60%', lg: '50%' } */}
```

数组下标对应 `[base, sm, md, lg, xl, 2xl]`，`undefined` 跳过该断点。

### 条件 Style Props

Chakra UI 的杀器之一 —— **30+ 状态条件直接写在对象语法里**：

```tsx
<Button
  bg="blue.500"
  color="white"
  _hover={{ bg: "blue.600" }}           {/* hover 状态 */}
  _active={{ bg: "blue.700" }}          {/* active 状态 */}
  _disabled={{ opacity: 0.5, cursor: "not-allowed" }}
  _focus={{ outline: "2px solid", outlineColor: "blue.300" }}
  _dark={{ bg: "blue.400", color: "gray.900" }}    {/* 暗色模式 */}
>
  按钮
</Button>
```

完整条件列表见[指南](./guide-line.md)的 Conditional Style Props 章节。

### Style Props vs Tailwind

Chakra Style Props 是 **React props（编译进 JSX）**，Tailwind 是 **class 字符串**——**风格不同但目标一致**。Chakra 可以与 Tailwind 共存（用 className），但同一项目建议二选一保持一致性。

## createSystem 入门

主题对象是 Chakra UI 的设计 token 中心。**v3 用 `createSystem` + `defineConfig`**（替代 v2 的 `extendTheme`）：

```tsx
// src/theme.ts
import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
  theme: {
    tokens: {
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
      fonts: {
        heading: { value: "Inter, sans-serif" },
        body: { value: "Inter, sans-serif" },
      },
    },
    semanticTokens: {
      colors: {
        primary: {
          value: { base: "{colors.brand.500}", _dark: "{colors.brand.400}" },
        },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
```

> **关键差异 vs v2**：
> - **token 值必须包装为 `{ value: "..." }` 对象**（v2 是直接值）
> - **`createSystem(defaultConfig, config)`** 替代 v2 的 `extendTheme()`
> - **每色板 11 个 shade**（50-950，新增 950）
> - **`semanticTokens`** 支持 `{ base, _dark }` 等条件值

### 在 Provider 注入

修改 `src/components/ui/provider.tsx`：

```tsx
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

使用自定义色板：

```tsx
<Button colorPalette="brand">品牌按钮</Button>
<Box color="brand.900" bg="brand.50">浅背景 + 深字</Box>
<Box color="primary">语义色（自动暗色适配）</Box>
```

### 完整 defineConfig 选项

```ts
import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
  // 是否启用 CSS 重置
  preflight: true,

  // CSS 变量根选择器
  cssVarsRoot: ":where(html)",

  // CSS 变量前缀
  cssVarsPrefix: "chakra",

  // 严格 token 模式（编译期强制只用 token）
  strictTokens: false,

  // 全局样式
  globalCss: {
    "html, body": {
      fontFamily: "body",
      bg: "bg",
      color: "fg",
    },
  },

  // 主题配置
  theme: {
    // 断点
    breakpoints: {
      base: "0em",
      sm: "30em",
      md: "48em",
      lg: "62em",
      xl: "80em",
      "2xl": "96em",
    },
    // tokens / semanticTokens / recipes / slotRecipes / keyframes / textStyles / layerStyles
    tokens: { /* ... */ },
    semanticTokens: { /* ... */ },
    recipes: { /* ... */ },
    slotRecipes: { /* ... */ },
  },

  // 自定义条件
  conditions: {
    cqSm: "@container(min-width: 320px)",
  },
});

export const system = createSystem(defaultConfig, config);
```

## Vite 集成完整示例

完整目录结构：

```
my-chakra-app/
├── package.json
├── vite.config.ts
├── tsconfig.json
└── src/
    ├── main.tsx              # Provider 包根
    ├── App.tsx
    ├── theme.ts              # createSystem 主题对象
    ├── components/
    │   ├── ui/                # snippet 安装的预制组件
    │   │   ├── provider.tsx
    │   │   ├── color-mode.tsx
    │   │   ├── toaster.tsx
    │   │   └── tooltip.tsx
    │   ├── LoginForm.tsx
    │   └── NotifyDemo.tsx
```

最终 `src/main.tsx`：

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "@/components/ui/provider";
import App from "./App.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider>
      <App />
    </Provider>
  </React.StrictMode>
);
```

最终 `src/App.tsx`：

```tsx
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Stack,
} from "@chakra-ui/react";
import { ColorModeButton } from "@/components/ui/color-mode";
import LoginForm from "./components/LoginForm";

export default function App() {
  return (
    <Box minH="100vh" bg={{ base: "gray.50", _dark: "gray.900" }}>
      <Flex
        as="header"
        align="center"
        justify="space-between"
        px="6"
        py="4"
        borderBottomWidth="1px"
      >
        <Heading size="md">My Chakra App</Heading>
        <HStack gap="3">
          <ColorModeButton />
        </HStack>
      </Flex>

      <Container maxW="md" py="10">
        <Stack gap="6">
          <Heading size="2xl">登录</Heading>
          <LoginForm />
        </Stack>
      </Container>
    </Box>
  );
}
```

## Next.js App Router 集成

Next.js 13+ App Router 是 SSR 项目首选——Chakra UI v3 提供**与 Next.js 完美对齐**的集成方案。

### 第 1 步：创建项目 + 安装

```bash
pnpm create next-app my-chakra-app --typescript --app
cd my-chakra-app

pnpm add @chakra-ui/react @emotion/react
npx @chakra-ui/cli snippet add
```

### 第 2 步：tsconfig.json 配置

确保 `tsconfig.json` 有路径别名：

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 第 3 步：next.config.mjs 优化（推荐）

```js
// next.config.mjs
const nextConfig = {
  experimental: {
    optimizePackageImports: ["@chakra-ui/react"],
  },
};

export default nextConfig;
```

`optimizePackageImports` 启用按需 import 优化、bundle 体积减小 ~40%。

### 第 4 步：layout.tsx 包根

```tsx
// app/layout.tsx
import { Provider } from "@/components/ui/provider";

export const metadata = {
  title: "My Chakra App",
  description: "Chakra UI on Next.js App Router",
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

**关键三件事**：

1. **`suppressHydrationWarning`** - 防止 `next-themes` 注入 `class="dark"` 导致的 hydration warning
2. **Provider 是 snippet 安装的本地组件** - 已经包含 `ChakraProvider` + `ColorModeProvider` + `Toaster`
3. **不需要 `"use client"` 包根** - Provider 内部已经有 `"use client"`，layout 本身可以是 Server Component

### 第 5 步：第一个页面

```tsx
// app/page.tsx
import { Button, Container, Heading, Stack } from "@chakra-ui/react";

export default function HomePage() {
  return (
    <Container maxW="md" py="10">
      <Stack gap="6">
        <Heading size="2xl">Hello Chakra on Next.js</Heading>
        <Button colorPalette="blue">点我</Button>
      </Stack>
    </Container>
  );
}
```

> **重要**：交互组件（含 `onClick` / `useState` / hooks）必须加 `"use client"` 指令。**布局展示类组件可以是 Server Component**——Chakra UI 大部分纯展示组件（`Heading` / `Text` / `Box` / `Container` 等）都能在 RSC 中渲染。

### 第 6 步：SSR Cache Provider（可选优化）

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

  useServerInsertedHTML(() => {
    return (
      <style
        data-emotion={`${cache.key} ${Object.keys(cache.inserted).join(" ")}`}
        dangerouslySetInnerHTML={{
          __html: Object.values(cache.inserted).join(" "),
        }}
      />
    );
  });

  return <CacheProvider value={cache}>{children}</CacheProvider>;
}
```

然后在 `layout.tsx` 包裹 Provider：

```tsx
<EmotionRegistry>
  <Provider>{children}</Provider>
</EmotionRegistry>
```

> **多数项目不需要这一步**—— Chakra UI v3 内置已经处理大部分 SSR 场景。只在出现样式闪烁时再加。

### Turbopack 兼容性

Next.js 15+ 默认 Turbopack 可能与 Emotion 有兼容问题。如果遇到 hydration error，把 `package.json` scripts 改回 webpack：

```json
{
  "scripts": {
    "dev": "next dev --webpack",
    "build": "next build"
  }
}
```

或者等 Next.js 16+ Turbopack 稳定（2026 年 Q1 已 stable）。

## v2 → v3 Migration

如果你来自 v2，**v3 是 breaking 重写**。下面是关键变化：

### 安装 + Provider

```diff
- npm i @chakra-ui/react @emotion/react @emotion/styled framer-motion
+ npm i @chakra-ui/react @emotion/react
+ npx @chakra-ui/cli snippet add
```

```diff
- import { ChakraProvider } from "@chakra-ui/react"
- <ChakraProvider theme={theme}>
+ import { Provider } from "@/components/ui/provider"
+ <Provider>
```

### 主题配置

```diff
- import { extendTheme } from "@chakra-ui/react"
- export const theme = extendTheme({
-   colors: { brand: { 500: "#00bfff" } }
- })
+ import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react"
+ const config = defineConfig({
+   theme: {
+     tokens: {
+       colors: {
+         brand: { 500: { value: "#00bfff" } }   // ⚠️ 必须 { value: ... } 包装
+       }
+     }
+   }
+ })
+ export const system = createSystem(defaultConfig, config)
```

### 关键 API 重命名

| v2 | v3 | 说明 |
| -- | -- | ---- |
| `colorScheme="blue"` | `colorPalette="blue"` | 避免与 HTML colorScheme 冲突 |
| `isOpen` | `open` | boolean props 统一去 `is` |
| `isDisabled` | `disabled` | 同上 |
| `isInvalid` | `invalid` | 同上 |
| `isRequired` | `required` | 同上 |
| `defaultIsOpen` | `defaultOpen` | 同上 |
| `isLoading` | `loading` | Button、表单等 |
| `noOfLines={2}` | `lineClamp={2}` | 限行 |
| `truncated` | `truncate` | 截断 |
| `spacing="4"` (Stack/VStack/HStack) | `gap="4"` | 间距统一 |
| `divider={<StackDivider />}` | 显式插入 `<Stack.Separator />` | 分隔器 |
| `<Show above="md">` / `<Hide below="md">` | `hideBelow="md"` / `hideFrom="md"` props | 可见性 |
| `extendTheme` | `createSystem + defineConfig` | 主题入口 |

### 组件重构（Compound 模式）

**Modal → Dialog**

```tsx
// v2
<Modal isOpen={isOpen} onClose={onClose} isCentered>
  <ModalOverlay />
  <ModalContent>
    <ModalHeader>标题</ModalHeader>
    <ModalBody>内容</ModalBody>
  </ModalContent>
</Modal>

// v3
<Dialog.Root
  open={isOpen}
  onOpenChange={(e) => !e.open && onClose()}
  placement="center"
>
  <Portal>
    <Dialog.Backdrop />
    <Dialog.Positioner>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>标题</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>内容</Dialog.Body>
        <Dialog.CloseTrigger />
      </Dialog.Content>
    </Dialog.Positioner>
  </Portal>
</Dialog.Root>
```

**FormControl → Field**

```tsx
// v2
<FormControl isInvalid={!!error}>
  <FormLabel>邮箱</FormLabel>
  <Input />
  <FormHelperText>...</FormHelperText>
  <FormErrorMessage>{error}</FormErrorMessage>
</FormControl>

// v3
<Field.Root invalid={!!error}>
  <Field.Label>邮箱</Field.Label>
  <Input />
  <Field.HelperText>...</Field.HelperText>
  <Field.ErrorText>{error}</Field.ErrorText>
</Field.Root>
```

**Select → NativeSelect**

```tsx
// v2
<Select placeholder="选择"><option value="a">A</option></Select>

// v3
<NativeSelect.Root>
  <NativeSelect.Field placeholder="选择">
    <option value="a">A</option>
  </NativeSelect.Field>
  <NativeSelect.Indicator />
</NativeSelect.Root>
```

### 移除的包 / 组件

- **`@chakra-ui/icons` 整个包** → 用 `react-icons` / `lucide-react`
- **`@chakra-ui/hooks` 整个包** → 用 `react-use` / `usehooks-ts`
- **`@emotion/styled` 不再需要** → v3 不依赖
- **`framer-motion` 不再需要** → v3 不依赖
- **`StackItem`** → 用 `Box`
- **`FocusLock`** → 装 `react-focus-lock`
- **`AlertDialog`** → 用 `Dialog` + `role="alertdialog"`
- **`CircularProgress`** → 改名 `ProgressCircle`（含 compound 子组件）
- **`StackDivider`** → 用 `Stack.Separator`
- **`Show` / `Hide`** → 用 `hideFrom` / `hideBelow` props

### 图标迁移

```tsx
// v2
import { AddIcon, CheckIcon } from "@chakra-ui/icons";
<AddIcon />;
<CheckIcon boxSize={6} color="green.500" />;

// v3
import { Icon } from "@chakra-ui/react";
import { LuPlus, LuCheck } from "react-icons/lu";

<LuPlus />;
<Icon as={LuCheck} boxSize={6} color="green.500" />;
```

常见映射：

| v2 Icon | v3 react-icons/lu |
| ------- | ----------------- |
| `AddIcon` | `LuPlus` |
| `CheckIcon` | `LuCheck` |
| `CloseIcon` | `LuX` |
| `SearchIcon` | `LuSearch` |
| `ChevronDownIcon` | `LuChevronDown` |
| `ExternalLinkIcon` | `LuExternalLink` |
| `DeleteIcon` | `LuTrash2` |
| `EditIcon` | `LuPencil` |

### 自动迁移工具

```bash
npx @chakra-ui/codemod upgrade
```

会自动处理 70% 以上的简单替换（boolean props 改名、colorScheme → colorPalette 等），**剩下 30% 复杂场景**（Modal → Dialog 解构 / FormControl → Field 解构）需要手动调整。

## TypeScript 配置要点

Chakra UI v3 是 TypeScript-first，配置零额外步骤——但有几个最佳实践：

### tsconfig.json 推荐

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

### strictTokens 模式

如果你希望编译期阻止任意 CSS 值、强制只用设计 token：

```ts
const config = defineConfig({
  strictTokens: true,    // 默认 false
  theme: { /* ... */ },
});
```

启用后：

```tsx
{/* ✅ OK - 引用 theme token */}
<Box mt="4" color="blue.500" />

{/* ❌ TS Error - "17px" 不是 token */}
<Box mt="17px" />

{/* ❌ TS Error - "#ff0000" 不是 token */}
<Box color="#ff0000" />
```

适合**强设计系统约束**的项目。日常项目保持 `false` 即可。

### 主题类型扩展

如果在 token 中放自定义字段，可以用 module augmentation 扩展 TypeScript 类型：

```ts
// src/chakra.d.ts
import "@chakra-ui/react";

declare module "@chakra-ui/react" {
  interface ConfigTokenMap {
    colors: { brand: { 500: string; 600: string } };
  }
}
```

之后访问 `<Box bg="brand.500" />` 会有完整类型提示。

## 验证安装：完整示例

最后跑一个综合示例，验证所有基础组件都正常：

```tsx
// src/App.tsx
import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Flex,
  Heading,
  HStack,
  Stack,
  Text,
} from "@chakra-ui/react";
import { ColorModeButton } from "@/components/ui/color-mode";
import { toaster } from "@/components/ui/toaster";

export default function App() {
  const handleNotify = () => {
    toaster.create({
      title: "成功",
      description: "Chakra UI 集成完成",
      type: "success",
      duration: 3000,
    });
  };

  return (
    <Box minH="100vh" bg={{ base: "gray.50", _dark: "gray.900" }}>
      <Flex
        as="header"
        align="center"
        justify="space-between"
        px="6"
        py="4"
        borderBottomWidth="1px"
        bg={{ base: "white", _dark: "gray.800" }}
      >
        <Heading size="md">My Chakra App</Heading>
        <ColorModeButton />
      </Flex>

      <Container maxW="3xl" py="10">
        <Stack gap="6">
          <Heading size="2xl">Chakra UI v3 集成验证</Heading>

          <Card.Root>
            <Card.Body>
              <HStack justify="space-between" mb="4">
                <HStack gap="3">
                  <Avatar.Root colorPalette="blue">
                    <Avatar.Fallback>JS</Avatar.Fallback>
                  </Avatar.Root>
                  <Box>
                    <Text fontWeight="semibold">John Smith</Text>
                    <Text fontSize="xs" color="gray.500">
                      前端工程师
                    </Text>
                  </Box>
                </HStack>
                <Badge colorPalette="green">在线</Badge>
              </HStack>
              <Text color="gray.600" mb="4">
                这是一个综合演示卡片，包含 Avatar / Badge / Text / colorPalette 等核心元素。
              </Text>
              <Button colorPalette="blue" onClick={handleNotify} width="full">
                触发通知
              </Button>
            </Card.Body>
          </Card.Root>
        </Stack>
      </Container>
    </Box>
  );
}
```

如果这个示例能正确显示、按钮能触发 Toast、暗色模式切换正常 —— **恭喜，Chakra UI v3 集成完成**。

## 常见踩坑速记

### 踩坑 1：忘了 snippet add 命令

**症状**：`@/components/ui/provider` 找不到、import 报错。

**解决**：

```bash
npx @chakra-ui/cli snippet add
```

会自动生成 `src/components/ui/` 下的所有预制组件。

### 踩坑 2：tsconfig 路径别名缺失

**症状**：snippet 文件中的 `@/components/ui/...` 全部红色波浪线。

**解决**：在 `tsconfig.json` 加 paths：

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

Vite 还要装 `vite-tsconfig-paths`：

```bash
pnpm add -D vite-tsconfig-paths
```

### 踩坑 3：v2 写法导致 v3 报错

**症状**：从 v2 项目升级、`isOpen` / `isDisabled` / `colorScheme` 报错。

**解决**：用自动迁移工具：

```bash
npx @chakra-ui/codemod upgrade
```

或者手动改：`isOpen` → `open`、`isDisabled` → `disabled`、`colorScheme` → `colorPalette`。

### 踩坑 4：token 值忘了 { value: ... } 包装

**症状**：`createSystem` 报错或 token 不生效。

**解决**：v3 的 token 必须用对象包装：

```ts
{/* ❌ v2 写法 */}
colors: { brand: { 500: "#00bfff" } }

{/* ✅ v3 写法 */}
colors: { brand: { 500: { value: "#00bfff" } } }
```

### 踩坑 5：暗色模式 Hydration Warning

**症状**：Next.js 控制台「Hydration mismatch」红字。

**解决**：在 `<html>` 加 `suppressHydrationWarning`（next-themes 会改 class）：

```tsx
<html lang="zh-CN" suppressHydrationWarning>
```

### 踩坑 6：Modal 改不动？应该用 Dialog

**症状**：v3 中 `import { Modal } from '@chakra-ui/react'` 找不到。

**解决**：v3 把 Modal 改名 Dialog，且改为 Compound 模式：

```tsx
<Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
  <Portal>
    <Dialog.Backdrop />
    <Dialog.Positioner>
      <Dialog.Content>
        <Dialog.Header><Dialog.Title>标题</Dialog.Title></Dialog.Header>
        <Dialog.Body>内容</Dialog.Body>
      </Dialog.Content>
    </Dialog.Positioner>
  </Portal>
</Dialog.Root>
```

### 踩坑 7：Node.js 版本不够

**症状**：`npm install` 警告 / 启动报错。

**解决**：v3 硬性要求 Node.js 20.x+。检查 `node -v`，必要时用 `nvm install 20` 升级。

### 踩坑 8：图标 import 报错

**症状**：`import { AddIcon } from '@chakra-ui/icons'` 找不到。

**解决**：v3 移除 `@chakra-ui/icons`：

```bash
pnpm add react-icons
```

```tsx
import { LuPlus } from "react-icons/lu";
import { Icon } from "@chakra-ui/react";

<Icon as={LuPlus} boxSize="5" />;
```

### 踩坑 9：Stack spacing 不生效

**症状**：`<Stack spacing="4">` 没有间距。

**解决**：v3 改名 `gap`：

```tsx
<Stack gap="4">
```

VStack / HStack 同样。

### 踩坑 10：Turbopack 与 Emotion 兼容问题

**症状**：Next.js 15+ dev server 报 hydration error。

**解决**：暂时切回 webpack：

```json
{ "scripts": { "dev": "next dev --webpack" } }
```

或等 Next.js 16+ Turbopack 完全稳定（2026 Q1 起 stable）。

### 踩坑 11：strictTokens 报错

**症状**：开启 `strictTokens: true` 后 `<Box mt="17px" />` 报 TS 错。

**解决**：要么用 token（`mt="4"`），要么关闭 strictTokens 模式。如果一定要任意值、用 `style` prop（CSS object 不走 token 检查）：

```tsx
<Box style={{ marginTop: "17px" }} />
```

### 踩坑 12：bundle 体积过大

**症状**：生产构建后 chunk 1MB+。

**解决**：

1. Next.js 启用 `optimizePackageImports: ["@chakra-ui/react"]`
2. Vite 用 `vite-plugin-imp` 或 modular import
3. 图标按需 import（`react-icons/lu/LuPlus` 而非整个 `react-icons/lu`）
4. 检查没有 import 整个 Ark UI（只用 Chakra 封装的子集）

## 下一步

恭喜你完成 Chakra UI v3 入门 —— 接下来推荐阅读：

- [指南](./guide-line.md)：组件分类（9 大类）、Style Props 完整 API、createSystem 深度、Recipes & Slot Recipes、Color Mode 深度、Compound 组件深度、asChild 组合、Form + react-hook-form、Toast 完整方案、Next.js SSR 完整、常见踩坑
- [参考](./reference.md)：100+ 组件清单、Style Props 完整表、Conditional Style Props、createSystem / defineConfig 完整选项、Recipes API、TypeScript 类型

或者直接打开 [Chakra UI 官网](https://chakra-ui.com/) 浏览 100+ 组件实时 Demo。
