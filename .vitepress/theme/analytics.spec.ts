import { describe, expect, it } from "vitest";
import configSource from "../config.mts?raw";
import type { AnalyticsConsent } from "./consent";
import {
  PERSONAL_SITE_GA_MEASUREMENT_ID,
  sanitizePageViewUrl,
  startGoogleAnalytics,
} from "./analytics";

interface TestPage {
  path: string;
  title: string;
}

function createHarness(consent: AnalyticsConsent = "unset") {
  let currentConsent = consent;
  let consentListener: ((value: AnalyticsConsent) => void) | undefined;
  let pageListener: ((value: TestPage) => void) | undefined;

  const fakeWindow = {
    location: {
      origin: "https://illegalscreed.cn",
    },
  } as unknown as Window;
  const scripts: Array<Record<string, unknown>> = [];
  const fakeDocument = {
    head: {
      append(element: Record<string, unknown>) {
        scripts.push(element);
      },
    },
    createElement() {
      return {
        dataset: {},
      };
    },
    querySelector(selector: string) {
      if (selector !== "script[data-ga4-measurement-id]") return null;
      return scripts[0] ?? null;
    },
    querySelectorAll(selector: string) {
      if (selector !== "script[data-ga4-measurement-id]") return [];
      return scripts;
    },
  } as unknown as Document;

  startGoogleAnalytics({
    enabled: true,
    measurementId: PERSONAL_SITE_GA_MEASUREMENT_ID,
    window: fakeWindow,
    document: fakeDocument,
    readConsent: () => currentConsent,
    subscribeConsent: (listener) => {
      consentListener = listener;
      return () => {
        consentListener = undefined;
      };
    },
    readPage: () => ({
      path: "/zh/?utm_source=DEV&query=private#notes",
      title: "IllegalCreed",
    }),
    subscribePage: (listener) => {
      pageListener = listener;
      return () => {
        pageListener = undefined;
      };
    },
  });

  return {
    fakeDocument,
    fakeWindow,
    grant() {
      currentConsent = "granted";
      consentListener?.(currentConsent);
    },
    navigate(path: string) {
      pageListener?.({ path, title: "Next" });
    },
  };
}

function pageViewEventsFor(fakeWindow: Window): unknown[][] {
  return (
    (fakeWindow as unknown as { dataLayer?: unknown[][] }).dataLayer ?? []
  ).filter(
    (entry) => entry[0] === "event" && entry[1] === "page_view",
  );
}

describe("personal-site minimal analytics", () => {
  it("does not keep an unconditional analytics script in VitePress head", () => {
    expect(configSource).not.toContain("googletagmanager.com/gtag/js");
    expect(configSource).not.toContain("G-YZWQCNFFG3");
  });

  it("loads once only after consent and tracks pathname navigation", () => {
    const harness = createHarness();
    expect(
      harness.fakeDocument.querySelector("script[data-ga4-measurement-id]"),
    ).toBeNull();

    harness.grant();
    harness.grant();
    harness.navigate("/zh/about?query=private#profile");

    expect(
      harness.fakeDocument.querySelectorAll("script[data-ga4-measurement-id]"),
    ).toHaveLength(1);
    expect(pageViewEventsFor(harness.fakeWindow)).toHaveLength(2);
    expect(pageViewEventsFor(harness.fakeWindow)[1]?.[2]).toMatchObject({
      page_path: "/zh/about",
      page_location: "https://illegalscreed.cn/zh/about",
    });
  });

  it("removes arbitrary query and hash while preserving valid UTM", () => {
    expect(
      sanitizePageViewUrl(
        "/zh/?utm_source=DEV&utm_medium=Community&utm_campaign=Site-Launch&utm_content=Home&query=private#notes",
        "https://illegalscreed.cn",
      ),
    ).toBe(
      "https://illegalscreed.cn/zh/?utm_source=dev&utm_medium=community&utm_campaign=site-launch&utm_content=home",
    );
  });
});
