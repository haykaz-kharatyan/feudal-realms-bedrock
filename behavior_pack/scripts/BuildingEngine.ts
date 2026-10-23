import { world, Vector3, BlockPermutation, Dimension } from "@minecraft/server";

export interface BlockBlueprint {
  relX: number;
  relY: number;
  relZ: number;
  blockType: string;
}

export interface BuildingTask {
  id: string;
  dimensionId: string;
  origin: Vector3;
  clearRadius: number;
  clearHeight: number;
  blueprint: BlockBlueprint[];
  currentBlockIndex: number;
  isClearingDone: boolean;
}

export class BuildingEngine {
  private static activeTasks: Map<string, BuildingTask> = new Map();

  public static startConstruction(
    dimensionId: string,
    origin: Vector3,
    clearRadius: number,
    clearHeight: number,
    blueprint: BlockBlueprint[]
  ): string {
    const taskId = `build_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const task: BuildingTask = {
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

  private static processClearing(task: BuildingTask, dim: Dimension): boolean {
    const { origin, clearRadius, clearHeight } = task;
    // Cap clear radius for central zone to prevent watchdog timeout on massive 200x200 builds
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
          } catch {}
        }
      }
    }
    return true;
  }

  public static tick() {
    for (const [id, task] of this.activeTasks.entries()) {
      const dim = world.getDimension(task.dimensionId);

      if (!task.isClearingDone) {
        task.isClearingDone = this.processClearing(task, dim);
        continue;
      }

      // Dynamic speed scaling: from 20 blocks/tick up to 60 blocks/tick for colossal 200x200 citadels
      const blocksPerTick = Math.max(20, Math.min(60, Math.floor(task.blueprint.length / 150)));
      for (let i = 0; i < blocksPerTick; i++) {
        if (task.currentBlockIndex >= task.blueprint.length) {
          this.activeTasks.delete(id);
          world.sendMessage("[Строительство] Новое здание успешно возведено!");
          break;
        }

        const b = task.blueprint[task.currentBlockIndex];
        const targetPos: Vector3 = {
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

          // Anti-floating foundation: If this is a base or floor block, fill down to solid ground
          if (b.relY <= 0) {
            for (let down = 1; down <= 16; down++) {
              try {
                const under = dim.getBlock({ x: targetPos.x, y: targetPos.y - down, z: targetPos.z });
                if (!under) break;
                if (
                  under.isAir ||
                  under.isLiquid ||
                  under.typeId.includes("leaves") ||
                  under.typeId.includes("flower") ||
                  under.typeId.includes("grass") ||
                  under.typeId.includes("plant") ||
                  under.typeId.includes("vine")
                ) {
                  under.setPermutation(BlockPermutation.resolve("minecraft:cobblestone"));
                } else {
                  break; // Reached solid stone, dirt, bedrock
                }
              } catch {}
            }

            // Clear vegetation/trees above floor so buildings never have trees growing through them
            for (let up = 1; up <= 16; up++) {
              try {
                const above = dim.getBlock({ x: targetPos.x, y: targetPos.y + up, z: targetPos.z });
                if (
                  above &&
                  (above.typeId.includes("log") ||
                    above.typeId.includes("leaves") ||
                    above.typeId.includes("flower") ||
                    above.typeId.includes("grass") ||
                    above.typeId.includes("vine") ||
                    above.typeId.includes("snow"))
                ) {
                  above.setPermutation(BlockPermutation.resolve("minecraft:air"));
                }
              } catch {}
            }
          }
        }

        task.currentBlockIndex++;
      }
    }
  }

  public static getStoneTowerBlueprint(): BlockBlueprint[] {
    const blueprint: BlockBlueprint[] = [];
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
  public static getArchedBridgeBlueprint(length = 12, isAxisX = true): BlockBlueprint[] {
    const blueprint: BlockBlueprint[] = [];
    const width = 3;

    for (let step = 0; step < length; step++) {
      // Arched profile: slight elevation in the middle
      const archHeight = Math.floor(Math.sin((step / (length - 1)) * Math.PI) * 2);

      for (let w = -1; w <= 1; w++) {
        const rx = isAxisX ? step : w;
        const rz = isAxisX ? w : step;

        // Bridge deck road surface
        blueprint.push({
          relX: rx,
          relY: archHeight,
          relZ: rz,
          blockType: "minecraft:stone_bricks"
        });

        // Bridge foundation supports into water/riverbed
        for (let fy = archHeight - 1; fy >= -3; fy--) {
          blueprint.push({
            relX: rx,
            relY: fy,
            relZ: rz,
            blockType: "minecraft:cobblestone"
          });
        }

        // Railings and lanterns on outer edges
        if (w === -1 || w === 1) {
          blueprint.push({
            relX: rx,
            relY: archHeight + 1,
            relZ: rz,
            blockType: "minecraft:cobblestone_wall"
          });

          // Place lanterns every 4 blocks along railings
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
  public static getHarborDockBlueprint(): BlockBlueprint[] {
    const blueprint: BlockBlueprint[] = [];
    for (let x = 0; x < 8; x++) {
      for (let z = -2; z <= 2; z++) {
        blueprint.push({
          relX: x,
          relY: 0,
          relZ: z,
          blockType: "minecraft:spruce_planks"
        });
        // Pillars below
        blueprint.push({
          relX: x,
          relY: -1,
          relZ: z,
          blockType: "minecraft:spruce_log"
        });
      }
    }
    // Mooring bollards & lanterns
    blueprint.push({ relX: 7, relY: 1, relZ: -2, blockType: "minecraft:spruce_fence" });
    blueprint.push({ relX: 7, relY: 2, relZ: -2, blockType: "minecraft:lantern" });
    blueprint.push({ relX: 7, relY: 1, relZ: 2, blockType: "minecraft:spruce_fence" });
    blueprint.push({ relX: 7, relY: 2, relZ: 2, blockType: "minecraft:lantern" });
    return blueprint;
  }
}

