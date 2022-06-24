-- CreateTable
CREATE TABLE "users_on_break" (
    "user_id" VARCHAR NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_on_break_pkey" PRIMARY KEY ("user_id")
);
