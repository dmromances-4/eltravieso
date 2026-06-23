import fs from "fs";
import path from "path";

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function writeJsonAtomic(file: string, data: unknown): void {
  const dir = path.dirname(file);
  ensureDir(dir);
  const tmp = path.join(dir, `.${path.basename(file)}.${process.pid}.tmp`);
  const payload = `${JSON.stringify(data, null, 2)}\n`;
  let lastError: unknown;
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      fs.writeFileSync(tmp, payload, "utf-8");
      if (fs.existsSync(file)) fs.rmSync(file, { force: true });
      fs.renameSync(tmp, file);
      return;
    } catch (err) {
      lastError = err;
      try {
        if (fs.existsSync(tmp)) fs.rmSync(tmp, { force: true });
      } catch {
        // ignore cleanup errors
      }
      const waitMs = 500 * (attempt + 1);
      const start = Date.now();
      while (Date.now() - start < waitMs) {
        // brief pause before retry (OneDrive lock)
      }
    }
  }
  throw lastError;
}
