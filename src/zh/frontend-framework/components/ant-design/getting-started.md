---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 **Ant Design 5.x**（截至 2026 年 5 月主线为 **v5.22+**，2025 年下半年发布的 **v6.x** 是渐进升级、API 大体兼容；要求 **React 18+** + **Node 18+** + **TypeScript 5+**，**不支持 Vue / Angular**——这些技术栈请用 Ant Design Vue / NG-ZORRO）编写。

## 速查

- 系统要求：**React 18+**（推荐 React 19，v5.20+ 已完整支持） + **Node 18+** + 推荐 **TypeScript 5+**
- 浏览器：现代浏览器（Chrome / Edge / Firefox / Safari 最新两个版本） + Electron，**不支持 IE**（v5 起完全放弃）
- 安装：`pnpm add antd` / `npm i antd` / `yarn add antd`
- 图标：`pnpm add @ant-design/icons`（~700 图标，独立包，按需 import）
- 日期库：v5 默认 `dayjs`（v4 用 moment.js）—— 通常无需手动装，antd 内部已依赖
- 全量 import：`import { Button, Input, Form } from 'antd'` —— **v5 默认 Tree Shaking、无需 babel-plugin-import**
- CSS：**v5 用 CSS-in-JS（@ant-design/cssinjs）**、**无需 `import 'antd/dist/antd.css'`**——这是 v5 最大的变化
- 必须：`<ConfigProvider locale={zhCN}>` 包根（中文 i18n + 主题 + 全局配置）
- 推荐：`<App>` 组件包裹（提供 message / Modal / notification 的 Context 版本）
- 中文 i18n：`import zhCN from 'antd/locale/zh_CN'` + `import 'dayjs/locale/zh-cn'`
- 暗色模式：`import { theme } from 'antd'` + `theme=` + 双花括号包 `algorithm: theme.darkAlgorithm`
- 紧凑模式：`theme=` + 双花括号包 `algorithm: theme.compactAlgorithm`
- 组合算法：`algorithm: [theme.darkAlgorithm, theme.compactAlgorithm]`
- 主题定制：`<ConfigProvider theme=` + 双花括号包 `token` 对象
- 命名约定：所有组件 PascalCase（`<Button>` / `<Form.Item>`）
- Hook API（v5 推荐）：`message.useMessage()` / `Modal.useModal()` / `notification.useNotification()` 替代静态方法
- 国内镜像：`npm config set registry https://registry.npmmirror.com`

## Ant Design 是什么

Ant Design 是 **蚂蚁集团体验技术部** 主导维护的**企业级 React UI 设计语言 + 组件库**——是中国前端开源生态**最具影响力、最被全球开发者熟知**的项目，截至 2026 年走过 **11 年** 历程、GitHub **98.1k Star / 750+ Release**。理解 Ant Design 必须先理解它的**设计哲学**：

- **企业级 (Enterprise-class)**：从蚂蚁内部的中后台需求（支付宝商家平台 / 网商银行 / 芝麻信用等）出发，**默认服务于复杂业务表单 / 数据表格 / 中后台 CRUD 场景**——70+ 组件全部围绕这一定位
- **设计语言 (Design Language)**：不仅是组件库，更是一套完整的**设计规范**——四大价值观（自然 / 确定性 / 意义感 / 生长性）+ 视觉规范 / 文案规范 / 动效规范，配合 Figma / Sketch 资源
- **Design Token 三层架构（v5 重磅）**：Seed Token（原子值） → Map Token（自动派生） → Alias Token（语义别名）—— 主题定制从手写百行 SCSS 变成**调整几个 Seed Token**
- **CSS-in-JS（v5 重磅）**：基于自研 `@ant-design/cssinjs`，**主题运行时切换零编译**——是 v5 对比 v4 最大的架构升级
- **截至 2026 年的 v5.22+ → v6.4**：处于「**稳定演进期**」——v6 是 2025 年下半年发布的渐进升级、主要新增 BorderBeam / Masonry / Splitter + Zero Runtime 模式，**绝大多数项目仍跑在 v5**

Ant Design 与其他主流 React UI 库的差异：

| 维度 | Ant Design | Material UI (MUI) | Mantine | Chakra UI | shadcn/ui |
|---|---|---|---|---|---|
| 阵营 | 蚂蚁集团 + 社区 | Google + MUI 团队 | Mantine Dev | Segun Adebayo + 社区 | shadcn 个人 + 社区 |
| 国内市场份额 | **断层第一** | 中（国际化项目） | 起步增长 | 低（国内） | 起步增长（前沿团队） |
| 设计语言 | **企业管理后台** | Material Design | 现代极简 | 灵活 a11y | 拷贝 Radix + Tailwind |
| 组件数 | **70+** | 60+ | **120+** | 50+ | ~50（持续扩充） |
| 主题方案 | **Design Token + cssinjs** | sx props + Emotion | CSS Variables + Mantine theme | Theme prop + Emotion | Tailwind + cn() |
| TypeScript | **完整类型** | 完整类型 | TS-first | 完整类型 | 完整类型 |
| Bundle | **较大** ~800KB（含 Form/Table） | ~600KB | ~400KB | ~350KB | **最小**（按拷贝） |
| 中文文档 | **官方完整** | 弱 | 弱 | 弱 | 弱 |
| 招聘市场 | **国内绝对主流** | 国际化项目多 | 起步 | 起步 | 前沿团队 |

**含义**：

- Ant Design **企业级中后台 + 70+ 组件 + 国内招聘主流**——是 **国内 React 中后台项目的默认选择**
- **不适合**：C 端营销页 / 设计驱动产品 / 移动端 H5（用 antd-mobile）/ 需要严格 Material Design 风（用 MUI）/ 极致 bundle 优化（用 shadcn/ui）
- **适合**：国内中后台项目 / 企业 SaaS / ERP / CRM / 支付宝 + 阿里系产品 / 与 ant-design-pro 模板配合的快速搭建场景

## 安装与首次启动

### 创建 React 项目

如果**还没有 React 项目**，推荐用以下任一脚手架：

**Vite**（轻量、启动快，**推荐新项目使用**）：

```bash
pnpm create vite antd-demo --template react-ts
cd antd-demo
pnpm install
```

**Next.js**（含 App Router、SSR / SSG / RSC）：

```bash
pnpm create next-app@latest antd-demo --typescript
cd antd-demo
pnpm install
```

**Rsbuild**（字节出品，基于 Rspack 的 Webpack 替代）：

```bash
pnpm create rsbuild@latest --template react-ts
```

### 安装 Ant Design

```bash
# 主包
pnpm add antd

# 图标包（强烈推荐）
pnpm add @ant-design/icons

# 如果用 Next.js App Router：
pnpm add @ant-design/nextjs-registry
```

| 库 | 用途 | 必需 |
|---|---|---|
| `antd` | 主组件库 | **必需** |
| `@ant-design/icons` | 图标包（~700 图标） | 强烈推荐 |
| `@ant-design/nextjs-registry` | Next.js App Router cssinjs 集成 | 仅 Next.js |
| `@ant-design/cssinjs` | CSS-in-JS 底层（antd 内部依赖） | 自动安装 |
| `@ant-design/pro-components` | 中后台二次封装（ProForm / ProTable / ProLayout） | 可选 |
| `@ant-design/charts` | 数据可视化 | 可选 |
| `dayjs` | 日期库（v5 默认依赖） | 自动安装 |

React 版本要求：

| React 版本 | Ant Design 版本 |
|---|---|
| **React 18+** | **Ant Design 5.x**（推荐） |
| **React 19** | **Ant Design 5.20+ / 6.x**（完整支持） |
| React 17 | Ant Design 4.x（不再积极维护） |
| React 16 | Ant Design 4.x（不再积极维护） |

### 国内镜像加速

```bash
npm config set registry https://registry.npmmirror.com

# 验证
npm config get registry
```

> **pnpm 用户同样需要**——pnpm 默认走 npm registry。

## 第一个 Ant Design 应用

### main.tsx（Vite 入口）

```tsx
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

> **注意 v5 的关键变化**：**不需要 `import 'antd/dist/antd.css'`**——v5 用 CSS-in-JS、CSS 在组件渲染时按需注入。

### App.tsx（必须 ConfigProvider 包根）

```tsx
import { ConfigProvider, App as AntApp } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import HelloAntd from './HelloAntd'

// 设置 dayjs 中文 locale（DatePicker 等组件依赖）
dayjs.locale('zh-cn')

function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 6,
        },
      }}
    >
      <AntApp>
        <HelloAntd />
      </AntApp>
    </ConfigProvider>
  )
}

export default App
```

> **三个关键决策**：
>
> 1. **`<ConfigProvider locale={zhCN}>`**：所有 Ant Design 组件**必须在它内部**——否则中文 locale / 主题 token 全部不生效
> 2. **`<App>` 组件包裹（v5 推荐）**：提供 message / Modal / notification 的 **Context 版本**——解决静态方法不消费 ConfigProvider 主题的问题（详见下文）
> 3. **dayjs locale**：`import 'dayjs/locale/zh-cn'` + `dayjs.locale('zh-cn')`——DatePicker 等组件依赖（**v5 替换 v4 的 moment.js**）

### HelloAntd.tsx（第一个组件示例）

```tsx
import { Button, Form, Input, Space, Typography, App } from 'antd'
import { UserOutlined, MailOutlined } from '@ant-design/icons'

const { Title } = Typography

interface FormValues {
  name: string
  email: string
}

function HelloAntd() {
  // 使用 App.useApp() 获取 message / modal / notification（v5 推荐方式）
  const { message, modal } = App.useApp()

  const [form] = Form.useForm<FormValues>()

  const handleFinish = (values: FormValues) => {
    message.success(`提交成功：${values.name} - ${values.email}`)
  }

  const handleDelete = () => {
    modal.confirm({
      title: '确认删除？',
      content: '此操作不可恢复',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        message.success('已删除')
      },
    })
  }

  return (
    <div style={{ padding: 24, maxWidth: 500, margin: '0 auto' }}>
      <Title level={2}>第一个 Ant Design 示例</Title>

      <Space>
        <Button type="primary">主按钮</Button>
        <Button>默认按钮</Button>
        <Button danger onClick={handleDelete}>删除</Button>
      </Space>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        style={{ marginTop: 24 }}
      >
        <Form.Item
          label="姓名"
          name="name"
          rules={[
            { required: true, message: '请输入姓名' },
            { min: 2, max: 20, message: '长度在 2 到 20 之间' },
          ]}
        >
          <Input prefix={<UserOutlined />} placeholder="请输入姓名" />
        </Form.Item>

        <Form.Item
          label="邮箱"
          name="email"
          rules={[
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '邮箱格式不正确' },
          ]}
        >
          <Input prefix={<MailOutlined />} placeholder="请输入邮箱" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">提交</Button>
        </Form.Item>
      </Form>
    </div>
  )
}

export default HelloAntd
```

**这个示例覆盖**：

- `<Button>`：主按钮 + 默认按钮 + 危险按钮
- `<Form>` / `<Form.Item>` / `<Input>`：表单 + 校验
- `<Form>` 的 `name` 路径属性（注意不是 `prop` 也不是 `path`）
- `App.useApp()`：获取 message / modal —— **v5 推荐方式**
- `@ant-design/icons`：图标用法（PascalCase 命名 + 直接作 React 组件）
- TypeScript：泛型 `Form&lt;FormValues&gt;`

启动 `pnpm dev` 访问 `http://localhost:5173`——可以看到完整的 Ant Design UI。

## Tree Shaking（v5 默认开启）

**v5 关键变化**：**无需 `babel-plugin-import`、无需 `babel-plugin-antd`、无需任何按需引入插件**——`import { Button } from 'antd'` 在打包时**自动 Tree Shaking**。

> Ant Design 团队在 v5 重写时把整个库设计成 ES Module 友好的形式（每个组件独立导出 + 不导出未使用的依赖），现代打包工具（Webpack 5 / Vite / Rollup / Rsbuild）**默认就能 Tree Shaking**。

### v4 vs v5 的对比

```ts
// v4 时代：必须配 babel-plugin-import
// .babelrc.js
{
  "plugins": [
    ["import", { "libraryName": "antd", "style": true }]   // ❌ v5 不再需要
  ]
}

// v5 时代：直接 import 即可
import { Button, Form, Table } from 'antd'                  // ✅ 自动 Tree Shaking
```

### 验证 Tree Shaking 是否生效

打包后查看 bundle 文件——只包含你 import 的组件 + 它们的内部依赖：

```bash
# Vite
pnpm build
ls -lh dist/assets/*.js

# Rsbuild
pnpm build
ls -lh dist/static/js/*.js
```

> **如果 bundle 包含整个 antd**：检查是否 `import * as antd from 'antd'`（破坏 Tree Shaking） / 是否引入了某个聚合组件库（包了一层 antd）。

## 主题定制（基础）

Ant Design 主题系统的**核心入口是 `<ConfigProvider theme>`**——主题就是**纯 TS 对象**，**无需 SCSS / Less / CSS 变量、无需重新编译**。

### 基础用法

```tsx
import { ConfigProvider } from 'antd'

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1677ff',         // 主色（蚂蚁蓝）
          borderRadius: 8,                  // 全局圆角
          colorBgContainer: '#f5f5f5',     // 容器背景
        },
      }}
    >
      <YourApp />
    </ConfigProvider>
  )
}
```

> **运行时切换主题**：把 `theme` 改成 state / props —— **整个 App 瞬间换主题、零 CSS 重排**（CSS-in-JS 内部已优化）。

### 暗色模式（一行启用）

```tsx
import { ConfigProvider, theme } from 'antd'

function App() {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,    // 暗色算法
      }}
    >
      <YourApp />
    </ConfigProvider>
  )
}
```

> **`algorithm`** 是 Design Token 算法系统：
> - `theme.defaultAlgorithm`（浅色，默认）
> - `theme.darkAlgorithm`（暗色）
> - `theme.compactAlgorithm`（紧凑模式）
>
> **可以组合**：`algorithm: [theme.darkAlgorithm, theme.compactAlgorithm]` 表达 **暗色 + 紧凑**。

### 用户切换 + 跟随系统

```tsx
import { useState, useEffect } from 'react'
import { ConfigProvider, theme, Switch } from 'antd'

function App() {
  const [isDark, setIsDark] = useState(false)

  // 初始化：跟随系统主题
  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    setIsDark(mql.matches)
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <Switch checked={isDark} onChange={setIsDark} checkedChildren="暗" unCheckedChildren="亮" />
      <YourApp />
    </ConfigProvider>
  )
}
```

详细主题深度（Design Token 三层架构 / 嵌套 ConfigProvider / 多主题切换 / Pro Components 主题）见[指南 > Design Token 深度](./guide-line.md#design-token-深度).

## 中文国际化

Ant Design 默认是 **英文**——国内项目必须切到中文。**i18n 分两部分**：

- **antd locale**：`zhCN` 包含组件文案（按钮 / 表格 / 分页器等）
- **dayjs locale**：`zh-cn` 包含日期组件本地化（DatePicker / TimePicker / Calendar）

### 配置中文

```tsx
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

// 设置 dayjs 全局 locale（必须在渲染前调用）
dayjs.locale('zh-cn')

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <YourApp />
    </ConfigProvider>
  )
}
```

> **`import 'dayjs/locale/zh-cn'` + `dayjs.locale('zh-cn')` 不能省**——否则 DatePicker 中的星期 / 月份名仍是英文。**这是从 v4 迁移到 v5 的最高频踩坑**。

### 动态切换语言

```tsx
import { useState } from 'react'
import { ConfigProvider, Button } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import enUS from 'antd/locale/en_US'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import 'dayjs/locale/en'

function App() {
  const [lang, setLang] = useState<'zh' | 'en'>('zh')

  const handleSwitch = () => {
    const newLang = lang === 'zh' ? 'en' : 'zh'
    setLang(newLang)
    dayjs.locale(newLang === 'zh' ? 'zh-cn' : 'en')
  }

  return (
    <ConfigProvider locale={lang === 'zh' ? zhCN : enUS}>
      <Button onClick={handleSwitch}>切换语言：{lang}</Button>
      <YourApp />
    </ConfigProvider>
  )
}
```

### 支持的语言（部分）

Ant Design 内置 **60+ 语言包**：

| 语言 | locale 文件名 | dayjs locale |
|---|---|---|
| 简体中文 | `antd/locale/zh_CN` | `'zh-cn'` |
| 繁体中文（台湾） | `antd/locale/zh_TW` | `'zh-tw'` |
| 繁体中文（香港） | `antd/locale/zh_HK` | `'zh-hk'` |
| 英文 | `antd/locale/en_US`（默认） | `'en'` |
| 日文 | `antd/locale/ja_JP` | `'ja'` |
| 韩文 | `antd/locale/ko_KR` | `'ko'` |
| 法文 | `antd/locale/fr_FR` | `'fr'` |
| 德文 | `antd/locale/de_DE` | `'de'` |
| 西班牙文 | `antd/locale/es_ES` | `'es'` |
| 俄文 | `antd/locale/ru_RU` | `'ru'` |
| 阿拉伯文 | `antd/locale/ar_EG` | `'ar'` |

完整列表见 [GitHub locale 目录](https://github.com/ant-design/ant-design/tree/master/components/locale)。

## App 组件 + Hook API（v5 推荐）

**v5 重大变化**：原本的 `message.success('...')` / `Modal.confirm({...})` / `notification.open({...})` 静态方法**不消费 `<ConfigProvider>` 的主题 / locale**——因为它们渲染在独立的 React 树外。

### 静态方法 vs Hook 版本

```tsx
// ❌ v5 不推荐：静态方法不消费 ConfigProvider 主题
import { message } from 'antd'

const handleClick = () => {
  message.success('保存成功')        // 主题 / locale 可能不生效
}
```

```tsx
// ✅ v5 推荐方式 1：用 App.useApp()
import { App } from 'antd'

const MyComponent = () => {
  const { message, modal, notification } = App.useApp()

  const handleClick = () => {
    message.success('保存成功')        // 主题 / locale 完美生效
  }

  return <Button onClick={handleClick}>保存</Button>
}

// App.tsx
import { ConfigProvider, App as AntApp } from 'antd'

const App = () => (
  <ConfigProvider theme={{...}} locale={zhCN}>
    <AntApp>
      <MyComponent />
    </AntApp>
  </ConfigProvider>
)
```

### `App` 组件 vs `useMessage` Hook

两种 v5 推荐方式：

**方式 1：`<App>` + `App.useApp()`**（**最推荐**，一行解决三大反馈 API）：

```tsx
import { App } from 'antd'

// 在根组件包 <App>
<App>
  <YourApp />
</App>

// 子组件中调用
const { message, modal, notification } = App.useApp()
message.success('...')
modal.confirm({...})
notification.success({...})
```

**方式 2：每个 API 单独用 Hook**（精细控制）：

```tsx
import { message, Modal, notification } from 'antd'

const MyComponent = () => {
  const [messageApi, messageContextHolder] = message.useMessage()
  const [modalApi, modalContextHolder] = Modal.useModal()
  const [notificationApi, notificationContextHolder] = notification.useNotification()

  return (
    <>
      {messageContextHolder}
      {modalContextHolder}
      {notificationContextHolder}
      <Button onClick={() => messageApi.success('...')}>消息</Button>
      <Button onClick={() => modalApi.confirm({...})}>对话框</Button>
    </>
  )
}
```

> **使用 `<App>` 组件就不需要手动放 contextHolder**——它自动处理。**这是 v5 比 v4 用户体验上的最大改进**。

## 图标使用

Ant Design **不内置图标**——必须装 `@ant-design/icons`（~700 图标）：

### 安装

```bash
pnpm add @ant-design/icons
```

### 基础用法

每个图标都是独立的 React 组件——PascalCase + Outlined / Filled / TwoTone 后缀：

```tsx
import { Button } from 'antd'
import {
  EditOutlined,
  DeleteFilled,
  SettingTwoTone,
  HomeOutlined,
  SearchOutlined,
} from '@ant-design/icons'

function IconDemo() {
  return (
    <>
      <Button icon={<EditOutlined />}>编辑</Button>
      <Button icon={<DeleteFilled />} danger>删除</Button>
      <Button icon={<SettingTwoTone twoToneColor="#1677ff" />}>设置</Button>

      {/* 直接作为 React 组件渲染 */}
      <HomeOutlined style={{ fontSize: 24, color: '#1677ff' }} />
      <SearchOutlined spin />                              {/* 旋转动画 */}
    </>
  )
}
```

### 三种风格

| 后缀 | 风格 | 例子 |
|---|---|---|
| `Outlined` | **线框**（默认推荐） | `HomeOutlined` / `EditOutlined` |
| `Filled` | **实心** | `HomeFilled` / `EditFilled` |
| `TwoTone` | **双色**（可设第二色） | `HomeTwoTone` / `EditTwoTone twoToneColor="#1677ff"` |

### 自定义图标（IconFont / SVG）

```tsx
import { createFromIconfontCN } from '@ant-design/icons'

const IconFont = createFromIconfontCN({
  scriptUrl: '//at.alicdn.com/t/font_xxx.js',  // iconfont.cn 的 Symbol 链接
})

function App() {
  return <IconFont type="icon-tuichu" />
}
```

## Vite 集成（完整）

Vite 是 Ant Design **官方推荐的现代项目脚手架**——零额外配置。

### 创建项目

```bash
pnpm create vite antd-demo --template react-ts
cd antd-demo
pnpm install
pnpm add antd @ant-design/icons
```

### vite.config.ts（基础，无需额外配置）

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

> **v5 默认 Tree Shaking**——Vite 项目不需要 `vite-plugin-imp` 或类似插件。

### main.tsx + App.tsx 见前文

直接 `pnpm dev` 即可。

## Next.js App Router 集成

Next.js **App Router**（13.4+）默认 RSC（React Server Components）—— **Ant Design 是客户端组件库**，必须用 `<AntdRegistry>` 处理 cssinjs SSR。

### 安装

```bash
pnpm add antd @ant-design/icons @ant-design/nextjs-registry
```

### app/layout.tsx

```tsx
import { AntdRegistry } from '@ant-design/nextjs-registry'
import { ConfigProvider, App as AntApp } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

dayjs.locale('zh-cn')

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <AntdRegistry>
          <ConfigProvider locale={zhCN} theme={{ token: { colorPrimary: '#1677ff' } }}>
            <AntApp>{children}</AntApp>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  )
}
```

### 客户端组件用法

Ant Design 组件**必须放在 `'use client'` 的组件中**：

```tsx
// app/page.tsx
'use client'

import { Button } from 'antd'

export default function HomePage() {
  return <Button type="primary">首页</Button>
}
```

### App Router 已知限制

> **`Select.Option` 等子组件不能在 RSC 中用**——必须直接 import：

```tsx
// ❌ App Router 中不支持
<Select.Option value="1">A</Select.Option>

// ✅ 改为
import { Select } from 'antd'
const { Option } = Select         // 在 'use client' 文件内

// 或直接用 options 数组
<Select options={[{ value: '1', label: 'A' }]} />
```

详细见 [Next.js 集成指南](https://ant.design/docs/react/use-with-next-cn).

## CRA / Create React App（旧项目）

CRA 项目和 Vite 项目类似——v5 默认 Tree Shaking、无需 `babel-plugin-import`：

```bash
npx create-react-app antd-demo --template typescript
cd antd-demo
pnpm add antd @ant-design/icons
```

`src/index.tsx`：

```tsx
import React from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider, App as AntApp } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import App from './App'

dayjs.locale('zh-cn')

const root = createRoot(document.getElementById('root')!)
root.render(
  <ConfigProvider locale={zhCN}>
    <AntApp>
      <App />
    </AntApp>
  </ConfigProvider>,
)
```

> **CRA 已停止积极维护**——新项目推荐 Vite / Next.js / Rsbuild。

## TypeScript 基础

Ant Design 是 **TypeScript-first** 项目——所有组件 props / events / state 都有完整 TS 类型，**无需 `@types/antd`**。

### 常用类型

```tsx
import type { FormInstance, FormProps } from 'antd'
import type { TableColumnsType, TableProps } from 'antd'
import type { ButtonProps } from 'antd'
import type { ThemeConfig } from 'antd'

// Form 实例
const formRef = useRef<FormInstance<MyData>>(null)

// Table columns
interface User {
  id: number
  name: string
  age: number
}

const columns: TableColumnsType<User> = [
  { title: '姓名', dataIndex: 'name', key: 'name' },
  { title: '年龄', dataIndex: 'age', key: 'age' },
]

// 主题类型
const theme: ThemeConfig = {
  token: { colorPrimary: '#1677ff' },
  algorithm: themeUtils.darkAlgorithm,
}
```

### 获取组件类型工具

v5 提供 `GetProps` / `GetProp` / `GetRef` 工具类型（避免手动 import 内部类型）：

```tsx
import type { GetProps, GetRef } from 'antd'
import { Button, Input } from 'antd'

type ButtonAllProps = GetProps<typeof Button>
type InputRef = GetRef<typeof Input>

const inputRef = useRef<InputRef>(null)
inputRef.current?.focus()
```

## v4 → v5 迁移要点

如果你接手的是 v4 项目，**升级到 v5 必须注意这些破坏性变更**：

### 1. CSS-in-JS（替换 Less）

```tsx
// ❌ v4：必须 import CSS
import 'antd/dist/antd.css'

// ✅ v5：无需任何 CSS 导入
// 完全靠 CSS-in-JS 运行时注入
```

### 2. moment.js → dayjs

```tsx
// ❌ v4：用 moment
import moment from 'moment'
<DatePicker defaultValue={moment('2024-01-01')} />

// ✅ v5：用 dayjs
import dayjs from 'dayjs'
<DatePicker defaultValue={dayjs('2024-01-01')} />
```

### 3. 静态方法 message / Modal / notification

```tsx
// ❌ v4：静态方法用得很 happy
import { message } from 'antd'
message.success('...')

// ✅ v5 推荐：用 App.useApp() 或 useMessage()
import { App } from 'antd'
const { message } = App.useApp()
message.success('...')                                     // 主题 / locale 正确消费
```

### 4. 移除 / 重命名的组件

- ❌ `Comment` 组件移除 —— 改用 `<List>` 自定义
- ❌ `BackTop` 移除 —— 用 `<FloatButton.BackTop>`
- ❌ `Avatar.Group` 拆分 —— `<Avatar.Group>` 仍存在但部分 props 调整
- ✅ `PageHeader` 移除 —— 蚂蚁推荐用 `@ant-design/pro-components` 的 `<PageContainer>`

### 5. ConfigProvider API

```tsx
// ❌ v4：componentSize / locale 等分散写
<ConfigProvider locale={zhCN}>
  <ConfigProvider componentSize="large">
    <App />
  </ConfigProvider>
</ConfigProvider>

// ✅ v5：theme + 全部 props 合并
<ConfigProvider locale={zhCN} componentSize="large" theme={{ token: {...} }}>
  <App />
</ConfigProvider>
```

详细迁移指南见 [v4 → v5 迁移文档](https://ant.design/docs/react/migration-v5-cn).

## 与 React Router + Zustand 集成

Ant Design + React Router + Zustand 一起使用零冲突：

```tsx
// main.tsx
import React from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { ConfigProvider, App as AntApp } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { router } from './router'

dayjs.locale('zh-cn')

createRoot(document.getElementById('root')!).render(
  <ConfigProvider locale={zhCN} theme={{ token: { colorPrimary: '#1677ff' } }}>
    <AntApp>
      <RouterProvider router={router} />
    </AntApp>
  </ConfigProvider>,
)
```

```tsx
// router.tsx
import { createBrowserRouter, Outlet } from 'react-router-dom'
import { Layout, Menu } from 'antd'
import { HomeOutlined, UserOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'

const { Header, Sider, Content } = Layout

const RootLayout = () => (
  <Layout style={{ minHeight: '100vh' }}>
    <Sider>
      <Menu
        mode="inline"
        theme="dark"
        items={[
          {
            key: 'home',
            icon: <HomeOutlined />,
            label: <Link to="/">首页</Link>,
          },
          {
            key: 'users',
            icon: <UserOutlined />,
            label: <Link to="/users">用户</Link>,
          },
        ]}
      />
    </Sider>
    <Layout>
      <Header />
      <Content>
        <Outlet />
      </Content>
    </Layout>
  </Layout>
)

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'users', element: <UsersPage /> },
    ],
  },
])
```

详细集成见[指南 > 与 React Router 集成](./guide-line.md#与-react-router--zustand-集成).

## SSR（一句话先知道）

- **Next.js**：用 [@ant-design/nextjs-registry](https://github.com/ant-design/nextjs-registry) 的 `<AntdRegistry>`（详见上文）
- **手动 SSR**（Vite SSR / Node 服务器）：用 `@ant-design/cssinjs` 的 `<StyleProvider cache={cache}>` + `extractStyle(cache)` 收集 critical CSS

详细见[指南 > SSR 完整方案](./guide-line.md#ssr--nextjs-完整方案).

## CDN 引入（无构建场景）

不用 Vite / Webpack 时（如 HTML demo / 旧项目）用 CDN：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/dayjs/dayjs.min.js"></script>
  <script src="https://unpkg.com/antd@5/dist/antd.min.js"></script>
</head>
<body>
  <div id="root"></div>

  <script>
    const { Button, ConfigProvider } = antd
    const root = ReactDOM.createRoot(document.getElementById('root'))

    root.render(
      React.createElement(ConfigProvider, null,
        React.createElement(Button, { type: 'primary', onClick: () => alert('clicked') }, '点击')
      )
    )
  </script>
</body>
</html>
```

> **生产环境锁版本**：将 `antd@5` 换成 `antd@5.22.5` —— 否则 unpkg 默认 latest、未来升级可能破坏页面。

## 下一步

到这里你已经会用 Ant Design 搭建基础 React 应用了——下一步深入：

- [指南](./guide-line.md)：**70+ 组件分类速览** / **Form 深度**（Form.useForm + name 路径 + Form.List + 嵌套对象 + 异步校验 + dependencies） / **Table 深度**（columns + sorter + filter + rowSelection + 树形 + 虚拟滚动 + 固定列） / **反馈三件套**完整 API（message / Modal / notification + Hook 版本） / **Design Token 三层架构深度** / **algorithm 算法组合** / **Pro Components 中后台二次封装** / **Next.js App Router 集成深度** / **常见踩坑**
- [参考](./reference.md)：**API 速查** / 70+ 组件列表 / 常用 props 表 / Composable / Hook 签名 / TypeScript 类型 / Design Token 完整列表 / 60+ 语言包 / 图标包对照
