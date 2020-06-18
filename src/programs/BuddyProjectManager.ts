import { Message, User } from "discord.js";
import {
  forceMatch,
  checkEntry,
  removeEntry,
  cleanEntries,
  beginGame,
  checkAllEntries,
} from "./BuddyProject";

export default async function BuddyProjectManager(
  message: Message,
  action: string
) {
  switch (action) {
    case "match":
      const usersToMatch = message.mentions.users.array();
      if (usersToMatch.length === 2) {
        forceMatch(usersToMatch[0], usersToMatch[1], message.guild);
      }
      break;
    case "check":
      checkEntry(message.mentions.users.array()[0], message.guild);
      break;
    case "checkAll":
      checkAllEntries(message.guild);
      break;
    case "unmatch":
      const confirm = await message.reply(
        `Are you sure you would like to remove <@${
          message.mentions.users.array()[0]
        }>'s entry?`
      );
      confirm.react("👍").then((reaction) => confirm.react("👎"));
      confirm
        .awaitReactions(
          (reaction: any, user: User) => {
            return !user.bot;
          },
          { max: 1, time: 6000000, errors: ["time"] }
        )
        .then((collected) => {
          const reaction = collected.first();
          switch (reaction.emoji.toString()) {
            case "👍":
              removeEntry(message.mentions.users.array()[0], message.guild);
              break;

            default:
              break;
          }
        });
      break;
    case "clean":
      const [_, firstArg] = message.content.split(" ");
      const count = isNaN(Number(firstArg)) ? undefined : Number(firstArg);
      cleanEntries(message.guild, count);
      break;

    case "game":
      beginGame(message.guild);
    
    default:
      break;
  }
}
