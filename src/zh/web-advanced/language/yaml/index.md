---
layout: doc
---

# YAML

**YAML Ain't Markup Language**——一种对人类友好、跨语言、基于 Unicode 的**数据序列化语言**，当前规范是 **1.2.2**（2021-10 修订版，相对 2009 年的 1.2 无规范性改动，只做勘误与澄清）。它围绕动态语言的常见原生数据类型——映射（map）、序列（sequence）、标量（scalar）——设计，首要目标就是「易于人类阅读」：靠**缩进**表达层级，用 `key: value` 写映射、`- item` 写列表，几乎没有引号和括号的视觉噪音，因此成为 CI/CD（GitHub Actions、GitLab CI）、Kubernetes 清单、Docker Compose、Ansible Playbook 以及各类应用配置的首选格式。YAML 1.2 的一个核心设计目标是做 **JSON 的严格超集**——规范明确说「JSON 几乎是 YAML 的完整子集」，合法 JSON 基本能被 YAML 1.2 解析器直接解析；而它的表达力又远超 JSON：注释 `#`、多文档 `---`、锚点 `&`/别名 `*`/合并键 `<<` 复用、字面块 `|` 与折叠块 `>` 多行文本、显式类型标签 `!!str`。但这份「人类友好」也有代价——**隐式类型推断**是它最大的坑源：`no`/`yes`/`on`/`off` 在 YAML 1.1 被当布尔（著名的 **Norway problem**）、版本号 `1.20` 被当浮点丢掉尾零、**禁用 Tab 缩进**、不同解析器（js-yaml 默认 1.2 vs PyYAML 默认近 1.1）对同一份文件可能给出不同结果。

## 评价

**优点**

- **人类可读、书写省心**：缩进即层级、`key: value` / `- item` 无引号无括号噪音，是最贴近「所见即所得」的配置格式，改一行的 diff 也清晰直观
- **表达力强**：注释 `#`、多文档 `---`、锚点/别名/合并键复用、`|`/`>` 多行文本、显式标签 `!!str`，都是标准 JSON 不具备的能力
- **JSON 的超集**：YAML 1.2 兼容 JSON，流式写法 `[]`/`{}` 直接借用 JSON 语法，二者可互转，迁移成本低
- **工程生态无处不在**：Kubernetes、Docker Compose、GitHub Actions、GitLab CI、Ansible、各类框架配置都用 YAML，堪称「配置界的通用语」
- **跨语言支持成熟**：几乎所有主流语言都有稳定的 YAML 库（PyYAML、js-yaml、SnakeYAML、go-yaml 等）

**缺点**

- **隐式类型推断是坑王**：`no`/`yes`→布尔（Norway problem）、`1.20`→浮点、`010`→八进制/十进制随版本而变、邮编/电话丢前导零；凡是形似其他类型的字符串都得加引号锁定
- **对缩进敏感、禁用 Tab**：一个空格错位就改变结构或报错；混入 Tab 直接非法，大文件里排查缩进问题很痛苦
- **版本 / 实现碎片化**：1.1 与 1.2 语义有别（布尔、八进制），且 PyYAML 默认仍近 1.1、js-yaml 默认 1.2，同一份 YAML 跨语言结果可能不一致
- **规范复杂**：完整 YAML 规范远比 JSON/TOML 复杂（锚点、标签、多种标量样式、chomping 削减），冷门特性多，边角行为容易踩坑
- **合并键 `<<` 不在 1.2 规范**：它是 YAML 1.1 遗留的「语言无关类型」，靠解析器约定支持，有的库（如 js-yaml 默认 core schema）默认并不开启
- **安全隐患**：某些语言的「全功能」加载器（如 PyYAML 的 `yaml.load`）会实例化任意对象，务必改用 `safe_load` 等安全接口

## 文档地址

[YAML 官网](https://yaml.org) ｜ [YAML 1.2.2 规范](https://yaml.org/spec/1.2.2/) ｜ [合并键类型（1.1）](https://yaml.org/type/merge.html)

## GitHub 地址

[YAML 组织](https://github.com/yaml) ｜ [nodeca/js-yaml](https://github.com/nodeca/js-yaml) ｜ [yaml/pyyaml](https://github.com/yaml/pyyaml)

## 幻灯片地址

<a href="/SlideStack/yaml-slide/" target="_blank">YAML</a>
