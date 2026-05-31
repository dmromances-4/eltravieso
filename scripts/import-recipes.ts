import * as fs from 'fs';
import * as xlsx from 'xlsx';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  console.log("Reading excel file...");
  const buffer = fs.readFileSync('Recetas/Recetas cocteles vermut.xlsx');
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet) as any[];

  console.log(`Found ${data.length} recipes. Finding or creating author...`);

  // Use a default user
  let user = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!user) {
    user = await prisma.user.findFirst();
  }
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'system@eltravieso.com',
        password: 'hash_not_needed_for_system',
        name: 'El Travieso Bot',
        role: 'ADMIN',
      }
    });
  }

  let imported = 0;
  for (const row of data) {
    const title = row['Nombre Cóctel'] || 'Cóctel Sin Nombre';
    const ingredients = row['Ingredientes Originales'] || '';
    const method = row['Método (How to make)'] || '';
    const summary = row['Historia / Curiosidades'] || '';
    const abvString = row['Grado Alcohólico (ABV)'];
    let abv = null;
    
    if (abvString && !abvString.includes('No especificado')) {
      const match = abvString.match(/[\d.]+/);
      if (match) abv = parseFloat(match[0]);
    }

    let slug = generateSlug(title);
    let index = 1;
    while (await prisma.recipe.findUnique({ where: { slug } })) {
      slug = `${generateSlug(title)}-${index}`;
      index++;
    }

    try {
      await prisma.recipe.create({
        data: {
          title,
          slug,
          summary,
          ingredients,
          method,
          authorId: user.id,
          technical: {
            create: {
              abv,
              tasting: row['Adorno (Garnish)'] ? `Adorno: ${row['Adorno (Garnish)']}` : null,
            }
          }
        }
      });
      imported++;
    } catch (err) {
      console.error(`Failed to import ${title}`, err);
    }
  }

  console.log(`Imported ${imported} recipes successfully.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
