---
layout: doc
---

# Sortable.js

Sortable.js 是一个**轻量、无第三方依赖**的可拖拽重排序 JavaScript 库：基于原生 **HTML5 Drag & Drop API** 实现桌面端拖拽，并为不支持该 API 的场景（主要是移动端触摸）提供**自动降级的 Fallback 模拟拖拽**，核心场景是列表内重排序、跨列表拖放、多列表互拖。项目历史悠久（GitHub 3 万+ star），API 自 v1.x 起长期没有破坏性变更，当前版本 **v1.15.7**（2026-02-11 发布，npm 实测）；上一版 1.15.6 到 1.15.7 之间维护节奏低频（曾中断约 14 个月才出新版），已进入"功能稳定、慢维护"的成熟期，是"列表拖拽排序"场景的事实标准库（尤其在非 React 技术栈里）。

## 评价

**优点**

- **零依赖**：不需要 jQuery，`new Sortable(el, options)` 一行起步
- **API 极简但表达力够用**：`group`/`pull`/`put` 把"跨列表拖放"抽象成几个配置项，覆盖绝大部分实际业务需求
- **事件模型完整**：区分 `onAdd`/`onUpdate`/`onRemove`/`onSort` 语义清晰，业务侧按需监听即可
- **框架无关**：vanilla JS 核心 + 官方/社区维护的 Vue/React/Angular/Knockout/Ember/Meteor 封装层，技术栈迁移成本低
- **移动端开箱即用**：不支持原生 HTML5 DnD 的触摸设备自动降级为 Fallback 模拟拖拽，无需额外适配代码

**局限**

- **历史包袱**：基于原生 HTML5 DnD API，继承了该 API 的老问题——移动端原生不支持（需 Fallback）、不同浏览器拖拽视觉有细微差异、`delay` 在 IE/Edge 原生 DnD 下无法生效（官方 README 原文警告）
- **真实 DOM 与虚拟 DOM 存在张力**：拖拽直接移动真实 DOM 节点，与 React/Vue 的虚拟 DOM diff 天然冲突，需框架封装层（`vuedraggable`/`react-sortablejs`）协调
- **React 封装官方自曝未达生产就绪**：`react-sortablejs` README 原文明确写"this is not considered ready for production"，选型前需评估此风险声明
- **无内置可访问性支持**：没有键盘拖拽，这正是 dnd-kit 主打的差异化优势之一

适合"给我一个能跑的列表拖拽"这类常规需求——多框架并存（Vue/Angular/vanilla）或非 React 技术栈首选 Sortable.js；若在 React 生态中要极致可定制、强键盘可访问性、精细碰撞检测，社区更倾向 **dnd-kit**（见[参考页](./reference)选型对比）。

## 本叶地图

- [入门](./getting-started) —— 定位（轻量拖拽排序 vs 原生 DnD/dnd-kit）、安装与引入、第一个排序列表、心智模型
- [Options 与样式](./guide-line/options-and-styling) —— 核心 options 全解、三态样式类、handle/filter 拖拽手柄与排除、Fallback 与移动端
- [group 跨列表与事件](./guide-line/group-and-events) —— group 字符串/对象形式、pull/put 精细控制、事件系统与事件对象全字段、onMove 自定义插入
- [方法、插件与框架集成](./guide-line/methods-plugins-framework) —— 实例方法与 Store 持久化、MultiDrag/Swap 插件、Vue（vuedraggable）/React（react-sortablejs）/Angular 集成
- [参考](./reference) —— options/事件/方法速查表 + 选型对比 + 易错点清单 + 资源链接

## 文档地址

[Sortable.js 官方示例站](https://sortablejs.github.io/Sortable/)

## GitHub 地址

[SortableJS/Sortable](https://github.com/SortableJS/Sortable)

## 幻灯片地址

<a href="/SlideStack/sortablejs-slide/" target="_blank">Sortable.js</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=sortable-js" target="_blank" rel="noopener noreferrer">Sortable.js 测试题</a>
