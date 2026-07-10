---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

> 版本基线 **nanoid 5.1.16**。深入：ESM-only 产物与 CommonJS 互操作、3.x → 5.x 迁移、内部均匀性算法（拒绝采样）、缓冲池与性能、tree-shaking 与体积。

## 速查

- 5.1.16 只发布 ESM 源码，但较新 Node 能从 CJS 同步加载 ESM；“ESM-only”不等于所有 `require()` 都必然失败
- Node 22.12+ 可直接 `require('nanoid')`，Node 20 按官方说明需实验标志，Node 18 使用动态 `import()` 或 nanoid 3
- 3 → 5 迁移重点：移除 `nanoid/async`、移除 `nanoid/url-alphabet`、Node 基线提高，核心生成 API 保持稳定
- 非 2 的幂字母表通过 cutoff + 拒绝采样消除模偏置；2 的幂字母表走位掩码快路径
- Node 入口维护 128 倍随机字节池；浏览器入口直接按次调用 `crypto.getRandomValues`
- `sideEffects: false` 支持 bundler tree-shaking，但最终体积仍取决于入口、构建器与压缩配置
- TypeScript 类型内置，`nanoid<OpaqueType>()` 可直接生成 branded / opaque string 类型
- 工程兜底仍是容量评估、大小写敏感唯一索引和冲突重试；CSPRNG 只降低碰撞与猜测概率，不承诺唯一

## 一、纯 ESM 与 CommonJS 互操作

nanoid 5.1.16 的 `package.json` 是 `"type": "module"`，且不再发布 CommonJS 产物。这里的“ESM-only”描述的是包产物，不代表所有 Node 版本的 `require()` 都失败：新 Node 已能同步加载符合条件的 ESM。在 CommonJS 项目里有三条路：

```ts
// 路 1（最稳妥）：装 3.x，它有 CJS 产物
// npm install nanoid@3
const { nanoid } = require("nanoid"); // 仅当装的是 3.x 才可

// 路 2：在 CJS 里用动态 import()（异步，返回 Promise，合法）
let nanoid;
module.exports.createId = async () => {
  if (!nanoid) ({ nanoid } = await import("nanoid"));
  return nanoid();
};

// 路 3：较新 Node 用 require() 直接加载同步 ESM
// Node 22.12+ 默认支持；Node 20 需 --experimental-require-module；Node 18 只能走动态 import
```

| Node 版本 | 在 CJS 里 require 纯 ESM 的 nanoid 5 |
|---|---|
| 22.12+ | 默认支持 `require(ESM)`；本地 Node 22.19 已验证可直接解构 `nanoid` |
| 20 | 需 `--experimental-require-module` 标志 |
| 18 | 不支持，须用动态 `import()` 或改用 3.x |

> Jest（默认 CJS transform）常报「Cannot use import statement outside a module」：根因是它默认不转译 `node_modules` 里的 ESM。解法是配 `transformIgnorePatterns` 让 babel/ts-jest 转译 nanoid，或在测试中用 nanoid 3.x，或启用 Jest 的 ESM 支持。

## 二、3.x → 5.x 迁移清单

| 主题 | nanoid 3.x | nanoid 5.x |
|---|---|---|
| 模块系统 | ESM + CJS 双产物（可 `require`） | **ESM-only 产物**（新 Node 可从 CJS 加载） |
| `nanoid/async` | 提供异步入口 | **已移除** |
| `nanoid/url-alphabet` | 独立子入口 | **已移除**（`urlAlphabet` 从主入口导出） |
| `engines.node` | `^10 \|\| ^12 \|\| … \|\| >=15` | `^18 \|\| >=20` |
| 核心 API | `nanoid` / `customAlphabet` / `customRandom` | **保持稳定** |
| 默认长度 | 21 | 21（不变） |
| 默认字母表 | `A-Za-z0-9_-` | 不变 |

迁移时重点排查：① 残留的 `require('nanoid')`（CJS 调用）；② `import ... from 'nanoid/async'`；③ `import { urlAlphabet } from 'nanoid/url-alphabet'`。API 本身基本不用改。

## 三、均匀性算法：为什么不用 `random % len`

`randomByte % alphabet.length` 是个**常见错误**：当 256 不能被字母表长度整除时，前面一部分符号比后面的概率更高（**模偏置 modulo bias**），破坏分布。nanoid 改用**拒绝采样**：

- 计算 `safeByteCutoff = 256 - (256 % alphabet.length)`。
- 丢弃落在尾部、会造成偏置的字节，只接受 `< safeByteCutoff` 的字节。
- 这样保证每个符号概率均等，库也「tested for uniformity」。

**2 的幂字母表的快路径**：当 `alphabet.length` 恰为 2 的幂（如默认的 64 = 2^6）时，`safeByteCutoff` 等于 256，没有需要拒绝的字节，nanoid 用**位掩码 `& (len - 1)`** 代替取模——位运算更快、且天然无偏置。默认路径正走这个快路径。

## 四、缓冲池与性能

向 `crypto` 申请随机数有**系统调用开销**。nanoid 的策略是「发起更少、更大的请求」：维护一个比单次请求大得多的随机字节池（`POOL_SIZE_MULTIPLIER = 128`），一次填满、多次取用，池子用尽或不够时再重填。这把多次小请求合并成少数大请求，显著降低系统调用、提升吞吐。

```ts
// 源码思路（简化）
const POOL_SIZE_MULTIPLIER = 128;
let pool, poolOffset;
function fillPool(bytes) {
  if (!pool || pool.length < bytes) {
    pool = Buffer.allocUnsafe(bytes * POOL_SIZE_MULTIPLIER);
    crypto.getRandomValues(pool);
    poolOffset = 0;
  } else if (poolOffset + bytes > pool.length) {
    crypto.getRandomValues(pool);
    poolOffset = 0;
  }
  poolOffset += bytes;
}
```

> 同步加密随机在极少数熵不足场景可能短暂等待。具体吞吐依赖运行时与机器，不应把 README 某次 benchmark 当成应用 SLA；先测真实工作负载。早期 `nanoid/async` 入口已在新版移除。

## 五、tree-shaking 与体积

nanoid 5.x 标记 `"sideEffects": false`，对打包器声明无副作用：当你只 `import { nanoid }` 时，未用到的 `customAlphabet` / `customRandom` / `urlAlphabet` 可被 **tree-shake** 掉，进一步减小 bundle。这与它「118 字节、极小体积」的定位一致。

```ts
// 只引入用到的，其余被摇掉
import { nanoid } from "nanoid"; // customRandom 等不会进 bundle
```

## 六、TypeScript

nanoid **自带 `.d.ts` 类型声明**（exports 每个入口都配了 `types`），无需 `@types/nanoid`。5.1.16 的生成函数还支持泛型返回 opaque string 类型。

```ts
import { nanoid } from "nanoid";

declare const userIdBrand: unique symbol;
type UserId = string & { [userIdBrand]: true };

const id = nanoid<UserId>(); // id: UserId
```

## 七、最佳实践小结

- **ESM 项目直接用 5.x**；CJS 项目按 Node 版本选择同步 `require`、动态 `import()` 或仍受支持的 3.x。
- **敏感 ID 用默认版**（加密随机），非敏感且追求快才用 `nanoid/non-secure`。
- **短码必评估碰撞**：用 nano-id-cc，并配数据库唯一约束 + 冲突重试。
- **自定义字母表保证字符唯一、≤256**；缩小字母表要加长补熵。
- **复用 `customAlphabet` 生成函数**（提到模块级），别在热路径反复重建。
- **存库用大小写敏感 collation**，长度匹配 ID。

---

回到 [入门](../getting-started) 复习用法，或查 [参考](../reference) 速览 API、入口与对比表。
