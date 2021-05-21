import { Guild, GuildMember, Message } from "discord.js";
import Tools from "../common/tools";

export default async function ExportManager(message: Message) {
  const words = Tools.stringToWords(message.content);
  const [command, toExportType, toExport] = words;

  if (!toExportType || !["role"].includes(toExportType)) {
    message.reply(
      `Incorrect syntax, please use the following: \`!export role\``
    );
    return;
  }

  const member = message.member;
  const moderator = !!member.roles.cache.some(
    (r) => r.name === process.env.MODERATOR_ROLE_NAME
  );

  switch (toExportType) {
    case "role":
      exportRole(toExport, message.guild, message);
      break;
  }
}

const exportRole = (toExport: string, guild: Guild, message: Message) => {
  // toExport = toExport.match()
  const foundRole = guild.roles.cache.find(
    (role) => role.name.toLowerCase() === toExport.toLowerCase()
  );
  if (!foundRole) {
    message.channel.send(
      `No roles found for "${toExport}". Export like !export role "study group french"`
    );
  }
  let output = `**Serialised members of ${foundRole.toString()}**\n\`\`\`json\n[`;
  foundRole.members.forEach((member: GuildMember) => {
    output += `"<@${member.id}>",\n`;
  });
  output += `]\`\`\``;
  message.channel.send(output);
};
