---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

> 版本基线 **nanoid 5**。把 nanoid 用进真实项目：`customRandom` 自定义随机源、多端适配（浏览器 / React Native）、与 UUID/ULID 的选型决策、短码与前缀实战、数据库存储要点。

## 一、customRandom：替换随机源

当你需要**可复现（种子化）**或**自定义来源**的随机时，用 `customRandom(alphabet, defaultSize, getRandom)`。第三个参数是「给定 size、返回该长度随机字节数组」的函数：

```ts
import { customRandom, urlAlphabet } from "nanoid";
import seedrandom from "seedrandom";

const rng = seedrandom("my-seed");
const seededId = customRandom(urlAlphabet, 10, (size) =>
  new Uint8Array(size).map(() => 256 * rng())
);
seededId(); //=> 同一 seed 下可复现（用于测试快照等）
```

> ⚠️ 官方提醒：**nanoid 版本之间可能改变随机生成器的调用序列**。若你依赖种子复现，跨版本不保证结果一致。`customRandom` 内部仍用拒绝采样保证分布均匀（2 的幂字母表走 `& mask` 位掩码快路径）。

## 二、urlAlphabet 与默认字母表

5.x 把默认 URL 安全字母表从主入口具名导出：

```ts
import { urlAlphabet } from "nanoid";
urlAlphabet; //=> "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict"（64 符）
```

> ⚠️ 3.x 曾有 `import { urlAlphabet } from 'nanoid/url-alphabet'`，**5.x 移除了该子入口**，统一从 `'nanoid'` 导出。

## 三、浏览器免打包用法（CDN）

nanoid 5 是 ESM，浏览器原生支持，配 CDN 即可免打包：

```html
<script type="module">
  import { nanoid } from "https://cdn.jsdelivr.net/npm/nanoid/nanoid.js";
  console.log(nanoid());
</script>
```

> 5.x 不发布 UMD，所以没有 `window.nanoid` 全局变量，也不能用 `<script src>` 后取全局——必须走 ESM `import`。

## 四、React / React Native

**React**：不要把 `nanoid()` 用作列表的 `key`！key 必须在多次渲染间稳定，而每次渲染调用 `nanoid()` 都会产生新值，导致 React 误判元素变化、丢状态、掉性能。用**数据自带的稳定 ID**：

```tsx
// ❌ 错误：每次渲染都变
{todos.map((t) => <li key={nanoid()}>{t.text}</li>)}

// ✅ 正确：用数据的稳定 ID
{todos.map((t) => <li key={t.id}>{t.text}</li>)}
```

> 关联 `label`/`input` 等无障碍元素请用 React 18 的 `useId`，它不是用随机 ID 替代。

**React Native**：默认环境缺 Web Crypto 的 `getRandomValues`，需先装 polyfill 并**在 import nanoid 之前**导入它（顺序不可颠倒）：

```ts
import "react-native-get-random-values";
import { nanoid } from "nanoid";
```

## 五、选型：nanoid vs UUID v4 vs UUID v7 / ULID

| 需求 | 推荐 |
|---|---|
| 短链 slug、API 资源 ID、不可枚举 ID | **nanoid**（默认加密随机） |
| 前端临时元素 key、非敏感短码（追求快） | **nanoid/non-secure** |
| 通用唯一 ID、与现有 UUID 体系兼容 | UUID v4 |
| 主键需时间有序（索引写入局部性 / 按创建时间排序） | **UUID v7 / ULID** |

最该记住的反例：**当核心诉求是「时间有序」时，别用 nanoid**——它纯随机、不含时间戳，会让数据库 B-Tree 索引随机写入、局部性差。

## 六、CouchDB / PouchDB 的 _id

CouchDB/PouchDB 文档 `_id` **不能以下划线 `_` 开头**，而 nanoid 默认字母表含 `_`，可能凑巧以 `_` 起头。加固定前缀规避：

```ts
db.put({
  _id: "id" + nanoid(), // 确保不以 _ 开头
  // ...
});
```

## 七、字母表里的 `-` 开头问题

默认字母表含 `-`，ID 可能以 `-` 开头，被某些 CLI 参数解析器误认作 flag（如 `-myid` 被当成选项）。从**字母表层面**解决，而非事后替换（替换会破坏均匀性）：

```ts
import { customAlphabet } from "nanoid";
// 去掉 `-`，避免以连字符开头
const safe = customAlphabet(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_",
  21
);
```

## 八、数据库存储要点

默认 nanoid 是 **21 字符、ASCII 子集、大小写敏感**：

- 用长度匹配的字符串列（默认 `VARCHAR(21)` 或 `CHAR(21)`；加前缀/改长度需相应调整）。
- 因是 ASCII 文本，**不必**用 `BINARY`/`BLOB`。
- 关键：列/索引的排序规则要**大小写敏感**（如 `binary` 或 `*_bin` collation）。否则 `'Ab'` 与 `'aB'` 会被当成相等，破坏唯一约束、引发误判冲突。

---

进入 [指南 · 专家](./expert)：纯 ESM 与 CommonJS 互操作、3.x → 5.x 迁移、内部均匀性算法、缓冲池与性能、tree-shaking。
