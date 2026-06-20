---
layout: doc
outline: [2, 3]
---

# 网络拦截

> 基于 Cypress v15.x 编写

## 速查

- `cy.intercept(method, url, response)`：拦截网络请求，三种模式 stub / spy / 动态
- 必须在 `cy.visit()` **之前**注册；每个测试后自动清除
- 配 `.as("alias")` + `cy.wait("@alias")` 等待请求完成
- stub 静态响应做 Mock API；`{ fixture: "x.json" }` 用文件数据
- 动态处理：`(req) => req.reply(...)` 按请求内容决定响应
- `cy.intercept` 不能在 `cy.origin()` callback 内使用

## cy.intercept 三种模式

```ts
// ① Stub 静态响应（Mock API 最常用）
cy.intercept("GET", "/api/users", {
  statusCode: 200,
  body: [{ id: 1, name: "张三" }],
}).as("getUsers");

// ② Spy（不 stub，只监听，用于真实后端 E2E）
cy.intercept("POST", "/api/quiz/submit").as("submitQuiz");

// ③ 动态处理（按请求内容决定响应）
cy.intercept("POST", "/api/login", (req) => {
  if (req.body.username === "admin") {
    req.reply({ statusCode: 200, body: { token: "abc" } });
  } else {
    req.reply({ statusCode: 401, body: { message: "用户名或密码错误" } });
  }
}).as("login");
```

> 本项目 `quiz-admin` 用 Mock 拦截规避真实 SSE 连接：`cy.intercept("GET", "**/api/admin/clients", MOCK_LIST_RESPONSE).as("getClients")`，再 `cy.wait("@getClients")`。

## cy.wait 等待请求 + 断言

```ts
cy.intercept("GET", "/api/users", { fixture: "users.json" }).as("getUsers");
cy.visit("/");
cy.wait("@getUsers"); // 等待请求完成再断言
cy.get('[data-cy="user-list"]').should("have.length", 1);

// 等待并断言请求/响应内容
cy.wait("@login").then((interception) => {
  expect(interception.request.body).to.have.property("username");
  expect(interception.response.statusCode).to.equal(200);
});

// 链式断言更简洁
cy.wait("@submitQuiz").its("response.statusCode").should("eq", 200);

// 同时等多个请求
cy.wait(["@getActivities", "@getMessages"]);
```

::: warning 注册时机
`cy.intercept` 必须在触发请求的 `cy.visit` / 操作**之前**注册，否则来不及拦截。
:::

## fixtures 测试数据

`cypress/fixtures/` 下的 JSON 文件，配 `cy.intercept` 做 Mock 数据：

```ts
// cypress/fixtures/users.json → [{ "id": 1, "name": "张三" }]
cy.intercept("GET", "/api/users", { fixture: "users.json" }).as("getUsers");

// 也可手动加载
cy.fixture("users.json").then((data) => {
  cy.log(data[0].name);
});
```

## 别名 alias

`.as("name")` 注册别名，`cy.get("@name")` 引用——拦截、元素、fixture 通用：

```ts
cy.get('[data-cy="list"] li').as("items");
cy.get("@items").should("have.length", 3);
```

::: tip 别名作用域
别名在**每个测试前自动重置**。所以要放在 `beforeEach` 里注册，而非 `before`（`before` 里的别名下一个测试就失效）。
:::