---
layout: doc
outline: [2, 3]
---

# Promise 组合器

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- **四个静态组合器**：把「一批 Promise」聚成「一个 Promise」，输入可迭代（数组等）
- **`Promise.all(iterable)`**：**全部兑现**才兑现，结果是**有序值数组**；**任一拒绝即整体拒绝**（fail-fast，快速失败）
- **`Promise.allSettled(iterable)`**：**等全部敲定**，**永不拒绝**；结果是 `{status, value | reason}` 对象数组
- **`Promise.race(iterable)`**：**第一个敲定**的（无论兑现还是拒绝）决定结果——谁先到听谁的
- **`Promise.any(iterable)`**：**第一个兑现**的决定结果；**全部拒绝**才拒绝，原因是 `AggregateError`
- **选择口诀**：要全部成功且 fail-fast → `all`；要全部结果不怕失败 → `allSettled`；要最快的成功 → `any`；要最快敲定（含失败，多用于超时）→ `race`
- **顺序保证**：`all` / `allSettled` 返回数组的**顺序按输入顺序**，与谁先完成无关
- **并发控制**：组合器会**同时发起**全部任务；要限制并发量（如最多 5 个）需手动分批或用任务池

## 为什么需要组合器

单个 `Promise` 只表示一件异步事。但真实场景常常要**同时**处理一批：并行拉取多个接口、从多个镜像里取最快的、批量上传后统计成功率……这时就要把「多个 Promise」组合成「一个 Promise」来统一等待。ES 提供四个静态方法，区别全在于**「什么时候敲定、敲定成什么」**。

下面统一用这组辅助函数演示：

```js
// 延迟后兑现
const ok = (val, ms) => new Promise((res) => setTimeout(() => res(val), ms));
// 延迟后拒绝
const fail = (msg, ms) => new Promise((_, rej) => setTimeout(() => rej(new Error(msg)), ms));
```

## Promise.all：全部成功，否则全败

`Promise.all` 等**所有**输入 Promise 兑现，然后兑现为一个**按输入顺序排列的值数组**；只要**有一个拒绝**，它立刻以那个原因拒绝——这叫**快速失败（fail-fast）**。

```js
const [a, b, c] = await Promise.all([ok("A", 100), ok("B", 50), ok("C", 80)]);
console.log(a, b, c); // "A" "B" "C"——顺序按输入，不按完成快慢
```

拒绝时的行为要特别注意：

```js
try {
  await Promise.all([ok("A", 100), fail("B 挂了", 30), ok("C", 80)]);
} catch (err) {
  console.error(err.message); // "B 挂了"——最早拒绝的那个
}
// ⚠️ A 和 C 的请求并不会被取消，它们仍在后台跑完，只是结果被丢弃
```

**适用场景**：多个请求**缺一不可**、且希望「一个失败就别等了」——比如渲染页面需要的用户信息、配置、权限三个接口必须都成功。

::: warning all 不会取消其余任务
`Promise.all` 拒绝只是让**返回的那个 Promise** 进入拒绝态，已发起的其他异步操作**不会被中止**（Promise 没有内建取消）。真要取消，得配合 `AbortController`，见 [取消、超时与竞态](./cancellation-timeout)。
:::

## Promise.allSettled：要全部结果，不怕失败

`Promise.allSettled` 等**所有**输入 Promise **敲定**（无论兑现还是拒绝），然后**永不拒绝**地兑现为一个**结果对象数组**。每个元素形如：

- 兑现：`{ status: "fulfilled", value: 值 }`
- 拒绝：`{ status: "rejected", reason: 原因 }`

```js
const results = await Promise.allSettled([
  ok("A", 100),
  fail("B 挂了", 30),
  ok("C", 80),
]);
console.log(results);
// [
//   { status: "fulfilled", value: "A" },
//   { status: "rejected",  reason: Error("B 挂了") },
//   { status: "fulfilled", value: "C" },
// ]

// 分拣成功与失败
const ok2 = results.filter((r) => r.status === "fulfilled").map((r) => r.value);
const bad = results.filter((r) => r.status === "rejected").map((r) => r.reason);
```

**适用场景**：批量操作里**部分失败可接受**，且你想知道**每一个**的结局——比如批量上传 10 个文件、统计「8 成 2 败」并分别提示；或并行请求多个互不依赖的看板数据，挂掉一两个不影响其余渲染。

## Promise.race：谁先敲定听谁的

`Promise.race` 在**第一个**输入 Promise 敲定时立刻随之敲定——**不管它是兑现还是拒绝**。后到的全部忽略。

```js
const winner = await Promise.race([ok("慢", 200), ok("快", 50)]);
console.log(winner); // "快"——先敲定的赢

// 第一个敲定的若是拒绝，race 就拒绝
try {
  await Promise.race([ok("数据", 200), fail("先炸了", 50)]);
} catch (err) {
  console.error(err.message); // "先炸了"
}
```

**经典用法是做超时**——让真实任务和一个「定时拒绝」赛跑：

```js
function withTimeout(promise, ms) {
  const timeout = new Promise((_, rej) =>
    setTimeout(() => rej(new Error(`超时 ${ms}ms`)), ms),
  );
  return Promise.race([promise, timeout]); // 任务没在 ms 内完成就以超时拒绝
}

try {
  const data = await withTimeout(fetch("/api/slow"), 3000);
} catch (err) {
  console.error(err.message); // 可能是 "超时 3000ms"
}
```

不过这种超时**不会真正取消**底层请求，更彻底的方案是 `AbortSignal.timeout`（见 [取消、超时与竞态](./cancellation-timeout)）。

## Promise.any：第一个成功的就行

`Promise.any` 在**第一个兑现**时敲定（忽略在它之前的拒绝）；只有**全部都拒绝**时才拒绝，且原因是一个**聚合错误** `AggregateError`（其 `.errors` 数组收集所有拒绝原因）。

```js
// 多个镜像源，取最快成功的那个
const fastest = await Promise.any([
  fail("CDN1 挂了", 30), // 拒绝被忽略
  ok("来自 CDN2", 80), // 第一个兑现 → any 兑现
  ok("来自 CDN3", 50),
]);
console.log(fastest); // "来自 CDN2"

// 全挂才拒绝
try {
  await Promise.any([fail("e1", 10), fail("e2", 20)]);
} catch (err) {
  console.log(err instanceof AggregateError); // true
  console.log(err.errors.map((e) => e.message)); // ["e1", "e2"]
}
```

**适用场景**：多个**冗余源**只要有一个成功就够——多 CDN / 多镜像取最快可用、多个备选 API 取首个返回的。

## race 与 any 的关键区别

两者都「取最快」，但对**失败**的态度相反：

| | 第一个敲定的是**兑现** | 第一个敲定的是**拒绝** |
| --- | --- | --- |
| `race` | 兑现 | **拒绝**（失败也算「敲定」，赢了就听它的） |
| `any` | 兑现 | **忽略**，继续等下一个兑现 |

记忆：`race` 是「最快**敲定**」（含失败，适合超时），`any` 是「最快**成功**」（容忍失败，适合冗余源）。

## 四者对照表

| 组合器 | 何时兑现 | 何时拒绝 | 结果形态 |
| --- | --- | --- | --- |
| `all` | **全部**兑现 | **任一**拒绝（fail-fast） | 有序值数组 |
| `allSettled` | **全部**敲定 | **永不**拒绝 | `{status, value/reason}` 数组 |
| `race` | 第一个**敲定**是兑现 | 第一个**敲定**是拒绝 | 单个值 |
| `any` | 第一个**兑现** | **全部**拒绝（`AggregateError`） | 单个值 |

## 并发控制：组合器会一次发起全部

四个组合器都会**立刻同时**发起数组里的所有任务。如果数组里有几百个请求，会瞬间打满连接、压垮服务器。需要**限制并发量**（如「最多同时 5 个」）时，组合器本身办不到，要手动分批或用「任务池」：

```js
// 限制并发：每次最多跑 limit 个，跑完一个补一个
async function mapWithLimit(items, limit, task) {
  const results = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const i = cursor++; // 领取下一个任务索引
      results[i] = await task(items[i], i);
    }
  }

  // 启动 limit 个 worker 并行消费队列
  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);
  return results;
}

// 用法：1000 个 URL，但同时最多 5 个请求在飞
const data = await mapWithLimit(urls, 5, (url) => fetch(url).then((r) => r.json()));
```

生产中也可直接用成熟库（如 `p-limit`、`p-map`）来做并发限流，原理与上面一致。

## 小结

四个组合器把「一批 Promise」按不同策略收敛成「一个 Promise」：`all` 要么全胜要么速败，`allSettled` 收齐所有结局，`race` 抢最快敲定，`any` 抢最快成功；而限制并发需另写任务池。掌握了它们，再回头看 `async`/`await` 如何把这些组合写得更顺手，以及「顺序 vs 并行」的取舍：[async/await](./async-await)。
