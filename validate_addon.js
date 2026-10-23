import fs from "fs";
import path from "path";

console.log("[Validator] Starting comprehensive Bedrock addon validation...\n");

let errors = 0;
let warnings = 0;
let filesChecked = 0;

function checkJson(filePath) {
  filesChecked++;
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    JSON.parse(raw);
    console.log(`  [OK] JSON: ${filePath}`);
    return true;
  } catch (err) {
    errors++;
    console.error(`  [ERROR] Invalid JSON in ${filePath}: ${err.message}`);
    return false;
  }
}

function checkFileExists(filePath, desc) {
  filesChecked++;
  if (fs.existsSync(filePath)) {
    console.log(`  [OK] File exists: ${filePath} (${desc})`);
    return true;
  } else {
    errors++;
    console.error(`  [ERROR] Missing required file: ${filePath} (${desc})`);
    return false;
  }
}

// 1. Manifests
checkJson("behavior_pack/manifest.json");
checkJson("resource_pack/manifest.json");
checkFileExists("behavior_pack/scripts/main.js", "Compiled script bundle");

// 2. Behavior Pack Entities
const bpEntities = [
  "advisor", "city_guard", "bandit_leader",
  "miner", "lumberjack", "blacksmith", "merchant", "farmer", "lamplighter",
  "cartographer", "colonist", "siege_ram",
  "ballista", "catapult", "royal_knight"
];
for (const e of bpEntities) {
  checkJson(`behavior_pack/entities/${e}.json`);
}

// 3. Blocks, Items, Loot Tables
checkJson("behavior_pack/blocks/throne.json");
checkJson("behavior_pack/blocks/boundary_stone.json");
checkJson("behavior_pack/items/bandit_head.json");
checkJson("behavior_pack/items/realm_map.json");
checkJson("behavior_pack/items/war_horn.json");
checkJson("behavior_pack/items/commander_banner.json");
checkJson("behavior_pack/recipes/throne.json");
checkJson("behavior_pack/recipes/commander_banner.json");
checkJson("behavior_pack/recipes/war_horn.json");
checkJson("behavior_pack/recipes/realm_map.json");
checkJson("behavior_pack/loot_tables/entities/bandit_leader.json");

// 4. Resource Pack Client Entities
const rpEntities = [
  "feudal_ruler", "advisor", "city_guard", "bandit_leader",
  "miner", "lumberjack", "blacksmith", "merchant", "farmer", "lamplighter",
  "cartographer", "colonist", "siege_ram",
  "ballista", "catapult", "royal_knight"
];
for (const e of rpEntities) {
  checkJson(`resource_pack/entity/${e}.entity.json`);
}

// 5. 3D Models (.geo.json)
const models = [
  "feudal_ruler", "heraldic_banner", "bandit_head", "bandit_leader", "city_guard", "throne",
  "miner", "lumberjack", "blacksmith", "merchant", "farmer", "lamplighter",
  "cartographer", "colonist", "siege_ram", "boundary_stone",
  "ballista", "catapult", "royal_knight"
];
for (const m of models) {
  checkJson(`resource_pack/models/entity/${m}.geo.json`);
}

// 6. Textures
const textures = [
  "feudal_ruler", "bandit_leader", "city_guard", "advisor", "heraldic_banner",
  "miner", "lumberjack", "blacksmith", "merchant", "farmer", "lamplighter",
  "cartographer", "colonist", "siege_ram",
  "ballista", "catapult", "royal_knight"
];
for (const t of textures) {
  checkFileExists(`resource_pack/textures/entity/${t}.png`, `${t} texture`);
}
checkFileExists("resource_pack/textures/items/bandit_head.png", "Bandit head icon");
checkFileExists("resource_pack/textures/items/realm_map.png", "Realm map icon");
checkFileExists("resource_pack/textures/items/war_horn.png", "War horn icon");
checkFileExists("resource_pack/textures/items/commander_banner.png", "Commander banner icon");
checkFileExists("resource_pack/textures/blocks/throne.png", "Throne block texture");
checkFileExists("resource_pack/textures/blocks/boundary_stone.png", "Boundary stone texture");
checkFileExists("resource_pack/pack_icon.png", "RP pack icon");
checkFileExists("behavior_pack/pack_icon.png", "BP pack icon");

// 7. Mapping and Localization
checkJson("resource_pack/render_controllers/feudal_ruler.render_controllers.json");
checkJson("resource_pack/textures/item_texture.json");
checkJson("resource_pack/textures/terrain_texture.json");
checkJson("resource_pack/texts/languages.json");
checkFileExists("resource_pack/texts/ru_RU.lang", "Russian lang");
checkFileExists("resource_pack/texts/en_US.lang", "English lang");

console.log("\n==========================================");
console.log(`Validation finished: ${filesChecked} files checked.`);
console.log(`Errors: ${errors}, Warnings: ${warnings}`);
console.log("==========================================");

if (errors > 0) {
  process.exit(1);
} else {
  console.log("[Validator] All Bedrock schemas and files passed validation successfully!");
}
