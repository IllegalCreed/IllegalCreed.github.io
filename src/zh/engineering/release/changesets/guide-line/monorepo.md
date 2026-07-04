---
layout: doc
outline: [2, 3]
---

# 指南 - Monorepo

> 基于 Changesets（@changesets/cli）· 核于 2026-07

## 速查

- **内部依赖联动**：被依赖包升级 → 依赖方自动补 bump（默认最低 `patch`）并更新其 `package.json` 里的依赖范围
- **联动触发条件**：新版本**不满足**依赖方原有的 semver range 时才补 bump；`workspace:*` 恒满足，仅更新范围不强制 bump
- **`updateInternalDependencies`**：控制联动补 bump 的「地板」级别，`"patch"`（默认）/ `"minor"`
- **`workspace:` 协议**：pnpm / yarn 内部依赖首选写法；发布时被替换成真实版本号（`workspace:^` → `^1.2.0`）
- **`bumpVersionsWithWorkspaceProtocolOnly: true`**：只更新 `workspace:` 声明的依赖范围，忽略写死版本号的
- **`fixed`**：一组包**齐步升级 + 齐步发布**，取全组最高 bump——强绑定套件用
- **`linked`**：一组包**共享版本号，但只发实际改动的**——想版本看齐又不想全量发布用
- **`fixed` / `linked` / `ignore` 支持 glob**：`[["@myorg/*"]]`（picomatch）
- **给应用做版本**：`private: true` + `privatePackages: { version: true, tag: ... }`，可只维护版本 / changelog 不发 npm
- **非 npm 包**：只要有 `package.json`（`name` + `private` + `version`）即可被 Changesets 管版本，发布交给外部流程
- **`ignore` 陷阱**：被 ignore 的包不发；但「要发的包依赖被 ignore 的包」时**不**强制你连带 ignore 依赖方

## 内部依赖为什么要联动

monorepo 里包互相依赖：`@myorg/cli` 依赖 `@myorg/core`。如果 `core` 发了新版本，而 `cli` 的 `package.json` 里对 `core` 的依赖范围没跟上，用户装了新 `cli` 却配到旧 `core`，就可能出问题。Changesets 在 `changeset version` 时自动处理这件事：

> **被依赖的包升级后，如果新版本不再满足依赖方声明的范围，就给依赖方补一个 bump，并把依赖范围更新到新版本。**

### 一个具体例子

初始状态：

```
@myorg/core  1.2.0
@myorg/cli   1.0.0   （依赖 "@myorg/core": "^1.2.0"）
```

现在只给 `core` 写了一个 `minor` 的 changeset。`changeset version` 后：

```
@myorg/core  1.3.0
@myorg/cli   1.0.1   （依赖被更新为 "@myorg/core": "^1.3.0"）
```

`core` 升到 `1.3.0` 仍满足 `^1.2.0`（未越 major），因此 `cli` 本可不动——但为了让 `cli` 的 `package.json` 携带更新后的依赖范围一起发布出去，Changesets 按 `updateInternalDependencies`（默认 `patch`）给 `cli` 补了一个 patch。若 `core` 升的是 `major`（到 `2.0.0`，越过 `^1.2.0`），则 `cli` **必须**升级才能表达新的依赖关系。

::: tip `updateInternalDependencies` 的作用
它是这个「补 bump」的最低级别。默认 `patch` 意味着上例中 `cli` 补 patch；设成 `minor` 则补 minor。它只是地板——`cli` 若自身另有 major changeset，则以更高者为准。
:::

## `workspace:` 协议

pnpm 和 yarn 支持用 `workspace:` 声明内部依赖，表示「用工作区里的本地版本」：

```json
{
  "dependencies": {
    "@myorg/core": "workspace:^",
    "@myorg/utils": "workspace:*"
  }
}
```

**发布时**（`changeset publish` / `pnpm publish`）这些 `workspace:` 会被替换成真实版本号：`workspace:^` → `^1.3.0`、`workspace:*` → `1.3.0`。

Changesets 理解 `workspace:` 协议。有一个相关配置：

- **`bumpVersionsWithWorkspaceProtocolOnly: true`**：只更新用 `workspace:` 声明的内部依赖范围，对那些直接写死版本号（如 `"@myorg/core": "^1.2.0"`）的内部依赖不去改。当团队约定内部依赖统一写 `workspace:` 时开启，行为更纯粹、可预测。

::: warning `workspace:*` 与 range 满足性
`workspace:*` 永远指向本地当前版本，语义上恒满足，因此被依赖包升级时不会因「range 不满足」而强制 bump 依赖方，只会更新发布时替换出来的具体版本号。而 `workspace:^` / `workspace:~` 在越过对应边界时仍会触发联动。
:::

## fixed 与 linked 实战

两者都让一组包**共享同一个版本号**，写法都是「数组的数组」（可多组）并支持 glob。区别只在**是否齐发**。

### fixed：强绑定，齐步走

```json
{ "fixed": [["@myorg/pkg-a", "@myorg/pkg-b", "@myorg/pkg-c"]] }
```

组内任意一个包有改动，**全组一起升、一起发**，版本号取全组所需的最高 bump。演示（三个都从 `1.0.0` 起）：

```
changeset: pkg-a=patch, pkg-b=minor, pkg-c=major
  ──► 全组取最高 major ──► pkg-a / pkg-b / pkg-c 都到 2.0.0，一起发布

下一次 changeset: 只有 pkg-a=minor
  ──► 全组一起 ──► pkg-a / pkg-b / pkg-c 都到 2.1.0
```

适合：必须严格同版本、同节奏发布的紧耦合套件（比如一个框架的 `core` / `runtime` / `compiler`）。

### linked：版本看齐，按需发布

```json
{ "linked": [["@myorg/pkg-a", "@myorg/pkg-b"]] }
```

**只有实际有 changeset 的包才升、才发**；但升的时候，新版本以「全组当前最高版本 + 本次最高 bump」为基准，从而让版本号看起来同步。演示（都从 `1.0.0` 起）：

```
changeset: 只有 pkg-a=minor
  ──► 只有 pkg-a 发布，到 1.1.0；pkg-b 不动（仍 1.0.0）

下一次 changeset: 只有 pkg-b=patch
  ──► pkg-b 起跳点 = 全组当前最高(1.1.0) + patch ──► pkg-b 到 1.1.1（而非 1.0.1）
```

关键差异：**`fixed` 保证「谁都不会掉队」（全发），`linked` 只保证「版本号不会各说各话」（按需发但看齐）。** 官方明确指出：linked 组内**不保证所有包都会被 version-bump 和发布，只有带 changeset 的才会**。

### glob 简化维护

不想手工列包名，可用 picomatch glob 自动匹配：

```json
{
  "fixed": [["@myorg/eslint-config-*"]],
  "linked": [["@myorg/preset-*"]]
}
```

## 给应用与非 npm 包做版本

Changesets 不只服务于「要发到 npm 的库」。它也能给**应用**、以及 **NuGet / Ruby gem / Docker 镜像**这类非 npm 产物管版本——唯一要求是有个 `package.json` 用来记版本和依赖。

### 私有应用：只维护版本与 changelog

给应用（不发 npm）加一个最小 `package.json` 并标 `private`：

```json
{
  "name": "my-app",
  "private": true,
  "version": "0.0.1"
}
```

`privatePackages` 控制私有包的处理（默认 `{ "version": true, "tag": false }`）：

```json
// 只升版本 + 写 changelog，不打 tag（默认）
{ "privatePackages": { "version": true, "tag": false } }

// 想让 CI 拿到 tag 去触发外部发布流程（如打 Docker 镜像）
{ "privatePackages": { "version": true, "tag": true } }
```

这样 `changeset version` 会照常给应用升版本、写 CHANGELOG，`publish` 则因 `private: true` 不会真的推到 npm。若把 `tag` 设为 `true`，发布阶段会为它打 git tag——**你的外部流水线可以监听这个 tag 去构建镜像 / 发 gem**。官方提醒：Changesets 只负责改 `package.json` 版本，**非 npm 产物的实际发布得由你的外部流程接手**。

### ignore 与它的陷阱

`ignore` 列出「本轮不发布」的包。一个实用而反直觉的行为：

> 当一个**要发布的**私有包，依赖了一个**被 ignore 的**私有包时，Changesets **不会**强制你把依赖方也加进 ignore。

因为私有包本就不会被推到 npm，不存在「发出去却带着对未发布包的引用」的风险。例如应用 `A`（要发）依赖库 `B`（`ignore: ["B"]`，暂不发），这是允许的——只有 `A` 会走版本流程，`B` 安静待命。

::: warning 别把 ignore 当长期开关
`ignore` 定位是**临时**手段（比如某个包正在重写、暂缓发布）。长期放着容易让「这个包到底发不发」的心智负担累积。真要长期不发，考虑 `private: true` 更明确。
:::
