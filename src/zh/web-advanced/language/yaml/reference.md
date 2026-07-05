---
layout: doc
outline: [2, 3]
---

# 参考：YAML 速查与对照表

> 基于 YAML 1.2.2 · 核于 2026-07

## 速查

- **定位**：人类友好的数据序列化语言；缩进即层级、**禁 Tab**；配置首选（k8s / CI/CD / Ansible）。
- **三类节点**：标量 scalar、序列 sequence（`- item`）、映射 mapping（`key: value`，冒号后空格）。
- **五种标量样式**：plain / 单引号 / 双引号 / 字面块 `|` / 折叠块 `>`。
- **chomping**：`-` strip 全删、默认 clip 留一个、`+` keep 全留末尾换行。
- **复用**：锚点 `&` / 别名 `*` / 合并键 `<<`（`<<` 不在 1.2 规范，靠约定支持）。
- **多文档**：`---` 起始、`...` 结束。注释 `#`（不能在标量内）。
- **类型**：core schema 布尔仅 `true`/`false`；八进制 `0o`；null 为 `~`/`null`/空。
- **JSON 关系**：JSON 几乎是 YAML 1.2 的子集，合法 JSON 基本能被 YAML 解析。
- **头号坑**：Norway problem（`no`→布尔）、`1.20`→浮点、`010` 进制随版本变、解析器默认不一（js-yaml 1.2 vs PyYAML 1.1）。
- **规约**：布尔只写 `true`/`false`；形似其他类型的字符串一律加引号；不受信输入用 `safe_load`。

## 一、语法速查

| 语法 | 写法 | 说明 |
| --- | --- | --- |
| 映射 | `key: value` | 冒号后**必须**有空格 |
| 序列 | `- item` | 短横线后有空格 |
| 流式序列 | `[a, b, c]` | 借自 JSON |
| 流式映射 | `{k: v}` | 借自 JSON |
| 注释 | `# ...` | 到行尾；行内注释 `#` 前需空白 |
| 文档分隔 | `---` / `...` | 起始 / 结束 |
| 锚点 / 别名 | `&name` / `*name` | 定义 / 引用复用 |
| 合并键 | `<<: *name` | 合并映射键（继承+覆盖） |
| 显式标签 | `!!str` / `!!int` | 强制类型 |
| 复杂键 | `? key` + `: value` | 键为多行/序列/映射 |
| null | `~` / `null` / 空 | 空值 |

## 二、五种标量样式对照

| 样式 | 示例 | 转义 | 换行 | 适用 |
| --- | --- | --- | --- | --- |
| 普通 plain | `hello` | 无 | 折叠 | 简单值、无特殊字符 |
| 单引号 | `'it''s'` | 仅 `''`→`'` | 折叠 | 含特殊字符、不需转义 |
| 双引号 | `"a\nb"` | 完整（`\n` 等） | 折叠 + 转义 | 需换行/制表/Unicode |
| 字面块 `\|` | `\|` 引导 | 无 | **保留** | 脚本、模板、多行文本 |
| 折叠块 `>` | `>` 引导 | 无 | 折叠为空格 | 长段落 |

## 三、chomping 削减指示符

| 指示符 | 名称 | 末尾换行 |
| --- | --- | --- |
| `-`（如 `\|-`） | strip | 全部删除 |
| 无（如 `\|`） | clip（默认） | 保留一个 |
| `+`（如 `\|+`） | keep | 全部保留 |

## 四、类型推断（Core schema）

| 类型 | 匹配 | 例 |
| --- | --- | --- |
| null | `null \| Null \| NULL \| ~` / 空 | `~` |
| bool | `true \| True \| TRUE \| false \| False \| FALSE` | `true` |
| int（十进制） | `[-+]? [0-9]+` | `42` |
| int（八进制） | `0o [0-7]+` | `0o10`=8 |
| int（十六进制） | `0x [0-9a-fA-F]+` | `0xFF`=255 |
| float | `[-+]? ( \. [0-9]+ \| [0-9]+ ( \. [0-9]* )? ) ( [eE] [-+]? [0-9]+ )?` | `3.14` / `.5` |
| float（inf/nan） | `.inf` / `.nan`（含大小写变体） | `.inf` |
| str（默认） | 其余一切 | `no` / `2026-07-05` |

> `yes`/`no`/`on`/`off` 在 Core schema 里是**字符串**；只有 YAML 1.1 才把它们当布尔。

## 五、三种 schema 对比

| schema | 类型集合 | 特点 |
| --- | --- | --- |
| Failsafe | map / seq / str | 最保守，标量全当字符串，绝不误判 |
| JSON | + null / bool / int / float | 对齐 JSON，正则严格（`.5`/`TRUE` 退化为字符串） |
| Core | 同 JSON 但放宽正则 | 常用默认，识别 `~` / `0o` / `.inf` 等更多写法 |

## 六、YAML 1.1 vs 1.2 关键差异

| 写法 | YAML 1.1 | YAML 1.2 core |
| --- | --- | --- |
| `no` / `yes` / `on` / `off` | 布尔 | 字符串 |
| `010`（前导零） | 八进制 = 8 | 十进制 = 10 |
| 八进制写法 | `010` | `0o10` |
| 合并键 `<<` | 规范内类型 | 未收录（靠约定） |

## 七、解析器默认行为对比

| 解析器 | 语言 | 默认版本/schema | `no` 结果 | 合并键 `<<` |
| --- | --- | --- | --- | --- |
| js-yaml | JS | core（≈1.2） | 字符串 `"no"` | 默认**不开**（需 `YAML11_SCHEMA`） |
| PyYAML | Python | 近 1.1 | 布尔 `False` | 支持 |
| ruamel.yaml | Python | 1.2（可切 1.1） | 字符串 `"no"` | 支持 |
| SnakeYAML | Java | 1.1 | 布尔 | 支持 |

## 八、常见坑速查

| 坑 | 现象 | 解法 |
| --- | --- | --- |
| Norway problem | `NO` → 布尔 false | 加引号 `"NO"` |
| 版本号 | `1.20` → 浮点 1.2 | 加引号 `"1.20"` |
| 前导零 | 邮编 `010010` → 数字/丢零 | 加引号 `"010010"` |
| 冒号无空格 | `key:value` → 整体字符串 | 冒号后加空格 |
| Tab 缩进 | 解析报错 | 只用空格缩进 |
| 日期 | `2026-07-05` → 时间戳 | 需字符串则加引号 |
| 合并键失效 | `<<` 原样出现 | 解析器切含 merge 的 schema |
| 不安全加载 | `yaml.load` RCE 风险 | 用 `safe_load` |

## 九、选型对比：YAML vs JSON vs TOML

| 维度 | YAML | JSON | TOML |
| --- | --- | --- | --- |
| 定位 | 人类友好配置/序列化 | 机器友好数据交换 | 清晰的应用配置 |
| 注释 | ✅ `#` | ❌ | ✅ `#` |
| 可读性 | 高（缩进无括号） | 中 | 高（扁平） |
| 复用 | ✅ 锚点/别名/合并键 | ❌ | ❌ |
| 多行文本 | ✅ `\|` / `>` | ❌（仅 `\n`） | ✅ 三引号 |
| 隐式类型坑 | 多 | 少（显式） | 少（明确） |
| 缩进敏感 | ✅（禁 Tab） | ❌ | ❌ |
| 典型场景 | k8s / CI/CD / Ansible | API / `package.json` | Cargo / `pyproject.toml` |

**选型速记**：机器间传数据、要严格无歧义 → **JSON**；人写复杂配置、需注释/复用/多行 → **YAML**；中小型应用配置、要类型清晰又不易踩坑 → **TOML**。

## 十、工程场景速览

| 场景 | 用法 |
| --- | --- |
| GitHub Actions | `.github/workflows/*.yml`，`jobs`/`steps` 用序列套映射 |
| GitLab CI | `.gitlab-ci.yml`，锚点/`<<` 复用 job 配置 |
| Kubernetes | 资源清单，`---` 多文档一文件 |
| Docker Compose | `compose.yaml`，`services`/`volumes` 映射 |
| Ansible | Playbook，序列套映射描述 tasks |
| 应用配置 | Spring `application.yml`、各类框架 config |

## 十一、权威链接

- [YAML 官网](https://yaml.org) —— 首页与规范入口
- [YAML 1.2.2 规范](https://yaml.org/spec/1.2.2/) —— 当前权威规范（2021-10 修订）
- [合并键类型（1.1）](https://yaml.org/type/merge.html) —— `<<` 的定义来源
- [YAML 组织 · GitHub](https://github.com/yaml) —— 规范与相关仓库
- [nodeca/js-yaml](https://github.com/nodeca/js-yaml) —— JavaScript 解析器
- [yaml/pyyaml](https://github.com/yaml/pyyaml) —— Python 解析器
- [YAML 幻灯片](/SlideStack/yaml-slide/) —— 本主题配套幻灯片
