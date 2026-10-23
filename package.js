import { execSync } from "child_process";
import fs from "fs";
import path from "path";

console.log("==========================================");
console.log("Building and Packaging Feudal Realms Addon");
console.log("==========================================\n");

// 1. Build scripts
console.log("[1/4] Compiling TypeScript scripts...");
execSync("node build.js", { stdio: "inherit" });

// 2. Generate textures
console.log("\n[2/4] Generating pixel-art textures & icons...");
execSync("node generate_textures.js", { stdio: "inherit" });

// 3. Validate
console.log("\n[3/4] Validating Bedrock schemas...");
execSync("node validate_addon.js", { stdio: "inherit" });

// 4. Create packages
console.log("\n[4/4] Creating distribution archives (.mcaddon & .mcpack)...");

const outDir = path.resolve(".");
const mcaddonPath = path.join(outDir, "feudal_realms.mcaddon");
const bpPackPath = path.join(outDir, "feudal_realms_bp.mcpack");
const rpPackPath = path.join(outDir, "feudal_realms_rp.mcpack");

// Remove older archives if present
for (const f of [mcaddonPath, bpPackPath, rpPackPath]) {
  if (fs.existsSync(f)) fs.unlinkSync(f);
}

// 4a. Package combined .mcaddon
execSync(
  `powershell -Command "Compress-Archive -Path 'behavior_pack', 'resource_pack' -DestinationPath 'temp_addon.zip' -Force; Move-Item -Path 'temp_addon.zip' -Destination 'feudal_realms.mcaddon' -Force"`,
  { stdio: "inherit" }
);
console.log(`  [Created] ${mcaddonPath}`);

// 4b. Package behavior_pack .mcpack
execSync(
  `powershell -Command "Compress-Archive -Path 'behavior_pack\\*' -DestinationPath 'temp_bp.zip' -Force; Move-Item -Path 'temp_bp.zip' -Destination 'feudal_realms_bp.mcpack' -Force"`,
  { stdio: "inherit" }
);
console.log(`  [Created] ${bpPackPath}`);

// 4c. Package resource_pack .mcpack
execSync(
  `powershell -Command "Compress-Archive -Path 'resource_pack\\*' -DestinationPath 'temp_rp.zip' -Force; Move-Item -Path 'temp_rp.zip' -Destination 'feudal_realms_rp.mcpack' -Force"`,
  { stdio: "inherit" }
);
console.log(`  [Created] ${rpPackPath}`);

console.log("\n==========================================");
console.log("SUCCESS! All Bedrock packages are ready for Android/Windows import.");
console.log("==========================================");
