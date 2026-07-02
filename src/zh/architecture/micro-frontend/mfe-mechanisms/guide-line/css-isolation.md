---
layout: doc
outline: [2, 3]
---

# CSS 隔离

> 基于微前端 2026 生态 · 核于 2026-07

## 速查

- CSS 隔离与 JS 沙箱是**两件事**：沙箱再强，一个 `<style>` 插进 `document.head` 照样全局生效——样式的战场要单独打
- 问题面：CSS 是**全局作用域 + 后来者覆盖**——两个应用都写 `.title`，谁后加载谁赢；子应用卸载不摘 `<style>`，残留样式继续污染
- **Shadow DOM**：唯一浏览器原生的**双向隔离**——外面的样式进不来、里面的样式出不去（MDN：shadow 内代码不影响外界）；qiankun `strictStyleIsolation` 把子应用容器转成 shadow DOM 即此路线
- Shadow DOM **不是密不透风**：**继承属性**（`color`/`font-family` 等）与 **CSS 自定义属性**照常穿透；`dir`/`lang` 从宿主继承；`mode: "closed"` 也**不是安全边界**（MDN 原话：扩展可绕过，只是「请勿访问」的声明）
- Shadow DOM 的死穴是**弹窗逃逸**：组件库把 dialog/tooltip 挂到 `document.body` → 节点跑出 shadow tree → 拿不到树内样式（样式全丢），也不再受隔离保护
- **adoptedStyleSheets**：构造 `CSSStyleSheet` + `replaceSync`，一份样式表对象可**同时挂到多棵 shadow tree**——浏览器只解析一次、修改自动传播，是微前端多实例共享主题的正解
- **属性前缀改写**（qiankun `experimentalStyleIsolation` 型）：运行时把子应用规则改写成 `div[data-qiankun-xxx] .app-main` 属性选择器——**`@keyframes`、`@font-face`、`@import`、`@page` 不支持**（动画名/字体名是全局命名空间，加不了属性限定）
- **动态样式表劫持**：劫持 `appendChild`/`insertBefore`，记账子应用运行期插入的 style/link，卸载移除、切换重建——qiankun 开沙箱后「自动隔离微应用**之间**的样式」即此机制；**边界：主应用样式不归它管**
- 主应用样式自治的标准做法：组件库改前缀——antd 用 `modifyVars: { '@ant-prefix': 'yourPrefix' }` + `<ConfigProvider prefixCls="yourPrefix">`（qiankun FAQ 原方案）
- **命名约定**（BEM / 团队前缀 / CSS Modules / CSS-in-JS）：零运行时成本、无兼容性问题，约束靠纪律与工具链——Fowler 演示应用用 styled-components 保证「样式不外泄」
- 实战组合拳：**命名约定打底 + 运行时手段兜底**；挂 `body` 的第三方弹窗是所有运行时方案的共同盲区，只有前缀类方案救得了

## 一、问题面：全局作用域 + 后来者覆盖

CSS 没有模块系统。任何一条规则，无论从哪个文件来，最终都进同一个全局级联；同名选择器按 **specificity + 源顺序**决胜——「谁后加载谁说了算」：

```css
/* 子应用 A 的样式 */
.title { color: #333; font-size: 20px; }

/* 子应用 B 的样式 —— 后加载，A 页面上所有 .title 一并变红 */
.title { color: red; font-size: 16px; }
```

微前端下这个老问题被放大成三种事故形态：

1. **子应用互踩**：A、B 同页并存（或切换时未清理），通用类名（`.header`、`.active`、`.modal`）撞车；
2. **子应用污染主应用**：子应用的 reset/normalize 或 `body { overflow: hidden }` 改掉整个页面；
3. **卸载残留**：子应用运行期动态插入的 `<style>`/`<link>` 没人摘，应用已卸载、样式还阴魂不散。

四条治理路线按「隔离由谁执行」分类：浏览器原生（Shadow DOM）、框架运行时（属性改写、样式表劫持）、构建期/纪律（命名约定）。

## 二、Shadow DOM：原生双向隔离及其穿透边界

[Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM) 是浏览器唯一原生的样式隔离边界：挂在宿主元素下的 shadow tree 拥有独立的 DOM 与样式作用域——**页面样式选不中树内元素，树内样式也出不去**；JS 侧同理，`document.querySelector` 看不见 shadow 内节点，必须经 `shadowRoot` 接口进入。qiankun 的 `strictStyleIsolation` 正是把每个子应用的容器转成 shadow DOM（官方描述：确保子应用样式不会泄漏到全局）；wujie 的 WebComponent 容器、micro-app 的元素隔离也都借这条边界。

但「隔离」不等于「绝缘」，三类东西会穿过边界，恰恰是微前端最常撞上的：

| 穿透物 | 行为 | 对微前端的意义 |
| --- | --- | --- |
| **继承属性** | `color`、`font-family`、`line-height` 等沿 DOM 树照常继承进 shadow tree | 主应用的全局字体/行高会「渗」进子应用——视觉不一致的元凶或救星（可当主题通道用） |
| **CSS 自定义属性** | `--brand-color` 穿透，树内 `var(--brand-color)` 可取值 | **官方推荐的主题下发通道**：主应用定义 token，子应用消费 |
| **`dir` / `lang`** | shadow tree 与 `<slot>` 从宿主继承这两个属性 | 国际化状态天然下传，无需重复声明 |

另外两条边界认知必须校准：

- **`mode: "closed"` 不是安全机制**。closed 只是让 `element.shadowRoot` 返回 `null`，MDN 原话是「不应视为强安全机制……浏览器扩展等仍能绕过」，它表达的是「请勿访问」的意图，防君子不防扩展。
- **样式进树要走正门**。给 shadow tree 供样式有两种方式：树内 `<style>`，或 **`adoptedStyleSheets`**——后者用构造样式表把**同一个 `CSSStyleSheet` 对象挂到多棵 shadow tree**，浏览器只解析一次、`replaceSync` 修改全树生效，是「几十个微前端实例共享一套设计系统」的性能正解：

```js
// 一份样式表，喂给所有子应用容器的 shadow root —— 解析一次，处处生效
const sheet = new CSSStyleSheet();
sheet.replaceSync(`h1 { color: var(--brand-color, #333); }`);
containerA.shadowRoot.adoptedStyleSheets = [sheet];
containerB.shadowRoot.adoptedStyleSheets = [sheet];
```

### 为什么 Shadow DOM 救不了弹窗

Shadow DOM 路线在真实业务里最痛的一击来自**组件库弹窗**。Dialog、Tooltip、Select 下拉这类浮层，为了躲开 `overflow: hidden` 与 `z-index` 层叠上下文，几乎都默认 `appendChild` 到 `document.body`。推理链很短：

1. 子应用与其样式被关进 shadow tree；
2. 弹窗节点被挂到 `body`——**物理上离开了 shadow tree**；
3. 树内样式出不去（双向隔离如实执行），弹窗**一丝样式都拿不到**，裸奔；
4. 同时它也脱离了隔离保护，反过来可能被主应用样式误伤。

这不是 bug，是双向隔离的逻辑必然。可行的补救都不优雅：改组件库挂载点配置（如 `getPopupContainer` 型 API）把弹窗留在树内（又得跟 `overflow`/`z-index` 搏斗）、给弹窗单独注入一份样式、或干脆放弃 Shadow DOM 改走前缀路线。评估此路线时，先数一数你的组件库有多少「挂 body」的组件。

## 三、属性前缀改写：运行时 scoped

第二条路线不建边界，而是**改写选择器**——qiankun 的 `experimentalStyleIsolation` 是代表：开启后，子应用的每条样式规则都被运行时加上属性选择器限定，等效于 Vue scoped 的运行时版：

```css
/* 子应用源码 */
.app-main { font-size: 14px; }

/* 运行时被改写为（qiankun 官方示例格式） */
div[data-qiankun-react16] .app-main { font-size: 14px; }
```

效果：子应用样式只在自己容器（带 `data-qiankun-xxx` 属性的节点）内生效，出不去；主应用与其他应用的样式照常能进来（**单向隔离**——防泄漏、不防入侵）。弹窗问题依旧存在（挂 `body` 的节点不在容器内，改写后的选择器反而选不中它）。

关键限制是一手文档里那行小字：**`@keyframes`、`@font-face`、`@import`、`@page` 不被支持**。原因值得想透：属性改写的操作对象是**元素选择器**，而这几个 at-rule 定义的是**全局命名空间里的名字**——动画名、字体族名没有「作用于哪个元素」的概念，语法上就无处安放属性限定。后果是可推理的：两个子应用都定义 `@keyframes fade-in`，改写救不了，**动画重名照样互踩**——用了这条路线，动画名与字体名仍要靠命名约定兜底。加上「experimental」前缀所示的实验状态，它适合作为增量防线而非唯一防线。

## 四、动态样式表劫持:「子应用之间」的自动清场

第三条路线管的是**时间维度**：子应用运行期会动态插 `<style>`/`<link>`（webpack style-loader、CSS-in-JS 运行时都这么干），卸载时没人收拾。框架的做法是在沙箱里劫持 `appendChild`/`insertBefore` 等 DOM API，给每个子应用记一本样式账：

- **挂载期**：子应用插入的每个样式节点都被登记归属；
- **卸载时**：按账本统一移除——样式随应用走，不留残余；
- **再挂载**：从缓存的账本重建样式，省一次网络与解析。

qiankun FAQ 对此的表述是：开启沙箱时「**自动隔离微应用之间的样式**」。注意量词——**之间**。这条机制的边界画得很清楚：它保证 A 卸载后不污染 B，但**主应用与子应用之间**的冲突不归它管，因为主应用的样式不经过沙箱、无从记账。官方给出的补法是**主应用样式自治**——最典型的是组件库前缀方案（qiankun FAQ 原方案，主/子应用都用 antd 时的标配）：

```js
// 主应用 webpack：把 antd 的 CSS 前缀从 ant- 改成自己的
{
  loader: "less-loader",
  options: {
    modifyVars: { "@ant-prefix": "myMain" }, // .ant-btn → .myMain-btn
    javascriptEnabled: true,
  },
}
```

```jsx
// 配合运行时：让组件生成的类名也换前缀
<ConfigProvider prefixCls="myMain">
  <App />
</ConfigProvider>
```

一句话总结这条路线：**自动化的那半（子应用之间）交给劫持，自动化不了的那半（主应用）交给约定**。

## 五、命名约定：零运行时的老实人方案

第四条路线最古老也最普适——不指望任何运行时，让**类名自己不撞车**：

| 手段 | 机制 | 约束力 |
| --- | --- | --- |
| **团队前缀** | 人工规范：`.checkout-*`、`.search-*`，每个团队一个命名空间 | 纪律（lint 可辅助） |
| **BEM** | `block__element--modifier` 结构化命名，天然低撞车率 | 纪律 + 评审 |
| **CSS Modules** | 构建期把类名编译成哈希（`.title` → `.title_x7f3a`），冲突物理不可能 | 工具链强制 |
| **CSS-in-JS** | 运行时/编译期生成唯一类名，样式与组件同生命周期 | 工具链强制 |

Fowler 的微前端演示应用选的就是这条路（全部样式走 styled-components，「我们因此可以保证微前端的样式不会泄漏出去」），他给的原则也适合当这条路线的定语：**让每个团队能独立编写样式，并确信组合到一起时行为可预期**。

优点是绝对的：零运行时成本、无兼容性问题、对弹窗一视同仁（弹窗类名也带前缀，挂哪儿都不撞）。弱点同样明显：管不住第三方全局样式（reset、老 UI 库），也防不了不守规矩的队友——它是**预防机制**，不是**执行机制**。

## 六、四路线取舍

| 维度 | Shadow DOM | 属性前缀改写 | 动态样式表劫持 | 命名约定 |
| --- | --- | --- | --- | --- |
| **隔离方向** | 双向（进不来出不去） | 单向（防泄漏） | 时间维度（防残留） | 预防性（防撞名） |
| **执行者** | 浏览器原生 | 框架运行时改写 | 框架运行时记账 | 构建工具/纪律 |
| **运行时成本** | 低（原生） | 每条规则解析改写 | 劫持 + 账本 | **零** |
| **弹窗（挂 body）** | 死穴：样式全丢 | 失效：选择器选不中 | 不管辖 | 天然覆盖 |
| **at-rule（动画/字体）** | 树内自洽 | **不支持改写** | 随节点走 | 需前缀约定 |
| **主应用样式** | 进不来（连主题也要走变量） | 能进来（不设防） | 不管辖，需自治 | 靠主应用守约 |
| **代表** | qiankun `strictStyleIsolation`、wujie/micro-app 容器 | qiankun `experimentalStyleIsolation` | qiankun 沙箱默认行为 | Fowler 立场、所有团队的底线 |

落地建议照三层叠：**第一层命名约定**（CSS Modules/CSS-in-JS 让工具链强制，动画名字体名也带前缀）——这是无论选什么框架都该有的底线；**第二层框架运行时**（样式表劫持保证卸载干净，前缀改写或 Shadow DOM 按组件库弹窗情况二选一）；**第三层主应用自治**（组件库改前缀、避免无前缀全局样式）。三层各堵一个方向的漏，单押任何一层都会在某个盲区翻车。

## 小结

CSS 隔离没有银弹，只有边界清晰的四条路线：Shadow DOM 提供唯一的原生双向隔离，但继承属性与 CSS 变量照常穿透（这是特性，主题该走这条道），挂 `body` 的弹窗是它的逻辑死穴；属性前缀改写把样式锁进容器，却对 `@keyframes`/`@font-face` 这类全局命名空间无能为力；动态样式表劫持解决「子应用之间」的残留与互踩，主应用样式必须自治（antd 改 prefix 是标准动作）；命名约定零成本覆盖一切场景，唯独约束不了别人。判断一个方案行不行，就拿三个问题去戳：**弹窗挂哪儿、动画名会不会撞、主应用样式谁来管**。样式隔离之后，下一个问题是子应用本身怎么被加载进来：[HTML entry 与资源加载](./html-entry-loading)。
