import { world, Vector3 } from "@minecraft/server";
import { SettlementData } from "./CityProgression";

export interface SeaWaypoint {
  x: number;
  y: number;
  z: number;
}

export interface NavalVoyage {
  id: string;
  sourceCityId: string;
  targetCityId: string;
  dimensionId: string;
  cargoValue: number;
  waypoints: SeaWaypoint[];
  currentWaypointIndex: number;
  shipEntityId?: string;
  pirateAmbush: boolean;
}

export class NavalEngine {
  private static activeVoyages: Map<string, NavalVoyage> = new Map();

  /**
   * Dispatches a sea trade voyage across ocean or river routes.
   */
  public static dispatchSeaVoyage(
    sourceCity: SettlementData,
    targetCity: SettlementData,
    seaPath: SeaWaypoint[],
    cargoValue: number
  ): string {
    if (seaPath.length < 2) return "";

    const voyageId = `naval_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const start = seaPath[0];
    const dim = world.getDimension(sourceCity.dimensionId);

    // Spawn maritime convoy boat/ship entity
    let shipId: string | undefined = undefined;
    try {
      const boat = dim.spawnEntity("minecraft:chest_boat", { x: start.x, y: start.y, z: start.z });
      boat.nameTag = `Торговый когг [${cargoValue} груза]`;
      boat.addTag(`naval_cargo:${voyageId}`);
      shipId = boat.id;
    } catch {
      // Dimension might be virtualized
    }

    const voyage: NavalVoyage = {
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
    world.sendMessage(`[Морской тракт] Торговый когг отплыл из ${sourceCity.factionId} в ${targetCity.factionId}!`);
    return voyageId;
  }

  public static tick() {
    for (const [id, voyage] of this.activeVoyages.entries()) {
      if (voyage.pirateAmbush) continue;

      if (!voyage.shipEntityId) {
        // Virtual sea tick
        voyage.currentWaypointIndex++;
        if (voyage.currentWaypointIndex >= voyage.waypoints.length) {
          this.activeVoyages.delete(id);
          world.sendMessage(`[Морская гавань] Корабль из ${voyage.sourceCityId} успешно пришвартовался в порту ${voyage.targetCityId}!`);
        }
        continue;
      }

      const ship = world.getEntity(voyage.shipEntityId);
      if (!ship || !ship.isValid()) {
        this.activeVoyages.delete(id);
        world.sendMessage("[Морской бой] Торговое судно было потоплено морскими пиратами!");
        continue;
      }

      const targetWP = voyage.waypoints[voyage.currentWaypointIndex];
      const distSq = Math.pow(ship.location.x - targetWP.x, 2) + Math.pow(ship.location.z - targetWP.z, 2);

      if (distSq < 16) {
        voyage.currentWaypointIndex++;
        if (voyage.currentWaypointIndex >= voyage.waypoints.length) {
          this.activeVoyages.delete(id);
          world.sendMessage(`[Морская торговля] Купеческое судно доставило груз на ${voyage.cargoValue} изумрудов!`);
          try {
            ship.triggerEvent("minecraft:despawn");
          } catch {
            // cleanup
          }
        }
      }
    }
  }
}
