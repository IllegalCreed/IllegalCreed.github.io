---
layout: doc
outline: [2, 3]
---

# 搭配 are-the-types-wrong

> 基于 publint v0.3.21 编写

## 速查

- attw = `@arethetypeswrong/cli`，检查「类型在各 `moduleResolution` 下是否正确解析」
- 分工：**publint** 自有静态分析 + 查文件存在性/模块格式（不止 `package.json`）；**attw** 用 TS 编译器查类型解析
- 二者有重叠（如 ESM/CJS 类型伪装），但 attw 能发现 publint 发现不了的类型问题，反之亦然
- 官方建议：想抓全所有问题，发布前**两个都跑**
- 用法：`npx publint && npx @arethetypeswrong/cli --pack`（或对已 pack 的 `.tgz` 跑 attw）
- 网页版：publint → [publint.dev](https://publint.dev)；attw → [arethetypeswrong.github.io](https://arethetypeswrong.github.io)

## 为什么需要两个工具

publint 与 attw 都关心「包发布得对不对」，但切入角度不同：

- **publint** 用自己的静态分析，覆盖面**不止 `package.json`**：它还检查文件是否真实存在、模块格式（ESM/CJS）是否与声明一致、`exports` 条件顺序等「打包/发布形态」问题。
- **attw**（are the types wrong）借助 **TypeScript 编译器**，在各种 `moduleResolution`（`node10` / `node16` / `bundler`）下实际尝试解析你的包，专查**类型层面**的问题。

官方文档明确说：二者有重叠（例如都能报「ESM 和 CJS 类型伪装」），但 **attw 能报出一些 publint 报不了的类型问题**，因此「想抓全所有问题，建议两个一起用」。

## attw 在查什么

attw 模拟不同消费场景，看「用户 `import` 你的包时，TypeScript 拿到的类型对不对」。它能发现的典型问题：

- **Masquerading as ESM / CJS**：类型文件假装成了另一种格式，导致在某种解析模式下类型错位
- **类型与运行时不一致**：`import` 拿到的运行时是 ESM，但类型却是 CJS 的形状（或反之）
- **某些 `moduleResolution` 下根本找不到类型**：例如只配了顶层 `types`，在 `node16` 下却解析失败
- **`export *` 在 CJS 下的兼容性**等更细的类型解析陷阱

这些是「类型能否被正确解析」的问题，正好补上 publint 不深入的那一块。

## 一起用的命令

最朴素的方式是串起来跑（任一失败即中断）：

```bash
npx publint && npx @arethetypeswrong/cli --pack
```

- `publint`：查发布形态 / 文件 / 模块格式
- `@arethetypeswrong/cli --pack`：先 `npm pack`，再对打出的 tarball 做类型解析检查

也可以先手动 `npm pack` 出 `.tgz`，再分别喂给两个工具：

```bash
npm pack
npx publint ./my-lib-1.0.0.tgz
npx attw ./my-lib-1.0.0.tgz
```

::: tip 都有网页版
不想装也行：publint 用 [publint.dev](https://publint.dev)、attw 用 [arethetypeswrong.github.io](https://arethetypeswrong.github.io)，粘贴包名即可在线检查已发布的版本。
:::

## 放进发布流程

把两者一起作为「发布前门禁」，确保构建产物在发布前同时通过「发布形态」与「类型解析」两道检查：

```json
// package.json
{
  "scripts": {
    "build": "tsup",
    "check:package": "publint --strict && attw --pack",
    "prepublishOnly": "npm run build && npm run check:package"
  }
}
```

::: warning 仍然要先 build
和单用 publint 一样，两者都检查「将发布的产物」。务必在产物生成之后再跑，否则文件缺失会让检查失败。
:::

回到 [检查项详解](./checks-explained.md) 复习 publint 自身的规则，或看 [参考](../reference.md) 查字段与级别全表。
