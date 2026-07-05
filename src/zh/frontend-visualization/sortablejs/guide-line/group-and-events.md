---
layout: doc
outline: [2, 3]
---

# group 跨列表拖放与事件系统

> 基于 Sortable.js v1.15.7（npm 实测最新版）· 核于 2026-07

## 速查

- **`group` 字符串简写**：两个列表 `group` 值设为相同字符串即可互拖，等价于 `{ name: "xxx" }`（`pull`/`put` 均取默认值 `true`）。
- **`group` 对象形式**：`{ name, pull, put }`，用于细粒度控制"允许拖出去吗"（`pull`）与"允许别人拖进来吗"（`put`）。
- **`pull`**：`true`（默认，可拖出）/ `false`（不可拖出）/ `['groupA','groupB']`（只能拖到指定组）/ `'clone'`（拖出时保留原位副本，即克隆而非移动）/ 函数 `(to, from) => boolean`。
- **`put`**：`true`（默认，可接受任意来源）/ `false`（禁止拖入）/ `['groupA']`（只接受指定组白名单）/ 函数 `(to, from, dragEl) => boolean`。
- **`revertClone`**：`pull: 'clone'` 模式下，若克隆元素被拖到"非法"位置（未被目标列表接受），是否播放动画归位。
- **忘记设置 `group` 是最常见的坑**：两个列表要互拖，`name` 必须完全一致，漏配会表现为"看起来能拖起来，但就是放不进去"。
- **事件总览**：`onChoose`/`onUnchoose`（选中/取消选中）、`onStart`/`onEnd`（拖拽开始/结束）、`onAdd`/`onUpdate`/`onRemove`/`onSort`（结果性事件）、`onFilter`/`onMove`/`onClone`/`onChange`（辅助性事件）。
- **`onEnd` 事件对象是最全的**，字段包括 `item`/`to`/`from`/`oldIndex`/`newIndex`/`oldDraggableIndex`/`newDraggableIndex`/`clone`/`pullMode`，其余结果性事件（`onAdd`/`onUpdate`/`onRemove`/`onSort`）共享同一套字段。
- **`onAdd` vs `onUpdate` vs `onRemove` 三选一语义**：元素从其他列表拖入本列表触发 `onAdd`；同列表内排序改变触发 `onUpdate`；元素被拖到其他列表（从本列表移除）触发 `onRemove`——三者互斥，一次拖拽只会触发其中之一（外加更粗粒度的 `onSort`）。
- **`onSort` 是"总闸"事件**：只要发生 `onAdd`/`onUpdate`/`onRemove` 任一种变化就会触发，适合统一做"保存当前顺序"这类不关心具体类型的逻辑。
- **`onMove` 返回值语义（必考）**：`false` 取消本次移动；`-1` 强制插入到目标之前；`1` 强制插入到目标之后；`true`/`void`（不返回）保持默认插入位置。
- **`oldIndex`/`newIndex` vs `oldDraggableIndex`/`newDraggableIndex`**：前者是在全部子节点中的索引，后者只计算被 `draggable` 选项匹配的元素，容器里混有不可拖拽元素时两者会不同。
- **`onClone`**：`evt.item` 是原元素，`evt.clone` 是克隆出的元素，常用于克隆场景下二次定制克隆内容。
- **`onChange`**：拖拽**过程中**位置变化即触发（尚未松手），与拖拽结束后才触发的 `onSort` 是两个不同阶段的事件，容易混淆。

## 一、group：字符串简写 vs 对象形式

最简单的跨列表拖放只需要给两个列表设置相同的 `group` 字符串：

```javascript
// 字符串简写：两个列表 group 值相同即可互拖
Sortable.create(listA, { group: "shared" });
Sortable.create(listB, { group: "shared" });
```

这等价于 `group: { name: "shared" }`——`pull`/`put` 都会取默认值 `true`，也就是两个列表可以任意互相拖入拖出，没有任何限制。真实业务里更常见的是需要精细控制"谁能拖出、谁能接收"，这时就要展开成对象形式：

```javascript
const listA = Sortable.create(document.getElementById("source"), {
  group: {
    name: "workflow",
    pull: "clone", // 拖出时保留原位副本（克隆而非移动）
    put: false, // 禁止其他列表的元素拖入本列表
  },
  animation: 150,
});

const listB = Sortable.create(document.getElementById("target"), {
  group: {
    name: "done",
    pull: true,
    put: ["workflow"], // 只接受来自 'workflow' 组的元素
    revertClone: true, // 若克隆的元素被拖到"非法"位置，动画归位
  },
  animation: 150,
});
```

这个例子模拟的是"任务看板"场景：`source` 列表拖出时是复制（原任务模板保留在原位），`done` 列表只接受来自 `workflow` 组的卡片、且自身不允许被拖出。

## 二、pull / put 精细控制

`pull` 决定"本列表的元素能不能被拖出去"，`put` 决定"本列表能不能接受别的列表拖进来的元素"，两者都支持布尔值、数组白名单、以及函数式动态判断：

```javascript
// pull/put 也支持函数式动态判断——依据运行时状态而非静态配置
const listC = Sortable.create(document.getElementById("conditional"), {
  group: {
    name: "conditional",
    pull(to, from) {
      return to.el.id !== "locked-list"; // 目标不是锁定列表才允许拖出
    },
    put(to, from, dragEl) {
      return dragEl.dataset.type === "allowed"; // 只接受特定 data-type 的元素
    },
  },
});
```

- `pull`：`true`（默认，可自由拖出）/ `false`（禁止拖出）/ `['groupA','groupB']`（只能拖到白名单里的组）/ `'clone'`（拖出时元素在原列表克隆一份，原列表不受影响）/ 函数（依据 `to`/`from` 两个 Sortable 实例的运行时状态动态判断）。
- `put`：`true`（默认，接受任意来源）/ `false`（完全禁止拖入）/ `['groupA']`（白名单，只接受列出的组）/ 函数（依据 `to`/`from`/`dragEl` 判断，可读取被拖元素的 `dataset` 等属性做业务级过滤）。
- `revertClone`：仅在 `pull: 'clone'` 场景下有意义——如果克隆出来的元素最终被拖到一个不接受它的位置（`put` 判定为 `false`），设为 `true` 会让这份克隆播放动画归位到源列表，而不是留在半空或直接消失。

**忘记设置 `group` 是跨列表功能里最常见的坑**：两个列表要互拖，`name` 必须完全一致（大小写、拼写都要对上）；漏配或写错的表现是"两个列表看起来都能拖动，但元素就是放不进对方列表"，容易被误判为"库有 bug"，实际上只是配置没对齐。

## 三、事件系统总览与 onEnd 事件对象全字段

Sortable.js 的事件回调直接作为 options 的一部分传入，覆盖拖拽生命周期的每个阶段：

```javascript
new Sortable(el, {
  onChoose(evt) {
    evt.oldIndex;
  }, // 元素被选中（mousedown/tapstart 那一刻）
  onUnchoose(evt) {
    /* 取消选中，属性同 onEnd */
  },
  onStart(evt) {
    evt.oldIndex;
  }, // 真正开始拖拽（已发生位移）
  onEnd(evt) {
    // 拖拽结束——属性最全的事件对象，以下字段其他结果性事件同样具备
    evt.item; // 被拖拽的 HTMLElement
    evt.to; // 目标列表容器
    evt.from; // 源列表容器
    evt.oldIndex; // 原索引（在旧父级中，计算全部子节点）
    evt.newIndex; // 新索引（在新父级中，计算全部子节点）
    evt.oldDraggableIndex; // 原索引（仅计算被 draggable 选项匹配的元素）
    evt.newDraggableIndex; // 新索引（仅计算被 draggable 选项匹配的元素）
    evt.clone; // 克隆元素（pull: 'clone' 模式下存在）
    evt.pullMode; // "clone" | true | false | undefined
  },
});
```

`oldIndex`/`newIndex` 与 `oldDraggableIndex`/`newDraggableIndex` 的差异只在容器里混有"不参与排序的元素"时才会显现——比如列表里插了一条不可拖拽的分隔线，分隔线也会被计入 `oldIndex`/`newIndex`，但不会被计入 `oldDraggableIndex`/`newDraggableIndex`。业务代码同步数据顺序时，通常应该用后者，避免索引因非拖拽元素而产生偏移。

## 四、onAdd / onUpdate / onRemove / onSort：结果性事件如何选择

这四个事件都在拖拽**结束**后触发，事件对象字段与 `onEnd` 完全一致，区别只在"触发条件"：

```javascript
new Sortable(el, {
  onAdd(evt) {
    /* 元素从其他列表拖入本列表时触发 */
  },
  onUpdate(evt) {
    /* 同一列表内排序发生改变时触发 */
  },
  onRemove(evt) {
    /* 元素被拖到其他列表、从本列表移除时触发 */
  },
  onSort(evt) {
    /* add / update / remove 任一种排序变化都会触发——"总闸"事件 */
  },
});
```

三者是互斥关系——一次拖拽结果只会精确匹配其中一种：跨列表拖入匹配 `onAdd`、同列表内部换位置匹配 `onUpdate`、跨列表拖出匹配 `onRemove`。如果业务只关心"顺序变了，得保存一下"而不关心具体是哪种变化，`onSort` 是更省心的选择——它在三者任一种情况下都会触发，不需要同时监听三个事件再各自写一遍保存逻辑。反过来，如果三种场景需要完全不同的业务处理（比如 `onAdd` 要调用"关联"接口、`onRemove` 要调用"解除关联"接口），就必须分开监听。

## 五、onMove：自定义插入逻辑

`onMove` 在拖拽移动过程中**持续触发**（不是拖拽结束才触发一次），返回值可以精确控制"允许还是拒绝插入到当前位置"：

```javascript
new Sortable(el, {
  onMove(evt, originalEvent) {
    evt.dragged; // 拖拽中的元素
    evt.draggedRect; // 其 DOMRect
    evt.related; // 当前参照的目标元素
    evt.relatedRect; // 目标元素 DOMRect
    evt.willInsertAfter; // 默认会插入到目标之后吗（boolean）
    originalEvent.clientY; // 鼠标位置

    // 返回值控制插入行为：
    // return false —— 取消本次移动（不允许放在此处）
    // return -1    —— 强制插入到目标之前
    // return 1     —— 强制插入到目标之后
    // return true / void —— 保持默认插入位置（按 direction 判断）
  },
});
```

典型用途是实现"某些位置不允许放置"的业务规则——例如根据 `evt.related` 的 `dataset` 判断目标位置是否被锁定，命中锁定条件就 `return false` 拒绝这次插入。这是四种返回值里最容易记混的一组，建议记忆口诀：**`false` 是"不让放"，`-1`/`1` 是"放在前面还是后面"，`true`/不返回是"随它去"**。

另外两个辅助事件：

```javascript
new Sortable(el, {
  onFilter(evt) {
    evt.item; // 尝试拖拽了被 filter 排除的元素
  },
  onClone(evt) {
    evt.item; // 原元素
    evt.clone; // 克隆出的元素，可在此对克隆内容做二次定制
  },
  onChange(evt) {
    evt.newIndex; // 拖拽过程中位置发生变化时触发（尚未松手，非结束时）
  },
});
```

`onChange` 与 `onSort` 很容易混淆：`onChange` 是拖拽**进行中**、每次占位符移动到新位置就触发一次；`onSort` 是拖拽**结束后**、确定最终结果才触发一次。前者适合做拖拽过程中的实时视觉反馈，后者才是持久化数据的正确时机。

group 与事件系统覆盖了"能不能跨列表拖"和"拖拽发生时怎么感知"，下一页进入编程式操作 Sortable 实例的方法、`MultiDrag`/`Swap` 插件，以及 Vue/React/Angular 的官方框架集成：[方法、插件与框架集成](./methods-plugins-framework)。
