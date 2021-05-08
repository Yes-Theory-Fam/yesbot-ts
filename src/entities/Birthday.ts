import { Entity, PrimaryColumn, Column, BaseEntity } from "typeorm";

@Entity()
export class Birthday extends BaseEntity {
  @PrimaryColumn("text")
  userid: string;

  @Column("timestamp with time zone")
  birthdate: Date;

  @Column("text", { nullable: true })
  timezone: string;
}
