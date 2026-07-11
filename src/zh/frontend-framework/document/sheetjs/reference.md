---
layout: doc
outline: [2, 3]
---

# 参考

> SheetJS（`xlsx`）常用 API、读写选项、单元格/工作表字段与 `utils` 速查。版本基线 **0.20.3**。

## 速查

- 内存读写：`XLSX.read(data, opts)` / `XLSX.write(wb, { bookType, type })`
- 文件读写：`XLSX.readFile(path)` / `XLSX.writeFile(wb, path)`；Node ESM 先执行 `XLSX.set_fs(fs)`
- 常用转换：`sheet_to_json` / `json_to_sheet` / `aoa_to_sheet` / `sheet_add_json`
- `sheet_to_json` 默认 `raw:true`；`header:1` 返回二维数组；`defval` 补齐空值
- `json_to_sheet(..., { header })` 的 `header` 只控制列顺序，**不会过滤**对象中的其他字段
- 大表解析：`sheetRows` 限行、`sheets` 选表、`dense:true` 使用 `!data` 二维数组
- 社区版 `password` 只支持 **XOR 加密的旧式 XLS**；AES-CBC XLSX/XLSM/XLSB 等需 Pro
- 官方安装：`https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`

## 一、顶层 I/O 函数

| 函数 | 作用 | 备注 |
|---|---|---|
| `XLSX.read(data, opts)` | 解析内存中的数据 → workbook | 需 `type` 声明数据形态；浏览器/通用 |
| `XLSX.readFile(path, opts)` | 从本地文件读取 → workbook | 浏览器不可用；Node ESM 先 `XLSX.set_fs(fs)` |
| `XLSX.write(wb, opts)` | 生成文件数据（字节/字符串） | 需 `bookType` + `type`；不落地 |
| `XLSX.writeFile(wb, name, opts)` | 生成并落地（Node 写盘 / 浏览器下载） | 按文件名后缀推断 `bookType` |
| `XLSX.writeFileXLSX(wb, name, opts)` | 只写 xlsx 的精简变体 | 利于 tree-shaking 减小包体积 |
| `XLSX.writeFileAsync(name, wb, cb)` | 异步写盘（回调） | Node，基于 `fs.writeFile` |

## 二、解析选项（ParsingOptions，用于 read/readFile）

| 选项 | 类型 | 默认 | 含义 |
|---|---|---|---|
| `type` | string | `"base64"` | 输入形态：`base64`/`binary`/`string`/`buffer`/`array`/`file` |
| `cellDates` | boolean | `false` | 把日期转成 JS `Date`（否则为数字序列号） |
| `cellNF` | boolean | `false` | 保存数字格式到 `z` |
| `cellStyles` | boolean | `false` | 保存样式/主题到 `s` |
| `cellText` | boolean | `true` | 保存格式化文本到 `w` |
| `cellFormula` | boolean | `true` | 保存公式到 `f` |
| `sheetRows` | number | `0` | >0 时只读每表前 N 行（解析期截断） |
| `sheets` | number/string/array | — | 只解析指定工作表 |
| `dense` | boolean | `false` | 生成密集工作表（单元格存进 `!data`） |
| `raw` | boolean | `false` | 纯文本格式下禁用值解析（保留原样字符串） |
| `password` | string | `""` | CE 仅解密 XOR 加密的 XLS；其他加密方案会报错 |
| `WTF` | boolean | `false` | 不抑制解析错误（调试用） |

> `type` 取值：`array`=Uint8Array/ArrayBuffer 字节数组、`buffer`=Node Buffer、`base64`=Base64 串、`binary`=二进制字符串、`string`=UTF-8 文本（仅纯文本格式）、`file`=磁盘路径（仅 Node）。

## 三、写入选项（WritingOptions，用于 write/writeFile）

| 选项 | 类型 | 默认 | 含义 |
|---|---|---|---|
| `bookType` | string | `"xlsx"` | 输出格式（见下表） |
| `type` | string | — | 输出形态：`base64`/`binary`/`string`/`buffer`/`array`/`file` |
| `compression` | boolean | `false` | 对 xlsx 启用 ZIP(DEFLATE) 压缩，减小体积 |
| `cellDates` | boolean | `false` | 日期以 ISO 字符串写出（否则数字序列号） |
| `bookSST` | boolean | `false` | 使用共享字符串表（SST） |
| `sheet` | string | `""` | 单表格式（如 csv）导出指定工作表 |
| `FS` | string | `","` | CSV/文本的字段分隔符 |
| `RS` | string | `"\n"` | CSV/文本的记录分隔符 |
| `Props` | object | — | 覆盖文档属性（Title/Author…） |

## 四、常用 bookType（输出格式）

| bookType | 扩展名 | 多表 | 说明 |
|---|---|---|---|
| `xlsx` | `.xlsx` | ✓ | Excel 2007+ XML（最常用） |
| `xlsm` | `.xlsm` | ✓ | 含宏 |
| `xlsb` | `.xlsb` | ✓ | Excel 二进制 |
| `biff8` | `.xls` | ✓ | Excel 97-2004 |
| `ods` / `fods` | `.ods` | ✓ | OpenDocument |
| `csv` | `.csv` | ✗ | 逗号分隔 |
| `txt` | `.txt` | ✗ | 制表符分隔（UTF-16） |
| `html` | `.html` | ✗ | HTML 表格 |

## 五、`utils`：表 ↔ JS 数据

| 函数 | 方向 | 说明 |
|---|---|---|
| `sheet_to_json(ws, opts)` | 表 → 数据 | 默认对象数组（首行作键）；`header:1` 出二维数组 |
| `json_to_sheet(aoo, opts)` | 数据 → 表 | 对象数组建表，键作表头 |
| `aoa_to_sheet(aoa, opts)` | 数据 → 表 | 二维数组建表 |
| `sheet_add_json(ws, aoo, opts)` | 追加 | 往已有表写对象数组（`origin` 定位） |
| `sheet_add_aoa(ws, aoa, opts)` | 追加 | 往已有表写二维数组（`origin` 定位） |
| `sheet_to_csv(ws, opts)` | 表 → CSV | `FS`/`RS` 控分隔符 |
| `sheet_to_html(ws)` | 表 → HTML | 返回 `<table>` 字符串 |
| `sheet_to_txt(ws)` | 表 → 文本 | 制表符分隔 |
| `sheet_to_formulae(ws)` | 表 → 公式 | `['A1=42','B2=A1+1', ...]` |
| `table_to_sheet(el)` / `table_to_book(el)` | DOM → 表/簿 | 把页面 `<table>` 转进来 |

> `json_to_sheet(data, { header: ['b', 'a'] })` 会优先按 `b, a` 排列，但数据里出现的其他键仍会继续写出；`header` 是顺序提示，不是字段白名单。

### `sheet_to_json` 选项

| 选项 | 取值 | 说明 |
|---|---|---|
| `header` | `1` / `"A"` / `string[]` | `1`→二维数组；`"A"`→用列字母作键；数组→自定义键（首行也作数据） |
| `range` | number / string | 数字=起始行(0 基)；字符串=A1 区域（如 `'A2:C10'`） |
| `defval` | any | 缺失/空单元格统一填该默认值 |
| `raw` | boolean | `false` 时尽量取格式化文本 `w` |
| `blankrows` | boolean | 对象模式默认跳过空行；AOA 模式默认保留 |
| `skipHidden` | boolean | 跳过隐藏的行/列 |

## 六、`utils`：工作簿与地址

| 函数 | 作用 |
|---|---|
| `book_new(ws?, name?)` | 新建工作簿（0.20.1+ 可一步带首个工作表） |
| `book_append_sheet(wb, ws, name?, unique?)` | 加工作表（名 ≤31 字符、需唯一；`unique=true` 自动改名） |
| `encode_cell({c,r})` / `decode_cell('C4')` | A1 地址 ↔ `{c,r}`（0 基） |
| `encode_range(rng)` / `decode_range('A1:D10')` | A1 范围 ↔ `{s,e}` |
| `encode_col(i)` / `decode_col('C')` | 列号 ↔ 列字母 |
| `encode_row(i)` / `decode_row(4)` | 行号 ↔ 行序号 |

## 七、单元格对象字段（Cell）

| 字段 | 含义 |
|---|---|
| `v` | 原始底层值 |
| `t` | 类型：`b`布尔 / `n`数字 / `e`错误 / `s`字符串 / `d`日期 / `z`空白存根 |
| `w` | 格式化后的显示文本 |
| `z` | 数字格式串（如 `"$0.00"`） |
| `f` | A1 公式文本（不含前导 `=`） |
| `s` | 样式/主题（社区版写出受限） |
| `l` | 超链接 `{ Target, Tooltip }` |
| `c` | 批注 |

## 八、工作表特殊键（以 `!` 开头）

| 键 | 含义 |
|---|---|
| `!ref` | A1 范围字符串（如 `'A1:D10'`），标记有效区域 |
| `!cols` | 列宽数组：`{ wch }`(字符) / `{ wpx }`(像素) |
| `!rows` | 行高数组：`{ hpt }`(磅) / `{ hpx }`(像素) |
| `!merges` | 合并区域数组：`{ s:{r,c}, e:{r,c} }` |
| `!data` | 密集模式下的单元格二维数组（`dense:true`） |

---

速查完毕，进 [指南 · 基础](./guide-line/base) 理解数据模型，或 [指南 · 进阶](./guide-line/advanced) 看浏览器/Node 实战与选项组合。
