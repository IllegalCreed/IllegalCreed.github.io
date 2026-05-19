---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 **Element Plus 2.x**（截至 2026 年 **v2.14+**；要求 **Vue 3.x** + **Node 18+**，已正式停止支持 Vue 2、Vue 2 项目请继续使用 Element UI v2.15.x）编写。

## 速查

- 系统要求：**Vue 3.x**（推荐 3.4+） + **Node 18+** + 推荐 **TypeScript 5+** + Sass 1.79+（v2.8.5+ 要求）
- 浏览器：Chrome ≥85 / Edge ≥85 / Firefox ≥79 / Safari ≥14.1（v2.5.0+）
- 安装：`pnpm add element-plus` / `npm install element-plus --save` / `yarn add element-plus`
- 图标包：`pnpm add @element-plus/icons-vue`（**独立包，需要图标必装**）
- 按需引入插件：`pnpm add -D unplugin-vue-components unplugin-auto-import`
- 全量引入：`app.use(ElementPlus)` + `import 'element-plus/dist/index.css'`（main.ts 一次性引入）
- 按需引入：`unplugin-vue-components/vite` + `ElementPlusResolver` 自动 import 组件 + 自动注入 CSS
- 命令式 API 按需：`unplugin-auto-import/vite` + `ElementPlusResolver` 自动 import `ElMessage` / `ElLoading` 等
- TS 类型：`tsconfig.json` 加 `"types": ["element-plus/global"]`（全量引入必需）
- 中文 i18n：`import zhCn from 'element-plus/es/locale/lang/zh-cn'` + `app.use(ElementPlus, { locale: zhCn })`
- 暗色模式：`import 'element-plus/theme-chalk/dark/css-vars.css'` + `<html class="dark">`
- 主题定制：`@forward 'element-plus/theme-chalk/src/common/var.scss' with (...)`（编译期 SCSS）
- 全局配置：`<el-config-provider :locale="zhCn" :size="'default'" :z-index="3000">` 包裹整个 App
- Volar 智能提示：默认开启，无需额外配置（Vue 3.x 项目用 Vue - Official 插件即可）
- 国内镜像：`npm config set registry https://registry.npmmirror.com`
- 标签必须双闭合：`<el-table></el-table>`（**不要写自闭合 `<el-table />`** —— 某些场景解析失败）

## Element Plus 是什么

Element Plus 是 **饿了么前端团队**主导、**社区维护**的 **Vue 3 UI 组件库**，是 Vue 2 时代国内最流行的 **Element UI** 的 Vue 3 后继者。理解 Element Plus 必须先理解它**和 Element UI 的关系**：

- **Element UI**（2016-2020）：基于 **Vue 2 + Options API + SCSS-only 主题**，国内中后台市场 **70%+** 占有率，**仅维护、不再新增特性**
- **Element Plus**（2020-至今）：基于 **Vue 3 + Composition API + TypeScript + CSS Variables**，**完全重写**——API 与 Element UI 基本兼容但**实现完全不同**
- **核心团队**：饿了么团队 + **三咲智子**（Sxzz、Vue 核心团队成员）+ 数百位社区贡献者
- **截至 2026 年的 v2.14+**：处于「**稳定演进期**」——新增 Mention / Splitter / Tour / Statistic 等组件 + 修复 SSR / 暗色模式 bug，核心组件 API **高度稳定**

Element Plus 与 Vuetify / Naive UI / Ant Design Vue 等 Vue 3 UI 库的本质差异：

| 维度 | Element Plus | Naive UI | Ant Design Vue | Vuetify 3 |
|---|---|---|---|---|
| 阵营 | 饿了么 + 社区 | TuSimple + 社区 | Ant Design 社区 | Vuetify Team |
| 设计语言 | 企业管理后台 | 现代极简 | Ant Design | Material Design |
| 国内市场份额 | **断层第一** | 中（增长快） | 中（国际化好） | 低（设计风格不主流） |
| TypeScript | 完整类型 | **TS-first** | 完整类型 | 完整类型 |
| 主题系统 | CSS Vars + SCSS | **ConfigProvider 配置式** | Less Variables | SCSS + theme prop |
| 暗色模式 | 内置 | 内置 | 内置 | 内置 |
| 组件数 | **80+** | 90+ | 60+ | 80+ |
| Bundle | ~500KB+（重组件多） | ~250KB | ~400KB | ~600KB |
| SSR | Nuxt 模块 | 内置 | Nuxt 模块 | 内置 |
| 中文文档 | **官方完整** | 完整 | 完整 | 弱 |
| 招聘市场 | **国内绝对主流** | 起步 | 国际化项目多 | 海外多 |

**含义**：

- Element Plus **国内中后台市场占有率断层第一**——招聘、文档、问答、培训、面试题全部围绕 Element Plus
- Naive UI **设计品质 + TS 严格性更好**，但生态小、招聘市场起步阶段——适合**新项目 + 追求设计** 场景
- Ant Design Vue **设计语言一致 + 国际化好**，但**国内市场被 Element Plus 大幅领先**——适合**国际化 / 与 React Antd 风格统一**场景
- Vuetify 3 **严格 Material Design**——适合**移动端优先 + Material 风格**场景，国内中后台少用
- **不适合**：面向 C 端的现代营销页（用 Tailwind / Naive UI）/ 需要严格 Material Design（用 Vuetify）/ 移动端 H5（用 Vant）
- **适合**：99% 的国内 Vue 3 中后台 / 管理后台 / SaaS / ERP / CRM——这不是吹捧、是国内 Vue 3 生态的**默认选择**

## 安装与首次启动

### 创建 Vue 3 项目

如果你**还没有 Vue 3 项目**，先创建一个：

```bash
pnpm create vue@latest
# 或：npm create vue@latest / yarn create vue / bun create vue@latest
```

交互式菜单建议都选 **Yes**（TypeScript / Router / Pinia / ESLint / Vitest）：

```
✔ Add TypeScript? … Yes
✔ Add JSX Support? … No
✔ Add Vue Router for Single Page Application development? … Yes
✔ Add Pinia for state management? … Yes
✔ Add Vitest for Unit Testing? … Yes
✔ Add ESLint for code quality? … Yes
```

> 完成后已有完整 Vue 3 + TS 项目骨架——下一步**单独装 Element Plus**（create-vue 不带 Element Plus 选项，与 React 的 antd / Material UI 不同）。

### 安装 Element Plus

```bash
# 主包
pnpm add element-plus

# 图标包（独立、需要图标必装）
pnpm add @element-plus/icons-vue
```

| 库 | 用途 | 必需 |
|---|---|---|
| `element-plus` | 主组件库 | **必需** |
| `@element-plus/icons-vue` | 700+ 图标 | 可选（但几乎都装） |
| `unplugin-vue-components` | 按需引入组件 | 推荐（按需引入必需） |
| `unplugin-auto-import` | 按需引入命令式 API | 推荐（ElMessage 等） |
| `unplugin-element-plus` | 按需引入 SCSS（主题定制场景） | 仅主题定制 + 按需场景 |

Vue 版本要求：

| Vue 版本 | Element 版本 |
|---|---|
| **Vue 3.x** | **Element Plus 2.x**（推荐） |
| Vue 2.x | Element UI v2.15.x（仅维护、不再新增特性） |

> Element Plus **已正式停止支持 Vue 2**——如果维护 Vue 2 项目，继续使用 [Element UI 文档](https://element.eleme.cn/)。

### 国内镜像加速

国内网络下载 npm 包慢时配置淘宝镜像：

```bash
npm config set registry https://registry.npmmirror.com

# 验证
npm config get registry
```

> **pnpm** 默认使用 npm registry——pnpm 用户同样需要配置 npmmirror。

## 全量引入（最简单）

**适合**：小项目 / 演示 / 不关心 bundle 大小的内部工具。一次性引入所有组件 + 所有 CSS：

### main.ts 配置

```ts
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css' // 全部组件 CSS（~300KB）
import App from './App.vue'

const app = createApp(App)

app.use(ElementPlus)
app.mount('#app')
```

**用法**：模板中直接用所有组件，**无需 import**：

```vue
<template>
  <el-button type="primary">主要按钮</el-button>
  <el-input v-model="text" placeholder="请输入" />
  <el-table :data="tableData">
    <el-table-column prop="name" label="姓名" />
  </el-table>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const text = ref('')
const tableData = ref([{ name: '张三' }, { name: '李四' }])
</script>
```

### tsconfig.json 添加全局类型

全量引入时，组件**全局注册**（不需要 import），但 TypeScript 不知道它们存在——需要在 `tsconfig.json` 中声明：

```json
{
  "compilerOptions": {
    "types": ["element-plus/global"]
  }
}
```

> **不加这一行**：`<el-button>` 模板中**没有 TS 提示**、属性传错也没红线。

### 全量引入的优缺点

**优点**

- **零配置**：一行 `app.use(ElementPlus)` 完成所有注册
- **模板中无需 import**：直接用 `<el-button>` / `<el-table>`
- **演示 / 学习场景最快**：跑通示例代码无需配 Vite 插件

**缺点**

- **bundle 大**：即使只用 ElButton，CSS + 所有组件代码全部打入 bundle（~500KB）
- **首屏慢**：尤其移动端 + 慢网下首次加载明显
- **生产推荐用按需引入**：见下一节

## 按需引入（推荐）

**适合**：生产项目 / 在意 bundle 大小 / 任何中大型应用。**Tree Shaking + 自动 import**：

### 安装插件

```bash
pnpm add -D unplugin-vue-components unplugin-auto-import
```

| 插件 | 作用 |
|---|---|
| `unplugin-vue-components` | 扫描模板中 `<el-button>` 自动 import `ElButton` + 自动注入 CSS |
| `unplugin-auto-import` | 扫描代码中 `ElMessage` / `ElLoading` 等自动 import 命令式 API |

### Vite 配置

`vite.config.ts`：

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    // 自动 import 命令式 API（ElMessage / ElLoading 等）
    AutoImport({
      resolvers: [ElementPlusResolver()],
      // 自动生成 auto-imports.d.ts（TS 类型声明）
      dts: 'src/auto-imports.d.ts',
    }),
    // 自动 import 组件（ElButton / ElTable 等）
    Components({
      resolvers: [ElementPlusResolver()],
      // 自动生成 components.d.ts（TS 类型声明）
      dts: 'src/components.d.ts',
    }),
  ],
})
```

### main.ts（按需引入时极简）

不再需要 `import ElementPlus from 'element-plus'`：

```ts
import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)
app.mount('#app')
```

> **注意**：按需引入时 **`element-plus/dist/index.css` 不要 import** —— 组件 CSS 由 resolver 自动按需注入。

### Webpack 配置（如果用 Vue CLI 项目）

`vue.config.js`：

```js
const AutoImport = require('unplugin-auto-import/webpack').default
const Components = require('unplugin-vue-components/webpack').default
const { ElementPlusResolver } = require('unplugin-vue-components/resolvers')

module.exports = {
  configureWebpack: {
    plugins: [
      AutoImport({ resolvers: [ElementPlusResolver()] }),
      Components({ resolvers: [ElementPlusResolver()] }),
    ],
  },
}
```

### 按需引入的工作原理

```vue
<template>
  <el-button @click="handleClick">点击</el-button>
</template>

<script setup>
const handleClick = () => {
  ElMessage.success('成功')
}
</script>
```

**构建时插件自动转换为**：

```vue
<script setup>
// unplugin-vue-components 自动注入：
import { ElButton } from 'element-plus'
import 'element-plus/es/components/button/style/css'

// unplugin-auto-import 自动注入：
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'

const handleClick = () => {
  ElMessage.success('成功')
}
</script>
```

> **开发者只写 1 行代码、插件自动生成 4 行 import**——这是按需引入的核心价值。

### 按需引入的 TypeScript 自动生成

两个插件自动生成的 `.d.ts` 文件：

- `src/components.d.ts`：所有按需 import 的组件类型（让 Volar 知道 `<ElButton>` 存在）
- `src/auto-imports.d.ts`：所有按需 import 的命令式 API 类型（让 TS 知道 `ElMessage` 存在）

> **加到 `.gitignore` 还是提交**：建议**提交到仓库**——避免 CI 构建时第一次启动报 TS 错误。

## 第一个完整示例

新建 `src/views/HelloElementPlus.vue`：

```vue
<template>
  <div class="hello">
    <h1>第一个 Element Plus 示例</h1>

    <!-- 按钮组 -->
    <el-button type="primary" @click="showMessage">显示消息</el-button>
    <el-button type="success" @click="showConfirm">显示确认</el-button>

    <!-- 表单 -->
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="80px"
      style="margin-top: 20px; max-width: 400px"
    >
      <el-form-item label="姓名" prop="name">
        <el-input v-model="form.name" placeholder="请输入姓名" />
      </el-form-item>

      <el-form-item label="邮箱" prop="email">
        <el-input v-model="form.email" placeholder="请输入邮箱" clearable />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="submit">提交</el-button>
        <el-button @click="reset">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 表格 -->
    <el-table :data="tableData" stripe border style="margin-top: 20px">
      <el-table-column prop="name" label="姓名" />
      <el-table-column prop="age" label="年龄" width="100" />
      <el-table-column prop="email" label="邮箱" />
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'

// 表单数据
const formRef = ref<FormInstance>()
const form = reactive({
  name: '',
  email: '',
})

// 校验规则
const rules = reactive<FormRules>({
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: ['blur', 'change'] },
  ],
})

// 提交
const submit = async () => {
  if (!formRef.value) return
  await formRef.value.validate((valid) => {
    if (valid) {
      ElMessage.success(`提交成功：${form.name} - ${form.email}`)
    } else {
      ElMessage.error('请检查表单填写')
    }
  })
}

// 重置
const reset = () => {
  formRef.value?.resetFields()
}

// 弹窗
const showMessage = () => {
  ElMessage({
    message: '这是一条消息',
    type: 'success',
  })
}

const showConfirm = async () => {
  try {
    await ElMessageBox.confirm('确定要执行该操作吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    ElMessage.success('已确认')
  } catch {
    ElMessage.info('已取消')
  }
}

// 表格数据
const tableData = ref([
  { name: '张三', age: 25, email: 'zhangsan@example.com' },
  { name: '李四', age: 30, email: 'lisi@example.com' },
  { name: '王五', age: 28, email: 'wangwu@example.com' },
])
</script>
```

**这个示例覆盖了**：

- `ElButton`：基础按钮 + type 主题
- `ElForm` / `ElFormItem` / `ElInput`：表单 + 校验（async-validator）
- `ElTable` / `ElTableColumn`：基础表格
- `ElMessage` / `ElMessageBox`：命令式弹窗 + Promise 风格
- TypeScript 类型：`FormInstance` / `FormRules`

启动 `pnpm dev` 访问对应路由——可以看到完整的 Element Plus UI。

## 中文国际化

Element Plus 默认是 **英文**——国内项目需要切换到中文。

### 方式 1：app.use 时传入 locale（全量引入场景）

```ts
// main.ts
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

// 中文语言包
import zhCn from 'element-plus/es/locale/lang/zh-cn'

import App from './App.vue'

const app = createApp(App)

app.use(ElementPlus, {
  locale: zhCn,
})

app.mount('#app')
```

### 方式 2：ElConfigProvider 包裹（按需引入推荐）

按需引入时**不再 `app.use(ElementPlus, ...)`**——必须用 `<el-config-provider>`：

```vue
<!-- App.vue -->
<template>
  <el-config-provider :locale="zhCn">
    <router-view />
  </el-config-provider>
</template>

<script setup lang="ts">
import zhCn from 'element-plus/es/locale/lang/zh-cn'
</script>
```

> **生效组件**：DatePicker、Pagination、Table 排序提示、ElMessageBox 默认按钮等所有内置文案。

### Day.js 本地化（DatePicker 必需）

`ElDatePicker` 底层用 Day.js，单独配置中文：

```ts
import 'dayjs/locale/zh-cn'
```

通常和 locale import 放在一起。

### 支持的语言

Element Plus 内置 **60+ 语言包**：

| 语言 | import 路径 |
|---|---|
| 简体中文 | `element-plus/es/locale/lang/zh-cn` |
| 繁体中文 | `element-plus/es/locale/lang/zh-tw` |
| 英文 | `element-plus/es/locale/lang/en`（默认） |
| 日文 | `element-plus/es/locale/lang/ja` |
| 韩文 | `element-plus/es/locale/lang/ko` |
| 法文 | `element-plus/es/locale/lang/fr` |
| 德文 | `element-plus/es/locale/lang/de` |
| 西班牙文 | `element-plus/es/locale/lang/es` |
| 俄文 | `element-plus/es/locale/lang/ru` |
| 阿拉伯文 | `element-plus/es/locale/lang/ar` |

完整列表见 [GitHub locale 目录](https://github.com/element-plus/element-plus/tree/dev/packages/locale/lang)。

## 暗色模式

### 一行启用

`main.ts` 加一行 import：

```ts
// 暗色模式 CSS 变量
import 'element-plus/theme-chalk/dark/css-vars.css'
```

然后 HTML 根元素加 `class="dark"`：

```html
<html class="dark">
  <head>...</head>
  <body>...</body>
</html>
```

> **这就够了**——所有 Element Plus 组件自动切换到暗色主题。

### 配合 VueUse `useDark`

实际项目中应该让用户切换 + 跟随系统：

```bash
pnpm add @vueuse/core
```

```vue
<!-- DarkModeToggle.vue -->
<template>
  <el-switch
    v-model="isDark"
    inline-prompt
    active-icon="Moon"
    inactive-icon="Sunny"
  />
</template>

<script setup lang="ts">
import { useDark, useToggle } from '@vueuse/core'

// 自动同步 <html class="dark"> + localStorage 持久化 + 监听 system prefers-color-scheme
const isDark = useDark()
const toggleDark = useToggle(isDark)
</script>
```

> `useDark()` 自动监听 `prefers-color-scheme: dark`、用户未选择时跟随系统、用户切换后保存到 localStorage。

详细暗色定制（覆盖暗色变量）见[指南 > 暗色模式](./guide-line.md#暗色模式完整方案)。

## 图标使用

### 安装

```bash
pnpm add @element-plus/icons-vue
```

### 全局注册（全量引入推荐）

```ts
// main.ts
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const app = createApp(App)

// 一次性注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
```

```vue
<template>
  <el-icon><Edit /></el-icon>
  <el-icon :size="20" color="#409EFF"><Search /></el-icon>
</template>
```

### 按需引入（推荐）

模板中用到的图标直接 import：

```vue
<template>
  <el-icon><Edit /></el-icon>
  <el-button :icon="Search">搜索</el-button>
</template>

<script setup lang="ts">
import { Edit, Search } from '@element-plus/icons-vue'
</script>
```

> **`unplugin-vue-components` 不会自动 import 图标**——必须显式 import 或全局注册。

### 旋转动画

加 `class="is-loading"` 自动 2 秒一圈：

```vue
<el-icon class="is-loading"><Loading /></el-icon>
```

## 主题定制（SCSS 变量）

Element Plus 的颜色 / 间距 / 字号都由 SCSS 变量定义——**编译期定制**主题色：

### 1. 创建 SCSS 入口

`src/styles/element.scss`：

```scss
// 覆盖 Element Plus 的 SCSS 变量
@forward 'element-plus/theme-chalk/src/common/var.scss' with (
  $colors: (
    'primary': (
      'base': #1890ff, // 改为 Ant Design 蓝
    ),
    'success': (
      'base': #52c41a,
    ),
  )
);
```

### 2. 在 vite.config.ts 中配置

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver({ importStyle: 'sass' })],
    }),
    Components({
      resolvers: [ElementPlusResolver({ importStyle: 'sass' })],
    }),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/styles/element.scss" as *;`,
      },
    },
  },
})
```

### 3. 注意事项

- **`importStyle: 'sass'`**：必须在 resolver 中指定，否则 Element Plus 仍引入预编译的 CSS、SCSS 变量覆盖失效
- **SCSS 变量编译期定制 + CSS 变量运行时切换**：可以同时用——SCSS 改默认主题、CSS 变量切换暗色 / 多主题
- **完整变量列表**：见 [GitHub var.scss](https://github.com/element-plus/element-plus/blob/dev/packages/theme-chalk/src/common/var.scss)

更深入的主题定制（CSS 变量运行时切换 / 命名空间 / 多主题）见[指南 > 主题深度](./guide-line.md#主题定制完整方案)。

## 全局配置 ElConfigProvider

`<el-config-provider>` 是 Element Plus 的**全局配置中心**——locale / size / zIndex / namespace / 各组件 defaults 一处统管：

```vue
<!-- App.vue -->
<template>
  <el-config-provider
    :locale="zhCn"
    size="default"
    :z-index="3000"
    :button="{ autoInsertSpace: true }"
    :message="{ max: 3, plain: true }"
  >
    <router-view />
  </el-config-provider>
</template>

<script setup lang="ts">
import zhCn from 'element-plus/es/locale/lang/zh-cn'
</script>
```

**常用配置**：

| 选项 | 类型 | 说明 |
|---|---|---|
| `locale` | Object | 语言包（`zhCn` / `en` / ...） |
| `size` | `'large'` / `'default'` / `'small'` | 全局组件尺寸 |
| `z-index` | number | overlay 基础 z-index（默认 2000） |
| `namespace` | string | CSS 类名前缀（默认 `el`） |
| `button` | Object | Button 全局 defaults |
| `message` | Object | ElMessage 全局 defaults |
| `dialog` | Object | ElDialog 全局 defaults |

完整选项见[参考 > ElConfigProvider](./reference.md#elconfigprovider)。

## 与 Vue Router + Pinia 集成

Element Plus + Vue Router + Pinia 是「**Vue 3 后台御三家**」——一起使用零冲突：

```ts
// main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'

// 暗色模式 + 图标
import 'element-plus/theme-chalk/dark/css-vars.css'

// 路由
const router = createRouter({
  history: createWebHistory(),
  routes: [/* ... */],
})

// Pinia
const pinia = createPinia()

const app = createApp(App)
app.use(router)
app.use(pinia)
app.mount('#app')
```

```vue
<!-- App.vue -->
<template>
  <el-config-provider :locale="zhCn">
    <el-container>
      <el-aside width="200px">
        <el-menu router :default-active="$route.path">
          <el-menu-item index="/dashboard">仪表盘</el-menu-item>
          <el-menu-item index="/users">用户管理</el-menu-item>
        </el-menu>
      </el-aside>

      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-config-provider>
</template>

<script setup lang="ts">
import zhCn from 'element-plus/es/locale/lang/zh-cn'
</script>
```

- `<el-menu router>`：自动调用 `router.push(index)` 实现路由跳转
- `<el-menu :default-active="$route.path">`：高亮当前路由对应菜单项

详细集成见[指南 > 与 Vue Router 集成](./guide-line.md#与-vue-router-集成)。

## CDN 引入（无构建场景）

不用 Vite / Webpack 时（如 HTML demo / 旧项目）用 CDN：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <!-- Element Plus CSS -->
  <link rel="stylesheet" href="//unpkg.com/element-plus/dist/index.css" />
  <!-- Vue 3 -->
  <script src="//unpkg.com/vue@3"></script>
  <!-- Element Plus -->
  <script src="//unpkg.com/element-plus"></script>
  <!-- 中文语言包 -->
  <script src="//unpkg.com/element-plus/dist/locale/zh-cn"></script>
</head>
<body>
  <div id="app">
    <el-button type="primary" @click="handleClick">点击</el-button>
  </div>

  <script>
    const { createApp } = Vue

    createApp({
      methods: {
        handleClick() {
          ElementPlus.ElMessage.success('成功')
        }
      }
    })
      .use(ElementPlus, { locale: ElementPlusLocaleZhCn })
      .mount('#app')
  </script>
</body>
</html>
```

> **生产环境锁版本**：将 `//unpkg.com/element-plus/` 换成 `//unpkg.com/element-plus@2.14.0/` —— 否则 unpkg 默认 latest、未来升级可能破坏页面。

## 下一步

到这里你已经会用 Element Plus 搭建基础 Vue 3 后台应用了——下一步深入：

- [指南](./guide-line.md)：**80+ 组件分类速览** / **ElForm 深度**（嵌套校验 + 动态校验 + 提交模式）/ **ElTable 深度**（排序 / 筛选 / 树形 / 虚拟化）/ **反馈三件套**完整 API / **主题深度**（SCSS + CSS 变量 + 命名空间）/ **暗色模式完整方案** / **按需引入完整配置** / **SSR 深度** / **常见踩坑**
- [参考](./reference.md)：**API 速查** / 80+ 组件列表 / 常用 props 表 / ElConfigProvider 完整选项 / 命令式 API 签名 / TypeScript 类型 / CSS 变量
