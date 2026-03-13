/**
 * Shiny Hunting Guides Data
 * 
 * Searchable fact sheet / knowledge base for shiny hunting.
 * Each guide entry includes title, summary, body, and category.
 */

export type GuideCategory = 'Odds' | 'Methods' | 'Tips' | 'Mechanics'

export interface Guide {
  id: string
  title: string
  summary: string
  body: string
  category: GuideCategory
  keywords?: string[] // Additional search keywords
}

export const guides: Guide[] = [
  {
    id: 'shiny-odds',
    title: 'What are shiny odds?',
    summary: 'A quick explanation of the chance of encountering a shiny Pokémon.',
    body: 'Shiny odds are the probability of encountering a shiny Pokémon in a game. In older generations (Gen 1-5), the standard odds were 1 in 8,192. In newer generations (Gen 6+), the base odds are usually 1 in 4,096. Some methods, items, or mechanics can improve these odds significantly.',
    category: 'Odds',
    keywords: ['probability', 'chance', 'rate', '1/4096', '1/8192'],
  },
  {
    id: 'shiny-odds-by-generation',
    title: 'Shiny odds by generation',
    summary: 'How shiny odds changed across Pokémon game generations.',
    body: 'Shiny odds have changed throughout Pokémon history:\n\n• Gen 1-5: Base odds are 1 in 8,192\n• Gen 6+: Base odds improved to 1 in 4,096\n\nThis change made shiny hunting more accessible in modern games. Various methods and items can further improve these odds, such as the Shiny Charm, Masuda Method, or game-specific mechanics like SOS chaining or Dynamax Adventures.',
    category: 'Odds',
    keywords: ['generation', 'gen 1', 'gen 2', 'gen 3', 'gen 4', 'gen 5', 'gen 6', 'gen 7', 'gen 8', 'gen 9'],
  },
  {
    id: 'soft-resetting',
    title: 'What is soft resetting?',
    summary: 'A method for hunting shiny Pokémon from static encounters or gift Pokémon.',
    body: 'Soft resetting (SR) is a technique where you save your game before encountering a Pokémon, then reset the game if it\'s not shiny. This works for:\n\n• Legendary Pokémon\n• Gift Pokémon (like starters)\n• Static encounters (stationary Pokémon)\n• Mystery Gift Pokémon\n\nSimply save before the encounter, check if it\'s shiny, and reset if not. This preserves your game progress while allowing you to check multiple times.',
    category: 'Methods',
    keywords: ['SR', 'reset', 'static', 'legendary', 'gift'],
  },
  {
    id: 'masuda-method',
    title: 'What is the Masuda Method?',
    summary: 'A breeding technique that increases shiny odds by using Pokémon from different language games.',
    body: 'The Masuda Method is a breeding technique introduced in Gen 4 that increases shiny odds when breeding Pokémon from games with different language settings.\n\n• Base odds: 1 in 683 (Gen 4-5) or 1 in 512 (Gen 6+)\n• Requires: One parent Pokémon from a different language game\n• Works with: Any breedable Pokémon\n• Combined with Shiny Charm: 1 in 512 odds\n\nThis is one of the most popular shiny hunting methods for breedable Pokémon.',
    category: 'Methods',
    keywords: ['breeding', 'masuda', 'MM', 'different language', 'foreign'],
  },
  {
    id: 'shiny-charm',
    title: 'What is a shiny charm?',
    summary: 'A key item that permanently increases shiny encounter rates.',
    body: 'The Shiny Charm is a key item that increases your shiny encounter odds. To obtain it, you typically need to complete the Pokédex (or National Dex in some games).\n\n• Effect: Triples shiny odds\n• Gen 1-5: Changes odds from 1/8192 to 1/2731\n• Gen 6+: Changes odds from 1/4096 to 1/1365\n• Stacks with: Masuda Method, SOS chaining, and other methods\n\nIt\'s one of the most valuable items for shiny hunters and works passively for all encounters.',
    category: 'Mechanics',
    keywords: ['charm', 'key item', 'pokedex', 'complete', 'triple'],
  },
  {
    id: 'best-shiny-hunting-methods',
    title: 'Best shiny hunting methods',
    summary: 'An overview of the most effective shiny hunting techniques.',
    body: 'The best shiny hunting methods vary by game, but here are the most effective:\n\n• Dynamax Adventures (Sword/Shield): 1 in 100 odds\n• Ultra Wormholes (Ultra Sun/Moon): 1 in 100 odds\n• Mass Outbreaks (Legends Arceus): 1 in 158 odds\n• Masuda Method + Shiny Charm: 1 in 512 odds\n• SOS Chaining (Sun/Moon): Improves with chain length\n• DexNav (Omega Ruby/Alpha Sapphire): 1 in 512 odds\n• Friend Safari (X/Y): 1 in 512 odds\n\nChoose methods based on your game and target Pokémon.',
    category: 'Methods',
    keywords: ['best', 'effective', 'fastest', 'easiest', 'recommended'],
  },
  {
    id: 'how-many-resets',
    title: 'How many resets does a shiny usually take?',
    summary: 'Understanding expected attempts and probability for shiny encounters.',
    body: 'While shiny odds give you the probability, actual results vary:\n\n• Expected attempts: Equal to the denominator (e.g., 1/4096 = ~4,096 attempts)\n• 50% chance: ~2,833 attempts (for 1/4096)\n• 90% chance: ~9,430 attempts\n• 95% chance: ~12,276 attempts\n\nRemember: Each attempt is independent. You\'re not "due" for a shiny after many attempts, but the probability of finding one increases with more attempts. Some hunters get lucky early, others go over odds—both are normal!',
    category: 'Odds',
    keywords: ['resets', 'attempts', 'expected', 'average', 'probability', 'how long'],
  },
  {
    id: 'encounter-hunting',
    title: 'How does encounter hunting work?',
    summary: 'A method for hunting shiny Pokémon through random encounters.',
    body: 'Encounter hunting involves repeatedly encountering Pokémon in the wild until you find a shiny. This is the most basic shiny hunting method.\n\n• Works in: Grass, caves, water, and other encounter areas\n• Process: Walk around until you encounter a Pokémon, check if shiny, run/faint if not\n• Odds: Base odds for your generation (1/8192 or 1/4096)\n• Tips: Use Repels to avoid unwanted encounters, bring Pokémon with Run Away ability\n\nThis method works for any Pokémon available through random encounters in your game.',
    category: 'Methods',
    keywords: ['random encounter', 'wild', 'grass', 'cave', 'walking'],
  },
  {
    id: 'sos-chaining',
    title: 'What is SOS chaining?',
    summary: 'A shiny hunting method exclusive to Sun, Moon, Ultra Sun, and Ultra Moon.',
    body: 'SOS chaining is a method in Gen 7 games where you keep a wild Pokémon calling for help, creating a chain of encounters.\n\n• How it works: Use Adrenaline Orbs to make Pokémon call for help, defeat/catch the called Pokémon, repeat\n• Shiny odds: Improve as the chain increases\n• Best odds: Around 1/273 after a chain of 30+ with Shiny Charm\n• Tips: Bring a Pokémon with False Swipe and a status move, use Harvest + Leppa Berry for infinite PP\n\nThis method is great for Pokémon that can call for help and works well for many species.',
    category: 'Methods',
    keywords: ['SOS', 'chaining', 'sun', 'moon', 'ultra', 'adrenaline orb', 'call for help'],
  },
  {
    id: 'dexnav-hunting',
    title: 'What is DexNav hunting?',
    summary: 'A shiny hunting feature in Omega Ruby and Alpha Sapphire.',
    body: 'DexNav is a feature in ORAS that helps you find specific Pokémon and increases shiny odds.\n\n• How it works: Use the bottom screen to search for Pokémon, sneak up on them for better odds\n• Base odds: 1/512 with high search level\n• Benefits: Can find hidden abilities, better IVs, and shinies\n• Tips: Build up search level by encountering the same Pokémon repeatedly\n\nThis method is excellent for targeting specific Pokémon in Hoenn and works passively as you build search levels.',
    category: 'Methods',
    keywords: ['dexnav', 'ORAS', 'omega ruby', 'alpha sapphire', 'search level', 'sneak'],
  },
  {
    id: 'friend-safari',
    title: 'What is Friend Safari?',
    summary: 'A shiny hunting location in Pokémon X and Y.',
    body: 'Friend Safari is a post-game area in X/Y where you can encounter Pokémon from friends\' safaris.\n\n• Shiny odds: 1/512 (improved from base odds)\n• How it works: Add friends, visit their safari, encounter Pokémon\n• Benefits: Better shiny odds, hidden abilities, better IVs\n• Tips: Different friend codes give different Pokémon types\n\nThis is one of the easiest ways to hunt shinies in Gen 6 games, especially if you have active friends.',
    category: 'Methods',
    keywords: ['friend safari', 'X', 'Y', 'kalos', 'friend code', 'safari'],
  },
  {
    id: 'outbreak-hunts',
    title: 'What are outbreak hunts?',
    summary: 'Mass outbreak shiny hunting in Pokémon Legends: Arceus.',
    body: 'Mass outbreaks are special events in Legends: Arceus where many of the same Pokémon appear in one location.\n\n• Shiny odds: 1/158 base, improves with research level\n• How it works: Check the map for outbreak locations, travel there, catch/defeat Pokémon until shiny appears\n• Tips: Save before starting, reset if no shiny found, complete research tasks for better odds\n\nThis is one of the fastest shiny hunting methods in any Pokémon game, making Legends: Arceus excellent for shiny hunters.',
    category: 'Methods',
    keywords: ['outbreak', 'mass outbreak', 'legends arceus', 'PLA', 'hisui'],
  },
  {
    id: 'dynamax-adventures',
    title: 'What is Dynamax Adventures shiny hunting?',
    summary: 'The best shiny hunting method in Pokémon Sword and Shield.',
    body: 'Dynamax Adventures in the Crown Tundra DLC offer incredible shiny odds.\n\n• Shiny odds: 1 in 100 (1/100) without Shiny Charm, 1 in 25 with Shiny Charm\n• How it works: Complete Dynamax Adventures, catch Pokémon at the end, check if shiny\n• Benefits: Works for all legendaries and many regular Pokémon\n• Tips: You can see if a Pokémon is shiny before catching it, save before the final selection\n\nThis is the best method for hunting shiny legendaries in Gen 8 and one of the easiest shiny hunting methods ever.',
    category: 'Methods',
    keywords: ['dynamax', 'adventures', 'crown tundra', 'sword', 'shield', 'legendary'],
  },
  {
    id: 'sparkling-power',
    title: 'How does Sparkling Power affect shiny odds?',
    summary: 'A sandwich power in Pokémon Scarlet and Violet that boosts shiny rates.',
    body: 'Sparkling Power is a sandwich power in Gen 9 games that increases shiny encounter rates.\n\n• Effect: Level 3 Sparkling Power gives 1/1024 odds (4x better than base)\n• How to get: Make sandwiches with specific ingredients and Herba Mystica\n• Duration: 30 minutes of gameplay\n• Stacks with: Shiny Charm for even better odds\n• Tips: Combine with type-specific encounter power to target specific Pokémon\n\nThis makes shiny hunting in Scarlet and Violet very accessible, especially when combined with mass outbreaks.',
    category: 'Mechanics',
    keywords: ['sparkling power', 'sandwich', 'scarlet', 'violet', 'herba mystica', 'gen 9'],
  },
  {
    id: 'full-odds-vs-boosted',
    title: 'What is the difference between full odds and boosted odds?',
    summary: 'Understanding base shiny rates versus improved rates.',
    body: 'Full odds and boosted odds refer to different shiny encounter rates:\n\n• Full odds: The base shiny rate for your generation (1/8192 in Gen 1-5, 1/4096 in Gen 6+)\n• Boosted odds: Any improved rate from methods, items, or mechanics\n\nExamples of boosted odds:\n• Masuda Method: 1/512\n• Shiny Charm: 1/1365 (Gen 6+)\n• Dynamax Adventures: 1/100\n• SOS Chaining: Improves with chain\n\nMany hunters prefer full-odds shinies for the challenge, while others use boosted methods for efficiency. Both approaches are valid!',
    category: 'Odds',
    keywords: ['full odds', 'boosted', 'base', 'improved', 'challenge', 'efficiency'],
  },
]

/**
 * Get all unique categories from guides
 */
export function getGuideCategories(): GuideCategory[] {
  return Array.from(new Set(guides.map(g => g.category)))
}

/**
 * Search guides by query string
 * Matches against title, summary, body, category, and keywords
 */
export function searchGuides(query: string, category?: GuideCategory): Guide[] {
  const lowerQuery = query.toLowerCase().trim()
  
  if (!lowerQuery && !category) {
    return guides
  }
  
  return guides.filter(guide => {
    // Category filter
    if (category && guide.category !== category) {
      return false
    }
    
    // Search filter
    if (!lowerQuery) {
      return true
    }
    
    // Search in title, summary, body, category, and keywords
    const searchableText = [
      guide.title,
      guide.summary,
      guide.body,
      guide.category,
      ...(guide.keywords || []),
    ].join(' ').toLowerCase()
    
    return searchableText.includes(lowerQuery)
  })
}
