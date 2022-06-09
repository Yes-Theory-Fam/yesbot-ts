import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../event-distribution";
import { Message, TextChannel, User, Util } from "discord.js";
import { createOutput, closeTicket } from "./common";

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!ticket",
  subTrigger: "close",
  allowedRoles: ["Support"],
  description: "This handler is to close a ticket.",
})
class CloseTicket implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const channel = message.channel as TextChannel;
    const type = channel.name.split("-")[0];
    await this.createCloseMessage(channel, message.author, type);
  }

  async createCloseMessage(
    channel: TextChannel,
    member: User,
    TICKET_LOG_CHANNEL: string
  ) {
    const message = await channel.send(
      "This ticket is now closing, please react with ✅ to close this issue. If you would like to also receive logs of this conversation, please react with :bookmark_tabs:"
    );

    await message.react("📑");
    await message.react("✅");

    message
      .awaitReactions({
        filter: (reaction: any, user: User) => {
          return (
            ["✅", "📑"].includes(reaction.emoji.name) &&
            user.id != message.author.id
          );
        },
        max: 1,
        time: 60000,
        errors: ["time"],
      })
      .then((collected) => {
        const reaction = collected.first();
        const user = reaction?.users.cache.find((u) => !u.bot);
        if (reaction?.emoji.toString() === "📑") {
          user?.createDM().then(async (dm) => {
            const messages = Util.splitMessage(
              await createOutput(channel, member)
            );
            for (const message of messages) {
              await dm.send(message);
            }
          });
        }

        if (reaction?.message.channel.type !== "GUILD_TEXT" || !user) return;

        closeTicket(reaction.message.channel, user, TICKET_LOG_CHANNEL);
      });
  }
}
