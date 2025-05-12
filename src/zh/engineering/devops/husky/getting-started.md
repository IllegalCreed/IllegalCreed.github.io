---
layout: doc
---

# 入门

## 安装

```shell
pnpm add -D husky
```

## 初始化

```shell
pnpm exec husky init
```

该指令可以被拆分为三个步骤：

1. 在 `package.json` 中修改 `prepare` 脚本
    
    ```json
    "scripts": {
      "prepare": "husky"
    }
    ```
    
2. 在 `.husky` 文件夹中创建 `pre-commit` 文件，默认内容为`npm test`
3. 创建 `.husky/_` 文件夹，写入内部脚本，用于钩子执行时的环境设置。

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