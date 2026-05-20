---
layout: doc
---

# PrimeNG

**国外 Angular 生态组件最丰富的 UI 库** —— 由土耳其公司 **PrimeTek** 出品（同时维护 PrimeReact / PrimeVue / PrimeFaces 全家桶、自 2008 年起做 PrimeFaces），是 **欧美企业级 Angular 应用 UI 库的事实标准**。**截至 2026 年 5 月，最新稳定版 v20.x**（v20 于 2024 年底 / 2025 年初发布、跟随 Angular 20 + 实现完全 Standalone Components 默认），相对 v17 有 **3 次重大主题系统重构**（v17 内置 Less 主题 → v18 引入 `@primeng/themes` 设计令牌 → v19 默认 CSS Layers + Design Token 三层结构 → v20 整合 `@primeuix/themes` 通用主题包，**与 PrimeVue / PrimeReact 共享同一份主题底座**）。**80+ 组件覆盖完整业务场景** —— 是 **Angular 生态组件数最多的 UI 库**（vs Angular Material 30+ / NG-ZORRO 70+ / Taiga UI 130+），含其他 Angular UI 库稀有组件：**OrganizationChart / Galleria / TreeTable / Editor（基于 Quill）/ Chart（基于 Chart.js）/ FullCalendar 集成 / Knob / SpeedDial / MeterGroup / VirtualScroller / 完整 DataTable（lazy load + virtual scroll + 行编辑 + 列冻结 + CSV 导出）**。**核心特性矩阵**：**Styled Mode + Unstyled Mode 双渲染模式**（Styled 用内置 Design Token 主题、Unstyled 配合 Tailwind 完全自由设计）/ **v20 主题系统基于 `@primeuix/themes`**（与 PrimeVue 4 / PrimeReact 共享同一套设计令牌底层）—— `Aura` / `Material` / `Lara` / `Nora` 4 大预设 + `definePreset` 自定义 + 运行时 `updatePreset` / `updatePrimaryPalette` / **PassThrough (`pt`) 深度自定义**（穿透到任意内部 DOM 元素的 class / style / 事件、是 PrimeTek 全家桶的核心创新）/ **`providePrimeNG` Standalone API**（Angular 17+ standalone 默认、配合 `provideAnimationsAsync` 一行配置）/ **`tailwindcss-primeui` 官方 Tailwind 插件**（语义化 `bg-primary` / `text-surface-500` 工具类、支持 Tailwind v3 / v4）/ **完整 CSS @layer 集成**（`cssLayer: { name: 'primeng', order: 'tailwind-base, primeng, tailwind-utilities' }` 解决 Tailwind 优先级冲突）/ **`ConfirmationService` / `MessageService` / `DialogService` 命令式服务**（标准 Angular DI 风格、不需要 Provider Pattern 子组件）/ **完整 PrimeIcons 内置 250+ 图标包**（`pi pi-*` CSS 类前缀）/ **`PrimeNG` config service + `setTranslation()` 运行时 i18n** / **完整 ngx-translate 集成方案** / **Angular SSR 兼容**（v20 hydration 友好）/ **完整 TypeScript 5 严格类型**（每个组件 input / output / instance method 都有 TS 类型、Angular Signals 友好）。**典型用户群**：**欧美企业级 Angular 应用 / SaaS Dashboard / 跨境业务 / 已有 PrimeReact / PrimeVue 经验的全栈团队 / 需要 80+ 组件 + DataTable 重型场景**。**PrimeBlocks / PrimeAdmin 商业模板**（PrimeTek 商业产品、Apollo / Genesis / Diamond / Avalon 等付费模板，覆盖大量预制业务页面、Dashboard、CRUD 场景）。**截至 2026 年的 v20.x** 进入「**成熟稳定期**」—— v17 重构 → v18 token → v19 CSS Layer 默认 → v20 整合 `@primeuix/themes` —— **与 Angular 框架同节奏 major 升级**，这是 Angular 阵营里「**最国外、最 Tailwind-friendly、组件数最多、PrimeTek 全家桶设计一致**」的 UI 库选择。

## 评价

**优点**

- **国外最受欢迎的 Angular UI 库**：**PrimeTek** 是欧美 UI 组件商业领头羊（自 2008 年起做 PrimeFaces）、PrimeNG 在欧美 Angular 开发者中**心智份额第一** —— 海外项目、技术选型默认会考虑 PrimeNG（与国内默认 NG-ZORRO / Angular Material 的市场结构正好相反）
- **Angular 组件数最多（80+）+ 含稀有组件**：覆盖 **Form / Button / Data / Panel / Overlay / File / Menu / Chart / Messages / Media** 全部 10 大类 —— 包含其他 Angular UI 库少见的 **OrganizationChart / Galleria（轮播图册）/ TreeTable / Editor（基于 Quill 富文本）/ Chart（基于 Chart.js）/ Knob / SpeedDial（悬浮快速操作）/ MeterGroup（多指标进度条）/ VirtualScroller** —— **业务复杂、Dashboard 场景的 Angular 组件库一站式选择**
- **v20 主题系统基于 `@primeuix/themes`**：与 PrimeVue 4 / PrimeReact 共享 **同一份设计令牌底层** —— `Aura` / `Material` / `Lara` / `Nora` 4 大预设 + `definePreset` 自定义 + 运行时 `updatePreset` / `updatePrimaryPalette` —— **跨框架（Angular / Vue / React）UI 一致性、设计师只画一份 Figma 全家桶可用**
- **Design Token 三层架构**：**Primitive**（颜色 / 间距 / 字号原子）+ **Semantic**（primary.color / surface.50 语义令牌）+ **Component**（inputtext.background / button.primary.color 组件令牌）—— **比 NG-ZORRO Less 变量更结构化、比 Angular Material `--mdc-*` Component Tokens 更跨框架**
- **Styled vs Unstyled 两种模式**：**Styled Mode**（默认）用内置预设——开箱即用；**Unstyled Mode**（关键差异化）—— 关闭所有内置样式、配合 Tailwind / 自定义 CSS 实现完全自由设计 —— **NG-ZORRO / Angular Material 不可能做到的设计自由度**（`Volt UI` 是 PrimeTek 官方 Unstyled + Tailwind 重写版）
- **PassThrough (`pt`) 革命**：**PrimeTek 全家桶核心创新** —— 通过 `[pt]` 属性穿透到组件**任意内部 DOM 元素**、传入 class / style / 事件 / hooks —— **无需 `::ng-deep`、无需 unstyled mode** —— 是 **最强大的 Angular UI 库定制 API**（vs NG-ZORRO `NzConfigService` 只能改主题、不能改 DOM）
- **`providePrimeNG` Standalone API**：Angular 17+ standalone 默认、`provideAnimationsAsync` + `providePrimeNG({ theme: { preset: Aura } })` 两行配置 —— **不需要 NgModule 包装、Tree Shaking 极致友好**
- **CSS @layer 完整集成**：`cssLayer: { name: 'primeng', order: 'tailwind-base, primeng, tailwind-utilities' }` —— **Tailwind 优先级冲突彻底解决**（vs NG-ZORRO Less 编译时定制更复杂）
- **`tailwindcss-primeui` 官方 Tailwind 插件**：把 PrimeNG 主题色板映射为 Tailwind 类 —— `bg-primary`、`text-surface-500`、`animate-fadein` 等 —— **配合 Tailwind 用 PrimeNG 时零阻力**（支持 Tailwind v3 + v4 双版本）
- **完整 DataTable（`p-table`）**：原生支持 lazy load / virtual scroll / 行编辑 / 单元格编辑 / 行展开 / 行分组 / 列冻结 / 列拖拽 / CSV / Excel / PDF 导出 / 状态持久化（session/localStorage）/ context menu —— **业内功能最齐全的 DataTable 组件之一**
- **`ConfirmationService` / `MessageService` / `DialogService` 命令式服务**：标准 Angular DI 风格 —— `constructor(private confirmationService: ConfirmationService)` + `this.confirmationService.confirm({...})` —— **不需要 Vue Provider Pattern 子组件、与 Angular 习惯一致**
- **`PrimeIcons` 内置 250+ 图标包**：`pi pi-spin` 旋转动画 + `PrimeIcons.PLUS` 常量 API + Figma 库 + ngx-translate 集成
- **完整 ngx-translate 集成**：`PrimeNG.setTranslation()` 配合 `TranslateService.get('primeng')` —— **运行时切换语言、ngx-translate 项目零额外工作**
- **`Volt UI` 官方 Tailwind 重写版**：开源 Tailwind + Unstyled PrimeNG 组件的完整重写 —— 可以直接 copy 到自己项目用 —— **是 Angular 阵营 shadcn 风格的实现**
- **PrimeBlocks / PrimeAdmin 商业模板**：PrimeTek 提供商业模板（Apollo / Genesis / Diamond / Avalon / Sapphire 等）—— 大量预制业务页面、Dashboard、CRUD 场景 —— **商业项目快速启动**
- **欧美企业级应用案例**：Stripe Atlas、GitLab（部分页面）、Adobe Behance、Mercedes-Benz、Volkswagen 等都使用过 PrimeFaces/PrimeNG 全家桶
- **跨 React / Angular / Vue 一致设计**：同一公司同时维护 PrimeReact / PrimeNG / PrimeVue —— **全栈团队、跨框架项目可以保持 UI 一致性**
- **Standalone Components 默认（Angular 17+）**：所有组件支持 standalone import、不需要 NgModule —— **Tree Shaking 极致友好**
- **完整 TypeScript + Signals 友好**：每个组件 input / output / instance method 都有 TS 类型、Angular Signals API（v17+）配合非常顺畅
- **持续迭代**：v17（2023）→ v18（2024）→ v19（2024 末）→ v20（2025/2026）—— **每个 major 都跟随 Angular 框架同步**、不像某些社区库版本落后

**缺点**

- **国内市场份额极低**：中文资源 / 国内开发者认知 **远不如 NG-ZORRO / Angular Material** —— StackOverflow / 掘金 / 知乎 / B 站等中文社区教程稀少、招聘市场国内几乎没人用 PrimeNG
- **官方中文文档缺失**：[primeng.org](https://primeng.org) 仅英文 —— **没有官方中文版**（vs NG-ZORRO 有完整中文文档 + 阿里背书）
- **v17 → v20 主题系统三次重构**：v17 内置 Less 主题 → v18 引入 `@primeng/themes` 设计令牌 → v19 默认 CSS Layers + Design Token 三层结构 → v20 整合 `@primeuix/themes` —— **跨版本升级是大改造**（必须把主题 import 路径、CSS 全局变量、组件 prop 名都改一遍）
- **`pt` 学习曲线陡**：PassThrough 的强大伴随复杂度 —— 每个组件有自己的 pt section 名称（如 `root` / `header` / `content` / `pcBadge`）、需要查文档每个组件的 pt 表格 —— **新人上手有一定门槛**
- **欧美设计语言**：默认 `Aura` 预设是欧美企业 / SaaS 应用风格 —— **与国内中后台「Ant Design 蓝色 + 灰色」审美不一致**、设计师可能不熟悉
- **bundle 比 NG-ZORRO 大**：80+ 组件 + 主题对象 + PrimeIcons —— 全量加载比 NG-ZORRO 大 20%~30%，但**按需引入后差距不大**
- **Angular 学习曲线本身陡**：Angular 17+ standalone 简化了一部分但 **DI / Decorators / Signals / RxJS / Zoneless / Change Detection 概念多** —— 新人 1-2 周才能上手 Angular 本身、再加 PrimeNG 又是一周
- **vs Angular Material**：Angular Material **Google 官方背书 + Material Design + `@angular/cdk` 行为底座 + 严格 WCAG 合规**；PrimeNG **PrimeTek 商业 + 组件数更多（80+ vs 30+）+ PassThrough 定制更强 + Tailwind 集成更好** —— **严格 Material 风选 Angular Material、其他场景选 PrimeNG**
- **vs NG-ZORRO**：NG-ZORRO **阿里官方背书 + Ant Design 视觉 + 国内中后台主流 + 完整中文文档**；PrimeNG **欧美主流 + 组件数更多 + PassThrough 定制更强 + Tailwind 集成更好** —— **国内项目几乎没理由选 PrimeNG、海外 / 国际化 / Tailwind 项目首选 PrimeNG**
- **vs Taiga UI**：Taiga UI **Tinkoff 出品 + 130+ 组件 + 现代化设计**；PrimeNG **PrimeTek 全家桶一致 + Tailwind 集成 + Unstyled 模式** —— **Taiga 给「更多组件 + 现代 Angular 实践」、PrimeNG 给「跨框架一致 + 商业模板 + Tailwind」**
- **vs PrimeFaces（同公司 JSF 版）**：PrimeFaces 是同公司的 **Java JSF** 版本 —— PrimeNG 是 **Angular** 版本 —— 不要混淆
- **CSS Variables 命名前缀**：v20 默认 `--p-*` 前缀（vs v17 `--surface-*` 等）—— **跨 major 升级时全局样式覆盖需要重写**
- **Premium 模板付费**：Apollo / Genesis / Diamond 等商业模板按授权数量收费（$59-$299）—— **个人项目和教学用例不便宜**
- **DataTable column 用 Angular 模板**：与 NG-ZORRO `<th>` HTML 风格不同，PrimeNG DataTable 用 `<ng-template #header>` / `<ng-template #body let-rowData>` 模板 —— **TS 类型支持稍弱、动态列稍麻烦**
- **国内 CDN 镜像稀少**：JSdelivr / unpkg / cdnjs 海外 CDN 加载 —— **国内访问偶尔慢、未经过 npmmirror 加速**
- **学习曲线**：基础组件简单、`ConfirmationService` 中等、`DialogService.open(MyComponent)` 动态组件较陡、PassThrough 学习曲线 —— **整体新人 1-2 周熟练**

## 文档地址

[PrimeNG 官网](https://primeng.org) | [Installation](https://primeng.org/installation) | [Theming](https://primeng.org/theming) | [Configuration](https://primeng.org/configuration) | [PassThrough](https://primeng.org/passthrough) | [Tailwind CSS](https://primeng.org/tailwind) | [PrimeIcons](https://primeng.org/icons) | [Components Overview](https://primeng.org/overview) | [Templates](https://primeng.org/templates) | [v20 Migration](https://primeng.org/guides/migration) | [PrimeNG GitHub](https://github.com/primefaces/primeng) | [PrimeUIX Themes](https://github.com/primefaces/primeuix)

## GitHub 地址

[primefaces/primeng](https://github.com/primefaces/primeng)（主仓库 10k+ Star）| [primefaces/primeuix](https://github.com/primefaces/primeuix)（v20 主题系统底层 + `@primeuix/themes`）| [primefaces/primeicons](https://github.com/primefaces/primeicons)（PrimeIcons 图标包）| [primefaces/primeng-templates](https://github.com/primefaces/primeng-templates)（官方示例项目集合）| [primefaces/tailwindcss-primeui](https://github.com/primefaces/tailwindcss-primeui)（官方 Tailwind 插件，与 PrimeVue 共用）| [PrimeNG 官方 Discord](https://discord.gg/gzKFYnpmCY)

## 学习路径

- [入门](./getting-started.md)：`pnpm add primeng @primeuix/themes primeicons` 安装 / `provideAnimationsAsync()` + `providePrimeNG({ theme: { preset: Aura } })` 在 `app.config.ts` 第一次配置 / 第一个 `<p-button>` + `<input pInputText>` / PrimeIcons CSS 导入 / Standalone Component import / **必须懂的概念**：4 大主题预设（Aura / Material / Lara / Nora）/ Styled vs Unstyled 模式 / `darkModeSelector` 暗色切换 / `cssLayer` Tailwind 共存 / PrimeIcons + 自定义图标 / `translation` 中文配置 / TypeScript 基础（Signals 友好）/ Angular Router 集成
- [指南](./guide-line.md)：**核心**：**80+ 组件按 10 大类速览**（Form / Button / Data / Panel / Overlay / File / Menu / Chart / Messages / Media）/ **Form 组件深度**（InputText / Select / MultiSelect / DatePicker / Checkbox / RadioButton + Angular Reactive Forms 完整集成）/ **DataTable 重磅深度**（基础 + 分页 + 排序 + 筛选 + 选择 + 行展开 + 行编辑 + lazy load + virtual scroll + 列冻结 + CSV 导出 + 状态持久化）/ **Theming 4 大预设 + `definePreset` 自定义**（Primitive / Semantic / Component 三层 token）/ **Styled vs Unstyled Mode 对比** / **Tailwind 集成完整方案**（`tailwindcss-primeui` 插件 + `surface-` / `primary-` 工具类 + Tailwind v3 / v4 双版本 + cssLayer 顺序）/ **PassThrough (`pt`) 深度自定义**（pt 全局 vs 单组件 / `mergeSections` / `mergeProps` / PassThroughContext / `pcBadge` 嵌套）/ **`ConfirmationService` / `MessageService` / `DialogService` 命令式服务** / **`PrimeNG` config service + `setTranslation()` i18n + ngx-translate** / **Angular SSR + Hydration** / **TypeScript 完整**（component / theme / service 类型）/ **常见踩坑**（v17 → v18 → v19 → v20 主题系统重构 / Standalone import / Tailwind 共存 cssLayer / PassThrough 嵌套命名）
- [参考](./reference.md)：**API 速查**：80+ 组件按 10 大类分组列表 / 常用组件 props 速查表（Button / InputText / Select / DataTable / Dialog / Menubar / Toast 等）/ **`providePrimeNG` 完整配置选项** / **`@primeuix/themes` 4 大预设** / **`definePreset` API** / **`ConfirmationService` / `MessageService` / `DialogService` 签名** / **PrimeIcons 常量** / **Translation 数据结构** / **PassThrough section 列表（按组件）** / **TypeScript 类型导出** / **`tailwindcss-primeui` 工具类列表**
