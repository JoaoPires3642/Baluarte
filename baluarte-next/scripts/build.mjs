import { spawnSync } from "node:child_process";

const isCloudflarePages = process.env.CF_PAGES === "1" || process.env.CF_PAGES === "true";
const isNextOnPagesInnerBuild = process.env.BALUARTE_NEXT_ON_PAGES_BUILD === "1";
const command = isCloudflarePages
  ? isNextOnPagesInnerBuild
    ? ["npx", ["next", "build"]]
    : ["npx", ["@cloudflare/next-on-pages@1.13.16"]]
  : ["npx", ["next", "build"]];

const result = spawnSync(command[0], command[1], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: isCloudflarePages && !isNextOnPagesInnerBuild
    ? { ...process.env, BALUARTE_NEXT_ON_PAGES_BUILD: "1" }
    : process.env,
});

process.exit(result.status ?? 1);
