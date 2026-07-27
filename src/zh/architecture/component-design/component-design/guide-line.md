---
layout: doc
outline: [2, 3]
---

# 核心规则与反模式

> 基于 react.dev（Thinking in React / Sharing State / Composition vs Inheritance / Reusing Logic / Children / Pitfall 警告）+ vuejs.org（Component Basics / Slots / provide-inject）+ legacy.reactjs.org（HOC 三大约定 + Render Props）+ patterns.dev + Refactoring.Guru 编写，对照 React 19 / Vue 3.5

## 速查

- **HOC 三大约定**：① 不改原组件原型（用组合 `return <WrappedComponent {...props}/>`）② 透传所有不相关 props ③ `displayName = WithX(getDisplayName(Wrapped))`
- **绝不在 render 中调 HOC**：每次渲染创建新组件类型，React 判定 `!==` → 整棵子树卸载重挂 → state 全部丢失
- **HOC 不透传无关 props** = 接口不一致、无法独立复用 —— 正解 `const { extra, ...rest } = props; <Wrapped injected={...} {...rest}/>`
- **HOC 传 ref 必须用 `React.forwardRef`**（16.3+）：ref 由 React 特殊处理不属于普通 props，否则 ref 指向最外层容器而非被包裹组件
- **`React.Children` 是 Pitfall**：children 是不透明结构，`Children.map` 看不到自定义组件内部渲染（即使内部渲染 10 个元素也只算 1）—— 改用「暴露多个具名子组件 / 结构化数组 prop / render prop」
- **复合组件用 Context 不要用 `Children.map + cloneElement`**：Context 支持任意嵌套深度（中间可包 div / 其他组件）、兼容 Server Components；`Children.map` 仅作用于直接子节点，子组件被包裹即失效
- **自定义 Hook 共享逻辑不共享状态**：每次调用独立 state；命名规则——内部调用了 Hook 才用 `use` 前缀，纯函数未调用任何 Hook 不应加 `use`
- **Vue 作用域插槽** = 同时封装逻辑 + 组合视图；纯逻辑封装优先 Composable 更高效（无额外组件嵌套）
- **Vue 后备内容**：`<slot>默认值</slot>`，父未传时显示
- **Vue 渲染作用域**：父模板表达式只能访问父作用域，访问子数据须用作用域插槽
- **state 三条过滤**：① 不随时间变化 ② 可从 props 传入 ③ 可从已有 state/props 计算（派生值 DRY）—— 任一满足即不是 state
- **反模式黑名单**：prop drilling / 在 render 调 HOC / Children.map + cloneElement 注入 / 直接修改 Vue props / 把派生值存 state / mixin 复用逻辑 / useX 命名违规

## 组件角色深度

### 展示型 vs 容器型的「现状」

Dan Abramov 2015 年提出的「严格分离 Container / Presentational」模型，**作者本人在 Hooks 发布后已声明不再必要**。原因：

| 维度 | Hooks 前（2015-2018） | Hooks 后（2019 至今） |
| --- | --- | --- |
| 取数据 | 必须放在容器组件（class lifecycle） | 自定义 Hook `useUsers()` 任意调用 |
| 持有状态 | class component `this.state` | `useState` / `useReducer` |
| 复用逻辑 | HOC / render props / mixin | 自定义 Hook |
| 关注点分离 | 「容器管逻辑 / 展示管视图」结构分离 | 组件描述「UI 应该是什么」，逻辑在 Hook |

> **思维模型仍有参考价值**：判断「这块是数据/逻辑」还是「这块是纯视图」依然有助于思考，但**不必再机械地按 Container/Presentational 分类**。多数场景由 Hook/Composable 以更低结构成本实现同等关注点分离（patterns.dev 现状评价）。

### 受控 vs 非受控深入

**判别流程**：

```
组件内 state 归属？
├─ useState / useReducer 在自身 → 非受控
└─ 完全由父 props 驱动 → 受控
    └─ 父通过 value + onChange 完全控制行为
```

**Controllable Component（同时支持两种）的最佳实践**：组件内用 `useState` 维护「内部状态」，但允许父组件通过受控 props 接管。React 社区常见模式（如 `<input>` 原生即支持 `value` 受控 / `defaultValue` 非受控）。

```tsx
// React：Controllable Component
function Disclosure({
  controlledOpen,
  defaultOpen = false,
  onChange,
}: {
  controlledOpen?: boolean;
  defaultOpen?: boolean;
  onChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  function toggle() {
    const next = !open;
    if (!isControlled) setInternalOpen(next);
    onChange?.(next);
  }
  // ...
}
```

### HOC 三大约定（legacy，新代码不推荐）

来自 legacy.reactjs.org 官方文档：

**约定 1：不要改变原始组件（用组合）**

```tsx
// ❌ 反例：mutate 原组件
function withTheme(WrappedComponent) {
  WrappedComponent.prototype.componentDidUpdate = function () { ... };  // 函数组件无生命周期会失败
  return WrappedComponent;
}

// ✅ 正解：用组合包裹
function withTheme(WrappedComponent) {
  return function WithTheme(props) {
    return <WrappedComponent {...props} theme={useTheme()} />;
  };
}
```

> HOC 内修改原组件原型的危害：函数组件无生命周期方法会失败；多个 HOC 同时改 `componentDidUpdate` 会互相覆盖；输入组件无法独立复用。

**约定 2：透传不相关的 props**

```tsx
// ❌ 反例：只传自己注入的，丢掉其他
function withTheme(WrappedComponent) {
  return function WithTheme({ theme, ...props }) {
    return <WrappedComponent theme={theme} />;  // props 被丢弃
  };
}

// ✅ 正解：透传所有不相关 props
function withTheme(WrappedComponent) {
  return function WithTheme(props) {
    const { extra, ...rest } = props;
    return <WrappedComponent {...rest} theme={useTheme()} injected={...} />;
  };
}
```

**约定 3：displayName 包裹便于调试**

```tsx
function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || "Component";
}

function withTheme(WrappedComponent) {
  function WithTheme(props) { ... }
  WithTheme.displayName = `WithTheme(${getDisplayName(WrappedComponent)})`;
  return WithTheme;
}
```

> DevTools 中会显示 `WithTheme(UserList)` 而非匿名组件，便于定位。

### 复合组件（Compound）实现对比

**反模式：`React.Children.map + cloneElement`**

```tsx
// ❌ 反模式：子组件被中间组件包裹即失效
function Tabs({ children }) {
  const [active, setActive] = useState(0);
  return React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { active, onChange: setActive });
    }
  });
}

// 用法：直接子节点能拿到注入的 props
<Tabs>
  <Tab>...</Tab>  {/* ✅ 直接子节点能注入 */}
  <Wrapper><Tab>...</Tab></Wrapper>  {/* ❌ Tab 被 Wrapper 包裹，注入失效 */}
</Tabs>
```

**正解：Context 实现**

```tsx
// ✅ 现代方案：Context 隐式共享状态，支持任意嵌套
const TabsContext = createContext<TabsContextValue | null>(null);

function Tabs({ children, defaultIndex = 0 }) {
  const [active, setActive] = useState(defaultIndex);
  return (
    <TabsContext.Provider value={{ active, setActive }}>
      {children}
    </TabsContext.Provider>
  );
}

function Tab({ index, children }) {
  const ctx = useContext(TabsContext);  // 中间可包任意层 div / 组件，都能消费
  if (!ctx) throw new Error("Tab must be used within <Tabs>");
  return (
    <button onClick={() => ctx.setActive(index)}>
      {children}
    </button>
  );
}

Tabs.List = function List({ children }) { return <div role="tablist">{children}</div>; };
Tabs.Tab = Tab;
Tabs.Panel = function Panel({ index, children }) {
  const ctx = useContext(TabsContext);
  return ctx?.active === index ? <div>{children}</div> : null;
};
```

> Context 的优势：① 支持任意嵌套深度（中间可包 div / 其他组件）② 兼容 React 18+ Server Components ③ 子组件可独立校验（`useContext` 返回 null 抛错）。

## 自定义 Hook vs HOC vs Render Props

三种逻辑复用方式的对比：

| 维度 | 自定义 Hook（推荐） | HOC（legacy） | Render Props |
| --- | --- | --- | --- |
| 嵌套层级 | 扁平（调用 `useX()`） | wrapper 嵌套地狱 | 多层 render 函数回调 |
| props 来源 | 透明（函数返回值） | 隐式注入，IDE 跳转困难 | 显式（render 函数参数） |
| DevTools | 清晰 | 多层 wrapper | 多层 render |
| 命名冲突 | 无 | 有（多个 HOC 注入同名 prop） | 有（render 函数参数名） |
| ref 处理 | 直接用 | 需 `forwardRef` 透传 | 直接用 |
| 现代化 | **首选**（react.dev 主推荐） | 移除主推荐，仅 legacy 保留 | 大幅被 Hook 取代 |
| 适用场景 | 状态逻辑复用 | 老代码迁移 / 拦截 props | 列表渲染 / 注入索引等 |

### 自定义 Hook 命名规则

```tsx
// ✅ 内部调用 Hook → 用 use 前缀
function useChatRoom({ serverUrl, roomId }) {
  useEffect(() => { ... }, [serverUrl, roomId]);
  const [messages, setMessages] = useState([]);
  return messages;
}

// ❌ 未调用任何 Hook 却加 use 前缀（误导）
function useFormatDate(date: Date) {
  return date.toLocaleDateString();  // 纯函数，不应加 use
}
// ✅ 应改名为 formatDate
```

> **linter 识别**：React Hooks ESLint 规则 `react-hooks/rules-of-hooks` 靠 `use` 前缀判定函数是否为 Hook。命名违规会让 linter 失去保护。

### 把每个 Effect 包成具名 Hook

react.dev 推荐：让组件代码描述**意图**而非实现细节。

```tsx
// ❌ 反例：组件直接写 Effect，未来替换底层实现需改组件
function ChatRoom({ roomId }) {
  useEffect(() => {
    const connection = createConnection(roomId);
    connection.connect();
    return () => connection.disconnect();
  }, [roomId]);
  // ...
}

// ✅ 正解：包成 useChatRoom，组件描述意图，底层从 useState 切到 useSyncExternalStore 不影响组件
function ChatRoom({ roomId }) {
  useChatRoom(roomId);  // 意图：连接聊天室
  return <Messages />;
}
```

## Vue 插槽体系

### 默认插槽 + 后备内容

```vue
<!-- SubmitButton.vue -->
<template>
  <button class="btn">
    <slot>提交</slot>  <!-- 父未传时显示「提交」 -->
  </button>
</template>

<!-- 用法 -->
<SubmitButton>保存</SubmitButton>  <!-- 显示「保存」 -->
<SubmitButton />  <!-- 显示「提交」 -->
```

### 具名插槽

```vue
<!-- BaseLayout.vue -->
<template>
  <div class="layout">
    <header><slot name="header" /></header>
    <main><slot /></main>  <!-- 默认插槽 -->
    <footer><slot name="footer" /></footer>
  </div>
</template>

<!-- 用法：v-slot / # 简写 -->
<BaseLayout>
  <template #header>
    <h1>标题</h1>
  </template>
  <p>正文</p>  <!-- 进默认插槽 -->
  <template #footer>
    <p>页脚</p>
  </template>
</BaseLayout>
```

### 作用域插槽

**用途**：子组件把内部数据暴露给父组件，由父决定如何渲染（同时封装逻辑 + 组合视图）。

```vue
<!-- FancyList.vue：封装数据获取，行渲染委托父组件 -->
<script setup lang="ts">
const items = await fetch("/api/items").then((r) => r.json());
</script>
<template>
  <ul>
    <li v-for="item in items" :key="item.id">
      <slot :item="item" :index="0" />  <!-- 把 item 暴露给父 -->
    </li>
  </ul>
</template>

<!-- 用法：父决定行渲染方式 -->
<FancyList>
  <template #default="{ item, index }">
    <span class="item-name">{{ item.name }}</span>
    <span class="item-price">{{ item.price }}</span>
  </template>
</FancyList>
```

> **作用域插槽 vs Composable**：作用域插槽适合「同时封装逻辑 + 组合视图」（如 FancyList 封装数据 + 委托渲染）。**纯逻辑封装**（只取数据、视图完全由调用方写）优先 Composable，无需额外组件嵌套开销。

### 渲染作用域规则

父模板中的表达式**只能访问父作用域**，访问子组件数据必须用作用域插槽。

```vue
<!-- ❌ 错误：父模板访问不到子组件的 user -->
<UserCard>
  <div>{{ user.name }}</div>  <!-- user 不在父作用域，undefined -->
</UserCard>

<!-- ✅ 正解：子组件通过作用域插槽暴露 user -->
<UserCard v-slot="{ user }">
  <div>{{ user.name }}</div>
</UserCard>
```

> Vue 3 起 `slot-scope` 已废弃，统一用 `v-slot` / `#` 简写。

## 组件 API 设计模式

### 模式一：children API

**适用**：父把任意子节点塞给组件，组件不关心子节点结构。

```tsx
// React：Dialog 接收任意 children
function Dialog({ children, open }) {
  return open ? <div className="dialog">{children}</div> : null;
}

// 用法
<Dialog open={true}>
  <h1>标题</h1>
  <p>正文</p>
  <button>关闭</button>
</Dialog>
```

> **`children` 是不透明结构**：你不能假设 children 是数组或单个元素。要遍历得用 `React.Children` API，但官方标注 Pitfall。优先用「暴露多个具名子组件」或「结构化数组 prop」替代。

### 模式二：Render Props

**定义**：组件接收一个返回 React 元素的函数 prop（如 `render` / `renderItem`），调用它替代自身渲染逻辑。

```tsx
// React：List 接收 renderItem，把 item 和 index 注入
function List({ items, renderItem }) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={item.id}>{renderItem(item, index)}</li>
      ))}
    </ul>
  );
}

// 用法：父决定行渲染
<List items={users} renderItem={(user, index) => (
  <div>
    <span>{index + 1}. {user.name}</span>
  </div>
)} />
```

> Render Props 在现代 React 中被 Hook 大幅取代，但「列表渲染 + 注入 index」「动态选择渲染策略」等场景仍适用。

### 模式三：Compound Component

见上文「复合组件」段落。声明式 API，最接近原生 HTML 语义。

### Vue 对应：slot / 作用域插槽

Vue 没有专门的「render props」概念——**作用域插槽就是 Vue 的 render props**：

```vue
<!-- Vue 等价写法 -->
<List :items="users">
  <template #item="{ item, index }">
    <div>
      <span>{{ index + 1 }}. {{ item.name }}</span>
    </div>
  </template>
</List>
```

### Context / provide+inject：跨层共享

**React Context API**：

```tsx
// createContext + Provider + useContext
const LocaleContext = createContext("zh-CN");

function App() {
  return <LocaleContext.Provider value="zh-CN"><Layout /></LocaleContext.Provider>;
}

function Layout() { /* 不需要接收 locale 也不需要透传 */
  return <Toolbar />;
}

function Toolbar() {
  const locale = useContext(LocaleContext);  // 中间层无感
  return <button>{locale === "zh-CN" ? "提交" : "Submit"}</button>;
}
```

**Vue provide + inject**：

```vue
<!-- 祖先组件 -->
<script setup lang="ts">
import { provide, ref } from "vue";
const theme = ref("dark");
provide("theme", theme);  // 注入，所有后代可用
</script>

<!-- 后代组件（任意深度） -->
<script setup lang="ts">
import { inject } from "vue";
const theme = inject("theme", "light");  // 第二个参数是默认值
</script>
```

> **何时不该用**：简单父子优先 props/events。滥用 Context/provide-inject 会破坏数据流可追踪性，调试时难以定位数据来源。

## 反模式黑名单

### 1. Prop Drilling（属性透传 / Prop Soup）

**症状**：在多层级手动透传同一组 props（`open` / `toggle` / `index` / `user`...），中间层根本不用这些 props。

**正解**：状态提升、React Context、Vue provide/inject。

### 2. 在 render 中调用 HOC

```tsx
// ❌ 每次 render 创建新组件类型
function MyComponent() {
  const EnhancedComponent = withTheme(SomeComponent);  // ❌
  return <EnhancedComponent />;
  // → React 判定 EnhancedComponent !== 上次的 EnhancedComponent
  // → 整棵子树卸载重挂，state 全部丢失
}

// ✅ 在模块顶层应用一次
const EnhancedComponent = withTheme(SomeComponent);
function MyComponent() {
  return <EnhancedComponent />;
}
```

### 3. Children.map + cloneElement 注入 props

子组件一旦被任意中间组件包裹（`<Wrapper><Tab/></Wrapper>`）就无法接收到注入的 props。详见上文「复合组件」段落。改用 Context。

### 4. 直接修改 Vue props

```vue
<!-- ❌ 违反单向数据流 -->
<script setup lang="ts">
const props = defineProps<{ modelValue: string }>();
props.modelValue = "new";  // ❌
</script>

<!-- ✅ 通过 emit 请求父组件变更 -->
<script setup lang="ts">
const props = defineProps<{ modelValue: string }>();
const emit = defineEmits<{ "update:modelValue": [value: string] }>();
emit("update:modelValue", "new");
</script>
```

### 5. 把派生值存为 state

```tsx
// ❌ 反例：过滤后的列表存为 state，违反 DRY
function SearchList({ users }) {
  const [filtered, setFiltered] = useState(users);  // users 变了 filtered 不会自动更新
  useEffect(() => { setFiltered(users.filter(...)); }, [users]);  // 用 Effect 同步 = 反模式
  // ...
}

// ✅ 正解：派生值实时计算
function SearchList({ users, query }) {
  const filtered = useMemo(() => users.filter((u) => u.name.includes(query)), [users, query]);
  // 或更简单：const filtered = users.filter(...)
}
```

### 6. HOC 内修改被包裹组件原型（mutation）

函数组件无生命周期方法会失败；多个 HOC 同时改 `componentDidUpdate` 会互相覆盖；输入组件无法独立复用。改用组合包裹。

### 7. HOC 不透传无关 props

被包裹组件接口不一致，难以独立复用。正解：`const { extra, ...rest } = props; <Wrapped injected={...} {...rest}/>`。

### 8. Hook 命名违规

- `useFormatDate` 内部不调用任何 Hook → 应改名为 `formatDate`
- `formatData` 内部调用了 `useState` → 应改名为 `useFormatData`

linter 靠 `use` 前缀判定函数是否为 Hook，违规会失去 ESLint 保护。

### 9. 用 useMount / useEffectOnce 模拟「生命周期」

React 没有「挂载」概念，用空依赖 Effect 模拟 `componentDidMount` 是反模式（react.dev）。改用「在 Effect 中订阅」或「`useSyncExternalStore`」等更符合 React 模型的方案。

### 10. 用 mixin / 继承基类复用逻辑（Vue 2.x 遗毒）

导致来源不明、命名冲突、难以追溯。Vue 3 已用 Composition API + Composable 取代，mixin 不再推荐。

### 11. 把 ref 当普通 prop 传给 HOC

ref 由 React 特殊处理不属于普通 props，HOC 中 ref 会指向最外层容器而非被包裹组件。须用 `React.forwardRef`（16.3+）透传。

## 下一步

- [参考](./reference.md)：完整角色分类表、设计原则速查表、API 模式对比表、官方资源链接
