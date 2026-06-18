import { execFile } from "child_process";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

/** Cross-platform Remotion CLI render (Windows needs .cmd + shell). */
export async function runRemotionRender(
  entry: string,
  compositionId: string,
  outputPath: string,
  propsPath: string,
): Promise<void> {
  const remotionBin = path.join(
    process.cwd(),
    "node_modules",
    ".bin",
    process.platform === "win32" ? "remotion.cmd" : "remotion",
  );

  await execFileAsync(
    remotionBin,
    ["render", entry, compositionId, outputPath, `--props=${propsPath}`],
    {
      cwd: process.cwd(),
      maxBuffer: 20 * 1024 * 1024,
      shell: process.platform === "win32",
    },
  );
}
