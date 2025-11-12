// Temporary stub to skip native DuckDB build issues on Render.
// Replace this later with DuckDB-WASM or a working native build.

export async function csvToParquet(csvPath: string, parquetPath: string) {
  console.log(`Skipping DuckDB conversion: ${csvPath} → ${parquetPath}`);
  // Just copy the file to mimic conversion output.
  const fs = await import("fs/promises");
  await fs.copyFile(csvPath, parquetPath);
}
