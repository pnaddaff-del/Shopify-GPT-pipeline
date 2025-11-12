import express, { Request, Response } from "express";

const app = express();

app.get("/", (req: Request, res: Response) => {
  res.send("✅ Shopify-GPT pipeline server is running");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server live on port ${port}`);
});
