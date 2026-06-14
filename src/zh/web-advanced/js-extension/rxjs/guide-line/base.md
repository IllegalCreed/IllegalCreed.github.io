---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

> 版本基线 **RxJS 7.x**。本篇把「会订阅」用到「懂机制」：操作符分类、冷热 Observable、Subject 多播、以及取消订阅的几种标准模式。

## 一、操作符的两条主线

RxJS 的能力几乎都来自**操作符**。先建立分类心智：

- **创建操作符（creation）**：从无到有造出 Observable —— `of`、`from`、`fromEvent`、`interval`、`timer`、`defer`…
- **可管道操作符（pipeable）**：接收一个 Observable、返回一个**新的** Observable，用 `pipe()` 串联 —— `map`、`filter`、`switchMap`、`debounceTime`…

```ts
import { interval, map, filter, take } from 'rxjs';

interval(1000).pipe(
  map((n) => n * n),         // 变换
  filter((n) => n % 2 === 0),// 过滤
  take(3),                   // 截取（取够 3 个就 complete）
).subscribe(console.log);    // 0, 4, 16 后自动完成
```

::: tip 操作符是纯函数
pipeable 操作符**不修改源**，而是返回新 Observable（源不可变）。所以同一个源能被多条不同的链安全复用，`source$.pipe(...)` 不会改变 `source$` 自身。这是 RxJS 声明式、可测试的基础。
:::

## 二、冷 Observable vs 热 Observable

这是 RxJS 最该先理解的概念之一，本质区别在**数据生产者在「订阅内部」创建还是在「外部」共享**。

| 维度 | **冷（cold）** | **热（hot）** |
|---|---|---|
| 生产者 | 每次 `subscribe` 在内部**新建** | 在**外部**、被所有订阅者**共享** |
| 订阅者拿到的值 | 各自独立、**从头开始** | 只能收到**订阅之后**推送的值 |
| 模型 | 单播（unicast） | 多播（multicast） |
| 例子 | `of`、`from`、HTTP 请求 | `fromEvent`（DOM 事件）、`Subject` |

### 冷 Observable 的「重复执行」坑

```ts
import { defer } from 'rxjs';

const req$ = defer(() => fetch('/api/user').then((r) => r.json()));
req$.subscribe(); // 发起第 1 次请求
req$.subscribe(); // 发起第 2 次请求（各自独立！）
req$.subscribe(); // 发起第 3 次请求
```

冷 Observable 每次订阅都重跑生产逻辑，所以**订阅 3 次 = 3 次独立 HTTP 请求**。这是新手「为什么我的请求/日志跑了好几遍」的根因。要让多个订阅者**共享一次**执行，需显式多播（见下文 `share`）。

## 三、Subject：把单播变多播

普通 Observable 是单播——每个订阅者独立执行。**Subject** 既是 Observable 又是 Observer，是**多播**：它维护订阅者列表，`subject.next(v)` 会把同一个值同时推给所有订阅者。

```ts
import { Subject } from 'rxjs';

const subject = new Subject<number>();
subject.subscribe((v) => console.log('A:', v));
subject.subscribe((v) => console.log('B:', v));
subject.next(1);  // A:1  B:1  —— 同一个值多播给两个订阅者
subject.next(2);  // A:2  B:2
```

### Subject 家族对照

| 类型 | 关键特性 | 适用 |
|---|---|---|
| `Subject` | 订阅者只收**订阅之后**的值 | 事件总线 |
| `BehaviorSubject(init)` | 需初始值；新订阅者立即收**当前值**；`.value` 同步读 | **状态** |
| `ReplaySubject(n)` | 向新订阅者**重放最近 n 个**值 | 历史回放 |
| `AsyncSubject` | 仅在 **complete 时**发最后一个值 | 最终结果 |

```ts
import { BehaviorSubject } from 'rxjs';

const state$ = new BehaviorSubject(0); // 初始值 0
state$.subscribe((v) => console.log('A:', v)); // A:0（订阅即得当前值）
state$.next(1);                                 // A:1
state$.subscribe((v) => console.log('B:', v)); // B:1（拿到当前最新值）
console.log('当前：', state$.value);            // 同步读：1
```

## 四、用 share 把冷变热（共享一次执行）

```ts
import { defer, share } from 'rxjs';

const req$ = defer(() => fetch('/api/user').then((r) => r.json())).pipe(share());
req$.subscribe(); // 第一个订阅者触发唯一一次请求
req$.subscribe(); // 共享同一次请求结果，不再重复发
```

`share()` 内部用一个 Subject 多播，并按**引用计数**：第一个订阅者到来时订阅源、订阅者归零时退订源。多个订阅者只触发**一次**底层执行（一次 HTTP、一个 `interval`）。需要给后来的订阅者也补发已发生的值时，用 `shareReplay`（见进阶篇）。

## 五、取消订阅：四种标准模式

活跃订阅**不会被垃圾回收**。持续型流必须收尾，否则内存泄漏。

```ts
import { interval, take, takeUntil, Subject } from 'rxjs';

// 模式 1：手动 unsubscribe
const sub = interval(1000).subscribe(console.log);
// ...later: sub.unsubscribe();

// 模式 2：take / first 自动收尾（流自己会 complete）
interval(1000).pipe(take(5)).subscribe(console.log); // 取 5 个后自动结束

// 模式 3：takeUntil + destroy$（批量退订，组件最常用）
const destroy$ = new Subject<void>();
interval(1000).pipe(takeUntil(destroy$)).subscribe(console.log);
// 组件销毁时：destroy$.next(); destroy$.complete();  —— 一处触发、所有流退订
```

> 模式 4 是框架层：Angular 模板里的 `async` 管道会**自动订阅 + 组件销毁时自动退订**，从根本上免去手动处理。`takeUntil` 建议放在操作符链的**最后**。

## 六、终止通知契约

```text
值* (error | complete)?
```

`error` 与 `complete` 是**终止通知**：互斥、整条流只发生一次。流终止后，任何后续的 `next`/`error`/`complete` 都会被**忽略**。要在出错后继续，必须用 `catchError` 切到新流或 `retry` 重订源。此外，操作符回调里抛出的同步异常会被 RxJS 捕获、转成该流的 `error` 通知（不会冒泡成未捕获异常崩溃程序）。

---

进入 [指南 · 进阶](./advanced)：高阶映射四兄弟、组合操作符、错误处理与重试、防抖节流实战。
