import fetch from "node-fetch";
import FormData from "form-data";
import { google } from "googleapis";

const {
  OPENAI_API_KEY,
  OPENAI_VECTOR_STORE_ID,
  GOOGLE_DRIVE_ROOT_ID,
  GOOGLE_DRIVE_HIST_ROOT_ID,
  GOOGLE_SERVICE_ACCOUNT_JSON,
} = process.env;

if (!OPENAI_API_KEY || !OPENAI_VECTOR_STORE_ID)
  throw new Error("Missing OPENAI envs");
if (!GOOGLE_DRIVE_ROOT_ID || !GOOGLE_DRIVE_HIST_ROOT_ID)
  throw new Error("Missing Drive folder IDs");
if (!GOOGLE_SERVICE_ACCOUNT_JSON)
  throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON");

const sa = JSON.parse(GOOGLE_SERVICE_ACCOUNT_JSON);
const auth = new google.auth.GoogleAuth({
  credentials: sa,
  scopes: ["https://www.googleapis.com/auth/drive.readonly"],
});
const drive = google.drive({ version: "v3", auth });

async function listCsvs(folderId) {
  const out = [];
  let pageToken = null;
  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and mimeType='text/csv' and trashed=false`,
      fields: "nextPageToken, files(id,name,modifiedTime,size)",
      pageToken,
    });
    out.push(...(res.data.files || []));
    pageToken = res.data.nextPageToken || null;
  } while (pageToken);
  return out;
}

async function downloadStream(fileId) {
  const res = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "stream" }
  );
  return res.data;
}

async function uploadToOpenAI(stream, filename) {
  const form = new FormData();
  form.append("purpose", "assistants");
  form.append("file", stream, { filename });
  const res = await fetch("https://api.openai.com/v1/files", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: form,
  });
  if (!res.ok)
    throw new Error(`OpenAI upload failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.id;
}

async function attachToVectorStore(fileId) {
  const res = await fetch(
    `https://api.openai.com/v1/vector_stores/${OPENAI_VECTOR_STORE_ID}/files`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ file_id: fileId }),
    }
  );
  if (!res.ok)
    throw new Error(`Attach failed: ${res.status} ${await res.text()}`);
}

async function ingestFolder(folderId, tag) {
  const files = await listCsvs(folderId);
  console.log(`[${tag}] ${files.length} CSV files found`);
  for (const f of files) {
    console.log(`[${tag}] Uploading ${f.name} (${f.id})`);
    const stream = await downloadStream(f.id);
    const fileId = await uploadToOpenAI(stream, f.name);
    await attachToVectorStore(fileId);
    console.log(`[${tag}] Attached ${fileId}`);
  }
}

(async () => {
  console.log("Starting ingestion…");
  await ingestFolder(GOOGLE_DRIVE_HIST_ROOT_ID, "historical");
  await ingestFolder(GOOGLE_DRIVE_ROOT_ID, "daily");
  console.log("Done.");
})();
