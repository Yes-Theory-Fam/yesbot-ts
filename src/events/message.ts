import { Message } from "discord.js";
import Tools from "../common/tools";
import { ErrorDetailReplacer } from "../event-distribution/error-detail-replacer";

const commandMap: Record<string, string> = {
  "!channelToggle": "channel-toggle",
  "!group": "group",
  "!message": "message",
  "!role": "role",
  "!yescoin-status": "yescoin status",
  "!translate": "translate",
  "!birthday": "birthday add",
  "!challenge": "challenge",
  "!deadchat": "deadchat",
  "!delete": "delete",
  "!map": "map view",
  "!mapadd": "map add",
  "!profile": "profile",
  "!resources": "resources",
  "!video": "video",
  "!voice": "voice",
  "@someone": "someone",
  "@group": "group ping",
};

const oldContextMenuCommands: string[] = ["!meta", "!addvote"];

export const legacyCommandHandler = async (message: Message) => {
  const firstWord = message.content.split(" ")[0].toLowerCase();

  if (oldContextMenuCommands.includes(firstWord)) {
    await Tools.handleUserError(message, "Hey there, it seems you have used one of the commands that have been converted to context menu commands. You can select the message now and go to Apps to make use of the command instead");
    return;
  }

  const newCommand = commandMap[firstWord];

  if (!newCommand) return;

  const commandReference = ErrorDetailReplacer.replaceErrorDetails(
    `|/${newCommand}|`,
    message.guild
  );

  await Tools.handleUserError(
    message,
    `Hey there, it seems you have used one of the commands that have been converted to slash commands. You can use the new command ${commandReference} instead`
  );
};
