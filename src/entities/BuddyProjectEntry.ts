import { Entity, Column, getConnection, PrimaryColumn } from "typeorm";

@Entity()
export class BuddyProjectEntry {
  @PrimaryColumn("text")
  user_id: string;

  @Column("boolean")
  matched: boolean;

  @Column("boolean")
  discord_user: boolean;

  @Column({ type: "text", nullable: true })
  buddy_id: string | null;

  // When this feature goes live it will need an
  // UPDATE buddy_project_entry SET matched_date = 'now'::timestamp - '7 days'::interval WHERE matched = true;
  // to enable it for all matched people (unless there is a way to actually figure out when people got matched and we can populate the database with that)
  @Column("timestamp with time zone", {
    nullable: true,
    default: null,
    name: "matched_date",
  })
  matchedDate: Date;

  @Column("timestamp with time zone", {
    nullable: true,
    default: null,
    name: "reported_ghost_date",
  })
  reportedGhostDate: Date;
}

export const BuddyProjectEntryRepository = async () => {
  return getConnection().getRepository(BuddyProjectEntry);
};
