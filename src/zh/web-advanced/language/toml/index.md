---
layout: doc
---

# TOML

**Tom's Obvious Minimal Language**——一门「面向人类」的**配置文件格式**，由 GitHub 联合创始人 Tom Preston-Werner 于 2013 年发起，2021 年 1 月发布首个稳定版 **1.0.0**（结束了长达数年的 0.x 阶段，是当前生态事实标准；社区后续推进了 1.1.0 线，但绝大多数工具链仍锁定 1.0.0）。它的核心设计目标是**语义显而易见、能无歧义地映射到哈希表**（即字典/对象结构），让任何语言都能轻松、确定地把它解析成数据结构。相较 JSON，TOML 原生支持**注释**（`#`）与**日期时间**类型、键通常可裸写，可读性更适合手写配置；相较 YAML，它**不靠缩进表达层级**（空白无语义）、也没有 `yes/no` 这类隐式类型转换，用「稍显冗长」换来「强确定性」。它的数据模型由**键值对**、**表**（`[table]`）、**表数组**（`[[array]]`）、**内联表**（`{ }`）以及整数、浮点、布尔、字符串、日期时间、数组等类型构成。最知名的落地包括 Rust 的 `Cargo.toml`、Python 的 `pyproject.toml`（PEP 518 / 621）、Cloudflare 的 `wrangler.toml`、`netlify.toml`、Hugo 站点配置等，40+ 语言都有成熟解析器。

## 评价

**优点**

- **为「人类手写配置」而生**：原生 `#` 注释、内置日期时间类型、键可裸写、语法直观，比 JSON 更契合需要人手编辑与批注的配置文件
- **无歧义映射哈希表**：任何合法 TOML 的解析结果都唯一确定，从根上规避了 YAML 缩进错位、`yes/no` 隐式布尔（「挪威问题」）那类歧义坑
- **缩进无语义**：层级完全由 `[表头]` 与点分键**显式表达**，复制粘贴、手改、生成 diff 都不会因为缩进多一格少一格而破坏结构
- **类型丰富且明确**：整数（含 `0x`/`0o`/`0b` 与下划线分隔）、IEEE 754 双精度浮点（含 `inf`/`nan`）、四种日期时间、布尔、四种字符串（基本/多行/字面/多行字面）
- **生态成熟、落地广**：Cargo、pyproject、Wrangler、Netlify、Hugo 等广泛采用，是 Rust/Python 工具链配置的主力格式

**缺点**

- **深层嵌套偏冗长**：多层结构写成一连串 `[a.b.c]` 表头或点分键会比 YAML/JSON 啰嗦，嵌套很深时可读性反而下降
- **不面向机器数据交换**：它是配置格式，作为 API 传输/大数据序列化不如 JSON 通用、也没有那么直接的浏览器/网络生态
- **表与点分键交互有陷阱**：重复定义、点分键 vs `[table]` 表头冲突、静态数组 vs 表数组不可混用等规则细节多，边界易踩坑
- **无引用/锚点/变量**：不像 YAML 有锚点与别名，重复内容只能重复书写，无法在文件内 DRY 复用
- **整数 64 位上限**：规范只要求 64 位有符号范围，超过 `2^63−1` 的超大数字会溢出，需改用字符串承载

## 文档地址

[TOML 官网](https://toml.io/en/) ｜ [v1.0.0 规范](https://toml.io/en/v1.0.0) ｜ [官方 Wiki（实现/工具目录）](https://github.com/toml-lang/toml/wiki)

## GitHub 地址

[toml-lang/toml](https://github.com/toml-lang/toml)

## 幻灯片地址

<a href="/SlideStack/toml-slide/" target="_blank">TOML</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=toml" target="_blank" rel="noopener noreferrer">TOML 测试题</a>
