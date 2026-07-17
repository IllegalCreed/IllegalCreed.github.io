---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 nuxt/ui 官方 skill（`skills/nuxt-ui/SKILL.md` 及 `references/`，v4 分支）编写。

## 速查

- **教什么**：安装（Nuxt/Vue/Laravel/AdonisJS）、语义色主题、125+ 组件选型、composables、Standard Schema 表单、overlays、dashboard/docs/chat/editor 布局、官方模板
- **渐进披露**：`SKILL.md`（入口 + 路由表）→ 按任务加载 `references/`（4 guidelines + 5 layouts + 4 recipes + 1 components 索引），**不一次全拉**
- **五条铁律**：①`UApp` 必包（toast/tooltip/overlay/i18n）②只用语义色（`text-default`/`bg-elevated`，禁 `text-gray-500`）③读生成主题文件找 slot（`.nuxt/ui/<c>.ts`）④覆盖优先级：`ui`/`class` prop → 全局 config → 主题默认 ⑤图标 `i-{collection}-{name}`（默认 `lucide`）
- **7 语义色**：primary/secondary/success/info/warning/error/neutral
- **表单**：`UForm` + `UFormField`（`name` 对齐 schema）+ Standard Schema（Zod/Valibot/Yup/Joi），`@submit` 仅校验通过才发
- **overlays**：Modal/Slideover/Drawer/Popover/Tooltip 决策矩阵；程序化用 `useOverlay()`
- **反模式**：裸调色板色、漏 `UApp`、瞎猜 slot 名、把 API 明细塞进 skill（那是 MCP 的活）

## usage skill 教什么

按官方文档，这个 usage skill 覆盖 Nuxt UI 建站全链路：

- **安装** —— Nuxt、Vue（Vite）、Laravel（Vite + Inertia）、AdonisJS（Vite + Inertia）四套接法
- **主题（theming）** —— 7 个语义色 + CSS 变量主题系统，品牌色定制
- **组件（components）** —— 125+ 组件的选型与用法模式（何时用哪个）
- **composables** —— `useToast`、`useOverlay`、`defineShortcuts`（及 `extractShortcuts`）
- **表单（forms）** —— Standard Schema 校验（Zod/Valibot/Yup/Joi）
- **overlays** —— Modal / Slideover / Drawer / Popover 及程序化 `useOverlay()`
- **布局（layouts）** —— dashboard、docs、chat（Vercel AI SDK）、editor、landing 成套页面结构
- **官方模板** —— `npx nuxi init -t ui/...` 一键起项目

## 渐进披露：SKILL.md 是入口，references 按需拉

skill 的核心设计是**渐进披露（Progressive Disclosure）**——`SKILL.md` 只放五条铁律 + 参考清单 + 路由表，具体细节分散在 14 个 reference 子文件里，**按任务再加载**，保持上下文高效：

- **guidelines/**（设计决策与约定）：`design-system`、`component-selection`、`conventions`、`forms`
- **layouts/**（整页结构）：`landing`、`dashboard`、`docs`、`chat`、`editor`
- **recipes/**（常见任务完整套路）：`data-tables`、`auth`、`overlays`、`navigation`
- **components.md**（分类组件索引，找组件名用）

`SKILL.md` 里带一张**路由表**告诉 agent「什么任务加载哪些 reference」，例如：

| 任务 | 加载这些 reference |
| --- | --- |
| 建 landing 页 | design-system, conventions, landing |
| 建 dashboard / 后台 | conventions, component-selection, dashboard |
| 建登录/注册表单 | conventions, forms, auth |
| 表格展示数据 | conventions, component-selection, data-tables |
| 定制主题/品牌色 | design-system |
| 加 modal/slideover/drawer | conventions, component-selection, overlays |
| 建文档站 | conventions, docs |

**别一次全加载**——只拉任务需要的，这正是 skill 省 token 的关键。

## 五条核心铁律（始终适用）

`SKILL.md` 开篇就立了五条「always apply」规则：

1. **永远用 `UApp` 包住应用** —— toast、tooltip、程序化 overlay 都依赖它；可传 `locale` 做 i18n。
2. **永远用语义色** —— `text-default`、`bg-elevated`、`border-muted` 等，**绝不**用 `text-gray-500` 这类裸 Tailwind 调色板色。
3. **读生成的主题文件找 slot 名** —— Nuxt 在 `.nuxt/ui/<component>.ts`，Vue 在 `node_modules/.nuxt-ui/ui/<component>.ts`，里面列出每个组件的所有 slot、variant、默认类。
4. **覆盖优先级**（高者胜）：`ui` prop / `class` prop → 全局 config → 主题默认。
5. **图标用 `i-{collection}-{name}` 格式** —— 默认 `lucide` 集合，用 MCP `search_icons` 找图标。

## 主题：7 语义色 + variants

Nuxt UI 用 **7 个语义色**，组件里永远用它们而非裸调色板：

| 语义色 | 默认 | 用途 |
| --- | --- | --- |
| `primary` | green | 主 CTA、激活态、品牌强调、链接 |
| `secondary` | blue | 次要动作、互补高亮 |
| `success` / `info` / `warning` / `error` | green/blue/yellow/red | 状态语义 |
| `neutral` | slate | 文字、边框、背景、禁用、chrome |

- **语义工具类**：文字 `text-default/muted/toned/dimmed/highlighted/inverted`；背景 `bg-default/muted/elevated/accented/inverted`；边框 `border-*`
- **variants**（按视觉权重）：`solid` > `outline` > `soft` > `subtle` > `ghost` > `link`，一个视图**只放一个 solid primary 按钮**
- **定制**：单实例用 `ui` prop（覆盖 slot）或 `class`（覆盖 root）；全局在 `app.config.ts`（Nuxt）/ `vite.config.ts`（Vue）；品牌色定义 11 个 CSS shade 后 `ui.colors` 指派

## 组件选型：决策矩阵

`component-selection` 用决策矩阵教「何时用哪个」，例如 overlays：

| 需求 | 组件 |
| --- | --- |
| 确认对话框、聚焦任务、表单 | `UModal`（阻断页面、居中） |
| 详情面板、设置、次要内容 | `USlideover`（从边缘滑入） |
| 移动端底部 sheet | `UDrawer`（滑动关闭） |
| 附着触发器的上下文信息 | `UPopover`（无遮罩） |
| 简单悬停提示 | `UTooltip`（非交互，禁放按钮/链接） |

输入类似有 `USelect`（短固定列表）vs `USelectMenu`（可搜索/多选）vs `UInputMenu`（自由输入+建议）；反馈类有 `useToast()`（瞬时）vs `UAlert`（常驻）vs `UBanner`（站级）。

## 表单：UForm + UFormField + Standard Schema

```vue
<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const schema = z.object({
  email: z.email('Invalid email'),
  password: z.string().min(8, 'Min 8 characters')
})
type Schema = z.output<typeof schema>
const state = reactive<Partial<Schema>>({ email: '', password: '' })

function onSubmit(event: FormSubmitEvent<Schema>) {
  // 校验通过后才触发，验证数据在 event.data
}
</script>
```

要点：所有输入包 `UFormField`（`name` 必须与 schema 字段**完全一致**，用来挂错误）；state 用 `reactive<Partial<Schema>>({})`；`@submit` **仅校验通过才发**；程序化校验用 `form.validate()` / `setErrors()` / `clearErrors()`。支持 Zod / Valibot / Yup / Joi。

## composables 与约定

- **`useToast`** —— `toast.add({ title, description, color, icon, duration, actions })`
- **`useOverlay`** —— 程序化开 modal/slideover/drawer，无需模板 `v-model`，可 `await instance.result`
- **`defineShortcuts`** —— `{ meta_k: () => open() }`，键 `meta`/`ctrl`/`alt`/`shift` 用 `_` 连
- **自动注册模块**：`@nuxt/icon`、`@nuxt/fonts`、`@nuxtjs/color-mode` 已自动注册，**别再加进 modules**；`@nuxt/content` 必须排在 `@nuxt/ui` **之后**
- **官方模板**：`npx nuxi init -t ui`（starter）、`ui/dashboard`、`ui/docs`、`ui/landing`、`ui/saas`、`ui/chat`、`ui/editor` 等

## 反模式（skill 主动纠正）

- 用 `text-gray-500` 等裸调色板色 → 应用语义色 `text-muted`
- 漏掉 `UApp` 包裹 → toast/tooltip/overlay 失效
- 瞎猜组件 slot 名 → 应读生成的 `.nuxt/ui/<component>.ts`
- 把组件 API 明细硬塞进 skill → 精确 props/slots 查 **MCP**，skill 只教用法
- 一次性加载全部 references → 违背渐进披露，浪费上下文；只拉任务需要的

## 下一步

- [参考](./reference) —— 能力清单表、安装/多 agent、references 结构、版本、许可、链接
- 上游：[Nuxt UI · AI Skills 文档](https://ui.nuxt.com/docs/getting-started/ai/skills) · [Nuxt UI MCP](https://ui.nuxt.com/docs/getting-started/ai/mcp)
