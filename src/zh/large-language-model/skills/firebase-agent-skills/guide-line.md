---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 firebase/agent-skills 官方仓库（Apache-2.0）各 skills/ 的 `SKILL.md` 编写。

## 速查

- **入口**：`firebase-basics` 定原则（一律 `npx -y firebase-tools@latest`、优先官方知识、用 MCP 工具、程序化拉配置）
- **认证**：`firebase-auth-basics`——CLI 只能启 Google/匿名/邮箱密码，配 `firebase.json` 后必须 `deploy --only auth`
- **Firestore**：动前先 `firestore:databases:list` 识别 edition（STANDARD vs Enterprise），选对应 references
- **AI Logic**：默认 Gemini Developer API（免费层），必须 `init ailogic`（否则 `PERMISSION_DENIED`），必配 App Check
- **SQL Connect**：默认 Native GraphQL（类型安全），Native SQL 仅高级场景；`@auth(level:)` 授权，secure by default
- **安全审计**：`firebase-security-rules-auditor` 查更新绕过 / 权威来源 / DoS / 类型安全，1–5 评分
- **Hosting**：静态/SPA 用 Hosting，Next.js/Angular SSR 用 App Hosting（需 Blaze）
- **iOS**：`xcode-project-setup` 禁 Ruby，直接写文件靠文件夹同步，Firebase SPM 必须 `-ObjC`

## 两条主线：搭建 vs 审计

11 个技能可粗分两类：

- **搭建型**（大多数）：basics / auth / firestore / hosting / app-hosting / ai-logic / data-connect / crashlytics / remote-config / xcode-project-setup——给 agent 官方工作流，从零把某个 Firebase 能力接进来
- **审计型**：security-rules-auditor——不写代码，而是当「安全评审器」，对照红队清单给 Firestore 规则打分

## firebase-auth-basics：认证

Firebase 认证围绕三个概念：

- **用户（User）**：唯一 `uid`（跨提供商唯一），附 `email` / `displayName` / `photoURL` / `emailVerified`
- **身份提供商**：邮箱密码、联合身份（Google/Facebook/Twitter/GitHub/Microsoft/Apple）、电话短信、匿名（可后续升级为永久账号）、自定义。**Google Sign In 是推荐的安全默认**
- **令牌**：登录得 **ID Token**（JWT，1 小时短期，验身份）+ **Refresh Token**（长期，换新 ID Token）

关键工作流：CLI **只能**启用 Google Sign In、匿名、邮箱密码三种，其它提供商去 Console 开。配 `firebase.json` 的 `auth` 块后，**必须部署才生效**：

```bash
npx -y firebase-tools@latest deploy --only auth
```

> 反模式：改了 `firebase.json` 的 auth 却不 `deploy --only auth`——OAuth 客户端不会自动生成，Google 登录会失败。另外「授权域名」列表里**只写 `localhost`，不带协议和端口**（不是 `http://localhost:9090`）。

## firebase-firestore：先识别 edition

这个技能的第一铁律：**动任何数据模型/规则/依赖前，必须先识别 Firestore 实例的 edition**。

```bash
npx -y firebase-tools@latest firestore:databases:list
npx -y firebase-tools@latest firestore:databases:get <database-id>
```

- `edition` 是 `STANDARD` → 走 `references/standard/`
- `edition` 是 `ENTERPRISE` 或 native 模式 → 走 `references/enterprise/`
- 没有实例 / 要新建 → 默认建 **Enterprise** 版，先 `firestore:locations` 选位置

Enterprise 版支持原生全文搜索与关系 join（pipelines），但改代码前**必须先读**对应平台的 SDK reference，理解 pipeline 初始化模式。

## firebase-ai-logic-basics：客户端直连 Gemini

Firebase AI Logic（前身 "Vertex AI for Firebase"）让客户端 SDK **不用自建后端**就能调 Gemini 模型。两个 provider：

| Provider | 定位 | 计费 |
| --- | --- | --- |
| **Gemini Developer API** | 原型/默认，有免费层 | 免费层 + 按量 |
| **Vertex AI Gemini API** | 企业级规模化 | 需 Blaze |

**默认用 Gemini Developer API**，只有应用确需时才上 Vertex AI。核心能力：文本生成、多模态（图/音/视频/PDF；>20MB 走 Cloud Storage 传 URL，避免 HTTP 413）、多轮对话（`startChat`）、流式（`generateContentStream`）、生成图像（Nano Banana，需 Blaze）、Search Grounding（内建 `googleSearch`）、结构化输出（强制 JSON schema）、设备端混合推理（Gemini Nano）。平台覆盖 Android(Kotlin/Java)、iOS(Swift)、Web(JS)、Flutter(Dart)、Unity(C#)。

```bash
npx -y firebase-tools@latest init ailogic   # 供给后端，自动启用 Gemini Developer API
```

> 两个关键警告：① **必须 `init ailogic`** 供给服务，否则各平台都会 `PERMISSION_DENIED`（`flutterfire configure` 只配客户端，不启服务）；② **必配 App Check**，否则未授权客户端会盗用你的 API 配额。用 Remote Config 动态改模型名，别硬编码——旧模型（如 `gemini-2.0-flash`）会被下线。

## firebase-data-connect-basics：SQL Connect

Firebase SQL Connect（**原名 Data Connect，已改名**，技能里两个名字通用）= Cloud SQL for PostgreSQL + GraphQL schema + 自动生成的 queries/mutations + 类型安全 SDK。项目结构：`dataconnect/`（`schema/schema.gql` 定 `@table` 数据模型、`connector/` 放 queries/mutations 与 SDK 生成配置）。

**默认 Native GraphQL**（类型安全、schema 强约束），仅当需要 PostGIS、窗口函数、复杂聚合等高级特性时才用 **Native SQL**（原始 SQL、无类型安全、严格位置参数 `$1`）。授权 secure by default，用 `@auth(level: ...)`（`PUBLIC` / `USER` / `NO_ACCESS`）、`@check` / `@redact` 做行级安全。

```bash
npx -y firebase-tools@latest init dataconnect          # 初始化
npx -y firebase-tools@latest dataconnect:compile        # 校验 schema/operations
npx -y firebase-tools@latest dataconnect:sdk:generate   # 生成类型安全 SDK
npx -y firebase-tools@latest deploy --only dataconnect  # 部署到 Cloud SQL
```

SDK 覆盖 Web(TS) / Android(Kotlin) / iOS(Swift) / Flutter(Dart) / Node Admin。还支持向量搜索（`Vector`）、全文搜索（`@searchable`）、事务（`@transaction`）、upsert（`_upsert`，写用户档案的利器）、实时订阅（`@refresh`）。

## firebase-security-rules-auditor：红队审计

唯一的纯审计技能——扮演资深安全审计与渗透测试者，**主动找「墙上的洞」**，不因规则看起来复杂就假定它安全。强制清单：

1. **更新绕过**：对比 create 与 update 规则——用户能否先建合法文档，再 update 成非法/恶意状态（改 role、破坏类型、越过大小限制）？
2. **权威来源**：敏感字段（`role` / `isAdmin` / `ownerId`）是否依赖用户提供的 `request.resource.data`？
3. **业务逻辑 vs 规则**：规则是否真支持 app 目的（协作 app 里协作者能不能读到数据）？
4. **存储滥用**：有没有字符串长度/数组大小限制？没有就是资源耗尽/DoS 风险
5. **类型安全**：字段是否 `is string` / `is int` / `is timestamp` 校验？
6. **字段级 vs 身份级**：`hasOnly()` / `diff()` 只限「改哪些字段」，**不限「谁能改」**——缺 `resource.data.uid == request.auth.uid` 这类归属校验就是数据完整性漏洞

评分 1（严重：越权/泄露/绕过）→ 5（安全：严格归属 + 类型校验 + 基于 ACL 的角色访问），返回 `{ score, summary, findings[] }` JSON。

## Hosting vs App Hosting

| 用 Firebase Hosting（Classic）| 用 Firebase App Hosting |
| --- | --- |
| 静态站（HTML/CSS/JS） | Next.js / Angular 等全栈框架 |
| 简单 SPA（React/Vue，无 SSR） | 需要 SSR / ISR |
| 想 CLI 完全掌控构建部署 | 想 git push to deploy 零配置 |
| CDN + 零配置 SSL + 预览通道 | 需 **Blaze** 计划 |

```bash
npx -y firebase-tools@latest emulators:start --only hosting   # 本地 localhost:5000
```

## xcode-project-setup：iOS 加 Firebase

安全修改 Xcode `.pbxproj` 加 SPM 包并链接文件。几条硬规则：

- **禁 Ruby**（含 `xcodeproj` gem）——一律不写/不跑 Ruby 脚本；必须脚本时用 Swift（最后才 Node.js/TS）
- **现代文件夹同步**：加 `.swift`/资源文件时**直接写到磁盘对应目录**即自动纳入工程，**不手改 `.pbxproj`**
- **工具链验证**：先 `swift --version`，没有就停下让用户装
- **Firebase 静态框架必须 `-ObjC`**：否则链接器会剥掉 Objective-C category 与 `+load` 方法，导致运行时崩溃（如 `FirebaseAuth/Auth.swift:167: Fatal error: Unexpectedly found nil`）。技能提供的 `xcode_spm_setup` Swift 脚本会自动注入该标志，且幂等

## Genkit 与 Firebase MCP Server

- **Genkit**：`firebase-basics` 明确——「若用 Genkit，装 `npx skills add genkit-ai/skills`」。Genkit 是 Firebase 的开源 AI 框架（SDK 覆盖 **dart / go / js**），做更复杂的 AI 编排时用，与 AI Logic 互补
- **Firebase MCP Server**：技能反复强调「用 MCP Server 工具而非直接 API 调用」——`firebase_get_environment` 先看当前项目环境、`firebase_read_resources` 读 `firebase://` URL、`developerknowledge_search_documents` 查官方知识。Gemini CLI 扩展里 MCP server 就是 `npx -y firebase-tools@latest mcp`

## 反模式清单

- ❌ 用裸 `firebase` 命令 → ✅ 一律 `npx -y firebase-tools@latest`
- ❌ 凭内部记忆写 Gemini 模型名（`gemini-2.0-flash` 已下线）→ ✅ 查官方 Models 文档 / 用 Remote Config
- ❌ AI Logic 只跑 `flutterfire configure` → ✅ 必须 `init ailogic` 供给后端
- ❌ 改 `firebase.json` auth 不部署 → ✅ `deploy --only auth`
- ❌ Firestore 规则只 `hasOnly()` 不查归属 → ✅ 加 `resource.data.uid == request.auth.uid`
- ❌ iOS 手改 `.pbxproj` / 用 Ruby → ✅ 文件夹同步 + Swift 脚本 + Firebase `-ObjC`
- ❌ 让用户去 Console 下配置文件 → ✅ `apps:sdkconfig` 程序化拉取

## 下一步

- [参考](./reference) —— 11 技能清单表 + 安装矩阵 + Genkit + Firebase MCP Server + 许可与链接
- 上游：[Firebase 文档](https://firebase.google.com/docs) · [Agent Skills 格式](https://agentskills.io/home)
