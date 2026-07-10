---
layout: doc
outline: [2, 3]
---

# 入门

> 本篇带你从零理解 **RxJS** 的核心三件套与第一条数据流。版本基线 **RxJS 7.8.2**（操作符已扁平导出到 `'rxjs'`，`toPromise` 已废弃）。对比对象：Promise / async-await、EventEmitter。

## 速查

- 安装：`pnpm add rxjs`（或 `npm i rxjs`），开箱即用，零运行时配置
- 创建源：`of(1,2,3)` ｜ `from([...]|promise)` ｜ `fromEvent(el,'click')` ｜ `interval(1000)` ｜ `timer(0,1000)`
- 组合操作：`source$.pipe(map(...), filter(...))` —— 用 `pipe()` 串 **pipeable 操作符**
- 消费：`const sub = source$.subscribe({ next, error, complete })`
- 取消：`sub.unsubscribe()` 会执行 teardown；是否中止底层 I/O 取决于源是否实现取消
- 转 Promise：`await firstValueFrom(obs)` / `await lastValueFrom(obs)`（**取代** `toPromise()`）
- `lastValueFrom` 只用于确定会 complete 的源；否则 Promise 会一直挂起
- 核心认知：Observable **惰性**（订阅才执行）、默认**单播**（每次订阅独立执行一次副作用）
- 导入：`import { of, map, filter } from 'rxjs'`（7.x 扁平导入）；`rxjs/ajax`、`rxjs/testing` 等仍是子路径

## 一、RxJS 是什么

RxJS 是 JavaScript 的**响应式编程**库。它的核心抽象 **Observable** 是「一个惰性的、可随时间推送 0 到 N 个值的集合」。用一句话类比：**Observable 就像一个能在未来不断「推」给你多个值的函数**。

它和你熟悉的异步原语的关系：

| 维度 | 函数 / Iterator | Promise | Observable |
|---|---|---|---|
| 取值方式 | Pull（你主动调用取值） | Push（它推给你） | Push（它推给你） |
| 值的数量 | 单个返回（Iterator 多个，需主动拉） | **0 或 1 个** | **0 到 N 个** |
| 惰性 | 调用才执行 | **创建即执行**（急切） | **订阅才执行**（惰性） |
| 可取消 | — | Promise 本身不可取消 | **可退订**；底层工作是否取消取决于 teardown |

> 一句话：Observable = 「**多值 + 可退订 + 惰性**」的 Push 流。退订一定会停止向当前观察者投递，但只有源注册了有效 teardown，才会进一步中止定时器、事件监听或网络请求。

## 二、三件套：Observable / Observer / Subscription

```ts
import { Observable } from 'rxjs';

// 1) Observable：定义「如何产生值」的生产函数（订阅前不执行）
const obs$ = new Observable<number>((subscriber) => {
  subscriber.next(1);
  subscriber.next(2);
  subscriber.next(3);
  subscriber.complete();           // 终止通知
});

// 2) Observer：接收通知的回调对象（next / error / complete）
const observer = {
  next: (v: number) => console.log('值', v),
  error: (e: unknown) => console.error('出错', e),
  complete: () => console.log('完成'),
};

// 3) Subscription：subscribe 的返回值，用于取消
const subscription = obs$.subscribe(observer);
subscription.unsubscribe();        // 取消执行、释放资源
```

三个概念各司其职：

- **Observable**：值的「生产者」蓝图，惰性。
- **Observer**：值的「消费者」，是一个含 `next`/`error`/`complete` 的对象；`error` 与 `complete` 互斥且各至多一次（终止通知）。
- **Subscription**：一次「正在进行的执行」的句柄，`unsubscribe()` 关闭订阅并执行清理逻辑。

## 三、惰性与执行顺序

Observable **不一定异步**。下面的生产函数是同步的：

```ts
import { Observable } from 'rxjs';

const obs$ = new Observable((s) => { s.next(1); s.next(2); s.complete(); });
console.log('A');
obs$.subscribe((v) => console.log(v));   // 同步执行 next
console.log('B');
// 打印顺序：A → 1 → 2 → B
```

要点：① **订阅前生产函数不执行**（惰性）；② 同步发值时 `subscribe` 同步跑完。把值放进 `setTimeout` 才会变异步（`A B 1 2`）。

## 四、第一条「真实」数据流：pipe + 操作符

```ts
import { of, map, filter } from 'rxjs';

of(1, 2, 3, 4, 5)
  .pipe(
    filter((x) => x % 2 === 1),   // 只放行奇数：1,3,5
    map((x) => x * 10),           // 逐值变换：10,30,50
  )
  .subscribe((v) => console.log(v)); // 10 30 50
```

`pipe()` 把一串 **pipeable 操作符**（纯函数）组合到源上。操作符不修改源，而是**返回一个新的 Observable**——所以同一个源可被多条链安全复用。

## 五、从事件源到流

```ts
import { fromEvent, map, debounceTime, distinctUntilChanged } from 'rxjs';

const input = document.querySelector('input')!;
const term$ = fromEvent(input, 'input').pipe(
  map((e) => (e.target as HTMLInputElement).value),
  debounceTime(300),            // 用户停手 300ms 才发
  distinctUntilChanged(),       // 与上次相同则忽略
);
const sub = term$.subscribe((term) => console.log('搜索：', term));
// 组件销毁时：sub.unsubscribe();
```

`fromEvent` 内部 `addEventListener`，并在 `unsubscribe` 时自动 `removeEventListener`，是处理 UI 事件流的标准入口。

## 六、与 Promise / async-await 互操作

```ts
import { firstValueFrom, lastValueFrom, from, of } from 'rxjs';

// Observable → Promise（取代已废弃的 toPromise）
const first = await firstValueFrom(of(1, 2, 3));   // 1（拿到第一个值即 resolve）
const last  = await lastValueFrom(of(1, 2, 3));    // 3（complete 时用最后一个值 resolve）

// Promise → Observable
from(fetch('/api').then((r) => r.json())).subscribe((data) => console.log(data));
```

> ⚠️ 空流（不发值就 complete）时，`firstValueFrom`/`lastValueFrom` 会 **reject 一个 `EmptyError`**；可传 `{ defaultValue }` 兜底。`lastValueFrom` 还要求源最终 complete，否则 Promise 会一直挂起并保留 async 函数状态。另一个常见误区是：`from(fetch(...))` 只适配 Promise，退订**不会**中止底层 fetch；需要可中止请求时用 `rxjs/fetch` 的 `fromFetch`（配合 `selector` 消费响应体）。

## 七、第一个内存泄漏陷阱

```ts
import { interval } from 'rxjs';

const sub = interval(1000).subscribe((n) => console.log(n));
// interval 永不自动 complete！若不退订，回调会一直跑、持有闭包资源
// 正确收尾：组件销毁时 sub.unsubscribe();
```

**核心认知**：当长生命周期源仍持有订阅者时，订阅者及其闭包不能被回收。持续型流（`interval`、`fromEvent`、长生命周期 `Subject`）必须显式收尾——手动 `unsubscribe`、`takeUntil(destroy$)`、`take/first` 自动收尾，或使用框架的生命周期能力。

---

掌握三件套后，进入 [指南 · 基础](./guide-line/base)：操作符分类、冷热 Observable、Subject 多播、取消订阅模式。
