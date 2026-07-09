---
layout: doc
---

# 快照测试

快照测试（Snapshot Testing）把某个值或组件渲染结果**序列化成快照**：首次运行生成基准快照存盘，后续运行将当前输出与基准比对，不一致即测试失败。Vitest 和 Jest 都内置 `toMatchSnapshot()`（外部 `.snap` 文件）与 `toMatchInlineSnapshot()`（内联写回测试文件），Vitest 还额外提供 `toMatchFileSnapshot()`（写到指定整文件）。它特别适合为 UI 组件渲染输出、错误信息、大型序列化结构（如 API 响应形状）提供低成本的回归防护。

## 评价

**优点**

- **低成本广覆盖**：一行断言即可锁定整个输出结构，免去逐字段手写断言
- **回归防护**：输出的任何意外变更都会立刻让测试失败并显示 diff
- **适合 UI 与序列化输出**：组件 DOM、错误信息、配置对象等结构化结果天然契合
- **内联快照贴近测试**：`toMatchInlineSnapshot` 把小快照写在断言旁，可读性好

**缺点**

- **易膨胀失控**：大快照难以人工审查，容易沦为「橡皮图章」——出错也照单全收
- **盲目更新掩盖回归**：不审查 diff 就 `-u` 更新，会把真实 bug 当成预期变更写进基准
- **动态数据不稳定**：日期 / 随机 ID 等需用属性匹配器处理，否则快照每次都不一致
- **不表达意图**：快照只记录「曾经是什么」，看不出「应该是什么」，不能替代精确断言

## 文档地址

[Vitest Snapshot](https://vitest.dev/guide/snapshot.html) ｜ [Jest Snapshot Testing](https://jestjs.io/docs/snapshot-testing)

## GitHub地址

[Vitest](https://github.com/vitest-dev/vitest)

## 幻灯片地址

<a href="/SlideStack/snapshot-testing-slide/" target="_blank">快照测试</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=%E5%BF%AB%E7%85%A7%E6%B5%8B%E8%AF%95" target="_blank" rel="noopener noreferrer">快照测试 测试题</a>
