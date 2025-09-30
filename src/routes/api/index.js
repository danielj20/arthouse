import { Router } from "express";
import authRoutes from "./auth.js";
import submissionsRoutes from "./submissions.js";
import dropRoutes from "./drop.js";


const router = Router();

router.use("/auth", authRoutes);
router.use("/submissions", submissionsRoutes);
router.use("/drop", dropRoutes);


router.get("/health", (req, res) => res.json({ ok: true }));

export default router;