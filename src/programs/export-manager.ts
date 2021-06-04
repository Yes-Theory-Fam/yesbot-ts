import { Guild, GuildMember, Message } from "discord.js";
import Tools from "../common/tools";

const exportManager = async (message: Message) => {
  const words = Tools.stringToWords(message.content);
  const [, toExportType, toExport] = words;

  if (!toExportType || !["role"].includes(toExportType)) {
    await message.reply(
      `Incorrect syntax, please use the following: \`!export role\``
    );
    return;
  }

  switch (toExportType) {
    case "role":
      await exportRole(toExport, message.guild, message);
      break;
  }
};

const exportRole = async (toExport: string, guild: Guild, message: Message) => {
  const foundRole = guild.roles.cache.find(
    (role) => role.name.toLowerCase() === toExport.toLowerCase()
  );
  if (!foundRole) {
    await message.channel.send(
      `No roles found for "${toExport}". Export like !export role "study group french"`
    );
  }
  let output = `**Serialised members of ${foundRole.toString()}**\n\`\`\`json\n[`;
  foundRole.members.forEach((member: GuildMember) => {
    output += `"<@${member.id}>",\n`;
  });
  output += `]\`\`\``;
  await message.channel.send(output);
};

export default exportManager;
