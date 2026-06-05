import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";

describe("cocktails-io backup", () => {
  let tmpDir = "";

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("creates backup copy before overwriting cocktails file", () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cocktails-io-"));
    const cocktailsPath = path.join(tmpDir, "cocktails.json");
    fs.writeFileSync(cocktailsPath, "[]\n", "utf8");

    const backupPath = path.join(tmpDir, "cocktails.json.bak-test");
    fs.copyFileSync(cocktailsPath, backupPath);
    fs.writeFileSync(cocktailsPath, JSON.stringify([{ id: "dg-1" }], null, 2));

    expect(JSON.parse(fs.readFileSync(backupPath, "utf8"))).toEqual([]);
    expect(JSON.parse(fs.readFileSync(cocktailsPath, "utf8"))).toHaveLength(1);
  });
});
