import { BaseEntity, Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class DeadchatQuestion extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  question: string;

  @Column({ default: new Date(), name: "last_used" })
  lastUsed: Date;
}
