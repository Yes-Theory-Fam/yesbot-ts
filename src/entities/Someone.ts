import { BaseEntity, Entity, PrimaryColumn, Column } from "typeorm";

@Entity()
export class SomeoneUser extends BaseEntity {
  @PrimaryColumn()
  id: string;

  @Column("timestamp with time zone") // Adds TZ support in psql
  time: Date;
}
