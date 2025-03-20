---
layout: doc
outline: [2, 4]
---

# 集成

## 速查

- 集成 ESLint：`eslint-config-prettier`
- 集成 Git Hooks：`Husky` && `lint-staged`
- 插件使用：`--plugin` && `plugins: []`
- 集成浏览器：`https://unpkg.com/prettier@%PRETTIER_VERSION%/plugins/`

## 集成 Linter

目前主流的观点是 `Linter` 负责 `代码质量规则`，而 `Formatter` 负责 `风格规则`

但是 ESLint 因为历史问题会有一些规则和 Prettier 冲突。

**解决冲突的方法**：禁用冲突规则，安装并配置 `eslint-config-prettier`

### 安装

```bash
pnpm add -D eslint-config-prettier
```

### 配置

```js
// eslint.config.js
import someConfig from "some-other-config-you-use";
// Note the `/flat` suffix here, the difference from default entry is that
// `/flat` added `name` property to the exported object to improve
// [config-inspector](https://eslint.org/blog/2024/04/eslint-config-inspector/) experience.
import eslintConfigPrettier from "eslint-config-prettier/flat";

export default [
  someConfig,
  eslintConfigPrettier,
];
```


### 下列插件不推荐使用

**将Prettier作为Linter规则运行的插件：**

- **eslint-plugin-prettier**：将Prettier集成到ESLint中，作为规则运行，并对违规部分标红。
- **stylelint-prettier**：将Prettier集成到Stylelint中。
- **现代替代方案**：直接使用 `prettier --check .` 检查格式。

**先运行Prettier再运行Linter的工具：**

- **prettier-eslint**：先运行Prettier格式化，再用 `eslint --fix` 修正。
- **prettier-stylelint**：类似地结合Prettier和Stylelint。
- **现代替代方案**：现在使用脚本或者用 `lint-staged` 之类的工具即可，推荐先运行 `linter`

## 集成 Git Hooks

详情见 [Husky](https://illegalcreed.github.io/zh/engineering/devops/husky/) 和 [lint-staged](https://illegalcreed.github.io/zh/engineering/devops/lint-staged/) 文档

## 插件

插件是扩展 Prettier 的方式，可以添加新语言或格式化规则。所有内置语言（如 JavaScript 和 Web 相关语言）都基于插件 API 实现。prettier 核心包内置 JavaScript 等语言支持，其他语言需额外安装插件。

### 使用插件

#### CLI

```bash
prettier --write main.foo --plugin=prettier-plugin-foo
```

- 可多次使用 `--plugin` 加载多个插件

#### API

```jsx
await prettier.format("code", {
  parser: "foo",
  plugins: ["prettier-plugin-foo"],
});
```

#### 配置文件

```json
{
  "plugins": ["prettier-plugin-foo"]
}
```

#### 官方插件

- **@prettier/plugin-php**：支持 PHP。
- **@prettier/plugin-pug**：由 @Shinigami92 维护，支持 Pug。
- **@prettier/plugin-ruby**：支持 Ruby。
- **@prettier/plugin-xml**：支持 XML。

#### 社区插件

- **prettier-plugin-apex**: 支持 Apex (Salesforce)
- **prettier-plugin-astro**: 支持 Astro
- **prettier-plugin-elm**: 支持 Elm
- **prettier-plugin-erb**: 支持 ERB (Embedded Ruby)
- **prettier-plugin-gherkin**: 支持 Gherkin (Cucumber)
- **prettier-plugin-glsl**: 支持 GLSL (OpenGL Shading Language)
- **prettier-plugin-go-template**: 支持 Go 模板
- **prettier-plugin-java**: 支持 Java
- **prettier-plugin-jinja-template**: 支持 Jinja 模板
- **prettier-plugin-jsonata**: 支持 JSONata
- **prettier-plugin-kotlin**: 支持 Kotlin
- **prettier-plugin-motoko**: 支持 Motoko (Internet Computer)
- **prettier-plugin-nginx**: 支持 NGINX 配置文件
- **prettier-plugin-prisma**: 支持 Prisma
- **prettier-plugin-properties**: 支持 Properties 文件
- **prettier-plugin-rust**: 支持 Rust
- **prettier-plugin-sh**: 支持 Shell 脚本
- **prettier-plugin-sql**: 支持 SQL
- **prettier-plugin-sql-cst**: 支持 SQL (原生 Prettier 算法)
- **prettier-plugin-solidity**: 支持 Solidity
- **prettier-plugin-svelte**: 支持 Svelte
- **prettier-plugin-toml**: 支持 TOML

### 开发插件

此处不展开说了，仅凭官网文档远远无法支撑实际开发，如果真有需求推荐阅读 Prettier 源代码，所有内置语言都是由插件实现的，另外遇到困难可以在 Discord 上与开发者交流。

## 集成浏览器

Prettier 提供独立版本（standalone），可在浏览器中运行，不依赖 Node.js

**限制**：

- 仅支持代码格式化。
- 不支持配置文件、忽略文件、CLI 或自动加载插件。

**版本**：

- **ES Modules**：`standalone.mjs`（v3.0+，v2.x 为 `esm/standalone.mjs`）。
- **UMD**：`standalone.js`（v1.13+）。

**兼容性**：

- `package.json` 的 `browser` 字段指向 `standalone.js`，支持通过打包工具（如 `webpack`）直接导入，兼容 Node 和浏览器。

### prettier.format(code, options)

用于格式化代码的 API 。

**必需选项**：

- **parser 或 filepath**：指定解析器，告诉 Prettier 使用哪种语言格式化
- **plugins**：浏览器版不自动加载插件，必须手动传入。所有解析器以插件形式提供（位于 [https://unpkg.com/prettier@%PRETTIER_VERSION%/plugins/）](https://unpkg.com/prettier@%25PRETTIER_VERSION%25/plugins/%EF%BC%89)

::: warning

格式化 JavaScript、TypeScript、Flow 或 JSON 时需加载 `estree` 插件

:::

### 用法

#### 全局脚本 (Global)

```html
<script src="https://unpkg.com/prettier@%PRETTIER_VERSION%/standalone.js"></script>
<script src="https://unpkg.com/prettier@%PRETTIER_VERSION%/plugins/graphql.js"></script>
<script>
  (async () => {
    const formatted = await prettier.format("type Query { hello: String }", {
      parser: "graphql",
      plugins: prettierPlugins,
    });
  })();
</script>
```

- prettierPlugins 是全局变量，包含加载的插件

#### ES Modules

```html
<script type="module">
  import * as prettier from "https://unpkg.com/prettier@%PRETTIER_VERSION%/standalone.mjs";
  import * as prettierPluginGraphql from "https://unpkg.com/prettier@%PRETTIER_VERSION%/plugins/graphql.mjs";

  const formatted = await prettier.format("type Query { hello: String }", {
    parser: "graphql",
    plugins: [prettierPluginGraphql],
  });
</script>
```

#### **AMD**

```js
define([
  "https://unpkg.com/prettier@%PRETTIER_VERSION%/standalone.js",
  "https://unpkg.com/prettier@%PRETTIER_VERSION%/plugins/graphql.js",
], async (prettier, ...plugins) => {
  const formatted = await prettier.format("type Query { hello: String }", {
    parser: "graphql",
    plugins,
  });
});
```

#### **CommonJS**

```js
const prettier = require("prettier/standalone");
const plugins = [require("prettier/plugins/graphql")];

(async () => {
  const formatted = await prettier.format("type Query { hello: String }", {
    parser: "graphql",
    plugins,
  });
})();
```

::: warning

需通过打包工具（如 browserify、webpack）支持浏览器环境

:::

#### Worker

```js
// Module Worker
import * as prettier from "https://unpkg.com/prettier@%PRETTIER_VERSION%/standalone.mjs";
import * as prettierPluginGraphql from "https://unpkg.com/prettier@%PRETTIER_VERSION%1/plugins/graphql.mjs";

const formatted = await prettier.format("type Query { hello: String }", {
  parser: "graphql",
  plugins: [prettierPluginGraphql],
});
```
<br>

```js
// Classic worker
importScripts(
  "https://unpkg.com/prettier@%PRETTIER_VERSION%/standalone.js",
  "https://unpkg.com/prettier@%PRETTIER_VERSION%/plugins/graphql.js",
);

(async () => {
  const formatted = await prettier.format("type Query { hello: String }", {
    parser: "graphql",
    plugins: prettierPlugins,
  });
})();
```

### 嵌入代码的解析器插件

格式化嵌入代码（如 JS 中的 HTML）需加载相关插件

```html
<script type="module">
  import * as prettier from "https://unpkg.com/prettier@%PRETTIER_VERSION%/standalone.mjs";
  import * as prettierPluginBabel from "https://unpkg.com/prettier@%PRETTIER_VERSION%/plugins/babel.mjs";
  import * as prettierPluginEstree from "https://unpkg.com/prettier@%PRETTIER_VERSION%/plugins/estree.mjs";
  import * as prettierPluginHtml from "https://unpkg.com/prettier@%PRETTIER_VERSION%/plugins/html.mjs";

  console.log(
    await prettier.format("const html=/* HTML */ `<DIV> </DIV>`", {
      parser: "babel",
      plugins: [prettierPluginBabel, prettierPluginEstree, prettierPluginHtml],
    })
  );
  // 输出: const html = /* HTML */ `<div></div>`;
</script>
```

## 集成 CI

以下配置方法用于修复格式错误并自动提交更改，如果您只需要验证格式请使用 `prettier . --check`

### GitHub Actions 配置

1. 安装 [`autofix.ci`](https://github.com/apps/autofix-ci) GitHub 应用程序，用于自动提交修复
2. 仓库中需固定 Prettier 版本（如通过 `package.json` 指定）
3. 创建配置文件，`.github/workflows/prettier.yml`
    
    ```yaml
    name: autofix.ci
    on:
      pull_request:
      push:
    permissions: {}
    jobs:
      prettier:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v4
          - uses: actions/setup-node@v4
          - run: |
              yarn
              yarn prettier . --write
          - uses: autofix-ci/action@v1
            with:
              commit-message: "Apply Prettier format"
    ```
    

### GitLab CI 配置

1. 在项目中通过 `package.json` 指定 Prettier 版本并添加依赖
2. 创建 GitLab CI 配置文件，`.gitlab-ci.yml`
    
    ```yaml
    stages:
      - format
    
    prettier:
      stage: format
      image: node:latest
      rules:
        - if: '$CI_PIPELINE_SOURCE == "push" || $CI_PIPELINE_SOURCE == "merge_request_event"'
      script:
        - npm ci
        - npx prettier . --write
        - git config --global user.email "ci-bot@gitlab.com"
        - git config --global user.name "CI Bot"
        - git add .
        - git commit -m "Apply Prettier format" || echo "No changes to commit"
        - git push origin $CI_COMMIT_REF_NAME
      artifacts:
        paths:
          - .
    ```