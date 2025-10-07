/*
  Warnings:

  - You are about to drop the `ReviewAnnotation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."ReviewAnnotation" DROP CONSTRAINT "ReviewAnnotation_reviewId_fkey";

-- DropTable
DROP TABLE "public"."ReviewAnnotation";
