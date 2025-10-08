import { Router } from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import prisma from "../../config/db.js";
import { requireAuth } from "../../middleware/auth.js";

dotenv.config();
const router = Router();

function issueToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email, displayName: user.displayName },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// Start Google OAuth (STATELess)
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

// Google OAuth callback (STATELess)
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/auth/failure.html",
    session: false,
  }),
  (req, res) => {
    const token = issueToken(req.user);
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    if (req.user.isNew) {
      res.redirect("/auth/success.html");
    } else {
      res.redirect("/dashboard.html");
    }
  }
);

// Real auth check using JWT cookie
 router.get("/check", (req, res) => {
   try {
     const token = req.cookies?.token;
     if (!token) return res.status(401).json({ ok: false });
     const decoded = jwt.verify(token, process.env.JWT_SECRET);
     return res.json({ ok: true, user: decoded });
   } catch {
     return res.status(401).json({ ok: false });
   }
 });
router.post("/signup", async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    // check if exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.redirect("/auth/signup.html?error=Email+already+registered");
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, password: hashed, displayName, role: "PARTICIPANT" },
    });

    // issue JWT + cookie
    const token = jwt.sign(
      { id: user.id, email: user.email, displayName: user.displayName, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
});
    return res.redirect("/dashboard.html");
  } catch (err) {
    console.error(err);
    res.redirect("/auth/signup.html?error=Signup+failed");
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, email: user.email, displayName: user.displayName, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
});
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});


router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  res.json({ ok: true });
});

export default router;