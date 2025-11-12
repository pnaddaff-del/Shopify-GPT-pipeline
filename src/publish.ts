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

  // Attach the file to the vector store (compatible with OpenAI v6+)
  // @ts-ignore – the type definitions may lag behind the live API
  await client.beta.vector_stores.files.create(vectorStoreId, {
    file_id: file.id,
  });

  console.log(`✅ Uploaded ${localPath} to vector store ${vectorStoreId}`);
  return file.id;
}
