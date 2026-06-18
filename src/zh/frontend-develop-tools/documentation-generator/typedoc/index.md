---
layout: doc
---

# TypeDoc

TypeScript 专用的 API 文档生成器：它**直接读取 TypeScript 的类型系统（typescript 编译器）**，把源码中导出的声明 + 文档注释转成可浏览的 HTML 站点或结构化 JSON 模型。与 JSDoc 最根本的分界在于——函数签名、参数类型、返回类型、泛型约束都从 TS 编译器拿到，**不写注释也能生成**，注释只负责"描述文字"。

## 评价

**优点**

- 类型来自 TS 编译器（含推断类型、泛型、联合类型），无需在注释里手写 `@type`，重构时永不脱节
- 从 entry point 跟随 `export` / re-export 跨文件解析，自动构建完整反射树，零手工编排
- 同时产出 HTML 站点与 JSON 反射模型，JSON 可喂给其他工具或编程式二次加工
- 配 `typedoc-plugin-markdown` 即可无缝接入 VitePress / Docusaurus，附带自动生成 sidebar
- `entryPointStrategy: packages` 原生支持 monorepo，每个子包独立跑再合并

**缺点**

- 仍是 0.x 版本（无稳定大版本承诺），minor 升级（如 0.27→0.28）常含破坏性变更，自定义主题/插件易崩
- 与 TypeScript 版本紧耦合（peer `5.0 ~ 6.0`），升 TS 往往要同步升 TypeDoc
- 默认主题只出 HTML，接 Markdown 文档站必须额外装插件，认知成本偏高
- 纯 JavaScript 项目用不上（那是 JSDoc 的地盘），定位窄
- 配置项繁多（入口策略、可见性、校验、分组分类相互交织），上手有一定门槛

## 文档地址

[TypeDoc](https://typedoc.org/)

## GitHub地址

[TypeDoc](https://github.com/TypeStrong/typedoc)

## 幻灯片地址

<a href="/SlideStack/typedoc-slide/" target="_blank">TypeDoc</a>
