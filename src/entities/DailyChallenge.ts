import { Entity, PrimaryGeneratedColumn, Column, getConnection } from "typeorm";

@Entity()
export class DailyChallenge {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  challenge: string;

  @Column({ default: new Date(), name: "last_used" })
  lastUsed: Date;
}

export const DeadchatRepository = async () => {
  return getConnection().getRepository(DailyChallenge);
};
