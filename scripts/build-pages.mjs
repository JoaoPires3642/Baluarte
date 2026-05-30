import { cpSync, existsSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: process.platform === "win32" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run("npm", ["--prefix", "baluarte-next", "ci"]);
run("npm", ["--prefix", "baluarte-next", "run", "build:pages"]);

if (!existsSync("baluarte-next/.vercel/output/static")) {
  throw new Error("Cloudflare Pages output was not generated");
}

rmSync(".vercel", { recursive: true, force: true });
cpSync("baluarte-next/.vercel", ".vercel", { recursive: true });
