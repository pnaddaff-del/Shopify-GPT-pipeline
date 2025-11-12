import OpenAI from "openai";
import fs from "fs";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function uploadToVectorStore(
  localPath: string,
  vectorStoreId: string,
  meta: Record<string, string>
) {
  // Upload file
  const file = await client.files.create({
    file: fs.createReadStream(localPath),
    purpose: "assistants",
  });

  // Attach the file to an existing vector store
  await client.beta.vectorStores.files.create(vectorStoreId, {
    file_id: file.id,
  });

  console.log(`✅ Uploaded ${localPath} to vector store ${vectorStoreId}`);
  return file.id;
}
