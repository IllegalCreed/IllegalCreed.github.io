---
layout: doc
outline: [2, 3]
---

# 组件与状态

> 基于 Vue 3.5 + Vue DevTools v7 / vite-plugin-vue-devtools 8.x 编写

## 速查

- Components 面板 = Vue 组件树（非 DOM），搜索 / 选中 / 高亮
- 状态分类：props｜setup（`<script setup>` 的 ref/reactive/computed）｜data｜computed｜injected
- 编辑：双击状态值直接改，响应式实时更新视图
- 定位：选组件高亮页面；点 Inspector 选页面元素反查组件
- 浏览器扩展版可在 Console 用 `$vm` 引用选中组件

## 组件树

Components 面板展示 Vue 的**组件层级**（如 `App > Layout > Sidebar > Menu`），而非编译后的 DOM。

- 选中组件，页面对应区域高亮
- 搜索框按组件名过滤
- 既有你的组件（`.vue` 单文件组件），也有库组件（router-view 等）

## 检查组件状态

选中组件，右侧按类别展示其所有响应式状态：

| 类别 | 来源 |
| --- | --- |
| **props** | 父组件传入的属性 |
| **setup** | `<script setup>` 中的 `ref` / `reactive` / `computed` |
| **data** | Options API 的 `data()` |
| **computed** | 计算属性及其当前值 |
| **injected** | `inject` 注入的值 |

> Vue 3 `<script setup>` 暴露的响应式数据归在 **setup** 分类下，能看到每个 `ref`/`reactive` 的实时值。

## 编辑状态

**双击状态值即可编辑**，依托 Vue 响应式，视图**实时更新**：

```vue
<script setup>
import { ref } from "vue";
const count = ref(0); // DevTools 里直接把 count 改成 99，视图立即变
const user = reactive({ name: "Ada", vip: false });
</script>
```

- 改 `ref` / `reactive` 字段验证不同状态下的 UI
- 改 props 模拟父组件不同传值
- 对象 / 数组可展开逐字段编辑

> 想看「vip 用户的界面」？直接把 `user.vip` 改成 `true`，免改代码。

## 双向定位

- **组件 → 页面**：选中组件，页面高亮其渲染区域
- **页面 → 组件**：用 Inspector（点选图标）点页面元素，反查是哪个组件
- **组件 → 源码**：配合 Inspector 的 Open in Editor 跳到 `.vue` 源文件（见 [Inspector 与 Graph](./inspector-graph.md)）

## 下一步

Pinia 状态与路由调试见 [Pinia 与路由](./pinia-router.md)。
