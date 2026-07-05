---
layout: doc
outline: [2, 3]
---

# 生态与选型：JSON vs YAML vs TOML 与工程场景

> 基于 RFC 8259 / ECMA-404 · JSON Schema 2020-12 · 核于 2026-07

## 速查

- **定位分野**：**JSON = 数据交换**（机器↔机器，API/序列化，语法严格无注释）；**YAML/TOML = 配置**（人写为主）。
- **JSON vs YAML**：YAML 1.2 是 **JSON 的超集**（合法 JSON 基本都是合法 YAML）。YAML 缩进语法、支持注释/锚点/多文档，但**缩进敏感**、有 **Norway 问题**（`no`→`false`）等坑，常用于 CI/K8s。
- **JSON vs TOML**：TOML 面向**扁平配置**（`[table]` 分节，明确语义），是 `Cargo.toml`/`pyproject.toml`/`wrangler.toml` 的选择；深层嵌套不如 JSON/YAML 顺手。
- **JSON 做配置的短板**：无注释 → 用 **JSONC**（tsconfig/VS Code）或 **JSON5** 补；无类型契约 → 用 **JSON Schema**。
- **工程场景**：REST/GraphQL API 载荷、`package.json`/`.eslintrc.json` 配置、localStorage 存储、NDJSON 日志/流、JWT 载荷、OpenAPI/JSON Schema 契约、消息队列。
- **一句话**：**对外传数据用 JSON；给人写配置优先 YAML/TOML 或 JSONC/JSON5；要校验就叠 JSON Schema。**

## 一、三种格式的定位之争

JSON、YAML、TOML 常被拿来比较，但它们的**设计目标不同**：

| 维度 | JSON | YAML | TOML |
| --- | --- | --- | --- |
| 主定位 | **数据交换**（机器↔机器） | **配置**（人写，可读性优先） | **配置**（扁平、语义明确） |
| 语法 | 括号 + 双引号，严格 | 缩进（空格敏感） | INI 风格 `key = value` + `[table]` |
| 注释 | ❌（要 JSONC/JSON5） | ✅ `#` | ✅ `#` |
| 与 JSON 关系 | — | **YAML 1.2 是 JSON 超集** | 独立设计 |
| 深层嵌套 | 顺手 | 顺手（但缩进易错） | 偏笨拙（`[a.b.c]`） |
| 典型坑 | 大整数精度、无注释 | 缩进敏感、Norway 问题、隐式类型 | 深嵌套冗长 |
| 代表文件 | `package.json`、API 载荷 | K8s / GitHub Actions / Docker Compose | `Cargo.toml`、`pyproject.toml` |

### JSON vs YAML

YAML 1.2 在设计上**是 JSON 的超集**——几乎所有合法 JSON 都是合法 YAML。YAML 换来的可读性代价是：

- **缩进敏感**：错一个空格就解析出错或语义漂移。
- **Norway 问题**：`country: no`（挪威国家码）里的 `no` 被隐式解析成布尔 `false`；`version: 1.10` 可能变成 `1.1`。这类「聪明的隐式类型」是 YAML 的经典坑，YAML 1.2 有所收敛但生态实现不一。
- **锚点/别名/多文档**等强大特性，也意味着更高复杂度与更大攻击面。

**结论**：机器间传数据用 JSON（快、稳、无歧义）；给人频繁手写、需要注释的配置（CI 流水线、K8s 清单）用 YAML。

### JSON vs TOML

TOML（Tom's Obvious Minimal Language）主打「**明显、最小、语义无歧义**」，用 `[table]` 分节，非常适合**扁平到中等嵌套**的配置：

```toml
[package]
name = "demo"
version = "1.0.0"

[dependencies]
serde = "1.0"
```

它是 Rust `Cargo.toml`、Python `pyproject.toml`、Cloudflare `wrangler.toml` 的标准配置格式。**短板**：深层嵌套、数组套对象时语法变啰嗦，不如 JSON/YAML 直观。

## 二、JSON 做配置的补位方案

JSON 作为配置最大的痛点是**没有注释**。生态的补位路径：

- **JSONC**：跟随 TypeScript / VS Code 生态（`tsconfig.json`、`settings.json`），只加注释和尾逗号。
- **JSON5**：需要更宽松手写体验（单引号、无引号键、十六进制）。
- **换格式**：干脆用 YAML / TOML。
- **加契约**：用 **JSON Schema** 给 JSON 配置加结构校验与编辑器智能提示（VS Code 的 `json.schemas`、`$schema` 字段）。

详见 [变体页](./variants) 与 [JSON Schema 页](./json-schema)。

## 三、真实工程场景

### API 数据交换

REST / GraphQL 的请求与响应体几乎清一色 JSON：

```js
const res = await fetch("/api/users", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Ada" }),
});
const user = await res.json(); // 内部就是 JSON.parse
```

### 配置文件

- `package.json`：纯 JSON，Node/前端生态的项目清单。
- `.eslintrc.json`、`.prettierrc`、`components.json`：工具配置。
- `tsconfig.json`、VS Code `settings.json`：JSONC（可注释）。

### 存储与传输

- **localStorage / sessionStorage**：只能存字符串，`JSON.stringify` 存、`JSON.parse` 取。
- **JWT**：Header 与 Payload 都是 JSON（Base64URL 编码后拼接）。
- **消息队列 / WebSocket**：JSON 作为消息载荷格式。

### 日志与大数据

- **NDJSON**：结构化日志、大模型数据集、Elasticsearch `_bulk`——逐行独立、可流式、可追加。

### 契约与校验

- **OpenAPI / Swagger**：接口契约，schema 部分基于 JSON Schema。
- **JSON Schema + Ajv**：在 API 边界校验运行时数据，守住类型契约。

## 四、选型决策速记

| 你要做的事 | 选择 |
| --- | --- |
| 前后端 / 服务间传数据 | **JSON**（标准，别用变体对外） |
| 项目清单 / 工具配置（无注释需求） | **JSON**（`package.json` 等） |
| 需要注释的 TS/编辑器配置 | **JSONC** |
| 需要注释 + 宽松手写 | **JSON5** |
| CI / K8s / 复杂人写配置 | **YAML** |
| Rust/Python 等扁平项目配置 | **TOML** |
| 逐行流式 / 超大数据集 / 日志 | **NDJSON** |
| 给上面任何 JSON 加结构校验 | **JSON Schema**（Ajv） |

---

至此 JSON 的语法、API、变体、Schema、选型全部走完。速查与对照表汇总见 [参考](../reference)。
