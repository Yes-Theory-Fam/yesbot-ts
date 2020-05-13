import { Entity, Column, getConnection, PrimaryColumn } from "typeorm";

@Entity()
export class BuddyProjectEntry {

    @PrimaryColumn("text")
    user_id: string;

    @Column("boolean")
    matched: boolean;

    @Column("boolean")
    discord_user: boolean;

    @Column({type:"text",nullable:true})
    buddy_id: boolean | null;

}

export const BuddyProjectEntryRepository = async () => {
    return getConnection().getRepository(BuddyProjectEntry);
};


