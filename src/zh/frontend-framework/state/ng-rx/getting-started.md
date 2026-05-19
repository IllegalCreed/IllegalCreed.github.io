---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 **NgRx 19.x**（最新 v19，2024-12 起协调发布；配合 Angular 19 / 20 + TypeScript 5.4+ + Node 18+）编写。本文档**以 Standalone API + `createFeature` + Functional Effects 为默认**——`StoreModule.forRoot` / `EffectsModule.forRoot` 的 NgModule 老 API 仍可用、但 Angular 17+ 起官方推荐 standalone API；同时简要介绍 **`@ngrx/signals`** 新一代 SignalStore 范式作为补充选项。

## 速查

- **系统要求**：Angular 19+ / TypeScript 5.4+ / RxJS 7.5+ / Node 18+
- **安装**：`ng add @ngrx/store @ngrx/effects @ngrx/store-devtools`（Schematics 自动配 standalone API + provideStore + Redux DevTools）
- **手动安装**：`pnpm add @ngrx/store @ngrx/effects @ngrx/store-devtools`
- **SignalStore**：`pnpm add @ngrx/signals @ngrx/operators`
- **必须**：Angular 17+ 用 `provideStore` 不用 `StoreModule.forRoot`、用 `createFeature` 不用拆四个文件、用 Functional Effects 不用 class Effects（新代码推荐）
- **action 命名**：`[Source] Event Description` 形式（如 `[Counter Page] Increment`、`[Users API] Load Users Success`）
- **Provider 必须**：`bootstrapApplication(App, { providers: [provideStore(), provideEffects([...])] })`
- **DevTools**：`provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() })` + 浏览器扩展
- **`inject(Store)`** 在组件 / service 中获取 store——新 Angular standalone 风格、不再用 constructor 注入

## NgRx 是什么

NgRx 是 **Angular 生态最主流的 Redux 模式状态管理库**——准确地说，它是 **2016 年由 Rob Wormald**（前 Angular 团队成员）以 `@ngrx/store` 之名发布、灵感**直接来自 Redux for React** 的 Angular 状态管理平台。NgRx 这个词来源于「**Ng**（Angular 缩写）+ **Rx**（RxJS 响应式扩展）」的复合。

- **Angular 官方文档** 在状态管理章节明确推荐 NgRx
- **npm 下载量**：`@ngrx/store` ~750k / week、`@ngrx/effects` ~700k / week（2026 年）——Angular 端绝对的事实标准
- **NgRx 19.x（2024-12 起）** 配合 Angular 19 / 20、完全 standalone API、完整 TypeScript
- **协调发布**：所有 `@ngrx/*` 子包始终保持相同主版本号、同步发布（v19 / v18 / v17...）

> NgRx 名字来源：**Ng**（Angular）+ **Rx**（RxJS）= **NgRx**。
>
> 「Redux 心智 + RxJS 流 + Angular DI」三合一是它最大的特征。

## 现代 NgRx = Standalone API + `createFeature` + `@ngrx/signals`

理解现代 NgRx 必须先明白两件事：

**第一**：**NgModule API 仍可用、但官方推荐 Standalone API**——`StoreModule.forRoot({ counter: counterReducer })` / `EffectsModule.forRoot([UsersEffects])` 这套老 API 仍工作，但 Angular 17+ 起官方推荐 `provideStore({ counter: counterReducer })` / `provideEffects([UsersEffects])`。本文档以 standalone 为默认。

**第二**：**NgRx 提供两条并行路线**：

| 路线 | 适用场景 | 核心 API |
|---|---|---|
| **Global Store**（传统 Redux 模式） | 跨 feature 异步 / 严格审计 / Time-Travel 调试 / 大型企业 | `createAction` / `createReducer` / `createFeature` / `createSelector` / `createEffect` |
| **SignalStore**（NgRx 17+ 新增） | 组件级 / feature 级 / 简单全局状态 / 中小型项目 | `signalStore` / `withState` / `withMethods` / `withComputed` / `withHooks` |

**两条路线官方都推荐**、可以**在同一项目中并存**——Global Store 管全局严格审计的核心 state、SignalStore 管 feature 局部反应式状态。本入门文档**主要讲 Global Store**（与 Redux 心智一致、最大用户群），SignalStore 在 [指南](./guide-line.md#ngrx-signals-新一代-signalstore) 详述。

## NgRx vs Redux Toolkit / Pinia / SignalStore

| 维度 | NgRx Global Store | Redux Toolkit (React) | Pinia (Vue) | NgRx SignalStore |
|---|---|---|---|---|
| 阵营 | NgRx 官方（Angular 生态） | Redux 官方 | Vue 官方 | NgRx 官方 |
| 心智模型 | **action + reducer + selector + effect** | slice + dispatch + reducer + selector | 多 store + state + actions + getters | **signal + withMethods + withComputed** |
| 不变性 | 手动 spread / Immer | Immer（mutable OK） | 直接 mutate | `patchState`（immutable） |
| 异步 | `createEffect` + RxJS | `createAsyncThunk` / `RTK Query` | async action | `rxMethod` + RxJS / async method |
| 派生 | `createSelector` memoize | `createSelector` memoize | getters | `withComputed` Signal |
| Provider | `provideStore()` Standalone | `<Provider>` 必须 | `app.use(pinia)` | `providedIn: 'root'` Angular DI |
| TypeScript | **优秀**（`createFeature` 自动 typed） | 优秀（`RootState` 推导） | 优秀 | 顶级（Signal 类型推导精度极高） |
| Bundle | ~30-40KB（含 effects + entity + devtools） | ~13KB + ~8KB（RTK + React-Redux） | ~1.5KB | ~5KB |
| 数据层 | 无（用 effect + HttpClient） | 内置 RTK Query | 无（用 axios + useFetch） | 无（用 rxMethod + HttpClient） |
| Time-Travel | **完整支持** | 完整支持 | 部分支持 | 部分支持 |
| 学习曲线 | **陡（2-3 周）** | 陡（1-2 周） | 平（10 分钟） | 中（1 周） |
| 适用规模 | **大型 / 企业 / 严格审计 / Angular** | 大型 / 严格审计 / React | 所有 Vue 项目 | 中小型 Angular / feature 级 |

**含义**：

- Angular 大型企业 + 严格审计 + 跨 feature 异步 → 用 Global Store
- Angular 中小型 + 组件级反应式 → 用 SignalStore
- Angular 项目可**两者并用**——Global Store 管核心、SignalStore 管 feature 局部
- React 端 Redux 用户切换到 Angular → NgRx Global Store 心智几乎零成本

## 安装

### 推荐：用 `ng add` Schematics 一键安装

```bash
# 1. 安装 @ngrx/store + 自动配 provideStore
ng add @ngrx/store@latest

# 2. 安装 @ngrx/effects + 自动配 provideEffects
ng add @ngrx/effects@latest

# 3. 安装 @ngrx/store-devtools + 自动配 provideStoreDevtools
ng add @ngrx/store-devtools@latest

# 可选：实体管理 + 路由 store + Signals
ng add @ngrx/entity@latest
ng add @ngrx/router-store@latest

# SignalStore + Operators
pnpm add @ngrx/signals@latest @ngrx/operators@latest
```

> `ng add` 会**自动**：安装依赖到 `package.json`、在 `app.config.ts` 添加 `provideStore()` / `provideEffects()` / `provideStoreDevtools()`、为 standalone 项目自动配 standalone API、为 NgModule 项目自动配 `StoreModule.forRoot([])`。

### 手动安装

```bash
pnpm add @ngrx/store @ngrx/effects @ngrx/store-devtools
# 可选：
pnpm add @ngrx/entity @ngrx/router-store @ngrx/signals @ngrx/operators
```

### 版本要求

| 包 | 最新版本 | Angular | TypeScript |
|---|---|---|---|
| **@ngrx/store** | 19.x | Angular 18+（推荐 19+） | TS 5.4+ |
| **@ngrx/effects** | 19.x | Angular 18+ | TS 5.4+ |
| **@ngrx/entity** | 19.x | Angular 18+ | TS 5.4+ |
| **@ngrx/signals** | 19.x | Angular 18+（Signals 要 16.1+） | TS 5.4+ |
| **@ngrx/store-devtools** | 19.x | Angular 18+ | TS 5.4+ |

> **NgRx 19 关键变化**：所有 `@ngrx/*` 包要求 Angular 18+、SignalStore `withProps` 新功能、Functional Effects 已稳定、Signal 的 `viewChild` / `contentChild` 支持。

## 第一个 Store

### 1. 定义 Action

NgRx 的 action 是「**描述发生了什么的纯对象**」——用 `createAction` 创建 typed action creator：

```ts
// src/app/counter/counter.actions.ts
import { createAction, props } from '@ngrx/store';

// 1. 无 payload 的 action
export const increment = createAction('[Counter] Increment');
export const decrement = createAction('[Counter] Decrement');
export const reset = createAction('[Counter] Reset');

// 2. 带 payload 的 action：用 props 声明类型
export const incrementBy = createAction(
  '[Counter] Increment By',
  props<{ amount: number }>()
);

// 3. 带多个字段的 payload
export const setUser = createAction(
  '[Auth API] Set User',
  props<{ userId: number; name: string }>()
);
```

**关键点**：

- **Action type 命名约定**：`[Source] Event Description`——`[Source]` 指 action 来源（页面 / API / 组件 / 路由）、`Event Description` 描述具体事件——这是 NgRx 社区强约定、便于 DevTools 中归类
- **`props<T>()`** 用 phantom type 声明 payload 类型、运行时是空对象
- **调用 action creator** 返回 action 对象：`increment()` → `{ type: '[Counter] Increment' }`、`incrementBy({ amount: 5 })` → `{ type: '[Counter] Increment By', amount: 5 }`

### 2. 定义 Reducer

Reducer 是 `(state, action) => newState` 的纯函数——用 `createReducer` + `on()` 声明式定义：

```ts
// src/app/counter/counter.reducer.ts
import { createReducer, on } from '@ngrx/store';
import { increment, decrement, reset, incrementBy } from './counter.actions';

// 1. State 类型
export interface CounterState {
  count: number;
}

// 2. 初始 state
export const initialState: CounterState = {
  count: 0,
};

// 3. createReducer：注册每个 action 的处理逻辑
export const counterReducer = createReducer(
  initialState,
  on(increment, (state) => ({ ...state, count: state.count + 1 })),
  on(decrement, (state) => ({ ...state, count: state.count - 1 })),
  on(reset, (state) => ({ ...state, count: 0 })),
  // 处理带 payload 的 action（解构 payload）
  on(incrementBy, (state, { amount }) => ({
    ...state,
    count: state.count + amount,
  }))
);
```

**关键点**：

- **必须返回新对象**：`{ ...state, count: ... }`——**不能 mutate state**（NgRx 默认不集成 Immer、需要手动 spread）
- `on(actionCreator, (state, action) => newState)` 注册处理函数
- 多个 `on()` 处理不同 action、未匹配的 action 自动返回原 state
- 多个 action 复用同一个 handler：`on(action1, action2, (state) => ...)`

### 3. 在 Angular App 中注册 Store

NgRx 19 用 **Standalone API**——在 `app.config.ts` 中注册：

```ts
// src/app/app.config.ts
import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { counterReducer } from './counter/counter.reducer';

export const appConfig: ApplicationConfig = {
  providers: [
    // 1. 注册 root store（key: state 路径，value: reducer）
    provideStore({
      counter: counterReducer,
      // 可以加更多 reducer：
      // user: userReducer,
      // todos: todosReducer,
    }),

    // 2. Redux DevTools（生产模式 log-only）
    provideStoreDevtools({
      maxAge: 25,
      logOnly: !isDevMode(),
      autoPause: true,
      trace: false,
    }),
  ],
};
```

```ts
// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig);
```

> **NgModule 老风格（仅作对照）**：
>
> ```ts
> // ❌ 老风格 NgModule
> @NgModule({
>   imports: [
>     StoreModule.forRoot({ counter: counterReducer }),
>     StoreDevtoolsModule.instrument({ maxAge: 25 }),
>   ],
> })
> export class AppModule {}
> ```
>
> **新项目用 Standalone API**——更简洁、tree-shake 友好、是 Angular 17+ 推荐方向。

### 4. 在组件中使用 Store

`@ngrx/store` 提供 `Store` 服务——用 `inject(Store)` 获取（Angular 14+ 推荐）：

```ts
// src/app/counter/counter.component.ts
import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { AsyncPipe } from '@angular/common';
import { Observable } from 'rxjs';
import { increment, decrement, reset, incrementBy } from './counter.actions';

@Component({
  selector: 'app-counter',
  standalone: true,
  imports: [AsyncPipe],
  template: `
    <div>
      <h2>Counter</h2>
      <p>Count: {{ count$ | async }}</p>
      <button (click)="onIncrement()">+1</button>
      <button (click)="onDecrement()">-1</button>
      <button (click)="onIncrementBy(5)">+5</button>
      <button (click)="onReset()">Reset</button>
    </div>
  `,
})
export class CounterComponent {
  // 1. inject(Store) 获取 store 服务
  private store = inject(Store);

  // 2. 用 select 订阅 state slice — 返回 Observable
  count$: Observable<number> = this.store.select(
    (state: { counter: { count: number } }) => state.counter.count
  );

  // 3. dispatch action
  onIncrement(): void {
    this.store.dispatch(increment());
  }

  onDecrement(): void {
    this.store.dispatch(decrement());
  }

  onIncrementBy(amount: number): void {
    this.store.dispatch(incrementBy({ amount }));
  }

  onReset(): void {
    this.store.dispatch(reset());
  }
}
```

**关键点**：

- `inject(Store)` 比 constructor `private store: Store` 更简洁（Angular 14+ 推荐）
- `store.select(selector)` 返回 `Observable<T>`——模板用 `| async` pipe 订阅
- `store.dispatch(actionCreator(payload))` 派发 action
- 不需要手动 unsubscribe——`| async` pipe 自动管理

至此一个最小可用的 NgRx 应用就完成了——点击按钮 → dispatch action → reducer 更新 state → `select` 的 Observable 发出新值 → 组件自动重渲。

## `createFeature`：一行替代 actions + reducer + selectors 三件套

NgRx 16+ 引入的 `createFeature` 是 NgRx 的**核心简化**——把 feature 的 name + reducer + 自动 generated selectors **三合一**：

```ts
// src/app/counter/counter.feature.ts
import { createFeature, createReducer, on } from '@ngrx/store';
import { increment, decrement, reset, incrementBy } from './counter.actions';

export interface CounterState {
  count: number;
  lastUpdated: number | null;
}

const initialState: CounterState = {
  count: 0,
  lastUpdated: null,
};

// ✨ createFeature：name + reducer + 自动 generated selectors
export const counterFeature = createFeature({
  name: 'counter',
  reducer: createReducer(
    initialState,
    on(increment, (state) => ({
      ...state,
      count: state.count + 1,
      lastUpdated: Date.now(),
    })),
    on(decrement, (state) => ({
      ...state,
      count: state.count - 1,
      lastUpdated: Date.now(),
    })),
    on(reset, () => initialState),
    on(incrementBy, (state, { amount }) => ({
      ...state,
      count: state.count + amount,
      lastUpdated: Date.now(),
    }))
  ),
});

// 🔥 自动 generated 的导出：
export const {
  name,                  // 'counter'
  reducer,               // counter reducer 函数
  selectCounterState,    // feature selector：state.counter
  selectCount,           // selectCounterState.count
  selectLastUpdated,     // selectCounterState.lastUpdated
} = counterFeature;
```

**关键点**：

- **自动生成 feature selector**：`selectCounterState` 选中 `state.counter`
- **自动生成属性 selector**：state 中每个 key（`count` / `lastUpdated`）自动生成 `select<Pascal>` selector
- selector 名字遵循 Angular 命名约定（PascalCase，前缀 `select`）
- 完全 type-safe——`selectCount` 自动有 `Observable<number>` 类型

注册到 store：

```ts
// src/app/app.config.ts
import { provideStore } from '@ngrx/store';
import { counterFeature } from './counter/counter.feature';

export const appConfig: ApplicationConfig = {
  providers: [
    provideStore({
      [counterFeature.name]: counterFeature.reducer,
      // 等价于：counter: counterFeature.reducer
    }),
  ],
};
```

> **推荐**：所有新 feature 都用 `createFeature` —— 比手动写 `createFeatureSelector` + `createSelector` 至少省 30 行代码、且类型推导更精确。

组件中使用 generated selectors：

```ts
// src/app/counter/counter.component.ts
import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { counterFeature } from './counter.feature';
import { increment, decrement } from './counter.actions';

@Component({
  selector: 'app-counter',
  template: `
    <p>Count: {{ count$ | async }}</p>
    <p>Last updated: {{ lastUpdated$ | async }}</p>
    <button (click)="store.dispatch(increment())">+1</button>
    <button (click)="store.dispatch(decrement())">-1</button>
  `,
})
export class CounterComponent {
  store = inject(Store);

  // ✨ 直接用 generated selectors，全自动类型推导
  count$ = this.store.select(counterFeature.selectCount);
  lastUpdated$ = this.store.select(counterFeature.selectLastUpdated);

  increment = increment;
  decrement = decrement;
}
```

## Memoized Selector：`createSelector`

派生值（如 `doubledCount = count * 2`、`isPositive = count > 0`）**不要**存到 state——用 `createSelector` 实时算 + memoize：

```ts
// src/app/counter/counter.selectors.ts
import { createSelector } from '@ngrx/store';
import { counterFeature } from './counter.feature';

// 1. 基础派生
export const selectDoubledCount = createSelector(
  counterFeature.selectCount,
  (count) => count * 2
);

// 2. 多输入派生
export const selectCountSummary = createSelector(
  counterFeature.selectCount,
  counterFeature.selectLastUpdated,
  (count, lastUpdated) => ({
    count,
    isPositive: count > 0,
    lastUpdatedISO: lastUpdated ? new Date(lastUpdated).toISOString() : null,
  })
);
```

`createSelector` 自动 **memoize**——输入 selector 返回值不变时不重算、返回上次缓存。

> **`createFeature.extraSelectors`** 提供更优雅的派生 selector 写法（在 feature 内部声明），详见 [指南 > extraSelectors](./guide-line.md#extraselectors)。

## Redux DevTools 浏览器扩展

`provideStoreDevtools` 启用浏览器扩展集成——只需安装扩展：

### 安装扩展

- **Chrome**: [Redux DevTools](https://chromewebstore.google.com/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd)
- **Firefox**: [Redux DevTools](https://addons.mozilla.org/firefox/addon/reduxdevtools/)
- **Edge**: [Redux DevTools](https://microsoftedge.microsoft.com/addons/detail/redux-devtools/nnkgneoiohoecpdiaponcejilbhhikei)

打开浏览器开发者工具 → Redux 标签页（如果没有，刷新页面）。

### DevTools 能做什么

- **Action 列表**：所有 dispatched action 完整记录（type / payload / timestamp）
- **State 检视**：当前 state 树 + 每个 action 后的 state diff
- **Time-Travel**：滚动 action 列表回到任意历史状态
- **Action replay**：录制 → 导出 → 在另一个浏览器导入回放
- **Dispatcher**：手动 dispatch 任意 action 调试

### 完整 provideStoreDevtools 配置

```ts
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { isDevMode } from '@angular/core';

provideStoreDevtools({
  maxAge: 25,                  // 保留最近 25 个 state
  logOnly: !isDevMode(),       // 生产模式 log-only（不能 time-travel）
  autoPause: true,             // 扩展窗口未打开时暂停记录
  trace: false,                // 是否记录每个 action 的调用栈
  traceLimit: 75,              // 调用栈深度限制
  connectInZone: true,         // 在 Angular zone 内连接（默认 true）
  features: {
    pause: true,
    lock: true,
    persist: true,
    export: true,
    import: 'custom',
    jump: true,
    skip: true,
    reorder: true,
    dispatch: true,
    test: true,
  },
});
```

## 异步 Action：`@ngrx/effects`

NgRx reducer 必须是**纯函数**——不能在 reducer 内做 fetch / setTimeout / 写 DOM。异步逻辑必须在**外面**做——通过 `@ngrx/effects` 监听 action、做副作用、再 dispatch 新 action。

### 1. 定义 Action（三阶段：开始 / 成功 / 失败）

```ts
// src/app/users/users.actions.ts
import { createAction, props } from '@ngrx/store';

export interface User {
  id: number;
  name: string;
}

// 触发 action（从组件 / 路由）
export const loadUsers = createAction('[Users Page] Load Users');

// 成功 action（从 effect）
export const loadUsersSuccess = createAction(
  '[Users API] Load Users Success',
  props<{ users: User[] }>()
);

// 失败 action（从 effect）
export const loadUsersFailure = createAction(
  '[Users API] Load Users Failure',
  props<{ error: string }>()
);
```

### 2. 定义 Reducer（处理三阶段）

```ts
// src/app/users/users.feature.ts
import { createFeature, createReducer, on } from '@ngrx/store';
import { loadUsers, loadUsersSuccess, loadUsersFailure, User } from './users.actions';

export interface UsersState {
  list: User[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: UsersState = {
  list: [],
  status: 'idle',
  error: null,
};

export const usersFeature = createFeature({
  name: 'users',
  reducer: createReducer(
    initialState,
    on(loadUsers, (state) => ({
      ...state,
      status: 'loading',
      error: null,
    })),
    on(loadUsersSuccess, (state, { users }) => ({
      ...state,
      list: users,
      status: 'succeeded',
    })),
    on(loadUsersFailure, (state, { error }) => ({
      ...state,
      status: 'failed',
      error,
    }))
  ),
});

export const { name, reducer, selectList, selectStatus, selectError } =
  usersFeature;
```

### 3. 定义 Effect（监听 loadUsers，触发 HTTP 请求）

NgRx 19 推荐 **Functional Effect**（不依赖 class）：

```ts
// src/app/users/users.effects.ts
import { inject } from '@angular/core';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { catchError, exhaustMap, map } from 'rxjs/operators';
import { loadUsers, loadUsersSuccess, loadUsersFailure, User } from './users.actions';

// ✨ Functional Effect（推荐 NgRx 17+）
export const loadUsers$ = createEffect(
  (actions$ = inject(Actions), http = inject(HttpClient)) => {
    return actions$.pipe(
      ofType(loadUsers),
      exhaustMap(() =>
        http.get<User[]>('/api/users').pipe(
          map((users) => loadUsersSuccess({ users })),
          catchError((error) => of(loadUsersFailure({ error: error.message })))
        )
      )
    );
  },
  { functional: true }
);
```

**关键点**：

- `inject(Actions)` 获取 action 流（所有 dispatched action 都流过）
- `ofType(loadUsers)` 过滤特定 action
- `exhaustMap` 处理「**忽略并发的后续触发**」（适合表单 submit / 数据加载）—— 其他选项见下文
- `map((users) => loadUsersSuccess({ users }))` 把 API 响应转为成功 action
- `catchError` 捕获错误、转为失败 action（**必须包在内层 pipe 内**——否则错误会终止 outer 流）
- effect 返回的 action 会**自动**被 dispatch 到 store（不需要手动 dispatch）

### 4. Class-based Effect（仍支持）

如果偏好 class 风格（NgRx 14 之前的默认）：

```ts
import { Injectable, inject } from '@angular/core';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { catchError, exhaustMap, map } from 'rxjs/operators';
import { loadUsers, loadUsersSuccess, loadUsersFailure, User } from './users.actions';

@Injectable()
export class UsersEffects {
  private actions$ = inject(Actions);
  private http = inject(HttpClient);

  loadUsers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadUsers),
      exhaustMap(() =>
        this.http.get<User[]>('/api/users').pipe(
          map((users) => loadUsersSuccess({ users })),
          catchError((error) => of(loadUsersFailure({ error: error.message })))
        )
      )
    )
  );
}
```

> **新代码推荐 Functional Effect**——更简洁、不需要 `@Injectable()` 装饰器、tree-shake 更友好。但**两种风格都支持**、混用也 OK。

### 5. 注册 Effect 到 App

```ts
// src/app/app.config.ts
import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideHttpClient } from '@angular/common/http';
import { usersFeature } from './users/users.feature';
import * as UsersEffects from './users/users.effects';   // 函数式 effects 导出

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideStore({
      [usersFeature.name]: usersFeature.reducer,
    }),
    // ✨ Functional Effects 注册：传入对象（每个 export 都是 effect）
    provideEffects(UsersEffects),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
  ],
};
```

> **Class-based Effects 注册**：`provideEffects([UsersEffects])`（传入类数组）。
>
> 两种方式可以并存。

### 6. 在组件中触发加载

```ts
// src/app/users/users-list.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { loadUsers } from './users.actions';
import { usersFeature } from './users.feature';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [AsyncPipe, NgFor, NgIf],
  template: `
    <div>
      <h2>Users</h2>
      <button (click)="onReload()">Reload</button>

      <p *ngIf="(status$ | async) === 'loading'">Loading...</p>
      <p *ngIf="(status$ | async) === 'failed'">Error: {{ error$ | async }}</p>

      <ul *ngIf="(status$ | async) === 'succeeded'">
        <li *ngFor="let user of users$ | async">{{ user.name }}</li>
      </ul>
    </div>
  `,
})
export class UsersListComponent implements OnInit {
  private store = inject(Store);

  users$ = this.store.select(usersFeature.selectList);
  status$ = this.store.select(usersFeature.selectStatus);
  error$ = this.store.select(usersFeature.selectError);

  ngOnInit(): void {
    // 组件加载时触发请求
    this.store.dispatch(loadUsers());
  }

  onReload(): void {
    this.store.dispatch(loadUsers());
  }
}
```

### RxJS Flattening Operator 选择

Effect 中 `mergeMap` / `switchMap` / `concatMap` / `exhaustMap` 选哪个？取决于**并发处理策略**：

| Operator | 处理并发的方式 | 典型场景 |
|---|---|---|
| `mergeMap` | 全部并发执行 | 独立 fire-and-forget（日志上报） |
| `switchMap` | 取消前一个、只保留最新 | 搜索框 / 搜索框 query 切换 |
| `concatMap` | 严格串行排队 | 顺序敏感（更新分页 + 加载） |
| `exhaustMap` | 进行中时忽略新触发 | 表单 submit / 防重复加载 |

详见 [指南 > Effect Flattening Operators](./guide-line.md#effect-flattening-operators)。

## SignalStore 速览（NgRx 17+ 新一代）

如果不需要全局 Redux 严格审计 / Time-Travel、只想要「**Angular Signals + reactive state + computed + methods**」一体化 store——用 `@ngrx/signals`：

```ts
// src/app/counter/counter.store.ts
import { computed } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';

type CounterState = {
  count: number;
};

const initialState: CounterState = {
  count: 0,
};

// ✨ signalStore：一行起，state + computed + methods 全在一起
export const CounterStore = signalStore(
  { providedIn: 'root' },        // 全局单例
  withState(initialState),
  withComputed(({ count }) => ({
    doubledCount: computed(() => count() * 2),
    isPositive: computed(() => count() > 0),
  })),
  withMethods((store) => ({
    increment(): void {
      patchState(store, (state) => ({ count: state.count + 1 }));
    },
    decrement(): void {
      patchState(store, (state) => ({ count: state.count - 1 }));
    },
    incrementBy(amount: number): void {
      patchState(store, (state) => ({ count: state.count + amount }));
    },
    reset(): void {
      patchState(store, { count: 0 });
    },
  }))
);
```

组件中使用——**完全无需 Observable / async pipe**：

```ts
// src/app/counter/counter-signal.component.ts
import { Component, inject } from '@angular/core';
import { CounterStore } from './counter.store';

@Component({
  selector: 'app-counter-signal',
  standalone: true,
  template: `
    <div>
      <h2>Counter (SignalStore)</h2>
      <p>Count: {{ store.count() }}</p>
      <p>Doubled: {{ store.doubledCount() }}</p>
      <p>Is positive: {{ store.isPositive() }}</p>

      <button (click)="store.increment()">+1</button>
      <button (click)="store.decrement()">-1</button>
      <button (click)="store.incrementBy(5)">+5</button>
      <button (click)="store.reset()">Reset</button>
    </div>
  `,
})
export class CounterSignalComponent {
  store = inject(CounterStore);
}
```

**SignalStore 与 Global Store 关键差异**：

| 维度 | Global Store | SignalStore |
|---|---|---|
| 输出 | `Observable<T>`（用 `\| async`） | `Signal<T>`（直接 `store.x()`） |
| 心智 | action / reducer / selector / effect | state / methods / computed |
| RxJS | 必需 | 可选（用 `rxMethod` 桥接） |
| 注册 | `provideStore`（全局） | `providedIn: 'root'` 或组件 provider |
| Time-Travel | 完整支持 | 部分支持（需要 [@angular-architects/ngrx-toolkit](https://github.com/angular-architects/ngrx-toolkit)） |
| Bundle | ~30KB+ | ~5KB |

详细 SignalStore 用法见 [指南 > `@ngrx/signals`](./guide-line.md#ngrx-signals-新一代-signalstore)。

## TypeScript Typed Store

NgRx 19 + `createFeature` 提供**全自动类型推导**——不需要手动声明 `RootState` / `AppDispatch`（与 Redux Toolkit 不同）：

```ts
// src/app/counter/counter.feature.ts
export interface CounterState {
  count: number;
}

export const counterFeature = createFeature({
  name: 'counter',
  reducer: createReducer<CounterState>(
    { count: 0 },
    on(increment, (state) => ({ count: state.count + 1 }))
  ),
});

// ✨ 自动 typed selector：count$ 是 Observable<number>
const count$ = store.select(counterFeature.selectCount);
```

**如果**要在组件中显式声明 RootState 类型（rare case）：

```ts
// src/app/app.state.ts
import { counterFeature } from './counter/counter.feature';
import { usersFeature } from './users/users.feature';

export interface AppState {
  [counterFeature.name]: ReturnType<typeof counterFeature.reducer>;
  [usersFeature.name]: ReturnType<typeof usersFeature.reducer>;
}
```

> 大多数情况**不需要**显式 `AppState`——`createFeature` 的 generated selectors 已经完整类型化。

## NgModule → Standalone 迁移要点

如果你的项目还在 NgModule 风格，迁移到 standalone API 需要注意：

### Store 注册

```ts
// ❌ NgModule
@NgModule({
  imports: [
    StoreModule.forRoot({ counter: counterReducer }),
    StoreModule.forFeature('users', usersReducer),
  ],
})
export class AppModule {}

// ✅ Standalone
bootstrapApplication(AppComponent, {
  providers: [
    provideStore({ counter: counterReducer }),
    provideState({ name: 'users', reducer: usersReducer }),
  ],
});
```

### Effects 注册

```ts
// ❌ NgModule
@NgModule({
  imports: [
    EffectsModule.forRoot([UsersEffects, CounterEffects]),
    EffectsModule.forFeature([ProductsEffects]),
  ],
})
export class AppModule {}

// ✅ Standalone
bootstrapApplication(AppComponent, {
  providers: [
    provideEffects([UsersEffects, CounterEffects]),
    provideEffects([ProductsEffects]),    // 可以多次调用、累加
  ],
});
```

### DevTools

```ts
// ❌ NgModule
@NgModule({
  imports: [StoreDevtoolsModule.instrument({ maxAge: 25 })],
})
export class AppModule {}

// ✅ Standalone
bootstrapApplication(AppComponent, {
  providers: [provideStoreDevtools({ maxAge: 25 })],
});
```

### Router Store

```ts
// ❌ NgModule
@NgModule({
  imports: [StoreRouterConnectingModule.forRoot()],
})
export class AppModule {}

// ✅ Standalone
bootstrapApplication(AppComponent, {
  providers: [provideRouterStore()],
});
```

完整迁移指南：[NgRx 官方迁移文档](https://ngrx.io/guide/migration/v17)。

## 下一步

至此你已掌握 NgRx 入门——**安装**（`ng add @ngrx/store @ngrx/effects @ngrx/store-devtools`）/ **第一个 store**（`createAction` + `createReducer` + `provideStore`） / **`createFeature` 一行简化** / **`createSelector` 派生 + memoize** / **`inject(Store)` + `store.select()` + `store.dispatch()`** / **Redux DevTools** / **`createEffect` + RxJS 异步** / **Functional Effects vs Class Effects** / **SignalStore 新一代速览** / **NgModule → Standalone 迁移**。

继续学习：

- [指南](./guide-line.md)：**核心**——Actions 完整规范（`createAction` + `props` + `createActionGroup` + 命名约定 `[Source] Event Description`） / Reducers 完整（`createReducer` + `on()` + 不变性 + Immer 风格） / Selectors 完整（`createSelector` + `createFeatureSelector` + `extraSelectors` + 参数化 selector + memoize 自定义） / `createFeature` 完整选项 / **Effects 完整**（class-based vs functional + `{ dispatch: false }` + flattening operators 选择 + 错误处理 + `concatLatestFrom`） / **`@ngrx/entity`**（`createEntityAdapter` + 全 CRUD + selectors） / **`@ngrx/router-store`** 路由 state / **`@ngrx/signals` 新一代** SignalStore（`withState` / `withMethods` / `withComputed` / `withHooks` / `withEntities` / `signalStoreFeature` / `rxMethod`） / `@ngrx/operators`（`mapResponse` / `tapResponse` / `concatLatestFrom`） / Standalone vs NgModule 完整对照 / TypeScript 完整 / 测试（`MockStore` + Jest）/ SSR / 常见踩坑
- [参考](./reference.md)：**API 速查**——`createAction` / `createActionGroup` / `props` / `createReducer` / `on` / `combineReducers` / `createFeature` / `createSelector` / `createFeatureSelector` / `createSelectorFactory` / `createEffect` / `ofType` / `Actions` / `Store` / `createEntityAdapter` / `EntityState` / `EntityAdapter` / `getSelectors` / `provideStore` / `provideEffects` / `provideStoreDevtools` / `provideState` / `provideRouterStore` / `signalStore` / `withState` / `withMethods` / `withComputed` / `withHooks` / `withProps` / `withEntities` / `signalStoreFeature` / `signalState` / `patchState` / `rxMethod` / `mapResponse` / `tapResponse` / `concatLatestFrom` / Import 来源速查 / NgModule vs Standalone API 对照
