---
layout: doc
outline: [2, 3]
---

# 核心手段

> 基于 React 19.2 / Vue 3.5 / Lodash 4.17.15 / MDN 官方文档编写

## 速查

- **debounce**：自上次调用起等待 `wait` ms 才执行；默认 `trailing:true`；实例带 `.cancel()` / `.flush()`
- **throttle**：每 `wait` ms 至多一次；默认 `leading:true + trailing:true`；等价 debounce 带 `maxWait=wait`
- **场景**：搜索框 / resize / 校验 → debounce；滚动 / 拖拽 / mousemove → throttle
- **实例管理**：`useRef` / `useMemo` 单实例；卸载 `useEffect cleanup` 调 `.cancel()`
- **事件委托**：父容器单监听器 + `event.target.closest('[data-id]')`；`event.target`（触发源）vs `currentTarget`（绑定者）
- **passive**：`addEventListener('scroll', fn, { passive: true })` 显式不 `preventDefault` → 浏览器并行滚动
- **React useMemo**：3 场景——昂贵计算 / 传 memo 子组件 / 作 Hook 依赖；用 `Object.is` 比较依赖
- **React useCallback(fn, deps) ≡ useMemo(() => fn, deps)**
- **React.memo**：props 浅比较跳过；自定义 `arePropsEqual` 禁深比较、必须比函数 prop
- **React Compiler**：编译期自动 memoize，启用后通常可移除 `useMemo`/`useCallback`/`memo`
- **Vue shallowRef**：仅 `.value` 响应；`triggerRef` 手动触发；不可嵌套深 reactive
- **Vue shallowReactive**：根级响应、嵌套不响应、ref 不解包
- **Vue v-memo="[deps]"**：依赖全等跳过子树；必须与 v-for **同元素**；`[]` 等价 `v-once`

## 一、防抖与节流

两者都把高频回调降频，区别在「何时执行」：

- **debounce**：把多次连续调用合并成**最后一次**——「等用户停手才执行」
- **throttle**：保证**固定频率**至少执行一次——「按节奏跟手」

### 1.1 Lodash 官方 API

```ts
// Lodash 4.17.15
_.debounce(func, [wait=0], [options={}])
// options: { leading:false, trailing:true, maxWait?:number }
// 返回的函数带 .cancel() 和 .flush()

_.throttle(func, [wait=0], [options={}])
// options: { leading:true, trailing:true }
// 等价 _.debounce(func, wait, { leading:true, trailing:true, maxWait:wait })
```

**选项语义**

| 选项 | 默认值 | 作用 |
| --- | --- | --- |
| `leading` | debounce=false / throttle=true | 序列首次调用是否立即执行 |
| `trailing` | true | 延迟到期后再补一次调用 |
| `maxWait` | debounce=未设 / throttle=`wait` | 允许被延迟的最长时间；超过则强制执行 |

**最直观的对比**

```text
用户在 100ms 内连续点击 5 次（每次间隔 20ms），wait=200ms：

debounce（默认 trailing）：
  点击1 ─┐
  点击2 ─┤ 重置计时
  点击3 ─┤ 重置计时
  点击4 ─┤ 重置计时
  点击5 ─┘ → 200ms 后执行 1 次（共 1 次）

throttle（默认 leading+trailing）：
  点击1 → 立即执行（leading）
  点击2~5 → 被节流
  停手后 200ms → 补 1 次（trailing，共 2 次）
```

### 1.2 场景选型

| 场景 | 选型 | 理由 |
| --- | --- | --- |
| 搜索框自动补全 | debounce 300ms | 用户停手后才发请求，避免每键一次 |
| 表单字段校验 | debounce 400ms | 停止输入再校验，不打扰 |
| window resize 重新布局 | debounce 200ms | 拖动结束后再算一次 |
| 滚动加载 / 吸顶 | throttle 100ms | 按节奏跟手，避免漏检测位置 |
| 拖拽 / slider / mousemove | throttle 16~50ms | 跟手且不卡帧 |
| 按钮防连点 | throttle 1000ms（trailing:false）| 首次响应、后续忽略 |

### 1.3 React 中的实例管理（关键坑）

```tsx
// ✅ 正确：useMemo 只创建一次，卸载时 cancel
function SearchBox() {
  const debouncedSearch = useMemo(
    () => _.debounce((q: string) => fetchResults(q), 300),
    []
  );
  useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);
  return <input onChange={(e) => debouncedSearch(e.target.value)} />;
}

// ❌ 反模式：每次 render 重建实例 → 防抖完全失效
function SearchBoxBad() {
  // 每次 render 都是新函数，永远等不到「上次调用 300ms 后」
  const onChange = (e) => _.debounce(fetchResults, 300)(e.target.value);
  return <input onChange={onChange} />;
}
```

**Vue 版（Composition API）**

```ts
import { debounce } from 'lodash-es';

const debouncedSearch = debounce((q: string) => fetchResults(q), 300);
onBeforeUnmount(() => debouncedSearch.cancel()); // 同样必须 cancel
```

> **官方陷阱**：React 组件卸载时未 cancel debounce/throttle 实例，会在卸载后仍触发回调 `setState`，触发「Can't perform a React state update on an unmounted component」警告（旧版本）或造成内存泄漏。

## 二、事件委托（Event Delegation）

### 2.1 原理：冒泡 + 单监听器

DOM 事件默认在**冒泡阶段**触发（由内向外）。把监听器绑在父容器，子元素的事件会冒泡上来统一处理：

```html
<!-- 父容器单个监听器，处理所有 li 的点击 -->
<ul id="list">
  <li data-id="1" data-action="select">项 1</li>
  <li data-id="2" data-action="select">项 2</li>
  <!-- ... 几千项 ... -->
</ul>

<script>
  list.addEventListener('click', (e) => {
    // 用 closest 上溯到带 data-id 的元素（点击内部 span/icon 也能命中）
    const item = e.target.closest('[data-id]');
    if (!item) return;
    console.log('点击项 id =', item.dataset.id, 'action =', item.dataset.action);
  });
</script>
```

### 2.2 关键 API 区分

| 属性 | 含义 |
| --- | --- |
| `event.target` | **实际触发**事件的元素（最深嵌套，如内部 icon） |
| `event.currentTarget` | **当前绑定**监听器的元素（= 父容器，事件冒泡到此） |
| `event.stopPropagation()` | 阻止事件继续冒泡 / 捕获 |
| `addEventListener(type, fn, { capture: true })` | 在捕获阶段（由外向内）触发 |

> **常见坑**：直接用 `event.target` 取值而不 `.closest()` 上溯——当子元素内部有 `<span>` / `<svg>` 时点击点不到目标项。

### 2.3 何时收益最大

- **动态列表**：聊天消息、购物车项、todo 项——子项频繁增删，**用委托免去每次重绑**
- **大列表**：监听器数量从 N → 1，**内存占用大幅下降**
- **数据驱动的行为分发**：用 `data-action="delete"` / `data-action="edit"` 在子元素携带语义，监听器按 action 分发，比每个子元素绑内联回调更易维护

### 2.4 慎用 `stopPropagation`

滥用 `stopPropagation()` 会破坏同祖先上其他委托或全局监听（如「点击外部关闭弹层」的 `document` 监听器）。只在必要的边界处（如 Modal 内阻止冒泡到 document）使用。

## 三、被动事件（passive）

### 3.1 为什么需要

浏览器**无法预知**回调里是否调 `event.preventDefault()`，因此历史上对 `scroll` / `touchmove` / `wheel` 这类事件，必须在主线程跑完监听器后才能开始滚动——监听器一慢，滚动就卡。`passive: true` 是开发者向浏览器**承诺**「我不会 preventDefault」，浏览器可以**并行滚动**而无需等待：

```ts
// ✅ 显式声明 passive，浏览器不必等监听器
window.addEventListener('scroll', onScroll, { passive: true });

// ❌ 不能 preventDefault，否则控制台警告 + 调用无效
function onScroll(e: Event) {
  // e.preventDefault(); // ⚠ 调了也没用，且 console 报警
  doExpensiveWork();
}
```

### 3.2 现代浏览器默认行为

Chrome / Firefox 已对 `document` / `body` 上的 `touchstart` / `touchmove` 默认按 passive 处理。但显式 `{ passive: true }` 仍是最佳实践——意图明确，跨浏览器一致。

> **配合 throttle**：滚动监听器典型组合 `addEventListener('scroll', _.throttle(onScroll, 100), { passive: true })`，既降频又不阻塞滚动。

## 四、React 记忆化

### 4.1 useMemo：缓存计算值

```tsx
const filtered = useMemo(() => items.filter(expensivePredicate), [items]);
// 依赖用 Object.is 逐项比较；不变则复用上次结果
```

**返回对象的坑**：

```tsx
// ❌ 箭头函数被当代码块，返回 undefined
const x = useMemo(() => { key: value }, [dep]);

// ✅ 用括号包起来或显式 return
const x = useMemo(() => ({ key: value }), [dep]);
```

**值得 useMemo 的 3 类场景**（React 官方 Deep Dive）：

1. **计算昂贵且依赖少变**：>1ms 级的过滤 / 排序 / 转换大数组
2. **作为 prop 传给 memo 子组件**：避免引用变化触发重渲染
3. **作为其他 Hook 的依赖**：避免下游 Hook 反复重跑

**不该 useMemo 的场景**：小计算（如 `.map` 几十项）、首屏一次性开销（初始化）、为可读性而加（反而降低可读性）。

### 4.2 useCallback：缓存函数本身

```tsx
// 两者完全等价
const fn = useCallback(() => doSomething(a), [a]);
const fn = useMemo(() => () => doSomething(a), [a]);
```

`useCallback` 缓存**函数本身**（不调用）；`useMemo` 缓存**调用结果**。

### 4.3 memo：包裹组件做 props 浅比较

```tsx
const Profile = memo(function Profile({ name, age }: Props) {
  return <div>{name} - {age}</div>;
});
// 父组件重渲染时，Profile 的 props 若全部 Object.is 相等，则跳过本次渲染
```

**memo 失效的典型原因**：

```tsx
// ❌ 父组件每次都传新引用，memo 浅比较失效
<List items={items.filter(x)} />           // filter 每次新数组
<Button onClick={() => handleClick(id)} /> // 每次新函数

// ✅ 配合 useMemo / useCallback
const visibleItems = useMemo(() => items.filter(x), [items]);
const handleClick = useCallback((id) => { /* ... */ }, []);
<List items={visibleItems} />
<Button onClick={handleClick} />
```

**自定义 `arePropsEqual` 两个坑**（官方 Pitfall）：

```tsx
const Profile = memo(Component, (prev, next) => {
  // ❌ 坑 1：深比较大对象，可能卡顿数秒
  // ❌ 坑 2：漏掉函数 prop，组件闭包读到旧 props/state，难排查 bug
  return prev.name === next.name; // 不充分的比较
});
```

### 4.4 React Compiler（2026 正式可用）

React Compiler 在**编译期**自动 memoize 值、函数、组件，编译产物甚至比 `memo + useMemo` 组合更全面（会缓存中间值）：

```tsx
// 启用 Compiler 后，以下代码会被自动 memoize
function FilteredList({ items, threshold }) {
  const visible = items.filter(x => x.value > threshold); // 自动 memoize
  const onClick = (id) => select(id);                     // 自动稳定引用
  return visible.map(x => <Item key={x.id} onClick={onClick} />);
}
```

启用后，`useMemo`/`useCallback`/`memo` 三页官方 Reference 均注明「**通常无需手动 memoize**」。

> **共存策略**：迁移期间 Compiler 与手写 memo 可共存。新代码可不再手写；老代码可逐步移除——但**先 Profiler 确认**再删，避免回归。

### 4.5 Hook 规则

```tsx
// ❌ 在循环 / 条件分支里调用 → 违反 Hook 规则
if (cond) {
  const x = useMemo(() => compute(a), [a]);
}

// ✅ 抽子组件在顶层调用
function Row({ item, cond }) {
  const x = useMemo(() => compute(item), [item]);
  // ...
}
```

## 五、Vue 浅响应

### 5.1 shallowRef：仅 `.value` 响应

```ts
const state = shallowRef({ count: 0, list: [] });

state.value.count++;          // ❌ 不触发更新（深层不响应）
state.value = { count: 1 };   // ✅ 整体替换触发
triggerRef(state);            // ✅ 手动强制触发
```

**何时用**：大列表（千级以上表格）、第三方不可变数据源（Immutable.js / Immer 产物）、地图数据等 Proxy 拦截开销大的场景。

### 5.2 shallowReactive：根级响应、嵌套不响应

```ts
const state = shallowReactive({
  user: { name: 'Alice' },
  count: 0,
});

state.count = 1;                // ✅ 根级响应
isReactive(state.user);         // ❌ false（嵌套未转响应式）
state.user.name = 'Bob';        // ❌ 不触发更新
```

> **官方 Use with Caution**：`shallowReactive` 不要嵌套进深 `reactive` 对象内——会出现「根级响应、深层不响应」的不一致行为，难调试。

### 5.3 customRef：自定义 track / trigger（防抖 ref）

```ts
// Vue 官方示例：防抖 ref
function debouncedRef(value, delay = 200) {
  let timeout;
  return customRef((track, trigger) => ({
    get() { track(); return value; },
    set(newValue) {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        value = newValue;
        trigger();
      }, delay);
    },
  }));
}

const keyword = debouncedRef('', 300);
```

### 5.4 markRaw / toRaw：逃逸出口

```ts
const huge = markRaw(thirdPartyLargeObject); // 永不转响应式
const raw = toRaw(proxy);                    // 取原始对象
```

适合存第三方类实例（Map/Set/Class）、永远不需要响应的数据。

## 六、Vue v-memo：模板子树记忆化

```html
<!-- 3.2+：依赖全等则跳过子树 + VNode 创建 -->
<div v-for="item in list" :key="item.id" v-memo="[item.id, item.id === selected]">
  <item-content :data="item" />
</div>

<!-- v-memo="[]" 等价 v-once：只渲染一次 -->
<header v-memo="[]">永不变</header>
```

**官方 WARNING**：`v-memo` 必须与 `v-for` 在**同一元素**，**不能写在 v-for 内部子元素**——否则不生效。

**适用场景**：v-for length > 1000 的大列表，依赖数组只放真正变化的值（如选中态 `[item.id === selected]`）。

**反模式**：依赖数组漏写真正变化的值 → 跳过必要 DOM 更新（UI 不刷新）。

## 七、反模式速查

| 反模式 | 后果 | 正解 |
| --- | --- | --- |
| `useMemo(fn)` 忘传依赖数组 | 每次重算，等于没缓存 | 必传第二参 |
| 在循环 / 条件里调 Hook | 违反 Hook 规则 | 抽子组件顶层调用 |
| 给 memo 子组件传内联对象/函数 | 引用每次变，memo 失效 | 配合 useMemo/useCallback |
| 自定义 arePropsEqual 深比较 | 卡顿数秒 | 默认浅比较或精简自定义 |
| 自定义比较漏函数 prop | 闭包读旧 props，难调 bug | 必须比较函数 prop |
| `useMemo(() => {key:val})` | 被当代码块返回 undefined | `() => ({...})` 或显式 return |
| `shallowRef.value.count++` | 深层不响应，UI 不更新 | 整体替换或 `triggerRef` |
| shallowReactive 嵌入深 reactive | 反应式树不一致 | 只在根级用 |
| v-memo 依赖漏写真实变化值 | UI 不刷新 | 数组写全 |
| v-memo 写在 v-for 内层 | 不生效 | 与 v-for 同元素 |
| 卸载时未 cancel debounce | 卸载后 setState / 内存泄漏 | cleanup `.cancel()` |
| 每次 render 调 `_.debounce()` | 防抖完全失效 | `useRef` 持单实例 |
| 委托里 `event.target` 取值 | 内部子节点不命中 | `.closest('[data-id]')` 上溯 |
| 滥用 `stopPropagation` | 打破其他监听器 | 只在必要边界用 |

## 下一步

- [入门](./getting-started.md)：两条主线 + 心智模型 + 版本
- [参考](./reference.md)：完整 API 表、版本与官方资源
