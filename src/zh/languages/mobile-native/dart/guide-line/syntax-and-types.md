---
layout: doc
outline: [2, 3]
---

# 语法与类型：与 JS/TS 对比、Null Safety

> 基于 Dart 3.x（2026 主线） · 核于 2026-08

## 速查

- **变量声明三档**：`var`（类型推断、可变）、`final`（单次赋值、运行时确定）、`const`（编译时常量、深度不可变）。区别于 JS 的 `let`/`const` 二档。
- **一切皆对象**：数字也是 `int`/`double` 对象（无原始类型），`null` 是 `Null` 类型的唯一实例。`Object` 是所有非空类型的根，`Object?` 包含 null。
- **类型系统**：`num`（int/double 的父类）、`String`、`bool`、`List<T>`（对应 JS Array）、`Map<K,V>`（对应 JS Object/Map）、`Set<T>`。`dynamic`（关闭类型检查，类似 JS 的 any）vs `Object`（仍是强类型）。
- **命名参数**：`void fn({required String name, int age = 0})`，调用 `fn(name: 'A', age: 20)`。Flutter Widget 全用命名参数让嵌套可读。位置参数用 `[]`（可选，如 `void fn(String a, [int? b])`）。
- **扩展运算符与集合 if/for**：`...`（展开）、`if (cond) value`（条件元素）、`for (var x in list) x`（循环元素）——在 List/Map/Set 字面量内可用，写动态集合极简洁。
- **Cascade `..`**：`obj..method()..field = x` 连续操作同一对象，省去重复写对象名。
- **健全空安全**：`T`/`T?` 二分（与 Swift/Kotlin 同源）；「健全」要求整个依赖图全空安全，否则进入 mix 模式（不保证）。`late`（延迟初始化非空）、`required`（命名参数强制传入）配套。
- **空安全工具**：`?.`（安全调用）、`??`（空合）、`!`（非空断言）、`?[]`（安全索引）。与 Swift/Kotlin 高度一致。
- **与 JS 的关键差异**：① `==` 是结构相等（不需 `===`）；② 数字统一为 `num`（无 JS 的 number 陷阱）；③ 模块用 `pub`（统一，无 CommonJS/ESM 之分）；④ 没有 `this` 动态绑定困惑；⑤ 类型运行时仍有效（TS 类型擦除）。
- **类与继承**：单继承 + mixin（多复用），`abstract class`、`interface`（隐式，所有类都是接口）、`enum`（增强枚举，Dart 2.17+ 支持字段与方法）。

## 一、变量声明：var / final / const

Dart 的变量声明比 JS 更精细，三档语义清晰：

```dart
var name = 'A';              // 类型推断为 String，可变（可重新赋值）
name = 'B';                  // OK
// var n = 1; n = 'x';       // ❌ 编译错误：类型已固定为 int

final age = 20;              // 单次赋值，运行时确定
// age = 21;                 // ❌ 编译错误
final now = DateTime.now();  // OK：运行时才确定值

const PI = 3.14;             // 编译时常量，深度不可变
const list = [1, 2, 3];      // 整个列表编译期固定（深度 const）
// const now = DateTime.now();  // ❌ 编译错误：不是编译时常量
```

- **`final` vs `const`**：`final` 是「运行时单次赋值」（值在运行时确定，如 `DateTime.now()`）；`const` 是「编译时常量」（深度不可变，整个对象图编译期固定）。`const` 的对象在内存中是**单例**（同一 `const list` 在多处引用同一实例）。
- **`var` 的类型固定**：一旦推断，类型不再改变（`var n = 1; n = 'x'` 编译错误）。这与 JS 的 `let`（类型可变）不同，Dart 更严格。
- **何时用 const**：Flutter 中能用 `const` 的 Widget 必须用（如 `const Text('hello')`），框架会复用实例，**避免不必要的重建**，是性能优化的关键。

## 二、类型系统：一切皆对象

```dart
// 数字：num（int/double 的父类）
int count = 42;
double price = 9.99;
num any = 10;                // num 接受 int 或 double
// 1 + 1.0                   // 结果 2.0（double）

// 字符串（单双引号等价，支持插值）
String s1 = 'hello';
String s2 = "world";
String greeting = 'Hello $name, age ${age + 1}';   // 插值

// 布尔（严格 bool，无 JS 的 truthy/falsy）
bool ok = true;
// if (1) { }                // ❌ 编译错误：非 bool 不能用于条件（无 JS 的 truthy）

// 集合
List<int> list = [1, 2, 3];              // 对应 JS Array
Map<String, int> map = {'a': 1};         // 对应 JS Object/Map
Set<int> set = {1, 2, 3};

// dynamic vs Object
dynamic x = 'a'; x = 1;                  // 关闭类型检查（类似 JS any）
Object y = 'a'; // y.length              // ❌ Object 没有 length（强类型）
```

- **数字统一**：Dart 的 `int`/`double` 都是 `num` 子类，运算时自动提升（`1 + 1.0` = `2.0`）。避免了 JS 的数字精度问题（JS 全是 double，`0.1 + 0.2 != 0.3`）——Dart 的 `int` 是真正的整数。
- **无 truthy/falsy**：条件表达式必须是 `bool`，`if (1)` 或 `if ('')` 都编译错误（JS 中 `1` 是 truthy、`''` 是 falsy）。这避免了 JS 的隐式转换 bug。
- **`dynamic` vs `Object`**：`dynamic` 关闭类型检查（任何方法调用都通过，运行时才报错，类似 JS）；`Object` 是强类型根类（只有 `Object` 的方法可调）。优先用 `Object`（保留类型检查），仅在需 JSON 互操作等场景用 `dynamic`。

## 三、命名参数与可选参数

Dart 的函数参数比 JS 更强大，是 Flutter Widget 嵌套可读的基础：

```dart
// 命名参数（{} 包裹）：调用时必须写参数名
void greet({required String name, int age = 0, String? title}) {
  print('$title $name, $age');
}
greet(name: 'A', age: 20);              // name 必传（required），age 默认 0

// 位置参数（[] 包裹）：按位置传，可选
void log(String msg, [String? tag]) { print('[$tag] $msg'); }
log('hello');                            // tag 默认 null
log('hello', 'INFO');

// 默认值
void configure({int timeout = 30}) { /* ... */ }
```

- **`required` 关键字**：命名参数默认可空可选，加 `required` 强制必须传入（空安全时代保证非空参数不漏传）。
- **Flutter Widget 全用命名参数**：`Text('hi', style: TextStyle(...), maxLines: 1)`，让嵌套 Widget 树每个属性一目了然——这是 Flutter 选择 Dart 而非 JS 的原因之一（JS 的对象字面量也能模拟，但命名参数有类型检查与 IDE 补全）。
- **`@required` 注解 vs `required` 关键字**：旧版用 `@required` 注解（meta 包），空安全后用语言级 `required` 关键字。

## 四、扩展运算符、集合 if/for 与 Cascade

Dart 的集合操作比 JS 更强大，写动态 UI 与数据变换极简洁：

```dart
// 扩展运算符（与 JS 一致）
var a = [1, 2, 3];
var b = [0, ...a, 4];                    // [0, 1, 2, 3, 4]
var c = [0, ...?nullableList];           // ?-扩展：null 时跳过

// 集合 if（条件元素，JS 没有）
var items = [
  'A',
  if (showB) 'B',                        // showB 为 true 才加入
  if (count > 0) 'C',
];

// 集合 for（循环元素，JS 没有）
var squares = [for (var i = 1; i <= 3; i++) i * i];   // [1, 4, 9]
var upper = [for (var s in list) s.toUpperCase()];

// Cascade（连续操作同一对象）
var paint = Paint()
  ..color = Colors.red
  ..strokeWidth = 2.0
  ..style = PaintingStyle.fill;          // 等价于连续多条 paint.xxx = ...
```

- **集合 if/for 的价值**：在 List/Map/Set 字面量内直接写条件与循环，避免用 `add`/`addAll` 拼接。Flutter 中构建动态 Widget 列表尤其方便（如 `children: [if (loading) Spinner(), for (var item in items) ItemTile(item)]`）。
- **Cascade `..`**：返回对象本身（不是方法返回值），让连续配置同一对象像链式调用——Flutter 中配置 Widget 的利器，比 JS 的连续赋值更优雅。

## 五、健全空安全的细节

Dart 2.12（2021）引入健全空安全，是「最严格」的空安全实现之一：

```dart
String a = 'hello';                // 非空，赋 null 编译错误
String? b = null;                  // 可空

// 安全工具
print(b?.length);                  // null（安全调用）
print(b?.length ?? -1);            // -1（空合）
print(b!.length);                  // 非空断言（null 抛异常）
print(b?[0]);                      // 安全索引
int? len = b?.length;              // Int?

// late：延迟初始化非空
late String config;                // 声明非空但稍后赋值
void init() { config = readConfig(); }   // 在 init 中赋值
// 在 init 前访问 config 会抛 LateInitializationError

// required：命名参数强制传入
void fn({required String name}) { /* name 保证非空 */ }
```

- **「健全」（Sound）的核心**：编译器**只在整个依赖图全部空安全时**才保证无空引用崩溃。流程：① 你的代码全空安全；② 所有依赖（pub 包）也全空安全；③ 此时进入 sound 模式，编译器保证运行时不会有非空变量为 null。否则进入 mix 模式（部分保证）。
- **`late` 的使用场景**：① 字段在构造时无法确定（如需先调用 init 方法）；② 懒加载（`late final x = compute()` 第一次访问才计算）。代价是访问前未初始化会抛异常，需谨慎。
- **与 Kotlin/Swift 的对比**：Dart 最严格（要求全依赖图健全）；Kotlin 有平台类型逃逸（调 Java 时）；Swift 有隐式解包 `T!`（运行时仍可能 nil）。Dart 没有「逃逸口」，一旦 sound 就保证。

## 六、类、继承与 Mixin

```dart
class User {
  final String name;
  int age;
  User(this.name, this.age);             // 构造函数简写（this.field 自动赋值）
  User.named(String n) : name = n, age = 0;  // 命名构造
  factory User.fromJson(Map<String, dynamic> j) =>  // 工厂构造
    User(j['name'], j['age']);
  String get greeting => 'Hi $name';     // getter
  void birthday() => age++;
}

class Admin extends User {               // 单继承
  Admin(String name, int age) : super(name, age);
}

mixin Loggable {                          // mixin：多复用
  void log(String msg) => print('[$runtimeType] $msg');
}
class Service with Loggable { }           // 用 with 混入

enum Color {                              // 增强枚举（Dart 2.17+ 支持字段）
  red(code: '#f00'),
  green(code: '#0f0');
  final String code;
  const Color({required this.code});
}
```

- **构造函数简写**：`User(this.name, this.age)` 自动把参数赋给字段，比 JS 的 `constructor(name, age) { this.name = name; ... }` 简洁得多。
- **mixin 多复用**：Dart 单继承（`extends`），但可用 `with` 混入多个 mixin，实现多重复用（比接口默认方法更灵活）。Flutter 的许多能力（如 `TickerProviderStateMixin`）是 mixin。
- **所有类都是接口**：任何类都隐式是接口，其他类可 `implements` 它（必须重新实现所有方法）——这是 Dart 替代 Java 显式 interface 的设计。
- **增强枚举**：Dart 2.17+ 的 enum 支持字段与方法（类似 Kotlin 的密封类），适合表达有限状态（颜色、状态码、UI 状态）。

## 七、与 JS/TS 的关键差异对照

| 维度 | Dart | JS / TS |
| --- | --- | --- |
| 变量声明 | var/final/const 三档 | let/const 二档 |
| 数字 | int/double（num 父类） | 全是 number（double） |
| 相等 | `==` 结构相等 | `===` 严格相等（`==` 会转换） |
| 空安全 | 健全（全依赖图） | TS 可选类型擦除，运行时 null 仍存在 |
| 异步 | Future/Stream + async/await | Promise/async iterator + async/await |
| 模块 | pub（统一） | CommonJS/ESM（历史双轨） |
| this | 词法作用域清晰 | 动态绑定，箭头函数词法 |
| 类型运行时 | 仍有效（AOT 编译） | TS 擦除，运行时无类型 |
| 命名参数 | 原生支持（Flutter 用） | 用对象字面量模拟 |
| 集合 if/for | 原生支持 | 无（用 map/filter 拼接） |

## 交互演示

本叶无专门可视化。建议在 DartPad（dartpad.dev）或 Flutter 项目的热重载中动手感受——修改 List 字面量内的 `if`/`for` 元素即看效果。

## 下一步

掌握了语法与类型后，下一站是 [Flutter 与异步](./flutter-and-async)：AOT/JIT 双模式的内部机制、Future/async/await 与 Stream（单订阅/广播）、Isolate 并发、Flutter Widget 的语言基础（build 方法/状态/上下文）。
