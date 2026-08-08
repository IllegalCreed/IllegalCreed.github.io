---
layout: doc
outline: [2, 3]
---

# 参考：版本策略、破坏性变更与易错点速查

> 基于 HTTP/REST 工程实践 · 语义化版本 2.0.0 · 核于 2026-08

## 速查

- **为什么版本控制**：API 有外部客户端依赖，破坏性变更会让客户端崩溃。版本控制让破坏性变更放新版本，旧客户端继续用旧版本。
- **破坏性变更**：删除字段、改类型、参数改必填、改语义、改状态码、收紧校验。必须升 MAJOR。
- **三种策略**：URL（`/v1/`，最常用）、Header（`Accept-Version`，难调试）、媒体类型（`application/vnd.x.v1+json`，最 RESTful 最复杂）。
- **SemVer**：MAJOR.MINOR.PATCH，API 通常只暴露 MAJOR。
- **向后兼容**：只加不减、只放宽不收紧、新增可选参数、改实现不改契约。
- **废弃**：Sunset 头（RFC 8594）+ 迁移窗口（6-12 月）+ 410 Gone 下线。

## 一、三种策略对比速查

| 策略 | 示例 | 直观 | 调试 | 缓存 | REST 纯粹 | 推荐 |
| --- | --- | --- | --- | --- | --- | --- |
| **URL** | `/v1/users` | ✅ | ✅ | ✅ | ❌ | ✅ 务实首选 |
| **Header** | `Accept-Version: 1` | ❌ | ❌ | ❌ | 🟡 | ❌ 避免 |
| **媒体类型** | `application/vnd.x.v1+json` | ❌ | ❌ | ❌ | ✅ | 成熟团队 |

## 二、破坏性 vs 非破坏性变更速查

| 变更 | 破坏性？ | 处理 |
| --- | --- | --- |
| 删除字段 | ✅ 破坏 | 升 MAJOR |
| 改字段类型 | ✅ 破坏 | 升 MAJOR |
| 参数可选→必填 | ✅ 破坏 | 升 MAJOR |
| 改响应语义 | ✅ 破坏 | 升 MAJOR |
| 改状态码 | ✅ 破坏 | 升 MAJOR |
| 收紧校验 | ✅ 破坏 | 升 MAJOR |
| 新增字段 | ❌ 兼容 | 升 MINOR |
| 新增端点 | ❌ 兼容 | 升 MINOR |
| 参数必填→可选 | ❌ 兼容 | 升 MINOR |
| 放宽校验 | ❌ 兼容 | 升 MINOR |
| 新增可选参数 | ❌ 兼容 | 升 MINOR |
| 改实现（不改契约） | ❌ 兼容 | 升 PATCH |

## 三、SemVer 速查

| 位 | 含义 | 何时升 | API 对应 |
| --- | --- | --- | --- |
| MAJOR | 破坏性 | 不兼容改动 | `/v1/` → `/v2/` |
| MINOR | 兼容新功能 | 加功能 | 内部 |
| PATCH | 兼容 bug 修复 | 修 bug | 内部 |

## 四、废弃生命周期速查

| 阶段 | 状态 | 客户端体验 |
| --- | --- | --- |
| 活跃 | 正常服务 | 正常 |
| 标记废弃 | Sunset/Deprecation 头 | 正常 + 警告 |
| 迁移窗口 | 新旧并存 | 正常 + 监控 |
| 退役 | 410 Gone | 失败 + 升级指引 |

## 五、易错点清单

- **「破坏性变更可以直接改，不用升版本」**：错。会让依赖旧契约的客户端崩溃。必须升 MAJOR 版本。
- **「新增字段是破坏性变更」**：错。新增字段是向后兼容的（旧客户端忽略新字段），属非破坏性。
- **「把可选参数改必填不算破坏」**：错。旧客户端没传这个参数，改必填后请求失败——是破坏性。
- **「废弃等于删除」**：错。废弃是标记 + 给迁移窗口，旧版本仍正常工作；退役（Sunset）才真正下线。
- **「URL 版本控制违反 REST，不能用」**：争议。REST 纯粹派认为版本不该在 URL，但务实派（GitHub/Stripe）普遍用 URL 版本。选哪种都行，关键是统一。
- **「SemVer 的 MINOR/PATCH 也要暴露到 URL」**：错。API 通常只暴露 MAJOR（`/v1/`），MINOR/PATCH 是内部迭代（向后兼容）。
- **「410 和 404 一样」**：错。404 = 不知道有没有（通用不存在）；410 = 曾经有现在永久没了（退役，别再试）。版本下线用 410。
- **「GraphQL 也需要 URL 版本控制」**：基本不需要。GraphQL 靠新增字段 + @deprecated 平滑演进，几乎不版本化——这是它的优势。
- **「Sunset 头可以随便设个日期」**：要合理。基于客户端迁移进度动态调整，过早下线客户端崩溃，过晚维护成本高。
- **「下线就是删代码」**：错。下线前要确认流量接近 0，有长尾客户要保留最小适配，不能简单删。

## 六、进阶方向（链接其他叶）

- [REST API](../../rest-api/) —— 版本控制的载体（REST API 如何演进）
- [GraphQL API](../../graphql-api/) —— 靠 @deprecated 几乎不需显式版本控制
- [OpenAPI 规范](../../openapi-spec/) —— 用 `deprecated: true` 在 spec 层标记废弃

## 权威链接

- [Semantic Versioning 2.0.0](https://semver.org/)
- [RFC 8594 - The Sunset HTTP Header Field](https://www.rfc-editor.org/rfc/rfc8594)
- [API Versioning - Stripe 文档](https://stripe.com/docs/api/versioning)
- [GitHub API 的版本与媒体类型](https://docs.github.com/en/rest/overview/api-versions)
- [Microsoft REST API Guidelines - Versioning](https://github.com/microsoft/api-guidelines)
- [API Versioning - Google API Design Guide](https://cloud.google.com/apis/design/versioning)
- 本站幻灯片：<a href="/SlideStack/api-versioning-slide/" target="_blank">API 版本控制</a>
