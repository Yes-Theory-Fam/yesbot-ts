import { Entity, Index, PrimaryGeneratedColumn, Column, getConnection, ManyToOne } from "typeorm";
import { Message } from "./Message";

@Entity()
@Index(["emoji", "message"], { unique: true })
export class ChannelToggle {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("text")
    channel: string;

    @Column("text")
    emoji: string;

    @ManyToOne(type => Message)
    message: Message;
}

export const ChannelToggleRepository = async () => {
    return getConnection().getRepository(ChannelToggle);
};
