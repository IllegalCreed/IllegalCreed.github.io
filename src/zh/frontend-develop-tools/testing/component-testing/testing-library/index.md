---
layout: doc
---

# Testing Library

以"用户中心"为哲学的组件测试方案（`@testing-library/vue` + `@testing-library/user-event`）。核心理念是「测试越像软件实际被使用的方式，越能给你信心」——用语义化查询（`getByRole` / `getByLabelText`）代替 CSS 选择器、用 `user-event` 模拟完整真实交互，并主动避免测试组件内部实现细节。它构建在 Vue Test Utils 之上，但屏蔽了 `vm` / `props` 等内部访问入口。

## 评价

**优点**

- **测行为而非实现**：操作 DOM、模拟用户，重构组件实现（不改功能）时测试不易碎
- **语义查询**：`getByRole` 等基于无障碍树，倒逼写出可访问性更好的 HTML
- **user-event 真实**：模拟完整交互序列（焦点、按键、可见性检查），比 `fireEvent` 更接近真实
- **断言友好**：配 `@testing-library/jest-dom` 提供 `toBeInTheDocument` 等语义化断言
- **跨框架一致**：React / Vue / Svelte 共享同一套查询与哲学

**缺点**

- **思路要转**：从"查 class、断言 props"转到"按角色查、断言用户可见行为"
- **不擅内部契约**：验证 emitted 事件 / props 合约不如 VTU 直接（二者互补）
- **插槽测试弱**：不在其设计目标内，复杂插槽场景用 VTU 更顺
- **维护节奏**：`@testing-library/vue` 发版频率低于 VTU，但 API 稳定

## 文档地址

[Vue Testing Library](https://testing-library.com/docs/vue-testing-library/intro/)

## GitHub地址

[Vue Testing Library](https://github.com/testing-library/vue-testing-library)

## 幻灯片地址

<a href="/SlideStack/testing-library-slide/" target="_blank">Testing Library</a>
