---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

> 本篇三大主题：模块缓存 require.cache、循环依赖的「未完成副本」、CJS 消费 ESM 的 require(esm) 转正史。版本基线 **Node.js 22/24 LTS**（2026-06）。

## 一、模块缓存：require.cache

模块**首次加载后整个 module 对象进缓存**，键是**解析后的绝对文件名**；后续 require 命中缓存直接返回 `module.exports`，**模块代码不再执行**：

```js
require("./logger"); // 顶层 console.log('init') 打印
require("./logger"); // 命中缓存，不再打印 —— 副作用只跑一次
```

这带来三个推论与三个坑：

**推论**：副作用天然单次；依赖图处处同实例（单例语义）；require JSON 拿到的也是**全局共享的同一个可变对象**——改它会影响所有消费方。

**坑 1：缓存键是字符串，不归一化大小写。** 大小写不敏感文件系统（macOS 默认）上 `require('./foo')` 与 `require('./FOO')` 是**两个键**——同一文件被执行两次、产生两份 exports。同理，同一个包装进多个 node_modules 路径时也会多实例化，单例假设悄悄失效。

**坑 2：删缓存 ≠ 热重载。**

```js
delete require.cache[require.resolve("./mod")];
const fresh = require("./mod"); // 重新执行，拿到新 exports
```

局限有三：**已持有旧 exports 引用的模块不受影响**（手里还是旧对象）；**子依赖缓存未清**，重载是「新壳旧芯」；**native addon（.node）重载直接报错**（官方明确）。生产级热更新请重启进程或用真 HMR。

**坑 3：`node:` 前缀绕过缓存。** 官方示例：

```js
require.cache.fs = { exports: fakeFs };
require("fs");      // → fakeFs（命中缓存键 'fs'）
require("node:fs"); // → 真实内置模块（node: 前缀不查 require.cache）
```

测试想用 require.cache 劫持内置模块时，`node:` 前缀的引用劫持不到；反过来，安全敏感代码统一用 `node:` 前缀可防缓存投毒。

## 二、循环依赖：未完成副本

A require B、B 又 require A 时，CJS 不报错也不死锁——B 拿到的是 A 的**未完成副本（unfinished copy）**：只包含 A 在调用 `require(B)` **之前**已写入的导出。官方例子：

```js
// a.js                          // b.js
console.log("a starting");       console.log("b starting");
exports.done = false;            exports.done = false;
const b = require("./b.js");     const a = require("./a.js");
console.log("in a, b.done =",    console.log("in b, a.done =",
  b.done);                         a.done); // ← 关键
exports.done = true;             exports.done = true;
console.log("a done");           console.log("b done");
```

`main.js` 先 require a 再 require b，输出：

```text
main starting
a starting
b starting
in b, a.done = false   ← b 拿到 a 的未完成副本
b done
in a, b.done = true    ← a 这边 b 已执行完
a done
in main, a.done = true, b.done = true
```

**工程对策**（按优先级）：① 重构消环——把共享部分抽成第三个模块；② 延迟取用——在函数体内 require 或访问属性，等双方都加载完；③ 只在模块顶部「登记」、运行期再读 `module.exports` 的最新属性（避免解构缓存旧值）。坑的典型形态：顶层解构 `const { fn } = require('./a')` 在循环中拿到 `undefined`，而错误在调用时才爆发。

## 三、require(esm)：CJS 消费 ESM 的转正之路

CJS 项目曾被 ESM-only 依赖逼进死角：require 直接抛 `ERR_REQUIRE_ESM`，只能转译依赖、锁版本或整体迁移。require(esm) 终结了这段历史：

| 版本         | 状态                                                  |
| ------------ | ----------------------------------------------------- |
| v22.0.0      | 引入，藏在 `--experimental-require-module` 后（v20.17.0 同步旗标版） |
| **v22.12.0** | **LTS 默认开启**——「解锁」的标志性版本；随后 v20.19.0 获回携 |
| v23.5.0      | 默认不再打实验警告                                     |
| **v25.4.0**  | **标记 Stable**，互操作正式转正                        |

**为什么同步 require 能加载 ESM？** 实现者 Joyee Cheung 阐明的理论基础：**ES 规范保证不含顶层 await 的模块图可以完全同步求值**。「ESM 必然异步」是早期叙事固化的误解——异步只存在于源码获取与 TLA 两处。

**返回值映射**：

```js
// point.mjs: export default class Point {}
const ns = require("./point.mjs");
// → [Module: null prototype] { default: [class Point], __esModule: true }
// default 在 .default 上；自动附 __esModule 兼容 Babel/TS 转译消费方
```

ESM 侧可用**字符串导出名**定制 require 看到的值：

```js
export default class Point {}
export { Point as "module.exports" }; // require() 直接返回 Point 本体
// 代价：其余命名导出从 require 结果上丢失（import 消费不受影响），
// 官方建议把它们挂到该值上（如类的静态属性）
```

**唯一硬限制——顶层 await**：依赖图中任何一环含 TLA，require 即抛 **`ERR_REQUIRE_ASYNC_MODULE`**（require 必须保持同步）。好消息是 2024-09 的 top 5000 包调查里 ESM-only 包仅 6 个用 TLA——绝大多数依赖都能直接 require。

**工程管控三件套**：`process.features.require_module` 特性检测；`--trace-require-module` 打印使用位置；`--no-require-module` 一键禁用。辅助定位：`--experimental-print-required-tla`。

## 四、过渡方案：动态 import()

require(esm) 之前的官方过渡方案是**动态 `import()`**——它在 CJS 里完全合法（静态 `import` 语句才是语法错误），返回 Promise：

```js
// CJS 文件中
async function load() {
  const { default: chalk } = await import("chalk"); // 注意手动解 default
}
```

2026 年它仍有两个不可替代的场景：**加载含 TLA 的 ESM**（require 做不到）；**运行在 Node < 22.12 的存量环境**。代价是 **async 传染**：调用链被迫异步化，侵入面远大于 require(esm) 的零改造——这正是 require(esm) 的价值所在。

---

机制与互操作都通了，最后进入[指南 · 专家](./expert)：2026 年 CJS 的真实处境、遗产项目的维护策略与去留判断。
