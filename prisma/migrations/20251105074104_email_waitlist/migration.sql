/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `waiting_list` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "waiting_list" ALTER COLUMN "name" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "waiting_list_email_key" ON "waiting_list"("email");
