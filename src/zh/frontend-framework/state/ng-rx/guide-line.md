---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 **NgRx 19.x + Angular 19/20 + TypeScript 5.4+**。本文档完整覆盖 NgRx 两条路线：**Global Store**（`createAction` / `createReducer` / `createFeature` / `createSelector` / `createEffect` / `createEntityAdapter`）+ **SignalStore**（`signalStore` / `withState` / `withMethods` / `withComputed` / `withHooks` / `withEntities` / `rxMethod`）。包含 Actions 完整规范、Reducers 完整模式、Selectors / `createFeature` 详解、Effects 完整（class-based + functional）、`@ngrx/entity` normalized CRUD、`@ngrx/router-store` 路由 state、`@ngrx/operators` 工具集、Standalone API 完整、SSR、测试与常见踩坑。

## 速查

- **Actions 命名约定**：`[Source] Event Description`（如 `[Counter Page] Increment`、`[Users API] Load Users Success`）
- **`createAction`**：无 payload `createAction(type)` / 有 payload `createAction(type, props())` / 自定义 factory `createAction(type, (arg) => ({ ... }))`
- **`createActionGroup`**：一次定义一组相关 action（`[Counter Page]` source + 多个 events）
- **`createReducer`**：`createReducer(initialState, on(action, handler), ...)`；handler 必须返回**新对象**（NgRx 默认不集成 Immer）
- **`createFeature`**：name + reducer + 自动 generated feature selector + 属性 selectors + `extraSelectors`
- **`createSelector`**：自动 memoize（缓存大小 1）、多输入派生
- **Effects 写法**：Functional（推荐）vs Class-based；`{ functional: true }` 标识 functional
- **Flattening Operator**：`switchMap`（搜索）/ `mergeMap`（独立并发）/ `concatMap`（顺序）/ `exhaustMap`（防重复）
- **Error 处理**：`catchError` 必须包**内层** pipe、否则错误会终止 outer effect 流
- **`@ngrx/entity`**：`createEntityAdapter` → `getInitialState` → 全 CRUD（addOne / setMany / updateOne / upsertMany / removeOne / map）+ `getSelectors`
- **`@ngrx/signals`**：`signalStore` + 多个 `withXxx` features 组合 + `patchState` 不可变更新
- **Standalone**：`provideStore` / `provideEffects` / `provideStoreDevtools` / `provideState` / `provideRouterStore`

## Actions 完整规范

### Action 命名约定

NgRx 社区强约定 action type 格式：`[Source] Event Description`

- **`[Source]`**（方括号）：action 来源——常见值：
  - `[<Feature> Page]`：UI 触发的 user intent（如 `[Counter Page]` / `[Login Page]` / `[Cart Page]`）
  - `[<Feature> API]`：API 响应触发的 action（如 `[Users API]` / `[Auth API]`）
  - `[<Component>]`：组件内部触发（如 `[Header Menu]`）
  - `[Router]`：路由变化（来自 `@ngrx/router-store`）
- **`Event Description`**：描述具体事件——用**自然语言 + 动词原形**（不是动作名）

```ts
// ✅ 推荐：完整 [Source] Event Description
export const increment = createAction('[Counter Page] Increment');
export const decrement = createAction('[Counter Page] Decrement');
export const loadUsers = createAction('[Users Page] Load Users');
export const loadUsersSuccess = createAction(
  '[Users API] Load Users Success',
  props<{ users: User[] }>()
);
export const loadUsersFailure = createAction(
  '[Users API] Load Users Failure',
  props<{ error: string }>()
);

// ❌ 反模式：缺 Source / 用动词的命令式语气
export const INCREMENT = createAction('INCREMENT');
export const setCounter = createAction('SET_COUNTER');     // 动词命令式
export const usersLoaded = createAction('usersLoaded');    // 缺 [Source]
```

**为什么强约定**：DevTools 中按 source 归类、debug 时一眼看出 action 来源、防止重复命名（如 `[Counter Page] Reset` vs `[Game Page] Reset`）。

### `createAction` 三种签名

```ts
import { createAction, props } from '@ngrx/store';

// 1. 无 payload
export const increment = createAction('[Counter] Increment');
// 调用：increment() → { type: '[Counter] Increment' }

// 2. props 声明 payload 类型（最常用）
export const incrementBy = createAction(
  '[Counter] Increment By',
  props<{ amount: number }>()
);
// 调用：incrementBy({ amount: 5 }) → { type: '[Counter] Increment By', amount: 5 }

// 3. factory function 自定义 payload 构造
export const loadUser = createAction(
  '[User] Load User',
  (userId: number, includeDetails: boolean = false) => ({
    userId,
    includeDetails,
    timestamp: Date.now(),
  })
);
// 调用：loadUser(123, true) → { type: '[User] Load User', userId: 123, includeDetails: true, timestamp: 1735... }
```

> **`props<T>()` 是 phantom type**——运行时是空对象、只用于 TS 类型推导。直接用 `<T>` 不行（TS 泛型不能传给运行时函数）。

### `createActionGroup`：一组相关 action 一次定义

NgRx 16+ 引入的便捷 API——一次定义一组同 source 的相关 action：

```ts
import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { User } from './user.model';

// ✨ 一次定义 4 个 action
export const UsersPageActions = createActionGroup({
  source: 'Users Page',
  events: {
    // emptyProps()：无 payload 的简写
    'Open': emptyProps(),

    // props<T>()：带 payload
    'Search': props<{ query: string }>(),

    // 不同 payload 形状
    'Select User': props<{ userId: number }>(),
    'Delete User': props<{ userId: number }>(),
  },
});

// 自动生成的 action creators：
// UsersPageActions.open              → '[Users Page] Open'
// UsersPageActions.search            → '[Users Page] Search'
// UsersPageActions.selectUser        → '[Users Page] Select User'
// UsersPageActions.deleteUser        → '[Users Page] Delete User'

// API 响应 action 组
export const UsersApiActions = createActionGroup({
  source: 'Users API',
  events: {
    'Load Users Success': props<{ users: User[] }>(),
    'Load Users Failure': props<{ error: string }>(),
    'Delete User Success': props<{ userId: number }>(),
    'Delete User Failure': props<{ userId: number; error: string }>(),
  },
});
```

**关键点**：

- `source: 'Users Page'` 决定 type 前缀 `[Users Page]`——自动加 `[ ]`
- `events` 的 key 是 event description——自动 camelCase 化（如 `'Select User'` → `selectUser`）
- `emptyProps()` 是 `props<{}>()` 的简写、无 payload 场景用

组件中使用：

```ts
// 触发 action：UsersPageActions.search({ query: '...' })
this.store.dispatch(UsersPageActions.search({ query: 'alice' }));
```

Reducer / Effect 中匹配：

```ts
// reducer
on(UsersApiActions.loadUsersSuccess, (state, { users }) => ({ ... }))

// effect
ofType(UsersPageActions.search)
```

> **推荐**：所有新 feature 都用 `createActionGroup`——比单独 `createAction` 节省约 50% 代码。

## Reducers 完整模式

### `createReducer` + `on()` 基础

```ts
import { createReducer, on } from '@ngrx/store';
import { UsersPageActions, UsersApiActions } from './users.actions';

interface UsersState {
  list: User[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: UsersState = {
  list: [],
  status: 'idle',
  error: null,
};

export const usersReducer = createReducer(
  initialState,
  // 1. 单 action handler
  on(UsersPageActions.open, (state) => ({
    ...state,
    status: 'loading',
    error: null,
  })),

  // 2. payload 解构
  on(UsersApiActions.loadUsersSuccess, (state, { users }) => ({
    ...state,
    list: users,
    status: 'succeeded',
  })),

  on(UsersApiActions.loadUsersFailure, (state, { error }) => ({
    ...state,
    status: 'failed',
    error,
  })),

  // 3. 多 action 复用同一 handler
  on(
    UsersApiActions.deleteUserFailure,
    UsersApiActions.loadUsersFailure,
    (state, { error }) => ({ ...state, status: 'failed', error })
  ),
);
```

### 不变性：必须返回新对象

**NgRx 默认不集成 Immer**——必须手动 spread / 返回新对象：

```ts
// ✅ 推荐：spread 返回新对象
on(addTodo, (state, { todo }) => ({
  ...state,
  list: [...state.list, todo],
}))

// ✅ 嵌套对象更新：每层都 spread
on(updateNestedField, (state, { value }) => ({
  ...state,
  user: {
    ...state.user,
    address: {
      ...state.user.address,
      city: value,
    },
  },
}))

// ❌ 反模式：mutate state（NgRx 不会拦截、但破坏不变性）
on(addTodo, (state, { todo }) => {
  state.list.push(todo);  // ❌ 直接修改原数组
  return state;
})
```

### 数组操作的不变性写法

```ts
// 添加
on(addItem, (state, { item }) => ({
  ...state,
  items: [...state.items, item],
}))

// 删除（按 id）
on(removeItem, (state, { id }) => ({
  ...state,
  items: state.items.filter((item) => item.id !== id),
}))

// 更新（按 id）
on(updateItem, (state, { id, changes }) => ({
  ...state,
  items: state.items.map((item) =>
    item.id === id ? { ...item, ...changes } : item
  ),
}))

// 替换（按 index）
on(replaceItem, (state, { index, item }) => ({
  ...state,
  items: [
    ...state.items.slice(0, index),
    item,
    ...state.items.slice(index + 1),
  ],
}))
```

> **大型列表用 `@ngrx/entity`**——`createEntityAdapter` 提供预生成的 CRUD（详见下文）。

### 想要 Immer 风格？手动加 `immer`

NgRx 不内置 Immer、但你可以自己引入：

```ts
import { produce } from 'immer';
import { createReducer, on } from '@ngrx/store';

export const usersReducer = createReducer(
  initialState,
  on(addUser, (state, { user }) =>
    produce(state, (draft) => {
      draft.list.push(user);    // ✅ Immer 内可以 mutate
    })
  ),
);
```

> 大多数 NgRx 项目**不用 Immer**——手动 spread 在 TypeScript 中类型推导更清晰。

## Selectors 完整模式

### `createSelector` 基础

```ts
import { createSelector } from '@ngrx/store';

// 1. 基础 input selector：直接选 state 字段
const selectUsersState = (state: AppState) => state.users;

// 2. 单 input 派生
export const selectUserList = createSelector(
  selectUsersState,
  (users) => users.list
);

// 3. 多 input 派生
export const selectActiveUserCount = createSelector(
  selectUserList,
  (users) => users.filter((u) => u.active).length
);

export const selectSelectedUser = createSelector(
  selectUserList,
  (state: AppState) => state.users.selectedId,
  (users, selectedId) => users.find((u) => u.id === selectedId) ?? null
);
```

### `createFeatureSelector`：选 feature slice

```ts
import { createFeatureSelector, createSelector } from '@ngrx/store';

// 1. 选 feature slice（`state.users` → UsersState）
export const selectUsersState = createFeatureSelector<UsersState>('users');

// 2. 基于 feature selector 派生
export const selectUserList = createSelector(
  selectUsersState,
  (state) => state.list
);
```

> **推荐**：用 `createFeature` 自动生成 feature selector + 属性 selectors，不需要手动写 `createFeatureSelector`。

### `createFeature`：feature 一体化

```ts
import { createFeature, createReducer, on, createSelector } from '@ngrx/store';

interface UsersState {
  list: User[];
  selectedId: number | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: UsersState = {
  list: [],
  selectedId: null,
  status: 'idle',
  error: null,
};

export const usersFeature = createFeature({
  name: 'users',
  reducer: createReducer(
    initialState,
    on(UsersApiActions.loadUsersSuccess, (state, { users }) => ({
      ...state,
      list: users,
      status: 'succeeded' as const,
    })),
  ),
});

// 🔥 自动生成：
export const {
  name,                  // 'users'
  reducer,
  selectUsersState,      // 选整个 feature
  selectList,            // 选 state.users.list
  selectSelectedId,      // 选 state.users.selectedId
  selectStatus,          // 选 state.users.status
  selectError,           // 选 state.users.error
} = usersFeature;
```

### `extraSelectors`：在 feature 内声明派生 selector

NgRx 17+ 推荐方式——把派生 selector 放进 feature 定义、保持 colocation：

```ts
import { createFeature, createReducer, createSelector } from '@ngrx/store';

export const usersFeature = createFeature({
  name: 'users',
  reducer: createReducer(initialState),

  // ✨ extraSelectors：基于 generated selectors 派生
  extraSelectors: ({ selectList, selectSelectedId }) => ({
    selectSelectedUser: createSelector(
      selectList,
      selectSelectedId,
      (users, id) => users.find((u) => u.id === id) ?? null
    ),
    selectActiveUserCount: createSelector(
      selectList,
      (users) => users.filter((u) => u.active).length
    ),
    selectIsEmpty: createSelector(
      selectList,
      (users) => users.length === 0
    ),
  }),
});

// 现在可以导出：
export const {
  name,
  reducer,
  selectList,
  selectSelectedId,
  selectStatus,
  selectError,
  // ✨ extraSelectors 中定义的
  selectSelectedUser,
  selectActiveUserCount,
  selectIsEmpty,
} = usersFeature;
```

> **强烈推荐**：所有派生 selector 都用 `extraSelectors`——比单独写 selector 文件更紧凑、与 reducer 同地、自动 typed。

### 参数化 Selector（Selector Factory）

需要传参的 selector（如 `selectUserById(id)`）——返回 selector 函数：

```ts
import { createSelector } from '@ngrx/store';

// 1. 简单参数化：直接用闭包
export const selectUserById = (id: number) =>
  createSelector(selectUserList, (users) => users.find((u) => u.id === id));

// 使用：
const user$ = this.store.select(selectUserById(123));
```

**问题**：每次调用 `selectUserById(123)` 都创建新 selector → memoize 失效。

**解决方案**：用 `createSelector` props 参数（v8+ 不推荐了）或 selector factory + 闭包外提：

```ts
// ✅ 推荐：selector 工厂 + memoize
import { createSelector, MemoizedSelector } from '@ngrx/store';

const userSelectorsCache = new Map<number, MemoizedSelector<AppState, User | undefined>>();

export const selectUserById = (id: number) => {
  if (!userSelectorsCache.has(id)) {
    userSelectorsCache.set(
      id,
      createSelector(selectUserList, (users) => users.find((u) => u.id === id))
    );
  }
  return userSelectorsCache.get(id)!;
};
```

> **更优雅的方案**：用 `@ngrx/entity` 的 `selectEntities` 字典——`entities[id]` 直接 O(1) 查询、不需要 memoize 工厂。

### `createSelectorFactory`：自定义 memoize

`createSelector` 默认缓存大小为 **1**——参数变化即失效。需要更大缓存用 `createSelectorFactory`：

```ts
import { createSelectorFactory, defaultMemoize } from '@ngrx/store';

// 缓存大小 5
const memoize = defaultMemoize as any;  // 简化示例
const selectWithLargeCache = createSelectorFactory(memoize)(
  selectUserList,
  (users) => users.filter((u) => u.active)
);
```

实际项目中 LRU memoize 用 [reselect](https://github.com/reduxjs/reselect) 的 `lruMemoize` 或 third-party 库。

## `createFeature` 完整选项

```ts
import { createFeature, createReducer, on, createSelector } from '@ngrx/store';

export const usersFeature = createFeature({
  // 1. 必填：feature name（state 路径 key）
  name: 'users',

  // 2. 必填：reducer 函数
  reducer: createReducer(
    initialState,
    on(...),
    on(...)
  ),

  // 3. 可选：extraSelectors（NgRx 17+）
  extraSelectors: ({ selectList, selectSelectedId }) => ({
    selectSelectedUser: createSelector(
      selectList,
      selectSelectedId,
      (users, id) => users.find((u) => u.id === id) ?? null
    ),
  }),
});
```

**自动生成的导出**（基于 reducer 的初始 state 类型）：

| 导出名 | 类型 | 说明 |
|---|---|---|
| `name` | `'users'` (literal) | feature name |
| `reducer` | Reducer 函数 | 直接用于 `provideState` / `provideStore` |
| `selectUsersState` | `MemoizedSelector` | 选整个 feature slice |
| `selectXxx`（每个 state key） | `MemoizedSelector` | state 中每个 key 自动生成对应 selector |
| 加上 `extraSelectors` 中所有 selector | | |

注册：

```ts
// 全局 root store
provideStore({
  [usersFeature.name]: usersFeature.reducer,
})

// 或 feature store（lazy-loaded）
provideState(usersFeature)
```

## Effects 完整

`@ngrx/effects` 是 NgRx 的副作用层——监听 action 流、做 HTTP / WebSocket / localStorage / setTimeout、dispatch 新 action。

### Class-based Effect（传统）

```ts
import { Injectable, inject } from '@angular/core';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { catchError, exhaustMap, map, tap } from 'rxjs/operators';
import { UsersPageActions, UsersApiActions } from './users.actions';
import { User } from './user.model';

@Injectable()
export class UsersEffects {
  private actions$ = inject(Actions);
  private http = inject(HttpClient);

  // 标准 dispatching effect
  loadUsers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersPageActions.open),
      exhaustMap(() =>
        this.http.get<User[]>('/api/users').pipe(
          map((users) => UsersApiActions.loadUsersSuccess({ users })),
          catchError((error) =>
            of(UsersApiActions.loadUsersFailure({ error: error.message }))
          )
        )
      )
    )
  );

  // Non-dispatching effect（{ dispatch: false }）
  logActions$ = createEffect(
    () =>
      this.actions$.pipe(
        tap((action) => console.log('[Action]', action.type, action))
      ),
    { dispatch: false }
  );
}
```

注册：

```ts
provideEffects([UsersEffects])
```

### Functional Effect（NgRx 17+ 推荐）

```ts
import { inject } from '@angular/core';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { HttpClient } from '@angular/common/http';
import { of, tap } from 'rxjs';
import { catchError, exhaustMap, map } from 'rxjs/operators';
import { UsersPageActions, UsersApiActions } from './users.actions';
import { User } from './user.model';

// 1. Standard dispatching effect
export const loadUsers$ = createEffect(
  (actions$ = inject(Actions), http = inject(HttpClient)) => {
    return actions$.pipe(
      ofType(UsersPageActions.open),
      exhaustMap(() =>
        http.get<User[]>('/api/users').pipe(
          map((users) => UsersApiActions.loadUsersSuccess({ users })),
          catchError((error) =>
            of(UsersApiActions.loadUsersFailure({ error: error.message }))
          )
        )
      )
    );
  },
  { functional: true }
);

// 2. Non-dispatching effect
export const logActions$ = createEffect(
  () => inject(Actions).pipe(tap((action) => console.log('[Action]', action))),
  { functional: true, dispatch: false }
);
```

注册（functional effects 用对象传入）：

```ts
import * as UsersEffects from './users.effects';

provideEffects(UsersEffects)
// 等价：provideEffects({ loadUsers$, logActions$ })
```

> **NgRx 19 推荐 Functional Effect**——更简洁、无需 `@Injectable`、tree-shake 友好。但两种风格都支持、可混用。

### Effect Flattening Operators

Effect 中处理「action 流 → HTTP 请求 → 响应 action」时，**用哪个 operator 决定并发策略**：

| Operator | 行为 | 典型场景 |
|---|---|---|
| `mergeMap` | 所有触发都并发执行、不取消 | 独立 fire-and-forget（日志 / 通知） |
| `switchMap` | 取消前一个、只保留最新 | 搜索框（query 变化丢弃旧响应） |
| `concatMap` | 严格串行、排队执行 | 顺序敏感（更新 → 加载下一页） |
| `exhaustMap` | 进行中时忽略新触发 | 表单 submit / 防重复加载 |

```ts
// 1. switchMap：搜索（最常见）
export const searchUsers$ = createEffect(
  (actions$ = inject(Actions), http = inject(HttpClient)) => {
    return actions$.pipe(
      ofType(UsersPageActions.search),
      switchMap(({ query }) =>
        http.get<User[]>(`/api/users?q=${query}`).pipe(
          map((users) => UsersApiActions.searchUsersSuccess({ users })),
          catchError((error) =>
            of(UsersApiActions.searchUsersFailure({ error: error.message }))
          )
        )
      )
    );
  },
  { functional: true }
);

// 2. exhaustMap：表单 submit（防重复提交）
export const submitForm$ = createEffect(
  (actions$ = inject(Actions), http = inject(HttpClient)) => {
    return actions$.pipe(
      ofType(FormPageActions.submit),
      exhaustMap(({ data }) =>
        http.post<{ id: number }>('/api/forms', data).pipe(
          map((response) => FormApiActions.submitSuccess({ id: response.id })),
          catchError((error) => of(FormApiActions.submitFailure({ error })))
        )
      )
    );
  },
  { functional: true }
);

// 3. concatMap：顺序操作（保存 → 加载列表）
export const saveAndReload$ = createEffect(
  (actions$ = inject(Actions), http = inject(HttpClient)) => {
    return actions$.pipe(
      ofType(ItemsPageActions.save),
      concatMap(({ item }) =>
        http.post('/api/items', item).pipe(
          map(() => ItemsPageActions.reload())
        )
      )
    );
  },
  { functional: true }
);

// 4. mergeMap：独立通知（多个并发都执行）
export const trackEvents$ = createEffect(
  (actions$ = inject(Actions), analytics = inject(AnalyticsService)) => {
    return actions$.pipe(
      ofType(AnalyticsActions.track),
      mergeMap(({ event }) =>
        analytics.send(event).pipe(
          map(() => AnalyticsActions.trackSuccess())
        )
      )
    );
  },
  { functional: true }
);
```

### 错误处理：`catchError` 必须在内层

**关键陷阱**：`catchError` 如果放在**外层 pipe**——错误会**终止整个 effect 流**、effect 永远不再触发（用户报错「effect 第一次错误后就不工作了」）。

```ts
// ❌ 反模式：catchError 在外层 —— effect 第一次错误后停止
export const loadUsers$ = createEffect(
  (actions$ = inject(Actions), http = inject(HttpClient)) => {
    return actions$.pipe(
      ofType(UsersPageActions.open),
      exhaustMap(() => http.get<User[]>('/api/users')),
      map((users) => UsersApiActions.loadUsersSuccess({ users })),
      catchError((error) =>     // ❌ 在最外层
        of(UsersApiActions.loadUsersFailure({ error: error.message }))
      )
    );
  },
  { functional: true }
);

// ✅ 推荐：catchError 在内层 pipe（嵌套在 flattening operator 内）
export const loadUsers$ = createEffect(
  (actions$ = inject(Actions), http = inject(HttpClient)) => {
    return actions$.pipe(
      ofType(UsersPageActions.open),
      exhaustMap(() =>
        http.get<User[]>('/api/users').pipe(
          map((users) => UsersApiActions.loadUsersSuccess({ users })),
          catchError((error) =>   // ✅ 在内层 pipe
            of(UsersApiActions.loadUsersFailure({ error: error.message }))
          )
        )
      )
    );
  },
  { functional: true }
);
```

**为什么**：RxJS 中错误从内层传到外层、未捕获就**终止流**——`catchError` 在外层时、错误已逃出 inner pipe、outer Observable 终止；放在内层、错误被转为 next 通知，inner observable 正常完成，outer effect 流继续监听。

### `@ngrx/operators`：`mapResponse` + `tapResponse`

`@ngrx/operators` 提供专用 operators 简化常见模式：

```ts
import { createEffect, ofType, Actions } from '@ngrx/effects';
import { mapResponse } from '@ngrx/operators';
import { exhaustMap, inject } from '@angular/core';
// ...

// ✨ mapResponse：自动包装 next + error 为 success / failure action
export const loadUsers$ = createEffect(
  (actions$ = inject(Actions), http = inject(HttpClient)) => {
    return actions$.pipe(
      ofType(UsersPageActions.open),
      exhaustMap(() =>
        http.get<User[]>('/api/users').pipe(
          mapResponse({
            next: (users) => UsersApiActions.loadUsersSuccess({ users }),
            error: (error: { message: string }) =>
              UsersApiActions.loadUsersFailure({ error: error.message }),
          })
        )
      )
    );
  },
  { functional: true }
);
```

`mapResponse` 等价于 `map(next) + catchError(error => of(errorAction))` 的组合。

`tapResponse` 类似、但用于 ComponentStore / SignalStore 中的 `rxMethod` 内部（不返回 action）：

```ts
import { tapResponse } from '@ngrx/operators';
import { patchState } from '@ngrx/signals';

// 在 SignalStore 的 rxMethod 中
loadByQuery: rxMethod<string>(
  pipe(
    switchMap((query) =>
      booksService.getByQuery(query).pipe(
        tapResponse({
          next: (books) => patchState(store, { books, isLoading: false }),
          error: (err) => {
            patchState(store, { isLoading: false });
            console.error(err);
          },
        })
      )
    )
  )
),
```

### `concatLatestFrom`：在 effect 中读取最新 state

需要在 effect 中读取 store 当前 state——用 `concatLatestFrom`（NgRx 16+ 推荐、替代 `withLatestFrom`，避免初始化竞态）：

```ts
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import { Store } from '@ngrx/store';
import { map, exhaustMap } from 'rxjs/operators';

export const refresh$ = createEffect(
  (
    actions$ = inject(Actions),
    store = inject(Store),
    http = inject(HttpClient)
  ) => {
    return actions$.pipe(
      ofType(UsersPageActions.refresh),
      // ✨ 读取最新 state（lazy evaluation、不会触发循环订阅）
      concatLatestFrom(() => store.select(usersFeature.selectFilter)),
      exhaustMap(([action, filter]) =>
        http.get<User[]>(`/api/users?filter=${filter}`).pipe(
          map((users) => UsersApiActions.loadUsersSuccess({ users }))
        )
      )
    );
  },
  { functional: true }
);
```

> **为什么不用 `withLatestFrom`**：`withLatestFrom` 在 effect 创建时就订阅 state Observable、可能在 store 初始化前就触发；`concatLatestFrom` 接收 factory function、**懒求值**——只在 action 触发时才读 state。

### Non-Dispatching Effect

不返回 action 的 effect（如日志、通知、跳转）—— `{ dispatch: false }`：

```ts
// 1. 路由跳转
export const navigateAfterLogin$ = createEffect(
  (actions$ = inject(Actions), router = inject(Router)) => {
    return actions$.pipe(
      ofType(AuthApiActions.loginSuccess),
      tap(() => router.navigate(['/dashboard']))
    );
  },
  { functional: true, dispatch: false }
);

// 2. 显示 toast 通知
export const showSuccessToast$ = createEffect(
  (actions$ = inject(Actions), toast = inject(ToastService)) => {
    return actions$.pipe(
      ofType(UsersApiActions.deleteUserSuccess),
      tap(({ userId }) => toast.show(`User ${userId} deleted`))
    );
  },
  { functional: true, dispatch: false }
);

// 3. 持久化到 localStorage
export const persistUser$ = createEffect(
  (actions$ = inject(Actions)) => {
    return actions$.pipe(
      ofType(AuthApiActions.loginSuccess),
      tap(({ user }) => localStorage.setItem('user', JSON.stringify(user)))
    );
  },
  { functional: true, dispatch: false }
);
```

> **`{ dispatch: false }` 时**：effect 完成 / 错误后**不**自动 dispatch action——但**仍然订阅** action 流、不会停止。

## `@ngrx/entity` Normalized CRUD

大型列表 / 复杂关联数据用 **normalized state**（`ids` + `entities` 字典）—— `@ngrx/entity` 自动化所有 CRUD + 提供 memoized selectors。

### 1. 安装

```bash
ng add @ngrx/entity@latest
# 或
pnpm add @ngrx/entity
```

### 2. 创建 EntityAdapter

```ts
import {
  EntityState,
  EntityAdapter,
  createEntityAdapter,
} from '@ngrx/entity';

export interface User {
  id: number;
  name: string;
  email: string;
  active: boolean;
}

// 1. 扩展 EntityState：自动加 ids + entities 字段
export interface UsersState extends EntityState<User> {
  // 额外字段（不强制）
  selectedId: number | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
}

// 2. 创建 adapter
export const adapter: EntityAdapter<User> = createEntityAdapter<User>({
  selectId: (user) => user.id,                       // ID 字段（默认 'id'）
  sortComparer: (a, b) => a.name.localeCompare(b.name),  // 排序（可选）
});

// 3. 初始 state（用 adapter.getInitialState）
export const initialState: UsersState = adapter.getInitialState({
  selectedId: null,
  status: 'idle',
});
```

`EntityState<T>` 自动包含：

```ts
interface EntityState<T> {
  ids: string[] | number[];                  // 所有 entity ID
  entities: { [id: string | number]: T };    // ID → entity 字典
}
```

### 3. Adapter CRUD 方法在 reducer 中使用

```ts
import { createFeature, createReducer, on } from '@ngrx/store';
import { adapter, initialState } from './users.adapter';
import { UsersApiActions, UsersPageActions } from './users.actions';

export const usersFeature = createFeature({
  name: 'users',
  reducer: createReducer(
    initialState,

    // 1. setAll：替换所有 entity（适合 load 列表）
    on(UsersApiActions.loadUsersSuccess, (state, { users }) =>
      adapter.setAll(users, { ...state, status: 'succeeded' as const })
    ),

    // 2. addOne / addMany：追加（如果 ID 已存在 → 忽略）
    on(UsersApiActions.addUserSuccess, (state, { user }) =>
      adapter.addOne(user, state)
    ),

    // 3. setOne / setMany：添加或替换（ID 存在则替换）
    on(UsersApiActions.refreshUserSuccess, (state, { user }) =>
      adapter.setOne(user, state)
    ),

    // 4. upsertOne / upsertMany：合并（ID 存在则浅合并、不存在则添加）
    on(UsersApiActions.syncUsersSuccess, (state, { users }) =>
      adapter.upsertMany(users, state)
    ),

    // 5. updateOne / updateMany：按 ID 局部更新
    on(UsersApiActions.updateUserSuccess, (state, { id, changes }) =>
      adapter.updateOne({ id, changes }, state)
    ),

    // 6. mapOne / map：函数式转换
    on(UsersApiActions.activateAllSuccess, (state) =>
      adapter.map((user) => ({ ...user, active: true }), state)
    ),

    // 7. removeOne / removeMany / removeAll：删除
    on(UsersApiActions.deleteUserSuccess, (state, { id }) =>
      adapter.removeOne(id, state)
    ),
    on(UsersApiActions.clearAll, (state) =>
      adapter.removeAll(state)
    ),
  ),
});
```

**所有 adapter 方法**：

| 方法 | 行为 |
|---|---|
| `addOne` / `addMany` | 追加（ID 已存在则忽略） |
| `setOne` / `setMany` | 添加或替换（ID 存在则替换） |
| `setAll` | 替换全部（清空 + 设置新数据） |
| `upsertOne` / `upsertMany` | 合并（存在则浅合并、不存在则添加） |
| `updateOne` / `updateMany` | 按 ID 局部更新（`{ id, changes }`） |
| `mapOne` / `map` | 函数式转换 |
| `removeOne` / `removeMany` / `removeAll` | 删除 |

### 4. 用 `getSelectors` 获取预生成 selectors

```ts
import { adapter } from './users.adapter';
import { usersFeature } from './users.feature';
import { createSelector } from '@ngrx/store';

// 1. adapter 自带的 4 个 selector
const {
  selectIds,         // (state: UsersState) => ids
  selectEntities,    // (state: UsersState) => entities 字典
  selectAll,         // (state: UsersState) => User[]（按 sortComparer 排序）
  selectTotal,       // (state: UsersState) => count
} = adapter.getSelectors();

// 2. 包装到 RootState 路径下（用 createFeature 的 feature selector）
export const selectUserIds = createSelector(
  usersFeature.selectUsersState,
  selectIds
);

export const selectUserEntities = createSelector(
  usersFeature.selectUsersState,
  selectEntities
);

export const selectAllUsers = createSelector(
  usersFeature.selectUsersState,
  selectAll
);

export const selectTotalUsers = createSelector(
  usersFeature.selectUsersState,
  selectTotal
);

// 3. 派生：按 ID 取 entity（O(1) 查询）
export const selectUserById = (id: number) =>
  createSelector(selectUserEntities, (entities) => entities[id]);
```

### 5. 用 `createFeature.extraSelectors` 优雅地集成

```ts
import { createFeature, createReducer } from '@ngrx/store';
import { adapter, initialState } from './users.adapter';

export const usersFeature = createFeature({
  name: 'users',
  reducer: createReducer(initialState),
  extraSelectors: ({ selectUsersState }) => {
    const adapterSelectors = adapter.getSelectors();
    return {
      selectUserIds: createSelector(selectUsersState, adapterSelectors.selectIds),
      selectUserEntities: createSelector(
        selectUsersState,
        adapterSelectors.selectEntities
      ),
      selectAllUsers: createSelector(selectUsersState, adapterSelectors.selectAll),
      selectTotalUsers: createSelector(
        selectUsersState,
        adapterSelectors.selectTotal
      ),
    };
  },
});

export const {
  name,
  reducer,
  selectUsersState,
  selectIds: selectInternalIds,       // 这个是 EntityState 的 ids 字段
  selectEntities: selectInternalEntities,
  selectSelectedId,
  selectStatus,
  // 来自 extraSelectors
  selectUserIds,
  selectUserEntities,
  selectAllUsers,
  selectTotalUsers,
} = usersFeature;
```

## `@ngrx/router-store` 路由 state 同步

把 Angular Router state 同步到 NgRx store——可以在 selector / effect 中读路由：

```bash
ng add @ngrx/router-store
```

```ts
// src/app/app.config.ts
import { provideRouterStore } from '@ngrx/router-store';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideStore({ ... }),
    provideRouterStore(),    // ✨ 注册 router store
  ],
};
```

注册后 store 自动多一个 `router` slice（`state.router`）+ 路由变化自动 dispatch `ROUTER_NAVIGATION` / `ROUTER_NAVIGATED` action。

### 在 selector 中读路由参数

```ts
import { createSelector } from '@ngrx/store';
import { getRouterSelectors } from '@ngrx/router-store';

// router-store 提供一组预制 selector
const {
  selectCurrentRoute,
  selectQueryParams,
  selectQueryParam,
  selectRouteParams,
  selectRouteParam,
  selectRouteData,
  selectUrl,
} = getRouterSelectors();

// 用法：选当前路由的 id 参数
export const selectCurrentUserId = createSelector(
  selectRouteParam('id'),
  (id) => (id ? Number(id) : null)
);

// 派生：当前用户 + 路由参数联动
export const selectCurrentUser = createSelector(
  usersFeature.selectAllUsers,
  selectCurrentUserId,
  (users, id) => users.find((u) => u.id === id) ?? null
);
```

组件中订阅：

```ts
@Component({ ... })
export class UserDetailComponent {
  store = inject(Store);
  currentUser$ = this.store.select(selectCurrentUser);
}
```

### 在 effect 中响应路由变化

```ts
import { ROUTER_NAVIGATED, routerNavigatedAction } from '@ngrx/router-store';

export const onUserDetailNavigated$ = createEffect(
  (actions$ = inject(Actions), store = inject(Store)) => {
    return actions$.pipe(
      ofType(routerNavigatedAction),
      concatLatestFrom(() => store.select(selectCurrentUserId)),
      filter(([, userId]) => userId !== null),
      map(([, userId]) => UsersPageActions.loadUserDetail({ userId: userId! }))
    );
  },
  { functional: true }
);
```

## `@ngrx/signals` 新一代 SignalStore

NgRx 17 引入的 **SignalStore** 是基于 Angular Signals 的全新 store API——**与 Global Store 并行存在**、心智更轻、bundle 更小、适合中小型 / feature 级状态。

### `signalStore`：基础

```ts
import { signalStore, withState } from '@ngrx/signals';

type CounterState = {
  count: number;
};

const initialState: CounterState = {
  count: 0,
};

// 1. 全局单例 store
export const CounterStore = signalStore(
  { providedIn: 'root' },        // Angular DI 注册
  withState(initialState)
);

// 2. 组件级 store（不传 providedIn）
export const LocalCounterStore = signalStore(
  withState(initialState)
);
```

组件中使用（全局）：

```ts
@Component({ ... })
export class CounterComponent {
  store = inject(CounterStore);

  // 在模板中直接 store.count() —— 是 Signal、不是 Observable
}
```

组件中使用（局部）：

```ts
@Component({
  selector: 'app-counter',
  standalone: true,
  providers: [LocalCounterStore],   // ⬅️ 组件 provider
  template: `<p>Count: {{ store.count() }}</p>`,
})
export class CounterComponent {
  store = inject(LocalCounterStore);
}
```

### `withState`：初始 state

`withState` 接收初始 state 对象、自动把每个字段转为 Signal：

```ts
import { signalStore, withState } from '@ngrx/signals';

type BookSearchState = {
  books: Book[];
  isLoading: boolean;
  filter: { query: string; order: 'asc' | 'desc' };
};

const initialState: BookSearchState = {
  books: [],
  isLoading: false,
  filter: { query: '', order: 'asc' },
};

export const BookSearchStore = signalStore(
  { providedIn: 'root' },
  withState(initialState)
);

// 自动生成的 Signals（在组件中通过 store 访问）：
// store.books: Signal<Book[]>
// store.isLoading: Signal<boolean>
// store.filter: DeepSignal<{ query: string; order: 'asc' | 'desc' }>
//   - store.filter.query(): Signal<string>
//   - store.filter.order(): Signal<'asc' | 'desc'>
```

> **`DeepSignal`**：嵌套对象自动转为深层 Signal——`store.filter.query()` 直接获取嵌套字段的 Signal。

### `withComputed`：派生 Signal

```ts
import { computed } from '@angular/core';
import { signalStore, withComputed, withState } from '@ngrx/signals';

export const BookSearchStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ books, filter }) => ({
    booksCount: computed(() => books().length),
    sortedBooks: computed(() => {
      const direction = filter.order() === 'asc' ? 1 : -1;
      return books().toSorted(
        (a, b) => direction * a.title.localeCompare(b.title)
      );
    }),
  }))
);

// 自动暴露：
// store.booksCount: Signal<number>
// store.sortedBooks: Signal<Book[]>
```

> `withComputed` 的 factory function 接收 store 的所有 state + 之前 features 暴露的 signals、返回新 computed signals。

### `withMethods`：自定义方法

`withMethods` 用 `patchState` 更新 state：

```ts
import { signalStore, withMethods, withState, patchState } from '@ngrx/signals';

export const BookSearchStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => ({
    // 简单更新（partial state object）
    updateQuery(query: string): void {
      patchState(store, (state) => ({
        filter: { ...state.filter, query },
      }));
    },

    // 直接传 partial（不需要 state callback）
    setLoading(isLoading: boolean): void {
      patchState(store, { isLoading });
    },

    // 多个独立更新
    reset(): void {
      patchState(store, initialState);
    },

    // 异步方法（用 await）
    async loadBooks(): Promise<void> {
      patchState(store, { isLoading: true });
      try {
        const books = await fetch('/api/books').then((r) => r.json());
        patchState(store, { books, isLoading: false });
      } catch {
        patchState(store, { isLoading: false });
      }
    },
  }))
);
```

`patchState` 三种签名：

```ts
// 1. partial state object
patchState(store, { isLoading: true });

// 2. callback receiving current state
patchState(store, (state) => ({ filter: { ...state.filter, query } }));

// 3. 多个 updater 串行应用
patchState(
  store,
  { isLoading: true },
  (state) => ({ books: [...state.books, newBook] }),
  { isLoading: false }
);
```

### `withHooks`：生命周期 hooks

```ts
import { signalStore, withHooks, withMethods, withState, patchState } from '@ngrx/signals';
import { interval } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export const CounterStore = signalStore(
  withState({ count: 0 }),
  withMethods((store) => ({
    increment(): void {
      patchState(store, (state) => ({ count: state.count + 1 }));
    },
  })),
  withHooks({
    // 1. onInit：store 实例化时调用
    onInit(store) {
      console.log('Store initialized with count:', store.count());

      // 启动定时器
      interval(2_000)
        .pipe(takeUntilDestroyed())   // ✅ 必须 unsubscribe
        .subscribe(() => store.increment());
    },

    // 2. onDestroy：store 销毁时调用（组件级 store 卸载时）
    onDestroy(store) {
      console.log('Store destroyed with final count:', store.count());
    },
  })
);
```

### `withEntities`：基于 Signals 的 normalized state

类似 `@ngrx/entity`、但基于 Signals：

```bash
# 已包含在 @ngrx/signals 中、无需额外安装
```

```ts
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { withEntities, setAllEntities, addEntity, updateEntity, removeEntity } from '@ngrx/signals/entities';

type Todo = {
  id: number;
  text: string;
  completed: boolean;
};

export const TodosStore = signalStore(
  { providedIn: 'root' },
  withState({ filter: 'all' as 'all' | 'active' | 'completed' }),
  withEntities<Todo>(),      // ✨ 添加 entity state
  withMethods((store) => ({
    addTodo(text: string): void {
      patchState(
        store,
        addEntity({
          id: Date.now(),
          text,
          completed: false,
        })
      );
    },

    toggleTodo(id: number): void {
      const todo = store.entityMap()[id];
      if (todo) {
        patchState(
          store,
          updateEntity({
            id,
            changes: { completed: !todo.completed },
          })
        );
      }
    },

    removeTodo(id: number): void {
      patchState(store, removeEntity(id));
    },

    setTodos(todos: Todo[]): void {
      patchState(store, setAllEntities(todos));
    },
  }))
);

// withEntities 自动暴露：
// store.ids: Signal<number[]>           — 所有 ID
// store.entityMap: Signal<{ [id]: Todo }>  — ID → entity 字典
// store.entities: Signal<Todo[]>        — 所有 entity 数组（computed）
```

### `withProps`：注入依赖与命名属性

`withProps` 用于分组依赖（services / loggers / consts），避免在 `withMethods` 中显示注入：

```ts
import { inject } from '@angular/core';
import { signalStore, withProps, withState, withMethods, withHooks, patchState } from '@ngrx/signals';

export const BooksStore = signalStore(
  { providedIn: 'root' },
  withState<{ books: Book[]; isLoading: boolean }>({ books: [], isLoading: false }),
  withProps(() => ({
    booksService: inject(BooksService),
    logger: inject(Logger),
  })),
  withMethods(({ booksService, logger, ...store }) => ({
    async loadBooks(): Promise<void> {
      logger.debug('Loading books...');
      patchState(store, { isLoading: true });

      const books = await booksService.getAll();
      logger.debug('Books loaded:', books);

      patchState(store, { books, isLoading: false });
    },
  })),
  withHooks({
    onInit({ logger }) {
      logger.debug('BooksStore initialized');
    },
  })
);
```

### `rxMethod`：桥接 RxJS

SignalStore 中需要用 RxJS（debounce / switchMap / API call）—— `rxMethod`：

```ts
import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { debounceTime, distinctUntilChanged, pipe, switchMap, tap } from 'rxjs';

export const BookSearchStore = signalStore(
  { providedIn: 'root' },
  withState({ books: [] as Book[], isLoading: false, query: '' }),
  withMethods((store, booksService = inject(BooksService)) => ({
    // ✨ rxMethod：接受 Signal / Observable / 静态值作为输入
    searchBooks: rxMethod<string>(
      pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => patchState(store, { isLoading: true })),
        switchMap((query) =>
          booksService.search(query).pipe(
            tapResponse({
              next: (books) => patchState(store, { books, isLoading: false }),
              error: () => patchState(store, { isLoading: false }),
            })
          )
        )
      )
    ),
  }))
);
```

组件中使用 `rxMethod`：

```ts
@Component({
  selector: 'app-book-search',
  template: `
    <input [value]="query()" (input)="onQueryChange($event)" />
    <p>{{ store.isLoading() ? 'Loading...' : '' }}</p>
    <ul>
      <li *ngFor="let book of store.books()">{{ book.title }}</li>
    </ul>
  `,
})
export class BookSearchComponent {
  store = inject(BookSearchStore);
  query = signal('');

  constructor() {
    // ✨ 把 Signal 传给 rxMethod —— 自动追踪变化
    this.store.searchBooks(this.query);
  }

  onQueryChange(e: Event): void {
    this.query.set((e.target as HTMLInputElement).value);
  }
}
```

> `rxMethod` 是 Signal 与 RxJS 的桥梁——既能用 RxJS 的 powerful operator、又能让 SignalStore 保持 Signal-first 接口。

### `signalStoreFeature`：可复用 features

抽出可复用的 store feature——多个 store 共享逻辑：

```ts
import { computed } from '@angular/core';
import {
  signalStoreFeature,
  withComputed,
  withMethods,
  withState,
  patchState,
  type,
} from '@ngrx/signals';

// 1. 定义可复用 feature：通用的 loading state
export function withLoadingState() {
  return signalStoreFeature(
    withState({ isLoading: false, error: null as string | null }),
    withMethods((store) => ({
      setLoading(isLoading: boolean): void {
        patchState(store, { isLoading });
      },
      setError(error: string | null): void {
        patchState(store, { error });
      },
    }))
  );
}

// 2. 多个 store 复用
export const UsersStore = signalStore(
  { providedIn: 'root' },
  withState({ users: [] as User[] }),
  withLoadingState(),     // ✨ 复用 loading state
  withMethods(/* ... */)
);

export const BooksStore = signalStore(
  { providedIn: 'root' },
  withState({ books: [] as Book[] }),
  withLoadingState(),     // ✨ 同样复用
  withMethods(/* ... */)
);
```

带类型参数的 feature（需要外部 store 提供特定 state）：

```ts
export function withCounter<T>() {
  return signalStoreFeature(
    {
      // 声明输入要求：store 必须有 multiplier signal
      state: type<{ multiplier: number }>(),
    },
    withState({ count: 0 }),
    withComputed(({ count, multiplier }) => ({
      total: computed(() => count() * multiplier()),
    })),
    withMethods((store) => ({
      increment(): void {
        patchState(store, (state) => ({ count: state.count + 1 }));
      },
    }))
  );
}
```

### `signalState`：脱离 store 的独立 Signal state

不需要完整 store、只想要 reactive state——用 `signalState`：

```ts
import { signalState, patchState } from '@ngrx/signals';

const userState = signalState({
  user: { firstName: 'John', lastName: 'Doe' },
  isLoggedIn: false,
});

// 读取（Signal）
console.log(userState.user()); // { firstName: 'John', lastName: 'Doe' }
console.log(userState.user.firstName());  // 'John'（DeepSignal）

// 更新（不可变）
patchState(userState, (state) => ({
  user: { ...state.user, firstName: 'Jane' },
}));
```

`signalState` 通常在组件内 / 简单 service 中使用、不需要 DI 注册。

### Global Store vs SignalStore 对照表

| 维度 | Global Store | SignalStore |
|---|---|---|
| **状态结构** | 单 root store + slice | 多个独立 store（每个 service） |
| **state 类型** | `Observable<T>` 流 | `Signal<T>` 同步值 |
| **mutate state** | dispatch action → reducer | `patchState(store, ...)` |
| **派生** | `createSelector` | `withComputed` + `computed()` |
| **方法** | action creator + effect | `withMethods` |
| **副作用** | `createEffect` + RxJS | `rxMethod` 或 async method |
| **Provider** | `provideStore()` 全局 | `providedIn: 'root'` / 组件 provider |
| **Time-Travel** | 完整支持（DevTools） | 需要 [ngrx-toolkit](https://github.com/angular-architects/ngrx-toolkit) |
| **学习曲线** | 陡（2-3 周） | 中（1 周） |
| **典型场景** | 跨 feature 严格审计 / Time-Travel | feature 级 / 组件级 / 中小项目 |

## Standalone API 完整

### `provideStore`：注册 root store

```ts
import { provideStore } from '@ngrx/store';

provideStore({
  counter: counterReducer,
  users: usersReducer,
  // ...
}, {
  // 可选配置
  initialState: { ... },
  metaReducers: [...],
  runtimeChecks: {
    strictStateImmutability: true,
    strictActionImmutability: true,
    strictStateSerializability: true,
    strictActionSerializability: true,
    strictActionTypeUniqueness: true,
  },
})
```

### `provideState`：lazy feature

用于 lazy-loaded 路由的 feature state：

```ts
import { provideState } from '@ngrx/store';

// 1. 用 createFeature 对象
provideState(usersFeature);

// 2. 用 name + reducer
provideState({ name: 'users', reducer: usersReducer });

// 3. 用 string + reducer
provideState('users', usersReducer);
```

在 lazy route 中：

```ts
import { Route } from '@angular/router';
import { provideState } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';

export const routes: Route[] = [
  {
    path: 'users',
    providers: [
      provideState(usersFeature),
      provideEffects([UsersEffects]),
    ],
    loadComponent: () => import('./users/users-list.component').then((m) => m.UsersListComponent),
  },
];
```

### `provideEffects`：注册 effects

```ts
// 1. Class-based effects 数组
provideEffects([UsersEffects, AuthEffects]);

// 2. Functional effects 对象（推荐 NgRx 19）
import * as UsersEffects from './users.effects';
provideEffects(UsersEffects);

// 3. 多次调用累加
provideEffects([UsersEffects]),
provideEffects([AuthEffects]),    // 等价于一次传 [UsersEffects, AuthEffects]
```

### `provideStoreDevtools`：DevTools

```ts
import { isDevMode } from '@angular/core';
import { provideStoreDevtools } from '@ngrx/store-devtools';

provideStoreDevtools({
  maxAge: 25,
  logOnly: !isDevMode(),
  autoPause: true,
  trace: false,
  traceLimit: 75,
  connectInZone: true,
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

### `provideRouterStore`：路由 store

```ts
import { provideRouterStore } from '@ngrx/router-store';

provideRouterStore({
  // 可选：路由 state 序列化方式
  serializer: DefaultRouterStateSerializer,
});
```

## SSR + Angular Universal

NgRx 在 SSR 场景需要注意：

### 1. Server 端 dispatch + Client hydrate

```ts
// src/app/app.config.server.ts
import { ApplicationConfig, mergeApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { appConfig } from './app.config';
import { provideStore } from '@ngrx/store';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    // Server 端用相同 provideStore + 不需要 DevTools
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
```

### 2. Server 端 dispatch 初始 action

```ts
// 在 app.component.ts 或 APP_INITIALIZER 中
import { Store } from '@ngrx/store';
import { TransferState, makeStateKey } from '@angular/core';

const STATE_KEY = makeStateKey<any>('NGRX_STATE');

@Component({ ... })
export class AppComponent implements OnInit {
  private store = inject(Store);
  private transferState = inject(TransferState);
  private isServer = isPlatformServer(inject(PLATFORM_ID));

  ngOnInit() {
    if (this.isServer) {
      // Server 端：触发数据加载、最终 state 序列化到 transferState
      this.store.dispatch(loadUsers());
      // 完成后：
      this.store.select(state => state).pipe(take(1)).subscribe(state => {
        this.transferState.set(STATE_KEY, state);
      });
    } else {
      // Client 端：从 transferState 取出初始 state
      const initialState = this.transferState.get(STATE_KEY, {});
      // 用 META_REDUCER 或自定义 reducer hydrate
    }
  }
}
```

> SSR + NgRx 较复杂、详细见 [NgRx SSR 指南](https://ngrx.io/guide/store/recipes/ssr)。

## 测试

### `MockStore` 测试组件

```ts
import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { CounterComponent } from './counter.component';
import { counterFeature } from './counter.feature';

describe('CounterComponent', () => {
  let store: MockStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CounterComponent],
      providers: [
        provideMockStore({
          initialState: {
            counter: { count: 0 },
          },
        }),
      ],
    });

    store = TestBed.inject(MockStore);
  });

  it('renders count from store', () => {
    const fixture = TestBed.createComponent(CounterComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Count: 0');
  });

  it('updates when store state changes', () => {
    store.setState({ counter: { count: 42 } });
    const fixture = TestBed.createComponent(CounterComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Count: 42');
  });

  it('dispatches increment on click', () => {
    const spy = jest.spyOn(store, 'dispatch');
    const fixture = TestBed.createComponent(CounterComponent);
    fixture.nativeElement.querySelector('button').click();
    expect(spy).toHaveBeenCalledWith(increment());
  });
});
```

### 测试 selectors

```ts
import { counterFeature } from './counter.feature';

describe('counterFeature selectors', () => {
  it('selectCount returns count from state', () => {
    const result = counterFeature.selectCount({
      counter: { count: 42 },
    });
    expect(result).toBe(42);
  });
});
```

### 测试 reducers

```ts
import { counterReducer, initialState } from './counter.reducer';
import { increment } from './counter.actions';

describe('counterReducer', () => {
  it('increments count', () => {
    const result = counterReducer(initialState, increment());
    expect(result.count).toBe(1);
  });

  it('preserves state for unknown action', () => {
    const result = counterReducer(initialState, { type: 'UNKNOWN' });
    expect(result).toBe(initialState);
  });
});
```

### 测试 effects（marble testing）

```ts
import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of } from 'rxjs';
import { Actions } from '@ngrx/effects';

describe('UsersEffects', () => {
  let actions$: Observable<any>;
  let effects: UsersEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UsersEffects,
        provideMockActions(() => actions$),
        {
          provide: HttpClient,
          useValue: { get: jest.fn(() => of([{ id: 1, name: 'Alice' }])) },
        },
      ],
    });

    effects = TestBed.inject(UsersEffects);
  });

  it('loads users successfully', (done) => {
    actions$ = of(UsersPageActions.open());

    effects.loadUsers$.subscribe((action) => {
      expect(action.type).toBe('[Users API] Load Users Success');
      done();
    });
  });
});
```

### 测试 SignalStore

```ts
import { TestBed } from '@angular/core/testing';
import { CounterStore } from './counter.store';

describe('CounterStore', () => {
  it('starts with count 0', () => {
    TestBed.configureTestingModule({
      providers: [CounterStore],
    });
    const store = TestBed.inject(CounterStore);
    expect(store.count()).toBe(0);
  });

  it('increments count', () => {
    TestBed.configureTestingModule({
      providers: [CounterStore],
    });
    const store = TestBed.inject(CounterStore);
    store.increment();
    expect(store.count()).toBe(1);
  });
});
```

## 常见踩坑

### 1. Reducer 中有副作用

```ts
// ❌ 反模式：reducer 中 fetch / setTimeout / 修改 DOM
on(loadUsers, (state) => {
  fetch('/api/users').then(...);  // ❌ 副作用、unreproducible
  return { ...state, status: 'loading' };
})

// ✅ 正确：reducer 只更新 state、副作用放进 effect
on(loadUsers, (state) => ({ ...state, status: 'loading' }))
```

### 2. 忘了注册 Effects

```ts
// ❌ 反模式：写了 effect 但没在 provideEffects 中注册
provideStore({ users: usersReducer }),
// 缺：provideEffects([UsersEffects])
// → effect 永远不触发、感觉「dispatch action 没反应」
```

### 3. `catchError` 在外层导致 effect 终止

参见上文 [错误处理章节](#错误处理-catcherror-必须在内层)——`catchError` 必须包在内层 pipe。

### 4. Effect 第一次错误后停止工作

如果 effect 错误**没被 `catchError` 捕获**——整个 effect Observable 终止、之后所有 action 都不再触发该 effect：

```ts
// ❌ 忘了 catchError —— 第一次错误后 effect 死亡
export const loadUsers$ = createEffect(
  (actions$ = inject(Actions), http = inject(HttpClient)) => {
    return actions$.pipe(
      ofType(UsersPageActions.open),
      exhaustMap(() =>
        http.get<User[]>('/api/users').pipe(
          map((users) => UsersApiActions.loadUsersSuccess({ users }))
          // ❌ 缺 catchError
        )
      )
    );
  },
  { functional: true }
);
```

### 5. `withLatestFrom` 初始化竞态

```ts
// ❌ 反模式：withLatestFrom 可能在 store 初始化前就订阅
.pipe(
  withLatestFrom(this.store.select(selectFilter)),
  exhaustMap(([action, filter]) => ...)
)

// ✅ 推荐：concatLatestFrom（懒求值，只在 action 触发时读 state）
.pipe(
  concatLatestFrom(() => this.store.select(selectFilter)),
  exhaustMap(([action, filter]) => ...)
)
```

### 6. Selector 在 component 中重新创建导致 memoize 失效

```ts
// ❌ 反模式：每次渲染都创建新 selector
@Component({ ... })
export class UsersComponent {
  users$ = this.store.select(createSelector(
    state => state.users,
    users => users.filter(u => u.active)
  ));   // ❌ 每次 component 重建都新建 selector → memoize 失效
}

// ✅ 推荐：selector 在模块顶层定义
// users.selectors.ts
export const selectActiveUsers = createSelector(
  selectUsersState,
  state => state.users.filter(u => u.active)
);

// users.component.ts
users$ = this.store.select(selectActiveUsers);
```

### 7. SignalStore 中忘了 `takeUntilDestroyed`

```ts
withHooks({
  // ❌ 忘了 takeUntilDestroyed —— 内存泄漏
  onInit(store) {
    interval(1000).subscribe(() => store.increment());
  },

  // ✅ 必须 takeUntilDestroyed
  onInit(store) {
    interval(1000)
      .pipe(takeUntilDestroyed())
      .subscribe(() => store.increment());
  },
})
```

### 8. SignalStore 中 mutate state

```ts
// ❌ 反模式：直接 mutate（Signal 不会触发变化）
withMethods((store) => ({
  addBook(book: Book) {
    store.books().push(book);   // ❌ mutate 不工作
  },
}))

// ✅ 正确：用 patchState + 不可变更新
withMethods((store) => ({
  addBook(book: Book) {
    patchState(store, (state) => ({
      books: [...state.books, book],
    }));
  },
}))
```

### 9. `provideState` 重复注册同名 feature

```ts
// ❌ 反模式：两次注册 'users'
provideStore({ users: usersReducer }),
provideState({ name: 'users', reducer: usersReducer }),   // ❌ 警告
```

### 10. Action type 重复

```ts
// ❌ 两个文件都用 '[Counter] Reset'
// counter.actions.ts: export const reset = createAction('[Counter] Reset');
// game.actions.ts: export const reset = createAction('[Counter] Reset');  // ❌ 重名

// ✅ 用唯一 source 区分
// counter.actions.ts: '[Counter Page] Reset'
// game.actions.ts: '[Game Page] Reset'
```

> NgRx 默认开启 `strictActionTypeUniqueness: true` runtime check —— 重复 action type 会在开发模式抛错。

## 总结

至此你已掌握 NgRx 19 的核心 —— Actions / Reducers / Selectors / `createFeature` / Effects / `@ngrx/entity` / `@ngrx/router-store` / `@ngrx/signals` / Standalone API / 测试 / 常见踩坑。

继续阅读 [参考](./reference.md) 查看所有 API 速查 + 全 import 来源 + NgModule vs Standalone 对照。
