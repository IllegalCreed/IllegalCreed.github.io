---
layout: doc
---

# Angular

Google 自 2016 年起持续维护的**企业级前端框架**——前身是 2010 年的 AngularJS（v1），2016 年完全重写为基于 TypeScript 的 Angular 2，此后每半年一个大版本迭代。Angular 把自己定位为「**全套 Framework**」而非 React 那样的「Library」：路由、表单、HTTP、DI、测试、CLI、SSR、i18n、Service Worker 全部官方内置，不需要任何选型决策。设计上 Angular 是「**编译时模板 + 强类型 + 强约束**」——模板由 Ivy 编译器编译为高度优化的实例化函数，TypeScript 在每一层（组件 / 模板 / DI / 表单）都有完整类型覆盖，Style Guide 与 Angular CLI 强制目录与命名约定。Angular 21（2026.5）已经把 **Signals**（v17 引入）、**Standalone**（v15 引入，v17 默认）、**控制流 `@if` / `@for` / `@switch` / `@defer`**（v17 引入，v18 稳定）、**Zoneless**（v21 默认）四件大事全部稳定化，意味着 NgModule 时代、Zone.js 时代、`*ngIf` 时代基本结束。

## 评价

**优点**

- **企业级一体化**：路由、表单（Reactive + Template-driven + Signal Forms）、HTTP（含拦截器 + httpResource）、DI、i18n、SSR、Service Worker、动画、测试全部官方，没有选型决策疲劳；落地一致性极强
- **TypeScript 一等公民**：从 2016 年第一个版本就用 TS 写，模板里 `[disabled]="form.invalid"` 这种属性绑定都有完整类型检查；Typed Forms（v14+）让 `FormControl<string | null>` 全程类型安全
- **依赖注入设计严谨**：Hierarchical Injector + `@Injectable({providedIn: 'root'})` + InjectionToken + `inject()` 函数，类继承 / 测试替换 / 多 provider 都很自然，比 React Context / Vue provide-inject 强一档
- **编译时模板优化深**：Ivy 把模板编译成实例化函数（局部性 + 树摇友好），加上 v17+ 新控制流（`@if` / `@for`）的语法层优化，新版 Angular 运行时性能逼近 Solid / Svelte
- **CLI 生态最完整**：`ng new` / `ng generate` / `ng build` / `ng test` / `ng e2e` / `ng add` / `ng update`（自动迁移版本！）一条龙；schematics 让脚手架可扩展，Nx 提供 monorepo 增强
- **生态稳健**：Angular Material（官方，Material 3 实现）、Angular CDK（无样式行为层，业界标杆）、NgRx（Redux 风格 + Signals）、Akita / NGXS / Component Store；企业级 UI 库 PrimeNG / NG-ZORRO / Clarity 都很成熟
- **大版本迁移有保障**：`ng update` 自动应用代码迁移（schematics），从 v14 → v21 升级日常使用一个命令即可；这是 React / Vue 都做不到的工业能力
- **Signals 时代来临**：v17+ 引入 Signal API（`signal` / `computed` / `effect`），v21 默认 Zoneless，长期看是从「Zone.js 自动检测 + 全树脏检查」迁移到「细粒度推送 + 仅刷脏组件」的根本架构变化

**缺点**

- **学习曲线陡**：DI / 装饰器 / RxJS / Zone / Modules / 编译时模板，新手第一周劝退率高于 Vue / React；好处是统一性强，但门槛实实在在
- **历史包袱重**：NgModule + 旧 `*ngIf` / `*ngFor` + Class-based Components + RxJS-only 心智模型还活在大量 v8-v15 老项目里；新人要同时理解新旧两套是负担
- **bundle 体积偏大**：默认 Hello World ~150 KB（gzip），虽然比 v8 时代瘦多了但仍是 React / Vue 的 2-3 倍；移动端首屏敏感场景需要重度配置（lazy module + defer + 服务端预渲染）
- **RxJS 强绑定历史**：旧 Angular HTTP / Router / Forms / Reactive Forms 全是 `Observable<T>`，Promise 用户上手痛苦；好在 Signal + `toSignal` 提供了脱离 RxJS 的路径
- **国际人才市场偏弱**：北美 / 欧洲 React 候选人最多，Vue 次之，Angular 通常是大企业 / 银行 / 电信内部技术栈，独立开发者 / 创业公司选择较少
- **第三方组件生态相对集中**：UI 库虽然成熟但选项不如 React 多；shadcn/ui / Headless UI 这种「无样式 + 复制粘贴」模式在 Angular 生态里非常稀缺（Angular CDK 部分填空）
- **Zoneless 仍处于过渡期**：v21 默认 Zoneless 但很多第三方库（特别是依赖 `setTimeout` / `Promise` 自动检测变更）需要时间适配；老项目升级前要测试库兼容性

## 文档地址

[Angular](https://angular.dev/)

## GitHub 地址

[angular/angular](https://github.com/angular/angular)

## 幻灯片地址

<a href="/SlideStack/angular-slide/" target="_blank">Angular</a>
