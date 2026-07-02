---
layout: doc
outline: [2, 3]
---

# Vite 与 ESM 之痛

> 基于 qiankun 2.10（3.0 rc 追踪） · 核于 2026-07

## 速查

- **一句话**：qiankun 2.x 基于 import-html-entry，**不支持 `<script type="module">`（ESM）入口**——而 Vite 的产物默认就是 ESM，所以 **Vite 子应用无法原生接入 qiankun 2.x**，这是 qiankun 最大的痛点
- **根因**：import-html-entry 把子应用脚本 **`fetch` 回来当字符串、用 `eval`/`new Function` 执行**（配合沙箱）；ESM 有 `import`/`export` 语法、异步加载、强制严格模式，**不能被当同步字符串 eval 执行**
- **叠加冲突**：qiankun 的 with/eval 沙箱在**非严格模式**下运行，而 ESM 天然严格模式——`with` 在严格模式是语法错误，两者互斥（沙箱通论见[核心机制·JS 沙箱](../../mfe-mechanisms/guide-line/js-sandbox)）
- Vite 开发态用原生 ESM + esbuild（不打包），生产态用 Rollup——两态都以 ESM 为中心，`libraryTarget: 'umd'` 那套 webpack 约束在 Vite 里不成立
- **社区方案 `vite-plugin-qiankun`**：把 Vite 子应用「伪装」成 qiankun 认得的形式——注入 <code v-pre>__POWERED_BY_QIANKUN__</code>、把生命周期挂到 `window`、开发时用 `type=module` 但**绕过 qiankun 沙箱**
- `vite-plugin-qiankun` 的**局限**：沙箱基本失效（Vite 子应用几乎裸跑，全局污染/样式隔离形同虚设）、需按插件约定改入口、生产 build 有额外配置、**非官方维护**（跟随 qiankun 更新有滞后风险）
- **该换路线的信号**：子应用是 **Vite 主力**、要**真沙箱**、团队不想维护 hack → 选原生 Vite 友好的 [wujie](../../wujie/)（iframe 沙箱天然支持 ESM）或 [micro-app](../../micro-app/)（支持 `module` script）
- **反过来**：存量子应用都是 **webpack**、只是想开箱即用 → qiankun 仍是稳妥选择，别为了「用上 qiankun」硬把 Vite 塞进 hack
- **3.0 的解法**：新 loader（`@qiankunjs/loader`）用 **DOMParser 替代正则**、**streaming** 加载、**原生支持 `type=module`/ESM 与 Vite**——这正是 3.0 三年重构的核心动力，但至今仍 rc、未 stable（见[演进与现状](./evolution-status)）
- 选型顺序建议：**先看子应用构建工具**——全 webpack → qiankun；有 Vite 且要隔离 → wujie/micro-app；再等 3.0 stable 才谈 qiankun 原生接 Vite

## 一、痛点定性：Vite 子应用接不进 2.x

qiankun 在国内最常被吐槽的一句就是「**接不了 Vite**」。这不是配置没调对，而是架构层面的不兼容：**qiankun 2.x 不支持 ESM 入口，而 Vite 的产物以 ESM 为中心**。表现是——你把一个 Vite 子应用的 `entry` 填给 qiankun，轻则生命周期取不到（`export lifecycles` 报错），重则脚本根本执行不了。

要理解为什么，得看 qiankun 2.x 是**怎么执行子应用脚本**的。

## 二、根因：import-html-entry 的「fetch + eval」模型

qiankun 2.x 的 HTML entry 靠 [import-html-entry](https://github.com/kuitos/import-html-entry) 实现。它加载子应用脚本的模型是（[HTML entry 接入约束](./html-entry-integration)已提过）：

1. `fetch` 回子应用 HTML；
2. 用**正则**解析出 `<script>` 标签；
3. 把脚本内容 `fetch` 回来，得到一段 **JS 字符串**；
4. 用 `eval` / `new Function` **把这段字符串同步执行**（外面包一层沙箱的 `with(proxyWindow){}`）。

这套模型对 **IIFE/UMD 格式的脚本**天然合适——它们就是「一段能被 eval 的自执行字符串」。但 ESM（`<script type="module">`）与它**根本对不上**：

- **ESM 有专属语法**：`import`/`export` 是模块级语法，只能在模块上下文里解析，**不能被 `eval` 当普通脚本执行**（`eval("import x from 'y'")` 直接语法错误）。
- **ESM 是异步、由浏览器原生加载**：`import` 的解析、依赖图构建是浏览器接管的异步过程，而 import-html-entry 要的是「fetch 回字符串同步 eval」，模型不匹配。
- **ESM 强制严格模式**：模块天然 `"use strict"`，而 qiankun 沙箱的 `with(proxyWindow){}` 包裹**在严格模式下是语法错误**——沙箱与 ESM 天生互斥（这条推理链在[核心机制·JS 沙箱](../../mfe-mechanisms/guide-line/js-sandbox)第四节讲过）。

而 Vite 的哲学正是「拥抱原生 ESM」：开发态用浏览器原生 `import`（不打包、esbuild 预构建依赖），生产态用 Rollup 产出 ESM。于是 webpack 那套让 qiankun 满意的约束（`libraryTarget: 'umd'`、`chunkLoadingGlobal`）在 Vite 里**压根不成立**——Vite 没有 UMD 产物的一等公民地位。**qiankun 的加载模型与 Vite 的 ESM 中心，是两套不兼容的世界观。**

## 三、社区方案：vite-plugin-qiankun 的原理与局限

社区给出的桥是 **`vite-plugin-qiankun`**（第三方，非官方）。它的思路是「**把 Vite 子应用伪装成 qiankun 认得的样子**」：

- **注入判别标记**：模拟 <code v-pre>window.__POWERED_BY_QIANKUN__</code>、`__INJECTED_PUBLIC_PATH_BY_QIANKUN__` 等 qiankun 注入的全局变量。
- **改写生命周期导出**：把子应用的 `bootstrap/mount/unmount` **挂到 `window`** 上（用一个约定的 key），让 qiankun 能从全局取到，而不是从 UMD 导出取。
- **开发态特殊处理**：Vite dev 用原生 `type=module`，插件让 qiankun **绕过对这段脚本的沙箱执行**，直接用浏览器原生 ESM 加载子应用。

接入形态是这样的——`vite.config` 里挂插件（第一参是子应用名，须与主应用注册的 `name` 一致），入口用插件的 helper 包裹生命周期：

```ts
// 子应用 vite.config.ts：挂插件，名字对齐主应用注册的 name
import qiankun from "vite-plugin-qiankun";

export default defineConfig({
  base: "//localhost:7101/", // 供 qiankun 定位资源
  plugins: [
    vue(),
    qiankun("vue-app", { useDevMode: true }), // useDevMode：开发态走原生 ESM 直载
  ],
});
```

```ts
// 子应用 main.ts：用 helper 注册生命周期 + 判别独立/嵌入
import { renderWithQiankun, qiankunWindow } from "vite-plugin-qiankun/dist/helper";

function render(props = {}) {
  const { container } = props;
  createApp(App).mount(container ? container.querySelector("#app") : "#app");
}

renderWithQiankun({
  bootstrap() {},
  mount(props) {
    render(props); // qiankun 挂载时调用
  },
  unmount() {},
});

// 用 qiankunWindow 代理判别：独立运行时自己挂载
if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  render();
}
```

注意入口不再是 qiankun 标准的 `export bootstrap/mount/unmount`，而是插件的 `renderWithQiankun` 包裹、判别标记也换成 `qiankunWindow.__POWERED_BY_QIANKUN__`——这套「插件约定」正是它的侵入所在。它能让「Vite 子应用在 qiankun 里跑起来」，但代价要看清——**局限**：

| 局限 | 说明 |
| --- | --- |
| **沙箱基本失效** | Vite 子应用走原生 ESM、绕过了 qiankun 的 with/eval 沙箱，**JS 全局隔离几乎裸奔**、样式隔离也大打折扣——「跑起来」不等于「隔离住」 |
| **需按插件约定改入口** | 子应用入口要按插件的 `renderWithQiankun` 等 API 改写，有侵入 |
| **生产 build 额外配置** | dev（原生 ESM）与 build（Rollup 产物）行为不一致，生产接入常有额外坑 |
| **非官方、更新滞后** | 插件跟随 qiankun 版本，官方一动可能失配；出问题得自己啃 |

所以 `vite-plugin-qiankun` 更像「**存量项目里非塞 Vite 不可时的权宜之计**」，而不是「Vite + 微前端」的推荐姿势。若隔离对你重要，它的「沙箱失效」是硬伤。

## 四、什么时候该换路线

判断很简单——**先看子应用的构建工具与对隔离的要求**：

| 你的情况 | 建议 |
| --- | --- |
| 子应用全是 **webpack**，要开箱即用的沙箱/样式/HTML entry | **qiankun**（正对口，别折腾） |
| 子应用是 **Vite 主力**，且要**真沙箱** | 换 **[wujie](../../wujie/)**（iframe 沙箱，原生支持 ESM/Vite）或 **[micro-app](../../micro-app/)**（支持 `module` script） |
| 只有个别 Vite 子应用、隔离要求不高、存量已是 qiankun | 可用 `vite-plugin-qiankun` 兜，但接受沙箱失效 |
| 想要原生 ESM + 极致控制、团队肯自建 | 直接 **[single-spa](../../single-spa/) + import maps**（原生 ESM 路线） |

核心判据：**qiankun 2.x 与 Vite 是架构级不兼容，硬接的代价是丢隔离**。wujie 的 iframe 沙箱天生把 ESM 交给浏览器原生执行、隔离还更强，才是「Vite + 微前端 + 要隔离」的顺路选择。各方案的横向对比见[微前端基础·2026 选型全景](../../mfe-basics/guide-line/landscape-2026)。

## 五、3.0 的解法：新 loader 原生吃 ESM

qiankun 团队当然知道这是最大痛点——3.0 的核心重构之一就是**换掉 import-html-entry 这套模型**。3.0 的新 loader（`@qiankunjs/loader`）规划：

- **DOMParser 替代正则**解析 HTML（更健壮，正确处理各种 script 标签，包括 `type=module`）；
- **streaming**（流式）加载，边下边处理；
- **原生支持 `<script type="module">` / ESM 与 Vite**——从加载模型层面接纳 ESM，而非 hack。

这正是 3.0 roadmap（[discussion #1378](https://github.com/umijs/qiankun/discussions/1378)）里「Vite 集成 + Webpack 5 Module Federation 兼容」那条的落点。但现实要写准：**3.0 至今仍是 rc（rc.21，2026-02）、未 stable**，三年难产（详见[演进与现状](./evolution-status)）。对今天要做技术选型的人，正确姿势是「**别等 3.0，按 2.x 的现实做决策**」——要 Vite 就选 wujie/micro-app，别为「将来 qiankun 会支持」而赌排期。

## 小结

qiankun 2.x 接不了 Vite，是架构级的不兼容而非配置问题：import-html-entry 的「fetch 脚本回来当字符串 eval」模型，与 ESM 的专属语法、异步原生加载、强制严格模式（还和 with 沙箱互斥）根本对不上；而 Vite 以原生 ESM 为中心。社区的 `vite-plugin-qiankun` 能让它「跑起来」，但沙箱基本失效、非官方维护，只是权宜之计。选型的硬判据是**先看构建工具**：全 webpack 用 qiankun，Vite 主力且要隔离就换 wujie/micro-app。3.0 的新 loader 用 DOMParser + streaming 规划原生吃 ESM，但三年 rc、未 stable，别赌排期。qiankun 这些取舍的完整时间线与选型定位，是最后一页[演进与现状](./evolution-status)。
