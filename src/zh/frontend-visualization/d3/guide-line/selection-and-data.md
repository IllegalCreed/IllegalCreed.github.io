---
layout: doc
outline: [2, 3]
---

# 选择集与数据绑定：selection 与 data join

> 基于 D3.js v7.9（d3-selection@3）· 核于 2026-07

## 速查

- **三个入口**：
  - `d3.select("#chart")`：首个匹配元素（也可直接传 DOM 节点）
  - `d3.selectAll("p")`：所有匹配（也可传 NodeList / 数组）
  - `d3.create("svg")`：创建游离（detached）元素，返回选择集
- **`select` vs `selectAll`（必考）**：
  - `selection.select(sel)`：每元素选 1 个后代；**不改分组结构**；**把父数据传播给子元素**
  - `selection.selectAll(sel)`：每元素选全部后代；**按父元素重新分组**（嵌套选择集）；**不继承数据**，须 `.data()` 重绑
- **修改方法**（值可为常量或函数 `(d, i, nodes)`，`this === nodes[i]`，**箭头函数拿不到 this**）：
  - `attr(name, v)` / `style(name, v)`（CSS 需带单位，"3px" 而非 3）/ `property(name, v)`（表单 value/checked 等 attr 摸不到的）
  - `classed("a b", bool)` / `text(v)` / `html(v)`（**仅 HTML 元素，SVG 不支持**）
  - `append(type)` / `insert(type, before)` / `remove()` / `clone(deep)` / `raise()`（置顶）/ `lower()`（置底）
  - 不传值即读取（返回第一个非空元素的值）
- **顺序**：`sort(cmp)` 排数据并重插 DOM；`order()` 按选择集顺序重插（数据已排序时更快）
- **控制流**：
  - `each(fn)`：每元素调用一次（元素级逻辑）
  - **`call(fn, ...args)`：把整个 selection 传给 fn 调用一次并返回 selection**——axis / brush / zoom / drag 全靠它
  - `node()` / `nodes()` / `empty()` / `size()`；selection 可迭代（`[...selection]`）
- **事件（v6+）**：`on("click.ns", (event, d) => {})`；移除传 null（`on(".ns", null)` 清整个命名空间）；`d3.pointer(event, target)` 取相对坐标；`dispatch(type, {bubbles, cancelable, detail})`
- **data join 三态**：`data(data, key)` 返回 **update** 选择集，同时定义 enter / exit：
  - `enter()`：有数据无元素 → 占位节点，用 `.append()` 实体化
  - `exit()`：有元素无新数据 → 通常 `.remove()`
  - 无 key 按**索引**对位；有 key 按字符串匹配（object constancy，动画正确性的关键）
  - update / enter 按**数据顺序**返回，exit 保持绑定前顺序；用 key 后 DOM 顺序可能乱，补 `.order()`
  - 数据存在元素的 `__data__` 属性上；多分组时 data 可为函数 `(parentDatum, i) => array`（嵌套绑定）
- **`join()` 新范式（v5.8+ 首选）**：`join("circle")` ≡ enter.append + update 恒等 + exit.remove；三回调形式返回 enter+update 合并集
- **旧范式（v4 教程）**：`enter().append().merge(update)`——merge 按索引合并两选择集，join() 内部即用它
- **`datum(value)`**：直接设值**不做 join**、无 enter/exit；清数据用 `datum(null)`（`data()` 清不掉）
- **enter 占位节点指向父元素**：`selectAll` 之前必须有确定的父容器，否则 enter.append 挂错地方
- **防坑**：给数据元素专属 class（`selectAll("rect.bar")` + `attr("class", "bar")`），避免选中轴里的同名元素

## 一、三个入口

```js
d3.select("#chart")   // 首个匹配元素（也可直接传 DOM 节点）
d3.selectAll("p")     // 所有匹配（也可传 NodeList / 数组）
d3.create("svg")      // 创建游离（detached）元素，返回选择集
```

`d3.create` 适合先在内存里把整棵 SVG 搭好、最后一次性挂载；服务端 / Worker 中配 JSDOM 也能跑 selection；甚至可以 `d3.select(document.createElement("custom"))` 把 data join 当纯状态机用——detached 元素只负责记录 enter/exit，再手动画到 Canvas。

## 二、select vs selectAll：分组与数据传播（必考）

| | `selection.select(sel)` | `selection.selectAll(sel)` |
| --- | --- | --- |
| 每元素选多少 | 1 个后代 | 全部后代 |
| 分组结构 | 不变 | **按父元素重新分组**（嵌套选择集） |
| 数据 | **父数据传播给子元素** | **不继承**，须 `.data()` 重绑 |

选择集内部由分组（groups）与父节点（parents）构成，`selectAll` 的重新分组正是 data join 的基础。嵌套绑定（矩阵 → `tr` → `td` 的表格渲染）就构建在这之上：多分组选择集的 `data()` 可以传函数 `(parentDatum, i) => array`，每组用父数据算出自己的子数组。

## 三、修改选择集

```js
svg.selectAll("circle")
    .attr("r", 5)                          // 常量
    .attr("cx", (d, i, nodes) => i * 20)   // 函数：d=数据 i=索引 nodes=组内节点
    .style("stroke-width", "3px")          // CSS 需带单位（"3px" 而非 3）
    .classed("highlight", true)            // 批量切换 class
    .text(d => d.label);

d3.select("input").property("checked", true); // 表单 value/checked 等 attr 摸不到的
selection.attr("r");                          // 不传值即读取（第一个非空元素的值）
```

- 值函数签名 `(d, i, nodes)`，`this === nodes[i]`——**箭头函数拿不到 this**，需要 this 时用 `function`，或用 `nodes[i]` 代替。
- `html(v)` **只支持 HTML 元素，SVG 元素不可用**。
- 结构操作：`append(type)` 尾插、`insert(type, before)` 指定位置插入、`remove()` 删除、`clone(deep)` 克隆、`raise()` 移到父末尾（视觉置顶）、`lower()` 置底。
- 顺序控制：`sort(cmp)` 按比较器排数据并重插 DOM；`order()` 按选择集当前顺序重插（数据已排序时比 sort 快）。

## 四、控制流：each 与 call

- `each(fn)`：每个元素调用一次 fn，this 为该元素——写元素级逻辑。
- `call(fn, ...args)`：**把整个 selection 传给 fn 调用一次，并返回 selection 本身**——链式复用的关键范式，axis / brush / zoom / drag 全靠它安装：

```js
svg.append("g").call(d3.axisBottom(x)); // 等价于 d3.axisBottom(x)(svg.append("g"))
```

- 查询：`node()` / `nodes()` / `empty()` / `size()`；selection 本身可迭代（`[...selection]`）。

## 五、事件系统（v6+ 签名）

```js
selection
    .on("click", (event, d) => { /* v6+：事件对象在前，数据在后 */ })
    .on("mouseenter.tip", showTip)   // .ns 命名空间，便于分组管理
    .on(".tip", null);               // 移除 tip 命名空间下全部监听

const [px, py] = d3.pointer(event, svg.node()); // 相对目标的坐标（替代 v5 的 d3.mouse）
selection.dispatch("custom", {bubbles: true, cancelable: true, detail: payload});
```

v5 → v6 是 D3 史上最大的事件断层（必考）：监听器从 `function(d, i)` 改为 `(event, d)`；`d3.event` 全局对象**已删除**，旧代码 `d3.event.x` 在 v6+ 直接崩；`d3.mouse` 改为 `d3.pointer`。但需要 `d3.select(this)` 的场合仍必须用 `function`。

## 六、data join：enter / update / exit 三态

D3 的心脏。`data()` 把数据数组与选择集里的元素做匹配，产生三个集合：

```js
const u = svg.selectAll("circle").data(data, d => d.id); // u = update：数据、元素都有
u.enter();  // 有数据、无元素 → 占位节点，用 .append() 实体化
u.exit();   // 有元素、无新数据 → 通常 .remove()
```

- 无 key 时按**索引**对位绑定；有 key 按 key 字符串匹配。
- update / enter 按**数据顺序**返回；exit 保持绑定前顺序。
- 数据被存到元素的 `__data__` 属性上（「粘」在元素上，重新选择仍在）。
- **enter 占位节点的 parent 指向父元素**——所以 `selectAll` 之前必须有确定的父容器。常见坑：直接 `d3.selectAll("div").data(...)` 没有父容器，enter.append 挂错地方。

## 七、join()：现代首选写法

```js
// 简写：join("circle") ≡ enter.append("circle") + update 恒等 + exit.remove()
svg.selectAll("circle").data(data).join("circle")
    .attr("cx", d => x(d.x));

// 三回调完整形式（返回 enter+update 合并选择集）
svg.selectAll("circle")
  .data(data, d => d.id)
  .join(
    enter => enter.append("circle").attr("fill", "green"),   // 新进场
    update => update.attr("fill", "blue"),                   // 留场更新
    exit => exit.transition().attr("r", 0).remove()          // 离场动画
  )
    .attr("stroke", "black"); // 作用于 enter+update 合并集
```

- enter / update 回调若返回 transition，其底层选择集仍会被合并返回；exit 回调的返回值不被使用。
- 旧范式 `enter().append().merge(update)`（v4 及更早教程常见）：`merge` 按索引合并两个选择集（同索引都非空时取当前者）——`join()` 内部就是用它实现的，读旧代码需要认识。

## 八、key 函数与 object constancy

```js
// key 函数对两侧各评估一次：
//   已有元素：d = 旧数据，this = 元素
//   新数据：  d = 新数据，this = 父节点
svg.selectAll(".item")
  .data(data, function(d) { return d ? d.name : this.id; }); // 经典写法
```

- key 匹配保证**同一条数据始终对应同一个元素**（object constancy）——更新动画正确性的关键：无 key 按索引绑定时，数据一重排动画就「张冠李戴」。
- 用了 key 后 DOM 顺序可能与数据顺序不一致，需要 `.order()` 重排；exit 序与 update 序不同属正常现象。

## 九、datum：不做 join 的直接绑定

- `datum(value)` 直接把值绑到元素上，**不做 join、没有 enter/exit**——适合单元素场景（如整条折线的 `path` 绑整个数组）。
- 清数据用 `datum(null)`；`data()` 不能清数据。

## 十、易错点

- **enter 为空 / 数量不匹配**：`selectAll("rect")` 把轴里已有的 rect 也选进来了——给数据元素专属 class（`selectAll("rect.bar")` + `attr("class", "bar")`），或直接用 `join()`。
- **箭头函数丢 this**：`(d, i, nodes)` 里用 `nodes[i]` 代替，或改 `function`。
- **v5/v6 事件写法混用**：`function(d) { d3.event.x }` 在 v6+ 直接崩；一律 `(event, d) =>`。
- **`html()` 用在 SVG 上**：仅 HTML 元素支持。
- **style 数值忘单位**：要 `"3px"` 不是 `3`。

## 下一步

元素能进能出之后，下一个问题是「数据值怎么变成像素位置」——见[比例尺与坐标轴](./scales-and-axes)。
