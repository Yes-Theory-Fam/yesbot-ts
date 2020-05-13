import { Entity, PrimaryColumn, Column, getConnection } from "typeorm";

@Entity()
export class Family {
  @PrimaryColumn("text")
  userid: string;

  @Column("text", { nullable: true })
  partner: string;

  @Column("text", { nullable: true })
  child: string;

  @Column("text", { nullable: true })
  mom: string;

  @Column("text", { nullable: true })
  dad: string;

  @Column("timestamp with time zone", { nullable: true })
  marriageDate: Date;
}

export const FamilyRepository = async () => {
  return getConnection().getRepository(Family);
};
