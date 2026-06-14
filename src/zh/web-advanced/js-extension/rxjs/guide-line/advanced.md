---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

> 版本基线 **RxJS 7.x**。把 RxJS 用进真实业务：高阶映射四兄弟（最高频考点）、组合多个流、错误处理与重试、防抖节流、与 Promise 互操作。

## 一、高阶映射四兄弟（必须分清）

当映射函数返回的不是普通值、而是**另一个 Observable**（如发起请求），就需要「拍平」高阶 Observable。四个操作符拍平方式一致，**区别全在「新外层值到来时、旧内层还没完成」怎么办**：

| 操作符 | 策略 | 一句话记忆 |
|---|---|---|
| `switchMap` | **取消**旧内层，切到新的 | 「只要最新的」 |
| `mergeMap` | **并发**保留所有内层 | 「全都要，同时跑」 |
| `concatMap` | **排队**，等上一个完成再下一个 | 「一个一个来，保序」 |
| `exhaustMap` | 当前内层未完成则**忽略**新值 | 「忙时拒新」 |

### switchMap：搜索补全（取消过期请求）

```ts
import { fromEvent, map, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

fromEvent(input, 'input').pipe(
  map((e) => (e.target as HTMLInputElement).value),
  debounceTime(300),
  distinctUntilChanged(),
  switchMap((term) => fetch(`/search?q=${term}`).then((r) => r.json())),
).subscribe(renderResults);
```

为什么不用 `mergeMap`？敲入新字符会发起新请求，`switchMap` 会**取消上一个尚未返回的请求**，避免「旧关键词响应后到、覆盖了正确结果」的竞态。

### exhaustMap：防重复提交

```ts
import { fromEvent, exhaustMap } from 'rxjs';

fromEvent(submitBtn, 'click').pipe(
  exhaustMap(() => fetch('/submit', { method: 'POST' }).then((r) => r.json())),
).subscribe(onDone);
// 请求进行中再点击都被忽略，天然防重复提交
```

### concatMap：顺序写操作（保序不丢）

```ts
import { from, concatMap } from 'rxjs';

from([1, 2, 3]).pipe(
  concatMap((id) => fetch(`/save/${id}`, { method: 'POST' })),
).subscribe(); // 严格按 1→2→3 顺序保存，等上一个完成再下一个
```

> `mergeMap(fn, n)` 的第二参 `concurrent` 可限制并发数（如批量请求限流到 3）；`concatMap` 本质就是 `mergeMap(fn, 1)`。

## 二、组合多个流

| 需求 | 操作符 |
|---|---|
| 多个状态任一变化就重算 | `combineLatest` |
| 主事件触发时顺带读其它流当前值 | `withLatestFrom` |
| 并发多个一次性请求、全完成后统一处理 | `forkJoin` |
| 多条独立流汇成一条（交错） | `merge` |
| 顺序衔接、前一个完成再接下一个 | `concat` |

```ts
import { combineLatest, map } from 'rxjs';

// 多个表单字段任一变化就重新校验
combineLatest([name$, email$, age$]).pipe(
  map(([name, email, age]) => validate({ name, email, age })),
).subscribe(updateUI);
```

```ts
import { fromEvent, withLatestFrom } from 'rxjs';

// 点击保存时，顺带取「当前表单值」的快照
fromEvent(saveBtn, 'click').pipe(
  withLatestFrom(form$),          // 仅 click 触发，form$ 自己变不触发
  map(([, form]) => form),
).subscribe(save);
```

```ts
import { forkJoin } from 'rxjs';

// 类似 Promise.all：等三个请求都完成，组合各自最后值
forkJoin({
  user: from(fetch('/user').then((r) => r.json())),
  posts: from(fetch('/posts').then((r) => r.json())),
}).subscribe(({ user, posts }) => render(user, posts));
```

> 区别要点：`combineLatest` 对称（任一源触发）、`withLatestFrom` 不对称（仅主源触发）、`forkJoin` 等全部 complete 才发一次。

## 三、错误处理与重试

`catchError` 的回调**必须返回一个 Observable** 作为替代流：

```ts
import { of, catchError, retry } from 'rxjs';

source$.pipe(
  retry({ count: 3, delay: 1000 }),       // 失败后重试 3 次，每次间隔 1s
  catchError((err) => {
    console.error(err);
    return of({ fallback: true });         // 降级：返回默认值流
    // 或 return EMPTY;                     // 静默结束
    // 或 return throwError(() => err);     // 重新抛出
  }),
).subscribe(handle);
```

::: warning catchError 与 retry 的顺序
`retry` 重新订阅其**上游**、捕获上游的 error。若 `catchError` 在 `retry` **之前**（更靠源），错误会先被消化、`retry` 感知不到、不会重试。想「**先重试 N 次、仍失败才兜底**」，要把 `catchError` 放在 `retry` **之后**（更靠下游）。
:::

> ⚠️ `retryWhen` 在 7.x **已废弃**（v9/v10 移除）。过去用它实现指数退避，现在改用 `retry({ delay: (err, n) => timer(2 ** n * 1000) })`。

## 四、防抖 vs 节流

| 操作符 | 行为 | 场景 |
|---|---|---|
| `debounceTime(d)` | 源**静默达 d** 后发出**最近一个**值 | 搜索输入（等用户停手） |
| `throttleTime(d)` | 发一个值后窗口内**忽略其余**、按频率放行 | 滚动、按钮连点（限频） |
| `auditTime(d)` | 窗口结束时发出窗口内**最近**的值 | 「沉默一阵后取最新」 |
| `bufferTime(d)` | 把 d 内所有值**收集成数组**整批发出（不丢值） | 批处理 |

```ts
import { fromEvent, throttleTime } from 'rxjs';

// 滚动事件限频：每 200ms 最多触发一次
fromEvent(window, 'scroll').pipe(
  throttleTime(200, undefined, { leading: true, trailing: true }), // 发头也发尾
).subscribe(onScroll);
```

## 五、与 Promise / async-await 取舍

何时用 Observable 而非 Promise？看是否需要：**多个值 / 可取消 / 惰性 / 操作符组合**（debounce、retry、switchMap…）。一次性、单值的简单异步，用 Promise/async-await 更轻——盲目上 RxJS 是过度工程。

```ts
import { from, switchMap, firstValueFrom } from 'rxjs';

// 不能在 pipe 里 await；把 Promise 接入流的两种方式：
from(fetch('/api').then((r) => r.json())).subscribe(handle);        // 1) from
trigger$.pipe(switchMap((id) => fetch(`/api/${id}`))).subscribe();  // 2) 映射里返回 Promise

// 反向：Observable → Promise（在 async 函数里）
const data = await firstValueFrom(source$);
```

---

进入 [指南 · 专家](./expert)：调度器与执行时机、多播内核、`TestScheduler` 弹珠测试、自定义操作符、7.x 破坏性变更全清单。
