---
layout: doc
outline: [2, 3]
---

# Vendor Extensions（特有扩展）

> 基于 Redoc 2.5.3 / @redocly/cli 2.34.0 编写

## 速查

- Redoc 支持若干 OpenAPI **vendor extension**（`x-` 开头的自定义字段），用来增强文档而不破坏标准 spec
- **`x-tagGroups`**：把多个 tag 归并成带标题的**分组导航**，左栏出现「分组 → 多 tag」二级结构，适合大型 API
- **`x-logo`**：放在 `info` 下，在文档左上角展示**品牌 Logo**（`url` / `backgroundColor` / `altText` / `href`）
- **`x-codeSamples`**：放在某个 operation 下，提供**多语言请求示例**（`lang` + `source` 数组），展示在右栏
- 这些是 Redoc 特有扩展，普通 OpenAPI 工具未必识别；想在文档里显示任意 `x-` 字段可开 `showExtensions`
- `x-codeSamples` 现行驼峰写法；历史上有连字符旧写法 `x-code-samples`，以现行为准

## `x-tagGroups`：分组导航

接口一多，左侧一长串扁平 tag 就难找了。`x-tagGroups` 写在 OpenAPI 顶层，把若干 tag 归到有标题的分组下，导航变成两级。

```yaml
x-tagGroups:
  - name: 用户与权限
    tags:
      - Users
      - Auth
  - name: 订单
    tags:
      - Orders
      - Payments
```

左栏即呈现「用户与权限 / 订单」两个分组，各自展开下属 tag。适合按业务域归类的大型 API。

## `x-logo`：品牌 Logo

放在 `info` 对象下，在文档顶部 / 导航区展示自家品牌标识，是 Redoc「漂亮文档」体验的一部分。

```yaml
info:
  title: 示例 API
  version: 1.0.0
  x-logo:
    url: https://example.com/logo.svg
    backgroundColor: "#FFFFFF"
    altText: 示例公司
    href: https://example.com
```

## `x-codeSamples`：多语言请求示例

写在某个 operation 下，用数组提供多种语言的调用示例，渲染在右栏代码区。这让只读文档也能给读者贴合实际的调用范例（注意：这只是**静态示例代码**，不是能真正发请求的 Try-it-out）。

```yaml
paths:
  /users/{id}:
    get:
      summary: 获取用户
      x-codeSamples:
        - lang: cURL
          source: |
            curl https://api.example.com/users/1
        - lang: JavaScript
          source: |
            const res = await fetch("/users/1");
            const user = await res.json();
```

::: tip x-codeSamples ≠ 交互调用
`x-codeSamples` 提供的是**写死的示例片段**，供读者复制参考；它不会真的发请求。开源 Redoc 默认没有「点按钮发请求」的交互，那属于商业版 / Replay。
:::

## 显示任意 `x-` 扩展字段

spec 里携带的其它 `x-` 自定义字段默认不展示。想让读者看到（如自定义元数据），用配置项 `showExtensions`：

```js
{ showExtensions: true } // 或传要显示的扩展名列表
```

## 扩展一览

| Vendor Extension | 位置 | 作用 |
| --- | --- | --- |
| `x-tagGroups` | 顶层 | 把多个 tag 归并成带标题的分组导航 |
| `x-logo` | `info` 下 | 文档顶部展示品牌 Logo |
| `x-codeSamples` | operation 下 | 提供多语言请求示例代码（右栏展示） |

> 这些扩展是 Redoc 的增强能力，写进 spec 不影响其作为合法 OpenAPI 被其它工具消费（不识别的工具会忽略 `x-` 字段）。

下一步：[开源 vs 商业与选型](./open-source-vs-commercial.md) · [速查参考](../reference.md)
