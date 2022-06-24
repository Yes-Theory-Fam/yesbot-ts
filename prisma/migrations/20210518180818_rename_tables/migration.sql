-- CreateTable
CREATE TABLE "birthday" (
    "userid" TEXT NOT NULL,
    "birthdate" TIMESTAMPTZ(6) NOT NULL,
    "timezone" TEXT,

    PRIMARY KEY ("userid")
);

-- CreateTable
CREATE TABLE "buddy_project_entry" (
    "user_id" TEXT NOT NULL,
    "matched" BOOLEAN NOT NULL,
    "discord_user" BOOLEAN NOT NULL,
    "buddy_id" TEXT,
    "matched_date" TIMESTAMPTZ(6),
    "reported_ghost_date" TIMESTAMPTZ(6),

    PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "channel_toggle" (
    "id" SERIAL NOT NULL,
    "channel" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "messageId" VARCHAR,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_challenge" (
    "id" SERIAL NOT NULL,
    "result" VARCHAR NOT NULL,
    "last_used" TIMESTAMP(6) NOT NULL DEFAULT '1969-12-31 23:00:00'::timestamp without time zone,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deadchat_question" (
    "id" SERIAL NOT NULL,
    "question" VARCHAR NOT NULL,
    "last_used" TIMESTAMP(6) NOT NULL DEFAULT '2021-05-18 15:22:29.5'::timestamp without time zone,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_member" (
    "id" VARCHAR NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message" (
    "id" VARCHAR NOT NULL,
    "channel" TEXT,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reaction_role" (
    "id" SERIAL NOT NULL,
    "message_id" VARCHAR NOT NULL,
    "channel_id" VARCHAR NOT NULL,
    "reaction" VARCHAR NOT NULL,
    "role_id" VARCHAR NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "someone_user" (
    "id" VARCHAR NOT NULL,
    "time" TIMESTAMPTZ(6) NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topic" (
    "id" SERIAL NOT NULL,
    "topic" VARCHAR NOT NULL,
    "channel" VARCHAR NOT NULL,
    "created" TIMESTAMP(6) NOT NULL DEFAULT '2021-05-18 15:22:33.654'::timestamp without time zone,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_group" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "last_used" TIMESTAMP(6) NOT NULL DEFAULT ('2021-05-18 17:22:42.549871'::timestamp without time zone - '01:00:00'::interval),
    "cooldown" INTEGER NOT NULL DEFAULT 60,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_group_members_group_member" (
    "userGroupId" INTEGER NOT NULL,
    "groupMemberId" VARCHAR NOT NULL,

    PRIMARY KEY ("userGroupId","groupMemberId")
);

-- CreateTable
CREATE TABLE "valentine" (
    "userId" VARCHAR NOT NULL,
    "start" TIMESTAMP(6),
    "end" TIMESTAMP(6),

    PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "voice_on_demand_mapping" (
    "user_id" VARCHAR NOT NULL,
    "channel_id" VARCHAR NOT NULL,
    "emoji" VARCHAR NOT NULL,

    PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IDX_886c4545692691c28e48cb964f" ON "channel_toggle"("emoji", "messageId");

-- CreateIndex
CREATE UNIQUE INDEX "IDX_9a7f4eb4ad5822073b7454344b" ON "reaction_role"("message_id", "channel_id", "reaction");

-- CreateIndex
CREATE INDEX "IDX_4d5a864456d00dafe30649263e" ON "user_group_members_group_member"("userGroupId");

-- CreateIndex
CREATE INDEX "IDX_b21e7c86a67e5a158ef88b530b" ON "user_group_members_group_member"("groupMemberId");

-- AddForeignKey
ALTER TABLE "channel_toggle" ADD FOREIGN KEY ("messageId") REFERENCES "message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_group_members_group_member" ADD FOREIGN KEY ("groupMemberId") REFERENCES "group_member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_group_members_group_member" ADD FOREIGN KEY ("userGroupId") REFERENCES "user_group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
