-- CreateEnum
CREATE TYPE "GroupPingSetting" AS ENUM ('BOT', 'MODERATOR', 'OFF', 'MEMBER');

-- AlterTable
ALTER TABLE "user_group" ADD COLUMN     "groupPingSetting" "GroupPingSetting" NOT NULL DEFAULT E'MEMBER';
