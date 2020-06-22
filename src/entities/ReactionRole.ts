import {
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Column,
  getConnection,
} from "typeorm";

@Entity()
@Index(["messageId", "channelId", "reaction"], { unique: true })
export class ReactionRole {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ name: "message_id" })
  messageId: string;

  @Column({ name: "channel_id" })
  channelId: string;

  @Column()
  reaction: string;

  @Column({ name: "role_id" })
  roleId: string;
}

export const ReactionRoleRepository = async () => {
  return getConnection().getRepository(ReactionRole);
};
