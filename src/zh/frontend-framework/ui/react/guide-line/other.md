---
layout: doc
outline: [2, 3]
---

# 指南 - 其它

> 基于 React 19.x 编写 —— 跨端 / 集成 / 生态对比 / 周边工具

## 速查

- **React Native**：Native 移动应用首选；0.77+ New Architecture 默认开启
- **Expo**：React Native 全栈框架，文件路由 + EAS 云构建 + OTA 更新
- **Electron + React**：桌面应用主流方案，Chromium + Node.js
- **Tauri + React**：Rust 内核的更轻量桌面方案，bundle 小 10-100 倍
- **微前端**：Module Federation v2 / single-spa / qiankun
- **i18n**：i18next（最流行）/ react-intl（FormatJS，ICU MessageFormat）/ Lingui
- **Storybook**：UI 库 / 设计系统 / 文档站
- **生态对比**：Solid（同写法 + 更快）/ Preact（同 API + 更小）/ Inferno（高性能）/ Million.js（运行时优化）

## React Native

### 定位

React Native 把 React 渲染逻辑接到原生 UI 树：

- iOS：UIView 树（Swift / Objective-C）
- Android：View 树（Kotlin / Java）
- Web：DOM 树（via `react-native-web`）

代码 90%+ 共享（业务逻辑、组件结构），UI 实现自动平台适配。

### 创建项目

```bash
# Expo（最推荐，零原生配置起步）
pnpm create expo my-app

# 纯 React Native CLI（要原生项目时）
pnpm dlx @react-native-community/cli init MyApp
```

### 核心组件差异

| React Web | React Native |
|---|---|
| `<div>` | `<View>` |
| `<span>` / `<p>` | `<Text>`（必须，文字不能直接放 View） |
| `<img>` | `<Image>` |
| `<input>` | `<TextInput>` |
| `<button>` | `<Pressable>` / `<TouchableOpacity>` |
| `<ul>` / `<li>` | `<FlatList>` / `<ScrollView>` |
| CSS 文件 | StyleSheet API |
| `display: flex` 默认 row | 默认 column |

```tsx
import { View, Text, StyleSheet, Pressable } from 'react-native'

function Counter() {
  const [count, setCount] = useState(0)

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Count: {count}</Text>
      <Pressable style={styles.button} onPress={() => setCount(c => c + 1)}>
        <Text>Increment</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 20, marginBottom: 16 },
  button: { padding: 12, backgroundColor: 'blue' },
})
```

### New Architecture（0.76+ 默认）

React Native 长期靠 Bridge 在 JS 和 Native 之间序列化通信，是性能瓶颈。0.74 起逐步推出 New Architecture：

| 组件 | 旧 | 新 |
|---|---|---|
| **Bridge** | JSON 序列化通信 | **JSI**：JS 直接调 C++（同步） |
| **UI 系统** | Paper | **Fabric**：Concurrent + React Suspense 友好 |
| **Native Modules** | Bridge 调用 | **TurboModules**：JSI 调用 |
| **启动** | JS bundle 启动 | **Bridgeless**：零 Bridge 启动 |

升级：

```bash
# package.json
"react-native": "0.77.0",
# ios/Podfile 删除 RCT_NEW_ARCH_ENABLED=1，0.76+ 默认开启
```

## Expo

### 优势

- **托管原生**：无需打开 Xcode / Android Studio 即可开发（Expo Go App）
- **EAS Build**：云端构建 iOS / Android 二进制
- **EAS Submit**：自动提交 App Store / Play Store
- **EAS Update**：OTA 更新（不走商店）
- **Expo Router**：文件路由 + 嵌套 Stack / Tab / Modal
- **大量预装库**：Camera / Location / Notification / SecureStore 等

### Expo Router

```
app/
├── _layout.tsx          # Root Stack Layout
├── index.tsx            # /
├── login.tsx            # /login
├── (tabs)/
│   ├── _layout.tsx      # Tab navigator
│   ├── home.tsx         # /home
│   ├── search.tsx       # /search
│   └── profile.tsx      # /profile
├── post/
│   └── [id].tsx         # /post/:id
└── +not-found.tsx       # 404
```

```tsx
// app/_layout.tsx
import { Stack } from 'expo-router'

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="post/[id]" options={{ presentation: 'modal' }} />
    </Stack>
  )
}

// app/post/[id].tsx
import { useLocalSearchParams } from 'expo-router'

export default function PostDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <Text>Post: {id}</Text>
}
```

API 与 Next.js App Router 高度相似——共享 React 团队的设计思路。

### Web 同构

`expo-router` 同时输出 Web 版本：

```bash
pnpm dlx expo export --platform web
```

通过 `react-native-web` 把 RN 组件映射到 DOM。

## Electron + React

### 项目结构

```
electron-app/
├── main/            # Main process（Node.js，控制窗口、系统 API）
│   ├── index.ts
│   └── ipc.ts
├── preload/         # Preload 脚本（桥接 main 和 renderer）
│   └── index.ts
├── renderer/        # Renderer process（Chromium，跑 React）
│   ├── src/
│   │   └── App.tsx
│   └── index.html
└── package.json
```

### electron-vite（推荐脚手架）

```bash
pnpm create @quick-start/electron my-app --template react-ts
cd my-app && pnpm dev
```

提供：

- Vite 双进程（main / renderer）开发
- HMR
- TypeScript 双 tsconfig
- IPC 类型推导

### IPC 通信

```ts
// main/index.ts
import { ipcMain } from 'electron'

ipcMain.handle('read-file', async (event, path: string) => {
  return await fs.readFile(path, 'utf-8')
})

// preload/index.ts
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  readFile: (path: string) => ipcRenderer.invoke('read-file', path),
})

// renderer (React)
declare global {
  interface Window {
    electronAPI: { readFile: (path: string) => Promise<string> }
  }
}

function FileViewer() {
  const [content, setContent] = useState('')
  const handleOpen = async () => {
    const text = await window.electronAPI.readFile('/path/to/file')
    setContent(text)
  }
  return <pre>{content}</pre>
}
```

### Electron 缺点

- bundle 大（含完整 Chromium，~150MB）
- 内存占用高（每个窗口一个 Chromium 进程）
- 启动慢

→ 轻量替代：Tauri。

## Tauri + React

### 优势

Tauri 用系统原生 WebView（Windows: WebView2 / macOS: WKWebView / Linux: WebKitGTK），不内嵌 Chromium：

- bundle 小（~600KB vs Electron ~50MB）
- 启动快（毫秒级）
- 内存占用低（~50MB vs ~200MB）
- 后端 Rust，比 Node.js 更安全 + 更快

### 创建项目

```bash
pnpm create tauri-app

# 选择
# √ Identifier: com.example.myapp
# √ Choose your package manager: pnpm
# √ Choose your UI template: React - (https://react.dev/)
# √ Choose your UI flavor: TypeScript

cd my-app && pnpm install
pnpm tauri dev
```

### Rust → JS 通信

```rust
// src-tauri/src/main.rs
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error");
}
```

```tsx
// React 端
import { invoke } from '@tauri-apps/api/core'

const greet = async (name: string) => {
  const message = await invoke<string>('greet', { name })
  console.log(message)
}
```

### Tauri 缺点

- 需要学 Rust（虽然简单后端不一定要写多少）
- WebView 差异（Windows / macOS / Linux 略有不同，比 Chromium 不统一）

## 微前端方案对比

| 方案 | 隔离方式 | 性能 | 学习成本 | 适合 |
|---|---|---|---|---|
| **Module Federation v2** | Webpack/Rspack 共享依赖 | 极佳 | 中 | 现代项目首选 |
| **single-spa** | 路由 + 生命周期 | 好 | 高 | 多技术栈混合 |
| **qiankun** | iframe-style 沙箱 | 中 | 中 | 阿里系老项目 |
| **micro-app** | Web Components 风格 | 好 | 低 | 京东系 |
| **iframe** | 完全隔离 | 差 | 极低 | 边缘场景 |

### Module Federation v2

详见 `expert.md`。要点：

- Webpack 5 / Rspack 内置
- 独立 lib `@module-federation/vite` 支持 Vite
- 共享 React 单例（singleton）
- 远程组件 lazy load

### qiankun（中国流行）

```ts
// 主应用注册子应用
import { registerMicroApps, start } from 'qiankun'

registerMicroApps([
  {
    name: 'react-sub',
    entry: 'http://localhost:3001',
    container: '#sub-container',
    activeRule: '/react',
  },
])

start()
```

```tsx
// 子应用导出生命周期
export async function bootstrap() {}
export async function mount(props) { renderApp(props.container) }
export async function unmount(props) { unmountApp(props.container) }
```

## CSS / 原子化集成

### Tailwind CSS

```bash
pnpm add -D tailwindcss @tailwindcss/vite
```

```ts
// vite.config.ts
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

```css
/* index.css */
@import "tailwindcss";
```

```tsx
function Button() {
  return (
    <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
      Click
    </button>
  )
}
```

Tailwind 4 配置文件可选（默认零配置）。

### UnoCSS

```bash
pnpm add -D unocss
```

```ts
// vite.config.ts
import UnoCSS from 'unocss/vite'

export default defineConfig({
  plugins: [react(), UnoCSS()],
})
```

```ts
// uno.config.ts
import { defineConfig, presetUno, presetIcons, presetAttributify } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetIcons({ scale: 1.2 }),
    presetAttributify(),
  ],
  shortcuts: {
    'btn': 'px-4 py-2 rounded bg-blue-500 text-white',
  },
})
```

UnoCSS 优势：极快 + 多预设（attributify、icons、typography）+ 灵活规则。

## i18n（国际化）

### react-i18next（最流行）

```bash
pnpm add i18next react-i18next i18next-browser-languagedetector
```

```ts
// i18n.ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: { hello: 'Hello, {{name}}!' } },
      zh: { translation: { hello: '你好，{{name}}！' } },
    },
    fallbackLng: 'en',
  })

export default i18n
```

```tsx
import { useTranslation, Trans } from 'react-i18next'

function Greeting() {
  const { t, i18n } = useTranslation()

  return (
    <div>
      <h1>{t('hello', { name: 'World' })}</h1>
      <button onClick={() => i18n.changeLanguage('zh')}>切换中文</button>
    </div>
  )
}
```

### react-intl（FormatJS）

Yahoo 开源，标准 ICU MessageFormat：

```tsx
import { IntlProvider, FormattedMessage, FormattedNumber, FormattedDate } from 'react-intl'

const messages = {
  greeting: 'Hello, {name}!',
  itemCount: '{count, plural, one {# item} other {# items}}',
}

<IntlProvider locale="en" messages={messages}>
  <FormattedMessage id="greeting" values={{ name: 'World' }} />
  <FormattedNumber value={1234.56} style="currency" currency="USD" />
  <FormattedDate value={new Date()} year="numeric" month="long" day="numeric" />
</IntlProvider>
```

ICU 格式支持复数、性别、日期、数字自动本地化。

### LinguiJS

```tsx
import { Trans, useLingui } from '@lingui/react/macro'

function Greeting() {
  const { t } = useLingui()
  return (
    <div>
      <Trans>Hello, World!</Trans>
      <button>{t`Click me`}</button>
    </div>
  )
}
```

构建时提取消息，运行时小。

## Storybook

### 安装

```bash
pnpm dlx storybook@latest init
```

自动检测 React + Vite/Next.js 并配置好。

### Story 写法

```tsx
// Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { Button } from './Button'

const meta: Meta<typeof Button> = {
  component: Button,
  title: 'UI/Button',
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary'] },
    size: { control: 'radio', options: ['sm', 'md', 'lg'] },
  },
  args: {
    onClick: fn(),
  },
}

export default meta
type Story = StoryObj<typeof Button>

export const Primary: Story = {
  args: { variant: 'primary', children: 'Click' },
}

export const Disabled: Story = {
  args: { disabled: true, children: 'Disabled' },
}

// 交互测试
export const Clickable: Story = {
  args: { children: 'Click me' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button'))
    expect(args.onClick).toHaveBeenCalled()
  },
}
```

### Storybook 8+ 特性

- Vite 第一公民
- Test runner 集成 Playwright
- MDX 文档
- Chromatic 视觉回归
- 自动 `tags: ['autodocs']` 生成文档

## React 生态对比

### Solid

API 与 React Hooks 高度相似，但底层完全不同：

```tsx
import { createSignal, createEffect } from 'solid-js'

function Counter() {
  const [count, setCount] = createSignal(0)
  createEffect(() => console.log('count', count()))   // 自动追踪依赖

  return <button onClick={() => setCount(c => c + 1)}>{count()}</button>
}
```

**与 React 对比**：

| | React | Solid |
|---|---|---|
| 编译 | 运行时 VDOM | 编译时 fine-grained |
| 重渲染 | 整个组件函数 | 只重跑用到信号的局部 |
| Bundle | ~45KB | ~7KB |
| 性能 | 中 | 极佳（接近原生） |
| 生态 | 极大 | 小 |

**Solid 适合**：性能敏感场景，喜欢 React 写法但厌倦 hook 心智负担。

### Preact

React 的「轻量替代」（3KB），同 API：

```tsx
// 直接当 React 用
import { h, render } from 'preact'
import { useState } from 'preact/hooks'

function App() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}

render(<App />, document.body)
```

**`preact/compat`** 让 React 项目无缝迁移：

```ts
// vite.config.ts
export default {
  resolve: {
    alias: { react: 'preact/compat', 'react-dom': 'preact/compat' },
  },
}
```

**Preact 适合**：极致包体积要求（小程序、嵌入式 Widget、营销页）。

### Inferno

「最快的 React 风格库」（基准测试常年第一），API 与 React 一致：

```tsx
import { render } from 'inferno'
import { Component } from 'inferno'
```

**Inferno 适合**：超大数据量列表 / 表格场景；生态比 Preact 还小。

### Million.js

不是替代 React，而是运行时优化 lib——在 React 之上加块虚拟化：

```bash
pnpm add million
```

```tsx
import { block } from 'million/react'

const MyComponent = block(function MyComponent({ data }) {
  return <div>{data.value}</div>
})
```

Million 对该组件用「Block VDOM」算法，省去多余 diff。声称性能提升 70%-90%。

::: warning Million 与 Compiler 二选一
React Compiler 普及后 Million 的价值减弱——Compiler 是官方且自动；Million 需要 `block()` 包裹手动标记。
:::

## 路由库对比

| 路由库 | 优点 | 缺点 | 适合 |
|---|---|---|---|
| **React Router v7** | 最主流、Remix 合并 | 类型推导一般 | 多数 SPA / SSR |
| **TanStack Router** | 类型推导最强、搜索参数 | 学习曲线 | 强类型化项目 |
| **Next.js App Router** | 文件路由、RSC、官方 | 锁定 Next.js | 全栈项目 |
| **Wouter** | 1KB 超小 | 功能少 | 极简 SPA |
| **Reach Router** | 历史方案 | 已合并 React Router | 维护遗留 |

## 状态库对比（完整版）

详见 `advanced.md`。补充以下：

| 库 | 风格 | 备注 |
|---|---|---|
| **Effector** | reactive store | 来自俄语社区，类型很强 |
| **Nanostores** | atom（极简） | ~1KB，与框架无关 |
| **Reatom** | actor-based | Effector 替代 |
| **Legend State** | observable + sync | 性能极佳、内置持久化 |

## 数据获取库对比

| 库 | 特色 | 适合 |
|---|---|---|
| **TanStack Query** | 最流行、文档完善、DevTools 强 | 绝大多数 REST API 项目 |
| **SWR** | Vercel 出品、API 简单 | 轻量项目 / Next.js |
| **RTK Query** | Redux 一体化 | 已用 Redux Toolkit 项目 |
| **Apollo Client** | GraphQL 标杆 | GraphQL 项目 |
| **urql** | 轻量 GraphQL | GraphQL + 关注包体积 |
| **TanStack Router loader** | 路由级数据 | 已用 TanStack Router |

## 学习资源

### 官方

- [react.dev](https://react.dev/) —— 重写后的现代教程
- [React Blog](https://react.dev/blog) —— 重要更新公告
- [reactwg](https://github.com/reactwg) —— React 工作组（实验特性 RFC）

### 社区

- [Tao of React](https://alexkondov.com/tao-of-react/) —— 最佳实践集
- [Patterns.dev](https://www.patterns.dev/) —— 设计模式
- [Total TypeScript](https://www.totaltypescript.com/) —— Matt Pocock 的 TS + React 课程
- [Epic React](https://www.epicreact.dev/) —— Kent C. Dodds 系列
- [Josh Comeau](https://www.joshwcomeau.com/) —— React + CSS 深度教程

### 中文

- [React 技术揭秘](https://react.iamkasong.com/) —— Fiber / Reconciler 原理
- [Pure React](https://pure-react.com/) —— 中文翻译版官方文档

## 选型建议（场景对照）

| 场景 | 推荐栈 |
|---|---|
| **SPA + 后端 API** | Vite + React + React Router v7 + TanStack Query + Zustand |
| **全栈 SaaS** | Next.js App Router + Prisma + TanStack Query + shadcn/ui |
| **后台管理** | Vite + React + Ant Design + Zustand + React Hook Form |
| **博客 / 营销** | Astro + React Islands（仅交互组件 React） |
| **跨端移动** | Expo + Expo Router + TanStack Query + Zustand |
| **桌面应用** | Tauri + React + Tailwind |
| **3D 应用** | Vite + react-three-fiber + Drei + Zustand |
| **微前端** | Module Federation v2 + React |
| **极致包体积** | Preact + preact/compat + Wouter |
| **强类型项目** | Vite + React + TanStack Router + TanStack Query |

## 速查清单（其它完成后做到）

- [ ] 了解 React Native + Expo 基本架构与 New Architecture
- [ ] 知道 Electron / Tauri 选型差异
- [ ] 至少了解一种微前端方案（Module Federation v2 优先）
- [ ] 集成过 Tailwind 或 UnoCSS
- [ ] 集成过 i18next 国际化
- [ ] 写过 Storybook
- [ ] 知道 Solid / Preact / Inferno / Million 的定位
- [ ] 选型时知道何种栈适合何种场景

下一篇 `reference.md` 是 API 速查表，按字典使用。
