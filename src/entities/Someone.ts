import { Entity, PrimaryColumn, Column, getConnection } from "typeorm";

@Entity()
export class SomeoneUser {
    @PrimaryColumn()
    id: string;

    @Column("timestamp with time zone") // Adds TZ support in psql
    time: Date;
}

export const SomeoneRepository = async () => {
    return getConnection().getRepository(SomeoneUser);
};
