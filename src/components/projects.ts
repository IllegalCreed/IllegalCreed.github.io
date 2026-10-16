export type Locale = "en" | "zh";

export type ProjectLink = {
  href: string;
  label: Record<Locale, string>;
};

export type ShowcaseProject = {
  id: string;
  image: string;
  imageAlt: Record<Locale, string>;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  links: ProjectLink[];
};

const site = (href: string): ProjectLink => ({
  href,
  label: { en: "Live site", zh: "在线体验" },
});

const repo = (href: string): ProjectLink => ({
  href,
  label: { en: "Repository", zh: "仓库" },
});

/**
 * Homepage cards. Descriptions follow each public README and do not add
 * features or counts that the README does not state.
 */
export const showcaseProjects: ShowcaseProject[] = [
  {
    id: "type-pal",
    image: "/projects/type-pal.png",
    imageAlt: {
      en: "type-pal editor with an in-editor play preview",
      zh: "type-pal 编辑器与编辑器内试玩",
    },
    title: { en: "type-pal", zh: "type-pal" },
    description: {
      en: "A from-scratch TypeScript remake of Chinese Paladin (1995). It can be finished in the browser and includes a visual editor. Unofficial fan project.",
      zh: "用 TypeScript 从零重写《仙剑奇侠传》（1995）。浏览器里可以通关，并带可视化编辑器。非官方同人。",
    },
    links: [
      {
        href: "https://pal.illegalscreed.cn/",
        label: { en: "Play", zh: "在线试玩" },
      },
      repo("https://github.com/IllegalCreed/type-pal"),
    ],
  },
  {
    id: "algorithm-visualizer",
    image: "/projects/algorithm-visualizer.png",
    imageAlt: {
      en: "Algorithm Visualizer bubble sort lesson",
      zh: "算法可视化冒泡排序页面",
    },
    title: { en: "Algorithm Visualizer", zh: "算法可视化" },
    description: {
      en: "92 data-structure and algorithm entries in nine categories. 77 algorithm pages step through in sync with TypeScript, Python, Go, and Rust.",
      zh: "九大类 92 个数据结构与算法条目。77 个算法页可逐步回放，并与 TypeScript、Python、Go、Rust 代码逐行同步高亮。",
    },
    links: [
      site("https://algo.illegalscreed.cn/"),
      repo("https://github.com/IllegalCreed/algorithms-visualization"),
    ],
  },
  {
    id: "llm-sanguo",
    image: "/projects/llm-sanguo.png",
    imageAlt: {
      en: "LLM Sanguo preview: Romance of the Three Kingdoms officers beside model benchmarks",
      zh: "大模型三国志：武将立绘与模型评测对照",
    },
    title: { en: "LLM Sanguo", zh: "大模型三国志" },
    description: {
      en: "Maps Romance of the Three Kingdoms 14 officer stats for 1,180 officers onto an Artificial Analysis snapshot from 2026-10-10. The romance edition currently seats 102.",
      zh: "把《三国志14》1180 名武将的五维，和 Artificial Analysis 2026-10-10 的模型评测快照，用加权映射对到一起。演义版现编排 102 席。",
    },
    links: [
      site("https://illegalcreed.github.io/llm-sanguo/"),
      repo("https://github.com/IllegalCreed/llm-sanguo"),
    ],
  },
  {
    id: "agent-doc-architecture",
    image: "/projects/agent-doc-architecture.png",
    imageAlt: {
      en: "agent-doc-architecture project cover",
      zh: "agent-doc-architecture 项目封面",
    },
    title: { en: "agent-doc-architecture", zh: "Agent-first 文档分层" },
    description: {
      en: "How large projects can organize docs when the agent is the first reader, and the doc set is a routing system for agents. Four blog posts, plus the agent-first-docs skill with doc-lint and templates.",
      zh: "大型项目如何组织文档：文档的第一读者是 Agent，文档体系是给 Agent 用的路由系统。含 4 篇博客，以及带 doc-lint 和模板的 agent-first-docs skill。",
    },
    links: [repo("https://github.com/IllegalCreed/agent-doc-architecture")],
  },
  {
    id: "skyfire-1943",
    image: "/projects/skyfire-1943.webp",
    imageAlt: {
      en: "skyfire-1943 chase view during the Dawn Raid mission",
      zh: "skyfire-1943 破晓突袭追尾战斗画面",
    },
    title: { en: "skyfire-1943", zh: "skyfire-1943" },
    description: {
      en: "An original three-view shooter: Salamander-style side scrolling, 1943-style top-down, and a pseudo-3D chase. It does not use the originals' ROMs, art, music, or stages, and it is drawn in Godot 4.",
      zh: "原创三视角射击原型：横版致敬沙罗曼蛇，俯视致敬 1943，追尾是伪 3D。不使用原作 ROM、图像、音乐或关卡，用 Godot 4 的 2D 绘制实现。",
    },
    links: [repo("https://github.com/IllegalCreed/skyfire-1943")],
  },
  {
    id: "ai-network-guard",
    image: "/projects/ai-network-guard.png",
    imageAlt: {
      en: "AI Network Guard app icon",
      zh: "AI网络护航应用图标",
    },
    title: { en: "AI Network Guard", zh: "AI网络护航" },
    description: {
      en: "A macOS menu-bar monitor for mainland China networks. It checks exit IP, DNS, and WebRTC for Claude Code, ChatGPT, and other overseas AI agents.",
      zh: "面向中国大陆网络环境的 macOS 菜单栏工具，检查 Claude Code、ChatGPT 和其他境外 AI Agent 的出口、DNS 与 WebRTC。",
    },
    links: [repo("https://github.com/IllegalCreed/ai-network-guard")],
  },
  {
    id: "content-studio",
    image: "/projects/content-studio.webp",
    imageAlt: {
      en: "Content Studio workbench overview, green and black",
      zh: "Content Studio 工作台总览，绿黑界面",
    },
    title: { en: "content-studio", zh: "content-studio" },
    description: {
      en: "A local-first toolkit for cross-project content and video. It compiles a manifest and campaign brief into channel packages, then records with Playwright and composes with local FFmpeg.",
      zh: "本地优先的跨项目内容生产工具。把项目清单和活动简报编译成渠道内容包，并用 Playwright 与本地 FFmpeg 完成录制和合成。",
    },
    links: [repo("https://github.com/IllegalCreed/content-studio")],
  },
  {
    id: "marketing-ops",
    image: "/projects/marketing-ops.png",
    imageAlt: {
      en: "marketing-ops project cover",
      zh: "marketing-ops 项目封面",
    },
    title: { en: "marketing-ops", zh: "marketing-ops" },
    description: {
      en: "A local, credential-isolated plugin for multi-channel campaigns. Platform secrets stay in the macOS Keychain. GitHub, Bluesky, DEV, and Mastodon can publish; Weibo is read-only diagnostics.",
      zh: "凭据隔离的本地多渠道投放插件。平台密钥放在 macOS Keychain；GitHub、Bluesky、DEV、Mastodon 可写，微博目前只有只读诊断。",
    },
    links: [repo("https://github.com/IllegalCreed/marketing-ops")],
  },
  {
    id: "lumideck",
    image: "/projects/slide-agent.png",
    imageAlt: {
      en: "LumiDeck slide agent login screen",
      zh: "LumiDeck 幻灯片 Agent 登录页面",
    },
    title: { en: "LumiDeck", zh: "LumiDeck" },
    description: {
      en: "A browser workspace for creating and managing slide decks, with an agent-oriented workflow behind the editor. The public entry starts at the login screen.",
      zh: "浏览器里的幻灯片创作项目，围绕编辑器、Deck 管理和 Agent 工作流。公开入口从登录页进入工作区。",
    },
    links: [
      {
        href: "https://lumideck.illegalscreed.cn/",
        label: { en: "Open site", zh: "打开站点" },
      },
      repo("https://github.com/IllegalCreed/big-ppt"),
    ],
  },
  {
    id: "quiz",
    image: "/projects/programmer-quiz.png",
    imageAlt: {
      en: "IllegalCreed Quiz developer question page",
      zh: "IllegalCreed Quiz 程序员问答页面",
    },
    title: { en: "IllegalCreed Quiz", zh: "IllegalCreed Quiz" },
    description: {
      en: "Turns the roadmap into developer questions by topic and difficulty, then uses the feedback for deliberate review.",
      zh: "把路线图里的知识点转换成按主题和难度组织的程序员问答，用来直接做题和复盘。",
    },
    links: [
      {
        href: "https://quiz.illegalscreed.cn/",
        label: { en: "Open site", zh: "打开站点" },
      },
      repo("https://github.com/IllegalCreed/Quiz-monorepo"),
    ],
  },
];
