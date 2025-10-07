// src/routes/api/review-uploads.js
import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import ffprobeStatic from "ffprobe-static";

import { requireRole } from "../../middleware/auth.js";
import { uploadFileToS3 } from "../../config/s3.js";

ffmpeg.setFfprobePath(ffprobeStatic.path);

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } }); // 25MB

// Allowed reviewer media
const ALLOWED_BASE = new Set([
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/webm",
  "video/webm",
  "video/mp4",
]);

// Lightweight duration probe (same pattern as your submissions route)
function getDurationSecFromPath(tmpPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(tmpPath, (err, meta) => {
      if (err) return reject(err);
      resolve(Math.round(meta?.format?.duration || 0));
    });
  });
}

/**
 * POST /api/reviews/upload
 * Body: multipart/form-data  ->  field: file
 * Optional fields (form fields):
 *   - scope: "overall" | "annotation" (for key naming only)
 *   - submissionId: string (for key naming only)
 *
 * Returns: { url, durationSec? }
 */
router.post("/upload", requireRole("JUDGE", "ADMIN"), upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file" });
    const raw = req.file.mimetype || "";
    const baseMime = raw.split(";")[0].toLowerCase(); // strip ";codecs=..."
    if (!ALLOWED_BASE.has(baseMime)) {
      return res.status(400).json({ error: "Unsupported media type" });
    }

    const { scope = "overall", submissionId = "unknown" } = req.body || {};
    const ext = guessExt(baseMime);
     const safeScope = /^(overall|annotation)$/i.test(scope) ? scope.toLowerCase() : "overall";
     const key = `reviews/${submissionId}/${safeScope}-${Date.now()}${ext}`;

    // Optionally probe duration if audio/video (write to tmp, probe, delete)
    let durationSec = null;
    if (req.file.mimetype.startsWith("audio/") || req.file.mimetype.startsWith("video/")) {
      const tmpPath = `/tmp/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
      await fs.promises.writeFile(tmpPath, req.file.buffer);
      try {
        durationSec = await getDurationSecFromPath(tmpPath); // same pattern as your submissions.js helper :contentReference[oaicite:4]{index=4}
      } catch {
        durationSec = null;
      } finally {
        try { await fs.promises.unlink(tmpPath); } catch {}
      }
    }

    // Upload original blob to S3 using your helper (same as submissions route) :contentReference[oaicite:5]{index=5}
    const url = await uploadFileToS3(req.file.buffer, key, baseMime);

    res.json({ url, durationSec });
  } catch (err) {
    console.error("review upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

function guessExt(mime) {
  if (mime === "audio/mpeg") return ".mp3";
  if (mime === "audio/mp4") return ".m4a";
  if (mime === "audio/wav") return ".wav";
  if (mime === "audio/webm") return ".webm";
  if (mime === "video/webm") return ".webm";
  if (mime === "video/mp4") return ".mp4";
  return "";
}

export default router;
