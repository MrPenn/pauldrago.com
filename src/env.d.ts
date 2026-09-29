// Globals the site's own scripts read or set.
interface Navigator {
  // Global Privacy Control: true when the browser asks sites not to sell or share the visitor's data.
  globalPrivacyControl?: boolean;
}
interface Window {
  // Set by posthog.astro: the consent banner reports the visitor's analytics choice through it.
  setAnalyticsConsent?: (granted: boolean) => void;
}
interface Window {
  // Set by posthog.astro once the analytics snippet has run.
  posthog?: { capture: (event: string, properties?: Record<string, unknown>) => void };
  // Set by src/scripts/article-kit.ts: the /ui toolbar replays a figure or holds a sequence on one step.
  pdKit?: { replay: () => void; step: (n: number) => void; fit: () => void };
  // Set by the /ui frame: switch the frame's theme, and re-run the kit on a rebuilt figure.
  uiTheme?: (theme: string) => void;
  uiRefresh?: () => void;
}

// Cal.com's embed queue, set up by src/scripts/cal-booking.ts: calls made before the embed script
// arrives wait in q, and a namespace gets its own queue under ns.
type CalQueue = ((...args: unknown[]) => void) & { q: unknown[] };
type CalApi = CalQueue & { ns: Record<string, CalQueue>; config?: Record<string, unknown> };
declare var Cal: CalApi;
