import { Entity, PrimaryColumn, getConnection, Column } from "typeorm";

@Entity()
export class VoiceOnDemandMapping {
  @PrimaryColumn({ name: "user_id" })
  userId: string;

  @Column({ name: "channel_id" })
  channelId: string;

  @Column()
  emoji: string;
}

export const VoiceOnDemandRepository = async () => {
  return getConnection().getRepository(VoiceOnDemandMapping);
};
