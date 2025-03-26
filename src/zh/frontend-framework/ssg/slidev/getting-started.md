---
layout: doc
---

# 入门

## 安装

```bash
pnpm create slidev
```

## 基本命令

- `slidev` - 启动开发服务器
- `slidev export` - 将幻灯片导出为 PDF、PPTX 或 PNG 文件
- `slidev build` - 将幻灯片构建为静态网页
- `slidev format` - 将幻灯片格式化
- `slidev --help` - 显示帮助信息

<br>

`package.json` 中的默认命令

```bash
{
  "scripts": {
    "dev": "slidev --open",
    "build": "slidev build",
    "export": "slidev export"
  }
}
```

## 编辑器插件

再 VSCode 插件市场 搜索 `Slidev`。

**特性：**

- 在侧边面板中预览幻灯片
- 幻灯片树形图
- 为幻灯片重新排序
- 幻灯片块的折叠
- 多幻灯片项目支持
- 一键启动开发服务器