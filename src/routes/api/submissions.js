import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../../middleware/auth.js";
import { uploadFileToS3 } from "../../config/s3.js";
import prisma from "../../config/db.js";
import path from "path";
import mammoth from "mammoth";
import ffmpeg from "fluent-ffmpeg";
import ffprobeStatic from "ffprobe-static";
import fs from "fs";


ffmpeg.setFfprobePath(ffprobeStatic.path);

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const ALLOWED_TYPES = {
  art: ["image/png", "image/jpeg", "image/jpg"],
  cinema: ["video/mp4", "video/quicktime", "video/webm"],
  fiction: ["text/plain"],
  music: ["audio/mpeg", "audio/wav", "audio/flac"],
  poetry: ["text/plain"],
};

// --- helpers ---
function countWords(text) {
  return text.trim().split(/\s+/).length;
}

async function getWordCount(file) {
  if (file.mimetype === "text/plain") {
    return countWords(file.buffer.toString("utf-8"));
  }
  if (
    file.mimetype === "application/msword" ||
    file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return countWords(result.value);
  }
  return 0;
}

async function getDurationSec(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration);
    });
  });
}

// --- route ---
router.post("/:category", requireAuth, upload.single("file"), async (req, res) => {
  try {
    const { category } = req.params;
    const validTypes = ALLOWED_TYPES[category];
    if (!validTypes) return res.redirect("/submit/failure.html?reason=Unknown+category");

    if (!req.file || !validTypes.includes(req.file.mimetype)) {
      return res.redirect("/submit/failure.html?reason=Invalid+file+type");
    }

    const { title, description, artistBio } = req.body;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    // --- validation per category ---
    if (category === "fiction" || category === "poetry") {
      const wordCount = await getWordCount(req.file);
      if (category === "fiction" && wordCount > 3000) {
        return res.redirect("/submit/failure.html?reason=Fiction+must+be+≤+3000+words");
      }
      if (category === "poetry" && wordCount > 400) {
        return res.redirect("/submit/failure.html?reason=Poetry+must+be+≤+400+words");
      }
    }

    if (category === "music" || category === "cinema") {
      // Save file temporarily to disk for ffprobe
      const tmpPath = `/tmp/${Date.now()}-${req.file.originalname}`;
      await fs.promises.writeFile(tmpPath, req.file.buffer);
      const duration = await getDurationSec(tmpPath);
      await fs.promises.unlink(tmpPath);

      if (category === "music" && duration > 360) {
        return res.redirect("/submit/failure.html?reason=Music+must+be+≤+6+minutes");
      }
      if (category === "cinema" && duration > 600) {
        return res.redirect("/submit/failure.html?reason=Cinema+must+be+≤+10+minutes");
      }
    }

    // --- Upload to S3 ---
    const fileName = `${category}/${slug}-${Date.now()}${path.extname(req.file.originalname)}`;
    const fileUrl = await uploadFileToS3(req.file.buffer, fileName, req.file.mimetype);

    // --- Save to Postgres ---
    await prisma.submission.create({
      data: {
        title,
        slug,
        category: category.toUpperCase(),
        description,
        artistBio,
        contentUrl: fileUrl,
        authorId: req.user.id,
      },
    });

    res.redirect("/submit/success.html");
  } catch (err) {
    console.error(err);
    res.redirect("/submit/failure.html?reason=Server+error");
  }
});

router.get("/mine", requireAuth, async (req, res) => {
  try {
    const submissions = await prisma.submission.findMany({
      where: { authorId: req.user.id },
      orderBy: { createdAt: "desc" },
    });
    res.json(submissions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});


export default router;
