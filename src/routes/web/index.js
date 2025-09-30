import { Router } from "express";
const router = Router();

router.get("/healthz", (req, res) => res.send("ok"));

export default router;
