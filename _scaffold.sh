#!/usr/bin/env bash
set -euo pipefail

# directories
mkdir -p {src/{routes/{api,web},controllers,middleware,config,utils},client/{css,js,images,fonts,judge},prisma,uploads,.vscode,scripts}

# gitignore
cat > .gitignore <<GIT
node_modules
.env
uploads/*
!.gitkeep
.prisma
.DS_Store
GIT

# env example
cat > .env.example <<ENV
# --- Required ---
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DBNAME?schema=public"
JWT_SECRET="change-me"
PORT=3000
NODE_ENV=development
# Optional (CORS)
CLIENT_ORIGIN="http://localhost:3000"
ENV

# package.json
cat > package.json <<PKG
{
  "name": "arthouse-app",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "engines": { "node": ">=20" },
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev --name init",
    "prisma:deploy": "prisma migrate deploy",
    "seed": "node scripts/seed.js"
  }
}
PKG

# prisma schema (bare-bones models we will flesh out)
cat > prisma/schema.prisma <<PRISMA
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }

enum Role { PARTICIPANT JUDGE ADMIN }
enum Category { MUSIC ART FICTION CINEMA POETRY }
enum Status { PENDING APPROVED REJECTED FEATURED }

model User {
  id        String  @id @default(cuid())
  email     String  @unique
  password  String
  role      Role    @default(PARTICIPANT)
  displayName String?
  age       Int?
  createdAt DateTime @default(now())
  comments  Comment[]
  applause  Applause[]
  feedback  Feedback[]
  submissions Submission[]
}

model Submission {
  id          String   @id @default(cuid())
  title       String
  slug        String   @unique
  category    Category
  description String?
  contentUrl  String?     // where the file lives (local dev or S3 later)
  wordCount   Int?
  durationSec Int?
  status      Status   @default(PENDING)
  author      User     @relation(fields: [authorId], references: [id])
  authorId    String
  createdAt   DateTime @default(now())
  comments    Comment[]
  applause    Applause[]
  feedback    Feedback[]
  featuredIn  Featured[]
}

model Comment {
  id           String   @id @default(cuid())
  body         String
  submission   Submission @relation(fields: [submissionId], references: [id])
  submissionId String
  author       User      @relation(fields: [authorId], references: [id])
  authorId     String
  createdAt    DateTime  @default(now())
}

model Applause {
  id           String   @id @default(cuid())
  submission   Submission @relation(fields: [submissionId], references: [id])
  submissionId String
  user         User      @relation(fields: [userId], references: [id])
  userId       String
  createdAt    DateTime  @default(now())
  @@unique([submissionId, userId]) // 1 applause per user per submission
}

model Feedback {
  id           String   @id @default(cuid())
  submission   Submission @relation(fields: [submissionId], references: [id])
  submissionId String
  judge        User      @relation(fields: [judgeId], references: [id])
  judgeId      String
  // simple scoring buckets, 1-10
  originality  Int
  craft        Int
  impact       Int
  cohesion     Int
  comment      String?
  createdAt    DateTime  @default(now())
  @@unique([submissionId, judgeId]) // each judge scores once
}

model WeekDrop {
  id        String   @id @default(cuid())
  startsAt  DateTime
  endsAt    DateTime
  featured  Featured[]
}

model Featured {
  id           String   @id @default(cuid())
  submission   Submission @relation(fields: [submissionId], references: [id])
  submissionId String
  weekDrop     WeekDrop   @relation(fields: [weekDropId], references: [id])
  weekDropId   String
  rank         Int        // 1,2,3 within category
}
PRISMA

# basic server
cat > src/server.js <<SRV
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

// static site
app.use(express.static(CLIENT_DIR));

// api routes
app.use("/api", apiRouter);

// web routes (optional server-rendered helpers)
app.use("/", webRouter);

// fallback to index.html for simple pages
app.get("*", (req, res, next) => {
  const p = path.join(CLIENT_DIR, "index.html");
  res.sendFile(p, (err) => (err ? next() : null));
});

app.listen(PORT, () => console.log(\`arthouse server running on http://localhost:\${PORT}\`));
SRV

# routers (placeholders)
cat > src/routes/api/index.js <<API
import { Router } from "express";
const router = Router();

// TODO: wire sub-routers
router.get("/health", (req, res) => res.json({ ok: true }));

export default router;
API

cat > src/routes/web/index.js <<WEB
import { Router } from "express";
const router = Router();

router.get("/healthz", (req, res) => res.send("ok"));

export default router;
WEB

# middleware placeholders
cat > src/middleware/auth.js <<MID
export function requireAuth(req, res, next) {
  // TODO: verify JWT and set req.user
  return next();
}
MID

cat > src/middleware/error.js <<ERR
export function errorHandler(err, req, res, next) {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Server error" });
}
ERR

# config
cat > src/config/db.js <<DB
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export default prisma;
DB

cat > src/config/env.js <<ENVJS
export const config = {
  port: process.env.PORT || 3000,
  jwt: process.env.JWT_SECRET || "change-me",
  clientOrigin: process.env.CLIENT_ORIGIN || "*"
};
ENVJS

# utils placeholder
cat > src/utils/validators.js <<UTIL
// Add zod schemas later for submissions, auth, feedback, comments
export {};
UTIL

# simple client (placeholder)
cat > client/index.html <<HTML
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>arthouse</title>
  <link rel="stylesheet" href="/css/globals.css">
  <script defer src="/js/main.js"></script>
</head>
<body>
  <header class="nav">
    <a href="/" class="brand">arthouse.</a>
    <nav>
      <a href="/this-week.html">this week</a>
      <a href="/submit.html">submit</a>
      <a href="/archive.html">the archive</a>
      <a href="/about.html">about us</a>
    </nav>
  </header>
  <main class="container">
    <h1 class="handwritten">This is a website for the next generation of creatives.</h1>
    <p><a class="cta" href="/this-week.html">View this week’s drop →</a></p>
    <p><a class="link" href="/submit.html">Submit your Work</a></p>
  </main>
</body>
</html>
HTML

cat > client/submit.html <<HTML
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Submit — arthouse</title>
  <link rel="stylesheet" href="/css/globals.css">
</head>
<body>
  <header class="nav"><a href="/" class="brand">arthouse.</a></header>
  <main class="container">
    <h1>Submissions.</h1>
    <p class="sub">general guidelines</p>
    <ul class="rules">
      <li>Stories ≤ 3000 words</li>
      <li>Films ≤ 10 min</li>
      <li>Poems ≤ 10 stanzas</li>
      <li>Music ≤ 6 min</li>
      <li>Art: upload a true digital file (not a photo of a physical piece)</li>
    </ul>
  </main>
</body>
</html>
HTML

for page in about archive this-week; do
cat > client/${page}.html <<HTML
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${page} — arthouse</title>
  <link rel="stylesheet" href="/css/globals.css">
</head>
<body>
  <header class="nav"><a href="/" class="brand">arthouse.</a></header>
  <main class="container">
    <h1>${page}</h1>
  </main>
</body>
</html>
HTML
done

# judge portal placeholder (hidden link later)
cat > client/judge/index.html <<HTML
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Judge — arthouse</title>
  <link rel="stylesheet" href="/css/globals.css">
</head>
<body>
  <main class="container">
    <h1>Judge Console</h1>
    <p>Private area for scoring and feedback.</p>
  </main>
</body>
</html>
HTML

# basic styles (font stack per spec; MANIC.otf can be dropped in client/fonts later)
cat > client/css/globals.css <<CSS
:root{
  --bg:#f8f7f3;
  --text:#0b0b0b;
  --accent:#000;
  --kern:-0.05em; /* -5% tracking */
}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:var(--bg);color:var(--text);font-family:"Helvetica Neue","Helvetica",system-ui,-apple-system,Arial,sans-serif;letter-spacing:var(--kern)}
a{color:inherit;text-decoration:underline}
.container{max-width:1100px;margin:6rem auto;padding:0 1.25rem}
.nav{display:flex;justify-content:space-between;align-items:center;padding:1.25rem 1.25rem 0 1.25rem}
.brand{font-weight:700;font-size:2rem;text-decoration:none}
h1{font-weight:700;font-size:2rem;margin:1rem 0}
.sub{font-weight:300;font-size:1.5rem}
.handwritten{font-family:"MANIC","Helvetica Neue","Helvetica",Arial,sans-serif}
.cta{display:inline-block;background:#000;color:#fff;padding:.75rem 1rem;border-radius:999px;text-decoration:none}
.rules{line-height:1.9}
@font-face{
  font-family:"MANIC";
  src:url("/fonts/MANIC.otf") format("opentype");
  font-display:swap;
}
CSS

# basic js
cat > client/js/main.js <<JS
console.log("arthouse client loaded");
JS

# seed & helper scripts
cat > scripts/seed.js <<SEED
// placeholder: will insert demo data later with Prisma
console.log("seed stub");
SEED

# keep uploads folder in repo
touch uploads/.gitkeep

# vscode suggestions (optional)
cat > .vscode/settings.json <<VSC
{
  "editor.formatOnSave": true
}
VSC

echo "Scaffold complete."
