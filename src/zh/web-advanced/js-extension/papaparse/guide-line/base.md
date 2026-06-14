---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

> 版本基线 **PapaParse 5.x**。本篇把「会解析」用到「会处理真实数据」：CSV 为何不能手撕、同步 vs 异步、流式 `step`/`chunk`、Web Worker、错误处理。

## 一、为什么 CSV 不能 split(',') 手撕

CSV 是有正式规则（RFC 4180 风格）的格式，三条边界让简单 split 必然出错：

```ts
// 1) 引号字段内含逗号
'"Hello, World",foo'.split(",");
// ❌ ['"Hello', ' World"', 'foo']  —— 切成三列
Papa.parse('"Hello, World",foo').data[0];
// ✅ ["Hello, World", "foo"]       —— 两列

// 2) 引号字段内含换行（多行字段）
//    "line1\nline2",foo  —— 第一个字段跨两行，split('\n') 会切成两行

// 3) 双写引号转义
//    "She said ""hi""" —— 值是 She said "hi"
```

> 结论：**永远用解析器**。PapaParse 内部是状态机，正确处理引号、转义、跨行字段。

## 二、同步还是异步？一条规则记牢

```ts
// ✅ 同步：字符串 + 非流式（不开 step/worker）→ 用返回值
const r = Papa.parse(csvString, { header: true });
console.log(r.data);

// ⏳ 异步：File / URL(download) / worker / step 流式 → 走回调
Papa.parse(file, { complete: (res) => console.log(res.data) });
```

简记：**「字符串 + 非流式 = 同步返回值；其余 = 异步回调」**。`Papa.parse` 不返回 Promise。

## 三、流式逐行处理：step

大文件（几百 MB、几百万行）若一次性堆进 `data`，内存峰值≈整个数据集、随行数线性增长，浏览器可能 OOM。`step` 让**每解析一行就回调一次**，处理完即可丢弃，内存占用降到常数级：

```ts
let count = 0;
Papa.parse(file, {
  header: true,
  step: (results, parser) => {
    const row = results.data; // 注意：step 模式下是「当前这一行」，不是全部
    handleRow(row);           // 即时处理（写库 / 累加 / 更新进度）
    count++;
    if (count >= 100000) parser.abort(); // 满足条件可提前停止
  },
  complete: () => console.log("完成，共", count, "行"),
});
```

::: tip step 的关键点
- `step(results, parser)`：`results.data` 是**单行**（`header:false` 为数组、`header:true` 为对象）。
- `parser.abort()` 立即停止；`parser.pause()/resume()` 可暂停恢复（**非 Worker 时**）。
:::

## 四、流式逐块处理：chunk

`chunk` 与 `step` 类似，但回调粒度是「**一块数据**」而非单行——适合批量处理（一次插一批库记录）：

```ts
Papa.parse(url, {
  download: true,
  header: true,
  chunkSize: 1024 * 1024, // 1MB 一块（默认本地 ~10MB / 远程 ~5MB）
  chunk: (results, parser) => {
    bulkInsert(results.data); // 一次处理这一块的所有行
  },
  complete: () => console.log("全部处理完"),
});
```

## 五、Web Worker：不卡 UI

解析大文件会占用主线程，导致页面卡顿。`worker: true` 把解析放到**独立线程**，页面滚动/动画照常：

```ts
if (Papa.WORKERS_SUPPORTED) {
  Papa.parse(largeFile, {
    worker: true,
    header: true,
    step: (results) => updateUI(results.data),
    complete: () => console.log("Worker 解析完成"),
  });
}
```

::: warning Worker 的取舍
- **价值**：不阻塞主线程（不卡 UI）。
- **代价**：跨线程通信有开销，可能**略慢**于主线程解析。
- **限制**：Worker 下 **`parser.pause()/resume()` 不可用**（`abort` 仍可用）。需要暂停/恢复就别开 worker。
:::

## 六、错误处理：有 errors ≠ 失败

PapaParse **容错**——遇到字段数不符、引号未闭合等，把错误收进 `errors` 数组而**不抛异常中断**，`data` 仍尽量返回：

```ts
const r = Papa.parse(messyCsv, { header: true });
if (r.errors.length) {
  r.errors.forEach((e) => {
    console.warn(`[${e.type}/${e.code}] 第 ${e.row} 行: ${e.message}`);
  });
}
// data 里仍有能解析的行
```

错误三类 `type`：`Quotes`（引号）、`Delimiter`（分隔符）、`FieldMismatch`（字段数不符，`code` 为 `TooFewFields`/`TooManyFields`）。**应主动检查 `errors`**，不能假设没异常就没问题。

## 七、自动分隔符探测与 TSV

`delimiter` 留空（默认）时自动探测——`\t`（制表符）、`|`、`;` 都在默认 `delimitersToGuess` 里，所以 TSV 也能直接读。要无歧义则显式指定：

```ts
Papa.parse(tsvText);                       // 多数 TSV 能自动识别
Papa.parse(tsvText, { delimiter: "\t" });  // 最稳妥
```

> 解析后看 `result.meta.delimiter` 可确认实际用了哪个分隔符——调试「分隔符猜错了？」很有用。

---

进入 [指南 · 进阶](./advanced)：`dynamicTyping` 按列控制、`transform`/`transformHeader` 清洗、`unparse` 高级用法、远程下载、CSV 注入防护。
