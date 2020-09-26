import {
  Message,
  MessageReaction,
  DMChannel,
  User,
  PartialUser,
} from "discord.js";
import { hasRole } from "../common/moderator";

export default async function PollsManager(pMessage: Message) {
  await pMessage.react("🇦");
  await pMessage.react("🅱️");
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
  const { count } = await reaction.fetch();
  if (count > 1) return;

  message.react(reaction.emoji);
  reaction.users.remove(user.id);
};
