import fs from "fs";
import path from "path";
import prisma from "../src/config/db.js";
import { uploadFileToS3 } from "../src/config/s3.js";

async function main() {
  console.log("Seeding fakeDrop...");

  // 1. Create a WeekDrop
  const now = new Date();
  const endsAt = new Date(now);
  endsAt.setDate(endsAt.getDate() + 7);

  const weekDrop = await prisma.weekDrop.create({
    data: {
      startsAt: now,
      endsAt: endsAt,
    },
  });

  console.log("Created WeekDrop:", weekDrop.id);

  // 2. Helper to process each folder
  async function processCategory(category, dir) {
    const folder = path.join("fake_drop", dir);
    const files = fs.readdirSync(folder);

    let rank = 1;
    for (const file of files) {
      const filePath = path.join(folder, file);
      const buffer = fs.readFileSync(filePath);

      // Upload to S3
      const fileName = `${dir}/${file}`;
      const mimeType = getMimeType(file);
      const fileUrl = await uploadFileToS3(buffer, fileName, mimeType);

      // Create a fake author (or reuse existing one)
      let author = await prisma.user.findFirst({
        where: { email: "fakeauthor@example.com" },
      });
      if (!author) {
        author = await prisma.user.create({
          data: {
            email: "fakeauthor@example.com",
            password: "",
            displayName: "Fake Author",
            role: "PARTICIPANT",
          },
        });
      }

      // Create submission
      const submission = await prisma.submission.create({
        data: {
          title: `${dir.toUpperCase()} Example ${rank}`,
          slug: `${dir}-example-${rank}`,
          category: category,
          description: `Placeholder description for ${dir} ${rank}`,
          contentUrl: fileUrl,
          authorId: author.id,
          status: "FEATURED",
        },
      });

      // Add to Featured
      await prisma.featured.create({
        data: {
          submissionId: submission.id,
          weekDropId: weekDrop.id,
          rank: rank,
        },
      });

      console.log(`Seeded ${dir} #${rank}`);
      rank++;
    }
  }

  await processCategory("ART", "art");
  await processCategory("POETRY", "poetry");
  await processCategory("FICTION", "fiction");
  await processCategory("CINEMA", "cinema");
  await processCategory("MUSIC", "music");

  console.log("✅ fakeDrop seeded!");
}

function getMimeType(file) {
  if (file.endsWith(".png")) return "image/png";
  if (file.endsWith(".jpg") || file.endsWith(".jpeg")) return "image/jpeg";
  if (file.endsWith(".mp4")) return "video/mp4";
  if (file.endsWith(".mp3")) return "audio/mpeg";
  if (file.endsWith(".txt")) return "text/plain";
  return "application/octet-stream";
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
