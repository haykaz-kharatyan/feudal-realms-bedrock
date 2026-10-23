import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const archiver = require("archiver");

console.log("==========================================");
console.log("Building and Packaging Feudal Realms Addon");
console.log("==========================================\n");

// 1. Build scripts
console.log("[1/3] Compiling TypeScript scripts...");
execSync("node build.js", { stdio: "inherit" });

// 2. Validate
console.log("\n[2/3] Validating Bedrock schemas...");
execSync("node validate_addon.js", { stdio: "inherit" });

// 3. Create packages with archiver (guaranteed forward-slashes and valid zip headers)
console.log("\n[3/3] Creating distribution archives (.mcpack & .mcaddon)...");

const outDir = path.resolve(".");
const mcaddonPath = path.join(outDir, "feudal_realms.mcaddon");
const bpPackPath = path.join(outDir, "feudal_realms_bp.mcpack");
const rpPackPath = path.join(outDir, "feudal_realms_rp.mcpack");

// Remove older archives if present
for (const f of [mcaddonPath, bpPackPath, rpPackPath]) {
  if (fs.existsSync(f)) fs.unlinkSync(f);
}

function zipDirectory(sourceDir, outPath, filterFn) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outPath);
    const archive = new archiver.ZipArchive({ zlib: { level: 9 } });

    output.on("close", () => {
      console.log(`  [Created] ${outPath} (${archive.pointer()} bytes)`);
      resolve();
    });
    archive.on("error", (err) => reject(err));

    archive.pipe(output);

    function addDirRecursive(currentDir, relativePrefix = "") {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        const relPath = relativePrefix ? `${relativePrefix}/${entry.name}` : entry.name;
        if (filterFn && !filterFn(fullPath, entry.name, relPath)) {
          continue;
        }
        if (entry.isDirectory()) {
          addDirRecursive(fullPath, relPath);
        } else if (entry.isFile()) {
          archive.file(fullPath, { name: relPath.replace(/\\/g, "/") });
        }
      }
    }

    addDirRecursive(sourceDir);
    archive.finalize();
  });
}

function zipFiles(files, outPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outPath);
    const archive = new archiver.ZipArchive({ zlib: { level: 9 } });

    output.on("close", () => {
      console.log(`  [Created] ${outPath} (${archive.pointer()} bytes)`);
      resolve();
    });
    archive.on("error", (err) => reject(err));

    archive.pipe(output);
    for (const f of files) {
      archive.file(f.source, { name: f.name.replace(/\\/g, "/") });
    }
    archive.finalize();
  });
}

async function run() {
  // 3a. Pack Behavior Pack (exclude .ts source files, only include main.js)
  await zipDirectory("behavior_pack", bpPackPath, (fullPath, name, relPath) => {
    if (name.endsWith(".ts")) return false;
    return true;
  });

  // 3b. Pack Resource Pack
  await zipDirectory("resource_pack", rpPackPath);

  // 3c. Pack combined .mcaddon containing the two .mcpack files
  await zipFiles(
    [
      { source: bpPackPath, name: "feudal_realms_bp.mcpack" },
      { source: rpPackPath, name: "feudal_realms_rp.mcpack" }
    ],
    mcaddonPath
  );

  console.log("\n==========================================");
  console.log("SUCCESS! All Bedrock packages are compliant with Minecraft standards.");
  console.log("==========================================");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
