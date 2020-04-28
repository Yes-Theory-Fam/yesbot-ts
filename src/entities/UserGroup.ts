import { Entity, PrimaryGeneratedColumn, PrimaryColumn, Column, getConnection, ManyToMany, JoinTable } from "typeorm";

// Pretty temporary solution; this should be a more generic User
// model which we can use for a lot more than just this.
@Entity()
export class GroupMember {
    @PrimaryColumn()
    id: string;
}

@Entity()
export class UserGroup {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("text")
    name: string;

    @Column("text")
    description: string;

    @ManyToMany(type => GroupMember)
    @JoinTable()
    members: GroupMember[];
}

export const UserGroupRepository = async () => {
    return getConnection().getRepository(UserGroup);
};

export const UserGroupMembershipRepository = async () => getConnection().getRepository(GroupMember);
