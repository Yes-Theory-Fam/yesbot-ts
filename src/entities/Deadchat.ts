import { Entity, PrimaryGeneratedColumn, Column, getConnection } from "typeorm";

@Entity()
export class DeadchatQuestion {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  question: string;

  @Column({ default: new Date(), name: "last_used" })
  lastUsed: Date;
}

export const DeadchatRepository = async () => {
  return getConnection().getRepository(DeadchatQuestion);
};
