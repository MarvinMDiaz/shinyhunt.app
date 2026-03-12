/**
 * Default Games Fallback
 * 
 * Hardcoded fallback list if games.json cannot be loaded.
 * This ensures the UI never breaks.
 */

export interface Game {
  id: string
  name: string
  generation: number
  platform: string
}

export const DEFAULT_GAMES: Game[] = [
  // Generation 1
  {
    id: "red",
    name: "Red",
    generation: 1,
    platform: "Game Boy",
  },
  {
    id: "blue",
    name: "Blue",
    generation: 1,
    platform: "Game Boy",
  },
  {
    id: "yellow",
    name: "Yellow",
    generation: 1,
    platform: "Game Boy",
  },
  // Generation 2
  {
    id: "gold",
    name: "Gold",
    generation: 2,
    platform: "Game Boy Color",
  },
  {
    id: "silver",
    name: "Silver",
    generation: 2,
    platform: "Game Boy Color",
  },
  {
    id: "crystal",
    name: "Crystal",
    generation: 2,
    platform: "Game Boy Color",
  },
  // Generation 3
  {
    id: "ruby",
    name: "Ruby",
    generation: 3,
    platform: "Game Boy Advance",
  },
  {
    id: "sapphire",
    name: "Sapphire",
    generation: 3,
    platform: "Game Boy Advance",
  },
  {
    id: "fire_red",
    name: "FireRed",
    generation: 3,
    platform: "Game Boy Advance",
  },
  {
    id: "leaf_green",
    name: "LeafGreen",
    generation: 3,
    platform: "Game Boy Advance",
  },
  {
    id: "emerald",
    name: "Emerald",
    generation: 3,
    platform: "Game Boy Advance",
  },
  // Generation 4
  {
    id: "diamond",
    name: "Diamond",
    generation: 4,
    platform: "Nintendo DS",
  },
  {
    id: "pearl",
    name: "Pearl",
    generation: 4,
    platform: "Nintendo DS",
  },
  {
    id: "platinum",
    name: "Platinum",
    generation: 4,
    platform: "Nintendo DS",
  },
  {
    id: "heartgold",
    name: "HeartGold",
    generation: 4,
    platform: "Nintendo DS",
  },
  {
    id: "soulsilver",
    name: "SoulSilver",
    generation: 4,
    platform: "Nintendo DS",
  },
  // Generation 5
  {
    id: "black",
    name: "Black",
    generation: 5,
    platform: "Nintendo DS",
  },
  {
    id: "white",
    name: "White",
    generation: 5,
    platform: "Nintendo DS",
  },
  {
    id: "black2",
    name: "Black 2",
    generation: 5,
    platform: "Nintendo DS",
  },
  {
    id: "white2",
    name: "White 2",
    generation: 5,
    platform: "Nintendo DS",
  },
  // Generation 6
  {
    id: "x",
    name: "X",
    generation: 6,
    platform: "Nintendo 3DS",
  },
  {
    id: "y",
    name: "Y",
    generation: 6,
    platform: "Nintendo 3DS",
  },
  {
    id: "omega_ruby",
    name: "Omega Ruby",
    generation: 6,
    platform: "Nintendo 3DS",
  },
  {
    id: "alpha_sapphire",
    name: "Alpha Sapphire",
    generation: 6,
    platform: "Nintendo 3DS",
  },
  // Generation 7
  {
    id: "sun",
    name: "Sun",
    generation: 7,
    platform: "Nintendo 3DS",
  },
  {
    id: "moon",
    name: "Moon",
    generation: 7,
    platform: "Nintendo 3DS",
  },
  {
    id: "ultra_sun",
    name: "Ultra Sun",
    generation: 7,
    platform: "Nintendo 3DS",
  },
  {
    id: "ultra_moon",
    name: "Ultra Moon",
    generation: 7,
    platform: "Nintendo 3DS",
  },
  {
    id: "lets_go_pikachu",
    name: "Let's Go Pikachu",
    generation: 7,
    platform: "Nintendo Switch",
  },
  {
    id: "lets_go_eevee",
    name: "Let's Go Eevee",
    generation: 7,
    platform: "Nintendo Switch",
  },
  // Generation 8
  {
    id: "sword",
    name: "Sword",
    generation: 8,
    platform: "Nintendo Switch",
  },
  {
    id: "shield",
    name: "Shield",
    generation: 8,
    platform: "Nintendo Switch",
  },
  {
    id: "brilliant_diamond",
    name: "Brilliant Diamond",
    generation: 8,
    platform: "Nintendo Switch",
  },
  {
    id: "shining_pearl",
    name: "Shining Pearl",
    generation: 8,
    platform: "Nintendo Switch",
  },
  {
    id: "legends_arceus",
    name: "Legends Arceus",
    generation: 8,
    platform: "Nintendo Switch",
  },
  // Generation 9
  {
    id: "scarlet",
    name: "Scarlet",
    generation: 9,
    platform: "Nintendo Switch",
  },
  {
    id: "violet",
    name: "Violet",
    generation: 9,
    platform: "Nintendo Switch",
  },
  // Generation 10
  {
    id: "legends_za",
    name: "Legends Z-A",
    generation: 10,
    platform: "Nintendo Switch",
  },
]
