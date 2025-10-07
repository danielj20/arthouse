// api/judge.js — updated for Review + ReviewAnnotation schema
// Compatible with the new judge/index.html flow (overall TEXT/AUDIO/VIDEO + optional per-spot notes)
// :contentReference[oaicite:0]{index=0}

import { Router } from "express";
import prisma from "../../config/db.js";
import { requireRole } from "../../middleware/auth.js";

const router = Router();

/**
 * Helpers
 */
function isIntInRange(n, min, max) {
  const x = Number(n);
  return Number.isInteger(x) && x >= min && x <= max;
}

function computeComposite({ voice, craft, clarity, affect }) {
  // Equal weights; adjust in code later if you want per-category weights.
  const avg = (voice + craft + clarity + affect) / 4;
  return Number(avg.toFixed(1)); // XX.X
}

/**
 * GET /api/judge/next
 * Returns the next PENDING submission this judge hasn't reviewed.
 * Optional query:
 *   - category=ART|MUSIC|FICTION|CINEMA|POETRY
 *   - after=<submissionId> : continue after a specific id
 */
router.get("/next", requireRole("JUDGE", "ADMIN"), async (req, res) => {
  try {
    const judgeId = req.user.id;
    const { category, after } = req.query;

    // Submissions already reviewed by this judge
    const reviewed = await prisma.review.findMany({
      where: { judgeId },
      select: { submissionId: true },
    });
    const reviewedIds = new Set(reviewed.map((r) => r.submissionId));

    const where = {
      status: "PENDING",
      ...(category ? { category } : {}),
    };

    const page = await prisma.submission.findMany({
      where,
      orderBy: { createdAt: "asc" },
      take: 50,
      include: { author: true },
    });

    // Filter out already-reviewed
    let filtered = page.filter((s) => !reviewedIds.has(s.id));

    // If "after" is provided, slice to items occurring after that id
    if (after) {
      const idx = filtered.findIndex((s) => s.id === after);
      filtered = idx >= 0 ? filtered.slice(idx + 1) : filtered;
    }

    const next = filtered[0];
    if (!next) return res.status(404).json({ error: "No more pending items" });

    res.json({
      submission: {
        id: next.id,
        title: next.title,
        category: next.category,
        description: next.description,
        contentUrl: next.contentUrl,
        createdAt: next.createdAt,
        author: {
          id: next.author.id,
          name: next.author.displayName || next.author.email || "Anonymous",
        },
      },
    });
  } catch (err) {
    console.error("GET /api/judge/next error:", err);
    res.status(500).json({ error: "Failed to fetch next submission" });
  }
});

/**
 * POST /api/judge/reviews
 * Create or update a Review for a submission by the current judge.
 * Body:
 * {
 *   submissionId: string,
 *   overall: { type: "TEXT"|"AUDIO"|"VIDEO", text?:string, mediaUrl?:string, mediaSec?:number },
 *   rubrics: { voice:1..100, craft:1..100, clarity:1..100, affect:1..100 }
 * }
 * Returns: { reviewId, composite }
 */
router.post("/reviews", requireRole("JUDGE", "ADMIN"), async (req, res) => {
  try {
    const judgeId = req.user.id;
    const { submissionId, overall, rubrics } = req.body || {};

    if (!submissionId) {
      return res.status(400).json({ error: "submissionId is required" });
    }

    // Validate overall response
    const oType = overall?.type;
    if (!["TEXT", "AUDIO", "VIDEO"].includes(oType)) {
      return res.status(400).json({ error: "overall.type must be TEXT, AUDIO, or VIDEO" });
    }

    let overallData = { overallType: oType, overallText: null, overallMediaUrl: null, overallMediaSec: null };
    if (oType === "TEXT") {
      const t = String(overall?.text || "").trim();
      if (t.length < 10) return res.status(400).json({ error: "overall.text must be at least 10 characters" });
      overallData.overallText = t;
    } else {
      const url = String(overall?.mediaUrl || "").trim();
      if (!url) return res.status(400).json({ error: "overall.mediaUrl is required for AUDIO/VIDEO" });
      const sec = overall?.mediaSec != null ? Number(overall.mediaSec) : null;
      overallData.overallMediaUrl = url;
      overallData.overallMediaSec = Number.isFinite(sec) ? Math.max(0, Math.floor(sec)) : null;
    }

    // Validate rubrics (1..100 ints)
    const voice = Number(rubrics?.voice);
    const craft = Number(rubrics?.craft);
    const clarity = Number(rubrics?.clarity);
    const affect = Number(rubrics?.affect);

    if (
      !isIntInRange(voice, 1, 100) ||
      !isIntInRange(craft, 1, 100) ||
      !isIntInRange(clarity, 1, 100) ||
      !isIntInRange(affect, 1, 100)
    ) {
      return res.status(400).json({ error: "All rubrics must be integers 1–100" });
    }

    const composite = computeComposite({ voice, craft, clarity, affect });

    // Upsert review (one per judge per submission)
    const review = await prisma.review.upsert({
      where: { submissionId_judgeId: { submissionId, judgeId } },
      create: {
        submissionId,
        judgeId,
        ...overallData,
        voice,
        craft,
        clarity,
        affect,
        composite,
      },
      update: {
        ...overallData,
        voice,
        craft,
        clarity,
        affect,
        composite,
      },
      select: { id: true },
    });

    // Mark submission as REVIEWED
    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: "REVIEWED" },
    });

    res.json({ reviewId: review.id, composite });
  } catch (err) {
    console.error("POST /api/judge/reviews error:", err);
    res.status(500).json({ error: "Could not save review" });
  }
});

/**
 * POST /api/judge/reviews/:reviewId/annotations
 * Add an optional per-spot note (text/audio/video) anchored to an image pin, time point/range, or text span.
 * Body:
 * {
 *   kind: "IMAGE_PIN"|"TIME_POINT"|"TIME_RANGE"|"TEXT_SPAN",
 *   anchor: { x?, y?, startSec?, endSec?, startChar?, endChar? },
 *   response: { type:"TEXT"|"AUDIO"|"VIDEO", text?, mediaUrl?, mediaSec? }
 * }
 */
router.post("/reviews/:reviewId/annotations", requireRole("JUDGE", "ADMIN"), async (req, res) => {
  try {
    const judgeId = req.user.id;
    const { reviewId } = req.params;
    const { kind, anchor = {}, response = {} } = req.body || {};

    // Ensure the review belongs to the same judge (or judge is admin)
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { judgeId: true },
    });
    if (!review) return res.status(404).json({ error: "Review not found" });
    if (review.judgeId !== judgeId) {
      return res.status(403).json({ error: "Forbidden: cannot add annotations to other judges' reviews" });
    }

    if (!["IMAGE_PIN", "TIME_POINT", "TIME_RANGE", "TEXT_SPAN"].includes(kind)) {
      return res.status(400).json({ error: "Invalid annotation kind" });
    }

    // Validate anchor by kind
    let anchorData = {};
    if (kind === "IMAGE_PIN") {
      const x = Number(anchor.x), y = Number(anchor.y);
      if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 1 || y < 0 || y > 1) {
        return res.status(400).json({ error: "IMAGE_PIN requires x,y in [0..1]" });
      }
      anchorData = { x, y };
    } else if (kind === "TIME_POINT") {
      const s = Number(anchor.startSec);
      if (!Number.isInteger(s) || s < 0) return res.status(400).json({ error: "TIME_POINT requires startSec >= 0" });
      anchorData = { startSec: s };
    } else if (kind === "TIME_RANGE") {
      const s = Number(anchor.startSec), e = Number(anchor.endSec);
      if (!Number.isInteger(s) || !Number.isInteger(e) || s < 0 || e < s) {
        return res.status(400).json({ error: "TIME_RANGE requires startSec >= 0 and endSec >= startSec" });
      }
      anchorData = { startSec: s, endSec: e };
    } else if (kind === "TEXT_SPAN") {
      const s = Number(anchor.startChar), e = Number(anchor.endChar);
      if (!Number.isInteger(s) || !Number.isInteger(e) || s < 0 || e <= s) {
        return res.status(400).json({ error: "TEXT_SPAN requires startChar >= 0 and endChar > startChar" });
      }
      anchorData = { startChar: s, endChar: e };
    }

    // Validate response
    const rType = response?.type;
    if (!["TEXT", "AUDIO", "VIDEO"].includes(rType)) {
      return res.status(400).json({ error: "response.type must be TEXT, AUDIO, or VIDEO" });
    }

    let respData = { responseType: rType, responseText: null, responseMediaUrl: null, responseMediaSec: null };
    if (rType === "TEXT") {
      const t = String(response?.text || "").trim();
      if (t.length < 5) return res.status(400).json({ error: "response.text must be at least 5 characters" });
      respData.responseText = t;
    } else {
      const url = String(response?.mediaUrl || "").trim();
      if (!url) return res.status(400).json({ error: "response.mediaUrl is required for AUDIO/VIDEO" });
      const sec = response?.mediaSec != null ? Number(response.mediaSec) : null;
      respData.responseMediaUrl = url;
      respData.responseMediaSec = Number.isFinite(sec) ? Math.max(0, Math.floor(sec)) : null;
    }

    const created = await prisma.reviewAnnotation.create({
      data: {
        reviewId,
        kind,
        ...anchorData,
        ...respData,
      },
      select: { id: true },
    });

    res.json({ ok: true, id: created.id });
  } catch (err) {
    console.error("POST /api/judge/reviews/:reviewId/annotations error:", err);
    res.status(500).json({ error: "Could not save annotation" });
  }
});

/**
 * Optional: Fetch a submission by id (used for replays/inspections)
 */
router.get("/submission/:id", requireRole("JUDGE", "ADMIN"), async (req, res) => {
  try {
    const s = await prisma.submission.findUnique({
      where: { id: req.params.id },
      include: { author: true },
    });
    if (!s) return res.status(404).json({ error: "Not found" });

    res.json({
      id: s.id,
      title: s.title,
      category: s.category,
      description: s.description,
      contentUrl: s.contentUrl,
      createdAt: s.createdAt,
      author: {
        id: s.author.id,
        name: s.author.displayName || s.author.email || "Anonymous",
      },
      status: s.status,
    });
  } catch (err) {
    console.error("GET /api/judge/submission/:id error:", err);
    res.status(500).json({ error: "Failed to load submission" });
  }
});

export default router;
