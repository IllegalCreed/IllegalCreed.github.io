---
layout: doc
outline: [2, 3]
---

# 入门

> 本篇讲 **type-fest** 的安装、核心心智与第一批最常用的类型。版本基线 **type-fest 4.x**（要求 **TypeScript ≥5.1** 且 `strict: true`）。它是**纯类型库**——只 `import type`，编译后零运行时代码。

## 速查

- 安装：`npm i type-fest`（多数项目放 `devDependencies` 即可，见下）
- 引入：`import type { PartialDeep } from 'type-fest'` —— **必须用 `import type`**（导出全是类型）
- 前置：TypeScript ≥5.1 + `tsconfig` 开启 `strict: true`
- 心智一：**零运行时**——编译后不产生任何 JS，对包体积/运行时零影响
- 心智二：**补齐内置**——内置搞不定的（深层、标称、字符串、JSON、键约束）才用它
- ⚠️ 它**不做运行时校验**，那是 `zod`/`valibot` 的事
- ⚠️ `Opaque` 已废弃，标称类型请用 **`Tagged`**

## 一、type-fest 是什么

官方一句话定位：「**A collection of essential TypeScript types**」。三个关键点：

1. **纯类型**：所有导出都是 `type`，没有一行运行时代码。所以引入只能用 `import type`，编译产物里会被完全擦除。
2. **补空白**：它解决 TS 内置工具类型（`Partial`/`Pick`/`Omit`/`Readonly`…）覆盖不到的场景——深层变换、标称类型、字符串大小写、JSON 序列化形态等。
3. **经验证**：这些类型边界极多（递归、分布式条件、索引签名），手写极易出错；type-fest 提供社区验证、测试充分的实现。

> 边界提醒：type-fest **不做运行时数据校验**。要校验「用户提交的邮箱格式是否合法」请用 `zod` 等会生成运行时代码的库。

## 二、安装与引入

```bash
npm i type-fest
```

```ts
// ✅ 正确：用 import type（导出全是类型）
import type { PartialDeep, Tagged, Simplify } from 'type-fest';

// ❌ 错误：它没有运行时值导出，require 拿不到东西
// const tf = require('type-fest');
```

### 放 dependencies 还是 devDependencies？

因为零运行时，编译产物不含对它的引用：

- **应用 / 不暴露它的库** → 放 `devDependencies`（仅构建期需要）。
- **发布的库，且公共 `.d.ts` 里直接 re-export / 引用了 type-fest 的类型** → 放 `dependencies`，否则下游解析你的类型时会缺包。

## 三、TS 版本与 strict

type-fest 4.x 的 readme 明确要求：

> Requires TypeScript >=5.1 and `{strict: true}` in your tsconfig.

很多类型依赖严格模式下的类型行为（区分 optional/可空、深层变换等），关闭 `strict` 会导致部分推断不符预期。不同 4.x 小版本可能进一步抬高 TS 基线，升级时留意 readme。

## 四、第一个深层类型：PartialDeep

内置 `Partial<T>` 是**浅层**的——只把第一层变可选，嵌套对象内部仍必填。`PartialDeep<T>` 递归地把每一层都变可选，最适合「合并默认配置 + 部分覆盖」：

```ts
import type { PartialDeep } from 'type-fest';

interface Settings {
  textEditor: { fontSize: number; fontColor: string; fontWeight: number };
  autocomplete: boolean;
}

const defaults: Settings = {
  textEditor: { fontSize: 14, fontColor: '#000', fontWeight: 400 },
  autocomplete: false,
};

// saved 只需填想改的字段，哪怕在嵌套里
function apply(saved: PartialDeep<Settings>) {
  return { ...defaults, ...saved };
}

apply({ textEditor: { fontWeight: 500 } }); // ✅ 深层只给一个字段也合法
```

> 同一模式还有 `ReadonlyDeep`（深层只读，内置 `Readonly` 只作用第一层）、`RequiredDeep`（深层必填）。记忆口诀：**内置浅层 vs type-fest 深层**。

## 五、改善悬浮提示：Simplify

`Simplify<T>` 把复杂类型（尤其是交叉 `A & B`）「摊平」成一个干净对象，主要为了让编辑器悬浮提示**可读**：

```ts
import type { Simplify } from 'type-fest';

type PositionProps = { top: number; left: number };
type SizeProps = { width: number; height: number };

// 悬浮 Props 会显示成合并好的 { top; left; width; height }
// 而不是 PositionProps & SizeProps 这一长串交叉
type Props = Simplify<PositionProps & SizeProps>;
```

它还有第二大用途：把 `interface` 密封成 `type`，从而满足某些需要索引签名的赋值（详见[专家篇](./guide-line/expert)）。

## 六、保住自动补全：LiteralUnion

`type Pet = 'dog' | 'cat' | string` 会被 TS 坍缩成 `string`，于是 IDE **丢失对 'dog'、'cat' 的补全**。`LiteralUnion` 修复它：

```ts
import type { LiteralUnion } from 'type-fest';

type Pet = LiteralUnion<'dog' | 'cat', string>;

const a: Pet = ''; // 输入时仍会提示 'dog' / 'cat'，同时允许任意 string
```

适用于「有一组推荐值，但也允许自定义字符串」的 API。

## 七、标称类型：Tagged

底层都是 `number` 的「账号」和「余额」，业务上绝不能互相误传。`Tagged` 给它们贴不同标签，使其成为**互不可赋值**的类型：

```ts
import type { Tagged } from 'type-fest';

type AccountNumber = Tagged<number, 'AccountNumber'>;
type AccountBalance = Tagged<number, 'AccountBalance'>;

function getBalance(acc: AccountNumber): AccountBalance {
  return 4 as AccountBalance; // 从底层类型断言出标称类型
}

const acc = 2 as AccountNumber;
getBalance(acc);       // ✅
// getBalance(2);      // ❌ 裸 number 不能直接当 AccountNumber 传
const n = acc + 2;     // ✅ tagged 值仍可当普通 number 用（底层未被隐藏）
```

> 注意：`Opaque` 是 `Tagged` 的**已废弃旧名**，新代码一律用 `Tagged`。

---

掌握这几类后，进入 [指南 · 基础](./guide-line/base)：对象类型族（`SetOptional`/`SetRequired`/`Merge`/`Except`/键约束）系统过一遍。
