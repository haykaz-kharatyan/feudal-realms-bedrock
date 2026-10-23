import { Player, world } from "@minecraft/server";
import { SettlementData } from "./CityProgression";
import { FactionManager } from "./FactionManager";

export class HUDCompass {
  /**
   * Calculates the directional arrow based on player view rotation (yaw) and target position.
   */
  private static getDirectionArrow(player: Player, targetX: number, targetZ: number): string {
    const dx = targetX - player.location.x;
    const dz = targetZ - player.location.z;

    // Angle to target in radians, converted to degrees (-180..180)
    // In Minecraft, North is -Z, South is +Z, East is +X, West is -X
    const angleToTarget = (Math.atan2(-dx, dz) * 180) / Math.PI;

    // Player rotation yaw (-180..180)
    const playerYaw = player.getRotation().y;

    // Relative angle between where player is looking and target
    let diff = angleToTarget - playerYaw;
    while (diff < -180) diff += 360;
    while (diff > 180) diff -= 360;

    if (diff >= -22.5 && diff <= 22.5) return "⬆ Впереди";
    if (diff > 22.5 && diff <= 67.5) return "↗ Впереди-справа";
    if (diff > 67.5 && diff <= 112.5) return "➡ Справа";
    if (diff > 112.5 && diff <= 157.5) return "↘ Сзади-справа";
    if (diff > 157.5 || diff < -157.5) return "⬇ Сзади";
    if (diff >= -157.5 && diff < -112.5) return "↙ Сзади-слева";
    if (diff >= -112.5 && diff < -67.5) return "⬅ Слева";
    return "↖ Впереди-слева";
  }

  /**
   * Ticks the on-screen actionbar HUD compass for all players.
   */
  public static tick(activeSettlements: Map<string, SettlementData>) {
    if (activeSettlements.size === 0) return;

    for (const player of world.getPlayers()) {
      let nearestSettlement: SettlementData | null = null;
      let minDistance = Infinity;

      for (const s of activeSettlements.values()) {
        if (s.dimensionId !== player.dimension.id) continue;
        const dx = s.throneLocation.x - player.location.x;
        const dz = s.throneLocation.z - player.location.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < minDistance) {
          minDistance = dist;
          nearestSettlement = s;
        }
      }

      if (!nearestSettlement) continue;

      const distInt = Math.floor(minDistance);
      const faction = FactionManager.getFaction(nearestSettlement.factionId);
      const name = faction?.name ?? "Королевство";
      const tx = Math.floor(nearestSettlement.throneLocation.x);
      const tz = Math.floor(nearestSettlement.throneLocation.z);

      if (distInt <= 12) {
        player.onScreenDisplay.setActionBar(
          `§6🏰 [ВЛАДЕНИЯ: ${name.toUpperCase()}] §eВы у Трона! Нажмите на Советника, чтобы править замком§r`
        );
      } else {
        const arrow = this.getDirectionArrow(player, tx, tz);
        player.onScreenDisplay.setActionBar(
          `§6🧭 [КАРТА-КОМПАС] §e${name} §7[${tx}, ${tz}] §6| §a${distInt}м §e${arrow} §6| §bТрон найден§r`
        );
      }
    }
  }
}
