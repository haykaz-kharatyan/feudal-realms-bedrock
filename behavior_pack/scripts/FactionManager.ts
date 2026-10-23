import { world } from "@minecraft/server";

export type FactionType = "village" | "bandit";

export interface FactionBanner {
  baseColor: string;
  patternColor: string;
  patternType: "diagonal" | "half" | "chevron" | "cross" | "border";
  symbol: string;
  bannerHash: string;
}

export interface FactionData {
  id: string;
  name: string;
  type: FactionType;
  banner: FactionBanner;
  overlordId?: string;
  vassalIds: string[];
  rulerName: string;
  title: string;
}

export class FactionManager {
  private static registeredHashes: Set<string> = new Set();
  private static factions: Map<string, FactionData> = new Map();

  private static colors = [
    "white", "orange", "magenta", "light_blue", "yellow", "lime", "pink", "gray",
    "light_gray", "cyan", "purple", "blue", "brown", "green", "red", "black"
  ];

  private static patterns: FactionBanner["patternType"][] = [
    "diagonal", "half", "chevron", "cross", "border"
  ];

  private static villageSymbols = [
    "crown", "greatsword", "wheat", "anvil", "tower", "shield", "stag", "oak", "scales"
  ];

  private static banditSymbols = [
    "skull", "crossed_axes", "ravager_eye", "flame", "beartrap", "wolf_jaw", "dagger"
  ];

  public static generateUniqueBanner(type: FactionType): FactionBanner {
    const symbols = type === "village" ? this.villageSymbols : this.banditSymbols;
    let attempts = 0;

    while (attempts < 1000) {
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
          symbol: symbol,
          bannerHash: hash
        };
      }
    }
    throw new Error("Исчерпан лимит уникальных знамен");
  }

  public static calculateTitle(vassalCount: number, cityTier: number): string {
    if (vassalCount >= 13) return "Император";
    if (vassalCount >= 8) return "Король";
    if (vassalCount >= 5) return "Герцог";
    if (vassalCount >= 3) return "Граф";
    if (vassalCount >= 2) return "Виконт";
    if (vassalCount === 1) return "Барон";

    switch (cityTier) {
      case 1: return "Вождь";
      case 2: return "Староста";
      case 3: return "Барон";
      case 4: return "Маркиз";
      case 5: return "Граф";
      case 6: return "Герцог";
      case 7: return "Великий Герцог";
      default: return "Вождь";
    }
  }

  public static registerFaction(faction: FactionData) {
    this.factions.set(faction.id, faction);
    this.saveState();
  }

  public static getFaction(id: string): FactionData | undefined {
    return this.factions.get(id);
  }

  private static saveState() {
    world.setDynamicProperty("feudal_factions", JSON.stringify(Array.from(this.factions.entries())));
  }
}
