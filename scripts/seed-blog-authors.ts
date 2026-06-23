#!/usr/bin/env tsx
import { seedBlogAuthors } from "@/lib/blog/seed-authors";
import { validateWritersCatalog } from "@/lib/blog/authors-catalog";

async function main() {
  const errors = validateWritersCatalog();
  if (errors.length) {
    console.error("Errores en catálogo:", errors.join("\n"));
    process.exit(1);
  }

  const result = await seedBlogAuthors();
  console.log(`Autores editoriales: ${result.upserted} upserted.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
