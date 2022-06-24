/*
  Warnings:

  - A unique constraint covering the columns `[channel_id]` on the table `voice_on_demand_mapping` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "IDX_VoiceOnDemandMapping_Unique_Channel" ON "voice_on_demand_mapping"("channel_id");
