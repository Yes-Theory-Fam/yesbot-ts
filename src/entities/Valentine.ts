import { BaseEntity, Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class Valentine extends BaseEntity {
  @PrimaryColumn()
  userId: string;

  @Column("timestamp without time zone", { nullable: true })
  start: Date;

  @Column("timestamp without time zone", { nullable: true })
  end: Date;
}
