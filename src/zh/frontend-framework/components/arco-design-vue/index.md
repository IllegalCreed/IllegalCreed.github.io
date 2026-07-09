---
layout: doc
---

# Arco Design Vue

**字节跳动出品的企业级 Vue 3 UI 组件库**——由 **字节跳动（ByteDance）GIP（增长智能业务线）+ ECom（电商业务线）+ Lark（飞书）** 等业务线前端团队**联合打造**，**2021 年 5 月** 在 [GitHub](https://github.com/arco-design/arco-design-vue) 开源，是字节内部 **Arco Design 设计系统** 的官方 Vue 3 实现。Arco Design Vue 与 **Arco Design React**（[arco-design/arco-design](https://github.com/arco-design/arco-design)）共享**同一套设计语言、token 体系、视觉规范**，让前端团队**跨 Vue / React 技术栈无缝复用设计 + 设计师 + 产品方案**——这是国内 UI 库中**唯一同时拥有 React + Vue 双官方实现**的设计系统（vs Element Plus 仅 Vue / Ant Design 仅 React）。**最新稳定版 v2.58.x**（2026 年 4 月发布），**60+ 组件** 覆盖 General / Layout / Navigation / Data Entry / Data Display / Feedback / Other 全类目，**100% TypeScript 编写**（源码 66.1% TS + 18.4% Vue + 14.0% Less），**Less + CSS Variables 双轨主题系统**（Less 变量编译期定制 / CSS Variables 运行期切换，**主题深度 + 灵活度同时拿到**），**内置 Design Lab 在线主题平台**（[arco.design/themes](https://arco.design/themes)，**WYSIWYG 拖拽生成主题包**——这是国内 Vue UI 库**独家**的设计师友好工具）。**核心特性矩阵**：**`<a-config-provider>` 全局配置**（locale / size / theme prefix-cls 一处注入，类似 React Context） / **`Modal.confirm` / `Message.success` / `Notification.info` 全局静态 API**（无需 Provider 嵌套，类似 Element Plus 风格）/ **`a-form` + async-validator 校验**（13+ 校验类型：`email` / `url` / `ip` / `match` / `validator` Promise 风格） / **`a-table` 强大且现代**（虚拟列表 `virtual-list-props` / 树形数据 / 列拖拽 / 行/列固定 / 行选择 / 展开行 / 服务端排序筛选） / **`a-icon` + `@arco-design/web-vue/es/icon` 内置 700+ 图标包**（**字节自研 Arco Icons**，无需额外装 `@vicons/*`）/ **`arco-theme="dark"` body 属性切换暗色** / **13+ 语言包 zh-CN / en-US / ja-JP / ko-KR / es-ES / fr-FR / de-DE / it-IT / id-ID / pt-PT / th-TH / vi-VN / nl-NL** / **`unplugin-vue-components` + `ArcoResolver` 按需引入** / **完整 Vue 3 + TypeScript 类型** / **Nuxt 3 兼容**（v2.44.3+ 添加 `exports` 配置）/ **配套 [arco-design-pro-vue](https://github.com/arco-design/arco-design-pro-vue)（GitHub 1.8k Star，中后台模板，TypeScript + Vue3 + Pinia + Vite + 内置主题）**。**典型用户群**：**字节跳动内部产品**（飞书 / 抖音电商 / 番茄小说后台 / TikTok 商家后台） / **国内中大型互联网公司中后台**（采用「**字节同款**」的团队）/ **追求 React + Vue 跨栈复用设计的双栈团队** / **需要 Design Lab 设计师协作流的产品** / **希望兼具 Element Plus 易用性（全局静态 API）+ Ant Design Vue 企业气（设计成熟度）的项目**。**截至 2026 年的 v2.58.x** 处于「**稳定迭代期**」——字节内部 daily updates、社区 PR 持续合并，**国内 Vue UI 库市场份额第三**（Element Plus > Ant Design Vue ≈ Arco Design Vue > Naive UI > Vuetify）——是「**有大厂背书 + 国内企业级 + Pro 模板完整**」的 Vue 3 UI 库选择。

## 评价

**优点**

- **字节跳动官方背书**：与 Element Plus（饿了么）/ Ant Design Vue（Ant Design 社区维护）相比，Arco Design Vue 是**字节跳动内部 GIP / ECom / Lark 前端团队联合维护**——大厂背书 + 内部生产环境验证（飞书 / 抖音电商等都在用）= **企业级稳定性最有保障**
- **Arco Design 设计系统统一**：与 React 版（[arco-design/arco-design](https://github.com/arco-design/arco-design)）**共享同一套设计 token / 视觉规范 / 组件交互**——**唯一同时拥有 React + Vue 双官方实现**的国内设计系统（vs Element Plus 仅 Vue / Ant Design 仅 React），**跨技术栈团队设计协作零摩擦**
- **Design Lab 在线主题平台**：[arco.design/themes](https://arco.design/themes) 提供**WYSIWYG 拖拽生成主题**——设计师在线调色、实时预览、一键导出主题包（npm package）—— **国内 Vue UI 库独家**的设计师友好工具（Element Plus 仅靠 SCSS 变量、Naive UI 靠 TS 对象，都没有 GUI）
- **60+ 组件 + 全场景覆盖**：General（Button / Icon / Typography）+ Layout（Grid / Layout / Space）+ Navigation（Menu / Breadcrumb / Tabs / Pagination）+ Data Entry（Form / Input / Select / DatePicker / Upload / Transfer）+ Data Display（Table / Tree / Card / List / Statistic）+ Feedback（Modal / Drawer / Message / Notification / Alert）—— **企业中后台 CRUD 场景 95%+ 开箱即用**
- **`<a-config-provider>` 中央配置**：locale / size / prefix-cls / global 一处注入——类似 React Context，**整个 App 全局风格集中管理**
- **`Modal.confirm` / `Message.success` 全局静态 API**：与 Element Plus `ElMessage` / `ElMessageBox` 一致——**无需 Provider 嵌套**（vs Naive UI 必须包 `<n-message-provider>`）—— **新人迁移自 Element Plus 学习曲线极低**
- **100% TypeScript 编写**：源码 66.1% TS + 18.4% Vue + 14.0% Less——**所有组件、API、locale、theme 都有完整 .d.ts**，无需 `@types/arco-design-vue`
- **a-form 校验丰富**：内置 13+ 校验类型（`string` / `number` / `boolean` / `array` / `object` / `email` / `url` / `ip` + `length` / `minLength` / `maxLength` / `min` / `max` / `match` / `validator` Promise 风格）—— **比 Element Plus / Naive UI 内置类型多**（无需额外组合）
- **a-table 强大且现代**：虚拟列表（`virtual-list-props={height:400}`）/ 树形数据（`children-key`）/ 列拖拽（`drag-able`）/ 行/列固定 / 行选择 / 展开行 / 服务端排序筛选 / 单元格合并 / 列分组——**单组件覆盖 ElTable + ElTableV2 + Naive DataTable 三者能力**
- **Less + CSS Variables 双轨主题**：**Less 变量** 编译期深度定制（修改 `@arcoblue-6` 等核心变量、整站换色） + **CSS Variables** 运行期切换（`--color-primary-6` 主题色实时变更）——**两套方案灵活组合**，比 Element Plus 单 CSS Vars / Naive UI 单 TS 对象更**全栈**
- **arco-theme="dark" 一行暗色**：`document.body.setAttribute('arco-theme', 'dark')` —— **比 Naive UI 切换 darkTheme 还简单**（不需要 import 主题对象），与 Element Plus 接近但更直接
- **13+ 语言包**：zh-CN / en-US / ja-JP / ko-KR / es-ES / fr-FR / de-DE / it-IT / id-ID / pt-PT / th-TH / vi-VN / nl-NL—— 字节出海项目（TikTok Shop 等）的实战沉淀，**多语言覆盖比 Element Plus 内置更广泛**
- **700+ 自研 Arco Icons**：`@arco-design/web-vue/es/icon` 内置 700+ 设计系统配套图标——**无需额外装 `@vicons/*` 或 `@element-plus/icons-vue`**，体系一致
- **Nuxt 3 兼容**：v2.44.3+ 添加 `exports` 配置，**Nuxt 3 + Arco Design Vue 即装即用**（vs 早期版本曾有 SSR 兼容问题）
- **arco-design-pro-vue 中后台模板**：[arco-design/arco-design-pro-vue](https://github.com/arco-design/arco-design-pro-vue)（1.8k Star，TypeScript + Vue3 + Pinia + Vite + Mock + 多主题 + 多语言）—— **官方维护的企业级 Pro 模板，开箱即用**（vs `naive-ui-admin` 是社区维护）
- **完整中英文文档 + 在线预览**：[arco.design/vue](https://arco.design/vue) 中英双语 + 在线 Demo 可改可跑、API 表格清晰——**质量与 Element Plus 持平**
- **持续活跃迭代**：截至 2026 年 v2.58.x（4 月发布）、字节内部 daily updates、GitHub Issue 响应快——**保养良好的大厂开源项目**

**缺点**

- **国内市场份额第三**：**Element Plus 70%+ / Ant Design Vue 15%+ / Arco Design Vue 8%+ / Naive UI 5%+**（粗略估算）——**招聘市场 / 培训 / 面试题 / 中文社区教程数量都远少于 Element Plus**，新人接受度仍在爬坡
- **vs Element Plus 易用性平手但生态弱**：API 风格（全局 `Modal.confirm` / `Message.success`）与 Element Plus 接近、学习曲线低——但 **`element-plus-admin` / `vue-element-admin` 等周边生态 / 知乎 / 掘金 / B 站教程数量碾压 Arco**
- **设计语言企业气重**：Arco Design 是字节内部**企业级**设计语言（飞书 / 字节后台风），**偏严肃 + 信息密度高**——**不适合 C 端产品 / 设计驱动的轻量场景**（这种用 Naive UI 更现代）
- **Less 依赖**：主题深度定制需要 Less + `less-loader`（虽然 CSS Variables 可以覆盖一部分）—— **比 Naive UI 纯 TS 对象 / Element Plus CSS Vars 多一层 Less 编译**
- **icon 包路径变化**：v2.44.3 之前 icon 从 `@arco-design/web-vue/es/icon` 引入、之后兼容 Nuxt 3 调整 exports——**老教程的 icon 路径可能不准、需要核对版本**
- **中文社区资源少**：StackOverflow / 掘金 / B 站 / 知乎 Arco Design Vue 教程数量**远少于 Element Plus**——遇到问题更依赖 GitHub Issue + 英文文档
- **国际化项目优势不及 Antd Vue**：Ant Design Vue 的 Ant Design 设计语言**全球认知度更高**（特别是企业 SaaS / 海外 B2B），Arco 主要在字节内部 / 国内市场——**纯海外项目仍倾向 Antd Vue / Vuetify**
- **vs Element Plus**：Element Plus **国内市场份额断层第一 / 生态完整 / 招聘市场主流**；Arco Design Vue **字节大厂背书 / 双栈设计统一 / Design Lab 主题平台 / Pro 模板完整**——**选 Element Plus 还是 Arco**：稳定 / 招聘 / 教程多选 Element Plus；**字节同款 / 跨栈设计 / Pro 模板**选 Arco
- **vs Ant Design Vue**：Antd Vue 是 Ant Design 社区维护的 Vue 实现（**非官方**）、设计权威性高；Arco 是字节官方的 Vue 实现、Vue / React 双官方一致——**优先用 React 选 Antd Vue（与 React Antd 强一致）/ 字节技术栈 / 双栈团队选 Arco**
- **vs Naive UI**：Naive UI **尤雨溪推荐 + 100% TS 编写 + Discord 现代设计**；Arco **字节大厂背书 + Pro 模板完整 + 企业级设计成熟度**——**新项目设计驱动选 Naive UI / 企业中后台 + 字节背书选 Arco**
- **vs Vuetify 3**：Vuetify 严格 Material Design / 海外项目多 / 移动端友好；Arco 字节企业设计 / 桌面端中后台优化 / 国内市场多——**海外 / Material 选 Vuetify / 国内企业级选 Arco**

## 文档地址

[Arco Design 设计系统](https://arco.design/) | [Arco Design Vue 官网](https://arco.design/vue) | [快速开始](https://arco.design/vue/docs/start) | [全局配置](https://arco.design/vue/docs/config-provider) | [国际化](https://arco.design/vue/docs/i18n) | [主题定制](https://arco.design/vue/docs/theme) | [暗黑模式](https://arco.design/vue/docs/dark) | [Design Lab 主题平台](https://arco.design/themes) | [Arco Icons 图标](https://arco.design/vue/component/icon) | [组件总览](https://arco.design/vue/component/button) | [更新日志](https://arco.design/vue/docs/changelog)

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=arco-design-vue" target="_blank" rel="noopener noreferrer">Arco Design Vue 测试题</a>


## GitHub 地址

[arco-design/arco-design-vue](https://github.com/arco-design/arco-design-vue)（主仓库，3.1k Star）| [arco-design/arco-design](https://github.com/arco-design/arco-design)（**React 版**，6.6k Star，共享同一设计系统）| [arco-design/arco-design-pro-vue](https://github.com/arco-design/arco-design-pro-vue)（**官方 Pro 中后台模板**，1.8k Star）| [arco-design/arco-design-pro](https://github.com/arco-design/arco-design-pro)（React 版 Pro 模板）| [arco-plugins](https://github.com/arco-design/arco-plugins)（Vite / Webpack / Babel 按需引入插件）

## 学习路径

- [入门](./getting-started.md)：`pnpm add @arco-design/web-vue` 安装 / 全量引入 `app.use(ArcoVue)` / 按需引入 `unplugin-vue-components` + `ArcoResolver` 自动按需 / 第一个 `<a-button>` / `<a-input>` / `<a-form>` 完整示例 / **必须懂的概念**：`<a-config-provider>` 全局配置（locale / size）/ 中文 i18n（`zh-CN` locale 包）/ 暗色模式（`arco-theme="dark"` body 属性）/ TypeScript 基础（Vue 3 + TS） / 700+ Arco Icons（`@arco-design/web-vue/es/icon`） / 与 Vue Router + Pinia 集成
- [指南](./guide-line.md)：**核心**：60+ 组件按 7 大类速览（General / Layout / Navigation / Data Entry / Data Display / Feedback / Other） / **`<a-form>` 深度**（model + rules + 13+ 校验类型 + async-validator + 嵌套 path + 动态校验 + Promise 风格） / **`<a-table>` 深度**（columns 数组 + 排序 / 筛选 / 树形 / 虚拟列表 `virtual-list-props` / 列固定 / 行选择 / 展开行 / 服务端排序 / 列拖拽） / **`Modal` / `Message` / `Notification` 全局静态 API**（`Modal.confirm` / `Modal.info` / `Modal.open` / `Message.success` / `Notification.info` 完整选项 + 静态 API vs 声明式 v-model）/ **`<a-drawer>`** 容器组件 / **主题深度**（Less 变量 + CSS Variables 双轨 + `arcoblue-6` 等核心变量列表 + Design Lab 在线生成主题包 + 暗色定制 + 多主题切换）/ **`<a-config-provider>` 全局配置完整选项** / **国际化深度**（13+ 语言包 + zh-CN locale 结构 + 与 vue-i18n 集成）/ **SSR / Nuxt 3 完整方案**（v2.44.3+ exports 配置 / Nuxt 3 自动注册 / 防止 hydration mismatch）/ **TypeScript 类型推导**（FormInstance / TableData / Locale 类型） / **与 Vue Router + Pinia 集成** / **与 arco-design-pro-vue 中后台模板配合** / **常见踩坑**（icon 路径 v2.44.3 前后差异 / SSR hydration / Less 主题编译失败 / Modal 静态调用上下文丢失）
- [参考](./reference.md)：**API 速查**：60+ 组件分类列表 / 常用组件 props 速查表（AButton / AInput / AForm / AFormItem / ATable / AModal / ADrawer / AMenu / APagination / ATabs / ASelect / ADatePicker） / **`<a-config-provider>` 完整选项** / **`Modal` / `Message` / `Notification` 静态 API 签名** / **TypeScript 类型**（FormInstance / FieldRule / TableData / TableColumnData / TriggerEvent） / **主题对象结构**（Less 变量 / CSS Variables 一一对照） / **13+ 语言包列表** / **700+ Arco Icons 分类**
