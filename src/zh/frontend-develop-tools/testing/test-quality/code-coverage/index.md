---
layout: doc
---

# 代码覆盖率

代码覆盖率（Code Coverage）衡量测试执行时「跑到了多少源代码」，用 **Statements（语句）/ Branches（分支）/ Functions（函数）/ Lines（行）** 四个维度量化测试的充分程度。前端主要由 **Vitest**（`@vitest/coverage-v8` 默认，或 `@vitest/coverage-istanbul`）和 **Jest**（内置 `--coverage`）生成——一条命令即可输出终端摘要、可交互的 HTML 报告与 `lcov` 文件，并能用 `thresholds` / `coverageThreshold` 设阈值门禁，在 CI 中卡住覆盖率回退。

## 评价

**优点**

- **量化测试充分度**：把「测得够不够」从主观感觉变成可观测数字，暴露未覆盖的分支与函数
- **门禁防回退**：阈值不达标即 CI 失败，可设 `autoUpdate` 让基线只升不降
- **开箱即用**：Vitest / Jest 一个 flag 出报告，无需额外搭工具链
- **多格式报告**：终端 `text` 速览、`html` 逐行钻取、`lcov` 上传 Codecov / Coveralls 出徽章与 PR 增量
- **provider 可选**：Vitest 的 `v8`（快、零额外插桩）与 `istanbul`（精度高）按需切换

**缺点**

- **覆盖率 ≠ 测试质量**：代码「被执行」不等于「被断言」，100% 覆盖率仍可能漏验证（最大误区）
- **盲目追 100% 代价高**：边际收益递减，为凑数写无意义测试反而增加维护负担
- **provider 有取舍**：`v8` 早期映射偏差、`istanbul` 插桩拖慢，需理解差异再选（Vitest v3+ 的 v8 已支持 AST-aware remapping 大幅缩小差距）
- **排除配置易错**：`include` / `exclude` 不当会让覆盖率虚高或虚低，误导判断

## 文档地址

[Vitest Coverage](https://vitest.dev/guide/coverage.html) ｜ [Jest 覆盖率配置](https://jestjs.io/docs/configuration#collectcoverage-boolean)

## GitHub地址

[Istanbul（覆盖率引擎）](https://github.com/istanbuljs/istanbuljs)

## 幻灯片地址

<a href="/SlideStack/code-coverage-slide/" target="_blank">代码覆盖率</a>
