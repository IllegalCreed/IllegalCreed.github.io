---
layout: doc
---

# 变异测试

变异测试（Mutation Testing）通过往源代码里**自动注入一个个微小的人为缺陷**（称为 mutant / 变异体，例如把 `+` 改成 `-`、`<` 改成 `<=`、`true` 改成 `false`），再用你**现有的测试套件**去跑——能让某个测试失败的变异体被「杀死」（detected），改坏后测试照样全绿的则「存活」（survived），暴露出测试盲区。它衡量的不是「代码跑没跑到」（那是覆盖率），而是「测试的断言够不够强、能不能抓到 bug」，因此俗称「**测试你的测试**」。前端主流工具是 **StrykerJS**，原生支持 **Vitest / Jest** 等运行器，并能用 `thresholds.break` 在 CI 里卡住测试质量回退。

## 评价

**优点**

- **抓出「假绿」测试**：覆盖率 100% 也可能只是「调用了代码、没校验返回值」，变异测试能直接揪出这种缺断言的无效测试
- **盲区清单可定位**：HTML 报告把每个 survived / no coverage 变异体高亮到具体行列，等于一份「该补哪些断言」的待办清单
- **指标客观**：mutation score = `detected / valid`，把「测得准不准」从主观感觉变成可观测数字
- **CI 门禁**：`thresholds.break` 不达标即退出码 1，阻止合并，防止测试质量悄悄退化
- **算子丰富 + 零侵入**：内置 15 类变异算子（算术 / 边界 / 布尔 / 逻辑 / 可选链 …），无需改业务代码，glob 圈定范围即可跑

**缺点**

- **慢一两个数量级**：本质是「N 个变异体 × 测试套件」，一个文件能生成几十上百个变异体，全仓跑几乎不可行——必须靠 `perTest` + 增量 + 缩小 `mutate` + 并发控本
- **100% 往往不可达**：存在**等价变异体**（变异后功能与原码完全等价，任何测试都杀不死），盲目追 100% 会逼出无意义测试
- **不适合 UI / 样板**：纯展示组件、自动生成代码跑出来多是低价值噪音，应排除出范围
- **门禁默认不生效**：`thresholds.break` 默认 `null`，不显式设值时**永远不会让 CI 失败**（高频陷阱）

## 文档地址

[StrykerJS 官方文档](https://stryker-mutator.io/docs/stryker-js/introduction/) ｜ [变异体状态与指标](https://stryker-mutator.io/docs/mutation-testing-elements/mutant-states-and-metrics/)

## GitHub地址

[stryker-mutator/stryker-js](https://github.com/stryker-mutator/stryker-js)

## 幻灯片地址

<a href="/SlideStack/mutation-testing-slide/" target="_blank">变异测试</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=%E5%8F%98%E5%BC%82%E6%B5%8B%E8%AF%95" target="_blank" rel="noopener noreferrer">变异测试 测试题</a>
