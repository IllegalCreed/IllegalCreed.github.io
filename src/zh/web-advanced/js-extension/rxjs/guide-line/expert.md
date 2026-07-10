---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

> 版本基线 **RxJS 7.8.2**。深入内核：调度器与执行时机、多播底层、`TestScheduler` 弹珠测试、自定义 pipeable 操作符、内存泄漏防治，以及迁移与弃用时间线。

## 速查

- `subscribeOn` 控制订阅起点，`observeOn` 控制其后的通知投递；Scheduler 不提供真正并行
- `shareReplay({ bufferSize: 1, refCount: false })` 会在零订阅者后继续连接未完成源；按生命周期选择 `refCount`
- `connectable()` 需显式 `connect()`；返回的连接 Subscription 也要纳入生命周期管理
- 时间流测试用 `TestScheduler.run()`，不要让真实定时器拖慢测试
- 自定义操作符优先组合现有 pipeable 操作符；手写 Observable 时必须返回 teardown
- `finalize` 在 complete、error、主动退订三种路径都会运行，适合统一释放资源
- `toPromise` / 位置参数 `subscribe` 计划 v8 移除；`retryWhen` 计划 v9 或 v10 移除

## 一、Scheduler：控制执行时机

Scheduler **不改变值的内容，只控制「订阅何时开始」与「通知何时投递」的执行上下文与时机**——即「什么时候、在哪种执行队列上跑」。

| 调度器 | 底层机制 | 用途 |
|---|---|---|
| `asyncScheduler` | `setTimeout`/`setInterval`（宏任务） | 基于时间的延迟（时间操作符默认） |
| `asapScheduler` | 微任务队列 | 尽快异步，比 setTimeout 早 |
| `queueScheduler` | 当前同步队列 | 递归调度时排队，防栈溢出 |
| `animationFrameScheduler` | `requestAnimationFrame` | 动画 |
| `VirtualTimeScheduler` / `TestScheduler` | 虚拟时钟 | 测试时把时间同步化 |

```ts
import { of, observeOn, subscribeOn, asyncScheduler } from 'rxjs';

of(1, 2, 3).pipe(observeOn(asyncScheduler)).subscribe(console.log);
// 「just after subscribe」会先打印，1/2/3 被异步投递到下一个宏任务
```

- `subscribeOn(sch)`：决定**订阅 / 生产开始**在哪个调度器执行（影响整链起点，一条链一个即可，放哪都作用于源）。
- `observeOn(sch)`：决定**其位置之后的下游通知投递**在哪个调度器执行（可放链中任意处，只影响下游）。

::: warning 调度器调时机，不调线程
JS 是单线程，Scheduler **不能把同步代码变成真正并行**。可用 `asyncScheduler` 把发值切片成异步任务、让出主线程，缓解卡顿；但 CPU 密集计算仍在主线程跑。真正并行需 **Web Worker**。
:::

## 二、多播内核：从 share 到 connectable

`share()` / `shareReplay()` 是日常多播首选。需要**精确控制多播开始时机**时，用 `connectable`：

```ts
import { connectable, Subject, interval, take } from 'rxjs';

const source$ = connectable(interval(1000).pipe(take(3)), {
  connector: () => new Subject(),
});
source$.subscribe((v) => console.log('A:', v));
source$.subscribe((v) => console.log('B:', v));
// 此时源还没开始执行！
const connection = source$.connect(); // 显式开闸，A、B 同时从头收到 0,1,2
// 提前停止共享执行时：connection.unsubscribe()
```

`connectable` 让你「先把所有订阅者接好，再统一 `connect()` 开闸」，避免早订阅者错过值。它是已废弃的 `multicast()` / `ConnectableObservable` 系列的现代替代。

> `shareReplay({ bufferSize: 1, refCount: true })` 是缓存 HTTP 响应的常用配方：一次请求、结果共享并对后续订阅者重放。注意 `refCount: false` + 源不 complete 时会**一直保活**，可能内存泄漏。

## 三、TestScheduler：弹珠测试

测试基于时间的流（`debounceTime`、`interval`）不应真的 `setTimeout` 等待。RxJS 提供 **`TestScheduler`**（`rxjs/testing`）+ **弹珠图**，把时间虚拟化、同步执行：

```ts
import { TestScheduler } from 'rxjs/testing';
import { throttleTime } from 'rxjs';

const scheduler = new TestScheduler((actual, expected) => {
  expect(actual).toEqual(expected); // 接入你的断言库
});

it('throttleTime', () => {
  scheduler.run(({ cold, time, expectObservable }) => {
    const source = ' -a--b--c---|';
    const t = time('   ---|       '); // t = 3 帧
    const expected = '-a-----c---|';
    expectObservable(cold(source).pipe(throttleTime(t))).toBe(expected);
  });
});
```

弹珠语法：`-` = 一帧时间流逝；字母/数字 = 发出一个值；`|` = complete；`#` = error；`()` = 同帧分组；`^` = hot Observable 的订阅点。在 `run()` 回调里，所有基于 `asyncScheduler` 的时间操作都被虚拟时钟接管。

## 四、自定义 pipeable 操作符

一个 pipeable 操作符就是「**接收源 Observable、返回新 Observable 的函数**」：`(source) => Observable`。推荐用现有操作符通过独立 `pipe` 组合，而非手写底层 `subscriber`：

```ts
import { pipe, filter, map, type Observable } from 'rxjs';

// 用组合实现：只取偶数并翻倍
const evenDouble = () =>
  pipe(
    filter((x: number) => x % 2 === 0),
    map((x) => x * 2),
  );

source$.pipe(evenDouble()).subscribe(console.log);
```

> 独立 `pipe(...ops)` 做**函数组合**（把多个操作符组成一个可复用操作符），与具体 Observable 解耦；实例 `source$.pipe(...)` 则是直接应用到某条流。

## 五、内存泄漏防治清单

| 隐患 | 防治 |
|---|---|
| 持续型流（`interval`/`fromEvent`）忘退订 | `takeUntil(destroy$)` / `take` / 手动 `unsubscribe` |
| 长生命周期 `Subject` 持有未退订的订阅者 | 订阅方用 `takeUntil` 退订；对外用 `asObservable()` 暴露只读 |
| `shareReplay` 源不 complete + `refCount:false` | 用 `refCount:true` 或确保源会终止 |
| 嵌套订阅（subscribe 里再 subscribe） | 改用高阶映射 `switchMap`/`mergeMap`，自动管理内层退订 |
| Angular 组件 | 优先模板 `async` 管道；或 `takeUntilDestroyed()` |

```ts
import { Subject, interval, takeUntil } from 'rxjs';

class Component {
  private destroy$ = new Subject<void>();
  init() {
    interval(1000).pipe(takeUntil(this.destroy$)).subscribe(/* ... */);
    // 多条业务流都 pipe(takeUntil(this.destroy$))
  }
  onDestroy() {
    this.destroy$.next();      // 一处触发，批量退订
    this.destroy$.complete();
  }
}
```

## 六、迁移与弃用时间线

| 变更 | 说明 |
|---|---|
| **扁平导入** | 操作符与创建函数从 `'rxjs'` 直接导出；`'rxjs/operators'` 仍可用但非首选 |
| **`toPromise()` 废弃** | 改用 `firstValueFrom`/`lastValueFrom`；空流 **reject `EmptyError`**（旧版 resolve `undefined`），计划 v8 移除 |
| **`subscribe` 位置回调废弃** | `subscribe(next, error, complete)` 改为 observer 对象；`subscribe(fn)` 与 `subscribe()` 本身未废弃，位置参数重载计划 v8 移除 |
| **`retryWhen` 废弃** | 改用 `retry({ count, delay })`；官方标注计划在 v9 或 v10 移除，不是 v8 |
| **多播 API 重构** | `multicast`/`publish`/`refCount` 系列废弃，改用 `share`/`shareReplay`/`connectable`/`connect` |
| **pipeable 全面取代 patch** | 不再支持 `obs.map(...).filter(...)` 原型链操作符 |
| **`retry` 负数行为移除** | 旧的「传负数 = 无限重试」被移除 |
| **tree-shaking 优化** | 纯函数操作符 + 扁平导出，未用到的可被摇掉，7.x 体积与类型推断更优 |

> 迁移建议：坚持「扁平导入 + pipeable 操作符 + `firstValueFrom`/`lastValueFrom`」，并逐步替换旧 `toPromise`、位置参数版 `subscribe`、`retryWhen` 与多播 patch。不要把弃用等同于已经移除，也不要把不同 API 的移除版本混在一起。

---

回到 [入门](../getting-started) 复习三件套，或查 [参考](../reference) 速览 API 与调度器。
