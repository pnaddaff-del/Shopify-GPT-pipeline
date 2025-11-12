import path from "path";
import { CFG } from "./config.js";
import { listCsvFiles, downloadFile } from "./drive.js";
import { loadState, saveState } from "./state.js";
import { normalizeCsv } from "./normalize.js";
import { csvToParquet } from "./duck.js";
import { uploadToVectorStore } from "./publish.js";

async function processFolder(
  folderId: string,
  dataset: string,
  tag: "daily" | "historical"
) {
  const seen = loadState();
  const files = await listCsvFiles(folderId);

  for (const f of files) {
    const id = f.id!,
      mtime = f.modifiedTime!;
    const key = `${id}`;
    if (seen[key] === mtime) continue; // already processed

    const tmpDir = `/tmp/${dataset}/${id}`;
    const csvPath = path.join(tmpDir, f.name!);
    await downloadFile(id, csvPath);

    const normCsv = path.join(tmpDir, `norm_${f.name!}`);
    await normalizeCsv(csvPath, normCsv, dataset);

    // Optional: Parquet for speed/size
    const pqPath = path.join(tmpDir, f.name!.replace(/\.csv$/i, ".parquet"));
    await csvToParquet(normCsv, pqPath);

    await uploadToVectorStore(
      pqPath,
      CFG.vectorStoreId,
      {
        dataset: tag,
        type: dataset,
        asof: new Date().toISOString(),
        source_file: f.name!,
      }
    );

    seen[key] = mtime;
    saveState(seen);
    console.log(`Uploaded ${dataset}/${f.name} (${tag})`);
  }
}

async function main() {
  // Iterate each dataset by its two roots: daily + historical
  for (const dataset of CFG.datasets) {
    const dailyId =
      process.env[`GOOGLE_DRIVE_${dataset.toUpperCase()}_ID`] || CFG.rootId;
    const histId =
      process.env[`GOOGLE_DRIVE_${dataset.toUpperCase()}_HIST_ID`] ||
      CFG.histRootId;

    // If you keep all datasets in the same parent, listing by parent is enough.
    // If each dataset has its own subfolder, pass the subfolder IDs in env above.
    await processFolder(dailyId, dataset, "daily");
    await processFolder(histId, dataset, "historical");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

