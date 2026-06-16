---
layout: doc
---

# publint

校验 npm 包「发布正确性」的 linter——检查 `package.json` 的 `exports`/`main`/`module`/`types` 等字段，确保你的包在 Vite、Webpack、Rollup、Node.js 等主流环境下都能被正确解析。

## 评价

### 优点

- 聚焦「包能否被正确消费」：检查入口字段、文件存在性、ESM/CJS 互操作、类型导出，把发布事故拦在发布前
- 零安装可用：网页版 [publint.dev](https://publint.dev) 粘贴包名/npm 链接即可在浏览器里体检任意已发布包
- CLI 极简：库目录下 `npx publint` 开箱即用，无需配置文件；支持直接 lint `.tgz` tarball
- 规则覆盖现代打包生态：`exports` 条件顺序（types 最前、default 最后）、`.d.mts`/`.d.cts` 类型格式、废弃字段（`jsnext:main`）等
- 提供编程式 API（返回结构化 `messages`），易于集成进自定义发布工具链

### 缺点

- 范围较窄：只管「包的发布形态」，不检查业务源码逻辑（那是 ESLint/oxlint 的事）
- 类型检查能力有限：深层类型解析问题需搭配 `@arethetypeswrong/cli`（attw，基于 TS 编译器）才能抓全
- 必须在构建产物就绪后运行，否则入口指向的 dist 不存在会误报 `FILE_DOES_NOT_EXIST`
- 不做任何自动修复，只报告问题，需手动按规则调整 `package.json`

## 文档地址

[publint docs](https://publint.dev/docs/)

## GitHub地址

[publint/publint](https://github.com/publint/publint)

## 幻灯片地址

<a href="/SlideStack/publint-slide/" target="_blank">publint</a>
