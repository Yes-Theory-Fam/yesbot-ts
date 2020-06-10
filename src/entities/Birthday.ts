import { Entity, PrimaryColumn, Column, getConnection } from "typeorm";

@Entity()
export class Birthday {
  @PrimaryColumn("text")
  userid: string;

  @Column("timestamp with time zone")
  birthdate: Date;
}

export const BirthdayRepository = async () =>
  getConnection().getRepository(Birthday);
