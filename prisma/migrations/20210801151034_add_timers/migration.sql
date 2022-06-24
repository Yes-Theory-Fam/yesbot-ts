-- CreateTable
CREATE TABLE "timer" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "handlerIdentifier" VARCHAR NOT NULL,
    "executeTime" TIMESTAMP(6) NOT NULL,
    "data" JSON NOT NULL,

    PRIMARY KEY ("id")
);
