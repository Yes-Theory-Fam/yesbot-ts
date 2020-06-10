import Discord, { TextChannel } from "discord.js";
import Tools from "../common/tools";

export default async function ChessManager(message: Discord.Message) {
  message.channel.send(
    `Adding ${message.member.toString()} to the current game queue...`
  );

  let queue = await Tools.resolveFile("chessQueue");
  queue.push(message.member.id);

  if (queue.length > 2) {
  }
}
