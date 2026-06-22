---
layout: doc
---

# 属性测试

属性测试（Property-based Testing）不写「给定输入 → 期望输出」的具体用例，而是声明**对所有输入都成立的不变量（property）**，再由框架自动生成成百上千组输入去证伪它。前端事实标准是 **fast-check**（用 TypeScript 编写，灵感来自 Haskell 的 QuickCheck 与 Python 的 Hypothesis）。它最核心的卖点是 **shrinking（收缩）**：谓词一旦失败，不止报第一个出错的随机输入，而是自动把反例简化到「最小可复现」再连同 `seed`/`path` 一起报告，让 bug 既好读又能精确重放。fast-check 是 **runner-agnostic（与测试运行器无关）** 的——`fc.assert(fc.property(...))` 在 Jest / Vitest / Mocha / AVA / Bun 里裸用即可，无需任何适配；`@fast-check/vitest`、`@fast-check/jest` 只是把它包成 `test.prop` 一行的语法糖。

## 评价

**优点**

- **一条属性 = 上千个用例**：声明不变量后框架自动生成大量输入，覆盖你「想不到」的边界（空串、`0`、`NaN`、超长、特殊字符）
- **shrinking 自动出最小反例**：失败后系统性收缩反例（报告里的 `Shrunk N time(s)`），比纯随机/fuzzing 报的「一坨原始大输入」好读得多
- **可精确复现**：报告给出 `seed` + `path`，原样填回 `fc.assert` 即可重放到那个反例，是复现 flaky 的标准姿势
- **runner-agnostic**：不绑定任何运行器，核心 `fc.assert` 处处可用，适配包按需选用
- **内置 70+ arbitraries**：从基本类型到 `record`/`array`/`json`，再到 model-based 的命令序列，覆盖面广

**缺点**

- **不变量本身难想**：最大门槛是「找到真正独立于实现的属性」，往返/排序/幂等/对拍这些范式需要练习
- **写错就退化成自测**：若把被测逻辑照抄进谓词，等于自己跟自己对拍，属性失去意义（头号反模式）
- **过滤太狠会变慢**：用 `.filter` 硬筛合法输入容易大量丢弃，触发「too many pre-condition failures」，应优先 `.map` 构造
- **是补充不是替代**：边界值、已知 bug 回归、文档式用例仍需 example-based 测试并存

## 文档地址

[fast-check 官方文档](https://fast-check.dev/)

## GitHub地址

[dubzzz/fast-check](https://github.com/dubzzz/fast-check)

## 幻灯片地址

<a href="/SlideStack/property-testing-slide/" target="_blank">属性测试</a>
