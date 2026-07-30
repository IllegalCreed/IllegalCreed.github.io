import { h } from "vue";
import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import AnalyticsConsent from "./AnalyticsConsent.vue";
import {
  PERSONAL_SITE_GA_MEASUREMENT_ID,
  startGoogleAnalytics,
} from "./analytics";
import {
  readAnalyticsConsent,
  subscribeAnalyticsConsent,
} from "./consent";

export default {
  extends: DefaultTheme,
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      "layout-bottom": () => h(AnalyticsConsent),
    }),
  enhanceApp({ router }) {
    if (typeof window === "undefined") return;

    startGoogleAnalytics({
      enabled: import.meta.env.PROD,
      measurementId: PERSONAL_SITE_GA_MEASUREMENT_ID,
      window,
      document,
      readConsent: readAnalyticsConsent,
      subscribeConsent: subscribeAnalyticsConsent,
      readPage: () => ({
        path: `${window.location.pathname}${window.location.search}${window.location.hash}`,
        title: document.title,
      }),
      subscribePage: (listener) => {
        const previousHandler = router.onAfterRouteChange;
        router.onAfterRouteChange = async (to) => {
          await previousHandler?.(to);
          listener({
            path: to,
            title: document.title,
          });
        };
        return () => {
          router.onAfterRouteChange = previousHandler;
        };
      },
    });
  },
} satisfies Theme;
