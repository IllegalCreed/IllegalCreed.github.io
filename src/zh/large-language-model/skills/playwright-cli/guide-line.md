---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 microsoft/playwright-cli 的 skills/playwright-cli/SKILL.md 与 references/ 编写。

## 速查

- **skills 主文件**：`SKILL.md`——核心命令（Core/Navigation/Keyboard/Mouse/Save as/Tabs/Storage/Network/DevTools/Open params）+ 快速示例
- **3 个高频 reference**：element-attributes（属性定位）/ playwright-tests（测试调试）/ request-mocking（请求 mock）
- **token-efficient 三招**：① `snapshot` 取 YAML 而非整页 a11y tree；② `find` 搜索、`--depth=N` 限深、`snapshot <ref>` 取子树；③ `--raw` 剥 page status/code/snapshot metadata，便于管道与对比
- **会话化**：`-s=name` 隔离多项目；`PLAYWRIGHT_CLI_SESSION=xxx claude .` 给 agent 锁定会话
- **反模式**：别在 agent 上下文塞重 SDK 文档；别把整页 a11y tree 强读；别用 CLI 跑 Playwright 测试（测试用 `npx playwright test`，CLI 只做调试）
- **测试调试**：`npx playwright test --debug=cli` 打印 session 名 → `playwright-cli attach <session>` 接入探查
- **请求 mock**：`route <pattern>` 拦截、`unroute` 撤销；条件/改写/失败/延迟走 `run-code`

## skills/playwright-cli：CLI 的「大脑」

装 skills 后，agent 读 `skills/playwright-cli/SKILL.md`，里面是分门别类的命令清单 + 触发示例。它告诉 agent：

- **不该做什么**：不把整页 a11y tree 读进上下文，不无脑 `screenshot`（snapshot 更常用）
- **该做什么**：先 `open` → `snapshot` 拿 ref → 用 ref 交互 → 必要时 `--raw` 管道化

SKILL.md 里 `allowed-tools: Bash(playwright-cli:*) Bash(npx:*) Bash(npm:*)`——agent 通过 Bash 调 CLI，不需要额外的工具 schema。

## references：高频场景的展开说明

SKILL.md 主文件外，references 展开几类高频任务：

### element-attributes：snapshot 没显示的属性怎么取

snapshot 只暴露语义结构与 ref，`id` / `class` / `data-*` 等 DOM 属性不一定显示。用 `eval` 取：

```bash
playwright-cli snapshot
# snapshot 把按钮显示为 e7，但没 id/data 属性
playwright-cli eval "el => el.id" e7
playwright-cli eval "el => el.className" e7
playwright-cli eval "el => el.getAttribute('data-testid')" e7
playwright-cli eval "el => getComputedStyle(el).display" e7
```

适用：要写更稳的 selector、要核对 `aria-label`、要查计算样式时。

### playwright-tests：跑与调试测试

**测试用 `npx playwright test` 跑，不是 CLI**——CLI 是「测试之外」的浏览器自动化与调试入口。调试失败用例时：

```bash
# 1. 后台跑（--debug=cli 会在起点暂停，并打印 session 名）
PLAYWRIGHT_HTML_OPEN=never npx playwright test --debug=cli
# ...打印 "Debugging Instructions"，含 session 名（如 tw-abcdef）

# 2. 另开终端，attach 到那个 session 探查
playwright-cli attach tw-abcdef
```

attach 后每条 CLI 操作会同步生成对应 Playwright TypeScript 代码，可直接复制回测试。查清后停掉后台测试、改 spec、重跑验证。

### request-mocking：拦截 / mock / 改写 / 屏蔽

```bash
# 简单 mock
playwright-cli route "**/*.jpg" --status=404
playwright-cli route "**/api/users" --body='[{"id":1,"name":"Alice"}]' --content-type=application/json
playwright-cli route-list              # 列出活动 route
playwright-cli unroute "**/*.jpg"      # 撤销指定 route
playwright-cli unroute                 # 撤销全部
```

URL 模式语法：`**/api/users`（精确路径）· `**/api/*/details`（通配）· `**/*.{png,jpg,jpeg}`（扩展名）· `**/search?q=*`（query）。

**高级场景**走 `run-code`（条件响应、改写真实响应、模拟失败、延迟）：

```bash
# 根据请求体决定响应
playwright-cli run-code "async page => {
  await page.route('**/api/login', route => {
    const body = route.request().postDataJSON();
    if (body.username === 'admin') {
      route.fulfill({ body: JSON.stringify({ token: 'mock-token' }) });
    } else {
      route.fulfill({ status: 401, body: JSON.stringify({ error: 'Invalid' }) });
    }
  });
}"

# 改写真实响应
playwright-cli run-code "async page => {
  await page.route('**/api/user', async route => {
    const response = await route.fetch();
    const json = await response.json();
    json.isPremium = true;
    await route.fulfill({ response, json });
  });
}"

# 模拟网络失败（可选：connectionrefused/timedout/connectionreset/internetdisconnected）
playwright-cli run-code "async page => {
  await page.route('**/api/offline', route => route.abort('internetdisconnected'));
}"
```

## token-efficient 心智

CLI 的设计核心是「不强行把 page 数据灌进 LLM」。落实成 3 条心智：

1. **按需 snapshot**：默认每次命令后会给一段 snapshot；要更精细就 `snapshot <ref>`（子树）或 `snapshot --depth=N`（限深）
2. **搜索优先**：大页面用 `find "Add to cart"` / `find --regex "/sign (in|up)/i"` 直接定位节点，附 3 行上下文（类 `grep -C`），比抓全树再筛省得多
3. **`--raw` 管道化**：剥掉 page status / 生成代码 / snapshot metadata，只留结果值，便于 `| jq` 或对比 `diff before.yml after.yml`

```bash
# 取 performance timing 并计算
playwright-cli --raw eval "JSON.stringify(performance.timing)" \
  | jq '.loadEventEnd - .navigationStart'

# 抓全部链接后存盘
playwright-cli --raw eval "JSON.stringify([...document.querySelectorAll('a')].map(a => a.href))" \
  > links.json

# 前后对比 snapshot
playwright-cli --raw snapshot > before.yml
playwright-cli click e5
playwright-cli --raw snapshot > after.yml
diff before.yml after.yml
```

## 会话与多项目

```bash
playwright-cli -s=todo open https://demo.playwright.dev/todomvc/
playwright-cli -s=example open https://example.com --persistent
playwright-cli list                     # 列所有 session
playwright-cli -s=todo close            # 关指定 session
playwright-cli close-all                # 关所有
playwright-cli kill-all                 # 强杀所有浏览器进程

# 给 agent 锁一个 session
PLAYWRIGHT_CLI_SESSION=todo-app claude .
```

`--persistent` 把 profile 存盘跨重启保留；默认 profile 只在内存，浏览器关了就丢。

## 可视化：show Dashboard

```bash
playwright-cli show                # 网格化看所有 session 的实时预览
playwright-cli show --annotate     # 给 agent 做 UI review / design feedback
```

Dashboard 两视图：**session 网格**（按工作区分组、每个 session 带实时 screencast 预览、当前 URL/标题）+ **session 详情**（带 tab 栏、导航控件、可点进视口接管鼠标键盘，按 Escape 释放）。`--annotate` 模式下用户在页面上画框 + 写注释，agent 收到带标注的截图、被标区域的 snapshot 和用户笔记——适合「问用户想要什么」。

## 反模式

- **别在 agent 上下文塞重 SDK 文档**：CLI + skills 的意义就是省 token；让 agent 读 `playwright-cli --help` 自悟或读本地 SKILL.md，别把 Playwright SDK 全量 API 灌进去
- **别用 CLI 跑 Playwright 测试**：测试归 `npx playwright test`，CLI 用来在测试外做浏览器自动化 / 调试失败用例（`--debug=cli` + `attach`）
- **别无脑 screenshot**：snapshot 是常态，screenshot 是少数（视觉验证、UI review）
- **Windows 上 URL 含 `&` 要转义**：cmd.exe 用 `^&`、PowerShell 用 `--%`，否则 URL 在 `&` 处被截断
- **别把 CLI 当 MCP 用**：要持久状态 / 富内省 / 自治循环，用 Playwright MCP

## 下一步

- [参考](./reference) —— skills+references 清单、安装、核心命令分类、许可、链接
- 上游：[playwright.dev/agent-cli/skills](https://playwright.dev/agent-cli/skills)
