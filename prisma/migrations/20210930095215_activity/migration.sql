-- CreateTable
CREATE TABLE "activity" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "counter" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "activity_pkey" PRIMARY KEY ("id")
);

-- RenameIndex
ALTER INDEX "IDX_886c4545692691c28e48cb964f" RENAME TO "channel_toggle_emoji_messageId_key";

-- RenameIndex
ALTER INDEX "IDX_9a7f4eb4ad5822073b7454344b" RENAME TO "reaction_role_message_id_channel_id_reaction_key";

-- RenameIndex
ALTER INDEX "release.release_time_index" RENAME TO "release_release_time_idx";

-- RenameIndex
ALTER INDEX "user_group.name_unique" RENAME TO "user_group_name_key";

-- RenameIndex
ALTER INDEX "IDX_VoiceOnDemandMapping_Unique_Channel" RENAME TO "voice_on_demand_mapping_channel_id_key";
