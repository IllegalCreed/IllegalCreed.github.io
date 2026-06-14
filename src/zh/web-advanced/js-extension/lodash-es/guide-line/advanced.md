---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

> 版本基线 **Lodash 4.18.1**。把 lodash-es 用进真实项目：`debounce`/`throttle` 的选项与 `cancel`/`flush`、`memoize` 的缓存坑、`flow` 函数组合、`get`/`set` 动态路径实战、以及在 React 里的正确姿势。

## 一、debounce / throttle 的选项与控制方法

### leading / trailing：在窗口哪一端触发

```js
import { debounce } from "lodash-es";

// 默认 { leading:false, trailing:true }：静默后在尾部触发一次
const a = debounce(fn, 300);

// 立即响应 + 冷却：首次立刻执行，窗口内后续调用忽略，尾部不补发
const b = debounce(fn, 1000, { leading: true, trailing: false });
```

- `leading:true` → 第一次调用**立即**执行（适合按钮防连点）。
- `trailing:false` → 窗口结束时**不再**补一次执行。

### maxWait：给防抖加「最多等多久」上限

```js
// 正常防抖 500ms，但持续输入时最多等 2000ms 也一定执行一次
const c = debounce(fn, 500, { maxWait: 2000 });
```

> `maxWait` 保证「连续不断的调用」不会让 `fn` 被无限推迟。事实上 lodash 内部的 `throttle` 就是用「带 `maxWait` 的 `debounce`」实现的。

### cancel / flush：控制挂起的调用

```js
const search = debounce(fn, 300);
search("ab");
search.cancel(); // 取消并丢弃挂起的调用（不执行）
search.flush(); // 立即执行挂起的调用并返回结果
```

- 组件卸载 → `search.cancel()`，防止延迟回调在已销毁组件上跑。
- 表单提交前 → `search.flush()`，确保最后一次输入被处理。

### throttle：节流

```js
import { throttle } from "lodash-es";

// 滚动时每 100ms 最多更新一次位置
window.addEventListener("scroll", throttle(updatePosition, 100));

// 只在首次点击触发，关闭尾部补发
const onClick = throttle(renew, 5 * 60 * 1000, { trailing: false });
```

## 二、memoize 的缓存坑

`memoize` **默认只用第一个参数当 key**（缓存是 `MapCache`），这对多参数函数是个陷阱：

```js
import { memoize } from "lodash-es";

const add = memoize((a, b) => a + b);
add(1, 2); // 3，并以 key=1 缓存
add(1, 5); // ⚠️ 命中 key=1 的旧缓存 → 返回 3（不是 6！）
```

正确做法是传 **resolver** 自定义 key：

```js
const addOk = memoize(
  (a, b) => a + b,
  (a, b) => `${a},${b}`, // 用全部参数拼成 key
);
addOk(1, 2); // 3
addOk(1, 5); // 6 ✅
```

> 还要注意：`memoize` 的缓存**永不自动失效/淘汰**，会随调用持续增长。需要容量上限就得自定义 Cache（见[专家篇](./expert)）。可通过 `addOk.cache` 手动 `get/set/has/delete/clear`。

## 三、flow / flowRight：函数组合管道

用 `flow` 把多个具名导入的函数串成数据管道，是 ESM 下替代 `_.chain` 的主流方式（摇树友好）：

```js
import { flow, filter, map, sumBy } from "lodash-es";

// 数据从左到右流过 f → g → h
const totalAdultIncome = flow([
  (users) => filter(users, (u) => u.age >= 18),
  (users) => map(users, "income"),
  (incomes) => incomes.reduce((s, n) => s + n, 0),
]);
totalAdultIncome(users);
```

注意求值方向：

```js
import { flow, flowRight } from "lodash-es";

const add1 = (x) => x + 1;
const mul2 = (x) => x * 2;

flow([add1, mul2])(5); // 左→右：(5+1)*2 = 12
flowRight([add1, mul2])(5); // 右→左（compose）：(5*2)+1 = 11
```

> `flow` 相比 `chain` 的两个实际好处：① **tree-shaking 友好**（每个函数都是独立 import）；② 产出**可复用的纯函数**，便于命名、测试、传递。代价是多数 lodash 函数 data-first，组合时要留意参数顺序（或用 `lodash/fp` 做成 data-last）。

## 四、get / set：动态路径实战

```js
import { get, set, has } from "lodash-es";

// 字符串路径 / 数组路径都支持
get(state, "user.address[0].city", "未知"); // 中途为空 → 返回 '未知'
get(state, ["user", "roles", 0]); // 数组路径

// set 会自动创建缺失的中间结构（⚠️ 变异原对象）
const o = {};
set(o, "a.b.c", 1); // o → { a: { b: { c: 1 } } }
```

**何时该用 `get` 而非原生可选链？**

```js
// 静态路径 → 用原生，零依赖
const city1 = state?.user?.address?.[0]?.city ?? "未知";

// 动态路径（path 是运行时算出来的）→ _.get 更合适
const fieldPath = `form.${sectionId}.${fieldId}`;
const val = get(state, fieldPath, "");
```

> 可选链的路径必须在编码时写死，无法直接吃一个变量字符串当深层路径；`get` 能消费任意运行时拼出的 path，这是它的主战场。

## 五、在 React 里用 debounce 的正确姿势

直接把 `debounce` 写在组件体里是常见 bug：

```jsx
// ❌ 每次 render 都重建防抖函数 → 防抖失效
function Search() {
  const onChange = debounce((e) => fetchList(e.target.value), 300);
  return <input onChange={onChange} />;
}
```

每次渲染都执行函数体，`debounce(...)` 每次都创建**全新**的防抖函数，旧计时器与新函数无关，等于「每次输入都是新函数的第一次调用」。正确做法是**稳定保持同一个引用**：

```jsx
import { useMemo, useEffect } from "react";
import { debounce } from "lodash-es";

function Search() {
  const onChange = useMemo(
    () => debounce((value) => fetchList(value), 300),
    [], // 只创建一次
  );
  // 卸载时清理挂起调用
  useEffect(() => () => onChange.cancel(), [onChange]);
  return <input onChange={(e) => onChange(e.target.value)} />;
}
```

> 关键：防抖/节流函数必须在多次渲染间保持同一引用（`useMemo`/`useRef`），其内部计时器才能跨调用累积。这是 React 使用姿势问题，不是 lodash 缺陷。

---

进入 [指南 · 专家](./expert)：`_.chain` 的惰性求值与取舍、`memoize` 自定义 LRU 缓存、`lodash/fp` 不可变与 data-last、不可变更新方案、ESM↔CJS 互操作排查、单元测试假定时器。
