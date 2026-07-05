---
layout: doc
outline: [2, 3]
---

# 锚点、别名与合并键：复用配置

> 基于 YAML 1.2.2 · 核于 2026-07

## 速查

- **锚点 `&name`**：给某个节点起名，标记为可复用。
- **别名 `*name`**：引用之前用 `&name` 定义的锚点节点，实现复用。
- **别名是引用不是拷贝**：多处 `*name` 通常指向**同一份数据**，不是各自深拷贝。
- **合并键 `<<`**：把引用的一个或多个映射的键**合并**进当前映射，实现「继承默认值 + 局部覆盖」。
- **合并优先级**：当前映射显式写出的键 **>** 先出现的来源 **>** 后出现的来源；`<<: [*a, *b]` 里 `*a` 优先于 `*b`。
- **作用域**：锚点/别名限于**单个文档**，别名不能跨 `---` 引用，也不能**前向引用**（必须先定义后引用）。
- ⚠️ **合并键 `<<` 不在 YAML 1.2 规范正文**：它是 YAML 1.1 的「语言无关类型」（yaml.org/type/merge.html），靠解析器约定支持。
- ⚠️ **js-yaml 默认不开合并键**：默认 core schema 不含 merge，需切到含 merge 的 schema（如 `YAML11_SCHEMA`）才生效。
- **典型场景**：CI 里多个 job 共享同一套 `default` 配置、多环境共享基础配置再各自覆盖差异项。

## 一、锚点 `&` 与别名 `*`：定义与复用

锚点用 `&` 给节点命名，别名用 `*` 引用它，从而**避免重复书写**：

```yaml
# & 定义锚点，* 引用它
default_name: &name Alice
copy_1: *name    # → Alice
copy_2: *name    # → Alice

# 锚点也能标记整个映射或序列
base: &base
  timeout: 30
  retries: 3

service_a: *base   # 复用整个 base 映射
```

`&name` 把节点标记下来，之后任意个 `*name` 都引用**同一个节点**。锚点名只是序列化层面的复用手段，组合完成后会被丢弃（数据里不保留锚点名本身）。

::: warning 别名是引用，不是深拷贝
多处 `*base` 在多数解析器里引用的是**同一份数据对象**，而不是各自独立的副本。如果解析后得到的是可变对象，改动其中一处可能牵连到所有引用点（取决于语言/库的实现）。用锚点复用时要意识到这种「共享」语义，尤其在会修改解析结果的程序里。
:::

## 二、合并键 `<<`：继承 + 覆盖

只用别名 `*base` 是「整体复用」——无法在复用的同时局部改几个字段。**合并键 `<<`** 解决这个问题：它把引用映射的键合并进当前映射，当前映射自己写出的同名键会**覆盖**合并进来的值：

```yaml
defaults: &defaults
  adapter: postgres
  host: localhost
  timeout: 30

development:
  <<: *defaults        # 合并 defaults 的所有键
  database: dev_db     # 追加自己的键

production:
  <<: *defaults        # 合并 defaults
  host: db.prod.com    # 覆盖 defaults 里的 host
  database: prod_db
```

`production` 最终等价于 `{ adapter: postgres, host: db.prod.com, timeout: 30, database: prod_db }`——`host` 被本地值覆盖，其余继承自 `defaults`。

## 三、合并多个来源与优先级

`<<` 可以引用一个**序列**来合并多个映射：

```yaml
base: &base
  a: 1
  b: 1
override: &override
  b: 2
  c: 2

result:
  <<: [*override, *base]   # 合并多个来源
  a: 10                     # 自身键优先级最高
```

优先级规则是「**自身显式键 > 先出现的来源 > 后出现的来源**」。上例 `result`：`a` 用自身的 10；`b` 用先出现的 `*override` 的 2（`*base` 的 `b:1` 被压过）；`c` 用 `*override` 的 2。结果是 `{ a: 10, b: 2, c: 2 }`。理解这个顺序，才能用锚点稳妥地搭「基础配置 + 覆盖层」。

## 四、作用域与两个关键坑

### 作用域：单文档、先定义后引用

- 锚点/别名的作用域**限于单个文档**：别名 `*a` 只能引用**同一 `---` 文档内**、且**在它之前**定义的锚点 `&a`；
- 不能**前向引用**（引用后面才定义的锚点）；
- 不能**跨文档**引用（`---` 分隔的另一个文档里的锚点用不了）。跨文档/跨文件复用只能靠程序层面拼装。

### 坑一：合并键 `<<` 不在 YAML 1.2 规范

合并键其实**不是 YAML 1.2 规范正文的一部分**——它是 YAML 1.1 时代定义的一个「语言无关类型」（见 [yaml.org/type/merge.html](https://yaml.org/type/merge.html)）。1.2 规范没有正式收录它。因为太常用，几乎所有主流解析器都按约定支持，但这带来了实现差异（见下）。

### 坑二：js-yaml 默认不开合并键

具体到库：**js-yaml 默认使用 core schema（对应 1.2），其中不含 merge 标签**，所以默认情况下 `<<` 会被当成一个**普通字符串键**、合并不生效。要启用合并，需显式切到含 merge 的 schema：

```js
import yaml from 'js-yaml';

// 默认 schema 不含 merge：<< 被当普通键
yaml.load(text);

// 切到含合并键的 schema
yaml.load(text, { schema: yaml.YAML11_SCHEMA });
```

如果你发现 `<<: *defaults` 没生效、`<<` 原样出现在结果里，十有八九就是解析器的 schema 没开合并键——这正是「合并键不在 1.2 规范」在具体库里的直接后果。

---

复用机制掌握后，最后进入 [类型、Schema 与坑](./types-schemas-pitfalls)：隐式类型推断、Norway problem、三种 schema、1.1 vs 1.2 版本差异，以及跨解析器一致性。
