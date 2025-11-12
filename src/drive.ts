import { google } from "googleapis";
import fs from "fs";
import path from "path";

function driveClient() {
  const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!);
  const jwt = new google.auth.JWT(
    creds.client_email,
    undefined,
    creds.private_key,
    ["https://www.googleapis.com/auth/drive.readonly"]
  );
  return google.drive({ version: "v3", auth: jwt });
}

export async function listCsvFiles(folderId: string) {
  const drive = driveClient();
  const q = `'${folderId}' in parents and mimeType='text/csv' and trashed=false`;
  const res = await drive.files.list({
    q,
    fields: "files(id,name,modifiedTime,parents)",
  });
  return res.data.files ?? [];
}

export async function downloadFile(fileId: string, outPath: string) {
  const drive = driveClient();
  await fs.promises.mkdir(path.dirname(outPath), { recursive: true });
  const dest = fs.createWriteStream(outPath);
  await new Promise<void>((resolve, reject) => {
    drive.files
      .get({ fileId, alt: "media" }, { responseType: "stream" })
      .then((r) => {
        r.data.on("end", () => resolve());
        r.data.on("error", reject);
        r.data.pipe(dest);
      })
      .catch(reject);
  });
  return outPath;
}

