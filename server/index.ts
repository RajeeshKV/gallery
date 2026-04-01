import "dotenv/config";
import express from "express";
import { loadPortfolioAssets } from "./services/cloudinary.js";

const app = express();
const port = Number(process.env.PORT ?? 8787);

app.use((_, response, next) => {
  response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response.setHeader("Pragma", "no-cache");
  response.setHeader("Expires", "0");
  response.setHeader("Surrogate-Control", "no-store");
  next();
});

app.get("/api/health", (_, response) => {
  response.json({ ok: true, timestamp: new Date().toISOString() });
});

app.get("/api/portfolio-assets", async (_, response) => {
  try {
    const portfolio = await loadPortfolioAssets();
    response.json(portfolio);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown Cloudinary error";

    response.status(500).json({
      message,
      fetchedAt: new Date().toISOString(),
      carousel: [],
      gallery: [],
    });
  }
});

app.listen(port, () => {
  console.log(`Cloudinary API listening on http://localhost:${port}`);
});
