import { accessSync, constants } from "fs";
import path from "path";

const ROLLUP_NATIVE_PACKAGES: Record<string, string> = {
  "darwin-arm64": "rollup-darwin-arm64",
  "darwin-x64": "rollup-darwin-x64",
  "linux-arm64": "rollup-linux-arm64-gnu",
  "linux-x64": "rollup-linux-x64-gnu",
  "linux-arm": "rollup-linux-arm-gnueabihf",
  "linux-riscv64": "rollup-linux-riscv64-gnu",
  "linux-s390x": "rollup-linux-s390x-gnu",
  "linux-ppc64": "rollup-linux-ppc64-gnu",
  "win32-arm64": "rollup-win32-arm64-msvc",
  "win32-ia32": "rollup-win32-ia32-msvc",
  "win32-x64": "rollup-win32-x64-msvc",
  "freebsd-arm64": "rollup-freebsd-arm64",
  "freebsd-x64": "rollup-freebsd-x64",
  "openharmony-arm64": "rollup-openharmony-arm64",
  "android-arm64": "rollup-android-arm64",
  "android-arm": "rollup-android-arm-eabi",
};

function existsDir(dir: string): boolean {
  try {
    accessSync(dir, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function getExpectedRollupPackage(): string | null {
  const key = `${process.platform}-${process.arch}`;
  return ROLLUP_NATIVE_PACKAGES[key] ?? null;
}

function main() {
  const expected = getExpectedRollupPackage();
  if (!expected) {
    // Unknown platform — skip check rather than block tests.
    return;
  }

  const rollupDir = path.join(process.cwd(), "node_modules", "@rollup", expected);
  if (existsDir(rollupDir)) {
    return;
  }

  const platform = `${process.platform}/${process.arch}`;
  console.error(
    [
      "",
      `[ensure-native-deps] Falta el binario nativo de Rollup para ${platform}.`,
      `Esperado: node_modules/@rollup/${expected}`,
      "",
      "Suele ocurrir cuando node_modules se instaló en otra plataforma (p. ej. macOS vs Linux).",
      "",
      "Solución:",
      "  rm -rf node_modules && npm ci",
      "",
      "En sandbox Linux / CI / agentes remotos:",
      "  npm run test:ci",
      "",
    ].join("\n"),
  );
  process.exit(1);
}

main();
