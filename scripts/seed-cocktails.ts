import fs from 'fs'
import path from 'path'
import csvParser from 'csv-parser'
import {
  cocktailIdFromDiffordsId,
  cocktailIdFromSlug,
  extractDiffordsIdFromUrl,
} from '../lib/diffords/ids'

type CocktailRow = Record<string, string>

type CocktailRecord = {
  id: string
  diffordsId?: number
  sourceUrl?: string
  title: string
  slug: string
  rating: number
  glass: string
  ingredients: string[]
  method: string
  abv: string
  kcal: number
  cover: string
  reviewStatus?: 'pending' | 'ok' | 'fixed' | 'manual'
}

const inputFiles = [
  process.argv[2] || 'cocteles_vermut_masivo.csv',
  'Recetas_Solo_Vermut_Rojo_El_Travieso.csv'
]
const outputDir = path.resolve(process.cwd(), 'data')
const outputPath = path.join(outputDir, 'cocktails.json')
const outputMarkdownDir = path.join(outputDir, 'cocktails-md')
const shouldWriteMarkdown = process.argv.includes('--md')

function normalizeHeader(header: string) {
  const value = header.toLowerCase().trim().replace(/^\ufeff/, '')

  if (value.includes('título') || value.includes('title') || value.includes('nombre')) return 'title'
  if (value.includes('slug')) return 'slug'
  if (value.includes('puntuación') || value.includes('rating') || value.includes('score')) return 'rating'
  if (value.includes('cristal') || value.includes('vaso') || value.includes('glass')) return 'glass'
  if (value.includes('ingredientes') || value.includes('ingredients')) return 'ingredients'
  if (value.includes('método') || value.includes('method') || value.includes('preparación')) return 'method'
  if (value.includes('abv') || value.includes('alcohólico') || value.includes('grado')) return 'abv'
  if (value.includes('kcal') || value.includes('calorías') || value.includes('calorias')) return 'kcal'
  if (value.includes('enlace') || value.includes('original') || value.includes('url')) return 'sourceUrl'

  return value.replace(/\s+/g, '_')
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function parseIngredients(value: string) {
  return value
    .split(/\r?\n|\|\||;|\s+-\s+|\s{2,}/)
    .map((item) => item.replace(/^-+/, '').trim())
    .filter(Boolean)
}

function makeMarkdown(cocktail: CocktailRecord) {
  return `---
title: "${cocktail.title}"
slug: "${cocktail.slug}"
rating: ${cocktail.rating}
glass: "${cocktail.glass}"
abv: "${cocktail.abv}"
kcal: ${cocktail.kcal}
cover: "${cocktail.cover}"
---

# ${cocktail.title}

**Vaso:** ${cocktail.glass}

**Puntuación:** ${cocktail.rating}

**ABV:** ${cocktail.abv}

**Kcal:** ${cocktail.kcal}

## Ingredientes

${cocktail.ingredients.map((ingredient) => `- ${ingredient}`).join('\n')}

## Método

${cocktail.method}
`
}

function resolveInputPath() {
  for (const file of inputFiles) {
    const candidate = path.resolve(process.cwd(), file)
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }
  throw new Error(`No se encontró ningún CSV válido en: ${inputFiles.join(', ')}`)
}

async function seed() {
  const inputPath = resolveInputPath()
  const cocktails: CocktailRecord[] = []

  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(inputPath)
      .pipe(csvParser({ mapHeaders: ({ header }) => normalizeHeader(header) }))
      .on('data', (row: CocktailRow) => {
        const title = row.title?.trim() || 'Cóctel sin título'
        const slug = slugify(row.slug || title)
        const sourceUrl = row.sourceUrl?.trim()
        const diffordsId = sourceUrl ? extractDiffordsIdFromUrl(sourceUrl) : undefined
        const id = diffordsId != null ? cocktailIdFromDiffordsId(diffordsId) : cocktailIdFromSlug(slug)

        cocktails.push({
          id,
          diffordsId,
          sourceUrl,
          title,
          slug,
          rating: Number(String(row.rating || '0').replace(/[^0-9.]/g, '')) || 0,
          glass: row.glass?.trim() || 'Copa de cóctel',
          ingredients: parseIngredients(row.ingredients || ''),
          method: row.method?.trim() || 'Mezclar todos los ingredientes con hielo y servir.',
          abv: row.abv?.trim() || 'No especificado',
          kcal: Number(String(row.kcal || row.calories || '0').replace(/[^0-9.]/g, '')) || 0,
          cover: '/cocktail-placeholder.svg',
          reviewStatus: 'pending',
        })
      })
      .on('end', () => resolve())
      .on('error', (error) => reject(error))
  })

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  fs.writeFileSync(outputPath, JSON.stringify(cocktails, null, 2), 'utf8')
  console.log(`Semilla de cocteles generada en ${outputPath}`)

  if (shouldWriteMarkdown) {
    if (!fs.existsSync(outputMarkdownDir)) {
      fs.mkdirSync(outputMarkdownDir, { recursive: true })
    }
    cocktails.forEach((cocktail) => {
      fs.writeFileSync(path.join(outputMarkdownDir, `${cocktail.slug}.md`), makeMarkdown(cocktail), 'utf8')
    })
    console.log(`Fichas Markdown generadas en ${outputMarkdownDir}`)
  }
}

seed().catch((error) => {
  console.error('Error generando la semilla de cocteles:', error)
  process.exit(1)
})
