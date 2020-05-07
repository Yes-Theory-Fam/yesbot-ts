import { Entity, PrimaryColumn, getConnection, Column } from "typeorm";

@Entity()
export class Message {
  @PrimaryColumn()
  id: string;

  @Column({
    type: "text",
    nullable: true,
  })
  channel: string | null;
}

export const MessageRepository = async () => {
  return getConnection().getRepository(Message);
};

export async function getOrCreateMessage(id: string) {
  // Make sure the record exists
  await getConnection()
    .createQueryBuilder()
    .insert()
    .into(Message)
    .values({ id, channel: null })
    .onConflict(`("id") DO NOTHING`)
    .execute();

  const messageRepository = await MessageRepository();
  return await messageRepository.findOne({
    where: {
      id,
    },
  });
}
