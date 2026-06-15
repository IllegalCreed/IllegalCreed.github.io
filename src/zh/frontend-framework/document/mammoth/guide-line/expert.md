---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

> 版本基线 **1.12.0**。深入边界与权衡：映射的优先级与合并顺序、`transformDocument` 按字体识别代码、`embedStyleMap` 内嵌映射、Markdown 的取舍、安全细节，以及与 docx-preview / docx 的选型。

## 一、映射的合并顺序与优先级

转换时，mammoth 把三类映射**按此顺序拼接**，并取「**第一条匹配**」的规则：

```text
自定义 styleMap  →  文档内嵌映射  →  内置默认映射
（用户优先）        （includeEmbedded）   （includeDefault）
```

- `includeEmbeddedStyleMap`（默认 `true`）：是否纳入文档内嵌的映射。
- `includeDefaultStyleMap`（默认 `true`）：是否纳入内置默认映射。

因为「第一条匹配优先」，所以**自定义规则总能覆盖默认规则**。要彻底只用自己的：两个都设为 `false`。

## 二、transformDocument：转 HTML 前改写 AST

styleMap 只能按样式名/直接格式匹配；**按字体、对齐等更复杂的条件**改判，要靠 `transformDocument`（作用于解析出的文档 AST，转 HTML 之前）。

::: warning API 稳定性
官方明确：transform 这套 API **应被视为 unstable，版本间可能变化**。生产使用要锁版本并加测试。
:::

**例：把居中且无样式的段落改判为 Heading 2**

```ts
const options = {
  transformDocument: mammoth.transforms.paragraph((p) => {
    if (p.alignment === "center" && !p.styleId) {
      return { ...p, styleId: "Heading2", styleName: "Heading 2" };
    }
    return p;
  }),
};
```

**例：按等宽字体识别代码段**

```ts
const mono = ["consolas", "courier", "courier new"];
const options = {
  transformDocument: mammoth.transforms.paragraph((p) => {
    const runs = mammoth.transforms.getDescendantsOfType(p, "run");
    const isCode =
      runs.length > 0 &&
      runs.every((r) => r.font && mono.includes(r.font.toLowerCase()));
    return isCode ? { ...p, styleId: "code", styleName: "Code" } : p;
  }),
  styleMap: ["p[style-name='Code'] => pre:separator('\\n')"],
};
```

> 思路：transform 先把「直接格式特征」翻译成一个**样式名**，再交给 styleMap 走常规映射。

## 三、embedStyleMap：让文档随身携带映射

希望**文档作者自助定义映射**、开发侧不必逐份硬编码？把映射**写进 docx**：

```ts
import fs from "node:fs/promises";

const docx = await mammoth.embedStyleMap(
  { path: "in.docx" },
  "p[style-name='Section Title'] => h1:fresh",
);
await fs.writeFile("out.docx", docx.toBuffer()); // 或 docx.toArrayBuffer()
```

此后 `out.docx` 被转换时，`includeEmbeddedStyleMap`（默认 true）会自动采用这份内嵌映射。要查看一份文档内嵌了什么，用 `readEmbeddedStyleMap(input)`。

## 四、Markdown 的取舍

`convertToMarkdown` 能输出 Markdown，但**已被官方标记 deprecated**。推荐路线：

```text
docx --convertToHtml--> HTML --(turndown 等库)--> Markdown
```

> 原因：Markdown 表达力有限，mammoth 的 Markdown 写出器维护优先级低。需要 Markdown 时，用成熟的 HTML→Markdown 库更可靠。

## 五、安全细节再强调

| 风险 | 对策 |
|---|---|
| 输出含 `javascript:` 链接等 | **对 `value` 做 DOMPurify.sanitize** |
| 文档引用外部文件（SSRF/读本地） | 保持 `externalFileAccess: false`（默认） |
| 病态文档导致性能问题 | 对不受信任输入考虑进程隔离 / 超时 |

> 一句话：mammoth 负责「转得干净」，**不负责「转得安全」**——安全是你的责任。

## 六、mammoth vs docx-preview vs docx：怎么选

| 维度 | **mammoth** | **docx-preview** | **docx（库）** |
|---|---|---|---|
| 方向 | docx → 干净 HTML | docx → 保真渲染 | JS → 生成 docx |
| 目标 | 拿**语义内容** | **像素级还原**外观 | **创建/导出**文档 |
| 外观保留 | 刻意丢弃 | 尽力还原 | — |
| 适配自家 CSS | **强** | 弱（自带样式） | — |
| 典型场景 | 导入 CMS/编辑器、检索、迁移 | 在线**预览** Word | 后端生成报告/合同 |

**经验法则**：

- 要把 Word **内容**导入系统、套自己的样式、做检索/迁移 → **mammoth**（最强场景）。
- 要在网页里**原样预览** Word（保留排版） → **docx-preview**。
- 要用代码**生成** .docx → **docx** / **docxtemplater**。
- mammoth **不能**把 HTML 回写成 docx——它是单向的。

## 七、生产清单

- [ ] 检查并记录每次转换的 `messages`（未识别样式 → 补映射）
- [ ] 不受信任的输入：`DOMPurify.sanitize(value)` 后再注入
- [ ] `externalFileAccess` 保持默认 `false`
- [ ] 锁定 mammoth 版本（尤其用了 `transformDocument`）
- [ ] 浏览器端引 `mammoth/mammoth.browser`，图片读取用 `readAsBase64String`

---

回到 [入门](../getting-started) 复习基本转换，或查 [参考](../reference) 速览选项、styleMap 语法与图片转换器。
