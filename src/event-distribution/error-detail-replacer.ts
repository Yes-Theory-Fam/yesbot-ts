import { Guild } from "discord.js";
import eventDistribution from "./index";

export class ErrorDetailReplacer {
  public static replaceErrorDetails(s: string, guild?: Guild | null): string {
    s = this.replaceChannels(s, guild);
    s = this.replaceSlashCommands(s);

    return s;
  }

  private static replaceChannels(s: string, guild?: Guild | null): string {
    if (!guild) return s;

    return s.replace(/#[a-zA-Z\d-]+/g, (match) => {
      const name = match.substring(1);
      const channelId = guild.channels.cache.find((c) => c.name === name)?.id;

      return channelId ? `<#${channelId}>` : match;
    });
  }

  private static replaceSlashCommands(s: string): string {
    return s.replace(/\|\/.*?\|/g, (match) => {
      const withoutMarkers = match.substring(1, match.length - 1);

      const baseCommand = withoutMarkers.split(" ")[0].substring(1);
      const commandId = eventDistribution.getIdForCommandName(baseCommand);

      return commandId ? `<${withoutMarkers}:${commandId}>` : withoutMarkers;
    });
  }
}
