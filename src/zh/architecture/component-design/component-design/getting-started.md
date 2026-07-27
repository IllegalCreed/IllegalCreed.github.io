---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 react.dev 官方文档（Thinking in React / Sharing State / Composition vs Inheritance / Reusing Logic with Custom Hooks）+ vuejs.org（Component Basics / Slots）+ Dan Abramov 2015《Presentational and Container Components》+ patterns.dev + Refactoring.Guru 编写，对照 React 19 / Vue 3.5 行为

## 速查

- **两大契约**：**props 向下、events 向上**（React `props` + `onChange`；Vue `defineProps` + `defineEmits`）
- **六种角色**：展示型（木偶）/ 容器型（智能）/ 受控 / 非受控 / 复合（Compound）/ 高阶（HOC）
- **三种逻辑复用**：自定义 Hook（React `useX`）/ Composable（Vue `useX`）/ HOC（legacy，不推荐新写）
- **设计原则三件套**：**SRP（单一职责）/ OCP（开闭，对扩展开放对修改关闭）/ 组合优于继承（has-a 优于 is-a）**
- **state 三条过滤规则**：① 不随时间变化 ② 可从 props 传入 ③ 可从已有 state/props 计算 —— 三条任一满足即**不是 state**
- **受控 vs 非受控**：独立运用 = 非受控（配置少）；多个组件需协调（Accordion）= 受控（父驱动 props，灵活性最高）
- **复合组件实现**：用 **Context**（任意嵌套深度、Server Components 兼容），**不要**用 `React.Children.map + cloneElement`
- **`React.Children` 是 Pitfall**：children 不透明，`Children.map` 看不到自定义组件内部渲染 —— 改用「具名子组件 / 结构化数组 / render prop」
- **Vue 插槽四件套**：默认插槽 + 后备内容 / 具名插槽（`v-slot` / `#`）/ 作用域插槽（`v-slot="{ item }"`）/ 渲染作用域（父模板表达式只能访问父作用域）
- **Container/Presentational 现状**：Dan Abramov 已声明该严格分离**不再必要**，Hooks 以更低结构成本替代容器组件
- **HOC 三大约定**：① 不改原组件原型（用组合）② 透传无关 props ③ `displayName` 包裹为 `WithX(Name)`
- **绝不在 render 中调 HOC**：每次新组件类型 → 整树卸载 → state 丢失

## 组件化的两条主线

「组件化」在前端有两层含义，本章聚焦**第二层**：

1. **工程化组件化**（构建层面）：把单文件拆成可复用模块（`.vue` / `.tsx`），由打包器消费 —— 这是工具链的事
2. **设计层面组件化**（本章）：拆出来的组件**按角色如何分工**、**API 表面如何设计**、**如何横向组合复用**

> 本章不讲具体状态管理（Pinia/Redux）、不深入响应式原理（ref/reactive/proxy）、不讲性能优化（memo/useMemo）。这些在各自专章。

## 组件的六种角色

### 1. 展示型组件（Presentational / 木偶）

**定义**：只关心**视图怎么渲染**，数据全部从 props 接收，不直接访问数据源。

```tsx
// React：典型的展示型组件
function UserList({ users, onSelect }: UserListProps) {
  return (
    <ul>
      {users.map((u) => (
        <li key={u.id} onClick={() => onSelect(u.id)}>
          {u.name}
        </li>
      ))}
    </ul>
  );
}
```

### 2. 容器型组件（Container / 智能）

**定义**：负责**取数据 + 持有状态**，把数据通过 props 传给展示型组件。Dan Abramov 2015 原始定义。

```tsx
// React：典型的容器型组件
function UserListContainer() {
  const [users, setUsers] = useState<User[]>([]);
  useEffect(() => {
    fetch("/api/users").then((r) => r.json()).then(setUsers);
  }, []);
  return <UserList users={users} onSelect={deleteUser} />;
}
```

> **Hooks 时代的现状**：Dan Abramov 本人已声明「我不再按 Container/Presentational 严格划分」。容器组件的「取数据 + 持有状态」职责被自定义 Hook 接管（如 `useUsers()`），组件本身回归到「描述 UI 应该是什么」。

### 3. 受控组件（Controlled）

**定义**：组件的**状态完全由父组件 props 驱动**，自身不持有 state。父组件通过 `value` + `onChange`（React）/ `modelValue` + `update:modelValue`（Vue）完全控制。

```vue
<!-- Vue：受控的 CustomInput -->
<script setup lang="ts">
defineProps<{ modelValue: string }>();
defineEmits<{ "update:modelValue": [value: string] }>();
</script>
<template>
  <input
    :value="modelValue"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
```

### 4. 非受控组件（Uncontrolled）

**定义**：组件**自己持有 state**，父组件不需要管理。开箱即用、配置少。

```tsx
// React：非受控的 Panel
function Panel({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button onClick={() => setOpen((o) => !o)}>toggle</button>
      {open && <div className="content">...</div>}
    </div>
  );
}
```

> **何时用受控 / 非受控**：① 组件独立运作 → 非受控（配置少、开箱即用）② 多个组件需协调（如 Accordion 同时间只展开一个）→ 受控（父组件完全控制，灵活性最高）。

### 5. 复合组件（Compound）

**定义**：父组件挂载多个子组件为属性（`Tabs.List` / `Tabs.Tab` / `Tabs.Panel`），子组件通过 **Context** 隐式消费共享状态。声明式 API，接近原生 `<select>` / `<details>`。

```tsx
<Tabs>
  <Tabs.List>
    <Tabs.Tab>简介</Tabs.Tab>
    <Tabs.Tab>详情</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panels>
    <Tabs.Panel>简介内容</Tabs.Panel>
    <Tabs.Panel>详情内容</Tabs.Panel>
  </Tabs.Panels>
</Tabs>
```

### 6. 高阶组件（HOC，legacy）

**定义**：签名 `higherOrderComponent(WrappedComponent) → 新组件`。React 官方明确「HOC not commonly used in modern React code」，新代码应优先用 Hook。Vue 无 HOC 概念（用 Composable 替代）。

```tsx
// legacy：典型 HOC
function withTheme<P extends JSX.IntrinsicAttributes>(
  WrappedComponent: ComponentType<P>
) {
  function WithTheme(props: P) {
    const theme = useTheme();
    return <WrappedComponent {...props} theme={theme} />;
  }
  WithTheme.displayName = `WithTheme(${getDisplayName(WrappedComponent)})`;
  return WithTheme;
}
```

## 设计原则三件套

### SRP（Single Responsibility Principle，单一职责）

**含义**：一个组件只做一件事。**拆分信号**：当你开始用注释分块、用 CSS class 选择器圈出区域、或看着设计稿能圈出独立图层时，就是拆分信号。

> React 官方《Thinking in React》提示：**当复杂度增长时再拆，不要过早拆**。三种思维模型（分离关注点 / CSS class 选择器 / 设计图层）只是辅助手段。

### OCP（Open/Closed Principle，开闭原则）

**含义**：**对扩展开放，对修改关闭**。新增功能时不必改既有组件源码，通过组合 + 配置 props 即可扩展。前端语境采用 Robert C. Martin 1990s 的多态版本（基于抽象接口），而非 Bertrand Meyer 1988 的继承版本。

```tsx
// 反例：每加一个图标都要改 Button 源码
function Button({ icon }: { icon?: "save" | "delete" }) { ... }

// 正解：通过 props 注入任意节点，扩展不改源码
function Button({ icon }: { icon?: React.ReactNode }) { ... }
```

### 组合优于继承（Composition over Inheritance）

**含义**：用「has-a」组合 + props/children 配置，**不用**「is-a」类继承链。Facebook 在上万 React 组件开发中**从未发现**需要用继承构建组件层次（react.dev 官方结论）。

**三个具体落点**：

1. **Containment（ containment，包含未知子节点）**：用 `children` / 具名 prop 接收任意子节点
2. **Specialization（特化变体）**：通过组合 + 配置 props 实现特化（如 `PrimaryButton` = `<Button variant="primary">`）
3. **逻辑复用**：提取为 JS 模块 / 自定义 Hook，不继承基类

## State 最小化的三条过滤规则

来自《Thinking in React》官方三问。判断某数据是否应为 state，依次问：

| 规则 | 不为 state 的例子 |
| --- | --- |
| ① **不随时间变化** | 列表项（来自父 props，不变化） |
| ② **可从 props 传入** | `initialValue`（父控制） |
| ③ **可从已有 state / props 计算**（派生值，DRY） | 过滤后的列表 = `list.filter(...)`，应实时计算 |

> 三条任一满足即**不是 state**。违反 DRY 把派生值存为 state 会导致数据不同步。

## 受控 vs 非受控的权衡

| 维度 | 非受控 | 受控 |
| --- | --- | --- |
| 状态归属 | 组件内部 `useState` | 父组件 props |
| 配置复杂度 | 低（开箱即用） | 高（父需管理 value + onChange） |
| 协调灵活性 | 低（无法跨组件协调） | 高（父可任意编排） |
| 典型场景 | 单个独立 Panel / Tooltip | Accordion 同时间只展开一个、表单整体提交 |

> 折中：组件可同时支持「受控 + 非受控」两种模式（如 React 的 `defaultValue` / `value` 双 API），叫 **Controllable Component**。

## 单向数据流契约

**React**：父组件传 props 给子，子组件**不能直接改 props**，需调用父传入的回调（`onChange` / `onSelect`）请求变更，父自行决定是否更新。

**Vue**：`<script setup>` 编译时宏 `defineProps` + `defineEmits` 是标准契约。子组件**直接修改 props 违反单向数据流**，应通过 emit 事件请求父组件变更。

```vue
<!-- Vue：props 向下、events 向上的标准契约 -->
<script setup lang="ts">
const props = defineProps<{ modelValue: string }>();
const emit = defineEmits<{ "update:modelValue": [value: string] }>();

function onInput(e: Event) {
  // ❌ props.modelValue = newValue（违反单向数据流）
  // ✅ emit 事件让父决定
  emit("update:modelValue", (e.target as HTMLInputElement).value);
}
</script>
```

## 横向组合的两种典型场景

### 场景一：状态提升（Lifting State Up）

两个兄弟组件需要同步同一份 state 时，把 state **提升到共同父组件**，再通过 props 下传 + events 上报。这是**单一数据源（SSoT）**的体现。

```tsx
// React：两个输入框需要同步温度
function TemperatureInput({ scale, temperature, onTempChange }) { ... }

function Calculator() {
  const [scale, setScale] = useState("c");
  const [temp, setTemp] = useState("");
  // state 提升到 Calculator，由它转换 + 下传
  return (
    <>
      <TemperatureInput scale="c" temperature={temp} onTempChange={setTemp} />
      <TemperatureInput scale="f" temperature={temp} onTempChange={setTemp} />
    </>
  );
}
```

### 场景二：跨多层共享（Context / provide+inject）

当 state 需要穿过很多中间组件（prop drilling），用 **React Context** 或 **Vue provide/inject** 跨层级注入。

```tsx
// React：ThemeContext 跨多层注入
const ThemeContext = createContext("light");

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Layout />  {/* Layout 不需要知道 theme，深层 Toolbar 直接消费 */}
    </ThemeContext.Provider>
  );
}

function Toolbar() {
  const theme = useContext(ThemeContext);
  return <button className={theme}>Submit</button>;
}
```

> **何时不该用 Context**：简单父子优先 props/events，滥用 Context 会破坏数据流可追踪性。详见 [组件通信] 章。

## 下一步

- [核心规则与反模式](./guide-line.md)：组件分类深入（HOC/Hook/Compound）、设计原则逐条详解、Vue 插槽体系、API 模式取舍、反模式避坑
- [参考](./reference.md)：完整角色分类表、原则速查表、API 模式对比表、官方资源链接
