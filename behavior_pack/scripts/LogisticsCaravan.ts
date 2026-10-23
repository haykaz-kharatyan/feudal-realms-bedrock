import { world, Dimension, Vector3 } from "@minecraft/server";

export interface RoadWaypoint {
  x: number;
  y: number;
  z: number;
}

export interface CaravanMission {
  id: string;
  sourceCityId: string;
  targetCityId: string;
  dimensionId: string;
  resourceValue: number;
  waypoints: RoadWaypoint[];
  currentWaypointIndex: number;
  packMuleId: string;
  guards: string[];
  messengerId?: string;
  underAttack: boolean;
}

export class LogisticsCaravanManager {
  private static activeCaravans: Map<string, CaravanMission> = new Map();

  public static dispatchCaravan(
    sourceCityId: string,
    targetCityId: string,
    dimension: Dimension,
    path: RoadWaypoint[],
    resourceValue: number
  ) {
    if (path.length < 2) return;

    const start = path[0];
    const caravanId = `caravan_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const mule = dimension.spawnEntity("minecraft:mule", { x: start.x, y: start.y, z: start.z });
    mule.addTag(`caravan_cargo:${caravanId}`);
    mule.nameTag = `Обоз [${resourceValue} ресурсов]`;

    const guardIds: string[] = [];
    let messengerId: string | undefined = undefined;

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
      rider.nameTag = "Вестовой каравана";
      horse.getComponent("minecraft:rideable");
      messengerId = rider.id;
      guardIds.push(rider.id);
    }

    const mission: CaravanMission = {
      id: caravanId,
      sourceCityId,
      targetCityId,
      dimensionId: dimension.id,
      resourceValue,
      waypoints: path,
      currentWaypointIndex: 1,
      packMuleId: mule.id,
      guards: guardIds,
      messengerId: messengerId,
      underAttack: false
    };

    this.activeCaravans.set(caravanId, mission);
  }

  public static triggerAmbush(caravanId: string, _attackerLocation: Vector3) {
    const caravan = this.activeCaravans.get(caravanId);
    if (!caravan || caravan.underAttack) return;

    caravan.underAttack = true;

    if (caravan.messengerId) {
      const messenger = world.getEntity(caravan.messengerId);
      if (messenger && messenger.isValid()) {
        messenger.nameTag = "[SOS] Скачет за подмогой!";
        messenger.triggerEvent("feudal:flee_to_home");
        world.sendMessage("[Тревога!] На караван напали бандиты! Вестовой поскакал за подкреплением!");
      }
    }

    for (const guardId of caravan.guards) {
      const guard = world.getEntity(guardId);
      if (guard && guard.isValid() && guard.id !== caravan.messengerId) {
        guard.triggerEvent("feudal:defend_cargo");
      }
    }
  }

  public static tick() {
    for (const [id, caravan] of this.activeCaravans.entries()) {
      if (caravan.underAttack) continue;

      const mule = world.getEntity(caravan.packMuleId);

      if (!mule || !mule.isValid()) {
        this.activeCaravans.delete(id);
        world.sendMessage("[Разграбление] Караван был уничтожен разбойниками!");
        continue;
      }

      const targetWP = caravan.waypoints[caravan.currentWaypointIndex];
      const distSq = Math.pow(mule.location.x - targetWP.x, 2) + Math.pow(mule.location.z - targetWP.z, 2);

      if (distSq < 9) {
        caravan.currentWaypointIndex++;
        if (caravan.currentWaypointIndex >= caravan.waypoints.length) {
          this.activeCaravans.delete(id);
          world.sendMessage("[Логистика] Налоговый обоз благополучно прибыл в пункт назначения.");
          mule.triggerEvent("feudal:despawn_delivered");
        }
      }
    }
  }
}
