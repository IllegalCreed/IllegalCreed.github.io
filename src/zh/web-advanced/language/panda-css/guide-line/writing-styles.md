---
layout: doc
outline: [2, 3]
---

# 写样式：css() 与条件样式

> 基于 Panda CSS 1.11.4 · 核于 2026-07

## 速查

- **`css(styleObject)`**：从 `styled-system/css` 导入，接样式对象、返回原子类名字符串；落在 `@layer utilities`。
- **简写 / 全称并存**：`bg`=backgroundColor、`p`=padding、`px`/`py`、`m`/`mx`/`my`、`rounded`=borderRadius、`w`/`h`、`gap`……。
- **原生嵌套**：用 `&` 写嵌套选择器 `'&:hover'`、`'& span'`；也支持 `'@media (min-width: 768px)'` 等 at-rule 字符串。
- **伪状态简写**：`_hover`/`_focus`/`_focusVisible`/`_active`/`_disabled`/`_first`/`_last`/`_odd`/`_even`/`_before`/`_after`/`_placeholder`……（内置 80+ 条件）。
- **属性级条件**：条件可直接写在属性上——`bg: { base: 'red.500', _hover: 'red.700' }`，`base` 为默认值；条件可**嵌套** `bg: { base, _hover: { _focus: ... } }`。
- **响应式**：`{ base, sm, md, lg, xl, 2xl }` 条件对象；断点直接作为条件键。
- **data / aria 条件**：`_expanded`（aria-expanded=true）、`_checked`、`_horizontal`/`_vertical`、`_ltr`/`_rtl` 等；也可写任意属性选择器 `'&[data-state=closed]'`。
- **组/兄弟选择器**：父加 `group`/`peer` 类，子用 `_groupHover`/`_peerFocus` 等。
- **任意选择器 & at-rule**：`'&[...]'`、`'@media'`、`'@container'`、`'@supports'`、`'@layer'` 都能作键。
- **样式合并**：`css(a, b)` **深合并、后者覆盖前者**——组件默认样式 + 外部 `css` prop 覆盖的常用套路。
- **`cx(...)`**：拼接多个 className（类似 clsx）。
- **`!important`**：值末尾加 `!`（`color: 'red!'`）。
- **严格模式**：`strictTokens` 只准 token 值、`strictPropertyValues` 校验属性值；破例用方括号逃生舱 `'[red]'` / `'[var(--x)]'`。

## 一、css()：样式对象与原子类

`css()` 是 Panda 最基础的入口：接一个样式对象，返回一串**原子类名**。每条声明生成一个单一职责的小类，相同声明跨组件复用同一个类——这就是「原子 CSS」的去重红利，CSS 体积随声明种类而非组件数增长。

```ts
import { css } from '../styled-system/css';

const styles = css({
  backgroundColor: 'gainsboro',
  borderRadius: '9999px',
  fontSize: '13px',
  padding: '10px 15px',
});
// 返回类似 "bg_gainsboro rounded_9999px fs_13px p_10px_15px" 的原子类串
```

简写让样式对象更精炼（简写与全称完全等价）：

```ts
css({
  bg: 'gainsboro', // backgroundColor
  rounded: '9999px', // borderRadius
  fontSize: '13px',
  p: '10px 15px', // padding
});
```

## 二、嵌套与伪状态

### 原生 CSS 嵌套

用 `&` 引用当前元素写嵌套选择器：

```ts
css({
  bg: 'red.400',
  '&:hover': { bg: 'orange.400' },
  '& span': { color: 'pink.400' },
});
```

### 伪状态简写（推荐）

下划线前缀的条件属性是更干净的写法，Panda 内置 80+ 条件：

```ts
css({
  bg: 'red.400',
  _hover: { bg: 'orange.400' },
  _focusVisible: { outline: '2px solid' },
  _disabled: { opacity: 0.5, cursor: 'not-allowed' },
  _before: { content: '"★"' },
});
```

常见分组：交互态 `_hover`/`_active`/`_focus`/`_focusVisible`/`_disabled`；子元素 `_first`/`_last`/`_odd`/`_even`；伪元素 `_before`/`_after`/`_placeholder`。

## 三、属性级条件与响应式

除了「把整块样式放进条件」，Panda 更惯用的是**把条件直接写在单个属性上**——`base` 键是无条件默认值：

```ts
// 属性级条件：默认红、悬停变深红
css({ bg: { base: 'red.500', _hover: 'red.700' } });

// 响应式：断点键直接作为条件
css({ fontSize: { base: 'sm', md: 'lg', lg: 'xl' } });

// 条件可以嵌套（悬停且聚焦时才生效）
css({ bg: { base: 'red.500', _hover: { _focus: 'red.700' } } });
```

内置断点是 `sm` / `md` / `lg` / `xl` / `2xl`（移动优先，`base` 覆盖最小屏）。响应式对象语法在 `css()`、recipe 变体、pattern props 里都通用。

## 四、data / aria 条件与组选择器

Panda 内置了对 `data-*` / `aria-*` 状态的语义条件，能干净地配合 Radix / Ark 这类以 data 属性表达状态的无头组件：

```ts
css({
  // 语义条件：aria-expanded="true" 命中 _expanded
  _expanded: { transform: 'rotate(180deg)' },
  // 或直接写任意属性选择器
  '&[data-state=closed]': { color: 'red.300' },
});
```

父子联动用 `group` / `peer` 机制（对应 Tailwind 的 group/peer）：

```tsx
<div className="group">
  {/* 父悬停时子变背景色 */}
  <p className={css({ _groupHover: { bg: 'red.500' } })}>hover the parent</p>
</div>
```

方向 / 朝向条件也有内置：`_horizontal`/`_vertical`、`_portrait`/`_landscape`、`_ltr`/`_rtl`。

## 五、任意选择器与 at-rule

不在配置内的一次性样式，可以直接把选择器/at-rule 当键写：

```ts
css({
  '&[data-state=closed]': { color: 'red.300' },
  '@media (min-width: 768px)': { color: 'red.300' },
});
```

支持的 at-rule：`@media`、`@layer`、`@container`、`@supports`、`@page`。容器查询另有简写条件形式 `'@/sm'`（配合配置里定义的容器名/尺寸）。

## 六、样式合并、cx 与 important

`css()` 接**多个样式对象时会深合并，后者覆盖前者**：

```ts
css({ mx: '3', paddingTop: '4' }, { mx: '10', pt: '6' });
// 结果约为 "mx_10 pt_6"：mx 被覆盖为 10，pt 被覆盖为 6
```

这正是「组件内部默认样式 + 外部传入 `css` prop 覆盖」的地基：

```tsx
export function Button({ css: cssProp = {}, children }) {
  const className = css(
    { display: 'flex', alignItems: 'center', color: 'black' },
    cssProp, // 外部覆盖
  );
  return <button className={className}>{children}</button>;
}
```

拼接多个类名用 `cx()`（类似 clsx）：

```ts
import { cx } from '../styled-system/css';
const root = cx('group', styles, className);
```

需要 `!important` 时，值末尾加 `!`：`css({ color: 'red!' })`。

## 七、严格模式与逃生舱

想把「只准用设计 token、禁止随手写魔法值」落到编译期，开启严格模式：

```ts
// panda.config.ts
export default defineConfig({
  strictTokens: true, // 只允许 token 值
  strictPropertyValues: true, // 校验属性值是否符合 CSS 规范
});
```

开启后写裸值会报类型错误，确需破例时用**方括号逃生舱**显式标记一次性任意值：

```ts
css({ bg: 'red.400' }); // ✅ 合法 token
css({ bg: 'red' }); // ❌ strictTokens 下报错
css({ bg: '[red]' }); // ✅ 方括号逃生舱放行任意值

css({ display: 'flex' }); // ✅
css({ display: 'invalid' }); // ❌ strictPropertyValues 下报错
css({ color: '[var(--x)]' }); // ✅ 逃生舱承载变量/任意值
```

「默认从严 + 逃生舱可控例外」是 Panda 在团队协作里做设计系统治理的核心手法。

---

单条样式之外，组件级的多变体样式与布局，交给下一页的 recipes 与 patterns：[Recipes 配方与 Patterns 布局](./recipes-and-patterns)。
