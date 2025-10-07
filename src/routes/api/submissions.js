import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../../middleware/auth.js";
import { attachUserIfPresent } from "../../middleware/auth.js";

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

router.get("/pending", async (req, res) => {
  try {
    const submissions = await prisma.submission.findMany({
      where: { status: "PENDING" },
      include: { author: true },
      orderBy: { createdAt: "desc" },
    });

    // map into a cleaner shape
    const formatted = await Promise.all(
      submissions.map(async (s) => {
        let snippet = null;

        if ((s.category === "FICTION" || s.category === "POETRY") && s.contentUrl) {
          try {
            const resp = await fetch(s.contentUrl);
            const text = await resp.text();
            snippet = text.slice(0, 600); // ~600 chars ≈ 80–100 words
          } catch {
            snippet = null;
          }
        }

        return {
          id: s.id,
          title: s.title,
          category: s.category,
          contentUrl: s.contentUrl,
          description: s.description,
          createdAt: s.createdAt,
          authorName: s.author.displayName || s.author.email || "Anonymous",
          snippet,
        };
      })
    );

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load submissions" });
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

router.get("/:id", attachUserIfPresent, async (req, res) => {
  const s = await prisma.submission.findUnique({
    where: { id: req.params.id },
    include: {
      author: true,
      comments: { include: { author: true }, orderBy: { createdAt: "asc" } },
      applause: true,
      reviews: true,
    },
  });
  if (!s) return res.status(404).json({ error: "Not found" });

  const applauseCount = s.applause.length;
  const hasApplauded = !!(req.user && s.applause.some(a => a.userId === req.user.id));

  res.json({
    id: s.id,
    title: s.title,
    slug: s.slug,
    category: s.category,
    status: s.status,
    description: s.description,
    contentUrl: s.contentUrl,
    wordCount: s.wordCount,
    durationSec: s.durationSec,
    artistBio: s.artistBio,
    createdAt: s.createdAt,
    author: {
      id: s.author.id,
      displayName: s.author.displayName,
      email: s.author.email,
    },
    applauseCount,
    hasApplauded, // 👈 add this
    comments: s.comments.map(c => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt,
      authorName: c.author.displayName || c.author.email || "Anonymous",
    })),
  });
});



// ===== Comment on a submission =====
router.post("/:id/comment", requireAuth, async (req, res) => {
  try {
    const content = (req.body?.content || "").trim();
    if (!content) return res.status(400).json({ error: "Comment cannot be empty." });

    const sub = await prisma.submission.findUnique({ where: { id: req.params.id } });
    if (!sub) return res.status(404).json({ error: "Submission not found." });

    const comment = await prisma.comment.create({
      data: {
        content,                 // <-- required field in your schema
        submissionId: sub.id,
        authorId: req.user.id,
      },
      include: { author: true },
    });

    res.json({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      authorName: comment.author.displayName || comment.author.email || "Anonymous",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to post comment." });
  }
});


// ===== Applaud / toggle applause =====
router.post("/:id/applaud", requireAuth, async (req, res) => {
  try {
    const sub = await prisma.submission.findUnique({ where: { id: req.params.id } });
    if (!sub) return res.status(404).json({ error: "Submission not found." });

    // Toggle using your @@unique([submissionId, userId]) constraint
    const existing = await prisma.applause.findFirst({
      where: { submissionId: sub.id, userId: req.user.id },
    });

    if (existing) {
      await prisma.applause.delete({ where: { id: existing.id } });
    } else {
      await prisma.applause.create({
        data: { submissionId: sub.id, userId: req.user.id },
      });
    }

    const applauseCount = await prisma.applause.count({
  where: { submissionId: sub.id },
});
const hasApplauded = !existing; // true if they just added applause

res.json({ applauseCount, hasApplauded });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to toggle applause." });
  }
});
router.get("/review/:id", async (req, res) => {
  try {
    const review = await prisma.review.findFirst({
      where: { submissionId: req.params.id },
      include: {
        submission: { select: { title: true, category: true } },
        judge: { select: { displayName: true, email: true } },
      },
    });

    if (!review) return res.status(404).json({ error: "Review not found" });

    res.json({
      id: review.id,
      submissionTitle: review.submission.title,
      submissionCategory: review.submission.category,
      judgeName: review.judge.displayName || review.judge.email,
      overallType: review.overallType,
      overallText: review.overallText,
      overallMediaUrl: review.overallMediaUrl,
      overallMediaSec: review.overallMediaSec,
      voice: review.voice,
      craft: review.craft,
      clarity: review.clarity,
      affect: review.affect,
      composite: review.composite,
      createdAt: review.createdAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load review" });
  }
});



export default router;
