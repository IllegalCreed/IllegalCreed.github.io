---
layout: doc
outline: [2, 3]
---

# 组件与指令

> 基于 Angular 20 + Angular DevTools 编写

## 速查

- Components 面板 = Angular 组件 **与指令** 树（非 DOM）
- 选中组件/指令 → 右侧看并修改其属性（@Input/@Output/字段）
- 搜索框按名过滤；选中时页面对应元素高亮
- 定位：点选择图标 → 点页面元素，反查组件/指令
- Angular 特色：指令（directive）也在树里显示

## 组件与指令树

Components 面板展示应用的 **组件与指令层级**。与 React/Vue 不同，Angular 的 **指令（directive）也是一等公民**，会和组件一起显示在树里——可看到某元素上挂了哪些指令。

- 选中节点，页面对应元素高亮
- 搜索框按名称过滤
- 树形展示组件/指令的嵌套关系

## 检查与修改状态

选中组件 / 指令，右侧显示其实例的属性：

- **@Input 属性**：父组件传入的绑定值
- **@Output**：事件输出
- **组件字段 / 状态**：实例上的属性
- **可直接修改**：改值后视图按 Angular 变更检测更新

```ts
@Component({ selector: "app-card" })
export class CardComponent {
  @Input() title = "";
  expanded = false; // DevTools 里把 expanded 改成 true，看展开态
}
```

> 修改组件状态可快速验证不同情形的 UI，无需改代码——但要注意 Angular 需变更检测才会刷新视图。

## 双向定位

- **页面 → 组件**：点 Components 的选择图标，再点页面元素 → 定位组件/指令
- **组件 → DOM**：定位到渲染该组件的 DOM 节点
- 配合浏览器 Elements 面板看编译后的真实 DOM

## 指令调试（Angular 特色）

因为指令也在树里，可检查**结构型指令**（`*ngIf` / `*ngFor` 等的现代等价 `@if` / `@for`）与**属性型指令**的实例状态——这是 Angular 区别于 React/Vue 调试的一点。

## 下一步

变更检测性能分析见 [Profiler 变更检测](./profiler.md)。
