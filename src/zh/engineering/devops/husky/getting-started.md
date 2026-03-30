---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Husky v9.1.7 编写

## 速查

- 安装：`pnpm add -D husky`
- 初始化：`pnpm exec husky init`
- 钩子目录：`.husky/`
- 临时禁用：`HUSKY=0 git commit -m "test"`
- 搭配 lint-staged 获取暂存区文件

## 安装

```shell
pnpm add -D husky
```

## 初始化

```shell
pnpm exec husky init
```

该指令会执行以下操作：

1. 在 `package.json` 中添加 `prepare` 脚本

    ```json
    "scripts": {
      "prepare": "husky"
    }
    ```

2. 在 `.husky/` 目录中创建 `pre-commit` 钩子文件，默认内容为 `npm test`
3. 创建 `.husky/_` 目录（已被 `.gitignore` 忽略），写入内部运行时脚本，用于钩子执行时的环境设置

::: danger
`init` 命令会强制覆盖 `prepare` 脚本，所以如果你原来有 `prepare` 脚本，你需要手动合并一下。
:::

## 验证

```shell
git commit -m "Keep calm and commit"
```

如果正常 `husky` 会触发 `test` 脚本

## 注意事项

1. 如果需要获取暂存区的文件，请搭配 `lint-staged` 实现
2. 如果想要临时禁用 `Husky` 的钩子，可以设置环境变量 `HUSKY=0`
    
    ```shell
    HUSKY=0 git commit -m "test"
    ```