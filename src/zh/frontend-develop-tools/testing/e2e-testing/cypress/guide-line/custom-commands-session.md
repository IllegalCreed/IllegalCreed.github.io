---
layout: doc
outline: [2, 3]
---

# 自定义命令与会话

> 基于 Cypress v15.x 编写

## 速查

- 自定义命令：`Cypress.Commands.add("name", fn)`，写在 `cypress/support/commands.ts`
- 命令类型：parent（新链）/ child（`prevSubject: true`）/ dual（`"optional"`）
- `cy.session(key, setup, { validate })`：缓存登录态，跨测试复用免重复登录
- `cy.origin(url, { args }, fn)`：跨域操作（v14 起跨 origin 跳转必用）
- TS 用户需在 `Chainable` 接口里声明自定义命令类型

## 自定义命令

把重复流程（登录、拖拽等）封装成 `cy.xxx()`：

```ts
// cypress/support/commands.ts
Cypress.Commands.add("loginByApi", (username: string, password: string) => {
  cy.request("POST", "/api/auth/login", { username, password }).then((resp) => {
    window.localStorage.setItem("token", resp.body.token);
  });
});

// TypeScript 类型声明
declare global {
  namespace Cypress {
    interface Chainable {
      loginByApi(username: string, password: string): Chainable<void>;
    }
  }
}
```

> 本项目 `cypress/support/commands.ts` 即用此模式封装 `login` / `drag` / `dismiss` 等命令复用。

## 命令类型

| 类型 | `prevSubject` | 含义 | 例子 |
| ---- | ------------- | ---- | ---- |
| Parent | `false`（默认） | 开启新链 | `cy.login()` |
| Child | `true` / `"element"` | 接收上一个主题 | `.click()` |
| Dual | `"optional"` | 可有可无前置主题 | `cy.scrollTo()` |

```ts
// child 命令：接收前一个元素作为 subject
Cypress.Commands.add("drag", { prevSubject: "element" }, (subject, opts) => {
  // subject 即链上前一个元素
});
```

## cy.session 缓存登录态

`cy.session` 把 cookies / localStorage / sessionStorage 按 key 缓存，一次登录后续测试复用，**不必每个测试都走 UI 登录**：

```ts
Cypress.Commands.add("login", (username: string, password: string) => {
  cy.session(
    `user-${username}`, // 唯一 key，相同 key 复用缓存
    () => {
      // setup：仅首次（或缓存失效）执行
      cy.request("POST", "/api/auth/login", { username, password })
        .its("body.token")
        .then((token) => localStorage.setItem("token", token));
    },
    {
      validate() {
        // 每次复用前验证 session 仍有效
        cy.request("/api/me").its("status").should("eq", 200);
      },
      cacheAcrossSpecs: true, // 跨 spec 文件复用
    },
  );
});

beforeEach(() => {
  cy.login("admin", "password");
  cy.visit("/dashboard");
});
```

## cy.origin 跨域

Cypress 单测试只能操作一个超域。**v14 起 `injectDocumentDomain` 默认关闭**，任何跨 origin 跳转（含子域）都要 `cy.origin`：

```ts
cy.visit("/login");
// 跳到第三方 SSO 域
cy.origin("https://sso.company.com", { args: { user: "a@test.com", pass: "x" } }, ({ user, pass }) => {
  cy.get("#email").type(user);
  cy.get("#password").type(pass);
  cy.get("[type=submit]").click();
});
cy.url().should("include", "/dashboard"); // 回主域继续
```

::: warning cy.origin 的限制
callback 是独立沙箱，**不能闭包引用外部变量**（必须用 `args` 传入）；内部**不能**用 `cy.intercept` / `cy.session` / 嵌套 `cy.origin`；`import`/`require` 要用 `Cypress.require`。
:::