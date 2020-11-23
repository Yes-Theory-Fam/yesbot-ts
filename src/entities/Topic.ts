import { Entity, PrimaryGeneratedColumn, Column, getConnection } from "typeorm";

@Entity()
export class Topic {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  topic: string;

  @Column()
  channel: string;

  @Column({ default: new Date(), name: "created" })
  created: Date;
}

export const TopicRepo = async () => {
  return getConnection().getRepository(Topic);
};
