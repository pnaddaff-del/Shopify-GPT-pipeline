import fs from "fs";

const STATE = "/tmp/shopify_gpt_state.json";

type Seen = Record<string, string>; // fileId -> modifiedTime

export function loadState(): Seen {
  try {
    return JSON.parse(fs.readFileSync(STATE, "utf-8"));
  } catch {
    return {};
  }
}

export function saveState(s: Seen) {
  fs.writeFileSync(STATE, JSON.stringify(s));
}

