import "dotenv/config";
import express from "express";
import {
  loadGalleryPage,
  loadFolderMetadata,
  loadPortfolioAssets,
  loadVideoPage,
  saveFolderMetadata,
} from "./services/cloudinary.js";

const app = express();
const port = Number(process.env.PORT ?? 8787);

app.use(express.json());

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
      galleryNextCursor: null,
      videos: [],
      videosNextCursor: null,
    });
  }
});

app.get("/api/gallery-assets", async (request, response) => {
  try {
    const cursor =
      typeof request.query.cursor === "string" ? request.query.cursor : undefined;
    const gallery = await loadGalleryPage(cursor);
    response.json(gallery);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown Cloudinary error";

    response.status(500).json({
      message,
      items: [],
      nextCursor: null,
      fetchedAt: new Date().toISOString(),
    });
  }
});

app.get("/api/video-assets", async (request, response) => {
  try {
    const cursor =
      typeof request.query.cursor === "string" ? request.query.cursor : undefined;
    const videos = await loadVideoPage(cursor);
    response.json(videos);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown Cloudinary error";

    response.status(500).json({
      message,
      items: [],
      nextCursor: null,
      fetchedAt: new Date().toISOString(),
    });
  }
});

app.get("/api/admin-metadata", async (request, response) => {
  const folder = String(request.query.folder ?? "");

  if (folder !== "Carousel" && folder !== "Gallery") {
    response.status(400).json({ message: "Folder must be Carousel or Gallery." });
    return;
  }

  try {
    const metadata = await loadFolderMetadata(folder);
    response.json(metadata);
  } catch (error) {
    response.status(500).json({
      message:
        error instanceof Error ? error.message : "Unable to load metadata.",
    });
  }
});

app.post("/api/admin-auth", async (request, response) => {
  const adminKey = process.env.ADMIN_PANEL_KEY;

  if (!adminKey) {
    response.status(500).json({
      message: "ADMIN_PANEL_KEY is not configured on the server.",
    });
    return;
  }

  const password = String(request.body.password ?? "");
  const isValid = password === adminKey;

  response.status(isValid ? 200 : 401).json({
    success: isValid,
    message: isValid ? "Authenticated" : "Incorrect password.",
  });
});

app.post("/api/admin-metadata", async (request, response) => {
  const folder = String(request.query.folder ?? "");
  const adminKey = process.env.ADMIN_PANEL_KEY;

  if (folder !== "Carousel" && folder !== "Gallery") {
    response.status(400).json({ message: "Folder must be Carousel or Gallery." });
    return;
  }

  if (!adminKey || request.header("x-admin-key") !== adminKey) {
    response.status(401).json({
      message: "Unauthorized. Set ADMIN_PANEL_KEY and send it in x-admin-key.",
    });
    return;
  }

  try {
    const metadata = await saveFolderMetadata(folder, request.body.entries ?? {});
    response.json(metadata);
  } catch (error) {
    response.status(500).json({
      message:
        error instanceof Error ? error.message : "Unable to save metadata.",
    });
  }
});

app.listen(port, () => {
  console.log(`Cloudinary API listening on http://localhost:${port}`);
});
