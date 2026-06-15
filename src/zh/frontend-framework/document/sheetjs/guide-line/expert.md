---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

> 版本基线 **0.20.3**。深入边界与权衡：大文件性能与 Web Worker、dense 密集模式、加密/密码、公式不重算、社区版样式限制、`!merges`/`!cols` 等结构细节，以及与 ExcelJS 的选型。

## 一、大文件性能

SheetJS 的解析是**同步、CPU 密集**操作，浏览器里直接 `read` 大文件会**阻塞主线程**卡 UI。组合手段：

- **截断数据量**：`sheetRows: N` 在解析期只读前 N 行；`sheets` 只解析目标工作表。
- **放进 Web Worker**：把 `read` + `sheet_to_json` 整段移到 Worker，主线程只收结果。
- **dense 模式**：`dense: true` 降低超大表的内存占用（见下）。

```ts
// worker.js
import * as XLSX from 'xlsx';
self.onmessage = async (e) => {
  const wb = XLSX.read(e.data, { type: 'array', dense: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  self.postMessage(XLSX.utils.sheet_to_json(ws));
};
```

## 二、dense：密集工作表

默认**稀疏**结构以 A1 字符串作键挂在工作表对象上；`dense:true` 改用 `ws['!data']` 二维数组存单元格（`!data[r][c]`），对超大数据更省内存、遍历更快。多数 `utils` 对两种模式都兼容：

```ts
const wb = XLSX.read(buf, { type: 'array', dense: true });
const ws = wb.Sheets[wb.SheetNames[0]];
const a1 = ws['!data'][0][0]; // 第 1 行第 1 列的单元格对象
```

## 三、加密工作簿

```ts
const wb = XLSX.read(buf, { type: 'array', password: 'secret' });
```

> 社区版支持常见的 ECMA-376 加密；文件加密却不传 `password` 会解析失败。

## 四、公式：SheetJS 不重算

- **读取**：含公式的单元格给出 `f`（公式文本）与 `v`（文件里缓存的计算结果）。
- **写入**：把你给的 `f` 原样写进文件，但**不替你算结果**——结果要等 Excel/WPS 等打开时计算。

```ts
const ws = XLSX.utils.aoa_to_sheet([[1, 2, null]]);
ws['C1'] = { t: 'n', f: 'A1+B1' }; // 写公式（不含前导 =）
```

审查公式分布：

```ts
XLSX.utils.sheet_to_formulae(ws); // ['A1=1', 'B1=2', 'C1=A1+B1']
```

> 要在 JS 里**真正求值**得另接公式计算库，SheetJS 自身不提供计算引擎。

## 五、社区版样式的边界

社区版（`xlsx`）**写出单元格样式的能力有限**：字体、颜色、填充、边框等呈现属性基本无法写进文件（读取时可在 `cellStyles:true` 下把部分样式保留到 `s`）。完整样式写出属于 **SheetJS Pro**。

→ 需要带丰富样式的导出，常见替代是 **ExcelJS**。

## 六、结构细节：合并 / 列宽 / 行高

```ts
// 合并单元格：范围对象数组（以左上角单元格为数据源）
ws['!merges'] = [XLSX.utils.decode_range('A1:B1')];

// 列宽：wch 字符宽 / wpx 像素宽
ws['!cols'] = [{ wch: 12 }, { wpx: 120 }];

// 行高：hpt 磅 / hpx 像素
ws['!rows'] = [{ hpt: 24 }];
```

## 七、写出体积优化

```ts
// 启用 ZIP 压缩（默认是不压缩的存储模式）
XLSX.writeFile(wb, 'out.xlsx', { compression: true });

// 只导出 xlsx → 用精简变体，利于 tree-shaking
XLSX.writeFileXLSX(wb, 'out.xlsx', { compression: true });
```

## 八、SheetJS vs ExcelJS：怎么选

| 维度 | **SheetJS（社区版）** | **ExcelJS** |
|---|---|---|
| 格式覆盖 | **最广**（xlsx/xls/xlsb/ods/csv/Lotus/Numbers…） | 较窄（主 xlsx/csv） |
| 解析能力 | **强、容错好** | 一般 |
| 环境 | 浏览器 + Node 通用 | 浏览器 + Node |
| 样式写出 | **弱**（需 Pro） | **强**（字体/颜色/边框） |
| 流式写大文件 | 不专长 | **支持**（streaming writer） |
| 公式计算 | 不重算 | 不重算 |

**经验法则**：

- 要**读各种异构格式抽数据** → **SheetJS**（最强场景）。
- 要**导出带丰富样式的报表** / **流式写超大 xlsx** → **ExcelJS**（或 SheetJS Pro）。
- 简单读写 + 跨格式 → SheetJS 足矣。

## 九、安装来源再强调

最后回到那条贯穿全篇的提醒：**最新版从官方 CDN 装**。

```bash
npm rm --save xlsx
npm i --save https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
```

> `npm i xlsx` 只会装到滞后的 0.18.5（known registry bug）。authoritative source 是 `https://cdn.sheetjs.com/`。

---

回到 [入门](../getting-started) 复习读写，或查 [参考](../reference) 速览选项、字段与 `utils`。
