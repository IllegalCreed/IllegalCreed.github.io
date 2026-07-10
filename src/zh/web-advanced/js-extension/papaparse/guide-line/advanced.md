---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

> 版本基线 **Papa Parse 5.5.4**。本篇讲解析与反解析的精细控制：`dynamicTyping` 按列、`transform` / `transformHeader` 清洗、表头边界、`unparse`、远程下载与 CSV 公式注入防护。

## 速查

- `dynamicTyping` 可传布尔、按列对象或 `(field) => boolean`；ID / 邮编等前导零列保持字符串
- 转型会识别 number、boolean、空字符串与完整 ISO 时间戳；超安全整数边界的数字保持字符串
- `transform(value, field)` **先于** dynamicTyping，适合 trim / 规范化；`transformHeader` 只改键名
- 重复表头自动重命名为 `_1 / _2`，`meta.renamedHeaders` 保存新名到原名的映射
- `preview` 限制数据行数并令 `meta.truncated = true`；`skipFirstNLines` 先跳过文件前导行
- 对象数组导出用 `columns` 固定列与顺序；`quotes` 可按全局、列或函数决定
- 远程 `download` 走浏览器 XHR，受 CORS 约束；可配置请求头、body 与凭据
- 用户可控 CSV 导出启用 `escapeFormulae`，默认拦截 `= + - @ Tab CR`，也可传自定义正则

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
① 完整 ISO 时间戳会转成 `Date`，空字符串会转成 `null`；
② 超出安全整数边界的数为**保精度不转**；
③ **前导零标识符**列务必排除，否则数据被破坏。
:::

## 二、transform：逐值清洗

`transform(value, colIndexOrHeader)` 对**每个字段值**生效，并且在 `dynamicTyping` **之前**运行，可先清洗再让内置转换接手：

```ts
Papa.parse(csv, {
  header: true,
  transform: (value, column) => {
    if (column === "name") return value.trim();
    return value.trim();
  },
  dynamicTyping: (column) => column === "age" || column === "createdAt",
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
// r.data → [{ name: "Ada", name_1: "Lovelace" }]
// r.meta.renamedHeaders → { name_1: "name" }

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

固定跳过若干完整行时优先 `skipFirstNLines`；`beforeFirstChunk` 更适合必须按原始文本做的自定义处理，并要保证待处理内容完整落在第一块中。

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

`download` 使用浏览器 XHR，目标服务必须允许当前站点的 CORS；`withCredentials: true` 时服务端还要显式允许凭据，不能使用通配来源。

## 九、CSV 公式注入防护：escapeFormulae

导出的 CSV 被表格软件打开时，以 `=`、`+`、`-`、`@`、制表符或回车开头的值可能被当作公式。导出**用户可控数据**时应开启：

```ts
const csv = Papa.unparse(userData, { escapeFormulae: true });
// =SUM(A1) → '=SUM(A1)（前置单引号，令表格软件按文本处理）
```

也可传正则覆盖默认识别范围；该选项优先于 `quotes`，但仍需结合下载来源校验、内容审查和目标表格软件策略做纵深防护。

::: danger 安全提醒
任何把**用户输入**导出成 CSV 给人下载/在 Excel 打开的场景，都应开 `escapeFormulae:true`，否则存在公式注入风险。
:::

---

进入 [指南 · 专家](./expert)：Node.js 流式 `.pipe()`、内存模型深挖、`fastMode` 取舍、与 SheetJS 的边界协作、TypeScript 用法。
