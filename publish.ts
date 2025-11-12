import OpenAI from "openai";
import fs from "fs";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function uploadToVectorStore(
  localPath: string,
  vectorStoreId: string,
  meta: Record<string, string>
) {
  const file = await client.files.create({
    file: fs.createReadStream(localPath),
    purpose: "assistants",
    metadata: meta,
  });
  await client.vectorStores.files.create({
    vector_store_id: vectorStoreId,
    file_id: file.id,
  });
  return file.id;
}

