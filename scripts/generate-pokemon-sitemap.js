#!/usr/bin/env node

/**
 * Generate Pokémon Sitemap
 * 
 * Generates sitemap.xml entries for all Pokémon hunt pages.
 * This script can be run to update sitemap-pokemon.xml with all Pokémon.
 */

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')

const CANONICAL_DOMAIN = 'https://www.shinyhunt.app'
const POKEMON_LIMIT = 151 // Start with Gen 1, can be expanded

/**
 * Convert Pokémon name to URL slug
 */
function pokemonNameToSlug(name) {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-shiny-hunt`
}

/**
 * Generate sitemap entries for Pokémon
 */
async function generatePokemonSitemap() {
  try {
    // Fetch Pokémon list from PokéAPI
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${POKEMON_LIMIT}`)
    if (!response.ok) {
      throw new Error('Failed to fetch Pokémon list')
    }
    const data = await response.json()
    
    const pokemonList = data.results.map(p => p.name)
    
    // Generate XML entries
    const entries = pokemonList.map(name => {
      const slug = pokemonNameToSlug(name)
      return `  <url>
    <loc>${CANONICAL_DOMAIN}/pokemon/${slug}</loc>
    <lastmod>2026-03-12</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`
    }).join('\n')
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
  <!-- Pokémon Hunt Pages - Generated automatically -->
${entries}
</urlset>`
    
    // Write to file
    const outputPath = join(projectRoot, 'public', 'sitemap-pokemon.xml')
    writeFileSync(outputPath, xml, 'utf-8')
    
    console.log(`✅ Generated sitemap with ${pokemonList.length} Pokémon pages`)
    console.log(`📄 Saved to: ${outputPath}`)
  } catch (error) {
    console.error('❌ Error generating Pokémon sitemap:', error)
    process.exit(1)
  }
}

generatePokemonSitemap()
