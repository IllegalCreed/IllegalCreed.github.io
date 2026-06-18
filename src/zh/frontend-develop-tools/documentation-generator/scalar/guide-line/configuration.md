---
layout: doc
outline: [2, 3]
---

# 配置对象详解

> 基于 @scalar/api-reference 1.60.0 编写

## 速查

- 所有接入方式共用一个**通用配置对象**（universal configuration object），字段一致
- 加载 spec：`url`（指向地址，**可缓存、官方推荐**）/ `content`（内联对象或字符串，大文档影响性能）/ `sources[]`（多 spec，每项需 `slug` + `title`）
- 外观：`theme`（11 套 + `none`）/ `layout`（`modern` 默认 / `classic`）/ `customCss`（注入 CSS 精修）
- 明暗：`darkMode`（默认值）/ `forceDarkModeState`（`'dark'`|`'light'`，**锁定且隐藏切换**）
- 可见性：`showSidebar` / `hideModels` / `hideTestRequestButton` / `hideClientButton`
- 请求相关：`servers`（覆盖 spec 的 servers）/ `authentication`（预填凭据）/ `proxyUrl`（CORS 代理）/ `defaultHttpClient` / `hiddenClients`
- 其它：`searchHotKey`（自定义搜索热键）；旧 `fetch` 选项已弃用，改 `customFetch`

## 加载规范：url / content / sources

| 字段 | 形态 | 取舍 |
| --- | --- | --- |
| `url` | spec 的地址字符串 | **可缓存、与页面解耦，推荐**首选 |
| `content` | 直接内联 spec 对象 / 字符串 | 省一次请求，但**大文档影响性能** |
| `sources` | 数组，多份 spec | 每项需 `slug`（路由区分）+ `title`（展示名） |

```ts
// 单 spec：优先 url
createApiReference("#app", { url: "/openapi.json" });

// 多 spec：用 sources，每项给 slug + title
createApiReference("#app", {
  sources: [
    { slug: "v1", title: "API v1", url: "/v1/openapi.json" },
    { slug: "v2", title: "API v2", url: "/v2/openapi.json" },
  ],
});
```

::: tip url 还是 content
默认用 `url`——spec 可被浏览器缓存、与页面更新解耦。只有当 spec 已在内存、且体量不大时才考虑 `content`；大文档内联会拖慢首屏与内存。
:::

## 外观：theme / layout / customCss

- `theme`：11 套内置配色——`default` `alternate` `moon` `purple` `solarized` `bluePlanet` `saturn` `kepler` `mars` `deepSpace` `laserwave`，另有 `none`（不套主题、便于完全自定义）
- `layout`：`modern`（默认）或 `classic`，控制版式，与配色正交
- `customCss`：注入 CSS 字符串做细粒度覆盖；把 `theme` 设 `none` 再配 `customCss` 可完全自定义外观

```ts
createApiReference("#app", {
  url: "/openapi.json",
  theme: "purple",
  layout: "modern",
  customCss: ".scalar-app { --scalar-font: 'Inter'; }",
});
```

## 明暗模式：darkMode 与 forceDarkModeState

- `darkMode`：仅设默认是否暗色，**用户仍可切换**
- `forceDarkModeState`：取 `'dark'` 或 `'light'`，**强制锁定并隐藏切换按钮**

```ts
// 默认暗色且不让用户切回亮色
createApiReference("#app", { url: "/openapi.json", forceDarkModeState: "dark" });
```

::: warning 只设 darkMode 不能锁定
`darkMode: true` 仅改默认值；要"固定暗色不可切换"必须用 `forceDarkModeState: 'dark'`。
:::

## 可见性开关

| 字段 | 效果 |
| --- | --- |
| `showSidebar` | `false` 隐藏左侧导航，适合嵌入式 / 窄屏 |
| `hideModels` | 隐藏底部 Models / Schemas（数据模型）区块 |
| `hideTestRequestButton` | 隐藏"发起测试请求"按钮 |
| `hideClientButton` | 隐藏"调起 API 客户端"按钮 |

想把 Scalar 收敛成接近只读的展示：`hideTestRequestButton` + `hideClientButton` 一起隐藏发请求入口即可。

## 请求相关字段

| 字段 | 作用 |
| --- | --- |
| `servers` | 覆盖 spec 里声明的 servers，让客户端指向自定义地址（如换本地 mock） |
| `authentication` | 为内置客户端预填鉴权凭据（token / API Key 等），打开即可带鉴权发请求 |
| `proxyUrl` | 跨域代理地址（默认 `https://proxy.scalar.com`），绕过 CORS |
| `defaultHttpClient` | 代码片段区默认高亮哪种语言 / 客户端 |
| `hiddenClients` | 从代码片段区隐藏不想暴露的客户端 |

::: warning 旧 fetch 选项已弃用
此前用直接的 `fetch` 选项定制请求，现已弃用，改用 `customFetch` 传入自定义 fetch 实现（如加拦截、改 header）。
:::

## searchHotKey

`searchHotKey` 自定义唤起站内搜索框的快捷键。当 Scalar 被嵌入既有站点、默认热键与宿主页面冲突时，改键位而非关搜索。

下一步：[内置客户端与 CORS](./api-client-cors.md) · [主题与对比选型](./themes-comparison.md) · [速查参考](../reference.md)
