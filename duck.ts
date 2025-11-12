import duckdb from "duckdb";

export async function csvToParquet(csvPath: string, parquetPath: string) {
  const db = new duckdb.Database(":memory:");
  const conn = db.connect();
  await conn.run(
    `CREATE OR REPLACE TABLE t AS SELECT * FROM read_csv_auto('${csvPath}', SAMPLE_SIZE=-1);`
  );
  await conn.run(
    `COPY t TO '${parquetPath}' (FORMAT PARQUET, COMPRESSION 'ZSTD');`
  );
  await conn.close();
}

