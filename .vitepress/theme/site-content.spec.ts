import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import siteConfig from "../config.mts";
import homeEn from "../../src/index.md?raw";
import homeZh from "../../src/zh/index.md?raw";
import cvZh from "../../src/zh/CV.md?raw";
import { showcaseProjects } from "../../src/components/projects";

type SidebarItem = {
  text?: string;
  collapsed?: boolean;
  items?: SidebarItem[];
};

const zhSidebar = siteConfig.locales?.zh?.themeConfig?.sidebar as unknown as SidebarItem[];

describe("个人站主页项目导览", () => {
  it("中英文主页都挂上同一套项目卡片，并把仙剑入口写成 type-pal", () => {
    expect(homeEn).toContain('<ProjectShowcase locale="en" />');
    expect(homeZh).toContain('<ProjectShowcase locale="zh" />');
    expect(homeEn).toContain("type-pal");
    expect(homeZh).toContain("type-pal");
    expect(homeEn).not.toContain("WebPal");
    expect(homeZh).not.toContain("WebPal");
  });

  it("卡片覆盖公开项目、可解析的图片，以及仓库或站点链接", () => {
    expect(showcaseProjects.map((project) => project.id)).toEqual([
      "type-pal",
      "algorithm-visualizer",
      "llm-sanguo",
      "agent-doc-architecture",
      "skyfire-1943",
      "ai-network-guard",
      "content-studio",
      "marketing-ops",
      "lumideck",
      "quiz",
    ]);

    const byId = Object.fromEntries(
      showcaseProjects.map((project) => [project.id, project]),
    );

    expect(byId["type-pal"].links.map((link) => link.href)).toEqual([
      "https://pal.illegalscreed.cn/",
      "https://github.com/IllegalCreed/type-pal",
    ]);
    expect(byId["algorithm-visualizer"].links.map((link) => link.href)).toEqual([
      "https://algo.illegalscreed.cn/",
      "https://github.com/IllegalCreed/algorithms-visualization",
    ]);
    expect(byId["algorithm-visualizer"].description.en).toContain("92");
    expect(byId["algorithm-visualizer"].description.zh).toContain("92");
    expect(byId["llm-sanguo"].links.map((link) => link.href)).toContain(
      "https://illegalcreed.github.io/llm-sanguo/",
    );
    expect(byId["llm-sanguo"].links.map((link) => link.href)).toContain(
      "https://github.com/IllegalCreed/llm-sanguo",
    );
    expect(byId["skyfire-1943"].links.map((link) => link.href)).toEqual([
      "https://github.com/IllegalCreed/skyfire-1943",
    ]);

    for (const project of showcaseProjects) {
      expect(
        existsSync(
          fileURLToPath(
            new URL(
              `../../src/public${project.image}`,
              import.meta.url,
            ),
          ),
        ),
        project.image,
      ).toBe(true);
      expect(project.description.en.toLowerCase()).not.toContain("coming soon");
      expect(project.description.zh).not.toContain("私有");
      expect(project.description.zh).not.toContain("即将");
    }
  });

  it("中文简历的个人作品列入这些开源项目，并保留原有低代码平台", () => {
    for (const needle of [
      "https://github.com/IllegalCreed/type-pal",
      "2026-05",
      "https://github.com/IllegalCreed/algorithms-visualization",
      "https://algo.illegalscreed.cn/",
      "https://github.com/IllegalCreed/llm-sanguo",
      "https://github.com/IllegalCreed/agent-doc-architecture",
      "https://github.com/IllegalCreed/skyfire-1943",
      "2026-09",
      "https://github.com/IllegalCreed/ai-network-guard",
      "2026-08",
      "https://github.com/IllegalCreed/content-studio",
      "https://github.com/IllegalCreed/marketing-ops",
      "2026-07",
      "2026-10",
      "低代码平台",
    ]) {
      expect(cvZh).toContain(needle);
    }
    expect(cvZh).not.toContain("维持私有");
    expect(cvZh).not.toContain("coming soon");
  });
});

describe("中文侧边栏折叠层级", () => {
  it("所有一级目录展开，嵌套目录保持折叠", () => {
    const topLevelGroups = zhSidebar.filter((item) => item.items?.length);

    expect(topLevelGroups.length).toBeGreaterThan(0);
    expect(topLevelGroups.every((item) => item.collapsed === false)).toBe(true);
    expect(topLevelGroups.flatMap((item) => item.items ?? []).some((item) => item.collapsed === false)).toBe(false);
  });
});
