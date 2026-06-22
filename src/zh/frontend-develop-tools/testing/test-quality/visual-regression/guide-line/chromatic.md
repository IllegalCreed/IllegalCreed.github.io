---
layout: doc
outline: [2, 3]
---

# Chromatic 云端方案

> 基于 Chromatic CLI 17.5 / `@chromatic-com/storybook` 5.2 编写

## 速查

- **出品方**：Storybook 团队；**story = 测试用例**，Chromatic 自动把每个 story 转成测试
- **一跑出三类测试**：单次运行同时做**视觉**（外观）+ **交互**（story 的 play 函数）+ **可访问性**（跑 axe）
- **基线托管 + 签核**：基线在云端，评审界面逐快照 **Accept / Deny**，区分「改进 vs 回归」，支持 UI Review 团队签核
- **TurboSnap 增量**：靠 **Webpack/Vite 依赖图** + Git diff 只拍受影响 story；开关 `--only-changed` / `onlyChanged: true`；跳过的快照按常规 **1/5 计费**
- **modes 多端**：`.storybook/modes.ts` 定义多视口/主题，**每个 mode 名 = 一条独立基线 + 独立签核**
- **CI**：`chromaui/action` + `projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}`；checkout 必须 `fetch-depth: 0`（TurboSnap 需完整 Git 历史）
- **`@chromatic-com/storybook` addon**：Storybook 内的 Visual Tests 面板入口，拍照/比对/基线托管都在云端，需 token
- **本项目现状**：`packages/ui` 已装 addon，**只差 token + CI workflow** 就能真正跑

## story 即测试

Chromatic 由 **Storybook 团队**（"the team behind Storybook"）出品。它的核心思路：Storybook 的每个 **story 已经捕获了一个组件状态**，那就直接**把每个 story 当成一个测试用例**——无需再单独写视觉测试代码。

更进一步，**单次 Chromatic 运行同时产出三类测试**：

- **视觉测试**：story 渲染图与基线像素 diff，抓外观变化。
- **交互测试**：执行 story 的 **play 函数**（模拟点击/输入），验证交互行为。
- **可访问性测试**：对 story 跑 **axe**，扫无障碍问题。

::: tip 不是「只做视觉」
常见误解是 Chromatic = 纯视觉回归。实际一跑就把**视觉 + 交互（play）+ a11y（axe）**三件事一起做了，story 写得好，三类覆盖一起拿。
:::

## 基线评审与签核

- 基线**托管在 Chromatic 云端**，不入仓库。
- 出现 diff 后，评审界面**逐快照 Accept / Deny**：Accept = 这是预期改进，更新基线；Deny = 这是回归，打回。
- 区分「改进」与「回归」由人判断；支持 **UI Review** 让团队成员签核与讨论某次 PR 的全部视觉变化。

## TurboSnap：Git 感知的增量快照

全量拍每个 story 在大型组件库里很贵。**TurboSnap** 只对「这次改动可能影响到的 story」拍照，其余从上次基线复制。

**启用方式**（三选一）：

- CLI：`chromatic --only-changed`
- 配置：`chromatic.config.json` 里 `"onlyChanged": true`
- GitHub Action：`with: onlyChanged: true`

**原理四步**：

1. 从 commit 历史定位**祖先构建**（baseline build）。
2. 比对 **Git 变更**（改了哪些文件）。
3. 查 **Webpack/Vite 依赖图**，定位这些文件**影响到哪些 story**。
4. 只对受影响 story（外加之前被 Deny 的）拍快照，未变的从上次基线复制。

::: warning TurboSnap 看的是依赖图，不是文件名
TurboSnap 判定「哪些 story 受影响」靠的是 **打包器依赖图 + Git diff**，而非简单看哪个文件名变了。改一个被很多组件 import 的工具文件，会牵连一大片 story。
:::

**会触发全量重建**的情况（无法增量）：`package.json` 的 version 改动且无有效 lockfile、Storybook 配置改动、`preview.js` 引入的文件改动、static 目录改动、`--externals` 指定文件改动、`--force-rebuild`、基础设施/浏览器升级。

- `--externals`：声明 Webpack 之外处理的文件（如 `*.sass`、`public/**`），它们改动时触发全量。
- **局限**：对 merge / rebase 提交保守处理，可能多拍。**被 TurboSnap 跳过的快照按常规快照的 1/5 计费**。

## modes：多视口 / 多主题

同一个 story 常要在「手机 + 暗色」「桌面 + 亮色」等多组合下都验。Chromatic 用 **modes** 表达：

```ts
// .storybook/modes.ts
export const allModes = {
  mobile: { viewport: "small" },
  "dark desktop": { theme: "dark", viewport: "large" },
};
```

```ts
// Button.stories.ts —— 在 story 里引用 modes
import { allModes } from "../.storybook/modes";

export const Primary = {
  parameters: {
    chromatic: {
      modes: {
        mobile: allModes["mobile"],
        "dark desktop": allModes["dark desktop"],
      },
    },
  },
};
```

::: warning 每个 mode 名 = 一条独立基线 + 独立签核
Chromatic **按 mode 名（而非底层 viewport/theme 值）区分基线**。`mobile` 和 `dark desktop` 各有自己的基线和签核记录。**改 mode 名 = 新建一条基线**（旧名的基线被废弃）。可在 project / component / story 层叠加 modes，用 `disable: true` 关掉上层继承下来的某个 mode。
:::

## CI 集成（GitHub Actions）

```yaml
# .github/workflows/chromatic.yml
name: "Chromatic"
on: push
jobs:
  chromatic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
        with: { fetch-depth: 0 } # TurboSnap 需完整 Git 历史
      - uses: actions/setup-node@v6
      - run: npm ci
      - uses: chromaui/action@latest
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          onlyChanged: true # 开 TurboSnap
```

要点：

- 用官方 **`chromaui/action`**，必填 `projectToken`，走 **`CHROMATIC_PROJECT_TOKEN`** secret（在 Chromatic 项目设置里拿，**绝不硬编码进仓库**）。
- **`actions/checkout` 必须配 `fetch-depth: 0`**：TurboSnap 要完整 Git 历史定位祖先构建，浅克隆会让它失效。

## `@chromatic-com/storybook` addon

官方 **Visual Tests addon**，把 Chromatic 的入口搬进 Storybook 界面：

```bash
npx storybook@latest add @chromatic-com/storybook
```

装好后 Storybook 内多出 **Visual Tests 面板**：点 ▶️ 把当前 story 送云端拍照、面板里直接看像素 diff、点 Accept 更新基线——本地开发时就能跑视觉测试，不必等 CI。

::: warning addon 只是入口，拍照/托管都在云端
**`@chromatic-com/storybook` 本身不在本地做像素 diff。** 它是 Storybook 内调用 Chromatic 的面板，真正的拍照、比对、基线托管都在 **Chromatic 云端**，因此**仍需 project token**。装了 addon 但没配 token，等于有按钮没接电——跑不起来。
:::

::: tip 本项目接 Chromatic 只差两步
`packages/ui` 已装 `@chromatic-com/storybook` addon、有 Storybook 与 stories。要让 Chromatic 真正跑起来，**只差**：① 在 Chromatic 创建项目拿 `CHROMATIC_PROJECT_TOKEN`（存进 CI secret 与本地 `.env`）；② 加上面那段 `chromaui/action` 的 workflow。addon 已就位，无需改组件代码。
:::

## 下一步

- [Playwright 视觉对比](./playwright-visual.md)：不想接云时的本地免费路线
- [其它工具对照](./tools-comparison.md)：Chromatic 与 Percy/Applitools/BackstopJS 的定位差异
- [Vue 实战与最佳实践](./best-practices.md)：何时把视觉测试纳入 CI、基线托管 vs 入库的取舍
