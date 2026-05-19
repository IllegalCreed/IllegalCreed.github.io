---
layout: doc
outline: [2, 3]
---

# 参考

> NgRx 19.x API 速查。所有签名 / 类型 / 选项与官方文档对齐。包含 `@ngrx/store` / `@ngrx/effects` / `@ngrx/entity` / `@ngrx/router-store` / `@ngrx/signals` / `@ngrx/operators` / `@ngrx/store-devtools` 全部核心 API + Standalone API + NgModule API 对照 + Import 来源速查。

## 全部导出

### 从 `@ngrx/store`

```ts
import {
  // Actions
  createAction,
  createActionGroup,
  props,
  emptyProps,
  union,
  on,

  // Reducers
  createReducer,
  combineReducers,
  ActionReducer,
  ActionReducerMap,

  // Features
  createFeature,
  createFeatureSelector,

  // Selectors
  createSelector,
  createSelectorFactory,
  defaultMemoize,
  resultMemoize,
  defaultStateFn,

  // Store / Dispatcher
  Store,
  ScannedActionsSubject,
  ActionsSubject,
  ReducerManager,
  StateObservable,

  // Standalone API
  provideStore,
  provideState,

  // Meta-reducers
  USER_PROVIDED_META_REDUCERS,
  META_REDUCERS,

  // Action helpers
  Action,
  ActionCreator,
  ActionType,
  CreatorTypes,
  Creator,
  CreatorMap,
  TypedAction,

  // Types
  StoreModule,           // NgModule（兼容）
  StoreConfig,
  ActionReducerFactory,
  Selector,
  MemoizedSelector,
  MemoizedSelectorWithProps,
  DefaultProjectorFn,
  RuntimeChecks,
} from '@ngrx/store';
```

### 从 `@ngrx/effects`

```ts
import {
  // Effect 创建
  createEffect,
  Effect,                       // 装饰器（v11 起 deprecated）

  // Actions stream
  Actions,
  ofType,

  // Lifecycle
  EffectsModule,                // NgModule
  rootEffectsInit,
  EffectSources,
  EffectNotification,
  EffectsRunner,

  // Standalone API
  provideEffects,

  // Hooks
  OnInitEffects,
  OnRunEffects,
  OnIdentifyEffects,

  // Types
  EffectConfig,
  CreateEffectMetadata,
  FunctionalEffect,
} from '@ngrx/effects';
```

### 从 `@ngrx/entity`

```ts
import {
  // Adapter
  createEntityAdapter,

  // Types
  EntityState,
  EntityAdapter,
  EntityMap,
  EntityMapOne,
  IdSelector,
  Comparer,
  Dictionary,
  Predicate,
  Update,
  EntitySelectors,
  EntityStateAdapter,
} from '@ngrx/entity';
```

### 从 `@ngrx/router-store`

```ts
import {
  // Standalone API
  provideRouterStore,

  // NgModule
  StoreRouterConnectingModule,

  // Actions
  ROUTER_REQUEST,
  ROUTER_NAVIGATION,
  ROUTER_NAVIGATED,
  ROUTER_CANCEL,
  ROUTER_ERROR,
  routerRequestAction,
  routerNavigationAction,
  routerNavigatedAction,
  routerCancelAction,
  routerErrorAction,

  // Selectors
  getRouterSelectors,
  getSelectors,                  // 等价 getRouterSelectors（兼容）

  // Serializer
  RouterStateSerializer,
  DefaultRouterStateSerializer,
  MinimalRouterStateSerializer,
  FullRouterStateSerializer,

  // Config
  routerReducer,
  RouterAction,
  RouterReducerState,
  StoreRouterConfig,
  NavigationActionTiming,
  RouterState,
} from '@ngrx/router-store';
```

### 从 `@ngrx/signals`

```ts
import {
  // 核心 store API
  signalStore,
  signalStoreFeature,
  signalState,

  // Feature helpers
  withState,
  withMethods,
  withComputed,
  withHooks,
  withProps,
  type,

  // State helpers
  patchState,

  // Types
  SignalStore,
  SignalStoreFeature,
  SignalStoreProps,
  SignalState,
  PartialStateUpdater,
  EmptyFeatureResult,
  StateSignal,
} from '@ngrx/signals';

// Entity 子模块
import {
  withEntities,
  setAllEntities,
  setEntity,
  setEntities,
  addEntity,
  addEntities,
  upsertEntity,
  upsertEntities,
  updateEntity,
  updateEntities,
  updateAllEntities,
  removeEntity,
  removeEntities,
  removeAllEntities,

  // Types
  EntityId,
  EntityMap,
  EntityState,
  EntityIdProps,
} from '@ngrx/signals/entities';

// RxJS interop 子模块
import {
  rxMethod,

  // Types
  RxMethod,
  RxMethodRef,
} from '@ngrx/signals/rxjs-interop';
```

### 从 `@ngrx/operators`

```ts
import {
  // 响应映射
  mapResponse,
  tapResponse,

  // 状态读取
  concatLatestFrom,
} from '@ngrx/operators';
```

### 从 `@ngrx/store-devtools`

```ts
import {
  // Standalone API
  provideStoreDevtools,

  // NgModule
  StoreDevtoolsModule,

  // Config
  StoreDevtoolsConfig,
  StoreDevtoolsOptions,

  // Types
  ActionSanitizer,
  StateSanitizer,
  Predicate,
} from '@ngrx/store-devtools';
```

### 从 `@ngrx/store/testing`

```ts
import {
  // Mock store 测试
  MockStore,
  provideMockStore,
  MockReducerManager,
  MockState,
  MockSelector,
} from '@ngrx/store/testing';
```

### 从 `@ngrx/effects/testing`

```ts
import {
  // Mock effects 测试
  provideMockActions,
} from '@ngrx/effects/testing';
```

## Actions API

### `createAction`

```ts
function createAction<T extends string>(type: T): ActionCreator<T>;

function createAction<T extends string, P extends object>(
  type: T,
  config: PropsConfig<P>
): ActionCreator<T, (props: P) => P & TypedAction<T>>;

function createAction<T extends string, F extends Function>(
  type: T,
  config: F
): ActionCreator<T, F>;
```

| 参数 | 说明 |
|---|---|
| `type` | Action type 字符串（`[Source] Event Description` 格式） |
| `config` | `props<T>()` 或 factory function |

### `createActionGroup`

```ts
function createActionGroup<Source extends string, Events extends Record<string, ActionConfig>>(
  config: ActionGroupConfig<Source, Events>
): ActionGroup<Source, Events>;
```

```ts
interface ActionGroupConfig<Source, Events> {
  source: Source;
  events: Events;
}

type ActionConfig =
  | ReturnType<typeof emptyProps>
  | ReturnType<typeof props>
  | Function;
```

| 配置字段 | 说明 |
|---|---|
| `source` | Action source（不带 `[ ]`，会自动加） |
| `events` | event description → action config 映射 |

### `props<T>()` / `emptyProps()`

```ts
function props<T extends object>(): PropsConfig<T>;
function emptyProps(): EmptyPropsConfig;
```

phantom type、运行时是空对象、只用于 TS 类型推导。

### `union(actionCreators)`

```ts
function union<C extends ActionCreator[]>(...creators: C): ReturnType<C[number]>;
```

用于创建 action union 类型（罕用，`createFeature` 已自动推导）：

```ts
const allActions = union(increment, decrement, reset);
type CounterAction = typeof allActions;
```

## Reducers API

### `createReducer`

```ts
function createReducer<S, A extends Action = Action>(
  initialState: S,
  ...ons: ReducerTypes<S, ActionCreator[]>[]
): ActionReducer<S, A>;
```

```ts
const reducer = createReducer(
  initialState,
  on(actionCreator1, (state, action) => newState),
  on(actionCreator2, actionCreator3, (state, action) => newState),
);
```

### `on(actionCreator, handler)`

```ts
function on<S, AC extends ActionCreator[]>(
  ...actionsAndReducer: [...AC, OnReducer<S, AC>]
): ReducerTypes<S, AC>;

type OnReducer<S, AC extends ActionCreator[]> = (
  state: S,
  action: ReturnType<AC[number]>
) => S;
```

支持多 action 复用：

```ts
on(action1, action2, action3, (state, action) => ...)
```

### `combineReducers`

```ts
function combineReducers<S, A extends Action = Action>(
  reducers: ActionReducerMap<S, A>,
  defaultState?: S
): ActionReducer<S, A>;
```

合并多个 slice reducer（`provideStore({ slice1: reducer1, slice2: reducer2 })` 内部用此）。

## Features API

### `createFeature`

```ts
function createFeature<Name extends string, State>(
  config: FeatureConfig<Name, State>
): Feature<Name, State>;
```

```ts
interface FeatureConfig<Name, State> {
  name: Name;
  reducer: ActionReducer<State>;
  extraSelectors?: (baseSelectors: BaseSelectors) => Record<string, MemoizedSelector>;
}
```

**自动生成的导出**：

```ts
interface Feature<Name, State> {
  name: Name;
  reducer: ActionReducer<State>;
  // 每个 state key 都生成对应 selector：
  selectFeatureState: MemoizedSelector;
  selectXxx: MemoizedSelector;  // 每个 state 字段
  // 加 extraSelectors 中所有 selector
}
```

### `createFeatureSelector`

```ts
function createFeatureSelector<S>(name: string): MemoizedSelector<object, S>;
```

```ts
const selectUsersState = createFeatureSelector<UsersState>('users');
```

> **推荐用 `createFeature` 自动生成、不要手动写 `createFeatureSelector`**。

## Selectors API

### `createSelector`

```ts
function createSelector<State, Result>(
  ...args: [
    ...selectors: Selector<State, any>[],
    projector: (...values: any[]) => Result
  ]
): MemoizedSelector<State, Result>;
```

```ts
const selectDouble = createSelector(selectCount, (count) => count * 2);

const selectSummary = createSelector(
  selectCount,
  selectStatus,
  (count, status) => ({ count, status })
);
```

### `createSelectorFactory`

```ts
function createSelectorFactory(memoize: MemoizeFn): SelectorFactory;
```

自定义 memoize 策略（如 LRU、shallow equal）。

### `defaultMemoize`

默认的 memoize 实现（缓存大小 1）。

## Store API

### `Store<T>` 服务

```ts
interface Store<T = object> extends Observable<T>, Observer<Action> {
  // 选取 state
  select<K>(selector: Selector<T, K>): Observable<K>;
  select<K>(name: keyof T): Observable<T[K]>;
  select<K>(...paths: string[]): Observable<K>;

  // dispatch action
  dispatch<V extends Action>(action: V): void;

  // Store 是 Observable，可以直接 pipe
  pipe<R>(...operators: OperatorFunction[]): Observable<R>;

  // 添加 / 移除 reducer
  addReducer<S, A extends Action>(key: string, reducer: ActionReducer<S, A>): void;
  removeReducer<K extends keyof T>(key: K): void;
}
```

```ts
const store = inject(Store);

// 1. 用 selector
store.select(counterFeature.selectCount).subscribe(count => ...);

// 2. 用字符串路径（不推荐，丢类型）
store.select('counter', 'count').subscribe(count => ...);

// 3. dispatch
store.dispatch(increment());

// 4. pipe（store 本身是 Observable）
store.pipe(
  select(counterFeature.selectCount),
  filter(count => count > 0),
).subscribe(count => ...);
```

## Effects API

### `createEffect`

```ts
// Class-based
function createEffect<C extends EffectConfig>(
  source: () => Observable<Action> | Observable<unknown>,
  config?: C
): C['dispatch'] extends false ? Observable<unknown> : Observable<Action>;

// Functional
function createEffect<C extends EffectConfig & { functional: true }>(
  source: () => Observable<Action> | Observable<unknown>,
  config: C
): FunctionalEffect;
```

```ts
interface EffectConfig {
  dispatch?: boolean;          // 默认 true：返回的 action 自动 dispatch
  functional?: boolean;        // 默认 false：是否为 functional effect
  useEffectsErrorHandler?: boolean;  // 默认 true：是否用全局 error handler
}
```

### `Actions`

```ts
class Actions<V extends Action = Action> extends Observable<V> {
  constructor(source?: Observable<V>);
}
```

所有 dispatched action 都流过 `Actions`——effect 通过 `ofType` 过滤。

### `ofType`

```ts
function ofType<AC extends ActionCreator[]>(
  ...allowedTypes: AC
): OperatorFunction<Action, ReturnType<AC[number]>>;

function ofType<T extends string>(...allowedTypes: T[]): OperatorFunction<Action, Action>;
```

```ts
this.actions$.pipe(ofType(loadUsers, refreshUsers))
this.actions$.pipe(ofType('[Users] Load', '[Users] Refresh'))  // 也支持
```

### Effect Lifecycle Hooks

```ts
interface OnInitEffects {
  ngrxOnInitEffects(): Action;    // effects 注册后立即 dispatch 该 action
}

interface OnRunEffects {
  ngrxOnRunEffects(resolvedEffects$: Observable<EffectNotification>): Observable<EffectNotification>;
  // 用于在 effect 运行前 / 后做拦截（如登录前暂停 effect）
}

interface OnIdentifyEffects {
  ngrxOnIdentifyEffects(): string;   // 自定义 effect instance 标识符
}
```

## Entity API

### `createEntityAdapter`

```ts
function createEntityAdapter<T>(options?: {
  selectId?: IdSelector<T>;        // 默认 (entity) => entity.id
  sortComparer?: false | Comparer<T>;
}): EntityAdapter<T>;
```

### `EntityAdapter<T>` 全方法

```ts
interface EntityAdapter<T> {
  // 初始化
  getInitialState(): EntityState<T>;
  getInitialState<S extends object>(state: S): EntityState<T> & S;

  // 增（已存在 ID 则忽略）
  addOne(entity: T, state: EntityState<T>): EntityState<T>;
  addMany(entities: T[], state: EntityState<T>): EntityState<T>;

  // 设置（已存在 ID 则替换）
  setOne(entity: T, state: EntityState<T>): EntityState<T>;
  setMany(entities: T[], state: EntityState<T>): EntityState<T>;
  setAll(entities: T[], state: EntityState<T>): EntityState<T>;

  // 合并（存在则浅合并、不存在则添加）
  upsertOne(entity: T, state: EntityState<T>): EntityState<T>;
  upsertMany(entities: T[], state: EntityState<T>): EntityState<T>;

  // 更新（按 ID 局部修改）
  updateOne(update: Update<T>, state: EntityState<T>): EntityState<T>;
  updateMany(updates: Update<T>[], state: EntityState<T>): EntityState<T>;

  // 转换
  mapOne(map: EntityMapOne<T>, state: EntityState<T>): EntityState<T>;
  map(map: EntityMap<T>, state: EntityState<T>): EntityState<T>;

  // 删除
  removeOne(id: string | number, state: EntityState<T>): EntityState<T>;
  removeMany(ids: (string | number)[], state: EntityState<T>): EntityState<T>;
  removeMany(predicate: Predicate<T>, state: EntityState<T>): EntityState<T>;
  removeAll(state: EntityState<T>): EntityState<T>;

  // Selectors
  getSelectors(): {
    selectIds: (state: EntityState<T>) => (string | number)[];
    selectEntities: (state: EntityState<T>) => Dictionary<T>;
    selectAll: (state: EntityState<T>) => T[];
    selectTotal: (state: EntityState<T>) => number;
  };
  getSelectors<V>(
    selectState: (state: V) => EntityState<T>
  ): { selectIds, selectEntities, selectAll, selectTotal };
}
```

### `EntityState<T>`

```ts
interface EntityState<T> {
  ids: (string | number)[];
  entities: { [id: string | number]: T };
}
```

### `Update<T>`

```ts
interface Update<T> {
  id: string | number;
  changes: Partial<T>;
}
```

## Router Store API

### `provideRouterStore`

```ts
function provideRouterStore(config?: StoreRouterConfig): EnvironmentProviders;
```

```ts
interface StoreRouterConfig {
  stateKey?: string;                            // 默认 'router'
  serializer?: Type<RouterStateSerializer>;    // 默认 DefaultRouterStateSerializer
  routerState?: RouterState;                   // RouterState enum
  navigationActionTiming?: NavigationActionTiming;
}

enum RouterState {
  Full = 0,         // 完整 router state
  Minimal = 1,      // 最小 router state（推荐，可序列化）
}
```

### `getRouterSelectors`

```ts
function getRouterSelectors(): {
  selectCurrentRoute: MemoizedSelector;
  selectFragment: MemoizedSelector;
  selectQueryParams: MemoizedSelector;
  selectQueryParam: (param: string) => MemoizedSelector;
  selectRouteParams: MemoizedSelector;
  selectRouteParam: (param: string) => MemoizedSelector;
  selectRouteData: MemoizedSelector;
  selectRouteDataParam: (param: string) => MemoizedSelector;
  selectUrl: MemoizedSelector;
  selectTitle: MemoizedSelector;
};
```

### Router Actions

```ts
// 派发的 action（自动 dispatch、不需要手写）：
ROUTER_REQUEST       // 'ROUTER_REQUEST'      — 导航请求开始
ROUTER_NAVIGATION    // 'ROUTER_NAVIGATION'   — 导航执行中（guard 之后）
ROUTER_NAVIGATED     // 'ROUTER_NAVIGATED'    — 导航完成
ROUTER_CANCEL        // 'ROUTER_CANCEL'       — 导航被取消
ROUTER_ERROR         // 'ROUTER_ERROR'        — 导航错误

// 在 effect 中匹配（用 action creator）：
ofType(routerNavigatedAction)
ofType(routerRequestAction)
// 等
```

## `@ngrx/signals` API

### `signalStore`

```ts
function signalStore<Features extends SignalStoreFeature[]>(
  ...features: Features
): SignalStoreClass<Features>;

function signalStore<Features extends SignalStoreFeature[]>(
  config: { providedIn: 'root' | 'platform' },
  ...features: Features
): SignalStoreClass<Features>;
```

### `withState`

```ts
function withState<State extends object>(
  state: State | (() => State)
): SignalStoreFeature;
```

```ts
withState({ count: 0, name: 'Alice' })
withState(() => ({ count: 0, name: 'Alice' }))  // factory 形式
```

### `withMethods`

```ts
function withMethods<Methods extends object>(
  factory: (store: SignalStore) => Methods
): SignalStoreFeature;
```

```ts
withMethods((store) => ({
  increment(): void {
    patchState(store, (state) => ({ count: state.count + 1 }));
  },
}))
```

### `withComputed`

```ts
function withComputed<Computed extends object>(
  factory: (store: SignalStore) => Computed
): SignalStoreFeature;
```

```ts
withComputed(({ count }) => ({
  doubled: computed(() => count() * 2),
}))
```

### `withHooks`

```ts
function withHooks(hooks: {
  onInit?: (store: SignalStore) => void;
  onDestroy?: (store: SignalStore) => void;
}): SignalStoreFeature;

// 也支持 factory 签名：
function withHooks<Hooks>(
  factory: (store: SignalStore) => {
    onInit?: () => void;
    onDestroy?: () => void;
  }
): SignalStoreFeature;
```

### `withProps`

```ts
function withProps<Props extends object>(
  factory: (store: SignalStore) => Props
): SignalStoreFeature;
```

```ts
withProps(() => ({
  service: inject(MyService),
  logger: inject(Logger),
}))
```

### `withEntities`

```ts
function withEntities<E extends { id: EntityId }>(
  config?: { entity: E; collection?: string }
): SignalStoreFeature;
```

```ts
// 默认 collection
withEntities<Todo>()
// 暴露：ids / entityMap / entities

// 命名 collection
withEntities({ entity: type<Book>(), collection: 'books' })
// 暴露：bookIds / bookEntityMap / books
```

### Entity helpers（用于 patchState）

```ts
// 全替换
setAllEntities<E>(entities: E[], config?: SelectEntityId): EntityUpdater;

// 单个 / 多个
setEntity<E>(entity: E, config?: SelectEntityId): EntityUpdater;
setEntities<E>(entities: E[], config?: SelectEntityId): EntityUpdater;

// 添加
addEntity<E>(entity: E, config?: SelectEntityId): EntityUpdater;
addEntities<E>(entities: E[], config?: SelectEntityId): EntityUpdater;

// 合并
upsertEntity<E>(entity: E, config?: SelectEntityId): EntityUpdater;
upsertEntities<E>(entities: E[], config?: SelectEntityId): EntityUpdater;

// 更新
updateEntity<E>(update: EntityUpdate<E>): EntityUpdater;
updateEntities<E>(updates: EntityUpdate<E>[]): EntityUpdater;
updateAllEntities<E>(changes: Partial<E>): EntityUpdater;

// 删除
removeEntity(id: EntityId): EntityUpdater;
removeEntities(ids: EntityId[]): EntityUpdater;
removeAllEntities(): EntityUpdater;
```

### `signalState`

```ts
function signalState<State extends object>(
  state: State
): SignalState<State>;
```

不需要完整 store、只想要 reactive state 的简化版。

### `patchState`

```ts
function patchState<State>(
  store: SignalStore<State> | SignalState<State>,
  ...updaters: (Partial<State> | ((state: State) => Partial<State>) | EntityUpdater)[]
): void;
```

### `signalStoreFeature`

```ts
function signalStoreFeature<Features extends SignalStoreFeature[]>(
  ...features: Features
): SignalStoreFeature;

// 带 input requirements：
function signalStoreFeature<Input, Features extends SignalStoreFeature[]>(
  input: Input,
  ...features: Features
): SignalStoreFeature;
```

### `rxMethod`

```ts
function rxMethod<Input>(
  generator: (source$: Observable<Input>) => Observable<unknown>
): RxMethod<Input>;
```

```ts
const loadUsers = rxMethod<string>(
  pipe(
    debounceTime(300),
    switchMap((query) => http.get(`/api/users?q=${query}`))
  )
);

// 调用：
loadUsers('alice');         // 静态值
loadUsers(querySignal);     // Signal（自动追踪变化）
loadUsers(query$);          // Observable
```

## `@ngrx/operators`

### `mapResponse`

```ts
function mapResponse<T, V extends Action, E = unknown>(
  observer: {
    next: (value: T) => V | V[];
    error: (error: E) => V | V[] | void;
    complete?: () => V | V[] | void;
  }
): OperatorFunction<T, V>;
```

```ts
http.get<User[]>('/api/users').pipe(
  mapResponse({
    next: (users) => loadUsersSuccess({ users }),
    error: (error) => loadUsersFailure({ error: error.message }),
  })
)
```

### `tapResponse`

```ts
function tapResponse<T, E = unknown>(observer: {
  next: (value: T) => void;
  error: (error: E) => void;
  complete?: () => void;
  finalize?: () => void;
}): MonoTypeOperatorFunction<T>;
```

用于 ComponentStore / SignalStore 的 `rxMethod` 中（不返回新值）：

```ts
this.http.get<User[]>('/api/users').pipe(
  tapResponse({
    next: (users) => patchState(store, { users, isLoading: false }),
    error: () => patchState(store, { isLoading: false }),
  })
)
```

### `concatLatestFrom`

```ts
function concatLatestFrom<T extends unknown, O extends ObservableInput<unknown>[]>(
  observablesFactory: (value: T) => [...O] | O[number]
): OperatorFunction<T, [T, ...UnwrapObservable<O>]>;
```

懒求值的 `withLatestFrom` 替代——只在 action 触发时读 state：

```ts
.pipe(
  ofType(loadDetails),
  concatLatestFrom(() => store.select(selectFilter)),
  exhaustMap(([action, filter]) => ...)
)
```

## Standalone API

### `provideStore`

```ts
function provideStore<T extends Record<string, ActionReducer>>(
  reducers?: ActionReducerMap<T> | InjectionToken<ActionReducerMap<T>>,
  config?: RootStoreConfig<T>
): EnvironmentProviders;
```

```ts
interface RootStoreConfig<T> {
  initialState?: InitialState<T>;
  reducerFactory?: ActionReducerFactory<T>;
  metaReducers?: MetaReducer<T>[];
  runtimeChecks?: RuntimeChecks;
}

interface RuntimeChecks {
  strictStateImmutability?: boolean;
  strictActionImmutability?: boolean;
  strictStateSerializability?: boolean;
  strictActionSerializability?: boolean;
  strictActionWithinNgZone?: boolean;
  strictActionTypeUniqueness?: boolean;
}
```

### `provideState`

```ts
// 1. 用 createFeature 对象
function provideState<F extends Feature>(feature: F): EnvironmentProviders;

// 2. 用 name + reducer
function provideState<T>(name: string, reducer: ActionReducer<T>): EnvironmentProviders;

// 3. 用配置对象
function provideState<T>(config: {
  name: string;
  reducer: ActionReducer<T>;
}): EnvironmentProviders;
```

### `provideEffects`

```ts
// 1. Class-based effects 数组
function provideEffects(effects: Type<unknown>[]): EnvironmentProviders;

// 2. Functional effects 对象
function provideEffects(effects: Record<string, FunctionalEffect>): EnvironmentProviders;
```

### `provideStoreDevtools`

```ts
function provideStoreDevtools(
  config?: StoreDevtoolsOptions
): EnvironmentProviders;
```

```ts
interface StoreDevtoolsOptions {
  maxAge?: number | false;
  logOnly?: boolean;
  autoPause?: boolean;
  trace?: boolean | (() => string);
  traceLimit?: number;
  connectInZone?: boolean;
  features?: {
    pause: boolean;
    lock: boolean;
    persist: boolean;
    export: boolean;
    import: string | boolean;
    jump: boolean;
    skip: boolean;
    reorder: boolean;
    dispatch: boolean;
    test: boolean;
  };
  actionsBlocklist?: string[];
  actionsSafelist?: string[];
  predicate?: (state: unknown, action: Action) => boolean;
  actionSanitizer?: ActionSanitizer;
  stateSanitizer?: StateSanitizer;
}
```

### `provideRouterStore`

```ts
function provideRouterStore(config?: StoreRouterConfig): EnvironmentProviders;
```

## Testing API

### `MockStore` + `provideMockStore`

```ts
function provideMockStore<T>(config?: MockStoreConfig<T>): Provider[];

interface MockStoreConfig<T> {
  initialState?: T;
  selectors?: MockSelector[];
}

interface MockSelector {
  selector: MemoizedSelector | string;
  value: unknown;
}

class MockStore<T> extends Store<T> {
  setState(state: T): void;
  overrideSelector<R>(selector: MemoizedSelector<T, R>, value: R): void;
  resetSelectors(): void;
  refreshState(): void;
  scannedActions$: Observable<Action>;
}
```

```ts
// 测试中：
const store = TestBed.inject(MockStore);
store.setState({ counter: { count: 42 } });
store.overrideSelector(selectCount, 42);

// 验证 dispatch
const spy = jest.spyOn(store, 'dispatch');
store.dispatch(increment());
expect(spy).toHaveBeenCalledWith(increment());
```

### `provideMockActions`

```ts
function provideMockActions(source: () => Observable<unknown>): Provider[];
```

```ts
let actions$: Observable<Action>;

TestBed.configureTestingModule({
  providers: [
    UsersEffects,
    provideMockActions(() => actions$),
  ],
});

actions$ = of(UsersPageActions.load());
effects.loadUsers$.subscribe(...);
```

## NgModule API（兼容）

虽然推荐 Standalone API、但 NgModule API 仍完全支持：

```ts
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { StoreRouterConnectingModule } from '@ngrx/router-store';

@NgModule({
  imports: [
    // 根部
    StoreModule.forRoot({ counter: counterReducer }),
    EffectsModule.forRoot([UsersEffects]),
    StoreDevtoolsModule.instrument({ maxAge: 25 }),
    StoreRouterConnectingModule.forRoot(),

    // Feature
    StoreModule.forFeature('users', usersReducer),
    EffectsModule.forFeature([ProductsEffects]),
  ],
})
export class AppModule {}
```

### NgModule vs Standalone 对照

| NgModule | Standalone |
|---|---|
| `StoreModule.forRoot({ ... })` | `provideStore({ ... })` |
| `StoreModule.forFeature(name, reducer)` | `provideState(name, reducer)` |
| `EffectsModule.forRoot([...])` | `provideEffects([...])` |
| `EffectsModule.forFeature([...])` | `provideEffects([...])`（多次调用累加） |
| `StoreDevtoolsModule.instrument({ ... })` | `provideStoreDevtools({ ... })` |
| `StoreRouterConnectingModule.forRoot()` | `provideRouterStore()` |

## v18 → v19 迁移要点

### 1. Angular 18+ 要求

NgRx 19 要求 Angular 18+（推荐 19+）、TypeScript 5.4+。

### 2. SignalStore 改进

- **`withProps`** 新功能：分组依赖注入
- **`signalStoreFeature` input typing** 改进
- **`withHooks` factory signature** 支持依赖注入

### 3. Functional Effects 稳定

```ts
// v17+ 已可用、v19 完全稳定
export const loadUsers$ = createEffect(
  (actions$ = inject(Actions), http = inject(HttpClient)) => { ... },
  { functional: true }
);
```

### 4. ComponentStore 维护模式

NgRx 17+ 起 `@ngrx/component-store` 进入**维护模式**——新项目用 `@ngrx/signals` 的 SignalStore 替代。

详细变更：[NgRx v19 迁移指南](https://ngrx.io/guide/migration/v19)。

## Import 来源速查

| 想要 | 从哪里 import |
|---|---|
| Actions / Reducers 核心 | `@ngrx/store` |
| `createFeature` / `createSelector` | `@ngrx/store` |
| `Store` 服务 / `provideStore` / `provideState` | `@ngrx/store` |
| Effects (`createEffect` / `Actions` / `ofType`) | `@ngrx/effects` |
| `provideEffects` | `@ngrx/effects` |
| Entity 全套 | `@ngrx/entity` |
| Router store 全套 | `@ngrx/router-store` |
| SignalStore 核心 (`signalStore` / `withXxx`) | `@ngrx/signals` |
| SignalStore Entity | `@ngrx/signals/entities` |
| SignalStore RxJS interop (`rxMethod`) | `@ngrx/signals/rxjs-interop` |
| `mapResponse` / `tapResponse` / `concatLatestFrom` | `@ngrx/operators` |
| DevTools | `@ngrx/store-devtools` |
| Mock Store 测试 | `@ngrx/store/testing` |
| Mock Actions 测试 | `@ngrx/effects/testing` |

## 完整 import 示例

```ts
// 1. Global Store 完整 import
import {
  createAction,
  createActionGroup,
  createReducer,
  createFeature,
  createSelector,
  createFeatureSelector,
  combineReducers,
  on,
  props,
  emptyProps,
  Store,
  provideStore,
  provideState,
  MemoizedSelector,
  ActionCreator,
  ActionReducer,
} from '@ngrx/store';

// 2. Effects 完整 import
import {
  Actions,
  ofType,
  createEffect,
  provideEffects,
  EffectConfig,
  OnInitEffects,
} from '@ngrx/effects';

// 3. Entity 完整 import
import {
  createEntityAdapter,
  EntityState,
  EntityAdapter,
  Update,
  EntityMap,
  Dictionary,
} from '@ngrx/entity';

// 4. Router Store 完整 import
import {
  provideRouterStore,
  getRouterSelectors,
  routerNavigatedAction,
  routerRequestAction,
  RouterReducerState,
  MinimalRouterStateSerializer,
} from '@ngrx/router-store';

// 5. SignalStore 完整 import
import {
  signalStore,
  signalStoreFeature,
  signalState,
  withState,
  withMethods,
  withComputed,
  withHooks,
  withProps,
  patchState,
  type,
} from '@ngrx/signals';

import {
  withEntities,
  setAllEntities,
  addEntity,
  updateEntity,
  removeEntity,
} from '@ngrx/signals/entities';

import { rxMethod } from '@ngrx/signals/rxjs-interop';

// 6. Operators
import {
  mapResponse,
  tapResponse,
  concatLatestFrom,
} from '@ngrx/operators';

// 7. DevTools
import {
  provideStoreDevtools,
  StoreDevtoolsConfig,
} from '@ngrx/store-devtools';

// 8. Testing
import {
  MockStore,
  provideMockStore,
} from '@ngrx/store/testing';

import { provideMockActions } from '@ngrx/effects/testing';
```

## 完整 standalone app.config.ts 模板

```ts
import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideRouterStore } from '@ngrx/router-store';

import { routes } from './app.routes';
import { counterFeature } from './counter/counter.feature';
import { usersFeature } from './users/users.feature';
import * as UsersEffects from './users/users.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    // Angular 基础
    provideRouter(routes),
    provideHttpClient(),

    // NgRx Global Store
    provideStore({
      [counterFeature.name]: counterFeature.reducer,
      [usersFeature.name]: usersFeature.reducer,
    }, {
      runtimeChecks: {
        strictStateImmutability: true,
        strictActionImmutability: true,
        strictStateSerializability: true,
        strictActionSerializability: true,
        strictActionTypeUniqueness: true,
      },
    }),

    // Effects（functional + class 都可以）
    provideEffects(UsersEffects),

    // Router Store
    provideRouterStore(),

    // DevTools
    provideStoreDevtools({
      maxAge: 25,
      logOnly: !isDevMode(),
      autoPause: true,
    }),

    // SignalStore（如果用）—— providedIn: 'root' 的 store 不需要在这里注册
  ],
};
```

至此 NgRx 参考全部完成——覆盖 Global Store 全 API + SignalStore 全 API + Standalone + NgModule + 测试 + Import 来源。返回 [入门](./getting-started.md) 或 [指南](./guide-line.md) 重温具体用法。
