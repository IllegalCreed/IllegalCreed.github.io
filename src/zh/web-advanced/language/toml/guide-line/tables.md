---
layout: doc
outline: [2, 3]
---

# 表、表数组与内联表

> 基于 TOML 1.0.0 · 核于 2026-07

## 速查

- **表** `[table]`：声明一张表（哈希/字典），之后到下一个表头或 EOF 前的键值对都归属它；根表在首个表头前就存在。
- **子表** `[a.b]`：点号表达嵌套；`[a]` 与 `[a.b]` 是父子关系。
- **点分键建表**：`a.b.c = 1` 自动创建中间「超级表」，与 `[a.b]` 写法**语义相通**。
- **内联表** `{ }`：一行内的紧凑表，`point = { x = 1, y = 2 }`；**完全自包含**——定义后不能从外部追加键、**禁尾随逗号**、不能跨行。
- **表数组** `[[products]]`：每出现一次**追加**一个表元素，用于表达对象列表；可挂子表 `[products.meta]` 与子表数组 `[[products.tags]]`。
- ⚠️ **不可重复定义表**：同一张表用 `[t]` 定义两次 → 报错；点分键已定义的表再用 `[t]` 表头 → 报错。
- ⚠️ **可追加全新子表**：点分键定义 `a.b` 后，用 `[a.b.c]` 追加一张**此前不存在**的子表是**允许**的。
- ⚠️ **键类型冲突**：键已是值（如 `apple = "red"`）后，再 `[fruit.apple]` 把它当表 → 报错。
- ⚠️ **静态数组不可被表数组追加**：`fruits = []` 后 `[[fruits]]` → 报错；同名的普通表与表数组互斥。
- **乱序表定义**：合法但官方**不鼓励**（不影响最终结构，只是可读性差）。

## 一、表（table）

方括号里写一个**名字**（不是放值）就是表头。`[server]` 之后、下一个表头或文件末尾之前的所有键值对，都归属 `server` 这张表：

```toml
[server]
host = "localhost"
port = 5432

[database]
name = "app"
pool = 10
```

对应结构：

```json
{
  "server":   { "host": "localhost", "port": 5432 },
  "database": { "name": "app", "pool": 10 }
}
```

在首个表头之前直接写的键值对，属于**根表（top-level table）**。表名遵循键的命名规则，可用裸键、引号键或点分键。

## 二、子表与点分键建表

用点号写出嵌套层级：

```toml
[fruit]
name = "apple"

[fruit.physical]   # 子表：fruit 的子表 physical
color = "red"
shape = "round"

[fruit.physical.dimensions]
diameter = 8.5
```

带引号的表名段可以包含点等特殊字符而不被拆层：

```toml
[dog."tater.man"]      # dog 下一张名为 "tater.man" 的子表
type.name = "pug"      # 表内也可用点分键
```

点分键与表头**语义相通**——下面两段等价：

```toml
# 写法 A：点分键
fruit.apple.color = "red"

# 写法 B：表头（等价结构）
[fruit.apple]
color = "red"
```

## 三、内联表（inline table）

内联表用花括号 `{ }` 把一张表写在**一行**内，适合简短的嵌套对象：

```toml
name  = { first = "Tom", last = "Preston-Werner" }
point = { x = 1, y = 2 }
animal = { type.name = "pug" }        # 内部可用点分键建子表
```

它等价于对应的 `[table]` 写法，但有一组**严格限制**：

- **完全自包含**：一旦用 `{ }` 定义完，就**不能**再从花括号外部往里追加键或子表。
- **不能跨行**（值内部的合法换行除外）。
- **禁止尾随逗号**：`{ a = 1, }` 非法。

```toml
[product]
type = { name = "Nail" }
# type.edible = false        # ❌ 非法：内联表定义后不能从外部追加键
```

::: tip 内部点分键 vs 外部追加
`animal = { type.name = "pug" }` 里，花括号**内部**用点分键建子表是**允许**的；非法的是定义完之后在花括号**外部**再写 `animal.type.edible = false` 去追加。一内一外，区别关键。
:::

## 四、表数组（array of tables）

双方括号 `[[name]]` 声明**表数组**：每出现一次 `[[products]]`，就往名为 `products` 的数组里**追加一个新的表元素**。这是表达「对象列表」的标准方式：

```toml
[[products]]
name = "Hammer"
sku = 738594937

[[products]]                 # 空表元素也允许

[[products]]
name = "Nail"
sku = 284758393
color = "gray"
```

对应结构：

```json
{
  "products": [
    { "name": "Hammer", "sku": 738594937 },
    { },
    { "name": "Nail", "sku": 284758393, "color": "gray" }
  ]
}
```

表数组元素下还能挂**子表**和**子表数组**（父级必须先存在）：

```toml
[[fruits]]
name = "apple"

[fruits.physical]            # 挂到最近一个 [[fruits]] 元素上的子表
color = "red"
shape = "round"

[[fruits.varieties]]         # 子表数组
name = "red delicious"

[[fruits.varieties]]
name = "granny smith"
```

## 五、经典陷阱

TOML 的表/点分键交互有几处高频坑，务必分清「非法」与「合法」的边界：

### 陷阱 1：重复定义表 → 报错

```toml
[fruit]
apple = "red"

[fruit]           # ❌ 非法：fruit 表被定义两次
orange = "orange"
```

### 陷阱 2：点分键已定义的表，不能再用表头重定义

```toml
fruit.apple.color = "red"
fruit.apple.taste.sweet = true

# [fruit.apple]          # ❌ 非法：fruit.apple 已被点分键定义
# [fruit.apple.taste]    # ❌ 非法：同理

[fruit.apple.texture]    # ✅ 合法：追加一张此前不存在的子表
smooth = true
```

「不能重定义已存在的表」与「可以追加一张全新子表」是两回事，别把前者误读成「点分键之后完全不能再出现相关表头」。

### 陷阱 3：键类型冲突

```toml
[fruit]
apple = "red"          # apple 已是字符串值

[fruit.apple]          # ❌ 非法：又想把 apple 当表，类型冲突
texture = "smooth"
```

### 陷阱 4：静态数组不可被表数组追加

```toml
fruits = []            # 用普通数组语法静态定义（即使为空）
[[fruits]]             # ❌ 非法：不能用 [[ ]] 追加到静态数组
name = "apple"
```

反过来，先有普通表 `[x]` 再写 `[[x]]`、或先有表数组 `[[x]]` 再写普通表 `[x]`，都属**同名类型冲突**，一律报错。

### 关于顺序

**乱序定义表**（如先 `[fruit.apple]`、再 `[animal]`、又 `[fruit.orange]`）是**合法但官方不鼓励**——它不影响最终映射到哈希表的结构，只是可读性差。要与「重复定义同一张表（非法）」区分开。

---

表家族掌握后，进入 [生态与常见坑](./ecosystem-and-pitfalls)：`Cargo.toml`、`pyproject.toml`、`wrangler.toml` 等真实落地，以及一份「从 YAML/JSON 转过来最容易踩」的坑清单与深入对比。
