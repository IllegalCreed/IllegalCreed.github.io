---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

> 本篇回答三个问题：2026 年 CJS 的真实处境如何？遗产 CJS 项目怎么维护？什么时候迁、什么时候不迁？版本基线 **Node.js 22/24 LTS**（2026-06）。

## 一、2026 处境：数据怎么读

两组数据放在一起才看得清全貌：

- **增量侧**：2026 年 npm top 1000 包的格式统计中，**CJS-only 已降至约 20%**——头部新生态明确转向 ESM / 双发布；
- **存量侧**：2024-09 对高影响力 top 5000 包的调查（Joyee Cheung 引述）：**3000+ 仍是 CJS**、466 双发布、526 faux ESM、559 ESM-only——其中**仅 6 个使用顶层 await**（意味着几乎所有 ESM 依赖都能被直接 require）。

读法：**增量在退潮，存量仍庞大**。三个事实决定 CJS 远未退场：

1. **默认地位仍在**：无 `type` 声明的 `.js` 依旧按 CJS 解析，Node 从未宣布废弃 CJS；
2. **遗产规模巨大**：十几年积累的企业内部系统、脚本、老包持续运转，维护需求长期存在；
3. **打包产物仍在用**：双格式发布的 `require` 入口、面向旧 Node 的 CJS 产物、Electron 主进程等宿主，让「CJS 作为分发格式」比「CJS 作为书写格式」活得更久。

## 二、维护者的依赖形态识别

排障与选型前，先认清手里依赖是哪种形态（识别手感即可，发布侧机制见 [ES Module](../../es-module/) 篇）：

| 形态         | 特征                                        | CJS 项目消费方式                  |
| ------------ | ------------------------------------------- | --------------------------------- |
| CJS-only     | 无 `type` / `"type": "commonjs"`，main 指 .js/.cjs | `require` 一如既往           |
| 双发布 dual  | exports 同时给 `require` 与 `import` 条件   | `require` 自动命中 CJS 入口       |
| faux ESM     | 源码 ESM、**发布物编译成 CJS**              | 当普通 CJS 用；注意 `.default` 包装 |
| ESM-only     | `"type": "module"` 且只发 ESM 文件          | Node ≥22.12 直接 require（无 TLA） |

## 三、遗产维护：消费 ESM-only 依赖的决策树

CJS 项目无法整体迁移、但必须用某个 ESM-only 依赖时，按侵入性递增排序：

| 优先级 | 策略                              | 条件与代价                                         |
| ------ | --------------------------------- | -------------------------------------------------- |
| ①      | **升 Node ≥22.12，直接 require** | 依赖图无 TLA；调用点零改造，首选                   |
| ②      | **动态 `import()` 改造调用点**   | 卡旧 Node 或依赖含 TLA；async 传染，侵入调用链     |
| ③      | **打包器预编译该依赖为 CJS**     | 构建复杂度 + 产物维护成本；锁死依赖快照            |
| ④      | fork 手改 / 永远锁旧版本          | 最后手段；与上游脱节，积累安全债                   |

跨版本运行的库可以写运行时守卫，按宿主能力选路径：

```js
/** 按宿主能力加载 ESM-only 依赖：新 Node 同步 require，旧 Node 退回 import() */
function loadEsmDep(id) {
  if (process.features.require_module) {
    return require(id); // Node 22.12+：零改造同步拿到命名空间
  }
  return import(id); // 旧 Node：返回 Promise，调用方需 await
}
```

配套纪律：CI 里加最低 Node 版本检查；用 `--trace-require-module` 审计 require(esm) 的扩散面；遇到 `ERR_REQUIRE_ASYNC_MODULE` 先用 `--experimental-print-required-tla` 定位是哪一层依赖在用 TLA，再决定走 ② 还是给上游提 issue。

## 四、打包产物里的 CJS

「写 CJS」与「发 CJS」是两件事。2026 年源码侧新项目基本写 ESM/TS，但**产物侧** CJS 仍是常客：

- 库的双格式发布中，`require` 条件继续服务存量 CJS 消费方（条件导出与发布侧细节见 [ES Module](../../es-module/) 篇，此处不展开）；
- tsdown / tsup / Rollup 等一键产出 `format: ['esm', 'cjs']`，`.cjs` 扩展名钉死产物归属，消除 `type` 歧义；
- require(esm) 普及后出现新趋势：**新库敢直接 ESM-only**——CJS 用户反正 require 得动（无 TLA 即可），双发布的必要性在下降。这是 Joyee 论证的反直觉效应：**互操作越顺滑，作者越没有维持双格式的负担，ESM 迁移反而被加速**。

## 五、给 2026 的判断

| 场景                   | 建议                                                         |
| ---------------------- | ------------------------------------------------------------ |
| 存量 CJS 项目运转良好  | 不为迁移而迁移；升 Node 22.12+ 解除「被 ESM-only 锁死」风险 |
| 要长期演进的项目       | 渐进迁移：先显式 `"type"`，新文件走 ESM，边界用 require(esm) 兜底 |
| 新项目                 | 直接 ESM 起步；CJS 知识用于读懂依赖、排障、维护产物格式     |
| 写公共库               | 面向未来发 ESM（要不要保留 CJS 产物，看消费方 Node 版本分布） |

**不变的底牌**：CJS 的解析算法、缓存语义与循环依赖行为仍是 Node 运行时的地基——哪怕一行 CJS 都不再写，排障时这些知识照样救命。

---

CommonJS 三篇指南完结。回到[入门](../getting-started)温习判定规则，或到[参考](../reference)查解析算法与 require(esm) 速查表；另一半故事在 [ES Module](../../es-module/) 篇。
