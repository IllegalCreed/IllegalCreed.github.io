---
layout: doc
---

# Ant Design

**蚂蚁集团出品、企业级 React UI 组件库的行业事实标准**——由 **蚂蚁金服（Ant Group）体验技术部** 主导维护、社区共建，是中国前端开源生态**最具影响力、最被全球开发者熟知**的设计语言 + 组件库项目。Ant Design 的故事始于 **2015 年 4 月**，由蚂蚁集团内部为统一中后台产品（**支付宝商家平台、网商银行、芝麻信用** 等）的设计语言和组件实现而开源，**至 2026 年已经走过整整 11 年**——是中国前端开源项目里**生命周期最长、迭代最稳定**的产品之一。**最新稳定版 v5.x**（截至 2026 年 5 月已发布 **v6.4.3**，但生产实践主流仍是 **v5.22+**——v5 是当前文档主线、v6 是 2025 年下半年发布的渐进升级），完全基于 **React 18+ + TypeScript 5+ + @ant-design/cssinjs**（**v5 重大架构变更**：从 Less + CSS 类名转向 **CSS-in-JS + Design Token**），**70+ 组件**覆盖 General / Layout / Navigation / Data Entry / Data Display / Feedback / Other 七大类别，**GitHub 98.1k Star / 750+ Release**——是 React 生态中**最完整、最稳定**的企业级 UI 库。**核心特性矩阵**：**Design Token 三层架构**（Seed Token → Map Token → Alias Token，全部通过 `<ConfigProvider theme>` 注入）/ **algorithm 算法系统**（`defaultAlgorithm` 浅色 / `darkAlgorithm` 暗色 / `compactAlgorithm` 紧凑，**算法可组合** `[darkAlgorithm, compactAlgorithm]`）/ **CSS-in-JS 运行时主题**（基于 `@ant-design/cssinjs`，**Token 改变自动重新生成 CSS**、零编译）/ **完整 TypeScript 类型**（每个组件 props / state / instance method 都有 TS 类型）/ **70+ 组件全场景覆盖**（企业表单 Form / 数据表格 Table / 反馈三件套 Message+Modal+Notification / 树形 / 级联 / 穿梭框 / 时间日期等）/ **完整 60+ 语言包**（`<ConfigProvider locale={zhCN}>`） / **`<App>` 组件 + Hook API**（`message.useMessage()` / `Modal.useModal()` / `notification.useNotification()`——**v5 推荐方式**，解决静态方法无法消费 Context 的问题） / **Pro Components 中后台二次封装**（`@ant-design/pro-components` 提供 ProForm / ProTable / ProLayout / ProList / ProCard） / **Next.js App Router 一行集成**（`@ant-design/nextjs-registry` 的 `<AntdRegistry>` 处理 SSR cssinjs） / **完美 SSR + Hydration**（`<StyleProvider>` + `extractStyle` 收集 critical CSS）/ **dayjs 集成**（v5 替换 v4 的 moment.js，按需 `import 'dayjs/locale/zh-cn'`）。**典型用户群**：**支付宝 / 钉钉 / 阿里云 / 蚂蚁集团**等阿里系产品 / 国内 80% 以上的 **React 中后台项目** / **`ant-design-pro` 中后台模板**（蚂蚁官方完整版 GitHub 36k+ Star）/ **全球外包公司、企业 SaaS / ERP / CRM** —— **如果一个 React 中后台前端从未用过 Ant Design，那他几乎不可能在国内入行**。**截至 2026 年的 v5.22+ → v6.4** 处于「**稳定演进期**」，新增 BorderBeam / Masonry / Splitter 等组件 + Zero Runtime 模式（v6.0+ 预编译 CSS、性能提升）—— 这是 React 后台项目最稳定可靠、生态最完整的选择。

## 评价

**优点**

- **行业事实标准、无人不知**：Ant Design 是国内 React UI 库领域**绝对统治地位**——招聘、培训、面试、培训机构教学、第三方组件库**全部围绕 Ant Design**。即便不熟悉 Ant Design API，**会用 React 的开发者用 1 天即可上手**
- **蚂蚁集团 + 社区双重背书**：由蚂蚁集团体验技术部主导维护（背靠阿里 / 蚂蚁/ 字节等大厂工程师团队）+ GitHub 98.1k Star + 750 Release —— **企业级支持 + 社区活跃度** 兼具，是国内开源项目里**最稳定可靠**的
- **70+ 组件覆盖完整业务场景**：General（Button / Icon / Typography）+ Layout（Grid / Flex / Splitter）+ Navigation（Menu / Breadcrumb / Tabs）+ Data Entry（Form / Input / Select / DatePicker / Upload / Transfer / TreeSelect / Cascader）+ Data Display（Table / Tree / List / Descriptions / Card / Statistic）+ Feedback（Message / Modal / Notification / Drawer / Alert / Spin）+ Other（Affix / ConfigProvider / App / Watermark） —— **企业级 CRUD / 后台 / 数据可视化场景全部开箱即用**
- **Design Token 三层架构（v5 革命）**：**Seed Token**（颜色 / 圆角 / 字号原子值） → **Map Token**（自动派生：颜色梯度 / 字号映射） → **Alias Token**（语义化别名：`colorBgContainer` / `colorBorder`）—— 主题定制**从手写 SCSS 变量上百个变成调整 Seed 几个值**，工程效率质变
- **algorithm 算法系统**：**`defaultAlgorithm`**（浅色） / **`darkAlgorithm`**（暗色） / **`compactAlgorithm`**（紧凑）—— 可以**组合**：`algorithm: [darkAlgorithm, compactAlgorithm]` 表达 **暗色 + 紧凑**，这是 Ant Design 主题系统的核心创新
- **CSS-in-JS 运行时主题**：基于 `@ant-design/cssinjs`，主题切换**无需重新编译 CSS**——切 token 立即生效（vs Element Plus CSS Variables 切换的批量重排成本更小）
- **完整 TypeScript 类型 + JSDoc 智能提示**：每个组件 props / events / 实例方法 / Form rules / Table columns / Theme tokens 都有完整 TS 类型 —— `<Form<MyData> onFinish={(values: MyData) => ...}>` 类型推导贯穿表单生命周期
- **`<App>` 组件 + Hook API（v5 推荐）**：`App.useApp()` 返回 `{ message, modal, notification }`——**解决静态方法 `message.success(...)` 无法消费 ConfigProvider 主题 / locale 的问题**，是 v5 的核心实践改进
- **Pro Components 中后台杀器**：[`@ant-design/pro-components`](https://procomponents.ant.design/) 提供 **ProForm**（声明式表单 + 校验 + 布局） / **ProTable**（带搜索 / 筛选 / 列设置的高级表格） / **ProLayout**（中后台布局 + 菜单 + 面包屑 + 用户中心） / **ProList**（高级列表） / **ProCard** —— **基础 antd 之上的中后台二次封装、ant-design-pro 模板基石**
- **Next.js App Router 一行集成**：`@ant-design/nextjs-registry` 的 `<AntdRegistry>` 包裹 `layout.tsx` —— **自动处理 SSR cssinjs 样式注入、零 hydration mismatch**
- **完美 SSR 方案**：`<StyleProvider>` + `extractStyle(cache)` 收集 critical CSS 注入 HTML head —— 比 Element Plus / Naive UI 的 SSR 方案更成熟
- **dayjs 集成（v5 替换 moment.js）**：dayjs 比 moment.js 体积小 **97%**（2KB vs 67KB），按需 `import 'dayjs/locale/zh-cn'` —— **v5 升级 v4 时最有感的迁移点**
- **完整 60+ 语言包**：`<ConfigProvider locale={zhCN}>` 一键切换 + dayjs locale 同步 —— **国际化项目的事实标准**
- **暗色模式一行启用**：`<ConfigProvider theme=` + 双花括号包 `algorithm: darkAlgorithm` —— **零额外 CSS、零编译**
- **`<ConfigProvider>` 全局组件级配置**：除了 theme / locale，还支持 **40+ 组件**的全局默认配置（`button: { type: 'primary' }` / `form: { validateMessages: ... }` / `table: { ... }`）—— 整个 App 的全局风格只在这一处声明
- **生态完整**：`@ant-design/icons`（~700 图标）/ `@ant-design/charts`（数据可视化）/ `@ant-design/pro-components` / `@ant-design/web3` / `antd-mobile`（移动端）—— **从中后台 → 数据可视化 → 移动端 → Web3 全栈覆盖**
- **完整中英文文档 + Demo 可改可跑**：[ant.design/components/overview-cn](https://ant.design/components/overview-cn/)——示例完整、API 表格清晰、CodeSandbox 在线编辑，国内开发者无英文壁垒
- **持续迭代**：v5.22+ → v6.4（2025-2026 年），新增 Splitter / Masonry / BorderBeam + Zero Runtime（v6.0+ 预编译 CSS、性能提升）—— 进入 v6 时代仍保持 minor 版本破坏性变更克制、迁移成本低

**缺点**

- **Bundle 体积大**：即使 Tree Shaking，引入 Form / Table / DatePicker 等重组件后 bundle 容易达 **800KB+**（vs Naive UI ~250KB / Mantine ~400KB）—— C 端 / 移动端 H5 慎用
- **v4 → v5 迁移有破坏性变更**：CSS-in-JS 替换 Less / `moment.js` 替换为 `dayjs` / 部分组件 API 调整 / `static methods` 不消费 Context 问题 —— **存量 v4 项目升级 v5 成本不低**（蚂蚁内部部分项目至今仍在 v4）
- **静态方法 `message.success(...)` 不消费 Context**：`message.success('...')` 不能访问 `<ConfigProvider theme>` 的主题 —— **必须用 `App.useApp()` 或 `message.useMessage()` 的 contextHolder 模式**，新人最高频踩坑
- **CSS-in-JS 运行时性能**：每个组件首次渲染时 cssinjs 计算 + 注入 style 标签的开销 —— **极致首屏优化场景需要权衡**（v6.0+ Zero Runtime 模式试图解决）
- **设计风格偏「企业管理后台」**：默认是「蚂蚁蓝 `#1677ff`」+ 严肃克制 —— **不适合面向 C 端的现代营销页 / 设计驱动产品**（这类场景应选 Mantine / shadcn/ui / 纯 Tailwind）
- **vs Material UI (MUI)**：MUI 严格遵循 Material Design、海外项目主流；Ant Design **国内市场份额断层第一、企业级中后台更优**；MUI 偏「设计系统通用」、Ant Design 偏「企业 CRUD 业务场景」
- **vs Mantine**：Mantine **设计现代、TypeScript-first、120+ 组件覆盖更广** + 内置 Hooks 库（useHotkeys / useClipboard 等 50+）+ Tabler 图标 —— **新项目选 Mantine 设计更现代、 Ant Design 更稳定保守**
- **vs Chakra UI**：Chakra **可访问性 (a11y) 优秀** + 灵活的 style prop API；Ant Design **企业 CRUD 组件更完整**——选 Ant Design 如果是中后台、选 Chakra 如果做 SaaS / 营销
- **vs shadcn/ui**：shadcn/ui **拷贝代码到项目** 而非安装包（更易定制）+ Tailwind + Radix UI 底层；Ant Design **传统组件库模式** + 主题对象 API —— shadcn 给最大设计自由度、Ant Design 给开箱即用 70+ 组件
- **vs Naive UI**：Naive UI 是 Vue 3 阵营、设计现代 TS-first；Ant Design 是 React 阵营、企业级稳定 —— **跨阵营对比、是各自生态的「企业级 UI 主力」**
- **`<Select.Option>` 在 Next.js App Router 不支持**：v5 的 `Select.Option` / `Typography.Text` 等子组件**不能在 RSC 中使用**，需直接 import `{ Option } from 'antd/es/select'` —— Next.js App Router 集成的官方限制
- **图标必须独立安装 `@ant-design/icons`**：~700 图标但不内置 —— `pnpm add @ant-design/icons` 后 `<EditOutlined />` 直接用、按需 import Tree Shaking 友好
- **Pro Components 学习曲线**：`@ant-design/pro-components` 在 antd 之上又封了一层（ProForm 自带 layout + 校验 + 提交、ProTable 自带搜索栏 + 列设置 + 工具栏）—— 用熟之后效率倍增，但**初学者从 antd 跳到 ProComponents 有适应期**

## 文档地址

[Ant Design 官网](https://ant.design/) | [中文文档](https://ant.design/index-cn) | [开始使用](https://ant.design/docs/react/getting-started-cn) | [Vite 集成](https://ant.design/docs/react/use-with-vite-cn) | [Next.js 集成](https://ant.design/docs/react/use-with-next-cn) | [定制主题](https://ant.design/docs/react/customize-theme-cn) | [Design Token](https://ant.design/docs/react/customize-theme-cn#design-token) | [国际化](https://ant.design/docs/react/i18n-cn) | [服务端渲染](https://ant.design/docs/react/server-side-rendering-cn) | [组件总览](https://ant.design/components/overview-cn/) | [设计价值观](https://ant.design/docs/spec/values-cn) | [Pro Components](https://procomponents.ant.design/) | [Ant Design Charts](https://charts.ant.design/) | [Ant Design Pro](https://pro.ant.design/)

## GitHub 地址

[ant-design/ant-design](https://github.com/ant-design/ant-design)（主仓库，98.1k Star） | [ant-design/ant-design-icons](https://github.com/ant-design/ant-design-icons)（图标库 ~700 图标） | [ant-design/pro-components](https://github.com/ant-design/pro-components)（中后台二次封装） | [ant-design/ant-design-pro](https://github.com/ant-design/ant-design-pro)（中后台模板 36k Star） | [ant-design/ant-design-charts](https://github.com/ant-design/ant-design-charts)（数据可视化） | [ant-design/nextjs-registry](https://github.com/ant-design/nextjs-registry)（Next.js App Router 集成） | [ant-design/cssinjs](https://github.com/ant-design/cssinjs)（v5 CSS-in-JS 底层） | [ant-design/antd-mobile](https://github.com/ant-design/antd-mobile)（移动端） | [ant-design/ant-design-web3](https://github.com/ant-design/ant-design-web3)（Web3 组件）

## 学习路径

- [入门](./getting-started.md)：`pnpm add antd` + `@ant-design/icons` 安装 / 第一个 `<Button>` / `<ConfigProvider locale={zhCN}>` 包根 + 中文 i18n / v5 默认 Tree Shaking（无需配 babel-plugin-import） / `<App>` 组件 + Hook API（替代静态 message）/ Vite / Next.js App Router / CRA / Rsbuild 集成 / TypeScript 基础（`FormInstance` / `TableColumnsType`）/ dayjs 集成（v4 → v5 迁移点）/ 暗色模式（`darkAlgorithm` 一行启用）/ 基础主题定制（`<ConfigProvider theme>`）/ 与 React Router + Zustand / Redux 集成
- [指南](./guide-line.md)：**核心**：70+ 组件按类别速览（General / Layout / Navigation / Data Entry / Data Display / Feedback / Other）/ **`<Form>` 深度**（Form.useForm + name 路径 + rules + initialValues + onFinish + 嵌套对象 + Form.List 动态字段 + 异步校验 + dependencies + Form.useWatch + Form 实例方法） / **`<Table>` 深度**（columns 配置 + dataIndex/render + sorter 排序 + filters 筛选 + rowSelection 多选 + expandable 展开 + tree 树形 + fixed 固定列 + scroll + virtual 虚拟滚动 v5.9+ + pagination） / **反馈三件套**（message / Modal / notification 完整 API + useMessage / useModal / useNotification Hook + `<App>` 组件统一） / **`<ConfigProvider>` 全局配置**（theme / locale / componentSize / componentDisabled + 40+ 组件级 defaults） / **Design Token 三层架构深度**（Seed → Map → Alias） / **algorithm**（defaultAlgorithm / darkAlgorithm / compactAlgorithm 可组合） / **嵌套 ConfigProvider 多主题** / **`@ant-design/pro-components`**（ProForm / ProTable / ProLayout）/ **Next.js App Router 集成**（`<AntdRegistry>` + cssinjs SSR）/ **Vite 集成**（CRA-like 零配置 + 主题定制）/ **`<App>` 组件 + useApp Hook 模式** / **dayjs locale 集成** / **TypeScript 类型推导**（FormInstance / TableColumnsType / GetProp / GetRef）/ **与 React Router + Zustand / Redux 集成** / **常见踩坑**（静态 message 不消费 Context / dayjs 多版本 / Tailwind CSS 优先级冲突 / Next.js Select.Option 不支持）
- [参考](./reference.md)：**API 速查**：70+ 组件分类列表 / 常用组件 props 速查（Button / Input / Form / Form.Item / Table / Modal / Drawer / Menu / Pagination / Tabs / Select / DatePicker）/ **`<ConfigProvider>` 完整选项** / 命令式 API（message / Modal / notification）签名 + Hook 版本 / **`App.useApp()`** / **Design Token 完整列表**（Seed / Map / Alias）/ **algorithm** / **TypeScript 类型**（FormInstance / FormProps / TableColumnsType / TableProps / GetProp / GetRef / ThemeConfig）/ **60+ 语言包列表** / **`@ant-design/icons` 图标包对照** / **`@ant-design/pro-components` API 索引**
