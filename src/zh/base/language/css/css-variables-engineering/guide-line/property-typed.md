---
layout: doc
outline: [2, 3]
---

# `@property` 类型化变量

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- 作用：用 `@property` 给自定义属性**显式声明类型**，从而解锁**类型检查 + 兜底值 + 动画/过渡**
- 三个描述符：`syntax`（类型，必填）、`inherits`（是否继承，必填）、`initial-value`（初始值，多数情况必填）
- 语法：`@property --x { syntax: "<color>"; inherits: false; initial-value: red; }`
- 常用 `syntax`：`<color>` `<length>` `<percentage>` `<length-percentage>` `<number>` `<integer>` `<angle>`；万能 `"*"`
- 组合：`|` 二选一（`"<length> | <percentage>"`）、`+` 空格分隔列表、`#` 逗号分隔列表
- `"*"`（万能）时 `initial-value` 可省；**其余类型必须给** `initial-value`，否则整条规则失效
- `initial-value` 必须**计算独立**：`10px`/`45deg`/`rebeccapurple` 可，依赖父级的 `3em` 不可
- **解锁动画**：普通变量是「不透明文本」无法插值；注册成 `<color>`/`<angle>`/`<percentage>` 后才能 `transition`/`@keyframes`
- JS 等价：`CSS.registerProperty({ name, syntax, inherits, initialValue })`；JS 注册优先级高于 CSS
- Baseline：**2024**（newly available，自 2024-07 起广泛设备/浏览器可用）；老环境需降级

## 为什么需要给变量加类型

[上一页](./custom-properties) 的自定义属性有个天生短板：对浏览器来说，它的值只是**一串不透明的文本 token**。浏览器不知道 `--accent: #0066ff` 是个「颜色」，于是：

- **不能动画**：要在两个颜色 / 角度之间过渡，浏览器得知道怎么**插值**，可它压根不懂这串文本是什么类型；
- **不能类型校验**：你不小心把 `--gap` 赋成 `red`，浏览器照单全收，错误被推迟到使用处才暴露；
- **没有类型化兜底**：值非法时只能退回「计算值时非法」那套（退到初始/继承值）。

`@property` 就是来补这块的——它属于 CSS Houdini 家族，让你**显式登记一个自定义属性的类型、是否继承、初始值**。

## 基本语法

```css
@property --rotation {
  syntax: "<angle>";
  inherits: false;
  initial-value: 45deg;
}

@property --canBeAnything {
  syntax: "*";
  inherits: true;
}

@property --defaultSize {
  syntax: "<length> | <percentage>";
  inherits: true;
  initial-value: 200px;
}
```

变量名是个 `<dashed-ident>`（以 `--` 开头、大小写敏感）。三个描述符的含义：

### `syntax`（必填）

一个字符串，描述这个变量允许的值类型。常用取值：

| `syntax` | 含义 |
| --- | --- |
| `"<color>"` | 颜色 |
| `"<length>"` | 长度（`px`/`rem`/`em`…） |
| `"<percentage>"` | 百分比 |
| `"<length-percentage>"` | 长度或百分比 |
| `"<number>"` / `"<integer>"` | 数值 / 整数 |
| `"<angle>"` | 角度（`deg`/`turn`…） |
| `"*"` | 万能，接受任意 token 流（不做类型检查，也无法动画） |

还能用**组合符**拼出更复杂的类型：

- `|` —— 二选一：`"<length> | <percentage>"`
- `+` —— 空格分隔的列表：`"<length>+"`
- `#` —— 逗号分隔的列表：`"<color>#"`

### `inherits`（必填）

布尔值，决定这个变量**是否继承**。`inherits: false` 时，在某元素上设的值**只作用于该元素本身、不向下继承**——这和普通自定义属性「永远继承」是重要区别。

### `initial-value`（条件必填）

变量的初始值（兜底值）。规则：

- `syntax` 是 `"*"` 时**可省略**；
- `syntax` 是**任何其他类型**时**必须提供**，否则整条 `@property` 失效被忽略；
- 它必须是**计算独立**（computationally independent）的值——能不依赖其他值就算出计算值。`10px`、`2in`、`45deg`、`rebeccapurple` 都行；`3em`（依赖父级 `font-size`）**不行**。

::: warning 校验铁律
`@property` 要生效，`syntax` 和 `inherits` **两个都得写**——缺一个，整条规则非法被忽略；`syntax` 不是 `"*"` 时还必须有合法且「计算独立」的 `initial-value`。未知的额外描述符会被忽略，但**不会**让整条规则失效。
:::

## 杀手锏：让自定义属性能动画

这是 `@property` 最实用的能力。先看一个**做不到**的例子——纯自定义属性无法过渡渐变色：

```css
/* ❌ 不会有过渡效果：浏览器不知道 --stop 是百分比，无法插值 */
.bar {
  --stop: 25%;
  background: linear-gradient(to right, #00d230 var(--stop), #000 var(--stop));
  transition: --stop 0.4s;
}
```

把 `--stop` 用 `@property` 注册成 `<percentage>` 后，浏览器就懂得怎么在 `25%` 和 `100%` 之间平滑插值了：

```css
@property --progress {
  syntax: "<percentage>";
  inherits: false;
  initial-value: 25%;
}

.bar {
  display: inline-block;
  --progress: 25%;
  width: 100%;
  height: 5px;
  background: linear-gradient(
    to right,
    #00d230 var(--progress),
    black var(--progress)
  );
  animation: progressAnimation 2.5s ease infinite;
}

@keyframes progressAnimation {
  to {
    --progress: 100%;
  }
}
```

同理，注册成 `<angle>` 的变量能让 `conic-gradient` 的渐变旋转动起来、注册成 `<color>` 的变量能让颜色平滑过渡——这些都是过去 CSS 做不到、只能靠 JS 逐帧改的效果。

## 注册 vs 未注册：一张对照表

| | 未注册（普通 `--x`） | 已注册（`@property`） |
| --- | --- | --- |
| 浏览器视角 | 不透明的 token 流 | 有明确类型 |
| 能否动画 / 过渡 | **不能** | **能**（`"*"` 除外） |
| 是否继承 | 永远继承 | 由 `inherits` 显式决定 |
| 类型校验 | 无，用时才暴露 | 有，赋非法值即被拒 |
| 非法值兜底 | 退「计算值时非法」 | 可退到 `initial-value` |

## 配 @property 看「非法值」如何兜底

注册后的变量在收到非法值时，会优雅地退回到 `initial-value` 或继承值，而非污染整个属性。MDN 的经典例子：

```css
@property --itemSize {
  syntax: "<length> | <percentage>";
  inherits: true;
  initial-value: 200px;
}

ol {
  --itemSize: 100px; /* 合法 */
}
.three {
  --itemSize: large; /* ❌ "large" 不是长度/百分比 → 计算值时非法 */
}
li {
  width: var(--itemSize); /* .three 里退回继承到的 100px */
}
```

## JavaScript 等价写法

`@property` 有个完全等价的 JS API `CSS.registerProperty()`，适合在运行时动态注册：

```js
CSS.registerProperty({
  name: "--accent",
  syntax: "<color>",
  inherits: true,
  initialValue: "rebeccapurple",
});
```

::: tip 两处都注册时谁赢
如果同一个名字既在 CSS 用 `@property`、又在 JS 用 `CSS.registerProperty()` 注册，**JS 的注册优先**。另外，多条同名 `@property` 之间，**样式表里最后出现的那条**生效。
:::

## Baseline 与降级

`@property` 是 **Baseline 2024**（newly available）——自 2024 年 7 月起在主流浏览器的较新版本广泛可用，但旧设备 / 旧浏览器可能不支持。降级策略很简单：**不支持 `@property` 的浏览器会忽略这条规则**，你的变量退化为普通自定义属性——颜色 / 尺寸照常显示，只是「动画」那一层不生效。所以把 `@property` 当作**渐进增强**：核心样式不依赖它，动画作为锦上添花即可。

## 小结

`@property` 给自定义属性补上了「类型」这一维：`syntax` 定类型、`inherits` 定继承、`initial-value` 定兜底——由此解锁了类型校验、优雅兜底，以及最重要的**让变量能被动画**（渐变、角度、颜色的平滑过渡）。它是 Baseline 2024 的新特性，请按渐进增强使用。下一页转向另一项「曾经必须靠 Sass、如今 CSS 原生支持」的能力——[原生 CSS 嵌套](./nesting)。
