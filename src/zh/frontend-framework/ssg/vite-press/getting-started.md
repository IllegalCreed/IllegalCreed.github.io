---
layout: doc
---

# 入门

## 安装

```bash
pnpm add vue
pnpm add -D vitepress
```

### 初始化

```bash
pnpm vitepress init
```

### 配置文件

`.vitepress/config.js`

## 启动

```bash
pnpm run docs:dev
```

## 路由

采用基于文件结构的路由

### 根目录及源目录

```
.                          # 项目根目录
├─ .vitepress              # 配置目录
└─ src                     # 源目录
   ├─ getting-started.md
   └─ index.md
```

### 页面跳转
```md
[Getting Started](../guide/getting-started)
```