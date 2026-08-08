---
layout: doc
outline: [2, 3]
---

# 实际工作流：环境变量、集合组织、Git 集成与 CI 对接

> 基于 Postman 11 · Bruno 2 · Insomnia 11 · Hoppscotch 2025 · 核于 2026-08

## 速查

- **环境变量三层模型**：①**全局变量**（所有环境共享，如默认超时）②**环境变量**（dev/staging/prod 切换，含 `baseUrl`/`token`）③**集合变量**（仅本集合，如公共 header）。引用统一用 <code v-pre>&#123;&#123;varName&#125;&#125;</code> 双花括号语法，运行时按 环境优先 > 集合 > 全局 解析。
- **密钥不进仓库**：token/apiKey 这类敏感值用**环境本地覆盖**（Bruno 的 `.env.local` / Postman 的 current value）保存，**绝写进被 git 跟踪的文件**——仓库里只留变量名和占位。
- **集合组织约定**：按**业务域 + 资源**分层（如「订单/创建订单」「订单/查询订单」），命名带动词前缀，便于扫读；每个请求填 description，集合即半成品文档。
- **Bruno 的 Git 工作流**：集合就是仓库里的 `requests/` 目录，新建请求 = 新建 `.bru` 文件 → `git add` → PR review → merge；改请求 header 就像改代码，diff 一目了然。
- **Postman 的「Git 集成」是镜像**：云集合为主，定时反向同步到 Git 仓库；要真正 Git 优先需用 Postman CLI + 仓库，体验不如 Bruno 原生。
- **脚本与断言**：四工具都支持请求前后跑 JS 脚本（Postman `pm.test` / Bruno `test` / Insomnia `insomnia.test`），常用于「响应 status=200」「body.id 非空」断言，是**冒烟测试**的起点。
- **CI/自动化**：CLI Runner（Newman / `bru run` / Inso CLI）读集合 + 环境文件，跑全部断言，挂到 CI 上做部署后冒烟；输出 JUnit XML 接报告系统。
- **环境切换铁律**：**永远用变量切换环境，不在请求里硬编码 URL**——<code v-pre>&#123;&#123;baseUrl&#125;&#125;/orders</code> 一处改、处处生效，是避免「我本地是 dev 忘了切」的根本。

## 一、环境变量管理：三层模型

API 客户端的「环境」是它的灵魂——同一组请求，切个环境就能打 dev 或 prod，靠的是变量系统：

```
            ┌─────────────────────────────┐
            │  全局变量（所有环境共享）       │ ← 如 defaultTimeout=30000
            ├─────────────────────────────┤
            │  环境变量（dev/staging/prod）  │ ← 如 baseUrl / token（每环境一份）
            ├─────────────────────────────┤
            │  集合变量（仅本集合）           │ ← 如 apiVersion=v2
            └─────────────────────────────┘
                       引用：{{varName}}
            解析顺序：环境 > 集合 > 全局
```

- **dev / staging / prod 三环境**最常见：`baseUrl` 分别指向本地、测试服、生产服；`token` 每环境不同的 Bearer。
- **密钥的本地覆盖**：Bruno 用 `.env`（入库）+ `.env.local`（gitignore，填真实 token）；Postman 用 initial value（入库）+ current value（本地，不入库）。**铁律：仓库里只见变量名，不见真值。**
- **变量命名约定**：用 `camelCase`（`baseUrl`/`adminToken`），加业务前缀（`payApiKey`）避免与工具内置冲突。

## 二、集合组织约定

集合（Collection）是 API 客户端的「文件夹」，组织得好坏直接决定可读性与协作效率：

- **按业务域分文件夹**：`订单/`、`用户/`、`支付/`，每个域内再按资源细分（`订单/创建`、`订单/查询`、`订单/取消`）。
- **请求名带动词前缀**：「创建订单」「查询订单ById」「取消订单」——扫一眼就知道干嘛，比 `POST /orders` 友好。
- **每个请求填 description**：说明用途、参数含义、注意事项——集合本身就是半成品接口文档，新人无需另查。
- **公共 header 提到集合级**：<code v-pre>Authorization: Bearer &#123;&#123;token&#125;&#125;</code>、`Content-Type: application/json` 在集合根设置，子请求继承，避免重复。
- **示例响应**：给关键请求存一个 example，既当文档又当 Mock 数据源。

## 三、Bruno 的 Git 工作流（文件即配置）

Bruno 最大卖点的实操——请求集合就是一个文件夹：

```
my-api-collection/           ← Bruno 集合根（也是一个 Git 仓库）
├── bruno.json               ← 集合元信息
├── environments/
│   ├── dev.bru              ← dev 环境（baseUrl=http://localhost:3000）
│   ├── staging.bru
│   └── prod.bru
├── 订单/
│   ├── 创建订单.bru          ← 一个请求一个文件，纯文本
│   ├── 查询订单.bru
│   └── 取消订单.bru
└── 用户/
    └── 登录.bru
```

- **`.bru` 文件是纯文本**：包含请求方法、URL、header、body、断言，`git diff` 看的是语义化的「header 变了」「body 加了字段」，不是一大坨 JSON。
- **协作流程**：开发者建分支 → 新建/改 `.bru` 文件 → push → PR → reviewer 看到具体请求变更 → merge。和代码 review 完全同构。
- **密钥隔离**：`environments/dev.bru` 里只写 `baseUrl`，token 写在 `environments/dev.local.bru`（被 `.gitignore` 排除）。

## 四、Postman 的「Git 集成」是镜像

Postman 的 Git 集成不是文件优先，而是**云端为主 + 定时镜像到 Git**：

- 云端工作区是**唯一真源**，开发者在 GUI 里改请求，存在 Postman 云。
- 配置 GitHub 集成后，Postman 定时把云集合导出成 JSON 推到指定仓库分支——是**备份**不是**协作主路径**。
- 反向（Git→云）也支持，但「两边都能改」容易冲突，实际多数团队只单向用。
- **diff 体验差**：每次同步是一个大 JSON 文件改动，看不出「谁改了哪个 header」，PR review 形同虚设。

> **结论**：要真正的 Git-native 协作，选 Bruno；Postman 的 Git 集成更适合做云端集合的版本备份。

## 五、脚本断言与 CLI Runner

API 客户端不止是手动调试器，还能写断言、跑自动化：

```js
// Bruno / Postman 通用写法（请求后脚本）
test('应返回 200', () => {
  expect(res.status).toBe(200);
});
test('订单 id 非空', () => {
  expect(res.body.id).toBeTruthy();
});
```

- **CLI Runner**：Bruno 用 `bru run --env staging` 跑整个集合；Postman 用 `newman run collection.json -e staging.json`；Insomnia 用 `inso run test`。
- **接 CI**：把 `bru run` / `newman run` 加进 GitHub Actions / GitLab CI，部署后自动跑冒烟，失败即拦截发布。
- **报告**：CLI 输出 JUnit XML，接 CI 报告系统（GitHub Checks / GitLab Test Reports），断言失败可视化。

## 六、易踩的坑

- **密钥进了 Git**：把 token 写进被跟踪的 `.bru` 或 Postman 同步的 JSON，一旦 push 到公开仓库就是事故——永远用 `.local` / current value 隔离。
- **环境没切就打 prod**：本地 dev 调试完忘了切回，直接拿 prod token 发了写请求——养成「改环境前先确认 baseUrl」的习惯，或给 prod 集合加醒目前缀。
- **集合命名混乱**：「test1」「临时」「新建请求」堆在一起，三个月后没人认得——立命名约定，定期清理。
- **断言太松**：只断 `status=200` 不断 body，接口返回空数组也算过——关键字段（id 非空、数组长度）要断到。

## 下一步

工作流跑顺后，回头查[参考](../reference) 的速查表、快捷键、命令行对应与易错点。
