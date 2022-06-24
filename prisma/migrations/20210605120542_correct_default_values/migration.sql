-- AlterTable
ALTER TABLE "deadchat_question" ALTER COLUMN "last_used" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "topic" ALTER COLUMN "created" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "user_group" ALTER COLUMN "last_used" SET DEFAULT '1969-12-31 23:00:00'::timestamp without time zone;
