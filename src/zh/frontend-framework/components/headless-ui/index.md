---
layout: doc
outline: [2, 3]
---

# Headless UI

**Tailwind Labs 官方出品的「Headless / Unstyled」组件库 + Tailwind CSS 黄金搭档、Catalyst 设计系统的底层引擎**——由 [Tailwind Labs](https://tailwindcss.com/)（Tailwind CSS 母公司、Adam Wathan + Steve Schoger 团队）开发并长期维护，**最早 2020 年 4 月发布 v0.1**，**2021 年 9 月发布 v1.0**，**2024 年 5 月正式发布 v2.0**（重大重写）—— Headless UI 把自己定位为「**给 Tailwind 用户的完美 a11y 组件层**」：**不提供任何样式 + 不提供任何主题 + 不强制布局 + 只提供行为 + 键盘 + 焦点 + a11y**。**截至 2026 年 5 月稳定版 v2.2.x**（**仅 React 版**；**Vue 版仍停留在 v1.7**——这是 Headless UI 当前最大的「**生态不对称**」事实）。**GitHub 27k+ Star、月下载量 1.6 亿+**。

**与 Radix UI / Ark UI 的根本区别**：

1. **作者背景**：Headless UI **由 Tailwind 团队亲自维护**——所有 API / 类名 / data-* 属性都**为 Tailwind 量身定制**（`data-[hover]:bg-blue-500` / `data-[checked]:ring-2` 等是它的母语）。Radix 由 [WorkOS](https://workos.com) 维护、Ark UI 由 Chakra 团队（Adobe React Aria 系）维护
2. **组件数量**：Headless UI **仅 16 个组件**（v2.x 全清单：Menu / Listbox / Combobox / Dialog / Disclosure / Popover / Tabs / Transition / Switch / RadioGroup / Checkbox / Input / Select / Textarea / Fieldset / Button）。**vs Radix Primitives 30+**——Headless UI **聚焦最常用场景、不追求大而全**
3. **框架支持**：Headless UI **只支持 React + Vue**（**没有 Svelte / Solid / Angular**）。Radix **只 React**、Ark UI 支持 **React + Vue + Solid**。**但 Vue 版仅 v1.7、未跟进 v2**——**Vue 用户实际能享受到的 Headless UI 体验显著弱于 React 用户**
4. **设计哲学**：Headless UI **「Tailwind 一等公民、其他次之」**。Radix **「任何 CSS 方案皆可」**。Ark UI **「框架无关、状态机驱动」**——三者各有取舍
5. **`<Field>` 表单封装**：v2.0 引入的 **Field / Fieldset / Label / Description / Input / Select / Textarea / Legend** 这套表单 Primitive **自动注入 ARIA**（`aria-labelledby` / `aria-describedby` / `id` 全部自动生成）——**Radix Form 也做了类似事情、但 Headless UI 的 API 更轻量**

**Headless UI v2 核心特性**：**Built-in Anchor Positioning**（**v2 杀手锏**：基于 [Floating UI](https://floating-ui.com) 直接内置到 Menu / Popover / Combobox / Listbox 的 `anchor` prop，**自动 collision detection + 自动 portal + CSS 变量配置**——**无需自己安装 Floating UI、无需 ref、无需 manual position**） / **data-* 属性 + Tailwind 完美集成**（`data-[hover]:bg-blue-500` / `data-[focus]:ring-2` / `data-[checked]:bg-indigo-600` / `data-[open]:rotate-180`——**所有状态都通过 `data-*` 暴露、Tailwind variant 直接命中**） / **基于 [React Aria](https://react-spectrum.adobe.com/react-aria/) 的智能状态检测**（`data-active` 拖出 trigger 区域自动消失 / `data-hover` 触摸设备自动忽略 / `data-focus` 等价 `:focus-visible` 无误触发）/ **新增 8 个 HTML 表单组件**（v2 引入：**Checkbox / Input / Select / Textarea / Fieldset / Legend / Field / Label / Description** —— 自动 wiring `aria-labelledby` / `aria-describedby` / `id`）/ **Combobox 虚拟滚动**（基于 [TanStack Virtual](https://tanstack.com/virtual) —— <span v-pre>**`virtual={{ options: filteredPeople }}` 一行启用、轻松 10000+ 选项**</span>）/ **Render Props + data-* 双模式**（既支持 v1 风格的 `{({ open }) => ...}` 渲染函数、也支持 v2 风格的 `className="data-[open]:bg-red-500"`） / **`as` Prop 自由切换 DOM 元素**（`as={Fragment}` / `as="a"` / `as={MyButton}`） / **Portal 默认 + 自动 modal 焦点陷阱** / **Transition 内置**（**`transition` prop + `data-closed` / `data-enter` / `data-leave` —— 不需要 Framer Motion 即可写完整动画**） / **TypeScript-first** / **SSR 完美**

**典型用户群**：**全球 React 开发者 + Tailwind 重度用户 + Next.js / Remix / Vite SSR 项目 + 个人开发者 + 海外 SaaS 团队**。**Headless UI** 是 Tailwind 用户的「**默认 a11y 组件层**」——**几乎所有用 Tailwind 写自定义组件的开发者都用过 Headless UI**。**Tailwind UI**（付费 UI 库）和 **Catalyst**（Tailwind 官方设计系统）也都基于 Headless UI 构建。

> Headless UI 是 React UI 库**生态位最专注**的一员——它**不与 Radix / Ark / shadcn 抢「最大覆盖率」**，它**只做「Tailwind 用户最舒服的 a11y 组件」**。如果你**主要在用 Tailwind + 不需要 Radix 的 30+ 复杂组件 + 想要最轻量的 headless 方案**，那 **Headless UI** 就是 React / Vue 生态最自然的选择。**截至 2026 年的 Headless UI** 处于「**React v2 持续演进 + Vue v1 维护中 + Tailwind UI / Catalyst 加持**」三位一体期——是 Tailwind 生态**事实必备**的 a11y 基建库。

## 评价

**优点**

- **Tailwind 官方出品、API 为 Tailwind 量身定制**：Headless UI 的**所有状态属性都用 `data-*`**（`data-open` / `data-closed` / `data-focus` / `data-hover` / `data-active` / `data-checked` / `data-disabled` / `data-selected`）—— **配合 Tailwind 的 `data-[hover]:` / `data-[open]:` variant 极致丝滑**。**vs Radix data-state="open"**——Headless UI 的命名更扁平、Tailwind variant 写起来更短
- **v2.0 内置 Anchor Positioning 是革命性升级**：基于 [Floating UI](https://floating-ui.com) 直接集成到 Menu / Popover / Combobox / Listbox 的 `anchor` prop。**`anchor="bottom start"` + `[--anchor-gap:8px]`** 一行搞定完整 collision detection + 自动 portal。**vs Radix `sideOffset` + 手动 Portal**——Headless UI 的 API 更高级（**直接读 CSS 变量配置**而不是 props）
- **`<Field>` 表单 Primitive 自动注入 ARIA**：v2.0 新增的 **Field / Fieldset / Legend / Label / Description / Input / Select / Textarea** —— **自动生成 `id` / `aria-labelledby` / `aria-describedby` / 自动级联 disabled**。**vs Radix Form 仍需手动写 `Form.Field name=...`**——Headless UI 的表单 API 是这几个 headless 库里**最优雅的**
- **Combobox 虚拟滚动开箱即用**：基于 [TanStack Virtual](https://tanstack.com/virtual)。<span v-pre>**`virtual={{ options: filteredPeople }}` + ComboboxOptions render prop**</span>——**10000+ 选项无性能损失**。**vs Radix Select / Combobox 没有官方虚拟滚动方案**——Headless UI 在「大数据 dropdown」场景**优势明显**
- **基于 React Aria 的智能状态检测**：v2 之后使用 React Aria 库的状态检测引擎 —— **`data-active` 在拖出按钮区域自动消失、`data-hover` 触摸设备自动忽略、`data-focus` 等价 `:focus-visible` 无误触发**。**vs Radix / Ark 的状态检测**——Headless UI 的「移动端 + 桌面端混合输入」体验**最细腻**
- **Transition 内置 + `data-closed`/`data-enter`/`data-leave`**：v2 之后所有组件支持 **`transition` prop**——**不需要 Framer Motion / Motion / Auto Animate** 即可写完整 enter / leave 动画。**`data-closed:opacity-0` + `data-enter:opacity-100` Tailwind 一句话搞定**
- **新组件 Checkbox / Input / Select / Textarea**：v2 之前必须自己写原生 input 或装第三方库 —— v2 之后**Headless UI 自带这套**。**`<Checkbox indeterminate>` / `<Input invalid>`** 都内置了 a11y 行为
- **`as` Prop 自由组合**：所有组件支持 `as={Fragment}` / `as="a"` / `as={Link}` —— **与 Next.js Link / React Router Link 完美组合**。**vs Radix asChild**——`as` 语义更直观、不需要要求子元素 forwardRef
- **Render Props 仍可用（向后兼容）**：v2 保留 v1 风格的 `{({ open, close }) => ...}` render prop —— **老项目升级 v2 零成本**
- **Portal 默认 + 自动 modal 焦点陷阱**：Dialog / Combobox / Listbox / Menu / Popover 等 overlay 类**默认 Portal 到 body**——**z-index 不冲突 + overflow:hidden 不裁剪**。Dialog 自动焦点陷阱、自动 body 滚动锁
- **Tailwind 友好的 className 注入**：所有组件接受 `className: string | ((state) => string)`——**支持函数形式根据状态切换 className**：

  ```tsx
  <MenuItem
    className={({ focus }) => (focus ? "bg-blue-100" : "")}
  >...</MenuItem>
  ```

- **Catalyst / Tailwind UI 加持**：[Catalyst](https://catalyst.tailwindui.com/) 是 Tailwind 官方付费设计系统、**底层完全基于 Headless UI** —— **学会 Headless UI = 半个 Catalyst 已经会了**。**Tailwind UI** 的免费组件示例也都用 Headless UI
- **SSR 完美**：Next.js App Router / Remix / TanStack Router / Vite SSR 全部一键集成 —— **无 hydration warning**
- **TypeScript-first**：所有组件、props、状态类型完整 —— **IDE 智能提示完美**
- **官方文档质量极高 + 实时 Playground**：[headlessui.com](https://headlessui.com) —— 每个组件「Installation」「Basic example」「Styling」「Examples」「Component API」结构清晰、内嵌交互演示
- **Tailwind Labs 商业化背书**：Tailwind 自身是估值 $50亿+ 的开源公司，**Headless UI 由专门团队维护** —— **bus factor 极稳**
- **包尺寸极小**：v2.0 实际打包 ~30KB（vs Radix 单 Primitive ~5-15KB × 多个）—— **整体打包小于 Radix**

**缺点**

- **Vue 版严重落后**：截至 2026 年 5 月，**`@headlessui/vue` 仍是 v1.7**（最后一次更新 ~2024 年）——**没有 v2 的 anchor positioning / 没有 Checkbox / 没有 Input / 没有虚拟滚动 / 没有 Field 表单组件**。**Vue 用户能享受到的 Headless UI = React 用户体验的 ~50%**。**Tailwind Labs 公开表态过 Vue 版会更新但优先级低于 React**。**这是 Headless UI 当前最大缺陷**
- **组件数量少（16 个 vs Radix 30+）**：**没有 Toast / Tooltip / Hover Card / Alert Dialog / Context Menu / Menubar / Navigation Menu / Accordion / Collapsible / Slider / Progress / Avatar / Aspect Ratio / Scroll Area / Separator** 等。**Tooltip 是最常用组件之一、Headless UI 没有官方实现**（社区需自己写 Popover + hover 逻辑、或装 [Radix Tooltip](https://www.radix-ui.com/primitives/docs/components/tooltip) / [Floating UI](https://floating-ui.com)）
- **没有 Toast 是硬伤**：通知 / 错误提示 / 操作反馈是几乎所有应用必需 —— **Headless UI 缺这个一直被诟病**。**vs Radix Toast / Sonner / react-hot-toast** —— 必须搭配第三方
- **没有 Tooltip 是硬伤**：同上，**Headless UI 没有 Tooltip 是其和 Radix 最大功能差距**。社区方案：`@radix-ui/react-tooltip`（最常见）/ [TanStack Tooltip](https://tanstack.com/tooltip)
- **没有 Accordion / Collapsible**：v2 之后**仍只有 Disclosure**（单项展开），**没有手风琴**（多项联动）—— 需要自己用 Disclosure 组装
- **没有 Slider / Progress**：表单组件**只有 Switch / RadioGroup / Checkbox**——**没有 Slider**（数值滑块）/ **没有 Progress**（进度条）
- **没有 Context Menu**：右键菜单**需要自己用 Menu + onContextMenu 组装**
- **vs Radix UI**：Radix **30+ Primitives + a11y 更彻底 + Compound Component 模式更完整**；Headless UI **更轻量、Tailwind 集成更紧密、anchor positioning 内置** —— **复杂场景选 Radix、Tailwind 简单场景选 Headless UI**
- **vs Ark UI**：[Ark UI](https://ark-ui.com)（Chakra 团队的 headless 库）—— **基于 Zag 状态机 / 支持 React + Vue + Solid 三框架 / 组件数量更多**；Headless UI **更轻量、Tailwind 集成更紧密**
- **vs shadcn/ui**：shadcn/ui 是 **Radix + Tailwind + 拷贝代码** 组合 —— shadcn 直接提供完整带样式的组件、Headless UI 仍需自己写所有样式。**99% 场景下用 shadcn 更快**、**特别简单的 Tailwind 项目用 Headless UI**
- **`as` Prop 与 TypeScript 类型推导**：复杂 `as` 用法（如 `as={MyForwardedComponent}`）有时候 TS 类型推导**比较繁琐**——比 Radix `asChild` 类型更复杂
- **Anchor Positioning 与 `position: fixed` 父容器冲突**：少数情况下 anchor 子元素**渲染到 portal 外**（特别是 `static` prop + 自定义 wrapper 时）—— 需要手动调
- **没有官方 DataTable / Tree / 富文本**：企业级 CRUD 场景**完全空白**——**vs MUI / Ant Design 大量业务组件**——Headless UI 定位本来就不是「业务组件库」
- **Discord 社区较弱**：Tailwind Discord 是综合主题、**Headless UI 没有独立社区** —— vs Radix Discord 活跃度更高
- **v1 → v2 是 breaking**：v2 API 大重写——v1 项目迁移成本不小（详见指南章节）。Vue 用户因为没有 v2 暂时不需要担心

## 文档地址

[Headless UI 官网](https://headlessui.com) | [React v2 文档](https://headlessui.com/react/menu) | [Vue v1 文档](https://headlessui.com/v1/vue/menu) | [v2 发布博客（2024.5）](https://tailwindcss.com/blog/headless-ui-v2) | [Catalyst（Tailwind 官方设计系统）](https://catalyst.tailwindui.com/) | [Tailwind UI](https://tailwindui.com)

## GitHub 地址

[tailwindlabs/headlessui](https://github.com/tailwindlabs/headlessui)（主仓库，27k+ Star） | [Releases / Changelog](https://github.com/tailwindlabs/headlessui/releases) | [Issues](https://github.com/tailwindlabs/headlessui/issues)

## 学习路径

- [入门](./getting-started.md)：Headless UI 概念（**Unstyled / `data-*` API / Anchor Positioning / Field 表单**）/ React v2 vs Vue v1 选择 / `pnpm add @headlessui/react` 或 `@headlessui/vue` / 第一个 Menu（含 anchor positioning） / 第一个 Dialog（含 transition + Backdrop） / 第一个 Combobox（含搜索 + 虚拟滚动） / 第一个 Switch + Checkbox / 配合 Tailwind 写 data-* 状态样式 / Transition API（`transition` prop + `data-closed`）/ Next.js App Router 集成 / Vite 集成 / Vue 3 集成（基于 v1）
- [指南](./guide-line.md)：**核心**：16 个组件**深度梳理**（**Overlay**：Dialog / Popover / Disclosure；**Menu**：Menu / Combobox / Listbox / Select；**Forms**：Checkbox / RadioGroup / Switch / Input / Textarea / Select / Fieldset / Field / Label / Description；**Navigation**：Tabs；**Animation**：Transition）/ **Anchor Positioning 深度**（`anchor="bottom start"` / `--anchor-gap` / `--anchor-offset` / `--anchor-padding` / `--button-width` 全部 CSS 变量）/ **data-* 属性 + Tailwind variant**（`data-[hover]:` / `data-[focus]:` / `data-[active]:` / `data-[checked]:` / `data-[open]:` / `data-[closed]:` / `data-[selected]:` / `data-[disabled]:`）/ **Render Props vs data-* 双模式**（何时用 render prop / 何时用 data-* className） / **Controlled vs Uncontrolled** / **Combobox 虚拟滚动**（`virtual.options` + render prop）/ **Field 表单 ARIA 自动注入** / **Portal 与 SSR**（`portal` prop / Next.js App Router 客户端组件）/ **Transition 组件 + `transition` prop**（`appear` / `show` / `data-closed`） / **`as` Prop**（Fragment / 字符串 / React 组件）/ **与 Tailwind UI / Catalyst 协作** / **v1 → v2 迁移指南**（renderProp 改名 / data-* 替代 active / Anchor positioning 替代 Floating UI 手动集成）/ **Vue v1 vs React v2 差异**（**Vue 没有 anchor / Checkbox / Input / 虚拟滚动**）/ **常见踩坑**（SSR portal / `as={Fragment}` Children.only / 自定义子组件 forwardRef / Transition 不工作）
- [参考](./reference.md)：**API 速查**：16 个组件完整清单 / 每个组件的 props 速查（Menu / Dialog / Combobox / Listbox / Popover / Disclosure / Tabs / Switch / RadioGroup / Checkbox / Transition / Field / Fieldset / Input / Select / Textarea） / **Anchor 配置完整表**（`anchor.to` / `anchor.gap` / `anchor.offset` / `anchor.padding` / CSS 变量列表）/ **data-* 属性完整表**（每个组件支持的 `data-*`） / **Render Props 完整表**（每个组件 render prop 暴露的状态） / **键盘快捷键全表** / **TypeScript 类型** / **Vue v1 API 速查**（差异于 React v2 的部分）
