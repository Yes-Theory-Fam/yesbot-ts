-- Create extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- CreateTable
CREATE TABLE "release" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "release_name" VARCHAR NOT NULL,
    "release_time" VARCHAR NOT NULL,
    "release_tag" VARCHAR NOT NULL,
    "created" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "release.release_time_index" ON "release"("release_time");
