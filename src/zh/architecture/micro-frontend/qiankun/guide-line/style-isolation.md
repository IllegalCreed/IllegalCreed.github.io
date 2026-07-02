---
layout: doc
outline: [2, 3]
---

# 样式隔离

> 基于 qiankun 2.10（3.0 rc 追踪） · 核于 2026-07

## 速查

- CSS 隔离的**四路通论**（Shadow DOM / 属性前缀改写 / 动态样式表劫持 / 命名约定）已在[核心机制·CSS 隔离](../../mfe-mechanisms/guide-line/css-isolation)讲透——本页只讲 **qiankun 的两个开关 + 一个默认行为 + 主应用自治**
- qiankun 开沙箱（`sandbox: true`）默认就做**动态样式表劫持**：自动隔离**微应用之间**的样式（子应用卸载时移除它插入的 `<style>`/`<link>`）——但**主应用样式不归它管**
- **`strictStyleIsolation: true`** → 用 **Shadow DOM** 包裹子应用容器：完全双向隔离（样式进不来出不去）
- Shadow DOM 的死穴是**弹窗逃逸**：antd/element 的 Dialog/Select/Tooltip 默认挂 `document.body` → 节点跑出 shadow tree → **样式全丢裸奔**；组件库弹窗一多，`strictStyleIsolation` 基本不可用
- Shadow DOM 还有穿透：**继承属性**（`color`/`font-family`）与 **CSS 自定义属性**照常穿进——主题可借此下发，但也可能「渗」入造成视觉不一致
- **`experimentalStyleIsolation: true`** → 运行时把子应用规则改写成 `div[data-qiankun-xxx] .selector` 属性选择器（等效 Vue scoped 的运行时版）：**单向隔离**（防子应用泄漏，不防主应用进入）
- `experimentalStyleIsolation` 的硬限制：**`@keyframes`、`@font-face`、`@import`、`@page` 不被改写**——动画名/字体名是全局命名空间，加不了属性限定 → **动画/字体重名照样互踩**，仍要靠命名约定兜底
- 两个开关都救不了弹窗：Shadow DOM 让弹窗丢样式，属性改写让改写后的选择器**选不中**挂 body 的弹窗
- **主应用样式自治**：主应用 CSS 不经沙箱、不被隔离——用组件库前缀避让，antd 用 `@ant-prefix` less 变量 + <code v-pre>&lt;ConfigProvider prefixCls&gt;</code> 把 `.ant-*` 改成自己的前缀
- **2026 新方向**：3.0 弃 Shadow DOM，转向以 `experimentalStyleIsolation` / **原生 CSS `@scope`** 为标准的运行时方案（与 scoped-css 项目合作）——见[演进与现状](./evolution-status)
- 落地建议：**命名约定打底（CSS Modules / 团队前缀，动画名字体名也带前缀）+ qiankun 运行时兜底 + 主应用组件库改前缀**，三层各堵一个方向

## 一、边界：本页讲什么、不讲什么

CSS 为什么会互踩（全局作用域 + 后来者覆盖）、四条治理路线（Shadow DOM 双向隔离及其继承穿透、属性前缀改写的单向隔离、动态样式表劫持管卸载残留、命名约定零成本兜底）的**原理与取舍**，已在[核心机制·CSS 隔离](../../mfe-mechanisms/guide-line/css-isolation)逐条拆过。

本页只答：**qiankun 把这些落成了哪几个开关、各自的收益与坑、主应用样式该怎么办**。原理不复述，需要时点回通论页。

## 二、默认行为：微应用「之间」的自动清场

先厘清一个常见误解——**只要开了沙箱（`sandbox: true`，默认），qiankun 就已经在做样式隔离了**，不需要额外配置。它默认走的是通论里的「动态样式表劫持」：劫持子应用运行期插入的 `<style>`/`<link>`，记账归属，**卸载时移除**。FAQ 的原话是「自动隔离微应用**之间**的样式」。

注意那个量词——**之间**。这条默认行为的边界很清楚：

- **管得着**：子应用 A 卸载后不污染子应用 B；A 的样式随 A 走。
- **管不着**：**主应用 ↔ 子应用**的冲突。主应用样式不经沙箱、无从记账（解法见第六节的主应用自治）。

下面两个开关，是在这个默认行为之上**加强**「子应用不泄漏」的力度。

## 三、strictStyleIsolation：Shadow DOM 及其弹窗死穴

`start({ sandbox: { strictStyleIsolation: true } })` 让 qiankun 把每个子应用的容器转成 **Shadow DOM**——这是浏览器唯一原生的**双向隔离**：主应用样式选不中子应用、子应用样式也出不去。

```js
// 严格样式隔离：子应用容器被 Shadow DOM 包裹
start({ sandbox: { strictStyleIsolation: true } });
```

收益是彻底，但代价是它有一个在真实业务里几乎必踩的**死穴——弹窗逃逸**：

1. 子应用与其样式被关进 shadow tree；
2. 组件库的 Dialog / Select 下拉 / Tooltip / message，为躲 `overflow: hidden` 与 `z-index`，默认 `appendChild` 到 `document.body`；
3. 弹窗节点**物理离开了 shadow tree** → 树内样式出不去 → 弹窗**一丝样式都拿不到、裸奔**；
4. 同时它也脱离隔离保护，可能反被主应用样式误伤。

这不是 bug，是双向隔离的逻辑必然（推理链见通论页）。后果很实际：**只要子应用用了 antd / element 这类「弹窗挂 body」的组件库，`strictStyleIsolation` 就基本不可用**。评估此开关前，先数一数子应用组件库里有多少「挂 body」的组件。

另外两条 Shadow DOM 认知（与通论一致）：**继承属性**（`color`/`font-family`/`line-height`）与 **CSS 自定义属性**（`--brand-color`）照常穿透——可当主题下发通道，也可能造成主应用字体「渗」进子应用的视觉不一致；`mode: closed` 不是安全边界。

## 四、experimentalStyleIsolation：属性改写与 at-rule 硬限制

`start({ sandbox: { experimentalStyleIsolation: true } })` 走另一条路——不建边界，而是**运行时改写选择器**：给子应用每条规则加一个属性选择器限定，等效 Vue scoped 的运行时版：

```js
// 实验性样式隔离：运行时属性改写（单向隔离，防子应用泄漏）
start({ sandbox: { experimentalStyleIsolation: true } });
```

```css
/* 子应用源码 */
.app-main { font-size: 14px; }

/* 运行时被改写为（qiankun 官方示例格式）：只在带该 data 属性的容器内生效 */
div[data-qiankun-react16] .app-main { font-size: 14px; }
```

它是**单向隔离**：防子应用样式泄漏出去，但主应用样式仍能进来（不设防）。相比 Shadow DOM，它对弹窗更宽容一点（不把子应用关进 shadow tree），但**弹窗问题依然没解决**——挂 body 的节点不在容器内，改写后的选择器 `div[data-qiankun-xxx] .xxx` 反而**选不中**它。

关键限制是一手文档里那行小字——**`@keyframes`、`@font-face`、`@import`、`@page` 不被改写**。原因值得想透：属性改写的操作对象是**元素选择器**，而这几个 at-rule 定义的是**全局命名空间里的名字**（动画名、字体族名），没有「作用于哪个元素」的概念，语法上无处安放属性限定。后果可推理：

```css
/* 两个子应用都定义同名动画 —— experimentalStyleIsolation 改写救不了，动画照样互踩 */
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
```

所以用了 `experimentalStyleIsolation`，**动画名与字体名仍要靠命名约定兜底**（加团队前缀）。加上「experimental」所示的实验状态，它适合作**增量防线**而非唯一防线。

## 五、两开关对比

| 维度 | `strictStyleIsolation`（Shadow DOM） | `experimentalStyleIsolation`（属性改写） |
| --- | --- | --- |
| 隔离方向 | 双向（进不来出不去） | 单向（防泄漏，不防入侵） |
| 弹窗（挂 body） | **死穴：样式全丢裸奔** | 失效：改写后选择器选不中 |
| `@keyframes`/`@font-face` | 树内自洽（但重名仍需前缀） | **不支持改写 → 重名互踩** |
| 继承属性 / CSS 变量 | 照常穿透（可当主题通道） | 不拦（主应用样式随意进） |
| 主应用样式 | 进不来（连主题都要走变量） | 能进来 |
| 稳定度 | 稳定但组件库弹窗致其难用 | 实验性 |
| 适用 | 子应用无「挂 body」组件、要强隔离 | 多数场景的折中主力 |

实践里，**`experimentalStyleIsolation` 是更常被采用的折中**（`strictStyleIsolation` 被弹窗劝退），但两者都不完美——这也是 qiankun 样式隔离长期被吐槽、3.0 要重做的原因。

## 六、主应用样式自治：antd prefixCls

两个开关管的都是「子应用不泄漏」，**主应用样式谁来管**？答案是**主应用自己自治**——因为主应用样式不经沙箱、qiankun 隔离不到它。最标准的动作是**给主应用组件库改前缀**（主/子应用都用 antd 时的标配，qiankun FAQ 原方案）：

```js
// 主应用 webpack：把 antd 的 CSS 前缀从 ant- 改成自己的（less 变量）
{
  loader: "less-loader",
  options: {
    modifyVars: { "@ant-prefix": "yourPrefix" }, // .ant-btn → .yourPrefix-btn
    javascriptEnabled: true,
  },
}
```

```jsx
// 配合运行时：让 antd 组件生成的类名也换前缀
<ConfigProvider prefixCls="yourPrefix">
  <App />
</ConfigProvider>
```

这样主应用的 `.yourPrefix-*` 与子应用的 `.ant-*` 天然不撞车。一句话概括 qiankun 的样式隔离全景：**「子应用之间」交给沙箱默认劫持 + 两开关加强，「主应用」交给它自己改前缀自治**。

## 七、2026 新方向：@scope 运行时方案

Shadow DOM 因弹窗与组件库兼容问题被大量项目弃用，qiankun 3.0 的 roadmap 明确了转向：**弃 Shadow DOM，以 `experimentalStyleIsolation` / 原生 CSS `@scope` 为标准的运行时样式隔离**，并与 scoped-css 项目合作把这套方案做扎实。原生 CSS [`@scope`](https://developer.mozilla.org/en-US/docs/Web/CSS/@scope) at-rule 能把一段样式的作用域限定在某个 DOM 子树内（`@scope (.container) { ... }`），比运行时字符串改写更接近浏览器原生能力，也更好处理边界。

现状要写准：这属于 **3.0 的规划方向**，2.x 生产线仍是「两开关 + 默认劫持」那一套；3.0 长期 rc、未 stable（版本史见[演进与现状](./evolution-status)）。对 2.x 用户的现实姿势是「关注，不排期」——落地仍靠下面这套组合拳。

## 小结

qiankun 的样式隔离是「一个默认 + 两个开关 + 主应用自治」：开沙箱就默认做**动态样式表劫持**管「子应用之间」的卸载残留；`strictStyleIsolation` 上 Shadow DOM 双向隔离，但**弹窗逃逸**让它在有组件库时基本难用；`experimentalStyleIsolation` 运行时属性改写单向隔离，却**不支持 `@keyframes`/`@font-face`**、动画字体重名仍需前缀；主应用样式不受管辖，必须自己改组件库前缀（antd 的 `@ant-prefix` + `prefixCls`）。判断够不够用，还是拿通论那三问去戳：**弹窗挂哪儿、动画名会不会撞、主应用样式谁来管**。样式之外，子应用怎么被打包、被加载进来，是下一页的接入约束：[HTML entry 与接入约束](./html-entry-integration)。
