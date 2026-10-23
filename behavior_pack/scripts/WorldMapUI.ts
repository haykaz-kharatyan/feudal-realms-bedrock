import { Player } from "@minecraft/server";
import { ActionFormData, MessageFormData } from "@minecraft/server-ui";
import { VirtualWorldEngine } from "./VirtualWorldEngine";
import { FactionManager } from "./FactionManager";
import { BorderManager } from "./BorderManager";
import { CityTier } from "./CityProgression";
import { ColonizationEngine } from "./ColonizationEngine";

export class WorldMapUI {
  public static openRealmMap(player: Player) {
    const settlements = VirtualWorldEngine.getAllSettlements();
    const expeditions = ColonizationEngine.getActiveExpeditions();

    let overviewText = `§l§6=== КОРОЛЕВСКИЙ АТЛАС ЗЕМЕЛЬ ===§r\n`;
    overviewText += `§7Картографическая палата ведет непрерывный учет границ и владений.§r\n\n`;

    overviewText += `§e§lИЗВЕСТНЫЕ ГОРОДА И КОРОЛЕВСТВА:§r\n`;
    for (const s of settlements.values()) {
      const faction = FactionManager.getFaction(s.factionId);
      const border = BorderManager.updateBordersForSettlement(s);
      const banner = faction?.banner;

      const crestDesc = banner
        ? `${banner.baseColor} / ${banner.patternColor} (${banner.patternType}, ${banner.symbol})`
        : "Имперский штандарт";

      overviewText += `§b🏰 ${faction?.name ?? s.factionId}§r\n`;
      overviewText += `  • Титул: §f${faction?.title ?? "Вождь"} ${faction?.rulerName ?? ""}§r\n`;
      overviewText += `  • Эпоха: §a${CityTier[s.tier]}§r | Население: §f${s.population}§r (Армия: §c${s.militaryCount}§r)\n`;
      overviewText += `  • Координаты Трона: §7[${Math.floor(s.throneLocation.x)}, ${Math.floor(s.throneLocation.z)}]§r\n`;
      overviewText += `  • Граница города: §6${border.cityRadius} блоков§r (Площадь: §e${border.totalTerritoryAreaSqKm} кв.км§r)\n`;
      overviewText += `  • Гербовый щит: §d${crestDesc}§r\n`;
      if (faction?.vassalIds && faction.vassalIds.length > 0) {
        overviewText += `  • Вассалы и колонии: §2${faction.vassalIds.length} поселений§r\n`;
      }
      overviewText += `\n`;
    }

    if (expeditions.size > 0) {
      overviewText += `§e§lАКТИВНЫЕ КОЛОНИЗАЦИОННЫЕ ЭКСПЕДИЦИИ:§r\n`;
      for (const exp of expeditions.values()) {
        overviewText += `🚩 §f${exp.colonyName}§r (от ${exp.parentSettlementId}) -> [${exp.targetLocation.x}, ${exp.targetLocation.z}] (${exp.progressPercent}% пути)\n`;
      }
      overviewText += `\n`;
    }

    const form = new ActionFormData()
      .title("Атлас Королевств и Границ")
      .body(overviewText)
      .button("Подробный отчет Картографа")
      .button("Разместить межевые пограничные камни")
      .button("Закрыть");

    form.show(player).then((res) => {
      if (res.canceled) return;
      if (res.selection === 0) {
        this.showCartographerReport(player);
      } else if (res.selection === 1) {
        this.placeBoundaryMarkers(player);
      }
    });
  }

  private static showCartographerReport(player: Player) {
    const reportForm = new MessageFormData()
      .title("Записки Королевского Картографа")
      .body(
        `§l§6Летопись землемера:§r\n\n` +
        `1. Границы растут пропорционально эпохе: от 48 блоков в Лагере до 768 блоков в Столице.\n` +
        `2. Торговые тракты соединяют союзные города по суше, а морские когги связывают прибрежные колонии.\n` +
        `3. Через реки и броды инженеры возводят арочные каменные мосты с фонарями.\n` +
        `4. Для основания новой заморской колонии город должен достичь 4 эпохи (Город-крепость).`
      )
      .button1("Принять к сведению")
      .button2("Назад в Атлас");

    reportForm.show(player).then((res) => {
      if (!res.canceled && res.selection === 1) {
        this.openRealmMap(player);
      }
    });
  }

  private static placeBoundaryMarkers(player: Player) {
    const settlement = VirtualWorldEngine.getAllSettlements().get("fact_kingdom_1");
    if (!settlement) return;

    // Place boundary stones at 4 cardinal directions of the city border
    BorderManager.placeFrontierBoundaryStone(settlement, 0);
    BorderManager.placeFrontierBoundaryStone(settlement, Math.PI / 2);
    BorderManager.placeFrontierBoundaryStone(settlement, Math.PI);
    BorderManager.placeFrontierBoundaryStone(settlement, (3 * Math.PI) / 2);

    player.sendMessage("[Картограф] Пограничные межевые камни успешно установлены на внешних рубежах города!");
  }
}
