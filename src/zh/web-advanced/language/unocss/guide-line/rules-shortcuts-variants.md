---
layout: doc
outline: [2, 3]
---

# 规则、快捷方式与变体：可编程内核

> 基于 UnoCSS v66.7.4 · 核于 2026-07

## 速查

- **rule = 工具类的生成规则**，两种：
  - **静态规则**：`['flex', { display: 'flex' }]`——精确字符串匹配 → CSS 对象。
  - **动态规则**：`[/^m-([\.\d]+)$/, ([, num]) => ({ margin: `${num}px` })]`——正则捕获 + 函数返回 CSS，一条覆盖无穷变体。
- **shortcuts = 工具类组合别名**，两种：
  - **静态**：`{ btn: 'py-2 px-4 rounded' }`。
  - **动态**：`[/^btn-(\w+)$/, ([, c]) => `bg-${c}-500 text-white py-2 px-4 rounded`]`。
- **variants = 前缀 → 选择器改写**：`hover:`/`dark:`/`sm:` 都是变体，匹配并剥离前缀，再给生成的选择器包上 `:hover`/`@media` 等。
- **变体分组**：`hover:(bg-blue-500 text-white)` = `hover:bg-blue-500 hover:text-white`，由 `transformerVariantGroup` 提供。
- **优先级**：`rules` 数组**后定义者优先**；静态规则优先于动态正则；跨类别由 `layers` 层叠顺序决定。
- **theme 消费**：规则函数第二参可拿到 `theme`，读取设计令牌避免硬编码。

## 一、rules：静态规则与动态规则

规则是 UnoCSS 的最底层单元——**它决定「一个类名生成什么 CSS」**。所有 preset 本质上都是一堆规则的集合。规则放在 `uno.config.ts` 的 `rules` 数组里。

### 静态规则

最简单的形式是二元组 `[匹配字符串, CSS 对象]`：

```ts
export default defineConfig({
  rules: [
    ['flex', { display: 'flex' }],
    ['m-1', { margin: '0.25rem' }],
    ['text-red', { color: 'red' }],
  ],
})
```

遇到类名 `flex` 就输出 `.flex { display: flex }`。静态规则精确匹配、写起来直白，但一个类要写一条——`m-1`/`m-2`/`m-3` 都得单列，显然不现实。

### 动态规则（招牌能力）

动态规则用「**正则 + 函数**」，一条覆盖无穷变体：

```ts
export default defineConfig({
  rules: [
    // m-1 / m-2 / m-7.5 ... 全部命中
    [/^m-([\.\d]+)$/, ([, num]) => ({ margin: `${num}px` })],
    // 用主题令牌：text-primary 读 theme.colors.primary
    [/^text-(.+)$/, ([, c], { theme }) => {
      if (theme.colors?.[c]) return { color: theme.colors[c] }
    }],
  ],
})
```

- 第一个参数是**正则匹配数组**（`[全匹配, 捕获组1, ...]`），常用解构 `[, num]` 跳过全匹配取捕获组。
- 第二个参数是**上下文对象**，可拿到 `theme`、`rawSelector` 等，让规则消费设计令牌、避免硬编码。
- 函数**返回 CSS 对象**（也可返回字符串/多段）；返回 `undefined` 表示「本规则不处理该类」，交给后续规则。

这就是 UnoCSS 区别于「一张静态类表」的关键——**规则是可编程的**，你能用几行正则实现整套间距/颜色/尺寸体系。

## 二、shortcuts：把一串类组合成一个名字

当同一串工具类反复出现（按钮、卡片、输入框……），用 shortcut 起个别名，既复用又保持原子化。

### 静态 shortcut

```ts
export default defineConfig({
  shortcuts: {
    btn: 'py-2 px-4 rounded bg-blue-500 text-white',
    'btn-lg': 'btn text-lg py-3 px-6', // shortcut 可引用别的 shortcut
  },
})
```

之后 `class="btn"` 展开成那一串原子类，展开出的类仍会被引擎正常解析生成。

### 动态 shortcut

shortcut 同样支持「正则 + 函数」，返回一段工具类字符串：

```ts
export default defineConfig({
  shortcuts: [
    // btn-green / btn-red / btn-blue ... 都工作
    [/^btn-(\w+)$/, ([, c]) => `bg-${c}-500 text-white py-2 px-4 rounded`],
  ],
})
```

> **rule 与 shortcut 的区别**：rule 直接产出 CSS 声明；shortcut 只是「展开成别的工具类」，再由这些工具类各自的规则产出 CSS。需要新 CSS 语义写 rule，只是组合现有类写 shortcut。

## 三、variants：前缀即选择器改写

`hover:bg-blue-500`、`dark:text-white`、`sm:flex` 里的前缀 `hover:`/`dark:`/`sm:` 都是**变体（variant）**。变体的职责是：**匹配前缀 → 剥离前缀 → 把剩余部分交给规则 → 再改写生成的选择器/包裹媒体查询**。

自定义一个变体的骨架大致如下：

```ts
export default defineConfig({
  variants: [
    // 实现一个 hover: 前缀
    (matcher) => {
      if (!matcher.startsWith('hover:')) return matcher // 不匹配则原样返回
      return {
        matcher: matcher.slice(6),               // 剥离 hover: 前缀
        selector: (s) => `${s}:hover`,           // 给选择器包上 :hover
      }
    },
  ],
})
```

理解了这个模型，就明白**为什么 UnoCSS 能实现任意「前缀 → 选择器逻辑」**：媒体查询、伪类、伪元素、属性选择器、任意组合，都是 variant 在改写选择器。

### 变体分组（variant group）

共享同一前缀的多个工具类可以用括号合并书写，由 `transformerVariantGroup` 提供：

```html
<!-- 展开前 -->
<div class="hover:(bg-blue-500 text-white font-bold)"></div>
<!-- 等价于 -->
<div class="hover:bg-blue-500 hover:text-white hover:font-bold"></div>
```

它只是**书写简写**（语义完全等价于逐个加前缀），却能显著减少重复前缀，长类名一下清爽很多。注意要在 `transformers` 里启用 `transformerVariantGroup()`。

## 四、冲突时谁赢：规则顺序 + layer 顺序

当多条规则都能匹配同一个类，或 shortcut 展开后与直接写的工具类冲突时，UnoCSS 的裁决大致是：

- **`rules` 数组内**：**后定义者优先**（靠后的覆盖靠前的）；静态规则精确匹配优先于动态正则。
- **跨类别之间**：由 `layers` 层叠顺序决定。例如 default 层的工具类通常排在 shortcuts 之后，所以「直接写的工具类能覆盖 shortcut 里的同类属性」。

记住「**规则定义顺序 + layer 顺序**」这套双重机制，才能预测冲突时最终落到哪条样式，而不是靠 `!important` 到处打补丁。layer 的细节见[集成与配置全景页](./integration-and-wind4)。

---

可编程内核掌握后，下一步进入 [指令与属性化](./directives-and-attributify)：`@apply`/`--at-apply`/`theme()`/`@screen` 指令怎么在 CSS 里复用工具类，以及属性化模式的完整用法与 JSX 坑。
