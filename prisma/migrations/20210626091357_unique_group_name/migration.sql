/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `user_group` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "user_group.name_unique" ON "user_group"("name");
