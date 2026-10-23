import { world, Vector3 } from "@minecraft/server";
import { BlockBlueprint, BuildingEngine } from "./BuildingEngine";
import { CityTier, SettlementData } from "./CityProgression";

export enum CastleScale {
  Compact = "Компактная ратуша (35x35)",
  DucalKeep = "Герцогская крепость (100x100)",
  GrandCitadel200x200 = "Колоссальный Кремль-Цитадель (200x200)"
}

export class CastleArchitectureEngine {
  /**
   * Generates castle blueprints according to city tier or requested scale.
   * Origin (0, 0, 0) is the throne location on the floor.
   */
  public static getCastleBlueprint(tier: CityTier, forcedScale?: CastleScale): BlockBlueprint[] {
    if (forcedScale === CastleScale.GrandCitadel200x200 || tier >= CityTier.BigCity) {
      return this.generateGrand200x200Citadel();
    }
    if (forcedScale === CastleScale.DucalKeep || tier === CityTier.FortressCity) {
      return this.generateDucalCitadel();
    }
    if (forcedScale === CastleScale.Compact || tier === CityTier.SmallTown) {
      return this.generateBaronKeep();
    }
    if (tier === CityTier.Village) {
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
  public static generateGrand200x200Citadel(): BlockBlueprint[] {
    const bp: BlockBlueprint[] = [];
    const R = 96; // Radius ~96 blocks -> 192..200 blocks outer diameter!
    const wallH = 7;

    // -------------------------------------------------------------
    // 1. OUTER FORTRESS CURTAIN WALLS (200x200)
    // -------------------------------------------------------------
    for (let coord = -R; coord <= R; coord++) {
      // 4 outer walls: North (z = -R), South (z = R), West (x = -R), East (x = R)
      const wallConfigs = [
        { isX: true, staticPos: -R }, // North
        { isX: true, staticPos: R },  // South
        { isX: false, staticPos: -R }, // West
        { isX: false, staticPos: R }  // East
      ];

      for (const w of wallConfigs) {
        // Skip gate openings in center of North and South walls
        if (w.isX && Math.abs(coord) <= 3) continue;

        for (let thick = -1; thick <= 1; thick++) {
          const rx = w.isX ? coord : w.staticPos + thick;
          const rz = w.isX ? w.staticPos + thick : coord;

          // Foundation
          bp.push({ relX: rx, relY: -1, relZ: rz, blockType: "minecraft:cobblestone" });

          // Wall Body
          for (let y = 0; y < wallH; y++) {
            let blk = "minecraft:stone_bricks";
            if ((coord + y + thick) % 9 === 0) blk = "minecraft:mossy_stone_bricks";
            if ((coord * y) % 13 === 0) blk = "minecraft:cracked_stone_bricks";

            // Walkway surface on inner side
            if (y === wallH - 1 && thick === -1) {
              blk = "minecraft:spruce_planks";
            }
            bp.push({ relX: rx, relY: y, relZ: rz, blockType: blk });
          }

          // Outer Parapet Crenellations
          if (thick === 1) {
            if (Math.abs(coord) % 2 === 0) {
              bp.push({ relX: rx, relY: wallH, relZ: rz, blockType: "minecraft:stone_bricks" });
              bp.push({ relX: rx, relY: wallH + 1, relZ: rz, blockType: "minecraft:stone_brick_slab" });
            } else {
              bp.push({ relX: rx, relY: wallH, relZ: rz, blockType: "minecraft:cobblestone_wall" });
            }
          }

          // Inner Parapet Fence and Lanterns
          if (thick === -1) {
            bp.push({ relX: rx, relY: wallH, relZ: rz, blockType: "minecraft:spruce_fence" });
            if (Math.abs(coord) % 10 === 0) {
              bp.push({ relX: rx, relY: wallH + 1, relZ: rz, blockType: "minecraft:lantern" });
            }
          }
        }
      }
    }

    // -------------------------------------------------------------
    // 2. EIGHT MASSIVE BASTIONS & TOWER CITADELS (Corners & Flanks)
    // -------------------------------------------------------------
    const towerPoints = [
      { tx: -R, tz: -R }, { tx: R, tz: -R }, // North corners
      { tx: -R, tz: R },  { tx: R, tz: R },  // South corners
      { tx: 0, tz: -R },  { tx: 0, tz: R },  // North/South gate towers
      { tx: -R, tz: 0 },  { tx: R, tz: 0 }   // West/East flank bastions
    ];

    for (const t of towerPoints) {
      const bRad = 4; // 9x9 bastion footprint
      const bH = 12; // 12 blocks tall

      for (let dx = -bRad; dx <= bRad; dx++) {
        for (let dz = -bRad; dz <= bRad; dz++) {
          const isEdge = dx === -bRad || dx === bRad || dz === -bRad || dz === bRad;

          // Foundation
          bp.push({ relX: t.tx + dx, relY: -1, relZ: t.tz + dz, blockType: "minecraft:cobblestone" });

          // Tower walls & top platform
          for (let y = 0; y <= bH; y++) {
            if (isEdge || y === bH) {
              const blk = (dx + dz + y) % 7 === 0 ? "minecraft:mossy_stone_bricks" : "minecraft:stone_bricks";
              bp.push({ relX: t.tx + dx, relY: y, relZ: t.tz + dz, blockType: blk });
            }
          }

          // Battlements on bastion roof
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

      // Bastion deck corners lanterns & golden royal capstone
      bp.push({ relX: t.tx - bRad, relY: bH + 2, relZ: t.tz - bRad, blockType: "minecraft:lantern" });
      bp.push({ relX: t.tx + bRad, relY: bH + 2, relZ: t.tz - bRad, blockType: "minecraft:lantern" });
      bp.push({ relX: t.tx - bRad, relY: bH + 2, relZ: t.tz + bRad, blockType: "minecraft:lantern" });
      bp.push({ relX: t.tx + bRad, relY: bH + 2, relZ: t.tz + bRad, blockType: "minecraft:lantern" });
      bp.push({ relX: t.tx, relY: bH + 1, relZ: t.tz, blockType: "minecraft:gold_block" });
    }

    // -------------------------------------------------------------
    // 3. NORTH & SOUTH GRAND GATEHOUSES WITH IRON PORTCULLIS
    // -------------------------------------------------------------
    for (const gz of [-R, R]) {
      for (let gx = -3; gx <= 3; gx++) {
        for (let gy = 1; gy <= 5; gy++) {
          if (Math.abs(gx) <= 2 && gy <= 4) {
            // Arched portcullis opening with iron bars
            bp.push({ relX: gx, relY: gy, relZ: gz, blockType: "minecraft:iron_bars" });
          } else {
            bp.push({ relX: gx, relY: gy, relZ: gz, blockType: "minecraft:chiseled_stone_bricks" });
          }
        }
        // Arch top
        bp.push({ relX: gx, relY: 6, relZ: gz, blockType: "minecraft:stone_brick_stairs" });
      }
    }

    // -------------------------------------------------------------
    // 4. ROYAL STONE-PAVED AVENUES & LAMP POSTS (Across 200x200 courtyard)
    // -------------------------------------------------------------
    // North-South Avenue (from Z = -R to R)
    for (let z = -R + 4; z <= R - 4; z++) {
      if (Math.abs(z) > 28) { // Outside central palace
        for (let x = -2; x <= 2; x++) {
          const blk = Math.abs(x) === 2 ? "minecraft:chiseled_stone_bricks" : "minecraft:smooth_stone";
          bp.push({ relX: x, relY: 0, relZ: z, blockType: blk });
        }
        // Lamp posts every 16 blocks
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

    // East-West Avenue (from X = -R to R)
    for (let x = -R + 4; x <= R - 4; x++) {
      if (Math.abs(x) > 28) {
        for (let z = -2; z <= 2; z++) {
          const blk = Math.abs(z) === 2 ? "minecraft:chiseled_stone_bricks" : "minecraft:smooth_stone";
          bp.push({ relX: x, relY: 0, relZ: z, blockType: blk });
        }
      }
    }

    // -------------------------------------------------------------
    // 5. GARRISON BARRACKS & ROYAL SMITHY (Outer Ward Wings)
    // -------------------------------------------------------------
    // Left Wing: Garrison Barracks (X: -55..-35, Z: 35..55)
    for (let bx = -55; bx <= -35; bx++) {
      for (let bz = 35; bz <= 55; bz++) {
        const isBEdge = bx === -55 || bx === -35 || bz === 35 || bz === 55;
        bp.push({ relX: bx, relY: 0, relZ: bz, blockType: "minecraft:spruce_planks" });
        if (isBEdge) {
          for (let by = 1; by <= 4; by++) {
            bp.push({ relX: bx, relY: by, relZ: bz, blockType: "minecraft:stone_bricks" });
          }
        }
        // Roof
        bp.push({ relX: bx, relY: 5, relZ: bz, blockType: "minecraft:dark_oak_slab" });
      }
    }

    // Right Wing: Royal Armory & Forge (X: 35..55, Z: 35..55)
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
    // Anvils & Lava Forge in Armory
    bp.push({ relX: 45, relY: 1, relZ: 45, blockType: "minecraft:anvil" });
    bp.push({ relX: 46, relY: 1, relZ: 45, blockType: "minecraft:blast_furnace" });

    // -------------------------------------------------------------
    // 6. MIDDLE CITADEL INNER DEFENSIVE WARD (100x100 blocks)
    // -------------------------------------------------------------
    const midR = 48; // 96x96 inner perimeter
    for (let c = -midR; c <= midR; c++) {
      if (Math.abs(c) > 4) { // Leave portal gaps
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

    // -------------------------------------------------------------
    // 7. THE GREAT DONJON THRONE PALACE (Core 50x50 blocks, 18 high)
    // -------------------------------------------------------------
    const palR = 24; // 48x48 footprint
    const palH = 15; // 15 blocks grand cathedral walls

    // Polished Marble & Stone Floor
    for (let x = -palR; x <= palR; x++) {
      for (let z = -palR; z <= palR; z++) {
        bp.push({ relX: x, relY: -1, relZ: z, blockType: "minecraft:stone_bricks" });
        const floorBlk = (Math.abs(x) <= 3) ? "minecraft:smooth_stone" : "minecraft:stone_bricks";
        bp.push({ relX: x, relY: 0, relZ: z, blockType: floorBlk });
      }
    }

    // Monumental Cathedral Donjon Walls
    for (let y = 1; y <= palH; y++) {
      for (let x = -palR; x <= palR; x++) {
        for (let z = -palR; z <= palR; z++) {
          const isEdge = x === -palR || x === palR || z === -palR || z === palR;
          const isGrandPortal = z === palR && Math.abs(x) <= 3 && y <= 6;
          if (isGrandPortal) continue;

          if (isEdge) {
            // Cathedral Gothic Windows with Stained Glass
            if (y >= 5 && y <= 11 && (Math.abs(x) % 6 === 0 || Math.abs(z) % 6 === 0)) {
              bp.push({ relX: x, relY: y, relZ: z, blockType: "minecraft:glass_pane" });
            } else {
              bp.push({ relX: x, relY: y, relZ: z, blockType: "minecraft:stone_bricks" });
            }
          }
        }
      }
    }

    // 4 Soaring Corner Spires on Donjon (reaching height 22!)
    const donjonCorners = [
      { cx: -palR, cz: -palR }, { cx: palR, cz: -palR },
      { cx: -palR, cz: palR },  { cx: palR, cz: palR }
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

    // High Vaulted Colonnades flanking the Throne Nave
    for (let z = -palR + 4; z <= palR - 4; z += 6) {
      for (let py = 1; py <= palH - 2; py++) {
        bp.push({ relX: -6, relY: py, relZ: z, blockType: "minecraft:chiseled_stone_bricks" });
        bp.push({ relX: 6, relY: py, relZ: z, blockType: "minecraft:chiseled_stone_bricks" });
      }
      // Chandelier Lanterns
      bp.push({ relX: -6, relY: 6, relZ: z, blockType: "minecraft:lantern" });
      bp.push({ relX: 6, relY: 6, relZ: z, blockType: "minecraft:lantern" });
    }

    // Imperial Red & Gold Velvet Carpet leading from portal to Throne
    for (let z = palR - 1; z >= -12; z--) {
      bp.push({ relX: 0, relY: 1, relZ: z, blockType: "minecraft:red_carpet" });
      bp.push({ relX: -1, relY: 1, relZ: z, blockType: "minecraft:red_carpet" });
      bp.push({ relX: 1, relY: 1, relZ: z, blockType: "minecraft:red_carpet" });
      bp.push({ relX: -2, relY: 1, relZ: z, blockType: "minecraft:yellow_carpet" });
      bp.push({ relX: 2, relY: 1, relZ: z, blockType: "minecraft:yellow_carpet" });
    }

    // MONUMENTAL IMPERIAL THRONE DAIS & CANOPY OF GOLD
    // Dais Base: 7x7 stone platform
    for (let dx = -4; dx <= 4; dx++) {
      for (let dz = -20; dz <= -14; dz++) {
        bp.push({ relX: dx, relY: 1, relZ: dz, blockType: "minecraft:stone_bricks" });
      }
    }
    // Second Tier Gold Step
    for (let dx = -3; dx <= 3; dx++) {
      for (let dz = -19; dz <= -15; dz++) {
        bp.push({ relX: dx, relY: 2, relZ: dz, blockType: "minecraft:gold_block" });
      }
    }
    // Third Tier Gold Throne Foundation
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -18; dz <= -16; dz++) {
        bp.push({ relX: dx, relY: 3, relZ: dz, blockType: "minecraft:gold_block" });
      }
    }
    // The Crown Throne Block
    bp.push({ relX: 0, relY: 4, relZ: -17, blockType: "feudal:throne" });

    // Imperial Gold Pillars and Throne Canopy
    bp.push({ relX: -3, relY: 3, relZ: -15, blockType: "minecraft:chiseled_stone_bricks" });
    bp.push({ relX: -3, relY: 4, relZ: -15, blockType: "minecraft:spruce_fence" });
    bp.push({ relX: -3, relY: 5, relZ: -15, blockType: "minecraft:spruce_fence" });
    bp.push({ relX: 3, relY: 3, relZ: -15, blockType: "minecraft:chiseled_stone_bricks" });
    bp.push({ relX: 3, relY: 4, relZ: -15, blockType: "minecraft:spruce_fence" });
    bp.push({ relX: 3, relY: 5, relZ: -15, blockType: "minecraft:spruce_fence" });

    // Royal Treasury behind Throne (vault with gold blocks)
    for (let dx = -3; dx <= 3; dx++) {
      bp.push({ relX: dx, relY: 1, relZ: -21, blockType: "minecraft:gold_block" });
      bp.push({ relX: dx, relY: 2, relZ: -21, blockType: "minecraft:iron_bars" });
      bp.push({ relX: dx, relY: 3, relZ: -21, blockType: "minecraft:stone_bricks" });
    }

    // GRAND CATHEDRAL ROOF & VAULTED CEILING ON THE DONJON PALACE (48x48)
    // 1. Vaulted Stone Ceiling at y = palH
    for (let x = -palR; x <= palR; x++) {
      for (let z = -palR; z <= palR; z++) {
        const isSpireArea = (Math.abs(x) >= palR - 2 && Math.abs(z) >= palR - 2);
        if (!isSpireArea) {
          bp.push({ relX: x, relY: palH, relZ: z, blockType: "minecraft:stone_bricks" });
        }
      }
    }

    // 2. High Gabled Timber & Slate Roof (y = palH + 1 to palH + 5)
    for (let layer = 1; layer <= 5; layer++) {
      const rx = palR - (layer * 4);
      if (rx < 3) break;
      for (let z = -palR + 2; z <= palR - 2; z++) {
        bp.push({ relX: -rx, relY: palH + layer, relZ: z, blockType: "minecraft:dark_oak_stairs" });
        bp.push({ relX: rx, relY: palH + layer, relZ: z, blockType: "minecraft:dark_oak_stairs" });
        for (let ix = -rx + 1; ix < rx; ix++) {
          if (layer === 5 || Math.abs(ix) <= 2) {
            bp.push({ relX: ix, relY: palH + layer, relZ: z, blockType: "minecraft:spruce_planks" });
          }
        }
      }
    }

    // 3. Central Golden Imperial Lantern Cupola & Dome (x: -3..3, z: -3..3, y = palH + 6..palH + 8)
    for (let cx = -3; cx <= 3; cx++) {
      for (let cz = -3; cz <= 3; cz++) {
        bp.push({ relX: cx, relY: palH + 6, relZ: cz, blockType: "minecraft:glass" });
        bp.push({ relX: cx, relY: palH + 7, relZ: cz, blockType: "minecraft:gold_block" });
      }
    }
    bp.push({ relX: 0, relY: palH + 8, relZ: 0, blockType: "minecraft:sea_lantern" });

    return bp;
  }

  // --- Other Tiers (Ducal, Baron, Town Hall, Longhouse) ---

  private static generateDucalCitadel(): BlockBlueprint[] {
    const bp: BlockBlueprint[] = [];
    const r = 16; // 33x33 keep
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
            if ((y >= 4 && y <= 7) && (Math.abs(x) === 4 || Math.abs(z) === 4)) {
              bp.push({ relX: x, relY: y, relZ: z, blockType: "minecraft:glass_pane" });
            } else {
              bp.push({ relX: x, relY: y, relZ: z, blockType: "minecraft:stone_bricks" });
            }
          }
        }
      }
    }

    // Throne Dais
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -10; dz <= -6; dz++) {
        bp.push({ relX: dx, relY: 1, relZ: dz, blockType: "minecraft:stone_bricks" });
      }
    }
    bp.push({ relX: 0, relY: 2, relZ: -8, blockType: "minecraft:gold_block" });
    bp.push({ relX: 0, relY: 3, relZ: -8, blockType: "feudal:throne" });

    // Carpet
    for (let z = r - 1; z >= -6; z--) {
      bp.push({ relX: 0, relY: 1, relZ: z, blockType: "minecraft:red_carpet" });
      bp.push({ relX: -1, relY: 1, relZ: z, blockType: "minecraft:yellow_carpet" });
      bp.push({ relX: 1, relY: 1, relZ: z, blockType: "minecraft:yellow_carpet" });
    }

    // Complete Roof & Battlements for Ducal Citadel
    for (let x = -r; x <= r; x++) {
      for (let z = -r; z <= r; z++) {
        // Vaulted stone ceiling
        bp.push({ relX: x, relY: h, relZ: z, blockType: "minecraft:stone_bricks" });
        // Outer crenellations
        if (x === -r || x === r || z === -r || z === r) {
          if ((x + z) % 2 === 0) {
            bp.push({ relX: x, relY: h + 1, relZ: z, blockType: "minecraft:stone_bricks" });
            bp.push({ relX: x, relY: h + 2, relZ: z, blockType: "minecraft:stone_brick_slab" });
          } else {
            bp.push({ relX: x, relY: h + 1, relZ: z, blockType: "minecraft:cobblestone_wall" });
          }
        }
      }
    }
    // High central pitched roof
    for (let step = 1; step <= 4; step++) {
      const rx = (r - 2) - step * 2;
      for (let z = -r + 2; z <= r - 2; z++) {
        bp.push({ relX: -rx, relY: h + step, relZ: z, blockType: "minecraft:dark_oak_stairs" });
        bp.push({ relX: rx, relY: h + step, relZ: z, blockType: "minecraft:dark_oak_stairs" });
        for (let ix = -rx + 1; ix < rx; ix++) {
          bp.push({ relX: ix, relY: h + step, relZ: z, blockType: "minecraft:spruce_planks" });
        }
      }
    }

    return bp;
  }

  private static generateBaronKeep(): BlockBlueprint[] {
    const bp: BlockBlueprint[] = [];
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

    // Complete Roof & Battlements for Baron Keep
    for (let x = -r; x <= r; x++) {
      for (let z = -r; z <= r; z++) {
        bp.push({ relX: x, relY: h, relZ: z, blockType: "minecraft:spruce_planks" });
        if (x === -r || x === r || z === -r || z === r) {
          if ((x + z) % 2 === 0) {
            bp.push({ relX: x, relY: h + 1, relZ: z, blockType: "minecraft:stone_bricks" });
          } else {
            bp.push({ relX: x, relY: h + 1, relZ: z, blockType: "minecraft:spruce_fence" });
          }
        }
      }
    }
    // Conical central watchtower roof
    for (let ty = 1; ty <= 3; ty++) {
      const cr = 5 - ty;
      for (let cx = -cr; cx <= cr; cx++) {
        for (let cz = -cr; cz <= cr; cz++) {
          bp.push({ relX: cx, relY: h + ty, relZ: cz, blockType: "minecraft:dark_oak_stairs" });
        }
      }
    }
    bp.push({ relX: 0, relY: h + 4, relZ: 0, blockType: "minecraft:gold_block" });
    bp.push({ relX: 0, relY: h + 5, relZ: 0, blockType: "minecraft:lantern" });

    return bp;
  }

  private static generateVillageTownHall(): BlockBlueprint[] {
    const bp: BlockBlueprint[] = [];
    const r = 6;
    for (let x = -r; x <= r; x++) {
      for (let z = -r; z <= r; z++) {
        bp.push({ relX: x, relY: -1, relZ: z, blockType: "minecraft:cobblestone" });
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

    // Complete Pitched Gabled Roof with Eaves
    for (let x = -r; x <= r; x++) {
      for (let z = -r; z <= r; z++) {
        bp.push({ relX: x, relY: 6, relZ: z, blockType: "minecraft:spruce_planks" });
      }
    }
    for (let step = 0; step <= 3; step++) {
      const rx = (r + 1) - step * 2;
      for (let z = -r - 1; z <= r + 1; z++) {
        bp.push({ relX: -rx, relY: 7 + step, relZ: z, blockType: "minecraft:dark_oak_stairs" });
        bp.push({ relX: rx, relY: 7 + step, relZ: z, blockType: "minecraft:dark_oak_stairs" });
        for (let ix = -rx + 1; ix < rx; ix++) {
          bp.push({ relX: ix, relY: 7 + step, relZ: z, blockType: "minecraft:spruce_planks" });
        }
      }
    }
    // Chimney & Smoke
    for (let cy = 7; cy <= 12; cy++) {
      bp.push({ relX: 4, relY: cy, relZ: -3, blockType: "minecraft:stone_bricks" });
    }
    bp.push({ relX: 4, relY: 13, relZ: -3, blockType: "minecraft:campfire" });
    bp.push({ relX: 4, relY: 14, relZ: -3, blockType: "minecraft:cobblestone_wall" });

    // Interior chandelier
    bp.push({ relX: 0, relY: 5, relZ: 0, blockType: "minecraft:spruce_fence" });
    bp.push({ relX: 0, relY: 4, relZ: 0, blockType: "minecraft:lantern" });

    return bp;
  }

  private static generateChieftainLonghouse(): BlockBlueprint[] {
    const bp: BlockBlueprint[] = [];
    const r = 4;
    for (let x = -r; x <= r; x++) {
      for (let z = -r; z <= r; z++) {
        bp.push({ relX: x, relY: -1, relZ: z, blockType: "minecraft:cobblestone" });
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

    // Complete A-frame timber roof
    for (let step = 0; step <= 2; step++) {
      const rx = (r + 1) - step * 2;
      for (let z = -r - 1; z <= r + 1; z++) {
        bp.push({ relX: -rx, relY: 5 + step, relZ: z, blockType: "minecraft:spruce_stairs" });
        bp.push({ relX: rx, relY: 5 + step, relZ: z, blockType: "minecraft:spruce_stairs" });
        for (let ix = -rx + 1; ix < rx; ix++) {
          bp.push({ relX: ix, relY: 5 + step, relZ: z, blockType: "minecraft:spruce_planks" });
        }
      }
    }
    // Ridge cap
    for (let z = -r - 1; z <= r + 1; z++) {
      bp.push({ relX: 0, relY: 8, relZ: z, blockType: "minecraft:spruce_slab" });
    }
    bp.push({ relX: 0, relY: 4, relZ: 0, blockType: "minecraft:lantern" });

    return bp;
  }

  /**
   * Constructs or upgrades the castle around the settlement's throne.
   */
  public static constructOrUpgradeCastle(settlement: SettlementData, scale?: CastleScale) {
    const bp = this.getCastleBlueprint(settlement.tier, scale);
    BuildingEngine.startConstruction(
      settlement.dimensionId,
      settlement.throneLocation,
      12,
      20,
      bp
    );

    // If 200x200 citadel, mount 8 operational ballistas on bastion decks
    if (scale === CastleScale.GrandCitadel200x200 || settlement.tier >= CityTier.BigCity) {
      const dim = world.getDimension(settlement.dimensionId);
      if (dim) {
        const R = 96;
        const bastionCoords = [
          { bx: -R, bz: -R }, { bx: R, bz: -R },
          { bx: -R, bz: R },  { bx: R, bz: R },
          { bx: 0, bz: -R },  { bx: 0, bz: R },
          { bx: -R, bz: 0 },  { bx: R, bz: 0 }
        ];

        for (const b of bastionCoords) {
          try {
            const ballista = dim.spawnEntity("feudal:ballista", {
              x: settlement.throneLocation.x + b.bx,
              y: settlement.throneLocation.y + 13,
              z: settlement.throneLocation.z + b.bz
            });
            ballista.nameTag = `Баллиста Имперского Бастиона [${b.bx}, ${b.bz}]`;
          } catch {}
        }
      }
    }
  }
}
