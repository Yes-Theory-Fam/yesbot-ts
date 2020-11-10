import {
  Message,
  MessageReaction,
  DMChannel,
  User,
  PartialUser,
} from "discord.js";
import { Logger } from "../common/Logger";
import { hasRole } from "../common/moderator";

export default async function PollsManager(pMessage: Message) {
  try {
    await pMessage.react("🇦");
    await pMessage.react("🅱️");
    if (pMessage.cleanContent.toLowerCase().includes("🇨")) {
      await pMessage.react("🇨");
    }
    if (pMessage.content.toLowerCase().includes("🇩")) {
      await pMessage.react("🇩");
    }
    if (pMessage.content.toLowerCase().includes("🇪")) {
      await pMessage.react("🇪");
    }
    if (pMessage.content.toLowerCase().includes("🇫")) {
      await pMessage.react("🇫");
    }
    if (pMessage.content.toLowerCase().includes("🇬")) {
      await pMessage.react("🇬");
    }
    if (pMessage.content.toLowerCase().includes("🇭")) {
      await pMessage.react("🇭");
    }
    if (pMessage.content.toLowerCase().includes("🇮")) {
      await pMessage.react("🇮");
    }
    if (pMessage.content.toLowerCase().includes("🇯")) {
      await pMessage.react("🇯");
    }
  } catch (err) {
    Logger(
      "PollsManager",
      "Default",
      "Error adding poll reaction: " + err.message
    );
  }
  return;
}

export const ModeratorPollMirror = async (
  reaction: MessageReaction,
  user: User | PartialUser
) => {
  const { message } = reaction;
  const { channel } = message;
  if (channel instanceof DMChannel || channel.name !== "polls") return;
  const member = channel.guild.member(user.id);

  if (!hasRole(member, "Support")) return;
  const fetched = await reaction.users.fetch();
  if (fetched.size > 1) return;

  message.react(reaction.emoji);
  reaction.users.remove(user.id);
};
