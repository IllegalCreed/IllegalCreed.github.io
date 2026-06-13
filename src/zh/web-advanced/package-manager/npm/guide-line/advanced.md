---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

> 版本基线 **npm 10.x / 11.x**。peerDependencies 演变与 ERESOLVE、node_modules 扁平化与幽灵依赖、workspaces、overrides、registry/.npmrc——把 npm 用进真实工程。

## 一、peerDependencies 与 ERESOLVE

`peerDependencies` 表达「我要和宿主里某个库**协同**，请你装好兼容版本」，不重复打包：

```jsonc
// 一个 React 插件的 package.json
{
  "peerDependencies": { "react": "^18 || ^19" },
  "peerDependenciesMeta": {
    "react-dom": { "optional": true }   // 可选 peer，npm 不自动装
  }
}
```

**重大演变**：

- **npm v3 ~ v6**：peer 依赖**不自动安装**，只在缺失/不匹配时警告，需手动装。
- **npm v7 起**：peer 依赖**默认自动安装**（官方「As of npm v7, peerDependencies are installed by default.」）。

副作用是 v7+ 在 peer 冲突无解时会抛 **`ERESOLVE`** 错误。两个绕过手段（注意是绕过、非根治）：

```bash
npm i --legacy-peer-deps   # 忽略 peer 冲突，回到 v4~v6 旧行为
npm i --force              # 更激进：强装并可能改写依赖树
```

> 正确做法是先排查真正的版本不兼容（用 `npm explain <pkg>` 看冲突链），`--legacy-peer-deps` 只作临时手段。把它写进 CI 会掩盖问题。

## 二、node_modules 扁平化与幽灵依赖

npm 自 v3 起把依赖**尽量提升（hoist）到 `node_modules` 顶层**去重：

```text
node_modules/
├── express/         ← 你声明的直接依赖
├── accepts/         ← express 的间接依赖，被「提升」到顶层
└── mime-types/      ← 同样被提升
```

**幽灵依赖（phantom dependency）**：`accepts` 没写进你的 `package.json`，但因被提升到顶层，你的代码 `require("accepts")` 也能跑通——直到某天 express 升级不再依赖它、或它不再被提升，你的代码**毫无预警地崩溃**。

```js
// 危险：accepts 只是间接依赖，未在 package.json 声明
const accepts = require("accepts");   // 现在能跑，将来可能突然报错
```

| 包管理器 | node_modules 策略 | 幽灵依赖 |
|---|---|---|
| **npm** | 扁平化提升（结构简单、兼容性好） | **有** |
| pnpm | 内容寻址 store + 嵌套符号链接，顶层只暴露直接依赖 | **杜绝** |
| yarn berry | 可选 PnP（无 node_modules，用 .pnp.cjs 解析） | PnP 模式杜绝 |

> npm 用扁平化换来兼容性与简单，代价是幽灵依赖。防御：只 import 你**显式声明**过的包；用 `depcheck`、`knip` 等工具扫描未声明依赖；CI 里跑严格检查。

## 三、workspaces：原生 monorepo

在根 `package.json` 声明子包 glob，即可用一套依赖管多个包：

```jsonc
// 根 package.json
{
  "name": "monorepo-root",
  "private": true,
  "workspaces": ["packages/*", "apps/*"]
}
```

根目录 `npm install` 后，每个子包被**符号链接进顶层 `node_modules`**（如 `node_modules/@app/ui -> ../packages/ui`），子包之间可直接 `import`，无需发布。常用命令：

```bash
npm install                                  # 一次装好整个 monorepo
npm run build -w @app/web                    # 在指定 workspace 跑脚本
npm run build --workspaces --if-present      # 所有 workspace 跑（缺脚本跳过）
npm i axios -w @app/web                       # 给指定子包装依赖
npm i @app/ui -w @app/web                     # 把 ui 作为 web 的依赖（本地链接）
npm init -w ./packages/new-pkg                # 新建一个 workspace
```

> `--if-present` 很关键：异构 monorepo 里不是每个包都有 `build`，加它能让缺脚本的子包被跳过而非报错。复杂的任务编排（依赖图调度、增量缓存）则需 Turborepo/Nx 在 workspaces 之上补位。

## 四、overrides：钉死间接依赖

当某个**间接依赖**有漏洞或 bug，但其直接父包还没发修复版，用 `overrides` 强制替换：

```jsonc
// 根 package.json —— 只有根包的 overrides 生效
{
  "overrides": {
    "lodash": "4.17.21",                 // 全树所有 lodash 都钉到此版本
    "some-pkg": {
      "trim": "1.0.1"                    // 只覆盖 some-pkg 下的 trim
    },
    "react": "$react"                    // $ 前缀：引用根的直接依赖版本
  }
}
```

- 官方约束：「Overrides are only considered in the root `package.json`」——**只认根包**，子包/依赖包里的 overrides 被忽略。
- 可用 `$name` 引用根的直接依赖版本，也可用 `npm:`/git/file 替换为 fork。
- 典型场景：`npm audit` 报某间接依赖漏洞、`npm audit fix` 修不了时，手动 override 到安全版。

## 五、registry 与 .npmrc

`.npmrc` 控制 registry、鉴权、安装行为。配置优先级：**项目 → 用户 → 全局 → 内置**。

```ini
# 项目 .npmrc
registry=https://registry.npmjs.org/             # 默认源
@mycompany:registry=https://npm.mycompany.com/   # 作用域私有源（仅 @mycompany/*）
//npm.mycompany.com/:_authToken=${NPM_TOKEN}     # 鉴权（环境变量注入，勿硬编码）
save-exact=true                                  # install 写精确版本
```

- **作用域 registry**：只把 `@mycompany/*` 的包路由到私有源，其它走公共源——这是企业混用公私包的标准做法。
- **鉴权用环境变量**：`${NPM_TOKEN}` 在 CI 注入，避免把 token 提交进仓库。
- **国内镜像**：可设 `registry=https://registry.npmmirror.com/` 加速（但发布/鉴权仍走官方源）。

## 六、生产部署：只装生产依赖

```bash
npm ci --omit=dev      # 干净 + 锁定 + 跳过 devDependencies
```

- `--omit=dev`（npm 7+ 写法，旧称 `--production`）只装 `dependencies`，跳过 `devDependencies`，显著减小生产镜像体积。
- 配 `npm ci` 用：既保证可复现，又剔除开发依赖，是容器化部署的黄金组合。

---

进入 [指南 · 专家](./expert)：lockfileVersion 演进、发布流程与 dist-tag、provenance 供应链安全、生命周期脚本攻击面、Corepack 与 packageManager 的时效真相。
