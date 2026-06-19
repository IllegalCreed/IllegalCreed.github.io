---
layout: doc
outline: [2, 3]
---

# 最佳实践与反模式

> 基于 Vitest v4.x / Jest v30.x 编写

## 速查

- 组件快照：`expect(wrapper.html()).toMatchSnapshot()`，只快照关键结构、勿整树
- 反模式：快照过大沦为橡皮图章、不审查就 `-u`、快照含动态值、用快照替代精确断言
- 最佳实践：小而聚焦、把 `.snap` diff 当 code review 对象、动态值用属性匹配器
- `.snap` 必须提交版本库；含 `Date.now()`/`Math.random()` 的组件测试前先 mock
- 优先精确断言（`toBe`/`toEqual`），快照用于结构回归兜底

## 组件快照（Vue 示例）

配合 `@vue/test-utils` 捕获组件渲染结构：

```ts
import { mount } from "@vue/test-utils";
import { expect, it } from "vitest";
import MyButton from "@/components/MyButton.vue";

it("MyButton 渲染", () => {
  const wrapper = mount(MyButton, { props: { label: "提交" } });
  expect(wrapper.html()).toMatchSnapshot(); // 快照 outerHTML 字符串
});

it("MyButton 小组件内联", () => {
  const wrapper = mount(MyButton, { props: { label: "OK" } });
  expect(wrapper.html()).toMatchInlineSnapshot(
    `"<button class="btn btn--primary">OK</button>"`,
  );
});
```

- `wrapper.html()` → 纯文本 HTML；`wrapper.element` → DOM 节点（序列化更详细）
- 组件快照极易膨胀——用 `find` / `findComponent` 缩小到关键结构再快照

## 反模式

| 反模式 | 危害 |
| ------ | ---- |
| 快照过大 | diff 难读，沦为「橡皮图章」盲目通过 |
| 不审查 diff 就 `-u` | 把 bug 固化成新基准，失去安全网 |
| 快照含动态值 | 时间戳 / 随机 ID 让快照每次都失败 |
| 用快照替代精确断言 | `expect(count).toBe(5)` 比快照更清晰可维护 |
| `.snap` 不提交版本库 | CI 无法比对，失去回归保护 |
| 整个大对象快照 | 任何字段变化都触发失败，信噪比低 |

## 最佳实践

1. **把快照当 code review 对象**：PR 里 `.snap` 的 diff 必须人工审查，与源码同等重要
2. **小而聚焦**：只快照关键子结构（`find`/`pick` 缩小范围），别快照整个应用树
3. **内联用于小输出**：5 行以内优先 `toMatchInlineSnapshot`，免跨文件跳转
4. **动态值用属性匹配器**：含 ID / 时间戳的对象一律 `expect.any()`
5. **快照随代码提交**：`.snap` 必须 `git commit`，不要加进 `.gitignore`
6. **优先精确断言**：`toBe` / `toEqual` 更明确，快照作结构回归兜底
7. **描述性测试名**：测试名即快照 key，写清语义（如「未登录时渲染为空」）
8. **mock 非确定性数据**：含 `Date.now()` / `Math.random()` 的组件，测试前先 mock

::: tip 本项目取向
本仓库前后端测试以**精确断言**为主、未采用快照测试——这正契合「优先精确断言、快照作兜底」的实践取向。快照适合 UI 结构回归等场景，不必处处使用。
:::