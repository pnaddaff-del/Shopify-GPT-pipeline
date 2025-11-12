import fs from "fs";

export async function normalizeCsv(
  inPath: string,
  outPath: string,
  dataset: string
) {
  // Minimal pass-through now; hook schema fixes later.
  await fs.promises.copyFile(inPath, outPath);
}

