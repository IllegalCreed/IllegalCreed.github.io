---
layout: doc
outline: [2, 3]
---

# 参考

> **RxJS 7.8.2** 常用 API 速查：创建函数、核心操作符、Subject 家族、调度器与子路径。操作符从 `'rxjs'` 扁平导出，用 `source$.pipe(...)` 组合。

## 速查

- 创建与消费：`of` / `from` / `fromEvent` / `defer` → `pipe(...)` → `subscribe({ next, error, complete })`
- 高阶映射：最新值用 `switchMap`，并发用 `mergeMap`，保序用 `concatMap`，忙时忽略用 `exhaustMap`
- 组合：持续状态用 `combineLatest`，主源触发取快照用 `withLatestFrom`，全部完成取末值用 `forkJoin`
- 错误：`retry` 放在 `catchError` 之前；清理逻辑用 `finalize`
- 退订只保证关闭订阅并执行 teardown；`from(Promise)` 不会取消底层 Promise
- `shareReplay` 的 `refCount` 默认是 `false`；无限源需明确决定是否在零订阅者时断开
- 转 Promise：`firstValueFrom` 取首值，`lastValueFrom` 必须等待源 complete
- 迁移：位置参数版 `subscribe` 与 `toPromise` 计划 v8 移除；`retryWhen` 计划 v9 或 v10 移除

## 一、创建函数（Creation）

| 函数 | 作用 |
|---|---|
| `of(a, b, c)` | 把每个参数依次同步发出后 complete |
| `from(input)` | 把 Iterable / 数组 / Promise / Observable 转成流并逐项发出 |
| `fromEvent(target, name)` | 把 DOM / 事件目标的事件包成流（自动 add/removeEventListener） |
| `interval(period)` | 每 `period` ms 发递增整数；**首值滞后一个周期**，永不自动完成 |
| `timer(due[, period])` | `due` 后发一个 0（单参）；带 `period` 则之后周期发递增整数 |
| `range(start, count)` | 同步发出一段连续整数 |
| `defer(factory)` | **订阅时**才调用工厂创建流，每次订阅生成新流（按订阅时刻求值） |
| `EMPTY` | 不发值、**立即 complete** |
| `NEVER` | 既不发值也不终止（永远挂起） |
| `throwError(() => err)` | 订阅时立即以指定错误 error（7.x 推荐传工厂函数） |
| `iif(cond, a$, b$)` | 订阅时按条件二选一 |

## 二、组合 / 合并（Combination）

| 函数 / 操作符 | 行为 |
|---|---|
| `merge(a$, b$)` | 并行订阅所有源，值**交错**发出 |
| `concat(a$, b$)` | 串行：等前一个 complete 再订阅下一个，值**不交错** |
| `combineLatest([a$, b$])` | 每源都发过值后，任一源更新即组合「各源最新值」发出 |
| `withLatestFrom(other$)` | 仅**主源**发值时输出，附带其它源最新值快照（不对称） |
| `forkJoin([a$, b$])` | 等所有源 complete，取各自**最后值**组合发一次（似 `Promise.all`） |
| `zip(a$, b$)` | 按序「配对」各源的第 n 个值 |
| `race(a$, b$)` | 采用最先发值的那个源，其余退订 |

## 三、变换 / 过滤（Transformation / Filtering）

| 操作符 | 作用 |
|---|---|
| `map(fn)` | 逐值变换，数量不变 |
| `filter(pred)` | 只放行满足谓词的值 |
| `tap(fn)` | **副作用**（日志/调试），原样透传值、不改流 |
| `scan(acc, seed)` | 每个值都发出当前累加结果（运行中的 reduce） |
| `reduce(acc, seed)` | 只在 complete 时发出最终累加结果一次 |
| `take(n)` / `takeUntil(n$)` / `takeWhile(p)` | 取前 n 个 / 直到通知流发值 / 满足条件期间 |
| `skip(n)` / `first()` / `last()` | 跳过 n 个 / 取第一个 / 取最后一个 |
| `distinctUntilChanged()` | 去**连续**重复（只比相邻） |
| `startWith(...v)` | 在源发值前先发出初始值 |
| `pairwise()` | 把相邻两值配成 `[prev, cur]` |
| `toArray()` | 收集所有值，**complete 时**作为一个数组发出 |

## 四、高阶映射（Flattening，高频考点）

| 操作符 | 新值到来时对未完成内层的处理 | 典型场景 |
|---|---|---|
| `switchMap` | **退订**上一个内层，切到新的；底层副作用仅在支持 teardown 时真正取消 | 搜索补全（取最新、防竞态） |
| `mergeMap` | **并发**保留所有内层（可传 `concurrent` 限流） | 并行请求 |
| `concatMap` | **排队**：等上一个完成再订阅下一个（保序不丢） | 顺序写操作 |
| `exhaustMap` | **忽略**新外层值直到当前内层完成 | 防重复提交 |

> `xxxMap` ≈ `map(...)` + 对应的 `xxxAll`（`mergeAll`/`concatAll`/`switchAll`/`exhaustAll`，用于已是高阶 Observable 的拍平）。

## 五、时间相关（Time-based，默认走 asyncScheduler）

| 操作符 | 作用 |
|---|---|
| `debounceTime(d)` | 源静默达 `d` ms 后发出**最近一个**值（搜索输入） |
| `throttleTime(d[, sch, cfg])` | 发一个值后窗口内忽略其余；`{ leading, trailing }` 控发头/发尾 |
| `auditTime(d)` | 窗口结束时发出窗口内**最近**的值（采样最新） |
| `sampleTime(d)` | 每 `d` ms 采样一次最新值 |
| `delay(d)` | 把每个值延迟 `d` ms 发出 |
| `bufferTime(d)` | 把 `d` ms 内的所有值**收集成数组**整批发出（不丢值） |

## 六、错误处理（Error Handling）

| 操作符 | 作用 |
|---|---|
| `catchError((err, caught) => obs$)` | 上游 error 时**返回一个新 Observable** 替代（降级 / 静默 / 重抛） |
| `retry(count)` / `retry({ count, delay, resetOnSuccess })` | error 后重新订阅源；`delay` 可为 ms 或 `(err, n) => 通知流` |
| `retryWhen(fn)` | ⚠️ **已废弃**（v9/v10 移除），改用 `retry({ delay })` |
| `repeat(count)` | **complete** 后重新订阅源（轮询场景） |
| `finalize(fn)` | 源以**任何方式**终止（complete / error / 退订）时执行清理 |
| `timeout(due)` | 超时未发值则 error |

## 七、Subject 家族（多播）

| 类型 | 特性 |
|---|---|
| `new Subject()` | 多播；订阅者只收**订阅之后**的值；本身也是 Observer（可 `next`） |
| `new BehaviorSubject(init)` | **需初始值**；新订阅者立即收**当前值**；`.value` / `.getValue()` 同步读 |
| `new ReplaySubject(n[, time])` | 向新订阅者**重放最近 n 个**值（可带时间窗） |
| `new AsyncSubject()` | 仅在 **complete 时**发出最后一个值 |
| `subject.asObservable()` | 返回**只读** Observable 视图（隐藏 `next`，防外部写入） |

## 八、多播操作符

| 操作符 | 作用 |
|---|---|
| `share(config?)` | 用 Subject 多播 + 引用计数，多订阅者共享**一次**源执行 |
| `shareReplay({ bufferSize, refCount })` | 缓存并重放；`refCount` 默认 `false`，无限源可能在零订阅者后仍保持连接 |
| `connectable(source, { connector })` | 需手动 `.connect()` 才开始多播，精确控制开闸时机 |
| `connect(selector)` | 在局部把源多播给多个分支再合并 |

## 九、调度器（Scheduler）

| 调度器 | 执行时机 |
|---|---|
| `asyncScheduler` | `setTimeout`/`setInterval`（宏任务，时间相关默认） |
| `asapScheduler` | 微任务队列（尽快异步） |
| `queueScheduler` | 当前同步队列（递归调度时排队防栈溢出） |
| `animationFrameScheduler` | `requestAnimationFrame`（动画） |
| `VirtualTimeScheduler` / `TestScheduler` | 虚拟时间（`TestScheduler` 来自 `rxjs/testing`，弹珠测试） |

`observeOn(sch)` 控制**其下游通知投递**的上下文；`subscribeOn(sch)` 控制**订阅/生产开始**的上下文。

## 十、互操作与子路径

| 用法 | 说明 |
|---|---|
| `firstValueFrom(obs[, {defaultValue}])` | Observable → Promise（第一个值，空流 reject `EmptyError`） |
| `lastValueFrom(obs[, {defaultValue}])` | Observable → Promise（等待 complete 后取最后值；不终止的源会一直挂起） |
| `import { ... } from 'rxjs'` | **7.x 扁平导入**（操作符 + 创建函数） |
| `'rxjs/operators'` | 旧式子路径，仍可用但非首选 |
| `'rxjs/ajax'` / `'rxjs/fetch'` | `ajax` / `fromFetch` HTTP 工具 |
| `'rxjs/testing'` | `TestScheduler` |
| `'rxjs/webSocket'` | `webSocket` 客户端 |

---

API 查完，进 [指南 · 进阶](./guide-line/advanced) 看实战组合，或 [指南 · 专家](./guide-line/expert) 看调度器与测试内核。
