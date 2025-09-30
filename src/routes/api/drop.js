import express from "express";
import prisma from "../../config/db.js";

const router = express.Router();

// get the most recent active weekDrop
router.get("/current", async (req, res) => {
  try {
    const now = new Date();

    const drops = await prisma.weekDrop.findMany({
      orderBy: { startsAt: "asc" },
      include: { featured: { include: { submission: true } } },
    });

    if (!drops.length) return res.status(404).json({ error: "No drops yet" });

    // The most recent active one
    const current = drops.find(
      (d) => new Date(d.startsAt) <= now && new Date(d.endsAt) >= now
    ) || drops[drops.length - 1]; // fallback: last drop

    // attach sequential number
    const dropNumber = drops.findIndex((d) => d.id === current.id) + 1;

    res.json({ ...current, dropNumber });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load drop" });
  }
});

export default router;
