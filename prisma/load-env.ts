import fs from "fs";
import path from "path";

/**
 * Loads root `.env` variables when Prisma CLI scripts (`db:seed`, `check-connection`)
 * are executed directly via `tsx` without `next` or `dotenv` pre-loading them.
 * Already-exported shell variables take precedence over `.env` entries.
 */
export function loadRootEnvFile(): void {
  const envPath = path.resolve(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const eqIdx = line.indexOf("=");
    if (eqIdx <= 0) continue;

    const key = line.slice(0, eqIdx).trim();
    if (!key || process.env[key] !== undefined) continue;

    let value = line.slice(eqIdx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}
