---
layout: doc
outline: [2, 3]
---

# Element.animate 与关键帧：语法 / 格式 / EffectTiming

> 基于 Web Animations API（2026 浏览器基线）· 核于 2026-07

## 速查

- **两参数回顾**：`element.animate(keyframes, options)`——`keyframes` 数组或 object，`options` 数字或配置对象，返回一个 `Animation` 对象。
- **等价三步写法**：`Element.animate()` 是语法糖，本质等价于 `new KeyframeEffect(el, keyframes, options)` → `new Animation(effect, document.timeline)` → `animation.play()`。
- **`options` 传数字**：`el.animate(keyframes, 2000)` 等价于 `el.animate(keyframes, { duration: 2000 })`。
- **多动画共存**：一个元素上可同时挂多个动画效果（各自独立 `Animation` 实例），除非作用同一属性触发 `composite` 合成。
- **关键帧数组形式**：
  - 至少 2 帧；不写 `offset` 时在相邻帧间**均匀分布**（3 帧不写 offset 则为 0 / 0.5 / 1）。
  - `offset` 必须单调递增，取值 0~1，对应 CSS `@keyframes` 的百分比。
  - 帧级 `easing` 只作用于"这一帧到下一帧"，与 `options.easing`（整体）不同。
  - `composite` 也可逐帧指定，覆盖效果级默认值。
- **关键帧 object 形式**：
  - 属性名 → 值数组，如 `{ opacity: [0, 0.9, 1] }`。
  - **隐式关键帧**：不同属性的数组长度可以不一致，各属性独立均匀分布 offset，互不影响。
  - `offset` 数组长度可比属性数组少 1（隐式补 1），`easing` 数组不够时循环复用。
  - 乱填不递增的 offset 会直接抛错或被规范化，不是静默忽略。
- **两种格式无能力差异**：纯粹是书写习惯——数组形式贴近 CSS `@keyframes` 的逐帧对象直觉，object 形式写"只有 2 个值"的简单补间更紧凑。
- **CSS 属性名转驼峰**：`background-color` → `backgroundColor`；`float`/`offset` 是保留字，要写 `cssFloat`/`cssOffset`。
- **规范化关键帧**：`KeyframeEffect.getKeyframes()` 返回的就是数组形式，含浏览器计算出的 offset，可用来调试 object 形式实际生效的插值点。
- **EffectTiming 9 项选项**：`duration`/`easing`/`iterations`/`iterationStart`/`direction`/`fill`/`delay`/`endDelay`/`composite`，完整默认值见下方表格。
- **`duration` 规范默认值是 `"auto"`**：实践中不设置时长动画不会播放，不是数字 0。
- **单位是毫秒**：CSS 是秒，两者不通用，是最常见笔误来源。
- **默认缓动 `"linear"`**：CSS 动画默认 `"ease"`，迁移时容易漏设导致视觉手感不同。
- **`direction` 四值**：`normal`/`reverse`/`alternate`/`alternate-reverse`。
- **`fill` 四值**：`none`（默认，前后都不应用样式）/`forwards`（保持终态）/`backwards`（应用首帧）/`both`（两者都要）。
- **`fill` 默认值 `none` 会回弹**：全场最高频坑，动画结束元素瞬间跳回原始样式，很多人误以为会停在最后一帧。
- **`iterations` 无限循环用 `Infinity`**（JS 关键字），不是字符串 `"infinite"`（CSS 才用字符串关键字，两边语法不通用）。
- **`iterationStart`**：从哪个"进度点"开始算第一次迭代，默认 0。
- **`delay`/`endDelay`**：开始前/结束后延迟，单位毫秒；`finished` Promise 要等 `endDelay` 结束才 resolve。
- **Effect timing 三阶段**：`delay`（开始前延迟）→ `active`（真正播放的活跃区间）→ `endDelay`（结束后延迟）。
- **`commitStyles()` 预告**：解决"`fill` 默认不保留终态"的另一种姿势是"先 `commitStyles()` 再 `cancel()`"，完整用法见[下一页](./animation-control)。
- **CSS 迁移三大陷阱**：`duration` 秒→毫秒漏乘 1000；`easing` 默认值从 `ease` 变 `linear`；`iterations: infinite` 误写成字符串。

## 一、Element.animate()：完整语法与等价写法

`Element.animate()` 只是"手工三步"的语法糖，理解这三步能帮你看透 `Animation`/`KeyframeEffect` 的关系：

```js
// 语法糖：一步到位
const anim = el.animate(keyframes, options);

// 等价的手工三步（拆开看清楚底层三层对象）
const effect = new KeyframeEffect(el, keyframes, options); // ① 效果：关键帧 + timing
const animation = new Animation(effect, document.timeline); // ② 播放器：挂到时间轴上
animation.play(); // ③ 播放
```

`options` 也可以直接传数字，只设置 `duration`：`el.animate(keyframes, 2000)`。一个元素上可以同时挂多个独立的动画效果——它们互不覆盖，除非作用在同一属性上触发 `composite` 合成（见 [Timeline 与合成](./timeline-and-composite)）。

## 二、关键帧格式：数组 vs object

**数组形式**（规范型，`getKeyframes()` 返回的就是这种）：

```js
el.animate(
  [
    { opacity: 1, easing: "ease-out" }, // from，帧级 easing
    { opacity: 0.1, offset: 0.7, easing: "ease-in" }, // offset 0~1 之间
    { opacity: 0 }, // to
  ],
  2000,
);
```

至少 2 帧；不写 `offset` 时在相邻帧间均匀分布；`offset` 必须单调递增；帧级 `easing` 只作用于"这一帧到下一帧"，和整体 `options.easing` 的作用域不同；`composite` 也可以逐帧指定，覆盖效果级默认值。

**object 形式**（属性名 → 值数组）：

```js
el.animate(
  {
    opacity: [0, 0.9, 1],
    backgroundColor: ["red", "yellow", "green"],
    offset: [0, 0.8], // 隐式补 1 → [0, 0.8, 1]
    easing: ["ease-in", "ease-out"], // 不够时循环复用
    composite: ["add", "replace"],
  },
  2000,
);
```

**隐式关键帧（implicit keyframes）**：object 形式下不同属性的数组长度可以不一致，各属性独立均匀分布 offset，互不影响。CSS 属性名要转驼峰：`background-color` → `backgroundColor`；`float`/`offset` 是保留字，要写 `cssFloat`/`cssOffset`。两种格式没有能力差异，纯粹是书写习惯——数组形式更贴近 CSS `@keyframes` 的"逐帧对象"直觉，object 形式写"只有 2 个值"的简单补间更紧凑。

## 三、EffectTiming 选项详解

```js
{
  duration: 3000,       // 毫秒，规范默认 "auto"（不设时长动画不播，非数字 0）
  easing: "linear",     // 默认 "linear"（注意：CSS animation 默认是 "ease"，不一样！）
  iterations: 1,        // 默认 1，Infinity 表示无限循环
  iterationStart: 0,    // 从哪个"进度点"开始算第一次迭代，默认 0
  direction: "normal",  // normal / reverse / alternate / alternate-reverse
  fill: "none",         // none / forwards / backwards / both（必考坑，见下节）
  delay: 0,             // 开始前延迟，毫秒
  endDelay: 0,          // 结束后延迟，毫秒（finished Promise 要等 endDelay 结束）
  composite: "replace", // replace / add / accumulate（详见 Timeline 与合成）
}
```

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `duration` | `"auto"`（实践按 0 不播放处理） | 毫秒，CSS 对应单位是秒 |
| `easing` | `"linear"` | 支持 `ease`/`ease-in`/`ease-in-out`/`cubic-bezier()`/`steps(n, jump-term)` |
| `iterations` | `1` | `Infinity` 表示无限循环 |
| `iterationStart` | `0` | 从动画进度的哪个百分比开始第一轮 |
| `direction` | `"normal"` | `normal`/`reverse`/`alternate`/`alternate-reverse` |
| `fill` | `"none"` | `none`/`forwards`/`backwards`/`both` |
| `delay` | `0` | 开始前延迟，毫秒 |
| `endDelay` | `0` | 结束后延迟，毫秒 |
| `composite` | `"replace"` | `replace`/`add`/`accumulate` |

`direction` 四值语义：`normal`（正常）、`reverse`（反向）、`alternate`（奇数次正、偶数次反）、`alternate-reverse`（反过来交替）。

## 四、`fill` 高频坑深挖

不设置 `fill: "forwards"`（或 `"both"`）时，动画一结束元素会瞬间跳回"无动画时的原始样式"，视觉上像"闪一下又弹回去"。很多初学者以为动画会"停在最后一帧"，实际必须显式声明 `fill`：

```js
const anim = el.animate([{ opacity: 0 }, { opacity: 1 }], 500);
// 500ms 后 opacity 瞬间跳回动画前的值——很多人第一次都会被这个行为"背刺"

const anim2 = el.animate([{ opacity: 0 }, { opacity: 1 }], {
  duration: 500,
  fill: "forwards", // 显式声明才会停在终态
});
```

四值完整语义：`none`（默认，动画前后都不应用样式）、`forwards`（结束后保持终态）、`backwards`（开始前应用首帧，常配合 `delay` 让元素在延迟期间就"预显示"首帧）、`both`（两者都要）。直接用 `fill: "forwards"` 会让动画对象及其合成层一直驻留在内存中；更完整的善后方案（`commitStyles()` + `persist()` + `cancel()` 的组合拳）留到下一页 [Animation 播放控制](./animation-control) 展开。
