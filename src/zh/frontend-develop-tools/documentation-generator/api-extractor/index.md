---
layout: doc
---

# API Extractor

微软出品、**面向 TypeScript 库作者**的 API 分析工具。官方原话是它能 “produces three different output types”：**API 报告**（`.api.md`，把公共 API 序列化成快照、进 Git 走 PR 评审，拦截破坏性变更）、**`.d.ts` rollup**（像 Webpack 打包 JS 那样，把分散的 `.d.ts` 合并成单个发布用声明文件，并按发布等级裁剪）、**API 文档模型**（`.api.json`，供 `api-documenter` 渲染成 Markdown / DocFX 站点）。它读取 **TSDoc** 注释，靠 `@public` / `@beta` / `@alpha` / `@internal` 发布标签驱动裁剪与报告分级。它**不是**应用打包器，也**不**直接出 HTML 文档站。

## 评价

**优点**

- 把"公共 API 契约"做成 Git diff：`.api.md` 提交进仓库，API 一变 PR 里就有 diff，破坏性变更评审有据可依
- `.d.ts` rollup 简化声明分发：多文件声明合并成单个 `.d.ts`，还能按 `@public`/`@beta`/`@alpha` 产多档裁剪输出
- 三大功能（报告 / rollup / 文档模型）相互独立、按需开关，共用一次分析
- 微软背书 + Rush Stack 生态：贴合大型 monorepo，与 `api-documenter`、Rush、Heft 同源
- 是 TSDoc 标准的主要推动者 / 参考实现，对 TSDoc 语义落地最完整

**缺点**

- 偏库作者向：纯应用项目（不发包、无对外 API 契约）基本用不到
- 不直接出文档站：要 HTML / Markdown 还得配 `api-documenter` 或 DocFX，链路偏长
- 自带一份锁定版本的 TypeScript 编译器，与项目 TS 版本差异大时易报编译错误，需 `--typescript-compiler-folder` 手动对齐
- 配置项与诊断消息（`ae-*` / `tsdoc-*` / `TS*`）较多，上手有一定认知成本
- `--local` 与 CI 行为差异是高频坑：CI 误加 `--local` 会让破坏性变更门禁失效

## 文档地址

[API Extractor](https://api-extractor.com/)

## GitHub地址

[API Extractor](https://github.com/microsoft/rushstack)

## 幻灯片地址

<a href="/SlideStack/api-extractor-slide/" target="_blank">API Extractor</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=api-extractor" target="_blank" rel="noopener noreferrer">API Extractor 测试题</a>
