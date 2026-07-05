---
layout: doc
outline: [2, 3]
---

# 生态落地与常见坑

> 基于 TOML 1.0.0 · 核于 2026-07

## 速查

- **Rust · `Cargo.toml`**：包清单——`[package]` 元信息、`[dependencies]` 依赖、`[[bin]]` 多二进制目标、`[features]` 特性开关。
- **Python · `pyproject.toml`**：`[build-system]`（PEP 518）+ `[project]` 元数据（PEP 621）；Ruff/Black/mypy/pytest 等工具配置也集中于此。
- **Cloudflare · `wrangler.toml`**：Workers 部署配置（`name`/`main`/`compatibility_date`/环境 `[env.production]`）。
- **Netlify · `netlify.toml`**：`[build]`、`[[redirects]]`、`[[headers]]` 等（本仓库幻灯片部署即用它）。
- **Hugo**：站点配置 `hugo.toml`（旧名 `config.toml`）。
- **工具链**：Taplo / Tombi（格式化 + LSP）、eslint-plugin-toml、`@iarna/toml`、Python 3.11+ 内置 `tomllib`（只读）。
- **坑 · 缩进无义**：从 YAML 来的人常以为缩进能表达层级——TOML 层级只认 `[表头]`/点分键。
- **坑 · 尾随逗号**：数组允许、内联表禁止。
- **坑 · 重定义/类型冲突**：表不可重复定义；键已是值不能再当表；静态数组不可被 `[[ ]]` 追加。
- **坑 · 大小写与小写字面量**：键大小写敏感；`true/false/inf/nan` 必须小写。
- **坑 · 整数溢出**：超 `2^63−1` 需用字符串。
- **坑 · `.5`/`5.`**：浮点小数点两侧都要有数字。

## 一、真实落地：谁在用 TOML

### Rust —— `Cargo.toml`

Rust 的包管理器 Cargo 用 TOML 描述包清单，这是很多人第一次接触 TOML 的场景：

```toml
[package]
name = "my-crate"
version = "0.1.0"
edition = "2021"

[dependencies]
serde = { version = "1.0", features = ["derive"] }
tokio = "1"

[[bin]]              # 表数组：可声明多个二进制目标
name = "server"
path = "src/server.rs"
```

注意其中 `serde = { version = "1.0", features = ["derive"] }` 用了**内联表**表达依赖的详细配置——这正是内联表最典型的用途。

### Python —— `pyproject.toml`

现代 Python 打包的统一入口，由两个 PEP 奠定：

```toml
[build-system]                        # PEP 518：声明构建后端
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]                             # PEP 621：项目元数据
name = "my-package"
version = "1.0.0"
requires-python = ">=3.9"
dependencies = ["requests>=2.28"]

[tool.ruff]                           # 各工具约定用 [tool.*] 命名空间
line-length = 100
```

`[build-system]` 由 **PEP 518** 引入，`[project]` 元数据由 **PEP 621** 标准化；Ruff、Black、mypy、pytest 等工具则约定把配置放在 `[tool.<名字>]` 命名空间下，一个文件收敛全部配置。

### 前端 / 部署生态

```toml
# wrangler.toml —— Cloudflare Workers
name = "my-worker"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[env.production]
vars = { API_URL = "https://api.example.com" }
```

```toml
# netlify.toml —— Netlify 构建与重定向（本仓库幻灯片部署即用它）
[build]
publish = "dist"
command = "npm run build"

[[redirects]]
from = "/*"
to = "/index.html"
status = 200
```

此外 **Hugo** 用 `hugo.toml`（旧名 `config.toml`）做站点配置。工具链方面，**Taplo** 与 **Tombi** 提供格式化与 LSP（编辑器智能提示/校验），Python 3.11+ 还内置了只读解析库 `tomllib`。

## 二、从 YAML / JSON 转过来最容易踩的坑

| 坑 | 说明 | 正确做法 |
| --- | --- | --- |
| **以为缩进有意义** | TOML 空白无语义，缩进被忽略 | 用 `[表头]` 或点分键表达层级 |
| **写 `enabled = yes`** | `yes/on/no/off` 不是 TOML 布尔 | 只能写 `true`/`false` |
| **内联表加尾随逗号** | `{ a = 1, }` 非法（数组才允许） | 内联表去掉末尾逗号 |
| **重复定义表/键** | `[t]` 两次、`name` 两次都报错 | 合并到一处，TOML 无覆盖语义 |
| **点分键后又 `[a.b]`** | 重定义已存在的表 → 报错 | 只能追加**全新**子表 `[a.b.c]` |
| **静态数组后 `[[x]]`** | `x = []` 后 `[[x]]` 报错 | 一开始就用表数组 `[[x]]` |
| **`.5` / `5.`** | 浮点小数点两侧都要有数字 | 写 `0.5` / `5.0` |
| **`0123` 前导零** | 十进制禁前导零 | 去掉前导零，或用 `0o` 八进制 |
| **`Inf` / `NaN`** | 特殊浮点必须小写 | 写 `inf` / `nan` |
| **超大整数** | 超 `2^63−1` 溢出 | 用字符串承载雪花 ID 等 |
| **正则里的 `\`** | 双引号会当转义、`\d` 报错 | 用单引号字面字符串 `'\d{2}'` |

## 三、TOML vs YAML vs JSON：深入对比

| 维度 | TOML | YAML | JSON |
| --- | --- | --- | --- |
| 定位 | 手写配置 | 手写配置 / 复杂数据 | 机器数据交换 |
| 层级 | `[表头]`/点分键（显式） | 缩进（空白敏感） | `{ }` 嵌套 |
| 注释 | ✅ `#` | ✅ `#` | ❌ |
| 原生日期 | ✅ 四型 | ✅ 时间戳 | ❌ |
| 隐式类型 | ❌（无「挪威问题」） | ✅（坑多） | ❌ |
| 锚点/引用 | ❌ | ✅ `&`/`*` | ❌ |
| 深层嵌套可读性 | 一般（易冗长） | 好 | 一般 |
| 解析歧义风险 | 低（设计目标） | 较高 | 低 |

- **TOML vs YAML**：TOML 用「稍冗长 + 显式层级 + 无隐式转换」换「强确定性」；YAML 更紧凑、支持锚点复用，但缩进敏感、隐式类型转换（`no`→false 的「挪威问题」、版本号被当浮点等）是经典坑源。**层级很深、需要锚点复用**（如 Kubernetes、CI）时 YAML 更合适；**层级不深的应用配置**用 TOML 更省心。
- **TOML vs JSON**：TOML 有注释、有日期、键可裸写，适合人手编辑；JSON 无注释、无日期、键必双引号，但作为 **API 传输 / 机器交换**更通用、生态更直接。程序生成/消费为主 → JSON；人手维护为主 → TOML。

::: tip 一句话选型
人手编辑、带注释与日期、层级不深 → **TOML**；机器交换、对接 Web API → **JSON**；深层嵌套 + 锚点复用 → **YAML**。
:::

---

看完落地与坑，去 [参考](../reference) 页拿一份可随时回查的语法/类型/坑对照速查表与权威链接汇总。
