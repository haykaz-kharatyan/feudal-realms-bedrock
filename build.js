import esbuild from "esbuild";
import { existsSync, mkdirSync } from "fs";

console.log("[Build] Compiling TypeScript scripts for Bedrock...");

try {
  await esbuild.build({
    entryPoints: ["behavior_pack/scripts/main.ts"],
    bundle: true,
    format: "esm",
    target: "es2020",
    outfile: "behavior_pack/scripts/main.js",
    external: ["@minecraft/server", "@minecraft/server-ui"],
    platform: "neutral",
    logLevel: "info"
  });

  console.log("[Build] Successfully compiled behavior_pack/scripts/main.js");
} catch (err) {
  console.error("[Build] Error compiling scripts:", err);
  process.exit(1);
}
