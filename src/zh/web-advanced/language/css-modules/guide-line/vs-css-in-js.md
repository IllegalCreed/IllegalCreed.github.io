---
layout: doc
outline: [2, 3]
---

# 对照 CSS-in-JS 与选型

> 基于 CSS Modules 规范 + Vite/webpack 实现 · 核于 2026-07

## 速查

- **根本分野**：CSS Modules 在**独立 `.css` 文件**里写样式、只做作用域；**真·CSS-in-JS**（StyleX / Panda CSS / vanilla-extract）在 **JS/TS 里**写样式，提供类型安全、设计令牌、动态变体等更丰富能力。
- **不是「有无运行时」之分**：CSS Modules 零运行时；vanilla-extract / Panda / StyleX **也主打编译期零运行时**（从 JS/TS 抽取成静态 CSS）——区别在**样式写在哪**与**能力广度**。
- **传统运行时 CSS-in-JS**（styled-components / Emotion）：在浏览器运行时解析样式、插 `<style>`，有运行时开销；近年在 RSC / 零运行时趋势下热度下降。
- **CSS Modules = 作用域基线**：最小可用的作用域底座，只解决命名冲突；更高级需求（原子化、类型安全、动态主题）叠 Tailwind / CSS-in-JS。
- **选型速记**：想写标准 CSS + 要作用域 + 零运行时 + 框架无关 → **CSS Modules**；原子类快开发 + 设计系统约束 → **Tailwind**；样式与组件强绑定 + 类型安全 + 设计令牌 → **CSS-in-JS（StyleX/Panda/vanilla-extract）**。三者**可组合**，非互斥。
- ⚠️ 别下「CSS Modules 已过时」的结论——它仍是主流的零运行时作用域方案，常与 Tailwind 组合（Tailwind 打底 + CSS Modules 兜复杂自定义样式）。

## 一、CSS Modules vs 真·CSS-in-JS

同组的 StyleX、Panda CSS、vanilla-extract 都属于「真·CSS-in-JS」，和 CSS Modules 的根本差异不在「有没有运行时」（大家都零运行时），而在**样式写在哪、能提供多少能力**：

| 维度 | CSS Modules | StyleX / Panda / vanilla-extract |
| --- | --- | --- |
| 样式写在哪 | 独立 `.module.css` **CSS 文件** | **JS/TS 文件**里（对象/函数式 API） |
| 语法 | 标准 CSS | JS/TS API（`style({...})` / `css({...})`） |
| 运行时 | 零运行时 | 也主打编译期零运行时（抽取成静态 CSS） |
| 类型安全 | 需额外补 `.d.ts` | **原生类型安全**（TS 直接推导样式属性） |
| 设计令牌/主题 | 靠 `@value`（弱） | **内建令牌系统**（vanilla-extract `createTheme`、Panda tokens、StyleX vars） |
| 动态样式 | 只能切预定义类 / 叠 `var()` | **条件/变体 API**（按 props 组合，编译期静态化） |
| 心智 | 「写 CSS + 作用域」 | 「用 JS/TS 描述样式系统」 |

一句话：**CSS Modules 只解决「作用域」，那三者在作用域之上还给了你一整套「样式系统」能力**。

## 二、和传统运行时 CSS-in-JS 的区别

styled-components / Emotion 这类**传统运行时 CSS-in-JS** 是另一回事：它们在**浏览器运行时**解析样式模板、动态插入 `<style>` 标签。

- **优点**：极致的动态能力（样式随任意 props/state 实时变化）、样式与组件同文件。
- **代价**：运行时开销、SSR 水合复杂、与 React Server Components（默认无运行时）不友好——这也是近年生态向**零运行时**（CSS Modules、Tailwind、vanilla-extract、Panda、StyleX）倾斜、传统运行时方案热度下降的原因。

> CSS Modules 站在「零运行时」这一侧，且是其中**心智最轻、最贴近原生 CSS** 的一个。

## 三、和 Tailwind 的关系

Tailwind 是**原子化/功能类**方案（`class="flex p-4 text-lg"`），和 CSS Modules 解决的问题不同、**可组合**：

- **Tailwind**：快速拼装、内建设计系统约束、少写自定义 CSS；但复杂的、一次性的自定义样式用原子类会很长。
- **CSS Modules**：写复杂/独特的自定义样式更顺手，作用域天然隔离。
- **常见组合**：**Tailwind 打底**（布局、间距、常规样式）**+ CSS Modules 兜复杂自定义样式**（动画、精细排版、第三方对接）。

## 四、选型决策

| 你的诉求 | 选择 |
| --- | --- |
| 想写标准 CSS + 要作用域 + 零运行时 + 框架无关 | **CSS Modules** |
| 原子类快速开发 + 统一设计系统 + 少写 CSS | **Tailwind CSS** |
| 样式与组件强绑定 + 原生类型安全 + 设计令牌 | **StyleX / Panda CSS / vanilla-extract** |
| 极致运行时动态（可接受运行时开销、非 RSC） | styled-components / Emotion |
| 复杂项目分层 | **Tailwind 打底 + CSS Modules 补充** |

::: warning 不要轻易下「过时」结论
CSS Modules **没有过时**：它在 Vite / Next.js / CRA 等主流工具里仍是内建的、被推荐的零运行时作用域方案。它的定位是**作用域基线**——不追求做完整样式系统，而是把「命名冲突」这件最基础的事做稳、做轻。需要更多能力时叠其他方案，而非替换掉它。
:::

---

至此 CSS Modules 的定位、原理、作用域、组合、框架集成、类型与选型全部走完。速查与对照表汇总见 [参考](../reference)。
