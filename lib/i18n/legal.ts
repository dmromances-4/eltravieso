import type { AppLocale } from "@/i18n/routing";
import { readFileSync, existsSync } from "fs";
import path from "path";

export type LegalSection = {
  title: string;
  paragraphs: string[];
  list?: string[];
};

export type LegalDocument = {
  updated: string;
  sections: LegalSection[];
};

export function loadLegalDocument(page: string, locale: AppLocale): LegalDocument | null {
  const filePath = path.join(process.cwd(), "content", "legal", locale, `${page}.json`);
  if (!existsSync(filePath)) return null;
  return JSON.parse(readFileSync(filePath, "utf8")) as LegalDocument;
}
