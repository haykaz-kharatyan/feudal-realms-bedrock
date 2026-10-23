import { world, system, EntityDamageSource, ItemStack } from "@minecraft/server";
import { AdvisorUI } from "./AdvisorUI";
import { SettlementData, CityTier } from "./CityProgression";
import { LogisticsCaravanManager } from "./LogisticsCaravan";
import { BuildingEngine } from "./BuildingEngine";
import { CityLightingEngine } from "./CityLightingEngine";
import { VirtualWorldEngine } from "./VirtualWorldEngine";
import { ColonizationEngine } from "./ColonizationEngine";
import { NavalEngine } from "./NavalEngine";
import { WorldMapUI } from "./WorldMapUI";
import { BorderManager } from "./BorderManager";
import { PlayerRPGProfile } from "./PlayerRPGProfile";
import { AllianceSystem } from "./AllianceSystem";
import { SquadTacticsEngine } from "./SquadTacticsEngine";
import { MarketplaceEngine } from "./MarketplaceEngine";
import { HUDCompass } from "./HUDCompass";
import { NaturalKingdomSpawner } from "./NaturalKingdomSpawner";

// Initialize the persistent virtual world engine and military alliances
VirtualWorldEngine.initializeDefaultRealms();
AllianceSystem.initializeAlliances();

// Active settlements in loaded chunks
const activeSettlements: Map<string, SettlementData> = VirtualWorldEngine.getAllSettlements();

// Ensure initial ticking area and borders on primary kingdom
const defaultTown = activeSettlements.get("fact_kingdom_1");
if (defaultTown) {
  VirtualWorldEngine.ensureTickingArea(defaultTown);
  BorderManager.updateBordersForSettlement(defaultTown);
}

// 1. Caravan tick loop (every 1s)
system.runInterval(() => {
  LogisticsCaravanManager.tick();
}, 20);

// 2. Building engine block placement tick loop (every 5 ticks)
system.runInterval(() => {
  BuildingEngine.tick();
}, 5);

// 3. City lighting engine loop (illuminates the entire city territory)
system.runInterval(() => {
  CityLightingEngine.tick(activeSettlements);
}, 60);

// 4. Virtual World simulation loop (runs background economy & distant kingdoms)
system.runInterval(() => {
  VirtualWorldEngine.tickVirtualWorld();
}, 40);

// 5. Colonization expedition progression loop (every 2s)
system.runInterval(() => {
  ColonizationEngine.tick();
}, 40);

// 6. Maritime naval trade voyage loop (every 2s)
system.runInterval(() => {
  NavalEngine.tick();
}, 40);

// 7. Player proximity checker for materializing evolved distant cities (every 2s)
system.runInterval(() => {
  for (const player of world.getPlayers()) {
    VirtualWorldEngine.checkPlayerProximityAndMaterialize(player.location, player.dimension.id);
  }
}, 40);

// 8. Player RPG Profile loop (health scaling from feudal title & epithets passives every 10s)
system.runInterval(() => {
  for (const player of world.getPlayers()) {
    PlayerRPGProfile.applyHealthAndPassives(player);
  }
}, 200);

// 9. Real-time HUD Compass & Actionbar mini-map under hearts (every 1s)
system.runInterval(() => {
  HUDCompass.tick(activeSettlements);
}, 20);

// 10. Natural Kingdom Spawner: Automatically creates living kingdom with Throne & Advisor near players (every 3s)
system.runInterval(() => {
  for (const player of world.getPlayers()) {
    NaturalKingdomSpawner.checkAndSpawnNaturalKingdom(player, activeSettlements);
  }
}, 60);

// Handle Item Use: Realm Map, War Horn, and Commander's Banner
world.afterEvents.itemUse.subscribe((event) => {
  const item = event.itemStack;
  const player = event.source;

  if (item.typeId === "feudal:realm_map") {
    system.run(() => {
      WorldMapUI.openRealmMap(player);
    });
  } else if (item.typeId === "feudal:commander_banner") {
    system.run(() => {
      const town = activeSettlements.get("fact_kingdom_1");
      SquadTacticsEngine.openTacticsMenu(player, town);
    });
  } else if (item.typeId === "feudal:war_horn") {
    world.sendMessage("§c§l[БОЕВОЙ РОГ] Прозвучал протяжный боевой сигнал тревоги! Воины, к оружию!§r");
    try {
      player.dimension.spawnParticle("minecraft:sonic_explosion", {
        x: player.location.x,
        y: player.location.y + 1.5,
        z: player.location.z
      });
    } catch {
      // particle fallback
    }
    system.run(() => {
      const town = activeSettlements.get("fact_kingdom_1");
      SquadTacticsEngine.openTacticsMenu(player, town);
    });
  }
});

function openAdvisor(player: any, target: any) {
  const settlement = activeSettlements.get("fact_kingdom_1") ?? {
    factionId: "fact_kingdom_1",
    tier: CityTier.Village,
    throneLocation: target.location,
    dimensionId: target.dimension.id,
    treasury: { wood: 500, stone: 300, iron: 80, emeralds: 90, food: 450 },
    population: 180,
    militaryCount: 45,
    taxRatePercent: 10
  };
  AdvisorUI.openMainMenu(player, settlement);
}

const beforeEvents = world.beforeEvents as any;
if (beforeEvents.playerInteractWithEntity) {
  beforeEvents.playerInteractWithEntity.subscribe((event: any) => {
    const target = event.target;
    if (target?.typeId === "feudal:advisor") {
      event.cancel = true;
      system.run(() => {
        openAdvisor(event.player, target);
      });
    } else if (target?.typeId === "feudal:cartographer") {
      event.cancel = true;
      system.run(() => {
        WorldMapUI.openRealmMap(event.player);
      });
    } else if (target?.typeId === "feudal:merchant") {
      event.cancel = true;
      system.run(() => {
        const town = activeSettlements.get("fact_kingdom_1");
        if (town) MarketplaceEngine.openMarketMenu(event.player, town);
      });
    }
  });
}

const afterEvents = world.afterEvents as any;
if (afterEvents.playerInteractWithEntity) {
  afterEvents.playerInteractWithEntity.subscribe((event: any) => {
    const target = event.target;
    if (target?.typeId === "feudal:advisor") {
      system.run(() => {
        openAdvisor(event.player, target);
      });
    } else if (target?.typeId === "feudal:cartographer") {
      system.run(() => {
        WorldMapUI.openRealmMap(event.player);
      });
    } else if (target?.typeId === "feudal:merchant") {
      system.run(() => {
        const town = activeSettlements.get("fact_kingdom_1");
        if (town) MarketplaceEngine.openMarketMenu(event.player, town);
      });
    }
  });
}

// Data-driven trigger support for bedrock entity interact event
if (afterEvents.dataDrivenEntityTrigger) {
  afterEvents.dataDrivenEntityTrigger.subscribe((event: any) => {
    if (event.id === "feudal:open_advisor_ui" && event.entity?.typeId === "feudal:advisor") {
      const players = world.getPlayers();
      if (players.length > 0) {
        openAdvisor(players[0], event.entity);
      }
    }
  });
}

world.afterEvents.entityHurt.subscribe((event) => {
  const hurtEntity = event.hurtEntity;
  const damageSource = (event as any).damageSource as EntityDamageSource | undefined;
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

// 9. Track entity kills for player combat epithets and battle tallies
world.afterEvents.entityDie.subscribe((event) => {
  PlayerRPGProfile.handleEntityKill(event);
});

// 10. Refresh health and skills, and grant starter Realm Map when player spawns
const playerSpawnEvent = (world.afterEvents as any).playerSpawn;
if (playerSpawnEvent) {
  playerSpawnEvent.subscribe((event: any) => {
    const player = event.player;
    if (player) {
      system.runTimeout(() => {
        PlayerRPGProfile.applyHealthAndPassives(player);

        // Grant Atlas of the Realms to the player if they don't have one
        try {
          const inv = player.getComponent("inventory")?.container;
          if (inv) {
            let hasMap = false;
            for (let i = 0; i < inv.size; i++) {
              const item = inv.getItem(i);
              if (item?.typeId === "feudal:realm_map") {
                hasMap = true;
                break;
              }
            }
            if (!hasMap) {
              inv.addItem(new ItemStack("feudal:realm_map", 1));
              player.sendMessage(
                "§6§l[КОРОЛЕВСКИЙ КАРТОГРАФ]§r §eВам дарован Атлас Королевств! Следите за компасом на экране — он указывает путь к ближайшему замку!§r"
              );
            }
          }
        } catch {}
      }, 20);
    }
  });
}

// 11. Automatic kingdom founding upon placing a Throne block in Survival
const blockPlaceEvent = (world.afterEvents as any).playerPlaceBlock;
if (blockPlaceEvent) {
  blockPlaceEvent.subscribe((event: any) => {
    const block = event.block;
    const player = event.player;
    if (block?.typeId === "feudal:throne") {
      const loc = block.location;
      const settlement = activeSettlements.get("fact_kingdom_1") ?? {
        factionId: "fact_kingdom_1",
        tier: CityTier.Village,
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

      // Spawn Royal Advisor near the throne
      try {
        const advisor = player.dimension.spawnEntity("feudal:advisor", {
          x: loc.x,
          y: loc.y,
          z: loc.z + 2
        });
        advisor.nameTag = `Советник королевства ${player.name}`;
      } catch {}

      world.sendMessage(
        `§6§l[КОРОЛЕВСТВО ОСНОВАНО]§r §e${player.name} воздвиг престол на координатах [${loc.x}, ${loc.y}, ${loc.z}]! Королевский Советник прибыл к вашему трону. Поговорите с ним, чтобы возвести замок!§r`
      );
    }
  });
}

console.warn("[Feudal Realms] Скриптовое ядро, колонизация, морские тракты, осадные орудия, альянсы, рецепты и RPG-профиль успешно запущены.");
