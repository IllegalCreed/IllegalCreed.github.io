---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

> 版本基线 **PapaParse 5.x**。本篇讲解析与反解析的精细控制：`dynamicTyping` 按列、`transform`/`transformHeader` 清洗、表头边界、`unparse` 进阶、远程下载、CSV 公式注入防护。

## 一、dynamicTyping 按列控制（避免 007 变 7）

`dynamicTyping: true` 会把**所有列**做转换，但很多时候这会出错——`007`、`00852`（订单号/邮编/区号）这类**前导零有意义**的标识符会被转成 `7`、`852`，**前导零丢失**。解法是按列精确控制：

```ts
// 对象形式：按列名/索引指定哪些列转、哪些不转
Papa.parse(csv, {
  header: true,
  dynamicTyping: {
    age: true,       // 转数字
    amount: true,    // 转数字
    zipcode: false,  // 保持字符串（前导零不丢）
    orderId: false,  // 保持字符串
  },
});

// 函数形式：动态决定
Papa.parse(csv, {
  header: true,
  dynamicTyping: (col) => col !== "zipcode" && col !== "orderId",
});
```

::: warning dynamicTyping 三条铁律
① **不转日期**——日期仍是字符串，要 Date 自己在 `transform` 里转；
② 超 `±2^53` 的数为**保精度不转**；
③ **前导零标识符**列务必排除，否则数据被破坏。
:::

## 二、transform：逐值清洗

`transform(value, colIndexOrHeader)` 对**每个字段值**生效，可在解析时即时清洗：

```ts
Papa.parse(csv, {
  header: true,
  transform: (value, column) => {
    if (column === "name") return value.trim();
    if (column === "createdAt") return new Date(value); // 自己转日期
    return value;
  },
});
```

## 三、transformHeader：规范列名

`transformHeader(header, index)` 对**每个表头名**生效（需 `header:true`），常用于统一列名格式：

```ts
Papa.parse(csv, {
  header: true,
  transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
});
// "First Name" → "first_name"
```

> 区分：`transform` 改**值**、`transformHeader` 改**键名**，都在解析阶段逐项调用。

## 四、表头边界：重复列名与多余字段

```ts
// 重复列名：自动重命名避免覆盖，映射记入 meta.renamedHeaders
const r = Papa.parse("name,name\nAda,Lovelace", { header: true });
// r.data → [{ name: "Ada", name_1: "Lovelace" }]（具体后缀以实现为准）
// r.meta.renamedHeaders → 记录重命名映射

// 某行字段多于表头：多出的进 __parsed_extra，并报 TooManyFields
const r2 = Papa.parse("a,b\n1,2,3", { header: true });
// r2.data → [{ a: "1", b: "2", __parsed_extra: ["3"] }]
// r2.errors → [{ type: "FieldMismatch", code: "TooManyFields", ... }]
```

## 五、preview 与 skipFirstNLines

```ts
Papa.parse(file, { preview: 5 });          // 只解析前 5 行（预览/探测表头）
Papa.parse(file, { skipFirstNLines: 3 });  // 跳过开头 3 行再解析（文件头有说明行）
// 可组合：先跳头、再限量
Papa.parse(file, { skipFirstNLines: 3, preview: 100 });
```

> `preview` 截断时 `meta.truncated` 为 true。两者方向相反：一个「只取开头」，一个「丢掉开头」。

## 六、beforeFirstChunk：解析前预处理原始文本

文件开头有几行无关的标题/说明，想让真正表头落到第一行：

```ts
Papa.parse(file, {
  header: true,
  beforeFirstChunk: (chunk) => {
    const lines = chunk.split(/\r\n|\r|\n/);
    lines.splice(0, 2); // 删掉开头两行说明
    return lines.join("\n");
  },
});
```

## 七、unparse 进阶：columns / quotes

```ts
// columns：固定输出哪些列及顺序（对象数组），缺键列输出空、表头一致
Papa.unparse(records, { columns: ["id", "name", "email"] });

// quotes：加引号策略
Papa.unparse(rows, { quotes: true });                 // 所有字段都加引号
Papa.unparse(rows, { quotes: [true, false, true] });  // 按列指定
Papa.unparse(rows, { quotes: (value) => value.includes("\n") }); // 按值决定

// 自定义分隔符与换行
Papa.unparse(rows, { delimiter: ";", newline: "\n" });
```

> 默认 `quotes:false` 是「**非必要不加**」——含逗号/引号/换行的字段仍会**自动加引号转义**，保证可被解析回来。

## 八、远程下载：download

```ts
// 基础
Papa.parse("https://example.com/data.csv", {
  download: true,
  header: true,
  complete: (res) => console.log(res.data),
  error: (err) => console.error(err),
});

// 带鉴权头
Papa.parse(url, {
  download: true,
  downloadRequestHeaders: { Authorization: "Bearer <token>" },
  complete: (res) => {},
});

// POST（设了 body 即改用 POST）
Papa.parse(url, {
  download: true,
  downloadRequestBody: JSON.stringify({ filter: "active" }),
  complete: (res) => {},
});
```

## 九、CSV 公式注入防护：escapeFormulae

导出的 CSV 被 Excel/Google Sheets 打开时，以 `=`、`+`、`-`、`@` 开头的单元格会被当**公式执行**，攻击者可注入恶意公式（CSV 注入）。导出**用户可控数据**时务必开启：

```ts
const csv = Papa.unparse(userData, { escapeFormulae: true });
// =SUM(A1) → '=SUM(A1)（前面加 ' 变纯文本，不会被当公式执行）
```

::: danger 安全提醒
任何把**用户输入**导出成 CSV 给人下载/在 Excel 打开的场景，都应开 `escapeFormulae:true`，否则存在公式注入风险。
:::

---

进入 [指南 · 专家](./expert)：Node.js 流式 `.pipe()`、内存模型深挖、`fastMode` 取舍、与 SheetJS 的边界协作、TypeScript 用法。
