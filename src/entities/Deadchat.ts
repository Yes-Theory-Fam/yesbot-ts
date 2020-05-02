import { Entity, PrimaryGeneratedColumn, Column, getConnection } from "typeorm";

@Entity()
export class DeadchatQuestion {
    @PrimaryGeneratedColumn()
    id: string;

    @Column()
    question: string;

    @Column({ default: false, name: "is_used" })
    isUsed: boolean;
}

export const DeadchatRepository = async () => {
    return getConnection().getRepository(DeadchatQuestion);
};
