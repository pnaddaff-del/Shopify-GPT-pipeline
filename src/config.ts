export const CFG = {
  rootId: process.env.GOOGLE_DRIVE_ROOT_ID!,
  histRootId: process.env.GOOGLE_DRIVE_HIST_ROOT_ID!,
  vectorStoreId: process.env.OPENAI_VECTOR_STORE_ID!,
  openaiKey: process.env.OPENAI_API_KEY!,
  saJson: process.env.GOOGLE_SERVICE_ACCOUNT_JSON!,
  datasets: ["orders", "customers", "products", "discounts", "payouts"] as const,
};

export type Dataset = typeof CFG.datasets[number];

