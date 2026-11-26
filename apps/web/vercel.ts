import { matchers, routes, type Transform, type VercelConfig } from "@vercel/config/v1";

const routerHost = process.env.VIBECODINGER_WEB_ROUTER_HOST;
const HOSTED_WEB_CHANNEL_COOKIE = "vibecodinger_web_channel";
const latestOrigin = process.env.VIBECODINGER_WEB_LATEST_ORIGIN;
const nightlyOrigin = process.env.VIBECODINGER_WEB_NIGHTLY_ORIGIN;
const CLEAN_CHANNEL_QUERY_TRANSFORMS = [
  {
    type: "request.query",
    op: "delete",
    target: { key: "channel" },
  },
] satisfies Transform[];

function channelCookie(channel: "latest" | "nightly"): string {
  return [
    `${HOSTED_WEB_CHANNEL_COOKIE}=${channel}`,
    "Path=/",
    "Max-Age=31536000",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
  ].join("; ");
}

export const config: VercelConfig = {
  buildCommand:
    'vp run --filter @vibecodinger/web build && node ../../scripts/apply-web-brand-assets.ts --channel "${VITE_HOSTED_APP_CHANNEL:-latest}"',
  git: {
    deploymentEnabled: false,
  },
  installCommand:
    "npm install -g vite-plus && vp install --ignore-scripts --filter '@vibecodinger/scripts...' --filter '@vibecodinger/web...'",
  routes:
    routerHost && latestOrigin && nightlyOrigin
      ? [
          {
            src: "/__vibecodinger/channel",
            has: [matchers.query("channel", "nightly")],
            transforms: CLEAN_CHANNEL_QUERY_TRANSFORMS,
            headers: {
              Location: "/",
              "Set-Cookie": channelCookie("nightly"),
            },
            status: 302,
          },
          {
            src: "/__vibecodinger/channel",
            transforms: CLEAN_CHANNEL_QUERY_TRANSFORMS,
            headers: {
              Location: "/",
              "Set-Cookie": channelCookie("latest"),
            },
            status: 302,
          },
          {
            src: "/(.*)",
            has: [matchers.host(routerHost), matchers.cookie(HOSTED_WEB_CHANNEL_COOKIE, "nightly")],
            dest: `${nightlyOrigin}/$1`,
          },
          {
            src: "/(.*)",
            has: [matchers.host(routerHost)],
            dest: `${latestOrigin}/$1`,
          },
        ]
      : [],
  rewrites: [routes.rewrite("/(.*)", "/index.html")],
};
