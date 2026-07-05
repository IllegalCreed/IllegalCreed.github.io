---
layout: doc
outline: [2, 3]
---

# 类型安全与现代 API

> 基于 StyleX 0.19 · 核于 2026-07

## 速查

- **`StyleXStyles`**：组件接收任意 StyleX 样式的 `style` prop 类型；再 `stylex.props(local, style)` 合并（外部惯例放最后）。
- **属性白名单**：`StyleXStyles<{ color?: string; backgroundColor?: string }>` 只接受列出的属性。
- **值约束**：`StyleXStyles<{ marginTop: 0 | 4 | 8 | 16 }>` 连取值一起限死。
- **`StyleXStylesWithout<{...}>`**：**黑名单**——禁掉列出的属性、放行其余（如禁布局属性）。
- **`StaticStyles`**：只接受编译期常量样式，**拒绝动态（函数）样式**。
- ⚠️ **TS 局限**：结构性子类型使「多出的属性」不总报错，白名单不能 100% 兜底；Flow 更严格。
- **`stylex.when.*`**：依 DOM 关系条件化样式——`when.ancestor`/`descendant`/`anySibling`/`siblingBefore`/`siblingAfter`，配 `stylex.defaultMarker()`；**不支持**媒体/容器查询。
- **`stylex.positionTry()`**：CSS 锚点定位（anchor positioning）候选回退位置。
- **`stylex.viewTransitionClass()`**：生成 View Transitions（视图过渡）API 用的过渡类。
- **`@stylexjs/atoms`**：免 `create` 的预生成原子工具（`x.display.flex`），类型安全的「Tailwind 风格」出口。

## 一、静态类型：约束组件能收哪些样式

StyleX 是 TypeScript / Flow 一等公民。最常见的需求是让组件**接收外部样式**，用 `StyleXStyles`：

```tsx
import * as stylex from '@stylexjs/stylex';
import type { StyleXStyles } from '@stylexjs/stylex';

type Props = { style?: StyleXStyles };

function Card({ style, ...rest }: Props) {
  // 外部 style 放最后，便于覆盖本地样式
  return <div {...rest} {...stylex.props(local.base, local.pad, style)} />;
}
```

想**限制**外部只能传哪些属性，给 `StyleXStyles` 传类型参数即成**白名单**——还能把取值一起锁死：

```tsx
type Props = {
  // 只接受 color / backgroundColor
  style?: StyleXStyles<{ color?: string; backgroundColor?: string }>;
};

type SpacingProps = {
  // marginTop 只能是这四个值之一
  style?: StyleXStyles<{ marginTop: 0 | 4 | 8 | 16 }>;
};
```

反过来想**禁掉**某些属性（如不许外部改布局），用**黑名单** `StyleXStylesWithout`：

```tsx
import type { StyleXStylesWithout } from '@stylexjs/stylex';

type NoLayout = StyleXStylesWithout<{
  position: unknown;
  display: unknown;
  margin: unknown;
  width: unknown;
  height: unknown;
}>;

type Props = { style?: NoLayout }; // 列出的被禁，其余放行
```

要「只接受编译期常量、拒绝运行时动态样式」，用 `StaticStyles`：

```tsx
import type { StaticStyles } from '@stylexjs/stylex';
type Props = { style?: StaticStyles }; // 传入函数样式会报类型错
```

⚠️ **一个现实边界**：TypeScript 的对象类型对「多出的属性」不总是报错（结构性子类型使然），即便用了白名单，边缘情况下仍可能传进未列出的属性而不报错。StyleX 已做缓解但无法根除；Flow 的检查在这点上更严格。用类型约束时要知道它不是 100% 铁壁。

## 二、when.\*：基于 DOM 关系的条件样式

`stylex.when.*` 是较新的能力，让一个元素根据**其它元素**（祖先 / 兄弟 / 后代）的状态改变自身样式——过去这类「父 hover 联动子」往往要手写额外类名或包裹器，现在编译成纯 CSS 关系选择器即可。五个方位：

| API | 依据 |
| --- | --- |
| `stylex.when.ancestor(...)` | 某个祖先的状态 |
| `stylex.when.descendant(...)` | 某个后代的状态 |
| `stylex.when.anySibling(...)` | 任一兄弟的状态 |
| `stylex.when.siblingBefore(...)` | 前面的兄弟 |
| `stylex.when.siblingAfter(...)` | 后面的兄弟 |

它接受伪类（`:hover`/`:focus`）与属性选择器（如 `[data-state='open']`），并配合 `stylex.defaultMarker()` 标记被观察的元素：

```tsx
const styles = stylex.create({
  card: {
    transform: {
      default: 'translateX(0)',
      [stylex.when.ancestor(':hover')]: 'translateX(10px)',
    },
  },
});

function Demo() {
  return (
    <div {...stylex.props(stylex.defaultMarker())}>
      <div {...stylex.props(styles.card)}>父 hover 时我平移</div>
    </div>
  );
}
```

⚠️ 注意：`when.*` 面向 **DOM 关系状态**，**不支持**媒体查询与容器查询（那些用属性级条件值 `@media`/`@container` 表达）。

## 三、positionTry 与 viewTransitionClass

StyleX 把一批**前沿 CSS 能力**纳入了类型安全授权体系：

- **`stylex.positionTry()`** 对应 CSS **锚点定位**（anchor positioning）的 `@position-try` / `position-try-fallbacks`——为浮层（tooltip、下拉）声明多个候选摆放位置，浏览器按可用空间自动挑一个可行的。

- **`stylex.viewTransitionClass()`** 生成一个用于 **View Transitions（视图过渡）API** 的类，声明 `::view-transition-*` 相关的过渡样式，把页面/元素切换动画接入 StyleX。

```tsx
const slide = stylex.viewTransitionClass({
  group: { animationDuration: '0.3s' },
  old: { animationName: fadeOut },
  new: { animationName: fadeIn },
});
```

这些 API 印证了 StyleX 的思路：不发明新的样式方言，而是把标准 CSS 的新能力用类型安全的 JS 授权包装起来。

## 四、@stylexjs/atoms：免 create 的原子出口

有时只想写一次性、无需命名的样式。`@stylexjs/atoms` 提供**预生成的原子工具**，思路接近 Tailwind 工具类，但仍是**类型安全的 JS**：

```tsx
import * as stylex from '@stylexjs/stylex';
import x from '@stylexjs/atoms';

<div {...stylex.props(x.display.flex, x.gap._8px, isActive && x.color.blue)} />
```

它与 `create` 定义的样式可以混用，冲突照样走 last-wins。适合快速布局、一次性微调，避免为一两个属性也去 `create` 一个命名空间。

---

API 与类型体系过完，最后一步进入 [选型对比与集成](./comparison-and-integration)：StyleX vs Tailwind / 运行时 CSS-in-JS / vanilla-extract / Panda，以及构建集成与生态。
