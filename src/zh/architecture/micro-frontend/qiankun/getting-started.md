---
layout: doc
outline: [2, 3]
---

# 入门：qiankun 是什么与怎么接入

> 基于 qiankun 2.10（3.0 rc 追踪） · 核于 2026-07

## 速查

- qiankun 是**蚂蚁开源、基于 [single-spa](../single-spa/) 的微前端框架**——一句话定位：**single-spa + HTML entry + JS 沙箱 + 样式隔离 的开箱方案**
- 设计哲学两条：**简单**（「接入像用 iframe 一样简单」，API 极少）+ **解耦**（HTML entry / 沙箱 / 通信都松耦合）
- 它补齐 single-spa 故意留白的三件事：**HTML entry**（`entry` 填子应用 HTML 地址）、**JS 沙箱**（Proxy 代理 window）、**样式隔离**（Shadow DOM / 属性改写）
- **主应用接入两步**：`registerMicroApps([{ name, entry, container, activeRule }])` 注册 + `start()` 启动——路由命中 `activeRule` 就自动加载并挂载对应子应用
- **子应用接入三件事**：① 导出 `bootstrap`/`mount`/`unmount` 三个返回 Promise 的生命周期；② 打包成 **UMD**（`libraryTarget: 'umd'` + 唯一 `library` 名）；③ 入口顶部修 **publicPath**（`__INJECTED_PUBLIC_PATH_BY_QIANKUN__`）
- 子应用靠 <code v-pre>window.__POWERED_BY_QIANKUN__</code> 判断自己是**独立运行**还是**被 qiankun 嵌入**，据此切换路由 `base`、publicPath、挂载目标
- `entry` 可填 **HTML 地址**（`'//localhost:7100'`，qiankun 解析 HTML 取脚本样式）或 **`{ scripts, styles }`** 显式清单；末尾 `/` 不能省（否则 publicPath 推断错）
- 子应用**必须开 CORS**：qiankun 用 `fetch` 拉子应用 HTML 与静态资源，跨域资源需 `Access-Control-Allow-Origin`
- **qiankun ≈ single-spa + 隔离 + 加载**：内部拿 single-spa 当路由编排底座，`registerMicroApps` 底层就是 single-spa 的 `registerApplication`
- **沙箱/样式隔离通论**（四代沙箱、四路 CSS 隔离）见[微前端核心机制](../mfe-mechanisms/)，本叶只讲 qiankun 的具体配置与坑
- 选型直觉：**存量 webpack 项目 + 要开箱即用** → qiankun；**新项目 Vite 主力** → 优先 [wujie](../wujie/)/[micro-app](../micro-app/)（qiankun 2.x 不接 ESM）
- 起步顺序：先读本页建立心智 → 再读[核心 API](./guide-line/core-api) 吃透 `registerMicroApps`/`start`/`loadMicroApp`

## 一、qiankun 解决什么问题

qiankun 官方对微前端的价值主张是四条：**技术栈无关**（主框架不限制子应用用什么）、**独立开发部署**（子应用自治、主框架自动同步更新）、**增量升级**（渐进重构老系统）、**独立运行时**（每个子应用状态隔离、不共享运行时）。这四条不是 qiankun 独有——它们是微前端的通用价值（判据见[微前端基础](../mfe-basics/)）。qiankun 真正的卖点，是把这些价值**做成了开箱即用**。

对比它的底座 [single-spa](../single-spa/) 就清楚了：single-spa 只做「按路由把子应用装上/卸下」的编排，**不管** JS 沙箱、**不管**样式隔离、**只吃 JS 生命周期模块**（子应用得先改造成导出 `bootstrap/mount/unmount` 的 JS）。这三样留白，用 single-spa 就得自己补。qiankun 的全部意义，就是把这三样补齐、包成两行 API：

| 能力 | single-spa | qiankun 怎么补 |
| --- | --- | --- |
| 路由编排 / 生命周期 | ✅ 本命 | ✅ 复用 single-spa |
| 子应用如何提供 | 只吃 JS 模块（自己搭 import maps） | **HTML entry**：`entry` 填 HTML 地址，import-html-entry 解析 |
| JS 全局污染 | ❌ 不做 | **JS 沙箱**：Proxy 代理 `window`（[沙箱实现](./guide-line/sandbox-impl)） |
| 样式互踩 | ❌ 不做 | **样式隔离**：Shadow DOM / 属性改写（[样式隔离](./guide-line/style-isolation)） |
| 上手成本 | 高（自理隔离、手写 import maps） | 低（`registerMicroApps` 开箱） |

一句话记牢：**qiankun = single-spa + HTML entry + JS 沙箱 + 样式隔离**。所以学 qiankun 前，理解 single-spa 的生命周期与路由编排是地基。

## 二、最小接入：主应用两步

主应用只做两件事——**注册**子应用清单、**启动**：

```js
// 主应用入口（如 main.js）：注册 + 启动
import { registerMicroApps, start } from "qiankun";

registerMicroApps([
  {
    name: "react-app", // 子应用唯一名（约定与子应用 package.json name 相关）
    entry: "//localhost:7100", // HTML entry：子应用的 HTML 地址
    container: "#subapp-container", // 子应用挂载到主应用哪个 DOM 节点
    activeRule: "/react", // 路由前缀命中 /react 时激活此子应用
  },
  {
    name: "vue-app",
    entry: { scripts: ["//localhost:7101/main.js"] }, // 也可给显式资源清单
    container: "#subapp-container",
    activeRule: "/vue",
  },
]);

start(); // 启动 qiankun：此后路由变化就会自动加载/卸载子应用
```

`activeRule` 命中当前 URL 时，qiankun 会 `fetch` 子应用 `entry`、解析出脚本与样式、在沙箱里执行、拿到生命周期、把子应用渲染进 `container`。路由离开时自动 `unmount`。`registerMicroApps` 与 `start` 的全部配置项见[核心 API](./guide-line/core-api)。

## 三、子应用改造清单：三件事

子应用要被 qiankun 接管，必须做三件事——**导出生命周期**、**打成 UMD**、**修 publicPath**：

**① 导出三个生命周期**（框架无关的契约，与 single-spa 一致）：

```js
// 子应用入口：导出 qiankun 需要的生命周期
export async function bootstrap() {
  // 只在子应用首次初始化时调用一次：一次性初始化
}
export async function mount(props) {
  // 每次进入子应用都调用：把自己渲染进 props.container（qiankun 提供的挂载节点）
  render(props);
}
export async function unmount(props) {
  // 每次离开子应用都调用：销毁实例、清理副作用
}
```

**② 打包成 UMD**（qiankun 要从子应用的 UMD 导出对象上取生命周期，格式不对就报 “You need to export the functional lifecycles”）：

```js
// webpack 配置（webpack 5）：output 段
const packageName = require("./package.json").name;
module.exports = {
  output: {
    library: `${packageName}-[name]`, // 库名（约定唯一，供 qiankun 取生命周期）
    libraryTarget: "umd", // 关键：必须 UMD，不能是 CommonJS/AMD
    chunkLoadingGlobal: `webpackJsonp_${packageName}`, // webpack4 用 jsonpFunction：避免多子应用 chunk 全局冲突
    globalObject: "window", // UMD 挂到 window
  },
};
```

**③ 修 publicPath**（子应用被嵌进主应用后，动态 chunk 的基准地址变了，qiankun 在挂载前注入一个变量供修正）：

```js
// public-path.js：import 到子应用入口最顶部
if (window.__POWERED_BY_QIANKUN__) {
  // 被 qiankun 嵌入时，用注入的动态 publicPath 修正资源基准
  __webpack_public_path__ = window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__;
}
```

其中 <code v-pre>window.__POWERED_BY_QIANKUN__</code> 是 qiankun 注入的全局标记：子应用靠它判断「我是独立跑还是被嵌入」，从而切换路由 `base`、publicPath、是否 `start` 自己等。UMD 与 publicPath 的完整约束（含 CORS、entry script 标记、常见报错）见 [HTML entry 与接入约束](./guide-line/html-entry-integration)。

> **注意**：Vue/React 子应用的具体接入代码（`createApp`/`ReactDOM.createRoot` 与生命周期的拼接、路由 `base` 切换）在 UI 框架章有实操，本叶不复述——见 [Vue 其他生态·微前端接入](/zh/frontend-framework/ui/vue/guide-line/other)。

## 四、一次路由切换里发生了什么

qiankun 的运行时循环复用 single-spa 的 reroute——URL 变化时重新求值每个子应用的 `activeRule`，但比 single-spa 多了「加载 + 隔离」两步：

```text
URL 变化 → 对每个子应用求值 activeRule
        → 命中却没挂载的：fetch entry → 解析 HTML 取脚本/样式
                        → 在 JS 沙箱里执行脚本、拿到生命周期
                        → 样式隔离处理后 → bootstrap（首次）→ mount 进 container
        → 离开却还挂着的：unmount + 清理沙箱记账的副作用与样式
        → 其余不动
```

对比 single-spa 那条「load → bootstrap → mount」的裸链路，qiankun 多做的正是它的价值：**HTML entry 的解析**（你只给了个 HTML 地址）、**沙箱执行**（脚本跑在代理的 `window` 里）、**样式隔离与卸载清理**（子应用的 `<style>` 记账、卸载移除）。这三步的机制通论见[核心机制·HTML entry](../mfe-mechanisms/guide-line/html-entry-loading)与[·JS 沙箱](../mfe-mechanisms/guide-line/js-sandbox)。

## 五、qiankun 与 single-spa：底座关系

初学最该先厘清的一点：qiankun 和 single-spa **不是竞品，是分层**。qiankun 内部就是拿 single-spa 当路由编排底座——`registerMicroApps` 底层调的就是 single-spa 的 `registerApplication`，`start` 里也会调 single-spa 的 `start`。所以：

- **懂 single-spa 的生命周期与状态机**（`bootstrap/mount/unmount`、11 态、activity function），就懂了 qiankun 路由那一半；qiankun 只是把 `activeWhen` 换了个名字叫 `activeRule`。
- **qiankun 独有的那一半**（HTML entry、沙箱、样式隔离），才是本叶要讲的重点。

反过来，「什么时候直接用 single-spa、什么时候用 qiankun」的判据见 [single-spa·现状与定位](../single-spa/guide-line/status-positioning)——要极致控制、自建底座、团队肯自理隔离就用 single-spa；要开箱即用的沙箱/样式/HTML entry 就用 qiankun。

## 小结

qiankun 把微前端的接入门槛砍到「主应用两行 + 子应用三件事」：主应用 `registerMicroApps` 注册清单、`start` 启动；子应用导出 `bootstrap/mount/unmount`、打成 UMD、修 publicPath。它的价值全在 single-spa 的留白处——HTML entry、JS 沙箱、样式隔离。理解了最小接入，下一步是吃透那几个 API 的完整配置项与它们的语义边界（尤其 `singular` 单实例 vs `loadMicroApp` 多实例）：从[核心 API](./guide-line/core-api) 开始。
