---
layout: doc
outline: [2, 3]
---

# uniCloud：Serverless 云开发

> 基于 uni-app 5.x（uni-app x）· 核于 2026-07

## 速查

- **是什么**：DCloud 联合**阿里云 / 腾讯云 / 支付宝云**推出的 **Serverless 云开发平台**，前后端都用 JS，免运维
- **四大组成**：**云函数/云对象**（服务端 JS，直接部署 serverless）｜ **云数据库**（**MongoDB 系**，用 **DB Schema** 定义结构/权限/校验）｜ **云存储**（文件）｜ **clientDB**（前端用 **JQL** 直查数据库，多数场景**免写服务端代码**）
- **clientDB**：前端用 JS 查询语言（JQL）直接读写云数据库，配合 `<unicloud-db>` 组件可声明式取数；权限由 **DB Schema** 的 `permission` 把关
- **云对象** vs 云函数：云对象是更工程化的封装（像调用本地方法一样 `importObject` 后调用），推荐优先用
- **配套**：`uni-id`（用户体系）、`uni-starter`（脚手架）、`uni-admin`（管理端）
- **计费**：阿里云、支付宝云有免费服务空间；按调用/存储/流量计费
- 云数据库是 **MongoDB 系**（文档型），**不是** MySQL 之类关系库，别按 SQL 心智设计

## 一、uniCloud 是什么

uniCloud 是 DCloud 联合**阿里云、腾讯云、支付宝云**推出的 **Serverless 云开发平台**：前端用 uni-app、后端用 JS 云函数，**前后端都是 JS**，无需自己买服务器、配运维。它与 uni-app 一体化——在 HBuilderX 里直接创建云服务空间、写云函数、部署。

四大组成：

| 组成 | 说明 |
| --- | --- |
| **云函数 / 云对象** | 服务端 JS，直接部署到 serverless，无需运维 |
| **云数据库** | **MongoDB 系**（文档型）；用 **DB Schema** 定义结构、权限、校验 |
| **云存储** | 文件存储（图片、附件等） |
| **clientDB** | 前端用 **JQL**（JS 查询语言）直查数据库，多数场景免写服务端代码 |

## 二、云函数与云对象

**云函数**是最基础的服务端单元——一段部署到云端的 JS：

```js
// 云函数：cloudfunctions/getList/index.js
'use strict'
exports.main = async (event, context) => {
  // event 是客户端传入参数
  return { code: 0, data: ['a', 'b', 'c'] }
}
```

客户端调用：

```js
const res = await uniCloud.callFunction({
  name: 'getList',
  data: { page: 1 }
})
console.log(res.result)
```

**云对象**是更工程化的封装：把一组方法组织成一个「对象」，客户端 `importObject` 后**像调本地方法一样**调用，省去手写 `callFunction` 样板，推荐优先用：

```js
// 客户端
const todo = uniCloud.importObject('todo')
const list = await todo.getList(1)
```

## 三、云数据库与 DB Schema

云数据库是 **MongoDB 系**（文档型），**不是关系型数据库**——按集合（collection）+ 文档（document）建模，别套 SQL/JOIN 心智。

**DB Schema** 用 JSON 定义每个表的字段结构、校验规则与**权限**，可自动生成部分代码并做角色权限控制：

```json
{
  "bsonType": "object",
  "required": ["title"],
  "permission": {
    "read": true,
    "create": "auth.uid != null",
    "update": "doc.uid == auth.uid",
    "delete": "doc.uid == auth.uid"
  },
  "properties": {
    "title": { "bsonType": "string", "title": "标题" },
    "uid": { "bsonType": "string", "forceDefaultValue": { "$env": "uid" } }
  }
}
```

`permission` 是安全核心：它决定 clientDB 能否直接读写，把权限判断下沉到 Schema，前端直查也安全。

## 四、clientDB：前端直查数据库

**clientDB** 让前端用 **JQL（JS 查询语言）** 直接读写云数据库，**多数场景无需写服务端代码**，权限由 DB Schema 的 `permission` 把关：

```js
const db = uniCloud.database()
// 前端直接查询，链式 JQL
const res = await db.collection('todo')
  .where('done == false')
  .orderBy('createTime desc')
  .limit(20)
  .get()
```

配合内置组件 **`<unicloud-db>`** 可声明式取数（组件负责查询与分页，模板直接渲染结果），进一步减少样板。

## 五、生态配套

- **`uni-id`**：开箱的用户体系（注册/登录/角色权限），与 DB Schema 权限打通。
- **`uni-starter`**：整合登录、支付、消息等的工程脚手架。
- **`uni-admin`**：基于 uniCloud 的管理后台方案。

**计费/空间**：阿里云、支付宝云提供免费服务空间起步，超出后按调用次数/存储/流量计费。

云函数里也用 `uni.*` 之外的服务端 API；前端调用与组件见 [API 与组件](./api-components)，工程配置见[工程配置](./project-config)。
