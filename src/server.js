import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import dotenv from "dotenv";
import apiRouter from "./routes/api/index.js";
import webRouter from "./routes/web/index.js";

import passport from "./config/passport.js";

dotenv.config();
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const CLIENT_DIR = path.join(__dirname, "../client");

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_ORIGIN || true, credentials: true }));
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());

app.set("trust proxy", 1);


app.use(passport.initialize());

// static site
app.use(express.static(CLIENT_DIR));

// api routes
app.use("/api", apiRouter);

// web routes (optional server-rendered helpers)
app.use("/", webRouter);

app.get("/submission/:id", (req, res) => {
  const filePath = path.join(CLIENT_DIR, "submission.html");
  res.sendFile(filePath);
});

app.get("/review/:id", (req, res) => {
  const filePath = path.join(CLIENT_DIR, "review.html");
  res.sendFile(filePath);
});

// fallback to index.html for simple pages
app.use((req, res, next) => {
  const p = path.join(CLIENT_DIR, "index.html");
  res.sendFile(p, (err) => (err ? next(err) : null));
});

app.listen(PORT, () => console.log(`arthouse server running on http://localhost:${PORT}`));
