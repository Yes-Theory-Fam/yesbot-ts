import { Guild } from "discord.js";
import eventDistribution from "./index.js";

export class ErrorWithParams extends Error {
  constructor(
    message: string,
    public readonly params: Record<string, string | number> = {}
  ) {
    super(message);
  }
}

export class ErrorDetailReplacer {
  public static replaceErrorDetails(
    s: string,
    guild?: Guild | null,
    e?: Error
  ): string {
    s = this.replaceChannels(s, guild);
    s = this.replaceSlashCommands(s);

    if (e instanceof ErrorWithParams) {
      s = this.replaceParameters(s, e);
    }

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

  private static replaceParameters(s: string, e: ErrorWithParams): string {
    return s.replace(/\{.*?}/g, (match) => {
      const parameter = match.substring(1, match.length - 1);
      return e.params[parameter].toString();
    });
  }
}
