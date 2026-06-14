---
layout: doc
outline: [2, 3]
---

# 入门

> 本篇带你装上 es-toolkit 并写出第一段代码。版本基线 **es-toolkit 1.47+**。对比对象：lodash / lodash-es 4.x。核心认知：**主包 `es-toolkit` 是现代核心集，`es-toolkit/compat` 是 lodash 兼容层**——这条贯穿全篇。

## 速查

- 安装（Node 18+）：`npm install es-toolkit`（pnpm `pnpm add`、yarn `yarn add`、bun `bun add`）
- Deno（JSR）：`deno add jsr:@es-toolkit/es-toolkit`，导入用 `@es-toolkit/es-toolkit`
- 具名导入（推荐）：`import { sum, chunk, debounce } from 'es-toolkit'`
- 分类子路径：`import { debounce } from 'es-toolkit/function'`
- 迁移 lodash：把 `from 'lodash'` 改成 `from 'es-toolkit/compat'`
- 核心数字：相比 lodash **体积小约 97%**、**快约 2~3 倍**、**零依赖**、**自带 TS 类型**
- ⚠️ 主包 `pick/omit` 只收**键数组**，不支持点号深路径（深路径在 compat）
- ⚠️ `merge`/`pull` 会**原地改入参**，不可变场景用 `toMerged`/`cloneDeep`

## 一、es-toolkit 是什么

官方定位：「**a modern JavaScript utility library**」——一个现代 JS 工具函数库，由 Toss 开源，对标并替代 lodash。三个关键点：

1. **更小**：用现代原生 API 重写，体积最多比 lodash 小约 97%（单函数可小至不足 100 字节）。
2. **更快**：运行时约 2~3 倍于 lodash（个别函数差异大，见进阶篇基准）。
3. **TS-first**：用 TypeScript 编写、内置类型，无需 `@types`；判断函数多是类型守卫。

> 边界提醒：es-toolkit 是**被调用的函数库**，不是运行时（不像 Bun/Deno），也不是打包器。它在任何标准 JS 环境里 import 即用，与你的运行时无关。

## 二、安装

```bash
# Node.js（18 及以上）
npm install es-toolkit
pnpm add es-toolkit
yarn add es-toolkit
bun add es-toolkit
```

```bash
# Deno：经 JSR，包名带 scope
deno add jsr:@es-toolkit/es-toolkit
```

es-toolkit **自带 TypeScript 类型**，不需要也不存在 `@types/es-toolkit`——这与 lodash 需额外装 `@types/lodash` 不同。

## 三、第一段代码

```ts
import { sum, chunk, groupBy } from 'es-toolkit';

sum([1, 2, 3, 4]); // 10
chunk([1, 2, 3, 4, 5], 2); // [[1, 2], [3, 4], [5]]

const users = [
  { name: 'Alice', role: 'admin' },
  { name: 'Bob', role: 'user' },
  { name: 'Carol', role: 'admin' },
];
groupBy(users, (u) => u.role);
// { admin: [Alice, Carol], user: [Bob] }
```

推荐**具名导入**：配合 es-toolkit 的摇树友好结构，最终只把用到的函数打进产物。不要默认导入整个库。

## 四、按需引入与子路径

除了从主入口 `es-toolkit`，还能从**分类子路径**引入，利于代码组织：

```ts
import { debounce } from 'es-toolkit/function';
import { pick } from 'es-toolkit/object';
import { isNil } from 'es-toolkit/predicate';
```

可用子路径：`array`、`function`、`math`、`object`、`predicate`、`promise`、`string`、`util`、`map`、`set`、`error`。

> 因为主包标了 `sideEffects: false` 且是 ESM 摇树友好结构，**从主入口具名导入与从子路径导入，最终打包体积通常一致**——不必迷信「子路径才小」。子路径主要价值在可读性与组织。

## 五、主包 vs 兼容层（最重要的认知）

| 维度 | **es-toolkit（主包）** | **es-toolkit/compat（兼容层）** |
|---|---|---|
| 定位 | 现代核心函数集 | Lodash 1:1 兼容 |
| API | 类型安全、简洁签名 | 含隐式转换、可变参数、深路径、链式 |
| 体积/速度 | 最小、最快 | 略大、略慢（仍优于 lodash） |
| 适用 | **新项目、追求最优** | **迁移既有 lodash 代码** |

```ts
// 主包：现代签名
import { pick } from 'es-toolkit';
pick({ a: 1, b: 2, c: 3 }, ['a', 'c']); // { a: 1, c: 3 }

// 兼容层：对齐 lodash（支持点号深路径、可变参数）
import { pick as pickCompat } from 'es-toolkit/compat';
pickCompat({ a: { b: 1, c: 2 } }, 'a.b'); // { a: { b: 1 } }
```

> 官方建议：**项目没有 lodash 历史就直接用主包**；`es-toolkit/compat` 只为迁移而生。

## 六、从 lodash 迁移（一行起步）

```ts
// Before
import { chunk, debounce, cloneDeep } from 'lodash';
// or
import { chunk, debounce, cloneDeep } from 'lodash-es';

// After（第一步：只改路径，行为 1:1）
import { chunk, debounce, cloneDeep } from 'es-toolkit/compat';
```

compat 自 v1.39.3 起做到 **100% 兼容**、能通过 lodash 自己的测试套件，第一步只换路径几乎零风险。之后再逐步把不依赖 lodash 怪癖的调用点切到主包。完整三步法见[进阶篇](./guide-line/advanced)。

---

掌握基本用法后，进入 [指南 · 基础](./guide-line/base)：常用函数族（数组 / 对象 / 函数 / 断言）、tree-shaking 与 `sideEffects`、可变 vs 不可变语义。
