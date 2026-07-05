---
layout: doc
outline: [2, 3]
---

# animate() 与参数：targets、Tween Value 与核心配置

> 基于 Anime.js v4.5（npm `animejs@4.5.0`，2026-06-22 发布）· 核于 2026-07

## 速查

- **两个参数**：`animate(targets, params)`——第一个是 targets，第二个是配置对象。
- **targets 四种类型**：CSS 选择器字符串 / DOM 元素 / JS 对象（`{value:0}`）/ 上述任意组合的数组；**v3→v4 没变的是类型，变的是位置**——从"配置对象里的 `targets` 字段"挪到了"函数第一个位置参数"。
- **可动画属性**：CSS 属性、CSS transform（`translateX`/`rotate`/`scale`/`skew` 等）、CSS 变量（`'--color'`）、JS 对象属性、HTML 属性、SVG 属性。
- **transform 渲染顺序（v4.4.0 起固定）**：`perspective > translate > rotate > scale > skew`，**不再跟随属性在配置对象里的书写顺序**——这是一条 breaking change。
- **Tween Value 六种写法**：数值 `100`、带单位自动换算 `'2rem'`、相对值 `'+=50'`/`'-=10'`、颜色 `'#ff0000'`/`'rgb()'`、CSS 变量引用 `'var(--x)'`、函数式 `(target, index, targets) => index * 50`。
- **函数式取值第三参数（v4.4.0 breaking change）**：从 `total`（数字）改成了 `targets`（数组），旧代码 `(el,i,total)=>total*10` 要迁移成 `(el,i,targets)=>targets.length*10`。
- **Tween 参数五件套**：`to`/`from`/`delay`/`duration`/`ease`。
- **`composition` 三值**：`replace`（默认，覆盖已有动画）/ `blend`（叠加）/ `none`（独立不干扰）。
- **`modifier`**：渲染前对计算值再加工的函数，比如取整、限幅。
- **属性级覆盖**：每条属性可以单独传对象/数组覆盖全局的 `to`/`from`/`ease`/`duration`/`delay`，比如 `rotate: { from: '-1turn' }`。
- **四个最基础播放参数**：`duration`（毫秒，默认 1000）、`delay`（默认 0）、`loop`（默认 0=不循环）、`autoplay`（默认 true）。
- **三个最常用回调**：`onComplete`/`onUpdate`/`onBegin`，写在配置对象里。
- **返回值**：`animate()` 返回一个动画实例，可调用 `.pause()`/`.play()`/`.resume()`/`.reverse()` 等方法控制；v4 里 `.play()` 恒定正向、`.reverse()` 恒定反向，恢复暂停要用 `.resume()`（v3 是切换语义）。
- **CSS 变量既能读也能写**：属性值可以引用 `'var(--x)'`，也可以直接动画一个自定义 CSS 变量 `'--color'`。
- **颜色/单位/相对值自动识别**：不需要额外声明类型，Anime.js 按值的写法自动判断怎么插值。
- **下一步**：吃透 targets 与参数后进入 [Timeline 与 stagger](./timeline-and-stagger)，把单个 `animate()` 编排成有序列的复合动画。

## 一、animate()：两个参数的核心心智

`animate(targets, params)` 是 Anime.js 的入口函数，第一个参数是 targets，第二个参数是描述"从哪到哪、多久、什么节奏"的配置对象：

```javascript
import { animate } from 'animejs';

const animation = animate('.square', {
  translateX: '17rem',
  rotate: 360,
  scale: [1, 1.5, 1],          // 数组 = 补间值关键帧
  backgroundColor: '#FF4B4B',
  duration: 1000,
  delay: 100,
  ease: 'outElastic(1, .6)',
  loop: true,
  alternate: true,
  onComplete: () => console.log('done'),
});
```

## 二、targets：四种类型，位置变了但类型没变

**targets 四种类型**：CSS 选择器字符串、DOM 元素、JS 对象（`{value:0}`）、以及上述任意组合的数组。这一点 v3→v4 **没有变**，很容易被误以为"整个 API 重写连 targets 类型都变了"——实际上只是 targets 从"配置对象里的一个字段"变成了"函数第一个位置参数"：

```javascript
animate('.square', { x: 100 });             // ① CSS 选择器字符串
animate(document.querySelector('.el'), { x: 100 }); // ② DOM 元素
animate({ value: 0 }, { value: 100, onUpdate: self => console.log(self.targets[0].value) }); // ③ JS 对象
animate(['.a', '.b', document.querySelector('.c')], { x: 100 }); // ④ 混合数组
```

## 三、可动画属性与 transform 渲染顺序

可动画属性覆盖面很广：CSS 属性、CSS transform（`translateX`/`rotate`/`scale`/`skew` 等）、CSS 变量（`'--color'`）、JS 对象属性、HTML 属性、SVG 属性都可以直接写进配置对象。

::: warning transform 渲染顺序自 v4.4.0 起被固定
`v4.4.0` 起 CSS transform 的渲染顺序被**固定为** `perspective > translate > rotate > scale > skew`，**不再跟随属性在配置对象里的书写顺序**——这是一条 breaking change，之前依赖"书写顺序即渲染顺序"的旧代码升级到 v4.4.0+ 需要重新核对视觉效果。
:::

## 四、Tween Value：六种写法

同一个属性的目标值，Anime.js 支持六种写法，自动识别类型无需额外声明：

```javascript
animate('.el', {
  a: 100,                                    // ① 数值
  b: '2rem',                                 // ② 带单位自动换算
  c: '+=50',                                 // ③ 相对值（也支持 '-=10'）
  d: '#ff0000',                              // ④ 颜色（也支持 'rgb()' 等写法）
  e: 'var(--x)',                             // ⑤ CSS 变量引用
  f: (target, index, targets) => index * 50, // ⑥ 函数式：逐目标动态求值
});
```

::: warning 函数式取值回调第三参数：v4.4.0 breaking change
`v4.4.0` 起函数式取值回调（以及 [stagger 的 `use` 回调](./timeline-and-stagger)）的第三个参数从 `total`（数字）改为了 `targets`（数组）。旧代码 `(el, i, total) => total * 10` 要迁移成 `(el, i, targets) => targets.length * 10`。
:::

## 五、Tween 参数：to / from / delay / duration / ease / composition / modifier

每条属性除了目标值本身，还可以精细控制这些参数：

- **`to` / `from`**：显式声明起止值。
- **`delay` / `duration` / `ease`**：该属性独立的时序与节奏，覆盖全局设置。
- **`composition`**：新动画与目标上已有动画的关系——`replace`（默认，覆盖）/ `blend`（叠加）/ `none`（独立不干扰）。
- **`modifier`**：渲染前对计算值再加工的函数，例如取整、限幅（`modifier: utils.round(2)` 常见写法）。

## 六、属性级覆盖：每条属性单独设置参数

全局参数（写在配置对象顶层）会被同名的属性级参数覆盖，这让"某个属性节奏不同于其他属性"变得很自然：

```javascript
animate('h2', {
  y: [
    { to: '-2.75rem', ease: 'outExpo', duration: 600 },
    { to: 0, ease: 'outBounce', duration: 800, delay: 100 },
  ],
  rotate: { from: '-1turn' },
  delay: stagger(50),   // 全局参数（stagger 详见下一篇）
  ease: 'inOutCirc',
});
```

`y` 属性用对象数组精细定义了每一段的 `to`/`ease`/`duration`/`delay`，`rotate` 只覆盖了 `from`，其余属性沿用顶层的全局 `delay`/`ease`。

## 七、基础播放参数与回调

四个最基础的播放参数：`duration`（毫秒，默认 1000）、`delay`（默认 0）、`loop`（默认 0=不循环）、`autoplay`（默认 true）。三个最常用回调：`onComplete`/`onUpdate`/`onBegin`，写在配置对象里即可。

`animate()` 的返回值是一个动画实例，暴露一套播放控制方法：

```javascript
const anim = animate('.box', { x: 100, autoplay: false });

anim.play();     // 恒定正向播放（v4 语义，非"切换"）
anim.pause();
anim.resume();   // 从暂停处继续（对应 v3 的"切换"心智）
anim.reverse();  // 恒定反向播放
```

::: tip v3 的 .play()/.reverse() 是切换语义，v4 不是
v3 里 `.play()`/`.reverse()` 会在播放/暂停之间切换；v4 里 `.play()` 恒定正向播放、`.reverse()` 恒定反向播放，要恢复暂停状态需要改用 `.resume()`。
:::

---

下一步进入 [Timeline 与 stagger](./timeline-and-stagger)：把单个 `animate()` 编排成有顺序、有交错的复合动画序列。
