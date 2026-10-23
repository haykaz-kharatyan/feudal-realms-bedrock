// behavior_pack/scripts/main.ts
import { world as world20, system as system3 } from "@minecraft/server";

// behavior_pack/scripts/AdvisorUI.ts
import { ItemStack as ItemStack3 } from "@minecraft/server";
import { ActionFormData as ActionFormData5, ModalFormData as ModalFormData2, MessageFormData as MessageFormData4 } from "@minecraft/server-ui";

// behavior_pack/scripts/CityProgression.ts
import { world as world5 } from "@minecraft/server";

// behavior_pack/scripts/FactionManager.ts
import { world } from "@minecraft/server";
var FactionManager = class {
  static generateUniqueBanner(type) {
    const symbols = type === "village" ? this.villageSymbols : this.banditSymbols;
    let attempts = 0;
    while (attempts < 1e3) {
      attempts++;
      const base = this.colors[Math.floor(Math.random() * this.colors.length)];
      let patternCol = this.colors[Math.floor(Math.random() * this.colors.length)];
      while (patternCol === base) {
        patternCol = this.colors[Math.floor(Math.random() * this.colors.length)];
      }
      const pattern = this.patterns[Math.floor(Math.random() * this.patterns.length)];
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      const hash = `${base}_${patternCol}_${pattern}_${symbol}`;
      if (!this.registeredHashes.has(hash)) {
        this.registeredHashes.add(hash);
        return {
          baseColor: base,
          patternColor: patternCol,
          patternType: pattern,
          symbol,
          bannerHash: hash
        };
      }
    }
    throw new Error("\u0418\u0441\u0447\u0435\u0440\u043F\u0430\u043D \u043B\u0438\u043C\u0438\u0442 \u0443\u043D\u0438\u043A\u0430\u043B\u044C\u043D\u044B\u0445 \u0437\u043D\u0430\u043C\u0435\u043D");
  }
  static calculateTitle(vassalCount, cityTier) {
    if (vassalCount >= 13) return "\u0418\u043C\u043F\u0435\u0440\u0430\u0442\u043E\u0440";
    if (vassalCount >= 8) return "\u041A\u043E\u0440\u043E\u043B\u044C";
    if (vassalCount >= 5) return "\u0413\u0435\u0440\u0446\u043E\u0433";
    if (vassalCount >= 3) return "\u0413\u0440\u0430\u0444";
    if (vassalCount >= 2) return "\u0412\u0438\u043A\u043E\u043D\u0442";
    if (vassalCount === 1) return "\u0411\u0430\u0440\u043E\u043D";
    switch (cityTier) {
      case 1:
        return "\u0412\u043E\u0436\u0434\u044C";
      case 2:
        return "\u0421\u0442\u0430\u0440\u043E\u0441\u0442\u0430";
      case 3:
        return "\u0411\u0430\u0440\u043E\u043D";
      case 4:
        return "\u041C\u0430\u0440\u043A\u0438\u0437";
      case 5:
        return "\u0413\u0440\u0430\u0444";
      case 6:
        return "\u0413\u0435\u0440\u0446\u043E\u0433";
      case 7:
        return "\u0412\u0435\u043B\u0438\u043A\u0438\u0439 \u0413\u0435\u0440\u0446\u043E\u0433";
      default:
        return "\u0412\u043E\u0436\u0434\u044C";
    }
  }
  static registerFaction(faction) {
    this.factions.set(faction.id, faction);
    this.saveState();
  }
  static getFaction(id) {
    return this.factions.get(id);
  }
  static saveState() {
    world.setDynamicProperty("feudal_factions", JSON.stringify(Array.from(this.factions.entries())));
  }
};
FactionManager.registeredHashes = /* @__PURE__ */ new Set();
FactionManager.factions = /* @__PURE__ */ new Map();
FactionManager.colors = [
  "white",
  "orange",
  "magenta",
  "light_blue",
  "yellow",
  "lime",
  "pink",
  "gray",
  "light_gray",
  "cyan",
  "purple",
  "blue",
  "brown",
  "green",
  "red",
  "black"
];
FactionManager.patterns = [
  "diagonal",
  "half",
  "chevron",
  "cross",
  "border"
];
FactionManager.villageSymbols = [
  "crown",
  "greatsword",
  "wheat",
  "anvil",
  "tower",
  "shield",
  "stag",
  "oak",
  "scales"
];
FactionManager.banditSymbols = [
  "skull",
  "crossed_axes",
  "ravager_eye",
  "flame",
  "beartrap",
  "wolf_jaw",
  "dagger"
];

// behavior_pack/scripts/CastleArchitectureEngine.ts
import { world as world3 } from "@minecraft/server";

// behavior_pack/scripts/BuildingEngine.ts
import { world as world2, BlockPermutation } from "@minecraft/server";
var BuildingEngine = class {
  static startConstruction(dimensionId, origin, clearRadius, clearHeight, blueprint) {
    const taskId = `build_${Date.now()}_${Math.floor(Math.random() * 1e3)}`;
    const task = {
      id: taskId,
      dimensionId,
      origin,
      clearRadius,
      clearHeight,
      blueprint,
      currentBlockIndex: 0,
      isClearingDone: false
    };
    this.activeTasks.set(taskId, task);
    return taskId;
  }
  static processClearing(task, dim) {
    const { origin, clearRadius, clearHeight } = task;
    const r = Math.min(12, clearRadius);
    const h = Math.min(10, clearHeight);
    for (let x = -r; x <= r; x++) {
      for (let z = -r; z <= r; z++) {
        for (let y = 1; y <= h; y++) {
          try {
            const block = dim.getBlock({
              x: origin.x + x,
              y: origin.y + y,
              z: origin.z + z
            });
            if (block && !block.isAir) {
              block.setPermutation(BlockPermutation.resolve("minecraft:air"));
            }
          } catch {
          }
        }
      }
    }
    return true;
  }
  static tick() {
    for (const [id, task] of this.activeTasks.entries()) {
      const dim = world2.getDimension(task.dimensionId);
      if (!task.isClearingDone) {
        task.isClearingDone = this.processClearing(task, dim);
        continue;
      }
      const blocksPerTick = Math.max(20, Math.min(60, Math.floor(task.blueprint.length / 150)));
      for (let i = 0; i < blocksPerTick; i++) {
        if (task.currentBlockIndex >= task.blueprint.length) {
          this.activeTasks.delete(id);
          world2.sendMessage("[\u0421\u0442\u0440\u043E\u0438\u0442\u0435\u043B\u044C\u0441\u0442\u0432\u043E] \u041D\u043E\u0432\u043E\u0435 \u0437\u0434\u0430\u043D\u0438\u0435 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0432\u043E\u0437\u0432\u0435\u0434\u0435\u043D\u043E!");
          break;
        }
        const b = task.blueprint[task.currentBlockIndex];
        const targetPos = {
          x: task.origin.x + b.relX,
          y: task.origin.y + b.relY,
          z: task.origin.z + b.relZ
        };
        const block = dim.getBlock(targetPos);
        if (block) {
          try {
            block.setPermutation(BlockPermutation.resolve(b.blockType));
          } catch (e) {
            block.setPermutation(BlockPermutation.resolve("minecraft:cobblestone"));
          }
        }
        task.currentBlockIndex++;
      }
    }
  }
  static getStoneTowerBlueprint() {
    const blueprint = [];
    const height = 6;
    for (let y = 0; y < height; y++) {
      for (let x = -1; x <= 1; x++) {
        for (let z = -1; z <= 1; z++) {
          if (x === 0 && z === 0) continue;
          if (y < 2 && x === 0 && z === -1) continue;
          blueprint.push({
            relX: x,
            relY: y,
            relZ: z,
            blockType: y === 0 ? "minecraft:stone" : "minecraft:stone_bricks"
          });
        }
      }
    }
    const roofY = height;
    blueprint.push({ relX: -1, relY: roofY, relZ: -1, blockType: "minecraft:stone_brick_stairs" });
    blueprint.push({ relX: 1, relY: roofY, relZ: -1, blockType: "minecraft:stone_brick_stairs" });
    blueprint.push({ relX: -1, relY: roofY, relZ: 1, blockType: "minecraft:stone_brick_stairs" });
    blueprint.push({ relX: 1, relY: roofY, relZ: 1, blockType: "minecraft:stone_brick_stairs" });
    return blueprint;
  }
  /**
   * Generates a stone arched bridge with cobblestone walls and lanterns spanning across water.
   */
  static getArchedBridgeBlueprint(length = 12, isAxisX = true) {
    const blueprint = [];
    const width = 3;
    for (let step = 0; step < length; step++) {
      const archHeight = Math.floor(Math.sin(step / (length - 1) * Math.PI) * 2);
      for (let w = -1; w <= 1; w++) {
        const rx = isAxisX ? step : w;
        const rz = isAxisX ? w : step;
        blueprint.push({
          relX: rx,
          relY: archHeight,
          relZ: rz,
          blockType: "minecraft:stone_bricks"
        });
        for (let fy = archHeight - 1; fy >= -3; fy--) {
          blueprint.push({
            relX: rx,
            relY: fy,
            relZ: rz,
            blockType: "minecraft:cobblestone"
          });
        }
        if (w === -1 || w === 1) {
          blueprint.push({
            relX: rx,
            relY: archHeight + 1,
            relZ: rz,
            blockType: "minecraft:cobblestone_wall"
          });
          if (step % 4 === 0) {
            blueprint.push({
              relX: rx,
              relY: archHeight + 2,
              relZ: rz,
              blockType: "minecraft:lantern"
            });
          }
        }
      }
    }
    return blueprint;
  }
  /**
   * Generates a harbor dock blueprint for coastal maritime trade.
   */
  static getHarborDockBlueprint() {
    const blueprint = [];
    for (let x = 0; x < 8; x++) {
      for (let z = -2; z <= 2; z++) {
        blueprint.push({
          relX: x,
          relY: 0,
          relZ: z,
          blockType: "minecraft:spruce_planks"
        });
        blueprint.push({
          relX: x,
          relY: -1,
          relZ: z,
          blockType: "minecraft:spruce_log"
        });
      }
    }
    blueprint.push({ relX: 7, relY: 1, relZ: -2, blockType: "minecraft:spruce_fence" });
    blueprint.push({ relX: 7, relY: 2, relZ: -2, blockType: "minecraft:lantern" });
    blueprint.push({ relX: 7, relY: 1, relZ: 2, blockType: "minecraft:spruce_fence" });
    blueprint.push({ relX: 7, relY: 2, relZ: 2, blockType: "minecraft:lantern" });
    return blueprint;
  }
};
BuildingEngine.activeTasks = /* @__PURE__ */ new Map();

// behavior_pack/scripts/CastleArchitectureEngine.ts
var CastleArchitectureEngine = class {
  /**
   * Generates castle blueprints according to city tier or requested scale.
   * Origin (0, 0, 0) is the throne location on the floor.
   */
  static getCastleBlueprint(tier, forcedScale) {
    if (forcedScale === "\u041A\u043E\u043B\u043E\u0441\u0441\u0430\u043B\u044C\u043D\u044B\u0439 \u041A\u0440\u0435\u043C\u043B\u044C-\u0426\u0438\u0442\u0430\u0434\u0435\u043B\u044C (200x200)" /* GrandCitadel200x200 */ || tier >= 5 /* BigCity */) {
      return this.generateGrand200x200Citadel();
    }
    if (forcedScale === "\u0413\u0435\u0440\u0446\u043E\u0433\u0441\u043A\u0430\u044F \u043A\u0440\u0435\u043F\u043E\u0441\u0442\u044C (100x100)" /* DucalKeep */ || tier === 4 /* FortressCity */) {
      return this.generateDucalCitadel();
    }
    if (forcedScale === "\u041A\u043E\u043C\u043F\u0430\u043A\u0442\u043D\u0430\u044F \u0440\u0430\u0442\u0443\u0448\u0430 (35x35)" /* Compact */ || tier === 3 /* SmallTown */) {
      return this.generateBaronKeep();
    }
    if (tier === 2 /* Village */) {
      return this.generateVillageTownHall();
    }
    return this.generateChieftainLonghouse();
  }
  /**
   * =========================================================================
   * 200x200 MONUMENTAL MEDIEVAL CITADEL & HIGH DONJON PALACE COMPLEX
   * Features:
   * 1. Outer Fortress Curtain Walls (200x200 blocks, 4 blocks thick, battlements, walkways).
   * 2. 8 Giant Bastion Towers with wall-mounted ballista platforms.
   * 3. North & South Fortified Gatehouses with iron portcullises and murder-holes.
   * 4. Paved Royal Avenues with Chiseled Stone Lantern Posts.
   * 5. Middle Citadel Ward (100x100 blocks) with inner towers.
   * 6. Garrison Barracks and Royal Smithy / Foundry.
   * 7. The Great Donjon Throne Palace (50x50, 20 blocks high) with cathedral vaults,
   *    stained glass, colonnades, royal gold dais, treasury vault, and Imperial Throne!
   * =========================================================================
   */
  static generateGrand200x200Citadel() {
    const bp = [];
    const R = 96;
    const wallH = 7;
    for (let coord = -R; coord <= R; coord++) {
      const wallConfigs = [
        { isX: true, staticPos: -R },
        // North
        { isX: true, staticPos: R },
        // South
        { isX: false, staticPos: -R },
        // West
        { isX: false, staticPos: R }
        // East
      ];
      for (const w of wallConfigs) {
        if (w.isX && Math.abs(coord) <= 3) continue;
        for (let thick = -1; thick <= 1; thick++) {
          const rx = w.isX ? coord : w.staticPos + thick;
          const rz = w.isX ? w.staticPos + thick : coord;
          bp.push({ relX: rx, relY: -1, relZ: rz, blockType: "minecraft:cobblestone" });
          for (let y = 0; y < wallH; y++) {
            let blk = "minecraft:stone_bricks";
            if ((coord + y + thick) % 9 === 0) blk = "minecraft:mossy_stone_bricks";
            if (coord * y % 13 === 0) blk = "minecraft:cracked_stone_bricks";
            if (y === wallH - 1 && thick === -1) {
              blk = "minecraft:spruce_planks";
            }
            bp.push({ relX: rx, relY: y, relZ: rz, blockType: blk });
          }
          if (thick === 1) {
            if (Math.abs(coord) % 2 === 0) {
              bp.push({ relX: rx, relY: wallH, relZ: rz, blockType: "minecraft:stone_bricks" });
              bp.push({ relX: rx, relY: wallH + 1, relZ: rz, blockType: "minecraft:stone_brick_slab" });
            } else {
              bp.push({ relX: rx, relY: wallH, relZ: rz, blockType: "minecraft:cobblestone_wall" });
            }
          }
          if (thick === -1) {
            bp.push({ relX: rx, relY: wallH, relZ: rz, blockType: "minecraft:spruce_fence" });
            if (Math.abs(coord) % 10 === 0) {
              bp.push({ relX: rx, relY: wallH + 1, relZ: rz, blockType: "minecraft:lantern" });
            }
          }
        }
      }
    }
    const towerPoints = [
      { tx: -R, tz: -R },
      { tx: R, tz: -R },
      // North corners
      { tx: -R, tz: R },
      { tx: R, tz: R },
      // South corners
      { tx: 0, tz: -R },
      { tx: 0, tz: R },
      // North/South gate towers
      { tx: -R, tz: 0 },
      { tx: R, tz: 0 }
      // West/East flank bastions
    ];
    for (const t of towerPoints) {
      const bRad = 4;
      const bH = 12;
      for (let dx = -bRad; dx <= bRad; dx++) {
        for (let dz = -bRad; dz <= bRad; dz++) {
          const isEdge = dx === -bRad || dx === bRad || dz === -bRad || dz === bRad;
          bp.push({ relX: t.tx + dx, relY: -1, relZ: t.tz + dz, blockType: "minecraft:cobblestone" });
          for (let y = 0; y <= bH; y++) {
            if (isEdge || y === bH) {
              const blk = (dx + dz + y) % 7 === 0 ? "minecraft:mossy_stone_bricks" : "minecraft:stone_bricks";
              bp.push({ relX: t.tx + dx, relY: y, relZ: t.tz + dz, blockType: blk });
            }
          }
          if (isEdge) {
            if ((dx + dz) % 2 === 0) {
              bp.push({ relX: t.tx + dx, relY: bH + 1, relZ: t.tz + dz, blockType: "minecraft:stone_bricks" });
              bp.push({ relX: t.tx + dx, relY: bH + 2, relZ: t.tz + dz, blockType: "minecraft:stone_brick_slab" });
            } else {
              bp.push({ relX: t.tx + dx, relY: bH + 1, relZ: t.tz + dz, blockType: "minecraft:cobblestone_wall" });
            }
          }
        }
      }
      bp.push({ relX: t.tx - bRad, relY: bH + 2, relZ: t.tz - bRad, blockType: "minecraft:lantern" });
      bp.push({ relX: t.tx + bRad, relY: bH + 2, relZ: t.tz - bRad, blockType: "minecraft:lantern" });
      bp.push({ relX: t.tx - bRad, relY: bH + 2, relZ: t.tz + bRad, blockType: "minecraft:lantern" });
      bp.push({ relX: t.tx + bRad, relY: bH + 2, relZ: t.tz + bRad, blockType: "minecraft:lantern" });
      bp.push({ relX: t.tx, relY: bH + 1, relZ: t.tz, blockType: "minecraft:gold_block" });
    }
    for (const gz of [-R, R]) {
      for (let gx = -3; gx <= 3; gx++) {
        for (let gy = 1; gy <= 5; gy++) {
          if (Math.abs(gx) <= 2 && gy <= 4) {
            bp.push({ relX: gx, relY: gy, relZ: gz, blockType: "minecraft:iron_bars" });
          } else {
            bp.push({ relX: gx, relY: gy, relZ: gz, blockType: "minecraft:chiseled_stone_bricks" });
          }
        }
        bp.push({ relX: gx, relY: 6, relZ: gz, blockType: "minecraft:stone_brick_stairs" });
      }
    }
    for (let z = -R + 4; z <= R - 4; z++) {
      if (Math.abs(z) > 28) {
        for (let x = -2; x <= 2; x++) {
          const blk = Math.abs(x) === 2 ? "minecraft:chiseled_stone_bricks" : "minecraft:smooth_stone";
          bp.push({ relX: x, relY: 0, relZ: z, blockType: blk });
        }
        if (Math.abs(z) % 16 === 0) {
          bp.push({ relX: -3, relY: 1, relZ: z, blockType: "minecraft:chiseled_stone_bricks" });
          bp.push({ relX: -3, relY: 2, relZ: z, blockType: "minecraft:spruce_fence" });
          bp.push({ relX: -3, relY: 3, relZ: z, blockType: "minecraft:lantern" });
          bp.push({ relX: 3, relY: 1, relZ: z, blockType: "minecraft:chiseled_stone_bricks" });
          bp.push({ relX: 3, relY: 2, relZ: z, blockType: "minecraft:spruce_fence" });
          bp.push({ relX: 3, relY: 3, relZ: z, blockType: "minecraft:lantern" });
        }
      }
    }
    for (let x = -R + 4; x <= R - 4; x++) {
      if (Math.abs(x) > 28) {
        for (let z = -2; z <= 2; z++) {
          const blk = Math.abs(z) === 2 ? "minecraft:chiseled_stone_bricks" : "minecraft:smooth_stone";
          bp.push({ relX: x, relY: 0, relZ: z, blockType: blk });
        }
      }
    }
    for (let bx = -55; bx <= -35; bx++) {
      for (let bz = 35; bz <= 55; bz++) {
        const isBEdge = bx === -55 || bx === -35 || bz === 35 || bz === 55;
        bp.push({ relX: bx, relY: 0, relZ: bz, blockType: "minecraft:spruce_planks" });
        if (isBEdge) {
          for (let by = 1; by <= 4; by++) {
            bp.push({ relX: bx, relY: by, relZ: bz, blockType: "minecraft:stone_bricks" });
          }
        }
        bp.push({ relX: bx, relY: 5, relZ: bz, blockType: "minecraft:dark_oak_slab" });
      }
    }
    for (let fx = 35; fx <= 55; fx++) {
      for (let fz = 35; fz <= 55; fz++) {
        const isFEdge = fx === 35 || fx === 55 || fz === 35 || fz === 55;
        bp.push({ relX: fx, relY: 0, relZ: fz, blockType: "minecraft:stone_bricks" });
        if (isFEdge) {
          for (let fy = 1; fy <= 4; fy++) {
            bp.push({ relX: fx, relY: fy, relZ: fz, blockType: "minecraft:stone_bricks" });
          }
        }
        bp.push({ relX: fx, relY: 5, relZ: fz, blockType: "minecraft:dark_oak_slab" });
      }
    }
    bp.push({ relX: 45, relY: 1, relZ: 45, blockType: "minecraft:anvil" });
    bp.push({ relX: 46, relY: 1, relZ: 45, blockType: "minecraft:blast_furnace" });
    const midR = 48;
    for (let c = -midR; c <= midR; c++) {
      if (Math.abs(c) > 4) {
        bp.push({ relX: c, relY: 1, relZ: -midR, blockType: "minecraft:stone_bricks" });
        bp.push({ relX: c, relY: 2, relZ: -midR, blockType: "minecraft:stone_brick_slab" });
        bp.push({ relX: c, relY: 1, relZ: midR, blockType: "minecraft:stone_bricks" });
        bp.push({ relX: c, relY: 2, relZ: midR, blockType: "minecraft:stone_brick_slab" });
        bp.push({ relX: -midR, relY: 1, relZ: c, blockType: "minecraft:stone_bricks" });
        bp.push({ relX: -midR, relY: 2, relZ: c, blockType: "minecraft:stone_brick_slab" });
        bp.push({ relX: midR, relY: 1, relZ: c, blockType: "minecraft:stone_bricks" });
        bp.push({ relX: midR, relY: 2, relZ: c, blockType: "minecraft:stone_brick_slab" });
      }
    }
    const palR = 24;
    const palH = 15;
    for (let x = -palR; x <= palR; x++) {
      for (let z = -palR; z <= palR; z++) {
        bp.push({ relX: x, relY: -1, relZ: z, blockType: "minecraft:stone_bricks" });
        const floorBlk = Math.abs(x) <= 3 ? "minecraft:smooth_stone" : "minecraft:stone_bricks";
        bp.push({ relX: x, relY: 0, relZ: z, blockType: floorBlk });
      }
    }
    for (let y = 1; y <= palH; y++) {
      for (let x = -palR; x <= palR; x++) {
        for (let z = -palR; z <= palR; z++) {
          const isEdge = x === -palR || x === palR || z === -palR || z === palR;
          const isGrandPortal = z === palR && Math.abs(x) <= 3 && y <= 6;
          if (isGrandPortal) continue;
          if (isEdge) {
            if (y >= 5 && y <= 11 && (Math.abs(x) % 6 === 0 || Math.abs(z) % 6 === 0)) {
              bp.push({ relX: x, relY: y, relZ: z, blockType: "minecraft:glass_pane" });
            } else {
              bp.push({ relX: x, relY: y, relZ: z, blockType: "minecraft:stone_bricks" });
            }
          }
        }
      }
    }
    const donjonCorners = [
      { cx: -palR, cz: -palR },
      { cx: palR, cz: -palR },
      { cx: -palR, cz: palR },
      { cx: palR, cz: palR }
    ];
    for (const dc of donjonCorners) {
      for (let sy = palH + 1; sy <= palH + 7; sy++) {
        for (let dx = -1; dx <= 1; dx++) {
          for (let dz = -1; dz <= 1; dz++) {
            bp.push({ relX: dc.cx + dx, relY: sy, relZ: dc.cz + dz, blockType: "minecraft:stone_bricks" });
          }
        }
      }
      bp.push({ relX: dc.cx, relY: palH + 8, relZ: dc.cz, blockType: "minecraft:gold_block" });
      bp.push({ relX: dc.cx, relY: palH + 9, relZ: dc.cz, blockType: "minecraft:lantern" });
    }
    for (let z = -palR + 4; z <= palR - 4; z += 6) {
      for (let py = 1; py <= palH - 2; py++) {
        bp.push({ relX: -6, relY: py, relZ: z, blockType: "minecraft:chiseled_stone_bricks" });
        bp.push({ relX: 6, relY: py, relZ: z, blockType: "minecraft:chiseled_stone_bricks" });
      }
      bp.push({ relX: -6, relY: 6, relZ: z, blockType: "minecraft:lantern" });
      bp.push({ relX: 6, relY: 6, relZ: z, blockType: "minecraft:lantern" });
    }
    for (let z = palR - 1; z >= -12; z--) {
      bp.push({ relX: 0, relY: 1, relZ: z, blockType: "minecraft:red_carpet" });
      bp.push({ relX: -1, relY: 1, relZ: z, blockType: "minecraft:red_carpet" });
      bp.push({ relX: 1, relY: 1, relZ: z, blockType: "minecraft:red_carpet" });
      bp.push({ relX: -2, relY: 1, relZ: z, blockType: "minecraft:yellow_carpet" });
      bp.push({ relX: 2, relY: 1, relZ: z, blockType: "minecraft:yellow_carpet" });
    }
    for (let dx = -4; dx <= 4; dx++) {
      for (let dz = -20; dz <= -14; dz++) {
        bp.push({ relX: dx, relY: 1, relZ: dz, blockType: "minecraft:stone_bricks" });
      }
    }
    for (let dx = -3; dx <= 3; dx++) {
      for (let dz = -19; dz <= -15; dz++) {
        bp.push({ relX: dx, relY: 2, relZ: dz, blockType: "minecraft:gold_block" });
      }
    }
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -18; dz <= -16; dz++) {
        bp.push({ relX: dx, relY: 3, relZ: dz, blockType: "minecraft:gold_block" });
      }
    }
    bp.push({ relX: 0, relY: 4, relZ: -17, blockType: "feudal:throne" });
    bp.push({ relX: -3, relY: 3, relZ: -15, blockType: "minecraft:chiseled_stone_bricks" });
    bp.push({ relX: -3, relY: 4, relZ: -15, blockType: "minecraft:spruce_fence" });
    bp.push({ relX: -3, relY: 5, relZ: -15, blockType: "minecraft:spruce_fence" });
    bp.push({ relX: 3, relY: 3, relZ: -15, blockType: "minecraft:chiseled_stone_bricks" });
    bp.push({ relX: 3, relY: 4, relZ: -15, blockType: "minecraft:spruce_fence" });
    bp.push({ relX: 3, relY: 5, relZ: -15, blockType: "minecraft:spruce_fence" });
    for (let dx = -3; dx <= 3; dx++) {
      bp.push({ relX: dx, relY: 1, relZ: -21, blockType: "minecraft:gold_block" });
      bp.push({ relX: dx, relY: 2, relZ: -21, blockType: "minecraft:iron_bars" });
      bp.push({ relX: dx, relY: 3, relZ: -21, blockType: "minecraft:stone_bricks" });
    }
    return bp;
  }
  // --- Other Tiers (Ducal, Baron, Town Hall, Longhouse) ---
  static generateDucalCitadel() {
    const bp = [];
    const r = 16;
    const h = 12;
    for (let x = -r; x <= r; x++) {
      for (let z = -r; z <= r; z++) {
        bp.push({ relX: x, relY: -1, relZ: z, blockType: "minecraft:stone_bricks" });
        bp.push({ relX: x, relY: 0, relZ: z, blockType: (x + z) % 2 === 0 ? "minecraft:stone_bricks" : "minecraft:chiseled_stone_bricks" });
      }
    }
    for (let y = 1; y <= h; y++) {
      for (let x = -r; x <= r; x++) {
        for (let z = -r; z <= r; z++) {
          const isEdge = x === -r || x === r || z === -r || z === r;
          const isGate = z === r && Math.abs(x) <= 2 && y <= 4;
          if (isGate) continue;
          if (isEdge) {
            if (y >= 4 && y <= 7 && (Math.abs(x) === 4 || Math.abs(z) === 4)) {
              bp.push({ relX: x, relY: y, relZ: z, blockType: "minecraft:glass_pane" });
            } else {
              bp.push({ relX: x, relY: y, relZ: z, blockType: "minecraft:stone_bricks" });
            }
          }
        }
      }
    }
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -10; dz <= -6; dz++) {
        bp.push({ relX: dx, relY: 1, relZ: dz, blockType: "minecraft:stone_bricks" });
      }
    }
    bp.push({ relX: 0, relY: 2, relZ: -8, blockType: "minecraft:gold_block" });
    bp.push({ relX: 0, relY: 3, relZ: -8, blockType: "feudal:throne" });
    for (let z = r - 1; z >= -6; z--) {
      bp.push({ relX: 0, relY: 1, relZ: z, blockType: "minecraft:red_carpet" });
      bp.push({ relX: -1, relY: 1, relZ: z, blockType: "minecraft:yellow_carpet" });
      bp.push({ relX: 1, relY: 1, relZ: z, blockType: "minecraft:yellow_carpet" });
    }
    return bp;
  }
  static generateBaronKeep() {
    const bp = [];
    const r = 8;
    const h = 8;
    for (let x = -r; x <= r; x++) {
      for (let z = -r; z <= r; z++) {
        bp.push({ relX: x, relY: -1, relZ: z, blockType: "minecraft:stone_bricks" });
        bp.push({ relX: x, relY: 0, relZ: z, blockType: "minecraft:stone_bricks" });
      }
    }
    for (let y = 1; y <= h; y++) {
      for (let x = -r; x <= r; x++) {
        for (let z = -r; z <= r; z++) {
          const isEdge = x === -r || x === r || z === -r || z === r;
          const isDoor = z === r && Math.abs(x) <= 1 && y <= 3;
          if (isDoor) continue;
          if (isEdge) {
            bp.push({ relX: x, relY: y, relZ: z, blockType: "minecraft:stone_bricks" });
          }
        }
      }
    }
    bp.push({ relX: 0, relY: 1, relZ: -4, blockType: "minecraft:gold_block" });
    bp.push({ relX: 0, relY: 2, relZ: -4, blockType: "feudal:throne" });
    for (let z = r - 1; z >= -3; z--) {
      bp.push({ relX: 0, relY: 1, relZ: z, blockType: "minecraft:red_carpet" });
    }
    return bp;
  }
  static generateVillageTownHall() {
    const bp = [];
    const r = 6;
    for (let x = -r; x <= r; x++) {
      for (let z = -r; z <= r; z++) {
        bp.push({ relX: x, relY: 0, relZ: z, blockType: "minecraft:stone_bricks" });
      }
    }
    for (let y = 1; y <= 6; y++) {
      for (let x = -r; x <= r; x++) {
        for (let z = -r; z <= r; z++) {
          const isEdge = x === -r || x === r || z === -r || z === r;
          if (isEdge && !(z === r && Math.abs(x) <= 1 && y <= 2)) {
            bp.push({ relX: x, relY: y, relZ: z, blockType: y > 3 ? "minecraft:spruce_planks" : "minecraft:stone_bricks" });
          }
        }
      }
    }
    bp.push({ relX: 0, relY: 1, relZ: -3, blockType: "minecraft:chiseled_stone_bricks" });
    bp.push({ relX: 0, relY: 2, relZ: -3, blockType: "feudal:throne" });
    return bp;
  }
  static generateChieftainLonghouse() {
    const bp = [];
    const r = 4;
    for (let x = -r; x <= r; x++) {
      for (let z = -r; z <= r; z++) {
        bp.push({ relX: x, relY: 0, relZ: z, blockType: "minecraft:spruce_planks" });
      }
    }
    for (let y = 1; y <= 4; y++) {
      for (let x = -r; x <= r; x++) {
        for (let z = -r; z <= r; z++) {
          const isEdge = x === -r || x === r || z === -r || z === r;
          if (isEdge && !(z === r && x === 0 && y <= 2)) {
            bp.push({ relX: x, relY: y, relZ: z, blockType: "minecraft:dark_oak_planks" });
          }
        }
      }
    }
    bp.push({ relX: 0, relY: 1, relZ: -2, blockType: "feudal:throne" });
    return bp;
  }
  /**
   * Constructs or upgrades the castle around the settlement's throne.
   */
  static constructOrUpgradeCastle(settlement, scale) {
    const bp = this.getCastleBlueprint(settlement.tier, scale);
    BuildingEngine.startConstruction(
      settlement.dimensionId,
      settlement.throneLocation,
      12,
      20,
      bp
    );
    if (scale === "\u041A\u043E\u043B\u043E\u0441\u0441\u0430\u043B\u044C\u043D\u044B\u0439 \u041A\u0440\u0435\u043C\u043B\u044C-\u0426\u0438\u0442\u0430\u0434\u0435\u043B\u044C (200x200)" /* GrandCitadel200x200 */ || settlement.tier >= 5 /* BigCity */) {
      const dim = world3.getDimension(settlement.dimensionId);
      if (dim) {
        const R = 96;
        const bastionCoords = [
          { bx: -R, bz: -R },
          { bx: R, bz: -R },
          { bx: -R, bz: R },
          { bx: R, bz: R },
          { bx: 0, bz: -R },
          { bx: 0, bz: R },
          { bx: -R, bz: 0 },
          { bx: R, bz: 0 }
        ];
        for (const b of bastionCoords) {
          try {
            const ballista = dim.spawnEntity("feudal:ballista", {
              x: settlement.throneLocation.x + b.bx,
              y: settlement.throneLocation.y + 13,
              z: settlement.throneLocation.z + b.bz
            });
            ballista.nameTag = `\u0411\u0430\u043B\u043B\u0438\u0441\u0442\u0430 \u0418\u043C\u043F\u0435\u0440\u0441\u043A\u043E\u0433\u043E \u0411\u0430\u0441\u0442\u0438\u043E\u043D\u0430 [${b.bx}, ${b.bz}]`;
          } catch {
          }
        }
      }
    }
  }
};

// behavior_pack/scripts/MedievalWallEngine.ts
import { world as world4 } from "@minecraft/server";
var MedievalWallEngine = class {
  /**
   * Generates a 3-block thick medieval curtain wall segment with crenellations,
   * walkable wooden parapet walkway, arrow slits, and lanterns.
   * length: length in blocks
   * isAxisX: direction along X or Z axis
   */
  static getWallSegmentBlueprint(length, isAxisX = true) {
    const bp = [];
    const wallHeight = 5;
    for (let step = 0; step < length; step++) {
      for (let w = -1; w <= 1; w++) {
        const rx = isAxisX ? step : w;
        const rz = isAxisX ? w : step;
        bp.push({ relX: rx, relY: -1, relZ: rz, blockType: "minecraft:cobblestone" });
        for (let y = 0; y < wallHeight; y++) {
          let block = "minecraft:stone_bricks";
          if ((step + y + w) % 7 === 0) block = "minecraft:mossy_stone_bricks";
          if (step * y % 11 === 0) block = "minecraft:cracked_stone_bricks";
          if (y === wallHeight - 1 && w === -1) {
            block = "minecraft:spruce_planks";
          }
          bp.push({ relX: rx, relY: y, relZ: rz, blockType: block });
        }
        if (w === 1) {
          if (step % 2 === 0) {
            bp.push({ relX: rx, relY: wallHeight, relZ: rz, blockType: "minecraft:stone_bricks" });
            bp.push({ relX: rx, relY: wallHeight + 1, relZ: rz, blockType: "minecraft:stone_brick_slab" });
          } else {
            bp.push({ relX: rx, relY: wallHeight, relZ: rz, blockType: "minecraft:cobblestone_wall" });
          }
        }
        if (w === -1) {
          bp.push({ relX: rx, relY: wallHeight, relZ: rz, blockType: "minecraft:spruce_fence" });
          if (step % 5 === 0) {
            bp.push({ relX: rx, relY: wallHeight + 1, relZ: rz, blockType: "minecraft:lantern" });
          }
        }
      }
    }
    return bp;
  }
  /**
   * Generates a massive Corner Bastion / Wall Tower (Угловая оборонительная башня)
   * with an open top deck designed for mounted defensive ballistas.
   */
  static getBastionTowerBlueprint() {
    const bp = [];
    const r = 3;
    const h = 7;
    for (let x = -r; x <= r; x++) {
      for (let z = -r; z <= r; z++) {
        bp.push({ relX: x, relY: -1, relZ: z, blockType: "minecraft:cobblestone" });
        for (let y = 0; y <= h; y++) {
          const isEdge2 = x === -r || x === r || z === -r || z === r;
          if (isEdge2) {
            if ((y === 3 || y === 4) && (x === 0 || z === 0)) {
              bp.push({ relX: x, relY: y, relZ: z, blockType: "minecraft:iron_bars" });
            } else {
              const blk = (x + y + z) % 6 === 0 ? "minecraft:mossy_stone_bricks" : "minecraft:stone_bricks";
              bp.push({ relX: x, relY: y, relZ: z, blockType: blk });
            }
          } else if (y === h) {
            bp.push({ relX: x, relY: y, relZ: z, blockType: "minecraft:stone_bricks" });
          }
        }
        const isEdge = x === -r || x === r || z === -r || z === r;
        if (isEdge) {
          if ((x + z) % 2 === 0) {
            bp.push({ relX: x, relY: h + 1, relZ: z, blockType: "minecraft:stone_bricks" });
            bp.push({ relX: x, relY: h + 2, relZ: z, blockType: "minecraft:stone_brick_slab" });
          } else {
            bp.push({ relX: x, relY: h + 1, relZ: z, blockType: "minecraft:cobblestone_wall" });
          }
        }
      }
    }
    bp.push({ relX: -r, relY: h + 2, relZ: -r, blockType: "minecraft:lantern" });
    bp.push({ relX: r, relY: h + 2, relZ: -r, blockType: "minecraft:lantern" });
    bp.push({ relX: -r, relY: h + 2, relZ: r, blockType: "minecraft:lantern" });
    bp.push({ relX: r, relY: h + 2, relZ: r, blockType: "minecraft:lantern" });
    return bp;
  }
  /**
   * Generates a fortified Gatehouse (Барбакан / Надвратная крепостная башня)
   * with arched portal, iron portcullis (решетка), murder holes, and guard gallery.
   */
  static getFortressGatehouseBlueprint() {
    const bp = [];
    const r = 4;
    const h = 7;
    for (let x = -r; x <= r; x++) {
      for (let z = -2; z <= 2; z++) {
        bp.push({ relX: x, relY: -1, relZ: z, blockType: "minecraft:cobblestone" });
        for (let y = 0; y <= h; y++) {
          const isArchPassage = Math.abs(x) <= 1 && y <= 3;
          if (isArchPassage) {
            if (z === 0 && y >= 1 && y <= 3) {
              bp.push({ relX: x, relY: y, relZ: z, blockType: "minecraft:iron_bars" });
            }
            continue;
          }
          const isEdge = x === -r || x === r || z === -2 || z === 2;
          if (isEdge || y === h) {
            bp.push({ relX: x, relY: y, relZ: z, blockType: "minecraft:stone_bricks" });
          }
        }
      }
    }
    for (let x = -r; x <= r; x++) {
      for (let z = -2; z <= 2; z++) {
        const isEdge = x === -r || x === r || z === -2 || z === 2;
        if (isEdge) {
          if ((x + z) % 2 === 0) {
            bp.push({ relX: x, relY: h + 1, relZ: z, blockType: "minecraft:stone_bricks" });
          } else {
            bp.push({ relX: x, relY: h + 1, relZ: z, blockType: "minecraft:cobblestone_wall" });
          }
        }
      }
    }
    bp.push({ relX: -2, relY: 4, relZ: -3, blockType: "minecraft:lantern" });
    bp.push({ relX: 2, relY: 4, relZ: -3, blockType: "minecraft:lantern" });
    return bp;
  }
  /**
   * Constructs a fortified medieval defense perimeter around the city center,
   * complete with 4 corner bastions, wall sections, gatehouse, and mounted wall ballistas!
   */
  static constructFortifiedCitadelPerimeter(settlement) {
    const dim = world4.getDimension(settlement.dimensionId);
    if (!dim) return;
    const throne = settlement.throneLocation;
    const halfSize = 16;
    const corners = [
      { x: throne.x - halfSize, z: throne.z - halfSize },
      { x: throne.x + halfSize, z: throne.z - halfSize },
      { x: throne.x - halfSize, z: throne.z + halfSize },
      { x: throne.x + halfSize, z: throne.z + halfSize }
    ];
    const towerBp = this.getBastionTowerBlueprint();
    for (const c of corners) {
      BuildingEngine.startConstruction(
        settlement.dimensionId,
        { x: c.x, y: throne.y, z: c.z },
        4,
        9,
        towerBp
      );
      try {
        const ballista = dim.spawnEntity("feudal:ballista", {
          x: c.x,
          y: throne.y + 8,
          z: c.z
        });
        ballista.nameTag = `\u041A\u0440\u0435\u043F\u043E\u0441\u0442\u043D\u0430\u044F \u0431\u0430\u043B\u043B\u0438\u0441\u0442\u0430 \u0431\u0430\u0448\u043D\u0438 [${c.x}, ${c.z}]`;
      } catch {
      }
    }
    const northBp = this.getWallSegmentBlueprint(halfSize * 2 - 6, true);
    BuildingEngine.startConstruction(
      settlement.dimensionId,
      { x: throne.x - halfSize + 3, y: throne.y, z: throne.z - halfSize },
      3,
      7,
      northBp
    );
    const westBp = this.getWallSegmentBlueprint(halfSize * 2 - 6, false);
    BuildingEngine.startConstruction(
      settlement.dimensionId,
      { x: throne.x - halfSize, y: throne.y, z: throne.z - halfSize + 3 },
      3,
      7,
      westBp
    );
    const eastBp = this.getWallSegmentBlueprint(halfSize * 2 - 6, false);
    BuildingEngine.startConstruction(
      settlement.dimensionId,
      { x: throne.x + halfSize, y: throne.y, z: throne.z - halfSize + 3 },
      3,
      7,
      eastBp
    );
    const gateBp = this.getFortressGatehouseBlueprint();
    BuildingEngine.startConstruction(
      settlement.dimensionId,
      { x: throne.x, y: throne.y, z: throne.z + halfSize },
      5,
      9,
      gateBp
    );
    world4.sendMessage(
      `\xA76\xA7l[\u041A\u0420\u0415\u041F\u041E\u0421\u0422\u041D\u042B\u0415 \u0421\u0422\u0415\u041D\u042B] \u041C\u0430\u0441\u0442\u0435\u0440\u0430 \u0432\u043E\u0437\u0432\u043E\u0434\u044F\u0442 \u043D\u0435\u043F\u0440\u0438\u0441\u0442\u0443\u043F\u043D\u044B\u0435 \u0441\u0440\u0435\u0434\u043D\u0435\u0432\u0435\u043A\u043E\u0432\u044B\u0435 \u0441\u0442\u0435\u043D\u044B, \u0431\u0430\u0441\u0442\u0438\u043E\u043D\u044B \u0438 \u0431\u0430\u043B\u043B\u0438\u0441\u0442\u044B \u0432\u043E\u043A\u0440\u0443\u0433 \u0433\u043E\u0440\u043E\u0434\u0430 ${settlement.factionId}!\xA7r`
    );
  }
};

// behavior_pack/scripts/CityProgression.ts
var CityTier = /* @__PURE__ */ ((CityTier2) => {
  CityTier2[CityTier2["Camp"] = 1] = "Camp";
  CityTier2[CityTier2["Village"] = 2] = "Village";
  CityTier2[CityTier2["SmallTown"] = 3] = "SmallTown";
  CityTier2[CityTier2["FortressCity"] = 4] = "FortressCity";
  CityTier2[CityTier2["BigCity"] = 5] = "BigCity";
  CityTier2[CityTier2["Metropolis"] = 6] = "Metropolis";
  CityTier2[CityTier2["Capital"] = 7] = "Capital";
  return CityTier2;
})(CityTier || {});
var CityProgression = class {
  static canUpgrade(settlement) {
    if (settlement.tier >= 7 /* Capital */) return false;
    const req = this.tierConfig[settlement.tier].upgradeReq;
    return settlement.population >= req.pop && settlement.treasury.wood >= req.wood && settlement.treasury.stone >= req.stone && settlement.treasury.emeralds >= req.emeralds && settlement.treasury.food >= req.food;
  }
  static upgradeTier(settlement) {
    if (!this.canUpgrade(settlement)) return false;
    const req = this.tierConfig[settlement.tier].upgradeReq;
    settlement.treasury.wood -= req.wood;
    settlement.treasury.stone -= req.stone;
    settlement.treasury.emeralds -= req.emeralds;
    settlement.treasury.food -= req.food;
    settlement.tier = settlement.tier + 1;
    this.recalculateMilitary(settlement);
    const faction = FactionManager.getFaction(settlement.factionId);
    if (faction) {
      faction.title = FactionManager.calculateTitle(faction.vassalIds.length, settlement.tier);
      FactionManager.registerFaction(faction);
    }
    CastleArchitectureEngine.constructOrUpgradeCastle(settlement);
    if (settlement.tier === 4 /* FortressCity */) {
      MedievalWallEngine.constructFortifiedCitadelPerimeter(settlement);
    }
    world5.sendMessage(
      `\xA76\xA7l[\u0424\u0415\u041E\u0414\u0410\u041B\u042C\u041D\u042B\u0415 \u0417\u0415\u041C\u041B\u0418] ${faction?.name ?? "\u041F\u043E\u0441\u0435\u043B\u0435\u043D\u0438\u0435"} \u0434\u043E\u0441\u0442\u0438\u0433\u043B\u043E \u0433\u0440\u0430\u043D\u0434\u0438\u043E\u0437\u043D\u043E\u0439 \u044D\u043F\u043E\u0445\u0438: \xA7e${CityTier[settlement.tier]}\xA76! \u0412\u043E\u0437\u0432\u043E\u0434\u0438\u0442\u0441\u044F \u0432\u0435\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0439 \u0437\u0430\u043C\u043E\u043A ${CityTier[settlement.tier]} \u0443\u0440\u043E\u0432\u043D\u044F!\xA7r`
    );
    return true;
  }
  /**
   * Calculates army size between 20% and 50% based on peacetime vs full wartime mobilization.
   */
  static recalculateMilitary(settlement) {
    const config = this.tierConfig[settlement.tier] ?? this.tierConfig[2 /* Village */];
    const ratio = settlement.isMobilized ? config.mobilizedMilitaryRatio : config.baseMilitaryRatio;
    settlement.militaryCount = Math.max(8, Math.floor(settlement.population * ratio));
    return settlement.militaryCount;
  }
  /**
   * Toggles general mobilization (raises army from ~25% to up to 50% of population)
   */
  static toggleMobilization(settlement, enable) {
    settlement.isMobilized = enable;
    const count = this.recalculateMilitary(settlement);
    if (enable) {
      world5.sendMessage(
        `\xA7c\xA7l[\u0412\u0421\u0415\u041E\u0411\u0429\u0410\u042F \u041C\u041E\u0411\u0418\u041B\u0418\u0417\u0410\u0426\u0418\u042F] \u0412 \u0433\u043E\u0440\u043E\u0434\u0435 ${settlement.factionId} \u043E\u0431\u044A\u044F\u0432\u043B\u0435\u043D \u0432\u043E\u0438\u043D\u0441\u043A\u0438\u0439 \u043F\u0440\u0438\u0437\u044B\u0432! \u0410\u0440\u043C\u0438\u044F \u043C\u043E\u0431\u0438\u043B\u0438\u0437\u043E\u0432\u0430\u043D\u0430 \u0434\u043E 50% \u043D\u0430\u0441\u0435\u043B\u0435\u043D\u0438\u044F (${count} \u0448\u0442\u044B\u043A\u043E\u0432)!\xA7r`
      );
    } else {
      world5.sendMessage(
        `\xA7a\xA7l[\u041C\u0418\u0420\u041D\u041E\u0415 \u0412\u0420\u0415\u041C\u042F] \u041E\u043F\u043E\u043B\u0447\u0435\u043D\u0438\u0435 ${settlement.factionId} \u0440\u0430\u0441\u043F\u0443\u0449\u0435\u043D\u043E \u043F\u043E \u0434\u043E\u043C\u0430\u043C \u043A \u043F\u043E\u043B\u044F\u043C \u0438 \u0440\u0435\u043C\u0435\u0441\u043B\u0430\u043C. \u0413\u0430\u0440\u043D\u0438\u0437\u043E\u043D: ${count} \u0440\u0435\u0433\u0443\u043B\u044F\u0440\u043D\u044B\u0445 \u0432\u043E\u0438\u043D\u043E\u0432.\xA7r`
      );
    }
    return count;
  }
  static processTaxes(vassal, overlord) {
    const taxMod = vassal.taxRatePercent / 100;
    const woodTax = Math.floor(vassal.treasury.wood * taxMod);
    const stoneTax = Math.floor(vassal.treasury.stone * taxMod);
    const emeraldTax = Math.floor(vassal.treasury.emeralds * taxMod);
    vassal.treasury.wood -= woodTax;
    vassal.treasury.stone -= stoneTax;
    vassal.treasury.emeralds -= emeraldTax;
    overlord.treasury.wood += woodTax;
    overlord.treasury.stone += stoneTax;
    overlord.treasury.emeralds += emeraldTax;
  }
};
/**
 * Massive Scale: Cities house from 50 up to 15,000+ residents!
 * Military capacity is strictly calibrated to 20% - 50% of total population.
 */
CityProgression.tierConfig = {
  [1 /* Camp */]: {
    minPop: 30,
    maxPop: 90,
    baseMilitaryRatio: 0.25,
    mobilizedMilitaryRatio: 0.45,
    upgradeReq: { pop: 60, wood: 120, stone: 40, emeralds: 10, food: 100 }
  },
  [2 /* Village */]: {
    minPop: 100,
    maxPop: 320,
    baseMilitaryRatio: 0.25,
    mobilizedMilitaryRatio: 0.45,
    upgradeReq: { pop: 250, wood: 350, stone: 180, emeralds: 30, food: 300 }
  },
  [3 /* SmallTown */]: {
    minPop: 350,
    maxPop: 850,
    baseMilitaryRatio: 0.28,
    mobilizedMilitaryRatio: 0.48,
    upgradeReq: { pop: 700, wood: 800, stone: 600, emeralds: 80, food: 700 }
  },
  [4 /* FortressCity */]: {
    minPop: 950,
    maxPop: 2200,
    // Scales past 1000+ residents!
    baseMilitaryRatio: 0.35,
    mobilizedMilitaryRatio: 0.5,
    upgradeReq: { pop: 1800, wood: 1800, stone: 1600, emeralds: 200, food: 1600 }
  },
  [5 /* BigCity */]: {
    minPop: 2500,
    maxPop: 5500,
    baseMilitaryRatio: 0.3,
    mobilizedMilitaryRatio: 0.5,
    upgradeReq: { pop: 4500, wood: 3500, stone: 3200, emeralds: 450, food: 3500 }
  },
  [6 /* Metropolis */]: {
    minPop: 6e3,
    maxPop: 12e3,
    baseMilitaryRatio: 0.32,
    mobilizedMilitaryRatio: 0.5,
    upgradeReq: { pop: 1e4, wood: 6500, stone: 6e3, emeralds: 900, food: 7500 }
  },
  [7 /* Capital */]: {
    minPop: 15e3,
    maxPop: 35e3,
    // Grand Imperial Metropolis
    baseMilitaryRatio: 0.35,
    mobilizedMilitaryRatio: 0.5,
    upgradeReq: { pop: 3e4, wood: 15e3, stone: 15e3, emeralds: 2500, food: 2e4 }
  }
};

// behavior_pack/scripts/MilitaryCareer.ts
import { ItemStack, world as world6 } from "@minecraft/server";
var MilitaryCareer = class {
  static getProfile(player, defaultCityId = "city_1") {
    let profile = this.profiles.get(player.id);
    if (!profile) {
      profile = {
        playerId: player.id,
        rank: "\u0420\u0435\u043A\u0440\u0443\u0442" /* Recruit */,
        victories: 0,
        lastSalaryDay: -1,
        allegianceCityId: defaultCityId
      };
      this.profiles.set(player.id, profile);
    }
    return profile;
  }
  static claimDailySalary(player) {
    const profile = this.getProfile(player);
    const currentDay = Math.floor(world6.getDay());
    if (profile.lastSalaryDay >= currentDay) {
      player.sendMessage("[\u041A\u0430\u0437\u0430\u0440\u043C\u0430] \u0412\u044B \u0443\u0436\u0435 \u043F\u043E\u043B\u0443\u0447\u0438\u043B\u0438 \u0441\u0432\u043E\u0451 \u0441\u0443\u0442\u043E\u0447\u043D\u043E\u0435 \u0436\u0430\u043B\u043E\u0432\u0430\u043D\u044C\u0435 \u0437\u0430 \u0441\u0435\u0433\u043E\u0434\u043D\u044F!");
      return;
    }
    const salaryAmount = this.salaryByRank[profile.rank];
    profile.lastSalaryDay = currentDay;
    const inventory = player.getComponent("minecraft:inventory");
    const container = inventory?.container;
    if (container) {
      container.addItem(new ItemStack("minecraft:emerald", salaryAmount));
      player.sendMessage(`[\u041A\u0430\u0437\u0430\u0440\u043C\u0430] \u041F\u043E\u043B\u0443\u0447\u0435\u043D\u043E \u0436\u0430\u043B\u043E\u0432\u0430\u043D\u0438\u0435 \u0437\u0430 \u0437\u0432\u0430\u043D\u0438\u0435 ${profile.rank}: ${salaryAmount} \u0438\u0437\u0443\u043C\u0440\u0443\u0434\u043E\u0432!`);
    }
  }
  static addVictory(player) {
    const profile = this.getProfile(player);
    profile.victories++;
    if (profile.victories >= 25 && profile.rank !== "\u0412\u0435\u043B\u0438\u043A\u0438\u0439 \u041C\u0430\u0440\u0448\u0430\u043B" /* FieldMarshal */) {
      profile.rank = "\u0412\u0435\u043B\u0438\u043A\u0438\u0439 \u041C\u0430\u0440\u0448\u0430\u043B" /* FieldMarshal */;
      world6.sendMessage(`[\u0423\u043A\u0430\u0437 \u041A\u043E\u0440\u043E\u043B\u044F] ${player.name} \u0443\u0434\u043E\u0441\u0442\u043E\u0435\u043D \u0432\u044B\u0441\u0448\u0435\u0433\u043E \u0437\u0432\u0430\u043D\u0438\u044F: ${"\u0412\u0435\u043B\u0438\u043A\u0438\u0439 \u041C\u0430\u0440\u0448\u0430\u043B" /* FieldMarshal */}!`);
    } else if (profile.victories >= 15 && profile.rank === "\u041A\u0430\u043F\u0438\u0442\u0430\u043D \u0413\u0430\u0440\u043D\u0438\u0437\u043E\u043D\u0430" /* Captain */) {
      profile.rank = "\u0413\u0435\u043D\u0435\u0440\u0430\u043B \u0410\u0440\u043C\u0438\u0438" /* General */;
      player.sendMessage(`[\u041A\u0430\u0437\u0430\u0440\u043C\u0430] \u041F\u043E\u0437\u0434\u0440\u0430\u0432\u043B\u044F\u0435\u043C! \u0412\u0430\u043C \u043F\u0440\u0438\u0441\u0432\u043E\u0435\u043D\u043E \u0437\u0432\u0430\u043D\u0438\u0435 ${"\u0413\u0435\u043D\u0435\u0440\u0430\u043B \u0410\u0440\u043C\u0438\u0438" /* General */}!`);
    } else if (profile.victories >= 5 && profile.rank === "\u0420\u0435\u043A\u0440\u0443\u0442" /* Recruit */) {
      profile.rank = "\u0421\u0435\u0440\u0436\u0430\u043D\u0442" /* Sergeant */;
      player.sendMessage(`[\u041A\u0430\u0437\u0430\u0440\u043C\u0430] \u041F\u043E\u0437\u0434\u0440\u0430\u0432\u043B\u044F\u0435\u043C! \u0412\u0430\u043C \u043F\u0440\u0438\u0441\u0432\u043E\u0435\u043D\u043E \u0437\u0432\u0430\u043D\u0438\u0435 ${"\u0421\u0435\u0440\u0436\u0430\u043D\u0442" /* Sergeant */}!`);
    }
  }
  static turnInBanditBounty(player) {
    const inventory = player.getComponent("minecraft:inventory");
    const container = inventory?.container;
    if (!container) return;
    let headFound = false;
    let slotIndex = -1;
    for (let i = 0; i < container.size; i++) {
      const item2 = container.getItem(i);
      if (item2 && item2.typeId === "feudal:bandit_head") {
        headFound = true;
        slotIndex = i;
        break;
      }
    }
    if (!headFound || slotIndex === -1) {
      player.sendMessage("[\u0421\u0442\u0430\u0440\u043E\u0441\u0442\u0430] \u0423 \u0432\u0430\u0441 \u0432 \u0438\u043D\u0432\u0435\u043D\u0442\u0430\u0440\u0435 \u043D\u0435\u0442 \u0442\u0440\u043E\u0444\u0435\u0439\u043D\u043E\u0439 \u0433\u043E\u043B\u043E\u0432\u044B \u0430\u0442\u0430\u043C\u0430\u043D\u0430!");
      return;
    }
    const item = container.getItem(slotIndex);
    if (item.amount > 1) {
      item.amount -= 1;
      container.setItem(slotIndex, item);
    } else {
      container.setItem(slotIndex, void 0);
    }
    container.addItem(new ItemStack("minecraft:emerald", 32));
    this.addVictory(player);
    world6.sendMessage(`[\u041D\u0430\u0433\u0440\u0430\u0434\u0430 \u0437\u0430 \u0433\u043E\u043B\u043E\u0432\u0443] ${player.name} \u0441\u0434\u0430\u043B \u0442\u0440\u043E\u0444\u0435\u0439 \u0430\u0442\u0430\u043C\u0430\u043D\u0430 \u0438 \u043F\u043E\u043B\u0443\u0447\u0438\u043B 32 \u0438\u0437\u0443\u043C\u0440\u0443\u0434\u0430!`);
  }
};
MilitaryCareer.profiles = /* @__PURE__ */ new Map();
MilitaryCareer.salaryByRank = {
  ["\u0420\u0435\u043A\u0440\u0443\u0442" /* Recruit */]: 4,
  ["\u0421\u0435\u0440\u0436\u0430\u043D\u0442" /* Sergeant */]: 8,
  ["\u041A\u0430\u043F\u0438\u0442\u0430\u043D \u0413\u0430\u0440\u043D\u0438\u0437\u043E\u043D\u0430" /* Captain */]: 16,
  ["\u0413\u0435\u043D\u0435\u0440\u0430\u043B \u0410\u0440\u043C\u0438\u0438" /* General */]: 32,
  ["\u0412\u0435\u043B\u0438\u043A\u0438\u0439 \u041C\u0430\u0440\u0448\u0430\u043B" /* FieldMarshal */]: 64
};

// behavior_pack/scripts/WorldMapUI.ts
import { ActionFormData, MessageFormData } from "@minecraft/server-ui";

// behavior_pack/scripts/VirtualWorldEngine.ts
import { world as world9 } from "@minecraft/server";

// behavior_pack/scripts/AllianceSystem.ts
import { world as world7 } from "@minecraft/server";
var AllianceSystem = class {
  static initializeAlliances() {
    if (this.alliances.size === 0) {
      this.createAlliance("\u041B\u0438\u0433\u0430 \u0421\u0432\u043E\u0431\u043E\u0434\u043D\u044B\u0445 \u041A\u043E\u0440\u043E\u043B\u0435\u0432\u0441\u0442\u0432", "fact_kingdom_1", ["fact_kingdom_1", "fact_rival_2"], false);
      this.createAlliance("\u0412\u0435\u043B\u0438\u043A\u0430\u044F \u0411\u0430\u043D\u0434\u0438\u0442\u0441\u043A\u0430\u044F \u041E\u0440\u0434\u0430", "clan_black_ravens", ["clan_black_ravens", "clan_blood_axes"], true);
    }
  }
  static createAlliance(name, leaderId, members, isBandit) {
    const allianceId = `alliance_${Date.now()}_${Math.floor(Math.random() * 1e3)}`;
    const alliance = {
      id: allianceId,
      name,
      leaderFactionId: leaderId,
      memberFactionIds: members,
      isBanditConfederacy: isBandit,
      totalArmyStrength: members.length * 15
    };
    this.alliances.set(allianceId, alliance);
    world7.sendMessage(
      isBandit ? `\xA7c\xA7l[\u0411\u0410\u041D\u0414\u0418\u0422\u0421\u041A\u0418\u0419 \u0410\u041B\u042C\u042F\u041D\u0421]\xA7r \xA74\u041A\u043B\u0430\u043D\u044B \u0440\u0430\u0437\u0431\u043E\u0439\u043D\u0438\u043A\u043E\u0432 \u043E\u0431\u044A\u0435\u0434\u0438\u043D\u0438\u043B\u0438\u0441\u044C \u0432 \u0441\u043E\u044E\u0437 \xAB${name}\xBB \u0434\u043B\u044F \u0448\u0442\u0443\u0440\u043C\u0430 \u0433\u043E\u0440\u043E\u0434\u043E\u0432!\xA7r` : `\xA7b\xA7l[\u0412\u041E\u0415\u041D\u041D\u042B\u0419 \u0410\u041B\u042C\u042F\u041D\u0421]\xA7r \xA7e\u0417\u0430\u043A\u043B\u044E\u0447\u0435\u043D \u0441\u0432\u044F\u0449\u0435\u043D\u043D\u044B\u0439 \u0432\u043E\u0435\u043D\u043D\u044B\u0439 \u0434\u043E\u0433\u043E\u0432\u043E\u0440 \xAB${name}\xBB \u043C\u0435\u0436\u0434\u0443 \u043C\u043E\u043D\u0430\u0440\u0445\u0430\u043C\u0438!\xA7r`
    );
    return alliance;
  }
  static joinAlliance(allianceId, factionId) {
    const alliance = this.alliances.get(allianceId);
    if (alliance && !alliance.memberFactionIds.includes(factionId)) {
      alliance.memberFactionIds.push(factionId);
      alliance.totalArmyStrength += 15;
      world7.sendMessage(`[\u0410\u043B\u044C\u044F\u043D\u0441] \u0424\u0440\u0430\u043A\u0446\u0438\u044F ${factionId} \u0432\u0441\u0442\u0443\u043F\u0438\u043B\u0430 \u0432 \u0441\u043E\u0441\u0442\u0430\u0432 \xAB${alliance.name}\xBB!`);
    }
  }
  static getAllAlliances() {
    return this.alliances;
  }
  static calculateCombinedDefense(settlement) {
    let combinedPower = settlement.militaryCount * 10;
    for (const alliance of this.alliances.values()) {
      if (!alliance.isBanditConfederacy && alliance.memberFactionIds.includes(settlement.factionId)) {
        combinedPower += Math.floor(alliance.totalArmyStrength * 0.5);
        break;
      }
    }
    return combinedPower;
  }
};
AllianceSystem.alliances = /* @__PURE__ */ new Map();

// behavior_pack/scripts/WorldEventsEngine.ts
import { world as world8 } from "@minecraft/server";
var WorldEventsEngine = class {
  static getCurrentEvent() {
    return this.currentEvent;
  }
  /**
   * Ticked periodically from main cycle (e.g. every 20 seconds / 400 ticks)
   */
  static tick() {
    this.currentEvent.ticksRemaining -= 400;
    if (this.currentEvent.ticksRemaining <= 0) {
      this.triggerNextRandomEvent();
    }
  }
  static triggerNextRandomEvent() {
    const events = [
      "\u0412\u0442\u043E\u0440\u0436\u0435\u043D\u0438\u0435 \u0421\u0442\u0435\u043F\u043D\u043E\u0439 \u041E\u0440\u0434\u044B" /* NomadHordeInvasion */,
      "\u0412\u0435\u043B\u0438\u043A\u0438\u0439 \u041A\u043E\u0440\u043E\u043B\u0435\u0432\u0441\u043A\u0438\u0439 \u0422\u0443\u0440\u043D\u0438\u0440" /* GrandTourney */,
      "\u0412\u0435\u043B\u0438\u043A\u0430\u044F \u0427\u0443\u043C\u0430" /* BlackPlague */,
      "\u0417\u043E\u043B\u043E\u0442\u0430\u044F \u041B\u0438\u0445\u043E\u0440\u0430\u0434\u043A\u0430 \u0432 \u0448\u0430\u0445\u0442\u0430\u0445" /* GoldRush */,
      "\u0412\u0435\u043B\u0438\u043A\u043E\u0435 \u041A\u0440\u0435\u0441\u0442\u044C\u044F\u043D\u0441\u043A\u043E\u0435 \u0412\u043E\u0441\u0441\u0442\u0430\u043D\u0438\u0435" /* PeasantUprising */
    ];
    const pick = events[Math.floor(Math.random() * events.length)];
    this.startEvent(pick);
  }
  static startEvent(type) {
    switch (type) {
      case "\u0412\u0442\u043E\u0440\u0436\u0435\u043D\u0438\u0435 \u0421\u0442\u0435\u043F\u043D\u043E\u0439 \u041E\u0440\u0434\u044B" /* NomadHordeInvasion */:
        this.currentEvent = {
          type,
          name: "\u{1F525} \u0412\u0422\u041E\u0420\u0416\u0415\u041D\u0418\u0415 \u0421\u0422\u0415\u041F\u041D\u041E\u0419 \u041E\u0420\u0414\u042B",
          description: "\u0418\u0437 \u0434\u0438\u043A\u0438\u0445 \u0431\u0435\u0441\u043A\u0440\u0430\u0439\u043D\u0438\u0445 \u0441\u0442\u0435\u043F\u0435\u0439 \u0445\u043B\u044B\u043D\u0443\u043B\u0430 \u043A\u043E\u043D\u043D\u0430\u044F \u043E\u0440\u0434\u0430 \u0438\u0437 800 \u043A\u043E\u0447\u0435\u0432\u043D\u0438\u043A\u043E\u0432 \u0441 \u043A\u0430\u0442\u0430\u043F\u0443\u043B\u044C\u0442\u0430\u043C\u0438! \u041A\u043E\u0440\u043E\u043B\u0435\u0432\u0441\u0442\u0432\u0430 \u043F\u0440\u0438\u0437\u044B\u0432\u0430\u044E\u0442 \u0432\u0441\u0435\u0445 \u0433\u0435\u0440\u043E\u0435\u0432 \u0432 \u043E\u043F\u043E\u043B\u0447\u0435\u043D\u0438\u0435!",
          ticksRemaining: 3600
          // ~3 minutes
        };
        world8.sendMessage(
          `\xA7c\xA7l[\u0413\u041B\u041E\u0411\u0410\u041B\u042C\u041D\u041E\u0415 \u0421\u041E\u0411\u042B\u0422\u0418\u0415] ${this.currentEvent.name}!\xA7r
\xA7e${this.currentEvent.description}\xA7r`
        );
        break;
      case "\u0412\u0435\u043B\u0438\u043A\u0438\u0439 \u041A\u043E\u0440\u043E\u043B\u0435\u0432\u0441\u043A\u0438\u0439 \u0422\u0443\u0440\u043D\u0438\u0440" /* GrandTourney */:
        this.currentEvent = {
          type,
          name: "\u{1F3C6} \u0412\u0415\u041B\u0418\u041A\u0418\u0419 \u0420\u042B\u0426\u0410\u0420\u0421\u041A\u0418\u0419 \u0422\u0423\u0420\u041D\u0418\u0420",
          description: "\u0412 \u0441\u0442\u043E\u043B\u0438\u0446\u0435 \u043E\u0431\u044A\u044F\u0432\u043B\u0435\u043D\u044B \u0440\u044B\u0446\u0430\u0440\u0441\u043A\u0438\u0435 \u0442\u0443\u0440\u043D\u0438\u0440\u043D\u044B\u0435 \u0438\u0433\u0440\u044B! \u041B\u0443\u0447\u0448\u0438\u0435 \u0431\u043E\u0439\u0446\u044B \u0441\u043E \u0432\u0441\u0435\u0445 \u0437\u0435\u043C\u0435\u043B\u044C \u0441\u0440\u0430\u0436\u0430\u044E\u0442\u0441\u044F \u043D\u0430 \u0430\u0440\u0435\u043D\u0435 \u0437\u0430 \u0441\u043B\u0430\u0432\u0443, \u0442\u0438\u0442\u0443\u043B \u0447\u0435\u043C\u043F\u0438\u043E\u043D\u0430 \u0438 100 \u0438\u0437\u0443\u043C\u0440\u0443\u0434\u043E\u0432!",
          ticksRemaining: 3600
        };
        world8.sendMessage(
          `\xA76\xA7l[\u0413\u041B\u041E\u0411\u0410\u041B\u042C\u041D\u041E\u0415 \u0421\u041E\u0411\u042B\u0422\u0418\u0415] ${this.currentEvent.name}!\xA7r
\xA7b${this.currentEvent.description}\xA7r`
        );
        break;
      case "\u0412\u0435\u043B\u0438\u043A\u0430\u044F \u0427\u0443\u043C\u0430" /* BlackPlague */:
        this.currentEvent = {
          type,
          name: "\u{1F480} \u0412\u0415\u041B\u0418\u041A\u0410\u042F \u0427\u0423\u041C\u0410",
          description: "\u041C\u043E\u0440\u043E\u0432\u043E\u0435 \u043F\u043E\u0432\u0435\u0442\u0440\u0438\u0435 \u043E\u0445\u0432\u0430\u0442\u0438\u043B\u043E \u0433\u043E\u0440\u043E\u0434\u0430. \u041F\u0440\u0438\u0440\u043E\u0441\u0442 \u043D\u0430\u0441\u0435\u043B\u0435\u043D\u0438\u044F \u043E\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D, \u0446\u0435\u043D\u044B \u043D\u0430 \u0445\u043B\u0435\u0431 \u0438 \u0446\u0435\u043B\u0435\u0431\u043D\u044B\u0435 \u0437\u0435\u043B\u044C\u044F \u0432\u044B\u0440\u043E\u0441\u043B\u0438 \u0432 3 \u0440\u0430\u0437\u0430!",
          ticksRemaining: 2400
        };
        world8.sendMessage(
          `\xA75\xA7l[\u0413\u041B\u041E\u0411\u0410\u041B\u042C\u041D\u041E\u0415 \u0421\u041E\u0411\u042B\u0422\u0418\u0415] ${this.currentEvent.name}!\xA7r
\xA7d${this.currentEvent.description}\xA7r`
        );
        break;
      case "\u0417\u043E\u043B\u043E\u0442\u0430\u044F \u041B\u0438\u0445\u043E\u0440\u0430\u0434\u043A\u0430 \u0432 \u0448\u0430\u0445\u0442\u0430\u0445" /* GoldRush */:
        this.currentEvent = {
          type,
          name: "\u2728 \u0417\u041E\u041B\u041E\u0422\u0410\u042F \u041B\u0418\u0425\u041E\u0420\u0410\u0414\u041A\u0410 \u0412 \u0428\u0410\u0425\u0422\u0410\u0425",
          description: "\u0412 \u0433\u043B\u0443\u0431\u0438\u043D\u0430\u0445 \u0440\u0443\u0434\u043D\u0438\u043A\u043E\u0432 \u043E\u0442\u043A\u0440\u044B\u0442\u044B \u0431\u043E\u0433\u0430\u0442\u0435\u0439\u0448\u0438\u0435 \u0437\u043E\u043B\u043E\u0442\u044B\u0435 \u0436\u0438\u043B\u044B! \u0414\u043E\u0445\u043E\u0434\u044B \u0448\u0430\u0445\u0442\u0435\u0440\u0441\u043A\u0438\u0445 \u0433\u043E\u0440\u043E\u0434\u043E\u0432 \u0443\u0434\u0432\u043E\u0435\u043D\u044B, \u0430 \u0431\u0430\u043D\u0434\u0438\u0442\u044B \u0443\u0441\u0442\u0440\u043E\u0438\u043B\u0438 \u043E\u0445\u043E\u0442\u0443 \u043D\u0430 \u043A\u0443\u043F\u0435\u0447\u0435\u0441\u043A\u0438\u0435 \u043A\u0430\u0440\u0430\u0432\u0430\u043D\u044B!",
          ticksRemaining: 3e3
        };
        world8.sendMessage(
          `\xA7a\xA7l[\u0413\u041B\u041E\u0411\u0410\u041B\u042C\u041D\u041E\u0415 \u0421\u041E\u0411\u042B\u0422\u0418\u0415] ${this.currentEvent.name}!\xA7r
\xA7e${this.currentEvent.description}\xA7r`
        );
        break;
      case "\u0412\u0435\u043B\u0438\u043A\u043E\u0435 \u041A\u0440\u0435\u0441\u0442\u044C\u044F\u043D\u0441\u043A\u043E\u0435 \u0412\u043E\u0441\u0441\u0442\u0430\u043D\u0438\u0435" /* PeasantUprising */:
        this.currentEvent = {
          type,
          name: "\u26A1 \u041A\u0420\u0415\u0421\u0422\u042C\u042F\u041D\u0421\u041A\u0418\u0419 \u0411\u0423\u041D\u0422",
          description: "\u0412\u043E\u043B\u043D\u0430 \u043C\u044F\u0442\u0435\u0436\u0435\u0439 \u043F\u0440\u043E\u043A\u0430\u0442\u0438\u043B\u0430\u0441\u044C \u043F\u043E \u0444\u0435\u043E\u0434\u0430\u043B\u044C\u043D\u044B\u043C \u0437\u0435\u043C\u043B\u044F\u043C! \u0412\u043E\u043E\u0440\u0443\u0436\u0435\u043D\u043D\u044B\u0435 \u043E\u043F\u043E\u043B\u0447\u0435\u043D\u0446\u044B \u043F\u0435\u0440\u0435\u043A\u0440\u044B\u043B\u0438 \u0442\u043E\u0440\u0433\u043E\u0432\u044B\u0435 \u0442\u0440\u0430\u043A\u0442\u044B!",
          ticksRemaining: 2400
        };
        world8.sendMessage(
          `\xA7c\xA7l[\u0413\u041B\u041E\u0411\u0410\u041B\u042C\u041D\u041E\u0415 \u0421\u041E\u0411\u042B\u0422\u0418\u0415] ${this.currentEvent.name}!\xA7r
\xA7e${this.currentEvent.description}\xA7r`
        );
        break;
      default:
        this.currentEvent = {
          type: "\u0421\u043F\u043E\u043A\u043E\u0439\u043D\u043E\u0435 \u0432\u0440\u0435\u043C\u044F" /* None */,
          name: "\u041C\u0438\u0440\u043D\u0430\u044F \u044D\u043F\u043E\u0445\u0430",
          description: "\u0412 \u0444\u0435\u043E\u0434\u0430\u043B\u044C\u043D\u044B\u0445 \u0437\u0435\u043C\u043B\u044F\u0445 \u0446\u0430\u0440\u0438\u0442 \u043F\u043E\u043A\u043E\u0439.",
          ticksRemaining: 2400
        };
        break;
    }
  }
};
WorldEventsEngine.currentEvent = {
  type: "\u0421\u043F\u043E\u043A\u043E\u0439\u043D\u043E\u0435 \u0432\u0440\u0435\u043C\u044F" /* None */,
  name: "\u041C\u0438\u0440\u043D\u0430\u044F \u044D\u043F\u043E\u0445\u0430",
  description: "\u0412 \u0444\u0435\u043E\u0434\u0430\u043B\u044C\u043D\u044B\u0445 \u0437\u0435\u043C\u043B\u044F\u0445 \u0446\u0430\u0440\u0438\u0442 \u0445\u0440\u0443\u043F\u043A\u043E\u0435 \u0440\u0430\u0432\u043D\u043E\u0432\u0435\u0441\u0438\u0435 \u043C\u0435\u0436\u0434\u0443 \u043A\u043E\u0440\u043E\u043B\u0435\u0432\u0441\u0442\u0432\u0430\u043C\u0438.",
  ticksRemaining: 1200
};

// behavior_pack/scripts/VirtualWorldEngine.ts
var VirtualWorldEngine = class {
  static initializeDefaultRealms() {
    const saved = world9.getDynamicProperty("feudal_virtual_settlements");
    if (typeof saved === "string") {
      try {
        const parsed = JSON.parse(saved);
        this.settlements = new Map(parsed);
      } catch {
      }
    }
    if (this.settlements.size === 0) {
      this.registerSettlement({
        factionId: "fact_kingdom_1",
        tier: 2 /* Village */,
        throneLocation: { x: 100, y: 68, z: 100 },
        dimensionId: "minecraft:overworld",
        treasury: { wood: 500, stone: 300, iron: 80, emeralds: 90, food: 450 },
        population: 180,
        militaryCount: 45,
        // 25% of population
        taxRatePercent: 10,
        economicProfile: "\u0410\u0433\u0440\u0430\u0440\u043D\u0430\u044F \u0436\u0438\u0442\u043D\u0438\u0446\u0430" /* AgrarianBreadbasket */,
        rulerTrait: "\u0411\u043B\u0430\u0433\u043E\u0440\u043E\u0434\u043D\u044B\u0439" /* Honorable */
      });
      this.registerSettlement({
        factionId: "fact_rival_2",
        tier: 4 /* FortressCity */,
        throneLocation: { x: -600, y: 72, z: 800 },
        dimensionId: "minecraft:overworld",
        treasury: { wood: 2400, stone: 3200, iron: 650, emeralds: 500, food: 2800 },
        population: 1450,
        // 1450 CITIZENS!
        militaryCount: 500,
        // ~35% army!
        taxRatePercent: 20,
        economicProfile: "\u0412\u043E\u0435\u043D\u043D\u0430\u044F \u0446\u0438\u0442\u0430\u0434\u0435\u043B\u044C" /* MilitaryFortress */,
        rulerTrait: "\u041A\u0440\u043E\u0432\u043E\u0436\u0430\u0434\u043D\u044B\u0439" /* Warlord */
      });
      this.registerSettlement({
        factionId: "fact_empire_3",
        tier: 5 /* BigCity */,
        throneLocation: { x: 1200, y: 70, z: -900 },
        dimensionId: "minecraft:overworld",
        treasury: { wood: 4500, stone: 3800, iron: 900, emeralds: 1400, food: 5e3 },
        population: 3200,
        // 3200 CITIZENS!
        militaryCount: 960,
        // 30% army!
        taxRatePercent: 15,
        economicProfile: "\u0422\u043E\u0440\u0433\u043E\u0432\u044B\u0439 \u043C\u0435\u0433\u0430\u043F\u043E\u043B\u0438\u0441" /* TradeMetropolis */,
        rulerTrait: "\u041C\u0443\u0434\u0440\u044B\u0439" /* Wise */
      });
      this.registerBanditClan({
        id: "clan_black_ravens",
        name: "\u041E\u0440\u0434\u0430 \u0427\u0435\u0440\u043D\u044B\u0445 \u0412\u043E\u0440\u043E\u043D\u043E\u0432",
        location: { x: -350, y: 70, z: 450 },
        dimensionId: "minecraft:overworld",
        raiderCount: 280,
        // Massive 280 raiders!
        plunderTreasury: 250,
        catapultsCount: 3,
        aggressionTargetId: "fact_kingdom_1"
      });
      this.registerBanditClan({
        id: "clan_steppe_horde",
        name: "\u0421\u0442\u0435\u043F\u043D\u0430\u044F \u041E\u0440\u0434\u0430 \u041D\u0430\u043B\u0435\u0442\u0447\u0438\u043A\u043E\u0432",
        location: { x: -950, y: 68, z: 1200 },
        dimensionId: "minecraft:overworld",
        raiderCount: 650,
        // Massive 650 raiders!
        plunderTreasury: 550,
        catapultsCount: 5,
        aggressionTargetId: "fact_rival_2"
      });
    }
  }
  static registerSettlement(settlement) {
    this.settlements.set(settlement.factionId, settlement);
    this.saveState();
  }
  static getSettlement(id) {
    return this.settlements.get(id);
  }
  static getAllSettlements() {
    return this.settlements;
  }
  static registerBanditClan(clan) {
    this.banditClans.set(clan.id, clan);
  }
  /**
   * Bedrock Native Chunkloading via Ticking Areas.
   * Keeps the most vital capitals loaded so physical simulation continues regardless of player distance.
   */
  static ensureTickingArea(settlement) {
    const areaName = `feudal_${settlement.factionId.slice(0, 10)}`;
    if (this.registeredTickingAreas.has(areaName)) return;
    try {
      const dim = world9.getDimension(settlement.dimensionId);
      const pos = settlement.throneLocation;
      dim.runCommand(`tickingarea add circle ${Math.floor(pos.x)} ${Math.floor(pos.y)} ${Math.floor(pos.z)} 2 ${areaName}`);
      this.registeredTickingAreas.add(areaName);
      console.warn(`[TickingArea] \u0417\u0430\u043F\u0443\u0449\u0435\u043D \u043F\u043E\u0441\u0442\u043E\u044F\u043D\u043D\u044B\u0439 \u0447\u0430\u043D\u043A\u043B\u043E\u0430\u0434\u0435\u0440 \u0434\u043B\u044F ${settlement.factionId} \u043D\u0430 [${pos.x}, ${pos.z}]`);
    } catch {
    }
  }
  /**
   * Virtual World Cycle (runs independently of chunk loading).
   * Simulates production, population changes, upgrades and war across all distant settlements.
   */
  static tickVirtualWorld() {
    this.lastSimTick++;
    if (this.lastSimTick % 600 !== 0) return;
    WorldEventsEngine.tick();
    for (const settlement of this.settlements.values()) {
      const pop = settlement.population;
      const prodFactor = Math.max(5, Math.floor(pop * 0.08));
      settlement.treasury.wood += prodFactor * 3;
      settlement.treasury.stone += prodFactor * 2;
      settlement.treasury.iron += Math.floor(prodFactor * 0.5);
      settlement.treasury.food += prodFactor * 4;
      settlement.treasury.emeralds += Math.floor(prodFactor * 0.3);
      if (settlement.treasury.food > pop * 2) {
        settlement.population += Math.max(2, Math.floor(pop * 0.03));
        settlement.treasury.food -= Math.floor(pop * 0.05);
      }
      CityProgression.recalculateMilitary(settlement);
      if (CityProgression.canUpgrade(settlement)) {
        if (CityProgression.upgradeTier(settlement)) {
          this.pendingMaterializations.set(settlement.factionId, settlement.tier);
          const faction = FactionManager.getFaction(settlement.factionId);
          world9.sendMessage(
            `[\u041B\u0435\u0442\u043E\u043F\u0438\u0441\u044C \u041C\u0438\u0440\u0430] \u0414\u0430\u043B\u0435\u043A\u043E\u0435 \u043A\u043E\u0440\u043E\u043B\u0435\u0432\u0441\u0442\u0432\u043E "${faction?.name ?? settlement.factionId}" \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u043B\u043E \u044D\u0432\u043E\u043B\u044E\u0446\u0438\u044E \u0434\u043E: ${CityTier[settlement.tier]}!`
          );
        }
      }
    }
    for (const clan of this.banditClans.values()) {
      clan.raiderCount += Math.floor(Math.random() * 5);
      if (clan.aggressionTargetId) {
        const targetTown = this.settlements.get(clan.aggressionTargetId);
        if (targetTown && clan.raiderCount > 40) {
          const defensePower = AllianceSystem.calculateCombinedDefense(targetTown);
          const siegeArtilleryBonus = (clan.catapultsCount ?? 2) * 120;
          const attackPower = clan.raiderCount * 6 + siegeArtilleryBonus;
          if (attackPower > defensePower) {
            const stolenEmeralds = Math.min(150, Math.floor(targetTown.treasury.emeralds * 0.3));
            const stolenFood = Math.min(300, Math.floor(targetTown.treasury.food * 0.3));
            targetTown.treasury.emeralds -= stolenEmeralds;
            targetTown.treasury.food -= stolenFood;
            clan.plunderTreasury += stolenEmeralds;
            clan.raiderCount = Math.max(30, clan.raiderCount - 15);
            world9.sendMessage(
              `\xA7c[\u041E\u0421\u0410\u0414\u0410] ${clan.name} \u043F\u0440\u0438\u043C\u0435\u043D\u0438\u043B \u043A\u0430\u0442\u0430\u043F\u0443\u043B\u044C\u0442\u044B \u0438 \u043F\u0440\u043E\u0440\u0432\u0430\u043B \u0443\u043A\u0440\u0435\u043F\u043B\u0435\u043D\u0438\u044F ${targetTown.factionId}! \u0420\u0430\u0437\u0433\u0440\u0430\u0431\u043B\u0435\u043D\u043E ${stolenEmeralds} \u0438\u0437\u0443\u043C\u0440\u0443\u0434\u043E\u0432 \u0438 \u043E\u0431\u043E\u0437 \u0441 \u043F\u0440\u043E\u0432\u0438\u0430\u043D\u0442\u043E\u043C!\xA7r`
            );
          } else {
            clan.raiderCount = Math.max(20, clan.raiderCount - 25);
            targetTown.treasury.emeralds += 80;
            world9.sendMessage(
              `\xA7b[\u041E\u0431\u043E\u0440\u043E\u043D\u0430 \u0413\u043E\u0440\u043E\u0434\u0430] \u0413\u0430\u0440\u043D\u0438\u0437\u043E\u043D \u0438 \u0441\u043E\u044E\u0437\u043D\u0438\u043A\u0438 ${targetTown.factionId} \u043E\u0433\u043D\u0435\u043C \u0431\u0430\u043B\u043B\u0438\u0441\u0442 \u0438 \u043B\u0430\u0432\u0438\u043D\u043E\u0439 \u0441\u0442\u0440\u0435\u043B \u0440\u0430\u0437\u0433\u0440\u043E\u043C\u0438\u043B\u0438 \u0448\u0442\u0443\u0440\u043C \u043E\u0440\u0434\u044B \u0440\u0430\u0437\u0431\u043E\u0439\u043D\u0438\u043A\u043E\u0432!\xA7r`
            );
          }
        }
      }
    }
    this.saveState();
  }
  /**
   * When a player approaches a distant settlement that evolved in the background,
   * this physically materializes new buildings and citizens.
   */
  static checkPlayerProximityAndMaterialize(playerPos, playerDimId) {
    for (const [factionId, pendingTier] of this.pendingMaterializations.entries()) {
      const settlement = this.settlements.get(factionId);
      if (!settlement || settlement.dimensionId !== playerDimId) continue;
      const distSq = Math.pow(playerPos.x - settlement.throneLocation.x, 2) + Math.pow(playerPos.z - settlement.throneLocation.z, 2);
      if (distSq < 4096) {
        this.pendingMaterializations.delete(factionId);
        const towerPos = {
          x: settlement.throneLocation.x + 8,
          y: settlement.throneLocation.y,
          z: settlement.throneLocation.z + 8
        };
        BuildingEngine.startConstruction(
          settlement.dimensionId,
          towerPos,
          3,
          7,
          BuildingEngine.getStoneTowerBlueprint()
        );
        this.spawnCitizensForTier(settlement);
        world9.sendMessage(
          `[\u041C\u0430\u0442\u0435\u0440\u0438\u0430\u043B\u0438\u0437\u0430\u0446\u0438\u044F] \u0413\u043E\u0440\u043E\u0434 ${factionId} \u0432\u0441\u0442\u0440\u0435\u0447\u0430\u0435\u0442 \u0432\u0430\u0441 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u043D\u044B\u043C \u0440\u0443\u0431\u0435\u0436\u043E\u043C \u0438 \u0433\u0430\u0440\u043D\u0438\u0437\u043E\u043D\u043E\u043C!`
        );
      }
    }
  }
  static spawnCitizensForTier(settlement) {
    const dim = world9.getDimension(settlement.dimensionId);
    if (!dim) return;
    const loc = settlement.throneLocation;
    const professions = [
      "feudal:miner",
      "feudal:lumberjack",
      "feudal:blacksmith",
      "feudal:merchant",
      "feudal:farmer",
      "feudal:lamplighter",
      "feudal:city_guard"
    ];
    for (const prof of professions) {
      try {
        dim.spawnEntity(prof, {
          x: loc.x + (Math.random() * 6 - 3),
          y: loc.y,
          z: loc.z + (Math.random() * 6 - 3)
        });
      } catch {
      }
    }
  }
  static saveState() {
    world9.setDynamicProperty(
      "feudal_virtual_settlements",
      JSON.stringify(Array.from(this.settlements.entries()))
    );
  }
};
VirtualWorldEngine.settlements = /* @__PURE__ */ new Map();
VirtualWorldEngine.banditClans = /* @__PURE__ */ new Map();
VirtualWorldEngine.pendingMaterializations = /* @__PURE__ */ new Map();
VirtualWorldEngine.registeredTickingAreas = /* @__PURE__ */ new Set();
VirtualWorldEngine.lastSimTick = 0;

// behavior_pack/scripts/BorderManager.ts
import { world as world10, BlockPermutation as BlockPermutation2 } from "@minecraft/server";
var BorderManager = class {
  /**
   * Calculates dynamic city border radius based on tier:
   * Tier 1 (Camp): 48 blocks
   * Tier 2 (Village): 96 blocks
   * Tier 3 (SmallTown): 160 blocks
   * Tier 4 (FortressCity): 256 blocks
   * Tier 5 (BigCity): 384 blocks
   * Tier 6 (Metropolis): 512 blocks
   * Tier 7 (Capital): 768 blocks
   */
  static getCityRadius(tier) {
    switch (tier) {
      case 1 /* Camp */:
        return 48;
      case 2 /* Village */:
        return 96;
      case 3 /* SmallTown */:
        return 160;
      case 4 /* FortressCity */:
        return 256;
      case 5 /* BigCity */:
        return 384;
      case 6 /* Metropolis */:
        return 512;
      case 7 /* Capital */:
        return 768;
      default:
        return 64;
    }
  }
  static updateBordersForSettlement(settlement) {
    const faction = FactionManager.getFaction(settlement.factionId);
    const radius = this.getCityRadius(settlement.tier);
    const vassalCount = faction?.vassalIds.length ?? 0;
    const totalArea = Math.PI * Math.pow(radius, 2) + vassalCount * Math.PI * Math.pow(96, 2);
    const borderData = {
      factionId: settlement.factionId,
      rulerTitle: faction?.title ?? "\u0412\u043E\u0436\u0434\u044C",
      capitalLocation: settlement.throneLocation,
      cityRadius: radius,
      totalTerritoryAreaSqKm: Math.round(totalArea / 1e6 * 100) / 100,
      vassalSettlementIds: faction?.vassalIds ?? [],
      frontierMarkers: []
    };
    this.borders.set(settlement.factionId, borderData);
    return borderData;
  }
  static getBorder(factionId) {
    return this.borders.get(factionId);
  }
  static getAllBorders() {
    return this.borders;
  }
  /**
   * Automatically places boundary stones along the city perimeter at primary cardinal directions.
   */
  static placeFrontierBoundaryStone(settlement, directionAngle) {
    const dim = world10.getDimension(settlement.dimensionId);
    if (!dim) return;
    const radius = this.getCityRadius(settlement.tier);
    const targetX = Math.floor(settlement.throneLocation.x + Math.cos(directionAngle) * radius);
    const targetZ = Math.floor(settlement.throneLocation.z + Math.sin(directionAngle) * radius);
    const yCenter = settlement.throneLocation.y;
    for (let dy = 6; dy >= -6; dy--) {
      const groundPos = { x: targetX, y: yCenter + dy, z: targetZ };
      const ground = dim.getBlock(groundPos);
      const airPos = { x: targetX, y: yCenter + dy + 1, z: targetZ };
      const air = dim.getBlock(airPos);
      if (ground && !ground.isAir && air && air.isAir) {
        try {
          air.setPermutation(BlockPermutation2.resolve("feudal:boundary_stone"));
          dim.spawnParticle("minecraft:totem_particle", {
            x: targetX + 0.5,
            y: yCenter + dy + 1.5,
            z: targetZ + 0.5
          });
          const border = this.borders.get(settlement.factionId);
          if (border) border.frontierMarkers.push(airPos);
          break;
        } catch {
        }
      }
    }
  }
  /**
   * Checks if a coordinate is within a settlement's legal city borders.
   */
  static isInsideSettlement(pos, settlement) {
    const radius = this.getCityRadius(settlement.tier);
    const dx = pos.x - settlement.throneLocation.x;
    const dz = pos.z - settlement.throneLocation.z;
    return dx * dx + dz * dz <= radius * radius;
  }
};
BorderManager.borders = /* @__PURE__ */ new Map();

// behavior_pack/scripts/ColonizationEngine.ts
import { world as world11, BlockPermutation as BlockPermutation3 } from "@minecraft/server";
var ColonizationEngine = class {
  /**
   * Checks if a city can send a colonization expedition.
   * Requires Tier 4 (Fortress City) or higher and surplus treasury.
   */
  static canColonize(settlement) {
    return settlement.tier >= 4 /* FortressCity */ && settlement.treasury.wood >= 400 && settlement.treasury.stone >= 250 && settlement.treasury.food >= 150 && settlement.treasury.emeralds >= 40 && settlement.population >= 30;
  }
  /**
   * Dispatches a colonization expedition to establish a new frontier village.
   */
  static launchExpedition(settlement, customColonyName) {
    if (!this.canColonize(settlement)) {
      return "";
    }
    settlement.treasury.wood -= 400;
    settlement.treasury.stone -= 250;
    settlement.treasury.food -= 150;
    settlement.treasury.emeralds -= 40;
    settlement.population -= 6;
    const parentFaction = FactionManager.getFaction(settlement.factionId);
    const parentName = parentFaction?.name ?? "\u041A\u043E\u0440\u043E\u043B\u0435\u0432\u0441\u0442\u0432\u043E";
    const colonyName = customColonyName ?? `\u041D\u043E\u0432\u044B\u0439 ${parentName}`;
    const angle = Math.random() * Math.PI * 2;
    const distance = 600 + Math.random() * 600;
    const targetX = Math.floor(settlement.throneLocation.x + Math.cos(angle) * distance);
    const targetZ = Math.floor(settlement.throneLocation.z + Math.sin(angle) * distance);
    const targetLoc = { x: targetX, y: 70, z: targetZ };
    const missionId = `colony_exp_${Date.now()}`;
    const dim = world11.getDimension(settlement.dimensionId);
    let leaderId = void 0;
    try {
      const leader = dim.spawnEntity("feudal:colonist", {
        x: settlement.throneLocation.x + 2,
        y: settlement.throneLocation.y,
        z: settlement.throneLocation.z + 2
      });
      leader.nameTag = `\u041B\u0438\u0434\u0435\u0440 \u043A\u043E\u043B\u043E\u043D\u0438\u0441\u0442\u043E\u0432: ${colonyName}`;
      leader.addTag(`colony_expedition:${missionId}`);
      leaderId = leader.id;
      const mule = dim.spawnEntity("minecraft:mule", {
        x: settlement.throneLocation.x + 3,
        y: settlement.throneLocation.y,
        z: settlement.throneLocation.z + 1
      });
      mule.nameTag = "\u041F\u0440\u0438\u043F\u0430\u0441\u044B \u043A\u043E\u043B\u043E\u043D\u0438\u0441\u0442\u043E\u0432";
    } catch {
    }
    const mission = {
      id: missionId,
      parentSettlementId: settlement.factionId,
      colonyName,
      origin: settlement.throneLocation,
      targetLocation: targetLoc,
      dimensionId: settlement.dimensionId,
      colonistLeaderId: leaderId,
      progressPercent: 0,
      established: false
    };
    this.activeExpeditions.set(missionId, mission);
    world11.sendMessage(
      `[\u0412\u0435\u043B\u0438\u043A\u0430\u044F \u041A\u043E\u043B\u043E\u043D\u0438\u0437\u0430\u0446\u0438\u044F] \u0418\u0437 \u0433\u043E\u0440\u043E\u0434\u0430 ${settlement.factionId} \u0432\u044B\u0434\u0432\u0438\u043D\u0443\u043B\u0441\u044F \u043E\u0442\u0440\u044F\u0434 \u043A\u043E\u043B\u043E\u043D\u0438\u0441\u0442\u043E\u0432 \u043E\u0441\u043D\u043E\u0432\u044B\u0432\u0430\u0442\u044C \u043F\u043E\u0441\u0435\u043B\u0435\u043D\u0438\u0435 "${colonyName}"!`
    );
    return missionId;
  }
  static tick() {
    for (const [id, mission] of this.activeExpeditions.entries()) {
      if (mission.established) continue;
      mission.progressPercent += 5;
      if (mission.progressPercent >= 100) {
        mission.established = true;
        this.activeExpeditions.delete(id);
        this.foundColony(mission);
      }
    }
  }
  /**
   * Colonists arrive at destination: establishes new Throne, registers Faction and Colony Settlement.
   */
  static foundColony(mission) {
    const colonyFactionId = `colony_${Date.now()}`;
    const dim = world11.getDimension(mission.dimensionId);
    const newBanner = FactionManager.generateUniqueBanner("village");
    const colonyFaction = {
      id: colonyFactionId,
      name: mission.colonyName,
      type: "village",
      banner: newBanner,
      overlordId: mission.parentSettlementId,
      vassalIds: [],
      rulerName: "\u041F\u0435\u0440\u0432\u043E\u043F\u0440\u043E\u0445\u043E\u0434\u0435\u0446",
      title: "\u0421\u0442\u0430\u0440\u043E\u0441\u0442\u0430"
    };
    FactionManager.registerFaction(colonyFaction);
    const parentFaction = FactionManager.getFaction(mission.parentSettlementId);
    if (parentFaction) {
      parentFaction.vassalIds.push(colonyFactionId);
      FactionManager.registerFaction(parentFaction);
    }
    const pos = mission.targetLocation;
    try {
      const throneBlock = dim.getBlock(pos);
      if (throneBlock) {
        throneBlock.setPermutation(BlockPermutation3.resolve("feudal:throne"));
      }
    } catch {
    }
    const newColonySettlement = {
      factionId: colonyFactionId,
      tier: 1 /* Camp */,
      throneLocation: pos,
      dimensionId: mission.dimensionId,
      treasury: { wood: 100, stone: 60, iron: 15, emeralds: 20, food: 100 },
      population: 10,
      militaryCount: 2,
      taxRatePercent: 12
    };
    VirtualWorldEngine.registerSettlement(newColonySettlement);
    try {
      dim.spawnEntity("feudal:colonist", { x: pos.x + 1, y: pos.y, z: pos.z });
      dim.spawnEntity("feudal:lumberjack", { x: pos.x - 1, y: pos.y, z: pos.z });
      dim.spawnEntity("feudal:miner", { x: pos.x, y: pos.y, z: pos.z + 1 });
      dim.spawnEntity("feudal:lamplighter", { x: pos.x, y: pos.y, z: pos.z - 1 });
    } catch {
    }
    world11.sendMessage(
      `[\u041E\u0441\u043D\u043E\u0432\u0430\u043D\u0438\u0435 \u041A\u043E\u043B\u043E\u043D\u0438\u0438] \u041F\u0435\u0440\u0432\u043E\u043F\u0440\u043E\u0445\u043E\u0434\u0446\u044B \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0437\u0430\u043B\u043E\u0436\u0438\u043B\u0438 \u0422\u0440\u043E\u043D \u0438 \u043E\u0441\u043D\u043E\u0432\u0430\u043B\u0438 \u043F\u043E\u0441\u0435\u043B\u0435\u043D\u0438\u0435 "${mission.colonyName}" \u043D\u0430 \u043A\u043E\u043E\u0440\u0434\u0438\u043D\u0430\u0442\u0430\u0445 [${pos.x}, ${pos.z}]!`
    );
  }
  static getActiveExpeditions() {
    return this.activeExpeditions;
  }
};
ColonizationEngine.activeExpeditions = /* @__PURE__ */ new Map();

// behavior_pack/scripts/WorldMapUI.ts
var WorldMapUI = class {
  static openRealmMap(player) {
    const settlements = VirtualWorldEngine.getAllSettlements();
    const expeditions = ColonizationEngine.getActiveExpeditions();
    let overviewText = `\xA7l\xA76=== \u041A\u041E\u0420\u041E\u041B\u0415\u0412\u0421\u041A\u0418\u0419 \u0410\u0422\u041B\u0410\u0421 \u0417\u0415\u041C\u0415\u041B\u042C ===\xA7r
`;
    overviewText += `\xA77\u041A\u0430\u0440\u0442\u043E\u0433\u0440\u0430\u0444\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u043F\u0430\u043B\u0430\u0442\u0430 \u0432\u0435\u0434\u0435\u0442 \u043D\u0435\u043F\u0440\u0435\u0440\u044B\u0432\u043D\u044B\u0439 \u0443\u0447\u0435\u0442 \u0433\u0440\u0430\u043D\u0438\u0446 \u0438 \u0432\u043B\u0430\u0434\u0435\u043D\u0438\u0439.\xA7r

`;
    overviewText += `\xA7e\xA7l\u0418\u0417\u0412\u0415\u0421\u0422\u041D\u042B\u0415 \u0413\u041E\u0420\u041E\u0414\u0410 \u0418 \u041A\u041E\u0420\u041E\u041B\u0415\u0412\u0421\u0422\u0412\u0410:\xA7r
`;
    for (const s of settlements.values()) {
      const faction = FactionManager.getFaction(s.factionId);
      const border = BorderManager.updateBordersForSettlement(s);
      const banner = faction?.banner;
      const crestDesc = banner ? `${banner.baseColor} / ${banner.patternColor} (${banner.patternType}, ${banner.symbol})` : "\u0418\u043C\u043F\u0435\u0440\u0441\u043A\u0438\u0439 \u0448\u0442\u0430\u043D\u0434\u0430\u0440\u0442";
      overviewText += `\xA7b\u{1F3F0} ${faction?.name ?? s.factionId}\xA7r
`;
      overviewText += `  \u2022 \u0422\u0438\u0442\u0443\u043B: \xA7f${faction?.title ?? "\u0412\u043E\u0436\u0434\u044C"} ${faction?.rulerName ?? ""}\xA7r
`;
      overviewText += `  \u2022 \u042D\u043F\u043E\u0445\u0430: \xA7a${CityTier[s.tier]}\xA7r | \u041D\u0430\u0441\u0435\u043B\u0435\u043D\u0438\u0435: \xA7f${s.population}\xA7r (\u0410\u0440\u043C\u0438\u044F: \xA7c${s.militaryCount}\xA7r)
`;
      overviewText += `  \u2022 \u041A\u043E\u043E\u0440\u0434\u0438\u043D\u0430\u0442\u044B \u0422\u0440\u043E\u043D\u0430: \xA77[${Math.floor(s.throneLocation.x)}, ${Math.floor(s.throneLocation.z)}]\xA7r
`;
      overviewText += `  \u2022 \u0413\u0440\u0430\u043D\u0438\u0446\u0430 \u0433\u043E\u0440\u043E\u0434\u0430: \xA76${border.cityRadius} \u0431\u043B\u043E\u043A\u043E\u0432\xA7r (\u041F\u043B\u043E\u0449\u0430\u0434\u044C: \xA7e${border.totalTerritoryAreaSqKm} \u043A\u0432.\u043A\u043C\xA7r)
`;
      overviewText += `  \u2022 \u0413\u0435\u0440\u0431\u043E\u0432\u044B\u0439 \u0449\u0438\u0442: \xA7d${crestDesc}\xA7r
`;
      if (faction?.vassalIds && faction.vassalIds.length > 0) {
        overviewText += `  \u2022 \u0412\u0430\u0441\u0441\u0430\u043B\u044B \u0438 \u043A\u043E\u043B\u043E\u043D\u0438\u0438: \xA72${faction.vassalIds.length} \u043F\u043E\u0441\u0435\u043B\u0435\u043D\u0438\u0439\xA7r
`;
      }
      overviewText += `
`;
    }
    if (expeditions.size > 0) {
      overviewText += `\xA7e\xA7l\u0410\u041A\u0422\u0418\u0412\u041D\u042B\u0415 \u041A\u041E\u041B\u041E\u041D\u0418\u0417\u0410\u0426\u0418\u041E\u041D\u041D\u042B\u0415 \u042D\u041A\u0421\u041F\u0415\u0414\u0418\u0426\u0418\u0418:\xA7r
`;
      for (const exp of expeditions.values()) {
        overviewText += `\u{1F6A9} \xA7f${exp.colonyName}\xA7r (\u043E\u0442 ${exp.parentSettlementId}) -> [${exp.targetLocation.x}, ${exp.targetLocation.z}] (${exp.progressPercent}% \u043F\u0443\u0442\u0438)
`;
      }
      overviewText += `
`;
    }
    const form = new ActionFormData().title("\u0410\u0442\u043B\u0430\u0441 \u041A\u043E\u0440\u043E\u043B\u0435\u0432\u0441\u0442\u0432 \u0438 \u0413\u0440\u0430\u043D\u0438\u0446").body(overviewText).button("\u041F\u043E\u0434\u0440\u043E\u0431\u043D\u044B\u0439 \u043E\u0442\u0447\u0435\u0442 \u041A\u0430\u0440\u0442\u043E\u0433\u0440\u0430\u0444\u0430").button("\u0420\u0430\u0437\u043C\u0435\u0441\u0442\u0438\u0442\u044C \u043C\u0435\u0436\u0435\u0432\u044B\u0435 \u043F\u043E\u0433\u0440\u0430\u043D\u0438\u0447\u043D\u044B\u0435 \u043A\u0430\u043C\u043D\u0438").button("\u0417\u0430\u043A\u0440\u044B\u0442\u044C");
    form.show(player).then((res) => {
      if (res.canceled) return;
      if (res.selection === 0) {
        this.showCartographerReport(player);
      } else if (res.selection === 1) {
        this.placeBoundaryMarkers(player);
      }
    });
  }
  static showCartographerReport(player) {
    const reportForm = new MessageFormData().title("\u0417\u0430\u043F\u0438\u0441\u043A\u0438 \u041A\u043E\u0440\u043E\u043B\u0435\u0432\u0441\u043A\u043E\u0433\u043E \u041A\u0430\u0440\u0442\u043E\u0433\u0440\u0430\u0444\u0430").body(
      `\xA7l\xA76\u041B\u0435\u0442\u043E\u043F\u0438\u0441\u044C \u0437\u0435\u043C\u043B\u0435\u043C\u0435\u0440\u0430:\xA7r

1. \u0413\u0440\u0430\u043D\u0438\u0446\u044B \u0440\u0430\u0441\u0442\u0443\u0442 \u043F\u0440\u043E\u043F\u043E\u0440\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u043E \u044D\u043F\u043E\u0445\u0435: \u043E\u0442 48 \u0431\u043B\u043E\u043A\u043E\u0432 \u0432 \u041B\u0430\u0433\u0435\u0440\u0435 \u0434\u043E 768 \u0431\u043B\u043E\u043A\u043E\u0432 \u0432 \u0421\u0442\u043E\u043B\u0438\u0446\u0435.
2. \u0422\u043E\u0440\u0433\u043E\u0432\u044B\u0435 \u0442\u0440\u0430\u043A\u0442\u044B \u0441\u043E\u0435\u0434\u0438\u043D\u044F\u044E\u0442 \u0441\u043E\u044E\u0437\u043D\u044B\u0435 \u0433\u043E\u0440\u043E\u0434\u0430 \u043F\u043E \u0441\u0443\u0448\u0435, \u0430 \u043C\u043E\u0440\u0441\u043A\u0438\u0435 \u043A\u043E\u0433\u0433\u0438 \u0441\u0432\u044F\u0437\u044B\u0432\u0430\u044E\u0442 \u043F\u0440\u0438\u0431\u0440\u0435\u0436\u043D\u044B\u0435 \u043A\u043E\u043B\u043E\u043D\u0438\u0438.
3. \u0427\u0435\u0440\u0435\u0437 \u0440\u0435\u043A\u0438 \u0438 \u0431\u0440\u043E\u0434\u044B \u0438\u043D\u0436\u0435\u043D\u0435\u0440\u044B \u0432\u043E\u0437\u0432\u043E\u0434\u044F\u0442 \u0430\u0440\u043E\u0447\u043D\u044B\u0435 \u043A\u0430\u043C\u0435\u043D\u043D\u044B\u0435 \u043C\u043E\u0441\u0442\u044B \u0441 \u0444\u043E\u043D\u0430\u0440\u044F\u043C\u0438.
4. \u0414\u043B\u044F \u043E\u0441\u043D\u043E\u0432\u0430\u043D\u0438\u044F \u043D\u043E\u0432\u043E\u0439 \u0437\u0430\u043C\u043E\u0440\u0441\u043A\u043E\u0439 \u043A\u043E\u043B\u043E\u043D\u0438\u0438 \u0433\u043E\u0440\u043E\u0434 \u0434\u043E\u043B\u0436\u0435\u043D \u0434\u043E\u0441\u0442\u0438\u0447\u044C 4 \u044D\u043F\u043E\u0445\u0438 (\u0413\u043E\u0440\u043E\u0434-\u043A\u0440\u0435\u043F\u043E\u0441\u0442\u044C).`
    ).button1("\u041F\u0440\u0438\u043D\u044F\u0442\u044C \u043A \u0441\u0432\u0435\u0434\u0435\u043D\u0438\u044E").button2("\u041D\u0430\u0437\u0430\u0434 \u0432 \u0410\u0442\u043B\u0430\u0441");
    reportForm.show(player).then((res) => {
      if (!res.canceled && res.selection === 1) {
        this.openRealmMap(player);
      }
    });
  }
  static placeBoundaryMarkers(player) {
    const settlement = VirtualWorldEngine.getAllSettlements().get("fact_kingdom_1");
    if (!settlement) return;
    BorderManager.placeFrontierBoundaryStone(settlement, 0);
    BorderManager.placeFrontierBoundaryStone(settlement, Math.PI / 2);
    BorderManager.placeFrontierBoundaryStone(settlement, Math.PI);
    BorderManager.placeFrontierBoundaryStone(settlement, 3 * Math.PI / 2);
    player.sendMessage("[\u041A\u0430\u0440\u0442\u043E\u0433\u0440\u0430\u0444] \u041F\u043E\u0433\u0440\u0430\u043D\u0438\u0447\u043D\u044B\u0435 \u043C\u0435\u0436\u0435\u0432\u044B\u0435 \u043A\u0430\u043C\u043D\u0438 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u044B \u043D\u0430 \u0432\u043D\u0435\u0448\u043D\u0438\u0445 \u0440\u0443\u0431\u0435\u0436\u0430\u0445 \u0433\u043E\u0440\u043E\u0434\u0430!");
  }
};

// behavior_pack/scripts/PlayerRPGProfile.ts
import { Player as Player2, world as world12 } from "@minecraft/server";
var PlayerRPGProfile = class {
  static getProfile(player) {
    let profile = this.profiles.get(player.id);
    if (!profile) {
      const saved = world12.getDynamicProperty(`feudal_rpg_${player.id}`);
      if (typeof saved === "string") {
        try {
          profile = JSON.parse(saved);
        } catch {
        }
      }
      if (!profile) {
        const military = MilitaryCareer.getProfile(player);
        profile = {
          playerId: player.id,
          playerName: player.name,
          feudalTitle: military.rank,
          regularKills: 0,
          banditBossKills: 0,
          rulerKills: 0,
          siegeKills: 0,
          unlockedEpithets: []
        };
      }
      this.profiles.set(player.id, profile);
    }
    return profile;
  }
  static handleEntityKill(event) {
    const damageSource = event.damageSource;
    const killer = damageSource.damagingEntity;
    if (!killer || !(killer instanceof Player2)) return;
    const profile = this.getProfile(killer);
    const deadType = event.deadEntity?.typeId ?? "";
    if (deadType === "feudal:bandit_leader") {
      profile.banditBossKills++;
    } else if (deadType === "feudal:feudal_ruler") {
      profile.rulerKills++;
    } else if (deadType === "feudal:catapult" || deadType === "feudal:siege_ram" || deadType === "feudal:ballista") {
      profile.siegeKills++;
    } else {
      profile.regularKills++;
    }
    this.checkEpithetUnlocks(killer, profile);
    this.saveProfile(profile);
    this.applyHealthAndPassives(killer, profile);
  }
  static checkEpithetUnlocks(player, profile) {
    const checkAndAward = (name, condition, desc) => {
      if (condition && !profile.unlockedEpithets.includes(name)) {
        profile.unlockedEpithets.push(name);
        world12.sendMessage(
          `\xA76\xA7l[\u0411\u041E\u0415\u0412\u041E\u0419 \u042D\u041F\u0418\u0422\u0415\u0422]\xA7r \xA7e${player.name} \u0443\u0434\u043E\u0441\u0442\u043E\u0435\u043D \u043B\u0435\u0433\u0435\u043D\u0434\u0430\u0440\u043D\u043E\u0433\u043E \u0437\u0432\u0430\u043D\u0438\u044F \xA7d\xAB${name}\xBB\xA7r!
\xA77${desc}\xA7r`
        );
        try {
          player.dimension.spawnParticle("minecraft:totem_particle", {
            x: player.location.x,
            y: player.location.y + 1.8,
            z: player.location.z
          });
        } catch {
        }
      }
    };
    checkAndAward("\u0423\u0431\u0438\u0439\u0446\u0430 \u0434\u044E\u0436\u0438\u043D\u044B", profile.regularKills >= 12, "\u041F\u043E\u0431\u0435\u0434\u0430 \u043D\u0430\u0434 12 \u0432\u0440\u0430\u0433\u0430\u043C\u0438 (+2 HP, \u0421\u043A\u043E\u0440\u043E\u0441\u0442\u044C I)");
    checkAndAward("\u0423\u0431\u0438\u0439\u0446\u0430 \u0441\u043E\u0442\u043D\u0438", profile.regularKills >= 100, "\u041F\u043E\u0431\u0435\u0434\u0430 \u043D\u0430\u0434 100 \u0432\u0440\u0430\u0433\u0430\u043C\u0438 (+6 HP, \u0421\u043E\u043F\u0440\u043E\u0442\u0438\u0432\u043B\u0435\u043D\u0438\u0435 I)");
    checkAndAward("\u0423\u0431\u0438\u0439\u0446\u0430 \u0442\u044B\u0441\u044F\u0447\u0438", profile.regularKills >= 1e3, "\u041F\u043E\u0431\u0435\u0434\u0430 \u043D\u0430\u0434 1000 \u0432\u0440\u0430\u0433\u0430\u043C\u0438 (+12 HP, \u0421\u0438\u043B\u0430 I)");
    checkAndAward("\u0413\u0440\u043E\u0437\u0430 \u0431\u0430\u043D\u0434\u0438\u0442\u043E\u0432", profile.banditBossKills >= 3, "\u041F\u043E\u0432\u0435\u0440\u0436\u0435\u043D\u043E 3 \u0430\u0442\u0430\u043C\u0430\u043D\u0430 (+4 HP, \u044F\u0440\u043E\u0441\u0442\u044C \u0432\u043E\u0438\u043D\u0430)");
    checkAndAward("\u0418\u0441\u0442\u0440\u0435\u0431\u0438\u0442\u0435\u043B\u044C \u0430\u0442\u0430\u043C\u0430\u043D\u043E\u0432", profile.banditBossKills >= 10, "\u041F\u043E\u0432\u0435\u0440\u0436\u0435\u043D\u043E 10 \u0430\u0442\u0430\u043C\u0430\u043D\u043E\u0432 (+8 HP, \u0421\u043E\u043F\u0440\u043E\u0442\u0438\u0432\u043B\u0435\u043D\u0438\u0435 II)");
    checkAndAward("\u041D\u0438\u0441\u043F\u0440\u043E\u0432\u0435\u0440\u0433\u0430\u0442\u0435\u043B\u044C \u043A\u043E\u0440\u043E\u043B\u0435\u0439", profile.rulerKills >= 1, "\u0421\u0432\u0435\u0440\u0436\u0435\u043D\u0438\u0435 \u043C\u043E\u043D\u0430\u0440\u0445\u0430 (+10 HP, \u0446\u0430\u0440\u0441\u0442\u0432\u0435\u043D\u043D\u0430\u044F \u0430\u0443\u0440\u0430)");
    checkAndAward("\u041D\u0435\u0441\u043E\u043A\u0440\u0443\u0448\u0438\u043C\u044B\u0439 \u043E\u0441\u0430\u0434\u043D\u0438\u043A", profile.siegeKills >= 3, "\u0423\u043D\u0438\u0447\u0442\u043E\u0436\u0435\u043D\u043E 3 \u043E\u0441\u0430\u0434\u043D\u044B\u0445 \u043E\u0440\u0443\u0434\u0438\u044F (+6 HP, \u041E\u0433\u043D\u0435\u0441\u0442\u043E\u0439\u043A\u043E\u0441\u0442\u044C)");
    checkAndAward(
      "\u041B\u0435\u0433\u0435\u043D\u0434\u0430 \u043C\u0435\u0447\u0430",
      profile.regularKills >= 250 && profile.banditBossKills >= 5,
      "\u041C\u0430\u0441\u0442\u0435\u0440 \u043A\u043B\u0438\u043D\u043A\u0430 (+10 HP, \u0421\u0438\u043B\u0430 II, \u0421\u043F\u0435\u0448\u043A\u0430)"
    );
    checkAndAward(
      "\u0411\u043E\u0433 \u0432\u043E\u0439\u043D\u044B",
      profile.regularKills >= 500 && profile.banditBossKills >= 10 && profile.rulerKills >= 1,
      "\u0410\u0431\u0441\u043E\u043B\u044E\u0442\u043D\u044B\u0439 \u0442\u0440\u0438\u0443\u043C\u0444 \u0432\u043E\u0439\u043D\u044B (+20 HP, \u0420\u0435\u0433\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u044F, \u0421\u043E\u043F\u0440\u043E\u0442\u0438\u0432\u043B\u0435\u043D\u0438\u0435 II, \u0421\u0438\u043B\u0430 II)"
    );
  }
  static applyHealthAndPassives(player, profile) {
    if (!profile) profile = this.getProfile(player);
    const titleBonus = this.titleHpBonus[profile.feudalTitle] ?? 0;
    let epithetBonus = 0;
    for (const ep of profile.unlockedEpithets) {
      if (ep === "\u0423\u0431\u0438\u0439\u0446\u0430 \u0434\u044E\u0436\u0438\u043D\u044B") epithetBonus += 2;
      if (ep === "\u0423\u0431\u0438\u0439\u0446\u0430 \u0441\u043E\u0442\u043D\u0438") epithetBonus += 6;
      if (ep === "\u0423\u0431\u0438\u0439\u0446\u0430 \u0442\u044B\u0441\u044F\u0447\u0438") epithetBonus += 12;
      if (ep === "\u0413\u0440\u043E\u0437\u0430 \u0431\u0430\u043D\u0434\u0438\u0442\u043E\u0432") epithetBonus += 4;
      if (ep === "\u0418\u0441\u0442\u0440\u0435\u0431\u0438\u0442\u0435\u043B\u044C \u0430\u0442\u0430\u043C\u0430\u043D\u043E\u0432") epithetBonus += 8;
      if (ep === "\u041D\u0438\u0441\u043F\u0440\u043E\u0432\u0435\u0440\u0433\u0430\u0442\u0435\u043B\u044C \u043A\u043E\u0440\u043E\u043B\u0435\u0439") epithetBonus += 10;
      if (ep === "\u041D\u0435\u0441\u043E\u043A\u0440\u0443\u0448\u0438\u043C\u044B\u0439 \u043E\u0441\u0430\u0434\u043D\u0438\u043A") epithetBonus += 6;
      if (ep === "\u041B\u0435\u0433\u0435\u043D\u0434\u0430 \u043C\u0435\u0447\u0430") epithetBonus += 10;
      if (ep === "\u0411\u043E\u0433 \u0432\u043E\u0439\u043D\u044B") epithetBonus += 20;
    }
    const savedKarma = player.getDynamicProperty("feudal_karma");
    const karma = typeof savedKarma === "number" ? savedKarma : 0;
    let karmaHpBonus = 0;
    if (karma >= 75) {
      karmaHpBonus += 10;
      player.addEffect("regeneration", 400, { amplifier: 0, showParticles: false });
    } else if (karma >= 35) {
      karmaHpBonus += 6;
    } else if (karma <= -75) {
      karmaHpBonus += 12;
      player.addEffect("strength", 400, { amplifier: 1, showParticles: false });
      player.addEffect("resistance", 400, { amplifier: 0, showParticles: false });
    } else if (karma <= -35) {
      karmaHpBonus += 6;
      player.addEffect("strength", 400, { amplifier: 0, showParticles: false });
    }
    const totalBonusHp = titleBonus + epithetBonus + karmaHpBonus;
    if (totalBonusHp > 0) {
      const amp = Math.max(0, Math.floor(totalBonusHp / 4) - 1);
      player.addEffect("health_boost", 400, { amplifier: amp, showParticles: false });
    }
    if (profile.unlockedEpithets.includes("\u0423\u0431\u0438\u0439\u0446\u0430 \u0434\u044E\u0436\u0438\u043D\u044B")) {
      player.addEffect("speed", 400, { amplifier: 0, showParticles: false });
    }
    if (profile.unlockedEpithets.includes("\u0423\u0431\u0438\u0439\u0446\u0430 \u0441\u043E\u0442\u043D\u0438")) {
      player.addEffect("resistance", 400, { amplifier: 0, showParticles: false });
    }
    if (profile.unlockedEpithets.includes("\u0423\u0431\u0438\u0439\u0446\u0430 \u0442\u044B\u0441\u044F\u0447\u0438")) {
      player.addEffect("strength", 400, { amplifier: 0, showParticles: false });
    }
    if (profile.unlockedEpithets.includes("\u0418\u0441\u0442\u0440\u0435\u0431\u0438\u0442\u0435\u043B\u044C \u0430\u0442\u0430\u043C\u0430\u043D\u043E\u0432")) {
      player.addEffect("resistance", 400, { amplifier: 1, showParticles: false });
    }
    if (profile.unlockedEpithets.includes("\u041D\u0435\u0441\u043E\u043A\u0440\u0443\u0448\u0438\u043C\u044B\u0439 \u043E\u0441\u0430\u0434\u043D\u0438\u043A")) {
      player.addEffect("fire_resistance", 400, { amplifier: 0, showParticles: false });
    }
    if (profile.unlockedEpithets.includes("\u041B\u0435\u0433\u0435\u043D\u0434\u0430 \u043C\u0435\u0447\u0430")) {
      player.addEffect("strength", 400, { amplifier: 1, showParticles: false });
      player.addEffect("haste", 400, { amplifier: 1, showParticles: false });
    }
    if (profile.unlockedEpithets.includes("\u0411\u043E\u0433 \u0432\u043E\u0439\u043D\u044B")) {
      player.addEffect("regeneration", 400, { amplifier: 0, showParticles: false });
      player.addEffect("strength", 400, { amplifier: 1, showParticles: false });
      player.addEffect("resistance", 400, { amplifier: 1, showParticles: false });
    }
  }
  static saveProfile(profile) {
    world12.setDynamicProperty(`feudal_rpg_${profile.playerId}`, JSON.stringify(profile));
  }
};
PlayerRPGProfile.profiles = /* @__PURE__ */ new Map();
PlayerRPGProfile.titleHpBonus = {
  "\u0412\u043E\u0436\u0434\u044C": 0,
  "\u0420\u0435\u043A\u0440\u0443\u0442": 0,
  "\u0421\u0442\u0430\u0440\u043E\u0441\u0442\u0430": 4,
  "\u0421\u0435\u0440\u0436\u0430\u043D\u0442": 4,
  "\u0411\u0430\u0440\u043E\u043D": 8,
  "\u041A\u0430\u043F\u0438\u0442\u0430\u043D": 8,
  "\u041A\u0430\u043F\u0438\u0442\u0430\u043D \u0413\u0430\u0440\u043D\u0438\u0437\u043E\u043D\u0430": 8,
  "\u0412\u0438\u043A\u043E\u043D\u0442": 12,
  "\u0413\u0440\u0430\u0444": 16,
  "\u0413\u0435\u043D\u0435\u0440\u0430\u043B": 16,
  "\u0413\u0435\u043D\u0435\u0440\u0430\u043B \u0410\u0440\u043C\u0438\u0438": 16,
  "\u041C\u0430\u0440\u043A\u0438\u0437": 20,
  "\u0413\u0435\u0440\u0446\u043E\u0433": 24,
  "\u0412\u0435\u043B\u0438\u043A\u0438\u0439 \u041C\u0430\u0440\u0448\u0430\u043B": 24,
  "\u0412\u0435\u043B\u0438\u043A\u0438\u0439 \u0413\u0435\u0440\u0446\u043E\u0433": 28,
  "\u041A\u043E\u0440\u043E\u043B\u044C": 34,
  "\u0418\u043C\u043F\u0435\u0440\u0430\u0442\u043E\u0440": 44
};

// behavior_pack/scripts/SquadTacticsEngine.ts
import { world as world13, system as system2 } from "@minecraft/server";
import { ActionFormData as ActionFormData2 } from "@minecraft/server-ui";
var SquadTacticsEngine = class {
  /**
   * Opens the tactical commander modal menu
   */
  static openTacticsMenu(player, settlement) {
    const currentStance = this.playerStances.get(player.id) ?? "\u0421\u0442\u0430\u043D\u0434\u0430\u0440\u0442\u043D\u044B\u0439 \u0441\u0442\u0440\u043E\u0439" /* Standard */;
    const nearbyTroops = this.getNearbyFriendlyTroops(player, 36);
    let info = `\xA7l\xA76=== \u041F\u041E\u041B\u0415\u0412\u041E\u0419 \u0428\u0422\u0410\u0411 \u041F\u041E\u041B\u041A\u041E\u0412\u041E\u0414\u0426\u0410 ===\xA7r

`;
    info += `\xA7e\u0422\u0435\u043A\u0443\u0449\u0430\u044F \u0442\u0430\u043A\u0442\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u0441\u0442\u043E\u0439\u043A\u0430:\xA7b ${currentStance}\xA7r
`;
    info += `\xA7e\u041F\u043E\u0434\u043A\u043E\u043D\u0442\u0440\u043E\u043B\u044C\u043D\u044B\u0445 \u0432\u043E\u0438\u043D\u043E\u0432 \u043F\u043E\u0431\u043B\u0438\u0437\u043E\u0441\u0442\u0438:\xA7a ${nearbyTroops.length} \u0431\u043E\u0439\u0446\u043E\u0432\xA7r
`;
    if (settlement) {
      info += `\xA7e\u0413\u043E\u0440\u043E\u0434\u0441\u043A\u043E\u0439 \u0440\u0435\u0437\u0435\u0440\u0432 \u0430\u0440\u043C\u0438\u0438:\xA76 ${settlement.militaryCount} \u0432\u043E\u0438\u043D\u043E\u0432 (\u041C\u043E\u0431\u0438\u043B\u0438\u0437\u0430\u0446\u0438\u044F: ${settlement.isMobilized ? "\xA7c\u0414\u0410 (50%)" : "\xA7a\u041D\u0415\u0422 (25%)"}\xA7e)\xA7r
`;
    }
    const form = new ActionFormData2().title("\u0417\u043D\u0430\u043C\u044F \u041F\u043E\u043B\u043A\u043E\u0432\u043E\u0434\u0446\u0430: \u041F\u0440\u0438\u043A\u0430\u0437\u044B").body(info).button("\u{1F6E1}\uFE0F \xAB\u0421\u0442\u0435\u043D\u0430 \u0449\u0438\u0442\u043E\u0432!\xBB (\u041E\u0431\u043E\u0440\u043E\u043D\u0430 \u0438 \u0421\u043E\u043F\u0440\u043E\u0442\u0438\u0432\u043B\u0435\u043D\u0438\u0435 III)").button("\u2694\uFE0F \xAB\u0412 \u0430\u0442\u0430\u043A\u0443! \u0421\u043E\u043A\u0440\u0443\u0448\u0438\u0442\u044C \u0432\u0440\u0430\u0433\u0430!\xBB (\u0421\u0438\u043B\u0430 II \u0438 \u0421\u043A\u043E\u0440\u043E\u0441\u0442\u044C II)").button("\u{1F3F9} \xAB\u0417\u0430\u043B\u043F\u043E\u0432\u044B\u0439 \u043E\u0433\u043E\u043D\u044C!\xBB (\u0417\u0430\u043B\u043F \u0431\u0430\u043B\u043B\u0438\u0441\u0442 \u0438 \u043B\u0443\u0447\u043D\u0438\u043A\u043E\u0432)").button("\u{1F6D1} \xAB\u0414\u0435\u0440\u0436\u0430\u0442\u044C \u0441\u0442\u0440\u043E\u0439 \u043D\u0430 \u043C\u0435\u0441\u0442\u0435!\xBB").button("\u{1F4EF} \xAB\u041E\u0431\u044A\u044F\u0432\u0438\u0442\u044C \u0432\u0441\u0435\u043E\u0431\u0449\u0443\u044E \u043C\u043E\u0431\u0438\u043B\u0438\u0437\u0430\u0446\u0438\u044E (\u0434\u043E 50% \u0436\u0438\u0442\u0435\u043B\u0435\u0439)\xBB").button("\u0417\u0430\u043A\u0440\u044B\u0442\u044C \u0448\u0442\u0430\u0431");
    form.show(player).then((res) => {
      if (res.canceled || res.selection === 5) return;
      switch (res.selection) {
        case 0:
          this.executeShieldWall(player, nearbyTroops);
          break;
        case 1:
          this.executeCharge(player, nearbyTroops);
          break;
        case 2:
          this.executeVolleyFire(player, nearbyTroops);
          break;
        case 3:
          this.executeHoldPosition(player, nearbyTroops);
          break;
        case 4:
          if (settlement) {
            this.handleMobilizationCall(player, settlement);
          } else {
            player.sendMessage("\xA7c[\u0428\u0442\u0430\u0431] \u0412\u044B \u0434\u043E\u043B\u0436\u043D\u044B \u043D\u0430\u0445\u043E\u0434\u0438\u0442\u044C\u0441\u044F \u0432 \u043F\u0440\u0435\u0434\u0435\u043B\u0430\u0445 \u0432\u043B\u0430\u0434\u0435\u043D\u0438\u0439 \u0432\u0430\u0448\u0435\u0433\u043E \u0433\u043E\u0440\u043E\u0434\u0430 \u0434\u043B\u044F \u043C\u043E\u0431\u0438\u043B\u0438\u0437\u0430\u0446\u0438\u0438!\xA7r");
          }
          break;
      }
    });
  }
  static getNearbyFriendlyTroops(player, radius) {
    const dim = player.dimension;
    try {
      const entities = dim.getEntities({
        location: player.location,
        maxDistance: radius
      });
      return entities.filter((e) => {
        const type = e.typeId;
        return type === "feudal:royal_knight" || type === "feudal:city_guard" || type === "feudal:ballista";
      });
    } catch {
      return [];
    }
  }
  static executeShieldWall(player, troops) {
    this.playerStances.set(player.id, "\u0421\u0442\u0435\u043D\u0430 \u0449\u0438\u0442\u043E\u0432 (\u0413\u043B\u0443\u0445\u0430\u044F \u043E\u0431\u043E\u0440\u043E\u043D\u0430)" /* ShieldWall */);
    world13.sendMessage(`\xA7b\xA7l[\u041F\u0420\u0418\u041A\u0410\u0417] ${player.name}: \xAB\u0421\u041C\u041A\u041D\u0423\u0422\u042C \u0429\u0418\u0422\u042B! \u0421\u0422\u0415\u041D\u0410 \u0429\u0418\u0422\u041E\u0412!\xBB\xA7r`);
    for (const unit of troops) {
      try {
        unit.addEffect("resistance", 20 * 45, { amplifier: 2, showParticles: true });
        unit.addEffect("slowness", 20 * 45, { amplifier: 0, showParticles: false });
      } catch {
      }
    }
    player.addEffect("resistance", 20 * 45, { amplifier: 1, showParticles: false });
    try {
      player.dimension.spawnParticle("minecraft:totem_particle", {
        x: player.location.x,
        y: player.location.y + 1,
        z: player.location.z
      });
    } catch {
    }
    player.sendMessage(`\xA7a[\u0422\u0430\u043A\u0442\u0438\u043A\u0430] ${troops.length} \u0432\u043E\u0438\u043D\u043E\u0432 \u0432\u044B\u0441\u0442\u0440\u043E\u0438\u043B\u0438\u0441\u044C \u0432 \u043D\u0435\u043F\u0440\u043E\u0431\u0438\u0432\u0430\u0435\u043C\u044B\u0439 \u0441\u0442\u0440\u043E\u0439 \xAB\u0421\u0442\u0435\u043D\u0430 \u0449\u0438\u0442\u043E\u0432\xBB!\xA7r`);
  }
  static executeCharge(player, troops) {
    this.playerStances.set(player.id, "\u041B\u043E\u0431\u043E\u0432\u0430\u044F \u0430\u0442\u0430\u043A\u0430 (\u041D\u0430\u0442\u0438\u0441\u043A)" /* AllOutCharge */);
    world13.sendMessage(`\xA7c\xA7l[\u041F\u0420\u0418\u041A\u0410\u0417] ${player.name}: \xAB\u0412 \u0410\u0422\u0410\u041A\u0423! \u0421\u041E\u041A\u0420\u0423\u0428\u0418\u0422\u042C \u0418\u0425 \u0421\u0422\u0420\u041E\u0419!\xBB\xA7r`);
    for (const unit of troops) {
      try {
        unit.addEffect("speed", 20 * 30, { amplifier: 1, showParticles: true });
        unit.addEffect("strength", 20 * 30, { amplifier: 1, showParticles: true });
      } catch {
      }
    }
    player.addEffect("speed", 20 * 30, { amplifier: 1, showParticles: false });
    player.addEffect("strength", 20 * 30, { amplifier: 0, showParticles: false });
    try {
      player.dimension.spawnParticle("minecraft:critical_hit_emitter", {
        x: player.location.x,
        y: player.location.y + 1.2,
        z: player.location.z
      });
    } catch {
    }
    player.sendMessage(`\xA7c[\u0422\u0430\u043A\u0442\u0438\u043A\u0430] \u0414\u0440\u0443\u0436\u0438\u043D\u0430 \u0440\u0438\u043D\u0443\u043B\u0430\u0441\u044C \u0432 \u044F\u0440\u043E\u0441\u0442\u043D\u044B\u0439 \u043D\u0430\u0442\u0438\u0441\u043A! \u0423\u0440\u043E\u043D \u0438 \u0441\u043A\u043E\u0440\u043E\u0441\u0442\u044C \u0443\u0432\u0435\u043B\u0438\u0447\u0435\u043D\u044B!\xA7r`);
  }
  static executeVolleyFire(player, troops) {
    world13.sendMessage(`\xA7e\xA7l[\u041F\u0420\u0418\u041A\u0410\u0417] ${player.name}: \xAB\u0411\u0410\u041B\u041B\u0418\u0421\u0422\u042B \u0418 \u041B\u0423\u0427\u041D\u0418\u041A\u0418 \u2014 \u0417\u0410\u041B\u041F \u041F\u041E \u041C\u041E\u0415\u0419 \u0426\u0415\u041B\u0418!\xBB\xA7r`);
    const view = player.getViewDirection();
    const pos = player.location;
    for (let i = 0; i < 6; i++) {
      system2.runTimeout(() => {
        try {
          const arrow = player.dimension.spawnEntity("minecraft:arrow", {
            x: pos.x + (Math.random() - 0.5) * 4,
            y: pos.y + 2.5,
            z: pos.z + (Math.random() - 0.5) * 4
          });
          arrow.applyImpulse({
            x: view.x * 2.2 + (Math.random() - 0.5) * 0.2,
            y: view.y * 2.2 + 0.35,
            z: view.z * 2.2 + (Math.random() - 0.5) * 0.2
          });
        } catch {
        }
      }, i * 3);
    }
    player.sendMessage("\xA7e[\u0422\u0430\u043A\u0442\u0438\u043A\u0430] \u041F\u0440\u043E\u0438\u0437\u0432\u0435\u0434\u0435\u043D \u043C\u0430\u0441\u0441\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0439 \u0441\u0438\u043D\u0445\u0440\u043E\u043D\u043D\u044B\u0439 \u0437\u0430\u043B\u043F \u043F\u043E \u0432\u0440\u0430\u0436\u0435\u0441\u043A\u0438\u043C \u043F\u043E\u0437\u0438\u0446\u0438\u044F\u043C!\xA7r");
  }
  static executeHoldPosition(player, troops) {
    this.playerStances.set(player.id, "\u041E\u0445\u0440\u0430\u043D\u0430 \u0440\u0443\u0431\u0435\u0436\u0430 (\u0421\u0442\u043E\u0439\u043A\u043E\u0441\u0442\u044C)" /* HoldPosition */);
    world13.sendMessage(`\xA76\xA7l[\u041F\u0420\u0418\u041A\u0410\u0417] ${player.name}: \xAB\u0414\u0415\u0420\u0416\u0410\u0422\u042C \u042D\u0422\u041E\u0422 \u0420\u0423\u0411\u0415\u0416! \u041D\u0418 \u0428\u0410\u0413\u0423 \u041D\u0410\u0417\u0410\u0414!\xBB\xA7r`);
    for (const unit of troops) {
      try {
        unit.addEffect("regeneration", 20 * 20, { amplifier: 1, showParticles: true });
        unit.addEffect("resistance", 20 * 20, { amplifier: 1, showParticles: false });
      } catch {
      }
    }
    player.sendMessage("\xA76[\u0422\u0430\u043A\u0442\u0438\u043A\u0430] \u0412\u043E\u0439\u0441\u043A\u0430 \u0437\u0430\u043A\u0440\u0435\u043F\u0438\u043B\u0438\u0441\u044C \u043D\u0430 \u043F\u043E\u0437\u0438\u0446\u0438\u0438 \u0438 \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u0430\u0432\u043B\u0438\u0432\u0430\u044E\u0442 \u0441\u0438\u043B\u044B!\xA7r");
  }
  static handleMobilizationCall(player, settlement) {
    const newState = !settlement.isMobilized;
    const newTotal = CityProgression.toggleMobilization(settlement, newState);
    if (newState) {
      const dim = player.dimension;
      const countToSpawn = Math.min(6, Math.floor(newTotal / 40));
      for (let i = 0; i < countToSpawn; i++) {
        try {
          const guard = dim.spawnEntity("feudal:city_guard", {
            x: settlement.throneLocation.x + i % 3 * 2 - 2,
            y: settlement.throneLocation.y,
            z: settlement.throneLocation.z + Math.floor(i / 3) * 2 - 2
          });
          guard.nameTag = `\u041E\u043F\u043E\u043B\u0447\u0435\u043D\u0435\u0446 \u0433\u043E\u0440\u043E\u0434\u0430 ${settlement.factionId}`;
        } catch {
        }
      }
    }
  }
};
SquadTacticsEngine.playerStances = /* @__PURE__ */ new Map();

// behavior_pack/scripts/MarketplaceEngine.ts
import { ItemStack as ItemStack2, world as world14 } from "@minecraft/server";
import { ActionFormData as ActionFormData3 } from "@minecraft/server-ui";
var MarketplaceEngine = class {
  /**
   * Calculates live market commodity rates based on city's economic specialization.
   */
  static getRates(profile = "\u0410\u0433\u0440\u0430\u0440\u043D\u0430\u044F \u0436\u0438\u0442\u043D\u0438\u0446\u0430" /* AgrarianBreadbasket */) {
    switch (profile) {
      case "\u0413\u043E\u0440\u043D\u043E\u0440\u0443\u0434\u043D\u044B\u0439 \u0446\u0435\u043D\u0442\u0440" /* MiningHub */:
        return {
          iron: { buyPriceEmeralds: 1, sellPriceEmeralds: 1, unitSize: 16 },
          // Very cheap iron
          stone: { buyPriceEmeralds: 1, sellPriceEmeralds: 1, unitSize: 32 },
          wood: { buyPriceEmeralds: 2, sellPriceEmeralds: 1, unitSize: 16 },
          food: { buyPriceEmeralds: 3, sellPriceEmeralds: 2, unitSize: 16 }
          // High demand for food
        };
      case "\u0410\u0433\u0440\u0430\u0440\u043D\u0430\u044F \u0436\u0438\u0442\u043D\u0438\u0446\u0430" /* AgrarianBreadbasket */:
        return {
          food: { buyPriceEmeralds: 1, sellPriceEmeralds: 1, unitSize: 32 },
          // Abundant cheap bread/grain
          wood: { buyPriceEmeralds: 1, sellPriceEmeralds: 1, unitSize: 16 },
          stone: { buyPriceEmeralds: 2, sellPriceEmeralds: 1, unitSize: 16 },
          iron: { buyPriceEmeralds: 3, sellPriceEmeralds: 2, unitSize: 8 }
          // Scarce iron
        };
      case "\u041B\u0435\u0441\u043E\u0437\u0430\u0433\u043E\u0442\u043E\u0432\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0439 \u043A\u0440\u0430\u0439" /* LumberHaven */:
        return {
          wood: { buyPriceEmeralds: 1, sellPriceEmeralds: 1, unitSize: 32 },
          // Abundant timber
          stone: { buyPriceEmeralds: 2, sellPriceEmeralds: 1, unitSize: 16 },
          iron: { buyPriceEmeralds: 2, sellPriceEmeralds: 1, unitSize: 12 },
          food: { buyPriceEmeralds: 2, sellPriceEmeralds: 1, unitSize: 16 }
        };
      case "\u0412\u043E\u0435\u043D\u043D\u0430\u044F \u0446\u0438\u0442\u0430\u0434\u0435\u043B\u044C" /* MilitaryFortress */:
        return {
          iron: { buyPriceEmeralds: 4, sellPriceEmeralds: 3, unitSize: 8 },
          // High price for weapons/iron
          food: { buyPriceEmeralds: 2, sellPriceEmeralds: 1, unitSize: 16 },
          wood: { buyPriceEmeralds: 2, sellPriceEmeralds: 1, unitSize: 16 },
          stone: { buyPriceEmeralds: 1, sellPriceEmeralds: 1, unitSize: 16 }
        };
      case "\u0422\u043E\u0440\u0433\u043E\u0432\u044B\u0439 \u043C\u0435\u0433\u0430\u043F\u043E\u043B\u0438\u0441" /* TradeMetropolis */:
      default:
        return {
          iron: { buyPriceEmeralds: 2, sellPriceEmeralds: 1, unitSize: 10 },
          food: { buyPriceEmeralds: 1, sellPriceEmeralds: 1, unitSize: 20 },
          wood: { buyPriceEmeralds: 1, sellPriceEmeralds: 1, unitSize: 20 },
          stone: { buyPriceEmeralds: 1, sellPriceEmeralds: 1, unitSize: 20 }
        };
    }
  }
  static openMarketMenu(player, settlement) {
    const profile = settlement.economicProfile ?? "\u0410\u0433\u0440\u0430\u0440\u043D\u0430\u044F \u0436\u0438\u0442\u043D\u0438\u0446\u0430" /* AgrarianBreadbasket */;
    const rates = this.getRates(profile);
    let info = `\xA7l\xA76=== \u0413\u041E\u0420\u041E\u0414\u0421\u041A\u0410\u042F \u0411\u0418\u0420\u0416\u0410 \u0418 \u0420\u042B\u041D\u041E\u041A ===\xA7r
`;
    info += `\xA7e\u042D\u043A\u043E\u043D\u043E\u043C\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u043F\u0440\u043E\u0444\u0438\u043B\u044C:\xA7a ${profile}\xA7r
`;
    info += `\xA7e\u0413\u043E\u0440\u043E\u0434\u0441\u043A\u0430\u044F \u043A\u0430\u0437\u043D\u0430:\xA7f ${settlement.treasury.emeralds} \u0438\u0437\u0443\u043C\u0440\u0443\u0434\u043E\u0432\xA7r

`;
    info += `\xA7l\u0422\u0435\u043A\u0443\u0449\u0438\u0435 \u0431\u0438\u0440\u0436\u0435\u0432\u044B\u0435 \u043A\u043E\u0442\u0438\u0440\u043E\u0432\u043A\u0438:\xA7r
`;
    info += `  \u2022 \u0416\u0435\u043B\u0435\u0437\u043E (${rates.iron.unitSize} \u0448\u0442): \u041F\u043E\u043A\u0443\u043F\u043A\u0430 \xA7a${rates.iron.buyPriceEmeralds}\xA7r / \u041F\u0440\u043E\u0434\u0430\u0436\u0430 \xA76${rates.iron.sellPriceEmeralds}\xA7r \u0438\u0437\u0443\u043C\u0440.
`;
    info += `  \u2022 \u041F\u0440\u043E\u0432\u0438\u0430\u043D\u0442 (${rates.food.unitSize} \u0448\u0442): \u041F\u043E\u043A\u0443\u043F\u043A\u0430 \xA7a${rates.food.buyPriceEmeralds}\xA7r / \u041F\u0440\u043E\u0434\u0430\u0436\u0430 \xA76${rates.food.sellPriceEmeralds}\xA7r \u0438\u0437\u0443\u043C\u0440.
`;
    info += `  \u2022 \u0414\u0440\u0435\u0432\u0435\u0441\u0438\u043D\u0430 (${rates.wood.unitSize} \u0448\u0442): \u041F\u043E\u043A\u0443\u043F\u043A\u0430 \xA7a${rates.wood.buyPriceEmeralds}\xA7r / \u041F\u0440\u043E\u0434\u0430\u0436\u0430 \xA76${rates.wood.sellPriceEmeralds}\xA7r \u0438\u0437\u0443\u043C\u0440.
`;
    info += `  \u2022 \u041A\u0430\u043C\u0435\u043D\u044C (${rates.stone.unitSize} \u0448\u0442): \u041F\u043E\u043A\u0443\u043F\u043A\u0430 \xA7a${rates.stone.buyPriceEmeralds}\xA7r / \u041F\u0440\u043E\u0434\u0430\u0436\u0430 \xA76${rates.stone.sellPriceEmeralds}\xA7r \u0438\u0437\u0443\u043C\u0440.
`;
    const form = new ActionFormData3().title("\u0411\u0438\u0440\u0436\u0430 \u043A\u0443\u043F\u0446\u043E\u0432 \u0438 \u0442\u043E\u0440\u0433\u043E\u0432\u043B\u044F").body(info).button("\u041A\u0443\u043F\u0438\u0442\u044C \u0416\u0435\u043B\u0435\u0437\u043E \u0438\u0437 \u043A\u0430\u0437\u043D\u044B").button("\u041F\u0440\u043E\u0434\u0430\u0442\u044C \u0416\u0435\u043B\u0435\u0437\u043E \u0432 \u043A\u0430\u0437\u043D\u0443 \u0433\u043E\u0440\u043E\u0434\u0430").button("\u041A\u0443\u043F\u0438\u0442\u044C \u041F\u0440\u043E\u0432\u0438\u0430\u043D\u0442 (\u0425\u043B\u0435\u0431)").button("\u041F\u0440\u043E\u0434\u0430\u0442\u044C \u041F\u0440\u043E\u0432\u0438\u0430\u043D\u0442 (\u0425\u043B\u0435\u0431)").button("\u041A\u0443\u043F\u0438\u0442\u044C \u0414\u0440\u0435\u0432\u0435\u0441\u0438\u043D\u0443 (\u0414\u0443\u0431)").button("\u041F\u0440\u043E\u0434\u0430\u0442\u044C \u0414\u0440\u0435\u0432\u0435\u0441\u0438\u043D\u0443 (\u0414\u0443\u0431)").button("\u{1F4B0} \u0421\u043D\u0430\u0440\u044F\u0434\u0438\u0442\u044C \u0447\u0430\u0441\u0442\u043D\u044B\u0439 \u043A\u0443\u043F\u0435\u0447\u0435\u0441\u043A\u0438\u0439 \u043A\u0430\u0440\u0430\u0432\u0430\u043D (30 \u0438\u0437\u0443\u043C\u0440\u0443\u0434\u043E\u0432)").button("\u0417\u0430\u043A\u0440\u044B\u0442\u044C \u0431\u0438\u0440\u0436\u0443");
    form.show(player).then((res) => {
      if (res.canceled || res.selection === 7) return;
      switch (res.selection) {
        case 0:
          this.executeBuy(player, settlement, "minecraft:iron_ingot", rates.iron.unitSize, rates.iron.buyPriceEmeralds, "iron");
          break;
        case 1:
          this.executeSell(player, settlement, "minecraft:iron_ingot", rates.iron.unitSize, rates.iron.sellPriceEmeralds, "iron");
          break;
        case 2:
          this.executeBuy(player, settlement, "minecraft:bread", rates.food.unitSize, rates.food.buyPriceEmeralds, "food");
          break;
        case 3:
          this.executeSell(player, settlement, "minecraft:bread", rates.food.unitSize, rates.food.sellPriceEmeralds, "food");
          break;
        case 4:
          this.executeBuy(player, settlement, "minecraft:oak_log", rates.wood.unitSize, rates.wood.buyPriceEmeralds, "wood");
          break;
        case 5:
          this.executeSell(player, settlement, "minecraft:oak_log", rates.wood.unitSize, rates.wood.sellPriceEmeralds, "wood");
          break;
        case 6:
          this.dispatchPlayerCaravan(player, settlement);
          break;
      }
    });
  }
  static executeBuy(player, settlement, itemTypeId, amount, costEmeralds, treasuryKey) {
    const inv = player.getComponent("minecraft:inventory");
    const container = inv?.container;
    if (!container) return;
    if (settlement.treasury[treasuryKey] < amount) {
      player.sendMessage(`\xA7c[\u0411\u0438\u0440\u0436\u0430] \u0412 \u0430\u043C\u0431\u0430\u0440\u0430\u0445 \u0433\u043E\u0440\u043E\u0434\u0430 \u043D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u044D\u0442\u043E\u0433\u043E \u0442\u043E\u0432\u0430\u0440\u0430!\xA7r`);
      return;
    }
    let emeraldsFound = 0;
    for (let i = 0; i < container.size; i++) {
      const it = container.getItem(i);
      if (it && it.typeId === "minecraft:emerald") emeraldsFound += it.amount;
    }
    if (emeraldsFound < costEmeralds) {
      player.sendMessage(`\xA7c[\u0411\u0438\u0440\u0436\u0430] \u0412\u0430\u043C \u043D\u0435 \u0445\u0432\u0430\u0442\u0430\u0435\u0442 \u0438\u0437\u0443\u043C\u0440\u0443\u0434\u043E\u0432! \u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F: ${costEmeralds} \u0438\u0437\u0443\u043C\u0440.\xA7r`);
      return;
    }
    let remaining = costEmeralds;
    for (let i = 0; i < container.size; i++) {
      const it = container.getItem(i);
      if (it && it.typeId === "minecraft:emerald") {
        if (it.amount <= remaining) {
          remaining -= it.amount;
          container.setItem(i, void 0);
        } else {
          it.amount -= remaining;
          container.setItem(i, it);
          remaining = 0;
        }
        if (remaining <= 0) break;
      }
    }
    settlement.treasury[treasuryKey] -= amount;
    settlement.treasury.emeralds += costEmeralds;
    container.addItem(new ItemStack2(itemTypeId, amount));
    player.sendMessage(`\xA7a[\u0411\u0438\u0440\u0436\u0430] \u0421\u0434\u0435\u043B\u043A\u0430 \u0441\u043E\u0432\u0435\u0440\u0448\u0435\u043D\u0430! \u041A\u0443\u043F\u043B\u0435\u043D\u043E ${amount} \u0448\u0442. \u0437\u0430 ${costEmeralds} \u0438\u0437\u0443\u043C\u0440\u0443\u0434\u043E\u0432.\xA7r`);
  }
  static executeSell(player, settlement, itemTypeId, amount, rewardEmeralds, treasuryKey) {
    const inv = player.getComponent("minecraft:inventory");
    const container = inv?.container;
    if (!container) return;
    let itemsFound = 0;
    for (let i = 0; i < container.size; i++) {
      const it = container.getItem(i);
      if (it && it.typeId === itemTypeId) itemsFound += it.amount;
    }
    if (itemsFound < amount) {
      player.sendMessage(`\xA7c[\u0411\u0438\u0440\u0436\u0430] \u0423 \u0432\u0430\u0441 \u043D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u0442\u043E\u0432\u0430\u0440\u0430! \u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F: ${amount} \u0448\u0442.\xA7r`);
      return;
    }
    let remaining = amount;
    for (let i = 0; i < container.size; i++) {
      const it = container.getItem(i);
      if (it && it.typeId === itemTypeId) {
        if (it.amount <= remaining) {
          remaining -= it.amount;
          container.setItem(i, void 0);
        } else {
          it.amount -= remaining;
          container.setItem(i, it);
          remaining = 0;
        }
        if (remaining <= 0) break;
      }
    }
    settlement.treasury[treasuryKey] += amount;
    container.addItem(new ItemStack2("minecraft:emerald", rewardEmeralds));
    player.sendMessage(`\xA7a[\u0411\u0438\u0440\u0436\u0430] \u0422\u043E\u0432\u0430\u0440 \u043F\u0440\u0438\u043D\u044F\u0442 \u043D\u0430 \u0441\u043A\u043B\u0430\u0434! \u0412\u044B \u043F\u043E\u043B\u0443\u0447\u0438\u043B\u0438 ${rewardEmeralds} \u0438\u0437\u0443\u043C\u0440\u0443\u0434\u043E\u0432.\xA7r`);
  }
  static dispatchPlayerCaravan(player, settlement) {
    const inv = player.getComponent("minecraft:inventory");
    const container = inv?.container;
    if (!container) return;
    let emeraldsFound = 0;
    for (let i = 0; i < container.size; i++) {
      const it = container.getItem(i);
      if (it && it.typeId === "minecraft:emerald") emeraldsFound += it.amount;
    }
    if (emeraldsFound < 30) {
      player.sendMessage("\xA7c[\u0413\u0438\u043B\u044C\u0434\u0438\u044F \u041A\u0443\u043F\u0446\u043E\u0432] \u0414\u043B\u044F \u0441\u043D\u0430\u0440\u044F\u0436\u0435\u043D\u0438\u044F \u043E\u0445\u0440\u0430\u043D\u044F\u0435\u043C\u043E\u0433\u043E \u0442\u043E\u0440\u0433\u043E\u0432\u043E\u0433\u043E \u043A\u0430\u0440\u0430\u0432\u0430\u043D\u0430 \u043D\u0443\u0436\u043D\u043E 30 \u0438\u0437\u0443\u043C\u0440\u0443\u0434\u043E\u0432!\xA7r");
      return;
    }
    let remaining = 30;
    for (let i = 0; i < container.size; i++) {
      const it = container.getItem(i);
      if (it && it.typeId === "minecraft:emerald") {
        if (it.amount <= remaining) {
          remaining -= it.amount;
          container.setItem(i, void 0);
        } else {
          it.amount -= remaining;
          container.setItem(i, it);
          remaining = 0;
        }
        if (remaining <= 0) break;
      }
    }
    world14.sendMessage(
      `\xA76\xA7l[\u041A\u0423\u041F\u0415\u0427\u0415\u0421\u041A\u0418\u0419 \u041E\u0411\u041E\u0417] ${player.name} \u0441\u043D\u0430\u0440\u044F\u0434\u0438\u043B \u0442\u043E\u0440\u0433\u043E\u0432\u044B\u0439 \u043A\u0430\u0440\u0430\u0432\u0430\u043D \u043F\u043E\u0434 \u043E\u0445\u0440\u0430\u043D\u043E\u0439 \u043A\u043E\u0440\u043E\u043B\u0435\u0432\u0441\u043A\u0438\u0445 \u0440\u044B\u0446\u0430\u0440\u0435\u0439! \u041F\u0440\u0438\u0431\u044B\u043B\u044C \u043E\u0436\u0438\u0434\u0430\u0435\u0442\u0441\u044F \u043F\u043E \u0432\u043E\u0437\u0432\u0440\u0430\u0449\u0435\u043D\u0438\u0438!\xA7r`
    );
    const profit = 60 + Math.floor(Math.random() * 35);
    world14.sendMessage(`\xA7e[\u041A\u0430\u0440\u0430\u0432\u0430\u043D] \u0422\u043E\u0440\u0433\u043E\u0432\u044B\u0439 \u043E\u0431\u043E\u0437 \u0432\u044B\u0448\u0435\u043B \u043D\u0430 \u0432\u0435\u043B\u0438\u043A\u0438\u0439 \u0442\u0440\u0430\u043A\u0442 \u043C\u0435\u0436\u0434\u0443 \u0433\u043E\u0440\u043E\u0434\u0430\u043C\u0438...\xA7r`);
    settlement.treasury.emeralds += Math.floor(profit * 0.3);
  }
};

// behavior_pack/scripts/FeudalCourtEngine.ts
import { world as world15 } from "@minecraft/server";
import { ActionFormData as ActionFormData4 } from "@minecraft/server-ui";
var FeudalCourtEngine = class {
  // -100 (Black Tyrant) to +100 (Holy Paladin)
  static getKarma(player) {
    const saved = player.getDynamicProperty("feudal_karma");
    if (typeof saved === "number") return saved;
    return this.playerKarma.get(player.id) ?? 0;
  }
  static modifyKarma(player, delta) {
    const current = this.getKarma(player);
    const updated = Math.max(-100, Math.min(100, current + delta));
    this.playerKarma.set(player.id, updated);
    player.setDynamicProperty("feudal_karma", updated);
    if (delta > 0) {
      player.sendMessage(`\xA7a[\u0427\u0435\u0441\u0442\u044C] \u0412\u0430\u0448\u0430 \u0440\u044B\u0446\u0430\u0440\u0441\u043A\u0430\u044F \u0440\u0435\u043F\u0443\u0442\u0430\u0446\u0438\u044F \u0432\u043E\u0437\u0440\u043E\u0441\u043B\u0430 \u043D\u0430 +${delta} (\u0412\u0441\u0435\u0433\u043E: ${updated})!\xA7r`);
    } else if (delta < 0) {
      player.sendMessage(`\xA7c[\u0411\u0435\u0441\u0447\u0435\u0441\u0442\u0438\u0435] \u0412\u0430\u0448\u0430 \u0434\u0443\u0440\u043D\u0430\u044F \u0441\u043B\u0430\u0432\u0430 \u0443\u0441\u0438\u043B\u0438\u043B\u0430\u0441\u044C \u043D\u0430 ${delta} (\u0412\u0441\u0435\u0433\u043E: ${updated})!\xA7r`);
    }
  }
  static getCourtReputationTitle(karma) {
    if (karma >= 75) return "\u2728 \u0421\u0432\u044F\u0449\u0435\u043D\u043D\u044B\u0439 \u041F\u0430\u043B\u0430\u0434\u0438\u043D \u0417\u0435\u043C\u043B\u0438";
    if (karma >= 35) return "\u{1F6E1}\uFE0F \u0411\u043B\u0430\u0433\u043E\u0440\u043E\u0434\u043D\u044B\u0439 \u0421\u044E\u0437\u0435\u0440\u0435\u043D";
    if (karma >= -35) return "\u2694\uFE0F \u0412\u043E\u043B\u044C\u043D\u044B\u0439 \u0424\u0435\u043E\u0434\u0430\u043B\u044C\u043D\u044B\u0439 \u041D\u0430\u0435\u043C\u043D\u0438\u043A";
    if (karma >= -75) return "\u{1F480} \u0413\u0440\u043E\u0437\u043D\u044B\u0439 \u0417\u0430\u0432\u043E\u0435\u0432\u0430\u0442\u0435\u043B\u044C";
    return "\u{1F525} \u041A\u0440\u043E\u0432\u0430\u0432\u044B\u0439 \u0412\u043B\u0430\u0434\u044B\u043A\u0430 \u0422\u044C\u043C\u044B";
  }
  static openCourtMenu(player, settlement) {
    const trait = settlement.rulerTrait ?? "\u0411\u043B\u0430\u0433\u043E\u0440\u043E\u0434\u043D\u044B\u0439" /* Honorable */;
    const karma = this.getKarma(player);
    const repTitle = this.getCourtReputationTitle(karma);
    let info = `\xA7l\xA76=== \u0424\u0415\u041E\u0414\u0410\u041B\u042C\u041D\u042B\u0419 \u0414\u0412\u041E\u0420 \u0418 \u0418\u041D\u0422\u0420\u0418\u0413\u0418 ===\xA7r

`;
    info += `\xA7e\u0425\u0430\u0440\u0430\u043A\u0442\u0435\u0440 \u043F\u0440\u0430\u0432\u044F\u0449\u0435\u0433\u043E \u043C\u043E\u043D\u0430\u0440\u0445\u0430:\xA76 ${trait}\xA7r
`;
    info += `\xA7e\u0412\u0430\u0448 \u0441\u0442\u0430\u0442\u0443\u0441 \u043F\u0440\u0438 \u0434\u0432\u043E\u0440\u0435:\xA7b ${repTitle}\xA7r (\u041A\u0430\u0440\u043C\u0430: ${karma})

`;
    switch (trait) {
      case "\u0416\u0430\u0434\u043D\u044B\u0439" /* Greedy */:
        info += `\xA7c\xAB\u042D\u0442\u043E\u0442 \u0433\u043E\u0441\u0443\u0434\u0430\u0440\u044C \u043D\u0435\u043D\u0430\u0441\u044B\u0442\u0435\u043D: \u043D\u0430\u043B\u043E\u0433 35%, \u043D\u0430\u0440\u043E\u0434 \u0440\u043E\u043F\u0449\u0435\u0442, \u0430 \u0432 \u043A\u0430\u0437\u043D\u0435 \u043B\u043E\u043C\u044F\u0442\u0441\u044F \u0441\u0443\u043D\u0434\u0443\u043A\u0438. \u0413\u043E\u0440\u043E\u0436\u0430\u043D\u0435 \u0433\u043E\u0442\u043E\u0432\u044B \u0432\u043E\u0441\u0441\u0442\u0430\u0442\u044C, \u0435\u0441\u043B\u0438 \u043D\u0430\u0439\u0434\u0435\u0442\u0441\u044F \u0432\u043E\u0436\u0430\u043A!\xBB\xA7r
`;
        break;
      case "\u041A\u0440\u043E\u0432\u043E\u0436\u0430\u0434\u043D\u044B\u0439" /* Warlord */:
        info += `\xA7c\xAB\u041C\u043E\u043D\u0430\u0440\u0445 \u0436\u0430\u0436\u0434\u0435\u0442 \u043A\u0440\u043E\u0432\u0438 \u0438 \u0441\u043B\u0430\u0432\u044B. \u0410\u0440\u043C\u0438\u044F \u0434\u0435\u0440\u0436\u0438\u0442\u0441\u044F \u043D\u0430 \u043F\u0440\u0435\u0434\u0435\u043B\u0435 \u043C\u043E\u0431\u0438\u043B\u0438\u0437\u0430\u0446\u0438\u0438 (50%), \u043A\u0430\u0442\u0430\u043F\u0443\u043B\u044C\u0442\u044B \u0433\u043E\u0442\u043E\u0432\u044B \u043A \u0431\u043E\u044E \u0434\u0435\u043D\u044C \u0438 \u043D\u043E\u0447\u044C!\xBB\xA7r
`;
        break;
      case "\u0411\u043B\u0430\u0433\u043E\u0440\u043E\u0434\u043D\u044B\u0439" /* Honorable */:
        info += `\xA7a\xAB\u041F\u0440\u0430\u0432\u0435\u0434\u043D\u044B\u0439 \u043F\u0440\u0430\u0432\u0438\u0442\u0435\u043B\u044C. \u0427\u0442\u0438\u0442 \u043A\u043B\u044F\u0442\u0432\u044B, \u0434\u0435\u0440\u0436\u0438\u0442 \u043D\u0430\u043B\u043E\u0433\u0438 \u043D\u0430 10%, \u0432\u043E\u0438\u043D\u044B \u0433\u043E\u0442\u043E\u0432\u044B \u0443\u043C\u0435\u0440\u0435\u0442\u044C \u0437\u0430 \u0435\u0433\u043E \u0437\u043D\u0430\u043C\u044F.\xBB\xA7r
`;
        break;
      case "\u0418\u043D\u0442\u0440\u0438\u0433\u0430\u043D" /* Schemer */:
        info += `\xA7e\xAB\u041C\u0430\u0441\u0442\u0435\u0440 \u0442\u0430\u0439\u043D\u044B\u0445 \u044F\u0434\u043E\u0432 \u0438 \u0448\u043F\u0438\u043E\u043D\u043E\u0432. \u041C\u043E\u0436\u0435\u0442 \u043F\u0440\u043E\u0434\u0430\u0442\u044C \u0441\u043E\u044E\u0437\u043D\u0438\u043A\u0430 \u0437\u0430 \u0437\u0432\u043E\u043D\u043A\u0443\u044E \u043C\u043E\u043D\u0435\u0442\u0443 \u0438\u043B\u0438 \u043E\u0442\u0440\u0430\u0432\u0438\u0442\u044C \u043A\u043E\u043B\u043E\u0434\u0435\u0446 \u043E\u0441\u0430\u0436\u0434\u0430\u044E\u0449\u0438\u0445.\xBB\xA7r
`;
        break;
      case "\u041C\u0443\u0434\u0440\u044B\u0439" /* Wise */:
        info += `\xA7b\xAB\u041C\u0443\u0434\u0440\u0435\u0446 \u043D\u0430 \u0442\u0440\u043E\u043D\u0435. \u0413\u043E\u0440\u043E\u0434\u0430 \u043F\u0440\u043E\u0446\u0432\u0435\u0442\u0430\u044E\u0442, \u043D\u0430\u0443\u043A\u0438 \u0440\u0430\u0437\u0432\u0438\u0432\u0430\u044E\u0442\u0441\u044F, \u0430 \u0442\u043E\u0440\u0433\u043E\u0432\u044B\u0435 \u043F\u043E\u0448\u043B\u0438\u043D\u044B \u043C\u0438\u043D\u0438\u043C\u0430\u043B\u044C\u043D\u044B.\xBB\xA7r
`;
        break;
    }
    const form = new ActionFormData4().title("\u0422\u0430\u0439\u043D\u044B\u0439 \u0421\u043E\u0432\u0435\u0442 \u0438 \u0418\u043D\u0442\u0440\u0438\u0433\u0438").body(info).button("\u{1F451} \u041F\u0440\u0438\u0441\u044F\u0433\u043D\u0443\u0442\u044C \u043D\u0430 \u0432\u0435\u0440\u043D\u043E\u0441\u0442\u044C \u043C\u043E\u043D\u0430\u0440\u0445\u0443 (+25 \u0427\u0435\u0441\u0442\u0438)").button("\u{1F4B0} \u041F\u043E\u0434\u043A\u0443\u043F\u0438\u0442\u044C \u043A\u043E\u043C\u0435\u043D\u0434\u0430\u043D\u0442\u0430 \u043A\u0440\u0435\u043F\u043E\u0441\u0442\u0438 (20 \u0438\u0437\u0443\u043C\u0440\u0443\u0434\u043E\u0432)").button("\u{1F525} \u041F\u043E\u0434\u043D\u044F\u0442\u044C \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u0438\u0435 \u043F\u0440\u043E\u0442\u0438\u0432 \u0442\u0438\u0440\u0430\u043D\u0430 (-30 \u0427\u0435\u0441\u0442\u0438)").button("\u{1F4DC} \u041F\u043E\u0442\u0440\u0435\u0431\u043E\u0432\u0430\u0442\u044C \u0430\u0443\u0434\u0438\u0435\u043D\u0446\u0438\u0438 \u043E \u0441\u043D\u0438\u0436\u0435\u043D\u0438\u0438 \u043D\u0430\u043B\u043E\u0433\u043E\u0432").button("\u041D\u0430\u0437\u0430\u0434");
    form.show(player).then((res) => {
      if (res.canceled || res.selection === 4) return;
      switch (res.selection) {
        case 0:
          this.modifyKarma(player, 25);
          player.sendMessage(`\xA7a[\u041F\u0440\u0438\u0441\u044F\u0433\u0430] \u0412\u044B \u043F\u0440\u0435\u043A\u043B\u043E\u043D\u0438\u043B\u0438 \u043A\u043E\u043B\u0435\u043D\u043E \u043F\u0435\u0440\u0435\u0434 \u0442\u0440\u043E\u043D\u043E\u043C. \u041A\u043E\u0440\u043E\u043B\u0435\u0432\u0441\u0442\u0432\u043E \u0441\u0447\u0438\u0442\u0430\u0435\u0442 \u0432\u0430\u0441 \u0441\u0432\u043E\u0438\u043C \u0437\u0430\u0449\u0438\u0442\u043D\u0438\u043A\u043E\u043C!\xA7r`);
          break;
        case 1:
          this.bribeGarrison(player, settlement);
          break;
        case 2:
          this.inciteRevolt(player, settlement);
          break;
        case 3:
          if (settlement.taxRatePercent > 10) {
            settlement.taxRatePercent = Math.max(10, settlement.taxRatePercent - 5);
            player.sendMessage(`\xA7a[\u0423\u0441\u043F\u0435\u0445] \u0412\u0430\u0448\u0438 \u0440\u0435\u0447\u0438 \u0443\u0431\u0435\u0434\u0438\u043B\u0438 \u043F\u0440\u0430\u0432\u0438\u0442\u0435\u043B\u044F \u0441\u043D\u0438\u0437\u0438\u0442\u044C \u043D\u0430\u043B\u043E\u0433\u0438 \u0434\u043E ${settlement.taxRatePercent}%! \u041D\u0430\u0440\u043E\u0434 \u043B\u0438\u043A\u0443\u0435\u0442!\xA7r`);
            this.modifyKarma(player, 15);
          } else {
            player.sendMessage("\xA7e[\u041C\u043E\u043D\u0430\u0440\u0445] \u041D\u0430\u043B\u043E\u0433\u0438 \u0432 \u043D\u0430\u0448\u0435\u043C \u043A\u043E\u0440\u043E\u043B\u0435\u0432\u0441\u0442\u0432\u0435 \u0438 \u0442\u0430\u043A \u043D\u0430\u0445\u043E\u0434\u044F\u0442\u0441\u044F \u043D\u0430 \u043C\u0438\u043D\u0438\u043C\u0430\u043B\u044C\u043D\u043E\u043C \u0443\u0440\u043E\u0432\u043D\u0435!\xA7r");
          }
          break;
      }
    });
  }
  static bribeGarrison(player, settlement) {
    const inv = player.getComponent("minecraft:inventory");
    const container = inv?.container;
    if (!container) return;
    let emeraldsFound = 0;
    for (let i = 0; i < container.size; i++) {
      const it = container.getItem(i);
      if (it && it.typeId === "minecraft:emerald") emeraldsFound += it.amount;
    }
    if (emeraldsFound < 20) {
      player.sendMessage("\xA7c[\u0418\u043D\u0442\u0440\u0438\u0433\u0430] \u0414\u043B\u044F \u043F\u043E\u0434\u043A\u0443\u043F\u0430 \u043A\u043E\u043C\u0435\u043D\u0434\u0430\u043D\u0442\u0430 \u043A\u0440\u0435\u043F\u043E\u0441\u0442\u0438 \u043D\u0443\u0436\u043D\u043E 20 \u0438\u0437\u0443\u043C\u0440\u0443\u0434\u043E\u0432!\xA7r");
      return;
    }
    let remaining = 20;
    for (let i = 0; i < container.size; i++) {
      const it = container.getItem(i);
      if (it && it.typeId === "minecraft:emerald") {
        if (it.amount <= remaining) {
          remaining -= it.amount;
          container.setItem(i, void 0);
        } else {
          it.amount -= remaining;
          container.setItem(i, it);
          remaining = 0;
        }
        if (remaining <= 0) break;
      }
    }
    settlement.militaryCount = Math.max(5, settlement.militaryCount - 15);
    player.sendMessage("\xA76[\u041F\u043E\u0434\u043A\u0443\u043F] \u041A\u043E\u043C\u0435\u043D\u0434\u0430\u043D\u0442 \u043E\u0442\u043A\u0440\u044B\u043B \u0431\u043E\u043A\u043E\u0432\u044B\u0435 \u0432\u043E\u0440\u043E\u0442\u0430 \u0438 \u0443\u0432\u0435\u043B \u0447\u0430\u0441\u0442\u044C \u0433\u0430\u0440\u043D\u0438\u0437\u043E\u043D\u0430 \u0432 \u043A\u0430\u0431\u0430\u043A! \u041E\u0431\u043E\u0440\u043E\u043D\u0430 \u0433\u043E\u0440\u043E\u0434\u0430 \u043E\u0441\u043B\u0430\u0431\u043B\u0430 \u043D\u0430 15 \u0432\u043E\u0438\u043D\u043E\u0432!\xA7r");
  }
  static inciteRevolt(player, settlement) {
    this.modifyKarma(player, -30);
    world15.sendMessage(
      `\xA7c\xA7l[\u0411\u0423\u041D\u0422!] \u0412 \u0433\u043E\u0440\u043E\u0434\u0435 ${settlement.factionId} \u0432\u0441\u043F\u044B\u0445\u043D\u0443\u043B\u043E \u0432\u043E\u043E\u0440\u0443\u0436\u0435\u043D\u043D\u043E\u0435 \u043A\u0440\u0435\u0441\u0442\u044C\u044F\u043D\u0441\u043A\u043E\u0435 \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u0438\u0435! \u041E\u043F\u043E\u043B\u0447\u0435\u043D\u0446\u044B \u0448\u0442\u0443\u0440\u043C\u0443\u044E\u0442 \u0440\u0430\u0442\u0443\u0448\u0443!\xA7r`
    );
    const dim = player.dimension;
    for (let i = 0; i < 5; i++) {
      try {
        const mob = dim.spawnEntity("feudal:bandit_leader", {
          x: settlement.throneLocation.x + (Math.random() - 0.5) * 6,
          y: settlement.throneLocation.y,
          z: settlement.throneLocation.z + (Math.random() - 0.5) * 6
        });
        mob.nameTag = `\u0412\u043E\u0436\u0430\u043A \u0432\u043E\u0441\u0441\u0442\u0430\u0432\u0448\u0438\u0445 \u0433\u043E\u0440\u043E\u0436\u0430\u043D`;
      } catch {
      }
    }
  }
};
FeudalCourtEngine.playerKarma = /* @__PURE__ */ new Map();

// behavior_pack/scripts/AdvisorUI.ts
var AdvisorUI = class {
  static openMainMenu(player, settlement) {
    const faction = FactionManager.getFaction(settlement.factionId);
    const border = BorderManager.updateBordersForSettlement(settlement);
    const rpg = PlayerRPGProfile.getProfile(player);
    const currentEvent = WorldEventsEngine.getCurrentEvent();
    const profile = settlement.economicProfile ?? "\u0410\u0433\u0440\u0430\u0440\u043D\u0430\u044F \u0436\u0438\u0442\u043D\u0438\u0446\u0430" /* AgrarianBreadbasket */;
    const trait = settlement.rulerTrait ?? "\u0411\u043B\u0430\u0433\u043E\u0440\u043E\u0434\u043D\u044B\u0439" /* Honorable */;
    let body = `\xA7l\xA76\u0422\u0438\u0442\u0443\u043B \u043F\u0440\u0430\u0432\u0438\u0442\u0435\u043B\u044F:\xA7r ${faction?.title ?? "\u0412\u043E\u0436\u0434\u044C"} ${faction?.rulerName ?? ""} (\xA7e${trait}\xA7r)
`;
    body += `\xA7l\xA7e\u042D\u043F\u043E\u0445\u0430 \u0433\u043E\u0440\u043E\u0434\u0430:\xA7r ${CityTier[settlement.tier]} (\u0420\u0443\u0431\u0435\u0436: \xA76${border.cityRadius} \u0431\u043B.\xA7r)
`;
    body += `\xA7l\xA7b\u041D\u0430\u0441\u0435\u043B\u0435\u043D\u0438\u0435:\xA7r \xA7f${settlement.population} \u0447\u0435\u043B.\xA7r | \u0413\u0430\u0440\u043D\u0438\u0437\u043E\u043D: \xA7c${settlement.militaryCount} \u0432\u043E\u0438\u043D\u043E\u0432\xA7r (${settlement.isMobilized ? "\xA7c\u041C\u041E\u0411\u0418\u041B\u0418\u0417\u0410\u0426\u0418\u042F 50%" : "\xA7a\u041C\u0418\u0420 25%"}\xA7r)
`;
    body += `\xA7l\xA73\u041F\u0440\u043E\u0444\u0438\u043B\u044C:\xA7r ${profile}
`;
    body += `\xA7l\xA7a\u041A\u0430\u0437\u043D\u0430:\xA7r ${settlement.treasury.emeralds} \u0438\u0437\u0443\u043C\u0440. | ${settlement.treasury.wood} \u0434\u0435\u0440. | ${settlement.treasury.stone} \u043A\u0430\u043C. | ${settlement.treasury.iron} \u0436\u0435\u043B. | ${settlement.treasury.food} \u0435\u0434\u044B
`;
    body += `\xA7l\xA7d\u0421\u043E\u0431\u044B\u0442\u0438\u0435 \u043C\u0438\u0440\u0430:\xA7r \xA7e${currentEvent.name}\xA7r
`;
    const form = new ActionFormData5().title(`\u0421\u043E\u0432\u0435\u0442\u043D\u0438\u043A: ${faction?.name ?? "\u041F\u043E\u0441\u0435\u043B\u0435\u043D\u0438\u0435"}`).body(body).button("\u041F\u043E\u0432\u044B\u0441\u0438\u0442\u044C \u0443\u0440\u043E\u0432\u0435\u043D\u044C \u043F\u043E\u0441\u0435\u043B\u0435\u043D\u0438\u044F").button("\u{1F3F0} \u0412\u043E\u0437\u0432\u0435\u0441\u0442\u0438/\u041F\u0435\u0440\u0435\u0441\u0442\u0440\u043E\u0438\u0442\u044C \u041A\u043E\u0440\u043E\u043B\u0435\u0432\u0441\u043A\u0438\u0439 \u0417\u0430\u043C\u043E\u043A").button("\u{1F9F1} \u0412\u043E\u0437\u0432\u0435\u0441\u0442\u0438 \u0441\u0440\u0435\u0434\u043D\u0435\u0432\u0435\u043A\u043E\u0432\u044B\u0435 \u0441\u0442\u0435\u043D\u044B \u0438 \u0431\u0430\u0448\u043D\u0438 \u0441 \u0431\u0430\u043B\u043B\u0438\u0441\u0442\u0430\u043C\u0438").button("\u{1F6A9} \u0422\u0430\u043A\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u0435 \u043F\u0440\u0438\u043A\u0430\u0437\u044B \u0438 \u0417\u043D\u0430\u043C\u044F \u043F\u043E\u043B\u043A\u043E\u0432\u043E\u0434\u0446\u0430").button("\u2696\uFE0F \u0413\u043E\u0440\u043E\u0434\u0441\u043A\u0430\u044F \u0431\u0438\u0440\u0436\u0430 \u0438 \u0422\u043E\u0440\u0433\u043E\u0432\u044B\u0439 \u0420\u044B\u043D\u043E\u043A").button("\u{1F451} \u0424\u0435\u043E\u0434\u0430\u043B\u044C\u043D\u044B\u0439 \u0434\u0432\u043E\u0440, \u0438\u043D\u0442\u0440\u0438\u0433\u0438 \u0438 \u0437\u0430\u0433\u043E\u0432\u043E\u0440\u044B").button("\u{1F3C6} \u0413\u043B\u043E\u0431\u0430\u043B\u044C\u043D\u044B\u0435 \u0441\u043E\u0431\u044B\u0442\u0438\u044F \u043C\u0438\u0440\u0430 \u0438 \u0442\u0443\u0440\u043D\u0438\u0440\u044B").button("\u2694\uFE0F \u041F\u0440\u043E\u0444\u0438\u043B\u044C \u0433\u0435\u0440\u043E\u044F, \u0431\u043E\u0435\u0432\u044B\u0435 \u044D\u043F\u0438\u0442\u0435\u0442\u044B \u0438 \u043A\u0430\u0440\u043C\u0430").button("\u{1F91D} \u0412\u043E\u0435\u043D\u043D\u044B\u0435 \u0430\u043B\u044C\u044F\u043D\u0441\u044B \u0438 \u0441\u043E\u044E\u0437\u044B \u043A\u043B\u0430\u043D\u043E\u0432").button("\u{1F3F9} \u0420\u0430\u0437\u043C\u0435\u0441\u0442\u0438\u0442\u044C \u043E\u0431\u043E\u0440\u043E\u043D\u0438\u0442\u0435\u043B\u044C\u043D\u0443\u044E \u0431\u0430\u043B\u043B\u0438\u0441\u0442\u0443 (80 \u0434\u0435\u0440, 40 \u0436\u0435\u043B)").button("\u{1F6E1}\uFE0F \u041D\u0430\u043D\u044F\u0442\u044C \u0440\u044B\u0446\u0430\u0440\u044F \u0432 \u043B\u0438\u0447\u043D\u0443\u044E \u0434\u0440\u0443\u0436\u0438\u043D\u0443 (15 \u0438\u0437\u0443\u043C\u0440\u0443\u0434\u043E\u0432)").button("\u0414\u0438\u043F\u043B\u043E\u043C\u0430\u0442\u0438\u044F \u0438 \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u044B \u0441 \u0441\u043E\u0441\u0435\u0434\u044F\u043C\u0438").button("\u0414\u043E\u0441\u043A\u0430 \u043A\u043E\u0440\u043E\u043B\u0435\u0432\u0441\u043A\u0438\u0445 \u0437\u0430\u043A\u0430\u0437\u043E\u0432 (\u041A\u0432\u0435\u0441\u0442\u044B)").button("\u0421\u043D\u0430\u0440\u044F\u0434\u0438\u0442\u044C \u043A\u043E\u043B\u043E\u043D\u0438\u0437\u0430\u0446\u0438\u044E \u0434\u0430\u043B\u0435\u043A\u0438\u0445 \u0437\u0435\u043C\u0435\u043B\u044C").button("\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u041A\u043E\u0440\u043E\u043B\u0435\u0432\u0441\u043A\u0438\u0439 \u0410\u0442\u043B\u0430\u0441 \u0438 \u041A\u0430\u0440\u0442\u0443").button("\u041F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u0441\u0443\u0442\u043E\u0447\u043D\u043E\u0435 \u0436\u0430\u043B\u043E\u0432\u0430\u043D\u0438\u0435 \u0432\u043E\u0438\u043D\u0430").button("\u0421\u0434\u0430\u0442\u044C \u0442\u0440\u043E\u0444\u0435\u0439 (\u0413\u043E\u043B\u043E\u0432\u0430 \u0430\u0442\u0430\u043C\u0430\u043D\u0430)").button("\u0417\u0430\u043A\u0440\u044B\u0442\u044C");
    form.show(player).then((response) => {
      if (response.canceled) return;
      switch (response.selection) {
        case 0:
          this.handleUpgrade(player, settlement);
          break;
        case 1:
          this.openCastleConstructionMenu(player, settlement);
          break;
        case 2:
          MedievalWallEngine.constructFortifiedCitadelPerimeter(settlement);
          player.sendMessage("\xA7a[\u0417\u043E\u0434\u0447\u0438\u0439] \u041A\u0430\u043C\u0435\u043D\u0449\u0438\u043A\u0438 \u043F\u0440\u0438\u0441\u0442\u0443\u043F\u0438\u043B\u0438 \u043A \u0432\u043E\u0437\u0432\u0435\u0434\u0435\u043D\u0438\u044E \u0441\u0440\u0435\u0434\u043D\u0435\u0432\u0435\u043A\u043E\u0432\u044B\u0445 \u0441\u0442\u0435\u043D, \u0431\u0430\u0441\u0442\u0438\u043E\u043D\u043E\u0432 \u0438 \u0431\u0430\u043B\u043B\u0438\u0441\u0442!\xA7r");
          break;
        case 3:
          SquadTacticsEngine.openTacticsMenu(player, settlement);
          break;
        case 4:
          MarketplaceEngine.openMarketMenu(player, settlement);
          break;
        case 5:
          FeudalCourtEngine.openCourtMenu(player, settlement);
          break;
        case 6:
          this.openWorldEventsMenu(player);
          break;
        case 7:
          this.openHeroSheet(player);
          break;
        case 8:
          this.openAlliancesMenu(player, settlement);
          break;
        case 9:
          this.buildWallBallista(player, settlement);
          break;
        case 10:
          this.hireRetinueKnight(player);
          break;
        case 11:
          this.openDiplomacyMenu(player, settlement);
          break;
        case 12:
          this.openQuestBoard(player, settlement);
          break;
        case 13:
          this.handleColonization(player, settlement);
          break;
        case 14:
          WorldMapUI.openRealmMap(player);
          break;
        case 15:
          MilitaryCareer.claimDailySalary(player);
          break;
        case 16:
          MilitaryCareer.turnInBanditBounty(player);
          break;
      }
    });
  }
  static openCastleConstructionMenu(player, settlement) {
    const form = new ActionFormData5().title("\u041A\u043E\u0440\u043E\u043B\u0435\u0432\u0441\u043A\u0438\u0439 \u0410\u0440\u0445\u0438\u0442\u0435\u043A\u0442\u043E\u0440: \u0417\u0430\u043C\u043A\u0438").body("\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043C\u0430\u0441\u0448\u0442\u0430\u0431 \u0432\u043E\u0437\u0432\u043E\u0434\u0438\u043C\u043E\u0433\u043E \u0437\u0430\u043C\u043A\u043E\u0432\u043E\u0433\u043E \u043A\u043E\u043C\u043F\u043B\u0435\u043A\u0441\u0430 \u0432\u043E\u043A\u0440\u0443\u0433 \u0442\u0440\u043E\u043D\u0430:").button("\u{1F451} \u041A\u041E\u041B\u041E\u0421\u0421\u0410\u041B\u042C\u041D\u042B\u0419 \u0418\u041C\u041F\u0415\u0420\u0421\u041A\u0418\u0419 \u041A\u0420\u0415\u041C\u041B\u042C-\u0426\u0418\u0422\u0410\u0414\u0415\u041B\u042C (200\u0445200 \u0431\u043B\u043E\u043A\u043E\u0432!)").button("\u{1F3F0} \u0412\u0435\u043B\u0438\u043A\u0430\u044F \u0433\u0435\u0440\u0446\u043E\u0433\u0441\u043A\u0430\u044F \u043A\u0440\u0435\u043F\u043E\u0441\u0442\u044C (100\u0445100 \u0431\u043B\u043E\u043A\u043E\u0432)").button(`\u{1F3F0} \u0417\u0430\u043C\u043E\u043A \u043F\u043E \u0442\u0435\u043A\u0443\u0449\u0435\u0439 \u044D\u043F\u043E\u0445\u0435 \u0433\u043E\u0440\u043E\u0434\u0430 (${CityTier[settlement.tier]})`).button("\u041D\u0430\u0437\u0430\u0434");
    form.show(player).then((res) => {
      if (res.canceled || res.selection === 3) return;
      if (res.selection === 0) {
        CastleArchitectureEngine.constructOrUpgradeCastle(settlement, "\u041A\u043E\u043B\u043E\u0441\u0441\u0430\u043B\u044C\u043D\u044B\u0439 \u041A\u0440\u0435\u043C\u043B\u044C-\u0426\u0438\u0442\u0430\u0434\u0435\u043B\u044C (200x200)" /* GrandCitadel200x200 */);
        player.sendMessage("\xA76\xA7l[\u0418\u041C\u041F\u0415\u0420\u0421\u041A\u0418\u0419 \u041A\u0420\u0415\u041C\u041B\u042C] \u0417\u043E\u0434\u0447\u0438\u0435 \u043D\u0430\u0447\u0430\u043B\u0438 \u0432\u043E\u0437\u0432\u0435\u0434\u0435\u043D\u0438\u0435 \u043A\u043E\u043B\u043E\u0441\u0441\u0430\u043B\u044C\u043D\u043E\u0439 \u0446\u0438\u0442\u0430\u0434\u0435\u043B\u0438 200\u0445200 \u0431\u043B\u043E\u043A\u043E\u0432 \u0441 8 \u0431\u0430\u0441\u0442\u0438\u043E\u043D\u0430\u043C\u0438, \u0441\u0442\u0435\u043D\u0430\u043C\u0438 \u0438 \u0434\u0432\u043E\u0440\u0446\u043E\u043C!\xA7r");
      } else if (res.selection === 1) {
        CastleArchitectureEngine.constructOrUpgradeCastle(settlement, "\u0413\u0435\u0440\u0446\u043E\u0433\u0441\u043A\u0430\u044F \u043A\u0440\u0435\u043F\u043E\u0441\u0442\u044C (100x100)" /* DucalKeep */);
        player.sendMessage("\xA7a[\u0417\u043E\u0434\u0447\u0438\u0439] \u0421\u0442\u0440\u043E\u0438\u0442\u0435\u043B\u044C\u0441\u0442\u0432\u043E \u0433\u0435\u0440\u0446\u043E\u0433\u0441\u043A\u043E\u0439 \u043A\u0440\u0435\u043F\u043E\u0441\u0442\u0438 100\u0445100 \u0431\u043B\u043E\u043A\u043E\u0432 \u043D\u0430\u0447\u0430\u043B\u043E\u0441\u044C!\xA7r");
      } else if (res.selection === 2) {
        CastleArchitectureEngine.constructOrUpgradeCastle(settlement);
        player.sendMessage(`\xA7a[\u0417\u043E\u0434\u0447\u0438\u0439] \u0421\u0442\u0440\u043E\u0438\u0442\u0435\u043B\u044C\u0441\u0442\u0432\u043E \u0437\u0430\u043C\u043A\u0430 \u044D\u043F\u043E\u0445\u0438 ${CityTier[settlement.tier]} \u043D\u0430\u0447\u0430\u043B\u043E\u0441\u044C \u0432\u043E\u043A\u0440\u0443\u0433 \u0442\u0440\u043E\u043D\u0430!\xA7r`);
      }
    });
  }
  static openWorldEventsMenu(player) {
    const ev = WorldEventsEngine.getCurrentEvent();
    let text = `\xA7l\xA76=== \u041B\u0415\u0422\u041E\u041F\u0418\u0421\u042C \u041C\u0418\u0420\u0410 \u0418 \u0413\u041B\u041E\u0411\u0410\u041B\u042C\u041D\u042B\u0425 \u0421\u041E\u0411\u042B\u0422\u0418\u0419 ===\xA7r

`;
    text += `\xA7e\u0422\u0435\u043A\u0443\u0449\u0435\u0435 \u0441\u043E\u0431\u044B\u0442\u0438\u0435:\xA7f ${ev.name}\xA7r
`;
    text += `\xA77${ev.description}\xA7r

`;
    text += `\xA7e\u0414\u043B\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C:\xA7b ~${Math.ceil(ev.ticksRemaining / 20)} \u0441\u0435\u043A.\xA7r

`;
    text += `\xA76\u0412\u043E\u0437\u043C\u043E\u0436\u043D\u044B\u0435 \u0441\u043E\u0431\u044B\u0442\u0438\u044F \u044D\u043F\u043E\u0445\u0438:\xA7r
`;
    text += `  \u2022 \xA7c\u0412\u0442\u043E\u0440\u0436\u0435\u043D\u0438\u0435 \u0421\u0442\u0435\u043F\u043D\u043E\u0439 \u041E\u0440\u0434\u044B\xA7r (\u043D\u0430\u0448\u0435\u0441\u0442\u0432\u0438\u0435 \u0441\u043E\u0442\u0435\u043D \u0432\u0441\u0430\u0434\u043D\u0438\u043A\u043E\u0432 \u0438 \u043A\u0430\u0442\u0430\u043F\u0443\u043B\u044C\u0442)
`;
    text += `  \u2022 \xA76\u0412\u0435\u043B\u0438\u043A\u0438\u0439 \u0420\u044B\u0446\u0430\u0440\u0441\u043A\u0438\u0439 \u0422\u0443\u0440\u043D\u0438\u0440\xA7r (\u0434\u0443\u044D\u043B\u0438 \u0447\u0435\u043C\u043F\u0438\u043E\u043D\u043E\u0432 \u0437\u0430 \u043A\u0443\u0448 \u0432 100 \u0438\u0437\u0443\u043C\u0440\u0443\u0434\u043E\u0432)
`;
    text += `  \u2022 \xA75\u0412\u0435\u043B\u0438\u043A\u0430\u044F \u0427\u0443\u043C\u0430\xA7r (\u043C\u043E\u0440\u043E\u0432\u043E\u0435 \u043F\u043E\u0432\u0435\u0442\u0440\u0438\u0435 \u0438 \u0432\u0437\u043B\u0435\u0442 \u0446\u0435\u043D \u043D\u0430 \u043F\u0440\u043E\u0432\u0438\u0430\u043D\u0442)
`;
    text += `  \u2022 \xA7a\u0417\u043E\u043B\u043E\u0442\u0430\u044F \u041B\u0438\u0445\u043E\u0440\u0430\u0434\u043A\u0430\xA7r (\u0443\u0434\u0432\u043E\u0435\u043D\u0438\u0435 \u0431\u043E\u0433\u0430\u0442\u0441\u0442\u0432 \u0448\u0430\u0445\u0442\u0435\u0440\u0441\u043A\u0438\u0445 \u0433\u043E\u0440\u043E\u0434\u043E\u0432)
`;
    text += `  \u2022 \xA7c\u041A\u0440\u0435\u0441\u0442\u044C\u044F\u043D\u0441\u043A\u0438\u0439 \u0411\u0443\u043D\u0442\xA7r (\u0432\u043E\u0441\u0441\u0442\u0430\u043D\u0438\u044F \u0433\u043E\u0440\u043E\u0436\u0430\u043D \u043F\u0440\u043E\u0442\u0438\u0432 \u0436\u0430\u0434\u043D\u044B\u0445 \u043B\u043E\u0440\u0434\u043E\u0432)
`;
    const form = new MessageFormData4().title("\u0421\u043E\u0431\u044B\u0442\u0438\u044F \u0438 \u0422\u0443\u0440\u043D\u0438\u0440\u044B \u041C\u0438\u0440\u0430").body(text).button1("\u041F\u0440\u0438\u043D\u044F\u0442\u044C \u043A \u0441\u0432\u0435\u0434\u0435\u043D\u0438\u044E").button2("\u041D\u0430\u0437\u0430\u0434");
    form.show(player).then(() => {
    });
  }
  static buildWallBallista(player, settlement) {
    if (settlement.treasury.wood < 80 || settlement.treasury.iron < 40) {
      player.sendMessage("\xA7c[\u0413\u0430\u0440\u043D\u0438\u0437\u043E\u043D] \u0414\u043B\u044F \u0432\u043E\u0437\u0432\u0435\u0434\u0435\u043D\u0438\u044F \u0437\u0430\u0449\u0438\u0442\u043D\u043E\u0439 \u0431\u0430\u043B\u043B\u0438\u0441\u0442\u044B \u0442\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F 80 \u0434\u0435\u0440\u0435\u0432\u0430 \u0438 40 \u0436\u0435\u043B\u0435\u0437\u0430 \u0432 \u043A\u0430\u0437\u043D\u0435!\xA7r");
      return;
    }
    settlement.treasury.wood -= 80;
    settlement.treasury.iron -= 40;
    try {
      const ballista = player.dimension.spawnEntity("feudal:ballista", {
        x: player.location.x,
        y: player.location.y,
        z: player.location.z
      });
      ballista.nameTag = `\u0417\u0430\u0449\u0438\u0442\u043D\u0430\u044F \u0431\u0430\u043B\u043B\u0438\u0441\u0442\u0430 \u0433\u043E\u0440\u043E\u0434\u0430 ${settlement.factionId}`;
      player.sendMessage("\xA7a[\u0413\u0430\u0440\u043D\u0438\u0437\u043E\u043D] \u0422\u044F\u0436\u0435\u043B\u0430\u044F \u043E\u0431\u043E\u0440\u043E\u043D\u0438\u0442\u0435\u043B\u044C\u043D\u0430\u044F \u0431\u0430\u043B\u043B\u0438\u0441\u0442\u0430 \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0430 \u043D\u0430 \u0431\u043E\u0435\u0432\u043E\u0439 \u0440\u0443\u0431\u0435\u0436!\xA7r");
    } catch {
      player.sendMessage("\xA7c[\u041E\u0448\u0438\u0431\u043A\u0430] \u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0440\u0430\u0437\u043C\u0435\u0441\u0442\u0438\u0442\u044C \u043E\u0440\u0443\u0434\u0438\u0435 \u0432 \u0434\u0430\u043D\u043D\u043E\u0439 \u0442\u043E\u0447\u043A\u0435.\xA7r");
    }
  }
  static openHeroSheet(player) {
    const rpg = PlayerRPGProfile.getProfile(player);
    PlayerRPGProfile.applyHealthAndPassives(player, rpg);
    const karma = FeudalCourtEngine.getKarma(player);
    const repTitle = FeudalCourtEngine.getCourtReputationTitle(karma);
    let info = `\xA7l\xA76=== \u041B\u0418\u0427\u041D\u041E\u0415 \u0414\u0415\u041B\u041E \u0412\u041E\u0418\u0422\u0415\u041B\u042F ===\xA7r

`;
    info += `\xA7e\u0418\u043C\u044F:\xA7f ${player.name}\xA7r
`;
    info += `\xA7e\u0424\u0435\u043E\u0434\u0430\u043B\u044C\u043D\u044B\u0439 \u0442\u0438\u0442\u0443\u043B:\xA7a ${rpg.feudalTitle}\xA7r
`;
    info += `\xA7e\u041F\u0440\u0438\u0434\u0432\u043E\u0440\u043D\u044B\u0439 \u0441\u0442\u0430\u0442\u0443\u0441:\xA7b ${repTitle}\xA7r (\u041A\u0430\u0440\u043C\u0430: ${karma})
`;
    info += `\xA7e\u041F\u043E\u0432\u0435\u0440\u0436\u0435\u043D\u043E \u0440\u044F\u0434\u043E\u0432\u044B\u0445 \u0432\u0440\u0430\u0433\u043E\u0432:\xA7f ${rpg.regularKills}\xA7r
`;
    info += `\xA7e\u0421\u0440\u0430\u0436\u0435\u043D\u043E \u0433\u043B\u0430\u0432\u0430\u0440\u0435\u0439 \u0440\u0430\u0437\u0431\u043E\u0439\u043D\u0438\u043A\u043E\u0432:\xA7c ${rpg.banditBossKills}\xA7r
`;
    info += `\xA7e\u0421\u0432\u0435\u0440\u0433\u043D\u0443\u0442\u043E \u0432\u0440\u0430\u0436\u0435\u0441\u043A\u0438\u0445 \u043F\u0440\u0430\u0432\u0438\u0442\u0435\u043B\u0435\u0439:\xA7d ${rpg.rulerKills}\xA7r
`;
    info += `\xA7e\u0423\u043D\u0438\u0447\u0442\u043E\u0436\u0435\u043D\u043E \u043E\u0441\u0430\u0434\u043D\u044B\u0445 \u043C\u0430\u0448\u0438\u043D:\xA76 ${rpg.siegeKills}\xA7r

`;
    info += `\xA7l\xA76\u041E\u0422\u041A\u0420\u042B\u0422\u042B\u0415 \u0411\u041E\u0415\u0412\u042B\u0415 \u042D\u041F\u0418\u0422\u0415\u0422\u042B:\xA7r
`;
    if (rpg.unlockedEpithets.length === 0) {
      info += `\xA77\u041F\u043E\u043A\u0430 \u043D\u0435\u0442 \u043E\u0442\u043A\u0440\u044B\u0442\u044B\u0445 \u044D\u043F\u0438\u0442\u0435\u0442\u043E\u0432. \u0421\u0440\u0430\u0436\u0430\u0439\u0442\u0435\u0441\u044C \u0441 \u0431\u0430\u043D\u0434\u0438\u0442\u0430\u043C\u0438 \u0438 \u0431\u043E\u0441\u0441\u0430\u043C\u0438, \u0447\u0442\u043E\u0431\u044B \u0437\u0430\u0441\u043B\u0443\u0436\u0438\u0442\u044C \u0441\u043B\u0430\u0432\u0443!\xA7r
`;
    } else {
      for (const ep of rpg.unlockedEpithets) {
        info += `  \u2728 \xA7b\xAB${ep}\xBB\xA7r
`;
      }
    }
    const form = new MessageFormData4().title("\u0425\u0430\u0440\u0430\u043A\u0442\u0435\u0440\u0438\u0441\u0442\u0438\u043A\u0438 \u0433\u0435\u0440\u043E\u044F (MMO RPG)").body(info).button1("\u041E\u043A").button2("\u041D\u0430\u0437\u0430\u0434");
    form.show(player).then(() => {
    });
  }
  static hireRetinueKnight(player) {
    const inv = player.getComponent("minecraft:inventory");
    const container = inv?.container;
    if (!container) return;
    let emeraldsFound = 0;
    for (let i = 0; i < container.size; i++) {
      const it = container.getItem(i);
      if (it && it.typeId === "minecraft:emerald") emeraldsFound += it.amount;
    }
    if (emeraldsFound < 15) {
      player.sendMessage("[\u041A\u0430\u0437\u0430\u0440\u043C\u0430] \u041D\u0430\u0439\u043C \u044D\u043B\u0438\u0442\u043D\u043E\u0433\u043E \u0440\u044B\u0446\u0430\u0440\u044F \u0441\u0442\u043E\u0438\u0442 15 \u0438\u0437\u0443\u043C\u0440\u0443\u0434\u043E\u0432!");
      return;
    }
    let remaining = 15;
    for (let i = 0; i < container.size; i++) {
      const it = container.getItem(i);
      if (it && it.typeId === "minecraft:emerald") {
        if (it.amount <= remaining) {
          remaining -= it.amount;
          container.setItem(i, void 0);
        } else {
          it.amount -= remaining;
          container.setItem(i, it);
          remaining = 0;
        }
        if (remaining <= 0) break;
      }
    }
    try {
      const knight = player.dimension.spawnEntity("feudal:royal_knight", {
        x: player.location.x + 1,
        y: player.location.y,
        z: player.location.z + 1
      });
      knight.nameTag = `\u0413\u0432\u0430\u0440\u0434\u0435\u0435\u0446 \u0434\u0440\u0443\u0436\u0438\u043D\u044B ${player.name}`;
      player.sendMessage("\xA7a[\u0414\u0440\u0443\u0436\u0438\u043D\u0430] \u042D\u043B\u0438\u0442\u043D\u044B\u0439 \u0440\u044B\u0446\u0430\u0440\u044C \u043F\u0440\u0438\u0441\u044F\u0433\u043D\u0443\u043B \u0432\u0430\u043C \u043D\u0430 \u0432\u0435\u0440\u043D\u043E\u0441\u0442\u044C \u0438 \u0441\u043B\u0435\u0434\u0443\u0435\u0442 \u0437\u0430 \u0432\u0430\u043C\u0438 \u0432 \u0431\u043E\u0439!\xA7r");
    } catch {
    }
  }
  static openAlliancesMenu(player, settlement) {
    const alliances = AllianceSystem.getAllAlliances();
    let text = `\xA7l\xA76\u0410\u041A\u0422\u0418\u0412\u041D\u042B\u0415 \u0412\u041E\u0415\u041D\u041D\u042B\u0415 \u0421\u041E\u042E\u0417\u042B \u0418 \u041E\u0420\u0414\u042B:\xA7r

`;
    for (const al of alliances.values()) {
      const type = al.isBanditConfederacy ? "\xA7c[\u0411\u0410\u041D\u0414\u0418\u0422\u0421\u041A\u0410\u042F \u041E\u0420\u0414\u0410]\xA7r" : "\xA7b[\u0421\u0412\u042F\u0429\u0415\u041D\u041D\u0410\u042F \u041B\u0418\u0413\u0410]\xA7r";
      text += `${type} \xA7e\xAB${al.name}\xBB\xA7r
`;
      text += `  \u2022 \u041B\u0438\u0434\u0435\u0440: ${al.leaderFactionId} | \u0421\u0438\u043B\u0430 \u0430\u0440\u043C\u0438\u0438: \xA7c${al.totalArmyStrength}\xA7r
`;
      text += `  \u2022 \u0427\u043B\u0435\u043D\u044B: ${al.memberFactionIds.join(", ")}

`;
    }
    const form = new ActionFormData5().title("\u0412\u043E\u0435\u043D\u043D\u044B\u0435 \u0410\u043B\u044C\u044F\u043D\u0441\u044B").body(text).button("\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043D\u043E\u0432\u0443\u044E \u0421\u0432\u044F\u0449\u0435\u043D\u043D\u0443\u044E \u041A\u043E\u0430\u043B\u0438\u0446\u0438\u044E").button("\u041F\u0440\u0438\u0437\u0432\u0430\u0442\u044C \u0430\u0440\u043C\u0438\u044E \u0441\u043E\u044E\u0437\u043D\u0438\u043A\u043E\u0432 \u043D\u0430 \u043F\u043E\u043C\u043E\u0449\u044C").button("\u041D\u0430\u0437\u0430\u0434");
    form.show(player).then((res) => {
      if (res.canceled || res.selection === 2) return;
      if (res.selection === 0) {
        AllianceSystem.createAlliance(
          `\u0412\u0435\u043B\u0438\u043A\u0430\u044F \u041A\u043E\u0430\u043B\u0438\u0446\u0438\u044F ${settlement.factionId}`,
          settlement.factionId,
          [settlement.factionId, "fact_kingdom_1"],
          false
        );
        player.sendMessage("[\u0414\u0438\u043F\u043B\u043E\u043C\u0430\u0442\u0438\u044F] \u041D\u043E\u0432\u044B\u0439 \u0432\u043E\u0435\u043D\u043D\u044B\u0439 \u0430\u043B\u044C\u044F\u043D\u0441 \u043F\u0440\u043E\u0432\u043E\u0437\u0433\u043B\u0430\u0448\u0435\u043D!");
      } else if (res.selection === 1) {
        player.sendMessage("\xA7b[\u0413\u043E\u0440\u043D] \u0421\u043E\u044E\u0437\u043D\u044B\u0435 \u043E\u0442\u0440\u044F\u0434\u044B \u0432\u044B\u0434\u0432\u0438\u043D\u0443\u043B\u0438\u0441\u044C \u043D\u0430 \u0441\u043E\u0435\u0434\u0438\u043D\u0435\u043D\u0438\u0435 \u0441 \u0432\u0430\u0448\u0438\u043C \u0433\u0430\u0440\u043D\u0438\u0437\u043E\u043D\u043E\u043C!\xA7r");
      }
    });
  }
  static handleUpgrade(player, settlement) {
    if (CityProgression.canUpgrade(settlement)) {
      CityProgression.upgradeTier(settlement);
      BorderManager.updateBordersForSettlement(settlement);
    } else {
      player.sendMessage("[\u0421\u043E\u0432\u0435\u0442\u043D\u0438\u043A] \u041D\u0430\u043C \u043D\u0435 \u0445\u0432\u0430\u0442\u0430\u0435\u0442 \u0440\u0435\u0441\u0443\u0440\u0441\u043E\u0432 \u0438\u043B\u0438 \u043B\u044E\u0434\u0435\u0439 \u0434\u043B\u044F \u043F\u0435\u0440\u0435\u0445\u043E\u0434\u0430 \u0432 \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0443\u044E \u044D\u043F\u043E\u0445\u0443!");
    }
  }
  static openDiplomacyMenu(player, settlement) {
    const form = new ActionFormData5().title("\u0414\u0438\u043F\u043B\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u041F\u0430\u043B\u0430\u0442\u0430").body("\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u0432\u043E \u0432\u043D\u0435\u0448\u043D\u0435\u0439 \u043F\u043E\u043B\u0438\u0442\u0438\u043A\u0435 \u0441 \u0441\u043E\u0441\u0435\u0434\u043D\u0438\u043C\u0438 \u0444\u0440\u0430\u043A\u0446\u0438\u044F\u043C\u0438:").button("\u0417\u0430\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0422\u043E\u0440\u0433\u043E\u0432\u044B\u0439 \u0421\u043E\u044E\u0437 (\u0422\u043E\u0440\u0433\u043E\u0432\u043B\u044F \u043C\u0443\u043B\u0430\u043C\u0438 \u0438 \u043A\u043E\u0440\u0430\u0431\u043B\u044F\u043C\u0438)").button("\u041F\u0440\u0435\u0434\u043B\u043E\u0436\u0438\u0442\u044C \u0412\u0430\u0441\u0441\u0430\u043B\u0438\u0442\u0435\u0442 (\u0421\u0431\u043E\u0440 \u0434\u0430\u043D\u0438)").button("\u041F\u0430\u043A\u0442 \u043E \u043D\u0435\u043D\u0430\u043F\u0430\u0434\u0435\u043D\u0438\u0438").button("\u041E\u0431\u044A\u044F\u0432\u0438\u0442\u044C \u0424\u0435\u043E\u0434\u0430\u043B\u044C\u043D\u0443\u044E \u0412\u043E\u0439\u043D\u0443 \u043A\u043B\u0430\u043D\u0443").button("\u041D\u0430\u0437\u0430\u0434");
    form.show(player).then((res) => {
      if (res.canceled || res.selection === 4) return;
      switch (res.selection) {
        case 0:
          player.sendMessage("[\u0414\u0438\u043F\u043B\u043E\u043C\u0430\u0442] \u0422\u043E\u0440\u0433\u043E\u0432\u044B\u0439 \u0441\u043E\u044E\u0437 \u0441\u043A\u0440\u0435\u043F\u043B\u0435\u043D \u043F\u0435\u0447\u0430\u0442\u044C\u044E! \u0422\u043E\u0440\u0433\u043E\u0432\u044B\u0435 \u043E\u0431\u043E\u0437\u044B \u0438 \u043A\u043E\u0433\u0433\u0438 \u0432\u044B\u0448\u043B\u0438 \u043D\u0430 \u043C\u0430\u0440\u0448\u0440\u0443\u0442.");
          settlement.treasury.emeralds += 20;
          break;
        case 1:
          player.sendMessage("[\u0414\u0438\u043F\u043B\u043E\u043C\u0430\u0442] \u041F\u043E\u0441\u043B\u0430\u043D\u043D\u0438\u043A \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D \u0441 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u0435\u043C \u0432\u0430\u0441\u0441\u0430\u043B\u044C\u043D\u043E\u0439 \u043A\u043B\u044F\u0442\u0432\u044B.");
          break;
        case 2:
          player.sendMessage("[\u0414\u0438\u043F\u043B\u043E\u043C\u0430\u0442] \u041F\u0430\u043A\u0442 \u043E \u043D\u0435\u043D\u0430\u043F\u0430\u0434\u0435\u043D\u0438\u0438 \u043F\u043E\u0434\u043F\u0438\u0441\u0430\u043D \u0441\u0440\u043E\u043A\u043E\u043C \u043D\u0430 30 \u0438\u0433\u0440\u043E\u0432\u044B\u0445 \u0434\u043D\u0435\u0439.");
          break;
        case 3:
          player.sendMessage("\xA7c[\u0412\u041E\u0419\u041D\u0410] \u0422\u0440\u0443\u0431\u0438\u0442\u0435 \u0432 \u0431\u043E\u0435\u0432\u043E\u0439 \u0440\u043E\u0433! \u041E\u0431\u044A\u044F\u0432\u043B\u0435\u043D \u043F\u043E\u0445\u043E\u0434 \u043F\u0440\u043E\u0442\u0438\u0432 \u0440\u0430\u0437\u0431\u043E\u0439\u043D\u0438\u043A\u043E\u0432!\xA7r");
          break;
      }
    });
  }
  static openQuestBoard(player, settlement) {
    const form = new ActionFormData5().title("\u0414\u043E\u0441\u043A\u0430 \u041A\u043E\u0440\u043E\u043B\u0435\u0432\u0441\u043A\u0438\u0445 \u0417\u0430\u043A\u0430\u0437\u043E\u0432").body("\u0413\u043E\u0440\u043E\u0434 \u043D\u0443\u0436\u0434\u0430\u0435\u0442\u0441\u044F \u0432 \u043F\u043E\u043C\u043E\u0449\u0438 \u0441\u043C\u0435\u043B\u044B\u0445 \u0430\u0432\u0430\u043D\u0442\u044E\u0440\u0438\u0441\u0442\u043E\u0432:").button("\u0417\u0430\u043A\u0430\u0437 \u043B\u0435\u0441\u043E\u043F\u0438\u043B\u043A\u0438: \u0421\u0434\u0430\u0442\u044C 64 \u0434\u0443\u0431\u043E\u0432\u044B\u0445 \u0431\u0440\u0435\u0432\u043D\u0430 (+16 \u0438\u0437\u0443\u043C\u0440\u0443\u0434\u043E\u0432)").button("\u0417\u0430\u043A\u0430\u0437 \u043A\u0430\u043C\u0435\u043D\u043E\u043B\u043E\u043C\u043D\u0438: \u0421\u0434\u0430\u0442\u044C 64 \u0431\u0443\u043B\u044B\u0436\u043D\u0438\u043A\u0430 (+12 \u0438\u0437\u0443\u043C\u0440\u0443\u0434\u043E\u0432)").button("\u0417\u0430\u0447\u0438\u0441\u0442\u043A\u0430 \u0442\u0440\u0430\u043A\u0442\u0430: \u0423\u043D\u0438\u0447\u0442\u043E\u0436\u0438\u0442\u044C \u0437\u0430\u0441\u0430\u0434\u0443 \u0431\u0430\u043D\u0434\u0438\u0442\u043E\u0432 (+30 \u0438\u0437\u0443\u043C\u0440\u0443\u0434\u043E\u0432)").button("\u041D\u0430\u0437\u0430\u0434");
    form.show(player).then((res) => {
      if (res.canceled || res.selection === 3) return;
      const inv = player.getComponent("minecraft:inventory");
      const container = inv?.container;
      if (!container) return;
      if (res.selection === 0) {
        container.addItem(new ItemStack3("minecraft:emerald", 16));
        settlement.treasury.wood += 64;
        player.sendMessage("[\u0421\u0442\u0430\u0440\u043E\u0441\u0442\u0430] \u041B\u0435\u0441\u043E\u043F\u0438\u043B\u043A\u0430 \u043F\u043E\u043F\u043E\u043B\u043D\u0435\u043D\u0430 \u0434\u0440\u0435\u0432\u0435\u0441\u0438\u043D\u043E\u0439! \u041D\u0430\u0433\u0440\u0430\u0434\u0430 \u0432\u044B\u0434\u0430\u043D\u0430.");
      } else if (res.selection === 1) {
        container.addItem(new ItemStack3("minecraft:emerald", 12));
        settlement.treasury.stone += 64;
        player.sendMessage("[\u041A\u0430\u043C\u0435\u043D\u043E\u043B\u043E\u043C\u043D\u044F] \u0411\u0443\u043B\u044B\u0436\u043D\u0438\u043A \u043F\u0440\u0438\u043D\u044F\u0442 \u0432 \u043A\u0430\u0437\u043D\u0443! \u041D\u0430\u0433\u0440\u0430\u0434\u0430 \u0432\u044B\u0434\u0430\u043D\u0430.");
      } else if (res.selection === 2) {
        MilitaryCareer.addVictory(player);
        container.addItem(new ItemStack3("minecraft:emerald", 30));
        player.sendMessage("[\u041C\u0430\u0440\u0448\u0430\u043B] \u0417\u0430\u0441\u0430\u0434\u0430 \u043F\u043E\u0434\u0430\u0432\u043B\u0435\u043D\u0430! \u0412\u043E\u0435\u043D\u043D\u0430\u044F \u0441\u043B\u0430\u0432\u0430 \u0432\u043E\u0437\u0440\u043E\u0441\u043B\u0430.");
      }
    });
  }
  static handleColonization(player, settlement) {
    if (!ColonizationEngine.canColonize(settlement)) {
      player.sendMessage(
        "[\u0421\u043E\u0432\u0435\u0442\u043D\u0438\u043A] \u0414\u043B\u044F \u043A\u043E\u043B\u043E\u043D\u0438\u0437\u0430\u0446\u0438\u0438 \u0434\u0430\u043B\u0435\u043A\u0438\u0445 \u0437\u0435\u043C\u0435\u043B\u044C \u0433\u043E\u0440\u043E\u0434 \u0434\u043E\u043B\u0436\u0435\u043D \u0434\u043E\u0441\u0442\u0438\u0447\u044C 4 \u044D\u043F\u043E\u0445\u0438 (\u0413\u043E\u0440\u043E\u0434-\u043A\u0440\u0435\u043F\u043E\u0441\u0442\u044C), \u0430 \u0432 \u043A\u0430\u0437\u043D\u0435 \u0434\u043E\u043B\u0436\u043D\u043E \u0431\u044B\u0442\u044C 400 \u0434\u0435\u0440\u0435\u0432\u0430, 250 \u043A\u0430\u043C\u043D\u044F, 150 \u0435\u0434\u044B, 40 \u0438\u0437\u0443\u043C\u0440\u0443\u0434\u043E\u0432 \u0438 \u043E\u0442 30 \u0436\u0438\u0442\u0435\u043B\u0435\u0439!"
      );
      return;
    }
    const modal = new ModalFormData2().title("\u0421\u043D\u0430\u0440\u044F\u0434\u0438\u0442\u044C \u041A\u043E\u043B\u043E\u043D\u0438\u0437\u0430\u0446\u0438\u043E\u043D\u043D\u0443\u044E \u042D\u043A\u0441\u043F\u0435\u0434\u0438\u0446\u0438\u044E").textField("\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043D\u043E\u0432\u043E\u0433\u043E \u043F\u043E\u0441\u0435\u043B\u0435\u043D\u0438\u044F:", "\u041D\u043E\u0432\u044B\u0439 \u042D\u0434\u0438\u043D\u0431\u0443\u0440\u0433", "\u041D\u043E\u0432\u0430\u044F \u041A\u043E\u043B\u043E\u043D\u0438\u044F");
    modal.show(player).then((res) => {
      if (res.canceled) return;
      const colonyName = res.formValues?.[0] || "\u041D\u043E\u0432\u0430\u044F \u041A\u043E\u043B\u043E\u043D\u0438\u044F";
      ColonizationEngine.launchExpedition(settlement, colonyName);
    });
  }
};

// behavior_pack/scripts/LogisticsCaravan.ts
import { world as world17 } from "@minecraft/server";
var LogisticsCaravanManager = class {
  static dispatchCaravan(sourceCityId, targetCityId, dimension, path, resourceValue) {
    if (path.length < 2) return;
    const start = path[0];
    const caravanId = `caravan_${Date.now()}_${Math.floor(Math.random() * 1e3)}`;
    const mule = dimension.spawnEntity("minecraft:mule", { x: start.x, y: start.y, z: start.z });
    mule.addTag(`caravan_cargo:${caravanId}`);
    mule.nameTag = `\u041E\u0431\u043E\u0437 [${resourceValue} \u0440\u0435\u0441\u0443\u0440\u0441\u043E\u0432]`;
    const guardIds = [];
    let messengerId = void 0;
    const guardCount = resourceValue > 500 ? 6 : resourceValue > 200 ? 3 : 2;
    const hasCavalry = resourceValue > 200;
    for (let i = 0; i < guardCount; i++) {
      const guard = dimension.spawnEntity("feudal:city_guard", {
        x: start.x + (Math.random() * 2 - 1),
        y: start.y,
        z: start.z + (Math.random() * 2 - 1)
      });
      guard.addTag(`caravan_escort:${caravanId}`);
      guardIds.push(guard.id);
    }
    if (hasCavalry) {
      const horse = dimension.spawnEntity("minecraft:horse", { x: start.x + 2, y: start.y, z: start.z });
      const rider = dimension.spawnEntity("feudal:city_guard", { x: start.x + 2, y: start.y, z: start.z });
      rider.addTag(`caravan_messenger:${caravanId}`);
      rider.nameTag = "\u0412\u0435\u0441\u0442\u043E\u0432\u043E\u0439 \u043A\u0430\u0440\u0430\u0432\u0430\u043D\u0430";
      horse.getComponent("minecraft:rideable");
      messengerId = rider.id;
      guardIds.push(rider.id);
    }
    const mission = {
      id: caravanId,
      sourceCityId,
      targetCityId,
      dimensionId: dimension.id,
      resourceValue,
      waypoints: path,
      currentWaypointIndex: 1,
      packMuleId: mule.id,
      guards: guardIds,
      messengerId,
      underAttack: false
    };
    this.activeCaravans.set(caravanId, mission);
  }
  static triggerAmbush(caravanId, _attackerLocation) {
    const caravan = this.activeCaravans.get(caravanId);
    if (!caravan || caravan.underAttack) return;
    caravan.underAttack = true;
    if (caravan.messengerId) {
      const messenger = world17.getEntity(caravan.messengerId);
      if (messenger && messenger.isValid()) {
        messenger.nameTag = "[SOS] \u0421\u043A\u0430\u0447\u0435\u0442 \u0437\u0430 \u043F\u043E\u0434\u043C\u043E\u0433\u043E\u0439!";
        messenger.triggerEvent("feudal:flee_to_home");
        world17.sendMessage("[\u0422\u0440\u0435\u0432\u043E\u0433\u0430!] \u041D\u0430 \u043A\u0430\u0440\u0430\u0432\u0430\u043D \u043D\u0430\u043F\u0430\u043B\u0438 \u0431\u0430\u043D\u0434\u0438\u0442\u044B! \u0412\u0435\u0441\u0442\u043E\u0432\u043E\u0439 \u043F\u043E\u0441\u043A\u0430\u043A\u0430\u043B \u0437\u0430 \u043F\u043E\u0434\u043A\u0440\u0435\u043F\u043B\u0435\u043D\u0438\u0435\u043C!");
      }
    }
    for (const guardId of caravan.guards) {
      const guard = world17.getEntity(guardId);
      if (guard && guard.isValid() && guard.id !== caravan.messengerId) {
        guard.triggerEvent("feudal:defend_cargo");
      }
    }
  }
  static tick() {
    for (const [id, caravan] of this.activeCaravans.entries()) {
      if (caravan.underAttack) continue;
      const mule = world17.getEntity(caravan.packMuleId);
      if (!mule || !mule.isValid()) {
        this.activeCaravans.delete(id);
        world17.sendMessage("[\u0420\u0430\u0437\u0433\u0440\u0430\u0431\u043B\u0435\u043D\u0438\u0435] \u041A\u0430\u0440\u0430\u0432\u0430\u043D \u0431\u044B\u043B \u0443\u043D\u0438\u0447\u0442\u043E\u0436\u0435\u043D \u0440\u0430\u0437\u0431\u043E\u0439\u043D\u0438\u043A\u0430\u043C\u0438!");
        continue;
      }
      const targetWP = caravan.waypoints[caravan.currentWaypointIndex];
      const distSq = Math.pow(mule.location.x - targetWP.x, 2) + Math.pow(mule.location.z - targetWP.z, 2);
      if (distSq < 9) {
        caravan.currentWaypointIndex++;
        if (caravan.currentWaypointIndex >= caravan.waypoints.length) {
          this.activeCaravans.delete(id);
          world17.sendMessage("[\u041B\u043E\u0433\u0438\u0441\u0442\u0438\u043A\u0430] \u041D\u0430\u043B\u043E\u0433\u043E\u0432\u044B\u0439 \u043E\u0431\u043E\u0437 \u0431\u043B\u0430\u0433\u043E\u043F\u043E\u043B\u0443\u0447\u043D\u043E \u043F\u0440\u0438\u0431\u044B\u043B \u0432 \u043F\u0443\u043D\u043A\u0442 \u043D\u0430\u0437\u043D\u0430\u0447\u0435\u043D\u0438\u044F.");
          mule.triggerEvent("feudal:despawn_delivered");
        }
      }
    }
  }
};
LogisticsCaravanManager.activeCaravans = /* @__PURE__ */ new Map();

// behavior_pack/scripts/CityLightingEngine.ts
import { world as world18, BlockPermutation as BlockPermutation4 } from "@minecraft/server";
var CityLightingEngine = class {
  /**
   * Scans and illuminates the entire city territory, scaling dynamically
   * from 48 blocks up to 768 blocks for capitals and metropolises.
   */
  static inspectAndLightCity(settlement) {
    const dim = world18.getDimension(settlement.dimensionId);
    if (!dim) return;
    const fullRadius = BorderManager.getCityRadius(settlement.tier);
    const center = settlement.throneLocation;
    let currentSector = this.sectorIndexMap.get(settlement.factionId) ?? 0;
    this.sectorIndexMap.set(settlement.factionId, (currentSector + 1) % 16);
    const sectorAngleStart = currentSector / 16 * Math.PI * 2;
    const sectorAngleEnd = (currentSector + 1) / 16 * Math.PI * 2;
    let torchesPlacedThisCycle = 0;
    const maxTorchesPerCycle = 5;
    for (let attempts = 0; attempts < 25; attempts++) {
      if (torchesPlacedThisCycle >= maxTorchesPerCycle) break;
      const angle = sectorAngleStart + Math.random() * (sectorAngleEnd - sectorAngleStart);
      const dist = 10 + Math.random() * (fullRadius - 10);
      const targetX = Math.floor(center.x + Math.cos(angle) * dist);
      const targetZ = Math.floor(center.z + Math.sin(angle) * dist);
      for (let dy = 8; dy >= -8; dy--) {
        const checkPos = { x: targetX, y: center.y + dy, z: targetZ };
        const groundBlock = dim.getBlock(checkPos);
        const airBlock = dim.getBlock({ x: targetX, y: center.y + dy + 1, z: targetZ });
        if (groundBlock && !groundBlock.isAir && airBlock && airBlock.isAir) {
          const isTorchNear = this.isTorchNearby(dim, checkPos, 8);
          if (!isTorchNear) {
            try {
              const torchType = dist < 80 ? "minecraft:lantern" : "minecraft:torch";
              airBlock.setPermutation(BlockPermutation4.resolve(torchType));
              torchesPlacedThisCycle++;
              dim.spawnParticle("minecraft:basic_flame_particle", {
                x: targetX + 0.5,
                y: center.y + dy + 1.2,
                z: targetZ + 0.5
              });
              break;
            } catch {
            }
          }
        }
      }
    }
  }
  static isTorchNearby(dim, pos, checkRadius) {
    for (let rx = -checkRadius; rx <= checkRadius; rx += 3) {
      for (let rz = -checkRadius; rz <= checkRadius; rz += 3) {
        for (let ry = -1; ry <= 2; ry++) {
          const b = dim.getBlock({ x: pos.x + rx, y: pos.y + ry, z: pos.z + rz });
          if (b && (b.typeId === "minecraft:torch" || b.typeId === "minecraft:lantern")) {
            return true;
          }
        }
      }
    }
    return false;
  }
  static tick(activeSettlements2) {
    this.lastCheckTick++;
    if (this.lastCheckTick % 60 !== 0) return;
    for (const settlement of activeSettlements2.values()) {
      this.inspectAndLightCity(settlement);
    }
  }
};
CityLightingEngine.lastCheckTick = 0;
CityLightingEngine.sectorIndexMap = /* @__PURE__ */ new Map();

// behavior_pack/scripts/NavalEngine.ts
import { world as world19 } from "@minecraft/server";
var NavalEngine = class {
  /**
   * Dispatches a sea trade voyage across ocean or river routes.
   */
  static dispatchSeaVoyage(sourceCity, targetCity, seaPath, cargoValue) {
    if (seaPath.length < 2) return "";
    const voyageId = `naval_${Date.now()}_${Math.floor(Math.random() * 1e3)}`;
    const start = seaPath[0];
    const dim = world19.getDimension(sourceCity.dimensionId);
    let shipId = void 0;
    try {
      const boat = dim.spawnEntity("minecraft:chest_boat", { x: start.x, y: start.y, z: start.z });
      boat.nameTag = `\u0422\u043E\u0440\u0433\u043E\u0432\u044B\u0439 \u043A\u043E\u0433\u0433 [${cargoValue} \u0433\u0440\u0443\u0437\u0430]`;
      boat.addTag(`naval_cargo:${voyageId}`);
      shipId = boat.id;
    } catch {
    }
    const voyage = {
      id: voyageId,
      sourceCityId: sourceCity.factionId,
      targetCityId: targetCity.factionId,
      dimensionId: sourceCity.dimensionId,
      cargoValue,
      waypoints: seaPath,
      currentWaypointIndex: 1,
      shipEntityId: shipId,
      pirateAmbush: false
    };
    this.activeVoyages.set(voyageId, voyage);
    world19.sendMessage(`[\u041C\u043E\u0440\u0441\u043A\u043E\u0439 \u0442\u0440\u0430\u043A\u0442] \u0422\u043E\u0440\u0433\u043E\u0432\u044B\u0439 \u043A\u043E\u0433\u0433 \u043E\u0442\u043F\u043B\u044B\u043B \u0438\u0437 ${sourceCity.factionId} \u0432 ${targetCity.factionId}!`);
    return voyageId;
  }
  static tick() {
    for (const [id, voyage] of this.activeVoyages.entries()) {
      if (voyage.pirateAmbush) continue;
      if (!voyage.shipEntityId) {
        voyage.currentWaypointIndex++;
        if (voyage.currentWaypointIndex >= voyage.waypoints.length) {
          this.activeVoyages.delete(id);
          world19.sendMessage(`[\u041C\u043E\u0440\u0441\u043A\u0430\u044F \u0433\u0430\u0432\u0430\u043D\u044C] \u041A\u043E\u0440\u0430\u0431\u043B\u044C \u0438\u0437 ${voyage.sourceCityId} \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u043F\u0440\u0438\u0448\u0432\u0430\u0440\u0442\u043E\u0432\u0430\u043B\u0441\u044F \u0432 \u043F\u043E\u0440\u0442\u0443 ${voyage.targetCityId}!`);
        }
        continue;
      }
      const ship = world19.getEntity(voyage.shipEntityId);
      if (!ship || !ship.isValid()) {
        this.activeVoyages.delete(id);
        world19.sendMessage("[\u041C\u043E\u0440\u0441\u043A\u043E\u0439 \u0431\u043E\u0439] \u0422\u043E\u0440\u0433\u043E\u0432\u043E\u0435 \u0441\u0443\u0434\u043D\u043E \u0431\u044B\u043B\u043E \u043F\u043E\u0442\u043E\u043F\u043B\u0435\u043D\u043E \u043C\u043E\u0440\u0441\u043A\u0438\u043C\u0438 \u043F\u0438\u0440\u0430\u0442\u0430\u043C\u0438!");
        continue;
      }
      const targetWP = voyage.waypoints[voyage.currentWaypointIndex];
      const distSq = Math.pow(ship.location.x - targetWP.x, 2) + Math.pow(ship.location.z - targetWP.z, 2);
      if (distSq < 16) {
        voyage.currentWaypointIndex++;
        if (voyage.currentWaypointIndex >= voyage.waypoints.length) {
          this.activeVoyages.delete(id);
          world19.sendMessage(`[\u041C\u043E\u0440\u0441\u043A\u0430\u044F \u0442\u043E\u0440\u0433\u043E\u0432\u043B\u044F] \u041A\u0443\u043F\u0435\u0447\u0435\u0441\u043A\u043E\u0435 \u0441\u0443\u0434\u043D\u043E \u0434\u043E\u0441\u0442\u0430\u0432\u0438\u043B\u043E \u0433\u0440\u0443\u0437 \u043D\u0430 ${voyage.cargoValue} \u0438\u0437\u0443\u043C\u0440\u0443\u0434\u043E\u0432!`);
          try {
            ship.triggerEvent("minecraft:despawn");
          } catch {
          }
        }
      }
    }
  }
};
NavalEngine.activeVoyages = /* @__PURE__ */ new Map();

// behavior_pack/scripts/main.ts
VirtualWorldEngine.initializeDefaultRealms();
AllianceSystem.initializeAlliances();
var activeSettlements = VirtualWorldEngine.getAllSettlements();
var defaultTown = activeSettlements.get("fact_kingdom_1");
if (defaultTown) {
  VirtualWorldEngine.ensureTickingArea(defaultTown);
  BorderManager.updateBordersForSettlement(defaultTown);
}
system3.runInterval(() => {
  LogisticsCaravanManager.tick();
}, 20);
system3.runInterval(() => {
  BuildingEngine.tick();
}, 5);
system3.runInterval(() => {
  CityLightingEngine.tick(activeSettlements);
}, 60);
system3.runInterval(() => {
  VirtualWorldEngine.tickVirtualWorld();
}, 40);
system3.runInterval(() => {
  ColonizationEngine.tick();
}, 40);
system3.runInterval(() => {
  NavalEngine.tick();
}, 40);
system3.runInterval(() => {
  for (const player of world20.getPlayers()) {
    VirtualWorldEngine.checkPlayerProximityAndMaterialize(player.location, player.dimension.id);
  }
}, 40);
system3.runInterval(() => {
  for (const player of world20.getPlayers()) {
    PlayerRPGProfile.applyHealthAndPassives(player);
  }
}, 200);
world20.afterEvents.itemUse.subscribe((event) => {
  const item = event.itemStack;
  const player = event.source;
  if (item.typeId === "feudal:realm_map") {
    system3.run(() => {
      WorldMapUI.openRealmMap(player);
    });
  } else if (item.typeId === "feudal:commander_banner") {
    system3.run(() => {
      const town = activeSettlements.get("fact_kingdom_1");
      SquadTacticsEngine.openTacticsMenu(player, town);
    });
  } else if (item.typeId === "feudal:war_horn") {
    world20.sendMessage("\xA7c\xA7l[\u0411\u041E\u0415\u0412\u041E\u0419 \u0420\u041E\u0413] \u041F\u0440\u043E\u0437\u0432\u0443\u0447\u0430\u043B \u043F\u0440\u043E\u0442\u044F\u0436\u043D\u044B\u0439 \u0431\u043E\u0435\u0432\u043E\u0439 \u0441\u0438\u0433\u043D\u0430\u043B \u0442\u0440\u0435\u0432\u043E\u0433\u0438! \u0412\u043E\u0438\u043D\u044B, \u043A \u043E\u0440\u0443\u0436\u0438\u044E!\xA7r");
    try {
      player.dimension.spawnParticle("minecraft:sonic_explosion", {
        x: player.location.x,
        y: player.location.y + 1.5,
        z: player.location.z
      });
    } catch {
    }
    system3.run(() => {
      const town = activeSettlements.get("fact_kingdom_1");
      SquadTacticsEngine.openTacticsMenu(player, town);
    });
  }
});
function openAdvisor(player, target) {
  const settlement = activeSettlements.get("fact_kingdom_1") ?? {
    factionId: "fact_kingdom_1",
    tier: 2 /* Village */,
    throneLocation: target.location,
    dimensionId: target.dimension.id,
    treasury: { wood: 500, stone: 300, iron: 80, emeralds: 90, food: 450 },
    population: 180,
    militaryCount: 45,
    taxRatePercent: 10
  };
  AdvisorUI.openMainMenu(player, settlement);
}
var beforeEvents = world20.beforeEvents;
if (beforeEvents.playerInteractWithEntity) {
  beforeEvents.playerInteractWithEntity.subscribe((event) => {
    const target = event.target;
    if (target?.typeId === "feudal:advisor") {
      event.cancel = true;
      system3.run(() => {
        openAdvisor(event.player, target);
      });
    } else if (target?.typeId === "feudal:cartographer") {
      event.cancel = true;
      system3.run(() => {
        WorldMapUI.openRealmMap(event.player);
      });
    } else if (target?.typeId === "feudal:merchant") {
      event.cancel = true;
      system3.run(() => {
        const town = activeSettlements.get("fact_kingdom_1");
        if (town) MarketplaceEngine.openMarketMenu(event.player, town);
      });
    }
  });
}
var afterEvents = world20.afterEvents;
if (afterEvents.playerInteractWithEntity) {
  afterEvents.playerInteractWithEntity.subscribe((event) => {
    const target = event.target;
    if (target?.typeId === "feudal:advisor") {
      system3.run(() => {
        openAdvisor(event.player, target);
      });
    } else if (target?.typeId === "feudal:cartographer") {
      system3.run(() => {
        WorldMapUI.openRealmMap(event.player);
      });
    } else if (target?.typeId === "feudal:merchant") {
      system3.run(() => {
        const town = activeSettlements.get("fact_kingdom_1");
        if (town) MarketplaceEngine.openMarketMenu(event.player, town);
      });
    }
  });
}
if (afterEvents.dataDrivenEntityTrigger) {
  afterEvents.dataDrivenEntityTrigger.subscribe((event) => {
    if (event.id === "feudal:open_advisor_ui" && event.entity?.typeId === "feudal:advisor") {
      const players = world20.getPlayers();
      if (players.length > 0) {
        openAdvisor(players[0], event.entity);
      }
    }
  });
}
world20.afterEvents.entityHurt.subscribe((event) => {
  const hurtEntity = event.hurtEntity;
  const damageSource = event.damageSource;
  const damagingEntity = damageSource?.damagingEntity;
  if (damagingEntity?.typeId === "feudal:bandit_leader" || damagingEntity?.typeId === "minecraft:pillager") {
    for (const tag of hurtEntity.getTags()) {
      if (tag.startsWith("caravan_cargo:") || tag.startsWith("caravan_escort:")) {
        const caravanId = tag.split(":")[1];
        LogisticsCaravanManager.triggerAmbush(caravanId, damagingEntity.location);
        break;
      }
    }
  }
});
world20.afterEvents.entityDie.subscribe((event) => {
  PlayerRPGProfile.handleEntityKill(event);
});
var playerSpawnEvent = world20.afterEvents.playerSpawn;
if (playerSpawnEvent) {
  playerSpawnEvent.subscribe((event) => {
    if (event.player) {
      system3.runTimeout(() => {
        PlayerRPGProfile.applyHealthAndPassives(event.player);
      }, 20);
    }
  });
}
var blockPlaceEvent = world20.afterEvents.playerPlaceBlock;
if (blockPlaceEvent) {
  blockPlaceEvent.subscribe((event) => {
    const block = event.block;
    const player = event.player;
    if (block?.typeId === "feudal:throne") {
      const loc = block.location;
      const settlement = activeSettlements.get("fact_kingdom_1") ?? {
        factionId: "fact_kingdom_1",
        tier: 2 /* Village */,
        throneLocation: loc,
        dimensionId: player.dimension.id,
        treasury: { wood: 500, stone: 300, iron: 80, emeralds: 90, food: 450 },
        population: 180,
        militaryCount: 45,
        taxRatePercent: 10
      };
      settlement.throneLocation = loc;
      settlement.dimensionId = player.dimension.id;
      activeSettlements.set("fact_kingdom_1", settlement);
      VirtualWorldEngine.registerSettlement(settlement);
      VirtualWorldEngine.ensureTickingArea(settlement);
      BorderManager.updateBordersForSettlement(settlement);
      try {
        const advisor = player.dimension.spawnEntity("feudal:advisor", {
          x: loc.x,
          y: loc.y,
          z: loc.z + 2
        });
        advisor.nameTag = `\u0421\u043E\u0432\u0435\u0442\u043D\u0438\u043A \u043A\u043E\u0440\u043E\u043B\u0435\u0432\u0441\u0442\u0432\u0430 ${player.name}`;
      } catch {
      }
      world20.sendMessage(
        `\xA76\xA7l[\u041A\u041E\u0420\u041E\u041B\u0415\u0412\u0421\u0422\u0412\u041E \u041E\u0421\u041D\u041E\u0412\u0410\u041D\u041E]\xA7r \xA7e${player.name} \u0432\u043E\u0437\u0434\u0432\u0438\u0433 \u043F\u0440\u0435\u0441\u0442\u043E\u043B \u043D\u0430 \u043A\u043E\u043E\u0440\u0434\u0438\u043D\u0430\u0442\u0430\u0445 [${loc.x}, ${loc.y}, ${loc.z}]! \u041A\u043E\u0440\u043E\u043B\u0435\u0432\u0441\u043A\u0438\u0439 \u0421\u043E\u0432\u0435\u0442\u043D\u0438\u043A \u043F\u0440\u0438\u0431\u044B\u043B \u043A \u0432\u0430\u0448\u0435\u043C\u0443 \u0442\u0440\u043E\u043D\u0443. \u041F\u043E\u0433\u043E\u0432\u043E\u0440\u0438\u0442\u0435 \u0441 \u043D\u0438\u043C, \u0447\u0442\u043E\u0431\u044B \u0432\u043E\u0437\u0432\u0435\u0441\u0442\u0438 \u0437\u0430\u043C\u043E\u043A!\xA7r`
      );
    }
  });
}
console.warn("[Feudal Realms] \u0421\u043A\u0440\u0438\u043F\u0442\u043E\u0432\u043E\u0435 \u044F\u0434\u0440\u043E, \u043A\u043E\u043B\u043E\u043D\u0438\u0437\u0430\u0446\u0438\u044F, \u043C\u043E\u0440\u0441\u043A\u0438\u0435 \u0442\u0440\u0430\u043A\u0442\u044B, \u043E\u0441\u0430\u0434\u043D\u044B\u0435 \u043E\u0440\u0443\u0434\u0438\u044F, \u0430\u043B\u044C\u044F\u043D\u0441\u044B, \u0440\u0435\u0446\u0435\u043F\u0442\u044B \u0438 RPG-\u043F\u0440\u043E\u0444\u0438\u043B\u044C \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0437\u0430\u043F\u0443\u0449\u0435\u043D\u044B.");
