---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

> 版本基线 **Papa Parse 5.5.4**。本篇把「会解析」用到「会处理真实数据」：CSV 为何不能手撕、返回值 vs 回调、流式 `step` / `chunk`、Web Worker 与错误处理。

## 速查

- CSV 的引号内可含分隔符和换行，引号用双写转义；不要用 `split()` 手工解析
- 只有字符串非流式调用可靠地同步返回完整 `ParseResult`；其它模式按回调 / 事件消费
- `step` 每次给一行，`results.data` 不是数组全集；不自行保留全部行时内存才保持有界
- `chunk` 只用于本地 File / 远程 URL，适合批量写入；不要同时配置 `step`
- `abort()` 会结束并触发 complete；`pause / resume` 只在非 Worker 模式可用
- `worker: true` 只适用于浏览器 Web Worker，跨线程传输有成本，可能比主线程略慢
- 解析问题查看每次 `results.errors`；File / 网络读取失败还要处理 `error` 回调
- 自动分隔符探测后检查 `meta.delimiter`；对外部固定格式最好显式指定 delimiter

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

## 二、返回值还是回调？一条规则记牢

```ts
// ✅ 同步：字符串 + 非流式（不开 step/worker）→ 用返回值
const r = Papa.parse(csvString, { header: true });
console.log(r.data);

// ⏳ 回调 / 事件：File / URL(download) / worker / Node 流
Papa.parse(file, { complete: (res) => console.log(res.data) });
```

简记：**「字符串 + 非流式 = 读取完整返回值；其它模式按回调 / 事件消费」**。字符串配 `step` 在 5.5.4 当前会在 `parse()` 返回前执行回调，但 API 仍不是 Promise，也不应从返回值读取累计数据。

## 三、流式逐行处理：step

大文件若一次性堆进 `data`，内存随数据量增长，浏览器可能 OOM。`step` 让**每解析一行就回调一次**；如果业务回调处理后释放该行、不另建全量数组，峰值内存主要受当前行、解析缓冲和业务队列控制：

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
- 流式 `complete` 只表示结束，不会再提供所有行的累计结果；汇总值要在 `step` 中自行维护。
:::

## 四、流式逐块处理：chunk

`chunk` 与 `step` 类似，但回调粒度是「**一块数据**」而非单行，适合批量处理。官方配置将它限定在本地 File / 远程 URL；不要和 `step` 同时使用：

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

Papa Parse 会把字段数不符、引号未闭合等**解析问题**收进 `errors`，`data` 仍尽量返回：

```ts
const r = Papa.parse(messyCsv, { header: true });
if (r.errors.length) {
  r.errors.forEach((e) => {
    console.warn(`[${e.type}/${e.code}] 第 ${e.row} 行: ${e.message}`);
  });
}
// data 里仍有能解析的行
```

错误三类 `type`：`Quotes`、`Delimiter`、`FieldMismatch`。**应主动检查 `errors`**；FileReader / 网络失败另走 `error` 回调，无效参数等编程错误仍可能抛异常。

## 七、自动分隔符探测与 TSV

`delimiter` 留空（默认）时自动探测——`\t`（制表符）、`|`、`;` 都在默认 `delimitersToGuess` 里，所以 TSV 也能直接读。要无歧义则显式指定：

```ts
Papa.parse(tsvText);                       // 多数 TSV 能自动识别
Papa.parse(tsvText, { delimiter: "\t" });  // 最稳妥
```

> 解析后看 `result.meta.delimiter` 可确认实际用了哪个分隔符——调试「分隔符猜错了？」很有用。

---

进入 [指南 · 进阶](./advanced)：`dynamicTyping` 按列控制、`transform`/`transformHeader` 清洗、`unparse` 高级用法、远程下载、CSV 注入防护。
