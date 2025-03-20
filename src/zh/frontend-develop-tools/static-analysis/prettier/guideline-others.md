---
layout: doc
outline: [2, 3]
---

# 其他

## 速查

- VSCode 插件：`“Prettier - Code formatter”`
- VSCode 格式化快捷键：`Opt`+`Shift`+`F` / `Alt` +`Shift`+`F`

## 编辑器

### 编辑器集成

将 Prettier 集成到代码编辑器中，以便在编辑时自动运行格式化。如果编辑器不支持，可使用文件监视器（file watcher）运行 Prettier

确保使用正确的 Prettier 版本，避免全局安装导致版本不匹配

```jsx
npm install --save-dev prettier
```

#### Visual Studio Code

- **插件**: `prettier-vscode`
- **安装**: 通过扩展侧边栏搜索`“Prettier - Code formatter”`
- **额外功能**: 安装 vscode-status-bar-format-toggle 可开关格式化

#### WebStorm

WebStorm 默认内置 Prettier 支持

**手动格式化快捷键：**

- macOS: `Opt`+`Shift`+`Cmd`+`P`。
- Windows/Linux: `Alt`+`Shift`+`Ctrl`+`P`。

**自动格式化：**

**配置路径**: Preferences / Settings | Languages & Frameworks | JavaScript | Prettier。

**选项**:

- **On save**: 保存时运行 Prettier（`Cmd`+`S` / `Ctrl`+`S`）。
- **On ‘Reformat Code’ action**: 使用 Prettier 作为默认格式化工具（`Opt`+`Cmd`+`L` / `Ctrl`+`Alt`+`L`）。

> 其他开发工具插件请参阅官方文档

### 配置文件监听

配置 Prettier 监视项目文件的变化，并在文件修改时自动运行格式化。

使用 `onchange`，一个轻量级的文件监视工具

**直接运行**

```bash
npx onchange "**/*" -- npx prettier --write --ignore-unknown {{changed}}
```

**使用 npm 脚本**

```json
// package.json

{
  "scripts": {
    "prettier-watch": "onchange \"**/*\" -- prettier --write --ignore-unknown {{changed}}"
  }
}
```

运行

```bash
npm run prettier-watch
```

## 技术细节

**Printer**: Prettier 的核心组件，负责将抽象语法树（AST）转换为格式化代码字符串。

### **工作流程**

1. **输入**: 接收一个 AST（抽象语法树）。
2. **中间表示（IR）**: 将 AST 转换为中间表示（Intermediate Representation），一种抽象的输出结构。
3. **输出**: 打印器根据 IR 生成最终字符串。

::: tip **IR**

IR 是一组命令的抽象表示，描述代码的布局。在 Prettier Playground 中，通过侧边栏（“Show options”按钮）设置 parser 为 doc-explorer，可查看 IR

:::

## 相关项目

### ESLint 集成

- `eslint-config-prettier`：关闭所有与 Prettier 无关或可能冲突的 ESLint 规则
- `eslint-plugin-prettier`：将 Prettier 作为 ESLint 规则运行，报告格式差异作为 ESLint 问题
- `prettier-eslint`：将 Prettier 输出传递给 `eslint --fix` 进行修复
- `prettier-standard`：结合 prettierx 和 prettier-eslint，使用 Standard 规则格式化代码

### Stylelint 集成

- `stylelint-config-prettier`：关闭与 Prettier 无关或冲突的 Stylelint 规则
- `stylelint-prettier`：将 Prettier 作为 Stylelint 规则运行，报告差异
- `prettier-stylelint`：将 Prettier 输出传递给 `stylelint --fix`

### 分叉项目

- `prettierx`：Prettier 的分叉版本，减少强制性规则，更加灵活

### 其他工具

- `parallel-prettier`：并行格式化文件，加速大项目
- `prettier_d`：以服务器模式运行 Prettier，减少 Node.js 启动延迟
- `pretty-quick`：只格式化 Git 暂存区中的更改文件
- `rollup-plugin-prettier`：在 Rollup 构建中集成 Prettier
- `jest-runner-prettier`：将 Prettier 作为 Jest runner 运行
- `prettier-chrome`：浏览器扩展，在 Chrome 中运行 Prettier
- `spotless`：从 Gradle 或 Maven 运行 Prettier
- `csharpier`：Prettier 的 C# 版本
- `reviewdog-action-prettier`：在 GitHub Actions 中运行 Prettier

## 企业版

- **Tidelift 订阅**:
Prettier 可通过 Tidelift 订阅获得企业级支持，提供安全更新、许可验证、代码维护、包选择指导、路线图参与及云集成，减少风险并提升代码健康度。
- **目标**: 为企业提供商业级开源软件管理，节省时间并支持依赖维护者。