import { world, system } from "@minecraft/server";
import { VirtualWorldEngine } from "./VirtualWorldEngine";
import { SettlementData } from "./CityProgression";

export enum WorldEventType {
  None = "Спокойное время",
  BlackPlague = "Великая Чума",
  NomadHordeInvasion = "Вторжение Степной Орды",
  GrandTourney = "Великий Королевский Турнир",
  GoldRush = "Золотая Лихорадка в шахтах",
  PeasantUprising = "Великое Крестьянское Восстание"
}

export interface ActiveWorldEvent {
  type: WorldEventType;
  name: string;
  description: string;
  ticksRemaining: number;
}

export class WorldEventsEngine {
  private static currentEvent: ActiveWorldEvent = {
    type: WorldEventType.None,
    name: "Мирная эпоха",
    description: "В феодальных землях царит хрупкое равновесие между королевствами.",
    ticksRemaining: 1200
  };

  public static getCurrentEvent(): ActiveWorldEvent {
    return this.currentEvent;
  }

  /**
   * Ticked periodically from main cycle (e.g. every 20 seconds / 400 ticks)
   */
  public static tick() {
    this.currentEvent.ticksRemaining -= 400;

    if (this.currentEvent.ticksRemaining <= 0) {
      this.triggerNextRandomEvent();
    }
  }

  public static triggerNextRandomEvent() {
    const events = [
      WorldEventType.NomadHordeInvasion,
      WorldEventType.GrandTourney,
      WorldEventType.BlackPlague,
      WorldEventType.GoldRush,
      WorldEventType.PeasantUprising
    ];

    const pick = events[Math.floor(Math.random() * events.length)];
    this.startEvent(pick);
  }

  public static startEvent(type: WorldEventType) {
    switch (type) {
      case WorldEventType.NomadHordeInvasion:
        this.currentEvent = {
          type,
          name: "🔥 ВТОРЖЕНИЕ СТЕПНОЙ ОРДЫ",
          description: "Из диких бескрайних степей хлынула конная орда из 800 кочевников с катапультами! Королевства призывают всех героев в ополчение!",
          ticksRemaining: 3600 // ~3 minutes
        };
        world.sendMessage(
          `§c§l[ГЛОБАЛЬНОЕ СОБЫТИЕ] ${this.currentEvent.name}!§r\n§e${this.currentEvent.description}§r`
        );
        break;

      case WorldEventType.GrandTourney:
        this.currentEvent = {
          type,
          name: "🏆 ВЕЛИКИЙ РЫЦАРСКИЙ ТУРНИР",
          description: "В столице объявлены рыцарские турнирные игры! Лучшие бойцы со всех земель сражаются на арене за славу, титул чемпиона и 100 изумрудов!",
          ticksRemaining: 3600
        };
        world.sendMessage(
          `§6§l[ГЛОБАЛЬНОЕ СОБЫТИЕ] ${this.currentEvent.name}!§r\n§b${this.currentEvent.description}§r`
        );
        break;

      case WorldEventType.BlackPlague:
        this.currentEvent = {
          type,
          name: "💀 ВЕЛИКАЯ ЧУМА",
          description: "Моровое поветрие охватило города. Прирост населения остановлен, цены на хлеб и целебные зелья выросли в 3 раза!",
          ticksRemaining: 2400
        };
        world.sendMessage(
          `§5§l[ГЛОБАЛЬНОЕ СОБЫТИЕ] ${this.currentEvent.name}!§r\n§d${this.currentEvent.description}§r`
        );
        break;

      case WorldEventType.GoldRush:
        this.currentEvent = {
          type,
          name: "✨ ЗОЛОТАЯ ЛИХОРАДКА В ШАХТАХ",
          description: "В глубинах рудников открыты богатейшие золотые жилы! Доходы шахтерских городов удвоены, а бандиты устроили охоту на купеческие караваны!",
          ticksRemaining: 3000
        };
        world.sendMessage(
          `§a§l[ГЛОБАЛЬНОЕ СОБЫТИЕ] ${this.currentEvent.name}!§r\n§e${this.currentEvent.description}§r`
        );
        break;

      case WorldEventType.PeasantUprising:
        this.currentEvent = {
          type,
          name: "⚡ КРЕСТЬЯНСКИЙ БУНТ",
          description: "Волна мятежей прокатилась по феодальным землям! Вооруженные ополченцы перекрыли торговые тракты!",
          ticksRemaining: 2400
        };
        world.sendMessage(
          `§c§l[ГЛОБАЛЬНОЕ СОБЫТИЕ] ${this.currentEvent.name}!§r\n§e${this.currentEvent.description}§r`
        );
        break;

      default:
        this.currentEvent = {
          type: WorldEventType.None,
          name: "Мирная эпоха",
          description: "В феодальных землях царит покой.",
          ticksRemaining: 2400
        };
        break;
    }
  }
}
