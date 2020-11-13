import { Entity, PrimaryGeneratedColumn, Column, getConnection } from "typeorm";

@Entity()
export class DailyChallenge {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  result: string;

  @Column({
    default: new Date(1970, 0, 1),
    name: "last_used",
  })
  lastUsed: Date;
}

export const DailyChallengeRepository = async () => {
  return getConnection().getRepository(DailyChallenge);
};
