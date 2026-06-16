---
layout: doc
outline: [2, 3]
---

# 用法与自动修复

> 基于 Knip v6.17.1 编写

## 速查

- 自动修复：`knip --fix`；删未用文件需显式 `--allow-remove-files`；改完格式化加 `--format`
- `--fix-type` 限定范围：`files` / `dependencies` / `exports` / `types` / `catalog`
- 可修：删 `export` 关键字、删 `package.json` 依赖、删文件、清 `pnpm-workspace.yaml` 的 catalog
- 不可修（需手动）：补 `unlisted` 依赖、补 `binaries`、解决 `duplicates` 重复导出
- 善后：跑 `install` 同步依赖；用 ESLint 或 `remove-unused-vars` 清残留未用变量；`git diff` 复核
- 聚焦：`--include`/`--exclude`/`--dependencies`/`--exports`/`--files`；输出：`--reporter`
- 处理误报顺序：**文件 → import → 导出 → 依赖**（自上而下，避免连锁误报）

## 自动修复 --fix

```bash
# 应用所有可自动修复的问题
knip --fix

# 允许删除未使用的文件（默认不删）
knip --fix --allow-remove-files

# 修复后用本地格式化器（Prettier / Biome / dprint）整理
knip --fix --format
```

`--fix` 能做的修复：

- 从未使用的导出、re-export、导出类型上**移除 `export` 关键字**（默认导出则去掉 `export default`）
- 从 `package.json` 的 `dependencies` / `devDependencies` 中**删除未使用依赖**
- 删除未使用的**文件**（需 `--allow-remove-files`）
- 删除未使用的**枚举/命名空间成员**
- 移除 `pnpm-workspace.yaml` 中未使用的 **catalog** 条目

用 `--fix-type` 限定只修某几类：

```bash
knip --fix-type exports,types
knip --fix-type dependencies
knip --fix-type files
```

## 哪些不能自动修

以下需人工处理（因为存在不确定性）：

- **补 `unlisted` 依赖**：Knip 不确定该放 `dependencies` 还是 `devDependencies`
- **补 `unlisted` 的 binaries**：同上
- **`duplicates` 重复导出**：需你决定保留哪一个

## 修复后的善后

::: warning 务必在版本控制下操作
`--fix` 会修改源码与 `package.json`，删文件不可逆。流程建议：
1. 确保 Git 工作区干净再运行 `--fix`
2. 删依赖后跑 `pnpm install`（或对应包管理器）同步 lockfile
3. 移除 `export` 后可能留下未用的局部变量——用 ESLint 或 [`remove-unused-vars`](https://github.com/webpro-nl/remove-unused-vars) 清理
4. `git diff` 逐项复核，必要时回退
:::

## 聚焦与过滤

只想看某类问题时，用快捷开关或 `--include`/`--exclude`：

```bash
# 只看依赖相关（dependencies/unlisted/binaries/unresolved/catalog）
knip --dependencies

# 只看导出相关（exports/types/enumMembers/duplicates 等）
knip --exports

# 只看未使用的文件
knip --files

# 精确控制
knip --include files,dependencies
knip --exclude duplicates
```

## 处理误报

Knip 的核心理念：**一个意外的结果，通常是真实发现或配置缺口，而不是要消音的误报**。推荐**自上而下**逐层处理，避免连锁误报：

1. **未使用的文件** → 删掉后，连带消除一批"未用导出/依赖"
2. **无法解析的 import（unresolved）** → 厘清 Knip 能到达的范围
3. **未使用的导出** → 此时才是真正的死代码
4. **未使用的依赖** → 最后收尾

消除误报的优先级：

- **首选**：用 `entry` 把项目结构教给 Knip（见 [配置](./configuration.md)）
- **次选**：用 `@public` / `@internal` 标记导出，配 `tags` 字段
- **再次**：改进/新增对应工具的[插件](./plugins.md)（一次解决、对所有项目生效）
- **最后**：`ignoreDependencies` / `ignoreBinaries` / `ignore` 局部消音

常见误报与对策：

| 现象                          | 对策                                          |
| ----------------------------- | --------------------------------------------- |
| 脚本里的文件被报未使用        | 把该文件加入 `entry`                          |
| 动态 import 字符串            | 列入 `entry` 或 `ignoreDependencies`          |
| 类型包 `@types/*` 被报未用    | 若类型已内置于主包，直接删掉它                |
| 直接用了传递依赖              | 在 `package.json` 显式声明                    |
| 仅本文件内用到的导出被报      | 开 `ignoreExportsUsedInFile`                  |

详见官方 [Handling Issues](https://knip.dev/guides/handling-issues)。
