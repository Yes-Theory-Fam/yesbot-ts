import { Entity, PrimaryGeneratedColumn, Column, getConnection } from "typeorm";

@Entity()
export class TopicManagerEntity {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  topic: string;

  @Column()
  channel: string;

  @Column({ default: new Date(), name: "last_used" })
  lastUsed: Date;
}

export const TopicManagerRepo = async () => {
  return getConnection().getRepository(TopicManagerEntity);
};
