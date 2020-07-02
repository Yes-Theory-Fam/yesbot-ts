import { Message, TextChannel } from "discord.js";
import {
  buddyProjectMatch,
  checkEntry,
  removeEntry,
  checkEntries,
  sendQuestions,
  getBuddyId,
} from "./BuddyProject";
import Tools from "../common/tools";

export default async function BuddyProjectManager(
  message: Message,
  action: string
) {
  switch (action) {
    case "match":
      const usersToMatch = message.mentions.users.array();
      if (usersToMatch.length === 2) {
        message.channel.send(
          `Force matching <@${usersToMatch[0]}> and <@${usersToMatch[1]}>`
        );
        message.channel.send(
          sendQuestions(usersToMatch[0], usersToMatch[1])
            ? `Sent messages.`
            : `Couldn't send messages.`
        );
        buddyProjectMatch(usersToMatch[0], usersToMatch[1], true).then(
          (result) => {
            message.channel.send(
              result ? `Successfully matched.` : `Error in setting match.`
            );
          }
        );
      }
      break;
    case "check":
      message.channel.send(await checkEntry(message.mentions.users.array()[0]));
      break;
    case "unmatch":
      const confirm = await message.reply(
        `Are you sure you would like to remove <@${
          message.mentions.users.array()[0]
        }>'s entry?`
      );
      Tools.addThumbs(confirm);
      const reaction = await Tools.getFirstReaction(confirm);
      if (reaction === "👍")
        message.channel.send(
          await removeEntry(message.mentions.users.array()[0])
        );
      break;
    case "clean":
      message.channel.send(await checkEntries());
      break;

    case "ghost":
      message.channel
        .send(
          `Do you think you've been ghosted?\nHave you gotten no reply from your Buddy? Have you tried contacting them multiple times? Have you been Buddies for longer than a week? If your answer to all those questions is yes, react to this message with :ghost: and I'll do my best to help you out!\nWhile I get back to you, try contacting your buddy again. Who knows, maybe you'll get an answer :zany_face:`
        )
        .then((sentMsg) => sentMsg.react("👻"));
      break;
    case "buddy":
      const buddy = await getBuddyId(message.author);
      if (buddy.entered && buddy.buddyId === undefined) {
        message.reply(
          "We're sorry but you have not yet received a buddy. Hold tight!"
        );
      } else if (buddy.buddyId) {
        message.reply(`Your buddy is <@${buddy.buddyId}>.`);
      } else {
        message.reply(
          "You haven't entered the Buddy Project yet! Go to <#701153345620148335> and react on the post to enter. :grin:"
        );
      }
      return;
    default:
      break;
  }
}
