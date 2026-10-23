import { world, Vector3 } from "@minecraft/server";
import { BlockBlueprint, BuildingEngine } from "./BuildingEngine";
import { SettlementData, CityTier } from "./CityProgression";

export class MedievalWallEngine {
  /**
   * Generates a 3-block thick medieval curtain wall segment with crenellations,
   * walkable wooden parapet walkway, arrow slits, and lanterns.
   * length: length in blocks
   * isAxisX: direction along X or Z axis
   */
  public static getWallSegmentBlueprint(length: number, isAxisX = true): BlockBlueprint[] {
    const bp: BlockBlueprint[] = [];
    const wallHeight = 5;

    for (let step = 0; step < length; step++) {
      for (let w = -1; w <= 1; w++) {
        const rx = isAxisX ? step : w;
        const rz = isAxisX ? w : step;

        // 1. Foundation underground
        bp.push({ relX: rx, relY: -1, relZ: rz, blockType: "minecraft:cobblestone" });

        // 2. Solid wall body (3 blocks thick)
        for (let y = 0; y < wallHeight; y++) {
          let block = "minecraft:stone_bricks";
          if ((step + y + w) % 7 === 0) block = "minecraft:mossy_stone_bricks";
          if ((step * y) % 11 === 0) block = "minecraft:cracked_stone_bricks";

          // Inner walkway surface at top level (w === -1 is city interior side)
          if (y === wallHeight - 1 && w === -1) {
            block = "minecraft:spruce_planks"; // Patrol walkway planking
          }

          bp.push({ relX: rx, relY: y, relZ: rz, blockType: block });
        }

        // 3. Outer Parapet with Crenellations (w === 1 is outer enemy-facing side)
        if (w === 1) {
          // Alternating Merlons (зубцы) and Embrasure gaps (бойницы)
          if (step % 2 === 0) {
            bp.push({ relX: rx, relY: wallHeight, relZ: rz, blockType: "minecraft:stone_bricks" });
            bp.push({ relX: rx, relY: wallHeight + 1, relZ: rz, blockType: "minecraft:stone_brick_slab" });
          } else {
            bp.push({ relX: rx, relY: wallHeight, relZ: rz, blockType: "minecraft:cobblestone_wall" });
          }
        }

        // 4. Inner Railing (city side)
        if (w === -1) {
          bp.push({ relX: rx, relY: wallHeight, relZ: rz, blockType: "minecraft:spruce_fence" });

          // Torches / Lanterns along inner walkway every 5 blocks
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
  public static getBastionTowerBlueprint(): BlockBlueprint[] {
    const bp: BlockBlueprint[] = [];
    const r = 3; // 7x7 footprint
    const h = 7; // Height above ground

    for (let x = -r; x <= r; x++) {
      for (let z = -r; z <= r; z++) {
        // Foundation
        bp.push({ relX: x, relY: -1, relZ: z, blockType: "minecraft:cobblestone" });

        // Hollow interior tower
        for (let y = 0; y <= h; y++) {
          const isEdge = x === -r || x === r || z === -r || z === r;
          if (isEdge) {
            // Arrow slits at mid height
            if ((y === 3 || y === 4) && (x === 0 || z === 0)) {
              bp.push({ relX: x, relY: y, relZ: z, blockType: "minecraft:iron_bars" });
            } else {
              const blk = (x + y + z) % 6 === 0 ? "minecraft:mossy_stone_bricks" : "minecraft:stone_bricks";
              bp.push({ relX: x, relY: y, relZ: z, blockType: blk });
            }
          } else if (y === h) {
            // Platform top deck
            bp.push({ relX: x, relY: y, relZ: z, blockType: "minecraft:stone_bricks" });
          }
        }

        // Tower Parapet Crenellations on roof
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

    // Corner lanterns on battlements
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
  public static getFortressGatehouseBlueprint(): BlockBlueprint[] {
    const bp: BlockBlueprint[] = [];
    const r = 4; // 9 blocks wide
    const h = 7;

    for (let x = -r; x <= r; x++) {
      for (let z = -2; z <= 2; z++) {
        bp.push({ relX: x, relY: -1, relZ: z, blockType: "minecraft:cobblestone" });

        for (let y = 0; y <= h; y++) {
          const isArchPassage = Math.abs(x) <= 1 && y <= 3;
          if (isArchPassage) {
            // Portcullis iron bars in the center
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

    // Upper guardwalk crenellations
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

    // Gatehouse lanterns and heraldry
    bp.push({ relX: -2, relY: 4, relZ: -3, blockType: "minecraft:lantern" });
    bp.push({ relX: 2, relY: 4, relZ: -3, blockType: "minecraft:lantern" });

    return bp;
  }

  /**
   * Constructs a fortified medieval defense perimeter around the city center,
   * complete with 4 corner bastions, wall sections, gatehouse, and mounted wall ballistas!
   */
  public static constructFortifiedCitadelPerimeter(settlement: SettlementData) {
    const dim = world.getDimension(settlement.dimensionId);
    if (!dim) return;

    const throne = settlement.throneLocation;
    const halfSize = 16; // 32x32 fortified inner ward

    // 1. Four Corner Bastion Towers
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

      // Mount an operational wall ballista on each corner tower platform
      try {
        const ballista = dim.spawnEntity("feudal:ballista", {
          x: c.x,
          y: throne.y + 8,
          z: c.z
        });
        ballista.nameTag = `Крепостная баллиста башни [${c.x}, ${c.z}]`;
      } catch {}
    }

    // 2. North Wall Segment
    const northBp = this.getWallSegmentBlueprint(halfSize * 2 - 6, true);
    BuildingEngine.startConstruction(
      settlement.dimensionId,
      { x: throne.x - halfSize + 3, y: throne.y, z: throne.z - halfSize },
      3,
      7,
      northBp
    );

    // 3. West Wall Segment
    const westBp = this.getWallSegmentBlueprint(halfSize * 2 - 6, false);
    BuildingEngine.startConstruction(
      settlement.dimensionId,
      { x: throne.x - halfSize, y: throne.y, z: throne.z - halfSize + 3 },
      3,
      7,
      westBp
    );

    // 4. East Wall Segment
    const eastBp = this.getWallSegmentBlueprint(halfSize * 2 - 6, false);
    BuildingEngine.startConstruction(
      settlement.dimensionId,
      { x: throne.x + halfSize, y: throne.y, z: throne.z - halfSize + 3 },
      3,
      7,
      eastBp
    );

    // 5. South Fortified Gatehouse (Main City Entrance)
    const gateBp = this.getFortressGatehouseBlueprint();
    BuildingEngine.startConstruction(
      settlement.dimensionId,
      { x: throne.x, y: throne.y, z: throne.z + halfSize },
      5,
      9,
      gateBp
    );

    world.sendMessage(
      `§6§l[КРЕПОСТНЫЕ СТЕНЫ] Мастера возводят неприступные средневековые стены, бастионы и баллисты вокруг города ${settlement.factionId}!§r`
    );
  }
}
