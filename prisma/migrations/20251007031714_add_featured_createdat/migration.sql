/*
  Warnings:

  - You are about to drop the column `body` on the `Comment` table. All the data in the column will be lost.
  - The `status` column on the `Submission` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Feedback` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `content` to the `Comment` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."SubmissionStatus" AS ENUM ('PENDING', 'REVIEWED', 'FEATURED');

-- CreateEnum
CREATE TYPE "public"."ReviewResponseType" AS ENUM ('TEXT', 'AUDIO', 'VIDEO');

-- CreateEnum
CREATE TYPE "public"."AnnotationKind" AS ENUM ('IMAGE_PIN', 'TIME_POINT', 'TIME_RANGE', 'TEXT_SPAN');

-- DropForeignKey
ALTER TABLE "public"."Feedback" DROP CONSTRAINT "Feedback_judgeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Feedback" DROP CONSTRAINT "Feedback_submissionId_fkey";

-- AlterTable
ALTER TABLE "public"."Comment" DROP COLUMN "body",
ADD COLUMN     "content" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Featured" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."Submission" DROP COLUMN "status",
ADD COLUMN     "status" "public"."SubmissionStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "public"."User" ALTER COLUMN "password" DROP NOT NULL;

-- DropTable
DROP TABLE "public"."Feedback";

-- DropEnum
DROP TYPE "public"."Status";

-- CreateTable
CREATE TABLE "public"."Review" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "judgeId" TEXT NOT NULL,
    "overallType" "public"."ReviewResponseType" NOT NULL,
    "overallText" TEXT,
    "overallMediaUrl" TEXT,
    "overallMediaSec" INTEGER,
    "voice" INTEGER NOT NULL,
    "craft" INTEGER NOT NULL,
    "clarity" INTEGER NOT NULL,
    "affect" INTEGER NOT NULL,
    "composite" DECIMAL(5,1),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReviewAnnotation" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "kind" "public"."AnnotationKind" NOT NULL,
    "x" DOUBLE PRECISION,
    "y" DOUBLE PRECISION,
    "startSec" INTEGER,
    "endSec" INTEGER,
    "startChar" INTEGER,
    "endChar" INTEGER,
    "responseType" "public"."ReviewResponseType" NOT NULL,
    "responseText" TEXT,
    "responseMediaUrl" TEXT,
    "responseMediaSec" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewAnnotation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Review_submissionId_idx" ON "public"."Review"("submissionId");

-- CreateIndex
CREATE INDEX "Review_judgeId_idx" ON "public"."Review"("judgeId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_submissionId_judgeId_key" ON "public"."Review"("submissionId", "judgeId");

-- CreateIndex
CREATE INDEX "ReviewAnnotation_reviewId_idx" ON "public"."ReviewAnnotation"("reviewId");

-- CreateIndex
CREATE INDEX "Featured_weekDropId_idx" ON "public"."Featured"("weekDropId");

-- CreateIndex
CREATE INDEX "Featured_submissionId_idx" ON "public"."Featured"("submissionId");

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "public"."Submission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_judgeId_fkey" FOREIGN KEY ("judgeId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReviewAnnotation" ADD CONSTRAINT "ReviewAnnotation_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "public"."Review"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
