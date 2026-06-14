---
layout: doc
---

# RxJS

::: tip 本篇范围
本篇聚焦 **RxJS**——JavaScript 的响应式编程库，用 **Observable（可观察对象）** 统一表达异步与事件驱动的数据流。重点在：Observable / Observer / Subscription 三件套、`pipe()` + **pipeable 操作符**（`map`/`filter`/`tap`/`switchMap`/`mergeMap`/`concatMap`/`exhaustMap`/`debounceTime`/`distinctUntilChanged`/`combineLatest`/`withLatestFrom` 等）、创建函数（`of`/`from`/`fromEvent`/`interval`/`timer`）、`Subject`/`BehaviorSubject`/`ReplaySubject`/`AsyncSubject` 多播、**冷热 Observable**、错误处理 `catchError`/`retry`、调度器 `Scheduler`、**取消订阅与内存泄漏**、与 Promise/async 的取舍、以及 Angular「御用」生态。版本基线 **RxJS 7.x**，并在关键处点明 **v6 ↔ v7 的破坏性变更**（如 `toPromise` 弃用）。
:::

RxJS 由 **Ben Lesh** 等人维护，是 ReactiveX 在 JavaScript 上的实现，官方一句话定位是「**a reactive programming library for JavaScript**」。它的核心抽象 Observable 被定义为「**a lazy Push collection of multiple values**」——一个惰性的、可随时间推送 0 到 N 个值的集合。用「Pull / Push」二分法看：函数、Iterator 是 Pull（消费者主动取值），Promise、Observable 是 Push（生产者主动推值）；Observable 是「多值的 Push」，因此能统一表达同步/异步、单值/多值、有限/无限的一切数据流。

理解 RxJS 的关键是它的 **声明式管道**：用创建函数得到源 Observable，再用 `source$.pipe(op1(), op2(), ...)` 把一串**纯函数操作符**组合上去，最后 `.subscribe()` 触发执行并消费值。**2026 年的现状**：主版本是 **RxJS 7.x**——操作符与创建函数已**扁平导出**到包根 `'rxjs'`（`import { map, of } from 'rxjs'`），旧的「原型链 patch 操作符」彻底被 **pipeable operators** 取代；`Observable.prototype.toPromise()` 被**废弃**（v8 移除），改用 `firstValueFrom`/`lastValueFrom`；`retryWhen` 被标记废弃，改用 `retry({ delay })`；并对 **tree-shaking 与体积**做了显著优化。

## 评价

**优点**

- **统一异步模型**：用一套 Observable + 操作符表达 HTTP、WebSocket、定时器、DOM 事件、状态流，心智模型统一
- **可取消、惰性**：`subscribe()` 返回 `Subscription`，`unsubscribe()` 即可取消执行、释放资源；订阅才执行，不订阅不跑
- **强大的操作符组合**：`debounceTime`/`switchMap`/`combineLatest`/`retry` 等让「搜索补全、防抖节流、竞态取消、并发控制」用声明式几行搞定
- **多播能力**：`Subject` 家族（普通 / Behavior / Replay / Async）+ `share`/`shareReplay`，轻松实现事件总线、状态共享、请求缓存
- **冷热分明**：冷 Observable 每次订阅独立从头执行，热 Observable 共享同一数据源，配合多播精确控制「执行几次」
- **可测试**：`TestScheduler` + 弹珠图（marble diagram）把基于时间的流压缩成同步、确定性的单元测试
- **Angular 御用**：HttpClient、路由、表单、`async` 管道大量返回/消费 Observable，配 RxJS 用最顺
- **7.x 现代化**：扁平导入、更好的 tree-shaking 与类型推断、`firstValueFrom`/`lastValueFrom` 让与 async/await 互操作更清晰

**缺点**

- **学习曲线陡**：高阶映射（switchMap vs mergeMap vs concatMap vs exhaustMap）、冷热、多播、调度器等概念多，新手易混
- **内存泄漏陷阱**：忘记 `unsubscribe` 的活跃订阅不会被 GC，是最常见的线上隐患（需 `takeUntil`/`async` 管道收尾）
- **容易过度工程**：一次性、单值的简单异步用 Promise/async-await 更轻，盲目上 RxJS 反而增加复杂度
- **调试门槛**：声明式链路出问题时，定位「值在哪一步变了」需要 `tap` 打点经验
- **v6 ↔ v7 差异**：`toPromise`、`retryWhen`、`subscribe` 位置回调等均有废弃/变化，老教程与新版混用易踩坑
- **体积考量**：虽已优化，但用很多操作符时仍需关注 bundle，应坚持 pipeable + 扁平导入以利摇树

## 文档地址

[RxJS Documentation](https://rxjs.dev)

## GitHub 地址

[ReactiveX/rxjs](https://github.com/ReactiveX/rxjs)

## 幻灯片地址

<a href="/SlideStack/rxjs-slide/" target="_blank">RxJS</a>
